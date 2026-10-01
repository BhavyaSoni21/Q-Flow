"""Phase 3 predictor unit tests (fast; synthetic frames, no training on real data)."""
import numpy as np
import pandas as pd
import pytest

from prediction import validation, dataset, physics_baseline as pb, predict, tune_qpso, models


def test_metrics_known():
    y = [1.0, 2.0, 3.0]
    assert validation.mae(y, y) == 0.0 and validation.rmse(y, y) == 0.0 and validation.r2(y, y) == 1.0
    assert validation.rmse([0, 0], [1, 1]) == 1.0


def test_parse_tech_efficiency():
    s = pd.Series(["EIV (82.46 gCO₂/t·nm)", "EEDI (3.45 g)", "Not Applicable", "N/A"])
    out = dataset.parse_tech_efficiency(s)
    assert out.iloc[0] == pytest.approx(82.46) and out.iloc[1] == pytest.approx(3.45)
    assert np.isnan(out.iloc[2]) and np.isnan(out.iloc[3])


def test_build_xy_shapes_and_no_nan():
    df = pd.DataFrame(dict(
        tech_efficiency=["EIV (80 g)", "EEDI (5 g)", "N/A"],
        ship_type=["Bulk carrier", "Oil tanker", "Bulk carrier"],
        year=[2020, 2020, 2021], time_at_sea_h=[1000.0, 2000.0, 1500.0],
        fuel_per_dist_kg_nm=[40.0, 60.0, 45.0]))
    X, y, cols = dataset.build_xy(df)
    assert len(X) == 3 and len(y) == 3 and not X.isna().any().any()
    assert "type_Bulk carrier" in cols and "tech_efficiency_num" in cols


def test_physics_rate_positive_and_monotonic_in_speed():
    f = dict(engine_power_kw=np.full(5, 9000.0), design_speed_kn=np.full(5, 14.0),
             speed_kn=np.linspace(9, 17, 5), load_factor=np.full(5, 0.8), weather_factor=np.ones(5))
    r = pb.physics_fuel_rate_tph(f)
    assert (r > 0).all() and (np.diff(r) > 0).all()


def test_scaled_predictor_clamps_and_scales():
    f = dict(engine_power_kw=np.array([9000.0]), design_speed_kn=np.array([14.0]),
             speed_kn=np.array([12.0]), load_factor=np.array([0.7]), weather_factor=np.array([1.0]))
    base = predict.make_scaled_physics_predictor(1.0)(f)
    doubled = predict.make_scaled_physics_predictor(2.0)(f)
    assert doubled[0] == pytest.approx(2.0 * base[0]) and (base >= 0).all()


def test_qpso_decode_within_bounds():
    p = tune_qpso.decode(np.zeros(len(tune_qpso.BOUNDS)))
    assert p["max_depth"] == 3 and isinstance(p["n_estimators"], int)
    p1 = tune_qpso.decode(np.ones(len(tune_qpso.BOUNDS)))
    assert p1["max_depth"] == 10 and p1["learning_rate"] == pytest.approx(0.3)


def test_model_lineup():
    m = models.make_models()
    assert set(m) == {"mean_floor", "linear", "random_forest", "xgboost"}
