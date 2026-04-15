from collections import defaultdict, deque
from time import time

from fastapi import HTTPException, Request, status

_attempts: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
    if forwarded_for:
        return forwarded_for
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(
    request: Request,
    *,
    scope: str,
    limit: int,
    window_seconds: int,
    identifier: str | None = None,
):
    actor = identifier or _client_ip(request)
    bucket_key = f"{scope}:{actor}"
    now = time()
    window_start = now - window_seconds
    attempts = _attempts[bucket_key]

    while attempts and attempts[0] < window_start:
        attempts.popleft()

    if len(attempts) >= limit:
        retry_after = max(1, int(window_seconds - (now - attempts[0])))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    attempts.append(now)
