// Prediction service (master doc §10 /api/predict/*, §11 services/predictionApi).
// Thin domain wrapper over the single data layer in @/lib/api.
import { api } from "@/lib/api";

export const predictionApi = {
    /** POST /api/predict/fuel — predicted fuel + bounds + feature contributions. */
    predictFuel: (input) => api.predictFuel(input),
    /** Global SHAP feature attributions for the prediction model. */
    getShapGlobal: () => api.getShapGlobal(),
    /** Predicted-vs-actual scatter for a given seed/run. */
    getPredictionScatter: (seed) => api.getPredictionScatter(seed),
    /** Prediction benchmark table (physics → LR → RF → XGB → QPSO-XGB). */
    getPredictionBenchmarks: () => api.getBenchmarks.prediction(),
};

export default predictionApi;
