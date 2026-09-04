/* web2apk extension — MV3 background service worker.
 *
 * Responsibilities:
 *   - Create the "app window" (popup-less standalone window) or tab.
 *   - Context menu entries: open app / open in app window / send to app window.
 *   - Optional toolbar badge reflecting the configured site's reachability.
 *   - Keyboard commands (chrome.commands).
 *   - First-run: seed defaults + open options on install.
 */

importScripts('common.js');

const MENU_APP = 'w2a-open-app';
const MENU_WINDOW = 'w2a-open-window';
const MENU_OPEN_IN_WINDOW = 'w2a-context-open-window';
const MENU_DASHBOARD = 'w2a-open-dashboard';

/* ------------------------------------------------------------------ */
/* App window / tab management                                         */
/* ------------------------------------------------------------------ */

/** Focus an existing app window for this URL if one is already open. */
async function focusExistingAppWindow(appUrl) {
  try {
    const windows = await chrome.windows.getAll({ populate: true });
    for (const w of windows) {
      if (!w.tabs || !w.tabs.length) continue;
      const extUrl = chrome.runtime.getURL('');
      const match = w.tabs.find(
        (t) => t.url && t.url.startsWith(appUrl) && !t.url.startsWith(extUrl)
      );
      if (match) {
        await chrome.windows.update(w.id, { focused: true, state: 'normal' });
        if (match.active === false) await chrome.tabs.update(match.id, { active: true });
        return true;
      }
    }
  } catch (err) {
    console.warn('[web2apk] window scan failed', err);
  }
  return false;
}

/** Open the configured web app in an app window (or tab, per settings). */
async function openApp(modeOverride) {
  const s = await W2A.getSettings();
  const mode = modeOverride || s.openMode;

  await W2A.recordOpen(s.appUrl);

  if (mode === 'window') {
    const focused = await focusExistingAppWindow(s.appUrl);
    if (focused) return;
    await chrome.windows.create({
      url: s.appUrl,
      type: 'popup',
      width: s.windowWidth,
      height: s.windowHeight,
    });
  } else {
    await chrome.tabs.create({ url: s.appUrl });
  }
  await setBadgeState('idle');
}

/** Open the current tab's URL in a fresh app window ("send to app window"). */
async function openCurrentInWindow() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !/^https?:/i.test(tab.url)) {
    await flashBadge('ERR', '#ef4444');
    return;
  }
  await W2A.recordOpen(tab.url);
  await chrome.windows.create({ url: tab.url, type: 'popup', width: 1280, height: 800 });
  await setBadgeState('idle');
}

/** Open the new-tab dashboard (works even if new-tab override is off). */
async function openDashboard() {
  const url = chrome.runtime.getURL('newtab/newtab.html');
  const existing = await chrome.tabs.query({ url });
  if (existing.length) {
    await chrome.tabs.update(existing[0].id, { active: true });
    const win = await chrome.windows.get(existing[0].windowId);
    await chrome.windows.update(win.id, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
}

/* ------------------------------------------------------------------ */
/* Badge — site reachability indicator                                 */
/* ------------------------------------------------------------------ */

async function setBadgeState(state, color) {
  try {
    if (state === 'idle') {
      await chrome.action.setBadgeText({ text: '' });
      return;
    }
    await chrome.action.setBadgeBackgroundColor({ color: color || '#4f8cff' });
    await chrome.action.setBadgeText({ text: state });
  } catch (err) {
    console.warn('[web2apk] badge update failed', err);
  }
}

/** Probe the configured site (HEAD, then GET fallback) and set the badge.
 *
 * Uses `mode: 'no-cors'`: the response is opaque, but the promise resolves
 * iff the network request succeeded — a reachability check with zero host
 * permissions. No page content is ever read.
 */
async function checkSiteStatus() {
  const s = await W2A.getSettings();
  if (!s.badgeEnabled) {
    await setBadgeState('idle');
    return;
  }
  let ok = false;
  try {
    await fetch(s.appUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      redirect: 'follow',
      credentials: 'omit',
      cache: 'no-store',
    });
    // Any response (even 4xx/5xx) proves the host is reachable;
    // only network errors (DNS, refused, offline) mean "down".
    ok = true;
  } catch {
    ok = false;
  }

  await chrome.action.setBadgeBackgroundColor({ color: ok ? '#22c55e' : '#ef4444' });
  await chrome.action.setBadgeText({ text: ok ? 'OK' : 'DOWN' });
  await chrome.storage.local.set({ 'w2a:lastStatus': { ok, at: Date.now() } });
}

/** Temporary badge flash (e.g. errors) that auto-clears. */
async function flashBadge(text, color, ms = 1600) {
  await setBadgeState(text, color);
  setTimeout(() => setBadgeState('idle'), ms);
}

/* ------------------------------------------------------------------ */
/* Context menus                                                        */
/* ------------------------------------------------------------------ */

async function ensureContextMenus() {
  await chrome.contextMenus.removeAll();
  const s = await W2A.getSettings();
  chrome.contextMenus.create({
    id: MENU_APP,
    title: `Open ${s.appName}`,
    contexts: ['action', 'page', 'selection', 'link'],
  });
  chrome.contextMenus.create({
    id: MENU_WINDOW,
    title: 'Open in app window',
    contexts: ['action', 'page', 'selection', 'link'],
  });
  chrome.contextMenus.create({
    id: MENU_OPEN_IN_WINDOW,
    title: 'Send this page to an app window',
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: MENU_DASHBOARD,
    title: 'Open web2apk dashboard',
    contexts: ['action'],
  });
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

async function onInstalled(details) {
  await W2A.getSettings(); // seeds defaults on first run
  await ensureContextMenus();
  await syncAlarm();
  if (details?.reason === 'install') {
    await chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    await setBadgeState('idle');
  }
}

async function syncAlarm() {
  const s = await W2A.getSettings();
  await chrome.alarms.clear(W2A.BADGE_ALARM);
  if (s.badgeEnabled) {
    await chrome.alarms.create(W2A.BADGE_ALARM, {
      delayInMinutes: 0.1,
      periodInMinutes: s.badgeIntervalMinutes,
    });
    await checkSiteStatus();
  }
}

/* ------------------------------------------------------------------ */
/* Event wiring                                                        */
/* ------------------------------------------------------------------ */

chrome.runtime.onInstalled.addListener(onInstalled);

chrome.runtime.onStartup.addListener(async () => {
  await ensureContextMenus();
  await syncAlarm();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case MENU_APP:
      openApp();
      break;
    case MENU_WINDOW:
    case MENU_OPEN_IN_WINDOW:
      openCurrentInWindow();
      break;
    default:
      break;
  }
  void tab;
});

chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'open-app-window':
      await openApp('window');
      backgroundState.dashboardOpened = false;
      break;
    case 'open-dashboard':
      await openDashboard();
      break;
    default:
      break;
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === W2A.BADGE_ALARM) checkSiteStatus();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync' && area !== 'local') return;
  if (changes.appUrl || changes.badgeEnabled || changes.badgeIntervalMinutes) {
    syncAlarm();
  }
  if (changes.appName || changes.appUrl) {
    ensureContextMenus();
  }
});

chrome.action.onClicked?.addListener(() => openApp());

/* Messages from popup/options/newtab pages. */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg && msg.cmd) {
      case 'open-app-window':
        await openApp('window');
        break;
      case 'open-app-tab':
        await openApp('tab');
        break;
      case 'open-dashboard':
        await openDashboard();
        break;
      case 'check-status':
        await checkSiteStatus();
        break;
      case 'get-status': {
        const data = await chrome.storage.local.get('w2a:lastStatus');
        sendResponse(data['w2a:lastStatus'] || null);
        return; // already responded — skip the generic ack
      }
      default:
        break;
    }
    sendResponse({ ok: true });
  })();
  return true; // async sendResponse
});
