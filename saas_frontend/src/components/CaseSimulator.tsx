import React from 'react';
import { SimulationCase } from '../types';
import { Play, Pause, FastForward, RotateCcw, Database, Activity, Clock, CheckCircle2 } from 'lucide-react';

interface CaseSimulatorProps {
  cases: SimulationCase[];
  selectedCaseId: number;
  onSelectCase: (caseId: number) => void;
  isPaused: boolean;
  onTogglePlayPause: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  elapsedSec: number;
  totalSec: number;
  onSeek: (timeSec: number) => void;
}

export const CaseSimulator: React.FC<CaseSimulatorProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  isPaused,
  onTogglePlayPause,
  playbackSpeed,
  onChangeSpeed,
  elapsedSec,
  totalSec,
  onSeek,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedCase = cases.find((c) => c.caseid === selectedCaseId) || cases[0];

  return (
    <div className="bg-[#050914] border-2 border-[#1e293b] rounded-3xl p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight uppercase">
              Simulador & Replay Cirúrgico Real VitalDB
            </h3>
            <p className="text-xs text-slate-400">
              Sinais reais de alta fidelidade extraídos diretamente da track arterial invasiva <strong className="text-red-400 font-mono">SNUADC/ART (100 Hz)</strong>
            </p>
          </div>
        </div>

        {/* Case Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase font-mono">Selecionar Cirurgia Real:</label>
          <select
            value={selectedCaseId}
            onChange={(e) => onSelectCase(Number(e.target.value))}
            className="bg-[#0d1629] border-2 border-sky-500/50 text-white text-xs font-bold rounded-xl px-3.5 py-2 font-mono focus:ring-2 focus:ring-sky-500 outline-none shadow-lg"
          >
            {cases.map((c) => (
              <option key={c.caseid} value={c.caseid}>
                {c.title} • [Idade: {c.age}a | ASA {c.asa}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Origin Banner */}
      {selectedCase && (
        <div className="bg-[#091122] rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center font-black font-mono text-sm">
              #{selectedCase.caseid}
            </div>
            <div>
              <div className="text-sm font-bold text-white">{selectedCase.title}</div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Procedimento: <strong className="text-slate-200">{selectedCase.op}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Base VitalDB Autêntica
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-black/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Idade:</span>{' '}
              <span className="font-bold text-white">{selectedCase.age}a</span>
            </div>
            <div className="bg-black/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Sexo:</span>{' '}
              <span className="font-bold text-white">{selectedCase.gender}</span>
            </div>
            <div className="bg-black/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">ASA:</span>{' '}
              <span className="font-bold text-sky-400">Classe {selectedCase.asa}</span>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Playback Controls */}
      <div className="bg-[#02050c] rounded-2xl p-5 border-2 border-slate-800 space-y-4">
        {/* Timeline Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <Clock className="h-3.5 w-3.5" />
              Tempo Decorrido: <span>{formatTime(elapsedSec)}</span>
            </div>
            <div>
              Duração da Gravação: <span className="text-slate-300 font-bold">{formatTime(totalSec)}</span>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={totalSec || 600}
            step={1}
            value={elapsedSec}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>00:00 (Início da Gravação)</span>
            <span className="text-red-400 font-bold">⚠️ Momento de Alerta Precoce da Kaline IA</span>
            <span>{formatTime(totalSec)}</span>
          </div>
        </div>

        {/* Buttons Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Play / Pause / Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlayPause}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all shadow-xl font-mono ${
                isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              }`}
            >
              {isPaused ? <Play className="h-4 w-4 fill-white" /> : <Pause className="h-4 w-4 fill-white" />}
              {isPaused ? 'REPRODUZIR SIMULAÇÃO' : 'PAUSAR REPRODUÇÃO'}
            </button>

            <button
              onClick={() => onSeek(0)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#0d1629] hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </button>
          </div>

          {/* Quick Jump to Critical Moment */}
          <button
            onClick={() => onSeek(250)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/80 transition-all font-mono shadow-lg"
          >
            ⚡ Pular para Janela Pré-Hipotensão (-10 min)
          </button>

          {/* Playback Speed Controls */}
          <div className="flex items-center gap-1.5 bg-[#091122] p-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] px-2 font-mono flex items-center gap-1">
              <FastForward className="h-3 w-3" /> Vel:
            </span>
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2.5 py-1 rounded-lg font-mono font-black transition-all ${
                  playbackSpeed === spd
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
