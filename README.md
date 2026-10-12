# Kaline IA Protótipo — Monitor Clínico & Predição Precoce de Hipotensão Intraoperatória

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC.svg)](https://tailwindcss.com/)
[![Electron](https://img.shields.io/badge/Desktop-macOS%20Native%20App-47848F.svg)](https://www.electronjs.org/)
[![VitalDB](https://img.shields.io/badge/Dataset-VitalDB%20100%20Hz-red.svg)](https://vitaldb.net/)

O **Kaline IA Protótipo** é um sistema médico preditivo projetado para antecipar eventos de **hipotensão arterial intraoperatória (PAM < 65 mmHg)** com **5, 10 e 15 minutos de antecedência**, analisando o fluxo contínuo de pressão arterial invasiva a 100 Hz (Canal `SNUADC/ART` da base internacional **VitalDB**).

---

## 🎯 Principais Funcionalidades

1. **Osciloscópio Médico em Tempo Real (60 FPS)**:
   - Renderização fluida da forma de onda da linha arterial contínua em Canvas com grade milimetrada padrão UTI/CC.
   - Detecção instantânea de batimentos e cálculo em tempo real de **PAS, PAD, PAM, PP, FC, VPP (PPV)** e **dP/dt máx**.

2. **Índice Preditivo HPI & Radar de Risco**:
   - Score contínuo de predição precoce (0 a 100) calibrado contra episódios reais de descompensação hemodinâmica.
   - Categorização em níveis clínicos de alerta: `NORMAL`, `WARNING` e `CRITICAL`.
   - **Controle de Acesso por Senha**: Módulo preditivo avançado protegido por PIN de segurança (`7777`).

3. **Morfometria Arterial Avançada (61 Biomarcadores)**:
   - Decomposição batimento a batimento em 9 eixos fisiológicos:
     - Pressões Basais e Relações (PAS, PAD, PAM, PP, PAM/PP, PAD/PAS)
     - Cronometria do Ciclo Cardíaco (T_ciclo, T_sístole, T_diástole, T_subida)
     - Contratilidade & Derivadas ($dP/dt_{\max}$, $dP/dt_{\min}$, $d^2P/dt^2$)
     - Modelo Windkessel e Ejeção (AUC sistólica, AUC diastólica, Tau)
     - Incisura Dícrota e Reflexão de Onda (Pressão dícrota, Augmentation Index)
     - Dinâmica Cardiorrespiratória & Volemia (VPP, VSP, HRV)
     - Espectro FFT (VLF, LF simpático, HF vagal, LF/HF)
     - Dinâmica Não-Linear (Entropia Amostral SampEn, Poincaré SD1/SD2)
     - Slopes Dinâmicos de Curto Prazo (30s)

4. **Motor de Auto-Correção Autônomo**:
   - Diagnóstico automatizado de resíduos, mineração de casos limiares (focal mining), poda de colinearidade e calibração de limiares ótimos pelo Índice de Youden.

5. **Navegação Cirúrgica por Casos Clínicos**:
   - Interface inicial com seleção de casos cirúrgicos reais arquivados do VitalDB (ex: ressecções retais, colecistectomias, cirurgias torácicas).
   - Início imediato com sinais contínuos da linha arterial desde o primeiro segundo.

6. **Aplicativo Nativo Desktop (macOS)**:
   - Execução autônoma via Electron encapsulando o frontend e o motor de inferência local.

---

## 💻 Como Executar

### 1. Aplicativo Desktop macOS

Abra diretamente no terminal ou clique duas vezes:
```bash
./iniciar_aplicativo.command
```
Para instalar na pasta `/Applications` do Mac:
```bash
./instalar_no_mac.command
```

### 2. Execução Web / Micro-SaaS Local

```bash
# Inicia tanto o backend FastAPI (porta 8090) quanto o frontend Vite (porta 5190)
./start_saas.sh
```

Acesse:
- **Painel Clínico**: [http://localhost:5190](http://localhost:5190)
- **API Swagger / Documentação**: [http://localhost:8090/docs](http://localhost:8090/docs)

---

## 🧪 Suíte de Testes Automatizados

O sistema inclui testes de integração cobrindo extração morfológica, modelos preditivos e endpoints FastAPI:

```bash
PYTHONPATH=. .venv/bin/pytest tests/ -v
```

---

## 🛡️ Segurança e Propriedade Intelectual

- Sistema concebido para fins de pesquisa e validação preditiva pré-clínica.
- Compatível com a base aberta de dados fisiológicos de alta resolução **VitalDB** (*Seoul National University Hospital*).
- O módulo preditivo contínuo é bloqueado por padrão e requer o PIN clínico padrão: `7777`.

---

## 🤝 Como Contribuir

Contribuições da comunidade são muito bem-vindas! Você pode colaborar propondo novos biomarcadores hemodinâmicos, melhorias na arquitetura neural ou refinamentos de interface.
- Consulte o nosso [Guia de Contribuição (CONTRIBUTING.md)](CONTRIBUTING.md) para detalhes sobre fluxo de trabalho, padrões de commit e testes.
- Leia o nosso [Código de Conduta (CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md).
- Para reportar vulnerabilidades ou questões de dados, confira nossa [Política de Segurança (SECURITY.md)](SECURITY.md).

---

## 📜 Licença

Este projeto é distribuído como software livre e de código aberto sob os termos da **[Licença MIT](LICENSE)**.

---

## ⚖️ Disclaimer Médico

O **Kaline IA Protótipo** é um projeto de pesquisa acadêmica em engenharia biomédica e aprendizado de máquina. Não é um dispositivo médico certificado por agências regulatórias (ANVISA, FDA, CE-mark). O software não deve ser utilizado como única base para tomadas de decisão terapêutica ou diagnóstica em seres humanos reais. O suporte de decisão clínica permanece sob julgamento e responsabilidade exclusiva do médico anestesiologista ou intensivista.
