"""
Benchmark and Validation Metrics API Router
"""

import json
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pathlib import Path

from kaline_core.config import MODELS_DIR

router = APIRouter(prefix="/api/benchmark", tags=["Benchmark"])


@router.get("")
async def get_benchmark_report() -> Dict[str, Any]:
    """
    Retorna as métricas de validação da Kaline IA avaliadas com separação estrita de pacientes.
    Retorna 404 explícito caso o relatório ainda não tenha sido gerado.
    """
    report_file = MODELS_DIR / "benchmark_report.json"
    if report_file.exists():
        with open(report_file, "r") as f:
            return json.load(f)
    raise HTTPException(
        status_code=404,
        detail="Relatório de benchmark não encontrado. Execute o treinamento e avaliação real antes de consultar métricas.",
    )


@router.get("/self-correction")
async def get_self_correction_report() -> Dict[str, Any]:
    """
    Retorna o relatório completo dos ciclos de auto-correção, importância dos biomarcadores
    da onda arterial VitalDB e calibração de limiares de decisão da Kaline IA.
    """
    sc_file = MODELS_DIR / "self_correction_report.json"
    if sc_file.exists():
        with open(sc_file, "r") as f:
            return json.load(f)
    raise HTTPException(
        status_code=404,
        detail="Relatório de auto-correção não encontrado. Execute a mineração de erros antes de consultar o relatório.",
    )
