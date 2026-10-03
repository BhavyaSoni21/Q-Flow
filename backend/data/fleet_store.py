"""Legacy JSON fleet registry retained for migration compatibility.

The active API uses :mod:`data.fleet_db`, which owns SQLite storage and
availability history.
"""
import json
import os
import threading
import uuid
from datetime import datetime, timezone

STORE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "fleet"))
STORE_PATH = os.path.join(STORE_DIR, "vessels.json")
_LOCK = threading.Lock()


def _read():
    if not os.path.exists(STORE_PATH):
        return []
    try:
        with open(STORE_PATH, encoding="utf-8") as fh:
            rows = json.load(fh)
        return rows if isinstance(rows, list) else []
    except (OSError, ValueError):
        return []


def _write(rows):
    os.makedirs(STORE_DIR, exist_ok=True)
    tmp = f"{STORE_PATH}.{uuid.uuid4().hex}.tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(rows, fh, indent=2, sort_keys=True)
    os.replace(tmp, STORE_PATH)


def load_or_seed(seed_rows):
    with _LOCK:
        rows = _read()
        if not rows:
            rows = [dict(v) for v in seed_rows]
            _write(rows)
        return rows


def list_vessels():
    with _LOCK:
        return _read()


def get(vessel_id):
    return next((v for v in list_vessels() if v["vessel_id"] == vessel_id), None)


def save(vessel):
    row = dict(vessel)
    now = datetime.now(timezone.utc).isoformat()
    with _LOCK:
        rows = _read()
        existing = next((i for i, v in enumerate(rows) if v["vessel_id"] == row["vessel_id"]), None)
        row.setdefault("created_at", rows[existing].get("created_at", now) if existing is not None else now)
        row["updated_at"] = now
        if existing is None:
            rows.append(row)
        else:
            rows[existing] = row
        _write(rows)
    return row


def delete(vessel_id):
    with _LOCK:
        rows = _read()
        kept = [v for v in rows if v["vessel_id"] != vessel_id]
        if len(kept) == len(rows):
            return False
        _write(kept)
        return True
