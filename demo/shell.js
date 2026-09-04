/* web2apk · demo shell behaviour
 * Tab switching, badge mirror, API-activity log, popout hints.
 */

(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  /* ── tabs ─────────────────────────────────────────────────────── */
  const panes = {
    newtab: $('[data-pane="newtab"]'),
    popup: $('[data-pane="popup"]'),
    options: $('[data-pane="options"]'),
  };
  const URLs = {
    newtab: 'chrome-extension://web2apk-demo/newtab/newtab.html',
    popup: 'chrome-extension://web2apk-demo/popup/popup.html',
    options: 'chrome-extension://web2apk-demo/options/options.html',
  };

  function selectPane(name, { focus = false } = {}) {
    Object.entries(panes).forEach(([k, el]) => {
      el.classList.toggle('active', k === name);
    });
    $$('.toolbar .tabs button').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.target === name));
    });
    $('#omni-url').textContent = URLs[name];
    if (focus) panes[name]?.focus();
  }

  $$('.toolbar .tabs button').forEach((b) => {
    b.addEventListener('click', () => selectPane(b.dataset.target));
  });

  /* clicking the toolbar extension icon opens the popup surface */
  $('#ext-icon').addEventListener('click', () => selectPane('popup'));

  selectPane('newtab');

  /* ── live badge mirror (storage-driven, like the real extension) ── */
  const badge = $('#ext-badge');

  function readStatus() {
    try {
      return JSON.parse(localStorage.getItem('w2a:lastStatus') || 'null');
    } catch (_) {
      return null;
    }
  }

  function renderBadge() {
    const st = readStatus();
    if (!st || !st.at) {
      badge.hidden = true;
      return;
    }
    badge.hidden = false;
    badge.textContent = st.ok ? 'OK' : 'DOWN';
    badge.classList.toggle('down', !st.ok);
  }

  window.addEventListener('storage', renderBadge);
  window.addEventListener('w2a-demo:changed', renderBadge);
  renderBadge();

  /* iframes share this origin → poll their localStorage on a tick, since
     'storage' events fire in *other* frames, not the writer's own frame */
  setInterval(renderBadge, 1200);

  /* ── API activity log ─────────────────────────────────────────── */
  const log = $('#log');

  function clearLog() {
    log.innerHTML = '';
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'waiting for interaction — click around the UI above…';
    log.appendChild(li);
  }

  function addLog(kind, detail) {
    const empty = log.querySelector('.empty');
    if (empty) empty.remove();
    const li = document.createElement('li');
    const t = document.createElement('span');
    t.className = 't';
    t.textContent = new Date().toLocaleTimeString();
    const k = document.createElement('span');
    k.className = `k ${kind}`;
    k.textContent = kind === 'storage' ? 'storage' : 'message';
    const v = document.createElement('span');
    v.className = 'v';
    v.textContent = detail;
    li.append(t, k, v);
    log.appendChild(li);
    while (log.children.length > 60) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  }

  $('#log-clear').addEventListener('click', clearLog);

  window.addEventListener('message', (e) => {
    if (!e.data || e.data.source !== 'w2a-demo') return;
    const { kind, detail } = e.data;
    if (kind === 'storage') {
      addLog('storage', `${detail.area}.set(${detail.keys.join(', ')})`);
    } else if (kind === 'message') {
      addLog('message', `runtime.sendMessage({ cmd: '${detail.cmd}' }) → ${JSON.stringify(detail.result)}`);
    }
  });

  /* ── popout hints (windows/tabs opened via the shim) ───────────── */
  const hint = $('#popout-hint');

  window.addEventListener('message', (e) => {
    if (!e.data || e.data.source !== 'w2a-demo') return;
    if (e.data.kind === 'message' && e.data.detail.cmd === 'open-app-window') {
      hint.textContent = '↗ opened the app in a separate window (window.open popup) — check your tabs/popup blocker if you don\u2019t see it.';
      setTimeout(() => { hint.textContent = ''; hint.removeAttribute('aria-live'); }, 6000);
      setTimeout(() => hint.setAttribute('aria-live', 'polite'), 6500);
    }
  });
})();
