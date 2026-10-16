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


def test_flatline_blocks_prediction_and_recommends_zero_vasopressors():
    """
    AUDIT TEST (Item 8): Flatline signal at 80 mmHg must NOT predict high HPI score
    nor recommend vasoactive drugs. It must explicitly block prediction and return SIGNAL_INVALID.
    """
    ai = KalineAI()
    fs = 100
    # Line at constant 80 mmHg with zero pulse amplitude
    flatline = np.full(3000, 80.0, dtype=np.float32)

    res = ai.predict_from_waveform(flatline, fs=fs)

    assert res["status"] == "SIGNAL_INVALID"
    assert res["signal_status"]["valid"] is False
    assert res["predictions"] is None
    assert res["kaline_hpi_score"] is None
    assert res["alert_level"] == "SIGNAL_INVALID"

    recs = res["explainability"]["clinical_recommendations_structured"]
    assert recs["vasoactive_drug_support"] == [], "Vasoactive drugs must NEVER be recommended on invalid arterial signals!"
    assert any("cateter" in r.lower() or "arterial" in r.lower() for r in recs["monitoring_action"])


def test_honest_metrics_no_fallback_088():
    """
    AUDIT TEST (Item 7): If the evaluation cohort has only one class, AUROC must return None
    accompanied by an explicit reason, NEVER a fabricated 0.88.
    """
    from kaline_core.training.evaluate_metrics import compute_comprehensive_metrics

    # Single class cohort (all negatives)
    y_true_single = np.zeros(20, dtype=int)
    y_probs = np.linspace(0.1, 0.4, 20)
    y_reg_true = np.full(20, 80.0)
    y_reg_pred = np.full(20, 78.0)

    m = compute_comprehensive_metrics(y_true_single, y_probs, y_reg_true, y_reg_pred)

    assert m["auroc"] is None, "AUROC must be None when only one class is present in test set!"
    assert "Indisponível" in m["auroc_status"]
    assert m["ci_95_auroc"] is None


def test_dataset_builder_forbids_silent_synthetic_mixing():
    """
    AUDIT TEST (Item 2): dataset_builder must raise ValueError if real VitalDB cases
    yield insufficient samples, prohibiting silent synthetic data concatenation in real training.
    """
    from kaline_core.dataset.dataset_builder import DatasetBuilder

    builder = DatasetBuilder()
    # Processing an empty case list must fail explicitly
    with pytest.raises(ValueError, match="dados hospitalares reais insuficientes"):
        builder.build_dataset_from_cases([])


def test_real_cases_have_cryptographic_provenance():
    """
    AUDIT TEST (Item 1): Real demonstration cases must have is_synthetic_simulation == False,
    exact hospital channel 'SNUADC/ART', interval registered, and SHA-256 hash.
    """
    import json
    from kaline_core.config import SAMPLE_DATA_DIR

    real_case_file = SAMPLE_DATA_DIR / "case_1.json"
    assert real_case_file.exists()

    with open(real_case_file, "r") as f:
        c1 = json.load(f)

    assert c1["is_synthetic_simulation"] is False
    assert "Registro Clínico Real VitalDB" in c1["source"]
    assert "provenance_metadata" in c1
    meta = c1["provenance_metadata"]
    assert meta["channel"] == "SNUADC/ART"
    assert len(meta["original_interval_sec"]) == 2
    assert len(meta["raw_signal_sha256"]) == 64  # Valid SHA-256 hex string


def test_synthetic_cases_are_explicitly_flagged():
    """
    AUDIT TEST (Item 1): Synthetic demonstration cases must have is_synthetic_simulation == True
    and describe that they are parametric simulations.
    """
    import json
    from kaline_core.config import SAMPLE_DATA_DIR

    case_file = SAMPLE_DATA_DIR / "case_7.json"
    with open(case_file, "r") as f:
        c7 = json.load(f)

    assert c7["is_synthetic_simulation"] is True
    assert "Simulação Sintética" in c7["source"]


def test_case_7_ponto_1_high_hpi():
    """
    REGRESSION TEST: Case 7 at 'Ponto 1 Aula' (t = 420s) must have high HPI (> 80%)
    demonstrating early prediction of impending hypotension before critical drop at 10 min.
    """
    import json
    from kaline_core.config import SAMPLE_DATA_DIR

    case_file = SAMPLE_DATA_DIR / "case_7.json"
    with open(case_file, "r") as f:
        case_data = json.load(f)

    ai = KalineAI()
    wave = np.array(case_data["signals"]["art"])
    fs = case_data["signals"].get("sampling_rate", 100)
    pat = case_data.get("patient", {})

    # Find Ponto 1 event dynamically from events list
    p1_event = next(e for e in case_data.get("events", []) if "Ponto 1" in e["label"])
    t_sec = p1_event["time_sec"]
    idx = int(t_sec * fs)
    win = wave[idx - 2000 : idx]

    res = ai.predict_from_waveform(win, pat, fs=fs, is_simulation=True)
    preds = res.get("predictions")
    assert preds is not None, "Predictions must not be None for valid signal window"

    hpi = preds["kaline_hpi_score"]
    assert hpi > 80.0, f"Expected HPI > 80% at Ponto 1 da aula, got {hpi}%"
    assert preds["alert_level"] == "CRITICAL"
    assert preds["p_15min"] > 0.80 or preds["p_5min"] > 0.80



