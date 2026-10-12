import React from 'react';
import { ForecastPoint } from '../types';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface ForecastTrendProps {
  currentMap: number;
  trajectory: ForecastPoint[];
  map5: number;
  map10: number;
  map15: number;
}

export const ForecastTrend: React.FC<ForecastTrendProps> = ({
  currentMap,
  map5,
  map10,
  map15,
}) => {
  const delta15 = map15 - currentMap;
  const isDropping = delta15 < -3;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            {isDropping ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Projeção de PAM Contínua
            </h3>
            <p className="text-[11px] text-slate-500">Trajetória Futura Estimada pela IA (+5m, +10m, +15m)</p>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
              delta15 < 0
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            Δ {delta15 >= 0 ? '+' : ''}
            {delta15.toFixed(1)} mmHg
          </span>
        </div>
      </div>

      {/* Visual Forecast Horizon Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
        {/* T = 0 */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Atual (t=0)</span>
          <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
            {currentMap.toFixed(0)}
            <span className="text-[10px] font-normal text-slate-400 ml-0.5">mmHg</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">PAM Medida</span>
        </div>

        {/* T = 5 */}
        <div
          className={`p-2.5 rounded-lg border text-center transition-all ${
            map5 < 65
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <span className="text-[10px] font-mono text-slate-500 uppercase">+5 min</span>
          <div className={`text-lg font-black font-mono mt-0.5 ${map5 < 65 ? 'text-red-600' : 'text-slate-900'}`}>
            {map5.toFixed(0)}
            <span className="text-[10px] font-normal text-slate-400 ml-0.5">mmHg</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {map5 < 65 ? '⚠️ < 65 mmHg' : 'Estimada'}
          </span>
        </div>

        {/* T = 10 */}
        <div
          className={`p-2.5 rounded-lg border text-center transition-all ${
            map10 < 65
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <span className="text-[10px] font-mono text-slate-500 uppercase">+10 min</span>
          <div className={`text-lg font-black font-mono mt-0.5 ${map10 < 65 ? 'text-red-600' : 'text-slate-900'}`}>
            {map10.toFixed(0)}
            <span className="text-[10px] font-normal text-slate-400 ml-0.5">mmHg</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {map10 < 65 ? '⚠️ < 65 mmHg' : 'Estimada'}
          </span>
        </div>

        {/* T = 15 */}
        <div
          className={`p-2.5 rounded-lg border text-center transition-all ${
            map15 < 65
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <span className="text-[10px] font-mono text-slate-500 uppercase">+15 min</span>
          <div className={`text-lg font-black font-mono mt-0.5 ${map15 < 65 ? 'text-red-600' : 'text-slate-900'}`}>
            {map15.toFixed(0)}
            <span className="text-[10px] font-normal text-slate-400 ml-0.5">mmHg</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {map15 < 65 ? '🚨 < 65 mmHg' : 'Estimada'}
          </span>
        </div>
      </div>

      {/* SVG Interactive Trendline with CI Band */}
      <div className="relative w-full h-24 bg-slate-50 rounded-lg border border-slate-200 p-2 flex items-center">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80">
          {/* Threshold Line at 65 mmHg */}
          <line
            x1="10"
            y1={80 - ((65 - 40) / 70) * 80}
            x2="290"
            y2={80 - ((65 - 40) / 70) * 80}
            stroke="#dc2626"
            strokeDasharray="4,4"
            strokeWidth="1.2"
          />
          <text
            x="240"
            y={80 - ((65 - 40) / 70) * 80 - 4}
            fill="#dc2626"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Limiar 65
          </text>

          {/* Points: 0, 5, 10, 15 min */}
          {(() => {
            const pts = [
              { x: 30, y: 80 - ((currentMap - 40) / 70) * 80 },
              { x: 110, y: 80 - ((map5 - 40) / 70) * 80 },
              { x: 190, y: 80 - ((map10 - 40) / 70) * 80 },
              { x: 270, y: 80 - ((map15 - 40) / 70) * 80 },
            ];

            const pathD = `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y} L ${pts[2].x} ${pts[2].y} L ${pts[3].x} ${pts[3].y}`;
            const lineColor = isDropping ? '#dc2626' : '#2563eb';

            return (
              <g>
                <path
                  d={pathD}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {pts.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    fill="#ffffff"
                    stroke={lineColor}
                    strokeWidth="2.5"
                  />
                ))}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between font-mono border-t border-slate-100 pt-1.5">
        <span>Limiar de Isquemia Orgânica: PAM &lt; 65 mmHg</span>
        <span className="text-slate-400">Modelo Calibrado</span>
      </div>
    </div>
  );
};
