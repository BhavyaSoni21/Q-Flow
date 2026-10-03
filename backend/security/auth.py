"""Optional bearer-token role enforcement; unset tokens keep local demo mode open."""
import os
import base64
import hashlib
import hmac
import json
from fastapi import Depends, HTTPException, Request

_RANK = {"viewer": 1, "operator": 2, "admin": 3}
SESSION_COOKIE = "qflow_session"

def session_user(request):
    secret = os.environ.get("QFLOW_SESSION_SECRET")
    value = request.cookies.get(SESSION_COOKIE)
    if not secret or not value or "." not in value:
        return None
    encoded, signature = value.rsplit(".", 1)
    expected = hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None
    try:
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        return payload if payload.get("role") in _RANK else None
    except (ValueError, TypeError, json.JSONDecodeError):
        return None

def require_role(required="viewer"):
    def dependency(request: Request):
        tokens = {role: os.environ.get(f"QFLOW_{role.upper()}_TOKEN") for role in _RANK}
        if not any(tokens.values()): return "local_development"
        header = request.headers.get("Authorization", "")
        token = header[7:].strip() if header.lower().startswith("bearer ") else ""
        role = next((r for r, value in tokens.items() if value and value == token), None)
        session = session_user(request)
        if role is None and session:
            role = session.get("role")
        if role is None or _RANK[role] < _RANK[required]: raise HTTPException(status_code=401, detail="A valid Q-Flow bearer token is required")
        return role
    return Depends(dependency)
