"""Operational middleware: request IDs, redacted structured logs, headers, and rate limits."""
import logging
import os
import threading
import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

log = logging.getLogger("qflow.api")


class OperationalMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.limit = max(0, int(os.environ.get("QFLOW_RATE_LIMIT_PER_MINUTE", "120")))
        self._hits = defaultdict(deque)
        self._lock = threading.Lock()

    async def dispatch(self, request: Request, call_next):
        started = time.perf_counter()
        client = request.client.host if request.client else "unknown"
        path = request.url.path
        now = time.monotonic()
        limited = self.limit > 0 and path not in {"/api/health", "/api/auth/session"}
        if limited:
            with self._lock:
                hits = self._hits[client]
                while hits and now - hits[0] >= 60:
                    hits.popleft()
                if len(hits) >= self.limit:
                    return JSONResponse({"detail": "rate limit exceeded", "request_id": request.headers.get("X-Request-ID")}, status_code=429, headers={"Retry-After": "60"})
                hits.append(now)
        request_id = request.headers.get("X-Request-ID") or f"qf-{int(time.time() * 1000):x}"
        try:
            response = await call_next(request)
        except Exception:
            log.exception("request_failed request_id=%s method=%s path=%s", request_id, request.method, path)
            raise
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        log.info("request_complete request_id=%s method=%s path=%s status=%s duration_ms=%.2f", request_id, request.method, path, response.status_code, (time.perf_counter() - started) * 1000)
        return response
