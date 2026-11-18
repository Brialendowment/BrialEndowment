// GENERATED from src/impact-core.js by scripts/build-founder-desk.py. Do not edit here.
// ============================================================
// IMPACT CORE: the numbers of the yearly Impact Report.
// One file, two homes:
//   * the Founder Portal (copied into admin.compiled.js by scripts/build-founder-desk.py)
//   * the scheduled worker (copied to supabase/functions/be-impact/impact-core.js by the same script)
// so the figures the founder approves are exactly the figures published on 1 January.
// Edit THIS file, then run scripts/build-founder-desk.py.
// ============================================================
(function (root) {
  "use strict";
  // Report years follow Jakarta time (UTC+7): the year closes at midnight WIB on 31 December.
  const TZ = "+07:00";
  const yearStart = y => new Date(y + "-01-01T00:00:00" + TZ);
  const yearEnd = y => new Date(y + "-12-31T23:59:59.999" + TZ);
  const yearOf = iso => { const d = new Date(iso); if (isNaN(d)) return null; return new Date(d.getTime() + 7 * 3600e3).getUTCFullYear(); };
  const normKey = s => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isChainTx = h => /^0x[0-9a-f]{64}$/i.test(String(h || "").trim());
  const ymdOf = iso => { const d = new Date(iso); return isNaN(d) ? "" : new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10); };
  const isSaleD = d => !!(d.data && d.data.sale) || String(d.id || "").indexOf("SALE-") === 0;
  const isEntD = d => !!(d.data && d.data.enterprise) || String(d.id || "").indexOf("ENT-") === 0;
  const id_ = s => String(s == null ? "" : s);

  // Grant label → what one unit is called (trees, wells, mosques)
  const UNITS = {
    "Houses of Worship": ["mosque", "mosques"], "Reforestation & Land": ["tree", "trees"], "Food & Clothing": ["kg of food", "kg of food"],
    "Clean Water": ["well", "wells"], "Hospitals": ["clinic", "clinics"], "Schools": ["school", "schools"],
    "Livestock & Enterprise": ["placement", "placements"], "Sustainable Infrastructure": ["work", "works"],
  };

  // One list of movements, built from the same records as the public totals
  function flows(store, h) {
    const titleCase = (h && h.titleCase) || id_, instCase = (h && h.instCase) || id_;
    const PL = x => (store.pillarLabel ? store.pillarLabel(x) : x);
    const donations = (store.listDonations() || []).filter(d => !(store.isInternalDonation && store.isInternalDonation(d)));
    const income = donations.map(d => ({
      id: d.id, dir: "in", date: d.submittedAt || (d.data && d.data.sale && d.data.sale.date) || null,
      category: isEntD(d) ? "Enterprise" : isSaleD(d) ? "Library sale" : "Gift",
      title: isEntD(d) ? ((d.data && d.data.enterprise && d.data.enterprise.name) || "Enterprise") + (d.data && d.data.enterprise && d.data.enterprise.period ? " · " + d.data.enterprise.period : "") : isSaleD(d) ? (d.data && d.data.sale ? d.data.sale.title : d.name) : (d.anonymous ? "Anonymous" : d.name || "Donor"),
      detail: isEntD(d) ? [PL("transport") + " pillar", d.message].filter(Boolean).join(" · ") : isSaleD(d) ? ((d.data && d.data.sale && d.data.sale.qty > 1 ? d.data.sale.qty + " copies" : "1 copy") + (d.message ? " · " + d.message : "")) : [d.country, d.message ? "“" + d.message + "”" : ""].filter(Boolean).join(" · "),
      amount: Number(d.amount) || 0, ref: d.txHash || "", settled: !!d.verified, raw: d,
    }));
    const scholars = store.listApplicants().filter(a => a.status === "accepted");
    const tuition = [], due = [];
    scholars.forEach(sc => (sc.semesters || []).forEach(sem => {
      if (!sem.bill) return;
      const row = { scholar: sc, semester: sem };
      if (sem.paidAt) tuition.push({ id: sc.id + ":" + sem.id, dir: "out", date: sem.paidAt, category: "Tuition", pillar: "Scholarships", title: titleCase(sc.name), detail: [sem.label, instCase(sc.profile && sc.profile.university && sc.profile.university.name)].filter(Boolean).join(" · "), amount: Number(sem.bill.amount) || 0, ref: sem.txHash || "", settled: true, row });
      else if (sem.status === "bill-uploaded") due.push(row);
    }));
    const allGrants = store.getPillarGrants();
    const grants = allGrants.filter(g => Number(g.amount) > 0).map(g => ({ id: g.id, dir: "out", date: g.date, category: "Grant", pillar: g.pillar, title: g.project || "Grant", detail: [g.partner, g.country].filter(Boolean).join(" · "), amount: Number(g.amount) || 0, ref: g.txRef || "", settled: !g.archived, archived: !!g.archived }));
    const legacy = store.getLegacy();
    const legacyRow = Number(legacy.totalFunds) > 0 ? [{ id: "LEGACY", dir: "out", date: null, category: "Founding era", pillar: "Scholarships", title: "Support before the website", detail: `${legacy.count || (legacy.scholars || []).length || 0} scholars, recorded as one total`, amount: Number(legacy.totalFunds) || 0, ref: "", settled: true }] : [];
    const outflow = [...tuition, ...grants, ...legacyRow];
    const sum = l => l.reduce((a, x) => a + (Number(x.amount) || 0), 0);
    const received = income.filter(x => x.settled), pendingIn = income.filter(x => !x.settled);
    const paidOut = outflow.filter(x => x.settled);
    const dueSum = due.reduce((a, r) => a + (Number(r.semester.bill && r.semester.bill.amount) || 0), 0);
    return { income, received, pendingIn, outflow, paidOut, due, dueSum, sum, legacy, scholars };
  }

  // Food & Clothing per report year: rough totals typed in, plus distributions recorded one by one
  function foodClothing(store) {
    const c = store.getPillarContent ? store.getPillarContent("foodclothing") : {};
    const raw = c && c.counts && typeof c.counts === "object" ? c.counts : {};
    const byYear = {};
    const add = (y, kg, g) => { byYear[y] = byYear[y] || { kg: 0, garments: 0 }; byYear[y].kg += kg; byYear[y].garments += g; };
    Object.keys(raw).forEach(y => { if (!/^\d{4}$/.test(y)) return; const r = raw[y] || {}; add(y, Math.max(0, Number(r.kg) || 0), Math.max(0, Math.round(Number(r.garments) || 0))); });
    (store.getPillarGrants() || []).filter(g => g && g.pillar === "Food & Clothing" && !g.archived).forEach(g => {
      const kg = Math.max(0, Number(g.kg) || 0), gar = Math.max(0, Math.round(Number(g.garments) || 0));
      if (!kg && !gar) return;
      const y = yearOf(g.date || g.createdAt); if (!y) return;
      add(String(y), kg, gar);
    });
    Object.keys(byYear).forEach(y => { byYear[y].kg = Math.round(byYear[y].kg * 10) / 10; });
    return { byYear, years: Object.keys(byYear).sort() };
  }

  function compute(store, rep, h) {
    const F = flows(store, h);
    const year = Number(rep.year);
    const from = rep.founding ? null : yearStart(year);
    const to = yearEnd(year);
    const within = iso => { if (!iso) return false; const d = new Date(iso); if (isNaN(d)) return false; return (!from || d >= from) && d <= to; };
    const PL = x => (store.pillarLabel ? store.pillarLabel(x) : x);
    // money in
    const gifts = F.received.filter(x => x.category === "Gift" && within(x.date));
    const sales = F.received.filter(x => x.category === "Library sale" && within(x.date));
    const enterprise = F.received.filter(x => x.category === "Enterprise" && within(x.date));
    const donors = new Set(), countries = new Map();
    gifts.forEach(x => {
      const d = x.raw || {};
      donors.add(normKey(d.email || d.name || x.id));
      const c = String(d.country || "").trim(); if (c && !countries.has(normKey(c))) countries.set(normKey(c), c);
    });
    const copies = sales.reduce((a, x) => a + (Number(x.raw && x.raw.data && x.raw.data.sale && x.raw.data.sale.qty) || 1), 0);
    // money out
    const out = F.paidOut.filter(x => (x.id === "LEGACY" ? rep.founding : within(x.date)));
    const byPillar = {};
    out.forEach(x => { const k = PL(x.pillar || "Scholarships"); byPillar[k] = byPillar[k] || { amount: 0, count: 0 }; byPillar[k].amount += x.amount; byPillar[k].count += 1; });
    // what was built: units recorded on pillar grants (trees, wells, mosques)
    const units = {};
    store.getPillarGrants().filter(g => !g.archived && within(g.date)).forEach(g => {
      const n = Math.max(0, Math.round(Number(g.units) || 0));
      if (!n || g.pillar === "Food & Clothing") return;
      units[g.pillar] = units[g.pillar] || { n: 0, unit: UNITS[g.pillar] || ["unit", "units"] };
      units[g.pillar].n += n;
    });
    // Food & Clothing: counted per year (kilograms of food, garments), not per grant
    const fc = foodClothing(store);
    const fcIn = fc.years.filter(y => Number(y) <= year && (rep.founding || Number(y) === year));
    const fcKg = Math.round(fcIn.reduce((a, y) => a + fc.byYear[y].kg, 0) * 10) / 10, fcG = fcIn.reduce((a, y) => a + fc.byYear[y].garments, 0);
    if (fcKg > 0) units["Food & Clothing"] = { n: fcKg, unit: ["kg of food shared", "kg of food shared"] };
    if (fcG > 0) units["Food & Clothing "] = { n: fcG, unit: ["garment given", "garments given"], pillar: "Food & Clothing" };
    // people and places
    const scholars = F.scholars.filter(s => !s.deleted && (!s.acceptedAt || new Date(s.acceptedAt) <= to));
    const nations = new Map(), insts = new Set();
    const addNation = c => { c = String(c || "").trim(); if (c && !nations.has(normKey(c))) nations.set(normKey(c), c); };
    scholars.forEach(s => { const p = s.profile || {}; addNation(p.personal && p.personal.country); const u = String((p.university && p.university.name) || "").trim(); if (u) insts.add(normKey(u)); });
    const legacy = F.legacy || {};
    const legacyScholars = rep.founding ? (legacy.scholars || []) : [];
    legacyScholars.forEach(s => { addNation(s.country); if (s.school) insts.add(normKey(s.school)); });
    const legacyCount = rep.founding ? (Number(legacy.count) || legacyScholars.length || 0) : 0;
    store.getPillarGrants().filter(g => !g.archived && within(g.date)).forEach(g => addNation(g.country));
    const semesters = F.scholars.reduce((a, s) => a + (s.semesters || []).filter(x => x.paidAt && x.bill && within(x.paidAt)).length, 0);
    const newScholars = F.scholars.filter(s => s.acceptedAt && within(s.acceptedAt)).length;
    const proofs = [
      ...gifts.filter(x => isChainTx(x.ref)).map(x => ({ kind: "Gift received", date: ymdOf(x.date), amount: x.amount, hash: x.ref.trim() })),
      ...out.filter(x => isChainTx(x.ref)).map(x => ({ kind: x.category === "Tuition" ? "Tuition paid" : PL(x.pillar) + " grant", date: ymdOf(x.date), amount: x.amount, hash: x.ref.trim() })),
    ].sort((a, b) => (a.date < b.date ? -1 : 1));
    const pillarNames = Object.keys(byPillar);
    if ((scholars.length + legacyCount) > 0 && pillarNames.indexOf(PL("scholarships")) < 0) pillarNames.unshift(PL("scholarships"));
    if ((fcKg > 0 || fcG > 0) && pillarNames.indexOf(PL("foodclothing")) < 0) pillarNames.push(PL("foodclothing"));
    const r2 = n => Math.round(n * 100) / 100;
    return {
      computedAt: new Date().toISOString(),
      period: { label: rep.founding ? "From the beginning to 31 December " + year : "1 January to 31 December " + year, from: from ? year + "-01-01" : null, to: year + "-12-31" },
      people: { scholars: scholars.length + legacyCount, newScholars, nations: nations.size, nationList: [...nations.values()], institutions: insts.size, semesters },
      pillars: pillarNames,
      built: Object.entries(units).map(([pillar, u]) => ({ pillar: PL(u.pillar || pillar), n: u.n, label: u.n === 1 ? u.unit[0] : u.unit[1] })),
      gifts: { count: gifts.length, donors: donors.size, countries: countries.size },
      money: {
        received: r2(F.sum(gifts)), sales: r2(F.sum(sales)), copies, enterprise: r2(F.sum(enterprise)),
        given: r2(F.sum(out)), byPillar: Object.entries(byPillar).map(([pillar, v]) => ({ pillar, amount: r2(v.amount), count: v.count })).sort((a, b) => b.amount - a.amount),
        proofs,
      },
    };
  }

  // What visitors receive: numbers the founder chose to show, nothing else.
  const publicPart = (snap, rep) => ({
    computedAt: snap.computedAt, period: snap.period, people: snap.people, pillars: snap.pillars, built: snap.built,
    gifts: rep.showGifts ? snap.gifts : null,
    money: rep.showMoney ? snap.money : null,
  });

  // A fresh report record
  const newReport = (year, founding) => ({
    id: "IR-" + year, year: Number(year), founding: !!founding, status: "draft",
    title: founding ? "Founding Year " + year : "Impact Report " + year,
    intro: "", cover: "", coverCaption: "", letter: "", signName: "Brial Asif Hayi Paka", signRole: "Founder",
    stories: [], plans: "", showMoney: false, showGifts: false, mailDonors: true, createdAt: new Date().toISOString(),
  });

  // Words the system writes when it prepares a report on 20 December. The founder reads,
  // edits and approves them; nothing is published without that approval.
  const list = a => (a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
  const nWord = (n, one, many) => n + " " + (Number(n) === 1 ? one : many);
  function draftWords(rep, snap) {
    const P = snap.people, pillars = snap.pillars || [];
    const yr = Number(rep.year);
    const works = (snap.built || []).map(b => b.n + " " + String(b.label).replace(/ (shared|given)$/, ""));
    const people = P.scholars ? nWord(P.scholars, "scholar", "scholars") : "";
    const nations = P.nations ? ", across " + nWord(P.nations, "nation", "nations") : "";
    const did = [people ? "supported " + people : "", works.length ? "gave " + list(works) : ""].filter(Boolean);
    const didLine = did.length ? did.join(" and ") : "took its first quiet steps";
    const intro = rep.founding
      ? `The year the endowment stepped into the open. What began as a private promise in 2024 now stands as a public trust: it ${didLine}${nations}, with every movement recorded on a public ledger.`
      : `A year of giving that does not end. The endowment ${didLine}${nations}, with every movement recorded on a public ledger.`;
    const letter = [
      "To everyone who gave, prayed and trusted,",
      rep.founding
        ? `This is the first report of The Brial Endowment. It covers everything from the very beginning to 31 December ${yr}: the scholarships we carried privately before there was a website, and the year we opened the endowment to the world.`
        : `This report covers 1 January to 31 December ${yr}. It is our account to you of what your trust became.`,
      `Over this period the endowment ${didLine}${pillars.length ? `, working through ${nWord(pillars.length, "pillar", "pillars")}: ${list(pillars)}` : ""}. Every gift went directly to the people and works it was meant for, and every movement is on the public ledger for anyone to check.`,
      "We do not spend the gift. We plant it, so that it keeps giving after we are gone. Thank you for planting with us.",
    ].join("\n\n");
    const plans = `In ${yr + 1} we will keep the principal whole, deepen the pillars already at work, and open new ones only when they can be funded to last.`;
    return { intro, letter, plans };
  }

  // ---------------- letters (plain words; the be-mail worker lays them out) ----------------
  const SITE = "https://brialendowment.org";
  const links = year => ({ page: SITE + "/impact/" + year, pdf: SITE + "/impact/" + year + "?print=1" });
  const wibDay = ms => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  const publishAt = y => Date.UTC(Number(y) + 1, 0, 1, 1, 0, 0); // 1 Jan 08:00 WIB of the next year
  const draftAt = y => Date.UTC(Number(y), 11, 20, 2, 0, 0);       // 20 Dec 09:00 WIB

  // The standard letter to donors; the founder may rewrite subject and message in the console
  function donorDefaults(rep) {
    const t = rep.title || "Impact Report " + rep.year;
    return {
      subject: `${t}: what your gift became`,
      body: `Dear {nama},\n\nYour gift helped make this year possible, and we would like you to see what it became. Our ${t} report is published today, with the numbers, the stories and the year ahead.\n\nThank you for trusting us with something meant to outlast us all.\n\nWith gratitude,`,
    };
  }
  // What goes out: the founder's words, with the two links placed before the sign-off
  function donorLetter(rep) {
    const d = donorDefaults(rep), L = links(rep.year);
    const subject = String(rep.mailSubject || "").trim() || d.subject;
    const body = String(rep.mailBody || "").trim() || d.body;
    const block = `Read the report: ${L.page}\nDownload the PDF: ${L.pdf}`;
    if (body.indexOf("/impact/" + rep.year) >= 0) return { subject, body };
    const parts = body.split(/\n{2,}/);
    const last = parts[parts.length - 1];
    if (parts.length > 1 && last.length <= 40) parts.splice(parts.length - 1, 0, block); else parts.push(block);
    return { subject, body: parts.join("\n\n") };
  }
  // Notes to the founder (sent to the founder's alert address)
  function founderNote(kind, rep, numbers) {
    const t = rep.title || "Impact Report " + rep.year, when = wibDay(publishAt(rep.year));
    const n = numbers || null;
    const usd = v => { const x = Number(v) || 0; return "US$" + x.toLocaleString("en-US", Math.round(x * 100) % 100 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }); };
    const facts = n ? "\n\nThe numbers as of today:\nPeriod: " + n.period + "\nScholars supported: " + n.scholars + "\nNations: " + n.nations +
      "\nPillars at work: " + ((n.pillars || []).join(", ") || "none yet") + (n.built && n.built.length ? "\nBuilt and given: " + n.built.join(", ") : "") +
      "\nGifts received: " + n.gifts + " (" + usd(n.received) + ")\nGiven out: " + usd(n.given) : "";
    if (kind === "ready") return {
      subject: `Your ${t} report is ready for review`,
      body: `The system has prepared the ${t} report from your records and written the first words for you. Nothing is public yet.\n\nOpen the Founder Console at ${SITE}/#/admin, then Foundation office, Impact Report. Read it, change anything you like, and press Approve. Once approved, it is published on ${when} at 08:00 WIB and sent to your donors.` + facts + `\n\nThe published report uses the final numbers to 31 December.`,
    };
    if (kind === "waiting") return {
      subject: `${t} is waiting for your approval`,
      body: `Its publishing day has come, but the report has not been approved, so it is not public yet.\n\nOpen the Founder Console at ${SITE}/#/admin, then Foundation office, Impact Report, and press Approve. It goes live within the hour and is sent to your donors.`,
    };
    return {
      subject: `${t} is published`,
      body: `Your report is live at ${links(rep.year).page} with the final numbers to 31 December.` + (rep.mailDonors !== false ? `\n\nThe letter to your donors is on its way. Emails go out within the daily sending limit, so a long list can take a day or two.` : "") + facts.replace("as of today", "as published"),
    };
  }

  root.BrialImpactCore = { SITE, links, publishAt, draftAt, donorDefaults, donorLetter, founderNote, TZ, yearStart, yearEnd, yearOf, ymdOf, isChainTx, normKey, UNITS, flows, compute, publicPart, newReport, draftWords, foodClothing };
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this);
