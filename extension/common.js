/* web2apk extension — shared helpers (loaded via importScripts / <script src>).
 *
 * Works in three contexts:
 *   - MV3 service worker  (importScripts('common.js'))
 *   - extension pages      (<script src="../common.js"></script>)
 *
 * Exposes a single global: W2A
 */

/* eslint-disable no-var */
var W2A = (() => {
  'use strict';

  const VERSION = '2.1.0';

  /** Default settings — everything the options page can edit. */
  const DEFAULTS = Object.freeze({
    appName: 'My Web App',
    appUrl: 'https://example.com/',
    openMode: 'window', // 'window' | 'tab'
    windowWidth: 1280,
    windowHeight: 800,
    newtabEnabled: true,
    theme: 'auto', // 'auto' | 'dark' | 'light'
    searchEngine: 'google', // 'google' | 'bing' | 'duckduckgo'
    quickLinks: [
      { title: 'GitHub', url: 'https://github.com/' },
      { title: 'YouTube', url: 'https://www.youtube.com/' },
    ],
    badgeEnabled: true,
    badgeIntervalMinutes: 5,
  });

  const SEARCH_ENGINES = Object.freeze({
    google: { name: 'Google', url: 'https://www.google.com/search?q=%s' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
  });

  const BADGE_ALARM = 'w2a-status-check';
  const RECENTS_KEY = 'w2a:recents';

  /* ------------------------------------------------------------------ */
  /* Storage                                                             */
  /* ------------------------------------------------------------------ */

  async function getSettings() {
    const stored = await chrome.storage.sync.get(DEFAULTS);
    // Merge so newly-added keys always fall back to defaults.
    return { ...DEFAULTS, ...stored };
  }

  async function saveSettings(patch) {
    const clean = sanitizeSettings({ ...(await getSettings()), ...patch });
    try {
      await chrome.storage.sync.set(clean);
    } catch (err) {
      // Sync quota exceeded (e.g. huge quick-links list) → fall back to local.
      console.warn('[web2apk] sync quota exceeded, using local storage', err);
      await chrome.storage.local.set(clean);
    }
    return clean;
  }

  function sanitizeSettings(input) {
    const out = { ...input };
    if (typeof out.appName !== 'string' || !out.appName.trim()) {
      out.appName = DEFAULTS.appName;
    } else {
      out.appName = out.appName.trim().slice(0, 64);
    }
    // Be forgiving with URLs: auto-prefix https:// when the scheme was omitted
    // (e.g. "github.com") instead of silently reverting to the default.
    out.appUrl = normalizeUrl(out.appUrl) || DEFAULTS.appUrl;
    if (out.openMode !== 'window' && out.openMode !== 'tab') out.openMode = DEFAULTS.openMode;
    out.windowWidth = clampInt(out.windowWidth, 360, 7680, DEFAULTS.windowWidth);
    out.windowHeight = clampInt(out.windowHeight, 240, 4320, DEFAULTS.windowHeight);
    out.newtabEnabled = Boolean(out.newtabEnabled);
    if (!['auto', 'dark', 'light'].includes(out.theme)) out.theme = DEFAULTS.theme;
    if (!SEARCH_ENGINES[out.searchEngine]) out.searchEngine = DEFAULTS.searchEngine;
    out.quickLinks = sanitizeQuickLinks(out.quickLinks);
    out.badgeEnabled = Boolean(out.badgeEnabled);
    out.badgeIntervalMinutes = clampInt(
      out.badgeIntervalMinutes,
      1,
      1440,
      DEFAULTS.badgeIntervalMinutes
    );
    return out;
  }

  function sanitizeQuickLinks(links) {
    if (!Array.isArray(links)) return [];
    return links
      .map((l) => (l && typeof l.title === 'string' && typeof l.url === 'string'
        ? { title: l.title, url: normalizeUrl(l.url) }
        : null))
      .filter((l) => l && l.url && isHttpUrl(l.url))
      .slice(0, 24)
      .map((l) => ({ title: l.title.trim().slice(0, 48) || hostnameOf(l.url), url: l.url }));
  }

  /** Remember "when was the app opened last" for the popup/recents UI. */
  async function recordOpen(url) {
    try {
      const data = await chrome.storage.local.get(RECENTS_KEY);
      const recents = Array.isArray(data[RECENTS_KEY]) ? data[RECENTS_KEY] : [];
      const entry = { url, at: Date.now() };
      const next = [entry, ...recents.filter((r) => r && r.url !== url)].slice(0, 5);
      await chrome.storage.local.set({ [RECENTS_KEY]: next });
    } catch (err) {
      console.warn('[web2apk] failed to record recent open', err);
    }
  }

  async function getRecents() {
    try {
      const data = await chrome.storage.local.get(RECENTS_KEY);
      return Array.isArray(data[RECENTS_KEY]) ? data[RECENTS_KEY] : [];
    } catch {
      return [];
    }
  }

  /* ------------------------------------------------------------------ */
  /* URL helpers                                                         */
  /* ------------------------------------------------------------------ */

  function isHttpUrl(value) {
    if (typeof value !== 'string') return false;
    try {
      const u = new URL(value.trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function normalizeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    // Be forgiving: auto-prefix https:// when the user omitted the scheme.
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const u = new URL(candidate);
      return u.href;
    } catch {
      return '';
    }
  }

  function hostnameOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  function faviconUrl(pageUrl) {
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostnameOf(pageUrl))}`;
  }

  function buildSearchUrl(engineId, query) {
    const engine = SEARCH_ENGINES[engineId] || SEARCH_ENGINES.google;
    return engine.url.replace('%s', encodeURIComponent(query));
  }

  /* ------------------------------------------------------------------ */
  /* Misc                                                                */
  /* ------------------------------------------------------------------ */

  function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function formatWhen(timestamp) {
    if (!timestamp) return 'never';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  return {
    VERSION,
    DEFAULTS,
    SEARCH_ENGINES,
    BADGE_ALARM,
    getSettings,
    saveSettings,
    sanitizeSettings,
    sanitizeQuickLinks,
    recordOpen,
    getRecents,
    isHttpUrl,
    normalizeUrl,
    hostnameOf,
    faviconUrl,
    buildSearchUrl,
    clampInt,
    formatWhen,
  };
})();

/* Export for ES-module contexts (e.g. validate scripts importing this file). */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { W2A };
}
