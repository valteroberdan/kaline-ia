"""
Cases Router for VitalDB Surgical Simulator
"""

import json
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pathlib import Path

from kaline_core.config import SAMPLE_DATA_DIR

router = APIRouter(prefix="/api/cases", tags=["Cases"])


@router.get("")
async def list_cases() -> List[Dict[str, Any]]:
    """
    Retorna a lista de casos cirúrgicos do VitalDB disponíveis para simulação e replay.
    """
    manifest_file = SAMPLE_DATA_DIR / "cases_manifest.json"
    if manifest_file.exists():
        with open(manifest_file, "r") as f:
            return json.load(f)

    # Fallback manifest if not yet generated
    return [
        {"caseid": 101, "title": "Caso 01 - Idoso com Risco de Vasodilatação / Anestesia Geral", "age": 71, "gender": "M", "asa": 3, "op": "Ressecção Retal"},
        {"caseid": 102, "title": "Caso 02 - Paciente Jovem Estável Normotenso", "age": 42, "gender": "F", "asa": 1, "op": "Colecistectomia"},
        {"caseid": 103, "title": "Caso 03 - Urgência com Hipovolemia / VPP Elevada", "age": 58, "gender": "M", "asa": 3, "op": "Laparotomia Trauma"},
    ]


@router.get("/{caseid}")
async def get_case_details(caseid: int) -> Dict[str, Any]:
    """
    Retorna o perfil clínico e dados do caso selecionado para o simulador.
    """
    case_file = SAMPLE_DATA_DIR / f"case_{caseid}.json"
    if not case_file.exists():
        raise HTTPException(status_code=404, detail=f"Caso {caseid} não encontrado.")

    with open(case_file, "r") as f:
        data = json.load(f)

    return data
