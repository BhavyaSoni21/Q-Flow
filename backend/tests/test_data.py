"""Phase 2 data-layer unit tests (fast; synthetic frames, no file IO)."""
import numpy as np
import pandas as pd
import pytest

from data import features, validation, weather, splits, provenance


def test_features_known_numbers():
    df = pd.DataFrame([dict(total_fuel_mt=10.0, fuel_per_dist_kg_nm=50.0, time_at_sea_h=20.0, total_co2_mt=31.0,
                            co2_per_dist_kg_nm=125.0, co2_per_dwt_g=5.0)])
    out = features.add_features(df).iloc[0]
    assert out["distance_nm"] == 200.0           # 10*1000/50
    assert out["avg_speed_kn"] == 10.0           # 200/20
    assert out["energy_gj"] == pytest.approx(402.0)   # 10 * 40.2 (VLSFO LHV)
    assert out["co2_fuel_ratio"] == pytest.approx(3.1)
    assert out["fuel_intensity_kg_nm"] == 50.0
    assert out["dwt_carried"] == pytest.approx(25000.0)   # 125*1000/5 (total CO2 cancels -> deadweight)


def test_validation_drops_bad_rows():
    df = pd.DataFrame([
        dict(total_fuel_mt=10.0, fuel_per_dist_kg_nm=50.0, time_at_sea_h=20.0),   # good: 10 kn
        dict(total_fuel_mt=0.0, fuel_per_dist_kg_nm=50.0, time_at_sea_h=20.0),    # zero fuel -> drop
        dict(total_fuel_mt=1.0, fuel_per_dist_kg_nm=1000.0, time_at_sea_h=1000.0),  # 0.001 kn -> drop
    ])
    clean, counts = validation.clean_mrv(df, report=True)
    assert counts["kept"] == 1
    assert counts["drop_total_fuel_mt"] == 1 and counts["drop_implausible_speed"] == 1


def test_wind_speed_dir():
    spd, deg = weather.wind_speed_dir(3.0, 4.0)
    assert spd == pytest.approx(5.0) and deg == pytest.approx(36.8699, abs=1e-3)


def test_weather_scenarios_normal_is_baseline():
    df = pd.DataFrame(dict(swh=np.linspace(0.5, 4.0, 1000), wind_speed_ms=np.linspace(2, 20, 1000)))
    sc = weather.weather_scenarios(df)
    assert sc["normal"]["power_multiplier"] == 1.0
    assert sc["severe"]["power_multiplier"] >= sc["adverse"]["power_multiplier"] >= 1.0
    assert sc["severe"]["swh_m"] > sc["normal"]["swh_m"]


def test_splits_no_leakage():
    df = pd.DataFrame(dict(year=[2018, 2019, 2020, 2020], imo=[1, 2, 3, 1]))
    tr, te = splits.chronological_split(df, [2020])
    assert set(te["year"]) == {2020} and 2020 not in set(tr["year"])
    tr2, te2 = splits.vessel_holdout_split(df, frac=0.5, seed=0)
    assert set(tr2["imo"]).isdisjoint(set(te2["imo"]))


def test_provenance_records_shape():
    rows = provenance.provenance_records(["total_fuel_mt", "distance_nm", "wind_speed_ms"])
    assert len(rows) == 3
    for r in rows:
        assert {"field_name", "source_type", "source_name", "unit", "transformation_formula"} <= set(r)
    kinds = {r["field_name"]: r["source_type"] for r in rows}
    assert kinds["total_fuel_mt"] == "measured" and kinds["distance_nm"] == "derived"
