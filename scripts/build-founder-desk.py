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

# ---- Founder home: chooser split into "Pillars" and "Foundation office" (FD.Home) ----
CHOOSER_PATCHES = [
    ('  salesCount\n}) => {\n  const cards = [{\n    id: "scholarships",',
     '  salesCount,\n  bare,\n  only\n}) => {\n  const cards = [{\n    id: "scholarships",'),
    ('  return /*#__PURE__*/React.createElement("div", {\n    style: {\n      maxWidth: 1000,\n      margin: "0 auto",\n      padding: "80px clamp(20px, 4vw, 56px) 100px"\n    }\n  }, /*#__PURE__*/React.createElement("div", {\n    style: {\n      fontFamily: "\'JetBrains Mono\', monospace",',
     '  return /*#__PURE__*/React.createElement("div", {\n    style: bare ? {} : {\n      maxWidth: 1000,\n      margin: "0 auto",\n      padding: "80px clamp(20px, 4vw, 56px) 100px"\n    }\n  }, !bare && /*#__PURE__*/React.createElement("div", {\n    style: {\n      fontFamily: "\'JetBrains Mono\', monospace",'),
    ('}, "Founder Console"), /*#__PURE__*/React.createElement("h1", {',
     '}, "Founder Console"), !bare && /*#__PURE__*/React.createElement("h1", {'),
    ('}, "Which pillar are you managing?"), /*#__PURE__*/React.createElement("p", {',
     '}, "Which pillar are you managing?"), !bare && /*#__PURE__*/React.createElement("p", {'),
    ('      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",\n      gap: 20\n    }\n  }, cards.map(c => /*#__PURE__*/React.createElement("button", {',
     '      gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",\n      gap: 20\n    }\n  }, (only ? cards.filter(c => only.indexOf(c.id) >= 0) : cards).map(c => /*#__PURE__*/React.createElement("button", {'),
    ('}), /*#__PURE__*/React.createElement(PillarChooser, {\n    onPick: id => {',
     '}), /*#__PURE__*/React.createElement(typeof FD === "function" && FD.Home ? FD.Home : PillarChooser, {\n    Chooser: PillarChooser,\n    onPick: id => {'),
    ('if (!authed) return /*#__PURE__*/React.createElement(FounderLogin, {',
     'if (!authed) return /*#__PURE__*/React.createElement(typeof FD === "function" && FD.Login ? FD.Login : FounderLogin, {'),
    ('c.id !== "backup" && c.id !== "site" ? ',
     'c.id !== "backup" && c.id !== "site" && c.id !== "treasury" ? '),
]
TREASURY_ANCHOR = "  }, {\n    id: \"site\",\n"
TREASURY_TILE = ("  }, {\n    id: \"treasury\",\n    label: \"Treasury\",\n    sub: \"Money in & out\",\n    accent: \"#7FC9A8\",\n"
    "    d: \"Every gift received and every payment made \\u2014 verify donations, pay tuition bills, and keep a ledger your accountant can read.\",\n"
    "    meta: (() => { const n = store && store.listDonations ? store.listDonations().filter(d => !(store.isInternalDonation && store.isInternalDonation(d)) && !d.verified).length : 0; return n ? n + \" to verify\" : \"all gifts verified\"; })(),\n"
    "    icon: /*#__PURE__*/React.createElement(\"svg\", { viewBox: \"0 0 64 64\", width: \"52\", height: \"52\", fill: \"none\", stroke: \"currentColor\", strokeWidth: \"1.1\" }, "
    "/*#__PURE__*/React.createElement(\"path\", { d: \"M8 24 L32 10 L56 24\" }), "
    "/*#__PURE__*/React.createElement(\"path\", { d: \"M14 26 V46 M24 26 V46 M40 26 V46 M50 26 V46\" }), "
    "/*#__PURE__*/React.createElement(\"path\", { d: \"M8 50 H56 M6 55 H58\" }))\n")

# ---- PortalNav (chooser header): class hooks so it fits on a phone ----
PN_PATCHES = [
    ('}) => /*#__PURE__*/React.createElement("header", {\n  style: {', '}) => /*#__PURE__*/React.createElement("header", {\n  className: "pn",\n  style: {'),
    ('/*#__PURE__*/React.createElement("button", {\n  onClick: onExit,\n  style: {', '/*#__PURE__*/React.createElement("button", {\n  onClick: onExit,\n  className: "pn-exit",\n  style: {'),
    ('/*#__PURE__*/React.createElement("div", {\n  style: {\n    fontFamily: "\'JetBrains Mono\', monospace",\n    fontSize: 9,', '/*#__PURE__*/React.createElement("div", {\n  className: "pn-sub",\n  style: {\n    fontFamily: "\'JetBrains Mono\', monospace",\n    fontSize: 9,'),
    ('/*#__PURE__*/React.createElement("span", {\n  style: {\n    fontFamily: "\'JetBrains Mono\', monospace",\n    fontSize: 11,\n    color: "rgba(232,228,220,0.5)",', '/*#__PURE__*/React.createElement("span", {\n  className: "pn-email",\n  style: {\n    fontFamily: "\'JetBrains Mono\', monospace",\n    fontSize: 11,\n    color: "rgba(232,228,220,0.5)",'),
    ('/*#__PURE__*/React.createElement("div", {\n  style: {\n    width: 32,\n    height: 32,\n    borderRadius: "50%",', '/*#__PURE__*/React.createElement("div", {\n  className: "pn-avatar",\n  style: {\n    width: 32,\n    height: 32,\n    borderRadius: "50%",'),
]


def patch_portal_nav(s):
    a = s.index("const PortalNav = (")
    b = s.index("\nconst ", a + 10)
    seg = s[a:b]
    for x, y in PN_PATCHES:
        if y in seg:
            continue
        assert seg.count(x) == 1, "PortalNav patch anchor not found: " + x[:50]
        seg = seg.replace(x, y)
    return s[:a] + seg + s[b:]


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
    if "id: \"treasury\"," not in s:
        assert s.count(TREASURY_ANCHOR) == 1, "treasury tile anchor not found"
        s = s.replace(TREASURY_ANCHOR, TREASURY_TILE + TREASURY_ANCHOR)
    s = patch_portal_nav(s)
    for a, b in CHOOSER_PATCHES:
        if b in s:
            continue
        assert s.count(a) == 1, "chooser patch anchor not found: " + a[:60]
        s = s.replace(a, b)
    p.write_text(s, encoding="utf-8")


if __name__ == "__main__":
    inject(compile_jsx(sys.argv[1]))
    print("injected founder desk")
    if "--bundle" in sys.argv:
        spec = importlib.util.spec_from_file_location("bsh", ROOT / "scripts" / "build-scholar-home.py")
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        m.refresh_bundle()
