import React from 'react';
import { HemodynamicVitals } from '../types';
import { Heart, Activity, Gauge, Zap, Wind } from 'lucide-react';

interface VitalBadgesProps {
  vitals: HemodynamicVitals;
}

export const VitalBadges: React.FC<VitalBadgesProps> = ({ vitals }) => {
  const { sbp, dbp, map, hr, ppv, dp_dt_max, pp } = vitals;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. SBP / DBP */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
            PAS / PAD
          </span>
          <Activity className="h-4 w-4 text-red-400" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            {sbp.toFixed(0)} <span className="text-slate-500 font-normal">/</span> {dbp.toFixed(0)}
          </div>
          <span className="text-[10px] text-slate-400">mmHg (Arterial)</span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-1.5">
          <span>PP: {(sbp - dbp).toFixed(0)} mmHg</span>
        </div>
      </div>

      {/* 2. MAP (Mean Arterial Pressure) */}
      <div
        className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all ${
          map < 65
            ? 'bg-red-950/40 border-red-500/60 text-red-200'
            : map < 75
            ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
            : 'bg-[#0f172a] border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400">
          <span
            className={`text-xs font-mono font-bold uppercase tracking-wider ${
              map < 65 ? 'text-red-400' : 'text-sky-400'
            }`}
          >
            PAM (Média)
          </span>
          <Gauge className={`h-4 w-4 ${map < 65 ? 'text-red-400' : 'text-sky-400'}`} />
        </div>
        <div className="my-1.5">
          <div
            className={`text-3xl font-black font-mono tracking-tight ${
              map < 65 ? 'text-red-400 animate-pulse' : 'text-sky-400'
            }`}
          >
            {map.toFixed(0)}
          </div>
          <span className="text-[10px] text-slate-400">mmHg</span>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5">
          <span>{map < 65 ? '🚨 HIPOTENSÃO ATIVA' : 'Perfusão Adequada'}</span>
        </div>
      </div>

      {/* 3. Heart Rate */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            FC (Pulso)
          </span>
          <Heart className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="my-1.5">
          <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
            {hr.toFixed(0)}
          </div>
          <span className="text-[10px] text-slate-400">bpm</span>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5">
          <span>Ritmo Sinusal</span>
        </div>
      </div>

      {/* 4. PPV (Variação de Pressão de Pulso) */}
      <div
        className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all ${
          ppv > 13.0
            ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
            : 'bg-[#0f172a] border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400">
          <span
            className={`text-xs font-mono font-bold uppercase tracking-wider ${
              ppv > 13.0 ? 'text-amber-400' : 'text-cyan-400'
            }`}
          >
            VPP (PPV)
          </span>
          <Wind className={`h-4 w-4 ${ppv > 13.0 ? 'text-amber-400' : 'text-cyan-400'}`} />
        </div>
        <div className="my-1.5">
          <div
            className={`text-3xl font-black font-mono tracking-tight ${
              ppv > 13.0 ? 'text-amber-400' : 'text-cyan-400'
            }`}
          >
            {ppv.toFixed(1)}
            <span className="text-sm font-normal text-slate-400 ml-0.5">%</span>
          </div>
          <span className="text-[10px] text-slate-400">Variação Respiratória</span>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5">
          <span>{ppv > 13.0 ? '💧 Responsivo a Volume' : 'Normovolemia'}</span>
        </div>
      </div>

      {/* 5. dP/dt_max (Contratilidade) */}
      <div
        className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all ${
          dp_dt_max < 700
            ? 'bg-purple-950/40 border-purple-500/60 text-purple-200'
            : 'bg-[#0f172a] border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400">
          <span
            className={`text-xs font-mono font-bold uppercase tracking-wider ${
              dp_dt_max < 700 ? 'text-purple-400' : 'text-indigo-400'
            }`}
          >
            dP/dt max
          </span>
          <Zap className={`h-4 w-4 ${dp_dt_max < 700 ? 'text-purple-400' : 'text-indigo-400'}`} />
        </div>
        <div className="my-1.5">
          <div
            className={`text-2xl font-black font-mono tracking-tight ${
              dp_dt_max < 700 ? 'text-purple-400' : 'text-indigo-400'
            }`}
          >
            {dp_dt_max.toFixed(0)}
          </div>
          <span className="text-[10px] text-slate-400">mmHg/s</span>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5">
          <span>{dp_dt_max < 700 ? '⚡ Contratilidade Baixa' : 'Inotropismo Normal'}</span>
        </div>
      </div>

      {/* 6. Tau (Decaimento Vascular) */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
            TÔNUS VASOMOTOR
          </span>
          <Activity className="h-4 w-4 text-rose-400" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            {dbp < 55 ? 'BAIXO' : 'NORMAL'}
          </div>
          <span className="text-[10px] text-slate-400">Resistência Arterial</span>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5">
          <span>{dbp < 55 ? '💉 Considerar Vasopressor' : 'RVS Estável'}</span>
        </div>
      </div>
    </div>
  );
};
