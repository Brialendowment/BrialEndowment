// ============================================================
// BRIAL — MOTION EFFECTS ENGINE · GEN 3 "MAXIMUM"
// Delegated, zero-config overlay for the React app:
//   · scroll progress hairline          · hero aurora + gold dust canvas
//   · scroll-linked parallax (arch)     · magnetic gold CTAs
//   · cursor spotlight + 3D tilt        · click ripples
//   · staggered scroll reveals          · image wipe reveals
//   · count-up numerals                 · idle shine on primary CTAs
//   · view-mount transitions            · smooth anchor scrolling
// Works across all dynamically mounted React views.
// Fully inert under prefers-reduced-motion. Transform/opacity only.
// ============================================================
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return; // focus ring stays via CSS; no JS motion

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var GOLD_BG = /234,\s*217,\s*168|201,\s*169,\s*97/;
  var FRAME_BORDER = /201,\s*169,\s*97|168,\s*201,\s*127|201,\s*138,\s*97|79,\s*209,\s*197/;

  // ============================================================
  // 1. CLASSIFICATION (lazy on hover + eager for known CTAs)
  // ============================================================
  function classify(el) {
    if (!el || el.nodeType !== 1 || el.dataset.fx) return;
    el.dataset.fx = "1";
    var rect = el.getBoundingClientRect();
    var area = rect.width * rect.height;
    if (!area) { delete el.dataset.fx; return; } // not laid out yet
    var cs = getComputedStyle(el);
    var interactive = el.matches("button, a, [role='button']");

    if (interactive) {
      if (area > 60000) {
        el.classList.add("fx-card");
        if (cs.position === "static") el.style.position = "relative";
      } else {
        el.classList.add("fx-btn");
        var bg = cs.backgroundImage + " " + cs.backgroundColor;
        if (GOLD_BG.test(bg) && cs.color.indexOf("232") === -1) {
          el.classList.add("fx-gold");
          if (cs.position === "static") el.style.position = "relative";
        }
      }
      return;
    }
    if (area > 45000 && area < 700000 && el.tagName === "DIV") {
      if (FRAME_BORDER.test(cs.borderTopColor) || FRAME_BORDER.test(cs.borderLeftColor)) {
        el.classList.add("fx-glowcard");
        if (cs.position === "static") el.style.position = "relative";
      }
    }
  }

  function findTarget(node) {
    var el = node, depth = 0;
    while (el && el !== document.body && depth < 6) {
      if (el.nodeType === 1 && (el.matches("button, a, [role='button']") || !el.dataset.fx && el.tagName === "DIV")) {
        if (el.matches("button, a, [role='button']")) return el;
        classify(el);
      }
      el = el.parentElement; depth++;
    }
    return null;
  }
  document.addEventListener("pointerover", function (e) {
    var el = findTarget(e.target);
    if (el) classify(el);
  }, { passive: true });

  // ============================================================
  // 2. SCROLL ENGINE — progress bar, parallax, scroll-hint fade
  // ============================================================
  var progress = document.createElement("div");
  progress.id = "fx-progress";
  (document.body || document.documentElement).appendChild(progress);

  var px = { hero: null, arch: null, pattern: null, hint: null, docH: 0 };
  function refreshParallaxRefs() {
    px.hero = document.querySelector(".b-hero");
    px.arch = px.hero ? px.hero.querySelector(":scope > div[style*='width: 700px']") : null;
    px.pattern = px.hero ? px.hero.querySelector(":scope > div[style*='background-image']") : null;
    px.hint = px.hero ? px.hero.querySelector(":scope > div[style*='bottom: 32px']") : null;
    if (px.hint && !px.hint.classList.contains("fx-scrollhint")) px.hint.classList.add("fx-scrollhint");
    px.docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  var ticking = false;
  function onScrollFrame() {
    ticking = false;
    var y = window.scrollY || 0;
    var p = Math.min(1, y / px.docH);
    progress.style.transform = "scaleX(" + p.toFixed(4) + ")";
    progress.classList.toggle("fx-on", y > 40 && p < 0.998);

    if (px.hero && px.hero.isConnected && y < window.innerHeight * 1.4) {
      if (px.arch) px.arch.style.transform = "translate3d(0," + (y * 0.14).toFixed(1) + "px,0)";
      if (px.pattern) px.pattern.style.transform = "translate3d(0," + (y * 0.06).toFixed(1) + "px,0)";
      if (px.hint) px.hint.style.opacity = Math.max(0, 1 - y / 220).toFixed(2);
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); }
  }, { passive: true });
  window.addEventListener("resize", function () {
    px.docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }, { passive: true });
  setInterval(function () { // content height changes as async data lands
    px.docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }, 2500);

  // ============================================================
  // 3. HERO ATMOSPHERE — aurora blobs + gold dust canvas
  // ============================================================
  var dust = { canvas: null, ctx: null, parts: [], raf: 0, visible: true, running: false, sprite: null };

  function makeSprite() {
    var c = document.createElement("canvas");
    c.width = c.height = 32;
    var g = c.getContext("2d");
    var grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(227, 201, 138, 1)");
    grad.addColorStop(0.4, "rgba(201, 169, 97, 0.55)");
    grad.addColorStop(1, "rgba(201, 169, 97, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return c;
  }

  function ensureHeroFx() {
    var hero = document.querySelector(".b-hero");
    if (!hero) { stopDust(); return; }
    if (!hero.querySelector(":scope > .fx-aurora")) {
      var au = document.createElement("div");
      au.className = "fx-aurora";
      au.appendChild(document.createElement("i"));
      au.appendChild(document.createElement("i"));
      au.appendChild(document.createElement("i"));
      hero.appendChild(au);
    }
    var canvas = hero.querySelector(":scope > #fx-dust");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "fx-dust";
      hero.appendChild(canvas);
    }
    if (dust.canvas !== canvas) {
      dust.canvas = canvas;
      dust.ctx = canvas.getContext("2d");
      dust.sprite = dust.sprite || makeSprite();
      sizeDust();
      seedDust();
      watchDust(hero);
    }
    startDust();
  }

  function sizeDust() {
    if (!dust.canvas || !dust.canvas.parentElement) return;
    var r = dust.canvas.parentElement.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    dust.canvas.width = Math.max(1, Math.round(r.width * dpr));
    dust.canvas.height = Math.max(1, Math.round(r.height * dpr));
    dust.dpr = dpr;
  }
  window.addEventListener("resize", function () { sizeDust(); seedDust(); }, { passive: true });

  function seedDust() {
    if (!dust.canvas) return;
    var w = dust.canvas.width, h = dust.canvas.height, dpr = dust.dpr || 1;
    var n = Math.round(Math.min(44, Math.max(18, (w / dpr) / 34)));
    dust.parts = [];
    for (var i = 0; i < n; i++) {
      dust.parts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (0.7 + Math.random() * 1.9) * dpr,
        vy: (0.06 + Math.random() * 0.16) * dpr,
        sway: 0.3 + Math.random() * 0.9,
        ph: Math.random() * Math.PI * 2,
        tw: 0.4 + Math.random() * 0.6,
        a: 0.25 + Math.random() * 0.5
      });
    }
  }

  var dustIO = null;
  function watchDust(hero) {
    if (dustIO) dustIO.disconnect();
    if (!("IntersectionObserver" in window)) return;
    dustIO = new IntersectionObserver(function (en) {
      dust.visible = !!(en[0] && en[0].isIntersecting);
      if (dust.visible) startDust(); else stopDust();
    }, { threshold: 0 });
    dustIO.observe(hero);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopDust();
    else if (dust.visible) startDust();
  });

  function stopDust() {
    dust.running = false;
    if (dust.raf) { cancelAnimationFrame(dust.raf); dust.raf = 0; }
  }
  function startDust() {
    if (dust.running || !dust.canvas || document.hidden || !dust.visible) return;
    dust.running = true;
    var t0 = performance.now();
    function loop(t) {
      if (!dust.running) return;
      if (!dust.canvas.isConnected) { stopDust(); return; }
      var ctx = dust.ctx, w = dust.canvas.width, h = dust.canvas.height;
      ctx.clearRect(0, 0, w, h);
      var time = (t - t0) / 1000;
      for (var i = 0; i < dust.parts.length; i++) {
        var pt = dust.parts[i];
        pt.y -= pt.vy;
        if (pt.y < -8) { pt.y = h + 8; pt.x = Math.random() * w; }
        var x = pt.x + Math.sin(time * pt.tw + pt.ph) * 14 * pt.sway;
        var alpha = pt.a * (0.55 + 0.45 * Math.sin(time * pt.tw * 1.7 + pt.ph));
        ctx.globalAlpha = Math.max(0.04, alpha);
        var s = pt.r * 6;
        ctx.drawImage(dust.sprite, x - s / 2, pt.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      dust.raf = requestAnimationFrame(loop);
    }
    dust.raf = requestAnimationFrame(loop);
  }

  // ============================================================
  // 4. POINTER ENGINE — spotlight, tilt, magnetic gold CTAs
  // ============================================================
  var tiltEl = null, magEl = null, raf = 0, lastEv = null, lastPath = null;

  function onMove(e) {
    lastEv = e;
    lastPath = e.composedPath ? e.composedPath() : [];
    if (!raf) raf = requestAnimationFrame(applyMove);
  }
  function applyMove() {
    raf = 0;
    var e = lastEv;
    if (!e) return;
    var chain = lastPath || [];
    var didCard = false, didMag = false;
    for (var i = 0; i < chain.length && i < 10; i++) {
      var el = chain[i];
      if (!el.classList) continue;
      var isCard = el.classList.contains("fx-card");
      var isGlow = el.classList.contains("fx-glowcard");
      var isMag = finePointer && !didMag && el.classList.contains("fx-gold") && !isCard;

      if (isMag && el.dataset.fxPress !== "1") {
        var mr = el.getBoundingClientRect();
        if (mr.width < 640) {
          var dx = (e.clientX - (mr.left + mr.width / 2)) / mr.width;   // -0.5..0.5
          var dy = (e.clientY - (mr.top + mr.height / 2)) / mr.height;
          el.style.transform = "translate(" + (dx * 10).toFixed(1) + "px," + (dy * 8).toFixed(1) + "px)";
          magEl = el;
        }
        didMag = true;
      }

      if ((isCard || isGlow) && !didCard) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty("--fx-x", (x / r.width * 100).toFixed(1) + "%");
        el.style.setProperty("--fx-y", (y / r.height * 100).toFixed(1) + "%");
        if (isCard && finePointer && r.width < 900) {
          var rx = ((y / r.height) - 0.5) * -3.4;
          var ry = ((x / r.width) - 0.5) * 3.8;
          el.style.transform = "perspective(950px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-4px)";
          tiltEl = el;
        }
        didCard = true;
      }
      if (didCard && didMag) break;
    }
  }
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerout", function (e) {
    if (tiltEl && !tiltEl.contains(e.relatedTarget)) {
      tiltEl.style.transform = "";
      tiltEl = null;
    }
    if (magEl && !magEl.contains(e.relatedTarget)) {
      if (magEl.dataset.fxPress !== "1") magEl.style.transform = "";
      magEl = null;
    }
  }, { passive: true });

  // ============================================================
  // 5. PRESS FEEDBACK + CLICK RIPPLE
  // ============================================================
  document.addEventListener("pointerdown", function (e) {
    var el = null, chain = e.composedPath ? e.composedPath() : [];
    for (var i = 0; i < chain.length && i < 10; i++) {
      var c = chain[i];
      if (c.classList && (c.classList.contains("fx-btn") || c.classList.contains("fx-card"))) { el = c; break; }
    }
    if (!el || el.disabled) return;

    // tactile press on small controls
    if (el.classList.contains("fx-btn")) {
      el.dataset.fxPress = "1";
      el.style.transform = "scale(0.965)";
      var release = function () {
        delete el.dataset.fxPress;
        el.style.transform = "";
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
      };
      window.addEventListener("pointerup", release, { passive: true });
      window.addEventListener("pointercancel", release, { passive: true });
    }

    var cs = getComputedStyle(el);
    if (cs.position === "static") el.style.position = "relative";
    if (cs.overflow !== "hidden") el.style.overflow = "hidden";
    var r = el.getBoundingClientRect();
    var d = Math.max(r.width, r.height) * 2.2;
    var s = document.createElement("span");
    s.className = "fx-ripple";
    s.style.width = s.style.height = d + "px";
    s.style.left = (e.clientX - r.left - d / 2) + "px";
    s.style.top = (e.clientY - r.top - d / 2) + "px";
    el.appendChild(s);
    s.addEventListener("animationend", function () { s.remove(); });
    setTimeout(function () { if (s.parentNode) s.remove(); }, 900);
  }, { passive: true });

  // ============================================================
  // 6. SCROLL REVEALS — staggered, variant-aware, fail-safe
  // ============================================================
  function revealEl(el) {
    if (el.dataset.fxDone) return;
    el.dataset.fxDone = "1";
    if (io) io.unobserve(el);
    if (el.classList.contains("fx-pre-img")) {
      el.classList.add("fx-in-img");
      setTimeout(function () { el.classList.remove("fx-pre-img", "fx-in-img"); el.style.removeProperty("--fx-d"); }, 2400);
    } else if (el.classList.contains("fx-pre")) {
      el.classList.add("fx-in");
      setTimeout(function () { el.classList.remove("fx-pre", "fx-in"); el.removeAttribute("data-fxv"); el.style.removeProperty("--fx-d"); }, 2700);
    }
  }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) revealEl(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }) : null;
  // FAILSAFE SWEEP — nothing may stay hidden: if a tagged element sits in
  // the viewport (manual rect math, immune to clipping/observer quirks) or
  // has been hidden > 6s, force-reveal it.
  setInterval(function () {
    var els = document.querySelectorAll(".fx-pre, .fx-pre-img");
    if (!els.length) return;
    var vh = window.innerHeight, now = Date.now();
    for (var i = 0; i < els.length; i++) {
      var el = els[i], r = el.getBoundingClientRect();
      if ((r.top < vh && r.bottom > 0 && r.width > 0) || now - (+el.dataset.fxt || now) > 6000) revealEl(el);
    }
  }, 900);

  // [selector, variant, stagger-ms]
  var REVEAL_RULES = [
    ["#transparency .b-2col > div:first-child", "l", 0],
    ["#transparency .b-2col > div:last-child", "r", 120],
    ["#mission .b-2col > div:first-child", "l", 0],
    ["#mission .b-2col > div:last-child", "r", 120],
    [".b-tiles3 > div", "", 100],
    ["#mission [role='button']", "s", 110],
    ["#mission .b-colophon", "", 0],
    ["#scholars > div > *", "", 90],
    [".b-donate-band", "", 0],
    [".b-portal2 > button", "s", 120],
    [".b-foot > div", "", 90],
    [".b-metrics4 > div", "", 90],
    ["#transparency h2, #mission h2, #scholars h2", "", 0]
  ];

  function tagReveals() {
    if (!io) return;
    REVEAL_RULES.forEach(function (rule) {
      var els;
      try { els = document.querySelectorAll(rule[0]); } catch (err) { return; }
      var idx = 0;
      els.forEach(function (el) {
        if (el.dataset.fxr) return;
        el.dataset.fxr = "1";
        // never animate an element inside one that is already animating
        // (stacked transforms made the mission headline lurch)
        if (el.parentElement && el.parentElement.closest(".fx-pre")) return;
        var r = el.getBoundingClientRect();
        if (r.top > window.innerHeight * 0.92 && r.height > 4) {
          el.dataset.fxt = Date.now();
          el.classList.add("fx-pre");
          if (rule[1]) el.setAttribute("data-fxv", rule[1]);
          if (rule[2]) el.style.setProperty("--fx-d", ((idx % 4) * rule[2]) + "ms");
          io.observe(el);
          idx++;
        }
      });
    });
    // image wipe reveals across all mounted views
    document.querySelectorAll("#root img").forEach(function (img) {
      if (img.dataset.fxr) return;
      var r = img.getBoundingClientRect();
      if (r.width < 90 || r.height < 90) return;
      img.dataset.fxr = "1";
      if (r.top > window.innerHeight * 0.92) {
        img.dataset.fxt = Date.now();
        img.classList.add("fx-pre-img");
        io.observe(img);
      }
    });
  }

  // ============================================================
  // 7. COUNT-UP NUMERALS — large serif figures animate on reveal
  // ============================================================
  var NUM_RE = /^\$?(\d[\d,]*(?:\.\d+)?)([KMB%+]?)$/;

  function firstTextNode(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.data.trim()) return n;
      if (n.nodeType === 1) return null; // element first → skip
    }
    return null;
  }

  var cntIO = io ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      cntIO.unobserve(en.target);
      runCount(en.target);
    });
  }, { threshold: 0.4 }) : null;

  function tagCounts() {
    if (!cntIO) return;
    document.querySelectorAll("#root div, #root span").forEach(function (el) {
      if (el.dataset.fxc !== undefined) return;
      if (el.children.length > 1) return;
      var tn = firstTextNode(el);
      if (!tn) return;
      var txt = tn.data.trim();
      if (!NUM_RE.test(txt)) return;
      var cs = getComputedStyle(el);
      var size = parseFloat(cs.fontSize);
      if (size < 30 || cs.fontFamily.indexOf("Cormorant") === -1) return;
      el.dataset.fxc = "1";
      cntIO.observe(el);
    });
  }

  function runCount(el) {
    var tn = firstTextNode(el);
    if (!tn) return;
    var original = tn.data;
    var m = original.trim().match(NUM_RE);
    if (!m) return;
    var prefix = original.trim().charAt(0) === "$" ? "$" : "";
    var target = parseFloat(m[1].replace(/,/g, ""));
    if (!isFinite(target)) return;
    var decimals = (m[1].split(".")[1] || "").length;
    var suffix = m[2] || "";
    if (target === 0) return;
    var dur = 1500, start = 0, lastWritten = null;

    function fmtN(v) {
      return prefix + v.toLocaleString("en-US", {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + suffix;
    }
    function tick(t) {
      if (!start) start = t;
      if (lastWritten !== null && tn.data !== lastWritten) return; // React updated → yield
      if (!el.isConnected) return;
      var p = Math.min(1, (t - start) / dur);
      var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      if (p < 1) {
        lastWritten = fmtN(target * e);
        tn.data = lastWritten;
        requestAnimationFrame(tick);
      } else {
        tn.data = original; // exact restore
      }
    }
    requestAnimationFrame(tick);
  }

  // ============================================================
  // 8. IDLE SHINE on primary gold CTAs (only while visible)
  // ============================================================
  var idleIO = io ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      en.target.classList.toggle("fx-idle-on", en.isIntersecting);
    });
  }, { threshold: 0.3 }) : null;

  function tagIdle() {
    // eager-classify the known CTAs so shine layers exist immediately
    document.querySelectorAll(".b-hero button, #scholars button, .b-nav-apply, .b-nav-donate, .b-portal2 > button, #mission [role='button']")
      .forEach(classify);
    document.querySelectorAll(".b-hero .fx-gold, #scholars .fx-gold").forEach(function (el) {
      if (el.dataset.fxi) return;
      el.dataset.fxi = "1";
      el.classList.add("fx-idle");
      if (idleIO) idleIO.observe(el);
    });
    // donate pill is a div inside the band button — give it the gold treatment
    document.querySelectorAll(".b-donate-pill").forEach(function (el) {
      if (el.dataset.fxi) return;
      el.dataset.fxi = "1";
      el.style.position = "relative";
      el.style.overflow = "hidden";
      el.classList.add("fx-gold", "fx-idle");
      if (idleIO) idleIO.observe(el);
    });
  }

  // ============================================================
  // 9. VIEW-MOUNT TRANSITION + SMOOTH ANCHOR SCROLL
  // ============================================================
  var booted = false;
  function onViewAdded(node) {
    if (!booted) return;
    if (node.nodeType !== 1 || node.id === "__brial_splash") return;
    if (node.id && node.id.indexOf("fx-") === 0) return;
    if ((window.scrollY || 0) > 50) return; // avoid transform on fixed children mid-page
    if (node.offsetHeight > 240) {
      node.classList.add("fx-view-in");
      setTimeout(function () { node.classList.remove("fx-view-in"); }, 800);
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t !== document.body && !(t.tagName === "A" && t.getAttribute("href"))) t = t.parentElement;
    if (!t || t === document.body) return;
    var href = t.getAttribute("href");
    if (!href || href.charAt(0) !== "#" || href.length < 2) return;
    var dest = document.getElementById(href.slice(1));
    if (!dest) return; // app hash-views handle their own
    e.preventDefault();
    var y = dest.getBoundingClientRect().top + (window.scrollY || 0) - 76;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    try { history.replaceState(null, "", href); } catch (err) {}
  });

  // ============================================================
  // 10. BOOT + MUTATION WIRING
  // ============================================================
  function tagAll() {
    ensureHeroFx();
    refreshParallaxRefs();
    tagReveals();
    tagCounts();
    tagIdle();
  }
  var debounce = 0;
  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var added = muts[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        if (added[j].parentNode === document.getElementById("root")) onViewAdded(added[j]);
      }
    }
    clearTimeout(debounce);
    debounce = setTimeout(tagAll, 300);
  });
  function boot() {
    tagAll();
    onScrollFrame();
    var root = document.getElementById("root");
    if (root) mo.observe(root, { childList: true, subtree: true });
    setTimeout(function () { booted = true; }, 900);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
