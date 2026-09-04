/* web2apk · demo loader — injected as the first <head> script of each
 * framed extension page (see demo/server.py and scripts/build-static-demo.py),
 * i.e. BEFORE the page's own <script>s, which sit at the end of <body>.
 *
 * Its whole job: get the chrome-API shim (demo/shim.js) into the parser
 * stream so it executes BEFORE common.js and the page script. A classic
 * head-time script inserting via document.write puts the shim tag right
 * after this one in the stream — the browser then fetches and runs it
 * before parsing continues, so window.chrome exists when the page boots.
 * Parser-inserted scripts always execute in document order, so the
 * guarantee holds for every page, at any path depth, hot cache or cold.
 *
 * The page's own scripts are left completely alone: they run exactly as
 * in the real extension, in their normal order, against the fully
 * parsed DOM. No script stripping, no dynamic re-adding, no race —
 * which is what the old strip-and-re-add loader got wrong: dynamically
 * inserted scripts execute the moment they're fetched, racing the HTML
 * parser (and racing the originals it failed to strip because it ran
 * before they were even parsed).
 */
(() => {
  'use strict';

  const src = document.currentScript && document.currentScript.src;
  const BASE = src ? new URL('.', src).href : '/demo/';

  document.write('<script src="' + BASE + 'shim.js"><\/script>');
})();
