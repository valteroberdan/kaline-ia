import React from 'react';
import { Stethoscope, Wind, Zap, Activity, Droplets, ArrowRight, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { KalinePrediction } from '../types';

interface HemoSpherePhysiologyTreeProps {
  telemetry: KalinePrediction;
}

export const HemoSpherePhysiologyTree: React.FC<HemoSpherePhysiologyTreeProps> = ({ telemetry }) => {
  const { hemodynamic_vitals, predictions, explainability } = telemetry;
  const ppv = hemodynamic_vitals.ppv;
  const dp_dt = hemodynamic_vitals.dp_dt_max;
  const dbp = hemodynamic_vitals.dbp;
  const map = hemodynamic_vitals.map;
  const hr = hemodynamic_vitals.hr;
  const score = predictions.kaline_hpi_score;

  // Diagnostic conditions
  const isPreloadDeficit = ppv > 13.0;
  const isInotropyDeficit = dp_dt < 750.0;
  const isVasodilation = dbp < 55.0 || explainability.physiological_axes.vasodilation_index > 40.0;

  return (
    <div className="bg-[#050914] border-2 border-[#1e293b] rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight uppercase">
              Tela Secundária HPI: Árvore Fisiológica de Decisão
            </h3>
            <p className="text-xs text-slate-400">
              Protocolo de Hemodinâmica Avançada HemoSphere • Rastreamento Etiológico Guiado por IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#0a1122] px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-mono">HPI Atual:</span>
          <span className={`font-mono font-black ${score >= 75 ? 'text-red-400' : score >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {score.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* 3 Main Etiological Decision Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BRANCH 1: PRÉ-CARGA / VOLEMIA */}
        <div
          className={`rounded-2xl p-5 border-2 flex flex-col justify-between transition-all ${
            isPreloadDeficit
              ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-xl shadow-amber-500/10'
              : 'bg-[#0a1122] border-slate-800 text-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Wind className={`h-5 w-5 ${isPreloadDeficit ? 'text-amber-400' : 'text-cyan-400'}`} />
                <span className="font-extrabold text-sm uppercase tracking-wide">1. Pré-Carga (Volemia)</span>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isPreloadDeficit ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}`}>
                {isPreloadDeficit ? 'ALERTA ATIVO' : 'NORMOVOLÊMICO'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-mono bg-black/40 p-2 rounded-lg">
                <span className="text-slate-400">VPP (SVV):</span>
                <span className={`font-bold ${isPreloadDeficit ? 'text-amber-400' : 'text-white'}`}>
                  {ppv.toFixed(1)}% {isPreloadDeficit ? '(> 13% Limiar)' : '(Normal)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-2">
                {isPreloadDeficit
                  ? 'A variação cíclica respiratória da curva arterial excede 13%, indicando que o paciente se encontra na porção ascendente da curva de Frank-Starling.'
                  : 'VPP estável abaixo de 13%. O débito sistólico não apresenta variação respiratória significativa.'}
              </div>
            </div>
          </div>

          <div className={`mt-4 p-3 rounded-xl border text-xs ${isPreloadDeficit ? 'bg-amber-950/60 border-amber-500/60 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Droplets className="h-3.5 w-3.5" /> Conduta HemoSphere Sugerida:
            </div>
            <div>
              {isPreloadDeficit
                ? '👉 **Realizar Prova Volêmica**: Administrar bólus de 250-500ml de cristalóide e reavaliar ΔVS / VPP.'
                : '✅ Manter hidratação basal. Evitar sobrecarga volêmica desnecessária.'}
            </div>
          </div>
        </div>

        {/* BRANCH 2: CONTRATILIDADE / INOTROPIA */}
        <div
          className={`rounded-2xl p-5 border-2 flex flex-col justify-between transition-all ${
            isInotropyDeficit
              ? 'bg-purple-950/40 border-purple-500 text-purple-100 shadow-xl shadow-purple-500/10'
              : 'bg-[#0a1122] border-slate-800 text-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Zap className={`h-5 w-5 ${isInotropyDeficit ? 'text-purple-400' : 'text-indigo-400'}`} />
                <span className="font-extrabold text-sm uppercase tracking-wide">2. Inotropismo Miocárdico</span>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isInotropyDeficit ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-400'}`}>
                {isInotropyDeficit ? 'DEPRESSÃO INOTRÓPICA' : 'PRESERVADO'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-mono bg-black/40 p-2 rounded-lg">
                <span className="text-slate-400">dP/dt max:</span>
                <span className={`font-bold ${isInotropyDeficit ? 'text-purple-400' : 'text-white'}`}>
                  {dp_dt.toFixed(0)} mmHg/s {isInotropyDeficit ? '(< 750 mmHg/s)' : '(Normal)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-2">
                {isInotropyDeficit
                  ? 'A inclinação sistólica da onda de pulso arterial está achatada, refletindo perda da velocidade de ejeção ventricular esquerda.'
                  : 'Inclinação da fase anacrótica adequada. Contratilidade e acoplamento ventrículo-arterial preservados.'}
              </div>
            </div>
          </div>

          <div className={`mt-4 p-3 rounded-xl border text-xs ${isInotropyDeficit ? 'bg-purple-950/60 border-purple-500/60 text-purple-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Zap className="h-3.5 w-3.5" /> Conduta HemoSphere Sugerida:
            </div>
            <div>
              {isInotropyDeficit
                ? '👉 **Otimizar Inotropismo**: Reduzir fração expirada de anestésico inalatório/propofol ou titular inotrópico (ex: Dobutamina/Epinefrina em dose baixa).'
                : '✅ Função inotrópica adequada. Não há indicação de drogas inotrópicas.'}
            </div>
          </div>
        </div>

        {/* BRANCH 3: TÔNUS VASOMOTOR / PÓS-CARGA */}
        <div
          className={`rounded-2xl p-5 border-2 flex flex-col justify-between transition-all ${
            isVasodilation
              ? 'bg-rose-950/40 border-rose-500 text-rose-100 shadow-xl shadow-rose-500/10'
              : 'bg-[#0a1122] border-slate-800 text-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Activity className={`h-5 w-5 ${isVasodilation ? 'text-rose-400' : 'text-pink-400'}`} />
                <span className="font-extrabold text-sm uppercase tracking-wide">3. Tônus Vascular / RVS</span>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isVasodilation ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-400'}`}>
                {isVasodilation ? 'VASOPLEGIA / BAIXA RVS' : 'TÔNUS ADEQUADO'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-mono bg-black/40 p-2 rounded-lg">
                <span className="text-slate-400">PAD / Decaimento:</span>
                <span className={`font-bold ${isVasodilation ? 'text-rose-400' : 'text-white'}`}>
                  PAD {dbp.toFixed(0)} mmHg {isVasodilation ? '(< 55 mmHg)' : '(Normal)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-2">
                {isVasodilation
                  ? 'Decaimento diastólico acelerado na curva de pressão arterial com pressão diastólica deprimida, compatível com vasodilatação sistêmica.'
                  : 'Resistência vascular e pressão diastólica arterial dentro da faixa de autorregulação.'}
              </div>
            </div>
          </div>

          <div className={`mt-4 p-3 rounded-xl border text-xs ${isVasodilation ? 'bg-rose-950/60 border-rose-500/60 text-rose-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Activity className="h-3.5 w-3.5" /> Conduta HemoSphere Sugerida:
            </div>
            <div>
              {isVasodilation
                ? '👉 **Iniciar Vasopressor**: Titular Noradrenalina contínua ou bólus de Fenilefrina/Metaraminol para restaurar a resistência vascular sistêmica.'
                : '✅ Tônus arteriolar preservado.'}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Decision Box */}
      <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-purple-950/40 border border-sky-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-sky-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Diagnóstico Hemodinâmico Integrado Kaline IA
            </div>
            <div className="text-xs text-slate-200 mt-0.5">
              {score >= 75
                ? '🚨 Alerta HPI Elevado: Intervenção antecipada recomendada antes da descompensação da PAM.'
                : score >= 50
                ? '⚠️ Transição em andamento: Avaliar pré-carga e tônus vascular preventivamente.'
                : '✅ Paciente hemodinamicamente estável e compensado.'}
            </div>
          </div>
        </div>

        <div className="text-right whitespace-nowrap text-xs font-mono font-bold text-slate-300 bg-black/60 px-3 py-1.5 rounded-xl border border-slate-800">
          PAM Atual: {map.toFixed(0)} mmHg • FC: {hr.toFixed(0)} bpm
        </div>
      </div>
    </div>
  );
};
