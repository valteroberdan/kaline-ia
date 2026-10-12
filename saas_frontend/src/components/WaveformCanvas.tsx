import React, { useRef, useEffect, useState } from 'react';

interface WaveformCanvasProps {
  waveformBuffer: number[];
  fs?: number;
  height?: number;
  alertLevel?: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'SIGNAL_INVALID' | 'MODEL_UNAVAILABLE' | 'DISCONNECTED' | string;
  vitals?: {
    sbp: number;
    dbp: number;
    map: number;
    hr: number;
  };
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  waveformBuffer,
  height = 220,
  alertLevel = 'NORMAL',
  vitals,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(600);

  // Responsive resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setCanvasWidth(Math.floor(entry.contentRect.width));
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = canvasWidth;
    const h = height;

    // Clean white canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Clinical Grid (0 to 200 mmHg)
    const minPressure = 0;
    const maxPressure = 200;
    const majorPressures = [50, 65, 100, 150, 200];

    // Minor grid lines (every 25 mmHg)
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#f1f5f9';
    for (let p = 25; p <= 175; p += 25) {
      if (majorPressures.includes(p)) continue;
      const y = h - ((p - minPressure) / (maxPressure - minPressure)) * h;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Vertical time grid (every 50px)
    ctx.strokeStyle = '#f8fafc';
    for (let x = 35; x < w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Major horizontal grid lines
    majorPressures.forEach((p) => {
      const y = h - ((p - minPressure) / (maxPressure - minPressure)) * h;

      if (p === 65) {
        // Highlighting the 65 mmHg MAP Target Line in clean red
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
      }

      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Scale Labels
      ctx.font = '10px monospace';
      ctx.fillStyle = p === 65 ? '#dc2626' : '#64748b';
      ctx.fillText(`${p}`, 6, y + 3);
    });

    if (waveformBuffer.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('Aguardando sinal da Linha Arterial (100 Hz)...', 45, h / 2);
      return;
    }

    // Draw Arterial Pressure Waveform
    const maxPoints = Math.min(waveformBuffer.length, 600); // 6 seconds sweep window
    const dataSlice = waveformBuffer.slice(-maxPoints);

    // Color: Crisp Arterial Red / Dark Red depending on alert
    let strokeColor = '#dc2626'; // Red
    if (alertLevel === 'CRITICAL') {
      strokeColor = '#b91c1c';
    } else if (alertLevel === 'WARNING') {
      strokeColor = '#d97706';
    }

    // Gradient fill under arterial curve
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(220, 38, 38, 0.12)');
    grad.addColorStop(1, 'rgba(220, 38, 38, 0.01)');

    ctx.beginPath();
    const xOffset = 40;
    const xStep = (w - xOffset - 10) / maxPoints;

    for (let i = 0; i < dataSlice.length; i++) {
      const pVal = dataSlice[i];
      const x = xOffset + i * xStep;
      const y = h - ((pVal - minPressure) / (maxPressure - minPressure)) * h;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Stroke
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(xOffset + (dataSlice.length - 1) * xStep, h);
    ctx.lineTo(xOffset, h);
    ctx.fillStyle = grad;
    ctx.fill();

    // Sweep Head Indicator Dot
    if (dataSlice.length > 0) {
      const lastVal = dataSlice[dataSlice.length - 1];
      const lastX = xOffset + (dataSlice.length - 1) * xStep;
      const lastY = h - ((lastVal - minPressure) / (maxPressure - minPressure)) * h;

      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [waveformBuffer, canvasWidth, height, alertLevel]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden border border-slate-300 bg-white shadow-sm"
    >
      {/* Top Banner on Waveform */}
      <div className="absolute top-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/95 border border-red-200 px-2 py-0.5 rounded shadow-xs">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-red-700">
              ARTÉRIA [100 Hz]
            </span>
          </div>

          <span className="text-[10px] font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            Linha Vermelha: Limiar PAM &lt; 65 mmHg
          </span>
        </div>

        {/* Live numerical overlay */}
        {vitals && (
          <div className="flex items-baseline gap-2 bg-white/95 px-2.5 py-1 rounded border border-slate-200 shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
              PAS/PAD:
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-slate-900">
              {vitals.sbp.toFixed(0)}/{vitals.dbp.toFixed(0)}
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-red-600">
              (PAM {vitals.map.toFixed(0)})
            </span>
            <span className="text-[10px] font-mono text-slate-500">mmHg</span>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: `${canvasWidth}px`, height: `${height}px` }}
        className="block w-full"
      />
    </div>
  );
};
