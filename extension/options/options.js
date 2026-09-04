/* web2apk extension options page behaviour. */

(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const els = {
    appName: $('#app-name'),
    appUrl: $('#app-url'),
    openMode: $('#open-mode'),
    winW: $('#win-w'),
    winH: $('#win-h'),
    newtabEnabled: $('#newtab-enabled'),
    theme: $('#theme'),
    searchEngine: $('#search-engine'),
    badgeEnabled: $('#badge-enabled'),
    badgeInterval: $('#badge-interval'),
    linksList: $('#links-list'),
    addLink: $('#add-link'),
    reset: $('#btn-reset'),
    export: $('#btn-export'),
    import: $('#btn-import'),
    importFile: $('#import-file'),
    saveState: $('#save-state'),
    aboutVersion: $('#about-version'),
    aboutBrowser: $('#about-browser'),
  };

  let saveTimer = null;
  let flashTimer = null;

  /* ---------------------------------------------------------------- */
  /* Save state indicator                                              */
  /* ---------------------------------------------------------------- */

  function flashState(text, cls = '') {
    els.saveState.textContent = text;
    els.saveState.className = cls;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      els.saveState.textContent = 'Ready';
      els.saveState.className = '';
    }, 1800);
  }

  /* ---------------------------------------------------------------- */
  /* Quick links editor                                                */
  /* ---------------------------------------------------------------- */

  function renderLinks(links) {
    els.linksList.textContent = '';
    if (!links.length) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'No quick links yet — add one below.';
      els.linksList.append(empty);
      return;
    }
    for (const link of links) {
      const row = document.createElement('div');
      row.className = 'link-row';

      const favicon = document.createElement('img');
      favicon.className = 'favicon';
      favicon.src = W2A.faviconUrl(link.url);
      favicon.alt = '';
      favicon.width = 32;
      favicon.height = 32;

      const title = document.createElement('input');
      title.type = 'text';
      title.maxLength = 48;
      title.value = link.title;
      title.placeholder = 'Title';
      title.setAttribute('aria-label', 'Link title');

      const url = document.createElement('input');
      url.type = 'url';
      url.value = link.url;
      url.placeholder = 'https://example.com/';
      url.spellcheck = false;
      url.setAttribute('aria-label', 'Link URL');

      const remove = document.createElement('button');
      remove.className = 'remove';
      remove.type = 'button';
      remove.title = 'Remove link';
      remove.textContent = '×';
      remove.setAttribute('aria-label', 'Remove link');

      row.append(favicon, title, url, remove);
      els.linksList.append(row);
    }
  }

  function collectLinks() {
    return $$('.link-row').map((row) => {
      const [, title, url] = row.children;
      return { title: title.value, url: url.value };
    });
  }

  /* ---------------------------------------------------------------- */
  /* Load / save                                                       */
  /* ---------------------------------------------------------------- */

  async function load() {
    const s = await W2A.getSettings();
    els.appName.value = s.appName;
    els.appUrl.value = s.appUrl;
    els.openMode.value = s.openMode;
    els.winW.value = s.windowWidth;
    els.winH.value = s.windowHeight;
    els.newtabEnabled.checked = s.newtabEnabled;
    els.theme.value = s.theme;
    els.searchEngine.value = s.searchEngine;
    els.badgeEnabled.checked = s.badgeEnabled;
    els.badgeInterval.value = s.badgeIntervalMinutes;
    renderLinks(s.quickLinks);

    els.aboutVersion.textContent = `v${W2A.VERSION}`;
    const ua = navigator.userAgent;
    els.aboutBrowser.textContent = /Edg\//.test(ua)
      ? 'Microsoft Edge'
      : /Chrome\//.test(ua)
        ? 'Google Chrome'
        : 'Chromium';
  }

  async function save() {
    const links = collectLinks();
    const patch = {
      appName: els.appName.value,
      appUrl: els.appUrl.value,
      openMode: els.openMode.value,
      windowWidth: els.winW.value,
      windowHeight: els.winH.value,
      newtabEnabled: els.newtabEnabled.checked,
      theme: els.theme.value,
      searchEngine: els.searchEngine.value,
      badgeEnabled: els.badgeEnabled.checked,
      badgeIntervalMinutes: els.badgeInterval.value,
      quickLinks: links,
    };
    try {
      await W2A.saveSettings(patch);
      flashState('Saved ✓', 'saved');
    } catch (err) {
      console.error('[web2apk options] save failed', err);
      flashState('Save failed', 'error');
    }
  }

  /* Debounced autosave on any input change. */
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  }

  /* ---------------------------------------------------------------- */
  /* Import / export / reset                                           */
  /* ---------------------------------------------------------------- */

  async function exportSettings() {
    const s = await W2A.getSettings();
    const blob = new Blob([JSON.stringify({ web2apk: 'settings', version: W2A.VERSION, settings: s }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web2apk-settings-${W2A.VERSION}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashState('Exported ✓', 'saved');
  }

  async function importSettings(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const incoming = data && data.settings ? data.settings : data;
      const clean = W2A.sanitizeSettings(incoming);
      await W2A.saveSettings(clean);
      await load();
      flashState('Imported ✓', 'saved');
    } catch (err) {
      console.error('[web2apk options] import failed', err);
      flashState('Import failed', 'error');
    }
  }

  async function resetAll() {
    if (!confirm('Reset all web2apk settings to defaults?')) return;
    await W2A.saveSettings(W2A.DEFAULTS);
    await load();
    flashState('Reset ✓', 'saved');
  }

  /* ---------------------------------------------------------------- */
  /* Tabs                                                              */
  /* ---------------------------------------------------------------- */

  function wireTabs() {
    $$('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach((t) => {
          t.classList.toggle('active', t === tab);
          t.setAttribute('aria-selected', String(t === tab));
        });
        $$('.panel').forEach((p) => {
          p.classList.toggle('active', p.id === `tab-${tab.dataset.tab}`);
          p.hidden = p.id !== `tab-${tab.dataset.tab}`;
        });
        window.scrollTo({ top: 0 });
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Init                                                              */
  /* ---------------------------------------------------------------- */

  function init() {
    wireTabs();
    els.addLink.addEventListener('click', async () => {
      const s = await W2A.getSettings();
      const links = collectLinks().concat([{ title: '', url: '' }]);
      renderLinks(links);
      void s;
      const inputs = els.linksList.querySelectorAll('input');
      inputs[inputs.length - 2].focus();
    });
    els.linksList.addEventListener('input', scheduleSave);
    els.linksList.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove')) {
        e.target.closest('.link-row').remove();
        if (!$$('.link-row').length) renderLinks([]);
        scheduleSave();
      }
    });

    for (const el of [els.appName, els.appUrl, els.openMode, els.winW, els.winH, els.theme, els.searchEngine]) {
      el.addEventListener('input', scheduleSave);
      el.addEventListener('change', scheduleSave);
    }
    els.newtabEnabled.addEventListener('change', scheduleSave);
    els.badgeEnabled.addEventListener('change', scheduleSave);
    els.badgeInterval.addEventListener('input', scheduleSave);

    els.export.addEventListener('click', exportSettings);
    els.import.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importSettings(file);
      e.target.value = '';
    });
    els.reset.addEventListener('click', resetAll);

    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
