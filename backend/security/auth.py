"""Optional bearer-token role enforcement; unset tokens keep local demo mode open."""
import os
from fastapi import Depends, HTTPException, Request

_RANK = {"viewer": 1, "operator": 2, "admin": 3}

def require_role(required="viewer"):
    def dependency(request: Request):
        tokens = {role: os.environ.get(f"QFLOW_{role.upper()}_TOKEN") for role in _RANK}
        if not any(tokens.values()): return "local_development"
        header = request.headers.get("Authorization", "")
        token = header[7:].strip() if header.lower().startswith("bearer ") else ""
        role = next((r for r, value in tokens.items() if value and value == token), None)
        if role is None or _RANK[role] < _RANK[required]: raise HTTPException(status_code=401, detail="A valid Q-Flow bearer token is required")
        return role
    return Depends(dependency)
