// ============================================================
// FOOD & LAND — public programme page (Trees for Life × Zaytoun)
// Gen-1 visual language. Content is founder-managed via
// BrialStore.getFoodland(); partner link via getPillarLink("foodland").
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
      h("path", { d: "M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" }),
      h("circle", { cx: "18", cy: "18", r: "4", fill: GOLD, stroke: "none" })));

  const useFoodland = () => {
    const read = () => ({
      content: window.BrialStore && window.BrialStore.getFoodland ? window.BrialStore.getFoodland() : null,
      link: window.BrialStore && window.BrialStore.getPillarLink ? window.BrialStore.getPillarLink("foodland") : "https://zaytoun.uk/plant-a-tree/",
      hidden: window.BrialStore && window.BrialStore.getPillarLinkHidden ? window.BrialStore.getPillarLinkHidden("foodland") : false,
      grantTrees: window.BrialStore && window.BrialStore.getPillarUnits ? window.BrialStore.getPillarUnits("Food & Land") : 0
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

  const FoodLandPage = ({ onExit, onDonate }) => {
    const { content, link, hidden, grantTrees } = useFoodland();
    useEffect(() => { window.scrollTo(0, 0); if (window.BrialDeepScroll) window.BrialDeepScroll("foodland"); }, []);
    if (!content) return null;
    const trees = grantTrees > 0 ? grantTrees : (Number(content.trees) || 0);
    const showPartner = !!link && !hidden;
    const zLogo = (window.BRIAL_LOGOS || {}).zaytoun;
    const openPartner = () => window.open(link, "_blank", "noopener,noreferrer");
    const articles = (content.articles || []).filter(a => a && (a.title || a.body));

    return h("div", { style: { minHeight: "100vh", background: NAVY, color: CREAM, fontFamily: sans, animation: "fadeIn 0.5s ease both" }, "data-screen-label": "Food & Land — Trees for Life" },

      // ---- top bar ----
      h("div", { style: { position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px clamp(20px, 4vw, 56px)", background: "rgba(10,22,40,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(201,169,97,0.15)" } },
        h("button", { onClick: onExit, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.25)", color: "rgba(232,228,220,0.8)", padding: "9px 16px", cursor: "pointer", fontFamily: mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" } }, "\u2190 Return to the Endowment"),
        h("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
          h(Seal, { size: 26 }),
          h("span", { style: { fontFamily: mono, fontSize: 10, letterSpacing: "0.26em", color: "rgba(232,228,220,0.7)" } }, "PILLAR \u00b7 FOOD & LAND"))),

      // ---- hero ----
      h("div", { style: { padding: "clamp(60px, 9vw, 110px) clamp(20px, 4vw, 56px) clamp(50px, 7vw, 80px)", maxWidth: 1280, margin: "0 auto" } },
        h("div", { style: { fontFamily: mono, fontSize: 10, color: GOLD, letterSpacing: "0.3em", textTransform: "uppercase" } }, "\u00a7 The Fourth Pillar \u2014 Pangan"),
        h("h1", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(52px, 8vw, 108px)", lineHeight: 0.98, letterSpacing: "-0.02em", margin: "26px 0 0", maxWidth: 900 } },
          content.programme + "."),
        h("p", { style: { fontFamily: serif, fontStyle: "italic", fontSize: "clamp(20px, 2.4vw, 28px)", color: "rgba(232,228,220,0.75)", margin: "26px 0 0", maxWidth: 640, lineHeight: 1.45 } },
          "Olive trees planted on Palestinian family land \u2014 food security that fruits for generations."),

        // partnership lockup
        h("div", { style: { display: "inline-flex", alignItems: "center", gap: 18, marginTop: 44, padding: "16px 22px", background: "rgba(232,228,220,0.06)", border: "1px solid rgba(201,169,97,0.3)", flexWrap: "wrap" } },
          h("span", { style: { fontFamily: serif, fontSize: 17, fontStyle: "italic", color: GOLD } }, "The Brial Endowment"),
          h("span", { style: { color: "rgba(232,228,220,0.4)", fontSize: 16 } }, "\u00d7"),
          zLogo ? h("img", { src: zLogo, alt: "Zaytoun \u2014 From Palestine", style: { height: 52, width: "auto", display: "block", borderRadius: 2 } }) : null,
          h("span", { style: { fontFamily: sans, fontSize: 12, fontWeight: 500, color: "rgba(232,228,220,0.85)", lineHeight: 1.5 } }, "Zaytoun CIC \u00b7 London", h("br", null), h("span", { style: { color: "rgba(232,228,220,0.5)", fontWeight: 300 } }, "with the Palestine Fair Trade Association")))),

      // ---- stat band (cream) ----
      h("div", { style: { background: CREAM, color: NAVY, padding: "clamp(56px, 8vw, 90px) clamp(20px, 4vw, 56px)" } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "clamp(30px, 5vw, 70px)", alignItems: "center" } },
          h("div", null,
            h("div", { style: { fontFamily: mono, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(10,22,40,0.55)" } }, "In the soil today"),
            h("div", { style: { fontFamily: serif, fontSize: "clamp(90px, 12vw, 150px)", lineHeight: 0.9, marginTop: 10, color: NAVY } }, String(trees)),
            h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: "#8B7A4A", marginTop: 12 } }, "Olive trees \u00b7 certified")),
          h("div", null,
            h("div", { style: { width: 44, height: 1, background: "#8B7A4A", marginBottom: 22 } }),
            h("div", { style: { fontFamily: serif, fontSize: "clamp(22px, 2.6vw, 30px)", fontStyle: "italic", lineHeight: 1.4, color: "rgba(10,22,40,0.85)" } }, content.location),
            h("div", { style: { fontFamily: sans, fontSize: 13.5, fontWeight: 300, lineHeight: 1.7, color: "rgba(10,22,40,0.65)", marginTop: 18, maxWidth: 460 } },
              content.partnerLine + " \u2014 every sapling certified by the olive farmers of the programme, planted where it matters most.")))),

      // ---- certificate quote ----
      h("div", { style: { padding: "clamp(70px, 9vw, 110px) clamp(20px, 4vw, 56px)" } },
        h("div", { style: { maxWidth: 900, margin: "0 auto", textAlign: "center" } },
          h(Seal, { size: 34 }),
          h("blockquote", { style: { fontFamily: serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(24px, 3.2vw, 38px)", lineHeight: 1.5, color: CREAM, margin: "34px 0 0" } },
            "\u201cThe olive farmers of the Jenin, Nablus and Salfeet districts of Palestine participating in the Trees for Life programme sincerely thank ",
            h("em", { style: { color: GOLD } }, "The Brial Endowment"),
            " \u2014 your sponsorship through Zaytoun will fund the planting of ", String(trees), " olive trees in Palestine.\u201d"),
          h("div", { style: { fontFamily: mono, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(232,228,220,0.45)", marginTop: 30 } }, "\u2014 Gift certificate \u00b7 Zaytoun \u00b7 Trees for Life"))),

      // ---- how it works ----
      h("div", { style: { padding: "0 clamp(20px, 4vw, 56px) clamp(70px, 9vw, 100px)" } },
        h("div", { style: { maxWidth: 1280, margin: "0 auto" } },
          h("div", { style: { fontFamily: mono, fontSize: 10, color: GOLD, letterSpacing: "0.3em", textTransform: "uppercase" } }, "\u00a7 How the programme works"),
          h("p", { style: { fontFamily: sans, fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: "rgba(232,228,220,0.75)", maxWidth: 720, margin: "22px 0 0", textWrap: "pretty" } }, content.intro),
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 44 } },
            [
              { n: "01", t: "Planted young", d: "Saplings are two to three years old when they are set into family land each December and January." },
              { n: "02", t: "First fruit", d: "Between the fifth and seventh year, the grove begins to bear \u2014 oil, income, and food on the farmer's own soil." },
              { n: "03", t: "Full strength", d: "Around year fifteen the tree stands mature. Olive trees outlast their planters by centuries." }
            ].map(f => h("div", { key: f.n, style: { border: "1px solid rgba(201,169,97,0.22)", background: "rgba(232,228,220,0.04)", padding: "26px 24px" } },
              h("div", { style: { fontFamily: mono, fontSize: 10, color: GOLD, letterSpacing: "0.2em" } }, f.n),
              h("div", { style: { fontFamily: serif, fontSize: 23, marginTop: 12 } }, f.t),
              h("div", { style: { fontFamily: sans, fontSize: 13, fontWeight: 300, lineHeight: 1.7, color: "rgba(232,228,220,0.65)", marginTop: 10 } }, f.d))))
        )),

      // ---- field notes ----
      window.BrialStories ? h(window.BrialStories, { articles: articles, title: "Word from the groves.", shareKey: "foodland" }) : null,

      // ---- CTA ----
      h("div", { style: { padding: "clamp(70px, 10vw, 120px) clamp(20px, 4vw, 56px)", textAlign: "center" } },
        h("div", { style: { fontFamily: mono, fontSize: 10, color: GOLD, letterSpacing: "0.3em", textTransform: "uppercase" } }, "Walk the groves"),
        h("h2", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(30px, 4.4vw, 52px)", margin: "20px 0 0", lineHeight: 1.1 } },
          "Meet the people", h("br", null), h("em", { style: { fontStyle: "italic" } }, "who plant with us.")),
        h("div", { style: { display: "flex", justifyContent: "center", gap: 20, marginTop: 44, flexWrap: "wrap" } },
          showPartner ? h("button", { onClick: openPartner, style: { background: `linear-gradient(120deg, #EAD9A8, ${GOLD} 55%, #B08F4C)`, color: "#131A33", border: "none", padding: "17px 34px", cursor: "pointer", fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" } }, "Learn more about our partner \u2197") : null,
          onDonate ? h("button", { onClick: onDonate, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.3)", color: CREAM, padding: "17px 34px", cursor: "pointer", fontFamily: sans, fontSize: 12.5, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase" } }, "Make a bequest") : null),
        showPartner ? h("div", { style: { fontFamily: mono, fontSize: 10, letterSpacing: "0.18em", color: "rgba(232,228,220,0.4)", marginTop: 26 } }, "ZAYTOUN.UK \u00b7 TREES FOR LIFE \u00b7 PALESTINE FAIR TRADE ASSOCIATION") : null),

      // ---- foot ----
      h("div", { style: { borderTop: "1px solid rgba(201,169,97,0.2)", padding: "26px clamp(20px, 4vw, 56px)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" } },
        h("span", { style: { fontFamily: mono, fontSize: 9.5, letterSpacing: "0.22em", color: "rgba(232,228,220,0.4)" } }, "\u00a9 MMXXVI \u00b7 THE BRIAL ENDOWMENT"),
        h("span", { style: { fontFamily: serif, fontStyle: "italic", fontSize: 14, color: "rgba(232,228,220,0.55)" } }, "They planted so we may eat; we plant so they may eat.")));
  };

  window.FoodLandPage = FoodLandPage;
})();
