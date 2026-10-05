"""Live data API routes â€” real-time external integrations with graceful fallbacks.

Endpoints:
  GET /api/live/weather?port_from=mumbai&port_to=chennai
  GET /api/live/fuel-prices
  GET /api/live/carbon-price
  GET /api/live/vessel/{imo}
  GET /api/live/port-delay/{port}
  GET /api/live/port-delays          (all Indian ports)
  GET /api/live/status               (which live sources are configured & reachable)
"""
import logging
import os

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/live", tags=["live-data"])


def _import_live(module_name: str):
    """Lazy import of live data module with graceful error."""
    try:
        import importlib
        return importlib.import_module(f"data.live.{module_name}")
    except ImportError as exc:
        log.error("Live module %s import failed: %s", module_name, exc)
        return None


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# WEATHER
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/weather")
async def get_live_weather(port_from: str = "mumbai", port_to: str = "chennai"):
    """Live marine weather for a route via Open-Meteo API (free, no key needed).
    
    Returns wave height, wind speed/direction, and optimizer scenario recommendation.
    Falls back to ERA5 historical data if API is unreachable.
    """
    mod = _import_live("weather_live")
    if not mod:
        raise HTTPException(503, "Live weather module unavailable")
    
    try:
        result = await run_in_threadpool(mod.get_live_scenario_for_route, port_from, port_to)
        return {
            "status": "ok",
            "route": {"from": port_from, "to": port_to},
            **result,
        }
    except Exception as exc:
        log.error("Live weather route failed: %s", exc)
        raise HTTPException(500, f"Weather fetch error: {exc}")


@router.get("/weather/point")
async def get_weather_point(lat: float, lon: float):
    """Live weather for an arbitrary lat/lon point."""
    mod = _import_live("weather_live")
    if not mod:
        raise HTTPException(503, "Live weather module unavailable")
    
    try:
        result = await run_in_threadpool(mod.fetch_marine_weather, lat, lon)
        if not result:
            return {"status": "fallback", "lat": lat, "lon": lon,
                    "note": "API unreachable. No data returned.", "source": "none"}
        return {"status": "ok", **result}
    except Exception as exc:
        raise HTTPException(500, str(exc))


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# FUEL & CARBON PRICES
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/fuel-prices")
async def get_fuel_prices():
    """Live marine fuel prices (INR/tonne) from Ship&Bunker + derived spreads.
    
    Falls back to historical synthetic dataset if Ship&Bunker is unreachable.
    Cached for 1 hour.
    """
    mod = _import_live("fuel_prices_live")
    if not mod:
        raise HTTPException(503, "Live fuel prices module unavailable")
    
    try:
        result = await run_in_threadpool(mod.get_live_fuel_prices)
        return {"status": "ok", **result}
    except Exception as exc:
        log.error("Fuel prices route failed: %s", exc)
        raise HTTPException(500, str(exc))


@router.get("/carbon-price")
async def get_carbon_price():
    """Live EU ETS carbon allowance (EUA) price via Yahoo Finance.
    
    Returns EUR and INR equivalent. Falls back to India CCTS regulatory estimate.
    """
    mod = _import_live("fuel_prices_live")
    if not mod:
        raise HTTPException(503, "Live fuel prices module unavailable")
    
    try:
        result = await run_in_threadpool(mod.get_carbon_price_inr)
        return {"status": "ok", **result}
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/prices/summary")
async def get_price_summary():
    """Combined fuel + carbon price dashboard data."""
    mod = _import_live("fuel_prices_live")
    if not mod:
        raise HTTPException(503, "Live fuel prices module unavailable")
    
    try:
        result = await run_in_threadpool(mod.get_fuel_price_summary)
        return {"status": "ok", **result}
    except Exception as exc:
        raise HTTPException(500, str(exc))


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# AIS VESSEL POSITIONS
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/vessel/{imo}")
async def get_vessel_position(imo: str):
    """Live AIS position for a vessel by IMO number.
    
    Tries MarineTraffic â†’ AISHub â†’ fleet_db fallback.
    Requires MARINE_TRAFFIC_API_KEY or AISHUB_USERNAME env vars for live data.
    """
    mod = _import_live("ais_live")
    if not mod:
        raise HTTPException(503, "Live AIS module unavailable")
    
    try:
        result = await run_in_threadpool(mod.get_vessel_live_position, imo)
        return {"status": "ok", "imo": imo, **result}
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/fleet/positions")
async def get_fleet_positions():
    """Live AIS positions for all registered fleet vessels."""
    mod = _import_live("ais_live")
    if not mod:
        raise HTTPException(503, "Live AIS module unavailable")
    
    try:
        from data import fleet_db
        vessels = fleet_db.list_vessels()
        result = await run_in_threadpool(mod.enrich_fleet_with_ais, vessels)
        return {
            "status": "ok",
            "vessel_count": len(result),
            "vessels": result,
        }
    except Exception as exc:
        raise HTTPException(500, str(exc))


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# PORT DELAYS
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/port-delay/{port}")
async def get_port_delay(port: str):
    """Live port congestion and delay estimate for an Indian port.
    
    Uses PortXchange JIT API if PORT_XCHANGE_API_KEY is set.
    Falls back to historical synthetic dataset medians.
    """
    mod = _import_live("port_delays_live")
    if not mod:
        raise HTTPException(503, "Live port delays module unavailable")
    
    try:
        result = await run_in_threadpool(mod.get_port_delay_estimate, port)
        return {"status": "ok", **result}
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/port-delays")
async def get_all_port_delays():
    """Live delay estimates for all known Indian major ports."""
    mod = _import_live("port_delays_live")
    if not mod:
        raise HTTPException(503, "Live port delays module unavailable")
    
    try:
        result = await run_in_threadpool(mod.get_all_port_delays)
        return {"status": "ok", "ports": result}
    except Exception as exc:
        raise HTTPException(500, str(exc))


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# LIVE DATA STATUS / CONFIG CHECK
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/status")
async def get_live_data_status():
    """Check which live data sources are configured and reachable.
    
    Returns configuration status for each integration (does not expose key values).
    """
    def _check():
        env = os.environ

        # Check which API keys are configured
        keys = {
            "AISSTREAM_API_KEY":      bool(env.get("AISSTREAM_API_KEY")),
            "MARINE_TRAFFIC_API_KEY": bool(env.get("MARINE_TRAFFIC_API_KEY")),
            "AISHUB_USERNAME":        bool(env.get("AISHUB_USERNAME")),
            "PORT_XCHANGE_API_KEY":   bool(env.get("PORT_XCHANGE_API_KEY")),
        }

        # Test no-key APIs
        weather_ok = False
        try:
            import requests
            r = requests.get(
                "https://marine-api.open-meteo.com/v1/marine",
                params={"latitude": 18.93, "longitude": 72.83,
                        "current": "wave_height"},
                timeout=5,
            )
            weather_ok = r.status_code == 200
        except Exception:
            pass

        carbon_ok = False
        try:
            import requests
            r = requests.get(
                "https://query1.finance.yahoo.com/v8/finance/chart/ECF=F",
                params={"interval": "1d", "range": "1d"},
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=5,
            )
            carbon_ok = r.status_code == 200
        except Exception:
            pass

        return {
            "no_key_required": {
                "open_meteo_weather": {
                    "configured": True,
                    "reachable": weather_ok,
                    "note": "Free marine weather API â€” no key needed",
                },
                "yahoo_finance_eua": {
                    "configured": True,
                    "reachable": carbon_ok,
                    "note": "EU ETS carbon price via Yahoo Finance",
                },
                "shipandbunker_scrape": {
                    "configured": True,
                    "reachable": None,  # checked on demand
                    "note": "VLSFO world average price (web scrape)",
                },
            },
            "api_key_required": {
                "aisstream_websocket": {
                    "configured": keys["AISSTREAM_API_KEY"],
                    "env_var": "AISSTREAM_API_KEY",
                    "url": "https://aisstream.io",
                    "note": "Free tier: live AIS WebSocket stream",
                },
                "marinetraffic_rest": {
                    "configured": keys["MARINE_TRAFFIC_API_KEY"],
                    "env_var": "MARINE_TRAFFIC_API_KEY",
                    "url": "https://marinetraffic.com/api",
                    "note": "Vessel positions by IMO (100 credits/day free)",
                },
                "aishub": {
                    "configured": keys["AISHUB_USERNAME"],
                    "env_var": "AISHUB_USERNAME",
                    "url": "https://aishub.net",
                    "note": "Free AIS data aggregator (username registration)",
                },
                "portxchange_jit": {
                    "configured": keys["PORT_XCHANGE_API_KEY"],
                    "env_var": "PORT_XCHANGE_API_KEY",
                    "url": "https://port-xchange.com/api",
                    "note": "JIT port arrival/congestion data",
                },
            },
            "setup_instructions": {
                "quick_start": "Set env vars in backend/.env file (see .env.example)",
                "minimum_viable": "Open-Meteo + Yahoo Finance work with zero configuration.",
            },
        }

    result = await run_in_threadpool(_check)
    return {"status": "ok", "live_data_sources": result}


# ─────────────────────────────────────────────────────────────────────────────
# MARITIME ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/routes/distance")
async def sea_distance(origin: str, destination: str):
    """Real navigable sea distance between two ports (not straight-line).

    Uses pre-computed table of 200+ port pairs from UNCTAD/Lloyd's List data,
    with Searoutes API (SEAROUTES_API_KEY) or chokepoint-aware formula as fallback.
    """
    mod = _import_live("maritime_routes")
    if not mod:
        raise HTTPException(503, "Maritime routes module unavailable")
    try:
        result = await run_in_threadpool(mod.resolve_route, origin, destination)
        return {"status": "ok", **result}
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/routes/ports")
async def list_ports(country: str = ""):
    """List all known ports with coordinates and LOCODE."""
    mod = _import_live("maritime_routes")
    if not mod:
        raise HTTPException(503, "Maritime routes module unavailable")
    try:
        if country:
            result = await run_in_threadpool(mod.list_ports_by_country, country)
        else:
            result = await run_in_threadpool(mod.list_ports)
        return {"status": "ok", "count": len(result), "ports": result}
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/routes/ports/search")
async def search_ports(q: str):
    """Search ports by name prefix."""
    mod = _import_live("maritime_routes")
    if not mod:
        raise HTTPException(503, "Maritime routes module unavailable")
    try:
        all_ports = await run_in_threadpool(mod.list_ports)
        q_lower = q.lower()
        matches = [p for p in all_ports if q_lower in p["name"].lower()]
        return {"status": "ok", "query": q, "count": len(matches), "ports": matches}
    except Exception as exc:
        raise HTTPException(500, str(exc))
