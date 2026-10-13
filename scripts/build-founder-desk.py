#!/usr/bin/env python3
"""Compile src/founder-desk.jsx and inject it into site/admin.compiled.js.

Usage:  python3 scripts/build-founder-desk.py /path/to/esbuild [--bundle]

  * The compiled block sits between the START/END markers just before the
    MAIN PORTAL section (re-running replaces it).
  * AdminPortalGated hands every pillar (after the chooser) to it.
  * --bundle refreshes site/index.html exactly like build-scholar-home.py.
"""
import importlib.util, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
START = "// >>> FOUNDER DESK (generated from src/founder-desk.jsx — edit that file, then run scripts/build-founder-desk.py)"
END = "// <<< FOUNDER DESK"
ANCHOR = "// ============================================================\n// MAIN PORTAL"
HOOK = "  const worshipCount = store.getPillarGrants().filter(g => g.pillar === \"Houses of Worship\").length;\n"
HOOK_NEW = HOOK + ("  if (pillar && typeof FD === \"function\") return /*#__PURE__*/React.createElement(FD, {\n"
                   "    pillar: pillar,\n    store: store,\n    onBack: () => setPillar(null),\n    onExit: onExit,\n"
                   "    founderEmail: founderEmail,\n    onLogout: async () => {\n      await store.clearFounderSession();\n    }\n  });\n")


def compile_jsx(esbuild):
    return subprocess.check_output([
        esbuild, str(ROOT / "src" / "founder-desk.jsx"), "--loader:.jsx=jsx",
        "--jsx-factory=React.createElement", "--jsx-fragment=React.Fragment",
        "--target=es2018", "--charset=utf8"]).decode("utf-8")


def inject(code):
    p = SITE / "admin.compiled.js"
    s = p.read_text(encoding="utf-8")
    block = START + "\n" + code.strip() + "\n" + END + "\n\n"
    if START in s:
        s = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n\n", lambda m: block, s, flags=re.S)
    else:
        assert s.count(ANCHOR) == 1, "MAIN PORTAL anchor not found"
        s = s.replace(ANCHOR, block + ANCHOR)
    if HOOK_NEW not in s:
        assert s.count(HOOK) == 1, "AdminPortalGated hook not found"
        s = s.replace(HOOK, HOOK_NEW)
    p.write_text(s, encoding="utf-8")


if __name__ == "__main__":
    inject(compile_jsx(sys.argv[1]))
    print("injected founder desk")
    if "--bundle" in sys.argv:
        spec = importlib.util.spec_from_file_location("bsh", ROOT / "scripts" / "build-scholar-home.py")
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        m.refresh_bundle()
