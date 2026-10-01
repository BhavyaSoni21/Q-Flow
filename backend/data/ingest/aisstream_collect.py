"""Collect live AIS from aisstream.io → vessel particulars + real speeds.

Static (Type 5) messages give IMO, type, dimensions (→ length/beam), draught;
Position reports give speed-over-ground (SOG) — a real speed signal MRV lacks.
Runs for a time window and saves two CSVs. aisstream is a LIVE stream, so coverage
= whatever broadcasts in the bounding box during the run.

Usage:
    set AISSTREAM_API_KEY=...            (PowerShell: $env:AISSTREAM_API_KEY="...")
    python data/ingest/aisstream_collect.py --minutes 20

Needs: pip install websockets
"""
import argparse
import asyncio
import csv
import json
import os
import time

OUT_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "Datasets", "AIS_stream"))


def _load_env():
    """Load KEY=VALUE lines from backend/.env (git-ignored) into the environment."""
    p = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

# Indian coasts (match the ERA5 points): [[[lat_min,lon_min],[lat_max,lon_max]], ...]
INDIA_BOXES = [[[8.0, 68.0], [23.0, 78.0]],     # west: Arabian Sea / Mumbai–Kochi
               [[8.0, 78.0], [22.0, 90.0]]]     # east: Bay of Bengal / Chennai–Kolkata


async def _run(api_key, boxes, seconds):
    import websockets
    static, speeds = {}, []
    url = "wss://stream.aisstream.io/v0/stream"
    sub = {"APIKey": api_key, "BoundingBoxes": boxes,
           "FilterMessageTypes": ["PositionReport", "ShipStaticData"]}
    t_end = time.time() + seconds
    while time.time() < t_end:                                   # reconnect loop (survives drops)
        try:
            async with websockets.connect(url, ping_interval=20, max_size=2 ** 22, close_timeout=5) as ws:
                await ws.send(json.dumps(sub))
                while time.time() < t_end:
                    try:
                        raw = await asyncio.wait_for(ws.recv(), timeout=min(30.0, max(1.0, t_end - time.time())))
                    except asyncio.TimeoutError:
                        continue                                 # no message yet; keep the socket open
                    msg = json.loads(raw)
                    mtype = msg.get("MessageType")
                    meta = msg.get("MetaData", {})
                    mmsi = meta.get("MMSI")
                    if mtype == "ShipStaticData":
                        m = msg["Message"]["ShipStaticData"]
                        dim = m.get("Dimension", {}) or {}
                        static[mmsi] = dict(
                            mmsi=mmsi, imo=m.get("ImoNumber"), name=(m.get("Name") or "").strip(),
                            ship_type=m.get("Type"), draught=m.get("MaximumStaticDraught"),
                            length_m=(dim.get("A", 0) or 0) + (dim.get("B", 0) or 0),
                            beam_m=(dim.get("C", 0) or 0) + (dim.get("D", 0) or 0))
                    elif mtype == "PositionReport":
                        m = msg["Message"]["PositionReport"]
                        speeds.append(dict(mmsi=mmsi, sog_kn=m.get("Sog"), cog=m.get("Cog"),
                                           lat=meta.get("latitude"), lon=meta.get("longitude"),
                                           t=meta.get("time_utc")))
        except Exception as e:
            if time.time() >= t_end:
                break
            print(f"  [reconnecting after: {type(e).__name__}] {len(static)} vessels so far")
            await asyncio.sleep(2)
    return static, speeds


def _save(static, speeds):
    os.makedirs(OUT_DIR, exist_ok=True)
    sp = os.path.join(OUT_DIR, "vessel_static.csv")
    with open(sp, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["mmsi", "imo", "name", "ship_type", "draught", "length_m", "beam_m"])
        w.writeheader(); w.writerows(static.values())
    dp = os.path.join(OUT_DIR, "speeds.csv")
    with open(dp, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["mmsi", "sog_kn", "cog", "lat", "lon", "t"])
        w.writeheader(); w.writerows(speeds)
    print(f"saved {len(static)} vessels -> {sp}")
    print(f"saved {len(speeds)} position reports -> {dp}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--minutes", type=float, default=15.0)
    ap.add_argument("--global", dest="glob", action="store_true", help="whole world instead of India boxes")
    args = ap.parse_args()
    _load_env()
    key = os.environ.get("AISSTREAM_API_KEY")
    if not key:
        raise SystemExit("Set AISSTREAM_API_KEY in the environment first.")
    boxes = [[[-90, -180], [90, 180]]] if args.glob else INDIA_BOXES
    static, speeds = asyncio.run(_run(key, boxes, int(args.minutes * 60)))
    _save(static, speeds)


if __name__ == "__main__":
    main()
