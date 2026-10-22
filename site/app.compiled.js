(function(){
const {
  useState,
  useEffect,
  useRef,
  useMemo
} = React;

// ---------- Live metrics from real store data ----------
const useMetrics = () => {
  const [m, setM] = useState(() => window.BrialStore && window.BrialStore.getPublicMetrics ? window.BrialStore.getPublicMetrics() : null);
  useEffect(() => {
    const h = () => {
      if (window.BrialStore && window.BrialStore.getPublicMetrics) setM(window.BrialStore.getPublicMetrics());
    };
    window.addEventListener("brial:change", h);
    window.addEventListener("brial:ready", h);
    h();
    return () => {
      window.removeEventListener("brial:change", h);
      window.removeEventListener("brial:ready", h);
    };
  }, []);
  return m || {
    disbursed: 0,
    awardeeCount: 0,
    liveAwardees: 0,
    nationsCount: 0,
    nations: [],
    schools: [],
    scholarRows: []
  };
};
const fmtMoneyShort = n => {
  n = Number(n) || 0;
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  return "$" + n.toLocaleString("en-US");
};
const titleCaseBE = str => {
  if (!str) return str;
  return String(str).split(/(\s+)/).map(tok => {
    if (/^\s+$/.test(tok) || tok === "") return tok;
    if (/^[A-Z0-9]{2,3}$/.test(tok)) return tok; // keep acronyms (UIN, ETH, D3…)
    return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
  }).join("");
};

// ============================================================
// THE BRIAL ENDOWMENT — Landing Page
// Palette: Navy #0A1628 · Stone #E8E4DC · Gold #C9A961 · Cyan #4FD1C5
// Type:    Cormorant Garamond (display) · Manrope (body) · JetBrains Mono (data)
// ============================================================

// ---------- Seljuk 8-point star pattern (SVG, used as background) ----------
const SeljukPattern = ({
  opacity = 0.06,
  color = "#C9A961"
}) => /*#__PURE__*/React.createElement("svg", {
  width: "0",
  height: "0",
  style: {
    position: "absolute"
  }
}, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("pattern", {
  id: "seljuk",
  x: "0",
  y: "0",
  width: "120",
  height: "120",
  patternUnits: "userSpaceOnUse"
}, /*#__PURE__*/React.createElement("g", {
  fill: "none",
  stroke: color,
  strokeWidth: "0.6",
  opacity: opacity * 10
}, /*#__PURE__*/React.createElement("path", {
  d: "M60 10 L70 40 L100 30 L80 55 L110 60 L80 65 L100 90 L70 80 L60 110 L50 80 L20 90 L40 65 L10 60 L40 55 L20 30 L50 40 Z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M60 30 L78 42 L90 60 L78 78 L60 90 L42 78 L30 60 L42 42 Z"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "0",
  cy: "0",
  r: "1.5",
  fill: color,
  stroke: "none"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "120",
  cy: "0",
  r: "1.5",
  fill: color,
  stroke: "none"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "0",
  cy: "120",
  r: "1.5",
  fill: color,
  stroke: "none"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "120",
  cy: "120",
  r: "1.5",
  fill: color,
  stroke: "none"
}))), /*#__PURE__*/React.createElement("pattern", {
  id: "stoneNoise",
  x: "0",
  y: "0",
  width: "200",
  height: "200",
  patternUnits: "userSpaceOnUse"
}, /*#__PURE__*/React.createElement("filter", {
  id: "stoneFilter"
}, /*#__PURE__*/React.createElement("feTurbulence", {
  type: "fractalNoise",
  baseFrequency: "0.9",
  numOctaves: "2",
  seed: "3"
}), /*#__PURE__*/React.createElement("feColorMatrix", {
  values: "0 0 0 0 0.79  0 0 0 0 0.66  0 0 0 0 0.37  0 0 0 0.04 0"
})), /*#__PURE__*/React.createElement("rect", {
  width: "200",
  height: "200",
  filter: "url(#stoneFilter)"
}))));

// ---------- Hairline divider ("etched stone") ----------
const Etch = ({
  width = "100%"
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    width,
    height: 1,
    background: "linear-gradient(90deg, transparent, rgba(201,169,97,0.35) 20%, rgba(201,169,97,0.55) 50%, rgba(201,169,97,0.35) 80%, transparent)",
    boxShadow: "0 1px 0 rgba(0,0,0,0.4)"
  }
});

// ---------- Eyebrow label ----------
const Eyebrow = ({
  children,
  color = "#C9A961"
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color,
    display: "inline-flex",
    alignItems: "center",
    gap: 12
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    width: 24,
    height: 1,
    background: color,
    opacity: 0.6
  }
}), children);

// ============================================================
// NAV
// ============================================================
const Nav = ({
  onApply,
  onDonate
}) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return /*#__PURE__*/React.createElement("nav", {
    className: "b-nav",
    style: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      padding: scrolled ? "16px clamp(20px, 4vw, 56px)" : "28px clamp(20px, 4vw, 56px)",
      transition: "all 0.35s cubic-bezier(.2,.7,.2,1)",
      background: scrolled ? "rgba(10,22,40,0.78)" : "transparent",
      backdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none",
      borderBottom: scrolled ? "1px solid rgba(201,169,97,0.12)" : "1px solid transparent",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "b-brand",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexShrink: 0,
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    className: "b-brand-logo",
    width: "36",
    height: "36",
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
    stroke: "none",
    opacity: "0.9"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "b-brand-title",
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 19,
      fontWeight: 500,
      color: "#E8E4DC",
      letterSpacing: "0.04em"
    }
  }, "The Brial Endowment"), /*#__PURE__*/React.createElement("div", {
    className: "b-brand-sub",
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.22em",
      color: "#C9A961",
      marginTop: 2
    }
  }, "EST. MMXXIV \xB7 ON-CHAIN"))), /*#__PURE__*/React.createElement("div", {
    className: "b-nav-links",
    style: {
      display: "flex",
      gap: 28,
      alignItems: "center"
    }
  }, ["Mission", "Transparency", "Scholars"].map(item => /*#__PURE__*/React.createElement("a", {
    key: item,
    href: `#${item.toLowerCase()}`,
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      fontWeight: 400,
      letterSpacing: "0.06em",
      color: "rgba(232,228,220,0.78)",
      textDecoration: "none",
      transition: "color 0.2s"
    },
    onMouseEnter: e => e.currentTarget.style.color = "#C9A961",
    onMouseLeave: e => e.currentTarget.style.color = "rgba(232,228,220,0.78)"
  }, item)), /*#__PURE__*/React.createElement("button", {
    className: "b-nav-donate",
    onClick: onDonate,
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      fontWeight: 400,
      letterSpacing: "0.06em",
      color: "rgba(232,228,220,0.78)",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: 0,
      transition: "color 0.2s"
    },
    onMouseEnter: e => e.currentTarget.style.color = "#4FD1C5",
    onMouseLeave: e => e.currentTarget.style.color = "rgba(232,228,220,0.78)"
  }, "Donate"), /*#__PURE__*/React.createElement("button", {
    className: "b-nav-apply",
    onClick: onApply,
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      padding: "10px 20px",
      background: "transparent",
      color: "#C9A961",
      border: "1px solid rgba(201,169,97,0.5)",
      cursor: "pointer",
      transition: "all 0.25s"
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = "#C9A961";
      e.currentTarget.style.color = "#0A1628";
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "#C9A961";
    }
  }, "Apply \u2192")));
};

// ============================================================
// HERO
// ============================================================
const Hero = ({
  onApply,
  onEbooks
}) => {
  const metrics = useMetrics();
  const [block, setBlock] = useState(8472103);
  useEffect(() => {
    const t = setInterval(() => setBlock(b => b + 1), 12000);
    return () => clearInterval(t);
  }, []);
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: "relative",
      minHeight: "100vh",
      padding: "180px 56px 120px",
      overflow: "hidden",
      background: "radial-gradient(ellipse at 70% 30%, #142442 0%, #0A1628 55%, #060E1C 100%)"
    },
    className: "b-hero"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "url(#seljuk)",
      backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23C9A961' stroke-width='0.5' opacity='0.4'><path d='M60 10 L70 40 L100 30 L80 55 L110 60 L80 65 L100 90 L70 80 L60 110 L50 80 L20 90 L40 65 L10 60 L40 55 L20 30 L50 40 Z'/><path d='M60 30 L78 42 L90 60 L78 78 L60 90 L42 78 L30 60 L42 42 Z'/></g></svg>\")",
      opacity: 0.18,
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: -100,
      top: 60,
      bottom: 0,
      width: 700,
      opacity: 0.55,
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 700 900",
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMidYMid meet"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "archGrad",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#C9A961",
    stopOpacity: "0.35"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "60%",
    stopColor: "#C9A961",
    stopOpacity: "0.08"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#C9A961",
    stopOpacity: "0"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "stoneGrad",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#1A2B47",
    stopOpacity: "0.0"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#1A2B47",
    stopOpacity: "0.6"
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M100 900 L100 400 Q100 200 350 60 Q600 200 600 400 L600 900 Z",
    fill: "url(#stoneGrad)",
    stroke: "url(#archGrad)",
    strokeWidth: "1.2"
  }), [40, 80, 120].map((d, i) => /*#__PURE__*/React.createElement("path", {
    key: i,
    d: `M${100 + d} 900 L${100 + d} ${400 + d / 2} Q${100 + d} ${200 + d / 2} 350 ${60 + d} Q${600 - d} ${200 + d / 2} ${600 - d} ${400 + d / 2} L${600 - d} 900 Z`,
    fill: "none",
    stroke: "#C9A961",
    strokeWidth: "0.4",
    opacity: 0.18 - i * 0.04
  })), Array.from({
    length: 12
  }).map((_, i) => /*#__PURE__*/React.createElement("line", {
    key: i,
    x1: "100",
    x2: "600",
    y1: 420 + i * 40,
    y2: 420 + i * 40,
    stroke: "#C9A961",
    strokeWidth: "0.3",
    opacity: "0.1"
  })), /*#__PURE__*/React.createElement("g", {
    transform: "translate(350,140) scale(0.6)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 -40 L11 -11 L40 -8 L18 11 L25 40 L0 24 L-25 40 L-18 11 L-40 -8 L-11 -11 Z",
    fill: "none",
    stroke: "#C9A961",
    strokeWidth: "0.8",
    opacity: "0.5"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      maxWidth: 1280,
      margin: "0 auto",
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 80,
      opacity: 0,
      animation: "fadeIn 0.8s 0.2s forwards"
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "A Sovereign Philanthropic Foundation"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(79,209,197,0.85)",
      letterSpacing: "0.1em",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#4FD1C5",
      boxShadow: "0 0 12px #4FD1C5",
      animation: "pulse 2s infinite"
    }
  }), "LIVE \xB7 BLOCK #", block.toLocaleString())), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(56px, 7.2vw, 116px)",
      fontWeight: 400,
      lineHeight: 0.96,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: 0,
      maxWidth: 1150,
      opacity: 0,
      animation: "rise 1s 0.4s forwards"
    }
  }, "Capital, placed", /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontStyle: "italic",
      color: "#C9A961"
    }
  }, "directly"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(232,228,220,0.65)"
    }
  }, " in the hands of")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block"
    }
  }, "the next generation.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.2fr 1fr",
      gap: 80,
      marginTop: 56,
      alignItems: "end",
      opacity: 0,
      animation: "rise 1s 0.7s forwards"
    },
    className: "b-hero-sub"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 18,
      lineHeight: 1.7,
      fontWeight: 300,
      color: "rgba(232,228,220,0.72)",
      margin: 0,
      maxWidth: 580
    }
  }, "The Brial Endowment holds its capital in trust and never spends it. Its returns go ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: "#E8E4DC",
      fontStyle: "normal",
      fontWeight: 500
    }
  }, "directly to the people they serve"), ", as scholarships, clean water, houses of worship and more, and every dollar is recorded on a public ledger. A gift built to keep giving long after we are gone."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onApply,
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 500,
      padding: "22px 32px",
      background: "linear-gradient(135deg, #C9A961 0%, #B89651 100%)",
      color: "#0A1628",
      border: "none",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "relative",
      transition: "all 0.3s",
      boxShadow: "0 20px 40px -20px rgba(201,169,97,0.5), inset 0 1px 0 rgba(255,255,255,0.25)"
    },
    onMouseEnter: e => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 28px 60px -20px rgba(201,169,97,0.7), inset 0 1px 0 rgba(255,255,255,0.25)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 20px 40px -20px rgba(201,169,97,0.5), inset 0 1px 0 rgba(255,255,255,0.25)";
    }
  }, "Apply for Scholarship", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "serif",
      fontSize: 24,
      fontWeight: 300
    }
  }, "\u2192")), /*#__PURE__*/React.createElement("button", {
    onClick: onEbooks,
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      fontWeight: 400,
      padding: "18px 28px",
      background: "rgba(232,228,220,0.04)",
      color: "rgba(232,228,220,0.85)",
      border: "1px solid rgba(232,228,220,0.18)",
      backdropFilter: "blur(10px)",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, "Global Scholarship E-Book", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      opacity: 0.8
    }
  }, "3 LANGUAGES \u2192")))), /*#__PURE__*/React.createElement("div", {
    className: "b-metrics4",
    style: {
      marginTop: 110,
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 0,
      borderTop: "1px solid rgba(201,169,97,0.15)",
      borderBottom: "1px solid rgba(201,169,97,0.15)",
      padding: "28px 0",
      opacity: 0,
      animation: "rise 1s 1s forwards"
    }
  }, [{
    v: fmtMoneyShort(metrics.disbursed),
    l: "Distributed across all pillars, to date"
  }, {
    v: String(metrics.awardeeCount),
    l: metrics.nationsCount > 0 ? `Scholars across ${metrics.nationsCount} nation${metrics.nationsCount === 1 ? "" : "s"}` : "Scholars funded"
  }, {
    v: "100%",
    l: "Disbursed directly to recipient"
  }, {
    v: "0.00%",
    l: "Administrative overhead"
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "0 32px",
      borderRight: i < 3 ? "1px solid rgba(201,169,97,0.12)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 38,
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.01em"
    }
  }, s.v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "rgba(232,228,220,0.66)",
      marginTop: 8
    }
  }, s.l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 32,
      left: "50%",
      transform: "translateX(-50%)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.66)",
      letterSpacing: "0.24em",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8
    }
  }, "SCROLL \xB7 LEDGER BELOW", /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 32,
      background: "linear-gradient(180deg, transparent, #C9A961)"
    }
  })));
};

// ============================================================
// TRANSPARENCY METRICS — public ledger (live store data only)
// ============================================================
const fmt = n => "$" + n.toLocaleString("en-US");
// Link to the latest published annual impact report (hidden until one is published)
const ImpactReportLink = () => {
  const read = () => window.BrialStore && window.BrialStore.getPublishedImpactReports ? window.BrialStore.getPublishedImpactReports() : [];
  const [list, setList] = useState(read);
  useEffect(() => {
    const h = () => setList(read());
    window.addEventListener("brial:change", h);
    return () => window.removeEventListener("brial:change", h);
  }, []);
  const r = list[0];
  if (!r) return null;
  return /*#__PURE__*/React.createElement("a", {
    href: "/impact/" + r.year,
    style: {
      display: "inline-block",
      marginTop: 18,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "#C9A961",
      textDecoration: "none",
      borderBottom: "1px solid rgba(201,169,97,0.4)",
      paddingBottom: 4
    }
  }, "Read the " + (r.title || r.year + " report") + " \u2192");
};
const Transparency = () => {
  const metrics = useMetrics();
  const total = metrics.disbursed;
  const rows = metrics.institutions || [];
  return /*#__PURE__*/React.createElement("section", {
    id: "transparency",
    style: {
      position: "relative",
      padding: "140px 56px",
      background: "linear-gradient(180deg, #060E1C 0%, #0A1628 100%)",
      borderTop: "1px solid rgba(201,169,97,0.1)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 80,
      marginBottom: 64,
      alignItems: "end"
    },
    className: "b-2col"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "#4FD1C5"
  }, "\xA7 II \xB7 Public Ledger"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(44px, 5.2vw, 78px)",
      fontWeight: 400,
      lineHeight: 1.02,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "24px 0 0"
    }
  }, "Trust, but ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: "#4FD1C5",
      fontStyle: "italic"
    }
  }, "verify"), ".")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 16,
      lineHeight: 1.7,
      fontWeight: 300,
      color: "rgba(232,228,220,0.65)",
      margin: 0
    }
  }, "Every disbursement goes ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: "italic"
    }
  }, "directly to the recipient"), " and is recorded here, from tuition paid to a university to a gift for a village. These are the real institutions and amounts the foundation has funded to date."), /*#__PURE__*/React.createElement(ImpactReportLink, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr",
      gap: 1,
      background: "rgba(201,169,97,0.12)",
      marginBottom: 1
    },
    className: "b-tiles3"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "36px 40px",
      background: "rgba(20,36,66,0.6)",
      backdropFilter: "blur(20px)",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 16,
      right: 20,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#4FD1C5",
      letterSpacing: "0.18em",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#4FD1C5",
      boxShadow: "0 0 10px #4FD1C5",
      animation: "pulse 1.4s infinite"
    }
  }), "VERIFIED"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.66)",
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Total distributed across all pillars"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(40px, 5.5vw, 76px)",
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.02em",
      lineHeight: 1,
      marginTop: 18,
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap"
    }
  }, fmt(total)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(201,169,97,0.7)",
      marginTop: 14,
      letterSpacing: "0.06em"
    }
  }, "Across ", metrics.awardeeCount, " scholar", metrics.awardeeCount === 1 ? "" : "s", metrics.pillarTotal > 0 ? ` + ${fmtMoneyShort(metrics.pillarTotal)} to other pillars` : "", " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(232,228,220,0.66)"
    }
  }, "\xB7 100% direct, 0% overhead"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "36px 32px",
      background: "rgba(20,36,66,0.6)",
      backdropFilter: "blur(20px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.66)",
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Scholars funded"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 56,
      color: "#E8E4DC",
      letterSpacing: "-0.01em",
      marginTop: 18,
      lineHeight: 1
    }
  }, metrics.awardeeCount), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginTop: 22,
      height: 28,
      alignItems: "flex-end"
    }
  }, [0.3, 0.5, 0.4, 0.7, 0.55, 0.8, 0.65, 0.95, 0.85, 1, 0.9, 1.1].map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: `${h * 100}%`,
      background: i === 11 ? "#C9A961" : "rgba(201,169,97,0.32)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.66)",
      marginTop: 10,
      letterSpacing: "0.06em"
    }
  }, "FOUNDED MMXXIV \u2500\u2500\u2500\u2500\u2500\u2500\u2500 GROWING")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "36px 32px",
      background: "rgba(20,36,66,0.6)",
      backdropFilter: "blur(20px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.66)",
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Nations represented"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 56,
      color: "#E8E4DC",
      letterSpacing: "-0.01em",
      marginTop: 18,
      lineHeight: 1
    }
  }, metrics.nationsCount, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 28,
      color: "rgba(232,228,220,0.66)"
    }
  }, " / 195")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(15, 1fr)",
      gap: 2,
      marginTop: 22
    }
  }, Array.from({
    length: 60
  }).map((_, i) => {
    const lit = i < Math.max(metrics.nationsCount, metrics.awardeeCount);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        aspectRatio: "1",
        background: lit ? "#C9A961" : "rgba(232,228,220,0.08)"
      }
    });
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(20,36,66,0.55)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(201,169,97,0.12)",
      borderTop: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 40px",
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      fontWeight: 300,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.6)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#C9A961",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, "Note \xB7 "), "We welcome applicants from ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: "#E8E4DC",
      fontStyle: "italic"
    }
  }, "any university or country"), ". The institutions below are simply where our scholars are enrolled today, and the list grows with every new awardee."), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 40px",
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: 24,
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.66)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("div", null, "Institution"), /*#__PURE__*/React.createElement("div", null, "Country")), rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "56px 40px",
      textAlign: "center",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 24,
      fontStyle: "italic",
      color: "rgba(232,228,220,0.66)"
    }
  }, "The first institutions will appear here as our scholars are funded.") : rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "22px 40px",
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: 24,
      borderBottom: "1px solid rgba(201,169,97,0.08)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 15,
      color: "#E8E4DC",
      fontWeight: 400
    }
  }, titleCaseBE(r.school)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "rgba(232,228,220,0.65)"
    }
  }, titleCaseBE(r.country)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 40px",
      textAlign: "center",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(201,169,97,0.85)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, metrics.schools.length, " institution", metrics.schools.length === 1 ? "" : "s", " supported \xB7 ", metrics.nationsCount, " nation", metrics.nationsCount === 1 ? "" : "s"))));
};

// ============================================================
// MISSION — Dana Abadi (perpetual endowment) + pillars
// ============================================================
const MINANG_LOGO = "data:image/png;base64,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";
window.BRIAL_LOGOS = Object.assign(window.BRIAL_LOGOS || {}, { minang: MINANG_LOGO });
const Philosophy = ({
  onApply,
  onScholars,
  onFoodland,
  onWorship,
  onWater,
  onEbooks,
  onPillarView
}) => {
  const [, __pTick] = useState(0);
  useEffect(() => {
    const f = () => __pTick(t => t + 1);
    window.addEventListener("brial:change", f);
    window.addEventListener("brial:ready", f);
    return () => {
      window.removeEventListener("brial:change", f);
      window.removeEventListener("brial:ready", f);
    };
  }, []);
  const [pillarLinks, setPillarLinks] = useState(() => window.BrialStore && window.BrialStore.getPillarLinks ? window.BrialStore.getPillarLinks() : {});
  useEffect(() => {
    const h = () => {
      if (window.BrialStore && window.BrialStore.getPillarLinks) setPillarLinks(window.BrialStore.getPillarLinks());
    };
    window.addEventListener("brial:change", h);
    window.addEventListener("brial:ready", h);
    h();
    return () => {
      window.removeEventListener("brial:change", h);
      window.removeEventListener("brial:ready", h);
    };
  }, []);
  const pillars = [{
    t: "Scholarships",
    k: "scholarships",
    sub: "Beasiswa",
    status: "active",
    action: "scholars",
    cta: "Meet our scholars →",
    d: "Tuition paid directly to students who would otherwise be priced out of their potential. This is our first pillar: live, funded, and growing.",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "56",
      height: "56",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M32 14 L56 24 L32 34 L8 24 Z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M18 29 L18 42 Q32 50 46 42 L46 29"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "56",
      y1: "24",
      x2: "56",
      y2: "38"
    }))
  }, {
    t: "Houses of Worship",
    k: "worship",
    sub: "Masjid",
    status: "active",
    action: "worship",
    cta: "View the mosque project →",
    partner: {
      src: MINANG_LOGO,
      name: "Minang Bandung"
    },
    d: "In partnership with Minang Bandung Foundation as builder. Brial's grant funds the construction of a mosque, a place that gathers a community and endures long after its builders.",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "56",
      height: "56",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M32 8 Q40 18 40 26 L24 26 Q24 18 32 8 Z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M14 56 L14 30 Q14 26 18 26 L46 26 Q50 26 50 30 L50 56"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "10",
      y1: "56",
      x2: "54",
      y2: "56",
      strokeWidth: "1.4"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "22",
      y1: "56",
      x2: "22",
      y2: "40"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "42",
      y1: "56",
      x2: "42",
      y2: "40"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M28 56 L28 46 Q32 42 36 46 L36 56"
    }))
  }, {
    t: "The Library",
    k: "library",
    sub: "Pustaka",
    status: "active",
    action: "ebooks",
    cta: "Enter the library →",
    partner: {
      src: (window.BRIAL_LOGOS || {}).lynk,
      name: "Lynk · Storefront"
    },
    d: "The endowment's own books and guides, beginning with our scholarship handbooks in three languages. Every copy sold is planted straight back into the fund.",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "56",
      height: "56",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M32 20 Q22 14 10 15 L10 47 Q22 46 32 51 Q42 46 54 47 L54 15 Q42 14 32 20 Z"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "32",
      y1: "20",
      x2: "32",
      y2: "51"
    }))
  }, {
    t: "Reforestation & Land",
    k: "foodland",
    sub: "Penghijauan",
    status: "active",
    action: "foodland",
    cta: "Visit the groves →",
    partner: {
      src: (window.BRIAL_LOGOS || {}).zaytoun,
      name: "Zaytoun · Palestine"
    },
    d: "Trees planted where the land needs them most, beginning with olive groves on Palestinian family land through Zaytoun's Trees for Life programme. Planted once, growing for generations.",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "56",
      height: "56",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M32 52 L32 24"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M32 30 Q20 26 16 16 Q28 16 32 28"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M32 34 Q44 30 48 20 Q36 20 32 32"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M14 52 Q32 44 50 52",
      strokeWidth: "1.3"
    }))
  }, {
    t: "Food & Clothing",
    k: "foodclothing",
    sub: "Sandang & Pangan",
    status: "active",
    action: "foodclothing",
    cta: "Share the table \u2192",
    d: "Staple food and clothing in good condition, shared with orphanages, families and people in need. Every kilogram and every garment is counted in the open.",
    icon: /*#__PURE__*/React.createElement("svg", { viewBox: "0 0 64 64", width: "56", height: "56", fill: "none", stroke: "currentColor", strokeWidth: "1.1" }, /*#__PURE__*/React.createElement("path", { d: "M10 34 H54 Q52 50 32 52 Q12 50 10 34 Z" }), /*#__PURE__*/React.createElement("path", { d: "M25 27 Q22 23 25 19 Q28 15 25 11 M32 27 Q29 23 32 19 Q35 15 32 11 M39 27 Q36 23 39 19 Q42 15 39 11" }), /*#__PURE__*/React.createElement("line", { x1: "20", y1: "57", x2: "44", y2: "57", strokeWidth: "1.4" }))
  }, {
    t: "Clean Water",
    k: "water",
    sub: "Sumur",
    status: "active",
    action: "water",
    cta: "Follow the water →",
    d: "Wells and water systems, the simplest gift that changes everything for a village, drawn fresh for generations.",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "56",
      height: "56",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "18",
      y: "28",
      width: "28",
      height: "28"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "14",
      y1: "56",
      x2: "50",
      y2: "56",
      strokeWidth: "1.4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M22 28 L22 16 L42 16 L42 28"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "18",
      y1: "16",
      x2: "46",
      y2: "16"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M32 36 L32 48 M27 42 Q32 38 37 42"
    }))
  }, {
    t: "Transportation",
    k: "transport",
    action: "transport",
    cta: "See the fleet \u2192",
    sub: "Transportasi",
    status: "active",
    partner: {
      src: "/partners/go2rent/logo-light.svg",
      name: "Car rental"
    },
    d: "Cars on the road across T\u00fcrkiye and Northern Cyprus. Our enterprise pillar: a share of the founder's returns from go2rent is given to the endowment, so the other pillars can keep giving.",
    icon: /*#__PURE__*/React.createElement("svg", { viewBox: "0 0 64 64", width: "56", height: "56", fill: "none", stroke: "currentColor", strokeWidth: "1.1" }, /*#__PURE__*/React.createElement("path", { d: "M10 40 L10 32 L16 22 Q18 19 22 19 L42 19 Q46 19 48 22 L54 32 L54 40 Z" }), /*#__PURE__*/React.createElement("path", { d: "M14 32 L50 32" }), /*#__PURE__*/React.createElement("path", { d: "M20 19 L17 32 M44 19 L47 32" }), /*#__PURE__*/React.createElement("circle", { cx: "20", cy: "42", r: "5" }), /*#__PURE__*/React.createElement("circle", { cx: "44", cy: "42", r: "5" }), /*#__PURE__*/React.createElement("line", { x1: "6", y1: "50", x2: "58", y2: "50", strokeWidth: "1.4" }))
  }, {
    t: "Hospitals",
    k: "hospitals",
    action: "hospitals",
    cta: "Walk the wards →",
    sub: "Rumah Sakit",
    status: "soon",
    d: "Care for those who cannot afford to be sick: clinics and hospitals funded from the corpus, free at the point of need.",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "56",
      height: "56",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "12",
      y: "16",
      width: "40",
      height: "40"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "12",
      y1: "56",
      x2: "52",
      y2: "56",
      strokeWidth: "1.4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M32 26 L32 42 M24 34 L40 34",
      strokeWidth: "1.6"
    }))
  }, {
    t: "Schools",
    k: "schools",
    action: "schools",
    cta: "Visit the classrooms →",
    sub: "Sekolah",
    status: "soon",
    d: "Classrooms and teachers for children where there are none. Education as infrastructure, owned by the community.",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "56",
      height: "56",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M8 26 L32 14 L56 26"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M14 30 L14 52 L50 52 L50 30"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "10",
      y1: "52",
      x2: "54",
      y2: "52",
      strokeWidth: "1.4"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "28",
      y: "40",
      width: "8",
      height: "12"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "24",
      y1: "34",
      x2: "40",
      y2: "34"
    }))
  }, {
    t: "Livestock & Enterprise",
    k: "livestock",
    action: "livestock",
    cta: "Meet the herds →",
    sub: "Ternak",
    status: "soon",
    d: "Herds and small enterprise placed as productive capital: assets that multiply, feed a family, and fund the gift again.",
    icon: /*#__PURE__*/React.createElement("svg", { viewBox: "0 0 64 64", width: "56", height: "56", fill: "none", stroke: "currentColor", strokeWidth: "1.1" }, /*#__PURE__*/React.createElement("path", { d: "M20 16 Q14 20 16 27" }), /*#__PURE__*/React.createElement("path", { d: "M44 16 Q50 20 48 27" }), /*#__PURE__*/React.createElement("path", { d: "M16 27 Q16 42 32 50 Q48 42 48 27 Q40 22 32 24 Q24 22 16 27 Z" }), /*#__PURE__*/React.createElement("circle", { cx: "26", cy: "33", r: "1", fill: "currentColor", stroke: "none" }), /*#__PURE__*/React.createElement("circle", { cx: "38", cy: "33", r: "1", fill: "currentColor", stroke: "none" }), /*#__PURE__*/React.createElement("path", { d: "M28 42 Q32 45 36 42" }))
  }, {
    t: "Sustainable Infrastructure",
    k: "infra",
    action: "infra",
    cta: "Walk the works →",
    sub: "Prasarana",
    status: "soon",
    d: "Bridges, power and public works, the quiet foundations that let a community stand, trade, and endure on its own.",
    icon: /*#__PURE__*/React.createElement("svg", { viewBox: "0 0 64 64", width: "56", height: "56", fill: "none", stroke: "currentColor", strokeWidth: "1.1" }, /*#__PURE__*/React.createElement("line", { x1: "8", y1: "44", x2: "56", y2: "44" }), /*#__PURE__*/React.createElement("path", { d: "M14 44 Q32 18 50 44" }), /*#__PURE__*/React.createElement("line", { x1: "22", y1: "44", x2: "22", y2: "34" }), /*#__PURE__*/React.createElement("line", { x1: "32", y1: "44", x2: "32", y2: "31" }), /*#__PURE__*/React.createElement("line", { x1: "42", y1: "44", x2: "42", y2: "34" }), /*#__PURE__*/React.createElement("line", { x1: "10", y1: "52", x2: "54", y2: "52", strokeWidth: "1.4" }))
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "mission",
    style: {
      position: "relative",
      padding: "160px 56px 140px",
      background: "#E8E4DC",
      color: "#0A1628",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      backgroundImage: "linear-gradient(90deg, transparent 0, transparent calc(100% - 1px), rgba(10,22,40,0.06) 100%)",
      backgroundSize: "120px 100%"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: "radial-gradient(ellipse at top, rgba(201,169,97,0.06), transparent 60%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      maxWidth: 1280,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1.4fr",
      gap: 80,
      marginBottom: 84,
      alignItems: "end"
    },
    className: "b-2col"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "#6B5D32"
  }, "\xA7 I \xB7 Our Mission"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(44px, 5.2vw, 78px)",
      fontWeight: 400,
      lineHeight: 1.02,
      letterSpacing: "-0.02em",
      color: "#0A1628",
      margin: "24px 0 0"
    }
  }, "A perpetual", /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontStyle: "italic",
      color: "#6B5D32"
    }
  }, "endowment.")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: "#6B5D32",
      letterSpacing: "0.24em",
      textTransform: "uppercase",
      marginTop: 18
    }
  }, "Dana Abadi \xB7 Waqf")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 18,
      lineHeight: 1.75,
      fontWeight: 300,
      color: "rgba(10,22,40,0.75)",
      margin: 0,
      maxWidth: 560,
      justifySelf: "end",
      textAlign: "justify",
      textAlignLast: "left"
    }
  }, "The Brial Endowment is a ", /*#__PURE__*/React.createElement("strong", { style: { fontWeight: 500 } }, "perpetual endowment"), ", capital held in trust across generations. Its principal is never spent. Its returns are given, forever, with zero administrative overhead and every movement recorded on a public ledger. Scholarships were our first pillar, and they are only the beginning: from the same enduring fund rise houses of worship, libraries, olive groves, clean water, and the institutions a community needs to stand on its own. What we plant today is meant to keep giving to generations we will never meet.")), /*#__PURE__*/React.createElement("div", {
    className: "b-pillars",
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 1,
      background: "rgba(10,22,40,0.12)",
      border: "1px solid rgba(10,22,40,0.12)"
    }
  }, (() => { const hasStore = !!(window.BrialStore && window.BrialStore.getPillarActive); const resolved = pillars.map(p => hasStore && p.k ? { ...p, status: window.BrialStore.getPillarActive(p.k) ? "active" : "soon" } : p); return resolved.filter(p => p.status === "active").concat(resolved.filter(p => p.status !== "active")); })().map((p, i) => {
    const active = p.status === "active";
    const clickable = p.status === "active" && !!p.action;
    const handleClick = () => {
      if (p.action === "apply") onApply && onApply();else if (p.action === "scholars") onScholars && onScholars();else if (p.action === "foodland") onFoodland && onFoodland();else if (p.action === "worship") onWorship && onWorship();else if (p.action === "water") onWater && onWater();else if (p.action === "ebooks") onEbooks && onEbooks();else if (p.action === "link") window.open(p.link, "_blank", "noopener,noreferrer");else if (p.action && onPillarView) onPillarView(p.action);
    };
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: clickable ? handleClick : undefined,
      role: clickable ? "button" : undefined,
      tabIndex: clickable ? 0 : undefined,
      onKeyDown: clickable ? e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      } : undefined,
      style: {
        background: active ? "#0A1628" : "#E8E4DC",
        color: active ? "#E8E4DC" : "#0A1628",
        padding: "44px 36px 40px",
        position: "relative",
        transition: "background 0.3s, transform 0.2s",
        minHeight: 280,
        cursor: clickable ? "pointer" : "default",
        display: "flex",
        flexDirection: "column"
      },
      onMouseEnter: e => {
        if (!active) e.currentTarget.style.background = "#F0ECE3";
        if (clickable && active) e.currentTarget.style.background = "#0E1D34";
      },
      onMouseLeave: e => {
        if (!active) e.currentTarget.style.background = "#E8E4DC";
        if (clickable && active) e.currentTarget.style.background = "#0A1628";
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 20,
        right: 22,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        padding: "4px 9px",
        color: active ? "#0A1628" : "rgba(10,22,40,0.72)",
        background: active ? "#C9A961" : "transparent",
        border: active ? "none" : "1px solid rgba(10,22,40,0.25)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, active && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: "#0A1628"
      }
    }), active ? "Active" : "Coming soon"), /*#__PURE__*/React.createElement("div", {
      style: {
        color: active ? "#C9A961" : "#6B5D32",
        marginBottom: 26
      }
    }, p.icon), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 30,
        fontWeight: 400,
        lineHeight: 1.05,
        letterSpacing: "-0.01em",
        margin: 0,
        color: active ? "#E8E4DC" : "#0A1628"
      }
    }, p.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: active ? "#C9A961" : "#6B5D32",
        marginTop: 7
      }
    }, p.sub), p.partner && p.partner.src && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginTop: 18,
        padding: "10px 12px",
        flexWrap: "wrap",
        minWidth: 0,
        background: "rgba(232,228,220,0.06)",
        border: "1px solid rgba(201,169,97,0.25)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 13,
        fontStyle: "italic",
        color: "#C9A961"
      }
    }, "The Brial Endowment"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "rgba(232,228,220,0.66)",
        fontSize: 13
      }
    }, "\xD7"), /*#__PURE__*/React.createElement("img", {
      src: p.partner ? p.partner.src : "",
      alt: p.partner ? p.partner.name : "",
      style: {
        height: 24,
        width: "auto",
        display: "block",
        borderRadius: 2
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 11,
        fontWeight: 500,
        color: "rgba(232,228,220,0.85)",
        minWidth: 0
      }
    }, p.partner ? p.partner.name : "")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 1,
        background: active ? "rgba(201,169,97,0.5)" : "#8B7A4A",
        margin: "20px 0"
      }
    }), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 14,
        lineHeight: 1.65,
        fontWeight: 300,
        color: active ? "rgba(232,228,220,0.78)" : "rgba(10,22,40,0.72)",
        margin: 0
      }
    }, p.d), clickable && p.cta && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "auto",
        paddingTop: 22,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#C9A961",
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: 8
      }
    }, p.cta));
  }), /*#__PURE__*/React.createElement("div", {
    className: "b-colophon",
    style: {
      gridColumn: "1 / -1",
      background: "#E8E4DC",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "44px 36px",
      textAlign: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "34",
    height: "34",
    viewBox: "0 0 36 36",
    style: {
      opacity: 0.4
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 4 L22 13 L32 14 L25 21 L27 31 L18 26 L9 31 L11 21 L4 14 L14 13 Z",
    fill: "none",
    stroke: "#8B7A4A",
    strokeWidth: "0.9"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      fontStyle: "italic",
      color: "rgba(10,22,40,0.72)",
      lineHeight: 1.4,
      maxWidth: 420
    }
  }, "More pillars will rise in their season, each one funded, never spent, and built to endure."))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 80,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "end",
      paddingTop: 40,
      borderTop: "1px solid rgba(10,22,40,0.15)",
      gap: 32,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 680
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(10,22,40,0.72)",
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "The principle that binds every pillar"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 30,
      fontStyle: "italic",
      color: "#0A1628",
      marginTop: 14,
      lineHeight: 1.3
    }
  }, "\"We do not spend the gift. We plant it, so that it gives and keeps giving long after we are gone.\""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(10,22,40,0.72)",
      marginTop: 14,
      letterSpacing: "0.1em"
    }
  }, "The Brial Endowment, Founding Charter")), /*#__PURE__*/React.createElement("svg", {
    width: "92",
    height: "92",
    viewBox: "0 0 92 92"
  }, /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "#8B7A4A",
    strokeWidth: "0.8"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "46",
    cy: "46",
    r: "44"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "46",
    cy: "46",
    r: "38",
    strokeDasharray: "2 4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M46 18 L54 38 L74 38 L58 50 L64 70 L46 58 L28 70 L34 50 L18 38 L38 38 Z"
  }), /*#__PURE__*/React.createElement("text", {
    x: "46",
    y: "50",
    textAnchor: "middle",
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 14,
      fontStyle: "italic",
      fill: "#8B7A4A"
    }
  }, "B\xB7E"))))));
};

// ============================================================
// CTA STRIP + FOOTER
// ============================================================
const CtaStrip = ({
  onApply
}) => /*#__PURE__*/React.createElement("section", {
  id: "scholars",
  style: {
    position: "relative",
    padding: "140px 56px",
    background: "radial-gradient(ellipse at 30% 50%, #142442 0%, #0A1628 70%)",
    overflow: "hidden",
    borderTop: "1px solid rgba(201,169,97,0.15)"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    position: "absolute",
    inset: 0,
    opacity: 0.08,
    pointerEvents: "none",
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23C9A961' stroke-width='0.5'><path d='M60 10 L70 40 L100 30 L80 55 L110 60 L80 65 L100 90 L70 80 L60 110 L50 80 L20 90 L40 65 L10 60 L40 55 L20 30 L50 40 Z'/></g></svg>\")"
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: "relative",
    maxWidth: 1100,
    margin: "0 auto",
    textAlign: "center"
  }
}, /*#__PURE__*/React.createElement(Eyebrow, null, "Applications \xB7 Class of 2027"), /*#__PURE__*/React.createElement("h2", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(48px, 6.4vw, 96px)",
    fontWeight: 400,
    lineHeight: 1.02,
    letterSpacing: "-0.02em",
    color: "#E8E4DC",
    margin: "28px 0 24px"
  }
}, "We are ", /*#__PURE__*/React.createElement("em", {
  style: {
    color: "#C9A961",
    fontStyle: "italic"
  }
}, "looking"), " for you."), /*#__PURE__*/React.createElement("p", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 18,
    lineHeight: 1.6,
    fontWeight: 300,
    color: "rgba(232,228,220,0.7)",
    maxWidth: 640,
    margin: "0 auto 48px"
  }
}, "Three hundred scholarships will be awarded for the 2027 academic year. Applications open through 30 November 2026. The first response arrives within fourteen days."), /*#__PURE__*/React.createElement("button", {
  onClick: onApply,
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 14,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 500,
    padding: "24px 48px",
    background: "#C9A961",
    color: "#0A1628",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 30px 60px -20px rgba(201,169,97,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
    transition: "transform 0.25s"
  },
  onMouseEnter: e => e.currentTarget.style.transform = "translateY(-3px)",
  onMouseLeave: e => e.currentTarget.style.transform = "translateY(0)"
}, "Begin Application \u2192"), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 64,
    display: "flex",
    justifyContent: "center",
    gap: 56,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "rgba(232,228,220,0.66)",
    letterSpacing: "0.18em",
    textTransform: "uppercase"
  }
}, /*#__PURE__*/React.createElement("div", null, "~ 18 min to complete"), /*#__PURE__*/React.createElement("div", {
  style: {
    width: 1,
    background: "rgba(232,228,220,0.2)"
  }
}), /*#__PURE__*/React.createElement("div", null, "No fee, no obligation"), /*#__PURE__*/React.createElement("div", {
  style: {
    width: 1,
    background: "rgba(232,228,220,0.2)"
  }
}), /*#__PURE__*/React.createElement("div", null, "Reply within 14 days"))));
// ---------- Footer contact & social links (managed in Founder Portal → Site settings) ----------
const FooterContacts = () => {
  const read = () => window.BrialStore && window.BrialStore.publicContacts ? window.BrialStore.publicContacts() : [];
  const [items, setItems] = useState(read);
  useEffect(() => {
    const h = () => setItems(read());
    window.addEventListener("brial:change", h);
    window.addEventListener("brial:ready", h);
    h();
    return () => {
      window.removeEventListener("brial:change", h);
      window.removeEventListener("brial:ready", h);
    };
  }, []);
  if (!items.length) return null;
  const S = window.BrialStore;
  const lines = items.filter(i => ["email", "phone", "whatsapp", "address"].indexOf(i.type) >= 0);
  const icons = items.filter(i => ["email", "phone", "whatsapp", "address"].indexOf(i.type) < 0);
  const ext = h => h && /^https?:/i.test(h);
  return /*#__PURE__*/React.createElement("div", {
    className: "b-contact",
    style: { marginTop: 28 }
  }, lines.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", flexDirection: "column", gap: 12 }
  }, lines.map((i, k) => /*#__PURE__*/React.createElement(i.href ? "a" : "span", {
    key: "l" + k,
    href: i.href || undefined,
    target: ext(i.href) ? "_blank" : undefined,
    rel: ext(i.href) ? "noopener noreferrer" : undefined,
    className: "b-contact-line",
    style: { display: "inline-flex", alignItems: "flex-start", gap: 12, fontFamily: "'Manrope', sans-serif", fontSize: 14, lineHeight: 1.5, color: "rgba(232,228,220,0.72)", textDecoration: "none", overflowWrap: "anywhere" }
  }, /*#__PURE__*/React.createElement("span", { style: { color: "#C9A961", display: "flex", flexShrink: 0, marginTop: 1 } }, S.contactIcon(i.type, 18)), /*#__PURE__*/React.createElement("span", null, i.type === "whatsapp" ? "WhatsApp " + i.text : i.text)))), icons.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: lines.length ? 22 : 0 }
  }, icons.map((i, k) => /*#__PURE__*/React.createElement("a", {
    key: "s" + k,
    href: i.href || "#",
    target: "_blank",
    rel: "noopener noreferrer",
    title: i.name,
    "aria-label": i.name,
    className: "b-contact-icon",
    style: { width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(201,169,97,0.35)", color: "#C9A961", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s, border-color 0.2s" },
    onMouseEnter: e => { e.currentTarget.style.background = "rgba(201,169,97,0.12)"; e.currentTarget.style.borderColor = "#C9A961"; },
    onMouseLeave: e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(201,169,97,0.35)"; }
  }, S.contactIcon(i.type, 18)))));
};
const Footer = ({
  onAdmin,
  onScholar,
  onDonate,
  onApply,
  onScholars
}) => /*#__PURE__*/React.createElement("footer", {
  id: "trustees",
  style: {
    background: "#060E1C",
    padding: "80px 56px 40px",
    borderTop: "1px solid rgba(201,169,97,0.15)"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 1280,
    margin: "0 auto"
  }
}, /*#__PURE__*/React.createElement("button", {
  onClick: onDonate,
  className: "b-donate-band",
  style: {
    width: "100%",
    background: "linear-gradient(135deg, rgba(201,169,97,0.12), rgba(79,209,197,0.08))",
    border: "1px solid rgba(201,169,97,0.4)",
    color: "#E8E4DC",
    padding: "40px 44px",
    marginBottom: 1,
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 32,
    transition: "background 0.25s"
  },
  onMouseEnter: e => e.currentTarget.style.background = "linear-gradient(135deg, rgba(201,169,97,0.2), rgba(79,209,197,0.12))",
  onMouseLeave: e => e.currentTarget.style.background = "linear-gradient(135deg, rgba(201,169,97,0.12), rgba(79,209,197,0.08))"
}, /*#__PURE__*/React.createElement("div", {
  style: {
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#C9A961",
    letterSpacing: "0.22em",
    textTransform: "uppercase"
  }
}, "\xA7 Patronage \xB7 Donate USDT"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 38,
    color: "#E8E4DC",
    marginTop: 12,
    letterSpacing: "-0.02em",
    lineHeight: 1.05
  }
}, "Underwrite a future ", /*#__PURE__*/React.createElement("em", {
  style: {
    fontStyle: "italic",
    color: "#C9A961"
  }
}, "directly"), "."), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 14,
    color: "rgba(232,228,220,0.65)",
    marginTop: 10,
    maxWidth: 620,
    lineHeight: 1.6
  }
}, "Send USDT on " + ((w => /bep|bsc|bnb/i.test(w) ? "BNB Smart Chain (BEP-20)" : "Ethereum (ERC-20)")(window.BrialStore && window.BrialStore.walletInfo ? window.BrialStore.walletInfo().network : "")) + ", or scan QRIS from any Indonesian bank. 100% goes to the work of the endowment, with no fees and no overhead, and every gift is recorded in the open.")), /*#__PURE__*/React.createElement("div", {
  className: "b-donate-pill",
  style: {
    padding: "16px 28px",
    background: "#C9A961",
    color: "#0A1628",
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 500,
    whiteSpace: "nowrap",
    flexShrink: 0
  }
}, "Donate now \u2192")), /*#__PURE__*/React.createElement("div", {
  className: "b-portal2",
  style: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 1,
    background: "rgba(201,169,97,0.15)",
    marginBottom: 64
  }
}, /*#__PURE__*/React.createElement("button", {
  onClick: onAdmin,
  style: {
    background: "rgba(20,36,66,0.5)",
    border: "none",
    color: "#E8E4DC",
    padding: "36px 40px",
    textAlign: "left",
    cursor: "pointer",
    transition: "background 0.2s",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24
  },
  onMouseEnter: e => e.currentTarget.style.background = "rgba(201,169,97,0.08)",
  onMouseLeave: e => e.currentTarget.style.background = "rgba(20,36,66,0.5)"
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#C9A961",
    letterSpacing: "0.22em",
    textTransform: "uppercase"
  }
}, "\xA7 IV \xB7 Founder Access"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 30,
    color: "#E8E4DC",
    marginTop: 12,
    letterSpacing: "-0.01em"
  }
}, "Founder Portal"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
    color: "rgba(232,228,220,0.66)",
    marginTop: 8,
    maxWidth: 360,
    lineHeight: 1.5
  }
}, "Review the inbox, schedule Zoom interviews, decide on each applicant.")), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "serif",
    fontSize: 32,
    color: "#C9A961"
  }
}, "\u2192")), /*#__PURE__*/React.createElement("button", {
  onClick: onScholar,
  style: {
    background: "rgba(20,36,66,0.5)",
    border: "none",
    color: "#E8E4DC",
    padding: "36px 40px",
    textAlign: "left",
    cursor: "pointer",
    transition: "background 0.2s",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24
  },
  onMouseEnter: e => e.currentTarget.style.background = "rgba(201,169,97,0.08)",
  onMouseLeave: e => e.currentTarget.style.background = "rgba(20,36,66,0.5)"
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#4FD1C5",
    letterSpacing: "0.22em",
    textTransform: "uppercase"
  }
}, "\xA7 V \xB7 Scholar Access"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 30,
    color: "#E8E4DC",
    marginTop: 12,
    letterSpacing: "-0.01em"
  }
}, "Scholar Portal"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
    color: "rgba(232,228,220,0.66)",
    marginTop: 8,
    maxWidth: 360,
    lineHeight: 1.5
  }
}, "Accepted scholars sign in to upload tuition invoices and track disbursements per semester.")), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "serif",
    fontSize: 32,
    color: "#4FD1C5"
  }
}, "\u2192"))), /*#__PURE__*/React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
    gap: 64,
    paddingBottom: 56
  },
  className: "b-foot"
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 14
  }
}, /*#__PURE__*/React.createElement("svg", {
  width: "32",
  height: "32",
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
    fontSize: 22,
    color: "#E8E4DC"
  }
}, "The Brial Endowment")), /*#__PURE__*/React.createElement("p", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
    lineHeight: 1.7,
    color: "rgba(232,228,220,0.66)",
    marginTop: 20,
    maxWidth: 380
  }
}, "A perpetual philanthropic endowment. Given directly, recorded openly, and built to outlast us."), /*#__PURE__*/React.createElement(FooterContacts, null)), [{
  h: "Foundation",
  l: [{
    t: "Charter",
    href: "#mission"
  }, {
    t: "Trustees",
    href: "#trustees"
  }, {
    t: "Reviewers",
    href: "#trustees"
  }, {
    t: "Annual Report",
    href: "/impact"
  }, {
    t: "Privacy Policy",
    href: "/privacy"
  }, {
    t: "Terms",
    href: "/terms"
  }]
}, {
  h: "Ledger",
  l: [{
    t: "Live Disbursements",
    href: "#transparency"
  }, {
    t: "Treasury",
    href: "#transparency"
  }, {
    t: "Open Ledger",
    href: "#/proof"
  }, {
    t: "Smart Contract",
    href: "#transparency"
  }, {
    t: "Audits",
    href: "#transparency"
  }]
}, {
  h: "Scholars",
  l: [{
    t: "Apply",
    onClick: onApply
  }, {
    t: "Eligibility",
    onClick: onApply
  }, {
    t: "Selection",
    href: "#mission"
  }, {
    t: "Past Awardees",
    onClick: onScholars
  }]
}].map(col => /*#__PURE__*/React.createElement("div", {
  key: col.h
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#C9A961",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    marginBottom: 24
  }
}, col.h), /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2
  }
}, col.l.map(item => /*#__PURE__*/React.createElement("a", {
  key: item.t,
  href: item.href || "#",
  onClick: item.onClick ? e => {
    e.preventDefault();
    item.onClick && item.onClick();
  } : undefined,
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 14,
    color: "rgba(232,228,220,0.72)",
    textDecoration: "none",
    cursor: "pointer",
    display: "inline-block",
    padding: "6px 0"
  }
}, item.t)))))), /*#__PURE__*/React.createElement(Etch, null), /*#__PURE__*/React.createElement("div", {
  style: {
    paddingTop: 32,
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "rgba(232,228,220,0.66)",
    letterSpacing: "0.18em",
    textTransform: "uppercase"
  }
}, /*#__PURE__*/React.createElement("div", null, "\xA9 MMXXVI \xB7 The Brial Endowment"), /*#__PURE__*/React.createElement("div", null, "brialendowment.org"))));

// ============================================================
// APP
// ============================================================
const App = () => {
  const BRIAL_VIEWS = ["scholars", "donate", "ebooks", "foodland", "foodclothing", "worship", "water", "hospitals", "schools", "livestock", "infra", "transport", "scholar", "admin", "proof"];
  // Public views have clean addresses (/transport); the portals stay on #/ (/#/scholar, /#/admin).
  const BRIAL_PATHS = ["scholars", "donate", "ebooks", "foodland", "foodclothing", "worship", "water", "hospitals", "schools", "livestock", "infra", "transport", "proof"];
  const parseHashView = () => {
    const m = (location.hash || "").match(/^#\/([a-z]+)/);
    if (m) return BRIAL_VIEWS.indexOf(m[1]) >= 0 ? m[1] : "landing";
    const p = (location.pathname || "/").replace(/\.html$/, "").replace(/\/+$/, "").slice(1);
    return BRIAL_PATHS.indexOf(p) >= 0 ? p : "landing";
  };
  const [view, _setView] = useState(() => (history.state && history.state.brialView) || parseHashView()); // landing | admin | scholar | donate | ...
  const _viewRef = React.useRef(view);
  _viewRef.current = view;
  // Browser back/forward + shareable deep links: every view is a real history entry with its own #/ URL
  const hashFor = v => v === "landing" ? "/" + location.search : BRIAL_PATHS.indexOf(v) >= 0 ? "/" + v + location.search : "/#/" + v;
  const setView = v => {
    if (v !== _viewRef.current) {
      try { history.pushState({ brialView: v }, "", hashFor(v)); } catch (e) {}
    }
    _setView(v);
  };
  useEffect(() => {
    try {
      // keep #section anchors and story deep links (#/water/3); turn old #/pillar links into clean addresses
      const hh = location.hash || "";
      const keepHash = hh && (hh.charAt(1) !== "/" || /^#\/[a-z]+\/\d+/.test(hh));
      history.replaceState(Object.assign({}, history.state || {}, { brialView: _viewRef.current }), "", keepHash ? location.pathname + location.search + hh : hashFor(_viewRef.current));
    } catch (e) {}
    const onPop = e => _setView((e.state && e.state.brialView) || parseHashView());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const [scholarMode, setScholarMode] = useState("signup"); // signup | signin

  // Tab title follows the view
  useEffect(() => {
    const T = { scholars: "Brial Scholars", donate: "Give", ebooks: "The Library", foodland: "Reforestation & Land", foodclothing: "Food & Clothing", worship: "Houses of Worship", water: "Clean Water", transport: "Transportation", hospitals: "Hospitals", schools: "Schools", livestock: "Livestock & Enterprise", infra: "Sustainable Infrastructure", proof: "The Open Ledger", scholar: "Scholar Portal", admin: "Founder Portal" };
    try { document.title = T[view] ? T[view] + " | The Brial Endowment" : "The Brial Endowment | A Perpetual Philanthropic Endowment"; } catch (e) {}
  }, [view]);
  // Always start a new view at the top (fixes landing on previous scroll position)
  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  }, [view]);
  const goToScholar = (mode = "signup") => {
    setScholarMode(mode);
    setView("scholar");
  };
  if (view === "admin" && window.AdminPortal) {
    return /*#__PURE__*/React.createElement(window.AdminPortal, {
      onExit: () => setView("landing")
    });
  }
  if (view === "scholar" && window.ScholarPortal) {
    return /*#__PURE__*/React.createElement(window.ScholarPortal, {
      onExit: () => setView("landing"),
      initialMode: scholarMode
    });
  }
  if (view === "donate" && window.DonatePage) {
    return /*#__PURE__*/React.createElement(window.DonatePage, {
      onExit: () => setView("landing"),
      onApply: () => goToScholar("signup")
    });
  }
  if (view === "scholars" && window.ScholarsShowcase) {
    return /*#__PURE__*/React.createElement(window.ScholarsShowcase, {
      onExit: () => setView("landing"),
      onApply: () => goToScholar("signup")
    });
  }
  if (view === "ebooks" && window.EBooksPage) {
    return /*#__PURE__*/React.createElement(window.EBooksPage, {
      onExit: () => setView("landing")
    });
  }
  if (view === "foodland" && window.FoodLandPage) {
    return /*#__PURE__*/React.createElement(window.FoodLandPage, {
      onExit: () => setView("landing"),
      onDonate: () => setView("donate")
    });
  }
  if (view === "worship" && window.WorshipPage) {
    return /*#__PURE__*/React.createElement(window.WorshipPage, {
      onExit: () => setView("landing"),
      onDonate: () => setView("donate")
    });
  }
  if (view === "water" && window.WaterPage) {
    return /*#__PURE__*/React.createElement(window.WaterPage, {
      onExit: () => setView("landing"),
      onDonate: () => setView("donate")
    });
  }
  if (view === "proof" && window.ProofPage) {
    return /*#__PURE__*/React.createElement(window.ProofPage, {
      onExit: () => setView("landing"),
      onDonate: () => setView("donate"),
      onScholars: () => setView("scholars")
    });
  }
  if (window.BrialPillarPages && window.BrialPillarPages[view]) {
    return /*#__PURE__*/React.createElement(window.BrialPillarPages[view], {
      onExit: () => setView("landing"),
      onDonate: () => setView("donate")
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0A1628",
      minHeight: "100vh"
    }
  }, /*#__PURE__*/React.createElement(SeljukPattern, null), /*#__PURE__*/React.createElement(Nav, {
    onApply: () => goToScholar("signup"),
    onDonate: () => setView("donate")
  }), /*#__PURE__*/React.createElement(Hero, {
    onApply: () => goToScholar("signup"),
    onEbooks: () => setView("ebooks")
  }), /*#__PURE__*/React.createElement(Philosophy, {
    onApply: () => goToScholar("signup"),
    onScholars: () => setView("scholars"),
    onFoodland: () => setView("foodland"),
    onWorship: () => setView("worship"),
    onWater: () => setView("water"),
    onEbooks: () => setView("ebooks"),
    onPillarView: v => setView(v)
  }), /*#__PURE__*/React.createElement(Transparency, null), /*#__PURE__*/React.createElement(CtaStrip, {
    onApply: () => goToScholar("signup")
  }), /*#__PURE__*/React.createElement(Footer, {
    onAdmin: () => setView("admin"),
    onScholar: () => goToScholar("signin"),
    onDonate: () => setView("donate"),
    onApply: () => goToScholar("signup"),
    onScholars: () => setView("scholars")
  }));
};
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})();