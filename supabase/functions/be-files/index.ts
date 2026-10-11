// Brial Endowment — private document links for scholars.
//
// POST { action: "sign", token, paths[] }
//   A scholar (session token from be_applicant_login / signup) gets short-lived
//   signed links for private documents that belong to HER OWN record.
//   The founder signs her links directly with her Supabase login.
//
// (The one-time "migrate" / "cleanup" actions used on 11 Oct 2026 to move the
// old public files into the private bucket have been removed.)
import { createClient } from "npm:@supabase/supabase-js@2";

const PRIVATE_BUCKET = "brial-private";
const SIGN_SECONDS = 600;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  if (body?.action !== "sign") return json({ error: "unknown_action" }, 400);

  try {
    const token = body.token;
    const paths: unknown[] = Array.isArray(body.paths) ? body.paths : [];
    if (typeof token !== "string" || token.length < 20 || paths.length === 0 || paths.length > 50) {
      return json({ error: "bad_request" }, 400);
    }
    const { data: owned, error } = await admin.rpc("be_session_private_paths", { p_token: token });
    if (error) return json({ error: "invalid_session" }, 401);
    const mine = new Set<string>(owned || []);
    const allowed = [...new Set(paths.filter((p): p is string => typeof p === "string" && mine.has(p)))];
    if (allowed.length === 0) return json({ urls: {} });
    const { data, error: e2 } = await admin.storage.from(PRIVATE_BUCKET).createSignedUrls(allowed, SIGN_SECONDS);
    if (e2) return json({ error: "sign_failed" }, 500);
    const urls: Record<string, string> = {};
    (data || []).forEach((d: any) => { if (d.signedUrl && d.path) urls[d.path] = d.signedUrl; });
    return json({ urls, expiresIn: SIGN_SECONDS });
  } catch {
    return json({ error: "server_error" }, 500);
  }
});
