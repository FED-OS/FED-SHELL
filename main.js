// ─────────────────────────────────────────────────────────────────────────────
// FED-Shell — Electron desktop entry point
//
// A lightweight Electron shell that loads the target URL. The URL is
// injected at build time via scripts/inject-config.py into config.json
// (embedded by electron-builder) and can also be overridden at runtime
// via the TARGET_URL environment variable.
//
// Built-in extensions live in extensions/builtin/ — each needs a valid
// manifest.json. The CI workflow validates them before building.
// ─────────────────────────────────────────────────────────────────────────────

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Resolve the target URL: env override → config.json → fallback
function resolveTargetUrl() {
  if (process.env.TARGET_URL) return process.env.TARGET_URL;

  // config.json is embedded by electron-builder (extraResources)
  const configPaths = [
    path.join(process.resourcesPath || __dirname, 'config.json'),
    path.join(__dirname, 'config.json'),
  ];
  for (const p of configPaths) {
    if (fs.existsSync(p)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (cfg.url) return cfg.url;
      } catch (e) {
        console.error('[FED-Shell] Error reading config.json:', e.message);
      }
    }
  }
  return 'https://example.com';
}

function resolveAppName() {
  if (process.env.APP_NAME) return process.env.APP_NAME;
  for (const p of [path.join(__dirname, 'config.json'), path.join(process.resourcesPath || __dirname, 'config.json')]) {
    if (fs.existsSync(p)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (cfg.appName) return cfg.appName;
      } catch (e) {}
    }
  }
  return 'FED Shell';
}

// Load and validate built-in extensions
function loadBuiltinExtensions() {
  const extDir = path.join(__dirname, 'extensions', 'builtin');
  if (!fs.existsSync(extDir)) {
    console.log('[FED-Shell] No builtin extensions directory found.');
    return [];
  }
  const extensions = [];
  for (const dir of fs.readdirSync(extDir)) {
    const manifestPath = path.join(extDir, dir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.warn(`[FED-Shell] Missing manifest.json in extensions/builtin/${dir}`);
      continue;
    }
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      extensions.push({ name: manifest.name, version: manifest.version, dir: path.join(extDir, dir) });
      console.log(`[FED-Shell] Loaded extension: ${manifest.name} v${manifest.version}`);
    } catch (e) {
      console.error(`[FED-Shell] Invalid manifest.json in extensions/builtin/${dir}:`, e.message);
    }
  }
  return extensions;
}

let mainWindow;

function createWindow() {
  const targetUrl = resolveTargetUrl();
  const appName = resolveAppName();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: appName,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadURL(targetUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  loadBuiltinExtensions();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
