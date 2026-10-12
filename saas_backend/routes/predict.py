"""
Prediction REST API Router for Kaline AI
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import numpy as np

from kaline_core.models.kaline_ensemble import KalineAI

router = APIRouter(prefix="/api", tags=["Prediction"])
kaline_engine = KalineAI()


class PatientAnamnesisInput(BaseModel):
    age: float = Field(60.0, description="Idade em anos", ge=18, le=120)
    sex: str = Field("M", description="Sexo biológico (M/F)")
    height: float = Field(170.0, description="Altura em cm", ge=100, le=230)
    weight: float = Field(70.0, description="Peso em kg", ge=30, le=250)
    asa: int = Field(2, description="Classificação de Estado Físico ASA (1 a 5)", ge=1, le=5)
    emop: int = Field(0, description="Cirurgia de Emergência (0 = Não, 1 = Sim)", ge=0, le=1)
    preop_htn: int = Field(1, description="Hipertensão Arterial Prévia (0 = Não, 1 = Sim)", ge=0, le=1)
    preop_dm: int = Field(0, description="Diabetes Mellitus (0 = Não, 1 = Sim)", ge=0, le=1)
    preop_hb: float = Field(13.0, description="Hemoglobina pré-op (g/dL)", ge=5.0, le=20.0)
    preop_cr: float = Field(1.0, description="Creatinina sérica pré-op (mg/dL)", ge=0.2, le=15.0)
    preop_glu: float = Field(100.0, description="Glicemia pré-op (mg/dL)", ge=40.0, le=500.0)


class HemodynamicInput(BaseModel):
    mean_sbp: float = Field(115.0, description="Pressão Sistólica (mmHg)", ge=40, le=250)
    mean_dbp: float = Field(70.0, description="Pressão Diastólica (mmHg)", ge=20, le=180)
    mean_map: float = Field(85.0, description="Pressão Média (mmHg)", ge=20, le=200)
    heart_rate: float = Field(72.0, description="Frequência Cardíaca (bpm)", ge=30, le=220)
    ppv: float = Field(9.5, description="Variação da Pressão de Pulso - VPP (%)", ge=0.0, le=60.0)
    dp_dt_max: float = Field(920.0, description="Contratilidade sistólica dP/dt_max (mmHg/s)", ge=100.0, le=3000.0)
    decay_constant_tau: float = Field(0.38, description="Constante de decaimento diastólico", ge=0.1, le=1.0)
    map_trend_slope: float = Field(-0.2, description="Tendência da PAM no último minuto (mmHg/min)", ge=-20.0, le=20.0)


class FullPredictionRequest(BaseModel):
    patient: PatientAnamnesisInput
    hemodynamics: HemodynamicInput
    waveform: Optional[List[float]] = Field(None, description="Trecho opcional de 30s de sinal a 100 Hz")


@router.post("/predict")
async def predict_hypotension(payload: FullPredictionRequest) -> Dict[str, Any]:
    """
    Executa predição do risco de hipotensão para 5, 10 e 15 minutos com explicabilidade clínica.
    """
    try:
        patient_dict = payload.patient.model_dump()
        # Compute BMI
        h_m = patient_dict["height"] / 100.0
        patient_dict["bmi"] = round(patient_dict["weight"] / (h_m * h_m), 1)

        if payload.waveform and len(payload.waveform) >= 500:
            # Predict from waveform
            wf_array = np.array(payload.waveform, dtype=np.float32)
            result = kaline_engine.predict_from_waveform(wf_array, patient_dict)
        else:
            # Predict from extracted hemodynamic biomarkers
            hemo_dict = payload.hemodynamics.model_dump()
            hemo_dict["mean_pp"] = round(hemo_dict["mean_sbp"] - hemo_dict["mean_dbp"], 1)
            hemo_dict["sbp_trend_slope"] = round(hemo_dict["map_trend_slope"] * 1.2, 2)
            hemo_dict["dbp_trend_slope"] = round(hemo_dict["map_trend_slope"] * 0.8, 2)
            hemo_dict["hrv_sdnn"] = 35.0
            hemo_dict["auc_systole"] = round(0.15 * hemo_dict["mean_pp"], 3)
            hemo_dict["stroke_volume_proxy"] = round(hemo_dict["auc_systole"] * 3.5, 1)

            combined = {**patient_dict, **hemo_dict}
            result = kaline_engine.predict_from_features(combined)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento da predição: {str(e)}")
