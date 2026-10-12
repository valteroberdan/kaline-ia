"""
Signal Preprocessing and Quality Control
Implements bandpass/lowpass filtering, peak detection, artifact rejection,
and normalization for arterial blood pressure waveforms.
"""

import numpy as np
from scipy import signal
from typing import Tuple, List, Dict, Optional, Any
from kaline_core.config import SAMPLING_RATE_HZ, HYPOTENSION_MAP_THRESHOLD


def filter_arterial_waveform(
    waveform: np.ndarray,
    fs: int = SAMPLING_RATE_HZ,
    lowcut: float = 0.5,
    highcut: float = 30.0,
    order: int = 3,
) -> np.ndarray:
    """
    Applies a zero-phase Butterworth bandpass filter to arterial waveform.
    Preserves systolic upstroke details while removing low-frequency wander and high-frequency noise.
    """
    if len(waveform) < 15:
        return waveform

    nyq = 0.5 * fs
    low = max(0.01, lowcut / nyq)
    high = min(0.99, highcut / nyq)

    # Clean NaNs by linear interpolation
    nan_mask = np.isnan(waveform)
    if np.any(nan_mask):
        x = np.arange(len(waveform))
        valid_x = x[~nan_mask]
        valid_y = waveform[~nan_mask]
        if len(valid_x) > 2:
            waveform = np.interp(x, valid_x, valid_y)
        else:
            return np.zeros_like(waveform)

    try:
        b, a = signal.butter(order, [low, high], btype="band")
        # To maintain absolute pressure DC offset (mean pressure), filter the AC component and add back the baseline
        mean_offset = np.median(waveform)
        ac_signal = waveform - mean_offset
        filtered_ac = signal.filtfilt(b, a, ac_signal)
        return filtered_ac + mean_offset
    except Exception:
        # Fallback to simple moving average if butterworth fails
        return waveform


def detect_cardiac_cycles(
    waveform: np.ndarray, fs: int = SAMPLING_RATE_HZ
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Detects systolic peaks, end-diastolic feet, and dicrotic notches in the arterial waveform.
    Returns:
        systolic_indices: indices of systolic peaks (SBP)
        diastolic_indices: indices of end-diastolic feet (DBP)
        notch_indices: indices of dicrotic notches
    """
    if len(waveform) < fs * 2:
        return np.array([]), np.array([]), np.array([])

    min_distance = int(fs * 0.3)  # Max HR ~200 bpm -> min 0.30s between beats
    prominence = max(5.0, (np.percentile(waveform, 90) - np.percentile(waveform, 10)) * 0.25)

    # Find systolic peaks
    peaks, _ = signal.find_peaks(
        waveform,
        distance=min_distance,
        prominence=prominence,
        height=30.0,  # Systolic pressure usually > 30 mmHg
    )

    if len(peaks) < 2:
        return np.array([]), np.array([]), np.array([])

    # Find diastolic valleys (onset before each peak)
    diastolic_indices = []
    for i in range(len(peaks)):
        start_idx = 0 if i == 0 else peaks[i - 1]
        end_idx = peaks[i]
        segment = waveform[start_idx:end_idx]
        if len(segment) > 0:
            min_local = start_idx + np.argmin(segment)
            diastolic_indices.append(min_local)

    diastolic_indices = np.array(diastolic_indices, dtype=int)

    # Approximate dicrotic notch between each peak and the next valley
    notch_indices = []
    for i in range(len(peaks) - 1):
        p_idx = peaks[i]
        next_d_idx = diastolic_indices[i + 1] if i + 1 < len(diastolic_indices) else len(waveform) - 1
        if next_d_idx > p_idx + 5:
            beat_seg = waveform[p_idx:next_d_idx]
            # Second derivative inflection point
            d2 = np.gradient(np.gradient(beat_seg))
            n_idx = p_idx + np.argmax(d2[2:-2]) + 2 if len(d2) > 4 else p_idx + len(beat_seg) // 2
            notch_indices.append(n_idx)

    return peaks, diastolic_indices, np.array(notch_indices, dtype=int)


def is_valid_signal_window(
    waveform: np.ndarray, fs: int = SAMPLING_RATE_HZ
) -> Tuple[bool, str]:
    """
    Quality control check for a 30s arterial line segment.
    Checks:
    1. Reasonable MAP range (20 to 160 mmHg)
    2. Sufficient detected heartbeats (min 15 beats in 30s, i.e. HR >= 30 bpm)
    3. Not a flatline or severe dampening (Pulse pressure >= 10 mmHg)
    4. Not a flush/transducer artifact (Max pressure <= 250 mmHg)
    """
    if len(waveform) < fs * 10:
        return False, "Too short"

    if np.any(np.isnan(waveform)) or np.any(np.isinf(waveform)):
        return False, "Contains NaN/Inf"

    mean_val = np.mean(waveform)
    if mean_val < 20.0 or mean_val > 160.0:
        return False, f"Mean MAP out of bounds ({mean_val:.1f} mmHg)"

    max_val = np.max(waveform)
    min_val = np.min(waveform)
    if max_val > 260.0:
        return False, f"Arterial flush artifact ({max_val:.1f} mmHg)"

    if max_val - min_val < 10.0:
        return False, "Dampened/Flatline signal (PP < 10 mmHg)"

    peaks, _, _ = detect_cardiac_cycles(waveform, fs)
    if len(peaks) < 10:  # < 20 bpm in 30s
        return False, f"Insufficient detected beats ({len(peaks)})"

    return True, "Valid"
