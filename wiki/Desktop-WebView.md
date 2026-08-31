# Desktop WebView

> How the PySide6 domain-locked WebView works and why it's not Electron.

## The file: `native-desktop/main.py`

The desktop app is a thin PySide6 (Qt) wrapper around `QWebEngineView` that
loads a single URL and prevents navigation away from that domain.

## Core class: `LockedPage`

```python
class LockedPage(QWebEnginePage):
    def acceptNavigationRequest(self, url, nav_type, is_main):
        if url.host() == self.allowed_host:
            return True           # same domain → allow
        if url.scheme() in ("about", "data"):
            return True           # internal → allow
        # external link → open in system browser, block in WebView
        webbrowser.open(url.toString())
        return False
```

This is the security boundary. It ensures that:

1. The WebView never navigates to a different domain (preventing phishing
   redirects)
2. External links (e.g. social media buttons, "visit our full site") open in
   the user's default browser, not trapped inside the app
3. Internal `about:` and `data:` URIs still work (needed for some web APIs)

## Config loading

At startup, the app reads `config.json`:

```python
def get_resource_path(filename):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, filename)
    return os.path.join(os.path.dirname(__file__), filename)
```

The `sys._MEIPASS` check handles PyInstaller's one-file mode, where bundled
data is extracted to a temp directory at runtime. Without this, the packaged
`.exe` / `.app` would fail to find `config.json`.

## Window setup

```python
app = QApplication(sys.argv)
window = QMainWindow()
view = QWebEngineView()
page = LockedPage(view.page().profile(), allowed_host=target_host)
view.setPage(page)
view.setUrl(QUrl(target_url))
window.setCentralWidget(view)
window.setWindowTitle(app_name)
window.show()
```

## Keyboard shortcuts

- `Ctrl+R` / `F5` — Reload the page (useful during development)

## Why PySide6, not Electron?

See `ADR.md` ADR-006 for the full decision. Summary:

| Factor | PySide6 + PyInstaller | Electron |
|--------|-----------------------|----------|
| Binary size | ~40–60 MB | ~120–180 MB |
| RAM usage | Lower (native Qt) | Higher (Chromium + Node) |
| Dependencies | pip install | npm install + electron-builder |
| Startup time | Fast | Slower (Node boot) |
| WebView engine | QtWebEngine (Chromium) | Chromium (full) |
| License | LGPLv3 (linkable) | MIT (but bundles Chromium) |

For a **URL wrapper**, PySide6's smaller footprint and simpler dependency
chain win. Electron's advantages (rich Node ecosystem, npm packages) don't
apply when the app is just loading a URL.

## PyInstaller packaging

`native-desktop/compile-desktop.py` handles the build:

1. Creates a temp build directory
2. Writes `config.json` with the URL and app name
3. Runs `pyinstaller --onefile --noconsole --add-data "config.json;." main.py`
   (note: `;` separator on Windows, `:` on Unix)
4. Moves the output to `dist/standalone/`

The `--noconsole` flag hides the terminal window on Windows/macOS so the app
appears as a normal GUI application.
