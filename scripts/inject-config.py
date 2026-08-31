#!/usr/bin/env python3
"""
FED-Shell config injector (cross-platform, no fragile shell escaping).

Usage:
    python3 scripts/inject-config.py <url> <app_name> <app_id>

Rewrites capacitor.config.json, Android strings.xml, Android build.gradle,
iOS capacitor.config.json, iOS Info.plist, and native-desktop/config.json
to all point at the same target URL.
"""

import json
import os
import re
import sys


def update_json(path, updates):
    if not os.path.isfile(path):
        print(f"  (skip) {path} — not found")
        return
    with open(path) as f:
        data = json.load(f)
    for key, val in updates.items():
        _set_nested(data, key, val)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    print(f"  ✓ {path}")


def _set_nested(d, dotted_key, value):
    keys = dotted_key.split(".")
    for k in keys[:-1]:
        d = d.setdefault(k, {})
    d[keys[-1]] = value


def update_strings_xml(path, app_name, app_id):
    if not os.path.isfile(path):
        print(f"  (skip) {path} — not found")
        return
    with open(path) as f:
        s = f.read()
    replacements = {
        "app_name": app_name,
        "title_activity_main": app_name,
        "package_name": app_id,
        "custom_url_scheme": app_id,
    }
    for name, val in replacements.items():
        pattern = rf'(<string name="{name}">)[^<]*(</string>)'
        s = re.sub(pattern, lambda m: f"{m.group(1)}{val}{m.group(2)}", s)
    with open(path, "w") as f:
        f.write(s)
    print(f"  ✓ {path}")


def update_build_gradle(path, app_id):
    if not os.path.isfile(path):
        print(f"  (skip) {path} — not found")
        return
    with open(path) as f:
        s = f.read()
    s = re.sub(r'applicationId "[^"]*"', f'applicationId "{app_id}"', s)
    s = re.sub(r'namespace = "[^"]*"', f'namespace = "{app_id}"', s)
    with open(path, "w") as f:
        f.write(s)
    print(f"  ✓ {path}")


def update_info_plist(path, app_name):
    if not os.path.isfile(path):
        print(f"  (skip) {path} — not found")
        return
    with open(path) as f:
        lines = f.read().split("\n")
    out = []
    prev = ""
    for line in lines:
        if "CFBundleDisplayName" in prev:
            line = f"        <string>{app_name}</string>"
        out.append(line)
        prev = line
    with open(path, "w") as f:
        f.write("\n".join(out))
    print(f"  ✓ {path}")


def write_desktop_config(path, target_url, app_name):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump({"url": target_url, "appName": app_name}, f, indent=2)
        f.write("\n")
    print(f"  ✓ {path}")


def main():
    if len(sys.argv) != 4:
        print("Usage: inject-config.py <url> <app_name> <app_id>")
        sys.exit(1)

    target_url, app_name, app_id = sys.argv[1], sys.argv[2], sys.argv[3]
    print(f"[FED-Shell] Injecting URL={target_url}  NAME={app_name}  ID={app_id}")

    print("  → Capacitor (root):")
    update_json("capacitor.config.json", {
        "appId": app_id,
        "appName": app_name,
        "server.url": target_url,
        "server.androidScheme": "https",
    })

    print("  → Android:")
    update_strings_xml("android/app/src/main/res/values/strings.xml", app_name, app_id)
    update_build_gradle("android/app/build.gradle", app_id)

    print("  → iOS:")
    update_json("ios/App/App/capacitor.config.json", {
        "appId": app_id,
        "appName": app_name,
        "server.url": target_url,
    })
    update_info_plist("ios/App/App/Info.plist", app_name)

    print("  → Desktop:")
    write_desktop_config("native-desktop/config.json", target_url, app_name)

    print("[FED-Shell] All configs injected ✓")


if __name__ == "__main__":
    main()
