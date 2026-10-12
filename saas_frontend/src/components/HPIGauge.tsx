import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface HPIGaugeProps {
  score: number; // 0 to 100
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  p5: number;
  p10: number;
  p15: number;
}

export const HPIGauge: React.FC<HPIGaugeProps> = ({
  score,
  alertLevel,
  p5,
  p10,
  p15,
}) => {
  // Angle for 180-degree semi-circle gauge (from -90deg to +90deg)
  const clampedScore = Math.min(100, Math.max(0, score));
  const angle = (clampedScore / 100) * 180 - 90;

  const getColor = () => {
    if (clampedScore >= 75) return '#ef4444'; // Red
    if (clampedScore >= 50) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const getAlertDescription = () => {
    if (alertLevel === 'CRITICAL') {
      return {
        title: 'ALERTA CRÍTICO: Risco Iminente',
        desc: 'Alta probabilidade de queda de PAM < 65 mmHg nos próximos 5-15 min. Ação recomendada.',
        icon: ShieldAlert,
        badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
      };
    }
    if (alertLevel === 'WARNING') {
      return {
        title: 'ATENÇÃO: Transição Hemodinâmica',
        desc: 'Sinais sutis de instabilidade na curva de pressão. Acompanhe a tendência.',
        icon: AlertTriangle,
        badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      };
    }
    return {
      title: 'ESTÁVEL: Hemodinâmica Segura',
      desc: 'Padrão de autorregulação e elastância arterial preservados.',
      icon: CheckCircle,
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
  };

  const alertInfo = getAlertDescription();
  const IconComponent = alertInfo.icon;

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Kaline HPI Radar</h3>
            <p className="text-[11px] text-slate-400">Hypotension Prediction Index</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${alertInfo.badgeBg}`}>
          <IconComponent className="h-3 w-3" />
          {alertLevel}
        </div>
      </div>

      {/* SVG Semi-Circle Gauge */}
      <div className="relative flex flex-col items-center justify-center my-4">
        <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 110">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Value Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (clampedScore / 100) * 251.2}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
          />

          {/* Center Needle / Pivot */}
          <circle cx="100" cy="100" r="8" fill="#334155" stroke="#64748b" strokeWidth="2" />
          <g transform={`rotate(${angle}, 100, 100)`}>
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

        {/* Digital Readout */}
        <div className="text-center mt-[-15px]">
          <div className="text-4xl font-extrabold font-mono tracking-tight text-white flex items-baseline justify-center">
            {clampedScore.toFixed(0)}
            <span className="text-lg font-normal text-slate-400 ml-0.5">%</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Índice de Risco Global
          </p>
        </div>
      </div>

      {/* Horizon Probability Badges */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80">
        <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono">
            <Clock className="h-3 w-3" /> +5 min
          </div>
          <div className="text-base font-bold font-mono text-sky-400 mt-0.5">
            {(p5 * 100).toFixed(0)}%
          </div>
          <div className="text-[9px] text-slate-400">P(Hipotensão)</div>
        </div>

        <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono">
            <Clock className="h-3 w-3" /> +10 min
          </div>
          <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
            {(p10 * 100).toFixed(0)}%
          </div>
          <div className="text-[9px] text-slate-400">P(Hipotensão)</div>
        </div>

        <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono">
            <Clock className="h-3 w-3" /> +15 min
          </div>
          <div className="text-base font-bold font-mono text-purple-400 mt-0.5">
            {(p15 * 100).toFixed(0)}%
          </div>
          <div className="text-[9px] text-slate-400">P(Hipotensão)</div>
        </div>
      </div>
    </div>
  );
};
