# 07 · Dev setup

## Prerequisites

- Python 3.10+ and pip
- Node.js 18+ and npm
- (Optional) `make`

## Install

```bash
git clone https://github.com/BhavyaSoni21/Q-Flow.git
cd Q-Flow
make install        # backend pip deps + frontend npm deps
```

## Run (two terminals)

```bash
# terminal 1 — backend
make run            # → http://localhost:8000  (GET /api/health to verify)

# terminal 2 — frontend
make run-frontend   # → http://localhost:5173  (Vite proxies /api → :8000)
```

Without `make` (Windows PowerShell):

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app:app --port 8000
# new terminal:
cd frontend
npm install
npm run dev
```

## Live vs mock data

The dashboard shows representative **mock** data by default. To run against the
live backend, create `frontend/.env.local`:

```
VITE_USE_MOCK=false
```

(Leave `VITE_API_BASE` unset locally — the Vite proxy handles `/api`.)

## Other make targets

```bash
make test           # 53 backend tests
make train          # train + persist prediction models  → models/
make benchmark      # regenerate benchmark results        → results/metrics/
make clean          # drop __pycache__ / .pytest_cache
```

## Troubleshooting

- **Dashboard shows mock while expecting live** — check the browser console for
  `[api] live … failed, falling back to mock`; confirm the backend is up and
  `VITE_USE_MOCK=false`.
- **Benchmarking first load is slow** — the optimizer benchmark computes live on
  first visit, then caches. Use **Recompute** to re-run.
