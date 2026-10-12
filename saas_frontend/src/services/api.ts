import { PatientAnamnesis, HemodynamicVitals, KalinePrediction, SimulationCase, BenchmarkReport, SelfCorrectionReport } from '../types';

const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const API_BASE = isFileProtocol ? 'http://127.0.0.1:8090/api' : '/api';

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchCases(): Promise<SimulationCase[]> {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) throw new Error('Falha ao obter casos do VitalDB');
  return res.json();
}

export async function fetchCaseDetails(caseid: number): Promise<any> {
  const res = await fetch(`${API_BASE}/cases/${caseid}`);
  if (!res.ok) throw new Error(`Falha ao obter detalhes do caso ${caseid}`);
  return res.json();
}

export async function fetchBenchmark(): Promise<BenchmarkReport> {
  const res = await fetch(`${API_BASE}/benchmark`);
  if (!res.ok) throw new Error('Falha ao obter relatório de benchmark');
  return res.json();
}

export async function fetchSelfCorrectionReport(): Promise<SelfCorrectionReport> {
  const res = await fetch(`${API_BASE}/self-correction`);
  if (!res.ok) throw new Error('Falha ao obter relatório de auto-correção');
  return res.json();
}


export async function requestManualPrediction(
  patient: PatientAnamnesis,
  hemodynamics: HemodynamicVitals,
  waveform?: number[]
): Promise<KalinePrediction> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient,
      hemodynamics: {
        mean_sbp: hemodynamics.sbp,
        mean_dbp: hemodynamics.dbp,
        mean_map: hemodynamics.map,
        heart_rate: hemodynamics.hr,
        ppv: hemodynamics.ppv,
        dp_dt_max: hemodynamics.dp_dt_max,
        decay_constant_tau: hemodynamics.tau || 0.38,
        map_trend_slope: -0.2,
      },
      waveform: waveform || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erro na API' }));
    throw new Error(err.detail || 'Erro ao realizar predição');
  }

  return res.json();
}
