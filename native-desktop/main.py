"""
FED-Shell — Desktop WebView wrapper (PySide6/QtWebEngine)

This is the actual application code. It reads the URL from an embedded
config.json (injected at build time by compile-desktop.py via PyInstaller)
and locks all navigation to that domain — exactly like the Android/iOS
wrappers, but for desktop.
"""

import sys
import os
import json
import subprocess
import webbrowser

from PySide6.QtCore import QUrl, Qt
from PySide6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import QWebEnginePage


def get_resource_path(relative_path):
    """
    Get absolute path to a bundled resource.
    Works both in dev (run from source) and inside a PyInstaller bundle
    (where files live in sys._MEIPASS).
    """
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), relative_path)


class LockedPage(QWebEnginePage):
    """
    A web page that locks navigation to the target domain.
    Internal links load inside the app; external links open in the
    user's default system browser.
    """

    def __init__(self, parent, allowed_url):
        super().__init__(parent)
        self.allowed_url = allowed_url

    def acceptNavigationRequest(self, url, nav_type, is_main_frame):
        url_str = url.toString()
        # Allow the target domain and its sub-paths
        if url_str.startswith(self.allowed_url):
            return True
        # Allow about:blank and data: URIs (internal page operations)
        if url_str.startswith(("about:", "data:")):
            return True
        # Block everything else from loading inside the app;
        # send external links to the system browser instead.
        if url_str.startswith(("http://", "https://")):
            webbrowser.open(url_str)
        return False


class MainWindow(QMainWindow):
    def __init__(self, target_url, app_name):
        super().__init__()
        self.target_url = target_url
        self.setWindowTitle(app_name)
        self.resize(1280, 800)
        self.setMinimumSize(480, 360)

        # WebView
        self.browser = QWebEngineView()
        page = LockedPage(self.browser, target_url)
        self.browser.setPage(page)
        self.browser.setUrl(QUrl(target_url))

        # Full-bleed layout
        central = QWidget()
        layout = QVBoxLayout(central)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self.browser)
        self.setCentralWidget(central)

        # Reload shortcut (Ctrl+R)
        self.reload_sc = __import__("PySide6.QtGui", fromlist=["QShortcut"])
        # Keep it simple — Ctrl+R reloads
        from PySide6.QtGui import QKeySequence, QShortcut

        QShortcut(QKeySequence("Ctrl+R"), self, self.browser.reload)
        QShortcut(QKeySequence("F5"), self, self.browser.reload)


def load_config():
    """
    Read config.json. In a PyInstaller bundle it lives next to the
    executable or in _MEIPASS. In dev it lives alongside this script.
    """
    candidates = [
        get_resource_path("config.json"),
        os.path.join(os.path.dirname(sys.executable), "config.json"),
        os.path.join(os.getcwd(), "config.json"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            with open(path, "r") as f:
                return json.load(f)
    return {"url": "https://example.com", "appName": "FED Shell"}


if __name__ == "__main__":
    config = load_config()
    target_url = config.get("url", "https://example.com")
    app_name = config.get("appName", "FED Shell")

    # High-DPI scaling before QApplication is created
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )

    app = QApplication(sys.argv)
    app.setApplicationName(app_name)

    window = MainWindow(target_url, app_name)
    window.show()

    sys.exit(app.exec())
