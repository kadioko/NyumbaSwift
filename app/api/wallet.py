from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.wallet import TransactionStatus, TransactionType, Wallet, WalletTransaction
from app.schemas.wallet import (
    DepositConfirmRequest,
    DepositRequest,
    SendRequest,
    WalletDetailResponse,
    WalletTransactionResponse,
    WithdrawRequest,
)
from app.services import ntzs as ntzs_service
from app.services.ntzs import NTZSError

router = APIRouter(prefix="/wallet", tags=["wallet"])


def _get_or_create_wallet(user_id: int, db: Session) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance_tzs=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


def _serialize_txn(txn: WalletTransaction, **extra):
    data = WalletTransactionResponse.model_validate(txn).model_dump(mode="json")
    data.update(extra)
    return data


def _provider_status(value: str | None) -> str:
    return (value or "").strip().lower().replace("-", "_")


def _local_completed_balance(wallet_id: int, db: Session) -> int:
    completed = (
        db.query(WalletTransaction)
        .filter(
            WalletTransaction.wallet_id == wallet_id,
            WalletTransaction.status == TransactionStatus.COMPLETED,
        )
        .all()
    )
    balance = 0
    for txn in completed:
        if txn.type in {TransactionType.DEPOSIT, TransactionType.TRANSFER_IN}:
            balance += txn.amount
        elif txn.type in {TransactionType.WITHDRAWAL, TransactionType.TRANSFER_OUT}:
            balance -= txn.amount
    return balance


def _reconcile_completed_deposits(wallet: Wallet, live_balance_tzs: int, db: Session):
    accounted_balance = _local_completed_balance(wallet.id, db)
    missing_inflow = max(int(live_balance_tzs or 0) - accounted_balance, 0)
    if missing_inflow <= 0:
        return

    processing_deposits = (
        db.query(WalletTransaction)
        .filter(
            WalletTransaction.wallet_id == wallet.id,
            WalletTransaction.type == TransactionType.DEPOSIT,
            WalletTransaction.status.in_([TransactionStatus.PENDING, TransactionStatus.PROCESSING]),
        )
        .order_by(WalletTransaction.created_at.asc())
        .all()
    )
    changed = False
    for txn in processing_deposits:
        if txn.amount <= missing_inflow:
            txn.status = TransactionStatus.COMPLETED
            txn.completed_at = txn.completed_at or datetime.now(timezone.utc)
            missing_inflow -= txn.amount
            changed = True
        if missing_inflow <= 0:
            break

    if changed:
        db.commit()


async def _sync_wallet_balance(user: User, wallet: Wallet, db: Session):
    if not user.email:
        return wallet, None

    profile = await ntzs_service.get_ntzs_user(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
    )
    live_balance_tzs = int(profile.get("balanceTzs") or profile.get("balance") or 0)
    _reconcile_completed_deposits(wallet, live_balance_tzs, db)
    wallet.balance_tzs = live_balance_tzs
    wallet.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(wallet)
    return wallet, profile


async def _refresh_processing_transactions(user: User, wallet: Wallet, db: Session):
    pending = (
        db.query(WalletTransaction)
        .filter(
            WalletTransaction.wallet_id == wallet.id,
            WalletTransaction.status.in_([TransactionStatus.PENDING, TransactionStatus.PROCESSING]),
        )
        .order_by(WalletTransaction.created_at.desc())
        .limit(10)
        .all()
    )

    changed = False
    for txn in pending:
        if not txn.ntzs_reference:
            continue

        try:
            if txn.type == TransactionType.DEPOSIT:
                provider = await ntzs_service.get_payment_status(txn.ntzs_reference)
            elif txn.type == TransactionType.WITHDRAWAL:
                provider = await ntzs_service.get_withdrawal_status(txn.ntzs_reference)
            else:
                continue
        except NTZSError:
            continue

        status_value = _provider_status(provider.get("status"))
        if status_value in {"completed", "success", "successful", "paid", "burned"}:
            txn.status = TransactionStatus.COMPLETED
            txn.completed_at = txn.completed_at or datetime.now(timezone.utc)
            changed = True
        elif status_value in {"failed", "cancelled", "canceled", "declined", "expired"}:
            txn.status = TransactionStatus.FAILED
            changed = True
        else:
            txn.status = TransactionStatus.PROCESSING
            changed = True

    if changed:
        db.commit()


@router.get("/", response_model=WalletDetailResponse)
async def get_wallet(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = _get_or_create_wallet(current_user.id, db)
    await _refresh_processing_transactions(current_user, wallet, db)
    wallet, profile = await _sync_wallet_balance(current_user, wallet, db)
    recent = (
        db.query(WalletTransaction)
        .filter(WalletTransaction.wallet_id == wallet.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(10)
        .all()
    )
    return WalletDetailResponse(
        id=wallet.id,
        user_id=wallet.user_id,
        balance_tzs=wallet.balance_tzs,
        balance_usdc=profile.get("balanceUsdc") if profile else None,
        wallet_address=profile.get("walletAddress") if profile else None,
        updated_at=wallet.updated_at,
        recent_transactions=[WalletTransactionResponse.model_validate(t) for t in recent],
    )


@router.get("/transactions", response_model=list[WalletTransactionResponse])
async def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = _get_or_create_wallet(current_user.id, db)
    await _refresh_processing_transactions(current_user, wallet, db)
    txns = (
        db.query(WalletTransaction)
        .filter(WalletTransaction.wallet_id == wallet.id)
        .order_by(WalletTransaction.created_at.desc())
        .all()
    )
    return [WalletTransactionResponse.model_validate(t) for t in txns]


@router.post("/deposit", response_model=WalletTransactionResponse, status_code=status.HTTP_202_ACCEPTED)
async def initiate_deposit(
    body: DepositRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.email:
        raise HTTPException(status_code=400, detail="Please add your email in Profile before using the wallet")

    wallet = _get_or_create_wallet(current_user.id, db)
    txn = WalletTransaction(
        wallet_id=wallet.id,
        type=TransactionType.DEPOSIT,
        amount=body.amount,
        status=TransactionStatus.PENDING,
        payment_method=body.payment_method,
        description=f"Wallet deposit via {body.payment_method.replace('_', ' ')}",
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    try:
        if body.payment_method == "mobile_money":
            if not body.phone and not current_user.phone:
                raise HTTPException(status_code=422, detail="Phone number is required for mobile money deposit")
            result = await ntzs_service.create_wallet_deposit_mobile(
                user_id=current_user.id,
                amount=body.amount,
                phone=body.phone or current_user.phone,
                full_name=current_user.full_name,
                email=current_user.email,
            )
        else:
            if not body.redirect_url or not body.cancel_url:
                raise HTTPException(status_code=422, detail="Card deposits require redirect and cancel URLs")
            result = await ntzs_service.create_wallet_deposit_card(
                user_id=current_user.id,
                amount=body.amount,
                full_name=current_user.full_name,
                email=current_user.email,
                phone=current_user.phone,
                redirect_url=body.redirect_url,
                cancel_url=body.cancel_url,
            )

        txn.ntzs_reference = result.get("id") or result.get("reference")
        txn.status = TransactionStatus.PROCESSING
        db.commit()
        db.refresh(txn)

    except NTZSError as exc:
        txn.status = TransactionStatus.FAILED
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except HTTPException:
        txn.status = TransactionStatus.FAILED
        db.commit()
        raise

    return _serialize_txn(
        txn,
        payment_url=result.get("paymentUrl"),
        provider_message=result.get("instructions") or result.get("message"),
    )


@router.post("/deposit/{tx_id}/confirm", response_model=WalletTransactionResponse)
async def confirm_deposit(
    tx_id: int,
    body: DepositConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = _get_or_create_wallet(current_user.id, db)
    txn = db.query(WalletTransaction).filter(
        WalletTransaction.id == tx_id,
        WalletTransaction.wallet_id == wallet.id,
        WalletTransaction.type == TransactionType.DEPOSIT,
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status == TransactionStatus.COMPLETED:
        return WalletTransactionResponse.model_validate(txn)

    txn.ntzs_reference = body.ntzs_reference
    try:
        provider = await ntzs_service.get_payment_status(txn.ntzs_reference)
    except NTZSError as exc:
        await _sync_wallet_balance(current_user, wallet, db)
        db.refresh(txn)
        if txn.status == TransactionStatus.COMPLETED:
            return _serialize_txn(
                txn,
                provider_message="Deposit confirmed from live wallet balance.",
            )
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    status_value = _provider_status(provider.get("status"))
    if status_value in {"completed", "success", "successful", "paid"}:
        txn.status = TransactionStatus.COMPLETED
        txn.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(txn)
        await _sync_wallet_balance(current_user, wallet, db)
    elif status_value in {"failed", "cancelled", "canceled", "declined", "expired"}:
        txn.status = TransactionStatus.FAILED
        db.commit()
        db.refresh(txn)
    else:
        txn.status = TransactionStatus.PROCESSING
        db.commit()
        db.refresh(txn)

    return _serialize_txn(
        txn,
        provider_message=provider.get("instructions") or provider.get("message"),
    )


@router.post("/withdraw", response_model=WalletTransactionResponse, status_code=status.HTTP_202_ACCEPTED)
async def initiate_withdrawal(
    body: WithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.email:
        raise HTTPException(status_code=400, detail="Please add your email in Profile before withdrawing")

    wallet = _get_or_create_wallet(current_user.id, db)
    wallet, _ = await _sync_wallet_balance(current_user, wallet, db)
    if wallet.balance_tzs < body.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    txn = WalletTransaction(
        wallet_id=wallet.id,
        type=TransactionType.WITHDRAWAL,
        amount=body.amount,
        status=TransactionStatus.PENDING,
        payment_method="mobile_money",
        description="Wallet withdrawal to mobile money",
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    try:
        result = await ntzs_service.create_withdrawal(
            user_id=current_user.id,
            amount=body.amount,
            phone=body.phone,
            full_name=current_user.full_name,
            email=current_user.email,
        )
        txn.ntzs_reference = result.get("id") or result.get("reference")
        status_value = _provider_status(result.get("status"))
        if status_value in {"burned", "completed", "success", "successful"}:
            txn.status = TransactionStatus.COMPLETED
            txn.completed_at = datetime.now(timezone.utc)
        else:
            txn.status = TransactionStatus.PROCESSING
        db.commit()
        db.refresh(txn)
        await _sync_wallet_balance(current_user, wallet, db)

    except NTZSError as exc:
        txn.status = TransactionStatus.FAILED
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return _serialize_txn(
        txn,
        provider_message=result.get("message"),
    )


@router.post("/send", response_model=WalletTransactionResponse)
async def send_to_user(
    body: SendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.email:
        raise HTTPException(status_code=400, detail="Please add your email in Profile before sending money")
    if not body.recipient_phone:
        raise HTTPException(status_code=422, detail="Recipient phone is required")

    recipient = db.query(User).filter(User.phone == body.recipient_phone).first()
    if not recipient:
        normalized = ntzs_service._normalize_phone(body.recipient_phone)
        if normalized:
            recipient = db.query(User).filter(User.phone == normalized).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="No NyumbaSwift user found with that phone number")
    if not recipient.email:
        raise HTTPException(status_code=400, detail="The recipient must add an email before they can receive wallet transfers")
    if recipient.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot send money to yourself")

    sender_wallet = _get_or_create_wallet(current_user.id, db)
    recipient_wallet = _get_or_create_wallet(recipient.id, db)
    sender_wallet, _ = await _sync_wallet_balance(current_user, sender_wallet, db)
    if sender_wallet.balance_tzs < body.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    try:
        result = await ntzs_service.create_transfer(
            from_user_id=current_user.id,
            to_user_id=recipient.id,
            amount=body.amount,
            sender_email=current_user.email,
            sender_name=current_user.full_name,
            sender_phone=current_user.phone,
            recipient_email=recipient.email,
            recipient_name=recipient.full_name,
            recipient_phone=recipient.phone,
            metadata={"note": body.note} if body.note else None,
        )
    except NTZSError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    now = datetime.now(timezone.utc)
    note = body.note or f"Transfer to {recipient.full_name}"
    out_txn = WalletTransaction(
        wallet_id=sender_wallet.id,
        type=TransactionType.TRANSFER_OUT,
        amount=body.amount,
        status=TransactionStatus.COMPLETED,
        ntzs_reference=result.get("id"),
        peer_wallet_id=recipient_wallet.id,
        description=f"Sent to {recipient.full_name}: {note}",
        completed_at=now,
    )
    in_txn = WalletTransaction(
        wallet_id=recipient_wallet.id,
        type=TransactionType.TRANSFER_IN,
        amount=result.get("recipientAmountTzs") or body.amount,
        status=TransactionStatus.COMPLETED,
        ntzs_reference=result.get("id"),
        peer_wallet_id=sender_wallet.id,
        description=f"Received from {current_user.full_name}: {body.note or 'Wallet transfer'}",
        completed_at=now,
    )
    db.add(out_txn)
    db.add(in_txn)
    db.commit()
    db.refresh(out_txn)

    await _sync_wallet_balance(current_user, sender_wallet, db)
    await _sync_wallet_balance(recipient, recipient_wallet, db)

    return _serialize_txn(
        out_txn,
        provider_message=result.get("txHash"),
    )


@router.post("/webhooks/ntzs")
async def wallet_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    sig = request.headers.get("x-ntzs-signature")
    if not ntzs_service.verify_webhook_signature(body, sig):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event = await request.json()
    except Exception as exc:  # pragma: no cover - defensive parsing
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc

    data = event.get("data", {})
    event_type = event.get("type", "")
    ref = str(
        data.get("depositId")
        or data.get("withdrawalId")
        or data.get("transferId")
        or data.get("id")
        or ""
    )
    if not ref:
        return {"status": "ignored"}

    txn = db.query(WalletTransaction).filter(WalletTransaction.ntzs_reference == ref).first()
    if not txn:
        return {"status": "not_found"}

    wallet = db.query(Wallet).filter(Wallet.id == txn.wallet_id).first()
    user = db.query(User).filter(User.id == wallet.user_id).first() if wallet else None
    if event_type in {"deposit.completed", "withdrawal.completed"}:
        txn.status = TransactionStatus.COMPLETED
        txn.completed_at = txn.completed_at or datetime.now(timezone.utc)
        db.commit()
        if wallet and user:
            await _sync_wallet_balance(user, wallet, db)
    elif event_type in {"deposit.failed", "withdrawal.failed"}:
        txn.status = TransactionStatus.FAILED
        db.commit()
    else:
        txn.status = TransactionStatus.PROCESSING
        db.commit()

    return {"status": "ok"}
