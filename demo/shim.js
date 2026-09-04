/* web2apk · browser-API shim for the live demo
 *
 * Lets the real extension pages (popup / options / newtab) run unmodified
 * in a plain browser tab, without the chrome.* APIs. Served at the demo
 * root (see demo/server.py) and injected into the parser
 * stream by demo/loader.js, before the page's own scripts.
 *
 * Implements exactly what the UI calls, with Chrome's real semantics:
 *
 *   chrome.storage.sync / .local   promise-based get/set, string /
 *                                  array / object-with-defaults forms,
 *                                  merged across areas via localStorage
 *   chrome.storage.onChanged       fired on every set
 *   chrome.runtime.getURL(p)       extension path → demo-origin URL
 *   chrome.runtime.sendMessage     router mirroring background.js:
 *                                  open-app-window / open-app-tab /
 *                                  open-dashboard / check-status (live
 *                                  HEAD no-cors fetch) / get-status
 *   chrome.tabs.create({url})      opens a real tab
 *
 * Every storage write and runtime message also postMessage()s to the
 * parent window so the demo shell can show a live API-activity log.
 */

(() => {
  'use strict';

  /* Extension-root mirror = the sibling directory of this script
     (…/demo/shim.js → …/extension/). Works identically for the dynamic
     server (/demo/shim.js → /extension/) and the static mirror. */
  const BASE = (() => {
    const src = document.currentScript && document.currentScript.src;
    return src ? new URL('../extension/', src).href : '/extension/';
  })();

  const LS = window.localStorage;
  const KEY = 'w2a-demo:settings';
  const RECENTS_KEY = 'w2a:recents';
  const STATUS_KEY = 'w2a:lastStatus';

  /* ── telemetry to the demo shell (if framed) ────────────────────── */
  function telemetry(kind, detail) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ source: 'w2a-demo', kind, detail }, '*');
      }
    } catch (_) { /* ignore */ }
  }

  /* ── seed (matches W2A.DEFAULTS, with a richer quick-links set) ── */
  const SEED = {
    appName: 'GitHub',
    appUrl: 'https://github.com/',
    openMode: 'window',
    windowWidth: 1280,
    windowHeight: 800,
    newtabEnabled: true,
    theme: 'auto',
    searchEngine: 'google',
    quickLinks: [
      { title: 'GitHub', url: 'https://github.com/' },
      { title: 'YouTube', url: 'https://www.youtube.com/' },
      { title: 'Wikipedia', url: 'https://www.wikipedia.org/' },
      { title: 'MDN', url: 'https://developer.mozilla.org/' },
    ],
    badgeEnabled: true,
    badgeIntervalMinutes: 5,
  };

  function readAll() {
    if (LS.getItem('w2a-demo:reset') === '1') {
      LS.removeItem('w2a-demo:reset');
      LS.removeItem(KEY);
      LS.removeItem(RECENTS_KEY);
      LS.removeItem(STATUS_KEY);
    }
    let data;
    try {
      data = JSON.parse(LS.getItem(KEY) || 'null');
    } catch (_) {
      data = null;
    }
    if (!data || typeof data !== 'object') {
      data = { ...SEED };
      LS.setItem(KEY, JSON.stringify(data));
    }
    return data;
  }

  function writeAll(data) {
    LS.setItem(KEY, JSON.stringify(data));
  }

  const RAW_KEYS = [RECENTS_KEY, STATUS_KEY]; // local-only, stored verbatim

  /* ── area emulation (Chrome storage semantics) ─────────────────── */
  function makeArea(areaName) {
    const listeners = [];
    const lookup = (k) => (areaName === 'local' && RAW_KEYS.includes(k)
      ? JSON.parse(LS.getItem(k) || 'null')
      : readAll()[k]);
    return {
      async get(keys) {
        const out = {};
        if (keys === null || keys === undefined) {
          if (areaName === 'local') {
            RAW_KEYS.forEach((k) => { out[k] = JSON.parse(LS.getItem(k) || 'null'); });
            Object.assign(out, readAll(), out);
          } else {
            Object.assign(out, readAll());
          }
          return out;
        }
        if (typeof keys === 'string') {
          out[keys] = lookup(keys);
          return out;
        }
        if (Array.isArray(keys)) {
          keys.forEach((k) => { out[k] = lookup(k); });
          return out;
        }
        if (typeof keys === 'object') {
          // object-with-defaults: Chrome fills the default when the key
          // is missing — exactly the form getSettings() relies on.
          Object.entries(keys).forEach(([k, def]) => {
            const v = lookup(k);
            out[k] = v === undefined || v === null ? def : v;
          });
          return out;
        }
        return out;
      },
      async set(items) {
        const data = readAll();
        const changes = {};
        Object.entries(items).forEach(([k, v]) => {
          if (areaName === 'local' && RAW_KEYS.includes(k)) {
            changes[k] = { oldValue: JSON.parse(LS.getItem(k) || 'null'), newValue: v };
            LS.setItem(k, JSON.stringify(v));
          } else {
            changes[k] = { oldValue: data[k], newValue: v };
            data[k] = v;
          }
        });
        if (areaName === 'sync') writeAll(data);
        listeners.forEach((fn) => fn(changes, areaName));
        telemetry('storage', { area: areaName, keys: Object.keys(items) });
      },
      _listeners: listeners,
    };
  }

  const syncArea = makeArea('sync');
  const localArea = makeArea('local');

  /* ── message router (mirrors extension/background.js) ──────────── */
  async function checkStatus() {
    let ok = false;
    const s = await chrome.storage.sync.get({ appUrl: 'https://example.com/', badgeEnabled: true });
    if (s.badgeEnabled && /^https?:\/\//.test(s.appUrl)) {
      try {
        await fetch(s.appUrl, { method: 'HEAD', mode: 'no-cors', redirect: 'follow', cache: 'no-store' });
        ok = true; // opaque response — network success proves reachability
      } catch (_) {
        ok = false;
      }
    }
    await chrome.storage.local.set({ [STATUS_KEY]: { ok, at: Date.now() } });
    return { ok, at: Date.now() };
  }

  const handlers = {
    'open-app-window': async () => {
      const s = await chrome.storage.sync.get({ appUrl: 'https://example.com/' });
      window.open(s.appUrl, 'w2a-app-demo', 'popup,width=1280,height=800');
      return { ok: true };
    },
    'open-app-tab': async () => {
      const s = await chrome.storage.sync.get({ appUrl: 'https://example.com/' });
      window.open(s.appUrl, '_blank');
      return { ok: true };
    },
    'open-dashboard': async () => {
      // site root = parent of the extension mirror (works under sub-paths)
      window.open(new URL('..', BASE).href, '_blank');
      return { ok: true };
    },
    'check-status': async () => {
      await checkStatus();
      return { ok: true };
    },
    'get-status': async () => {
      const d = await chrome.storage.local.get(STATUS_KEY);
      return d[STATUS_KEY] || null;
    },
  };

  async function routeMessage(msg) {
    if (!msg || typeof msg !== 'object') return { ok: true };
    const handler = handlers[msg.cmd];
    return handler ? handler(msg) : { ok: true };
  }

  window.chrome = {
    storage: {
      sync: syncArea,
      local: localArea,
      onChanged: {
        addListener(fn) {
          if (typeof fn === 'function' && !syncArea._listeners.includes(fn)) {
            syncArea._listeners.push(fn);
            localArea._listeners.push(fn);
          }
        },
        removeListener(fn) {
          [syncArea, localArea].forEach((a) => {
            const i = a._listeners.indexOf(fn);
            if (i >= 0) a._listeners.splice(i, 1);
          });
        },
      },
    },
    runtime: {
      getURL: (p) => new URL(p, BASE).href,
      sendMessage: async (msg) => {
        const result = await routeMessage(msg);
        telemetry('message', { cmd: msg && msg.cmd, result });
        return result;
      },
      id: 'web2apk-demo',
      getManifest: () => ({ name: 'web2apk — Web App Launcher', version: '2.1.1' }),
    },
    tabs: {
      create({ url }) {
        window.open(url, '_blank');
      },
    },
    action: {},
  };
})();
