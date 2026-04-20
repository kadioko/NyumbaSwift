from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.rental import ListingUnlock, PaymentStatus, RentPayment
from app.models.user import User
from app.models.wallet import TransactionStatus, TransactionType, Wallet, WalletTransaction
from app.services import ntzs as ntzs_service

router = APIRouter(prefix="/ntzs", tags=["nTZS Webhooks"])


async def _sync_wallet_balance(user: User, wallet: Wallet, db: Session):
    if not user.email:
        return

    profile = await ntzs_service.get_ntzs_user(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
    )
    wallet.balance_tzs = int(profile.get("balanceTzs") or profile.get("balance") or 0)
    wallet.updated_at = datetime.now(timezone.utc)
    db.commit()


@router.post("/webhooks", include_in_schema=False)
async def ntzs_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("x-ntzs-signature")
    if not ntzs_service.verify_webhook_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

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
    if txn:
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
        elif event_type == "transfer.completed":
            txn.status = TransactionStatus.COMPLETED
            txn.completed_at = txn.completed_at or datetime.now(timezone.utc)
            db.commit()
        else:
            txn.status = TransactionStatus.PROCESSING
            db.commit()
        return {"status": "ok"}

    payment = db.query(RentPayment).filter(RentPayment.mpesa_reference == ref).first()
    if payment:
        if event_type == "deposit.completed":
            payment.status = PaymentStatus.COMPLETED
            payment.mpesa_reference = ref
            payment.paid_at = datetime.now(timezone.utc)
            payment.notes = None
        elif event_type == "deposit.failed":
            payment.status = PaymentStatus.FAILED
            payment.mpesa_reference = ref
            payment.notes = "Provider status: failed"
        else:
            payment.status = PaymentStatus.PROCESSING
            payment.mpesa_reference = ref
            payment.notes = "Provider status: processing"
        db.commit()
        return {"status": "ok"}

    unlock = db.query(ListingUnlock).filter(ListingUnlock.mpesa_reference == f"pending:{ref}").first()
    if unlock:
        if event_type == "deposit.completed":
            unlock.mpesa_reference = ref
        elif event_type == "deposit.failed":
            unlock.mpesa_reference = f"failed:{ref}"
        db.commit()
        return {"status": "ok"}

    return {"status": "not_found"}
