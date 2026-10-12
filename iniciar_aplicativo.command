#!/bin/bash
# Script de Inicialização Rápida do Aplicativo Instalado - Kaline IA Protótipo
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "======================================================"
echo "    Iniciando Aplicativo - Kaline IA Protótipo        "
echo "======================================================"

# Abre o aplicativo nativo macOS
if [ -d "$DIR/Kaline IA.app" ]; then
    open "$DIR/Kaline IA.app"
elif [ -d "$DIR/release/Kaline IA-darwin-arm64/Kaline IA.app" ]; then
    open "$DIR/release/Kaline IA-darwin-arm64/Kaline IA.app"
elif [ -d "$DIR/IA Kaline.app" ]; then
    open "$DIR/IA Kaline.app"
else
    npm run app
fi
