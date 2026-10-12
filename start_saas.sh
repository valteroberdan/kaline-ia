#!/bin/bash

# Script de Inicialização da IA Kaline & Micro-SaaS Local
# Inicia Backend FastAPI (Porta 8000) e Frontend React (Porta 5173)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================="
echo "   INICIANDO PLATAFORMA MICRO-SAAS IA KALINE (VITALDB CORE)     "
echo "================================================================="

# 1. Ativar ambiente Python
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "Ambiente virtual .venv não encontrado. Criando..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r saas_backend/requirements.txt
fi

# 2. Iniciar Backend FastAPI na porta 8090
echo "[1/2] Iniciando Backend FastAPI na porta 8090..."
export PYTHONPATH=.
python3 -m uvicorn saas_backend.main:app --host 0.0.0.0 --port 8090 &
BACKEND_PID=$!

# Função para encerrar os processos ao sair
cleanup() {
    echo ""
    echo "Encerrando servidores da IA Kaline..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Aguardar backend iniciar
sleep 2

# 3. Iniciar Frontend Vite na porta 5190
echo "[2/2] Iniciando Frontend React na porta 5190..."
cd saas_frontend
npm run dev -- --host --port 5190 &
FRONTEND_PID=$!

echo ""
echo "================================================================="
echo "   SISTEMA PRONTO! ACESSE NO NAVEGADOR:                          "
echo "   👉 Frontend Dashboard: http://localhost:5190                 "
echo "   👉 Documentação da API: http://localhost:8090/docs           "
echo "================================================================="
echo "Pressione Ctrl+C para encerrar."

wait $FRONTEND_PID
