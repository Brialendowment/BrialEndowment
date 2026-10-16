(function(){
const {
  useState,
  useEffect,
  useMemo
} = React;

// ============================================================
// FOUNDER PORTAL — v4 schema (unified applicants)
// Login → Inbox · Disbursements · Scholars
// ============================================================

const useStore = () => {
  const [, tick] = useState(0);
  useEffect(() => {
    const h = () => tick(t => t + 1);
    window.addEventListener("brial:change", h);
    return () => window.removeEventListener("brial:change", h);
  }, []);
  return window.BrialStore;
};
const STATUS_META = {
  registered: {
    label: "Profile in progress",
    color: "#7E8AA0"
  },
  submitted: {
    label: "Administrative",
    color: "#C9A961"
  },
  "interview-scheduled": {
    label: "Interview set",
    color: "#4FD1C5"
  },
  "interview-done": {
    label: "Final review",
    color: "#7AA9E6"
  },
  accepted: {
    label: "Granted",
    color: "#86E5A7"
  },
  rejected: {
    label: "Declined",
    color: "#E58686"
  }
};
const SCHOLAR_STATUS_META = {
  active: {
    label: "Active",
    color: "#86E5A7"
  },
  suspended: {
    label: "Suspended",
    color: "#FFB347"
  },
  revoked: {
    label: "Revoked",
    color: "#E58686"
  },
  graduated: {
    label: "Graduated",
    color: "#C9A961"
  }
};
const ScholarStatusPill = ({
  status
}) => {
  const m = SCHOLAR_STATUS_META[status] || SCHOLAR_STATUS_META.active;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "5px 12px",
      background: `${m.color}14`,
      border: `1px solid ${m.color}55`,
      color: m.color,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: m.color,
      boxShadow: `0 0 6px ${m.color}`
    }
  }), "Scholarship \xB7 ", m.label);
};
const StatusPill = ({
  status
}) => {
  const m = STATUS_META[status] || STATUS_META.submitted;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "5px 12px",
      background: `${m.color}14`,
      border: `1px solid ${m.color}55`,
      color: m.color,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: m.color,
      boxShadow: `0 0 6px ${m.color}`
    }
  }), m.label);
};
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric"
}) : "—";
const fmtDateTime = iso => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short"
  }) + " · " + d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  });
};
const relTime = iso => {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return Math.floor(diff) + "s ago";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
};
const fmtMoney = n => "$" + (n || 0).toLocaleString("en-US");
const adminInputStyle = {
  background: "rgba(232,228,220,0.05)",
  border: "1px solid rgba(232,228,220,0.18)",
  color: "#E8E4DC",
  padding: "12px 14px",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  outline: "none",
  colorScheme: "dark"
};
const adminPrimaryBtn = {
  background: "#C9A961",
  color: "#0A1628",
  border: "none",
  padding: "12px 22px",
  cursor: "pointer",
  fontFamily: "'Manrope', sans-serif",
  fontSize: 12,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 500
};
const adminGhostBtn = {
  background: "transparent",
  color: "rgba(232,228,220,0.8)",
  border: "1px solid rgba(232,228,220,0.2)",
  padding: "12px 22px",
  cursor: "pointer",
  fontFamily: "'Manrope', sans-serif",
  fontSize: 12,
  letterSpacing: "0.16em",
  textTransform: "uppercase"
};

// ============================================================
// FOUNDER LOGIN
// ============================================================
const FounderLogin = ({
  onExit
}) => {
  const store = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const submit = async e => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    const res = await store.authFounder(email, password);
    if (res && res.ok) {
      // session is persisted by supabase-js; nudge a re-render
      window.dispatchEvent(new CustomEvent("brial:change", {
        detail: {
          key: "founder-auth"
        }
      }));
    } else {
      setError(res && res.error || "Invalid email or password.");
      setLoading(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 70% 30%, #142442 0%, #0A1628 60%, #060E1C 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      opacity: 0.08,
      pointerEvents: "none",
      backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23C9A961' stroke-width='0.5'><path d='M60 10 L70 40 L100 30 L80 55 L110 60 L80 65 L100 90 L70 80 L60 110 L50 80 L20 90 L40 65 L10 60 L40 55 L20 30 L50 40 Z'/></g></svg>\")"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onExit,
    style: {
      position: "absolute",
      top: 24,
      left: 24,
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
      position: "relative",
      width: "100%",
      maxWidth: 460,
      background: "rgba(20,36,66,0.55)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(201,169,97,0.2)",
      padding: 44
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "44",
    height: "44",
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
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: 12
    }
  }, "Founder Portal \xB7 Restricted"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 36,
      fontWeight: 400,
      lineHeight: 1.1,
      letterSpacing: "-0.01em",
      color: "#E8E4DC",
      margin: "0 0 28px",
      textAlign: "center"
    }
  }, "Trustee sign-in."), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    autoFocus: true,
    value: email,
    onChange: e => setEmail(e.target.value),
    autoComplete: "off",
    spellCheck: false,
    style: {
      width: "100%",
      padding: "12px 0",
      background: "transparent",
      border: "none",
      borderBottom: "1px solid rgba(232,228,220,0.25)",
      color: "#E8E4DC",
      fontSize: 16,
      fontFamily: "'Cormorant Garamond', serif",
      outline: "none"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Password"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      borderBottom: "1px solid rgba(232,228,220,0.25)"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: reveal ? "text" : "password",
    value: password,
    onChange: e => setPassword(e.target.value),
    autoComplete: "off",
    style: {
      flex: 1,
      padding: "12px 0",
      background: "transparent",
      border: "none",
      color: "#E8E4DC",
      fontSize: 16,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: "0.2em",
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setReveal(r => !r),
    style: {
      background: "transparent",
      border: "none",
      color: "rgba(232,228,220,0.55)",
      cursor: "pointer",
      padding: 8
    }
  }, reveal ? "🙈" : "👁"))), error && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px",
      marginBottom: 18,
      background: "rgba(229,134,134,0.08)",
      border: "1px solid rgba(229,134,134,0.3)",
      color: "#E58686",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      letterSpacing: "0.08em"
    }
  }, error), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: !email || !password || loading,
    style: {
      width: "100%",
      padding: "16px 0",
      background: loading ? "rgba(201,169,97,0.5)" : "#C9A961",
      color: "#0A1628",
      border: "none",
      cursor: email && password && !loading ? "pointer" : "not-allowed",
      opacity: email && password ? 1 : 0.5,
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, loading ? "Verifying…" : "Authenticate →"))));
};

// ============================================================
// HEADER + TABS
// ============================================================
const PortalNav = ({
  onExit,
  founderLabel,
  onLogout
}) => /*#__PURE__*/React.createElement("header", {
  className: "pn",
  style: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    background: "rgba(10,22,40,0.85)",
    backdropFilter: "blur(20px) saturate(140%)",
    borderBottom: "1px solid rgba(201,169,97,0.15)",
    padding: "20px clamp(20px, 4vw, 56px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 18
  }
}, /*#__PURE__*/React.createElement("button", {
  onClick: onExit,
  className: "pn-exit",
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
}, "Founder Portal"), /*#__PURE__*/React.createElement("div", {
  className: "pn-sub",
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.28em",
    color: "#C9A961",
    marginTop: 2
  }
}, "REVIEW \xB7 APPROVE \xB7 DISBURSE")))), /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 14
  }
}, /*#__PURE__*/React.createElement("span", {
  className: "pn-email",
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "rgba(232,228,220,0.5)",
    letterSpacing: "0.1em"
  }
}, /*#__PURE__*/React.createElement("strong", {
  style: {
    color: "#C9A961"
  }
}, founderLabel)), /*#__PURE__*/React.createElement("div", {
  className: "pn-avatar",
  style: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #C9A961, #8B7A4A)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 14,
    color: "#0A1628",
    fontStyle: "italic"
  }
}, "A"), /*#__PURE__*/React.createElement("button", {
  onClick: onLogout,
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
}, "Sign out")));
const TabStrip = ({
  tab,
  onChange,
  counts
}) => {
  const items = [{
    id: "inbox",
    label: "Applications",
    count: counts.inbox
  }, {
    id: "disbursements",
    label: "Disbursements",
    count: counts.disbursements,
    accent: "#4FD1C5"
  }, {
    id: "scholars",
    label: "Scholars",
    count: counts.scholars,
    accent: "#86E5A7"
  }, {
    id: "worship",
    label: "Houses of Worship",
    count: counts.worship,
    accent: "#C9A961"
  }, {
    id: "donations",
    label: "Donations",
    count: counts.donations,
    accent: "#C9A961"
  }, {
    id: "reports",
    label: "Reports",
    count: counts.reports,
    accent: "#E58686"
  }, {
    id: "accounts",
    label: "Accounts",
    count: counts.accounts,
    accent: "#7AA9E6"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      padding: "0 clamp(20px, 4vw, 56px)",
      flexWrap: "wrap",
      background: "rgba(10,22,40,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      position: "sticky",
      top: 73,
      zIndex: 25
    }
  }, items.map(it => {
    const active = tab === it.id;
    const accent = it.accent || "#C9A961";
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => onChange(it.id),
      style: {
        background: "transparent",
        border: "none",
        padding: "18px 22px",
        cursor: "pointer",
        color: active ? "#E8E4DC" : "rgba(232,228,220,0.55)",
        fontFamily: "'Manrope', sans-serif",
        fontSize: 13,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontWeight: active ? 500 : 400,
        borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, it.label, typeof it.count === "number" && /*#__PURE__*/React.createElement("span", {
      style: {
        background: active ? `${accent}28` : "rgba(232,228,220,0.08)",
        color: active ? accent : "rgba(232,228,220,0.55)",
        padding: "2px 8px",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.04em"
      }
    }, it.count));
  }));
};

// ============================================================
// INBOX ROW
// ============================================================
const InboxRow = ({
  app,
  active,
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  onClick: onClick,
  style: {
    padding: "22px 24px",
    borderBottom: "1px solid rgba(201,169,97,0.08)",
    cursor: "pointer",
    background: active ? "rgba(201,169,97,0.06)" : "transparent",
    borderLeft: active ? "2px solid #C9A961" : "2px solid transparent",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
    alignItems: "start"
  },
  onMouseEnter: e => {
    if (!active) e.currentTarget.style.background = "rgba(201,169,97,0.03)";
  },
  onMouseLeave: e => {
    if (!active) e.currentTarget.style.background = "transparent";
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6
  }
}, app.isUserSubmitted && /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "#4FD1C5",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    border: "1px solid rgba(79,209,197,0.45)",
    padding: "2px 6px"
  }
}, "NEW"), /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "rgba(232,228,220,0.45)",
    letterSpacing: "0.14em"
  }
}, app.id)), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22,
    color: "#E8E4DC",
    letterSpacing: "-0.01em",
    lineHeight: 1.15,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  }
}, app.name), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
    fontWeight: 300,
    color: "rgba(232,228,220,0.6)",
    marginTop: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  }
}, app.profile?.university?.name || "—", " \xB7 ", app.profile?.university?.program || ""), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  }
}, /*#__PURE__*/React.createElement(StatusPill, {
  status: app.status
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "rgba(232,228,220,0.4)",
    letterSpacing: "0.1em"
  }
}, relTime(app.submittedAt || app.signedUpAt)))), /*#__PURE__*/React.createElement("div", {
  style: {
    color: "rgba(201,169,97,0.5)",
    fontFamily: "serif",
    fontSize: 18,
    paddingTop: 6
  }
}, "\u203A"));

// ============================================================
// SCHEDULE ZOOM BOX
// ============================================================
const ScheduleZoomBox = ({
  app,
  store
}) => {
  const [date, setDate] = useState(() => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  const [time, setTime] = useState("14:30");
  const [link, setLink] = useState(app.meetingLink || "");
  const submit = () => store.scheduleInterview(app.id, new Date(`${date}T${time}:00`).toISOString(), link.trim());
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      background: "rgba(79,209,197,0.06)",
      border: "1px solid rgba(79,209,197,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#4FD1C5",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Schedule Interview"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.7)",
      margin: "10px 0 18px"
    }
  }, "Pick a slot and paste the Zoom or Google Meet link below. The applicant will see the slot, the link, and a join button in their portal."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value),
    style: adminInputStyle
  }), /*#__PURE__*/React.createElement("input", {
    type: "time",
    value: time,
    onChange: e => setTime(e.target.value),
    style: adminInputStyle
  })), /*#__PURE__*/React.createElement("input", {
    type: "url",
    value: link,
    onChange: e => setLink(e.target.value),
    placeholder: "https://us02web.zoom.us/j/\u2026 or https://meet.google.com/\u2026",
    style: {
      ...adminInputStyle,
      width: "100%",
      marginTop: 10,
      fontSize: 12
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !link.trim(),
    style: {
      ...adminPrimaryBtn,
      background: link.trim() ? "#C9A961" : "rgba(201,169,97,0.3)",
      color: link.trim() ? "#0A1628" : "rgba(232,228,220,0.5)",
      cursor: link.trim() ? "pointer" : "not-allowed"
    }
  }, "Send Interview Invite \u2192")));
};

// ============================================================
// PROFILE VIEWER (read-only)
// ============================================================
const FileRow = ({
  file,
  fallback = "Not uploaded"
}) => file ? /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 10
  }
}, /*#__PURE__*/React.createElement("svg", {
  width: "22",
  height: "28",
  viewBox: "0 0 32 40",
  fill: "none",
  stroke: "#C9A961",
  strokeWidth: "1"
}, /*#__PURE__*/React.createElement("path", {
  d: "M4 1 L22 1 L31 10 L31 39 L4 39 Z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M22 1 L22 10 L31 10"
})), /*#__PURE__*/React.createElement("div", {
  style: {
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  onClick: () => window.BrialFiles.open(file),
  title: "Open",
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
    color: "#E8E4DC",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationColor: "rgba(201,169,97,0.4)",
    textUnderlineOffset: 3
  }
}, file.name || file.filename), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "rgba(232,228,220,0.5)",
    letterSpacing: "0.06em"
  }
}, file.size ? `${file.size} MB · ` : "", "uploaded ", fmtDate(file.uploadedAt))), /*#__PURE__*/React.createElement("button", {
  onClick: () => window.BrialFiles.open(file),
  style: {
    marginLeft: "auto",
    padding: "4px 10px",
    background: "transparent",
    border: "1px solid rgba(201,169,97,0.4)",
    color: "#C9A961",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase"
  }
}, "Open \u2197")) : /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
    fontStyle: "italic",
    color: "rgba(232,228,220,0.4)"
  }
}, fallback);
const FieldGrid = ({
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px 28px"
  }
}, children);
const Field = ({
  label,
  value
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "rgba(232,228,220,0.45)",
    letterSpacing: "0.22em",
    textTransform: "uppercase"
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 14,
    color: value ? "#E8E4DC" : "rgba(232,228,220,0.4)",
    marginTop: 6,
    fontStyle: value ? "normal" : "italic"
  }
}, value || "—"));
const ProfileSection = ({
  title,
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 28,
    padding: 24,
    background: "rgba(20,36,66,0.4)",
    border: "1px solid rgba(201,169,97,0.12)"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "#C9A961",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    marginBottom: 18
  }
}, title), children);
const ApplicantProfileView = ({
  app
}) => {
  if (!app.profile) return null;
  const p = app.profile;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ProfileSection, {
    title: "\xA7 A \xB7 Personal data"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: 28,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.45)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Biometric Photo"), p.personal.photoFile ? /*#__PURE__*/React.createElement("div", {
    key: app.id + ":" + (p.personal.photoFile.path || p.personal.photoFile.key || p.personal.photoFile.name || ""),
    style: {
      width: 150
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => window.BrialFiles.open(p.personal.photoFile),
    title: "Click to open full size",
    style: {
      width: 150,
      height: 190,
      cursor: "pointer",
      border: "1px solid rgba(201,169,97,0.4)",
      background: "rgba(10,22,40,0.5)",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /^image\//i.test(p.personal.photoFile.type || "") || /\.(png|jpe?g|webp|gif)$/i.test(p.personal.photoFile.name || p.personal.photoFile.path || "") ? /*#__PURE__*/React.createElement("img", {
    src: p.personal.photoFile.url || (window.brialSupabase && (p.personal.photoFile.path || p.personal.photoFile.key) ? window.brialSupabase.publicUrl(p.personal.photoFile.path || p.personal.photoFile.key) : ""),
    alt: "Biometric",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    onError: e => {
      e.target.style.display = "none";
      if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: /^image\//i.test(p.personal.photoFile.type || "") || /\.(png|jpe?g|webp|gif)$/i.test(p.personal.photoFile.name || p.personal.photoFile.path || "") ? "none" : "flex",
      position: "absolute",
      inset: 0,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 8,
      color: "rgba(232,228,220,0.5)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.1em",
      textAlign: "center",
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#C9A961",
    strokeWidth: "1"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "18",
    height: "18"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "9",
    r: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 17 L9 12 L13 15 L17 11 L21 15"
  })), /pdf/i.test(p.personal.photoFile.type || "") ? "PDF on file \u00b7 click to open" : "Photo on file")), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.BrialFiles.open(p.personal.photoFile),
    style: {
      width: "100%",
      marginTop: 8,
      padding: "6px 10px",
      background: "transparent",
      border: "1px solid rgba(201,169,97,0.4)",
      color: "#C9A961",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Open \u2197")) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 150,
      height: 190,
      border: "1px dashed rgba(232,228,220,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Cormorant Garamond', serif",
      fontStyle: "italic",
      fontSize: 14,
      color: "rgba(232,228,220,0.4)",
      textAlign: "center",
      padding: 14
    }
  }, "No photo uploaded")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FieldGrid, null, /*#__PURE__*/React.createElement(Field, {
    label: "Full legal name",
    value: p.personal.fullName
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Date of birth",
    value: p.personal.dateOfBirth
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Phone",
    value: p.personal.phone
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Country",
    value: p.personal.country
  }), /*#__PURE__*/React.createElement(Field, {
    label: "National ID",
    value: p.personal.nationalId
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Email",
    value: app.email
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Full address",
    value: p.personal.address
  }))))), /*#__PURE__*/React.createElement(ProfileSection, {
    title: "\xA7 B \xB7 High school record"
  }, /*#__PURE__*/React.createElement(FieldGrid, null, /*#__PURE__*/React.createElement(Field, {
    label: "School",
    value: p.highSchool.schoolName
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Graduation year",
    value: p.highSchool.graduationYear
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Final GPA",
    value: p.highSchool.finalGPA
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Subjects on file",
    value: `${p.highSchool.subjects.filter(s => (s.name || "").trim() && (s.grade || "").toString().trim()).length} / ${p.highSchool.subjects.length}`
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.45)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Subject grades \xB7 average across all semesters"), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid rgba(232,228,220,0.1)",
      background: "rgba(10,22,40,0.4)"
    }
  }, p.highSchool.subjects.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 100px",
      borderBottom: i < p.highSchool.subjects.length - 1 ? "1px solid rgba(232,228,220,0.06)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 15,
      color: "#E8E4DC"
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      color: s.grade ? "#C9A961" : "rgba(232,228,220,0.3)",
      borderLeft: "1px solid rgba(232,228,220,0.08)",
      textAlign: "center"
    }
  }, s.grade || "—"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.45)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Rapor SMA (transcript)"), /*#__PURE__*/React.createElement(FileRow, {
    file: p.highSchool.raporFile
  }))), /*#__PURE__*/React.createElement(ProfileSection, {
    title: `§ C · Current ${p.university.degreeLevel === "SMA" ? "school" : "university"}`
  }, p.university.degreeLevel && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18,
      padding: "10px 14px",
      background: "rgba(201,169,97,0.08)",
      border: "1px solid rgba(201,169,97,0.25)",
      display: "inline-flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "#C9A961",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Education level"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      color: "#E8E4DC",
      letterSpacing: "-0.01em"
    }
  }, window.BrialStore?.DEGREE_LEVELS?.[p.university.degreeLevel]?.label || p.university.degreeLevel), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.12em"
    }
  }, window.BrialStore?.DEGREE_LEVELS?.[p.university.degreeLevel]?.totalSemesters, " semesters")), /*#__PURE__*/React.createElement(FieldGrid, null, /*#__PURE__*/React.createElement(Field, {
    label: p.university.degreeLevel === "SMA" ? "School" : "University",
    value: p.university.name
  }), /*#__PURE__*/React.createElement(Field, {
    label: p.university.degreeLevel === "SMA" ? "Track / jurusan" : "Program",
    value: p.university.program
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Current semester",
    value: p.university.currentSemester
  }), /*#__PURE__*/React.createElement(Field, {
    label: p.university.degreeLevel === "SMA" ? "Current GPA / rata-rata" : "Current GPA (IPK)",
    value: p.university.currentGPA
  }), /*#__PURE__*/React.createElement(Field, {
    label: "UKT per semester",
    value: p.university.uktPerSemester ? `${fmtMoney(parseInt(p.university.uktPerSemester, 10))} USD` : ""
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Wallet",
    value: app.walletShort || "Not yet provisioned"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.45)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Kartu pelajar / student ID"), /*#__PURE__*/React.createElement(FileRow, {
    file: p.university.studentCardFile
  }))), /*#__PURE__*/React.createElement(ProfileSection, {
    title: "\xA7 D \xB7 Research essay"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.92)",
      margin: 0,
      paddingLeft: 18,
      borderLeft: "2px solid rgba(201,169,97,0.3)"
    }
  }, p.essay || /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: "italic",
      color: "rgba(232,228,220,0.4)"
    }
  }, "No essay submitted yet.")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.4)",
      marginTop: 12,
      letterSpacing: "0.1em"
    }
  }, (p.essay || "").trim().split(/\s+/).filter(Boolean).length, " words \xB7 ", (p.essay || "").length, " characters")));
};

// ============================================================
// SCHOLARSHIP CONTROLS — suspend/revoke/reactivate
// ============================================================
const ScholarshipControls = ({
  app,
  store
}) => {
  const [action, setAction] = useState(null); // 'suspend' | 'revoke' | 'reactivate'
  const [reason, setReason] = useState("");
  const reset = () => {
    setAction(null);
    setReason("");
  };
  const apply = () => {
    if (!reason.trim()) return;
    if (action === "suspend") store.suspendScholarship(app.id, reason.trim());
    if (action === "revoke") store.revokeScholarship(app.id, reason.trim());
    if (action === "reactivate") store.reactivateScholarship(app.id, reason.trim());
    reset();
  };
  const status = app.scholarStatus || "active";
  const ipk = store.cumulativeIPK(app);
  const isGrad = status === "graduated";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      padding: 24,
      background: "rgba(20,36,66,0.4)",
      border: "1px solid rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "start",
      gap: 18,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Scholarship Controls"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "baseline",
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(ScholarStatusPill, {
    status: status
  }), ipk && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: ipk.value >= 2.75 ? "#86E5A7" : "#E58686",
      letterSpacing: "0.12em"
    }
  }, "Cumulative IPK \xB7 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 17,
      marginLeft: 4
    }
  }, ipk.value.toFixed(2)), ipk.value < 2.75 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8
    }
  }, "\u2193 below 2.75 threshold"))))), !action && !isGrad && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 16,
      flexWrap: "wrap"
    }
  }, status === "active" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAction("suspend"),
    style: {
      ...adminGhostBtn,
      borderColor: "rgba(255,179,71,0.4)",
      color: "#FFB347"
    }
  }, "\u23F8 Suspend"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAction("revoke"),
    style: {
      ...adminGhostBtn,
      borderColor: "rgba(229,134,134,0.4)",
      color: "#E58686"
    }
  }, "\u25A0 Revoke")), status === "suspended" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAction("reactivate"),
    style: {
      ...adminPrimaryBtn,
      background: "#86E5A7"
    }
  }, "\u2713 Reactivate"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAction("revoke"),
    style: {
      ...adminGhostBtn,
      borderColor: "rgba(229,134,134,0.4)",
      color: "#E58686"
    }
  }, "\u25A0 Revoke permanently")), status === "revoked" && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      color: "rgba(232,228,220,0.5)",
      fontStyle: "italic"
    }
  }, "Scholarship has been permanently revoked. No further actions available.")), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: "18px 20px",
      background: action === "suspend" ? "rgba(255,179,71,0.08)" : action === "revoke" ? "rgba(229,134,134,0.08)" : "rgba(134,229,167,0.08)",
      border: `1px solid ${action === "suspend" ? "rgba(255,179,71,0.35)" : action === "revoke" ? "rgba(229,134,134,0.35)" : "rgba(134,229,167,0.35)"}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: action === "suspend" ? "#FFB347" : action === "revoke" ? "#E58686" : "#86E5A7",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, action === "suspend" && "Suspend scholarship", action === "revoke" && "Revoke scholarship permanently", action === "reactivate" && "Reactivate scholarship"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.7)",
      margin: "10px 0 16px"
    }
  }, action === "suspend" && "The scholar will see a suspension banner with your reason. No new disbursements will be processed while suspended.", action === "revoke" && "Permanent termination. The scholar's record is preserved but no further disbursements will occur. Use only when reactivation is not anticipated.", action === "reactivate" && "Restore the scholarship to active status. The scholar can resume uploading bills and IPs."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Reason (shown to scholar)"), /*#__PURE__*/React.createElement("textarea", {
    value: reason,
    onChange: e => setReason(e.target.value),
    placeholder: action === "suspend" ? "e.g. IPK turun di bawah 2.75 untuk semester 3. Mohon klarifikasi alasan akademik sebelum lanjut…" : action === "revoke" ? "e.g. Pelanggaran code of conduct: …" : "e.g. IPK semester 4 sudah pulih ke 3.2. Kembali aktif.",
    style: {
      width: "100%",
      minHeight: 90,
      resize: "vertical",
      background: "rgba(10,22,40,0.4)",
      border: "1px solid rgba(232,228,220,0.18)",
      color: "#E8E4DC",
      padding: 14,
      fontSize: 14,
      fontFamily: "'Cormorant Garamond', serif",
      lineHeight: 1.6,
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: apply,
    disabled: !reason.trim(),
    style: {
      ...adminPrimaryBtn,
      background: !reason.trim() ? "rgba(201,169,97,0.2)" : action === "suspend" ? "#FFB347" : action === "revoke" ? "#E58686" : "#86E5A7",
      color: !reason.trim() ? "rgba(232,228,220,0.4)" : "#0A1628",
      cursor: !reason.trim() ? "not-allowed" : "pointer"
    }
  }, "Confirm ", action, " \u2192"), /*#__PURE__*/React.createElement("button", {
    onClick: reset,
    style: adminGhostBtn
  }, "Cancel"))), (app.statusHistory || []).length > 0 && /*#__PURE__*/React.createElement("details", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      cursor: "pointer"
    }
  }, "\u21B3 History (", app.statusHistory.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, app.statusHistory.slice().reverse().map((h, i) => {
    const m = SCHOLAR_STATUS_META[h.status];
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 14,
        alignItems: "center",
        padding: "10px 12px",
        background: "rgba(10,22,40,0.4)",
        borderLeft: `2px solid ${m?.color || "#7E8AA0"}`
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: m?.color,
        letterSpacing: "0.18em",
        textTransform: "uppercase"
      }
    }, m?.label || h.status), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 14,
        color: "rgba(232,228,220,0.85)",
        fontStyle: "italic"
      }
    }, "\"", h.reason, "\""), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)"
      }
    }, fmtDate(h.at)));
  }))));
};

// ============================================================
// DETAIL PANEL
// ============================================================
const Detail = ({
  app,
  store
}) => {
  const [notes, setNotes] = useState(app.notes || "");
  useEffect(() => {
    setNotes(app.notes || "");
  }, [app.id]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "36px clamp(24px, 3vw, 44px) 80px",
      borderLeft: "1px solid rgba(201,169,97,0.12)",
      background: "rgba(10,22,40,0.4)",
      minHeight: "calc(100vh - 73px - 60px)",
      overflowY: "auto",
      maxHeight: "calc(100vh - 73px - 60px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "start",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.45)",
      letterSpacing: "0.18em"
    }
  }, app.id, " \xB7 ", app.submittedAt ? `Submitted ${fmtDate(app.submittedAt)}` : `Signed up ${fmtDate(app.signedUpAt)}`), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 42,
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.01em",
      margin: "10px 0 6px",
      lineHeight: 1.05
    }
  }, app.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 15,
      color: "rgba(232,228,220,0.65)"
    }
  }, app.profile?.university?.name || "—", " \xB7 ", app.profile?.university?.program || "")), /*#__PURE__*/React.createElement(StatusPill, {
    status: app.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      padding: "16px 0",
      borderTop: "1px solid rgba(201,169,97,0.12)",
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Email",
    value: app.email
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Country",
    value: app.profile?.personal?.country
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Current IPK",
    value: app.profile?.university?.currentGPA
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Interview",
    value: app.interviewAt ? fmtDateTime(app.interviewAt) : "Not scheduled"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, app.status === "registered" && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      background: "rgba(126,138,160,0.06)",
      border: "1px solid rgba(126,138,160,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#7E8AA0",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Awaiting submission"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      color: "#E8E4DC",
      marginTop: 10,
      lineHeight: 1.4
    }
  }, "This applicant has created an account but has not yet completed and submitted their profile. You will see them here once they submit.")), app.status === "submitted" && /*#__PURE__*/React.createElement(ScheduleZoomBox, {
    app: app,
    store: store
  }), app.status === "interview-scheduled" && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      background: "rgba(79,209,197,0.06)",
      border: "1px solid rgba(79,209,197,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#4FD1C5",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Interview Scheduled"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 28,
      color: "#E8E4DC",
      marginTop: 10
    }
  }, fmtDateTime(app.interviewAt)), app.meetingLink && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: /^https?:\/\//i.test(app.meetingLink) ? app.meetingLink : "https://" + app.meetingLink,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: "#4FD1C5",
      textDecoration: "underline",
      textUnderlineOffset: 3,
      overflowWrap: "anywhere"
    }
  }, app.meetingLink), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.BrialClipboard.copy(app.meetingLink),
    style: {
      background: "transparent",
      border: "1px solid rgba(79,209,197,0.4)",
      color: "#4FD1C5",
      padding: "3px 10px",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Copy")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      color: "rgba(232,228,220,0.6)",
      marginTop: 12
    }
  }, "Slot + link visible in ", app.name.split(" ")[0], "'s portal."), /*#__PURE__*/React.createElement("button", {
    onClick: () => store.markInterviewDone(app.id),
    style: {
      marginTop: 18,
      ...adminPrimaryBtn,
      background: "#4FD1C5"
    }
  }, "\u2713 Mark Interview Completed")), app.status === "interview-done" && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      background: "rgba(122,169,230,0.06)",
      border: "1px solid rgba(122,169,230,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#7AA9E6",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Interview Completed \xB7 Render Decision"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      color: "#E8E4DC",
      marginTop: 10,
      lineHeight: 1.4
    }
  }, "Trustees deliberating. Submit your final decision below."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.55)",
      marginTop: 10,
      letterSpacing: "0.06em"
    }
  }, "Interviewed ", fmtDate(app.interviewDoneAt))), app.status === "accepted" && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      background: "rgba(134,229,167,0.06)",
      border: "1px solid rgba(134,229,167,0.3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#86E5A7",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Accepted \xB7 Scholar Account"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      color: "#E8E4DC",
      marginTop: 10,
      lineHeight: 1.4
    }
  }, "Provisioned as ", app.scholarId, " \xB7 ", app.cohort), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: "14px 18px",
      background: "rgba(10,22,40,0.5)",
      border: "1px solid rgba(201,169,97,0.18)",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Email"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: "#E8E4DC",
      marginTop: 4
    }
  }, app.email)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Password (set by applicant)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: "#C9A961",
      marginTop: 4
    }
  }, app.passwordHash ? "•••••••• · stored as a secure hash" : app.password)))), app.status === "rejected" && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      background: "rgba(229,134,134,0.06)",
      border: "1px solid rgba(229,134,134,0.25)",
      fontFamily: "'Manrope', sans-serif",
      color: "rgba(232,228,220,0.7)",
      fontSize: 14
    }
  }, "Application declined on ", fmtDate(app.rejectedAt), ".")), app.status === "accepted" && /*#__PURE__*/React.createElement(ScholarshipControls, {
    app: app,
    store: store
  }), app.status === "accepted" && (app.semesters || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      padding: 24,
      background: "rgba(20,36,66,0.4)",
      border: "1px solid rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 16
    }
  }, "Semester Ledger Snapshot"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      background: "rgba(201,169,97,0.08)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "100px 1fr 1fr 80px",
      gap: 12,
      padding: "10px 14px",
      background: "rgba(10,22,40,0.6)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("div", null, "Semester"), /*#__PURE__*/React.createElement("div", null, "Bill / Amount"), /*#__PURE__*/React.createElement("div", null, "IP / GPA"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, "Status")), app.semesters.map(sem => {
    const c = sem.status === "completed" ? "#86E5A7" : sem.status === "paid" ? "#7AA9E6" : sem.status === "bill-uploaded" ? "#4FD1C5" : sem.status === "current" ? "#C9A961" : "#7E8AA0";
    return /*#__PURE__*/React.createElement("div", {
      key: sem.id,
      style: {
        display: "grid",
        gridTemplateColumns: "100px 1fr 1fr 80px",
        gap: 12,
        padding: "12px 14px",
        background: "rgba(10,22,40,0.4)",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 17,
        color: "#E8E4DC"
      }
    }, sem.label), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, sem.bill ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      onClick: () => window.BrialFiles.open(sem.bill),
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 12,
        color: "#E8E4DC",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "pointer",
        textDecoration: "underline",
        textDecorationColor: "rgba(201,169,97,0.4)",
        textUnderlineOffset: 2
      }
    }, sem.bill.name || sem.bill.filename), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "#C9A961"
      }
    }, fmtMoney(sem.bill.amount), " ", sem.paidAt && `· paid ${fmtDate(sem.paidAt)}`)) : /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 12,
        color: "rgba(232,228,220,0.4)",
        fontStyle: "italic"
      }
    }, "\u2014")), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, sem.ip ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      onClick: () => window.BrialFiles.open(sem.ip),
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 12,
        color: "#E8E4DC",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "pointer",
        textDecoration: "underline",
        textDecorationColor: "rgba(201,169,97,0.4)",
        textUnderlineOffset: 2
      }
    }, sem.ip.name || sem.ip.filename), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: parseFloat(sem.ip.gpa) >= 2.75 ? "#86E5A7" : "#E58686"
      }
    }, "IP \xB7 ", sem.ip.gpa, parseFloat(sem.ip.gpa) < 2.75 && " ↓")) : /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 12,
        color: "rgba(232,228,220,0.4)",
        fontStyle: "italic"
      }
    }, "\u2014")), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: c,
        letterSpacing: "0.16em",
        textTransform: "uppercase"
      }
    }, sem.status.replace("-", " "))));
  })), app.graduation && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: "14px 18px",
      background: "rgba(201,169,97,0.06)",
      border: "1px solid rgba(201,169,97,0.3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "#C9A961",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "\u2605 Graduation submitted \xB7 ", fmtDate(app.graduation.graduatedAt)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(FileRow, {
    file: app.graduation.ijazahFile
  }), /*#__PURE__*/React.createElement(FileRow, {
    file: app.graduation.transkripFile
  })))), (app.status === "submitted" || app.status === "interview-scheduled" || app.status === "interview-done") && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: "flex",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => store.acceptApplication(app.id),
    style: {
      ...adminPrimaryBtn,
      background: "#86E5A7",
      flex: "1 1 200px"
    }
  }, "\u2713 Accept & Onboard"), /*#__PURE__*/React.createElement("button", {
    onClick: () => store.rejectApplication(app.id),
    style: {
      ...adminGhostBtn,
      flex: "1 1 200px"
    }
  }, "Decline")), /*#__PURE__*/React.createElement(ApplicantProfileView, {
    app: app
  }), (app.changeRequests || []).filter(r => r.status === "pending").length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      padding: 22,
      background: "rgba(201,169,97,0.07)",
      border: "1px solid rgba(201,169,97,0.35)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 14
    }
  }, "\u23F3 Change requests awaiting your approval"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, app.changeRequests.filter(r => r.status === "pending").map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      padding: "14px 16px",
      background: "rgba(10,22,40,0.5)",
      border: "1px solid rgba(201,169,97,0.18)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, r.label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginTop: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 20,
      color: "#E8E4DC"
    }
  }, r.type === "password" ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(232,228,220,0.6)"
    }
  }, "New password (hidden \u2014 approve to apply)") : /*#__PURE__*/React.createElement(React.Fragment, null, "\u2192 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#C9A961"
    }
  }, r.value)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      const res = await store.approveChange(app.id, r.id);
      if (res && res.error) alert(res.error);
    },
    style: {
      ...adminPrimaryBtn,
      background: "#86E5A7"
    }
  }, "\u2713 Approve"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const reason = prompt("Reason for rejecting (optional):") || "";
      store.rejectChange(app.id, r.id, reason);
    },
    style: adminGhostBtn
  }, "Reject")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.45)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Reviewer Notes (private)"), /*#__PURE__*/React.createElement("textarea", {
    value: notes,
    onChange: e => setNotes(e.target.value),
    onBlur: () => store.saveNotes(app.id, notes),
    placeholder: "Observations, recommendation rationale, follow-up questions\u2026",
    style: {
      width: "100%",
      minHeight: 110,
      resize: "vertical",
      background: "rgba(232,228,220,0.04)",
      border: "1px solid rgba(232,228,220,0.15)",
      color: "#E8E4DC",
      padding: 16,
      fontSize: 14,
      fontFamily: "'Cormorant Garamond', serif",
      lineHeight: 1.6,
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.35)",
      marginTop: 8,
      letterSpacing: "0.08em"
    }
  }, "\u21B3 Saves automatically on blur.")));
};

// ============================================================
// INBOX TAB
// ============================================================
const InboxTab = ({
  apps,
  store
}) => {
  const [filter, setFilter] = useState("active");
  const [selectedId, setSelectedId] = useState();
  const visible = useMemo(() => apps.filter(a => a.status !== "registered"), [apps]);
  const filtered = useMemo(() => {
    if (filter === "all") return apps;
    if (filter === "active") return visible.filter(a => !["accepted", "rejected"].includes(a.status));
    if (filter === "new") return visible.filter(a => a.isUserSubmitted);
    return apps.filter(a => a.status === filter);
  }, [apps, visible, filter]);
  useEffect(() => {
    if (!selectedId || !apps.find(a => a.id === selectedId)) {
      setSelectedId(filtered[0]?.id);
    }
  }, [filtered, apps, selectedId]);
  const selected = apps.find(a => a.id === selectedId) || filtered[0];
  const filters = [{
    id: "active",
    label: "Active",
    count: visible.filter(a => !["accepted", "rejected"].includes(a.status)).length
  }, {
    id: "all",
    label: "All",
    count: apps.length
  }, {
    id: "new",
    label: "New",
    count: visible.filter(a => a.isUserSubmitted).length
  }, {
    id: "submitted",
    label: "Admin",
    count: apps.filter(a => a.status === "submitted").length
  }, {
    id: "interview-scheduled",
    label: "Interview",
    count: apps.filter(a => a.status === "interview-scheduled").length
  }, {
    id: "interview-done",
    label: "Review",
    count: apps.filter(a => a.status === "interview-done").length
  }, {
    id: "accepted",
    label: "Granted",
    count: apps.filter(a => a.status === "accepted").length
  }, {
    id: "rejected",
    label: "Declined",
    count: apps.filter(a => a.status === "rejected").length
  }, {
    id: "registered",
    label: "Drafts",
    count: apps.filter(a => a.status === "registered").length
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(360px, 440px) 1fr",
      minHeight: "calc(100vh - 73px - 60px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: "1px solid rgba(201,169,97,0.12)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 22px",
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      display: "flex",
      gap: 5,
      flexWrap: "wrap"
    }
  }, filters.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.id,
    onClick: () => setFilter(f.id),
    style: {
      padding: "5px 10px",
      cursor: "pointer",
      background: filter === f.id ? "rgba(201,169,97,0.18)" : "transparent",
      color: filter === f.id ? "#C9A961" : "rgba(232,228,220,0.6)",
      border: `1px solid ${filter === f.id ? "rgba(201,169,97,0.5)" : "rgba(232,228,220,0.12)"}`,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.14em",
      textTransform: "uppercase"
    }
  }, f.label, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.6,
      marginLeft: 3
    }
  }, f.count)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      maxHeight: "calc(100vh - 73px - 60px - 60px)"
    }
  }, filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "60px 24px",
      textAlign: "center",
      color: "rgba(232,228,220,0.4)",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 20,
      fontStyle: "italic"
    }
  }, "No applications in this view.") : filtered.map(app => /*#__PURE__*/React.createElement(InboxRow, {
    key: app.id,
    app: app,
    active: selected?.id === app.id,
    onClick: () => setSelectedId(app.id)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: "hidden"
    }
  }, selected ? /*#__PURE__*/React.createElement(Detail, {
    app: selected,
    store: store
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 80,
      color: "rgba(232,228,220,0.4)",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 24,
      fontStyle: "italic"
    }
  }, "Select an application from the inbox.")));
};

// ============================================================
// LEGACY DISBURSEMENTS PANEL — founder records pre-website funding
// ============================================================
const LegacyPanel = ({
  store
}) => {
  const [open, setOpen] = useState(false);
  const legacy = store.getLegacy();
  const [totalFunds, setTotalFunds] = useState(String(legacy.totalFunds || ""));
  const [scholars, setScholars] = useState(legacy.scholars && legacy.scholars.length ? legacy.scholars : [{
    name: "",
    school: "",
    country: "",
    amount: ""
  }]);
  const [saved, setSaved] = useState(false);
  const setRow = (i, patch) => setScholars(rs => rs.map((r, idx) => idx === i ? {
    ...r,
    ...patch
  } : r));
  const addRow = () => setScholars(rs => [...rs, {
    name: "",
    school: "",
    country: "",
    amount: ""
  }]);
  const delRow = i => setScholars(rs => rs.filter((_, idx) => idx !== i));
  const save = () => {
    const cleaned = scholars.filter(s => (s.school || "").trim() || (s.name || "").trim());
    store.saveLegacy({
      totalFunds: parseFloat(totalFunds) || 0,
      count: cleaned.length,
      scholars: cleaned.map(s => ({
        name: (s.name || "").trim(),
        school: (s.school || "").trim(),
        country: (s.country || "").trim(),
        amount: parseFloat(s.amount) || 0
      }))
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 28,
      padding: 24,
      background: "rgba(201,169,97,0.06)",
      border: "1px solid rgba(201,169,97,0.28)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 18,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Founding-era disbursements"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      color: "#E8E4DC",
      marginTop: 6,
      letterSpacing: "-0.01em"
    }
  }, "Record scholars funded before the website existed."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      color: "rgba(232,228,220,0.55)",
      marginTop: 4
    }
  }, "These count toward the totals on the public homepage \u2014 funds, scholars, nations, and institutions.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(o => !o),
    style: {
      padding: "12px 22px",
      background: open ? "transparent" : "#C9A961",
      color: open ? "rgba(232,228,220,0.7)" : "#0A1628",
      border: open ? "1px solid rgba(232,228,220,0.25)" : "none",
      cursor: "pointer",
      whiteSpace: "nowrap",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, open ? "Close" : "Manage")), open && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 8,
      maxWidth: 360,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Total funds disbursed before website (USD)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      borderBottom: "1px solid rgba(232,228,220,0.2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 26,
      color: "#C9A961"
    }
  }, "$"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: totalFunds,
    onChange: e => setTotalFunds(e.target.value),
    placeholder: "0",
    style: {
      flex: 1,
      padding: "8px 0",
      background: "transparent",
      border: "none",
      color: "#E8E4DC",
      fontSize: 24,
      fontFamily: "'Cormorant Garamond', serif",
      outline: "none"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.45)"
    }
  }, "\u21B3 Lump total. Per-scholar amounts below are optional and shown on the ledger.")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Past scholars (name \xB7 school \xB7 country \xB7 amount)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, scholars.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1.4fr 1fr 0.8fr 32px",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: s.name,
    onChange: e => setRow(i, {
      name: e.target.value
    }),
    placeholder: "Name (optional)",
    style: legacyInput
  }), /*#__PURE__*/React.createElement("input", {
    value: s.school,
    onChange: e => setRow(i, {
      school: e.target.value
    }),
    placeholder: "School / university",
    style: legacyInput
  }), /*#__PURE__*/React.createElement("input", {
    value: s.country,
    onChange: e => setRow(i, {
      country: e.target.value
    }),
    placeholder: "Country",
    style: legacyInput
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: s.amount,
    onChange: e => setRow(i, {
      amount: e.target.value
    }),
    placeholder: "$",
    style: legacyInput
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => delRow(i),
    style: {
      background: "transparent",
      border: "1px solid rgba(229,134,134,0.3)",
      color: "#E58686",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 14
    }
  }, "\xD7")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 16,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: addRow,
    style: {
      padding: "8px 14px",
      background: "transparent",
      border: "1px solid rgba(201,169,97,0.4)",
      color: "#C9A961",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "+ Add scholar"), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: {
      padding: "10px 20px",
      background: "#C9A961",
      color: "#0A1628",
      border: "none",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, "Save"), saved && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#86E5A7"
    }
  }, "\u2713 Saved & live on homepage"))));
};
const legacyInput = {
  width: "100%",
  padding: "9px 12px",
  background: "rgba(10,22,40,0.4)",
  border: "1px solid rgba(232,228,220,0.15)",
  color: "#E8E4DC",
  fontSize: 13,
  fontFamily: "'Manrope', sans-serif",
  outline: "none"
};

// ============================================================
// DISBURSEMENTS TAB
// ============================================================
const DisbursementsTab = ({
  scholars,
  store
}) => {
  const [tab, setTab] = useState("pending");
  const [expanded, setExpanded] = useState(null);
  const rows = [];
  scholars.forEach(sc => {
    (sc.semesters || []).forEach(sem => {
      if (sem.bill) rows.push({
        scholar: sc,
        semester: sem
      });
    });
  });
  const pending = rows.filter(r => r.semester.status === "bill-uploaded");
  const paid = rows.filter(r => r.semester.status === "paid").sort((a, b) => new Date(b.semester.paidAt) - new Date(a.semester.paidAt));
  const shown = tab === "pending" ? pending : paid;
  const totalPending = pending.reduce((a, r) => a + (r.semester.bill?.amount || 0), 0);
  const totalPaid = paid.reduce((a, r) => a + (r.semester.bill?.amount || 0), 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px clamp(20px, 4vw, 56px) 80px"
    }
  }, /*#__PURE__*/React.createElement(LegacyPanel, {
    store: store
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "end",
      marginBottom: 32,
      flexWrap: "wrap",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#4FD1C5",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 II \u2014 Disbursement Queue"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 44,
      fontWeight: 400,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "16px 0 0"
    }
  }, "Bills awaiting your signature.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 1,
      background: "rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 24px",
      background: "rgba(20,36,66,0.6)",
      minWidth: 180
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "#4FD1C5",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Pending now"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 32,
      color: "#E8E4DC",
      marginTop: 8,
      fontVariantNumeric: "tabular-nums"
    }
  }, fmtMoney(totalPending))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 24px",
      background: "rgba(20,36,66,0.6)",
      minWidth: 180
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "#86E5A7",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Disbursed lifetime"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 32,
      color: "#E8E4DC",
      marginTop: 8,
      fontVariantNumeric: "tabular-nums"
    }
  }, fmtMoney(totalPaid))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 24
    }
  }, [{
    id: "pending",
    label: "Awaiting Payment",
    count: pending.length,
    color: "#4FD1C5"
  }, {
    id: "paid",
    label: "Settled",
    count: paid.length,
    color: "#86E5A7"
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    onClick: () => setTab(t.id),
    style: {
      padding: "10px 18px",
      cursor: "pointer",
      background: tab === t.id ? `${t.color}18` : "transparent",
      color: tab === t.id ? t.color : "rgba(232,228,220,0.6)",
      border: `1px solid ${tab === t.id ? `${t.color}55` : "rgba(232,228,220,0.12)"}`,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, t.label, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.7
    }
  }, t.count)))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 32px",
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr 1.1fr 1fr 24px",
      gap: 20,
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("div", null, "Scholar"), /*#__PURE__*/React.createElement("div", null, "Semester"), /*#__PURE__*/React.createElement("div", null, "Invoice"), /*#__PURE__*/React.createElement("div", null, "Amount"), /*#__PURE__*/React.createElement("div", null, "Status"), /*#__PURE__*/React.createElement("div", null)), shown.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "60px 32px",
      textAlign: "center",
      color: "rgba(232,228,220,0.4)",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      fontStyle: "italic"
    }
  }, tab === "pending" ? "Inbox clear. No bills awaiting your signature." : "No completed disbursements yet.") : shown.map(r => {
    const key = `${r.scholar.id}-${r.semester.id}`;
    const isExp = expanded === key;
    const pending = r.semester.status === "bill-uploaded";
    const accent = pending ? "#4FD1C5" : "#86E5A7";
    return /*#__PURE__*/React.createElement("div", {
      key: key,
      style: {
        borderBottom: "1px solid rgba(201,169,97,0.08)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => setExpanded(isExp ? null : key),
      style: {
        padding: "20px 32px",
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr 1.1fr 1fr 24px",
        gap: 20,
        alignItems: "center",
        cursor: "pointer",
        background: isExp ? "rgba(201,169,97,0.04)" : "transparent"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20,
        color: "#E8E4DC"
      }
    }, r.scholar.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)",
        letterSpacing: "0.14em",
        marginTop: 4
      }
    }, r.scholar.scholarId, " \xB7 ", r.scholar.profile?.university?.name)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 14,
        color: "#E8E4DC"
      }
    }, r.semester.label)), /*#__PURE__*/React.createElement("div", {
      onClick: e => {
        e.stopPropagation();
        window.BrialFiles.open(r.semester.bill);
      },
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: "rgba(232,228,220,0.85)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "pointer",
        textDecoration: "underline",
        textDecorationColor: "rgba(201,169,97,0.4)",
        textUnderlineOffset: 2
      }
    }, r.semester.bill?.name || r.semester.bill?.filename), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 22,
        color: accent,
        fontVariantNumeric: "tabular-nums"
      }
    }, fmtMoney(r.semester.bill?.amount)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 10px",
        background: `${accent}14`,
        border: `1px solid ${accent}55`,
        color: accent,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: accent,
        animation: pending ? "pulse 1.5s infinite" : "none"
      }
    }), pending ? "Pending" : "Paid")), /*#__PURE__*/React.createElement("div", {
      style: {
        color: "rgba(201,169,97,0.5)",
        fontFamily: "serif",
        fontSize: 16,
        transform: isExp ? "rotate(90deg)" : "rotate(0)",
        transition: "transform 0.25s"
      }
    }, "\u203A")), isExp && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "24px 32px 32px",
        background: "rgba(10,22,40,0.55)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 32
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        marginBottom: 12
      }
    }, "Invoice document"), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "20px 22px",
        background: "rgba(232,228,220,0.04)",
        border: "1px dashed rgba(201,169,97,0.3)",
        display: "flex",
        alignItems: "center",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "40",
      height: "50",
      viewBox: "0 0 32 40",
      fill: "none",
      stroke: "#C9A961",
      strokeWidth: "1"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M4 1 L22 1 L31 10 L31 39 L4 39 Z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M22 1 L22 10 L31 10"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => window.BrialFiles.open(r.semester.bill),
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 14,
        color: "#E8E4DC",
        fontWeight: 500,
        cursor: "pointer",
        textDecoration: "underline",
        textDecorationColor: "rgba(201,169,97,0.4)",
        textUnderlineOffset: 3
      }
    }, r.semester.bill?.name || r.semester.bill?.filename), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)",
        marginTop: 4
      }
    }, "Uploaded ", fmtDate(r.semester.bill?.uploadedAt))), /*#__PURE__*/React.createElement("button", {
      onClick: () => window.BrialFiles.open(r.semester.bill),
      style: {
        padding: "6px 12px",
        background: "transparent",
        border: "1px solid rgba(201,169,97,0.4)",
        color: "#C9A961",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase"
      }
    }, "Open \u2197")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Recipient wallet",
      value: r.scholar.walletShort
    }), /*#__PURE__*/React.createElement(Field, {
      label: "Trustee sigs",
      value: pending ? "0 / 3 awaiting" : "3 / 3 ✓"
    }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        marginBottom: 12
      }
    }, "Action"), pending ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 22,
        background: "rgba(79,209,197,0.06)",
        border: "1px solid rgba(79,209,197,0.25)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20,
        color: "#E8E4DC",
        lineHeight: 1.4
      }
    }, "Approve disbursement of ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: "#4FD1C5"
      }
    }, fmtMoney(r.semester.bill?.amount)), "?"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 12,
        color: "rgba(232,228,220,0.6)",
        marginTop: 10,
        lineHeight: 1.5
      }
    }, "Funds wired to ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#E8E4DC",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, r.scholar.walletShort), "."), /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        store.payBill(r.scholar.id, r.semester.id);
      },
      style: {
        ...adminPrimaryBtn,
        background: "#4FD1C5",
        marginTop: 16,
        width: "100%"
      }
    }, "\u2713 Confirm Payment")) : /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 22,
        background: "rgba(134,229,167,0.06)",
        border: "1px solid rgba(134,229,167,0.3)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "#86E5A7",
        letterSpacing: "0.22em"
      }
    }, "DISBURSEMENT COMPLETE"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 22,
        color: "#E8E4DC",
        marginTop: 8
      }
    }, "Paid ", fmtDate(r.semester.paidAt)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: "rgba(232,228,220,0.55)",
        marginTop: 8
      }
    }, "Tx \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#C9A961"
      }
    }, r.semester.txHash))))));
  })));
};

// ============================================================
// CONFIRM BUTTON — two-click confirmation (no native confirm())
// ============================================================
const ConfirmButton = ({
  onConfirm,
  children,
  confirmLabel = "Confirm?",
  style
}) => {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (armed) {
        onConfirm?.();
        setArmed(false);
      } else setArmed(true);
    },
    style: {
      ...style,
      background: armed ? "#E58686" : style?.background || "transparent",
      color: armed ? "#0A1628" : style?.color || "#E58686"
    }
  }, armed ? confirmLabel : children);
};

// ============================================================
// E-BOOKS TAB — founder-managed catalog (cover, title, link…)
// ============================================================
const EbooksTab = ({
  store
}) => {
  const [books, setBooks] = useState(() => store.listEbooks());
  const [saved, setSaved] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const update = (i, patch) => setBooks(bs => bs.map((b, idx) => idx === i ? {
    ...b,
    ...patch
  } : b));
  const remove = i => setBooks(bs => bs.filter((_, idx) => idx !== i));
  const add = () => setBooks(bs => [...bs, {
    id: "book-" + Date.now().toString(36),
    lang: "",
    langCode: "",
    title: "",
    subtitle: "",
    cover: "",
    link: "",
    getLabel: "Get the E-Book",
    supportNote: "A portion of every sale supports Brial Endowment scholarships.",
    accent: "#C9A961",
    desc: "",
    points: []
  }]);
  const move = (i, dir) => setBooks(bs => {
    const j = i + dir;
    if (j < 0 || j >= bs.length) return bs;
    const next = [...bs];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const uploadCover = async (i, file) => {
    if (!file) return;
    const v = window.BrialFiles.validate(file);
    if (!v.ok) {
      alert(v.error);
      return;
    }
    setUploadingIdx(i);
    try {
      const meta = await window.BrialFiles.put(file, { public: true });
      const url = meta.url || (window.brialSupabase && meta.path ? window.brialSupabase.publicUrl(meta.path) : "");
      update(i, {
        cover: url
      });
    } catch (e) {
      alert("Upload failed: " + (e.message || e));
    } finally {
      setUploadingIdx(null);
    }
  };
  const save = () => {
    store.saveEbooks(books);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  const inp = {
    width: "100%",
    padding: "10px 12px",
    background: "rgba(10,22,40,0.5)",
    border: "1px solid rgba(232,228,220,0.18)",
    color: "#E8E4DC",
    fontSize: 14,
    fontFamily: "'Manrope', sans-serif",
    outline: "none"
  };
  const lbl = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "rgba(232,228,220,0.5)",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px clamp(20px, 4vw, 56px) 80px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      flexWrap: "wrap",
      gap: 16,
      marginBottom: 30
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C98A61",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 Global Scholarship E-Books"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 44,
      fontWeight: 400,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "14px 0 0"
    }
  }, "Manage the e-book catalog."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "rgba(232,228,220,0.6)",
      margin: "10px 0 0",
      maxWidth: 620
    }
  }, "Add, edit, reorder, or remove the books shown on the public \"Global Scholarship E-Book\" page. Changes go live after you press Save.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, saved && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#86E5A7",
      letterSpacing: "0.1em"
    }
  }, "\u2713 Saved"), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: {
      background: "#C9A961",
      color: "#0A1628",
      border: "none",
      padding: "12px 24px",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 600
    }
  }, "Save catalog"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, books.map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: b.id || i,
    style: {
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.15)",
      padding: 24,
      display: "grid",
      gridTemplateColumns: "160px 1fr",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 160,
      aspectRatio: "1 / 1.414",
      border: "1px solid rgba(201,169,97,0.3)",
      overflow: "hidden",
      background: "#0A1628",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, b.cover ? /*#__PURE__*/React.createElement("img", {
    src: b.cover,
    alt: "cover",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.4)"
    }
  }, "No cover")), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      marginTop: 10,
      textAlign: "center",
      padding: "8px 0",
      border: "1px solid rgba(201,169,97,0.4)",
      color: "#C9A961",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.14em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: e => uploadCover(i, e.target.files?.[0]),
    disabled: uploadingIdx === i
  }), uploadingIdx === i ? "Uploading…" : "Upload cover"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 10,
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => move(i, -1),
    disabled: i === 0,
    title: "Move up",
    style: {
      background: "transparent",
      border: "1px solid rgba(232,228,220,0.2)",
      color: "rgba(232,228,220,0.7)",
      padding: "4px 10px",
      cursor: i === 0 ? "not-allowed" : "pointer",
      opacity: i === 0 ? 0.4 : 1,
      fontFamily: "monospace",
      fontSize: 12
    }
  }, "\u2191"), /*#__PURE__*/React.createElement("button", {
    onClick: () => move(i, 1),
    disabled: i === books.length - 1,
    title: "Move down",
    style: {
      background: "transparent",
      border: "1px solid rgba(232,228,220,0.2)",
      color: "rgba(232,228,220,0.7)",
      padding: "4px 10px",
      cursor: i === books.length - 1 ? "not-allowed" : "pointer",
      opacity: i === books.length - 1 ? 0.4 : 1,
      fontFamily: "monospace",
      fontSize: 12
    }
  }, "\u2193"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (confirm("Remove this book from the catalog?")) remove(i);
    },
    title: "Delete",
    style: {
      background: "transparent",
      border: "1px solid rgba(229,134,134,0.4)",
      color: "#E58686",
      padding: "4px 10px",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10
    }
  }, "Del"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 0.7fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Language"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: b.lang || "",
    onChange: e => update(i, {
      lang: e.target.value
    }),
    placeholder: "Bahasa Indonesia"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Lang code"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: b.langCode || "",
    onChange: e => update(i, {
      langCode: e.target.value
    }),
    placeholder: "ID"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Accent"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inp,
      padding: 4,
      height: 40
    },
    type: "color",
    value: b.accent || "#C9A961",
    onChange: e => update(i, {
      accent: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: b.title || "",
    onChange: e => update(i, {
      title: e.target.value
    }),
    placeholder: "Book title"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Subtitle"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: b.subtitle || "",
    onChange: e => update(i, {
      subtitle: e.target.value
    }),
    placeholder: "Subtitle"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Description"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inp,
      minHeight: 70,
      resize: "vertical",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 15
    },
    value: b.desc || "",
    onChange: e => update(i, {
      desc: e.target.value
    }),
    placeholder: "Short description of the book\u2026"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Key points (one per line)"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inp,
      minHeight: 60,
      resize: "vertical",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12
    },
    value: (b.points || []).join("\n"),
    onChange: e => update(i, {
      points: e.target.value.split("\n")
    }),
    placeholder: "Point 1\nPoint 2"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Purchase link"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: b.link || "",
    onChange: e => update(i, {
      link: e.target.value
    }),
    placeholder: "https://lynk.id/\u2026"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Button label"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: b.getLabel || "",
    onChange: e => update(i, {
      getLabel: e.target.value
    }),
    placeholder: "Dapatkan E-Book"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Support note (shown under button)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: b.supportNote || "",
    onChange: e => update(i, {
      supportNote: e.target.value
    }),
    placeholder: "Sebagian dari penjualan mendukung beasiswa Brial Endowment."
  })))))), /*#__PURE__*/React.createElement("button", {
    onClick: add,
    style: {
      marginTop: 18,
      background: "transparent",
      border: "1px dashed rgba(201,169,97,0.5)",
      color: "#C9A961",
      padding: "14px 24px",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      width: "100%"
    }
  }, "+ Add another e-book"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: {
      background: "#C9A961",
      color: "#0A1628",
      border: "none",
      padding: "12px 28px",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 600
    }
  }, saved ? "✓ Saved" : "Save catalog")));
};

// ============================================================
// HOUSES OF WORSHIP TAB — pillar grants (Minang Bandung, etc.)
// ============================================================
const WorshipTab = ({
  store
}) => {
  const grants = store.getPillarGrants().filter(g => g.pillar === "Houses of Worship");
  const total = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.amount) || 0), 0);
  const mosques = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.units) || 0), 0);
  const [form, setForm] = useState({
    partner: "Minang Bandung Foundation",
    project: "",
    amount: "",
    units: "",
    note: "",
    date: new Date().toISOString().slice(0, 10)
  });
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const submit = () => {
    if (!form.amount || !form.project.trim()) return;
    (form.editingId ? payload => store.updatePillarGrant(form.editingId, payload) : store.addPillarGrant)({
      pillar: "Houses of Worship",
      partner: form.partner,
      project: form.project,
      amount: parseFloat(form.amount),
      units: form.units,
      note: form.note,
      date: new Date(form.date).toISOString()
    });
    setForm({
      partner: "Minang Bandung Foundation",
      project: "",
      amount: "",
      units: "",
      note: "",
      date: new Date().toISOString().slice(0, 10)
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px clamp(20px, 4vw, 56px) 80px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "end",
      marginBottom: 32,
      flexWrap: "wrap",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 Pillar \u2014 Houses of Worship"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 44,
      fontWeight: 400,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "16px 0 0"
    }
  }, "Mosque construction grants."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "rgba(232,228,220,0.6)",
      margin: "10px 0 0",
      maxWidth: 560
    }
  }, "Record grants disbursed to Minang Bandung Foundation (or other partners) for the construction of houses of worship. These totals feed the public \"Total distributed \u2014 all pillars\" figure.")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 24px",
      background: "rgba(20,36,66,0.6)",
      border: "1px solid rgba(201,169,97,0.18)",
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "#C9A961",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Total granted"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 36,
      color: "#E8E4DC",
      marginTop: 8,
      fontVariantNumeric: "tabular-nums"
    }
  }, fmtMoney(total))), /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(201,169,97,0.18)", minWidth: 160 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#C9A961", letterSpacing: "0.2em", textTransform: "uppercase" }
  }, "Mosques built"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, mosques))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.18)",
      padding: 28,
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 18
    }
  }, "Record a new grant"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, "Partner / pelaksana"), /*#__PURE__*/React.createElement("input", {
    value: form.partner,
    onChange: e => set("partner", e.target.value),
    style: {
      ...adminInputStyle,
      width: "100%"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, "Project / lokasi"), /*#__PURE__*/React.createElement("input", {
    value: form.project,
    onChange: e => set("project", e.target.value),
    placeholder: "e.g. Masjid Pembangunan Tahap I",
    style: {
      ...adminInputStyle,
      width: "100%"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, "Amount (USD)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.amount,
    onChange: e => set("amount", e.target.value),
    placeholder: "0",
    style: {
      ...adminInputStyle,
      width: "100%"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => set("date", e.target.value),
    style: {
      ...adminInputStyle,
      width: "100%"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, "Mosques built (this grant)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    value: form.units,
    onChange: e => set("units", e.target.value),
    placeholder: "e.g. 1",
    style: {
      ...adminInputStyle,
      width: "100%"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 11, color: "rgba(232,228,220,0.45)", marginTop: 6 }
  }, "Feeds the \u201cRaised together\u201d count on the public Houses of Worship page.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, "Note (optional)"), /*#__PURE__*/React.createElement("input", {
    value: form.note,
    onChange: e => set("note", e.target.value),
    placeholder: "Brief description",
    style: {
      ...adminInputStyle,
      width: "100%"
    }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !form.amount || !form.project.trim(),
    style: {
      ...adminPrimaryBtn,
      marginTop: 18,
      opacity: !form.amount || !form.project.trim() ? 0.5 : 1,
      cursor: !form.amount || !form.project.trim() ? "not-allowed" : "pointer"
    }
  }, form.editingId ? "Save changes" : "+ Record grant")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 28px",
      display: "grid",
      gridTemplateColumns: "1.3fr 0.9fr 0.7fr 1fr 0.7fr 50px",
      gap: 16,
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("div", null, "Project"), /*#__PURE__*/React.createElement("div", null, "Partner"), /*#__PURE__*/React.createElement("div", null, "Amount"), /*#__PURE__*/React.createElement("div", null, "Reference"), /*#__PURE__*/React.createElement("div", null, "Date"), /*#__PURE__*/React.createElement("div", null)), grants.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "60px 28px",
      textAlign: "center",
      color: "rgba(232,228,220,0.4)",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      fontStyle: "italic"
    }
  }, "No grants recorded yet.") : grants.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    style: {
      padding: "18px 28px",
      display: "grid",
      gridTemplateColumns: "1.3fr 0.9fr 0.7fr 1fr 0.7fr 50px",
      gap: 16,
      alignItems: "center",
      borderBottom: "1px solid rgba(201,169,97,0.08)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      color: "#E8E4DC"
    }
  }, g.project), g.note && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      color: "rgba(232,228,220,0.55)",
      marginTop: 3
    }
  }, g.note), Number(g.units) > 0 ? /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#C9A961", letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 5 }
  }, g.units + (Number(g.units) === 1 ? " mosque" : " mosques") + " \u00b7 counted") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      color: "rgba(232,228,220,0.8)"
    }
  }, g.partner), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 20,
      color: "#C9A961",
      fontVariantNumeric: "tabular-nums"
    }
  }, fmtMoney(g.amount)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.7)",
      overflowWrap: "anywhere"
    }
  }, g.txRef || "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.6)"
    }
  }, fmtDate(g.date)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm(f => ({ ...f, editingId: g.id, partner: g.partner || "", project: g.project || "", country: g.country || f.country || "", amount: String(g.amount || ""), units: String(g.units || ""), note: g.note || "", date: g.date ? String(g.date).slice(0, 10) : f.date })),
    title: "Load this grant into the form above, then Save changes",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(201,169,97,0.4)", color: "#C9A961", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    onClick: () => store.updatePillarGrant(g.id, { archived: !g.archived }),
    title: g.archived ? "Restore into public totals" : "Archive: keep the record, remove it from public totals",
    style: { padding: "5px 10px", background: g.archived ? "rgba(201,169,97,0.15)" : "transparent", border: "1px solid rgba(232,228,220,0.3)", color: g.archived ? "#C9A961" : "rgba(232,228,220,0.55)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, g.archived ? "Restore" : "Archive"), /*#__PURE__*/React.createElement(ConfirmButton, {
    onConfirm: () => store.deletePillarGrant(g.id),
    confirmLabel: "Sure?",
    style: {
      padding: "5px 10px",
      background: "transparent",
      border: "1px solid rgba(229,134,134,0.35)",
      color: "#E58686",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.14em",
      textTransform: "uppercase"
    }
  }, "Del")))));
};
const worshipLabel = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  color: "rgba(232,228,220,0.5)",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  marginBottom: 8
};

// ============================================================
// PAYMENT CHANNELS — QR preview + inflow editor (Donations tab)
// ============================================================
const QrPreview = ({
  value,
  size = 108
}) => {
  const qr = useMemo(() => {
    try {
      const lib = window.qrcode;
      if (!lib || !value || !value.trim()) return null;
      const q = lib(0, "M");
      q.addData(value.trim());
      q.make();
      const n = q.getModuleCount();
      let path = "";
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
      return { path, n };
    } catch (e) {
      return null;
    }
  }, [value]);
  if (!qr) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: { background: "#F8F4EB", padding: 7, display: "inline-block", lineHeight: 0, flexShrink: 0 }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${qr.n} ${qr.n}`,
    shapeRendering: "crispEdges"
  }, /*#__PURE__*/React.createElement("rect", {
    width: qr.n,
    height: qr.n,
    fill: "#F8F4EB"
  }), /*#__PURE__*/React.createElement("path", {
    d: qr.path,
    fill: "#0A1628"
  })));
};
const payLabel = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  color: "rgba(232,228,220,0.5)",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  marginBottom: 6,
  display: "block"
};
const PaymentChannelsPanel = ({
  store
}) => {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(() => store.getPaymentConfig());
  const [saved, setSaved] = useState(false);
  const set = (grp, k, v) => setCfg(p => ({ ...p, [grp]: { ...p[grp], [k]: v } }));
  const save = () => {
    store.savePaymentConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };
  const on = g => cfg[g].enabled !== false;
  const addr = cfg.usdt.address || "";
  const shortAddr = addr.length > 12 ? addr.slice(0, 6) + "\u2026" + addr.slice(-4) : addr;
  const h = React.createElement;
  const toggle = grp => h("button", {
    onClick: () => set(grp, "enabled", !on(grp)),
    style: {
      padding: "5px 12px", cursor: "pointer", flexShrink: 0,
      background: on(grp) ? "rgba(134,229,167,0.12)" : "transparent",
      color: on(grp) ? "#86E5A7" : "rgba(232,228,220,0.45)",
      border: `1px solid ${on(grp) ? "rgba(134,229,167,0.45)" : "rgba(232,228,220,0.2)"}`,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase"
    }
  }, on(grp) ? "\u25cf Shown" : "\u25cb Hidden");
  const groupCard = { background: "rgba(10,22,40,0.45)", border: "1px solid rgba(201,169,97,0.16)", padding: 22, display: "flex", flexDirection: "column", gap: 14 };
  const groupHead = (label, color, grp) => h("div", {
    style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }
  }, h("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, label), toggle(grp));
  const field = (label, grp, key, extra) => h("div", null, h("span", {
    style: payLabel
  }, label), h("input", {
    value: cfg[grp][key],
    onChange: e => set(grp, key, e.target.value),
    spellCheck: false,
    ...(extra || {}),
    style: { ...adminInputStyle, width: "100%", ...((extra || {}).style || {}) }
  }));
  const mcLogo = h("span", {
    style: { background: "#FFFFFF", borderRadius: 4, padding: "5px 9px", display: "inline-flex", alignItems: "center" }
  }, h("svg", {
    width: "36", height: "22", viewBox: "0 0 46 28"
  }, h("circle", { cx: "18", cy: "14", r: "11", fill: "#EB001B" }), h("circle", { cx: "28", cy: "14", r: "11", fill: "#F79E1B" }), h("path", { d: "M23 5.9 A11 11 0 0 1 27 14 A11 11 0 0 1 23 22.1 A11 11 0 0 1 19 14 A11 11 0 0 1 23 5.9 Z", fill: "#FF5F00" })));
  const visaLogo = h("span", {
    style: { background: "#FFFFFF", borderRadius: 4, padding: "5px 9px", display: "inline-flex", alignItems: "center" }
  }, h("svg", {
    width: "40", height: "22", viewBox: "0 0 52 28"
  }, h("text", {
    x: "26", y: "19.5", textAnchor: "middle", fontFamily: "Arial Black, Arial, sans-serif", fontStyle: "italic", fontWeight: "900", fontSize: "15", fill: "#1A1F71", letterSpacing: "0.5"
  }, "VISA")));
  return h("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,169,97,0.22)", marginBottom: 28 }
  }, h("button", {
    onClick: () => setOpen(o => !o),
    style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, background: "transparent", border: "none", cursor: "pointer", padding: "18px 24px", textAlign: "left" }
  }, h("div", {
    style: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }
  }, h("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#C9A961", letterSpacing: "0.24em", textTransform: "uppercase" }
  }, "\u2699 Payment Channels"), h("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(232,228,220,0.45)", letterSpacing: "0.08em" }
  }, "USDT " + shortAddr + " \u00b7 " + cfg.bank.bank + " \u00b7 Card " + (on("card") ? "on" : "off"))), h("span", {
    style: { color: "#C9A961", fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s" }
  }, "\u25be")), open && h("div", {
    style: { padding: "0 24px 24px" }
  }, h("div", {
    style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }
  }, h("div", {
    style: groupCard
  }, groupHead("USDT \u00b7 On-chain", "#4FD1C5", "usdt"), field("Wallet address", "usdt", "address", { style: { fontSize: 12 } }), h("div", {
    style: { display: "flex", gap: 14, alignItems: "flex-start" }
  }, h("div", {
    style: { flex: 1, display: "flex", flexDirection: "column", gap: 10 }
  }, field("Network", "usdt", "network"), field("Asset", "usdt", "asset"), field("Confirmations", "usdt", "confirmations", { type: "number", min: "1" })), h("div", {
    style: { textAlign: "center" }
  }, h(QrPreview, {
    value: cfg.usdt.address
  }), h("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(232,228,220,0.4)", letterSpacing: "0.1em", marginTop: 6, maxWidth: 122, lineHeight: 1.5 }
  }, "LIVE QR \u2014 AUTO-GENERATED FROM THE ADDRESS")))), h("div", {
    style: groupCard
  }, groupHead("Bank Transfer \u00b7 IDR", "#C9A961", "bank"), field("Bank", "bank", "bank"), field("Account number", "bank", "account"), field("Account holder", "bank", "holder"), field("Currency label", "bank", "currency")), h("div", {
    style: groupCard
  }, groupHead("Card \u00b7 Mastercard / Visa", "#C98A61", "card"), h("div", {
    style: { display: "flex", gap: 8 }
  }, mcLogo, visaLogo), field("Redirect link (checkout page)", "card", "link", { placeholder: "https://lynk.id/brial/s/\u2026", style: { fontSize: 12 } }), cfg.card.link && !/^https?:\/\//i.test(cfg.card.link.trim()) && h("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#E58686" }
  }, "Link should start with http:// or https://"), h("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 12, lineHeight: 1.6, color: "rgba(232,228,220,0.55)" }
  }, "The Mastercard/Visa button on the donate page opens this link in a new tab."))), h("div", {
    style: { display: "flex", alignItems: "center", gap: 14, marginTop: 18 }
  }, h("button", {
    onClick: save,
    style: adminPrimaryBtn
  }, saved ? "\u2713 Saved \u2014 live on the donate page" : "Save channels"), saved && h("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#86E5A7", letterSpacing: "0.1em" }
  }, "Synced."))));
};

// ============================================================
// DONATIONS TAB — patron contributions ledger
// ============================================================
const DonationsTab = ({
  donations,
  store
}) => {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(null);

  // Merge real donations (excluding internal aggregates) with per-grant pillar rows.
  // BrialStore.listDonations() already strips internal KV rows; the extra
  // isInternalDonation pass here is defence in depth.
  const donationsView = useMemo(() => {
    const real = (donations || []).filter(d => !(store.isInternalDonation && store.isInternalDonation(d)));
    const pillarRows = (store.getPillarGrants() || []).map(g => ({
      id: g.id,
      name: (g.partner || "Pillar grant") + (g.project ? " · " + g.project : ""),
      amount: g.amount,
      txHash: g.txRef || "",
      submittedAt: g.date,
      verified: true,
      anonymous: false,
      isPillar: true,
      pillar: g.pillar
    }));
    return [...real, ...pillarRows].sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  }, [donations, store]);
  const donationsList = donationsView;
  const total = donationsList.reduce((a, d) => a + (d.amount || 0), 0);
  const verifiedTotal = donationsList.filter(d => d.verified).reduce((a, d) => a + (d.amount || 0), 0);
  const pendingTotal = donationsList.filter(d => !d.verified).reduce((a, d) => a + (d.amount || 0), 0);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return donationsList.filter(d => {
      if (filter === "pending" && d.verified) return false;
      if (filter === "verified" && !d.verified) return false;
      if (filter === "anonymous" && !d.anonymous) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || (d.email || "").toLowerCase().includes(q) || (d.country || "").toLowerCase().includes(q) || (d.txHash || "").toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
    });
  }, [donations, filter, query]);
  const copy = async (text, id) => {
    const ok = await window.BrialClipboard.copy(text);
    if (ok) {
      setCopied(id);
      setTimeout(() => setCopied(c => c === id ? null : c), 1400);
    }
  };
  const filters = [{
    id: "all",
    label: "All",
    count: donationsList.length
  }, {
    id: "pending",
    label: "Pending",
    count: donationsList.filter(d => !d.verified).length
  }, {
    id: "verified",
    label: "Verified",
    count: donationsList.filter(d => d.verified).length
  }, {
    id: "anonymous",
    label: "Anonymous",
    count: donationsList.filter(d => d.anonymous).length
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px clamp(20px, 4vw, 56px) 80px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "end",
      marginBottom: 32,
      flexWrap: "wrap",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 Patronage Ledger"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 44,
      fontWeight: 400,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "16px 0 8px"
    }
  }, donationsList.length, " donation", donationsList.length === 1 ? "" : "s", " on record."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "rgba(232,228,220,0.6)",
      margin: 0
    }
  }, "Mark a donation as verified after you reconcile its transaction hash on Etherscan.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 1,
      background: "rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 22px",
      background: "rgba(20,36,66,0.6)",
      minWidth: 160
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "#C9A961",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Total received"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 30,
      color: "#E8E4DC",
      marginTop: 8,
      fontVariantNumeric: "tabular-nums"
    }
  }, "$", total.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 22px",
      background: "rgba(20,36,66,0.6)",
      minWidth: 160
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "#86E5A7",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Verified"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 30,
      color: "#E8E4DC",
      marginTop: 8,
      fontVariantNumeric: "tabular-nums"
    }
  }, "$", verifiedTotal.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 22px",
      background: "rgba(20,36,66,0.6)",
      minWidth: 160
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "#4FD1C5",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Pending review"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 30,
      color: "#E8E4DC",
      marginTop: 8,
      fontVariantNumeric: "tabular-nums"
    }
  }, "$", pendingTotal.toLocaleString())))), /*#__PURE__*/React.createElement(PaymentChannelsPanel, {
    store: store
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      marginBottom: 24,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "1 1 280px",
      maxWidth: 380,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      background: "rgba(20,36,66,0.6)",
      border: "1px solid rgba(232,228,220,0.18)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none",
    stroke: "rgba(232,228,220,0.5)",
    strokeWidth: "1.2"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "4.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9.5",
    y1: "9.5",
    x2: "13",
    y2: "13"
  })), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Search name, email, tx hash, country\u2026",
    style: {
      flex: 1,
      background: "transparent",
      border: "none",
      color: "#E8E4DC",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      outline: "none"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap"
    }
  }, filters.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.id,
    onClick: () => setFilter(f.id),
    style: {
      padding: "6px 12px",
      cursor: "pointer",
      background: filter === f.id ? "rgba(201,169,97,0.18)" : "transparent",
      color: filter === f.id ? "#C9A961" : "rgba(232,228,220,0.6)",
      border: `1px solid ${filter === f.id ? "rgba(201,169,97,0.5)" : "rgba(232,228,220,0.12)"}`,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.14em",
      textTransform: "uppercase"
    }
  }, f.label, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.6,
      marginLeft: 3
    }
  }, f.count))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 28px",
      display: "grid",
      gridTemplateColumns: "80px 1.6fr 1fr 1.6fr 1.2fr 110px 100px",
      gap: 16,
      alignItems: "center",
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("div", null, "ID"), /*#__PURE__*/React.createElement("div", null, "Donor"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, "Amount"), /*#__PURE__*/React.createElement("div", null, "Tx Hash"), /*#__PURE__*/React.createElement("div", null, "Submitted"), /*#__PURE__*/React.createElement("div", null, "Status"), /*#__PURE__*/React.createElement("div", null)), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "60px 28px",
      textAlign: "center",
      color: "rgba(232,228,220,0.4)",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      fontStyle: "italic"
    }
  }, "No donations match this filter.") : filtered.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.id,
    style: {
      display: "grid",
      gridTemplateColumns: "80px 1.6fr 1fr 1.6fr 1.2fr 110px 100px",
      gap: 16,
      padding: "18px 28px",
      borderBottom: "1px solid rgba(201,169,97,0.08)",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.65)",
      letterSpacing: "0.12em",
      paddingTop: 4
    }
  }, d.id), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      color: "#E8E4DC",
      lineHeight: 1.2
    }
  }, d.anonymous ? /*#__PURE__*/React.createElement("em", {
    style: {
      color: "rgba(232,228,220,0.6)"
    }
  }, "Anonymous patron") : d.name), (d.email || d.country) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.06em",
      marginTop: 3
    }
  }, d.email && /*#__PURE__*/React.createElement("span", null, d.email), d.email && d.country && " · ", d.country), d.message && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 13,
      fontStyle: "italic",
      color: "rgba(232,228,220,0.55)",
      marginTop: 4,
      lineHeight: 1.45
    }
  }, "\"", d.message, "\"")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 24,
      color: "#C9A961",
      fontVariantNumeric: "tabular-nums",
      textAlign: "right",
      lineHeight: 1.1
    }
  }, "$", d.amount.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
      paddingTop: 4
    }
  }, /*#__PURE__*/React.createElement("a", {
    // Only link out when the value actually looks like an Ethereum tx hash —
    // bank-transfer notes ("Transfer Bank Jago …") stay plain text.
    href: /^0x[0-9a-f]{10,}$/i.test(d.txHash || "") ? `https://etherscan.io/tx/${d.txHash}` : undefined,
    target: "_blank",
    rel: "noopener noreferrer",
    title: /^0x[0-9a-f]{10,}$/i.test(d.txHash || "") ? "View on Etherscan" : undefined,
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#7AA9E6",
      textDecoration: "underline",
      textUnderlineOffset: 3,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      minWidth: 0
    }
  }, d.txHash || "—"), d.txHash && /*#__PURE__*/React.createElement("button", {
    onClick: () => copy(d.txHash, d.id + ":tx"),
    style: {
      flexShrink: 0,
      padding: "2px 8px",
      background: "transparent",
      border: "1px solid rgba(201,169,97,0.3)",
      color: copied === d.id + ":tx" ? "#86E5A7" : "#C9A961",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.14em",
      textTransform: "uppercase"
    }
  }, copied === d.id + ":tx" ? "✓" : "Copy")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.65)",
      paddingTop: 4
    }
  }, fmtDate(d.submittedAt)), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 8px",
      background: d.verified ? "rgba(134,229,167,0.14)" : "rgba(79,209,197,0.14)",
      border: `1px solid ${d.verified ? "rgba(134,229,167,0.4)" : "rgba(79,209,197,0.4)"}`,
      color: d.verified ? "#86E5A7" : "#4FD1C5",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: d.verified ? "#86E5A7" : "#4FD1C5",
      animation: d.verified ? "none" : "pulse 1.5s infinite"
    }
  }), d.verified ? "Verified" : "Pending")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      alignItems: "flex-end"
    }
  }, !d.verified && /*#__PURE__*/React.createElement("button", {
    onClick: () => store.markDonationVerified(d.id),
    style: {
      padding: "5px 10px",
      background: "#86E5A7",
      color: "#0A1628",
      border: "none",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, "\u2713 Verify"), /*#__PURE__*/React.createElement(ConfirmButton, {
    onConfirm: () => store.deleteDonation(d.id),
    style: {
      padding: "4px 10px",
      background: "transparent",
      border: "1px solid rgba(229,134,134,0.3)",
      color: "#E58686",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Delete"))))));
};

// ============================================================
// BACKUP BAR — CSV, JSON export, JSON import
// ============================================================
function download(filename, content, mime) {
  const blob = new Blob([content], {
    type: mime
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function buildAccountsCSV(apps) {
  const headers = ["ID", "Name", "Email", "Password", "Status", "Scholar ID", "Cohort", "Scholar Status", "Signed Up", "Submitted", "Interview At", "Interview Done", "Accepted", "Rejected", "Country", "Phone", "Date Of Birth", "National ID", "High School", "Graduation Year", "Final GPA", "Education Level", "University", "Program", "Current Semester", "Current GPA", "UKT/sem (USD)", "Essay (excerpt)", "Notes"];
  const rows = apps.map(a => {
    const p = a.profile || {};
    const per = p.personal || {};
    const hs = p.highSchool || {};
    const u = p.university || {};
    return [a.id, a.name, a.email, a.passwordHash ? "(secure hash)" : a.password, a.status, a.scholarId || "", a.cohort || "", a.scholarStatus || "", a.signedUpAt || "", a.submittedAt || "", a.interviewAt || "", a.interviewDoneAt || "", a.acceptedAt || "", a.rejectedAt || "", per.country, per.phone, per.dateOfBirth, per.nationalId, hs.schoolName, hs.graduationYear, hs.finalGPA, u.degreeLevel, u.name, u.program, u.currentSemester, u.currentGPA, u.uktPerSemester, (p.essay || "").slice(0, 280), a.notes || ""].map(csvEscape).join(",");
  });
  return headers.map(csvEscape).join(",") + "\n" + rows.join("\n") + "\n";
}
function stampedFilename(prefix, ext) {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${prefix}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.${ext}`;
}
const BackupBar = ({
  apps
}) => {
  const store = useStore();
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [mode, setMode] = useState("merge");
  const fileInputRef = React.useRef(null);
  const exportCSV = () => {
    download(stampedFilename("brial_accounts", "csv"), "\uFEFF" + buildAccountsCSV(apps), "text/csv;charset=utf-8");
  };
  const exportJSON = () => {
    const snapshot = store.exportSnapshot();
    download(stampedFilename("brial_backup", "json"), JSON.stringify(snapshot, null, 2), "application/json");
  };
  const handleImport = async e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      const r = store.importSnapshot(data, {
        mergeMode: mode
      });
      setImportResult(r);
    } catch (err) {
      setImportResult({
        ok: false,
        error: "Invalid JSON: " + (err.message || err)
      });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };
  const lastExport = (() => {
    try {
      return localStorage.getItem("brial.lastExportAt");
    } catch (e) {
      return null;
    }
  })();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 28,
      padding: 24,
      background: "rgba(122,169,230,0.06)",
      border: "1px solid rgba(122,169,230,0.28)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "start",
      gap: 20,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#7AA9E6",
      letterSpacing: "0.24em",
      textTransform: "uppercase"
    }
  }, "Disaster recovery \xB7 Backup & restore"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 24,
      color: "#E8E4DC",
      margin: "10px 0 6px",
      letterSpacing: "-0.01em",
      lineHeight: 1.2
    }
  }, "Save your data before anything goes wrong."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.65)"
    }
  }, "Export weekly. The ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "JSON snapshot"), " can be re-imported here or sent back to Claude to reseed the system without losing applicant data. The ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "CSV"), " opens directly in Excel.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: exportCSV,
    style: exportBtnStyle("#86E5A7")
  }, "\u2193 Export Excel (CSV)"), /*#__PURE__*/React.createElement("button", {
    onClick: exportJSON,
    style: exportBtnStyle("#C9A961")
  }, "\u2193 Export Backup (JSON)"))), /*#__PURE__*/React.createElement("details", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#7AA9E6",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      listStyle: "none"
    }
  }, "\u21B3 Restore from a JSON backup"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 16,
      background: "rgba(10,22,40,0.4)",
      border: "1px solid rgba(122,169,230,0.2)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, "Mode:"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMode("merge"),
    style: modeBtnStyle(mode === "merge")
  }, "Merge (safe)"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMode("replace"),
    style: modeBtnStyle(mode === "replace")
  }, "Replace all")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.6)",
      marginTop: 10
    }
  }, mode === "merge" ? "Existing accounts with matching IDs are overwritten; new accounts are added. Other accounts untouched." : "⚠ Every current applicant and donation is replaced by the snapshot. Use only after a fresh deploy."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".json,application/json",
    ref: fileInputRef,
    onChange: handleImport,
    style: {
      display: "none"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => fileInputRef.current?.click(),
    disabled: importing,
    style: {
      ...exportBtnStyle("#7AA9E6"),
      opacity: importing ? 0.6 : 1,
      cursor: importing ? "wait" : "pointer"
    }
  }, importing ? "Restoring…" : "Select JSON backup file ↑"), importResult && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 14px",
      background: importResult.ok ? "rgba(134,229,167,0.1)" : "rgba(229,134,134,0.1)",
      border: `1px solid ${importResult.ok ? "rgba(134,229,167,0.4)" : "rgba(229,134,134,0.4)"}`,
      color: importResult.ok ? "#86E5A7" : "#E58686",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.06em"
    }
  }, importResult.ok ? importResult.mode === "replace" ? `✓ Replaced — ${importResult.count} accounts loaded` : `✓ Merged — ${importResult.added} added, ${importResult.updated} updated` : `✗ ${importResult.error}`)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: "12px 16px",
      background: "rgba(201,169,97,0.06)",
      border: "1px solid rgba(201,169,97,0.22)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "#C9A961",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 6
    }
  }, "\xA7 Handoff to Claude"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12.5,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.7)"
    }
  }, "To restore after a full rebuild, upload the JSON backup to Claude with the message: ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: "#E8E4DC"
    }
  }, "\"Reseed the Brial endowment with this backup; do not modify applicant data.\""), " Claude will paste it into ", /*#__PURE__*/React.createElement("code", {
    style: {
      color: "#C9A961",
      fontFamily: "'JetBrains Mono', monospace"
    }
  }, "BrialStore.importSnapshot(snapshot, { mergeMode: 'replace' })"), " on the new build.")));
};
const exportBtnStyle = color => ({
  padding: "10px 18px",
  background: color,
  color: "#0A1628",
  border: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "'Manrope', sans-serif",
  fontSize: 12,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 500
});
const modeBtnStyle = active => ({
  padding: "6px 12px",
  background: active ? "rgba(122,169,230,0.18)" : "transparent",
  color: active ? "#7AA9E6" : "rgba(232,228,220,0.6)",
  border: `1px solid ${active ? "rgba(122,169,230,0.5)" : "rgba(232,228,220,0.15)"}`,
  cursor: "pointer",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase"
});

// ============================================================
// REPORTS TAB — problem reports submitted by applicants
// ============================================================
const ReportsTab = ({
  reports,
  store
}) => {
  const [filter, setFilter] = useState("open");
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);
  const counts = {
    all: reports.length,
    open: reports.filter(r => r.status === "open").length,
    replied: reports.filter(r => r.status === "replied").length,
    resolved: reports.filter(r => r.status === "resolved").length
  };
  const sendReply = id => {
    if (!replyText.trim()) return;
    store.replyReport(id, replyText.trim());
    setReplyText("");
    setReplyFor(null);
  };
  const categoryLabel = c => ({
    technical: "Technical",
    data: "Data",
    payment: "Payment",
    other: "Other"
  })[c] || c;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px clamp(20px, 4vw, 56px) 80px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#E58686",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 Reports \xB7 Help Desk"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 44,
      fontWeight: 400,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "16px 0 8px"
    }
  }, counts.open, " open report", counts.open === 1 ? "" : "s", "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "rgba(232,228,220,0.6)",
      margin: 0
    }
  }, "Applicants and scholars can send problem reports from inside their portal. Reply or resolve from here \u2014 the response appears in their portal instantly.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 22
    }
  }, [{
    id: "open",
    label: "Open",
    c: counts.open,
    color: "#C9A961"
  }, {
    id: "replied",
    label: "Replied",
    c: counts.replied,
    color: "#4FD1C5"
  }, {
    id: "resolved",
    label: "Resolved",
    c: counts.resolved,
    color: "#86E5A7"
  }, {
    id: "all",
    label: "All",
    c: counts.all,
    color: "#7E8AA0"
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    onClick: () => setFilter(t.id),
    style: {
      padding: "6px 12px",
      cursor: "pointer",
      background: filter === t.id ? `${t.color}18` : "transparent",
      color: filter === t.id ? t.color : "rgba(232,228,220,0.6)",
      border: `1px solid ${filter === t.id ? `${t.color}55` : "rgba(232,228,220,0.15)"}`,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, t.label, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.7,
      marginLeft: 4
    }
  }, t.c)))), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 60,
      textAlign: "center",
      background: "rgba(20,36,66,0.4)",
      border: "1px solid rgba(201,169,97,0.12)",
      color: "rgba(232,228,220,0.45)",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      fontStyle: "italic"
    }
  }, filter === "open" ? "Inbox clear. No open reports." : "Nothing in this view.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      background: "rgba(201,169,97,0.1)"
    }
  }, filtered.map(r => {
    const replying = replyFor === r.id;
    const statusColor = r.status === "resolved" ? "#86E5A7" : r.status === "replied" ? "#4FD1C5" : "#C9A961";
    return /*#__PURE__*/React.createElement("div", {
      key: r.id,
      style: {
        padding: "20px 24px",
        background: "rgba(20,36,66,0.55)",
        borderLeft: `3px solid ${statusColor}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 16,
        alignItems: "start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)",
        letterSpacing: "0.14em"
      }
    }, r.id), /*#__PURE__*/React.createElement("span", {
      style: {
        padding: "2px 8px",
        border: `1px solid ${statusColor}55`,
        background: `${statusColor}14`,
        color: statusColor,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.18em",
        textTransform: "uppercase"
      }
    }, r.status), /*#__PURE__*/React.createElement("span", {
      style: {
        padding: "2px 8px",
        border: "1px solid rgba(232,228,220,0.15)",
        color: "rgba(232,228,220,0.6)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.18em",
        textTransform: "uppercase"
      }
    }, categoryLabel(r.category))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 22,
        color: "#E8E4DC",
        marginTop: 8,
        letterSpacing: "-0.01em"
      }
    }, r.subject), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: "rgba(232,228,220,0.55)",
        marginTop: 6
      }
    }, r.applicantName, " \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#C9A961"
      }
    }, r.applicantEmail), " \xB7 ", r.applicantId), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 16,
        lineHeight: 1.65,
        color: "rgba(232,228,220,0.85)",
        marginTop: 14,
        marginBottom: 0,
        paddingLeft: 14,
        borderLeft: "2px solid rgba(201,169,97,0.25)"
      }
    }, r.message), r.reply && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14,
        padding: "12px 16px",
        background: "rgba(79,209,197,0.06)",
        borderLeft: "3px solid #4FD1C5"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: "#4FD1C5",
        letterSpacing: "0.2em",
        textTransform: "uppercase"
      }
    }, "Your reply \xB7 ", fmtDate(r.reply.at)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 15,
        color: "#E8E4DC",
        marginTop: 6,
        fontStyle: "italic",
        lineHeight: 1.5
      }
    }, "\"", r.reply.text, "\""))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)",
        whiteSpace: "nowrap"
      }
    }, fmtDate(r.submittedAt))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16,
        display: "flex",
        gap: 10,
        flexWrap: "wrap"
      }
    }, r.status !== "resolved" && !replying && /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setReplyFor(r.id);
        setReplyText(r.reply?.text || "");
      },
      style: {
        padding: "6px 14px",
        background: "transparent",
        border: "1px solid rgba(79,209,197,0.45)",
        color: "#4FD1C5",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase"
      }
    }, r.reply ? "Edit reply" : "Reply"), r.status !== "resolved" && /*#__PURE__*/React.createElement("button", {
      onClick: () => store.resolveReport(r.id),
      style: {
        padding: "6px 14px",
        background: "transparent",
        border: "1px solid rgba(134,229,167,0.45)",
        color: "#86E5A7",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase"
      }
    }, "\u2713 Resolve"), /*#__PURE__*/React.createElement(ConfirmButton, {
      onConfirm: () => store.deleteReport(r.id),
      style: {
        padding: "6px 14px",
        background: "transparent",
        border: "1px solid rgba(229,134,134,0.3)",
        color: "#E58686",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase"
      }
    }, "Delete")), replying && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14,
        padding: 16,
        background: "rgba(10,22,40,0.5)",
        border: "1px solid rgba(79,209,197,0.3)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "#4FD1C5",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        marginBottom: 8
      }
    }, "Reply to ", r.applicantName), /*#__PURE__*/React.createElement("textarea", {
      value: replyText,
      onChange: e => setReplyText(e.target.value),
      autoFocus: true,
      placeholder: "Your response \u2014 the applicant will see this in their portal immediately.",
      style: {
        width: "100%",
        minHeight: 100,
        resize: "vertical",
        background: "rgba(232,228,220,0.04)",
        border: "1px solid rgba(232,228,220,0.15)",
        color: "#E8E4DC",
        padding: 12,
        fontSize: 14,
        fontFamily: "'Cormorant Garamond', serif",
        lineHeight: 1.6,
        outline: "none"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => sendReply(r.id),
      disabled: !replyText.trim(),
      style: {
        ...adminPrimaryBtn,
        background: replyText.trim() ? "#4FD1C5" : "rgba(79,209,197,0.3)",
        color: "#0A1628"
      }
    }, "Send reply \u2192"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setReplyFor(null);
        setReplyText("");
      },
      style: adminGhostBtn
    }, "Cancel"))));
  })));
};

// ============================================================
// ACCOUNTS TAB — full credential roster for every applicant
// ============================================================
const AccountsTab = ({
  apps,
  deleted,
  store
}) => {
  const [revealed, setRevealed] = useState({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const trash = deleted || [];
  const daysLeft = deletedAt => {
    const ms = 30 * 86400000 - (Date.now() - new Date(deletedAt).getTime());
    return Math.max(0, Math.ceil(ms / 86400000));
  };
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter(a => {
      if (filter !== "all" && a.status !== filter) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || (a.profile?.university?.name || "").toLowerCase().includes(q);
    });
  }, [apps, query, filter]);
  const copy = async (text, id) => {
    const ok = await window.BrialClipboard.copy(text);
    if (ok) {
      setCopied(id);
      setTimeout(() => setCopied(c => c === id ? null : c), 1400);
    }
  };
  const filters = [{
    id: "all",
    label: "All",
    count: apps.length
  }, {
    id: "registered",
    label: "Draft",
    count: apps.filter(a => a.status === "registered").length
  }, {
    id: "submitted",
    label: "Admin",
    count: apps.filter(a => a.status === "submitted").length
  }, {
    id: "interview-scheduled",
    label: "Interview",
    count: apps.filter(a => a.status === "interview-scheduled").length
  }, {
    id: "interview-done",
    label: "Review",
    count: apps.filter(a => a.status === "interview-done").length
  }, {
    id: "accepted",
    label: "Granted",
    count: apps.filter(a => a.status === "accepted").length
  }, {
    id: "rejected",
    label: "Declined",
    count: apps.filter(a => a.status === "rejected").length
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px clamp(20px, 4vw, 56px) 80px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#7AA9E6",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 IV \u2014 Account Registry \xB7 Confidential"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 44,
      fontWeight: 400,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "16px 0 8px"
    }
  }, apps.length, " account", apps.length === 1 ? "" : "s", " on record."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.6)",
      margin: 0,
      maxWidth: 720
    }
  }, "Every email and password ever issued through the portal \u2014 applicants, scholars, alumni. Passwords are visible to the founder only and never logged or transmitted externally.")), /*#__PURE__*/React.createElement(BackupBar, {
    apps: apps
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      marginBottom: 24,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "1 1 280px",
      maxWidth: 420,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      background: "rgba(20,36,66,0.6)",
      border: "1px solid rgba(232,228,220,0.18)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none",
    stroke: "rgba(232,228,220,0.5)",
    strokeWidth: "1.2"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "4.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9.5",
    y1: "9.5",
    x2: "13",
    y2: "13"
  })), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Search by name, email, ID, or university\u2026",
    style: {
      flex: 1,
      background: "transparent",
      border: "none",
      color: "#E8E4DC",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      outline: "none"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap"
    }
  }, filters.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.id,
    onClick: () => setFilter(f.id),
    style: {
      padding: "6px 12px",
      cursor: "pointer",
      background: filter === f.id ? "rgba(122,169,230,0.18)" : "transparent",
      color: filter === f.id ? "#7AA9E6" : "rgba(232,228,220,0.6)",
      border: `1px solid ${filter === f.id ? "rgba(122,169,230,0.5)" : "rgba(232,228,220,0.12)"}`,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, f.label, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.6,
      marginLeft: 3
    }
  }, f.count))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 28px",
      display: "grid",
      gridTemplateColumns: "90px 1.5fr 1.8fr 1.4fr 140px 70px",
      gap: 18,
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("div", null, "ID"), /*#__PURE__*/React.createElement("div", null, "Name"), /*#__PURE__*/React.createElement("div", null, "Email"), /*#__PURE__*/React.createElement("div", null, "Password"), /*#__PURE__*/React.createElement("div", null, "Status"), /*#__PURE__*/React.createElement("div", null)), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "60px 28px",
      textAlign: "center",
      color: "rgba(232,228,220,0.4)",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      fontStyle: "italic"
    }
  }, "No accounts match.") : filtered.map(a => {
    const isRev = revealed[a.id];
    const meta = STATUS_META[a.status] || STATUS_META.submitted;
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      style: {
        padding: "16px 28px",
        display: "grid",
        gridTemplateColumns: "90px 1.5fr 1.8fr 1.4fr 140px 70px",
        gap: 18,
        alignItems: "center",
        borderBottom: "1px solid rgba(201,169,97,0.08)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: "rgba(232,228,220,0.65)",
        letterSpacing: "0.14em"
      }
    }, a.id), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 18,
        color: "#E8E4DC",
        lineHeight: 1.2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, a.name), a.scholarId && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: "#86E5A7",
        letterSpacing: "0.14em",
        marginTop: 2
      }
    }, a.scholarId, " \xB7 ", a.cohort)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: "#E8E4DC",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, a.email), /*#__PURE__*/React.createElement("button", {
      onClick: () => copy(a.email, a.id + ":email"),
      style: {
        flexShrink: 0,
        padding: "2px 8px",
        background: "transparent",
        border: "1px solid rgba(201,169,97,0.3)",
        color: copied === a.id + ":email" ? "#86E5A7" : "#C9A961",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.14em",
        textTransform: "uppercase"
      }
    }, copied === a.id + ":email" ? "✓" : "Copy")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: isRev ? "#C9A961" : "rgba(232,228,220,0.6)",
        letterSpacing: isRev ? "normal" : "0.3em",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0
      }
    }, a.passwordHash ? "hashed · not recoverable" : isRev ? a.password : "••••••••"), !a.passwordHash && /*#__PURE__*/React.createElement("button", {
      onClick: () => setRevealed(r => ({
        ...r,
        [a.id]: !r[a.id]
      })),
      style: {
        flexShrink: 0,
        padding: "2px 8px",
        background: "transparent",
        border: "1px solid rgba(201,169,97,0.3)",
        color: "#C9A961",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.14em",
        textTransform: "uppercase"
      }
    }, isRev ? "Hide" : "Show"), !a.passwordHash && /*#__PURE__*/React.createElement("button", {
      onClick: () => copy(a.password, a.id + ":pw"),
      style: {
        flexShrink: 0,
        padding: "2px 8px",
        background: "transparent",
        border: "1px solid rgba(201,169,97,0.3)",
        color: copied === a.id + ":pw" ? "#86E5A7" : "#C9A961",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.14em",
        textTransform: "uppercase"
      }
    }, copied === a.id + ":pw" ? "✓" : "Copy")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        background: `${meta.color}14`,
        border: `1px solid ${meta.color}55`,
        color: meta.color,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        whiteSpace: "nowrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: meta.color
      }
    }), meta.label)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "flex-end"
      }
    }, a.scholarStatus && a.scholarStatus !== "active" && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: SCHOLAR_STATUS_META[a.scholarStatus]?.color || "#7E8AA0",
        letterSpacing: "0.14em",
        textTransform: "uppercase"
      }
    }, a.scholarStatus), /*#__PURE__*/React.createElement("button", {
      onClick: () => setConfirmDel(a),
      title: "Delete account",
      style: {
        padding: "3px 9px",
        background: "transparent",
        border: "1px solid rgba(229,134,134,0.35)",
        color: "#E58686",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.14em",
        textTransform: "uppercase"
      }
    }, "Delete")));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: "12px 16px",
      background: "rgba(229,134,134,0.04)",
      border: "1px solid rgba(229,134,134,0.2)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.06em",
      lineHeight: 1.6
    }
  }, "\u26A0 Treat this view as confidential. Passwords are hashed and stored locally \u2014 but the founder reveal here grants plaintext access. Never share screenshots of this tab."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowTrash(t => !t),
    style: {
      padding: "8px 16px",
      background: showTrash ? "rgba(229,134,134,0.15)" : "transparent",
      border: "1px solid rgba(229,134,134,0.35)",
      color: "#E58686",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, showTrash ? "Hide" : "Show", " Trash (", trash.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.4)",
      letterSpacing: "0.06em"
    }
  }, "Deleted accounts are kept 30 days, then purged permanently.")), showTrash && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, trash.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      background: "rgba(20,36,66,0.4)",
      border: "1px solid rgba(229,134,134,0.2)",
      color: "rgba(232,228,220,0.45)",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 20,
      fontStyle: "italic"
    }
  }, "Trash is empty.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      background: "rgba(229,134,134,0.12)"
    }
  }, trash.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      padding: "16px 22px",
      background: "rgba(20,36,66,0.55)",
      display: "grid",
      gridTemplateColumns: "1fr auto auto",
      gap: 16,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 20,
      color: "#E8E4DC"
    }
  }, a.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.1em",
      marginTop: 3
    }
  }, a.id, " \xB7 ", a.email, " \xB7 deleted ", fmtDate(a.deletedAt))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: daysLeft(a.deletedAt) <= 5 ? "#E58686" : "#C9A961",
      letterSpacing: "0.1em",
      whiteSpace: "nowrap"
    }
  }, daysLeft(a.deletedAt), "d until purge"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => store.restoreApplicant(a.id),
    style: {
      padding: "6px 12px",
      background: "transparent",
      border: "1px solid rgba(134,229,167,0.45)",
      color: "#86E5A7",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Restore"), /*#__PURE__*/React.createElement(ConfirmButton, {
    onConfirm: () => store.purgeApplicant(a.id),
    confirmLabel: "Sure?",
    style: {
      padding: "6px 12px",
      background: "transparent",
      border: "1px solid rgba(229,134,134,0.45)",
      color: "#E58686",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Delete forever")))))), confirmDel && /*#__PURE__*/React.createElement("div", {
    onClick: () => setConfirmDel(null),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 200,
      background: "rgba(6,14,28,0.85)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 460,
      background: "linear-gradient(180deg, #142442, #0A1628)",
      border: "1px solid rgba(229,134,134,0.4)",
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#E58686",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Delete account"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 28,
      fontWeight: 400,
      color: "#E8E4DC",
      margin: "12px 0 10px",
      lineHeight: 1.2
    }
  }, "Move ", confirmDel.name, " to trash?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.7)",
      margin: 0
    }
  }, "The account ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, confirmDel.email), " (", confirmDel.id, ") will be removed from all lists and kept in Trash for ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#C9A961"
    }
  }, "30 days"), ". You can restore it any time before then, or delete it permanently from Trash."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      store.softDeleteApplicant(confirmDel.id);
      setConfirmDel(null);
    },
    style: {
      flex: 1,
      padding: "13px 0",
      background: "#E58686",
      color: "#0A1628",
      border: "none",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 600
    }
  }, "Move to Trash"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmDel(null),
    style: {
      flex: 1,
      padding: "13px 0",
      background: "transparent",
      border: "1px solid rgba(232,228,220,0.25)",
      color: "rgba(232,228,220,0.8)",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Cancel")))));
};

// ============================================================
// SCHOLARS TAB
// ============================================================
const ScholarsTab = ({
  scholars
}) => {
  const [revealed, setRevealed] = useState({});
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px clamp(20px, 4vw, 56px) 80px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#86E5A7",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\xA7 III \u2014 Scholar Roster"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 44,
      fontWeight: 400,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "16px 0 8px"
    }
  }, scholars.length, " active scholar", scholars.length === 1 ? "" : "s", "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 15,
      color: "rgba(232,228,220,0.6)",
      margin: 0
    }
  }, "Login credentials are set by the scholar at sign-up. Reveal to view, copy to share over a secure channel.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
      gap: 1,
      background: "rgba(201,169,97,0.12)"
    }
  }, scholars.map(sc => {
    const paid = (sc.semesters || []).filter(s => s.status === "paid").length;
    const pending = (sc.semesters || []).filter(s => s.status === "bill-uploaded").length;
    const totalReceived = (sc.semesters || []).filter(s => s.status === "paid").reduce((a, s) => a + (s.bill?.amount || 0), 0);
    const isRevealed = revealed[sc.id];
    return /*#__PURE__*/React.createElement("div", {
      key: sc.id,
      style: {
        padding: 26,
        background: "rgba(20,36,66,0.55)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "start",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.45)",
        letterSpacing: "0.18em"
      }
    }, sc.scholarId, " \xB7 ", sc.cohort), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 24,
        color: "#E8E4DC",
        marginTop: 8,
        letterSpacing: "-0.01em",
        lineHeight: 1.15
      }
    }, sc.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 12,
        color: "rgba(232,228,220,0.6)",
        marginTop: 4
      }
    }, sc.profile?.university?.name, " \xB7 ", sc.profile?.university?.program)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #C9A961, #8B7A4A)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 16,
        color: "#0A1628",
        fontStyle: "italic",
        flexShrink: 0
      }
    }, sc.name.charAt(0))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 18,
        padding: "14px 16px",
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
    }, "Login credentials"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)"
      }
    }, "email"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: "#E8E4DC",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, sc.email)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)"
      }
    }, "password"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: isRevealed ? "#C9A961" : "rgba(232,228,220,0.6)",
        letterSpacing: isRevealed ? "normal" : "0.3em"
      }
    }, isRevealed ? sc.password : "••••••••"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setRevealed(r => ({
        ...r,
        [sc.id]: !r[sc.id]
      })),
      style: {
        background: "transparent",
        border: "1px solid rgba(201,169,97,0.3)",
        color: "#C9A961",
        padding: "2px 6px",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.14em",
        textTransform: "uppercase"
      }
    }, isRevealed ? "Hide" : "Show"), /*#__PURE__*/React.createElement("button", {
      onClick: () => window.BrialClipboard.copy(sc.password),
      style: {
        background: "transparent",
        border: "1px solid rgba(201,169,97,0.3)",
        color: "#C9A961",
        padding: "2px 6px",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.14em",
        textTransform: "uppercase"
      }
    }, "Copy"))))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: "rgba(232,228,220,0.45)",
        letterSpacing: "0.18em",
        textTransform: "uppercase"
      }
    }, "Received"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20,
        color: "#86E5A7",
        marginTop: 4,
        fontVariantNumeric: "tabular-nums"
      }
    }, fmtMoney(totalReceived))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: "rgba(232,228,220,0.45)",
        letterSpacing: "0.18em",
        textTransform: "uppercase"
      }
    }, "Pending"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20,
        color: pending > 0 ? "#4FD1C5" : "rgba(232,228,220,0.4)",
        marginTop: 4
      }
    }, pending)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: "rgba(232,228,220,0.45)",
        letterSpacing: "0.18em",
        textTransform: "uppercase"
      }
    }, "Semesters"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20,
        color: "#E8E4DC",
        marginTop: 4
      }
    }, paid, "/", (sc.semesters || []).length))));
  })));
};

// ============================================================
// FOOD & LAND GRANTS TAB — Trees for Life disbursements (Zaytoun etc.)
// ============================================================
const FoodlandGrantsTab = ({
  store
}) => {
  const OLIVE = "#A8C97F";
  const FGRID = "1.2fr 0.9fr 0.7fr 0.7fr 1fr 0.7fr 50px";
  const grants = store.getPillarGrants().filter(g => g.pillar === "Food & Land");
  const total = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.amount) || 0), 0);
  const trees = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.units) || 0), 0);
  const nations = [...new Set(grants.filter(g => !g.archived).map(g => (g.country || "").trim().toLowerCase()).filter(Boolean))].length;
  const [form, setForm] = useState({
    partner: "Zaytoun CIC, London",
    project: "",
    country: "Palestine",
    amount: "",
    units: "",
    note: "",
    date: new Date().toISOString().slice(0, 10)
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.amount && form.project.trim() && form.country.trim();
  const submit = () => {
    if (!canSubmit) return;
    (form.editingId ? payload => store.updatePillarGrant(form.editingId, payload) : store.addPillarGrant)({
      pillar: "Food & Land",
      partner: form.partner,
      project: form.project,
      country: form.country,
      amount: parseFloat(form.amount),
      units: form.units,
      note: form.note,
      date: new Date(form.date).toISOString()
    });
    setForm({
      partner: "Zaytoun CIC, London",
      project: "",
      country: "Palestine",
      amount: "",
      units: "",
      note: "",
      date: new Date().toISOString().slice(0, 10)
    });
  };
  const statCard = (label, value) => /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(168,201,127,0.25)", minWidth: 160 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, value));
  const field = (label, node) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, label), node);
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 80px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 32, flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Pillar \u2014 Food & Land"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "16px 0 0" }
  }, "Planting & feeding grants."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Record funds disbursed to Zaytoun (or other partners) for trees, food and land programmes. Totals feed the public \"Total distributed \u2014 all pillars\" figure \u2014 and every new country grows \"Nations represented\".")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 12, flexWrap: "wrap" }
  }, statCard("Total granted", fmtMoney(total)), statCard("Trees in soil", trees), statCard("Nations reached", nations))), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(168,201,127,0.22)", padding: 28, marginBottom: 32 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 18 }
  }, "Record a new grant"), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }
  }, field("Partner / pelaksana", /*#__PURE__*/React.createElement("input", {
    value: form.partner,
    onChange: e => set("partner", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  })), field("Programme / project", /*#__PURE__*/React.createElement("input", {
    value: form.project,
    onChange: e => set("project", e.target.value),
    placeholder: "e.g. Trees for Life \u2014 Batch II",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginTop: 16 }
  }, field("Country / negara", /*#__PURE__*/React.createElement("input", {
    value: form.country,
    onChange: e => set("country", e.target.value),
    placeholder: "e.g. Palestine",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Amount (USD)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.amount,
    onChange: e => set("amount", e.target.value),
    placeholder: "0",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Trees planted (this grant)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    value: form.units,
    onChange: e => set("units", e.target.value),
    placeholder: "e.g. 15",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Date", /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => set("date", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, field("Note (optional)", /*#__PURE__*/React.createElement("input", {
    value: form.note,
    onChange: e => set("note", e.target.value),
    placeholder: "Brief description",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !canSubmit,
    style: { ...adminPrimaryBtn, marginTop: 18, opacity: !canSubmit ? 0.5 : 1, cursor: !canSubmit ? "not-allowed" : "pointer" }
  }, form.editingId ? "Save changes" : "+ Record grant")), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,169,97,0.12)" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { padding: "14px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, borderBottom: "1px solid rgba(201,169,97,0.12)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }
  }, ["Programme", "Partner", "Country", "Amount", "Reference", "Date", ""].map((hh, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, hh))), grants.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: { padding: "60px 28px", textAlign: "center", color: "rgba(232,228,220,0.4)", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic" }
  }, "No grants recorded yet.") : grants.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    style: { padding: "18px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, alignItems: "center", borderBottom: "1px solid rgba(201,169,97,0.08)" }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#E8E4DC" }
  }, g.project), g.note && /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 12, color: "rgba(232,228,220,0.55)", marginTop: 3 }
  }, g.note), Number(g.units) > 0 ? /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 5 }
  }, g.units + (Number(g.units) === 1 ? " tree" : " trees") + " \u00b7 in soil") : null), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: "rgba(232,228,220,0.8)" }
  }, g.partner), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: OLIVE }
  }, g.country || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#C9A961", fontVariantNumeric: "tabular-nums" }
  }, fmtMoney(g.amount)), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.7)", overflowWrap: "anywhere" }
  }, g.txRef || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.6)" }
  }, fmtDate(g.date)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm(f => ({ ...f, editingId: g.id, partner: g.partner || "", project: g.project || "", country: g.country || f.country || "", amount: String(g.amount || ""), units: String(g.units || ""), note: g.note || "", date: g.date ? String(g.date).slice(0, 10) : f.date })),
    title: "Load this grant into the form above, then Save changes",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(201,169,97,0.4)", color: "#C9A961", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    onClick: () => store.updatePillarGrant(g.id, { archived: !g.archived }),
    title: g.archived ? "Restore into public totals" : "Archive: keep the record, remove it from public totals",
    style: { padding: "5px 10px", background: g.archived ? "rgba(201,169,97,0.15)" : "transparent", border: "1px solid rgba(232,228,220,0.3)", color: g.archived ? "#C9A961" : "rgba(232,228,220,0.55)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, g.archived ? "Restore" : "Archive"), /*#__PURE__*/React.createElement(ConfirmButton, {
    onConfirm: () => store.deletePillarGrant(g.id),
    confirmLabel: "Sure?",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(229,134,134,0.35)", color: "#E58686", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Del")))));
};

// ============================================================
// LIBRARY SALES TAB — income ledger (recorded as verified gifts)
// ============================================================
const LibrarySalesTab = ({
  store
}) => {
  const AMBER = "#C98A61";
  const SGRID = "1.3fr 0.5fr 0.5fr 0.7fr 1fr 0.7fr 50px";
  const sales = store.listLibrarySales();
  const total = sales.reduce((a, s) => a + (Number(s.amount) || 0), 0);
  const copies = sales.reduce((a, s) => a + (Number(s.qty) || 1), 0);
  const books = store.listEbooks();
  const [form, setForm] = useState(() => ({
    bookId: books[0] && books[0].id || "",
    qty: "1",
    amount: "",
    note: "",
    date: new Date().toISOString().slice(0, 10)
  }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.amount && form.bookId;
  const submit = () => {
    if (!canSubmit) return;
    const b = books.find(x => x.id === form.bookId);
    store.addLibrarySale({
      bookId: form.bookId,
      title: b ? b.title : "Library edition",
      lang: b ? b.langCode || b.lang || "" : "",
      qty: form.qty,
      amount: parseFloat(form.amount),
      note: form.note,
      date: new Date(form.date).toISOString()
    });
    setForm({
      bookId: books[0] && books[0].id || "",
      qty: "1",
      amount: "",
      note: "",
      date: new Date().toISOString().slice(0, 10)
    });
  };
  const statCard = (label, value) => /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(201,138,97,0.28)", minWidth: 160 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, value));
  const field = (label, node) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, label), node);
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 80px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 32, flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Pillar \u2014 The Library"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "16px 0 0" }
  }, "Every copy, planted back."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Record each book sold and its proceeds. Sales enter the public ledger as verified gifts \u2014 income flowing into the endowment \u2014 and are never counted in \"Total distributed\".")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 12, flexWrap: "wrap" }
  }, statCard("Total income", fmtMoney(total)), statCard("Copies sold", copies))), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,138,97,0.25)", padding: 28, marginBottom: 32 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 18 }
  }, "Record a sale"), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "2fr 0.6fr 1fr 1fr", gap: 16 }
  }, field("Edition / buku", /*#__PURE__*/React.createElement("select", {
    value: form.bookId,
    onChange: e => set("bookId", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  }, books.map(b => /*#__PURE__*/React.createElement("option", {
    key: b.id,
    value: b.id
  }, b.title + " (" + (b.langCode || b.lang) + ")")))), field("Copies", /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    value: form.qty,
    onChange: e => set("qty", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  })), field("Income (USD)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.amount,
    onChange: e => set("amount", e.target.value),
    placeholder: "0",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Date", /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => set("date", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, field("Note (optional)", /*#__PURE__*/React.createElement("input", {
    value: form.note,
    onChange: e => set("note", e.target.value),
    placeholder: "e.g. Lynk storefront \u2014 June payout",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !canSubmit,
    style: { ...adminPrimaryBtn, marginTop: 18, opacity: !canSubmit ? 0.5 : 1, cursor: !canSubmit ? "not-allowed" : "pointer" }
  }, form.editingId ? "Save changes" : "+ Record sale")), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,169,97,0.12)" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { padding: "14px 28px", display: "grid", gridTemplateColumns: SGRID, gap: 16, borderBottom: "1px solid rgba(201,169,97,0.12)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }
  }, ["Edition", "Lang", "Copies", "Income", "Reference", "Date", ""].map((hh, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, hh))), sales.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: { padding: "60px 28px", textAlign: "center", color: "rgba(232,228,220,0.4)", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic" }
  }, "No sales recorded yet.") : sales.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: { padding: "18px 28px", display: "grid", gridTemplateColumns: SGRID, gap: 16, alignItems: "center", borderBottom: "1px solid rgba(201,169,97,0.08)" }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#E8E4DC" }
  }, s.title), s.note && /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 12, color: "rgba(232,228,220,0.55)", marginTop: 3 }
  }, s.note)), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: AMBER }
  }, s.lang || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(232,228,220,0.8)" }
  }, s.qty || 1), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#C9A961", fontVariantNumeric: "tabular-nums" }
  }, fmtMoney(s.amount)), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.7)", overflowWrap: "anywhere" }
  }, s.txRef || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.6)" }
  }, fmtDate(s.date)), /*#__PURE__*/React.createElement(ConfirmButton, {
    onConfirm: () => store.deleteLibrarySale(s.id),
    confirmLabel: "Sure?",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(229,134,134,0.35)", color: "#E58686", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Del")))));
};

// ============================================================
// FOOD & LAND TAB — programme copy + field notes (articles & photos)
// ============================================================
const FoodlandTab = ({
  store
}) => {
  const OLIVE = "#A8C97F";
  const [f, setF] = useState(() => store.getFoodland());
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(null);
  const set = patch => setF(prev => ({ ...prev, ...patch }));
  const setArticle = (id, patch) => setF(prev => ({ ...prev, articles: prev.articles.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const addArticle = () => setF(prev => ({ ...prev, articles: [...prev.articles, { id: "note-" + Date.now(), date: new Date().toISOString().slice(0, 10), title: "", body: "", partner: "", link: "", photo: null }] }));
  const removeArticle = id => setF(prev => ({ ...prev, articles: prev.articles.filter(a => a.id !== id) }));
  const uploadPhoto = async (id, file) => {
    if (!file) return;
    setBusy(id);
    try {
      const meta = await window.BrialFiles.put(file, { public: true });
      setArticle(id, { photo: { url: meta.url, path: meta.path, name: meta.name } });
    } catch (e) {
      alert(e.message || "Upload failed");
    }
    setBusy(null);
  };
  const save = () => {
    store.saveFoodland(f);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  const lbl = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8, display: "block" };
  const inp = { width: "100%", padding: "12px 14px", background: "rgba(10,22,40,0.5)", border: "1px solid rgba(232,228,220,0.18)", color: "#E8E4DC", fontSize: 14, fontFamily: "'Manrope', sans-serif", outline: "none" };
  const area = { ...inp, minHeight: 110, resize: "vertical", lineHeight: 1.7 };
  const card = { background: "rgba(20,36,66,0.5)", border: `1px solid ${OLIVE}33`, padding: 26 };
  const saveBtn = { background: "linear-gradient(120deg, #EAD9A8, #C9A961 55%, #B08F4C)", color: "#0A1628", border: "none", padding: "13px 30px", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 };
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 90px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Food & Land \u2014 Programme"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "14px 0 0" }
  }, "The story the public sees."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Everything here feeds the public Trees for Life page \u2014 the numbers, the introduction, and the programme journal below. Save once; the page updates instantly.")), /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(168,201,127,0.25)", minWidth: 170 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, "In the soil today"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, f.trees, " trees"))), /*#__PURE__*/React.createElement("div", {
    style: { ...card, marginTop: 34 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "110px 1fr", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Trees (fallback)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "number",
    min: "0",
    value: f.trees,
    onChange: e => set({ trees: Math.max(0, parseInt(e.target.value || "0", 10)) })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Location line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.location,
    onChange: e => set({ location: e.target.value }),
    placeholder: "Jenin \u00b7 Nablus \u00b7 Salfeet \u2014 Palestine"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.partnerLine,
    onChange: e => set({ partnerLine: e.target.value }),
    placeholder: "In partnership with Zaytoun CIC, London"
  })), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Introduction \u2014 how the programme works"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: f.intro,
    onChange: e => set({ intro: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginTop: 44, flexWrap: "wrap" }
  }, /*#__PURE__*/React.createElement("h2", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: "#E8E4DC", margin: 0 }
  }, "Programme journal"), /*#__PURE__*/React.createElement("button", {
    onClick: addArticle,
    style: { background: "transparent", border: `1px solid ${OLIVE}66`, color: OLIVE, padding: "9px 18px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }
  }, "+ Add programme")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }
  }, f.articles.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: { ...card, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "rgba(232,228,220,0.55)" }
  }, "No field notes yet \u2014 add the first word from the groves."), f.articles.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: card
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 170px", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.title,
    onChange: e => setArticle(a.id, { title: e.target.value }),
    placeholder: "The first five trees"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "date",
    value: a.date && a.date.length >= 10 ? a.date.slice(0, 10) : "",
    onChange: e => setArticle(a.id, { date: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Body"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: a.body,
    onChange: e => setArticle(a.id, { body: e.target.value })
  })), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner on this programme"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.partner || "",
    onChange: e => setArticle(a.id, { partner: e.target.value }),
    placeholder: "e.g. Zaytoun CIC \u00b7 Palestine Fair Trade Association"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Link \u2014 website or update (optional)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.link || "",
    onChange: e => setArticle(a.id, { link: e.target.value }),
    placeholder: "https://\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }
  }, a.photo && (a.photo.url || a.photo.path) ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: a.photo.url || (window.brialSupabase ? window.brialSupabase.publicUrl(a.photo.path) : ""),
    alt: "",
    style: { height: 64, width: 96, objectFit: "cover", border: `1px solid ${OLIVE}55`, display: "block" }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { photo: null }),
    style: { background: "transparent", border: "1px solid rgba(229,134,134,0.5)", color: "#E58686", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Remove photo")) : /*#__PURE__*/React.createElement("label", {
    style: { border: `1px dashed ${OLIVE}55`, color: OLIVE, padding: "10px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, busy === a.id ? "Uploading\u2026" : "\u2191 Add photo", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp,image/gif",
    style: { display: "none" },
    onChange: e => {
      uploadPhoto(a.id, e.target.files && e.target.files[0]);
      e.target.value = "";
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { draft: !a.draft }),
    title: a.draft ? "Hidden from the public page \u2014 click to publish" : "Live on the public page \u2014 click to move back to draft",
    style: { background: a.draft ? "transparent" : "rgba(134,229,167,0.08)", border: a.draft ? "1px solid rgba(232,228,220,0.3)" : "1px solid rgba(134,229,167,0.45)", color: a.draft ? "rgba(232,228,220,0.6)" : "#86E5A7", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, a.draft ? "\u25cb Draft" : "\u25cf Published"), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeArticle(a.id),
    style: { marginLeft: "auto", background: "transparent", border: "none", color: "rgba(229,134,134,0.8)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Delete entry"))))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 16, marginTop: 36 }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: saveBtn
  }, saved ? "\u2713 Saved \u2014 live on the public page" : "Save programme"), saved && /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#86E5A7", letterSpacing: "0.1em" }
  }, "Synced.")));
};

// ============================================================
// CLEAN WATER GRANTS TAB — wells & water systems
// ============================================================
const WaterGrantsTab = ({
  store
}) => {
  const OLIVE = "#7FB8C9";
  const FGRID = "1.2fr 0.9fr 0.7fr 0.7fr 1fr 0.7fr 50px";
  const grants = store.getPillarGrants().filter(g => g.pillar === "Clean Water");
  const total = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.amount) || 0), 0);
  const trees = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.units) || 0), 0);
  const nations = [...new Set(grants.filter(g => !g.archived).map(g => (g.country || "").trim().toLowerCase()).filter(Boolean))].length;
  const [form, setForm] = useState({
    partner: "",
    project: "",
    country: "",
    amount: "",
    units: "",
    note: "",
    date: new Date().toISOString().slice(0, 10)
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.amount && form.project.trim() && form.country.trim();
  const submit = () => {
    if (!canSubmit) return;
    (form.editingId ? payload => store.updatePillarGrant(form.editingId, payload) : store.addPillarGrant)({
      pillar: "Clean Water",
      partner: form.partner,
      project: form.project,
      country: form.country,
      amount: parseFloat(form.amount),
      units: form.units,
      note: form.note,
      date: new Date(form.date).toISOString()
    });
    setForm({
      partner: "",
      project: "",
      country: "",
      amount: "",
      units: "",
      note: "",
      date: new Date().toISOString().slice(0, 10)
    });
  };
  const statCard = (label, value) => /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(127,184,201,0.25)", minWidth: 160 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, value));
  const field = (label, node) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, label), node);
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 80px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 32, flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Pillar \u2014 Clean Water"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "16px 0 0" }
  }, "Wells & water grants."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Record funds disbursed to water partners for wells, pumps and spring protections. Totals feed the public \"Total distributed \u2014 all pillars\" figure \u2014 and per-grant well counts grow the public Clean Water page.")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 12, flexWrap: "wrap" }
  }, statCard("Total granted", fmtMoney(total)), statCard("Wells flowing", trees), statCard("Nations reached", nations))), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(127,184,201,0.22)", padding: 28, marginBottom: 32 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 18 }
  }, "Record a new grant"), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }
  }, field("Partner / pelaksana", /*#__PURE__*/React.createElement("input", {
    value: form.partner,
    onChange: e => set("partner", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  })), field("Programme / project", /*#__PURE__*/React.createElement("input", {
    value: form.project,
    onChange: e => set("project", e.target.value),
    placeholder: "e.g. Village Well \u2014 Phase I",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginTop: 16 }
  }, field("Country / negara", /*#__PURE__*/React.createElement("input", {
    value: form.country,
    onChange: e => set("country", e.target.value),
    placeholder: "e.g. Indonesia",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Amount (USD)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.amount,
    onChange: e => set("amount", e.target.value),
    placeholder: "0",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Wells built (this grant)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    value: form.units,
    onChange: e => set("units", e.target.value),
    placeholder: "e.g. 1",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Date", /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => set("date", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, field("Note (optional)", /*#__PURE__*/React.createElement("input", {
    value: form.note,
    onChange: e => set("note", e.target.value),
    placeholder: "Brief description",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !canSubmit,
    style: { ...adminPrimaryBtn, marginTop: 18, opacity: !canSubmit ? 0.5 : 1, cursor: !canSubmit ? "not-allowed" : "pointer" }
  }, form.editingId ? "Save changes" : "+ Record grant")), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,169,97,0.12)" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { padding: "14px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, borderBottom: "1px solid rgba(201,169,97,0.12)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }
  }, ["Programme", "Partner", "Country", "Amount", "Reference", "Date", ""].map((hh, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, hh))), grants.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: { padding: "60px 28px", textAlign: "center", color: "rgba(232,228,220,0.4)", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic" }
  }, "No grants recorded yet.") : grants.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    style: { padding: "18px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, alignItems: "center", borderBottom: "1px solid rgba(201,169,97,0.08)" }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#E8E4DC" }
  }, g.project), g.note && /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 12, color: "rgba(232,228,220,0.55)", marginTop: 3 }
  }, g.note), Number(g.units) > 0 ? /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 5 }
  }, g.units + (Number(g.units) === 1 ? " well" : " wells") + " \u00b7 flowing") : null), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: "rgba(232,228,220,0.8)" }
  }, g.partner), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: OLIVE }
  }, g.country || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#C9A961", fontVariantNumeric: "tabular-nums" }
  }, fmtMoney(g.amount)), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.7)", overflowWrap: "anywhere" }
  }, g.txRef || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.6)" }
  }, fmtDate(g.date)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm(f => ({ ...f, editingId: g.id, partner: g.partner || "", project: g.project || "", country: g.country || f.country || "", amount: String(g.amount || ""), units: String(g.units || ""), note: g.note || "", date: g.date ? String(g.date).slice(0, 10) : f.date })),
    title: "Load this grant into the form above, then Save changes",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(201,169,97,0.4)", color: "#C9A961", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    onClick: () => store.updatePillarGrant(g.id, { archived: !g.archived }),
    title: g.archived ? "Restore into public totals" : "Archive: keep the record, remove it from public totals",
    style: { padding: "5px 10px", background: g.archived ? "rgba(201,169,97,0.15)" : "transparent", border: "1px solid rgba(232,228,220,0.3)", color: g.archived ? "#C9A961" : "rgba(232,228,220,0.55)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, g.archived ? "Restore" : "Archive"), /*#__PURE__*/React.createElement(ConfirmButton, {
    onConfirm: () => store.deletePillarGrant(g.id),
    confirmLabel: "Sure?",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(229,134,134,0.35)", color: "#E58686", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Del")))));
};

// ============================================================
// CLEAN WATER TAB — programme copy + field notes (articles & photos)
// ============================================================
const WaterProgrammeTab = ({
  store
}) => {
  const OLIVE = "#7FB8C9";
  const [f, setF] = useState(() => store.getWater());
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(null);
  const set = patch => setF(prev => ({ ...prev, ...patch }));
  const setArticle = (id, patch) => setF(prev => ({ ...prev, articles: prev.articles.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const addArticle = () => setF(prev => ({ ...prev, articles: [...prev.articles, { id: "note-" + Date.now(), date: new Date().toISOString().slice(0, 10), title: "", body: "", partner: "", link: "", photo: null }] }));
  const removeArticle = id => setF(prev => ({ ...prev, articles: prev.articles.filter(a => a.id !== id) }));
  const uploadPhoto = async (id, file) => {
    if (!file) return;
    setBusy(id);
    try {
      const meta = await window.BrialFiles.put(file, { public: true });
      setArticle(id, { photo: { url: meta.url, path: meta.path, name: meta.name } });
    } catch (e) {
      alert(e.message || "Upload failed");
    }
    setBusy(null);
  };
  const save = () => {
    store.saveWater(f);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  const lbl = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8, display: "block" };
  const inp = { width: "100%", padding: "12px 14px", background: "rgba(10,22,40,0.5)", border: "1px solid rgba(232,228,220,0.18)", color: "#E8E4DC", fontSize: 14, fontFamily: "'Manrope', sans-serif", outline: "none" };
  const area = { ...inp, minHeight: 110, resize: "vertical", lineHeight: 1.7 };
  const card = { background: "rgba(20,36,66,0.5)", border: `1px solid ${OLIVE}33`, padding: 26 };
  const saveBtn = { background: "linear-gradient(120deg, #EAD9A8, #C9A961 55%, #B08F4C)", color: "#0A1628", border: "none", padding: "13px 30px", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 };
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 90px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Clean Water \u2014 Programme"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "14px 0 0" }
  }, "The story the public sees."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Everything here feeds the public Clean Water page \u2014 the numbers, the introduction, and the programme journal below. Save once; the page updates instantly.")), /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(127,184,201,0.25)", minWidth: 170 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, "Flowing today"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, f.trees, " wells"))), /*#__PURE__*/React.createElement("div", {
    style: { ...card, marginTop: 34 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "110px 1fr", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Wells (fallback)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "number",
    min: "0",
    value: f.trees,
    onChange: e => set({ trees: Math.max(0, parseInt(e.target.value || "0", 10)) })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Location line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.location,
    onChange: e => set({ location: e.target.value }),
    placeholder: "Village \u00b7 District \u2014 Country"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.partnerLine,
    onChange: e => set({ partnerLine: e.target.value }),
    placeholder: "In partnership with \u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Introduction \u2014 how the programme works"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: f.intro,
    onChange: e => set({ intro: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginTop: 44, flexWrap: "wrap" }
  }, /*#__PURE__*/React.createElement("h2", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: "#E8E4DC", margin: 0 }
  }, "Programme journal"), /*#__PURE__*/React.createElement("button", {
    onClick: addArticle,
    style: { background: "transparent", border: `1px solid ${OLIVE}66`, color: OLIVE, padding: "9px 18px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }
  }, "+ Add programme")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }
  }, f.articles.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: { ...card, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "rgba(232,228,220,0.55)" }
  }, "No field notes yet \u2014 add the first word from the wells."), f.articles.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: card
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 170px", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.title,
    onChange: e => setArticle(a.id, { title: e.target.value }),
    placeholder: "The first well"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "date",
    value: a.date && a.date.length >= 10 ? a.date.slice(0, 10) : "",
    onChange: e => setArticle(a.id, { date: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Body"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: a.body,
    onChange: e => setArticle(a.id, { body: e.target.value })
  })), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner on this programme"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.partner || "",
    onChange: e => setArticle(a.id, { partner: e.target.value }),
    placeholder: "e.g. Zaytoun CIC \u00b7 Palestine Fair Trade Association"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Link \u2014 website or update (optional)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.link || "",
    onChange: e => setArticle(a.id, { link: e.target.value }),
    placeholder: "https://\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }
  }, a.photo && (a.photo.url || a.photo.path) ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: a.photo.url || (window.brialSupabase ? window.brialSupabase.publicUrl(a.photo.path) : ""),
    alt: "",
    style: { height: 64, width: 96, objectFit: "cover", border: `1px solid ${OLIVE}55`, display: "block" }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { photo: null }),
    style: { background: "transparent", border: "1px solid rgba(229,134,134,0.5)", color: "#E58686", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Remove photo")) : /*#__PURE__*/React.createElement("label", {
    style: { border: `1px dashed ${OLIVE}55`, color: OLIVE, padding: "10px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, busy === a.id ? "Uploading\u2026" : "\u2191 Add photo", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp,image/gif",
    style: { display: "none" },
    onChange: e => {
      uploadPhoto(a.id, e.target.files && e.target.files[0]);
      e.target.value = "";
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { draft: !a.draft }),
    title: a.draft ? "Hidden from the public page \u2014 click to publish" : "Live on the public page \u2014 click to move back to draft",
    style: { background: a.draft ? "transparent" : "rgba(134,229,167,0.08)", border: a.draft ? "1px solid rgba(232,228,220,0.3)" : "1px solid rgba(134,229,167,0.45)", color: a.draft ? "rgba(232,228,220,0.6)" : "#86E5A7", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, a.draft ? "\u25cb Draft" : "\u25cf Published"), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeArticle(a.id),
    style: { marginLeft: "auto", background: "transparent", border: "none", color: "rgba(229,134,134,0.8)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Delete entry"))))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 16, marginTop: 36 }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: saveBtn
  }, saved ? "\u2713 Saved \u2014 live on the public page" : "Save programme"), saved && /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#86E5A7", letterSpacing: "0.1em" }
  }, "Synced.")));
};

// ============================================================
// HOUSES OF WORSHIP TAB — programme copy + programme journal
// ============================================================
const WorshipProgrammeTab = ({
  store
}) => {
  const OLIVE = "#C9A961";
  const [f, setF] = useState(() => store.getWorship());
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(null);
  const set = patch => setF(prev => ({ ...prev, ...patch }));
  const setArticle = (id, patch) => setF(prev => ({ ...prev, articles: prev.articles.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const addArticle = () => setF(prev => ({ ...prev, articles: [...prev.articles, { id: "note-" + Date.now(), date: new Date().toISOString().slice(0, 10), title: "", body: "", partner: "", link: "", photo: null }] }));
  const removeArticle = id => setF(prev => ({ ...prev, articles: prev.articles.filter(a => a.id !== id) }));
  const uploadPhoto = async (id, file) => {
    if (!file) return;
    setBusy(id);
    try {
      const meta = await window.BrialFiles.put(file, { public: true });
      setArticle(id, { photo: { url: meta.url, path: meta.path, name: meta.name } });
    } catch (e) {
      alert(e.message || "Upload failed");
    }
    setBusy(null);
  };
  const save = () => {
    store.saveWorship(f);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  const lbl = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8, display: "block" };
  const inp = { width: "100%", padding: "12px 14px", background: "rgba(10,22,40,0.5)", border: "1px solid rgba(232,228,220,0.18)", color: "#E8E4DC", fontSize: 14, fontFamily: "'Manrope', sans-serif", outline: "none" };
  const area = { ...inp, minHeight: 110, resize: "vertical", lineHeight: 1.7 };
  const card = { background: "rgba(20,36,66,0.5)", border: `1px solid ${OLIVE}33`, padding: 26 };
  const saveBtn = { background: "linear-gradient(120deg, #EAD9A8, #C9A961 55%, #B08F4C)", color: "#0A1628", border: "none", padding: "13px 30px", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 };
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 90px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Houses of Worship \u2014 Programme"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "14px 0 0" }
  }, "The story the public sees."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Everything here feeds the public Houses of Worship page \u2014 the numbers, the introduction, and the programme journal below. Save once; the page updates instantly.")), /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(127,184,201,0.25)", minWidth: 170 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, "Raised together"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, f.mosques, " mosques"))), /*#__PURE__*/React.createElement("div", {
    style: { ...card, marginTop: 34 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "110px 1fr", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Mosques (fallback)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "number",
    min: "0",
    value: f.mosques,
    onChange: e => set({ mosques: Math.max(0, parseInt(e.target.value || "0", 10)) })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Location line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.location,
    onChange: e => set({ location: e.target.value }),
    placeholder: "Bandung \u2014 West Java, Indonesia"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.partnerLine,
    onChange: e => set({ partnerLine: e.target.value }),
    placeholder: "In partnership with Minang Bandung Foundation"
  })), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Introduction \u2014 how the programme works"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: f.intro,
    onChange: e => set({ intro: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginTop: 44, flexWrap: "wrap" }
  }, /*#__PURE__*/React.createElement("h2", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: "#E8E4DC", margin: 0 }
  }, "Programme journal"), /*#__PURE__*/React.createElement("button", {
    onClick: addArticle,
    style: { background: "transparent", border: `1px solid ${OLIVE}66`, color: OLIVE, padding: "9px 18px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }
  }, "+ Add programme")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }
  }, f.articles.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: { ...card, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "rgba(232,228,220,0.55)" }
  }, "No field notes yet \u2014 add the first word from the site."), f.articles.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: card
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 170px", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.title,
    onChange: e => setArticle(a.id, { title: e.target.value }),
    placeholder: "The first mosque"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "date",
    value: a.date && a.date.length >= 10 ? a.date.slice(0, 10) : "",
    onChange: e => setArticle(a.id, { date: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Body"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: a.body,
    onChange: e => setArticle(a.id, { body: e.target.value })
  })), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner on this programme"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.partner || "",
    onChange: e => setArticle(a.id, { partner: e.target.value }),
    placeholder: "e.g. Zaytoun CIC \u00b7 Palestine Fair Trade Association"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Link \u2014 website or update (optional)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.link || "",
    onChange: e => setArticle(a.id, { link: e.target.value }),
    placeholder: "https://\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }
  }, a.photo && (a.photo.url || a.photo.path) ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: a.photo.url || (window.brialSupabase ? window.brialSupabase.publicUrl(a.photo.path) : ""),
    alt: "",
    style: { height: 64, width: 96, objectFit: "cover", border: `1px solid ${OLIVE}55`, display: "block" }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { photo: null }),
    style: { background: "transparent", border: "1px solid rgba(229,134,134,0.5)", color: "#E58686", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Remove photo")) : /*#__PURE__*/React.createElement("label", {
    style: { border: `1px dashed ${OLIVE}55`, color: OLIVE, padding: "10px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, busy === a.id ? "Uploading\u2026" : "\u2191 Add photo", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp,image/gif",
    style: { display: "none" },
    onChange: e => {
      uploadPhoto(a.id, e.target.files && e.target.files[0]);
      e.target.value = "";
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { draft: !a.draft }),
    title: a.draft ? "Hidden from the public page \u2014 click to publish" : "Live on the public page \u2014 click to move back to draft",
    style: { background: a.draft ? "transparent" : "rgba(134,229,167,0.08)", border: a.draft ? "1px solid rgba(232,228,220,0.3)" : "1px solid rgba(134,229,167,0.45)", color: a.draft ? "rgba(232,228,220,0.6)" : "#86E5A7", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, a.draft ? "\u25cb Draft" : "\u25cf Published"), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeArticle(a.id),
    style: { marginLeft: "auto", background: "transparent", border: "none", color: "rgba(229,134,134,0.8)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Delete entry"))))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 16, marginTop: 36 }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: saveBtn
  }, saved ? "\u2713 Saved \u2014 live on the public page" : "Save programme"), saved && /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#86E5A7", letterSpacing: "0.1em" }
  }, "Synced.")));
};

// ============================================================
// HOSPITALS GRANTS TAB — Hospitals
// ============================================================
const HospitalsGrantsTab = ({
  store
}) => {
  const OLIVE = "#C9847F";
  const FGRID = "1.2fr 0.9fr 0.7fr 0.7fr 1fr 0.7fr 50px";
  const grants = store.getPillarGrants().filter(g => g.pillar === "Hospitals");
  const total = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.amount) || 0), 0);
  const trees = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.units) || 0), 0);
  const nations = [...new Set(grants.filter(g => !g.archived).map(g => (g.country || "").trim().toLowerCase()).filter(Boolean))].length;
  const [form, setForm] = useState({
    partner: "",
    project: "",
    country: "",
    amount: "",
    units: "",
    note: "",
    date: new Date().toISOString().slice(0, 10)
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.amount && form.project.trim() && form.country.trim();
  const submit = () => {
    if (!canSubmit) return;
    (form.editingId ? payload => store.updatePillarGrant(form.editingId, payload) : store.addPillarGrant)({
      pillar: "Hospitals",
      partner: form.partner,
      project: form.project,
      country: form.country,
      amount: parseFloat(form.amount),
      units: form.units,
      note: form.note,
      date: new Date(form.date).toISOString()
    });
    setForm({
      partner: "",
      project: "",
      country: "",
      amount: "",
      units: "",
      note: "",
      date: new Date().toISOString().slice(0, 10)
    });
  };
  const statCard = (label, value) => /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(201,132,127,0.25)", minWidth: 160 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, value));
  const field = (label, node) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, label), node);
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 80px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 32, flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Pillar \u2014 Hospitals"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "16px 0 0" }
  }, "Clinics & care grants."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Record funds disbursed to health partners for clinics, wards and care. Totals feed the public \"Total distributed \u2014 all pillars\" figure \u2014 and per-grant clinic counts grow the public Hospitals page.")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 12, flexWrap: "wrap" }
  }, statCard("Total granted", fmtMoney(total)), statCard("Clinics opened", trees), statCard("Nations reached", nations))), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,132,127,0.22)", padding: 28, marginBottom: 32 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 18 }
  }, "Record a new grant"), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }
  }, field("Partner / pelaksana", /*#__PURE__*/React.createElement("input", {
    value: form.partner,
    onChange: e => set("partner", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  })), field("Programme / project", /*#__PURE__*/React.createElement("input", {
    value: form.project,
    onChange: e => set("project", e.target.value),
    placeholder: "e.g. Village Clinic \u2014 Phase I",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginTop: 16 }
  }, field("Country / negara", /*#__PURE__*/React.createElement("input", {
    value: form.country,
    onChange: e => set("country", e.target.value),
    placeholder: "e.g. Indonesia",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Amount (USD)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.amount,
    onChange: e => set("amount", e.target.value),
    placeholder: "0",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Clinics opened (this grant)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    value: form.units,
    onChange: e => set("units", e.target.value),
    placeholder: "e.g. 1",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Date", /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => set("date", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, field("Note (optional)", /*#__PURE__*/React.createElement("input", {
    value: form.note,
    onChange: e => set("note", e.target.value),
    placeholder: "Brief description",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !canSubmit,
    style: { ...adminPrimaryBtn, marginTop: 18, opacity: !canSubmit ? 0.5 : 1, cursor: !canSubmit ? "not-allowed" : "pointer" }
  }, form.editingId ? "Save changes" : "+ Record grant")), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,169,97,0.12)" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { padding: "14px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, borderBottom: "1px solid rgba(201,169,97,0.12)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }
  }, ["Programme", "Partner", "Country", "Amount", "Reference", "Date", ""].map((hh, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, hh))), grants.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: { padding: "60px 28px", textAlign: "center", color: "rgba(232,228,220,0.4)", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic" }
  }, "No grants recorded yet.") : grants.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    style: { padding: "18px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, alignItems: "center", borderBottom: "1px solid rgba(201,169,97,0.08)" }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#E8E4DC" }
  }, g.project), g.note && /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 12, color: "rgba(232,228,220,0.55)", marginTop: 3 }
  }, g.note), Number(g.units) > 0 ? /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 5 }
  }, g.units + (Number(g.units) === 1 ? " clinic" : " clinics") + " \u00b7 open") : null), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: "rgba(232,228,220,0.8)" }
  }, g.partner), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: OLIVE }
  }, g.country || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#C9A961", fontVariantNumeric: "tabular-nums" }
  }, fmtMoney(g.amount)), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.7)", overflowWrap: "anywhere" }
  }, g.txRef || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.6)" }
  }, fmtDate(g.date)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm(f => ({ ...f, editingId: g.id, partner: g.partner || "", project: g.project || "", country: g.country || f.country || "", amount: String(g.amount || ""), units: String(g.units || ""), note: g.note || "", date: g.date ? String(g.date).slice(0, 10) : f.date })),
    title: "Load this grant into the form above, then Save changes",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(201,169,97,0.4)", color: "#C9A961", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    onClick: () => store.updatePillarGrant(g.id, { archived: !g.archived }),
    title: g.archived ? "Restore into public totals" : "Archive: keep the record, remove it from public totals",
    style: { padding: "5px 10px", background: g.archived ? "rgba(201,169,97,0.15)" : "transparent", border: "1px solid rgba(232,228,220,0.3)", color: g.archived ? "#C9A961" : "rgba(232,228,220,0.55)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, g.archived ? "Restore" : "Archive"), /*#__PURE__*/React.createElement(ConfirmButton, {
    onConfirm: () => store.deletePillarGrant(g.id),
    confirmLabel: "Sure?",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(229,134,134,0.35)", color: "#E58686", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Del")))));
};

// ============================================================
// HOSPITALS TAB — programme copy + programme journal
// ============================================================
const HospitalsProgrammeTab = ({
  store
}) => {
  const OLIVE = "#C9847F";
  const [f, setF] = useState(() => store.getPillarContent("hospitals"));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(null);
  const set = patch => setF(prev => ({ ...prev, ...patch }));
  const setArticle = (id, patch) => setF(prev => ({ ...prev, articles: prev.articles.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const addArticle = () => setF(prev => ({ ...prev, articles: [...prev.articles, { id: "note-" + Date.now(), date: new Date().toISOString().slice(0, 10), title: "", body: "", partner: "", link: "", photo: null }] }));
  const removeArticle = id => setF(prev => ({ ...prev, articles: prev.articles.filter(a => a.id !== id) }));
  const uploadPhoto = async (id, file) => {
    if (!file) return;
    setBusy(id);
    try {
      const meta = await window.BrialFiles.put(file, { public: true });
      setArticle(id, { photo: { url: meta.url, path: meta.path, name: meta.name } });
    } catch (e) {
      alert(e.message || "Upload failed");
    }
    setBusy(null);
  };
  const save = () => {
    store.savePillarContent("hospitals", f);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  const lbl = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8, display: "block" };
  const inp = { width: "100%", padding: "12px 14px", background: "rgba(10,22,40,0.5)", border: "1px solid rgba(232,228,220,0.18)", color: "#E8E4DC", fontSize: 14, fontFamily: "'Manrope', sans-serif", outline: "none" };
  const area = { ...inp, minHeight: 110, resize: "vertical", lineHeight: 1.7 };
  const card = { background: "rgba(20,36,66,0.5)", border: `1px solid ${OLIVE}33`, padding: 26 };
  const saveBtn = { background: "linear-gradient(120deg, #EAD9A8, #C9A961 55%, #B08F4C)", color: "#0A1628", border: "none", padding: "13px 30px", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 };
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 90px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Hospitals \u2014 Programme"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "14px 0 0" }
  }, "The story the public sees."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Everything here feeds the public Hospitals page \u2014 the numbers, the introduction, and the programme journal below. Save once; the page updates instantly.")), /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(201,132,127,0.25)", minWidth: 170 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, "Care today"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, f.units, " clinics"))), /*#__PURE__*/React.createElement("div", {
    style: { ...card, marginTop: 34 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "110px 1fr", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Clinics (fallback)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "number",
    min: "0",
    value: f.units,
    onChange: e => set({ units: Math.max(0, parseInt(e.target.value || "0", 10)) })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Location line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.location,
    onChange: e => set({ location: e.target.value }),
    placeholder: "Village \u00b7 District \u2014 Country"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.partnerLine,
    onChange: e => set({ partnerLine: e.target.value }),
    placeholder: "In partnership with \u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Introduction \u2014 how the programme works"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: f.intro,
    onChange: e => set({ intro: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginTop: 44, flexWrap: "wrap" }
  }, /*#__PURE__*/React.createElement("h2", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: "#E8E4DC", margin: 0 }
  }, "Programme journal"), /*#__PURE__*/React.createElement("button", {
    onClick: addArticle,
    style: { background: "transparent", border: `1px solid ${OLIVE}66`, color: OLIVE, padding: "9px 18px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }
  }, "+ Add programme")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }
  }, f.articles.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: { ...card, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "rgba(232,228,220,0.55)" }
  }, "No field notes yet \u2014 add the first word from the wards."), f.articles.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: card
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 170px", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.title,
    onChange: e => setArticle(a.id, { title: e.target.value }),
    placeholder: "The first clinic"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "date",
    value: a.date && a.date.length >= 10 ? a.date.slice(0, 10) : "",
    onChange: e => setArticle(a.id, { date: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Body"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: a.body,
    onChange: e => setArticle(a.id, { body: e.target.value })
  })), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner on this programme"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.partner || "",
    onChange: e => setArticle(a.id, { partner: e.target.value }),
    placeholder: "e.g. Zaytoun CIC \u00b7 Palestine Fair Trade Association"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Link \u2014 website or update (optional)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.link || "",
    onChange: e => setArticle(a.id, { link: e.target.value }),
    placeholder: "https://\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }
  }, a.photo && (a.photo.url || a.photo.path) ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: a.photo.url || (window.brialSupabase ? window.brialSupabase.publicUrl(a.photo.path) : ""),
    alt: "",
    style: { height: 64, width: 96, objectFit: "cover", border: `1px solid ${OLIVE}55`, display: "block" }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { photo: null }),
    style: { background: "transparent", border: "1px solid rgba(229,134,134,0.5)", color: "#E58686", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Remove photo")) : /*#__PURE__*/React.createElement("label", {
    style: { border: `1px dashed ${OLIVE}55`, color: OLIVE, padding: "10px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, busy === a.id ? "Uploading\u2026" : "\u2191 Add photo", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp,image/gif",
    style: { display: "none" },
    onChange: e => {
      uploadPhoto(a.id, e.target.files && e.target.files[0]);
      e.target.value = "";
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { draft: !a.draft }),
    title: a.draft ? "Hidden from the public page \u2014 click to publish" : "Live on the public page \u2014 click to move back to draft",
    style: { background: a.draft ? "transparent" : "rgba(134,229,167,0.08)", border: a.draft ? "1px solid rgba(232,228,220,0.3)" : "1px solid rgba(134,229,167,0.45)", color: a.draft ? "rgba(232,228,220,0.6)" : "#86E5A7", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, a.draft ? "\u25cb Draft" : "\u25cf Published"), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeArticle(a.id),
    style: { marginLeft: "auto", background: "transparent", border: "none", color: "rgba(229,134,134,0.8)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Delete entry"))))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 16, marginTop: 36 }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: saveBtn
  }, saved ? "\u2713 Saved \u2014 live on the public page" : "Save programme"), saved && /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#86E5A7", letterSpacing: "0.1em" }
  }, "Synced.")));
};

// ============================================================
// SCHOOLS GRANTS TAB — Schools
// ============================================================
const SchoolsGrantsTab = ({
  store
}) => {
  const OLIVE = "#C9BC7F";
  const FGRID = "1.2fr 0.9fr 0.7fr 0.7fr 1fr 0.7fr 50px";
  const grants = store.getPillarGrants().filter(g => g.pillar === "Schools");
  const total = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.amount) || 0), 0);
  const trees = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.units) || 0), 0);
  const nations = [...new Set(grants.filter(g => !g.archived).map(g => (g.country || "").trim().toLowerCase()).filter(Boolean))].length;
  const [form, setForm] = useState({
    partner: "",
    project: "",
    country: "",
    amount: "",
    units: "",
    note: "",
    date: new Date().toISOString().slice(0, 10)
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.amount && form.project.trim() && form.country.trim();
  const submit = () => {
    if (!canSubmit) return;
    (form.editingId ? payload => store.updatePillarGrant(form.editingId, payload) : store.addPillarGrant)({
      pillar: "Schools",
      partner: form.partner,
      project: form.project,
      country: form.country,
      amount: parseFloat(form.amount),
      units: form.units,
      note: form.note,
      date: new Date(form.date).toISOString()
    });
    setForm({
      partner: "",
      project: "",
      country: "",
      amount: "",
      units: "",
      note: "",
      date: new Date().toISOString().slice(0, 10)
    });
  };
  const statCard = (label, value) => /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(201,188,127,0.25)", minWidth: 160 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, value));
  const field = (label, node) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, label), node);
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 80px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 32, flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Pillar \u2014 Schools"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "16px 0 0" }
  }, "Schools & teaching grants."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Record funds disbursed to education partners for classrooms and teaching. Totals feed the public \"Total distributed \u2014 all pillars\" figure \u2014 and per-grant school counts grow the public Schools page.")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 12, flexWrap: "wrap" }
  }, statCard("Total granted", fmtMoney(total)), statCard("Schools raised", trees), statCard("Nations reached", nations))), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,188,127,0.22)", padding: 28, marginBottom: 32 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 18 }
  }, "Record a new grant"), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }
  }, field("Partner / pelaksana", /*#__PURE__*/React.createElement("input", {
    value: form.partner,
    onChange: e => set("partner", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  })), field("Programme / project", /*#__PURE__*/React.createElement("input", {
    value: form.project,
    onChange: e => set("project", e.target.value),
    placeholder: "e.g. Primary School \u2014 Phase I",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginTop: 16 }
  }, field("Country / negara", /*#__PURE__*/React.createElement("input", {
    value: form.country,
    onChange: e => set("country", e.target.value),
    placeholder: "e.g. Indonesia",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Amount (USD)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.amount,
    onChange: e => set("amount", e.target.value),
    placeholder: "0",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Schools raised (this grant)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    value: form.units,
    onChange: e => set("units", e.target.value),
    placeholder: "e.g. 1",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Date", /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => set("date", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, field("Note (optional)", /*#__PURE__*/React.createElement("input", {
    value: form.note,
    onChange: e => set("note", e.target.value),
    placeholder: "Brief description",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !canSubmit,
    style: { ...adminPrimaryBtn, marginTop: 18, opacity: !canSubmit ? 0.5 : 1, cursor: !canSubmit ? "not-allowed" : "pointer" }
  }, form.editingId ? "Save changes" : "+ Record grant")), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,169,97,0.12)" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { padding: "14px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, borderBottom: "1px solid rgba(201,169,97,0.12)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }
  }, ["Programme", "Partner", "Country", "Amount", "Reference", "Date", ""].map((hh, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, hh))), grants.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: { padding: "60px 28px", textAlign: "center", color: "rgba(232,228,220,0.4)", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic" }
  }, "No grants recorded yet.") : grants.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    style: { padding: "18px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, alignItems: "center", borderBottom: "1px solid rgba(201,169,97,0.08)" }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#E8E4DC" }
  }, g.project), g.note && /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 12, color: "rgba(232,228,220,0.55)", marginTop: 3 }
  }, g.note), Number(g.units) > 0 ? /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 5 }
  }, g.units + (Number(g.units) === 1 ? " school" : " schools") + " \u00b7 in session") : null), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: "rgba(232,228,220,0.8)" }
  }, g.partner), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: OLIVE }
  }, g.country || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#C9A961", fontVariantNumeric: "tabular-nums" }
  }, fmtMoney(g.amount)), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.7)", overflowWrap: "anywhere" }
  }, g.txRef || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.6)" }
  }, fmtDate(g.date)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm(f => ({ ...f, editingId: g.id, partner: g.partner || "", project: g.project || "", country: g.country || f.country || "", amount: String(g.amount || ""), units: String(g.units || ""), note: g.note || "", date: g.date ? String(g.date).slice(0, 10) : f.date })),
    title: "Load this grant into the form above, then Save changes",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(201,169,97,0.4)", color: "#C9A961", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    onClick: () => store.updatePillarGrant(g.id, { archived: !g.archived }),
    title: g.archived ? "Restore into public totals" : "Archive: keep the record, remove it from public totals",
    style: { padding: "5px 10px", background: g.archived ? "rgba(201,169,97,0.15)" : "transparent", border: "1px solid rgba(232,228,220,0.3)", color: g.archived ? "#C9A961" : "rgba(232,228,220,0.55)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, g.archived ? "Restore" : "Archive"), /*#__PURE__*/React.createElement(ConfirmButton, {
    onConfirm: () => store.deletePillarGrant(g.id),
    confirmLabel: "Sure?",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(229,134,134,0.35)", color: "#E58686", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Del")))));
};

// ============================================================
// SCHOOLS TAB — programme copy + programme journal
// ============================================================
const SchoolsProgrammeTab = ({
  store
}) => {
  const OLIVE = "#C9BC7F";
  const [f, setF] = useState(() => store.getPillarContent("schools"));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(null);
  const set = patch => setF(prev => ({ ...prev, ...patch }));
  const setArticle = (id, patch) => setF(prev => ({ ...prev, articles: prev.articles.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const addArticle = () => setF(prev => ({ ...prev, articles: [...prev.articles, { id: "note-" + Date.now(), date: new Date().toISOString().slice(0, 10), title: "", body: "", partner: "", link: "", photo: null }] }));
  const removeArticle = id => setF(prev => ({ ...prev, articles: prev.articles.filter(a => a.id !== id) }));
  const uploadPhoto = async (id, file) => {
    if (!file) return;
    setBusy(id);
    try {
      const meta = await window.BrialFiles.put(file, { public: true });
      setArticle(id, { photo: { url: meta.url, path: meta.path, name: meta.name } });
    } catch (e) {
      alert(e.message || "Upload failed");
    }
    setBusy(null);
  };
  const save = () => {
    store.savePillarContent("schools", f);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  const lbl = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8, display: "block" };
  const inp = { width: "100%", padding: "12px 14px", background: "rgba(10,22,40,0.5)", border: "1px solid rgba(232,228,220,0.18)", color: "#E8E4DC", fontSize: 14, fontFamily: "'Manrope', sans-serif", outline: "none" };
  const area = { ...inp, minHeight: 110, resize: "vertical", lineHeight: 1.7 };
  const card = { background: "rgba(20,36,66,0.5)", border: `1px solid ${OLIVE}33`, padding: 26 };
  const saveBtn = { background: "linear-gradient(120deg, #EAD9A8, #C9A961 55%, #B08F4C)", color: "#0A1628", border: "none", padding: "13px 30px", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 };
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 90px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Schools \u2014 Programme"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "14px 0 0" }
  }, "The story the public sees."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Everything here feeds the public Schools page \u2014 the numbers, the introduction, and the programme journal below. Save once; the page updates instantly.")), /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(201,188,127,0.25)", minWidth: 170 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, "In session today"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, f.units, " schools"))), /*#__PURE__*/React.createElement("div", {
    style: { ...card, marginTop: 34 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "110px 1fr", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Schools (fallback)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "number",
    min: "0",
    value: f.units,
    onChange: e => set({ units: Math.max(0, parseInt(e.target.value || "0", 10)) })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Location line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.location,
    onChange: e => set({ location: e.target.value }),
    placeholder: "Village \u00b7 District \u2014 Country"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.partnerLine,
    onChange: e => set({ partnerLine: e.target.value }),
    placeholder: "In partnership with \u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Introduction \u2014 how the programme works"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: f.intro,
    onChange: e => set({ intro: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginTop: 44, flexWrap: "wrap" }
  }, /*#__PURE__*/React.createElement("h2", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: "#E8E4DC", margin: 0 }
  }, "Programme journal"), /*#__PURE__*/React.createElement("button", {
    onClick: addArticle,
    style: { background: "transparent", border: `1px solid ${OLIVE}66`, color: OLIVE, padding: "9px 18px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }
  }, "+ Add programme")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }
  }, f.articles.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: { ...card, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "rgba(232,228,220,0.55)" }
  }, "No field notes yet \u2014 add the first word from the classrooms."), f.articles.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: card
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 170px", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.title,
    onChange: e => setArticle(a.id, { title: e.target.value }),
    placeholder: "The first school"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "date",
    value: a.date && a.date.length >= 10 ? a.date.slice(0, 10) : "",
    onChange: e => setArticle(a.id, { date: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Body"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: a.body,
    onChange: e => setArticle(a.id, { body: e.target.value })
  })), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner on this programme"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.partner || "",
    onChange: e => setArticle(a.id, { partner: e.target.value }),
    placeholder: "e.g. Zaytoun CIC \u00b7 Palestine Fair Trade Association"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Link \u2014 website or update (optional)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.link || "",
    onChange: e => setArticle(a.id, { link: e.target.value }),
    placeholder: "https://\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }
  }, a.photo && (a.photo.url || a.photo.path) ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: a.photo.url || (window.brialSupabase ? window.brialSupabase.publicUrl(a.photo.path) : ""),
    alt: "",
    style: { height: 64, width: 96, objectFit: "cover", border: `1px solid ${OLIVE}55`, display: "block" }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { photo: null }),
    style: { background: "transparent", border: "1px solid rgba(229,134,134,0.5)", color: "#E58686", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Remove photo")) : /*#__PURE__*/React.createElement("label", {
    style: { border: `1px dashed ${OLIVE}55`, color: OLIVE, padding: "10px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, busy === a.id ? "Uploading\u2026" : "\u2191 Add photo", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp,image/gif",
    style: { display: "none" },
    onChange: e => {
      uploadPhoto(a.id, e.target.files && e.target.files[0]);
      e.target.value = "";
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { draft: !a.draft }),
    title: a.draft ? "Hidden from the public page \u2014 click to publish" : "Live on the public page \u2014 click to move back to draft",
    style: { background: a.draft ? "transparent" : "rgba(134,229,167,0.08)", border: a.draft ? "1px solid rgba(232,228,220,0.3)" : "1px solid rgba(134,229,167,0.45)", color: a.draft ? "rgba(232,228,220,0.6)" : "#86E5A7", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, a.draft ? "\u25cb Draft" : "\u25cf Published"), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeArticle(a.id),
    style: { marginLeft: "auto", background: "transparent", border: "none", color: "rgba(229,134,134,0.8)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Delete entry"))))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 16, marginTop: 36 }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: saveBtn
  }, saved ? "\u2713 Saved \u2014 live on the public page" : "Save programme"), saved && /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#86E5A7", letterSpacing: "0.1em" }
  }, "Synced.")));
};

// ============================================================
// LIVESTOCK GRANTS TAB — Livestock & Enterprise
// ============================================================
const LivestockGrantsTab = ({
  store
}) => {
  const OLIVE = "#C9A07F";
  const FGRID = "1.2fr 0.9fr 0.7fr 0.7fr 1fr 0.7fr 50px";
  const grants = store.getPillarGrants().filter(g => g.pillar === "Livestock & Enterprise");
  const total = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.amount) || 0), 0);
  const trees = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.units) || 0), 0);
  const nations = [...new Set(grants.filter(g => !g.archived).map(g => (g.country || "").trim().toLowerCase()).filter(Boolean))].length;
  const [form, setForm] = useState({
    partner: "",
    project: "",
    country: "",
    amount: "",
    units: "",
    note: "",
    date: new Date().toISOString().slice(0, 10)
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.amount && form.project.trim() && form.country.trim();
  const submit = () => {
    if (!canSubmit) return;
    (form.editingId ? payload => store.updatePillarGrant(form.editingId, payload) : store.addPillarGrant)({
      pillar: "Livestock & Enterprise",
      partner: form.partner,
      project: form.project,
      country: form.country,
      amount: parseFloat(form.amount),
      units: form.units,
      note: form.note,
      date: new Date(form.date).toISOString()
    });
    setForm({
      partner: "",
      project: "",
      country: "",
      amount: "",
      units: "",
      note: "",
      date: new Date().toISOString().slice(0, 10)
    });
  };
  const statCard = (label, value) => /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(201,160,127,0.25)", minWidth: 160 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, value));
  const field = (label, node) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, label), node);
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 80px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 32, flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Pillar \u2014 Livestock & Enterprise"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "16px 0 0" }
  }, "Herds & enterprise grants."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Record funds placed as productive capital \u2014 herds, tools and small enterprise. Totals feed the public \"Total distributed \u2014 all pillars\" figure \u2014 and per-grant placement counts grow the public Livestock & Enterprise page.")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 12, flexWrap: "wrap" }
  }, statCard("Total granted", fmtMoney(total)), statCard("Placements working", trees), statCard("Nations reached", nations))), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,160,127,0.22)", padding: 28, marginBottom: 32 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 18 }
  }, "Record a new grant"), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }
  }, field("Partner / pelaksana", /*#__PURE__*/React.createElement("input", {
    value: form.partner,
    onChange: e => set("partner", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  })), field("Programme / project", /*#__PURE__*/React.createElement("input", {
    value: form.project,
    onChange: e => set("project", e.target.value),
    placeholder: "e.g. Goat Herd \u2014 Family Batch I",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginTop: 16 }
  }, field("Country / negara", /*#__PURE__*/React.createElement("input", {
    value: form.country,
    onChange: e => set("country", e.target.value),
    placeholder: "e.g. Indonesia",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Amount (USD)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.amount,
    onChange: e => set("amount", e.target.value),
    placeholder: "0",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Placements (this grant)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    value: form.units,
    onChange: e => set("units", e.target.value),
    placeholder: "e.g. 1",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Date", /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => set("date", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, field("Note (optional)", /*#__PURE__*/React.createElement("input", {
    value: form.note,
    onChange: e => set("note", e.target.value),
    placeholder: "Brief description",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !canSubmit,
    style: { ...adminPrimaryBtn, marginTop: 18, opacity: !canSubmit ? 0.5 : 1, cursor: !canSubmit ? "not-allowed" : "pointer" }
  }, form.editingId ? "Save changes" : "+ Record grant")), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,169,97,0.12)" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { padding: "14px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, borderBottom: "1px solid rgba(201,169,97,0.12)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }
  }, ["Programme", "Partner", "Country", "Amount", "Reference", "Date", ""].map((hh, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, hh))), grants.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: { padding: "60px 28px", textAlign: "center", color: "rgba(232,228,220,0.4)", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic" }
  }, "No grants recorded yet.") : grants.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    style: { padding: "18px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, alignItems: "center", borderBottom: "1px solid rgba(201,169,97,0.08)" }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#E8E4DC" }
  }, g.project), g.note && /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 12, color: "rgba(232,228,220,0.55)", marginTop: 3 }
  }, g.note), Number(g.units) > 0 ? /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 5 }
  }, g.units + (Number(g.units) === 1 ? " placement" : " placements") + " \u00b7 productive") : null), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: "rgba(232,228,220,0.8)" }
  }, g.partner), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: OLIVE }
  }, g.country || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#C9A961", fontVariantNumeric: "tabular-nums" }
  }, fmtMoney(g.amount)), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.7)", overflowWrap: "anywhere" }
  }, g.txRef || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.6)" }
  }, fmtDate(g.date)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm(f => ({ ...f, editingId: g.id, partner: g.partner || "", project: g.project || "", country: g.country || f.country || "", amount: String(g.amount || ""), units: String(g.units || ""), note: g.note || "", date: g.date ? String(g.date).slice(0, 10) : f.date })),
    title: "Load this grant into the form above, then Save changes",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(201,169,97,0.4)", color: "#C9A961", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    onClick: () => store.updatePillarGrant(g.id, { archived: !g.archived }),
    title: g.archived ? "Restore into public totals" : "Archive: keep the record, remove it from public totals",
    style: { padding: "5px 10px", background: g.archived ? "rgba(201,169,97,0.15)" : "transparent", border: "1px solid rgba(232,228,220,0.3)", color: g.archived ? "#C9A961" : "rgba(232,228,220,0.55)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, g.archived ? "Restore" : "Archive"), /*#__PURE__*/React.createElement(ConfirmButton, {
    onConfirm: () => store.deletePillarGrant(g.id),
    confirmLabel: "Sure?",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(229,134,134,0.35)", color: "#E58686", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Del")))));
};

// ============================================================
// LIVESTOCK TAB — programme copy + programme journal
// ============================================================
const LivestockProgrammeTab = ({
  store
}) => {
  const OLIVE = "#C9A07F";
  const [f, setF] = useState(() => store.getPillarContent("livestock"));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(null);
  const set = patch => setF(prev => ({ ...prev, ...patch }));
  const setArticle = (id, patch) => setF(prev => ({ ...prev, articles: prev.articles.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const addArticle = () => setF(prev => ({ ...prev, articles: [...prev.articles, { id: "note-" + Date.now(), date: new Date().toISOString().slice(0, 10), title: "", body: "", partner: "", link: "", photo: null }] }));
  const removeArticle = id => setF(prev => ({ ...prev, articles: prev.articles.filter(a => a.id !== id) }));
  const uploadPhoto = async (id, file) => {
    if (!file) return;
    setBusy(id);
    try {
      const meta = await window.BrialFiles.put(file, { public: true });
      setArticle(id, { photo: { url: meta.url, path: meta.path, name: meta.name } });
    } catch (e) {
      alert(e.message || "Upload failed");
    }
    setBusy(null);
  };
  const save = () => {
    store.savePillarContent("livestock", f);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  const lbl = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8, display: "block" };
  const inp = { width: "100%", padding: "12px 14px", background: "rgba(10,22,40,0.5)", border: "1px solid rgba(232,228,220,0.18)", color: "#E8E4DC", fontSize: 14, fontFamily: "'Manrope', sans-serif", outline: "none" };
  const area = { ...inp, minHeight: 110, resize: "vertical", lineHeight: 1.7 };
  const card = { background: "rgba(20,36,66,0.5)", border: `1px solid ${OLIVE}33`, padding: 26 };
  const saveBtn = { background: "linear-gradient(120deg, #EAD9A8, #C9A961 55%, #B08F4C)", color: "#0A1628", border: "none", padding: "13px 30px", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 };
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 90px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Livestock & Enterprise \u2014 Programme"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "14px 0 0" }
  }, "The story the public sees."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Everything here feeds the public Livestock & Enterprise page \u2014 the numbers, the introduction, and the programme journal below. Save once; the page updates instantly.")), /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(201,160,127,0.25)", minWidth: 170 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, "Working today"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, f.units, " placements"))), /*#__PURE__*/React.createElement("div", {
    style: { ...card, marginTop: 34 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "110px 1fr", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Placements (fallback)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "number",
    min: "0",
    value: f.units,
    onChange: e => set({ units: Math.max(0, parseInt(e.target.value || "0", 10)) })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Location line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.location,
    onChange: e => set({ location: e.target.value }),
    placeholder: "Village \u00b7 District \u2014 Country"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.partnerLine,
    onChange: e => set({ partnerLine: e.target.value }),
    placeholder: "In partnership with \u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Introduction \u2014 how the programme works"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: f.intro,
    onChange: e => set({ intro: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginTop: 44, flexWrap: "wrap" }
  }, /*#__PURE__*/React.createElement("h2", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: "#E8E4DC", margin: 0 }
  }, "Programme journal"), /*#__PURE__*/React.createElement("button", {
    onClick: addArticle,
    style: { background: "transparent", border: `1px solid ${OLIVE}66`, color: OLIVE, padding: "9px 18px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }
  }, "+ Add programme")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }
  }, f.articles.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: { ...card, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "rgba(232,228,220,0.55)" }
  }, "No field notes yet \u2014 add the first word from the paddocks."), f.articles.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: card
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 170px", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.title,
    onChange: e => setArticle(a.id, { title: e.target.value }),
    placeholder: "The first herd"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "date",
    value: a.date && a.date.length >= 10 ? a.date.slice(0, 10) : "",
    onChange: e => setArticle(a.id, { date: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Body"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: a.body,
    onChange: e => setArticle(a.id, { body: e.target.value })
  })), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner on this programme"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.partner || "",
    onChange: e => setArticle(a.id, { partner: e.target.value }),
    placeholder: "e.g. Zaytoun CIC \u00b7 Palestine Fair Trade Association"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Link \u2014 website or update (optional)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.link || "",
    onChange: e => setArticle(a.id, { link: e.target.value }),
    placeholder: "https://\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }
  }, a.photo && (a.photo.url || a.photo.path) ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: a.photo.url || (window.brialSupabase ? window.brialSupabase.publicUrl(a.photo.path) : ""),
    alt: "",
    style: { height: 64, width: 96, objectFit: "cover", border: `1px solid ${OLIVE}55`, display: "block" }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { photo: null }),
    style: { background: "transparent", border: "1px solid rgba(229,134,134,0.5)", color: "#E58686", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Remove photo")) : /*#__PURE__*/React.createElement("label", {
    style: { border: `1px dashed ${OLIVE}55`, color: OLIVE, padding: "10px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, busy === a.id ? "Uploading\u2026" : "\u2191 Add photo", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp,image/gif",
    style: { display: "none" },
    onChange: e => {
      uploadPhoto(a.id, e.target.files && e.target.files[0]);
      e.target.value = "";
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { draft: !a.draft }),
    title: a.draft ? "Hidden from the public page \u2014 click to publish" : "Live on the public page \u2014 click to move back to draft",
    style: { background: a.draft ? "transparent" : "rgba(134,229,167,0.08)", border: a.draft ? "1px solid rgba(232,228,220,0.3)" : "1px solid rgba(134,229,167,0.45)", color: a.draft ? "rgba(232,228,220,0.6)" : "#86E5A7", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, a.draft ? "\u25cb Draft" : "\u25cf Published"), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeArticle(a.id),
    style: { marginLeft: "auto", background: "transparent", border: "none", color: "rgba(229,134,134,0.8)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Delete entry"))))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 16, marginTop: 36 }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: saveBtn
  }, saved ? "\u2713 Saved \u2014 live on the public page" : "Save programme"), saved && /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#86E5A7", letterSpacing: "0.1em" }
  }, "Synced.")));
};

// ============================================================
// INFRA GRANTS TAB — Sustainable Infrastructure
// ============================================================
const InfraGrantsTab = ({
  store
}) => {
  const OLIVE = "#9FA8B8";
  const FGRID = "1.2fr 0.9fr 0.7fr 0.7fr 1fr 0.7fr 50px";
  const grants = store.getPillarGrants().filter(g => g.pillar === "Sustainable Infrastructure");
  const total = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.amount) || 0), 0);
  const trees = grants.reduce((a, g) => a + (g.archived ? 0 : Number(g.units) || 0), 0);
  const nations = [...new Set(grants.filter(g => !g.archived).map(g => (g.country || "").trim().toLowerCase()).filter(Boolean))].length;
  const [form, setForm] = useState({
    partner: "",
    project: "",
    country: "",
    amount: "",
    units: "",
    note: "",
    date: new Date().toISOString().slice(0, 10)
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.amount && form.project.trim() && form.country.trim();
  const submit = () => {
    if (!canSubmit) return;
    (form.editingId ? payload => store.updatePillarGrant(form.editingId, payload) : store.addPillarGrant)({
      pillar: "Sustainable Infrastructure",
      partner: form.partner,
      project: form.project,
      country: form.country,
      amount: parseFloat(form.amount),
      units: form.units,
      note: form.note,
      date: new Date(form.date).toISOString()
    });
    setForm({
      partner: "",
      project: "",
      country: "",
      amount: "",
      units: "",
      note: "",
      date: new Date().toISOString().slice(0, 10)
    });
  };
  const statCard = (label, value) => /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(159,168,184,0.25)", minWidth: 160 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, value));
  const field = (label, node) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: worshipLabel
  }, label), node);
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 80px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 32, flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Pillar \u2014 Sustainable Infrastructure"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "16px 0 0" }
  }, "Public works grants."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Record funds disbursed to partners for bridges, power and public works. Totals feed the public \"Total distributed \u2014 all pillars\" figure \u2014 and per-grant work counts grow the public Sustainable Infrastructure page.")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 12, flexWrap: "wrap" }
  }, statCard("Total granted", fmtMoney(total)), statCard("Works standing", trees), statCard("Nations reached", nations))), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(159,168,184,0.22)", padding: 28, marginBottom: 32 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 18 }
  }, "Record a new grant"), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }
  }, field("Partner / pelaksana", /*#__PURE__*/React.createElement("input", {
    value: form.partner,
    onChange: e => set("partner", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  })), field("Programme / project", /*#__PURE__*/React.createElement("input", {
    value: form.project,
    onChange: e => set("project", e.target.value),
    placeholder: "e.g. Footbridge \u2014 Phase I",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginTop: 16 }
  }, field("Country / negara", /*#__PURE__*/React.createElement("input", {
    value: form.country,
    onChange: e => set("country", e.target.value),
    placeholder: "e.g. Indonesia",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Amount (USD)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.amount,
    onChange: e => set("amount", e.target.value),
    placeholder: "0",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Works completed (this grant)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    value: form.units,
    onChange: e => set("units", e.target.value),
    placeholder: "e.g. 1",
    style: { ...adminInputStyle, width: "100%" }
  })), field("Date", /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => set("date", e.target.value),
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, field("Note (optional)", /*#__PURE__*/React.createElement("input", {
    value: form.note,
    onChange: e => set("note", e.target.value),
    placeholder: "Brief description",
    style: { ...adminInputStyle, width: "100%" }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !canSubmit,
    style: { ...adminPrimaryBtn, marginTop: 18, opacity: !canSubmit ? 0.5 : 1, cursor: !canSubmit ? "not-allowed" : "pointer" }
  }, form.editingId ? "Save changes" : "+ Record grant")), /*#__PURE__*/React.createElement("div", {
    style: { background: "rgba(20,36,66,0.5)", border: "1px solid rgba(201,169,97,0.12)" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { padding: "14px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, borderBottom: "1px solid rgba(201,169,97,0.12)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }
  }, ["Programme", "Partner", "Country", "Amount", "Reference", "Date", ""].map((hh, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, hh))), grants.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: { padding: "60px 28px", textAlign: "center", color: "rgba(232,228,220,0.4)", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic" }
  }, "No grants recorded yet.") : grants.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    style: { padding: "18px 28px", display: "grid", gridTemplateColumns: FGRID, gap: 16, alignItems: "center", borderBottom: "1px solid rgba(201,169,97,0.08)" }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#E8E4DC" }
  }, g.project), g.note && /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 12, color: "rgba(232,228,220,0.55)", marginTop: 3 }
  }, g.note), Number(g.units) > 0 ? /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 5 }
  }, g.units + (Number(g.units) === 1 ? " work" : " works") + " \u00b7 standing") : null), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: "rgba(232,228,220,0.8)" }
  }, g.partner), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: OLIVE }
  }, g.country || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#C9A961", fontVariantNumeric: "tabular-nums" }
  }, fmtMoney(g.amount)), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.7)", overflowWrap: "anywhere" }
  }, g.txRef || "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(232,228,220,0.6)" }
  }, fmtDate(g.date)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm(f => ({ ...f, editingId: g.id, partner: g.partner || "", project: g.project || "", country: g.country || f.country || "", amount: String(g.amount || ""), units: String(g.units || ""), note: g.note || "", date: g.date ? String(g.date).slice(0, 10) : f.date })),
    title: "Load this grant into the form above, then Save changes",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(201,169,97,0.4)", color: "#C9A961", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    onClick: () => store.updatePillarGrant(g.id, { archived: !g.archived }),
    title: g.archived ? "Restore into public totals" : "Archive: keep the record, remove it from public totals",
    style: { padding: "5px 10px", background: g.archived ? "rgba(201,169,97,0.15)" : "transparent", border: "1px solid rgba(232,228,220,0.3)", color: g.archived ? "#C9A961" : "rgba(232,228,220,0.55)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 8 }
  }, g.archived ? "Restore" : "Archive"), /*#__PURE__*/React.createElement(ConfirmButton, {
    onConfirm: () => store.deletePillarGrant(g.id),
    confirmLabel: "Sure?",
    style: { padding: "5px 10px", background: "transparent", border: "1px solid rgba(229,134,134,0.35)", color: "#E58686", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Del")))));
};

// ============================================================
// INFRA TAB — programme copy + programme journal
// ============================================================
const InfraProgrammeTab = ({
  store
}) => {
  const OLIVE = "#9FA8B8";
  const [f, setF] = useState(() => store.getPillarContent("infra"));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(null);
  const set = patch => setF(prev => ({ ...prev, ...patch }));
  const setArticle = (id, patch) => setF(prev => ({ ...prev, articles: prev.articles.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const addArticle = () => setF(prev => ({ ...prev, articles: [...prev.articles, { id: "note-" + Date.now(), date: new Date().toISOString().slice(0, 10), title: "", body: "", partner: "", link: "", photo: null }] }));
  const removeArticle = id => setF(prev => ({ ...prev, articles: prev.articles.filter(a => a.id !== id) }));
  const uploadPhoto = async (id, file) => {
    if (!file) return;
    setBusy(id);
    try {
      const meta = await window.BrialFiles.put(file, { public: true });
      setArticle(id, { photo: { url: meta.url, path: meta.path, name: meta.name } });
    } catch (e) {
      alert(e.message || "Upload failed");
    }
    setBusy(null);
  };
  const save = () => {
    store.savePillarContent("infra", f);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  const lbl = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(232,228,220,0.5)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8, display: "block" };
  const inp = { width: "100%", padding: "12px 14px", background: "rgba(10,22,40,0.5)", border: "1px solid rgba(232,228,220,0.18)", color: "#E8E4DC", fontSize: 14, fontFamily: "'Manrope', sans-serif", outline: "none" };
  const area = { ...inp, minHeight: 110, resize: "vertical", lineHeight: 1.7 };
  const card = { background: "rgba(20,36,66,0.5)", border: `1px solid ${OLIVE}33`, padding: 26 };
  const saveBtn = { background: "linear-gradient(120deg, #EAD9A8, #C9A961 55%, #B08F4C)", color: "#0A1628", border: "none", padding: "13px 30px", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 };
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "40px clamp(20px, 4vw, 56px) 90px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: OLIVE, letterSpacing: "0.28em", textTransform: "uppercase" }
  }, "\u00a7 Sustainable Infrastructure \u2014 Programme"), /*#__PURE__*/React.createElement("h1", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#E8E4DC", margin: "14px 0 0" }
  }, "The story the public sees."), /*#__PURE__*/React.createElement("p", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "rgba(232,228,220,0.6)", margin: "10px 0 0", maxWidth: 560 }
  }, "Everything here feeds the public Sustainable Infrastructure page \u2014 the numbers, the introduction, and the programme journal below. Save once; the page updates instantly.")), /*#__PURE__*/React.createElement("div", {
    style: { padding: "16px 24px", background: "rgba(20,36,66,0.6)", border: "1px solid rgba(159,168,184,0.25)", minWidth: 170 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: OLIVE, letterSpacing: "0.2em", textTransform: "uppercase" }
  }, "Standing today"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#E8E4DC", marginTop: 8, fontVariantNumeric: "tabular-nums" }
  }, f.units, " works"))), /*#__PURE__*/React.createElement("div", {
    style: { ...card, marginTop: 34 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "110px 1fr", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Works (fallback)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "number",
    min: "0",
    value: f.units,
    onChange: e => set({ units: Math.max(0, parseInt(e.target.value || "0", 10)) })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Location line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.location,
    onChange: e => set({ location: e.target.value }),
    placeholder: "Village \u00b7 District \u2014 Country"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner line"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: f.partnerLine,
    onChange: e => set({ partnerLine: e.target.value }),
    placeholder: "In partnership with \u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Introduction \u2014 how the programme works"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: f.intro,
    onChange: e => set({ intro: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginTop: 44, flexWrap: "wrap" }
  }, /*#__PURE__*/React.createElement("h2", {
    style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: "#E8E4DC", margin: 0 }
  }, "Programme journal"), /*#__PURE__*/React.createElement("button", {
    onClick: addArticle,
    style: { background: "transparent", border: `1px solid ${OLIVE}66`, color: OLIVE, padding: "9px 18px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }
  }, "+ Add programme")), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }
  }, f.articles.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: { ...card, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "rgba(232,228,220,0.55)" }
  }, "No field notes yet \u2014 add the first word from the works."), f.articles.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: card
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 170px", gap: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.title,
    onChange: e => setArticle(a.id, { title: e.target.value }),
    placeholder: "The first bridge"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Date"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "date",
    value: a.date && a.date.length >= 10 ? a.date.slice(0, 10) : "",
    onChange: e => setArticle(a.id, { date: e.target.value })
  }))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 16 }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Body"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: a.body,
    onChange: e => setArticle(a.id, { body: e.target.value })
  })), /*#__PURE__*/React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Partner on this programme"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.partner || "",
    onChange: e => setArticle(a.id, { partner: e.target.value }),
    placeholder: "e.g. Zaytoun CIC \u00b7 Palestine Fair Trade Association"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Link \u2014 website or update (optional)"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: a.link || "",
    onChange: e => setArticle(a.id, { link: e.target.value }),
    placeholder: "https://\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }
  }, a.photo && (a.photo.url || a.photo.path) ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: a.photo.url || (window.brialSupabase ? window.brialSupabase.publicUrl(a.photo.path) : ""),
    alt: "",
    style: { height: 64, width: 96, objectFit: "cover", border: `1px solid ${OLIVE}55`, display: "block" }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { photo: null }),
    style: { background: "transparent", border: "1px solid rgba(229,134,134,0.5)", color: "#E58686", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Remove photo")) : /*#__PURE__*/React.createElement("label", {
    style: { border: `1px dashed ${OLIVE}55`, color: OLIVE, padding: "10px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, busy === a.id ? "Uploading\u2026" : "\u2191 Add photo", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp,image/gif",
    style: { display: "none" },
    onChange: e => {
      uploadPhoto(a.id, e.target.files && e.target.files[0]);
      e.target.value = "";
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArticle(a.id, { draft: !a.draft }),
    title: a.draft ? "Hidden from the public page \u2014 click to publish" : "Live on the public page \u2014 click to move back to draft",
    style: { background: a.draft ? "transparent" : "rgba(134,229,167,0.08)", border: a.draft ? "1px solid rgba(232,228,220,0.3)" : "1px solid rgba(134,229,167,0.45)", color: a.draft ? "rgba(232,228,220,0.6)" : "#86E5A7", padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, a.draft ? "\u25cb Draft" : "\u25cf Published"), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeArticle(a.id),
    style: { marginLeft: "auto", background: "transparent", border: "none", color: "rgba(229,134,134,0.8)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }
  }, "Delete entry"))))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 16, marginTop: 36 }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: saveBtn
  }, saved ? "\u2713 Saved \u2014 live on the public page" : "Save programme"), saved && /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#86E5A7", letterSpacing: "0.1em" }
  }, "Synced.")));
};

// ============================================================
// GENERIC PILLAR CONSOLES — config for the four newest pillars
// ============================================================
const GEN_PILLAR_CONSOLES = {
  hospitals: { name: "Hospitals", accent: "#C9847F", eyebrow: "§ Hospitals — Partner Link", blurb: "The public Hospitals page can show a 'Learn more about our partner' button — set its destination here, or hide it while between partners.", help: "Point this to the health partner's programme page. Use the visibility switch below when the pillar has no active partner." },
  schools: { name: "Schools", accent: "#C9BC7F", eyebrow: "§ Schools — Partner Link", blurb: "The public Schools page can show a 'Learn more about our partner' button — set its destination here, or hide it while between partners.", help: "Point this to the education partner's programme page. Use the visibility switch below when the pillar has no active partner." },
  livestock: { name: "Livestock & Enterprise", accent: "#C9A07F", eyebrow: "§ Livestock & Enterprise — Partner Link", blurb: "The public Livestock & Enterprise page can show a 'Learn more about our partner' button — set its destination here, or hide it while between partners.", help: "Point this to the enterprise partner's programme page. Use the visibility switch below when the pillar has no active partner." },
  infra: { name: "Sustainable Infrastructure", accent: "#9FA8B8", eyebrow: "§ Sustainable Infrastructure — Partner Link", blurb: "The public Sustainable Infrastructure page can show a 'Learn more about our partner' button — set its destination here, or hide it while between partners.", help: "Point this to the works partner's programme page. Use the visibility switch below when the pillar has no active partner." }
};
GEN_PILLAR_CONSOLES.hospitals.Grants = HospitalsGrantsTab; GEN_PILLAR_CONSOLES.hospitals.Prog = HospitalsProgrammeTab;
GEN_PILLAR_CONSOLES.schools.Grants = SchoolsGrantsTab; GEN_PILLAR_CONSOLES.schools.Prog = SchoolsProgrammeTab;
GEN_PILLAR_CONSOLES.livestock.Grants = LivestockGrantsTab; GEN_PILLAR_CONSOLES.livestock.Prog = LivestockProgrammeTab;
GEN_PILLAR_CONSOLES.infra.Grants = InfraGrantsTab; GEN_PILLAR_CONSOLES.infra.Prog = InfraProgrammeTab;

// ============================================================
// PILLAR REDIRECT LINK TAB — edit where a public pillar sends its audience
// ============================================================
const PillarLinkTab = ({
  store,
  pillarKey,
  accent = "#C9A961",
  eyebrow,
  heading,
  blurb,
  help
}) => {
  const [url, setUrl] = useState(() => store.getPillarLink(pillarKey));
  const [saved, setSaved] = useState(false);
  const [hiddenFlag, setHiddenFlag] = useState(() => store.getPillarLinkHidden ? store.getPillarLinkHidden(pillarKey) : false);
  const toggleHidden = () => {
    const nv = !hiddenFlag;
    setHiddenFlag(nv);
    store.savePillarLinkHidden && store.savePillarLinkHidden(pillarKey, nv);
  };
  useEffect(() => {
    setUrl(store.getPillarLink(pillarKey));
    setHiddenFlag(store.getPillarLinkHidden ? store.getPillarLinkHidden(pillarKey) : false);
  }, [pillarKey]);
  const stored = store.getPillarLink(pillarKey);
  const dirty = url.trim() !== stored;
  const valid = /^https?:\/\//i.test(url.trim());
  const save = () => {
    store.savePillarLink(pillarKey, url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  const inp = {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(10,22,40,0.5)",
    border: `1px solid ${valid ? accent + "59" : "rgba(232,228,220,0.18)"}`,
    color: "#E8E4DC",
    fontSize: 15,
    fontFamily: "'JetBrains Mono', monospace",
    outline: "none"
  };
  const lbl = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "rgba(232,228,220,0.5)",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    marginBottom: 8,
    display: "block"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px clamp(20px, 4vw, 56px) 80px",
      maxWidth: 780
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: accent,
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 44,
      fontWeight: 400,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "14px 0 0"
    }
  }, heading), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "rgba(232,228,220,0.6)",
      margin: "10px 0 0",
      maxWidth: 620
    }
  }, blurb), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 34,
      background: "rgba(20,36,66,0.5)",
      border: `1px solid ${accent}26`,
      padding: 28
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Redirect URL"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: url,
    onChange: e => setUrl(e.target.value),
    placeholder: "https://lynk.id/brial",
    spellCheck: false
  }), url.trim() && !valid && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#E58686"
    }
  }, "Link should start with http:// or https://"), help && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.55)"
    }
  }, help), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginTop: 24,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: save,
    disabled: !dirty || !valid,
    style: {
      background: !dirty || !valid ? "rgba(201,169,97,0.3)" : accent,
      color: "#0A1628",
      border: "none",
      padding: "12px 26px",
      cursor: !dirty || !valid ? "not-allowed" : "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 600
    }
  }, saved ? "\u2713 Saved" : "Save link"), valid && /*#__PURE__*/React.createElement("a", {
    href: url.trim(),
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: accent,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      textDecoration: "none",
      borderBottom: `1px solid ${accent}66`,
      paddingBottom: 2
    }
  }, "Test link \u2197"), saved && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#86E5A7",
      letterSpacing: "0.1em"
    }
  }, "Live on the public site."))), /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 18, background: "rgba(20,36,66,0.5)", border: `1px solid ${hiddenFlag ? "rgba(229,134,134,0.4)" : accent + "26"}`, padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: hiddenFlag ? "#E58686" : "#86E5A7", letterSpacing: "0.22em", textTransform: "uppercase" }
  }, hiddenFlag ? "\u25cf Hidden from the public site" : "\u25cf Visible on the public site"), /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: "rgba(232,228,220,0.6)", marginTop: 8, maxWidth: 440, lineHeight: 1.6 }
  }, "While hidden, the public page shows no partner button \u2014 use this between partners. The link above is kept safe for when you switch it back on.")), /*#__PURE__*/React.createElement("button", {
    onClick: toggleHidden,
    style: { background: hiddenFlag ? accent : "transparent", color: hiddenFlag ? "#0A1628" : "rgba(232,228,220,0.85)", border: hiddenFlag ? "none" : "1px solid rgba(232,228,220,0.35)", padding: "12px 26px", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, minWidth: 160 }
  }, hiddenFlag ? "Show button" : "Hide button")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.4)",
      lineHeight: 1.7
    }
  }, "Currently sending visitors to:", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: accent
    }
  }, stored || "\u2014 not set \u2014")));
};

// ============================================================
// PILLAR CONSOLE — shared shell (nav + tab bar) for single-pillar dashboards
// ============================================================
const PillarConsole = ({
  onExit,
  founderLabel,
  onLogout,
  onBack,
  tabs,
  tab,
  setTab
}) => {
  const current = tabs.find(t => t.id === tab) || tabs[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#0A1628"
    }
  }, /*#__PURE__*/React.createElement(PortalNav, {
    onExit: onExit,
    founderLabel: founderLabel,
    onLogout: onLogout
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "0 clamp(20px, 4vw, 56px)",
      flexWrap: "wrap",
      background: "rgba(10,22,40,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      position: "sticky",
      top: 73,
      zIndex: 25
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: "transparent",
      border: "1px solid rgba(232,228,220,0.2)",
      color: "rgba(232,228,220,0.7)",
      padding: "7px 12px",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      margin: "12px 8px 12px 0"
    }
  }, "\u2190 Pillars"), tabs.map(it => {
    const active = current.id === it.id;
    const accent = it.accent || "#C9A961";
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => setTab(it.id),
      style: {
        background: "transparent",
        border: "none",
        padding: "18px 18px",
        cursor: "pointer",
        color: active ? "#E8E4DC" : "rgba(232,228,220,0.55)",
        fontFamily: "'Manrope', sans-serif",
        fontSize: 13,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontWeight: active ? 500 : 400,
        borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, it.label, typeof it.count === "number" && /*#__PURE__*/React.createElement("span", {
      style: {
        background: active ? `${accent}28` : "rgba(232,228,220,0.08)",
        color: active ? accent : "rgba(232,228,220,0.55)",
        padding: "2px 8px",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, it.count));
  })), current.content);
};

// >>> FOUNDER DESK (generated from src/founder-desk.jsx — edit that file, then run scripts/build-founder-desk.py)
const FD = (() => {
  const { useState, useEffect, useMemo, useRef, useCallback } = React;
  const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const fdate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const fdatetime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };
  const rel = (iso) => {
    if (!iso) return "";
    const s = (Date.now() - new Date(iso).getTime()) / 1e3;
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    if (s < 86400 * 30) return Math.floor(s / 86400) + " d ago";
    return fdate(iso);
  };
  const titleCase = (s) => (s || "").toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  const ACR = /* @__PURE__ */ new Set(["UIN", "IAIN", "STAIN", "UNAND", "UNP", "UGM", "UI", "ITB", "ITS", "IPB", "UPI", "UNY", "UNS", "UB", "UNJ", "UPN", "SMA", "SMAN", "SMK", "SMKN", "MAN", "MAS", "MA", "MTS", "MTSN", "SMP", "SMPN", "PGRI", "STIE", "STKIP", "STIKES", "STMIK", "UMSB", "UNES", "USA", "UK", "UAE", "PT"]);
  const instCase = (s) => (s || "").split(/(\s+)/).map((w) => {
    const u = w.toUpperCase();
    return ACR.has(u.replace(/[^A-Z]/g, "")) && u.replace(/[^A-Z]/g, "").length === w.replace(/[^A-Za-z]/g, "").length && /^[A-Z0-9.\-]+$/.test(w) ? w : /\d/.test(w) || /^[A-Z]{2,5}$/.test(w) && !/[AEIOU]/.test(w) ? w : titleCase(w);
  }).join("");
  const fileUrl = (f) => {
    if (!f) return null;
    if (f.url) return f.url;
    const p = f.path || f.key;
    return p && window.brialSupabase ? window.brialSupabase.publicUrl(p) : null;
  };
  const isImage = (f) => !!f && (/^image\//i.test(f.type || "") || /\.(png|jpe?g|webp|gif)$/i.test(f.name || f.path || ""));
  const today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const plural = (n, one, many) => Number(n) === 1 ? one : many;
  const useNav = (key, init) => window.useBrialNav ? window.useBrialNav(key, init) : useState(init);
  const Img = ({ src, className, style, fallback = null }) => {
    const [bad, setBad] = useState(false);
    useEffect(() => {
      setBad(false);
    }, [src]);
    return bad ? fallback : /* @__PURE__ */ React.createElement("img", { key: src, className, style, src, alt: "", onError: () => setBad(true) });
  };
  const CSS = `
.fd{--bg:#0A1628;--side:#0B192F;--surface:#0F1E36;--raised:#132746;--line:rgba(239,233,220,.09);--line2:rgba(239,233,220,.16);--gilt:#C9A961;--gilt2:#E2C98E;--giltsoft:rgba(201,169,97,.13);--text:#EFE9DC;--muted:rgba(239,233,220,.66);--faint:rgba(239,233,220,.44);--sage:#8FD4A8;--amber:#E7B76A;--rose:#E58686;--sky:#8DB8E8;--accent:var(--gilt);
  min-height:100vh;background:var(--bg);color:var(--text);font-family:'Manrope',system-ui,sans-serif;font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased}
.fd *{box-sizing:border-box}
.fd button,.fd input,.fd select,.fd textarea{font-family:inherit}
.fd :focus-visible{outline:2px solid var(--gilt);outline-offset:2px;border-radius:6px}
.fd a{color:inherit}
/* top bar */
.fd-top{position:sticky;top:0;z-index:50;height:60px;display:flex;align-items:center;gap:14px;padding:0 20px;background:rgba(10,22,40,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.fd-brand{display:flex;align-items:center;gap:10px;font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;white-space:nowrap}
.fd-crumb{display:flex;align-items:center;gap:8px;color:var(--faint);font-size:13px;min-width:0}
.fd-crumb b{color:var(--text);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-crumb button{background:none;border:0;color:var(--muted);cursor:pointer;padding:4px 6px;border-radius:6px;font-size:13px}
.fd-crumb button:hover{color:var(--text);background:rgba(239,233,220,.05)}
.fd-top-r{margin-left:auto;display:flex;align-items:center;gap:10px}
.fd-email{font-size:12px;color:var(--faint);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* layout */
.fd-body{display:grid;grid-template-columns:232px minmax(0,1fr);min-height:calc(100vh - 60px)}
.fd-side{position:sticky;top:60px;height:calc(100vh - 60px);overflow:auto;background:var(--side);border-right:1px solid var(--line);padding:18px 12px;display:flex;flex-direction:column;gap:2px}
.fd-pillar{display:flex;align-items:center;gap:10px;padding:6px 10px 16px;margin-bottom:8px;border-bottom:1px solid var(--line)}
.fd-pillar-ic{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;border:1px solid var(--accent);color:var(--accent);flex-shrink:0}
.fd-pillar b{display:block;font-weight:600;font-size:14px;line-height:1.2}
.fd-pillar small{display:block;font-size:12px;color:var(--faint)}
.fd-nav{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border-radius:9px;border:0;background:none;color:var(--muted);font-size:14px;font-weight:500;cursor:pointer;text-align:left;transition:background .15s,color .15s}
.fd-nav:hover{background:rgba(239,233,220,.04);color:var(--text)}
.fd-nav[aria-current=page]{background:var(--giltsoft);color:var(--text)}
.fd-nav[aria-current=page] .fd-nav-ic{color:var(--gilt2)}
.fd-nav-ic{display:flex;color:var(--faint)}
.fd-count{margin-left:auto;min-width:22px;height:20px;padding:0 6px;border-radius:10px;font-size:11px;font-weight:700;line-height:20px;text-align:center;background:rgba(239,233,220,.08);color:var(--muted)}
.fd-count.hot{background:var(--gilt);color:#0A1628}
.fd-side-foot{margin-top:auto;padding:14px 10px 4px;border-top:1px solid var(--line);font-size:12px;color:var(--faint)}
.fd-main{min-width:0;padding:30px clamp(18px,3vw,40px) 120px;max-width:1240px}
/* page head */
.fd-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:22px}
.fd-h1{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(28px,3.2vw,36px);line-height:1.1;margin:0;font-variant-numeric:lining-nums}
.fd-lede{color:var(--muted);margin:6px 0 0;max-width:68ch}
.fd-h2{font-size:15px;font-weight:600;margin:0}
.fd-h3{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:24px;margin:0;line-height:1.15;font-variant-numeric:lining-nums}
.fd-sub{color:var(--muted);font-size:13px;margin:4px 0 0}
/* stats */
.fd-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden;margin-bottom:22px}
.fd-stat{padding:16px 20px;border-right:1px solid var(--line)}
.fd-stat:last-child{border-right:0}
.fd-stat span{display:block;font-size:12px;color:var(--muted)}
.fd-stat b{display:block;font-family:'Cormorant Garamond',serif;font-weight:500;font-size:30px;line-height:1.15;margin-top:4px;font-variant-numeric:lining-nums tabular-nums}
.fd-stat small{display:block;font-size:12px;color:var(--faint)}
.fd-stat.warn b{color:var(--amber)}.fd-stat.ok b{color:var(--sage)}
/* cards */
.fd-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px 22px}
.fd-card+.fd-card{margin-top:16px}
.fd-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.fd-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fd-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
/* buttons */
.fd-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:9px;padding:9px 15px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent;white-space:nowrap;transition:background .15s,border-color .15s,color .15s;text-decoration:none;line-height:1.2}
.fd-btn.primary{background:var(--gilt);color:#0A1628}.fd-btn.primary:hover{background:var(--gilt2)}
.fd-btn.ghost{background:transparent;color:var(--text);border-color:var(--line2)}.fd-btn.ghost:hover{border-color:rgba(201,169,97,.6)}
.fd-btn.quiet{background:transparent;color:var(--muted);padding:7px 10px}.fd-btn.quiet:hover{color:var(--text);background:rgba(239,233,220,.05)}
.fd-btn.danger{background:transparent;color:var(--rose);border-color:rgba(229,134,134,.35)}.fd-btn.danger:hover{background:rgba(229,134,134,.08)}
.fd-btn.danger.armed{background:var(--rose);color:#0A1628;border-color:var(--rose)}
.fd-btn.ok.armed{background:var(--sage);color:#0A1628;border-color:var(--sage)}
.fd-btn.ok{background:rgba(143,212,168,.12);color:var(--sage);border-color:rgba(143,212,168,.4)}
.fd-btn.sm{padding:6px 11px;font-size:12px;border-radius:8px}
.fd-btn[disabled]{opacity:.45;cursor:not-allowed}
.fd-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
/* tags */
.fd-tag{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;white-space:nowrap;background:rgba(239,233,220,.07);color:var(--muted)}
.fd-tag i{width:6px;height:6px;border-radius:50%;background:currentColor}
.fd-tag.ok{background:rgba(143,212,168,.11);color:var(--sage)}
.fd-tag.warn{background:rgba(231,183,106,.12);color:var(--amber)}
.fd-tag.bad{background:rgba(229,134,134,.12);color:var(--rose)}
.fd-tag.gold{background:var(--giltsoft);color:var(--gilt2)}
.fd-tag.sky{background:rgba(141,184,232,.12);color:var(--sky)}
/* toolbar */
.fd-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.fd-seg{display:flex;gap:6px;flex-wrap:wrap}
.fd-chip{display:inline-flex;align-items:center;gap:7px;background:transparent;border:1px solid var(--line2);color:var(--muted);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:500;cursor:pointer}
.fd-chip em{font-style:normal;font-size:11px;font-weight:700;color:var(--faint)}
.fd-chip[aria-pressed=true]{background:var(--giltsoft);border-color:rgba(201,169,97,.55);color:var(--text)}
.fd-chip[aria-pressed=true] em{color:var(--gilt2)}
.fd-search{position:relative;flex:1 1 240px;max-width:380px}
.fd-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--faint)}
.fd-search input{padding-left:36px}
/* forms */
.fd-field{display:block;min-width:0}
.fd-field>span{display:block;font-size:12.5px;color:var(--muted);margin-bottom:6px;font-weight:500}
.fd-field small{display:block;font-size:12px;color:var(--faint);margin-top:5px}
.fd-input{width:100%;background:rgba(10,22,40,.6);border:1px solid var(--line2);border-radius:9px;color:var(--text);font-size:14px;padding:10px 12px;transition:border-color .15s}
.fd-input:focus{outline:none;border-color:var(--gilt)}
.fd-input::placeholder{color:rgba(239,233,220,.3)}
textarea.fd-input{min-height:110px;resize:vertical;line-height:1.6}
select.fd-input{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--gilt) 50%),linear-gradient(135deg,var(--gilt) 50%,transparent 50%);background-position:calc(100% - 18px) 52%,calc(100% - 13px) 52%;background-size:5px 5px;background-repeat:no-repeat;padding-right:34px}
select.fd-input option{background:#0A1628}
input[type=date].fd-input,input[type=time].fd-input{color-scheme:dark}
.fd-form{display:grid;gap:14px}
.fd-money{position:relative}.fd-money::before{content:"$";position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--gilt2);font-weight:600}.fd-money .fd-input{padding-left:26px}
.fd-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;color:var(--muted);background:none;border:0;padding:0}
.fd-switch i{position:relative;width:36px;height:20px;border-radius:10px;background:rgba(239,233,220,.15);transition:background .2s;flex-shrink:0}
.fd-switch i::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#EFE9DC;transition:transform .2s}
.fd-switch[aria-checked=true] i{background:var(--sage)}
.fd-switch[aria-checked=true] i::after{transform:translateX(16px)}
.fd-msg{font-size:13px;padding:9px 12px;border-radius:9px}
.fd-msg.ok{color:var(--sage);background:rgba(143,212,168,.08);border:1px solid rgba(143,212,168,.3)}
.fd-msg.err{color:#F2A7A7;background:rgba(229,134,134,.08);border:1px solid rgba(229,134,134,.3)}
.fd-msg.info{color:var(--muted);background:rgba(239,233,220,.04);border:1px solid var(--line)}
/* table */
.fd-table{border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden}
.fd-tr{display:grid;gap:14px;align-items:center;padding:13px 18px;border-top:1px solid var(--line)}
.fd-tr:first-child{border-top:0}
.fd-th{font-size:12px;color:var(--faint);font-weight:600;background:rgba(239,233,220,.025)}
.fd-tr.dim{opacity:.55}
.fd-td{min-width:0}
.fd-td b{display:block;font-weight:600;overflow-wrap:anywhere}
.fd-td small{display:block;font-size:12px;color:var(--faint);overflow-wrap:anywhere}
.fd-td .num{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:500;font-variant-numeric:lining-nums tabular-nums;color:var(--gilt2)}
.fd-td[data-l]::before{display:none}
.fd-mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:var(--muted);overflow-wrap:anywhere}
.fd-empty{padding:42px 20px;text-align:center;color:var(--faint)}
.fd-empty b{display:block;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--muted);margin-bottom:4px}
/* master-detail */
.fd-md{display:grid;grid-template-columns:340px minmax(0,1fr);gap:18px;align-items:start}
.fd-list{border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden;position:sticky;top:76px;max-height:calc(100vh - 96px);overflow-y:auto}
.fd-li{display:block;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--line);padding:13px 16px;color:var(--text);cursor:pointer;transition:background .15s}
.fd-li:first-child{border-top:0}
.fd-li:hover{background:rgba(239,233,220,.03)}
.fd-li[aria-current=true]{background:var(--giltsoft);box-shadow:inset 3px 0 0 var(--gilt)}
.fd-li-top{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.fd-li b{font-weight:600}
.fd-li small{display:block;color:var(--faint);font-size:12px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fd-li-bot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px}
.fd-back{display:none}
/* detail */
.fd-dhead{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
.fd-avatar{width:56px;height:70px;border-radius:10px;object-fit:cover;object-position:50% 25%;border:1px solid rgba(201,169,97,.45);background:#0A1628;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:26px;color:var(--gilt);flex-shrink:0}
.fd-dl{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px 22px;margin:0}
.fd-dl dt{font-size:12px;color:var(--faint)}
.fd-dl dd{margin:2px 0 0;font-weight:500;overflow-wrap:anywhere}
.fd-dl dd.none{color:var(--faint);font-weight:400}
.fd-dl .wide{grid-column:1/-1}
.fd-stage{border:1px solid rgba(201,169,97,.32);background:linear-gradient(160deg,#122646,#0F1E36 70%);border-radius:14px;padding:18px 20px}
.fd-stage-k{font-size:12px;font-weight:600;color:var(--gilt2)}
.fd-details{border:1px solid var(--line);border-radius:14px;background:var(--surface);margin-top:16px}
.fd-details>summary{list-style:none;cursor:pointer;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;font-weight:600}
.fd-details>summary::-webkit-details-marker{display:none}
.fd-details>summary::after{content:"";width:8px;height:8px;border-right:1.5px solid var(--gilt);border-bottom:1.5px solid var(--gilt);transform:rotate(45deg);transition:transform .2s;margin-right:4px}
.fd-details[open]>summary::after{transform:rotate(225deg)}
.fd-details>div{padding:0 20px 20px}
.fd-file{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--line)}
.fd-file:first-child{border-top:0}
/* modal */
.fd-scrim{position:fixed;inset:0;z-index:300;background:rgba(5,11,22,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:18px;animation:fdFade .18s ease-out}
.fd-modal{width:100%;max-width:560px;max-height:calc(100vh - 36px);overflow:auto;background:#10213D;border:1px solid rgba(201,169,97,.3);border-radius:16px;padding:24px 24px 22px;box-shadow:0 40px 100px -30px rgba(0,0,0,.9);animation:fdRise .25s cubic-bezier(.22,1,.36,1) both}
.fd-modal.wide{max-width:760px}
.fd-modal-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:16px}
.fd-x{background:none;border:1px solid var(--line2);color:var(--muted);width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:17px;line-height:1;flex-shrink:0}
.fd-sec-setup{}@media (max-width:640px){.fd-sec-setup{grid-template-columns:1fr!important}}
.fd-savebar{position:sticky;bottom:16px;z-index:20;margin-top:22px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 16px;border-radius:12px;background:#132746;border:1px solid rgba(201,169,97,.4);box-shadow:0 18px 50px -20px rgba(0,0,0,.9)}
.fd-thumb{width:84px;height:60px;border-radius:8px;object-fit:cover;border:1px solid var(--line2);background:#0A1628}
.fd-cover{width:64px;height:88px;border-radius:6px;object-fit:cover;border:1px solid var(--line2);background:#0A1628;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--faint);font-size:11px}
.fd-upload{position:relative;display:inline-flex}
.fd-upload input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}
.fd-qr{background:#F8F4EB;padding:6px;border-radius:6px;line-height:0;display:inline-block}
@keyframes fdRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes fdFade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.fd *{animation:none!important;transition:none!important}}
@media (max-width:1100px){.fd-md{grid-template-columns:290px minmax(0,1fr)}}
/* treasury */
.fd-attn{display:grid;gap:10px;margin:-6px 0 22px}
.fd-attn-i{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;background:rgba(231,183,106,.07);border:1px solid rgba(231,183,106,.25)}
.fd-attn-i>div{flex:1;min-width:0}.fd-attn-i b{display:block;font-weight:600}.fd-attn-i small{color:var(--muted);font-size:13px}
.fd-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:var(--faint)}.fd-dot.warn{background:var(--amber)}
.fd-tgrid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:16px;align-items:stretch}
.fd-tgrid .fd-card+.fd-card{margin-top:0}
.fd-ch-legend{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:var(--muted);margin-bottom:14px}
.fd-ch-legend span{display:inline-flex;align-items:center;gap:7px}.fd-ch-legend b{color:var(--text);font-weight:600}
.fd-ch-legend i,.fd-ch-tip i{width:10px;height:10px;border-radius:3px;display:inline-block}
.fd-ch-plot{position:relative;height:210px;margin:8px 0 26px 44px}
.fd-ch-grid{position:absolute;left:0;right:0;border-top:1px solid var(--line)}
.fd-ch-grid span{position:absolute;right:100%;margin-right:8px;transform:translateY(-50%);font-size:11px;color:var(--faint);white-space:nowrap;font-variant-numeric:tabular-nums}
.fd-ch-cols{position:absolute;inset:0;display:flex}
.fd-ch-col{flex:1;position:relative;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;outline:none;cursor:default}
.fd-ch-col.on{background:rgba(239,233,220,.04)}
.fd-ch-col:focus-visible{box-shadow:inset 0 0 0 2px var(--gilt);border-radius:6px}
.fd-ch-bars{height:100%;width:100%;display:flex;align-items:flex-end;justify-content:center;gap:2px}
.fd-ch-bars i{width:min(12px,32%);border-radius:4px 4px 0 0;display:block}
.fd-ch-x{position:absolute;top:100%;margin-top:7px;font-size:11px;color:var(--faint)}
.fd-ch-tip{position:absolute;bottom:calc(100% - 30px);left:50%;transform:translate(-50%,-100%);z-index:5;min-width:150px;padding:10px 12px;border-radius:10px;background:#1A2F52;border:1px solid var(--line2);box-shadow:0 14px 34px -14px rgba(0,0,0,.9);font-size:12.5px;pointer-events:none}
.fd-ch-tip b{display:block;font-weight:600;margin-bottom:6px}
.fd-ch-tip div{display:flex;align-items:center;gap:7px;color:var(--muted)}.fd-ch-tip span{margin-left:auto;color:var(--text);font-variant-numeric:tabular-nums;padding-left:12px}
.fd-ch-col:first-child .fd-ch-tip{left:0;transform:translate(0,-100%)}.fd-ch-col:last-child .fd-ch-tip{left:auto;right:0;transform:translate(0,-100%)}
.fd-bars{display:grid;gap:16px}
.fd-bar-t{display:flex;justify-content:space-between;gap:10px;font-size:13.5px}.fd-bar-t b{font-weight:600;font-variant-numeric:tabular-nums}
.fd-bar-track{height:8px;border-radius:4px;background:rgba(239,233,220,.06);margin:7px 0 4px;overflow:hidden}
.fd-bar-track i{display:block;height:100%;border-radius:4px}
.fd-bar small{font-size:12px;color:var(--faint)}
.fd-amt{text-align:right}
.fd-td .num.in{color:#5FD3A6}.fd-td .num.out{color:var(--text)}
.fd-tfoot{background:rgba(239,233,220,.03)}
.fd-totals{display:flex;justify-content:flex-end;gap:28px;flex-wrap:wrap;margin-top:14px;padding:14px 18px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.fd-totals span{display:block;font-size:12px;color:var(--muted)}
.fd-totals b{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;font-variant-numeric:lining-nums tabular-nums}
.fd-totals b.in{color:#5FD3A6}
.fd-chans{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.fd-chans .fd-card+.fd-card{margin-top:0}
@media (max-width:1100px){.fd-tgrid{grid-template-columns:1fr}}
@media (max-width:900px){.fd-ch-plot{margin-left:36px;height:180px}.fd-ch-x{font-size:10px}.fd-amt{text-align:left}.fd-totals{justify-content:space-between}}
/* founder home (chooser) */
.fdh{--line:rgba(239,233,220,.09);--line2:rgba(239,233,220,.16);--gilt:#C9A961;--gilt2:#E2C98E;--text:#EFE9DC;--muted:rgba(239,233,220,.62);max-width:1000px;margin:0 auto;padding:72px clamp(20px,4vw,56px) 100px;font-family:'Manrope',system-ui,sans-serif;color:var(--text)}
.fdh-k{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--gilt);letter-spacing:.28em;text-transform:uppercase}
.fdh-tabs{position:relative;display:inline-grid;grid-template-columns:1fr 1fr;margin:18px 0 26px;padding:4px;border-radius:999px;border:1px solid var(--line2);background:rgba(20,36,66,.55)}
.fdh-tab{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:none;border:0;color:var(--muted);font-family:inherit;font-size:14px;font-weight:600;padding:10px 22px;border-radius:999px;cursor:pointer;transition:color .2s;white-space:nowrap}
.fdh-tab em{font-style:normal;font-size:11px;font-weight:700;opacity:.7}
.fdh-tab[aria-selected=true]{color:#0A1628}
.fdh-tab:focus-visible{outline:2px solid var(--gilt);outline-offset:2px}
.fdh-ink{position:absolute;top:4px;bottom:4px;left:4px;width:calc(50% - 4px);border-radius:999px;background:var(--gilt);transition:transform .35s cubic-bezier(.2,.7,.2,1)}
.fdh-h1{font-family:'Cormorant Garamond',serif;font-size:clamp(36px,5vw,60px);font-weight:400;letter-spacing:-.02em;margin:0 0 10px;line-height:1.05}
.fdh-lede{font-size:16px;font-weight:300;color:var(--muted);margin:0 0 36px;max-width:600px}
.fdh-track{display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch;align-items:flex-start;transition:height .3s ease;overscroll-behavior-x:contain}
.fdh-track::-webkit-scrollbar{display:none}
.fdh-panel{flex:0 0 100%;min-width:0;scroll-snap-align:start;scroll-snap-stop:always}
.fdh-hint{display:none;margin:18px 0 0;font-size:12px;color:var(--muted);text-align:center}
@media (hover:none){.fdh-hint{display:block}}
@media (max-width:560px){.fdh{padding-top:40px}.fdh-tabs{display:grid;width:100%}.fdh-tab{padding:10px 8px;font-size:13.5px}}
@media (prefers-reduced-motion:reduce){.fdh-ink,.fdh-track{transition:none}}
.pn-exit{white-space:nowrap}
@media (max-width:640px){.pn{padding:12px 16px!important;gap:10px!important}.pn-sub,.pn-email,.pn-avatar{display:none!important}.pn-exit{padding:8px 10px!important;letter-spacing:.08em!important}}
/* movement rows on a phone: name + amount on one line */
@media (max-width:900px){
  .fd-mv{grid-template-columns:minmax(0,1fr) auto!important;gap:4px 14px!important}
  .fd-mv .fd-td[data-l]::before{display:none}
  .fd-mv>.fd-td:nth-child(1){grid-column:1;grid-row:1}
  .fd-mv>.fd-td:nth-child(4){grid-column:2;grid-row:1;text-align:right}
  .fd-mv>.fd-td:nth-child(2){grid-column:1;grid-row:2;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}
  .fd-mv>.fd-td:nth-child(3){grid-column:2;grid-row:2;text-align:right;font-size:12.5px;color:var(--muted)}
  .fd-mv>.fd-td:nth-child(3) small{display:none}
}
/* site settings */
.fd-site{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start}
.fd-site .fd-card+.fd-card{margin-top:16px}
.fd-site-prev{position:sticky;top:84px}
.fd-crow{display:grid;grid-template-columns:150px minmax(0,1fr) auto;gap:12px 16px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}
.fd-crow:first-of-type{border-top:0}
.fd-crow-l{display:flex;align-items:center;gap:10px;min-width:0}
.fd-crow-l b{font-weight:600;font-size:14px}
.fd-crow-ic{display:flex;color:var(--gilt2);flex-shrink:0}
.fd-crow-v{min-width:0}
.fd-crow-a{display:flex;align-items:center;gap:6px;justify-content:flex-end}
.fd-crow-gap{display:inline-block;width:58px}
.fd-bad{display:block;color:var(--rose);font-size:12px;margin-top:5px}
.fd-prev{margin-top:14px;padding:18px;border-radius:12px;background:#060E1C;border:1px solid var(--line)}
.fd-prev-brand{display:flex;align-items:center;gap:10px;font-family:'Cormorant Garamond',serif;font-size:18px}
.fd-prev p{font-size:12px;color:var(--faint);margin:10px 0 0;line-height:1.6}
.fd-prev-line{display:flex;gap:9px;align-items:flex-start;margin-top:10px;font-size:13px;color:var(--muted);overflow-wrap:anywhere}
.fd-prev-line svg{color:var(--gilt);flex-shrink:0;margin-top:2px}
.fd-prev-icons{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.fd-prev-icons span{width:32px;height:32px;border-radius:50%;border:1px solid rgba(201,169,97,.35);color:var(--gilt);display:inline-flex;align-items:center;justify-content:center}
@media (max-width:1100px){.fd-site{grid-template-columns:1fr}.fd-site-prev{position:static}}
@media (max-width:640px){.fd-crow{grid-template-columns:1fr;gap:8px}.fd-crow-a{justify-content:space-between}}
/* email */
.fd-rc{display:block;text-align:right;font-size:12px;color:var(--faint);margin-top:6px}
.fd-rc.ok{color:var(--sage)}.fd-rc.warn{color:var(--amber)}.fd-rc.bad{color:var(--rose)}
.fd-mail{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;align-items:start}
.fd-mail .fd-card+.fd-card{margin-top:16px}
.fd-mstat{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
.fd-mstat h2{margin:6px 0 4px}
.fd-krow{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-top:1px solid var(--line)}
.fd-krow:first-of-type{border-top:0}
.fd-krow b{display:block;font-weight:600;font-size:14px}
.fd-krow small{display:block;color:var(--faint);font-size:12px;margin-top:2px}
.fd-mlog{display:flex;flex-direction:column}
.fd-mlog-i{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;padding:11px 0;border-top:1px solid var(--line)}
.fd-mlog-i:first-child{border-top:0}
.fd-mlog-i b{font-weight:600;font-size:13px;overflow-wrap:anywhere}
.fd-mlog-i small{font-size:12px;color:var(--faint);overflow-wrap:anywhere}
.fd-mlog-i .fd-tag{justify-self:end}
.fd-mprev{width:100%;height:560px;border:0;border-radius:10px;background:#F5F2EA}
@media (max-width:1100px){.fd-mail{grid-template-columns:1fr}}
.fd-mvis{display:none}
@media (max-width:900px){
  .fd-mvis{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:28px}
  .fd-body{grid-template-columns:1fr}
  .fd-side{position:sticky;top:56px;z-index:40;height:auto;flex-direction:row;overflow-x:auto;padding:8px 10px;gap:6px;border-right:0;border-bottom:1px solid var(--line);scrollbar-width:none}
  .fd-side::-webkit-scrollbar{display:none}
  .fd-pillar,.fd-side-foot{display:none}
  .fd-nav{width:auto;flex-shrink:0;padding:8px 12px}
  .fd-top{height:56px;padding:0 14px}
  .fd-email,.fd-brand span{display:none}
  .fd-main{padding:22px 14px 120px}
  .fd-md{grid-template-columns:1fr}
  .fd-list{position:static;max-height:none}
  .fd-md.has-sel .fd-list,.fd-tools.has-sel{display:none}
  .fd-md:not(.has-sel) .fd-detail{display:none}
  .fd-back{display:inline-flex;margin-bottom:12px}
  .fd-grid2,.fd-grid3{grid-template-columns:1fr}
  .fd-th{display:none}
  .fd-tr{grid-template-columns:1fr 1fr!important;gap:10px 14px;padding:14px 16px}
  .fd-tr .fd-td.full{grid-column:1/-1}
  .fd-td[data-l]::before{content:attr(data-l);display:block;font-size:11px;color:var(--faint);margin-bottom:2px}
  .fd-stat{border-right:0;border-bottom:1px solid var(--line)}
  .fd-stats{grid-template-columns:1fr 1fr}
  .fd-stat:nth-child(odd){border-right:1px solid var(--line)}
  .fd-modal{padding:20px 18px}
  .fd-savebar{bottom:10px}
}
`;
  function useStyles() {
    useEffect(() => {
      if (document.getElementById("fd-css")) return;
      const s = document.createElement("style");
      s.id = "fd-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }, []);
  }
  const I = (d, s = 18) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, d);
  const ICON = {
    inbox: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 13h5l1.5 3h5L16 13h5" }), /* @__PURE__ */ React.createElement("path", { d: "M5 5h14l2 8v6H3v-6z" }))),
    pay: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "6", width: "18", height: "13", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M3 10h18M7 15h3" }))),
    cap: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M2 9l10-5 10 5-10 5z" }), /* @__PURE__ */ React.createElement("path", { d: "M6 11v5c3 2 9 2 12 0v-5" }))),
    gift: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "9", width: "18", height: "12", rx: "1" }), /* @__PURE__ */ React.createElement("path", { d: "M3 13h18M12 9v12M12 9C9 9 7 7 8.5 5.5S12 6 12 9zm0 0c3 0 5-2 3.5-3.5S12 6 12 9z" }))),
    help: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4 5h16v11H9l-5 4z" }), /* @__PURE__ */ React.createElement("path", { d: "M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.7-.9 1.2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 14.5h.01" }))),
    users: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "8", r: "3.2" }), /* @__PURE__ */ React.createElement("path", { d: "M3 20c.6-3.3 3-5 6-5s5.4 1.7 6 5" }), /* @__PURE__ */ React.createElement("circle", { cx: "17", cy: "9", r: "2.4" }), /* @__PURE__ */ React.createElement("path", { d: "M16 14.5c2.5 0 4.4 1.6 5 4.5" }))),
    grant: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4 20V10M10 20V6M16 20v-8M22 20H2" }))),
    story: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M5 4h11l3 3v13H5z" }), /* @__PURE__ */ React.createElement("path", { d: "M9 10h6M9 14h6M9 18h3" }))),
    link: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" }), /* @__PURE__ */ React.createElement("path", { d: "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" }))),
    contact: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "5.5", width: "18", height: "13", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M3.5 7l8.5 6 8.5-6" }))),
    send: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M21 3 10 14" }), /* @__PURE__ */ React.createElement("path", { d: "M21 3l-6.5 18-4-8-8-4z" }))),
    pdf: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M6 3h9l4 4v14H6z" }), /* @__PURE__ */ React.createElement("path", { d: "M14 3v5h5M9 13h6M9 17h4" })), 14),
    treasury: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 9l9-5 9 5" }), /* @__PURE__ */ React.createElement("path", { d: "M5 9v9M10 9v9M14 9v9M19 9v9M3 20h18" }))),
    overview: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3.5", y: "3.5", width: "7", height: "7", rx: "1.5" }), /* @__PURE__ */ React.createElement("rect", { x: "13.5", y: "3.5", width: "7", height: "7", rx: "1.5" }), /* @__PURE__ */ React.createElement("rect", { x: "3.5", y: "13.5", width: "7", height: "7", rx: "1.5" }), /* @__PURE__ */ React.createElement("rect", { x: "13.5", y: "13.5", width: "7", height: "7", rx: "1.5" }))),
    inflow: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 4v11M7 10l5 5 5-5" }), /* @__PURE__ */ React.createElement("path", { d: "M4 19h16" }))),
    outflow: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 15V4M7 9l5-5 5 5" }), /* @__PURE__ */ React.createElement("path", { d: "M4 19h16" }))),
    ledger: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M5 3.5h14v17H5z" }), /* @__PURE__ */ React.createElement("path", { d: "M8.5 8h7M8.5 12h7M8.5 16h4" }))),
    report: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M6 3.5h9l3.5 3.5v13.5H6z" }), /* @__PURE__ */ React.createElement("path", { d: "M9.5 17v-3M12.5 17v-6M15.5 17v-4.5" }))),
    shield: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" }), /* @__PURE__ */ React.createElement("path", { d: "M9 12l2.2 2.2L15.5 10" }))),
    site: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" }))),
    book: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 6v14" }))),
    sale: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 12l9-9h8v8l-9 9z" }), /* @__PURE__ */ React.createElement("circle", { cx: "15.5", cy: "8.5", r: "1.4" }))),
    search: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "6.5" }), /* @__PURE__ */ React.createElement("path", { d: "M16 16l4.5 4.5" })), 16),
    up: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 16V4M7 9l5-5 5 5M5 20h14" })), 16),
    ext: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" })), 14),
    star: /* @__PURE__ */ React.createElement("svg", { width: "26", height: "26", viewBox: "0 0 36 36", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("g", { fill: "none", stroke: "#C9A961", strokeWidth: "1.2" }, /* @__PURE__ */ React.createElement("path", { d: "M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "18", r: "4", fill: "#C9A961", stroke: "none" }))),
    worship: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 3c-2 2-4 3.5-4 6h8c0-2.5-2-4-4-6z" }), /* @__PURE__ */ React.createElement("path", { d: "M6 21V12h12v9M10 21v-4h4v4M4 21h16" }))),
    library: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 6v14" }))),
    foodland: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 21v-9" }), /* @__PURE__ */ React.createElement("path", { d: "M12 12c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5z" }))),
    water: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 3c3.5 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 2.5-6.5 6-11z" }))),
    hospitals: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 8v8M8 12h8" }))),
    schools: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 10l9-6 9 6" }), /* @__PURE__ */ React.createElement("path", { d: "M5 9.5V20h14V9.5M10 20v-5h4v5" }))),
    livestock: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M6 8c-2 0-3-2-3-3 2 0 4 1 4 2M18 8c2 0 3-2 3-3-2 0-4 1-4 2" }), /* @__PURE__ */ React.createElement("path", { d: "M7 8h10l-1 7a4 4 0 0 1-8 0z" }), /* @__PURE__ */ React.createElement("path", { d: "M10 13h.01M14 13h.01" }))),
    infra: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M2 18h20M4 18c2-6 14-6 16 0M8 18v-4M12 18v-5M16 18v-4" }))),
    scholarships: I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M2 9l10-5 10 5-10 5z" }), /* @__PURE__ */ React.createElement("path", { d: "M6 11v5c3 2 9 2 12 0v-5" })))
  };
  ICON.transport = I(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 15v-3l2.5-4.5A2 2 0 0 1 7.3 6.5h9.4a2 2 0 0 1 1.8 1L21 12v3z" }), /* @__PURE__ */ React.createElement("path", { d: "M5 12h14" }), /* @__PURE__ */ React.createElement("circle", { cx: "7.5", cy: "16.5", r: "2" }), /* @__PURE__ */ React.createElement("circle", { cx: "16.5", cy: "16.5", r: "2" })));
  ICON.email = ICON.contact;
  ICON.security = ICON.shield;
  ICON.impact = ICON.report;
  function Modal({ title, sub, onClose, wide, children }) {
    useEffect(() => {
      const k = (e) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", k);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", k);
        document.body.style.overflow = prev;
      };
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "fd-scrim", onMouseDown: (e) => {
      if (e.target === e.currentTarget) onClose();
    } }, /* @__PURE__ */ React.createElement("div", { className: "fd-modal" + (wide ? " wide" : ""), role: "dialog", "aria-modal": "true", "aria-label": title }, /* @__PURE__ */ React.createElement("div", { className: "fd-modal-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h3" }, title), sub && /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, sub)), /* @__PURE__ */ React.createElement("button", { className: "fd-x", onClick: onClose, "aria-label": "Close" }, "×")), children));
  }
  function Confirm({ onConfirm, children, armedLabel = "Click again to confirm", className = "fd-btn danger sm", disabled }) {
    const [armed, setArmed] = useState(false);
    useEffect(() => {
      if (!armed) return;
      const t = setTimeout(() => setArmed(false), 3500);
      return () => clearTimeout(t);
    }, [armed]);
    return /* @__PURE__ */ React.createElement("button", { className: className + (armed ? " armed" : ""), disabled, onClick: (e) => {
      e.stopPropagation();
      if (armed) {
        setArmed(false);
        onConfirm();
      } else setArmed(true);
    } }, armed ? armedLabel : children);
  }
  const Field = ({ label, hint, children, style }) => /* @__PURE__ */ React.createElement("label", { className: "fd-field", style }, /* @__PURE__ */ React.createElement("span", null, label), children, hint && /* @__PURE__ */ React.createElement("small", null, hint));
  const Tag = ({ tone, dot, children }) => /* @__PURE__ */ React.createElement("span", { className: "fd-tag " + (tone || "") }, dot && /* @__PURE__ */ React.createElement("i", null), children);
  function Seg({ items, value, onChange }) {
    return /* @__PURE__ */ React.createElement("div", { className: "fd-seg", role: "group" }, items.map(([id, label, count]) => /* @__PURE__ */ React.createElement("button", { key: id, className: "fd-chip", "aria-pressed": value === id, onClick: () => onChange(id) }, label, typeof count === "number" && /* @__PURE__ */ React.createElement("em", null, count))));
  }
  const Search = ({ value, onChange, placeholder }) => /* @__PURE__ */ React.createElement("div", { className: "fd-search" }, ICON.search, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value, onChange: (e) => onChange(e.target.value), placeholder, "aria-label": placeholder }));
  const Stats = ({ items }) => /* @__PURE__ */ React.createElement("div", { className: "fd-stats" }, items.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "fd-stat " + (s.tone || "") }, /* @__PURE__ */ React.createElement("span", null, s.label), /* @__PURE__ */ React.createElement("b", null, s.value), s.sub && /* @__PURE__ */ React.createElement("small", null, s.sub))));
  const Empty = ({ title, children }) => /* @__PURE__ */ React.createElement("div", { className: "fd-empty" }, /* @__PURE__ */ React.createElement("b", null, title), children);
  const Switch = ({ on, onChange, children }) => /* @__PURE__ */ React.createElement("button", { className: "fd-switch", role: "switch", "aria-checked": !!on, onClick: () => onChange(!on) }, /* @__PURE__ */ React.createElement("i", null), children);
  function useFlash() {
    const [m, setM] = useState(null);
    const t = useRef(0);
    const flash = (text, tone = "ok") => {
      setM({ text, tone });
      clearTimeout(t.current);
      t.current = setTimeout(() => setM(null), 2600);
    };
    return [m, flash];
  }
  const Flash = ({ m }) => m ? /* @__PURE__ */ React.createElement("div", { className: "fd-msg " + m.tone, role: "status" }, m.text) : null;
  const FileBtn = ({ file, label = "Open" }) => file ? /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => window.BrialFiles.open(file) }, label) : null;
  const copy = (t) => window.BrialClipboard && window.BrialClipboard.copy(t);
  function PhotoUpload({ onUploaded, children, accept = "image/png,image/jpeg,image/webp" }) {
    const [busy, setBusy] = useState(false);
    const pick = async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      const v = window.BrialFiles.validate(f);
      if (!v.ok) {
        alert(v.error);
        return;
      }
      if (!/^image\//i.test(f.type || "")) {
        alert("Please choose an image (JPG, PNG or WebP).");
        return;
      }
      setBusy(true);
      try {
        const meta = await window.BrialFiles.put(f, { public: true });
        onUploaded(meta);
      } catch (x) {
        alert("Upload failed: " + (x.message || x));
      } finally {
        setBusy(false);
      }
    };
    return /* @__PURE__ */ React.createElement("span", { className: "fd-upload" }, /* @__PURE__ */ React.createElement("span", { className: "fd-btn ghost sm" }, ICON.up, busy ? "Uploading…" : children), /* @__PURE__ */ React.createElement("input", { type: "file", accept, onChange: pick, disabled: busy, "aria-label": children }));
  }
  function Shell({ store, pillarKey, meta, nav, active, onNav, onBack, onExit, founderEmail, onLogout, children, noVisibility }) {
    const visible = store.getPillarActive ? store.getPillarActive(pillarKey) : true;
    return /* @__PURE__ */ React.createElement("div", { className: "fd", style: { "--accent": meta.accent } }, /* @__PURE__ */ React.createElement("header", { className: "fd-top" }, /* @__PURE__ */ React.createElement("div", { className: "fd-brand" }, ICON.star, /* @__PURE__ */ React.createElement("span", null, "Founder Portal")), /* @__PURE__ */ React.createElement("nav", { className: "fd-crumb", "aria-label": "Breadcrumb" }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "/"), /* @__PURE__ */ React.createElement("button", { onClick: onBack }, "Pillars"), /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "/"), /* @__PURE__ */ React.createElement("b", null, meta.name)), /* @__PURE__ */ React.createElement("div", { className: "fd-top-r" }, /* @__PURE__ */ React.createElement("span", { className: "fd-email" }, founderEmail), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: onExit }, "Public site"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: onLogout }, "Sign out"))), /* @__PURE__ */ React.createElement("div", { className: "fd-body" }, /* @__PURE__ */ React.createElement("aside", { className: "fd-side", "aria-label": meta.name + " sections" }, /* @__PURE__ */ React.createElement("div", { className: "fd-pillar" }, /* @__PURE__ */ React.createElement("div", { className: "fd-pillar-ic" }, ICON[pillarKey] || ICON.grant), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, meta.name), /* @__PURE__ */ React.createElement("small", null, noVisibility ? meta.sub : visible ? "Live on the public site" : "Hidden from the public site"))), nav.map((n) => /* @__PURE__ */ React.createElement("button", { key: n.id, className: "fd-nav", "aria-current": active === n.id ? "page" : void 0, onClick: () => onNav(n.id) }, /* @__PURE__ */ React.createElement("span", { className: "fd-nav-ic" }, n.icon), n.label, typeof n.count === "number" && /* @__PURE__ */ React.createElement("span", { className: "fd-count" + (n.hot ? " hot" : "") }, n.count))), !noVisibility && /* @__PURE__ */ React.createElement("div", { className: "fd-side-foot" }, /* @__PURE__ */ React.createElement(Switch, { on: visible, onChange: (v) => store.savePillarActive(pillarKey, v) }, "Show pillar on public site"))), /* @__PURE__ */ React.createElement("main", { className: "fd-main" }, children, !noVisibility && /* @__PURE__ */ React.createElement("div", { className: "fd-mvis fd-card" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", { style: { fontWeight: 600 } }, meta.name), /* @__PURE__ */ React.createElement("div", { className: "fd-sub", style: { margin: 0 } }, visible ? "Live on the public site" : "Hidden from the public site")), /* @__PURE__ */ React.createElement(Switch, { on: visible, onChange: (v) => store.savePillarActive(pillarKey, v) }, "Show")))));
  }
  const Head = ({ title, lede, children }) => /* @__PURE__ */ React.createElement("div", { className: "fd-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "fd-h1" }, title), lede && /* @__PURE__ */ React.createElement("p", { className: "fd-lede" }, lede)), children && /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, children));
  const PILLARS = {
    worship: { name: "Houses of Worship", grantName: "Houses of Worship", accent: "#C9A961", unit: ["mosque", "mosques"], unitLabel: "Mosques built", get: (s) => s.getWorship(), save: (s, v) => s.saveWorship(v), unitField: "mosques", partner: "Minang Bandung Foundation", project: "e.g. Masjid Al-Ikhlas — construction", note: "the site", firstEntry: "The first mosque", linkMode: "pillar", linkHelp: "Usually the partner foundation's construction or donation page (for example, Minang Bandung's mosque project page)." },
    foodland: { name: "Food & Land", grantName: "Food & Land", accent: "#A8C97F", unit: ["tree", "trees"], unitLabel: "Trees planted", get: (s) => s.getFoodland(), save: (s, v) => s.saveFoodland(v), unitField: "trees", partner: "", project: "e.g. Trees for Life — olive saplings", firstEntry: "The first five trees", linkMode: "partner", linkHelp: "Usually Zaytoun's Trees for Life page (https://zaytoun.uk/plant-a-tree/)." },
    water: { name: "Clean Water", grantName: "Clean Water", accent: "#7FB8C9", unit: ["well", "wells"], unitLabel: "Wells built", get: (s) => s.getWater(), save: (s, v) => s.saveWater(v), unitField: "trees", partner: "", project: "e.g. Village well — phase I", firstEntry: "The first well", linkMode: "partner", linkHelp: "The drilling or water partner's programme page. Hide the button while there is no active partner." },
    hospitals: { name: "Hospitals", grantName: "Hospitals", accent: "#C9847F", unit: ["clinic", "clinics"], unitLabel: "Clinics opened", get: (s) => s.getPillarContent("hospitals"), save: (s, v) => s.savePillarContent("hospitals", v), unitField: "units", partner: "", project: "e.g. Village clinic — phase I", firstEntry: "The first clinic", linkMode: "partner", linkHelp: "The health partner's programme page. Hide the button while there is no active partner." },
    schools: { name: "Schools", grantName: "Schools", accent: "#C9BC7F", unit: ["school", "schools"], unitLabel: "Schools raised", get: (s) => s.getPillarContent("schools"), save: (s, v) => s.savePillarContent("schools", v), unitField: "units", partner: "", project: "e.g. Primary school — phase I", firstEntry: "The first school", linkMode: "partner", linkHelp: "The education partner's programme page. Hide the button while there is no active partner." },
    livestock: { name: "Livestock & Enterprise", grantName: "Livestock & Enterprise", accent: "#C9A07F", unit: ["placement", "placements"], unitLabel: "Placements", get: (s) => s.getPillarContent("livestock"), save: (s, v) => s.savePillarContent("livestock", v), unitField: "units", partner: "", project: "e.g. Goat herd — family batch I", firstEntry: "The first herd", linkMode: "partner", linkHelp: "The enterprise partner's programme page. Hide the button while there is no active partner." },
    infra: { name: "Sustainable Infrastructure", grantName: "Sustainable Infrastructure", accent: "#9FA8B8", unit: ["work", "works"], unitLabel: "Works completed", get: (s) => s.getPillarContent("infra"), save: (s, v) => s.savePillarContent("infra", v), unitField: "units", partner: "", project: "e.g. Footbridge — phase I", firstEntry: "The first bridge", linkMode: "partner", linkHelp: "The works partner's programme page. Hide the button while there is no active partner." },
    library: { name: "The Library", accent: "#C98A61", linkMode: "pillar", linkHelp: "Usually your Lynk storefront (for example https://lynk.id/brial) where readers browse and buy the books." },
    scholarships: { name: "Scholarships", accent: "#C9A961" },
    transport: {
      name: "Transportation",
      accent: "#E8834A",
      linkMode: "partner",
      linkHelp: "Where the Rent with go2rent button sends visitors, usually https://www.gotworent.com/.",
      note: "the road",
      get: (s) => s.getPillarContent("transport"),
      save: (s, v) => s.savePillarContent("transport", v),
      facts: [["fleet", "Vehicles in service", "730+"], ["regions", "Regions", "9"], ["airports", "Airport desks", "9"], ["support", "Support", "24/7"]]
    },
    site: { name: "Site settings", accent: "#9FB4D9", sub: "Applies to the whole public site" },
    treasury: { name: "Treasury", accent: "#7FC9A8", sub: "Money in and out of the endowment" },
    impact: { name: "Impact Report", accent: "#E2C98E", sub: "The yearly report to the world" },
    email: { name: "Email", accent: "#9FC3E2", sub: "Letters, receipts and reminders" },
    security: { name: "Security", accent: "#C8B6F0", sub: "Two-step verification and activity" }
  };
  function GrantForm({ cfg, initial, onSave, onClose }) {
    const [f, setF] = useState(() => initial || { partner: cfg.partner || "", project: "", country: "", amount: "", units: "", note: "", date: today() });
    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const ok = parseFloat(f.amount) > 0 && f.project.trim();
    return /* @__PURE__ */ React.createElement(Modal, { title: initial ? "Edit grant" : "Record a grant", sub: `Funds sent to a ${cfg.name} partner. Totals feed the public "Total distributed" figure.`, onClose }, /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement(Field, { label: "Project" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.project, onChange: (e) => set("project", e.target.value), placeholder: cfg.project, autoFocus: true })), /* @__PURE__ */ React.createElement("div", { className: "fd-grid2" }, /* @__PURE__ */ React.createElement(Field, { label: "Partner" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.partner, onChange: (e) => set("partner", e.target.value), placeholder: "Organisation that carries out the work" })), /* @__PURE__ */ React.createElement(Field, { label: "Country" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.country, onChange: (e) => set("country", e.target.value), placeholder: "e.g. Indonesia" }))), /* @__PURE__ */ React.createElement("div", { className: "fd-grid3" }, /* @__PURE__ */ React.createElement(Field, { label: "Amount (USD)" }, /* @__PURE__ */ React.createElement("div", { className: "fd-money" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", inputMode: "decimal", value: f.amount, onChange: (e) => set("amount", e.target.value), placeholder: "0" }))), /* @__PURE__ */ React.createElement(Field, { label: cfg.unitLabel + " (this grant)" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "number", min: "0", value: f.units, onChange: (e) => set("units", e.target.value), placeholder: "0" })), /* @__PURE__ */ React.createElement(Field, { label: "Date" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "date", value: f.date, onChange: (e) => set("date", e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "Note (optional)" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.note, onChange: (e) => set("note", e.target.value), placeholder: "Short description" }))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !ok, onClick: () => {
      onSave(f);
      onClose();
    } }, initial ? "Save changes" : "Record grant"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: onClose }, "Cancel")));
  }
  function GrantsView({ store, cfg }) {
    const all = store.getPillarGrants().filter((g) => g.pillar === cfg.grantName).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const live = all.filter((g) => !g.archived);
    const [filter, setFilter] = useState("live");
    const [edit, setEdit] = useState(null);
    const [m, flash] = useFlash();
    const total = live.reduce((a, g) => a + (Number(g.amount) || 0), 0);
    const units = live.reduce((a, g) => a + (Number(g.units) || 0), 0);
    const nations = new Set(live.map((g) => (g.country || "").trim().toLowerCase()).filter(Boolean)).size;
    const shown = filter === "live" ? live : filter === "archived" ? all.filter((g) => g.archived) : all;
    const save = (f) => {
      const payload = { pillar: cfg.grantName, partner: f.partner, project: f.project, country: f.country, amount: parseFloat(f.amount), units: f.units, note: f.note, date: new Date(f.date).toISOString() };
      if (edit && edit !== "new") {
        store.updatePillarGrant(edit.id, payload);
        flash("Grant updated.");
      } else {
        store.addPillarGrant(payload);
        flash("Grant recorded.");
      }
    };
    const G = "minmax(0,2fr) minmax(0,1.2fr) minmax(0,.8fr) minmax(0,.8fr) minmax(0,1fr) auto";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Grants", lede: `Every payment to a ${cfg.name} partner. Archived grants stay on record but leave the public totals.` }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", onClick: () => setEdit("new") }, "Record a grant")), /* @__PURE__ */ React.createElement(Stats, { items: [{ label: "Total granted", value: money(total) }, { label: cfg.unitLabel, value: units }, { label: "Countries", value: nations }, { label: "Grants on record", value: all.length, sub: all.length - live.length ? `${all.length - live.length} archived` : null }] }), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Seg, { value: filter, onChange: setFilter, items: [["live", "Counted", live.length], ["archived", "Archived", all.length - live.length], ["all", "All", all.length]] }), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto" } }, /* @__PURE__ */ React.createElement(Flash, { m }))), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", null, "Project"), /* @__PURE__ */ React.createElement("div", null, "Partner"), /* @__PURE__ */ React.createElement("div", null, "Country"), /* @__PURE__ */ React.createElement("div", null, "Amount"), /* @__PURE__ */ React.createElement("div", null, "Reference · date"), /* @__PURE__ */ React.createElement("div", null)), shown.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "No grants here yet." }, "Record the first grant to start this pillar's ledger.") : shown.map((g) => /* @__PURE__ */ React.createElement("div", { key: g.id, className: "fd-tr" + (g.archived ? " dim" : ""), style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("b", null, g.project || "Untitled grant"), g.note && /* @__PURE__ */ React.createElement("small", null, g.note), Number(g.units) > 0 && /* @__PURE__ */ React.createElement("small", { style: { color: cfg.accent } }, g.units, " ", plural(g.units, cfg.unit[0], cfg.unit[1])), g.archived && /* @__PURE__ */ React.createElement(Tag, null, "Archived")), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Partner" }, g.partner || "—"), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Country" }, g.country || "—"), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Amount" }, /* @__PURE__ */ React.createElement("span", { className: "num" }, money(g.amount))), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Reference" }, /* @__PURE__ */ React.createElement("span", { className: "fd-mono" }, g.txRef || "—"), /* @__PURE__ */ React.createElement("small", null, fdate(g.date))), /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => setEdit({ ...g, initial: { partner: g.partner || "", project: g.project || "", country: g.country || "", amount: String(g.amount || ""), units: String(g.units || ""), note: g.note || "", date: g.date ? String(g.date).slice(0, 10) : today() } }) }, "Edit"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => store.updatePillarGrant(g.id, { archived: !g.archived }) }, g.archived ? "Restore" : "Archive"), /* @__PURE__ */ React.createElement(Confirm, { onConfirm: () => store.deletePillarGrant(g.id) }, "Delete")))))), edit && /* @__PURE__ */ React.createElement(GrantForm, { cfg, initial: edit === "new" ? null : edit.initial, onSave: save, onClose: () => setEdit(null) }));
  }
  function ProgrammeView({ store, cfg }) {
    var _a;
    const [f, setF] = useState(() => cfg.get(store));
    const [saved, setSaved] = useState(() => JSON.stringify(cfg.get(store)));
    const [busy, setBusy] = useState(null);
    const [m, flash] = useFlash();
    const dirty = JSON.stringify(f) !== saved;
    const set = (patch) => setF((p) => ({ ...p, ...patch }));
    const setA = (id, patch) => setF((p) => ({ ...p, articles: p.articles.map((a) => a.id === id ? { ...a, ...patch } : a) }));
    const add = () => setF((p) => ({ ...p, articles: [{ id: "note-" + Date.now(), date: today(), title: "", body: "", partner: "", link: "", photo: null, draft: true }, ...p.articles || []] }));
    const del = (id) => setF((p) => ({ ...p, articles: p.articles.filter((a) => a.id !== id) }));
    const save = () => {
      cfg.save(store, f);
      setSaved(JSON.stringify(f));
      flash("Saved — the public page is updated.");
    };
    const unitsFromGrants = store.getPillarUnits ? store.getPillarUnits(cfg.grantName) : 0;
    useEffect(() => {
      const h = (e) => {
        if (dirty) {
          e.preventDefault();
          e.returnValue = "";
        }
      };
      window.addEventListener("beforeunload", h);
      return () => window.removeEventListener("beforeunload", h);
    }, [dirty]);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Programme page", lede: `What visitors read on the public ${cfg.name} page: the summary at the top and the journal below it.` }), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Page summary")), /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement("div", { className: "fd-grid2" }, /* @__PURE__ */ React.createElement(Field, { label: "Location line" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.location || "", onChange: (e) => set({ location: e.target.value }), placeholder: "Village · District — Country" })), /* @__PURE__ */ React.createElement(Field, { label: "Partner line" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.partnerLine || "", onChange: (e) => set({ partnerLine: e.target.value }), placeholder: "In partnership with …" }))), /* @__PURE__ */ React.createElement(Field, { label: "Introduction", hint: "How the programme works, in two or three sentences." }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", value: f.intro || "", onChange: (e) => set({ intro: e.target.value }) })), cfg.facts ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fd-grid2" }, cfg.facts.map(([k, label, ph]) => /* @__PURE__ */ React.createElement(Field, { key: k, label }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f[k] || "", onChange: (e) => set({ [k]: e.target.value }), placeholder: ph })))), /* @__PURE__ */ React.createElement(Field, { label: "Note under the figures", hint: "Where the figures come from, and when." }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.factsNote || "", onChange: (e) => set({ factsNote: e.target.value }) }))) : cfg.unitField ? /* @__PURE__ */ React.createElement(Field, { label: cfg.unitLabel + " shown on the page", hint: unitsFromGrants > 0 ? `The page currently shows ${unitsFromGrants}, counted from your grants. This number is only used when no grant has a count.` : "Used until a grant records a count.", style: { maxWidth: 260 } }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "number", min: "0", value: (_a = f[cfg.unitField]) != null ? _a : 0, onChange: (e) => set({ [cfg.unitField]: Math.max(0, parseInt(e.target.value || "0", 10)) }) })) : null)), /* @__PURE__ */ React.createElement("div", { className: "fd-head", style: { marginTop: 32, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h3" }, "Journal"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Field notes with photos. Drafts stay hidden until you publish them.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: add }, "Add entry")), (f.articles || []).length === 0 && /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement(Empty, { title: "No journal entries yet." }, "Add the first word from ", cfg.note || "the field", ".")), (f.articles || []).map((a) => {
      const img = a.photo && (a.photo.url || a.photo.path) ? a.photo.url || window.brialSupabase.publicUrl(a.photo.path) : null;
      return /* @__PURE__ */ React.createElement("div", { className: "fd-card", key: a.id }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement(Tag, { tone: a.draft ? "" : "ok", dot: true }, a.draft ? "Draft" : "Published"), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn sm " + (a.draft ? "ok" : "ghost"), onClick: () => setA(a.id, { draft: !a.draft }) }, a.draft ? "Publish" : "Move to drafts"), /* @__PURE__ */ React.createElement(Confirm, { onConfirm: () => del(a.id) }, "Delete entry"))), /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement("div", { className: "fd-grid2", style: { gridTemplateColumns: "minmax(0,1fr) 180px" } }, /* @__PURE__ */ React.createElement(Field, { label: "Title" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: a.title || "", onChange: (e) => setA(a.id, { title: e.target.value }), placeholder: cfg.firstEntry })), /* @__PURE__ */ React.createElement(Field, { label: "Date" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "date", value: a.date && a.date.length >= 10 ? a.date.slice(0, 10) : "", onChange: (e) => setA(a.id, { date: e.target.value }) }))), /* @__PURE__ */ React.createElement(Field, { label: "Story" }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", value: a.body || "", onChange: (e) => setA(a.id, { body: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "fd-grid2" }, /* @__PURE__ */ React.createElement(Field, { label: "Partner (optional)" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: a.partner || "", onChange: (e) => setA(a.id, { partner: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Link (optional)" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: a.link || "", onChange: (e) => setA(a.id, { link: e.target.value }), placeholder: "https://…" }))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, img && /* @__PURE__ */ React.createElement(Img, { className: "fd-thumb", src: img }), /* @__PURE__ */ React.createElement(PhotoUpload, { onUploaded: (meta) => setA(a.id, { photo: { url: meta.url, path: meta.path, name: meta.name } }) }, img ? "Replace photo" : "Add photo"), img && /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => setA(a.id, { photo: null }) }, "Remove photo"))));
    }), (dirty || m) && /* @__PURE__ */ React.createElement("div", { className: "fd-savebar" }, /* @__PURE__ */ React.createElement("span", { style: { color: dirty ? "var(--amber)" : "var(--sage)", fontWeight: 600 } }, dirty ? "You have unsaved changes" : m && m.text), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, dirty && /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet", onClick: () => setF(JSON.parse(saved)) }, "Discard"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !dirty, onClick: save }, "Save and publish"))));
  }
  function LinkView({ store, pillarKey, cfg }) {
    const stored = store.getPillarLink(pillarKey) || "";
    const [url, setUrl] = useState(stored);
    const hidden = store.getPillarLinkHidden ? store.getPillarLinkHidden(pillarKey) : false;
    const [m, flash] = useFlash();
    const valid = /^https?:\/\/\S+\.\S+/i.test(url.trim());
    const dirty = url.trim() !== stored;
    const pillarMode = cfg.linkMode === "pillar";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: pillarMode ? "Pillar link" : "Partner button", lede: pillarMode ? `Where visitors go when they choose ${cfg.name} on the public site.` : `The "Learn more about our partner" button on the public ${cfg.name} page.` }), /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { maxWidth: 760 } }, /* @__PURE__ */ React.createElement(Field, { label: "Destination address", hint: cfg.linkHelp }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: url, onChange: (e) => setUrl(e.target.value), placeholder: "https://", spellCheck: false })), url.trim() && !valid && /* @__PURE__ */ React.createElement("div", { className: "fd-msg err", style: { marginTop: 10 } }, "Use a full address that starts with https://"), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !dirty || !valid, onClick: () => {
      store.savePillarLink(pillarKey, url.trim());
      flash("Link saved.");
    } }, "Save link"), valid && /* @__PURE__ */ React.createElement("a", { className: "fd-btn ghost", href: url.trim(), target: "_blank", rel: "noopener noreferrer" }, "Test link ", ICON.ext), /* @__PURE__ */ React.createElement(Flash, { m }))), /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { maxWidth: 760 } }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, hidden ? "The button is hidden" : "The button is visible"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, hidden ? "Visitors don't see a link. Turn it back on when you have a destination." : "Hide it while you are between partners.")), /* @__PURE__ */ React.createElement(Switch, { on: !hidden, onChange: (v) => store.savePillarLinkHidden && store.savePillarLinkHidden(pillarKey, !v) }, hidden ? "Hidden" : "Visible")), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Currently saved: ", /* @__PURE__ */ React.createElement("span", { className: "fd-mono" }, stored || "not set"))));
  }
  const BLANK_BOOK = () => ({ id: "book-" + Date.now().toString(36), lang: "", langCode: "", title: "", subtitle: "", cover: "", link: "", getLabel: "Get the e-book", supportNote: "A portion of every sale supports Brial Endowment scholarships.", accent: "#C9A961", desc: "", points: [] });
  function BookForm({ book, onSave, onClose }) {
    const [b, setB] = useState(book);
    const set = (k, v) => setB((p) => ({ ...p, [k]: v }));
    return /* @__PURE__ */ React.createElement(Modal, { wide: true, title: book.title ? "Edit book" : "Add a book", sub: "Shown in the e-book catalogue on the public site.", onClose }, /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "center" } }, b.cover ? /* @__PURE__ */ React.createElement(Img, { className: "fd-cover", src: b.cover, fallback: /* @__PURE__ */ React.createElement("div", { className: "fd-cover" }, "Cover") }) : /* @__PURE__ */ React.createElement("div", { className: "fd-cover" }, "No cover"), /* @__PURE__ */ React.createElement(PhotoUpload, { onUploaded: (meta) => set("cover", meta.url || (meta.path ? window.brialSupabase.publicUrl(meta.path) : "")) }, b.cover ? "Replace cover" : "Upload cover")), /* @__PURE__ */ React.createElement("div", { className: "fd-grid2" }, /* @__PURE__ */ React.createElement(Field, { label: "Title" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: b.title, onChange: (e) => set("title", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Subtitle" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: b.subtitle, onChange: (e) => set("subtitle", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "fd-grid3" }, /* @__PURE__ */ React.createElement(Field, { label: "Language" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: b.lang, onChange: (e) => set("lang", e.target.value), placeholder: "Bahasa Indonesia" })), /* @__PURE__ */ React.createElement(Field, { label: "Language code" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: b.langCode, onChange: (e) => set("langCode", e.target.value.toUpperCase().slice(0, 3)), placeholder: "ID" })), /* @__PURE__ */ React.createElement(Field, { label: "Accent colour" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "color", value: b.accent || "#C9A961", onChange: (e) => set("accent", e.target.value), style: { height: 42, padding: 4 } }))), /* @__PURE__ */ React.createElement(Field, { label: "Description" }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", value: b.desc, onChange: (e) => set("desc", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Key points", hint: "One per line." }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", style: { minHeight: 90 }, value: (b.points || []).join("\n"), onChange: (e) => set("points", e.target.value.split("\n")) })), /* @__PURE__ */ React.createElement("div", { className: "fd-grid2" }, /* @__PURE__ */ React.createElement(Field, { label: "Store link" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: b.link, onChange: (e) => set("link", e.target.value), placeholder: "https://lynk.id/…" })), /* @__PURE__ */ React.createElement(Field, { label: "Button label" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: b.getLabel, onChange: (e) => set("getLabel", e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "Support note" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: b.supportNote, onChange: (e) => set("supportNote", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !b.title.trim(), onClick: () => {
      onSave({ ...b, points: (b.points || []).filter((p) => p.trim()) });
      onClose();
    } }, "Save book"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: onClose }, "Cancel")));
  }
  function CatalogView({ store }) {
    const books = store.listEbooks();
    const [edit, setEdit] = useState(null);
    const [m, flash] = useFlash();
    const commit = (next, msg) => {
      store.saveEbooks(next);
      flash(msg);
    };
    const move = (i, d) => {
      const j = i + d;
      if (j < 0 || j >= books.length) return;
      const n = books.slice();
      [n[i], n[j]] = [n[j], n[i]];
      commit(n, "Order saved.");
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Catalogue", lede: "The e-books listed on the public Library page, in this order." }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", onClick: () => setEdit(BLANK_BOOK()) }, "Add a book")), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Flash, { m })), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, books.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "The catalogue is empty." }, "Add your first book.") : books.map((b, i) => /* @__PURE__ */ React.createElement("div", { key: b.id || i, className: "fd-tr", style: { gridTemplateColumns: "auto minmax(0,1fr) auto" } }, b.cover ? /* @__PURE__ */ React.createElement(Img, { className: "fd-cover", src: b.cover, fallback: /* @__PURE__ */ React.createElement("div", { className: "fd-cover" }, "Cover") }) : /* @__PURE__ */ React.createElement("div", { className: "fd-cover" }, "No cover"), /* @__PURE__ */ React.createElement("div", { className: "fd-td" }, /* @__PURE__ */ React.createElement("b", null, b.title || "Untitled"), /* @__PURE__ */ React.createElement("small", null, b.subtitle), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 6 } }, (b.langCode || b.lang) && /* @__PURE__ */ React.createElement(Tag, null, b.langCode || b.lang), b.link ? /* @__PURE__ */ React.createElement("a", { className: "fd-mono", href: b.link, target: "_blank", rel: "noopener noreferrer" }, b.link.replace(/^https?:\/\//, "")) : /* @__PURE__ */ React.createElement(Tag, { tone: "warn" }, "No store link"))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", disabled: i === 0, onClick: () => move(i, -1), "aria-label": "Move up" }, "↑"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", disabled: i === books.length - 1, onClick: () => move(i, 1), "aria-label": "Move down" }, "↓"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => setEdit(b) }, "Edit"), /* @__PURE__ */ React.createElement(Confirm, { onConfirm: () => commit(books.filter((_, k) => k !== i), "Book removed.") }, "Remove"))))), edit && /* @__PURE__ */ React.createElement(BookForm, { book: edit, onClose: () => setEdit(null), onSave: (nb) => {
      const exists = books.some((x) => x.id === nb.id);
      commit(exists ? books.map((x) => x.id === nb.id ? nb : x) : [...books, nb], exists ? "Book updated." : "Book added.");
    } }));
  }
  function SalesView({ store }) {
    const sales = store.listLibrarySales();
    const books = store.listEbooks();
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({ bookId: books[0] ? books[0].id : "", qty: "1", amount: "", note: "", date: today() });
    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const total = sales.reduce((a, s) => a + (Number(s.amount) || 0), 0);
    const copies = sales.reduce((a, s) => a + (Number(s.qty) || 1), 0);
    const save = () => {
      const b = books.find((x) => x.id === f.bookId);
      store.addLibrarySale({ bookId: f.bookId, title: b ? b.title : "Library edition", lang: b ? b.langCode || b.lang || "" : "", qty: f.qty, amount: parseFloat(f.amount), note: f.note, date: new Date(f.date).toISOString() });
      setF({ bookId: books[0] ? books[0].id : "", qty: "1", amount: "", note: "", date: today() });
      setOpen(false);
    };
    const G = "minmax(0,2fr) 70px minmax(0,.8fr) minmax(0,1fr) auto";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Sales", lede: "Income from book sales. Each sale enters the public ledger as a verified gift." }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", onClick: () => setOpen(true), disabled: !books.length }, "Record a sale")), /* @__PURE__ */ React.createElement(Stats, { items: [{ label: "Total income", value: money(total) }, { label: "Copies sold", value: copies }, { label: "Sales recorded", value: sales.length }] }), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", null, "Edition"), /* @__PURE__ */ React.createElement("div", null, "Copies"), /* @__PURE__ */ React.createElement("div", null, "Income"), /* @__PURE__ */ React.createElement("div", null, "Reference · date"), /* @__PURE__ */ React.createElement("div", null)), sales.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "No sales recorded yet." }) : sales.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.id, className: "fd-tr", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("b", null, s.title), s.lang && /* @__PURE__ */ React.createElement("small", null, s.lang), s.note && /* @__PURE__ */ React.createElement("small", null, s.note)), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Copies" }, s.qty || 1), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Income" }, /* @__PURE__ */ React.createElement("span", { className: "num" }, money(s.amount))), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Reference" }, /* @__PURE__ */ React.createElement("span", { className: "fd-mono" }, s.txRef || "—"), /* @__PURE__ */ React.createElement("small", null, fdate(s.date))), /* @__PURE__ */ React.createElement("div", { className: "fd-td" }, /* @__PURE__ */ React.createElement(Confirm, { onConfirm: () => store.deleteLibrarySale(s.id) }, "Delete"))))), open && /* @__PURE__ */ React.createElement(Modal, { title: "Record a sale", onClose: () => setOpen(false) }, /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement(Field, { label: "Edition" }, /* @__PURE__ */ React.createElement("select", { className: "fd-input", value: f.bookId, onChange: (e) => set("bookId", e.target.value) }, books.map((b) => /* @__PURE__ */ React.createElement("option", { key: b.id, value: b.id }, b.title, b.langCode || b.lang ? ` (${b.langCode || b.lang})` : "")))), /* @__PURE__ */ React.createElement("div", { className: "fd-grid3" }, /* @__PURE__ */ React.createElement(Field, { label: "Copies" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "number", min: "1", value: f.qty, onChange: (e) => set("qty", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Income (USD)" }, /* @__PURE__ */ React.createElement("div", { className: "fd-money" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", inputMode: "decimal", value: f.amount, onChange: (e) => set("amount", e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "Date" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "date", value: f.date, onChange: (e) => set("date", e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "Note (optional)" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.note, onChange: (e) => set("note", e.target.value), placeholder: "e.g. Lynk payout, October" }))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !(parseFloat(f.amount) > 0) || !f.bookId, onClick: save }, "Record sale"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => setOpen(false) }, "Cancel"))));
  }
  function ContributionsView({ store }) {
    const list = store.listEnterpriseIncome ? store.listEnterpriseIncome("go2rent") : [];
    const [open, setOpen] = useState(false);
    const blank = () => ({ amount: "", period: "", txRef: "", note: "", date: today() });
    const [f, setF] = useState(blank);
    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const total = list.reduce((a, x) => a + (Number(x.amount) || 0), 0);
    const last = list[0];
    const content = store.getPillarContent("transport");
    const hide = !!content.hideAmounts;
    const setHide = (v) => store.savePillarContent("transport", { ...store.getPillarContent("transport"), hideAmounts: !!v });
    const save = () => {
      store.addEnterpriseIncome({ source: "go2rent", amount: parseFloat(f.amount), period: f.period, txRef: f.txRef, note: f.note, date: new Date(f.date).toISOString() });
      setF(blank());
      setOpen(false);
    };
    const G = "minmax(0,1.6fr) minmax(0,.8fr) minmax(0,1.2fr) auto";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Contributions", lede: "Money given to the endowment from your returns in go2rent. Each contribution enters the public ledger as verified income and shows on the Transportation page." }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", onClick: () => setOpen(true) }, "Record a contribution")), /* @__PURE__ */ React.createElement(Stats, { items: [{ label: "Returned to the endowment", value: money(total), tone: total > 0 ? "ok" : "" }, { label: "Contributions", value: list.length }, { label: "Latest", value: last ? fdate(last.date) : "None yet" }] }), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, hide ? "Amounts are hidden on the public page" : "Amounts are shown on the public page"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, hide ? "The Transportation page lists each contribution by period, without the dollar figures. The open ledger still records every amount." : "The Transportation page shows the total returned to the endowment and the amount of each contribution.")), /* @__PURE__ */ React.createElement(Switch, { on: !hide, onChange: (v) => setHide(!v) }, hide ? "Hidden" : "Shown"))), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", null, "Period"), /* @__PURE__ */ React.createElement("div", null, "Amount"), /* @__PURE__ */ React.createElement("div", null, "Reference · date"), /* @__PURE__ */ React.createElement("div", null)), list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "No contributions recorded yet." }, "When you give part of your go2rent returns to the endowment, record it here.") : list.map((x) => /* @__PURE__ */ React.createElement("div", { key: x.id, className: "fd-tr", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("b", null, x.period || "Contribution"), x.note && /* @__PURE__ */ React.createElement("small", null, x.note)), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Amount" }, /* @__PURE__ */ React.createElement("span", { className: "num" }, money(x.amount))), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Reference" }, /* @__PURE__ */ React.createElement("span", { className: "fd-mono" }, x.txRef || "—"), /* @__PURE__ */ React.createElement("small", null, fdate(x.date))), /* @__PURE__ */ React.createElement("div", { className: "fd-td" }, /* @__PURE__ */ React.createElement(Confirm, { onConfirm: () => store.deleteEnterpriseIncome(x.id) }, "Delete"))))), open && /* @__PURE__ */ React.createElement(Modal, { title: "Record a contribution", sub: "From your go2rent returns to the endowment", onClose: () => setOpen(false) }, /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement("div", { className: "fd-grid3" }, /* @__PURE__ */ React.createElement(Field, { label: "Amount (USD)" }, /* @__PURE__ */ React.createElement("div", { className: "fd-money" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", inputMode: "decimal", value: f.amount, onChange: (e) => set("amount", e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "Period" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.period, onChange: (e) => set("period", e.target.value), placeholder: "e.g. October 2026" })), /* @__PURE__ */ React.createElement(Field, { label: "Date given" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "date", value: f.date, onChange: (e) => set("date", e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "Transaction reference (optional)", hint: "A blockchain hash or bank reference. Left empty, a reference is made for you." }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.txRef, onChange: (e) => set("txRef", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Note (optional)", hint: "Shown on the public ledger." }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.note, onChange: (e) => set("note", e.target.value), placeholder: "e.g. Share of Q3 returns" }))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !(parseFloat(f.amount) > 0), onClick: save }, "Record contribution"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => setOpen(false) }, "Cancel"))));
  }
  const STAGE = {
    registered: ["", "Draft"],
    submitted: ["gold", "To review"],
    "interview-scheduled": ["sky", "Interview booked"],
    "interview-done": ["warn", "Decision due"],
    accepted: ["ok", "Granted"],
    rejected: ["bad", "Declined"]
  };
  const SCH = { active: ["ok", "Active"], suspended: ["warn", "Paused"], revoked: ["bad", "Revoked"], graduated: ["gold", "Graduated"] };
  const StageTag = ({ s }) => {
    const m = STAGE[s] || ["", s];
    return /* @__PURE__ */ React.createElement(Tag, { tone: m[0], dot: true }, m[1]);
  };
  const Avatar = ({ app, size }) => {
    var _a;
    const per = ((_a = app.profile) == null ? void 0 : _a.personal) || {};
    const u = fileUrl(per.showcasePhoto || (isImage(per.photoFile) ? per.photoFile : null));
    const st = size ? { width: size, height: size * 1.25 } : null;
    const ph = /* @__PURE__ */ React.createElement("div", { className: "fd-avatar", style: st }, (app.name || "?").charAt(0));
    return u ? /* @__PURE__ */ React.createElement(Img, { className: "fd-avatar", style: st, src: u, fallback: ph }) : ph;
  };
  const Row = ({ label, value, wide }) => /* @__PURE__ */ React.createElement("div", { className: wide ? "wide" : "" }, /* @__PURE__ */ React.createElement("dt", null, label), /* @__PURE__ */ React.createElement("dd", { className: value ? "" : "none" }, value || "Not provided"));
  function StagePanel({ app, store }) {
    const [date, setDate] = useState(() => new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10));
    const [time, setTime] = useState("14:30");
    const [link, setLink] = useState(app.meetingLink || "");
    const first = titleCase((app.name || "").split(" ")[0]);
    const decide = (app.status === "submitted" || app.status === "interview-scheduled" || app.status === "interview-done") && /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" } }, /* @__PURE__ */ React.createElement(Confirm, { className: "fd-btn primary", armedLabel: "Click again to grant", onConfirm: () => store.acceptApplication(app.id) }, "Grant scholarship"), /* @__PURE__ */ React.createElement(Confirm, { armedLabel: "Click again to decline", onConfirm: () => store.rejectApplication(app.id) }, "Decline"));
    if (app.status === "registered") return /* @__PURE__ */ React.createElement("div", { className: "fd-msg info" }, "This applicant has an account but hasn't submitted the application yet.");
    if (app.status === "rejected") return /* @__PURE__ */ React.createElement("div", { className: "fd-msg info" }, "Declined on ", fdate(app.rejectedAt), ".");
    if (app.status === "accepted") return null;
    return /* @__PURE__ */ React.createElement("div", { className: "fd-stage" }, app.status === "submitted" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fd-stage-k" }, "Next step"), /* @__PURE__ */ React.createElement("h3", { className: "fd-h3", style: { marginTop: 4 } }, "Book an interview"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, first, " will see the time, the meeting link and a join button in the portal."), /* @__PURE__ */ React.createElement("div", { className: "fd-grid2", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "Date" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "date", value: date, onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Time (your time zone)" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "time", value: time, onChange: (e) => setTime(e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "Meeting link", style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "url", value: link, onChange: (e) => setLink(e.target.value), placeholder: "https://meet.google.com/… or https://zoom.us/j/…" })), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !link.trim(), onClick: () => store.scheduleInterview(app.id, (/* @__PURE__ */ new Date(`${date}T${time}:00`)).toISOString(), link.trim()) }, "Send invitation"), !link.trim() && /* @__PURE__ */ React.createElement("small", { className: "fd-sub", style: { margin: 0 } }, "Add the meeting link first."))), app.status === "interview-scheduled" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fd-stage-k" }, "Interview booked"), /* @__PURE__ */ React.createElement("h3", { className: "fd-h3", style: { marginTop: 4 } }, fdatetime(app.interviewAt)), app.meetingLink && /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("a", { className: "fd-btn ghost sm", href: /^https?:\/\//i.test(app.meetingLink) ? app.meetingLink : "https://" + app.meetingLink, target: "_blank", rel: "noopener noreferrer" }, "Open meeting ", ICON.ext), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => copy(app.meetingLink) }, "Copy link")), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", onClick: () => store.markInterviewDone(app.id) }, "Mark interview as done"))), app.status === "interview-done" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fd-stage-k" }, "Decision due"), /* @__PURE__ */ React.createElement("h3", { className: "fd-h3", style: { marginTop: 4 } }, "Interviewed on ", fdate(app.interviewDoneAt)), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Record your decision below.")), decide);
  }
  function ScholarControls({ app, store }) {
    const [action, setAction] = useState(null);
    const [reason, setReason] = useState("");
    const status = app.scholarStatus || "active";
    const ipk = store.cumulativeIPK(app);
    const apply = () => {
      if (!reason.trim()) return;
      if (action === "suspend") store.suspendScholarship(app.id, reason.trim());
      if (action === "revoke") store.revokeScholarship(app.id, reason.trim());
      if (action === "reactivate") store.reactivateScholarship(app.id, reason.trim());
      setAction(null);
      setReason("");
    };
    const copyT = { suspend: ["Pause scholarship", "The scholar sees your reason. No payments are made while paused.", "e.g. GPA for semester 3 fell below 2.75 — please explain before we continue."], revoke: ["End scholarship permanently", "The record is kept, but no further payments are made. Use only when reinstatement is not expected.", "e.g. Breach of the code of conduct: …"], reactivate: ["Reactivate scholarship", "The scholar can upload bills and transcripts again.", "e.g. Semester 4 GPA recovered to 3.20."] };
    return /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Scholarship"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, app.scholarId, " · ", app.cohort, ipk ? ` · cumulative GPA ${ipk.value.toFixed(2)}` : "")), /* @__PURE__ */ React.createElement(Tag, { tone: (SCH[status] || SCH.active)[0], dot: true }, (SCH[status] || SCH.active)[1])), ipk && ipk.value < 2.75 && /* @__PURE__ */ React.createElement("div", { className: "fd-msg err", style: { marginBottom: 12 } }, "Cumulative GPA is below the 2.75 minimum."), !action && status !== "graduated" && status !== "revoked" && /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, status === "active" && /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => setAction("suspend") }, "Pause"), status === "suspended" && /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary sm", onClick: () => setAction("reactivate") }, "Reactivate"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn danger sm", onClick: () => setAction("revoke") }, "End permanently")), status === "revoked" && /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "This scholarship has ended. No further actions are available."), action && /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, copyT[action][0]), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, copyT[action][1])), /* @__PURE__ */ React.createElement(Field, { label: "Reason (shown to the scholar)" }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", style: { minHeight: 80 }, value: reason, onChange: (e) => setReason(e.target.value), placeholder: copyT[action][2] })), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn " + (action === "revoke" ? "danger" : "primary"), disabled: !reason.trim(), onClick: apply }, "Confirm"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => {
      setAction(null);
      setReason("");
    } }, "Cancel"))), (app.statusHistory || []).length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, app.statusHistory.slice().reverse().map((h, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "fd-file" }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { style: { fontWeight: 600 } }, fdate(h.at)), /* @__PURE__ */ React.createElement("div", { className: "fd-sub", style: { margin: 0 } }, h.reason)), /* @__PURE__ */ React.createElement(Tag, { tone: (SCH[h.status] || ["", ""])[0] }, (SCH[h.status] || ["", h.status])[1])))));
  }
  function ChangeRequests({ app, store }) {
    const pending = (app.changeRequests || []).filter((r) => r.status === "pending");
    const [rej, setRej] = useState(null);
    const [reason, setReason] = useState("");
    if (!pending.length) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { borderColor: "rgba(231,183,106,.4)" } }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Correction requests"), /* @__PURE__ */ React.createElement(Tag, { tone: "warn" }, pending.length, " waiting")), pending.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, className: "fd-file", style: { alignItems: "flex-start", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0, flex: "1 1 240px" } }, /* @__PURE__ */ React.createElement("b", { style: { fontWeight: 600 } }, r.label), /* @__PURE__ */ React.createElement("div", { className: "fd-sub", style: { margin: 0 } }, r.type === "password" ? "New password (hidden)" : /* @__PURE__ */ React.createElement(React.Fragment, null, "New value: ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text)" } }, r.value))), /* @__PURE__ */ React.createElement("small", { className: "fd-sub" }, "Requested ", fdate(r.requestedAt))), rej === r.id ? /* @__PURE__ */ React.createElement("div", { className: "fd-form", style: { flex: "1 1 100%" } }, /* @__PURE__ */ React.createElement(Field, { label: "Reason (optional, shown to the scholar)" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: reason, onChange: (e) => setReason(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn danger sm", onClick: () => {
      store.rejectChange(app.id, r.id, reason);
      setRej(null);
      setReason("");
    } }, "Decline request"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => setRej(null) }, "Cancel"))) : /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ok sm", onClick: async () => {
      const res = await store.approveChange(app.id, r.id);
      if (res && res.error) alert(res.error);
    } }, "Approve"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => {
      setRej(r.id);
      setReason("");
    } }, "Decline")))));
  }
  function ProfileBlock({ app }) {
    const p = app.profile || {}, per = p.personal || {}, hs = p.highSchool || {}, u = p.university || {};
    const lvl = window.BrialStore.DEGREE_LEVELS && window.BrialStore.DEGREE_LEVELS[u.degreeLevel];
    const docs = [["Biometric photo", per.photoFile], ["Report card", hs.raporFile], ["Student card", u.studentCardFile]];
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("details", { className: "fd-details", open: true }, /* @__PURE__ */ React.createElement("summary", null, "Personal details"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dl", { className: "fd-dl" }, /* @__PURE__ */ React.createElement(Row, { label: "Full name", value: titleCase(per.fullName || app.name) }), /* @__PURE__ */ React.createElement(Row, { label: "Date of birth", value: per.dateOfBirth ? fdate(per.dateOfBirth) : "" }), /* @__PURE__ */ React.createElement(Row, { label: "Phone", value: per.phone }), /* @__PURE__ */ React.createElement(Row, { label: "Country", value: titleCase(per.country) }), /* @__PURE__ */ React.createElement(Row, { label: "National ID", value: per.nationalId }), /* @__PURE__ */ React.createElement(Row, { label: "Email", value: app.email }), /* @__PURE__ */ React.createElement(Row, { label: "Address", value: per.address, wide: true })))), /* @__PURE__ */ React.createElement("details", { className: "fd-details" }, /* @__PURE__ */ React.createElement("summary", null, "Education"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dl", { className: "fd-dl" }, /* @__PURE__ */ React.createElement(Row, { label: "University", value: instCase(u.name) }), /* @__PURE__ */ React.createElement(Row, { label: "Study programme", value: instCase(u.program) }), /* @__PURE__ */ React.createElement(Row, { label: "Level", value: lvl ? lvl.label : u.degreeLevel }), /* @__PURE__ */ React.createElement(Row, { label: "Current semester", value: u.currentSemester }), /* @__PURE__ */ React.createElement(Row, { label: "GPA at application", value: u.currentGPA }), /* @__PURE__ */ React.createElement(Row, { label: "Tuition per semester", value: u.uktPerSemester ? money(u.uktPerSemester) : "" }), /* @__PURE__ */ React.createElement(Row, { label: "High school", value: instCase(hs.schoolName) }), /* @__PURE__ */ React.createElement(Row, { label: "Graduation year", value: hs.graduationYear }), /* @__PURE__ */ React.createElement(Row, { label: "Final grade", value: hs.finalGPA })), Array.isArray(hs.subjects) && hs.subjects.length > 0 && /* @__PURE__ */ React.createElement("dl", { className: "fd-dl", style: { marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" } }, hs.subjects.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i }, /* @__PURE__ */ React.createElement("dt", null, s.name || "Subject"), /* @__PURE__ */ React.createElement("dd", null, s.grade || "—")))))), (p.essay || "").trim() && /* @__PURE__ */ React.createElement("details", { className: "fd-details" }, /* @__PURE__ */ React.createElement("summary", null, "Essay"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { margin: 0, whiteSpace: "pre-wrap", fontFamily: "'Cormorant Garamond',serif", fontSize: 18, lineHeight: 1.6, color: "var(--muted)", maxWidth: "70ch" } }, p.essay))), /* @__PURE__ */ React.createElement("details", { className: "fd-details", open: true }, /* @__PURE__ */ React.createElement("summary", null, "Documents"), /* @__PURE__ */ React.createElement("div", null, docs.map(([l, f]) => /* @__PURE__ */ React.createElement("div", { key: l, className: "fd-file" }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("small", { className: "fd-sub", style: { margin: 0 } }, l), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 500, overflowWrap: "anywhere" } }, f ? f.name || f.filename : "Not provided")), /* @__PURE__ */ React.createElement(FileBtn, { file: f }))))));
  }
  function SemesterSnapshot({ app }) {
    const sems = app.semesters || [];
    if (!sems.length) return null;
    const G = "minmax(0,1fr) minmax(0,1.3fr) minmax(0,1.1fr) auto";
    const tone = { completed: "ok", paid: "sky", "bill-uploaded": "warn", current: "gold", upcoming: "" };
    const lab = { completed: "Complete", paid: "Paid", "bill-uploaded": "Bill in review", current: "Bill due", upcoming: "Upcoming" };
    return /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2", style: { margin: "0 0 10px" } }, "Semesters"), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", null, "Semester"), /* @__PURE__ */ React.createElement("div", null, "Tuition bill"), /* @__PURE__ */ React.createElement("div", null, "Transcript"), /* @__PURE__ */ React.createElement("div", null, "Status")), sems.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.id, className: "fd-tr", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("b", null, s.label)), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Tuition bill" }, s.bill ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", style: { padding: 0 }, onClick: () => window.BrialFiles.open(s.bill) }, /* @__PURE__ */ React.createElement("span", { className: "num", style: { fontSize: 17 } }, money(s.bill.amount))), /* @__PURE__ */ React.createElement("small", null, s.paidAt ? "Paid " + fdate(s.paidAt) : "Sent " + fdate(s.bill.uploadedAt))) : /* @__PURE__ */ React.createElement("small", null, "—")), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Transcript" }, s.ip ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", style: { padding: 0 }, onClick: () => window.BrialFiles.open(s.ip) }, "GPA ", s.ip.gpa), parseFloat(s.ip.gpa) < 2.75 && /* @__PURE__ */ React.createElement("small", { style: { color: "var(--rose)" } }, "Below 2.75")) : /* @__PURE__ */ React.createElement("small", null, "—")), /* @__PURE__ */ React.createElement("div", { className: "fd-td" }, /* @__PURE__ */ React.createElement(Tag, { tone: tone[s.status] }, lab[s.status] || s.status))))));
  }
  function ApplicantDetail({ app, store, onBack }) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const [notes, setNotes] = useState(app.notes || "");
    const [m, flash] = useFlash();
    useEffect(() => {
      setNotes(app.notes || "");
    }, [app.id]);
    return /* @__PURE__ */ React.createElement("div", { className: "fd-detail" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet fd-back", onClick: onBack }, "← All applications"), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-dhead" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, minWidth: 0 } }, /* @__PURE__ */ React.createElement(Avatar, { app }), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h3", style: { fontSize: 28 } }, titleCase(app.name)), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, instCase((_b = (_a = app.profile) == null ? void 0 : _a.university) == null ? void 0 : _b.program), ((_d = (_c = app.profile) == null ? void 0 : _c.university) == null ? void 0 : _d.name) ? ", " + instCase(app.profile.university.name) : ""), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, app.id, " · ", app.submittedAt ? "Submitted " + fdate(app.submittedAt) : "Signed up " + fdate(app.signedUpAt)))), /* @__PURE__ */ React.createElement(StageTag, { s: app.status })), /* @__PURE__ */ React.createElement("dl", { className: "fd-dl", style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement(Row, { label: "Email", value: app.email }), /* @__PURE__ */ React.createElement(Row, { label: "Country", value: titleCase((_f = (_e = app.profile) == null ? void 0 : _e.personal) == null ? void 0 : _f.country) }), /* @__PURE__ */ React.createElement(Row, { label: "GPA at application", value: (_h = (_g = app.profile) == null ? void 0 : _g.university) == null ? void 0 : _h.currentGPA }), /* @__PURE__ */ React.createElement(Row, { label: "Interview", value: app.interviewAt ? fdatetime(app.interviewAt) : "Not booked" }))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement(StagePanel, { app, store })), app.status === "accepted" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement(ScholarControls, { app, store })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement(ChangeRequests, { app, store })), app.status === "accepted" && /* @__PURE__ */ React.createElement(SemesterSnapshot, { app }), app.graduation && /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Graduation documents"), /* @__PURE__ */ React.createElement(Tag, { tone: "gold" }, fdate(app.graduation.graduatedAt))), [["Diploma (ijazah)", app.graduation.ijazahFile], ["Final transcript", app.graduation.transkripFile]].map(([l, f]) => /* @__PURE__ */ React.createElement("div", { key: l, className: "fd-file" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("small", { className: "fd-sub", style: { margin: 0 } }, l), /* @__PURE__ */ React.createElement("div", null, f ? f.name || f.filename : "Not provided")), /* @__PURE__ */ React.createElement(FileBtn, { file: f })))), /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Private notes"), /* @__PURE__ */ React.createElement(Flash, { m })), /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", value: notes, onChange: (e) => setNotes(e.target.value), onBlur: () => {
      if (notes !== (app.notes || "")) {
        store.saveNotes(app.id, notes);
        flash("Notes saved.");
      }
    }, placeholder: "Observations, recommendation, follow-up questions. Only you can see this." }), /* @__PURE__ */ React.createElement("small", { className: "fd-sub" }, "Saves when you click outside the box.")), /* @__PURE__ */ React.createElement(ProfileBlock, { app }));
  }
  function ApplicationsView({ store, apps, focus, clearFocus }) {
    const [filter, setFilter] = useState("todo");
    const [q, setQ] = useState("");
    const [sel, setSel] = useNav("fd-sel", null);
    useEffect(() => {
      if (focus) {
        setFilter("all");
        setSel(focus, { replace: true });
        clearFocus && clearFocus();
      }
    }, [focus]);
    const live = apps.filter((a) => a.status !== "registered");
    const count = (s) => apps.filter((a) => a.status === s).length;
    const items = [["todo", "To do", live.filter((a) => !["accepted", "rejected"].includes(a.status)).length], ["submitted", "To review", count("submitted")], ["interview-scheduled", "Interview booked", count("interview-scheduled")], ["interview-done", "Decision due", count("interview-done")], ["accepted", "Granted", count("accepted")], ["rejected", "Declined", count("rejected")], ["registered", "Drafts", count("registered")], ["all", "All", apps.length]];
    const list = useMemo(() => {
      const s = q.trim().toLowerCase();
      return apps.filter((a) => filter === "all" ? true : filter === "todo" ? a.status !== "registered" && !["accepted", "rejected"].includes(a.status) : a.status === filter).filter((a) => {
        var _a, _b;
        return !s || [a.name, a.email, a.id, (_b = (_a = a.profile) == null ? void 0 : _a.university) == null ? void 0 : _b.name].some((x) => (x || "").toLowerCase().includes(s));
      }).sort((a, b) => new Date(b.submittedAt || b.signedUpAt || 0) - new Date(a.submittedAt || a.signedUpAt || 0));
    }, [apps, filter, q]);
    const selected = apps.find((a) => a.id === sel) || null;
    const desktopSel = selected || (typeof window !== "undefined" && window.innerWidth > 900 ? list[0] : null);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Applications", lede: "Review applicants, book interviews and record decisions." }), /* @__PURE__ */ React.createElement("div", { className: "fd-tools" + (selected ? " has-sel" : "") }, /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Seg, { value: filter, onChange: (v) => {
      setFilter(v);
      setSel(null, { replace: true });
    }, items })), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Search, { value: q, onChange: setQ, placeholder: "Search name, email, ID or university" }))), /* @__PURE__ */ React.createElement("div", { className: "fd-md" + (selected ? " has-sel" : "") }, /* @__PURE__ */ React.createElement("div", { className: "fd-list", role: "list" }, list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "Nothing here." }, filter === "todo" ? "No applications are waiting for you." : "No applications match.") : list.map((a) => {
      var _a, _b;
      return /* @__PURE__ */ React.createElement("button", { key: a.id, className: "fd-li", role: "listitem", "aria-current": desktopSel && desktopSel.id === a.id, onClick: () => {
        setSel(a.id);
        if (window.innerWidth <= 900) window.scrollTo({ top: 0 });
      } }, /* @__PURE__ */ React.createElement("div", { className: "fd-li-top" }, /* @__PURE__ */ React.createElement("b", null, titleCase(a.name)), /* @__PURE__ */ React.createElement("span", { className: "fd-sub", style: { margin: 0, fontSize: 12 } }, rel(a.submittedAt || a.signedUpAt))), /* @__PURE__ */ React.createElement("small", null, instCase((_b = (_a = a.profile) == null ? void 0 : _a.university) == null ? void 0 : _b.name) || "—"), /* @__PURE__ */ React.createElement("div", { className: "fd-li-bot" }, /* @__PURE__ */ React.createElement(StageTag, { s: a.status }), a.isUserSubmitted && a.status === "submitted" && /* @__PURE__ */ React.createElement(Tag, { tone: "gold" }, "New")));
    })), desktopSel ? /* @__PURE__ */ React.createElement(ApplicantDetail, { key: desktopSel.id, app: desktopSel, store, onBack: () => {
      const h = history.state;
      if (h && h["nav:fd-sel"] === sel) history.back();
      else setSel(null);
    } }) : /* @__PURE__ */ React.createElement("div", { className: "fd-detail fd-card" }, /* @__PURE__ */ React.createElement(Empty, { title: "Choose an application." }))));
  }
  function PayDialog({ row, store, onClose }) {
    var _a, _b, _c;
    const [ref, setRef] = useState("");
    const { scholar: s, semester: sem } = row;
    return /* @__PURE__ */ React.createElement(Modal, { title: "Confirm payment", sub: "Record this only after the transfer has been sent.", onClose }, /* @__PURE__ */ React.createElement("dl", { className: "fd-dl" }, /* @__PURE__ */ React.createElement(Row, { label: "Scholar", value: titleCase(s.name) }), /* @__PURE__ */ React.createElement(Row, { label: "Semester", value: sem.label }), /* @__PURE__ */ React.createElement(Row, { label: "Amount", value: money((_a = sem.bill) == null ? void 0 : _a.amount) }), /* @__PURE__ */ React.createElement(Row, { label: "University", value: instCase((_c = (_b = s.profile) == null ? void 0 : _b.university) == null ? void 0 : _c.name) })), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement(FileBtn, { file: sem.bill, label: "View bill" })), /* @__PURE__ */ React.createElement(Field, { label: "Transfer reference (optional)", hint: "Bank or transaction reference, for your records.", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: ref, onChange: (e) => setRef(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", onClick: () => {
      store.payBill(s.id, sem.id, ref.trim());
      onClose();
    } }, "Mark as paid"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: onClose }, "Cancel")));
  }
  function LegacyDialog({ store, onClose }) {
    const legacy = store.getLegacy();
    const [total, setTotal] = useState(String(legacy.totalFunds || ""));
    const [rows, setRows] = useState(() => legacy.scholars && legacy.scholars.length ? legacy.scholars.map((s) => ({ ...s, amount: s.amount ? String(s.amount) : "" })) : [{ name: "", school: "", country: "", amount: "" }]);
    const setR = (i, p) => setRows((rs) => rs.map((r, k) => k === i ? { ...r, ...p } : r));
    const save = () => {
      const cleaned = rows.filter((s) => (s.school || "").trim() || (s.name || "").trim());
      store.saveLegacy({ totalFunds: parseFloat(total) || 0, count: cleaned.length, scholars: cleaned.map((s) => ({ name: (s.name || "").trim(), school: (s.school || "").trim(), country: (s.country || "").trim(), amount: parseFloat(s.amount) || 0 })) });
      onClose();
    };
    return /* @__PURE__ */ React.createElement(Modal, { wide: true, title: "Founding-era support", sub: "Scholars funded before the website existed. These count toward the public totals: funds, scholars, countries and institutions.", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Total paid before the website (USD)", style: { maxWidth: 260 } }, /* @__PURE__ */ React.createElement("div", { className: "fd-money" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", inputMode: "decimal", value: total, onChange: (e) => setTotal(e.target.value) }))), /* @__PURE__ */ React.createElement("h3", { className: "fd-h2", style: { margin: "20px 0 8px" } }, "Scholars"), /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, rows.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "fd-grid3", style: { gridTemplateColumns: "1fr 1.3fr .9fr .7fr auto", alignItems: "end" } }, /* @__PURE__ */ React.createElement(Field, { label: i === 0 ? "Name (optional)" : "" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: r.name, onChange: (e) => setR(i, { name: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: i === 0 ? "School or university" : "" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: r.school, onChange: (e) => setR(i, { school: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: i === 0 ? "Country" : "" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: r.country, onChange: (e) => setR(i, { country: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: i === 0 ? "Amount" : "" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", inputMode: "decimal", value: r.amount, onChange: (e) => setR(i, { amount: e.target.value }), placeholder: "$" })), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => setRows((rs) => rs.filter((_, k) => k !== i)), "aria-label": "Remove row" }, "×")))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => setRows((rs) => [...rs, { name: "", school: "", country: "", amount: "" }]) }, "Add scholar")), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", onClick: save }, "Save"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: onClose }, "Cancel")));
  }
  function DisbursementsView({ store, scholars }) {
    const [tab, setTab] = useState("due");
    const [pay, setPay] = useState(null);
    const [legacyOpen, setLegacyOpen] = useState(false);
    const rows = [];
    scholars.forEach((sc) => (sc.semesters || []).forEach((sem) => {
      if (sem.bill) rows.push({ scholar: sc, semester: sem });
    }));
    const due = rows.filter((r) => r.semester.status === "bill-uploaded").sort((a, b) => {
      var _a, _b;
      return new Date(((_a = a.semester.bill) == null ? void 0 : _a.uploadedAt) || 0) - new Date(((_b = b.semester.bill) == null ? void 0 : _b.uploadedAt) || 0);
    });
    const paid = rows.filter((r) => r.semester.paidAt).sort((a, b) => new Date(b.semester.paidAt) - new Date(a.semester.paidAt));
    const shown = tab === "due" ? due : paid;
    const sum = (l) => l.reduce((a, r) => {
      var _a;
      return a + (Number((_a = r.semester.bill) == null ? void 0 : _a.amount) || 0);
    }, 0);
    const legacy = store.getLegacy();
    const G = "minmax(0,1.6fr) minmax(0,.8fr) minmax(0,.8fr) minmax(0,1fr) auto";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Disbursements", lede: "Tuition bills sent by scholars. Pay the university, then mark the bill as paid." }), /* @__PURE__ */ React.createElement(Stats, { items: [{ label: "Waiting for payment", value: money(sum(due)), sub: `${due.length} ${plural(due.length, "bill", "bills")}`, tone: due.length ? "warn" : "" }, { label: "Paid through the portal", value: money(sum(paid)), sub: `${paid.length} ${plural(paid.length, "semester", "semesters")}` }, { label: "Founding-era support", value: money(legacy.totalFunds), sub: `${legacy.count || (legacy.scholars || []).length || 0} scholars` }] }), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Seg, { value: tab, onChange: setTab, items: [["due", "Waiting", due.length], ["paid", "Paid", paid.length]] }), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", style: { marginLeft: "auto" }, onClick: () => setLegacyOpen(true) }, "Founding-era support")), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", null, "Scholar"), /* @__PURE__ */ React.createElement("div", null, "Semester"), /* @__PURE__ */ React.createElement("div", null, "Amount"), /* @__PURE__ */ React.createElement("div", null, tab === "due" ? "Sent" : "Paid"), /* @__PURE__ */ React.createElement("div", null)), shown.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: tab === "due" ? "All bills are paid." : "No payments yet." }, tab === "due" ? "New bills from scholars will appear here." : "") : shown.map((r) => {
      var _a, _b, _c, _d, _e;
      return /* @__PURE__ */ React.createElement("div", { key: r.scholar.id + r.semester.id, className: "fd-tr", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("b", null, titleCase(r.scholar.name)), /* @__PURE__ */ React.createElement("small", null, r.scholar.scholarId, " · ", instCase((_b = (_a = r.scholar.profile) == null ? void 0 : _a.university) == null ? void 0 : _b.name))), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Semester" }, r.semester.label), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Amount" }, /* @__PURE__ */ React.createElement("span", { className: "num" }, money((_c = r.semester.bill) == null ? void 0 : _c.amount))), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": tab === "due" ? "Sent" : "Paid" }, fdate(tab === "due" ? (_d = r.semester.bill) == null ? void 0 : _d.uploadedAt : r.semester.paidAt), tab === "due" && ((_e = r.semester.bill) == null ? void 0 : _e.dueDate) && (() => {
        const d = Math.round((/* @__PURE__ */ new Date(r.semester.bill.dueDate + "T00:00:00") - new Date((/* @__PURE__ */ new Date()).toDateString())) / 864e5);
        return /* @__PURE__ */ React.createElement("small", { style: { color: d <= 5 ? d < 0 ? "var(--rose)" : "var(--amber)" : void 0, fontWeight: d <= 5 ? 600 : 400 } }, d < 0 ? `Deadline passed ${fdate(r.semester.bill.dueDate)}` : d === 0 ? "Due today" : `Due ${fdate(r.semester.bill.dueDate)}${d <= 5 ? ` · ${d} ${plural(d, "day", "days")}` : ""}`);
      })(), tab === "paid" && r.semester.txHash && /* @__PURE__ */ React.createElement("small", { className: "fd-mono" }, r.semester.txHash)), /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement(FileBtn, { file: r.semester.bill, label: "View bill" }), tab === "due" && /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary sm", onClick: () => setPay(r) }, "Mark as paid"))));
    })), pay && /* @__PURE__ */ React.createElement(PayDialog, { row: pay, store, onClose: () => setPay(null) }), legacyOpen && /* @__PURE__ */ React.createElement(LegacyDialog, { store, onClose: () => setLegacyOpen(false) }));
  }
  function PasswordDialog({ app, store, onClose }) {
    const [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [show, setShow] = useState(false), [err, setErr] = useState(null), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
    const go = async () => {
      setErr(null);
      if (pw.length < 8) return setErr("Use at least 8 characters.");
      if (pw !== pw2) return setErr("The passwords don't match.");
      setBusy(true);
      const r = await store.updateAccount(app.id, { password: pw });
      setBusy(false);
      if (r && r.error) return setErr(r.error);
      setDone(true);
    };
    return /* @__PURE__ */ React.createElement(Modal, { title: "Set a new password", sub: `For ${titleCase(app.name)} (${app.email}). They will be signed out of other devices.`, onClose }, done ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fd-msg ok" }, "Password updated. Share it with ", titleCase(app.name).split(" ")[0], " through a private channel."), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", onClick: onClose }, "Done"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement(Field, { label: "New password", hint: "At least 8 characters." }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: show ? "text" : "password", autoComplete: "new-password", value: pw, onChange: (e) => setPw(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Repeat password" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: show ? "text" : "password", autoComplete: "new-password", value: pw2, onChange: (e) => setPw2(e.target.value) })), /* @__PURE__ */ React.createElement("label", { className: "fd-switch", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: show, onChange: (e) => setShow(e.target.checked), style: { accentColor: "#C9A961" } }), "Show passwords"), err && /* @__PURE__ */ React.createElement("div", { className: "fd-msg err" }, err)), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: busy, onClick: go }, busy ? "Saving…" : "Save password"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: onClose }, "Cancel"))));
  }
  function ScholarsView({ store, scholars, openRecord }) {
    const [pw, setPw] = useState(null);
    const [filter, setFilter] = useState("all");
    const by = (s) => scholars.filter((a) => (a.scholarStatus || "active") === s).length;
    const shown = scholars.filter((a) => filter === "all" || (a.scholarStatus || "active") === filter);
    const totalPaid = scholars.reduce((a, s) => a + (s.semesters || []).filter((x) => x.paidAt).reduce((b, x) => {
      var _a;
      return b + (Number((_a = x.bill) == null ? void 0 : _a.amount) || 0);
    }, 0), 0);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Scholars", lede: "Everyone who holds a scholarship, with their progress at a glance." }), /* @__PURE__ */ React.createElement(Stats, { items: [{ label: "Active scholars", value: by("active"), tone: "ok" }, { label: "Paused", value: by("suspended"), tone: by("suspended") ? "warn" : "" }, { label: "Graduated", value: by("graduated") }, { label: "Paid to date", value: money(totalPaid) }] }), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Seg, { value: filter, onChange: setFilter, items: [["all", "All", scholars.length], ["active", "Active", by("active")], ["suspended", "Paused", by("suspended")], ["graduated", "Graduated", by("graduated")], ["revoked", "Ended", by("revoked")]] })), /* @__PURE__ */ React.createElement("div", { className: "fd-grid2", style: { gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" } }, shown.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement(Empty, { title: "No scholars here." })) : shown.map((sc) => {
      var _a, _b;
      const sems = sc.semesters || [];
      const paidN = sems.filter((x) => x.paidAt).length;
      const due = sems.filter((x) => x.status === "bill-uploaded").length;
      const recv = sems.filter((x) => x.paidAt).reduce((a, x) => {
        var _a2;
        return a + (Number((_a2 = x.bill) == null ? void 0 : _a2.amount) || 0);
      }, 0);
      const ipk = store.cumulativeIPK(sc);
      const st = SCH[sc.scholarStatus || "active"] || SCH.active;
      return /* @__PURE__ */ React.createElement("div", { key: sc.id, className: "fd-card", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14 } }, /* @__PURE__ */ React.createElement(Avatar, { app: sc }), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0, flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("b", { style: { fontWeight: 600, fontSize: 15 } }, titleCase(sc.name)), /* @__PURE__ */ React.createElement(Tag, { tone: st[0], dot: true }, st[1])), /* @__PURE__ */ React.createElement("small", { className: "fd-sub", style: { display: "block", margin: "2px 0 0" } }, sc.scholarId, " · ", String(sc.cohort || "").replace(/^Class of\s*/i, "Class of ")), /* @__PURE__ */ React.createElement("small", { className: "fd-sub", style: { display: "block", margin: 0 } }, instCase((_b = (_a = sc.profile) == null ? void 0 : _a.university) == null ? void 0 : _b.name)))), /* @__PURE__ */ React.createElement("dl", { className: "fd-dl", style: { gridTemplateColumns: "repeat(3,1fr)", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", null, "Received"), /* @__PURE__ */ React.createElement("dd", null, money(recv))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", null, "Semesters paid"), /* @__PURE__ */ React.createElement("dd", null, paidN, " / ", sems.length)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", null, "GPA"), /* @__PURE__ */ React.createElement("dd", { style: { color: ipk && ipk.value < 2.75 ? "var(--rose)" : void 0 } }, ipk ? ipk.value.toFixed(2) : "—"))), due > 0 && /* @__PURE__ */ React.createElement("div", { className: "fd-msg info", style: { marginTop: 12 } }, due, " ", plural(due, "bill", "bills"), " waiting for payment"), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => openRecord(sc.id) }, "Open record"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => setPw(sc) }, "Set new password")));
    })), pw && /* @__PURE__ */ React.createElement(PasswordDialog, { app: pw, store, onClose: () => setPw(null) }));
  }
  function QR({ value }) {
    const qr = useMemo(() => {
      try {
        const lib = window.qrcode || window._qrLib;
        if (!lib || !value || !value.trim()) return null;
        const q = lib(0, "M");
        q.addData(value.trim());
        q.make();
        const n = q.getModuleCount();
        let d = "";
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
        return { d, n };
      } catch (e) {
        return null;
      }
    }, [value]);
    if (!qr) return null;
    return /* @__PURE__ */ React.createElement("span", { className: "fd-qr" }, /* @__PURE__ */ React.createElement("svg", { width: "96", height: "96", viewBox: `0 0 ${qr.n} ${qr.n}`, shapeRendering: "crispEdges" }, /* @__PURE__ */ React.createElement("path", { d: qr.d, fill: "#0A1628" })));
  }
  function ChannelsDialog({ store, onClose }) {
    const [cfg, setCfg] = useState(() => store.getPaymentConfig());
    const set = (g, k, v) => setCfg((p) => ({ ...p, [g]: { ...p[g], [k]: v } }));
    const on = (g) => cfg[g].enabled !== false;
    const head = (g, title) => /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("h3", { className: "fd-h2" }, title), /* @__PURE__ */ React.createElement(Switch, { on: on(g), onChange: (v) => set(g, "enabled", v) }, on(g) ? "Shown" : "Hidden"));
    const cardBad = cfg.card.link && !/^https?:\/\//i.test(cfg.card.link.trim());
    return /* @__PURE__ */ React.createElement(Modal, { wide: true, title: "Payment channels", sub: "How donors can give on the public donate page.", onClose }, /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { background: "rgba(10,22,40,.4)" } }, head("usdt", "USDT (on-chain)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "fd-form", style: { flex: "1 1 300px" } }, /* @__PURE__ */ React.createElement(Field, { label: "Wallet address" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input fd-mono", value: cfg.usdt.address, onChange: (e) => set("usdt", "address", e.target.value), spellCheck: false })), /* @__PURE__ */ React.createElement("div", { className: "fd-grid3" }, /* @__PURE__ */ React.createElement(Field, { label: "Network" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: cfg.usdt.network, onChange: (e) => set("usdt", "network", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Asset" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: cfg.usdt.asset, onChange: (e) => set("usdt", "asset", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Confirmations" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "number", min: "1", value: cfg.usdt.confirmations, onChange: (e) => set("usdt", "confirmations", e.target.value) })))), /* @__PURE__ */ React.createElement(QR, { value: cfg.usdt.address }))), /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { background: "rgba(10,22,40,.4)" } }, head("bank", "Bank transfer"), /* @__PURE__ */ React.createElement("div", { className: "fd-grid2" }, /* @__PURE__ */ React.createElement(Field, { label: "Bank" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: cfg.bank.bank, onChange: (e) => set("bank", "bank", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Account number" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: cfg.bank.account, onChange: (e) => set("bank", "account", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Account holder" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: cfg.bank.holder, onChange: (e) => set("bank", "holder", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Currency label" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: cfg.bank.currency, onChange: (e) => set("bank", "currency", e.target.value) })))), /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { background: "rgba(10,22,40,.4)" } }, head("card", "Card (Mastercard / Visa)"), /* @__PURE__ */ React.createElement(Field, { label: "Checkout page", hint: "The card button on the donate page opens this address in a new tab." }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: cfg.card.link, onChange: (e) => set("card", "link", e.target.value), placeholder: "https://lynk.id/brial/s/…" })), cardBad && /* @__PURE__ */ React.createElement("div", { className: "fd-msg err", style: { marginTop: 8 } }, "Use a full address that starts with https://")), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: cardBad, onClick: () => {
      store.savePaymentConfig(cfg);
      onClose();
    } }, "Save channels"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: onClose }, "Cancel")));
  }
  const okEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || "").trim());
  function useReceipts(store, dep) {
    const [map, setMap] = useState({});
    const alive = useRef(true);
    const load = useCallback(() => {
      if (!store.mailReceipts) return;
      store.mailReceipts().then((m) => {
        if (alive.current) setMap(m || {});
      }).catch(() => {
      });
    }, [store]);
    useEffect(() => {
      alive.current = true;
      load();
      return () => {
        alive.current = false;
      };
    }, [load, dep]);
    return [map, load];
  }
  function receiptLine(d, r) {
    if (!r) return { text: "Receipt number is being issued…", tone: "" };
    const m = r.mail;
    const base = "Receipt " + r.no;
    if (!m) return okEmail(d.email) ? { text: base + " · not emailed", tone: "" } : { text: base + " · no email on file", tone: "" };
    if (m.status === "sent") return { text: `${base} · emailed ${fdate(m.sentAt)}`, tone: "ok" };
    if (m.status === "pending" || m.status === "sending") return { text: base + " · waiting to send", tone: "warn" };
    if (m.status === "skipped") return { text: `${base} · not sent (${m.error || "skipped"})`, tone: "" };
    return { text: `${base} · could not be sent`, tone: "bad" };
  }
  function ReceiptDialog({ store, d, r, onClose, onSent }) {
    const [to, setTo] = useState(d.email || "");
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState("");
    const [m, flash] = useFlash();
    const send = async () => {
      setBusy("send");
      try {
        const res = await store.sendReceipt(d.id, to.trim(), note.trim());
        flash(`Receipt ${res.no} is on its way to ${res.to}.`);
        onSent && onSent();
      } catch (e) {
        const c = String(e && (e.message || e));
        flash(c.indexOf("invalid_email") >= 0 ? "That email address doesn't look right." : "Could not send right now. Try again in a moment.", "err");
      }
      setBusy("");
    };
    const pdf = async () => {
      setBusy("pdf");
      try {
        await store.downloadReceiptPdf(d.id);
      } catch (e) {
        flash("Could not create the PDF right now.", "err");
      }
      setBusy("");
    };
    const line = receiptLine(d, r);
    return /* @__PURE__ */ React.createElement(Modal, { title: r ? `Receipt ${r.no}` : "Receipt", sub: `${d.anonymous ? "Anonymous" : titleCase(d.name)} · ${money(d.amount)} · verified ${fdate(d.verifiedAt)}`, onClose }, /* @__PURE__ */ React.createElement("p", { className: "fd-rc " + line.tone, style: { textAlign: "left", marginTop: 0 } }, line.text, r && r.mail && r.mail.status === "failed" && r.mail.error ? ` — ${r.mail.error}` : ""), /* @__PURE__ */ React.createElement(Field, { label: "Send the receipt to", hint: "Usually the donor's own address." }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "email", value: to, onChange: (e) => setTo(e.target.value), placeholder: "donor@example.com" })), /* @__PURE__ */ React.createElement(Field, { label: "Personal note (optional)", hint: "Shown above the receipt, signed with your name. Leave empty for the standard receipt.", style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", rows: 4, maxLength: 2e3, value: note, onChange: (e) => setNote(e.target.value), placeholder: "Dear …, thank you for…" })), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !okEmail(to) || !!busy, onClick: send }, busy === "send" ? "Sending…" : "Send receipt"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", disabled: !!busy, onClick: pdf }, ICON.pdf, busy === "pdf" ? "Preparing…" : "Download PDF")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement(Flash, { m })));
  }
  function DonationsView({ store, donations, title }) {
    const [filter, setFilter] = useState("pending");
    const [q, setQ] = useState("");
    const [chan, setChan] = useState(false);
    const [open, setOpen] = useState(null);
    const [vm, vflash] = useFlash();
    const list = (donations || []).filter((d) => !(store.isInternalDonation && store.isInternalDonation(d))).slice().sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    const isSale = (d) => !!(d.data && (d.data.sale || d.data.enterprise)) || /^(SALE|ENT)-/.test(String(d.id || ""));
    const verified = list.filter((d) => d.verified), pending = list.filter((d) => !d.verified);
    const sum = (l) => l.reduce((a, d) => a + (Number(d.amount) || 0), 0);
    const shown = list.filter((d) => filter === "pending" ? !d.verified : filter === "verified" ? d.verified : filter === "anonymous" ? d.anonymous : true).filter((d) => {
      const s = q.trim().toLowerCase();
      return !s || [d.name, d.email, d.country, d.txHash, d.id].some((x) => (x || "").toLowerCase().includes(s));
    });
    const cfg = store.getPaymentConfig();
    const [rc, reloadRc] = useReceipts(store, verified.length);
    const verify = (d) => {
      const p = store.markDonationVerified(d.id);
      vflash(okEmail(d.email) ? `Verified. The receipt is being emailed to ${d.email}.` : "Verified. There is no email on file — download the receipt PDF if the donor asks for one.");
      Promise.resolve(p).then(() => {
        setTimeout(reloadRc, 1500);
        setTimeout(reloadRc, 8e3);
      }).catch(() => vflash("Could not verify — check your connection.", "err"));
    };
    const G = "minmax(0,1.8fr) minmax(0,.7fr) minmax(0,1.3fr) minmax(0,.8fr) auto";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: title || "Donations", lede: "Gifts reported through the donate page. Check each one against your wallet or bank, then verify it — only verified gifts are final." }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => setChan(true) }, "Payment channels")), /* @__PURE__ */ React.createElement(Stats, { items: [{ label: "Verified gifts", value: money(sum(verified)), sub: `${verified.length} ${plural(verified.length, "gift", "gifts")}`, tone: "ok" }, { label: "Waiting for verification", value: money(sum(pending)), sub: `${pending.length} reported`, tone: pending.length ? "warn" : "" }, { label: "Channels on the donate page", value: ["usdt", "bank", "card"].filter((g) => cfg[g].enabled !== false).length, sub: [cfg.usdt.enabled !== false && "USDT", cfg.bank.enabled !== false && cfg.bank.bank, cfg.card.enabled !== false && "Card"].filter(Boolean).join(", ") }] }), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Seg, { value: filter, onChange: setFilter, items: [["pending", "To verify", pending.length], ["verified", "Verified", verified.length], ["anonymous", "Anonymous", list.filter((d) => d.anonymous).length], ["all", "All", list.length]] })), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Search, { value: q, onChange: setQ, placeholder: "Search donor, email, country or reference" })), vm && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(Flash, { m: vm })), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", null, "Donor"), /* @__PURE__ */ React.createElement("div", null, "Amount"), /* @__PURE__ */ React.createElement("div", null, "Reference"), /* @__PURE__ */ React.createElement("div", null, "Date"), /* @__PURE__ */ React.createElement("div", null)), shown.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: filter === "pending" ? "Nothing to verify." : "No donations match." }) : shown.map((d) => {
      const eth = /^0x[0-9a-f]{10,}$/i.test(d.txHash || "");
      return /* @__PURE__ */ React.createElement("div", { key: d.id, className: "fd-tr", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("b", null, d.anonymous ? "Anonymous" : d.name, d.anonymous && d.name && d.name !== "Anonymous patron" ? /* @__PURE__ */ React.createElement("span", { className: "fd-sub", style: { fontWeight: 400 } }, " (", d.name, ")") : null), /* @__PURE__ */ React.createElement("small", null, [d.email, d.country].filter(Boolean).join(" · ")), d.message && /* @__PURE__ */ React.createElement("small", { style: { fontStyle: "italic" } }, "“", d.message, "”"), isSale(d) && /* @__PURE__ */ React.createElement(Tag, { tone: "sky" }, "Library sale")), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Amount" }, /* @__PURE__ */ React.createElement("span", { className: "num" }, money(d.amount))), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Reference" }, d.txHash ? /* @__PURE__ */ React.createElement(React.Fragment, null, eth ? /* @__PURE__ */ React.createElement("a", { className: "fd-mono", href: `https://etherscan.io/tx/${d.txHash}`, target: "_blank", rel: "noopener noreferrer" }, d.txHash.slice(0, 10), "…", d.txHash.slice(-6)) : /* @__PURE__ */ React.createElement("span", { className: "fd-mono" }, d.txHash), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => copy(d.txHash) }, "Copy")) : /* @__PURE__ */ React.createElement("small", null, "—")), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Date" }, fdate(d.submittedAt)), /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { justifyContent: "flex-end" } }, d.verified ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Tag, { tone: "ok", dot: true }, "Verified"), !isSale(d) && /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => setOpen(d.id) }, "Receipt")) : /* @__PURE__ */ React.createElement(Confirm, { className: "fd-btn ok sm", armedLabel: okEmail(d.email) ? "Confirm · email receipt" : "Confirm verify", onConfirm: () => verify(d) }, "Verify"), /* @__PURE__ */ React.createElement(Confirm, { onConfirm: () => store.deleteDonation(d.id) }, "Delete")), d.verified && !isSale(d) && (() => {
        const l = receiptLine(d, rc[d.id]);
        return /* @__PURE__ */ React.createElement("small", { className: "fd-rc " + l.tone }, l.text);
      })()));
    })), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { marginTop: 12 } }, "Grants to partners are listed under each pillar, not here. Verifying a gift issues its receipt number and emails the receipt to the donor."), chan && /* @__PURE__ */ React.createElement(ChannelsDialog, { store, onClose: () => setChan(false) }), open && (() => {
      const d = list.find((x) => x.id === open);
      return d ? /* @__PURE__ */ React.createElement(ReceiptDialog, { store, d, r: rc[d.id], onClose: () => setOpen(null), onSent: () => {
        setTimeout(reloadRc, 1500);
        setTimeout(reloadRc, 8e3);
      } }) : null;
    })());
  }
  function HelpDeskView({ store, reports }) {
    const [filter, setFilter] = useState("open");
    const [reply, setReply] = useState(null);
    const [text, setText] = useState("");
    const c = (s) => reports.filter((r) => r.status === s).length;
    const shown = reports.filter((r) => filter === "all" || r.status === filter).slice().sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    const cat = { technical: "Technical", data: "Details", payment: "Payment", other: "Other" };
    const who = (r) => store.getApplicant(r.applicantId) || {};
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Help desk", lede: "Messages from applicants and scholars. Your reply appears in their portal straight away." }), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Seg, { value: filter, onChange: setFilter, items: [["open", "Open", c("open")], ["replied", "Replied", c("replied")], ["resolved", "Resolved", c("resolved")], ["all", "All", reports.length]] })), shown.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement(Empty, { title: filter === "open" ? "No open messages." : "Nothing here." })) : shown.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2", style: { fontSize: 16 } }, r.subject), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, [titleCase(r.applicantName || who(r).name), r.applicantEmail || who(r).email, r.applicantId, fdate(r.submittedAt)].filter(Boolean).join(" · "))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, r.category && /* @__PURE__ */ React.createElement(Tag, null, cat[r.category] || r.category), /* @__PURE__ */ React.createElement(Tag, { tone: r.status === "resolved" ? "ok" : r.status === "replied" ? "sky" : "warn", dot: true }, r.status === "resolved" ? "Resolved" : r.status === "replied" ? "Replied" : "Open"))), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, whiteSpace: "pre-wrap", color: "var(--muted)" } }, r.message), r.reply && reply !== r.id && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, padding: "12px 16px", borderLeft: "2px solid var(--gilt)", background: "rgba(201,169,97,.06)", borderRadius: "0 10px 10px 0" } }, /* @__PURE__ */ React.createElement("small", { style: { color: "var(--gilt2)", fontWeight: 600 } }, "Your reply · ", fdate(r.reply.at)), /* @__PURE__ */ React.createElement("p", { style: { margin: "4px 0 0", whiteSpace: "pre-wrap" } }, r.reply.text)), reply === r.id ? /* @__PURE__ */ React.createElement("div", { className: "fd-form", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: `Reply to ${titleCase(r.applicantName || who(r).name || "").split(" ")[0] || "the sender"}` }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", autoFocus: true, value: text, onChange: (e) => setText(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !text.trim(), onClick: () => {
      store.replyReport(r.id, text.trim());
      setReply(null);
      setText("");
    } }, "Send reply"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => setReply(null) }, "Cancel"))) : /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 14 } }, r.status !== "resolved" && /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary sm", onClick: () => {
      var _a;
      setReply(r.id);
      setText(((_a = r.reply) == null ? void 0 : _a.text) || "");
    } }, r.reply ? "Edit reply" : "Reply"), r.status !== "resolved" && /* @__PURE__ */ React.createElement("button", { className: "fd-btn ok sm", onClick: () => store.resolveReport(r.id) }, "Mark resolved"), /* @__PURE__ */ React.createElement(Confirm, { onConfirm: () => store.deleteReport(r.id) }, "Delete")))));
  }
  function download(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5e3);
  }
  const csv = (v) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const stamp = (p, ext) => {
    const d = /* @__PURE__ */ new Date(), z = (n) => String(n).padStart(2, "0");
    return `${p}_${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}.${ext}`;
  };
  function accountsCSV(apps) {
    const H = ["ID", "Name", "Email", "Status", "Scholar ID", "Cohort", "Scholar status", "Signed up", "Submitted", "Interview", "Interview done", "Accepted", "Declined", "Country", "Phone", "Date of birth", "National ID", "High school", "Graduation year", "Final grade", "Level", "University", "Programme", "Current semester", "Current GPA", "Tuition per semester (USD)", "Essay (excerpt)", "Notes"];
    const rows = apps.map((a) => {
      const p = a.profile || {}, per = p.personal || {}, hs = p.highSchool || {}, u = p.university || {};
      return [a.id, a.name, a.email, a.status, a.scholarId || "", a.cohort || "", a.scholarStatus || "", a.signedUpAt || "", a.submittedAt || "", a.interviewAt || "", a.interviewDoneAt || "", a.acceptedAt || "", a.rejectedAt || "", per.country, per.phone, per.dateOfBirth, per.nationalId, hs.schoolName, hs.graduationYear, hs.finalGPA, u.degreeLevel, u.name, u.program, u.currentSemester, u.currentGPA, u.uktPerSemester, (p.essay || "").slice(0, 280), a.notes || ""].map(csv).join(",");
    });
    return H.map(csv).join(",") + "\n" + rows.join("\n") + "\n";
  }
  function BackupCard({ store, apps }) {
    const [mode, setMode] = useState("merge");
    const [res, setRes] = useState(null);
    const [busy, setBusy] = useState(false);
    const [armed, setArmed] = useState(false);
    const ref = useRef(null);
    const onFile = async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      setBusy(true);
      setRes(null);
      try {
        const data = JSON.parse(await f.text());
        const r = await store.importSnapshot(data, { mergeMode: mode });
        setRes(r);
      } catch (err) {
        setRes({ ok: false, error: "This file is not a valid backup: " + (err.message || err) });
      } finally {
        setBusy(false);
        setArmed(false);
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Backup and restore"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Download a copy every week. The spreadsheet opens in Excel; the backup file can restore everything."))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => download(stamp("brial_accounts", "csv"), "\uFEFF" + accountsCSV(apps), "text/csv;charset=utf-8") }, "Download spreadsheet (CSV)"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => download(stamp("brial_backup", "json"), JSON.stringify(store.exportSnapshot(), null, 2), "application/json") }, "Download backup (JSON)")), /* @__PURE__ */ React.createElement("details", { className: "fd-details", style: { background: "rgba(10,22,40,.35)" } }, /* @__PURE__ */ React.createElement("summary", null, "Restore from a backup file"), /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement(Seg, { value: mode, onChange: (v) => {
      setMode(v);
      setArmed(false);
    }, items: [["merge", "Merge (safe)"], ["replace", "Replace everything"]] }), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: 0 } }, mode === "merge" ? "Accounts in the file overwrite accounts with the same ID; new ones are added; everything else stays." : "Every applicant and donation is deleted and replaced by the file. Use only to rebuild after a fresh install."), /* @__PURE__ */ React.createElement("input", { ref, type: "file", accept: ".json,application/json", onChange: onFile, style: { display: "none" } }), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, mode === "replace" && !armed ? /* @__PURE__ */ React.createElement("button", { className: "fd-btn danger", onClick: () => setArmed(true) }, "I understand — choose file") : /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: busy, onClick: () => ref.current && ref.current.click() }, busy ? "Restoring…" : "Choose backup file")), res && /* @__PURE__ */ React.createElement("div", { className: "fd-msg " + (res.ok ? "ok" : "err") }, res.ok ? res.mode === "replace" ? `Restored — ${res.count} accounts loaded.` : `Merged — ${res.updated} accounts updated or added.` : res.error))));
  }
  function AccountsView({ store, apps, deleted, openRecord }) {
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    const [pw, setPw] = useState(null);
    const [del, setDel] = useState(null);
    const days = (d) => Math.max(0, Math.ceil((30 * 864e5 - (Date.now() - new Date(d).getTime())) / 864e5));
    const c = (s) => apps.filter((a) => a.status === s).length;
    const shown = apps.filter((a) => filter === "all" || a.status === filter).filter((a) => {
      var _a, _b;
      const s = q.trim().toLowerCase();
      return !s || [a.name, a.email, a.id, (_b = (_a = a.profile) == null ? void 0 : _a.university) == null ? void 0 : _b.name].some((x) => (x || "").toLowerCase().includes(s));
    });
    const G = "minmax(0,1.5fr) minmax(0,1.5fr) minmax(0,.9fr) auto";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Accounts", lede: "Every portal account. Passwords are stored as secure hashes — nobody can read them, but you can set a new one." }), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Seg, { value: filter, onChange: setFilter, items: [["all", "All", apps.length], ["registered", "Drafts", c("registered")], ["submitted", "To review", c("submitted")], ["interview-scheduled", "Interview", c("interview-scheduled")], ["interview-done", "Decision due", c("interview-done")], ["accepted", "Granted", c("accepted")], ["rejected", "Declined", c("rejected")]] })), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Search, { value: q, onChange: setQ, placeholder: "Search name, email, ID or university" })), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", null, "Name"), /* @__PURE__ */ React.createElement("div", null, "Email"), /* @__PURE__ */ React.createElement("div", null, "Status"), /* @__PURE__ */ React.createElement("div", null)), shown.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "No accounts match." }) : shown.map((a) => /* @__PURE__ */ React.createElement("div", { key: a.id, className: "fd-tr", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("b", null, titleCase(a.name)), /* @__PURE__ */ React.createElement("small", null, a.id, a.scholarId ? " · " + a.scholarId : "")), /* @__PURE__ */ React.createElement("div", { className: "fd-td full", "data-l": "Email" }, /* @__PURE__ */ React.createElement("span", { style: { overflowWrap: "anywhere" } }, a.email), " ", /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => copy(a.email) }, "Copy")), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Status" }, /* @__PURE__ */ React.createElement(StageTag, { s: a.status })), /* @__PURE__ */ React.createElement("div", { className: "fd-td" }, /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => openRecord(a.id) }, "Open"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => setPw(a) }, "New password"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn danger sm", onClick: () => setDel(a) }, "Delete")))))), /* @__PURE__ */ React.createElement("details", { className: "fd-details" }, /* @__PURE__ */ React.createElement("summary", null, "Trash (", (deleted || []).length, ")"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { marginTop: 0 } }, "Deleted accounts are kept for 30 days, then removed for good."), (deleted || []).length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "The trash is empty.") : deleted.map((a) => /* @__PURE__ */ React.createElement("div", { key: a.id, className: "fd-file", style: { flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { style: { fontWeight: 600 } }, titleCase(a.name)), /* @__PURE__ */ React.createElement("div", { className: "fd-sub", style: { margin: 0 } }, a.email, " · deleted ", fdate(a.deletedAt), " · ", days(a.deletedAt), " days left")), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => store.restoreApplicant(a.id) }, "Restore"), /* @__PURE__ */ React.createElement(Confirm, { onConfirm: () => store.purgeApplicant(a.id), armedLabel: "Click again — this is permanent" }, "Delete forever")))))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement(BackupCard, { store, apps })), pw && /* @__PURE__ */ React.createElement(PasswordDialog, { app: pw, store, onClose: () => setPw(null) }), del && /* @__PURE__ */ React.createElement(Modal, { title: `Move ${titleCase(del.name)} to the trash?`, sub: `${del.email} (${del.id}) disappears from every list. You can restore it within 30 days.`, onClose: () => setDel(null) }, /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn danger", onClick: () => {
      store.softDeleteApplicant(del.id);
      setDel(null);
    } }, "Move to trash"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => setDel(null) }, "Cancel"))));
  }
  const C_IN = "#199e70", C_OUT = "#c98500";
  const kmoney = (n) => {
    const v = Number(n) || 0;
    return v >= 1e4 ? "$" + Math.round(v / 1e3) + "k" : v >= 1e3 ? "$" + (v / 1e3).toFixed(1).replace(/\.0$/, "") + "k" : "$" + Math.round(v);
  };
  const monthKey = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? null : d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  };
  const isSaleD = (d) => !!(d.data && d.data.sale) || String(d.id || "").indexOf("SALE-") === 0;
  const isEntD = (d) => !!(d.data && d.data.enterprise) || String(d.id || "").indexOf("ENT-") === 0;
  function useFlows(store) {
    const donations = (store.listDonations() || []).filter((d) => !(store.isInternalDonation && store.isInternalDonation(d)));
    const income = donations.map((d) => ({
      id: d.id,
      dir: "in",
      date: d.submittedAt || d.data && d.data.sale && d.data.sale.date || null,
      category: isEntD(d) ? "Enterprise" : isSaleD(d) ? "Library sale" : "Gift",
      title: isEntD(d) ? (d.data && d.data.enterprise && d.data.enterprise.name || "Enterprise") + (d.data && d.data.enterprise && d.data.enterprise.period ? " · " + d.data.enterprise.period : "") : isSaleD(d) ? d.data && d.data.sale ? d.data.sale.title : d.name : d.anonymous ? "Anonymous" : d.name || "Donor",
      detail: isEntD(d) ? ["Transportation pillar", d.message].filter(Boolean).join(" · ") : isSaleD(d) ? (d.data && d.data.sale && d.data.sale.qty > 1 ? d.data.sale.qty + " copies" : "1 copy") + (d.message ? " · " + d.message : "") : [d.country, d.message ? "“" + d.message + "”" : ""].filter(Boolean).join(" · "),
      amount: Number(d.amount) || 0,
      ref: d.txHash || "",
      settled: !!d.verified,
      raw: d
    }));
    const scholars = store.listApplicants().filter((a) => a.status === "accepted");
    const tuition = [], due = [];
    scholars.forEach((sc) => (sc.semesters || []).forEach((sem) => {
      var _a, _b;
      if (!sem.bill) return;
      const row = { scholar: sc, semester: sem };
      if (sem.paidAt) tuition.push({ id: sc.id + ":" + sem.id, dir: "out", date: sem.paidAt, category: "Tuition", pillar: "Scholarships", title: titleCase(sc.name), detail: [sem.label, instCase((_b = (_a = sc.profile) == null ? void 0 : _a.university) == null ? void 0 : _b.name)].filter(Boolean).join(" · "), amount: Number(sem.bill.amount) || 0, ref: sem.txHash || "", settled: true, row });
      else if (sem.status === "bill-uploaded") due.push(row);
    }));
    const allGrants = store.getPillarGrants();
    const grants = allGrants.map((g) => ({ id: g.id, dir: "out", date: g.date, category: "Grant", pillar: g.pillar, title: g.project || "Grant", detail: [g.partner, g.country].filter(Boolean).join(" · "), amount: Number(g.amount) || 0, ref: g.txRef || "", settled: !g.archived, archived: !!g.archived }));
    const legacy = store.getLegacy();
    const legacyRow = Number(legacy.totalFunds) > 0 ? [{ id: "LEGACY", dir: "out", date: null, category: "Founding era", pillar: "Scholarships", title: "Support before the website", detail: `${legacy.count || (legacy.scholars || []).length || 0} scholars, recorded as one total`, amount: Number(legacy.totalFunds) || 0, ref: "", settled: true }] : [];
    const outflow = [...tuition, ...grants, ...legacyRow];
    const sum = (l) => l.reduce((a, x) => a + (Number(x.amount) || 0), 0);
    const received = income.filter((x) => x.settled), pendingIn = income.filter((x) => !x.settled);
    const paidOut = outflow.filter((x) => x.settled);
    const dueSum = due.reduce((a, r) => {
      var _a;
      return a + (Number((_a = r.semester.bill) == null ? void 0 : _a.amount) || 0);
    }, 0);
    return { income, received, pendingIn, outflow, paidOut, due, dueSum, sum, legacy, scholars };
  }
  function InOutChart({ inRows, outRows }) {
    const [hover, setHover] = useState(null);
    const now = /* @__PURE__ */ new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"), label: d.toLocaleDateString("en-GB", { month: "short" }), long: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }), inn: 0, out: 0 });
    }
    const at = {};
    months.forEach((m) => {
      at[m.key] = m;
    });
    inRows.forEach((x) => {
      const k = monthKey(x.date);
      if (k && at[k]) at[k].inn += x.amount;
    });
    outRows.forEach((x) => {
      const k = monthKey(x.date);
      if (k && at[k]) at[k].out += x.amount;
    });
    const peak = Math.max(0, ...months.map((m) => Math.max(m.inn, m.out)));
    const nice = (v) => {
      if (v <= 0) return 100;
      const p = Math.pow(10, Math.floor(Math.log10(v)));
      const f = v / p;
      return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
    };
    const top = nice(peak);
    const h = (v) => (v > 0 ? Math.max(2, v / top * 100) : 0) + "%";
    const totalIn = months.reduce((a, m) => a + m.inn, 0), totalOut = months.reduce((a, m) => a + m.out, 0);
    return /* @__PURE__ */ React.createElement("div", { className: "fd-ch" }, /* @__PURE__ */ React.createElement("div", { className: "fd-ch-legend", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { style: { background: C_IN } }), "Money in ", /* @__PURE__ */ React.createElement("b", null, money(totalIn))), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { style: { background: C_OUT } }), "Money out ", /* @__PURE__ */ React.createElement("b", null, money(totalOut)))), /* @__PURE__ */ React.createElement("div", { className: "fd-ch-plot", role: "img", "aria-label": `Money in and out by month, last 12 months. In ${money(totalIn)}, out ${money(totalOut)}.` }, [1, 0.5, 0].map((f) => /* @__PURE__ */ React.createElement("div", { key: f, className: "fd-ch-grid", style: { bottom: f * 100 + "%" } }, /* @__PURE__ */ React.createElement("span", null, kmoney(top * f)))), /* @__PURE__ */ React.createElement("div", { className: "fd-ch-cols" }, months.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.key, className: "fd-ch-col" + (hover === m.key ? " on" : ""), tabIndex: 0, onMouseEnter: () => setHover(m.key), onMouseLeave: () => setHover(null), onFocus: () => setHover(m.key), onBlur: () => setHover(null), "aria-label": `${m.long}: in ${money(m.inn)}, out ${money(m.out)}` }, /* @__PURE__ */ React.createElement("div", { className: "fd-ch-bars" }, /* @__PURE__ */ React.createElement("i", { style: { height: h(m.inn), background: C_IN } }), /* @__PURE__ */ React.createElement("i", { style: { height: h(m.out), background: C_OUT } })), /* @__PURE__ */ React.createElement("span", { className: "fd-ch-x" }, m.label), hover === m.key && /* @__PURE__ */ React.createElement("div", { className: "fd-ch-tip" }, /* @__PURE__ */ React.createElement("b", null, m.long), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("i", { style: { background: C_IN } }), "In", /* @__PURE__ */ React.createElement("span", null, money(m.inn))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("i", { style: { background: C_OUT } }), "Out", /* @__PURE__ */ React.createElement("span", null, money(m.out)))))))));
  }
  const MoveRow = ({ x, G, showDir }) => /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-mv", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("b", null, x.title), x.detail && /* @__PURE__ */ React.createElement("small", null, x.detail)), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Category" }, /* @__PURE__ */ React.createElement(Tag, { tone: x.dir === "in" ? "ok" : "gold" }, x.category), x.pillar && x.category !== "Tuition" && x.category !== "Founding era" && /* @__PURE__ */ React.createElement("small", null, x.pillar), x.archived && /* @__PURE__ */ React.createElement("small", { style: { color: "var(--amber)" } }, "Archived · not counted"), x.dir === "in" && !x.settled && /* @__PURE__ */ React.createElement("small", { style: { color: "var(--amber)" } }, "Not verified yet")), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Date" }, x.date ? fdate(x.date) : "Before 2026", x.ref && /* @__PURE__ */ React.createElement("small", { className: "fd-mono", title: x.ref }, x.ref.length > 18 ? x.ref.slice(0, 10) + "…" + x.ref.slice(-5) : x.ref)), /* @__PURE__ */ React.createElement("div", { className: "fd-td fd-amt", "data-l": "Amount" }, /* @__PURE__ */ React.createElement("span", { className: "num " + (x.dir === "in" ? "in" : "out") }, showDir ? x.dir === "in" ? "+" : "−" : "", money(x.amount))));
  function TreasuryOverview({ store, go }) {
    const F = useFlows(store);
    const pub = store.getPublicMetrics ? store.getPublicMetrics() : null;
    const byPillar = {};
    F.paidOut.forEach((x) => {
      byPillar[x.pillar] = (byPillar[x.pillar] || 0) + x.amount;
    });
    const pillars = Object.entries(byPillar).sort((a, b) => b[1] - a[1]);
    const maxP = Math.max(1, ...pillars.map((p) => p[1]));
    const outTotal = F.sum(F.paidOut);
    const recent = [...F.received, ...F.paidOut].filter((x) => x.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
    const G = "minmax(0,1.7fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,.7fr)";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Treasury", lede: "Everything that comes into the endowment and everything it gives out, in one place." }), /* @__PURE__ */ React.createElement(Stats, { items: [
      { label: "Received", value: money(F.sum(F.received)), sub: `${F.received.filter((x) => x.category === "Gift").length} gifts · ${F.received.filter((x) => x.category === "Library sale").length} library sales` + (F.received.some((x) => x.category === "Enterprise") ? ` · ${F.received.filter((x) => x.category === "Enterprise").length} enterprise` : ""), tone: "ok" },
      { label: "Distributed", value: money(outTotal), sub: pub && Math.abs(pub.disbursed - outTotal) < 0.01 ? "Same as the public site" : "Tuition, grants and founding era" },
      { label: "Waiting for verification", value: money(F.sum(F.pendingIn)), sub: `${F.pendingIn.length} ${plural(F.pendingIn.length, "gift", "gifts")}`, tone: F.pendingIn.length ? "warn" : "" },
      { label: "Bills to pay", value: money(F.dueSum), sub: `${F.due.length} ${plural(F.due.length, "bill", "bills")}`, tone: F.due.length ? "warn" : "" }
    ] }), (F.pendingIn.length > 0 || F.due.length > 0) && /* @__PURE__ */ React.createElement("div", { className: "fd-attn" }, F.pendingIn.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "fd-attn-i" }, /* @__PURE__ */ React.createElement("span", { className: "fd-dot warn" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, F.pendingIn.length, " ", plural(F.pendingIn.length, "gift needs", "gifts need"), " checking"), /* @__PURE__ */ React.createElement("small", null, "Match each one with your wallet or bank, then verify it.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => go("in") }, "Review")), F.due.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "fd-attn-i" }, /* @__PURE__ */ React.createElement("span", { className: "fd-dot warn" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, F.due.length, " tuition ", plural(F.due.length, "bill is", "bills are"), " waiting"), /* @__PURE__ */ React.createElement("small", null, money(F.dueSum), " to pay to universities.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => go("out") }, "Pay"))), /* @__PURE__ */ React.createElement("div", { className: "fd-tgrid" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Last 12 months"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Verified money in and money paid out, by month.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => go("ledger") }, "See the ledger")), /* @__PURE__ */ React.createElement(InOutChart, { inRows: F.received, outRows: F.paidOut })), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Where it went"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Distributed, by pillar."))), pillars.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Nothing distributed yet.") : /* @__PURE__ */ React.createElement("div", { className: "fd-bars" }, pillars.map(([name, v]) => /* @__PURE__ */ React.createElement("div", { key: name, className: "fd-bar" }, /* @__PURE__ */ React.createElement("div", { className: "fd-bar-t" }, /* @__PURE__ */ React.createElement("span", null, name), /* @__PURE__ */ React.createElement("b", null, money(v))), /* @__PURE__ */ React.createElement("div", { className: "fd-bar-track" }, /* @__PURE__ */ React.createElement("i", { style: { width: Math.max(1.5, v / maxP * 100) + "%", background: C_OUT } })), /* @__PURE__ */ React.createElement("small", null, Math.round(v / (outTotal || 1) * 100), "% of all giving")))))), /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { margin: "26px 0 12px" } }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Recent movements"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => go("ledger") }, "View all")), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", null, "Description"), /* @__PURE__ */ React.createElement("div", null, "Category"), /* @__PURE__ */ React.createElement("div", null, "Date · reference"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, "Amount")), recent.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "No movements yet." }) : recent.map((x) => /* @__PURE__ */ React.createElement(MoveRow, { key: x.dir + x.id, x, G, showDir: true }))));
  }
  function MoneyOutView({ store }) {
    const F = useFlows(store);
    const [tab, setTab] = useState(F.due.length ? "due" : "paid");
    const [pillar, setPillar] = useState("all");
    const [q, setQ] = useState("");
    const [pay, setPay] = useState(null);
    const [legacyOpen, setLegacyOpen] = useState(false);
    const pillarsUsed = [...new Set(F.outflow.map((x) => x.pillar))];
    const s = q.trim().toLowerCase();
    const list = F.outflow.filter((x) => (tab === "archived" ? x.archived : !x.archived) && (pillar === "all" || x.pillar === pillar) && (!s || [x.title, x.detail, x.ref, x.pillar].some((v) => (v || "").toLowerCase().includes(s)))).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const G = "minmax(0,1.7fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,.7fr)";
    const GD = "minmax(0,1.6fr) minmax(0,.8fr) minmax(0,.8fr) minmax(0,1fr) auto";
    const archivedN = F.outflow.filter((x) => x.archived).length;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Money out", lede: "Tuition paid to universities, grants to partners, and support given before the website." }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => setLegacyOpen(true) }, "Founding-era support")), /* @__PURE__ */ React.createElement(Stats, { items: [
      { label: "Distributed", value: money(F.sum(F.paidOut)), sub: `${F.paidOut.length} ${plural(F.paidOut.length, "payment", "payments")}` },
      { label: "Tuition", value: money(F.sum(F.paidOut.filter((x) => x.category === "Tuition"))), sub: `${F.paidOut.filter((x) => x.category === "Tuition").length} semesters` },
      { label: "Grants", value: money(F.sum(F.paidOut.filter((x) => x.category === "Grant"))), sub: `${F.paidOut.filter((x) => x.category === "Grant").length} grants` },
      { label: "Bills to pay", value: money(F.dueSum), sub: `${F.due.length} ${plural(F.due.length, "bill", "bills")}`, tone: F.due.length ? "warn" : "" }
    ] }), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Seg, { value: tab, onChange: setTab, items: [["due", "To pay", F.due.length], ["paid", "Paid", F.paidOut.length], ...archivedN ? [["archived", "Archived grants", archivedN]] : []] })), tab === "due" ? /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: GD } }, /* @__PURE__ */ React.createElement("div", null, "Scholar"), /* @__PURE__ */ React.createElement("div", null, "Semester"), /* @__PURE__ */ React.createElement("div", null, "Amount"), /* @__PURE__ */ React.createElement("div", null, "Sent"), /* @__PURE__ */ React.createElement("div", null)), F.due.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "Nothing to pay." }, "New tuition bills from scholars will appear here.") : F.due.map((r) => {
      var _a, _b, _c, _d;
      return /* @__PURE__ */ React.createElement("div", { key: r.scholar.id + r.semester.id, className: "fd-tr", style: { gridTemplateColumns: GD } }, /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("b", null, titleCase(r.scholar.name)), /* @__PURE__ */ React.createElement("small", null, r.scholar.scholarId, " · ", instCase((_b = (_a = r.scholar.profile) == null ? void 0 : _a.university) == null ? void 0 : _b.name))), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Semester" }, r.semester.label), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Amount" }, /* @__PURE__ */ React.createElement("span", { className: "num" }, money((_c = r.semester.bill) == null ? void 0 : _c.amount))), /* @__PURE__ */ React.createElement("div", { className: "fd-td", "data-l": "Sent" }, fdate((_d = r.semester.bill) == null ? void 0 : _d.uploadedAt)), /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement(FileBtn, { file: r.semester.bill, label: "View bill" }), /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary sm", onClick: () => setPay(r) }, "Mark as paid"))));
    })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Seg, { value: pillar, onChange: setPillar, items: [["all", "All pillars"], ...pillarsUsed.map((p) => [p, p])] }), /* @__PURE__ */ React.createElement(Search, { value: q, onChange: setQ, placeholder: "Search scholar, project, partner or reference" })), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", null, "Paid to"), /* @__PURE__ */ React.createElement("div", null, "Category"), /* @__PURE__ */ React.createElement("div", null, "Date · reference"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, "Amount")), list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "Nothing here." }) : list.map((x) => /* @__PURE__ */ React.createElement(MoveRow, { key: x.id, x, G })), list.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-tfoot", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", { className: "fd-td full" }, /* @__PURE__ */ React.createElement("b", null, list.length, " ", plural(list.length, "payment", "payments"))), /* @__PURE__ */ React.createElement("div", null), /* @__PURE__ */ React.createElement("div", null), /* @__PURE__ */ React.createElement("div", { className: "fd-td fd-amt" }, /* @__PURE__ */ React.createElement("span", { className: "num" }, money(F.sum(list)))))), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { marginTop: 10 } }, "Grants are recorded inside each pillar. Archived grants stay on record but are not counted in the totals.")), pay && /* @__PURE__ */ React.createElement(PayDialog, { row: pay, store, onClose: () => setPay(null) }), legacyOpen && /* @__PURE__ */ React.createElement(LegacyDialog, { store, onClose: () => setLegacyOpen(false) }));
  }
  function LedgerView({ store }) {
    const F = useFlows(store);
    const [dir, setDir] = useState("all");
    const [year, setYear] = useState("all");
    const [q, setQ] = useState("");
    const settled = [...F.received, ...F.paidOut];
    const years = [...new Set(settled.map((x) => x.date ? new Date(x.date).getFullYear() : null).filter(Boolean))].sort((a, b) => b - a);
    const s = q.trim().toLowerCase();
    const list = settled.filter((x) => (dir === "all" || x.dir === dir) && (year === "all" || x.date && new Date(x.date).getFullYear() === Number(year) || year === "early" && !x.date) && (!s || [x.title, x.detail, x.ref, x.category, x.pillar].some((v) => (v || "").toLowerCase().includes(s)))).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const tin = F.sum(list.filter((x) => x.dir === "in")), tout = F.sum(list.filter((x) => x.dir === "out"));
    const G = "minmax(0,1.7fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,.7fr)";
    const exportCSV = () => {
      const H = ["Date", "Direction", "Category", "Pillar", "Description", "Details", "Amount (USD)", "Reference"];
      const rows = list.map((x) => [x.date ? new Date(x.date).toISOString().slice(0, 10) : "before 2026", x.dir === "in" ? "In" : "Out", x.category, x.pillar || "", x.title, x.detail, (x.dir === "in" ? "" : "-") + (Number(x.amount) || 0).toFixed(2), x.ref].map(csv).join(","));
      download(stamp("brial-ledger", "csv"), "\uFEFF" + H.map(csv).join(",") + "\n" + rows.join("\n") + "\n", "text/csv;charset=utf-8");
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Ledger", lede: "Every settled movement — verified gifts and sales in, payments out. Unverified gifts and unpaid bills are left out until they settle." }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: exportCSV, disabled: !list.length }, "Download CSV")), /* @__PURE__ */ React.createElement("div", { className: "fd-toolbar" }, /* @__PURE__ */ React.createElement(Seg, { value: dir, onChange: setDir, items: [["all", "All", settled.length], ["in", "Money in", F.received.length], ["out", "Money out", F.paidOut.length]] }), /* @__PURE__ */ React.createElement("select", { className: "fd-input", style: { width: "auto" }, value: year, onChange: (e) => setYear(e.target.value), "aria-label": "Year" }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All years"), years.map((y) => /* @__PURE__ */ React.createElement("option", { key: y, value: y }, y)), F.paidOut.some((x) => !x.date) && /* @__PURE__ */ React.createElement("option", { value: "early" }, "Before 2026")), /* @__PURE__ */ React.createElement(Search, { value: q, onChange: setQ, placeholder: "Search description or reference" })), /* @__PURE__ */ React.createElement("div", { className: "fd-table" }, /* @__PURE__ */ React.createElement("div", { className: "fd-tr fd-th", style: { gridTemplateColumns: G } }, /* @__PURE__ */ React.createElement("div", null, "Description"), /* @__PURE__ */ React.createElement("div", null, "Category"), /* @__PURE__ */ React.createElement("div", null, "Date · reference"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, "Amount")), list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "No movements match." }) : list.map((x) => /* @__PURE__ */ React.createElement(MoveRow, { key: x.dir + x.id, x, G, showDir: true }))), list.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "fd-totals" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Money in"), /* @__PURE__ */ React.createElement("b", { className: "in" }, "+", money(tin))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Money out"), /* @__PURE__ */ React.createElement("b", { className: "out" }, "−", money(tout))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Difference"), /* @__PURE__ */ React.createElement("b", null, tin - tout < 0 ? "−" : "", money(Math.abs(tin - tout))))));
  }
  function ChannelsView({ store }) {
    const [open, setOpen] = useState(false);
    const c = store.getPaymentConfig();
    const rows = [
      ["usdt", "USDT (on-chain)", c.usdt.enabled !== false, [c.usdt.network, c.usdt.asset].filter(Boolean).join(" · "), c.usdt.address],
      ["bank", "Bank transfer", c.bank.enabled !== false, [c.bank.bank, c.bank.currency].filter(Boolean).join(" · "), [c.bank.account, c.bank.holder].filter(Boolean).join(" · ")],
      ["card", "Card (Mastercard / Visa)", c.card.enabled !== false, "Checkout page", c.card.link]
    ];
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Payment channels", lede: "How donors can give on the public donate page." }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", onClick: () => setOpen(true) }, "Edit channels")), /* @__PURE__ */ React.createElement("div", { className: "fd-chans" }, rows.map(([k, name, on, sub, val]) => /* @__PURE__ */ React.createElement("div", { key: k, className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, name), /* @__PURE__ */ React.createElement(Tag, { tone: on ? "ok" : "", dot: true }, on ? "Shown" : "Hidden")), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: 0 } }, sub), /* @__PURE__ */ React.createElement("p", { className: "fd-mono", style: { margin: "10px 0 0", fontSize: 12.5, overflowWrap: "anywhere", color: "var(--muted)" } }, val || "Not set")))), open && /* @__PURE__ */ React.createElement(ChannelsDialog, { store, onClose: () => setOpen(false) }));
  }
  const SITE_URL = "https://brialendowment.org";
  const reportUrl = (y) => SITE_URL + "/impact/" + y;
  const normKey = (s) => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const isChainTx = (h) => /^0x[0-9a-f]{64}$/i.test(String(h || "").trim());
  const ymdOf = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toISOString().slice(0, 10);
  };
  const newReport = (year, founding) => ({
    id: "IR-" + year,
    year,
    founding: !!founding,
    status: "draft",
    title: founding ? "Founding Year " + year : "Impact Report " + year,
    intro: "",
    cover: "",
    coverCaption: "",
    letter: "",
    signName: "Brial Asif Hayi Paka",
    signRole: "Founder",
    stories: [],
    plans: "",
    showMoney: false,
    showGifts: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  const newStory = () => ({ id: "st-" + Date.now().toString(36), title: "", text: "", photo: "", caption: "", consent: false });
  function computeImpact(store, rep) {
    const F = useFlows(store);
    const from = rep.founding ? null : /* @__PURE__ */ new Date(rep.year + "-01-01T00:00:00");
    const to = /* @__PURE__ */ new Date(rep.year + "-12-31T23:59:59");
    const within = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      if (isNaN(d)) return false;
      return (!from || d >= from) && d <= to;
    };
    const gifts = F.received.filter((x) => x.category === "Gift" && within(x.date));
    const sales = F.received.filter((x) => x.category === "Library sale" && within(x.date));
    const enterprise = F.received.filter((x) => x.category === "Enterprise" && within(x.date));
    const donors = /* @__PURE__ */ new Set(), countries = /* @__PURE__ */ new Map();
    gifts.forEach((x) => {
      const d = x.raw || {};
      donors.add(normKey(d.email || d.name || x.id));
      const c = String(d.country || "").trim();
      if (c && !countries.has(normKey(c))) countries.set(normKey(c), c);
    });
    const copies = sales.reduce((a, x) => a + (Number(x.raw && x.raw.data && x.raw.data.sale && x.raw.data.sale.qty) || 1), 0);
    const out = F.paidOut.filter((x) => x.id === "LEGACY" ? rep.founding : within(x.date));
    const byPillar = {};
    out.forEach((x) => {
      const k = x.pillar || "Scholarships";
      byPillar[k] = byPillar[k] || { amount: 0, count: 0 };
      byPillar[k].amount += x.amount;
      byPillar[k].count += 1;
    });
    const units = {};
    store.getPillarGrants().filter((g) => !g.archived && within(g.date)).forEach((g) => {
      const cfg = Object.values(PILLARS).find((p) => p.grantName === g.pillar);
      const n = Math.max(0, Math.round(Number(g.units) || 0));
      if (!n) return;
      units[g.pillar] = units[g.pillar] || { n: 0, unit: cfg && cfg.unit ? cfg.unit : ["unit", "units"] };
      units[g.pillar].n += n;
    });
    const scholars = F.scholars.filter((s) => !s.deleted && (!s.acceptedAt || new Date(s.acceptedAt) <= to));
    const nations = /* @__PURE__ */ new Map(), insts = /* @__PURE__ */ new Set();
    const addNation = (c) => {
      c = String(c || "").trim();
      if (c && !nations.has(normKey(c))) nations.set(normKey(c), c);
    };
    scholars.forEach((s) => {
      var _a, _b, _c, _d;
      addNation((_b = (_a = s.profile) == null ? void 0 : _a.personal) == null ? void 0 : _b.country);
      const u = String(((_d = (_c = s.profile) == null ? void 0 : _c.university) == null ? void 0 : _d.name) || "").trim();
      if (u) insts.add(normKey(u));
    });
    const legacy = F.legacy || {};
    const legacyScholars = rep.founding ? legacy.scholars || [] : [];
    legacyScholars.forEach((s) => {
      addNation(s.country);
      if (s.school) insts.add(normKey(s.school));
    });
    const legacyCount = rep.founding ? Number(legacy.count) || legacyScholars.length || 0 : 0;
    store.getPillarGrants().filter((g) => !g.archived && within(g.date)).forEach((g) => addNation(g.country));
    const semesters = F.scholars.reduce((a, s) => a + (s.semesters || []).filter((x) => x.paidAt && x.bill && within(x.paidAt)).length, 0);
    const newScholars = F.scholars.filter((s) => s.acceptedAt && within(s.acceptedAt)).length;
    const proofs = [
      ...gifts.filter((x) => isChainTx(x.ref)).map((x) => ({ kind: "Gift received", date: ymdOf(x.date), amount: x.amount, hash: x.ref.trim() })),
      ...out.filter((x) => isChainTx(x.ref)).map((x) => ({ kind: x.category === "Tuition" ? "Tuition paid" : x.pillar + " grant", date: ymdOf(x.date), amount: x.amount, hash: x.ref.trim() }))
    ].sort((a, b) => a.date < b.date ? -1 : 1);
    const pillarNames = Object.keys(byPillar);
    if (scholars.length + legacyCount > 0 && pillarNames.indexOf("Scholarships") < 0) pillarNames.unshift("Scholarships");
    return {
      computedAt: (/* @__PURE__ */ new Date()).toISOString(),
      period: { label: rep.founding ? "From the beginning to 31 December " + rep.year : "1 January to 31 December " + rep.year, from: from ? ymdOf(from) : null, to: rep.year + "-12-31" },
      people: { scholars: scholars.length + legacyCount, newScholars, nations: nations.size, nationList: [...nations.values()], institutions: insts.size, semesters },
      pillars: pillarNames,
      built: Object.entries(units).map(([pillar, u]) => ({ pillar, n: u.n, label: u.n === 1 ? u.unit[0] : u.unit[1] })),
      gifts: { count: gifts.length, donors: donors.size, countries: countries.size },
      money: {
        received: F.sum(gifts),
        sales: F.sum(sales),
        copies,
        enterprise: F.sum(enterprise),
        given: F.sum(out),
        byPillar: Object.entries(byPillar).map(([pillar, v]) => ({ pillar, amount: v.amount, count: v.count })).sort((a, b) => b.amount - a.amount),
        proofs
      }
    };
  }
  const publicPart = (snap, rep) => ({
    computedAt: snap.computedAt,
    period: snap.period,
    people: snap.people,
    pillars: snap.pillars,
    built: snap.built,
    gifts: rep.showGifts ? snap.gifts : null,
    money: rep.showMoney ? snap.money : null
  });
  const reportForPublic = (rep, snap) => {
    const { snapshot, notes, ...rest } = rep;
    return { ...rest, public: publicPart(snap, rep) };
  };
  function ImpactView({ store }) {
    const all = store.getImpactReports ? store.getImpactReports() : [];
    const years = all.map((r) => Number(r.year)).sort((a, b) => b - a);
    const nowYear = (/* @__PURE__ */ new Date()).getFullYear();
    const [sel, setSel] = useNav("fd-impact-year", years.length ? years[0] : null);
    const saved = all.find((r) => Number(r.year) === Number(sel)) || null;
    const [f, setF] = useState(saved);
    const [base, setBase] = useState(JSON.stringify(saved));
    const [busy, setBusy] = useState("");
    const [mailOpen, setMailOpen] = useState(false);
    const [m, flash] = useFlash();
    useEffect(() => {
      setF(saved);
      setBase(JSON.stringify(saved));
    }, [sel, saved && saved.updatedAt]);
    const dirty = f && JSON.stringify(f) !== base;
    useEffect(() => {
      const h = (e) => {
        if (dirty) {
          e.preventDefault();
          e.returnValue = "";
        }
      };
      window.addEventListener("beforeunload", h);
      return () => window.removeEventListener("beforeunload", h);
    }, [dirty]);
    const start = (year, founding) => {
      if (all.some((r2) => Number(r2.year) === year)) {
        setSel(year);
        return;
      }
      const r = newReport(year, founding);
      store.saveImpactReports([...all, { ...r, updatedAt: r.createdAt }]).catch(() => flash("Could not save. Check your connection.", "err"));
      setSel(year);
    };
    if (!all.length || !f) {
      const first = !all.length;
      const y = first ? 2026 : Math.max(nowYear, (years[0] || nowYear) + 1);
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Impact Report", lede: "One report a year, published on the website and as a PDF. The numbers come from the Treasury and the scholar records. You add the words." }), /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { maxWidth: 760 } }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, first ? "Start your first report" : "Choose a report"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, first ? "The founding report covers everything from the very beginning to 31 December 2026." : "Open an existing report, or start the next one."), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 14 } }, years.map((yy) => /* @__PURE__ */ React.createElement("button", { key: yy, className: "fd-btn ghost", onClick: () => setSel(yy) }, yy)), /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", onClick: () => start(y, first) }, first ? "Start Founding Year 2026" : "Start the " + y + " report"))));
    }
    const published = f.status === "published";
    const snap = published && f.snapshot ? f.snapshot : computeImpact(store, f);
    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const setStory = (id, patch) => setF((p) => ({ ...p, stories: p.stories.map((s) => s.id === id ? { ...s, ...patch } : s) }));
    const moveStory = (i, d) => setF((p) => {
      const n = p.stories.slice();
      const j = i + d;
      if (j < 0 || j >= n.length) return p;
      [n[i], n[j]] = [n[j], n[i]];
      return { ...p, stories: n };
    });
    const missingConsent = (f.stories || []).filter((s) => (s.title.trim() || s.text.trim() || s.photo) && !s.consent).length;
    const commit = async (next, msg) => {
      const list = all.filter((r) => Number(r.year) !== Number(next.year));
      const rec = { ...next, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      if (rec.status === "published") rec.public = publicPart(rec.snapshot, rec);
      setBusy("save");
      try {
        await store.saveImpactReports([...list, rec]);
        setF(rec);
        setBase(JSON.stringify(rec));
        flash(msg);
      } catch (e) {
        flash("Could not save. Check your connection and try again.", "err");
      }
      setBusy("");
    };
    const save = () => commit(f, published ? "Saved. The public report is updated." : "Draft saved.");
    const publish = () => {
      const s = computeImpact(store, f);
      commit({ ...f, status: "published", snapshot: s, publishedAt: f.publishedAt || (/* @__PURE__ */ new Date()).toISOString() }, "Published. The report is live on the website.");
    };
    const unpublish = () => commit({ ...f, status: "draft", public: null, snapshot: null }, "Back to draft. The public page no longer shows this report.");
    const preview = (print) => {
      try {
        localStorage.setItem("brial-impact-preview", JSON.stringify(reportForPublic(f, snap)));
      } catch (e) {
      }
      window.open("/impact/" + f.year + "?preview=1" + (print ? "&print=1" : ""), "_blank", "noopener");
    };
    const P = snap.people, G = snap.gifts, M = snap.money;
    const donorList = (() => {
      const seen = /* @__PURE__ */ new Map();
      (store.listDonations() || []).forEach((d) => {
        if (store.isInternalDonation && store.isInternalDonation(d) || !d.verified || isSaleD(d) || isEntD(d)) return;
        const e = String(d.email || "").trim();
        if (!okEmail(e)) return;
        const k = e.toLowerCase();
        if (!seen.has(k)) seen.set(k, { email: e, name: d.anonymous ? "" : d.name || "" });
      });
      return [...seen.values()];
    })();
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Impact Report", lede: "One report a year, published on the website and as a PDF. The numbers come from the Treasury and the scholar records. You add the words." }, years.length > 1 && /* @__PURE__ */ React.createElement(Seg, { items: years.map((y) => [y, String(y)]), value: Number(sel), onChange: (v) => {
      if (dirty) flash("Save or discard your changes first.", "err");
      else setSel(v);
    } }), !years.includes(Math.max(nowYear, years[0] + 1)) && published && /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => start(Math.max(nowYear, years[0] + 1), false) }, "Start ", Math.max(nowYear, years[0] + 1))), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, f.title || "Untitled report"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, published ? `Published ${fdate(f.publishedAt)}. Numbers frozen on ${fdate(snap.computedAt)}.` : "Draft. Only you can see it until you publish.")), /* @__PURE__ */ React.createElement(Tag, { tone: published ? "ok" : "gold", dot: true }, published ? "Live on the website" : "Draft")), /* @__PURE__ */ React.createElement("div", { className: "fd-grid2", style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "Title" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.title, onChange: (e) => set("title", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Period", hint: published ? "Unpublish to change the period." : null }, /* @__PURE__ */ React.createElement("select", { className: "fd-input", value: f.founding ? "all" : "year", disabled: published, onChange: (e) => set("founding", e.target.value === "all") }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "From the beginning to 31 Dec ", f.year), /* @__PURE__ */ React.createElement("option", { value: "year" }, "1 Jan to 31 Dec ", f.year))))), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "The numbers"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, snap.period.label, ". ", published ? "Frozen when you published." : "Updated live from your records until you publish."))), /* @__PURE__ */ React.createElement(Stats, { items: [
      { label: "Scholars supported", value: String(P.scholars), sub: `${P.newScholars} new this period` },
      { label: "Nations", value: String(P.nations), sub: P.nationList.join(", ") || "None yet" },
      { label: "Pillars at work", value: String(snap.pillars.length), sub: snap.pillars.join(", ") || "None yet" },
      { label: "Semesters funded", value: String(P.semesters), sub: `${P.institutions} ${plural(P.institutions, "institution", "institutions")}` }
    ] }), snap.built.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { marginTop: 10 } }, "Built and planted: ", snap.built.map((b) => `${b.n} ${b.label} (${b.pillar})`).join(", "), "."), /* @__PURE__ */ React.createElement("div", { className: "fd-krow", style: { display: "grid", gap: 12, marginTop: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Show money amounts"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: "2px 0 0" } }, f.showMoney ? `Visible: ${money(M.received)} received, ${money(M.given)} given, ${M.proofs.length} on-chain ${plural(M.proofs.length, "proof", "proofs")}.` : "Hidden. The report shows people, places and pillars, but no dollar figures and no transaction links. The amounts never leave the database.")), /* @__PURE__ */ React.createElement(Switch, { on: !!f.showMoney, onChange: (v) => set("showMoney", v) }, f.showMoney ? "Shown" : "Hidden")), /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Show the number of gifts and donors"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: "2px 0 0" } }, f.showGifts ? `Visible: ${G.count} ${plural(G.count, "gift", "gifts")} from ${G.donors} ${plural(G.donors, "donor", "donors")}.` : "Hidden.", " Donor names are never shown.")), /* @__PURE__ */ React.createElement(Switch, { on: !!f.showGifts, onChange: (v) => set("showGifts", v) }, f.showGifts ? "Shown" : "Hidden")))), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Opening"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "A cover photo and a few lines that set the tone for the year."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "center", margin: "12px 0", flexWrap: "wrap" } }, f.cover ? /* @__PURE__ */ React.createElement(Img, { className: "fd-cover", src: f.cover, style: { width: 180, height: 110, objectFit: "cover" } }) : /* @__PURE__ */ React.createElement("div", { className: "fd-cover", style: { width: 180, height: 110 } }, "No cover"), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement(PhotoUpload, { onUploaded: (meta) => set("cover", meta.url || (meta.path ? window.brialSupabase.publicUrl(meta.path) : "")) }, f.cover ? "Replace cover" : "Upload cover"), f.cover && /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => set("cover", "") }, "Remove"))), /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, f.cover && /* @__PURE__ */ React.createElement(Field, { label: "Cover caption" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.coverCaption, onChange: (e) => set("coverCaption", e.target.value), placeholder: "Where and when the photo was taken" })), /* @__PURE__ */ React.createElement(Field, { label: "Opening words", hint: "Two or three sentences. Shown under the title." }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", value: f.intro, onChange: (e) => set("intro", e.target.value) })))), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Letter from the founder"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Write to the people who made the year possible. Leave a blank line between paragraphs."), /* @__PURE__ */ React.createElement("div", { className: "fd-form", style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", style: { minHeight: 220 }, value: f.letter, onChange: (e) => set("letter", e.target.value), "aria-label": "Letter from the founder" }), /* @__PURE__ */ React.createElement("div", { className: "fd-grid2" }, /* @__PURE__ */ React.createElement(Field, { label: "Signed by" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.signName, onChange: (e) => set("signName", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Role" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.signRole, onChange: (e) => set("signRole", e.target.value) }))))), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Stories of the year"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "A well, a grove, a first semester. Each story needs the permission of anyone it names or shows.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => setF((p) => ({ ...p, stories: [...p.stories || [], newStory()] })) }, "Add a story")), (f.stories || []).length === 0 && /* @__PURE__ */ React.createElement(Empty, { title: "No stories yet." }, "Stories are optional, but they are what people remember."), (f.stories || []).map((s, i) => /* @__PURE__ */ React.createElement("div", { key: s.id, className: "fd-card", style: { background: "rgba(10,22,40,.4)", marginTop: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement(Field, { label: "Story " + (i + 1) + " title" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: s.title, onChange: (e) => setStory(s.id, { title: e.target.value }), placeholder: "A well for the village" })), /* @__PURE__ */ React.createElement(Field, { label: "Story" }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", value: s.text, onChange: (e) => setStory(s.id, { text: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" } }, s.photo ? /* @__PURE__ */ React.createElement(Img, { className: "fd-cover", src: s.photo, style: { width: 120, height: 80, objectFit: "cover" } }) : null, /* @__PURE__ */ React.createElement(PhotoUpload, { onUploaded: (meta) => setStory(s.id, { photo: meta.url || (meta.path ? window.brialSupabase.publicUrl(meta.path) : "") }) }, s.photo ? "Replace photo" : "Add photo"), s.photo && /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => setStory(s.id, { photo: "", caption: "" }) }, "Remove photo")), s.photo && /* @__PURE__ */ React.createElement(Field, { label: "Photo caption" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: s.caption, onChange: (e) => setStory(s.id, { caption: e.target.value }) })), /* @__PURE__ */ React.createElement("label", { className: "fd-switch", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: !!s.consent, onChange: (e) => setStory(s.id, { consent: e.target.checked }), style: { accentColor: "#C9A961" } }), "Everyone this story names or shows has agreed to it being published.")), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", disabled: i === 0, onClick: () => moveStory(i, -1) }, "Move up"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", disabled: i === f.stories.length - 1, onClick: () => moveStory(i, 1) }, "Move down"), /* @__PURE__ */ React.createElement(Confirm, { onConfirm: () => setF((p) => ({ ...p, stories: p.stories.filter((x) => x.id !== s.id) })) }, "Remove story"))))), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "The year ahead"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "What you hope to plant next."), /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", style: { marginTop: 12 }, value: f.plans, onChange: (e) => set("plans", e.target.value), "aria-label": "The year ahead" })), published && /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Share it"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, reportUrl(f.year), f.emailedAt ? ` · Emailed to ${f.emailedCount} ${plural(f.emailedCount, "donor", "donors")} on ${fdate(f.emailedAt)}.` : "")), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("a", { className: "fd-btn ghost sm", href: "/impact/" + f.year, target: "_blank", rel: "noopener noreferrer" }, "Open public page ", ICON.ext), /* @__PURE__ */ React.createElement("a", { className: "fd-btn ghost sm", href: "/impact/" + f.year + "?print=1", target: "_blank", rel: "noopener noreferrer" }, ICON.pdf, " Download PDF"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => copy(reportUrl(f.year)) }, "Copy link"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary sm", disabled: !donorList.length, onClick: () => setMailOpen(true) }, "Email donors")))), /* @__PURE__ */ React.createElement("div", { className: "fd-savebar" }, /* @__PURE__ */ React.createElement("div", { className: "fd-sub", style: { margin: 0 } }, missingConsent ? `${missingConsent} ${plural(missingConsent, "story needs", "stories need")} permission before publishing.` : dirty ? "You have unsaved changes." : published ? "Everything is saved and live." : "Everything is saved.", " ", /* @__PURE__ */ React.createElement(Flash, { m })), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, dirty && /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet", onClick: () => setF(JSON.parse(base)) }, "Discard"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => preview(false) }, "Preview"), published ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Confirm, { className: "fd-btn quiet", armedLabel: "Click again to unpublish", onConfirm: unpublish }, "Unpublish"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !dirty || !!busy || missingConsent > 0, onClick: save }, busy ? "Saving…" : "Save changes")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", disabled: !dirty || !!busy, onClick: save }, "Save draft"), /* @__PURE__ */ React.createElement(Confirm, { className: "fd-btn primary", armedLabel: "Click again to publish", disabled: !!busy || missingConsent > 0 || !f.title.trim(), onConfirm: publish }, "Publish")))), mailOpen && /* @__PURE__ */ React.createElement(ImpactMail, { store, rep: f, donors: donorList, onClose: () => setMailOpen(false), onSent: (n) => commit({ ...f, emailedAt: (/* @__PURE__ */ new Date()).toISOString(), emailedCount: (f.emailedCount || 0) + n }, `Sent to ${n} ${plural(n, "donor", "donors")}.`) }));
  }
  function ImpactMail({ store, rep, donors, onClose, onSent }) {
    const [pick, setPick] = useState(() => donors.map((d) => d.email));
    const [subject, setSubject] = useState(`${rep.title}: what your gift became`);
    const [body, setBody] = useState(`Dear friend,

Your gift helped make this year possible, and we would like you to see what it became. Our ${rep.title} report is now published:

${reportUrl(rep.year)}

Thank you for trusting us with something meant to outlast us all.

With gratitude,`);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const toggle = (e) => setPick((p) => p.includes(e) ? p.filter((x) => x !== e) : [...p, e]);
    const send = async () => {
      setBusy(true);
      setErr("");
      let sent = 0;
      try {
        for (let i = 0; i < pick.length; i += 20) {
          const r = await store.sendMessage({ from: "hello", to: pick.slice(i, i + 20), subject: subject.trim(), body: body.trim(), sign: true });
          sent += r && r.queued ? r.queued : Math.min(20, pick.length - i);
        }
        onSent(sent);
        onClose();
      } catch (e) {
        const c = String(e && (e.message || e));
        setErr((sent ? `Sent to ${sent}. ` : "") + (c.indexOf("rate_limited") >= 0 ? "The hourly email limit was reached. Send the rest in an hour." : "Could not send right now. Try again in a moment."));
        if (sent) onSent(sent);
      }
      setBusy(false);
    };
    return /* @__PURE__ */ React.createElement(Modal, { wide: true, title: "Email the report to donors", sub: "Each donor receives their own email from hello@brialendowment.org. No one sees the other addresses.", onClose }, /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement(Field, { label: `Recipients (${pick.length} of ${donors.length})` }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 6, maxHeight: 180, overflow: "auto" } }, donors.map((d) => /* @__PURE__ */ React.createElement("label", { key: d.email, className: "fd-switch", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: pick.includes(d.email), onChange: () => toggle(d.email), style: { accentColor: "#C9A961" } }), d.email, d.name ? " · " + d.name : "")))), /* @__PURE__ */ React.createElement(Field, { label: "Subject" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: subject, onChange: (e) => setSubject(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Message", hint: "Your signature is added at the end." }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", style: { minHeight: 200 }, value: body, onChange: (e) => setBody(e.target.value) }))), err && /* @__PURE__ */ React.createElement("div", { className: "fd-msg err", style: { marginTop: 12 } }, err), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement(Confirm, { className: "fd-btn primary", armedLabel: `Confirm · send to ${pick.length} ${plural(pick.length, "donor", "donors")}`, disabled: !pick.length || !subject.trim() || !body.trim() || busy, onConfirm: send }, busy ? "Sending…" : "Send"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: onClose }, "Cancel")));
  }
  const ACT_TARGET = { "PILLAR-GRANTS": "Pillar grants", "PILLAR-LINKS": "Pillar links", "PILLAR-STATUS": "Pillar visibility", "PAYMENT-CONFIG": "Payment channels", "EBOOKS-CATALOG": "Library catalogue", "FOODLAND-CONTENT": "Food & Land page", "WORSHIP-CONTENT": "Houses of Worship page", "WATER-CONTENT": "Clean Water page", "SITE-CONTACT": "Contact & social", "IMPACT-REPORTS": "Impact Report", "LEGACY-SUMMARY": "Founding era records" };
  const ACT_WORD = {
    "security.signed_in": "Signed in",
    "security.signed_out": "Signed out",
    "security.authenticator_added": "Turned on two-step verification",
    "security.authenticator_removed": "Turned off two-step verification",
    "security.recovery_codes_created": "Created new recovery codes",
    "security.recovery_code_used": "Signed in with a recovery code",
    "security.recovery_code_failed": "A wrong recovery code was tried",
    "security.authenticator_code_failed": "A wrong authenticator code was tried"
  };
  const actLabel = (x) => {
    if (ACT_WORD[x.action]) return ACT_WORD[x.action] + (x.action === "security.signed_in" && x.detail && x.detail.method ? x.detail.method === "authenticator" ? " with the authenticator" : " with password" : "");
    const [table, op] = String(x.action).split(".");
    const verb = op === "insert" ? "Added" : op === "delete" ? "Deleted" : "Updated";
    const t = x.target || "";
    if (table === "applicants") return `${verb} ${x.detail && x.detail.status ? "the status of " : ""}applicant ${x.detail && x.detail.name ? titleCase(x.detail.name) : t}`;
    if (table === "reports") return `${verb} a help desk message`;
    if (table === "donations") return ACT_TARGET[t] ? `${verb} ${ACT_TARGET[t]}` : String(t).indexOf("PILLAR-CONTENT-") === 0 ? `${verb} a programme page` : `${verb} gift ${t}`;
    return `${verb} ${t}`;
  };
  const actDetail = (x) => {
    const d = x.detail || {};
    const parts = [];
    if (d.status) parts.push(`status ${d.status.from || "none"} to ${d.status.to || "none"}`);
    if (Array.isArray(d.fields) && d.fields.length) parts.push("changed: " + d.fields.slice(0, 6).join(", ") + (d.fields.length > 6 ? ` and ${d.fields.length - 6} more` : ""));
    if (typeof d.remaining === "number") parts.push(`${d.remaining} recovery ${plural(d.remaining, "code", "codes")} left`);
    if (d.ip) parts.push(`from IP ${d.ip}`);
    return parts.join(" · ");
  };
  function RecoveryCodes({ codes, onDone }) {
    const [saved, setSaved] = useState(false);
    const text = "The Brial Endowment · Founder Console recovery codes\nEach code works once. Keep them somewhere safe, away from your phone.\n\n" + codes.join("\n") + "\n";
    const download2 = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
      a.download = "brial-founder-recovery-codes.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4e3);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { borderColor: "rgba(226,201,142,.5)" } }, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Your recovery codes"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "If your phone is lost, each of these codes lets you sign in once. They are shown only now. Save them in Google Password Manager or print them, and keep them away from your phone."), /* @__PURE__ */ React.createElement("div", { className: "fd-mono", style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px 18px", margin: "16px 0", fontSize: 16, letterSpacing: ".06em" } }, codes.map((c) => /* @__PURE__ */ React.createElement("span", { key: c }, c))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: () => copy(codes.join("\n")) }, "Copy all"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: download2 }, "Download as a text file")), /* @__PURE__ */ React.createElement("label", { className: "fd-switch", style: { gap: 8, marginTop: 16 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: saved, onChange: (e) => setSaved(e.target.checked), style: { accentColor: "#C9A961" } }), "I have saved these codes somewhere safe."), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !saved, onClick: onDone }, "Done")));
  }
  function SecurityView({ store }) {
    const [sec, setSec] = useState(null);
    const [log, setLog] = useState(null);
    const [setup, setSetup] = useState(null);
    const [code, setCode] = useState("");
    const [codes, setCodes] = useState(null);
    const [busy, setBusy] = useState("");
    const [err, setErr] = useState("");
    const [m, flash] = useFlash();
    const recovered = (() => {
      try {
        return sessionStorage.getItem("fd-recovered") === "1";
      } catch (e) {
        return false;
      }
    })();
    const load = async () => {
      try {
        setSec(await store.founderSecurity());
      } catch (e) {
        setSec({ error: true });
      }
      try {
        setLog(await store.founderActivity(150));
      } catch (e) {
        setLog([]);
      }
    };
    useEffect(() => {
      load();
    }, []);
    const begin = async () => {
      setBusy("start");
      setErr("");
      try {
        setSetup(await store.startFounderEnroll());
        setCode("");
      } catch (e) {
        setErr("Could not start the set-up: " + (e.message || e));
      }
      setBusy("");
    };
    const finish = async () => {
      setBusy("verify");
      setErr("");
      const r = await store.finishFounderEnroll(setup.factorId, code);
      if (r.error) {
        setErr(r.error);
        setBusy("");
        return;
      }
      try {
        setCodes(await store.newFounderRecoveryCodes());
        setSetup(null);
        try {
          sessionStorage.removeItem("fd-recovered");
        } catch (x) {
        }
      } catch (e) {
        setErr("Two-step verification is on, but the recovery codes could not be created. Press New recovery codes below.");
        setSetup(null);
      }
      setBusy("");
      load();
    };
    const regenerate = async () => {
      setBusy("codes");
      setErr("");
      try {
        setCodes(await store.newFounderRecoveryCodes());
      } catch (e) {
        setErr("Could not create new codes. Try again in a moment.");
      }
      setBusy("");
      load();
    };
    const turnOff = async () => {
      setBusy("off");
      setErr("");
      try {
        await store.removeFounderAuthenticator();
        flash("Two-step verification is off.");
      } catch (e) {
        setErr("Could not turn it off: " + (e.message || e));
      }
      setBusy("");
      load();
    };
    const on = sec && sec.mfa;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Security", lede: "Two-step verification for the Founder Console, recovery codes for emergencies, and a record of every change." }), recovered && !on && /* @__PURE__ */ React.createElement("div", { className: "fd-attn" }, /* @__PURE__ */ React.createElement("div", { className: "fd-attn-i" }, /* @__PURE__ */ React.createElement("span", { className: "fd-dot warn" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "You signed in with a recovery code"), /* @__PURE__ */ React.createElement("small", null, "Your old authenticator was removed. Set up Google Authenticator again below.")))), sec && sec.failedCodes7d > 0 && /* @__PURE__ */ React.createElement("div", { className: "fd-attn" }, /* @__PURE__ */ React.createElement("div", { className: "fd-attn-i" }, /* @__PURE__ */ React.createElement("span", { className: "fd-dot warn" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, sec.failedCodes7d, " wrong ", plural(sec.failedCodes7d, "code was", "codes were"), " tried in the last 7 days"), /* @__PURE__ */ React.createElement("small", null, "If that was not you, someone may know your password. Change it now. The details are in Activity below.")))), codes ? /* @__PURE__ */ React.createElement(RecoveryCodes, { codes, onDone: () => {
      setCodes(null);
      flash("Recovery codes saved.");
    } }) : /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Two-step verification"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, sec == null ? "Checking…" : on ? "On. Signing in on a new device needs your password and the 6-digit code from Google Authenticator. This device stays signed in until you sign out." : "Off. Anyone with your password can open the console. Turn it on to require the code from Google Authenticator as well.")), sec != null && /* @__PURE__ */ React.createElement(Tag, { tone: on ? "ok" : "warn", dot: true }, on ? "On" : "Off")), !on && !setup && sec != null && /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !!busy, onClick: begin }, busy === "start" ? "Preparing…" : "Turn on with Google Authenticator")), setup && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 220px) minmax(0, 1fr)", gap: 22, marginTop: 16, alignItems: "start" }, className: "fd-sec-setup" }, /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", padding: 10, borderRadius: 10, width: 220, maxWidth: "100%" } }, /* @__PURE__ */ React.createElement("img", { src: setup.qr, alt: "QR code for Google Authenticator", style: { width: "100%", display: "block" } })), /* @__PURE__ */ React.createElement("div", { className: "fd-form" }, /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("b", { style: { color: "var(--text)" } }, "1."), " In Google Authenticator, tap ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--text)" } }, "+"), " and ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--text)" } }, "Scan a QR code"), ", then scan this code."), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: 0 } }, "Can't scan? Choose ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--text)" } }, "Enter a setup key"), " and type: ", /* @__PURE__ */ React.createElement("span", { className: "fd-mono", style: { color: "var(--text)", wordBreak: "break-all" } }, setup.secret), " ", /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => copy(setup.secret) }, "Copy")), /* @__PURE__ */ React.createElement(Field, { label: "2. Type the 6-digit code the app shows" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", inputMode: "numeric", autoComplete: "one-time-code", value: code, onChange: (e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6)), placeholder: "000000", style: { letterSpacing: ".35em", fontSize: 18, maxWidth: 200 } })), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: code.length !== 6 || !!busy, onClick: finish }, busy === "verify" ? "Checking…" : "Verify and turn on"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", disabled: !!busy, onClick: () => {
      setSetup(null);
      setErr("");
    } }, "Cancel")))), on && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fd-krow", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Recovery codes"), /* @__PURE__ */ React.createElement("small", null, sec.recoveryLeft, " of 10 left", sec.recoveryCreatedAt ? `, created ${fdate(sec.recoveryCreatedAt)}` : "", ". Each code lets you in once if your phone is lost.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", disabled: !!busy, onClick: regenerate }, busy === "codes" ? "Creating…" : "New recovery codes")), sec.recoveryLeft < 3 && /* @__PURE__ */ React.createElement("div", { className: "fd-msg err", style: { marginTop: 10 } }, "Only ", sec.recoveryLeft, " recovery ", plural(sec.recoveryLeft, "code is", "codes are"), " left. Create new ones now."), /* @__PURE__ */ React.createElement("div", { className: "fd-krow" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Turn off two-step verification"), /* @__PURE__ */ React.createElement("small", null, "Only if you are moving to a new phone. Turn it on again straight after.")), /* @__PURE__ */ React.createElement(Confirm, { className: "fd-btn danger sm", armedLabel: "Click again to turn off", disabled: !!busy, onConfirm: turnOff }, "Turn off"))), err && /* @__PURE__ */ React.createElement("div", { className: "fd-msg err", style: { marginTop: 12 } }, err), /* @__PURE__ */ React.createElement(Flash, { m })), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Activity"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Every change made from the Founder Console, and every sign in. Only the names of changed fields are kept, never their contents.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: load }, "Refresh")), log == null ? /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Loading…") : log.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { title: "Nothing recorded yet." }, "Changes appear here from now on.") : /* @__PURE__ */ React.createElement("div", { className: "fd-mlog" }, log.map((x) => /* @__PURE__ */ React.createElement("div", { className: "fd-mlog-i", key: x.id }, /* @__PURE__ */ React.createElement("b", null, actLabel(x)), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("small", null, [fdatetime(x.at), x.by].filter(Boolean).join(" · ")), /* @__PURE__ */ React.createElement("span", null), actDetail(x) && /* @__PURE__ */ React.createElement("small", { style: { gridColumn: "1 / -1", color: "var(--faint)" } }, actDetail(x)))))));
  }
  const GROUPS = [
    { id: "pillars", label: "Pillars", title: "Which pillar are you managing?", lede: "Each pillar of the endowment has its own console. Choose one to begin.", only: ["scholarships", "worship", "library", "foodland", "water", "hospitals", "schools", "livestock", "infra", "transport"] },
    { id: "office", label: "Foundation office", title: "Run the foundation.", lede: "The money, the yearly report, the email, security, the website and the records: the work that serves every pillar.", only: ["treasury", "impact", "email", "security", "site", "backup"] }
  ];
  function FounderHome(props) {
    useStyles();
    const { Chooser } = props;
    const [group, setGroup] = useNav("fd-group", "pillars");
    const track = useRef(null);
    const panels = useRef([]);
    const [height, setHeight] = useState(null);
    const idx = Math.max(0, GROUPS.findIndex((g2) => g2.id === group));
    const idxRef = useRef(idx);
    idxRef.current = idx;
    const measure = (i) => {
      const el = panels.current[i];
      if (el) setHeight(el.offsetHeight);
    };
    useEffect(() => {
      const t = track.current;
      if (!t) return;
      t.scrollTo({ left: idx * t.clientWidth, behavior: "auto" });
      measure(idx);
      const ro = window.ResizeObserver ? new ResizeObserver(() => measure(idxRef.current)) : null;
      panels.current.forEach((p) => p && ro && ro.observe(p));
      return () => ro && ro.disconnect();
    }, []);
    useEffect(() => {
      const t = track.current;
      if (!t) return;
      if (Math.round(t.scrollLeft / t.clientWidth) !== idx) t.scrollTo({ left: idx * t.clientWidth, behavior: "smooth" });
      measure(idx);
    }, [idx]);
    const onScroll = () => {
      const t = track.current;
      if (!t) return;
      clearTimeout(onScroll.t);
      onScroll.t = setTimeout(() => {
        const i = Math.round(t.scrollLeft / t.clientWidth);
        if (GROUPS[i] && GROUPS[i].id !== group) setGroup(GROUPS[i].id, { replace: true });
      }, 90);
    };
    const g = GROUPS[idx];
    const counts = { pillars: GROUPS[0].only.length, office: GROUPS[1].only.length };
    return /* @__PURE__ */ React.createElement("div", { className: "fdh" }, /* @__PURE__ */ React.createElement("div", { className: "fdh-k" }, "Founder Console"), /* @__PURE__ */ React.createElement("div", { className: "fdh-tabs", role: "tablist", "aria-label": "Founder console sections" }, GROUPS.map((x, i) => /* @__PURE__ */ React.createElement("button", { key: x.id, role: "tab", "aria-selected": x.id === g.id, className: "fdh-tab", onClick: () => setGroup(x.id, { replace: true }) }, x.label, /* @__PURE__ */ React.createElement("em", null, counts[x.id]))), /* @__PURE__ */ React.createElement("span", { className: "fdh-ink", style: { transform: `translateX(${idx * 100}%)` }, "aria-hidden": "true" })), /* @__PURE__ */ React.createElement("h1", { className: "fdh-h1" }, g.title), /* @__PURE__ */ React.createElement("p", { className: "fdh-lede" }, g.lede), /* @__PURE__ */ React.createElement("div", { className: "fdh-track", ref: track, onScroll, style: height ? { height } : null }, GROUPS.map((x, i) => /* @__PURE__ */ React.createElement("div", { key: x.id, className: "fdh-panel", ref: (el) => {
      panels.current[i] = el;
    }, role: "tabpanel", "aria-label": x.label, "aria-hidden": x.id !== g.id }, /* @__PURE__ */ React.createElement(Chooser, { ...props, bare: true, only: x.only })))), /* @__PURE__ */ React.createElement("p", { className: "fdh-hint" }, "Swipe left or right to switch between ", GROUPS[0].label.toLowerCase(), " and the ", GROUPS[1].label.toLowerCase(), "."));
  }
  const GATE_CSS = `
.fg{position:relative;min-height:100vh;min-height:100dvh;overflow:hidden;background:linear-gradient(180deg,#050D1B 0%,#081530 46%,#0C2142 74%,#081631 100%);color:#EFE9DC;font-family:'Manrope',system-ui,sans-serif}
.fg-scene{position:absolute;inset:0;width:100%;height:100%;display:block;animation:fgIn 2.4s cubic-bezier(.2,.7,.2,1) both}
.fg-fire{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
@keyframes fgIn{from{opacity:0;filter:brightness(.4)}to{opacity:1;filter:none}}
.fg-halo{transform-origin:600px 450px;animation:fgBreath 7s ease-in-out infinite}
@keyframes fgBreath{0%,100%{opacity:.85}50%{opacity:1}}
.fg-tw{animation:fgTw 3.2s ease-in-out infinite}
@keyframes fgTw{0%,100%{opacity:.25}50%{opacity:1}}
.fg-exit{position:absolute;top:20px;left:20px;z-index:5;display:inline-flex;align-items:center;gap:8px;background:rgba(6,14,28,.35);border:1px solid rgba(191,216,255,.22);color:rgba(239,233,220,.8);padding:8px 14px;border-radius:999px;font:500 13px 'Manrope',sans-serif;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.fg-exit:hover{color:#fff;border-color:rgba(226,201,142,.6)}
.fg-verse{position:absolute;z-index:3;top:clamp(64px,9vh,96px);left:50%;transform:translateX(-50%);width:min(620px,86vw);text-align:center;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(16px,1.5vw,19px);line-height:1.5;color:rgba(214,228,250,.78);animation:fgUp 2.4s .6s both}
.fg-verse small{display:block;margin-top:6px;font-family:'Manrope',sans-serif;font-style:normal;font-size:12px;letter-spacing:.04em;color:rgba(226,201,142,.75)}
.fg-card{position:absolute;z-index:4;left:50%;bottom:max(2.5vh,16px);transform:translateX(-50%);width:min(320px,calc(100vw - 32px));padding:46px 26px 22px;background:linear-gradient(180deg,rgba(14,32,62,.58),rgba(8,20,42,.78));border:1px solid rgba(191,216,255,.2);border-radius:160px 160px 16px 16px / 110px 110px 16px 16px;backdrop-filter:blur(14px) saturate(130%);-webkit-backdrop-filter:blur(14px) saturate(130%);box-shadow:0 0 0 1px rgba(226,201,142,.08) inset,0 30px 80px -30px rgba(0,0,0,.9),0 0 60px -10px rgba(110,160,240,.25);animation:fgUp 1.6s 1s both}
@keyframes fgUp{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}
.fg-mark{display:flex;justify-content:center;margin-bottom:8px}
.fg-k{text-align:center;font-size:13px;font-weight:500;color:#E2C98E;margin:0}
.fg-h{text-align:center;font-family:'Cormorant Garamond',serif;font-weight:400;font-size:31px;line-height:1.1;margin:2px 0 16px;color:#F4EFE4}
.fg-f{display:block;margin-bottom:11px}
.fg-f label{display:block;font-size:12.5px;color:rgba(214,228,250,.7);margin-bottom:6px}
.fg-in{display:flex;align-items:center;background:rgba(5,13,27,.55);border:1px solid rgba(191,216,255,.2);border-radius:10px;transition:border-color .2s}
.fg-in:focus-within{border-color:#E2C98E}
.fg-in input{flex:1;min-width:0;background:none;border:0;outline:none;color:#F4EFE4;font:15px 'Manrope',sans-serif;padding:10px 12px}
.fg-eye{background:none;border:0;color:rgba(214,228,250,.6);padding:8px 10px;cursor:pointer;display:flex}
.fg-eye:hover{color:#fff}
.fg-err{margin:2px 0 14px;padding:10px 12px;border-radius:10px;background:rgba(229,134,134,.1);border:1px solid rgba(229,134,134,.35);color:#F0A3A3;font-size:13px}
.fg-btn{width:100%;margin-top:6px;padding:12px 0;border:0;border-radius:10px;background:linear-gradient(180deg,#E2C98E,#C9A961);color:#0A1628;font:700 14px 'Manrope',sans-serif;cursor:pointer;box-shadow:0 8px 30px -10px rgba(226,201,142,.6);transition:filter .2s}
.fg-btn:hover{filter:brightness(1.06)}
.fg-btn[disabled]{opacity:.5;cursor:not-allowed;box-shadow:none}
.fg :focus-visible{outline:2px solid #E2C98E;outline-offset:2px}
@media (max-aspect-ratio:9/10){
  .fg-scene{height:auto;bottom:auto}
  .fg-verse{position:relative;top:auto;left:auto;transform:none;margin:0 auto;padding:0 20px 18px;animation:fgFade 2s .6s both}
  .fg-card{position:relative;left:auto;bottom:auto;transform:none;margin:0 auto 36px;animation:fgFade 1.4s .8s both}
  .fg-flow{position:relative;z-index:3;padding-top:var(--fg-top,58vw)}
}
@keyframes fgFade{from{opacity:0}to{opacity:1}}
@media (min-aspect-ratio:9/10) and (max-height:860px){.fg-card{padding-top:32px;bottom:max(1.5vh,10px)}.fg-mark{display:none}.fg-h{font-size:27px;margin-bottom:12px}.fg-in input{padding:8px 12px}.fg-f{margin-bottom:8px}.fg-btn{padding:10px 0}.fg-verse{top:clamp(52px,7vh,80px)}}
@media (prefers-reduced-motion:reduce){.fg-scene,.fg-card,.fg-verse,.fg-halo,.fg-tw{animation:none}}
`;
  function useGateStyles() {
    useEffect(() => {
      if (document.getElementById("fg-css")) return;
      const s = document.createElement("style");
      s.id = "fg-css";
      s.textContent = GATE_CSS;
      document.head.appendChild(s);
    }, []);
  }
  const rng = (seed) => () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
  function Angel({ x, y, s, flip, id }) {
    const t = `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
    const feathers = useMemo(() => {
      const f = (v) => v.toFixed(1);
      const make = (S2, W2, th0, th1, L0, L1, N, w0, w1) => {
        const out = [];
        for (let k = N - 1; k >= 0; k--) {
          const u = k / (N - 1);
          const bend = Math.sin(u * Math.PI) * 18;
          const R = [S2[0] + (W2[0] - S2[0]) * u - bend * 0.6, S2[1] + (W2[1] - S2[1]) * u + bend * 0.2];
          const th = (th0 + (th1 - th0) * Math.pow(u, 1.15)) * Math.PI / 180;
          const L = L0 + (L1 - L0) * Math.pow(u, 0.7);
          const d = [Math.cos(th), Math.sin(th)], n = [-d[1], d[0]];
          const w = w0 + (w1 - w0) * u;
          const T = [R[0] + d[0] * L, R[1] + d[1] * L];
          const M1 = [R[0] + d[0] * L * 0.5 + n[0] * w, R[1] + d[1] * L * 0.5 + n[1] * w];
          const M2 = [R[0] + d[0] * L * 0.5 - n[0] * w * 0.5, R[1] + d[1] * L * 0.5 - n[1] * w * 0.5];
          out.push({ d: `M${f(R[0])} ${f(R[1])} Q${f(M1[0])} ${f(M1[1])} ${f(T[0])} ${f(T[1])} Q${f(M2[0])} ${f(M2[1])} ${f(R[0])} ${f(R[1])} Z`, o: u });
        }
        return out;
      };
      const S = [-8, -330], W = [-74, -508];
      return {
        far: make([12, -334], [34, -450], 238, 282, 70, 124, 9, 16, 20),
        out: make(S, W, 128, 246, 110, 232, 18, 22, 30),
        cov: make([-12, -336], [-62, -474], 140, 232, 54, 92, 9, 14, 16),
        arm: `M${S[0]} ${S[1] + 4} C${S[0] - 26} ${S[1] - 60} ${W[0] + 6} ${W[1] + 50} ${W[0]} ${W[1]}`
      };
    }, []);
    const farWing = "M8 -336 C18 -388 40 -440 84 -478 C92 -484 100 -486 106 -482 C96 -462 92 -440 92 -418 C84 -406 78 -392 76 -378 C60 -362 34 -346 8 -336 Z";
    const robe = "M-22 -342 C-36 -300 -46 -214 -58 -128 C-68 -66 -92 -20 -136 0 L74 0 C54 -38 42 -112 36 -198 C32 -260 30 -308 26 -342 C10 -350 -8 -350 -22 -342 Z";
    const veil = "M6 -424 C27 -424 33 -402 26 -385 C22 -375 27 -362 33 -350 C12 -342 -10 -340 -30 -338 C-27 -364 -23 -390 -15 -409 C-10 -418 -2 -424 6 -424 Z";
    const sleeve = "M12 -340 C34 -354 62 -364 92 -368 C99 -369 103 -363 99 -357 C78 -350 50 -339 20 -322 Z";
    const drape = "M32 -334 C42 -306 54 -290 74 -282 C66 -300 62 -320 62 -342 Z";
    const folds = "M-8 -300 C-14 -220 -24 -140 -44 -40 M8 -296 C8 -220 6 -140 0 -24 M22 -284 C26 -200 32 -120 46 -30";
    const base = "#0C2350";
    return /* @__PURE__ */ React.createElement("g", { transform: t }, feathers.far.map((f, i) => /* @__PURE__ */ React.createElement("g", { key: "f" + i }, /* @__PURE__ */ React.createElement("path", { d: f.d, fill: base }), /* @__PURE__ */ React.createElement("path", { d: f.d, fill: `url(#${id}-wing)`, stroke: "rgba(214,232,255,.4)", strokeWidth: ".9" }))), /* @__PURE__ */ React.createElement("g", { filter: "url(#fg-glow)" }, feathers.out.map((f, i) => /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("path", { d: f.d, fill: base }), /* @__PURE__ */ React.createElement("path", { d: f.d, fill: `url(#${id}-wing)`, stroke: `rgba(222,237,255,${(0.5 + 0.4 * f.o).toFixed(2)})`, strokeWidth: "1.05" }))), feathers.cov.map((f, i) => /* @__PURE__ */ React.createElement("g", { key: "c" + i }, /* @__PURE__ */ React.createElement("path", { d: f.d, fill: base }), /* @__PURE__ */ React.createElement("path", { d: f.d, fill: `url(#${id}-wing)`, stroke: "rgba(222,237,255,.6)", strokeWidth: ".9" }))), /* @__PURE__ */ React.createElement("path", { d: feathers.arm, fill: "none", stroke: "rgba(236,244,255,.85)", strokeWidth: "1.4" })), /* @__PURE__ */ React.createElement("path", { d: robe, fill: base }), /* @__PURE__ */ React.createElement("path", { d: robe, fill: `url(#${id}-robe)`, stroke: "rgba(224,238,255,.85)", strokeWidth: "1.3", filter: "url(#fg-glow)" }), /* @__PURE__ */ React.createElement("path", { d: folds, fill: "none", stroke: "rgba(214,232,255,.24)", strokeWidth: ".9" }), /* @__PURE__ */ React.createElement("path", { d: drape, fill: base, stroke: "rgba(214,232,255,.5)", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("path", { d: sleeve, fill: base }), /* @__PURE__ */ React.createElement("path", { d: sleeve, fill: `url(#${id}-robe)`, stroke: "rgba(224,238,255,.8)", strokeWidth: "1.2" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "104", cy: "-364", rx: "7", ry: "4.2", transform: "rotate(-20 104 -364)", fill: base, stroke: "rgba(234,242,255,.8)", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("path", { d: veil, fill: base }), /* @__PURE__ */ React.createElement("path", { d: veil, fill: `url(#${id}-robe)`, stroke: "rgba(234,242,255,.9)", strokeWidth: "1.3", filter: "url(#fg-glow)" }), /* @__PURE__ */ React.createElement("path", { d: "M-2 -332 C6 -316 13 -300 15 -284", fill: "none", stroke: "rgba(214,232,255,.5)", strokeWidth: "1.1" }), /* @__PURE__ */ React.createElement("circle", { cx: "114", cy: "-368", r: "18", fill: "url(#fg-orb)", className: "fg-tw", style: { animationDuration: "4.6s" } }), /* @__PURE__ */ React.createElement("circle", { cx: "114", cy: "-368", r: "3.6", fill: "#FFF3D2" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "-30", cy: "2", rx: "170", ry: "12", fill: "url(#fg-mist)" }));
  }
  function GateScene({ narrow }) {
    const g = useMemo(() => {
      const r = rng(2026);
      const stars = Array.from({ length: 70 }, () => ({ x: -300 + r() * 1800, y: 10 + r() * 360, s: 0.4 + r() * 1.3, d: (2 + r() * 4).toFixed(1), o: (r() * 3).toFixed(1) }));
      const yAt = (t) => 492 + 408 * Math.pow(t, 1.3), hw = (t) => 7 + 113 * t;
      const trees = [], shrubs = [], blooms = [], lamps = [], beds = [], pools = [0.33, 0.62].map((t) => ({ y: yAt(t), rx: 8 + 34 * t, ry: 2 + 8 * t }));
      [0.06, 0.13, 0.21, 0.3, 0.4, 0.51, 0.63, 0.76, 0.9].forEach((t, i) => {
        const y = yAt(t), w = hw(t), gap = 6 + 70 * t;
        [-1, 1].forEach((side) => {
          const cx = 600 + side * (w + gap);
          if (i % 2 === 0) trees.push({ x: cx, y, h: 16 + 150 * Math.pow(t, 1.15), k: "c" });
          else shrubs.push({ x: cx, y, rx: 6 + 46 * t, ry: 4 + 26 * t });
          trees.push({ x: 600 + side * (w + gap + 30 + 120 * t), y: y - 2, h: 12 + 110 * Math.pow(t, 1.15), k: "c" });
          lamps.push({ x: 600 + side * (w + 2), y: y - (3 + 22 * t), r: 1.2 + 4 * t });
          beds.push({ x: 600 + side * (w + 6 + 18 * t), y: y - 2 * t, rx: 5 + 34 * t, ry: 1.5 + 7 * t });
          for (let k = 0; k < 7; k++) blooms.push({ x: 600 + side * (w + 4 + r() * (gap + 40 * t)), y: y - r() * 10 * (t + 0.2), r: 0.6 + 2.4 * t * r(), c: r() < 0.45 ? "#F2D99B" : r() < 0.7 ? "#F3C6D6" : "#CFE3FF" });
        });
      });
      for (let i = 0; i < 46; i++) {
        const side = i % 2 ? 1 : -1, t = r();
        const x = 600 + side * (190 + t * 900 + r() * 60), y = 560 + r() * 250 + t * 40;
        if (Math.abs(x - 600) < 200) continue;
        if (r() < 0.55) trees.push({ x, y, h: 30 + r() * 90, k: "c" });
        else shrubs.push({ x, y, rx: 10 + r() * 30, ry: 6 + r() * 16 });
        for (let k = 0; k < 3; k++) blooms.push({ x: x + (r() - 0.5) * 60, y: y + r() * 8, r: 0.7 + r() * 1.8, c: r() < 0.5 ? "#F2D99B" : r() < 0.75 ? "#F3C6D6" : "#CFE3FF" });
      }
      trees.sort((a, b) => a.y - b.y);
      shrubs.sort((a, b) => a.y - b.y);
      return { stars, trees, shrubs, blooms, lamps, beds, pools };
    }, []);
    const cyp = ({ x, y, h }) => {
      const w = h * 0.26;
      return `M${x - w / 2} ${y} C${x - w / 2} ${y - h * 0.5} ${x - w * 0.16} ${y - h * 0.86} ${x} ${y - h} C${x + w * 0.16} ${y - h * 0.86} ${x + w / 2} ${y - h * 0.5} ${x + w / 2} ${y} Z`;
    };
    const vb = narrow ? "190 196 820 704" : "0 0 1200 900";
    const par = narrow ? "xMidYMin meet" : "xMidYMax meet";
    const L = narrow ? { x: 338, s: 0.72 } : { x: 232, s: 1 };
    const R = narrow ? { x: 862, s: 0.72 } : { x: 968, s: 1 };
    const mins = [{ cx: 524, top: 404 }, { cx: 676, top: 404 }];
    return /* @__PURE__ */ React.createElement("svg", { className: "fg-scene", viewBox: vb, preserveAspectRatio: par, "aria-hidden": "true", style: narrow ? { position: "absolute", top: 0, left: 0, width: "100%", height: "auto" } : null }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("filter", { id: "fg-glow", x: "-30%", y: "-30%", width: "160%", height: "160%" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "2.4", result: "b" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "b" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" }))), /* @__PURE__ */ React.createElement("filter", { id: "fg-soft" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "6" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "fg-sky", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#040B18" }), /* @__PURE__ */ React.createElement("stop", { offset: ".5", stopColor: "#0A1A36" }), /* @__PURE__ */ React.createElement("stop", { offset: ".78", stopColor: "#15325E" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#0B1C38" })), /* @__PURE__ */ React.createElement("radialGradient", { id: "fg-halo", cx: "600", cy: "450", r: "330", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#9CC3FF", stopOpacity: ".55" }), /* @__PURE__ */ React.createElement("stop", { offset: ".35", stopColor: "#4D7FCC", stopOpacity: ".28" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#1B3A6B", stopOpacity: "0" })), /* @__PURE__ */ React.createElement("radialGradient", { id: "fg-door", cx: "600", cy: "640", r: "260", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#BFD8FF", stopOpacity: ".35" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#BFD8FF", stopOpacity: "0" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "fg-hill1", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#14305A" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#0A1A34" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "fg-hill2", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#0F2548" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#081730" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "fg-road", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#6E9BE0", stopOpacity: ".4" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#2A4F88", stopOpacity: ".28" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "fg-water", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#E6F0FF", stopOpacity: ".95" }), /* @__PURE__ */ React.createElement("stop", { offset: ".5", stopColor: "#8DB6F2", stopOpacity: ".8" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#4C7CC4", stopOpacity: ".6" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "fg-stone", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#1A3A6A" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#0B1D3A" })), /* @__PURE__ */ React.createElement("radialGradient", { id: "fg-orb" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#FFF1C8", stopOpacity: ".95" }), /* @__PURE__ */ React.createElement("stop", { offset: ".4", stopColor: "#E2C98E", stopOpacity: ".5" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#E2C98E", stopOpacity: "0" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "fg-tree", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#3D6AAE" }), /* @__PURE__ */ React.createElement("stop", { offset: ".4", stopColor: "#173A6E" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#0B2044" })), /* @__PURE__ */ React.createElement("radialGradient", { id: "fg-bush", cx: ".5", cy: ".25", r: ".8" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#4A78BE" }), /* @__PURE__ */ React.createElement("stop", { offset: ".55", stopColor: "#1A3E74" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#0E2548" })), /* @__PURE__ */ React.createElement("radialGradient", { id: "fg-bed" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#F3C6D6", stopOpacity: ".55" }), /* @__PURE__ */ React.createElement("stop", { offset: ".5", stopColor: "#E2C98E", stopOpacity: ".25" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#E2C98E", stopOpacity: "0" })), /* @__PURE__ */ React.createElement("radialGradient", { id: "fg-mist" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#BFD8FF", stopOpacity: ".28" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#BFD8FF", stopOpacity: "0" })), ["fgl", "fgr"].map((id) => /* @__PURE__ */ React.createElement(React.Fragment, { key: id }, /* @__PURE__ */ React.createElement("linearGradient", { id: id + "-wing", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#D6E8FF", stopOpacity: ".42" }), /* @__PURE__ */ React.createElement("stop", { offset: ".55", stopColor: "#7FA8E8", stopOpacity: ".18" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#4F7BC4", stopOpacity: ".06" })), /* @__PURE__ */ React.createElement("linearGradient", { id: id + "-robe", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#E2EEFF", stopOpacity: ".46" }), /* @__PURE__ */ React.createElement("stop", { offset: ".45", stopColor: "#9CC0F5", stopOpacity: ".2" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#6F9BE0", stopOpacity: ".05" }))))), /* @__PURE__ */ React.createElement("rect", { x: "-1000", y: "-200", width: "3200", height: "1200", fill: "url(#fg-sky)" }), g.stars.map((s, i) => /* @__PURE__ */ React.createElement("circle", { key: i, cx: s.x, cy: s.y, r: s.s, fill: "#DCE8FF", className: i % 3 === 0 ? "fg-tw" : null, style: i % 3 === 0 ? { animationDuration: s.d + "s", animationDelay: s.o + "s" } : { opacity: 0.5 } })), /* @__PURE__ */ React.createElement("circle", { cx: "600", cy: "450", r: "330", fill: "url(#fg-halo)", className: "fg-halo" }), /* @__PURE__ */ React.createElement("path", { d: "M-1000 600 C-400 590 200 560 420 520 C500 500 560 490 600 489 C640 490 700 500 780 520 C1000 560 1600 590 2200 600 L2200 1000 L-1000 1000 Z", fill: "url(#fg-hill1)" }), /* @__PURE__ */ React.createElement("path", { d: "M-1000 600 C-400 590 200 560 420 520 C500 500 560 490 600 489 C640 490 700 500 780 520 C1000 560 1600 590 2200 600", fill: "none", stroke: "rgba(190,215,255,.45)", strokeWidth: "1.2", filter: "url(#fg-glow)" }), /* @__PURE__ */ React.createElement("g", { filter: "url(#fg-glow)", stroke: "#D6E6FF", strokeWidth: "1.1", fill: "#123060" }, /* @__PURE__ */ React.createElement("rect", { x: "552", y: "452", width: "96", height: "38" }), /* @__PURE__ */ React.createElement("rect", { x: "530", y: "464", width: "22", height: "26" }), /* @__PURE__ */ React.createElement("rect", { x: "648", y: "464", width: "22", height: "26" }), /* @__PURE__ */ React.createElement("rect", { x: "580", y: "440", width: "40", height: "12" }), /* @__PURE__ */ React.createElement("path", { d: "M580 440 C580 414 592 402 600 388 C608 402 620 414 620 440 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M533 464 C533 454 539 449 541 445 C543 449 549 454 549 464 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M651 464 C651 454 657 449 659 445 C661 449 667 454 667 464 Z" }), mins.map((m, i) => /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("rect", { x: m.cx - 3, y: m.top, width: "6", height: 490 - m.top }), /* @__PURE__ */ React.createElement("path", { d: `M${m.cx - 4} ${m.top} L${m.cx} ${m.top - 13} L${m.cx + 4} ${m.top} Z` }), /* @__PURE__ */ React.createElement("rect", { x: m.cx - 5, y: m.top + 18, width: "10", height: "2" }))), /* @__PURE__ */ React.createElement("line", { x1: "600", y1: "388", x2: "600", y2: "376" }), /* @__PURE__ */ React.createElement("circle", { cx: "600", cy: "373", r: "2", fill: "#F2D99B", stroke: "none" })), /* @__PURE__ */ React.createElement("g", { fill: "#F2D99B" }, [560, 572, 584, 616, 628, 640].map((x) => /* @__PURE__ */ React.createElement("path", { key: x, d: `M${x} 482 L${x} 472 C${x} 468 ${x + 3} 466 ${x + 3} 466 C${x + 3} 466 ${x + 6} 468 ${x + 6} 472 L${x + 6} 482 Z`, opacity: ".85" })), /* @__PURE__ */ React.createElement("path", { d: "M594 490 L594 474 C594 468 600 465 600 465 C600 465 606 468 606 474 L606 490 Z" })), /* @__PURE__ */ React.createElement("path", { d: "M593 492 L480 900 L720 900 L607 492 Z", fill: "url(#fg-road)" }), /* @__PURE__ */ React.createElement("path", { d: "M593 492 L480 900 M607 492 L720 900", stroke: "rgba(190,215,255,.35)", strokeWidth: "1", fill: "none" }), /* @__PURE__ */ React.createElement("path", { d: "M598.6 494 L583 900 L617 900 L601.4 494 Z", fill: "url(#fg-water)", filter: "url(#fg-glow)" }), /* @__PURE__ */ React.createElement("path", { d: "M-1000 700 C-300 690 300 660 470 640 L730 640 C900 660 1500 690 2200 700 L2200 1000 L-1000 1000 Z", fill: "url(#fg-hill2)", opacity: ".6" }), /* @__PURE__ */ React.createElement("path", { d: "M480 900 L593 492 L607 492 L720 900 Z", fill: "url(#fg-road)", opacity: ".55" }), /* @__PURE__ */ React.createElement("path", { d: "M598.6 494 L583 900 L617 900 L601.4 494 Z", fill: "url(#fg-water)", opacity: ".8" }), g.pools.map((p, i) => /* @__PURE__ */ React.createElement("g", { key: "p" + i, filter: "url(#fg-glow)" }, /* @__PURE__ */ React.createElement("ellipse", { cx: "600", cy: p.y, rx: p.rx, ry: p.ry, fill: "#9CC0F5", fillOpacity: ".35", stroke: "#E6F0FF", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "600", cy: p.y, rx: p.rx * 0.45, ry: p.ry * 0.45, fill: "#E6F0FF", fillOpacity: ".5" }), /* @__PURE__ */ React.createElement("path", { d: `M600 ${p.y} L600 ${p.y - p.ry * 3.2}`, stroke: "#E6F0FF", strokeOpacity: ".7", strokeWidth: "1" }))), g.beds.map((b, i) => /* @__PURE__ */ React.createElement("ellipse", { key: "d" + i, cx: b.x, cy: b.y, rx: b.rx, ry: b.ry, fill: "url(#fg-bed)" })), g.shrubs.map((s, i) => /* @__PURE__ */ React.createElement("ellipse", { key: "s" + i, cx: s.x, cy: s.y - s.ry * 0.6, rx: s.rx, ry: s.ry, fill: "url(#fg-bush)", stroke: "rgba(190,215,255,.5)", strokeWidth: ".9" })), g.trees.map((t, i) => /* @__PURE__ */ React.createElement("path", { key: "t" + i, d: cyp(t), fill: "url(#fg-tree)", stroke: "rgba(200,224,255,.55)", strokeWidth: ".9" })), g.blooms.map((b, i) => /* @__PURE__ */ React.createElement("circle", { key: "b" + i, cx: b.x, cy: b.y, r: b.r, fill: b.c, opacity: ".85" })), g.lamps.map((l, i) => /* @__PURE__ */ React.createElement("g", { key: "l" + i }, /* @__PURE__ */ React.createElement("circle", { cx: l.x, cy: l.y, r: l.r * 4, fill: "url(#fg-orb)", className: "fg-tw", style: { animationDuration: 3 + i % 5 * 0.7 + "s", animationDelay: i % 7 * 0.4 + "s" } }), /* @__PURE__ */ React.createElement("circle", { cx: l.x, cy: l.y, r: l.r * 0.6, fill: "#FFF3D2" }))), /* @__PURE__ */ React.createElement("circle", { cx: "600", cy: "640", r: "260", fill: "url(#fg-door)" }), /* @__PURE__ */ React.createElement("g", { filter: "url(#fg-glow)" }, /* @__PURE__ */ React.createElement(
      "path",
      {
        fillRule: "evenodd",
        fill: "url(#fg-stone)",
        stroke: "#D6E6FF",
        strokeWidth: "1.5",
        d: "M404 900 L404 470 C404 380 500 300 600 246 C700 300 796 380 796 470 L796 900 L730 900 L730 474 C730 410 670 360 600 322 C530 360 470 410 470 474 L470 900 Z"
      }
    ), /* @__PURE__ */ React.createElement("path", { fill: "none", stroke: "#E2C98E", strokeOpacity: ".75", strokeWidth: "1.2", d: "M484 900 L484 476 C484 418 538 372 600 338 C662 372 716 418 716 476 L716 900" }), /* @__PURE__ */ React.createElement("path", { fill: "none", stroke: "#E2C98E", strokeOpacity: ".45", strokeWidth: "1", d: "M418 900 L418 472 C418 390 508 316 600 262 C692 316 782 390 782 472 L782 900" }), /* @__PURE__ */ React.createElement("rect", { x: "394", y: "462", width: "86", height: "12", fill: "#14325E", stroke: "#D6E6FF", strokeWidth: "1.1" }), /* @__PURE__ */ React.createElement("rect", { x: "720", y: "462", width: "86", height: "12", fill: "#14325E", stroke: "#D6E6FF", strokeWidth: "1.1" }), /* @__PURE__ */ React.createElement("rect", { x: "390", y: "878", width: "94", height: "22", fill: "#14325E", stroke: "#D6E6FF", strokeWidth: "1.1" }), /* @__PURE__ */ React.createElement("rect", { x: "716", y: "878", width: "94", height: "22", fill: "#14325E", stroke: "#D6E6FF", strokeWidth: "1.1" }), /* @__PURE__ */ React.createElement("path", { d: "M600 246 L600 214", stroke: "#E2C98E", strokeWidth: "1.4" }), /* @__PURE__ */ React.createElement("path", { d: "M589 232 C589 222 600 216 600 206 C600 216 611 222 611 232 Z", fill: "#14325E", stroke: "#E2C98E", strokeWidth: "1.2" }), /* @__PURE__ */ React.createElement("circle", { cx: "600", cy: "200", r: "4", fill: "#F2D99B" }), [[437, 600], [763, 600], [437, 720], [763, 720]].map(([x, y], i) => /* @__PURE__ */ React.createElement("path", { key: i, d: `M${x} ${y - 11} L${x + 3.5} ${y - 3.5} L${x + 11} ${y} L${x + 3.5} ${y + 3.5} L${x} ${y + 11} L${x - 3.5} ${y + 3.5} L${x - 11} ${y} L${x - 3.5} ${y - 3.5} Z`, fill: "none", stroke: "#E2C98E", strokeOpacity: ".7", strokeWidth: "1" }))), /* @__PURE__ */ React.createElement("path", { d: "M600 322 C530 360 470 410 470 474 L470 900 L730 900 L730 474 C730 410 670 360 600 322 Z", fill: "url(#fg-door)", opacity: ".5" }), /* @__PURE__ */ React.createElement(Angel, { id: "fgl", x: L.x, y: 900, s: L.s }), /* @__PURE__ */ React.createElement(Angel, { id: "fgr", x: R.x, y: 900, s: R.s, flip: true }));
  }
  function Fireflies() {
    const ref = useRef(null);
    useEffect(() => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let w = 0, h = 0, dpr = 1, parts = [], raf = 0, run = true;
      const sprite = (() => {
        const s = document.createElement("canvas");
        s.width = s.height = 48;
        const g = s.getContext("2d");
        const gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
        gr.addColorStop(0, "rgba(255,244,200,1)");
        gr.addColorStop(0.25, "rgba(242,217,155,.75)");
        gr.addColorStop(1, "rgba(226,201,142,0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, 48, 48);
        return s;
      })();
      const size = () => {
        const r = c.getBoundingClientRect();
        dpr = Math.min(2, window.devicePixelRatio || 1);
        w = c.width = Math.max(1, Math.round(r.width * dpr));
        h = c.height = Math.max(1, Math.round(r.height * dpr));
        const n = Math.round(Math.min(60, Math.max(22, r.width / 24)));
        parts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: h * (0.35 + Math.random() * 0.62), a: Math.random() * Math.PI * 2, v: (0.12 + Math.random() * 0.3) * dpr, r: (0.55 + Math.random() * 0.9) * dpr, ph: Math.random() * 10, f: 0.5 + Math.random() * 1.1 }));
      };
      const draw = (t) => {
        ctx.clearRect(0, 0, w, h);
        const time = t / 1e3;
        parts.forEach((p) => {
          if (!reduce) {
            p.a += Math.sin(time * 0.7 + p.ph) * 0.04 + (Math.random() - 0.5) * 0.08;
            p.x += Math.cos(p.a) * p.v;
            p.y += Math.sin(p.a) * p.v * 0.7 - 0.03 * dpr;
            if (p.x < -20) p.x = w + 20;
            if (p.x > w + 20) p.x = -20;
            if (p.y < h * 0.25) p.a = Math.PI / 2 + (Math.random() - 0.5);
            if (p.y > h + 10) p.y = h * 0.3;
          }
          const pulse = Math.max(0, Math.sin(time * p.f + p.ph));
          const alpha = reduce ? 0.6 : 0.12 + 0.88 * Math.pow(pulse, 2.2);
          ctx.globalAlpha = alpha;
          const s = p.r * 8;
          ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
        });
        ctx.globalAlpha = 1;
        if (run && !reduce) raf = requestAnimationFrame(draw);
      };
      size();
      raf = requestAnimationFrame(draw);
      const ro = window.ResizeObserver ? new ResizeObserver(() => size()) : null;
      if (ro) ro.observe(c);
      const onR = () => size();
      const onV = () => {
        if (document.hidden) {
          run = false;
          cancelAnimationFrame(raf);
        } else if (!run) {
          run = true;
          raf = requestAnimationFrame(draw);
        }
      };
      window.addEventListener("resize", onR);
      document.addEventListener("visibilitychange", onV);
      return () => {
        run = false;
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        window.removeEventListener("resize", onR);
        document.removeEventListener("visibilitychange", onV);
      };
    }, []);
    return /* @__PURE__ */ React.createElement("canvas", { ref, className: "fg-fire", "aria-hidden": "true" });
  }
  const EyeIcon = ({ off }) => /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }), off && /* @__PURE__ */ React.createElement("path", { d: "M4 4l16 16" }));
  function FounderGate({ onExit }) {
    useGateStyles();
    const store = window.BrialStore;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [reveal, setReveal] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const isNarrow = () => window.innerWidth / Math.max(1, window.innerHeight) < 0.9;
    const [narrow, setNarrow] = useState(isNarrow);
    useEffect(() => {
      const h = () => setNarrow(isNarrow());
      window.addEventListener("resize", h);
      return () => window.removeEventListener("resize", h);
    }, []);
    const [step, setStep] = useState("password");
    const [code, setCode] = useState("");
    useEffect(() => {
      let on = true;
      store.founderNeedsCode && store.founderNeedsCode().then((n) => {
        if (on && n) setStep("code");
      });
      return () => {
        on = false;
      };
    }, []);
    const opened = () => window.dispatchEvent(new CustomEvent("brial:change", { detail: { key: "founder-auth" } }));
    const submit = async (e) => {
      e && e.preventDefault();
      setError(null);
      setLoading(true);
      let res;
      try {
        res = await store.authFounder(email, password);
      } catch (err) {
        res = { error: "Could not reach the server. Check your connection and try again." };
      }
      if (res && res.needsCode) {
        setStep("code");
        setCode("");
        setLoading(false);
      } else if (res && res.ok) opened();
      else {
        setError(res && res.error || "The email or password is not correct.");
        setLoading(false);
      }
    };
    const submitCode = async (e) => {
      e && e.preventDefault();
      setError(null);
      setLoading(true);
      const res = step === "recovery" ? await store.useFounderRecoveryCode(code) : await store.verifyFounderCode(code);
      if (res && res.ok) {
        if (res.recovered) {
          try {
            sessionStorage.setItem("fd-recovered", "1");
          } catch (x) {
          }
        }
        opened();
      } else {
        setError(res && res.error || "That code is not right.");
        setLoading(false);
      }
    };
    const otherAccount = () => {
      setError(null);
      setCode("");
      setPassword("");
      setStep("password");
      store.clearFounderSession().then(() => {
      }, () => {
      });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "fg", style: narrow ? { "--fg-top": window.innerWidth * 704 / 820 + 14 + "px" } : null }, /* @__PURE__ */ React.createElement(GateScene, { narrow }), /* @__PURE__ */ React.createElement(Fireflies, null), /* @__PURE__ */ React.createElement("button", { className: "fg-exit", onClick: onExit }, /* @__PURE__ */ React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M15 5l-7 7 7 7" })), "Public site"), /* @__PURE__ */ React.createElement("div", { className: narrow ? "fg-flow" : null }, /* @__PURE__ */ React.createElement("p", { className: "fg-verse" }, "“When a person dies, their deeds come to an end except for three: a charity that continues, knowledge that benefits, and a righteous child who prays for them.”", /* @__PURE__ */ React.createElement("small", null, "Sahih Muslim")), step !== "password" ? /* @__PURE__ */ React.createElement("form", { className: "fg-card", onSubmit: submitCode }, /* @__PURE__ */ React.createElement("div", { className: "fg-mark" }, /* @__PURE__ */ React.createElement("svg", { width: "26", height: "26", viewBox: "0 0 36 36", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("g", { fill: "none", stroke: "#E2C98E", strokeWidth: "1.2" }, /* @__PURE__ */ React.createElement("path", { d: "M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "18", r: "4", fill: "#E2C98E", stroke: "none" })))), /* @__PURE__ */ React.createElement("p", { className: "fg-k" }, "Two-step verification"), /* @__PURE__ */ React.createElement("h1", { className: "fg-h" }, step === "recovery" ? "Use a recovery code." : "Enter your code."), /* @__PURE__ */ React.createElement("div", { className: "fg-f" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "fg-code" }, step === "recovery" ? "One of your ten recovery codes" : "The 6 digits in Google Authenticator"), /* @__PURE__ */ React.createElement("div", { className: "fg-in" }, step === "recovery" ? /* @__PURE__ */ React.createElement("input", { id: "fg-code", autoFocus: true, value: code, onChange: (e) => setCode(e.target.value.toUpperCase().slice(0, 16)), autoComplete: "off", spellCheck: false, placeholder: "XXXXX-XXXXX" }) : /* @__PURE__ */ React.createElement("input", { id: "fg-code", autoFocus: true, inputMode: "numeric", pattern: "[0-9]*", autoComplete: "one-time-code", value: code, onChange: (e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6)), placeholder: "000000", style: { letterSpacing: ".4em", fontSize: 20, textAlign: "center" } }))), error && /* @__PURE__ */ React.createElement("div", { className: "fg-err", role: "alert" }, error), /* @__PURE__ */ React.createElement("button", { className: "fg-btn", type: "submit", disabled: loading || (step === "recovery" ? code.replace(/[^A-Z0-9]/g, "").length < 10 : code.length !== 6) }, loading ? "Checking…" : step === "recovery" ? "Use code and enter" : "Verify and enter"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, marginTop: 12, fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
      setError(null);
      setCode("");
      setStep(step === "recovery" ? "code" : "recovery");
    }, style: { background: "none", border: 0, color: "#E2C98E", cursor: "pointer", padding: 0, font: "inherit" } }, step === "recovery" ? "Use the app code instead" : "Lost your phone? Use a recovery code"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: otherAccount, style: { background: "none", border: 0, color: "rgba(214,228,250,.65)", cursor: "pointer", padding: 0, font: "inherit" } }, "Different account"))) : /* @__PURE__ */ React.createElement("form", { className: "fg-card", onSubmit: submit }, /* @__PURE__ */ React.createElement("div", { className: "fg-mark" }, /* @__PURE__ */ React.createElement("svg", { width: "26", height: "26", viewBox: "0 0 36 36", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("g", { fill: "none", stroke: "#E2C98E", strokeWidth: "1.2" }, /* @__PURE__ */ React.createElement("path", { d: "M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "18", r: "4", fill: "#E2C98E", stroke: "none" })))), /* @__PURE__ */ React.createElement("p", { className: "fg-k" }, "Founder Portal"), /* @__PURE__ */ React.createElement("h1", { className: "fg-h" }, "Welcome back."), /* @__PURE__ */ React.createElement("div", { className: "fg-f" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "fg-email" }, "Email"), /* @__PURE__ */ React.createElement("div", { className: "fg-in" }, /* @__PURE__ */ React.createElement("input", { id: "fg-email", type: "email", autoFocus: true, value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "username", spellCheck: false }))), /* @__PURE__ */ React.createElement("div", { className: "fg-f" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "fg-pw" }, "Password"), /* @__PURE__ */ React.createElement("div", { className: "fg-in" }, /* @__PURE__ */ React.createElement("input", { id: "fg-pw", type: reveal ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password" }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "fg-eye", onClick: () => setReveal((r) => !r), "aria-label": reveal ? "Hide password" : "Show password" }, /* @__PURE__ */ React.createElement(EyeIcon, { off: reveal })))), error && /* @__PURE__ */ React.createElement("div", { className: "fg-err", role: "alert" }, error), /* @__PURE__ */ React.createElement("button", { className: "fg-btn", type: "submit", disabled: !email || !password || loading }, loading ? "Signing in…" : "Sign in"))));
  }
  const LINE_TYPES = ["email", "phone", "whatsapp", "address"];
  function ContactView({ store }) {
    const types = store.CONTACT_TYPES || [];
    const load = () => {
      const stored = store.getSiteContact ? store.getSiteContact() : [];
      const preset = types.map((t) => {
        const hit = stored.find((x) => x.type === t.type);
        return { type: t.type, value: hit ? hit.value : "", label: "", shown: hit ? !!hit.shown : false };
      });
      const extra = stored.filter((x) => x.type === "link").map((x, i) => ({ ...x, id: "c" + i }));
      return { preset, extra };
    };
    const [f, setF] = useState(load);
    const [saved, setSaved] = useState(() => JSON.stringify(load()));
    const [busy, setBusy] = useState(false);
    const [m, flash] = useFlash();
    const dirty = JSON.stringify(f) !== saved;
    useEffect(() => {
      const h = (e) => {
        if (dirty) {
          e.preventDefault();
          e.returnValue = "";
        }
      };
      window.addEventListener("beforeunload", h);
      return () => window.removeEventListener("beforeunload", h);
    }, [dirty]);
    const upd = (x, patch) => {
      const n = { ...x, ...patch };
      if (patch.value !== void 0) {
        if (!patch.value.trim()) n.shown = false;
        else if (!x.value.trim()) n.shown = true;
      }
      return n;
    };
    const setP = (type, patch) => setF((p) => ({ ...p, preset: p.preset.map((x) => x.type === type ? upd(x, patch) : x) }));
    const setX = (id, patch) => setF((p) => ({ ...p, extra: p.extra.map((x) => x.id === id ? upd(x, patch) : x) }));
    const addX = () => setF((p) => ({ ...p, extra: [...p.extra, { id: "c" + Date.now(), type: "link", label: "", value: "", shown: false }] }));
    const delX = (id) => setF((p) => ({ ...p, extra: p.extra.filter((x) => x.id !== id) }));
    const all = [...f.preset, ...f.extra];
    const href = (it) => store.contactHref ? store.contactHref(it) : null;
    const badUrl = (it) => it.type === "link" && it.value.trim() && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/i.test(it.value.trim());
    const badEmail = (it) => it.type === "email" && it.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(it.value.trim());
    const invalid = all.some((it) => badUrl(it) || badEmail(it) || it.type === "link" && it.value.trim() && !it.label.trim());
    const save = async () => {
      setBusy(true);
      try {
        await store.saveSiteContact(all.filter((x) => x.value.trim() || x.type !== "link").map(({ type, value, label, shown }) => ({ type, value, label, shown })));
        setSaved(JSON.stringify(f));
        flash("Saved — the footer is updated.");
      } catch (e) {
        flash("Could not save. Check your connection and try again.", "err");
      }
      setBusy(false);
    };
    const shownCount = all.filter((x) => x.shown && x.value.trim()).length;
    const row = ({ k, it, label, hint, onValue, onShown, extra }) => {
      const h = it.value.trim() ? href(it) : null;
      return /* @__PURE__ */ React.createElement("div", { key: k, className: "fd-crow" }, /* @__PURE__ */ React.createElement("div", { className: "fd-crow-l" }, /* @__PURE__ */ React.createElement("span", { className: "fd-crow-ic" }, store.contactIcon ? store.contactIcon(it.type, 18) : null), extra || /* @__PURE__ */ React.createElement("b", null, label)), /* @__PURE__ */ React.createElement("div", { className: "fd-crow-v" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: it.value, onChange: (e) => onValue(e.target.value), placeholder: hint, spellCheck: false, "aria-label": label || "Link address" }), badEmail(it) && /* @__PURE__ */ React.createElement("small", { className: "fd-bad" }, "This doesn't look like an email address."), badUrl(it) && /* @__PURE__ */ React.createElement("small", { className: "fd-bad" }, "Use a web address, for example https://…")), /* @__PURE__ */ React.createElement("div", { className: "fd-crow-a" }, h ? /* @__PURE__ */ React.createElement("a", { className: "fd-btn quiet sm", href: h, target: "_blank", rel: "noopener noreferrer", title: "Test this link" }, "Test ", ICON.ext) : /* @__PURE__ */ React.createElement("span", { className: "fd-crow-gap" }), /* @__PURE__ */ React.createElement(Switch, { on: it.shown && !!it.value.trim(), onChange: (v) => it.value.trim() && onShown(v) }, it.shown && it.value.trim() ? "Shown" : "Hidden")));
    };
    const preview = all.filter((x) => x.shown && x.value.trim());
    const T = {};
    types.forEach((t) => {
      T[t.type] = t;
    });
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Contact & social", lede: "The contact details and social links at the bottom of every public page. Hidden items are never sent to visitors." }), /* @__PURE__ */ React.createElement("div", { className: "fd-site" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Contact details"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Shown as lines of text with an icon."))), f.preset.filter((x) => LINE_TYPES.includes(x.type)).map((it) => row({ k: it.type, it, label: T[it.type].label, hint: T[it.type].hint, onValue: (v) => setP(it.type, { value: v }), onShown: (v) => setP(it.type, { shown: v }) }))), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Social profiles"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Shown as round icons. A handle like @brialendowment is enough."))), f.preset.filter((x) => !LINE_TYPES.includes(x.type)).map((it) => row({ k: it.type, it, label: T[it.type].label, hint: T[it.type].hint, onValue: (v) => setP(it.type, { value: v }), onShown: (v) => setP(it.type, { shown: v }) }))), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Other links"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Anything else — a Linktree, a donation page, a podcast.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: addX }, "Add a link")), f.extra.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: "8px 0 0" } }, "No other links.") : f.extra.map((it) => row({
      k: it.id,
      it,
      hint: "https://…",
      onValue: (v) => setX(it.id, { value: v }),
      onShown: (v) => setX(it.id, { shown: v }),
      extra: /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", minWidth: 0, flex: 1 } }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: it.label, onChange: (e) => setX(it.id, { label: e.target.value }), placeholder: "Name", "aria-label": "Link name" }), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => delX(it.id), "aria-label": "Remove link" }, "✕"))
    })))), /* @__PURE__ */ React.createElement("aside", { className: "fd-card fd-site-prev" }, /* @__PURE__ */ React.createElement("div", { className: "fd-stage-k" }, "Footer preview"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { marginTop: 4 } }, shownCount ? `${shownCount} ${plural(shownCount, "item", "items")} visible to visitors.` : "Nothing is shown yet — the footer keeps its usual look."), /* @__PURE__ */ React.createElement("div", { className: "fd-prev" }, /* @__PURE__ */ React.createElement("div", { className: "fd-prev-brand" }, ICON.star, /* @__PURE__ */ React.createElement("span", null, "The Brial Endowment")), /* @__PURE__ */ React.createElement("p", null, "A sovereign philanthropic foundation. Direct-to-student. On-chain and fully transparent."), preview.filter((x) => LINE_TYPES.includes(x.type)).map((x, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "fd-prev-line" }, store.contactIcon(x.type, 16), /* @__PURE__ */ React.createElement("span", null, x.type === "whatsapp" ? "WhatsApp " + x.value : x.value))), /* @__PURE__ */ React.createElement("div", { className: "fd-prev-icons" }, preview.filter((x) => !LINE_TYPES.includes(x.type)).map((x, i) => /* @__PURE__ */ React.createElement("span", { key: i, title: x.type === "link" ? x.label : (T[x.type] || {}).label }, store.contactIcon(x.type, 16))))))), (dirty || m) && /* @__PURE__ */ React.createElement("div", { className: "fd-savebar" }, /* @__PURE__ */ React.createElement("span", { style: { color: m && m.tone === "err" ? "var(--rose)" : dirty ? "var(--amber)" : "var(--sage)", fontWeight: 600 } }, m && !dirty ? m.text : m && m.tone === "err" ? m.text : invalid ? "Fix the highlighted fields first" : "You have unsaved changes"), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, dirty && /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet", onClick: () => setF(JSON.parse(saved)) }, "Discard"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !dirty || invalid || busy, onClick: save }, busy ? "Saving…" : "Save and publish"))));
  }
  const MAIL_GROUPS = [
    { title: "Donors", sub: "From receipts@brialendowment.org", items: [
      ["receipt", "Donation receipt", "The official receipt with a PDF, sent the moment you verify a gift."]
    ] },
    { title: "Alerts for you", sub: "From desk@brialendowment.org to your alert address", items: [
      ["donation_reported", "New gift reported", "Someone reports a gift on the donate page."],
      ["application_submitted", "New application", "An applicant submits the scholarship application."],
      ["bill_uploaded", "Tuition bill uploaded", "A scholar uploads a bill for you to pay."],
      ["ip_uploaded", "Semester results uploaded", "A scholar uploads the results of a semester."],
      ["change_requested", "Change request", "A scholar asks to change a detail only you can approve."],
      ["report_new", "Help desk message", "A scholar writes to the help desk."],
      ["graduation", "Graduation submitted", "A scholar uploads the diploma and transcript."]
    ] },
    { title: "Applicants and scholars", sub: "From hello@brialendowment.org — replies come to you", items: [
      ["application_received", "Application received", "Confirms the application arrived and explains the next steps."],
      ["interview", "Interview invitation", "Date, time in WIB and Istanbul, and the meeting link."],
      ["accepted", "Scholarship approved", "Welcome, scholar ID, and the first step."],
      ["rejected", "Application declined", "A kind, respectful decision letter."],
      ["tuition_paid", "Tuition paid", "Confirms a semester's tuition has been paid, with the reference."],
      ["change_resolved", "Change request answered", "Tells the scholar whether you approved a change."],
      ["scholar_status", "Scholarship paused, resumed or ended", "Includes the note you wrote when you changed the status."],
      ["report_reply", "Help desk reply", "Your reply, with their original message."]
    ] }
  ];
  const MAIL_LABEL = { test: "Test email" };
  MAIL_GROUPS.forEach((g) => g.items.forEach(([k, l]) => {
    MAIL_LABEL[k] = l;
  }));
  const MAIL_TONE = { sent: "ok", pending: "warn", sending: "warn", skipped: "", failed: "bad" };
  const MAIL_WORD = { sent: "Sent", pending: "Waiting", sending: "Sending", skipped: "Not sent", failed: "Failed" };
  MAIL_LABEL.message = "Email you wrote";
  const REMINDER_KINDS = [
    ["interview_reminder", "Interview reminder", "To the applicant, about 24 hours before the interview."],
    ["bill_reminder", "Upload your tuition bill", "To scholars whose next semester has no bill yet, on the UKT dates below."],
    ["results_reminder", "Upload your semester results", "To scholars whose paid semester has no IP / KHS yet, on the results dates below."],
    ["bill_due", "Bill waiting / deadline near", "To you, when a bill's deadline is close or has passed, or a bill has waited too long."]
  ];
  REMINDER_KINDS.forEach(([k, l]) => {
    MAIL_LABEL[k] = l;
  });
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mdLabel = (md) => {
    const [m, d] = String(md).split("-").map(Number);
    return `${d} ${MONTHS[m - 1] || "?"}`;
  };
  const DEFAULT_REM = { billDates: ["01-10", "01-25", "07-25", "08-10"], resultDates: ["02-05", "02-20", "07-10", "07-25"], billGraceDays: 5 };
  function DateChips({ value, onChange }) {
    const [m, setM] = useState("1");
    const [d, setD] = useState("");
    const add = () => {
      const dd = parseInt(d, 10);
      if (!(dd >= 1 && dd <= 31)) return;
      const md = String(m).padStart(2, "0") + "-" + String(dd).padStart(2, "0");
      if (!value.includes(md)) onChange([...value, md].sort());
      setD("");
    };
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { gap: 6 } }, value.length === 0 && /* @__PURE__ */ React.createElement("small", { className: "fd-sub", style: { margin: 0 } }, "No dates — this reminder never goes out."), value.map((md) => /* @__PURE__ */ React.createElement("span", { key: md, className: "fd-tag gold" }, mdLabel(md), /* @__PURE__ */ React.createElement("button", { onClick: () => onChange(value.filter((x) => x !== md)), "aria-label": "Remove " + mdLabel(md), style: { background: "none", border: 0, color: "inherit", cursor: "pointer", padding: "0 0 0 4px" } }, "×")))), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 8, gap: 6 } }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", style: { width: 72 }, inputMode: "numeric", placeholder: "Day", value: d, onChange: (e) => setD(e.target.value.replace(/\D/g, "").slice(0, 2)), "aria-label": "Day" }), /* @__PURE__ */ React.createElement("select", { className: "fd-input", style: { width: 92 }, value: m, onChange: (e) => setM(e.target.value), "aria-label": "Month" }, MONTHS.map((x, i) => /* @__PURE__ */ React.createElement("option", { key: x, value: i + 1 }, x))), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", onClick: add, disabled: !(parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) }, "Add date")));
  }
  const SENDERS = [
    ["brial", "Brial Asif Hayi Paka", "brial@brialendowment.org", "A personal letter from you"],
    ["hello", "The Brial Endowment", "hello@brialendowment.org", "The foundation's general address"],
    ["receipts", "The Brial Endowment", "receipts@brialendowment.org", "For anything about gifts and receipts"]
  ];
  const PROGRAMMES = ["The Brial Endowment — general endowment fund", "Scholarships", "Clean Water — wells and water systems", "Food & Land — Trees for Life, olive trees in Palestine", "Houses of Worship", "Hospitals", "Schools", "Livestock & Enterprise", "Sustainable Infrastructure", "Library"];
  const THANKS = "Dear …,\n\nThank you for your generous contribution of $… to …. Because of you, …\n\n…\n\nMay God accept it from you and multiply its reward.\n\nWith heartfelt thanks,";
  const splitTo = (s) => String(s || "").split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
  function Composer({ store, onClose, onSent }) {
    const [f, setF] = useState({ from: "brial", to: "", subject: "", body: "", sign: true });
    const [ackOn, setAckOn] = useState(false);
    const [ack, setAck] = useState({ name: "", amount: "", programme: "", date: new Date(Date.now() - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4).toISOString().slice(0, 10), reference: "", pdf: true });
    const [prev, setPrev] = useState(null);
    const [busy, setBusy] = useState("");
    const [err, setErr] = useState("");
    const set = (k, v) => {
      setF((p) => ({ ...p, [k]: v }));
      setPrev(null);
    };
    const setA = (k, v) => {
      setAck((p) => ({ ...p, [k]: v }));
      setPrev(null);
    };
    const tos = splitTo(f.to);
    const badTo = tos.filter((t) => !okEmail(t));
    const amt = parseFloat(String(ack.amount).replace(/,/g, ""));
    const ackBad = ackOn && !(amt > 0);
    const ready = tos.length > 0 && tos.length <= 20 && !badTo.length && f.subject.trim() && f.body.trim() && !ackBad;
    const msg = () => ({ ...f, to: tos, subject: f.subject.trim(), body: f.body.trim(), ack: ackOn ? { ...ack, amount: amt } : null });
    const preview = async () => {
      setBusy("prev");
      setErr("");
      try {
        setPrev(await store.previewMessage(msg()));
      } catch (e) {
        setErr("Could not load the preview.");
      }
      setBusy("");
    };
    const send = async () => {
      setBusy("send");
      setErr("");
      try {
        const r = await store.sendMessage(msg());
        onSent(r && r.queued ? r.queued : tos.length);
        onClose();
      } catch (e) {
        const c = String(e && (e.message || e));
        setErr(c.indexOf("rate_limited") >= 0 ? "That's a lot of email in one hour — wait a little, then try again." : c.indexOf("invalid_email") >= 0 ? "One of the addresses doesn't look right." : "Could not send right now. Try again in a moment.");
      }
      setBusy("");
    };
    const S = SENDERS.find((s) => s[0] === f.from) || SENDERS[0];
    return /* @__PURE__ */ React.createElement(Modal, { wide: true, title: "Write an email", sub: "Sent from brialendowment.org. Replies come back to hello@, which forwards to your inbox.", onClose }, prev ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fd-sub", style: { margin: "0 0 10px" } }, /* @__PURE__ */ React.createElement("b", { style: { color: "var(--text)" } }, "From"), " ", S[1], " <", S[2], "> · ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--text)" } }, "To"), " ", tos.join(", "), ackOn && ack.pdf ? " · PDF acknowledgement attached" : ""), /* @__PURE__ */ React.createElement("iframe", { className: "fd-mprev", title: "Email preview", sandbox: "", srcDoc: prev.html }), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement(Confirm, { className: "fd-btn primary", armedLabel: `Confirm · send to ${tos.length} ${plural(tos.length, "person", "people")}`, disabled: !ready || !!busy, onConfirm: send }, busy === "send" ? "Sending…" : "Send"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: () => setPrev(null) }, "Back to editing"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "From" }, /* @__PURE__ */ React.createElement("select", { className: "fd-input", value: f.from, onChange: (e) => set("from", e.target.value) }, SENDERS.map((s) => /* @__PURE__ */ React.createElement("option", { key: s[0], value: s[0] }, s[1], " — ", s[2])))), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: "4px 0 0" } }, S[3], "."), /* @__PURE__ */ React.createElement(Field, { label: "To", hint: badTo.length ? "" : "One or more addresses, separated by commas. Each person gets their own email.", style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.to, onChange: (e) => set("to", e.target.value), placeholder: "name@example.com", spellCheck: false })), badTo.length > 0 && /* @__PURE__ */ React.createElement("small", { className: "fd-bad" }, "Check: ", badTo.join(", ")), /* @__PURE__ */ React.createElement(Field, { label: "Subject", style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: f.subject, maxLength: 200, onChange: (e) => set("subject", e.target.value), placeholder: "Thank you for …" })), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { margin: "12px 0 6px" } }, /* @__PURE__ */ React.createElement("span", { className: "fd-sub", style: { margin: 0 } }, "Start from"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => {
      set("body", THANKS);
      if (!f.subject) set("subject", "Thank you");
    } }, "Thank-you letter"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: () => set("body", "") }, "Blank")), /* @__PURE__ */ React.createElement(Field, { label: "Message", hint: "Leave an empty line between paragraphs." }, /* @__PURE__ */ React.createElement("textarea", { className: "fd-input", rows: 10, maxLength: 1e4, value: f.body, onChange: (e) => set("body", e.target.value), placeholder: "Dear …," })), /* @__PURE__ */ React.createElement("div", { className: "fd-krow", style: { borderTop: 0 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Sign with my name"), /* @__PURE__ */ React.createElement("small", null, 'Adds "Brial Asif Hayi Paka · Founder, The Brial Endowment" under the message.')), /* @__PURE__ */ React.createElement(Switch, { on: f.sign, onChange: (v) => set("sign", v) }, f.sign ? "On" : "Off")), /* @__PURE__ */ React.createElement("div", { className: "fd-krow" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Acknowledge a contribution"), /* @__PURE__ */ React.createElement("small", null, "Adds the amount and programme to the email, with a PDF acknowledgement. It does not change the public ledger.")), /* @__PURE__ */ React.createElement(Switch, { on: ackOn, onChange: (v) => {
      setAckOn(v);
      setPrev(null);
    } }, ackOn ? "On" : "Off")), ackOn && /* @__PURE__ */ React.createElement("div", { className: "fd-card", style: { background: "rgba(10,22,40,.4)", marginTop: 6 } }, /* @__PURE__ */ React.createElement("div", { className: "fd-grid2" }, /* @__PURE__ */ React.createElement(Field, { label: "Contributed by" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: ack.name, onChange: (e) => setA("name", e.target.value), placeholder: "Full name" })), /* @__PURE__ */ React.createElement(Field, { label: "Amount (USD)" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", inputMode: "decimal", value: ack.amount, onChange: (e) => setA("amount", e.target.value), placeholder: "35" })), /* @__PURE__ */ React.createElement(Field, { label: "Programme" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", list: "fd-programmes", value: ack.programme, onChange: (e) => setA("programme", e.target.value), placeholder: "Food & Land — …" }), /* @__PURE__ */ React.createElement("datalist", { id: "fd-programmes" }, PROGRAMMES.map((x) => /* @__PURE__ */ React.createElement("option", { key: x, value: x })))), /* @__PURE__ */ React.createElement(Field, { label: "Date of contribution" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "date", value: ack.date, onChange: (e) => setA("date", e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Reference (optional)" }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", value: ack.reference, onChange: (e) => setA("reference", e.target.value), placeholder: "Bank or grant reference" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(Switch, { on: ack.pdf, onChange: (v) => setA("pdf", v) }, "Attach PDF"))), ackBad && /* @__PURE__ */ React.createElement("small", { className: "fd-bad" }, "Enter the amount.")), err && /* @__PURE__ */ React.createElement("div", { className: "fd-msg err", style: { marginTop: 12 } }, err), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: !ready || !!busy, onClick: preview }, busy === "prev" ? "Preparing…" : "Preview"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost", onClick: onClose }, "Cancel"), !ready && /* @__PURE__ */ React.createElement("small", { className: "fd-sub", style: { margin: 0 } }, "Fill in who it's to, a subject and the message."))), prev && err && /* @__PURE__ */ React.createElement("div", { className: "fd-msg err", style: { marginTop: 12 } }, err));
  }
  const offKinds = (k) => Object.keys(k || {}).filter((x) => k[x] === false).sort().join(",");
  const remKey = (r) => JSON.stringify([(r && r.billDates || []).slice().sort(), (r && r.resultDates || []).slice().sort(), Number(r && r.billGraceDays) || 5]);
  const mailDirty = (a, b) => !!(a && b) && (a.founderTo.trim() !== b.founderTo || offKinds(a.kinds) !== offKinds(b.kinds) || remKey(a.reminders) !== remKey(b.reminders));
  function EmailView({ store }) {
    const [s, setS] = useState(null);
    const [sv, setSv] = useState(null);
    const svRef = useRef(null);
    const [log, setLog] = useState([]);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState("");
    const [prev, setPrev] = useState(null);
    const [compose, setCompose] = useState(false);
    const [m, flash] = useFlash();
    const keep = (st) => {
      const norm = { founderTo: st.founderTo || "hello@brialendowment.org", paused: !!st.paused, kinds: st.kinds || {}, reminders: { ...DEFAULT_REM, ...st.reminders || {} } };
      svRef.current = norm;
      setSv(norm);
      return norm;
    };
    const load = useCallback(async () => {
      try {
        const [st, lg] = await Promise.all([store.getMailSettings(), store.mailLog(40)]);
        const before = svRef.current, norm = keep(st);
        setS((cur) => cur && mailDirty(cur, before) ? cur : norm);
        setLog(lg || []);
        setErr("");
      } catch (e) {
        setErr("Could not load the email settings. Check your connection and refresh.");
      }
    }, [store]);
    useEffect(() => {
      load();
      const t = setInterval(() => {
        store.mailLog(40).then((l) => setLog(l || [])).catch(() => {
        });
      }, 2e4);
      return () => clearInterval(t);
    }, [load]);
    if (err && !s) return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Email" }), /* @__PURE__ */ React.createElement("div", { className: "fd-msg err" }, err));
    if (!s || !sv) return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Email" }), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Loading…"));
    const dirty = mailDirty(s, sv);
    const badTo = !okEmail(s.founderTo);
    const on = (k) => s.kinds[k] !== false;
    const setKind = (k, v) => setS((p) => ({ ...p, kinds: { ...p.kinds, [k]: v } }));
    const setRem = (k, v) => setS((p) => ({ ...p, reminders: { ...p.reminders, [k]: v } }));
    const persist = async (next) => {
      const res = await store.saveMailSettings(next);
      return keep(res);
    };
    const save = async () => {
      setBusy("save");
      try {
        const n = await persist({ founderTo: s.founderTo.trim(), kinds: s.kinds, reminders: s.reminders, paused: sv.paused });
        setS(n);
        flash("Saved.");
      } catch (e) {
        flash("Could not save. Try again.", "err");
      }
      setBusy("");
    };
    const togglePause = async () => {
      setBusy("pause");
      try {
        const n = await persist({ ...sv, paused: !sv.paused });
        setS((cur) => ({ ...cur, paused: n.paused }));
        flash(n.paused ? "Sending is paused. New emails wait in the queue." : "Sending is on. Anything waiting goes out now.");
        setTimeout(load, 4e3);
      } catch (e) {
        flash("Could not change it. Try again.", "err");
      }
      setBusy("");
    };
    const test = async () => {
      setBusy("test");
      try {
        await store.sendTestEmail();
        flash(`A test email is on its way to ${sv.founderTo}.`);
        setTimeout(load, 5e3);
      } catch (e) {
        flash(String(e && e.message).indexOf("rate_limited") >= 0 ? "That's enough tests for this hour." : "Could not send a test right now.", "err");
      }
      setBusy("");
    };
    const preview = async () => {
      setBusy("prev");
      try {
        setPrev(await store.mailPreview());
      } catch (e) {
        flash("Could not load the preview.", "err");
      }
      setBusy("");
    };
    const samplePdf = async () => {
      setBusy("pdf");
      try {
        await store.downloadReceiptPdf(null, true);
      } catch (e) {
        flash("Could not create the sample PDF.", "err");
      }
      setBusy("");
    };
    const paused = sv.paused;
    const day = Date.now() - 864e5;
    const sent24 = log.filter((x) => x.status === "sent" && new Date(x.sentAt).getTime() > day).length;
    const waiting = log.filter((x) => x.status === "pending" || x.status === "sending").length;
    const failed = log.filter((x) => x.status === "failed").length;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Head, { title: "Email", lede: "Receipts for donors, notices for applicants and scholars, and alerts for you, all sent from brialendowment.org." }), /* @__PURE__ */ React.createElement("div", { className: "fd-mail" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-mstat" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2", style: { marginTop: 0 } }, "Write an email"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: 0 } }, "A thank-you, an update or a reply, sent from brial@, hello@ or receipts@brialendowment.org.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: paused, title: paused ? "Resume sending first" : "", onClick: () => setCompose(true) }, ICON.send, "Write an email"))), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-mstat" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Tag, { tone: paused ? "warn" : "ok", dot: true }, paused ? "Paused" : "Sending"), /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, paused ? "Emails are waiting, not sent" : "Email is on"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: 0 } }, paused ? "Events are still recorded. Everything waiting goes out when you resume." : "Each email goes out a few seconds after the event that triggers it.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn " + (paused ? "primary" : "ghost"), disabled: !!busy, onClick: togglePause }, busy === "pause" ? "…" : paused ? "Resume sending" : "Pause sending")), /* @__PURE__ */ React.createElement(Stats, { items: [{ label: "Sent in the last 24 hours", value: sent24, sub: "Free plan: up to 100 a day", tone: "ok" }, { label: "Waiting", value: waiting, tone: waiting ? "warn" : "" }, { label: "Failed", value: failed, sub: failed ? "See the activity list" : "None", tone: failed ? "bad" : "" }] }), /* @__PURE__ */ React.createElement("div", { className: "fd-actions", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", disabled: !!busy || paused, onClick: test, title: paused ? "Resume sending first" : "" }, ICON.send, busy === "test" ? "Sending…" : "Send a test email"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", disabled: !!busy, onClick: preview }, busy === "prev" ? "Loading…" : "Preview the receipt email"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn ghost sm", disabled: !!busy, onClick: samplePdf }, ICON.pdf, busy === "pdf" ? "Preparing…" : "Sample receipt PDF")), m && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement(Flash, { m }))), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Your alerts go to"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "hello@brialendowment.org forwards to your Gmail. Use another address only if you have a reason to."))), /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "email", value: s.founderTo, onChange: (e) => setS((p) => ({ ...p, founderTo: e.target.value })), spellCheck: false, "aria-label": "Alert address" }), badTo && /* @__PURE__ */ React.createElement("small", { className: "fd-bad" }, "This doesn't look like an email address.")), /* @__PURE__ */ React.createElement("div", { className: "fd-card" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, "Reminders"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Sent automatically, once each. Dates follow Jakarta time and go out from 09:00 WIB."))), REMINDER_KINDS.map(([k, label, desc]) => /* @__PURE__ */ React.createElement("div", { className: "fd-krow", key: k }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, label), /* @__PURE__ */ React.createElement("small", null, desc)), /* @__PURE__ */ React.createElement(Switch, { on: on(k), onChange: (v) => setKind(k, v) }, on(k) ? "On" : "Off"))), /* @__PURE__ */ React.createElement("div", { className: "fd-grid2", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "fd-stage-k", style: { marginBottom: 8 } }, "UKT bill dates"), /* @__PURE__ */ React.createElement(DateChips, { value: s.reminders.billDates, onChange: (v) => setRem("billDates", v) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "fd-stage-k", style: { marginBottom: 8 } }, "Results dates"), /* @__PURE__ */ React.createElement(DateChips, { value: s.reminders.resultDates, onChange: (v) => setRem("resultDates", v) }))), /* @__PURE__ */ React.createElement(Field, { label: "Warn me this many days before a bill's deadline", hint: "Bills without a deadline: a weekly note once they have waited this long.", style: { marginTop: 14, maxWidth: 360 } }, /* @__PURE__ */ React.createElement("input", { className: "fd-input", type: "number", min: 1, max: 30, value: s.reminders.billGraceDays, onChange: (e) => setRem("billGraceDays", Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1))) }))), MAIL_GROUPS.map((g) => /* @__PURE__ */ React.createElement("div", { className: "fd-card", key: g.title }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "fd-h2" }, g.title), /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, g.sub))), g.items.map(([k, label, desc]) => /* @__PURE__ */ React.createElement("div", { className: "fd-krow", key: k }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, label), /* @__PURE__ */ React.createElement("small", null, desc)), /* @__PURE__ */ React.createElement(Switch, { on: on(k), onChange: (v) => setKind(k, v) }, on(k) ? "On" : "Off")))))), /* @__PURE__ */ React.createElement("aside", { className: "fd-card fd-site-prev" }, /* @__PURE__ */ React.createElement("div", { className: "fd-card-head", style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "fd-stage-k" }, "Activity"), /* @__PURE__ */ React.createElement("p", { className: "fd-sub", style: { margin: "4px 0 0" } }, "The latest emails, newest first.")), /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet sm", onClick: load }, "Refresh")), log.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "fd-sub" }, "Nothing sent yet.") : /* @__PURE__ */ React.createElement("div", { className: "fd-mlog" }, log.map((x) => /* @__PURE__ */ React.createElement("div", { className: "fd-mlog-i", key: x.id }, /* @__PURE__ */ React.createElement("b", null, x.kind === "message" ? x.subject || MAIL_LABEL.message : MAIL_LABEL[x.kind] || x.kind), /* @__PURE__ */ React.createElement(Tag, { tone: MAIL_TONE[x.status] }, MAIL_WORD[x.status] || x.status), /* @__PURE__ */ React.createElement("small", null, [x.to, fdatetime(x.sentAt || x.createdAt)].filter(Boolean).join(" · ")), /* @__PURE__ */ React.createElement("span", null), x.error && x.status !== "sent" && /* @__PURE__ */ React.createElement("small", { style: { gridColumn: "1 / -1", color: x.status === "failed" ? "var(--rose)" : "var(--faint)" } }, x.error)))))), dirty && /* @__PURE__ */ React.createElement("div", { className: "fd-savebar" }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--amber)", fontWeight: 600 } }, badTo ? "Fix the alert address first" : "You have unsaved changes"), /* @__PURE__ */ React.createElement("div", { className: "fd-actions" }, /* @__PURE__ */ React.createElement("button", { className: "fd-btn quiet", onClick: () => setS(sv) }, "Discard"), /* @__PURE__ */ React.createElement("button", { className: "fd-btn primary", disabled: badTo || !!busy, onClick: save }, busy === "save" ? "Saving…" : "Save"))), compose && /* @__PURE__ */ React.createElement(Composer, { store, onClose: () => setCompose(false), onSent: (n) => {
      flash(`${n} ${plural(n, "email is", "emails are")} on the way.`);
      setTimeout(load, 5e3);
      setTimeout(load, 15e3);
    } }), prev && /* @__PURE__ */ React.createElement(Modal, { wide: true, title: prev.subject, sub: "From " + prev.from + " · sample data", onClose: () => setPrev(null) }, /* @__PURE__ */ React.createElement("iframe", { className: "fd-mprev", title: "Receipt email preview", sandbox: "", srcDoc: prev.html })));
  }
  function FounderDesk({ pillar, store, onBack, onExit, founderEmail, onLogout }) {
    useStyles();
    const key = "fd-tab-" + pillar;
    const [tab, setTabS] = useNav(key, () => {
      try {
        return sessionStorage.getItem(key) || "";
      } catch (e) {
        return "";
      }
    });
    const [focus, setFocus] = useState(null);
    const setTab = (t2) => {
      setTabS(t2);
      try {
        sessionStorage.setItem(key, t2);
      } catch (e) {
      }
      window.scrollTo({ top: 0 });
    };
    const meta = PILLARS[pillar] || { name: pillar, accent: "#C9A961" };
    let nav, view;
    if (pillar === "scholarships") {
      const apps = store.listApplicants();
      const scholars = apps.filter((a) => a.status === "accepted");
      const reports = store.listReports();
      const donations = store.listDonations();
      const due = scholars.reduce((a, s) => a + (s.semesters || []).filter((x) => x.status === "bill-uploaded").length, 0);
      const todo = apps.filter((a) => ["submitted", "interview-scheduled", "interview-done"].includes(a.status)).length;
      const reqs = apps.reduce((a, x) => a + (x.changeRequests || []).filter((r) => r.status === "pending").length, 0);
      const unver = donations.filter((d) => !(store.isInternalDonation && store.isInternalDonation(d)) && !d.verified).length;
      const open = reports.filter((r) => r.status === "open").length;
      nav = [
        { id: "apps", label: "Applications", icon: ICON.inbox, count: todo + reqs, hot: todo + reqs > 0 },
        { id: "pay", label: "Disbursements", icon: ICON.pay, count: due, hot: due > 0 },
        { id: "scholars", label: "Scholars", icon: ICON.cap, count: scholars.length },
        { id: "gifts", label: "Donations", icon: ICON.gift, count: unver, hot: unver > 0 },
        { id: "help", label: "Help desk", icon: ICON.help, count: open, hot: open > 0 },
        { id: "accounts", label: "Accounts", icon: ICON.users, count: apps.length }
      ];
      const t2 = nav.some((n) => n.id === tab) ? tab : "apps";
      const openRecord = (id) => {
        setFocus(id);
        setTab("apps");
      };
      view = t2 === "apps" ? /* @__PURE__ */ React.createElement(ApplicationsView, { store, apps, focus, clearFocus: () => setFocus(null) }) : t2 === "pay" ? /* @__PURE__ */ React.createElement(DisbursementsView, { store, scholars }) : t2 === "scholars" ? /* @__PURE__ */ React.createElement(ScholarsView, { store, scholars, openRecord }) : t2 === "gifts" ? /* @__PURE__ */ React.createElement(DonationsView, { store, donations }) : t2 === "help" ? /* @__PURE__ */ React.createElement(HelpDeskView, { store, reports }) : /* @__PURE__ */ React.createElement(AccountsView, { store, apps, deleted: store.listDeleted(), openRecord });
      return /* @__PURE__ */ React.createElement(Shell, { store, pillarKey: pillar, meta, nav, active: t2, onNav: setTab, onBack, onExit, founderEmail, onLogout }, view);
    }
    if (pillar === "library") {
      nav = [
        { id: "catalog", label: "Catalogue", icon: ICON.book, count: store.listEbooks().length },
        { id: "sales", label: "Sales", icon: ICON.sale, count: store.listLibrarySales().length },
        { id: "link", label: "Pillar link", icon: ICON.link }
      ];
      const t2 = nav.some((n) => n.id === tab) ? tab : "catalog";
      view = t2 === "catalog" ? /* @__PURE__ */ React.createElement(CatalogView, { store }) : t2 === "sales" ? /* @__PURE__ */ React.createElement(SalesView, { store }) : /* @__PURE__ */ React.createElement(LinkView, { store, pillarKey: pillar, cfg: meta });
      return /* @__PURE__ */ React.createElement(Shell, { store, pillarKey: pillar, meta, nav, active: t2, onNav: setTab, onBack, onExit, founderEmail, onLogout }, view);
    }
    if (pillar === "treasury") {
      const F = {
        pendingIn: (store.listDonations() || []).filter((d) => !(store.isInternalDonation && store.isInternalDonation(d)) && !d.verified).length,
        due: store.listApplicants().filter((a) => a.status === "accepted").reduce((a, s) => a + (s.semesters || []).filter((x) => x.status === "bill-uploaded").length, 0)
      };
      nav = [
        { id: "overview", label: "Overview", icon: ICON.overview },
        { id: "in", label: "Money in", icon: ICON.inflow, count: F.pendingIn, hot: F.pendingIn > 0 },
        { id: "out", label: "Money out", icon: ICON.outflow, count: F.due, hot: F.due > 0 },
        { id: "ledger", label: "Ledger", icon: ICON.ledger },
        { id: "channels", label: "Payment channels", icon: ICON.pay }
      ];
      const t2 = nav.some((n) => n.id === tab) ? tab : "overview";
      view = t2 === "overview" ? /* @__PURE__ */ React.createElement(TreasuryOverview, { store, go: setTab }) : t2 === "in" ? /* @__PURE__ */ React.createElement(DonationsView, { store, donations: store.listDonations(), title: "Money in" }) : t2 === "out" ? /* @__PURE__ */ React.createElement(MoneyOutView, { store }) : t2 === "ledger" ? /* @__PURE__ */ React.createElement(LedgerView, { store }) : /* @__PURE__ */ React.createElement(ChannelsView, { store });
      return /* @__PURE__ */ React.createElement(Shell, { store, pillarKey: pillar, meta, nav, active: t2, onNav: setTab, onBack, onExit, founderEmail, onLogout, noVisibility: true }, view);
    }
    if (pillar === "impact") {
      const reps = store.getImpactReports ? store.getImpactReports() : [];
      nav = [{ id: "report", label: "Annual report", icon: ICON.report, count: reps.length }];
      return /* @__PURE__ */ React.createElement(Shell, { store, pillarKey: pillar, meta, nav, active: "report", onNav: setTab, onBack, onExit, founderEmail, onLogout, noVisibility: true }, /* @__PURE__ */ React.createElement(ImpactView, { store }));
    }
    if (pillar === "site") {
      nav = [{ id: "contact", label: "Contact & social", icon: ICON.contact }];
      view = /* @__PURE__ */ React.createElement(ContactView, { store });
      return /* @__PURE__ */ React.createElement(Shell, { store, pillarKey: pillar, meta, nav, active: "contact", onNav: setTab, onBack, onExit, founderEmail, onLogout, noVisibility: true }, view);
    }
    if (pillar === "security") {
      nav = [{ id: "security", label: "Security", icon: ICON.shield }];
      return /* @__PURE__ */ React.createElement(Shell, { store, pillarKey: pillar, meta, nav, active: "security", onNav: setTab, onBack, onExit, founderEmail, onLogout, noVisibility: true }, /* @__PURE__ */ React.createElement(SecurityView, { store }));
    }
    if (pillar === "email") {
      nav = [{ id: "email", label: "Email", icon: ICON.send }];
      view = /* @__PURE__ */ React.createElement(EmailView, { store });
      return /* @__PURE__ */ React.createElement(Shell, { store, pillarKey: pillar, meta, nav, active: "email", onNav: setTab, onBack, onExit, founderEmail, onLogout, noVisibility: true }, view);
    }
    if (pillar === "transport") {
      const cfg2 = PILLARS.transport;
      nav = [
        { id: "contrib", label: "Contributions", icon: ICON.inflow, count: store.listEnterpriseIncome ? store.listEnterpriseIncome("go2rent").length : 0 },
        { id: "story", label: "Programme page", icon: ICON.story },
        { id: "link", label: "Partner button", icon: ICON.link }
      ];
      const t2 = nav.some((n) => n.id === tab) ? tab : "contrib";
      view = t2 === "contrib" ? /* @__PURE__ */ React.createElement(ContributionsView, { store }) : t2 === "story" ? /* @__PURE__ */ React.createElement(ProgrammeView, { key: pillar, store, cfg: cfg2 }) : /* @__PURE__ */ React.createElement(LinkView, { store, pillarKey: pillar, cfg: cfg2 });
      return /* @__PURE__ */ React.createElement(Shell, { store, pillarKey: pillar, meta, nav, active: t2, onNav: setTab, onBack, onExit, founderEmail, onLogout }, view);
    }
    const cfg = PILLARS[pillar];
    if (!cfg) return null;
    nav = [
      { id: "grants", label: "Grants", icon: ICON.grant, count: store.getPillarGrants().filter((g) => g.pillar === cfg.grantName && !g.archived).length },
      { id: "story", label: "Programme page", icon: ICON.story },
      { id: "link", label: cfg.linkMode === "pillar" ? "Pillar link" : "Partner button", icon: ICON.link }
    ];
    const t = nav.some((n) => n.id === tab) ? tab : "grants";
    view = t === "grants" ? /* @__PURE__ */ React.createElement(GrantsView, { store, cfg }) : t === "story" ? /* @__PURE__ */ React.createElement(ProgrammeView, { key: pillar, store, cfg }) : /* @__PURE__ */ React.createElement(LinkView, { store, pillarKey: pillar, cfg });
    return /* @__PURE__ */ React.createElement(Shell, { store, pillarKey: pillar, meta, nav, active: t, onNav: setTab, onBack, onExit, founderEmail, onLogout }, view);
  }
  FounderDesk.Home = FounderHome;
  FounderDesk.Login = FounderGate;
  return FounderDesk;
})();
// <<< FOUNDER DESK

// ============================================================
// MAIN PORTAL
// ============================================================
const PillarChooser = ({
  store,
  onPick,
  scholarCount,
  worshipCount,
  ebookCount,
  foodlandCount,
  foodlandGrantCount,
  waterGrantCount,
  salesCount,
  bare,
  only
}) => {
  const cards = [{
    id: "scholarships",
    label: "Scholarships",
    sub: "Beasiswa",
    accent: "#86E5A7",
    d: "Applications, interviews, disbursements, scholars, donations, reports & accounts.",
    meta: `${scholarCount} active scholar${scholarCount === 1 ? "" : "s"}`,
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "52",
      height: "52",
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
    id: "worship",
    label: "Houses of Worship",
    sub: "Masjid",
    accent: "#C9A961",
    d: "Record and manage mosque construction grants to partner foundations.",
    meta: `${worshipCount} grant${worshipCount === 1 ? "" : "s"} recorded`,
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "52",
      height: "52",
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
    }), /*#__PURE__*/React.createElement("path", {
      d: "M28 56 L28 46 Q32 42 36 46 L36 56"
    }))
  }, {
    id: "library",
    label: "The Library",
    sub: "Pustaka",
    accent: "#C98A61",
    d: "Manage the e-book catalog, record sales income, and set where the pillar sends its readers.",
    meta: `${ebookCount} book${ebookCount === 1 ? "" : "s"} · ${salesCount} sale${salesCount === 1 ? "" : "s"}`,
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "52",
      height: "52",
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
    id: "foodland",
    label: "Food & Land",
    sub: "Pangan",
    accent: "#A8C97F",
    d: "Record planting grants and curate the Trees for Life programme — story, field notes, and the partner link.",
    meta: `${foodlandGrantCount} grant${foodlandGrantCount === 1 ? "" : "s"} · ${foodlandCount} field note${foodlandCount === 1 ? "" : "s"}`,
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "52",
      height: "52",
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
    id: "water",
    label: "Clean Water",
    sub: "Sumur",
    accent: "#7FB8C9",
    d: "Record well grants and curate the Clean Water programme \u2014 story, field notes, and the partner link.",
    meta: `${waterGrantCount} grant${waterGrantCount === 1 ? "" : "s"} recorded`,
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "52",
      height: "52",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M32 8 Q45 27 45 38 A13 13 0 0 1 19 38 Q19 27 32 8 Z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M25 40 A7 7 0 0 0 32 47"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M14 56 Q32 50 50 56",
      strokeWidth: "1.3"
    }))
  }, {
    id: "hospitals",
    label: "Hospitals",
    sub: "Rumah Sakit",
    accent: "#C9847F",
    d: "Record clinic grants and curate the Hospitals programme — story, journal, and the partner link.",
    meta: (n => n + " grant" + (n === 1 ? "" : "s") + " recorded")(store && store.getPillarGrants ? store.getPillarGrants().filter(g => g.pillar === "Hospitals").length : 0),
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "52",
      height: "52",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("rect", { x: "14", y: "22", width: "36", height: "32" }), /*#__PURE__*/React.createElement("path", { d: "M14 22 L32 10 L50 22" }), /*#__PURE__*/React.createElement("path", { d: "M32 32 L32 44 M26 38 L38 38" }), /*#__PURE__*/React.createElement("line", { x1: "10", y1: "54", x2: "54", y2: "54", strokeWidth: "1.4" }))
  }, {
    id: "schools",
    label: "Schools",
    sub: "Sekolah",
    accent: "#C9BC7F",
    d: "Record school grants and curate the Schools programme — story, journal, and the partner link.",
    meta: (n => n + " grant" + (n === 1 ? "" : "s") + " recorded")(store && store.getPillarGrants ? store.getPillarGrants().filter(g => g.pillar === "Schools").length : 0),
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "52",
      height: "52",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("path", { d: "M8 26 L32 12 L56 26" }), /*#__PURE__*/React.createElement("rect", { x: "16", y: "26", width: "32", height: "26" }), /*#__PURE__*/React.createElement("rect", { x: "28", y: "38", width: "8", height: "14" }), /*#__PURE__*/React.createElement("line", { x1: "12", y1: "52", x2: "52", y2: "52", strokeWidth: "1.4" }))
  }, {
    id: "livestock",
    label: "Livestock & Enterprise",
    sub: "Ternak",
    accent: "#C9A07F",
    d: "Record capital placements and curate the Livestock & Enterprise programme — story, journal, and the partner link.",
    meta: (n => n + " grant" + (n === 1 ? "" : "s") + " recorded")(store && store.getPillarGrants ? store.getPillarGrants().filter(g => g.pillar === "Livestock & Enterprise").length : 0),
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "52",
      height: "52",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("path", { d: "M20 16 Q14 20 16 27" }), /*#__PURE__*/React.createElement("path", { d: "M44 16 Q50 20 48 27" }), /*#__PURE__*/React.createElement("path", { d: "M16 27 Q16 42 32 50 Q48 42 48 27 Q40 22 32 24 Q24 22 16 27 Z" }), /*#__PURE__*/React.createElement("circle", { cx: "26", cy: "33", r: "1", fill: "currentColor", stroke: "none" }), /*#__PURE__*/React.createElement("circle", { cx: "38", cy: "33", r: "1", fill: "currentColor", stroke: "none" }), /*#__PURE__*/React.createElement("path", { d: "M28 42 Q32 45 36 42" }))
  }, {
    id: "infra",
    label: "Sustainable Infrastructure",
    sub: "Prasarana",
    accent: "#9FA8B8",
    d: "Record public-works grants and curate the Infrastructure programme — story, journal, and the partner link.",
    meta: (n => n + " grant" + (n === 1 ? "" : "s") + " recorded")(store && store.getPillarGrants ? store.getPillarGrants().filter(g => g.pillar === "Sustainable Infrastructure").length : 0),
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "52",
      height: "52",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("line", { x1: "8", y1: "44", x2: "56", y2: "44" }), /*#__PURE__*/React.createElement("path", { d: "M14 44 Q32 18 50 44" }), /*#__PURE__*/React.createElement("line", { x1: "22", y1: "44", x2: "22", y2: "34" }), /*#__PURE__*/React.createElement("line", { x1: "32", y1: "44", x2: "32", y2: "31" }), /*#__PURE__*/React.createElement("line", { x1: "42", y1: "44", x2: "42", y2: "34" }), /*#__PURE__*/React.createElement("line", { x1: "10", y1: "52", x2: "54", y2: "52", strokeWidth: "1.4" }))
  }, {
    id: "treasury",
    label: "Treasury",
    sub: "Money in & out",
    accent: "#7FC9A8",
    d: "Every gift received and every payment made \u2014 verify donations, pay tuition bills, and keep a ledger your accountant can read.",
    meta: (() => { const n = store && store.listDonations ? store.listDonations().filter(d => !(store.isInternalDonation && store.isInternalDonation(d)) && !d.verified).length : 0; return n ? n + " to verify" : "all gifts verified"; })(),
    icon: /*#__PURE__*/React.createElement("svg", { viewBox: "0 0 64 64", width: "52", height: "52", fill: "none", stroke: "currentColor", strokeWidth: "1.1" }, /*#__PURE__*/React.createElement("path", { d: "M8 24 L32 10 L56 24" }), /*#__PURE__*/React.createElement("path", { d: "M14 26 V46 M24 26 V46 M40 26 V46 M50 26 V46" }), /*#__PURE__*/React.createElement("path", { d: "M8 50 H56 M6 55 H58" }))
  }, {
    id: "impact",
    label: "Impact Report",
    sub: "Once a year",
    accent: "#E2C98E",
    d: "The yearly report to donors and the world. The numbers come from your records, the words come from you. Published on the website and as a PDF.",
    meta: (() => { const r = store && store.getImpactReports ? store.getImpactReports() : []; const pub = r.filter(x => x.status === "published").length; return r.length ? (pub + " published, " + (r.length - pub) + " draft" + (r.length - pub === 1 ? "" : "s")) : "No report yet"; })(),
    icon: /*#__PURE__*/React.createElement("svg", { viewBox: "0 0 64 64", width: "52", height: "52", fill: "none", stroke: "currentColor", strokeWidth: "1.1" }, /*#__PURE__*/React.createElement("path", { d: "M16 8 H40 L50 18 V56 H16 Z" }), /*#__PURE__*/React.createElement("path", { d: "M40 8 V18 H50" }), /*#__PURE__*/React.createElement("path", { d: "M24 46 V38 M32 46 V30 M40 46 V34" }), /*#__PURE__*/React.createElement("path", { d: "M32 14 l1.6 3.4 3.6.4 -2.7 2.4 .8 3.6 -3.3-1.9 -3.3 1.9 .8-3.6 -2.7-2.4 3.6-.4z" }))
  }, {
    id: "email",
    label: "Email",
    sub: "Letters & receipts",
    accent: "#9FC3E2",
    d: "Write letters, send receipts and acknowledgements, and look after the notices and reminders that go out on their own.",
    meta: "Sent from brialendowment.org",
    icon: /*#__PURE__*/React.createElement("svg", { viewBox: "0 0 64 64", width: "52", height: "52", fill: "none", stroke: "currentColor", strokeWidth: "1.1" }, /*#__PURE__*/React.createElement("path", { d: "M56 10 L28 38" }), /*#__PURE__*/React.createElement("path", { d: "M56 10 L38 56 L28 38 L8 28 Z" }))
  }, {
    id: "security",
    label: "Security",
    sub: "Two-step & activity",
    accent: "#C8B6F0",
    d: "Two-step verification with Google Authenticator, recovery codes for emergencies, and a record of every change made in this console.",
    meta: "Sign in and activity",
    icon: /*#__PURE__*/React.createElement("svg", { viewBox: "0 0 64 64", width: "52", height: "52", fill: "none", stroke: "currentColor", strokeWidth: "1.1" }, /*#__PURE__*/React.createElement("path", { d: "M32 8 L52 16 V30 C52 42 43 52 32 56 C21 52 12 42 12 30 V16 Z" }), /*#__PURE__*/React.createElement("path", { d: "M24 32 L30 38 L41 26" }))
  }, {
    id: "transport",
    label: "Transportation",
    sub: "Transportasi",
    accent: "#E8834A",
    d: "The enterprise pillar. Record what you give the endowment from your go2rent returns, and curate the public Transportation page and its Rent with go2rent button.",
    meta: (n => n + " contribution" + (n === 1 ? "" : "s") + " recorded")(store && store.listEnterpriseIncome ? store.listEnterpriseIncome("go2rent").length : 0),
    icon: /*#__PURE__*/React.createElement("svg", { viewBox: "0 0 64 64", width: "52", height: "52", fill: "none", stroke: "currentColor", strokeWidth: "1.1" }, /*#__PURE__*/React.createElement("path", { d: "M10 40 L10 32 L16 22 Q18 19 22 19 L42 19 Q46 19 48 22 L54 32 L54 40 Z" }), /*#__PURE__*/React.createElement("path", { d: "M14 32 L50 32 M20 19 L17 32 M44 19 L47 32" }), /*#__PURE__*/React.createElement("circle", { cx: "20", cy: "42", r: "5" }), /*#__PURE__*/React.createElement("circle", { cx: "44", cy: "42", r: "5" }), /*#__PURE__*/React.createElement("path", { d: "M6 50 H58" }))
  }, {
    id: "site",
    label: "Site Settings",
    sub: "Contact & social",
    accent: "#9FB4D9",
    d: "The contact details and social links shown at the bottom of the public site \u2014 each one can be shown or hidden.",
    meta: (n => n + " item" + (n === 1 ? "" : "s") + " shown")(store && store.publicContacts ? store.publicContacts().length : 0),
    icon: /*#__PURE__*/React.createElement("svg", { viewBox: "0 0 64 64", width: "52", height: "52", fill: "none", stroke: "currentColor", strokeWidth: "1.1" }, /*#__PURE__*/React.createElement("rect", { x: "10", y: "16", width: "44", height: "32", rx: "3" }), /*#__PURE__*/React.createElement("path", { d: "M11 18 L32 34 L53 18" }), /*#__PURE__*/React.createElement("circle", { cx: "50", cy: "48", r: "7", fill: "#0A1628" }), /*#__PURE__*/React.createElement("path", { d: "M47 48 h6 M50 45 v6" }))
  }, {
    id: "backup",
    label: "Vault Backup",
    sub: "Cadangan",
    accent: "#86E5A7",
    d: "Download every record \u2014 applicants, donations, grants, programmes \u2014 as one JSON file you keep somewhere safe.",
    meta: "one click \u00b7 instant",
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "52",
      height: "52",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1"
    }, /*#__PURE__*/React.createElement("path", { d: "M32 10 L32 38 M22 28 L32 38 L42 28" }), /*#__PURE__*/React.createElement("path", { d: "M14 42 L14 52 L50 52 L50 42" }))
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: bare ? {} : {
      maxWidth: 1000,
      margin: "0 auto",
      padding: "80px clamp(20px, 4vw, 56px) 100px"
    }
  }, !bare && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "Founder Console"), !bare && /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(38px, 5vw, 64px)",
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.02em",
      margin: "16px 0 10px",
      lineHeight: 1.05
    }
  }, "Which pillar are you managing?"), !bare && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 16,
      fontWeight: 300,
      color: "rgba(232,228,220,0.6)",
      margin: "0 0 44px",
      maxWidth: 600
    }
  }, "Each pillar of the endowment has its own console. Choose one to begin."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
      gap: 20
    }
  }, (only ? cards.filter(c => only.indexOf(c.id) >= 0) : cards).map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    onClick: () => onPick(c.id),
    "data-pillar-card": c.id,
    style: {
      textAlign: "left",
      cursor: "pointer",
      background: "rgba(20,36,66,0.55)",
      border: `1px solid ${c.accent}44`,
      padding: "36px 34px",
      color: "#E8E4DC",
      transition: "all 0.2s",
      display: "flex",
      flexDirection: "column",
      gap: 0
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = "rgba(20,36,66,0.85)";
      e.currentTarget.style.borderColor = c.accent;
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = "rgba(20,36,66,0.55)";
      e.currentTarget.style.borderColor = c.accent + "44";
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: c.accent
    }
  }, c.icon), store && store.getPillarActive && c.id !== "backup" && c.id !== "site" && c.id !== "treasury" && c.id !== "impact" && c.id !== "email" && c.id !== "security" ? (o => /*#__PURE__*/React.createElement("span", {
    role: "switch",
    "aria-checked": o,
    title: o ? "Live on the public site — click to deactivate" : "Shown as coming soon — click to activate",
    onClick: e => {
      e.stopPropagation();
      store.savePillarActive && store.savePillarActive(c.id, !o);
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 12px",
      border: "1px solid " + (o ? "rgba(134,229,167,0.45)" : "rgba(232,228,220,0.22)"),
      background: o ? "rgba(134,229,167,0.07)" : "rgba(232,228,220,0.03)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: o ? "#86E5A7" : "rgba(232,228,220,0.5)",
      whiteSpace: "nowrap",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 13,
      borderRadius: 8,
      position: "relative",
      background: o ? "rgba(134,229,167,0.32)" : "rgba(232,228,220,0.15)",
      transition: "background 0.25s",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: o ? 13 : 2,
      width: 9,
      height: 9,
      borderRadius: "50%",
      background: o ? "#86E5A7" : "rgba(232,228,220,0.55)",
      transition: "left 0.25s"
    }
  })), o ? "Active" : "Inactive"))(!!store.getPillarActive(c.id)) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 30,
      letterSpacing: "-0.01em"
    }
  }, c.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color: c.accent,
      marginTop: 6
    }
  }, c.sub), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 1,
      background: `${c.accent}88`,
      margin: "18px 0"
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      fontWeight: 300,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.7)",
      margin: 0
    }
  }, c.d), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 22,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.08em"
    }
  }, c.meta), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: c.accent,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Open \u2192"))))));
};
const AdminPortalGated = ({
  onExit
}) => {
  const store = useStore();
  const [pillar, setPillar] = window.useBrialNav ? window.useBrialNav("fd-pillar", null) : useState(null); // null = chooser
  const [tab, setTab] = useState("inbox");
  const apps = store.listApplicants();
  const scholars = apps.filter(a => a.status === "accepted");
  const donations = store.listDonations();
  const reports = store.listReports();
  const [founderEmail, setFounderEmail] = useState("founder");
  useEffect(() => {
    store.founderEmail().then(e => {
      if (e) setFounderEmail(e);
    });
  }, []);
  const pendingDisb = scholars.reduce((a, s) => a + (s.semesters || []).filter(x => x.status === "bill-uploaded").length, 0);
  const worshipCount = store.getPillarGrants().filter(g => g.pillar === "Houses of Worship").length;
  if (pillar && typeof FD === "function") return /*#__PURE__*/React.createElement(FD, {
    pillar: pillar,
    store: store,
    onBack: () => setPillar(null),
    onExit: onExit,
    founderEmail: founderEmail,
    onLogout: async () => {
      await store.signOutFounder();
    }
  });

  // Houses of Worship — grants + redirect link
  if (pillar === "worship") {
    const wtab = ["grants", "wprog", "wlink"].includes(tab) ? tab : "grants";
    return /*#__PURE__*/React.createElement(PillarConsole, {
      onExit: onExit,
      founderLabel: founderEmail,
      onLogout: async () => {
        await store.signOutFounder();
      },
      onBack: () => setPillar(null),
      tab: wtab,
      setTab: setTab,
      tabs: [{
        id: "grants",
        label: "Grants",
        accent: "#C9A961",
        count: worshipCount,
        content: /*#__PURE__*/React.createElement(WorshipTab, {
          store: store
        })
      }, {
        id: "wprog",
        label: "Programme",
        accent: "#C9A961",
        content: /*#__PURE__*/React.createElement(WorshipProgrammeTab, {
          store: store
        })
      }, {
        id: "wlink",
        label: "Redirect Link",
        accent: "#C9A961",
        content: /*#__PURE__*/React.createElement(PillarLinkTab, {
          store: store,
          pillarKey: "worship",
          accent: "#C9A961",
          eyebrow: "\u00a7 Houses of Worship \u2014 Redirect",
          heading: "Where does this pillar lead?",
          blurb: "Set the page visitors land on when they click the Houses of Worship pillar on the public site.",
          help: "Point this to the partner foundation's construction or donation page (for example, Minang Bandung's mosque project page)."
        })
      }]
    });
  }

  // The Library — e-book catalog + sales + redirect link
  if (pillar === "library") {
    const ltab = ["ebooks", "lsales", "llink"].includes(tab) ? tab : "ebooks";
    return /*#__PURE__*/React.createElement(PillarConsole, {
      onExit: onExit,
      founderLabel: founderEmail,
      onLogout: async () => {
        await store.signOutFounder();
      },
      onBack: () => setPillar(null),
      tab: ltab,
      setTab: setTab,
      tabs: [{
        id: "ebooks",
        label: "E-Books",
        accent: "#C98A61",
        count: store.listEbooks().length,
        content: /*#__PURE__*/React.createElement(EbooksTab, {
          store: store
        })
      }, {
        id: "lsales",
        label: "Sales",
        accent: "#C98A61",
        count: store.listLibrarySales().length,
        content: /*#__PURE__*/React.createElement(LibrarySalesTab, {
          store: store
        })
      }, {
        id: "llink",
        label: "Redirect Link",
        accent: "#C98A61",
        content: /*#__PURE__*/React.createElement(PillarLinkTab, {
          store: store,
          pillarKey: "library",
          accent: "#C98A61",
          eyebrow: "\u00a7 The Library \u2014 Redirect",
          heading: "Where does this pillar lead?",
          blurb: "Set the page visitors land on when they click The Library pillar on the public site.",
          help: "This is usually your Lynk storefront (e.g. https://lynk.id/brial) where readers can browse and buy the books."
        })
      }]
    });
  }

  // Food & Land — grants + programme content + redirect link
  if (pillar === "foodland") {
    const ftab = ["fgrants", "programme", "flink"].includes(tab) ? tab : "fgrants";
    return /*#__PURE__*/React.createElement(PillarConsole, {
      onExit: onExit,
      founderLabel: founderEmail,
      onLogout: async () => {
        await store.signOutFounder();
      },
      onBack: () => setPillar(null),
      tab: ftab,
      setTab: setTab,
      tabs: [{
        id: "fgrants",
        label: "Grants",
        accent: "#A8C97F",
        count: store.getPillarGrants().filter(g => g.pillar === "Food & Land").length,
        content: /*#__PURE__*/React.createElement(FoodlandGrantsTab, {
          store: store
        })
      }, {
        id: "programme",
        label: "Programme",
        accent: "#A8C97F",
        content: /*#__PURE__*/React.createElement(FoodlandTab, {
          store: store
        })
      }, {
        id: "flink",
        label: "Redirect Link",
        accent: "#A8C97F",
        content: /*#__PURE__*/React.createElement(PillarLinkTab, {
          store: store,
          pillarKey: "foodland",
          accent: "#A8C97F",
          eyebrow: "§ Food & Land — Partner Link",
          heading: "Where does the partner button lead?",
          blurb: "The public Trees for Life page shows a 'Learn more about our partner' button — set its destination here.",
          help: "This is usually Zaytoun's Trees for Life page (https://zaytoun.uk/plant-a-tree/) where the programme is described in full."
        })
      }]
    });
  }

  // Clean Water — grants + programme content + redirect link
  if (pillar === "water") {
    const wtab2 = ["wgrants", "wprogramme", "wlink2"].includes(tab) ? tab : "wgrants";
    return /*#__PURE__*/React.createElement(PillarConsole, {
      onExit: onExit,
      founderLabel: founderEmail,
      onLogout: async () => {
        await store.signOutFounder();
      },
      onBack: () => setPillar(null),
      tab: wtab2,
      setTab: setTab,
      tabs: [{
        id: "wgrants",
        label: "Grants",
        accent: "#7FB8C9",
        count: store.getPillarGrants().filter(g => g.pillar === "Clean Water").length,
        content: /*#__PURE__*/React.createElement(WaterGrantsTab, {
          store: store
        })
      }, {
        id: "wprogramme",
        label: "Programme",
        accent: "#7FB8C9",
        content: /*#__PURE__*/React.createElement(WaterProgrammeTab, {
          store: store
        })
      }, {
        id: "wlink2",
        label: "Redirect Link",
        accent: "#7FB8C9",
        content: /*#__PURE__*/React.createElement(PillarLinkTab, {
          store: store,
          pillarKey: "water",
          accent: "#7FB8C9",
          eyebrow: "\u00a7 Clean Water \u2014 Partner Link",
          heading: "Where does the partner button lead?",
          blurb: "The public Clean Water page can show a 'Learn more about our partner' button \u2014 set its destination here, or hide it while between partners.",
          help: "Point this to the drilling or water partner's programme page. Use the visibility switch below when the pillar has no active partner."
        })
      }]
    });
  }

  // Generic pillar consoles — Hospitals, Schools, Livestock, Infrastructure
  if (GEN_PILLAR_CONSOLES[pillar]) {
    const gp = GEN_PILLAR_CONSOLES[pillar];
    const gtab = ["ggrants", "gprog", "glink"].includes(tab) ? tab : "ggrants";
    return /*#__PURE__*/React.createElement(PillarConsole, {
      onExit: onExit,
      founderLabel: founderEmail,
      onLogout: async () => {
        await store.signOutFounder();
      },
      onBack: () => setPillar(null),
      tab: gtab,
      setTab: setTab,
      tabs: [{
        id: "ggrants",
        label: "Grants",
        accent: gp.accent,
        count: store.getPillarGrants().filter(g => g.pillar === gp.name).length,
        content: /*#__PURE__*/React.createElement(gp.Grants, {
          store: store
        })
      }, {
        id: "gprog",
        label: "Programme",
        accent: gp.accent,
        content: /*#__PURE__*/React.createElement(gp.Prog, {
          store: store
        })
      }, {
        id: "glink",
        label: "Redirect Link",
        accent: gp.accent,
        content: /*#__PURE__*/React.createElement(PillarLinkTab, {
          store: store,
          pillarKey: pillar,
          accent: gp.accent,
          eyebrow: gp.eyebrow,
          heading: "Where does the partner button lead?",
          blurb: gp.blurb,
          help: gp.help
        })
      }]
    });
  }

  // Scholarships — full console (default tabs)
  if (pillar === "scholarships") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: "100vh",
        background: "#0A1628"
      }
    }, /*#__PURE__*/React.createElement(PortalNav, {
      onExit: onExit,
      founderLabel: founderEmail,
      onLogout: async () => {
        await store.signOutFounder();
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "0 clamp(20px, 4vw, 56px)",
        flexWrap: "wrap",
        background: "rgba(10,22,40,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(201,169,97,0.12)",
        position: "sticky",
        top: 73,
        zIndex: 25
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setPillar(null),
      style: {
        background: "transparent",
        border: "1px solid rgba(232,228,220,0.2)",
        color: "rgba(232,228,220,0.7)",
        padding: "7px 12px",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        margin: "12px 8px 12px 0"
      }
    }, "\u2190 Pillars"), [{
      id: "inbox",
      label: "Applications",
      count: apps.filter(a => a.status === "submitted").length
    }, {
      id: "disbursements",
      label: "Disbursements",
      count: pendingDisb,
      accent: "#4FD1C5"
    }, {
      id: "scholars",
      label: "Scholars",
      count: scholars.length,
      accent: "#86E5A7"
    }, {
      id: "donations",
      label: "Donations",
      count: donations.filter(d => !d.verified).length,
      accent: "#C9A961"
    }, {
      id: "reports",
      label: "Reports",
      count: reports.filter(r => r.status === "open").length,
      accent: "#E58686"
    }, {
      id: "accounts",
      label: "Accounts",
      count: apps.length,
      accent: "#7AA9E6"
    }].map(it => {
      const active = tab === it.id;
      const accent = it.accent || "#C9A961";
      return /*#__PURE__*/React.createElement("button", {
        key: it.id,
        onClick: () => setTab(it.id),
        style: {
          background: "transparent",
          border: "none",
          padding: "18px 18px",
          cursor: "pointer",
          color: active ? "#E8E4DC" : "rgba(232,228,220,0.55)",
          fontFamily: "'Manrope', sans-serif",
          fontSize: 13,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: active ? 500 : 400,
          borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
          display: "flex",
          alignItems: "center",
          gap: 10
        }
      }, it.label, typeof it.count === "number" && /*#__PURE__*/React.createElement("span", {
        style: {
          background: active ? `${accent}28` : "rgba(232,228,220,0.08)",
          color: active ? accent : "rgba(232,228,220,0.55)",
          padding: "2px 8px",
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace"
        }
      }, it.count));
    })), tab === "inbox" && /*#__PURE__*/React.createElement(InboxTab, {
      apps: apps,
      store: store
    }), tab === "disbursements" && /*#__PURE__*/React.createElement(DisbursementsTab, {
      scholars: scholars,
      store: store
    }), tab === "scholars" && /*#__PURE__*/React.createElement(ScholarsTab, {
      scholars: scholars
    }), tab === "donations" && /*#__PURE__*/React.createElement(DonationsTab, {
      donations: donations,
      store: store
    }), tab === "reports" && /*#__PURE__*/React.createElement(ReportsTab, {
      reports: reports,
      store: store
    }), tab === "accounts" && /*#__PURE__*/React.createElement(AccountsTab, {
      apps: apps,
      deleted: store.listDeleted(),
      store: store
    }));
  }

  // Default — pillar chooser
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#0A1628"
    }
  }, /*#__PURE__*/React.createElement(PortalNav, {
    onExit: onExit,
    founderLabel: founderEmail,
    onLogout: async () => {
      await store.signOutFounder();
    }
  }), /*#__PURE__*/React.createElement(typeof FD === "function" && FD.Home ? FD.Home : PillarChooser, {
    Chooser: PillarChooser,
    onPick: id => {
      if (id === "backup") {
        const data = store.exportAll ? store.exportAll() : {};
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "brial-backup-" + new Date().toISOString().slice(0, 10) + ".json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        return;
      }
      setPillar(id);
      setTab(id === "scholarships" ? "inbox" : id === "worship" ? "grants" : id === "foodland" ? "fgrants" : id === "water" ? "wgrants" : ["hospitals", "schools", "livestock", "infra"].indexOf(id) >= 0 ? "ggrants" : "ebooks");
    },
    store: store,
    scholarCount: scholars.length,
    worshipCount: worshipCount,
    ebookCount: store.listEbooks().length,
    foodlandCount: store.getFoodland().articles.length,
    foodlandGrantCount: store.getPillarGrants().filter(g => g.pillar === "Food & Land").length,
    waterGrantCount: store.getPillarGrants().filter(g => g.pillar === "Clean Water").length,
    salesCount: store.listLibrarySales().length
  }));
};
const AdminPortal = ({
  onExit
}) => {
  const store = useStore();
  const [authed, setAuthed] = useState(() => store.founderReadySync ? store.founderReadySync() : !!store.founderSessionSync());
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let alive = true;
    (store.founderReady ? store.founderReady() : store.getFounderSession()).then(s => {
      if (alive) {
        setAuthed(!!s);
        setChecking(false);
      }
    });
    const h = () => {
      (store.founderReady ? store.founderReady() : store.getFounderSession()).then(s => {
        if (alive) setAuthed(!!s);
      });
    };
    window.addEventListener("brial:change", h);
    return () => {
      alive = false;
      window.removeEventListener("brial:change", h);
    };
  }, []);
  if (!authed && checking && store.founderSessionSync()) {
    // optimistic: cached token exists, treat as authed while confirming
  }
  if (!authed) return /*#__PURE__*/React.createElement(typeof FD === "function" && FD.Login ? FD.Login : FounderLogin, {
    onExit: onExit
  });
  return /*#__PURE__*/React.createElement(AdminPortalGated, {
    onExit: onExit
  });
};
window.AdminPortal = AdminPortal;
})();