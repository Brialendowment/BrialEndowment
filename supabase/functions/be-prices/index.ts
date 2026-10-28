// Brial Endowment: market data for the endowment's assets. Founder session only.
//
// POST { action: "search", q }
//   Stocks (Indonesia, United States and other markets), ETFs and crypto that match a name or a
//   ticker, with a logo for each. Sources: Yahoo Finance search and CoinGecko search.
// POST { action: "quote", items: [{ key, source: "yahoo" | "coingecko", symbol }], fx: ["IDR", ...] }
//   The latest price for each item, and how many units of each currency make one US dollar.
//   Indonesian prices from Yahoo Finance are delayed up to about 15 minutes.
//
// Founder session, or the worker secret (header x-be-hook) for the database's own checks.
// Nothing is stored here; the Founder Console keeps the holdings. Answers are cached for a minute.
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const UA = { "User-Agent": "Mozilla/5.0 (compatible; BrialEndowment/1.0; +https://brialendowment.org)", Accept: "application/json" };
export const LOGO = (symbol: string) => `https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`;

// The database's own checks call with the worker secret instead of a founder session
let hookSecret = "", hookAt = 0;
async function isHook(req: Request) {
  const h = req.headers.get("x-be-hook") || "";
  if (!h) return false;
  if (!hookSecret || Date.now() - hookAt > 300000) {
    const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data } = await admin.rpc("be_mail_worker_ctx");
    hookSecret = (data && data.secret) || ""; hookAt = Date.now();
  }
  return !!hookSecret && h === hookSecret;
}
async function isFounder(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+/.test(auth)) return false;
  const user = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data, error } = await user.rpc("be_is_founder");
  return !error && data === true;
}

const cache = new Map<string, { at: number; v: unknown }>();
async function cached<T>(key: string, ms: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ms) return hit.v as T;
  const v = await fn();
  cache.set(key, { at: Date.now(), v });
  if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  return v;
}
async function getJson(url: string) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(9000) });
  if (!r.ok) throw new Error(`${r.status} ${url.split("?")[0]}`);
  return await r.json();
}

// ---------------------------------------------------------------- quotes
type Quote = { price: number; prevClose?: number | null; currency?: string; at?: string | null; name?: string; exchange?: string; source: string };
async function yahooQuote(symbol: string): Promise<Quote> {
  return cached("y:" + symbol, 60000, async () => {
    const j = await getJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`);
    const m = j?.chart?.result?.[0]?.meta;
    if (!m || typeof m.regularMarketPrice !== "number") throw new Error("no price for " + symbol);
    return { price: m.regularMarketPrice, prevClose: m.chartPreviousClose ?? m.previousClose ?? null, currency: m.currency, name: m.longName || m.shortName,
      exchange: m.fullExchangeName || m.exchangeName, at: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null, source: "Yahoo Finance" };
  });
}
async function geckoQuotes(ids: string[]): Promise<Record<string, Quote>> {
  if (!ids.length) return {};
  const key = "g:" + [...ids].sort().join(",");
  return cached(key, 60000, async () => {
    const j = await getJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.map(encodeURIComponent).join(",")}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`);
    const out: Record<string, Quote> = {};
    for (const id of ids) {
      const x = j?.[id];
      if (x && typeof x.usd === "number") {
        const ch = typeof x.usd_24h_change === "number" ? x.usd_24h_change : null;
        out[id] = { price: x.usd, prevClose: ch !== null ? x.usd / (1 + ch / 100) : null, currency: "USD", at: x.last_updated_at ? new Date(x.last_updated_at * 1000).toISOString() : null, source: "CoinGecko" };
      }
    }
    return out;
  });
}
// units of each currency per one US dollar (IDR=X on Yahoo is "rupiah per dollar")
async function fxRates(curs: string[]) {
  const out: Record<string, number> = { USD: 1 };
  await Promise.all([...new Set(curs.map(c => String(c || "").toUpperCase()))].filter(c => /^[A-Z]{3}$/.test(c) && c !== "USD" && c !== "USDT").map(async c => {
    try { const q = await yahooQuote(c + "=X"); if (q.price > 0) out[c] = q.price; } catch (_e) { /* leave it out; the console falls back */ }
  }));
  if (curs.includes("USDT")) out.USDT = 1;
  return out;
}

// ---------------------------------------------------------------- search
type Hit = { cls: string; symbol: string; name: string; exchange?: string; currency?: string; source: "yahoo" | "coingecko"; priceSymbol: string; logo?: string };
const CUR_BY_EXCH: Record<string, string> = { JKT: "IDR", NMS: "USD", NYQ: "USD", NGM: "USD", NCM: "USD", PCX: "USD", ASE: "USD", BTS: "USD", NAS: "USD", PNK: "USD", LSE: "GBP", GER: "EUR", FRA: "EUR", PAR: "EUR", AMS: "EUR", SES: "SGD", HKG: "HKD", TYO: "JPY", KLS: "MYR", IST: "TRY", TOR: "CAD", ASX: "AUD" };
async function search(q: string): Promise<Hit[]> {
  const term = q.trim().slice(0, 40);
  if (term.length < 1) return [];
  const [ya, cg] = await Promise.all([
    cached("ys:" + term.toLowerCase(), 300000, () => getJson(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(term)}&quotesCount=10&newsCount=0&listsCount=0`)).catch(() => null),
    cached("cs:" + term.toLowerCase(), 300000, () => getJson(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(term)}`)).catch(() => null),
  ]);
  const hits: Hit[] = [];
  for (const x of (ya?.quotes || [])) {
    const t = String(x.quoteType || "");
    if (!["EQUITY", "ETF", "MUTUALFUND"].includes(t) || !x.symbol) continue;
    const idx = x.exchange === "JKT" || /\.JK$/.test(x.symbol);
    const us = ["NMS", "NYQ", "NGM", "NCM", "PCX", "ASE", "BTS", "NAS"].includes(x.exchange);
    hits.push({ cls: t === "EQUITY" ? (idx ? "idx" : us ? "us" : "intl") : "etf", symbol: String(x.symbol).replace(/\.JK$/, ""), name: x.longname || x.shortname || x.symbol,
      exchange: x.exchDisp || x.exchange, currency: CUR_BY_EXCH[x.exchange] || (idx ? "IDR" : undefined), source: "yahoo", priceSymbol: x.symbol, logo: LOGO(x.symbol) });
  }
  for (const c of (cg?.coins || []).slice(0, 6)) {
    hits.push({ cls: "crypto", symbol: String(c.symbol || "").toUpperCase(), name: c.name, exchange: c.market_cap_rank ? `Crypto · rank ${c.market_cap_rank}` : "Crypto", currency: "USD", source: "coingecko", priceSymbol: c.id, logo: c.large || c.thumb });
  }
  // an exact ticker first, then Indonesian, then the rest as the sources ranked them
  const T = term.toUpperCase();
  return hits.map((h, i) => ({ h, i, s: (h.symbol === T ? -100 : 0) + (h.cls === "idx" ? -10 : 0) + i }))
    .sort((a, b) => a.s - b.s).slice(0, 14).map(x => x.h);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  try {
    if (!(await isHook(req)) && !(await isFounder(req))) return json({ error: "forbidden" }, 403);
    if (body?.action === "search") return json({ results: await search(String(body.q || "")) });
    if (body?.action === "quote") {
      const items = (Array.isArray(body.items) ? body.items : []).slice(0, 100)
        .filter((x: any) => x && x.key && x.symbol && (x.source === "yahoo" || x.source === "coingecko"));
      const quotes: Record<string, Quote | { error: string }> = {};
      const gecko = items.filter((x: any) => x.source === "coingecko");
      const gq = await geckoQuotes([...new Set(gecko.map((x: any) => String(x.symbol)))] as string[]).catch(() => ({} as Record<string, Quote>));
      gecko.forEach((x: any) => { quotes[x.key] = gq[String(x.symbol)] || { error: "no price" }; });
      await Promise.all(items.filter((x: any) => x.source === "yahoo").map(async (x: any) => {
        try { quotes[x.key] = await yahooQuote(String(x.symbol)); } catch (e) { quotes[x.key] = { error: String((e as Error).message || e).slice(0, 120) }; }
      }));
      const fx = await fxRates(Array.isArray(body.fx) ? body.fx.slice(0, 20) : []);
      return json({ quotes, fx, at: new Date().toISOString() });
    }
    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("be-prices", e);
    return json({ error: "server_error" }, 500);
  }
});
