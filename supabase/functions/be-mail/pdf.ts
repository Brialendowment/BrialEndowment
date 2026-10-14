// The official receipt as an A4 PDF. Brand fonts are loaded once per worker
// (Cormorant Garamond + Manrope, SIL Open Font License); if the font CDN is unreachable the PDF
// still renders with built-in Helvetica, letters folded to plain Latin.
import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFPage } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";

const CDN = "https://cdn.jsdelivr.net/npm/@expo-google-fonts";
const FONT_URLS = {
  serif: `${CDN}/cormorant-garamond@0.4.1/500Medium/CormorantGaramond_500Medium.ttf`,
  sans: `${CDN}/manrope@0.4.2/400Regular/Manrope_400Regular.ttf`,
  sansBold: `${CDN}/manrope@0.4.2/600SemiBold/Manrope_600SemiBold.ttf`,
};
type FontBytes = Record<keyof typeof FONT_URLS, Uint8Array>;
let fontCache: Promise<FontBytes | null> | null = null;

export function setFontLoader(fn: (url: string) => Promise<Uint8Array>) { loader = fn; fontCache = null; }
let loader: (url: string) => Promise<Uint8Array> = async (url: string) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error("font " + r.status);
  return new Uint8Array(await r.arrayBuffer());
};
function loadFonts() {
  if (!fontCache) {
    fontCache = (async () => {
      try {
        const keys = Object.keys(FONT_URLS) as (keyof typeof FONT_URLS)[];
        const bytes = await Promise.all(keys.map(k => loader(FONT_URLS[k])));
        const out = {} as FontBytes;
        keys.forEach((k, i) => (out[k] = bytes[i]));
        return out;
      } catch (_e) {
        fontCache = null; // try again next time
        return null;
      }
    })();
  }
  return fontCache;
}

const NAVY = rgb(10 / 255, 22 / 255, 40 / 255);
const GILT = rgb(184 / 255, 149 / 255, 74 / 255);
const INK = rgb(28 / 255, 36 / 255, 51 / 255);
const MUTED = rgb(94 / 255, 102 / 255, 117 / 255);
const LINE = rgb(230 / 255, 224 / 255, 210 / 255);
const PAPER = rgb(250 / 255, 248 / 255, 242 / 255);

export type ReceiptData = {
  no: string; amount: number; donorName: string; email?: string; country?: string;
  reportedAt?: string; verifiedAt?: string; issuedAt?: string; reference?: string; sample?: boolean;
};

const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0131/g, "i").replace(/\u0130/g, "I").replace(/[\u0142\u0141]/g, "l")
    .replace(/[\u0111\u0110]/g, "d").replace(/\u00DF/g, "ss").replace(/[^\x20-\x7E\u00A0-\u00FF\u2014\u2013\u00B7\u2018\u2019\u201C\u201D\u2022]/g, "?");

const fmtDay = (iso?: string) => {
  const d = new Date(String(iso || ""));
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};
const money = (n: number) => (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function receiptPdf(r: ReceiptData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Receipt ${r.no} — The Brial Endowment`);
  doc.setAuthor("The Brial Endowment");
  doc.setSubject("Official donation receipt");
  doc.setCreator("brialendowment.org");
  doc.setProducer("brialendowment.org");
  doc.setCreationDate(new Date());

  const fb = await loadFonts();
  let F: { serif: PDFFont; serifIt: PDFFont; sans: PDFFont; sansBold: PDFFont };
  let T = (s: string) => s;
  if (fb) {
    doc.registerFontkit(fontkit);
    F = {
      // Cormorant has composite glyphs that pdf-lib's subsetter drops: embed it whole
      serif: await doc.embedFont(fb.serif, { subset: false }),
      serifIt: undefined as unknown as PDFFont,
      sans: await doc.embedFont(fb.sans, { subset: true }),
      sansBold: await doc.embedFont(fb.sansBold, { subset: true }),
    };
    F.serifIt = F.serif;
  } else {
    F = {
      serif: await doc.embedFont(StandardFonts.TimesRoman),
      serifIt: await doc.embedFont(StandardFonts.TimesRomanItalic),
      sans: await doc.embedFont(StandardFonts.Helvetica),
      sansBold: await doc.embedFont(StandardFonts.HelveticaBold),
    };
    T = fold;
  }

  const page = doc.addPage([595.28, 841.89]);
  const W = page.getWidth(), H = page.getHeight(), M = 56;
  const text = (p: PDFPage, s: string, x: number, y: number, font: PDFFont, size: number, color = INK, opts: { spacing?: number; align?: "right" | "center" } = {}) => {
    const str = T(s);
    let w = font.widthOfTextAtSize(str, size) + (opts.spacing || 0) * Math.max(0, str.length - 1);
    let xx = opts.align === "right" ? x - w : opts.align === "center" ? x - w / 2 : x;
    if (opts.spacing) {
      for (const ch of str) { p.drawText(ch, { x: xx, y, size, font, color }); xx += font.widthOfTextAtSize(ch, size) + opts.spacing; }
    } else p.drawText(str, { x: xx, y, size, font, color });
    return w;
  };
  const wrap = (s: string, font: PDFFont, size: number, max: number) => {
    const words = T(s).split(/\s+/); const lines: string[] = []; let cur = "";
    for (const w of words) { const t = cur ? cur + " " + w : w; if (font.widthOfTextAtSize(t, size) > max && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  };
  const fit = (s: string, font: PDFFont, size: number, max: number) => {
    let str = T(s); if (font.widthOfTextAtSize(str, size) <= max) return str;
    while (str.length > 1 && font.widthOfTextAtSize(str + "…", size) > max) str = str.slice(0, -1);
    return str + "…";
  };

  // frame
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: NAVY });
  page.drawRectangle({ x: 0, y: H - 10, width: W, height: 2, color: GILT });

  // letterhead
  let y = H - 64;
  const star = (cx: number, cy: number, s: number) => {
    page.drawSvgPath(`M 0 ${-s} L ${s * 0.28} ${-s * 0.28} L ${s} 0 L ${s * 0.28} ${s * 0.28} L 0 ${s} L ${-s * 0.28} ${s * 0.28} L ${-s} 0 L ${-s * 0.28} ${-s * 0.28} Z`, { x: cx, y: cy, color: GILT });
  };
  star(M + 7, y + 4, 7);
  text(page, "THE BRIAL ENDOWMENT", M + 22, y, F.sansBold, 9.5, NAVY, { spacing: 2.2 });
  text(page, "brialendowment.org", W - M, y, F.sans, 9, MUTED, { align: "right" });

  // title block
  y -= 62;
  text(page, "Official receipt", M, y + 26, F.sansBold, 8.5, GILT, { spacing: 1.8 });
  text(page, "Donation Receipt", M, y - 8, F.serif, 34, NAVY);
  text(page, "RECEIPT NO.", W - M, y + 26, F.sansBold, 8, MUTED, { align: "right", spacing: 1.4 });
  text(page, r.no, W - M, y + 2, F.sansBold, 15, NAVY, { align: "right" });
  text(page, "Issued " + fmtDay(r.issuedAt || r.verifiedAt), W - M, y - 14, F.sans, 9.5, MUTED, { align: "right" });

  // received from + amount
  y -= 52;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.8, color: LINE });
  y -= 30;
  const colR = W / 2 + 18;
  text(page, "RECEIVED FROM", M, y, F.sansBold, 8, MUTED, { spacing: 1.4 });
  text(page, "AMOUNT RECEIVED", colR, y, F.sansBold, 8, MUTED, { spacing: 1.4 });
  y -= 24;
  text(page, fit(r.donorName || "Anonymous donor", F.serif, 21, colR - M - 20), M, y, F.serif, 21, NAVY);
  text(page, "USD", colR, y + 1, F.sansBold, 10, GILT);
  text(page, money(r.amount), colR + 30, y - 4, F.serif, 32, NAVY);
  let ly = y - 20;
  for (const line of [r.email, r.country].filter(Boolean) as string[]) { text(page, fit(line, F.sans, 10, colR - M - 20), M, ly, F.sans, 10, MUTED); ly -= 15; }

  // details table
  y -= 78;
  const rows: [string, string][] = [
    ["Gift reported on", fmtDay(r.reportedAt)],
    ["Verified on", fmtDay(r.verifiedAt || r.issuedAt)],
    ["Payment reference", r.reference || "—"],
    ["Designation", "The Brial Endowment — general endowment fund"],
    ["Currency", "United States dollar (USD)"],
  ];
  page.drawRectangle({ x: M, y: y - rows.length * 30 + 8, width: W - 2 * M, height: rows.length * 30 + 14, color: PAPER, borderColor: LINE, borderWidth: 0.8 });
  let ry = y - 10;
  rows.forEach(([k, v], i) => {
    text(page, k, M + 16, ry, F.sans, 10, MUTED);
    text(page, fit(v, F.sansBold, 10.5, W - 2 * M - 190), M + 176, ry, F.sansBold, 10.5, INK);
    if (i < rows.length - 1) page.drawLine({ start: { x: M + 16, y: ry - 11 }, end: { x: W - M - 16, y: ry - 11 }, thickness: 0.5, color: LINE });
    ry -= 30;
  });

  // statement
  y = ry - 26;
  const stmt = [
    "This receipt confirms that The Brial Endowment received and verified the gift described above. No goods or services were provided in exchange for this gift.",
    "Every verified gift is recorded on the endowment's public ledger at brialendowment.org. Please keep this receipt for your records.",
  ];
  for (const para of stmt) {
    for (const line of wrap(para, F.sans, 10.5, W - 2 * M)) { text(page, line, M, y, F.sans, 10.5, INK); y -= 16; }
    y -= 8;
  }

  // thanks + signature
  y -= 22;
  text(page, "With gratitude,", M, y, F.serifIt, 15, NAVY);
  y -= 46;
  page.drawLine({ start: { x: M, y: y + 14 }, end: { x: M + 190, y: y + 14 }, thickness: 0.6, color: GILT });
  text(page, "Brial Asif Hayi Paka", M, y, F.sansBold, 10.5, INK);
  text(page, "Founder, The Brial Endowment", M, y - 14, F.sans, 9.5, MUTED);

  // seal
  const sx = W - M - 54, sy = y + 18;
  page.drawCircle({ x: sx, y: sy, size: 46, borderColor: GILT, borderWidth: 1.2 });
  page.drawCircle({ x: sx, y: sy, size: 40, borderColor: GILT, borderWidth: 0.5 });
  star(sx, sy + 12, 9);
  text(page, "VERIFIED", sx, sy - 10, F.sansBold, 8, GILT, { align: "center", spacing: 1.6 });
  text(page, r.no.replace(/^BE-/, ""), sx, sy - 22, F.sans, 7.5, GILT, { align: "center" });

  // footer
  page.drawLine({ start: { x: M, y: 70 }, end: { x: W - M, y: 70 }, thickness: 0.6, color: LINE });
  text(page, "The Brial Endowment  ·  brialendowment.org  ·  hello@brialendowment.org", M, 52, F.sans, 8.5, MUTED);
  text(page, "Issued electronically — valid without a handwritten signature.", M, 39, F.sans, 8.5, MUTED);
  text(page, r.no, W - M, 52, F.sansBold, 8.5, MUTED, { align: "right" });

  if (r.sample) {
    page.drawText(T("SAMPLE"), { x: W / 2 - 150, y: H / 2 - 40, size: 96, font: F.sansBold, color: GILT, opacity: 0.09, rotate: degrees(30) });
  }
  return await doc.save();
}
