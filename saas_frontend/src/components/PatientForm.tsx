import React, { useState } from 'react';
import { PatientAnamnesis, HemodynamicVitals, KalinePrediction } from '../types';
import { requestManualPrediction } from '../services/api';
import { User, Activity, Sparkles, AlertCircle } from 'lucide-react';
import { KalineHPIGauge } from './KalineHPIGauge';
import { ForecastTrend } from './ForecastTrend';
import { ExplainabilityCard } from './ExplainabilityCard';

export const PatientForm: React.FC = () => {
  const [patient, setPatient] = useState<PatientAnamnesis>({
    age: 68,
    sex: 'M',
    height: 172,
    weight: 76,
    asa: 3,
    emop: 0,
    preop_htn: 1,
    preop_dm: 1,
    preop_hb: 11.5,
    preop_cr: 1.3,
    preop_glu: 125,
  });

  const [hemodynamics, setHemodynamics] = useState<HemodynamicVitals>({
    sbp: 108,
    dbp: 62,
    map: 77,
    pp: 46,
    hr: 78,
    ppv: 14.5,
    dp_dt_max: 680,
    tau: 0.42,
  });

  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<KalinePrediction | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const calculateBmi = () => {
    const h = patient.height / 100;
    return (patient.weight / (h * h)).toFixed(1);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await requestManualPrediction(patient, hemodynamics);
      setPredictionResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar predição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Calculadora Clínica & Avaliação Ad-Hoc Kaline IA
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Insira o perfil do paciente e os parâmetros hemodinâmicos para estimar o risco em 5, 10 e 15 min
            </p>
          </div>
        </div>

        <form onSubmit={handlePredict} className="space-y-5">
          {/* Section 1: Anthropometrics & Clinical History */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5 font-mono">
              <User className="h-3.5 w-3.5 text-slate-600" />
              1. Dados Antropométricos e Histórico de Saúde
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Idade (anos)</label>
                <input
                  type="number"
                  value={patient.age}
                  onChange={(e) => setPatient({ ...patient, age: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Sexo Biológico</label>
                <select
                  value={patient.sex}
                  onChange={(e) => setPatient({ ...patient, sex: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Altura (cm)</label>
                <input
                  type="number"
                  value={patient.height}
                  onChange={(e) => setPatient({ ...patient, height: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Peso (kg)</label>
                <input
                  type="number"
                  value={patient.weight}
                  onChange={(e) => setPatient({ ...patient, weight: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">IMC Calculado</label>
                <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 mt-1 font-bold">
                  {calculateBmi()} kg/m²
                </div>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Estado Físico ASA</label>
                <select
                  value={patient.asa}
                  onChange={(e) => setPatient({ ...patient, asa: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                >
                  <option value={1}>ASA I - Saudável</option>
                  <option value={2}>ASA II - Sistêmica Leve</option>
                  <option value={3}>ASA III - Grave</option>
                  <option value={4}>ASA IV - Risco Vida</option>
                  <option value={5}>ASA V - Moribundo</option>
                </select>
              </div>
            </div>

            {/* Comorbidities & Labs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mt-3">
              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Hipertensão (HAS)</label>
                <select
                  value={patient.preop_htn}
                  onChange={(e) => setPatient({ ...patient, preop_htn: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                >
                  <option value={1}>Sim</option>
                  <option value={0}>Não</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Diabetes (DM)</label>
                <select
                  value={patient.preop_dm}
                  onChange={(e) => setPatient({ ...patient, preop_dm: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                >
                  <option value={1}>Sim</option>
                  <option value={0}>Não</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Emergência</label>
                <select
                  value={patient.emop}
                  onChange={(e) => setPatient({ ...patient, emop: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                >
                  <option value={0}>Não (Eletiva)</option>
                  <option value={1}>Sim (Urgência)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Hb (g/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.preop_hb}
                  onChange={(e) => setPatient({ ...patient, preop_hb: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Creatinina (mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.preop_cr}
                  onChange={(e) => setPatient({ ...patient, preop_cr: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Hemodynamic Biomarkers */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5 font-mono">
              <Activity className="h-3.5 w-3.5 text-slate-600" />
              2. Parâmetros da Linha Arterial & Biomarcadores HPI
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">PAS (Sistólica)</label>
                <input
                  type="number"
                  value={hemodynamics.sbp}
                  onChange={(e) => {
                    const s = Number(e.target.value);
                    const m = Math.round((s + 2 * hemodynamics.dbp) / 3);
                    setHemodynamics({ ...hemodynamics, sbp: s, map: m });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">PAD (Diastólica)</label>
                <input
                  type="number"
                  value={hemodynamics.dbp}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    const m = Math.round((hemodynamics.sbp + 2 * d) / 3);
                    setHemodynamics({ ...hemodynamics, dbp: d, map: m });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">PAM (Média)</label>
                <input
                  type="number"
                  value={hemodynamics.map}
                  onChange={(e) => setHemodynamics({ ...hemodynamics, map: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 font-bold mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">FC (bpm)</label>
                <input
                  type="number"
                  value={hemodynamics.hr}
                  onChange={(e) => setHemodynamics({ ...hemodynamics, hr: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">VPP (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={hemodynamics.ppv}
                  onChange={(e) => setHemodynamics({ ...hemodynamics, ppv: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 font-bold mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-mono">dP/dt max</label>
                <input
                  type="number"
                  value={hemodynamics.dp_dt_max}
                  onChange={(e) => setHemodynamics({ ...hemodynamics, dp_dt_max: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 font-bold mt-1 focus:ring-1 focus:ring-slate-700 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? 'Calculando Predição...' : 'CALCULAR PREDIÇÃO COM KALINE IA'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 font-mono">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>

      {/* Prediction Result Display */}
      {predictionResult && (
        <div className="space-y-5 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <KalineHPIGauge
              score={predictionResult.predictions.kaline_hpi_score}
              alertLevel={predictionResult.predictions.alert_level}
              p5={predictionResult.predictions.p_5min}
              p10={predictionResult.predictions.p_10min}
              p15={predictionResult.predictions.p_15min}
              map5={predictionResult.predictions.map_5min}
              map10={predictionResult.predictions.map_10min}
              map15={predictionResult.predictions.map_15min}
            />

            <ForecastTrend
              currentMap={predictionResult.hemodynamic_vitals.map}
              trajectory={predictionResult.forecast_trajectory}
              map5={predictionResult.predictions.map_5min}
              map10={predictionResult.predictions.map_10min}
              map15={predictionResult.predictions.map_15min}
            />
          </div>

          <ExplainabilityCard
            data={predictionResult.explainability}
            hpiScore={predictionResult.predictions.kaline_hpi_score}
          />
        </div>
      )}
    </div>
  );
};
