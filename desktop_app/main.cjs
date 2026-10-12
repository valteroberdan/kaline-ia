const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 8090;

function findProjectRoot() {
  const candidates = [
    process.env.IA_KALINE_ROOT,
    path.resolve(__dirname, '..'),
    path.resolve(process.cwd()),
    '/Users/valteroberdan/Documents/IA Kaline ',
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'saas_backend', 'main.py'))) {
      return c;
    }
  }
  return '/Users/valteroberdan/Documents/IA Kaline ';
}

const PROJECT_ROOT = findProjectRoot();

function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(maxAttempts = 35) {
  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function startBackendIfNeeded() {
  return new Promise(async (resolve) => {
    const alreadyRunning = await checkBackendHealth();
    if (alreadyRunning) {
      console.log('[Desktop] Motor da Kaline IA já está ativo na porta 8090.');
      resolve(true);
      return;
    }

    console.log('[Desktop] Inicializando motor Python da Kaline IA...');
    const pythonVenv = path.join(PROJECT_ROOT, '.venv', 'bin', 'python');
    const pythonExe = fs.existsSync(pythonVenv) ? pythonVenv : 'python3';

    backendProcess = spawn(
      pythonExe,
      ['-m', 'uvicorn', 'saas_backend.main:app', '--host', '127.0.0.1', '--port', String(BACKEND_PORT)],
      {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          PYTHONPATH: PROJECT_ROOT,
        },
        stdio: 'inherit',
      }
    );

    backendProcess.on('error', (err) => {
      console.error('[Desktop] Erro ao iniciar processo Python:', err);
    });

    const isReady = await waitForBackend();
    if (isReady) {
      console.log('[Desktop] Motor da Kaline IA conectado com sucesso!');
    } else {
      console.warn('[Desktop] Tempo limite excedido ao aguardar o motor Python.');
    }
    resolve(isReady);
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 960,
    minHeight: 650,
    title: 'Kaline IA Protótipo - Monitor Clínico Preditivo (VitalDB)',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Check candidate dist locations
  const distCandidates = [
    path.join(__dirname, 'dist', 'index.html'),
    path.join(PROJECT_ROOT, 'desktop_app', 'dist', 'index.html'),
    path.join(PROJECT_ROOT, 'saas_frontend', 'dist', 'index.html'),
  ];

  let loaded = false;
  for (const p of distCandidates) {
    if (fs.existsSync(p)) {
      mainWindow.loadFile(p);
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    mainWindow.loadURL('http://localhost:5190');
  }

  // Open external links in default web browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createApplicationMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: 'Kaline IA',
            submenu: [
              { role: 'about', label: 'Sobre a Kaline IA Protótipo' },
              { type: 'separator' },
              { role: 'services', label: 'Serviços' },
              { type: 'separator' },
              { role: 'hide', label: 'Ocultar Kaline IA' },
              { role: 'hideOthers', label: 'Ocultar Outros' },
              { role: 'unhide', label: 'Mostrar Tudo' },
              { type: 'separator' },
              { role: 'quit', label: 'Encerrar Kaline IA' },
            ],
          },
        ]
      : []),
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Reiniciar Monitoramento / Recarregar',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload(),
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Fechar Janela' } : { role: 'quit', label: 'Sair' },
      ],
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Recarregar Forçado' },
        { role: 'toggleDevTools', label: 'Console de Desenvolvedor' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Padrão (100%)' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' },
      ],
    },
    {
      label: 'Janela',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'zoom', label: 'Expandir Janela' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front', label: 'Trazer para Frente' },
            ]
          : []),
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Documentação da API VitalDB',
          click: () => shell.openExternal('https://vitaldb.net/dataset/?query=api'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  await startBackendIfNeeded();
  createApplicationMenu();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    console.log('[Desktop] Encerrando motor Python da Kaline IA...');
    try {
      backendProcess.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
    backendProcess = null;
  }
});
