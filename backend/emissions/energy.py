"""Fuel energy and mass conversions (master doc §6.1). Pure, array-friendly."""


def main_engine_energy_gj(rate_tph, sail_h, lhv_ref_gj_per_t):
    """Main-engine energy demand (GJ) = reference-fuel rate [t/h] × sail hours × LHV_ref [GJ/t]."""
    return rate_tph * sail_h * lhv_ref_gj_per_t


def aux_energy_gj(aux_kwh, lhv_ref_gj_per_t, sfoc_kg_per_kwh):
    """Auxiliary energy (GJ) from berth electricity met by reference fuel.

    aux_kwh × SFOC [kg/kWh] × LHV_ref [GJ/t] / 1000  (the /1000 converts kg → t).
    """
    return aux_kwh * sfoc_kg_per_kwh * lhv_ref_gj_per_t / 1000.0


def fuel_mass_t(energy_gj, lhv_gj_per_t):
    """Fuel mass (t) = energy [GJ] / LHV [GJ/t]."""
    return energy_gj / lhv_gj_per_t
