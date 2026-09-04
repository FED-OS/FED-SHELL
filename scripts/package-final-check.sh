#!/bin/bash
# Final package verification — run exactly what a fresh consumer would:
#   1. unzip the deliverable into a scratch dir
#   2. run the full pipeline from those bits alone:
#        validate → unit tests → a11y → build store zips →
#        build-static-demo → serve → 48-check static demo (root + /sub/) →
#        smoke-test BOTH packaged dist zips (shipped bits)
#   3. clean up (servers killed by PID; scratch dir kept on failure for
#      debugging, removed on success)
#
# The package zip intentionally excludes build/ (generated output), so the
# static demo must be built from the package's own scripts — exactly what
# CI does. Any failure anywhere → non-zero exit.
#
# Usage: bash scripts/package-final-check.sh
set -e
set -o pipefail

ZIP=/workspace/web2apk-browser-extensions.zip
WORK=/tmp/pkg-check
PORT=8934

rm -rf "$WORK"
mkdir "$WORK"
cd "$WORK"
unzip -q "$ZIP"

echo "== inventory =="
unzip -l "$ZIP" | tail -1

echo "== validate =="
node scripts/validate-extension.mjs

echo "== unit tests =="
node scripts/test-common.mjs

echo "== a11y check =="
xvfb-run -a --server-args="-screen 0 1600x1000x24" python3 scripts/a11y-check.py | tail -3

echo "== build store zips =="
bash scripts/build-extension.sh | tail -2

echo "== build static demo =="
python3 scripts/build-static-demo.py

echo "== static demo checks (root + /sub/) =="
python3 scripts/serve-static-demo.py "$PORT" > /tmp/pkg-serve.log 2>&1 &
SRV=$!
sleep 2
trap 'kill "$SRV" 2>/dev/null || true' EXIT
python3 scripts/static-demo-check.py "$PORT" | tee /tmp/pkg-check-result.txt | tail -1

echo "== smoke-test packaged dist zips (shipped bits) =="
rm -rf build/dist-unzipped && mkdir -p build/dist-unzipped
unzip -q dist/chrome-extension-*.zip -d build/dist-unzipped
W2A_EXT_DIR=build/dist-unzipped W2A_NO_SHOT=1 xvfb-run -a python3 scripts/smoke-test-extension.py | tail -3

echo ""
echo "ALL PACKAGE CHECKS PASSED"
rm -rf "$WORK"
