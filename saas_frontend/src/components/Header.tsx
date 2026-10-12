import React from 'react';
import {
  Activity,
  Stethoscope,
  Cpu,
  FileText,
  Play,
  Pause,
  RotateCcw,
  Clock,
  ArrowLeft,
  Lock,
  Unlock,
} from 'lucide-react';
import { SimulationCase } from '../types';

interface HeaderProps {
  activeTab: 'monitor' | 'physiology' | 'autocorrection' | 'workbench';
  setActiveTab: (tab: 'monitor' | 'physiology' | 'autocorrection' | 'workbench') => void;
  cases: SimulationCase[];
  selectedCaseId: number;
  onSelectCase: (caseId: number) => void;
  onBackToCaseSelection?: () => void;
  isPaused: boolean;
  onTogglePlayPause: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  elapsedSec: number;
  totalSec: number;
  onSeek: (timeSec: number) => void;
  isConnected: boolean;
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  hpiScore: number;
  isPredictiveUnlocked: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cases,
  selectedCaseId,
  onSelectCase,
  onBackToCaseSelection,
  isPaused,
  onTogglePlayPause,
  playbackSpeed,
  onChangeSpeed,
  elapsedSec,
  totalSec,
  onSeek,
  isConnected,
  alertLevel,
  hpiScore,
  isPredictiveUnlocked,
}) => {
  const currentCase = cases.find((c) => c.caseid === selectedCaseId);
  const currentEvent = currentCase?.events
    ?.filter((e) => e.time_sec <= elapsedSec)
    .sort((a, b) => b.time_sec - a.time_sec)[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAlertBadge = () => {
    if (!isPredictiveUnlocked) {
      return 'bg-amber-50 text-amber-800 border-amber-300';
    }
    if (alertLevel === 'CRITICAL' || hpiScore >= 75) {
      return 'bg-red-50 text-red-700 border-red-300 font-bold';
    }
    if (alertLevel === 'WARNING' || hpiScore >= 50) {
      return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
    }
    return 'bg-emerald-50 text-emerald-800 border-emerald-300';
  };

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 select-none shadow-xs sticky top-0 z-30">
      {/* Top Application Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-slate-100">
        {/* Row 1: Logo & Case Title */}
        <div className="flex items-center justify-between gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src="./logo_icon.png"
              alt="Kaline IA"
              className="h-10 w-10 object-contain shrink-0 rounded-lg shadow-2xs"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-[#0b2827] tracking-tight shrink-0">
                  Kaline<sup className="text-xs font-bold text-[#c78a3b] ml-0.5">IA</sup>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-mono font-bold uppercase tracking-wider shrink-0">
                  Protótipo
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-mono font-semibold shrink-0">
                  Inteligência Preditiva
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono hidden sm:block truncate">
                Linha Arterial Invasiva • VitalDB SNUADC/ART 100 Hz
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 text-xs shrink-0">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 shrink-0">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{isConnected ? 'Sinal 100 Hz' : 'Offline'}</span>
            </div>

            <div className={`px-2 py-1 rounded-md border text-[11px] font-mono flex items-center gap-1 shrink-0 ${getAlertBadge()}`}>
              {isPredictiveUnlocked ? (
                <>
                  <Unlock className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>HPI: {hpiScore.toFixed(0)}%</span>
                  <span className="hidden sm:inline uppercase">[{alertLevel}]</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-amber-600 shrink-0" />
                  <span>HPI: PROTEGIDO</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CURRENT CASE INFO & SWITCH BUTTON */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-full md:w-auto md:max-w-md lg:max-w-lg justify-between md:justify-start shrink-0 min-w-0">
          <div className="flex flex-col min-w-0 pr-2 flex-1">
            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider truncate">
              Caso em Execução:
            </span>
            <span className="text-xs font-semibold text-slate-900 truncate" title={currentCase ? `Caso #${currentCase.caseid} • ${currentCase.op} (${currentCase.age}a, ${currentCase.gender}, ASA ${currentCase.asa})` : ''}>
              {currentCase
                ? `Caso #${currentCase.caseid} • ${currentCase.op} (${currentCase.age}a, ${currentCase.gender}, ASA ${currentCase.asa})`
                : `Caso #${selectedCaseId}`}
            </span>
          </div>

          {onBackToCaseSelection && (
            <button
              onClick={onBackToCaseSelection}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-mono font-medium text-slate-700 transition-colors shrink-0 shadow-xs cursor-pointer"
              title="Voltar à tela de seleção de casos"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Trocar Caso</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Bar: Navigation Tabs & Simulation Controls */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 text-xs">
        {/* Navigation Tabs */}
        <nav className="grid grid-cols-4 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
              activeTab === 'monitor'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-slate-700 shrink-0" />
            <span className="truncate">Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('physiology')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
              activeTab === 'physiology'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5 text-slate-700 shrink-0" />
            <span className="truncate">Fisiologia</span>
          </button>

          <button
            onClick={() => setActiveTab('autocorrection')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
              activeTab === 'autocorrection'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-slate-700 shrink-0" />
            <span className="truncate">Auto-Correção</span>
          </button>

          <button
            onClick={() => setActiveTab('workbench')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
              activeTab === 'workbench'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-slate-700 shrink-0" />
            <span className="truncate">Avaliação</span>
          </button>
        </nav>

        {/* Global Simulation Playback Controls Bar */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 overflow-x-auto min-w-0 flex-1 md:flex-initial">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onTogglePlayPause}
              className={`flex items-center gap-1 px-3 py-1 rounded font-bold text-xs cursor-pointer transition-all ${
                isPaused
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 shadow-xs'
              }`}
            >
              {isPaused ? <Play className="h-3 w-3 fill-white" /> : <Pause className="h-3 w-3 fill-slate-800" />}
              <span>{isPaused ? 'Play' : 'Pausar'}</span>
            </button>

            <button
              onClick={() => onSeek(0)}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 hover:text-slate-900 cursor-pointer shadow-xs"
              title="Reiniciar tempo do caso"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700 shrink-0">
            <Clock className="h-3 w-3 text-slate-500" />
            <span>{formatTime(elapsedSec)}</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500">{formatTime(totalSec)}</span>
          </div>

          <input
            type="range"
            min={0}
            max={totalSec || 600}
            step={1}
            value={elapsedSec}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="flex-1 min-w-[50px] max-w-[120px] sm:max-w-[150px] h-1.5 bg-slate-300 rounded appearance-none cursor-pointer accent-slate-900 shrink-0"
          />

          {currentEvent && (
            <div className="hidden lg:flex items-center gap-1 font-mono text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200 shrink-0">
              <span className="text-red-600 font-bold">Fase:</span>
              <span className="font-bold truncate max-w-[130px]">{currentEvent.label}</span>
            </div>
          )}

          <div className="flex items-center gap-0.5 bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px] shrink-0">
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                  playbackSpeed === spd ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
