// Optimization service (master doc §10 /api/optimize/fleet + metadata, §11 services/optimizationApi).
// Thin domain wrapper over the single data layer in @/lib/api.
import { api } from "@/lib/api";

export const optimizationApi = {
    /** POST /api/optimize/fleet — run MO-QPSO / NSGA-II, returns Pareto + balanced + baseline. */
    runOptimization: (config) => api.runOptimization(config),
    /** GET /api/vessels — available vessel pool (scenario input). */
    getVessels: () => api.getVessels(),
    /** GET /api/fuels — fuel pathways + factors. */
    getFuels: () => api.getFuels(),
    /** Fuel pathway option list for the scenario builder. */
    getFuelPathways: () => api.getFuelPathways(),
    /** Well-to-wake factors per pathway (emissions view). */
    getPathwayWtw: () => api.getPathwayWtw(),
};

export default optimizationApi;
