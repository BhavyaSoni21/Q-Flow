"""API smoke tests (FastAPI TestClient) against the frontend contract (Phase 5)."""
from fastapi.testclient import TestClient

from app import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"


def test_vessels_frontend_shape():
    v = client.get("/api/vessels").json()
    assert len(v) == 10
    row = v[0]
    assert {"id", "name", "type", "capacity", "minSpeed", "maxSpeed", "allowedFuels", "shorePower", "available"} <= set(row)
    assert row["id"] == "V001"


def test_fuels_frontend_shape():
    f = client.get("/api/fuels").json()
    ids = {x["id"] for x in f}
    assert "VLSFO" in ids
    assert {"wtt", "ttw", "wtw", "price", "lhv"} <= set(f[0])


def test_provenance_shape():
    rows = client.get("/api/provenance").json()
    assert rows and {"field", "status", "source", "unit"} <= set(rows[0])


def test_predict_fuel_frontend_shape():
    r = client.post("/api/predict/fuel", json=dict(speed=14, loadFactor=0.7, enginePower=12000,
                                                    waveHeight=1.5, wind=8, seaState=3, draft=12, distance=600)).json()
    assert {"fuel", "error", "sanity", "physicsExpected"} <= set(r)
    assert r["fuel"] > 0 and r["sanity"] in ("pass", "flag")


def test_optimize_fleet_frontend_shape():
    cfg = dict(distance=600, cargoDemand=45000, deadline=72, weather="Normal",
               population=30, iterations=15, seed=1, algorithm="QPSO")
    out = client.post("/api/optimize/fleet", json=cfg).json()
    assert out["feasible"] is True and out["pareto"]
    sol = out["pareto"][0]
    assert {"fuel", "cost", "wtw", "deployment", "feasible", "tag"} <= set(sol)
    assert sol["deployment"] and {"vesselId", "speed", "fuelId", "cost", "wtw"} <= set(sol["deployment"][0])
    assert any(p["tag"] == "Balanced" for p in out["pareto"])
    assert out["runId"] and out["progress"]


def test_optimize_infeasible():
    out = client.post("/api/optimize/fleet", json=dict(distance=600, cargoDemand=45000, deadline=5,
                                                        population=20, iterations=5)).json()
    assert out["feasible"] is False and out["violated"]


def test_benchmarks_prediction_from_csv():
    rows = client.get("/api/benchmarks/prediction").json()
    assert rows and {"model", "mae", "rmse", "r2", "smape", "protocol"} <= set(rows[0])


def test_experiments_log():
    # the optimize test above records at least one run
    log = client.get("/api/experiments").json()
    assert isinstance(log, list)


def test_scenarios_roundtrip():
    created = client.post("/api/scenarios", json=dict(cargoDemand=45000)).json()
    sid = created["scenario_id"]
    assert client.get(f"/api/scenarios/{sid}").json()["scenario_id"] == sid
