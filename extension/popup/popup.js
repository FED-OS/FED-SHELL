/* web2apk extension popup — behaviour (MV3, no inline scripts). */

(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  function openUrl(url) {
    // Open in a normal tab (keeps popup simple); window mode is one click away.
    chrome.tabs.create({ url });
    window.close();
  }

  async function sendMessage(cmd, payload) {
    try {
      return await chrome.runtime.sendMessage({ cmd, ...payload });
    } catch (err) {
      console.warn('[web2apk popup] message failed', err);
      return null;
    }
  }

  function renderStatus(lastStatus) {
    const box = $('#status');
    const dot = $('#status-dot');
    const text = $('#status-text');
    const when = $('#status-when');
    if (!box) return;
    if (!lastStatus || !lastStatus.at) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    const ageMin = (Date.now() - lastStatus.at) / 60000;
    const fresh = ageMin < 10;
    dot.className = 'dot ' + (fresh ? (lastStatus.ok ? 'ok' : 'down') : '');
    text.textContent = fresh
      ? lastStatus.ok
        ? 'Site reachable'
        : 'Site unreachable'
      : 'Status stale — click the toolbar icon to re-check';
    when.textContent = W2A.formatWhen(lastStatus.at);
  }

  function renderQuickLinks(links) {
    const wrap = $('#quick');
    const list = $('#quick-links');
    if (!wrap || !list) return;
    if (!links || !links.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    list.textContent = '';
    for (const link of links) {
      const chip = document.createElement('a');
      chip.className = 'chip';
      chip.href = link.url;
      chip.title = link.url;
      const img = document.createElement('img');
      img.src = W2A.faviconUrl(link.url);
      img.alt = '';
      img.width = 16;
      img.height = 16;
      chip.append(img, document.createTextNode(link.title));
      chip.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey) return; // allow modifier-click to open normally
        e.preventDefault();
        openUrl(link.url);
      });
      list.append(chip);
    }
  }

  function renderRecents(recents) {
    const wrap = $('#recents');
    const list = $('#recent-list');
    if (!wrap || !list) return;
    if (!recents || !recents.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    list.textContent = '';
    for (const r of recents.slice(0, 3)) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = r.url;
      a.textContent = W2A.hostnameOf(r.url);
      a.title = r.url;
      const when = document.createElement('span');
      when.className = 'when';
      when.textContent = W2A.formatWhen(r.at);
      li.append(a, when);
      li.addEventListener('click', () => openUrl(r.url));
      list.append(li);
    }
  }

  async function init() {
    const [settings, recents] = await Promise.all([
      W2A.getSettings(),
      W2A.getRecents(),
    ]);
    const lastStatus = (await chrome.storage.local.get('w2a:lastStatus'))['w2a:lastStatus'];

    $('#app-name').textContent = settings.appName;
    $('#app-host').textContent = W2A.hostnameOf(settings.appUrl);
    $('#version').textContent = `v${W2A.VERSION}`;
    $('#btn-open').title = `Open ${settings.appUrl}`;
    $('#btn-open > svg')?.setAttribute('width', '18');

    renderStatus(lastStatus);
    renderQuickLinks(settings.quickLinks);
    renderRecents(recents);

    $('#btn-open').addEventListener('click', async () => {
      const s = await W2A.getSettings();
      if (s.openMode === 'window') {
        await sendMessage('open-app-window', {});
      } else {
        openUrl(s.appUrl);
      }
    });

    $('#btn-window').addEventListener('click', () => sendMessage('open-app-window', {}));
    $('#btn-tab').addEventListener('click', () => openUrl(settings.appUrl));
    $('#btn-dashboard').addEventListener('click', () => sendMessage('open-dashboard', {}));
    $('#btn-options').addEventListener('click', () => openUrl(chrome.runtime.getURL('options/options.html')));

    // Ask the background worker to re-check the site so the badge/status is fresh.
    sendMessage('check-status', {});
  }

  document.addEventListener('DOMContentLoaded', init);
})();
