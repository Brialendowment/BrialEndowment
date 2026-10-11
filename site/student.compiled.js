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
  const [mode, setMode] = useState(initialMode); // "signup" | "signin"
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
      const meta = await window.BrialFiles.put(f);
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

// ============================================================
// PORTAL HOME — assembles timeline + state-specific content
// ============================================================
const PortalHome = ({
  applicant,
  store,
  onLogout
}) => {
  const status = applicant.status;
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
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      color: "rgba(232,228,220,0.7)"
    }
  }, applicant.name), /*#__PURE__*/React.createElement("div", {
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
  }, applicant.name.charAt(0)), /*#__PURE__*/React.createElement("button", {
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
    onLogout: () => store.clearSession()
  });
};
window.ScholarPortal = ScholarPortal;
})();