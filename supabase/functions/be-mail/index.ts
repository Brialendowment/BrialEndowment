// Brial Endowment: email worker (receipts and notices), sent through Resend.
//
// POST { action: "drain" }            header x-be-hook: <secret from be_private.mail_settings>
//   Called by the database (pg_net) right after an event is queued, and by a
//   cron sweep every 10 minutes. Claims queued rows, builds each email from the
//   database, sends it, records the result.
//
// POST { action: "receipt_pdf", donationId }   Authorization: founder session
// POST { action: "sample_pdf" }                Authorization: founder session
// POST { action: "preview", kind: "receipt" }  Authorization: founder session
// POST { action: "mail_view", id }             Authorization: founder session
//   The email as it went out (stored since 19 Oct 2026), or rebuilt from the
//   current records for older ones.
// POST { action: "mail_pdf", id, index }       Authorization: founder session
//   A PDF attached to that email, rebuilt from the same records.
// POST { action: "preview_announcement", message }   Authorization: founder session
// POST { action: "unsubscribe" | "resubscribe", a, e, t }   no session: the signed link from an email
// POST ?u=1&a=&e=&t=   one-click unsubscribe (RFC 8058), kept working for emails already sent with that header
//
// Secrets: RESEND_API_KEY (a sending-only key limited to brialendowment.org).
import { createClient } from "npm:@supabase/supabase-js@2";
import * as R from "./render.ts";
import { receiptPdf, type ReceiptData } from "./pdf.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") || "";

const DAILY_CAP = 90; // Resend free plan: 100 a day
const FROM = {
  receipts: "The Brial Endowment <receipts@brialendowment.org>",
  hello: "The Brial Endowment <hello@brialendowment.org>",
  desk: "Brial Endowment Desk <desk@brialendowment.org>",
};
// Senders the founder can choose when writing an email. Replies always come back to hello@.
export const SENDERS: Record<string, string> = {
  brial: "Brial Asif Hayi Paka <brial@brialendowment.org>",
  hello: "The Brial Endowment <hello@brialendowment.org>",
  receipts: "The Brial Endowment <receipts@brialendowment.org>",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const isEmail = (s: unknown) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || "").trim());
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function b64(bytes: Uint8Array) {
  let s = ""; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode(...bytes.subarray(i, i + CH));
  return btoa(s);
}

// ---------------------------------------------------------------- data
async function ctx() {
  const { data, error } = await admin.rpc("be_mail_worker_ctx");
  if (error || !data) throw new Error("ctx");
  return data as { settings: any; secret: string; sent24h: number };
}
async function one(table: string, id: string) {
  const { data } = await admin.from(table).select("*").eq("id", id).maybeSingle();
  return data;
}
const applicantDoc = (row: any) => (row ? { ...(row.data || {}), id: row.id, email: row.email, name: row.name, status: row.status } : null);
const donationDoc = (row: any) => (row ? { ...(row.data || {}), id: row.id, name: row.name, amount: Number(row.amount) || 0 } : null);

async function receiptFor(donationId: string) {
  const { data, error } = await admin.rpc("be_mail_receipt", { p_donation_id: donationId });
  if (error) throw new Error("receipt: " + error.message);
  return data as any;
}
function receiptData(d: any, rc: any): ReceiptData {
  return {
    no: rc.no, amount: Number(rc.amount) || 0, donorName: R.donorName(d) || "Anonymous donor",
    email: d.email || "", country: d.country || "", reportedAt: d.submittedAt, verifiedAt: d.verifiedAt || rc.issued_at,
    issuedAt: rc.issued_at, reference: String(d.txHash || "").trim(),
  };
}

// ---------------------------------------------------------------- compose
type Mail = { to: string; from: string; replyTo?: string; subject: string; html: string; text: string; attachments?: { filename: string; content: string }[]; headers?: Record<string, string> };
type Built = Mail | { skip: string };

// view = true rebuilds an email that was already sent, for reading: the checks that
// stop a stale email from going out are skipped, nothing is sent.
async function build(row: any, settings: any, view = false): Promise<Built> {
  const kind = row.kind as string, p = row.payload || {};
  const founderTo = isEmail(settings.founderTo) ? settings.founderTo : R.HELLO;

  if (kind === "test") return { to: founderTo, from: FROM.desk, replyTo: R.HELLO, ...R.testEmail(founderTo) };
  if (kind === "message") return await composeMessage(p, view ? row.sent_at || row.created_at : undefined);
  if (kind === "announcement") return await composeAnnouncement(p);

  if (kind === "receipt" || kind === "donation_reported") {
    const d = donationDoc(await one("donations", row.ref));
    if (!d) return { skip: "gift no longer exists" };
    if (kind === "donation_reported") {
      if (d.verified && !view) return { skip: "already verified" };
      return { to: founderTo, from: FROM.desk, replyTo: isEmail(d.email) ? d.email : R.HELLO, ...R.donationReported(d) };
    }
    if (!d.verified) return { skip: "gift is not verified" };
    const to = String(p.to || d.email || "").trim();
    if (!isEmail(to)) return { skip: "no email address" };
    const rc = await receiptFor(d.id);
    if (!rc) return { skip: "no receipt" };
    const pdf = await receiptPdf(receiptData(d, rc));
    return {
      to, from: FROM.receipts, replyTo: R.HELLO, ...R.receiptEmail(d, rc, { copy: !!p.copy, note: p.note ? String(p.note).slice(0, 2000) : "" }),
      attachments: [{ filename: `Brial-Endowment-Receipt-${rc.no}.pdf`, content: b64(pdf) }],
    };
  }

  if (kind === "report_new" || kind === "report_reply") {
    const r = await one("reports", row.ref);
    if (!r) return { skip: "message no longer exists" };
    const a = applicantDoc(await one("applicants", r.applicant_id));
    if (kind === "report_new") return { to: founderTo, from: FROM.desk, replyTo: isEmail(a?.email) ? a!.email : R.HELLO, ...R.reportNew(r, a) };
    if (!a || !isEmail(a.email)) return { skip: "no email address" };
    return { to: a.email, from: FROM.hello, replyTo: R.HELLO, ...R.reportReply(r, a) };
  }

  const a = applicantDoc(await one("applicants", row.ref));
  if (!a || a.deleted) return { skip: "account no longer exists" };
  const sem = p.sem ? (a.semesters || []).find((s: any) => s.id === p.sem) : null;
  const req = p.req ? (a.changeRequests || []).find((x: any) => x.id === p.req) : null;
  const toFounder = (m: { subject: string; html: string; text: string }) => ({ to: founderTo, from: FROM.desk, replyTo: isEmail(a.email) ? a.email : R.HELLO, ...m });
  const toScholar = (m: { subject: string; html: string; text: string }): Built =>
    isEmail(a.email) ? { to: a.email, from: FROM.hello, replyTo: R.HELLO, ...m } : { skip: "no email address" };

  switch (kind) {
    case "application_submitted": return toFounder(R.applicationSubmitted(a));
    case "application_received": return toScholar(R.applicationReceived(a));
    case "interview":
      if (!view && a.status !== "interview-scheduled") return { skip: "interview no longer scheduled" };
      return toScholar(R.interviewInvite(a));
    case "accepted": return view || a.status === "accepted" ? toScholar(R.accepted(a)) : { skip: "no longer accepted" };
    case "rejected": return view || a.status === "rejected" ? toScholar(R.rejected(a)) : { skip: "decision changed" };
    case "tuition_paid": return sem ? toScholar(R.tuitionPaid(a, sem)) : { skip: "semester not found" };
    case "bill_uploaded": return sem ? toFounder(R.billUploaded(a, sem)) : { skip: "semester not found" };
    case "ip_uploaded": return sem ? toFounder(R.ipUploaded(a, sem)) : { skip: "semester not found" };
    case "change_requested": return req ? toFounder(R.changeRequested(a, req)) : { skip: "request not found" };
    case "change_resolved": return req ? toScholar(R.changeResolved(a, req)) : { skip: "request not found" };
    case "scholar_status": return toScholar(R.scholarStatus(a, p.status, p.from));
    case "graduation": return toFounder(R.graduationAlert(a));
    case "interview_reminder":
      if (!view && (a.status !== "interview-scheduled" || !(new Date(a.interviewAt).getTime() > Date.now()))) return { skip: "interview no longer upcoming" };
      return toScholar(R.interviewReminder(a));
    case "bill_reminder": return sem && (view || sem.status === "current") ? toScholar(R.billReminder(a, sem)) : { skip: "bill already uploaded" };
    case "results_reminder": return sem && (view || sem.status === "paid") ? toScholar(R.resultsReminder(a, sem)) : { skip: "results already uploaded" };
    case "bill_due": return sem && (view || sem.status === "bill-uploaded") ? toFounder(R.billDue(a, sem, p.stage)) : { skip: "bill already paid" };
  }
  return { skip: "unknown kind " + kind };
}

async function composeMessage(p: any, issuedAt?: string): Promise<Built> {
  const to = String(p.to || "").trim();
  if (!isEmail(to)) return { skip: "no email address" };
  const ack = p.ack && Number(p.ack.amount) > 0 ? { ...p.ack, amount: Number(p.ack.amount), no: p.ack.no || ackNo(p.ack.date, to) } : null;
  const m = R.messageEmail({ subject: String(p.subject || "").slice(0, 200), body: String(p.body || "").slice(0, 10000), sign: p.sign !== false, ack });
  const out: Mail = { to, from: SENDERS[p.from] || SENDERS.hello, replyTo: R.HELLO, ...m };
  if (ack && ack.pdf) {
    const pdf = await receiptPdf({ no: ack.no, amount: ack.amount, donorName: String(ack.name || "").trim() || "A friend of the endowment", email: to,
      issuedAt: issuedAt || new Date().toISOString(), reference: String(ack.reference || "").trim(), ack: { programme: String(ack.programme || ""), date: ack.date } });
    out.attachments = [{ filename: `Brial-Endowment-Acknowledgement-${ack.no}.pdf`, content: b64(pdf) }];
  }
  return out;
}
// ---------------------------------------------------------------- announcements and unsubscribing
// The unsubscribe link carries the address and a signature made with the worker's secret, so it
// works without signing in and cannot be forged for someone else's address.
const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) => { try { return decodeURIComponent(escape(atob(String(s).replace(/-/g, "+").replace(/_/g, "/")))); } catch { return ""; } };
let secretCache = "", secretCacheAt = 0;
async function secret() {
  if (!secretCache || Date.now() - secretCacheAt > 300000) { secretCache = (await ctx()).secret; secretCacheAt = Date.now(); }
  return secretCache;
}
async function sign(audience: string, email: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(await secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`unsub:${audience}:${email.toLowerCase()}`)));
  return b64(mac).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "").slice(0, 32);
}
async function unsubLinks(audience: string, email: string) {
  const q = `a=${audience}&e=${b64url(email.toLowerCase())}&t=${await sign(audience, email)}`;
  return { page: `${R.SITE}/unsubscribe?${q}`, oneClick: `${URL_}/functions/v1/be-mail?u=1&${q}` };
}
async function checkLink(a: unknown, e: unknown, t: unknown) {
  const audience = String(a || ""), email = unb64url(String(e || "")).trim().toLowerCase();
  if (!["donor", "awardee"].includes(audience) || !isEmail(email) || !t) return null;
  const want = await sign(audience, email);
  if (want.length !== String(t).length) return null;
  let diff = 0; for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ String(t).charCodeAt(i);
  return diff === 0 ? { audience, email } : null;
}
async function composeAnnouncement(p: any): Promise<Built> {
  const to = String(p.to || "").trim();
  if (!isEmail(to)) return { skip: "no email address" };
  const audience = p.audience === "awardee" ? "awardee" : "donor";
  if (audience === "donor") {
    // someone may unsubscribe while the email is still waiting in the queue
    const { data } = await admin.rpc("be_mail_is_unsubscribed", { p_audience: audience, p_email: to });
    if (data === true) return { skip: "unsubscribed" };
  }
  const links = audience === "donor" ? await unsubLinks(audience, to) : null;
  const m = R.announcementEmail({ subject: String(p.subject || "").slice(0, 200), body: String(p.body || "").slice(0, 10000), sign: p.sign === true, audience, unsubscribe: links?.page, name: p.name ? String(p.name).slice(0, 60) : "" });
  // No List-Unsubscribe header: Gmail files mail carrying it as bulk (Promotions or Updates). It is only
  // required from senders of 5,000+ emails a day; the signed link in the footer still lets anyone stop.
  return { to, from: SENDERS[p.from] || SENDERS.hello, replyTo: R.HELLO, ...m };
}

function ackNo(date: unknown, to: string) {
  const d = new Date(String(date || "")); const ymd = isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  let h = 0; for (const c of to.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return "ACK-" + ymd.replace(/-/g, "") + "-" + h.toString(36).toUpperCase().slice(-4).padStart(4, "0");
}

// ---------------------------------------------------------------- send
async function send(m: Mail, key: string): Promise<{ ok: true; id: string } | { ok: false; retry: boolean; error: string }> {
  if (!RESEND_KEY) return { ok: false, retry: true, error: "RESEND_API_KEY is not set" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ from: m.from, to: [m.to], reply_to: m.replyTo, subject: m.subject, html: m.html, text: m.text, attachments: m.attachments, headers: m.headers }),
      signal: AbortSignal.timeout(20000),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body?.id) return { ok: true, id: body.id };
    const msg = `${res.status} ${body?.name || ""} ${body?.message || ""}`.trim();
    return { ok: false, retry: res.status === 429 || res.status >= 500, error: msg };
  } catch (e) {
    return { ok: false, retry: true, error: "network: " + String((e as Error)?.message || e) };
  }
}

// The copy the founder can read later. Attachments are kept by name only; PDFs are rebuilt on request.
async function keepCopy(id: number, m: Mail) {
  const { error } = await admin.rpc("be_mail_store", { p_id: id, p_from: m.from, p_reply_to: m.replyTo || null, p_html: m.html, p_text: m.text,
    p_attachments: (m.attachments || []).map(a => ({ filename: a.filename })) });
  if (error) console.error("be-mail keepCopy", id, error.message);
}

const done = (id: number, status: string, to: string | null, subject: string | null, resendId: string | null, error: string | null) =>
  admin.rpc("be_mail_done", { p_id: id, p_status: status, p_to: to, p_subject: subject, p_resend_id: resendId, p_error: error });

async function drain() {
  const started = Date.now();
  const c = await ctx();
  const settings = c.settings || {};
  let sent = 0, skipped = 0, failed = 0, budget = DAILY_CAP - (c.sent24h || 0);
  while (Date.now() - started < 40000) {
    if (settings.paused) break;
    const { data: rows, error } = await admin.rpc("be_mail_claim", { p_limit: 8 });
    if (error) throw new Error("claim: " + error.message);
    if (!rows || rows.length === 0) break;
    for (const row of rows) {
      const enabled = row.kind === "test" || row.kind === "message" || (settings.kinds || {})[row.kind] !== false;
      if (!enabled) { await done(row.id, "skipped", null, null, null, "turned off in settings"); skipped++; continue; }
      if (budget <= 0) { await done(row.id, "wait", null, null, null, "daily sending limit reached, will retry"); continue; }
      let m: Built;
      try { m = await build(row, settings); }
      catch (e) { await done(row.id, "retry", null, null, null, "build: " + String((e as Error)?.message || e)); failed++; continue; }
      if ("skip" in m) { await done(row.id, "skipped", null, null, null, m.skip); skipped++; continue; }
      await keepCopy(row.id, m);
      const r = await send(m, `be-mail-${row.id}`);
      if (r.ok) { await done(row.id, "sent", m.to, m.subject, r.id, null); sent++; budget--; }
      else { await done(row.id, r.retry ? "retry" : "failed", m.to, m.subject, null, r.error); failed++; }
      await sleep(550); // Resend allows 2 requests a second
    }
    if (budget <= 0) break;
  }
  return { sent, skipped, failed };
}

// ---------------------------------------------------------------- founder actions
async function isFounder(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+/.test(auth)) return false;
  const user = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data, error } = await user.rpc("be_is_founder");
  return !error && data === true;
}

const SAMPLE_D = { id: "D-0000", name: "Aisyah Rahmawati", email: "donor@example.com", country: "Indonesia", amount: 150, txHash: "0x7f3c9a41e2b8d5c06a1f4e9b2c7d8a3e5f6b1c2d", submittedAt: new Date(Date.now() - 2 * 864e5).toISOString(), verifiedAt: new Date().toISOString(), verified: true, anonymous: false };
const SAMPLE_RC = { no: "BE-" + new Date().getUTCFullYear() + "-0000", amount: 150, issued_at: new Date().toISOString() };

let lastSecret = "", secretAt = 0;
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  // One-click unsubscribe from the mailbox itself: a form POST to the address in List-Unsubscribe
  const q = new URL(req.url).searchParams;
  if (q.get("u") === "1") {
    try {
      const who = await checkLink(q.get("a"), q.get("e"), q.get("t"));
      if (who) await admin.rpc("be_mail_unsub_set", { p_audience: who.audience, p_email: who.email, p_on: true, p_source: "one-click" });
      return json({ ok: !!who }, who ? 200 : 400);
    } catch (e) { console.error("be-mail one-click", e); return json({ ok: false }, 500); }
  }
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }

  try {
    if (body?.action === "drain") {
      const hook = req.headers.get("x-be-hook") || "";
      if (!lastSecret || Date.now() - secretAt > 300000) { lastSecret = (await ctx()).secret; secretAt = Date.now(); }
      if (!hook || hook !== lastSecret) return json({ error: "forbidden" }, 403);
      return json(await drain());
    }

    // The unsubscribe page on the website: no session, the signed link is the proof
    if (body?.action === "unsubscribe" || body?.action === "resubscribe") {
      const who = await checkLink(body.a, body.e, body.t);
      if (!who) return json({ error: "invalid_link" }, 400);
      const { error } = await admin.rpc("be_mail_unsub_set", { p_audience: who.audience, p_email: who.email, p_on: body.action === "unsubscribe", p_source: "link" });
      if (error) throw new Error("unsub: " + error.message);
      const [user, host] = who.email.split("@");
      return json({ ok: true, unsubscribed: body.action === "unsubscribe", email: user.slice(0, 2) + "•••@" + host });
    }

    if (!(await isFounder(req))) return json({ error: "forbidden" }, 403);

    if (body?.action === "preview_announcement") {
      const p = body.message || {};
      const audience = p.audience === "awardee" ? "awardee" : "donor";
      const m = R.announcementEmail({ subject: String(p.subject || "(no subject)").slice(0, 200), body: String(p.body || "").slice(0, 10000), sign: p.sign === true, audience, unsubscribe: audience === "donor" ? R.SITE + "/unsubscribe" : undefined, name: p.previewName ? String(p.previewName).slice(0, 60) : "" });
      return json({ subject: m.subject, html: m.html, from: SENDERS[p.from] || SENDERS.hello });
    }

    if (body?.action === "receipt_pdf") {
      const id = String(body.donationId || "");
      const d = donationDoc(await one("donations", id));
      if (!d || !d.verified) return json({ error: "not_verified" }, 400);
      const rc = await receiptFor(id);
      if (!rc) return json({ error: "no_receipt" }, 400);
      const pdf = await receiptPdf(receiptData(d, rc));
      return json({ no: rc.no, filename: `Brial-Endowment-Receipt-${rc.no}.pdf`, base64: b64(pdf) });
    }
    if (body?.action === "sample_pdf") {
      const pdf = await receiptPdf({ ...receiptData(SAMPLE_D, SAMPLE_RC), sample: true });
      return json({ filename: "Brial-Endowment-Receipt-SAMPLE.pdf", base64: b64(pdf) });
    }
    if (body?.action === "preview_message") {
      const p = body.message || {};
      const ack = p.ack && Number(p.ack.amount) > 0 ? { ...p.ack, amount: Number(p.ack.amount) } : null;
      const m = R.messageEmail({ subject: String(p.subject || "(no subject)").slice(0, 200), body: String(p.body || "").slice(0, 10000), sign: p.sign !== false, ack });
      return json({ subject: m.subject, html: m.html, from: SENDERS[p.from] || SENDERS.hello });
    }
    if (body?.action === "mail_view" || body?.action === "mail_pdf") {
      const id = Number(body.id);
      if (!Number.isInteger(id) || id <= 0) return json({ error: "bad_request" }, 400);
      const { data: row, error } = await admin.rpc("be_mail_row", { p_id: id });
      if (error) throw new Error("row: " + error.message);
      if (!row) return json({ error: "not_found" }, 404);
      const meta = { id: row.id, kind: row.kind, status: row.status, sentAt: row.sent_at, createdAt: row.created_at, error: row.last_error };
      if (body.action === "mail_view" && row.html) {
        return json({ ...meta, stored: true, from: row.from_email, to: row.to_email, replyTo: row.reply_to, subject: row.subject,
          html: row.html, text: row.body_text, attachments: (row.attachments || []).map((a: any) => a.filename) });
      }
      if (row.status === "skipped") return json({ ...meta, stored: false, skipped: row.last_error || "not sent" });
      const m = await build(row, (await ctx()).settings || {}, true);
      if ("skip" in m) return json({ ...meta, stored: false, skipped: m.skip });
      if (body.action === "mail_pdf") {
        const a = (m.attachments || [])[Number(body.index) || 0];
        if (!a) return json({ error: "no_attachment" }, 404);
        return json({ filename: a.filename, base64: a.content });
      }
      return json({ ...meta, stored: false, rebuilt: true, from: m.from, to: row.to_email || m.to, replyTo: m.replyTo || null, subject: row.subject || m.subject,
        html: m.html, text: m.text, attachments: (m.attachments || []).map(a => a.filename) });
    }
    if (body?.action === "preview") {
      const m = R.receiptEmail(SAMPLE_D, SAMPLE_RC);
      return json({ subject: m.subject, html: m.html, from: FROM.receipts });
    }
    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("be-mail", e);
    return json({ error: "server_error" }, 500);
  }
});
