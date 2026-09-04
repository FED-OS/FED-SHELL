/* web2apk extension new-tab dashboard behaviour. */

(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  let settings = null;

  /* ---------------------------------------------------------------- */
  /* Clock + greeting                                                  */
  /* ---------------------------------------------------------------- */

  function tickClock() {
    const now = new Date();
    const time = $('#clock-time');
    const date = $('#clock-date');
    const greet = $('#greet');
    time.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    date.textContent = now.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const h = now.getHours();
    greet.textContent =
      h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  /* ---------------------------------------------------------------- */
  /* Search                                                            */
  /* ---------------------------------------------------------------- */

  function renderEngineSelect(engines, selectedId) {
    const sel = $('#search-engine');
    sel.textContent = '';
    for (const [id, engine] of Object.entries(engines)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = engine.name;
      sel.append(opt);
    }
    sel.value = selectedId;
  }

  function isSearchableUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return false;
    if (/\s/.test(raw)) return false;
    try {
      const u = new URL(W2A.normalizeUrl(raw));
      return Boolean(u.hostname.includes('.'));
    } catch {
      return false;
    }
  }

  function submitSearch(e) {
    e.preventDefault();
    const q = $('#search-input').value.trim();
    if (!q) return;
    const engine = $('#search-engine').value;
    if (isSearchableUrl(q)) {
      window.location.href = W2A.normalizeUrl(q);
    } else {
      window.location.href = W2A.buildSearchUrl(engine, q);
    }
  }

  /* ---------------------------------------------------------------- */
  /* App card + status                                                 */
  /* ---------------------------------------------------------------- */

  function renderAppCard(s) {
    $('#app-name').textContent = s.appName;
    $('#app-url').textContent = s.appUrl;
    $('#btn-open-app').title = `Open ${s.appUrl}`;
  }

  function renderStatus(lastStatus) {
    const box = $('#status');
    const dot = $('#status-dot');
    const text = $('#status-text');
    if (!lastStatus || !lastStatus.at) {
      box.hidden = true;
      return;
    }
    const ageMin = (Date.now() - lastStatus.at) / 60000;
    const fresh = ageMin < 10;
    dot.className = 'dot ' + (fresh ? (lastStatus.ok ? 'ok' : 'down') : '');
    text.textContent = fresh
      ? lastStatus.ok
        ? 'Site reachable'
        : 'Site unreachable — check your connection or the URL'
      : 'Status unknown';
    box.hidden = false;
  }

  /* ---------------------------------------------------------------- */
  /* Quick links grid                                                  */
  /* ---------------------------------------------------------------- */

  function renderLinks(links) {
    const section = $('#links-section');
    const grid = $('#links-grid');
    if (!links || !links.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    grid.textContent = '';
    for (const link of links) {
      const tile = document.createElement('a');
      tile.className = 'tile';
      tile.href = link.url;
      tile.title = link.url;
      const img = document.createElement('img');
      img.src = W2A.faviconUrl(link.url);
      img.alt = '';
      img.width = 32;
      img.height = 32;
      const span = document.createElement('span');
      span.textContent = link.title;
      tile.append(img, span);
      grid.append(tile);
    }
    const add = document.createElement('a');
    add.className = 'tile add';
    add.href = chrome.runtime.getURL('options/options.html');
    add.title = 'Add a quick link';
    const plus = document.createElement('span');
    plus.textContent = '+ Add link';
    add.append(plus);
    grid.append(add);
  }

  /* ---------------------------------------------------------------- */
  /* Theme                                                             */
  /* ---------------------------------------------------------------- */

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark' || theme === 'light') {
      root.setAttribute('data-theme', theme);
      root.style.colorScheme = theme;
    } else {
      root.removeAttribute('data-theme');
      root.style.removeProperty('color-scheme');
    }
  }

  /* ---------------------------------------------------------------- */
  /* Init                                                              */
  /* ---------------------------------------------------------------- */

  async function init() {
    settings = await W2A.getSettings();
    const recents = await W2A.getRecents();
    void recents;

    tickClock();
    setInterval(tickClock, 15000);

    renderEngineSelect(W2A.SEARCH_ENGINES, settings.searchEngine);
    renderAppCard(settings);
    renderLinks(settings.quickLinks);
    applyTheme(settings.theme);
    $('#version').textContent = `v${W2A.VERSION}`;

    const data = await chrome.storage.local.get('w2a:lastStatus');
    renderStatus(data['w2a:lastStatus']);

    $('#search-form').addEventListener('submit', submitSearch);
    $('#search-engine').addEventListener('change', async (e) => {
      await W2A.saveSettings({ searchEngine: e.target.value });
    });
    $('#search-input').addEventListener('keydown', (e) => {
      if (e.key === 'Escape') e.target.value = '';
    });

    $('#btn-open-app').addEventListener('click', async () => {
      if (settings.openMode === 'window') {
        await chrome.runtime.sendMessage({ cmd: 'open-app-window' });
      } else {
        window.location.href = settings.appUrl;
      }
    });
    $('#btn-open-window').addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ cmd: 'open-app-window' });
    });
    $('#btn-options').addEventListener('click', () => {
      window.location.href = chrome.runtime.getURL('options/options.html');
    });
    $('#btn-hints').addEventListener('click', () => {
      $('#kbd-sheet').hidden = false;
    });
    $('#kbd-close').addEventListener('click', () => {
      $('#kbd-sheet').hidden = true;
    });

    // "/" or Ctrl+K focuses the search box.
    document.addEventListener('keydown', (e) => {
      const inField = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName);
      if (e.key === '/' && !inField) {
        e.preventDefault();
        $('#search-input').focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        $('#search-input').focus();
      } else if (e.key === 'Escape' && !$('#kbd-sheet').hidden) {
        $('#kbd-sheet').hidden = true;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
