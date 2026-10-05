"""Live weather layer — Open-Meteo Marine API (free, no auth required).

Fetches real-time wave height, wind speed/direction for maritime route points.
Falls back to ERA5 historical data gracefully if the API is unreachable.

Usage:
    from data.live.weather_live import fetch_route_weather, weather_to_scenario

API: https://open-meteo.com/en/docs/marine-weather-api (no key required)
"""
import logging
import time
from functools import lru_cache
from typing import Optional

try:
    import requests
    _REQUESTS_OK = True
except ImportError:
    _REQUESTS_OK = False

log = logging.getLogger(__name__)

# Open-Meteo Marine API — completely free, no API key
MARINE_API_URL = "https://marine-api.open-meteo.com/v1/marine"
ATMO_API_URL = "https://api.open-meteo.com/v1/forecast"

# Key Indian Ocean maritime route waypoints
ROUTE_POINTS = {
    "mumbai":   {"lat": 18.93, "lon": 72.83, "label": "Mumbai (Arabian Sea)"},
    "chennai":  {"lat": 13.08, "lon": 80.27, "label": "Chennai (Bay of Bengal)"},
    "kolkata":  {"lat": 22.57, "lon": 88.36, "label": "Kolkata (Bay of Bengal)"},
    "cochin":   {"lat": 9.93,  "lon": 76.27, "label": "Cochin (Arabian Sea)"},
    "visakhapatnam": {"lat": 17.69, "lon": 83.22, "label": "Vizag (Bay of Bengal)"},
}

_CACHE: dict = {}
_CACHE_TTL = 1800  # 30 min — marine weather changes slowly


def _cache_get(key: str):
    entry = _CACHE.get(key)
    if entry and (time.time() - entry["ts"]) < _CACHE_TTL:
        return entry["data"]
    return None


def _cache_set(key: str, data):
    _CACHE[key] = {"ts": time.time(), "data": data}


def fetch_marine_weather(lat: float, lon: float, timeout: int = 8) -> Optional[dict]:
    """Fetch current marine conditions for a lat/lon point.
    
    Returns dict with: wave_height_m, wind_speed_ms, wind_dir_deg,
    swell_height_m, sea_surface_temp_c, source, fetched_at.
    Returns None if API unreachable.
    """
    if not _REQUESTS_OK:
        log.warning("requests not installed — cannot fetch live weather")
        return None
    
    cache_key = f"marine_{lat:.2f}_{lon:.2f}"
    cached = _cache_get(cache_key)
    if cached:
        return cached
    
    try:
        # Marine API: wave and swell data
        marine_resp = requests.get(
            MARINE_API_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "wave_height,wind_wave_height,swell_wave_height,ocean_current_velocity",
                "wind_speed_unit": "ms",
                "timeformat": "iso8601",
            },
            timeout=timeout,
        )
        marine_resp.raise_for_status()
        marine = marine_resp.json()
        
        # Atmosphere API: wind at 10m
        atmo_resp = requests.get(
            ATMO_API_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "wind_speed_10m,wind_direction_10m,weather_code",
                "wind_speed_unit": "ms",
            },
            timeout=timeout,
        )
        atmo_resp.raise_for_status()
        atmo = atmo_resp.json()
        
        cur_m = marine.get("current", {})
        cur_a = atmo.get("current", {})
        
        result = {
            "lat": lat,
            "lon": lon,
            "wave_height_m":     round(float(cur_m.get("wave_height", 1.0) or 1.0), 2),
            "wind_wave_height_m": round(float(cur_m.get("wind_wave_height", 0.5) or 0.5), 2),
            "swell_height_m":    round(float(cur_m.get("swell_wave_height", 0.8) or 0.8), 2),
            "wind_speed_ms":     round(float(cur_a.get("wind_speed_10m", 5.0) or 5.0), 2),
            "wind_dir_deg":      round(float(cur_a.get("wind_direction_10m", 180.0) or 180.0), 1),
            "ocean_current_ms":  round(float(cur_m.get("ocean_current_velocity", 0.3) or 0.3), 2),
            "weather_code":      int(cur_a.get("weather_code", 0) or 0),
            "source": "open-meteo-live",
            "fetched_at": marine.get("current", {}).get("time", ""),
        }
        
        _cache_set(cache_key, result)
        log.info("Weather fetched for (%.2f, %.2f): swh=%.2fm wind=%.1fms",
                 lat, lon, result["wave_height_m"], result["wind_speed_ms"])
        return result
    
    except Exception as exc:
        log.warning("Live weather fetch failed for (%.2f, %.2f): %s", lat, lon, exc)
        return None


def fetch_route_weather(port_from: str = "mumbai", port_to: str = "chennai") -> dict:
    """Fetch weather for both endpoints of a route. Returns combined dict."""
    p1 = ROUTE_POINTS.get(port_from.lower(), ROUTE_POINTS["mumbai"])
    p2 = ROUTE_POINTS.get(port_to.lower(), ROUTE_POINTS["chennai"])
    
    w1 = fetch_marine_weather(p1["lat"], p1["lon"])
    w2 = fetch_marine_weather(p2["lat"], p2["lon"])
    
    # Worst-case (higher values) drives optimizer scenario
    if w1 and w2:
        swh = max(w1["wave_height_m"], w2["wave_height_m"])
        wind = max(w1["wind_speed_ms"], w2["wind_speed_ms"])
        current = max(w1["ocean_current_ms"], w2["ocean_current_ms"])
        source = "open-meteo-live"
    elif w1 or w2:
        w = w1 or w2
        swh = w["wave_height_m"]
        wind = w["wind_speed_ms"]
        current = w.get("ocean_current_ms", 0.3)
        source = "open-meteo-live-partial"
    else:
        # ERA5-derived historical fallback
        swh, wind, current, source = 1.2, 6.5, 0.3, "era5-historical-fallback"
    
    return {
        "origin": {"port": port_from, **p1, "weather": w1},
        "destination": {"port": port_to, **p2, "weather": w2},
        "route_max_swh_m": round(swh, 2),
        "route_max_wind_ms": round(wind, 2),
        "route_max_current_ms": round(current, 2),
        "source": source,
    }


def weather_to_scenario(swh_m: float, wind_ms: float, sensitivity: float = 0.15) -> dict:
    """Convert live SWH + wind into optimizer power multipliers.
    
    Uses the same formula as weather.py:weather_scenarios() so the optimizer
    gets real conditions instead of pre-computed ERA5 percentile buckets.
    Ref: power_multiplier = max(1, 1 + k*(swh/swh_normal - 1))
    where swh_normal = 1.2m (Indian Ocean median from ERA5 dataset).
    """
    SWH_NORMAL = 1.2   # median from ERA5 Indian Ocean dataset
    WIND_NORMAL = 6.5  # median from ERA5
    
    swh_mult = max(1.0, 1.0 + sensitivity * (swh_m / SWH_NORMAL - 1.0))
    wind_mult = max(1.0, 1.0 + (sensitivity * 0.5) * (wind_ms / WIND_NORMAL - 1.0))
    combined = round((swh_mult + wind_mult) / 2.0, 3)
    
    # Map to named scenario for UI
    if combined < 1.05:
        scenario = "Normal"
    elif combined < 1.20:
        scenario = "Adverse"
    else:
        scenario = "Severe"
    
    return {
        "scenario": scenario,
        "power_multiplier": combined,
        "swh_multiplier": round(swh_mult, 3),
        "wind_multiplier": round(wind_mult, 3),
        "inputs": {"swh_m": swh_m, "wind_ms": wind_ms},
        "formula": "max(1, 1 + k*(swh/swh_normal - 1)), k=0.15, swh_normal=1.2m",
    }


def get_live_scenario_for_route(port_from: str = "mumbai", port_to: str = "chennai") -> dict:
    """Full pipeline: fetch live weather → convert to optimizer scenario dict."""
    route = fetch_route_weather(port_from, port_to)
    scenario_data = weather_to_scenario(
        route["route_max_swh_m"],
        route["route_max_wind_ms"]
    )
    return {
        **scenario_data,
        "route": route,
        "data_source": route["source"],
    }
