// The Impact Report schedule (one pass = impactTick), run hourly by pg_cron through be-impact.
//
//   20 Dec 09:00 WIB  prepare the year's report (status "review"), write first words, email the founder
//   1 Jan  08:00 WIB  publish an approved report with the final numbers, email the donors, tell the founder
//   after 1 Jan       a report still waiting for approval: remind the founder every three days (for a month)
//
// The numbers and letters come from impact-core.js, the same code the Founder Console runs, so what
// the founder approved is what goes out. Emails are queued in the existing outbox (kinds "message"
// and "announcement") and sent by be-mail within the daily limit; dedupe keys make every email
// go out once, however often this runs. Every write goes through be_impact_server_put, which
// refuses to overwrite a newer copy (the founder may be editing at the same moment).
import "./impact-core.js";

// deno-lint-ignore no-explicit-any
type Any = any;
const Core: Any = (globalThis as Any).BrialImpactCore;

const DAY = 24 * 3600e3;
const wib = (t: number) => { const d = new Date(t + 7 * 3600e3); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 }; };

const PILLAR_NAMES: Record<string, string> = { scholarships: "Scholarships", worship: "Houses of Worship", library: "Library & Knowledge Center", foodland: "Reforestation & Land", foodclothing: "Food & Clothing", water: "Clean Water", transport: "Transportation", hospitals: "Hospitals", schools: "Schools", livestock: "Livestock & Enterprise", infra: "Sustainable Infrastructure" };
const RENAMES: Record<string, string> = { "Food & Land": "Reforestation & Land" };
const INTERNAL = ["LEGACY-SUMMARY", "PILLAR-GRANTS", "PILLAR-LINKS", "PILLAR-STATUS", "PAYMENT-CONFIG", "EBOOKS-CATALOG", "FOODLAND-CONTENT", "WORSHIP-CONTENT", "WATER-CONTENT", "SITE-CONTACT"];

// The few store methods the numbers need, over the raw database rows (same mapping as site/store.js)
export function serverStore(donRows: Any[], appRows: Any[]) {
  const dons = donRows.map(r => ({ ...(r.data || {}), id: r.id, name: r.name, amount: Number(r.amount) || 0 }));
  const apps = appRows.map(r => ({ ...(r.data || {}), id: r.id, email: r.email, name: r.name, status: r.status }));
  const byId = (id: string) => dons.find(d => d.id === id);
  const isInternal = (d: Any) => { if (!d) return true; const id = String(d.id || ""); return INTERNAL.indexOf(id) >= 0 || id.indexOf("PILLAR-CONTENT-") === 0 || String(d.name || "").slice(0, 2) === "__"; };
  const names = () => { const d = byId("PILLAR-STATUS"); return (d && d.data && d.data.names) || {}; };
  const S: Any = {
    isInternalDonation: isInternal,
    listDonations: () => dons.filter(d => !isInternal(d)),
    listApplicants: () => apps.filter(a => !a.deleted),
    getPillarGrants: () => { const d = byId("PILLAR-GRANTS"); const l = d && d.data && Array.isArray(d.data.grants) ? d.data.grants : []; return l.map((g: Any) => (g && RENAMES[g.pillar] ? { ...g, pillar: RENAMES[g.pillar] } : g)); },
    getLegacy: () => { const d = byId("LEGACY-SUMMARY"); return { totalFunds: 0, count: 0, scholars: [], ...((d && d.data) || {}) }; },
    getPillarContent: (key: string) => { const d = byId("PILLAR-CONTENT-" + key.toUpperCase()); return (d && d.data && d.data.content) || {}; },
    getPillarName: (key: string) => { const v = names()[key]; return typeof v === "string" && v.trim() ? v.trim() : PILLAR_NAMES[key] || ""; },
    pillarLabel: (x: string) => {
      if (!x) return x;
      if (PILLAR_NAMES[x] !== undefined) return S.getPillarName(x);
      const label = RENAMES[x] || x;
      const k = Object.keys(PILLAR_NAMES).find(k => PILLAR_NAMES[k] === label);
      return k ? S.getPillarName(k) : x;
    },
    reports: (): Any[] => { const d = byId("IMPACT-REPORTS"); return d && d.data && Array.isArray(d.data.reports) ? d.data.reports : []; },
  };
  return S;
}

async function all(admin: Any, table: string, cols: string) {
  const out: Any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from(table).select(cols).order("id").range(from, from + 999);
    if (error) throw new Error(table + ": " + error.message);
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}
const firstName = (s: string) => String(s || "").trim().split(/\s+/)[0].toLowerCase().replace(/^\p{L}/u, c => c.toUpperCase()).slice(0, 60);
const isEmail = (s: unknown) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || "").trim());

// One pass of the schedule. `now` can be set for tests.
export async function impactTick(admin: Any, now = Date.now()) {
  const log: string[] = [];
  const [donRows, appRows, ctx] = await Promise.all([
    all(admin, "donations", "id,name,amount,data,created_at"), all(admin, "applicants", "id,email,name,status,data"),
    admin.rpc("be_mail_worker_ctx"),
  ]);
  const founderTo = ctx && ctx.data && ctx.data.settings && isEmail(ctx.data.settings.founderTo) ? String(ctx.data.settings.founderTo).trim() : "hello@brialendowment.org";
  const S = serverStore(donRows, appRows);
  let reports: Any[] = S.reports();
  const put = async (rec: Any, rev: number) => {
    const { data, error } = await admin.rpc("be_impact_server_put", { p_report: rec, p_rev: rev || 0 });
    if (error) throw new Error(String(error.message).includes("stale") ? "stale" : "put: " + error.message);
    reports = data as Any[];
    return reports.find(r => Number(r.year) === Number(rec.year));
  };
  const queue = async (kind: string, ref: string, dedupe: string, payload: Any) => {
    const { data, error } = await admin.rpc("be_impact_server_mail", { p_kind: kind, p_ref: ref, p_dedupe: dedupe, p_payload: payload });
    if (error) throw new Error("mail: " + error.message);
    return data === true;
  };
  const toFounder = (note: { subject: string; body: string }, dedupe: string, ref: string) =>
    queue("message", ref, dedupe, { to: founderTo, from: "hello", subject: note.subject, body: note.body, sign: false });
  const summary = (snap: Any) => ({
    period: snap.period.label, scholars: snap.people.scholars, nations: snap.people.nations, pillars: snap.pillars,
    built: snap.built.map((b: Any) => `${b.n} ${String(b.label).replace(/ (shared|given)$/, "")}`), received: snap.money.received, given: snap.money.given, gifts: snap.gifts.count,
  });
  const w = wib(now);

  // ---- 1. prepare: from 20 December (and in January, if the year was missed) ----
  const target = w.m === 12 && now >= Core.draftAt(w.y) ? w.y : w.m === 1 ? w.y - 1 : null;
  if (target) {
    let cur = reports.find(r => Number(r.year) === target);
    if (!cur || cur.status === "draft") {
      const founding = cur ? !!cur.founding : !reports.some(r => r.status === "published" && Number(r.year) < target);
      const base = cur || Core.newReport(target, founding);
      const words = Core.draftWords(base, Core.compute(S, base));
      const rec = {
        ...base, status: "review", autoDraftedAt: new Date(now).toISOString(), reviewSince: new Date(now).toISOString(),
        intro: String(base.intro || "").trim() ? base.intro : words.intro,
        letter: String(base.letter || "").trim() ? base.letter : words.letter,
        plans: String(base.plans || "").trim() ? base.plans : words.plans,
        mailDonors: base.mailDonors !== false,
      };
      try { cur = await put(rec, cur ? cur.rev : 0); log.push(`prepared ${target}`); }
      catch (e) { log.push(`prepare ${target}: ${(e as Error).message}`); cur = undefined; }
    }
    if (cur && cur.status === "review") {
      const note = Core.founderNote("ready", cur, summary(Core.compute(S, cur)));
      if (await toFounder(note, `impact_ready:${target}`, cur.id)) log.push(`founder told ${target} is ready`);
    }
  }

  // ---- 2. publish approved reports whose day has come ----
  for (const rep of reports.slice()) {
    const y = Number(rep.year);
    if (rep.status !== "approved" || now < Core.publishAt(y)) continue;
    const snap = Core.compute(S, rep);
    const rec = { ...rep, status: "published", snapshot: snap, public: Core.publicPart(snap, rep), publishedAt: new Date(now).toISOString(), autoPublished: true };
    try { await put(rec, rep.rev); log.push(`published ${y}`); }
    catch (e) { log.push(`publish ${y}: ${(e as Error).message}`); continue; }
    await toFounder(Core.founderNote("published", rep, summary(snap)), `impact_published:${y}`, rep.id);
  }

  // ---- 3. email the donors once a report the schedule published is live ----
  for (const rep of reports.slice()) {
    const y = Number(rep.year);
    if (rep.status !== "published" || !rep.autoPublished || rep.mailDonors === false || rep.emailedAt) continue;
    const { data: donors, error } = await admin.rpc("be_impact_server_donors");
    if (error) { log.push("donors: " + error.message); continue; }
    const letter = Core.donorLetter(rep);
    let n = 0;
    for (const d of (donors || []) as Any[]) {
      const to = String(d.email || "").trim(); if (!isEmail(to)) continue;
      const fresh = await queue("announcement", "donor", `impact:${y}:${to.toLowerCase()}`, {
        to, from: "hello", audience: "donor", subject: letter.subject.slice(0, 200), body: letter.body.slice(0, 10000), sign: true, name: firstName(d.name),
      });
      if (fresh) n++;
    }
    try { await put({ ...rep, emailedAt: new Date(now).toISOString(), emailedCount: (Number(rep.emailedCount) || 0) + n }, rep.rev); log.push(`emailed ${n} donors for ${y}`); }
    catch (e) { log.push(`emailed ${n} donors for ${y}, record not updated: ${(e as Error).message}`); }
  }

  // ---- 4. a report still waiting after its publishing day: remind every three days, for a month ----
  for (const rep of reports) {
    const y = Number(rep.year), due = Core.publishAt(y);
    if (rep.status !== "review" || now < due || now > due + 31 * DAY) continue;
    const slot = Math.floor((now - due) / (3 * DAY));
    if (await toFounder(Core.founderNote("waiting", rep), `impact_waiting:${y}:${slot}`, rep.id)) log.push(`reminded ${y}`);
  }
  return { ok: true, log };
}
