# web2apk Browser Extension — Privacy Policy

**Extension:** web2apk — Web App Launcher (Chrome & Edge, Manifest V3)
**Version:** 2.1.1 · **Last updated:** 2026-02-05
**Contact:** the web2apk project maintainers (see the repository listed in Options → About)

## Summary

web2apk collects **no data**. It has no accounts, no servers, no analytics, no
telemetry, and no third-party code. Everything the extension knows stays inside
your browser profile, under your control, and every network request it makes is
one you explicitly configured or triggered. This page explains exactly what the
extension stores, why each permission exists, and what leaves your browser
(short answer: nothing, except the status probes you ask for).

## What is stored, and where

All settings live in `chrome.storage` — a browser-provided key-value store that
never leaves your machine except through your own browser sync (see below). The
extension writes exactly these keys:

| Key | Area | Contents | Why |
| --- | --- | --- | --- |
| `w2a:settings` | `chrome.storage.sync` (falls back to `local`) | Your app name, app URL, theme, badge toggle, quick links | Restores your configuration; sync keeps it consistent across your own signed-in browsers |
| `w2a:lastStatus` | `chrome.storage.local` | `ok`/`down` + timestamp of the last reachability check | Shows the status dot/badge without re-probing |
| `w2a:recents` | `chrome.storage.local` | Up to 5 app URLs you opened, most-recent first | Powers the "Recent" list in the popup |

`chrome.storage.sync`, when enabled in your browser, replicates these keys to
your own synced devices through your browser vendor's sync infrastructure. The
extension never reads anything else from storage, never reads your browsing
history, cookies, or any page content, and has **no host permissions at all** —
it cannot read or modify any website.

Options → About shows which storage area is live, and Options has
**Export/Import (JSON)** and **Reset** so you can inspect, move, or erase all
extension data yourself at any time. Uninstalling the extension removes every
key listed above.

## Network activity

The extension makes exactly one kind of network request: an optional
**reachability probe** (a `HEAD` request in `no-cors` mode) against **the app
URL you configured**, when you click "Check status" in the popup or when the
periodic check you enabled runs. The request is sent directly from your browser
to your site — there is no proxy, no logging endpoint, and no copy of the
result anywhere outside your browser. If the badge feature is disabled, no
scheduled requests happen at all. Search queries typed on the new-tab page go
to your chosen search engine exactly as if you had typed them into the
browser's own address bar.

## Permissions and why each one exists

The extension requests only three permissions — among the smallest sets that
can deliver its features — and each maps to a visible feature:

| Permission | Visible feature it powers |
| --- | --- |
| `storage` | Saving your settings, quick links, recents, and last status between sessions (and across your own synced browsers). Without it, the extension would forget your configuration on every restart. |
| `alarms` | The optional periodic site-status check ("badge" feature) you configure in Options. Alarms let the service worker wake up on schedule without keeping anything running in between. Turn the badge off and no alarms are scheduled. |
| `contextMenus` | The right-click "Open app window / Open app tab" items. This is the entire surface area of the feature — one menu entry that opens your configured site. |

Notably absent: **no host permissions** (not even optional ones), no
`tabs`, no `history`, no `downloads`, no `webRequest`, and no content scripts.
The status probe works with zero host access because a `no-cors` HEAD request
only needs to *resolve* to prove reachability — the extension never reads the
response body of any site.

## Remote code

None. The extension ships 100% of its code in the package — no remotely hosted
scripts, styles, or iframes, in line with the Chrome Web Store and Edge Add-ons
remote-code policies. The build validator (`scripts/validate-extension.mjs`)
fails the build if any HTML page references a remote script or stylesheet, so
this stays true by construction.

## Changes to this policy

The extension's data footprint cannot grow silently: any new permission or new
data key requires a version bump and a CHANGELOG entry, and this page will be
updated in the same change. The CHANGELOG (see `CHANGELOG.md`) records every
permission change in extension history.
