import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, Zap, Wind, Activity, Heart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { HemodynamicVitals, KalinePrediction } from '../types';

interface HemoSphereCockpitProps {
  telemetry: KalinePrediction;
}

export const HemoSphereCockpit: React.FC<HemoSphereCockpitProps> = ({ telemetry }) => {
  const { predictions, hemodynamic_vitals, explainability } = telemetry;
  const score = predictions?.kaline_hpi_score ?? 0;
  const clampedScore = Math.min(100, Math.max(0, score));
  const alertLevel = predictions?.alert_level ?? 'NORMAL';

  // HemoSphere Colors
  const isCritical = alertLevel === 'CRITICAL' || clampedScore >= 75;
  const isWarning = alertLevel === 'WARNING' || (clampedScore >= 50 && clampedScore < 75);

  const getHPIColor = () => {
    if (isCritical) return '#ff1744'; // Red
    if (isWarning) return '#ff9100'; // Amber
    return '#00e676'; // Bright Green
  };

  // 180-deg arc
  const arcLength = 251.2;
  const arcOffset = arcLength - (clampedScore / 100) * arcLength;
  const needleAngle = (clampedScore / 100) * 180 - 90;

  // Estimates for HemoSphere parameters
  const ppv = hemodynamic_vitals.ppv;
  const dp_dt = hemodynamic_vitals.dp_dt_max;
  const map = hemodynamic_vitals.map;
  const sbp = hemodynamic_vitals.sbp;
  const dbp = hemodynamic_vitals.dbp;
  const hr = hemodynamic_vitals.hr;
  
  // Approximate Cardiac Index (CI) and Stroke Volume (SV) based on pulse contour
  const sv = Math.round(hemodynamic_vitals.pp * 1.4); // mL
  const co = ((sv * hr) / 1000).toFixed(1); // L/min
  const ci = (Number(co) / 1.8).toFixed(1); // L/min/m2 (BSA ~ 1.8)
  const eaDyn = (ppv / Math.max(1, (sbp - dbp))).toFixed(2); // Dynamic Elastance proxy

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* LEFT / CENTER: Acumen HPI Main Dial + Physiologic Cockpit (8 cols) */}
      <div className="lg:col-span-8 bg-[#050914] border-2 border-[#1e293b] rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
        {/* Glow backdrop on critical */}
        {isCritical && (
          <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse" />
        )}

        {/* Top Header of Cockpit */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wider text-white uppercase">
                  Acumen HPI™ (Hypotension Prediction Index)
                </span>
                <span className="text-[10px] bg-red-950/80 text-red-400 font-bold px-2 py-0.5 rounded border border-red-800/60 font-mono">
                  KALINE IA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Edwards HemoSphere Protocol • Antecipação Preditiva em 5, 10 e 15 min
              </p>
            </div>
          </div>

          {/* Alert Status Pill */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wider border flex items-center gap-2 shadow-lg ${
              isCritical
                ? 'bg-red-600/30 text-red-400 border-red-500 animate-pulse'
                : isWarning
                ? 'bg-amber-600/30 text-amber-400 border-amber-500'
                : 'bg-emerald-600/30 text-emerald-400 border-emerald-500'
            }`}
          >
            {isCritical ? (
              <>
                <ShieldAlert className="h-4 w-4" />
                <span>RISCO CRÍTICO IMINENTE</span>
              </>
            ) : isWarning ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>ATENÇÃO / TRANSIÇÃO</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>HEMODINÂMICA ESTÁVEL</span>
              </>
            )}
          </div>
        </div>

        {/* Central HemoSphere HPI Circular Display & Early Forecast */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4 items-center relative z-10">
          {/* Big HPI Gauge (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center">
              <svg className="w-64 h-36 overflow-visible" viewBox="0 0 200 115">
                <defs>
                  <linearGradient id="hemosphereGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00e676" />
                    <stop offset="50%" stopColor="#ff9100" />
                    <stop offset="85%" stopColor="#ff1744" />
                  </linearGradient>
                  <filter id="neonGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#141c2e"
                  strokeWidth="20"
                  strokeLinecap="round"
                />

                {/* Colored Progress Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#hemosphereGradient)"
                  strokeWidth="20"
                  strokeDasharray={arcLength}
                  strokeDashoffset={arcOffset}
                  strokeLinecap="round"
                  filter="url(#neonGlow)"
                />

                {/* Needle */}
                <circle cx="100" cy="100" r="9" fill="#1e293b" stroke="#64748b" strokeWidth="2.5" />
                <g transform={`rotate(${needleAngle}, 100, 100)`}>
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="24"
                    stroke={getHPIColor()}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </g>
              </svg>

              {/* Digital Big Readout */}
              <div className="text-center mt-[-24px]">
                <div
                  className="text-6xl font-black font-mono tracking-tight flex items-baseline justify-center"
                  style={{ color: getHPIColor() }}
                >
                  {clampedScore.toFixed(0)}
                  <span className="text-2xl text-slate-400 font-bold ml-1">%</span>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Índice Preditivo HPI
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Horizon Early Warning Badges (5 cols) */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              Antecipação Multi-Horizonte:
            </div>

            {/* +5 min */}
            <div
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                (predictions?.p_5min ?? 0) >= 0.5
                  ? 'bg-red-950/40 border-red-500 text-red-300'
                  : 'bg-[#0a1122] border-slate-800 text-slate-200'
              }`}
            >
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">+5 Minutos</div>
                <div className="text-xs font-semibold">PAM: <span className="font-mono font-bold text-white">{predictions?.map_5min ?? '--'} mmHg</span></div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-black text-sky-400">
                  {predictions?.p_5min !== undefined && predictions?.p_5min !== null ? `${(predictions.p_5min * 100).toFixed(0)}%` : '--'}
                </div>
                <div className="text-[9px] text-slate-400">Prob. Hipotensão</div>
              </div>
            </div>

            {/* +10 min */}
            <div
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                (predictions?.p_10min ?? 0) >= 0.5
                  ? 'bg-red-950/40 border-red-500 text-red-300'
                  : 'bg-[#0a1122] border-slate-800 text-slate-200'
              }`}
            >
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">+10 Minutos</div>
                <div className="text-xs font-semibold">PAM: <span className="font-mono font-bold text-white">{predictions?.map_10min ?? '--'} mmHg</span></div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-black text-amber-400">
                  {predictions?.p_10min !== undefined && predictions?.p_10min !== null ? `${(predictions.p_10min * 100).toFixed(0)}%` : '--'}
                </div>
                <div className="text-[9px] text-slate-400">Prob. Hipotensão</div>
              </div>
            </div>

            {/* +15 min */}
            <div
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                (predictions?.p_15min ?? 0) >= 0.5
                  ? 'bg-red-950/40 border-red-500 text-red-300'
                  : 'bg-[#0a1122] border-slate-800 text-slate-200'
              }`}
            >
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">+15 Minutos</div>
                <div className="text-xs font-semibold">PAM: <span className="font-mono font-bold text-white">{predictions?.map_15min ?? '--'} mmHg</span></div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-black text-purple-400">
                  {predictions?.p_15min !== undefined && predictions?.p_15min !== null ? `${(predictions.p_15min * 100).toFixed(0)}%` : '--'}
                </div>
                <div className="text-[9px] text-slate-400">Prob. Hipotensão</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cockpit 4 Fisiologic Drivers Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800 relative z-10">
          <div className="bg-[#080e1c] p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono">1. Pré-Carga (VPP)</span>
            <div className={`text-base font-bold font-mono ${ppv > 13 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {ppv.toFixed(1)}% {ppv > 13 && '⚠️'}
            </div>
          </div>

          <div className="bg-[#080e1c] p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono">2. Inotropia (dP/dt)</span>
            <div className={`text-base font-bold font-mono ${dp_dt < 700 ? 'text-red-400' : 'text-purple-400'}`}>
              {dp_dt.toFixed(0)} mmHg/s
            </div>
          </div>

          <div className="bg-[#080e1c] p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono">3. Elastância (Ea_dyn)</span>
            <div className="text-base font-bold font-mono text-rose-400">
              {eaDyn}
            </div>
          </div>

          <div className="bg-[#080e1c] p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono">4. Débito (IC)</span>
            <div className="text-base font-bold font-mono text-emerald-400">
              {ci} L/min/m²
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: HemoSphere Signature Parameter Tile Column (4 cols) */}
      <div className="lg:col-span-4 grid grid-cols-2 gap-3">
        {/* Tile 1: MAP (RED) */}
        <div
          className={`rounded-2xl p-4 border-2 flex flex-col justify-between shadow-xl transition-all ${
            map < 65
              ? 'bg-red-950/60 border-red-500 text-red-100 animate-pulse'
              : 'bg-[#0d1527] border-red-500/50'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-mono font-bold text-red-400 uppercase">
            <span>PAM (MÉDIA)</span>
            <span className="text-[10px] text-slate-400">mmHg</span>
          </div>
          <div className="my-1 text-center">
            <div className="text-4xl font-black font-mono tracking-tight text-red-400">
              {map.toFixed(0)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1">
            <span>Alvo: &ge;65</span>
            <span className={map < 65 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
              {map < 65 ? 'HIPOTENSÃO' : 'NORMAL'}
            </span>
          </div>
        </div>

        {/* Tile 2: SBP / DBP (RED) */}
        <div className="bg-[#0d1527] border-2 border-red-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-red-400 uppercase">
            <span>PAS / PAD</span>
            <span className="text-[10px] text-slate-400">mmHg</span>
          </div>
          <div className="my-1 text-center">
            <div className="text-2xl font-black font-mono tracking-tight text-white">
              {sbp.toFixed(0)} <span className="text-slate-500 font-normal">/</span> {dbp.toFixed(0)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1">
            <span>PP: {(sbp - dbp).toFixed(0)}</span>
            <span>Art. Radial</span>
          </div>
        </div>

        {/* Tile 3: Heart Rate (GREEN) */}
        <div className="bg-[#0d1527] border-2 border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-emerald-400 uppercase">
            <span>FC (PULSO)</span>
            <span className="text-[10px] text-slate-400">bpm</span>
          </div>
          <div className="my-1 text-center">
            <div className="text-4xl font-black font-mono tracking-tight text-emerald-400">
              {hr.toFixed(0)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1">
            <span>Ritmo</span>
            <span className="text-emerald-400 font-bold">Sinusal</span>
          </div>
        </div>

        {/* Tile 4: SVV / PPV (YELLOW) */}
        <div
          className={`rounded-2xl p-4 border-2 flex flex-col justify-between shadow-xl transition-all ${
            ppv > 13
              ? 'bg-amber-950/60 border-amber-500 text-amber-100'
              : 'bg-[#0d1527] border-amber-500/50'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-mono font-bold text-amber-400 uppercase">
            <span>VPP (SVV)</span>
            <span className="text-[10px] text-slate-400">%</span>
          </div>
          <div className="my-1 text-center">
            <div className="text-4xl font-black font-mono tracking-tight text-amber-400">
              {ppv.toFixed(1)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1">
            <span>Limiar &le;13%</span>
            <span className={ppv > 13 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
              {ppv > 13 ? 'VOL. RESP.' : 'NORMO'}
            </span>
          </div>
        </div>

        {/* Tile 5: dP/dt_max (PURPLE) */}
        <div className="bg-[#0d1527] border-2 border-purple-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-purple-400 uppercase">
            <span>dP/dt MAX</span>
            <span className="text-[10px] text-slate-400">mmHg/s</span>
          </div>
          <div className="my-1 text-center">
            <div className="text-3xl font-black font-mono tracking-tight text-purple-400">
              {dp_dt.toFixed(0)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1">
            <span>Inotropismo</span>
            <span className={dp_dt < 700 ? 'text-red-400 font-bold' : 'text-purple-300'}>
              {dp_dt < 700 ? 'BAIXO' : 'OK'}
            </span>
          </div>
        </div>

        {/* Tile 6: Cardiac Index / Stroke Volume (CYAN) */}
        <div className="bg-[#0d1527] border-2 border-cyan-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-cyan-400 uppercase">
            <span>IC / VS</span>
            <span className="text-[10px] text-slate-400">L/min/m²</span>
          </div>
          <div className="my-1 text-center">
            <div className="text-3xl font-black font-mono tracking-tight text-cyan-400">
              {ci} <span className="text-xs text-slate-400 font-normal">({sv}ml)</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1">
            <span>DC: {co} L/min</span>
            <span className="text-cyan-400 font-bold">Fluxo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
