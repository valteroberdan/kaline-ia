"""
Unit Tests for Kaline AI Inference Engine
"""

import pytest
import numpy as np
from kaline_core.models.kaline_ensemble import KalineAI


def test_kaline_inference_from_features():
    ai = KalineAI()
    features = {
        "age": 65,
        "sex": "M",
        "height": 170.0,
        "weight": 72.0,
        "bmi": 24.9,
        "asa": 3,
        "emop": 0,
        "preop_htn": 1,
        "preop_dm": 0,
        "preop_hb": 12.0,
        "preop_plt": 210,
        "preop_cr": 1.1,
        "preop_glu": 105,
        "preop_alb": 3.9,
        "mean_sbp": 105.0,
        "mean_dbp": 58.0,
        "mean_map": 72.0,
        "mean_pp": 47.0,
        "ppv": 15.2,
        "dp_dt_max": 620.0,
        "heart_rate": 82.0,
        "hrv_sdnn": 22.0,
        "auc_systole": 6.8,
        "decay_constant_tau": 0.43,
        "stroke_volume_proxy": 45.0,
        "sbp_trend_slope": -0.8,
        "map_trend_slope": -0.6,
        "dbp_trend_slope": -0.4,
    }

    res = ai.predict_from_features(features)

    assert res["ai_name"] == "Kaline"
    assert "predictions" in res
    assert "kaline_hpi_score" in res["predictions"]
    assert "alert_level" in res["predictions"]
    assert "p_5min" in res["predictions"]
    assert "p_10min" in res["predictions"]
    assert "p_15min" in res["predictions"]
    assert "map_5min" in res["predictions"]
    assert "map_10min" in res["predictions"]
    assert "map_15min" in res["predictions"]

    assert 0.0 <= res["predictions"]["p_5min"] <= 1.0
    assert 0.0 <= res["predictions"]["p_10min"] <= 1.0
    assert 0.0 <= res["predictions"]["p_15min"] <= 1.0
    assert 0.0 <= res["predictions"]["kaline_hpi_score"] <= 100.0

    assert "forecast_trajectory" in res
    assert len(res["forecast_trajectory"]) == 4

    assert "explainability" in res
    assert "physiological_axes" in res["explainability"]
    assert "clinical_recommendations" in res["explainability"]


def test_kaline_inference_from_waveform():
    ai = KalineAI()
    fs = 100
    t = np.linspace(0, 30, 3000)
    # Synthetic normotensive waveform
    raw = 75.0 + 38.0 * (np.sin(2 * np.pi * 1.1 * t) ** 2)

    res = ai.predict_from_waveform(raw, fs=fs)

    assert res["signal_status"]["valid"] is True
    assert res["predictions"]["alert_level"] in ["NORMAL", "WARNING", "CRITICAL"]
    assert res["hemodynamic_vitals"]["map"] > 60
