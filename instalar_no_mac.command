#!/bin/bash
# Script de Instalação do Kaline IA Protótipo no macOS
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SRC="$DIR/release/Kaline IA-darwin-arm64/Kaline IA.app"
[ ! -d "$APP_SRC" ] && APP_SRC="$DIR/release/IA Kaline-darwin-arm64/IA Kaline.app"

echo "=========================================================="
echo " Instalando Kaline IA Protótipo na pasta Aplicativos macOS "
echo "=========================================================="

if [ -d "$APP_SRC" ]; then
    echo "Copiando para /Applications/Kaline IA.app..."
    rm -rf "/Applications/Kaline IA.app" "/Applications/IA Kaline.app"
    cp -R "$APP_SRC" "/Applications/Kaline IA.app"
    echo "✅ Instalação concluída com sucesso!"
    echo "O aplicativo já está disponível no seu Launchpad e na pasta Aplicativos."
    echo ""
    read -p "Deseja abrir o aplicativo agora? (s/n): " RESPOSTA
    if [[ "$RESPOSTA" =~ ^[Ss]$ ]]; then
        open "/Applications/Kaline IA.app"
    fi
else
    echo "❌ Erro: Pacote não encontrado em $APP_SRC."
fi
