// ============================================================
// PILLAR PAGES — Houses of Worship & Clean Water public pages
// Same visual language as FoodLandPage. Content founder-managed:
//   Worship: BrialStore.getWorship() + getPillarUnits("Houses of Worship")
//   Water:   BrialStore.getWater()   + getPillarUnits("Clean Water")
// Partner CTA gated by getPillarLink(key) + getPillarLinkHidden(key).
// ============================================================
(function () {
  const h = React.createElement;
  const { useState, useEffect } = React;

  const GOLD = "#C9A961", NAVY = "#0A1628", CREAM = "#E8E4DC";
  const mono = "'JetBrains Mono', monospace";
  const serif = "'Cormorant Garamond', serif";
  const sans = "'Manrope', sans-serif";

  const Seal = ({ size = 30 }) => h("svg", { width: size, height: size, viewBox: "0 0 36 36" },
    h("g", { fill: "none", stroke: GOLD, strokeWidth: "1.2" },
      h("path", { d: "M18 3 L20.79 11.26 L28.61 7.39 L24.74 15.21 L33 18 L24.74 20.79 L28.61 28.61 L20.79 24.74 L18 33 L15.21 24.74 L7.39 28.61 L11.26 20.79 L3 18 L11.26 15.21 L7.39 7.39 L15.21 11.26 Z" }),
      h("circle", { cx: "18", cy: "18", r: "4", fill: GOLD, stroke: "none" })));

  const usePillar = (getContent, linkKey, pillarName) => {
    const read = () => ({
      content: window.BrialStore && window.BrialStore[getContent] ? window.BrialStore[getContent]() : null,
      link: window.BrialStore && window.BrialStore.getPillarLink ? window.BrialStore.getPillarLink(linkKey) : "",
      hidden: window.BrialStore && window.BrialStore.getPillarLinkHidden ? window.BrialStore.getPillarLinkHidden(linkKey) : false,
      units: window.BrialStore && window.BrialStore.getPillarUnits ? window.BrialStore.getPillarUnits(pillarName) : 0
    });
    const [st, setSt] = useState(read);
    useEffect(() => {
      const f = () => setSt(read());
      window.addEventListener("brial:change", f);
      window.addEventListener("brial:ready", f);
      return () => { window.removeEventListener("brial:change", f); window.removeEventListener("brial:ready", f); };
    }, []);
    return st;
  };

  const fmtDate = s => {
    if (!s) return "";
    const d = new Date(String(s).length === 7 ? s + "-01" : s);
    if (isNaN(d)) return String(s).toUpperCase();
    const opts = String(s).length === 7 ? { month: "long", year: "numeric" } : { day: "2-digit", month: "long", year: "numeric" };
    return d.toLocaleDateString("en-GB", opts).toUpperCase();
  };

  // Shared page skeleton — foodland's structure, personalized per pillar
  // Premium programme journal — shared by all pillar pages (window.BrialStories)
  const ShareBtn = ({ url }) => {
    const [done, setDone] = useState(false);
    const go = () => {
      const fin = () => { setDone(true); setTimeout(() => setDone(false), 2400); };
      if (navigator.share) { navigator.share({ url }).then(fin).catch(() => {}); }
      else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(fin).catch(fin);
    };
    return h("button", { onClick: go, title: url, style: { background: "none", border: "none", padding: "10px 0", minHeight: 40, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: done ? "#86E5A7" : "rgba(232,228,220,0.72)" } }, done ? "Link copied \u2713" : "Share \u2197");
  };

  // Deep links: #/<pillar>/<n> scrolls to programme entry n and rings it gold
  const BrialDeepScroll = key => {
    const m = (location.hash || "").match(/^#\/([a-z]+)\/(\d+)/);
    if (!m || m[1] !== key) return;
    const id = "prog-" + key + "-" + m[2];
    let tries = 0;
    const go = () => {
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + (window.scrollY || 0) - 84;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        el.style.outline = "1px solid rgba(201,169,97,0.55)";
        el.style.outlineOffset = "6px";
        setTimeout(() => { el.style.outline = "none"; }, 3200);
      } else if (++tries < 12) setTimeout(go, 250);
    };
    setTimeout(go, 350);
  };
  window.BrialDeepScroll = BrialDeepScroll;

  const Stories = ({ articles, title, eyebrow, shareKey }) => {
    const list = (articles || []).filter(a => a && (a.title || a.body) && !a.draft);
    if (!list.length) return null;
    return h("div", { style: { background: "rgba(232,228,220,0.02)", borderTop: "1px solid rgba(201,169,97,0.14)", borderBottom: "1px solid rgba(201,169,97,0.14)", padding: "clamp(60px, 8vw, 100px) clamp(20px, 4vw, 56px)" } },
      h("div", { style: { maxWidth: 1160, margin: "0 auto" } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, flexWrap: "wrap" } },
          h("div", null,
            h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.24em", textTransform: "uppercase" } }, eyebrow || "§ Programme journal"),
            h("h2", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(30px, 4vw, 48px)", margin: "18px 0 0", color: CREAM } }, title)),
          h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: "rgba(232,228,220,0.66)", textTransform: "uppercase" } }, list.length + " programme" + (list.length === 1 ? "" : "s") + " · and growing")),
        h("div", { style: { display: "flex", flexDirection: "column", gap: "clamp(26px, 4vw, 40px)", marginTop: 50 } },
          list.map((a, i) => {
            const img = a.photo && (a.photo.url || a.photo.path) ? (a.photo.url || (window.brialSupabase ? window.brialSupabase.publicUrl(a.photo.path) : "")) : null;
            const rev = i % 2 === 1;
            return h("article", { key: a.id || i, id: shareKey ? "prog-" + shareKey + "-" + (i + 1) : undefined, className: "b-story", style: { display: "grid", gridTemplateColumns: img ? (rev ? "minmax(0, 1.05fr) minmax(0, 0.95fr)" : "minmax(0, 0.95fr) minmax(0, 1.05fr)") : "1fr", background: "rgba(20,36,66,0.45)", border: "1px solid rgba(201,169,97,0.22)" } },
              img ? h("div", { className: "b-story-photo", style: { position: "relative", minHeight: 300, order: rev ? 2 : 0 } },
                h("img", { src: img, alt: a.title || "Programme photograph", loading: "lazy", style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" } })) : null,
              h("div", { style: { padding: "clamp(28px, 4vw, 46px)", display: "flex", flexDirection: "column", order: 1, minWidth: 0 } },
                h("div", { style: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" } },
                  h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.14em", color: GOLD } }, "No. " + String(i + 1).padStart(2, "0")),
                  h("span", { style: { width: 26, height: 1, background: "rgba(201,169,97,0.5)", display: "inline-block" } }),
                  h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: "rgba(232,228,220,0.66)" } }, fmtDate(a.date))),
                h("h3", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(26px, 3vw, 36px)", lineHeight: 1.12, margin: "16px 0 0", color: CREAM } }, a.title),
                a.partner ? h("div", { style: { display: "inline-flex", alignItems: "center", gap: 10, marginTop: 16, padding: "8px 14px", alignSelf: "flex-start", maxWidth: "100%", background: "rgba(232,228,220,0.05)", border: "1px solid rgba(201,169,97,0.28)" } },
                  h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.14em", color: "rgba(232,228,220,0.66)", textTransform: "uppercase" } }, "With"),
                  h("span", { style: { fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: "#F2EEE4" } }, a.partner)) : null,
                h("p", { style: { fontFamily: sans, fontSize: 14.5, fontWeight: 300, lineHeight: 1.8, color: "rgba(232,228,220,0.75)", margin: "16px 0 0", maxWidth: 560, textWrap: "pretty" } }, a.body),
                h("div", { style: { display: "flex", alignItems: "center", gap: 24, marginTop: "auto", paddingTop: 24, flexWrap: "wrap" } },
                  a.link ? h("a", { href: a.link, target: "_blank", rel: "noopener noreferrer", style: { display: "inline-flex", alignItems: "center", gap: 10, fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, textDecoration: "none" } }, "Programme updates \u2197") : null,
                  shareKey ? h(ShareBtn, { url: "https://brialendowment.org/#/" + shareKey + "/" + (i + 1) }) : null)));
          }))));
  };

  // Founder-chosen pillar name (Founder Portal → rename); "" when unchanged
  const renamed = key => {
    const S = window.BrialStore;
    if (!S || !S.getPillarName || !S.isRenamablePillar || !S.isRenamablePillar(key)) return "";
    const nm = S.getPillarName(key), def = (S.PILLAR_DEFAULT_NAMES || {})[key];
    return nm && nm !== def ? nm : "";
  };
  // Founder-chosen Indonesian word for a pillar; "" when unchanged
  const resubbed = key => {
    const S = window.BrialStore;
    if (!S || !S.getPillarSub || !S.PILLAR_DEFAULT_SUBS) return "";
    const v = S.getPillarSub(key);
    return v && v !== S.PILLAR_DEFAULT_SUBS[key] ? v : "";
  };
  const PillarPage = ({ onExit, onDonate, cfg: cfgIn }) => {
    const sb = resubbed(cfgIn.shareKey);
    const cfg0 = sb && typeof cfgIn.eyebrow === "string" ? { ...cfgIn, eyebrow: cfgIn.eyebrow.replace(/\u00b7 [^\u00b7]+$/, "\u00b7 " + sb) } : cfgIn;
    const nm = renamed(cfg0.shareKey), def = nm ? window.BrialStore.PILLAR_DEFAULT_NAMES[cfg0.shareKey] : "";
    const cfg = nm ? { ...cfg0, topTag: "PILLAR \u00b7 " + nm.toUpperCase(), title: cfg0.title === def ? nm : cfg0.title,
      partnerStrip: typeof cfg0.partnerStrip === "string" ? cfg0.partnerStrip.replace(def.toUpperCase(), nm.toUpperCase()) : cfg0.partnerStrip } : cfg0;
    useEffect(() => { window.scrollTo(0, 0); if (cfg.shareKey) BrialDeepScroll(cfg.shareKey); }, []);
    const articles = (cfg.articles || []).filter(a => a && (a.title || a.body));
    return h("div", { style: { minHeight: "100vh", background: NAVY, color: CREAM, fontFamily: sans, animation: "fadeIn 0.5s ease both" }, "data-screen-label": cfg.screenLabel },
      h("div", { style: { position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px clamp(20px, 4vw, 56px)", background: "rgba(10,22,40,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(201,169,97,0.15)" } },
        h("button", { onClick: onExit, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.25)", color: "rgba(232,228,220,0.8)", padding: "9px 16px", cursor: "pointer", fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", minHeight: 40, flexShrink: 0 }, "aria-label": "Return to the Endowment" }, "\u2190", h("span", { className: "b-hide-sm" }, " Return to the Endowment")),
        h("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
          h(Seal, { size: 26 }),
          h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.2em", color: "rgba(232,228,220,0.7)" } }, cfg.topTag))),

      h("div", { style: { padding: "clamp(60px, 9vw, 110px) clamp(20px, 4vw, 56px) clamp(50px, 7vw, 80px)", maxWidth: 1280, margin: "0 auto" } },
        h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.24em", textTransform: "uppercase" } }, cfg.eyebrow),
        h("h1", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(52px, 8vw, 108px)", lineHeight: 0.98, letterSpacing: "-0.02em", margin: "26px 0 0", maxWidth: 900 } }, cfg.title + "."),
        h("p", { style: { fontFamily: serif, fontStyle: "italic", fontSize: "clamp(20px, 2.4vw, 28px)", color: "rgba(232,228,220,0.75)", margin: "26px 0 0", maxWidth: 640, lineHeight: 1.45 } }, cfg.tagline),
        cfg.lockup ? h("div", { style: { display: "inline-flex", alignItems: "center", gap: 18, marginTop: 44, padding: "16px 22px", background: "rgba(232,228,220,0.06)", border: "1px solid rgba(201,169,97,0.3)", flexWrap: "wrap" } },
          h("span", { style: { fontFamily: serif, fontSize: 17, fontStyle: "italic", color: GOLD } }, "The Brial Endowment"),
          h("span", { style: { color: "rgba(232,228,220,0.66)", fontSize: 16 } }, "\u00d7"),
          cfg.lockup.logo ? h("img", { src: cfg.lockup.logo, alt: cfg.lockup.name, style: { height: 52, width: "auto", display: "block", borderRadius: 2, background: cfg.lockup.logoBg || "transparent", padding: cfg.lockup.logoBg ? 5 : 0 } }) : null,
          h("span", { style: { fontFamily: sans, fontSize: 12, fontWeight: 500, color: "rgba(232,228,220,0.85)", lineHeight: 1.5 } }, cfg.lockup.name, h("br", null), h("span", { style: { color: "rgba(232,228,220,0.66)", fontWeight: 300 } }, cfg.lockup.sub))) : null),

      h("div", { style: { background: CREAM, color: NAVY, padding: "clamp(56px, 8vw, 90px) clamp(20px, 4vw, 56px)" } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "clamp(30px, 5vw, 70px)", alignItems: "center" } },
          ...(cfg.stats || [{ label: cfg.statLabel, value: cfg.statValue, unit: cfg.statUnit }]).map((st, si) => {
            const v = String(st.value);
            const fs = v.length <= 3 ? "clamp(90px, 12vw, 150px)" : v.length <= 5 ? "clamp(72px, 9vw, 120px)" : "clamp(54px, 7vw, 96px)";
            return h("div", { key: "st" + si, style: { minWidth: 0 } },
              h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(10,22,40,0.72)" } }, st.label),
              h("div", { style: { fontFamily: serif, fontSize: fs, lineHeight: 0.9, marginTop: 10, color: NAVY, overflowWrap: "anywhere" } }, v),
              h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: "#6B5D32", marginTop: 12 } }, st.unit));
          }),
          h("div", null,
            h("div", { style: { width: 44, height: 1, background: "#8B7A4A", marginBottom: 22 } }),
            h("div", { style: { fontFamily: serif, fontSize: "clamp(22px, 2.6vw, 30px)", fontStyle: "italic", lineHeight: 1.4, color: "rgba(10,22,40,0.85)" } }, cfg.location),
            h("div", { style: { fontFamily: sans, fontSize: 13.5, fontWeight: 300, lineHeight: 1.7, color: "rgba(10,22,40,0.65)", marginTop: 18, maxWidth: 460 } }, cfg.locationNote)))),

      h("div", { style: { padding: "clamp(70px, 9vw, 110px) clamp(20px, 4vw, 56px)" } },
        h("div", { style: { maxWidth: 900, margin: "0 auto", textAlign: "center" } },
          h(Seal, { size: 34 }),
          h("blockquote", { style: { fontFamily: serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(24px, 3.2vw, 38px)", lineHeight: 1.5, color: CREAM, margin: "34px 0 0" } }, ...cfg.quote),
          h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,228,220,0.66)", marginTop: 30 } }, cfg.quoteAttr))),

      h("div", { style: { padding: "0 clamp(20px, 4vw, 56px) clamp(70px, 9vw, 100px)" } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto" } },
          h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.24em", textTransform: "uppercase" } }, "\u00a7 How the programme works"),
          h("p", { style: { fontFamily: sans, fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: "rgba(232,228,220,0.75)", maxWidth: 720, margin: "22px 0 0", textWrap: "pretty" } }, cfg.intro),
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 44 } },
            cfg.steps.map(f => h("div", { key: f.n, style: { border: "1px solid rgba(201,169,97,0.22)", background: "rgba(232,228,220,0.04)", padding: "26px 24px" } },
              h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.14em" } }, f.n),
              h("div", { style: { fontFamily: serif, fontSize: 23, marginTop: 12 } }, f.t),
              h("div", { style: { fontFamily: sans, fontSize: 13, fontWeight: 300, lineHeight: 1.7, color: "rgba(232,228,220,0.65)", marginTop: 10 } }, f.d)))))),

      h(Stories, { articles: articles, title: cfg.notesTitle, shareKey: cfg.shareKey }),

      h("div", { style: { padding: "clamp(70px, 10vw, 120px) clamp(20px, 4vw, 56px)", textAlign: "center" } },
        h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.24em", textTransform: "uppercase" } }, cfg.ctaEyebrow),
        h("h2", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(30px, 4.4vw, 52px)", margin: "20px 0 0", lineHeight: 1.1 } },
          cfg.ctaLine1, h("br", null), h("em", { style: { fontStyle: "italic" } }, cfg.ctaLine2)),
        h("div", { style: { display: "flex", justifyContent: "center", gap: 20, marginTop: 44, flexWrap: "wrap" } },
          cfg.showPartner ? h("button", { onClick: () => window.open(cfg.link, "_blank", "noopener,noreferrer"), style: { background: `linear-gradient(120deg, #EAD9A8, ${GOLD} 55%, #B08F4C)`, color: "#131A33", border: "none", padding: "17px 34px", cursor: "pointer", fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" } }, "Learn more about our partner \u2197") : null,
          onDonate ? h("button", { onClick: onDonate, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.3)", color: CREAM, padding: "17px 34px", cursor: "pointer", fontFamily: sans, fontSize: 12.5, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase" } }, "Make a bequest") : null),
        cfg.showPartner && cfg.partnerStrip ? h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", color: "rgba(232,228,220,0.66)", marginTop: 26 } }, cfg.partnerStrip) : null),

      h("div", { style: { borderTop: "1px solid rgba(201,169,97,0.2)", padding: "26px clamp(20px, 4vw, 56px)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" } },
        h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: "rgba(232,228,220,0.66)" } }, "\u00a9 MMXXVI \u00b7 THE BRIAL ENDOWMENT"),
        h("span", { style: { fontFamily: serif, fontStyle: "italic", fontSize: 14, color: "rgba(232,228,220,0.66)" } }, cfg.proverb)));
  };

  const WorshipPage = ({ onExit, onDonate }) => {
    const { content, link, hidden, units } = usePillar("getWorship", "worship", "Houses of Worship");
    if (!content) return null;
    const mosques = units > 0 ? units : (Number(content.mosques) || 0);
    return h(PillarPage, { onExit, onDonate, cfg: {
      screenLabel: "Houses of Worship · Programme",
      shareKey: "worship",
      topTag: "PILLAR \u00b7 HOUSES OF WORSHIP",
      eyebrow: "\u00a7 The Second Pillar \u00b7 Masjid",
      title: content.programme || "Houses of Worship",
      tagline: "Mosques raised as waqf, owned by no one, serving everyone, enduring beyond their builders.",
      lockup: { logo: (window.BRIAL_LOGOS || {}).minang, logoBg: "#F4F1E9", name: "Minang Bandung Foundation", sub: "builder \u00b7 amal jariyah \u00b7 Bandung" },
      statLabel: "Raised together",
      statValue: mosques,
      statUnit: "Mosques \u00b7 built as waqf",
      location: content.location || "Bandung \u00b7 West Java, Indonesia",
      locationNote: (content.partnerLine || "In partnership with Minang Bandung Foundation") + " every build documented from land to minaret, then opened for prayer in perpetuity.",
      quote: ["\u201cWhoever builds a mosque for Allah, ", h("em", { key: 1, style: { color: GOLD } }, "Allah will build for him a house like it in Paradise"), ".\u201d"],
      quoteAttr: "Hadith \u00b7 Sahih al-Bukhari 450 \u00b7 Sahih Muslim 533",
      intro: content.intro,
      steps: [
        { n: "01", t: "Land & niyyah", d: "A site is secured with the community it will serve: titled, permitted, and dedicated before the first stone." },
        { n: "02", t: "Raising the walls", d: "The partner foundation builds; each milestone is documented and reported back to the endowment." },
        { n: "03", t: "Opened as waqf", d: "The finished mosque is handed to its congregation, endowed in perpetuity, never bought or sold." }
      ],
      notesTitle: "Word from the site.",
      articles: content.articles,
      ctaEyebrow: "Walk the site",
      ctaLine1: "Meet the people",
      ctaLine2: "who build with us.",
      showPartner: !!link && !hidden,
      link,
      partnerStrip: "MINANG BANDUNG FOUNDATION \u00b7 AMAL JARIYAH \u00b7 PEMBANGUNAN MASJID",
      proverb: "They built so we may pray; we build so they may pray."
    }});
  };

  const WaterPage = ({ onExit, onDonate }) => {
    const { content, link, hidden, units } = usePillar("getWater", "water", "Clean Water");
    if (!content) return null;
    const wells = units > 0 ? units : (Number(content.trees) || Number(content.wells) || 0);
    return h(PillarPage, { onExit, onDonate, cfg: {
      screenLabel: "Clean Water · Programme",
      shareKey: "water",
      topTag: "PILLAR \u00b7 CLEAN WATER",
      eyebrow: "\u00a7 The Fifth Pillar \u00b7 Sumur",
      title: content.programme || "Clean Water",
      tagline: "Clean water, close to home: wells and springs that change a village for generations.",
      lockup: content.partnerLine ? { logo: null, name: content.partnerLine, sub: "water partner" } : null,
      statLabel: "Flowing today",
      statValue: wells,
      statUnit: "Wells \u00b7 in service",
      location: content.location || "Sites announced as each build begins.",
      locationNote: (content.partnerLine || "Built with local partners") + " every point surveyed with the village it serves, and maintained so the water keeps flowing.",
      quote: ["\u201cThe best charity is ", h("em", { key: 1, style: { color: GOLD } }, "giving water to drink"), ".\u201d"],
      quoteAttr: "Hadith \u00b7 Sunan Abi Dawud 1681 \u00b7 an-Nasa'i",
      intro: content.intro,
      steps: [
        { n: "01", t: "Survey", d: "The need is mapped with the village: groundwater, distance walked, and who the point will serve." },
        { n: "02", t: "Build", d: "Borehole, hand pump or spring protection, built with local partners, documented from first dig to first draw." },
        { n: "03", t: "Maintain", d: "Local stewards keep it flowing: spares, repairs and care, so the gift outlasts its givers." }
      ],
      notesTitle: "Word from the wells.",
      articles: content.articles,
      ctaEyebrow: "Follow the water",
      ctaLine1: "Meet the people",
      ctaLine2: "who bring it home.",
      showPartner: !!link && !hidden,
      link,
      partnerStrip: (content.partnerLine || "CLEAN WATER \u00b7 BUILT WITH LOCAL PARTNERS").toUpperCase(),
      proverb: "They dug so we may drink; we dig so they may drink."
    }});
  };

  // ---- Generic pillar pages (Hospitals, Schools, Livestock, Infrastructure) ----
  const GENERIC_PAGES = {
    hospitals: {
      pillarName: "Hospitals", topTag: "PILLAR \u00b7 HOSPITALS", eyebrow: "\u00a7 The Pillar of Healing \u00b7 Rumah Sakit",
      tagline: "Care for those who cannot afford to be sick: clinics funded from the corpus, free at the point of need.",
      statLabel: "Care today", statUnit: "Clinics & wards \u00b7 in service",
      locFallback: "Sites announced as each build begins.", locTail: " every clinic assessed with local health workers, built to last, and open free at the point of need.",
      quote: ["\u201cThere is no disease that Allah has sent down, except that ", h("em", { key: 1, style: { color: GOLD } }, "He has also sent down its cure"), ".\u201d"],
      quoteAttr: "Hadith \u00b7 Sahih al-Bukhari 5678",
      steps: [
        { n: "01", t: "Assess", d: "Mapped with local health workers, where illness costs families the most, before a single brick is laid." },
        { n: "02", t: "Build & equip", d: "Clinic and ward raised with the partner, documented from foundation to first patient." },
        { n: "03", t: "Heal freely", d: "Open to all, free at the point of need, funded by the corpus so care never depends on a bill." }
      ],
      notesTitle: "Word from the wards.", ctaEyebrow: "Walk the wards", ctaLine1: "Meet the people", ctaLine2: "who heal with us.",
      stripFallback: "HOSPITALS \u00b7 BUILT WITH LOCAL HEALTH PARTNERS",
      proverb: "They healed so we may stand; we build so others may heal."
    },
    schools: {
      pillarName: "Schools", topTag: "PILLAR \u00b7 SCHOOLS", eyebrow: "\u00a7 The Pillar of Knowledge \u00b7 Sekolah",
      tagline: "Classrooms raised where distance decides who learns, built once, teaching for generations.",
      statLabel: "In session today", statUnit: "Schools \u00b7 classrooms raised",
      locFallback: "Sites announced as each build begins.", locTail: " every school grounded where children walk farthest, raised and staffed to teach well.",
      quote: ["\u201cSeeking knowledge is ", h("em", { key: 1, style: { color: GOLD } }, "an obligation upon every Muslim"), ".\u201d"],
      quoteAttr: "Hadith \u00b7 Sunan Ibn Majah 224",
      steps: [
        { n: "01", t: "Ground", d: "A site is chosen where children walk farthest, secured with the village the school will serve." },
        { n: "02", t: "Raise & staff", d: "Classrooms built and teachers placed with local partners, documented from first stone to first lesson." },
        { n: "03", t: "Teach forever", d: "Held as an endowed school: fees never decide who sits in its classrooms." }
      ],
      notesTitle: "Word from the classrooms.", ctaEyebrow: "Visit the classrooms", ctaLine1: "Meet the children", ctaLine2: "who learn with us.",
      stripFallback: "SCHOOLS \u00b7 BUILT WITH LOCAL PARTNERS",
      proverb: "They taught so we may read; we build so they may learn."
    },
    livestock: {
      pillarName: "Livestock & Enterprise", topTag: "PILLAR \u00b7 LIVESTOCK & ENTERPRISE", eyebrow: "\u00a7 The Pillar of Enterprise \u00b7 Ternak",
      tagline: "Productive capital in family hands: herds and enterprise that feed, earn, and fund the gift again.",
      statLabel: "Working today", statUnit: "Herds & ventures \u00b7 productive",
      locFallback: "Placements announced as each begins.", locTail: " every placement chosen with the family who will tend it, and documented season by season.",
      quote: ["\u201cIt is better for one of you to take a rope and ", h("em", { key: 1, style: { color: GOLD } }, "carry firewood on his back"), " than to beg from people.\u201d"],
      quoteAttr: "Hadith \u00b7 Sahih al-Bukhari 1471",
      steps: [
        { n: "01", t: "Place", d: "Herds, tools or stock placed with a family as productive capital, chosen with those who will tend it." },
        { n: "02", t: "Tend", d: "The family raises and works the asset, supported and documented through the hard seasons." },
        { n: "03", t: "Multiply", d: "Offspring and profits stay with the family: the gift renews itself and funds the next placement." }
      ],
      notesTitle: "Word from the paddocks.", ctaEyebrow: "Meet the herds", ctaLine1: "Meet the families", ctaLine2: "who tend the gift.",
      stripFallback: "LIVESTOCK & ENTERPRISE \u00b7 PRODUCTIVE CAPITAL, FAMILY HANDS",
      proverb: "They kept so we may eat; we place so they may keep."
    },
    infra: {
      pillarName: "Sustainable Infrastructure", topTag: "PILLAR \u00b7 INFRASTRUCTURE", eyebrow: "\u00a7 The Pillar of Foundations \u00b7 Prasarana",
      tagline: "Bridges, power and public works, the quiet foundations that let a community stand on its own.",
      statLabel: "Standing today", statUnit: "Public works \u00b7 in service",
      locFallback: "Works announced as each survey begins.", locTail: " every work surveyed with the community that will use it, built to endure.",
      quote: ["\u201cAmong what reaches a believer after death: ", h("em", { key: 1, style: { color: GOLD } }, "a canal he dug, a well he sank"), ", and a mosque he built.\u201d"],
      quoteAttr: "Hadith \u00b7 Sunan Ibn Majah 242",
      steps: [
        { n: "01", t: "Survey", d: "Every work is mapped with the community that will use it, need first, monument never." },
        { n: "02", t: "Build", d: "Bridges, water-ways and power raised with local partners, documented from first survey to first crossing." },
        { n: "03", t: "Endure", d: "Maintained by local stewards, built once, serving for generations." }
      ],
      notesTitle: "Word from the works.", ctaEyebrow: "Walk the works", ctaLine1: "Meet the people", ctaLine2: "who build to endure.",
      stripFallback: "SUSTAINABLE INFRASTRUCTURE \u00b7 BUILT WITH LOCAL PARTNERS",
      proverb: "They laid so we may cross; we lay so they may rise."
    }
  };
  const makeGenericPage = key => {
    const g = GENERIC_PAGES[key];
    return ({ onExit, onDonate }) => {
      const read = () => ({
        content: window.BrialStore && window.BrialStore.getPillarContent ? window.BrialStore.getPillarContent(key) : null,
        link: window.BrialStore && window.BrialStore.getPillarLink ? window.BrialStore.getPillarLink(key) : "",
        hidden: window.BrialStore && window.BrialStore.getPillarLinkHidden ? window.BrialStore.getPillarLinkHidden(key) : false,
        units: window.BrialStore && window.BrialStore.getPillarUnits ? window.BrialStore.getPillarUnits(g.pillarName) : 0
      });
      const [st, setSt] = useState(read);
      useEffect(() => {
        const f = () => setSt(read());
        window.addEventListener("brial:change", f);
        window.addEventListener("brial:ready", f);
        return () => { window.removeEventListener("brial:change", f); window.removeEventListener("brial:ready", f); };
      }, []);
      const c = st.content;
      if (!c) return null;
      const units = st.units > 0 ? st.units : Number(c.units) || 0;
      return h(PillarPage, { onExit, onDonate, cfg: {
        screenLabel: g.pillarName + " Programme",
        shareKey: key, topTag: g.topTag, eyebrow: g.eyebrow,
        title: c.programme || g.pillarName, tagline: g.tagline,
        lockup: c.partnerLine ? { logo: null, name: c.partnerLine, sub: "programme partner" } : null,
        statLabel: g.statLabel, statValue: units, statUnit: g.statUnit,
        location: c.location || g.locFallback,
        locationNote: (c.partnerLine || "Built with local partners") + g.locTail,
        quote: g.quote, quoteAttr: g.quoteAttr, intro: c.intro, steps: g.steps,
        notesTitle: g.notesTitle, articles: c.articles,
        ctaEyebrow: g.ctaEyebrow, ctaLine1: g.ctaLine1, ctaLine2: g.ctaLine2,
        showPartner: !!st.link && !st.hidden, link: st.link,
        partnerStrip: (c.partnerLine || g.stripFallback).toUpperCase(),
        proverb: g.proverb
      }});
    };
  };
  const HospitalsPage = makeGenericPage("hospitals");
  const SchoolsPage = makeGenericPage("schools");
  const LivestockPage = makeGenericPage("livestock");
  const InfraPage = makeGenericPage("infra");

  // ---- Food: staple food shared with people in need ----
  // Counts: BrialStore.getFoodClothingCounts() (kilograms of food per year: rough totals plus
  // distributions recorded one by one). Days of giving: pillar grants labelled "Food & Clothing"
  // (the pillar's data label, kept so old records stay linked). Recipients are never named or
  // photographed on this page.
  const fmtNum = n => (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 1 });
  const FoodClothingPage = ({ onExit, onDonate }) => {
    const read = () => {
      const S = window.BrialStore;
      return {
        c: S && S.getPillarContent ? S.getPillarContent("foodclothing") : null,
        n: S && S.getFoodClothingCounts ? S.getFoodClothingCounts() : { kg: 0, byYear: {}, years: [], since: "" },
        days: S && S.getPillarGrants ? S.getPillarGrants().filter(g => g && g.pillar === "Food & Clothing" && !g.archived && (Number(g.kg) > 0 || Number(g.amount) > 0)) : [],
        link: S && S.getPillarLink ? S.getPillarLink("foodclothing") : "",
        hidden: S && S.getPillarLinkHidden ? S.getPillarLinkHidden("foodclothing") : false
      };
    };
    const [st, setSt] = useState(read);
    useEffect(() => {
      const f = () => setSt(read());
      window.addEventListener("brial:change", f);
      window.addEventListener("brial:ready", f);
      return () => { window.removeEventListener("brial:change", f); window.removeEventListener("brial:ready", f); };
    }, []);
    useEffect(() => { window.scrollTo(0, 0); BrialDeepScroll("foodclothing"); }, []);
    const c = st.c;
    if (!c) return null;
    const S = window.BrialStore;
    const name = c.programme && c.programme !== "Food & Clothing" ? c.programme : (renamed("foodclothing") || "Food");
    const tag = (renamed("foodclothing") || "Food").toUpperCase();
    const sub = (S && S.getPillarSub ? S.getPillarSub("foodclothing") : "") || "Pangan";
    const kg = Number(st.n.kg) || 0;
    const since = st.n.since || String(new Date().getFullYear());
    const years = (st.n.years || []).slice().sort();
    const maxKg = Math.max(1, ...years.map(y => Number((st.n.byYear[y] || {}).kg) || 0));
    const days = st.days.slice().sort((x, y) => new Date(y.date || 0) - new Date(x.date || 0));
    const link = !st.hidden && /^https?:\/\//i.test(String(st.link || "").trim()) ? String(st.link).trim() : "";
    const pad = "clamp(20px, 4vw, 56px)";
    const IC = window.BrialPillarIcons;
    const ic = (id, size) => (IC ? IC.render(id, { size: size || 40, strokeWidth: 1.6 }) : null);
    const eyebrow = t => h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.24em", textTransform: "uppercase" } }, t);
    const h2 = t => h("h2", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(32px, 4.4vw, 54px)", lineHeight: 1.08, margin: "18px 0 0", color: CREAM } }, t);
    const goLedger = () => { try { history.pushState({ brialView: "proof" }, "", "/proof"); window.dispatchEvent(new PopStateEvent("popstate", { state: { brialView: "proof" } })); } catch (e) { location.href = "/proof"; } };
    const staples = [
      { i: "sack", t: "Rice", d: "The heart of most tables we sit at. Bought in 5 and 10 kg sacks so a family can cook for days." },
      { i: "wheat", t: "Flour and bread", d: "For homes that bake, and bread bought fresh where an oven is out of reach." },
      { i: "pot", t: "Cooking oil and staples", d: "Oil, sugar, eggs and the small things that turn rice into a meal." },
      { i: "dates", t: "Dates at Ramadan", d: "To break the fast at sunset, shared before and through the holy month." }
    ];
    const vows = [
      { n: "01", t: "Dignity first", d: "No names, no faces, no queues for the camera. Food is handed over quietly, as one neighbour to another." },
      { n: "02", t: "Food that keeps", d: "Staples that last and feed a whole household, chosen with the people who cook them." },
      { n: "03", t: "Counted in the open", d: "Every kilogram is weighed and added to this page; every rupiah spent is on the open ledger." }
    ];
    return h("div", { style: { minHeight: "100vh", background: NAVY, color: CREAM, fontFamily: sans, animation: "fadeIn 0.5s ease both", overflowX: "hidden" }, "data-screen-label": "Food Programme" },
      h("style", null, ".b-fd-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:clamp(30px,5vw,70px);align-items:end}@media (max-width:860px){.b-fd-hero{grid-template-columns:1fr}}.b-fd-bar{transform-origin:left;animation:bFdGrow 1.1s cubic-bezier(.2,.7,.2,1) both}@keyframes bFdGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}@media (prefers-reduced-motion:reduce){.b-fd-bar{animation:none}}"),
      h("div", { style: { position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px " + pad, background: "rgba(10,22,40,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(201,169,97,0.18)" } },
        h("button", { onClick: onExit, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.25)", color: "rgba(232,228,220,0.8)", padding: "9px 16px", cursor: "pointer", fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", minHeight: 40, flexShrink: 0 }, "aria-label": "Return to the Endowment" }, "←", h("span", { className: "b-hide-sm" }, " Return to the Endowment")),
        h("div", { style: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 } },
          h(Seal, { size: 26 }),
          h("span", { className: "b-tr-tag", style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.2em", color: "rgba(232,228,220,0.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, "PILLAR · " + tag))),

      // Hero with the living count
      h("div", { style: { padding: "clamp(56px, 8vw, 110px) " + pad + " clamp(56px, 8vw, 90px)", maxWidth: 1280, margin: "0 auto" } },
        h("div", { className: "b-fd-hero" },
          h("div", null,
            eyebrow("§ The Pillar of Provision · " + sub),
            h("h1", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(56px, 8vw, 116px)", lineHeight: 0.96, letterSpacing: "-0.02em", margin: "26px 0 0" } }, name + "."),
            h("p", { style: { fontFamily: serif, fontStyle: "italic", fontSize: "clamp(20px, 2.3vw, 27px)", color: "rgba(232,228,220,0.75)", margin: "24px 0 0", maxWidth: 600, lineHeight: 1.45 } }, "Rice in the pot and bread on the table, given quietly and counted in the open.")),
          h("div", { style: { border: "1px solid rgba(201,169,97,0.35)", background: "linear-gradient(150deg, rgba(201,169,97,0.12), rgba(20,36,66,0.4) 60%)", padding: "clamp(26px, 3vw, 38px)" } },
            h("div", { style: { fontFamily: mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,228,220,0.66)" } }, "Shared so far"),
            h("div", { style: { display: "flex", alignItems: "baseline", gap: 12, marginTop: 12, flexWrap: "wrap" } },
              h("span", { style: { fontFamily: serif, fontSize: "clamp(64px, 8vw, 104px)", lineHeight: 0.9, color: CREAM } }, fmtNum(kg)),
              h("span", { style: { fontFamily: serif, fontStyle: "italic", fontSize: 26, color: GOLD } }, "kg of food")),
            h("div", { style: { height: 1, background: "rgba(201,169,97,0.25)", margin: "22px 0 18px" } }),
            h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } },
              h("div", null, h("div", { style: { fontFamily: serif, fontSize: 30, color: CREAM, lineHeight: 1 } }, String(days.length)), h("div", { style: { fontFamily: mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(232,228,220,0.6)", marginTop: 8 } }, days.length === 1 ? "Day of giving recorded" : "Days of giving recorded")),
              h("div", null, h("div", { style: { fontFamily: serif, fontSize: 30, color: CREAM, lineHeight: 1 } }, since), h("div", { style: { fontFamily: mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(232,228,220,0.6)", marginTop: 8 } }, "Counting since")))))),

      // Intro and what we give
      h("div", { style: { padding: "0 " + pad + " clamp(70px, 9vw, 100px)" } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto", borderTop: "1px solid rgba(201,169,97,0.18)", paddingTop: "clamp(50px, 7vw, 80px)" } },
          eyebrow("§ What we give"),
          h2("Staples that feed a household."),
          c.intro ? h("p", { style: { fontFamily: sans, fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: "rgba(232,228,220,0.75)", maxWidth: 720, margin: "22px 0 0", textWrap: "pretty" } }, c.intro) : null,
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(230px, 100%), 1fr))", gap: 14, marginTop: 44 } },
            staples.map(x => h("div", { key: x.t, style: { border: "1px solid rgba(201,169,97,0.22)", background: "rgba(232,228,220,0.04)", padding: "26px 24px" } },
              h("div", { style: { color: GOLD } }, ic(x.i, 42)),
              h("div", { style: { fontFamily: serif, fontSize: 24, marginTop: 14 } }, x.t),
              h("div", { style: { fontFamily: sans, fontSize: 13, fontWeight: 300, lineHeight: 1.7, color: "rgba(232,228,220,0.65)", marginTop: 8 } }, x.d)))))),

      // The three vows
      h("div", { style: { background: "rgba(232,228,220,0.02)", borderTop: "1px solid rgba(201,169,97,0.14)", borderBottom: "1px solid rgba(201,169,97,0.14)", padding: "clamp(60px, 8vw, 100px) " + pad } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto" } },
          eyebrow("§ How we give"),
          h2("Three promises at every table."),
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "clamp(24px, 4vw, 48px)", marginTop: 44 } },
            vows.map(v => h("div", { key: v.n, style: { borderTop: "1px solid " + GOLD, paddingTop: 22 } },
              h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.14em" } }, v.n),
              h("div", { style: { fontFamily: serif, fontSize: 28, marginTop: 10 } }, v.t),
              h("p", { style: { fontFamily: sans, fontSize: 14, fontWeight: 300, lineHeight: 1.75, color: "rgba(232,228,220,0.7)", margin: "10px 0 0" } }, v.d)))))),

      // Year by year
      years.length ? h("div", { style: { padding: "clamp(70px, 9vw, 100px) " + pad + " 0" } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto" } },
          eyebrow("§ Year by year"),
          h2("Every kilogram, by the year it was given."),
          h("div", { style: { marginTop: 40, display: "grid", gap: 14 } },
            years.slice().reverse().map(y => { const v = Number((st.n.byYear[y] || {}).kg) || 0; return h("div", { key: y, style: { display: "grid", gridTemplateColumns: "64px minmax(0,1fr) auto", gap: 18, alignItems: "center" } },
              h("span", { style: { fontFamily: mono, fontSize: 12, letterSpacing: "0.14em", color: "rgba(232,228,220,0.75)" } }, y),
              h("div", { style: { height: 12, background: "rgba(232,228,220,0.06)", position: "relative" } }, h("div", { className: "b-fd-bar", style: { position: "absolute", inset: 0, width: Math.max(2, v / maxKg * 100) + "%", background: "linear-gradient(90deg, #B08F4C, " + GOLD + " 70%, #EAD9A8)" } })),
              h("span", { style: { fontFamily: serif, fontSize: 22, color: CREAM, minWidth: 90, textAlign: "right" } }, fmtNum(v) + " kg")); })))) : null,

      // Recent days of giving
      h("div", { style: { padding: "clamp(70px, 9vw, 100px) " + pad } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto", border: "1px solid rgba(201,169,97,0.3)", background: "rgba(20,36,66,0.45)", padding: "clamp(28px, 4vw, 48px)" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, flexWrap: "wrap" } },
            h("div", null, eyebrow("§ Recent days of giving"), h("div", { style: { fontFamily: serif, fontSize: "clamp(28px, 3.4vw, 40px)", marginTop: 14 } }, "Where the food went.")),
            h("button", { onClick: goLedger, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.3)", color: CREAM, padding: "13px 22px", cursor: "pointer", fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" } }, "Open ledger →")),
          days.length
            ? h("div", { style: { marginTop: 26, borderTop: "1px solid rgba(201,169,97,0.18)" } },
                days.slice(0, 10).map(g => h("div", { key: g.id, style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "6px 18px", padding: "16px 0", borderBottom: "1px solid rgba(201,169,97,0.12)" } },
                  h("div", { style: { minWidth: 0 } },
                    h("div", { style: { fontFamily: sans, fontSize: 15, color: CREAM } }, g.project && g.project !== "Food & clothing" && g.project !== "Food & Clothing" ? g.project : "Staple food shared"),
                    h("div", { style: { fontFamily: mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(232,228,220,0.6)", marginTop: 6 } }, [g.dateUnknown ? "Date not recorded" : fmtDate(g.date), g.country, g.partner].filter(Boolean).join(" · "))),
                  h("div", { style: { fontFamily: serif, fontSize: 24, color: GOLD, alignSelf: "center", whiteSpace: "nowrap" } }, Number(g.kg) > 0 ? fmtNum(g.kg) + " kg" : "—"))))
            : h("p", { style: { fontFamily: sans, fontSize: 14, fontWeight: 300, color: "rgba(232,228,220,0.6)", margin: "22px 0 0", maxWidth: 620, lineHeight: 1.7 } }, "Each day of giving will be listed here as it is recorded."))),

      // Verse
      h("div", { style: { padding: "0 " + pad + " clamp(70px, 9vw, 110px)" } },
        h("div", { style: { maxWidth: 900, margin: "0 auto", textAlign: "center" } },
          h(Seal, { size: 34 }),
          h("blockquote", { style: { fontFamily: serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(22px, 3vw, 34px)", lineHeight: 1.55, color: CREAM, margin: "34px 0 0" } }, "“They give food, despite their love for it, to the poor, the orphan and the captive: ", h("em", { style: { color: GOLD } }, "we feed you only for the sake of God"), "; we want no reward from you, nor thanks.”"),
          h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,228,220,0.66)", marginTop: 30 } }, "Qur'an · al-Insan 76:8-9"))),

      h(Stories, { articles: c.articles, title: "Word from the tables.", shareKey: "foodclothing" }),

      // Call to action
      h("div", { style: { padding: "clamp(70px, 10vw, 120px) " + pad, textAlign: "center", borderTop: "1px solid rgba(201,169,97,0.14)" } },
        eyebrow("Share the table"),
        h("h2", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(30px, 4.4vw, 52px)", margin: "20px 0 0", lineHeight: 1.1 } }, "Fund the next sack.", h("br", null), h("em", { style: { fontStyle: "italic", color: GOLD } }, "Feed a family this week.")),
        h("div", { style: { display: "flex", justifyContent: "center", gap: 20, marginTop: 44, flexWrap: "wrap" } },
          onDonate ? h("button", { onClick: onDonate, style: { background: "linear-gradient(120deg, #EAD9A8, " + GOLD + " 55%, #B08F4C)", color: "#131A33", border: 0, padding: "17px 34px", cursor: "pointer", fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" } }, "Give to the table") : null,
          link ? h("a", { href: link, target: "_blank", rel: "noopener noreferrer", style: { display: "inline-block", border: "1px solid rgba(232,228,220,0.3)", color: CREAM, textDecoration: "none", padding: "17px 34px", fontFamily: sans, fontSize: 12.5, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase" } }, "Meet our partner ↗") : null),
        h("p", { style: { fontFamily: sans, fontSize: 12, fontWeight: 300, lineHeight: 1.7, color: "rgba(232,228,220,0.66)", maxWidth: 600, margin: "34px auto 0" } }, (c.location ? c.location + ". " : "") + "Given directly and with local partners, and never with the names or faces of those who receive.")),

      h("div", { style: { borderTop: "1px solid rgba(201,169,97,0.2)", padding: "26px " + pad, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" } },
        h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: "rgba(232,228,220,0.66)" } }, "© MMXXVI · THE BRIAL ENDOWMENT"),
        h("span", { style: { fontFamily: serif, fontStyle: "italic", fontSize: 14, color: "rgba(232,228,220,0.66)" } }, "They fed us so we may grow; we share so none go without.")));
  };

  // ---- Transportation: the enterprise pillar (go2rent) ----
  // A pillar that earns: a share of the founder's returns from go2rent is given to
  // the endowment. Content: BrialStore.getPillarContent("transport");
  // contributions: BrialStore.listEnterpriseIncome("go2rent"); partner link: getPillarLink("transport").
  const G2 = "/partners/go2rent/";
  const ORANGE = "#FF5000";
  const TransportPage = ({ onExit, onDonate }) => {
    const read = () => {
      const S = window.BrialStore;
      return {
        c: S && S.getPillarContent ? S.getPillarContent("transport") : null,
        link: S && S.getPillarLink ? S.getPillarLink("transport") : "",
        hidden: S && S.getPillarLinkHidden ? S.getPillarLinkHidden("transport") : false,
        income: S && S.listEnterpriseIncome ? S.listEnterpriseIncome("go2rent") : []
      };
    };
    const [st, setSt] = useState(read);
    useEffect(() => {
      const f = () => setSt(read());
      window.addEventListener("brial:change", f);
      window.addEventListener("brial:ready", f);
      return () => { window.removeEventListener("brial:change", f); window.removeEventListener("brial:ready", f); };
    }, []);
    useEffect(() => { window.scrollTo(0, 0); BrialDeepScroll("transport"); }, []);
    const c = st.c;
    if (!c) return null;
    const showRent = !!st.link && !st.hidden;
    const hideAmt = !!c.hideAmounts;
    const n = st.income.length;
    const total = st.income.reduce((a, x) => a + (Number(x.amount) || 0), 0);
    const usd = n => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pad = "clamp(20px, 4vw, 56px)";
    const eyebrow = t => h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.24em", textTransform: "uppercase" } }, t);
    const h2 = (t, extra) => h("h2", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(32px, 4.4vw, 54px)", lineHeight: 1.08, margin: "18px 0 0", color: CREAM, ...(extra || {}) } }, t);
    const stats = [
      { v: c.fleet || "730+", l: "Vehicles in service" },
      { v: c.regions || "9", l: "Regions" },
      { v: c.airports || "9", l: "Airport desks" },
      { v: c.support || "24/7", l: "Roadside & customer support" }
    ];
    const steps = [
      { n: "01", t: "Rent", d: "Travellers, families and companies rent a car from go2rent, at the airport or in the city." },
      { n: "02", t: "Earn", d: "go2rent runs as an independent company, and its profits are shared with its owners." },
      { n: "03", t: "Return", d: "A share of the founder's returns is given to the endowment and recorded on the open ledger, where it can serve every other pillar." }
    ];
    const fleet = [
      { img: "fleet-corolla.webp", n: "Toyota Corolla", s: "Sedan · at the airport" },
      { img: "fleet-ulysse.webp", n: "Fiat Ulysse", s: "People carrier · for families" },
      { img: "fleet-duster.webp", n: "Dacia Duster", s: "SUV · for long roads" },
      { img: "fleet-puma.webp", n: "Ford Puma", s: "Crossover · for the city" }
    ];
    const desks = [["Antalya", "AYT"], ["Istanbul", "IST · SAW"], ["Gaziantep", "GZT"], ["İzmir", "ADB"], ["Ankara", "ESB"], ["Kayseri", "ASR"], ["Nevşehir", "Cappadocia"], ["Sivas", "VAS"], ["Northern Cyprus", "Region"]];
    const goLedger = () => { try { history.pushState({ brialView: "proof" }, "", "/proof"); window.dispatchEvent(new PopStateEvent("popstate", { state: { brialView: "proof" } })); } catch (e) { location.href = "/proof"; } };
    const rentBtn = (label) => h("a", { href: st.link, target: "_blank", rel: "noopener noreferrer", style: { display: "inline-block", background: `linear-gradient(120deg, #EAD9A8, ${GOLD} 55%, #B08F4C)`, color: "#131A33", textDecoration: "none", padding: "17px 34px", fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" } }, label);

    return h("div", { style: { minHeight: "100vh", background: NAVY, color: CREAM, fontFamily: sans, animation: "fadeIn 0.5s ease both", overflowX: "hidden" }, "data-screen-label": "Transportation · go2rent" },
      h("div", { style: { position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px " + pad, background: "rgba(10,22,40,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(201,169,97,0.18)" } },
        h("button", { onClick: onExit, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.25)", color: "rgba(232,228,220,0.8)", padding: "9px 16px", cursor: "pointer", fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", minHeight: 40, flexShrink: 0 }, "aria-label": "Return to the Endowment" }, "\u2190", h("span", { className: "b-hide-sm" }, " Return to the Endowment")),
        h("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
          h(Seal, { size: 26 }),
          h("span", { className: "b-tr-tag", style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.2em", color: "rgba(232,228,220,0.7)" } }, "PILLAR · " + (renamed("transport") || "Transportation").toUpperCase()))),

      // Hero
      h("div", { style: { padding: "clamp(56px, 8vw, 100px) " + pad + " clamp(50px, 7vw, 80px)", maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: "clamp(36px, 5vw, 70px)", alignItems: "center" } },
        h("div", { style: { minWidth: 0 } },
          eyebrow("§ The Enterprise Pillar · Transportasi"),
          h("h1", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(50px, 7.4vw, 100px)", lineHeight: 0.98, letterSpacing: "-0.02em", margin: "26px 0 0" } }, (c.programme || renamed("transport") || "Transportation") + "."),
          h("p", { style: { fontFamily: serif, fontStyle: "italic", fontSize: "clamp(20px, 2.3vw, 27px)", color: "rgba(232,228,220,0.75)", margin: "24px 0 0", maxWidth: 560, lineHeight: 1.45 } }, "The pillar that earns. Cars on the road across Türkiye, and a share of what they return comes home to the endowment."),
          h("div", { style: { display: "inline-flex", alignItems: "center", gap: 18, marginTop: 40, padding: "16px 22px", background: "rgba(232,228,220,0.06)", border: "1px solid rgba(201,169,97,0.3)", flexWrap: "wrap", maxWidth: "100%" } },
            h("span", { style: { fontFamily: serif, fontSize: 17, fontStyle: "italic", color: GOLD } }, "The Brial Endowment"),
            h("span", { style: { color: "rgba(232,228,220,0.66)", fontSize: 16 } }, "×"),
            h("img", { src: G2 + "logo-light.svg", alt: "go2rent", style: { height: 30, width: "auto", display: "block" } }),
            h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: "rgba(232,228,220,0.66)", textTransform: "uppercase" } }, "Enterprise partner"))),
        h("div", { style: { position: "relative", minWidth: 0 } },
          h("img", { src: G2 + "hero.webp", alt: "The go2rent sign on a dark office wall", style: { width: "100%", aspectRatio: "16 / 10", objectFit: "cover", display: "block", border: "1px solid rgba(201,169,97,0.25)" } }),
          h("div", { style: { position: "absolute", left: 0, bottom: 0, height: 3, width: "38%", background: ORANGE } }))),

      // Facts band
      h("div", { style: { background: CREAM, color: NAVY, padding: "clamp(50px, 7vw, 80px) " + pad } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto" } },
          h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(10,22,40,0.72)" } }, "On the road today · " + (c.location || "Türkiye and Northern Cyprus")),
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: "clamp(24px, 4vw, 48px)", marginTop: 28 } },
            stats.map(x => h("div", { key: x.l, style: { borderTop: "1px solid rgba(10,22,40,0.18)", paddingTop: 18 } },
              h("div", { style: { fontFamily: serif, fontSize: "clamp(44px, 5.6vw, 72px)", lineHeight: 0.95, color: NAVY } }, x.v),
              h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B5D32", marginTop: 12 } }, x.l)))),
          c.factsNote ? h("div", { style: { fontFamily: sans, fontSize: 12.5, fontWeight: 300, color: "rgba(10,22,40,0.6)", marginTop: 28 } }, c.factsNote) : null)),

      // Quote
      h("div", { style: { padding: "clamp(70px, 9vw, 110px) " + pad } },
        h("div", { style: { maxWidth: 900, margin: "0 auto", textAlign: "center" } },
          h(Seal, { size: 34 }),
          h("blockquote", { style: { fontFamily: serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(24px, 3.2vw, 38px)", lineHeight: 1.5, color: CREAM, margin: "34px 0 0" } }, "“The truthful, trustworthy merchant ", h("em", { style: { color: GOLD } }, "is with the Prophets"), ", the truthful, and the martyrs.”"),
          h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,228,220,0.66)", marginTop: 30 } }, "Hadith · Jami' at-Tirmidhi 1209"))),

      // How it works
      h("div", { style: { padding: "0 " + pad + " clamp(70px, 9vw, 100px)" } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto" } },
          eyebrow("§ How the pillar works"),
          h("p", { style: { fontFamily: sans, fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: "rgba(232,228,220,0.75)", maxWidth: 720, margin: "22px 0 0", textWrap: "pretty" } }, c.intro),
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 14, marginTop: 44 } },
            steps.map(f => h("div", { key: f.n, style: { border: "1px solid rgba(201,169,97,0.22)", background: "rgba(232,228,220,0.04)", padding: "26px 24px" } },
              h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.14em" } }, f.n),
              h("div", { style: { fontFamily: serif, fontSize: 23, marginTop: 12 } }, f.t),
              h("div", { style: { fontFamily: sans, fontSize: 13, fontWeight: 300, lineHeight: 1.7, color: "rgba(232,228,220,0.65)", marginTop: 10 } }, f.d)))))),

      // Fleet
      h("div", { style: { background: "rgba(232,228,220,0.02)", borderTop: "1px solid rgba(201,169,97,0.14)", borderBottom: "1px solid rgba(201,169,97,0.14)", padding: "clamp(60px, 8vw, 100px) " + pad } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto" } },
          eyebrow("§ The fleet"),
          h2("Real cars, real roads."),
          h("p", { style: { fontFamily: sans, fontSize: 14.5, fontWeight: 300, lineHeight: 1.8, color: "rgba(232,228,220,0.7)", maxWidth: 620, margin: "18px 0 0" } }, "From economy cars to nine-seat vans and executive sedans. These are cars from the go2rent fleet, photographed as they are."),
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 16, marginTop: 44 } },
            fleet.map(x => h("figure", { key: x.n, style: { margin: 0, background: "rgba(20,36,66,0.45)", border: "1px solid rgba(201,169,97,0.18)" } },
              h("img", { src: G2 + x.img, alt: x.n + " from the go2rent fleet", loading: "lazy", style: { width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" } }),
              h("figcaption", { style: { padding: "16px 18px 18px" } },
                h("div", { style: { fontFamily: serif, fontSize: 21, color: CREAM } }, x.n),
                h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(232,228,220,0.66)", marginTop: 6 } }, x.s))))))),

      // Coverage
      h("div", { style: { padding: "clamp(70px, 9vw, 110px) " + pad } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto" } },
          eyebrow("§ Where to find it"),
          h2("Airport first, across the country."),
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 10, marginTop: 40 } },
            desks.map(([city, code]) => h("div", { key: city, style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, padding: "16px 18px", border: "1px solid rgba(201,169,97,0.18)", background: "rgba(232,228,220,0.03)" } },
              h("span", { style: { fontFamily: serif, fontSize: 20 } }, city),
              h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", color: "rgba(232,228,220,0.66)", textAlign: "right" } }, code)))),
          h("p", { style: { fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.66)", margin: "20px 0 0" } }, "Pick up at the airport or in the city, and return the car at another location."))),

      // Returns to the endowment
      h("div", { style: { padding: "0 " + pad + " clamp(70px, 9vw, 110px)" } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto", border: "1px solid rgba(201,169,97,0.3)", background: "rgba(20,36,66,0.45)", padding: "clamp(28px, 4vw, 48px)" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, flexWrap: "wrap" } },
            h("div", { style: { minWidth: 0 } },
              eyebrow("\u00a7 Returned to the endowment"),
              hideAmt
                ? (n ? h("div", { style: { fontFamily: serif, fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1, marginTop: 16, color: CREAM } }, n + " " + (n === 1 ? "contribution" : "contributions")) : null)
                : h("div", { style: { fontFamily: serif, fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1, marginTop: 16, color: CREAM } }, usd(total)),
              (!hideAmt || n) ? h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(232,228,220,0.66)", marginTop: 10 } }, hideAmt ? "Each one verified on the open ledger" : n + " " + (n === 1 ? "contribution" : "contributions") + " \u00b7 verified on the open ledger") : null),
            h("button", { onClick: goLedger, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.3)", color: CREAM, padding: "13px 22px", cursor: "pointer", fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" } }, "Open ledger →")),
          st.income.length
            ? h("div", { style: { marginTop: 28, borderTop: "1px solid rgba(201,169,97,0.18)" } },
                st.income.slice(0, 12).map(x => h("div", { key: x.id, style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "14px 0", borderBottom: "1px solid rgba(201,169,97,0.12)" } },
                  h("span", { style: { fontFamily: sans, fontSize: 14, color: "rgba(232,228,220,0.85)" } }, x.period || fmtDate(x.date)),
                  h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.14em", color: "rgba(232,228,220,0.66)" } }, (x.txRef || "") + " · " + fmtDate(x.date)),
                  hideAmt ? null : h("span", { style: { fontFamily: serif, fontSize: 20, color: GOLD } }, usd(x.amount)))))
            : h("p", { style: { fontFamily: sans, fontSize: 14, fontWeight: 300, color: "rgba(232,228,220,0.6)", margin: "22px 0 0", maxWidth: 620, lineHeight: 1.7 } }, "The first contribution will appear here, and on the open ledger, as soon as it is made."))),

      h(Stories, { articles: c.articles, title: "Word from the road.", shareKey: "transport" }),

      // Call to action
      h("div", { style: { padding: "clamp(70px, 10vw, 120px) " + pad, textAlign: "center" } },
        eyebrow("Rent with purpose"),
        h("h2", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(30px, 4.4vw, 52px)", margin: "20px 0 0", lineHeight: 1.1 } }, "Need a car in Türkiye?", h("br", null), h("em", { style: { fontStyle: "italic" } }, "Rent with go2rent.")),
        h("div", { style: { display: "flex", justifyContent: "center", gap: 20, marginTop: 44, flexWrap: "wrap" } },
          showRent ? rentBtn("Rent with go2rent ↗") : null,
          onDonate ? h("button", { onClick: onDonate, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.3)", color: CREAM, padding: "17px 34px", cursor: "pointer", fontFamily: sans, fontSize: 12.5, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase" } }, "Give to the endowment") : null),
        showRent ? h("a", { href: "tel:+908503023800", style: { display: "inline-block", fontFamily: mono, fontSize: 11, letterSpacing: "0.14em", color: "rgba(232,228,220,0.6)", marginTop: 26, textDecoration: "none" } }, "24/7 SUPPORT · +90 850 302 38 00") : null,
        h("p", { style: { fontFamily: sans, fontSize: 12, fontWeight: 300, lineHeight: 1.7, color: "rgba(232,228,220,0.66)", maxWidth: 620, margin: "34px auto 0" } }, "go2rent is an independent company. A rental is an agreement between you and go2rent, not with the Brial Endowment. The endowment receives a share of the founder's returns from the company, not a share of each rental.")),

      h("div", { style: { borderTop: "1px solid rgba(201,169,97,0.2)", padding: "26px " + pad, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" } },
        h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: "rgba(232,228,220,0.66)" } }, "© MMXXVI · THE BRIAL ENDOWMENT"),
        h("span", { style: { fontFamily: serif, fontStyle: "italic", fontSize: 14, color: "rgba(232,228,220,0.66)" } }, "Every journey carries something home.")));
  };

  // ============================================================
  // THE VENTURE: the endowment's e-commerce products. A share of the profit returns to the
  // endowment. Content: BrialStore.getPillarContent("venture") (products, intro, articles);
  // contributions: BrialStore.listEnterpriseIncome("venture"); store link: getPillarLink("venture").
  // ============================================================
  const VenturePage = ({ onExit, onDonate }) => {
    const read = () => {
      const S = window.BrialStore;
      return {
        c: S && S.getPillarContent ? S.getPillarContent("venture") : null,
        link: S && S.getPillarLink ? S.getPillarLink("venture") : "",
        hidden: S && S.getPillarLinkHidden ? S.getPillarLinkHidden("venture") : false,
        income: S && S.listEnterpriseIncome ? S.listEnterpriseIncome("venture") : []
      };
    };
    const [st, setSt] = useState(read);
    useEffect(() => {
      const f = () => setSt(read());
      window.addEventListener("brial:change", f);
      window.addEventListener("brial:ready", f);
      return () => { window.removeEventListener("brial:change", f); window.removeEventListener("brial:ready", f); };
    }, []);
    useEffect(() => { window.scrollTo(0, 0); BrialDeepScroll("venture"); }, []);
    const c = st.c;
    if (!c) return null;
    const name = c.programme || renamed("venture") || "The Venture";
    const tag = (renamed("venture") || "The Venture").toUpperCase();
    const safe = u => (/^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "");
    const storeLink = !st.hidden ? safe(st.link) : "";
    const products = (c.products || []).filter(p => p && p.shown && String(p.name || "").trim());
    const hideAmt = !!c.hideAmounts;
    const n = st.income.length;
    const total = st.income.reduce((a, x) => a + (Number(x.amount) || 0), 0);
    const usd = v => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pad = "clamp(20px, 4vw, 56px)";
    const eyebrow = t => h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.24em", textTransform: "uppercase" } }, t);
    const h2 = t => h("h2", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(32px, 4.4vw, 54px)", lineHeight: 1.08, margin: "18px 0 0", color: CREAM } }, t);
    const goldBtn = (href, label) => h("a", { href, target: "_blank", rel: "noopener noreferrer", style: { display: "inline-block", background: `linear-gradient(120deg, #EAD9A8, ${GOLD} 55%, #B08F4C)`, color: "#131A33", textDecoration: "none", padding: "17px 34px", fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" } }, label);
    const goLedger = () => { try { history.pushState({ brialView: "proof" }, "", "/proof"); window.dispatchEvent(new PopStateEvent("popstate", { state: { brialView: "proof" } })); } catch (e) { location.href = "/proof"; } };
    const steps = [
      { n: "01", t: "Make", d: "Products chosen and made with care, honestly priced and honestly described, under the endowment's name." },
      { n: "02", t: "Sell", d: "They are sold online, through our own shop and trusted marketplaces, and delivered to the buyer." },
      { n: "03", t: "Return", d: "A share of the profit is given to the endowment and recorded on the open ledger, to support its programmes and the work of running it." }
    ];
    const imgOf = p => (p.photo && (p.photo.url || p.photo.path) ? (p.photo.url || (window.brialSupabase ? window.brialSupabase.publicUrl(p.photo.path) : "")) : "");

    return h("div", { style: { minHeight: "100vh", background: NAVY, color: CREAM, fontFamily: sans, animation: "fadeIn 0.5s ease both", overflowX: "hidden" }, "data-screen-label": "The Venture" },
      h("style", null, ".b-vn-card{transition:border-color .25s ease,transform .25s ease}.b-vn-card:hover{border-color:rgba(201,169,97,.55)!important;transform:translateY(-2px)}.b-vn-buy:hover{background:" + GOLD + "!important;color:" + NAVY + "!important}@media (prefers-reduced-motion:reduce){.b-vn-card,.b-vn-card:hover{transition:none;transform:none}}"),
      h("div", { style: { position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px " + pad, background: "rgba(10,22,40,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(201,169,97,0.18)" } },
        h("button", { onClick: onExit, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.25)", color: "rgba(232,228,220,0.8)", padding: "9px 16px", cursor: "pointer", fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", minHeight: 40, flexShrink: 0 }, "aria-label": "Return to the Endowment" }, "←", h("span", { className: "b-hide-sm" }, " Return to the Endowment")),
        h("div", { style: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 } },
          h(Seal, { size: 26 }),
          h("span", { className: "b-tr-tag", style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.2em", color: "rgba(232,228,220,0.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, "PILLAR · " + tag))),

      // Hero
      h("div", { style: { padding: "clamp(56px, 8vw, 110px) " + pad + " clamp(50px, 7vw, 80px)", maxWidth: 1280, margin: "0 auto" } },
        eyebrow("§ The Trading Pillar · Usaha"),
        h("h1", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(50px, 7.4vw, 104px)", lineHeight: 0.98, letterSpacing: "-0.02em", margin: "26px 0 0" } }, name + "."),
        h("p", { style: { fontFamily: serif, fontStyle: "italic", fontSize: "clamp(20px, 2.3vw, 27px)", color: "rgba(232,228,220,0.75)", margin: "24px 0 0", maxWidth: 640, lineHeight: 1.45 } }, "The pillar that trades. Good things, sold honestly, and a share of what they earn comes home to the endowment."),
        h("div", { style: { display: "flex", gap: 16, marginTop: 40, flexWrap: "wrap", alignItems: "center" } },
          products.length ? h("a", { href: "#venture-products", onClick: e => { e.preventDefault(); const el = document.getElementById("venture-products"); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" }); }, style: { display: "inline-block", border: "1px solid rgba(201,169,97,0.5)", color: "#E4C989", textDecoration: "none", padding: "15px 26px", fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" } }, "See the products ↓") : null,
          storeLink ? goldBtn(storeLink, "Visit the store ↗") : null,
          h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: "rgba(232,228,220,0.6)", textTransform: "uppercase" } }, c.location || "Online, delivered worldwide"))),

      // How it works
      h("div", { style: { padding: "0 " + pad + " clamp(70px, 9vw, 100px)" } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto", borderTop: "1px solid rgba(201,169,97,0.18)", paddingTop: "clamp(50px, 7vw, 80px)" } },
          eyebrow("§ How the pillar works"),
          c.intro ? h("p", { style: { fontFamily: sans, fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: "rgba(232,228,220,0.75)", maxWidth: 720, margin: "22px 0 0", textWrap: "pretty" } }, c.intro) : null,
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 14, marginTop: 44 } },
            steps.map(f => h("div", { key: f.n, style: { border: "1px solid rgba(201,169,97,0.22)", background: "rgba(232,228,220,0.04)", padding: "26px 24px" } },
              h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.14em" } }, f.n),
              h("div", { style: { fontFamily: serif, fontSize: 23, marginTop: 12 } }, f.t),
              h("div", { style: { fontFamily: sans, fontSize: 13, fontWeight: 300, lineHeight: 1.7, color: "rgba(232,228,220,0.65)", marginTop: 10 } }, f.d)))))),

      // Products
      h("div", { id: "venture-products", style: { background: "rgba(232,228,220,0.02)", borderTop: "1px solid rgba(201,169,97,0.14)", borderBottom: "1px solid rgba(201,169,97,0.14)", padding: "clamp(60px, 8vw, 100px) " + pad } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto" } },
          eyebrow("§ The products"),
          h2(products.length ? "Made to be worth having." : "The first products are on their way."),
          products.length
            ? h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(250px, 100%), 1fr))", gap: 18, marginTop: 44 } },
                products.map(p => {
                  const img = imgOf(p), buy = p.soldOut ? "" : safe(p.link);
                  return h("article", { key: p.id, className: "b-vn-card", style: { display: "flex", flexDirection: "column", background: "rgba(20,36,66,0.45)", border: "1px solid rgba(201,169,97,0.2)", minWidth: 0 } },
                    h("div", { style: { position: "relative", aspectRatio: "1 / 1", background: "linear-gradient(160deg, #16294A, #0A1628 70%)", overflow: "hidden" } },
                      img ? h("img", { src: img, alt: p.name, loading: "lazy", style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" } })
                          : h("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" } }, h(Seal, { size: 46 })),
                      p.soldOut ? h("span", { style: { position: "absolute", top: 14, left: 14, fontFamily: mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", background: "rgba(10,22,40,0.85)", color: "#E4C989", padding: "7px 10px", border: "1px solid rgba(201,169,97,0.4)" } }, "Sold out") : null),
                    h("div", { style: { padding: "20px 20px 22px", display: "flex", flexDirection: "column", flex: 1 } },
                      p.category ? h("div", { style: { fontFamily: mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(232,228,220,0.55)" } }, p.category) : null,
                      h("h3", { style: { fontFamily: serif, fontWeight: 400, fontSize: 25, lineHeight: 1.15, margin: p.category ? "8px 0 0" : 0, color: CREAM } }, p.name),
                      p.tagline ? h("p", { style: { fontFamily: sans, fontSize: 13.5, fontWeight: 300, lineHeight: 1.7, color: "rgba(232,228,220,0.68)", margin: "10px 0 0" } }, p.tagline) : null,
                      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 20, flexWrap: "wrap" } },
                        h("span", { style: { fontFamily: serif, fontSize: 24, color: GOLD } }, p.price || ""),
                        buy ? h("a", { className: "b-vn-buy", href: buy, target: "_blank", rel: "noopener noreferrer", "aria-label": "Buy " + p.name, style: { display: "inline-block", border: "1px solid " + GOLD, color: "#E4C989", textDecoration: "none", padding: "11px 18px", fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", transition: "background .2s, color .2s" } }, "Buy ↗")
                            : h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(232,228,220,0.5)" } }, p.soldOut ? "Sold out" : "Coming soon"))));
                }))
            : h("p", { style: { fontFamily: sans, fontSize: 14.5, fontWeight: 300, lineHeight: 1.8, color: "rgba(232,228,220,0.7)", maxWidth: 620, margin: "18px 0 0" } }, "The Venture is preparing its first products. They will appear here, each with a link to where it can be bought."))),

      // Quote
      h("div", { style: { padding: "clamp(70px, 9vw, 110px) " + pad } },
        h("div", { style: { maxWidth: 900, margin: "0 auto", textAlign: "center" } },
          h(Seal, { size: 34 }),
          h("blockquote", { style: { fontFamily: serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(24px, 3.2vw, 38px)", lineHeight: 1.5, color: CREAM, margin: "34px 0 0" } }, "“God has made ", h("em", { style: { color: GOLD } }, "trade lawful"), ".”"),
          h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,228,220,0.66)", marginTop: 30 } }, "Al-Baqarah 2:275"))),

      // Returned to the endowment
      h("div", { style: { padding: "0 " + pad + " clamp(70px, 9vw, 110px)" } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto", border: "1px solid rgba(201,169,97,0.3)", background: "rgba(20,36,66,0.45)", padding: "clamp(28px, 4vw, 48px)" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, flexWrap: "wrap" } },
            h("div", { style: { minWidth: 0 } },
              eyebrow("§ Returned to the endowment"),
              hideAmt
                ? (n ? h("div", { style: { fontFamily: serif, fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1, marginTop: 16, color: CREAM } }, n + " " + (n === 1 ? "contribution" : "contributions")) : null)
                : h("div", { style: { fontFamily: serif, fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1, marginTop: 16, color: CREAM } }, usd(total)),
              (!hideAmt || n) ? h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(232,228,220,0.66)", marginTop: 10 } }, hideAmt ? "Each one verified on the open ledger" : n + " " + (n === 1 ? "contribution" : "contributions") + " · verified on the open ledger") : null),
            h("button", { onClick: goLedger, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.3)", color: CREAM, padding: "13px 22px", cursor: "pointer", fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" } }, "Open ledger →")),
          n
            ? h("div", { style: { marginTop: 28, borderTop: "1px solid rgba(201,169,97,0.18)" } },
                st.income.slice(0, 12).map(x => h("div", { key: x.id, style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "14px 0", borderBottom: "1px solid rgba(201,169,97,0.12)" } },
                  h("span", { style: { fontFamily: sans, fontSize: 14, color: "rgba(232,228,220,0.85)" } }, x.period || fmtDate(x.date)),
                  h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.14em", color: "rgba(232,228,220,0.66)" } }, (x.txRef || "") + " · " + fmtDate(x.date)),
                  hideAmt ? null : h("span", { style: { fontFamily: serif, fontSize: 20, color: GOLD } }, usd(x.amount)))))
            : h("p", { style: { fontFamily: sans, fontSize: 14, fontWeight: 300, color: "rgba(232,228,220,0.6)", margin: "22px 0 0", maxWidth: 620, lineHeight: 1.7 } }, "The first contribution will appear here, and on the open ledger, as soon as it is made."))),

      h(Stories, { articles: c.articles, title: "From the workshop.", shareKey: "venture" }),

      // Call to action
      h("div", { style: { padding: "clamp(70px, 10vw, 120px) " + pad, textAlign: "center" } },
        eyebrow("Shop with purpose"),
        h("h2", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(30px, 4.4vw, 52px)", margin: "20px 0 0", lineHeight: 1.1 } }, "Buy something good.", h("br", null), h("em", { style: { fontStyle: "italic" } }, "Let it keep giving.")),
        h("div", { style: { display: "flex", justifyContent: "center", gap: 20, marginTop: 44, flexWrap: "wrap" } },
          storeLink ? goldBtn(storeLink, "Visit the store ↗") : null,
          onDonate ? h("button", { onClick: onDonate, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.3)", color: CREAM, padding: "17px 34px", cursor: "pointer", fontFamily: sans, fontSize: 12.5, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase" } }, "Give to the endowment") : null),
        h("p", { style: { fontFamily: sans, fontSize: 12, fontWeight: 300, lineHeight: 1.7, color: "rgba(232,228,220,0.66)", maxWidth: 640, margin: "34px auto 0" } }, "A purchase is a sale, not a donation, and is made with the shop where you buy it. A share of The Venture's profit, not of each sale, is given to the endowment to support its programmes and the work of running it. Gifts made to the endowment itself go entirely to its charitable work and its permanent principal.")),

      h("div", { style: { borderTop: "1px solid rgba(201,169,97,0.2)", padding: "26px " + pad, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" } },
        h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: "rgba(232,228,220,0.66)" } }, "© MMXXVI · THE BRIAL ENDOWMENT"),
        h("span", { style: { fontFamily: serif, fontStyle: "italic", fontSize: 14, color: "rgba(232,228,220,0.66)" } }, "Honest trade, lasting good.")));
  };

  window.BrialStories = Stories;
  window.WorshipPage = WorshipPage;
  window.WaterPage = WaterPage;
  window.BrialPillarPages = { worship: WorshipPage, water: WaterPage, hospitals: HospitalsPage, schools: SchoolsPage, livestock: LivestockPage, infra: InfraPage, transport: TransportPage, venture: VenturePage, foodclothing: FoodClothingPage };
})();
