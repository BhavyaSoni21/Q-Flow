"""Assemble a per-IMO vessel register (size proxy) for MRV enrichment.

Merges, in priority order: (1) GFW particulars (gfw_particulars.csv), (2) AIS-stream
static dims/draught (vessel_static.csv) — both MEASURED — then (3) fills the rest
with type-based SYNTHETIC estimates. Every row carries `size_source` so measured vs
synthetic is auditable (master doc §8.3, §8.5). NOTE: synthetic type-based size ≈
ship_type the model already has, so it adds coverage, not accuracy — only the
MEASURED rows can genuinely lift the predictor.
"""
import csv
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from data import mrv

REG_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "Datasets", "vessel_registry"))
AIS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "Datasets", "AIS_stream"))

# Representative DWT by MRV ship type (SYNTHETIC fallback only; labelled as such).
TYPE_DWT = {
    "Bulk carrier": 75000, "Oil tanker": 70000, "Chemical tanker": 25000,
    "Container ship": 40000, "General cargo ship": 10000, "Gas carrier": 55000,
    "LNG carrier": 90000, "Vehicle carrier": 18000, "Ro-ro ship": 15000,
    "Ro-pax ship": 8000, "Refrigerated cargo carrier": 12000, "Passenger ship": 5000,
    "Container/ro-ro cargo ship": 30000, "Combination carrier": 70000, "Other ship types": 15000,
}


def _load_csv_map(path, key="imo"):
    if not os.path.exists(path):
        return {}
    out = {}
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            k = (row.get(key) or "").strip()
            if k and k.lower() != "none":
                out[k] = row
    return out


def build(years=None, seed=0):
    df = mrv.load_mrv(years=years)[["imo", "ship_type"]].dropna(subset=["imo"]).drop_duplicates("imo")
    gfw = _load_csv_map(os.path.join(REG_DIR, "gfw_particulars.csv"))
    ais = _load_csv_map(os.path.join(AIS_DIR, "vessel_static.csv"))
    rng = np.random.default_rng(seed)

    rows = []
    for _, r in df.iterrows():
        imo = str(int(r["imo"])) if str(r["imo"]).replace(".", "").isdigit() else str(r["imo"])
        t = r["ship_type"]
        gt = length_m = dwt = None
        src = "synthetic_type"
        if imo in gfw and (gfw[imo].get("gt") or gfw[imo].get("length_m")):
            gt = gfw[imo].get("gt") or None
            length_m = gfw[imo].get("length_m") or None
            src = "measured_gfw"
        elif imo in ais and ais[imo].get("length_m") not in (None, "", "0"):
            length_m = ais[imo].get("length_m")
            src = "measured_ais"
        if dwt is None and gt is None and length_m is None:
            dwt = round(TYPE_DWT.get(t, 15000) * float(rng.uniform(0.6, 1.5)))   # synthetic
        rows.append(dict(imo=imo, ship_type=t, dwt=dwt, gt=gt, length_m=length_m, size_source=src))

    os.makedirs(REG_DIR, exist_ok=True)
    out = os.path.join(REG_DIR, "registry.csv")
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["imo", "ship_type", "dwt", "gt", "length_m", "size_source"])
        w.writeheader(); w.writerows(rows)
    from collections import Counter
    print("size_source breakdown:", dict(Counter(r["size_source"] for r in rows)))
    print(f"wrote {len(rows)} vessels -> {out}")
    return out


if __name__ == "__main__":
    build()
