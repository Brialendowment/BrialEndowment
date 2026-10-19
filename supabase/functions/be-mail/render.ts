// Email templates. Plain functions: data in, { subject, html, text } out.
// Everything that came from a person (names, messages) is escaped.

export const SITE = "https://brialendowment.org";
export const PORTAL = SITE + "/#/scholar";
export const DESK = SITE + "/#/admin";
export const LEDGER = SITE + "/#/proof";
export const HELLO = "hello@brialendowment.org";

const NAVY = "#0A1628", GILT = "#B8954A", GILT_SOFT = "#C9A961", INK = "#1C2433", MUTED = "#5E6675", LINE = "#E6E0D2", PAPER = "#F5F2EA";

export const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const nl2br = (s: unknown) => esc(s).replace(/\r?\n/g, "<br>");

export const titleCase = (s: unknown) =>
  String(s ?? "").toLowerCase().replace(/(^|[\s\-'’])(\p{L})/gu, (_m, a, b) => a + b.toUpperCase()).trim();
export const firstName = (s: unknown) => titleCase(s).split(/\s+/)[0] || "there";

export const usd = (n: unknown) =>
  "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const idr = (n: unknown) => "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID");

export function day(iso: unknown, tz = "UTC") {
  const d = new Date(String(iso || ""));
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: tz });
}
// One moment, written for readers across Indonesia and for the founder in Istanbul.
// A zone whose calendar day differs from Jakarta's shows its own day.
export function whenBoth(iso: unknown) {
  const d = new Date(String(iso || ""));
  if (isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  const ymd = (tz: string) => d.toLocaleDateString("en-CA", { timeZone: tz });
  const part = (tz: string, label: string) => {
    const t = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
    const other = ymd(tz) !== ymd("Asia/Jakarta") ? ` (${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: tz })})` : "";
    return `${t} ${label}${other}`;
  };
  return `${date}: ${part("Asia/Jakarta", "WIB")} · ${part("Asia/Makassar", "WITA")} · ${part("Asia/Jayapura", "WIT")} · ${part("Europe/Istanbul", "Istanbul")}`;
}

type Row = [string, string];
type Block = { pre: string; kicker?: string; title: string; intro: string; rows?: Row[]; body?: string; cta?: { label: string; href: string }; note?: string; foot?: string };

function rowsHtml(rows: Row[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:22px 0 4px;border-top:1px solid ${LINE}">` +
    rows.filter(r => r[1] !== "" && r[1] != null).map(([k, v]) =>
      `<tr><td style="padding:11px 0;border-bottom:1px solid ${LINE};color:${MUTED};font-size:13px;width:38%;vertical-align:top">${esc(k)}</td>` +
      `<td style="padding:11px 0;border-bottom:1px solid ${LINE};color:${INK};font-size:14px;font-weight:600;vertical-align:top;word-break:break-word">${v}</td></tr>`).join("") +
    `</table>`;
}

export function layout(b: Block) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(b.title)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(b.pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}"><tr><td align="center" style="padding:28px 14px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden">
<tr><td style="background:${NAVY};padding:22px 32px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td style="font-family:Georgia,'Times New Roman',serif;color:${GILT_SOFT};font-size:13px;letter-spacing:2px;text-transform:uppercase;white-space:nowrap">&#10022;&nbsp; The Brial Endowment</td>
  ${b.kicker ? `<td align="right" style="font-family:Arial,Helvetica,sans-serif;color:#C8CFDB;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">${esc(b.kicker)}</td>` : ""}
  </tr></table>
</td></tr>
<tr><td style="padding:34px 32px 30px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:${INK}">
  <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:27px;line-height:1.25;color:${NAVY}">${esc(b.title)}</h1>
  <div style="font-size:15px;line-height:1.65;color:${INK}">${b.intro}</div>
  ${b.rows && b.rows.length ? rowsHtml(b.rows) : ""}
  ${b.body ? `<div style="font-size:15px;line-height:1.65;color:${INK};margin-top:18px">${b.body}</div>` : ""}
  ${b.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 4px"><tr><td style="background:${NAVY};border-radius:999px"><a href="${esc(b.cta.href)}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:600;color:#F3E7C8;text-decoration:none">${esc(b.cta.label)} &rarr;</a></td></tr></table>` : ""}
  ${b.note ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${MUTED}">${b.note}</p>` : ""}
</td></tr>
<tr><td style="padding:18px 32px 24px;border-top:1px solid ${LINE};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED}">
  ${b.foot || `The Brial Endowment &middot; <a href="${SITE}" style="color:${GILT};text-decoration:none">brialendowment.org</a> &middot; <a href="mailto:${HELLO}" style="color:${GILT};text-decoration:none">${HELLO}</a>`}
</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    "THE BRIAL ENDOWMENT", "", b.title, "",
    stripHtml(b.intro),
    ...(b.rows || []).filter(r => r[1]).map(([k, v]) => `${k}: ${stripHtml(v)}`),
    b.body ? "\n" + stripHtml(b.body) : "",
    b.cta ? `\n${b.cta.label}: ${b.cta.href}` : "",
    b.note ? "\n" + stripHtml(b.note) : "",
    "", "· · ·", "The Brial Endowment · brialendowment.org · " + HELLO,
  ].join("\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  return { html, text };
}

export function stripHtml(s: string) {
  return String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h1|tr|table)>/gi, "\n\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&middot;/g, "·").replace(/&rarr;/g, "→").replace(/&#10022;/g, "✦")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
}

const quote = (s: unknown) =>
  `<div style="margin-top:6px;padding:12px 14px;background:${PAPER};border-left:3px solid ${GILT_SOFT};border-radius:6px;font-weight:400;font-size:14px;line-height:1.6">${nl2br(s)}</div>`;

// ---------------------------------------------------------------- donors
export function donorName(d: any) {
  const n = String(d?.name || "").trim();
  return !n || n === "Anonymous patron" ? "" : titleCase(n);
}

export function receiptEmail(d: any, rc: any, opts: { copy?: boolean; note?: string } = {}) {
  const name = donorName(d);
  const ref = String(d.txHash || "").trim();
  const note = String(opts.note || "").trim();
  const personal = note
    ? `<div style="margin:22px 0 4px;padding:18px 20px;background:${PAPER};border-left:3px solid ${GILT_SOFT};border-radius:8px">` +
      `<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:${INK}">${nl2br(note)}</div>` +
      `<div style="margin-top:12px;font-size:13px;color:${MUTED}"><b style="color:${NAVY}">Brial Asif Hayi Paka</b> &middot; Founder, The Brial Endowment</div></div>`
    : "";
  const b = layout({
    pre: note ? `A personal note from our founder, and your receipt ${rc.no}.` : `Receipt ${rc.no} for your gift of ${usd(rc.amount)}. Thank you.`,
    kicker: "Official receipt",
    title: name ? `Thank you, ${firstName(name)}.` : "Thank you for your gift.",
    intro: `<p style="margin:0">We have received and verified your gift of <b>${usd(rc.amount)}</b> to The Brial Endowment. Your official receipt is attached to this email as a PDF${opts.copy ? " (a copy of the original)" : ""}.</p>` + personal,
    rows: [
      ["Receipt number", esc(rc.no)],
      ["Amount", `${usd(rc.amount)} <span style="color:${MUTED};font-weight:400">USD</span>`],
      ["Received from", esc(name || "Anonymous donor")],
      ["Gift reported", esc(day(d.submittedAt))],
      ["Verified", esc(day(d.verifiedAt || rc.issued_at))],
      ["Payment reference", ref ? `<span style="font-family:Consolas,Menlo,monospace;font-weight:500">${esc(ref)}</span>` : ""],
    ],
    body: `<p style="margin:0">Every verified gift is recorded on our public ledger${d.anonymous ? ", listed anonymously as you asked" : ""}, so you can see where the endowment's money goes.</p>`,
    cta: { label: "See the public ledger", href: LEDGER },
    note: `Please keep this receipt for your records. No goods or services were provided in exchange for this gift. If any detail is wrong, simply reply to this email.`,
  });
  return { subject: `Your receipt ${rc.no} from The Brial Endowment`, ...b };
}

// ---------------------------------------------------------------- founder alerts
const deskFoot = `Sent by your website to the founder's inbox &middot; <a href="${DESK}" style="color:${GILT};text-decoration:none">Open the Founder Console</a> &middot; Change which alerts you get in Site settings → Email.`;

export function donationReported(d: any) {
  const b = layout({
    pre: `${usd(d.amount)} reported by ${d.name || "a donor"}. Check it against your wallet or bank.`,
    kicker: "Founder alert",
    title: `New gift reported: ${usd(d.amount)}`,
    intro: `<p style="margin:0">Someone reported a gift on the donate page. Match it with your wallet or bank, then verify it in the Treasury. The donor's receipt goes out automatically when you do.</p>`,
    rows: [
      ["Donor", esc(titleCase(d.name) || "Not given") + (d.anonymous ? ` <span style="color:${MUTED};font-weight:400">(wants to stay anonymous)</span>` : "")],
      ["Email", esc(d.email || "Not given")],
      ["Country", esc(d.country || "")],
      ["Amount", usd(d.amount)],
      ["Reference", d.txHash ? `<span style="font-family:Consolas,Menlo,monospace;font-weight:500">${esc(d.txHash)}</span>` : "Not given"],
      ["Reference no.", esc(d.id)],
    ],
    body: d.message ? `<b>Message</b>${quote(d.message)}` : "",
    cta: { label: "Verify in the Treasury", href: DESK },
    foot: deskFoot,
  });
  return { subject: `New gift reported: ${usd(d.amount)} from ${titleCase(d.name) || "a donor"}`, ...b };
}

function appRows(a: any): Row[] {
  const p = a.profile || {}, per = p.personal || {}, u = p.university || {};
  return [
    ["Applicant", esc(titleCase(a.name))],
    ["Email", esc(a.email)],
    ["Country", esc(titleCase(per.country))],
    ["University", esc(u.name)],
    ["Programme", esc([u.program, u.degreeLevel].filter(Boolean).join(" · "))],
    ["Current semester", esc(u.currentSemester)],
    ["GPA", esc(u.currentGPA)],
  ];
}

export function applicationSubmitted(a: any) {
  return { subject: `New application: ${titleCase(a.name)}`, ...layout({
    pre: `${titleCase(a.name)} submitted a scholarship application.`,
    kicker: "Founder alert", title: "A new application is waiting",
    intro: `<p style="margin:0">${esc(titleCase(a.name))} completed the profile and submitted an application for the scholarship.</p>`,
    rows: appRows(a), cta: { label: "Review the application", href: DESK }, foot: deskFoot,
  }) };
}

export function billUploaded(a: any, sem: any) {
  const amt = sem?.bill?.amount;
  return { subject: `Tuition bill to pay: ${titleCase(a.name)} · ${sem?.label || "semester"}`, ...layout({
    pre: `${titleCase(a.name)} uploaded the ${sem?.label || ""} tuition bill.`,
    kicker: "Founder alert", title: "A tuition bill is waiting",
    intro: `<p style="margin:0">${esc(titleCase(a.name))} uploaded the official bill for ${esc(sem?.label || "the semester")}. Check it, pay the university, then mark it paid in Disbursements.</p>`,
    rows: [["Scholar", esc(titleCase(a.name))], ["Scholar ID", esc(a.scholarId)], ["Semester", esc(sem?.label)], ["Amount on the bill", amt ? usd(amt) : ""], ["University deadline", esc(day(sem?.bill?.dueDate))]],
    cta: { label: "Open Disbursements", href: DESK }, foot: deskFoot,
  }) };
}

export function ipUploaded(a: any, sem: any) {
  return { subject: `Semester results: ${titleCase(a.name)} · ${sem?.label || ""}`.trim(), ...layout({
    pre: `${titleCase(a.name)} uploaded results for ${sem?.label || "a semester"}.`,
    kicker: "Founder alert", title: "Semester results uploaded",
    intro: `<p style="margin:0">${esc(titleCase(a.name))} uploaded the results for ${esc(sem?.label || "the semester")}.</p>`,
    rows: [["Scholar", esc(titleCase(a.name))], ["Semester", esc(sem?.label)], ["GPA this semester", esc(sem?.ip?.gpa)]],
    cta: { label: "Open the scholar's record", href: DESK }, foot: deskFoot,
  }) };
}

export function changeRequested(a: any, r: any) {
  const shown = r.type === "password" ? "a new password" : r.type === "email" ? esc(r.value) : esc(String(r.value ?? ""));
  return { subject: `Change request: ${titleCase(a.name)} · ${r.label || r.type}`, ...layout({
    pre: `${titleCase(a.name)} asked to change ${r.label || r.type}.`,
    kicker: "Founder alert", title: "A change needs your approval",
    intro: `<p style="margin:0">${esc(titleCase(a.name))} asked to change a detail that only you can approve.</p>`,
    rows: [["From", esc(titleCase(a.name))], ["Field", esc(r.label || r.type)], ["New value", shown], ["Note", esc(r.note || "")]],
    cta: { label: "Approve or decline", href: DESK }, foot: deskFoot,
  }) };
}

export function graduationAlert(a: any) {
  return { subject: `Graduation submitted: ${titleCase(a.name)}`, ...layout({
    pre: `${titleCase(a.name)} submitted graduation documents.`,
    kicker: "Founder alert", title: "A scholar has graduated",
    intro: `<p style="margin:0">${esc(titleCase(a.name))} uploaded the diploma and transcript. Their record now shows them as a graduate.</p>`,
    rows: [["Scholar", esc(titleCase(a.name))], ["Scholar ID", esc(a.scholarId)], ["Cohort", esc(a.cohort)]],
    cta: { label: "See the documents", href: DESK }, foot: deskFoot,
  }) };
}

export function reportNew(r: any, a: any) {
  const d = r.data || {};
  return { subject: `Help desk: ${d.subject || "new message"}, from ${titleCase(a?.name || d.applicantName)}`, ...layout({
    pre: `${titleCase(a?.name || d.applicantName)} wrote to the help desk.`,
    kicker: "Founder alert", title: "New message on the help desk",
    intro: `<p style="margin:0">${esc(titleCase(a?.name || d.applicantName))} sent a message from the scholar portal.</p>`,
    rows: [["From", esc(titleCase(a?.name || d.applicantName))], ["Email", esc(a?.email || d.applicantEmail)], ["Topic", esc(d.category)], ["Subject", esc(d.subject)]],
    body: `<b>Message</b>${quote(d.message)}`,
    cta: { label: "Reply on the help desk", href: DESK }, foot: deskFoot,
  }) };
}

// ---------------------------------------------------------------- applicants & scholars
const portalCta = { label: "Open your portal", href: PORTAL };
const scholarFoot = `The Brial Endowment &middot; <a href="${SITE}" style="color:${GILT};text-decoration:none">brialendowment.org</a> &middot; Questions? Reply to this email or write to <a href="mailto:${HELLO}" style="color:${GILT};text-decoration:none">${HELLO}</a>.`;
const hi = (a: any) => `<p style="margin:0 0 12px">Dear ${esc(firstName(a.name))},</p>`;

export function applicationReceived(a: any) {
  return { subject: "We've received your application to The Brial Endowment", ...layout({
    pre: "Your scholarship application is in. Here is what happens next.",
    kicker: "Application", title: "Your application is in",
    intro: hi(a) + `<p style="margin:0">Thank you for applying to The Brial Endowment scholarship. We have received your application and will read it carefully.</p>`,
    body: `<p style="margin:0"><b>What happens next</b></p><p style="margin:6px 0 0">We review every application ourselves. If yours is shortlisted, we will invite you to a short online interview. You will get an email with the date and the meeting link. You can follow your status at any time in your portal.</p>`,
    cta: portalCta, foot: scholarFoot,
  }) };
}

export function interviewInvite(a: any) {
  const link = String(a.meetingLink || "").trim();
  return { subject: "Your scholarship interview with The Brial Endowment", ...layout({
    pre: `Interview: ${whenBoth(a.interviewAt)}`,
    kicker: "Interview", title: "You're invited to an interview",
    intro: hi(a) + `<p style="margin:0">Your application has been shortlisted. We would like to meet you in a short online interview.</p>`,
    rows: [["When", esc(whenBoth(a.interviewAt))], ["Where", link ? `<a href="${esc(link)}" style="color:${GILT};word-break:break-all">${esc(link)}</a>` : "Online"]],
    body: `<p style="margin:0">Please join a few minutes early from a quiet place with a stable connection. If the time does not work for you, reply to this email as soon as you can.</p>`,
    cta: link ? { label: "Join the meeting", href: link } : portalCta, foot: scholarFoot,
  }) };
}

export function accepted(a: any) {
  const cur = (a.semesters || []).find((s: any) => s.status === "current");
  return { subject: "Congratulations, you are a Brial Scholar", ...layout({
    pre: "Your scholarship has been approved. Welcome.",
    kicker: "Scholarship", title: "Welcome, Brial Scholar",
    intro: hi(a) + `<p style="margin:0">We are delighted to tell you that your scholarship application has been <b>approved</b>. From here on, the endowment pays your tuition directly to your university, semester by semester.</p>`,
    rows: [["Scholar ID", esc(a.scholarId)], ["Cohort", esc(a.cohort)], ["First semester covered", esc(cur?.label)]],
    body: `<p style="margin:0"><b>Your first step</b></p><p style="margin:6px 0 0">Sign in to your portal and upload the official tuition bill${cur ? ` for ${esc(cur.label)}` : ""}. We pay it and you will get an email when it is done.</p>`,
    cta: portalCta, foot: scholarFoot,
  }) };
}

export function rejected(a: any) {
  return { subject: "About your scholarship application to The Brial Endowment", ...layout({
    pre: "An update on your application.",
    kicker: "Application", title: "An update on your application",
    intro: hi(a) + `<p style="margin:0">Thank you for applying to The Brial Endowment scholarship and for the time you put into your application.</p>`,
    body: `<p style="margin:0">After careful review, we are not able to offer you a scholarship this time. We receive more strong applications than we can fund, and this decision is not a judgement of your potential.</p><p style="margin:12px 0 0">We sincerely wish you every success in your studies.</p>`,
    foot: scholarFoot,
  }) };
}

export function tuitionPaid(a: any, sem: any) {
  const amt = sem?.bill?.amount;
  return { subject: `Your ${sem?.label || "semester"} tuition has been paid`, ...layout({
    pre: `The endowment has paid your ${sem?.label || ""} tuition.`,
    kicker: "Tuition", title: "Your tuition has been paid",
    intro: hi(a) + `<p style="margin:0">The endowment has paid your tuition for <b>${esc(sem?.label || "this semester")}</b> to your university.</p>`,
    rows: [["Semester", esc(sem?.label)], ["Amount", amt ? usd(amt) : ""], ["Paid on", esc(day(sem?.paidAt))], ["Payment reference", sem?.txHash ? `<span style="font-family:Consolas,Menlo,monospace;font-weight:500">${esc(sem.txHash)}</span>` : ""]],
    body: `<p style="margin:0">At the end of the semester, please upload your results (IP / KHS) in your portal. Keep studying well. We are proud of you.</p>`,
    cta: portalCta, foot: scholarFoot,
  }) };
}

export function changeResolved(a: any, r: any) {
  const ok = r.status === "approved";
  return { subject: `Your change request was ${ok ? "approved" : "declined"}`, ...layout({
    pre: `${r.label || "Your change"}: ${ok ? "approved" : "declined"}.`,
    kicker: "Account", title: ok ? "Your change was approved" : "Your change was declined",
    intro: hi(a) + `<p style="margin:0">Your request to change <b>${esc(r.label || r.type)}</b> has been ${ok ? "approved and is now in effect" : "declined"}.</p>`,
    rows: !ok && r.reason ? [["Reason", esc(r.reason)]] : [],
    body: r.type === "password" && ok ? `<p style="margin:0">Use your new password the next time you sign in.</p>` : "",
    cta: portalCta, foot: scholarFoot,
  }) };
}

export function scholarStatus(a: any, status: string, from: string) {
  const last = [...(a.statusHistory || [])].reverse().find((h: any) => h.status === status) || {};
  const reason = last.reason ? [["Note from the foundation", esc(last.reason)] as Row] : [];
  if (status === "graduated") return { subject: "Congratulations, graduate!", ...layout({
    pre: "Your graduation documents are in. Congratulations.",
    kicker: "Graduation", title: "Congratulations, graduate",
    intro: hi(a) + `<p style="margin:0">We have received your diploma and transcript. Completing your degree is a wonderful achievement, and it has been an honour to walk part of the way with you.</p>`,
    body: `<p style="margin:0">May what you have learned serve your family and your community for many years to come.</p>`, foot: scholarFoot,
  }) };
  if (status === "suspended") return { subject: "Your scholarship has been paused", ...layout({
    pre: "Your scholarship is on hold.", kicker: "Scholarship", title: "Your scholarship is on hold",
    intro: hi(a) + `<p style="margin:0">Your scholarship has been <b>paused</b>. Tuition payments are on hold until it is reactivated.</p>`,
    rows: reason, body: `<p style="margin:0">If you have questions or want to explain your situation, reply to this email.</p>`, cta: portalCta, foot: scholarFoot,
  }) };
  if (status === "revoked") return { subject: "Your scholarship has ended", ...layout({
    pre: "An important update on your scholarship.", kicker: "Scholarship", title: "Your scholarship has ended",
    intro: hi(a) + `<p style="margin:0">We are writing to let you know that your scholarship has been <b>ended</b>. No further tuition will be paid.</p>`,
    rows: reason, body: `<p style="margin:0">If you believe this is a mistake, reply to this email.</p>`, foot: scholarFoot,
  }) };
  return { subject: "Your scholarship is active again", ...layout({
    pre: "Your scholarship has been reactivated.", kicker: "Scholarship", title: "Your scholarship is active again",
    intro: hi(a) + `<p style="margin:0">Good news: your scholarship is <b>active</b> again${from === "suspended" ? " after the pause" : ""}. Tuition payments continue as before.</p>`,
    rows: reason, cta: portalCta, foot: scholarFoot,
  }) };
}

export function reportReply(r: any, a: any) {
  const d = r.data || {};
  return { subject: `Re: ${d.subject || "your message"}`, ...layout({
    pre: String(d.reply?.text || "").slice(0, 110),
    kicker: "Help desk", title: "We replied to your message",
    intro: hi(a) + `<p style="margin:0">The foundation has replied to your message <b>“${esc(d.subject || "")}”</b>.</p>`,
    body: `<b>Reply</b>${quote(d.reply?.text)}<p style="margin:18px 0 0;color:${MUTED};font-size:13px"><b>Your message</b></p>${quote(d.message)}`,
    cta: portalCta, foot: scholarFoot,
  }) };
}

export function testEmail(to: string) {
  return { subject: "Test email from The Brial Endowment", ...layout({
    pre: "Email from brialendowment.org is working.",
    kicker: "Test", title: "Email is working",
    intro: `<p style="margin:0">This test was sent from the Founder Console. If you are reading it at <b>${esc(to)}</b>, the website can send email from brialendowment.org and your inbox receives it.</p>`,
    rows: [["Receipts are sent from", "receipts@brialendowment.org"], ["Scholar notices are sent from", "hello@brialendowment.org"], ["Your alerts come from", "desk@brialendowment.org"], ["Replies go to", HELLO]],
    foot: deskFoot,
  }) };
}

// ---------------------------------------------------------------- messages written in the Founder Console
export type Message = {
  subject: string; body: string; sign?: boolean;
  ack?: { name?: string; amount?: number; programme?: string; date?: string; reference?: string; no?: string; pdf?: boolean } | null;
};
export const FOUNDER_SIGNATURE = `<div style="margin-top:22px;padding-top:14px;border-top:1px solid ${LINE};font-size:13px;color:${MUTED}"><b style="color:${NAVY};font-size:14px">Brial Asif Hayi Paka</b><br>Founder, The Brial Endowment</div>`;

export function messageEmail(m: Message) {
  const paras = String(m.body || "").replace(/\r\n/g, "\n").trim().split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px">${nl2br(p)}</p>`).join("");
  const a = m.ack;
  const rows: Row[] = a ? [
    ["Contributed by", esc(a.name || "")],
    ["Amount", a.amount ? `${usd(a.amount)} <span style="color:${MUTED};font-weight:400">USD</span>` : ""],
    ["Programme", esc(a.programme || "")],
    ["Date", esc(day(a.date))],
    ["Reference", a.reference ? `<span style="font-family:Consolas,Menlo,monospace;font-weight:500">${esc(a.reference)}</span>` : ""],
  ] : [];
  const b = layout({
    pre: String(m.body || "").replace(/\s+/g, " ").slice(0, 120),
    kicker: a ? "With gratitude" : "",
    title: m.subject,
    intro: `<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7">${paras}</div>` + (m.sign !== false ? FOUNDER_SIGNATURE : ""),
    rows,
    note: a ? `This acknowledges your contribution to the programme above, delivered through The Brial Endowment${a.pdf ? ". A PDF copy is attached for your records" : ""}. It is not a numbered donation receipt.` : "",
  });
  return { subject: m.subject, ...b };
}

// ---------------------------------------------------------------- reminders
export function interviewReminder(a: any) {
  const link = String(a.meetingLink || "").trim();
  return { subject: "Reminder: your scholarship interview is coming up", ...layout({
    pre: `Your interview: ${whenBoth(a.interviewAt)}`,
    kicker: "Reminder", title: "Your interview is coming up",
    intro: hi(a) + `<p style="margin:0">This is a friendly reminder of your scholarship interview with The Brial Endowment.</p>`,
    rows: [["When", esc(whenBoth(a.interviewAt))], ["Where", link ? `<a href="${esc(link)}" style="color:${GILT};word-break:break-all">${esc(link)}</a>` : "Online"]],
    body: `<p style="margin:0">Please join a few minutes early from a quiet place with a stable connection, and have your student card at hand. If something has come up, reply to this email as soon as you can.</p>`,
    cta: link ? { label: "Join the meeting", href: link } : portalCta, foot: scholarFoot,
  }) };
}

export function billReminder(a: any, sem: any) {
  return { subject: `Time to upload your ${sem?.label || "next semester"} tuition bill`, ...layout({
    pre: `Upload your ${sem?.label || ""} UKT bill so the endowment can pay it on time.`,
    kicker: "Reminder", title: "Time to upload your tuition bill",
    intro: hi(a) + `<p style="margin:0">A new semester is coming. So that the endowment can pay your tuition for <b>${esc(sem?.label || "the next semester")}</b> on time, please upload the official bill (UKT) as soon as your university issues it.</p>`,
    body: `<p style="margin:0"><b>How</b></p><p style="margin:6px 0 0">1. Download the bill from your university's portal.<br>2. Sign in to your Brial Scholar portal and open ${esc(sem?.label || "the semester")}.<br>3. Upload the bill with the amount and the payment deadline.</p><p style="margin:14px 0 0;color:${MUTED};font-size:14px">Already uploaded it? Then there is nothing to do. Thank you.</p>`,
    cta: portalCta, foot: scholarFoot,
  }) };
}

export function resultsReminder(a: any, sem: any) {
  return { subject: `Please upload your ${sem?.label || "semester"} results`, ...layout({
    pre: `Upload your IP / KHS for ${sem?.label || "last semester"}.`,
    kicker: "Reminder", title: "How did your semester go?",
    intro: hi(a) + `<p style="margin:0">The results for <b>${esc(sem?.label || "your last semester")}</b> should be out by now. Please upload your IP / KHS in your portal, together with your GPA.</p>`,
    body: `<p style="margin:0">Your results keep your scholarship record complete and help us support you well. Whatever the grades, we are behind you.</p><p style="margin:14px 0 0;color:${MUTED};font-size:14px">Already uploaded them? Then there is nothing to do. Thank you.</p>`,
    cta: portalCta, foot: scholarFoot,
  }) };
}

export function billDue(a: any, sem: any, stage: string) {
  const due = sem?.bill?.dueDate;
  const days = due ? Math.round((new Date(due + "T00:00:00Z").getTime() - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime()) / 864e5) : null;
  const waited = sem?.bill?.uploadedAt ? Math.max(1, Math.round((Date.now() - new Date(sem.bill.uploadedAt).getTime()) / 864e5)) : null;
  const head = stage === "overdue" ? "The tuition deadline has passed"
    : stage === "last" ? (days === 0 ? "Tuition is due today" : "Tuition is due tomorrow")
    : stage === "soon" ? `Tuition is due in ${days} days`
    : `A tuition bill has waited ${waited} days`;
  const amt = sem?.bill?.amount;
  return { subject: `${head}: ${titleCase(a.name)} · ${sem?.label || ""}`.trim(), ...layout({
    pre: `${titleCase(a.name)} · ${sem?.label || ""}${amt ? " · " + usd(amt) : ""}`,
    kicker: "Founder alert", title: head,
    intro: `<p style="margin:0">${stage === "overdue" ? `The university deadline for ${esc(titleCase(a.name))}'s ${esc(sem?.label || "")} tuition has passed and the bill is still unpaid. Please pay it or contact the scholar today.` : stage === "waiting" ? `${esc(titleCase(a.name))}'s ${esc(sem?.label || "")} bill is still waiting for payment. No deadline was given, so check the bill for the university's date.` : `${esc(titleCase(a.name))}'s ${esc(sem?.label || "")} tuition must reach the university soon. Pay it, then mark it paid in Disbursements.`}</p>`,
    rows: [["Scholar", esc(titleCase(a.name))], ["Semester", esc(sem?.label)], ["Amount", amt ? usd(amt) : ""], ["University deadline", esc(day(due))], ["Bill sent", esc(day(sem?.bill?.uploadedAt))]],
    cta: { label: "Open Disbursements", href: DESK }, foot: deskFoot,
  }) };
}
