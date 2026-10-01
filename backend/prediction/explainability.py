"""SHAP explainability for the fuel-intensity model (master doc §5.5, §8 Exp. A).
Returns global mean |SHAP| feature importances; used by the Prediction screen."""
import numpy as np


def global_importances(model, X, max_samples=2000):
    """Mean absolute SHAP value per feature (sorted desc). Requires `shap`."""
    import shap
    Xs = X.sample(min(len(X), max_samples), random_state=0) if len(X) > max_samples else X
    explainer = shap.TreeExplainer(model)
    sv = explainer.shap_values(Xs)
    imp = np.abs(sv).mean(axis=0)
    order = np.argsort(imp)[::-1]
    return [dict(feature=str(X.columns[i]), mean_abs_shap=float(imp[i])) for i in order]
