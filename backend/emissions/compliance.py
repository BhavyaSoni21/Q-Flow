"""Compliance checks (master doc §6.6): lifecycle GHG cap and operational CII.

Kept separate from objective evaluation and from each other: lifecycle GHG (WtW)
and operational carbon intensity (CII) are distinct and must not be conflated.
A cap of None means "not enforced" (returns satisfied / zero violation).
"""


def ghg_cap_violation(ghg_total_t, cap_t):
    """Non-negative overshoot of the WtW GHG cap (tCO2e). 0 if under cap or no cap."""
    if cap_t is None:
        return 0.0
    return max(0.0, float(ghg_total_t) - float(cap_t))


def ghg_cap_satisfied(ghg_total_t, cap_t):
    """True if total WtW GHG is within the cap (or no cap set)."""
    return cap_t is None or float(ghg_total_t) <= float(cap_t) + 1e-9


def cii_violation(attained_cii, cii_limit):
    """Non-negative overshoot of an operational carbon-intensity limit. 0 if within/none."""
    if cii_limit is None:
        return 0.0
    return max(0.0, float(attained_cii) - float(cii_limit))


def cii_satisfied(attained_cii, cii_limit):
    """True if attained operational CII is within the limit (or no limit set)."""
    return cii_limit is None or float(attained_cii) <= float(cii_limit) + 1e-9
