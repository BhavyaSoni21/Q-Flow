.PHONY: install train benchmark test run run-frontend clean help

help:
	@echo "Q-Flow — reproducible pipeline (master doc 17)"
	@echo "  make install    install backend (pip) + frontend (npm) deps"
	@echo "  make train      train + persist prediction models (intensity + power)"
	@echo "  make benchmark  run prediction + optimizer benchmarks -> results/metrics"
	@echo "  make test       run the backend test suite"
	@echo "  make run        start the FastAPI backend on :8000"
	@echo "  make run-frontend  start the React dev server (live, proxied to :8000)"

install:
	cd backend && python -m pip install -r requirements.txt
	cd frontend && npm install

train:
	cd backend && python experiments/train_models.py
	cd backend && python experiments/train_power_model.py

benchmark:
	cd backend && python experiments/run_prediction_benchmark.py
	cd backend && python experiments/run_optimizer_benchmark.py

test:
	cd backend && python -m pytest -q

run:
	cd backend && python -m uvicorn app:app --port 8000

run-frontend:
	cd frontend && npm run dev

clean:
	cd backend && python -c "import shutil,glob,os; [shutil.rmtree(p,ignore_errors=True) for p in glob.glob('**/__pycache__',recursive=True)+['.pytest_cache']]"
