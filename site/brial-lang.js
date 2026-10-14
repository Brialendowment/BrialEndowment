// ============================================================
// BRIAL LANG — retired (Oct 2026). The site is English-only; visitors use
// their browser's translation instead. This stub only clears a saved
// Indonesian choice and removes the old EN/ID pill if a cached page had it.
// ============================================================
(function () {
  "use strict";
  try { localStorage.removeItem("brial-lang"); } catch (e) {}
  function clean() { var p = document.getElementById("brial-lang-pill"); if (p) p.remove(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", clean);
  else clean();
})();
