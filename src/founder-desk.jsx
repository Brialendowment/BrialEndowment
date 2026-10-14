// ============================================================
// FOUNDER DESK — pillar consoles of the Founder Portal (redesign, Oct 2026)
// Source for the block compiled into site/admin.compiled.js.
// Build: python3 scripts/build-desks.py <esbuild> [--bundle]
// The pillar chooser stays as it was; every pillar opens in this desk.
// ============================================================
const FD = (() => {
  const { useState, useEffect, useMemo, useRef, useCallback } = React;

  // ---------------- formatting ----------------
  const money = n => "$" + (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const fdate = iso => { if (!iso) return "—"; const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
  const fdatetime = iso => { if (!iso) return "—"; const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); };
  const rel = iso => {
    if (!iso) return "";
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    if (s < 86400 * 30) return Math.floor(s / 86400) + " d ago";
    return fdate(iso);
  };
  const titleCase = s => (s || "").toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  // Institution names often arrive in capitals ("UIN IMAM BONJOL PADANG"): keep real
  // acronyms (known list, tokens with digits or without vowels), title-case the rest.
  const ACR = new Set(["UIN", "IAIN", "STAIN", "UNAND", "UNP", "UGM", "UI", "ITB", "ITS", "IPB", "UPI", "UNY", "UNS", "UB", "UNJ", "UPN", "SMA", "SMAN", "SMK", "SMKN", "MAN", "MAS", "MA", "MTS", "MTSN", "SMP", "SMPN", "PGRI", "STIE", "STKIP", "STIKES", "STMIK", "UMSB", "UNES", "USA", "UK", "UAE", "PT"]);
  const instCase = s => (s || "").split(/(\s+)/).map(w => { const u = w.toUpperCase(); return ACR.has(u.replace(/[^A-Z]/g, "")) && u.replace(/[^A-Z]/g, "").length === w.replace(/[^A-Za-z]/g, "").length && /^[A-Z0-9.\-]+$/.test(w) ? w : /\d/.test(w) || (/^[A-Z]{2,5}$/.test(w) && !/[AEIOU]/.test(w)) ? w : titleCase(w); }).join("");
  const fileUrl = f => { if (!f) return null; if (f.url) return f.url; const p = f.path || f.key; return p && window.brialSupabase ? window.brialSupabase.publicUrl(p) : null; };
  const isImage = f => !!f && (/^image\//i.test(f.type || "") || /\.(png|jpe?g|webp|gif)$/i.test(f.name || f.path || ""));
  const today = () => new Date().toISOString().slice(0, 10);
  const plural = (n, one, many) => (Number(n) === 1 ? one : many);
  // Screen state that the back swipe / Back button can step through (see store.js)
  const useNav = (key, init) => (window.useBrialNav ? window.useBrialNav(key, init) : useState(init));
  // Image with a graceful fallback when the file cannot load (never a broken-image icon)
  const Img = ({ src, className, style, fallback = null }) => {
    const [bad, setBad] = useState(false);
    useEffect(() => { setBad(false); }, [src]);
    return bad ? fallback : <img key={src} className={className} style={style} src={src} alt="" onError={() => setBad(true)} />;
  };

  // ---------------- styles ----------------
  const CSS = `
.fd{--bg:#0A1628;--side:#0B192F;--surface:#0F1E36;--raised:#132746;--line:rgba(239,233,220,.09);--line2:rgba(239,233,220,.16);--gilt:#C9A961;--gilt2:#E2C98E;--giltsoft:rgba(201,169,97,.13);--text:#EFE9DC;--muted:rgba(239,233,220,.66);--faint:rgba(239,233,220,.44);--sage:#8FD4A8;--amber:#E7B76A;--rose:#E58686;--sky:#8DB8E8;--accent:var(--gilt);
  min-height:100vh;background:var(--bg);color:var(--text);font-family:'Manrope',system-ui,sans-serif;font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased}
.fd *{box-sizing:border-box}
.fd button,.fd input,.fd select,.fd textarea{font-family:inherit}
.fd :focus-visible{outline:2px solid var(--gilt);outline-offset:2px;border-radius:6px}
.fd a{color:inherit}
/* top bar */
.fd-top{position:sticky;top:0;z-index:50;height:60px;display:flex;align-items:center;gap:14px;padding:0 20px;background:rgba(10,22,40,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.fd-brand{display:flex;align-items:center;gap:10px;font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;white-space:nowrap}
.fd-crumb{display:flex;align-items:center;gap:8px;color:var(--faint);font-size:13px;min-width:0}
.fd-crumb b{color:var(--text);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-crumb button{background:none;border:0;color:var(--muted);cursor:pointer;padding:4px 6px;border-radius:6px;font-size:13px}
.fd-crumb button:hover{color:var(--text);background:rgba(239,233,220,.05)}
.fd-top-r{margin-left:auto;display:flex;align-items:center;gap:10px}
.fd-email{font-size:12px;color:var(--faint);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* layout */
.fd-body{display:grid;grid-template-columns:232px minmax(0,1fr);min-height:calc(100vh - 60px)}
.fd-side{position:sticky;top:60px;height:calc(100vh - 60px);overflow:auto;background:var(--side);border-right:1px solid var(--line);padding:18px 12px;display:flex;flex-direction:column;gap:2px}
.fd-pillar{display:flex;align-items:center;gap:10px;padding:6px 10px 16px;margin-bottom:8px;border-bottom:1px solid var(--line)}
.fd-pillar-ic{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;border:1px solid var(--accent);color:var(--accent);flex-shrink:0}
.fd-pillar b{display:block;font-weight:600;font-size:14px;line-height:1.2}
.fd-pillar small{display:block;font-size:12px;color:var(--faint)}
.fd-nav{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border-radius:9px;border:0;background:none;color:var(--muted);font-size:14px;font-weight:500;cursor:pointer;text-align:left;transition:background .15s,color .15s}
.fd-nav:hover{background:rgba(239,233,220,.04);color:var(--text)}
.fd-nav[aria-current=page]{background:var(--giltsoft);color:var(--text)}
.fd-nav[aria-current=page] .fd-nav-ic{color:var(--gilt2)}
.fd-nav-ic{display:flex;color:var(--faint)}
.fd-count{margin-left:auto;min-width:22px;height:20px;padding:0 6px;border-radius:10px;font-size:11px;font-weight:700;line-height:20px;text-align:center;background:rgba(239,233,220,.08);color:var(--muted)}
.fd-count.hot{background:var(--gilt);color:#0A1628}
.fd-side-foot{margin-top:auto;padding:14px 10px 4px;border-top:1px solid var(--line);font-size:12px;color:var(--faint)}
.fd-main{min-width:0;padding:30px clamp(18px,3vw,40px) 120px;max-width:1240px}
/* page head */
.fd-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:22px}
.fd-h1{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(28px,3.2vw,36px);line-height:1.1;margin:0;font-variant-numeric:lining-nums}
.fd-lede{color:var(--muted);margin:6px 0 0;max-width:68ch}
.fd-h2{font-size:15px;font-weight:600;margin:0}
.fd-h3{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:24px;margin:0;line-height:1.15;font-variant-numeric:lining-nums}
.fd-sub{color:var(--muted);font-size:13px;margin:4px 0 0}
/* stats */
.fd-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden;margin-bottom:22px}
.fd-stat{padding:16px 20px;border-right:1px solid var(--line)}
.fd-stat:last-child{border-right:0}
.fd-stat span{display:block;font-size:12px;color:var(--muted)}
.fd-stat b{display:block;font-family:'Cormorant Garamond',serif;font-weight:500;font-size:30px;line-height:1.15;margin-top:4px;font-variant-numeric:lining-nums tabular-nums}
.fd-stat small{display:block;font-size:12px;color:var(--faint)}
.fd-stat.warn b{color:var(--amber)}.fd-stat.ok b{color:var(--sage)}
/* cards */
.fd-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px 22px}
.fd-card+.fd-card{margin-top:16px}
.fd-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.fd-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fd-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
/* buttons */
.fd-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:9px;padding:9px 15px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent;white-space:nowrap;transition:background .15s,border-color .15s,color .15s;text-decoration:none;line-height:1.2}
.fd-btn.primary{background:var(--gilt);color:#0A1628}.fd-btn.primary:hover{background:var(--gilt2)}
.fd-btn.ghost{background:transparent;color:var(--text);border-color:var(--line2)}.fd-btn.ghost:hover{border-color:rgba(201,169,97,.6)}
.fd-btn.quiet{background:transparent;color:var(--muted);padding:7px 10px}.fd-btn.quiet:hover{color:var(--text);background:rgba(239,233,220,.05)}
.fd-btn.danger{background:transparent;color:var(--rose);border-color:rgba(229,134,134,.35)}.fd-btn.danger:hover{background:rgba(229,134,134,.08)}
.fd-btn.danger.armed{background:var(--rose);color:#0A1628;border-color:var(--rose)}
.fd-btn.ok.armed{background:var(--sage);color:#0A1628;border-color:var(--sage)}
.fd-btn.ok{background:rgba(143,212,168,.12);color:var(--sage);border-color:rgba(143,212,168,.4)}
.fd-btn.sm{padding:6px 11px;font-size:12px;border-radius:8px}
.fd-btn[disabled]{opacity:.45;cursor:not-allowed}
.fd-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
/* tags */
.fd-tag{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;white-space:nowrap;background:rgba(239,233,220,.07);color:var(--muted)}
.fd-tag i{width:6px;height:6px;border-radius:50%;background:currentColor}
.fd-tag.ok{background:rgba(143,212,168,.11);color:var(--sage)}
.fd-tag.warn{background:rgba(231,183,106,.12);color:var(--amber)}
.fd-tag.bad{background:rgba(229,134,134,.12);color:var(--rose)}
.fd-tag.gold{background:var(--giltsoft);color:var(--gilt2)}
.fd-tag.sky{background:rgba(141,184,232,.12);color:var(--sky)}
/* toolbar */
.fd-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.fd-seg{display:flex;gap:6px;flex-wrap:wrap}
.fd-chip{display:inline-flex;align-items:center;gap:7px;background:transparent;border:1px solid var(--line2);color:var(--muted);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:500;cursor:pointer}
.fd-chip em{font-style:normal;font-size:11px;font-weight:700;color:var(--faint)}
.fd-chip[aria-pressed=true]{background:var(--giltsoft);border-color:rgba(201,169,97,.55);color:var(--text)}
.fd-chip[aria-pressed=true] em{color:var(--gilt2)}
.fd-search{position:relative;flex:1 1 240px;max-width:380px}
.fd-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--faint)}
.fd-search input{padding-left:36px}
/* forms */
.fd-field{display:block;min-width:0}
.fd-field>span{display:block;font-size:12.5px;color:var(--muted);margin-bottom:6px;font-weight:500}
.fd-field small{display:block;font-size:12px;color:var(--faint);margin-top:5px}
.fd-input{width:100%;background:rgba(10,22,40,.6);border:1px solid var(--line2);border-radius:9px;color:var(--text);font-size:14px;padding:10px 12px;transition:border-color .15s}
.fd-input:focus{outline:none;border-color:var(--gilt)}
.fd-input::placeholder{color:rgba(239,233,220,.3)}
textarea.fd-input{min-height:110px;resize:vertical;line-height:1.6}
select.fd-input{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--gilt) 50%),linear-gradient(135deg,var(--gilt) 50%,transparent 50%);background-position:calc(100% - 18px) 52%,calc(100% - 13px) 52%;background-size:5px 5px;background-repeat:no-repeat;padding-right:34px}
select.fd-input option{background:#0A1628}
input[type=date].fd-input,input[type=time].fd-input{color-scheme:dark}
.fd-form{display:grid;gap:14px}
.fd-money{position:relative}.fd-money::before{content:"$";position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--gilt2);font-weight:600}.fd-money .fd-input{padding-left:26px}
.fd-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;color:var(--muted);background:none;border:0;padding:0}
.fd-switch i{position:relative;width:36px;height:20px;border-radius:10px;background:rgba(239,233,220,.15);transition:background .2s;flex-shrink:0}
.fd-switch i::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#EFE9DC;transition:transform .2s}
.fd-switch[aria-checked=true] i{background:var(--sage)}
.fd-switch[aria-checked=true] i::after{transform:translateX(16px)}
.fd-msg{font-size:13px;padding:9px 12px;border-radius:9px}
.fd-msg.ok{color:var(--sage);background:rgba(143,212,168,.08);border:1px solid rgba(143,212,168,.3)}
.fd-msg.err{color:#F2A7A7;background:rgba(229,134,134,.08);border:1px solid rgba(229,134,134,.3)}
.fd-msg.info{color:var(--muted);background:rgba(239,233,220,.04);border:1px solid var(--line)}
/* table */
.fd-table{border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden}
.fd-tr{display:grid;gap:14px;align-items:center;padding:13px 18px;border-top:1px solid var(--line)}
.fd-tr:first-child{border-top:0}
.fd-th{font-size:12px;color:var(--faint);font-weight:600;background:rgba(239,233,220,.025)}
.fd-tr.dim{opacity:.55}
.fd-td{min-width:0}
.fd-td b{display:block;font-weight:600;overflow-wrap:anywhere}
.fd-td small{display:block;font-size:12px;color:var(--faint);overflow-wrap:anywhere}
.fd-td .num{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:500;font-variant-numeric:lining-nums tabular-nums;color:var(--gilt2)}
.fd-td[data-l]::before{display:none}
.fd-mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:var(--muted);overflow-wrap:anywhere}
.fd-empty{padding:42px 20px;text-align:center;color:var(--faint)}
.fd-empty b{display:block;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--muted);margin-bottom:4px}
/* master-detail */
.fd-md{display:grid;grid-template-columns:340px minmax(0,1fr);gap:18px;align-items:start}
.fd-list{border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden;position:sticky;top:76px;max-height:calc(100vh - 96px);overflow-y:auto}
.fd-li{display:block;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--line);padding:13px 16px;color:var(--text);cursor:pointer;transition:background .15s}
.fd-li:first-child{border-top:0}
.fd-li:hover{background:rgba(239,233,220,.03)}
.fd-li[aria-current=true]{background:var(--giltsoft);box-shadow:inset 3px 0 0 var(--gilt)}
.fd-li-top{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.fd-li b{font-weight:600}
.fd-li small{display:block;color:var(--faint);font-size:12px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fd-li-bot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px}
.fd-back{display:none}
/* detail */
.fd-dhead{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
.fd-avatar{width:56px;height:70px;border-radius:10px;object-fit:cover;object-position:50% 25%;border:1px solid rgba(201,169,97,.45);background:#0A1628;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:26px;color:var(--gilt);flex-shrink:0}
.fd-dl{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px 22px;margin:0}
.fd-dl dt{font-size:12px;color:var(--faint)}
.fd-dl dd{margin:2px 0 0;font-weight:500;overflow-wrap:anywhere}
.fd-dl dd.none{color:var(--faint);font-weight:400}
.fd-dl .wide{grid-column:1/-1}
.fd-stage{border:1px solid rgba(201,169,97,.32);background:linear-gradient(160deg,#122646,#0F1E36 70%);border-radius:14px;padding:18px 20px}
.fd-stage-k{font-size:12px;font-weight:600;color:var(--gilt2)}
.fd-details{border:1px solid var(--line);border-radius:14px;background:var(--surface);margin-top:16px}
.fd-details>summary{list-style:none;cursor:pointer;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;font-weight:600}
.fd-details>summary::-webkit-details-marker{display:none}
.fd-details>summary::after{content:"";width:8px;height:8px;border-right:1.5px solid var(--gilt);border-bottom:1.5px solid var(--gilt);transform:rotate(45deg);transition:transform .2s;margin-right:4px}
.fd-details[open]>summary::after{transform:rotate(225deg)}
.fd-details>div{padding:0 20px 20px}
.fd-file{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--line)}
.fd-file:first-child{border-top:0}
/* modal */
.fd-scrim{position:fixed;inset:0;z-index:300;background:rgba(5,11,22,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:18px;animation:fdFade .18s ease-out}
.fd-modal{width:100%;max-width:560px;max-height:calc(100vh - 36px);overflow:auto;background:#10213D;border:1px solid rgba(201,169,97,.3);border-radius:16px;padding:24px 24px 22px;box-shadow:0 40px 100px -30px rgba(0,0,0,.9);animation:fdRise .25s cubic-bezier(.22,1,.36,1) both}
.fd-modal.wide{max-width:760px}
.fd-modal-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:16px}
.fd-x{background:none;border:1px solid var(--line2);color:var(--muted);width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:17px;line-height:1;flex-shrink:0}
.fd-savebar{position:sticky;bottom:16px;z-index:20;margin-top:22px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 16px;border-radius:12px;background:#132746;border:1px solid rgba(201,169,97,.4);box-shadow:0 18px 50px -20px rgba(0,0,0,.9)}
.fd-thumb{width:84px;height:60px;border-radius:8px;object-fit:cover;border:1px solid var(--line2);background:#0A1628}
.fd-cover{width:64px;height:88px;border-radius:6px;object-fit:cover;border:1px solid var(--line2);background:#0A1628;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--faint);font-size:11px}
.fd-upload{position:relative;display:inline-flex}
.fd-upload input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}
.fd-qr{background:#F8F4EB;padding:6px;border-radius:6px;line-height:0;display:inline-block}
@keyframes fdRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes fdFade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.fd *{animation:none!important;transition:none!important}}
@media (max-width:1100px){.fd-md{grid-template-columns:290px minmax(0,1fr)}}
/* treasury */
.fd-attn{display:grid;gap:10px;margin:-6px 0 22px}
.fd-attn-i{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;background:rgba(231,183,106,.07);border:1px solid rgba(231,183,106,.25)}
.fd-attn-i>div{flex:1;min-width:0}.fd-attn-i b{display:block;font-weight:600}.fd-attn-i small{color:var(--muted);font-size:13px}
.fd-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:var(--faint)}.fd-dot.warn{background:var(--amber)}
.fd-tgrid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:16px;align-items:stretch}
.fd-tgrid .fd-card+.fd-card{margin-top:0}
.fd-ch-legend{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:var(--muted);margin-bottom:14px}
.fd-ch-legend span{display:inline-flex;align-items:center;gap:7px}.fd-ch-legend b{color:var(--text);font-weight:600}
.fd-ch-legend i,.fd-ch-tip i{width:10px;height:10px;border-radius:3px;display:inline-block}
.fd-ch-plot{position:relative;height:210px;margin:8px 0 26px 44px}
.fd-ch-grid{position:absolute;left:0;right:0;border-top:1px solid var(--line)}
.fd-ch-grid span{position:absolute;right:100%;margin-right:8px;transform:translateY(-50%);font-size:11px;color:var(--faint);white-space:nowrap;font-variant-numeric:tabular-nums}
.fd-ch-cols{position:absolute;inset:0;display:flex}
.fd-ch-col{flex:1;position:relative;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;outline:none;cursor:default}
.fd-ch-col.on{background:rgba(239,233,220,.04)}
.fd-ch-col:focus-visible{box-shadow:inset 0 0 0 2px var(--gilt);border-radius:6px}
.fd-ch-bars{height:100%;width:100%;display:flex;align-items:flex-end;justify-content:center;gap:2px}
.fd-ch-bars i{width:min(12px,32%);border-radius:4px 4px 0 0;display:block}
.fd-ch-x{position:absolute;top:100%;margin-top:7px;font-size:11px;color:var(--faint)}
.fd-ch-tip{position:absolute;bottom:calc(100% - 30px);left:50%;transform:translate(-50%,-100%);z-index:5;min-width:150px;padding:10px 12px;border-radius:10px;background:#1A2F52;border:1px solid var(--line2);box-shadow:0 14px 34px -14px rgba(0,0,0,.9);font-size:12.5px;pointer-events:none}
.fd-ch-tip b{display:block;font-weight:600;margin-bottom:6px}
.fd-ch-tip div{display:flex;align-items:center;gap:7px;color:var(--muted)}.fd-ch-tip span{margin-left:auto;color:var(--text);font-variant-numeric:tabular-nums;padding-left:12px}
.fd-ch-col:first-child .fd-ch-tip{left:0;transform:translate(0,-100%)}.fd-ch-col:last-child .fd-ch-tip{left:auto;right:0;transform:translate(0,-100%)}
.fd-bars{display:grid;gap:16px}
.fd-bar-t{display:flex;justify-content:space-between;gap:10px;font-size:13.5px}.fd-bar-t b{font-weight:600;font-variant-numeric:tabular-nums}
.fd-bar-track{height:8px;border-radius:4px;background:rgba(239,233,220,.06);margin:7px 0 4px;overflow:hidden}
.fd-bar-track i{display:block;height:100%;border-radius:4px}
.fd-bar small{font-size:12px;color:var(--faint)}
.fd-amt{text-align:right}
.fd-td .num.in{color:#5FD3A6}.fd-td .num.out{color:var(--text)}
.fd-tfoot{background:rgba(239,233,220,.03)}
.fd-totals{display:flex;justify-content:flex-end;gap:28px;flex-wrap:wrap;margin-top:14px;padding:14px 18px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.fd-totals span{display:block;font-size:12px;color:var(--muted)}
.fd-totals b{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;font-variant-numeric:lining-nums tabular-nums}
.fd-totals b.in{color:#5FD3A6}
.fd-chans{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.fd-chans .fd-card+.fd-card{margin-top:0}
@media (max-width:1100px){.fd-tgrid{grid-template-columns:1fr}}
@media (max-width:900px){.fd-ch-plot{margin-left:36px;height:180px}.fd-ch-x{font-size:10px}.fd-amt{text-align:left}.fd-totals{justify-content:space-between}}
/* founder home (chooser) */
.fdh{--line:rgba(239,233,220,.09);--line2:rgba(239,233,220,.16);--gilt:#C9A961;--gilt2:#E2C98E;--text:#EFE9DC;--muted:rgba(239,233,220,.62);max-width:1000px;margin:0 auto;padding:72px clamp(20px,4vw,56px) 100px;font-family:'Manrope',system-ui,sans-serif;color:var(--text)}
.fdh-k{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--gilt);letter-spacing:.28em;text-transform:uppercase}
.fdh-tabs{position:relative;display:inline-grid;grid-template-columns:1fr 1fr;margin:18px 0 26px;padding:4px;border-radius:999px;border:1px solid var(--line2);background:rgba(20,36,66,.55)}
.fdh-tab{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:none;border:0;color:var(--muted);font-family:inherit;font-size:14px;font-weight:600;padding:10px 22px;border-radius:999px;cursor:pointer;transition:color .2s;white-space:nowrap}
.fdh-tab em{font-style:normal;font-size:11px;font-weight:700;opacity:.7}
.fdh-tab[aria-selected=true]{color:#0A1628}
.fdh-tab:focus-visible{outline:2px solid var(--gilt);outline-offset:2px}
.fdh-ink{position:absolute;top:4px;bottom:4px;left:4px;width:calc(50% - 4px);border-radius:999px;background:var(--gilt);transition:transform .35s cubic-bezier(.2,.7,.2,1)}
.fdh-h1{font-family:'Cormorant Garamond',serif;font-size:clamp(36px,5vw,60px);font-weight:400;letter-spacing:-.02em;margin:0 0 10px;line-height:1.05}
.fdh-lede{font-size:16px;font-weight:300;color:var(--muted);margin:0 0 36px;max-width:600px}
.fdh-track{display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch;align-items:flex-start;transition:height .3s ease;overscroll-behavior-x:contain}
.fdh-track::-webkit-scrollbar{display:none}
.fdh-panel{flex:0 0 100%;min-width:0;scroll-snap-align:start;scroll-snap-stop:always}
.fdh-hint{display:none;margin:18px 0 0;font-size:12px;color:var(--muted);text-align:center}
@media (hover:none){.fdh-hint{display:block}}
@media (max-width:560px){.fdh{padding-top:40px}.fdh-tabs{display:grid;width:100%}.fdh-tab{padding:10px 8px;font-size:13.5px}}
@media (prefers-reduced-motion:reduce){.fdh-ink,.fdh-track{transition:none}}
.pn-exit{white-space:nowrap}
@media (max-width:640px){.pn{padding:12px 16px!important;gap:10px!important}.pn-sub,.pn-email,.pn-avatar{display:none!important}.pn-exit{padding:8px 10px!important;letter-spacing:.08em!important}}
/* movement rows on a phone: name + amount on one line */
@media (max-width:900px){
  .fd-mv{grid-template-columns:minmax(0,1fr) auto!important;gap:4px 14px!important}
  .fd-mv .fd-td[data-l]::before{display:none}
  .fd-mv>.fd-td:nth-child(1){grid-column:1;grid-row:1}
  .fd-mv>.fd-td:nth-child(4){grid-column:2;grid-row:1;text-align:right}
  .fd-mv>.fd-td:nth-child(2){grid-column:1;grid-row:2;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}
  .fd-mv>.fd-td:nth-child(3){grid-column:2;grid-row:2;text-align:right;font-size:12.5px;color:var(--muted)}
  .fd-mv>.fd-td:nth-child(3) small{display:none}
}
/* site settings */
.fd-site{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start}
.fd-site .fd-card+.fd-card{margin-top:16px}
.fd-site-prev{position:sticky;top:84px}
.fd-crow{display:grid;grid-template-columns:150px minmax(0,1fr) auto;gap:12px 16px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}
.fd-crow:first-of-type{border-top:0}
.fd-crow-l{display:flex;align-items:center;gap:10px;min-width:0}
.fd-crow-l b{font-weight:600;font-size:14px}
.fd-crow-ic{display:flex;color:var(--gilt2);flex-shrink:0}
.fd-crow-v{min-width:0}
.fd-crow-a{display:flex;align-items:center;gap:6px;justify-content:flex-end}
.fd-crow-gap{display:inline-block;width:58px}
.fd-bad{display:block;color:var(--rose);font-size:12px;margin-top:5px}
.fd-prev{margin-top:14px;padding:18px;border-radius:12px;background:#060E1C;border:1px solid var(--line)}
.fd-prev-brand{display:flex;align-items:center;gap:10px;font-family:'Cormorant Garamond',serif;font-size:18px}
.fd-prev p{font-size:12px;color:var(--faint);margin:10px 0 0;line-height:1.6}
.fd-prev-line{display:flex;gap:9px;align-items:flex-start;margin-top:10px;font-size:13px;color:var(--muted);overflow-wrap:anywhere}
.fd-prev-line svg{color:var(--gilt);flex-shrink:0;margin-top:2px}
.fd-prev-icons{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.fd-prev-icons span{width:32px;height:32px;border-radius:50%;border:1px solid rgba(201,169,97,.35);color:var(--gilt);display:inline-flex;align-items:center;justify-content:center}
@media (max-width:1100px){.fd-site{grid-template-columns:1fr}.fd-site-prev{position:static}}
@media (max-width:640px){.fd-crow{grid-template-columns:1fr;gap:8px}.fd-crow-a{justify-content:space-between}}
/* email */
.fd-rc{display:block;text-align:right;font-size:12px;color:var(--faint);margin-top:6px}
.fd-rc.ok{color:var(--sage)}.fd-rc.warn{color:var(--amber)}.fd-rc.bad{color:var(--rose)}
.fd-mail{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;align-items:start}
.fd-mail .fd-card+.fd-card{margin-top:16px}
.fd-mstat{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
.fd-mstat h2{margin:6px 0 4px}
.fd-krow{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-top:1px solid var(--line)}
.fd-krow:first-of-type{border-top:0}
.fd-krow b{display:block;font-weight:600;font-size:14px}
.fd-krow small{display:block;color:var(--faint);font-size:12px;margin-top:2px}
.fd-mlog{display:flex;flex-direction:column}
.fd-mlog-i{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;padding:11px 0;border-top:1px solid var(--line)}
.fd-mlog-i:first-child{border-top:0}
.fd-mlog-i b{font-weight:600;font-size:13px;overflow-wrap:anywhere}
.fd-mlog-i small{font-size:12px;color:var(--faint);overflow-wrap:anywhere}
.fd-mlog-i .fd-tag{justify-self:end}
.fd-mprev{width:100%;height:560px;border:0;border-radius:10px;background:#F5F2EA}
@media (max-width:1100px){.fd-mail{grid-template-columns:1fr}}
.fd-mvis{display:none}
@media (max-width:900px){
  .fd-mvis{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:28px}
  .fd-body{grid-template-columns:1fr}
  .fd-side{position:sticky;top:56px;z-index:40;height:auto;flex-direction:row;overflow-x:auto;padding:8px 10px;gap:6px;border-right:0;border-bottom:1px solid var(--line);scrollbar-width:none}
  .fd-side::-webkit-scrollbar{display:none}
  .fd-pillar,.fd-side-foot{display:none}
  .fd-nav{width:auto;flex-shrink:0;padding:8px 12px}
  .fd-top{height:56px;padding:0 14px}
  .fd-email,.fd-brand span{display:none}
  .fd-main{padding:22px 14px 120px}
  .fd-md{grid-template-columns:1fr}
  .fd-list{position:static;max-height:none}
  .fd-md.has-sel .fd-list,.fd-tools.has-sel{display:none}
  .fd-md:not(.has-sel) .fd-detail{display:none}
  .fd-back{display:inline-flex;margin-bottom:12px}
  .fd-grid2,.fd-grid3{grid-template-columns:1fr}
  .fd-th{display:none}
  .fd-tr{grid-template-columns:1fr 1fr!important;gap:10px 14px;padding:14px 16px}
  .fd-tr .fd-td.full{grid-column:1/-1}
  .fd-td[data-l]::before{content:attr(data-l);display:block;font-size:11px;color:var(--faint);margin-bottom:2px}
  .fd-stat{border-right:0;border-bottom:1px solid var(--line)}
  .fd-stats{grid-template-columns:1fr 1fr}
  .fd-stat:nth-child(odd){border-right:1px solid var(--line)}
  .fd-modal{padding:20px 18px}
  .fd-savebar{bottom:10px}
}
`;
  function useStyles() {
    useEffect(() => {
      if (document.getElementById("fd-css")) return;
      const s = document.createElement("style");
      s.id = "fd-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }, []);
  }

  // ---------------- icons ----------------
  const I = (d, s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
  const ICON = {
    inbox: I(<><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5 5h14l2 8v6H3v-6z" /></>),
    pay: I(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>),
    cap: I(<><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></>),
    gift: I(<><rect x="3" y="9" width="18" height="12" rx="1" /><path d="M3 13h18M12 9v12M12 9C9 9 7 7 8.5 5.5S12 6 12 9zm0 0c3 0 5-2 3.5-3.5S12 6 12 9z" /></>),
    help: I(<><path d="M4 5h16v11H9l-5 4z" /><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.7-.9 1.2" /><path d="M12 14.5h.01" /></>),
    users: I(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.6-3.3 3-5 6-5s5.4 1.7 6 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16 14.5c2.5 0 4.4 1.6 5 4.5" /></>),
    grant: I(<><path d="M4 20V10M10 20V6M16 20v-8M22 20H2" /></>),
    story: I(<><path d="M5 4h11l3 3v13H5z" /><path d="M9 10h6M9 14h6M9 18h3" /></>),
    link: I(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>),
    contact: I(<><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></>),
    send: I(<><path d="M21 3 10 14" /><path d="M21 3l-6.5 18-4-8-8-4z" /></>),
    pdf: I(<><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>, 14),
    treasury: I(<><path d="M3 9l9-5 9 5" /><path d="M5 9v9M10 9v9M14 9v9M19 9v9M3 20h18" /></>),
    overview: I(<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>),
    inflow: I(<><path d="M12 4v11M7 10l5 5 5-5" /><path d="M4 19h16" /></>),
    outflow: I(<><path d="M12 15V4M7 9l5-5 5 5" /><path d="M4 19h16" /></>),
    ledger: I(<><path d="M5 3.5h14v17H5z" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></>),
    site: I(<><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></>),
    book: I(<><path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z" /><path d="M12 6v14" /></>),
    sale: I(<><path d="M3 12l9-9h8v8l-9 9z" /><circle cx="15.5" cy="8.5" r="1.4" /></>),
    search: I(<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>, 16),
    up: I(<><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></>, 16),
    ext: I(<><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></>, 14),
    star: <svg width="26" height="26" viewBox="0 0 36 36" aria-hidden="true"><g fill="none" stroke="#C9A961" strokeWidth="1.2"><path d="M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" /><circle cx="18" cy="18" r="4" fill="#C9A961" stroke="none" /></g></svg>,
    worship: I(<><path d="M12 3c-2 2-4 3.5-4 6h8c0-2.5-2-4-4-6z" /><path d="M6 21V12h12v9M10 21v-4h4v4M4 21h16" /></>),
    library: I(<><path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z" /><path d="M12 6v14" /></>),
    foodland: I(<><path d="M12 21v-9" /><path d="M12 12c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5z" /></>),
    water: I(<><path d="M12 3c3.5 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 2.5-6.5 6-11z" /></>),
    hospitals: I(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 8v8M8 12h8" /></>),
    schools: I(<><path d="M3 10l9-6 9 6" /><path d="M5 9.5V20h14V9.5M10 20v-5h4v5" /></>),
    livestock: I(<><path d="M6 8c-2 0-3-2-3-3 2 0 4 1 4 2M18 8c2 0 3-2 3-3-2 0-4 1-4 2" /><path d="M7 8h10l-1 7a4 4 0 0 1-8 0z" /><path d="M10 13h.01M14 13h.01" /></>),
    infra: I(<><path d="M2 18h20M4 18c2-6 14-6 16 0M8 18v-4M12 18v-5M16 18v-4" /></>),
    scholarships: I(<><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></>),
  };

  // ---------------- small UI ----------------
  function Modal({ title, sub, onClose, wide, children }) {
    useEffect(() => {
      const k = e => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", k);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
    }, []);
    return (
      <div className="fd-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={"fd-modal" + (wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label={title}>
          <div className="fd-modal-head">
            <div><h2 className="fd-h3">{title}</h2>{sub && <p className="fd-sub">{sub}</p>}</div>
            <button className="fd-x" onClick={onClose} aria-label="Close">×</button>
          </div>
          {children}
        </div>
      </div>
    );
  }
  function Confirm({ onConfirm, children, armedLabel = "Click again to confirm", className = "fd-btn danger sm", disabled }) {
    const [armed, setArmed] = useState(false);
    useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 3500); return () => clearTimeout(t); }, [armed]);
    return <button className={className + (armed ? " armed" : "")} disabled={disabled} onClick={e => { e.stopPropagation(); if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}>{armed ? armedLabel : children}</button>;
  }
  const Field = ({ label, hint, children, style }) => <label className="fd-field" style={style}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
  const Tag = ({ tone, dot, children }) => <span className={"fd-tag " + (tone || "")}>{dot && <i />}{children}</span>;
  function Seg({ items, value, onChange }) {
    return <div className="fd-seg" role="group">{items.map(([id, label, count]) => <button key={id} className="fd-chip" aria-pressed={value === id} onClick={() => onChange(id)}>{label}{typeof count === "number" && <em>{count}</em>}</button>)}</div>;
  }
  const Search = ({ value, onChange, placeholder }) => <div className="fd-search">{ICON.search}<input className="fd-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>;
  const Stats = ({ items }) => <div className="fd-stats">{items.map((s, i) => <div key={i} className={"fd-stat " + (s.tone || "")}><span>{s.label}</span><b>{s.value}</b>{s.sub && <small>{s.sub}</small>}</div>)}</div>;
  const Empty = ({ title, children }) => <div className="fd-empty"><b>{title}</b>{children}</div>;
  const Switch = ({ on, onChange, children }) => <button className="fd-switch" role="switch" aria-checked={!!on} onClick={() => onChange(!on)}><i />{children}</button>;
  function useFlash() {
    const [m, setM] = useState(null);
    const t = useRef(0);
    const flash = (text, tone = "ok") => { setM({ text, tone }); clearTimeout(t.current); t.current = setTimeout(() => setM(null), 2600); };
    return [m, flash];
  }
  const Flash = ({ m }) => (m ? <div className={"fd-msg " + m.tone} role="status">{m.text}</div> : null);
  const FileBtn = ({ file, label = "Open" }) => (file ? <button className="fd-btn ghost sm" onClick={() => window.BrialFiles.open(file)}>{label}</button> : null);
  const copy = t => window.BrialClipboard && window.BrialClipboard.copy(t);
  function PhotoUpload({ onUploaded, children, accept = "image/png,image/jpeg,image/webp" }) {
    const [busy, setBusy] = useState(false);
    const pick = async e => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      const v = window.BrialFiles.validate(f);
      if (!v.ok) { alert(v.error); return; }
      if (!/^image\//i.test(f.type || "")) { alert("Please choose an image (JPG, PNG or WebP)."); return; }
      setBusy(true);
      try { const meta = await window.BrialFiles.put(f, { public: true }); onUploaded(meta); }
      catch (x) { alert("Upload failed: " + (x.message || x)); }
      finally { setBusy(false); }
    };
    return <span className="fd-upload"><span className="fd-btn ghost sm">{ICON.up}{busy ? "Uploading…" : children}</span><input type="file" accept={accept} onChange={pick} disabled={busy} aria-label={children} /></span>;
  }

  // ---------------- shell ----------------
  function Shell({ store, pillarKey, meta, nav, active, onNav, onBack, onExit, founderEmail, onLogout, children, noVisibility }) {
    const visible = store.getPillarActive ? store.getPillarActive(pillarKey) : true;
    return (
      <div className="fd" style={{ "--accent": meta.accent }}>
        <header className="fd-top">
          <div className="fd-brand">{ICON.star}<span>Founder Portal</span></div>
          <nav className="fd-crumb" aria-label="Breadcrumb">
            <span aria-hidden="true">/</span>
            <button onClick={onBack}>Pillars</button>
            <span aria-hidden="true">/</span>
            <b>{meta.name}</b>
          </nav>
          <div className="fd-top-r">
            <span className="fd-email">{founderEmail}</span>
            <button className="fd-btn quiet sm" onClick={onExit}>Public site</button>
            <button className="fd-btn ghost sm" onClick={onLogout}>Sign out</button>
          </div>
        </header>
        <div className="fd-body">
          <aside className="fd-side" aria-label={meta.name + " sections"}>
            <div className="fd-pillar">
              <div className="fd-pillar-ic">{ICON[pillarKey] || ICON.grant}</div>
              <div><b>{meta.name}</b><small>{noVisibility ? meta.sub : visible ? "Live on the public site" : "Hidden from the public site"}</small></div>
            </div>
            {nav.map(n => (
              <button key={n.id} className="fd-nav" aria-current={active === n.id ? "page" : undefined} onClick={() => onNav(n.id)}>
                <span className="fd-nav-ic">{n.icon}</span>{n.label}
                {typeof n.count === "number" && <span className={"fd-count" + (n.hot ? " hot" : "")}>{n.count}</span>}
              </button>
            ))}
            {!noVisibility && <div className="fd-side-foot">
              <Switch on={visible} onChange={v => store.savePillarActive(pillarKey, v)}>Show pillar on public site</Switch>
            </div>}
          </aside>
          <main className="fd-main">{children}
            {!noVisibility && <div className="fd-mvis fd-card"><div><b style={{ fontWeight: 600 }}>{meta.name}</b><div className="fd-sub" style={{ margin: 0 }}>{visible ? "Live on the public site" : "Hidden from the public site"}</div></div><Switch on={visible} onChange={v => store.savePillarActive(pillarKey, v)}>Show</Switch></div>}
          </main>
        </div>
      </div>
    );
  }
  const Head = ({ title, lede, children }) => (
    <div className="fd-head"><div><h1 className="fd-h1">{title}</h1>{lede && <p className="fd-lede">{lede}</p>}</div>{children && <div className="fd-actions">{children}</div>}</div>
  );

  // ============================================================
  // PILLAR CONFIG
  // ============================================================
  const PILLARS = {
    worship: { name: "Houses of Worship", grantName: "Houses of Worship", accent: "#C9A961", unit: ["mosque", "mosques"], unitLabel: "Mosques built", get: s => s.getWorship(), save: (s, v) => s.saveWorship(v), unitField: "mosques", partner: "Minang Bandung Foundation", project: "e.g. Masjid Al-Ikhlas — construction", note: "the site", firstEntry: "The first mosque", linkMode: "pillar", linkHelp: "Usually the partner foundation's construction or donation page (for example, Minang Bandung's mosque project page)." },
    foodland: { name: "Food & Land", grantName: "Food & Land", accent: "#A8C97F", unit: ["tree", "trees"], unitLabel: "Trees planted", get: s => s.getFoodland(), save: (s, v) => s.saveFoodland(v), unitField: "trees", partner: "", project: "e.g. Trees for Life — olive saplings", firstEntry: "The first five trees", linkMode: "partner", linkHelp: "Usually Zaytoun's Trees for Life page (https://zaytoun.uk/plant-a-tree/)." },
    water: { name: "Clean Water", grantName: "Clean Water", accent: "#7FB8C9", unit: ["well", "wells"], unitLabel: "Wells built", get: s => s.getWater(), save: (s, v) => s.saveWater(v), unitField: "trees", partner: "", project: "e.g. Village well — phase I", firstEntry: "The first well", linkMode: "partner", linkHelp: "The drilling or water partner's programme page. Hide the button while there is no active partner." },
    hospitals: { name: "Hospitals", grantName: "Hospitals", accent: "#C9847F", unit: ["clinic", "clinics"], unitLabel: "Clinics opened", get: s => s.getPillarContent("hospitals"), save: (s, v) => s.savePillarContent("hospitals", v), unitField: "units", partner: "", project: "e.g. Village clinic — phase I", firstEntry: "The first clinic", linkMode: "partner", linkHelp: "The health partner's programme page. Hide the button while there is no active partner." },
    schools: { name: "Schools", grantName: "Schools", accent: "#C9BC7F", unit: ["school", "schools"], unitLabel: "Schools raised", get: s => s.getPillarContent("schools"), save: (s, v) => s.savePillarContent("schools", v), unitField: "units", partner: "", project: "e.g. Primary school — phase I", firstEntry: "The first school", linkMode: "partner", linkHelp: "The education partner's programme page. Hide the button while there is no active partner." },
    livestock: { name: "Livestock & Enterprise", grantName: "Livestock & Enterprise", accent: "#C9A07F", unit: ["placement", "placements"], unitLabel: "Placements", get: s => s.getPillarContent("livestock"), save: (s, v) => s.savePillarContent("livestock", v), unitField: "units", partner: "", project: "e.g. Goat herd — family batch I", firstEntry: "The first herd", linkMode: "partner", linkHelp: "The enterprise partner's programme page. Hide the button while there is no active partner." },
    infra: { name: "Sustainable Infrastructure", grantName: "Sustainable Infrastructure", accent: "#9FA8B8", unit: ["work", "works"], unitLabel: "Works completed", get: s => s.getPillarContent("infra"), save: (s, v) => s.savePillarContent("infra", v), unitField: "units", partner: "", project: "e.g. Footbridge — phase I", firstEntry: "The first bridge", linkMode: "partner", linkHelp: "The works partner's programme page. Hide the button while there is no active partner." },
    library: { name: "The Library", accent: "#C98A61", linkMode: "pillar", linkHelp: "Usually your Lynk storefront (for example https://lynk.id/brial) where readers browse and buy the books." },
    scholarships: { name: "Scholarships", accent: "#C9A961" },
    site: { name: "Site settings", accent: "#9FB4D9", sub: "Applies to the whole public site" },
    treasury: { name: "Treasury", accent: "#7FC9A8", sub: "Money in and out of the endowment" },
  };

  // ============================================================
  // GRANTS
  // ============================================================
  function GrantForm({ cfg, initial, onSave, onClose }) {
    const [f, setF] = useState(() => initial || { partner: cfg.partner || "", project: "", country: "", amount: "", units: "", note: "", date: today() });
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const ok = parseFloat(f.amount) > 0 && f.project.trim();
    return (
      <Modal title={initial ? "Edit grant" : "Record a grant"} sub={`Funds sent to a ${cfg.name} partner. Totals feed the public "Total distributed" figure.`} onClose={onClose}>
        <div className="fd-form">
          <Field label="Project"><input className="fd-input" value={f.project} onChange={e => set("project", e.target.value)} placeholder={cfg.project} autoFocus /></Field>
          <div className="fd-grid2">
            <Field label="Partner"><input className="fd-input" value={f.partner} onChange={e => set("partner", e.target.value)} placeholder="Organisation that carries out the work" /></Field>
            <Field label="Country"><input className="fd-input" value={f.country} onChange={e => set("country", e.target.value)} placeholder="e.g. Indonesia" /></Field>
          </div>
          <div className="fd-grid3">
            <Field label="Amount (USD)"><div className="fd-money"><input className="fd-input" inputMode="decimal" value={f.amount} onChange={e => set("amount", e.target.value)} placeholder="0" /></div></Field>
            <Field label={cfg.unitLabel + " (this grant)"}><input className="fd-input" type="number" min="0" value={f.units} onChange={e => set("units", e.target.value)} placeholder="0" /></Field>
            <Field label="Date"><input className="fd-input" type="date" value={f.date} onChange={e => set("date", e.target.value)} /></Field>
          </div>
          <Field label="Note (optional)"><input className="fd-input" value={f.note} onChange={e => set("note", e.target.value)} placeholder="Short description" /></Field>
        </div>
        <div className="fd-actions" style={{ marginTop: 20 }}>
          <button className="fd-btn primary" disabled={!ok} onClick={() => { onSave(f); onClose(); }}>{initial ? "Save changes" : "Record grant"}</button>
          <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </Modal>
    );
  }

  function GrantsView({ store, cfg }) {
    const all = store.getPillarGrants().filter(g => g.pillar === cfg.grantName).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const live = all.filter(g => !g.archived);
    const [filter, setFilter] = useState("live");
    const [edit, setEdit] = useState(null); // null | "new" | grant
    const [m, flash] = useFlash();
    const total = live.reduce((a, g) => a + (Number(g.amount) || 0), 0);
    const units = live.reduce((a, g) => a + (Number(g.units) || 0), 0);
    const nations = new Set(live.map(g => (g.country || "").trim().toLowerCase()).filter(Boolean)).size;
    const shown = filter === "live" ? live : filter === "archived" ? all.filter(g => g.archived) : all;
    const save = f => {
      const payload = { pillar: cfg.grantName, partner: f.partner, project: f.project, country: f.country, amount: parseFloat(f.amount), units: f.units, note: f.note, date: new Date(f.date).toISOString() };
      if (edit && edit !== "new") { store.updatePillarGrant(edit.id, payload); flash("Grant updated."); }
      else { store.addPillarGrant(payload); flash("Grant recorded."); }
    };
    const G = "minmax(0,2fr) minmax(0,1.2fr) minmax(0,.8fr) minmax(0,.8fr) minmax(0,1fr) auto";
    return (
      <>
        <Head title="Grants" lede={`Every payment to a ${cfg.name} partner. Archived grants stay on record but leave the public totals.`}>
          <button className="fd-btn primary" onClick={() => setEdit("new")}>Record a grant</button>
        </Head>
        <Stats items={[{ label: "Total granted", value: money(total) }, { label: cfg.unitLabel, value: units }, { label: "Countries", value: nations }, { label: "Grants on record", value: all.length, sub: all.length - live.length ? `${all.length - live.length} archived` : null }]} />
        <div className="fd-toolbar"><Seg value={filter} onChange={setFilter} items={[["live", "Counted", live.length], ["archived", "Archived", all.length - live.length], ["all", "All", all.length]]} /><div style={{ marginLeft: "auto" }}><Flash m={m} /></div></div>
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Project</div><div>Partner</div><div>Country</div><div>Amount</div><div>Reference · date</div><div /></div>
          {shown.length === 0 ? <Empty title="No grants here yet.">Record the first grant to start this pillar's ledger.</Empty> : shown.map(g => (
            <div key={g.id} className={"fd-tr" + (g.archived ? " dim" : "")} style={{ gridTemplateColumns: G }}>
              <div className="fd-td full"><b>{g.project || "Untitled grant"}</b>{g.note && <small>{g.note}</small>}{Number(g.units) > 0 && <small style={{ color: cfg.accent }}>{g.units} {plural(g.units, cfg.unit[0], cfg.unit[1])}</small>}{g.archived && <Tag>Archived</Tag>}</div>
              <div className="fd-td" data-l="Partner">{g.partner || "—"}</div>
              <div className="fd-td" data-l="Country">{g.country || "—"}</div>
              <div className="fd-td" data-l="Amount"><span className="num">{money(g.amount)}</span></div>
              <div className="fd-td" data-l="Reference"><span className="fd-mono">{g.txRef || "—"}</span><small>{fdate(g.date)}</small></div>
              <div className="fd-td full"><div className="fd-actions" style={{ justifyContent: "flex-end" }}>
                <button className="fd-btn ghost sm" onClick={() => setEdit({ ...g, initial: { partner: g.partner || "", project: g.project || "", country: g.country || "", amount: String(g.amount || ""), units: String(g.units || ""), note: g.note || "", date: g.date ? String(g.date).slice(0, 10) : today() } })}>Edit</button>
                <button className="fd-btn quiet sm" onClick={() => store.updatePillarGrant(g.id, { archived: !g.archived })}>{g.archived ? "Restore" : "Archive"}</button>
                <Confirm onConfirm={() => store.deletePillarGrant(g.id)}>Delete</Confirm>
              </div></div>
            </div>
          ))}
        </div>
        {edit && <GrantForm cfg={cfg} initial={edit === "new" ? null : edit.initial} onSave={save} onClose={() => setEdit(null)} />}
      </>
    );
  }

  // ============================================================
  // PROGRAMME (public page copy + journal)
  // ============================================================
  function ProgrammeView({ store, cfg }) {
    const [f, setF] = useState(() => cfg.get(store));
    const [saved, setSaved] = useState(() => JSON.stringify(cfg.get(store)));
    const [busy, setBusy] = useState(null);
    const [m, flash] = useFlash();
    const dirty = JSON.stringify(f) !== saved;
    const set = patch => setF(p => ({ ...p, ...patch }));
    const setA = (id, patch) => setF(p => ({ ...p, articles: p.articles.map(a => (a.id === id ? { ...a, ...patch } : a)) }));
    const add = () => setF(p => ({ ...p, articles: [{ id: "note-" + Date.now(), date: today(), title: "", body: "", partner: "", link: "", photo: null, draft: true }, ...(p.articles || [])] }));
    const del = id => setF(p => ({ ...p, articles: p.articles.filter(a => a.id !== id) }));
    const save = () => { cfg.save(store, f); setSaved(JSON.stringify(f)); flash("Saved — the public page is updated."); };
    const unitsFromGrants = store.getPillarUnits ? store.getPillarUnits(cfg.grantName) : 0;
    useEffect(() => {
      const h = e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
      window.addEventListener("beforeunload", h);
      return () => window.removeEventListener("beforeunload", h);
    }, [dirty]);
    return (
      <>
        <Head title="Programme page" lede={`What visitors read on the public ${cfg.name} page: the summary at the top and the journal below it.`} />
        <div className="fd-card">
          <div className="fd-card-head"><h2 className="fd-h2">Page summary</h2></div>
          <div className="fd-form">
            <div className="fd-grid2">
              <Field label="Location line"><input className="fd-input" value={f.location || ""} onChange={e => set({ location: e.target.value })} placeholder="Village · District — Country" /></Field>
              <Field label="Partner line"><input className="fd-input" value={f.partnerLine || ""} onChange={e => set({ partnerLine: e.target.value })} placeholder="In partnership with …" /></Field>
            </div>
            <Field label="Introduction" hint="How the programme works, in two or three sentences."><textarea className="fd-input" value={f.intro || ""} onChange={e => set({ intro: e.target.value })} /></Field>
            <Field label={cfg.unitLabel + " shown on the page"} hint={unitsFromGrants > 0 ? `The page currently shows ${unitsFromGrants}, counted from your grants. This number is only used when no grant has a count.` : "Used until a grant records a count."} style={{ maxWidth: 260 }}>
              <input className="fd-input" type="number" min="0" value={f[cfg.unitField] ?? 0} onChange={e => set({ [cfg.unitField]: Math.max(0, parseInt(e.target.value || "0", 10)) })} />
            </Field>
          </div>
        </div>

        <div className="fd-head" style={{ marginTop: 32, marginBottom: 14 }}>
          <div><h2 className="fd-h3">Journal</h2><p className="fd-sub">Field notes with photos. Drafts stay hidden until you publish them.</p></div>
          <button className="fd-btn ghost" onClick={add}>Add entry</button>
        </div>
        {(f.articles || []).length === 0 && <div className="fd-card"><Empty title="No journal entries yet.">Add the first word from {cfg.note || "the field"}.</Empty></div>}
        {(f.articles || []).map(a => {
          const img = a.photo && (a.photo.url || a.photo.path) ? (a.photo.url || window.brialSupabase.publicUrl(a.photo.path)) : null;
          return (
            <div className="fd-card" key={a.id}>
              <div className="fd-card-head">
                <Tag tone={a.draft ? "" : "ok"} dot>{a.draft ? "Draft" : "Published"}</Tag>
                <div className="fd-actions">
                  <button className={"fd-btn sm " + (a.draft ? "ok" : "ghost")} onClick={() => setA(a.id, { draft: !a.draft })}>{a.draft ? "Publish" : "Move to drafts"}</button>
                  <Confirm onConfirm={() => del(a.id)}>Delete entry</Confirm>
                </div>
              </div>
              <div className="fd-form">
                <div className="fd-grid2" style={{ gridTemplateColumns: "minmax(0,1fr) 180px" }}>
                  <Field label="Title"><input className="fd-input" value={a.title || ""} onChange={e => setA(a.id, { title: e.target.value })} placeholder={cfg.firstEntry} /></Field>
                  <Field label="Date"><input className="fd-input" type="date" value={a.date && a.date.length >= 10 ? a.date.slice(0, 10) : ""} onChange={e => setA(a.id, { date: e.target.value })} /></Field>
                </div>
                <Field label="Story"><textarea className="fd-input" value={a.body || ""} onChange={e => setA(a.id, { body: e.target.value })} /></Field>
                <div className="fd-grid2">
                  <Field label="Partner (optional)"><input className="fd-input" value={a.partner || ""} onChange={e => setA(a.id, { partner: e.target.value })} /></Field>
                  <Field label="Link (optional)"><input className="fd-input" value={a.link || ""} onChange={e => setA(a.id, { link: e.target.value })} placeholder="https://…" /></Field>
                </div>
                <div className="fd-actions">
                  {img && <Img className="fd-thumb" src={img} />}
                  <PhotoUpload onUploaded={meta => setA(a.id, { photo: { url: meta.url, path: meta.path, name: meta.name } })}>{img ? "Replace photo" : "Add photo"}</PhotoUpload>
                  {img && <button className="fd-btn quiet sm" onClick={() => setA(a.id, { photo: null })}>Remove photo</button>}
                </div>
              </div>
            </div>
          );
        })}
        {(dirty || m) && (
          <div className="fd-savebar">
            <span style={{ color: dirty ? "var(--amber)" : "var(--sage)", fontWeight: 600 }}>{dirty ? "You have unsaved changes" : m && m.text}</span>
            <div className="fd-actions">
              {dirty && <button className="fd-btn quiet" onClick={() => setF(JSON.parse(saved))}>Discard</button>}
              <button className="fd-btn primary" disabled={!dirty} onClick={save}>Save and publish</button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ============================================================
  // LINK
  // ============================================================
  function LinkView({ store, pillarKey, cfg }) {
    const stored = store.getPillarLink(pillarKey) || "";
    const [url, setUrl] = useState(stored);
    const hidden = store.getPillarLinkHidden ? store.getPillarLinkHidden(pillarKey) : false;
    const [m, flash] = useFlash();
    const valid = /^https?:\/\/\S+\.\S+/i.test(url.trim());
    const dirty = url.trim() !== stored;
    const pillarMode = cfg.linkMode === "pillar";
    return (
      <>
        <Head title={pillarMode ? "Pillar link" : "Partner button"} lede={pillarMode ? `Where visitors go when they choose ${cfg.name} on the public site.` : `The "Learn more about our partner" button on the public ${cfg.name} page.`} />
        <div className="fd-card" style={{ maxWidth: 760 }}>
          <Field label="Destination address" hint={cfg.linkHelp}>
            <input className="fd-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" spellCheck={false} />
          </Field>
          {url.trim() && !valid && <div className="fd-msg err" style={{ marginTop: 10 }}>Use a full address that starts with https://</div>}
          <div className="fd-actions" style={{ marginTop: 16 }}>
            <button className="fd-btn primary" disabled={!dirty || !valid} onClick={() => { store.savePillarLink(pillarKey, url.trim()); flash("Link saved."); }}>Save link</button>
            {valid && <a className="fd-btn ghost" href={url.trim()} target="_blank" rel="noopener noreferrer">Test link {ICON.ext}</a>}
            <Flash m={m} />
          </div>
        </div>
        <div className="fd-card" style={{ maxWidth: 760 }}>
          <div className="fd-card-head" style={{ marginBottom: 6 }}>
            <div><h2 className="fd-h2">{hidden ? "The button is hidden" : "The button is visible"}</h2><p className="fd-sub">{hidden ? "Visitors don't see a link. Turn it back on when you have a destination." : "Hide it while you are between partners."}</p></div>
            <Switch on={!hidden} onChange={v => store.savePillarLinkHidden && store.savePillarLinkHidden(pillarKey, !v)}>{hidden ? "Hidden" : "Visible"}</Switch>
          </div>
          <p className="fd-sub">Currently saved: <span className="fd-mono">{stored || "not set"}</span></p>
        </div>
      </>
    );
  }

  // ============================================================
  // LIBRARY
  // ============================================================
  const BLANK_BOOK = () => ({ id: "book-" + Date.now().toString(36), lang: "", langCode: "", title: "", subtitle: "", cover: "", link: "", getLabel: "Get the e-book", supportNote: "A portion of every sale supports Brial Endowment scholarships.", accent: "#C9A961", desc: "", points: [] });
  function BookForm({ book, onSave, onClose }) {
    const [b, setB] = useState(book);
    const set = (k, v) => setB(p => ({ ...p, [k]: v }));
    return (
      <Modal wide title={book.title ? "Edit book" : "Add a book"} sub="Shown in the e-book catalogue on the public site." onClose={onClose}>
        <div className="fd-form">
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {b.cover ? <Img className="fd-cover" src={b.cover} fallback={<div className="fd-cover">Cover</div>} /> : <div className="fd-cover">No cover</div>}
            <PhotoUpload onUploaded={meta => set("cover", meta.url || (meta.path ? window.brialSupabase.publicUrl(meta.path) : ""))}>{b.cover ? "Replace cover" : "Upload cover"}</PhotoUpload>
          </div>
          <div className="fd-grid2">
            <Field label="Title"><input className="fd-input" value={b.title} onChange={e => set("title", e.target.value)} /></Field>
            <Field label="Subtitle"><input className="fd-input" value={b.subtitle} onChange={e => set("subtitle", e.target.value)} /></Field>
          </div>
          <div className="fd-grid3">
            <Field label="Language"><input className="fd-input" value={b.lang} onChange={e => set("lang", e.target.value)} placeholder="Bahasa Indonesia" /></Field>
            <Field label="Language code"><input className="fd-input" value={b.langCode} onChange={e => set("langCode", e.target.value.toUpperCase().slice(0, 3))} placeholder="ID" /></Field>
            <Field label="Accent colour"><input className="fd-input" type="color" value={b.accent || "#C9A961"} onChange={e => set("accent", e.target.value)} style={{ height: 42, padding: 4 }} /></Field>
          </div>
          <Field label="Description"><textarea className="fd-input" value={b.desc} onChange={e => set("desc", e.target.value)} /></Field>
          <Field label="Key points" hint="One per line."><textarea className="fd-input" style={{ minHeight: 90 }} value={(b.points || []).join("\n")} onChange={e => set("points", e.target.value.split("\n"))} /></Field>
          <div className="fd-grid2">
            <Field label="Store link"><input className="fd-input" value={b.link} onChange={e => set("link", e.target.value)} placeholder="https://lynk.id/…" /></Field>
            <Field label="Button label"><input className="fd-input" value={b.getLabel} onChange={e => set("getLabel", e.target.value)} /></Field>
          </div>
          <Field label="Support note"><input className="fd-input" value={b.supportNote} onChange={e => set("supportNote", e.target.value)} /></Field>
        </div>
        <div className="fd-actions" style={{ marginTop: 20 }}>
          <button className="fd-btn primary" disabled={!b.title.trim()} onClick={() => { onSave({ ...b, points: (b.points || []).filter(p => p.trim()) }); onClose(); }}>Save book</button>
          <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </Modal>
    );
  }
  function CatalogView({ store }) {
    const books = store.listEbooks();
    const [edit, setEdit] = useState(null);
    const [m, flash] = useFlash();
    const commit = (next, msg) => { store.saveEbooks(next); flash(msg); };
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= books.length) return; const n = books.slice(); [n[i], n[j]] = [n[j], n[i]]; commit(n, "Order saved."); };
    return (
      <>
        <Head title="Catalogue" lede="The e-books listed on the public Library page, in this order."><button className="fd-btn primary" onClick={() => setEdit(BLANK_BOOK())}>Add a book</button></Head>
        <div className="fd-toolbar"><Flash m={m} /></div>
        <div className="fd-table">
          {books.length === 0 ? <Empty title="The catalogue is empty.">Add your first book.</Empty> : books.map((b, i) => (
            <div key={b.id || i} className="fd-tr" style={{ gridTemplateColumns: "auto minmax(0,1fr) auto" }}>
              {b.cover ? <Img className="fd-cover" src={b.cover} fallback={<div className="fd-cover">Cover</div>} /> : <div className="fd-cover">No cover</div>}
              <div className="fd-td"><b>{b.title || "Untitled"}</b><small>{b.subtitle}</small><div className="fd-actions" style={{ marginTop: 6 }}>{(b.langCode || b.lang) && <Tag>{b.langCode || b.lang}</Tag>}{b.link ? <a className="fd-mono" href={b.link} target="_blank" rel="noopener noreferrer">{b.link.replace(/^https?:\/\//, "")}</a> : <Tag tone="warn">No store link</Tag>}</div></div>
              <div className="fd-actions">
                <button className="fd-btn quiet sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                <button className="fd-btn quiet sm" disabled={i === books.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                <button className="fd-btn ghost sm" onClick={() => setEdit(b)}>Edit</button>
                <Confirm onConfirm={() => commit(books.filter((_, k) => k !== i), "Book removed.")}>Remove</Confirm>
              </div>
            </div>
          ))}
        </div>
        {edit && <BookForm book={edit} onClose={() => setEdit(null)} onSave={nb => { const exists = books.some(x => x.id === nb.id); commit(exists ? books.map(x => (x.id === nb.id ? nb : x)) : [...books, nb], exists ? "Book updated." : "Book added."); }} />}
      </>
    );
  }
  function SalesView({ store }) {
    const sales = store.listLibrarySales();
    const books = store.listEbooks();
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({ bookId: books[0] ? books[0].id : "", qty: "1", amount: "", note: "", date: today() });
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const total = sales.reduce((a, s) => a + (Number(s.amount) || 0), 0);
    const copies = sales.reduce((a, s) => a + (Number(s.qty) || 1), 0);
    const save = () => {
      const b = books.find(x => x.id === f.bookId);
      store.addLibrarySale({ bookId: f.bookId, title: b ? b.title : "Library edition", lang: b ? b.langCode || b.lang || "" : "", qty: f.qty, amount: parseFloat(f.amount), note: f.note, date: new Date(f.date).toISOString() });
      setF({ bookId: books[0] ? books[0].id : "", qty: "1", amount: "", note: "", date: today() });
      setOpen(false);
    };
    const G = "minmax(0,2fr) 70px minmax(0,.8fr) minmax(0,1fr) auto";
    return (
      <>
        <Head title="Sales" lede="Income from book sales. Each sale enters the public ledger as a verified gift."><button className="fd-btn primary" onClick={() => setOpen(true)} disabled={!books.length}>Record a sale</button></Head>
        <Stats items={[{ label: "Total income", value: money(total) }, { label: "Copies sold", value: copies }, { label: "Sales recorded", value: sales.length }]} />
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Edition</div><div>Copies</div><div>Income</div><div>Reference · date</div><div /></div>
          {sales.length === 0 ? <Empty title="No sales recorded yet." /> : sales.map(s => (
            <div key={s.id} className="fd-tr" style={{ gridTemplateColumns: G }}>
              <div className="fd-td full"><b>{s.title}</b>{s.lang && <small>{s.lang}</small>}{s.note && <small>{s.note}</small>}</div>
              <div className="fd-td" data-l="Copies">{s.qty || 1}</div>
              <div className="fd-td" data-l="Income"><span className="num">{money(s.amount)}</span></div>
              <div className="fd-td" data-l="Reference"><span className="fd-mono">{s.txRef || "—"}</span><small>{fdate(s.date)}</small></div>
              <div className="fd-td"><Confirm onConfirm={() => store.deleteLibrarySale(s.id)}>Delete</Confirm></div>
            </div>
          ))}
        </div>
        {open && (
          <Modal title="Record a sale" onClose={() => setOpen(false)}>
            <div className="fd-form">
              <Field label="Edition"><select className="fd-input" value={f.bookId} onChange={e => set("bookId", e.target.value)}>{books.map(b => <option key={b.id} value={b.id}>{b.title}{b.langCode || b.lang ? ` (${b.langCode || b.lang})` : ""}</option>)}</select></Field>
              <div className="fd-grid3">
                <Field label="Copies"><input className="fd-input" type="number" min="1" value={f.qty} onChange={e => set("qty", e.target.value)} /></Field>
                <Field label="Income (USD)"><div className="fd-money"><input className="fd-input" inputMode="decimal" value={f.amount} onChange={e => set("amount", e.target.value)} /></div></Field>
                <Field label="Date"><input className="fd-input" type="date" value={f.date} onChange={e => set("date", e.target.value)} /></Field>
              </div>
              <Field label="Note (optional)"><input className="fd-input" value={f.note} onChange={e => set("note", e.target.value)} placeholder="e.g. Lynk payout, October" /></Field>
            </div>
            <div className="fd-actions" style={{ marginTop: 20 }}>
              <button className="fd-btn primary" disabled={!(parseFloat(f.amount) > 0) || !f.bookId} onClick={save}>Record sale</button>
              <button className="fd-btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </Modal>
        )}
      </>
    );
  }

  // ============================================================
  // SCHOLARSHIPS
  // ============================================================
  const STAGE = {
    registered: ["", "Draft"], submitted: ["gold", "To review"], "interview-scheduled": ["sky", "Interview booked"], "interview-done": ["warn", "Decision due"], accepted: ["ok", "Granted"], rejected: ["bad", "Declined"],
  };
  const SCH = { active: ["ok", "Active"], suspended: ["warn", "Paused"], revoked: ["bad", "Revoked"], graduated: ["gold", "Graduated"] };
  const StageTag = ({ s }) => { const m = STAGE[s] || ["", s]; return <Tag tone={m[0]} dot>{m[1]}</Tag>; };
  const Avatar = ({ app, size }) => {
    const per = app.profile?.personal || {};
    const u = fileUrl(per.showcasePhoto || (isImage(per.photoFile) ? per.photoFile : null));
    const st = size ? { width: size, height: size * 1.25 } : null;
    const ph = <div className="fd-avatar" style={st}>{(app.name || "?").charAt(0)}</div>;
    return u ? <Img className="fd-avatar" style={st} src={u} fallback={ph} /> : ph;
  };
  const Row = ({ label, value, wide }) => <div className={wide ? "wide" : ""}><dt>{label}</dt><dd className={value ? "" : "none"}>{value || "Not provided"}</dd></div>;

  function StagePanel({ app, store }) {
    const [date, setDate] = useState(() => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
    const [time, setTime] = useState("14:30");
    const [link, setLink] = useState(app.meetingLink || "");
    const first = titleCase((app.name || "").split(" ")[0]);
    const decide = (app.status === "submitted" || app.status === "interview-scheduled" || app.status === "interview-done") && (
      <div className="fd-actions" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
        <Confirm className="fd-btn primary" armedLabel="Click again to grant" onConfirm={() => store.acceptApplication(app.id)}>Grant scholarship</Confirm>
        <Confirm armedLabel="Click again to decline" onConfirm={() => store.rejectApplication(app.id)}>Decline</Confirm>
      </div>
    );
    if (app.status === "registered") return <div className="fd-msg info">This applicant has an account but hasn't submitted the application yet.</div>;
    if (app.status === "rejected") return <div className="fd-msg info">Declined on {fdate(app.rejectedAt)}.</div>;
    if (app.status === "accepted") return null;
    return (
      <div className="fd-stage">
        {app.status === "submitted" && (
          <>
            <div className="fd-stage-k">Next step</div>
            <h3 className="fd-h3" style={{ marginTop: 4 }}>Book an interview</h3>
            <p className="fd-sub">{first} will see the time, the meeting link and a join button in the portal.</p>
            <div className="fd-grid2" style={{ marginTop: 14 }}>
              <Field label="Date"><input className="fd-input" type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
              <Field label="Time (your time zone)"><input className="fd-input" type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
            </div>
            <Field label="Meeting link" style={{ marginTop: 12 }}><input className="fd-input" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://meet.google.com/… or https://zoom.us/j/…" /></Field>
            <div className="fd-actions" style={{ marginTop: 14 }}><button className="fd-btn primary" disabled={!link.trim()} onClick={() => store.scheduleInterview(app.id, new Date(`${date}T${time}:00`).toISOString(), link.trim())}>Send invitation</button>{!link.trim() && <small className="fd-sub" style={{ margin: 0 }}>Add the meeting link first.</small>}</div>
          </>
        )}
        {app.status === "interview-scheduled" && (
          <>
            <div className="fd-stage-k">Interview booked</div>
            <h3 className="fd-h3" style={{ marginTop: 4 }}>{fdatetime(app.interviewAt)}</h3>
            {app.meetingLink && <div className="fd-actions" style={{ marginTop: 10 }}><a className="fd-btn ghost sm" href={/^https?:\/\//i.test(app.meetingLink) ? app.meetingLink : "https://" + app.meetingLink} target="_blank" rel="noopener noreferrer">Open meeting {ICON.ext}</a><button className="fd-btn quiet sm" onClick={() => copy(app.meetingLink)}>Copy link</button></div>}
            <div className="fd-actions" style={{ marginTop: 14 }}><button className="fd-btn primary" onClick={() => store.markInterviewDone(app.id)}>Mark interview as done</button></div>
          </>
        )}
        {app.status === "interview-done" && (
          <>
            <div className="fd-stage-k">Decision due</div>
            <h3 className="fd-h3" style={{ marginTop: 4 }}>Interviewed on {fdate(app.interviewDoneAt)}</h3>
            <p className="fd-sub">Record your decision below.</p>
          </>
        )}
        {decide}
      </div>
    );
  }

  function ScholarControls({ app, store }) {
    const [action, setAction] = useState(null);
    const [reason, setReason] = useState("");
    const status = app.scholarStatus || "active";
    const ipk = store.cumulativeIPK(app);
    const apply = () => {
      if (!reason.trim()) return;
      if (action === "suspend") store.suspendScholarship(app.id, reason.trim());
      if (action === "revoke") store.revokeScholarship(app.id, reason.trim());
      if (action === "reactivate") store.reactivateScholarship(app.id, reason.trim());
      setAction(null); setReason("");
    };
    const copyT = { suspend: ["Pause scholarship", "The scholar sees your reason. No payments are made while paused.", "e.g. GPA for semester 3 fell below 2.75 — please explain before we continue."], revoke: ["End scholarship permanently", "The record is kept, but no further payments are made. Use only when reinstatement is not expected.", "e.g. Breach of the code of conduct: …"], reactivate: ["Reactivate scholarship", "The scholar can upload bills and transcripts again.", "e.g. Semester 4 GPA recovered to 3.20."] };
    return (
      <div className="fd-card">
        <div className="fd-card-head">
          <div><h2 className="fd-h2">Scholarship</h2><p className="fd-sub">{app.scholarId} · {app.cohort}{ipk ? ` · cumulative GPA ${ipk.value.toFixed(2)}` : ""}</p></div>
          <Tag tone={(SCH[status] || SCH.active)[0]} dot>{(SCH[status] || SCH.active)[1]}</Tag>
        </div>
        {ipk && ipk.value < 2.75 && <div className="fd-msg err" style={{ marginBottom: 12 }}>Cumulative GPA is below the 2.75 minimum.</div>}
        {!action && status !== "graduated" && status !== "revoked" && (
          <div className="fd-actions">
            {status === "active" && <button className="fd-btn ghost sm" onClick={() => setAction("suspend")}>Pause</button>}
            {status === "suspended" && <button className="fd-btn primary sm" onClick={() => setAction("reactivate")}>Reactivate</button>}
            <button className="fd-btn danger sm" onClick={() => setAction("revoke")}>End permanently</button>
          </div>
        )}
        {status === "revoked" && <p className="fd-sub">This scholarship has ended. No further actions are available.</p>}
        {action && (
          <div className="fd-form">
            <div><b>{copyT[action][0]}</b><p className="fd-sub">{copyT[action][1]}</p></div>
            <Field label="Reason (shown to the scholar)"><textarea className="fd-input" style={{ minHeight: 80 }} value={reason} onChange={e => setReason(e.target.value)} placeholder={copyT[action][2]} /></Field>
            <div className="fd-actions"><button className={"fd-btn " + (action === "revoke" ? "danger" : "primary")} disabled={!reason.trim()} onClick={apply}>Confirm</button><button className="fd-btn ghost" onClick={() => { setAction(null); setReason(""); }}>Cancel</button></div>
          </div>
        )}
        {(app.statusHistory || []).length > 0 && (
          <div style={{ marginTop: 16 }}>
            {app.statusHistory.slice().reverse().map((h, i) => (
              <div key={i} className="fd-file"><div style={{ minWidth: 0 }}><b style={{ fontWeight: 600 }}>{fdate(h.at)}</b><div className="fd-sub" style={{ margin: 0 }}>{h.reason}</div></div><Tag tone={(SCH[h.status] || ["", ""])[0]}>{(SCH[h.status] || ["", h.status])[1]}</Tag></div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function ChangeRequests({ app, store }) {
    const pending = (app.changeRequests || []).filter(r => r.status === "pending");
    const [rej, setRej] = useState(null);
    const [reason, setReason] = useState("");
    if (!pending.length) return null;
    return (
      <div className="fd-card" style={{ borderColor: "rgba(231,183,106,.4)" }}>
        <div className="fd-card-head"><h2 className="fd-h2">Correction requests</h2><Tag tone="warn">{pending.length} waiting</Tag></div>
        {pending.map(r => (
          <div key={r.id} className="fd-file" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0, flex: "1 1 240px" }}><b style={{ fontWeight: 600 }}>{r.label}</b><div className="fd-sub" style={{ margin: 0 }}>{r.type === "password" ? "New password (hidden)" : <>New value: <span style={{ color: "var(--text)" }}>{r.value}</span></>}</div><small className="fd-sub">Requested {fdate(r.requestedAt)}</small></div>
            {rej === r.id ? (
              <div className="fd-form" style={{ flex: "1 1 100%" }}>
                <Field label="Reason (optional, shown to the scholar)"><input className="fd-input" value={reason} onChange={e => setReason(e.target.value)} /></Field>
                <div className="fd-actions"><button className="fd-btn danger sm" onClick={() => { store.rejectChange(app.id, r.id, reason); setRej(null); setReason(""); }}>Decline request</button><button className="fd-btn ghost sm" onClick={() => setRej(null)}>Cancel</button></div>
              </div>
            ) : (
              <div className="fd-actions">
                <button className="fd-btn ok sm" onClick={async () => { const res = await store.approveChange(app.id, r.id); if (res && res.error) alert(res.error); }}>Approve</button>
                <button className="fd-btn ghost sm" onClick={() => { setRej(r.id); setReason(""); }}>Decline</button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  function ProfileBlock({ app }) {
    const p = app.profile || {}, per = p.personal || {}, hs = p.highSchool || {}, u = p.university || {};
    const lvl = window.BrialStore.DEGREE_LEVELS && window.BrialStore.DEGREE_LEVELS[u.degreeLevel];
    const docs = [["Biometric photo", per.photoFile], ["Report card", hs.raporFile], ["Student card", u.studentCardFile]];
    return (
      <>
        <details className="fd-details" open>
          <summary>Personal details</summary>
          <div><dl className="fd-dl">
            <Row label="Full name" value={titleCase(per.fullName || app.name)} /><Row label="Date of birth" value={per.dateOfBirth ? fdate(per.dateOfBirth) : ""} /><Row label="Phone" value={per.phone} /><Row label="Country" value={titleCase(per.country)} /><Row label="National ID" value={per.nationalId} /><Row label="Email" value={app.email} /><Row label="Address" value={per.address} wide />
          </dl></div>
        </details>
        <details className="fd-details">
          <summary>Education</summary>
          <div><dl className="fd-dl">
            <Row label="University" value={instCase(u.name)} /><Row label="Study programme" value={instCase(u.program)} /><Row label="Level" value={lvl ? lvl.label : u.degreeLevel} /><Row label="Current semester" value={u.currentSemester} /><Row label="GPA at application" value={u.currentGPA} /><Row label="Tuition per semester" value={u.uktPerSemester ? money(u.uktPerSemester) : ""} />
            <Row label="High school" value={instCase(hs.schoolName)} /><Row label="Graduation year" value={hs.graduationYear} /><Row label="Final grade" value={hs.finalGPA} />
          </dl>
          {Array.isArray(hs.subjects) && hs.subjects.length > 0 && <dl className="fd-dl" style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>{hs.subjects.map((s, i) => <div key={i}><dt>{s.name || "Subject"}</dt><dd>{s.grade || "—"}</dd></div>)}</dl>}
          </div>
        </details>
        {(p.essay || "").trim() && (
          <details className="fd-details">
            <summary>Essay</summary>
            <div><p style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "'Cormorant Garamond',serif", fontSize: 18, lineHeight: 1.6, color: "var(--muted)", maxWidth: "70ch" }}>{p.essay}</p></div>
          </details>
        )}
        <details className="fd-details" open>
          <summary>Documents</summary>
          <div>{docs.map(([l, f]) => <div key={l} className="fd-file"><div style={{ minWidth: 0 }}><small className="fd-sub" style={{ margin: 0 }}>{l}</small><div style={{ fontWeight: 500, overflowWrap: "anywhere" }}>{f ? f.name || f.filename : "Not provided"}</div></div><FileBtn file={f} /></div>)}</div>
        </details>
      </>
    );
  }

  function SemesterSnapshot({ app }) {
    const sems = app.semesters || [];
    if (!sems.length) return null;
    const G = "minmax(0,1fr) minmax(0,1.3fr) minmax(0,1.1fr) auto";
    const tone = { completed: "ok", paid: "sky", "bill-uploaded": "warn", current: "gold", upcoming: "" };
    const lab = { completed: "Complete", paid: "Paid", "bill-uploaded": "Bill in review", current: "Bill due", upcoming: "Upcoming" };
    return (
      <div style={{ marginTop: 16 }}>
        <h2 className="fd-h2" style={{ margin: "0 0 10px" }}>Semesters</h2>
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Semester</div><div>Tuition bill</div><div>Transcript</div><div>Status</div></div>
          {sems.map(s => (
            <div key={s.id} className="fd-tr" style={{ gridTemplateColumns: G }}>
              <div className="fd-td full"><b>{s.label}</b></div>
              <div className="fd-td" data-l="Tuition bill">{s.bill ? <><button className="fd-btn quiet sm" style={{ padding: 0 }} onClick={() => window.BrialFiles.open(s.bill)}><span className="num" style={{ fontSize: 17 }}>{money(s.bill.amount)}</span></button><small>{s.paidAt ? "Paid " + fdate(s.paidAt) : "Sent " + fdate(s.bill.uploadedAt)}</small></> : <small>—</small>}</div>
              <div className="fd-td" data-l="Transcript">{s.ip ? <><button className="fd-btn quiet sm" style={{ padding: 0 }} onClick={() => window.BrialFiles.open(s.ip)}>GPA {s.ip.gpa}</button>{parseFloat(s.ip.gpa) < 2.75 && <small style={{ color: "var(--rose)" }}>Below 2.75</small>}</> : <small>—</small>}</div>
              <div className="fd-td"><Tag tone={tone[s.status]}>{lab[s.status] || s.status}</Tag></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function ApplicantDetail({ app, store, onBack }) {
    const [notes, setNotes] = useState(app.notes || "");
    const [m, flash] = useFlash();
    useEffect(() => { setNotes(app.notes || ""); }, [app.id]);
    return (
      <div className="fd-detail">
        <button className="fd-btn quiet fd-back" onClick={onBack}>← All applications</button>
        <div className="fd-card">
          <div className="fd-dhead">
            <div style={{ display: "flex", gap: 14, minWidth: 0 }}>
              <Avatar app={app} />
              <div style={{ minWidth: 0 }}>
                <h2 className="fd-h3" style={{ fontSize: 28 }}>{titleCase(app.name)}</h2>
                <p className="fd-sub">{instCase(app.profile?.university?.program)}{app.profile?.university?.name ? ", " + instCase(app.profile.university.name) : ""}</p>
                <p className="fd-sub">{app.id} · {app.submittedAt ? "Submitted " + fdate(app.submittedAt) : "Signed up " + fdate(app.signedUpAt)}</p>
              </div>
            </div>
            <StageTag s={app.status} />
          </div>
          <dl className="fd-dl" style={{ marginTop: 18 }}>
            <Row label="Email" value={app.email} /><Row label="Country" value={titleCase(app.profile?.personal?.country)} /><Row label="GPA at application" value={app.profile?.university?.currentGPA} /><Row label="Interview" value={app.interviewAt ? fdatetime(app.interviewAt) : "Not booked"} />
          </dl>
        </div>
        <div style={{ marginTop: 16 }}><StagePanel app={app} store={store} /></div>
        {app.status === "accepted" && <div style={{ marginTop: 16 }}><ScholarControls app={app} store={store} /></div>}
        <div style={{ marginTop: 16 }}><ChangeRequests app={app} store={store} /></div>
        {app.status === "accepted" && <SemesterSnapshot app={app} />}
        {app.graduation && (
          <div className="fd-card" style={{ marginTop: 16 }}>
            <div className="fd-card-head"><h2 className="fd-h2">Graduation documents</h2><Tag tone="gold">{fdate(app.graduation.graduatedAt)}</Tag></div>
            {[["Diploma (ijazah)", app.graduation.ijazahFile], ["Final transcript", app.graduation.transkripFile]].map(([l, f]) => <div key={l} className="fd-file"><div><small className="fd-sub" style={{ margin: 0 }}>{l}</small><div>{f ? f.name || f.filename : "Not provided"}</div></div><FileBtn file={f} /></div>)}
          </div>
        )}
        <div className="fd-card" style={{ marginTop: 16 }}>
          <div className="fd-card-head"><h2 className="fd-h2">Private notes</h2><Flash m={m} /></div>
          <textarea className="fd-input" value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => { if (notes !== (app.notes || "")) { store.saveNotes(app.id, notes); flash("Notes saved."); } }} placeholder="Observations, recommendation, follow-up questions. Only you can see this." />
          <small className="fd-sub">Saves when you click outside the box.</small>
        </div>
        <ProfileBlock app={app} />
      </div>
    );
  }

  function ApplicationsView({ store, apps, focus, clearFocus }) {
    const [filter, setFilter] = useState("todo");
    const [q, setQ] = useState("");
    const [sel, setSel] = useNav("fd-sel", null);
    useEffect(() => { if (focus) { setFilter("all"); setSel(focus, { replace: true }); clearFocus && clearFocus(); } }, [focus]);
    const live = apps.filter(a => a.status !== "registered");
    const count = s => apps.filter(a => a.status === s).length;
    const items = [["todo", "To do", live.filter(a => !["accepted", "rejected"].includes(a.status)).length], ["submitted", "To review", count("submitted")], ["interview-scheduled", "Interview booked", count("interview-scheduled")], ["interview-done", "Decision due", count("interview-done")], ["accepted", "Granted", count("accepted")], ["rejected", "Declined", count("rejected")], ["registered", "Drafts", count("registered")], ["all", "All", apps.length]];
    const list = useMemo(() => {
      const s = q.trim().toLowerCase();
      return apps.filter(a => (filter === "all" ? true : filter === "todo" ? a.status !== "registered" && !["accepted", "rejected"].includes(a.status) : a.status === filter))
        .filter(a => !s || [a.name, a.email, a.id, a.profile?.university?.name].some(x => (x || "").toLowerCase().includes(s)))
        .sort((a, b) => new Date(b.submittedAt || b.signedUpAt || 0) - new Date(a.submittedAt || a.signedUpAt || 0));
    }, [apps, filter, q]);
    const selected = apps.find(a => a.id === sel) || null;
    const desktopSel = selected || (typeof window !== "undefined" && window.innerWidth > 900 ? list[0] : null);
    return (
      <>
        <Head title="Applications" lede="Review applicants, book interviews and record decisions." />
        <div className={"fd-tools" + (selected ? " has-sel" : "")}>
          <div className="fd-toolbar"><Seg value={filter} onChange={v => { setFilter(v); setSel(null, { replace: true }); }} items={items} /></div>
          <div className="fd-toolbar"><Search value={q} onChange={setQ} placeholder="Search name, email, ID or university" /></div>
        </div>
        <div className={"fd-md" + (selected ? " has-sel" : "")}>
          <div className="fd-list" role="list">
            {list.length === 0 ? <Empty title="Nothing here.">{filter === "todo" ? "No applications are waiting for you." : "No applications match."}</Empty> : list.map(a => (
              <button key={a.id} className="fd-li" role="listitem" aria-current={desktopSel && desktopSel.id === a.id} onClick={() => { setSel(a.id); if (window.innerWidth <= 900) window.scrollTo({ top: 0 }); }}>
                <div className="fd-li-top"><b>{titleCase(a.name)}</b><span className="fd-sub" style={{ margin: 0, fontSize: 12 }}>{rel(a.submittedAt || a.signedUpAt)}</span></div>
                <small>{instCase(a.profile?.university?.name) || "—"}</small>
                <div className="fd-li-bot"><StageTag s={a.status} />{a.isUserSubmitted && a.status === "submitted" && <Tag tone="gold">New</Tag>}</div>
              </button>
            ))}
          </div>
          {desktopSel ? <ApplicantDetail key={desktopSel.id} app={desktopSel} store={store} onBack={() => { const h = history.state; if (h && h["nav:fd-sel"] === sel) history.back(); else setSel(null); }} /> : <div className="fd-detail fd-card"><Empty title="Choose an application." /></div>}
        </div>
      </>
    );
  }

  function PayDialog({ row, store, onClose }) {
    const [ref, setRef] = useState("");
    const { scholar: s, semester: sem } = row;
    return (
      <Modal title="Confirm payment" sub="Record this only after the transfer has been sent." onClose={onClose}>
        <dl className="fd-dl"><Row label="Scholar" value={titleCase(s.name)} /><Row label="Semester" value={sem.label} /><Row label="Amount" value={money(sem.bill?.amount)} /><Row label="University" value={instCase(s.profile?.university?.name)} /></dl>
        <div className="fd-actions" style={{ marginTop: 14 }}><FileBtn file={sem.bill} label="View bill" /></div>
        <Field label="Transfer reference (optional)" hint="Bank or transaction reference, for your records." style={{ marginTop: 16 }}><input className="fd-input" value={ref} onChange={e => setRef(e.target.value)} /></Field>
        <div className="fd-actions" style={{ marginTop: 20 }}>
          <button className="fd-btn primary" onClick={() => { store.payBill(s.id, sem.id, ref.trim()); onClose(); }}>Mark as paid</button>
          <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </Modal>
    );
  }
  function LegacyDialog({ store, onClose }) {
    const legacy = store.getLegacy();
    const [total, setTotal] = useState(String(legacy.totalFunds || ""));
    const [rows, setRows] = useState(() => (legacy.scholars && legacy.scholars.length ? legacy.scholars.map(s => ({ ...s, amount: s.amount ? String(s.amount) : "" })) : [{ name: "", school: "", country: "", amount: "" }]));
    const setR = (i, p) => setRows(rs => rs.map((r, k) => (k === i ? { ...r, ...p } : r)));
    const save = () => {
      const cleaned = rows.filter(s => (s.school || "").trim() || (s.name || "").trim());
      store.saveLegacy({ totalFunds: parseFloat(total) || 0, count: cleaned.length, scholars: cleaned.map(s => ({ name: (s.name || "").trim(), school: (s.school || "").trim(), country: (s.country || "").trim(), amount: parseFloat(s.amount) || 0 })) });
      onClose();
    };
    return (
      <Modal wide title="Founding-era support" sub="Scholars funded before the website existed. These count toward the public totals: funds, scholars, countries and institutions." onClose={onClose}>
        <Field label="Total paid before the website (USD)" style={{ maxWidth: 260 }}><div className="fd-money"><input className="fd-input" inputMode="decimal" value={total} onChange={e => setTotal(e.target.value)} /></div></Field>
        <h3 className="fd-h2" style={{ margin: "20px 0 8px" }}>Scholars</h3>
        <div className="fd-form">
          {rows.map((r, i) => (
            <div key={i} className="fd-grid3" style={{ gridTemplateColumns: "1fr 1.3fr .9fr .7fr auto", alignItems: "end" }}>
              <Field label={i === 0 ? "Name (optional)" : ""}><input className="fd-input" value={r.name} onChange={e => setR(i, { name: e.target.value })} /></Field>
              <Field label={i === 0 ? "School or university" : ""}><input className="fd-input" value={r.school} onChange={e => setR(i, { school: e.target.value })} /></Field>
              <Field label={i === 0 ? "Country" : ""}><input className="fd-input" value={r.country} onChange={e => setR(i, { country: e.target.value })} /></Field>
              <Field label={i === 0 ? "Amount" : ""}><input className="fd-input" inputMode="decimal" value={r.amount} onChange={e => setR(i, { amount: e.target.value })} placeholder="$" /></Field>
              <button className="fd-btn quiet sm" onClick={() => setRows(rs => rs.filter((_, k) => k !== i))} aria-label="Remove row">×</button>
            </div>
          ))}
        </div>
        <div className="fd-actions" style={{ marginTop: 14 }}><button className="fd-btn ghost sm" onClick={() => setRows(rs => [...rs, { name: "", school: "", country: "", amount: "" }])}>Add scholar</button></div>
        <div className="fd-actions" style={{ marginTop: 20 }}><button className="fd-btn primary" onClick={save}>Save</button><button className="fd-btn ghost" onClick={onClose}>Cancel</button></div>
      </Modal>
    );
  }
  function DisbursementsView({ store, scholars }) {
    const [tab, setTab] = useState("due");
    const [pay, setPay] = useState(null);
    const [legacyOpen, setLegacyOpen] = useState(false);
    const rows = [];
    scholars.forEach(sc => (sc.semesters || []).forEach(sem => { if (sem.bill) rows.push({ scholar: sc, semester: sem }); }));
    const due = rows.filter(r => r.semester.status === "bill-uploaded").sort((a, b) => new Date(a.semester.bill?.uploadedAt || 0) - new Date(b.semester.bill?.uploadedAt || 0));
    const paid = rows.filter(r => r.semester.paidAt).sort((a, b) => new Date(b.semester.paidAt) - new Date(a.semester.paidAt));
    const shown = tab === "due" ? due : paid;
    const sum = l => l.reduce((a, r) => a + (Number(r.semester.bill?.amount) || 0), 0);
    const legacy = store.getLegacy();
    const G = "minmax(0,1.6fr) minmax(0,.8fr) minmax(0,.8fr) minmax(0,1fr) auto";
    return (
      <>
        <Head title="Disbursements" lede="Tuition bills sent by scholars. Pay the university, then mark the bill as paid." />
        <Stats items={[{ label: "Waiting for payment", value: money(sum(due)), sub: `${due.length} ${plural(due.length, "bill", "bills")}`, tone: due.length ? "warn" : "" }, { label: "Paid through the portal", value: money(sum(paid)), sub: `${paid.length} ${plural(paid.length, "semester", "semesters")}` }, { label: "Founding-era support", value: money(legacy.totalFunds), sub: `${legacy.count || (legacy.scholars || []).length || 0} scholars` }]} />
        <div className="fd-toolbar"><Seg value={tab} onChange={setTab} items={[["due", "Waiting", due.length], ["paid", "Paid", paid.length]]} /><button className="fd-btn ghost sm" style={{ marginLeft: "auto" }} onClick={() => setLegacyOpen(true)}>Founding-era support</button></div>
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Scholar</div><div>Semester</div><div>Amount</div><div>{tab === "due" ? "Sent" : "Paid"}</div><div /></div>
          {shown.length === 0 ? <Empty title={tab === "due" ? "All bills are paid." : "No payments yet."}>{tab === "due" ? "New bills from scholars will appear here." : ""}</Empty> : shown.map(r => (
            <div key={r.scholar.id + r.semester.id} className="fd-tr" style={{ gridTemplateColumns: G }}>
              <div className="fd-td full"><b>{titleCase(r.scholar.name)}</b><small>{r.scholar.scholarId} · {instCase(r.scholar.profile?.university?.name)}</small></div>
              <div className="fd-td" data-l="Semester">{r.semester.label}</div>
              <div className="fd-td" data-l="Amount"><span className="num">{money(r.semester.bill?.amount)}</span></div>
              <div className="fd-td" data-l={tab === "due" ? "Sent" : "Paid"}>{fdate(tab === "due" ? r.semester.bill?.uploadedAt : r.semester.paidAt)}{tab === "paid" && r.semester.txHash && <small className="fd-mono">{r.semester.txHash}</small>}</div>
              <div className="fd-td full"><div className="fd-actions" style={{ justifyContent: "flex-end" }}><FileBtn file={r.semester.bill} label="View bill" />{tab === "due" && <button className="fd-btn primary sm" onClick={() => setPay(r)}>Mark as paid</button>}</div></div>
            </div>
          ))}
        </div>
        {pay && <PayDialog row={pay} store={store} onClose={() => setPay(null)} />}
        {legacyOpen && <LegacyDialog store={store} onClose={() => setLegacyOpen(false)} />}
      </>
    );
  }

  function PasswordDialog({ app, store, onClose }) {
    const [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [show, setShow] = useState(false), [err, setErr] = useState(null), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
    const go = async () => {
      setErr(null);
      if (pw.length < 8) return setErr("Use at least 8 characters.");
      if (pw !== pw2) return setErr("The passwords don't match.");
      setBusy(true);
      const r = await store.updateAccount(app.id, { password: pw });
      setBusy(false);
      if (r && r.error) return setErr(r.error);
      setDone(true);
    };
    return (
      <Modal title="Set a new password" sub={`For ${titleCase(app.name)} (${app.email}). They will be signed out of other devices.`} onClose={onClose}>
        {done ? <><div className="fd-msg ok">Password updated. Share it with {titleCase(app.name).split(" ")[0]} through a private channel.</div><div className="fd-actions" style={{ marginTop: 16 }}><button className="fd-btn primary" onClick={onClose}>Done</button></div></> : (
          <>
            <div className="fd-form">
              <Field label="New password" hint="At least 8 characters."><input className="fd-input" type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} /></Field>
              <Field label="Repeat password"><input className="fd-input" type={show ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} /></Field>
              <label className="fd-switch" style={{ gap: 8 }}><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} style={{ accentColor: "#C9A961" }} />Show passwords</label>
              {err && <div className="fd-msg err">{err}</div>}
            </div>
            <div className="fd-actions" style={{ marginTop: 20 }}><button className="fd-btn primary" disabled={busy} onClick={go}>{busy ? "Saving…" : "Save password"}</button><button className="fd-btn ghost" onClick={onClose}>Cancel</button></div>
          </>
        )}
      </Modal>
    );
  }

  function ScholarsView({ store, scholars, openRecord }) {
    const [pw, setPw] = useState(null);
    const [filter, setFilter] = useState("all");
    const by = s => scholars.filter(a => (a.scholarStatus || "active") === s).length;
    const shown = scholars.filter(a => filter === "all" || (a.scholarStatus || "active") === filter);
    const totalPaid = scholars.reduce((a, s) => a + (s.semesters || []).filter(x => x.paidAt).reduce((b, x) => b + (Number(x.bill?.amount) || 0), 0), 0);
    return (
      <>
        <Head title="Scholars" lede="Everyone who holds a scholarship, with their progress at a glance." />
        <Stats items={[{ label: "Active scholars", value: by("active"), tone: "ok" }, { label: "Paused", value: by("suspended"), tone: by("suspended") ? "warn" : "" }, { label: "Graduated", value: by("graduated") }, { label: "Paid to date", value: money(totalPaid) }]} />
        <div className="fd-toolbar"><Seg value={filter} onChange={setFilter} items={[["all", "All", scholars.length], ["active", "Active", by("active")], ["suspended", "Paused", by("suspended")], ["graduated", "Graduated", by("graduated")], ["revoked", "Ended", by("revoked")]]} /></div>
        <div className="fd-grid2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" }}>
          {shown.length === 0 ? <div className="fd-card"><Empty title="No scholars here." /></div> : shown.map(sc => {
            const sems = sc.semesters || [];
            const paidN = sems.filter(x => x.paidAt).length;
            const due = sems.filter(x => x.status === "bill-uploaded").length;
            const recv = sems.filter(x => x.paidAt).reduce((a, x) => a + (Number(x.bill?.amount) || 0), 0);
            const ipk = store.cumulativeIPK(sc);
            const st = SCH[sc.scholarStatus || "active"] || SCH.active;
            return (
              <div key={sc.id} className="fd-card" style={{ margin: 0 }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <Avatar app={sc} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}><b style={{ fontWeight: 600, fontSize: 15 }}>{titleCase(sc.name)}</b><Tag tone={st[0]} dot>{st[1]}</Tag></div>
                    <small className="fd-sub" style={{ display: "block", margin: "2px 0 0" }}>{sc.scholarId} · {String(sc.cohort || "").replace(/^Class of\s*/i, "Class of ")}</small>
                    <small className="fd-sub" style={{ display: "block", margin: 0 }}>{instCase(sc.profile?.university?.name)}</small>
                  </div>
                </div>
                <dl className="fd-dl" style={{ gridTemplateColumns: "repeat(3,1fr)", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                  <div><dt>Received</dt><dd>{money(recv)}</dd></div>
                  <div><dt>Semesters paid</dt><dd>{paidN} / {sems.length}</dd></div>
                  <div><dt>GPA</dt><dd style={{ color: ipk && ipk.value < 2.75 ? "var(--rose)" : undefined }}>{ipk ? ipk.value.toFixed(2) : "—"}</dd></div>
                </dl>
                {due > 0 && <div className="fd-msg info" style={{ marginTop: 12 }}>{due} {plural(due, "bill", "bills")} waiting for payment</div>}
                <div className="fd-actions" style={{ marginTop: 14 }}><button className="fd-btn ghost sm" onClick={() => openRecord(sc.id)}>Open record</button><button className="fd-btn quiet sm" onClick={() => setPw(sc)}>Set new password</button></div>
              </div>
            );
          })}
        </div>
        {pw && <PasswordDialog app={pw} store={store} onClose={() => setPw(null)} />}
      </>
    );
  }

  function QR({ value }) {
    const qr = useMemo(() => {
      try {
        const lib = window.qrcode || window._qrLib;
        if (!lib || !value || !value.trim()) return null;
        const q = lib(0, "M"); q.addData(value.trim()); q.make();
        const n = q.getModuleCount(); let d = "";
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
        return { d, n };
      } catch (e) { return null; }
    }, [value]);
    if (!qr) return null;
    return <span className="fd-qr"><svg width="96" height="96" viewBox={`0 0 ${qr.n} ${qr.n}`} shapeRendering="crispEdges"><path d={qr.d} fill="#0A1628" /></svg></span>;
  }
  function ChannelsDialog({ store, onClose }) {
    const [cfg, setCfg] = useState(() => store.getPaymentConfig());
    const set = (g, k, v) => setCfg(p => ({ ...p, [g]: { ...p[g], [k]: v } }));
    const on = g => cfg[g].enabled !== false;
    const head = (g, title) => <div className="fd-card-head" style={{ marginBottom: 10 }}><h3 className="fd-h2">{title}</h3><Switch on={on(g)} onChange={v => set(g, "enabled", v)}>{on(g) ? "Shown" : "Hidden"}</Switch></div>;
    const cardBad = cfg.card.link && !/^https?:\/\//i.test(cfg.card.link.trim());
    return (
      <Modal wide title="Payment channels" sub="How donors can give on the public donate page." onClose={onClose}>
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("usdt", "USDT (on-chain)")}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div className="fd-form" style={{ flex: "1 1 300px" }}>
              <Field label="Wallet address"><input className="fd-input fd-mono" value={cfg.usdt.address} onChange={e => set("usdt", "address", e.target.value)} spellCheck={false} /></Field>
              <div className="fd-grid3"><Field label="Network"><input className="fd-input" value={cfg.usdt.network} onChange={e => set("usdt", "network", e.target.value)} /></Field><Field label="Asset"><input className="fd-input" value={cfg.usdt.asset} onChange={e => set("usdt", "asset", e.target.value)} /></Field><Field label="Confirmations"><input className="fd-input" type="number" min="1" value={cfg.usdt.confirmations} onChange={e => set("usdt", "confirmations", e.target.value)} /></Field></div>
            </div>
            <QR value={cfg.usdt.address} />
          </div>
        </div>
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("bank", "Bank transfer")}
          <div className="fd-grid2"><Field label="Bank"><input className="fd-input" value={cfg.bank.bank} onChange={e => set("bank", "bank", e.target.value)} /></Field><Field label="Account number"><input className="fd-input" value={cfg.bank.account} onChange={e => set("bank", "account", e.target.value)} /></Field><Field label="Account holder"><input className="fd-input" value={cfg.bank.holder} onChange={e => set("bank", "holder", e.target.value)} /></Field><Field label="Currency label"><input className="fd-input" value={cfg.bank.currency} onChange={e => set("bank", "currency", e.target.value)} /></Field></div>
        </div>
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("card", "Card (Mastercard / Visa)")}
          <Field label="Checkout page" hint="The card button on the donate page opens this address in a new tab."><input className="fd-input" value={cfg.card.link} onChange={e => set("card", "link", e.target.value)} placeholder="https://lynk.id/brial/s/…" /></Field>
          {cardBad && <div className="fd-msg err" style={{ marginTop: 8 }}>Use a full address that starts with https://</div>}
        </div>
        <div className="fd-actions" style={{ marginTop: 18 }}><button className="fd-btn primary" disabled={cardBad} onClick={() => { store.savePaymentConfig(cfg); onClose(); }}>Save channels</button><button className="fd-btn ghost" onClick={onClose}>Cancel</button></div>
      </Modal>
    );
  }
  // ---------------- receipts ----------------
  const okEmail = s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || "").trim());
  function useReceipts(store, dep) {
    const [map, setMap] = useState({});
    const alive = useRef(true);
    const load = useCallback(() => { if (!store.mailReceipts) return; store.mailReceipts().then(m => { if (alive.current) setMap(m || {}); }).catch(() => {}); }, [store]);
    useEffect(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load, dep]);
    return [map, load];
  }
  function receiptLine(d, r) {
    if (!r) return { text: "Receipt number is being issued…", tone: "" };
    const m = r.mail;
    const base = "Receipt " + r.no;
    if (!m) return okEmail(d.email) ? { text: base + " · not emailed", tone: "" } : { text: base + " · no email on file", tone: "" };
    if (m.status === "sent") return { text: `${base} · emailed ${fdate(m.sentAt)}`, tone: "ok" };
    if (m.status === "pending" || m.status === "sending") return { text: base + " · waiting to send", tone: "warn" };
    if (m.status === "skipped") return { text: `${base} · not sent (${m.error || "skipped"})`, tone: "" };
    return { text: `${base} · could not be sent`, tone: "bad" };
  }
  function ReceiptDialog({ store, d, r, onClose, onSent }) {
    const [to, setTo] = useState(d.email || "");
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState("");
    const [m, flash] = useFlash();
    const send = async () => {
      setBusy("send");
      try { const res = await store.sendReceipt(d.id, to.trim(), note.trim()); flash(`Receipt ${res.no} is on its way to ${res.to}.`); onSent && onSent(); }
      catch (e) { const c = String(e && (e.message || e)); flash(c.indexOf("invalid_email") >= 0 ? "That email address doesn't look right." : "Could not send right now. Try again in a moment.", "err"); }
      setBusy("");
    };
    const pdf = async () => {
      setBusy("pdf");
      try { await store.downloadReceiptPdf(d.id); } catch (e) { flash("Could not create the PDF right now.", "err"); }
      setBusy("");
    };
    const line = receiptLine(d, r);
    return (
      <Modal title={r ? `Receipt ${r.no}` : "Receipt"} sub={`${d.anonymous ? "Anonymous" : titleCase(d.name)} · ${money(d.amount)} · verified ${fdate(d.verifiedAt)}`} onClose={onClose}>
        <p className={"fd-rc " + line.tone} style={{ textAlign: "left", marginTop: 0 }}>{line.text}{r && r.mail && r.mail.status === "failed" && r.mail.error ? ` — ${r.mail.error}` : ""}</p>
        <Field label="Send the receipt to" hint="Usually the donor's own address."><input className="fd-input" type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="donor@example.com" /></Field>
        <Field label="Personal note (optional)" hint="Shown above the receipt, signed with your name. Leave empty for the standard receipt." style={{ marginTop: 12 }}><textarea className="fd-input" rows={4} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Dear …, thank you for…" /></Field>
        <div className="fd-actions" style={{ marginTop: 16 }}>
          <button className="fd-btn primary" disabled={!okEmail(to) || !!busy} onClick={send}>{busy === "send" ? "Sending…" : "Send receipt"}</button>
          <button className="fd-btn ghost" disabled={!!busy} onClick={pdf}>{ICON.pdf}{busy === "pdf" ? "Preparing…" : "Download PDF"}</button>
        </div>
        <div style={{ marginTop: 12 }}><Flash m={m} /></div>
      </Modal>
    );
  }

  function DonationsView({ store, donations, title }) {
    const [filter, setFilter] = useState("pending");
    const [q, setQ] = useState("");
    const [chan, setChan] = useState(false);
    const [open, setOpen] = useState(null);
    const [vm, vflash] = useFlash();
    const list = (donations || []).filter(d => !(store.isInternalDonation && store.isInternalDonation(d))).slice().sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    const isSale = d => !!(d.data && d.data.sale) || String(d.id || "").indexOf("SALE-") === 0;
    const verified = list.filter(d => d.verified), pending = list.filter(d => !d.verified);
    const sum = l => l.reduce((a, d) => a + (Number(d.amount) || 0), 0);
    const shown = list.filter(d => (filter === "pending" ? !d.verified : filter === "verified" ? d.verified : filter === "anonymous" ? d.anonymous : true))
      .filter(d => { const s = q.trim().toLowerCase(); return !s || [d.name, d.email, d.country, d.txHash, d.id].some(x => (x || "").toLowerCase().includes(s)); });
    const cfg = store.getPaymentConfig();
    const [rc, reloadRc] = useReceipts(store, verified.length);
    const verify = d => {
      const p = store.markDonationVerified(d.id);
      vflash(okEmail(d.email) ? `Verified. The receipt is being emailed to ${d.email}.` : "Verified. There is no email on file — download the receipt PDF if the donor asks for one.");
      Promise.resolve(p).then(() => { setTimeout(reloadRc, 1500); setTimeout(reloadRc, 8000); }).catch(() => vflash("Could not verify — check your connection.", "err"));
    };
    const G = "minmax(0,1.8fr) minmax(0,.7fr) minmax(0,1.3fr) minmax(0,.8fr) auto";
    return (
      <>
        <Head title={title || "Donations"} lede="Gifts reported through the donate page. Check each one against your wallet or bank, then verify it — only verified gifts are final.">
          <button className="fd-btn ghost" onClick={() => setChan(true)}>Payment channels</button>
        </Head>
        <Stats items={[{ label: "Verified gifts", value: money(sum(verified)), sub: `${verified.length} ${plural(verified.length, "gift", "gifts")}`, tone: "ok" }, { label: "Waiting for verification", value: money(sum(pending)), sub: `${pending.length} reported`, tone: pending.length ? "warn" : "" }, { label: "Channels on the donate page", value: ["usdt", "bank", "card"].filter(g => cfg[g].enabled !== false).length, sub: [cfg.usdt.enabled !== false && "USDT", cfg.bank.enabled !== false && cfg.bank.bank, cfg.card.enabled !== false && "Card"].filter(Boolean).join(", ") }]} />
        <div className="fd-toolbar"><Seg value={filter} onChange={setFilter} items={[["pending", "To verify", pending.length], ["verified", "Verified", verified.length], ["anonymous", "Anonymous", list.filter(d => d.anonymous).length], ["all", "All", list.length]]} /></div>
        <div className="fd-toolbar"><Search value={q} onChange={setQ} placeholder="Search donor, email, country or reference" /></div>
        {vm && <div style={{ marginBottom: 12 }}><Flash m={vm} /></div>}
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Donor</div><div>Amount</div><div>Reference</div><div>Date</div><div /></div>
          {shown.length === 0 ? <Empty title={filter === "pending" ? "Nothing to verify." : "No donations match."} /> : shown.map(d => {
            const eth = /^0x[0-9a-f]{10,}$/i.test(d.txHash || "");
            return (
              <div key={d.id} className="fd-tr" style={{ gridTemplateColumns: G }}>
                <div className="fd-td full"><b>{d.anonymous ? "Anonymous" : d.name}{d.anonymous && d.name && d.name !== "Anonymous patron" ? <span className="fd-sub" style={{ fontWeight: 400 }}> ({d.name})</span> : null}</b><small>{[d.email, d.country].filter(Boolean).join(" · ")}</small>{d.message && <small style={{ fontStyle: "italic" }}>“{d.message}”</small>}{isSale(d) && <Tag tone="sky">Library sale</Tag>}</div>
                <div className="fd-td" data-l="Amount"><span className="num">{money(d.amount)}</span></div>
                <div className="fd-td" data-l="Reference">{d.txHash ? <>{eth ? <a className="fd-mono" href={`https://etherscan.io/tx/${d.txHash}`} target="_blank" rel="noopener noreferrer">{d.txHash.slice(0, 10)}…{d.txHash.slice(-6)}</a> : <span className="fd-mono">{d.txHash}</span>}<button className="fd-btn quiet sm" onClick={() => copy(d.txHash)}>Copy</button></> : <small>—</small>}</div>
                <div className="fd-td" data-l="Date">{fdate(d.submittedAt)}</div>
                <div className="fd-td full">
                  <div className="fd-actions" style={{ justifyContent: "flex-end" }}>
                    {d.verified
                      ? <><Tag tone="ok" dot>Verified</Tag>{!isSale(d) && <button className="fd-btn quiet sm" onClick={() => setOpen(d.id)}>Receipt</button>}</>
                      : <Confirm className="fd-btn ok sm" armedLabel={okEmail(d.email) ? "Confirm · email receipt" : "Confirm verify"} onConfirm={() => verify(d)}>Verify</Confirm>}
                    <Confirm onConfirm={() => store.deleteDonation(d.id)}>Delete</Confirm>
                  </div>
                  {d.verified && !isSale(d) && (() => { const l = receiptLine(d, rc[d.id]); return <small className={"fd-rc " + l.tone}>{l.text}</small>; })()}
                </div>
              </div>
            );
          })}
        </div>
        <p className="fd-sub" style={{ marginTop: 12 }}>Grants to partners are listed under each pillar, not here. Verifying a gift issues its receipt number and emails the receipt to the donor.</p>
        {chan && <ChannelsDialog store={store} onClose={() => setChan(false)} />}
        {open && (() => { const d = list.find(x => x.id === open); return d ? <ReceiptDialog store={store} d={d} r={rc[d.id]} onClose={() => setOpen(null)} onSent={() => { setTimeout(reloadRc, 1500); setTimeout(reloadRc, 8000); }} /> : null; })()}
      </>
    );
  }

  function HelpDeskView({ store, reports }) {
    const [filter, setFilter] = useState("open");
    const [reply, setReply] = useState(null);
    const [text, setText] = useState("");
    const c = s => reports.filter(r => r.status === s).length;
    const shown = reports.filter(r => filter === "all" || r.status === filter).slice().sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    const cat = { technical: "Technical", data: "Details", payment: "Payment", other: "Other" };
    const who = r => store.getApplicant(r.applicantId) || {};
    return (
      <>
        <Head title="Help desk" lede="Messages from applicants and scholars. Your reply appears in their portal straight away." />
        <div className="fd-toolbar"><Seg value={filter} onChange={setFilter} items={[["open", "Open", c("open")], ["replied", "Replied", c("replied")], ["resolved", "Resolved", c("resolved")], ["all", "All", reports.length]]} /></div>
        {shown.length === 0 ? <div className="fd-card"><Empty title={filter === "open" ? "No open messages." : "Nothing here."} /></div> : shown.map(r => (
          <div key={r.id} className="fd-card">
            <div className="fd-card-head" style={{ alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}><h2 className="fd-h2" style={{ fontSize: 16 }}>{r.subject}</h2><p className="fd-sub">{[titleCase(r.applicantName || who(r).name), r.applicantEmail || who(r).email, r.applicantId, fdate(r.submittedAt)].filter(Boolean).join(" · ")}</p></div>
              <div className="fd-actions">{r.category && <Tag>{cat[r.category] || r.category}</Tag>}<Tag tone={r.status === "resolved" ? "ok" : r.status === "replied" ? "sky" : "warn"} dot>{r.status === "resolved" ? "Resolved" : r.status === "replied" ? "Replied" : "Open"}</Tag></div>
            </div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--muted)" }}>{r.message}</p>
            {r.reply && reply !== r.id && <div style={{ marginTop: 14, padding: "12px 16px", borderLeft: "2px solid var(--gilt)", background: "rgba(201,169,97,.06)", borderRadius: "0 10px 10px 0" }}><small style={{ color: "var(--gilt2)", fontWeight: 600 }}>Your reply · {fdate(r.reply.at)}</small><p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{r.reply.text}</p></div>}
            {reply === r.id ? (
              <div className="fd-form" style={{ marginTop: 14 }}>
                <Field label={`Reply to ${titleCase(r.applicantName || who(r).name || "").split(" ")[0] || "the sender"}`}><textarea className="fd-input" autoFocus value={text} onChange={e => setText(e.target.value)} /></Field>
                <div className="fd-actions"><button className="fd-btn primary" disabled={!text.trim()} onClick={() => { store.replyReport(r.id, text.trim()); setReply(null); setText(""); }}>Send reply</button><button className="fd-btn ghost" onClick={() => setReply(null)}>Cancel</button></div>
              </div>
            ) : (
              <div className="fd-actions" style={{ marginTop: 14 }}>
                {r.status !== "resolved" && <button className="fd-btn primary sm" onClick={() => { setReply(r.id); setText(r.reply?.text || ""); }}>{r.reply ? "Edit reply" : "Reply"}</button>}
                {r.status !== "resolved" && <button className="fd-btn ok sm" onClick={() => store.resolveReport(r.id)}>Mark resolved</button>}
                <Confirm onConfirm={() => store.deleteReport(r.id)}>Delete</Confirm>
              </div>
            )}
          </div>
        ))}
      </>
    );
  }

  // CSV / backup helpers
  function download(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  const csv = v => { if (v == null) return ""; const s = String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const stamp = (p, ext) => { const d = new Date(), z = n => String(n).padStart(2, "0"); return `${p}_${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}.${ext}`; };
  function accountsCSV(apps) {
    const H = ["ID", "Name", "Email", "Status", "Scholar ID", "Cohort", "Scholar status", "Signed up", "Submitted", "Interview", "Interview done", "Accepted", "Declined", "Country", "Phone", "Date of birth", "National ID", "High school", "Graduation year", "Final grade", "Level", "University", "Programme", "Current semester", "Current GPA", "Tuition per semester (USD)", "Essay (excerpt)", "Notes"];
    const rows = apps.map(a => { const p = a.profile || {}, per = p.personal || {}, hs = p.highSchool || {}, u = p.university || {}; return [a.id, a.name, a.email, a.status, a.scholarId || "", a.cohort || "", a.scholarStatus || "", a.signedUpAt || "", a.submittedAt || "", a.interviewAt || "", a.interviewDoneAt || "", a.acceptedAt || "", a.rejectedAt || "", per.country, per.phone, per.dateOfBirth, per.nationalId, hs.schoolName, hs.graduationYear, hs.finalGPA, u.degreeLevel, u.name, u.program, u.currentSemester, u.currentGPA, u.uktPerSemester, (p.essay || "").slice(0, 280), a.notes || ""].map(csv).join(","); });
    return H.map(csv).join(",") + "\n" + rows.join("\n") + "\n";
  }
  function BackupCard({ store, apps }) {
    const [mode, setMode] = useState("merge");
    const [res, setRes] = useState(null);
    const [busy, setBusy] = useState(false);
    const [armed, setArmed] = useState(false);
    const ref = useRef(null);
    const onFile = async e => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      setBusy(true); setRes(null);
      try { const data = JSON.parse(await f.text()); const r = await store.importSnapshot(data, { mergeMode: mode }); setRes(r); }
      catch (err) { setRes({ ok: false, error: "This file is not a valid backup: " + (err.message || err) }); }
      finally { setBusy(false); setArmed(false); }
    };
    return (
      <div className="fd-card">
        <div className="fd-card-head"><div><h2 className="fd-h2">Backup and restore</h2><p className="fd-sub">Download a copy every week. The spreadsheet opens in Excel; the backup file can restore everything.</p></div></div>
        <div className="fd-actions">
          <button className="fd-btn ghost" onClick={() => download(stamp("brial_accounts", "csv"), "﻿" + accountsCSV(apps), "text/csv;charset=utf-8")}>Download spreadsheet (CSV)</button>
          <button className="fd-btn ghost" onClick={() => download(stamp("brial_backup", "json"), JSON.stringify(store.exportSnapshot(), null, 2), "application/json")}>Download backup (JSON)</button>
        </div>
        <details className="fd-details" style={{ background: "rgba(10,22,40,.35)" }}>
          <summary>Restore from a backup file</summary>
          <div className="fd-form">
            <Seg value={mode} onChange={v => { setMode(v); setArmed(false); }} items={[["merge", "Merge (safe)"], ["replace", "Replace everything"]]} />
            <p className="fd-sub" style={{ margin: 0 }}>{mode === "merge" ? "Accounts in the file overwrite accounts with the same ID; new ones are added; everything else stays." : "Every applicant and donation is deleted and replaced by the file. Use only to rebuild after a fresh install."}</p>
            <input ref={ref} type="file" accept=".json,application/json" onChange={onFile} style={{ display: "none" }} />
            <div className="fd-actions">
              {mode === "replace" && !armed ? <button className="fd-btn danger" onClick={() => setArmed(true)}>I understand — choose file</button> : <button className="fd-btn primary" disabled={busy} onClick={() => ref.current && ref.current.click()}>{busy ? "Restoring…" : "Choose backup file"}</button>}
            </div>
            {res && <div className={"fd-msg " + (res.ok ? "ok" : "err")}>{res.ok ? (res.mode === "replace" ? `Restored — ${res.count} accounts loaded.` : `Merged — ${res.updated} accounts updated or added.`) : res.error}</div>}
          </div>
        </details>
      </div>
    );
  }
  function AccountsView({ store, apps, deleted, openRecord }) {
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    const [pw, setPw] = useState(null);
    const [del, setDel] = useState(null);
    const days = d => Math.max(0, Math.ceil((30 * 86400000 - (Date.now() - new Date(d).getTime())) / 86400000));
    const c = s => apps.filter(a => a.status === s).length;
    const shown = apps.filter(a => filter === "all" || a.status === filter).filter(a => { const s = q.trim().toLowerCase(); return !s || [a.name, a.email, a.id, a.profile?.university?.name].some(x => (x || "").toLowerCase().includes(s)); });
    const G = "minmax(0,1.5fr) minmax(0,1.5fr) minmax(0,.9fr) auto";
    return (
      <>
        <Head title="Accounts" lede="Every portal account. Passwords are stored as secure hashes — nobody can read them, but you can set a new one." />
        <div className="fd-toolbar"><Seg value={filter} onChange={setFilter} items={[["all", "All", apps.length], ["registered", "Drafts", c("registered")], ["submitted", "To review", c("submitted")], ["interview-scheduled", "Interview", c("interview-scheduled")], ["interview-done", "Decision due", c("interview-done")], ["accepted", "Granted", c("accepted")], ["rejected", "Declined", c("rejected")]]} /></div>
        <div className="fd-toolbar"><Search value={q} onChange={setQ} placeholder="Search name, email, ID or university" /></div>
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Name</div><div>Email</div><div>Status</div><div /></div>
          {shown.length === 0 ? <Empty title="No accounts match." /> : shown.map(a => (
            <div key={a.id} className="fd-tr" style={{ gridTemplateColumns: G }}>
              <div className="fd-td full"><b>{titleCase(a.name)}</b><small>{a.id}{a.scholarId ? " · " + a.scholarId : ""}</small></div>
              <div className="fd-td full" data-l="Email"><span style={{ overflowWrap: "anywhere" }}>{a.email}</span> <button className="fd-btn quiet sm" onClick={() => copy(a.email)}>Copy</button></div>
              <div className="fd-td" data-l="Status"><StageTag s={a.status} /></div>
              <div className="fd-td"><div className="fd-actions" style={{ justifyContent: "flex-end" }}>
                <button className="fd-btn ghost sm" onClick={() => openRecord(a.id)}>Open</button>
                <button className="fd-btn quiet sm" onClick={() => setPw(a)}>New password</button>
                <button className="fd-btn danger sm" onClick={() => setDel(a)}>Delete</button>
              </div></div>
            </div>
          ))}
        </div>
        <details className="fd-details">
          <summary>Trash ({(deleted || []).length})</summary>
          <div>
            <p className="fd-sub" style={{ marginTop: 0 }}>Deleted accounts are kept for 30 days, then removed for good.</p>
            {(deleted || []).length === 0 ? <p className="fd-sub">The trash is empty.</p> : deleted.map(a => (
              <div key={a.id} className="fd-file" style={{ flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}><b style={{ fontWeight: 600 }}>{titleCase(a.name)}</b><div className="fd-sub" style={{ margin: 0 }}>{a.email} · deleted {fdate(a.deletedAt)} · {days(a.deletedAt)} days left</div></div>
                <div className="fd-actions"><button className="fd-btn ghost sm" onClick={() => store.restoreApplicant(a.id)}>Restore</button><Confirm onConfirm={() => store.purgeApplicant(a.id)} armedLabel="Click again — this is permanent">Delete forever</Confirm></div>
              </div>
            ))}
          </div>
        </details>
        <div style={{ marginTop: 16 }}><BackupCard store={store} apps={apps} /></div>
        {pw && <PasswordDialog app={pw} store={store} onClose={() => setPw(null)} />}
        {del && (
          <Modal title={`Move ${titleCase(del.name)} to the trash?`} sub={`${del.email} (${del.id}) disappears from every list. You can restore it within 30 days.`} onClose={() => setDel(null)}>
            <div className="fd-actions"><button className="fd-btn danger" onClick={() => { store.softDeleteApplicant(del.id); setDel(null); }}>Move to trash</button><button className="fd-btn ghost" onClick={() => setDel(null)}>Cancel</button></div>
          </Modal>
        )}
      </>
    );
  }

  // ============================================================
  // TREASURY — every movement of money, in one place
  // ============================================================
  const C_IN = "#199e70", C_OUT = "#c98500"; // validated pair on the dark surface (dataviz validator: CVD ΔE 8.4, normal 19.8)
  const kmoney = n => { const v = Number(n) || 0; return v >= 10000 ? "$" + Math.round(v / 1000) + "k" : v >= 1000 ? "$" + (v / 1000).toFixed(1).replace(/\.0$/, "") + "k" : "$" + Math.round(v); };
  const monthKey = iso => { const d = new Date(iso); return isNaN(d) ? null : d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  const isSaleD = d => !!(d.data && d.data.sale) || String(d.id || "").indexOf("SALE-") === 0;

  // One list of movements, built from the same records as the public totals
  function useFlows(store) {
    const donations = (store.listDonations() || []).filter(d => !(store.isInternalDonation && store.isInternalDonation(d)));
    const income = donations.map(d => ({
      id: d.id, dir: "in", date: d.submittedAt || (d.data && d.data.sale && d.data.sale.date) || null,
      category: isSaleD(d) ? "Library sale" : "Gift",
      title: isSaleD(d) ? (d.data && d.data.sale ? d.data.sale.title : d.name) : (d.anonymous ? "Anonymous" : d.name || "Donor"),
      detail: isSaleD(d) ? ((d.data && d.data.sale && d.data.sale.qty > 1 ? d.data.sale.qty + " copies" : "1 copy") + (d.message ? " · " + d.message : "")) : [d.country, d.message ? "“" + d.message + "”" : ""].filter(Boolean).join(" · "),
      amount: Number(d.amount) || 0, ref: d.txHash || "", settled: !!d.verified, raw: d,
    }));
    const scholars = store.listApplicants().filter(a => a.status === "accepted");
    const tuition = [], due = [];
    scholars.forEach(sc => (sc.semesters || []).forEach(sem => {
      if (!sem.bill) return;
      const row = { scholar: sc, semester: sem };
      if (sem.paidAt) tuition.push({ id: sc.id + ":" + sem.id, dir: "out", date: sem.paidAt, category: "Tuition", pillar: "Scholarships", title: titleCase(sc.name), detail: [sem.label, instCase(sc.profile?.university?.name)].filter(Boolean).join(" · "), amount: Number(sem.bill.amount) || 0, ref: sem.txHash || "", settled: true, row });
      else if (sem.status === "bill-uploaded") due.push(row);
    }));
    const allGrants = store.getPillarGrants();
    const grants = allGrants.map(g => ({ id: g.id, dir: "out", date: g.date, category: "Grant", pillar: g.pillar, title: g.project || "Grant", detail: [g.partner, g.country].filter(Boolean).join(" · "), amount: Number(g.amount) || 0, ref: g.txRef || "", settled: !g.archived, archived: !!g.archived }));
    const legacy = store.getLegacy();
    const legacyRow = Number(legacy.totalFunds) > 0 ? [{ id: "LEGACY", dir: "out", date: null, category: "Founding era", pillar: "Scholarships", title: "Support before the website", detail: `${legacy.count || (legacy.scholars || []).length || 0} scholars, recorded as one total`, amount: Number(legacy.totalFunds) || 0, ref: "", settled: true }] : [];
    const outflow = [...tuition, ...grants, ...legacyRow];
    const sum = l => l.reduce((a, x) => a + (Number(x.amount) || 0), 0);
    const received = income.filter(x => x.settled), pendingIn = income.filter(x => !x.settled);
    const paidOut = outflow.filter(x => x.settled);
    const dueSum = due.reduce((a, r) => a + (Number(r.semester.bill?.amount) || 0), 0);
    return { income, received, pendingIn, outflow, paidOut, due, dueSum, sum, legacy, scholars };
  }

  function InOutChart({ inRows, outRows }) {
    const [hover, setHover] = useState(null);
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"), label: d.toLocaleDateString("en-GB", { month: "short" }), long: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }), inn: 0, out: 0 }); }
    const at = {}; months.forEach(m => { at[m.key] = m; });
    inRows.forEach(x => { const k = monthKey(x.date); if (k && at[k]) at[k].inn += x.amount; });
    outRows.forEach(x => { const k = monthKey(x.date); if (k && at[k]) at[k].out += x.amount; });
    const peak = Math.max(0, ...months.map(m => Math.max(m.inn, m.out)));
    const nice = v => { if (v <= 0) return 100; const p = Math.pow(10, Math.floor(Math.log10(v))); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
    const top = nice(peak);
    const h = v => (v > 0 ? Math.max(2, (v / top) * 100) : 0) + "%";
    const totalIn = months.reduce((a, m) => a + m.inn, 0), totalOut = months.reduce((a, m) => a + m.out, 0);
    return (
      <div className="fd-ch">
        <div className="fd-ch-legend" aria-hidden="true"><span><i style={{ background: C_IN }} />Money in <b>{money(totalIn)}</b></span><span><i style={{ background: C_OUT }} />Money out <b>{money(totalOut)}</b></span></div>
        <div className="fd-ch-plot" role="img" aria-label={`Money in and out by month, last 12 months. In ${money(totalIn)}, out ${money(totalOut)}.`}>
          {[1, 0.5, 0].map(f => <div key={f} className="fd-ch-grid" style={{ bottom: f * 100 + "%" }}><span>{kmoney(top * f)}</span></div>)}
          <div className="fd-ch-cols">
            {months.map(m => (
              <div key={m.key} className={"fd-ch-col" + (hover === m.key ? " on" : "")} tabIndex={0} onMouseEnter={() => setHover(m.key)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(m.key)} onBlur={() => setHover(null)} aria-label={`${m.long}: in ${money(m.inn)}, out ${money(m.out)}`}>
                <div className="fd-ch-bars"><i style={{ height: h(m.inn), background: C_IN }} /><i style={{ height: h(m.out), background: C_OUT }} /></div>
                <span className="fd-ch-x">{m.label}</span>
                {hover === m.key && <div className="fd-ch-tip"><b>{m.long}</b><div><i style={{ background: C_IN }} />In<span>{money(m.inn)}</span></div><div><i style={{ background: C_OUT }} />Out<span>{money(m.out)}</span></div></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const MoveRow = ({ x, G, showDir }) => (
    <div className="fd-tr fd-mv" style={{ gridTemplateColumns: G }}>
      <div className="fd-td full"><b>{x.title}</b>{x.detail && <small>{x.detail}</small>}</div>
      <div className="fd-td" data-l="Category"><Tag tone={x.dir === "in" ? "ok" : "gold"}>{x.category}</Tag>{x.pillar && x.category !== "Tuition" && x.category !== "Founding era" && <small>{x.pillar}</small>}{x.archived && <small style={{ color: "var(--amber)" }}>Archived · not counted</small>}{x.dir === "in" && !x.settled && <small style={{ color: "var(--amber)" }}>Not verified yet</small>}</div>
      <div className="fd-td" data-l="Date">{x.date ? fdate(x.date) : "Before 2026"}{x.ref && <small className="fd-mono" title={x.ref}>{x.ref.length > 18 ? x.ref.slice(0, 10) + "…" + x.ref.slice(-5) : x.ref}</small>}</div>
      <div className="fd-td fd-amt" data-l="Amount"><span className={"num " + (x.dir === "in" ? "in" : "out")}>{showDir ? (x.dir === "in" ? "+" : "−") : ""}{money(x.amount)}</span></div>
    </div>
  );

  function TreasuryOverview({ store, go }) {
    const F = useFlows(store);
    const pub = store.getPublicMetrics ? store.getPublicMetrics() : null;
    const byPillar = {};
    F.paidOut.forEach(x => { byPillar[x.pillar] = (byPillar[x.pillar] || 0) + x.amount; });
    const pillars = Object.entries(byPillar).sort((a, b) => b[1] - a[1]);
    const maxP = Math.max(1, ...pillars.map(p => p[1]));
    const outTotal = F.sum(F.paidOut);
    const recent = [...F.received, ...F.paidOut].filter(x => x.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
    const G = "minmax(0,1.7fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,.7fr)";
    return (
      <>
        <Head title="Treasury" lede="Everything that comes into the endowment and everything it gives out, in one place." />
        <Stats items={[
          { label: "Received", value: money(F.sum(F.received)), sub: `${F.received.filter(x => x.category === "Gift").length} gifts · ${F.received.filter(x => x.category === "Library sale").length} library sales`, tone: "ok" },
          { label: "Distributed", value: money(outTotal), sub: pub && Math.abs(pub.disbursed - outTotal) < 0.01 ? "Same as the public site" : "Tuition, grants and founding era" },
          { label: "Waiting for verification", value: money(F.sum(F.pendingIn)), sub: `${F.pendingIn.length} ${plural(F.pendingIn.length, "gift", "gifts")}`, tone: F.pendingIn.length ? "warn" : "" },
          { label: "Bills to pay", value: money(F.dueSum), sub: `${F.due.length} ${plural(F.due.length, "bill", "bills")}`, tone: F.due.length ? "warn" : "" },
        ]} />
        {(F.pendingIn.length > 0 || F.due.length > 0) && (
          <div className="fd-attn">
            {F.pendingIn.length > 0 && <div className="fd-attn-i"><span className="fd-dot warn" /><div><b>{F.pendingIn.length} {plural(F.pendingIn.length, "gift needs", "gifts need")} checking</b><small>Match each one with your wallet or bank, then verify it.</small></div><button className="fd-btn ghost sm" onClick={() => go("in")}>Review</button></div>}
            {F.due.length > 0 && <div className="fd-attn-i"><span className="fd-dot warn" /><div><b>{F.due.length} tuition {plural(F.due.length, "bill is", "bills are")} waiting</b><small>{money(F.dueSum)} to pay to universities.</small></div><button className="fd-btn ghost sm" onClick={() => go("out")}>Pay</button></div>}
          </div>
        )}
        <div className="fd-tgrid">
          <div className="fd-card">
            <div className="fd-card-head"><div><h2 className="fd-h2">Last 12 months</h2><p className="fd-sub">Verified money in and money paid out, by month.</p></div><button className="fd-btn quiet sm" onClick={() => go("ledger")}>See the ledger</button></div>
            <InOutChart inRows={F.received} outRows={F.paidOut} />
          </div>
          <div className="fd-card">
            <div className="fd-card-head"><div><h2 className="fd-h2">Where it went</h2><p className="fd-sub">Distributed, by pillar.</p></div></div>
            {pillars.length === 0 ? <p className="fd-sub">Nothing distributed yet.</p> : (
              <div className="fd-bars">{pillars.map(([name, v]) => (
                <div key={name} className="fd-bar"><div className="fd-bar-t"><span>{name}</span><b>{money(v)}</b></div><div className="fd-bar-track"><i style={{ width: Math.max(1.5, v / maxP * 100) + "%", background: C_OUT }} /></div><small>{Math.round(v / (outTotal || 1) * 100)}% of all giving</small></div>
              ))}</div>
            )}
          </div>
        </div>
        <div className="fd-card-head" style={{ margin: "26px 0 12px" }}><h2 className="fd-h2">Recent movements</h2><button className="fd-btn quiet sm" onClick={() => go("ledger")}>View all</button></div>
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Description</div><div>Category</div><div>Date · reference</div><div style={{ textAlign: "right" }}>Amount</div></div>
          {recent.length === 0 ? <Empty title="No movements yet." /> : recent.map(x => <MoveRow key={x.dir + x.id} x={x} G={G} showDir />)}
        </div>
      </>
    );
  }

  function MoneyOutView({ store }) {
    const F = useFlows(store);
    const [tab, setTab] = useState(F.due.length ? "due" : "paid");
    const [pillar, setPillar] = useState("all");
    const [q, setQ] = useState("");
    const [pay, setPay] = useState(null);
    const [legacyOpen, setLegacyOpen] = useState(false);
    const pillarsUsed = [...new Set(F.outflow.map(x => x.pillar))];
    const s = q.trim().toLowerCase();
    const list = F.outflow.filter(x => (tab === "archived" ? x.archived : !x.archived) && (pillar === "all" || x.pillar === pillar) && (!s || [x.title, x.detail, x.ref, x.pillar].some(v => (v || "").toLowerCase().includes(s))))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const G = "minmax(0,1.7fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,.7fr)";
    const GD = "minmax(0,1.6fr) minmax(0,.8fr) minmax(0,.8fr) minmax(0,1fr) auto";
    const archivedN = F.outflow.filter(x => x.archived).length;
    return (
      <>
        <Head title="Money out" lede="Tuition paid to universities, grants to partners, and support given before the website.">
          <button className="fd-btn ghost" onClick={() => setLegacyOpen(true)}>Founding-era support</button>
        </Head>
        <Stats items={[
          { label: "Distributed", value: money(F.sum(F.paidOut)), sub: `${F.paidOut.length} ${plural(F.paidOut.length, "payment", "payments")}` },
          { label: "Tuition", value: money(F.sum(F.paidOut.filter(x => x.category === "Tuition"))), sub: `${F.paidOut.filter(x => x.category === "Tuition").length} semesters` },
          { label: "Grants", value: money(F.sum(F.paidOut.filter(x => x.category === "Grant"))), sub: `${F.paidOut.filter(x => x.category === "Grant").length} grants` },
          { label: "Bills to pay", value: money(F.dueSum), sub: `${F.due.length} ${plural(F.due.length, "bill", "bills")}`, tone: F.due.length ? "warn" : "" },
        ]} />
        <div className="fd-toolbar"><Seg value={tab} onChange={setTab} items={[["due", "To pay", F.due.length], ["paid", "Paid", F.paidOut.length], ...(archivedN ? [["archived", "Archived grants", archivedN]] : [])]} /></div>
        {tab === "due" ? (
          <div className="fd-table">
            <div className="fd-tr fd-th" style={{ gridTemplateColumns: GD }}><div>Scholar</div><div>Semester</div><div>Amount</div><div>Sent</div><div /></div>
            {F.due.length === 0 ? <Empty title="Nothing to pay.">New tuition bills from scholars will appear here.</Empty> : F.due.map(r => (
              <div key={r.scholar.id + r.semester.id} className="fd-tr" style={{ gridTemplateColumns: GD }}>
                <div className="fd-td full"><b>{titleCase(r.scholar.name)}</b><small>{r.scholar.scholarId} · {instCase(r.scholar.profile?.university?.name)}</small></div>
                <div className="fd-td" data-l="Semester">{r.semester.label}</div>
                <div className="fd-td" data-l="Amount"><span className="num">{money(r.semester.bill?.amount)}</span></div>
                <div className="fd-td" data-l="Sent">{fdate(r.semester.bill?.uploadedAt)}</div>
                <div className="fd-td full"><div className="fd-actions" style={{ justifyContent: "flex-end" }}><FileBtn file={r.semester.bill} label="View bill" /><button className="fd-btn primary sm" onClick={() => setPay(r)}>Mark as paid</button></div></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="fd-toolbar">
              <Seg value={pillar} onChange={setPillar} items={[["all", "All pillars"], ...pillarsUsed.map(p => [p, p])]} />
              <Search value={q} onChange={setQ} placeholder="Search scholar, project, partner or reference" />
            </div>
            <div className="fd-table">
              <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Paid to</div><div>Category</div><div>Date · reference</div><div style={{ textAlign: "right" }}>Amount</div></div>
              {list.length === 0 ? <Empty title="Nothing here." /> : list.map(x => <MoveRow key={x.id} x={x} G={G} />)}
              {list.length > 0 && <div className="fd-tr fd-tfoot" style={{ gridTemplateColumns: G }}><div className="fd-td full"><b>{list.length} {plural(list.length, "payment", "payments")}</b></div><div /><div /><div className="fd-td fd-amt"><span className="num">{money(F.sum(list))}</span></div></div>}
            </div>
            <p className="fd-sub" style={{ marginTop: 10 }}>Grants are recorded inside each pillar. Archived grants stay on record but are not counted in the totals.</p>
          </>
        )}
        {pay && <PayDialog row={pay} store={store} onClose={() => setPay(null)} />}
        {legacyOpen && <LegacyDialog store={store} onClose={() => setLegacyOpen(false)} />}
      </>
    );
  }

  function LedgerView({ store }) {
    const F = useFlows(store);
    const [dir, setDir] = useState("all");
    const [year, setYear] = useState("all");
    const [q, setQ] = useState("");
    const settled = [...F.received, ...F.paidOut];
    const years = [...new Set(settled.map(x => (x.date ? new Date(x.date).getFullYear() : null)).filter(Boolean))].sort((a, b) => b - a);
    const s = q.trim().toLowerCase();
    const list = settled.filter(x => (dir === "all" || x.dir === dir) && (year === "all" || (x.date && new Date(x.date).getFullYear() === Number(year)) || (year === "early" && !x.date)) && (!s || [x.title, x.detail, x.ref, x.category, x.pillar].some(v => (v || "").toLowerCase().includes(s))))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const tin = F.sum(list.filter(x => x.dir === "in")), tout = F.sum(list.filter(x => x.dir === "out"));
    const G = "minmax(0,1.7fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,.7fr)";
    const exportCSV = () => {
      const H = ["Date", "Direction", "Category", "Pillar", "Description", "Details", "Amount (USD)", "Reference"];
      const rows = list.map(x => [x.date ? new Date(x.date).toISOString().slice(0, 10) : "before 2026", x.dir === "in" ? "In" : "Out", x.category, x.pillar || "", x.title, x.detail, (x.dir === "in" ? "" : "-") + (Number(x.amount) || 0).toFixed(2), x.ref].map(csv).join(","));
      download(stamp("brial-ledger", "csv"), "﻿" + H.map(csv).join(",") + "\n" + rows.join("\n") + "\n", "text/csv;charset=utf-8");
    };
    return (
      <>
        <Head title="Ledger" lede="Every settled movement — verified gifts and sales in, payments out. Unverified gifts and unpaid bills are left out until they settle.">
          <button className="fd-btn ghost" onClick={exportCSV} disabled={!list.length}>Download CSV</button>
        </Head>
        <div className="fd-toolbar">
          <Seg value={dir} onChange={setDir} items={[["all", "All", settled.length], ["in", "Money in", F.received.length], ["out", "Money out", F.paidOut.length]]} />
          <select className="fd-input" style={{ width: "auto" }} value={year} onChange={e => setYear(e.target.value)} aria-label="Year"><option value="all">All years</option>{years.map(y => <option key={y} value={y}>{y}</option>)}{F.paidOut.some(x => !x.date) && <option value="early">Before 2026</option>}</select>
          <Search value={q} onChange={setQ} placeholder="Search description or reference" />
        </div>
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Description</div><div>Category</div><div>Date · reference</div><div style={{ textAlign: "right" }}>Amount</div></div>
          {list.length === 0 ? <Empty title="No movements match." /> : list.map(x => <MoveRow key={x.dir + x.id} x={x} G={G} showDir />)}
        </div>
        {list.length > 0 && (
          <div className="fd-totals">
            <div><span>Money in</span><b className="in">+{money(tin)}</b></div>
            <div><span>Money out</span><b className="out">−{money(tout)}</b></div>
            <div><span>Difference</span><b>{tin - tout < 0 ? "−" : ""}{money(Math.abs(tin - tout))}</b></div>
          </div>
        )}
      </>
    );
  }

  function ChannelsView({ store }) {
    const [open, setOpen] = useState(false);
    const c = store.getPaymentConfig();
    const rows = [
      ["usdt", "USDT (on-chain)", c.usdt.enabled !== false, [c.usdt.network, c.usdt.asset].filter(Boolean).join(" · "), c.usdt.address],
      ["bank", "Bank transfer", c.bank.enabled !== false, [c.bank.bank, c.bank.currency].filter(Boolean).join(" · "), [c.bank.account, c.bank.holder].filter(Boolean).join(" · ")],
      ["card", "Card (Mastercard / Visa)", c.card.enabled !== false, "Checkout page", c.card.link],
    ];
    return (
      <>
        <Head title="Payment channels" lede="How donors can give on the public donate page."><button className="fd-btn primary" onClick={() => setOpen(true)}>Edit channels</button></Head>
        <div className="fd-chans">
          {rows.map(([k, name, on, sub, val]) => (
            <div key={k} className="fd-card">
              <div className="fd-card-head" style={{ marginBottom: 6 }}><h2 className="fd-h2">{name}</h2><Tag tone={on ? "ok" : ""} dot>{on ? "Shown" : "Hidden"}</Tag></div>
              <p className="fd-sub" style={{ margin: 0 }}>{sub}</p>
              <p className="fd-mono" style={{ margin: "10px 0 0", fontSize: 12.5, overflowWrap: "anywhere", color: "var(--muted)" }}>{val || "Not set"}</p>
            </div>
          ))}
        </div>
        {open && <ChannelsDialog store={store} onClose={() => setOpen(false)} />}
      </>
    );
  }

  // ============================================================
  // FOUNDER HOME — the chooser, in two swipeable groups
  // ============================================================
  const GROUPS = [
    { id: "pillars", label: "Pillars", title: "Which pillar are you managing?", lede: "Each pillar of the endowment has its own console. Choose one to begin.", only: ["scholarships", "worship", "library", "foodland", "water", "hospitals", "schools", "livestock", "infra"] },
    { id: "office", label: "Foundation office", title: "Run the foundation.", lede: "The money, the website and the records — the work that serves every pillar.", only: ["treasury", "site", "backup"] },
  ];
  function FounderHome(props) {
    useStyles();
    const { Chooser } = props;
    const [group, setGroup] = useNav("fd-group", "pillars");
    const track = useRef(null);
    const panels = useRef([]);
    const [height, setHeight] = useState(null);
    const idx = Math.max(0, GROUPS.findIndex(g => g.id === group));
    const idxRef = useRef(idx); idxRef.current = idx;
    const measure = i => { const el = panels.current[i]; if (el) setHeight(el.offsetHeight); };
    useEffect(() => {
      const t = track.current; if (!t) return;
      t.scrollTo({ left: idx * t.clientWidth, behavior: "auto" });
      measure(idx);
      const ro = window.ResizeObserver ? new ResizeObserver(() => measure(idxRef.current)) : null;
      panels.current.forEach(p => p && ro && ro.observe(p));
      return () => ro && ro.disconnect();
    }, []);
    useEffect(() => {
      const t = track.current; if (!t) return;
      if (Math.round(t.scrollLeft / t.clientWidth) !== idx) t.scrollTo({ left: idx * t.clientWidth, behavior: "smooth" });
      measure(idx);
    }, [idx]);
    const onScroll = () => {
      const t = track.current; if (!t) return;
      clearTimeout(onScroll.t);
      onScroll.t = setTimeout(() => { const i = Math.round(t.scrollLeft / t.clientWidth); if (GROUPS[i] && GROUPS[i].id !== group) setGroup(GROUPS[i].id, { replace: true }); }, 90);
    };
    const g = GROUPS[idx];
    const counts = { pillars: GROUPS[0].only.length, office: GROUPS[1].only.length };
    return (
      <div className="fdh">
        <div className="fdh-k">Founder Console</div>
        <div className="fdh-tabs" role="tablist" aria-label="Founder console sections">
          {GROUPS.map((x, i) => <button key={x.id} role="tab" aria-selected={x.id === g.id} className="fdh-tab" onClick={() => setGroup(x.id, { replace: true })}>{x.label}<em>{counts[x.id]}</em></button>)}
          <span className="fdh-ink" style={{ transform: `translateX(${idx * 100}%)` }} aria-hidden="true" />
        </div>
        <h1 className="fdh-h1">{g.title}</h1>
        <p className="fdh-lede">{g.lede}</p>
        <div className="fdh-track" ref={track} onScroll={onScroll} style={height ? { height } : null}>
          {GROUPS.map((x, i) => (
            <div key={x.id} className="fdh-panel" ref={el => { panels.current[i] = el; }} role="tabpanel" aria-label={x.label} aria-hidden={x.id !== g.id}>
              <Chooser {...props} bare only={x.only} />
            </div>
          ))}
        </div>
        <p className="fdh-hint">Swipe left or right to switch between {GROUPS[0].label.toLowerCase()} and the {GROUPS[1].label.toLowerCase()}.</p>
      </div>
    );
  }

  // ============================================================
  // FOUNDER GATE — the sign-in page: a gate of light, two angels
  // welcoming, a palace on the hill, gardens along the way, fireflies.
  // ============================================================
  const GATE_CSS = `
.fg{position:relative;min-height:100vh;min-height:100dvh;overflow:hidden;background:linear-gradient(180deg,#050D1B 0%,#081530 46%,#0C2142 74%,#081631 100%);color:#EFE9DC;font-family:'Manrope',system-ui,sans-serif}
.fg-scene{position:absolute;inset:0;width:100%;height:100%;display:block;animation:fgIn 2.4s cubic-bezier(.2,.7,.2,1) both}
.fg-fire{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
@keyframes fgIn{from{opacity:0;filter:brightness(.4)}to{opacity:1;filter:none}}
.fg-halo{transform-origin:600px 450px;animation:fgBreath 7s ease-in-out infinite}
@keyframes fgBreath{0%,100%{opacity:.85}50%{opacity:1}}
.fg-tw{animation:fgTw 3.2s ease-in-out infinite}
@keyframes fgTw{0%,100%{opacity:.25}50%{opacity:1}}
.fg-exit{position:absolute;top:20px;left:20px;z-index:5;display:inline-flex;align-items:center;gap:8px;background:rgba(6,14,28,.35);border:1px solid rgba(191,216,255,.22);color:rgba(239,233,220,.8);padding:8px 14px;border-radius:999px;font:500 13px 'Manrope',sans-serif;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.fg-exit:hover{color:#fff;border-color:rgba(226,201,142,.6)}
.fg-verse{position:absolute;z-index:3;top:clamp(64px,9vh,96px);left:50%;transform:translateX(-50%);width:min(620px,86vw);text-align:center;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(16px,1.5vw,19px);line-height:1.5;color:rgba(214,228,250,.78);animation:fgUp 2.4s .6s both}
.fg-verse small{display:block;margin-top:6px;font-family:'Manrope',sans-serif;font-style:normal;font-size:12px;letter-spacing:.04em;color:rgba(226,201,142,.75)}
.fg-card{position:absolute;z-index:4;left:50%;bottom:max(2.5vh,16px);transform:translateX(-50%);width:min(320px,calc(100vw - 32px));padding:46px 26px 22px;background:linear-gradient(180deg,rgba(14,32,62,.58),rgba(8,20,42,.78));border:1px solid rgba(191,216,255,.2);border-radius:160px 160px 16px 16px / 110px 110px 16px 16px;backdrop-filter:blur(14px) saturate(130%);-webkit-backdrop-filter:blur(14px) saturate(130%);box-shadow:0 0 0 1px rgba(226,201,142,.08) inset,0 30px 80px -30px rgba(0,0,0,.9),0 0 60px -10px rgba(110,160,240,.25);animation:fgUp 1.6s 1s both}
@keyframes fgUp{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}
.fg-mark{display:flex;justify-content:center;margin-bottom:8px}
.fg-k{text-align:center;font-size:13px;font-weight:500;color:#E2C98E;margin:0}
.fg-h{text-align:center;font-family:'Cormorant Garamond',serif;font-weight:400;font-size:31px;line-height:1.1;margin:2px 0 16px;color:#F4EFE4}
.fg-f{display:block;margin-bottom:11px}
.fg-f label{display:block;font-size:12.5px;color:rgba(214,228,250,.7);margin-bottom:6px}
.fg-in{display:flex;align-items:center;background:rgba(5,13,27,.55);border:1px solid rgba(191,216,255,.2);border-radius:10px;transition:border-color .2s}
.fg-in:focus-within{border-color:#E2C98E}
.fg-in input{flex:1;min-width:0;background:none;border:0;outline:none;color:#F4EFE4;font:15px 'Manrope',sans-serif;padding:10px 12px}
.fg-eye{background:none;border:0;color:rgba(214,228,250,.6);padding:8px 10px;cursor:pointer;display:flex}
.fg-eye:hover{color:#fff}
.fg-err{margin:2px 0 14px;padding:10px 12px;border-radius:10px;background:rgba(229,134,134,.1);border:1px solid rgba(229,134,134,.35);color:#F0A3A3;font-size:13px}
.fg-btn{width:100%;margin-top:6px;padding:12px 0;border:0;border-radius:10px;background:linear-gradient(180deg,#E2C98E,#C9A961);color:#0A1628;font:700 14px 'Manrope',sans-serif;cursor:pointer;box-shadow:0 8px 30px -10px rgba(226,201,142,.6);transition:filter .2s}
.fg-btn:hover{filter:brightness(1.06)}
.fg-btn[disabled]{opacity:.5;cursor:not-allowed;box-shadow:none}
.fg :focus-visible{outline:2px solid #E2C98E;outline-offset:2px}
@media (max-aspect-ratio:9/10){
  .fg-scene{height:auto;bottom:auto}
  .fg-verse{position:relative;top:auto;left:auto;transform:none;margin:0 auto;padding:0 20px 18px;animation:fgFade 2s .6s both}
  .fg-card{position:relative;left:auto;bottom:auto;transform:none;margin:0 auto 36px;animation:fgFade 1.4s .8s both}
  .fg-flow{position:relative;z-index:3;padding-top:var(--fg-top,58vw)}
}
@keyframes fgFade{from{opacity:0}to{opacity:1}}
@media (min-aspect-ratio:9/10) and (max-height:860px){.fg-card{padding-top:32px;bottom:max(1.5vh,10px)}.fg-mark{display:none}.fg-h{font-size:27px;margin-bottom:12px}.fg-in input{padding:8px 12px}.fg-f{margin-bottom:8px}.fg-btn{padding:10px 0}.fg-verse{top:clamp(52px,7vh,80px)}}
@media (prefers-reduced-motion:reduce){.fg-scene,.fg-card,.fg-verse,.fg-halo,.fg-tw{animation:none}}
`;
  function useGateStyles() {
    useEffect(() => {
      if (document.getElementById("fg-css")) return;
      const s = document.createElement("style");
      s.id = "fg-css";
      s.textContent = GATE_CSS;
      document.head.appendChild(s);
    }, []);
  }
  // deterministic scatter so the garden is the same on every visit
  const rng = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // An angel facing right, feet at (0,0). Line light over a translucent body.
  function Angel({ x, y, s, flip, id }) {
    const t = `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
    // feathered wings raised behind the shoulders: secondaries hang, primaries rise
    const feathers = useMemo(() => {
      const f = v => v.toFixed(1);
      const make = (S, W, th0, th1, L0, L1, N, w0, w1) => {
        const out = [];
        for (let k = N - 1; k >= 0; k--) {
          const u = k / (N - 1);
          const bend = Math.sin(u * Math.PI) * 18;
          const R = [S[0] + (W[0] - S[0]) * u - bend * .6, S[1] + (W[1] - S[1]) * u + bend * .2];
          const th = (th0 + (th1 - th0) * Math.pow(u, 1.15)) * Math.PI / 180;
          const L = L0 + (L1 - L0) * Math.pow(u, .7);
          const d = [Math.cos(th), Math.sin(th)], n = [-d[1], d[0]];
          const w = w0 + (w1 - w0) * u;
          const T = [R[0] + d[0] * L, R[1] + d[1] * L];
          const M1 = [R[0] + d[0] * L * .5 + n[0] * w, R[1] + d[1] * L * .5 + n[1] * w];
          const M2 = [R[0] + d[0] * L * .5 - n[0] * w * .5, R[1] + d[1] * L * .5 - n[1] * w * .5];
          out.push({ d: `M${f(R[0])} ${f(R[1])} Q${f(M1[0])} ${f(M1[1])} ${f(T[0])} ${f(T[1])} Q${f(M2[0])} ${f(M2[1])} ${f(R[0])} ${f(R[1])} Z`, o: u });
        }
        return out;
      };
      const S = [-8, -330], W = [-74, -508];
      return {
        far: make([12, -334], [34, -450], 238, 282, 70, 124, 9, 16, 20),
        out: make(S, W, 128, 246, 110, 232, 18, 22, 30),
        cov: make([-12, -336], [-62, -474], 140, 232, 54, 92, 9, 14, 16),
        arm: `M${S[0]} ${S[1] + 4} C${S[0] - 26} ${S[1] - 60} ${W[0] + 6} ${W[1] + 50} ${W[0]} ${W[1]}`,
      };
    }, []);
    const farWing = "M8 -336 C18 -388 40 -440 84 -478 C92 -484 100 -486 106 -482 C96 -462 92 -440 92 -418 C84 -406 78 -392 76 -378 C60 -362 34 -346 8 -336 Z";
    const robe = "M-22 -342 C-36 -300 -46 -214 -58 -128 C-68 -66 -92 -20 -136 0 L74 0 C54 -38 42 -112 36 -198 C32 -260 30 -308 26 -342 C10 -350 -8 -350 -22 -342 Z";
    const veil = "M6 -424 C27 -424 33 -402 26 -385 C22 -375 27 -362 33 -350 C12 -342 -10 -340 -30 -338 C-27 -364 -23 -390 -15 -409 C-10 -418 -2 -424 6 -424 Z";
    const sleeve = "M12 -340 C34 -354 62 -364 92 -368 C99 -369 103 -363 99 -357 C78 -350 50 -339 20 -322 Z";
    const drape = "M32 -334 C42 -306 54 -290 74 -282 C66 -300 62 -320 62 -342 Z";
    const folds = "M-8 -300 C-14 -220 -24 -140 -44 -40 M8 -296 C8 -220 6 -140 0 -24 M22 -284 C26 -200 32 -120 46 -30";
    const base = "#0C2350";
    return (
      <g transform={t}>
        {feathers.far.map((f, i) => <g key={"f" + i}><path d={f.d} fill={base} /><path d={f.d} fill={`url(#${id}-wing)`} stroke="rgba(214,232,255,.4)" strokeWidth=".9" /></g>)}
        <g filter="url(#fg-glow)">
          {feathers.out.map((f, i) => <g key={i}><path d={f.d} fill={base} /><path d={f.d} fill={`url(#${id}-wing)`} stroke={`rgba(222,237,255,${(.5 + .4 * f.o).toFixed(2)})`} strokeWidth="1.05" /></g>)}
          {feathers.cov.map((f, i) => <g key={"c" + i}><path d={f.d} fill={base} /><path d={f.d} fill={`url(#${id}-wing)`} stroke="rgba(222,237,255,.6)" strokeWidth=".9" /></g>)}
          <path d={feathers.arm} fill="none" stroke="rgba(236,244,255,.85)" strokeWidth="1.4" />
        </g>
        <path d={robe} fill={base} />
        <path d={robe} fill={`url(#${id}-robe)`} stroke="rgba(224,238,255,.85)" strokeWidth="1.3" filter="url(#fg-glow)" />
        <path d={folds} fill="none" stroke="rgba(214,232,255,.24)" strokeWidth=".9" />
        <path d={drape} fill={base} stroke="rgba(214,232,255,.5)" strokeWidth="1" />
        <path d={sleeve} fill={base} />
        <path d={sleeve} fill={`url(#${id}-robe)`} stroke="rgba(224,238,255,.8)" strokeWidth="1.2" />
        <ellipse cx="104" cy="-364" rx="7" ry="4.2" transform="rotate(-20 104 -364)" fill={base} stroke="rgba(234,242,255,.8)" strokeWidth="1" />
        <path d={veil} fill={base} />
        <path d={veil} fill={`url(#${id}-robe)`} stroke="rgba(234,242,255,.9)" strokeWidth="1.3" filter="url(#fg-glow)" />
        <path d="M-2 -332 C6 -316 13 -300 15 -284" fill="none" stroke="rgba(214,232,255,.5)" strokeWidth="1.1" />
        <circle cx="114" cy="-368" r="18" fill="url(#fg-orb)" className="fg-tw" style={{ animationDuration: "4.6s" }} />
        <circle cx="114" cy="-368" r="3.6" fill="#FFF3D2" />
        <ellipse cx="-30" cy="2" rx="170" ry="12" fill="url(#fg-mist)" />
      </g>
    );
  }

  function GateScene({ narrow }) {
    const g = useMemo(() => {
      const r = rng(2026);
      const stars = Array.from({ length: 70 }, () => ({ x: -300 + r() * 1800, y: 10 + r() * 360, s: .4 + r() * 1.3, d: (2 + r() * 4).toFixed(1), o: (r() * 3).toFixed(1) }));
      const yAt = t => 492 + 408 * Math.pow(t, 1.3), hw = t => 7 + 113 * t;
      const trees = [], shrubs = [], blooms = [], lamps = [], beds = [], pools = [.33, .62].map(t => ({ y: yAt(t), rx: 8 + 34 * t, ry: 2 + 8 * t }));
      [0.06, .13, .21, .3, .4, .51, .63, .76, .9].forEach((t, i) => {
        const y = yAt(t), w = hw(t), gap = 6 + 70 * t;
        [-1, 1].forEach(side => {
          const cx = 600 + side * (w + gap);
          if (i % 2 === 0) trees.push({ x: cx, y, h: 16 + 150 * Math.pow(t, 1.15), k: "c" });
          else shrubs.push({ x: cx, y, rx: 6 + 46 * t, ry: 4 + 26 * t });
          trees.push({ x: 600 + side * (w + gap + 30 + 120 * t), y: y - 2, h: 12 + 110 * Math.pow(t, 1.15), k: "c" });
          lamps.push({ x: 600 + side * (w + 2), y: y - (3 + 22 * t), r: 1.2 + 4 * t });
          beds.push({ x: 600 + side * (w + 6 + 18 * t), y: y - 2 * t, rx: 5 + 34 * t, ry: 1.5 + 7 * t });
          for (let k = 0; k < 7; k++) blooms.push({ x: 600 + side * (w + 4 + r() * (gap + 40 * t)), y: y - r() * 10 * (t + .2), r: .6 + 2.4 * t * r(), c: r() < .45 ? "#F2D99B" : r() < .7 ? "#F3C6D6" : "#CFE3FF" });
        });
      });
      // groves on the hillsides beyond the gate
      for (let i = 0; i < 46; i++) {
        const side = i % 2 ? 1 : -1, t = r();
        const x = 600 + side * (190 + t * 900 + r() * 60), y = 560 + r() * 250 + t * 40;
        if (Math.abs(x - 600) < 200) continue;
        if (r() < .55) trees.push({ x, y, h: 30 + r() * 90, k: "c" });
        else shrubs.push({ x, y, rx: 10 + r() * 30, ry: 6 + r() * 16 });
        for (let k = 0; k < 3; k++) blooms.push({ x: x + (r() - .5) * 60, y: y + r() * 8, r: .7 + r() * 1.8, c: r() < .5 ? "#F2D99B" : r() < .75 ? "#F3C6D6" : "#CFE3FF" });
      }
      trees.sort((a, b) => a.y - b.y); shrubs.sort((a, b) => a.y - b.y);
      return { stars, trees, shrubs, blooms, lamps, beds, pools };
    }, []);
    const cyp = ({ x, y, h }) => { const w = h * .26; return `M${x - w / 2} ${y} C${x - w / 2} ${y - h * .5} ${x - w * .16} ${y - h * .86} ${x} ${y - h} C${x + w * .16} ${y - h * .86} ${x + w / 2} ${y - h * .5} ${x + w / 2} ${y} Z`; };
    const vb = narrow ? "190 196 820 704" : "0 0 1200 900";
    const par = narrow ? "xMidYMin meet" : "xMidYMax meet";
    const L = narrow ? { x: 338, s: .72 } : { x: 232, s: 1 };
    const R = narrow ? { x: 862, s: .72 } : { x: 968, s: 1 };
    const mins = [{ cx: 524, top: 404 }, { cx: 676, top: 404 }];
    return (
      <svg className="fg-scene" viewBox={vb} preserveAspectRatio={par} aria-hidden="true" style={narrow ? { position: "absolute", top: 0, left: 0, width: "100%", height: "auto" } : null}>
        <defs>
          <filter id="fg-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="fg-soft"><feGaussianBlur stdDeviation="6" /></filter>
          <linearGradient id="fg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#040B18" /><stop offset=".5" stopColor="#0A1A36" /><stop offset=".78" stopColor="#15325E" /><stop offset="1" stopColor="#0B1C38" /></linearGradient>
          <radialGradient id="fg-halo" cx="600" cy="450" r="330" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#9CC3FF" stopOpacity=".55" /><stop offset=".35" stopColor="#4D7FCC" stopOpacity=".28" /><stop offset="1" stopColor="#1B3A6B" stopOpacity="0" /></radialGradient>
          <radialGradient id="fg-door" cx="600" cy="640" r="260" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#BFD8FF" stopOpacity=".35" /><stop offset="1" stopColor="#BFD8FF" stopOpacity="0" /></radialGradient>
          <linearGradient id="fg-hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#14305A" /><stop offset="1" stopColor="#0A1A34" /></linearGradient>
          <linearGradient id="fg-hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0F2548" /><stop offset="1" stopColor="#081730" /></linearGradient>
          <linearGradient id="fg-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6E9BE0" stopOpacity=".4" /><stop offset="1" stopColor="#2A4F88" stopOpacity=".28" /></linearGradient>
          <linearGradient id="fg-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6F0FF" stopOpacity=".95" /><stop offset=".5" stopColor="#8DB6F2" stopOpacity=".8" /><stop offset="1" stopColor="#4C7CC4" stopOpacity=".6" /></linearGradient>
          <linearGradient id="fg-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A3A6A" /><stop offset="1" stopColor="#0B1D3A" /></linearGradient>
          <radialGradient id="fg-orb"><stop offset="0" stopColor="#FFF1C8" stopOpacity=".95" /><stop offset=".4" stopColor="#E2C98E" stopOpacity=".5" /><stop offset="1" stopColor="#E2C98E" stopOpacity="0" /></radialGradient>
          <linearGradient id="fg-tree" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3D6AAE" /><stop offset=".4" stopColor="#173A6E" /><stop offset="1" stopColor="#0B2044" /></linearGradient>
          <radialGradient id="fg-bush" cx=".5" cy=".25" r=".8"><stop offset="0" stopColor="#4A78BE" /><stop offset=".55" stopColor="#1A3E74" /><stop offset="1" stopColor="#0E2548" /></radialGradient>
          <radialGradient id="fg-bed"><stop offset="0" stopColor="#F3C6D6" stopOpacity=".55" /><stop offset=".5" stopColor="#E2C98E" stopOpacity=".25" /><stop offset="1" stopColor="#E2C98E" stopOpacity="0" /></radialGradient>
          <radialGradient id="fg-mist"><stop offset="0" stopColor="#BFD8FF" stopOpacity=".28" /><stop offset="1" stopColor="#BFD8FF" stopOpacity="0" /></radialGradient>
          {["fgl", "fgr"].map(id => (
            <React.Fragment key={id}>
              <linearGradient id={id + "-wing"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D6E8FF" stopOpacity=".42" /><stop offset=".55" stopColor="#7FA8E8" stopOpacity=".18" /><stop offset="1" stopColor="#4F7BC4" stopOpacity=".06" /></linearGradient>
              <linearGradient id={id + "-robe"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E2EEFF" stopOpacity=".46" /><stop offset=".45" stopColor="#9CC0F5" stopOpacity=".2" /><stop offset="1" stopColor="#6F9BE0" stopOpacity=".05" /></linearGradient>
            </React.Fragment>
          ))}
        </defs>
        <rect x="-1000" y="-200" width="3200" height="1200" fill="url(#fg-sky)" />
        {g.stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#DCE8FF" className={i % 3 === 0 ? "fg-tw" : null} style={i % 3 === 0 ? { animationDuration: s.d + "s", animationDelay: s.o + "s" } : { opacity: .5 }} />)}
        <circle cx="600" cy="450" r="330" fill="url(#fg-halo)" className="fg-halo" />
        {/* the hill and the palace */}
        <path d="M-1000 600 C-400 590 200 560 420 520 C500 500 560 490 600 489 C640 490 700 500 780 520 C1000 560 1600 590 2200 600 L2200 1000 L-1000 1000 Z" fill="url(#fg-hill1)" />
        <path d="M-1000 600 C-400 590 200 560 420 520 C500 500 560 490 600 489 C640 490 700 500 780 520 C1000 560 1600 590 2200 600" fill="none" stroke="rgba(190,215,255,.45)" strokeWidth="1.2" filter="url(#fg-glow)" />
        <g filter="url(#fg-glow)" stroke="#D6E6FF" strokeWidth="1.1" fill="#123060">
          <rect x="552" y="452" width="96" height="38" />
          <rect x="530" y="464" width="22" height="26" /><rect x="648" y="464" width="22" height="26" />
          <rect x="580" y="440" width="40" height="12" />
          <path d="M580 440 C580 414 592 402 600 388 C608 402 620 414 620 440 Z" />
          <path d="M533 464 C533 454 539 449 541 445 C543 449 549 454 549 464 Z" /><path d="M651 464 C651 454 657 449 659 445 C661 449 667 454 667 464 Z" />
          {mins.map((m, i) => <g key={i}><rect x={m.cx - 3} y={m.top} width="6" height={490 - m.top} /><path d={`M${m.cx - 4} ${m.top} L${m.cx} ${m.top - 13} L${m.cx + 4} ${m.top} Z`} /><rect x={m.cx - 5} y={m.top + 18} width="10" height="2" /></g>)}
          <line x1="600" y1="388" x2="600" y2="376" /><circle cx="600" cy="373" r="2" fill="#F2D99B" stroke="none" />
        </g>
        <g fill="#F2D99B">
          {[560, 572, 584, 616, 628, 640].map(x => <path key={x} d={`M${x} 482 L${x} 472 C${x} 468 ${x + 3} 466 ${x + 3} 466 C${x + 3} 466 ${x + 6} 468 ${x + 6} 472 L${x + 6} 482 Z`} opacity=".85" />)}
          <path d="M594 490 L594 474 C594 468 600 465 600 465 C600 465 606 468 606 474 L606 490 Z" />
        </g>
        {/* the road, with a channel of water from the palace to the gate */}
        <path d="M593 492 L480 900 L720 900 L607 492 Z" fill="url(#fg-road)" />
        <path d="M593 492 L480 900 M607 492 L720 900" stroke="rgba(190,215,255,.35)" strokeWidth="1" fill="none" />
        <path d="M598.6 494 L583 900 L617 900 L601.4 494 Z" fill="url(#fg-water)" filter="url(#fg-glow)" />
        {/* lower foreground ground */}
        <path d="M-1000 700 C-300 690 300 660 470 640 L730 640 C900 660 1500 690 2200 700 L2200 1000 L-1000 1000 Z" fill="url(#fg-hill2)" opacity=".6" />
        <path d="M480 900 L593 492 L607 492 L720 900 Z" fill="url(#fg-road)" opacity=".55" />
        <path d="M598.6 494 L583 900 L617 900 L601.4 494 Z" fill="url(#fg-water)" opacity=".8" />
        {/* gardens */}
        {g.pools.map((p, i) => <g key={"p" + i} filter="url(#fg-glow)"><ellipse cx="600" cy={p.y} rx={p.rx} ry={p.ry} fill="#9CC0F5" fillOpacity=".35" stroke="#E6F0FF" strokeWidth="1" /><ellipse cx="600" cy={p.y} rx={p.rx * .45} ry={p.ry * .45} fill="#E6F0FF" fillOpacity=".5" /><path d={`M600 ${p.y} L600 ${p.y - p.ry * 3.2}`} stroke="#E6F0FF" strokeOpacity=".7" strokeWidth="1" /></g>)}
        {g.beds.map((b, i) => <ellipse key={"d" + i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill="url(#fg-bed)" />)}
        {g.shrubs.map((s, i) => <ellipse key={"s" + i} cx={s.x} cy={s.y - s.ry * .6} rx={s.rx} ry={s.ry} fill="url(#fg-bush)" stroke="rgba(190,215,255,.5)" strokeWidth=".9" />)}
        {g.trees.map((t, i) => <path key={"t" + i} d={cyp(t)} fill="url(#fg-tree)" stroke="rgba(200,224,255,.55)" strokeWidth=".9" />)}
        {g.blooms.map((b, i) => <circle key={"b" + i} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity=".85" />)}
        {g.lamps.map((l, i) => <g key={"l" + i}><circle cx={l.x} cy={l.y} r={l.r * 4} fill="url(#fg-orb)" className="fg-tw" style={{ animationDuration: (3 + (i % 5) * .7) + "s", animationDelay: (i % 7) * .4 + "s" }} /><circle cx={l.x} cy={l.y} r={l.r * .6} fill="#FFF3D2" /></g>)}
        {/* the gate */}
        <circle cx="600" cy="640" r="260" fill="url(#fg-door)" />
        <g filter="url(#fg-glow)">
          <path fillRule="evenodd" fill="url(#fg-stone)" stroke="#D6E6FF" strokeWidth="1.5"
            d="M404 900 L404 470 C404 380 500 300 600 246 C700 300 796 380 796 470 L796 900 L730 900 L730 474 C730 410 670 360 600 322 C530 360 470 410 470 474 L470 900 Z" />
          <path fill="none" stroke="#E2C98E" strokeOpacity=".75" strokeWidth="1.2" d="M484 900 L484 476 C484 418 538 372 600 338 C662 372 716 418 716 476 L716 900" />
          <path fill="none" stroke="#E2C98E" strokeOpacity=".45" strokeWidth="1" d="M418 900 L418 472 C418 390 508 316 600 262 C692 316 782 390 782 472 L782 900" />
          <rect x="394" y="462" width="86" height="12" fill="#14325E" stroke="#D6E6FF" strokeWidth="1.1" /><rect x="720" y="462" width="86" height="12" fill="#14325E" stroke="#D6E6FF" strokeWidth="1.1" />
          <rect x="390" y="878" width="94" height="22" fill="#14325E" stroke="#D6E6FF" strokeWidth="1.1" /><rect x="716" y="878" width="94" height="22" fill="#14325E" stroke="#D6E6FF" strokeWidth="1.1" />
          <path d="M600 246 L600 214" stroke="#E2C98E" strokeWidth="1.4" />
          <path d="M589 232 C589 222 600 216 600 206 C600 216 611 222 611 232 Z" fill="#14325E" stroke="#E2C98E" strokeWidth="1.2" />
          <circle cx="600" cy="200" r="4" fill="#F2D99B" />
          {[[437, 600], [763, 600], [437, 720], [763, 720]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 11} L${x + 3.5} ${y - 3.5} L${x + 11} ${y} L${x + 3.5} ${y + 3.5} L${x} ${y + 11} L${x - 3.5} ${y + 3.5} L${x - 11} ${y} L${x - 3.5} ${y - 3.5} Z`} fill="none" stroke="#E2C98E" strokeOpacity=".7" strokeWidth="1" />)}
        </g>
        <path d="M600 322 C530 360 470 410 470 474 L470 900 L730 900 L730 474 C730 410 670 360 600 322 Z" fill="url(#fg-door)" opacity=".5" />
        {/* the two angels */}
        <Angel id="fgl" x={L.x} y={900} s={L.s} />
        <Angel id="fgr" x={R.x} y={900} s={R.s} flip />
      </svg>
    );
  }

  function Fireflies() {
    const ref = useRef(null);
    useEffect(() => {
      const c = ref.current; if (!c) return;
      const ctx = c.getContext("2d");
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let w = 0, h = 0, dpr = 1, parts = [], raf = 0, run = true;
      const sprite = (() => { const s = document.createElement("canvas"); s.width = s.height = 48; const g = s.getContext("2d"); const gr = g.createRadialGradient(24, 24, 0, 24, 24, 24); gr.addColorStop(0, "rgba(255,244,200,1)"); gr.addColorStop(.25, "rgba(242,217,155,.75)"); gr.addColorStop(1, "rgba(226,201,142,0)"); g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return s; })();
      const size = () => {
        const r = c.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
        w = c.width = Math.max(1, Math.round(r.width * dpr)); h = c.height = Math.max(1, Math.round(r.height * dpr));
        const n = Math.round(Math.min(60, Math.max(22, r.width / 24)));
        parts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: h * (.35 + Math.random() * .62), a: Math.random() * Math.PI * 2, v: (.12 + Math.random() * .3) * dpr, r: (.55 + Math.random() * .9) * dpr, ph: Math.random() * 10, f: .5 + Math.random() * 1.1 }));
      };
      const draw = t => {
        ctx.clearRect(0, 0, w, h);
        const time = t / 1000;
        parts.forEach(p => {
          if (!reduce) {
            p.a += (Math.sin(time * .7 + p.ph) * .04) + (Math.random() - .5) * .08;
            p.x += Math.cos(p.a) * p.v; p.y += Math.sin(p.a) * p.v * .7 - .03 * dpr;
            if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
            if (p.y < h * .25) p.a = Math.PI / 2 + (Math.random() - .5); if (p.y > h + 10) p.y = h * .3;
          }
          const pulse = Math.max(0, Math.sin(time * p.f + p.ph));
          const alpha = reduce ? .6 : .12 + .88 * Math.pow(pulse, 2.2);
          ctx.globalAlpha = alpha;
          const s = p.r * 8;
          ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
        });
        ctx.globalAlpha = 1;
        if (run && !reduce) raf = requestAnimationFrame(draw);
      };
      size(); raf = requestAnimationFrame(draw);
      const ro = window.ResizeObserver ? new ResizeObserver(() => size()) : null;
      if (ro) ro.observe(c);
      const onR = () => size();
      const onV = () => { if (document.hidden) { run = false; cancelAnimationFrame(raf); } else if (!run) { run = true; raf = requestAnimationFrame(draw); } };
      window.addEventListener("resize", onR); document.addEventListener("visibilitychange", onV);
      return () => { run = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); window.removeEventListener("resize", onR); document.removeEventListener("visibilitychange", onV); };
    }, []);
    return <canvas ref={ref} className="fg-fire" aria-hidden="true" />;
  }

  const EyeIcon = ({ off }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" />{off && <path d="M4 4l16 16" />}</svg>;

  function FounderGate({ onExit }) {
    useGateStyles();
    const store = window.BrialStore;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [reveal, setReveal] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const isNarrow = () => window.innerWidth / Math.max(1, window.innerHeight) < 0.9;
    const [narrow, setNarrow] = useState(isNarrow);
    useEffect(() => { const h = () => setNarrow(isNarrow()); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
    const submit = async e => {
      e && e.preventDefault();
      setError(null); setLoading(true);
      let res;
      try { res = await store.authFounder(email, password); } catch (err) { res = { error: "Could not reach the server. Check your connection and try again." }; }
      if (res && res.ok) window.dispatchEvent(new CustomEvent("brial:change", { detail: { key: "founder-auth" } }));
      else { setError((res && res.error) || "The email or password is not correct."); setLoading(false); }
    };
    return (
      <div className="fg" style={narrow ? { "--fg-top": (window.innerWidth * 704 / 820 + 14) + "px" } : null}>
        <GateScene narrow={narrow} />
        <Fireflies />
        <button className="fg-exit" onClick={onExit}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>Public site</button>
        <div className={narrow ? "fg-flow" : null}>
          <p className="fg-verse">“When a person dies, their deeds come to an end except for three: a charity that continues, knowledge that benefits, and a righteous child who prays for them.”<small>Sahih Muslim</small></p>
          <form className="fg-card" onSubmit={submit}>
            <div className="fg-mark"><svg width="26" height="26" viewBox="0 0 36 36" aria-hidden="true"><g fill="none" stroke="#E2C98E" strokeWidth="1.2"><path d="M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" /><circle cx="18" cy="18" r="4" fill="#E2C98E" stroke="none" /></g></svg></div>
            <p className="fg-k">Founder Portal</p>
            <h1 className="fg-h">Welcome back.</h1>
            <div className="fg-f"><label htmlFor="fg-email">Email</label><div className="fg-in"><input id="fg-email" type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" spellCheck={false} /></div></div>
            <div className="fg-f"><label htmlFor="fg-pw">Password</label><div className="fg-in"><input id="fg-pw" type={reveal ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /><button type="button" className="fg-eye" onClick={() => setReveal(r => !r)} aria-label={reveal ? "Hide password" : "Show password"}><EyeIcon off={reveal} /></button></div></div>
            {error && <div className="fg-err" role="alert">{error}</div>}
            <button className="fg-btn" type="submit" disabled={!email || !password || loading}>{loading ? "Signing in…" : "Sign in"}</button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================
  // SITE SETTINGS — contact & social links in the public footer
  // ============================================================
  const LINE_TYPES = ["email", "phone", "whatsapp", "address"];
  function ContactView({ store }) {
    const types = store.CONTACT_TYPES || [];
    const load = () => {
      const stored = store.getSiteContact ? store.getSiteContact() : [];
      const preset = types.map(t => { const hit = stored.find(x => x.type === t.type); return { type: t.type, value: hit ? hit.value : "", label: "", shown: hit ? !!hit.shown : false }; });
      const extra = stored.filter(x => x.type === "link").map((x, i) => ({ ...x, id: "c" + i }));
      return { preset, extra };
    };
    const [f, setF] = useState(load);
    const [saved, setSaved] = useState(() => JSON.stringify(load()));
    const [busy, setBusy] = useState(false);
    const [m, flash] = useFlash();
    const dirty = JSON.stringify(f) !== saved;
    useEffect(() => {
      const h = e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
      window.addEventListener("beforeunload", h);
      return () => window.removeEventListener("beforeunload", h);
    }, [dirty]);
    // filling a field shows it; emptying a field hides it
    const upd = (x, patch) => { const n = { ...x, ...patch }; if (patch.value !== undefined) { if (!patch.value.trim()) n.shown = false; else if (!x.value.trim()) n.shown = true; } return n; };
    const setP = (type, patch) => setF(p => ({ ...p, preset: p.preset.map(x => (x.type === type ? upd(x, patch) : x)) }));
    const setX = (id, patch) => setF(p => ({ ...p, extra: p.extra.map(x => (x.id === id ? upd(x, patch) : x)) }));
    const addX = () => setF(p => ({ ...p, extra: [...p.extra, { id: "c" + Date.now(), type: "link", label: "", value: "", shown: false }] }));
    const delX = id => setF(p => ({ ...p, extra: p.extra.filter(x => x.id !== id) }));
    const all = [...f.preset, ...f.extra];
    const href = it => (store.contactHref ? store.contactHref(it) : null);
    const badUrl = it => it.type === "link" && it.value.trim() && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/i.test(it.value.trim());
    const badEmail = it => it.type === "email" && it.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(it.value.trim());
    const invalid = all.some(it => badUrl(it) || badEmail(it) || (it.type === "link" && it.value.trim() && !it.label.trim()));
    const save = async () => {
      setBusy(true);
      try {
        await store.saveSiteContact(all.filter(x => x.value.trim() || x.type !== "link").map(({ type, value, label, shown }) => ({ type, value, label, shown })));
        setSaved(JSON.stringify(f));
        flash("Saved — the footer is updated.");
      } catch (e) { flash("Could not save. Check your connection and try again.", "err"); }
      setBusy(false);
    };
    const shownCount = all.filter(x => x.shown && x.value.trim()).length;
    const row = ({ k, it, label, hint, onValue, onShown, extra }) => {
      const h = it.value.trim() ? href(it) : null;
      return (
        <div key={k} className="fd-crow">
          <div className="fd-crow-l"><span className="fd-crow-ic">{store.contactIcon ? store.contactIcon(it.type, 18) : null}</span>{extra || <b>{label}</b>}</div>
          <div className="fd-crow-v">
            <input className="fd-input" value={it.value} onChange={e => onValue(e.target.value)} placeholder={hint} spellCheck={false} aria-label={label || "Link address"} />
            {badEmail(it) && <small className="fd-bad">This doesn't look like an email address.</small>}
            {badUrl(it) && <small className="fd-bad">Use a web address, for example https://…</small>}
          </div>
          <div className="fd-crow-a">
            {h ? <a className="fd-btn quiet sm" href={h} target="_blank" rel="noopener noreferrer" title="Test this link">Test {ICON.ext}</a> : <span className="fd-crow-gap" />}
            <Switch on={it.shown && !!it.value.trim()} onChange={v => it.value.trim() && onShown(v)}>{it.shown && it.value.trim() ? "Shown" : "Hidden"}</Switch>
          </div>
        </div>
      );
    };
    const preview = all.filter(x => x.shown && x.value.trim());
    const T = {}; types.forEach(t => { T[t.type] = t; });
    return (
      <>
        <Head title="Contact & social" lede="The contact details and social links at the bottom of every public page. Hidden items are never sent to visitors." />
        <div className="fd-site">
          <div>
            <div className="fd-card">
              <div className="fd-card-head" style={{ marginBottom: 4 }}><div><h2 className="fd-h2">Contact details</h2><p className="fd-sub">Shown as lines of text with an icon.</p></div></div>
              {f.preset.filter(x => LINE_TYPES.includes(x.type)).map(it => row({ k: it.type, it, label: T[it.type].label, hint: T[it.type].hint, onValue: v => setP(it.type, { value: v }), onShown: v => setP(it.type, { shown: v }) }))}
            </div>
            <div className="fd-card">
              <div className="fd-card-head" style={{ marginBottom: 4 }}><div><h2 className="fd-h2">Social profiles</h2><p className="fd-sub">Shown as round icons. A handle like @brialendowment is enough.</p></div></div>
              {f.preset.filter(x => !LINE_TYPES.includes(x.type)).map(it => row({ k: it.type, it, label: T[it.type].label, hint: T[it.type].hint, onValue: v => setP(it.type, { value: v }), onShown: v => setP(it.type, { shown: v }) }))}
            </div>
            <div className="fd-card">
              <div className="fd-card-head" style={{ marginBottom: 4 }}>
                <div><h2 className="fd-h2">Other links</h2><p className="fd-sub">Anything else — a Linktree, a donation page, a podcast.</p></div>
                <button className="fd-btn ghost sm" onClick={addX}>Add a link</button>
              </div>
              {f.extra.length === 0 ? <p className="fd-sub" style={{ margin: "8px 0 0" }}>No other links.</p> : f.extra.map(it => (
                row({ k: it.id, it, hint: "https://…", onValue: v => setX(it.id, { value: v }), onShown: v => setX(it.id, { shown: v }),
                  extra: <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0, flex: 1 }}><input className="fd-input" value={it.label} onChange={e => setX(it.id, { label: e.target.value })} placeholder="Name" aria-label="Link name" /><button className="fd-btn quiet sm" onClick={() => delX(it.id)} aria-label="Remove link">✕</button></div> })
              ))}
            </div>
          </div>
          <aside className="fd-card fd-site-prev">
            <div className="fd-stage-k">Footer preview</div>
            <p className="fd-sub" style={{ marginTop: 4 }}>{shownCount ? `${shownCount} ${plural(shownCount, "item", "items")} visible to visitors.` : "Nothing is shown yet — the footer keeps its usual look."}</p>
            <div className="fd-prev">
              <div className="fd-prev-brand">{ICON.star}<span>The Brial Endowment</span></div>
              <p>A sovereign philanthropic foundation. Direct-to-student. On-chain and fully transparent.</p>
              {preview.filter(x => LINE_TYPES.includes(x.type)).map((x, i) => <div key={i} className="fd-prev-line">{store.contactIcon(x.type, 16)}<span>{x.type === "whatsapp" ? "WhatsApp " + x.value : x.value}</span></div>)}
              <div className="fd-prev-icons">{preview.filter(x => !LINE_TYPES.includes(x.type)).map((x, i) => <span key={i} title={x.type === "link" ? x.label : (T[x.type] || {}).label}>{store.contactIcon(x.type, 16)}</span>)}</div>
            </div>
          </aside>
        </div>
        {(dirty || m) && (
          <div className="fd-savebar">
            <span style={{ color: m && m.tone === "err" ? "var(--rose)" : dirty ? "var(--amber)" : "var(--sage)", fontWeight: 600 }}>{m && !dirty ? m.text : m && m.tone === "err" ? m.text : invalid ? "Fix the highlighted fields first" : "You have unsaved changes"}</span>
            <div className="fd-actions">
              {dirty && <button className="fd-btn quiet" onClick={() => setF(JSON.parse(saved))}>Discard</button>}
              <button className="fd-btn primary" disabled={!dirty || invalid || busy} onClick={save}>{busy ? "Saving…" : "Save and publish"}</button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ============================================================
  // SITE SETTINGS — email: receipts, notices, alerts
  // ============================================================
  const MAIL_GROUPS = [
    { title: "Donors", sub: "From receipts@brialendowment.org", items: [
      ["receipt", "Donation receipt", "The official receipt with a PDF, sent the moment you verify a gift."]] },
    { title: "Alerts for you", sub: "From desk@brialendowment.org to your alert address", items: [
      ["donation_reported", "New gift reported", "Someone reports a gift on the donate page."],
      ["application_submitted", "New application", "An applicant submits the scholarship application."],
      ["bill_uploaded", "Tuition bill uploaded", "A scholar uploads a bill for you to pay."],
      ["ip_uploaded", "Semester results uploaded", "A scholar uploads the results of a semester."],
      ["change_requested", "Change request", "A scholar asks to change a detail only you can approve."],
      ["report_new", "Help desk message", "A scholar writes to the help desk."],
      ["graduation", "Graduation submitted", "A scholar uploads the diploma and transcript."]] },
    { title: "Applicants and scholars", sub: "From hello@brialendowment.org — replies come to you", items: [
      ["application_received", "Application received", "Confirms the application arrived and explains the next steps."],
      ["interview", "Interview invitation", "Date, time in WIB and Istanbul, and the meeting link."],
      ["accepted", "Scholarship approved", "Welcome, scholar ID, and the first step."],
      ["rejected", "Application declined", "A kind, respectful decision letter."],
      ["tuition_paid", "Tuition paid", "Confirms a semester's tuition has been paid, with the reference."],
      ["change_resolved", "Change request answered", "Tells the scholar whether you approved a change."],
      ["scholar_status", "Scholarship paused, resumed or ended", "Includes the note you wrote when you changed the status."],
      ["report_reply", "Help desk reply", "Your reply, with their original message."]] },
  ];
  const MAIL_LABEL = { test: "Test email" };
  MAIL_GROUPS.forEach(g => g.items.forEach(([k, l]) => { MAIL_LABEL[k] = l; }));
  const MAIL_TONE = { sent: "ok", pending: "warn", sending: "warn", skipped: "", failed: "bad" };
  const MAIL_WORD = { sent: "Sent", pending: "Waiting", sending: "Sending", skipped: "Not sent", failed: "Failed" };

  MAIL_LABEL.message = "Email you wrote";
  const SENDERS = [
    ["brial", "Brial Asif Hayi Paka", "brial@brialendowment.org", "A personal letter from you"],
    ["hello", "The Brial Endowment", "hello@brialendowment.org", "The foundation's general address"],
    ["receipts", "The Brial Endowment", "receipts@brialendowment.org", "For anything about gifts and receipts"],
  ];
  const PROGRAMMES = ["The Brial Endowment — general endowment fund", "Scholarships", "Clean Water — wells and water systems", "Food & Land — Trees for Life, olive trees in Palestine", "Houses of Worship", "Hospitals", "Schools", "Livestock & Enterprise", "Sustainable Infrastructure", "Library"];
  const THANKS = "Dear …,\n\nThank you for your generous contribution of $… to …. Because of you, …\n\n…\n\nMay God accept it from you and multiply its reward.\n\nWith heartfelt thanks,";
  const splitTo = s => String(s || "").split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
  function Composer({ store, onClose, onSent }) {
    const [f, setF] = useState({ from: "brial", to: "", subject: "", body: "", sign: true });
    const [ackOn, setAckOn] = useState(false);
    const [ack, setAck] = useState({ name: "", amount: "", programme: "", date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10), reference: "", pdf: true });
    const [prev, setPrev] = useState(null);
    const [busy, setBusy] = useState("");
    const [err, setErr] = useState("");
    const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setPrev(null); };
    const setA = (k, v) => { setAck(p => ({ ...p, [k]: v })); setPrev(null); };
    const tos = splitTo(f.to);
    const badTo = tos.filter(t => !okEmail(t));
    const amt = parseFloat(String(ack.amount).replace(/,/g, ""));
    const ackBad = ackOn && !(amt > 0);
    const ready = tos.length > 0 && tos.length <= 20 && !badTo.length && f.subject.trim() && f.body.trim() && !ackBad;
    const msg = () => ({ ...f, to: tos, subject: f.subject.trim(), body: f.body.trim(), ack: ackOn ? { ...ack, amount: amt } : null });
    const preview = async () => { setBusy("prev"); setErr(""); try { setPrev(await store.previewMessage(msg())); } catch (e) { setErr("Could not load the preview."); } setBusy(""); };
    const send = async () => {
      setBusy("send"); setErr("");
      try { const r = await store.sendMessage(msg()); onSent(r && r.queued ? r.queued : tos.length); onClose(); }
      catch (e) { const c = String(e && (e.message || e)); setErr(c.indexOf("rate_limited") >= 0 ? "That's a lot of email in one hour — wait a little, then try again." : c.indexOf("invalid_email") >= 0 ? "One of the addresses doesn't look right." : "Could not send right now. Try again in a moment."); }
      setBusy("");
    };
    const S = SENDERS.find(s => s[0] === f.from) || SENDERS[0];
    return (
      <Modal wide title="Write an email" sub="Sent from brialendowment.org. Replies come back to hello@, which forwards to your inbox." onClose={onClose}>
        {prev ? (
          <>
            <div className="fd-sub" style={{ margin: "0 0 10px" }}><b style={{ color: "var(--text)" }}>From</b> {S[1]} &lt;{S[2]}&gt; · <b style={{ color: "var(--text)" }}>To</b> {tos.join(", ")}{ackOn && ack.pdf ? " · PDF acknowledgement attached" : ""}</div>
            <iframe className="fd-mprev" title="Email preview" sandbox="" srcDoc={prev.html} />
            <div className="fd-actions" style={{ marginTop: 14 }}>
              <Confirm className="fd-btn primary" armedLabel={`Confirm · send to ${tos.length} ${plural(tos.length, "person", "people")}`} disabled={!ready || !!busy} onConfirm={send}>{busy === "send" ? "Sending…" : "Send"}</Confirm>
              <button className="fd-btn ghost" onClick={() => setPrev(null)}>Back to editing</button>
            </div>
          </>
        ) : (
          <>
            <Field label="From">
              <select className="fd-input" value={f.from} onChange={e => set("from", e.target.value)}>{SENDERS.map(s => <option key={s[0]} value={s[0]}>{s[1]} — {s[2]}</option>)}</select>
            </Field>
            <p className="fd-sub" style={{ margin: "4px 0 0" }}>{S[3]}.</p>
            <Field label="To" hint={badTo.length ? "" : "One or more addresses, separated by commas. Each person gets their own email."} style={{ marginTop: 12 }}>
              <input className="fd-input" value={f.to} onChange={e => set("to", e.target.value)} placeholder="name@example.com" spellCheck={false} />
            </Field>
            {badTo.length > 0 && <small className="fd-bad">Check: {badTo.join(", ")}</small>}
            <Field label="Subject" style={{ marginTop: 12 }}><input className="fd-input" value={f.subject} maxLength={200} onChange={e => set("subject", e.target.value)} placeholder="Thank you for …" /></Field>
            <div className="fd-actions" style={{ margin: "12px 0 6px" }}>
              <span className="fd-sub" style={{ margin: 0 }}>Start from</span>
              <button className="fd-btn quiet sm" onClick={() => { set("body", THANKS); if (!f.subject) set("subject", "Thank you"); }}>Thank-you letter</button>
              <button className="fd-btn quiet sm" onClick={() => set("body", "")}>Blank</button>
            </div>
            <Field label="Message" hint="Leave an empty line between paragraphs.">
              <textarea className="fd-input" rows={10} maxLength={10000} value={f.body} onChange={e => set("body", e.target.value)} placeholder="Dear …," />
            </Field>
            <div className="fd-krow" style={{ borderTop: 0 }}><div><b>Sign with my name</b><small>Adds "Brial Asif Hayi Paka · Founder, The Brial Endowment" under the message.</small></div><Switch on={f.sign} onChange={v => set("sign", v)}>{f.sign ? "On" : "Off"}</Switch></div>
            <div className="fd-krow"><div><b>Acknowledge a contribution</b><small>Adds the amount and programme to the email, with a PDF acknowledgement. It does not change the public ledger.</small></div><Switch on={ackOn} onChange={v => { setAckOn(v); setPrev(null); }}>{ackOn ? "On" : "Off"}</Switch></div>
            {ackOn && (
              <div className="fd-card" style={{ background: "rgba(10,22,40,.4)", marginTop: 6 }}>
                <div className="fd-grid2">
                  <Field label="Contributed by"><input className="fd-input" value={ack.name} onChange={e => setA("name", e.target.value)} placeholder="Full name" /></Field>
                  <Field label="Amount (USD)"><input className="fd-input" inputMode="decimal" value={ack.amount} onChange={e => setA("amount", e.target.value)} placeholder="35" /></Field>
                  <Field label="Programme"><input className="fd-input" list="fd-programmes" value={ack.programme} onChange={e => setA("programme", e.target.value)} placeholder="Food & Land — …" /><datalist id="fd-programmes">{PROGRAMMES.map(x => <option key={x} value={x} />)}</datalist></Field>
                  <Field label="Date of contribution"><input className="fd-input" type="date" value={ack.date} onChange={e => setA("date", e.target.value)} /></Field>
                  <Field label="Reference (optional)"><input className="fd-input" value={ack.reference} onChange={e => setA("reference", e.target.value)} placeholder="Bank or grant reference" /></Field>
                  <div style={{ display: "flex", alignItems: "flex-end" }}><Switch on={ack.pdf} onChange={v => setA("pdf", v)}>Attach PDF</Switch></div>
                </div>
                {ackBad && <small className="fd-bad">Enter the amount.</small>}
              </div>
            )}
            {err && <div className="fd-msg err" style={{ marginTop: 12 }}>{err}</div>}
            <div className="fd-actions" style={{ marginTop: 16 }}>
              <button className="fd-btn primary" disabled={!ready || !!busy} onClick={preview}>{busy === "prev" ? "Preparing…" : "Preview"}</button>
              <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
              {!ready && <small className="fd-sub" style={{ margin: 0 }}>Fill in who it's to, a subject and the message.</small>}
            </div>
          </>
        )}
        {prev && err && <div className="fd-msg err" style={{ marginTop: 12 }}>{err}</div>}
      </Modal>
    );
  }

  const offKinds = k => Object.keys(k || {}).filter(x => k[x] === false).sort().join(",");
  const mailDirty = (a, b) => !!(a && b) && (a.founderTo.trim() !== b.founderTo || offKinds(a.kinds) !== offKinds(b.kinds));
  function EmailView({ store }) {
    const [s, setS] = useState(null);      // the form
    const [sv, setSv] = useState(null);    // what the server holds
    const svRef = useRef(null);
    const [log, setLog] = useState([]);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState("");
    const [prev, setPrev] = useState(null);
    const [compose, setCompose] = useState(false);
    const [m, flash] = useFlash();
    const keep = st => { const norm = { founderTo: st.founderTo || "hello@brialendowment.org", paused: !!st.paused, kinds: st.kinds || {} }; svRef.current = norm; setSv(norm); return norm; };
    const load = useCallback(async () => {
      try {
        const [st, lg] = await Promise.all([store.getMailSettings(), store.mailLog(40)]);
        const before = svRef.current, norm = keep(st);
        setS(cur => (cur && mailDirty(cur, before) ? cur : norm));
        setLog(lg || []); setErr("");
      } catch (e) { setErr("Could not load the email settings. Check your connection and refresh."); }
    }, [store]);
    useEffect(() => { load(); const t = setInterval(() => { store.mailLog(40).then(l => setLog(l || [])).catch(() => {}); }, 20000); return () => clearInterval(t); }, [load]);
    if (err && !s) return <><Head title="Email" /><div className="fd-msg err">{err}</div></>;
    if (!s || !sv) return <><Head title="Email" /><p className="fd-sub">Loading…</p></>;
    const dirty = mailDirty(s, sv);
    const badTo = !okEmail(s.founderTo);
    const on = k => s.kinds[k] !== false;
    const setKind = (k, v) => setS(p => ({ ...p, kinds: { ...p.kinds, [k]: v } }));
    const persist = async next => { const res = await store.saveMailSettings(next); return keep(res); };
    const save = async () => { setBusy("save"); try { const n = await persist({ founderTo: s.founderTo.trim(), kinds: s.kinds, paused: sv.paused }); setS(n); flash("Saved."); } catch (e) { flash("Could not save. Try again.", "err"); } setBusy(""); };
    const togglePause = async () => {
      setBusy("pause");
      try { const n = await persist({ ...sv, paused: !sv.paused }); setS(cur => ({ ...cur, paused: n.paused })); flash(n.paused ? "Sending is paused. New emails wait in the queue." : "Sending is on. Anything waiting goes out now."); setTimeout(load, 4000); }
      catch (e) { flash("Could not change it. Try again.", "err"); }
      setBusy("");
    };
    const test = async () => {
      setBusy("test");
      try { await store.sendTestEmail(); flash(`A test email is on its way to ${sv.founderTo}.`); setTimeout(load, 5000); }
      catch (e) { flash(String(e && e.message).indexOf("rate_limited") >= 0 ? "That's enough tests for this hour." : "Could not send a test right now.", "err"); }
      setBusy("");
    };
    const preview = async () => { setBusy("prev"); try { setPrev(await store.mailPreview()); } catch (e) { flash("Could not load the preview.", "err"); } setBusy(""); };
    const samplePdf = async () => { setBusy("pdf"); try { await store.downloadReceiptPdf(null, true); } catch (e) { flash("Could not create the sample PDF.", "err"); } setBusy(""); };
    const paused = sv.paused;
    const day = Date.now() - 864e5;
    const sent24 = log.filter(x => x.status === "sent" && new Date(x.sentAt).getTime() > day).length;
    const waiting = log.filter(x => x.status === "pending" || x.status === "sending").length;
    const failed = log.filter(x => x.status === "failed").length;
    return (
      <>
        <Head title="Email" lede="Receipts for donors, notices for applicants and scholars, and alerts for you — all sent from brialendowment.org." />
        <div className="fd-mail">
          <div>
            <div className="fd-card">
              <div className="fd-mstat">
                <div><h2 className="fd-h2" style={{ marginTop: 0 }}>Write an email</h2><p className="fd-sub" style={{ margin: 0 }}>A thank-you, an update or a reply — sent from brial@, hello@ or receipts@brialendowment.org.</p></div>
                <button className="fd-btn primary" disabled={paused} title={paused ? "Resume sending first" : ""} onClick={() => setCompose(true)}>{ICON.send}Write an email</button>
              </div>
            </div>
            <div className="fd-card">
              <div className="fd-mstat">
                <div>
                  <Tag tone={paused ? "warn" : "ok"} dot>{paused ? "Paused" : "Sending"}</Tag>
                  <h2 className="fd-h2">{paused ? "Emails are waiting, not sent" : "Email is on"}</h2>
                  <p className="fd-sub" style={{ margin: 0 }}>{paused ? "Events are still recorded. Everything waiting goes out when you resume." : "Each email goes out a few seconds after the event that triggers it."}</p>
                </div>
                <button className={"fd-btn " + (paused ? "primary" : "ghost")} disabled={!!busy} onClick={togglePause}>{busy === "pause" ? "…" : paused ? "Resume sending" : "Pause sending"}</button>
              </div>
              <Stats items={[{ label: "Sent in the last 24 hours", value: sent24, sub: "Free plan: up to 100 a day", tone: "ok" }, { label: "Waiting", value: waiting, tone: waiting ? "warn" : "" }, { label: "Failed", value: failed, sub: failed ? "See the activity list" : "None", tone: failed ? "bad" : "" }]} />
              <div className="fd-actions" style={{ marginTop: 14 }}>
                <button className="fd-btn ghost sm" disabled={!!busy || paused} onClick={test} title={paused ? "Resume sending first" : ""}>{ICON.send}{busy === "test" ? "Sending…" : "Send a test email"}</button>
                <button className="fd-btn ghost sm" disabled={!!busy} onClick={preview}>{busy === "prev" ? "Loading…" : "Preview the receipt email"}</button>
                <button className="fd-btn ghost sm" disabled={!!busy} onClick={samplePdf}>{ICON.pdf}{busy === "pdf" ? "Preparing…" : "Sample receipt PDF"}</button>
              </div>
              {m && <div style={{ marginTop: 12 }}><Flash m={m} /></div>}
            </div>
            <div className="fd-card">
              <div className="fd-card-head" style={{ marginBottom: 4 }}><div><h2 className="fd-h2">Your alerts go to</h2><p className="fd-sub">hello@brialendowment.org forwards to your Gmail. Use another address only if you have a reason to.</p></div></div>
              <input className="fd-input" type="email" value={s.founderTo} onChange={e => setS(p => ({ ...p, founderTo: e.target.value }))} spellCheck={false} aria-label="Alert address" />
              {badTo && <small className="fd-bad">This doesn't look like an email address.</small>}
            </div>
            {MAIL_GROUPS.map(g => (
              <div className="fd-card" key={g.title}>
                <div className="fd-card-head" style={{ marginBottom: 4 }}><div><h2 className="fd-h2">{g.title}</h2><p className="fd-sub">{g.sub}</p></div></div>
                {g.items.map(([k, label, desc]) => (
                  <div className="fd-krow" key={k}><div><b>{label}</b><small>{desc}</small></div><Switch on={on(k)} onChange={v => setKind(k, v)}>{on(k) ? "On" : "Off"}</Switch></div>
                ))}
              </div>
            ))}
          </div>
          <aside className="fd-card fd-site-prev">
            <div className="fd-card-head" style={{ marginBottom: 6 }}><div><div className="fd-stage-k">Activity</div><p className="fd-sub" style={{ margin: "4px 0 0" }}>The latest emails, newest first.</p></div><button className="fd-btn quiet sm" onClick={load}>Refresh</button></div>
            {log.length === 0 ? <p className="fd-sub">Nothing sent yet.</p> : (
              <div className="fd-mlog">{log.map(x => (
                <div className="fd-mlog-i" key={x.id}>
                  <b>{x.kind === "message" ? (x.subject || MAIL_LABEL.message) : (MAIL_LABEL[x.kind] || x.kind)}</b><Tag tone={MAIL_TONE[x.status]}>{MAIL_WORD[x.status] || x.status}</Tag>
                  <small>{[x.to, fdatetime(x.sentAt || x.createdAt)].filter(Boolean).join(" · ")}</small><span />
                  {x.error && x.status !== "sent" && <small style={{ gridColumn: "1 / -1", color: x.status === "failed" ? "var(--rose)" : "var(--faint)" }}>{x.error}</small>}
                </div>
              ))}</div>
            )}
          </aside>
        </div>
        {dirty && (
          <div className="fd-savebar">
            <span style={{ color: "var(--amber)", fontWeight: 600 }}>{badTo ? "Fix the alert address first" : "You have unsaved changes"}</span>
            <div className="fd-actions">
              <button className="fd-btn quiet" onClick={() => setS(sv)}>Discard</button>
              <button className="fd-btn primary" disabled={badTo || !!busy} onClick={save}>{busy === "save" ? "Saving…" : "Save"}</button>
            </div>
          </div>
        )}
        {compose && <Composer store={store} onClose={() => setCompose(false)} onSent={n => { flash(`${n} ${plural(n, "email is", "emails are")} on the way.`); setTimeout(load, 5000); setTimeout(load, 15000); }} />}
        {prev && (
          <Modal wide title={prev.subject} sub={"From " + prev.from + " · sample data"} onClose={() => setPrev(null)}>
            <iframe className="fd-mprev" title="Receipt email preview" sandbox="" srcDoc={prev.html} />
          </Modal>
        )}
      </>
    );
  }

  // ============================================================
  // ROOT
  // ============================================================
  function FounderDesk({ pillar, store, onBack, onExit, founderEmail, onLogout }) {
    useStyles();
    const key = "fd-tab-" + pillar;
    const [tab, setTabS] = useNav(key, () => { try { return sessionStorage.getItem(key) || ""; } catch (e) { return ""; } });
    const [focus, setFocus] = useState(null);
    const setTab = t => { setTabS(t); try { sessionStorage.setItem(key, t); } catch (e) {} window.scrollTo({ top: 0 }); };
    const meta = PILLARS[pillar] || { name: pillar, accent: "#C9A961" };
    let nav, view;
    if (pillar === "scholarships") {
      const apps = store.listApplicants();
      const scholars = apps.filter(a => a.status === "accepted");
      const reports = store.listReports();
      const donations = store.listDonations();
      const due = scholars.reduce((a, s) => a + (s.semesters || []).filter(x => x.status === "bill-uploaded").length, 0);
      const todo = apps.filter(a => ["submitted", "interview-scheduled", "interview-done"].includes(a.status)).length;
      const reqs = apps.reduce((a, x) => a + (x.changeRequests || []).filter(r => r.status === "pending").length, 0);
      const unver = donations.filter(d => !(store.isInternalDonation && store.isInternalDonation(d)) && !d.verified).length;
      const open = reports.filter(r => r.status === "open").length;
      nav = [
        { id: "apps", label: "Applications", icon: ICON.inbox, count: todo + reqs, hot: todo + reqs > 0 },
        { id: "pay", label: "Disbursements", icon: ICON.pay, count: due, hot: due > 0 },
        { id: "scholars", label: "Scholars", icon: ICON.cap, count: scholars.length },
        { id: "gifts", label: "Donations", icon: ICON.gift, count: unver, hot: unver > 0 },
        { id: "help", label: "Help desk", icon: ICON.help, count: open, hot: open > 0 },
        { id: "accounts", label: "Accounts", icon: ICON.users, count: apps.length },
      ];
      const t = nav.some(n => n.id === tab) ? tab : "apps";
      const openRecord = id => { setFocus(id); setTab("apps"); };
      view = t === "apps" ? <ApplicationsView store={store} apps={apps} focus={focus} clearFocus={() => setFocus(null)} />
        : t === "pay" ? <DisbursementsView store={store} scholars={scholars} />
        : t === "scholars" ? <ScholarsView store={store} scholars={scholars} openRecord={openRecord} />
        : t === "gifts" ? <DonationsView store={store} donations={donations} />
        : t === "help" ? <HelpDeskView store={store} reports={reports} />
        : <AccountsView store={store} apps={apps} deleted={store.listDeleted()} openRecord={openRecord} />;
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active={t} onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout}>{view}</Shell>;
    }
    if (pillar === "library") {
      nav = [
        { id: "catalog", label: "Catalogue", icon: ICON.book, count: store.listEbooks().length },
        { id: "sales", label: "Sales", icon: ICON.sale, count: store.listLibrarySales().length },
        { id: "link", label: "Pillar link", icon: ICON.link },
      ];
      const t = nav.some(n => n.id === tab) ? tab : "catalog";
      view = t === "catalog" ? <CatalogView store={store} /> : t === "sales" ? <SalesView store={store} /> : <LinkView store={store} pillarKey={pillar} cfg={meta} />;
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active={t} onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout}>{view}</Shell>;
    }
    if (pillar === "treasury") {
      const F = { pendingIn: (store.listDonations() || []).filter(d => !(store.isInternalDonation && store.isInternalDonation(d)) && !d.verified).length,
        due: store.listApplicants().filter(a => a.status === "accepted").reduce((a, s) => a + (s.semesters || []).filter(x => x.status === "bill-uploaded").length, 0) };
      nav = [
        { id: "overview", label: "Overview", icon: ICON.overview },
        { id: "in", label: "Money in", icon: ICON.inflow, count: F.pendingIn, hot: F.pendingIn > 0 },
        { id: "out", label: "Money out", icon: ICON.outflow, count: F.due, hot: F.due > 0 },
        { id: "ledger", label: "Ledger", icon: ICON.ledger },
        { id: "channels", label: "Payment channels", icon: ICON.pay },
      ];
      const t = nav.some(n => n.id === tab) ? tab : "overview";
      view = t === "overview" ? <TreasuryOverview store={store} go={setTab} />
        : t === "in" ? <DonationsView store={store} donations={store.listDonations()} title="Money in" />
        : t === "out" ? <MoneyOutView store={store} />
        : t === "ledger" ? <LedgerView store={store} />
        : <ChannelsView store={store} />;
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active={t} onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout} noVisibility>{view}</Shell>;
    }
    if (pillar === "site") {
      nav = [{ id: "contact", label: "Contact & social", icon: ICON.contact }, { id: "email", label: "Email", icon: ICON.send }];
      const t = nav.some(n => n.id === tab) ? tab : "contact";
      view = t === "email" ? <EmailView store={store} /> : <ContactView store={store} />;
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active={t} onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout} noVisibility>{view}</Shell>;
    }
    const cfg = PILLARS[pillar];
    if (!cfg) return null;
    nav = [
      { id: "grants", label: "Grants", icon: ICON.grant, count: store.getPillarGrants().filter(g => g.pillar === cfg.grantName && !g.archived).length },
      { id: "story", label: "Programme page", icon: ICON.story },
      { id: "link", label: cfg.linkMode === "pillar" ? "Pillar link" : "Partner button", icon: ICON.link },
    ];
    const t = nav.some(n => n.id === tab) ? tab : "grants";
    view = t === "grants" ? <GrantsView store={store} cfg={cfg} /> : t === "story" ? <ProgrammeView key={pillar} store={store} cfg={cfg} /> : <LinkView store={store} pillarKey={pillar} cfg={cfg} />;
    return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active={t} onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout}>{view}</Shell>;
  }
  FounderDesk.Home = FounderHome;
  FounderDesk.Login = FounderGate;
  return FounderDesk;
})();
