# Guia de Contribuição — Kaline IA Protótipo

Agradecemos imensamente o seu interesse em contribuir com a **Kaline IA**! Este é um projeto de código aberto voltado para pesquisa, engenharia biomédica e validação de inteligência artificial aplicada ao monitoramento hemodinâmico intraoperatório.

---

## 📋 Sumário
1. [Princípios do Projeto](#princípios-do-projeto)
2. [Código de Conduta](#código-de-conduta)
3. [Como Posso Contribuir?](#como-posso-contribuir)
4. [Configurando o Ambiente de Desenvolvimento](#configurando-o-ambiente-de-desenvolvimento)
5. [Padrões de Código e Testes](#padrões-de-código-e-testes)
6. [Fluxo de Pull Requests](#fluxo-de-pull-requests)
7. [Aviso Ético e Regulatório](#aviso-ético-e-regulatório)

---

## 🔬 Princípios do Projeto

1. **Rigor Científico**: Métodos de extração morfológica e métricas de desempenho preditivo devem ser baseados em literatura revisada por pares (ex.: consensos de anestesiologia e publicações VitalDB).
2. **Reprodutibilidade**: Todo modelo treinado e script de inferência deve ser reproduzível a partir de conjuntos de dados abertos ou casos de teste documentados.
3. **Privacidade e Ética de Dados**: Jamais faça upload ou submeta dados clínicos protegidos (PHI) que violem HIPAA/LGPD. Apenas utilize datasets anonimizados públicos (como o VitalDB).

---

## 🤝 Código de Conduta

Ao participar deste projeto, você concorda em seguir o nosso [Código de Conduta](CODE_OF_CONDUCT.md). Tratamos todas as pessoas com respeito, empatia e profissionalismo.

---

## 🛠️ Como Posso Contribuir?

- **Reportar Bugs**: Abra uma *Issue* descrevendo o problema, passos para reproduzir e logs de erro.
- **Sugerir Melhorias / Eixos Fisiológicos**: Abra uma *Issue* detalhando novos biomarcadores morfológicos da onda arterial, modelos de rede neural ou melhorias na interface médica.
- **Melhorar a Documentação**: Correções de grafia, traduções ou tutoriais técnicos são sempre bem-vindos.
- **Implementar Código**: Corrija uma issue existente ou envie uma melhoria através de um *Pull Request*.

---

## 💻 Configurando o Ambiente de Desenvolvimento

### Pré-requisitos:
- Python 3.9+
- Node.js 18+ e npm
- Git

### Passos de Instalação:

1. **Clone o seu Fork**:
   ```bash
   git clone https://github.com/SEU_USUARIO/kaline-ia.git
   cd kaline-ia
   ```

2. **Configure o Ambiente Python**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r saas_backend/requirements.txt
   pip install pytest
   ```

3. **Configure as Dependências do Frontend**:
   ```bash
   cd saas_frontend
   npm install
   cd ..
   ```

4. **Inicie o Ambiente em Modo de Desenvolvimento**:
   ```bash
   ./start_saas.sh
   ```

---

## 🧪 Padrões de Código e Testes

Antes de submeter um Pull Request, execute toda a suíte de testes automatizados:

```bash
# Executar testes unitários e de integração do backend:
PYTHONPATH=. pytest tests/ -v

# Verificar tipagem e build do frontend:
npm --prefix saas_frontend run build
```

Todos os testes devem passar (100% de sucesso) antes da mesclagem.

---

## 🚀 Fluxo de Pull Requests

1. Crie uma branch específica para sua funcionalidade ou correção:
   ```bash
   git checkout -b feat/novo-biomarcador-onda
   # ou
   git checkout -b fix/ajuste-calculo-vpp
   ```
2. Faça commits atômicos com mensagens claras seguindo o padrão de commits convencionais (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
3. Atualize a documentação e os testes conforme necessário.
4. Envie a branch para o seu fork no GitHub:
   ```bash
   git push origin feat/novo-biomarcador-onda
   ```
5. Abra um **Pull Request** para a branch `main` do repositório oficial `valteroberdan/kaline-ia`.

---

## ⚖️ Aviso Ético e Regulatório

Este software é um **protótipo acadêmico e de validação tecnológica**, disponibilizado sob a **Licença MIT**. Não possui certificação ANVISA, FDA ou marcação CE para uso diagnóstico ou terapêutico em seres humanos sem supervisão médica. Decisões clínicas são de responsabilidade exclusiva dos médicos assistentes.
