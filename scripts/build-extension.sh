#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# web2apk · browser extension packager
#
# Validates the extension, stages its sources into a clean build directory,
# and produces store-ready upload zips:
#
#   dist/chrome-extension-v<version>.zip  → upload to Chrome Web Store
#                                           (https://chrome.google.com/webstore/devconsole)
#   dist/edge-extension-v<version>.zip    → upload to Microsoft Edge Add-ons
#                                           (https://partner.microsoft.com/dashboard/microsoftedge)
#
# Edge Add-ons accepts the exact same Manifest V3 package as Chrome — one
# codebase, two stores. The zips are byte-identical on purpose.
#
# Usage:  bash scripts/build-extension.sh          (from the web2apk repo root or anywhere)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${REPO_ROOT}"

EXT_DIR="extension"
BUILD_DIR="build/extension"
DIST_DIR="dist"

step() { printf '\n\033[1;36m▸ %s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
die()  { printf '\n\033[1;31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

command -v node >/dev/null 2>&1 || die "node is required"
command -v zip >/dev/null 2>&1 || die "zip is required (apt-get install zip)"

VERSION="$(node -p "require('./${EXT_DIR}/manifest.json').version")"
[ -n "${VERSION}" ] || die "could not read version from manifest.json"

step "Validating extension (v${VERSION})"
node scripts/validate-extension.mjs || die "validation failed — fix errors and retry"
ok "all checks passed"

step "Staging sources → ${BUILD_DIR}"
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"
cp "${EXT_DIR}/manifest.json" "${EXT_DIR}/common.js" "${EXT_DIR}/background.js" "${BUILD_DIR}/"
cp -R "${EXT_DIR}/icons" "${EXT_DIR}/popup" "${EXT_DIR}/options" "${EXT_DIR}/newtab" "${BUILD_DIR}/"
# Stores reject junk files inside upload zips
find "${BUILD_DIR}" -name '.DS_Store' -o -name '__MACOSX' -o -name '*.log' | xargs -r rm -rf
ok "staged $(find "${BUILD_DIR}" -type f | wc -l | tr -d ' ') files"

step "Packaging (sources at archive root — required by both stores)"
mkdir -p "${DIST_DIR}"
CHROME_ZIP="${DIST_DIR}/chrome-extension-v${VERSION}.zip"
EDGE_ZIP="${DIST_DIR}/edge-extension-v${VERSION}.zip"
rm -f "${CHROME_ZIP}" "${EDGE_ZIP}"

( cd "${BUILD_DIR}" && zip -qrX "${REPO_ROOT}/${CHROME_ZIP}" . )
ok "chrome  → ${CHROME_ZIP}"

cp "${CHROME_ZIP}" "${EDGE_ZIP}"
ok "edge    → ${EDGE_ZIP}  (identical MV3 package — Edge accepts it as-is)"

step "Summary"
for z in "${CHROME_ZIP}" "${EDGE_ZIP}"; do
  printf '  %-42s %s\n' "${z}" "$(du -h "${z}" | cut -f1)"
done
echo
ok "done — upload the chrome zip to the Chrome Web Store dev console,"
ok "      and the edge zip to the Edge Partner Center → \"Create new extension\"."
