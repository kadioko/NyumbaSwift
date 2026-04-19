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


@router.get("/", response_model=WalletDetailResponse)
def get_wallet(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = _get_or_create_wallet(current_user.id, db)
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
        updated_at=wallet.updated_at,
        recent_transactions=[WalletTransactionResponse.model_validate(t) for t in recent],
    )


@router.get("/transactions", response_model=list[WalletTransactionResponse])
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = _get_or_create_wallet(current_user.id, db)
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
            # card
            missing = [f for f in ("card_number", "card_expiry_month", "card_expiry_year", "card_cvv", "card_holder_name") if not getattr(body, f)]
            if missing:
                raise HTTPException(status_code=422, detail=f"Missing card fields: {', '.join(missing)}")
            result = await ntzs_service.create_wallet_deposit_card(
                user_id=current_user.id,
                amount=body.amount,
                full_name=current_user.full_name,
                email=current_user.email,
                phone=current_user.phone,
                card_number=body.card_number,
                card_expiry_month=body.card_expiry_month,
                card_expiry_year=body.card_expiry_year,
                card_cvv=body.card_cvv,
                card_holder_name=body.card_holder_name,
            )

        txn.ntzs_reference = result.get("id") or result.get("reference")
        txn.status = TransactionStatus.PROCESSING
        db.commit()
        db.refresh(txn)

    except NTZSError as exc:
        txn.status = TransactionStatus.FAILED
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc))
    except HTTPException:
        txn.status = TransactionStatus.FAILED
        db.commit()
        raise

    return WalletTransactionResponse.model_validate(txn)


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
    txn.status = TransactionStatus.COMPLETED
    txn.completed_at = datetime.now(timezone.utc)
    wallet.balance_tzs += txn.amount
    wallet.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(txn)
    return WalletTransactionResponse.model_validate(txn)


@router.post("/withdraw", response_model=WalletTransactionResponse, status_code=status.HTTP_202_ACCEPTED)
async def initiate_withdrawal(
    body: WithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = _get_or_create_wallet(current_user.id, db)

    if wallet.balance_tzs < body.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    # Reserve funds immediately
    wallet.balance_tzs -= body.amount
    wallet.updated_at = datetime.now(timezone.utc)

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
        txn.status = TransactionStatus.PROCESSING
        db.commit()
        db.refresh(txn)

    except NTZSError as exc:
        # Refund reserved funds on failure
        wallet.balance_tzs += body.amount
        txn.status = TransactionStatus.FAILED
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc))

    return WalletTransactionResponse.model_validate(txn)


@router.post("/send", response_model=WalletTransactionResponse)
def send_to_user(
    body: SendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not body.recipient_phone:
        raise HTTPException(status_code=422, detail="Recipient phone is required")

    recipient = db.query(User).filter(User.phone == body.recipient_phone).first()
    if not recipient:
        # Try normalising the phone
        from app.services.ntzs import _normalize_phone
        normalized = _normalize_phone(body.recipient_phone)
        if normalized:
            recipient = db.query(User).filter(User.phone == normalized).first()
        if not recipient:
            raise HTTPException(status_code=404, detail="No NyumbaSwift user found with that phone number")

    if recipient.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot send money to yourself")

    sender_wallet = _get_or_create_wallet(current_user.id, db)
    if sender_wallet.balance_tzs < body.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    recipient_wallet = _get_or_create_wallet(recipient.id, db)

    now = datetime.now(timezone.utc)
    note = body.note or f"Transfer from {current_user.full_name}"

    # Debit sender
    sender_wallet.balance_tzs -= body.amount
    sender_wallet.updated_at = now
    out_txn = WalletTransaction(
        wallet_id=sender_wallet.id,
        type=TransactionType.TRANSFER_OUT,
        amount=body.amount,
        status=TransactionStatus.COMPLETED,
        peer_wallet_id=recipient_wallet.id,
        description=f"Sent to {recipient.full_name}: {note}",
        completed_at=now,
    )
    db.add(out_txn)

    # Credit recipient
    recipient_wallet.balance_tzs += body.amount
    recipient_wallet.updated_at = now
    in_txn = WalletTransaction(
        wallet_id=recipient_wallet.id,
        type=TransactionType.TRANSFER_IN,
        amount=body.amount,
        status=TransactionStatus.COMPLETED,
        peer_wallet_id=sender_wallet.id,
        description=f"Received from {current_user.full_name}: {note}",
        completed_at=now,
    )
    db.add(in_txn)

    db.commit()
    db.refresh(out_txn)
    return WalletTransactionResponse.model_validate(out_txn)


@router.post("/webhooks/ntzs")
async def wallet_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    sig = request.headers.get("X-NTZS-Signature")
    if not ntzs_service.verify_webhook_signature(body, sig):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("type", "")
    ntzs_ref = event.get("data", {}).get("id") or event.get("data", {}).get("reference")
    if not ntzs_ref:
        return {"status": "ignored"}

    txn = db.query(WalletTransaction).filter(WalletTransaction.ntzs_reference == ntzs_ref).first()
    if not txn:
        return {"status": "not_found"}

    wallet = db.query(Wallet).filter(Wallet.id == txn.wallet_id).first()
    now = datetime.now(timezone.utc)

    if event_type in ("deposit.completed", "withdrawal.completed"):
        if txn.status != TransactionStatus.COMPLETED:
            txn.status = TransactionStatus.COMPLETED
            txn.completed_at = now
            if txn.type == TransactionType.DEPOSIT:
                wallet.balance_tzs += txn.amount
                wallet.updated_at = now
            # Withdrawal funds were already reserved; mark done
            db.commit()

    elif event_type in ("deposit.failed", "withdrawal.failed"):
        if txn.status not in (TransactionStatus.COMPLETED, TransactionStatus.FAILED):
            txn.status = TransactionStatus.FAILED
            if txn.type == TransactionType.WITHDRAWAL:
                # Refund reserved funds
                wallet.balance_tzs += txn.amount
                wallet.updated_at = now
            db.commit()

    else:
        txn.status = TransactionStatus.PROCESSING
        db.commit()

    return {"status": "ok"}
