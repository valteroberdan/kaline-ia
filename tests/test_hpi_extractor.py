"""
Unit Tests for Kaline Signal Preprocessing and HPI Feature Extraction
"""

import pytest
import numpy as np
from kaline_core.dataset.preprocessor import (
    filter_arterial_waveform,
    detect_cardiac_cycles,
    is_valid_signal_window,
)
from kaline_core.dataset.hpi_extractor import extract_hemodynamic_features


def test_filter_arterial_waveform():
    fs = 100
    t = np.linspace(0, 30, 3000)
    # Synthetic pulse + 60 Hz electrical noise + DC drift
    raw = 80.0 + 30.0 * np.sin(2 * np.pi * 1.2 * t) + 5.0 * np.sin(2 * np.pi * 60.0 * t) + 2.0 * t
    filtered = filter_arterial_waveform(raw, fs)

    assert len(filtered) == len(raw)
    assert not np.any(np.isnan(filtered))
    # Check that high-frequency 60Hz noise was smoothed
    assert np.std(np.diff(filtered)) < np.std(np.diff(raw))


def test_detect_cardiac_cycles():
    fs = 100
    t = np.linspace(0, 10, 1000)
    # 72 bpm -> 1.2 Hz -> 12 beats in 10s
    raw = 75.0 + 35.0 * (np.sin(2 * np.pi * 1.2 * t) ** 2)
    peaks, feet, notches = detect_cardiac_cycles(raw, fs)

    assert len(peaks) >= 8
    assert len(feet) >= 8


def test_is_valid_signal_window():
    fs = 100
    t = np.linspace(0, 30, 3000)
    # Good signal
    good = 75.0 + 35.0 * np.sin(2 * np.pi * 1.2 * t)
    valid, msg = is_valid_signal_window(good, fs)
    assert valid is True

    # Flatline
    flat = np.full(3000, 80.0)
    valid_flat, _ = is_valid_signal_window(flat, fs)
    assert valid_flat is False

    # Out of bounds pressure
    extreme = np.full(3000, 280.0)
    valid_ext, _ = is_valid_signal_window(extreme, fs)
    assert valid_ext is False


def test_extract_hemodynamic_features():
    fs = 100
    t = np.linspace(0, 30, 3000)
    # Synthetic arterial waveform with 1.2 Hz (72 bpm), SBP ~115, DBP ~75
    raw = 75.0 + 40.0 * np.maximum(0.0, np.sin(2 * np.pi * 1.2 * t))
    feats = extract_hemodynamic_features(raw, fs)

    assert "mean_sbp" in feats
    assert "mean_dbp" in feats
    assert "mean_map" in feats
    assert "ppv" in feats
    assert "dp_dt_max" in feats
    assert "heart_rate" in feats

    assert 100 <= feats["mean_sbp"] <= 130
    assert 60 <= feats["mean_dbp"] <= 85
    assert 55 <= feats["heart_rate"] <= 85
    assert feats["dp_dt_max"] > 100
