export interface PatientAnamnesis {
  age: number;
  sex: string;
  height: number;
  weight: number;
  bmi?: number;
  asa: number;
  emop: number;
  preop_htn: number;
  preop_dm: number;
  preop_hb: number;
  preop_cr: number;
  preop_glu: number;
  opname?: string;
  department?: string;
}

export interface HemodynamicVitals {
  sbp: number;
  dbp: number;
  map: number;
  pp: number;
  hr: number;
  ppv: number;
  dp_dt_max: number;
  tau?: number;
}

export interface ForecastPoint {
  time_min: number;
  map_est: number;
  map_ci_low: number;
  map_ci_high: number;
  hypo_prob: number;
}

export interface FeatureAttribution {
  feature: string;
  value: string;
  impact: string;
  contribution_pct: number;
  interpretation: string;
}

export interface PhysiologicalAxes {
  preload_responsiveness: number;
  contractility_deficit: number;
  vasodilation_index: number;
  baseline_vulnerability: number;
}

export interface ExplainabilityData {
  physiological_axes: PhysiologicalAxes;
  feature_attributions: FeatureAttribution[];
  clinical_recommendations: string[];
}

export interface KalinePrediction {
  ai_name: string;
  version: string;
  signal_status: {
    valid: boolean;
    message: string;
  };
  hemodynamic_vitals: HemodynamicVitals;
  predictions: {
    kaline_hpi_score: number;
    alert_level: 'NORMAL' | 'WARNING' | 'CRITICAL';
    p_5min: number;
    p_10min: number;
    p_15min: number;
    map_5min: number;
    map_10min: number;
    map_15min: number;
  };
  forecast_trajectory: ForecastPoint[];
  explainability: ExplainabilityData;
}

export interface ClinicalEventMarker {
  time_sec: number;
  label: string;
  type: 'induction' | 'incision' | 'bleeding' | 'hpi_alert' | 'hypotension' | 'vasopressor' | 'transfusion' | 'fluid';
  drug_dose?: string;
  details?: string;
}

export interface SimulationCase {
  caseid: number;
  title: string;
  age: number;
  gender: string;
  asa: number;
  op: string;
  bmi?: number;
  preop_htn?: number;
  preop_dm?: number;
  preop_hb?: number;
  preop_cr?: number;
  scenario?: string;
  risk_profile?: string;
  source?: string;
  ebl_ml?: number;
  transfusion_units?: number;
  vasopressors?: string;
  fluids?: string;
  events?: ClinicalEventMarker[];
}

export interface BenchmarkMetrics {
  auroc: number;
  sensitivity: number;
  specificity: number;
  ppv: number;
  npv: number;
  f1: number;
  mae_map_mmhg: number;
  confusion_matrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
}

export interface BenchmarkHorizon {
  kaline_metrics: BenchmarkMetrics;
  bja_2021_reference: {
    auroc: number;
    sensitivity: number;
    specificity: number;
    ppv: number;
    npv: number;
    mae_map_mmhg: number;
  };
}

export interface BenchmarkReport {
  model_name: string;
  dataset: string;
  target_definition: string;
  horizons: {
    [key: string]: BenchmarkHorizon;
  };
}

export interface TopBiomarker {
  rank: number;
  biomarker: string;
  importance_pct: number;
  category: string;
}

export interface CycleHorizonMetrics {
  auroc: number;
  sensitivity: number;
  specificity: number;
  f1: number;
  mae_map_mmhg: number;
  threshold: number;
}

export interface CycleHistoryItem {
  cycle: number;
  name: string;
  action: string;
  mean_auroc: number;
  mean_mae_map: number;
  horizons: {
    [key: string]: CycleHorizonMetrics;
  };
}

export interface SelfCorrectionReport {
  ai_name: string;
  version: string;
  status: string;
  total_biomarkers_evaluated: number;
  top_biomarkers: TopBiomarker[];
  cycles_history: CycleHistoryItem[];
  optimal_thresholds: {
    [key: string]: number;
  };
  final_test_metrics: {
    [key: string]: {
      auroc: number;
      sensitivity: number;
      specificity: number;
      f1: number;
      mae_map_mmhg: number;
      threshold: number;
    };
  };
  benchmark_comparison: {
    [key: string]: BenchmarkHorizon;
  };
}

