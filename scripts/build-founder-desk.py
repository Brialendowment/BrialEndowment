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


# Pillar choice is a history entry, so Back returns from a pillar to the chooser.
PILLAR_STATE = "  const [pillar, setPillar] = useState(null); // null = chooser\n"
PILLAR_STATE_NEW = "  const [pillar, setPillar] = window.useBrialNav ? window.useBrialNav(\"fd-pillar\", null) : useState(null); // null = chooser\n"
# Site settings tile on the chooser (before Vault Backup)
TILE_ANCHOR = "  }, {\n    id: \"backup\",\n"
TILE = ("  }, {\n    id: \"site\",\n    label: \"Site Settings\",\n    sub: \"Contact & social\",\n    accent: \"#9FB4D9\",\n"
        "    d: \"The contact details and social links shown at the bottom of the public site \\u2014 each one can be shown or hidden.\",\n"
        "    meta: (n => n + \" item\" + (n === 1 ? \"\" : \"s\") + \" shown\")(store && store.publicContacts ? store.publicContacts().length : 0),\n"
        "    icon: /*#__PURE__*/React.createElement(\"svg\", { viewBox: \"0 0 64 64\", width: \"52\", height: \"52\", fill: \"none\", stroke: \"currentColor\", strokeWidth: \"1.1\" }, "
        "/*#__PURE__*/React.createElement(\"rect\", { x: \"10\", y: \"16\", width: \"44\", height: \"32\", rx: \"3\" }), "
        "/*#__PURE__*/React.createElement(\"path\", { d: \"M11 18 L32 34 L53 18\" }), "
        "/*#__PURE__*/React.createElement(\"circle\", { cx: \"50\", cy: \"48\", r: \"7\", fill: \"#0A1628\" }), "
        "/*#__PURE__*/React.createElement(\"path\", { d: \"M47 48 h6 M50 45 v6\" }))\n")


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
    if PILLAR_STATE_NEW not in s:
        assert s.count(PILLAR_STATE) == 1, "pillar state not found"
        s = s.replace(PILLAR_STATE, PILLAR_STATE_NEW)
    if "id: \"site\"," not in s:
        assert s.count(TILE_ANCHOR) == 1, "chooser tile anchor not found"
        s = s.replace(TILE_ANCHOR, TILE + TILE_ANCHOR)
    TOGGLE = 'store && store.getPillarActive && c.id !== "backup" ? '
    if TOGGLE in s:  # Site Settings is not a pillar: no public on/off switch on its tile
        s = s.replace(TOGGLE, 'store && store.getPillarActive && c.id !== "backup" && c.id !== "site" ? ')
    p.write_text(s, encoding="utf-8")


if __name__ == "__main__":
    inject(compile_jsx(sys.argv[1]))
    print("injected founder desk")
    if "--bundle" in sys.argv:
        spec = importlib.util.spec_from_file_location("bsh", ROOT / "scripts" / "build-scholar-home.py")
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        m.refresh_bundle()
