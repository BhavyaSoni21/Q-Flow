"""Enrich MRV ships with particulars from the Global Fishing Watch API (IMO → size).

Probe/enrich: queries GFW's vessel-identity dataset by IMO and extracts whatever
size fields come back (gross tonnage, length, engine power). Reports the hit rate so
we know empirically whether GFW covers the MRV merchant fleet before relying on it.

Usage:
    set GFW_API_TOKEN=...
    python data/ingest/gfw_enrich.py --sample 200       # probe 200 MRV IMOs
    python data/ingest/gfw_enrich.py --imos-file imos.csv

Needs: pip install requests
"""
import argparse
import csv
import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

OUT_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "Datasets", "vessel_registry"))
API = "https://gateway.api.globalfishingwatch.org/v3/vessels/search"
_SIZE_KEYS = {"tonnagegt": "gt", "lengthm": "length_m", "enginepowerkw": "engine_power_kw",
              "grosstonnage": "gt", "imo": "imo_echo"}


def _find_size(obj, found=None):
    """Recursively pull any known size fields from a nested GFW response."""
    found = found if found is not None else {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            kl = k.lower()
            if kl in _SIZE_KEYS and not isinstance(v, (dict, list)) and v not in (None, ""):
                found.setdefault(_SIZE_KEYS[kl], v)
            _find_size(v, found)
    elif isinstance(obj, list):
        for it in obj:
            _find_size(it, found)
    return found


def _load_env():
    """Load KEY=VALUE lines from backend/.env (git-ignored) into the environment."""
    p = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def query_imo(session, token, imo):
    params = {"query": str(imo), "datasets[0]": "public-global-vessel-identity:latest", "limit": 1}
    r = session.get(API, params=params, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    if r.status_code != 200:
        return dict(imo=imo, status=r.status_code)
    entries = (r.json() or {}).get("entries", [])
    if not entries:
        return dict(imo=imo, status="no_match")
    size = _find_size(entries[0])
    size.update(imo=imo, status="ok")
    return size


def _mrv_imos(n=None):
    from data import mrv, dataset
    df = mrv.load_mrv(years=dataset.IN_SCOPE_YEARS)
    imos = df["imo"].dropna().astype("Int64").astype(str).unique()
    return list(imos) if n is None else list(imos[:n])


_OUT = os.path.join(OUT_DIR, "gfw_particulars.csv")
_FIELDS = ["imo", "status", "gt", "length_m", "engine_power_kw", "imo_echo"]


def _load_done():
    """Resume support: IMOs already fetched (status ok/no_match) in the output CSV."""
    if not os.path.exists(_OUT):
        return {}, []
    done = {}
    rows = []
    with open(_OUT, newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            rows.append(r)
            if str(r.get("status", "")).startswith(("ok", "no_match")):
                done[str(r.get("imo"))] = True
    return done, rows


def _write(rows):
    with open(_OUT, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=_FIELDS, extrasaction="ignore")
        w.writeheader(); w.writerows(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample", type=int, default=200)
    ap.add_argument("--all", dest="all_imos", action="store_true", help="all in-scope MRV IMOs")
    ap.add_argument("--imos-file")
    ap.add_argument("--sleep", type=float, default=0.25, help="seconds between calls (rate limit)")
    args = ap.parse_args()
    _load_env()
    token = os.environ.get("GFW_API_TOKEN")
    if not token:
        raise SystemExit("Set GFW_API_TOKEN in the environment first.")

    if args.imos_file:
        with open(args.imos_file) as fh:
            imos = [row[0] for row in csv.reader(fh) if row and row[0].strip().isdigit()]
    else:
        imos = _mrv_imos(None if args.all_imos else args.sample)

    import requests
    os.makedirs(OUT_DIR, exist_ok=True)
    done, rows = _load_done()                       # resume: keep prior results, skip done IMOs
    todo = [i for i in imos if str(i) not in done]
    print(f"{len(imos)} target IMOs | {len(done)} already done | {len(todo)} to fetch")

    session = requests.Session()
    for i, imo in enumerate(todo):
        try:
            res = query_imo(session, token, imo)
        except Exception as e:
            res = dict(imo=imo, status=f"err:{e}")
        rows.append(res)
        if (i + 1) % 50 == 0:
            _write(rows)                            # incremental save so progress survives drops
            got = sum(1 for r in rows if r.get("gt"))
            print(f"  {i+1}/{len(todo)} fetched | {got} with GT so far")
        time.sleep(args.sleep)

    _write(rows)
    hits = sum(1 for r in rows if r.get("gt"))
    rate = hits / max(len(rows), 1) * 100
    print(f"\nDONE: {len(rows)} rows, {hits} with GT = {rate:.1f}% -> {_OUT}")


if __name__ == "__main__":
    main()

