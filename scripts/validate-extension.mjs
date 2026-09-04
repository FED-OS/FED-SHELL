#!/usr/bin/env node
/* web2apk — validate the browser extension before packing.
 *
 * Checks:
 *   1. manifest.json parses and has required MV3 fields
 *   2. every file referenced by the manifest exists
 *   3. icons are real PNGs with correct square dimensions
 *   4. every .js file parses (new Function / vm compile)
 *   5. every <script src> / <link href> / <img src> in HTML exists
 *   6. background service worker imports resolve
 *   7. no inline event handlers (CSP-safe for MV3)
 *
 * Exit code 0 = all good. Prints a summary.
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'extension');
const errors = [];
const warnings = [];
const notes = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}
function note(msg) {
  notes.push(msg);
}

/* ── 1. Manifest ─────────────────────────────────────────────────── */
const manifestPath = join(ROOT, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error('FATAL: manifest.json not found at ' + manifestPath);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (e) {
  console.error('FATAL: manifest.json is not valid JSON: ' + e.message);
  process.exit(1);
}

const REQUIRED = [
  'manifest_version',
  'name',
  'version',
  'description',
  'icons',
  'action',
  'background',
];
for (const key of REQUIRED) {
  if (!(key in manifest)) err(`manifest.json missing required key: ${key}`);
}
if (manifest.manifest_version !== 3) {
  err(`manifest_version must be 3 (Chrome & Edge both require MV3 for new listings), got ${manifest.manifest_version}`);
}
if (!/^\d+\.\d+\.\d+$/.test(String(manifest.version))) {
  err(`version must be dotted numeric (e.g. 2.1.0), got "${manifest.version}"`);
}
if (String(manifest.name).length > 75) {
  err(`name exceeds 75 chars (store limit): ${manifest.name.length}`);
}
if (String(manifest.description).length > 132) {
  warn(`description is ${manifest.description.length} chars; Chrome Web Store hard limit is 132`);
}

const BG = manifest.background;
if (!BG || !BG.service_worker) {
  err('background.service_worker is required (MV3)');
} else if (BG.service_worker.includes('/')) {
  err(`service worker must live at the extension root, got "${BG.service_worker}"`);
}

if (manifest.chrome_url_overrides?.newtab) {
  const nt = manifest.chrome_url_overrides.newtab;
  if (nt.includes('..')) err(`newtab path must be inside the extension: "${nt}"`);
  note(`new-tab override active: ${nt}`);
}

/* ── 2. Referenced files exist ───────────────────────────────────── */
function mustExist(relPath, label) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) {
    err(`${label} references missing file: ${relPath}`);
    return false;
  }
  const st = statSync(abs);
  if (!st.isFile()) err(`${label} references a non-file: ${relPath}`);
  return true;
}

const iconRefs = [];
for (const size of Object.keys(manifest.icons || {})) {
  iconRefs.push(['icons', manifest.icons[size], `manifest.icons[${size}]`]);
}
for (const size of Object.keys(manifest.action?.default_icon || {})) {
  iconRefs.push(['action', manifest.action.default_icon[size], `manifest.action.default_icon[${size}]`]);
}
for (const [ctx, rel, label] of iconRefs) {
  void ctx;
  if (mustExist(rel, label)) note(`icon ok: ${rel}`);
}

if (BG?.service_worker) mustExist(BG.service_worker, 'background.service_worker');
if (manifest.action?.default_popup) mustExist(manifest.action.default_popup, 'action.default_popup');
if (manifest.options_ui?.page) mustExist(manifest.options_ui.page, 'options_ui.page');
if (manifest.chrome_url_overrides?.newtab) {
  mustExist(manifest.chrome_url_overrides.newtab, 'chrome_url_overrides.newtab');
}

/* ── 3. Icon sizes match declared dimensions ─────────────────────── */
function pngSize(buf) {
  // Minimal PNG IHDR parse: width @16, height @20 (big-endian).
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
for (const size of Object.keys(manifest.icons || {})) {
  const rel = manifest.icons[size];
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) continue;
  const buf = readFileSync(abs);
  if (!buf.subarray(0, 8).equals(PNG_MAGIC)) {
    err(`icon ${rel} is not a PNG file`);
    continue;
  }
  const dim = pngSize(buf);
  if (!dim) {
    err(`icon ${rel} has unreadable dimensions`);
    continue;
  }
  if (dim.w !== dim.h) err(`icon ${rel} is not square: ${dim.w}x${dim.h}`);
  if (String(dim.w) !== String(size) && String(dim.h) !== String(size)) {
    err(`icon ${rel} declared as ${size}px but file is ${dim.w}x${dim.h}`);
  }
}

/* ── 4. JS syntax ────────────────────────────────────────────────── */
const JS_FILES = [
  BG?.service_worker,
  'common.js',
  'popup/popup.js',
  'options/options.js',
  'newtab/newtab.js',
].filter(Boolean);

for (const rel of JS_FILES) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    err(`JS file listed for syntax check is missing: ${rel}`);
    continue;
  }
  const src = readFileSync(abs, 'utf8');
  try {
    // Service workers use importScripts — vm.compileFunction with wrap is fine.
    new vm.Script(src, { filename: rel });
    note(`JS syntax ok: ${rel}`);
  } catch (e) {
    err(`JS syntax error in ${rel}: ${e.message}`);
  }
}

/* background.js must importScripts common.js and nothing missing */
{
  const bg = readFileSync(join(ROOT, BG.service_worker), 'utf8');
  const imports = [...bg.matchAll(/importScripts\(([^)]*)\)/g)];
  for (const m of imports) {
    const arg = m[1].replace(/['"`\s]/g, '');
    if (!arg) continue;
    if (arg.includes('http')) {
      err(`importScripts must be local, got: ${arg}`);
      continue;
    }
    if (!existsSync(join(ROOT, arg))) err(`importScripts target missing: ${arg}`);
    else note(`importScripts ok: ${arg}`);
  }
  if (!imports.length) warn('background.js has no importScripts — common.js may not be loaded');
}

/* ── 5. HTML asset references ────────────────────────────────────── */
const HTML_FILES = [
  manifest.action?.default_popup,
  manifest.options_ui?.page,
  manifest.chrome_url_overrides?.newtab,
].filter(Boolean);

for (const rel of HTML_FILES) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) continue;
  const html = readFileSync(abs, 'utf8');
  const base = dirname(abs);
  const refs = [
    ...[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]),
    ...[...html.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)].map((m) => m[1]),
    ...[...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]),
  ];
  for (const ref of refs) {
    if (/^(https?:|data:|chrome:|moz-extension:)/i.test(ref)) continue; // remote / internal ok
    const absRef = join(base, ref);
    if (!existsSync(absRef)) err(`HTML ${rel} references missing asset: ${ref}`);
  }

  /* 7. No inline handlers (MV3 CSP bans them) */
  const inline = html.match(/\son[a-z]+\s*=\s*["']/i);
  if (inline) err(`HTML ${rel} contains an inline event handler (banned by MV3 CSP): ${inline[0].trim()}`);
  const inlineScript = /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S/.test(html);
  if (inlineScript) warn(`HTML ${rel} contains an inline <script> block — keep it in a .js file (MV3 CSP)`);
  note(`HTML refs ok: ${rel}`);
}

/* ── Summary ─────────────────────────────────────────────────────── */
console.log('── web2apk extension validation ─────────────────');
for (const n of notes) console.log('  ✓ ' + n);
for (const w of warnings) console.log('  ⚠ ' + w);
for (const e of errors) console.log('  ✗ ' + e);
console.log('─────────────────────────────────────────────────');
console.log(`${notes.length} checks passed, ${warnings.length} warnings, ${errors.length} errors`);

if (errors.length) {
  process.exit(1);
}
console.log('✅ Extension is valid and ready to pack.');
