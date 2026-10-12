"""
Kaline AI Configuration and Clinical Parameters
Defines all sampling rates, clinical thresholds, model horizons, and multi-parametric arterial feature sets.
"""

from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models_checkpoints"
SAMPLE_DATA_DIR = BASE_DIR / "sample_data"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DATA_DIR.mkdir(parents=True, exist_ok=True)

# Clinical Definitions
HYPOTENSION_MAP_THRESHOLD = 65.0  # mmHg (as defined in Lee et al. BJA 2021 & Hatib et al. 2018)
HYPOTENSION_MIN_DURATION_SEC = 60  # minimum 1 minute sustained
NON_HYPOTENSION_MIN_DURATION_SEC = 1200  # minimum 20 minutes stable

# Signal Processing
SAMPLING_RATE_HZ = 100  # Resampled waveform frequency
WINDOW_SECONDS = 30  # 30-second observation window
WINDOW_SAMPLES = SAMPLING_RATE_HZ * WINDOW_SECONDS  # 3000 samples per window

# Target Horizons (in minutes)
PREDICTION_HORIZONS = [5, 10, 15]

# VitalDB Track Names
ART_TRACK = "SNUADC/ART"  # Invasive Arterial Pressure Waveform
ART_MBP_TRACK = "Solar8000/ART_MBP"  # Arterial Mean Pressure
ART_SBP_TRACK = "Solar8000/ART_SBP"  # Arterial Systolic Pressure
ART_DBP_TRACK = "Solar8000/ART_DBP"  # Arterial Diastolic Pressure
HR_TRACK = "Solar8000/HR"  # Heart Rate
PLETH_TRACK = "Solar8000/PLETH"  # Photoplethysmography
ECG_TRACK = "Solar8000/ECG_II"  # Lead II ECG
ETCO2_TRACK = "Solar8000/ETCO2"  # End-tidal CO2

# Clinical & Anthropometric Features
CLINICAL_NUMERIC_FEATURES = [
    "age",
    "height",
    "weight",
    "bmi",
    "preop_hb",
    "preop_plt",
    "preop_cr",
    "preop_glu",
    "preop_alb",
]

CLINICAL_CATEGORICAL_FEATURES = [
    "sex",  # M/F
    "asa",  # 1 to 5
    "emop",  # 0 or 1
    "preop_htn",  # 0 or 1
    "preop_dm",  # 0 or 1
]

# High-Dimensional Multi-Parametric Arterial Biomarkers (54+ features)
HEMODYNAMIC_FEATURES = [
    # 1. Core Pressures & Pressure Ratios
    "mean_sbp",
    "mean_dbp",
    "mean_map",
    "mean_pp",
    "map_pp_ratio",
    "pp_sbp_ratio",
    "dbp_sbp_ratio",
    # 2. Cardiac Cycle Timing & Duty Cycle
    "cycle_duration_ms",
    "sys_time_ms",
    "dia_time_ms",
    "sys_dia_time_ratio",
    "upstroke_time_ms",
    "downstroke_time_ms",
    # 3. Derivatives, Velocities & Curvature (dP/dt and d2P/dt2)
    "dp_dt_max",
    "dp_dt_min",
    "dp_dt_ratio",
    "dp_dt_10",
    "dp_dt_25",
    "dp_dt_50",
    "dp_dt_75",
    "d2p_dt2_max",
    "d2p_dt2_min",
    # 4. Windkessel, Areas & Vascular Compliance
    "auc_systole",
    "auc_diastole",
    "auc_total_beat",
    "auc_sys_dia_ratio",
    "stroke_volume_proxy",
    "cardiac_output_proxy",
    "decay_constant_tau",
    "vascular_resistance_proxy",
    "arterial_compliance_proxy",
    # 5. Dicrotic Notch & Wave Reflections
    "notch_pressure",
    "notch_relative_height",
    "time_to_notch_ms",
    "augmentation_index",
    "diastolic_rebound_amp",
    # 6. Cardiorespiratory Dynamics & Autonomic Modulation
    "heart_rate",
    "ppv",
    "spv",
    "svv_proxy",
    "hrv_sdnn",
    "hrv_rmssd",
    "hrv_pnn50",
    "hrv_cv",
    # 7. Spectral & Frequency-Domain Power (FFT)
    "fft_vlf_power",
    "fft_lf_power",
    "fft_hf_power",
    "fft_lf_hf_ratio",
    "fft_total_power",
    "fft_dominant_freq",
    # 8. Non-Linear Dynamics, Entropy & Higher-Order Statistics
    "sample_entropy",
    "poincare_sd1",
    "poincare_sd2",
    "poincare_ratio",
    "waveform_skewness",
    "waveform_kurtosis",
    # 9. Dynamic 30-second Trend Slopes
    "sbp_trend_slope",
    "map_trend_slope",
    "dbp_trend_slope",
    "pp_trend_slope",
    "dp_dt_trend_slope",
]

ALL_TABULAR_FEATURES = (
    CLINICAL_NUMERIC_FEATURES
    + CLINICAL_CATEGORICAL_FEATURES
    + HEMODYNAMIC_FEATURES
)
