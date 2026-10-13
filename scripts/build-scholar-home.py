#!/usr/bin/env python3
"""Compile src/scholar-home.jsx and inject it into site/student.compiled.js.

Usage:  python3 scripts/build-scholar-home.py /path/to/esbuild [--bundle]

  * The compiled block sits between the START/END markers inside the
    student.compiled.js IIFE (re-running replaces it).
  * PortalHome hands accepted scholars to it.
  * --bundle also refreshes the matching entries inside site/index.html
    (the self-unpacking bundle Netlify serves) for every site/*.js file
    whose content changed since git HEAD.
"""
import base64, gzip, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
START = "// >>> SCHOLAR HOME (generated from src/scholar-home.jsx — edit that file, then run scripts/build-scholar-home.py)"
END = "// <<< SCHOLAR HOME"
HOOK = "  const status = applicant.status;\n  const greeting = applicant.name.split(\" \")[0];\n"
HOOK_NEW = ("  const status = applicant.status;\n"
            "  if (status === \"accepted\" && typeof SH === \"function\") return /*#__PURE__*/React.createElement(SH, {\n"
            "    applicant: applicant,\n    store: store,\n    onLogout: onLogout\n  });\n"
            "  const greeting = applicant.name.split(\" \")[0];\n")


def compile_jsx(esbuild):
    out = subprocess.check_output([
        esbuild, str(ROOT / "src" / "scholar-home.jsx"), "--loader:.jsx=jsx",
        "--jsx-factory=React.createElement", "--jsx-fragment=React.Fragment",
        "--target=es2018", "--charset=utf8"])
    return out.decode("utf-8")


def inject(code):
    p = SITE / "student.compiled.js"
    s = p.read_text(encoding="utf-8")
    block = START + "\n" + code.strip() + "\n" + END + "\n\n"
    if START in s:
        s = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n\n", lambda m: block, s, flags=re.S)
    else:
        anchor = "// ============================================================\n// PORTAL HOME"
        assert s.count(anchor) == 1, "PortalHome anchor not found"
        s = s.replace(anchor, block + anchor)
    if HOOK_NEW not in s:
        assert s.count(HOOK) == 1, "PortalHome hook not found"
        s = s.replace(HOOK, HOOK_NEW)
    p.write_text(s, encoding="utf-8")


def refresh_bundle(ref="HEAD"):
    """Refresh bundle entries for site/*.js files that differ from git `ref`."""
    idx = SITE / "index.html"
    h = idx.read_text(encoding="utf-8")
    m = re.search(r'(<script type="__bundler/manifest">)(.*?)(</script>)', h, re.S)
    man = json.loads(m.group(2))
    changed = {}
    for f in SITE.glob("*.js"):
        try:
            old = subprocess.check_output(["git", "show", ref + ":site/" + f.name], cwd=ROOT, stderr=subprocess.DEVNULL)
        except subprocess.CalledProcessError:
            continue
        new = f.read_bytes()
        if old != new:
            changed[old] = (f.name, new)
    hits = []
    for e in man.values():
        b = base64.b64decode(e["data"])
        comp = bool(e.get("compressed"))
        raw = gzip.decompress(b) if comp else b
        if raw in changed:
            name, new = changed[raw]
            e["data"] = base64.b64encode(gzip.compress(new) if comp else new).decode()
            hits.append(name)
    h = h[:m.start(2)] + json.dumps(man, separators=(",", ":")) + h[m.end(2):]
    idx.write_text(h, encoding="utf-8")
    missing = sorted(set(n for n, _ in changed.values()) - set(hits))
    print("bundle refreshed:", sorted(hits), "| not in bundle:", missing)


if __name__ == "__main__":
    inject(compile_jsx(sys.argv[1]))
    print("injected scholar home")
    if "--bundle" in sys.argv:
        refresh_bundle()
