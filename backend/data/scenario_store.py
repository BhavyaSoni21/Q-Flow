"""Small file-backed scenario store for the prototype.

This is intentionally a storage boundary rather than a database abstraction.
It makes scenario IDs and versions survive API restarts while leaving room for
the later authenticated/database-backed fleet service.
"""
import json
import os
import threading
import uuid
from datetime import datetime, timezone

STORE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "scenarios"))
STORE_PATH = os.path.join(STORE_DIR, "scenarios.json")
_LOCK = threading.Lock()


def _read():
    if not os.path.exists(STORE_PATH):
        return {}
    try:
        with open(STORE_PATH, encoding="utf-8") as fh:
            payload = json.load(fh)
        return payload if isinstance(payload, dict) else {}
    except (OSError, ValueError):
        return {}


def _write(rows):
    os.makedirs(STORE_DIR, exist_ok=True)
    tmp = f"{STORE_PATH}.{uuid.uuid4().hex}.tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(rows, fh, indent=2, sort_keys=True)
    os.replace(tmp, STORE_PATH)


def save(scenario):
    """Create or replace a versioned scenario and return its stored payload."""
    row = dict(scenario)
    now = datetime.now(timezone.utc).isoformat()
    with _LOCK:
        rows = _read()
        sid = row.get("scenario_id") or f"SCN-{uuid.uuid4().hex[:8].upper()}"
        previous = rows.get(sid)
        row["scenario_id"] = sid
        row["schema_version"] = int(row.get("schema_version", 1))
        row["revision"] = int(previous.get("revision", 0) if previous else 0) + 1
        row.setdefault("created_at", previous.get("created_at", now) if previous else now)
        row["updated_at"] = now
        rows[sid] = row
        _write(rows)
    return row


def get(scenario_id):
    with _LOCK:
        return _read().get(scenario_id)


def list_scenarios():
    with _LOCK:
        return list(_read().values())
