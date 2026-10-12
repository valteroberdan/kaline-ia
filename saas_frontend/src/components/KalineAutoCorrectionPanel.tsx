import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  Sliders,
  GitBranch,
  BarChart2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { fetchSelfCorrectionReport } from '../services/api';
import { SelfCorrectionReport } from '../types';

export const KalineAutoCorrectionPanel: React.FC = () => {
  const [report, setReport] = useState<SelfCorrectionReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedHorizon, setSelectedHorizon] = useState<'5' | '10' | '15'>('5');
  const [filterCategory, setFilterCategory] = useState<string>('TODOS');

  const loadReport = () => {
    setIsLoading(true);
    fetchSelfCorrectionReport()
      .then((data) => {
        setReport(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar relatório de auto-correção:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
        <RefreshCw className="h-6 w-6 text-slate-600 animate-spin mx-auto" />
        <p className="text-xs font-mono text-slate-600">
          Carregando telemetria de morfometria arterial e ciclos de auto-correção da Kaline IA...
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3 shadow-xs">
        <Cpu className="h-8 w-8 text-slate-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-900 font-mono uppercase">
          Relatório de Auto-Correção Indisponível
        </h4>
        <p className="text-xs text-slate-500">
          O motor de auto-calibração ainda não concluiu a persistência do checkpoint.
        </p>
        <button
          onClick={loadReport}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-bold text-white transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const categories = [
    'TODOS',
    'Morfometria Não-Linear & Complexidade',
    'Variabilidade & Dinâmica Respiratória',
    'Pressões Basais & Relações',
    'Windkessel & Áreas de Ejeção',
    'Contratilidade & Derivadas da Onda',
    'Incisura Dícrota & Reflexão de Onda',
    'Espectro de Frequência & Balanço Autonômico',
  ];

  const filteredBiomarkers =
    filterCategory === 'TODOS'
      ? report.top_biomarkers
      : report.top_biomarkers.filter((b) => b.category === filterCategory);

  const horizonMetrics = report.final_test_metrics[selectedHorizon];
  const horizonLit = report.benchmark_comparison?.[`${selectedHorizon}min`]?.bja_2021_reference;
  const optimalThreshold = report.optimal_thresholds[selectedHorizon];

  return (
    <div className="space-y-4">
      {/* Top Banner: Status & Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight uppercase font-mono">
                  Auto-Correção & Morfometria Arterial
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="h-3 w-3" />
                  {report.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Treinamento Exaustivo e Calibração Fisiológica Multi-Paramétrica a 100 Hz (VitalDB)
              </p>
            </div>
          </div>

          <button
            onClick={loadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-mono text-slate-700 border border-slate-300 transition-colors self-start md:self-auto cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Atualizar Telemetria</span>
          </button>
        </div>

        {/* 4 Overview Indicator Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Biomarcadores Analisados
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
              {report.total_biomarkers_evaluated}
            </div>
            <span className="text-[11px] text-slate-500">61 da Onda + 14 Clínicos</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Ciclos de Auto-Ajuste
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-1">
              {report.cycles_history?.length || 5} Ciclos
            </div>
            <span className="text-[11px] text-emerald-700">Otimização Youden J</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              AUROC Médio Final
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
              {(() => {
                if (report.final_test_metrics) {
                  const vals = Object.values(report.final_test_metrics)
                    .map((m) => m.auroc)
                    .filter((v) => typeof v === 'number' && !isNaN(v));
                  if (vals.length > 0) {
                    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3);
                  }
                }
                return '--';
              })()}
            </div>
            <span className="text-[11px] text-slate-500">Média Teste Independente</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Erro Médio da PAM (MAE)
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-purple-700 mt-1">
              {horizonMetrics ? `${horizonMetrics.mae_map_mmhg.toFixed(2)}` : '--'}{' '}
              <span className="text-xs font-normal text-slate-500">mmHg</span>
            </div>
            <span className="text-[11px] text-purple-700">vs 7.1 mmHg (Literatura)</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: TIMELINE DOS 5 CICLOS DE AUTO-CORREÇÃO */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <GitBranch className="h-4 w-4 text-slate-700" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase font-mono tracking-tight">
            Evolução dos Ciclos de Auto-Correção da Kaline IA
          </h4>
        </div>

        <div className="space-y-3">
          {report.cycles_history.map((cycleItem) => (
            <div
              key={cycleItem.cycle}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {cycleItem.cycle}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      Ciclo {cycleItem.cycle}: {cycleItem.name}
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">{cycleItem.action}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs self-start sm:self-auto shrink-0">
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    AUROC: <strong className="text-emerald-700">{cycleItem.mean_auroc.toFixed(3)}</strong>
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    MAE PAM:{' '}
                    <strong className="text-purple-700">{cycleItem.mean_mae_map.toFixed(2)} mmHg</strong>
                  </span>
                </div>
              </div>

              {/* Sub-metrics per horizon */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px] font-mono">
                {Object.entries(cycleItem.horizons).map(([hKey, hData]) => (
                  <div key={hKey} className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-500 font-bold block">+{hKey}min:</span>
                    <span className="text-emerald-700 font-semibold">AUROC {hData.auroc.toFixed(3)}</span> •{' '}
                    <span className="text-slate-700">Sens {hData.sensitivity.toFixed(0)}%</span> •{' '}
                    <span className="text-slate-700">Esp {hData.specificity.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: TOP 20 BIOMARCADORES DA ONDA ARTERIAL */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-slate-700" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase font-mono tracking-tight">
              Ranking dos Principais Biomarcadores da Curva Arterial
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Filtrar:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1 outline-none font-mono"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {filteredBiomarkers.map((b) => {
            const maxPct = 4.0;
            const barWidth = Math.min(100, (b.importance_pct / maxPct) * 100);

            return (
              <div
                key={b.rank}
                className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-[10px] w-5 text-right font-bold">
                      #{b.rank}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{b.biomarker}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono hidden md:inline">
                      {b.category}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-xs">
                    {b.importance_pct.toFixed(2)}%
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-800 h-full rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: CALIBRAÇÃO DOS LIMIARES DE DECISÃO & BENCHMARK CIENTÍFICO */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-slate-700" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase font-mono tracking-tight">
              Calibração de Decisão & Validação Exaustiva por Horizonte
            </h4>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 font-mono text-xs">
            {(['5', '10', '15'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setSelectedHorizon(h)}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  selectedHorizon === h
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                +{h} min
              </button>
            ))}
          </div>
        </div>

        {horizonMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kaline Auto-Calibrada */}
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 font-mono uppercase flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-slate-700" /> Kaline IA Auto-Calibrada (+{selectedHorizon}m)
                </span>
                <span className="text-[10px] font-mono bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                  Limiar Youden: {optimalThreshold}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">AUROC</span>
                  <span className="text-emerald-700 font-black text-base">
                    {horizonMetrics.auroc.toFixed(3)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Sensibilidade</span>
                  <span className="text-emerald-700 font-black text-base">
                    {horizonMetrics.sensitivity.toFixed(1)}%
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Especificidade</span>
                  <span className="text-emerald-700 font-black text-base">
                    {horizonMetrics.specificity.toFixed(1)}%
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">MAE da PAM</span>
                  <span className="text-purple-700 font-black text-base">
                    {horizonMetrics.mae_map_mmhg.toFixed(2)} mmHg
                  </span>
                </div>
              </div>
            </div>

            {/* Referência Internacional */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 font-mono uppercase flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-500" /> Referência Científica (BJA 2021)
                </span>
                <span className="text-[10px] font-mono bg-white text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                  Padrão de Literatura
                </span>
              </div>

              {horizonLit ? (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">AUROC Referência</span>
                    <span className="text-slate-800 font-black text-base">
                      {horizonLit.auroc.toFixed(3)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Sensibilidade</span>
                    <span className="text-slate-800 font-black text-base">
                      {horizonLit.sensitivity.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Especificidade</span>
                    <span className="text-slate-800 font-black text-base">
                      {horizonLit.specificity.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">MAE da PAM</span>
                    <span className="text-slate-800 font-black text-base">
                      {horizonLit.mae_map_mmhg.toFixed(2)} mmHg
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Dados de referência em carregamento...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
