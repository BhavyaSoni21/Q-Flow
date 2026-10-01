"""Shore-power (cold-ironing) berth energy split (master doc §6.4). Pure, array-friendly."""
import numpy as np

HOTEL_LOAD_FRACTION = 0.04  # berth hotel load as a fraction of installed engine power


def berth_energy_kwh(engine_power_kw, port_time_h, hotel_fraction=HOTEL_LOAD_FRACTION):
    """Electricity demand at berth (kWh) = hotel_fraction × engine power [kW] × port time [h]."""
    return hotel_fraction * engine_power_kw * port_time_h


def shore_and_aux_kwh(berth_kwh, uses_ops, ops_share):
    """Split berth demand into shore-supplied vs auxiliary-engine kWh.

    Shore power covers `ops_share` of berth demand where the vessel uses OPS;
    the remainder is met by the auxiliary engine. Returns (shore_kwh, aux_kwh).
    """
    shore_kwh = np.where(uses_ops, berth_kwh * ops_share, 0.0)
    return shore_kwh, berth_kwh - shore_kwh
