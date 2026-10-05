"""Live AIS vessel position and telemetry layer.

Sources (priority order):
  1. AISStream.io WebSocket (free tier, needs AISSTREAM_API_KEY env var)
  2. MarineTraffic REST API (MARINE_TRAFFIC_API_KEY env var)
  3. OpenSeaMap / VesselFinder public endpoints (no key, limited)
  4. Last-known from SQLite fleet_db (offline fallback)

Usage:
    from data.live.ais_live import get_vessel_live_position, enrich_fleet_with_ais
"""
import asyncio
import json
import logging
import os
import time
from typing import Optional

try:
    import requests
    _REQUESTS_OK = True
except ImportError:
    _REQUESTS_OK = False

log = logging.getLogger(__name__)

# Environment variable keys
AISST_KEY_ENV = "AISSTREAM_API_KEY"
MT_KEY_ENV = "MARINE_TRAFFIC_API_KEY"

_CACHE: dict = {}
_AIS_TTL = 300  # 5 minutes — vessel positions don't change much faster

# MarineTraffic REST API (free tier: 100 credits/day)
MT_VESSELS_URL = "https://services.marinetraffic.com/api/getvessel/v:3/{api_key}"

# VesselFinder public search (no key, limited accuracy)
VF_SEARCH_URL = "https://www.vesselfinder.com/api/pub/pv"

# OpenSeaMap/AISHub public vessel search
AISHUB_URL = "http://data.aishub.net/ws.php"


def _cache_get(key: str, ttl: int = _AIS_TTL):
    entry = _CACHE.get(key)
    if entry and (time.time() - entry["ts"]) < ttl:
        return entry["data"]
    return None


def _cache_set(key: str, data):
    _CACHE[key] = {"ts": time.time(), "data": data}


def fetch_vessel_aishub(mmsi: str, timeout: int = 8) -> Optional[dict]:
    """Query AISHub (free, no auth) for a vessel by MMSI."""
    if not _REQUESTS_OK:
        return None
    username = os.environ.get("AISHUB_USERNAME", "")
    if not username:
        return None
    
    try:
        resp = requests.get(
            AISHUB_URL,
            params={
                "username": username,
                "format": "1",
                "output": "json",
                "compress": "0",
                "mmsi": mmsi,
            },
            timeout=timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list) and len(data) > 1 and data[0].get("ERROR") != "true":
            v = data[1][0] if data[1] else {}
            return {
                "mmsi": mmsi,
                "speed_kn": float(v.get("SOG", 0)) / 10.0,
                "heading_deg": float(v.get("COG", 0)) / 10.0,
                "lat": float(v.get("LATITUDE", 0)) / 600000.0,
                "lon": float(v.get("LONGITUDE", 0)) / 600000.0,
                "nav_status": int(v.get("NAVSTAT", 0)),
                "source": "aishub",
                "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
    except Exception as exc:
        log.debug("AISHub fetch failed for MMSI %s: %s", mmsi, exc)
    return None


def fetch_vessel_marinetraffic(imo: str, timeout: int = 10) -> Optional[dict]:
    """Query MarineTraffic REST API for a vessel by IMO."""
    api_key = os.environ.get(MT_KEY_ENV, "")
    if not api_key or not _REQUESTS_OK:
        return None
    
    cache_key = f"mt_imo_{imo}"
    cached = _cache_get(cache_key)
    if cached:
        return cached
    
    try:
        url = MT_VESSELS_URL.format(api_key=api_key)
        resp = requests.get(
            url,
            params={
                "imo": imo,
                "protocol": "json",
                "msgtype": "simple",
            },
            timeout=timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        if data:
            v = data[0] if isinstance(data, list) else data
            result = {
                "imo": imo,
                "mmsi": str(v.get("MMSI", "")),
                "name": v.get("SHIPNAME", ""),
                "lat": float(v.get("LAT", 0)),
                "lon": float(v.get("LON", 0)),
                "speed_kn": float(v.get("SPEED", 0)),
                "heading_deg": float(v.get("HEADING", 0)),
                "draft_m": float(v.get("DRAUGHT", 0)),
                "destination": v.get("DESTINATION", ""),
                "status": v.get("STATUS", ""),
                "eta": v.get("ETA", ""),
                "source": "marinetraffic",
                "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            _cache_set(cache_key, result)
            log.info("MarineTraffic: IMO %s at %.2f,%.2f speed=%.1fkn",
                     imo, result["lat"], result["lon"], result["speed_kn"])
            return result
    except Exception as exc:
        log.warning("MarineTraffic fetch failed for IMO %s: %s", imo, exc)
    return None


def get_vessel_live_position(imo: str, mmsi: Optional[str] = None) -> dict:
    """Get live position/speed for a vessel. Returns best available source."""
    cache_key = f"pos_{imo}"
    cached = _cache_get(cache_key)
    if cached:
        return cached
    
    # Try MarineTraffic first (best data quality)
    result = fetch_vessel_marinetraffic(imo)
    
    # Try AISHub if MMSI available
    if not result and mmsi:
        result = fetch_vessel_aishub(mmsi)
    
    # Offline fallback from fleet_db
    if not result:
        try:
            from data import fleet_db
            vessels = fleet_db.list_vessels()
            v = next((x for x in vessels if str(x.get("imo", "")) == str(imo)), None)
            if v:
                result = {
                    "imo": imo,
                    "speed_kn": float(v.get("design_speed_kn", 15.0)),
                    "draft_m": float(v.get("max_draft_m", 12.0)),
                    "source": "fleet-db-fallback",
                    "note": "Live AIS unavailable. Using registered vessel design values.",
                    "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }
        except Exception as exc:
            log.debug("fleet_db fallback failed: %s", exc)
    
    if not result:
        result = {
            "imo": imo,
            "speed_kn": None,
            "draft_m": None,
            "source": "no-data",
            "note": "No live AIS data available. Configure MARINE_TRAFFIC_API_KEY or AISHUB_USERNAME.",
        }
    
    _cache_set(cache_key, result)
    return result


def enrich_fleet_with_ais(vessels: list) -> list:
    """Enrich a fleet list with live AIS positions (best-effort)."""
    enriched = []
    for v in vessels:
        imo = str(v.get("imo", ""))
        if imo:
            live = get_vessel_live_position(imo, v.get("mmsi"))
            enriched.append({**v, "live_ais": live})
        else:
            enriched.append({**v, "live_ais": None})
    return enriched


async def stream_ais_websocket(imo_list: list, duration_s: int = 60, on_update=None):
    """Stream live AIS via AISStream.io WebSocket (requires AISSTREAM_API_KEY).
    
    Runs for `duration_s` seconds, calling on_update(vessel_data) for each update.
    Usage:
        asyncio.run(stream_ais_websocket(["9876543", "1234567"], duration_s=120,
                                         on_update=my_callback))
    """
    api_key = os.environ.get(AISST_KEY_ENV, "")
    if not api_key:
        log.warning("AISSTREAM_API_KEY not set — WebSocket stream unavailable")
        return
    
    try:
        import websockets
    except ImportError:
        log.warning("websockets not installed — run: pip install websockets")
        return
    
    url = "wss://stream.aisstream.io/v0/stream"
    subscribe_msg = json.dumps({
        "APIKey": api_key,
        "BoundingBoxes": [[[-90, -180], [90, 180]]],  # global — filter by IMO below
        "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
    })
    
    try:
        async with websockets.connect(url) as ws:
            await ws.send(subscribe_msg)
            log.info("AISStream WebSocket connected")
            deadline = time.time() + duration_s
            
            while time.time() < deadline:
                try:
                    raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
                    msg = json.loads(raw)
                    imo = str(msg.get("MetaData", {}).get("MMSI_String", ""))
                    
                    if msg.get("MessageType") == "PositionReport":
                        pos = msg.get("Message", {}).get("PositionReport", {})
                        vessel_data = {
                            "mmsi": imo,
                            "speed_kn": float(pos.get("Sog", 0)),
                            "heading_deg": float(pos.get("TrueHeading", 0)),
                            "lat": float(pos.get("Latitude", 0)),
                            "lon": float(pos.get("Longitude", 0)),
                            "nav_status": pos.get("NavigationalStatus", 0),
                            "source": "aisstream-websocket",
                            "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        }
                        
                        _cache_set(f"ws_{imo}", vessel_data)
                        if on_update:
                            on_update(vessel_data)
                
                except asyncio.TimeoutError:
                    continue
    
    except Exception as exc:
        log.error("AISStream WebSocket error: %s", exc)
