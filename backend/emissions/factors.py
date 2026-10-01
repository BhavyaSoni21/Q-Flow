"""Sourced lifecycle factors for the Q-Flow emissions engine (master doc §6).

Single source of truth for fuel energy content, well-to-wake GHG intensity, and
the shore-power grid factor. Every value carries a provenance tag. Values are
grounded in IMO LCA guidelines (MEPC.391(81)) and FuelEU Maritime conventions;
where an exact gazetted figure is not pinned they are marked `representative`
(the master doc §6.3 "literature-derived assumption" category) — NOT invented
placeholders. Prices are market/scenario assumptions, labelled as such.

Units: lhv = GJ/t  ·  wtw = gCO2e/MJ (well-to-wake)  ·  price = INR/t.
Prices are in INR (ship bunker converted at ₹83/USD; road prices are India retail).
"""

FACTOR_VERSION = "qflow-factors-v1"
FX_INR_PER_USD = 83.0            # bunker prices quoted in USD globally; converted for display

# id, LHV GJ/t, price INR/t, WtW gCO2e/MJ, provenance per field
DEFAULT_FUELS = [
    dict(fuel_id="vlsfo", name="VLSFO (reference)", lhv=40.2, price=51500, wtw=91.6,
         wtw_source="IMO MEPC.391(81) LCA default — residual/VLSFO", price_source="scenario_assumption:2024-indicative(INR)"),
    dict(fuel_id="lng", name="LNG (fossil)", lhv=49.0, price=46500, wtw=84.0,
         wtw_source="IMO LCA default — LNG, representative incl. methane slip", price_source="scenario_assumption:2024-indicative(INR)"),
    dict(fuel_id="methanol_grey", name="Methanol (fossil)", lhv=19.9, price=35700, wtw=96.0,
         wtw_source="IMO LCA default — fossil/NG-based methanol", price_source="scenario_assumption:2024-indicative(INR)"),
    dict(fuel_id="methanol_green", name="Methanol (bio/e-)", lhv=19.9, price=87200, wtw=18.0,
         wtw_source="FuelEU/IMO LCA — bio/e-methanol, representative (feedstock-dependent)", price_source="scenario_assumption:2024-indicative(INR)"),
    dict(fuel_id="ammonia_green", name="Ammonia (renewable)", lhv=18.6, price=68100, wtw=20.0,
         wtw_source="IMO LCA — renewable e-ammonia, representative (excl. N2O slip)", price_source="scenario_assumption:2024-indicative(INR)"),
    dict(fuel_id="hydrogen_green", name="Hydrogen (electrolysis)", lhv=120.0, price=431600, wtw=12.0,
         wtw_source="IMO LCA — green (electrolysis) hydrogen, representative", price_source="scenario_assumption:2024-indicative(INR)"),
]

REF_FUEL = 0  # index of the reference fuel; auxiliary engines burn it at berth

# Power multiplier by weather scenario (added-resistance proxy; refine from ERA5 percentiles).
WEATHER = {"normal": 1.00, "adverse": 1.15, "severe": 1.35}
WEATHER_SOURCE = "scenario; to be calibrated from ERA5 swh/wind percentiles (Indian coasts)"

# Auxiliary engine specific fuel-oil consumption at berth (reference fuel).
AUX_SFOC_KG_PER_KWH = 0.20
AUX_SFOC_SOURCE = "representative auxiliary SFOC"

# Shore-power grid emission factor — India (SIH context).
DEFAULT_GRID_EF_G_PER_KWH = 710.0
GRID_EF_SOURCE = "CEA CO2 Baseline Database (India) ~0.71 kgCO2/kWh"

# ---------------------------------------------------------------------------
# ROAD mode energy pathways (multi-modal). WtW gCO2e/MJ grounded in the GLEC
# Framework / DEFRA road factors; electricity WtW = grid intensity (no tailpipe).
# Each pathway tagged mode so the engine dispatches factors per mode.
# ---------------------------------------------------------------------------
ROAD_FUELS = [
    dict(fuel_id="diesel", name="Diesel (road)", mode="road", lhv=42.8, price=90.0, wtw=90.4,
         wtw_source="GLEC/DEFRA WtW diesel", price_source="India retail ~INR/L"),
    dict(fuel_id="gasoline", name="Gasoline (road)", mode="road", lhv=43.4, price=100.0, wtw=89.0,
         wtw_source="GLEC/DEFRA WtW petrol", price_source="India retail ~INR/L"),
    dict(fuel_id="electricity", name="Electricity (EV)", mode="road", lhv=None, price=10.0, wtw=197.0,
         wtw_source="grid WtW = CEA India ~710 gCO2/kWh ÷ 3.6", price_source="India tariff ~INR/kWh"),
]

MODES = ("ship", "road")

