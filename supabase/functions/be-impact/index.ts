// Brial Endowment: the yearly Impact Report schedule (see impact.ts).
//
// POST { action: "tick" }       header x-be-hook: <secret from be_private.mail_settings>
//   Called hourly by pg_cron (be_private.impact_kick).
// POST { action: "tick_now" }   Authorization: founder session
//   The founder approved a report after its publishing day: publish now instead of within the hour.
//
// Deployed with verify_jwt off: both actions check their own proof (hook secret or founder session).
import { createClient } from "npm:@supabase/supabase-js@2";
import { impactTick } from "./impact.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-be-hook",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

let secret = "", secretAt = 0;
async function hookOk(req: Request) {
  const hook = req.headers.get("x-be-hook") || "";
  if (!hook) return false;
  if (!secret || Date.now() - secretAt > 300000) {
    const { data, error } = await admin.rpc("be_mail_worker_ctx");
    if (error || !data) return false;
    secret = String((data as { secret: string }).secret || ""); secretAt = Date.now();
  }
  return !!secret && hook === secret;
}
async function isFounder(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+/.test(auth)) return false;
  const user = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data, error } = await user.rpc("be_is_founder");
  return !error && data === true;
}

// one pass at a time per worker
let running: Promise<unknown> | null = null;
const tick = () => (running ||= impactTick(admin).finally(() => { running = null; }));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body: { action?: string };
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  try {
    if (body?.action === "tick") {
      if (!(await hookOk(req))) return json({ error: "forbidden" }, 403);
      return json(await tick());
    }
    if (body?.action === "tick_now") {
      if (!(await isFounder(req))) return json({ error: "forbidden" }, 403);
      return json(await tick());
    }
    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("be-impact", e);
    return json({ error: "server_error" }, 500);
  }
});
