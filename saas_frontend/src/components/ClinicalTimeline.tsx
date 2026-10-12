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
        return <Syringe className="h-3.5 w-3.5 text-blue-600" />;
      case 'incision':
        return <Scissors className="h-3.5 w-3.5 text-slate-700" />;
      case 'bleeding':
        return <Droplet className="h-3.5 w-3.5 text-red-600" />;
      case 'hpi_alert':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
      case 'hypotension':
        return <TrendingDown className="h-3.5 w-3.5 text-red-700" />;
      case 'vasopressor':
        return <Syringe className="h-3.5 w-3.5 text-purple-600" />;
      case 'transfusion':
        return <Droplet className="h-3.5 w-3.5 text-red-700" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  const getEventBadgeStyle = (ev: ClinicalEventMarker, isPassed: boolean, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-slate-900 text-white ring-2 ring-slate-900 shadow-md font-bold';
    }
    if (isPassed) {
      return 'bg-slate-100 text-slate-700 border-slate-300';
    }
    return 'bg-white text-slate-600 border-slate-200 hover:border-slate-400';
  };

  // Find currently active event (closest past event within 60s or nearest)
  const currentEvent = [...events]
    .filter((e) => e.time_sec <= elapsedSec)
    .sort((a, b) => b.time_sec - a.time_sec)[0];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800">
          <Clock className="h-3.5 w-3.5 text-slate-600" />
          <span className="uppercase">Linha do Tempo de Eventos Clínicos (VitalDB):</span>
          <span className="text-[11px] font-normal text-slate-500 hidden sm:inline">
            Clique em qualquer marco para saltar o replay para aquele instante
          </span>
        </div>

        {currentEvent && (
          <div className="flex items-center gap-1.5 text-xs font-mono bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-200">
            <span className="font-bold">Momento Atual:</span>
            <span>{currentEvent.label}</span>
            {currentEvent.drug_dose && (
              <span className="text-red-600">[{currentEvent.drug_dose}]</span>
            )}
          </div>
        )}
      </div>

      {/* Events Flow Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
        {events.map((ev, idx) => {
          const isPassed = elapsedSec >= ev.time_sec;
          const isCurrent = currentEvent?.time_sec === ev.time_sec;

          return (
            <button
              key={idx}
              onClick={() => onSeek(ev.time_sec)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono shrink-0 transition-all cursor-pointer ${getEventBadgeStyle(
                ev,
                isPassed,
                isCurrent
              )}`}
              title={`${ev.details || ev.label} (Clique para ir para ${formatTime(ev.time_sec)})`}
            >
              <span className="shrink-0">{getEventIcon(ev.type)}</span>
              <span className="font-bold">{formatTime(ev.time_sec)}</span>
              <span className="truncate max-w-[140px] sm:max-w-none">{ev.label}</span>
              {isPassed && !isCurrent && (
                <CheckCircle2 className="h-3 w-3 text-slate-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
