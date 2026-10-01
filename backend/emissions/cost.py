"""Operating-cost components (master doc §6.2, §6.5). Pure, array-friendly."""


def fuel_cost(fuel_t, price_main, aux_t, price_ref):
    """Fuel cost (USD) = main-fuel mass × price + auxiliary (reference) mass × price_ref."""
    return fuel_t * price_main + aux_t * price_ref


def time_cost(charter_usd_day, hours):
    """Charter/time cost (USD) = daily charter × hours / 24."""
    return charter_usd_day * hours / 24.0


def shore_cost(shore_kwh, shore_price_usd_per_kwh):
    """Shore-power electricity cost (USD)."""
    return shore_kwh * shore_price_usd_per_kwh


def carbon_cost(ghg_t, carbon_price_usd_per_t):
    """Carbon cost (USD) = lifecycle GHG [tCO2e] × carbon price."""
    return ghg_t * carbon_price_usd_per_t


def operating_cost(fuel_c, time_c, shore_c, carbon_c):
    """Total operating cost (USD) = fuel + time + shore + carbon."""
    return fuel_c + time_c + shore_c + carbon_c
