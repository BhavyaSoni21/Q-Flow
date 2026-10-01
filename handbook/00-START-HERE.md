# 00 · Start here

The Q-Flow **handbook** is the authoritative, code-verified reference for the
project. It explains what is actually built (not aspirational), tagged with the
same claim labels used in the [README](../README.md).

## Reading order

1. [01 · Overview](01-OVERVIEW.md) — the problem, the solution, the principles.
2. [02 · Architecture](02-ARCHITECTURE.md) — how the pieces fit and how data flows.
3. [03 · Backend](03-BACKEND.md) — FastAPI app, modules, endpoints, the engine.
4. [04 · Frontend](04-FRONTEND.md) — the React dashboard and its data layer.
5. [05 · Models](05-MODELS.md) — prediction, emissions, and the optimizer.
6. [06 · Data & provenance](06-DATA-AND-PROVENANCE.md) — datasets and integrity labels.
7. [07 · Dev setup](07-DEV-SETUP.md) — run it locally.
8. [08 · Deployment](08-DEPLOYMENT.md) — Render + Vercel, env, wiring.
9. [09 · Security & integrity](09-SECURITY-AND-INTEGRITY.md) — CORS/auth and data rules.

## Deep-dive docs

The handbook summarizes; `docs/` holds the long-form references:

- [architecture.md](../docs/architecture.md), [algorithm.md](../docs/algorithm.md), [mathematical-model.md](../docs/mathematical-model.md)
- [model-versions.md](../docs/model-versions.md) — metrics and the accuracy-improvement log
- [benchmark-protocol.md](../docs/benchmark-protocol.md), [data-provenance.md](../docs/data-provenance.md)
- [dataset-layers.md](../docs/dataset-layers.md), [references.md](../docs/references.md)
- [`SIH26138_Master_Implementation_Document.md`](../SIH26138_Master_Implementation_Document.md) — the full blueprint

## Claim labels

`PS-FACT` · `IMPLEMENTED` · `VERIFIED METRIC` · `DATA-DEPENDENT` · `DESIGN` · `REFERENCE`
— defined in the [README](../README.md#claim-labels).

## One-minute mental model

> A scenario (cargo, deadline, fleet, fuels) → the optimizer proposes candidate
> deployments → each candidate's fuel is **predicted**, then **priced** for cost and
> well-to-wake GHG → infeasible plans are repaired → MO-QPSO returns a **Pareto
> frontier** → benchmarked against NSGA-II, with full provenance.
