// Brial Endowment — private document helper.
//
// POST { action: "sign", token, paths[] }
//   A scholar (session token from be_applicant_login / signup) gets short-lived
//   signed links for private documents that belong to HER OWN record.
//
// POST { action: "migrate" }   (founder login required)
//   Copies the planned old public files into the private bucket.
// POST { action: "cleanup" }   (founder login required)
//   Removes the old public copies once the private copy exists and the
//   scholar records point at it.
import { createClient } from "npm:@supabase/supabase-js@2";

const PUBLIC_BUCKET = "brial-files";
const PRIVATE_BUCKET = "brial-private";
const SIGN_SECONDS = 600;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

async function isFounder(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const userClient = createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await userClient.rpc("be_is_founder");
  return !error && data === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }

  try {
    if (body?.action === "sign") {
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
    }

    if (body?.action === "migrate" || body?.action === "cleanup") {
      if (!(await isFounder(req))) return json({ error: "forbidden" }, 403);

      if (body.action === "migrate") {
        const { data: rows, error } = await admin.rpc("be_file_moves_pending");
        if (error) return json({ error: "list_failed", detail: error.message }, 500);
        const done: string[] = [], failed: { path: string; error: string }[] = [];
        for (const r of rows || []) {
          const dl = await admin.storage.from(PUBLIC_BUCKET).download(r.old_path);
          if (dl.error || !dl.data) { failed.push({ path: r.old_path, error: dl.error?.message || "download" }); continue; }
          const up = await admin.storage.from(PRIVATE_BUCKET).upload(r.new_path, dl.data, {
            contentType: r.mime || dl.data.type || "application/octet-stream", upsert: true,
          });
          if (up.error) { failed.push({ path: r.old_path, error: up.error.message }); continue; }
          await admin.rpc("be_file_move_copied", { p_old: r.old_path });
          done.push(r.old_path);
        }
        return json({ copied: done.length, failed });
      }

      const { data: rem, error } = await admin.rpc("be_file_moves_removable");
      if (error) return json({ error: "list_failed", detail: error.message }, 500);
      const list: string[] = (rem || []).map((x: any) => (typeof x === "string" ? x : x.be_file_moves_removable));
      if (list.length === 0) return json({ removed: 0 });
      const { error: e3 } = await admin.storage.from(PUBLIC_BUCKET).remove(list);
      if (e3) return json({ error: "remove_failed", detail: e3.message }, 500);
      for (const p of list) await admin.rpc("be_file_move_removed", { p_old: p });
      return json({ removed: list.length });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    return json({ error: "server_error" }, 500);
  }
});
