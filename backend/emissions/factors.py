"""Sourced lifecycle factors for the Q-Flow emissions engine (master doc §6).

Single source of truth for fuel energy content, well-to-wake GHG intensity, and
the shore-power grid factor. Every value carries a provenance tag. Values are
grounded in IMO LCA guidelines (MEPC.391(81)) and FuelEU Maritime conventions;
where an exact gazetted figure is not pinned they are marked `representative`
(the master doc §6.3 "literature-derived assumption" category) — NOT invented
placeholders. Prices are market/scenario assumptions, labelled as such.

Units: lhv = GJ/t  ·  wtw = gCO2e/MJ (well-to-wake)  ·  price = USD/t.
"""

FACTOR_VERSION = "qflow-factors-v1"

# id, LHV GJ/t, price USD/t, WtW gCO2e/MJ, provenance per field
DEFAULT_FUELS = [
    dict(fuel_id="vlsfo", name="VLSFO (reference)", lhv=40.2, price=620, wtw=91.6,
         wtw_source="IMO MEPC.391(81) LCA default — residual/VLSFO", price_source="scenario_assumption:2024-indicative"),
    dict(fuel_id="lng", name="LNG (fossil)", lhv=49.0, price=560, wtw=84.0,
         wtw_source="IMO LCA default — LNG, representative incl. methane slip", price_source="scenario_assumption:2024-indicative"),
    dict(fuel_id="methanol_grey", name="Methanol (fossil)", lhv=19.9, price=430, wtw=96.0,
         wtw_source="IMO LCA default — fossil/NG-based methanol", price_source="scenario_assumption:2024-indicative"),
    dict(fuel_id="methanol_green", name="Methanol (bio/e-)", lhv=19.9, price=1050, wtw=18.0,
         wtw_source="FuelEU/IMO LCA — bio/e-methanol, representative (feedstock-dependent)", price_source="scenario_assumption:2024-indicative"),
    dict(fuel_id="ammonia_green", name="Ammonia (renewable)", lhv=18.6, price=820, wtw=20.0,
         wtw_source="IMO LCA — renewable e-ammonia, representative (excl. N2O slip)", price_source="scenario_assumption:2024-indicative"),
    dict(fuel_id="hydrogen_green", name="Hydrogen (electrolysis)", lhv=120.0, price=5200, wtw=12.0,
         wtw_source="IMO LCA — green (electrolysis) hydrogen, representative", price_source="scenario_assumption:2024-indicative"),
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
