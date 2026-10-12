import React from 'react';
import { ClinicalEventMarker } from '../types';
import {
  Syringe,
  Scissors,
  Droplet,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface ClinicalTimelineProps {
  events?: ClinicalEventMarker[];
  elapsedSec: number;
  totalSec: number;
  onSeek: (timeSec: number) => void;
}

export const ClinicalTimeline: React.FC<ClinicalTimelineProps> = ({
  events = [],
  elapsedSec,
  totalSec,
  onSeek,
}) => {
  if (!events || events.length === 0) return null;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type: ClinicalEventMarker['type']) => {
    switch (type) {
      case 'induction':
        return <Syringe className="h-4 w-4 text-blue-600" />;
      case 'incision':
        return <Scissors className="h-4 w-4 text-slate-700" />;
      case 'bleeding':
        return <Droplet className="h-4 w-4 text-red-600" />;
      case 'hpi_alert':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'hypotension':
        return <TrendingDown className="h-4 w-4 text-red-700" />;
      case 'vasopressor':
        return <Syringe className="h-4 w-4 text-purple-600" />;
      case 'transfusion':
        return <Droplet className="h-4 w-4 text-red-700" />;
      default:
        return <Sparkles className="h-4 w-4 text-slate-600" />;
    }
  };

  const getEventBorderColor = (type: ClinicalEventMarker['type']) => {
    switch (type) {
      case 'induction':
        return 'border-blue-400 bg-blue-50/70 text-blue-900';
      case 'bleeding':
        return 'border-red-400 bg-red-50/70 text-red-900';
      case 'hpi_alert':
        return 'border-amber-400 bg-amber-50/70 text-amber-900';
      case 'hypotension':
        return 'border-red-600 bg-red-100 text-red-950 font-bold';
      case 'vasopressor':
        return 'border-purple-400 bg-purple-50/70 text-purple-900';
      case 'transfusion':
        return 'border-rose-400 bg-rose-50/70 text-rose-900';
      default:
        return 'border-slate-300 bg-slate-50 text-slate-800';
    }
  };

  // Find currently active event (closest past event within window or nearest)
  const currentEvent = [...events]
    .filter((e) => e.time_sec <= elapsedSec)
    .sort((a, b) => b.time_sec - a.time_sec)[0];

  const progressPercent = totalSec > 0 ? Math.min(100, Math.max(0, (elapsedSec / totalSec) * 100)) : 0;

  return (
    <div className="bg-white border-2 border-slate-300 rounded-xl p-4 shadow-sm space-y-3">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
            <Clock className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold font-mono text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span>Linha do Tempo de Eventos Cirúrgicos (VitalDB)</span>
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded border border-red-200 font-sans font-semibold">
                Replay Interativo
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 font-mono">
              Clique em qualquer marco abaixo para navegar diretamente ao instante do evento
            </p>
          </div>
        </div>

        {currentEvent && (
          <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 text-white px-3 py-1 rounded-lg shadow-xs">
            <span className="text-red-400 font-bold">FASE ATUAL:</span>
            <span className="font-bold">{currentEvent.label}</span>
            {currentEvent.drug_dose && (
              <span className="text-slate-300 hidden md:inline">({currentEvent.drug_dose})</span>
            )}
          </div>
        )}
      </div>

      {/* Graphical Progress Track with Event Pins */}
      <div className="relative pt-4 pb-2 px-1">
        {/* Track Line */}
        <div className="relative h-2.5 bg-slate-200 rounded-full overflow-visible">
          {/* Progress Fill */}
          <div
            className="absolute top-0 left-0 h-full bg-slate-800 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Current Playhead Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 bg-red-600 rounded-full border-2 border-white shadow-md z-10 pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Event Pins on the Track */}
          {events.map((ev, idx) => {
            const evPercent = totalSec > 0 ? (ev.time_sec / totalSec) * 100 : 0;
            const isPassed = elapsedSec >= ev.time_sec;

            return (
              <button
                key={idx}
                onClick={() => onSeek(ev.time_sec)}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 transition-transform hover:scale-125 cursor-pointer z-10 ${
                  isPassed
                    ? 'bg-slate-900 border-white'
                    : 'bg-white border-slate-400 hover:border-slate-800'
                }`}
                style={{ left: `${evPercent}%` }}
                title={`${formatTime(ev.time_sec)} - ${ev.label} (Clique para ir)`}
              />
            );
          })}
        </div>

        {/* Start / End Labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
          <span>00:00 (Início da Gravação)</span>
          <span className="font-bold text-slate-800">
            Tempo Decorrido: {formatTime(elapsedSec)} / {formatTime(totalSec)}
          </span>
          <span>{formatTime(totalSec)} (Fim)</span>
        </div>
      </div>

      {/* Interactive Event Buttons Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
        {events.map((ev, idx) => {
          const isPassed = elapsedSec >= ev.time_sec;
          const isCurrent = currentEvent?.time_sec === ev.time_sec;

          return (
            <button
              key={idx}
              onClick={() => onSeek(ev.time_sec)}
              className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'ring-2 ring-slate-900 border-slate-900 shadow-md bg-white'
                  : getEventBorderColor(ev.type)
              } ${isPassed && !isCurrent ? 'opacity-90' : ''}`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/90 border border-slate-300 text-slate-800">
                  {formatTime(ev.time_sec)}
                </span>
                <span className="shrink-0">{getEventIcon(ev.type)}</span>
              </div>

              <div>
                <div className="text-xs font-bold leading-tight truncate" title={ev.label}>
                  {ev.label}
                </div>
                {ev.drug_dose && (
                  <div className="text-[10px] text-slate-600 font-mono truncate mt-0.5" title={ev.drug_dose}>
                    {ev.drug_dose}
                  </div>
                )}
                {ev.details && (
                  <div className="text-[9px] text-slate-500 line-clamp-2 mt-0.5 leading-tight" title={ev.details}>
                    {ev.details}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
