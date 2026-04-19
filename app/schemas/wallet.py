from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator

from app.models.wallet import TransactionStatus, TransactionType


class WalletResponse(BaseModel):
    id: int
    user_id: int
    balance_tzs: int
    updated_at: datetime

    model_config = {"from_attributes": True}


class WalletTransactionResponse(BaseModel):
    id: int
    wallet_id: int
    type: TransactionType
    amount: int
    status: TransactionStatus
    ntzs_reference: str | None
    description: str | None
    payment_method: str | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WalletDetailResponse(BaseModel):
    id: int
    user_id: int
    balance_tzs: int
    updated_at: datetime
    recent_transactions: list[WalletTransactionResponse] = []

    model_config = {"from_attributes": True}


class DepositRequest(BaseModel):
    amount: int
    payment_method: Literal["mobile_money", "card"]
    # mobile money fields
    phone: str | None = None
    # card fields
    card_number: str | None = None
    card_expiry_month: str | None = None
    card_expiry_year: str | None = None
    card_cvv: str | None = None
    card_holder_name: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v < 1000:
            raise ValueError("Minimum deposit is TZS 1,000")
        if v > 10_000_000:
            raise ValueError("Maximum single deposit is TZS 10,000,000")
        return v


class WithdrawRequest(BaseModel):
    amount: int
    phone: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v < 1000:
            raise ValueError("Minimum withdrawal is TZS 1,000")
        return v


class SendRequest(BaseModel):
    recipient_phone: str
    amount: int
    note: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v < 100:
            raise ValueError("Minimum transfer is TZS 100")
        return v


class DepositConfirmRequest(BaseModel):
    ntzs_reference: str
