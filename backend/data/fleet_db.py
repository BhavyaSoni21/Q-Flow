"""SQLite fleet registry with availability history and JSON migration."""
import json
import os
import sqlite3
import threading
from datetime import datetime, timezone

STORE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "fleet"))
STORE_PATH = os.path.join(STORE_DIR, "fleet.db")
LEGACY_PATH = os.path.join(STORE_DIR, "vessels.json")
_LOCK = threading.RLock()

def _now(): return datetime.now(timezone.utc).isoformat()

def _connect():
    os.makedirs(STORE_DIR, exist_ok=True)
    conn = sqlite3.connect(STORE_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript("CREATE TABLE IF NOT EXISTS vessels (vessel_id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS availability_history (id INTEGER PRIMARY KEY AUTOINCREMENT, vessel_id TEXT NOT NULL REFERENCES vessels(vessel_id) ON DELETE CASCADE, availability INTEGER NOT NULL, reason TEXT NOT NULL DEFAULT '', recorded_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_availability_vessel_time ON availability_history(vessel_id, recorded_at);")
    return conn

def _insert(conn, vessel, history=False):
    row = dict(vessel); now = row.get("updated_at") or _now(); row.setdefault("created_at", now); row["updated_at"] = now
    conn.execute("INSERT OR REPLACE INTO vessels VALUES (?, ?, ?, ?)", (row["vessel_id"], json.dumps(row, sort_keys=True), row["created_at"], row["updated_at"]))
    if history: conn.execute("INSERT INTO availability_history(vessel_id, availability, reason, recorded_at) VALUES (?, ?, ?, ?)", (row["vessel_id"], int(bool(row.get("availability", 0))), "initial_registry", row["updated_at"]))
    return row

def load_or_seed(seed_rows):
    with _LOCK:
        conn = _connect()
        try:
            if not conn.execute("SELECT 1 FROM vessels LIMIT 1").fetchone():
                rows = []
                if os.path.exists(LEGACY_PATH):
                    try:
                        with open(LEGACY_PATH, encoding="utf-8") as fh: rows = json.load(fh)
                    except (OSError, ValueError): pass
                for row in (rows if isinstance(rows, list) and rows else seed_rows): _insert(conn, row, True)
                conn.commit()
            return list_vessels(conn)
        finally: conn.close()

def list_vessels(conn=None):
    own = conn is None
    if own: conn = _connect()
    try: return [json.loads(row["payload"]) for row in conn.execute("SELECT payload FROM vessels ORDER BY vessel_id")]
    finally:
        if own: conn.close()

def get(vessel_id):
    with _LOCK:
        conn = _connect()
        try:
            row = conn.execute("SELECT payload FROM vessels WHERE vessel_id = ?", (vessel_id,)).fetchone()
            return json.loads(row["payload"]) if row else None
        finally: conn.close()

def save(vessel):
    with _LOCK:
        conn = _connect()
        try:
            oldrow = conn.execute("SELECT payload FROM vessels WHERE vessel_id = ?", (vessel["vessel_id"],)).fetchone()
            old = json.loads(oldrow["payload"]) if oldrow else None
            row = dict(vessel); row["created_at"] = old.get("created_at", _now()) if old else row.get("created_at", _now()); row["updated_at"] = _now(); _insert(conn, row)
            if old is None or bool(old.get("availability")) != bool(row.get("availability")):
                conn.execute("INSERT INTO availability_history(vessel_id, availability, reason, recorded_at) VALUES (?, ?, ?, ?)", (row["vessel_id"], int(bool(row.get("availability", 0))), "registry_update", row["updated_at"]))
            conn.commit(); return row
        finally: conn.close()

def set_availability(vessel_id, availability, reason=""):
    vessel = get(vessel_id)
    if vessel is None: return None
    vessel["availability"] = int(bool(availability)); row = save(vessel)
    with _LOCK:
        conn = _connect()
        try:
            conn.execute("INSERT INTO availability_history(vessel_id, availability, reason, recorded_at) VALUES (?, ?, ?, ?)", (vessel_id, row["availability"], reason, row["updated_at"])); conn.commit()
        finally: conn.close()
    return row

def availability_history(vessel_id, limit=100):
    with _LOCK:
        conn = _connect()
        try: return [dict(row) for row in conn.execute("SELECT availability, reason, recorded_at FROM availability_history WHERE vessel_id = ? ORDER BY id DESC LIMIT ?", (vessel_id, max(1, min(int(limit), 500))))]
        finally: conn.close()

def delete(vessel_id):
    with _LOCK:
        conn = _connect()
        try: cur = conn.execute("DELETE FROM vessels WHERE vessel_id = ?", (vessel_id,)); conn.commit(); return cur.rowcount > 0
        finally: conn.close()
