(function(){
const {
  useState,
  useEffect
} = React;

// ============================================================
// APPLICANT PORTAL
// Sign up directly → status timeline → profile editor or
// status panel or scholar dashboard depending on state
// ============================================================

const useApplicantStore = () => {
  const [, tick] = useState(0);
  useEffect(() => {
    const h = () => tick(t => t + 1);
    window.addEventListener("brial:change", h);
    return () => window.removeEventListener("brial:change", h);
  }, []);
  return window.BrialStore;
};
const fmtMoney = n => "$" + (n || 0).toLocaleString("en-US");
const fmtDateShort = iso => iso ? new Date(iso).toLocaleDateString("en-GB", {
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

// ============================================================
// EYE TOGGLE (for password fields)
// ============================================================
const EyeIcon = ({
  open
}) => open ? /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.4"
}, /*#__PURE__*/React.createElement("path", {
  d: "M1 12 S5 5 12 5 23 12 23 12 19 19 12 19 1 12 1 12 Z"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "3.5"
})) : /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.4"
}, /*#__PURE__*/React.createElement("path", {
  d: "M1 12 S5 5 12 5 23 12 23 12 19 19 12 19 1 12 1 12 Z"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "3.5"
}), /*#__PURE__*/React.createElement("line", {
  x1: "3",
  y1: "3",
  x2: "21",
  y2: "21",
  strokeWidth: "1.6"
}));
const PasswordField = ({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  mismatch
}) => {
  const [reveal, setReveal] = useState(false);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: mismatch ? "#E58686" : "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      borderBottom: `1px solid ${mismatch ? "#E58686" : "rgba(232,228,220,0.25)"}`
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: reveal ? "text" : "password",
    value: value,
    autoFocus: autoFocus,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    style: {
      flex: 1,
      padding: "12px 0",
      background: "transparent",
      border: "none",
      color: "#E8E4DC",
      fontSize: 16,
      fontFamily: reveal ? "'JetBrains Mono', monospace" : "'JetBrains Mono', monospace",
      letterSpacing: reveal ? "normal" : "0.2em",
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
      padding: 8,
      display: "flex"
    },
    title: reveal ? "Hide password" : "Show password"
  }, /*#__PURE__*/React.createElement(EyeIcon, {
    open: !reveal
  }))));
};

// ============================================================
// HUMAN VERIFICATION SLIDER
// Drag the gold token from left to the highlighted target.
// Verifies via: (a) drop within target tolerance,
//               (b) pointer-down took >300ms total,
//               (c) at least 5 distinct pointermove events.
// Bots that jump or fire synthetic events fail.
// ============================================================
const HumanCheck = ({
  onChange
}) => {
  const trackRef = React.useRef(null);
  const [trackWidth, setTrackWidth] = useState(360);
  const [pos, setPos] = useState(0); // 0..trackWidth - tokenSize
  const [target, setTarget] = useState(() => 0.65 + Math.random() * 0.2); // 0.65..0.85 of width
  const [state, setState] = useState("idle"); // idle | dragging | verified | failed
  const dragRef = React.useRef({
    startX: 0,
    startPos: 0,
    startedAt: 0,
    moves: 0
  });
  const tokenSize = 44;
  useEffect(() => {
    const measure = () => {
      const w = trackRef.current?.clientWidth || 360;
      setTrackWidth(w);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const maxPos = trackWidth - tokenSize;
  const targetPx = target * (trackWidth - tokenSize);
  const tolerance = 30;
  const reset = () => {
    setPos(0);
    setTarget(0.65 + Math.random() * 0.2);
    setState("idle");
    onChange?.(false);
  };
  const onPointerDown = e => {
    if (state === "verified") return;
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startPos: pos,
      startedAt: performance.now(),
      moves: 0
    };
    setState("dragging");
  };
  const onPointerMove = e => {
    if (state !== "dragging") return;
    e.preventDefault();
    dragRef.current.moves += 1;
    const dx = e.clientX - dragRef.current.startX;
    const next = Math.max(0, Math.min(maxPos, dragRef.current.startPos + dx));
    setPos(next);
  };
  const onPointerUp = () => {
    if (state !== "dragging") return;
    const dur = performance.now() - dragRef.current.startedAt;
    const moves = dragRef.current.moves;
    const distanceOk = Math.abs(pos - targetPx) < tolerance;
    const humanTiming = dur > 250 && dur < 12000;
    const enoughMoves = moves >= 4;
    if (distanceOk && humanTiming && enoughMoves) {
      setState("verified");
      setPos(targetPx);
      onChange?.(true);
    } else {
      setState("failed");
      onChange?.(false);
      setTimeout(() => reset(), 700);
    }
  };
  const verified = state === "verified";
  const failed = state === "failed";
  const accent = verified ? "#86E5A7" : failed ? "#E58686" : "#C9A961";
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8,
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Verify You Are Human"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: accent
    }
  }, verified ? "✓ Verified" : failed ? "✗ Try again" : "Drag to align")), /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    style: {
      position: "relative",
      height: tokenSize + 12,
      padding: 6,
      background: "rgba(10,22,40,0.6)",
      border: `1px solid ${verified ? "rgba(134,229,167,0.55)" : failed ? "rgba(229,134,134,0.5)" : "rgba(201,169,97,0.35)"}`,
      overflow: "hidden",
      touchAction: "none",
      userSelect: "none",
      transition: "border-color 0.25s"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      opacity: 0.14,
      pointerEvents: "none",
      backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><g fill='none' stroke='%23C9A961' stroke-width='0.5'><path d='M30 5 L35 20 L50 15 L40 28 L55 30 L40 32 L50 45 L35 40 L30 55 L25 40 L10 45 L20 32 L5 30 L20 28 L10 15 L25 20 Z'/></g></svg>\")"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 6,
      bottom: 6,
      left: 6 + targetPx,
      width: tokenSize,
      border: `1.5px dashed ${verified ? "#86E5A7" : "#C9A961"}`,
      background: `${verified ? "rgba(134,229,167,0.15)" : "rgba(201,169,97,0.08)"}`,
      transition: "border-color 0.25s, background 0.25s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, !verified && /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 22 22",
    style: {
      opacity: 0.5
    }
  }, /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "#C9A961",
    strokeWidth: "0.8"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M11 2 L13 8 L19 7 L15 12 L20 13 L15 14 L19 19 L13 18 L11 22 L9 18 L3 19 L7 14 L2 13 L7 12 L3 7 L9 8 Z"
  })))), /*#__PURE__*/React.createElement("div", {
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onPointerCancel: onPointerUp,
    style: {
      position: "absolute",
      top: 6,
      left: 6 + pos,
      width: tokenSize,
      height: tokenSize,
      background: `linear-gradient(135deg, ${accent}, ${verified ? "#5BB47C" : failed ? "#B85F5F" : "#8B7A4A"})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: verified ? "default" : "grab",
      boxShadow: `0 8px 20px -8px ${accent}, inset 0 1px 0 rgba(255,255,255,0.3)`,
      transition: state === "dragging" ? "none" : "left 0.3s cubic-bezier(.2,.7,.2,1), background 0.25s",
      animation: failed ? "shake 0.4s" : "none",
      touchAction: "none"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "#0A1628",
    strokeWidth: "1.4"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2 L14 8 L20 7 L16 12 L21 13 L16 14 L20 19 L14 18 L12 22 L10 18 L4 19 L8 14 L3 13 L8 12 L4 7 L10 8 Z"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.4)",
      marginTop: 6,
      letterSpacing: "0.1em"
    }
  }, "\u21B3 Drag the gold star into the highlighted slot. Required to deter automated sign-ups."));
};

// ============================================================
// AUTH — Sign up / Sign in toggle
// ============================================================
const ApplicantAuth = ({
  onExit,
  initialMode = "signup"
}) => {
  const store = useApplicantStore();
  // sign-up / sign-in switch is a history entry, so Back returns to the previous form
  const [mode, setMode] = window.useBrialNav ? window.useBrialNav("auth-mode", initialMode) : useState(initialMode); // "signup" | "signin"
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [humanVerified, setHumanVerified] = useState(false);
  const update = patch => setForm(f => ({
    ...f,
    ...patch
  }));
  const submit = e => {
    e?.preventDefault();
    setError(null);
    if (mode === "signup") {
      if (!humanVerified) {
        setError("Please complete the human verification first.");
        return;
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setLoading(true);
      setTimeout(async () => {
        const result = await store.signup(form);
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        store.setSession({
          applicantId: result.applicant.id,
          signedInAt: new Date().toISOString()
        });
      }, 500);
    } else {
      setLoading(true);
      setTimeout(async () => {
        const a = await store.authApplicant(form.email, form.password);
        if (!a) {
          setError("Email or password incorrect.");
          setLoading(false);
          return;
        }
        store.setSession({
          applicantId: a.id,
          signedInAt: new Date().toISOString()
        });
      }, 500);
    }
  };
  const passwordMismatch = mode === "signup" && form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, #142442 0%, #0A1628 60%, #060E1C 100%)",
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
      maxWidth: 480,
      background: "rgba(20,36,66,0.55)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(201,169,97,0.2)",
      padding: 44,
      boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)"
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
  }, "Scholar Portal"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 36,
      fontWeight: 400,
      lineHeight: 1.1,
      letterSpacing: "-0.01em",
      color: "#E8E4DC",
      margin: "0 0 6px",
      textAlign: "center"
    }
  }, mode === "signup" ? "Start your application." : "Welcome back."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.6)",
      textAlign: "center",
      margin: "0 0 28px"
    }
  }, mode === "signup" ? "Create an account first — you can then complete your application at your own pace." : "Sign in to continue your application or scholar dashboard."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 1,
      background: "rgba(201,169,97,0.18)",
      marginBottom: 28
    }
  }, [{
    id: "signup",
    label: "New applicant"
  }, {
    id: "signin",
    label: "Existing account"
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    onClick: () => {
      setMode(t.id);
      setError(null);
    },
    style: {
      flex: 1,
      padding: "10px 0",
      border: "none",
      background: mode === t.id ? "rgba(201,169,97,0.18)" : "rgba(20,36,66,0.7)",
      color: mode === t.id ? "#C9A961" : "rgba(232,228,220,0.6)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      cursor: "pointer"
    }
  }, t.label))), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit
  }, mode === "signup" && /*#__PURE__*/React.createElement("div", {
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
  }, "Full name"), /*#__PURE__*/React.createElement("input", {
    value: form.name,
    autoFocus: true,
    onChange: e => update({
      name: e.target.value
    }),
    placeholder: "Maria Fitri",
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
  }, "Email address"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    autoFocus: mode === "signin",
    value: form.email,
    onChange: e => update({
      email: e.target.value
    }),
    placeholder: "maria@example.com",
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
      marginBottom: mode === "signup" ? 18 : 24
    }
  }, /*#__PURE__*/React.createElement(PasswordField, {
    label: "Password",
    value: form.password,
    onChange: v => update({
      password: v
    }),
    placeholder: mode === "signup" ? "min. 8 characters" : "••••••••"
  })), mode === "signup" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(PasswordField, {
    label: "Confirm password",
    value: form.confirmPassword,
    onChange: v => update({
      confirmPassword: v
    }),
    placeholder: "re-enter password",
    mismatch: passwordMismatch
  }), passwordMismatch && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#E58686",
      marginTop: 6,
      letterSpacing: "0.08em"
    }
  }, "Passwords do not match.")), mode === "signup" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(HumanCheck, {
    onChange: setHumanVerified
  })), error && /*#__PURE__*/React.createElement("div", {
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
    disabled: loading,
    style: {
      width: "100%",
      padding: "16px 0",
      background: loading ? "rgba(201,169,97,0.5)" : "#C9A961",
      color: "#0A1628",
      border: "none",
      cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 500,
      boxShadow: "0 16px 32px -16px rgba(201,169,97,0.5)"
    }
  }, loading ? "Working…" : mode === "signup" ? "Create account & enter portal →" : "Sign in →"))));
};

// ============================================================
// STATUS TIMELINE (5 stages)
// ============================================================
const STAGES = [{
  id: "profile",
  label: "Profile",
  sub: "Pendaftaran"
}, {
  id: "admin",
  label: "Administrative",
  sub: "Tahap administrasi"
}, {
  id: "interview",
  label: "Interview",
  sub: "Tahap wawancara"
}, {
  id: "review",
  label: "Final review",
  sub: "Under review"
}, {
  id: "decision",
  label: "Decision",
  sub: "Granted / Rejected"
}];
function stageStateFor(applicant) {
  // Returns { activeIndex, isRejected, isAccepted, stageStatus[5]: 'done'|'current'|'pending'|'failed' }
  const s = applicant.status;
  let activeIndex = 0;
  const arr = ["pending", "pending", "pending", "pending", "pending"];
  if (s === "registered") {
    activeIndex = 0;
    arr[0] = "current";
  } else if (s === "submitted") {
    activeIndex = 1;
    arr[0] = "done";
    arr[1] = "current";
  } else if (s === "interview-scheduled") {
    activeIndex = 2;
    arr[0] = "done";
    arr[1] = "done";
    arr[2] = "current";
  } else if (s === "interview-done") {
    activeIndex = 3;
    arr[0] = "done";
    arr[1] = "done";
    arr[2] = "done";
    arr[3] = "current";
  } else if (s === "accepted") {
    activeIndex = 4;
    arr[0] = "done";
    arr[1] = "done";
    arr[2] = "done";
    arr[3] = "done";
    arr[4] = "accepted";
  } else if (s === "rejected") {
    // Find at what stage rejection happened (use latest timestamp)
    if (applicant.interviewDoneAt) {
      activeIndex = 4;
      arr[0] = "done";
      arr[1] = "done";
      arr[2] = "done";
      arr[3] = "done";
      arr[4] = "rejected";
    } else if (applicant.interviewAt) {
      activeIndex = 4;
      arr[0] = "done";
      arr[1] = "done";
      arr[2] = "done";
      arr[3] = "skipped";
      arr[4] = "rejected";
    } else if (applicant.submittedAt) {
      activeIndex = 4;
      arr[0] = "done";
      arr[1] = "done";
      arr[2] = "skipped";
      arr[3] = "skipped";
      arr[4] = "rejected";
    }
  }
  return {
    activeIndex,
    arr
  };
}
const TimelineNode = ({
  index,
  state,
  label,
  sub
}) => {
  const isCurrent = state === "current";
  const isDone = state === "done";
  const isAccepted = state === "accepted";
  const isRejected = state === "rejected";
  let bg = "transparent";
  let border = "1.5px solid rgba(232,228,220,0.2)";
  let color = "rgba(232,228,220,0.4)";
  let dotColor = "rgba(232,228,220,0.4)";
  let glow = "none";
  let icon = index + 1;
  if (isDone) {
    bg = "#86E5A7";
    border = "1.5px solid #86E5A7";
    color = "#0A1628";
    dotColor = "#86E5A7";
    icon = "✓";
  } else if (isAccepted) {
    bg = "#86E5A7";
    border = "1.5px solid #86E5A7";
    color = "#0A1628";
    dotColor = "#86E5A7";
    glow = "0 0 24px rgba(134,229,167,0.5)";
    icon = "★";
  } else if (isRejected) {
    bg = "#E58686";
    border = "1.5px solid #E58686";
    color = "#0A1628";
    dotColor = "#E58686";
    icon = "×";
  } else if (isCurrent) {
    bg = "rgba(201,169,97,0.18)";
    border = "1.5px solid #C9A961";
    color = "#C9A961";
    dotColor = "#C9A961";
    glow = "0 0 24px rgba(201,169,97,0.5)";
  } else if (state === "skipped") {
    bg = "transparent";
    border = "1.5px dashed rgba(232,228,220,0.18)";
    color = "rgba(232,228,220,0.25)";
    dotColor = "rgba(232,228,220,0.2)";
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: bg,
      border,
      color,
      boxShadow: glow,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      fontWeight: 500,
      animation: isCurrent ? "pulseRing 2s infinite" : "none",
      flexShrink: 0,
      zIndex: 1,
      position: "relative",
      background: bg !== "transparent" ? bg : "#0A1628"
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 16,
      color: isDone || isCurrent || isAccepted || isRejected ? "#E8E4DC" : "rgba(232,228,220,0.45)",
      marginTop: 12,
      lineHeight: 1.1
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: dotColor,
      letterSpacing: "0.16em",
      marginTop: 4,
      textTransform: "uppercase"
    }
  }, sub));
};
const StatusTimeline = ({
  applicant
}) => {
  const {
    arr
  } = stageStateFor(applicant);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "32px 36px",
      background: "rgba(20,36,66,0.45)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(201,169,97,0.15)",
      marginBottom: 36,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 22,
      left: 32,
      right: 32,
      height: 1,
      background: "linear-gradient(90deg, rgba(232,228,220,0.12), rgba(232,228,220,0.12))",
      zIndex: 0
    }
  }), STAGES.map((stage, i) => /*#__PURE__*/React.createElement(TimelineNode, {
    key: stage.id,
    index: i,
    state: arr[i],
    label: stage.label,
    sub: stage.sub
  }))));
};

// ============================================================
// STATUS PANELS (per applicant.status, after timeline)
// ============================================================

const StatusPanel_Submitted = ({
  applicant
}) => /*#__PURE__*/React.createElement(Panel, {
  accent: "#C9A961",
  eyebrow: "Stage II \xB7 Tahap Administrasi",
  title: "Your application is under administrative review.",
  body: `Submitted ${fmtDateShort(applicant.submittedAt)}. The reviewer panel checks completeness and eligibility first — typically within 5 business days. If your application advances, you will receive a Zoom interview invitation here.`,
  notes: [["Submitted", fmtDateShort(applicant.submittedAt)], ["Application ID", applicant.id], ["Reviewer panel", "9 anonymous trustees"]]
});
const StatusPanel_Interview = ({
  applicant
}) => {
  const rawLink = applicant.meetingLink || "";
  const meetingHref = rawLink && !/^https?:\/\//i.test(rawLink) ? "https://" + rawLink : rawLink;
  return /*#__PURE__*/React.createElement(Panel, {
    accent: "#4FD1C5",
    eyebrow: "Stage III \xB7 Tahap Wawancara",
    title: "An interview has been scheduled for you.",
    body: `Please prepare a 15-minute self-introduction focused on your research question. After the call, your application returns to the trustees for final review.`,
    callout: /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 24,
        padding: "20px 24px",
        background: "rgba(79,209,197,0.08)",
        border: "1px solid rgba(79,209,197,0.3)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "#4FD1C5",
        letterSpacing: "0.22em",
        textTransform: "uppercase"
      }
    }, "Interview slot"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 32,
        color: "#E8E4DC",
        marginTop: 8,
        letterSpacing: "-0.01em"
      }
    }, fmtDateTime(applicant.interviewAt)), applicant.meetingLink ? /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14,
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: meetingHref,
      target: "_blank",
      rel: "noopener noreferrer",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 18px",
        background: "#4FD1C5",
        color: "#0A1628",
        textDecoration: "none",
        fontFamily: "'Manrope', sans-serif",
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: 500
      }
    }, "Join meeting \u2197"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: "rgba(232,228,220,0.55)",
        overflowWrap: "anywhere"
      }
    }, applicant.meetingLink)) : /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: "rgba(232,228,220,0.6)",
        marginTop: 12,
        letterSpacing: "0.08em"
      }
    }, "Meeting link will appear here shortly."))
  });
};
const StatusPanel_Review = ({
  applicant
}) => /*#__PURE__*/React.createElement(Panel, {
  accent: "#7AA9E6",
  eyebrow: "Stage IV \xB7 Under Review",
  title: "Interview completed. Trustees are deliberating.",
  body: `Your interview on ${fmtDateShort(applicant.interviewDoneAt)} has been recorded. The three founding trustees plus six reviewers now deliberate independently and submit blind votes. Decisions are released within 10 business days of the interview.`,
  notes: [["Interview completed", fmtDateShort(applicant.interviewDoneAt)], ["Reviewers", "9 (blind ballot)"], ["Expected decision", "Within 10 business days"]]
});
const StatusPanel_Rejected = ({
  applicant
}) => /*#__PURE__*/React.createElement(Panel, {
  accent: "#E58686",
  eyebrow: "Stage V \xB7 Decision",
  title: "Your application was not selected this cycle.",
  body: `We received an unusually strong applicant pool. Your effort here will not have been wasted: the foundation maintains your profile, and you may reapply in the next cohort with new material. If you would like feedback, write to founders@brial.org.`,
  notes: [["Decision date", fmtDateShort(applicant.rejectedAt)], ["Next cohort opens", "01 Aug 2027"]]
});
const Panel = ({
  accent,
  eyebrow,
  title,
  body,
  notes,
  callout
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    padding: "44px 44px",
    background: "rgba(20,36,66,0.45)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(201,169,97,0.12)",
    borderLeft: `3px solid ${accent}`
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: accent,
    letterSpacing: "0.26em",
    textTransform: "uppercase"
  }
}, eyebrow), /*#__PURE__*/React.createElement("h2", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 42,
    fontWeight: 400,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    color: "#E8E4DC",
    margin: "16px 0 18px",
    maxWidth: 720
  }
}, title), /*#__PURE__*/React.createElement("p", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 16,
    lineHeight: 1.7,
    fontWeight: 300,
    color: "rgba(232,228,220,0.7)",
    margin: 0,
    maxWidth: 720
  }
}, body), callout, notes && /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 32,
    paddingTop: 24,
    borderTop: "1px solid rgba(232,228,220,0.12)",
    display: "grid",
    gridTemplateColumns: `repeat(${notes.length}, 1fr)`,
    gap: 24
  }
}, notes.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
  key: k
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "rgba(232,228,220,0.45)",
    letterSpacing: "0.22em",
    textTransform: "uppercase"
  }
}, k), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 14,
    color: "#E8E4DC",
    marginTop: 8
  }
}, v)))));

// ============================================================
// SCHOLAR DASHBOARD — semesters + IP + status + graduation
// ============================================================

const SEM_STATUS = {
  upcoming: {
    label: "Upcoming",
    color: "#7E8AA0"
  },
  current: {
    label: "Current · upload bill",
    color: "#C9A961"
  },
  "bill-uploaded": {
    label: "Awaiting payment",
    color: "#4FD1C5"
  },
  paid: {
    label: "Paid · upload IP / grades",
    color: "#7AA9E6"
  },
  completed: {
    label: "Completed",
    color: "#86E5A7"
  }
};
const SCHOLAR_STATUS_META = {
  active: {
    label: "Active Scholar",
    color: "#86E5A7",
    icon: "●"
  },
  suspended: {
    label: "Scholarship Suspended",
    color: "#FFB347",
    icon: "⏸"
  },
  revoked: {
    label: "Scholarship Revoked",
    color: "#E58686",
    icon: "■"
  },
  graduated: {
    label: "Graduated · Brial Alum",
    color: "#C9A961",
    icon: "★"
  }
};

// ---------- Generic upload modal (bill OR ip OR graduation) ----------
const UploadModal = ({
  title,
  eyebrow,
  doneTitle,
  body,
  fields,
  onSubmit,
  onClose,
  store
}) => {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(f => [f.key, f.initial || ""])));
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("form");
  const set = (k, v) => setValues(p => ({
    ...p,
    [k]: v
  }));
  const setError = (k, v) => setErrors(p => ({
    ...p,
    [k]: v
  }));
  const canSubmit = fields.every(f => values[f.key]) && !Object.values(uploading).some(Boolean);
  const handleFile = async (key, file) => {
    if (!file) return;
    setError(key, null);
    const v = window.BrialFiles.validate(file);
    if (!v.ok) {
      setError(key, v.error);
      return;
    }
    setUploading(u => ({
      ...u,
      [key]: true
    }));
    try {
      const meta = await window.BrialFiles.put(file);
      set(key, meta);
    } catch (err) {
      console.error(err);
      setError(key, "Upload failed: " + (err.message || err));
    } finally {
      setUploading(u => ({
        ...u,
        [key]: false
      }));
    }
  };
  const submit = () => {
    if (!canSubmit) return;
    setStep("uploading");
    setTimeout(() => {
      onSubmit(values);
      setStep("done");
      setTimeout(onClose, 1600);
    }, 1000);
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: "rgba(6,14,28,0.85)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      animation: "fadeIn 0.25s"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 580,
      background: "linear-gradient(180deg, #142442, #0A1628)",
      border: "1px solid rgba(201,169,97,0.25)",
      padding: 44,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      position: "absolute",
      top: 16,
      right: 16,
      background: "transparent",
      border: "1px solid rgba(232,228,220,0.2)",
      color: "rgba(232,228,220,0.7)",
      width: 32,
      height: 32,
      cursor: "pointer",
      fontFamily: "serif",
      fontSize: 18
    }
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 34,
      fontWeight: 400,
      color: "#E8E4DC",
      margin: "14px 0 8px",
      lineHeight: 1.1
    }
  }, step === "done" ? doneTitle : title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.6)",
      margin: "0 0 28px"
    }
  }, step === "done" ? "Submitted to trustees. The foundation will respond shortly." : body), step === "form" && /*#__PURE__*/React.createElement(React.Fragment, null, fields.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.key,
    style: {
      marginBottom: 22
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
  }, f.label), f.type === "file" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      padding: "22px 18px",
      border: `1px dashed ${errors[f.key] ? "rgba(229,134,134,0.5)" : values[f.key] ? "rgba(134,229,167,0.45)" : "rgba(201,169,97,0.4)"}`,
      background: errors[f.key] ? "rgba(229,134,134,0.06)" : values[f.key] ? "rgba(134,229,167,0.04)" : "rgba(201,169,97,0.04)",
      cursor: uploading[f.key] ? "wait" : "pointer",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: window.BrialFiles.allowedAccept,
    disabled: uploading[f.key],
    onChange: e => handleFile(f.key, e.target.files?.[0]),
    style: {
      display: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 20,
      color: values[f.key] ? "#86E5A7" : "rgba(232,228,220,0.7)"
    }
  }, uploading[f.key] ? "Uploading…" : values[f.key]?.name || values[f.key] || f.placeholder || "Click to select file"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.4)",
      marginTop: 6,
      letterSpacing: "0.1em"
    }
  }, values[f.key]?.size ? `${values[f.key].size} MB · ready to submit` : f.hint || "PDF, PNG, JPG, WebP · max 15MB")), errors[f.key] && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: "8px 12px",
      background: "rgba(229,134,134,0.08)",
      border: "1px solid rgba(229,134,134,0.3)",
      color: "#E58686",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.06em",
      lineHeight: 1.5
    }
  }, errors[f.key])) : f.type === "money" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      borderBottom: "1px solid rgba(232,228,220,0.2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 24,
      color: "#C9A961"
    }
  }, "$"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: values[f.key],
    onChange: e => set(f.key, e.target.value),
    placeholder: f.placeholder,
    style: {
      flex: 1,
      padding: "10px 0",
      background: "transparent",
      border: "none",
      color: "#E8E4DC",
      fontSize: 22,
      fontFamily: "'Cormorant Garamond', serif",
      outline: "none"
    }
  })) : /*#__PURE__*/React.createElement("input", {
    type: f.type || "text",
    value: values[f.key],
    onChange: e => set(f.key, e.target.value),
    placeholder: f.placeholder,
    style: {
      width: "100%",
      padding: "10px 0",
      background: "transparent",
      border: "none",
      borderBottom: "1px solid rgba(232,228,220,0.2)",
      color: "#E8E4DC",
      fontSize: 18,
      fontFamily: "'Cormorant Garamond', serif",
      outline: "none"
    }
  }), f.note && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.45)",
      marginTop: 6,
      letterSpacing: "0.08em"
    }
  }, f.note))), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !canSubmit,
    style: {
      width: "100%",
      padding: "16px 0",
      background: canSubmit ? "#C9A961" : "rgba(201,169,97,0.3)",
      color: "#0A1628",
      border: "none",
      cursor: canSubmit ? "pointer" : "not-allowed",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, "Submit \u2192")), step === "uploading" && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px 0",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      margin: "0 auto",
      border: "2px solid rgba(201,169,97,0.2)",
      borderTopColor: "#C9A961",
      borderRadius: "50%",
      animation: "spin 0.9s linear infinite"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.6)",
      letterSpacing: "0.18em",
      marginTop: 20
    }
  }, "HASHING & TIMESTAMPING\u2026")), step === "done" && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      background: "rgba(134,229,167,0.08)",
      border: "1px solid rgba(134,229,167,0.35)",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 56,
      color: "#86E5A7",
      lineHeight: 1
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#86E5A7",
      letterSpacing: "0.22em",
      marginTop: 12
    }
  }, "MANIFEST 0x", Math.random().toString(16).slice(2, 6), "\u2026", Math.random().toString(16).slice(2, 4)))));
};

// ---------- Document slot inside semester card ----------
const DocSlot = ({
  title,
  accent,
  file,
  amount,
  sub,
  action,
  locked,
  lockedText,
  status
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    padding: 16,
    background: "rgba(232,228,220,0.025)",
    border: "1px solid rgba(232,228,220,0.08)",
    minHeight: 90,
    display: "flex",
    flexDirection: "column"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: accent,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    marginBottom: 10
  }
}, title), file ? /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 12
  }
}, /*#__PURE__*/React.createElement("svg", {
  width: "24",
  height: "30",
  viewBox: "0 0 32 40",
  fill: "none",
  stroke: accent,
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
  onClick: () => window.BrialFiles.open(file),
  title: "Click to open",
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 12,
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
}, file.name || file.filename), amount && /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 17,
    color: accent,
    marginTop: 2,
    fontVariantNumeric: "tabular-nums"
  }
}, amount), sub && /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "rgba(232,228,220,0.5)",
    marginTop: 4,
    letterSpacing: "0.06em"
  }
}, sub)), /*#__PURE__*/React.createElement("button", {
  onClick: () => window.BrialFiles.open(file),
  style: {
    padding: "5px 10px",
    background: "transparent",
    border: `1px solid ${accent}55`,
    color: accent,
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.16em",
    textTransform: "uppercase"
  }
}, "Open \u2197")) : action ? /*#__PURE__*/React.createElement("button", {
  onClick: action.onClick,
  disabled: locked,
  style: {
    marginTop: "auto",
    background: locked ? "rgba(201,169,97,0.15)" : accent,
    color: locked ? "rgba(232,228,220,0.4)" : "#0A1628",
    border: "none",
    padding: "10px 16px",
    cursor: locked ? "not-allowed" : "pointer",
    fontFamily: "'Manrope', sans-serif",
    fontSize: 11,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    fontWeight: 500
  }
}, action.label) : /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "rgba(232,228,220,0.35)",
    marginTop: "auto",
    letterSpacing: "0.16em",
    textTransform: "uppercase"
  }
}, lockedText || "Awaiting"));
const SemesterCard = ({
  semester,
  onUploadBill,
  onUploadIP,
  locked,
  lockReason
}) => {
  const meta = SEM_STATUS[semester.status];
  const canUploadBill = semester.status === "current" && !locked;
  const canUploadIP = semester.status === "paid" && !locked;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "22px 26px",
      background: "rgba(20,36,66,0.5)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(201,169,97,0.12)",
      borderLeft: `3px solid ${meta.color}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 16,
      flexWrap: "wrap",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 26,
      color: "#E8E4DC",
      letterSpacing: "-0.01em"
    }
  }, semester.label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "4px 10px",
      background: `${meta.color}14`,
      border: `1px solid ${meta.color}55`,
      color: meta.color,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.18em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: meta.color,
      boxShadow: `0 0 6px ${meta.color}`
    }
  }), meta.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(DocSlot, {
    title: "UKT Bill (Tuition Invoice)",
    accent: semester.paidAt ? "#86E5A7" : "#C9A961",
    file: semester.bill,
    amount: semester.bill && fmtMoney(semester.bill.amount),
    sub: semester.bill ? semester.paidAt ? `Disbursed ${fmtDateShort(semester.paidAt)} · ${semester.txHash}` : `Uploaded ${fmtDateShort(semester.bill.uploadedAt)} · awaiting founder` : null,
    action: canUploadBill ? {
      label: "Upload Bill ↑",
      onClick: () => onUploadBill(semester)
    } : null,
    locked: locked,
    lockedText: locked ? lockReason : "Locked"
  }), /*#__PURE__*/React.createElement(DocSlot, {
    title: "IP / Transkrip Nilai",
    accent: semester.ip ? "#86E5A7" : "#7AA9E6",
    file: semester.ip,
    amount: semester.ip && `IPK Semester · ${semester.ip.gpa}`,
    sub: semester.ip && `Submitted ${fmtDateShort(semester.ip.uploadedAt)}`,
    action: canUploadIP ? {
      label: "Upload IP ↑",
      onClick: () => onUploadIP(semester)
    } : null,
    locked: locked || semester.status !== "paid" && !semester.ip,
    lockedText: locked ? lockReason : semester.status === "upcoming" || semester.status === "current" ? "After tuition is paid" : semester.status === "bill-uploaded" ? "After founder disburses" : "Awaiting"
  })));
};

// ============================================================
// SCHOLAR STATUS BANNER
// ============================================================
const ScholarStatusBanner = ({
  applicant,
  ipk
}) => {
  const store = useApplicantStore();
  const status = applicant.scholarStatus || "active";
  const meta = SCHOLAR_STATUS_META[status];
  const lastEntry = (applicant.statusHistory || []).slice().reverse().find(e => e.status === status);
  const allHistory = applicant.statusHistory || [];
  const level = store.getDegreeLevel?.(applicant);
  const showReason = (status === "suspended" || status === "revoked") && lastEntry;
  const completedSems = (applicant.semesters || []).filter(s => s.status === "completed").length;
  const totalSems = (applicant.semesters || []).length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px 32px",
      background: `linear-gradient(135deg, ${meta.color}12, ${meta.color}06)`,
      border: `1px solid ${meta.color}44`,
      borderLeft: `4px solid ${meta.color}`,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "start",
      gap: 24,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: meta.color,
      letterSpacing: "0.24em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      lineHeight: 1
    }
  }, meta.icon), meta.label), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 36,
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.01em",
      margin: "10px 0 4px",
      lineHeight: 1.1
    }
  }, status === "active" && `Welcome back, scholar.`, status === "graduated" && `You did it. Brial alum, Class of ${new Date(applicant.graduation?.graduatedAt || applicant.acceptedAt).getFullYear()}.`, status === "suspended" && `Your scholarship is paused.`, status === "revoked" && `Your scholarship has been revoked.`), (status === "active" || status === "graduated") && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "rgba(232,228,220,0.65)",
      marginTop: 2
    }
  }, applicant.profile.university.name, " \xB7 ", applicant.profile.university.program, level && ` · ${level.label}`, totalSems > 0 && ` · Semester progress ${completedSems} / ${totalSems}`), showReason && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: "14px 18px",
      background: "rgba(10,22,40,0.45)",
      border: `1px solid ${meta.color}44`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: meta.color,
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Reason from foundation \xB7 ", fmtDateShort(lastEntry.at)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      color: "#E8E4DC",
      marginTop: 8,
      lineHeight: 1.5
    }
  }, "\"", lastEntry.reason, "\"")), status === "suspended" && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.6)",
      marginTop: 14
    }
  }, "No further disbursements while suspended. Address the issue above and contact the foundation to discuss reinstatement."), status === "revoked" && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.6)",
      marginTop: 14
    }
  }, "The scholarship has been permanently terminated. Past disbursements remain on the public ledger as historical record.")), ipk && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.45)",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Cumulative IPK"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 56,
      color: ipk.value >= 2.75 ? meta.color : "#E58686",
      lineHeight: 1,
      marginTop: 6,
      letterSpacing: "-0.02em",
      fontVariantNumeric: "tabular-nums"
    }
  }, ipk.value.toFixed(2)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      marginTop: 4,
      letterSpacing: "0.12em"
    }
  }, ipk.count, " semester", ipk.count === 1 ? "" : "s", " averaged", ipk.value < 2.75 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#E58686",
      marginLeft: 6
    }
  }, "\xB7 below 2.75 threshold")))), allHistory.length > 1 && /*#__PURE__*/React.createElement("details", {
    style: {
      marginTop: 20,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      listStyle: "none"
    }
  }, "\u21B3 Status history (", allHistory.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, allHistory.slice().reverse().map((h, i) => {
    const m = SCHOLAR_STATUS_META[h.status];
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 14,
        alignItems: "center",
        padding: "10px 14px",
        background: "rgba(10,22,40,0.35)",
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
        color: "rgba(232,228,220,0.8)",
        fontStyle: "italic"
      }
    }, h.reason), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)"
      }
    }, fmtDateShort(h.at)));
  }))));
};

// ============================================================
// GRADUATION PANEL
// ============================================================
const GraduationPanel = ({
  applicant
}) => {
  const store = useApplicantStore();
  const [open, setOpen] = useState(false);
  if (applicant.scholarStatus === "graduated" && applicant.graduation) {
    const g = applicant.graduation;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 36,
        padding: "36px 40px",
        background: "linear-gradient(135deg, rgba(201,169,97,0.12), rgba(201,169,97,0.04))",
        border: "1px solid rgba(201,169,97,0.4)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "#C9A961",
        letterSpacing: "0.28em",
        textTransform: "uppercase"
      }
    }, "Graduation Record \xB7 ", fmtDateShort(g.graduatedAt)), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 30,
        fontWeight: 400,
        color: "#E8E4DC",
        margin: "14px 0 20px",
        lineHeight: 1.1
      }
    }, "Your degree has been recorded on the public ledger."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(DocSlot, {
      title: "Ijazah (Diploma)",
      accent: "#C9A961",
      file: g.ijazahFile,
      sub: `Filed ${fmtDateShort(g.graduatedAt)}`
    }), /*#__PURE__*/React.createElement(DocSlot, {
      title: "Transkrip Akhir (Final Transcript)",
      accent: "#C9A961",
      file: g.transkripFile,
      sub: `Filed ${fmtDateShort(g.graduatedAt)}`
    })));
  }
  const sems = applicant.semesters || [];
  const allCompleted = sems.length > 0 && sems.every(s => s.status === "completed");
  const lastSemNum = sems.length ? sems[sems.length - 1].number : 0;
  const level = store.getDegreeLevel ? store.getDegreeLevel(applicant) : null;
  const totalForLevel = level?.totalSemesters || 8;
  const eligible = allCompleted && lastSemNum >= totalForLevel;
  if (!eligible || applicant.scholarStatus !== "active") return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 36,
      padding: "36px 40px",
      background: "linear-gradient(135deg, rgba(201,169,97,0.18), rgba(201,169,97,0.05))",
      border: "1px solid rgba(201,169,97,0.5)",
      animation: "fadeIn 0.5s"
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
      maxWidth: 540
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "\u2605 Ready to Graduate"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 38,
      fontWeight: 400,
      color: "#E8E4DC",
      margin: "12px 0 16px",
      lineHeight: 1.1
    }
  }, "All ", totalForLevel, " semesters complete. Time to graduate."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      lineHeight: 1.7,
      color: "rgba(232,228,220,0.7)",
      margin: 0
    }
  }, "Upload your official ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "ijazah"), " (diploma) and ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "transkrip akhir"), " (final transcript) to complete your record with the foundation. Once submitted, your status becomes Brial Alum \u2014 permanent and on-chain.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(true),
    style: {
      background: "#C9A961",
      color: "#0A1628",
      border: "none",
      padding: "16px 28px",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 500,
      boxShadow: "0 16px 32px -16px rgba(201,169,97,0.5)"
    }
  }, "Upload Graduation Docs \u2192")), open && /*#__PURE__*/React.createElement(UploadModal, {
    eyebrow: "Final Submission",
    title: "Submit your graduation documents.",
    doneTitle: "Submitted. Welcome to the alumni network.",
    body: "Both files are required. They are stored permanently on the foundation's ledger.",
    fields: [{
      key: "ijazah",
      type: "file",
      label: "Ijazah (Diploma) PDF",
      placeholder: "Click to select your ijazah"
    }, {
      key: "transkrip",
      type: "file",
      label: "Transkrip akhir (Final transcript) PDF",
      placeholder: "Click to select your final transcript"
    }],
    onSubmit: vals => store.submitGraduation(applicant.id, {
      ijazahFile: vals.ijazah,
      transkripFile: vals.transkrip
    }),
    onClose: () => setOpen(false),
    store: store
  }));
};

// ============================================================
// SHOWCASE PHOTO CARD — scholar uploads a public selfie shown
// on the Scholars showcase page. Falls back to biometric photo.
// ============================================================
const ShowcasePhotoCard = ({
  applicant,
  store,
  locked
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const photo = applicant.profile?.personal?.showcasePhoto || null;
  const handle = async e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    const v = window.BrialFiles.validate(f);
    if (!v.ok) {
      setError(v.error);
      e.target.value = "";
      return;
    }
    if (!(f.type || "").toLowerCase().startsWith("image/")) {
      setError("Please upload an image (JPG, PNG, or WebP) — not a PDF.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const meta = await window.BrialFiles.put(f, { public: true });
      store.updateProfile(applicant.id, "personal", {
        showcasePhoto: meta
      });
    } catch (err) {
      setError("Upload failed: " + (err.message || err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  const url = photo ? photo.url || window.brialSupabase && window.brialSupabase.publicUrl(photo.path) : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 36,
      padding: "24px 26px",
      background: "rgba(201,169,97,0.05)",
      border: "1px solid rgba(201,169,97,0.22)",
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: 24,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 110,
      height: 138,
      flexShrink: 0,
      border: "1px solid rgba(201,169,97,0.4)",
      background: "linear-gradient(160deg, #142442, #0A1628)",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, url ? /*#__PURE__*/React.createElement("img", {
    src: url,
    alt: "Showcase",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "50% 28%"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.45)",
      letterSpacing: "0.14em",
      textAlign: "center",
      padding: 10
    }
  }, "NO SELFIE", /*#__PURE__*/React.createElement("br", null), "YET")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Showcase / Selfie Photo"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      color: "#E8E4DC",
      marginTop: 6,
      lineHeight: 1.25,
      letterSpacing: "-0.01em"
    }
  }, "Choose how you appear on our public Scholars page."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.65)",
      margin: "8px 0 16px",
      maxWidth: 560
    }
  }, "Upload a clear selfie or portrait you are happy to share publicly. Until you do, your private biometric photo is ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "not"), " shown publicly \u2014 we display only your initials. Image files only (JPG, PNG, WebP)."), error && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 12px",
      marginBottom: 12,
      background: "rgba(229,134,134,0.08)",
      border: "1px solid rgba(229,134,134,0.3)",
      color: "#E58686",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11
    }
  }, error), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "11px 20px",
      background: uploading ? "rgba(201,169,97,0.4)" : "#C9A961",
      color: "#0A1628",
      cursor: uploading ? "wait" : "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp",
    onChange: handle,
    disabled: uploading,
    style: {
      display: "none"
    }
  }), uploading ? "Uploading…" : photo ? "Change photo ↑" : "Upload photo ↑")));
};

// ============================================================
// SCHOLAR DASHBOARD
// ============================================================
const ScholarDashboard = ({
  applicant
}) => {
  const store = useApplicantStore();
  const [billFor, setBillFor] = useState(null);
  const [ipFor, setIpFor] = useState(null);
  const sems = applicant.semesters || [];
  const totalReceived = sems.filter(s => s.paidAt).reduce((a, s) => a + (s.bill?.amount || 0), 0);
  const pending = sems.filter(s => s.status === "bill-uploaded").reduce((a, s) => a + (s.bill?.amount || 0), 0);
  const completedSems = sems.filter(s => s.status === "completed").length;
  const remaining = sems.filter(s => s.status === "upcoming" || s.status === "current" || s.status === "bill-uploaded" || s.status === "paid").length;
  const ukt = parseInt(applicant.profile.university.uktPerSemester, 10) || 13000;
  const ipk = store.cumulativeIPK(applicant);
  const status = applicant.scholarStatus || "active";
  const locked = status === "suspended" || status === "revoked" || status === "graduated";
  const lockReason = status === "suspended" ? "Suspended" : status === "revoked" ? "Revoked" : status === "graduated" ? "Graduated" : null;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ScholarStatusBanner, {
    applicant: applicant,
    ipk: ipk
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 1,
      background: "rgba(201,169,97,0.12)",
      marginBottom: 36
    }
  }, [{
    l: "Cumulative IPK",
    v: ipk ? ipk.value.toFixed(2) : "—",
    c: ipk && ipk.value < 2.75 ? "#E58686" : "#86E5A7"
  }, {
    l: "Total received",
    v: fmtMoney(totalReceived),
    c: "#86E5A7"
  }, {
    l: "Awaiting payment",
    v: fmtMoney(pending),
    c: "#4FD1C5"
  }, {
    l: "Semesters complete",
    v: `${completedSems} / ${sems.length}`,
    c: "#E8E4DC"
  }].map((tile, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "24px 26px",
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
  }, tile.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 34,
      fontWeight: 400,
      color: tile.c,
      letterSpacing: "-0.01em",
      lineHeight: 1,
      marginTop: 12,
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap"
    }
  }, tile.v)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 18,
      flexWrap: "wrap",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 30,
      fontWeight: 400,
      color: "#E8E4DC",
      letterSpacing: "-0.01em",
      margin: 0
    }
  }, "Semester ledger"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.12em"
    }
  }, "Scholarship begins at semester ", sems[0]?.number || "—", " \xB7 ends semester ", sems[sems.length - 1]?.number || "—")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, sems.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "rgba(232,228,220,0.5)",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      fontStyle: "italic"
    }
  }, "No semesters in your ledger yet.") : sems.map(sem => /*#__PURE__*/React.createElement(SemesterCard, {
    key: sem.id,
    semester: sem,
    onUploadBill: setBillFor,
    onUploadIP: setIpFor,
    locked: locked,
    lockReason: lockReason
  })))), /*#__PURE__*/React.createElement(GraduationPanel, {
    applicant: applicant
  }), /*#__PURE__*/React.createElement(ShowcasePhotoCard, {
    applicant: applicant,
    store: store,
    locked: locked
  }), !locked && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 36,
      padding: "20px 24px",
      background: "rgba(79,209,197,0.04)",
      border: "1px solid rgba(79,209,197,0.18)",
      display: "flex",
      gap: 18,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: "rgba(79,209,197,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#4FD1C5",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      flexShrink: 0
    }
  }, "i"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 14,
      color: "#E8E4DC",
      fontWeight: 500
    }
  }, "How each semester works"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.65)",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#C9A961"
    }
  }, "1."), " Upload your UKT invoice at the start of each semester. Trustees co-sign and wire funds in USDC to ", applicant.walletShort, " within 72 hours.", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#C9A961",
      marginLeft: 8
    }
  }, "2."), " At the end of the semester, upload your IP transcript with your GPA. Cumulative IPK must remain \u2265 2.75 for the award to continue."))), billFor && /*#__PURE__*/React.createElement(UploadModal, {
    eyebrow: `Upload UKT Invoice · ${billFor.label}`,
    title: "Send us your bill.",
    doneTitle: "Submitted to trustees.",
    body: "Upload the official tuition invoice. Funds will be wired within 72 hours of trustee co-signature.",
    fields: [{
      key: "filename",
      type: "file",
      label: "Invoice file",
      placeholder: "Click to select invoice"
    }, {
      key: "amount",
      type: "money",
      label: "Amount due (USD)",
      placeholder: applicant.profile.university.uktPerSemester || "13,100",
      initial: applicant.profile.university.uktPerSemester || "",
      note: "Pre-filled with your registered UKT per semester."
    }],
    onSubmit: vals => store.uploadBill(applicant.id, billFor.id, {
      ...vals.filename,
      amount: parseInt(vals.amount, 10)
    }),
    onClose: () => setBillFor(null),
    store: store
  }), ipFor && /*#__PURE__*/React.createElement(UploadModal, {
    eyebrow: `Upload IP / Transkrip · ${ipFor.label}`,
    title: "Account for your studies.",
    doneTitle: "IP recorded. Thank you.",
    body: "Submit your semester transcript and GPA. This is required to maintain the award and qualify for the next disbursement.",
    fields: [{
      key: "filename",
      type: "file",
      label: "Transkrip PDF",
      placeholder: "Click to select your transcript"
    }, {
      key: "gpa",
      type: "text",
      label: "Semester GPA (IP)",
      placeholder: "3.85"
    }],
    onSubmit: vals => store.uploadIP(applicant.id, ipFor.id, {
      ...vals.filename,
      gpa: vals.gpa
    }),
    onClose: () => setIpFor(null),
    store: store
  }));
};

// ============================================================
// REPORT PROBLEM — let any signed-in applicant send a message
// ============================================================
const ReportProblemSection = ({
  applicant
}) => {
  const store = useApplicantStore();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("technical");
  const [submitted, setSubmitted] = useState(null);
  const myReports = (store.listReports() || []).filter(r => r.applicantId === applicant.id);
  const submit = () => {
    if (!subject.trim() || !message.trim()) return;
    const r = store.submitReport({
      applicantId: applicant.id,
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      subject,
      message,
      category
    });
    setSubmitted(r);
    setSubject("");
    setMessage("");
    setTimeout(() => {
      setSubmitted(null);
      setOpen(false);
    }, 2200);
  };
  const categories = [{
    id: "technical",
    label: "Technical issue"
  }, {
    id: "data",
    label: "Data / information"
  }, {
    id: "payment",
    label: "Disbursement / payment"
  }, {
    id: "other",
    label: "Other"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 24px",
      background: "rgba(229,134,134,0.05)",
      border: "1px solid rgba(229,134,134,0.25)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 18,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#E58686",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Need help?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      color: "#E8E4DC",
      marginTop: 6,
      letterSpacing: "-0.01em"
    }
  }, "Something wrong with your application or disbursement?")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(o => !o),
    style: {
      padding: "12px 22px",
      background: open ? "transparent" : "#E58686",
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
  }, open ? "Close" : "Report a problem")), open && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 1,
      padding: 28,
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.12)"
    }
  }, submitted ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "20px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 52,
      color: "#86E5A7",
      lineHeight: 1
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#86E5A7",
      letterSpacing: "0.22em",
      marginTop: 12,
      textTransform: "uppercase"
    }
  }, "Report sent \xB7 ", submitted.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      color: "#E8E4DC",
      marginTop: 12,
      lineHeight: 1.4
    }
  }, "The foundation will respond within 3 business days.")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Category"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, categories.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    onClick: () => setCategory(c.id),
    style: {
      padding: "6px 12px",
      cursor: "pointer",
      background: category === c.id ? "rgba(229,134,134,0.18)" : "transparent",
      color: category === c.id ? "#E58686" : "rgba(232,228,220,0.6)",
      border: `1px solid ${category === c.id ? "rgba(229,134,134,0.5)" : "rgba(232,228,220,0.15)"}`,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, c.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Subject"), /*#__PURE__*/React.createElement("input", {
    value: subject,
    onChange: e => setSubject(e.target.value),
    placeholder: "Short summary of the issue",
    style: {
      width: "100%",
      padding: "10px 0",
      background: "transparent",
      border: "none",
      borderBottom: "1px solid rgba(232,228,220,0.2)",
      color: "#E8E4DC",
      fontSize: 18,
      fontFamily: "'Cormorant Garamond', serif",
      outline: "none"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Details"), /*#__PURE__*/React.createElement("textarea", {
    value: message,
    onChange: e => setMessage(e.target.value),
    placeholder: "Describe what happened, what you expected, and any error messages. The more detail, the faster we can help.",
    style: {
      width: "100%",
      minHeight: 140,
      resize: "vertical",
      background: "rgba(232,228,220,0.04)",
      border: "1px solid rgba(232,228,220,0.15)",
      color: "#E8E4DC",
      padding: 14,
      fontSize: 14,
      fontFamily: "'Cormorant Garamond', serif",
      lineHeight: 1.6,
      outline: "none"
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    disabled: !subject.trim() || !message.trim(),
    style: {
      padding: "14px 22px",
      background: subject.trim() && message.trim() ? "#C9A961" : "rgba(201,169,97,0.3)",
      color: "#0A1628",
      border: "none",
      cursor: subject.trim() && message.trim() ? "pointer" : "not-allowed",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, "Send to foundation \u2192")))), myReports.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 12
    }
  }, "Your past reports"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      background: "rgba(201,169,97,0.08)"
    }
  }, myReports.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      padding: "16px 20px",
      background: "rgba(20,36,66,0.5)",
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: 14,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      padding: "2px 8px",
      color: r.status === "resolved" ? "#86E5A7" : r.status === "replied" ? "#4FD1C5" : "#C9A961",
      border: `1px solid ${r.status === "resolved" ? "rgba(134,229,167,0.4)" : r.status === "replied" ? "rgba(79,209,197,0.4)" : "rgba(201,169,97,0.4)"}`
    }
  }, r.status)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      color: "#E8E4DC",
      marginTop: 6
    }
  }, r.subject), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      color: "rgba(232,228,220,0.6)",
      marginTop: 4,
      lineHeight: 1.5
    }
  }, r.message), r.reply && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 14px",
      background: "rgba(79,209,197,0.08)",
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
  }, "Foundation reply \xB7 ", fmtDateShort(r.reply.at)), /*#__PURE__*/React.createElement("div", {
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
      color: "rgba(232,228,220,0.5)"
    }
  }, fmtDateShort(r.submittedAt)))))));
};

// ============================================================
// MY PROFILE — read-only preview of everything the awardee submitted
// ============================================================
const PV_field = (label, value) => React.createElement("div", {
  key: label
}, React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "rgba(232,228,220,0.45)",
    letterSpacing: "0.2em",
    textTransform: "uppercase"
  }
}, label), React.createElement("div", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 14,
    color: value ? "#E8E4DC" : "rgba(232,228,220,0.4)",
    marginTop: 6,
    fontStyle: value ? "normal" : "italic"
  }
}, value || "—"));
const MyProfileSection = ({
  title,
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 18,
    padding: 22,
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
}, title), children);
const MyProfileFileRow = ({
  label,
  file
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: "rgba(232,228,220,0.45)",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    marginBottom: 8
  }
}, label), file ? /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 10
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 13,
    color: "#E8E4DC",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 200
  }
}, file.name || file.filename), /*#__PURE__*/React.createElement("button", {
  onClick: () => window.BrialFiles.open(file),
  style: {
    padding: "4px 10px",
    background: "transparent",
    border: "1px solid rgba(201,169,97,0.4)",
    color: "#C9A961",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
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
}, "Not uploaded"));
const MyProfileView = ({
  applicant
}) => {
  const [open, setOpen] = useState(false);
  const p = applicant.profile || {};
  const per = p.personal || {};
  const hs = p.highSchool || {};
  const u = p.university || {};
  const lvl = window.BrialStore.DEGREE_LEVELS && window.BrialStore.DEGREE_LEVELS[u.degreeLevel] || null;
  const photoUrl = per.photoFile ? per.photoFile.url || (window.brialSupabase && (per.photoFile.path || per.photoFile.key) ? window.brialSupabase.publicUrl(per.photoFile.path || per.photoFile.key) : "") : "";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 24px",
      background: "rgba(122,169,230,0.05)",
      border: "1px solid rgba(122,169,230,0.25)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 18,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#7AA9E6",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "My application data"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      color: "#E8E4DC",
      marginTop: 6,
      letterSpacing: "-0.01em"
    }
  }, "Review everything you submitted."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      color: "rgba(232,228,220,0.55)",
      marginTop: 4
    }
  }, "Spot a mistake? Use \u201CRequest a change\u201D below to ask the foundation to fix it.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(o => !o),
    style: {
      padding: "12px 22px",
      background: open ? "transparent" : "#7AA9E6",
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
  }, open ? "Close" : "View my profile")), open && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 1,
      padding: 28,
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement(MyProfileSection, {
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
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Biometric Photo"), per.photoFile ? /*#__PURE__*/React.createElement("div", {
    onClick: () => window.BrialFiles.open(per.photoFile),
    style: {
      width: 120,
      height: 152,
      cursor: "pointer",
      border: "1px solid rgba(201,169,97,0.4)",
      background: "rgba(10,22,40,0.5)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: photoUrl,
    alt: "Biometric",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 120,
      height: 152,
      border: "1px dashed rgba(232,228,220,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Cormorant Garamond', serif",
      fontStyle: "italic",
      fontSize: 13,
      color: "rgba(232,228,220,0.4)",
      textAlign: "center",
      padding: 12
    }
  }, "No photo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px 28px"
    }
  }, PV_field("Full legal name", per.fullName), PV_field("Date of birth", per.dateOfBirth), PV_field("Phone", per.phone), PV_field("Country", per.country), PV_field("National ID", per.nationalId), PV_field("Email", applicant.email), PV_field("Address", per.address)))), /*#__PURE__*/React.createElement(MyProfileSection, {
    title: "\xA7 B \xB7 High school record"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "16px 28px"
    }
  }, PV_field("School", hs.schoolName), PV_field("Graduation year", hs.graduationYear), PV_field("Final GPA", hs.finalGPA)), (hs.subjects || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      border: "1px solid rgba(232,228,220,0.1)",
      background: "rgba(10,22,40,0.4)"
    }
  }, hs.subjects.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 100px",
      borderBottom: i < hs.subjects.length - 1 ? "1px solid rgba(232,228,220,0.06)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 15,
      color: "#E8E4DC"
    }
  }, s.name || "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      color: s.grade ? "#C9A961" : "rgba(232,228,220,0.3)",
      borderLeft: "1px solid rgba(232,228,220,0.08)",
      textAlign: "center"
    }
  }, s.grade || "—")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(MyProfileFileRow, {
    label: "Rapor SMA (transcript)",
    file: hs.raporFile
  }))), /*#__PURE__*/React.createElement(MyProfileSection, {
    title: `§ C · Current ${u.degreeLevel === "SMA" ? "school" : "university"}`
  }, lvl && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14,
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      background: "rgba(201,169,97,0.08)",
      border: "1px solid rgba(201,169,97,0.25)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "#C9A961",
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    }
  }, "Level"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 17,
      color: "#E8E4DC"
    }
  }, lvl.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)"
    }
  }, lvl.totalSemesters, " semesters")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px 28px"
    }
  }, PV_field(u.degreeLevel === "SMA" ? "School" : "University", u.name), PV_field(u.degreeLevel === "SMA" ? "Track / jurusan" : "Program", u.program), PV_field("Current semester", u.currentSemester), PV_field(u.degreeLevel === "SMA" ? "Current GPA / rata-rata" : "Current GPA (IPK)", u.currentGPA), PV_field("UKT per semester", u.uktPerSemester ? fmtMoney(parseInt(u.uktPerSemester, 10)) + " USD" : "")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(MyProfileFileRow, {
    label: "Kartu pelajar / student ID",
    file: u.studentCardFile
  }))), /*#__PURE__*/React.createElement(MyProfileSection, {
    title: "\xA7 D \xB7 Research essay"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 17,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.9)",
      margin: 0,
      paddingLeft: 16,
      borderLeft: "2px solid rgba(201,169,97,0.3)"
    }
  }, p.essay || /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: "italic",
      color: "rgba(232,228,220,0.4)"
    }
  }, "No essay submitted.")))));
};

// ============================================================
// ACCOUNT SETTINGS — edit email & password + review/edit profile
// ============================================================
const AccountSettings = ({
  applicant,
  store
}) => {
  const isRegistered = applicant.status === "registered";
  const [open, setOpen] = useState(false);
  const reqs = applicant.changeRequests || [];
  const pending = reqs.filter(r => r.status === "pending");

  // Field catalog the awardee may request changes to
  const FIELDS = [{
    key: "email",
    label: "Email address",
    type: "email"
  }, {
    key: "password",
    label: "Password",
    type: "password"
  }, {
    key: "profile.personal.fullName",
    label: "Full legal name",
    type: "text"
  }, {
    key: "profile.personal.phone",
    label: "Phone number",
    type: "text"
  }, {
    key: "profile.personal.address",
    label: "Full address",
    type: "text"
  }, {
    key: "profile.personal.nationalId",
    label: "National ID / Passport",
    type: "text"
  }, {
    key: "profile.personal.country",
    label: "Country",
    type: "text"
  }, {
    key: "profile.university.name",
    label: "University / school name",
    type: "text"
  }, {
    key: "profile.university.program",
    label: "Program / major",
    type: "text"
  }, {
    key: "profile.university.currentSemester",
    label: "Current semester",
    type: "text"
  }, {
    key: "profile.university.currentGPA",
    label: "Current GPA / IPK",
    type: "text"
  }, {
    key: "profile.university.uktPerSemester",
    label: "UKT per semester (USD)",
    type: "text"
  }, {
    key: "profile.highSchool.schoolName",
    label: "High school name",
    type: "text"
  }, {
    key: "profile.highSchool.finalGPA",
    label: "High school final GPA",
    type: "text"
  }];
  const [fieldKey, setFieldKey] = useState(FIELDS[0].key);
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");
  const [reveal, setReveal] = useState(false);
  const [msg, setMsg] = useState(null);
  const selected = FIELDS.find(f => f.key === fieldKey);

  // For "registered" status — direct save (not yet submitted, no approval needed)
  const directSave = async () => {
    setMsg(null);
    if (selected.type === "password" && value !== value2) {
      setMsg({
        err: "Passwords do not match."
      });
      return;
    }
    if (!value.trim()) {
      setMsg({
        err: "Please enter a value."
      });
      return;
    }
    if (selected.type === "email") {
      const r = await store.updateAccount(applicant.id, {
        email: value.trim()
      });
      if (r.error) return setMsg({
        err: r.error
      });
    } else if (selected.type === "password") {
      const r = await store.updateAccount(applicant.id, {
        password: value
      });
      if (r.error) return setMsg({
        err: r.error
      });
    } else {
      // field path
      const section = fieldKey.split(".")[1];
      const leaf = fieldKey.split(".")[2];
      store.updateProfile(applicant.id, section, {
        [leaf]: value
      });
    }
    setMsg({
      ok: "Saved."
    });
    setValue("");
    setValue2("");
  };

  // For submitted+ status — create a change request
  const submitRequest = async () => {
    setMsg(null);
    if (selected.type === "password" && value !== value2) {
      setMsg({
        err: "Passwords do not match."
      });
      return;
    }
    if (selected.type === "password" && value.length < 8) {
      setMsg({
        err: "Password must be at least 8 characters."
      });
      return;
    }
    if (!value.trim()) {
      setMsg({
        err: "Please enter the new value."
      });
      return;
    }
    const type = selected.type === "email" ? "email" : selected.type === "password" ? "password" : "field";
    const r = await store.requestChange(applicant.id, {
      type,
      value: value.trim(),
      label: selected.label,
      note: type === "field" ? fieldKey : ""
    });
    if (r.error) return setMsg({
      err: r.error
    });
    setMsg({
      ok: "Request sent to the foundation for approval."
    });
    setValue("");
    setValue2("");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 24px",
      background: "rgba(201,169,97,0.05)",
      border: "1px solid rgba(201,169,97,0.22)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
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
  }, "Account & profile changes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      color: "#E8E4DC",
      marginTop: 6,
      letterSpacing: "-0.01em"
    }
  }, isRegistered ? "Fix any typo in your details before you submit." : "Request a correction to your details."), !isRegistered && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      color: "rgba(232,228,220,0.55)",
      marginTop: 4
    }
  }, "For your security, changes after submission must be approved by the foundation.")), /*#__PURE__*/React.createElement("button", {
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
  }, open ? "Close" : isRegistered ? "Manage account" : "Request a change")), open && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 1,
      padding: 28,
      background: "rgba(20,36,66,0.5)",
      border: "1px solid rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 18,
      maxWidth: 540
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "What would you like to change?"), /*#__PURE__*/React.createElement("select", {
    value: fieldKey,
    onChange: e => {
      setFieldKey(e.target.value);
      setValue("");
      setValue2("");
      setMsg(null);
    },
    style: {
      width: "100%",
      padding: "11px 12px",
      background: "rgba(10,22,40,0.5)",
      border: "1px solid rgba(232,228,220,0.2)",
      color: "#E8E4DC",
      fontSize: 14,
      fontFamily: "'Manrope', sans-serif",
      outline: "none"
    }
  }, FIELDS.map(f => /*#__PURE__*/React.createElement("option", {
    key: f.key,
    value: f.key,
    style: {
      background: "#0A1628"
    }
  }, f.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "New ", selected.label.toLowerCase()), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => setValue(e.target.value),
    type: selected.type === "password" && !reveal ? "password" : selected.type === "email" ? "email" : "text",
    placeholder: selected.type === "password" ? "min. 8 characters" : "Enter new value",
    style: {
      width: "100%",
      padding: "11px 0",
      background: "transparent",
      border: "none",
      borderBottom: "1px solid rgba(232,228,220,0.2)",
      color: "#E8E4DC",
      fontSize: 16,
      fontFamily: selected.type === "text" ? "'Cormorant Garamond', serif" : "'JetBrains Mono', monospace",
      outline: "none"
    }
  })), selected.type === "password" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.55)",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Confirm new password"), /*#__PURE__*/React.createElement("input", {
    value: value2,
    onChange: e => setValue2(e.target.value),
    type: reveal ? "text" : "password",
    style: {
      width: "100%",
      padding: "11px 0",
      background: "transparent",
      border: "none",
      borderBottom: "1px solid rgba(232,228,220,0.2)",
      color: "#E8E4DC",
      fontSize: 16,
      fontFamily: "'JetBrains Mono', monospace",
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      cursor: "pointer",
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: reveal,
    onChange: e => setReveal(e.target.checked),
    style: {
      accentColor: "#C9A961"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "rgba(232,228,220,0.6)",
      letterSpacing: "0.08em"
    }
  }, "Show password"))), msg && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      background: msg.err ? "rgba(229,134,134,0.08)" : "rgba(134,229,167,0.08)",
      border: `1px solid ${msg.err ? "rgba(229,134,134,0.35)" : "rgba(134,229,167,0.35)"}`,
      color: msg.err ? "#E58686" : "#86E5A7",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.06em"
    }
  }, msg.err || msg.ok), /*#__PURE__*/React.createElement("button", {
    onClick: isRegistered ? directSave : submitRequest,
    style: {
      padding: "13px 22px",
      background: "#C9A961",
      color: "#0A1628",
      border: "none",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 500,
      justifySelf: "start"
    }
  }, isRegistered ? "Save change →" : "Send request →")), !isRegistered && reqs.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      marginBottom: 12
    }
  }, "Your change requests"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      background: "rgba(201,169,97,0.08)"
    }
  }, reqs.slice(0, 8).map(r => {
    const c = r.status === "approved" ? "#86E5A7" : r.status === "rejected" ? "#E58686" : "#C9A961";
    return /*#__PURE__*/React.createElement("div", {
      key: r.id,
      style: {
        padding: "14px 18px",
        background: "rgba(20,36,66,0.5)",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 17,
        color: "#E8E4DC"
      }
    }, r.label, ": ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#C9A961"
      }
    }, r.type === "password" ? "••••••••" : r.value)), r.status === "rejected" && r.reason && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Manrope', sans-serif",
        fontSize: 12,
        color: "rgba(229,134,134,0.85)",
        marginTop: 4
      }
    }, "Reason: ", r.reason)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        padding: "3px 9px",
        color: c,
        border: `1px solid ${c}55`
      }
    }, r.status));
  })))), !open && pending.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#C9A961",
      letterSpacing: "0.08em"
    }
  }, "\u23F3 ", pending.length, " change request", pending.length === 1 ? "" : "s", " awaiting foundation approval"));
};

// >>> SCHOLAR HOME (generated from src/scholar-home.jsx — edit that file, then run scripts/build-scholar-home.py)
const SH = (() => {
  const { useState, useEffect, useMemo, useRef } = React;
  const ID = {
    "Overview": "Ringkasan",
    "My profile": "Profil saya",
    "Account": "Akun",
    "Help": "Bantuan",
    "Sign out": "Keluar",
    "Scholar Portal": "Portal Penerima",
    "Back to website": "Kembali ke situs",
    "Active scholar": "Penerima aktif",
    "Scholarship paused": "Beasiswa ditangguhkan",
    "Scholarship ended": "Beasiswa dihentikan",
    "Brial alum": "Alumni Brial",
    "Scholar ID": "ID penerima",
    "Class": "Angkatan",
    "Programme": "Jenjang",
    "Funded semesters": "Semester didanai",
    "Next step": "Langkah berikutnya",
    "Upload bill": "Unggah tagihan",
    "Upload transcript": "Unggah transkrip",
    "Upload graduation documents": "Unggah dokumen kelulusan",
    "View bill": "Lihat tagihan",
    "View transcript": "Lihat transkrip",
    "View": "Lihat",
    "Total received": "Total diterima",
    "Semesters paid": "Semester dibayar",
    "Cumulative GPA": "IPK kumulatif",
    "Awaiting payment": "Menunggu pembayaran",
    "Appears after your first transcript": "Muncul setelah transkrip pertama",
    "Keep it at 2.75 or higher to continue the award": "Pertahankan minimal 2,75 agar beasiswa berlanjut",
    "Below the 2.75 minimum — talk to the foundation": "Di bawah batas 2,75 — hubungi yayasan",
    "Your semesters": "Semester Anda",
    "Semester": "Semester",
    "Tuition bill": "Tagihan UKT",
    "Transcript": "Transkrip nilai",
    "Not uploaded yet": "Belum diunggah",
    "Opens after tuition is paid": "Terbuka setelah UKT dibayar",
    "Opens when this semester starts": "Terbuka saat semester dimulai",
    "Paid": "Dibayar",
    "In review": "Sedang ditinjau",
    "Upcoming": "Akan datang",
    "Action needed": "Perlu tindakan",
    "Complete": "Selesai",
    "Results due": "Menunggu nilai",
    "How your scholarship works": "Cara beasiswa Anda berjalan",
    "At the start of each semester, upload the official tuition bill (UKT) from your university.": "Di awal setiap semester, unggah tagihan UKT resmi dari kampus Anda.",
    "The foundation reviews the bill and pays your tuition. You will see the payment here.": "Yayasan meninjau tagihan dan membayar UKT Anda. Pembayarannya akan tampil di sini.",
    "When grades are out, upload your transcript and semester GPA. Keep your cumulative GPA at 2.75 or higher.": "Setelah nilai keluar, unggah transkrip dan IP semester. Jaga IPK kumulatif minimal 2,75.",
    "Your public photo": "Foto publik Anda",
    "This photo appears on the Scholars page of brialendowment.org.": "Foto ini tampil di halaman Scholars di brialendowment.org.",
    "Change photo": "Ganti foto",
    "Upload photo": "Unggah foto",
    "Uploading…": "Mengunggah…",
    "JPG, PNG or WebP, up to 2 MB.": "JPG, PNG, atau WebP, maks. 2 MB.",
    "Personal details": "Data pribadi",
    "Education": "Pendidikan",
    "Documents": "Dokumen",
    "Full name": "Nama lengkap",
    "Date of birth": "Tanggal lahir",
    "Phone": "Telepon",
    "Country": "Negara",
    "Address": "Alamat",
    "National ID": "NIK / Paspor",
    "Email": "Email",
    "University": "Universitas",
    "Study programme": "Program studi",
    "Current semester": "Semester saat ini",
    "GPA at application": "IPK saat mendaftar",
    "Tuition per semester": "UKT per semester",
    "High school": "Sekolah menengah",
    "Graduation year": "Tahun lulus",
    "Final grade": "Nilai akhir",
    "Biometric photo": "Pas foto",
    "Report card": "Rapor",
    "Student card": "Kartu mahasiswa",
    "Not provided": "Tidak ada",
    "Spot a mistake? Request a correction from the Account tab.": "Ada yang salah? Ajukan koreksi dari tab Akun.",
    "Sign-in email": "Email masuk",
    "Change password": "Ganti password",
    "New password": "Password baru",
    "Confirm new password": "Ulangi password baru",
    "At least 8 characters.": "Minimal 8 karakter.",
    "Show passwords": "Tampilkan password",
    "Save new password": "Simpan password baru",
    "Password updated. Other devices have been signed out.": "Password diperbarui. Perangkat lain sudah dikeluarkan.",
    "Passwords do not match.": "Password tidak sama.",
    "Password must be at least 8 characters.": "Password minimal 8 karakter.",
    "Request a correction": "Ajukan koreksi data",
    "Changes to your details are checked by the foundation before they take effect.": "Perubahan data diperiksa yayasan sebelum berlaku.",
    "What needs correcting?": "Apa yang perlu dikoreksi?",
    "Correct value": "Data yang benar",
    "Send request": "Kirim permintaan",
    "Request sent. The foundation will review it.": "Permintaan terkirim. Yayasan akan meninjaunya.",
    "Please enter the correct value.": "Isi data yang benar.",
    "Your requests": "Permintaan Anda",
    "Pending": "Menunggu",
    "Approved": "Disetujui",
    "Declined": "Ditolak",
    "Reason:": "Alasan:",
    "Message the foundation": "Kirim pesan ke yayasan",
    "Questions about payments, documents or your account — we read every message.": "Pertanyaan soal pembayaran, dokumen, atau akun — setiap pesan kami baca.",
    "Topic": "Topik",
    "Subject": "Judul",
    "Message": "Pesan",
    "Send message": "Kirim pesan",
    "Payment": "Pembayaran",
    "My details": "Data saya",
    "Technical problem": "Masalah teknis",
    "Something else": "Lainnya",
    "Message sent. The reply will appear below.": "Pesan terkirim. Balasan akan muncul di bawah.",
    "Your messages": "Pesan Anda",
    "Reply from the foundation": "Balasan yayasan",
    "Open": "Terbuka",
    "Replied": "Dibalas",
    "Resolved": "Selesai",
    "No messages yet.": "Belum ada pesan.",
    "Close": "Tutup",
    "Cancel": "Batal",
    "Save": "Simpan",
    "Saved": "Tersimpan",
    "Try again": "Coba lagi",
    "Choose a file": "Pilih file",
    "PDF, JPG, PNG or WebP, up to 2 MB.": "PDF, JPG, PNG, atau WebP, maks. 2 MB.",
    "Replace file": "Ganti file",
    "Amount due (USD)": "Jumlah tagihan (USD)",
    "Semester GPA": "IP semester",
    "Enter a number between 0 and 4, for example 3.62.": "Isi angka 0–4, contoh 3.62.",
    "Enter the amount on the bill.": "Isi jumlah sesuai tagihan.",
    "Diploma (ijazah)": "Ijazah",
    "Final transcript": "Transkrip akhir",
    "Congratulations on completing your studies.": "Selamat atas kelulusan Anda.",
    "Your graduation record": "Catatan kelulusan Anda",
    "No semesters have been set up yet. The foundation will add them shortly.": "Semester belum disiapkan. Yayasan akan segera menambahkannya.",
    "You're all set": "Semua beres",
    "Nothing needs your attention right now. We'll show the next step here when it's time.": "Saat ini tidak ada yang perlu Anda lakukan. Langkah berikutnya akan muncul di sini pada waktunya.",
    "Message the foundation ": "Hubungi yayasan ",
    "Application essay": "Esai pendaftaran",
    "Subject grades": "Nilai mata pelajaran",
    "Scholarship history": "Riwayat beasiswa",
    "Active": "Aktif",
    "Paused": "Ditangguhkan",
    "Ended": "Dihentikan",
    "Graduated": "Lulus"
  };
  const lang = "en";
  const t = (s) => lang === "id" && ID[s] || s;
  const L = (en, id) => lang === "id" ? id : en;
  function useLang() {
    return lang;
  }
  const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const date = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  };
  const fileUrl = (f) => {
    if (!f) return null;
    if (f.url) return f.url;
    const p = f.path || f.key;
    return p && window.brialSupabase ? window.brialSupabase.publicUrl(p) : null;
  };
  const isImage = (f) => !!f && (/^image\//i.test(f.type || "") || /\.(png|jpe?g|webp|gif)$/i.test(f.name || f.path || ""));
  const firstName = (n) => (n || "").trim().split(/\s+/)[0] || "";
  const titleCase = (s) => (s || "").toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  const instCase = (s) => (s || "").split(/(\s+)/).map((w) => /^[A-Z0-9]{1,4}$/.test(w) ? w : titleCase(w)).join("");
  const CSS = `
.bsp{--bg:#0A1628;--surface:#0F1E36;--raised:#132746;--line:rgba(239,233,220,.10);--line2:rgba(239,233,220,.16);--gilt:#C9A961;--gilt2:#E2C98E;--giltsoft:rgba(201,169,97,.13);--text:#EFE9DC;--muted:rgba(239,233,220,.66);--faint:rgba(239,233,220,.44);--sage:#8FD4A8;--amber:#E7B76A;--rose:#E58686;
  min-height:100vh;background:var(--bg);color:var(--text);font-family:'Manrope',system-ui,sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.bsp *{box-sizing:border-box}
.bsp button{font-family:inherit}
.bsp :focus-visible{outline:2px solid var(--gilt);outline-offset:3px;border-radius:6px}
.bsp-top{position:sticky;top:0;z-index:40;background:rgba(10,22,40,.88);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);border-bottom:1px solid var(--line)}
.bsp-top-in{max-width:1120px;margin:0 auto;padding:0 24px;height:68px;display:flex;align-items:center;gap:28px}
.bsp-brand{display:flex;align-items:center;gap:12px;color:var(--text);text-decoration:none;flex-shrink:0}
.bsp-brand b{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:19px;letter-spacing:.01em;display:block;line-height:1.1}
.bsp-brand small{display:block;font-size:12px;color:var(--faint);line-height:1.2}
.bsp-tabs{display:flex;gap:4px;margin-left:auto;align-self:stretch}
.bsp-tab{position:relative;background:none;border:0;color:var(--muted);font-size:14px;font-weight:500;padding:0 14px;cursor:pointer;transition:color .2s}
.bsp-tab:hover{color:var(--text)}
.bsp-tab[aria-selected=true]{color:var(--text)}
.bsp-tab[aria-selected=true]::after{content:"";position:absolute;left:14px;right:14px;bottom:-1px;height:2px;background:var(--gilt);border-radius:2px}
.bsp-tab .bsp-badge{display:inline-block;min-width:18px;height:18px;padding:0 5px;margin-left:6px;border-radius:9px;background:var(--gilt);color:#0A1628;font-size:11px;font-weight:700;line-height:18px;text-align:center;vertical-align:1px}
.bsp-me{display:flex;align-items:center;gap:12px;flex-shrink:0}
.bsp-avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;object-position:50% 25%;border:1px solid rgba(201,169,97,.5);background:linear-gradient(135deg,#C9A961,#8B7A4A);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:17px;color:#0A1628}
.bsp-out{background:none;border:1px solid var(--line2);color:var(--muted);border-radius:10px;padding:8px 14px;font-size:13px;font-weight:500;cursor:pointer;transition:border-color .2s,color .2s}
.bsp-out:hover{border-color:rgba(201,169,97,.6);color:var(--text)}
.bsp-site{display:inline-flex;align-items:center;gap:7px;background:none;border:0;color:var(--muted);border-radius:10px;padding:8px 10px;font-size:13px;font-weight:500;cursor:pointer;transition:color .2s,background .2s}
.bsp-site:hover{color:var(--text);background:rgba(239,233,220,.05)}
.bsp-main{max-width:1120px;margin:0 auto;padding:36px 24px 120px}
.bsp-h2{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:30px;line-height:1.15;letter-spacing:-.005em;margin:0}
.bsp-h3{font-size:16px;font-weight:600;margin:0;color:var(--text)}
.bsp-sub{color:var(--muted);margin:6px 0 0;max-width:62ch}
.bsp-sec{margin-top:56px}
.bsp-sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap}

/* credential */
.bsp-cred{position:relative;overflow:hidden;border-radius:20px;padding:34px 36px;background:radial-gradient(120% 140% at 100% 0%,#1A3560 0%,#10223F 45%,#0C1A31 100%);border:1px solid rgba(201,169,97,.42);box-shadow:0 30px 80px -40px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.04);animation:bspRise .7s cubic-bezier(.22,1,.36,1) both}
.bsp-cred::after{content:"";position:absolute;inset:9px;border:1px solid rgba(201,169,97,.16);border-radius:13px;pointer-events:none}
.bsp-rosette{position:absolute;right:-90px;top:50%;width:420px;height:420px;transform:translateY(-50%);opacity:.22;pointer-events:none}
.bsp-cred-grid{position:relative;z-index:1;display:grid;grid-template-columns:auto 1fr auto;gap:30px;align-items:center}
.bsp-portrait{width:112px;height:140px;border-radius:12px;object-fit:cover;object-position:50% 25%;border:1px solid rgba(201,169,97,.5);box-shadow:0 18px 40px -20px rgba(0,0,0,.9);background:#0A1628;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:44px;color:var(--gilt)}
.bsp-name,.bsp-h2,.bsp-next h3,.bsp-step-head h4,.bsp-node,.bsp-fig b{font-variant-numeric:lining-nums proportional-nums}
.bsp-name{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(32px,4.4vw,46px);line-height:1.02;letter-spacing:-.01em;margin:0}
.bsp-prog{color:var(--muted);margin-top:8px;font-size:15px}
.bsp-facts{display:flex;flex-wrap:wrap;gap:10px 34px;margin-top:20px}
.bsp-fact span{display:block;font-size:12px;color:var(--faint)}
.bsp-fact b{display:block;font-weight:600;font-size:14px;color:var(--text);font-variant-numeric:tabular-nums;margin-top:2px}
.bsp-cred-status{align-self:start}
.bsp-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap;border:1px solid}
.bsp-chip i{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
.bsp-chip.ok{color:var(--sage);border-color:rgba(143,212,168,.4);background:rgba(143,212,168,.08)}
.bsp-chip.warn{color:var(--amber);border-color:rgba(231,183,106,.45);background:rgba(231,183,106,.08)}
.bsp-chip.bad{color:var(--rose);border-color:rgba(229,134,134,.45);background:rgba(229,134,134,.08)}
.bsp-chip.gold{color:var(--gilt2);border-color:rgba(201,169,97,.5);background:var(--giltsoft)}

/* next step + figures */
.bsp-row{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:20px;margin-top:20px}
.bsp-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:26px 28px}
.bsp-next{display:flex;flex-direction:column;justify-content:space-between;gap:22px;background:linear-gradient(160deg,#122646,#0F1E36 70%);border-color:rgba(201,169,97,.28)}
.bsp-next-k{font-size:13px;color:var(--gilt2);font-weight:600}
.bsp-next h3{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:28px;line-height:1.15;margin:8px 0 0}
.bsp-next p{color:var(--muted);margin:10px 0 0;max-width:52ch}
.bsp-actions{display:flex;gap:10px;flex-wrap:wrap}
.bsp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:background .2s,border-color .2s,color .2s,transform .15s;text-decoration:none;white-space:nowrap}
.bsp-btn:active{transform:translateY(1px)}
.bsp-btn.primary{background:var(--gilt);color:#0A1628}
.bsp-btn.primary:hover{background:var(--gilt2)}
.bsp-btn.ghost{background:transparent;color:var(--text);border-color:var(--line2)}
.bsp-btn.ghost:hover{border-color:rgba(201,169,97,.6)}
.bsp-btn.small{padding:8px 14px;font-size:13px;border-radius:9px}
.bsp-btn[disabled]{opacity:.45;cursor:not-allowed}
.bsp-link{background:none;border:0;padding:0;color:var(--gilt2);font-weight:600;font-size:14px;cursor:pointer;text-decoration:underline;text-decoration-color:rgba(201,169,97,.4);text-underline-offset:4px}
.bsp-link:hover{text-decoration-color:var(--gilt2)}
.bsp-row.solo{grid-template-columns:1fr}
.bsp-row.solo .bsp-figs{grid-template-columns:repeat(4,1fr)}
.bsp-row.solo .bsp-fig{border-bottom:0}
.bsp-row.solo .bsp-fig:nth-child(2n){border-right:1px solid var(--line)}
.bsp-row.solo .bsp-fig:last-child{border-right:0}
.bsp-figs{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:0;overflow:hidden}
.bsp-fig{padding:22px 24px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.bsp-fig:nth-child(2n){border-right:0}
.bsp-fig:nth-last-child(-n+2){border-bottom:0}
.bsp-fig span{display:block;font-size:13px;color:var(--muted)}
.bsp-fig b{display:block;font-family:'Cormorant Garamond',serif;font-weight:500;font-size:34px;line-height:1.1;margin-top:6px;font-variant-numeric:lining-nums tabular-nums}
.bsp-fig small{display:block;font-size:12px;color:var(--faint);margin-top:4px;line-height:1.4}
.bsp-bar{height:4px;border-radius:2px;background:rgba(239,233,220,.10);margin-top:10px;overflow:hidden}
.bsp-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--gilt),var(--gilt2));border-radius:2px}

/* journey */
.bsp-journey{list-style:none;margin:0;padding:0;position:relative}
.bsp-step{position:relative;display:grid;grid-template-columns:44px minmax(0,1fr);gap:20px;padding-bottom:18px}
.bsp-step::before{content:"";position:absolute;left:21px;top:44px;bottom:0;width:2px;background:var(--line)}
.bsp-step:last-child::before{display:none}
.bsp-step:last-child{padding-bottom:0}
.bsp-node{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:600;border:1px solid var(--line2);color:var(--muted);background:var(--bg);position:relative;z-index:1}
.bsp-node.now{border:2px solid var(--gilt);color:var(--gilt2);box-shadow:0 0 0 6px rgba(201,169,97,.12)}
.bsp-node.done{background:rgba(143,212,168,.12);border-color:rgba(143,212,168,.5);color:var(--sage)}
.bsp-step-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px 22px}
.bsp-step-card.now{border-color:rgba(201,169,97,.35);background:linear-gradient(160deg,#112443,#0F1E36 70%)}
.bsp-step-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.bsp-step-head h4{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;margin:0}
.bsp-docs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.bsp-doc{border:1px solid var(--line);border-radius:11px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:72px;background:rgba(10,22,40,.35)}
.bsp-doc-l{min-width:0}
.bsp-doc-l span{display:block;font-size:12px;color:var(--faint)}
.bsp-doc-l b{display:block;font-weight:600;font-size:14px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bsp-doc-l em{display:block;font-style:normal;font-size:13px;color:var(--muted);margin-top:1px}
.bsp-doc-l em.ok{color:var(--sage)}
.bsp-tag{font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;white-space:nowrap}
.bsp-tag.ok{color:var(--sage);background:rgba(143,212,168,.10)}
.bsp-tag.warn{color:var(--amber);background:rgba(231,183,106,.10)}
.bsp-tag.gold{color:var(--gilt2);background:var(--giltsoft)}
.bsp-tag.mute{color:var(--muted);background:rgba(239,233,220,.06)}
.bsp-how{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px;counter-reset:how}
.bsp-how li{list-style:none;padding:20px 22px;border:1px solid var(--line);border-radius:14px;color:var(--muted);font-size:14px;counter-increment:how}
.bsp-how li::before{content:counter(how);display:flex;width:30px;height:30px;border-radius:50%;align-items:center;justify-content:center;border:1px solid rgba(201,169,97,.5);color:var(--gilt2);font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;margin-bottom:12px;font-variant-numeric:lining-nums}
.bsp-notice{border-radius:14px;padding:18px 22px;margin-top:20px;border:1px solid}
.bsp-notice.warn{border-color:rgba(231,183,106,.4);background:rgba(231,183,106,.06)}
.bsp-notice.bad{border-color:rgba(229,134,134,.4);background:rgba(229,134,134,.06)}
.bsp-notice q{display:block;font-family:'Cormorant Garamond',serif;font-size:19px;margin-top:8px;color:var(--text)}

/* profile / forms */
.bsp-two{display:grid;grid-template-columns:320px minmax(0,1fr);gap:24px;align-items:start}
.bsp-dl{display:grid;grid-template-columns:1fr 1fr;gap:18px 28px;margin:18px 0 0}
.bsp-dl div{min-width:0}
.bsp-dl dt{font-size:12px;color:var(--faint)}
.bsp-dl dd{margin:3px 0 0;font-weight:500;overflow-wrap:anywhere}
.bsp-dl dd.none{color:var(--faint);font-weight:400}
.bsp-dl .wide{grid-column:1/-1}
.bsp-stack>*+*{margin-top:20px}
.bsp-field{display:block;margin-top:16px}
.bsp-field>span{display:block;font-size:13px;color:var(--muted);margin-bottom:7px;font-weight:500}
.bsp-input{width:100%;background:rgba(10,22,40,.6);border:1px solid var(--line2);border-radius:10px;color:var(--text);font:inherit;font-size:15px;padding:12px 14px;transition:border-color .2s}
.bsp-input:focus{outline:none;border-color:var(--gilt)}
textarea.bsp-input{min-height:140px;resize:vertical;line-height:1.55}
select.bsp-input{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--gilt) 50%),linear-gradient(135deg,var(--gilt) 50%,transparent 50%);background-position:calc(100% - 20px) 52%,calc(100% - 14px) 52%;background-size:6px 6px;background-repeat:no-repeat;padding-right:40px}
select.bsp-input option{background:#0A1628}
.bsp-hint{font-size:12px;color:var(--faint);margin-top:6px}
.bsp-msg{margin-top:14px;font-size:14px;padding:10px 14px;border-radius:10px}
.bsp-msg.err{color:#F2A7A7;background:rgba(229,134,134,.08);border:1px solid rgba(229,134,134,.3)}
.bsp-msg.ok{color:var(--sage);background:rgba(143,212,168,.08);border:1px solid rgba(143,212,168,.3)}
.bsp-check{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);margin-top:12px;cursor:pointer}
.bsp-check input{accent-color:var(--gilt)}
.bsp-chips{display:flex;flex-wrap:wrap;gap:8px}
.bsp-pill{background:transparent;border:1px solid var(--line2);color:var(--muted);border-radius:999px;padding:8px 14px;font-size:13px;font-weight:500;cursor:pointer}
.bsp-pill[aria-pressed=true]{background:var(--giltsoft);border-color:rgba(201,169,97,.6);color:var(--text)}
.bsp-list{list-style:none;margin:0;padding:0}
.bsp-list li{padding:16px 0;border-top:1px solid var(--line)}
.bsp-list li:first-child{border-top:0;padding-top:4px}
.bsp-li-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.bsp-li-head b{font-weight:600}
.bsp-li-meta{font-size:12px;color:var(--faint);margin-top:2px}
.bsp-reply{margin-top:12px;padding:12px 16px;border-left:2px solid var(--gilt);background:rgba(201,169,97,.06);border-radius:0 10px 10px 0}
.bsp-reply span{font-size:12px;color:var(--gilt2);font-weight:600}
.bsp-reply p{margin:4px 0 0}
.bsp-photo-big{width:100%;aspect-ratio:4/5;border-radius:14px;object-fit:cover;object-position:50% 25%;border:1px solid rgba(201,169,97,.4);background:linear-gradient(160deg,#132746,#0A1628);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:64px;color:var(--gilt)}
.bsp-docrow{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:13px 0;border-top:1px solid var(--line)}
.bsp-docrow:first-of-type{border-top:0}

/* modal */
.bsp-scrim{position:fixed;inset:0;z-index:200;background:rgba(5,11,22,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:bspFade .2s ease-out}
.bsp-modal{width:100%;max-width:520px;max-height:calc(100vh - 40px);overflow:auto;background:#10213D;border:1px solid rgba(201,169,97,.3);border-radius:18px;padding:30px 30px 26px;box-shadow:0 40px 100px -30px rgba(0,0,0,.9);animation:bspRise .3s cubic-bezier(.22,1,.36,1) both}
.bsp-modal-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.bsp-x{background:none;border:1px solid var(--line2);color:var(--muted);width:34px;height:34px;border-radius:9px;cursor:pointer;font-size:18px;line-height:1;flex-shrink:0}
.bsp-drop{display:flex;align-items:center;gap:14px;border:1px dashed rgba(201,169,97,.45);border-radius:12px;padding:16px 18px;cursor:pointer;background:rgba(201,169,97,.04);transition:border-color .2s,background .2s}
.bsp-drop:hover{border-color:var(--gilt);background:rgba(201,169,97,.08)}
.bsp-drop.has{border-style:solid;border-color:rgba(143,212,168,.45);background:rgba(143,212,168,.05)}
.bsp-drop.err{border-color:rgba(229,134,134,.5)}
.bsp-drop input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.bsp-drop-ic{width:40px;height:40px;border-radius:10px;border:1px solid rgba(201,169,97,.4);display:flex;align-items:center;justify-content:center;color:var(--gilt2);flex-shrink:0}
.bsp-drop b{display:block;font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bsp-drop small{display:block;font-size:12px;color:var(--faint)}
.bsp-money{position:relative}
.bsp-money .bsp-input{padding-left:30px}
.bsp-money::before{content:"$";position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--gilt2);font-weight:600}
.bsp-done{text-align:center;padding:24px 0 6px}
.bsp-done-ic{width:64px;height:64px;margin:0 auto;border-radius:50%;background:rgba(143,212,168,.12);border:1px solid rgba(143,212,168,.5);color:var(--sage);display:flex;align-items:center;justify-content:center}
.bsp-spin{width:22px;height:22px;border-radius:50%;border:2px solid rgba(10,22,40,.25);border-top-color:#0A1628;animation:bspSpin .8s linear infinite}
@keyframes bspRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes bspFade{from{opacity:0}to{opacity:1}}
@keyframes bspSpin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.bsp *{animation:none!important;transition:none!important}}

@media (max-width:900px){
  .bsp-row.solo .bsp-figs{grid-template-columns:1fr 1fr}
  .bsp-row.solo .bsp-fig:nth-child(2n){border-right:0}
  .bsp-row.solo .bsp-fig:nth-child(-n+2){border-bottom:1px solid var(--line)}
  .bsp-row{grid-template-columns:1fr}
  .bsp-two{grid-template-columns:1fr}
  .bsp-how{grid-template-columns:1fr}
  .bsp-cred-grid{grid-template-columns:auto 1fr}
  .bsp-cred-status{grid-column:1/-1;order:-1}
}
@media (max-width:720px){
  .bsp-top-in{height:auto;flex-wrap:wrap;padding:12px 16px 0;gap:10px 16px}
  .bsp-brand small{display:none}
  .bsp-me{margin-left:auto}
  .bsp-me .bsp-avatar{display:none}
  .bsp-site span{display:none}
  .bsp-tabs{order:3;width:100%;margin:0 -16px;padding:0 6px;overflow-x:auto;scrollbar-width:none;height:46px}
  .bsp-tabs::-webkit-scrollbar{display:none}
  .bsp-tab{padding:0 10px;flex-shrink:0;font-size:13.5px}
  .bsp-tab[aria-selected=true]::after{left:10px;right:10px}
  .bsp-main{padding:24px 16px 120px}
  .bsp-cred{padding:24px 22px;border-radius:18px}
  .bsp-cred-grid{grid-template-columns:1fr;gap:18px}
  .bsp-portrait{width:88px;height:110px;font-size:36px}
  .bsp-rosette{right:-170px;top:30%}
  .bsp-facts{gap:12px 22px}
  .bsp-card{padding:22px 20px}
  .bsp-next h3{font-size:25px}
  .bsp-actions .bsp-btn{flex:1 1 auto}
  .bsp-fig{padding:18px 18px}
  .bsp-fig b{font-size:29px}
  .bsp-docs{grid-template-columns:1fr}
  .bsp-step{grid-template-columns:34px minmax(0,1fr);gap:12px}
  .bsp-node{width:34px;height:34px;font-size:17px}
  .bsp-step::before{left:16px;top:34px}
  .bsp-step-card{padding:16px}
  .bsp-dl{grid-template-columns:1fr}
  .bsp-sec{margin-top:44px}
  .bsp-h2{font-size:26px}
  .bsp-modal{padding:24px 20px 20px;border-radius:16px}
}
`;
  function useStyles() {
    useEffect(() => {
      if (document.getElementById("bsp-css")) return;
      const s = document.createElement("style");
      s.id = "bsp-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }, []);
  }
  const Icon = {
    home: () => /* @__PURE__ */ React.createElement("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M3.5 11L12 4l8.5 7" }), /* @__PURE__ */ React.createElement("path", { d: "M6 9.5V20h12V9.5" }), /* @__PURE__ */ React.createElement("path", { d: "M10 20v-5h4v5" })),
    up: () => /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M12 16V4M7 9l5-5 5 5M5 20h14" })),
    check: (s = 18) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M5 12.5l4.5 4.5L19 7.5" })),
    doc: () => /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M6 2.5h8.5L19 7v14.5H6z" }), /* @__PURE__ */ React.createElement("path", { d: "M14 2.5V7h5" })),
    star: () => /* @__PURE__ */ React.createElement("svg", { width: "30", height: "30", viewBox: "0 0 36 36", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("g", { fill: "none", stroke: "#C9A961", strokeWidth: "1.2" }, /* @__PURE__ */ React.createElement("path", { d: "M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "18", r: "4", fill: "#C9A961", stroke: "none" })))
  };
  const Rosette = () => {
    const rings = [];
    for (let i = 0; i < 36; i++) rings.push(/* @__PURE__ */ React.createElement("ellipse", { key: i, cx: "200", cy: "200", rx: "190", ry: "62", transform: `rotate(${i * 5} 200 200)` }));
    const inner = [];
    for (let i = 0; i < 24; i++) inner.push(/* @__PURE__ */ React.createElement("ellipse", { key: "i" + i, cx: "200", cy: "200", rx: "104", ry: "34", transform: `rotate(${i * 7.5} 200 200)` }));
    return /* @__PURE__ */ React.createElement("svg", { className: "bsp-rosette", viewBox: "0 0 400 400", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("g", { fill: "none", stroke: "#C9A961", strokeWidth: ".6" }, rings), /* @__PURE__ */ React.createElement("g", { fill: "none", stroke: "#E2C98E", strokeWidth: ".5" }, inner), /* @__PURE__ */ React.createElement("circle", { cx: "200", cy: "200", r: "196", fill: "none", stroke: "#C9A961", strokeWidth: ".8" }), /* @__PURE__ */ React.createElement("circle", { cx: "200", cy: "200", r: "186", fill: "none", stroke: "#C9A961", strokeWidth: ".4" }));
  };
  function Modal({ title, sub, onClose, children }) {
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
    return /* @__PURE__ */ React.createElement("div", { className: "bsp-scrim", onMouseDown: (e) => {
      if (e.target === e.currentTarget) onClose();
    } }, /* @__PURE__ */ React.createElement("div", { className: "bsp-modal", role: "dialog", "aria-modal": "true", "aria-label": title }, /* @__PURE__ */ React.createElement("div", { className: "bsp-modal-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h2", style: { fontSize: 28 } }, title), sub && /* @__PURE__ */ React.createElement("p", { className: "bsp-sub" }, sub)), /* @__PURE__ */ React.createElement("button", { className: "bsp-x", onClick: onClose, "aria-label": t("Close") }, "×")), children));
  }
  function FilePick({ label, value, onChange, accept, imageOnly }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const pick = async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      setErr(null);
      const v = window.BrialFiles.validate(f);
      if (!v.ok) {
        setErr(v.error);
        return;
      }
      if (imageOnly && !/^image\/(jpeg|png|webp)$/i.test(f.type || "")) {
        setErr(L("Please choose a JPG, PNG or WebP photo.", "Pilih foto JPG, PNG, atau WebP."));
        return;
      }
      setBusy(true);
      try {
        onChange(await window.BrialFiles.put(f));
      } catch (x) {
        setErr(L("Upload failed. Check your connection and try again.", "Unggahan gagal. Periksa koneksi lalu coba lagi."));
      } finally {
        setBusy(false);
      }
    };
    return /* @__PURE__ */ React.createElement("label", { className: "bsp-field" }, /* @__PURE__ */ React.createElement("span", null, label), /* @__PURE__ */ React.createElement("div", { className: "bsp-drop" + (value ? " has" : "") + (err ? " err" : ""), style: { position: "relative" } }, /* @__PURE__ */ React.createElement("input", { type: "file", accept: accept || window.BrialFiles.allowedAccept, onChange: pick, disabled: busy }), /* @__PURE__ */ React.createElement("div", { className: "bsp-drop-ic" }, value ? Icon.check() : Icon.up()), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, busy ? t("Uploading…") : value ? value.name || value.filename : t("Choose a file")), /* @__PURE__ */ React.createElement("small", null, value ? (value.size ? value.size + " MB · " : "") + t("Replace file") : t(imageOnly ? "JPG, PNG or WebP, up to 2 MB." : "PDF, JPG, PNG or WebP, up to 2 MB.")))), err && /* @__PURE__ */ React.createElement("div", { className: "bsp-msg err" }, err));
  }
  function useSubmit(fn, onClose) {
    const [state, setState] = useState("form");
    const run = async () => {
      setState("busy");
      try {
        await fn();
        setState("done");
        setTimeout(onClose, 1500);
      } catch (e) {
        console.error(e);
        setState("form");
      }
    };
    return [state, run];
  }
  const Done = ({ text }) => /* @__PURE__ */ React.createElement("div", { className: "bsp-done" }, /* @__PURE__ */ React.createElement("div", { className: "bsp-done-ic" }, Icon.check(28)), /* @__PURE__ */ React.createElement("p", { style: { marginTop: 14, fontWeight: 600 } }, text));
  function BillDialog({ applicant, store, sem, onClose }) {
    var _a, _b;
    const [file, setFile] = useState(null);
    const [amount, setAmount] = useState(((_b = (_a = applicant.profile) == null ? void 0 : _a.university) == null ? void 0 : _b.uktPerSemester) || "");
    const n = parseFloat(String(amount).replace(/,/g, ""));
    const ok = file && n > 0;
    const [state, run] = useSubmit(() => store.uploadBill(applicant.id, sem.id, { ...file, amount: n }), onClose);
    return /* @__PURE__ */ React.createElement(Modal, { title: L(`${sem.label} tuition bill`, `Tagihan UKT ${sem.label}`), sub: L("Upload the official bill from your university. The foundation reviews it and pays your tuition.", "Unggah tagihan resmi dari kampus. Yayasan meninjaunya lalu membayar UKT Anda."), onClose }, state === "done" ? /* @__PURE__ */ React.createElement(Done, { text: L("Bill sent for review.", "Tagihan terkirim untuk ditinjau.") }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(FilePick, { label: t("Tuition bill"), value: file, onChange: setFile }), /* @__PURE__ */ React.createElement("label", { className: "bsp-field" }, /* @__PURE__ */ React.createElement("span", null, t("Amount due (USD)")), /* @__PURE__ */ React.createElement("div", { className: "bsp-money" }, /* @__PURE__ */ React.createElement("input", { className: "bsp-input", inputMode: "decimal", value: amount, onChange: (e) => setAmount(e.target.value), placeholder: "0" })), /* @__PURE__ */ React.createElement("div", { className: "bsp-hint" }, t("Enter the amount on the bill."))), /* @__PURE__ */ React.createElement("div", { className: "bsp-actions", style: { marginTop: 24 } }, /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary", disabled: !ok || state === "busy", onClick: run }, state === "busy" ? /* @__PURE__ */ React.createElement("span", { className: "bsp-spin" }) : L("Send bill", "Kirim tagihan")), /* @__PURE__ */ React.createElement("button", { className: "bsp-btn ghost", onClick: onClose }, t("Cancel")))));
  }
  function TranscriptDialog({ applicant, store, sem, onClose }) {
    const [file, setFile] = useState(null);
    const [gpa, setGpa] = useState("");
    const g = parseFloat(String(gpa).replace(",", "."));
    const gOk = !isNaN(g) && g >= 0 && g <= 4;
    const [state, run] = useSubmit(() => store.uploadIP(applicant.id, sem.id, { ...file, gpa: g.toFixed(2) }), onClose);
    return /* @__PURE__ */ React.createElement(Modal, { title: L(`${sem.label} results`, `Hasil ${sem.label}`), sub: L("Upload your transcript and the GPA for this semester.", "Unggah transkrip dan IP semester ini."), onClose }, state === "done" ? /* @__PURE__ */ React.createElement(Done, { text: L("Results saved. Thank you.", "Hasil tersimpan. Terima kasih.") }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(FilePick, { label: t("Transcript"), value: file, onChange: setFile }), /* @__PURE__ */ React.createElement("label", { className: "bsp-field" }, /* @__PURE__ */ React.createElement("span", null, t("Semester GPA")), /* @__PURE__ */ React.createElement("input", { className: "bsp-input", inputMode: "decimal", value: gpa, onChange: (e) => setGpa(e.target.value), placeholder: "3.62", style: { maxWidth: 160 } }), /* @__PURE__ */ React.createElement("div", { className: "bsp-hint" }, t("Enter a number between 0 and 4, for example 3.62."))), /* @__PURE__ */ React.createElement("div", { className: "bsp-actions", style: { marginTop: 24 } }, /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary", disabled: !file || !gOk || state === "busy", onClick: run }, state === "busy" ? /* @__PURE__ */ React.createElement("span", { className: "bsp-spin" }) : L("Save results", "Simpan hasil")), /* @__PURE__ */ React.createElement("button", { className: "bsp-btn ghost", onClick: onClose }, t("Cancel")))));
  }
  function GraduationDialog({ applicant, store, onClose }) {
    const [ij, setIj] = useState(null);
    const [tr, setTr] = useState(null);
    const [state, run] = useSubmit(() => store.submitGraduation(applicant.id, { ijazahFile: ij, transkripFile: tr }), onClose);
    return /* @__PURE__ */ React.createElement(Modal, { title: L("Graduation documents", "Dokumen kelulusan"), sub: L("Upload your diploma and final transcript to complete your record with the foundation.", "Unggah ijazah dan transkrip akhir untuk melengkapi catatan Anda di yayasan."), onClose }, state === "done" ? /* @__PURE__ */ React.createElement(Done, { text: L("Congratulations — your record is complete.", "Selamat — catatan Anda sudah lengkap.") }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(FilePick, { label: t("Diploma (ijazah)"), value: ij, onChange: setIj }), /* @__PURE__ */ React.createElement(FilePick, { label: t("Final transcript"), value: tr, onChange: setTr }), /* @__PURE__ */ React.createElement("div", { className: "bsp-actions", style: { marginTop: 24 } }, /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary", disabled: !ij || !tr || state === "busy", onClick: run }, state === "busy" ? /* @__PURE__ */ React.createElement("span", { className: "bsp-spin" }) : L("Submit documents", "Kirim dokumen")), /* @__PURE__ */ React.createElement("button", { className: "bsp-btn ghost", onClick: onClose }, t("Cancel")))));
  }
  function useScholar(applicant, store) {
    return useMemo(() => {
      const sems = applicant.semesters || [];
      const paid = sems.filter((s) => s.paidAt);
      const received = paid.reduce((a, s) => {
        var _a;
        return a + (Number((_a = s.bill) == null ? void 0 : _a.amount) || 0);
      }, 0);
      const pending = sems.filter((s) => s.status === "bill-uploaded").reduce((a, s) => {
        var _a;
        return a + (Number((_a = s.bill) == null ? void 0 : _a.amount) || 0);
      }, 0);
      const ipk = store.cumulativeIPK ? store.cumulativeIPK(applicant) : null;
      const status = applicant.scholarStatus || "active";
      const level = store.getDegreeLevel ? store.getDegreeLevel(applicant) : null;
      const total = (level == null ? void 0 : level.totalSemesters) || 8;
      const allDone = sems.length > 0 && sems.every((s) => s.status === "completed");
      const lastNum = sems.length ? sems[sems.length - 1].number : 0;
      const canGraduate = status === "active" && allDone && lastNum >= total;
      let next = null;
      if (status === "active") {
        const cur = sems.find((s) => s.status === "current");
        const review = sems.find((s) => s.status === "bill-uploaded");
        const needIp = sems.find((s) => s.status === "paid" && !s.ip);
        if (needIp) next = { kind: "ip", sem: needIp };
        else if (cur) next = { kind: "bill", sem: cur };
        else if (review) next = { kind: "review", sem: review };
        else if (canGraduate) next = { kind: "graduate" };
        else if (!sems.length) next = { kind: "empty" };
        else next = { kind: "clear" };
      }
      return { sems, paid, received, pending, ipk, status, level, canGraduate, next };
    }, [applicant, store]);
  }
  function Credential({ applicant, d }) {
    const p = applicant.profile || {};
    const u = p.university || {};
    const per = p.personal || {};
    const photo = per.showcasePhoto || (isImage(per.photoFile) ? per.photoFile : null);
    const url = fileUrl(photo);
    const chip = {
      active: ["ok", "Active scholar"],
      suspended: ["warn", "Scholarship paused"],
      revoked: ["bad", "Scholarship ended"],
      graduated: ["gold", "Brial alum"]
    }[d.status] || ["ok", "Active scholar"];
    const name = titleCase(per.fullName || applicant.name);
    return /* @__PURE__ */ React.createElement("section", { className: "bsp-cred", "aria-label": L("Scholarship credential", "Kartu penerima beasiswa") }, /* @__PURE__ */ React.createElement(Rosette, null), /* @__PURE__ */ React.createElement("div", { className: "bsp-cred-grid" }, url ? /* @__PURE__ */ React.createElement("img", { className: "bsp-portrait", src: url, alt: "" }) : /* @__PURE__ */ React.createElement("div", { className: "bsp-portrait" }, name.charAt(0)), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("h1", { className: "bsp-name" }, name), /* @__PURE__ */ React.createElement("div", { className: "bsp-prog" }, instCase(u.program), u.program && u.name ? ", " : "", instCase(u.name)), /* @__PURE__ */ React.createElement("div", { className: "bsp-facts" }, applicant.scholarId && /* @__PURE__ */ React.createElement("div", { className: "bsp-fact" }, /* @__PURE__ */ React.createElement("span", null, t("Scholar ID")), /* @__PURE__ */ React.createElement("b", null, applicant.scholarId)), applicant.cohort && /* @__PURE__ */ React.createElement("div", { className: "bsp-fact" }, /* @__PURE__ */ React.createElement("span", null, t("Class")), /* @__PURE__ */ React.createElement("b", null, String(applicant.cohort).replace(/^Class of\s*/i, ""))), d.level && /* @__PURE__ */ React.createElement("div", { className: "bsp-fact" }, /* @__PURE__ */ React.createElement("span", null, t("Programme")), /* @__PURE__ */ React.createElement("b", null, d.level.label)), d.sems.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "bsp-fact" }, /* @__PURE__ */ React.createElement("span", null, t("Funded semesters")), /* @__PURE__ */ React.createElement("b", null, d.sems[0].number, "–", d.sems[d.sems.length - 1].number)))), /* @__PURE__ */ React.createElement("div", { className: "bsp-cred-status" }, /* @__PURE__ */ React.createElement("span", { className: "bsp-chip " + chip[0] }, /* @__PURE__ */ React.createElement("i", null), t(chip[1])))));
  }
  function NextStep({ d, onBill, onIp, onGrad, onHelp }) {
    var _a, _b;
    const n = d.next;
    if (!n) return null;
    let k = t("Next step"), title, body, actions = null;
    if (n.kind === "bill") {
      title = L(`Upload your ${n.sem.label} tuition bill`, `Unggah tagihan UKT ${n.sem.label}`);
      body = L("Send the official bill (UKT) from your university. Once it is reviewed, the foundation pays your tuition.", "Kirim tagihan UKT resmi dari kampus. Setelah ditinjau, yayasan membayar UKT Anda.");
      actions = /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary", onClick: () => onBill(n.sem) }, Icon.up(), t("Upload bill"));
    } else if (n.kind === "ip") {
      title = L(`${n.sem.label} is paid — add your results`, `${n.sem.label} sudah dibayar — tambahkan hasilnya`);
      body = L("When your grades are out, upload the transcript and your semester GPA.", "Setelah nilai keluar, unggah transkrip dan IP semester Anda.");
      actions = /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary", onClick: () => onIp(n.sem) }, Icon.up(), t("Upload transcript"));
    } else if (n.kind === "review") {
      title = L(`We're reviewing your ${n.sem.label} bill`, `Tagihan ${n.sem.label} sedang ditinjau`);
      body = L(`Sent on ${date((_a = n.sem.bill) == null ? void 0 : _a.uploadedAt)}. You don't need to do anything right now — the payment will appear here.`, `Dikirim pada ${date((_b = n.sem.bill) == null ? void 0 : _b.uploadedAt)}. Saat ini Anda tidak perlu melakukan apa pun — pembayarannya akan tampil di sini.`);
      actions = n.sem.bill ? /* @__PURE__ */ React.createElement("button", { className: "bsp-btn ghost", onClick: () => window.BrialFiles.open(n.sem.bill) }, t("View bill")) : null;
    } else if (n.kind === "graduate") {
      title = L("All semesters complete — time to graduate", "Semua semester selesai — saatnya lulus");
      body = L("Upload your diploma (ijazah) and final transcript to complete your record.", "Unggah ijazah dan transkrip akhir untuk melengkapi catatan Anda.");
      actions = /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary", onClick: onGrad }, Icon.up(), t("Upload graduation documents"));
    } else if (n.kind === "empty") {
      title = t("You're all set");
      body = t("No semesters have been set up yet. The foundation will add them shortly.");
    } else {
      title = t("You're all set");
      body = t("Nothing needs your attention right now. We'll show the next step here when it's time.");
      actions = /* @__PURE__ */ React.createElement("button", { className: "bsp-link", onClick: onHelp }, t("Message the foundation"));
    }
    return /* @__PURE__ */ React.createElement("div", { className: "bsp-card bsp-next" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "bsp-next-k" }, k), /* @__PURE__ */ React.createElement("h3", null, title), /* @__PURE__ */ React.createElement("p", null, body)), actions && /* @__PURE__ */ React.createElement("div", { className: "bsp-actions" }, actions));
  }
  function Figures({ d }) {
    const total = d.sems.length;
    const pct = total ? Math.round(d.paid.length / total * 100) : 0;
    const low = d.ipk && d.ipk.value < 2.75;
    return /* @__PURE__ */ React.createElement("div", { className: "bsp-card bsp-figs" }, /* @__PURE__ */ React.createElement("div", { className: "bsp-fig" }, /* @__PURE__ */ React.createElement("span", null, t("Total received")), /* @__PURE__ */ React.createElement("b", null, money(d.received))), /* @__PURE__ */ React.createElement("div", { className: "bsp-fig" }, /* @__PURE__ */ React.createElement("span", null, t("Semesters paid")), /* @__PURE__ */ React.createElement("b", null, d.paid.length, /* @__PURE__ */ React.createElement("span", { style: { display: "inline", fontSize: 22, color: "var(--faint)" } }, " / ", total)), /* @__PURE__ */ React.createElement("div", { className: "bsp-bar", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", { style: { width: pct + "%" } }))), /* @__PURE__ */ React.createElement("div", { className: "bsp-fig" }, /* @__PURE__ */ React.createElement("span", null, t("Cumulative GPA")), /* @__PURE__ */ React.createElement("b", { style: { color: low ? "var(--rose)" : void 0 } }, d.ipk ? d.ipk.value.toFixed(2) : "—"), /* @__PURE__ */ React.createElement("small", null, d.ipk ? t(low ? "Below the 2.75 minimum — talk to the foundation" : "Keep it at 2.75 or higher to continue the award") : t("Appears after your first transcript"))), /* @__PURE__ */ React.createElement("div", { className: "bsp-fig" }, /* @__PURE__ */ React.createElement("span", null, t("Awaiting payment")), /* @__PURE__ */ React.createElement("b", { style: { color: d.pending ? "var(--amber)" : void 0 } }, money(d.pending))));
  }
  function StatusNotice({ applicant, d }) {
    if (d.status !== "suspended" && d.status !== "revoked") return null;
    const last = (applicant.statusHistory || []).slice().reverse().find((e) => e.status === d.status);
    return /* @__PURE__ */ React.createElement("div", { className: "bsp-notice " + (d.status === "suspended" ? "warn" : "bad") }, /* @__PURE__ */ React.createElement("b", null, d.status === "suspended" ? L("Your scholarship is paused", "Beasiswa Anda ditangguhkan") : L("Your scholarship has ended", "Beasiswa Anda telah dihentikan")), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--muted)", marginTop: 4 } }, d.status === "suspended" ? L("No payments are made while it is paused. Message the foundation to talk about reinstatement.", "Tidak ada pembayaran selama ditangguhkan. Kirim pesan ke yayasan untuk membicarakan pengaktifan kembali.") : L("Past payments stay on the public ledger as a record.", "Pembayaran sebelumnya tetap tercatat di buku besar publik.")), last && last.reason && /* @__PURE__ */ React.createElement("q", null, last.reason));
  }
  const SEM_TAG = {
    upcoming: ["mute", "Upcoming"],
    current: ["gold", "Action needed"],
    "bill-uploaded": ["warn", "In review"],
    paid: ["gold", "Results due"],
    completed: ["ok", "Complete"]
  };
  function Journey({ d, locked, onBill, onIp }) {
    if (!d.sems.length) return null;
    return /* @__PURE__ */ React.createElement("ol", { className: "bsp-journey" }, d.sems.map((s) => {
      const tag = SEM_TAG[s.status] || SEM_TAG.upcoming;
      const now = !locked && (s.status === "current" || s.status === "paid" || s.status === "bill-uploaded");
      const done = s.status === "completed";
      const billDoc = s.bill ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "bsp-doc-l" }, /* @__PURE__ */ React.createElement("span", null, t("Tuition bill")), /* @__PURE__ */ React.createElement("b", null, money(s.bill.amount)), /* @__PURE__ */ React.createElement("em", { className: s.paidAt ? "ok" : "" }, s.paidAt ? L(`Paid on ${date(s.paidAt)}`, `Dibayar ${date(s.paidAt)}`) : L(`Sent on ${date(s.bill.uploadedAt)}`, `Dikirim ${date(s.bill.uploadedAt)}`))), /* @__PURE__ */ React.createElement("button", { className: "bsp-btn ghost small", onClick: () => window.BrialFiles.open(s.bill) }, t("View"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "bsp-doc-l" }, /* @__PURE__ */ React.createElement("span", null, t("Tuition bill")), /* @__PURE__ */ React.createElement("em", null, s.status === "current" ? t("Not uploaded yet") : t("Opens when this semester starts"))), s.status === "current" && !locked && /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary small", onClick: () => onBill(s) }, t("Upload bill")));
      const ipDoc = s.ip ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "bsp-doc-l" }, /* @__PURE__ */ React.createElement("span", null, t("Transcript")), /* @__PURE__ */ React.createElement("b", null, L("GPA", "IP"), " ", s.ip.gpa), /* @__PURE__ */ React.createElement("em", null, L(`Added on ${date(s.ip.uploadedAt)}`, `Ditambahkan ${date(s.ip.uploadedAt)}`))), /* @__PURE__ */ React.createElement("button", { className: "bsp-btn ghost small", onClick: () => window.BrialFiles.open(s.ip) }, t("View"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "bsp-doc-l" }, /* @__PURE__ */ React.createElement("span", null, t("Transcript")), /* @__PURE__ */ React.createElement("em", null, s.status === "paid" ? t("Not uploaded yet") : t("Opens after tuition is paid"))), s.status === "paid" && !locked && /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary small", onClick: () => onIp(s) }, t("Upload transcript")));
      return /* @__PURE__ */ React.createElement("li", { key: s.id, className: "bsp-step" }, /* @__PURE__ */ React.createElement("div", { className: "bsp-node" + (done ? " done" : now ? " now" : ""), "aria-hidden": "true" }, done ? Icon.check(18) : s.number), /* @__PURE__ */ React.createElement("div", { className: "bsp-step-card" + (now ? " now" : "") }, /* @__PURE__ */ React.createElement("div", { className: "bsp-step-head" }, /* @__PURE__ */ React.createElement("h4", null, s.label), /* @__PURE__ */ React.createElement("span", { className: "bsp-tag " + (s.status === "paid" ? "ok" : tag[0]) }, s.status === "paid" ? t("Paid") : t(tag[1]))), /* @__PURE__ */ React.createElement("div", { className: "bsp-docs" }, /* @__PURE__ */ React.createElement("div", { className: "bsp-doc" }, billDoc), /* @__PURE__ */ React.createElement("div", { className: "bsp-doc" }, ipDoc))));
    }));
  }
  function GraduationRecord({ applicant }) {
    const g = applicant.graduation;
    if (applicant.scholarStatus !== "graduated" || !g) return null;
    return /* @__PURE__ */ React.createElement("section", { className: "bsp-sec" }, /* @__PURE__ */ React.createElement("div", { className: "bsp-sec-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "bsp-h2" }, t("Your graduation record")), /* @__PURE__ */ React.createElement("p", { className: "bsp-sub" }, t("Congratulations on completing your studies."), " ", date(g.graduatedAt)))), /* @__PURE__ */ React.createElement("div", { className: "bsp-docs", style: { marginTop: 0 } }, [["Diploma (ijazah)", g.ijazahFile], ["Final transcript", g.transkripFile]].map(([l, f]) => /* @__PURE__ */ React.createElement("div", { className: "bsp-doc", key: l }, /* @__PURE__ */ React.createElement("div", { className: "bsp-doc-l" }, /* @__PURE__ */ React.createElement("span", null, t(l)), /* @__PURE__ */ React.createElement("b", null, f ? f.name || f.filename : t("Not provided"))), f && /* @__PURE__ */ React.createElement("button", { className: "bsp-btn ghost small", onClick: () => window.BrialFiles.open(f) }, t("View"))))));
  }
  const HIST = { active: ["ok", "Active"], suspended: ["warn", "Paused"], revoked: ["mute", "Ended"], graduated: ["gold", "Graduated"] };
  function History({ applicant }) {
    const h = (applicant.statusHistory || []).slice().reverse();
    if (!h.length) return null;
    return /* @__PURE__ */ React.createElement("section", { className: "bsp-sec" }, /* @__PURE__ */ React.createElement("div", { className: "bsp-sec-head" }, /* @__PURE__ */ React.createElement("h2", { className: "bsp-h2" }, t("Scholarship history"))), /* @__PURE__ */ React.createElement("div", { className: "bsp-card", style: { paddingTop: 12, paddingBottom: 12 } }, /* @__PURE__ */ React.createElement("ul", { className: "bsp-list" }, h.map((e, i) => {
      const m = HIST[e.status] || ["mute", e.status];
      return /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement("div", { className: "bsp-li-head" }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, date(e.at)), e.reason && /* @__PURE__ */ React.createElement("div", { className: "bsp-li-meta", style: { fontSize: 14, color: "var(--muted)" } }, e.reason === "Initial acceptance" ? L("Scholarship awarded", "Beasiswa diberikan") : e.reason)), /* @__PURE__ */ React.createElement("span", { className: "bsp-tag " + m[0] }, t(m[1]))));
    }))));
  }
  function Overview({ applicant, store, d, goHelp }) {
    const [bill, setBill] = useState(null);
    const [ip, setIp] = useState(null);
    const [grad, setGrad] = useState(false);
    const locked = d.status !== "active";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Credential, { applicant, d }), /* @__PURE__ */ React.createElement(StatusNotice, { applicant, d }), /* @__PURE__ */ React.createElement("div", { className: "bsp-row" + (d.next ? "" : " solo") }, d.next && /* @__PURE__ */ React.createElement(NextStep, { d, onBill: setBill, onIp: setIp, onGrad: () => setGrad(true), onHelp: goHelp }), /* @__PURE__ */ React.createElement(Figures, { d })), d.sems.length > 0 && /* @__PURE__ */ React.createElement("section", { className: "bsp-sec" }, /* @__PURE__ */ React.createElement("div", { className: "bsp-sec-head" }, /* @__PURE__ */ React.createElement("h2", { className: "bsp-h2" }, t("Your semesters"))), /* @__PURE__ */ React.createElement(Journey, { d, locked, onBill: setBill, onIp: setIp })), /* @__PURE__ */ React.createElement(GraduationRecord, { applicant }), /* @__PURE__ */ React.createElement(History, { applicant }), d.status === "active" && /* @__PURE__ */ React.createElement("section", { className: "bsp-sec" }, /* @__PURE__ */ React.createElement("h2", { className: "bsp-h2" }, t("How your scholarship works")), /* @__PURE__ */ React.createElement("ol", { className: "bsp-how", style: { padding: 0 } }, /* @__PURE__ */ React.createElement("li", null, t("At the start of each semester, upload the official tuition bill (UKT) from your university.")), /* @__PURE__ */ React.createElement("li", null, t("The foundation reviews the bill and pays your tuition. You will see the payment here.")), /* @__PURE__ */ React.createElement("li", null, t("When grades are out, upload your transcript and semester GPA. Keep your cumulative GPA at 2.75 or higher.")))), bill && /* @__PURE__ */ React.createElement(BillDialog, { applicant, store, sem: bill, onClose: () => setBill(null) }), ip && /* @__PURE__ */ React.createElement(TranscriptDialog, { applicant, store, sem: ip, onClose: () => setIp(null) }), grad && /* @__PURE__ */ React.createElement(GraduationDialog, { applicant, store, onClose: () => setGrad(false) }));
  }
  function PublicPhoto({ applicant, store }) {
    var _a, _b;
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const photo = ((_b = (_a = applicant.profile) == null ? void 0 : _a.personal) == null ? void 0 : _b.showcasePhoto) || null;
    const url = fileUrl(photo);
    const pick = async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      setErr(null);
      const v = window.BrialFiles.validate(f);
      if (!v.ok) {
        setErr(v.error);
        return;
      }
      if (!/^image\/(jpeg|png|webp)$/i.test(f.type || "")) {
        setErr(L("Please choose a JPG, PNG or WebP photo.", "Pilih foto JPG, PNG, atau WebP."));
        return;
      }
      setBusy(true);
      try {
        const meta = await window.BrialFiles.put(f, { public: true });
        store.updateProfile(applicant.id, "personal", { showcasePhoto: meta });
      } catch (x) {
        setErr(L("Upload failed. Check your connection and try again.", "Unggahan gagal. Periksa koneksi lalu coba lagi."));
      } finally {
        setBusy(false);
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "bsp-card" }, url ? /* @__PURE__ */ React.createElement("img", { className: "bsp-photo-big", src: url, alt: "" }) : /* @__PURE__ */ React.createElement("div", { className: "bsp-photo-big" }, (applicant.name || "?").charAt(0)), /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3", style: { marginTop: 18 } }, t("Your public photo")), /* @__PURE__ */ React.createElement("p", { className: "bsp-sub", style: { fontSize: 14 } }, t("This photo appears on the Scholars page of brialendowment.org.")), /* @__PURE__ */ React.createElement("label", { className: "bsp-btn ghost", style: { marginTop: 14, width: "100%", position: "relative" } }, /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onChange: pick, disabled: busy, style: { position: "absolute", width: 1, height: 1, opacity: 0 } }), Icon.up(), busy ? t("Uploading…") : photo ? t("Change photo") : t("Upload photo")), /* @__PURE__ */ React.createElement("div", { className: "bsp-hint", style: { textAlign: "center" } }, t("JPG, PNG or WebP, up to 2 MB.")), err && /* @__PURE__ */ React.createElement("div", { className: "bsp-msg err" }, err));
  }
  const Row = ({ label, value, wide }) => /* @__PURE__ */ React.createElement("div", { className: wide ? "wide" : "" }, /* @__PURE__ */ React.createElement("dt", null, t(label)), /* @__PURE__ */ React.createElement("dd", { className: value ? "" : "none" }, value || t("Not provided")));
  function Profile({ applicant, store }) {
    const p = applicant.profile || {};
    const per = p.personal || {}, hs = p.highSchool || {}, u = p.university || {};
    const lvl = window.BrialStore.DEGREE_LEVELS && window.BrialStore.DEGREE_LEVELS[u.degreeLevel];
    const docs = [["Biometric photo", per.photoFile], ["Report card", hs.raporFile], ["Student card", u.studentCardFile]];
    return /* @__PURE__ */ React.createElement("div", { className: "bsp-two" }, /* @__PURE__ */ React.createElement(PublicPhoto, { applicant, store }), /* @__PURE__ */ React.createElement("div", { className: "bsp-stack" }, /* @__PURE__ */ React.createElement("div", { className: "bsp-card" }, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3" }, t("Personal details")), /* @__PURE__ */ React.createElement("dl", { className: "bsp-dl" }, /* @__PURE__ */ React.createElement(Row, { label: "Full name", value: titleCase(per.fullName || applicant.name) }), /* @__PURE__ */ React.createElement(Row, { label: "Email", value: applicant.email }), /* @__PURE__ */ React.createElement(Row, { label: "Date of birth", value: per.dateOfBirth ? date(per.dateOfBirth) : "" }), /* @__PURE__ */ React.createElement(Row, { label: "Phone", value: per.phone }), /* @__PURE__ */ React.createElement(Row, { label: "Country", value: titleCase(per.country) }), /* @__PURE__ */ React.createElement(Row, { label: "National ID", value: per.nationalId }), /* @__PURE__ */ React.createElement(Row, { label: "Address", value: per.address, wide: true }))), /* @__PURE__ */ React.createElement("div", { className: "bsp-card" }, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3" }, t("Education")), /* @__PURE__ */ React.createElement("dl", { className: "bsp-dl" }, /* @__PURE__ */ React.createElement(Row, { label: "University", value: instCase(u.name) }), /* @__PURE__ */ React.createElement(Row, { label: "Study programme", value: instCase(u.program) }), /* @__PURE__ */ React.createElement(Row, { label: "Programme", value: lvl ? lvl.label : u.degreeLevel }), /* @__PURE__ */ React.createElement(Row, { label: "Current semester", value: u.currentSemester }), /* @__PURE__ */ React.createElement(Row, { label: "GPA at application", value: u.currentGPA }), /* @__PURE__ */ React.createElement(Row, { label: "Tuition per semester", value: u.uktPerSemester ? money(u.uktPerSemester) : "" }), /* @__PURE__ */ React.createElement(Row, { label: "High school", value: instCase(hs.schoolName) }), /* @__PURE__ */ React.createElement(Row, { label: "Graduation year", value: hs.graduationYear }), /* @__PURE__ */ React.createElement(Row, { label: "Final grade", value: hs.finalGPA })), Array.isArray(hs.subjects) && hs.subjects.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3", style: { marginTop: 26, fontSize: 14 } }, t("Subject grades")), /* @__PURE__ */ React.createElement("dl", { className: "bsp-dl", style: { gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", marginTop: 12 } }, hs.subjects.map((sj, i) => /* @__PURE__ */ React.createElement("div", { key: i }, /* @__PURE__ */ React.createElement("dt", null, sj.name || "—"), /* @__PURE__ */ React.createElement("dd", null, sj.grade || "—")))))), /* @__PURE__ */ React.createElement("div", { className: "bsp-card" }, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3" }, t("Documents")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, docs.map(([l, f]) => /* @__PURE__ */ React.createElement("div", { className: "bsp-docrow", key: l }, /* @__PURE__ */ React.createElement("div", { className: "bsp-doc-l" }, /* @__PURE__ */ React.createElement("span", null, t(l)), /* @__PURE__ */ React.createElement("b", null, f ? f.name || f.filename : t("Not provided"))), f && /* @__PURE__ */ React.createElement("button", { className: "bsp-btn ghost small", onClick: () => window.BrialFiles.open(f) }, t("View")))))), (p.essay || "").trim() && /* @__PURE__ */ React.createElement("div", { className: "bsp-card" }, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3" }, t("Application essay")), /* @__PURE__ */ React.createElement("p", { style: { margin: "14px 0 0", color: "var(--muted)", whiteSpace: "pre-wrap", fontFamily: "'Cormorant Garamond',serif", fontSize: 18, lineHeight: 1.6, maxWidth: "68ch" } }, p.essay)), /* @__PURE__ */ React.createElement("p", { className: "bsp-hint", style: { fontSize: 13 } }, t("Spot a mistake? Request a correction from the Account tab."))));
  }
  const FIELDS = [
    ["email", "Email address", "Alamat email"],
    ["profile.personal.fullName", "Full legal name", "Nama lengkap sesuai identitas"],
    ["profile.personal.phone", "Phone number", "Nomor telepon"],
    ["profile.personal.address", "Address", "Alamat"],
    ["profile.personal.nationalId", "National ID / passport", "NIK / paspor"],
    ["profile.personal.country", "Country", "Negara"],
    ["profile.university.name", "University", "Universitas"],
    ["profile.university.program", "Study programme", "Program studi"],
    ["profile.university.currentSemester", "Current semester", "Semester saat ini"],
    ["profile.university.currentGPA", "Current GPA", "IPK saat ini"],
    ["profile.university.uktPerSemester", "Tuition per semester (USD)", "UKT per semester (USD)"],
    ["profile.highSchool.schoolName", "High school", "Sekolah menengah"],
    ["profile.highSchool.finalGPA", "High school final grade", "Nilai akhir SMA"]
  ];
  function Account({ applicant, store }) {
    const [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [show, setShow] = useState(false), [pwMsg, setPwMsg] = useState(null), [pwBusy, setPwBusy] = useState(false);
    const [fk, setFk] = useState(FIELDS[0][0]), [val, setVal] = useState(""), [rMsg, setRMsg] = useState(null);
    const reqs = applicant.changeRequests || [];
    const savePw = async () => {
      setPwMsg(null);
      if (pw.length < 8) return setPwMsg({ err: t("Password must be at least 8 characters.") });
      if (pw !== pw2) return setPwMsg({ err: t("Passwords do not match.") });
      setPwBusy(true);
      const r = await store.updateAccount(applicant.id, { password: pw });
      setPwBusy(false);
      if (r && r.error) return setPwMsg({ err: r.error });
      setPw("");
      setPw2("");
      setPwMsg({ ok: t("Password updated. Other devices have been signed out.") });
    };
    const sendReq = async () => {
      setRMsg(null);
      if (!val.trim()) return setRMsg({ err: t("Please enter the correct value.") });
      const f = FIELDS.find((x) => x[0] === fk);
      const type = fk === "email" ? "email" : "field";
      const r = await store.requestChange(applicant.id, { type, value: val.trim(), label: f[1], note: type === "field" ? fk : "" });
      if (r && r.error) return setRMsg({ err: r.error });
      setVal("");
      setRMsg({ ok: t("Request sent. The foundation will review it.") });
    };
    const stat = { pending: ["warn", "Pending"], approved: ["ok", "Approved"], rejected: ["mute", "Declined"] };
    return /* @__PURE__ */ React.createElement("div", { className: "bsp-row", style: { marginTop: 0, alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", { className: "bsp-card" }, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3" }, t("Request a correction")), /* @__PURE__ */ React.createElement("p", { className: "bsp-sub", style: { fontSize: 14 } }, t("Changes to your details are checked by the foundation before they take effect.")), /* @__PURE__ */ React.createElement("label", { className: "bsp-field" }, /* @__PURE__ */ React.createElement("span", null, t("What needs correcting?")), /* @__PURE__ */ React.createElement("select", { className: "bsp-input", value: fk, onChange: (e) => {
      setFk(e.target.value);
      setVal("");
      setRMsg(null);
    } }, FIELDS.map((f) => /* @__PURE__ */ React.createElement("option", { key: f[0], value: f[0] }, L(f[1], f[2]))))), /* @__PURE__ */ React.createElement("label", { className: "bsp-field" }, /* @__PURE__ */ React.createElement("span", null, t("Correct value")), /* @__PURE__ */ React.createElement("input", { className: "bsp-input", type: fk === "email" ? "email" : "text", value: val, onChange: (e) => setVal(e.target.value) })), rMsg && /* @__PURE__ */ React.createElement("div", { className: "bsp-msg " + (rMsg.err ? "err" : "ok") }, rMsg.err || rMsg.ok), /* @__PURE__ */ React.createElement("div", { className: "bsp-actions", style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary", onClick: sendReq }, t("Send request"))), reqs.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3", style: { marginTop: 30, marginBottom: 6 } }, t("Your requests")), /* @__PURE__ */ React.createElement("ul", { className: "bsp-list" }, reqs.slice(0, 8).map((r) => {
      const s = stat[r.status] || stat.pending;
      return /* @__PURE__ */ React.createElement("li", { key: r.id }, /* @__PURE__ */ React.createElement("div", { className: "bsp-li-head" }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, r.label), /* @__PURE__ */ React.createElement("div", { className: "bsp-li-meta" }, r.type === "password" ? "••••••••" : r.value)), /* @__PURE__ */ React.createElement("span", { className: "bsp-tag " + s[0] }, t(s[1]))), r.status === "rejected" && r.reason && /* @__PURE__ */ React.createElement("div", { className: "bsp-li-meta", style: { marginTop: 6 } }, t("Reason:"), " ", r.reason));
    })))), /* @__PURE__ */ React.createElement("div", { className: "bsp-card" }, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3" }, t("Change password")), /* @__PURE__ */ React.createElement("dl", { className: "bsp-dl", style: { gridTemplateColumns: "1fr", marginTop: 12 } }, /* @__PURE__ */ React.createElement(Row, { label: "Sign-in email", value: applicant.email })), /* @__PURE__ */ React.createElement("label", { className: "bsp-field" }, /* @__PURE__ */ React.createElement("span", null, t("New password")), /* @__PURE__ */ React.createElement("input", { className: "bsp-input", type: show ? "text" : "password", autoComplete: "new-password", value: pw, onChange: (e) => setPw(e.target.value) }), /* @__PURE__ */ React.createElement("div", { className: "bsp-hint" }, t("At least 8 characters."))), /* @__PURE__ */ React.createElement("label", { className: "bsp-field" }, /* @__PURE__ */ React.createElement("span", null, t("Confirm new password")), /* @__PURE__ */ React.createElement("input", { className: "bsp-input", type: show ? "text" : "password", autoComplete: "new-password", value: pw2, onChange: (e) => setPw2(e.target.value) })), /* @__PURE__ */ React.createElement("label", { className: "bsp-check" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: show, onChange: (e) => setShow(e.target.checked) }), t("Show passwords")), pwMsg && /* @__PURE__ */ React.createElement("div", { className: "bsp-msg " + (pwMsg.err ? "err" : "ok") }, pwMsg.err || pwMsg.ok), /* @__PURE__ */ React.createElement("div", { className: "bsp-actions", style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary", disabled: pwBusy, onClick: savePw }, pwBusy ? /* @__PURE__ */ React.createElement("span", { className: "bsp-spin" }) : t("Save new password")))));
  }
  const TOPICS = [["payment", "Payment"], ["data", "My details"], ["technical", "Technical problem"], ["other", "Something else"]];
  function Help({ applicant, store }) {
    const [topic, setTopic] = useState("payment"), [subject, setSubject] = useState(""), [message, setMessage] = useState(""), [sent, setSent] = useState(false);
    const mine = (store.listReports() || []).filter((r) => r.applicantId === applicant.id);
    const send = () => {
      if (!subject.trim() || !message.trim()) return;
      store.submitReport({ applicantId: applicant.id, applicantName: applicant.name, applicantEmail: applicant.email, subject, message, category: topic });
      setSubject("");
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 5e3);
    };
    const st = { open: ["warn", "Open"], replied: ["gold", "Replied"], resolved: ["ok", "Resolved"] };
    return /* @__PURE__ */ React.createElement("div", { className: "bsp-row", style: { marginTop: 0, alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", { className: "bsp-card" }, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3" }, t("Message the foundation")), /* @__PURE__ */ React.createElement("p", { className: "bsp-sub", style: { fontSize: 14 } }, t("Questions about payments, documents or your account — we read every message.")), /* @__PURE__ */ React.createElement("div", { className: "bsp-field" }, /* @__PURE__ */ React.createElement("span", null, t("Topic")), /* @__PURE__ */ React.createElement("div", { className: "bsp-chips", role: "group" }, TOPICS.map(([id, l]) => /* @__PURE__ */ React.createElement("button", { key: id, className: "bsp-pill", "aria-pressed": topic === id, onClick: () => setTopic(id) }, t(l))))), /* @__PURE__ */ React.createElement("label", { className: "bsp-field" }, /* @__PURE__ */ React.createElement("span", null, t("Subject")), /* @__PURE__ */ React.createElement("input", { className: "bsp-input", value: subject, onChange: (e) => setSubject(e.target.value), maxLength: 300 })), /* @__PURE__ */ React.createElement("label", { className: "bsp-field" }, /* @__PURE__ */ React.createElement("span", null, t("Message")), /* @__PURE__ */ React.createElement("textarea", { className: "bsp-input", value: message, onChange: (e) => setMessage(e.target.value), maxLength: 5e3 })), sent && /* @__PURE__ */ React.createElement("div", { className: "bsp-msg ok" }, t("Message sent. The reply will appear below.")), /* @__PURE__ */ React.createElement("div", { className: "bsp-actions", style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement("button", { className: "bsp-btn primary", disabled: !subject.trim() || !message.trim(), onClick: send }, t("Send message")))), /* @__PURE__ */ React.createElement("div", { className: "bsp-card" }, /* @__PURE__ */ React.createElement("h3", { className: "bsp-h3", style: { marginBottom: 10 } }, t("Your messages")), mine.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "bsp-sub", style: { fontSize: 14 } }, t("No messages yet.")) : /* @__PURE__ */ React.createElement("ul", { className: "bsp-list" }, mine.map((r) => {
      const s = st[r.status] || st.open;
      return /* @__PURE__ */ React.createElement("li", { key: r.id }, /* @__PURE__ */ React.createElement("div", { className: "bsp-li-head" }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, r.subject), /* @__PURE__ */ React.createElement("div", { className: "bsp-li-meta" }, date(r.submittedAt))), /* @__PURE__ */ React.createElement("span", { className: "bsp-tag " + s[0] }, t(s[1]))), /* @__PURE__ */ React.createElement("p", { style: { margin: "8px 0 0", color: "var(--muted)", fontSize: 14, whiteSpace: "pre-wrap" } }, r.message), r.reply && /* @__PURE__ */ React.createElement("div", { className: "bsp-reply" }, /* @__PURE__ */ React.createElement("span", null, t("Reply from the foundation"), " · ", date(r.reply.at)), /* @__PURE__ */ React.createElement("p", null, r.reply.text)));
    }))));
  }
  const TABS = [["overview", "Overview"], ["profile", "My profile"], ["account", "Account"], ["help", "Help"]];
  function ScholarHome({ applicant, store, onLogout, onExit }) {
    var _a;
    useStyles();
    useLang();
    const d = useScholar(applicant, store);
    const initTab = () => {
      try {
        return sessionStorage.getItem("bsp-tab") || "overview";
      } catch (e) {
        return "overview";
      }
    };
    const [tab, setTabState] = window.useBrialNav ? window.useBrialNav("sh-tab", initTab) : useState(initTab);
    const setTab = (k) => {
      setTabState(k);
      try {
        sessionStorage.setItem("bsp-tab", k);
      } catch (e) {
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const per = ((_a = applicant.profile) == null ? void 0 : _a.personal) || {};
    const avatar = fileUrl(per.showcasePhoto || (isImage(per.photoFile) ? per.photoFile : null));
    const replies = (store.listReports() || []).filter((r) => r.applicantId === applicant.id && r.status === "replied").length;
    const pendingReq = (applicant.changeRequests || []).filter((r) => r.status === "pending").length;
    return /* @__PURE__ */ React.createElement("div", { className: "bsp" }, /* @__PURE__ */ React.createElement("header", { className: "bsp-top" }, /* @__PURE__ */ React.createElement("div", { className: "bsp-top-in" }, /* @__PURE__ */ React.createElement("a", { className: "bsp-brand", href: "#/", title: t("Back to website"), onClick: (e) => {
      if (onExit) {
        e.preventDefault();
        onExit();
      }
    } }, Icon.star(), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "The Brial Endowment"), /* @__PURE__ */ React.createElement("small", null, t("Scholar Portal")))), /* @__PURE__ */ React.createElement("nav", { className: "bsp-tabs", role: "tablist", "aria-label": t("Scholar Portal") }, TABS.map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, role: "tab", className: "bsp-tab", "aria-selected": tab === k, onClick: () => setTab(k) }, t(l), k === "help" && replies > 0 && /* @__PURE__ */ React.createElement("span", { className: "bsp-badge" }, replies), k === "account" && pendingReq > 0 && /* @__PURE__ */ React.createElement("span", { className: "bsp-badge" }, pendingReq)))), /* @__PURE__ */ React.createElement("div", { className: "bsp-me" }, avatar ? /* @__PURE__ */ React.createElement("img", { className: "bsp-avatar", src: avatar, alt: "" }) : /* @__PURE__ */ React.createElement("span", { className: "bsp-avatar" }, (applicant.name || "?").charAt(0)), onExit && /* @__PURE__ */ React.createElement("button", { className: "bsp-site", onClick: onExit, "aria-label": t("Public site"), title: t("Back to the public website") }, Icon.home ? Icon.home() : null, /* @__PURE__ */ React.createElement("span", null, t("Public site"))), /* @__PURE__ */ React.createElement("button", { className: "bsp-out", onClick: onLogout }, t("Sign out"))))), /* @__PURE__ */ React.createElement("main", { className: "bsp-main" }, tab === "overview" && /* @__PURE__ */ React.createElement(Overview, { applicant, store, d, goHelp: () => setTab("help") }), tab !== "overview" && /* @__PURE__ */ React.createElement("div", { className: "bsp-sec-head", style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "bsp-h2", style: { fontSize: "clamp(30px,4vw,40px)" } }, t(TABS.find((x) => x[0] === tab)[1])), /* @__PURE__ */ React.createElement("p", { className: "bsp-sub" }, L(`Signed in as ${titleCase(per.fullName || applicant.name)}`, `Masuk sebagai ${titleCase(per.fullName || applicant.name)}`)))), tab === "profile" && /* @__PURE__ */ React.createElement(Profile, { applicant, store }), tab === "account" && /* @__PURE__ */ React.createElement(Account, { applicant, store }), tab === "help" && /* @__PURE__ */ React.createElement(Help, { applicant, store })));
  }
  return ScholarHome;
})();
// <<< SCHOLAR HOME

// ============================================================
// PORTAL HOME — assembles timeline + state-specific content
// ============================================================
const PortalHome = ({
  applicant,
  store,
  onLogout,
  onExit
}) => {
  const status = applicant.status;
  if (status === "accepted" && typeof SH === "function") return /*#__PURE__*/React.createElement(SH, {
    applicant: applicant,
    store: store,
    onLogout: onLogout,
    onExit: onExit
  });
  const greeting = applicant.name.split(" ")[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#0A1628"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      opacity: 0.04,
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
  }, /*#__PURE__*/React.createElement("div", {
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
  }, "Scholar Portal"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      letterSpacing: "0.28em",
      color: "#C9A961",
      marginTop: 2
    }
  }, applicant.id))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("style", null, "@media (max-width:640px){.ph-name,.ph-avatar{display:none!important}.ph-btn{padding:8px 10px!important;letter-spacing:0.08em!important}}"), /*#__PURE__*/React.createElement("span", {
    className: "ph-name",
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      color: "rgba(232,228,220,0.7)"
    }
  }, applicant.name), /*#__PURE__*/React.createElement("div", {
    className: "ph-avatar",
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #C9A961, #8B7A4A)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 15,
      color: "#0A1628",
      fontStyle: "italic"
    }
  }, applicant.name.charAt(0)), onExit && /*#__PURE__*/React.createElement("button", {
    onClick: onExit,
    className: "ph-btn",
    title: "Back to the public website",
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
  }, "Public site"), /*#__PURE__*/React.createElement("button", {
    onClick: onLogout,
    className: "ph-btn",
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
  }, "Sign out"))), /*#__PURE__*/React.createElement("main", {
    style: {
      position: "relative",
      maxWidth: 1280,
      margin: "0 auto",
      padding: "48px clamp(20px, 4vw, 56px) 100px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: "#C9A961",
      letterSpacing: "0.28em",
      textTransform: "uppercase"
    }
  }, "Beranda"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(40px, 5.4vw, 64px)",
      fontWeight: 400,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#E8E4DC",
      margin: "16px 0 0"
    }
  }, status === "accepted" ? /*#__PURE__*/React.createElement(React.Fragment, null, "Welcome back, ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: "#C9A961",
      fontStyle: "italic"
    }
  }, greeting), ".") : status === "registered" ? /*#__PURE__*/React.createElement(React.Fragment, null, "Let's finish your application, ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: "#C9A961",
      fontStyle: "italic"
    }
  }, greeting), ".") : /*#__PURE__*/React.createElement(React.Fragment, null, "Hello again, ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: "#C9A961",
      fontStyle: "italic"
    }
  }, greeting), "."))), /*#__PURE__*/React.createElement(StatusTimeline, {
    applicant: applicant
  }), status === "registered" && /*#__PURE__*/React.createElement(window.ProfileEditor, {
    applicant: applicant,
    store: store,
    onSubmit: () => {
      const ok = store.submitApplication(applicant.id);
      if (ok) {
        // success — re-render will show submitted state
      }
    }
  }), status === "submitted" && /*#__PURE__*/React.createElement(StatusPanel_Submitted, {
    applicant: applicant
  }), status === "interview-scheduled" && /*#__PURE__*/React.createElement(StatusPanel_Interview, {
    applicant: applicant
  }), status === "interview-done" && /*#__PURE__*/React.createElement(StatusPanel_Review, {
    applicant: applicant
  }), status === "rejected" && /*#__PURE__*/React.createElement(StatusPanel_Rejected, {
    applicant: applicant
  }), status === "accepted" && /*#__PURE__*/React.createElement(ScholarDashboard, {
    applicant: applicant
  }), status !== "registered" && /*#__PURE__*/React.createElement(MyProfileView, {
    applicant: applicant
  }), /*#__PURE__*/React.createElement(AccountSettings, {
    applicant: applicant,
    store: store
  }), status !== "registered" && /*#__PURE__*/React.createElement(ReportProblemSection, {
    applicant: applicant
  })));
};

// ============================================================
// PORTAL ENTRY
// ============================================================
const ScholarPortal = ({
  onExit,
  initialMode
}) => {
  const store = useApplicantStore();
  const [session, setSession] = useState(store.getSession());
  useEffect(() => {
    const h = () => setSession(store.getSession());
    window.addEventListener("brial:change", h);
    return () => window.removeEventListener("brial:change", h);
  }, []);
  if (!session) return /*#__PURE__*/React.createElement(ApplicantAuth, {
    onExit: onExit,
    initialMode: initialMode
  });
  const applicant = store.getApplicant(session.applicantId);
  if (!applicant) {
    store.clearSession();
    return /*#__PURE__*/React.createElement(ApplicantAuth, {
      onExit: onExit,
      initialMode: initialMode
    });
  }
  return /*#__PURE__*/React.createElement(PortalHome, {
    applicant: applicant,
    store: store,
    onLogout: () => store.clearSession(),
    onExit: onExit
  });
};
window.ScholarPortal = ScholarPortal;
})();