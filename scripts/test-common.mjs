#!/usr/bin/env node
/* web2apk · unit tests for extension/common.js
 *
 * Zero dependencies: node:assert + an in-memory chrome.storage mock.
 * Run:  node scripts/test-common.mjs        (exit 0 = pass)
 *   or: node --test scripts/test-common.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/* ── chrome.storage mock ──────────────────────────────────────────────── */
function makeArea() {
  const data = new Map();
  const area = {
    data,
    async get(keys) {
      if (keys == null) return Object.fromEntries(data);
      if (typeof keys === 'string') keys = [keys];
      if (Array.isArray(keys)) {
        const out = {};
        for (const k of keys) if (data.has(k)) out[k] = data.get(k);
        return out;
      }
      // object → keys with default values for missing entries (Chrome semantics)
      const out = {};
      for (const [k, v] of Object.entries(keys)) out[k] = data.has(k) ? data.get(k) : v;
      return out;
    },
    async set(items) {
      if (area.shouldThrow) throw new Error('QUOTA_BYTES exceeded');
      for (const [k, v] of Object.entries(items)) data.set(k, v);
    },
    shouldThrow: false,
  };
  return area;
}

const syncArea = makeArea();
const localArea = makeArea();
globalThis.chrome = {
  storage: { sync: syncArea, local: localArea },
};

/* load AFTER mock is in place is fine too (chrome accessed lazily) */
const { W2A } = require(path.join(here, '..', 'extension', 'common.js'));

let passed = 0;
let failed = 0;
function t(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}\n      ${err.message.split('\n').join('\n      ')}`);
  }
}

console.log('── web2apk common.js unit tests ──');

/* ── constants ────────────────────────────────────────────────────────── */
t('VERSION matches manifest.json version', () => {
  const manifest = JSON.parse(readFileSync(path.join(here, '..', 'extension', 'manifest.json'), 'utf8'));
  assert.equal(W2A.VERSION, manifest.version);
});

t('DEFAULTS are sane and frozen', () => {
  assert.equal(W2A.DEFAULTS.appUrl, 'https://example.com/');
  assert.equal(W2A.DEFAULTS.openMode, 'window');
  assert.ok(W2A.DEFAULTS.windowWidth >= 360 && W2A.DEFAULTS.windowWidth <= 7680);
  assert.ok(Object.isFrozen(W2A.DEFAULTS));
  assert.ok(Array.isArray(W2A.DEFAULTS.quickLinks));
});

t('SEARCH_ENGINES templates contain %s', () => {
  for (const e of Object.values(W2A.SEARCH_ENGINES)) {
    assert.ok(e.url.includes('%s'), `${e.name} template missing %s`);
    assert.ok(e.url.startsWith('https://'));
  }
});

/* ── URL helpers ──────────────────────────────────────────────────────── */
t('isHttpUrl accepts http/https with host', () => {
  assert.equal(W2A.isHttpUrl('https://example.com/'), true);
  assert.equal(W2A.isHttpUrl('http://localhost:3000/x'), true);
  assert.equal(W2A.isHttpUrl('example.com'), false); // no scheme
  assert.equal(W2A.isHttpUrl('ftp://x'), false);
  assert.equal(W2A.isHttpUrl(''), false);
  assert.equal(W2A.isHttpUrl(null), false);
  assert.equal(W2A.isHttpUrl(42), false);
});

t('normalizeUrl auto-prefixes https://', () => {
  assert.equal(W2A.normalizeUrl('github.com'), 'https://github.com/');
  assert.equal(W2A.normalizeUrl('  github.com  '), 'https://github.com/');
});

t('normalizeUrl keeps scheme and path', () => {
  assert.equal(W2A.normalizeUrl('https://github.com/ninjatech'), 'https://github.com/ninjatech');
  assert.equal(W2A.normalizeUrl('http://example.com/a?b=c'), 'http://example.com/a?b=c');
});

t('normalizeUrl rejects garbage', () => {
  assert.equal(W2A.normalizeUrl(''), '');
  assert.equal(W2A.normalizeUrl(null), '');
  assert.equal(W2A.normalizeUrl('not a url at all'), '');
  assert.equal(W2A.normalizeUrl('https://'), ''); // no host
});

t('hostnameOf strips www and passes through invalid input', () => {
  assert.equal(W2A.hostnameOf('https://www.youtube.com/watch'), 'youtube.com');
  assert.equal(W2A.hostnameOf('https://github.com'), 'github.com');
  assert.equal(W2A.hostnameOf('not a url'), 'not a url');
});

t('faviconUrl embeds encoded domain', () => {
  const u = new URL(W2A.faviconUrl('https://www.youtube.com/'));
  assert.equal(u.hostname, 'www.google.com');
  assert.equal(u.pathname, '/s2/favicons');
  assert.equal(u.searchParams.get('domain'), 'youtube.com');
  assert.equal(u.searchParams.get('sz'), '64');
});

t('buildSearchUrl renders every engine and encodes the query', () => {
  const q = 'web2apk rocks & more';
  assert.equal(W2A.buildSearchUrl('google', q), `https://www.google.com/search?q=${encodeURIComponent(q)}`);
  assert.equal(W2A.buildSearchUrl('bing', 'x'), 'https://www.bing.com/search?q=x');
  assert.equal(W2A.buildSearchUrl('duckduckgo', 'x'), 'https://duckduckgo.com/?q=x');
  // unknown engine falls back to google, never throws
  assert.equal(W2A.buildSearchUrl('altavista', 'x'), 'https://www.google.com/search?q=x');
});

/* ── misc ─────────────────────────────────────────────────────────────── */
t('clampInt clamps and falls back on non-numbers', () => {
  assert.equal(W2A.clampInt(500, 360, 7680, 1280), 500);
  assert.equal(W2A.clampInt(100, 360, 7680, 1280), 360);   // below min → min
  assert.equal(W2A.clampInt(99999, 360, 7680, 1280), 7680); // above max → max
  assert.equal(W2A.clampInt('abc', 360, 7680, 1280), 1280); // NaN → fallback
  assert.equal(W2A.clampInt('1280', 360, 7680, 1280), 1280); // numeric string ok
  assert.equal(W2A.clampInt(undefined, 360, 7680, 1280), 1280);
});

t('formatWhen buckets relative time', () => {
  assert.equal(W2A.formatWhen(0), 'never');
  const now = Date.now();
  assert.equal(W2A.formatWhen(now), 'just now');
  assert.equal(W2A.formatWhen(now - 5 * 60000), '5m ago');
  assert.equal(W2A.formatWhen(now - 3 * 3600000), '3h ago');
  assert.equal(W2A.formatWhen(now - 2 * 86400000), '2d ago');
  assert.equal(W2A.formatWhen(now - 30 * 86400000), new Date(now - 30 * 86400000).toLocaleDateString());
});

/* ── settings sanitization ────────────────────────────────────────────── */
t('sanitizeSettings passes a fully valid object through', () => {
  const input = { ...W2A.DEFAULTS, appName: 'Docs', appUrl: 'https://docs.example.com/' };
  const out = W2A.sanitizeSettings(input);
  assert.equal(out.appName, 'Docs');
  assert.equal(out.appUrl, 'https://docs.example.com/');
});

t('sanitizeSettings normalizes scheme-less appUrl instead of reverting to default', () => {
  const out = W2A.sanitizeSettings({ ...W2A.DEFAULTS, appUrl: 'github.com' });
  assert.equal(out.appUrl, 'https://github.com/');
});

t('sanitizeSettings falls back to defaults on garbage', () => {
  const out = W2A.sanitizeSettings({ ...W2A.DEFAULTS, appUrl: '', appName: '   ' });
  assert.equal(out.appUrl, W2A.DEFAULTS.appUrl);
  assert.equal(out.appName, W2A.DEFAULTS.appName);
  const out2 = W2A.sanitizeSettings({ ...W2A.DEFAULTS, appUrl: 'not a url !!' });
  assert.equal(out2.appUrl, W2A.DEFAULTS.appUrl);
});

t('sanitizeSettings clamps window size and badge interval', () => {
  const out = W2A.sanitizeSettings({ ...W2A.DEFAULTS, windowWidth: 10, windowHeight: 999999, badgeIntervalMinutes: 0 });
  assert.equal(out.windowWidth, 360);          // min
  assert.equal(out.windowHeight, 4320);        // max
  assert.equal(out.badgeIntervalMinutes, 1);   // min
});

t('sanitizeSettings whitelists enums', () => {
  const out = W2A.sanitizeSettings({ ...W2A.DEFAULTS, openMode: 'popup', theme: 'neon', searchEngine: 'lycos' });
  assert.equal(out.openMode, W2A.DEFAULTS.openMode);
  assert.equal(out.theme, W2A.DEFAULTS.theme);
  assert.equal(out.searchEngine, W2A.DEFAULTS.searchEngine);
  const out2 = W2A.sanitizeSettings({ ...W2A.DEFAULTS, openMode: 'tab', theme: 'light', searchEngine: 'bing' });
  assert.equal(out2.openMode, 'tab');
  assert.equal(out2.theme, 'light');
  assert.equal(out2.searchEngine, 'bing');
});

t('sanitizeSettings coerces booleans', () => {
  const out = W2A.sanitizeSettings({ ...W2A.DEFAULTS, newtabEnabled: 0, badgeEnabled: 'yes' });
  assert.equal(out.newtabEnabled, false);
  assert.equal(out.badgeEnabled, true);
});

t('sanitizeSettings survives missing/undefined input partially', () => {
  const out = W2A.sanitizeSettings({});
  assert.equal(out.appUrl, W2A.DEFAULTS.appUrl);
  assert.equal(out.openMode, 'window');
  assert.deepEqual(out.quickLinks, []);
});

/* ── quick links ──────────────────────────────────────────────────────── */
t('sanitizeQuickLinks drops junk and normalizes scheme-less URLs', () => {
  const out = W2A.sanitizeQuickLinks([
    { title: 'GH', url: 'github.com' },              // normalized
    { title: '', url: 'https://youtube.com/' },      // title falls back to hostname
    { title: 'bad', url: 'not a url' },              // dropped (unnormalizable)
    null,                                             // dropped
    'string',                                         // dropped
    { title: 'x' },                                   // dropped (no url)
  ]);
  assert.deepEqual(out, [
    { title: 'GH', url: 'https://github.com/' },
    { title: 'youtube.com', url: 'https://youtube.com/' },
  ]);
});

t('sanitizeQuickLinks caps the list at 24 and trims titles to 48 chars', () => {
  const many = Array.from({ length: 40 }, (_, i) => ({ title: `L${i}`, url: `https://x${i}.com/` }));
  const out = W2A.sanitizeQuickLinks(many);
  assert.equal(out.length, 24);
  const long = W2A.sanitizeQuickLinks([{ title: 'a'.repeat(80), url: 'https://a.com/' }]);
  assert.equal(long[0].title.length, 48);
});

t('sanitizeQuickLinks returns [] for non-arrays', () => {
  assert.deepEqual(W2A.sanitizeQuickLinks(null), []);
  assert.deepEqual(W2A.sanitizeQuickLinks('nope'), []);
  assert.deepEqual(W2A.sanitizeQuickLinks({}), []);
});

/* ── storage round-trips (mocked chrome.storage) ──────────────────────── */
/* (async tests run sequentially below) */
const results = [];
async function ta(name, fn) {
  try {
    await fn();
    results.push([name, true]);
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.push([name, false]);
    console.error(`  ✗ ${name}\n      ${err.message.split('\n').join('\n      ')}`);
  }
}

await ta('getSettings → defaults on empty storage', async () => {
  syncArea.data.clear(); localArea.data.clear();
  const s = await W2A.getSettings();
  assert.deepEqual(s, { ...W2A.DEFAULTS });
});

await ta('getSettings merges stored values over defaults (new keys fall back)', async () => {
  syncArea.data.clear(); localArea.data.clear();
  await syncArea.set({ appName: 'Docs', appUrl: 'https://docs.example.com/' });
  const s = await W2A.getSettings();
  assert.equal(s.appName, 'Docs');
  assert.equal(s.openMode, W2A.DEFAULTS.openMode); // untouched key → default
});

await ta('saveSettings sanitizes and writes to sync', async () => {
  syncArea.data.clear(); localArea.data.clear();
  await W2A.saveSettings({ appUrl: 'github.com' });
  assert.equal(syncArea.data.get('appUrl'), 'https://github.com/');
  assert.ok(!localArea.data.has('appUrl'));
});

await ta('saveSettings falls back to local when sync throws (quota)', async () => {
  syncArea.data.clear(); localArea.data.clear();
  syncArea.shouldThrow = true;
  try {
    await W2A.saveSettings({ appName: 'Quota Test' });
    assert.equal(localArea.data.get('appName'), 'Quota Test');
  } finally {
    syncArea.shouldThrow = false;
  }
});

await ta('recordOpen dedupes by URL, newest first, caps at 5', async () => {
  localArea.data.clear();
  await W2A.recordOpen('https://a.com/');
  await W2A.recordOpen('https://b.com/');
  await W2A.recordOpen('https://c.com/');
  await W2A.recordOpen('https://a.com/'); // dup → moves to front, no copy
  for (let i = 0; i < 6; i++) await W2A.recordOpen(`https://n${i}.com/`);
  const recents = await W2A.getRecents();
  assert.equal(recents.length, 5);
  assert.equal(recents[0].url, 'https://n5.com/'); // most recent first
  assert.ok(!recents.some((r) => r.url === 'https://a.com/')); // old ones evicted
  assert.ok(recents.every((r) => typeof r.at === 'number'));
});

await ta('getRecents returns [] when nothing recorded / storage fails', async () => {
  localArea.data.clear();
  assert.deepEqual(await W2A.getRecents(), []);
  const origGet = localArea.get;
  localArea.get = async () => { throw new Error('boom'); };
  try {
    assert.deepEqual(await W2A.getRecents(), []);
  } finally {
    localArea.get = origGet;
  }
});

await ta('recordOpen swallows storage errors (never rejects)', async () => {
  localArea.data.clear();
  const origSet = localArea.set;
  localArea.set = async () => { throw new Error('boom'); };
  try {
    await assert.doesNotReject(() => W2A.recordOpen('https://x.com/'));
  } finally {
    localArea.set = origSet;
  }
});

/* ── summary ──────────────────────────────────────────────────────────── */
const failedAsync = results.filter(([, ok]) => !ok).length;
const totalFailed = failed + failedAsync;
const totalPassed = passed + results.length - failedAsync;
console.log('─'.repeat(46));
if (totalFailed) {
  console.log(`✗ ${totalFailed} test(s) failed (${totalPassed} passed)`);
  process.exit(1);
}
console.log(`✓ all ${totalPassed} tests passed`);
