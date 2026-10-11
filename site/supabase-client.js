// ============================================================
// SUPABASE CLIENT — initializes the global Supabase client.
// Loaded BEFORE store.js. Exposes window.brialSupabase.
// ============================================================
(function () {
  const SUPABASE_URL = "https://sdlrjqdbxxzddgivnjws.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbHJqcWRieHh6ZGRnaXZuandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTA5MDAsImV4cCI6MjA5NTU2NjkwMH0.QZOgo2_R7VrjAFbRBU33YJE8xnwRdni_T65uLeP4Nps";
  const BUCKET = "brial-files";

  if (!window.supabase) {
    console.error("Supabase JS library not loaded. Add the CDN script BEFORE supabase-client.js.");
    return;
  }

  // Auth client — handles founder Supabase Auth login (persists session).
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "brial-auth" },
    realtime: { params: { eventsPerSecond: 5 } },
  });

  // Data client — ALWAYS anonymous. Never carries the founder JWT, so all
  // table reads/writes use the `anon` role and stay consistent with RLS,
  // regardless of whether the founder is logged in.
  const dataClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: "brial-data-anon" },
    realtime: { params: { eventsPerSecond: 5 } },
  });

  window.brialSupabase = {
    client,        // founder auth only
    dataClient,    // all table + realtime data
    bucket: BUCKET,
    url: SUPABASE_URL,
    privateBucket: "brial-private",
    publicUrl(path) {
      if (!path) return null;
      // Private documents have no public link: hand back a signed one
      // (fetched in the background, the page re-renders when it arrives).
      if (String(path).indexOf("docs/") === 0) {
        return window.BrialFiles && window.BrialFiles.signedUrlSync ? window.BrialFiles.signedUrlSync(path) : null;
      }
      return dataClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    },
  };
})();
