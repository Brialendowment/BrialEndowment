// Install The Brial Endowment as an app (it is a Progressive Web App).
// - Chrome, Edge and Android: the browser's own install prompt, offered from a small card and from
//   any element with [data-install-app] (footer links).
// - iPhone and iPad (no prompt exists there) and every other case: a short sheet with the exact steps,
//   including "open in your browser first" for people arriving inside Instagram or Facebook.
// - Nothing shows once the app is installed or opened from the home screen.
(function () {
  if (window.BrialInstall) return;
  var w = window, d = document, nav = navigator, ua = nav.userAgent || "";
  var KEY = "brial.install.dismissedAt", WAIT_DAYS = 60;
  var deferred = w.__brialBip || null; // captured early by the page head, before the bundle unpacked
  var installed = false;

  var isStandalone = function () {
    try { return (w.matchMedia && (w.matchMedia("(display-mode: standalone)").matches || w.matchMedia("(display-mode: fullscreen)").matches || w.matchMedia("(display-mode: minimal-ui)").matches)) || nav.standalone === true; } catch (e) { return false; }
  };
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var inApp = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|Bytedance|Snapchat|Twitter/i.test(ua);
  var isEdge = /Edg\//.test(ua), isFirefox = /Firefox|FxiOS/.test(ua);
  var isSafariMac = !isIOS && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);
  var isIOSSafari = isIOS && /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) && !inApp;

  var store = {
    get: function () { try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } },
    set: function () { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
  };

  // ---------- styles (injected once, scoped to b-ins-) ----------
  var css = [
    "html.b-standalone [data-install-app]{display:none!important}",
    ".b-ins-card{position:fixed;z-index:9000;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));max-width:400px;margin:0 auto;display:flex;gap:14px;align-items:center;padding:14px 14px 14px 16px;background:#0F1F38;border:1px solid rgba(201,169,97,.45);box-shadow:0 18px 50px rgba(0,0,0,.45);color:#E8E4DC;font-family:'Manrope',system-ui,sans-serif;opacity:0;transform:translateY(12px);transition:opacity .35s ease,transform .35s ease}",
    ".b-ins-card.on{opacity:1;transform:none}",
    "@media(min-width:761px){.b-ins-card{left:24px;right:auto;bottom:24px;margin:0}}",
    "@media(prefers-reduced-motion:reduce){.b-ins-card{transition:none}}",
    ".b-ins-card img{width:46px;height:46px;flex-shrink:0;border-radius:11px}",
    ".b-ins-t{font-size:14px;font-weight:600;line-height:1.35;color:#E8E4DC}",
    ".b-ins-s{font-size:12.5px;line-height:1.45;color:rgba(232,228,220,.72);margin-top:2px}",
    ".b-ins-acts{display:flex;flex-direction:column;gap:6px;flex-shrink:0}",
    ".b-ins-btn{min-height:40px;padding:0 16px;border:none;cursor:pointer;font-family:'Manrope',system-ui,sans-serif;font-size:13px;font-weight:600;letter-spacing:.04em;background:#C9A961;color:#0A1628}",
    ".b-ins-btn:focus-visible,.b-ins-x:focus-visible,.b-ins-later:focus-visible{outline:2px solid #E3C98A;outline-offset:2px}",
    ".b-ins-later{min-height:32px;padding:0 8px;border:none;background:none;cursor:pointer;color:rgba(232,228,220,.7);font-family:'Manrope',system-ui,sans-serif;font-size:12px}",
    ".b-ins-veil{position:fixed;inset:0;z-index:9001;background:rgba(5,12,24,.72);display:flex;align-items:flex-end;justify-content:center;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}",
    "@media(min-width:761px){.b-ins-veil{align-items:center}}",
    ".b-ins-sheet{position:relative;width:100%;max-width:460px;max-height:calc(100vh - 32px);overflow:auto;background:#0F1F38;border:1px solid rgba(201,169,97,.45);color:#E8E4DC;font-family:'Manrope',system-ui,sans-serif;padding:26px 24px 22px}",
    ".b-ins-sheet h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:28px;line-height:1.15;margin:12px 0 8px;color:#E8E4DC}",
    ".b-ins-eye{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#C9A961}",
    ".b-ins-sheet p{font-size:14px;line-height:1.6;color:rgba(232,228,220,.8);margin:0 0 6px}",
    ".b-ins-sheet ol{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:12px}",
    ".b-ins-sheet li{display:flex;gap:12px;align-items:flex-start;font-size:14px;line-height:1.55;color:rgba(232,228,220,.85)}",
    ".b-ins-sheet li>span:first-child{flex-shrink:0;width:24px;height:24px;margin-top:1px;border-radius:50%;border:1px solid rgba(201,169,97,.6);color:#C9A961;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;display:inline-flex;align-items:center;justify-content:center}",
    ".b-ins-sheet b{color:#E8E4DC;font-weight:600}",
    ".b-ins-x{position:absolute;top:10px;right:10px;width:40px;height:40px;border:none;background:none;color:rgba(232,228,220,.75);font-size:22px;cursor:pointer}",
    ".b-ins-sheet .b-ins-btn{width:100%;margin-top:20px;min-height:46px}",
    ".b-ins-glyph{display:inline-block;vertical-align:-3px;margin:0 2px}"
  ].join("\n");
  var styled = false;
  var addStyle = function () {
    if (styled) return; styled = true;
    var s = d.createElement("style"); s.id = "b-ins-style"; s.textContent = css; (d.head || d.documentElement).appendChild(s);
  };
  var markStandalone = function () { if (isStandalone()) { addStyle(); d.documentElement.classList.add("b-standalone"); } };

  var el = function (tag, attrs, kids) {
    var n = d.createElement(tag);
    for (var k in attrs || {}) { if (k === "text") n.textContent = attrs[k]; else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]); else n.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? d.createTextNode(c) : c); });
    return n;
  };
  // inline icons drawn in SVG so they look like what the person will see on screen
  var shareGlyph = function () {
    var s = d.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("width", "16"); s.setAttribute("height", "18"); s.setAttribute("viewBox", "0 0 16 18"); s.setAttribute("class", "b-ins-glyph"); s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<path d="M8 1v11M4.5 4.5L8 1l3.5 3.5" fill="none" stroke="#E3C98A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 7H2.5v9.5h11V7H11" fill="none" stroke="#E3C98A" stroke-width="1.6" stroke-linejoin="round"/>';
    return s;
  };
  var dots = function () { return el("b", { text: "⋮" }); };

  // ---------- the native prompt ----------
  var prompt = function () {
    if (!deferred) return Promise.resolve(false);
    var ev = deferred; deferred = null; refresh();
    try {
      ev.prompt();
      return ev.userChoice.then(function (c) { if (c && c.outcome === "dismissed") store.set(); return c && c.outcome === "accepted"; }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  };

  // ---------- the instructions sheet ----------
  var lastFocus = null, veil = null;
  var closeSheet = function () {
    if (!veil) return;
    veil.remove(); veil = null; d.removeEventListener("keydown", onKey, true);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  };
  var onKey = function (e) {
    if (!veil) return;
    if (e.key === "Escape") { e.preventDefault(); closeSheet(); return; }
    if (e.key === "Tab") { // keep focus inside the sheet
      var f = veil.querySelectorAll("button, a[href]"); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  var steps = function () {
    if (inApp) return { lead: "Instagram, Facebook and similar apps open links in their own small browser, which cannot install apps. Open this page in your phone's browser first.", items: [
      [isIOS ? "Tap the " : "Tap the menu (", isIOS ? el("b", { text: "•••" }) : el("b", { text: "⋮ or •••" }), isIOS ? " button in the corner." : ") in the corner."],
      ["Choose ", el("b", { text: isIOS ? "Open in external browser" : "Open in browser" }), " (it may say Open in Safari or Open in Chrome)."],
      ["Then tap ", el("b", { text: "Install the app" }), " again at the bottom of the page."]] };
    if (isIOS) return { lead: isIOSSafari ? "Safari adds it from the Share menu. It takes three taps." : "On iPhone and iPad it is added from the Share menu. It takes three taps.", items: [
      ["Tap the Share button ", shareGlyph(), isIOSSafari ? " in Safari's toolbar (bottom of the screen, or top right on iPad)." : " (in Chrome it sits in the address bar)."],
      ["Scroll down and choose ", el("b", { text: "Add to Home Screen" }), "."],
      ["Tap ", el("b", { text: "Add" }), ". The gold star appears on your home screen."]] };
    if (isAndroid) return { lead: "Your browser can install it from its menu.", items: [
      ["Tap the menu ", dots(), " at the top right of Chrome."],
      ["Choose ", el("b", { text: "Install app" }), " or ", el("b", { text: "Add to Home screen" }), "."],
      ["Confirm with ", el("b", { text: "Install" }), ". The gold star appears with your apps."]] };
    if (isSafariMac) return { lead: "Safari on Mac can keep it in your Dock.", items: [
      ["Open the ", el("b", { text: "File" }), " menu at the top of the screen."],
      ["Choose ", el("b", { text: "Add to Dock" }), ", then ", el("b", { text: "Add" }), "."]] };
    if (isFirefox) return { lead: "Firefox on a computer cannot install websites as apps. Open brialendowment.org in Chrome, Edge or Safari and install it from there. You can keep reading here as usual.", items: [] };
    if (isEdge) return { lead: "Edge installs it from its menu.", items: [
      ["Open the menu ", el("b", { text: "•••" }), " at the top right."],
      ["Choose ", el("b", { text: "Apps" }), ", then ", el("b", { text: "Install this site as an app" }), "."]] };
    return { lead: "Chrome installs it from the address bar or its menu.", items: [
      ["Click the install icon at the right end of the address bar, if you see one."],
      ["Or open the menu ", dots(), ", choose ", el("b", { text: "Cast, save and share" }), ", then ", el("b", { text: "Install page as app" }), "."]] };
  };
  var openSheet = function (opener) {
    addStyle(); closeSheet(); lastFocus = opener || d.activeElement;
    var s = steps();
    var x = el("button", { type: "button", class: "b-ins-x", "aria-label": "Close", onclick: closeSheet }, ["×"]);
    var sheet = el("div", { class: "b-ins-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "b-ins-h" }, [
      x,
      el("div", { class: "b-ins-eye", text: "The Brial Endowment · App" }),
      el("h2", { id: "b-ins-h", text: "Keep the endowment on your home screen." }),
      el("p", { text: s.lead }),
      s.items.length ? el("ol", null, s.items.map(function (parts, i) { return el("li", null, [el("span", { "aria-hidden": "true", text: String(i + 1) }), el("span", null, parts)]); })) : null,
      el("p", { style: "margin-top:16px;font-size:13px;color:rgba(232,228,220,.66)", text: "It opens full screen, updates itself whenever the site changes, and takes almost no space." }),
      el("button", { type: "button", class: "b-ins-btn", onclick: closeSheet }, ["Done"])
    ]);
    veil = el("div", { class: "b-ins-veil", onclick: function (e) { if (e.target === veil) closeSheet(); } }, [sheet]);
    d.body.appendChild(veil); d.addEventListener("keydown", onKey, true);
    setTimeout(function () { try { x.focus(); } catch (e) {} }, 30);
  };

  // public entry: native prompt when the browser offers it, otherwise the steps
  var open = function (opener) {
    hideCard();
    if (deferred) return prompt().then(function (ok) { return ok; });
    openSheet(opener); return Promise.resolve(false);
  };

  // ---------- the one-time card ----------
  var card = null;
  var hideCard = function () { if (card) { var c = card; card = null; c.classList.remove("on"); setTimeout(function () { c.remove(); }, 350); } };
  var quietHere = function () {
    var p = location.pathname, h = location.hash || "";
    return /^\/donate/.test(p) || /^#\/(admin|scholar|student|apply|founder)/.test(h) || /^\/(privacy|terms|404)/.test(p) || !!d.querySelector('[role="dialog"]:not(.b-ins-sheet)');
  };
  var eligible = function () {
    if (installed || isStandalone() || inApp) return false;
    if (Date.now() - store.get() < WAIT_DAYS * 864e5) return false;
    try { if (sessionStorage.getItem("brial.install.shown")) return false; } catch (e) {}
    return !!deferred || isIOSSafari;
  };
  var showCard = function () {
    if (card || !eligible() || quietHere()) return;
    addStyle();
    try { sessionStorage.setItem("brial.install.shown", "1"); } catch (e) {}
    var go = el("button", { type: "button", class: "b-ins-btn", onclick: function () { open(go); } }, [deferred ? "Install" : "Show me"]);
    var later = el("button", { type: "button", class: "b-ins-later", onclick: function () { store.set(); hideCard(); } }, ["Not now"]);
    card = el("div", { class: "b-ins-card", role: "region", "aria-label": "Install the app" }, [
      el("img", { src: "/icon-192.png", alt: "", width: "46", height: "46" }),
      el("div", { style: "min-width:0;flex:1" }, [
        el("div", { class: "b-ins-t", text: "Install The Brial Endowment" }),
        el("div", { class: "b-ins-s", text: (isIOS || isAndroid) ? "One tap from your home screen, always up to date." : "Opens in its own window, always up to date." })]),
      el("div", { class: "b-ins-acts" }, [go, later])
    ]);
    d.body.appendChild(card);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (card) card.classList.add("on"); }); });
  };
  // offer it only to someone actually reading: 20 seconds on the site and some scrolling
  var scrolled = false, timeUp = false;
  var maybe = function () { if (scrolled && timeUp) showCard(); };
  w.addEventListener("scroll", function onS() { if (w.scrollY > 300) { scrolled = true; w.removeEventListener("scroll", onS); maybe(); } }, { passive: true });
  setTimeout(function () { timeUp = true; maybe(); }, 20000);
  w.addEventListener("hashchange", function () { if (card && quietHere()) hideCard(); });

  // ---------- browser events ----------
  var refresh = function () { markStandalone(); if (!deferred && card && !isIOSSafari) hideCard(); };
  w.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; w.__brialBip = e; maybe(); });
  w.addEventListener("appinstalled", function () { installed = true; deferred = null; w.__brialBip = null; hideCard(); closeSheet(); addStyle(); d.documentElement.classList.add("b-standalone"); });
  try { w.matchMedia("(display-mode: standalone)").addEventListener("change", markStandalone); } catch (e) {}

  // footer links and buttons anywhere: <a data-install-app> or <button data-install-app>
  d.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-install-app]") : null;
    if (!t) return; e.preventDefault(); open(t);
  });

  markStandalone();
  w.BrialInstall = {
    open: open,
    canPrompt: function () { return !!deferred; },
    isInstalled: function () { return installed || isStandalone(); },
    _steps: steps, _showCard: function () { store.get = function () { return 0; }; try { sessionStorage.removeItem("brial.install.shown"); } catch (e) {} scrolled = timeUp = true; showCard(); }
  };
})();
