import React from 'react';
import { ExplainabilityData } from '../types';
import { Stethoscope, CheckCircle2, Info } from 'lucide-react';

interface ExplainabilityCardProps {
  data: ExplainabilityData;
  hpiScore: number;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({
  data,
}) => {
  const { physiological_axes, feature_attributions, clinical_recommendations } = data;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Diagnóstico Etiológico & Explicabilidade IA
            </h3>
            <p className="text-xs text-slate-500">
              Decomposição fisiopatológica dos fatores determinantes do débito cardíaco e PAM
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          SHAP / TreeExplainer
        </span>
      </div>

      {/* 4 Physiological Axes Bar Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Preload */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-800">1. Pré-Carga / Volemia</span>
              <span className="font-mono text-slate-900 font-bold">
                {physiological_axes.preload_responsiveness.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-600 transition-all duration-500 rounded-full"
                style={{ width: `${physiological_axes.preload_responsiveness}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Influenciado por VPP respiratória e volume sistólico.
          </p>
        </div>

        {/* 2. Contractility */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-800">2. Inotropismo Miocárdico</span>
              <span className="font-mono text-slate-900 font-bold">
                {physiological_axes.contractility_deficit.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-500 rounded-full"
                style={{ width: `${physiological_axes.contractility_deficit}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Baseado em dP/dt_max e velocidade de ejeção sistólica.
          </p>
        </div>

        {/* 3. Vasodilation */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-800">3. Vasodilatação / RVS</span>
              <span className="font-mono text-slate-900 font-bold">
                {physiological_axes.vasodilation_index.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 transition-all duration-500 rounded-full"
                style={{ width: `${physiological_axes.vasodilation_index}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Derivado de PAD e decaimento vascular diastólico (Tau).
          </p>
        </div>

        {/* 4. Patient Vulnerability */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-800">4. Fragilidade Basal</span>
              <span className="font-mono text-slate-900 font-bold">
                {physiological_axes.baseline_vulnerability.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 transition-all duration-500 rounded-full"
                style={{ width: `${physiological_axes.baseline_vulnerability}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Score clínico por idade, classificação ASA e comorbidades.
          </p>
        </div>
      </div>

      {/* Feature Attributions Breakdown */}
      <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5 font-mono">
          <Info className="h-3.5 w-3.5 text-slate-600" />
          Principais Biomarcadores Determinantes do Alerta
        </h4>
        <div className="space-y-2">
          {feature_attributions.map((attr, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-white p-2.5 rounded border border-slate-200 gap-2 min-w-0 overflow-hidden"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-slate-900 truncate">{attr.feature}</span>
                <span className="text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                  {attr.value}
                </span>
              </div>
              <div className="text-slate-600 text-[11px] max-w-lg min-w-0">
                {attr.interpretation}
              </div>
              <div className="text-right font-mono font-bold text-slate-900 whitespace-nowrap shrink-0">
                Contribuição: {attr.contribution_pct}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Guidance Recommendations */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5 font-mono">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          Sugestões de Conduta Médica Guiada por IA
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-700">
          {clinical_recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 font-bold">•</span>
              <div dangerouslySetInnerHTML={{ __html: rec }} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
