# FAQ — Extended

> Longer answers to questions that don't fit in the main `FAQ.md`.

## General

### Why does FED-Shell exist when tools like PWABuilder already do this?

PWABuilder is excellent for Progressive Web Apps that meet PWA criteria
(service worker, manifest, etc.). FED-Shell is for the simpler case: you have
a URL — any URL — and you want it wrapped as a native app. No PWA
requirements, no service worker needed, no manifest. Just a URL in, native
apps out.

FED-Shell also targets **more platforms** in a single run (Android debug +
release + AAB, iOS simulator, Windows + macOS + Linux desktop, plus
conditional Electron and Tauri) and keeps everything in **one repo** with
**one injector** rather than spreading across services.

### Can I use FED-Shell for a site I don't own?

Technically yes — you pass any URL. But you should consider:

1. **Legal**: Wrapping someone else's site as an app may violate their terms
   of service or copyright.
2. **Technical**: The site may block WebView user agents, set
   `X-Frame-Options: DENY`, or use CSP headers that prevent embedding.
3. **Ethical**: Don't impersonate another company's app.

FED-Shell is designed for developers wrapping **their own** web apps.

## Building

### Why does the iOS build only produce a simulator app?

Building an iOS `.ipa` for real devices requires an Apple Developer account
($99/year), a provisioning profile, and a signing certificate. These can't be
embedded in a public repo. The simulator build requires none of these and
works on GitHub's macOS runners.

To build for real devices, fork the repo, add your signing secrets to GitHub
Encrypted Secrets, and modify the `build-ios-simulator` job to use
`xcodebuild` with `CODE_SIGNING_ALLOWED=YES` and your provisioning profile.

### Why are there three separate Android jobs (debug, release, AAB)?

Each produces a different artifact for a different purpose:

- **Debug APK**: For quick testing. Debug-signed, no keystore needed.
- **Release APK**: For sideloading on devices. Debug-signed by default; add a
  real keystore in Secrets for production signing.
- **AAB**: For the Google Play Store. Play requires AAB format (not APK) for
  new submissions.

Running them as parallel jobs means all three finish in the time of the
slowest one, rather than sequentially.

### The desktop build is huge. Can I make it smaller?

PyInstaller one-file mode bundles the Python interpreter and all libraries.
For PySide6, this means ~40–60 MB. Options to reduce:

1. Use `--onedir` instead of `--onefile` (smaller per-file, but multiple files)
2. Exclude unused Qt modules with `--exclude-module`
3. Use UPX compression (`--upx-dir`)
4. Strip debug symbols

These are trade-offs between size, startup time, and complexity. The default
one-file mode is the simplest to distribute.

## URL & offline

### Can the app work offline?

Not by default. FED-Shell loads a remote URL — if there's no internet, the
WebView shows an error page. True offline support would require caching the
target site's assets locally, which is on the backlog (v1.x).

If your target site is itself a PWA with a service worker, the WebView may
cache some assets automatically, but this is not guaranteed across all
WebView engines.

### What happens when the user clicks an external link?

On desktop, the `LockedPage` class intercepts the navigation, checks if the
target domain matches the configured domain, and if not, opens the link in
the user's system browser (Chrome, Firefox, Safari, etc.) while keeping the
app on the original page.

On mobile (Capacitor), external links open in the system browser via
`_target="_blank"` and the Capacitor Browser plugin.

## Customization

### How do I add a custom icon?

Currently, icons are the default Capacitor/PyInstaller icons. To customize:

**Mobile**: Replace the icons in `android/app/src/main/res/mipmap-*/` and
`ios/App/App/Assets.xcassets/AppIcon.appiconset/` with your own. Icon
generation from a single input image is on the roadmap (v1.1.0).

**Desktop**: Pass `--icon path/to/icon.ico` (Windows) or `--icon
path/to/icon.icns` (macOS) to `compile-desktop.py`.

### How do I change the splash screen?

Replace `android/app/src/main/res/drawable-*/splash.png` and
`ios/App/App/Assets.xcassets/Splash.imageset/splash-*.png`. Auto-generation is
on the roadmap.

### Can I add Capacitor plugins (camera, geolocation, etc.)?

Yes. Add the plugin to `package.json`, run `npx cap sync`, and the plugin's
native code will be included in the build. Note that this adds permissions to
`AndroidManifest.xml` and `Info.plist` — update them accordingly.
