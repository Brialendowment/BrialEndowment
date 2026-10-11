// ============================================================
// BRIAL FILES — Supabase Storage backed + in-page preview
// Uploads go to the brial-files bucket; the file's storage path
// is returned in metadata so it can be opened from any browser.
// ============================================================
(function () {
  const ALLOWED_MIME = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
  ]);
  const ALLOWED_EXT = new Set(["pdf", "png", "jpg", "jpeg", "webp", "gif"]);

  function validateFile(file) {
    if (!file) return { ok: false, error: "No file selected." };
    const name = (file.name || "").toLowerCase();
    const ext = name.split(".").pop();
    const mime = (file.type || "").toLowerCase();
    // Extension must always be on the allowlist, AND — when the browser
    // reports a MIME type — it must be allowed too. (Previously either one
    // passing was enough, letting e.g. "evil.pdf" with an executable MIME
    // type or "evil.exe" with a spoofed image MIME through.)
    const extOk = ALLOWED_EXT.has(ext);
    const mimeOk = !mime || mime === "application/octet-stream" || ALLOWED_MIME.has(mime);
    if (!extOk || !mimeOk) {
      return {
        ok: false,
        error: `File type not allowed. Only PDF and images (PNG, JPG, WebP) are accepted, not .${ext || "(unknown)"}.`,
      };
    }
    if (file.size > 1 * 1024 * 1024) {
      return { ok: false, error: "File is larger than 1 MB. Please compress the PDF (try Smallpdf / iLovePDF) or scan at lower DPI." };
    }
    return { ok: true };
  }

  function newKey() {
    return "f_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
  }
  function inferMime(file) {
    if (file?.type) return file.type;
    const name = (file?.name || "").toLowerCase();
    if (name.endsWith(".pdf")) return "application/pdf";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".webp")) return "image/webp";
    if (name.endsWith(".gif")) return "image/gif";
    return "application/octet-stream";
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  // ---------- In-page preview modal (vanilla DOM) ----------
  let activeModal = null;
  function closeModal() {
    if (!activeModal) return;
    document.body.removeChild(activeModal.root);
    activeModal.cleanup?.();
    activeModal = null;
    document.removeEventListener("keydown", onKey);
  }
  function onKey(e) { if (e.key === "Escape") closeModal(); }

  function btnStyle(color) {
    return `padding:8px 14px;background:${color};color:#0A1628;border:none;cursor:pointer;font-family:'Manrope',sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;`;
  }

  function showPreview({ name, size, uploadedAt, url, blob, mime, isPlaceholder, html }) {
    closeModal();
    document.addEventListener("keydown", onKey);
    const root = document.createElement("div");
    root.style.cssText = `position:fixed;inset:0;z-index:10000;background:rgba(6,14,28,0.9);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);display:flex;flex-direction:column;animation:brialFadeIn 0.25s ease-out;font-family:'Manrope',sans-serif;`;

    const header = document.createElement("div");
    header.style.cssText = `padding:16px 28px;display:flex;justify-content:space-between;align-items:center;gap:24px;background:rgba(10,22,40,0.85);color:#E8E4DC;border-bottom:1px solid rgba(201,169,97,0.2);`;
    const nameBlock = document.createElement("div");
    nameBlock.style.minWidth = "0";
    nameBlock.innerHTML = `
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#C9A961;letter-spacing:0.22em;text-transform:uppercase;">Brial Endowment · Document Preview${isPlaceholder ? " · Demo Seed" : ""}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:#E8E4DC;margin-top:4px;letter-spacing:-0.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(name || "Document")}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(232,228,220,0.5);margin-top:4px;letter-spacing:0.08em;">${size ? size + " MB · " : ""}${uploadedAt ? "Uploaded " + new Date(uploadedAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric"}) : ""}</div>
    `;
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:10px;align-items:center;flex-shrink:0;";

    if (url || blob) {
      const dlBtn = document.createElement("button");
      dlBtn.textContent = "Download ↓";
      dlBtn.style.cssText = btnStyle("#C9A961");
      dlBtn.onclick = () => {
        const a = document.createElement("a");
        if (blob) {
          a.href = URL.createObjectURL(blob);
          a.download = name || "file";
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        } else if (url) {
          a.href = url;
          a.download = name || "file";
          a.target = "_blank";
          a.click();
        }
      };
      actions.appendChild(dlBtn);
    }

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.title = "Close (Esc)";
    closeBtn.style.cssText = `width:36px;height:36px;background:transparent;color:rgba(232,228,220,0.8);border:1px solid rgba(232,228,220,0.25);cursor:pointer;font-size:22px;font-family:serif;display:flex;align-items:center;justify-content:center;`;
    closeBtn.onclick = closeModal;
    actions.appendChild(closeBtn);

    header.appendChild(nameBlock);
    header.appendChild(actions);
    root.appendChild(header);

    const body = document.createElement("div");
    body.style.cssText = `flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto;`;

    let cleanup = null;

    if (html) {
      const frame = document.createElement("iframe");
      frame.srcdoc = html;
      frame.style.cssText = `width:100%;max-width:900px;height:100%;border:none;background:white;box-shadow:0 60px 120px -40px rgba(0,0,0,0.7);`;
      body.appendChild(frame);
    } else {
      const effectiveUrl = url || (blob ? URL.createObjectURL(blob) : null);
      if (blob && !url) cleanup = () => URL.revokeObjectURL(effectiveUrl);
      const m = (mime || "").toLowerCase();
      if (m.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = effectiveUrl;
        img.alt = name;
        img.style.cssText = `max-width:100%;max-height:100%;box-shadow:0 60px 120px -40px rgba(0,0,0,0.7);background:white;`;
        body.appendChild(img);
      } else if (m === "application/pdf") {
        const frame = document.createElement("iframe");
        frame.src = effectiveUrl;
        frame.title = name;
        frame.style.cssText = `width:100%;max-width:1100px;height:100%;border:none;background:white;box-shadow:0 60px 120px -40px rgba(0,0,0,0.7);`;
        body.appendChild(frame);
      } else {
        const fallback = document.createElement("div");
        fallback.style.cssText = `color:rgba(232,228,220,0.7);text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;padding:60px;`;
        fallback.textContent = "Preview not available for this file type. Use Download.";
        body.appendChild(fallback);
      }
    }

    root.appendChild(body);
    root.addEventListener("click", e => { if (e.target === root) closeModal(); });
    document.body.appendChild(root);
    activeModal = { root, cleanup };
  }

  function placeholderHtml(fileMeta) {
    const name = fileMeta.name || fileMeta.filename || "Document";
    const date = fileMeta.uploadedAt
      ? new Date(fileMeta.uploadedAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric"})
      : "—";
    const size = fileMeta.size ? fileMeta.size + " MB · " : "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(name)}</title>
<style>html,body{margin:0;padding:0;min-height:100%;background:#F8F4EB;color:#0A1628;font-family:Georgia,serif;-webkit-font-smoothing:antialiased;}.doc{max-width:720px;margin:60px auto;padding:70px 80px;background:linear-gradient(180deg,#F8F4EB,#EDE6D4);border-top:4px solid #C9A961;box-shadow:0 30px 80px -20px rgba(0,0,0,0.25);position:relative;}.eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#8B7A4A;}h1{font-size:34px;font-weight:400;margin:18px 0 6px;line-height:1.1;letter-spacing:-0.01em;}.meta{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(10,22,40,0.55);margin-bottom:32px;letter-spacing:0.06em;}.body{font-size:16px;line-height:1.7;color:rgba(10,22,40,0.85);}.stamp{position:absolute;top:55px;right:60px;width:96px;height:96px;border:2px solid #C9A961;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;transform:rotate(-12deg);color:#8B7A4A;}.stamp .a{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:0.22em;}.stamp .b{font-family:serif;font-style:italic;font-size:22px;line-height:1;margin-top:4px;}.note{margin-top:32px;padding:14px 16px;background:rgba(201,169,97,0.14);border-left:3px solid #C9A961;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.55;color:rgba(10,22,40,0.75);letter-spacing:0.04em;}.footer{margin-top:40px;padding-top:18px;border-top:1px solid rgba(10,22,40,0.15);font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(10,22,40,0.5);letter-spacing:0.14em;}</style></head>
<body><div class="doc"><div class="stamp"><div class="a">DEMO</div><div class="b">B·E</div></div><div class="eyebrow">The Brial Endowment · Filed Document</div><h1>${escapeHtml(name)}</h1><div class="meta">${size}Uploaded ${date}</div><div class="body">This is a placeholder preview. The original document was uploaded as part of the seeded demo data and is not stored in the cloud bucket.<br/><br/>Real files uploaded by applicants and scholars are saved to Supabase Storage and render here, full document, when this button is clicked.</div><div class="note">Document hash · 0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}<br/>Filed under · ${escapeHtml(name)}<br/>Custody · Brial Endowment trust ledger</div><div class="footer">© MMXXVI · The Brial Endowment · Geneva · Singapore · Istanbul</div></div></body></html>`;
  }

  // ============================================================
  // Public API
  // ============================================================
  const BrialFiles = {
    validate: validateFile,
    allowedAccept: ".pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/png,image/jpeg,image/webp,image/gif",

    // Upload a File. Returns metadata { path, name, size, type, uploadedAt, url }.
    async put(file) {
      if (!file) return null;
      const v = validateFile(file);
      if (!v.ok) throw new Error(v.error);
      const sb = window.brialSupabase;
      if (!sb) throw new Error("Supabase client not initialized.");

      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `uploads/${newKey()}.${ext}`;
      const dc = sb.dataClient || sb.client;
      const { error } = await dc.storage
        .from(sb.bucket)
        .upload(path, file, {
          contentType: file.type || inferMime(file),
          cacheControl: "3600",
          upsert: false,
        });
      if (error) throw new Error("Upload failed: " + error.message);

      const url = sb.publicUrl(path);
      return {
        path,
        key: path, // back-compat alias
        name: file.name,
        size: +(file.size / 1024 / 1024).toFixed(2),
        type: file.type || inferMime(file),
        uploadedAt: new Date().toISOString(),
        url,
      };
    },

    // Open a stored file in the in-page preview modal.
    async open(fileMeta) {
      if (!fileMeta) return;
      const path = fileMeta.path || fileMeta.key;
      const sb = window.brialSupabase;
      let url = fileMeta.url;
      if (path && sb && !url) url = sb.publicUrl(path);

      if (url) {
        showPreview({
          name: fileMeta.name || fileMeta.filename,
          size: fileMeta.size,
          uploadedAt: fileMeta.uploadedAt,
          url,
          mime: fileMeta.type || inferMime(fileMeta),
        });
        return;
      }
      // Seed placeholder (no path / no url)
      showPreview({
        name: fileMeta.name || fileMeta.filename,
        size: fileMeta.size,
        uploadedAt: fileMeta.uploadedAt,
        html: placeholderHtml(fileMeta),
        isPlaceholder: true,
      });
    },

    closePreview: closeModal,

    // Delete a stored file (best-effort; ignores failures).
    // Uses the AUTH client: storage deletes are restricted to the
    // authenticated founder role (see db/supabase-schema.sql).
    async remove(path) {
      if (!path) return;
      const sb = window.brialSupabase;
      if (!sb) return;
      const dc = sb.client || sb.dataClient;
      try { await dc.storage.from(sb.bucket).remove([path]); } catch (e) { /* ignore */ }
    },
  };

  window.BrialFiles = BrialFiles;
})();
