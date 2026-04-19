import hashlib
import hmac
import json
import uuid

import httpx

from app.core.config import settings


class NTZSError(Exception):
    pass


def _normalize_phone(phone: str | None) -> str | None:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if not digits:
        return None
    if digits.startswith("255"):
        return digits
    if digits.startswith("0") and len(digits) >= 10:
        return f"255{digits[1:]}"
    return digits


def _error_message(data: object, fallback: str) -> str:
    if isinstance(data, dict):
        message = data.get("message")
        error = data.get("error")
        if message and error:
            return f"{message} ({error})"
        if message:
            return str(message)
        if error:
            return str(error)
    return fallback


def _parse_json(response: httpx.Response) -> dict:
    try:
        data = response.json()
    except json.JSONDecodeError as exc:
        raise NTZSError(f"nTZS returned an invalid response ({response.status_code})") from exc
    if not isinstance(data, dict):
        raise NTZSError(f"nTZS returned an unexpected response ({response.status_code})")
    return data


async def ensure_ntzs_user(*, external_id: str, email: str, full_name: str, phone: str | None):
    if not settings.NTZS_API_KEY:
        raise NTZSError("nTZS API key is not configured")

    payload = {
        "externalId": external_id,
        "email": email,
    }
    if full_name:
        payload["name"] = full_name
    normalized_phone = _normalize_phone(phone)
    if normalized_phone:
        payload["phone"] = normalized_phone

    headers = {
        "Authorization": f"Bearer {settings.NTZS_API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": f"user-{external_id}",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{settings.NTZS_BASE_URL}/api/v1/users", json=payload, headers=headers)

    data = _parse_json(response)
    if response.is_success and data.get("id"):
        return data

    raise NTZSError(_error_message(data, "Failed to provision nTZS user"))


async def create_mobile_payment(*, amount: int, phone: str, full_name: str, email: str | None, reference: str, metadata: dict):
    if not settings.NTZS_API_KEY:
        raise NTZSError("nTZS API key is not configured")
    if not email:
        raise NTZSError("Email is required before creating an nTZS payment")

    user = await ensure_ntzs_user(
        external_id=str(metadata.get("tenant_id") or metadata.get("renter_id") or reference),
        email=email,
        full_name=full_name,
        phone=phone,
    )
    normalized_phone = _normalize_phone(phone)
    if not normalized_phone:
        raise NTZSError("A valid Tanzanian phone number is required")

    payload = {
        "userId": user["id"],
        "amountTzs": amount,
        "paymentMethod": "mobile_money",
        "phoneNumber": normalized_phone,
        "collectToTreasury": True,
    }

    headers = {
        "Authorization": f"Bearer {settings.NTZS_API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": str(uuid.uuid4()),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{settings.NTZS_BASE_URL}/api/v1/deposits", json=payload, headers=headers)

    data = _parse_json(response)
    if response.is_success and data.get("id"):
        data.setdefault("reference", reference)
        data.setdefault("external_reference", reference.upper())
        data["ntzs_user_id"] = user["id"]
        return data

    raise NTZSError(_error_message(data, "Failed to create nTZS deposit"))


async def create_wallet_deposit_mobile(
    *,
    user_id: int,
    amount: int,
    phone: str,
    full_name: str,
    email: str | None,
):
    """Initiate a wallet top-up via mobile money."""
    if not settings.NTZS_API_KEY:
        raise NTZSError("nTZS API key is not configured")
    if not email:
        raise NTZSError("Email is required to make a deposit")

    ntzs_user = await ensure_ntzs_user(
        external_id=str(user_id),
        email=email,
        full_name=full_name,
        phone=phone,
    )
    normalized_phone = _normalize_phone(phone)
    if not normalized_phone:
        raise NTZSError("A valid Tanzanian phone number is required")

    payload = {
        "userId": ntzs_user["id"],
        "amountTzs": amount,
        "paymentMethod": "mobile_money",
        "phoneNumber": normalized_phone,
        "collectToTreasury": True,
    }

    headers = {
        "Authorization": f"Bearer {settings.NTZS_API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": str(uuid.uuid4()),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{settings.NTZS_BASE_URL}/api/v1/deposits", json=payload, headers=headers)

    data = _parse_json(response)
    if response.is_success and data.get("id"):
        data["ntzs_user_id"] = ntzs_user["id"]
        return data

    raise NTZSError(_error_message(data, "Failed to initiate mobile money deposit"))


async def create_wallet_deposit_card(
    *,
    user_id: int,
    amount: int,
    full_name: str,
    email: str | None,
    phone: str | None,
    card_number: str,
    card_expiry_month: str,
    card_expiry_year: str,
    card_cvv: str,
    card_holder_name: str,
):
    """Initiate a wallet top-up via card payment."""
    if not settings.NTZS_API_KEY:
        raise NTZSError("nTZS API key is not configured")
    if not email:
        raise NTZSError("Email is required to make a deposit")

    ntzs_user = await ensure_ntzs_user(
        external_id=str(user_id),
        email=email,
        full_name=full_name,
        phone=phone,
    )

    payload = {
        "userId": ntzs_user["id"],
        "amountTzs": amount,
        "paymentMethod": "card",
        "card": {
            "number": card_number.replace(" ", ""),
            "expiryMonth": card_expiry_month,
            "expiryYear": card_expiry_year,
            "cvv": card_cvv,
            "holderName": card_holder_name,
        },
        "collectToTreasury": True,
    }

    headers = {
        "Authorization": f"Bearer {settings.NTZS_API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": str(uuid.uuid4()),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{settings.NTZS_BASE_URL}/api/v1/deposits", json=payload, headers=headers)

    data = _parse_json(response)
    if response.is_success and data.get("id"):
        data["ntzs_user_id"] = ntzs_user["id"]
        return data

    raise NTZSError(_error_message(data, "Failed to initiate card deposit"))


async def create_withdrawal(
    *,
    user_id: int,
    amount: int,
    phone: str,
    full_name: str,
    email: str | None,
    description: str = "NyumbaSwift wallet withdrawal",
):
    """Initiate a wallet withdrawal to mobile money."""
    if not settings.NTZS_API_KEY:
        raise NTZSError("nTZS API key is not configured")
    if not email:
        raise NTZSError("Email is required to make a withdrawal")

    ntzs_user = await ensure_ntzs_user(
        external_id=str(user_id),
        email=email,
        full_name=full_name,
        phone=phone,
    )
    normalized_phone = _normalize_phone(phone)
    if not normalized_phone:
        raise NTZSError("A valid Tanzanian phone number is required")

    payload = {
        "userId": ntzs_user["id"],
        "amountTzs": amount,
        "phoneNumber": normalized_phone,
        "description": description,
    }

    headers = {
        "Authorization": f"Bearer {settings.NTZS_API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": str(uuid.uuid4()),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{settings.NTZS_BASE_URL}/api/v1/withdrawals", json=payload, headers=headers)

    data = _parse_json(response)
    if response.is_success and data.get("id"):
        data["ntzs_user_id"] = ntzs_user["id"]
        return data

    raise NTZSError(_error_message(data, "Failed to initiate withdrawal"))


async def get_payment_status(reference: str):
    if not settings.NTZS_API_KEY:
        raise NTZSError("nTZS API key is not configured")

    headers = {"Authorization": f"Bearer {settings.NTZS_API_KEY}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{settings.NTZS_BASE_URL}/api/v1/deposits/{reference}", headers=headers)

    data = _parse_json(response)
    if response.is_success and data.get("id"):
        return data

    raise NTZSError(
        _error_message(
            data,
            "nTZS did not return a deposit status. Wait for webhook confirmation or retry shortly.",
        )
    )


async def get_withdrawal_status(reference: str):
    if not settings.NTZS_API_KEY:
        raise NTZSError("nTZS API key is not configured")

    headers = {"Authorization": f"Bearer {settings.NTZS_API_KEY}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{settings.NTZS_BASE_URL}/api/v1/withdrawals/{reference}", headers=headers)

    data = _parse_json(response)
    if response.is_success and data.get("id"):
        return data

    raise NTZSError(_error_message(data, "nTZS did not return a withdrawal status."))


def verify_webhook_signature(payload: bytes, signature: str | None) -> bool:
    if not settings.NTZS_WEBHOOK_SECRET:
        return False
    if not signature:
        return False
    expected = hmac.new(settings.NTZS_WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)
