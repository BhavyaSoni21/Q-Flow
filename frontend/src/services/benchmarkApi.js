// Benchmark & provenance service (master doc §10 /api/benchmarks/*, §11 services/benchmarkApi).
// Thin domain wrapper over the single data layer in @/lib/api.
import { api } from "@/lib/api";

export const benchmarkApi = {
    /** Optimization benchmark table (NSGA-II vs MOPSO vs MO-QPSO) for a seed. */
    getOptimizationBenchmarks: (seed) => api.getBenchmarks.optimization(seed),
    /** Hypervolume convergence curves. */
    getHypervolumeCurves: (seed) => api.getBenchmarks.hypervolumeCurves(seed),
    /** Scalability results across vessel counts. */
    getScalability: (seed) => api.getBenchmarks.scalability(seed),
    /** Per-seed box-plot distribution. */
    getBoxPlot: (seed) => api.getBenchmarks.boxplot(seed),
    /** Reproducibility experiment log (run manifests). */
    getExperimentLog: (seed) => api.getExperimentLog(seed),
    /** GET /api/provenance — data/factor provenance ledger. */
    getProvenance: () => api.getProvenance(),
};

export default benchmarkApi;
