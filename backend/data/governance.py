"""Phase 0 / Task 1 of the data-integration spec: inventory + schema audit.

Non-destructive. Walks the datasets (and results/models), classifies and hashes
each file, and profiles tabular files, emitting:
  artifacts/data_registry.csv
  artifacts/file_hashes.json
  artifacts/schema_audit/{id}.json

Raw files are never modified. Large binaries (>200 MB) are recorded by
size+mtime only (hash skipped) to keep the pass fast.
"""
import csv
import hashlib
import json
import os
import re
import warnings

warnings.filterwarnings("ignore")

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
SCAN = ["Datasets", "results", "models"]
ART = os.path.join(ROOT, "artifacts")
AUDIT = os.path.join(ART, "schema_audit")
HASH_LIMIT = 200 * 1024 * 1024    # skip hashing files larger than this

_CAT = {".csv": "tabular", ".parquet": "tabular", ".xlsx": "tabular", ".xls": "tabular",
        ".tif": "geospatial", ".tiff": "geospatial", ".nc": "geospatial",
        ".pdf": "document", ".txt": "document", ".md": "document",
        ".joblib": "model", ".pkl": "model", ".json": "config", ".yaml": "config", ".yml": "config"}


def _sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _slug(rel):
    return re.sub(r"[^A-Za-z0-9]+", "_", rel).strip("_")[:80]


def _profile_tabular(path, ext):
    """Light schema audit for a tabular file: rows, cols, per-column profile."""
    import pandas as pd
    if ext in (".xlsx", ".xls"):
        xl = pd.ExcelFile(path)
        return dict(kind="excel", sheets=xl.sheet_names, note="column semantics handled in data/mrv.py")
    df = pd.read_csv(path) if ext == ".csv" else pd.read_parquet(path)
    cols = []
    for c in df.columns:
        s = df[c]
        rec = dict(column=str(c), dtype=str(s.dtype), missing_fraction=round(float(s.isna().mean()), 4),
                   unique_count=int(s.nunique(dropna=True)))
        if pd.api.types.is_numeric_dtype(s) and s.notna().any():
            rec.update(min=float(s.min()), max=float(s.max()), mean=round(float(s.mean()), 4))
        cols.append(rec)
    return dict(kind="table", rows=int(len(df)), columns=len(df.columns), fields=cols)


def main():
    os.makedirs(AUDIT, exist_ok=True)
    registry, hashes = [], {}
    for base in SCAN:
        root = os.path.join(ROOT, base)
        if not os.path.isdir(root):
            continue
        for dirpath, _, files in os.walk(root):
            for fn in files:
                if fn.startswith("._") or fn in (".DS_Store",):
                    continue
                full = os.path.join(dirpath, fn)
                rel = os.path.relpath(full, ROOT).replace("\\", "/")
                ext = os.path.splitext(fn)[1].lower()
                size = os.path.getsize(full)
                cat = _CAT.get(ext, "other")
                sha = _sha256(full) if size <= HASH_LIMIT else f"skipped_large_{size}"
                hashes[rel] = sha
                rec = dict(dataset_id=_slug(rel), local_path=rel, file_format=ext.lstrip("."),
                           category=cat, size_bytes=size, size_mb=round(size / 1e6, 2), file_hash=sha,
                           rows="", columns="", sheets="", audit="")
                if cat == "tabular":
                    try:
                        prof = _profile_tabular(full, ext)
                        if prof.get("kind") == "table":
                            rec["rows"], rec["columns"] = prof["rows"], prof["columns"]
                        else:
                            rec["sheets"] = ";".join(prof.get("sheets", []))
                        ap = os.path.join(AUDIT, _slug(rel) + ".json")
                        with open(ap, "w", encoding="utf-8") as fh:
                            json.dump(prof, fh, indent=2)
                        rec["audit"] = os.path.relpath(ap, ROOT).replace("\\", "/")
                    except Exception as e:
                        rec["audit"] = f"error: {type(e).__name__}"
                registry.append(rec)

    reg_path = os.path.join(ART, "data_registry.csv")
    keys = ["dataset_id", "local_path", "file_format", "category", "size_mb", "rows", "columns",
            "sheets", "file_hash", "audit"]
    with open(reg_path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=keys, extrasaction="ignore")
        w.writeheader(); w.writerows(registry)
    with open(os.path.join(ART, "file_hashes.json"), "w", encoding="utf-8") as fh:
        json.dump(hashes, fh, indent=2)

    from collections import Counter
    print("files:", len(registry), "| by category:", dict(Counter(r["category"] for r in registry)))
    print("tabular audited:", sum(1 for r in registry if r["category"] == "tabular" and not str(r["audit"]).startswith("error")))
    print("wrote", os.path.relpath(reg_path, ROOT))


if __name__ == "__main__":
    main()
