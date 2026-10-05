"""Live fuel & carbon price layer.

Sources (all free/open-access):
  1. Ship&Bunker average prices (web scrape — no API key needed)
  2. Yahoo Finance for EUA carbon futures (EU ETS — ICE:EUA)
  3. Static fallback from Datasets/Synthetic/fuel_prices_monthly.csv

Usage:
    from data.live.fuel_prices_live import get_live_fuel_prices, get_carbon_price_eur
"""
import json
import logging
import os
import re
import time
from typing import Optional

try:
    import requests
    _REQUESTS_OK = True
except ImportError:
    _REQUESTS_OK = False

log = logging.getLogger(__name__)

_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

# Cache settings
_CACHE: dict = {}
_PRICE_CACHE_TTL = 3600  # 1 hour for prices

# INR/USD exchange rate (approximated; replace with live forex if needed)
_USD_TO_INR = 83.5
_EUR_TO_INR = 90.2

# Static fallback prices (INR/tonne) — based on early 2025 Indian bunker market
FALLBACK_PRICES_INR = {
    "VLSFO":    49500,  # ~$593/t
    "HFO":      37500,  # ~$449/t
    "MGO":      67000,  # ~$803/t
    "MDO":      65000,
    "LNG":      55000,  # ~$659/t (energy-equivalent)
    "METHANOL": 48000,
    "AMMONIA":  75000,
    "HYDROGEN": 120000,
    "ELECTRICITY": 8000,  # INR/MWh equivalent
}

# Ship&Bunker average world price page — free, no login
SHIPBUNKER_URL = "https://shipandbunker.com/prices/av/global/av-g20-global-20-ports-average"

# Yahoo Finance EUA carbon futures
EUA_YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart/ECF=F"


def _cache_get(key: str, ttl: int = _PRICE_CACHE_TTL):
    entry = _CACHE.get(key)
    if entry and (time.time() - entry["ts"]) < ttl:
        return entry["data"]
    return None


def _cache_set(key: str, data):
    _CACHE[key] = {"ts": time.time(), "data": data}


def _load_synthetic_fallback() -> dict:
    """Load last-known prices from synthetic CSV."""
    try:
        import pandas as pd
        path = os.path.join(_ROOT, "Datasets", "Synthetic", "fuel_prices_monthly.csv")
        df = pd.read_csv(path)
        prices = df.groupby("fuel_id")["price_inr_per_t"].mean().to_dict()
        return {k: round(float(v), 0) for k, v in prices.items()}
    except Exception:
        return FALLBACK_PRICES_INR.copy()


def fetch_shipbunker_vlsfo(timeout: int = 10) -> Optional[float]:
    """Scrape Ship&Bunker world average VLSFO price in USD/tonne."""
    if not _REQUESTS_OK:
        return None
    
    cached = _cache_get("vlsfo_usd")
    if cached:
        return cached
    
    try:
        resp = requests.get(
            SHIPBUNKER_URL,
            headers={"User-Agent": "Mozilla/5.0 (QFlow maritime research tool)"},
            timeout=timeout,
        )
        resp.raise_for_status()
        
        # Parse the price from the page
        # Ship&Bunker embeds prices in JSON-LD or plain text patterns like "593.00"
        html = resp.text
        
        # Pattern 1: Look for current price in JSON-LD structured data
        json_match = re.search(r'"price"\s*:\s*"?([\d]+\.?[\d]*)"?', html)
        if json_match:
            price = float(json_match.group(1))
            if 200 < price < 2000:  # sanity check: USD/t range
                _cache_set("vlsfo_usd", price)
                log.info("Ship&Bunker VLSFO world avg: $%.2f/t", price)
                return price
        
        # Pattern 2: Look for price in table cells
        price_match = re.search(r'class="[^"]*price[^"]*"[^>]*>\$?([\d,]+\.?[\d]*)', html)
        if price_match:
            price = float(price_match.group(1).replace(",", ""))
            if 200 < price < 2000:
                _cache_set("vlsfo_usd", price)
                return price
        
        log.warning("Could not parse Ship&Bunker price from response")
        return None
    
    except Exception as exc:
        log.warning("Ship&Bunker fetch failed: %s", exc)
        return None


def fetch_eua_carbon_price_eur(timeout: int = 8) -> Optional[float]:
    """Fetch EU ETS carbon allowance price from Yahoo Finance (EUR/tonne CO2)."""
    if not _REQUESTS_OK:
        return None
    
    cached = _cache_get("eua_eur")
    if cached:
        return cached
    
    try:
        resp = requests.get(
            EUA_YAHOO_URL,
            params={"interval": "1d", "range": "1d"},
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        
        price = data["chart"]["result"][0]["meta"]["regularMarketPrice"]
        price = round(float(price), 2)
        _cache_set("eua_eur", price)
        log.info("EUA carbon price: €%.2f/tCO2", price)
        return price
    
    except Exception as exc:
        log.warning("EUA (Yahoo Finance) fetch failed: %s", exc)
        return None


def get_carbon_price_inr() -> dict:
    """Get carbon price in INR/tonne CO2. Falls back to regulatory estimate."""
    eua_eur = fetch_eua_carbon_price_eur()
    
    if eua_eur:
        inr = round(eua_eur * _EUR_TO_INR, 0)
        return {
            "price_inr_per_tco2": inr,
            "price_eur_per_tco2": eua_eur,
            "source": "ICE EUA futures (Yahoo Finance)",
            "market": "EU ETS",
            "note": "EU ETS price. India Carbon Credit market ~INR 150-500/tCO2",
        }
    
    # India carbon credit fallback (CCTS estimate)
    return {
        "price_inr_per_tco2": 500.0,
        "price_eur_per_tco2": None,
        "source": "regulatory-estimate-fallback",
        "market": "India CCTS estimate",
        "note": "EU ETS API unreachable. Using India Carbon Credit Trading Scheme estimate.",
    }


def get_live_fuel_prices() -> dict:
    """Get live marine fuel prices in INR/tonne.
    
    Returns dict with fuel_id keys and price/source metadata.
    Always returns valid prices (falls back gracefully).
    """
    cached = _cache_get("all_fuel_prices_inr")
    if cached:
        return cached
    
    # Start with synthetic/fallback baseline
    base_prices = _load_synthetic_fallback()
    
    # Try to get live VLSFO price from Ship&Bunker
    vlsfo_usd = fetch_shipbunker_vlsfo()
    
    if vlsfo_usd:
        vlsfo_inr = round(vlsfo_usd * _USD_TO_INR, 0)
        # Derive other fuel prices from VLSFO ratio
        # Based on typical market spreads (early 2025 Indian bunker market)
        prices = {
            "VLSFO":    vlsfo_inr,
            "HFO":      round(vlsfo_inr * 0.76, 0),   # ~24% cheaper
            "MGO":      round(vlsfo_inr * 1.35, 0),   # ~35% premium
            "MDO":      round(vlsfo_inr * 1.30, 0),
            "LNG":      round(vlsfo_inr * 1.12, 0),   # energy-adj premium
            "METHANOL": round(vlsfo_inr * 0.97, 0),   # slight discount
            "AMMONIA":  round(vlsfo_inr * 1.52, 0),   # green premium
            "HYDROGEN": round(vlsfo_inr * 2.42, 0),   # highest green premium
            "ELECTRICITY": round(vlsfo_inr * 0.16, 0), # per energy-equivalent
        }
        source = "shipandbunker-live-derived"
        source_note = f"VLSFO world avg ${vlsfo_usd}/t → derived via market spread ratios"
    else:
        prices = {k: base_prices.get(k, FALLBACK_PRICES_INR.get(k, 50000))
                  for k in FALLBACK_PRICES_INR}
        source = "synthetic-dataset-fallback"
        source_note = "Ship&Bunker unavailable. Using historical synthetic dataset prices."
    
    result = {
        "prices_inr_per_tonne": prices,
        "usd_to_inr_rate": _USD_TO_INR,
        "source": source,
        "source_note": source_note,
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    
    _cache_set("all_fuel_prices_inr", result)
    return result


def get_fuel_price_summary() -> dict:
    """Combined fuel + carbon price dashboard data."""
    fuel = get_live_fuel_prices()
    carbon = get_carbon_price_inr()
    
    return {
        "fuel_prices": fuel,
        "carbon_price": carbon,
        "key_prices": {
            "vlsfo_inr_t": fuel["prices_inr_per_tonne"].get("VLSFO"),
            "hfo_inr_t":   fuel["prices_inr_per_tonne"].get("HFO"),
            "lng_inr_t":   fuel["prices_inr_per_tonne"].get("LNG"),
            "eua_inr_tco2": carbon["price_inr_per_tco2"],
        },
    }
