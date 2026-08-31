# Deployment

> How to get FED-Shell builds into the hands of users.

FED-Shell produces artifacts via GitHub Actions. "Deployment" here means
distributing those artifacts — there is no server to host (unless you build
the optional Web-to-APK API, see `ROADMAP.md`).

---

## Distribution channels

### 1. GitHub Releases (recommended for now)

After a successful `build-all.yml` run:

1. Download the `FED-Shell-Full-Build` zip (or individual artifacts)
2. Go to **Releases → Draft a new release**
3. Tag a version: `v1.0.0` (semantic versioning — see `ROADMAP.md`)
4. Upload the platform artifacts as release assets
5. Publish

Users download directly from the release page.

### 2. FED-PLAY storefront (planned)

FED-Shell will eventually auto-upload built APKs to the **FED-PLAY**
alternative app store. The flow:

1. Build completes in CI
2. A post-build job uploads the APK to FED-PLAY's API
3. The app appears in FED-PLAY for sideloading

*Not yet implemented — tracked in `ROADMAP.md`.*

### 3. Google Play (Android)

Use the `.aab` artifact:

1. Set up a real keystore (not the debug key) — see `BUILD.md` → Signing
2. Add keystore secrets to the repo
3. Enable the release signing config in `android/app/build.gradle`
4. Upload the signed `.aab` to the [Play Console](https://play.google.com/console)

### 4. Apple App Store (iOS)

Requires:
- Paid Apple Developer account ($99/year)
- App ID, signing certificate, and provisioning profile
- A real-device build job (the current workflow only builds for Simulator)

*Real-device iOS builds are planned — see `ROADMAP.md`.*

### 5. Direct distribution (sideloading)

For testing or small audiences:
- Android: share the `.apk` directly (users enable "unknown sources")
- Desktop: share the `.exe` / `.app` / Linux binary directly

---

## CI deployment automation (future)

The workflow can be extended with a `deploy` job that runs after
`package-all`:

```yaml
  deploy:
    needs: package-all
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: FED-Shell-Full-Build
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: FED-Shell-Full-Build.zip
          tag_name: ${{ github.event.inputs.app_name }}-${{ github.run_number }}
```

Wire this in when you're ready for automated releases on every build.

---

## Hosting the target URL

FED-Shell wraps a **live URL** — that URL must be hosted somewhere. Options:

| Host | Cost | Notes |
|---|---|---|
| GitHub Pages | Free | `https://user.github.io/repo` — great for static sites |
| Cloudflare Pages | Free | Custom domains, generous bandwidth |
| Netlify / Vercel | Free tier | Good for SPAs with routing |
| Your own server | Varies | Full sovereignty — aligns with FED-OS philosophy |
| FED-NET | — | The FED-OS networking layer (if available) |

The app will load whatever URL you point it at. Make sure the site is
mobile-friendly and responsive for the best app experience.
