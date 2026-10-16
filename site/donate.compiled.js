(function(){
const {
  useState: useStateD,
  useEffect: useEffectD,
  useMemo: useMemoD,
  useRef: useRefD
} = React;

// ============================================================
// DONATE PAGE — wallet, QR, how-to, form, thank you
// ============================================================

const useDonateStore = () => {
  const [, tick] = useStateD(0);
  useEffectD(() => {
    const h = () => tick(t => t + 1);
    window.addEventListener("brial:change", h);
    return () => window.removeEventListener("brial:change", h);
  }, []);
  return window.BrialStore;
};

// ---------- QR code generator (vendored: qrcode-generator v1.4.4 condensed) ----------
// Source pattern adapted from Kazuhiko Arase's qrcode-generator (MIT).
// We use a tiny native implementation to avoid CDN dependency in standalone HTML.
function makeQR(text, ecLevel = "M") {
  const lib = window.qrcode || window._qrLib;
  if (!lib) return null;
  try {
    const qr = lib(0, ecLevel);
    qr.addData(text);
    qr.make();
    return qr;
  } catch (e) {
    console.warn("QR generation failed", e);
    return null;
  }
}

// SVG rendering of QR — pure JSX
const QRCode = ({
  value,
  size = 240,
  fg = "#0A1628",
  bg = "#F8F4EB"
}) => {
  const qr = useMemoD(() => makeQR(value, "M"), [value]);
  if (!qr) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: size,
        height: size,
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        padding: 16,
        textAlign: "center"
      }
    }, "QR module loading\u2026");
  }
  const count = qr.getModuleCount();
  const cell = size / count;
  const cells = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        cells.push(/*#__PURE__*/React.createElement("rect", {
          key: r + "-" + c,
          x: c * cell,
          y: r * cell,
          width: cell + 0.3,
          height: cell + 0.3,
          fill: fg
        }));
      }
    }
  }
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    style: {
      background: bg,
      display: "block"
    }
  }, cells);
};

// ---------- Copy-to-clipboard helper ----------
const useCopy = () => {
  const [copied, setCopied] = useStateD(null);
  return [copied, async (text, id = "default") => {
    const ok = await window.BrialClipboard.copy(text);
    if (ok) {
      setCopied(id);
      setTimeout(() => setCopied(c => c === id ? null : c), 1400);
    } else {
      alert("Copy failed. Please select the address manually and copy.");
    }
  }];
};
const fmtAmount = n => "$" + (n || 0).toLocaleString("en-US", {
  maximumFractionDigits: 2
});

// ---------- Top nav for donate page ----------
const DonateNav = ({
  onExit,
  onApply
}) => /*#__PURE__*/React.createElement("header", {
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
}, "PATRONAGE \xB7 USDT (ERC-20)"))), /*#__PURE__*/React.createElement("button", {
  onClick: onApply,
  style: {
    background: "transparent",
    border: "1px solid rgba(201,169,97,0.5)",
    color: "#C9A961",
    padding: "8px 16px",
    cursor: "pointer",
    fontFamily: "'Manrope', sans-serif",
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    fontWeight: 500
  }
}, "Apply for Scholarship"));

// ---------- Donation form (right column) ----------
const DonationForm = ({
  wallet,
  onSubmitted
}) => {
  const store = useDonateStore();
  const [form, setForm] = useStateD({
    name: "",
    email: "",
    country: "",
    amount: "",
    message: "",
    txHash: "",
    anonymous: false,
    agreement: false
  });
  const [error, setError] = useStateD(null);
  const [step, setStep] = useStateD("form"); // form | submitting | done

  const update = patch => setForm(f => ({
    ...f,
    ...patch
  }));
  const submit = e => {
    e?.preventDefault();
    setError(null);
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Please enter a donation amount.");
      return;
    }
    if (!form.txHash.trim()) {
      setError("Please paste your transaction hash so we can verify on-chain.");
      return;
    }
    if (!form.agreement) {
      setError("Please confirm you understand donations are non-refundable.");
      return;
    }
    setStep("submitting");
    setTimeout(() => {
      const d = store.submitDonation(form);
      setStep("done");
      onSubmitted?.(d);
    }, 900);
  };
  if (step === "done") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 44,
        background: "linear-gradient(180deg, rgba(134,229,167,0.08), rgba(134,229,167,0.02))",
        border: "1px solid rgba(134,229,167,0.4)",
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 64,
        color: "#86E5A7",
        lineHeight: 1
      }
    }, "\u2713"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "#86E5A7",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        marginTop: 16
      }
    }, "Submission Received"), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 38,
        fontWeight: 400,
        color: "#E8E4DC",
        margin: "12px 0 14px",
        lineHeight: 1.1,
        letterSpacing: "-0.01em"
      }
    }, "Thank you, ", form.anonymous ? "friend of the foundation" : form.name.split(" ")[0] || "patron", "."), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 16,
        lineHeight: 1.7,
        color: "rgba(232,228,220,0.75)",
        margin: 0
      }
    }, "We will reconcile your transaction on-chain and add ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: "#86E5A7"
      }
    }, fmtAmount(form.amount)), " to the foundation's corpus. ", form.email && /*#__PURE__*/React.createElement(React.Fragment, null, "A confirmation receipt will arrive at ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: "#E8E4DC"
      }
    }, form.email), " once the deposit clears ", wallet.confirmations, " confirmations.")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 28,
        padding: "16px 18px",
        background: "rgba(10,22,40,0.5)",
        border: "1px solid rgba(201,169,97,0.18)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: "#C9A961",
        letterSpacing: "0.22em",
        textTransform: "uppercase"
      }
    }, "Your gift becomes:"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 22,
        color: "#E8E4DC",
        marginTop: 8,
        lineHeight: 1.5
      }
    }, "\u2248 ", Math.max(1, Math.round(parseFloat(form.amount) / 13000)), " semester", Math.max(1, Math.round(parseFloat(form.amount) / 13000)) === 1 ? "" : "s", " of tuition for a Brial scholar.")), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setStep("form");
        setForm({
          name: "",
          email: "",
          country: "",
          amount: "",
          message: "",
          txHash: "",
          anonymous: false,
          agreement: false
        });
      },
      style: {
        marginTop: 28,
        padding: "12px 22px",
        background: "transparent",
        border: "1px solid rgba(232,228,220,0.2)",
        color: "rgba(232,228,220,0.8)",
        cursor: "pointer",
        fontFamily: "'Manrope', sans-serif",
        fontSize: 12,
        letterSpacing: "0.16em",
        textTransform: "uppercase"
      }
    }, "Record another donation"));
  }
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    style: {
      padding: 36,
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.18)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 II \u00b7 Record Your Donation"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 30,
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.01em",
      margin: "10px 0 6px",
      lineHeight: 1.1
    }
  }, "Tell us who to thank."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.6)",
      margin: "0 0 24px"
    }
  }, "Send your USDT first using the wallet on the left, then fill this form so we can match your transaction on-chain and acknowledge you in our annual letter (if you wish)."), /*#__PURE__*/React.createElement(DonateInput, {
    label: "Your name or organisation",
    value: form.name,
    onChange: v => update({
      name: v
    }),
    placeholder: form.anonymous ? "(anonymous)" : "Maria Fitri / Pertiwi Foundation",
    disabled: form.anonymous
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(DonateInput, {
    label: "Email (for receipt)",
    type: "email",
    value: form.email,
    onChange: v => update({
      email: v
    }),
    placeholder: "optional"
  }), /*#__PURE__*/React.createElement(DonateInput, {
    label: "Country",
    value: form.country,
    onChange: v => update({
      country: v
    }),
    placeholder: "optional"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Amount in USDT"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 10,
      borderBottom: "1px solid rgba(232,228,220,0.2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 32,
      color: "#C9A961"
    }
  }, "$"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    min: "1",
    step: "any",
    value: form.amount,
    onChange: e => update({
      amount: e.target.value
    }),
    placeholder: "1,000",
    style: {
      flex: 1,
      padding: "12px 0",
      background: "transparent",
      border: "none",
      color: "#E8E4DC",
      fontSize: 28,
      fontFamily: "'Cormorant Garamond', serif",
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.14em"
    }
  }, "USDT")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, [100, 500, 1000, 5000, 10000].map(amt => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: amt,
    onClick: () => update({
      amount: String(amt)
    }),
    style: {
      padding: "6px 12px",
      background: "transparent",
      border: "1px solid rgba(201,169,97,0.3)",
      color: "#C9A961",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.12em"
    }
  }, "$", amt.toLocaleString())))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Transaction hash ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#4FD1C5",
      marginLeft: 4
    }
  }, "\xB7 required")), /*#__PURE__*/React.createElement("input", {
    value: form.txHash,
    onChange: e => update({
      txHash: e.target.value
    }),
    placeholder: "0x8a4f7d3c\u2026",
    style: {
      width: "100%",
      padding: "12px 14px",
      background: "rgba(232,228,220,0.04)",
      border: "1px solid rgba(232,228,220,0.18)",
      color: "#E8E4DC",
      fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
      outline: "none",
      letterSpacing: "0.04em"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.45)",
      marginTop: 6,
      letterSpacing: "0.06em",
      lineHeight: 1.5
    }
  }, "\u21B3 Paste from your wallet (MetaMask \xB7 Trust Wallet \xB7 Binance \xB7 Exchange withdrawal page). Used to verify the transfer.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Message to the scholars (optional)"), /*#__PURE__*/React.createElement("textarea", {
    value: form.message,
    onChange: e => update({
      message: e.target.value
    }),
    placeholder: "A line of encouragement or in-honour-of\u2026",
    style: {
      width: "100%",
      minHeight: 90,
      resize: "vertical",
      background: "rgba(232,228,220,0.04)",
      border: "1px solid rgba(232,228,220,0.18)",
      color: "#E8E4DC",
      padding: 14,
      fontSize: 14,
      fontFamily: "'Cormorant Garamond', serif",
      lineHeight: 1.6,
      outline: "none"
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      marginTop: 22,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.anonymous,
    onChange: e => update({
      anonymous: e.target.checked
    }),
    style: {
      accentColor: "#C9A961"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      color: "rgba(232,228,220,0.7)"
    }
  }, "Donate anonymously: your name will not appear in our annual letter or public ledger.")), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "start",
      marginTop: 14,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.agreement,
    onChange: e => update({
      agreement: e.target.checked
    }),
    style: {
      accentColor: "#C9A961",
      marginTop: 3
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      color: "rgba(232,228,220,0.7)",
      lineHeight: 1.55
    }
  }, "I confirm I have already sent the USDT, I understand that gifts are non-refundable and that blockchain transfers are public and permanent, and I agree to the ", /*#__PURE__*/React.createElement("a", { href: "/terms", target: "_blank", rel: "noopener", onClick: e => e.stopPropagation(), style: { color: "#E3C98A", textDecoration: "underline" } }, "Terms"), " and the ", /*#__PURE__*/React.createElement("a", { href: "/privacy", target: "_blank", rel: "noopener", onClick: e => e.stopPropagation(), style: { color: "#E3C98A", textDecoration: "underline" } }, "Privacy Policy"), ". The endowment uses every gift for its pillars at its discretion, honouring my wishes where it can.")), error && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: "10px 14px",
      background: "rgba(229,134,134,0.08)",
      border: "1px solid rgba(229,134,134,0.35)",
      color: "#E58686",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.06em"
    }
  }, error), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: step === "submitting",
    style: {
      width: "100%",
      marginTop: 26,
      padding: "16px 0",
      background: step === "submitting" ? "rgba(201,169,97,0.5)" : "#C9A961",
      color: "#0A1628",
      border: "none",
      cursor: step === "submitting" ? "wait" : "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 500,
      boxShadow: "0 16px 32px -16px rgba(201,169,97,0.5)"
    }
  }, step === "submitting" ? "Recording…" : "Record Donation →"));
};
const DonateInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "rgba(232,228,220,0.5)",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    marginBottom: 8
  }
}, label), /*#__PURE__*/React.createElement("input", {
  type: type,
  value: value,
  onChange: e => onChange(e.target.value),
  placeholder: placeholder,
  disabled: disabled,
  style: {
    width: "100%",
    padding: "11px 0",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(232,228,220,0.2)",
    color: disabled ? "rgba(232,228,220,0.4)" : "#E8E4DC",
    fontSize: 16,
    fontFamily: "'Cormorant Garamond', serif",
    outline: "none",
    opacity: disabled ? 0.5 : 1
  }
}));

// ============================================================
// MAIN DONATE PAGE
// ============================================================
const DonatePage = ({
  onExit,
  onApply
}) => {
  const store = useDonateStore();
  const wallet = store.walletInfo();
  const pay = store.getPaymentConfig ? store.getPaymentConfig() : {
    usdt: {},
    bank: { bank: "Bank Jago", account: "107540735665", holder: "Brial Asif Hayi Paka", currency: "IDR \xB7 Rupiah" },
    card: {}
  };
  const rawDonations = store.listDonations();
  // Real public gifts only — drop internal aggregates, fold in pillar grants as their own rows
  const donations = (() => {
    const real = (rawDonations || []).filter(d => d.id !== "LEGACY-SUMMARY" && d.id !== "PILLAR-GRANTS" && d.id !== "PILLAR-LINKS" && d.id !== "EBOOKS-CATALOG" && d.id !== "FOODLAND-CONTENT" && d.id !== "PAYMENT-CONFIG" && d.id !== "WORSHIP-CONTENT" && d.id !== "WATER-CONTENT" && d.id !== "PILLAR-STATUS" && String(d.id || "").indexOf("PILLAR-CONTENT-") !== 0 && String(d.name || "").slice(0, 2) !== "__");
    const pillarRows = (store.getPillarGrants ? store.getPillarGrants().filter(g => !g.archived) : []).map(g => ({
      id: g.id,
      name: (g.partner || "Pillar grant") + (g.project ? " · " + g.project : ""),
      anonymous: false,
      amount: g.amount,
      txHash: g.txRef || "",
      submittedAt: g.date,
      verified: true
    }));
    return [...real, ...pillarRows].sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  })();
  const [copied, copy] = useCopy();
  const totalRaised = donations.reduce((a, d) => a + (d.amount || 0), 0);
  const donorCount = donations.length;
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
      opacity: 0.04,
      pointerEvents: "none",
      backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23C9A961' stroke-width='0.5'><path d='M60 10 L70 40 L100 30 L80 55 L110 60 L80 65 L100 90 L70 80 L60 110 L50 80 L20 90 L40 65 L10 60 L40 55 L20 30 L50 40 Z'/></g></svg>\")"
    }
  }), /*#__PURE__*/React.createElement(DonateNav, {
    onExit: onExit,
    onApply: onApply
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      position: "relative",
      maxWidth: 1280,
      margin: "0 auto",
      padding: "56px clamp(20px, 4vw, 56px) 80px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 56,
      maxWidth: 920
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
  }), "Patronage \xB7 Direct to corpus"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(46px, 6vw, 84px)",
      fontWeight: 400,
      lineHeight: 1.02,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "20px 0 24px"
    }
  }, "Underwrite a future ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: "italic",
      color: "#C9A961"
    }
  }, "directly"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 18,
      lineHeight: 1.7,
      fontWeight: 300,
      color: "rgba(232,228,220,0.72)",
      margin: 0,
      maxWidth: 760
    }
  }, "The Brial Endowment accepts USDT on Ethereum (ERC-20). Every dollar arrives in the foundation's wallet, is recorded on-chain, and is disbursed, in full, to a scholar's tuition account within the year. There is no administrative overhead, no fund manager skim, no donor wining-and-dining. Just tuition, paid."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 0,
      background: "rgba(201,169,97,0.12)"
    }
  }, [{
    l: "Patron contributions",
    v: fmtAmount(totalRaised)
  }, {
    l: "Donors on record",
    v: donorCount
  }, {
    l: "Disbursed to scholars",
    v: "100%"
  }].map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "24px 28px",
      background: "rgba(20,36,66,0.55)",
      backdropFilter: "blur(20px)"
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
      fontSize: 36,
      fontWeight: 400,
      color: "#E8E4DC",
      marginTop: 10,
      letterSpacing: "-0.01em",
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap"
    }
  }, t.v))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(320px, 1fr) 1.2fr",
      gap: 32,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 32,
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 I \u00b7 Deposit Wallet"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 28,
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.01em",
      margin: "10px 0 24px",
      lineHeight: 1.1
    }
  }, "Send USDT to this address."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginBottom: 22,
      padding: 20,
      background: "#F8F4EB"
    }
  }, /*#__PURE__*/React.createElement(QRCode, {
    value: wallet.address,
    size: 220
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 6
    }
  }, "USDT Deposit Address"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px",
      background: "rgba(10,22,40,0.5)",
      border: "1px solid rgba(201,169,97,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: "#E8E4DC",
      wordBreak: "break-all",
      lineHeight: 1.5
    }
  }, wallet.address), /*#__PURE__*/React.createElement("button", {
    onClick: () => copy(wallet.address, "addr"),
    style: {
      flexShrink: 0,
      padding: "6px 12px",
      background: copied === "addr" ? "#86E5A7" : "#C9A961",
      color: "#0A1628",
      border: "none",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, copied === "addr" ? "Copied ✓" : "Copy")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Network"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "#E8E4DC",
      marginTop: 6,
      fontWeight: 500
    }
  }, wallet.network, " \xB7 Ethereum")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Asset"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "#E8E4DC",
      marginTop: 6,
      fontWeight: 500
    }
  }, wallet.asset)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: 22,
      background: "rgba(79,209,197,0.05)",
      border: "1px solid rgba(79,209,197,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#4FD1C5",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 14
    }
  }, "How to donate \xB7 USDT (ERC-20)"), /*#__PURE__*/React.createElement("ol", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.75,
      color: "rgba(232,228,220,0.78)",
      paddingLeft: 22,
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("li", null, "Open your wallet: MetaMask, Trust Wallet, an exchange withdrawal page, or similar."), /*#__PURE__*/React.createElement("li", null, "Choose ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "USDT"), " and select ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "Ethereum (ERC-20)"), " network."), /*#__PURE__*/React.createElement("li", null, "Paste the deposit address above (or scan the QR with your phone)."), /*#__PURE__*/React.createElement("li", null, "Enter the amount you wish to donate."), /*#__PURE__*/React.createElement("li", null, "Confirm and complete the transaction. Save the ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "transaction hash"), "."), /*#__PURE__*/React.createElement("li", null, "Return here and fill out the form on the right with your name and tx hash so we can credit you.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: "12px 14px",
      background: "rgba(229,134,134,0.06)",
      border: "1px solid rgba(229,134,134,0.28)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#E58686",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 6
    }
  }, "\u26A0 Important"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12.5,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.75)"
    }
  }, "Send ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "only USDT on ERC-20"), ". Sending other tokens (or USDT on TRC-20/BSC) to this address will result in permanent loss. Deposit appears on our ledger after ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, wallet.confirmations, " confirmations"), ". No deposit fee."))), pay.bank.enabled !== false && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: 32,
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 Alternatif \u00b7 Transfer Rupiah"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 26,
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.01em",
      margin: "10px 0 22px",
      lineHeight: 1.1
    }
  }, "Donate via Indonesian bank."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 6
    }
  }, "Account Number"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px",
      background: "rgba(10,22,40,0.5)",
      border: "1px solid rgba(201,169,97,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 18,
      color: "#E8E4DC",
      letterSpacing: "0.08em"
    }
  }, pay.bank.account), /*#__PURE__*/React.createElement("button", {
    onClick: () => copy(pay.bank.account, "bank"),
    style: {
      flexShrink: 0,
      padding: "6px 12px",
      background: copied === "bank" ? "#86E5A7" : "#C9A961",
      color: "#0A1628",
      border: "none",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, copied === "bank" ? "Copied ✓" : "Copy")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Bank"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "#E8E4DC",
      marginTop: 6,
      fontWeight: 500
    }
  }, pay.bank.bank)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Currency"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "#E8E4DC",
      marginTop: 6,
      fontWeight: 500
    }
  }, pay.bank.currency))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Account Holder"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "#E8E4DC",
      marginTop: 6,
      fontWeight: 500
    }
  }, pay.bank.holder)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: "12px 14px",
      background: "rgba(79,209,197,0.05)",
      border: "1px solid rgba(79,209,197,0.22)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12.5,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.75)"
    }
  }, "Setelah transfer, isi formulir di samping dengan nama dan nominal Anda. Pada kolom ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "transaction hash"), ", cukup tulis ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "\"Transfer " + pay.bank.bank + "\""), " beserta tanggal/jam transfer agar kami dapat mencocokkan donasi Anda."))), pay.card.enabled !== false && pay.card.link && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: 32,
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 Alternatif \u00b7 Kartu / Card"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 26,
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.01em",
      margin: "10px 0 0",
      lineHeight: 1.1
    }
  }, "Donate with Mastercard / Visa.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: "#FFFFFF",
      borderRadius: 4,
      padding: "5px 9px",
      display: "inline-flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "40",
    height: "24",
    viewBox: "0 0 46 28",
    "aria-label": "Mastercard"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "14",
    r: "11",
    fill: "#EB001B"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "14",
    r: "11",
    fill: "#F79E1B"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M23 5.9 A11 11 0 0 1 27 14 A11 11 0 0 1 23 22.1 A11 11 0 0 1 19 14 A11 11 0 0 1 23 5.9 Z",
    fill: "#FF5F00"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "#FFFFFF",
      borderRadius: 4,
      padding: "5px 9px",
      display: "inline-flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "44",
    height: "24",
    viewBox: "0 0 52 28",
    "aria-label": "Visa"
  }, /*#__PURE__*/React.createElement("text", {
    x: "26",
    y: "19.5",
    textAnchor: "middle",
    fontFamily: "Arial Black, Arial, sans-serif",
    fontStyle: "italic",
    fontWeight: "900",
    fontSize: "15",
    fill: "#1A1F71",
    letterSpacing: "0.5"
  }, "VISA"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12.5,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.75)",
      marginTop: 14
    }
  }, "Tanpa dompet kripto dan tanpa aplikasi bank Indonesia: pembayaran kartu diproses melalui halaman mitra resmi kami yang aman. Nominal bebas."), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.open(pay.card.link, "_blank", "noopener,noreferrer"),
    style: {
      marginTop: 18,
      width: "100%",
      padding: "14px 20px",
      background: "linear-gradient(120deg, #EAD9A8, #C9A961 55%, #B08F4C)",
      color: "#131A33",
      border: "none",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10
    }
  }, "Donate via card \u2197"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 11.5,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.5)",
      marginTop: 12
    }
  }, "Setelah pembayaran, isi formulir di samping, tulis ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "rgba(232,228,220,0.8)"
    }
  }, "\"Card / Lynk\""), " pada kolom transaction hash."))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(DonationForm, {
    wallet: wallet
  }))), donations.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 24,
      flexWrap: "wrap",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 III \u00b7 Recent Patrons"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 36,
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.01em",
      margin: "12px 0 0",
      lineHeight: 1.1
    }
  }, "The most recent gifts.")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.1em"
    }
  }, "Anonymous donors appear as \"Anonymous patron\".")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      background: "rgba(201,169,97,0.1)"
    }
  }, donations.slice(0, 6).map(d => /*#__PURE__*/React.createElement("div", {
    key: d.id,
    style: {
      display: "grid",
      gridTemplateColumns: "1.6fr 0.8fr 1.4fr 120px",
      gap: 20,
      padding: "22px 28px",
      background: "rgba(20,36,66,0.5)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      color: "#E8E4DC",
      letterSpacing: "-0.01em"
    }
  }, d.anonymous ? "Anonymous patron" : d.name), d.message && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontStyle: "italic",
      fontSize: 13,
      color: "rgba(232,228,220,0.6)",
      marginTop: 4,
      lineHeight: 1.5
    }
  }, "\"", d.message, "\"")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 30,
      color: "#C9A961",
      fontVariantNumeric: "tabular-nums",
      textAlign: "center"
    }
  }, fmtAmount(d.amount)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.6)",
      textAlign: "center",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, d.txHash || "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 8px",
      background: d.verified ? "rgba(134,229,167,0.14)" : "rgba(201,169,97,0.14)",
      border: `1px solid ${d.verified ? "rgba(134,229,167,0.4)" : "rgba(201,169,97,0.4)"}`,
      color: d.verified ? "#86E5A7" : "#C9A961",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, d.verified ? "✓ Verified" : "Pending"))))))), /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "#060E1C",
      padding: "60px clamp(20px, 4vw, 56px) 30px",
      borderTop: "1px solid rgba(201,169,97,0.15)",
      marginTop: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: "0 auto",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.4)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, "\xA9 MMXXVI \xB7 The Brial Endowment", /*#__PURE__*/React.createElement("br", null), "brialendowment.org"))));
};
window.DonatePage = DonatePage;
})();