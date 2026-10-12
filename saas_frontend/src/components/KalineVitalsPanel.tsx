import React from 'react';
import { HemodynamicVitals } from '../types';
import { Activity, Heart, Gauge, Zap, Wind, Droplets } from 'lucide-react';

interface KalineVitalsPanelProps {
  vitals: HemodynamicVitals;
}

export const KalineVitalsPanel: React.FC<KalineVitalsPanelProps> = ({ vitals }) => {
  const { sbp, dbp, map, hr, ppv, dp_dt_max, pp } = vitals;

  const isHypotensive = map < 65.0;
  const isPreloadHigh = ppv > 13.0;
  const isInotropyLow = dp_dt_max < 750.0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {/* 1. MAP (Pressão Arterial Média) */}
      <div
        className={`rounded-xl p-3 border flex flex-col justify-between transition-all shadow-xs ${
          isHypotensive
            ? 'bg-red-50 border-red-400 text-red-950'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
          <span>PAM (Média)</span>
          <Gauge className={`h-3.5 w-3.5 ${isHypotensive ? 'text-red-600' : 'text-slate-400'}`} />
        </div>
        <div className="my-1">
          <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isHypotensive ? 'text-red-600' : 'text-slate-900'}`}>
            {map.toFixed(0)}
          </div>
          <span className="text-[10px] font-mono text-slate-500">mmHg</span>
        </div>
        <div className="text-[10px] border-t border-slate-100 pt-1 flex justify-between font-mono">
          <span className="text-slate-500">Alvo &ge;65</span>
          <span className={isHypotensive ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
            {isHypotensive ? 'HIPO' : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* 2. SBP / DBP */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
          <span>PAS / PAD</span>
          <Activity className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <div className="my-1">
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
            {sbp.toFixed(0)} <span className="text-slate-400 font-normal">/</span> {dbp.toFixed(0)}
          </div>
          <span className="text-[10px] font-mono text-slate-500">mmHg</span>
        </div>
        <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1 flex justify-between font-mono">
          <span>PP: {(sbp - dbp).toFixed(0)}</span>
          <span>Radial</span>
        </div>
      </div>

      {/* 3. Heart Rate */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
          <span>FC (Pulso)</span>
          <Heart className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
            {hr.toFixed(0)}
          </div>
          <span className="text-[10px] font-mono text-slate-500">bpm</span>
        </div>
        <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1 font-mono flex justify-between">
          <span>Ritmo</span>
          <span className="text-emerald-700 font-bold">Sinusal</span>
        </div>
      </div>

      {/* 4. VPP (Variação da Pressão de Pulso) */}
      <div
        className={`rounded-xl p-3 border flex flex-col justify-between transition-all shadow-xs ${
          isPreloadHigh
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
          <span>VPP (PPV)</span>
          <Wind className={`h-3.5 w-3.5 ${isPreloadHigh ? 'text-amber-600' : 'text-slate-400'}`} />
        </div>
        <div className="my-1">
          <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isPreloadHigh ? 'text-amber-700' : 'text-slate-900'}`}>
            {ppv.toFixed(1)}
            <span className="text-xs font-normal text-slate-500 ml-0.5">%</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Variação Resp.</span>
        </div>
        <div className="text-[10px] border-t border-slate-100 pt-1 font-mono flex justify-between">
          <span className="text-slate-500">Alvo &le;13%</span>
          <span className={isPreloadHigh ? 'text-amber-700 font-bold' : 'text-slate-600'}>
            {isPreloadHigh ? 'RESPONDE' : 'ESTÁVEL'}
          </span>
        </div>
      </div>

      {/* 5. dP/dt_max (Contratilidade) */}
      <div
        className={`rounded-xl p-3 border flex flex-col justify-between transition-all shadow-xs ${
          isInotropyLow
            ? 'bg-purple-50 border-purple-300 text-purple-950'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
          <span>dP/dt MAX</span>
          <Zap className={`h-3.5 w-3.5 ${isInotropyLow ? 'text-purple-600' : 'text-slate-400'}`} />
        </div>
        <div className="my-1">
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
            {dp_dt_max.toFixed(0)}
          </div>
          <span className="text-[10px] font-mono text-slate-500">mmHg/s</span>
        </div>
        <div className="text-[10px] border-t border-slate-100 pt-1 font-mono flex justify-between">
          <span className="text-slate-500">Inotropia</span>
          <span className={isInotropyLow ? 'text-purple-700 font-bold' : 'text-slate-600'}>
            {isInotropyLow ? 'BAIXA' : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* 6. Volume Sistólico / Débito Estimado */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
          <span>DC ESTIMADO</span>
          <Droplets className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <div className="my-1">
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
            {((pp * 1.4 * hr) / 1000).toFixed(1)}
            <span className="text-xs font-normal text-slate-500 ml-1">L/min</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">VS: ~{Math.round(pp * 1.4)} mL</span>
        </div>
        <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1 font-mono flex justify-between">
          <span>Contorno</span>
          <span className="text-slate-700 font-bold">Estimado</span>
        </div>
      </div>
    </div>
  );
};
