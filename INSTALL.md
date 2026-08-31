# Install

> How to install the apps that FED-Shell produces.

FED-Shell itself doesn't get "installed" — it's a build engine. This file
covers how to **install the output apps** on each target device, and how to
**set up a local dev environment** if you want to build from source.

---

## Installing the output apps

### Android (.apk)

1. Download the APK artifact from the GitHub Actions run and unzip it
2. Pick the right APK for your device:
   - `app-arm64-v8a` — most phones from 2019+
   - `app-armeabi-v7a` — older 32-bit phones
   - `app-universal` — works everywhere (slightly larger)
3. Transfer the APK to your phone (USB, cloud, or direct download)
4. On your phone, open the APK
5. If prompted, allow **"Install from unknown sources"** for your browser/files app
6. Install and open

### Android (.aab → Google Play)

The `.aab` is for **Google Play upload only** — you can't install it directly.
1. Go to the [Google Play Console](https://play.google.com/console)
2. Create or select your app
3. Upload the `.aab` under **Production → Create release**
4. Complete the store listing and roll out

> Note: the CI release APKs/AABs are signed with the debug key. For Play Store
> publishing, set up your own keystore — see `BUILD.md` → Signing.

### iOS (.app — Simulator only)

The iOS artifact is a **Simulator build** — it cannot be installed on a real
iPhone without code signing.

1. Unzip the `ios-simulator-app` artifact
2. Open Xcode → **Window → Devices and Simulators**
3. Boot an iOS Simulator
4. Drag the `App.app` bundle onto the Simulator window

> For real-device IPA installation, you need a paid Apple Developer account
> and signing certificates configured as GitHub secrets (planned — see `ROADMAP.md`).

### Windows (.exe)

1. Download and unzip the `desktop-windows` artifact
2. Double-click the `.exe` to run it
3. If Windows SmartScreen warns, click **More info → Run anyway** (the binary
   is unsigned; signing is a future enhancement)

### macOS (.app)

1. Download and unzip the `desktop-macos` artifact
2. Drag the `.app` to your **Applications** folder
3. On first launch, right-click → **Open** (to bypass Gatekeeper for unsigned apps)
4. Confirm **Open** in the dialog

### Linux

1. Download and unzip the `desktop-linux` artifact
2. Make it executable: `chmod +x My-App`
3. Run: `./My-App`
4. If Qt libraries are missing, install: `sudo apt install libegl1 libnss3 libxcb-cursor0`

---

## Setting up a local dev environment

To build from source you need:

```bash
# Clone
git clone https://github.com/FED-OS/FED-Shell.git
cd FED-Shell

# Mobile deps
nvm use 22          # or install Node 22
npm ci

# Desktop deps
cd native-desktop
pip install -r requirements.txt
cd ..
```

See `BUILD.md` for full build commands per platform.
