import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface PredictiveLockGateProps {
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  children: React.ReactNode;
}

export const PredictiveLockGate: React.FC<PredictiveLockGateProps> = ({
  isUnlocked,
  onUnlock,
  onLock,
  children,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const CORRECT_PIN = '7777';

  const handleVerifyPin = (inputPin?: string) => {
    const pinToTest = inputPin !== undefined ? inputPin : pin;
    if (pinToTest.trim() === CORRECT_PIN) {
      setError(false);
      setPin('');
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2500);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        handleVerifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  if (isUnlocked) {
    return (
      <div className="space-y-3">
        {/* Unlocked status bar with discreet lock button */}
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-mono">
            <Unlock className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-bold">MÓDULO PREDITIVO DESBLOQUEADO</span>
            <span className="hidden sm:inline text-emerald-400">•</span>
            <span className="hidden sm:inline text-emerald-700 text-[11px]">
              Cálculo de HPI e Projeção de PAM Contínua Ativos
            </span>
          </div>
          <button
            onClick={onLock}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border border-slate-300 cursor-pointer shadow-xs"
            title="Bloquear Módulo Preditivo com Senha"
          >
            <Lock className="h-3 w-3 text-slate-500" />
            <span>Bloquear</span>
          </button>
        </div>

        {/* Unlocked Content */}
        {children}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-300 rounded-xl p-5 sm:p-7 shadow-sm relative overflow-hidden">
      <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-4">
        {/* Icon */}
        <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
          <Lock className="h-6 w-6" />
        </div>

        {/* Header Titles */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 mb-1.5">
            <KeyRound className="h-3 w-3" />
            ACESSO CLÍNICO RESTRITO
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Módulo Preditivo Bloqueado por Senha
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Digite o PIN padrão para liberar o índice HPI e a projeção de PAM (+5m, +10m, +15m)
          </p>
        </div>

        {/* PIN Display & Input Form */}
        <div className="w-full space-y-3 pt-1">
          {/* 4 Digit PIN Dots */}
          <div className="flex items-center justify-center gap-2.5 py-1">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`h-11 w-11 rounded-lg border-2 flex items-center justify-center text-lg font-mono font-black transition-all ${
                    error
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : isFilled
                      ? 'border-slate-800 bg-slate-100 text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  {isFilled ? (showPassword ? pin[idx] : '●') : ''}
                </div>
              );
            })}
          </div>

          {/* Keyboard Input Alternative */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyPin();
            }}
            className="flex items-center gap-2 max-w-xs mx-auto"
          >
            <div className="relative flex-1">
              <input
                type={showPassword ? 'text' : 'password'}
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                  setError(false);
                  if (val.length === 4) handleVerifyPin(val);
                }}
                placeholder="Digite 7777"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-center text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:border-slate-700 transition-colors placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 shadow-xs"
            >
              Liberar
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="text-xs text-red-600 font-mono flex items-center justify-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Senha incorreta. (Senha padrão: 7777)</span>
            </div>
          )}

          {/* On-Screen Touch Keypad */}
          <div className="pt-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase mb-2">
              Teclado Numérico
            </div>
            <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="h-10 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-base font-mono font-bold text-slate-800 transition-all cursor-pointer shadow-xs flex items-center justify-center select-none"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-10 rounded-lg bg-slate-50 hover:bg-slate-200 border border-slate-200 text-xs font-mono font-medium text-slate-500 transition-all cursor-pointer flex items-center justify-center select-none"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-10 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-base font-mono font-bold text-slate-800 transition-all cursor-pointer shadow-xs flex items-center justify-center select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-10 rounded-lg bg-slate-50 hover:bg-slate-200 border border-slate-200 text-xs font-mono font-medium text-slate-500 transition-all cursor-pointer flex items-center justify-center select-none"
              >
                ⌫
              </button>
            </div>
          </div>
        </div>

        {/* Helper Note */}
        <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-100 w-full flex items-center justify-center gap-1.5">
          <span>Senha de validação do protótipo:</span>
          <span className="text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            7777
          </span>
        </div>
      </div>
    </div>
  );
};
