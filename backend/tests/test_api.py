"""API smoke tests (FastAPI TestClient) against the frontend contract (Phase 5)."""
from fastapi.testclient import TestClient

from app import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"


def test_engine_status_reports_active_predictor_and_data_labels():
    status = client.get("/api/status").json()
    assert status["predictor"] in ("physics_baseline_calibrated", "synthetic_telemetry_xgb")
    assert status["model_version"] in ("physics-mrv-cal-v1", "synthetic-engine-xgb-v1")
    assert status["fleet_data_status"] == "persistent_synthetic_pool"
    assert status["scenario_storage_status"] == "persistent_file"
    assert "model_artifact_exists" in status and "holdout_metrics" in status


def test_model_registry_reports_artifact_provenance():
    rows = client.get("/api/models").json()
    engine = next(row for row in rows if row["name"] == "synthetic_engine_xgb")
    assert {"artifact_exists", "artifact_sha256", "metadata"} <= set(engine)
    assert engine["metadata"]["model_version"] == "synthetic-engine-xgb-v1"


def test_remaining_roadmap_prototype_contracts():
    assert client.get("/api/digital-twins").json()
    sensitivity = client.post("/api/fuels/sensitivity", json={"fuel_id": "methanol_green", "price_factor": 1.1}).json()
    assert sensitivity["status"] == "indicative_sensitivity" and len(sensitivity["scenarios"]) == 2
    annual = client.post("/api/compliance/annual", json={"years": [{"year": 2025, "ghg_tonnes": 100, "capacity_tonnes": 50000, "distance_nm": 1000, "cii_limit": 3}]}).json()
    assert annual["results"][0]["satisfied"] is True
    eacf = client.post("/api/eacf/evaluate", json={"ghg_tonnes": 100, "ghg_cap_tonnes": 120, "feasible": True, "explanation": [{"feature": "speed"}]}).json()
    assert eacf["name"] == "EACF" and eacf["accounting"]["cap_satisfied"] is True


def test_vessels_frontend_shape():
    v = client.get("/api/vessels").json()
    assert len(v) == 10
    row = v[0]
    assert {"id", "name", "type", "capacity", "minSpeed", "maxSpeed", "allowedFuels", "shorePower", "available"} <= set(row)
    assert row["id"] == "V001"


def test_vessel_crud_persists_and_validates():
    base = client.get("/api/vessels").json()[0]
    created = dict(base, id="VTEST")
    created["vessel_id"] = "VTEST"
    created.pop("id", None)
    created.update(dict(vessel_type=created.pop("type"), capacity_t=created.pop("capacity"),
                        min_speed_kn=created.pop("minSpeed"), max_speed_kn=created.pop("maxSpeed"),
                        fuel_compatibility=[1, 1, 0, 0, 0, 0], engine_power_kw=5000,
                        design_speed_kn=13, charter_usd_day=1000, shore_power_compatible=1))
    response = client.post("/api/vessels", json=created)
    assert response.status_code == 200 and response.json()["vessel_id"] == "VTEST"
    assert any(v["id"] == "VTEST" for v in client.get("/api/vessels").json())
    assert client.delete("/api/vessels/VTEST").json() == {"deleted": "VTEST"}


def test_vessel_availability_history():
    vessel_id = "V001"
    response = client.post(f"/api/vessels/{vessel_id}/availability", json={"available": False, "reason": "maintenance"})
    assert response.status_code == 200 and response.json()["availability"] == 0
    history = client.get(f"/api/vessels/{vessel_id}/availability-history").json()
    assert history[0]["reason"] == "maintenance"
    client.post(f"/api/vessels/{vessel_id}/availability", json={"available": True, "reason": "returned"})


def test_fuels_frontend_shape():
    f = client.get("/api/fuels").json()
    ids = {x["id"] for x in f}
    assert "VLSFO" in ids
    assert {"wtt", "ttw", "wtw", "price", "lhv"} <= set(f[0])


def test_pathway_provenance_and_scenario_compare():
    pathways = client.get("/api/fuels/pathways").json()
    assert pathways and {"fuel_id", "pathway", "wtw", "source", "version"} <= set(pathways[0])
    a = client.post("/api/scenarios", json=dict(name="A", cargoDemand=100)).json()
    b = client.post("/api/scenarios", json=dict(name="B", cargoDemand=200)).json()
    compared = client.post("/api/scenarios/compare", json=dict(scenario_ids=[a["scenario_id"], b["scenario_id"], "missing"])).json()
    assert compared["found"] == 2 and compared["missing"] == ["missing"]


def test_provenance_shape():
    rows = client.get("/api/provenance").json()
    assert rows and {"field", "status", "source", "unit"} <= set(rows[0])


def test_predict_fuel_frontend_shape():
    r = client.post("/api/predict/fuel", json=dict(speed=14, loadFactor=0.7, enginePower=12000,
                                                    waveHeight=1.5, wind=8, seaState=3, draft=12, distance=600)).json()
    assert {"fuel", "error", "sanity", "physicsExpected"} <= set(r)
    assert r["fuel"] > 0 and r["sanity"] in ("pass", "flag")
    assert r["explanation"] and r["explanation"][0]["method"] == "physics_counterfactual"
    assert "explanation_source" in r


def test_data_status_and_indicative_cii():
    data = client.get("/api/data/status").json()
    assert {"mrv", "era5", "ais", "gfw"} <= set(data["datasets"])
    cii = client.post("/api/compliance/cii", json=dict(ghg_tonnes=100, capacity_tonnes=50000,
                                                        distance_nm=1000, cii_limit=3)).json()
    assert cii["attained_cii"] == 2.0 and cii["satisfied"] is True and cii["status"] == "indicative_only"


def test_digital_twin_and_corridor_prototype():
    twin = client.get("/api/digital-twins/SYN-V001").json()
    assert twin["sample_count"] == 200 and twin["status"] == "development_only_synthetic_telemetry"
    corridor = client.post("/api/corridors/optimize", json=dict(origin="MUMBAI", destination="SINGAPORE")).json()
    assert corridor["routes"] and corridor["status"] == "development_only_synthetic_network"
    assert {row["fuel_id"] for row in corridor["routes"]} == {"vlsfo", "lng", "methanol_green"}


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
    assert out["engineMetadata"]["model_version"] in ("physics-mrv-cal-v1", "synthetic-engine-xgb-v1")


def test_optimize_infeasible():
    out = client.post("/api/optimize/fleet", json=dict(distance=600, cargoDemand=45000, deadline=5,
                                                        population=20, iterations=5)).json()
    assert out["feasible"] is False and out["violated"]


def test_robustness_stress_test_reports_weather_scenarios():
    out = client.post("/api/optimize/robustness", json=dict(distance=600, cargoDemand=45000,
        deadline=72, population=10, iterations=5, seed=7)).json()
    assert out["status"] == "ok"
    assert [row["name"] for row in out["scenarios"]] == ["Normal", "Adverse", "Severe"]
    assert out["assumptions"]["seeds"] == [7, 8, 9]
    assert out["assumptions"]["monte_carlo_samples"] == 500
    assert 0 <= out["scenarios"][0]["monte_carlo"]["feasibility_probability"] <= 1
    assert {"p05", "median", "p95"} <= set(out["scenarios"][0]["monte_carlo"]["confidence_intervals"]["cost_inr"])


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
    loaded = client.get(f"/api/scenarios/{sid}").json()
    assert loaded["scenario_id"] == sid
    assert loaded["revision"] == 1
    assert loaded["schema_version"] == 1
    assert any(row["scenario_id"] == sid for row in client.get("/api/scenarios").json())
