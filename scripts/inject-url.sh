#!/usr/bin/env bash
#
# FED-Shell — URL injection wrapper
# Delegates to the cross-platform Python injector so there's no fragile
# shell escaping. Works identically in CI and locally.
#
# Usage: ./scripts/inject-url.sh "https://example.com" "My App" "com.fed.myapp"
#
set -euo pipefail

TARGET_URL="${1:?Usage: inject-url.sh <url> <app_name> <app_id>}"
APP_NAME="${2:?Usage: inject-url.sh <url> <app_name> <app_id>}"
APP_ID="${3:?Usage: inject-url.sh <url> <app_name> <app_id>}"

python3 "$(dirname "$0")/inject-config.py" "$TARGET_URL" "$APP_NAME" "$APP_ID"
