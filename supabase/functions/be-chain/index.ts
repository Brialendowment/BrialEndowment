// Brial Endowment: automatic verification of USDT and BTC gifts, read straight from the chain.
//
// POST { action: "sweep" }            header x-be-hook: <secret from be_private.mail_settings>
//   Called by the database (pg_net) when a gift with a transaction hash is
//   reported, and by a cron sweep every 2 minutes while checks are due. Claims
//   due checks, reads each transaction from public RPC nodes, and hands the
//   result to be_chain_done(), which verifies the gift (the existing trigger then
//   issues the receipt number and emails the receipt) or leaves it for the founder.
//
// POST { action: "inspect", txHash }  header x-be-hook
//   Reads one transaction and returns what it found. Writes nothing.
//
// A gift is verified on its own only when ALL of these hold:
//   * the transaction succeeded and moved USDT (the official Tether contract)
//     to the endowment's wallet on the configured network, or on any network
//     below when the wallet is the endowment's own (usdt.anyEvm). An exchange
//     deposit address credits one network only, so for it a transfer on
//     another network is shown to the founder for review;
//   * it has the required confirmations;
//   * it is dated between 60 days before and 6 hours after the report;
//   * the amount received is at least the reported amount less 3% and $1
//     (exchange withdrawal fees). The receipt then shows the amount received;
//   * no other gift already claims the same transaction.
// Anything else stays unverified, with the reason shown in the Founder Console.
//
// Bitcoin (23 Oct 2026): a gift reported with method "btc" and a Bitcoin transaction id is
// read from public explorers (mempool.space, then blockstream.info). It is verified when
// it paid the endowment's BTC address with enough confirmations, in the same date window,
// and at least the reported BTC less 3%. Its dollar value is the BTC received times the
// price at the block's time (mempool.space historical price), and that is what the
// ledger and the receipt show.
//
// Own wallet (23 Oct 2026): when usdt.anyEvm is on, the USDT address is a self-custody
// wallet that receives on every EVM network, so a transfer on any of the networks below
// is verified. Addresses in usdt.previous (the old exchange deposit address) stay
// verifiable, but only on the network that exchange credits.
//
// No secrets: public RPC endpoints, several per network, tried in turn.
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });

type Net = { key: string; name: string; chainId: number; usdt: string; decimals: number; minConf: number; explorer: string; rpcs: string[] };
const NETS: Net[] = [
  { key: "eth", name: "Ethereum", chainId: 1, usdt: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6, minConf: 12, explorer: "https://etherscan.io/tx/",
    rpcs: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com", "https://1rpc.io/eth", "https://eth.drpc.org"] },
  { key: "bsc", name: "BNB Smart Chain", chainId: 56, usdt: "0x55d398326f99059ff775485246999027b3197955", decimals: 18, minConf: 15, explorer: "https://bscscan.com/tx/",
    rpcs: ["https://bsc-rpc.publicnode.com", "https://bsc-dataseed.bnbchain.org", "https://1rpc.io/bnb", "https://bsc.drpc.org"] },
  { key: "polygon", name: "Polygon", chainId: 137, usdt: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", decimals: 6, minConf: 64, explorer: "https://polygonscan.com/tx/",
    rpcs: ["https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com", "https://1rpc.io/matic", "https://polygon.drpc.org"] },
  { key: "arbitrum", name: "Arbitrum One", chainId: 42161, usdt: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", decimals: 6, minConf: 20, explorer: "https://arbiscan.io/tx/",
    rpcs: ["https://arbitrum-one-rpc.publicnode.com", "https://arb1.arbitrum.io/rpc", "https://1rpc.io/arb", "https://arbitrum.drpc.org"] },
];
const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const netFor = (label: string) => {
  const s = String(label || "").toLowerCase();
  if (/bep|bsc|bnb|binance/.test(s)) return "bsc";
  if (/polygon|matic/.test(s)) return "polygon";
  if (/arb/.test(s)) return "arbitrum";
  if (/trc|tron/.test(s)) return "tron";
  return "eth"; // ERC-20 / Ethereum
};

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

class RpcDown extends Error {}

// One JSON-RPC call, trying each node in turn. A node that answers with an
// error, times out or is rate limited is skipped. When a node says "null"
// (unknown transaction) a second node is asked before believing it.
async function call(net: Net, method: string, params: unknown[]) {
  let nulls = 0, lastErr = "";
  for (const url of net.rpcs) {
    try {
      const r = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(9000),
      });
      if (!r.ok) { lastErr = url + " " + r.status; continue; }
      const j = await r.json();
      if (j.error) { lastErr = url + " " + (j.error.message || "error"); continue; }
      if (j.result === null || j.result === undefined) { if (++nulls >= 2) return null; continue; }
      return j.result;
    } catch (e) { lastErr = url + " " + ((e as Error).message || "failed"); }
  }
  if (nulls > 0) return null;
  throw new RpcDown(net.name + ": " + lastErr);
}

const addr = (topic: string) => ("0x" + String(topic || "").slice(-40)).toLowerCase();
const cents = (raw: bigint, decimals: number) => Number((raw * 100n) / (10n ** BigInt(decimals))) / 100;

type Found = { net: Net; found: boolean; pending?: boolean; failed?: boolean; received?: number; from?: string; wallet?: string; block?: number; confirmations?: number; blockTime?: string; otherTokens?: string[] };

async function readOn(net: Net, tx: string, wallets: string[]): Promise<Found> {
  const rc = await call(net, "eth_getTransactionReceipt", [tx]);
  if (!rc) {
    const t = await call(net, "eth_getTransactionByHash", [tx]);
    return t ? { net, found: true, pending: true } : { net, found: false };
  }
  const block = parseInt(rc.blockNumber, 16);
  if (rc.status !== "0x1") return { net, found: true, failed: true, block };
  let raw = 0n, from = "", hit = "";
  const other = new Set<string>();
  for (const lg of rc.logs || []) {
    const t = lg.topics || [];
    if (t[0] !== TRANSFER || t.length < 3 || wallets.indexOf(addr(t[2])) < 0) continue;
    if (String(lg.address).toLowerCase() === net.usdt) hit = hit || addr(t[2]);
    if (String(lg.address).toLowerCase() !== net.usdt) { other.add(String(lg.address).toLowerCase()); continue; }
    raw += BigInt(lg.data && lg.data !== "0x" ? lg.data : "0x0");
    from = from || addr(t[1]);
  }
  const head = parseInt(await call(net, "eth_blockNumber", []), 16);
  const blk = await call(net, "eth_getBlockByNumber", [rc.blockNumber, false]);
  const blockTime = blk ? new Date(parseInt(blk.timestamp, 16) * 1000).toISOString() : undefined;
  return { net, found: true, received: raw > 0n ? cents(raw, net.decimals) : 0, from, wallet: hit, block, confirmations: Math.max(0, head - block + 1), blockTime, otherTokens: [...other] };
}

type Item = { id: string; txHash: string; amount: number; submittedAt: string | null; duplicateOf: string | null; method?: string | null; paid?: number | null };
type Prev = { address: string; network: string };
type Cfg = { address: string; network: string; confirmations: number; autoVerify?: boolean; anyEvm?: boolean; previous?: Prev[];
  btc?: { address: string; confirmations: number; autoVerify?: boolean; enabled?: boolean } };

// ---------- Bitcoin ----------
const BTC_APIS = ["https://mempool.space/api", "https://blockstream.info/api"];
async function btcGet(path: string, text = false) {
  let nulls = 0, lastErr = "";
  for (const base of BTC_APIS) {
    try {
      const r = await fetch(base + path, { signal: AbortSignal.timeout(9000) });
      if (r.status === 404 || r.status === 400) { if (++nulls >= 2) return null; continue; }
      if (!r.ok) { lastErr = base + " " + r.status; continue; }
      return text ? (await r.text()).trim() : await r.json();
    } catch (e) { lastErr = base + " " + ((e as Error).message || "failed"); }
  }
  if (nulls > 0) return null;
  throw new RpcDown("Bitcoin: " + lastErr);
}
// USD price of 1 BTC at a moment (falls back to the current price)
async function btcPrice(unix: number | null) {
  try {
    if (unix) {
      const r = await fetch(`https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${unix}`, { signal: AbortSignal.timeout(9000) });
      if (r.ok) { const j = await r.json(); const p = j && j.prices && j.prices[0] && Number(j.prices[0].USD); if (p > 0) return p; }
    }
    const r2 = await fetch("https://mempool.space/api/v1/prices", { signal: AbortSignal.timeout(9000) });
    if (r2.ok) { const j = await r2.json(); const p = Number(j && j.USD); if (p > 0) return p; }
  } catch (_) { /* fall through */ }
  return null;
}
async function checkBtc(it: Item, cfg: Cfg) {
  const b = cfg.btc || { address: "", confirmations: 2 };
  const tx = String(it.txHash || "").trim().toLowerCase().replace(/^0x/, "");
  const wallet = String(b.address || "").trim();
  if (b.autoVerify === false) return { status: "manual", token: "BTC", reason: "Automatic BTC checks are off. Check it on the explorer, then verify." };
  if (!/^[0-9a-f]{64}$/.test(tx)) return { status: "manual", token: "BTC", reason: "Not a Bitcoin transaction id. Check it by hand." };
  if (!/^(bc1[02-9ac-hj-np-z]{8,87}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/i.test(wallet)) return { status: "error", token: "BTC", reason: "The BTC address in Payment channels is not a Bitcoin address." };
  if (it.duplicateOf) return { status: "duplicate", token: "BTC", reason: `The same transaction is already claimed by gift ${it.duplicateOf}.` };
  const t = await btcGet("/tx/" + tx);
  const base = { network: "Bitcoin", token: "BTC", explorer: "https://mempool.space/tx/" + tx };
  if (!t) return { ...base, status: "not_found", reason: "The transaction is not on the Bitcoin network yet." };
  const w = wallet.toLowerCase();
  let sats = 0;
  for (const o of t.vout || []) if (String(o.scriptpubkey_address || "").toLowerCase() === w) sats += Number(o.value) || 0;
  const from = ((t.vin || [])[0] && t.vin[0].prevout && t.vin[0].prevout.scriptpubkey_address) || "";
  const received = Math.round(sats) / 1e8;
  const required = Math.max(1, Number(b.confirmations) || 2);
  if (!sats) return { ...base, status: "review", reason: "This transaction did not send BTC to the endowment's address." };
  if (!t.status || !t.status.confirmed) return { ...base, status: "waiting", received, from, confirmations: 0, required, reason: "Sent, waiting for the first block." };
  const tip = parseInt(String(await btcGet("/blocks/tip/height", true)), 10);
  const block = Number(t.status.block_height);
  const confirmations = tip && block ? Math.max(0, tip - block + 1) : 0;
  const blockTime = t.status.block_time ? new Date(Number(t.status.block_time) * 1000).toISOString() : undefined;
  const detail = { ...base, received, from, block, confirmations, required, blockTime };
  if (confirmations < required) return { ...detail, status: "waiting", reason: `${confirmations} of ${required} confirmations.` };
  const sub = it.submittedAt ? new Date(it.submittedAt).getTime() : NaN;
  const bt = blockTime ? new Date(blockTime).getTime() : NaN;
  if (!isNaN(sub) && !isNaN(bt) && (bt > sub + 6 * 3600e3 || bt < sub - 60 * 864e5)) {
    return { ...detail, status: "review", reason: `The transfer is dated ${blockTime!.slice(0, 10)}, far from when the gift was reported. Check that it is the donor's.` };
  }
  const claimed = Number(it.paid) || 0;
  if (claimed > 0 && received < claimed * 0.97) {
    return { ...detail, status: "review", reason: `Received ${received.toFixed(8)} BTC, but ${claimed} was reported.` };
  }
  const price = await btcPrice(t.status.block_time ? Number(t.status.block_time) : null);
  if (!price) return { ...detail, status: "error", reason: "Could not read the BTC price. Trying again." };
  return { ...detail, status: "verified", priceUsd: Math.round(price * 100) / 100, valueUsd: Math.round(received * price * 100) / 100, reason: "" };
}

async function check(it: Item, cfg: Cfg) {
  if (it.method === "btc") return checkBtc(it, cfg);
  const tx = String(it.txHash || "").trim().toLowerCase();
  const wallet = String(cfg.address || "").trim().toLowerCase();
  if (cfg.autoVerify === false) return { status: "manual", reason: "Automatic USDT checks are off. Check the hash on the explorer, then verify." };
  if (!/^0x[0-9a-f]{64}$/.test(tx)) return { status: "manual", reason: "Not an EVM transaction hash. Check it by hand." };
  if (!/^0x[0-9a-f]{40}$/.test(wallet)) return { status: "error", reason: "The USDT wallet address in Payment channels is not an EVM address." };
  if (it.duplicateOf) return { status: "duplicate", reason: `The same transaction is already claimed by gift ${it.duplicateOf}.` };
  const pref = netFor(cfg.network);
  if (pref === "tron") return { status: "manual", reason: "TRC-20 (Tron) gifts are not read automatically yet. Check it by hand." };
  const prev = (Array.isArray(cfg.previous) ? cfg.previous : []).map(p => ({ address: String(p && p.address || "").trim().toLowerCase(), network: String(p && p.network || "") })).filter(p => /^0x[0-9a-f]{40}$/.test(p.address) && p.address !== wallet);
  const wallets = [wallet, ...prev.map(p => p.address)];
  const order = [...NETS.filter(n => n.key === pref), ...NETS.filter(n => n.key !== pref)];
  let down = "";
  let r: Found | null = null;
  for (const net of order) {
    try { const f = await readOn(net, tx, wallets); if (f.found) { r = f; break; } }
    catch (e) { down = down || (e as Error).message; }
  }
  if (!r) return down ? { status: "error", reason: "Could not reach the network: " + down } : { status: "not_found", reason: "The transaction is not on Ethereum, BNB Chain, Polygon or Arbitrum yet." };
  const base = { network: r.net.name, chainId: r.net.chainId, token: "USDT", explorer: r.net.explorer + tx };
  // the endowment's own wallet takes USDT on any of these networks; an exchange address only on its own
  const old = r.wallet && r.wallet !== wallet ? prev.find(p => p.address === r!.wallet) : null;
  const allowed = old ? netFor(old.network) : pref;
  if (r.net.key !== allowed && (old || !cfg.anyEvm)) {
    const want = NETS.find(n => n.key === allowed)!;
    return { ...base, status: "review", block: r.block, received: r.received, from: r.from,
      reason: `Sent on ${r.net.name}, but ${old ? "the old exchange address" : "the wallet"} takes USDT only on ${want.name}. Check with the exchange that it arrived before you verify it.` };
  }
  if (r.pending) return { ...base, status: "waiting", reason: "Sent, not yet in a block.", confirmations: 0, required: Math.max(r.net.minConf, Number(cfg.confirmations) || 0) };
  if (r.failed) return { ...base, status: "review", reason: "The transaction failed on chain, so nothing arrived.", block: r.block };
  const required = Math.max(r.net.minConf, Number(cfg.confirmations) || 0);
  const detail = { ...base, received: r.received, from: r.from, block: r.block, confirmations: r.confirmations, required, blockTime: r.blockTime };
  if (!r.received) {
    return { ...detail, status: "review", reason: r.otherTokens && r.otherTokens.length
      ? "This transaction sent a different token to the wallet, not USDT."
      : "This transaction did not send USDT to the endowment's wallet." };
  }
  if ((r.confirmations || 0) < required) return { ...detail, status: "waiting", reason: `${r.confirmations} of ${required} confirmations.` };
  const sub = it.submittedAt ? new Date(it.submittedAt).getTime() : NaN;
  const bt = r.blockTime ? new Date(r.blockTime).getTime() : NaN;
  if (!isNaN(sub) && !isNaN(bt) && (bt > sub + 6 * 3600e3 || bt < sub - 60 * 864e5)) {
    return { ...detail, status: "review", reason: `The transfer is dated ${r.blockTime!.slice(0, 10)}, far from when the gift was reported. Check that it is the donor's.` };
  }
  const claimed = Number(it.amount) || 0;
  if (r.received! < claimed * 0.97 - 1) {
    return { ...detail, status: "review", reason: `Received ${r.received!.toFixed(2)} USDT, but ${claimed.toFixed(2)} was reported.` };
  }
  return { ...detail, status: "verified", reason: "" };
}

async function ctx() {
  const { data, error } = await admin.rpc("be_mail_worker_ctx");
  if (error) throw error;
  return data as { secret: string };
}

async function sweep() {
  const { data, error } = await admin.rpc("be_chain_claim", { p_limit: 8 });
  if (error) throw error;
  const cfg = (data && data.config) || {};
  const items: Item[] = (data && data.items) || [];
  const out: Record<string, number> = {};
  for (const it of items) {
    let res: Record<string, unknown>;
    try { res = await check(it, cfg); }
    catch (e) { res = { status: "error", reason: String((e as Error).message || e).slice(0, 300) }; }
    res.checkedAt = new Date().toISOString();
    const { error: e2 } = await admin.rpc("be_chain_done", { p_id: it.id, p_tx: it.txHash, p_result: res });
    if (e2) console.error("be_chain_done", it.id, e2.message);
    out[String(res.status)] = (out[String(res.status)] || 0) + 1;
  }
  return { checked: items.length, ...out };
}

let lastSecret = "", secretAt = 0;
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  try {
    const hook = req.headers.get("x-be-hook") || "";
    if (!lastSecret || Date.now() - secretAt > 300000) { lastSecret = (await ctx()).secret; secretAt = Date.now(); }
    if (!hook || hook !== lastSecret) return json({ error: "forbidden" }, 403);
    if (body?.action === "sweep") return json(await sweep());
    if (body?.action === "inspect") {
      const { data } = await admin.rpc("be_chain_claim", { p_limit: 0 });
      let cfg = (data && data.config) || {};
      // read-only test hooks (write nothing): "latest" picks a real transaction from a block a few
      // confirmations deep, and btcAddress "auto" checks it against its own first output address
      let txHash = String(body.txHash || "");
      if (body.method === "btc" && txHash === "latest") {
        const tip = parseInt(String(await btcGet("/blocks/tip/height", true)), 10);
        const hash = await btcGet("/block-height/" + (tip - 3), true);
        const ids = await btcGet("/block/" + hash + "/txids");
        txHash = (ids && ids[1]) || "";
      }
      let btcAddress = body.btcAddress ? String(body.btcAddress) : "";
      if (btcAddress === "auto") { const t = await btcGet("/tx/" + txHash); const o = t && (t.vout || []).find((v: any) => v.scriptpubkey_address); btcAddress = o ? o.scriptpubkey_address : ""; }
      if (btcAddress) cfg = { ...cfg, btc: { ...(cfg.btc || {}), address: btcAddress, autoVerify: true } };
      return json({ txHash, btcAddress: btcAddress || undefined, ...(await check({ id: "-", txHash, amount: Number(body.amount) || 0, submittedAt: body.submittedAt || null, duplicateOf: null, method: body.method || null, paid: Number(body.paid) || null }, cfg)) });
    }
    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error).message || e).slice(0, 300) }, 500);
  }
});
