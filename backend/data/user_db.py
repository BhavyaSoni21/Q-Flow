"""SQLite store for user profiles, scenario history, and dashboard live metrics.

Works seamlessly both in local development and production environments (e.g. Render, Railway, Vercel).
Data directory configurable via QFLOW_DB_DIR environment variable.
"""
import json
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone

DB_BASE_DIR = os.environ.get("QFLOW_DB_DIR") or os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "results", "store")
)
DB_PATH = os.path.join(DB_BASE_DIR, "qflow_user.db")
_LOCK = threading.RLock()
SCHEMA_VERSION = 1


def _now():
    return datetime.now(timezone.utc).isoformat()


def _connect():
    os.makedirs(DB_BASE_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 10000")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS schema_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL DEFAULT 'viewer',
            company_name TEXT NOT NULL DEFAULT 'Oceanic Green Logistics India Pvt Ltd',
            imo_number TEXT NOT NULL DEFAULT 'IMO-9842103',
            fleet_size TEXT NOT NULL DEFAULT '18 Active Vessels (Panamax, Aframax, Capesize)',
            home_port TEXT NOT NULL DEFAULT 'Jawaharlal Nehru Port (JNPA / INNSA)',
            sustainability_target TEXT NOT NULL DEFAULT 'IMO 2030 Decarbonization Trajectory (Net-Zero by 2050)',
            contact_person TEXT NOT NULL DEFAULT 'Capt. Ashutosh Amale',
            phone TEXT NOT NULL DEFAULT '+91 98200 12345',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS scenarios (
            scenario_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            origin_port TEXT NOT NULL DEFAULT 'Mumbai',
            destination_port TEXT NOT NULL DEFAULT 'Rotterdam',
            vessel_class TEXT NOT NULL DEFAULT 'Panamax',
            fuel_type TEXT NOT NULL DEFAULT 'VLSFO + Methanol Blend',
            distance_nm REAL NOT NULL DEFAULT 6200.0,
            cargo_tonnes REAL NOT NULL DEFAULT 55000.0,
            baseline_fuel REAL NOT NULL DEFAULT 28.5,
            optimized_fuel REAL NOT NULL DEFAULT 24.1,
            cost_saved_inr REAL NOT NULL DEFAULT 184000.0,
            wtw_reduction_pct REAL NOT NULL DEFAULT 15.4,
            status TEXT NOT NULL DEFAULT 'Feasible',
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS feedback_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            voyage_id TEXT NOT NULL,
            vessel_name TEXT NOT NULL,
            predicted_fuel REAL NOT NULL,
            actual_fuel REAL NOT NULL,
            deviation_pct REAL NOT NULL,
            notes TEXT,
            recorded_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_scenarios_user_time ON scenarios(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback_logs(user_id);
    """)
    conn.execute(
        "INSERT OR REPLACE INTO schema_meta(key, value) VALUES ('schema_version', ?)",
        (str(SCHEMA_VERSION),)
    )
    return conn


def _seed_if_empty(conn):
    user_count = conn.execute("SELECT COUNT(*) FROM user_profiles").fetchone()[0]
    if user_count == 0:
        now = _now()
        conn.execute("""
            INSERT INTO user_profiles (
                user_id, full_name, email, role, company_name, imo_number,
                fleet_size, home_port, sustainability_target, contact_person,
                phone, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "user-1",
            "Capt. Ashutosh Amale",
            "fleet@qflow.app",
            "admin",
            "Oceanic Green Logistics India Pvt Ltd",
            "IMO-9842103",
            "18 Active Vessels (Panamax, Aframax, Capesize)",
            "Jawaharlal Nehru Port (JNPA / INNSA)",
            "IMO 2030 Decarbonization Trajectory (Net-Zero by 2050)",
            "Capt. Ashutosh Amale",
            "+91 98200 12345",
            now,
            now
        ))

    scenario_count = conn.execute("SELECT COUNT(*) FROM scenarios").fetchone()[0]
    if scenario_count == 0:
        now = _now()
        demo_scenarios = [
            {
                "scenario_id": "SCN-2026-084",
                "user_id": "user-1",
                "name": "Mumbai to Rotterdam Low Carbon Run",
                "origin_port": "Mumbai (INBOM)",
                "destination_port": "Rotterdam (NLRTM)",
                "vessel_class": "Panamax (75,000 DWT)",
                "fuel_type": "VLSFO + Methanol Blend",
                "distance_nm": 6250.0,
                "cargo_tonnes": 65000.0,
                "baseline_fuel": 28.5,
                "optimized_fuel": 24.1,
                "cost_saved_inr": 184000.0,
                "wtw_reduction_pct": 15.4,
                "status": "Feasible",
                "created_at": "2026-10-03T16:45:00Z",
                "updated_at": "2026-10-03T16:45:00Z",
                "payload": json.dumps({
                    "scenario_id": "SCN-2026-084",
                    "origin": "Mumbai (INBOM)",
                    "destination": "Rotterdam (NLRTM)",
                    "vessel": "Panamax (75,000 DWT)",
                    "speed_knots": 13.5,
                    "fuel": "VLSFO + Methanol Blend",
                    "objectives": ["fuel", "emissions"],
                    "weather_risk": "Moderate"
                })
            },
            {
                "scenario_id": "SCN-2026-079",
                "user_id": "user-1",
                "name": "Singapore to Chennai LNG Corridor",
                "origin_port": "Singapore (SGSIN)",
                "destination_port": "Chennai (INMAA)",
                "vessel_class": "Aframax (115,000 DWT)",
                "fuel_type": "LNG Dual-Fuel",
                "distance_nm": 1650.0,
                "cargo_tonnes": 95000.0,
                "baseline_fuel": 34.2,
                "optimized_fuel": 27.8,
                "cost_saved_inr": 245000.0,
                "wtw_reduction_pct": 18.7,
                "status": "Feasible",
                "created_at": "2026-10-02T11:20:00Z",
                "updated_at": "2026-10-02T11:20:00Z",
                "payload": json.dumps({
                    "scenario_id": "SCN-2026-079",
                    "origin": "Singapore (SGSIN)",
                    "destination": "Chennai (INMAA)",
                    "vessel": "Aframax (115,000 DWT)",
                    "speed_knots": 14.0,
                    "fuel": "LNG Dual-Fuel",
                    "objectives": ["cost", "cii_compliance"],
                    "weather_risk": "Low"
                })
            },
            {
                "scenario_id": "SCN-2026-061",
                "user_id": "user-1",
                "name": "Kandla to Fujairah Energy Saver",
                "origin_port": "Kandla (INIXY)",
                "destination_port": "Fujairah (AEFJR)",
                "vessel_class": "Capesize (180,000 DWT)",
                "fuel_type": "VLSFO + Shore Power (OPS)",
                "distance_nm": 1050.0,
                "cargo_tonnes": 160000.0,
                "baseline_fuel": 42.0,
                "optimized_fuel": 36.5,
                "cost_saved_inr": 312000.0,
                "wtw_reduction_pct": 13.1,
                "status": "Feasible",
                "created_at": "2026-09-28T09:10:00Z",
                "updated_at": "2026-09-28T09:10:00Z",
                "payload": json.dumps({
                    "scenario_id": "SCN-2026-061",
                    "origin": "Kandla (INIXY)",
                    "destination": "Fujairah (AEFJR)",
                    "vessel": "Capesize (180,000 DWT)",
                    "speed_knots": 12.8,
                    "fuel": "VLSFO + Shore Power (OPS)",
                    "objectives": ["fuel", "cost"],
                    "weather_risk": "Adverse Calm"
                })
            },
            {
                "scenario_id": "SCN-2026-055",
                "user_id": "user-1",
                "name": "Dubai to Mumbai High Efficiency",
                "origin_port": "Dubai (AEDXB)",
                "destination_port": "Mumbai (INBOM)",
                "vessel_class": "Handymax (45,000 DWT)",
                "fuel_type": "B30 Bio-diesel Blend",
                "distance_nm": 1100.0,
                "cargo_tonnes": 38000.0,
                "baseline_fuel": 21.0,
                "optimized_fuel": 17.6,
                "cost_saved_inr": 142000.0,
                "wtw_reduction_pct": 21.3,
                "status": "Feasible",
                "created_at": "2026-09-22T14:30:00Z",
                "updated_at": "2026-09-22T14:30:00Z",
                "payload": json.dumps({
                    "scenario_id": "SCN-2026-055",
                    "origin": "Dubai (AEDXB)",
                    "destination": "Mumbai (INBOM)",
                    "vessel": "Handymax (45,000 DWT)",
                    "speed_knots": 13.0,
                    "fuel": "B30 Bio-diesel Blend",
                    "objectives": ["emissions"],
                    "weather_risk": "Low"
                })
            }
        ]
        for sc in demo_scenarios:
            conn.execute("""
                INSERT INTO scenarios (
                    scenario_id, user_id, name, origin_port, destination_port,
                    vessel_class, fuel_type, distance_nm, cargo_tonnes,
                    baseline_fuel, optimized_fuel, cost_saved_inr, wtw_reduction_pct,
                    status, payload, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sc["scenario_id"], sc["user_id"], sc["name"], sc["origin_port"],
                sc["destination_port"], sc["vessel_class"], sc["fuel_type"],
                sc["distance_nm"], sc["cargo_tonnes"], sc["baseline_fuel"],
                sc["optimized_fuel"], sc["cost_saved_inr"], sc["wtw_reduction_pct"],
                sc["status"], sc["payload"], sc["created_at"], sc["updated_at"]
            ))


# ---------------------------------------------------------------------------
# Profile Operations
# ---------------------------------------------------------------------------

def get_user_profile(user_id="user-1"):
    with _LOCK:
        conn = _connect()
        try:
            _seed_if_empty(conn)
            row = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
            if not row:
                # Return default if not found
                row = conn.execute("SELECT * FROM user_profiles LIMIT 1").fetchone()
            return dict(row) if row else None
        finally:
            conn.close()


def update_user_profile(user_id, data):
    with _LOCK:
        conn = _connect()
        try:
            _seed_if_empty(conn)
            now = _now()
            existing = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
            if not existing:
                conn.execute("""
                    INSERT INTO user_profiles (
                        user_id, full_name, email, role, company_name, imo_number,
                        fleet_size, home_port, sustainability_target, contact_person,
                        phone, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id,
                    data.get("full_name", "Fleet Officer"),
                    data.get("email", "fleet@qflow.app"),
                    data.get("role", "admin"),
                    data.get("company_name", "Oceanic Green Logistics India Pvt Ltd"),
                    data.get("imo_number", "IMO-9842103"),
                    data.get("fleet_size", "18 Active Vessels"),
                    data.get("home_port", "Jawaharlal Nehru Port (JNPA / INNSA)"),
                    data.get("sustainability_target", "Net-Zero 2050"),
                    data.get("contact_person", data.get("full_name", "Capt. Ashutosh Amale")),
                    data.get("phone", "+91 98200 12345"),
                    now,
                    now
                ))
            else:
                conn.execute("""
                    UPDATE user_profiles SET
                        full_name = COALESCE(?, full_name),
                        email = COALESCE(?, email),
                        company_name = COALESCE(?, company_name),
                        imo_number = COALESCE(?, imo_number),
                        fleet_size = COALESCE(?, fleet_size),
                        home_port = COALESCE(?, home_port),
                        sustainability_target = COALESCE(?, sustainability_target),
                        contact_person = COALESCE(?, contact_person),
                        phone = COALESCE(?, phone),
                        updated_at = ?
                    WHERE user_id = ?
                """, (
                    data.get("full_name"),
                    data.get("email"),
                    data.get("company_name"),
                    data.get("imo_number"),
                    data.get("fleet_size"),
                    data.get("home_port"),
                    data.get("sustainability_target"),
                    data.get("contact_person"),
                    data.get("phone"),
                    now,
                    user_id
                ))
            row = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
            return dict(row)
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# Scenario Operations
# ---------------------------------------------------------------------------

def list_user_scenarios(user_id="user-1", limit=50):
    with _LOCK:
        conn = _connect()
        try:
            _seed_if_empty(conn)
            # If user has specific scenarios return them, otherwise return public/demo ones
            rows = conn.execute(
                "SELECT * FROM scenarios WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit)
            ).fetchall()
            if not rows:
                rows = conn.execute(
                    "SELECT * FROM scenarios ORDER BY created_at DESC LIMIT ?",
                    (limit,)
                ).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()


def save_user_scenario(scenario_data, user_id="user-1"):
    with _LOCK:
        conn = _connect()
        try:
            _seed_if_empty(conn)
            sid = scenario_data.get("scenario_id") or f"SCN-2026-{uuid.uuid4().hex[:4].upper()}"
            name = scenario_data.get("name") or scenario_data.get("scenario_name") or f"Voyage Optimization {sid}"
            origin = scenario_data.get("origin") or scenario_data.get("origin_port") or "Mumbai (INBOM)"
            dest = scenario_data.get("destination") or scenario_data.get("destination_port") or "Rotterdam (NLRTM)"
            vessel = scenario_data.get("vessel") or scenario_data.get("vessel_class") or "Panamax (75,000 DWT)"
            fuel = scenario_data.get("fuel") or scenario_data.get("fuel_type") or "VLSFO + Methanol Blend"
            
            baseline = float(scenario_data.get("baseline_fuel", 28.5))
            optimized = float(scenario_data.get("optimized_fuel", 24.1))
            cost_saved = float(scenario_data.get("cost_saved_inr", 184000.0))
            wtw_red = float(scenario_data.get("wtw_reduction_pct", 15.4))
            status = scenario_data.get("status", "Feasible")
            now = _now()
            
            payload_str = json.dumps(scenario_data) if isinstance(scenario_data, dict) else str(scenario_data)

            conn.execute("""
                INSERT OR REPLACE INTO scenarios (
                    scenario_id, user_id, name, origin_port, destination_port,
                    vessel_class, fuel_type, distance_nm, cargo_tonnes,
                    baseline_fuel, optimized_fuel, cost_saved_inr, wtw_reduction_pct,
                    status, payload, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sid,
                user_id,
                name,
                origin,
                dest,
                vessel,
                fuel,
                float(scenario_data.get("distance_nm", 6000.0)),
                float(scenario_data.get("cargo_tonnes", 50000.0)),
                baseline,
                optimized,
                cost_saved,
                wtw_red,
                status,
                payload_str,
                scenario_data.get("created_at", now),
                now
            ))
            row = conn.execute("SELECT * FROM scenarios WHERE scenario_id = ?", (sid,)).fetchone()
            return dict(row)
        finally:
            conn.close()


def delete_user_scenario(scenario_id, user_id=None):
    with _LOCK:
        conn = _connect()
        try:
            if user_id:
                cur = conn.execute("DELETE FROM scenarios WHERE scenario_id = ? AND user_id = ?", (scenario_id, user_id))
            else:
                cur = conn.execute("DELETE FROM scenarios WHERE scenario_id = ?", (scenario_id,))
            return cur.rowcount > 0
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# Feedback Operations
# ---------------------------------------------------------------------------

def record_feedback(user_id, data):
    with _LOCK:
        conn = _connect()
        try:
            pred = float(data.get("predicted_fuel", 0))
            act = float(data.get("actual_fuel", 0))
            dev = round(((act - pred) / pred * 100) if pred > 0 else 0.0, 2)
            now = _now()
            cur = conn.execute("""
                INSERT INTO feedback_logs (
                    user_id, voyage_id, vessel_name, predicted_fuel,
                    actual_fuel, deviation_pct, notes, recorded_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                data.get("voyage_id", "VOY-001"),
                data.get("vessel_name", "Fleet Vessel"),
                pred,
                act,
                dev,
                data.get("notes", ""),
                now
            ))
            return {
                "id": cur.lastrowid,
                "deviation_pct": dev,
                "recorded_at": now,
                "status": "calibrated"
            }
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# Dashboard Aggregated Summary
# ---------------------------------------------------------------------------

def get_dashboard_summary(user_id="user-1"):
    with _LOCK:
        conn = _connect()
        try:
            _seed_if_empty(conn)
            profile = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
            if not profile:
                profile = conn.execute("SELECT * FROM user_profiles LIMIT 1").fetchone()
            
            scenarios = conn.execute(
                "SELECT * FROM scenarios WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
                (user_id,)
            ).fetchall()
            if not scenarios:
                scenarios = conn.execute(
                    "SELECT * FROM scenarios ORDER BY created_at DESC LIMIT 20"
                ).fetchall()

            scenario_list = [dict(s) for s in scenarios]
            
            total_simulations = len(scenario_list)
            total_savings = sum(s.get("cost_saved_inr", 0) for s in scenario_list)
            avg_wtw = (
                round(sum(s.get("wtw_reduction_pct", 0) for s in scenario_list) / total_simulations, 1)
                if total_simulations > 0 else 16.2
            )
            feasible_rate = (
                round(sum(1 for s in scenario_list if s.get("status") == "Feasible") / total_simulations * 100, 1)
                if total_simulations > 0 else 100.0
            )

            # Format for frontend history table
            formatted_history = []
            for s in scenario_list:
                formatted_history.append({
                    "id": s["scenario_id"],
                    "date": s["created_at"].replace("T", " ")[:16] if s.get("created_at") else _now()[:16],
                    "route": f"{s['origin_port']} → {s['destination_port']}",
                    "vessel": s["vessel_class"],
                    "fuel": s["fuel_type"],
                    "baselineFuel": f"{s['baseline_fuel']:.1f} t/day",
                    "optimizedFuel": f"{s['optimized_fuel']:.1f} t/day",
                    "costSaved": f"₹ {int(s['cost_saved_inr']):,}",
                    "wtwReduction": f"-{s['wtw_reduction_pct']:.1f}%",
                    "status": s["status"],
                })

            return {
                "profile": dict(profile) if profile else {},
                "metrics": {
                    "total_simulations": total_simulations,
                    "total_cost_saved_inr": total_savings,
                    "formatted_total_savings": f"₹ {int(total_savings):,}",
                    "avg_wtw_reduction_pct": avg_wtw,
                    "feasible_rate_pct": feasible_rate,
                    "active_vessels": 18,
                    "avg_ci_score": "B (Satisfied)",
                },
                "history": formatted_history
            }
        finally:
            conn.close()
