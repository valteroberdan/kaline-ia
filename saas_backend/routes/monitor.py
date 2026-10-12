"""
WebSocket Real-time Hemodynamic Streaming & Kaline AI Telemetry Monitor
"""

import json
import asyncio
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any, Optional
from pathlib import Path

from kaline_core.config import SAMPLE_DATA_DIR, SAMPLING_RATE_HZ, WINDOW_SAMPLES
from kaline_core.models.kaline_ensemble import KalineAI

router = APIRouter(tags=["Monitoring"])
kaline_engine = KalineAI()


@router.websocket("/ws/monitor/{caseid}")
async def websocket_monitor_endpoint(websocket: WebSocket, caseid: int):
    """
    Transmite fluxo contínuo de linha arterial e telemetria preditiva da Kaline IA.
    """
    await websocket.accept()

    # Load case data
    case_file = SAMPLE_DATA_DIR / f"case_{caseid}.json"
    if case_file.exists():
        with open(case_file, "r") as f:
            case_data = json.load(f)
    else:
        # Default mock case
        case_data = {
            "caseid": caseid,
            "patient": {
                "name": f"Paciente #{caseid}",
                "age": 65,
                "sex": "M",
                "weight": 70.0,
                "height": 170.0,
                "bmi": 24.2,
                "asa": 2,
                "emop": 0,
                "preop_htn": 1,
                "preop_dm": 0,
                "preop_hb": 12.5,
                "preop_cr": 1.0,
                "opname": "Cirurgia Monitorada em Tempo Real",
            },
            "signals": {"art": [], "sampling_rate": 100, "duration_sec": 600},
        }

    raw_art = np.array(case_data.get("signals", {}).get("art", []), dtype=np.float32)
    fs = int(case_data.get("signals", {}).get("sampling_rate", 100))
    patient_profile = case_data.get("patient", {})
    is_simulation = bool(case_data.get("is_synthetic_simulation", True))
    source_desc = case_data.get("source", "Simulação Sintética Didática (Perfil Clínico VitalDB)")
    provenance_desc = case_data.get("provenance", "")

    # AUDIT COMPLIANT (Item 9): If signal is missing, never generate a silent sine wave pretending to be real.
    # Expose explicit DISCONNECTED state.
    if len(raw_art) < 3000:
        logger.warning(f"Caso {caseid}: Sinal arterial ausente ou insuficiente (< 30s). Estado DISCONNECTED emitido.")
        try:
            payload = {
                "caseid": caseid,
                "elapsed_sec": 0.0,
                "total_sec": 0.0,
                "waveform_chunk": [],
                "sampling_rate": fs,
                "is_paused": True,
                "speed": 1.0,
                "is_synthetic_simulation": is_simulation,
                "source": source_desc,
                "provenance": provenance_desc,
                "telemetry": {
                    "ai_name": "Kaline",
                    "status": "DISCONNECTED",
                    "signal_status": {
                        "valid": False,
                        "message": "Linha arterial desconectada ou traçado ausente (< 3000 amostras).",
                    },
                    "hemodynamic_vitals": {
                        "sbp": None,
                        "dbp": None,
                        "map": None,
                        "pp": None,
                        "hr": None,
                        "ppv": None,
                        "dp_dt_max": None,
                        "tau": None,
                    },
                    "predictions": None,
                    "kaline_hpi_score": None,
                    "alert_level": "DISCONNECTED",
                    "forecast_trajectory": [],
                    "explainability": {
                        "status": "BLOCKED",
                        "reason": "Sem conexão de sinal arterial.",
                        "clinical_recommendations": {
                            "monitoring_action": [
                                "⚠️ Linha arterial desconectada ou dados ausentes.",
                                "Ações: Conectar transdutor de pressão arterial invasiva para iniciar telemetria preditiva.",
                            ],
                            "vasoactive_drug_support": [],
                            "fluid_management": [],
                        },
                    },
                },
            }
            await websocket.send_json(payload)
            while True:
                await asyncio.sleep(2.0)
        except WebSocketDisconnect:
            return

    total_samples = len(raw_art)
    current_sample_idx = 3000  # Start with 30s buffer
    playback_speed = 1.0
    is_paused = False
    chunk_size = 50  # Send 50 points (0.5s) per tick
    is_first_tick = True

    try:
        while True:
            # Check for incoming client control messages (non-blocking)
            try:
                msg_text = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                cmd = json.loads(msg_text)
                action = cmd.get("action")
                if action == "pause":
                    is_paused = True
                elif action == "resume":
                    is_paused = False
                elif action == "set_speed":
                    playback_speed = float(cmd.get("speed", 1.0))
                elif action == "seek":
                    target_sec = float(cmd.get("time_sec", 0.0))
                    current_sample_idx = max(3000, min(int(target_sec * fs), total_samples - chunk_size))
            except asyncio.TimeoutError:
                pass

            if not is_paused:
                # Get current 30-sec window for Kaline AI inference
                window_start = max(0, current_sample_idx - WINDOW_SAMPLES)
                current_window = raw_art[window_start:current_sample_idx]

                # Run inference with simulation transparency flag
                prediction = kaline_engine.predict_from_waveform(
                    current_window, patient_profile, fs, is_simulation=is_simulation
                )

                # Next chunk for canvas oscilloscope (first tick sends 300 pts so wave appears immediately)
                next_chunk_end = min(current_sample_idx + chunk_size, total_samples)
                if is_first_tick:
                    chunk_start = max(0, current_sample_idx - 350)
                    waveform_chunk = raw_art[chunk_start:next_chunk_end].tolist()
                    is_first_tick = False
                else:
                    waveform_chunk = raw_art[current_sample_idx:next_chunk_end].tolist()

                elapsed_seconds = round(current_sample_idx / fs, 1)

                payload = {
                    "caseid": caseid,
                    "elapsed_sec": elapsed_seconds,
                    "total_sec": round(total_samples / fs, 1),
                    "waveform_chunk": waveform_chunk,
                    "sampling_rate": fs,
                    "is_paused": is_paused,
                    "speed": playback_speed,
                    "is_synthetic_simulation": is_simulation,
                    "source": source_desc,
                    "provenance": provenance_desc,
                    "telemetry": prediction,
                }

                await websocket.send_json(payload)

                # Advance index
                current_sample_idx += chunk_size
                if current_sample_idx >= total_samples - chunk_size:
                    current_sample_idx = 3000  # Loop simulation

            # Sleep interval scaled by playback speed (e.g. 0.5s / speed)
            sleep_time = max(0.02, (chunk_size / fs) / playback_speed)
            await asyncio.sleep(sleep_time)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket closed with error: {e}")
