#!/usr/bin/env python3
"""web2apk · serve the static demo — at / AND at /sub/

Serves build/static-demo/ with a plain static handler (no template logic,
no URL rewriting of file *contents*) and additionally maps /sub/* onto the
same tree — mimicking a GitHub-Pages project site (user.github.io/repo/).
If the demo works under both, it works under any sub-path.

Usage:
    python3 scripts/serve-static-demo.py [port]      # default 8932
"""

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8932
ROOT = Path(__file__).resolve().parent.parent / "build" / "static-demo"


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        p = urlparse(path).path
        if p.startswith("/sub/"):
            path = p[len("/sub"):] or "/"
        elif p == "/sub":
            path = "/"
        return super().translate_path(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):  # keep CI output readable
        pass


def main() -> None:
    handler = lambda *a, **kw: Handler(*a, directory=str(ROOT), **kw)
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    print(f"serving {ROOT} at http://127.0.0.1:{PORT}/ and /sub/ (ctrl-c to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
