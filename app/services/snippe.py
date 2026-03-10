import hashlib
import hmac
import json
import uuid

import httpx

from app.core.config import settings


class SnippeError(Exception):
    pass


def _split_name(full_name: str) -> tuple[str, str]:
    parts = (full_name or 'Customer').strip().split(maxsplit=1)
    first_name = parts[0] if parts else 'Customer'
    last_name = parts[1] if len(parts) > 1 else 'NyumbaSwift'
    return first_name, last_name


def _normalize_phone(phone: str) -> str:
    digits = ''.join(ch for ch in phone if ch.isdigit())
    if digits.startswith('255'):
        return f'+{digits}'
    if digits.startswith('0') and len(digits) >= 10:
        return f'+255{digits[1:]}'
    if phone.startswith('+'):
        return phone
    return f'+{digits}' if digits else phone


async def create_mobile_payment(*, amount: int, phone: str, full_name: str, email: str | None, reference: str, metadata: dict):
    if not settings.SNIPPE_API_KEY:
        raise SnippeError('Snippe API key is not configured')

    first_name, last_name = _split_name(full_name)
    payload = {
        'payment_type': 'mobile',
        'amount': {'value': amount, 'currency': 'TZS'},
        'customer': {
            'phone': _normalize_phone(phone),
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
        },
        'reference': reference,
        'metadata': metadata,
    }

    headers = {
        'Authorization': f'Bearer {settings.SNIPPE_API_KEY}',
        'Content-Type': 'application/json',
        'Idempotency-Key': str(uuid.uuid4()),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f'{settings.SNIPPE_BASE_URL}/v1/payments', json=payload, headers=headers)

    data = response.json()
    if response.is_success and data.get('status') == 'success':
        return data.get('data', {})

    message = data.get('message', 'Failed to create Snippe payment') if isinstance(data, dict) else 'Failed to create Snippe payment'
    raise SnippeError(message)


async def get_payment_status(reference: str):
    if not settings.SNIPPE_API_KEY:
        raise SnippeError('Snippe API key is not configured')

    headers = {'Authorization': f'Bearer {settings.SNIPPE_API_KEY}'}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f'{settings.SNIPPE_BASE_URL}/v1/payments/{reference}', headers=headers)

    data = response.json()
    if response.is_success and data.get('status') == 'success':
        return data.get('data', {})

    message = data.get('message', 'Failed to fetch Snippe payment status') if isinstance(data, dict) else 'Failed to fetch Snippe payment status'
    raise SnippeError(message)


def verify_webhook_signature(payload: bytes, signature: str | None) -> bool:
    if not settings.SNIPPE_WEBHOOK_SECRET:
        return False
    if not signature:
        return False
    expected = hmac.new(settings.SNIPPE_WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)


def dumps_payload(data: dict) -> str:
    return json.dumps(data, separators=(',', ':'), ensure_ascii=False)
