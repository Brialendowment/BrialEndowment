// ============================================================
// THE OPEN LEDGER — public proof page (window.ProofPage)
// Every grant across every pillar, live from the public database.
// ============================================================
(function () {
  const h = React.createElement;
  const { useState, useEffect } = React;
  const GOLD = "#C9A961", NAVY = "#0A1628", CREAM = "#E8E4DC";
  const mono = "'JetBrains Mono', monospace";
  const serif = "'Cormorant Garamond', serif";
  const sans = "'Manrope', sans-serif";
  const fmtM = n => "$" + (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtD = s => { const d = new Date(s); return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(); };
  const UNIT_NOUN = { "Houses of Worship": ["mosque", "mosques"], "Reforestation & Land": ["tree", "trees"], "Clean Water": ["well", "wells"], "Hospitals": ["clinic", "clinics"], "Schools": ["school", "schools"], "Livestock & Enterprise": ["placement", "placements"], "Sustainable Infrastructure": ["work", "works"] };
  const PILLAR_ORDER = ["Houses of Worship", "Reforestation & Land", "Food & Clothing", "Clean Water", "Hospitals", "Schools", "Livestock & Enterprise", "Sustainable Infrastructure"];

  const Seal = ({ size = 26 }) => h("svg", { width: size, height: size, viewBox: "0 0 36 36" },
    h("g", { fill: "none", stroke: GOLD, strokeWidth: "1.2" },
      h("path", { d: "M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" }),
      h("circle", { cx: "18", cy: "18", r: "4", fill: GOLD, stroke: "none" })));

  const ProofPage = ({ onExit, onDonate, onScholars }) => {
    const read = () => {
      const st = window.BrialStore;
      if (!st) return { m: null, grants: [] };
      const m = st.getPublicMetrics ? st.getPublicMetrics() : null;
      const grants = (st.getPillarGrants ? st.getPillarGrants() : []).filter(g => !g.archived);
      return { m, grants };
    };
    const [st, setSt] = useState(read);
    useEffect(() => {
      window.scrollTo(0, 0);
      const f = () => setSt(read());
      window.addEventListener("brial:change", f);
      window.addEventListener("brial:ready", f);
      return () => { window.removeEventListener("brial:change", f); window.removeEventListener("brial:ready", f); };
    }, []);
    const m = st.m || {};
    const groups = PILLAR_ORDER.map(p => ({ pillar: p, rows: st.grants.filter(g => g.pillar === p).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)) })).filter(g => g.rows.length);
    const pillarTotal = st.grants.reduce((a, g) => a + (Number(g.amount) || 0), 0);
    return h("div", { style: { minHeight: "100vh", background: NAVY, color: CREAM, fontFamily: sans }, "data-screen-label": "Open Ledger" },
      h("div", { style: { position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px clamp(20px, 4vw, 56px)", background: "rgba(10,22,40,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(201,169,97,0.15)" } },
        h("button", { onClick: onExit, style: { background: "transparent", border: "1px solid rgba(232,228,220,0.25)", color: "rgba(232,228,220,0.8)", padding: "9px 16px", cursor: "pointer", fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", minHeight: 40, flexShrink: 0 }, "aria-label": "Return to the Endowment" }, "\u2190", h("span", { className: "b-hide-sm" }, " Return to the Endowment")),
        h("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, h(Seal, null), h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.2em", color: "rgba(232,228,220,0.7)" } }, "THE OPEN LEDGER"))),

      h("div", { style: { padding: "clamp(56px, 8vw, 100px) clamp(20px, 4vw, 56px) clamp(40px, 5vw, 60px)", maxWidth: 1160, margin: "0 auto" } },
        h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.24em", textTransform: "uppercase" } }, "\u00a7 Proof of giving"),
        h("h1", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(46px, 7vw, 92px)", lineHeight: 1, letterSpacing: "-0.02em", margin: "24px 0 0" } }, "The Open Ledger."),
        h("p", { style: { fontFamily: serif, fontStyle: "italic", fontSize: "clamp(19px, 2.2vw, 26px)", color: "rgba(232,228,220,0.75)", margin: "22px 0 0", maxWidth: 620, lineHeight: 1.45 } }, "Every grant the endowment has made: dated, named, and totalled live from the public database. Every gift is applied in full, with nothing deducted.")),

      h("div", { style: { background: CREAM, color: NAVY, padding: "clamp(40px, 6vw, 64px) clamp(20px, 4vw, 56px)" } },
        h("div", { style: { maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "clamp(26px, 4vw, 56px)" } },
          [[fmtM(m.disbursed), "Total distributed \u00b7 all pillars"], [fmtM(m.scholarsDisbursed), "Paid directly to scholars"], [fmtM(pillarTotal), "Pillar grants \u00b7 " + st.grants.length + " recorded"]].map((s, i) =>
            h("div", { key: i },
              h("div", { style: { fontFamily: serif, fontSize: "clamp(44px, 5vw, 64px)", lineHeight: 1 } }, s[0]),
              h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(10,22,40,0.72)", marginTop: 10 } }, s[1]))))),

      h("div", { style: { padding: "clamp(50px, 7vw, 80px) clamp(20px, 4vw, 56px)", maxWidth: 1160, margin: "0 auto" } },
        h("div", { style: { border: "1px solid rgba(201,169,97,0.3)", background: "rgba(232,228,220,0.03)", padding: "clamp(24px, 4vw, 40px)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" } },
          h("div", { style: { minWidth: 240 } },
            h("div", { style: { fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase" } }, "\u00a7 Scholarships"),
            h("div", { style: { fontFamily: serif, fontSize: "clamp(26px, 3vw, 36px)", marginTop: 12 } }, fmtM(m.scholarsDisbursed), h("span", { style: { fontSize: "0.55em", color: "rgba(232,228,220,0.6)", fontStyle: "italic" } }, "  paid directly to students")),
            h("div", { style: { fontFamily: sans, fontSize: 13.5, fontWeight: 300, color: "rgba(232,228,220,0.65)", marginTop: 10, maxWidth: 520, lineHeight: 1.7 } }, (m.awardeeCount || 0) + " scholar" + ((m.awardeeCount || 0) === 1 ? "" : "s") + " funded, tuition settled semester by semester, never through an intermediary. The scholars themselves stand in the public gallery.")),
          onScholars ? h("button", { onClick: onScholars, style: { background: "transparent", border: "1px solid rgba(201,169,97,0.5)", color: GOLD, padding: "14px 26px", cursor: "pointer", fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", flex: "none" } }, "Meet the scholars \u2192") : null),

        groups.length === 0 ? h("div", { style: { fontFamily: serif, fontStyle: "italic", fontSize: 22, color: "rgba(232,228,220,0.66)", marginTop: 56, textAlign: "center" } }, "The first pillar entries are being written.") :
        groups.map(gr => h("section", { key: gr.pillar, style: { marginTop: "clamp(44px, 6vw, 64px)" } },
          h("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", borderBottom: "1px solid rgba(201,169,97,0.35)", paddingBottom: 14 } },
            h("h2", { style: { fontFamily: serif, fontWeight: 400, fontSize: "clamp(26px, 3.2vw, 38px)", margin: 0 } }, gr.pillar),
            h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.18em", color: "rgba(232,228,220,0.66)" } },
              fmtM(gr.rows.reduce((a, g) => a + (Number(g.amount) || 0), 0)),
              (u => u ? " \u00b7 " + gr.rows.reduce((a, g) => a + (Number(g.units) || 0), 0) + " " + u[1] : "")(UNIT_NOUN[gr.pillar]))),
          gr.rows.map(g => h("div", { key: g.id, style: { display: "grid", gridTemplateColumns: "minmax(90px, 130px) 1fr auto", gap: "14px 22px", alignItems: "baseline", padding: "18px 0", borderBottom: "1px solid rgba(232,228,220,0.08)" } },
            h("div", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.14em", color: "rgba(232,228,220,0.66)" } }, g.dateUnknown ? "DATE NOT RECORDED" : fmtD(g.date)),
            h("div", { style: { minWidth: 0 } },
              h("div", { style: { fontFamily: serif, fontSize: 20 } }, g.project || "\u2014"),
              h("div", { style: { fontFamily: sans, fontSize: 12.5, fontWeight: 300, color: "rgba(232,228,220,0.66)", marginTop: 4 } },
                [g.partner, g.country, Number(g.units) > 0 && UNIT_NOUN[gr.pillar] ? g.units + " " + UNIT_NOUN[gr.pillar][Number(g.units) === 1 ? 0 : 1] : null,
                 Number(g.kg) > 0 ? Number(g.kg).toLocaleString("en-US", { maximumFractionDigits: 1 }) + " kg of food" : null,
                 Number(g.garments) > 0 ? g.garments + (Number(g.garments) === 1 ? " garment" : " garments") : null].filter(Boolean).join(" \u00b7 ")),
              g.note ? h("div", { style: { fontFamily: sans, fontSize: 12.5, fontWeight: 300, fontStyle: "italic", color: "rgba(232,228,220,0.66)", marginTop: 4 } }, g.note) : null),
            h("div", { style: { fontFamily: serif, fontSize: 22, color: GOLD, fontVariantNumeric: "tabular-nums" } }, Number(g.amount) > 0 ? fmtM(g.amount) : "\u2014")))))),

      h("div", { style: { padding: "clamp(50px, 8vw, 90px) clamp(20px, 4vw, 56px)", textAlign: "center", borderTop: "1px solid rgba(201,169,97,0.15)" } },
        h("div", { style: { fontFamily: serif, fontStyle: "italic", fontSize: "clamp(20px, 2.6vw, 28px)", color: "rgba(232,228,220,0.8)", maxWidth: 560, margin: "0 auto", lineHeight: 1.5 } }, "What is given is written; what is written is kept."),
        onDonate ? h("button", { onClick: onDonate, style: { marginTop: 34, background: `linear-gradient(120deg, #EAD9A8, ${GOLD} 55%, #B08F4C)`, color: "#131A33", border: "none", padding: "17px 34px", cursor: "pointer", fontFamily: sans, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" } }, "Add to the ledger") : null),
      h("div", { style: { borderTop: "1px solid rgba(201,169,97,0.2)", padding: "26px clamp(20px, 4vw, 56px)", display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" } },
        h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: "rgba(232,228,220,0.66)" } }, "\u00a9 MMXXVI \u00b7 THE BRIAL ENDOWMENT"),
        h("span", { style: { fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: "rgba(232,228,220,0.66)" } }, "LIVE FROM THE PUBLIC DATABASE")));
  };
  window.ProofPage = ProofPage;
})();
