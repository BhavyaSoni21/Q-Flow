"""Phase 2 entry point: assemble the Strategy-A training frame from MRV
(load → clean → derive Layer-B1 features) with its provenance ledger, and
derive the ERA5 weather scenarios. Output is what the Phase 3 predictor consumes.
"""
import os

from data import mrv, validation, features, provenance, weather, registry

PROCESSED_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed"))

# project scope: MRV years 2020–2025 (2023 not published). ERA5/AIS align to this window.
IN_SCOPE_YEARS = [2020, 2021, 2022, 2024, 2025]


def build_training_frame(years=None, include_partial=False, with_registry=True):
    """Return (frame, provenance_rows): cleaned MRV + Layer-B1 features + §8.5 provenance.
    Defaults to the in-scope years (2020–2025). If `with_registry`, left-joins the
    external GFW gross tonnage (leakage-free size feature) when available."""
    raw = mrv.load_mrv(years=years or IN_SCOPE_YEARS, include_partial=include_partial)
    clean = validation.clean_mrv(raw)
    feat = features.add_features(clean)
    if with_registry:
        feat = registry.attach_gt(feat)
    cols = [c for c in provenance.LEDGER if c in feat.columns]
    return feat, provenance.provenance_records(cols)


def build_weather_scenarios(sides=("west", "east")):
    """Return {side: {normal/adverse/severe: {...}}} from the ERA5 Indian-coast points."""
    return {s: weather.weather_scenarios(weather.load_era5_point(s)) for s in sides}


def save_training_frame(frame, name="mrv_training_v1.parquet"):
    """Persist a built frame to data/processed/ (git-ignored)."""
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    path = os.path.join(PROCESSED_DIR, name)
    frame.to_parquet(path)
    return path
