"""Unit tests for the deterministic emissions/cost engine (master doc §15).
Hand-checked numbers; each module tested independently of the optimizer."""
import numpy as np
import pytest

from emissions import energy, shore_power, lifecycle, cost, compliance, factors


# --- energy -----------------------------------------------------------------
def test_main_engine_energy_gj():
    assert energy.main_engine_energy_gj(2.0, 10.0, 40.2) == 804.0            # 2 t/h × 10 h × 40.2 GJ/t

def test_aux_energy_gj():
    assert energy.aux_energy_gj(1000.0, 40.2, 0.20) == pytest.approx(8.04)   # 1000 kWh × 0.20 × 40.2 / 1000

def test_fuel_mass_t_roundtrip():
    assert energy.fuel_mass_t(804.0, 40.2) == 20.0

def test_energy_is_vectorized():
    out = energy.main_engine_energy_gj(np.array([1.0, 2.0]), np.array([10.0, 10.0]), 40.2)
    assert np.allclose(out, [402.0, 804.0])


# --- shore power ------------------------------------------------------------
def test_berth_energy_kwh():
    assert shore_power.berth_energy_kwh(10000.0, 8.0) == 3200.0              # 0.04 × 10000 × 8

def test_shore_split_on_and_off():
    shore, aux = shore_power.shore_and_aux_kwh(np.array([3200.0, 3200.0]),
                                               np.array([True, False]), 0.5)
    assert np.allclose(shore, [1600.0, 0.0]) and np.allclose(aux, [1600.0, 3200.0])


# --- lifecycle --------------------------------------------------------------
def test_fuel_ghg_t():
    assert lifecycle.fuel_ghg_t(1000.0, 50.0, 0.0, 0.0) == 50.0             # 1000 GJ × 50 g/MJ → 50 t

def test_shore_ghg_t():
    assert lifecycle.shore_ghg_t(1_000_000.0, 710.0) == 710.0               # 1e6 kWh × 710 g/kWh → 710 t

def test_wtw_combines_fuel_and_grid():
    assert lifecycle.wtw_ghg_t(1000.0, 50.0, 0.0, 0.0, 1_000_000.0, 710.0) == 760.0


# --- cost -------------------------------------------------------------------
def test_cost_components():
    assert cost.fuel_cost(20.0, 620.0, 0.2, 620.0) == 12524.0
    assert cost.time_cost(24000.0, 48.0) == 48000.0
    assert cost.shore_cost(1600.0, 0.12) == 192.0
    assert cost.carbon_cost(100.0, 50.0) == 5000.0
    assert cost.operating_cost(1.0, 2.0, 3.0, 4.0) == 10.0


# --- compliance -------------------------------------------------------------
def test_ghg_cap():
    assert compliance.ghg_cap_violation(120.0, 100.0) == 20.0
    assert compliance.ghg_cap_violation(80.0, 100.0) == 0.0
    assert compliance.ghg_cap_violation(120.0, None) == 0.0
    assert compliance.ghg_cap_satisfied(100.0, 100.0)
    assert not compliance.ghg_cap_satisfied(101.0, 100.0)
    assert compliance.ghg_cap_satisfied(1e9, None)

def test_cii():
    assert compliance.cii_violation(12.0, 10.0) == 2.0
    assert compliance.cii_violation(8.0, 10.0) == 0.0
    assert compliance.cii_satisfied(10.0, 10.0)
    assert not compliance.cii_satisfied(11.0, 10.0)


# --- factors integrity ------------------------------------------------------
def test_factor_table_is_sourced_and_complete():
    assert len(factors.DEFAULT_FUELS) == 6
    for f in factors.DEFAULT_FUELS:
        assert f["lhv"] > 0 and f["wtw"] >= 0 and f["price"] > 0
        assert f["wtw_source"] and f["price_source"]                        # every value carries provenance
    assert factors.DEFAULT_FUELS[factors.REF_FUEL]["fuel_id"] == "vlsfo"
