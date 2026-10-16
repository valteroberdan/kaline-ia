import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WaveformCanvas } from './components/WaveformCanvas';
import { KalineVitalsPanel } from './components/KalineVitalsPanel';
import { KalineHPIGauge } from './components/KalineHPIGauge';
import { KalinePhysiologyPanel } from './components/KalinePhysiologyPanel';
import { KalineAutoCorrectionPanel } from './components/KalineAutoCorrectionPanel';
import { ForecastTrend } from './components/ForecastTrend';
import { PatientForm } from './components/PatientForm';
import { CaseSelectionView } from './components/CaseSelectionView';
import { ClinicalTimeline } from './components/ClinicalTimeline';
import { wsClient } from './services/websocket';
import { fetchCases } from './services/api';
import { SimulationCase, KalinePrediction } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'physiology' | 'autocorrection' | 'workbench'>('monitor');
  const [cases, setCases] = useState<SimulationCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(true);

  // Initial State: First screen is Case Selection (selectedCaseId = null)
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Waveform Buffer for 60fps Canvas Oscilloscope
  const [waveformBuffer, setWaveformBuffer] = useState<number[]>([]);

  // Simulation Playback States
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [totalSec, setTotalSec] = useState<number>(600);

  // Default Telemetry State
  const [telemetry, setTelemetry] = useState<KalinePrediction>({
    ai_name: 'Kaline',
    version: '1.0-VitalDB',
    signal_status: { valid: true, message: 'SNUADC/ART 100 Hz Conectado' },
    hemodynamic_vitals: {
      sbp: 112,
      dbp: 66,
      map: 81,
      pp: 46,
      hr: 74,
      ppv: 10.2,
      dp_dt_max: 920,
      tau: 0.38,
    },
    predictions: {
      kaline_hpi_score: 35,
      alert_level: 'NORMAL',
      p_5min: 0.24,
      p_10min: 0.32,
      p_15min: 0.40,
      map_5min: 79,
      map_10min: 76,
      map_15min: 74,
    },
    forecast_trajectory: [
      { time_min: 0, map_est: 81, map_ci_low: 80, map_ci_high: 82, hypo_prob: 0.0 },
      { time_min: 5, map_est: 79, map_ci_low: 74, map_ci_high: 84, hypo_prob: 0.24 },
      { time_min: 10, map_est: 76, map_ci_low: 70, map_ci_high: 82, hypo_prob: 0.32 },
      { time_min: 15, map_est: 74, map_ci_low: 66, map_ci_high: 82, hypo_prob: 0.40 },
    ],
    explainability: {
      physiological_axes: {
        preload_responsiveness: 22,
        contractability_deficit: 18,
        vasodilation_index: 28,
        baseline_vulnerability: 42,
      } as any,
      feature_attributions: [
        {
          feature: 'Variação de Pressão de Pulso (VPP / PPV)',
          value: '10.2%',
          impact: 'Normal',
          contribution_pct: 14.0,
          interpretation: 'VPP dentro da faixa de normovolemia (< 13%).',
        },
        {
          feature: 'Contratilidade Miocárdica (dP/dt max)',
          value: '920 mmHg/s',
          impact: 'Preservado',
          contribution_pct: 12.0,
          interpretation: 'Inotropismo ventricular esquerdo preservado.',
        },
      ],
      clinical_recommendations: [
        '✅ <strong>Estabilidade Hemodinâmica</strong>: Parâmetros arteriais dentro da faixa de segurança.',
      ],
    },
  });

  // Load cases list
  useEffect(() => {
    setIsLoadingCases(true);
    fetchCases()
      .then((data) => {
        setCases(data);
        setIsLoadingCases(false);
      })
      .catch((e) => {
        console.error('Erro ao carregar casos:', e);
        setIsLoadingCases(false);
      });
  }, []);

  // Connect to WebSocket when a case is selected
  useEffect(() => {
    if (selectedCaseId === null) {
      wsClient.disconnect();
      setIsConnected(false);
      return;
    }

    wsClient.connect(selectedCaseId);
    setIsConnected(true);

    const unsubscribe = wsClient.subscribe((data) => {
      if (data.waveform_chunk && data.waveform_chunk.length > 0) {
        setWaveformBuffer((prev) => {
          const updated = [...prev, ...data.waveform_chunk];
          return updated.slice(-800); // Keep last 800 points for smooth canvas sweep
        });
      }

      if (data.elapsed_sec !== undefined) setElapsedSec(data.elapsed_sec);
      if (data.total_sec !== undefined) setTotalSec(data.total_sec);
      if (data.is_paused !== undefined) setIsPaused(data.is_paused);
      if (data.speed !== undefined) setPlaybackSpeed(data.speed);
      if (data.telemetry) setTelemetry(data.telemetry);
    });

    return () => {
      unsubscribe();
      wsClient.disconnect();
      setIsConnected(false);
    };
  }, [selectedCaseId]);

  const handleTogglePlayPause = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    wsClient.sendCommand({ action: nextState ? 'pause' : 'resume' });
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    wsClient.sendCommand({ action: 'set_speed', speed });
  };

  const handleSeek = (timeSec: number) => {
    setElapsedSec(timeSec);
    wsClient.sendCommand({ action: 'seek', time_sec: timeSec });
  };

  // 1. TELA INICIAL OBRIGATÓRIA: ESCOLHA DO CASO CLÍNICO
  if (selectedCaseId === null) {
    return (
      <CaseSelectionView
        cases={cases}
        isLoading={isLoadingCases}
        onSelectCase={(cid) => {
          setWaveformBuffer([]);
          setSelectedCaseId(cid);
        }}
      />
    );
  }

  // 2. TELA DO CASO SELECIONADO: MONITOR CLÍNICO & VALIDAÇÃO PROTÓTIPO
  const currentCase = cases.find((c) => c.caseid === selectedCaseId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-slate-800 selection:text-white overflow-x-hidden">
      {/* Top Clinical Prototype Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelectCase={(cid) => {
          setSelectedCaseId(cid);
          setWaveformBuffer([]);
        }}
        onBackToCaseSelection={() => {
          setSelectedCaseId(null);
          setWaveformBuffer([]);
        }}
        isPaused={isPaused}
        onTogglePlayPause={handleTogglePlayPause}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={handleChangeSpeed}
        elapsedSec={elapsedSec}
        totalSec={totalSec}
        onSeek={handleSeek}
        isConnected={isConnected}
        alertLevel={telemetry?.predictions?.alert_level || (telemetry?.status === 'SIGNAL_INVALID' ? 'SIGNAL_INVALID' : telemetry?.status === 'DISCONNECTED' ? 'DISCONNECTED' : 'NORMAL')}
        hpiScore={telemetry?.predictions?.kaline_hpi_score ?? 0}
      />

      {/* Main Clinical Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* TAB 1: MONITOR PREDITIVO PRINCIPAL */}
        {activeTab === 'monitor' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Real-time Arterial Waveform Oscilloscope */}
            <WaveformCanvas
              waveformBuffer={waveformBuffer}
              alertLevel={telemetry?.predictions?.alert_level || telemetry?.status || 'NORMAL'}
              height={220}
              vitals={telemetry?.hemodynamic_vitals}
            />

            {/* Sinais Vitais Numéricos & Fisiologia (6 Tiles) */}
            <KalineVitalsPanel vitals={telemetry.hemodynamic_vitals} />

            {/* Linha do Tempo Cirúrgica Interativa VitalDB */}
            {currentCase?.events && (
              <ClinicalTimeline
                events={currentCase.events}
                elapsedSec={elapsedSec}
                totalSec={totalSec}
                onSeek={handleSeek}
              />
            )}

            {/* Módulo Preditivo HPI & Projeção Contínua */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <KalineHPIGauge
                score={telemetry?.predictions?.kaline_hpi_score ?? null}
                alertLevel={telemetry?.predictions?.alert_level || telemetry?.status || 'NORMAL'}
                p5={telemetry?.predictions?.p_5min ?? null}
                p10={telemetry?.predictions?.p_10min ?? null}
                p15={telemetry?.predictions?.p_15min ?? null}
                map5={telemetry?.predictions?.map_5min ?? null}
                map10={telemetry?.predictions?.map_10min ?? null}
                map15={telemetry?.predictions?.map_15min ?? null}
              />

              <ForecastTrend
                currentMap={telemetry?.hemodynamic_vitals?.map ?? 80}
                trajectory={telemetry?.forecast_trajectory || []}
                map5={telemetry?.predictions?.map_5min ?? (telemetry?.hemodynamic_vitals?.map ?? 80)}
                map10={telemetry?.predictions?.map_10min ?? (telemetry?.hemodynamic_vitals?.map ?? 80)}
                map15={telemetry?.predictions?.map_15min ?? (telemetry?.hemodynamic_vitals?.map ?? 80)}
              />
            </div>
          </div>
        )}

        {/* TAB 2: ANÁLISE FISIOPATOLÓGICA */}
        {activeTab === 'physiology' && (
          <div className="space-y-4 animate-fadeIn">
            <KalinePhysiologyPanel
              telemetry={telemetry}
            />

            {/* Arterial Waveform Context */}
            <WaveformCanvas
              waveformBuffer={waveformBuffer}
              alertLevel={telemetry?.predictions?.alert_level || telemetry?.status || 'NORMAL'}
              height={180}
              vitals={telemetry?.hemodynamic_vitals}
            />
          </div>
        )}

        {/* TAB 3: AUTO-CORREÇÃO & MORFOMETRIA ARTERIAL */}
        {activeTab === 'autocorrection' && (
          <div className="animate-fadeIn">
            <KalineAutoCorrectionPanel />
          </div>
        )}

        {/* TAB 4: AVALIAÇÃO MANUAL / WORKBENCH */}
        {activeTab === 'workbench' && (
          <div className="animate-fadeIn">
            <PatientForm />
          </div>
        )}
      </main>

      {/* Monitor Bottom Bezel */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-slate-900 font-bold">Kaline IA Protótipo</span>
            <span>•</span>
            <span>VitalDB (Canal SNUADC/ART 100 Hz)</span>
            <span>•</span>
            <span className="text-red-600 font-semibold">Limiar: PAM &lt; 65 mmHg</span>
          </div>
          <div>
            Horizontes: <span className="text-slate-800 font-bold">+5m</span> | <span className="text-slate-800 font-bold">+10m</span> | <span className="text-slate-800 font-bold">+15m</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
