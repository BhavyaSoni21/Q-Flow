"""Well-to-wake lifecycle GHG accounting (master doc §6.3). Pure, array-friendly.

GHG_WtW = (main_gj × EF_main + aux_gj × EF_ref) / 1000 + shore_kwh × gridEF / 1e6

EF is gCO2e/MJ (well-to-wake). GJ×(g/MJ) = kg, so /1000 → tonnes. Shore term:
kWh × g/kWh = g, /1e6 → tonnes. Shore power is NOT zero-emission; it depends on
grid intensity.
"""


def fuel_ghg_t(main_gj, wtw_main, aux_gj, wtw_ref):
    """Well-to-wake GHG (tCO2e) from main + auxiliary fuel energy."""
    return (main_gj * wtw_main + aux_gj * wtw_ref) / 1000.0


def shore_ghg_t(shore_kwh, grid_ef_g_per_kwh):
    """Well-to-wake GHG (tCO2e) from grid electricity used for shore power."""
    return shore_kwh * grid_ef_g_per_kwh / 1e6


def wtw_ghg_t(main_gj, wtw_main, aux_gj, wtw_ref, shore_kwh=0.0, grid_ef_g_per_kwh=0.0):
    """Total well-to-wake GHG (tCO2e) = fuel term + shore-power grid term."""
    return fuel_ghg_t(main_gj, wtw_main, aux_gj, wtw_ref) + shore_ghg_t(shore_kwh, grid_ef_g_per_kwh)
