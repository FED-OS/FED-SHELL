#!/usr/bin/env python3
"""web2apk · live demo server

Serves the demo shell at / and the real extension pages at
/extension/… with the demo loader injected *before* the page's own
scripts, so chrome.* APIs are shimmed and the pages run unmodified.

    python3 demo/server.py [port]        # default 8931

Routes:
    /                    demo shell (index.html)
    /docs.html           rendered extension docs (EXTENSIONS/CHANGELOG/PRIVACY)
    /demo/*              demo assets (shim.js, loader.js)
    /extension/…         real extension pages, loader-injected
    /screenshot          404 – not part of the extension (store screenshot
                         lives in docs/, not the extension package)
"""

import http.server
import socketserver
import sys
import urllib.parse
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEMO = REPO / "demo"
EXT = REPO / "extension"

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8931

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".json": "application/json; charset=utf-8",
}



class DemoHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stdout.write(f"  {self.address_string()} {fmt % args}\n")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path

        if path == "/" or path == "/index.html":
            return self.serve_file(DEMO / "index.html")
        if path == "/docs.html":
            return self.serve_file(DEMO / "docs.html")
        if path.startswith("/demo/"):
            f = DEMO / path[len("/demo/"):]
            return self.serve_file(f)
        if path.startswith("/extension/"):
            rel = path[len("/extension/"):]
            f = EXT / rel
            return self.serve_file(f, inject_loader=True)
        self.send_error(404, "not found")

    def serve_file(self, f: Path, inject_loader=False):
        if not f.is_file():
            return self.send_error(404, "not found")
        ext = f.suffix.lower()
        mime = MIME.get(ext, "application/octet-stream")
        body = f.read_bytes()

        if inject_loader and ext == ".html":
            text = body.decode("utf-8")
            if "</head>" in text:
                # loader must be FIRST — before the page's own <script>s
                text = text.replace(
                    "</head>",
                    '<script src="/demo/loader.js"></script></head>',
                    1,
                )
            elif "</body>" in text:
                text = text.replace(
                    "</body>",
                    '<script src="/demo/loader.js"></script></body>',
                    1,
                )
            body = text.encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), DemoHandler) as httpd:
        print(f"✓ web2apk live demo → http://localhost:{PORT}  (Ctrl-C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nbye")


if __name__ == "__main__":
    main()
