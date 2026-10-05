"""Quick test for all live data modules."""
import sys

print("=" * 60)
print("Testing Live Weather (Open-Meteo)...")
print("=" * 60)
try:
    from data.live.weather_live import fetch_marine_weather, weather_to_scenario, get_live_scenario_for_route
    result = fetch_marine_weather(18.93, 72.83)
    if result:
        print("  Weather OK:")
        print("    SWH={}m  Wind={}m/s  Source={}".format(
            result["wave_height_m"], result["wind_speed_ms"], result["source"]))
        sc = weather_to_scenario(result["wave_height_m"], result["wind_speed_ms"])
        print("    Scenario: {}  Multiplier={}".format(sc["scenario"], sc["power_multiplier"]))
    else:
        print("  Fallback triggered (API unreachable - expected in offline env)")
except Exception as e:
    print("  ERROR:", e)

print()
print("=" * 60)
print("Testing Live Fuel Prices (Ship&Bunker + Yahoo Finance)...")
print("=" * 60)
try:
    from data.live.fuel_prices_live import get_live_fuel_prices, get_carbon_price_inr
    fuel = get_live_fuel_prices()
    print("  Fuel prices OK:")
    print("    Source:", fuel["source"])
    for k, v in list(fuel["prices_inr_per_tonne"].items())[:3]:
        print("    {}: INR {}".format(k, v))
    
    carbon = get_carbon_price_inr()
    print("  Carbon price:", carbon["price_inr_per_tco2"], "INR/tCO2 (Source: {})".format(carbon["source"]))
except Exception as e:
    print("  ERROR:", e)

print()
print("=" * 60)
print("Testing Port Delays (PortXchange / fallback)...")
print("=" * 60)
try:
    from data.live.port_delays_live import get_port_delay_estimate
    delay = get_port_delay_estimate("mumbai")
    print("  Port delay OK:")
    print("    Port:", delay.get("port_name"))
    print("    Avg delay: {} h  Source: {}".format(delay["avg_delay_h"], delay["source"]))
except Exception as e:
    print("  ERROR:", e)

print()
print("=" * 60)
print("Testing AIS (fallback expected without API key)...")
print("=" * 60)
try:
    from data.live.ais_live import get_vessel_live_position
    pos = get_vessel_live_position("9876543")
    print("  AIS result source:", pos.get("source"))
    print("  Note:", pos.get("note", "No note"))
except Exception as e:
    print("  ERROR:", e)

print()
print("All live data module tests complete.")

