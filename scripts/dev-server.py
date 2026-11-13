"""Local preview of site/ that behaves like Cloudflare Pages (clean URLs).

    python scripts/dev-server.py [port]     # default 8788, http://localhost:8788
"""
import http.server, os, sys

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=SITE, **kw)

    def send_head(self):
        path = self.path.split("?")[0].split("#")[0]
        if path.startswith("/impact/"):
            self.path = "/impact.html"
        elif path != "/" and "." not in path.rsplit("/", 1)[-1]:
            if os.path.isfile(os.path.join(SITE, path.strip("/") + ".html")):
                self.path = path.rstrip("/") + ".html"
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8788
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
