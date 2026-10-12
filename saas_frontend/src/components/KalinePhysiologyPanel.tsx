import React from 'react';
import { Stethoscope, Wind, Zap, Activity, CheckCircle, Info } from 'lucide-react';
import { KalinePrediction } from '../types';

interface KalinePhysiologyPanelProps {
  telemetry: KalinePrediction;
}

export const KalinePhysiologyPanel: React.FC<KalinePhysiologyPanelProps> = ({
  telemetry,
}) => {
  const { hemodynamic_vitals, predictions, explainability } = telemetry;
  const { physiological_axes, clinical_recommendations } = explainability;

  const ppv = hemodynamic_vitals.ppv;
  const dp_dt = hemodynamic_vitals.dp_dt_max;
  const dbp = hemodynamic_vitals.dbp;
  const score = predictions?.kaline_hpi_score ?? 0;

  const isPreloadHigh = ppv > 13.0;
  const isInotropyLow = dp_dt < 750.0;
  const isVasodilation = dbp < 55.0 || physiological_axes.vasodilation_index > 40.0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight uppercase font-mono">
              Análise Fisiopatológica & Decisão Clínica
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Decomposição dos determinantes hemodinâmicos da PAM e sugestões terapêuticas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-xs font-mono self-start sm:self-auto">
          <span className="text-slate-500">HPI:</span>
          {predictions ? (
            <span
              className={`font-bold ${
                score >= 75 ? 'text-red-600' : score >= 50 ? 'text-amber-600' : 'text-emerald-700'
              }`}
            >
              {score.toFixed(0)}%
            </span>
          ) : (
            <span className="text-slate-500 font-bold">--</span>
          )}
        </div>
      </div>

      {/* 4 Hemodynamic Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Pré-Carga */}
        <div
          className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between ${
            isPreloadHigh
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 uppercase font-mono text-slate-700">
                <Wind className="h-4 w-4 text-amber-600" /> 1. Pré-Carga
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isPreloadHigh ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isPreloadHigh ? 'RESPONSIVO' : 'ESTÁVEL'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono my-1 text-slate-900">
              {ppv.toFixed(1)}% <span className="text-xs font-normal text-slate-500">VPP</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isPreloadHigh ? 'VPP > 13%: Indica responsividade a volume.' : 'VPP ≤ 13%: Volemia intravascular adequada.'}
            </p>
          </div>
        </div>

        {/* 2. Inotropismo */}
        <div
          className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between ${
            isInotropyLow
              ? 'bg-purple-50 border-purple-300 text-purple-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 uppercase font-mono text-slate-700">
                <Zap className="h-4 w-4 text-purple-600" /> 2. Inotropismo
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isInotropyLow ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isInotropyLow ? 'DEPRIMIDO' : 'PRESERVADO'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono my-1 text-slate-900">
              {dp_dt.toFixed(0)} <span className="text-xs font-normal text-slate-500">mmHg/s</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isInotropyLow ? 'dP/dt < 750: Alerta de contratilidade reduzida.' : 'Contratilidade e ejeção preservadas.'}
            </p>
          </div>
        </div>

        {/* 3. Tônus Vasomotor */}
        <div
          className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between ${
            isVasodilation
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 uppercase font-mono text-slate-700">
                <Activity className="h-4 w-4 text-rose-600" /> 3. Pós-Carga / RVS
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isVasodilation ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isVasodilation ? 'VASODILATAÇÃO' : 'NORMAL'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono my-1 text-slate-900">
              {dbp.toFixed(0)} <span className="text-xs font-normal text-slate-500">mmHg (PAD)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isVasodilation ? 'PAD < 55 mmHg: Perda de tônus vascular periférico.' : 'Tônus arteriolar dentro do esperado.'}
            </p>
          </div>
        </div>

        {/* 4. Vulnerabilidade Basal */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between text-slate-800">
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 uppercase font-mono text-slate-700">
                <Info className="h-4 w-4 text-slate-600" /> 4. Perfil Clínico
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                ASA / IDADE
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono my-1 text-slate-900">
              {physiological_axes.baseline_vulnerability.toFixed(0)}%
            </div>
            <p className="text-[11px] text-slate-500">
              Score basal de risco clínico (idade, classificação ASA e histórico prévio).
            </p>
          </div>
        </div>
      </div>

      {/* Clinical Guidance Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 font-mono">
          <CheckCircle className="h-4 w-4 text-slate-700" />
          Recomendações Clínicas Estruturadas
        </h4>
        <div className="space-y-2 text-xs">
          {clinical_recommendations.map((rec, i) => (
            <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 text-[11px] sm:text-xs">
              <span dangerouslySetInnerHTML={{ __html: rec }} />
            </div>
          ))}
        </div>
      </div>

      {/* Morphometry & Self-Correction Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-slate-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-slate-600" />
            Morfometria Multi-Paramétrica da Curva Arterial
          </span>
          <p className="text-[11px] text-slate-600">
            A Kaline IA decompõe a onda a 100 Hz em 61 biomarcadores (Entropia SampEn, dP/dt, Áreas Windkessel, Reflexão de Onda e Dinâmica Respiratória), auto-corrigidos através de mineração focal.
          </p>
        </div>
      </div>
    </div>
  );
};
