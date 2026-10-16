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
    # Stylesheets are inlined in the page template (a JSON string): swap the old text for the new.
    tm = re.search(r'(<script type="__bundler/template">)(.*?)(</script>)', h, re.S)
    tpl = json.loads(tm.group(2))
    css_hits = []
    for f in SITE.glob("*.css"):
        try:
            old = subprocess.check_output(["git", "show", ref + ":site/" + f.name], cwd=ROOT, stderr=subprocess.DEVNULL).decode("utf-8")
        except subprocess.CalledProcessError:
            continue
        new = f.read_text(encoding="utf-8")
        if old != new and tpl.count(old) == 1:
            tpl = tpl.replace(old, new)
            css_hits.append(f.name)
    if css_hits:
        enc = json.dumps(tpl, ensure_ascii=False).replace("</", "<\\u002F")
        h = h[:tm.start(2)] + enc + h[tm.end(2):]
    idx.write_text(h, encoding="utf-8")
    missing = sorted(set(n for n, _ in changed.values()) - set(hits))
    print("bundle refreshed:", sorted(hits + css_hits), "| not in bundle:", missing)
    build_seo_pages()


if __name__ == "__main__":
    inject(compile_jsx(sys.argv[1]))
    print("injected scholar home")
    if "--bundle" in sys.argv:
        refresh_bundle()


# ---- Clean addresses with their own preview (title, description, image) ----
# Each public view is also served as site/<slug>.html (Cloudflare serves it at /<slug>):
# the same app, with a head that Google and link previews can read.
SEO_PAGES = {
    "scholars": ("Brial Scholars", "Meet the scholars of the Brial Endowment: students whose tuition is paid directly to their institution, semester by semester, and recorded on a public ledger.", None),
    "donate": ("Give", "Give to a perpetual endowment. Every gift is recorded on the open ledger and serves scholarships, clean water, houses of worship, olive groves and more.", None),
    "ebooks": ("The Library", "Scholarship guides in English, Bahasa Indonesia and French. Every copy sold returns to the endowment.", None),
    "foodland": ("Food & Land", "Trees for Life: olive trees planted on Palestinian family land with Zaytoun, a harvest that renews itself season after season.", None),
    "worship": ("Houses of Worship", "Mosques raised as waqf with local builders: places that gather a community and endure long after their builders.", None),
    "water": ("Clean Water", "Wells and water systems built with local partners, so clean water is close to home for the villages that need it.", None),
    "transport": ("Transportation", "The enterprise pillar. go2rent cars on the road across Türkiye and Northern Cyprus, and a share of the founder's returns given to the endowment.", "https://brialendowment.org/partners/go2rent/og.jpg"),
    "hospitals": ("Hospitals", "Care for those who cannot afford to be sick: clinics funded from the endowment, free at the point of need. A pillar in preparation.", None),
    "schools": ("Schools", "Classrooms raised where distance decides who learns, built once and teaching for generations. A pillar in preparation.", None),
    "livestock": ("Livestock & Enterprise", "Herds and small enterprise placed as productive capital in family hands. A pillar in preparation.", None),
    "infra": ("Sustainable Infrastructure", "Bridges, power and public works: the quiet foundations that let a community stand on its own. A pillar in preparation.", None),
    "proof": ("The Open Ledger", "Every gift received and every grant made by the Brial Endowment, dated, named and totalled in public.", None),
}


def build_seo_pages():
    import html as _h
    src = (SITE / "index.html").read_text(encoding="utf-8")
    m = re.search(r'(<script type="__bundler/template">)(.*?)(</script>)', src, re.S)
    base = json.loads(m.group(2))

    def setattr_(t, pattern, value):
        new, n = re.subn(pattern, lambda mm: mm.group(1) + _h.escape(value, quote=True) + mm.group(2), t, count=1)
        assert n == 1, "SEO tag not found: " + pattern
        return new

    for slug, (name, desc, img) in SEO_PAGES.items():
        title = name + " | The Brial Endowment"
        url = "https://brialendowment.org/" + slug
        t = re.sub(r"<title>.*?</title>", "<title>" + _h.escape(title) + "</title>", base, count=1)
        t = setattr_(t, r'(<meta name="description" content=")[^"]*(")', desc)
        t = setattr_(t, r'(<link rel="canonical" href=")[^"]*(")', url)
        t = setattr_(t, r'(<meta property="og:title" content=")[^"]*(")', title)
        t = setattr_(t, r'(<meta property="og:description" content=")[^"]*(")', desc)
        t = setattr_(t, r'(<meta property="og:url" content=")[^"]*(")', url)
        t = setattr_(t, r'(<meta property="og:image:alt" content=")[^"]*(")', title)
        t = setattr_(t, r'(<meta name="twitter:title" content=")[^"]*(")', title)
        t = setattr_(t, r'(<meta name="twitter:description" content=")[^"]*(")', desc)
        if img:
            t = setattr_(t, r'(<meta property="og:image" content=")[^"]*(")', img)
            t = setattr_(t, r'(<meta name="twitter:image" content=")[^"]*(")', img)
        enc = json.dumps(t, ensure_ascii=False).replace("</", "<\\u002F")
        out = src[:m.start(2)] + enc + src[m.end(2):]
        out = outer_head(out, t, title)
        (SITE / (slug + ".html")).write_text(out, encoding="utf-8")
    # the home page gets the same readable head
    (SITE / "index.html").write_text(outer_head(src, base, None), encoding="utf-8")
    print("seo pages:", ", ".join(SEO_PAGES))


def outer_head(page, tpl, title):
    """Copy the description, canonical, preview (Open Graph) and JSON-LD tags from the
    bundled template into the outer page head, where link previews and crawlers read them."""
    import html as _h
    a = tpl.index('<meta name="google-site-verification"')
    b = tpl.index("</script>", tpl.index("application/ld+json")) + len("</script>")
    keep = [ln for ln in tpl[a:b].split("\n")
            if ln.strip().startswith(("<meta ", '<link rel="canonical"', '<script type="application/ld+json"'))
            and "google-site-verification" not in ln]
    block = "<!--seo-->\n" + "\n".join(keep) + "\n<!--/seo-->"
    page = re.sub(r"<!--seo-->.*?<!--/seo-->\n?", "", page, count=1, flags=re.S)
    head_end = page.index("</title>") + len("</title>")
    page = page[:head_end] + "\n" + block + page[head_end:]
    if title:
        page = re.sub(r"<title>.*?</title>", "<title>" + _h.escape(title) + "</title>", page, count=1)
    return page
