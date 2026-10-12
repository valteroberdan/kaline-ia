import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface KalineHPIGaugeProps {
  score: number;
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  p5: number;
  p10: number;
  p15: number;
  map5: number;
  map10: number;
  map15: number;
}

export const KalineHPIGauge: React.FC<KalineHPIGaugeProps> = ({
  score,
  alertLevel,
  p5,
  p10,
  p15,
  map5,
  map10,
  map15,
}) => {
  const clampedScore = Math.min(100, Math.max(0, score));
  const isCritical = alertLevel === 'CRITICAL' || clampedScore >= 75;
  const isWarning = alertLevel === 'WARNING' || (clampedScore >= 50 && clampedScore < 75);

  const getColor = () => {
    if (isCritical) return '#dc2626'; // Red
    if (isWarning) return '#d97706'; // Amber
    return '#16a34a'; // Green
  };

  const needleAngle = (clampedScore / 100) * 180 - 90;
  const arcLength = 251.2;
  const arcOffset = arcLength - (clampedScore / 100) * arcLength;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Índice Preditivo HPI (Kaline IA Protótipo)
            </h3>
            <p className="text-[11px] text-slate-500">Probabilidade Combinada de Evento Hipotensivo</p>
          </div>
        </div>

        <div
          className={`px-2.5 py-1 rounded text-xs font-mono font-bold border flex items-center gap-1.5 ${
            isCritical
              ? 'bg-red-50 text-red-700 border-red-300'
              : isWarning
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          {isCritical ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
          <span>{alertLevel}</span>
        </div>
      </div>

      {/* Main Gauge & Reading */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center my-3">
        {/* Semi-gauge (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <svg className="w-44 sm:w-48 h-24 sm:h-28 overflow-visible" viewBox="0 0 200 110">
            <defs>
              <linearGradient id="soberGradientLight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#16a34a" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="85%" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Value Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#soberGradientLight)"
              strokeWidth="16"
              strokeDasharray={arcLength}
              strokeDashoffset={arcOffset}
              strokeLinecap="round"
            />

            {/* Needle Pivot */}
            <circle cx="100" cy="100" r="7" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
            <g transform={`rotate(${needleAngle}, 100, 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="28"
                stroke={getColor()}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </g>
          </svg>

          <div className="text-center mt-[-14px] sm:mt-[-18px]">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight" style={{ color: getColor() }}>
              {clampedScore.toFixed(0)}
              <span className="text-base sm:text-lg text-slate-400 font-normal ml-0.5">%</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono uppercase">Score HPI Instantâneo</span>
          </div>
        </div>

        {/* 3 Horizon Forecast Badges (7 cols) */}
        <div className="md:col-span-7 grid grid-cols-3 gap-2 min-w-0">
          {/* +5 min */}
          <div
            className={`p-2.5 rounded-lg border text-center transition-all min-w-0 overflow-hidden ${
              p5 >= 0.5
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-mono truncate">
              <Clock className="h-3 w-3 shrink-0" /> +5 min
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-slate-900 mt-0.5 truncate">
              {(p5 * 100).toFixed(0)}%
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-700 mt-0.5 truncate">
              PAM: {map5}
            </div>
          </div>

          {/* +10 min */}
          <div
            className={`p-2.5 rounded-lg border text-center transition-all min-w-0 overflow-hidden ${
              p10 >= 0.5
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-mono truncate">
              <Clock className="h-3 w-3 shrink-0" /> +10 min
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-slate-900 mt-0.5 truncate">
              {(p10 * 100).toFixed(0)}%
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-700 mt-0.5 truncate">
              PAM: {map10}
            </div>
          </div>

          {/* +15 min */}
          <div
            className={`p-2.5 rounded-lg border text-center transition-all min-w-0 overflow-hidden ${
              p15 >= 0.5
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-mono truncate">
              <Clock className="h-3 w-3 shrink-0" /> +15 min
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-slate-900 mt-0.5 truncate">
              {(p15 * 100).toFixed(0)}%
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-700 mt-0.5 truncate">
              PAM: {map15}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between font-mono">
        <span>Alvo de Segurança: PAM &ge; 65 mmHg</span>
        <span className={isCritical ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
          {isCritical ? '⚠️ Risco Iminente de Queda' : 'Compensado'}
        </span>
      </div>
    </div>
  );
};
