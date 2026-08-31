#!/usr/bin/env python3
"""
FED-Shell — Desktop build orchestrator.

Usage:
    python compile-desktop.py --url https://example.com --name "My App" --platform windows

This script:
  1. Creates a clean build directory
  2. Writes a config.json containing the target URL + app name
  3. Copies main.py in
  4. Runs PyInstaller to produce a single standalone executable
     with config.json embedded
  5. Moves the result to dist/standalone/ for artifact upload
"""

import os
import sys
import json
import shutil
import argparse
import subprocess


def main():
    parser = argparse.ArgumentParser(description="FED-Shell desktop packager")
    parser.add_argument("--url", required=True, help="Target URL to lock the app to")
    parser.add_argument("--name", required=True, help="App display name")
    parser.add_argument(
        "--platform",
        required=True,
        choices=["windows", "macos", "linux"],
        help="Target platform (controls path separators and output naming)",
    )
    parser.add_argument(
        "--icon",
        default=None,
        help="Optional path to an icon file (.ico / .icns / .png)",
    )
    args = parser.parse_args()

    build_dir = "temp_build"
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    os.makedirs(build_dir, exist_ok=True)

    # --- 1. Write config.json ---
    config = {"url": args.url, "appName": args.name}
    config_path = os.path.join(build_dir, "config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    # --- 2. Copy main.py ---
    script_dir = os.path.dirname(os.path.abspath(__file__))
    shutil.copy(os.path.join(script_dir, "main.py"), os.path.join(build_dir, "main.py"))

    # --- 3. Build PyInstaller command ---
    # Path separator for --add-data differs by OS
    sep = ";" if args.platform == "windows" else ":"
    main_py = os.path.join(build_dir, "main.py")
    config_for_data = os.path.join(build_dir, "config.json")

    cmd = [
        "pyinstaller",
        "--onefile",
        "--noconsole",
        "--noconfirm",
        "--clean",
        "--name", args.name,
        "--add-data", f"{config_for_data}{sep}.",
        main_py,
    ]

    # Platform-specific icon handling
    if args.icon and os.path.isfile(args.icon):
        cmd += ["--icon", args.icon]
    else:
        # Use a bundled default icon if present
        default_icon = os.path.join(script_dir, "assets", "icon")
        if args.platform == "windows" and os.path.isfile(default_icon + ".ico"):
            cmd += ["--icon", default_icon + ".ico"]
        elif args.platform == "macos" and os.path.isfile(default_icon + ".icns"):
            cmd += ["--icon", default_icon + ".icns"]

    # macOS: produce a .app bundle
    if args.platform == "macos":
        cmd.append("--windowed")

    print(f"[FED-Shell] Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)

    # --- 4. Move output to dist/standalone ---
    standalone = "dist/standalone"
    os.makedirs(standalone, exist_ok=True)

    if args.platform == "windows":
        src = os.path.join("dist", f"{args.name}.exe")
        if os.path.isfile(src):
            shutil.move(src, os.path.join(standalone, f"{args.name}.exe"))
    elif args.platform == "macos":
        src = os.path.join("dist", f"{args.name}.app")
        if os.path.isdir(src):
            shutil.move(src, os.path.join(standalone, f"{args.name}.app"))
    else:  # linux
        src = os.path.join("dist", args.name)
        if os.path.isfile(src):
            shutil.move(src, os.path.join(standalone, args.name))
            os.chmod(os.path.join(standalone, args.name), 0o755)

    # --- 5. Cleanup ---
    shutil.rmtree("build", ignore_errors=True)
    shutil.rmtree(build_dir, ignore_errors=True)
    # Remove the pyinstaller dist (we moved the binary out)
    leftover_spec = os.path.join("dist", f"{args.name}.spec")
    if os.path.isfile(leftover_spec):
        os.remove(leftover_spec)

    print(f"[FED-Shell] Done. Output in {standalone}/")


if __name__ == "__main__":
    main()
