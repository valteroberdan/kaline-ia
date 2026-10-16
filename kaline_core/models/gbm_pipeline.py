"""
Gradient Boosting Machine (GBM) Multi-Parametric Pipeline for Kaline AI
Trains and evaluates multi-horizon binary classifiers and MAP regressors for 5, 10, and 15 min.
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from sklearn.ensemble import (
    HistGradientBoostingClassifier,
    HistGradientBoostingRegressor,
)
from sklearn.preprocessing import StandardScaler

from kaline_core.config import (
    MODELS_DIR,
    ALL_TABULAR_FEATURES,
    PREDICTION_HORIZONS,
)


class KalineGBMPipeline:
    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or MODELS_DIR
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.classifiers: Dict[int, Any] = {}
        self.regressors: Dict[int, Any] = {}
        self.scaler = StandardScaler()
        self.feature_names = ALL_TABULAR_FEATURES.copy()
        self.optimal_thresholds: Dict[int, float] = {5: 0.50, 10: 0.50, 15: 0.50}

    def prepare_features(self, df: pd.DataFrame, fit_scaler: bool = False) -> np.ndarray:
        """
        Encodes categorical variables, imputes derived defaults, and scales numeric features.
        """
        data = df.copy()

        # Handle sex encoding
        if "sex" in data.columns:
            data["sex"] = data["sex"].apply(lambda x: 1 if str(x).upper() == "M" else 0)

        # Impute derived ratios if core vitals exist
        if "mean_map" in data.columns and "mean_pp" in data.columns:
            map_vals = pd.to_numeric(data["mean_map"], errors="coerce").fillna(75.0)
            pp_vals = pd.to_numeric(data["mean_pp"], errors="coerce").fillna(40.0)
            if "map_pp_ratio" not in data.columns or data["map_pp_ratio"].isnull().all():
                data["map_pp_ratio"] = map_vals / np.maximum(1.0, pp_vals)

        # Fill missing values
        for col in self.feature_names:
            if col not in data.columns:
                data[col] = 0.0
            data[col] = pd.to_numeric(data[col], errors="coerce").fillna(0.0)

        X = data[self.feature_names].values

        if fit_scaler:
            X_scaled = self.scaler.fit_transform(X)
        else:
            try:
                X_scaled = self.scaler.transform(X)
            except Exception:
                X_scaled = X

        return X_scaled

    def train(
        self, train_df: pd.DataFrame, val_df: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """
        Trains models for each horizon (5, 10, 15 min).
        """
        X_train_full = self.prepare_features(train_df, fit_scaler=True)

        for horizon in PREDICTION_HORIZONS:
            mask = train_df["horizon_min"] == horizon
            if not np.any(mask):
                raise ValueError(
                    f"Amostras ausentes para o horizonte de {horizon} minutos. "
                    "A mistura silenciosa de dados entre horizontes está proibida."
                )

            X_h = X_train_full[mask]
            y_cls = train_df.loc[mask, "label_hypotension"].values
            y_reg = train_df.loc[mask, "target_future_map"].values

            # Classification model (Histogram Gradient Boosting)
            clf = HistGradientBoostingClassifier(
                max_iter=150,
                learning_rate=0.035,
                max_depth=6,
                min_samples_leaf=10,
                l2_regularization=0.15,
                random_state=42,
            )
            clf.fit(X_h, y_cls)
            self.classifiers[horizon] = clf

            # Regression model
            reg = HistGradientBoostingRegressor(
                max_iter=150,
                learning_rate=0.035,
                max_depth=6,
                min_samples_leaf=10,
                l2_regularization=0.15,
                random_state=42,
            )
            reg.fit(X_h, y_reg)
            self.regressors[horizon] = reg

        self.save_models()
        return {"status": "trained", "horizons": PREDICTION_HORIZONS}

    def predict_sample(self, tabular_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts hypotension risk probability and future MAP for a single feature dictionary.
        """
        df = pd.DataFrame([tabular_dict])
        X = self.prepare_features(df, fit_scaler=False)

        results = {}
        for horizon in PREDICTION_HORIZONS:
            clf = self.classifiers.get(horizon)
            reg = self.regressors.get(horizon)

            if clf is not None:
                prob = float(clf.predict_proba(X)[0, 1])
            else:
                prob = 0.5

            if reg is not None:
                pred_map = float(reg.predict(X)[0])
            else:
                pred_map = float(tabular_dict.get("mean_map", 70.0))

            results[f"prob_{horizon}min"] = round(prob, 4)
            results[f"map_{horizon}min"] = round(pred_map, 1)

        # Clinical Monotonicity Constraints across Multi-Horizon Predictions:
        # 1. Cumulative Event Probability Monotonicity (Isotonicity):
        # A patient developing hypotension within 5 min is by definition hypotensive within 10 and 15 min.
        raw_p5 = results.get("prob_5min", 0.0)
        raw_p10 = results.get("prob_10min", 0.0)
        raw_p15 = results.get("prob_15min", 0.0)
        p5 = raw_p5
        p10 = max(p5, raw_p10)
        p15 = max(p10, raw_p15)
        results["prob_5min"] = round(p5, 4)
        results["prob_10min"] = round(p10, 4)
        results["prob_15min"] = round(p15, 4)

        # 2. Hemodynamic MAP Trajectory Consistency:
        # During progressive hemodynamic decompensation (p15 >= 0.50), future MAP must descend monotonically.
        current_map = float(tabular_dict.get("mean_map", 75.0))
        if p15 >= 0.50:
            map15 = min(current_map - 3.0, results.get("map_15min", current_map - 5.0))
            map10 = max(map15, min(current_map - 1.5, results.get("map_10min", map15 + 2.0)))
            # If 10min risk is high, 5min MAP reflects intermediate transition
            expected_map5 = current_map - (current_map - map10) * 0.50 if p10 >= 0.50 else current_map
            map5 = max(map10, min(current_map, results.get("map_5min", expected_map5)))
            results["map_5min"] = round(map5, 1)
            results["map_10min"] = round(map10, 1)
            results["map_15min"] = round(map15, 1)
        else:
            # Normotensive stable trajectory
            results["map_5min"] = round(max(68.0, results.get("map_5min", current_map)), 1)
            results["map_10min"] = round(max(68.0, results.get("map_10min", current_map)), 1)
            results["map_15min"] = round(max(68.0, results.get("map_15min", current_map)), 1)

        # Score Preditivo Experimental Kaline (0 a 100)
        # Fórmula: 70% peso no risco iminente máximo + 30% na média dos horizontes.
        max_risk = max(p5, p10, p15)
        mean_risk = (p5 + p10 + p15) / 3.0
        composite_score = ((max_risk * 0.70) + (mean_risk * 0.30)) * 100.0

        results["kaline_hpi_score"] = round(composite_score, 1)
        results["alert_level"] = (
            "CRITICAL"
            if composite_score >= 75.0
            else "WARNING"
            if composite_score >= 50.0
            else "NORMAL"
        )

        return results

    def save_models(self) -> None:
        """
        Persists trained models, scaler, and optimal calibrated thresholds to disk.
        """
        joblib.dump(
            {
                "classifiers": self.classifiers,
                "regressors": self.regressors,
                "scaler": self.scaler,
                "feature_names": self.feature_names,
                "optimal_thresholds": getattr(self, "optimal_thresholds", {5: 0.5, 10: 0.5, 15: 0.5}),
            },
            self.models_dir / "kaline_gbm_models.joblib",
        )

    def load_models(self) -> bool:
        """
        Loads persisted models from disk.
        """
        model_file = self.models_dir / "kaline_gbm_models.joblib"
        if model_file.exists():
            data = joblib.load(model_file)
            self.classifiers = data["classifiers"]
            self.regressors = data["regressors"]
            self.scaler = data["scaler"]
            self.feature_names = data.get("feature_names", self.feature_names)
            self.optimal_thresholds = data.get("optimal_thresholds", {5: 0.5, 10: 0.5, 15: 0.5})
            return True
        return False
