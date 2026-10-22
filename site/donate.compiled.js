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

// USDT network label from the configured network (BEP-20 since Oct 2026; the exchange gives one address per network)
const usdtNet = n => {
  const s = String(n || "");
  if (/bep|bsc|bnb|binance/i.test(s)) return { code: "BEP-20", chain: "BNB Smart Chain" };
  if (/polygon|matic/i.test(s)) return { code: "Polygon", chain: "Polygon PoS" };
  if (/arb/i.test(s)) return { code: "Arbitrum", chain: "Arbitrum One" };
  if (/trc|tron/i.test(s)) return { code: "TRC-20", chain: "Tron" };
  return { code: "ERC-20", chain: "Ethereum" };
};
const usdtNetNow = () => usdtNet(window.BrialStore && window.BrialStore.walletInfo ? window.BrialStore.walletInfo().network : "");
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
const fmtAmount = n => { const v = Number(n) || 0; const c = Math.round(v * 100) % 100 !== 0; return "$" + v.toLocaleString("en-US", { minimumFractionDigits: c ? 2 : 0, maximumFractionDigits: 2 }); };

// ---------- Top nav for donate page ----------
const DonateNav = ({
  onExit,
  onApply
}) => /*#__PURE__*/React.createElement("header", {
  className: "b-don-nav",
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
    gap: 12
  }
}, /*#__PURE__*/React.createElement("button", {
  onClick: onExit,
  "aria-label": "Back to the public site",
  style: {
    background: "transparent",
    border: "1px solid rgba(232,228,220,0.24)",
    color: "rgba(232,228,220,0.8)",
    minHeight: 40,
    padding: "0 14px",
    flexShrink: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    cursor: "pointer"
  }
}, "\u2190", /*#__PURE__*/React.createElement("span", { className: "b-hide-sm" }, " Public Site")), /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0
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
    fontSize: 11,
    letterSpacing: "0.16em",
    color: "#C9A961",
    marginTop: 3
  },
  className: "b-hide-sm"
}, "PATRONAGE \xB7 USDT (" + usdtNetNow().code + ") \xB7 QRIS"))), /*#__PURE__*/React.createElement("button", {
  onClick: onApply,
  style: {
    background: "transparent",
    border: "1px solid rgba(201,169,97,0.5)",
    color: "#E3C98A",
    minHeight: 40,
    padding: "0 16px",
    flexShrink: 0,
    cursor: "pointer",
    fontFamily: "'Manrope', sans-serif",
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    fontWeight: 500
  }
}, "Apply", /*#__PURE__*/React.createElement("span", { className: "b-hide-sm" }, " for Scholarship")));

// ---------- Donation form (right column) ----------
// The donation form. Three ways to give, each recorded the way it can be checked:
//   USDT  - the transaction hash; the be-chain worker verifies it on chain.
//   Bank  - the amount in Rupiah, when it was sent and the sender's account name;
//           the founder matches it against the Bank Jago statement.
//   Card  - the amount paid on Lynk and the order number; the founder matches it
//           against the Lynk dashboard (Lynk keeps a fee before paying out).
// The ledger is in US dollars; Rupiah amounts are converted at today's rate and
// the founder confirms the final figure when verifying.
// ---------- Shared look for the donate page ----------
// One set of type sizes and colours, chosen for legibility (WCAG AA contrast on the navy
// background, 11px minimum for labels, 16px inputs so phones do not zoom, 40px+ tap targets).
const DS = {
  mono: "'JetBrains Mono', monospace", serif: "'Cormorant Garamond', serif", sans: "'Manrope', sans-serif",
  gold: "#C9A961", goldSoft: "#E3C98A", ink: "#E8E4DC", body: "rgba(232,228,220,0.8)", mute: "rgba(232,228,220,0.66)",
  line: "rgba(232,228,220,0.22)", card: "rgba(20,36,66,0.55)", edge: "rgba(201,169,97,0.25)", teal: "#4FD1C5", green: "#86E5A7", red: "#E58686"
};
const hD = React.createElement;
const dEyebrow = (t, color) => hD("div", { style: { fontFamily: DS.mono, fontSize: 11, color: color || DS.gold, letterSpacing: "0.22em", textTransform: "uppercase", lineHeight: 1.5 } }, t);
const dLabel = t => hD("div", { style: { fontFamily: DS.mono, fontSize: 11, color: DS.mute, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 } }, t);
const dTitle = (t, mb) => hD("h3", { style: { fontFamily: DS.serif, fontSize: "clamp(26px, 3vw, 30px)", fontWeight: 400, color: DS.ink, letterSpacing: "-0.01em", margin: "10px 0 " + (mb == null ? 18 : mb) + "px", lineHeight: 1.12 } }, t);
const dLocal = t => hD("p", { lang: "id", style: { fontFamily: DS.serif, fontStyle: "italic", fontSize: 17, color: DS.goldSoft, margin: "-8px 0 14px", lineHeight: 1.4 } }, t);
const dBody = (t, extra) => hD("p", { style: { fontFamily: DS.sans, fontSize: 14, lineHeight: 1.65, color: DS.body, margin: 0, ...(extra || {}) } }, t);
const dPanel = { padding: "clamp(22px, 4vw, 32px)", background: DS.card, border: "1px solid " + DS.edge, minWidth: 0 };
const DPair = ({ label, children }) => hD("div", { style: { minWidth: 0 } }, dLabel(label), hD("div", { style: { fontFamily: DS.sans, fontSize: 15, color: DS.ink, fontWeight: 500, lineHeight: 1.4 } }, children));
const DCopyRow = ({ value, id, copied, onCopy, big, label }) => hD("div", { style: { padding: "8px 8px 8px 14px", background: "rgba(10,22,40,0.55)", border: "1px solid rgba(201,169,97,0.24)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } },
  hD("span", { style: { fontFamily: DS.mono, fontSize: big ? 19 : 13, color: DS.ink, wordBreak: "break-all", overflowWrap: "anywhere", lineHeight: 1.5, letterSpacing: big ? "0.08em" : "0.01em", minWidth: 0 } }, value),
  hD("button", { type: "button", onClick: () => onCopy(value, id), "aria-label": "Copy " + (label || "to clipboard"), style: { flexShrink: 0, minHeight: 40, minWidth: 74, padding: "0 14px", background: copied === id ? DS.green : DS.gold, color: "#0A1628", border: "none", cursor: "pointer", fontFamily: DS.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 } }, copied === id ? "Copied ✓" : "Copy"));
const DSteps = ({ items, color }) => hD("ol", { style: { listStyle: "none", padding: 0, margin: "22px 0 0", display: "grid", gap: 12 } },
  items.map((t, i) => hD("li", { key: i, style: { display: "flex", gap: 12, alignItems: "flex-start", fontFamily: DS.sans, fontSize: 14, lineHeight: 1.6, color: DS.body } },
    hD("span", { "aria-hidden": "true", style: { flexShrink: 0, width: 24, height: 24, marginTop: 1, borderRadius: "50%", border: "1px solid " + (color || "rgba(201,169,97,0.55)"), color: color || DS.gold, fontFamily: DS.mono, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" } }, i + 1),
    hD("span", { style: { minWidth: 0 } }, t))));
const dStrong = t => hD("strong", { style: { color: DS.ink, fontWeight: 600 } }, t);

// ---------- QRIS (Indonesia): one static code that every Indonesian bank and e-wallet app can pay ----------
// The QR is drawn from the stored QRIS payload, so it stays sharp. On a phone the donor cannot scan
// their own screen, so "Save QR image" writes a PNG they can pick from the gallery in their bank app.
const saveQrisImage = (payload, info) => {
  const qr = makeQR(payload, "M");
  if (!qr) return;
  const n = qr.getModuleCount(), cell = 12, quiet = 4, qsize = (n + quiet * 2) * cell;
  const W = qsize + 120, H = qsize + 300;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#0A1628"; x.textAlign = "center";
  x.font = "600 44px Manrope, Arial, sans-serif"; x.fillText("QRIS", W / 2, 80);
  x.font = "500 34px Manrope, Arial, sans-serif"; x.fillText("The Brial Endowment", W / 2, 136);
  x.font = "26px 'JetBrains Mono', monospace"; x.fillStyle = "#4A5568"; x.fillText(info.nmid ? "NMID " + info.nmid : "", W / 2, 180);
  const ox = (W - qsize) / 2, oy = 210;
  x.fillStyle = "#0A1628";
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) x.fillRect(ox + (k + quiet) * cell, oy + (r + quiet) * cell, cell, cell);
  x.font = "24px Manrope, Arial, sans-serif"; x.fillStyle = "#4A5568"; x.fillText("brialendowment.org/donate", W / 2, H - 36);
  const a = document.createElement("a"); a.download = "QRIS-The-Brial-Endowment.png"; a.href = c.toDataURL("image/png");
  document.body.appendChild(a); a.click(); a.remove();
};
// Brings the "record your gift" form into view (it already follows the chosen method)
const RecordMethodBtn = ({ method, children }) => hD("button", {
  type: "button", className: "b-don-record",
  onClick: () => {
    window.dispatchEvent(new CustomEvent("brial:donate-method", { detail: method }));
    setTimeout(() => { const f = document.getElementById("donate-form"); if (f) f.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  },
  style: { marginTop: 22, width: "100%", minHeight: 46, padding: "0 18px", background: "transparent", border: "1px solid rgba(201,169,97,0.5)", color: DS.goldSoft, cursor: "pointer", fontFamily: DS.sans, fontSize: 13, fontWeight: 500, letterSpacing: "0.06em" }
}, children);
const QrisCard = ({ qris }) => {
  const store = useDonateStore();
  const info = (store.parseQris && store.parseQris(qris.payload)) || {};
  if (!info.ok) return null;
  return hD("div", { style: dPanel },
    dEyebrow("Step 1 · Pay · Indonesia"),
    dTitle("Scan to give with QRIS.", 14),
    dLocal("Bayar dengan aplikasi bank atau e-wallet apa pun."),
    dBody("Works with every Indonesian bank and e-wallet app: BCA, BRI, Mandiri, BSI, Jago, GoPay, OVO, DANA, ShopeePay. You choose the amount.", { marginBottom: 20 }),
    hD("div", { style: { display: "flex", justifyContent: "center", padding: 18, background: "#FFFFFF" } }, hD(QRCode, { value: qris.payload, size: 220, bg: "#FFFFFF" })),
    hD("div", { style: { textAlign: "center", marginTop: 12 } },
      hD("div", { style: { fontFamily: DS.sans, fontSize: 15, fontWeight: 600, color: DS.ink } }, "The Brial Endowment"),
      info.nmid ? hD("div", { style: { fontFamily: DS.mono, fontSize: 11, letterSpacing: "0.1em", color: DS.mute, marginTop: 4 } }, "NMID " + info.nmid + (qris.provider ? " · " + qris.provider : "")) : null),
    hD("button", { type: "button", onClick: () => saveQrisImage(qris.payload, info), style: { marginTop: 18, width: "100%", minHeight: 46, padding: "0 18px", background: DS.gold, color: "#0A1628", border: "none", cursor: "pointer", fontFamily: DS.sans, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em" } }, "Save QR image ↓"),
    hD("div", { style: { fontFamily: DS.sans, fontSize: 13, lineHeight: 1.6, color: DS.mute, marginTop: 10, textAlign: "center" } },
      "On your phone? Save the image, then choose Scan QR in your bank app and pick it from your gallery."),
    hD(DSteps, { items: [
      "Open your bank or e-wallet app and choose Scan QR (QRIS).",
      "Scan the code, or pick the saved image from your gallery.",
      "Enter any amount and pay The Brial Endowment.",
      "Record your gift with the amount and time. We match it and email your receipt."] }),
    hD(RecordMethodBtn, { method: "qris" }, "I have paid · record my gift →"));
};
const DONATE_METHODS = [["usdt", "USDT (crypto)"], ["qris", "QRIS (Indonesia)"], ["bank", "Bank transfer (IDR)"], ["wire", "International wire (USD/EUR)"], ["card", "Card via Lynk"]];
// The ways to give that are switched on and complete in Payment channels, in display order
const availableMethods = (store, pay) => DONATE_METHODS.filter(([k]) =>
  k === "qris" ? !!(pay.qris && pay.qris.enabled !== false && pay.qris.payload && store.parseQris && store.parseQris(pay.qris.payload).ok)
  : k === "card" ? !!(pay.card && pay.card.enabled !== false && pay.card.link)
  : k === "wire" ? !!(pay.wire && pay.wire.enabled !== false && pay.wire.account && pay.wire.swift)
  : (!pay[k] || pay[k].enabled !== false));
const methodMeta = (k, wallet, pay) => ({
  usdt: { where: "Worldwide", title: "USDT", sub: usdtNet(wallet.network).code + (wallet.autoVerify !== false ? " · verified automatically" : " · " + usdtNet(wallet.network).chain) },
  qris: { where: "Indonesia", title: "QRIS", sub: "Any bank or e-wallet app" },
  bank: { where: "Indonesia", title: "Bank transfer", sub: ((pay.bank && pay.bank.bank) || "Bank") + " · Rupiah · no fee" },
  wire: { where: "Worldwide", title: "Bank wire", sub: wireCurs(pay.wire).join(" · ") + " · SWIFT" },
  card: { where: "Visa · Mastercard", title: "Card", sub: "Secure checkout" }
}[k]);
const fmtIDR = n => "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID");
const fmtUSD = n => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const blankDonation = method => ({ method: method || "usdt", name: "", email: "", country: "", amount: "", idr: "", cardAmount: "", cardCur: "IDR", wireAmount: "", wireCur: "USD", paidAt: "", sender: "", ref: "", message: "", txHash: "", anonymous: false, agreement: false });
const DonationForm = ({
  wallet,
  method,
  methodLabel,
  onSubmitted
}) => {
  const h = React.createElement;
  const store = useDonateStore();
  const pay = store.getPaymentConfig ? store.getPaymentConfig() : { usdt: {}, bank: {}, card: {} };
  const [form, setForm] = useStateD(() => blankDonation(method || "usdt"));
  const [error, setError] = useStateD(null);
  const [step, setStep] = useStateD("form"); // form | submitting | done
  const [fx, setFx] = useStateD(null);
  const [sent, setSent] = useStateD(null);
  const update = patch => setForm(f => ({ ...f, ...patch }));
  useEffectD(() => { if (store.fxRates) store.fxRates().then(setFx).catch(() => {}); }, []);
  // the form follows the method chosen in step 1
  useEffectD(() => { if (method && method !== form.method) { update({ method }); setStep("form"); setError(null); } }, [method]);
  useEffectD(() => { const c = wireCurs(pay.wire); if (c.indexOf(form.wireCur) < 0) update({ wireCur: c[0] }); }, [pay.wire && pay.wire.currencies]);
  const rate = cur => (cur === "USD" ? 1 : fx && fx[cur] ? fx[cur] : (store.FX_FALLBACK || { IDR: 16500 })[cur] || 0);
  const m = form.method;
  const usd = (() => {
    if (m === "usdt") return parseFloat(form.amount) || 0;
    if (m === "bank" || m === "qris") return (parseFloat(form.idr) || 0) / rate("IDR");
    if (m === "wire") { const w = parseFloat(form.wireAmount) || 0; return form.wireCur === "USD" ? w : w / (rate(form.wireCur) || (form.wireCur === "EUR" ? 0.86 : 1.3)); }
    const v = parseFloat(form.cardAmount) || 0;
    return form.cardCur === "USD" ? v : v / rate("IDR");
  })();
  const submit = e => {
    e?.preventDefault();
    setError(null);
    if (m === "usdt") {
      if (!(parseFloat(form.amount) > 0)) return setError("Please enter the amount you sent.");
      if (!form.txHash.trim()) return setError("Please paste your transaction hash so we can verify it on chain.");
    } else if (m === "bank" || m === "qris") {
      if (!(parseFloat(form.idr) >= 1000)) return setError(m === "qris" ? "Please enter the amount you paid, in Rupiah." : "Please enter the amount you transferred, in Rupiah.");
    } else if (m === "wire") {
      if (!(parseFloat(form.wireAmount) > 0)) return setError("Please enter the amount you sent.");
    } else if (!(parseFloat(form.cardAmount) > 0)) return setError("Please enter the amount you paid at the card checkout.");
    if (!form.agreement) return setError("Please confirm you understand donations are non-refundable.");
    const when = form.paidAt ? new Date(form.paidAt) : null;
    const whenTxt = when && !isNaN(when) ? when.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " " + when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
    let txHash = form.txHash.trim(), payment;
    if (m === "usdt") payment = { method: "usdt", currency: "USDT", paid: parseFloat(form.amount) };
    else if (m === "bank" || m === "qris") {
      txHash = [m === "qris" ? "QRIS" : "Bank transfer", fmtIDR(form.idr), whenTxt].filter(Boolean).join(" · ");
      payment = { method: m, currency: "IDR", paid: parseFloat(form.idr), rate: rate("IDR"), paidAt: form.paidAt || "", sender: form.sender.trim(), ref: form.ref.trim() };
    } else if (m === "wire") {
      txHash = ["Bank wire", form.wireCur + " " + (parseFloat(form.wireAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), whenTxt].filter(Boolean).join(" · ");
      payment = { method: "wire", currency: form.wireCur, paid: parseFloat(form.wireAmount), rate: form.wireCur === "USD" ? 1 : (rate(form.wireCur) || (form.wireCur === "EUR" ? 0.86 : 1.3)), paidAt: form.paidAt || "", sender: form.sender.trim(), ref: form.ref.trim() };
    } else {
      const paidTxt = form.cardCur === "USD" ? fmtUSD(form.cardAmount) : fmtIDR(form.cardAmount);
      txHash = ["Card via Lynk", paidTxt, whenTxt].filter(Boolean).join(" · ");
      payment = { method: "card", currency: form.cardCur, paid: parseFloat(form.cardAmount), rate: form.cardCur === "USD" ? 1 : rate("IDR"), paidAt: form.paidAt || "", sender: form.sender.trim(), ref: form.ref.trim() };
    }
    const amount = Math.max(0.01, Math.round(usd * 100) / 100);
    setStep("submitting");
    setTimeout(() => {
      const d = store.submitDonation({ ...form, amount, txHash, payment });
      setSent({ method: m, amount, payment, email: form.email });
      setStep("done");
      onSubmitted?.(d);
    }, 700);
  };
  const mono = "'JetBrains Mono', monospace", serif = "'Cormorant Garamond', serif", sans = "'Manrope', sans-serif";
  const lab = (t, extra, id) => h("label", { htmlFor: id, style: { display: "block", fontFamily: mono, fontSize: 11, color: DS.mute, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 } }, t, extra || null);
  const hint = t => h("div", { style: { fontFamily: sans, fontSize: 13, color: "rgba(232,228,220,0.64)", marginTop: 8, lineHeight: 1.55 } }, t);
  const boxInput = (props) => h("input", { ...props, style: { width: "100%", minHeight: 48, padding: "12px 14px", background: "rgba(232,228,220,0.05)", border: "1px solid " + DS.line, color: "#E8E4DC", fontSize: 16, fontFamily: props.mono === false ? sans : mono, outline: "none", letterSpacing: "0.02em", colorScheme: "dark" }, mono: undefined });
  const bigAmount = (cur, value, onChange, placeholder, after) => h("div", { style: { display: "flex", alignItems: "baseline", gap: 10, borderBottom: "1px solid rgba(232,228,220,0.2)" } },
    h("span", { style: { fontFamily: serif, fontSize: cur === "Rp" ? 24 : 32, color: "#C9A961" } }, cur),
    h("input", { id: "don-amount", type: "number", inputMode: "decimal", min: "0", step: "any", value, onChange: e => onChange(e.target.value), placeholder, style: { flex: 1, minWidth: 0, padding: "12px 0", background: "transparent", border: "none", color: "#E8E4DC", fontSize: 28, fontFamily: serif, outline: "none" } }),
    after || null);
  const approx = usd > 0 && m !== "usdt" && !(m === "card" && form.cardCur === "USD") && !(m === "wire" && form.wireCur === "USD")
    ? hint("About " + fmtUSD(usd) + " at today's rate (" + (m === "wire" ? "1 " + form.wireCur + " = " + fmtUSD(1 / (rate(form.wireCur) || (form.wireCur === "EUR" ? 0.86 : 1.3))) : "1 USD = " + fmtIDR(rate("IDR"))) + (fx && fx.source && fx.source !== "estimate" ? ", " + fx.source : ", estimate") + "). We confirm the final figure when we match your transfer.")
    : null;

  if (step === "done" && sent) {
    const auto = sent.method === "usdt" && wallet.autoVerify !== false;
    const where = sent.method === "qris" ? "our QRIS records" : sent.method === "bank" ? "our Bank Jago statement" : sent.method === "wire" ? "our bank statement" : sent.method === "card" ? "our Lynk dashboard" : "the blockchain";
    return h("div", { role: "status", style: { padding: "clamp(26px, 4vw, 44px)", background: "linear-gradient(180deg, rgba(134,229,167,0.08), rgba(134,229,167,0.02))", border: "1px solid rgba(134,229,167,0.4)", position: "relative" } },
      h("div", { style: { fontFamily: serif, fontSize: 64, color: "#86E5A7", lineHeight: 1 } }, "✓"),
      h("div", { style: { fontFamily: mono, fontSize: 11, color: "#86E5A7", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 16 } }, "Gift recorded"),
      h("h3", { style: { fontFamily: serif, fontSize: 38, fontWeight: 400, color: "#E8E4DC", margin: "12px 0 14px", lineHeight: 1.1, letterSpacing: "-0.01em" } }, "Thank you, truly."),
      h("p", { style: { fontFamily: sans, fontSize: 14, lineHeight: 1.7, color: "rgba(232,228,220,0.75)", margin: 0 } },
        auto ? "We are reading your transaction on chain now. " : "We will match your gift against " + where + ", usually within one or two days. ",
        sent.email ? h(React.Fragment, null, "Your receipt for ", h("strong", { style: { color: "#86E5A7" } }, sent.method === "bank" || sent.method === "qris" ? fmtIDR(sent.payment.paid) : sent.method === "wire" ? sent.payment.currency + " " + Number(sent.payment.paid).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : fmtUSD(sent.amount)), " will arrive at ", h("strong", { style: { color: "#E8E4DC" } }, sent.email), auto ? " once the deposit clears " + wallet.confirmations + " confirmations, usually within a few minutes." : " as soon as it is matched.")
          : "Your gift will appear on our open ledger as soon as it is matched."),
      h("button", { onClick: () => { setStep("form"); setSent(null); setForm(blankDonation(m)); }, style: { marginTop: 28, minHeight: 46, padding: "0 22px", background: "transparent", border: "1px solid rgba(232,228,220,0.2)", color: "rgba(232,228,220,0.8)", cursor: "pointer", fontFamily: sans, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" } }, "Record another donation"));
  }

  const intro = m === "qris" ? "Scan the QRIS code with your bank or e-wallet app and pay any amount, then fill this form with the amount and the time so we can match it." : m === "usdt" ? "Send your USDT first, then fill in this form with the transaction hash. We check it on chain and email your receipt."
    : m === "wire" ? "Send the wire first, then fill in this form with the amount, the currency and the date. We match it against our bank statement; no reference number needed."
    : m === "bank" ? "Transfer to our Bank Jago account first, then fill this form. The amount and the time of the transfer are enough for us to find it; no hash needed."
    : "Pay on the secure card checkout first, then fill in this form with the amount and, if you have it, the order number from your receipt.";
  return h("form", { id: "donate-form", onSubmit: submit, style: { padding: "clamp(22px, 4vw, 36px)", background: DS.card, border: "1px solid rgba(201,169,97,0.22)", scrollMarginTop: 96 } },
    dEyebrow("Step 2 \u00b7 Record your gift"),
    h("h3", { style: { fontFamily: serif, fontSize: 30, fontWeight: 400, color: "#E8E4DC", letterSpacing: "-0.01em", margin: "10px 0 16px", lineHeight: 1.1 } }, "Tell us who to thank."),
    h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: 16, background: "rgba(201,169,97,0.08)", border: "1px solid rgba(201,169,97,0.28)" } },
      h("span", { style: { fontFamily: sans, fontSize: 14, color: DS.body } }, "Paying with ", h("strong", { style: { color: DS.ink, fontWeight: 600 } }, methodLabel || DONATE_METHODS.find(([k]) => k === m)[1])),
      h("button", { type: "button", onClick: () => { const el = document.getElementById("donate-methods"); if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); const b = el.querySelector('[aria-checked="true"]'); if (b) setTimeout(() => b.focus({ preventScroll: true }), 400); } }, style: { minHeight: 36, padding: "0 12px", background: "transparent", border: "1px solid rgba(232,228,220,0.25)", color: DS.goldSoft, cursor: "pointer", fontFamily: sans, fontSize: 13 } }, "Change")),
    h("p", { style: { fontFamily: sans, fontSize: 14, lineHeight: 1.65, color: DS.body, margin: "0 0 24px" } }, intro),
    h(DonateInput, { label: "Your name or organisation", value: form.name, onChange: v => update({ name: v }), placeholder: form.anonymous ? "(anonymous)" : "Maria Fitri / Pertiwi Foundation", disabled: form.anonymous }),
    h("div", { className: "b-don-2col", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 } },
      h(DonateInput, { label: "Email (for receipt)", type: "email", value: form.email, onChange: v => update({ email: v }), placeholder: "optional" }),
      h(DonateInput, { label: "Country", value: form.country, onChange: v => update({ country: v }), placeholder: "optional" })),

    // amount
    h("div", { style: { marginTop: 22 } },
      m === "usdt" ? h(React.Fragment, null,
        lab("Amount in USDT", null, "don-amount"),
        bigAmount("$", form.amount, v => update({ amount: v }), "1,000", h("span", { style: { fontFamily: mono, fontSize: 12, color: DS.mute, letterSpacing: "0.12em" } }, "USDT")),
        h("div", { style: { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" } }, [100, 500, 1000, 5000, 10000].map(amt => h("button", { type: "button", key: amt, onClick: () => update({ amount: String(amt) }), style: { minHeight: 40, padding: "0 14px", background: form.amount === String(amt) ? "rgba(201,169,97,0.18)" : "transparent", border: "1px solid rgba(201,169,97,0.4)", color: "#E3C98A", cursor: "pointer", fontFamily: mono, fontSize: 12, letterSpacing: "0.06em" } }, "$", amt.toLocaleString()))))
      : m === "bank" || m === "qris" ? h(React.Fragment, null,
        lab(m === "qris" ? "Amount paid, in Rupiah" : "Amount transferred, in Rupiah", null, "don-amount"),
        bigAmount("Rp", form.idr, v => update({ idr: v }), "500000"),
        h("div", { style: { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" } }, [100000, 250000, 500000, 1000000, 5000000].map(amt => h("button", { type: "button", key: amt, onClick: () => update({ idr: String(amt) }), style: { minHeight: 40, padding: "0 12px", background: form.idr === String(amt) ? "rgba(201,169,97,0.18)" : "transparent", border: "1px solid rgba(201,169,97,0.4)", color: "#E3C98A", cursor: "pointer", fontFamily: mono, fontSize: 12, letterSpacing: "0.02em" } }, fmtIDR(amt)))),
        approx)
      : m === "wire" ? h(React.Fragment, null,
        lab("Amount sent", null, "don-amount"),
        bigAmount(form.wireCur === "EUR" ? "€" : form.wireCur === "SGD" ? "S$" : "$", form.wireAmount, v => update({ wireAmount: v }), "500",
          h("select", { value: form.wireCur, onChange: e => update({ wireCur: e.target.value }), "aria-label": "Currency", style: { background: "transparent", border: "1px solid " + DS.line, color: "#E8E4DC", fontFamily: mono, fontSize: 16, minHeight: 40, padding: "0 8px", colorScheme: "dark" } },
            wireCurs(store.getPaymentConfig().wire).map(c => h("option", { key: c, value: c }, c)))),
        approx)
      : h(React.Fragment, null,
        lab("Amount paid at the card checkout", null, "don-amount"),
        bigAmount(form.cardCur === "USD" ? "$" : "Rp", form.cardAmount, v => update({ cardAmount: v }), form.cardCur === "USD" ? "50" : "250000",
          h("select", { value: form.cardCur, onChange: e => update({ cardCur: e.target.value }), "aria-label": "Currency", style: { background: "transparent", border: "1px solid " + DS.line, color: "#E8E4DC", fontFamily: mono, fontSize: 16, minHeight: 40, padding: "0 8px", colorScheme: "dark" } },
            h("option", { value: "IDR" }, "IDR"), h("option", { value: "USD" }, "USD"))),
        approx)),

    // reference
    m === "usdt" ? h("div", { style: { marginTop: 22 } },
      lab("Transaction hash ", h("span", { style: { color: "#4FD1C5", marginLeft: 4 } }, "\xB7 required"), "don-tx"),
      boxInput({ id: "don-tx", value: form.txHash, onChange: e => update({ txHash: e.target.value }), placeholder: "0x8a4f7d3c…", spellCheck: false }),
      hint("Copy it from your wallet or the exchange withdrawal page. We use it to confirm your transfer on chain."))
    : h("div", { className: "b-don-2col", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 22 } },
      h("div", null, lab("When you paid", null, "don-when"), boxInput({ id: "don-when", type: "datetime-local", value: form.paidAt, onChange: e => update({ paidAt: e.target.value }), mono: false })),
      m === "qris"
        ? h("div", null, lab("Reference in your app", null, "don-ref"), boxInput({ id: "don-ref", value: form.ref, onChange: e => update({ ref: e.target.value }), placeholder: "optional", spellCheck: false }))
        : m === "bank" || m === "wire"
        ? h("div", null, lab(m === "wire" ? "Sender's name at the bank" : "Sender's account name", null, "don-sender"), boxInput({ id: "don-sender", value: form.sender, onChange: e => update({ sender: e.target.value }), placeholder: "as shown by your bank", mono: false }))
        : h("div", null, lab("Order number", null, "don-order"), boxInput({ id: "don-order", value: form.ref, onChange: e => update({ ref: e.target.value }), placeholder: "from your receipt", spellCheck: false }))),
    m !== "usdt" ? hint(m === "wire" ? "Optional, but it helps us find your wire quickly. Your name stays private and never appears on the site." : m === "qris" ? "The time of payment is usually enough for us to find it. Anything you add stays private." : m === "bank" ? "Optional, but they help us find your transfer quickly. Your account name stays private and never appears on the site." : "Optional, but it helps us find your payment quickly. It stays private.") : null,

    // message
    h("div", { style: { marginTop: 22 } },
      lab("Message to the scholars (optional)", null, "don-msg"),
      h("textarea", { id: "don-msg", value: form.message, onChange: e => update({ message: e.target.value }), placeholder: "A line of encouragement or in-honour-of…", style: { width: "100%", minHeight: 90, resize: "vertical", background: "rgba(232,228,220,0.04)", border: "1px solid " + DS.line, color: "#E8E4DC", padding: 14, fontSize: 17, fontFamily: serif, lineHeight: 1.6, outline: "none" } })),
    h("label", { style: { display: "flex", gap: 12, alignItems: "center", marginTop: 22, cursor: "pointer", minHeight: 40 } },
      h("input", { type: "checkbox", checked: form.anonymous, onChange: e => update({ anonymous: e.target.checked }), style: { accentColor: "#C9A961", colorScheme: "dark", width: 20, height: 20, flexShrink: 0, margin: 0 } }),
      h("span", { style: { fontFamily: sans, fontSize: 14, color: DS.body, lineHeight: 1.5 } }, "Donate anonymously: your name will not appear in our annual letter or public ledger.")),
    h("label", { style: { display: "flex", gap: 12, alignItems: "start", marginTop: 12, cursor: "pointer" } },
      h("input", { type: "checkbox", checked: form.agreement, onChange: e => update({ agreement: e.target.checked }), style: { accentColor: "#C9A961", colorScheme: "dark", width: 20, height: 20, flexShrink: 0, margin: "1px 0 0" } }),
      h("span", { style: { fontFamily: sans, fontSize: 14, color: DS.body, lineHeight: 1.55 } },
        m === "usdt" ? "I confirm I have already sent the USDT, I understand that gifts are non-refundable and that blockchain transfers are public and permanent, and I agree to the " : "I confirm I have already made this payment, I understand that gifts are non-refundable, and I agree to the ",
        h("a", { href: "/terms", target: "_blank", rel: "noopener", onClick: e => e.stopPropagation(), style: { color: "#E3C98A", textDecoration: "underline" } }, "Terms"), " and the ",
        h("a", { href: "/privacy", target: "_blank", rel: "noopener", onClick: e => e.stopPropagation(), style: { color: "#E3C98A", textDecoration: "underline" } }, "Privacy Policy"),
        ". The endowment uses every gift for its pillars at its discretion, honouring my wishes where it can.")),
    error && h("div", { role: "alert", style: { marginTop: 18, padding: "10px 14px", background: "rgba(229,134,134,0.08)", border: "1px solid rgba(229,134,134,0.35)", color: "#F0A3A3", fontFamily: sans, fontSize: 14, lineHeight: 1.5 } }, error),
    h("button", { type: "submit", disabled: step === "submitting", style: { width: "100%", marginTop: 26, minHeight: 54, padding: "0 16px", background: step === "submitting" ? "rgba(201,169,97,0.5)" : "#C9A961", color: "#0A1628", border: "none", cursor: step === "submitting" ? "wait" : "pointer", fontFamily: sans, fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, boxShadow: "0 16px 32px -16px rgba(201,169,97,0.5)" } }, step === "submitting" ? "Recording…" : "Record Donation →"));
};
const DonateInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled
}) => /*#__PURE__*/React.createElement("label", { style: { display: "block" } }, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "rgba(232,228,220,0.66)",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    marginBottom: 4
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
    borderBottom: "1px solid rgba(232,228,220,0.26)",
    color: disabled ? "rgba(232,228,220,0.4)" : "#E8E4DC",
    fontSize: 19,
    minHeight: 46,
    fontFamily: "'Cormorant Garamond', serif",
    outline: "none",
    opacity: disabled ? 0.5 : 1
  }
}));

// ============================================================
// MAIN DONATE PAGE
// Step 1: choose how to give (only that method's details are shown).
// Step 2: record the gift (the form follows the chosen method).
// ?method=qris|bank|card|usdt opens the page on that method.
// ============================================================
const MethodPicker = ({ methods, value, onChange, wallet, pay }) => hD("div", {
  id: "donate-methods", role: "radiogroup", "aria-label": "How would you like to give?", className: "b-don-methods",
  style: { display: "grid", gridTemplateColumns: "repeat(" + methods.length + ", minmax(0, 1fr))", gap: 12, scrollMarginTop: 96 },
  onKeyDown: e => {
    const i = methods.findIndex(([k]) => k === value), d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return; e.preventDefault();
    const k = methods[(i + d + methods.length) % methods.length][0]; onChange(k);
    setTimeout(() => { const b = document.querySelector('#donate-methods [data-method="' + k + '"]'); if (b) b.focus(); }, 0);
  }
}, methods.map(([k]) => {
  const m = methodMeta(k, wallet, pay), on = k === value;
  return hD("button", { key: k, type: "button", role: "radio", "aria-checked": on, tabIndex: on ? 0 : -1, "data-method": k, onClick: () => onChange(k),
    style: { position: "relative", textAlign: "left", minHeight: 108, padding: "16px 16px 14px", background: on ? "linear-gradient(160deg, rgba(201,169,97,0.2), rgba(201,169,97,0.06))" : DS.card, border: "1px solid " + (on ? DS.gold : "rgba(232,228,220,0.16)"), boxShadow: on ? "0 18px 36px -24px rgba(201,169,97,0.7)" : "none", color: DS.ink, cursor: "pointer", transition: "background .2s, border-color .2s", minWidth: 0 } },
    hD("span", { "aria-hidden": "true", style: { position: "absolute", top: 12, right: 12, width: 20, height: 20, borderRadius: "50%", border: "1px solid " + (on ? DS.gold : "rgba(232,228,220,0.3)"), background: on ? DS.gold : "transparent", color: "#0A1628", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" } }, on ? "✓" : ""),
    hD("span", { style: { display: "block", fontFamily: DS.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: on ? DS.goldSoft : DS.mute, paddingRight: 26 } }, m.where),
    hD("span", { style: { display: "block", fontFamily: DS.serif, fontSize: 26, lineHeight: 1.1, marginTop: 8, color: DS.ink } }, m.title),
    hD("span", { style: { display: "block", fontFamily: DS.sans, fontSize: 13, lineHeight: 1.45, marginTop: 6, color: on ? DS.body : DS.mute } }, m.sub));
}));

const UsdtPanel = ({ wallet, copied, copy }) => {
  const net = usdtNet(wallet.network), auto = wallet.autoVerify !== false;
  return hD("div", { style: dPanel },
    dEyebrow("Step 1 · Pay · Worldwide"),
    dTitle("Send USDT to this address."),
    hD("div", { style: { display: "flex", justifyContent: "center", marginBottom: 20, padding: 20, background: "#F8F4EB" } }, hD(QRCode, { value: wallet.address, size: 220 })),
    dLabel("USDT deposit address"),
    hD(DCopyRow, { value: wallet.address, id: "addr", copied, onCopy: copy, label: "the USDT address" }),
    hD("div", { style: { marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
      hD(DPair, { label: "Network" }, net.code + " · " + net.chain),
      hD(DPair, { label: "Asset" }, wallet.asset)),
    auto ? hD("div", { style: { marginTop: 18, display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", background: "rgba(79,209,197,0.07)", border: "1px solid rgba(79,209,197,0.3)", fontFamily: DS.sans, fontSize: 13.5, color: DS.body, lineHeight: 1.5 } },
      hD("span", { "aria-hidden": "true", style: { color: DS.teal, fontSize: 16 } }, "✓"),
      hD("span", null, "Verified automatically on chain. Your receipt usually arrives within minutes.")) : null,
    hD(DSteps, { items: [
      hD(React.Fragment, null, "In your wallet or exchange, choose ", dStrong("USDT"), " on the ", dStrong(net.chain + " (" + net.code + ")"), " network."),
      "Paste the address above, or scan the QR code.",
      hD(React.Fragment, null, "Send any amount, then copy the ", dStrong("transaction hash"), "."),
      auto ? "Record your gift with the hash. We confirm it on chain and email your receipt." : "Record your gift with the hash. We check it on chain and email your receipt."] }),
    hD("div", { role: "note", style: { marginTop: 20, padding: "12px 14px", background: "rgba(229,134,134,0.07)", border: "1px solid rgba(229,134,134,0.32)" } },
      hD("div", { style: { fontFamily: DS.mono, fontSize: 11, color: DS.red, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 } }, "⚠ Important"),
      hD("div", { style: { fontFamily: DS.sans, fontSize: 13.5, lineHeight: 1.6, color: DS.body } },
        "Send ", dStrong("only USDT on " + net.chain + " (" + net.code + ")"), ". Other tokens, or USDT on any other network, sent to this address may be lost. No deposit fee.")),
    hD(RecordMethodBtn, { method: "usdt" }, "I have sent it · record my gift →"));
};

const BankPanel = ({ bank, copied, copy }) => hD("div", { style: dPanel },
  dEyebrow("Step 1 · Pay · Indonesia"),
  dTitle("Transfer from any Indonesian bank.", 14),
  dLocal("Transfer langsung, 100% sampai tanpa potongan."),
  dLabel("Account number"),
  hD(DCopyRow, { value: bank.account, id: "bank", copied, onCopy: copy, big: true, label: "the account number" }),
  hD("div", { style: { marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
    hD(DPair, { label: "Bank" }, bank.bank),
    hD(DPair, { label: "Currency" }, bank.currency)),
  hD("div", { style: { marginTop: 14 } }, hD(DPair, { label: "Account holder" }, bank.holder)),
  hD(DSteps, { items: [
    "Transfer any amount in Rupiah to the account above. Nothing is deducted.",
    "Record your gift with the amount and the time of transfer. No reference number needed.",
    "We match it against our " + bank.bank + " statement and email your receipt."] }),
  hD(RecordMethodBtn, { method: "bank" }, "I have transferred · record my gift →"));

const wireCurs = wire => { const c = String((wire && wire.currencies) || "USD").toUpperCase().match(/USD|EUR|SGD/g); return c && c.length ? [...new Set(c)] : ["USD"]; };
const wireCurText = wire => { const c = wireCurs(wire); return c.length > 1 ? c.slice(0, -1).join(", ") + " or " + c[c.length - 1] : c[0]; };
const WirePanel = ({ wire, copied, copy }) => {
  const rows = [
    ["Beneficiary name", wire.holder, "wname"],
    ["Account number", wire.account, "wacct"],
    ["SWIFT / BIC", wire.swift, "wswift"],
    ["Bank", wire.bank, "wbank"],
    ["Bank address", wire.bankAddress, "wbaddr"],
    ["Beneficiary address", wire.city, "wcity"]
  ].filter(r => r[1]);
  const all = rows.map(r => r[0] + ": " + r[1]).concat(["Currency: " + wireCurs(wire).join(", "), "Purpose: Donation"]).join("\n");
  return hD("div", { style: dPanel },
    dEyebrow("Step 1 · Pay · Worldwide"),
    dTitle("Send a bank wire in " + wireCurText(wire) + ".", 14),
    dBody("From any bank in the world, as an international (SWIFT) transfer" + (wire.bank ? " to our account at " + wire.bank.replace(/^PT\s+/i, "") : "") + ". Please send " + wireCurText(wire) + " only; other currencies cannot be received.", { marginBottom: 20 }),
    hD("div", { style: { display: "grid", gap: 14 } },
      rows.map(([label, value, id]) => hD("div", { key: id },
        dLabel(label),
        id === "wacct" || id === "wswift" || id === "wname"
          ? hD(DCopyRow, { value, id, copied, onCopy: copy, big: id === "wacct", label: label.toLowerCase() })
          : hD("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } },
              hD("span", { style: { fontFamily: DS.sans, fontSize: 15, color: DS.ink, fontWeight: 500, lineHeight: 1.45, minWidth: 0 } }, value),
              hD("button", { type: "button", onClick: () => copy(value, id), "aria-label": "Copy " + label.toLowerCase(), style: { flexShrink: 0, minHeight: 36, padding: "0 12px", background: "transparent", border: "1px solid rgba(201,169,97,0.45)", color: copied === id ? DS.green : DS.goldSoft, cursor: "pointer", fontFamily: DS.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" } }, copied === id ? "Copied ✓" : "Copy")))),
      hD("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
        hD(DPair, { label: "Currency" }, wireCurs(wire).join(", ")),
        hD(DPair, { label: "Purpose" }, "Donation"))),
    hD("button", { type: "button", onClick: () => copy(all, "wall"), style: { marginTop: 18, width: "100%", minHeight: 46, padding: "0 18px", background: copied === "wall" ? DS.green : DS.gold, color: "#0A1628", border: "none", cursor: "pointer", fontFamily: DS.sans, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em" } }, copied === "wall" ? "All details copied ✓" : "Copy all details"),
    hD("div", { style: { marginTop: 14, fontFamily: DS.sans, fontSize: 13, lineHeight: 1.6, color: DS.mute } },
      wire.feeNote || "Your bank may charge to send an international wire, and banks along the way can deduct a small fee. Wires suit gifts of USD 100 or more; for smaller gifts, USDT or QRIS costs less. Gifts above USD 10,000 need a purpose code from your bank: choose donation or gift."),
    hD(DSteps, { items: [
      "In your bank, choose an international (SWIFT) transfer in " + wireCurText(wire) + ".",
      hD(React.Fragment, null, "Enter the details above. If your bank offers it, choose the ", dStrong("OUR"), " charge option so the full amount arrives."),
      "Record your gift with the amount, currency and date. We match it against our bank statement and email your receipt."] }),
    hD(RecordMethodBtn, { method: "wire" }, "I have sent it · record my gift →"));
};

const CardLogos = () => hD("div", { style: { display: "flex", gap: 8, flexShrink: 0 } },
  hD("span", { style: { background: "#FFFFFF", borderRadius: 4, padding: "5px 9px", display: "inline-flex", alignItems: "center" } },
    hD("svg", { width: "40", height: "24", viewBox: "0 0 46 28", role: "img", "aria-label": "Mastercard" },
      hD("circle", { cx: "18", cy: "14", r: "11", fill: "#EB001B" }), hD("circle", { cx: "28", cy: "14", r: "11", fill: "#F79E1B" }),
      hD("path", { d: "M23 5.9 A11 11 0 0 1 27 14 A11 11 0 0 1 23 22.1 A11 11 0 0 1 19 14 A11 11 0 0 1 23 5.9 Z", fill: "#FF5F00" }))),
  hD("span", { style: { background: "#FFFFFF", borderRadius: 4, padding: "5px 9px", display: "inline-flex", alignItems: "center" } },
    hD("svg", { width: "44", height: "24", viewBox: "0 0 52 28", role: "img", "aria-label": "Visa" },
      hD("text", { x: "26", y: "19.5", textAnchor: "middle", fontFamily: "Arial Black, Arial, sans-serif", fontStyle: "italic", fontWeight: "900", fontSize: "15", fill: "#1A1F71", letterSpacing: "0.5" }, "VISA"))));

const CardPanel = ({ card }) => {
  const fee = Number(card.feePct != null ? card.feePct : 5);
  return hD("div", { style: dPanel },
    hD("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" } },
      hD("div", null, dEyebrow("Step 1 · Pay · Card"), dTitle("Give with Visa or Mastercard.", 0)),
      hD(CardLogos)),
    dBody("No crypto wallet or Indonesian bank needed. You pay any amount on our secure checkout partner, Lynk, and it opens in a new tab.", { marginTop: 16 }),
    hD("button", { type: "button", onClick: () => window.open(card.link, "_blank", "noopener,noreferrer"), style: { marginTop: 20, width: "100%", minHeight: 50, padding: "0 20px", background: "linear-gradient(120deg, #EAD9A8, #C9A961 55%, #B08F4C)", color: "#131A33", border: "none", cursor: "pointer", fontFamily: DS.sans, fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10 } }, "Pay by card ↗"),
    fee > 0 ? hD("div", { style: { marginTop: 12, fontFamily: DS.sans, fontSize: 13, lineHeight: 1.6, color: DS.mute } },
      "The checkout keeps about " + fee + "% as a card processing fee. For the full amount to arrive, QRIS or a bank transfer is best.") : null,
    hD(DSteps, { items: [
      "Open the secure checkout and pay any amount.",
      "Record your gift with the amount and, if you have it, the order number from your receipt.",
      "We match it against the checkout and email your receipt."] }),
    hD(RecordMethodBtn, { method: "card" }, "I have paid · record my gift →"));
};

const fmtGiftDate = s => { const d = s ? new Date(s) : null; return d && !isNaN(d) ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""; };

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
  const methods = availableMethods(store, pay);
  const [picked, setPicked] = useStateD(() => { try { return new URLSearchParams(location.search).get("method") || null; } catch (e) { return null; } });
  const method = methods.some(([k]) => k === picked) ? picked : methods[0] ? methods[0][0] : "usdt";
  // "record my gift" buttons and other pages can switch the method
  useEffectD(() => {
    const f = e => { const m = e && e.detail; if (m && DONATE_METHODS.some(([k]) => k === m)) setPicked(m); };
    window.addEventListener("brial:donate-method", f);
    return () => window.removeEventListener("brial:donate-method", f);
  }, []);
  const rawDonations = store.listDonations();
  // Real public gifts only: drop internal aggregates, fold in pillar grants as their own rows
  const donations = (() => {
    const real = (rawDonations || []).filter(d => d.id !== "LEGACY-SUMMARY" && d.id !== "PILLAR-GRANTS" && d.id !== "PILLAR-LINKS" && d.id !== "EBOOKS-CATALOG" && d.id !== "FOODLAND-CONTENT" && d.id !== "PAYMENT-CONFIG" && d.id !== "WORSHIP-CONTENT" && d.id !== "WATER-CONTENT" && d.id !== "PILLAR-STATUS" && String(d.id || "").indexOf("PILLAR-CONTENT-") !== 0 && String(d.name || "").slice(0, 2) !== "__");
    const pillarRows = (store.getPillarGrants ? store.getPillarGrants().filter(g => !g.archived && Number(g.amount) > 0) : []).map(g => ({
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
  const net = usdtNet(wallet.network);
  const panel = method === "qris" ? hD(QrisCard, { qris: pay.qris })
    : method === "bank" ? hD(BankPanel, { bank: pay.bank, copied, copy })
    : method === "card" ? hD(CardPanel, { card: pay.card })
    : method === "wire" ? hD(WirePanel, { wire: pay.wire, copied, copy })
    : hD(UsdtPanel, { wallet, copied, copy });

  return hD("div", { style: { minHeight: "100vh", background: "#0A1628", color: DS.ink } },
    hD("div", { "aria-hidden": "true", style: { position: "fixed", inset: 0, opacity: 0.04, pointerEvents: "none", backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23C9A961' stroke-width='0.5'><path d='M60 10 L70 40 L100 30 L80 55 L110 60 L80 65 L100 90 L70 80 L60 110 L50 80 L20 90 L40 65 L10 60 L40 55 L20 30 L50 40 Z'/></g></svg>\")" } }),
    hD(DonateNav, { onExit, onApply }),
    hD("main", { style: { position: "relative", maxWidth: 1280, margin: "0 auto", padding: "56px clamp(20px, 4vw, 56px) 80px" } },
      // ---- hero ----
      hD("div", { style: { marginBottom: 48, maxWidth: 920 } },
        hD("div", { style: { fontFamily: DS.mono, fontSize: 11, color: DS.gold, letterSpacing: "0.26em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 12 } },
          hD("span", { style: { width: 24, height: 1, background: DS.gold, opacity: 0.6 } }), "Patronage \xB7 Direct to corpus"),
        hD("h1", { style: { fontFamily: DS.serif, fontSize: "clamp(44px, 6vw, 84px)", fontWeight: 400, lineHeight: 1.02, letterSpacing: "-0.02em", color: DS.ink, margin: "20px 0 24px" } },
          "Underwrite a future ", hD("em", { style: { fontStyle: "italic", color: DS.gold } }, "directly"), "."),
        hD("p", { style: { fontFamily: DS.sans, fontSize: "clamp(16px, 1.6vw, 18px)", lineHeight: 1.7, fontWeight: 300, color: "rgba(232,228,220,0.8)", margin: 0, maxWidth: 760 } },
          "The Brial Endowment accepts USDT on " + net.chain + " (" + net.code + ")" + (methods.some(([k]) => k === "wire") ? " and bank wires in " + wireCurText(pay.wire) : "") + " from anywhere, and QRIS, bank transfers and cards in Indonesia. Every gift is recorded on our open ledger and disbursed, in full, to the work: a scholar's tuition or one of the endowment's pillars. There is no administrative overhead, no fund manager skim, no donor wining-and-dining. Just the work, paid."),
        hD("div", { className: "b-don-stats", style: { marginTop: 36, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "rgba(201,169,97,0.14)" } },
          [{ l: "Patron contributions", v: fmtAmount(totalRaised) }, { l: "Gifts on record", v: donorCount }, { l: "Disbursed to the work", v: "100%" }].map((t, i) =>
            hD("div", { key: i, style: { padding: "22px 26px", background: "rgba(20,36,66,0.6)", minWidth: 0 } },
              hD("div", { style: { fontFamily: DS.mono, fontSize: 11, color: DS.mute, letterSpacing: "0.14em", textTransform: "uppercase" } }, t.l),
              hD("div", { className: "b-don-stat-v", style: { fontFamily: DS.serif, fontSize: 36, fontWeight: 400, color: DS.ink, marginTop: 10, letterSpacing: "-0.01em", lineHeight: 1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" } }, t.v))))),

      // ---- step 1: choose ----
      hD("section", { "aria-labelledby": "don-choose", style: { marginBottom: 24 } },
        hD("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 16 } },
          hD("div", null,
            dEyebrow("\xA7 I · Choose how to give"),
            hD("h2", { id: "don-choose", style: { fontFamily: DS.serif, fontSize: "clamp(28px, 3.4vw, 36px)", fontWeight: 400, color: DS.ink, letterSpacing: "-0.01em", margin: "10px 0 0", lineHeight: 1.1 } }, "How would you like to give?")),
          hD("div", { style: { fontFamily: DS.sans, fontSize: 13, color: DS.mute } }, "Every gift gets an email receipt and a line on the open ledger.")),
        hD(MethodPicker, { methods, value: method, onChange: setPicked, wallet, pay })),

      // ---- step 1 details + step 2 form ----
      hD("div", { style: { display: "grid", gridTemplateColumns: "minmax(320px, 1fr) 1.2fr", gap: 28, alignItems: "start" } },
        hD("div", { id: "donate-pay", style: { minWidth: 0 } }, panel),
        hD("div", { style: { minWidth: 0 } }, hD(DonationForm, { wallet, method, methodLabel: methodMeta(method, wallet, pay).title }))),

      // ---- recent gifts ----
      donations.length > 0 && hD("section", { "aria-labelledby": "don-recent", style: { marginTop: 80 } },
        hD("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22, flexWrap: "wrap", gap: 14 } },
          hD("div", null,
            dEyebrow("\xA7 III · Recent patrons"),
            hD("h2", { id: "don-recent", style: { fontFamily: DS.serif, fontSize: "clamp(28px, 3.4vw, 36px)", fontWeight: 400, color: DS.ink, letterSpacing: "-0.01em", margin: "10px 0 0", lineHeight: 1.1 } }, "The most recent gifts.")),
          hD("div", { style: { display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" } },
            hD("span", { style: { fontFamily: DS.sans, fontSize: 13, color: DS.mute } }, "Anonymous donors appear as “Anonymous patron”."),
            hD("a", { href: "/proof", style: { fontFamily: DS.sans, fontSize: 13, color: DS.goldSoft, textDecoration: "underline", textUnderlineOffset: 3 } }, "See the full ledger →"))),
        hD("div", { role: "list", style: { display: "flex", flexDirection: "column", gap: 1, background: "rgba(201,169,97,0.12)" } },
          donations.slice(0, 6).map(d => hD("div", { key: d.id, role: "listitem", className: "b-don-row", style: { display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(90px, 0.6fr) minmax(0, 1.2fr) 112px", gap: 20, padding: "18px 24px", background: "rgba(20,36,66,0.55)", alignItems: "center" } },
            hD("div", { className: "b-don-row-name", style: { minWidth: 0 } },
              hD("div", { style: { fontFamily: DS.serif, fontSize: 21, color: DS.ink, letterSpacing: "-0.01em", lineHeight: 1.25 } }, d.anonymous ? "Anonymous patron" : d.name),
              fmtGiftDate(d.submittedAt) ? hD("div", { style: { fontFamily: DS.mono, fontSize: 11, color: DS.mute, letterSpacing: "0.08em", marginTop: 4 } }, fmtGiftDate(d.submittedAt)) : null,
              d.message && hD("div", { style: { fontFamily: DS.serif, fontStyle: "italic", fontSize: 15, color: "rgba(232,228,220,0.72)", marginTop: 6, lineHeight: 1.5 } }, "“", d.message, "”")),
            hD("div", { className: "b-don-row-amt", style: { fontFamily: DS.serif, fontSize: 28, color: DS.gold, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" } }, fmtAmount(d.amount)),
            hD("div", { className: "b-don-row-ref", title: d.txHash || "", style: { fontFamily: DS.mono, fontSize: 12, color: DS.mute, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 } }, d.txHash || "—"),
            hD("div", { className: "b-don-row-status", style: { textAlign: "right" } },
              hD("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 9px", background: d.verified ? "rgba(134,229,167,0.14)" : "rgba(201,169,97,0.14)", border: "1px solid " + (d.verified ? "rgba(134,229,167,0.45)" : "rgba(201,169,97,0.45)"), color: d.verified ? DS.green : DS.goldSoft, fontFamily: DS.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" } }, d.verified ? "✓ Verified" : "Pending"))))))),
    hD("footer", { style: { background: "#060E1C", padding: "56px clamp(20px, 4vw, 56px) 30px", borderTop: "1px solid rgba(201,169,97,0.15)", marginTop: 80 } },
      hD("div", { style: { maxWidth: 1280, margin: "0 auto", textAlign: "center" } },
        hD("div", { style: { display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 } },
          [["/", "Home"], ["/proof", "Open ledger"], ["/terms", "Terms"], ["/privacy", "Privacy"]].map(([href, t]) => hD("a", { key: href, href, style: { fontFamily: DS.sans, fontSize: 13, color: DS.mute, textDecoration: "none", padding: "10px 4px", display: "inline-block" } }, t))),
        hD("div", { style: { fontFamily: DS.mono, fontSize: 11, color: "rgba(232,228,220,0.58)", letterSpacing: "0.16em", textTransform: "uppercase", lineHeight: 1.8 } }, "\xA9 MMXXVI \xB7 The Brial Endowment", hD("br", null), "brialendowment.org"))));
};
window.DonatePage = DonatePage;
})();
