# 09 · Security & integrity

This is a **demo/prototype**. It is honest about what is and isn't hardened.

## Current posture `DESIGN`

| Area | State | Note |
|------|-------|------|
| Authentication | None on the API | Frontend has an instant-access login flow only |
| CORS | `CORS_ORIGINS`, defaults to `*` | Set to the real frontend origin in production |
| Transport | HTTPS on Render + Vercel | — |
| Secrets | None required to serve | Ingest scripts read optional API keys from env |
| Input validation | pydantic schemas + engine guards | `optimize_*` never raises on bad user input |

> **Before any public exposure:** add authentication, lock `CORS_ORIGINS` to the
> known frontend origin(s), and put the API behind rate limiting. The code is
> structured to make this a configuration change, not a rewrite (see `app.py`).

## Secrets handling `IMPLEMENTED`

- The serving backend needs **no secrets** — it runs offline from sourced factors
  and persisted model metadata.
- `AISSTREAM_API_KEY` / `GFW_API_TOKEN` are only for **re-collecting raw data** and
  are read from the environment / a local `.env` (git-ignored). Never commit them.
- Raw datasets and model binaries are git-ignored; only source, docs, and small
  real-result metrics files are committed.

## Data integrity `DESIGN`

The integrity rules are the project's backbone (see [06](06-DATA-AND-PROVENANCE.md)):

- Fields labeled `measured` / `derived` / `synthetic`.
- Factors sourced and versioned; metrics traceable to recorded runs.
- Synthetic data labeled as such — never dressed up as real.
- Multi-seed benchmarks; wins **and** losses reported.

## Fallback behavior as a safety property `IMPLEMENTED`

If the backend is unreachable, the frontend degrades to representative mock data
instead of crashing — but it logs the fallback, so a connected deployment is
distinguishable from a degraded one. Treat a silent demo as suspect: confirm live
calls in the Network tab.
