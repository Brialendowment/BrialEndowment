"""Re-embed the standalone scripts into every bundled page.

Every public page in site/*.html carries gzip copies of the site's scripts in a
`__bundler/manifest` block, and visitors run those copies. After editing any
site/*.js file, run:

    python scripts/sync-bundles.py          # update the pages
    python scripts/sync-bundles.py --check  # only report what is out of date

A page is rewritten only when one of its embedded copies differs from the file.
"""
import base64, glob, gzip, json, os, re, sys

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
# manifest id -> standalone file (ids are stable across all pages)
MAP = {
    "ad153229-": "supabase-client.js", "7bcca297-": "file-store.js",
    "7c176083-": "student-profile.compiled.js", "12009cc2-": "partner-logos.js",
    "13e174d6-": "ebooks.compiled.js", "31245acb-": "scholars-showcase.compiled.js",
    "9203f384-": "proof.compiled.js", "91d7e2b0-": "foodland.compiled.js",
    "58ae4ec1-": "brial-lang.js", "66139cb3-": "pillar-pages.compiled.js",
    "e3874ea2-": "donate.compiled.js", "23847555-": "store.js",
    "b4c17988-": "motion-effects.js", "7072f20f-": "student.compiled.js",
    "2e0dcd5f-": "app.compiled.js", "7f5e78c5-": "admin.compiled.js",
}
MANIFEST = re.compile(r'(<script type="__bundler/manifest">)(.*?)(</script>)', re.S)


def main():
    check = "--check" in sys.argv
    sources = {}
    for name in set(MAP.values()):
        with open(os.path.join(SITE, name), "rb") as fh:
            sources[name] = fh.read().replace(b"\r\n", b"\n")
    stale = 0
    for path in sorted(glob.glob(os.path.join(SITE, "*.html"))):
        with open(path, encoding="utf-8", newline="") as fh:
            txt = fh.read()
        m = MANIFEST.search(txt)
        if not m:
            continue
        man = json.loads(m.group(2))
        changed = []
        for key, entry in man.items():
            name = MAP.get(key[:9])
            if not name:
                continue
            raw = base64.b64decode(entry["data"])
            if entry.get("compressed"):
                raw = gzip.decompress(raw)
            if raw.replace(b"\r\n", b"\n") == sources[name]:
                continue
            new = sources[name]
            if entry.get("compressed"):
                new = gzip.compress(new, 9, mtime=0)
            data = base64.b64encode(new).decode()
            if txt.count(entry["data"]) != 1:
                raise SystemExit("ambiguous entry %s in %s" % (key, path))
            txt = txt.replace(entry["data"], data)
            changed.append(name)
        if changed:
            stale += 1
            print(("OUT OF DATE " if check else "updated ") + os.path.basename(path) + ": " + ", ".join(sorted(changed)))
            if not check:
                with open(path, "w", encoding="utf-8", newline="") as fh:
                    fh.write(txt)
    print("%d page(s) %s" % (stale, "out of date" if check else "updated") if stale else "all pages in sync")
    return 1 if (check and stale) else 0


if __name__ == "__main__":
    sys.exit(main())
