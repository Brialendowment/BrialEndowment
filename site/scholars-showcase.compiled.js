(function(){
// ============================================================
// SCHOLARS SHOWCASE — public gallery of Brial scholars
// Opens from the Scholarships pillar. Same vibe as the IG post.
// Photo priority: showcasePhoto (selfie) → biometric image → monogram.
// ============================================================
const {
  useState: useStateSS,
  useEffect: useEffectSS
} = React;
const useShowcaseStore = () => {
  const [, tick] = useStateSS(0);
  useEffectSS(() => {
    const h = () => tick(t => t + 1);
    window.addEventListener("brial:change", h);
    window.addEventListener("brial:ready", h);
    return () => {
      window.removeEventListener("brial:change", h);
      window.removeEventListener("brial:ready", h);
    };
  }, []);
  return window.BrialStore;
};
function isImageFile(f) {
  if (!f) return false;
  const t = (f.type || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  const n = (f.name || f.filename || "").toLowerCase();
  return /\.(png|jpe?g|webp|gif)$/.test(n);
}
function photoUrlFor(applicant) {
  const p = applicant.profile?.personal || {};
  // 1. showcase selfie (preferred)
  if (p.showcasePhoto && (p.showcasePhoto.url || p.showcasePhoto.path)) {
    return p.showcasePhoto.url || window.brialSupabase && window.brialSupabase.publicUrl(p.showcasePhoto.path);
  }
  // 2. biometric photo, only if it's an image
  if (p.photoFile && isImageFile(p.photoFile) && (p.photoFile.url || p.photoFile.path)) {
    return p.photoFile.url || window.brialSupabase && window.brialSupabase.publicUrl(p.photoFile.path);
  }
  return null;
}
function titleCase(str) {
  if (!str) return str;
  return String(str).split(/(\s+)/).map(tok => {
    if (/^\s+$/.test(tok) || tok === "") return tok;
    // keep short all-caps acronyms (UIN, ETH, USP, MIT, D3, S1) as-is
    if (/^[A-Z0-9]{2,3}$/.test(tok)) return tok;
    return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
  }).join("");
}
function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
const ScholarCard = ({
  a
}) => {
  const url = photoUrlFor(a);
  const name = titleCase(a.name);
  const uni = titleCase(a.profile?.university?.name || "—");
  const program = titleCase(a.profile?.university?.program || "");
  const country = titleCase(a.profile?.personal?.country || "");
  const graduated = a.scholarStatus === "graduated";
  const [imgOk, setImgOk] = useStateSS(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.18)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%",
      aspectRatio: "4 / 5",
      background: "linear-gradient(160deg, #142442, #0A1628)",
      overflow: "hidden"
    }
  }, url && imgOk ? /*#__PURE__*/React.createElement("img", {
    src: url,
    alt: name,
    onError: () => setImgOk(false),
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "50% 28%",
      filter: "saturate(.95) contrast(1.02)"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 120,
      height: 120,
      borderRadius: "50%",
      border: "1px solid rgba(201,169,97,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 48,
      color: "#C9A961"
    }
  }, initials(a.name))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, rgba(10,22,40,0) 55%, rgba(10,22,40,0.6) 100%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 14,
      left: 14,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      padding: "4px 9px",
      background: graduated ? "#C9A961" : "rgba(10,22,40,0.7)",
      color: graduated ? "#0A1628" : "#C9A961",
      border: graduated ? "none" : "1px solid rgba(201,169,97,0.5)"
    }
  }, graduated ? "★ Alumnus" : "Brial Scholar")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 22px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 24,
      color: "#E8E4DC",
      lineHeight: 1.1,
      letterSpacing: "-0.01em"
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 1,
      background: "rgba(201,169,97,0.5)",
      margin: "14px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Perguruan Tinggi"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 15,
      color: "#E8E4DC",
      fontWeight: 500,
      marginTop: 4
    }
  }, uni), program && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      color: "rgba(232,228,220,0.65)",
      marginTop: 6
    }
  }, program, country ? ` · ${country}` : "")));
};
const ScholarsShowcase = ({
  onExit,
  onApply
}) => {
  const store = useShowcaseStore();
  const all = store ? store.listApplicants() : [];
  const scholars = all.filter(a => a.status === "accepted" && !a.deleted);
  const legacy = store && store.getLegacy ? store.getLegacy() : null;
  const totalCount = scholars.length + (legacy && legacy.extraScholars ? legacy.extraScholars : 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#0A1628",
      color: "#E8E4DC"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      opacity: 0.05,
      pointerEvents: "none",
      backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23C9A961' stroke-width='0.5'><path d='M60 10 L70 40 L100 30 L80 55 L110 60 L80 65 L100 90 L70 80 L60 110 L50 80 L20 90 L40 65 L10 60 L40 55 L20 30 L50 40 Z'/></g></svg>\")"
    }
  }), /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 30,
      background: "rgba(10,22,40,0.85)",
      backdropFilter: "blur(20px) saturate(140%)",
      borderBottom: "1px solid rgba(201,169,97,0.15)",
      padding: "18px clamp(20px, 4vw, 56px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onExit,
    style: {
      background: "transparent",
      border: "1px solid rgba(232,228,220,0.2)",
      color: "rgba(232,228,220,0.7)",
      padding: "8px 14px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      cursor: "pointer"
    }
  }, "\u2190 Back"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "26",
    height: "26",
    viewBox: "0 0 36 36"
  }, /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "#C9A961",
    strokeWidth: "1.2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "18",
    r: "4",
    fill: "#C9A961",
    stroke: "none"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      color: "#E8E4DC"
    }
  }, "The Brial Endowment")), /*#__PURE__*/React.createElement("button", {
    onClick: onApply,
    style: {
      background: "#C9A961",
      color: "#0A1628",
      border: "none",
      padding: "10px 18px",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, "Apply \u2192")), /*#__PURE__*/React.createElement("main", {
    style: {
      position: "relative",
      maxWidth: 1280,
      margin: "0 auto",
      padding: "60px clamp(20px, 4vw, 56px) 100px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 56,
      maxWidth: 880
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase",
      display: "inline-flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 1,
      background: "#C9A961",
      opacity: 0.6
    }
  }), "Beasiswa \xB7 Our Scholars"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(44px, 6vw, 84px)",
      fontWeight: 400,
      lineHeight: 1.0,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "20px 0 22px"
    }
  }, "The people we ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: "italic",
      color: "#C9A961"
    }
  }, "believed in"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 18,
      lineHeight: 1.7,
      fontWeight: 300,
      color: "rgba(232,228,220,0.72)",
      margin: 0,
      maxWidth: 720
    }
  }, "Every face here is a tuition bill that was paid, a semester that was saved, a future kept on course. These are the Brial scholars, funded directly, studying today, building what comes next.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 0,
      background: "rgba(201,169,97,0.12)",
      marginBottom: 56,
      maxWidth: 520
    }
  }, [{
    l: "Scholars funded",
    v: totalCount > 0 ? totalCount : "—"
  }, {
    l: "Disbursed to tuition",
    v: "100%"
  }].map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "24px 28px",
      background: "rgba(20,36,66,0.55)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, t.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 40,
      color: "#E8E4DC",
      marginTop: 8,
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums"
    }
  }, t.v)))), scholars.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "80px 32px",
      textAlign: "center",
      background: "rgba(20,36,66,0.4)",
      border: "1px solid rgba(201,169,97,0.15)",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 24,
      fontStyle: "italic",
      color: "rgba(232,228,220,0.5)"
    }
  }, "Our first scholars are being onboarded. Check back soon.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: 24
    }
  }, scholars.map(a => /*#__PURE__*/React.createElement(ScholarCard, {
    key: a.id,
    a: a
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 72,
      padding: "44px 48px",
      textAlign: "center",
      background: "radial-gradient(ellipse at 50% 0%, rgba(201,169,97,0.1), transparent 70%)",
      border: "1px solid rgba(201,169,97,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(30px, 4vw, 48px)",
      fontWeight: 400,
      color: "#E8E4DC",
      lineHeight: 1.1
    }
  }, "Could the next face here be ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: "italic",
      color: "#C9A961"
    }
  }, "yours"), "?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 16,
      fontWeight: 300,
      color: "rgba(232,228,220,0.7)",
      margin: "16px auto 28px",
      maxWidth: 560
    }
  }, "Applications are open. Tell us the question you are trying to answer: we fund the people, not the institutions."), /*#__PURE__*/React.createElement("button", {
    onClick: onApply,
    style: {
      background: "#C9A961",
      color: "#0A1628",
      border: "none",
      padding: "16px 32px",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 600,
      boxShadow: "0 16px 36px -16px rgba(201,169,97,0.5)"
    }
  }, "Apply for Scholarship \u2192"))), /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "#060E1C",
      padding: "40px clamp(20px, 4vw, 56px)",
      borderTop: "1px solid rgba(201,169,97,0.15)",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.4)",
      letterSpacing: "0.18em"
    }
  }, "\xA9 MMXXVI \xB7 THE BRIAL ENDOWMENT \xB7 brialendowment.org")));
};
window.ScholarsShowcase = ScholarsShowcase;
})();