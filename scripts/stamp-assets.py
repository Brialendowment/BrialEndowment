"""Refresh the version stamp on every script, stylesheet and font the pages load.

Pages load their files as /store.js?v=1a2b3c4d. The stamp is a hash of the file,
so a browser (and the service worker) keeps a file until it really changes and
fetches the new one the moment it does. After editing any file in site/, run:

    python scripts/stamp-assets.py          # update the stamps in site/*.html
    python scripts/stamp-assets.py --check  # only report pages that are out of date

Without this step a visitor could keep running the old copy of an edited file.
"""
import glob, hashlib, os, re, sys

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
REF = re.compile(r'(/[A-Za-z0-9_./-]+\.(?:js|css|woff2))\?v=[0-9a-f]{8}')
_cache = {}


def stamp(url):
    if url not in _cache:
        path = os.path.join(SITE, url.lstrip("/").replace("/", os.sep))
        if not os.path.isfile(path):
            raise SystemExit("missing file for " + url)
        with open(path, "rb") as fh:
            data = fh.read()
        if not url.endswith(".woff2"):
            data = data.replace(b"\r\n", b"\n")  # same stamp whatever the checkout's line endings
        _cache[url] = hashlib.sha256(data).hexdigest()[:8]
    return _cache[url]


def main():
    check = "--check" in sys.argv
    stale = 0
    for path in sorted(glob.glob(os.path.join(SITE, "*.html"))):
        with open(path, encoding="utf-8", newline="") as fh:
            txt = fh.read()
        new = REF.sub(lambda m: m.group(1) + "?v=" + stamp(m.group(1)), txt)
        if new != txt:
            stale += 1
            print(("OUT OF DATE " if check else "updated ") + os.path.basename(path))
            if not check:
                with open(path, "w", encoding="utf-8", newline="") as fh:
                    fh.write(new)
    print(("%d page(s) %s" % (stale, "out of date" if check else "updated")) if stale else "all pages up to date")
    return 1 if (check and stale) else 0


if __name__ == "__main__":
    sys.exit(main())
