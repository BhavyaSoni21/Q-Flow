"""EU MRV (EMSA THETIS-MRV) loader — Layer A → tidy frame (master doc §8.1, §8.5).

Handles both published schemas transparently:
  * 2018–2022: 62 columns, single sheet named by year.
  * 2024–2025: 113 columns, sheets 'YYYY Full ERs' (+ 'YYYY Partial ERs').
Header is on row index 2 in every file. Column headers are matched by a
normalization that strips punctuation/spacing and the CO₂ subscript, so the same
canonical names resolve across years despite cosmetic header drift.
"""
import glob
import os
import re

import pandas as pd

HEADER_ROW = 2

# repo-root/Datasets/MRV, resolved from this file so it works regardless of cwd
_DATASETS = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "Datasets"))
MRV_DIR = os.path.join(_DATASETS, "MRV")

# canonical name -> acceptable source headers (priority order). The revised
# 2024/2025 schema drops the "Annual average" prefix on the per-distance column.
CANONICAL = {
    "imo": ["IMO Number"],
    "name": ["Name"],
    "ship_type": ["Ship type"],
    "reporting_period": ["Reporting Period"],
    "tech_efficiency": ["Technical efficiency"],
    "total_fuel_mt": ["Total fuel consumption [m tonnes]"],
    "total_co2_mt": ["Total CO₂ emissions [m tonnes]"],
    "fuel_per_dist_kg_nm": ["Annual average Fuel consumption per distance [kg / n mile]",
                            "Fuel consumption per distance [kg / n mile]"],
    "time_at_sea_h": ["Time spent at sea [hours]", "Annual Total time spent at sea [hours]",
                       "Total time spent at sea [hours]"],
    # for a leakage-free size proxy: DWT = CO2-per-distance / CO2-per-dwt (total CO2 cancels)
    "co2_per_dist_kg_nm": ["Annual average CO₂ emissions per distance [kg CO₂ / n mile]",
                           "CO₂ emissions per distance [kg CO₂ / n mile]"],
    "co2_per_dwt_g": ["Annual average CO₂ emissions per transport work (dwt) [g CO₂ / dwt carried · n miles]",
                      "CO₂ emissions per transport work (dwt) [g CO₂ / dwt carried · n miles]"],
}
NUMERIC = ["total_fuel_mt", "total_co2_mt", "fuel_per_dist_kg_nm", "time_at_sea_h",
           "co2_per_dist_kg_nm", "co2_per_dwt_g"]


def _norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s).lower().replace("₂", "2"))


_CANON_NORM = {k: [_norm(h) for h in hs] for k, hs in CANONICAL.items()}


def _resolve(columns):
    """Map canonical names to actual columns via exact normalized match (first candidate wins)."""
    idx = {}
    for c in columns:
        idx.setdefault(_norm(c), c)
    out = {}
    for k, candidates in _CANON_NORM.items():
        out[k] = next((idx[n] for n in candidates if n in idx), None)
    return out


def load_mrv_year(path, year=None, include_partial=False):
    """Load one MRV workbook into a tidy frame of canonical columns + provenance tags."""
    xl = pd.ExcelFile(path)
    sheets = xl.sheet_names if include_partial else [s for s in xl.sheet_names if "Partial" not in s]
    frames = []
    for sh in sheets:
        df = pd.read_excel(path, sheet_name=sh, header=HEADER_ROW)
        colmap = _resolve(df.columns)
        missing = [k for k, v in colmap.items() if v is None]
        if missing:
            raise ValueError(f"{os.path.basename(path)}:{sh} missing canonical columns: {missing}")
        sub = pd.DataFrame({k: df[v] for k, v in colmap.items()})
        for c in NUMERIC:
            sub[c] = pd.to_numeric(sub[c], errors="coerce")   # MRV uses text like 'Division by zero!'
        sub["sheet"] = sh
        frames.append(sub)
    out = pd.concat(frames, ignore_index=True)
    out["year"] = int(year or os.path.basename(path)[:4])
    out["source_file"] = os.path.basename(path)
    out["source_type"] = "measured"            # Layer A, reported & verified MRV
    out["source_name"] = "EMSA THETIS-MRV"
    return out


def load_mrv(folder=None, years=None, include_partial=False):
    """Load and concatenate all MRV years in `folder` (optionally filtered to `years`)."""
    folder = folder or MRV_DIR
    files = sorted(glob.glob(os.path.join(folder, "*.xlsx")))
    frames = [load_mrv_year(f, include_partial=include_partial) for f in files
              if years is None or int(os.path.basename(f)[:4]) in years]
    if not frames:
        raise FileNotFoundError(f"No MRV .xlsx found in {folder}")
    return pd.concat(frames, ignore_index=True)
