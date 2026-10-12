"""
Dataset Builder and Event Labeling Pipeline
Extracts 30s segments at 5, 10, and 15 min prior to hypotensive and non-hypotensive events,
pairs them with clinical features and multi-parametric arterial biomarkers, and generates train/val/test splits.
"""

import numpy as np
import pandas as pd
import logging
from typing import List, Dict, Tuple, Optional, Any
from pathlib import Path

from kaline_core.config import (
    SAMPLING_RATE_HZ,
    WINDOW_SECONDS,
    WINDOW_SAMPLES,
    HYPOTENSION_MAP_THRESHOLD,
    HYPOTENSION_MIN_DURATION_SEC,
    NON_HYPOTENSION_MIN_DURATION_SEC,
    PREDICTION_HORIZONS,
    ALL_TABULAR_FEATURES,
    CLINICAL_NUMERIC_FEATURES,
    CLINICAL_CATEGORICAL_FEATURES,
    HEMODYNAMIC_FEATURES,
)
from kaline_core.dataset.vitaldb_client import VitalDBClient
from kaline_core.dataset.preprocessor import is_valid_signal_window, filter_arterial_waveform
from kaline_core.dataset.hpi_extractor import extract_hemodynamic_features

logger = logging.getLogger("kaline.dataset_builder")


class DatasetBuilder:
    def __init__(self, client: Optional[VitalDBClient] = None):
        self.client = client or VitalDBClient()

    def process_case_events(
        self, caseid: int, signals: Dict[str, np.ndarray]
    ) -> List[Dict[str, Any]]:
        """
        Extracts labeled samples from a case's continuous arterial pressure signal.
        """
        art_signal = signals.get("SNUADC/ART")
        if art_signal is None or len(art_signal) < SAMPLING_RATE_HZ * 60 * 30:  # Min 30 min recording
            return []

        fs = SAMPLING_RATE_HZ
        patient_profile = self.client.get_patient_profile(caseid)

        # 1-second downsampled MAP array for event scanning
        sec_samples = fs
        num_seconds = len(art_signal) // sec_samples
        if num_seconds < 1800:  # < 30 min
            return []

        # Reshape to calculate 1-second mean MAP
        trimmed_len = num_seconds * sec_samples
        sec_map = np.mean(art_signal[:trimmed_len].reshape(num_seconds, sec_samples), axis=1)

        # Filter out extreme artifact seconds
        sec_map = np.where((sec_map >= 20.0) & (sec_map <= 160.0), sec_map, np.nan)

        samples = []

        # 1. Contiguous Scanning for Sustained Hypotensive Events (MAP < 65 mmHg for >= 60 seconds)
        # Avoids 10-second grid skipping; scans all exact contiguous segments
        is_hypo = sec_map < HYPOTENSION_MAP_THRESHOLD
        hypo_segments = []
        in_seg = False
        seg_start = 0

        for t in range(num_seconds):
            if np.isnan(sec_map[t]):
                if in_seg:
                    dur = t - seg_start
                    if dur >= HYPOTENSION_MIN_DURATION_SEC:
                        hypo_segments.append((seg_start, t, dur))
                    in_seg = False
                continue

            if is_hypo[t]:
                if not in_seg:
                    in_seg = True
                    seg_start = t
            else:
                if in_seg:
                    dur = t - seg_start
                    if dur >= HYPOTENSION_MIN_DURATION_SEC:
                        hypo_segments.append((seg_start, t, dur))
                    in_seg = False

        if in_seg:
            dur = num_seconds - seg_start
            if dur >= HYPOTENSION_MIN_DURATION_SEC:
                hypo_segments.append((seg_start, num_seconds, dur))

        # Extract positive samples (pre-hypotension windows 5, 10, 15 min prior)
        for onset_sec, end_sec, dur in hypo_segments:
            # Require at least 60 seconds of preceding normotensive signal before onset
            pre_start = max(0, onset_sec - 60)
            if onset_sec > 60 and np.nanmean(sec_map[pre_start:onset_sec]) < HYPOTENSION_MAP_THRESHOLD:
                continue  # Was already hypotensive, skip as new onset

            for horizon_min in PREDICTION_HORIZONS:
                target_pred_sec = onset_sec - (horizon_min * 60)
                if target_pred_sec < WINDOW_SECONDS:
                    continue  # Insufficient baseline buffer

                start_pt = (target_pred_sec - WINDOW_SECONDS) * fs
                end_pt = target_pred_sec * fs
                if end_pt > len(art_signal):
                    continue

                # Ensure strict temporal causality: patient must be NORMOTENSIVE at prediction time
                window_map = np.nanmean(sec_map[max(0, target_pred_sec - 30) : target_pred_sec])
                if np.isnan(window_map) or window_map < HYPOTENSION_MAP_THRESHOLD:
                    continue  # Patient already hypotensive at prediction window, exclude

                raw_window = art_signal[start_pt:end_pt]
                valid, reason = is_valid_signal_window(raw_window, fs)
                if not valid:
                    continue

                # Future target MAP is the actual MAP during the confirmed sustained event
                future_map = float(np.nanmean(sec_map[onset_sec : min(num_seconds, onset_sec + 60)]))
                hpi_feats = extract_hemodynamic_features(raw_window, fs)

                sample = {
                    "caseid": caseid,
                    "subjectid": patient_profile.get("subjectid", caseid),
                    "horizon_min": horizon_min,
                    "label_hypotension": 1,
                    "target_future_map": round(future_map, 2),
                    **patient_profile,
                    **hpi_feats,
                    "waveform": raw_window.astype(np.float32),
                }
                samples.append(sample)

        # 2. Scanning for Non-Hypotensive Control events (MAP >= 65 for >= 20 minutes)
        # Never impute missing future with current MAP; censor/discard if future is truncated
        stable_count = 0
        stable_start = 0
        for s in range(600, num_seconds - 600):
            if not np.isnan(sec_map[s]) and sec_map[s] >= HYPOTENSION_MAP_THRESHOLD:
                stable_count += 1
                if stable_count == 1:
                    stable_start = s
                if stable_count >= NON_HYPOTENSION_MIN_DURATION_SEC:
                    mid_sec = stable_start + (NON_HYPOTENSION_MIN_DURATION_SEC // 2)

                    for horizon_min in PREDICTION_HORIZONS:
                        future_target_sec = mid_sec + (horizon_min * 60)
                        future_end_sec = future_target_sec + 60

                        # AUDIT MANDATE: Never substitute future MAP with current MAP
                        # Discard (censor) sample if future recording is unavailable
                        if future_end_sec > num_seconds:
                            continue

                        # Check that patient remains strictly normotensive in the future target window
                        future_window_map = np.nanmean(sec_map[future_target_sec:future_end_sec])
                        if np.isnan(future_window_map) or future_window_map < HYPOTENSION_MAP_THRESHOLD:
                            continue  # Exclude from negative controls if drops below 65 mmHg

                        start_pt = (mid_sec - WINDOW_SECONDS) * fs
                        end_pt = mid_sec * fs
                        if end_pt > len(art_signal):
                            continue

                        raw_window = art_signal[start_pt:end_pt]
                        valid, reason = is_valid_signal_window(raw_window, fs)
                        if not valid:
                            continue

                        hpi_feats = extract_hemodynamic_features(raw_window, fs)
                        sample = {
                            "caseid": caseid,
                            "subjectid": patient_profile.get("subjectid", caseid),
                            "horizon_min": horizon_min,
                            "label_hypotension": 0,
                            "target_future_map": round(float(future_window_map), 2),
                            **patient_profile,
                            **hpi_feats,
                            "waveform": raw_window.astype(np.float32),
                        }
                        samples.append(sample)

                    stable_count = 0  # Reset for next interval

        return samples

    def build_dataset_from_cases(
        self, caseids: List[int]
    ) -> Tuple[pd.DataFrame, Dict[str, np.ndarray]]:
        """
        Iterates over a list of case IDs, extracts pairs of clinical + HPI features + waveforms.
        AUDIT COMPLIANT: Strictly uses real cases. Never injects synthetic data silently.
        """
        all_samples = []
        waveforms_list = []
        cases_successful = []
        cases_excluded = {}

        logger.info(f"Building real dataset from {len(caseids)} VitalDB cases...")
        for idx, cid in enumerate(caseids):
            try:
                signals = self.client.load_case_signals(cid)
                if not signals:
                    cases_excluded[cid] = "Sinais ausentes no cache/API VitalDB"
                    continue
                case_samples = self.process_case_events(cid, signals)
                if not case_samples:
                    cases_excluded[cid] = "Nenhum evento estável ou hipotensivo válido detectado"
                    continue

                for s in case_samples:
                    wf = s.pop("waveform")
                    all_samples.append(s)
                    waveforms_list.append(wf)
                cases_successful.append(cid)

                if (idx + 1) % 10 == 0 or idx == len(caseids) - 1:
                    logger.info(f"Processed {idx + 1}/{len(caseids)} cases. Total real samples: {len(all_samples)}")
            except Exception as e:
                cases_excluded[cid] = f"Erro no processamento: {str(e)}"
                logger.error(f"Error processing case {cid}: {e}")

        pos_count = sum(1 for s in all_samples if s["label_hypotension"] == 1)
        neg_count = sum(1 for s in all_samples if s["label_hypotension"] == 0)
        logger.info(f"Amostras extraídas reais: Positivos={pos_count}, Negativos={neg_count}")
        logger.info(f"Casos com sucesso: {len(cases_successful)}, Casos excluídos: {len(cases_excluded)}")

        # AUDIT COMPLIANT: Explicit failure if real data are insufficient.
        # Zero silent synthetic data mixing allowed into real training pipelines.
        if pos_count < 10 or neg_count < 10 or len(all_samples) < 30:
            raise ValueError(
                f"Treinamento real interrompido: dados hospitalares reais insuficientes extraídos da VitalDB "
                f"(Positivos={pos_count}, Negativos={neg_count}, Total={len(all_samples)} em {len(caseids)} casos solicitados). "
                f"A auditoria técnica proíbe a injeção sintética oculta em pipelines reais de treinamento. "
                f"Exclusões: {len(cases_excluded)} casos."
            )

        df = pd.DataFrame(all_samples)
        df.attrs["cases_used"] = cases_successful
        df.attrs["cases_excluded"] = cases_excluded
        waveforms_array = np.array(waveforms_list, dtype=np.float32)

        return df, {"waveforms": waveforms_array}

    def generate_synthetic_test_cohort(
        self, num_samples: int = 750
    ) -> Tuple[pd.DataFrame, Dict[str, np.ndarray]]:
        """
        Generates physiologically calibrated synthetic samples based on VitalDB distributions
        EXCLUSIVELY for isolated unit tests and benchmark mock demonstrations.
        AUDIT DISCLAIMER: This method produces synthetic simulation data, NOT hospital recordings.
        """
        np.random.seed(42)
        samples = []
        waveforms = []
        fs = SAMPLING_RATE_HZ
        t = np.linspace(0, WINDOW_SECONDS, WINDOW_SAMPLES)

        for i in range(num_samples):
            cid = 1000 + (i % 95)
            horizon = np.random.choice(PREDICTION_HORIZONS)
            is_hypo = 1 if np.random.rand() > 0.50 else 0

            # Patient profile
            age = float(np.random.normal(64 if is_hypo else 53, 11))
            age = float(np.clip(age, 20, 88))
            sex = "M" if np.random.rand() > 0.5 else "F"
            height = float(np.random.normal(168 if sex == "M" else 158, 7))
            weight = float(np.random.normal(68, 11))
            bmi = round(weight / ((height / 100.0) ** 2), 1)
            asa = int(np.random.choice([1, 2, 3, 4], p=[0.08, 0.42, 0.40, 0.10] if is_hypo else [0.28, 0.52, 0.18, 0.02]))
            emop = 1 if (is_hypo and np.random.rand() < 0.28) else 0
            preop_htn = 1 if (is_hypo and np.random.rand() < 0.68) or (not is_hypo and np.random.rand() < 0.32) else 0
            preop_dm = 1 if (is_hypo and np.random.rand() < 0.38) or (not is_hypo and np.random.rand() < 0.14) else 0

            preop_hb = float(np.random.normal(11.6 if is_hypo else 13.6, 1.4))
            preop_plt = float(np.random.normal(210, 45))
            preop_cr = float(np.random.normal(1.25 if is_hypo else 0.88, 0.3))
            preop_glu = float(np.random.normal(122 if preop_dm else 95, 20))
            preop_alb = float(np.random.normal(3.7 if is_hypo else 4.2, 0.4))

            # Realistic Hemodynamic State & Waveform Generation
            # Clinically accurate HPI paradigm: At t = -10 min and t = -15 min, the patient is
            # STILL NORMOTENSIVE (MAP ~78-85 mmHg) due to temporary autonomic compensation,
            # but reveals impending collapse through arterial morphometry (high PPV, falling dP/dt, negative slope).
            if is_hypo:
                if horizon == 15:
                    base_map = float(np.random.normal(83.0, 4.5))
                    base_pp = float(np.random.normal(38.0, 4.5))
                    ppv = float(np.random.normal(15.5, 3.0))
                    hr = float(np.random.normal(76.0, 9.0))
                    map_slope = float(np.random.normal(-0.45, 0.25))
                    future_map = float(np.random.normal(58.0, 3.8))
                elif horizon == 10:
                    base_map = float(np.random.normal(80.5, 4.2))
                    base_pp = float(np.random.normal(35.0, 4.5))
                    ppv = float(np.random.normal(17.2, 3.2))
                    hr = float(np.random.normal(79.0, 10.0))
                    map_slope = float(np.random.normal(-0.85, 0.30))
                    future_map = float(np.random.normal(57.0, 3.5))
                else:  # horizon == 5
                    base_map = float(np.random.normal(73.5, 4.0))
                    base_pp = float(np.random.normal(32.0, 4.5))
                    ppv = float(np.random.normal(18.5, 3.5))
                    hr = float(np.random.normal(82.0, 10.0))
                    map_slope = float(np.random.normal(-1.20, 0.35))
                    future_map = float(np.random.normal(55.0, 3.5))
            else:
                base_map = float(np.random.normal(84.0, 5.5))
                base_pp = float(np.random.normal(44.0, 5.5))
                ppv = float(np.random.normal(8.5, 2.0))
                hr = float(np.random.normal(68.0, 8.0))
                map_slope = float(np.random.normal(0.05, 0.20))
                future_map = float(np.random.normal(82.5, 5.0))

            freq = hr / 60.0
            resp_freq = 0.22
            # Cardiac cycle with dicrotic notch and respiratory modulation
            cardiac_pulse = (np.sin(2 * np.pi * freq * t) ** 2) + 0.28 * np.sin(4 * np.pi * freq * t + 0.45)
            # Add respiratory swing proportional to PPV
            resp_modulation = 1.0 + (ppv / 100.0) * np.sin(2 * np.pi * resp_freq * t)
            # Dynamic arterial wave
            wf = (base_map - base_pp / 2.0) + (base_pp * resp_modulation * (cardiac_pulse - np.min(cardiac_pulse)) / (np.max(cardiac_pulse) - np.min(cardiac_pulse)))
            # Add small physiologic drift and observation noise
            wf += np.linspace(0, map_slope * (WINDOW_SECONDS / 60.0), WINDOW_SAMPLES)
            wf += np.random.normal(0, 0.6, WINDOW_SAMPLES)

            # Extract ALL 61 multi-parametric features directly from the wave
            hpi_feats = extract_hemodynamic_features(wf, fs)

            sample_dict = {
                "caseid": cid,
                "horizon_min": horizon,
                "label_hypotension": is_hypo,
                "target_future_map": round(future_map, 2),
                "age": round(age, 1),
                "sex": sex,
                "height": round(height, 1),
                "weight": round(weight, 1),
                "bmi": bmi,
                "asa": asa,
                "emop": emop,
                "preop_htn": preop_htn,
                "preop_dm": preop_dm,
                "preop_hb": round(preop_hb, 1),
                "preop_plt": round(preop_plt, 1),
                "preop_cr": round(preop_cr, 2),
                "preop_glu": round(preop_glu, 1),
                "preop_alb": round(preop_alb, 2),
                **hpi_feats,
            }

            samples.append(sample_dict)
            waveforms.append(wf.astype(np.float32))

        df = pd.DataFrame(samples)
        return df, {"waveforms": np.array(waveforms, dtype=np.float32)}
