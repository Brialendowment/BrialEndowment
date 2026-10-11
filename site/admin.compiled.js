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
  salesCount
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
    style: {
      maxWidth: 1000,
      margin: "0 auto",
      padding: "80px clamp(20px, 4vw, 56px) 100px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "Founder Console"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(38px, 5vw, 64px)",
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.02em",
      margin: "16px 0 10px",
      lineHeight: 1.05
    }
  }, "Which pillar are you managing?"), /*#__PURE__*/React.createElement("p", {
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
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: 20
    }
  }, cards.map(c => /*#__PURE__*/React.createElement("button", {
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
  }, c.icon), store && store.getPillarActive && c.id !== "backup" ? (o => /*#__PURE__*/React.createElement("span", {
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
  const [pillar, setPillar] = useState(null); // null = chooser
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

  // Houses of Worship — grants + redirect link
  if (pillar === "worship") {
    const wtab = ["grants", "wprog", "wlink"].includes(tab) ? tab : "grants";
    return /*#__PURE__*/React.createElement(PillarConsole, {
      onExit: onExit,
      founderLabel: founderEmail,
      onLogout: async () => {
        await store.clearFounderSession();
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
        await store.clearFounderSession();
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
        await store.clearFounderSession();
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
        await store.clearFounderSession();
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
        await store.clearFounderSession();
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
        await store.clearFounderSession();
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
      await store.clearFounderSession();
    }
  }), /*#__PURE__*/React.createElement(PillarChooser, {
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
  const [authed, setAuthed] = useState(() => !!store.founderSessionSync());
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let alive = true;
    store.getFounderSession().then(s => {
      if (alive) {
        setAuthed(!!s);
        setChecking(false);
      }
    });
    const h = () => {
      store.getFounderSession().then(s => {
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
  if (!authed) return /*#__PURE__*/React.createElement(FounderLogin, {
    onExit: onExit
  });
  return /*#__PURE__*/React.createElement(AdminPortalGated, {
    onExit: onExit
  });
};
window.AdminPortal = AdminPortal;
})();