"""
Integration Tests for FastAPI Micro-SaaS Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from saas_backend.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_cases_list_and_detail():
    response = client.get("/api/cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 1
    first_id = cases[0]["caseid"]

    detail_resp = client.get(f"/api/cases/{first_id}")
    assert detail_resp.status_code == 200
    case_data = detail_resp.json()
    assert "patient" in case_data
    assert "signals" in case_data


def test_benchmark_report_endpoint():
    response = client.get("/api/benchmark")
    assert response.status_code == 200
    data = response.json()
    assert "horizons" in data
    assert "5min" in data["horizons"]
    assert "10min" in data["horizons"]
    assert "15min" in data["horizons"]


def test_predict_endpoint():
    payload = {
        "patient": {
            "age": 62,
            "sex": "M",
            "height": 172.0,
            "weight": 78.0,
            "asa": 3,
            "emop": 0,
            "preop_htn": 1,
            "preop_dm": 0,
            "preop_hb": 12.8,
            "preop_cr": 1.0,
            "preop_glu": 110,
        },
        "hemodynamics": {
            "mean_sbp": 110.0,
            "mean_dbp": 65.0,
            "mean_map": 80.0,
            "heart_rate": 72.0,
            "ppv": 11.5,
            "dp_dt_max": 850.0,
            "decay_constant_tau": 0.38,
            "map_trend_slope": -0.3,
        },
    }

    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["ai_name"] == "Kaline"
    assert "predictions" in res_data
    assert "forecast_trajectory" in res_data
    assert "explainability" in res_data


def test_self_correction_endpoint():
    response = client.get("/api/self-correction")
    assert response.status_code == 200
    data = response.json()
    assert data["ai_name"] == "Kaline"
    assert data["status"] == "CONVERGIDO_COM_SUCESSO"
    assert "top_biomarkers" in data
    assert len(data["top_biomarkers"]) >= 10
    assert "cycles_history" in data
    assert len(data["cycles_history"]) >= 3
    assert "optimal_thresholds" in data

