#!/usr/bin/env python3
"""Compile src/scholar-home.jsx and inject it into site/student.compiled.js.

Usage:  python3 scripts/build-scholar-home.py /path/to/esbuild [--bundle]

  * The compiled block sits between the START/END markers inside the
    student.compiled.js IIFE (re-running replaces it).
  * PortalHome hands accepted scholars to it.
  * Afterwards the per-view pages (site/scholars.html, donate.html, ...) are
    regenerated from site/index.html and the ?v= asset stamps are refreshed
    (scripts/stamp-assets.py).
  * --bundle is accepted and ignored: the self-unpacking bundle no longer exists.
"""
import re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
START = "// >>> SCHOLAR HOME (generated from src/scholar-home.jsx — edit that file, then run scripts/build-scholar-home.py)"
END = "// <<< SCHOLAR HOME"
HOOK = "  const status = applicant.status;\n  const greeting = applicant.name.split(\" \")[0];\n"
HOOK_NEW = ("  const status = applicant.status;\n"
            "  if (status === \"accepted\" && typeof SH === \"function\") return /*#__PURE__*/React.createElement(SH, {\n"
            "    applicant: applicant,\n    store: store,\n    onLogout: onLogout,\n    onExit: onExit\n  });\n"
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


# ---- Clean addresses with their own preview (title, description, image) ----
# Each public view is also served as site/<slug>.html (Cloudflare serves it at /<slug>):
# the same app, with a head that Google and link previews can read.
SEO_PAGES = {
    "scholars": ("Brial Scholars", "Meet the scholars of the Brial Endowment: students whose tuition is paid directly to their institution, semester by semester, and recorded on a public ledger.", None),
    "donate": ("Give", "Give to a perpetual endowment. Every gift is recorded on the open ledger and serves scholarships, clean water, houses of worship, olive groves and more.", None),
    "ebooks": ("Library & Knowledge Center", "Scholarship guides in English, Bahasa Indonesia and French. Every copy sold returns to the endowment.", None),
    "foodland": ("Reforestation & Land", "Trees planted where the land needs them most, beginning with olive groves on Palestinian family land through Zaytoun's Trees for Life programme.", None),
    "foodclothing": ("Food & Clothing", "Staple food and clothing in good condition, shared with orphanages, families and people in need. Every kilogram and every garment counted in the open.", None),
    "worship": ("Houses of Worship", "Mosques raised as waqf with local builders: places that gather a community and endure long after their builders.", None),
    "water": ("Clean Water", "Wells and water systems built with local partners, so clean water is close to home for the villages that need it.", None),
    "transport": ("Transportation", "The enterprise pillar. go2rent cars on the road across Türkiye and Northern Cyprus, and a share of the founder's returns given to the endowment.", "https://brialendowment.org/partners/go2rent/og.jpg"),
    "venture": ("The Venture", "The pillar that trades: products made and sold under the endowment's name, with a share of the profit returned to support its programmes.", None),
    "hospitals": ("Hospitals", "Care for those who cannot afford to be sick: clinics funded from the endowment, free at the point of need. A pillar in preparation.", None),
    "schools": ("Schools", "Classrooms raised where distance decides who learns, built once and teaching for generations. A pillar in preparation.", None),
    "livestock": ("Livestock & Enterprise", "Herds and small enterprise placed as productive capital in family hands. A pillar in preparation.", None),
    "infra": ("Sustainable Infrastructure", "Bridges, power and public works: the quiet foundations that let a community stand on its own. A pillar in preparation.", None),
    "proof": ("The Open Ledger", "Every gift received and every grant made by the Brial Endowment, dated, named and totalled in public.", None),
}


SEO_TAGS = [
    # (regex up to the value, what it takes: "title" | "desc" | "url" | "img")
    (r'(<meta name="description" content=")[^"]*(")', "desc"),
    (r'(<link rel="canonical" href=")[^"]*(")', "url"),
    (r'(<meta property="og:title" content=")[^"]*(")', "title"),
    (r'(<meta property="og:description" content=")[^"]*(")', "desc"),
    (r'(<meta property="og:url" content=")[^"]*(")', "url"),
    (r'(<meta property="og:image:alt" content=")[^"]*(")', "title"),
    (r'(<meta name="twitter:title" content=")[^"]*(")', "title"),
    (r'(<meta name="twitter:description" content=")[^"]*(")', "desc"),
]
IMG_TAGS = [r'(<meta property="og:image" content=")[^"]*(")', r'(<meta name="twitter:image" content=")[^"]*(")']


def build_seo_pages():
    """Write site/<slug>.html for every SEO_PAGES entry: site/index.html with only the
    title, description, canonical and preview tags of the head replaced."""
    import html as _h
    src = (SITE / "index.html").read_text(encoding="utf-8", newline="")

    def sub(t, pattern, value):
        new, n = re.subn(pattern, lambda mm: mm.group(1) + _h.escape(value, quote=True) + mm.group(2), t, count=1)
        assert n == 1, "SEO tag not found in index.html: " + pattern
        return new

    for slug, (name, desc, img) in SEO_PAGES.items():
        title = name + " | The Brial Endowment"
        vals = {"title": title, "desc": desc, "url": "https://brialendowment.org/" + slug}
        t, n = re.subn(r"<title>.*?</title>", lambda mm: "<title>" + _h.escape(title) + "</title>", src, count=1)
        assert n == 1, "<title> not found in index.html"
        for pattern, key in SEO_TAGS:
            t = sub(t, pattern, vals[key])
        if img:
            for pattern in IMG_TAGS:
                t = sub(t, pattern, img)
        (SITE / (slug + ".html")).write_text(t, encoding="utf-8", newline="")
    print("seo pages:", ", ".join(SEO_PAGES))


def stamp_assets():
    subprocess.check_call([sys.executable, str(ROOT / "scripts" / "stamp-assets.py")])


def finish():
    """After injecting a compiled block: rebuild the per-view pages, then refresh the ?v= stamps."""
    build_seo_pages()
    stamp_assets()


if __name__ == "__main__":
    inject(compile_jsx(sys.argv[1]))
    print("injected scholar home")
    if "--bundle" in sys.argv:
        print("--bundle ignored: bundles no longer exist")
    finish()
