(function(){
const {
  useState: useStateE,
  useEffect: useEffectE
} = React;

// ============================================================
// GLOBAL SCHOLARSHIP E-BOOKS — founder-managed catalog
// ============================================================

// ---------- Real cover image ----------
const BookCover = ({
  book
}) => /*#__PURE__*/React.createElement("a", {
  href: book.link,
  target: "_blank",
  rel: "noopener noreferrer",
  style: {
    display: "block",
    position: "relative",
    width: 220,
    flexShrink: 0,
    aspectRatio: "1 / 1.414",
    border: `1px solid ${book.accent || "#C9A961"}55`,
    boxShadow: "0 30px 60px -25px rgba(0,0,0,0.7)",
    overflow: "hidden",
    background: "#0A1628"
  }
}, book.cover ? /*#__PURE__*/React.createElement("img", {
  src: book.cover,
  alt: book.title + " — cover",
  loading: "lazy",
  style: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  }
}) : /*#__PURE__*/React.createElement("div", {
  style: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    textAlign: "center",
    background: `linear-gradient(160deg, #142442, #0A1628)`
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 24,
    color: book.accent || "#C9A961"
  }
}, book.title)));
const EBookSection = ({
  book,
  index
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: 44,
    padding: "48px 0",
    borderTop: index === 0 ? "none" : "1px solid rgba(201,169,97,0.14)",
    alignItems: "center"
  }
}, /*#__PURE__*/React.createElement(BookCover, {
  book: book
}), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: book.accent,
    border: `1px solid ${book.accent}66`,
    padding: "4px 10px"
  }
}, book.langCode, " \xB7 ", book.lang)), /*#__PURE__*/React.createElement("h2", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(30px, 3.4vw, 44px)",
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
    color: "#E8E4DC",
    margin: 0
  }
}, book.title), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22,
    fontStyle: "italic",
    color: book.accent,
    marginTop: 6
  }
}, book.subtitle), /*#__PURE__*/React.createElement("p", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 15.5,
    lineHeight: 1.7,
    fontWeight: 300,
    color: "rgba(232,228,220,0.72)",
    margin: "18px 0 0",
    maxWidth: 640
  }
}, book.desc), /*#__PURE__*/React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px 24px",
    margin: "20px 0 26px",
    maxWidth: 640
  }
}, book.points.map((p, i) => /*#__PURE__*/React.createElement("div", {
  key: i,
  style: {
    display: "flex",
    gap: 10,
    alignItems: "baseline"
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    color: book.accent,
    fontFamily: "serif",
    fontSize: 14,
    flexShrink: 0
  }
}, "\u2726"), /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13.5,
    lineHeight: 1.5,
    color: "rgba(232,228,220,0.8)"
  }
}, p)))), /*#__PURE__*/React.createElement("a", {
  href: book.link,
  target: "_blank",
  rel: "noopener noreferrer",
  style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 14,
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 500,
    padding: "16px 30px",
    background: book.accent,
    color: "#0A1628",
    textDecoration: "none",
    boxShadow: `0 18px 40px -18px ${book.accent}`
  }
}, book.getLabel || "Get the E-Book", /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: "serif",
    fontSize: 20
  }
}, "\u2197")), book.supportNote && /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
    maxWidth: 560
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    color: book.accent,
    fontSize: 14
  }
}, "\u2665"), /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 12.5,
    lineHeight: 1.5,
    fontStyle: "italic",
    color: "rgba(232,228,220,0.6)"
  }
}, book.supportNote))));
const EBooksPage = ({
  onExit
}) => {
  const [books, setBooks] = useStateE(() => window.BrialStore?.listEbooks?.() || []);
  const [, setTickE] = useStateE(0);
  useEffectE(() => {
    const h = () => { setBooks(window.BrialStore?.listEbooks?.() || []); setTickE(t => t + 1); };
    window.addEventListener("brial:change", h);
    window.addEventListener("brial:ready", h);
    return () => {
      window.removeEventListener("brial:change", h);
      window.removeEventListener("brial:ready", h);
    };
  }, []);
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
      justifyContent: "space-between"
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
  }, "\u2190 Public Site"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "28",
    height: "28",
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
      lineHeight: 1.1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      color: "#E8E4DC",
      letterSpacing: "0.02em"
    }
  }, "The Brial Endowment"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.28em",
      color: "#C9A961",
      marginTop: 2
    }
  }, "GLOBAL SCHOLARSHIP E-BOOKS")))), /*#__PURE__*/React.createElement("main", {
    style: {
      position: "relative",
      maxWidth: 1120,
      margin: "0 auto",
      padding: "60px clamp(20px, 4vw, 56px) 100px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 780,
      marginBottom: 20
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
  }), "Global Scholarship E-Books"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(42px, 6vw, 76px)",
      fontWeight: 400,
      lineHeight: 1.02,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "20px 0 22px"
    }
  }, "The knowledge to win a ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: "italic",
      color: "#C9A961"
    }
  }, "scholarship"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 17,
      lineHeight: 1.7,
      fontWeight: 300,
      color: "rgba(232,228,220,0.72)",
      margin: 0
    }
  }, "Three complete master guides for scholarship hunters \u2014 in English, Bahasa Indonesia, and Fran\xE7ais. Everything you need to find, apply for, and secure fully-funded education abroad. Proceeds support the mission of The Brial Endowment."), (() => { const libLink = window.BrialStore?.getPillarLink?.("library") || ""; const libHidden = window.BrialStore?.getPillarLinkHidden?.("library") || false; return libLink && !libHidden ? /*#__PURE__*/React.createElement("a", { href: libLink, target: "_blank", rel: "noopener noreferrer", style: { display: "inline-flex", alignItems: "center", gap: 12, marginTop: 30, padding: "16px 30px", background: "linear-gradient(120deg, #EAD9A8, #C9A961 55%, #B08F4C)", color: "#131A33", textDecoration: "none", fontFamily: "'Manrope', sans-serif", fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" } }, "View all books in our library \u2197") : null; })()), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 30
    }
  }, books.map((b, i) => /*#__PURE__*/React.createElement(EBookSection, {
    key: b.id || i,
    book: b,
    index: i
  })))), /*#__PURE__*/React.createElement("footer", {
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
      color: "rgba(232,228,220,0.45)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, "\xA9 MMXXVI \xB7 The Brial Endowment \xB7 brialendowment.org")));
};
window.EBooksPage = EBooksPage;
})();