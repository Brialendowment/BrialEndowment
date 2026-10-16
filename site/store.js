// ============================================================
// BRIAL STORE — Supabase backend + localStorage cache
//
// Reads stay synchronous (return cache) so components don't need
// to change. Writes hit Supabase first, then update cache, then
// dispatch "brial:change". Realtime subscription keeps every
// browser in sync.
//
// Founder auth: via Supabase Auth (no credentials in code). The founder's
//   browser reads/writes the tables directly with the AUTHENTICATED client;
//   database RLS only lets the allow-listed founder account through.
// Everyone else never touches the tables: visitors get a sanitized snapshot
//   (be_public_snapshot) and scholars sign in, read and save through
//   server-side RPCs with a session token (be_applicant_*). Passwords are
//   verified on the server and never sent to other browsers.
// ============================================================

// ============================================================
// Clipboard helper — kept identical so all existing call sites work
// ============================================================
function copyToClipboard(text) {
  return new Promise((resolve) => {
    const str = String(text == null ? "" : text);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(str).then(
        () => resolve(true),
        () => { const ok = legacyCopy(str); if (!ok) showCopyFallback(str); resolve(ok); }
      );
      return;
    }
    const ok = legacyCopy(str);
    if (!ok) showCopyFallback(str);
    resolve(ok);
  });
}
function legacyCopy(str) {
  try {
    const ta = document.createElement("textarea");
    ta.value = str; ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;";
    document.body.appendChild(ta);
    ta.focus(); ta.select(); ta.setSelectionRange(0, str.length);
    const ok = document.execCommand && document.execCommand("copy");
    document.body.removeChild(ta);
    return !!ok;
  } catch (e) { return false; }
}
function showCopyFallback(str) {
  const existing = document.getElementById("__brial-copy-fallback");
  if (existing) existing.remove();
  const root = document.createElement("div");
  root.id = "__brial-copy-fallback";
  root.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(6,14,28,0.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:32px;font-family:'Manrope',sans-serif;";
  root.innerHTML = "<div style=\"width:100%;max-width:520px;background:linear-gradient(180deg,#142442,#0A1628);border:1px solid rgba(201,169,97,0.3);padding:32px;\">" +
    "<div style=\"font-family:'JetBrains Mono',monospace;font-size:10px;color:#C9A961;letter-spacing:0.22em;text-transform:uppercase;\">Manual Copy Required</div>" +
    "<div style=\"font-family:'Cormorant Garamond',serif;font-size:24px;color:#E8E4DC;margin-top:12px;line-height:1.2;\">Your browser blocked automatic copy.</div>" +
    "<div style=\"font-family:'Manrope',sans-serif;font-size:13px;color:rgba(232,228,220,0.65);margin-top:10px;line-height:1.55;\">Select the text below and press <strong style=\"color:#E8E4DC\">Ctrl+C</strong> (or <strong style=\"color:#E8E4DC\">⌘+C</strong> on Mac).</div>" +
    "<textarea readonly style=\"width:100%;margin-top:20px;padding:14px;background:rgba(10,22,40,0.5);border:1px solid rgba(201,169,97,0.3);color:#C9A961;font-family:'JetBrains Mono',monospace;font-size:14px;outline:none;resize:none;min-height:80px;\">" + str.replace(/[<>&]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[c])) + "</textarea>" +
    "<button id=\"__brial-copy-close\" style=\"margin-top:20px;width:100%;padding:14px 0;background:#C9A961;color:#0A1628;border:none;cursor:pointer;font-family:'Manrope',sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;\">Done</button>" +
    "</div>";
  document.body.appendChild(root);
  const ta = root.querySelector("textarea");
  ta.focus(); ta.select();
  const close = () => root.remove();
  root.querySelector("#__brial-copy-close").onclick = close;
  root.onclick = e => { if (e.target === root) close(); };
}
window.BrialClipboard = { copy: copyToClipboard };

// ============================================================
// In-page history — window.useBrialNav(key, initial)
// A React state hook whose changes become browser history entries, so the
// phone's back swipe and the browser's Back button step back through screens
// inside a portal (pillar → tab → record) instead of leaving it. The URL is
// unchanged; values live in history.state under "nav:<key>" next to the
// app-level `brialView`. Several changes in the same tick make ONE entry.
// set(v, { replace: true }) updates the current entry without adding one.
// ============================================================
(function () {
  var pending = null;
  function flush() {
    var p = pending; pending = null;
    if (!p) return;
    try { history.pushState(Object.assign({}, history.state || {}, p), "", location.href); } catch (e) {}
  }
  function readKey(key, fallback) {
    var s = history.state;
    if (s && Object.prototype.hasOwnProperty.call(s, "nav:" + key)) return s["nav:" + key];
    return typeof fallback === "function" ? fallback() : fallback;
  }
  window.useBrialNav = function (key, initial) {
    var R = window.React;
    var initRef = R.useRef(initial);
    var st = R.useState(function () { return readKey(key, initial); });
    var ref = R.useRef(st[0]);
    ref.current = st[0];
    R.useEffect(function () {
      // Record the starting value in the current entry, so stepping back to
      // this entry later restores it (not a newer default).
      var s0 = history.state;
      if (!(s0 && Object.prototype.hasOwnProperty.call(s0, "nav:" + key))) {
        if (pending) pending["nav:" + key] = ref.current;
        else {
          var e0 = {}; e0["nav:" + key] = ref.current;
          try { history.replaceState(Object.assign({}, s0 || {}, e0), "", location.href); } catch (e) {}
        }
      }
      var on = function () { var v = readKey(key, initRef.current); ref.current = v; st[1](v); };
      window.addEventListener("popstate", on);
      return function () { window.removeEventListener("popstate", on); };
    }, [key]);
    var set = R.useCallback(function (v, opts) {
      var nv = typeof v === "function" ? v(ref.current) : v;
      if (nv === ref.current) return;
      ref.current = nv;
      st[1](nv);
      var entry = {}; entry["nav:" + key] = nv;
      if (opts && opts.replace) {
        // an entry is about to be pushed this tick: ride along with it
        if (pending) { pending["nav:" + key] = nv; return; }
        try { history.replaceState(Object.assign({}, history.state || {}, entry), "", location.href); } catch (e) {}
        return;
      }
      if (!pending) { pending = {}; Promise.resolve().then(flush); }
      Object.assign(pending, entry);
    }, [key]);
    return [st[0], set];
  };
})();

// ============================================================
// Brial Store
// ============================================================
(function () {
  const SESSION_KEY = "brial.session.v7";
  const FOUNDER_SESSION_KEY = "brial.founder.v7";
  const CACHE_APPLICANTS = "brial.cache.applicants.v8";
  const CACHE_DONATIONS = "brial.cache.donations.v8";
  const CACHE_REPORTS = "brial.cache.reports.v8";
  const CACHE_MODE = "brial.cache.mode.v8";          // "founder" | "public"
  const TOKEN_KEY = "brial.applicantToken.v1";       // scholar session token
  // Old caches held every applicant's full record (NIK, phone, passwords) in
  // every visitor's browser. Remove them on sight.
  try {
    ["brial.cache.applicants.v7", "brial.cache.donations.v7", "brial.cache.reports.v7"]
      .forEach(k => localStorage.removeItem(k));
  } catch (e) { /* ignore */ }

  const WALLET = {
    address: "0x51b3c34464349619b6dAFb13268730d5CFa82d5F",
    network: "ERC-20",
    asset: "USDT (Tether)",
    confirmations: 12,
  };
  const FOUNDER = { name: "Brial" };

  // Default e-books shown until the founder edits the catalog.
  const DEFAULT_EBOOKS = [
    {
      id: "en", lang: "English", langCode: "EN",
      title: "Scholarship Hunter", subtitle: "The Ultimate Guide",
      accent: "#C9A961", cover: "https://sdlrjqdbxxzddgivnjws.supabase.co/storage/v1/object/public/brial-files/uploads/f_mr2cboz8_zqnd3c0.jpg",
      link: "https://lynk.id/brial/wqogzkdkvwml",
      getLabel: "Get the E-Book",
      supportNote: "A portion of every sale supports Brial Endowment scholarships.",
      desc: "A step-by-step master guide for scholarship hunters worldwide — from finding the right programs and crafting a winning motivation letter, to acing interviews and securing full funding abroad. Written for ambitious students who refuse to let cost decide their future.",
      points: [
        "Find and shortlist the right global scholarships",
        "Write essays & motivation letters that win",
        "Master interviews and documentation",
        "Proven strategies from successful awardees",
      ],
    },
    {
      id: "id", lang: "Bahasa Indonesia", langCode: "ID",
      title: "Panduan Beasiswa Luar Negeri", subtitle: "126 Peluang Menuju Dunia Global",
      accent: "#4FD1C5", cover: "https://sdlrjqdbxxzddgivnjws.supabase.co/storage/v1/object/public/brial-files/uploads/f_mr2ccjx0_vwwgkw7.jpg",
      link: "https://lynk.id/brial/dj014gld156l",
      getLabel: "Dapatkan E-Book",
      supportNote: "Sebagian dari setiap penjualan digunakan untuk mendukung beasiswa Brial Endowment.",
      desc: "Panduan lengkap berbahasa Indonesia yang merangkum 126 peluang beasiswa ke luar negeri — beserta strategi mendaftar, menyiapkan dokumen, menulis esai, dan lolos seleksi. Disusun khusus untuk pelajar dan mahasiswa Indonesia yang bercita-cita menembus kampus dunia.",
      points: [
        "126 peluang beasiswa luar negeri terkurasi",
        "Strategi pendaftaran langkah demi langkah",
        "Tips menulis esai & motivation letter",
        "Persiapan dokumen dan wawancara",
      ],
    },
    {
      id: "fr", lang: "Français", langCode: "FR",
      title: "Bourses d'Études à l'Étranger", subtitle: "Le Guide Complet",
      accent: "#C98A61", cover: "https://sdlrjqdbxxzddgivnjws.supabase.co/storage/v1/object/public/brial-files/uploads/f_mr2cdkqz_tvdrv46.jpg",
      link: "https://lynk.id/brial/wwzw8kx2z6y6",
      getLabel: "Obtenir le livre",
      supportNote: "Une partie de chaque vente soutient les bourses de la Brial Endowment.",
      desc: "Un guide complet en français pour trouver, préparer et obtenir une bourse d'études à l'étranger — de la sélection des programmes à la lettre de motivation, jusqu'à l'entretien et le financement intégral. Pour les étudiants francophones déterminés à étudier dans le monde entier.",
      points: [
        "Trouver les bourses internationales adaptées",
        "Rédiger une lettre de motivation convaincante",
        "Réussir l'entretien et le dossier",
        "Stratégies éprouvées des lauréats",
      ],
    },
  ];

  const now = () => new Date().toISOString();

  const DEGREE_LEVELS = {
    SMA: { id: "SMA", label: "SMA / High School",  totalSemesters: 6, sub: "6 semesters" },
    D3:  { id: "D3",  label: "D3 / Vocational",    totalSemesters: 6, sub: "6 semesters" },
    S1:  { id: "S1",  label: "S1 / D4 / Bachelor", totalSemesters: 8, sub: "8 semesters" },
    S2:  { id: "S2",  label: "S2 / Master",        totalSemesters: 4, sub: "4 semesters" },
  };

  const emptyProfile = () => ({
    personal: {
      fullName: "", dateOfBirth: "", phone: "", country: "", address: "", nationalId: "",
      photoFile: null,
    },
    highSchool: {
      schoolName: "", graduationYear: "", finalGPA: "",
      subjects: [],
      raporFile: null,
    },
    university: {
      name: "", program: "", degreeLevel: "S1", currentSemester: "",
      currentGPA: "", uktPerSemester: "", studentCardFile: null,
    },
    essay: "",
  });

  function makeSemestersForApplicant(applicant) {
    const lvl = DEGREE_LEVELS[applicant.profile.university.degreeLevel] || DEGREE_LEVELS.S1;
    const total = lvl.totalSemesters;
    const cur = parseInt(applicant.profile.university.currentSemester, 10) || 0;
    const startSem = Math.max(1, cur + 1);
    const semesters = [];
    for (let s = startSem; s <= total; s++) {
      semesters.push({
        id: `SEM${s}`, label: `Semester ${s}`, number: s,
        status: s === startSem ? "current" : "upcoming",
      });
    }
    return semesters;
  }

  // ---------- Local cache (so component reads stay sync) ----------
  let _applicants = [];
  let _donations = [];
  let _reports = [];

  function loadCache() {
    try {
      const ra = localStorage.getItem(CACHE_APPLICANTS);
      const rd = localStorage.getItem(CACHE_DONATIONS);
      const rr = localStorage.getItem(CACHE_REPORTS);
      if (ra) _applicants = JSON.parse(ra);
      if (rd) _donations = JSON.parse(rd);
      if (rr) _reports = JSON.parse(rr);
    } catch (e) { /* ignore */ }
  }
  function saveCache() {
    try {
      localStorage.setItem(CACHE_APPLICANTS, JSON.stringify(_applicants));
      localStorage.setItem(CACHE_DONATIONS, JSON.stringify(_donations));
      localStorage.setItem(CACHE_REPORTS, JSON.stringify(_reports));
      localStorage.setItem(CACHE_MODE, _founderMode ? "founder" : "public");
    } catch (e) { /* quota – ignore */ }
  }
  function wipeCache() {
    _applicants = []; _donations = []; _reports = [];
    try {
      [CACHE_APPLICANTS, CACHE_DONATIONS, CACHE_REPORTS, CACHE_MODE].forEach(k => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
  }
  function notify(detail = {}) {
    window.dispatchEvent(new CustomEvent("brial:change", { detail }));
  }

  // ----- Photo warmer: prefetch gallery + catalog images right after data
  // sync so they're already in browser cache when their section renders. -----
  const _warmedUrls = new Set();
  function collectPhotoUrls() {
    const urls = [];
    const pub = p => (window.brialSupabase ? window.brialSupabase.publicUrl(p) : null);
    try {
      (Store.listEbooks() || []).forEach(b => { if (b.cover) urls.push(b.cover); });
    } catch (e) {}
    try {
      [Store.getWorship(), Store.getWater(), Store.getPillarContent("hospitals"), Store.getPillarContent("schools"), Store.getPillarContent("livestock"), Store.getPillarContent("infra")].forEach(c => (c.articles || []).forEach(a => { if (a.photo && (a.photo.url || a.photo.path)) urls.push(a.photo.url || pub(a.photo.path)); }));
    } catch (e) {}
    try {
      (_applicants || []).filter(a => a.status === "accepted" && !a.deleted).forEach(a => {
        const p = (a.profile && a.profile.personal) || {};
        const sp = p.showcasePhoto, pf = p.photoFile;
        if (sp && (sp.url || sp.path)) urls.push(sp.url || pub(sp.path));
        else if (pf && /\.(png|jpe?g|webp|gif)$/i.test(pf.name || pf.filename || pf.path || "") && (pf.url || pf.path)) urls.push(pf.url || pub(pf.path));
      });
    } catch (e) {}
    try {
      (Store.getFoodland().articles || []).forEach(a => {
        if (a.photo && (a.photo.url || a.photo.path)) urls.push(a.photo.url || pub(a.photo.path));
      });
    } catch (e) {}
    return urls.filter(Boolean);
  }
  function warmPhotos() {
    // Respect Data Saver — don't prefetch a gallery the user may never open.
    if (navigator.connection && navigator.connection.saveData) return;
    collectPhotoUrls().forEach((url, i) => {
      if (_warmedUrls.has(url)) return;
      _warmedUrls.add(url);
      setTimeout(() => { const img = new Image(); img.decoding = "async"; img.src = url; }, i * 120);
    });
  }

  // Convert DB row → app shape (data jsonb holds the document)
  function rowToApplicant(row) {
    if (!row) return null;
    return { ...row.data, id: row.id, email: row.email, name: row.name, status: row.status };
  }
  function applicantToRow(a) {
    const { id, email, name, status, ...rest } = a;
    return { id, email, name, status, data: rest };
  }
  function rowToDonation(row) {
    if (!row) return null;
    return { ...row.data, id: row.id, name: row.name, amount: Number(row.amount) || 0 };
  }
  function donationToRow(d) {
    const { id, name, amount, ...rest } = d;
    return { id, name, amount: Number(amount) || 0, data: rest };
  }
  function rowToReport(row) {
    if (!row) return null;
    // Expose BOTH spellings: the app filters on `applicantId`, the DB column
    // is `applicant_id`. Mapping only the snake_case name silently detached
    // every report from its owner after a refresh.
    return { ...row.data, id: row.id, applicantId: row.applicant_id, applicant_id: row.applicant_id, status: row.status };
  }
  function reportToRow(r) {
    const { id, applicantId, status, ...rest } = r;
    return { id, applicant_id: applicantId, status: status || "open", data: rest };
  }

  // ---------- Profile completeness ----------
  function isProfileComplete(applicant) {
    if (!applicant?.profile) return false;
    const p = applicant.profile;
    const personalOk = p.personal.fullName && p.personal.dateOfBirth && p.personal.phone &&
      p.personal.country && p.personal.address && p.personal.nationalId &&
      p.personal.photoFile;
    const hsOk = p.highSchool.schoolName && p.highSchool.graduationYear && p.highSchool.finalGPA &&
      p.highSchool.raporFile && p.highSchool.subjects.length >= 3 &&
      p.highSchool.subjects.every(s => (s.name || "").trim() && (s.grade || "").toString().trim());
    const uniOk = p.university.name && p.university.program && p.university.degreeLevel &&
      p.university.currentSemester && p.university.currentGPA && p.university.uktPerSemester &&
      p.university.studentCardFile;
    const essayOk = (p.essay || "").trim().length >= 100;
    return !!(personalOk && hsOk && uniOk && essayOk);
  }
  function sectionProgress(applicant) {
    if (!applicant) return { personal: 0, hs: 0, uni: 0, essay: 0 };
    const p = applicant.profile || emptyProfile();
    const personalFields = ["fullName","dateOfBirth","phone","country","address","nationalId"];
    const hsFields = ["schoolName","graduationYear","finalGPA"];
    const uniFields = ["name","program","degreeLevel","currentSemester","currentGPA","uktPerSemester"];
    const personalDone = personalFields.filter(f => p.personal[f]).length + (p.personal.photoFile ? 1 : 0);
    const hsBase = hsFields.filter(f => p.highSchool[f]).length;
    const subjectsTarget = Math.max(p.highSchool.subjects.length, 3);
    const hsGrades = p.highSchool.subjects.filter(s => (s.name || "").trim() && (s.grade || "").toString().trim()).length;
    const hsFile = p.highSchool.raporFile ? 1 : 0;
    const uniDone = uniFields.filter(f => p.university[f]).length;
    const uniFile = p.university.studentCardFile ? 1 : 0;
    const essayLen = (p.essay || "").trim().length;
    return {
      personal: personalDone / (personalFields.length + 1),
      hs: (hsBase + hsGrades + hsFile) / (hsFields.length + subjectsTarget + 1),
      uni: (uniDone + uniFile) / (uniFields.length + 1),
      essay: Math.min(1, essayLen / 100),
    };
  }
  function cumulativeIPK(applicant) {
    if (!applicant?.semesters) return null;
    const gpas = applicant.semesters.map(s => s.ip)
      .filter(ip => ip && ip.gpa)
      .map(ip => parseFloat(ip.gpa))
      .filter(n => !isNaN(n));
    if (gpas.length === 0) return null;
    return { value: gpas.reduce((a, b) => a + b, 0) / gpas.length, count: gpas.length };
  }

  // ---------- Supabase plumbing ----------
  // _founderMode: this browser holds a Supabase Auth session for the founder.
  // Then all table reads/writes go through the AUTHENTICATED client. In every
  // other case the tables are off-limits and the be_* RPCs are used instead.
  let _founderMode = false;
  function anonClient() {
    return window.brialSupabase?.dataClient || window.brialSupabase?.client;
  }
  function sbAuth() {
    // Founder auth uses the session-persisting client.
    return window.brialSupabase?.client;
  }
  function sb() {
    return _founderMode ? sbAuth() : anonClient();
  }
  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || null; } catch (e) { return null; } }
  function setToken(t) { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (e) {} }
  async function rpc(fn, args) {
    const c = anonClient();
    if (!c) throw new Error("Service not ready.");
    const { data, error } = await c.rpc(fn, args || {});
    if (error) throw error;
    return data;
  }
  const ERR_CODES = ["invalid_session", "too_many_attempts", "email_exists", "weak_password", "invalid_email",
                     "forbidden", "rate_limited", "invalid_amount", "too_large", "invalid_hash"];
  function errCode(e) {
    const m = String((e && (e.message || e.details || e.hint)) || e || "");
    return ERR_CODES.find(k => m.indexOf(k) >= 0) || null;
  }

  async function upsertApplicant(applicant) {
    const row = applicantToRow(applicant);
    const { error } = await sb().from("applicants").upsert(row);
    if (error) { console.error("Supabase upsert applicant failed:", error); throw error; }
  }
  async function upsertDonation(donation) {
    const row = donationToRow(donation);
    const { error } = await sb().from("donations").upsert(row);
    if (error) { console.error("Supabase upsert donation failed:", error); reportWriteFailure(error); throw error; }
  }
  async function deleteDonationRow(id) {
    const { error } = await sb().from("donations").delete().eq("id", id);
    if (error) { console.error("Supabase delete donation failed:", error); reportWriteFailure(error); }
  }
  async function upsertReport(report) {
    const row = reportToRow(report);
    const { error } = await sb().from("reports").upsert(row);
    if (error) { console.error("Supabase upsert report failed:", error); reportWriteFailure(error); throw error; }
  }
  async function deleteReportRow(id) {
    const { error } = await sb().from("reports").delete().eq("id", id);
    if (error) { console.error("Supabase delete report failed:", error); reportWriteFailure(error); }
  }

  // A write that did not reach the database must never look saved: tell the
  // user, then reload server truth so the screen matches what is stored.
  let _failTimer = 0;
  function reportWriteFailure(e) {
    console.error("Brial write failed:", e);
    try { syncBanner("savefail"); } catch (x) {}
    clearTimeout(_failTimer);
    _failTimer = setTimeout(() => { try { syncBanner("hide"); } catch (x) {} refreshAll(); }, 6000);
  }

  // Applicant writes are queued per applicant: one request at a time, and
  // only the newest pending version is sent. (Parallel fire-and-forget
  // upserts could land out of order and overwrite newer data with older.)
  const _pendingDoc = {};
  const _pumping = {};
  function writeApplicant(doc) {
    _pendingDoc[doc.id] = doc;
    if (!_pumping[doc.id]) pumpApplicant(doc.id);
  }
  async function pumpApplicant(id) {
    _pumping[id] = true;
    try {
      while (_pendingDoc[id]) {
        const doc = _pendingDoc[id];
        delete _pendingDoc[id];
        try {
          if (_founderMode) {
            await upsertApplicant(doc);
          } else {
            const tok = getToken();
            const sess = Store.getSession();
            if (!tok || !sess || sess.applicantId !== id) throw new Error("Not signed in.");
            const row = await rpc("be_applicant_save", { p_token: tok, p_doc: doc });
            if (!_pendingDoc[id]) {
              // nothing newer queued: adopt the stored version (server keeps
              // founder-controlled fields authoritative)
              const fresh = rowToApplicant(row);
              const k = _applicants.findIndex(a => a.id === id);
              if (k >= 0) _applicants[k] = fresh; else _applicants.unshift(fresh);
              saveCache(); notify({ key: id });
            }
          }
        } catch (e) {
          if (errCode(e) === "invalid_session") { setToken(null); try { localStorage.removeItem(SESSION_KEY); } catch (x) {} notify({ key: SESSION_KEY }); }
          reportWriteFailure(e);
        }
      }
    } finally {
      _pumping[id] = false;
    }
  }

  // Refresh caches from Supabase
  async function refreshAll() {
    try {
      if (_founderMode) {
        const client = sbAuth();
        const [aRes, dRes, rRes] = await Promise.all([
          client.from("applicants").select("*").order("created_at", { ascending: false }),
          client.from("donations").select("*").order("created_at", { ascending: false }),
          client.from("reports").select("*").order("created_at", { ascending: false }),
        ]);
        const err = aRes.error || dRes.error || rRes.error;
        if (err) throw err;
        _applicants = (aRes.data || []).map(rowToApplicant).filter(Boolean);
        _donations  = (dRes.data || []).map(rowToDonation).filter(Boolean);
        _reports    = (rRes.data || []).map(rowToReport).filter(Boolean);
      } else {
        const tok = getToken();
        const [snap, me] = await Promise.all([
          rpc("be_public_snapshot"),
          tok ? rpc("be_applicant_me", { p_token: tok }).catch(e => ({ __err: e })) : Promise.resolve(null),
        ]);
        let apps = ((snap && snap.applicants) || []).map(rowToApplicant).filter(Boolean);
        let reps = [];
        if (me && !me.__err) {
          const mine = rowToApplicant(me.row);
          if (mine) apps = [mine, ...apps.filter(a => a.id !== mine.id)];
          reps = (me.reports || []).map(rowToReport).filter(Boolean);
        } else if (me && me.__err) {
          if (errCode(me.__err) === "invalid_session") {
            setToken(null);
            try { localStorage.removeItem(SESSION_KEY); } catch (x) {}
          } else {
            // transient error: keep the scholar's own record so the portal stays signed in
            const sess = Store.getSession();
            const keep = sess && _applicants.find(a => a.id === sess.applicantId);
            if (keep) apps = [keep, ...apps.filter(a => a.id !== keep.id)];
            reps = _reports;
          }
        }
        _applicants = apps;
        _donations = ((snap && snap.donations) || []).map(rowToDonation).filter(Boolean);
        _reports = reps;
      }
      _lastRefresh = Date.now();
      saveCache();
      notify({ key: "refresh" });
      warmPhotos();
      return true;
    } catch (e) {
      console.error("Brial refresh failed:", e);
      return false;
    }
  }
  let _lastRefresh = 0;

  // Realtime (founder only — visitors refresh when the tab regains focus).
  // Events are debounced — a burst of row changes (e.g. an import) triggers
  // ONE full refetch instead of one per row.
  let _rtTimer = 0;
  let _channel = null;
  function scheduleRefresh() {
    clearTimeout(_rtTimer);
    _rtTimer = setTimeout(refreshAll, 400);
  }
  function subscribeRealtime() {
    if (!_founderMode || _channel) return;
    const client = sbAuth();
    if (!client) return;
    _channel = client.channel("brial-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "applicants" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, scheduleRefresh)
      .subscribe();
  }
  function unsubscribeRealtime() {
    if (!_channel) return;
    try { sbAuth().removeChannel(_channel); } catch (e) {}
    _channel = null;
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !_founderMode && Date.now() - _lastRefresh > 30000) refreshAll();
  });

  // Is the signed-in Supabase Auth user the allow-listed founder?
  // true / false, or null when it could not be checked (offline).
  async function checkFounder() {
    const c = sbAuth();
    if (!c) return false;
    try {
      const { data } = await c.auth.getSession();
      if (!data || !data.session) return false;
      const r = await c.rpc("be_is_founder");
      if (r.error) return null;
      return r.data === true;
    } catch (e) { return null; }
  }

  // ID generation — always max(existing)+1 so an id is NEVER reused after a
  // row is deleted/purged (count-based ids could silently overwrite an
  // existing row via upsert once the list shrank).
  function nextSeqId(items, prefix, seed, key) {
    let max = seed - 1;
    items.forEach(x => {
      const v = String((key ? x[key] : x.id) || "");
      if (v.indexOf(prefix) === 0) {
        const n = parseInt(v.slice(prefix.length), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
    return prefix + (max + 1);
  }
  function nextApplicantId() { return nextSeqId(_applicants, "A-", 2913); }
  function nextDonationId()  { return nextSeqId(_donations, "D-", 8001); }
  function nextScholarId()   { return nextSeqId(_applicants, "S-", 2848, "scholarId"); }

  // ---------- Password hashing (SHA-256 + per-user salt, Web Crypto) ----------
  // Applicant rows live in a table the anon key can read, so passwords must
  // never be stored in plaintext. Legacy plaintext rows keep working: they are
  // verified as before and transparently upgraded to a hash on first login.
  const CAN_HASH = !!(window.crypto && window.crypto.subtle);
  function randomSalt() {
    const a = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(a);
    else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
  }
  async function sha256Hex(str) {
    const buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
  }
  async function hashPassword(password, salt) {
    const s = salt || randomSalt();
    return "v1:" + s + ":" + (await sha256Hex(s + ":" + password));
  }
  async function verifyPassword(password, stored) {
    try {
      const parts = String(stored || "").split(":");
      if (parts.length !== 3 || parts[0] !== "v1") return false;
      return (await sha256Hex(parts[1] + ":" + password)) === parts[2];
    } catch (e) { return false; }
  }

  // ---------- Public API ----------
  const Store = {
    // ----- Reads (sync, from cache) -----
    listApplicants() { return _applicants.filter(a => !a.deleted); },
    listDeleted() { return _applicants.filter(a => a.deleted); },
    getApplicant(id) { return _applicants.find(a => a.id === id); },
    getApplicantByEmail(email) {
      const e = (email || "").trim().toLowerCase();
      return _applicants.find(a => (a.email || "").toLowerCase() === e);
    },
    // Internal KV rows (page content, config, aggregates) share the donations
    // table but must NEVER surface in donation lists — public or admin.
    isInternalDonation(d) {
      if (!d) return true;
      const id = String(d.id || "");
      const INTERNAL = ["LEGACY-SUMMARY", "PILLAR-GRANTS", "PILLAR-LINKS", "PILLAR-STATUS", "PAYMENT-CONFIG", "EBOOKS-CATALOG", "FOODLAND-CONTENT", "WORSHIP-CONTENT", "WATER-CONTENT", "SITE-CONTACT"];
      return INTERNAL.indexOf(id) >= 0 || id.indexOf("PILLAR-CONTENT-") === 0 || String(d.name || "").slice(0, 2) === "__";
    },
    listDonations() { return _donations.filter(d => !Store.isInternalDonation(d)); },
    listReports() { return _reports; },
    walletInfo() {
      const u = Store.getPaymentConfig().usdt;
      return { address: u.address, network: u.network, asset: u.asset, confirmations: Number(u.confirmations) || 12 };
    },

    // ----- Payment channels (founder-managed: USDT wallet, bank transfer, card link) -----
    getPaymentConfig() {
      const defaults = {
        usdt: { enabled: true, address: WALLET.address, network: "ERC-20", asset: "USDT (Tether)", confirmations: 12 },
        bank: { enabled: true, bank: "Bank Jago", account: "107540735665", holder: "Brial Asif Hayi Paka", currency: "IDR \u00b7 Rupiah" },
        card: { enabled: true, link: "https://lynk.id/brial/s/e1896978jwq9" },
      };
      const d = _donations.find(x => x.id === "PAYMENT-CONFIG");
      if (d && d.data && d.data.payments) {
        const p = d.data.payments;
        return {
          usdt: { ...defaults.usdt, ...(p.usdt || {}) },
          bank: { ...defaults.bank, ...(p.bank || {}) },
          card: { ...defaults.card, ...(p.card || {}) },
        };
      }
      return defaults;
    },
    savePaymentConfig(obj) {
      const rec = { id: "PAYMENT-CONFIG", name: "__payments__", amount: 0, data: { payments: obj } };
      const idx = _donations.findIndex(x => x.id === "PAYMENT-CONFIG");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "payments" });
      upsertDonation(rec).catch(e => console.error(e));
    },

    // ----- Pillar grants (non-scholarship distributions, e.g. Houses of Worship) -----
    getPillarGrants() {
      const d = _donations.find(x => x.id === "PILLAR-GRANTS");
      return (d && d.data && Array.isArray(d.data.grants)) ? d.data.grants : [];
    },
    _savePillarGrants(grants) {
      const total = grants.reduce((a, g) => a + (Number(g.amount) || 0), 0);
      const rec = { id: "PILLAR-GRANTS", name: "__pillars__", amount: total, data: { grants } };
      const idx = _donations.findIndex(x => x.id === "PILLAR-GRANTS");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "pillars" });
      upsertDonation(rec).catch(e => console.error(e));
    },
    addPillarGrant(obj) {
      const grants = Store.getPillarGrants();
      const d = new Date(obj.date || now());
      const ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
      const ref = "WQF-" + ymd + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const g = {
        id: "PG-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        pillar: obj.pillar || "Houses of Worship",
        partner: (obj.partner || "").trim(),
        project: (obj.project || "").trim(),
        country: (obj.country || "").trim(),
        amount: Number(obj.amount) || 0,
        units: Math.max(0, Math.round(Number(obj.units) || 0)),
        note: (obj.note || "").trim(),
        txRef: obj.txRef ? String(obj.txRef).trim() : ref,
        date: obj.date || now(),
        createdAt: now(),
      };
      Store._savePillarGrants([g, ...grants]);
      return g;
    },
    deletePillarGrant(id) {
      Store._savePillarGrants(Store.getPillarGrants().filter(g => g.id !== id));
    },
    updatePillarGrant(id, patch) {
      const clean = { ...patch };
      if (clean.units !== undefined) clean.units = Math.max(0, Math.round(Number(clean.units) || 0));
      if (clean.amount !== undefined) clean.amount = Number(clean.amount) || 0;
      Store._savePillarGrants(Store.getPillarGrants().map(g => g.id === id ? { ...g, ...clean } : g));
    },
    // ----- Impact reports: one a year, written in the Founder Console. -----
    // Kept in the internal record IMPACT-REPORTS. Visitors receive published
    // reports only, and never the founder's working numbers ("snapshot").
    getImpactReports() {
      const d = _donations.find(x => x.id === "IMPACT-REPORTS");
      return (d && d.data && Array.isArray(d.data.reports)) ? d.data.reports : [];
    },
    getPublishedImpactReports() {
      return Store.getImpactReports().filter(r => r && r.status === "published" && r.public)
        .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    },
    saveImpactReports(reports) {
      const rec = { id: "IMPACT-REPORTS", name: "__impact__", amount: 0, data: { reports } };
      const idx = _donations.findIndex(x => x.id === "IMPACT-REPORTS");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "impact" });
      return upsertDonation(rec);
    },
    // Sum of per-grant units (trees, mosques, wells) for one pillar
    getPillarUnits(pillarName) {
      return Store.getPillarGrants().filter(g => g.pillar === pillarName && !g.archived).reduce((a, g) => a + (Number(g.units) || 0), 0);
    },

    // ----- Library sales (income — enters the ledger as a verified gift, never counted as distributed) -----
    listLibrarySales() {
      return _donations
        .filter(d => d.data && d.data.sale)
        .map(d => ({ ...d.data.sale, id: d.id, amount: Number(d.amount) || 0 }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    },
    addLibrarySale(obj) {
      const dte = new Date(obj.date || now());
      const ymd = dte.getFullYear() + String(dte.getMonth() + 1).padStart(2, "0") + String(dte.getDate()).padStart(2, "0");
      const ref = "LIB-" + ymd + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const title = (obj.title || "").trim() || "Library edition";
      const qty = Math.max(1, parseInt(obj.qty, 10) || 1);
      const iso = obj.date ? new Date(obj.date).toISOString() : now();
      const rec = {
        id: "SALE-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5).toUpperCase(),
        name: "The Library — " + title + (qty > 1 ? " ×" + qty : ""),
        anonymous: false,
        amount: Number(obj.amount) || 0,
        message: (obj.note || "").trim(),
        txHash: ref,
        email: "", country: "",
        submittedAt: iso,
        verified: true, verifiedAt: now(),
        data: { sale: { bookId: obj.bookId || null, title, lang: (obj.lang || "").trim(), qty, note: (obj.note || "").trim(), date: iso, txRef: ref } },
      };
      _donations.unshift(rec); saveCache(); notify({ key: "sales" });
      upsertDonation(rec).catch(e => console.error(e));
      return rec;
    },
    deleteLibrarySale(id) {
      Store.deleteDonation(id);
    },

    // ----- Legacy (pre-website) disbursements, founder-managed -----
    getLegacy() {
      const d = _donations.find(x => x.id === "LEGACY-SUMMARY");
      if (d && d.data) return { totalFunds: 0, count: 0, scholars: [], ...d.data };
      return { totalFunds: 0, count: 0, scholars: [] };
    },
    saveLegacy(obj) {
      const clean = {
        totalFunds: Number(obj.totalFunds) || 0,
        count: parseInt(obj.count, 10) || 0,
        scholars: Array.isArray(obj.scholars) ? obj.scholars : [],
      };
      const rec = { id: "LEGACY-SUMMARY", name: "__legacy__", amount: clean.totalFunds, data: clean };
      const idx = _donations.findIndex(x => x.id === "LEGACY-SUMMARY");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "legacy" });
      upsertDonation(rec).catch(e => console.error(e));
    },

    // ----- E-Books catalog (founder-managed, stored in donations table) -----
    listEbooks() {
      const d = _donations.find(x => x.id === "EBOOKS-CATALOG");
      if (d && d.data && Array.isArray(d.data.books)) return d.data.books;
      return DEFAULT_EBOOKS;
    },
    saveEbooks(books) {
      const clean = (Array.isArray(books) ? books : []).map((b, i) => ({
        id: b.id || ("book-" + Date.now().toString(36) + i),
        lang: (b.lang || "").trim(),
        langCode: (b.langCode || "").trim().toUpperCase().slice(0, 3),
        title: (b.title || "").trim(),
        subtitle: (b.subtitle || "").trim(),
        cover: b.cover || "",
        link: (b.link || "").trim(),
        desc: (b.desc || "").trim(),
        getLabel: (b.getLabel || "").trim(),
        supportNote: (b.supportNote || "").trim(),
        accent: b.accent || "#C9A961",
        points: Array.isArray(b.points) ? b.points.filter(Boolean) : [],
      }));
      const rec = { id: "EBOOKS-CATALOG", name: "__ebooks__", amount: 0, data: { books: clean } };
      const idx = _donations.findIndex(x => x.id === "EBOOKS-CATALOG");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "ebooks" });
      upsertDonation(rec).catch(e => console.error(e));
    },

    // ----- Food & Land programme content (founder-managed page copy) -----
    getFoodland() {
      const defaults = {
        programme: "Trees for Life",
        partnerLine: "In partnership with Zaytoun CIC, London",
        trees: 5,
        location: "Jenin \u00b7 Nablus \u00b7 Salfeet \u2014 Palestine",
        intro: "Through Zaytoun's Trees for Life programme \u2014 run on the ground by the Palestine Fair Trade Association \u2014 the endowment sponsors olive saplings planted on Palestinian family land. Priority goes to young farmers and to women beginning their groves. Each sapling is two to three years old when it meets the soil, bears its first fruit within five to seven, and stands in full strength at fifteen. Planted once, fruiting for generations \u2014 the endowment's own principle, made literal.",
        articles: [{
          id: "first-grove",
          date: "2026-07",
          title: "The first five trees",
          body: "Five olive trees now stand in the soil of Jenin, Nablus and Salfeet \u2014 the first planting of the Food & Land pillar. The olive farmers of the Trees for Life programme certified the gift under the endowment's name; the trees will outlive every document we hold.",
          photo: null
        }]
      };
      const d = _donations.find(x => x.id === "FOODLAND-CONTENT");
      if (d && d.data && d.data.foodland) {
        const f = d.data.foodland;
        return { ...defaults, ...f, articles: Array.isArray(f.articles) ? f.articles : defaults.articles };
      }
      return defaults;
    },
    saveFoodland(obj) {
      const rec = { id: "FOODLAND-CONTENT", name: "__foodland__", amount: 0, data: { foodland: obj } };
      const idx = _donations.findIndex(x => x.id === "FOODLAND-CONTENT");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "foodland" });
      upsertDonation(rec).catch(e => console.error(e));
    },

    // ----- Houses of Worship programme content (founder-managed page copy) -----
    getWorship() {
      const defaults = {
        programme: "Houses of Worship",
        partnerLine: "In partnership with Minang Bandung Foundation",
        mosques: 1,
        location: "Bandung \u2014 West Java, Indonesia",
        intro: "Together with the Minang Bandung Foundation as builder, the endowment funds the construction of mosques \u2014 places that gather a community in prayer, learning and shelter. Each build is documented from land to minaret, and every house raised is held as waqf: owned by no one, serving everyone, enduring long after its builders.",
        articles: []
      };
      const d = _donations.find(x => x.id === "WORSHIP-CONTENT");
      if (d && d.data && d.data.worship) {
        const f = d.data.worship;
        return { ...defaults, ...f, articles: Array.isArray(f.articles) ? f.articles : defaults.articles };
      }
      return defaults;
    },
    saveWorship(obj) {
      const rec = { id: "WORSHIP-CONTENT", name: "__worship__", amount: 0, data: { worship: obj } };
      const idx = _donations.findIndex(x => x.id === "WORSHIP-CONTENT");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "worship" });
      upsertDonation(rec).catch(e => console.error(e));
    },

    // ----- Clean Water programme content (founder-managed page copy) -----
    getWater() {
      const defaults = {
        programme: "Clean Water",
        partnerLine: "",
        wells: 0,
        trees: 0,
        location: "",
        intro: "Wells and water systems \u2014 the simplest gift that changes everything for a village. The endowment funds boreholes, hand pumps and spring protections built with local partners: each point surveyed where the need is greatest, built with the village rather than for it, and maintained so the water keeps flowing for generations.",
        articles: []
      };
      const d = _donations.find(x => x.id === "WATER-CONTENT");
      if (d && d.data && d.data.water) {
        const f = d.data.water;
        return { ...defaults, ...f, articles: Array.isArray(f.articles) ? f.articles : defaults.articles };
      }
      return defaults;
    },
    saveWater(obj) {
      const rec = { id: "WATER-CONTENT", name: "__water__", amount: 0, data: { water: obj } };
      const idx = _donations.findIndex(x => x.id === "WATER-CONTENT");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "water" });
      upsertDonation(rec).catch(e => console.error(e));
    },

    // ----- Generic pillar programme content (Hospitals, Schools, Livestock, Infrastructure) -----
    getPillarContent(key) {
      const DEFS = {
        hospitals: { programme: "Hospitals", intro: "Care for those who cannot afford to be sick. The endowment funds clinics and wards with local health partners \u2014 each one assessed where illness costs families the most, built and equipped to last, and held to one rule: free at the point of need." },
        schools: { programme: "Schools", intro: "Distance and fees decide who learns; a school nearby changes the arithmetic. The endowment funds classrooms with local partners \u2014 grounded where children walk farthest, raised and staffed to teach well, and open to every child of the village." },
        livestock: { programme: "Livestock & Enterprise", intro: "Charity that multiplies. The endowment places productive capital \u2014 herds, tools and small enterprise \u2014 in the hands of families who tend it: the offspring and the profits stay with them, the dignity of earning returns, and the gift funds itself again." },
        infra: { programme: "Sustainable Infrastructure", intro: "The quiet foundations. The endowment funds bridges, power and public works with local partners \u2014 surveyed with the community that will use them, built to endure, and maintained so a village can stand, trade and grow on its own." }
      };
      const def = { partnerLine: "", units: 0, location: "", articles: [], ...(DEFS[key] || { programme: key, intro: "" }) };
      const d = _donations.find(x => x.id === "PILLAR-CONTENT-" + String(key).toUpperCase());
      if (d && d.data && d.data.content) {
        const f = d.data.content;
        return { ...def, ...f, articles: Array.isArray(f.articles) ? f.articles : [] };
      }
      return def;
    },
    savePillarContent(key, obj) {
      const id = "PILLAR-CONTENT-" + String(key).toUpperCase();
      const rec = { id, name: "__pillar__", amount: 0, data: { content: obj } };
      const idx = _donations.findIndex(x => x.id === id);
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "pillar-" + key });
      upsertDonation(rec).catch(e => console.error(e));
    },
    // ----- Contact & social links shown in the site footer (founder-managed) -----
    // items: [{ type, value, label?, shown }] in display order. Only items with
    // shown:true leave the database for visitors (be_private.public_donation).
    CONTACT_TYPES: [
      { type: "email", label: "Email", hint: "hello@brialendowment.org" },
      { type: "phone", label: "Phone", hint: "+90 505 000 0000" },
      { type: "whatsapp", label: "WhatsApp", hint: "+90 505 000 0000" },
      { type: "instagram", label: "Instagram", hint: "@brialendowment or full link" },
      { type: "linkedin", label: "LinkedIn", hint: "Full profile or page link" },
      { type: "facebook", label: "Facebook", hint: "Page name or full link" },
      { type: "x", label: "X (Twitter)", hint: "@handle or full link" },
      { type: "youtube", label: "YouTube", hint: "@channel or full link" },
      { type: "tiktok", label: "TikTok", hint: "@handle or full link" },
      { type: "telegram", label: "Telegram", hint: "@username or full link" },
      { type: "website", label: "Website", hint: "https://…" },
      { type: "address", label: "Address", hint: "Street, city, country" },
    ],
    // Monoline 24px icons for each contact type (shared by the footer and the founder editor)
    CONTACT_ICONS: {
      email: [["rect", { x: 3, y: 5.5, width: 18, height: 13, rx: 2 }], ["path", { d: "M3.5 7l8.5 6 8.5-6" }]],
      phone: [["path", { d: "M6.5 3.5h3l1.8 4.6-2.3 1.4a11 11 0 0 0 5.5 5.5l1.4-2.3 4.6 1.8v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 5 5.1 1.5 1.5 0 0 1 6.5 3.5z" }]],
      whatsapp: [["path", { d: "M20.5 11.6a8.6 8.6 0 0 1-12.7 7.6L3.5 20.5l1.3-4.1a8.6 8.6 0 1 1 15.7-4.8z" }], ["path", { d: "M9 8.6c.2 2.8 3.2 5.8 6 6l1.2-1.4-1.9-1-.9.8c-1-.4-2.3-1.7-2.7-2.7l.8-.9-1-1.9z" }]],
      instagram: [["rect", { x: 3.5, y: 3.5, width: 17, height: 17, rx: 5 }], ["circle", { cx: 12, cy: 12, r: 4 }], ["circle", { cx: 17.2, cy: 6.8, r: 0.9, fill: "currentColor", stroke: "none" }]],
      linkedin: [["rect", { x: 3.5, y: 3.5, width: 17, height: 17, rx: 3 }], ["path", { d: "M8 10.5V17M8 7.4v.1M11.5 17v-6.5M11.5 13.2c0-1.6 1.1-2.7 2.5-2.7s2.4 1 2.4 2.7V17" }]],
      facebook: [["path", { d: "M14.5 3.5h-2a3.5 3.5 0 0 0-3.5 3.5v3H7v3.5h2v7h3.5v-7h2.4l.6-3.5h-3V7.4c0-.5.4-.9.9-.9h1.1z" }]],
      x: [["path", { d: "M4.5 4.5l15 15M19.5 4.5l-15 15" }]],
      youtube: [["rect", { x: 2.5, y: 5.5, width: 19, height: 13, rx: 4 }], ["path", { d: "M10.2 9.3v5.4l4.6-2.7z" }]],
      tiktok: [["path", { d: "M13.5 3.5v11.2a3.3 3.3 0 1 1-3.3-3.3" }], ["path", { d: "M13.5 3.5c.4 2.6 2.4 4.6 5 4.8" }]],
      telegram: [["path", { d: "M20.5 4.5L3.5 11l5.8 2.2 2.2 6.3 3.2-4 4.6 3.4z" }], ["path", { d: "M9.3 13.2l11.2-8.7" }]],
      website: [["circle", { cx: 12, cy: 12, r: 8.5 }], ["path", { d: "M3.5 12h17M12 3.5c2.8 3.2 2.8 13.8 0 17M12 3.5c-2.8 3.2-2.8 13.8 0 17" }]],
      address: [["path", { d: "M12 20.5s-6.5-5.8-6.5-10.8a6.5 6.5 0 0 1 13 0c0 5-6.5 10.8-6.5 10.8z" }], ["circle", { cx: 12, cy: 9.7, r: 2.3 }]],
      link: [["path", { d: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" }], ["path", { d: "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" }]],
    },
    contactIcon(type, size) {
      const R = window.React; if (!R) return null;
      const shapes = Store.CONTACT_ICONS[type] || Store.CONTACT_ICONS.link;
      return R.createElement("svg", { width: size || 18, height: size || 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
        shapes.map((s, i) => R.createElement(s[0], Object.assign({ key: i }, s[1]))));
    },
    getSiteContact() {
      const d = _donations.find(x => x.id === "SITE-CONTACT");
      if (d && d.contact && Array.isArray(d.contact.items)) return d.contact.items;
      return [{ type: "instagram", value: "https://www.instagram.com/brialendowment", shown: true }];
    },
    saveSiteContact(items) {
      const clean = (Array.isArray(items) ? items : []).map(it => ({
        type: String(it.type || "link"),
        value: String(it.value || "").trim(),
        label: String(it.label || "").trim(),
        shown: !!it.shown && !!String(it.value || "").trim(),
      })).filter(it => it.value || it.type !== "link");
      const rec = { id: "SITE-CONTACT", name: "__contact__", amount: 0, contact: { items: clean } };
      const idx = _donations.findIndex(x => x.id === "SITE-CONTACT");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "contact" });
      return upsertDonation(rec);
    },
    // ----- Email: receipts and notices (founder only; sending happens on the server) -----
    async _mailRpc(fn, args) {
      const c = sbAuth();
      if (!c || !_founderMode) throw new Error("forbidden");
      const { data, error } = await c.rpc(fn, args || {});
      if (error) throw error;
      return data;
    },
    async _mailFn(body) {
      const c = sbAuth();
      if (!c || !_founderMode) throw new Error("forbidden");
      const { data, error } = await c.functions.invoke("be-mail", { body });
      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data;
    },
    getMailSettings() { return Store._mailRpc("be_mail_settings"); },
    saveMailSettings(s) { return Store._mailRpc("be_mail_save_settings", { p_settings: s }); },
    mailLog(limit) { return Store._mailRpc("be_mail_log", { p_limit: limit || 60 }); },
    async mailReceipts() {
      const rows = (await Store._mailRpc("be_receipts")) || [];
      const map = {}; rows.forEach(r => { map[r.donationId] = r; });
      return map;
    },
    sendReceipt(donationId, to, note) { return Store._mailRpc("be_mail_send_receipt", { p_donation_id: donationId, p_to: to || null, p_note: note || null }); },
    sendTestEmail() { return Store._mailRpc("be_mail_send_test"); },
    mailPreview() { return Store._mailFn({ action: "preview", kind: "receipt" }); },
    sendMessage(msg) { return Store._mailRpc("be_mail_send_message", { p_msg: msg }); },
    previewMessage(msg) { return Store._mailFn({ action: "preview_message", message: msg }); },
    async downloadReceiptPdf(donationId, sample) {
      const r = await Store._mailFn(sample ? { action: "sample_pdf" } : { action: "receipt_pdf", donationId });
      const bin = atob(r.base64); const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url; a.download = r.filename || "receipt.pdf";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return r;
    },

    // Visible items with a ready-to-use link and display text.
    publicContacts() {
      const T = {}; Store.CONTACT_TYPES.forEach(t => { T[t.type] = t.label; });
      return Store.getSiteContact().filter(it => it.shown && it.value).map(it => {
        const href = Store.contactHref(it);
        const name = it.type === "link" ? (it.label || "Link") : (T[it.type] || it.type);
        const text = ["email", "phone", "whatsapp", "address"].indexOf(it.type) >= 0 ? it.value : (it.label || name);
        return { type: it.type, name, text, href, value: it.value };
      });
    },
    contactHref(it) {
      const v = String((it && it.value) || "").trim();
      if (!v) return null;
      const handle = v.replace(/^@/, "");
      const isUrl = /^https?:\/\//i.test(v);
      const web = u => (/^https?:\/\//i.test(u) ? u : "https://" + u.replace(/^\/+/, ""));
      const looksLikeDomain = /^[\w-]+(\.[\w-]+)+(\/|$)/.test(v);
      switch (it.type) {
        case "email": return "mailto:" + v;
        case "phone": return "tel:" + v.replace(/[^\d+]/g, "");
        case "whatsapp": return isUrl ? v : "https://wa.me/" + v.replace(/\D/g, "");
        case "instagram": return isUrl || looksLikeDomain ? web(v) : "https://www.instagram.com/" + handle;
        case "x": return isUrl || looksLikeDomain ? web(v) : "https://x.com/" + handle;
        case "tiktok": return isUrl || looksLikeDomain ? web(v) : "https://www.tiktok.com/@" + handle;
        case "youtube": return isUrl || looksLikeDomain ? web(v) : "https://www.youtube.com/@" + handle;
        case "telegram": return isUrl || looksLikeDomain ? web(v) : "https://t.me/" + handle;
        case "facebook": return isUrl || looksLikeDomain ? web(v) : "https://www.facebook.com/" + handle;
        case "linkedin": return isUrl || looksLikeDomain ? web(v) : "https://www.linkedin.com/in/" + handle;
        case "address": return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(v);
        default: return isUrl || looksLikeDomain ? web(v) : null;
      }
    },

    // ----- Pillar visibility: which pillars are live on the public site -----
    getPillarActive(key) {
      const DEF = { scholarships: true, worship: true, library: true, foodland: true, water: true, hospitals: false, schools: false, livestock: false, infra: false };
      const d = _donations.find(x => x.id === "PILLAR-STATUS");
      const map = (d && d.data && d.data.active) || {};
      if (map[key] !== undefined) return !!map[key];
      return DEF[key] !== undefined ? DEF[key] : false;
    },
    savePillarActive(key, flag) {
      const prev = _donations.find(x => x.id === "PILLAR-STATUS");
      const active = { ...((prev && prev.data && prev.data.active) || {}), [key]: !!flag };
      const rec = { id: "PILLAR-STATUS", name: "__pillars__", amount: 0, data: { active } };
      const idx = _donations.findIndex(x => x.id === "PILLAR-STATUS");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "pillars" });
      upsertDonation(rec).catch(e => console.error(e));
    },

    // ----- Pillar redirect links (founder-managed: where a public pillar sends its audience) -----
    getPillarLinks() {
      const defaults = {
        worship: "https://mbamaljariyah.com/category/pembangunan/",
        library: "https://lynk.id/brial",
        foodland: "https://zaytoun.uk/plant-a-tree/",
        water: "",
        hospitals: "",
        schools: "",
        livestock: "",
        infra: "",
      };
      const d = _donations.find(x => x.id === "PILLAR-LINKS");
      if (d && d.data && d.data.links) return { ...defaults, ...d.data.links };
      return defaults;
    },
    getPillarLink(key) { return Store.getPillarLinks()[key] || ""; },
    savePillarLink(key, url) {
      const prev = _donations.find(x => x.id === "PILLAR-LINKS");
      const hidden = (prev && prev.data && prev.data.hidden) || {};
      const links = { ...Store.getPillarLinks(), [key]: String(url || "").trim() };
      const rec = { id: "PILLAR-LINKS", name: "__links__", amount: 0, data: { links, hidden } };
      const idx = _donations.findIndex(x => x.id === "PILLAR-LINKS");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "links" });
      upsertDonation(rec).catch(e => console.error(e));
    },
    // Hide/show the public partner button per pillar (used between partners)
    getPillarLinkHidden(key) {
      const d = _donations.find(x => x.id === "PILLAR-LINKS");
      return !!(d && d.data && d.data.hidden && d.data.hidden[key]);
    },
    savePillarLinkHidden(key, hiddenFlag) {
      const prev = _donations.find(x => x.id === "PILLAR-LINKS");
      const hidden = { ...((prev && prev.data && prev.data.hidden) || {}), [key]: !!hiddenFlag };
      const rec = { id: "PILLAR-LINKS", name: "__links__", amount: 0, data: { links: Store.getPillarLinks(), hidden } };
      const idx = _donations.findIndex(x => x.id === "PILLAR-LINKS");
      if (idx >= 0) _donations[idx] = rec; else _donations.push(rec);
      saveCache(); notify({ key: "links" });
      upsertDonation(rec).catch(e => console.error(e));
    },

    // ----- Public metrics for the homepage (real data) -----
    getPublicMetrics() {
      const accepted = _applicants.filter(a => a.status === "accepted" && !a.deleted);
      const legacy = Store.getLegacy();
      let disbursed = 0;
      const nationsLower = new Set();
      // institutions deduped case-insensitively → { school (display), country }
      const instMap = new Map();
      const addInst = (school, country) => {
        const key = (school || "").trim().toLowerCase();
        if (!key) return;
        const display = (school || "").trim().toUpperCase();
        if (!instMap.has(key)) instMap.set(key, { school: display, country: (country || "").trim() || "—" });
      };
      accepted.forEach(a => {
        let aDisb = 0;
        (a.semesters || []).forEach(s => { if (s.paidAt && s.bill) aDisb += (s.bill.amount || 0); });
        disbursed += aDisb;
        const uni = (a.profile?.university?.name || "").trim();
        const country = (a.profile?.personal?.country || "").trim();
        addInst(uni, country);
        if (country) nationsLower.add(country.toLowerCase());
      });
      disbursed += Number(legacy.totalFunds) || 0;
      const pillarGrants = Store.getPillarGrants().filter(g => !g.archived);
      const pillarTotal = pillarGrants.reduce((a, g) => a + (Number(g.amount) || 0), 0);
      disbursed += pillarTotal;
      // Grant countries (e.g. Palestine via Food & Land) grow "Nations represented"
      pillarGrants.forEach(g => {
        const c = (g.country || "").trim();
        if (c) nationsLower.add(c.toLowerCase());
      });
      (legacy.scholars || []).forEach(s => {
        const country = (s.country || "").trim();
        addInst(s.school, country);
        if (country) nationsLower.add(country.toLowerCase());
      });
      const legacyCount = legacy.count || (legacy.scholars || []).length || 0;
      const institutions = [...instMap.values()];
      return {
        disbursed,
        scholarsDisbursed: disbursed - pillarTotal,
        pillarTotal,
        pillarGrants,
        awardeeCount: accepted.length + legacyCount,
        liveAwardees: accepted.length,
        nationsCount: nationsLower.size,
        nations: [...nationsLower],
        schools: institutions.map(x => x.school),
        institutions,
      };
    },
    isProfileComplete, sectionProgress, emptyProfile, cumulativeIPK,
    DEGREE_LEVELS,
    getDegreeLevel(applicant) {
      return DEGREE_LEVELS[applicant?.profile?.university?.degreeLevel] || DEGREE_LEVELS.S1;
    },

    // ----- Internal write helper -----
    _commit(applicant) {
      // 1. Update cache sync so UI reflects immediately
      const idx = _applicants.findIndex(a => a.id === applicant.id);
      if (idx >= 0) _applicants[idx] = applicant; else _applicants.unshift(applicant);
      saveCache(); notify({ key: applicant.id });
      // 2. Queue the write (founder: table upsert · scholar: be_applicant_save)
      writeApplicant(applicant);
    },

    // ----- Signup / status transitions -----
    async signup(form) {
      const email = (form.email || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Please enter a valid email address." };
      if (!form.password || form.password.length < 8) return { error: "Password must be at least 8 characters." };
      const name = (form.name || "").trim();
      const profile = emptyProfile();
      profile.personal.fullName = name;
      try {
        // The server creates the row (id, password hash, status) — the
        // browser never sees other applicants or any password hash.
        const res = await rpc("be_applicant_signup", { p_email: email, p_name: name, p_password: form.password, p_doc: { profile } });
        setToken(res.token);
        const applicant = rowToApplicant(res.row);
        _applicants = [applicant, ..._applicants.filter(x => x.id !== applicant.id)];
        _reports = [];
        saveCache(); notify({ key: applicant.id });
        return { applicant };
      } catch (e) {
        const c = errCode(e);
        if (c === "email_exists") return { error: "An account with this email already exists. Please sign in instead." };
        if (c === "invalid_email") return { error: "Please enter a valid email address." };
        if (c === "weak_password") return { error: "Password must be at least 8 characters." };
        return { error: "Could not create the account right now. Please check your connection and try again." };
      }
    },

    updateProfile(id, section, patch) {
      const a = Store.getApplicant(id); if (!a) return;
      const profile = { ...a.profile };
      if (section === "essay") profile.essay = patch;
      else profile[section] = { ...profile[section], ...patch };
      const extra = {};
      if (section === "personal" && patch && typeof patch.fullName === "string") extra.name = patch.fullName;
      Store._commit({ ...a, profile, ...extra });
    },
    updateSubjectGrade(id, idx, patch) {
      const a = Store.getApplicant(id); if (!a) return;
      const subjects = a.profile.highSchool.subjects.map((s, i) => i === idx ? { ...s, ...patch } : s);
      Store._commit({ ...a, profile: { ...a.profile, highSchool: { ...a.profile.highSchool, subjects } } });
    },
    addSubject(id, name = "") {
      const a = Store.getApplicant(id); if (!a) return;
      const subjects = [...(a.profile.highSchool.subjects || []), { name, grade: "" }];
      Store._commit({ ...a, profile: { ...a.profile, highSchool: { ...a.profile.highSchool, subjects } } });
    },
    removeSubject(id, idx) {
      const a = Store.getApplicant(id); if (!a) return;
      const subjects = (a.profile.highSchool.subjects || []).filter((_, i) => i !== idx);
      Store._commit({ ...a, profile: { ...a.profile, highSchool: { ...a.profile.highSchool, subjects } } });
    },
    submitApplication(id) {
      const a = Store.getApplicant(id); if (!a || !isProfileComplete(a)) return false;
      Store._commit({ ...a, status: "submitted", submittedAt: now() });
      return true;
    },
    scheduleInterview(id, isoDate, meetingLink = "") {
      const a = Store.getApplicant(id); if (!a) return;
      Store._commit({ ...a, status: "interview-scheduled", interviewAt: isoDate, meetingLink });
    },
    markInterviewDone(id) {
      const a = Store.getApplicant(id); if (!a) return;
      Store._commit({ ...a, status: "interview-done", interviewDoneAt: now() });
    },
    rejectApplication(id) {
      const a = Store.getApplicant(id); if (!a) return;
      Store._commit({ ...a, status: "rejected", rejectedAt: now() });
    },
    acceptApplication(id) {
      const a = Store.getApplicant(id); if (!a) return;
      const sid = nextScholarId();
      const semesters = makeSemestersForApplicant(a);
      Store._commit({
        ...a, status: "accepted", acceptedAt: now(),
        scholarId: sid,
        cohort: "Class of " + new Date().getFullYear(),
        walletShort: "0x" + Math.random().toString(16).slice(2, 6) + "…" + Math.random().toString(16).slice(2, 6),
        scholarStatus: "active",
        statusHistory: [{ status: "active", reason: "Initial acceptance", at: now() }],
        semesters,
      });
    },
    saveNotes(id, notes) {
      const a = Store.getApplicant(id); if (!a) return;
      Store._commit({ ...a, notes });
    },

    // ----- Change requests (awardee proposes → founder approves) -----
    async requestChange(applicantId, { type, value, label, note }) {
      const a = Store.getApplicant(applicantId);
      if (!a) return { error: "Account not found." };
      const reqs = a.changeRequests || [];
      // Prevent duplicate pending request for the same field
      const dupe = reqs.find(r => r.status === "pending" && r.type === type && r.label === label);
      if (dupe) return { error: "You already have a pending request for this field." };
      // New passwords are hashed BEFORE the request row is stored, so the
      // plaintext never touches the database.
      let storedValue = value, hashed = false;
      if (type === "password" && CAN_HASH) {
        try { storedValue = await hashPassword(value); hashed = true; } catch (e) { /* fall back to raw */ }
      }
      const req = {
        id: "C-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        type,                       // "email" | "password" | "field"
        value: storedValue,         // new value (string; hash for passwords)
        hashed,                     // true when value is already a password hash
        label: label || type,       // human label e.g. "Full name"
        path: type === "field" ? note : null, // for field type, note carries the path
        note: type === "field" ? "" : (note || ""),
        status: "pending",
        requestedAt: now(),
      };
      Store._commit({ ...a, changeRequests: [req, ...reqs] });
      return { ok: true, request: req };
    },
    async approveChange(applicantId, reqId) {
      const a = Store.getApplicant(applicantId);
      if (!a) return;
      const req = (a.changeRequests || []).find(r => r.id === reqId);
      if (!req) return;
      let patch = {};
      if (req.type === "email") {
        const clash = _applicants.find(x => x.id !== a.id && (x.email || "").toLowerCase() === (req.value || "").toLowerCase());
        if (clash) return { error: "Email already used by another account." };
        patch.email = req.value;
      } else if (req.type === "password") {
        // Credentials only change through a founder-checked RPC.
        let hash = req.value;
        if (!req.hashed) {
          if (!CAN_HASH) return { error: "This browser cannot hash passwords. Please use a modern browser." };
          hash = await hashPassword(req.value);
        }
        const { error } = await sbAuth().rpc("be_admin_set_password_hash", { p_applicant_id: a.id, p_hash: hash });
        if (error) { console.error(error); return { error: "Could not update the password. Please try again." }; }
      } else if (req.type === "field" && req.path) {
        // path like "profile.personal.fullName" or "profile.university.currentGPA"
        const next = JSON.parse(JSON.stringify(a.profile || {}));
        const parts = req.path.replace(/^profile\./, "").split(".");
        let cur = next;
        for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = cur[parts[i]] || {}; cur = cur[parts[i]]; }
        cur[parts[parts.length - 1]] = req.value;
        patch.profile = next;
        // Keep the top-level display name in sync with the legal name
        if (req.path === "profile.personal.fullName") patch.name = req.value;
      }
      const changeRequests = a.changeRequests.map(r => r.id === reqId ? { ...r, status: "approved", resolvedAt: now() } : r);
      Store._commit({ ...a, ...patch, changeRequests });
      return { ok: true };
    },
    rejectChange(applicantId, reqId, reason) {
      const a = Store.getApplicant(applicantId);
      if (!a) return;
      const changeRequests = (a.changeRequests || []).map(r =>
        r.id === reqId ? { ...r, status: "rejected", reason: reason || "", resolvedAt: now() } : r
      );
      Store._commit({ ...a, changeRequests });
    },
    pendingChangeCount() {
      return _applicants.filter(a => !a.deleted)
        .reduce((n, a) => n + (a.changeRequests || []).filter(r => r.status === "pending").length, 0);
    },

    // ----- Soft delete / trash (30-day retention) -----
    softDeleteApplicant(id) {
      const a = Store.getApplicant(id); if (!a) return;
      Store._commit({ ...a, deleted: true, deletedAt: now() });
    },
    restoreApplicant(id) {
      const a = Store.getApplicant(id); if (!a) return;
      const { deleted, deletedAt, ...rest } = a;
      Store._commit({ ...rest, deleted: false, deletedAt: null });
    },
    async purgeApplicant(id) {
      _applicants = _applicants.filter(x => x.id !== id);
      saveCache(); notify({ key: "purge" });
      const client = sb();
      if (client) { try { await client.from("applicants").delete().eq("id", id); } catch (e) { console.error(e); } }
    },
    exportAll() {
      return { exportedAt: new Date().toISOString(), site: "brialendowment.org", applicants: _applicants, donations: _donations, reports: _reports };
    },
    async purgeExpired() {
      if (!_founderMode) return 0;
      const cutoff = Date.now() - 30 * 86400000;
      const expired = _applicants.filter(a => a.deleted && a.deletedAt && new Date(a.deletedAt).getTime() < cutoff);
      for (const a of expired) { await Store.purgeApplicant(a.id); }
      return expired.length;
    },

    // ----- Account self-service (email / password) -----
    async updateAccount(id, { email, password }) {
      const a = Store.getApplicant(id);
      if (!a) return { error: "Account not found." };
      const tok = getToken();
      if (!_founderMode && tok) {
        const e = email !== undefined && email !== null ? String(email).trim() : "";
        if (email !== undefined && email !== null && (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))) return { error: "Please enter a valid email address." };
        const pw = password || "";
        if (pw && pw.length < 8) return { error: "Password must be at least 8 characters." };
        if (!e && !pw) return { error: "Nothing to update." };
        try {
          const row = await rpc("be_applicant_update_account", { p_token: tok, p_email: e, p_password: pw });
          const fresh = rowToApplicant(row);
          const k = _applicants.findIndex(x => x.id === fresh.id);
          if (k >= 0) _applicants[k] = fresh; else _applicants.unshift(fresh);
          saveCache(); notify({ key: fresh.id });
          return { ok: true, email: fresh.email };
        } catch (err) {
          const c = errCode(err);
          if (c === "email_exists") return { error: "That email is already used by another account." };
          if (c === "invalid_session") return { error: "Your session has expired. Please sign in again." };
          return { error: "Could not update your account right now. Please try again." };
        }
      }
      if (!_founderMode) return { error: "Your session has expired. Please sign in again." };
      const patch = {};
      if (email !== undefined && email !== null) {
        const e = email.trim();
        if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { error: "Please enter a valid email address." };
        const clash = _applicants.find(x => x.id !== id && (x.email || "").toLowerCase() === e.toLowerCase());
        if (clash) return { error: "That email is already used by another account." };
        patch.email = e;
      }
      if (password !== undefined && password !== null && password !== "") {
        if (password.length < 8) return { error: "Password must be at least 8 characters." };
        if (!CAN_HASH) return { error: "This browser cannot hash passwords. Please use a modern browser." };
        const { error } = await sbAuth().rpc("be_admin_set_password_hash", { p_applicant_id: id, p_hash: await hashPassword(password) });
        if (error) return { error: "Could not update the password. Please try again." };
        if (!patch.email) return { ok: true, email: a.email };
      }
      if (Object.keys(patch).length === 0) return { error: "Nothing to update." };
      Store._commit({ ...a, ...patch });
      return { ok: true, email: patch.email || a.email };
    },

    // ----- Bills / IP / Semesters -----
    uploadBill(applicantId, semId, bill) {
      const a = Store.getApplicant(applicantId); if (!a) return;
      const semesters = a.semesters.map(s =>
        s.id === semId ? { ...s, status: "bill-uploaded", bill: { ...bill, uploadedAt: now() } } : s
      );
      Store._commit({ ...a, semesters });
    },
    payBill(applicantId, semId, ref) {
      const a = Store.getApplicant(applicantId); if (!a) return;
      const semesters = a.semesters.map(s =>
        s.id === semId ? {
          ...s, status: "paid", paidAt: now(),
          txHash: ref ? String(ref).trim() : "",
        } : s
      );
      const paidIdx = semesters.findIndex(s => s.id === semId);
      for (let i = paidIdx + 1; i < semesters.length; i++) {
        if (semesters[i].status === "upcoming") { semesters[i] = { ...semesters[i], status: "current" }; break; }
      }
      Store._commit({ ...a, semesters });
    },
    uploadIP(applicantId, semId, ip) {
      const a = Store.getApplicant(applicantId); if (!a) return;
      const semesters = a.semesters.map(s =>
        s.id === semId ? { ...s, status: "completed", ip: { ...ip, uploadedAt: now() } } : s
      );
      Store._commit({ ...a, semesters });
    },

    // ----- Scholarship controls -----
    suspendScholarship(id, reason) {
      const a = Store.getApplicant(id); if (!a) return;
      const history = [...(a.statusHistory || []), { status: "suspended", reason, at: now() }];
      Store._commit({ ...a, scholarStatus: "suspended", statusHistory: history });
    },
    reactivateScholarship(id, reason) {
      const a = Store.getApplicant(id); if (!a) return;
      const history = [...(a.statusHistory || []), { status: "active", reason, at: now() }];
      Store._commit({ ...a, scholarStatus: "active", statusHistory: history });
    },
    revokeScholarship(id, reason) {
      const a = Store.getApplicant(id); if (!a) return;
      const history = [...(a.statusHistory || []), { status: "revoked", reason, at: now() }];
      Store._commit({ ...a, scholarStatus: "revoked", statusHistory: history });
    },
    submitGraduation(id, { ijazahFile, transkripFile }) {
      const a = Store.getApplicant(id); if (!a) return;
      const history = [...(a.statusHistory || []), { status: "graduated", reason: "All semesters completed; degree conferred.", at: now() }];
      Store._commit({
        ...a, scholarStatus: "graduated",
        graduation: { ijazahFile, transkripFile, graduatedAt: now() },
        statusHistory: history,
      });
    },

    // ----- Auth & sessions -----
    // Verified on the server; returns the scholar's own record or null.
    async authApplicant(email, password) {
      try {
        const res = await rpc("be_applicant_login", { p_email: (email || "").trim(), p_password: password || "" });
        if (!res || !res.token) return null;
        setToken(res.token);
        const a = rowToApplicant(res.row);
        _applicants = [a, ..._applicants.filter(x => x.id !== a.id)];
        _reports = [];
        saveCache();
        setTimeout(() => { refreshAll(); }, 0);   // pulls the scholar's reports
        return a;
      } catch (e) {
        if (errCode(e) === "too_many_attempts") console.warn("Too many sign-in attempts. Try again in 15 minutes.");
        else console.error("Sign-in failed:", e);
        return null;
      }
    },
    getSession()    { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch (e) { return null; } },
    setSession(s)   { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); notify({ key: SESSION_KEY }); },
    clearSession()  {
      try { window.BrialFiles && window.BrialFiles.clearSigned && window.BrialFiles.clearSigned(); } catch (e) {}
      const tok = getToken();
      setToken(null);
      localStorage.removeItem(SESSION_KEY);
      if (tok) rpc("be_applicant_logout", { p_token: tok }).catch(() => {});
      if (!_founderMode) {
        // drop the scholar's private record from this browser
        _applicants = _applicants.filter(a => a.status === "accepted" && !a.deleted && !(a.profile && a.profile.personal && "nationalId" in a.profile.personal));
        _reports = [];
        saveCache();
        setTimeout(() => { refreshAll(); }, 0);
      }
      notify({ key: SESSION_KEY });
    },
    // Founder auth via Supabase Auth (no password in code)
    async authFounder(email, password) {
      const client = sbAuth();
      if (!client) return { error: "Service not ready. Please try again in a moment." };
      const { data, error } = await client.auth.signInWithPassword({
        email: (email || "").trim(),
        password: password || "",
      });
      if (error) return { error: "Invalid email or password." };
      const isFounder = await checkFounder();
      if (isFounder === false) {
        try { await client.auth.signOut(); } catch (e) {}
        return { error: "This account is not authorized to open the founder console." };
      }
      _founderMode = true;
      subscribeRealtime();
      await refreshAll();
      return { ok: true, user: data.user };
    },
    async getFounderSession() {
      const client = sbAuth();
      if (!client) return null;
      const { data } = await client.auth.getSession();
      return data?.session || null;
    },
    // Synchronous cached check for render-time gating
    founderSessionSync() {
      try {
        // supabase-js stores session under the configured storageKey
        const raw = localStorage.getItem("brial-auth") || localStorage.getItem("sb-brial-auth");
        if (raw) {
          const v = JSON.parse(raw);
          if (v && (v.access_token || v.currentSession?.access_token)) return v;
        }
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k === "brial-auth" || (k.startsWith("sb-") && k.endsWith("-auth-token")))) {
            const v = JSON.parse(localStorage.getItem(k) || "null");
            if (v && (v.access_token || v.currentSession?.access_token)) return v;
          }
        }
      } catch (e) {}
      return null;
    },
    async clearFounderSession() {
      try { window.BrialFiles && window.BrialFiles.clearSigned && window.BrialFiles.clearSigned(); } catch (e) {}
      const client = sbAuth();
      if (client) { try { await client.auth.signOut(); } catch (e) {} }
      unsubscribeRealtime();
      if (_founderMode) {
        // the founder's full copy must not stay in this browser after sign-out
        _founderMode = false;
        wipeCache();
        refreshAll();
      }
      notify({ key: FOUNDER_SESSION_KEY });
    },
    async founderEmail() {
      const client = sbAuth();
      if (!client) return null;
      const { data } = await client.auth.getUser();
      return data?.user?.email || null;
    },
    founderInfo() { return { name: FOUNDER.name }; },

    // ----- Donations -----
    submitDonation(d) {
      const id = nextDonationId();
      const donation = {
        id,
        name: (d.name || "").trim() || "Anonymous patron",
        anonymous: !!d.anonymous,
        amount: parseFloat(d.amount) || 0,
        message: (d.message || "").trim(),
        txHash: (d.txHash || "").trim(),
        email: (d.email || "").trim(),
        country: (d.country || "").trim(),
        submittedAt: now(),
        verified: false,
      };
      _donations.unshift(donation); saveCache(); notify({ key: id });
      // Public form → server RPC (always lands unverified; can't touch config rows)
      rpc("be_submit_donation", { p_donation: donation }).then(row => {
        const saved = rowToDonation(row);
        const k = _donations.findIndex(x => x.id === id);
        if (k >= 0 && saved) { _donations[k] = { ...saved, email: donation.email }; saveCache(); notify({ key: saved.id }); }
      }).catch(e => {
        _donations = _donations.filter(x => x.id !== id); saveCache(); notify({ key: id });
        reportWriteFailure(e);
      });
      return donation;
    },
    markDonationVerified(id) {
      const idx = _donations.findIndex(d => d.id === id);
      if (idx < 0) return;
      _donations[idx] = { ..._donations[idx], verified: true, verifiedAt: now() };
      saveCache(); notify({ key: id });
      // the database issues the receipt number and queues the receipt email
      return upsertDonation(_donations[idx]).catch(e => { console.error(e); throw e; });
    },
    deleteDonation(id) {
      _donations = _donations.filter(d => d.id !== id);
      saveCache(); notify({ key: id });
      deleteDonationRow(id).catch(e => console.error(e));
    },

    // ----- Reports -----
    submitReport({ applicantId, applicantName, applicantEmail, subject, message, category }) {
      const id = _founderMode ? nextSeqId(_reports, "R-", 5001) : "R-pending-" + Date.now().toString(36);
      const report = {
        id, applicantId, applicantName, applicantEmail,
        subject: (subject || "").trim(),
        message: (message || "").trim(),
        category: category || "other",
        status: "open",
        submittedAt: now(),
        reply: null,
      };
      _reports.unshift(report); saveCache(); notify({ key: id });
      if (_founderMode) {
        upsertReport(report).catch(e => console.error(e));
      } else {
        rpc("be_submit_report", { p_token: getToken(), p_report: { subject: report.subject, message: report.message, category: report.category } })
          .then(row => {
            const saved = rowToReport(row);
            const k = _reports.findIndex(r => r.id === id);
            if (k >= 0 && saved) { _reports[k] = saved; saveCache(); notify({ key: saved.id }); }
          })
          .catch(e => {
            _reports = _reports.filter(r => r.id !== id); saveCache(); notify({ key: id });
            reportWriteFailure(e);
          });
      }
      return report;
    },
    replyReport(id, reply) {
      const idx = _reports.findIndex(r => r.id === id); if (idx < 0) return;
      _reports[idx] = { ..._reports[idx], reply: { text: reply, at: now() }, status: "replied" };
      saveCache(); notify({ key: id });
      upsertReport(_reports[idx]).catch(e => console.error(e));
    },
    resolveReport(id) {
      const idx = _reports.findIndex(r => r.id === id); if (idx < 0) return;
      _reports[idx] = { ..._reports[idx], status: "resolved", resolvedAt: now() };
      saveCache(); notify({ key: id });
      upsertReport(_reports[idx]).catch(e => console.error(e));
    },
    deleteReport(id) {
      _reports = _reports.filter(r => r.id !== id);
      saveCache(); notify({ key: id });
      deleteReportRow(id).catch(e => console.error(e));
    },

    // ----- Backup / restore -----
    exportSnapshot() {
      return {
        format: "brial-endowment-v7",
        exportedAt: now(),
        applicants: _applicants,
        donations: _donations,
        wallet: WALLET,
      };
    },
    async importSnapshot(snapshot, { mergeMode = "replace" } = {}) {
      if (!snapshot || typeof snapshot !== "object") return { ok: false, error: "Invalid snapshot." };
      if (!Array.isArray(snapshot.applicants)) return { ok: false, error: "Snapshot is missing the applicants array." };
      if (!_founderMode) return { ok: false, error: "Sign in to the founder console first." };
      const incoming = snapshot.applicants;
      const incomingD = Array.isArray(snapshot.donations) ? snapshot.donations : [];
      try {
        const client = sb();
        if (mergeMode === "replace") {
          // wipe rows, then upsert all
          if (client) {
            await client.from("applicants").delete().neq("id", "__never");
            await client.from("donations").delete().neq("id", "__never");
          }
          _applicants = []; _donations = [];
        }
        for (const a of incoming) {
          const idx = _applicants.findIndex(x => x.id === a.id);
          if (idx >= 0) _applicants[idx] = a; else _applicants.unshift(a);
          if (client) await upsertApplicant(a);
        }
        for (const d of incomingD) {
          const idx = _donations.findIndex(x => x.id === d.id);
          if (idx >= 0) _donations[idx] = d; else _donations.unshift(d);
          if (client) await upsertDonation(d);
        }
        saveCache(); notify({ key: "import" });
        if (mergeMode === "replace") return { ok: true, mode: "replace", count: incoming.length };
        return { ok: true, mode: "merge", added: 0, updated: incoming.length };
      } catch (e) {
        return { ok: false, error: "Import failed: " + (e.message || e) };
      }
    },

    async reset() {
      if (!_founderMode) return;
      const client = sb();
      if (client) {
        try {
          await client.from("applicants").delete().neq("id", "__never");
          await client.from("donations").delete().neq("id", "__never");
          await client.from("reports").delete().neq("id", "__never");
        } catch (e) { console.error(e); }
      }
      _applicants = []; _donations = []; _reports = []; saveCache();
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(FOUNDER_SESSION_KEY);
      notify({ key: "reset" });
    },

    // Manual refresh
    refresh: refreshAll,
    _isReady() { return !!sb(); },
  };

  window.BrialStore = Store;

  // ---------- Bootstrap ----------
  loadCache();
  // ----- Sync status banner (vanilla — works before/without React) -----
  let _syncEl = null, _retryTimer = 0, _attempt = 0;
  function syncBanner(state) {
    try {
      if (!document.body) return;
      if (state === "hide") { if (_syncEl) { _syncEl.remove(); _syncEl = null; } return; }
      if (!_syncEl) {
        _syncEl = document.createElement("div");
        _syncEl.id = "brial-sync-banner";
        _syncEl.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:14px;max-width:min(92vw,560px);padding:12px 18px;background:rgba(10,22,40,0.96);border:1px solid rgba(201,169,97,0.4);box-shadow:0 10px 40px rgba(0,0,0,0.5);font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:0.08em;color:rgba(232,228,220,0.85)";
        document.body.appendChild(_syncEl);
      }
      const dot = "<span style='width:7px;height:7px;border-radius:50%;flex:none;background:" + (state === "syncing" ? "#C9A961;animation:brialPulse 1.2s ease-in-out infinite" : "#E58686") + "'></span>";
      if (!document.getElementById("brial-sync-style")) {
        const st = document.createElement("style");
        st.id = "brial-sync-style";
        st.textContent = "@keyframes brialPulse{0%,100%{opacity:1}50%{opacity:0.25}}";
        document.head.appendChild(st);
      }
      const msg = state === "savefail" ? "COULD NOT SAVE \u2014 YOUR LAST CHANGE WAS NOT STORED. CHECK YOUR CONNECTION AND TRY AGAIN" :
        state === "syncing" ? "CONNECTING TO THE LEDGER\u2026" :
        state === "cache" ? "CONNECTION LOST \u2014 SHOWING YOUR LAST SAVED COPY" :
        "CAN'T REACH THE LEDGER \u2014 CHECK YOUR CONNECTION";
      _syncEl.innerHTML = dot + "<span style='min-width:0'>" + msg + "</span>" + (state === "syncing" || state === "savefail" ? "" : "<button id='brial-sync-retry' style='background:none;border:1px solid rgba(201,169,97,0.5);color:#C9A961;padding:6px 14px;cursor:pointer;font:inherit;letter-spacing:0.14em;flex:none'>RETRY</button>");
      const b = document.getElementById("brial-sync-retry");
      if (b) b.onclick = () => { syncBanner("syncing"); _attempt = 0; firstSync(); };
    } catch (e) {}
  }
  function firstSync() {
    clearTimeout(_retryTimer);
    refreshAll().then(ok => {
      if (ok) {
        syncBanner("hide");
        subscribeRealtime();
        if (_founderMode) Store.purgeExpired();
        window.dispatchEvent(new CustomEvent("brial:ready"));
      } else {
        const hasCache = (_applicants.length + _donations.length) > 0;
        // let the UI render whatever we have — no fake zeros without explanation
        window.dispatchEvent(new CustomEvent("brial:ready"));
        syncBanner(hasCache ? "cache" : "empty");
        _attempt++;
        _retryTimer = setTimeout(firstSync, Math.min(30000, 3000 * Math.pow(2, _attempt)));
      }
    });
  }
  window.addEventListener("online", () => { _attempt = 0; syncBanner("syncing"); firstSync(); });
  // Wait until Supabase is available, then fetch + subscribe.
  async function bootstrap() {
    if (!anonClient()) { setTimeout(bootstrap, 50); return; }
    const f = await checkFounder();
    // null = could not check (offline): trust an existing session; the
    // database still refuses anyone who is not the founder.
    _founderMode = f === true || (f === null && !!Store.founderSessionSync());
    let cachedMode = null;
    try { cachedMode = localStorage.getItem(CACHE_MODE); } catch (e) {}
    if (!_founderMode && cachedMode === "founder") { wipeCache(); notify({ key: "refresh" }); }
    // Warm from local cache immediately — don't wait for the network round-trip.
    try { warmPhotos(); } catch (e) {}
    if ((_applicants.length + _donations.length) === 0) syncBanner("syncing");
    firstSync();
  }
  bootstrap();
})();
