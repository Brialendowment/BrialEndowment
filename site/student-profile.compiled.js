(function(){
const {
  useState: useStateP,
  useEffect: useEffectP
} = React;

// Country list for the nation selector
const BRIAL_COUNTRIES = ["Indonesia", "Malaysia", "Singapore", "Thailand", "Vietnam", "Philippines", "Brunei", "Cambodia", "Laos", "Myanmar", "Timor-Leste", "India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Afghanistan", "Iran", "Iraq", "Turkey", "Saudi Arabia", "United Arab Emirates", "Qatar", "Egypt", "Morocco", "Jordan", "Lebanon", "Palestine", "China", "Japan", "South Korea", "Taiwan", "Hong Kong", "Mongolia", "Kazakhstan", "Uzbekistan", "Nigeria", "Kenya", "Ghana", "South Africa", "Ethiopia", "Tanzania", "Uganda", "Senegal", "Cameroon", "Sudan", "Algeria", "Tunisia", "United Kingdom", "Germany", "France", "Netherlands", "Switzerland", "Sweden", "Norway", "Denmark", "Italy", "Spain", "Portugal", "Belgium", "Ireland", "Austria", "Poland", "Czech Republic", "Greece", "Russia", "Ukraine", "United States", "Canada", "Mexico", "Brazil", "Argentina", "Chile", "Colombia", "Peru", "Ecuador", "Australia", "New Zealand", "Fiji", "Other"];

// ============================================================
// PROFILE EDITOR — Multi-section form for applicant
// Sections: Personal · High School · University · Essay
// ============================================================

const fieldLabelStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  color: "rgba(232,228,220,0.55)",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  marginBottom: 8
};
const textInputStyle = {
  width: "100%",
  padding: "12px 0",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(232,228,220,0.25)",
  color: "#E8E4DC",
  fontSize: 16,
  fontFamily: "'Cormorant Garamond', serif",
  outline: "none"
};
const monoInputStyle = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(232,228,220,0.04)",
  border: "1px solid rgba(232,228,220,0.15)",
  color: "#E8E4DC",
  fontSize: 14,
  fontFamily: "'JetBrains Mono', monospace",
  outline: "none"
};
const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: fieldLabelStyle
}, label), /*#__PURE__*/React.createElement("input", {
  type: type,
  value: value || "",
  onChange: e => onChange(e.target.value),
  placeholder: placeholder,
  style: textInputStyle
}));

// File "upload" — validates type, stores the actual File in IndexedDB via BrialFiles
const FileField = ({
  label,
  file,
  onChange,
  accept,
  hint,
  imageOnly,
  isPublic
}) => {
  const [uploading, setUploading] = useStateP(false);
  const [error, setError] = useStateP(null);
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
    if (imageOnly && !(/^image\/(jpeg|jpg|png|webp)$/i.test(f.type || "") && /\.(jpe?g|png|webp)$/i.test(f.name || ""))) {
      setError("Please upload a photo (JPG, JPEG, PNG or WebP), not a PDF or other document.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const meta = await window.BrialFiles.put(f, isPublic ? { public: true } : undefined);
      onChange(meta);
    } catch (err) {
      console.error("upload failed", err);
      setError("Upload failed: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };
  const open = e => {
    e.preventDefault();
    e.stopPropagation();
    window.BrialFiles.open(file);
  };
  const acceptAttr = accept || (imageOnly ? ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" : window.BrialFiles.allowedAccept);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: fieldLabelStyle
  }, label), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "18px 20px",
      border: `1px dashed ${error ? "rgba(229,134,134,0.5)" : file ? "rgba(134,229,167,0.45)" : "rgba(201,169,97,0.4)"}`,
      background: error ? "rgba(229,134,134,0.06)" : file ? "rgba(134,229,167,0.05)" : "rgba(201,169,97,0.04)",
      cursor: uploading ? "wait" : "pointer",
      transition: "all 0.2s"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: acceptAttr,
    onChange: handle,
    disabled: uploading,
    style: {
      display: "none"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: "36",
    height: "44",
    viewBox: "0 0 32 40",
    fill: "none",
    stroke: file ? "#86E5A7" : "#C9A961",
    strokeWidth: "1"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 1 L22 1 L31 10 L31 39 L4 39 Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 1 L22 10 L31 10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    y1: "20",
    x2: "26",
    y2: "20"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    y1: "26",
    x2: "26",
    y2: "26"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    y1: "32",
    x2: "20",
    y2: "32"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 18,
      color: file ? "#86E5A7" : "rgba(232,228,220,0.75)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, uploading ? "Uploading…" : file ? file.name : "Click to select file"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.45)",
      marginTop: 4,
      letterSpacing: "0.1em"
    }
  }, file ? `${file.size} MB · uploaded` : hint || "PDF, PNG, JPG, WebP · max 2MB")), file && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: open,
    style: {
      padding: "6px 12px",
      background: "transparent",
      border: "1px solid rgba(134,229,167,0.4)",
      color: "#86E5A7",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "Open \u2197"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#86E5A7",
      fontFamily: "serif",
      fontSize: 22
    }
  }, "\u2713"))), error && /*#__PURE__*/React.createElement("div", {
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
  }, error));
};

// ============================================================
// SECTION: PERSONAL
// ============================================================
const SectionPersonal = ({
  applicant,
  store
}) => {
  const p = applicant.profile.personal;
  const update = patch => store.updateProfile(applicant.id, "personal", patch);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Full legal name",
    value: p.fullName,
    onChange: v => update({
      fullName: v
    }),
    placeholder: "As shown on national ID"
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Date of birth",
    type: "date",
    value: p.dateOfBirth,
    onChange: v => update({
      dateOfBirth: v
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Phone number",
    value: p.phone,
    onChange: v => update({
      phone: v
    }),
    placeholder: "+62 812 3456 7890"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: fieldLabelStyle
  }, "Country / nation"), /*#__PURE__*/React.createElement("select", {
    value: p.country || "",
    onChange: e => update({
      country: e.target.value
    }),
    style: {
      width: "100%",
      padding: "12px 0",
      background: "transparent",
      border: "none",
      borderBottom: "1px solid rgba(232,228,220,0.25)",
      color: p.country ? "#E8E4DC" : "rgba(232,228,220,0.4)",
      fontSize: 16,
      fontFamily: "'Cormorant Garamond', serif",
      outline: "none"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    style: {
      background: "#0A1628"
    }
  }, "Select your country\u2026"), BRIAL_COUNTRIES.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c,
    style: {
      background: "#0A1628",
      color: "#E8E4DC"
    }
  }, c))))), /*#__PURE__*/React.createElement(TextField, {
    label: "Full address",
    value: p.address,
    onChange: v => update({
      address: v
    }),
    placeholder: "Street, city, postal code"
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "National ID / Passport number",
    value: p.nationalId,
    onChange: v => update({
      nationalId: v
    }),
    placeholder: "NIK / Passport"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bsp-photo-pair",
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(FileField, {
    label: "Profile photo",
    file: p.showcasePhoto,
    onChange: f => update({
      showcasePhoto: f
    }),
    imageOnly: true,
    isPublic: true,
    hint: "A recent, clear photo of your face \xB7 JPG/PNG/WebP \xB7 max 2MB"
  }), /*#__PURE__*/React.createElement(FileField, {
    label: "ID card / Passport",
    file: p.photoFile,
    onChange: f => update({
      photoFile: f
    }),
    hint: "Photo or scan of your KTP or passport, with your face, full name and number readable \xB7 JPG/PNG/WebP/PDF \xB7 max 2MB"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "-8px 0 0",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.6,
      color: "rgba(232,228,220,0.65)"
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#C9A961",
      fontWeight: 600
    }
  }, "Profile photo"), " is shown on the public Scholars page if you are awarded, so do not upload your ID card there. ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#C9A961",
      fontWeight: 600
    }
  }, "ID card / passport"), " stays private: only the endowment sees it to verify your identity, and it is never published."));
};

// ============================================================
// SECTION: HIGH SCHOOL
// ============================================================
const SectionHighSchool = ({
  applicant,
  store
}) => {
  const hs = applicant.profile.highSchool;
  const update = patch => store.updateProfile(applicant.id, "highSchool", patch);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "High school name",
    value: hs.schoolName,
    onChange: v => update({
      schoolName: v
    }),
    placeholder: "SMA Negeri 1 Jakarta"
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Graduation year",
    value: hs.graduationYear,
    onChange: v => update({
      graduationYear: v
    }),
    placeholder: "2020"
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Final cumulative GPA",
    value: hs.finalGPA,
    onChange: v => update({
      finalGPA: v
    }),
    placeholder: "92.5 / 100"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: fieldLabelStyle
  }, "Subject grades \xB7 average across all semesters"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.55)",
      margin: "8px 0 12px"
    }
  }, "Add the subjects you took (IPA, IPS, Agama, Bahasa, or whatever applied to you). For each, enter the ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, "average grade across all your semesters"), ". Minimum 3 subjects required."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      border: "1px solid rgba(232,228,220,0.12)",
      background: "rgba(232,228,220,0.02)"
    }
  }, hs.subjects.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px 18px",
      textAlign: "center",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 17,
      fontStyle: "italic",
      color: "rgba(232,228,220,0.45)"
    }
  }, "No subjects added yet. Click below to add your first.") : hs.subjects.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 140px 60px",
      borderBottom: i < hs.subjects.length - 1 ? "1px solid rgba(232,228,220,0.08)" : "none",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: s.name,
    onChange: e => store.updateSubjectGrade(applicant.id, i, {
      name: e.target.value
    }),
    placeholder: i === 0 ? "e.g. Matematika" : i === 1 ? "e.g. Bahasa Indonesia" : "Subject name",
    style: {
      background: "transparent",
      border: "none",
      color: "#E8E4DC",
      padding: "14px 18px",
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 17,
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: s.grade,
    onChange: e => store.updateSubjectGrade(applicant.id, i, {
      grade: e.target.value
    }),
    placeholder: "Avg",
    title: "Average grade across all semesters",
    style: {
      background: "rgba(201,169,97,0.04)",
      border: "none",
      borderLeft: "1px solid rgba(232,228,220,0.08)",
      color: "#C9A961",
      padding: "14px 18px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 14,
      outline: "none",
      textAlign: "center"
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => store.removeSubject(applicant.id, i),
    title: "Remove this subject",
    style: {
      background: "transparent",
      color: "rgba(229,134,134,0.7)",
      border: "none",
      borderLeft: "1px solid rgba(232,228,220,0.08)",
      cursor: "pointer",
      padding: "14px 0",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 16,
      letterSpacing: "0.08em"
    }
  }, "\xD7")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 12,
      gap: 14,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => store.addSubject(applicant.id),
    style: {
      background: "transparent",
      color: "#C9A961",
      border: "1px solid rgba(201,169,97,0.4)",
      padding: "8px 14px",
      cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    }
  }, "+ Add subject"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: hs.subjects.length >= 3 ? "rgba(134,229,167,0.7)" : "rgba(229,134,134,0.65)",
      letterSpacing: "0.1em"
    }
  }, hs.subjects.length, " subject", hs.subjects.length === 1 ? "" : "s", " added", hs.subjects.length < 3 ? ` · minimum 3` : ` ✓`))), /*#__PURE__*/React.createElement(FileField, {
    label: "Upload high school transcript (rapor SMA)",
    file: hs.raporFile,
    onChange: f => update({
      raporFile: f
    }),
    hint: "Scanned PDF of your full rapor, all semesters \xB7 max 10MB"
  }));
};

// ============================================================
// SECTION: UNIVERSITY
// ============================================================
const SectionUniversity = ({
  applicant,
  store
}) => {
  const u = applicant.profile.university;
  const update = patch => store.updateProfile(applicant.id, "university", patch);
  const LEVELS = store.DEGREE_LEVELS;
  const currentLevel = LEVELS[u.degreeLevel] || LEVELS.S1;
  const isHS = u.degreeLevel === "SMA";

  // Clamp currentSemester if it exceeds the new total
  const onLevelChange = id => {
    const newLevel = LEVELS[id];
    const cur = parseInt(u.currentSemester, 10);
    const patch = {
      degreeLevel: id
    };
    if (!isNaN(cur) && cur > newLevel.totalSemesters) patch.currentSemester = String(newLevel.totalSemesters);
    update(patch);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: fieldLabelStyle
  }, "Education level (jenjang)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 8
    }
  }, Object.values(LEVELS).map(lvl => {
    const active = u.degreeLevel === lvl.id;
    return /*#__PURE__*/React.createElement("button", {
      key: lvl.id,
      type: "button",
      onClick: () => onLevelChange(lvl.id),
      style: {
        padding: "14px 12px",
        cursor: "pointer",
        background: active ? "rgba(201,169,97,0.12)" : "rgba(232,228,220,0.03)",
        color: active ? "#C9A961" : "rgba(232,228,220,0.75)",
        border: `1px solid ${active ? "#C9A961" : "rgba(232,228,220,0.15)"}`,
        fontFamily: "inherit",
        textAlign: "center",
        transition: "all 0.2s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 18,
        lineHeight: 1.1,
        letterSpacing: "-0.01em"
      }
    }, lvl.label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.18em",
        marginTop: 4,
        color: active ? "#C9A961" : "rgba(232,228,220,0.5)"
      }
    }, lvl.sub));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: isHS ? "School name" : "University name",
    value: u.name,
    onChange: v => update({
      name: v
    }),
    placeholder: isHS ? "SMA Negeri 3 Jakarta" : "Universitas Indonesia"
  }), /*#__PURE__*/React.createElement(TextField, {
    label: isHS ? "Track / jurusan" : "Program / major",
    value: u.program,
    onChange: v => update({
      program: v
    }),
    placeholder: isHS ? "IPA / IPS / Bahasa" : "S1 Teknik Informatika"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: `Current semester (1–${currentLevel.totalSemesters})`,
    type: "number",
    value: u.currentSemester,
    onChange: v => {
      const n = parseInt(v, 10);
      if (v === "" || n >= 1 && n <= currentLevel.totalSemesters) {
        update({
          currentSemester: v
        });
      }
    },
    placeholder: "3"
  }), /*#__PURE__*/React.createElement(TextField, {
    label: isHS ? "Current GPA / rata-rata" : "Current GPA (IPK)",
    value: u.currentGPA,
    onChange: v => update({
      currentGPA: v
    }),
    placeholder: isHS ? "88 / 100" : "3.85 / 4.00"
  }), /*#__PURE__*/React.createElement(TextField, {
    label: isHS ? "Tuition per semester (USD)" : "UKT per semester (USD)",
    type: "number",
    value: u.uktPerSemester,
    onChange: v => update({
      uktPerSemester: v
    }),
    placeholder: "2500"
  })), /*#__PURE__*/React.createElement(FileField, {
    label: isHS ? "Upload student ID / kartu pelajar" : "Upload student ID / kartu pelajar",
    file: u.studentCardFile,
    onChange: f => update({
      studentCardFile: f
    }),
    hint: "A clear photo or PDF of your active student card \xB7 max 10MB"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 18px",
      background: "rgba(79,209,197,0.05)",
      border: "1px solid rgba(79,209,197,0.18)"
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
  }, "Award structure \xB7 ", currentLevel.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.7)"
    }
  }, "Your award runs for ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#E8E4DC"
    }
  }, currentLevel.totalSemesters, " semesters total"), ". Once accepted, the endowment underwrites every remaining semester after your current one, wired in USDC directly to you after each invoice upload.")));
};

// ============================================================
// SECTION: ESSAY
// ============================================================
const SectionEssay = ({
  applicant,
  store
}) => {
  const essay = applicant.profile.essay || "";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: fieldLabelStyle
  }, "Research question / motivation"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "'Manrope', sans-serif",
      fontSize: 13,
      lineHeight: 1.65,
      color: "rgba(232,228,220,0.6)",
      margin: "0 0 14px"
    }
  }, "In your own words: what question are you trying to answer with this degree? Why does it matter? What will you do with the answer? Minimum 100 characters."), /*#__PURE__*/React.createElement("textarea", {
    value: essay,
    onChange: e => store.updateProfile(applicant.id, "essay", e.target.value),
    placeholder: "Begin here\u2026",
    style: {
      width: "100%",
      minHeight: 260,
      resize: "vertical",
      background: "rgba(232,228,220,0.04)",
      border: "1px solid rgba(232,228,220,0.15)",
      color: "#E8E4DC",
      padding: 18,
      fontSize: 16,
      fontFamily: "'Cormorant Garamond', serif",
      lineHeight: 1.7,
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(232,228,220,0.5)",
      marginTop: 8,
      letterSpacing: "0.1em"
    }
  }, /*#__PURE__*/React.createElement("span", null, essay.length, " characters \xB7 ", essay.trim().split(/\s+/).filter(Boolean).length, " words"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: essay.length >= 100 ? "#86E5A7" : "#C9A961"
    }
  }, essay.length >= 100 ? "✓ Minimum reached" : `${100 - essay.length} more to minimum`))));
};

// ============================================================
// MAIN: PROFILE EDITOR with section nav
// ============================================================
const ProfileEditor = ({
  applicant,
  store,
  onSubmit,
  hideSubmit
}) => {
  // each section is a history entry: the back swipe returns to the previous section
  const [section, setSection] = window.useBrialNav ? window.useBrialNav("ap-section", "personal") : useStateP("personal");
  const progress = store.sectionProgress(applicant);
  const complete = store.isProfileComplete(applicant);
  const sections = [{
    id: "personal",
    label: "Personal data",
    sub: "Identitas pribadi",
    progress: progress.personal
  }, {
    id: "highschool",
    label: "High school",
    sub: "Rapor SMA + nilai",
    progress: progress.hs
  }, {
    id: "university",
    label: "University",
    sub: "Kampus, IPK, UKT, kartu",
    progress: progress.uni
  }, {
    id: "essay",
    label: "Research essay",
    sub: "Motivasi & pertanyaan",
    progress: progress.essay
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "280px 1fr",
      gap: 32,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      position: "sticky",
      top: 96,
      background: "rgba(20,36,66,0.4)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(201,169,97,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 22px",
      borderBottom: "1px solid rgba(201,169,97,0.12)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "#C9A961",
      letterSpacing: "0.22em",
      textTransform: "uppercase"
    }
  }, "Application Sections"), sections.map(s => {
    const active = section === s.id;
    const done = s.progress >= 1;
    return /*#__PURE__*/React.createElement("button", {
      key: s.id,
      onClick: () => setSection(s.id),
      style: {
        width: "100%",
        textAlign: "left",
        padding: "16px 22px",
        background: active ? "rgba(201,169,97,0.08)" : "transparent",
        borderLeft: active ? "2px solid #C9A961" : "2px solid transparent",
        borderBottom: "1px solid rgba(201,169,97,0.08)",
        borderRight: "none",
        borderTop: "none",
        cursor: "pointer",
        color: "#E8E4DC",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: done ? "#86E5A7" : active ? "rgba(201,169,97,0.2)" : "transparent",
        border: `1.5px solid ${done ? "#86E5A7" : active ? "#C9A961" : "rgba(232,228,220,0.25)"}`,
        color: done ? "#0A1628" : "#C9A961",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontFamily: "'Manrope', sans-serif",
        fontWeight: 600
      }
    }, done ? "✓" : ""), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 17,
        fontWeight: active ? 500 : 400
      }
    }, s.label)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "rgba(232,228,220,0.5)",
        letterSpacing: "0.08em",
        marginLeft: 28
      }
    }, s.sub, " \xB7 ", Math.round(s.progress * 100), "%"));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22
    }
  }, hideSubmit ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: complete ? "rgba(134,229,167,0.8)" : "rgba(201,169,97,0.8)",
      letterSpacing: "0.1em",
      lineHeight: 1.6,
      textAlign: "center"
    }
  }, complete ? "✓ All sections complete" : "Some sections incomplete") : /*#__PURE__*/React.createElement("button", {
    onClick: onSubmit,
    disabled: !complete,
    style: {
      width: "100%",
      padding: "14px 0",
      background: complete ? "#C9A961" : "rgba(201,169,97,0.2)",
      color: complete ? "#0A1628" : "rgba(232,228,220,0.5)",
      border: "none",
      cursor: complete ? "pointer" : "not-allowed",
      fontFamily: "'Manrope', sans-serif",
      fontSize: 12,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, complete ? "Submit application →" : "Complete all sections"), !complete && !hideSubmit && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: "rgba(232,228,220,0.45)",
      marginTop: 10,
      letterSpacing: "0.1em",
      lineHeight: 1.5
    }
  }, "Once submitted, your application enters administrative review."))), /*#__PURE__*/React.createElement("main", {
    style: {
      background: "rgba(20,36,66,0.4)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(201,169,97,0.12)",
      padding: "40px 44px"
    }
  }, section === "personal" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionHeader, {
    title: "Personal data",
    sub: "The foundation needs this to verify identity and process disbursement. All fields are confidential."
  }), /*#__PURE__*/React.createElement(SectionPersonal, {
    applicant: applicant,
    store: store
  })), section === "highschool" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionHeader, {
    title: "High school record",
    sub: "Your secondary education results: the rapor SMA is the official transcript of your last three years."
  }), /*#__PURE__*/React.createElement(SectionHighSchool, {
    applicant: applicant,
    store: store
  })), section === "university" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionHeader, {
    title: "Current university",
    sub: "The institution you are studying at now. Your UKT per semester is the tuition the endowment will underwrite."
  }), /*#__PURE__*/React.createElement(SectionUniversity, {
    applicant: applicant,
    store: store
  })), section === "essay" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionHeader, {
    title: "Research essay",
    sub: "The single most important section. Reviewers read this first."
  }), /*#__PURE__*/React.createElement(SectionEssay, {
    applicant: applicant,
    store: store
  }))));
};
const SectionHeader = ({
  title,
  sub
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    marginBottom: 36
  }
}, /*#__PURE__*/React.createElement("h2", {
  style: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 38,
    fontWeight: 400,
    color: "#E8E4DC",
    letterSpacing: "-0.01em",
    margin: 0,
    lineHeight: 1.1
  }
}, title), /*#__PURE__*/React.createElement("p", {
  style: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 14,
    lineHeight: 1.65,
    color: "rgba(232,228,220,0.55)",
    margin: "10px 0 0",
    maxWidth: 620
  }
}, sub), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 24,
    height: 1,
    background: "linear-gradient(90deg, rgba(201,169,97,0.4), transparent)"
  }
}));
window.ProfileEditor = ProfileEditor;
})();