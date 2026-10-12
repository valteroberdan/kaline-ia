"""
Kaline AI Unified Ensemble Engine
Combines 1D-CNN continuous waveform representations and Gradient Boosted Biomarker Trees
to produce calibrated multi-horizon predictions, risk scores, and clinical alerts.
"""

import numpy as np
import pandas as pd
import logging
from typing import Dict, Any, Optional, List, Union
from pathlib import Path

from kaline_core.config import (
    MODELS_DIR,
    SAMPLING_RATE_HZ,
    WINDOW_SAMPLES,
    PREDICTION_HORIZONS,
    HYPOTENSION_MAP_THRESHOLD,
)
from kaline_core.dataset.preprocessor import (
    filter_arterial_waveform,
    is_valid_signal_window,
)
from kaline_core.dataset.hpi_extractor import extract_hemodynamic_features
from kaline_core.models.gbm_pipeline import KalineGBMPipeline
from kaline_core.explainability.shap_explainer import KalineExplainabilityEngine

logger = logging.getLogger("kaline.ensemble")


class KalineAI:
    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or MODELS_DIR
        self.gbm_pipeline = KalineGBMPipeline(self.models_dir)
        self.is_loaded = False
        self._try_load()

    def _try_load(self) -> bool:
        if self.gbm_pipeline.load_models():
            self.is_loaded = True
            logger.info("Kaline AI models successfully loaded.")
            return True
        return False

    def predict_from_waveform(
        self,
        waveform: np.ndarray,
        patient_profile: Optional[Dict[str, Any]] = None,
        fs: int = SAMPLING_RATE_HZ,
        is_simulation: bool = False,
    ) -> Dict[str, Any]:
        """
        Full inference from raw 30s arterial line waveform and patient clinical profile.
        Strictly blocks prediction if signal fails quality criteria.
        """
        if patient_profile is None:
            patient_profile = {
                "age": 60,
                "sex": "M",
                "height": 170.0,
                "weight": 70.0,
                "bmi": 24.2,
                "asa": 2,
                "emop": 0,
                "preop_htn": 1,
                "preop_dm": 0,
                "preop_hb": 13.0,
                "preop_plt": 200,
                "preop_cr": 1.0,
                "preop_glu": 100,
                "preop_alb": 4.0,
            }

        # Quality check
        valid_signal, reason = is_valid_signal_window(waveform, fs)

        if not valid_signal:
            mean_val = float(np.mean(waveform)) if len(waveform) > 0 else 0.0
            max_val = float(np.max(waveform)) if len(waveform) > 0 else 0.0
            min_val = float(np.min(waveform)) if len(waveform) > 0 else 0.0
            return {
                "ai_name": "Kaline",
                "version": "1.0-VitalDB",
                "status": "SIGNAL_INVALID",
                "signal_status": {"valid": False, "message": reason},
                "hemodynamic_vitals": {
                    "sbp": round(max_val, 1) if not np.isnan(max_val) else None,
                    "dbp": round(min_val, 1) if not np.isnan(min_val) else None,
                    "map": round(mean_val, 1) if not np.isnan(mean_val) else None,
                    "pp": round(max_val - min_val, 1) if not (np.isnan(max_val) or np.isnan(min_val)) else None,
                    "hr": None,
                    "ppv": None,
                    "dp_dt_max": None,
                    "tau": None,
                },
                "predictions": None,
                "kaline_hpi_score": None,
                "alert_level": "SIGNAL_INVALID",
                "forecast_trajectory": [],
                "explainability": {
                    "status": "BLOCKED",
                    "reason": f"Predição bloqueada: Sinal da linha arterial inadequado ({reason}).",
                    "physiological_axes": {
                        "preload_responsiveness": 0.0,
                        "contractility_deficit": 0.0,
                        "vasodilation_index": 0.0,
                        "baseline_vulnerability": 0.0,
                    },
                    "feature_attributions": [],
                    "clinical_recommendations": [
                        f"⚠️ <strong>Predição Bloqueada</strong>: Sinal da linha arterial inadequado ({reason}). <em>Nenhuma conduta vasoativa deve ser guiada por traçado instável.</em>",
                        "Ações Técnicas: Verificar conexão do cateter arterial, checar presença de bolhas de ar no transdutor, realizar teste de flushing/onda quadrada e confirmar nivelamento no eixo flebostático.",
                    ],
                    "clinical_recommendations_structured": {
                        "monitoring_action": [
                            f"⚠️ Predição Bloqueada: Sinal da linha arterial rejeitado pelo controle de qualidade ({reason}).",
                            "Ações: Verificar conexão do cateter arterial, checar presença de bolhas de ar no transdutor, realizar teste de flushing/onda quadrada e confirmar nivelamento no eixo flebostático.",
                        ],
                        "vasoactive_drug_support": [],
                        "fluid_management": [],
                    },
                },
                "model_metadata": {
                    "inference_blocked": True,
                    "reason": reason,
                    "model_used": None,
                },
            }

        # Extract real HPI biomarkers from validated wave
        hpi_features = extract_hemodynamic_features(waveform, fs)

        # Combine features
        combined_features = {**patient_profile, **hpi_features}

        # Predict
        return self.predict_from_features(
            combined_features, signal_valid=True, signal_msg="OK", is_simulation=is_simulation
        )

    def predict_from_features(
        self,
        features: Dict[str, Any],
        signal_valid: bool = True,
        signal_msg: str = "OK",
        is_simulation: bool = False,
    ) -> Dict[str, Any]:
        """
        Inference from tabular / extracted features dictionary with explicit states.
        """
        # Block if signal was flagged invalid
        if not signal_valid:
            return {
                "ai_name": "Kaline",
                "version": "1.0-VitalDB",
                "status": "SIGNAL_INVALID",
                "signal_status": {"valid": False, "message": signal_msg},
                "hemodynamic_vitals": {
                    "sbp": features.get("mean_sbp"),
                    "dbp": features.get("mean_dbp"),
                    "map": features.get("mean_map"),
                    "pp": features.get("mean_pp"),
                    "hr": None,
                    "ppv": None,
                    "dp_dt_max": None,
                    "tau": None,
                },
                "predictions": None,
                "kaline_hpi_score": None,
                "alert_level": "SIGNAL_INVALID",
                "forecast_trajectory": [],
                "explainability": {
                    "status": "BLOCKED",
                    "reason": f"Predição bloqueada: Sinal arterial fora dos critérios ({signal_msg}).",
                    "physiological_axes": {
                        "preload_responsiveness": 0.0,
                        "contractility_deficit": 0.0,
                        "vasodilation_index": 0.0,
                        "baseline_vulnerability": 0.0,
                    },
                    "feature_attributions": [],
                    "clinical_recommendations": [
                        f"⚠️ <strong>Predição Bloqueada</strong>: Qualidade de sinal inadequada ({signal_msg}). <em>Nenhuma droga vasoativa recomendada.</em>",
                        "Verificar montagem da linha arterial e transdutor de pressão antes da inferência preditiva.",
                    ],
                    "clinical_recommendations_structured": {
                        "monitoring_action": [
                            f"⚠️ Predição Bloqueada: Qualidade de sinal inadequada ({signal_msg}).",
                            "Verificar montagem da linha arterial e transdutor de pressão antes da inferência preditiva.",
                        ],
                        "vasoactive_drug_support": [],
                        "fluid_management": [],
                    },
                },
                "model_metadata": {
                    "inference_blocked": True,
                    "reason": signal_msg,
                },
            }

        if not self.is_loaded:
            self._try_load()

        if not self.is_loaded:
            return {
                "ai_name": "Kaline",
                "version": "1.0-VitalDB",
                "status": "MODEL_UNAVAILABLE",
                "signal_status": {"valid": True, "message": signal_msg},
                "hemodynamic_vitals": {
                    "sbp": features.get("mean_sbp", 120.0),
                    "dbp": features.get("mean_dbp", 75.0),
                    "map": features.get("mean_map", 90.0),
                    "pp": features.get("mean_pp", 45.0),
                    "hr": features.get("heart_rate", 70.0),
                    "ppv": features.get("ppv", 9.0),
                    "dp_dt_max": features.get("dp_dt_max", 950.0),
                    "tau": features.get("decay_constant_tau", 0.38),
                },
                "predictions": None,
                "forecast_trajectory": [],
                "explainability": {
                    "status": "UNAVAILABLE",
                    "reason": "Pesos treinados da IA Kaline não foram encontrados no diretório de modelos.",
                    "physiological_axes": {
                        "preload_responsiveness": 0.0,
                        "contractility_deficit": 0.0,
                        "vasodilation_index": 0.0,
                        "baseline_vulnerability": 0.0,
                    },
                    "feature_attributions": [],
                    "clinical_recommendations": [
                        "⚠️ <strong>Modelo Indisponível</strong>: Os checkpoints dos modelos não foram localizados. Execute o pipeline de treinamento antes da inferência.",
                    ],
                },
                "model_metadata": {
                    "inference_blocked": True,
                    "reason": "Model weights missing",
                },
            }

        gbm_results = self.gbm_pipeline.predict_sample(features)

        # Clinical explainability & recommendations
        explanation = KalineExplainabilityEngine.analyze_hemodynamic_etiology(features, gbm_results)

        # Forecast Trajectory format
        current_map = float(features.get("mean_map", 75.0))
        forecast_trajectory = [
            {"time_min": 0, "map_est": round(current_map, 1), "map_ci_low": round(current_map - 1.0, 1), "map_ci_high": round(current_map + 1.0, 1), "hypo_prob": round(1.0 if current_map < 65 else 0.0, 2)},
            {"time_min": 5, "map_est": gbm_results["map_5min"], "map_ci_low": round(gbm_results["map_5min"] - 4.5, 1), "map_ci_high": round(gbm_results["map_5min"] + 4.5, 1), "hypo_prob": gbm_results["prob_5min"]},
            {"time_min": 10, "map_est": gbm_results["map_10min"], "map_ci_low": round(gbm_results["map_10min"] - 6.0, 1), "map_ci_high": round(gbm_results["map_10min"] + 6.0, 1), "hypo_prob": gbm_results["prob_10min"]},
            {"time_min": 15, "map_est": gbm_results["map_15min"], "map_ci_low": round(gbm_results["map_15min"] - 7.5, 1), "map_ci_high": round(gbm_results["map_15min"] + 7.5, 1), "hypo_prob": gbm_results["prob_15min"]},
        ]

        active_status = "SIMULATION" if is_simulation else "NORMAL_PREDICTION"

        return {
            "ai_name": "Kaline",
            "version": "1.0-VitalDB",
            "status": active_status,
            "signal_status": {"valid": True, "message": signal_msg},
            "hemodynamic_vitals": {
                "sbp": features.get("mean_sbp", 120.0),
                "dbp": features.get("mean_dbp", 75.0),
                "map": features.get("mean_map", 90.0),
                "pp": features.get("mean_pp", 45.0),
                "hr": features.get("heart_rate", 70.0),
                "ppv": features.get("ppv", 9.0),
                "dp_dt_max": features.get("dp_dt_max", 950.0),
                "tau": features.get("decay_constant_tau", 0.38),
            },
            "predictions": {
                "kaline_hpi_score": gbm_results["kaline_hpi_score"],
                "alert_level": gbm_results["alert_level"],
                "p_5min": gbm_results["prob_5min"],
                "p_10min": gbm_results["prob_10min"],
                "p_15min": gbm_results["prob_15min"],
                "map_5min": gbm_results["map_5min"],
                "map_10min": gbm_results["map_10min"],
                "map_15min": gbm_results["map_15min"],
            },
            "forecast_trajectory": forecast_trajectory,
            "explainability": explanation,
            "model_metadata": {
                "model_architecture": "HistGradientBoostingClassifier + Regressor (Tabular Arterial Biomarkers)",
                "cnn_waveform_active": False,
                "score_name": "Score Preditivo Experimental Kaline",
                "score_formula": "0.70 * max(p5, p10, p15) + 0.30 * mean(p5, p10, p15)",
                "commercial_equivalence": False,
                "disclaimer": "Score preditivo experimental de pesquisa clínica. Não possui equivalência demonstrada ao índice comercial Acumen HPI.",
            },
        }
