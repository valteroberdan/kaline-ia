import React from 'react';
import {
  Activity,
  User,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  FileText,
  Stethoscope,
  Info,
} from 'lucide-react';
import { SimulationCase } from '../types';

interface CaseSelectionViewProps {
  cases: SimulationCase[];
  onSelectCase: (caseId: number) => void;
  isLoading?: boolean;
}

export const CaseSelectionView: React.FC<CaseSelectionViewProps> = ({
  cases,
  onSelectCase,
  isLoading = false,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-800 selection:text-white flex flex-col">
      {/* Top Prototype Header Bar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="./logo_icon.png"
              alt="Kaline IA"
              className="h-11 w-11 object-contain shrink-0 rounded-lg shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-[#0b2827] tracking-tight">
                  Kaline<sup className="text-xs font-bold text-[#c78a3b] ml-0.5">IA</sup>
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-mono font-bold uppercase tracking-wider">
                  Protótipo
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-mono font-semibold">
                  Inteligência Preditiva
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 font-mono font-semibold">
                  VitalDB 100 Hz
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Sistema Preditivo Precoce de Hipotensão Arterial Intraoperatória (+5m, +10m, +15m)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Motor de Inferência Ativo</span>
            <span className="text-slate-400">|</span>
            <span>Limiar: PAM &lt; 65 mmHg</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Step Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
            <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Etapa Inicial Obrigatória</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Selecione o Caso Clínico para Iniciar a Simulação
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl">
            Escolha um dos casos cirúrgicos reais arquivados do consórcio <strong>VitalDB</strong>. Ao carregar o caso, o osciloscópio médico reproduzirá os sinais contínuos da linha arterial a 100 Hz (Canal <code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-800">SNUADC/ART</code>) com a predição da Kaline IA.
          </p>
        </div>

        {/* Cases Grid */}
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-mono text-sm">
            Carregando catálogo de casos cirúrgicos do VitalDB...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cases.map((c) => {
              const isCase7 = c.caseid === 7;

              let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
              if (c.asa >= 3) {
                badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
              }
              const badgeText = c.risk_profile || `Cirurgia Porte ASA ${c.asa}`;

              return (
                <div
                  key={c.caseid}
                  className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden min-w-0"
                >
                  <div className="space-y-3.5 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 min-w-0">
                      <div className="min-w-0 flex-1 pr-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white shrink-0">
                            CASO #{c.caseid}
                          </span>
                          {isCase7 && (
                            <span className="text-[10px] uppercase font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded shrink-0">
                              Caso de Aula
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug truncate" title={c.op}>
                          {c.op}
                        </h3>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 text-right max-w-[140px] sm:max-w-[170px] truncate ${badgeStyle}`}
                        title={badgeText}
                      >
                        {badgeText}
                      </span>
                    </div>

                    {/* Patient Profile Specs */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs font-mono">
                      <div className="grid grid-cols-2 gap-2 text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Paciente</span>
                          <strong>
                            {c.age} anos, {c.gender === 'M' ? 'Masculino' : 'Feminino'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Estado Físico</span>
                          <strong className="text-slate-900">ASA {c.asa}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1 border-t border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">IMC / Peso</span>
                          <span>{c.bmi ? `${c.bmi} kg/m²` : '24.2 kg/m²'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Comorbidades</span>
                          <span>
                            {c.preop_htn ? 'HAS' : ''}
                            {c.preop_htn && c.preop_dm ? ' • ' : ''}
                            {c.preop_dm ? 'DM' : ''}
                            {!c.preop_htn && !c.preop_dm ? 'Nenhuma' : ''}
                          </span>
                        </div>
                      </div>

                      {(c.preop_hb || c.preop_cr) && (
                        <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1 border-t border-slate-200 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Hemoglobina</span>
                            <span>{c.preop_hb ? `${c.preop_hb} g/dL` : '12.5 g/dL'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Creatinina</span>
                            <span>{c.preop_cr ? `${c.preop_cr} mg/dL` : '1.0 mg/dL'}</span>
                          </div>
                        </div>
                      )}

                      {/* VitalDB Surgical & Hemodynamic Markers */}
                      <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Marcadores Cirúrgicos do VitalDB:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="bg-white p-1.5 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[9px] uppercase font-bold">Sangramento (EBL)</span>
                            <span className={`font-bold ${c.ebl_ml && c.ebl_ml >= 500 ? 'text-red-600' : 'text-slate-800'}`}>
                              {c.ebl_ml !== undefined ? `${c.ebl_ml} mL` : 'N/A'}
                            </span>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-slate-200">
                            <span className="text-slate-500 block text-[9px] uppercase font-bold">Transfusão</span>
                            <span className={`font-bold ${c.transfusion_units ? 'text-red-600' : 'text-emerald-700'}`}>
                              {c.transfusion_units ? `${c.transfusion_units} Bolsas (CH)` : 'Não transfundido'}
                            </span>
                          </div>
                        </div>

                        {c.vasopressors && (
                          <div className="bg-white p-1.5 rounded border border-slate-200 flex items-center justify-between gap-1.5 min-w-0 overflow-hidden">
                            <span className="text-slate-500 text-[9px] uppercase font-bold shrink-0">Vasopressor</span>
                            <span className="font-bold text-slate-800 truncate text-[10px] min-w-0 text-right flex-1" title={c.vasopressors}>
                              {c.vasopressors}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline of Real Clinical Events */}
                    {c.events && c.events.length > 0 && (
                      <div className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5 min-w-0 overflow-hidden">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1 truncate">
                          <Clock className="h-3 w-3 text-slate-600 shrink-0" />
                          <span>Marcos Registrados:</span>
                        </span>
                        <div className="space-y-1 min-w-0">
                          {c.events.slice(0, 3).map((ev, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono min-w-0">
                              <span className="bg-slate-200 text-slate-700 px-1 py-0.2 rounded text-[10px] font-bold shrink-0">
                                {Math.floor(ev.time_sec / 60)}:{(ev.time_sec % 60).toString().padStart(2, '0')}
                              </span>
                              <span className="text-slate-800 truncate min-w-0 flex-1" title={ev.label}>
                                {ev.label}
                              </span>
                            </div>
                          ))}
                          {c.events.length > 3 && (
                            <div className="text-[10px] text-slate-500 font-mono italic truncate">
                              + {c.events.length - 3} outros marcos no replay
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Clinical Scenario Description */}
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                        Cenário da Linha Arterial:
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3" title={c.scenario}>
                        {c.scenario ||
                          'Registro contínuo intraoperatório com dados de morfometria arterial a 100 Hz.'}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 mt-2">
                    <button
                      onClick={() => onSelectCase(c.caseid)}
                      className="w-full py-2.5 px-4 rounded-lg font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <span>Iniciar Monitoramento</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Informative Prototype Note */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5 font-mono">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Info className="h-4 w-4 text-slate-600" />
            <span>Nota de Validação Técnica do Protótipo:</span>
          </div>
          <p>
            O canal <code className="bg-white px-1 py-0.5 rounded border border-slate-300 text-slate-800">SNUADC/ART</code> armazena a pressão arterial invasiva aferida via cateter arterial periférico com resolução de 100 amostras por segundo. A Kaline IA extrai 61 parâmetros da morfologia da onda (área sistólica, dP/dt, entropia amostral, VPP, reflexão dícrota) para predizer eventos de hipotensão (PAM &lt; 65 mmHg) em 5, 10 e 15 minutos.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs font-mono text-slate-500">
        Kaline IA Protótipo • Validação Clínica & Medicina Baseada em Evidências • Base VitalDB
      </footer>
    </div>
  );
};
