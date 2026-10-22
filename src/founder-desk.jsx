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
.fd-sec-setup{}@media (max-width:640px){.fd-sec-setup{grid-template-columns:1fr!important}}
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
.fd-check{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);cursor:pointer}
.fd-check input{accent-color:var(--accent)}
.fd-nodate{text-align:left;color:var(--faint);cursor:pointer}
.fd-pay{display:block;font-size:12px;color:var(--muted);margin-top:4px;overflow-wrap:anywhere}
.fd-pay b{font-weight:600;color:var(--text)}
.fd-sum{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:rgba(10,22,40,.35);font-size:13px;line-height:1.7;color:var(--muted)}
.fd-sum b{color:var(--text);font-weight:600}
.fd-autov{margin-top:6px;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:rgba(10,22,40,.35)}
.fd-autov small{display:block;margin-top:8px;font-size:12px;line-height:1.5;color:var(--faint)}
.fd-chain{grid-column:1/-1;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:-4px;padding:0 0 2px}
.fd-chain .fd-rc{margin:0;text-align:right}
.fd-ctrs{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:16px}
.fd-ctr{border:1px solid var(--line);border-radius:14px;background:var(--surface);padding:20px 20px 18px;min-width:0}
.fd-ctr-k{font-size:12.5px;color:var(--muted)}
.fd-ctr-row{display:flex;align-items:center;gap:10px;margin-top:12px}
.fd-ctr-b{flex:0 0 52px;height:52px;border-radius:12px;border:1px solid var(--line2);background:rgba(10,22,40,.5);color:var(--text);font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;touch-action:manipulation;user-select:none}
.fd-ctr-b:hover{border-color:var(--accent);color:var(--accent)}
.fd-ctr-b:disabled{opacity:.35;cursor:default;border-color:var(--line2);color:var(--text)}
.fd-ctr-v{flex:1;min-width:0;display:flex;align-items:baseline;justify-content:center;gap:6px;border:1px solid var(--line2);border-radius:12px;background:rgba(10,22,40,.6);padding:4px 12px;height:52px}
.fd-ctr-v:focus-within{border-color:var(--accent)}
.fd-ctr-v input{width:100%;min-width:0;background:none;border:0;outline:none;color:var(--text);text-align:right;font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;font-variant-numeric:lining-nums tabular-nums;-moz-appearance:textfield}
.fd-ctr-v input::-webkit-outer-spin-button,.fd-ctr-v input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.fd-ctr-v em{font-style:normal;font-size:13px;color:var(--faint);white-space:nowrap}
.fd-ctr-steps{display:flex;align-items:center;gap:6px;margin-top:12px;flex-wrap:wrap;font-size:12px;color:var(--faint)}
.fd-ctr-steps .fd-chip{padding:4px 11px;font-size:12.5px}
.fd-ctr small{display:block;margin-top:12px;font-size:12px;color:var(--faint);line-height:1.5}
.fd-ivz{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:8px}
.fd-ivz span{display:flex;flex-direction:column;gap:2px;padding:9px 11px;border:1px solid var(--line);border-radius:9px;background:rgba(10,22,40,.35)}
.fd-ivz small{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint)}
.fd-ivz b{font-weight:600;font-size:13px;color:var(--text);overflow-wrap:anywhere}
.fd-ivprev{margin-top:12px;padding:12px 14px;border:1px solid rgba(201,169,97,.3);border-radius:10px;background:rgba(201,169,97,.05);display:grid;gap:6px}
.fd-ivprev .fd-ivz{margin-top:2px}
.fd-ivprev small{font-size:12px;color:var(--muted)}
@media (max-width:900px){.fd-ivz{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:420px){.fd-ivz{grid-template-columns:minmax(0,1fr)}.fd-ivz span{flex-direction:row;justify-content:space-between;align-items:baseline;gap:10px}}
button.fd-mlog-i{width:calc(100% + 16px);margin:0 -8px;padding:11px 8px;background:none;border:0;border-top:1px solid var(--line);border-radius:8px;color:inherit;font:inherit;text-align:left;cursor:pointer}
button.fd-mlog-i:first-child{border-top:0}
button.fd-mlog-i:hover,button.fd-mlog-i:focus-visible{background:rgba(201,169,97,.07);outline:none}
.fd-mread-meta{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px 16px;margin:0 0 14px;font-size:13px}
.fd-mread-meta dt{color:var(--faint)}
.fd-mread-meta dd{margin:0;overflow-wrap:anywhere}
.fd-mread-note{margin:0 0 12px;padding:10px 12px;border-radius:8px;background:rgba(232,168,92,.08);border:1px solid rgba(232,168,92,.25);font-size:12.5px;color:var(--muted)}
.fd-mread-text{white-space:pre-wrap;font:13px/1.6 ui-monospace,Menlo,Consolas,monospace;background:rgba(10,22,40,.45);border:1px solid var(--line);border-radius:10px;padding:16px;max-height:560px;overflow:auto;margin:0}
.fd-mread-pdf{width:100%;height:640px;border:0;border-radius:10px;background:#fff}
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
    report: I(<><path d="M6 3.5h9l3.5 3.5v13.5H6z" /><path d="M9.5 17v-3M12.5 17v-6M15.5 17v-4.5" /></>),
    shield: I(<><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>),
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
    foodclothing: I(<><path d="M3 12h18c-.5 4.5-4 7-9 7s-8.5-2.5-9-7z" /><path d="M9 9c-1-1.5 1-2.5 0-4M12 9c-1-1.5 1-2.5 0-4M15 9c-1-1.5 1-2.5 0-4" /></>),
    water: I(<><path d="M12 3c3.5 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 2.5-6.5 6-11z" /></>),
    hospitals: I(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 8v8M8 12h8" /></>),
    schools: I(<><path d="M3 10l9-6 9 6" /><path d="M5 9.5V20h14V9.5M10 20v-5h4v5" /></>),
    livestock: I(<><path d="M6 8c-2 0-3-2-3-3 2 0 4 1 4 2M18 8c2 0 3-2 3-3-2 0-4 1-4 2" /><path d="M7 8h10l-1 7a4 4 0 0 1-8 0z" /><path d="M10 13h.01M14 13h.01" /></>),
    infra: I(<><path d="M2 18h20M4 18c2-6 14-6 16 0M8 18v-4M12 18v-5M16 18v-4" /></>),
    scholarships: I(<><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></>),
  };
  ICON.transport = I(<><path d="M3 15v-3l2.5-4.5A2 2 0 0 1 7.3 6.5h9.4a2 2 0 0 1 1.8 1L21 12v3z" /><path d="M5 12h14" /><circle cx="7.5" cy="16.5" r="2" /><circle cx="16.5" cy="16.5" r="2" /></>);
  // Foundation office consoles reuse the matching section icon in their sidebar header.
  ICON.email = ICON.contact; ICON.security = ICON.shield; ICON.impact = ICON.report;

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
    worship: { name: "Houses of Worship", grantName: "Houses of Worship", accent: "#C9A961", unit: ["mosque", "mosques"], unitLabel: "Mosques built", get: s => s.getWorship(), save: (s, v) => s.saveWorship(v), unitField: "mosques", partner: "Minang Bandung Foundation", project: "e.g. Masjid Al-Ikhlas construction", note: "the site", firstEntry: "The first mosque", linkMode: "pillar", linkHelp: "Usually the partner foundation's construction or donation page (for example, Minang Bandung's mosque project page)." },
    foodland: { name: "Reforestation & Land", grantName: "Reforestation & Land", accent: "#A8C97F", unit: ["tree", "trees"], unitLabel: "Trees planted", get: s => s.getFoodland(), save: (s, v) => s.saveFoodland(v), unitField: "trees", partner: "", project: "e.g. Trees for Life olive saplings", firstEntry: "The first five trees", linkMode: "partner", linkHelp: "Usually Zaytoun's Trees for Life page (https://zaytoun.uk/plant-a-tree/)." },
    foodclothing: { name: "Food & Clothing", grantName: "Food & Clothing", accent: "#D9A97A", unit: ["kg of food", "kg of food"], unitLabel: "Food shared (kg)", noUnits: true,
      get: s => s.getPillarContent("foodclothing"), save: (s, v) => { const cur = s.getPillarContent("foodclothing"); s.savePillarContent("foodclothing", { ...v, counts: cur.counts, countsUpdatedAt: cur.countsUpdatedAt }); },
      partner: "", project: "e.g. Ramadan 2027, Panti Asuhan Bandung", firstEntry: "The first Ramadan table", note: "the table", linkMode: "partner", linkHelp: "A partner's programme page, if you give through one. Hide the button while there is no partner." },
    water: { name: "Clean Water", grantName: "Clean Water", accent: "#7FB8C9", unit: ["well", "wells"], unitLabel: "Wells built", get: s => s.getWater(), save: (s, v) => s.saveWater(v), unitField: "trees", partner: "", project: "e.g. Village well, phase I", firstEntry: "The first well", linkMode: "partner", linkHelp: "The drilling or water partner's programme page. Hide the button while there is no active partner." },
    hospitals: { name: "Hospitals", grantName: "Hospitals", accent: "#C9847F", unit: ["clinic", "clinics"], unitLabel: "Clinics opened", get: s => s.getPillarContent("hospitals"), save: (s, v) => s.savePillarContent("hospitals", v), unitField: "units", partner: "", project: "e.g. Village clinic, phase I", firstEntry: "The first clinic", linkMode: "partner", linkHelp: "The health partner's programme page. Hide the button while there is no active partner." },
    schools: { name: "Schools", grantName: "Schools", accent: "#C9BC7F", unit: ["school", "schools"], unitLabel: "Schools raised", get: s => s.getPillarContent("schools"), save: (s, v) => s.savePillarContent("schools", v), unitField: "units", partner: "", project: "e.g. Primary school, phase I", firstEntry: "The first school", linkMode: "partner", linkHelp: "The education partner's programme page. Hide the button while there is no active partner." },
    livestock: { name: "Livestock & Enterprise", grantName: "Livestock & Enterprise", accent: "#C9A07F", unit: ["placement", "placements"], unitLabel: "Placements", get: s => s.getPillarContent("livestock"), save: (s, v) => s.savePillarContent("livestock", v), unitField: "units", partner: "", project: "e.g. Goat herd, family batch I", firstEntry: "The first herd", linkMode: "partner", linkHelp: "The enterprise partner's programme page. Hide the button while there is no active partner." },
    infra: { name: "Sustainable Infrastructure", grantName: "Sustainable Infrastructure", accent: "#9FA8B8", unit: ["work", "works"], unitLabel: "Works completed", get: s => s.getPillarContent("infra"), save: (s, v) => s.savePillarContent("infra", v), unitField: "units", partner: "", project: "e.g. Footbridge, phase I", firstEntry: "The first bridge", linkMode: "partner", linkHelp: "The works partner's programme page. Hide the button while there is no active partner." },
    library: { name: "The Library", accent: "#C98A61", linkMode: "pillar", linkHelp: "Usually your Lynk storefront (for example https://lynk.id/brial) where readers browse and buy the books." },
    scholarships: { name: "Scholarships", accent: "#C9A961" },
    transport: { name: "Transportation", accent: "#E8834A", linkMode: "partner", linkHelp: "Where the Rent with go2rent button sends visitors, usually https://www.gotworent.com/.", note: "the road",
      get: s => s.getPillarContent("transport"), save: (s, v) => s.savePillarContent("transport", v),
      facts: [["fleet", "Vehicles in service", "730+"], ["regions", "Regions", "9"], ["airports", "Airport desks", "9"], ["support", "Support", "24/7"]] },
    site: { name: "Site settings", accent: "#9FB4D9", sub: "Applies to the whole public site" },
    treasury: { name: "Treasury", accent: "#7FC9A8", sub: "Money in and out of the endowment" },
    impact: { name: "Impact Report", accent: "#E2C98E", sub: "The yearly report to the world" },
    email: { name: "Email", accent: "#9FC3E2", sub: "Letters, receipts and reminders" },
    security: { name: "Security", accent: "#C8B6F0", sub: "Two-step verification and activity" },
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
          <div className={cfg.noUnits ? "fd-grid2" : "fd-grid3"}>
            <Field label="Amount (USD)"><div className="fd-money"><input className="fd-input" inputMode="decimal" value={f.amount} onChange={e => set("amount", e.target.value)} placeholder="0" /></div></Field>
            {!cfg.noUnits && <Field label={cfg.unitLabel + " (this grant)"}><input className="fd-input" type="number" min="0" value={f.units} onChange={e => set("units", e.target.value)} placeholder="0" /></Field>}
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
        {cfg.noUnits && <p className="fd-sub" style={{ marginTop: -6, marginBottom: 16 }}>Kilograms and garments are kept on the Counts tab. A grant here records the money spent.</p>}
        <Stats items={[{ label: "Total granted", value: money(total) }, ...(cfg.noUnits ? [] : [{ label: cfg.unitLabel, value: units }]), { label: "Countries", value: nations }, { label: "Grants on record", value: all.length, sub: all.length - live.length ? `${all.length - live.length} archived` : null }]} />
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
    const save = () => { cfg.save(store, f); setSaved(JSON.stringify(f)); flash("Saved. The public page is updated."); };
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
              <Field label="Location line"><input className="fd-input" value={f.location || ""} onChange={e => set({ location: e.target.value })} placeholder="Village · District · Country" /></Field>
              <Field label="Partner line"><input className="fd-input" value={f.partnerLine || ""} onChange={e => set({ partnerLine: e.target.value })} placeholder="In partnership with …" /></Field>
            </div>
            <Field label="Introduction" hint="How the programme works, in two or three sentences."><textarea className="fd-input" value={f.intro || ""} onChange={e => set({ intro: e.target.value })} /></Field>
            {cfg.facts ? (
              <>
                <div className="fd-grid2">{cfg.facts.map(([k, label, ph]) => <Field key={k} label={label}><input className="fd-input" value={f[k] || ""} onChange={e => set({ [k]: e.target.value })} placeholder={ph} /></Field>)}</div>
                <Field label="Note under the figures" hint="Where the figures come from, and when."><input className="fd-input" value={f.factsNote || ""} onChange={e => set({ factsNote: e.target.value })} /></Field>
              </>
            ) : cfg.unitField ? (
              <Field label={cfg.unitLabel + " shown on the page"} hint={unitsFromGrants > 0 ? `The page currently shows ${unitsFromGrants}, counted from your grants. This number is only used when no grant has a count.` : "Used until a grant records a count."} style={{ maxWidth: 260 }}>
              <input className="fd-input" type="number" min="0" value={f[cfg.unitField] ?? 0} onChange={e => set({ [cfg.unitField]: Math.max(0, parseInt(e.target.value || "0", 10)) })} />
            </Field>
            ) : null}
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
  // COUNTS (Food & Clothing): kilograms of food shared, garments given, per year
  // ============================================================
  const fmtCount = n => (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 1 });
  function Counter({ label, unit, value, decimals, onCommit, hint }) {
    const [draft, setDraft] = useState(String(value));
    const [stepBy, setStepBy] = useState(1);
    const timer = useRef(0);
    const clean = v => { let n = Math.max(0, Number(String(v).replace(",", ".")) || 0); return decimals ? Math.round(n * 10) / 10 : Math.round(n); };
    useEffect(() => { setDraft(String(value)); }, [value]);
    useEffect(() => () => clearTimeout(timer.current), []);
    const commitSoon = v => { clearTimeout(timer.current); timer.current = setTimeout(() => onCommit(clean(v)), 700); };
    const bump = d => { const v = clean(clean(draft) + d); setDraft(String(v)); commitSoon(v); };
    const cur = clean(draft);
    return (
      <div className="fd-ctr">
        <div className="fd-ctr-k">{label}</div>
        <div className="fd-ctr-row">
          <button className="fd-ctr-b" aria-label={"Minus " + stepBy + " " + unit} disabled={cur <= 0} onClick={() => bump(-stepBy)}>−</button>
          <label className="fd-ctr-v"><input inputMode={decimals ? "decimal" : "numeric"} value={draft} aria-label={label}
            onChange={e => setDraft(e.target.value.replace(/[^0-9.,]/g, ""))} onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
            onBlur={() => { clearTimeout(timer.current); const v = clean(draft); setDraft(String(v)); if (v !== value) onCommit(v); }} /><em>{unit}</em></label>
          <button className="fd-ctr-b" aria-label={"Plus " + stepBy + " " + unit} onClick={() => bump(stepBy)}>+</button>
        </div>
        <div className="fd-ctr-steps">Each tap: {[1, 5, 10, 50].map(n => <button key={n} className="fd-chip" aria-pressed={stepBy === n} onClick={() => setStepBy(n)}>{n}</button>)}</div>
        {hint && <small>{hint}</small>}
      </div>
    );
  }
  function CountsView({ store }) {
    const n = store.getFoodClothingCounts();
    const thisYear = String(new Date().getFullYear());
    const years = Array.from(new Set([...n.years, thisYear])).sort().reverse();
    const [year, setYear] = useState(thisYear);
    const [m, flash] = useFlash();
    const row = n.manual[year] || { kg: 0, garments: 0 };
    const logged = n.logged[year];
    const commit = field => v => { store.setFoodClothingCount(year, field, v); flash("Saved. The public page shows the new total."); };
    const nextBack = String(Number(years[years.length - 1]) - 1);
    return (
      <>
        <Head title="Rough totals" lede="For giving you did not record one by one: a rough total per year from your notes. Tap plus or minus, or type the number. Distributions you record one by one are added on top." />
        <Stats items={[{ label: "Food shared, all years", value: fmtCount(n.kg) + " kg", sub: "rough totals and distributions" }, { label: "Garments given, all years", value: fmtCount(n.garments) }, { label: "Counting since", value: n.since || thisYear }]} />
        <div className="fd-toolbar">
          <Seg value={year} onChange={setYear} items={years.map(y => [y, y])} />
          <button className="fd-btn quiet sm" onClick={() => setYear(nextBack)}>Add {nextBack}</button>
          <div style={{ marginLeft: "auto" }}><Flash m={m} /></div>
        </div>
        <div className="fd-ctrs">
          <Counter key={year + "-kg"} label={"Food shared in " + year} unit="kg" decimals value={row.kg} onCommit={commit("kg")} hint="Rice, pasta, cooking oil and other staples, by weight. Half kilograms are fine (2.5)." />
          <Counter key={year + "-g"} label={"Clothing given in " + year} unit="garments" value={row.garments} onCommit={commit("garments")} hint="Each piece once: a shirt, a pair of trousers, a headscarf, a pair of shoes." />
        </div>
        {logged && <p className="fd-sub" style={{ marginTop: 14 }}>Also recorded under Distributions in {year}: {fmtCount(logged.kg)} kg of food and {fmtCount(logged.garments)} {logged.garments === 1 ? "garment" : "garments"} ({logged.entries} {logged.entries === 1 ? "entry" : "entries"}). Do not count those here again.</p>}
        <p className="fd-sub" style={{ marginTop: 18 }}>Each year is kept apart, so the Impact Report for {year} shows only what was given in {year}, while the public page shows the total of every year. Names and photographs of the people who receive are never asked for or shown.</p>
      </>
    );
  }

  // ============================================================
  // DISTRIBUTIONS (Food & Clothing): one entry per day of giving.
  // Every field is optional except one of money, kilograms or garments.
  // ============================================================
  const CURS = [["USD", "$"], ["IDR", "Rp"], ["TRY", "\u20BA"], ["EUR", "\u20AC"], ["SGD", "S$"]];
  const curSym = c => (CURS.find(x => x[0] === c) || ["", c + " "])[1];
  const fmtCur = (c, v) => c === "IDR" ? "Rp " + Math.round(Number(v) || 0).toLocaleString("id-ID") : curSym(c) + (Number(v) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  function useFx(store) {
    const [fx, setFx] = useState(null);
    useEffect(() => { let on = true; if (store.fxRates) store.fxRates().then(r => { if (on) setFx(r); }); return () => { on = false; }; }, []);
    return fx;
  }
  function DistributionForm({ store, initial, onSave, onClose }) {
    const fx = useFx(store);
    const [f, setF] = useState(() => initial || { project: "", partner: "", country: "", date: today(), noDate: false, cur: "USD", paid: "", kg: "", garments: "", note: "" });
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const rate = f.cur === "USD" ? 1 : fx && fx[f.cur] ? fx[f.cur] : null;
    const usd = (parseFloat(f.paid) || 0) / (rate || 1);
    const ok = (parseFloat(f.paid) > 0 && (f.cur === "USD" || rate)) || parseFloat(f.kg) > 0 || parseInt(f.garments, 10) > 0;
    const save = () => onSave({
      project: f.project.trim() || "Food & clothing", partner: f.partner, country: f.country, note: f.note,
      date: f.noDate || !f.date ? new Date().toISOString() : new Date(f.date + "T12:00:00").toISOString(), dateUnknown: !!(f.noDate || !f.date),
      amount: Math.round(usd * 100) / 100, paid: f.cur !== "USD" && parseFloat(f.paid) > 0 ? { currency: f.cur, value: parseFloat(f.paid), rate } : null,
      kg: parseFloat(f.kg) || 0, garments: parseInt(f.garments, 10) || 0,
    });
    return (
      <Modal title={initial ? "Edit distribution" : "Record a distribution"} sub="One day of giving. Fill in what you know: the money, the kilograms, the garments, or any of them." onClose={onClose}>
        <div className="fd-form">
          <Field label="What and where (optional)"><input className="fd-input" value={f.project} onChange={e => set("project", e.target.value)} placeholder="e.g. Rice for Panti Asuhan Al-Ikhlas, Bandung" autoFocus /></Field>
          <div className="fd-grid3">
            <Field label="Food (kg)"><input className="fd-input" inputMode="decimal" value={f.kg} onChange={e => set("kg", e.target.value.replace(",", "."))} placeholder="0" /></Field>
            <Field label="Clothing (pieces)"><input className="fd-input" inputMode="numeric" value={f.garments} onChange={e => set("garments", e.target.value.replace(/\D/g, ""))} placeholder="0" /></Field>
            <Field label="Date">{f.noDate ? <button type="button" className="fd-input fd-nodate" onClick={() => set("noDate", false)}>Not known · set a date</button> : <input className="fd-input" type="date" value={f.date} onChange={e => set("date", e.target.value)} />}</Field>
          </div>
          <label className="fd-check"><input type="checkbox" checked={!!f.noDate} onChange={e => set("noDate", e.target.checked)} /> I don't remember the date</label>
          <div className="fd-grid2" style={{ gridTemplateColumns: "minmax(0,1fr) 120px" }}>
            <Field label="Money spent (optional)" hint={f.cur !== "USD" && parseFloat(f.paid) > 0 ? (rate ? `About $${usd.toFixed(2)} at today's rate, 1 USD = ${fmtCur(f.cur, rate)}.` : "Getting today's rate…") : "Counts in Total granted and the public ledger."}><input className="fd-input" inputMode="decimal" value={f.paid} onChange={e => set("paid", e.target.value.replace(",", "."))} placeholder="0" /></Field>
            <Field label="Currency"><select className="fd-input" value={f.cur} onChange={e => set("cur", e.target.value)}>{CURS.map(([c]) => <option key={c} value={c}>{c}</option>)}</select></Field>
          </div>
          <div className="fd-grid2">
            <Field label="Given with (optional)"><input className="fd-input" value={f.partner} onChange={e => set("partner", e.target.value)} placeholder="Partner, if any" /></Field>
            <Field label="Country (optional)"><input className="fd-input" value={f.country} onChange={e => set("country", e.target.value)} placeholder="e.g. Indonesia" /></Field>
          </div>
          <Field label="Note (optional)"><input className="fd-input" value={f.note} onChange={e => set("note", e.target.value)} placeholder="Never the names of the people who receive" /></Field>
        </div>
        <div className="fd-actions" style={{ marginTop: 20 }}>
          <button className="fd-btn primary" disabled={!ok} onClick={() => { save(); onClose(); }}>{initial ? "Save changes" : "Record"}</button>
          <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
          {!ok && <small className="fd-sub" style={{ margin: 0 }}>Enter at least the money, the kilograms or the garments.</small>}
        </div>
      </Modal>
    );
  }
  function DistributionsView({ store, cfg }) {
    const all = store.getPillarGrants().filter(g => g.pillar === cfg.grantName).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const live = all.filter(g => !g.archived);
    const [filter, setFilter] = useState("live");
    const [edit, setEdit] = useState(null);
    const [m, flash] = useFlash();
    const n = store.getFoodClothingCounts();
    const spent = live.reduce((a, g) => a + (Number(g.amount) || 0), 0);
    const shown = filter === "live" ? live : filter === "archived" ? all.filter(g => g.archived) : all;
    const save = f => {
      if (edit && edit !== "new") { store.updatePillarGrant(edit.id, f); flash("Saved."); }
      else { store.addPillarGrant({ ...f, pillar: cfg.grantName }); flash("Recorded. The public page shows the new totals."); }
    };
    const toForm = g => ({ project: g.project === "Food & clothing" ? "" : g.project || "", partner: g.partner || "", country: g.country || "", date: g.date && !g.dateUnknown ? String(g.date).slice(0, 10) : today(), noDate: !!g.dateUnknown,
      cur: g.paid && g.paid.currency ? g.paid.currency : "USD", paid: g.paid && g.paid.currency ? String(g.paid.value || "") : g.amount ? String(g.amount) : "", kg: g.kg ? String(g.kg) : "", garments: g.garments ? String(g.garments) : "", note: g.note || "" });
    const G = "minmax(0,2fr) minmax(0,.8fr) minmax(0,.8fr) minmax(0,1fr) minmax(0,1fr) auto";
    return (
      <>
        <Head title="Distributions" lede="Each day of giving: what it cost, how much food, how many garments, and when. Every field is optional except one of money, kilograms or garments.">
          <button className="fd-btn primary" onClick={() => setEdit("new")}>Record a distribution</button>
        </Head>
        <Stats items={[{ label: "Food shared", value: fmtCount(n.kg) + " kg", sub: "with your rough totals" }, { label: "Garments given", value: fmtCount(n.garments) }, { label: "Money spent", value: money(spent) }, { label: "Distributions", value: live.length, sub: all.length - live.length ? `${all.length - live.length} archived` : null }]} />
        <div className="fd-toolbar"><Seg value={filter} onChange={setFilter} items={[["live", "Counted", live.length], ["archived", "Archived", all.length - live.length], ["all", "All", all.length]]} /><div style={{ marginLeft: "auto" }}><Flash m={m} /></div></div>
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>What and where</div><div>Food</div><div>Clothing</div><div>Spent</div><div>Date</div><div /></div>
          {shown.length === 0 ? <Empty title="Nothing recorded yet.">Record the first day of giving.</Empty> : shown.map(g => (
            <div key={g.id} className={"fd-tr" + (g.archived ? " dim" : "")} style={{ gridTemplateColumns: G }}>
              <div className="fd-td full"><b>{g.project || "Food & clothing"}</b>{(g.partner || g.country) && <small>{[g.partner, g.country].filter(Boolean).join(" · ")}</small>}{g.note && <small>{g.note}</small>}{g.archived && <Tag>Archived</Tag>}</div>
              <div className="fd-td" data-l="Food"><span className="num">{Number(g.kg) > 0 ? fmtCount(g.kg) + " kg" : "—"}</span></div>
              <div className="fd-td" data-l="Clothing"><span className="num">{Number(g.garments) > 0 ? fmtCount(g.garments) : "—"}</span></div>
              <div className="fd-td" data-l="Spent"><span className="num">{Number(g.amount) > 0 ? money(g.amount) : "—"}</span>{g.paid && g.paid.currency && <small>{fmtCur(g.paid.currency, g.paid.value)}</small>}</div>
              <div className="fd-td" data-l="Date">{g.dateUnknown ? <small>Date not known</small> : fdate(g.date)}</div>
              <div className="fd-td full"><div className="fd-actions" style={{ justifyContent: "flex-end" }}>
                <button className="fd-btn ghost sm" onClick={() => setEdit({ id: g.id, initial: toForm(g) })}>Edit</button>
                <button className="fd-btn quiet sm" onClick={() => store.updatePillarGrant(g.id, { archived: !g.archived })}>{g.archived ? "Restore" : "Archive"}</button>
                <Confirm onConfirm={() => store.deletePillarGrant(g.id)}>Delete</Confirm>
              </div></div>
            </div>
          ))}
        </div>
        <p className="fd-sub" style={{ marginTop: 12 }}>Money spent counts in the endowment's totals and the open ledger. Kilograms and garments go to the public Food & Clothing page and, by year, to the Impact Report.</p>
        {edit && <DistributionForm store={store} initial={edit === "new" ? null : edit.initial} onSave={save} onClose={() => setEdit(null)} />}
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
  // TRANSPORTATION: contributions from go2rent (enterprise income)
  // ============================================================
  function ContributionsView({ store }) {
    const list = store.listEnterpriseIncome ? store.listEnterpriseIncome("go2rent") : [];
    const [open, setOpen] = useState(false);
    const blank = () => ({ amount: "", period: "", txRef: "", note: "", date: today() });
    const [f, setF] = useState(blank);
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const total = list.reduce((a, x) => a + (Number(x.amount) || 0), 0);
    const last = list[0];
    const content = store.getPillarContent("transport");
    const hide = !!content.hideAmounts;
    const setHide = v => store.savePillarContent("transport", { ...store.getPillarContent("transport"), hideAmounts: !!v });
    const save = () => {
      store.addEnterpriseIncome({ source: "go2rent", amount: parseFloat(f.amount), period: f.period, txRef: f.txRef, note: f.note, date: new Date(f.date).toISOString() });
      setF(blank()); setOpen(false);
    };
    const G = "minmax(0,1.6fr) minmax(0,.8fr) minmax(0,1.2fr) auto";
    return (
      <>
        <Head title="Contributions" lede="Money given to the endowment from your returns in go2rent. Each contribution enters the public ledger as verified income and shows on the Transportation page."><button className="fd-btn primary" onClick={() => setOpen(true)}>Record a contribution</button></Head>
        <Stats items={[{ label: "Returned to the endowment", value: money(total), tone: total > 0 ? "ok" : "" }, { label: "Contributions", value: list.length }, { label: "Latest", value: last ? fdate(last.date) : "None yet" }]} />
        <div className="fd-card">
          <div className="fd-card-head" style={{ marginBottom: 0 }}>
            <div><h2 className="fd-h2">{hide ? "Amounts are hidden on the public page" : "Amounts are shown on the public page"}</h2><p className="fd-sub">{hide ? "The Transportation page lists each contribution by period, without the dollar figures. The open ledger still records every amount." : "The Transportation page shows the total returned to the endowment and the amount of each contribution."}</p></div>
            <Switch on={!hide} onChange={v => setHide(!v)}>{hide ? "Hidden" : "Shown"}</Switch>
          </div>
        </div>
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Period</div><div>Amount</div><div>Reference · date</div><div /></div>
          {list.length === 0 ? <Empty title="No contributions recorded yet.">When you give part of your go2rent returns to the endowment, record it here.</Empty> : list.map(x => (
            <div key={x.id} className="fd-tr" style={{ gridTemplateColumns: G }}>
              <div className="fd-td full"><b>{x.period || "Contribution"}</b>{x.note && <small>{x.note}</small>}</div>
              <div className="fd-td" data-l="Amount"><span className="num">{money(x.amount)}</span></div>
              <div className="fd-td" data-l="Reference"><span className="fd-mono">{x.txRef || "—"}</span><small>{fdate(x.date)}</small></div>
              <div className="fd-td"><Confirm onConfirm={() => store.deleteEnterpriseIncome(x.id)}>Delete</Confirm></div>
            </div>
          ))}
        </div>
        {open && (
          <Modal title="Record a contribution" sub="From your go2rent returns to the endowment" onClose={() => setOpen(false)}>
            <div className="fd-form">
              <div className="fd-grid3">
                <Field label="Amount (USD)"><div className="fd-money"><input className="fd-input" inputMode="decimal" value={f.amount} onChange={e => set("amount", e.target.value)} /></div></Field>
                <Field label="Period"><input className="fd-input" value={f.period} onChange={e => set("period", e.target.value)} placeholder="e.g. October 2026" /></Field>
                <Field label="Date given"><input className="fd-input" type="date" value={f.date} onChange={e => set("date", e.target.value)} /></Field>
              </div>
              <Field label="Transaction reference (optional)" hint="A blockchain hash or bank reference. Left empty, a reference is made for you."><input className="fd-input" value={f.txRef} onChange={e => set("txRef", e.target.value)} /></Field>
              <Field label="Note (optional)" hint="Shown on the public ledger."><input className="fd-input" value={f.note} onChange={e => set("note", e.target.value)} placeholder="e.g. Share of Q3 returns" /></Field>
            </div>
            <div className="fd-actions" style={{ marginTop: 20 }}>
              <button className="fd-btn primary" disabled={!(parseFloat(f.amount) > 0)} onClick={save}>Record contribution</button>
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

  // ---- Interview times ----
  // The founder types a time in a zone she chooses (Istanbul by default). It is stored once,
  // as an exact moment (UTC). Every reader then sees it in their own zone: the applicant's
  // portal in the phone's local time, emails in WIB, WITA, WIT and Istanbul.
  // None of these zones uses daylight saving, so fixed offsets are exact.
  const IV_ZONES = [
    { id: "Europe/Istanbul", off: 3, short: "TRT", label: "Istanbul time, TRT (UTC+3): your time" },
    { id: "Asia/Jakarta", off: 7, short: "WIB", label: "WIB, Jakarta and western Indonesia (UTC+7)" },
    { id: "Asia/Makassar", off: 8, short: "WITA", label: "WITA, Makassar and central Indonesia (UTC+8)" },
    { id: "Asia/Jayapura", off: 9, short: "WIT", label: "WIT, Jayapura and eastern Indonesia (UTC+9)" },
  ];
  const ivZone = id => IV_ZONES.find(z => z.id === id) || IV_ZONES[0];
  // "2026-10-19" + "16:00" typed in a zone → the exact moment (ISO, UTC)
  const ivToIso = (date, time, zoneId) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || ""), t = /^(\d{2}):(\d{2})$/.exec(time || "");
    if (!m || !t) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1] - ivZone(zoneId).off, +t[2]));
    return isNaN(d) ? null : d.toISOString();
  };
  // the moment → the date and time as shown in a zone
  const ivParts = (iso, zoneId) => {
    const d = new Date(new Date(iso).getTime() + ivZone(zoneId).off * 3600000);
    return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16) };
  };
  const ivIn = (iso, z) => {
    const d = new Date(iso); if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: z.id }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: z.id }) + " " + z.short;
  };
  function IvZones({ iso }) {
    return <div className="fd-ivz">{IV_ZONES.map(z => <span key={z.id}><small>{z.short === "TRT" ? "Istanbul" : z.short}</small><b>{ivIn(iso, z)}</b></span>)}</div>;
  }

  function InterviewForm({ app, store, onDone }) {
    const first = titleCase((app.name || "").split(" ")[0]);
    const [zone, setZoneS] = useState(() => { try { return localStorage.getItem("fd-iv-zone") || "Europe/Istanbul"; } catch (e) { return "Europe/Istanbul"; } });
    const start = app.interviewAt ? ivParts(app.interviewAt, zone) : { date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), time: "16:00" };
    const [date, setDate] = useState(start.date);
    const [time, setTime] = useState(start.time);
    const [link, setLink] = useState(app.meetingLink || "");
    const setZone = z => {
      // keep the same moment when the zone changes, so switching zones never moves the interview
      const iso = ivToIso(date, time, zone);
      setZoneS(z); try { localStorage.setItem("fd-iv-zone", z); } catch (e) {}
      if (iso) { const p = ivParts(iso, z); setDate(p.date); setTime(p.time); }
    };
    const iso = ivToIso(date, time, zone);
    const past = iso && new Date(iso).getTime() < Date.now();
    const same = app.interviewAt && iso && new Date(iso).getTime() === new Date(app.interviewAt).getTime() && link.trim() === (app.meetingLink || "");
    return (
      <>
        <div className="fd-grid2" style={{ marginTop: 14 }}>
          <Field label="Date"><input className="fd-input" type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
          <Field label={"Time, in " + ivZone(zone).short}><input className="fd-input" type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
        </div>
        <Field label="The time above is in" style={{ marginTop: 12 }}>
          <select className="fd-input" value={zone} onChange={e => setZone(e.target.value)}>{IV_ZONES.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}</select>
        </Field>
        {iso && (
          <div className="fd-ivprev">
            <div className="fd-stage-k">The same moment everywhere</div>
            <IvZones iso={iso} />
            <small>{first}'s portal shows it in the time of {first}'s phone, and the email lists WIB, WITA, WIT and Istanbul.</small>
            {past && <small style={{ color: "var(--rose)" }}>This time has already passed. Check the date.</small>}
          </div>
        )}
        <Field label="Meeting link" style={{ marginTop: 12 }}><input className="fd-input" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://meet.google.com/… or https://zoom.us/j/…" /></Field>
        <div className="fd-actions" style={{ marginTop: 14 }}>
          <button className="fd-btn primary" disabled={!link.trim() || !iso || same} onClick={() => { store.scheduleInterview(app.id, iso, link.trim()); onDone && onDone(); }}>{app.interviewAt ? "Save and send the new time" : "Send invitation"}</button>
          {onDone && <button className="fd-btn quiet" onClick={onDone}>Cancel</button>}
          {!link.trim() && <small className="fd-sub" style={{ margin: 0 }}>Add the meeting link first.</small>}
        </div>
      </>
    );
  }

  function StagePanel({ app, store }) {
    const [moving, setMoving] = useState(false);
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
            <p className="fd-sub">{first} gets an email with the time and the meeting link, and sees both with a join button in the portal.</p>
            <InterviewForm app={app} store={store} />
          </>
        )}
        {app.status === "interview-scheduled" && (
          <>
            <div className="fd-stage-k">Interview booked</div>
            {moving ? (
              <>
                <h3 className="fd-h3" style={{ marginTop: 4 }}>Change the time</h3>
                <p className="fd-sub">{first} gets a new email with the new time. The old time stops showing in the portal.</p>
                <InterviewForm app={app} store={store} onDone={() => setMoving(false)} />
              </>
            ) : (
              <>
                <IvZones iso={app.interviewAt} />
                <div className="fd-actions" style={{ marginTop: 10 }}>
                  {app.meetingLink && <><a className="fd-btn ghost sm" href={/^https?:\/\//i.test(app.meetingLink) ? app.meetingLink : "https://" + app.meetingLink} target="_blank" rel="noopener noreferrer">Open meeting {ICON.ext}</a><button className="fd-btn quiet sm" onClick={() => copy(app.meetingLink)}>Copy link</button></>}
                  <button className="fd-btn quiet sm" onClick={() => setMoving(true)}>Change the time or link</button>
                </div>
                <div className="fd-actions" style={{ marginTop: 14 }}><button className="fd-btn primary" onClick={() => store.markInterviewDone(app.id)}>Mark interview as done</button></div>
              </>
            )}
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
    const copyT = { suspend: ["Pause scholarship", "The scholar sees your reason. No payments are made while paused.", "e.g. GPA for semester 3 fell below 2.75, please explain before we continue."], revoke: ["End scholarship permanently", "The record is kept, but no further payments are made. Use only when reinstatement is not expected.", "e.g. Breach of the code of conduct: …"], reactivate: ["Reactivate scholarship", "The scholar can upload bills and transcripts again.", "e.g. Semester 4 GPA recovered to 3.20."] };
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
    const docs = [["Profile photo", per.showcasePhoto], ["ID card / passport", per.photoFile], ["Report card", hs.raporFile], ["Student card", u.studentCardFile]];
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
            <Row label="Email" value={app.email} /><Row label="Country" value={titleCase(app.profile?.personal?.country)} /><Row label="GPA at application" value={app.profile?.university?.currentGPA} /><Row label="Interview" value={app.interviewAt ? ivIn(app.interviewAt, IV_ZONES[0]) + " (" + ivIn(app.interviewAt, IV_ZONES[1]) + ")" : "Not booked"} />
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
              <div className="fd-td" data-l={tab === "due" ? "Sent" : "Paid"}>{fdate(tab === "due" ? r.semester.bill?.uploadedAt : r.semester.paidAt)}{tab === "due" && r.semester.bill?.dueDate && (() => { const d = Math.round((new Date(r.semester.bill.dueDate + "T00:00:00") - new Date(new Date().toDateString())) / 864e5); return <small style={{ color: d <= 5 ? (d < 0 ? "var(--rose)" : "var(--amber)") : undefined, fontWeight: d <= 5 ? 600 : 400 }}>{d < 0 ? `Deadline passed ${fdate(r.semester.bill.dueDate)}` : d === 0 ? "Due today" : `Due ${fdate(r.semester.bill.dueDate)}${d <= 5 ? ` · ${d} ${plural(d, "day", "days")}` : ""}`}</small>; })()}{tab === "paid" && r.semester.txHash && <small className="fd-mono">{r.semester.txHash}</small>}</div>
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
  // QRIS: the payload is read from the official QRIS image (BarcodeDetector, or jsQR from the CDN when
  // the browser has none), checked (CRC), and the donate page draws the code from it.
  async function readQrFromImage(file) {
    const bmp = await createImageBitmap(file);
    if ("BarcodeDetector" in window) {
      try { const r = await new window.BarcodeDetector({ formats: ["qr_code"] }).detect(bmp); if (r && r[0] && r[0].rawValue) return r[0].rawValue; } catch (e) {}
    }
    if (!window.jsQR) await new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    const x = c.getContext("2d"); x.drawImage(bmp, 0, 0, c.width, c.height);
    const r = window.jsQR(x.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
    return r ? r.data : "";
  }
  function QrisChannel({ cfg, set, store }) {
    const q = cfg.qris || {};
    const on = q.enabled !== false;
    const info = q.payload ? store.parseQris(q.payload) : null;
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const pick = async e => {
      const f = e.target.files && e.target.files[0]; e.target.value = "";
      if (!f) return;
      setBusy(true); setErr("");
      try { const v = await readQrFromImage(f); if (!v) setErr("No QR code found in that image. Try a sharper screenshot."); else set("qris", "payload", v); }
      catch (x) { setErr("Could not read the image."); }
      setBusy(false);
    };
    return (
      <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
        <div className="fd-card-head" style={{ marginBottom: 10 }}><h3 className="fd-h2">QRIS (Indonesia)</h3><Switch on={on} onChange={v => set("qris", "enabled", v)}>{on ? "Shown" : "Hidden"}</Switch></div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div className="fd-form" style={{ flex: "1 1 300px" }}>
            {info && info.ok
              ? <div className="fd-sum"><div><b>{info.merchant}</b>{info.city ? " · " + info.city : ""}</div><div>NMID <b>{info.nmid || "not found"}</b> · checksum OK{info.dynamic ? " · dynamic code" : " · static code"}</div></div>
              : <div className="fd-sum">{info ? info.error : "No QRIS yet. Upload the QRIS image from your QRIS app."}</div>}
            <div className="fd-actions">
              <span className="fd-upload"><span className="fd-btn ghost sm">{ICON.up}{busy ? "Reading…" : "Upload the QRIS image"}</span><input type="file" accept="image/*" onChange={pick} disabled={busy} aria-label="Upload the QRIS image" /></span>
              {err && <small className="fd-rc bad" style={{ margin: 0 }}>{err}</small>}
            </div>
            <Field label="Provider" hint="Shown under the code, e.g. DANA Bisnis."><input className="fd-input" value={q.provider || ""} onChange={e => set("qris", "provider", e.target.value)} /></Field>
            <Field label="QRIS code (text)" hint="Filled in from the image. Only paste here if you know what you are doing."><textarea className="fd-input fd-mono" rows={3} value={q.payload || ""} onChange={e => set("qris", "payload", e.target.value.trim())} spellCheck={false} /></Field>
          </div>
          {info && info.ok && <QR value={q.payload} />}
        </div>
      </div>
    );
  }
  function ChannelsDialog({ store, onClose }) {
    const [cfg, setCfg] = useState(() => store.getPaymentConfig());
    const set = (g, k, v) => setCfg(p => ({ ...p, [g]: { ...p[g], [k]: v } }));
    const on = g => cfg[g].enabled !== false;
    const head = (g, title) => <div className="fd-card-head" style={{ marginBottom: 10 }}><h3 className="fd-h2">{title}</h3><Switch on={on(g)} onChange={v => set(g, "enabled", v)}>{on(g) ? "Shown" : "Hidden"}</Switch></div>;
    const cardBad = cfg.card.link && !/^https?:\/\//i.test(cfg.card.link.trim());
    const qrisBad = cfg.qris && cfg.qris.payload && !store.parseQris(cfg.qris.payload).ok;
    const wireBad = !cfg.wire || cfg.wire.enabled === false ? "" : !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cfg.wire.swift || "") ? "A SWIFT code has 8 or 11 letters and numbers, e.g. JAGBIDJA." : !/^[0-9]{6,20}$/.test(cfg.wire.account || "") ? "Enter the account number, digits only." : !(cfg.wire.holder || "").trim() ? "Enter the beneficiary name." : "";
    return (
      <Modal wide title="Payment channels" sub="How donors can give on the public donate page." onClose={onClose}>
        <QrisChannel cfg={cfg} set={set} store={store} />
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("usdt", "USDT (on-chain)")}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div className="fd-form" style={{ flex: "1 1 300px" }}>
              <Field label="Wallet address"><input className="fd-input fd-mono" value={cfg.usdt.address} onChange={e => set("usdt", "address", e.target.value)} spellCheck={false} /></Field>
              <div className="fd-grid3"><Field label="Network"><input className="fd-input" value={cfg.usdt.network} onChange={e => set("usdt", "network", e.target.value)} /></Field><Field label="Asset"><input className="fd-input" value={cfg.usdt.asset} onChange={e => set("usdt", "asset", e.target.value)} /></Field><Field label="Confirmations"><input className="fd-input" type="number" min="1" value={cfg.usdt.confirmations} onChange={e => set("usdt", "confirmations", e.target.value)} /></Field></div>
              <div className="fd-autov">
                <Switch on={cfg.usdt.autoVerify !== false} onChange={v => set("usdt", "autoVerify", v)}>Verify USDT gifts automatically</Switch>
                <small>{cfg.usdt.autoVerify !== false
                  ? "Each reported hash is read from the chain. When the USDT reached this wallet with enough confirmations and the amount matches, the gift is verified and the receipt is emailed. Anything else waits for you."
                  : "Off. Every USDT gift waits for you to check it and press Verify."}</small>
              </div>
            </div>
            <QR value={cfg.usdt.address} />
          </div>
        </div>
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("bank", "Bank transfer")}
          <div className="fd-grid2"><Field label="Bank"><input className="fd-input" value={cfg.bank.bank} onChange={e => set("bank", "bank", e.target.value)} /></Field><Field label="Account number"><input className="fd-input" value={cfg.bank.account} onChange={e => set("bank", "account", e.target.value)} /></Field><Field label="Account holder"><input className="fd-input" value={cfg.bank.holder} onChange={e => set("bank", "holder", e.target.value)} /></Field><Field label="Currency label"><input className="fd-input" value={cfg.bank.currency} onChange={e => set("bank", "currency", e.target.value)} /></Field></div>
        </div>
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("wire", "International wire (USD / EUR)")}
          <p className="fd-sub" style={{ margin: "0 0 12px" }}>A SWIFT transfer from any bank abroad into a foreign currency pocket. The account number is the pocket's number, and the donor must send that pocket's currency. Show only a city as the beneficiary address, never the home address.</p>
          <div className="fd-grid2">
            <Field label="Beneficiary name" hint="Exactly as BCA has it."><input className="fd-input" value={cfg.wire.holder || ""} onChange={e => set("wire", "holder", e.target.value)} /></Field>
            <Field label="Account number"><input className="fd-input fd-mono" value={cfg.wire.account || ""} onChange={e => set("wire", "account", e.target.value.replace(/[^0-9]/g, ""))} /></Field>
            <Field label="SWIFT / BIC"><input className="fd-input fd-mono" value={cfg.wire.swift || ""} onChange={e => set("wire", "swift", e.target.value.toUpperCase().replace(/\s/g, ""))} /></Field>
            <Field label="Bank"><input className="fd-input" value={cfg.wire.bank || ""} onChange={e => set("wire", "bank", e.target.value)} /></Field>
            <Field label="Bank address"><input className="fd-input" value={cfg.wire.bankAddress || ""} onChange={e => set("wire", "bankAddress", e.target.value)} /></Field>
            <Field label="Beneficiary address" hint="City and country only."><input className="fd-input" value={cfg.wire.city || ""} onChange={e => set("wire", "city", e.target.value)} /></Field>
            <Field label="Currencies" hint="Only those you have a pocket for: USD, EUR or SGD."><input className="fd-input" value={cfg.wire.currencies || ""} onChange={e => set("wire", "currencies", e.target.value.toUpperCase())} /></Field>
            <Field label="Branch (your reference)" hint="Not shown on the site."><input className="fd-input" value={cfg.wire.branch || ""} onChange={e => set("wire", "branch", e.target.value)} /></Field>
          </div>
          {wireBad && <div className="fd-msg err" style={{ marginTop: 8 }}>{wireBad}</div>}
        </div>
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("card", "Card (Mastercard / Visa)")}
          <Field label="Checkout page" hint="The card button on the donate page opens this address in a new tab."><input className="fd-input" value={cfg.card.link} onChange={e => set("card", "link", e.target.value)} placeholder="https://lynk.id/brial/s/…" /></Field>
          {cardBad && <div className="fd-msg err" style={{ marginTop: 8 }}>Use a full address that starts with https://</div>}
          <Field label="Lynk fee (%)" hint="What Lynk keeps from each card payment. Used when you verify a card gift; the receipt shows the full gift." style={{ maxWidth: 220, marginTop: 12 }}><input className="fd-input" inputMode="decimal" value={cfg.card.feePct ?? 5} onChange={e => set("card", "feePct", e.target.value.replace(",", "."))} /></Field>
        </div>
        <div className="fd-actions" style={{ marginTop: 18 }}><button className="fd-btn primary" disabled={cardBad || qrisBad || !!wireBad} onClick={() => { store.savePaymentConfig(cfg); onClose(); }}>Save channels</button><button className="fd-btn ghost" onClick={onClose}>Cancel</button></div>
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
        <p className={"fd-rc " + line.tone} style={{ textAlign: "left", marginTop: 0 }}>{line.text}{r && r.mail && r.mail.status === "failed" && r.mail.error ? ` ${r.mail.error}` : ""}</p>
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

  // ---------------- on-chain checks (USDT) ----------------
  function useChainChecks(store, dep) {
    const [st, setSt] = useState({ loaded: false, checks: {}, config: {} });
    const alive = useRef(true);
    const load = useCallback(() => { if (!store.chainStatus) return; store.chainStatus().then(r => { if (alive.current) setSt({ loaded: true, checks: (r && r.checks) || {}, config: (r && r.config) || {} }); }).catch(() => { if (alive.current) setSt(p => ({ ...p, loaded: true })); }); }, [store]);
    useEffect(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load, dep]);
    // while a check is under way, look again every 20 seconds
    const busy = Object.values(st.checks).some(c => ["queued", "checking", "waiting", "retry"].indexOf(c.status) >= 0);
    useEffect(() => { if (!busy) return; const t = setInterval(load, 20000); return () => clearInterval(t); }, [busy, load]);
    return [st, load];
  }
  function chainLine(c, cfg) {
    if (cfg && cfg.autoVerify === false) return { text: "Automatic checks are off. Check the hash on the explorer, then verify.", tone: "", again: false };
    if (!c) return { text: "Not checked on chain yet.", tone: "", again: true };
    const on = c.network ? " on " + c.network : "";
    switch (c.status) {
      case "queued": case "checking": return { text: "Checking on chain…", tone: "warn", again: false };
      case "waiting": return { text: c.required ? `Found${on}. Waiting for confirmations: ${c.confirmations || 0} of ${c.required}.` : "Sent, waiting for the block.", tone: "warn", again: false };
      case "retry": return { text: (c.reason || "Not found yet.") + " Looking again " + (c.nextTryAt ? "at " + new Date(c.nextTryAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "soon") + ".", tone: "warn", again: true };
      case "verified": return { text: "Verified on chain.", tone: "ok", again: false };
      case "duplicate": return { text: "Needs you: " + (c.reason || "another gift claims this transaction."), tone: "bad", again: true };
      case "not_found": return { text: "Needs you: the transaction was not found on chain after two days. Ask the donor for the right hash.", tone: "bad", again: true };
      case "manual": return { text: c.reason || "Check this one by hand.", tone: "", again: false };
      case "error": return { text: "Needs you: the networks could not be reached. " + (c.reason || ""), tone: "bad", again: true };
      default: return { text: "Needs you: " + (c.reason || "the transfer did not match.") + (c.received && !/Received/.test(c.reason || "") ? ` Received ${Number(c.received).toFixed(2)} USDT${on}.` : c.network ? ` (${c.network})` : ""), tone: "bad", again: true };
    }
  }

  // ---------------- gifts paid by bank or card: confirm what arrived ----------------
  const METHOD_LABEL = { qris: "QRIS", usdt: "USDT", bank: "Bank transfer", wire: "Bank wire (SWIFT)", card: "Card via Lynk", cash: "Cash", other: "Other" };
  const payWhen = p => { if (!p || !p.paidAt) return ""; const d = new Date(p.paidAt); return isNaN(d) ? String(p.paidAt) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); };
  function VerifyGiftDialog({ store, d, onClose, onDone }) {
    const fx = useFx(store);
    const p = d.payment || {};
    const card = p.method === "card";
    const wire = p.method === "wire";
    const cur = wire ? (["EUR", "SGD"].indexOf(p.currency) >= 0 ? p.currency : "USD") : p.currency === "USD" ? "USD" : "IDR";
    const feeDefault = Number(store.getPaymentConfig().card.feePct ?? 5) || 0;
    const [paid, setPaid] = useState(String(p.paid || ""));
    const [feePct, setFeePct] = useState(String(card ? feeDefault : 0));
    const [usdTouched, setUsdTouched] = useState(false);
    const [usd, setUsd] = useState(String(d.amount || ""));
    const rate = cur === "USD" ? 1 : fx && fx[cur] ? fx[cur] : Number(p.rate) || 0;
    useEffect(() => { if (!usdTouched && rate && parseFloat(paid) > 0) setUsd(((parseFloat(paid) || 0) / rate).toFixed(2)); }, [rate, paid]);
    const fee = card ? (parseFloat(paid) || 0) * (parseFloat(feePct) || 0) / 100 : 0;
    const net = (parseFloat(paid) || 0) - fee;
    const ok = parseFloat(paid) > 0 && parseFloat(usd) > 0;
    const go = () => {
      const r = Math.round(parseFloat(usd) * 100) / 100;
      const payment = { ...p, received: parseFloat(paid), rateUsed: rate ? Math.round(rate * 10000) / 10000 : null, confirmedAt: new Date().toISOString() };
      if (card) { payment.feePct = parseFloat(feePct) || 0; payment.fee = Math.round(fee * 100) / 100; payment.net = Math.round(net * 100) / 100; payment.netUsd = Math.round((r * net / (parseFloat(paid) || 1)) * 100) / 100; }
      onDone(r, payment); onClose();
    };
    return (
      <Modal title={"Verify " + (card ? "card gift" : p.method === "qris" ? "QRIS gift" : wire ? "international wire" : "bank transfer")} sub={`${d.anonymous ? "Anonymous" : titleCase(d.name)} · reported ${fdate(d.submittedAt)}`} onClose={onClose}>
        <div className="fd-sum">
          <div>The donor reported <b>{fmtCur(cur, p.paid)}</b>{payWhen(p) && <> on <b>{payWhen(p)}</b></>}.</div>
          {p.sender && <div>{wire ? "Sender's name" : "Sender's account name"}: <b>{p.sender}</b></div>}
          {p.ref && <div>{p.method === "qris" || wire ? "Reference" : "Lynk order"}: <b>{p.ref}</b></div>}
          <div>{card ? "Find it in your Lynk dashboard" : p.method === "qris" ? "Find it under Transaksi in DANA Bisnis" : wire ? "Find it in your " + (store.getPaymentConfig().wire.bank || "bank") + " " + cur + " pocket (banks along the way may have deducted a small fee)" : "Find it in your " + (store.getPaymentConfig().bank.bank || "bank") + " statement"}, then confirm what arrived.</div>
        </div>
        <div className="fd-form" style={{ marginTop: 14 }}>
          <div className="fd-grid2">
            <Field label={card ? `Paid by the donor (${cur})` : p.method === "qris" ? "Arrived in DANA Bisnis (Rp)" : wire ? `Arrived in your ${cur} pocket` : "Arrived in your account (Rp)"}><input className="fd-input" inputMode="decimal" value={paid} onChange={e => setPaid(e.target.value.replace(",", "."))} /></Field>
            {card ? <Field label="Lynk fee (%)"><input className="fd-input" inputMode="decimal" value={feePct} onChange={e => setFeePct(e.target.value.replace(",", "."))} /></Field>
              : <Field label="Value in US dollars" hint={cur === "USD" ? "Already in US dollars." : rate ? `1 USD = ${cur === "EUR" ? "\u20AC" + rate.toFixed(4) : fmtCur(cur, rate)}${fx && fx.source === "estimate" ? " (estimate, please check)" : " today"}` : "Getting today's rate…"}><input className="fd-input" inputMode="decimal" value={usd} onChange={e => { setUsdTouched(true); setUsd(e.target.value.replace(",", ".")); }} /></Field>}
          </div>
          {card && <div className="fd-grid2">
            <Field label="Value of the gift in US dollars" hint={rate && cur !== "USD" ? `1 USD = ${fmtCur("IDR", rate)}${fx && fx.source === "estimate" ? " (estimate, please check)" : " today"}` : "The receipt shows the full gift."}><input className="fd-input" inputMode="decimal" value={usd} onChange={e => { setUsdTouched(true); setUsd(e.target.value.replace(",", ".")); }} /></Field>
            <div className="fd-sum" style={{ alignSelf: "end" }}>Lynk keeps <b>{fmtCur(cur, fee)}</b>; you receive <b>{fmtCur(cur, net)}</b>.</div>
          </div>}
        </div>
        <div className="fd-actions" style={{ marginTop: 18 }}>
          <button className="fd-btn ok" disabled={!ok} onClick={go}>{okEmail(d.email) ? "Verify and email the receipt" : "Verify"}</button>
          <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </Modal>
    );
  }
  // A gift that arrived without a form from the donor (seen in the bank, on Lynk, in the wallet, or handed over)
  function RecordGiftDialog({ store, onClose, onSaved }) {
    const fx = useFx(store);
    const [f, setF] = useState({ method: "bank", name: "", anonymous: false, email: "", country: "", date: today(), cur: "IDR", paid: "", feePct: String(store.getPaymentConfig().card.feePct ?? 5), usd: "", usdTouched: false, ref: "", message: "" });
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const rate = f.cur === "USD" || f.cur === "USDT" ? 1 : fx && fx[f.cur] ? fx[f.cur] : null;
    useEffect(() => { if (!f.usdTouched && rate && parseFloat(f.paid) > 0) set("usd", ((parseFloat(f.paid) || 0) / rate).toFixed(2)); }, [rate, f.paid, f.cur]);
    const setMethod = mth => setF(p => ({ ...p, method: mth, usdTouched: false, cur: mth === "usdt" ? "USDT" : mth === "bank" || mth === "qris" ? "IDR" : mth === "wire" ? (p.cur === "EUR" ? "EUR" : "USD") : p.cur === "USDT" ? "USD" : p.cur }));
    const card = f.method === "card";
    const fee = card ? (parseFloat(f.paid) || 0) * (parseFloat(f.feePct) || 0) / 100 : 0;
    const [busy, setBusy] = useState(false);
    const ok = parseFloat(f.paid) > 0 && parseFloat(f.usd) > 0 && !busy;
    const save = async () => {
      setBusy(true);
      const amount = Math.round(parseFloat(f.usd) * 100) / 100;
      const payment = { method: f.method, currency: f.cur, paid: parseFloat(f.paid), received: parseFloat(f.paid), rateUsed: rate || null, paidAt: f.date || "", ref: f.ref.trim(), recordedBy: "founder" };
      if (card) { payment.feePct = parseFloat(f.feePct) || 0; payment.fee = Math.round(fee * 100) / 100; payment.net = Math.round(((parseFloat(f.paid) || 0) - fee) * 100) / 100; }
      const label = METHOD_LABEL[f.method] || "Gift";
      const txHash = f.method === "usdt" && f.ref.trim() ? f.ref.trim() : [label, fmtCur(f.cur === "USDT" ? "USD" : f.cur, f.paid), f.ref.trim()].filter(Boolean).join(" · ");
      try {
        await store.recordGiftByFounder({ name: f.anonymous ? "" : f.name, anonymous: f.anonymous, email: f.email, country: f.country, amount, txHash, message: f.message, date: f.date ? f.date + "T12:00:00" : null, payment });
        onSaved(okEmail(f.email) ? `Recorded and verified. The receipt is on its way to ${f.email.trim()}.` : "Recorded and verified."); onClose();
      } catch (e) { setBusy(false); alert("Could not save: " + ((e && e.message) || e)); }
    };
    return (
      <Modal wide title="Record a gift" sub="For a gift that arrived without a form from the donor. It is verified straight away and the receipt is emailed if you add an email." onClose={onClose}>
        <div className="fd-form">
          <Field label="How it was given"><div className="fd-seg">{["qris", "bank", "wire", "card", "usdt", "cash", "other"].map(k => <button key={k} type="button" className="fd-chip" aria-pressed={f.method === k} onClick={() => setMethod(k)}>{METHOD_LABEL[k]}</button>)}</div></Field>
          <div className="fd-grid2">
            <Field label="Donor's name"><input className="fd-input" value={f.name} disabled={f.anonymous} onChange={e => set("name", e.target.value)} placeholder={f.anonymous ? "Anonymous" : "Name or organisation"} /></Field>
            <Field label="Email for the receipt (optional)"><input className="fd-input" type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder="donor@example.com" /></Field>
          </div>
          <label className="fd-check"><input type="checkbox" checked={f.anonymous} onChange={e => set("anonymous", e.target.checked)} /> Anonymous on the public ledger</label>
          <div className="fd-grid3">
            <Field label="Amount"><input className="fd-input" inputMode="decimal" value={f.paid} onChange={e => set("paid", e.target.value.replace(",", "."))} placeholder="0" /></Field>
            <Field label="Currency"><select className="fd-input" value={f.cur} onChange={e => setF(p => ({ ...p, cur: e.target.value, usdTouched: false }))}>{(f.method === "usdt" ? ["USDT"] : f.method === "wire" ? ["USD", "EUR", "SGD"] : ["IDR", "USD", "EUR", "TRY"]).map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="Value in US dollars" hint={rate && rate !== 1 ? `1 USD = ${fmtCur(f.cur, rate)}${fx && fx.source === "estimate" ? " (estimate, please check)" : " today"}` : null}><input className="fd-input" inputMode="decimal" value={f.usd} onChange={e => setF(p => ({ ...p, usd: e.target.value.replace(",", "."), usdTouched: true }))} /></Field>
          </div>
          {card && <div className="fd-grid2"><Field label="Lynk fee (%)"><input className="fd-input" inputMode="decimal" value={f.feePct} onChange={e => set("feePct", e.target.value.replace(",", "."))} /></Field><div className="fd-sum" style={{ alignSelf: "end" }}>Lynk keeps <b>{fmtCur(f.cur, fee)}</b>; the receipt shows the full gift.</div></div>}
          <div className="fd-grid3">
            <Field label="Date received"><input className="fd-input" type="date" value={f.date} onChange={e => set("date", e.target.value)} /></Field>
            <Field label={f.method === "usdt" ? "Transaction hash" : "Reference (optional)"}><input className="fd-input fd-mono" value={f.ref} onChange={e => set("ref", e.target.value)} placeholder={f.method === "card" ? "Lynk order number" : f.method === "usdt" ? "0x…" : f.method === "wire" ? "SWIFT / bank reference" : "Bank reference"} spellCheck={false} /></Field>
            <Field label="Country (optional)"><input className="fd-input" value={f.country} onChange={e => set("country", e.target.value)} /></Field>
          </div>
          <Field label="Message from the donor (optional)"><input className="fd-input" value={f.message} onChange={e => set("message", e.target.value)} /></Field>
        </div>
        <div className="fd-actions" style={{ marginTop: 18 }}>
          <button className="fd-btn primary" disabled={!ok} onClick={save}>{busy ? "Saving…" : okEmail(f.email) ? "Record and email the receipt" : "Record gift"}</button>
          <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
        </div>
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
    const isSale = d => !!(d.data && (d.data.sale || d.data.enterprise)) || /^(SALE|ENT)-/.test(String(d.id || ""));
    const verified = list.filter(d => d.verified), pending = list.filter(d => !d.verified);
    const sum = l => l.reduce((a, d) => a + (Number(d.amount) || 0), 0);
    const shown = list.filter(d => (filter === "pending" ? !d.verified : filter === "verified" ? d.verified : filter === "anonymous" ? d.anonymous : true))
      .filter(d => { const s = q.trim().toLowerCase(); return !s || [d.name, d.email, d.country, d.txHash, d.id].some(x => (x || "").toLowerCase().includes(s)); });
    const cfg = store.getPaymentConfig();
    const [rc, reloadRc] = useReceipts(store, verified.length);
    const [chain, reloadChain] = useChainChecks(store, list.map(d => d.id + (d.verified ? "v" : "")).join(","));
    const [rechecking, setRechecking] = useState({});
    const [checkGift, setCheckGift] = useState(null);
    const [addGift, setAddGift] = useState(false);
    const verifyWith = (d, amount, payment) => {
      const p = store.markDonationVerified(d.id, { amount, payment });
      vflash(okEmail(d.email) ? `Verified. The receipt is being emailed to ${d.email}.` : "Verified. There is no email on file. Download the receipt PDF if the donor asks for one.");
      Promise.resolve(p).then(() => { setTimeout(reloadRc, 1500); setTimeout(reloadRc, 8000); }).catch(() => vflash("Could not verify. Check your connection.", "err"));
    };
    const recheck = d => {
      setRechecking(p => ({ ...p, [d.id]: true }));
      store.chainRecheck(d.id).then(() => { vflash("Checking the chain again. This takes a minute or two."); setTimeout(reloadChain, 6000); setTimeout(reloadChain, 20000); })
        .catch(e => vflash(/not_a_chain_hash/.test(String(e && e.message)) ? "That reference is not an on-chain transaction hash." : "Could not start the check. Try again in a moment.", "err"))
        .finally(() => setTimeout(() => setRechecking(p => ({ ...p, [d.id]: false })), 4000));
    };
    const verify = d => {
      const p = store.markDonationVerified(d.id);
      vflash(okEmail(d.email) ? `Verified. The receipt is being emailed to ${d.email}.` : "Verified. There is no email on file. Download the receipt PDF if the donor asks for one.");
      Promise.resolve(p).then(() => { setTimeout(reloadRc, 1500); setTimeout(reloadRc, 8000); }).catch(() => vflash("Could not verify. Check your connection.", "err"));
    };
    const G = "minmax(0,1.8fr) minmax(0,.7fr) minmax(0,1.3fr) minmax(0,.8fr) auto";
    return (
      <>
        <Head title={title || "Donations"} lede={cfg.usdt.autoVerify !== false ? "Gifts reported through the donate page. USDT gifts are checked on chain and verified on their own. Bank and card gifts wait for you: open Verify, match them against your bank or Lynk, and confirm what arrived. Record a gift that came without a form." : "Gifts reported through the donate page. Check each one against your wallet or bank, then verify it. Only verified gifts are final."}>
          <button className="fd-btn primary" onClick={() => setAddGift(true)}>Record a gift</button>
          <button className="fd-btn ghost" onClick={() => setChan(true)}>Payment channels</button>
        </Head>
        <Stats items={[{ label: "Verified gifts", value: money(sum(verified)), sub: `${verified.length} ${plural(verified.length, "gift", "gifts")}`, tone: "ok" }, { label: "Waiting for verification", value: money(sum(pending)), sub: `${pending.length} reported`, tone: pending.length ? "warn" : "" }, { label: "Channels on the donate page", value: ["qris", "usdt", "bank", "card"].filter(g => cfg[g] && cfg[g].enabled !== false && (g !== "qris" || cfg.qris.payload)).length, sub: [cfg.qris && cfg.qris.enabled !== false && cfg.qris.payload && "QRIS", cfg.usdt.enabled !== false && "USDT", cfg.bank.enabled !== false && cfg.bank.bank, cfg.card.enabled !== false && "Card"].filter(Boolean).join(", ") }]} />
        <div className="fd-toolbar"><Seg value={filter} onChange={setFilter} items={[["pending", "To verify", pending.length], ["verified", "Verified", verified.length], ["anonymous", "Anonymous", list.filter(d => d.anonymous).length], ["all", "All", list.length]]} /></div>
        <div className="fd-toolbar"><Search value={q} onChange={setQ} placeholder="Search donor, email, country or reference" /></div>
        {vm && <div style={{ marginBottom: 12 }}><Flash m={vm} /></div>}
        <div className="fd-table">
          <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Donor</div><div>Amount</div><div>Reference</div><div>Date</div><div /></div>
          {shown.length === 0 ? <Empty title={filter === "pending" ? "Nothing to verify." : "No donations match."} /> : shown.map(d => {
            const eth = /^0x[0-9a-f]{10,}$/i.test(d.txHash || "");
            const onChain = /^0x[0-9a-f]{64}$/i.test((d.txHash || "").trim());
            const ch = chain.checks && chain.checks[d.id];
            const txUrl = (d.chain && d.chain.explorer) || (ch && ch.explorer) || `https://etherscan.io/tx/${d.txHash}`;
            return (
              <div key={d.id} className="fd-tr" style={{ gridTemplateColumns: G }}>
                <div className="fd-td full"><b>{d.anonymous ? "Anonymous" : d.name}{d.anonymous && d.name && d.name !== "Anonymous patron" ? <span className="fd-sub" style={{ fontWeight: 400 }}> ({d.name})</span> : null}</b><small>{[d.email, d.country].filter(Boolean).join(" · ")}</small>{d.message && <small style={{ fontStyle: "italic" }}>“{d.message}”</small>}{isSale(d) && <Tag tone="sky">Library sale</Tag>}</div>
                <div className="fd-td" data-l="Amount"><span className="num">{money(d.amount)}</span></div>
                <div className="fd-td" data-l="Reference">{d.txHash ? <>{eth ? <a className="fd-mono" href={txUrl} target="_blank" rel="noopener noreferrer">{d.txHash.slice(0, 10)}…{d.txHash.slice(-6)}</a> : <span className="fd-mono">{d.txHash}</span>}<button className="fd-btn quiet sm" onClick={() => copy(d.txHash)}>Copy</button></> : <small>—</small>}{d.payment && d.payment.method !== "usdt" && (d.payment.sender || d.payment.ref || d.payment.fee) ? <small className="fd-pay">{[d.payment.sender && "from " + d.payment.sender, d.payment.ref && (d.payment.method === "card" ? "order " : "ref ") + d.payment.ref, d.payment.fee ? `Lynk fee ${d.payment.feePct}%: ${fmtCur(d.payment.currency === "USD" ? "USD" : "IDR", d.payment.fee)}` : null].filter(Boolean).join(" · ")}</small> : null}{d.founderEntry && <small className="fd-pay">Recorded by you</small>}</div>
                <div className="fd-td" data-l="Date">{fdate(d.submittedAt)}</div>
                <div className="fd-td full">
                  <div className="fd-actions" style={{ justifyContent: "flex-end" }}>
                    {d.verified
                      ? <><Tag tone="ok" dot>{d.verifiedBy === "chain" ? "Verified on chain" : "Verified"}</Tag>{!isSale(d) && <button className="fd-btn quiet sm" onClick={() => setOpen(d.id)}>Receipt</button>}</>
                      : d.payment && (d.payment.method === "bank" || d.payment.method === "card" || d.payment.method === "qris" || d.payment.method === "wire")
                        ? <button className="fd-btn ok sm" onClick={() => setCheckGift(d.id)}>Verify…</button>
                        : <Confirm className="fd-btn ok sm" armedLabel={okEmail(d.email) ? "Confirm · email receipt" : "Confirm verify"} onConfirm={() => verify(d)}>Verify</Confirm>}
                    <Confirm onConfirm={() => store.deleteDonation(d.id)}>Delete</Confirm>
                  </div>
                  {d.verified && !isSale(d) && (() => { const l = receiptLine(d, rc[d.id]); return <small className={"fd-rc " + l.tone}>{l.text}</small>; })()}
                </div>
                {d.verified && d.verifiedBy === "chain" && d.chain && <div className="fd-chain"><small className="fd-rc ok">Received {Number(d.chain.received || d.amount).toFixed(2)} USDT on {d.chain.network}{Number(d.claimedAmount) && Math.abs(Number(d.claimedAmount) - Number(d.amount)) >= 0.01 ? ` (reported ${money(d.claimedAmount)})` : ""}</small></div>}
                {!d.verified && onChain && chain.loaded && (() => { const l = chainLine(ch, chain.config); return (
                  <div className="fd-chain"><small className={"fd-rc " + l.tone}>{l.text}</small>{l.again && <button className="fd-btn quiet sm" disabled={!!rechecking[d.id]} onClick={() => recheck(d)}>{rechecking[d.id] ? "Checking…" : "Check again"}</button>}</div>); })()}
              </div>
            );
          })}
        </div>
        <p className="fd-sub" style={{ marginTop: 12 }}>Grants to partners are listed under each pillar, not here. Verifying a gift issues its receipt number and emails the receipt to the donor.</p>
        {chan && <ChannelsDialog store={store} onClose={() => setChan(false)} />}
        {checkGift && (() => { const d = list.find(x => x.id === checkGift); return d ? <VerifyGiftDialog store={store} d={d} onClose={() => setCheckGift(null)} onDone={(amount, payment) => verifyWith(d, amount, payment)} /> : null; })()}
        {addGift && <RecordGiftDialog store={store} onClose={() => setAddGift(false)} onSaved={t => { vflash(t); setTimeout(reloadRc, 2000); setTimeout(reloadRc, 9000); }} />}
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
              {mode === "replace" && !armed ? <button className="fd-btn danger" onClick={() => setArmed(true)}>I understand · choose file</button> : <button className="fd-btn primary" disabled={busy} onClick={() => ref.current && ref.current.click()}>{busy ? "Restoring…" : "Choose backup file"}</button>}
            </div>
            {res && <div className={"fd-msg " + (res.ok ? "ok" : "err")}>{res.ok ? (res.mode === "replace" ? `Restored: ${res.count} accounts loaded.` : `Merged, ${res.updated} accounts updated or added.`) : res.error}</div>}
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
        <Head title="Accounts" lede="Every portal account. Passwords are stored as secure hashes: nobody can read them, but you can set a new one." />
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
                <div className="fd-actions"><button className="fd-btn ghost sm" onClick={() => store.restoreApplicant(a.id)}>Restore</button><Confirm onConfirm={() => store.purgeApplicant(a.id)} armedLabel="Click again · this is permanent">Delete forever</Confirm></div>
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
  const isEntD = d => !!(d.data && d.data.enterprise) || String(d.id || "").indexOf("ENT-") === 0;

  // One list of movements, built from the same records as the public totals
  function useFlows(store) {
    const donations = (store.listDonations() || []).filter(d => !(store.isInternalDonation && store.isInternalDonation(d)));
    const income = donations.map(d => ({
      id: d.id, dir: "in", date: d.submittedAt || (d.data && d.data.sale && d.data.sale.date) || null,
      category: isEntD(d) ? "Enterprise" : isSaleD(d) ? "Library sale" : "Gift",
      title: isEntD(d) ? ((d.data && d.data.enterprise && d.data.enterprise.name) || "Enterprise") + (d.data && d.data.enterprise && d.data.enterprise.period ? " · " + d.data.enterprise.period : "") : isSaleD(d) ? (d.data && d.data.sale ? d.data.sale.title : d.name) : (d.anonymous ? "Anonymous" : d.name || "Donor"),
      detail: isEntD(d) ? ["Transportation pillar", d.message].filter(Boolean).join(" · ") : isSaleD(d) ? ((d.data && d.data.sale && d.data.sale.qty > 1 ? d.data.sale.qty + " copies" : "1 copy") + (d.message ? " · " + d.message : "")) : [d.country, d.message ? "“" + d.message + "”" : ""].filter(Boolean).join(" · "),
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
    const grants = allGrants.filter(g => Number(g.amount) > 0).map(g => ({ id: g.id, dir: "out", date: g.date, category: "Grant", pillar: g.pillar, title: g.project || "Grant", detail: [g.partner, g.country].filter(Boolean).join(" · "), amount: Number(g.amount) || 0, ref: g.txRef || "", settled: !g.archived, archived: !!g.archived }));
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
          { label: "Received", value: money(F.sum(F.received)), sub: `${F.received.filter(x => x.category === "Gift").length} gifts · ${F.received.filter(x => x.category === "Library sale").length} library sales` + (F.received.some(x => x.category === "Enterprise") ? ` · ${F.received.filter(x => x.category === "Enterprise").length} enterprise` : ""), tone: "ok" },
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
        <Head title="Ledger" lede="Every settled movement: verified gifts and sales in, payments out. Unverified gifts and unpaid bills are left out until they settle.">
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
    const qi = c.qris && c.qris.payload ? store.parseQris(c.qris.payload) : null;
    const rows = [
      ["qris", "QRIS (Indonesia)", c.qris && c.qris.enabled !== false && qi && qi.ok, qi && qi.ok ? [qi.merchant, c.qris.provider].filter(Boolean).join(" · ") : "Not set", qi && qi.ok ? "NMID " + qi.nmid : ""],
      ["usdt", "USDT (on-chain)", c.usdt.enabled !== false, [c.usdt.network, c.usdt.asset].filter(Boolean).join(" · "), c.usdt.address],
      ["bank", "Bank transfer", c.bank.enabled !== false, [c.bank.bank, c.bank.currency].filter(Boolean).join(" · "), [c.bank.account, c.bank.holder].filter(Boolean).join(" · ")],
      ["wire", "International wire (USD / EUR)", c.wire && c.wire.enabled !== false, c.wire ? [c.wire.bank, "SWIFT " + c.wire.swift, c.wire.currencies].filter(Boolean).join(" · ") : "Not set", c.wire ? [c.wire.account, c.wire.holder, c.wire.city].filter(Boolean).join(" · ") : ""],
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
              {k === "usdt" && <p className="fd-sub" style={{ margin: "10px 0 0" }}>{c.usdt.autoVerify !== false ? "Checked on chain automatically. Only gifts on the network above are verified on their own; anything sent on another network waits for you." : "Automatic checks are off. Each gift waits for you."}</p>}
            </div>
          ))}
        </div>
        {open && <ChannelsDialog store={store} onClose={() => setOpen(false)} />}
      </>
    );
  }

  // ============================================================
  // IMPACT REPORT: one report a year. The numbers come from the
  // Treasury and the scholar records; the founder adds the words.
  // Numbers are frozen when the report is published.
  // ============================================================
  const SITE_URL = "https://brialendowment.org";
  const reportUrl = y => SITE_URL + "/impact/" + y;
  const normKey = s => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const isChainTx = h => /^0x[0-9a-f]{64}$/i.test(String(h || "").trim());
  const ymdOf = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toISOString().slice(0, 10); };
  const newReport = (year, founding) => ({
    id: "IR-" + year, year, founding: !!founding, status: "draft",
    title: founding ? "Founding Year " + year : "Impact Report " + year,
    intro: "", cover: "", coverCaption: "", letter: "", signName: "Brial Asif Hayi Paka", signRole: "Founder",
    stories: [], plans: "", showMoney: false, showGifts: false, createdAt: new Date().toISOString(),
  });
  const newStory = () => ({ id: "st-" + Date.now().toString(36), title: "", text: "", photo: "", caption: "", consent: false });

  function computeImpact(store, rep) {
    const F = useFlows(store);
    const from = rep.founding ? null : new Date(rep.year + "-01-01T00:00:00");
    const to = new Date(rep.year + "-12-31T23:59:59");
    const within = iso => { if (!iso) return false; const d = new Date(iso); if (isNaN(d)) return false; return (!from || d >= from) && d <= to; };
    // money in
    const gifts = F.received.filter(x => x.category === "Gift" && within(x.date));
    const sales = F.received.filter(x => x.category === "Library sale" && within(x.date));
    const enterprise = F.received.filter(x => x.category === "Enterprise" && within(x.date));
    const donors = new Set(), countries = new Map();
    gifts.forEach(x => {
      const d = x.raw || {};
      donors.add(normKey(d.email || d.name || x.id));
      const c = String(d.country || "").trim(); if (c && !countries.has(normKey(c))) countries.set(normKey(c), c);
    });
    const copies = sales.reduce((a, x) => a + (Number(x.raw && x.raw.data && x.raw.data.sale && x.raw.data.sale.qty) || 1), 0);
    // money out
    const out = F.paidOut.filter(x => (x.id === "LEGACY" ? rep.founding : within(x.date)));
    const byPillar = {};
    out.forEach(x => { const k = x.pillar || "Scholarships"; byPillar[k] = byPillar[k] || { amount: 0, count: 0 }; byPillar[k].amount += x.amount; byPillar[k].count += 1; });
    // what was built: units recorded on pillar grants (trees, wells, mosques)
    const units = {};
    store.getPillarGrants().filter(g => !g.archived && within(g.date)).forEach(g => {
      const cfg = Object.values(PILLARS).find(p => p.grantName === g.pillar);
      const n = Math.max(0, Math.round(Number(g.units) || 0));
      if (!n) return;
      units[g.pillar] = units[g.pillar] || { n: 0, unit: cfg && cfg.unit ? cfg.unit : ["unit", "units"] };
      units[g.pillar].n += n;
    });
    // Food & Clothing: counted per year (kilograms of food, garments), not per grant
    const fc = store.getFoodClothingCounts ? store.getFoodClothingCounts() : { years: [], byYear: {} };
    const fcIn = fc.years.filter(y => Number(y) <= rep.year && (rep.founding || Number(y) === Number(rep.year)));
    const fcKg = Math.round(fcIn.reduce((a, y) => a + fc.byYear[y].kg, 0) * 10) / 10, fcG = fcIn.reduce((a, y) => a + fc.byYear[y].garments, 0);
    if (fcKg > 0) units["Food & Clothing"] = { n: fcKg, unit: ["kg of food shared", "kg of food shared"] };
    if (fcG > 0) units["Food & Clothing "] = { n: fcG, unit: ["garment given", "garments given"], pillar: "Food & Clothing" };
    // people and places
    const scholars = F.scholars.filter(s => !s.deleted && (!s.acceptedAt || new Date(s.acceptedAt) <= to));
    const nations = new Map(), insts = new Set();
    const addNation = c => { c = String(c || "").trim(); if (c && !nations.has(normKey(c))) nations.set(normKey(c), c); };
    scholars.forEach(s => { addNation(s.profile?.personal?.country); const u = String(s.profile?.university?.name || "").trim(); if (u) insts.add(normKey(u)); });
    const legacy = F.legacy || {};
    const legacyScholars = rep.founding ? (legacy.scholars || []) : [];
    legacyScholars.forEach(s => { addNation(s.country); if (s.school) insts.add(normKey(s.school)); });
    const legacyCount = rep.founding ? (Number(legacy.count) || legacyScholars.length || 0) : 0;
    store.getPillarGrants().filter(g => !g.archived && within(g.date)).forEach(g => addNation(g.country));
    const semesters = F.scholars.reduce((a, s) => a + (s.semesters || []).filter(x => x.paidAt && x.bill && within(x.paidAt)).length, 0);
    const newScholars = F.scholars.filter(s => s.acceptedAt && within(s.acceptedAt)).length;
    const proofs = [
      ...gifts.filter(x => isChainTx(x.ref)).map(x => ({ kind: "Gift received", date: ymdOf(x.date), amount: x.amount, hash: x.ref.trim() })),
      ...out.filter(x => isChainTx(x.ref)).map(x => ({ kind: x.category === "Tuition" ? "Tuition paid" : x.pillar + " grant", date: ymdOf(x.date), amount: x.amount, hash: x.ref.trim() })),
    ].sort((a, b) => (a.date < b.date ? -1 : 1));
    const pillarNames = Object.keys(byPillar);
    if ((scholars.length + legacyCount) > 0 && pillarNames.indexOf("Scholarships") < 0) pillarNames.unshift("Scholarships");
    if ((fcKg > 0 || fcG > 0) && pillarNames.indexOf("Food & Clothing") < 0) pillarNames.push("Food & Clothing");
    return {
      computedAt: new Date().toISOString(),
      period: { label: rep.founding ? "From the beginning to 31 December " + rep.year : "1 January to 31 December " + rep.year, from: from ? ymdOf(from) : null, to: rep.year + "-12-31" },
      people: { scholars: scholars.length + legacyCount, newScholars, nations: nations.size, nationList: [...nations.values()], institutions: insts.size, semesters },
      pillars: pillarNames,
      built: Object.entries(units).map(([pillar, u]) => ({ pillar: u.pillar || pillar, n: u.n, label: u.n === 1 ? u.unit[0] : u.unit[1] })),
      gifts: { count: gifts.length, donors: donors.size, countries: countries.size },
      money: {
        received: F.sum(gifts), sales: F.sum(sales), copies, enterprise: F.sum(enterprise),
        given: F.sum(out), byPillar: Object.entries(byPillar).map(([pillar, v]) => ({ pillar, amount: v.amount, count: v.count })).sort((a, b) => b.amount - a.amount),
        proofs,
      },
    };
  }
  // What visitors receive: numbers the founder chose to show, nothing else.
  const publicPart = (snap, rep) => ({
    computedAt: snap.computedAt, period: snap.period, people: snap.people, pillars: snap.pillars, built: snap.built,
    gifts: rep.showGifts ? snap.gifts : null,
    money: rep.showMoney ? snap.money : null,
  });
  const reportForPublic = (rep, snap) => {
    const { snapshot, notes, ...rest } = rep;
    return { ...rest, public: publicPart(snap, rep) };
  };

  function ImpactView({ store }) {
    const all = store.getImpactReports ? store.getImpactReports() : [];
    const years = all.map(r => Number(r.year)).sort((a, b) => b - a);
    const nowYear = new Date().getFullYear();
    const [sel, setSel] = useNav("fd-impact-year", years.length ? years[0] : null);
    const saved = all.find(r => Number(r.year) === Number(sel)) || null;
    const [f, setF] = useState(saved);
    const [base, setBase] = useState(JSON.stringify(saved));
    const [busy, setBusy] = useState("");
    const [mailOpen, setMailOpen] = useState(false);
    const [m, flash] = useFlash();
    useEffect(() => { setF(saved); setBase(JSON.stringify(saved)); }, [sel, saved && saved.updatedAt]);
    const dirty = f && JSON.stringify(f) !== base;
    useEffect(() => {
      const h = e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
      window.addEventListener("beforeunload", h);
      return () => window.removeEventListener("beforeunload", h);
    }, [dirty]);

    const start = (year, founding) => {
      if (all.some(r => Number(r.year) === year)) { setSel(year); return; }
      const r = newReport(year, founding);
      store.saveImpactReports([...all, { ...r, updatedAt: r.createdAt }]).catch(() => flash("Could not save. Check your connection.", "err"));
      setSel(year);
    };
    if (!all.length || !f) {
      const first = !all.length;
      const y = first ? 2026 : Math.max(nowYear, (years[0] || nowYear) + 1);
      return (
        <>
          <Head title="Impact Report" lede="One report a year, published on the website and as a PDF. The numbers come from the Treasury and the scholar records. You add the words." />
          <div className="fd-card" style={{ maxWidth: 760 }}>
            <h2 className="fd-h2">{first ? "Start your first report" : "Choose a report"}</h2>
            <p className="fd-sub">{first ? "The founding report covers everything from the very beginning to 31 December 2026." : "Open an existing report, or start the next one."}</p>
            <div className="fd-actions" style={{ marginTop: 14 }}>
              {years.map(yy => <button key={yy} className="fd-btn ghost" onClick={() => setSel(yy)}>{yy}</button>)}
              <button className="fd-btn primary" onClick={() => start(y, first)}>{first ? "Start Founding Year 2026" : "Start the " + y + " report"}</button>
            </div>
          </div>
        </>
      );
    }

    const published = f.status === "published";
    const snap = published && f.snapshot ? f.snapshot : computeImpact(store, f);
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const setStory = (id, patch) => setF(p => ({ ...p, stories: p.stories.map(s => (s.id === id ? { ...s, ...patch } : s)) }));
    const moveStory = (i, d) => setF(p => { const n = p.stories.slice(); const j = i + d; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return { ...p, stories: n }; });
    const missingConsent = (f.stories || []).filter(s => (s.title.trim() || s.text.trim() || s.photo) && !s.consent).length;
    const commit = async (next, msg) => {
      const list = all.filter(r => Number(r.year) !== Number(next.year));
      const rec = { ...next, updatedAt: new Date().toISOString() };
      if (rec.status === "published") rec.public = publicPart(rec.snapshot, rec);
      setBusy("save");
      try { await store.saveImpactReports([...list, rec]); setF(rec); setBase(JSON.stringify(rec)); flash(msg); }
      catch (e) { flash("Could not save. Check your connection and try again.", "err"); }
      setBusy("");
    };
    const save = () => commit(f, published ? "Saved. The public report is updated." : "Draft saved.");
    const publish = () => {
      const s = computeImpact(store, f);
      commit({ ...f, status: "published", snapshot: s, publishedAt: f.publishedAt || new Date().toISOString() }, "Published. The report is live on the website.");
    };
    const unpublish = () => commit({ ...f, status: "draft", public: null, snapshot: null }, "Back to draft. The public page no longer shows this report.");
    const preview = print => {
      try { localStorage.setItem("brial-impact-preview", JSON.stringify(reportForPublic(f, snap))); } catch (e) {}
      window.open("/impact/" + f.year + "?preview=1" + (print ? "&print=1" : ""), "_blank", "noopener");
    };
    const P = snap.people, G = snap.gifts, M = snap.money;
    const donorList = (() => {
      const seen = new Map();
      (store.listDonations() || []).forEach(d => {
        if ((store.isInternalDonation && store.isInternalDonation(d)) || !d.verified || isSaleD(d) || isEntD(d)) return;
        const e = String(d.email || "").trim(); if (!okEmail(e)) return;
        const k = e.toLowerCase(); if (!seen.has(k)) seen.set(k, { email: e, name: d.anonymous ? "" : d.name || "" });
      });
      return [...seen.values()];
    })();

    return (
      <>
        <Head title="Impact Report" lede="One report a year, published on the website and as a PDF. The numbers come from the Treasury and the scholar records. You add the words.">
          {years.length > 1 && <Seg items={years.map(y => [y, String(y)])} value={Number(sel)} onChange={v => { if (dirty) flash("Save or discard your changes first.", "err"); else setSel(v); }} />}
          {!years.includes(Math.max(nowYear, years[0] + 1)) && published && <button className="fd-btn ghost sm" onClick={() => start(Math.max(nowYear, years[0] + 1), false)}>Start {Math.max(nowYear, years[0] + 1)}</button>}
        </Head>

        <div className="fd-card">
          <div className="fd-card-head">
            <div>
              <h2 className="fd-h2">{f.title || "Untitled report"}</h2>
              <p className="fd-sub">{published ? `Published ${fdate(f.publishedAt)}. Numbers frozen on ${fdate(snap.computedAt)}.` : "Draft. Only you can see it until you publish."}</p>
            </div>
            <Tag tone={published ? "ok" : "gold"} dot>{published ? "Live on the website" : "Draft"}</Tag>
          </div>
          <div className="fd-grid2" style={{ marginTop: 12 }}>
            <Field label="Title"><input className="fd-input" value={f.title} onChange={e => set("title", e.target.value)} /></Field>
            <Field label="Period" hint={published ? "Unpublish to change the period." : null}>
              <select className="fd-input" value={f.founding ? "all" : "year"} disabled={published} onChange={e => set("founding", e.target.value === "all")}>
                <option value="all">From the beginning to 31 Dec {f.year}</option>
                <option value="year">1 Jan to 31 Dec {f.year}</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="fd-card">
          <div className="fd-card-head"><div><h2 className="fd-h2">The numbers</h2><p className="fd-sub">{snap.period.label}. {published ? "Frozen when you published." : "Updated live from your records until you publish."}</p></div></div>
          <Stats items={[
            { label: "Scholars supported", value: String(P.scholars), sub: `${P.newScholars} new this period` },
            { label: "Nations", value: String(P.nations), sub: P.nationList.join(", ") || "None yet" },
            { label: "Pillars at work", value: String(snap.pillars.length), sub: snap.pillars.join(", ") || "None yet" },
            { label: "Semesters funded", value: String(P.semesters), sub: `${P.institutions} ${plural(P.institutions, "institution", "institutions")}` },
          ]} />
          {snap.built.length > 0 && <p className="fd-sub" style={{ marginTop: 10 }}>Built and planted: {snap.built.map(b => `${b.n} ${b.label} (${b.pillar})`).join(", ")}.</p>}
          <div className="fd-krow" style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <div className="fd-card-head" style={{ margin: 0 }}>
              <div><b>Show money amounts</b><p className="fd-sub" style={{ margin: "2px 0 0" }}>{f.showMoney ? `Visible: ${money(M.received)} received, ${money(M.given)} given, ${M.proofs.length} on-chain ${plural(M.proofs.length, "proof", "proofs")}.` : "Hidden. The report shows people, places and pillars, but no dollar figures and no transaction links. The amounts never leave the database."}</p></div>
              <Switch on={!!f.showMoney} onChange={v => set("showMoney", v)}>{f.showMoney ? "Shown" : "Hidden"}</Switch>
            </div>
            <div className="fd-card-head" style={{ margin: 0 }}>
              <div><b>Show the number of gifts and donors</b><p className="fd-sub" style={{ margin: "2px 0 0" }}>{f.showGifts ? `Visible: ${G.count} ${plural(G.count, "gift", "gifts")} from ${G.donors} ${plural(G.donors, "donor", "donors")}.` : "Hidden."} Donor names are never shown.</p></div>
              <Switch on={!!f.showGifts} onChange={v => set("showGifts", v)}>{f.showGifts ? "Shown" : "Hidden"}</Switch>
            </div>
          </div>
        </div>

        <div className="fd-card">
          <h2 className="fd-h2">Opening</h2>
          <p className="fd-sub">A cover photo and a few lines that set the tone for the year.</p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "12px 0", flexWrap: "wrap" }}>
            {f.cover ? <Img className="fd-cover" src={f.cover} style={{ width: 180, height: 110, objectFit: "cover" }} /> : <div className="fd-cover" style={{ width: 180, height: 110 }}>No cover</div>}
            <div className="fd-actions">
              <PhotoUpload onUploaded={meta => set("cover", meta.url || (meta.path ? window.brialSupabase.publicUrl(meta.path) : ""))}>{f.cover ? "Replace cover" : "Upload cover"}</PhotoUpload>
              {f.cover && <button className="fd-btn quiet sm" onClick={() => set("cover", "")}>Remove</button>}
            </div>
          </div>
          <div className="fd-form">
            {f.cover && <Field label="Cover caption"><input className="fd-input" value={f.coverCaption} onChange={e => set("coverCaption", e.target.value)} placeholder="Where and when the photo was taken" /></Field>}
            <Field label="Opening words" hint="Two or three sentences. Shown under the title."><textarea className="fd-input" value={f.intro} onChange={e => set("intro", e.target.value)} /></Field>
          </div>
        </div>

        <div className="fd-card">
          <h2 className="fd-h2">Letter from the founder</h2>
          <p className="fd-sub">Write to the people who made the year possible. Leave a blank line between paragraphs.</p>
          <div className="fd-form" style={{ marginTop: 12 }}>
            <textarea className="fd-input" style={{ minHeight: 220 }} value={f.letter} onChange={e => set("letter", e.target.value)} aria-label="Letter from the founder" />
            <div className="fd-grid2">
              <Field label="Signed by"><input className="fd-input" value={f.signName} onChange={e => set("signName", e.target.value)} /></Field>
              <Field label="Role"><input className="fd-input" value={f.signRole} onChange={e => set("signRole", e.target.value)} /></Field>
            </div>
          </div>
        </div>

        <div className="fd-card">
          <div className="fd-card-head">
            <div><h2 className="fd-h2">Stories of the year</h2><p className="fd-sub">A well, a grove, a first semester. Each story needs the permission of anyone it names or shows.</p></div>
            <button className="fd-btn ghost sm" onClick={() => setF(p => ({ ...p, stories: [...(p.stories || []), newStory()] }))}>Add a story</button>
          </div>
          {(f.stories || []).length === 0 && <Empty title="No stories yet.">Stories are optional, but they are what people remember.</Empty>}
          {(f.stories || []).map((s, i) => (
            <div key={s.id} className="fd-card" style={{ background: "rgba(10,22,40,.4)", marginTop: 12 }}>
              <div className="fd-form">
                <Field label={"Story " + (i + 1) + " title"}><input className="fd-input" value={s.title} onChange={e => setStory(s.id, { title: e.target.value })} placeholder="A well for the village" /></Field>
                <Field label="Story"><textarea className="fd-input" value={s.text} onChange={e => setStory(s.id, { text: e.target.value })} /></Field>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  {s.photo ? <Img className="fd-cover" src={s.photo} style={{ width: 120, height: 80, objectFit: "cover" }} /> : null}
                  <PhotoUpload onUploaded={meta => setStory(s.id, { photo: meta.url || (meta.path ? window.brialSupabase.publicUrl(meta.path) : "") })}>{s.photo ? "Replace photo" : "Add photo"}</PhotoUpload>
                  {s.photo && <button className="fd-btn quiet sm" onClick={() => setStory(s.id, { photo: "", caption: "" })}>Remove photo</button>}
                </div>
                {s.photo && <Field label="Photo caption"><input className="fd-input" value={s.caption} onChange={e => setStory(s.id, { caption: e.target.value })} /></Field>}
                <label className="fd-switch" style={{ gap: 8 }}><input type="checkbox" checked={!!s.consent} onChange={e => setStory(s.id, { consent: e.target.checked })} style={{ accentColor: "#C9A961" }} />Everyone this story names or shows has agreed to it being published.</label>
              </div>
              <div className="fd-actions" style={{ marginTop: 10 }}>
                <button className="fd-btn quiet sm" disabled={i === 0} onClick={() => moveStory(i, -1)}>Move up</button>
                <button className="fd-btn quiet sm" disabled={i === f.stories.length - 1} onClick={() => moveStory(i, 1)}>Move down</button>
                <Confirm onConfirm={() => setF(p => ({ ...p, stories: p.stories.filter(x => x.id !== s.id) }))}>Remove story</Confirm>
              </div>
            </div>
          ))}
        </div>

        <div className="fd-card">
          <h2 className="fd-h2">The year ahead</h2>
          <p className="fd-sub">What you hope to plant next.</p>
          <textarea className="fd-input" style={{ marginTop: 12 }} value={f.plans} onChange={e => set("plans", e.target.value)} aria-label="The year ahead" />
        </div>

        {published && (
          <div className="fd-card">
            <div className="fd-card-head">
              <div><h2 className="fd-h2">Share it</h2><p className="fd-sub">{reportUrl(f.year)}{f.emailedAt ? ` · Emailed to ${f.emailedCount} ${plural(f.emailedCount, "donor", "donors")} on ${fdate(f.emailedAt)}.` : ""}</p></div>
              <div className="fd-actions">
                <a className="fd-btn ghost sm" href={"/impact/" + f.year} target="_blank" rel="noopener noreferrer">Open public page {ICON.ext}</a>
                <a className="fd-btn ghost sm" href={"/impact/" + f.year + "?print=1"} target="_blank" rel="noopener noreferrer">{ICON.pdf} Download PDF</a>
                <button className="fd-btn ghost sm" onClick={() => copy(reportUrl(f.year))}>Copy link</button>
                <button className="fd-btn primary sm" disabled={!donorList.length} onClick={() => setMailOpen(true)}>Email donors</button>
              </div>
            </div>
          </div>
        )}

        <div className="fd-savebar">
          <div className="fd-sub" style={{ margin: 0 }}>{missingConsent ? `${missingConsent} ${plural(missingConsent, "story needs", "stories need")} permission before publishing.` : dirty ? "You have unsaved changes." : published ? "Everything is saved and live." : "Everything is saved."} <Flash m={m} /></div>
          <div className="fd-actions">
            {dirty && <button className="fd-btn quiet" onClick={() => setF(JSON.parse(base))}>Discard</button>}
            <button className="fd-btn ghost" onClick={() => preview(false)}>Preview</button>
            {published ? (
              <>
                <Confirm className="fd-btn quiet" armedLabel="Click again to unpublish" onConfirm={unpublish}>Unpublish</Confirm>
                <button className="fd-btn primary" disabled={!dirty || !!busy || missingConsent > 0} onClick={save}>{busy ? "Saving…" : "Save changes"}</button>
              </>
            ) : (
              <>
                <button className="fd-btn ghost" disabled={!dirty || !!busy} onClick={save}>Save draft</button>
                <Confirm className="fd-btn primary" armedLabel="Click again to publish" disabled={!!busy || missingConsent > 0 || !f.title.trim()} onConfirm={publish}>Publish</Confirm>
              </>
            )}
          </div>
        </div>
        {mailOpen && <ImpactMail store={store} rep={f} donors={donorList} onClose={() => setMailOpen(false)} onSent={n => commit({ ...f, emailedAt: new Date().toISOString(), emailedCount: (f.emailedCount || 0) + n }, `Sent to ${n} ${plural(n, "donor", "donors")}.`)} />}
      </>
    );
  }

  function ImpactMail({ store, rep, donors, onClose, onSent }) {
    const [pick, setPick] = useState(() => donors.map(d => d.email));
    const [subject, setSubject] = useState(`${rep.title}: what your gift became`);
    const [body, setBody] = useState(`Dear friend,\n\nYour gift helped make this year possible, and we would like you to see what it became. Our ${rep.title} report is now published:\n\n${reportUrl(rep.year)}\n\nThank you for trusting us with something meant to outlast us all.\n\nWith gratitude,`);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const toggle = e => setPick(p => (p.includes(e) ? p.filter(x => x !== e) : [...p, e]));
    const send = async () => {
      setBusy(true); setErr("");
      let sent = 0;
      try {
        for (let i = 0; i < pick.length; i += 20) {
          const r = await store.sendMessage({ from: "hello", to: pick.slice(i, i + 20), subject: subject.trim(), body: body.trim(), sign: true });
          sent += r && r.queued ? r.queued : Math.min(20, pick.length - i);
        }
        onSent(sent); onClose();
      } catch (e) {
        const c = String(e && (e.message || e));
        setErr((sent ? `Sent to ${sent}. ` : "") + (c.indexOf("rate_limited") >= 0 ? "The hourly email limit was reached. Send the rest in an hour." : "Could not send right now. Try again in a moment."));
        if (sent) onSent(sent);
      }
      setBusy(false);
    };
    return (
      <Modal wide title="Email the report to donors" sub="Each donor receives their own email from hello@brialendowment.org. No one sees the other addresses." onClose={onClose}>
        <div className="fd-form">
          <Field label={`Recipients (${pick.length} of ${donors.length})`}>
            <div style={{ display: "grid", gap: 6, maxHeight: 180, overflow: "auto" }}>
              {donors.map(d => <label key={d.email} className="fd-switch" style={{ gap: 8 }}><input type="checkbox" checked={pick.includes(d.email)} onChange={() => toggle(d.email)} style={{ accentColor: "#C9A961" }} />{d.email}{d.name ? " · " + d.name : ""}</label>)}
            </div>
          </Field>
          <Field label="Subject"><input className="fd-input" value={subject} onChange={e => setSubject(e.target.value)} /></Field>
          <Field label="Message" hint="Your signature is added at the end."><textarea className="fd-input" style={{ minHeight: 200 }} value={body} onChange={e => setBody(e.target.value)} /></Field>
        </div>
        {err && <div className="fd-msg err" style={{ marginTop: 12 }}>{err}</div>}
        <div className="fd-actions" style={{ marginTop: 18 }}>
          <Confirm className="fd-btn primary" armedLabel={`Confirm · send to ${pick.length} ${plural(pick.length, "donor", "donors")}`} disabled={!pick.length || !subject.trim() || !body.trim() || busy} onConfirm={send}>{busy ? "Sending…" : "Send"}</Confirm>
          <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </Modal>
    );
  }

  // ============================================================
  // SECURITY: two-step verification, recovery codes, activity log
  // ============================================================
  const ACT_TARGET = { "PILLAR-GRANTS": "Pillar grants", "PILLAR-LINKS": "Pillar links", "PILLAR-STATUS": "Pillar visibility", "PAYMENT-CONFIG": "Payment channels", "EBOOKS-CATALOG": "Library catalogue", "FOODLAND-CONTENT": "Reforestation & Land page", "PILLAR-CONTENT-FOODCLOTHING": "Food & Clothing page and counts", "WORSHIP-CONTENT": "Houses of Worship page", "WATER-CONTENT": "Clean Water page", "SITE-CONTACT": "Contact & social", "IMPACT-REPORTS": "Impact Report", "LEGACY-SUMMARY": "Founding era records" };
  const ACT_WORD = {
    "security.signed_in": "Signed in", "security.signed_out": "Signed out", "security.authenticator_added": "Turned on two-step verification",
    "security.authenticator_removed": "Turned off two-step verification", "security.recovery_codes_created": "Created new recovery codes",
    "security.recovery_code_used": "Signed in with a recovery code", "security.recovery_code_failed": "A wrong recovery code was tried", "security.authenticator_code_failed": "A wrong authenticator code was tried",
  };
  const actLabel = x => {
    if (ACT_WORD[x.action]) return ACT_WORD[x.action] + (x.action === "security.signed_in" && x.detail && x.detail.method ? (x.detail.method === "authenticator" ? " with the authenticator" : " with password") : "");
    const [table, op] = String(x.action).split(".");
    const verb = op === "insert" ? "Added" : op === "delete" ? "Deleted" : "Updated";
    const t = x.target || "";
    if (table === "applicants") return `${verb} ${x.detail && x.detail.status ? "the status of " : ""}applicant ${x.detail && x.detail.name ? titleCase(x.detail.name) : t}`;
    if (table === "reports") return `${verb} a help desk message`;
    if (table === "donations") return ACT_TARGET[t] ? `${verb} ${ACT_TARGET[t]}` : String(t).indexOf("PILLAR-CONTENT-") === 0 ? `${verb} a programme page` : `${verb} gift ${t}`;
    return `${verb} ${t}`;
  };
  const actDetail = x => {
    const d = x.detail || {};
    const parts = [];
    if (d.status) parts.push(`status ${d.status.from || "none"} to ${d.status.to || "none"}`);
    if (Array.isArray(d.fields) && d.fields.length) parts.push("changed: " + d.fields.slice(0, 6).join(", ") + (d.fields.length > 6 ? ` and ${d.fields.length - 6} more` : ""));
    if (typeof d.remaining === "number") parts.push(`${d.remaining} recovery ${plural(d.remaining, "code", "codes")} left`);
    if (d.ip) parts.push(`from IP ${d.ip}`);
    return parts.join(" · ");
  };

  function RecoveryCodes({ codes, onDone }) {
    const [saved, setSaved] = useState(false);
    const text = "The Brial Endowment · Founder Console recovery codes\nEach code works once. Keep them somewhere safe, away from your phone.\n\n" + codes.join("\n") + "\n";
    const download = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
      a.download = "brial-founder-recovery-codes.txt";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };
    return (
      <div className="fd-card" style={{ borderColor: "rgba(226,201,142,.5)" }}>
        <h2 className="fd-h2">Your recovery codes</h2>
        <p className="fd-sub">If your phone is lost, each of these codes lets you sign in once. They are shown only now. Save them in Google Password Manager or print them, and keep them away from your phone.</p>
        <div className="fd-mono" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px 18px", margin: "16px 0", fontSize: 16, letterSpacing: ".06em" }}>
          {codes.map(c => <span key={c}>{c}</span>)}
        </div>
        <div className="fd-actions">
          <button className="fd-btn ghost sm" onClick={() => copy(codes.join("\n"))}>Copy all</button>
          <button className="fd-btn ghost sm" onClick={download}>Download as a text file</button>
        </div>
        <label className="fd-switch" style={{ gap: 8, marginTop: 16 }}><input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} style={{ accentColor: "#C9A961" }} />I have saved these codes somewhere safe.</label>
        <div className="fd-actions" style={{ marginTop: 14 }}><button className="fd-btn primary" disabled={!saved} onClick={onDone}>Done</button></div>
      </div>
    );
  }

  function SecurityView({ store }) {
    const [sec, setSec] = useState(null);
    const [log, setLog] = useState(null);
    const [setup, setSetup] = useState(null); // { factorId, qr, secret }
    const [code, setCode] = useState("");
    const [codes, setCodes] = useState(null);
    const [busy, setBusy] = useState("");
    const [err, setErr] = useState("");
    const [m, flash] = useFlash();
    const recovered = (() => { try { return sessionStorage.getItem("fd-recovered") === "1"; } catch (e) { return false; } })();
    const load = async () => {
      try { setSec(await store.founderSecurity()); } catch (e) { setSec({ error: true }); }
      try { setLog(await store.founderActivity(150)); } catch (e) { setLog([]); }
    };
    useEffect(() => { load(); }, []);
    const begin = async () => {
      setBusy("start"); setErr("");
      try { setSetup(await store.startFounderEnroll()); setCode(""); }
      catch (e) { setErr("Could not start the set-up: " + (e.message || e)); }
      setBusy("");
    };
    const finish = async () => {
      setBusy("verify"); setErr("");
      const r = await store.finishFounderEnroll(setup.factorId, code);
      if (r.error) { setErr(r.error); setBusy(""); return; }
      try { setCodes(await store.newFounderRecoveryCodes()); setSetup(null); try { sessionStorage.removeItem("fd-recovered"); } catch (x) {} }
      catch (e) { setErr("Two-step verification is on, but the recovery codes could not be created. Press New recovery codes below."); setSetup(null); }
      setBusy(""); load();
    };
    const regenerate = async () => {
      setBusy("codes"); setErr("");
      try { setCodes(await store.newFounderRecoveryCodes()); } catch (e) { setErr("Could not create new codes. Try again in a moment."); }
      setBusy(""); load();
    };
    const turnOff = async () => {
      setBusy("off"); setErr("");
      try { await store.removeFounderAuthenticator(); flash("Two-step verification is off."); }
      catch (e) { setErr("Could not turn it off: " + (e.message || e)); }
      setBusy(""); load();
    };
    const on = sec && sec.mfa;
    return (
      <>
        <Head title="Security" lede="Two-step verification for the Founder Console, recovery codes for emergencies, and a record of every change." />
        {recovered && !on && <div className="fd-attn"><div className="fd-attn-i"><span className="fd-dot warn" /><div><b>You signed in with a recovery code</b><small>Your old authenticator was removed. Set up Google Authenticator again below.</small></div></div></div>}
        {sec && sec.failedCodes7d > 0 && <div className="fd-attn"><div className="fd-attn-i"><span className="fd-dot warn" /><div><b>{sec.failedCodes7d} wrong {plural(sec.failedCodes7d, "code was", "codes were")} tried in the last 7 days</b><small>If that was not you, someone may know your password. Change it now. The details are in Activity below.</small></div></div></div>}
        {codes ? <RecoveryCodes codes={codes} onDone={() => { setCodes(null); flash("Recovery codes saved."); }} /> : (
          <div className="fd-card">
            <div className="fd-card-head">
              <div>
                <h2 className="fd-h2">Two-step verification</h2>
                <p className="fd-sub">{sec == null ? "Checking…" : on ? "On. Signing in on a new device needs your password and the 6-digit code from Google Authenticator. This device stays signed in until you sign out." : "Off. Anyone with your password can open the console. Turn it on to require the code from Google Authenticator as well."}</p>
              </div>
              {sec != null && <Tag tone={on ? "ok" : "warn"} dot>{on ? "On" : "Off"}</Tag>}
            </div>
            {!on && !setup && sec != null && <div className="fd-actions" style={{ marginTop: 12 }}><button className="fd-btn primary" disabled={!!busy} onClick={begin}>{busy === "start" ? "Preparing…" : "Turn on with Google Authenticator"}</button></div>}
            {setup && (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 220px) minmax(0, 1fr)", gap: 22, marginTop: 16, alignItems: "start" }} className="fd-sec-setup">
                <div style={{ background: "#fff", padding: 10, borderRadius: 10, width: 220, maxWidth: "100%" }}><img src={setup.qr} alt="QR code for Google Authenticator" style={{ width: "100%", display: "block" }} /></div>
                <div className="fd-form">
                  <p className="fd-sub" style={{ margin: 0 }}><b style={{ color: "var(--text)" }}>1.</b> In Google Authenticator, tap <b style={{ color: "var(--text)" }}>+</b> and <b style={{ color: "var(--text)" }}>Scan a QR code</b>, then scan this code.</p>
                  <p className="fd-sub" style={{ margin: 0 }}>Can't scan? Choose <b style={{ color: "var(--text)" }}>Enter a setup key</b> and type: <span className="fd-mono" style={{ color: "var(--text)", wordBreak: "break-all" }}>{setup.secret}</span> <button className="fd-btn quiet sm" onClick={() => copy(setup.secret)}>Copy</button></p>
                  <Field label="2. Type the 6-digit code the app shows"><input className="fd-input" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" style={{ letterSpacing: ".35em", fontSize: 18, maxWidth: 200 }} /></Field>
                  <div className="fd-actions">
                    <button className="fd-btn primary" disabled={code.length !== 6 || !!busy} onClick={finish}>{busy === "verify" ? "Checking…" : "Verify and turn on"}</button>
                    <button className="fd-btn ghost" disabled={!!busy} onClick={() => { setSetup(null); setErr(""); }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
            {on && (
              <>
                <div className="fd-krow" style={{ marginTop: 14 }}>
                  <div><b>Recovery codes</b><small>{sec.recoveryLeft} of 10 left{sec.recoveryCreatedAt ? `, created ${fdate(sec.recoveryCreatedAt)}` : ""}. Each code lets you in once if your phone is lost.</small></div>
                  <button className="fd-btn ghost sm" disabled={!!busy} onClick={regenerate}>{busy === "codes" ? "Creating…" : "New recovery codes"}</button>
                </div>
                {sec.recoveryLeft < 3 && <div className="fd-msg err" style={{ marginTop: 10 }}>Only {sec.recoveryLeft} recovery {plural(sec.recoveryLeft, "code is", "codes are")} left. Create new ones now.</div>}
                <div className="fd-krow">
                  <div><b>Turn off two-step verification</b><small>Only if you are moving to a new phone. Turn it on again straight after.</small></div>
                  <Confirm className="fd-btn danger sm" armedLabel="Click again to turn off" disabled={!!busy} onConfirm={turnOff}>Turn off</Confirm>
                </div>
              </>
            )}
            {err && <div className="fd-msg err" style={{ marginTop: 12 }}>{err}</div>}
            <Flash m={m} />
          </div>
        )}
        <div className="fd-card">
          <div className="fd-card-head">
            <div><h2 className="fd-h2">Activity</h2><p className="fd-sub">Every change made from the Founder Console, and every sign in. Only the names of changed fields are kept, never their contents.</p></div>
            <button className="fd-btn quiet sm" onClick={load}>Refresh</button>
          </div>
          {log == null ? <p className="fd-sub">Loading…</p> : log.length === 0 ? <Empty title="Nothing recorded yet.">Changes appear here from now on.</Empty> : (
            <div className="fd-mlog">{log.map(x => (
              <div className="fd-mlog-i" key={x.id}>
                <b>{actLabel(x)}</b>
                <span />
                <small>{[fdatetime(x.at), x.by].filter(Boolean).join(" · ")}</small>
                <span />
                {actDetail(x) && <small style={{ gridColumn: "1 / -1", color: "var(--faint)" }}>{actDetail(x)}</small>}
              </div>
            ))}</div>
          )}
        </div>
      </>
    );
  }

  // ============================================================
  // FOUNDER HOME — the chooser, in two swipeable groups
  // ============================================================
  const GROUPS = [
    { id: "pillars", label: "Pillars", title: "Which pillar are you managing?", lede: "Each pillar of the endowment has its own console. Choose one to begin.", only: ["scholarships", "worship", "library", "foodland", "foodclothing", "water", "hospitals", "schools", "livestock", "infra", "transport"] },
    { id: "office", label: "Foundation office", title: "Run the foundation.", lede: "The money, the yearly report, the email, security, the website and the records: the work that serves every pillar.", only: ["treasury", "impact", "email", "security", "site", "backup"] },
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
.fg-scene{position:absolute;inset:0;overflow:hidden;animation:fgIn 2.4s cubic-bezier(.2,.7,.2,1) both}
.fg-scene.narrow{bottom:auto;height:auto;aspect-ratio:820/732}
@keyframes fgIn{from{opacity:0;filter:brightness(.4)}to{opacity:1;filter:none}}
.fg-exit{position:absolute;top:20px;left:20px;z-index:5;display:inline-flex;align-items:center;gap:8px;background:rgba(6,14,28,.35);border:1px solid rgba(191,216,255,.22);color:rgba(239,233,220,.8);padding:8px 14px;border-radius:999px;font:500 13px 'Manrope',sans-serif;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.fg-exit:hover{color:#fff;border-color:rgba(226,201,142,.6)}
.fg-snd{left:auto;right:20px}
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
  .fg-verse{position:relative;top:auto;left:auto;transform:none;margin:0 auto;padding:0 20px 18px;animation:fgFade 2s .6s both}
  .fg-card{position:relative;left:auto;bottom:auto;transform:none;margin:0 auto 36px;animation:fgFade 1.4s .8s both}
  .fg-flow{position:relative;z-index:3;padding-top:var(--fg-top,58vw)}
}
@keyframes fgFade{from{opacity:0}to{opacity:1}}
@media (min-aspect-ratio:9/10) and (max-height:860px){.fg-card{padding-top:32px;bottom:max(1.5vh,10px)}.fg-mark{display:none}.fg-h{font-size:27px;margin-bottom:12px}.fg-in input{padding:8px 12px}.fg-f{margin-bottom:8px}.fg-btn{padding:10px 0}.fg-verse{top:clamp(52px,7vh,80px)}}
@media (prefers-reduced-motion:reduce){.fg-scene,.fg-card,.fg-verse{animation:none}}
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
  // ---- The gate, painted on canvas (a Cologne-style cathedral behind a Baroque palace,
  // a French formal garden, a carved Gothic portal and two angels). See paintGateScene.

  const TAU = Math.PI * 2;
  const rng = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const W0 = 1200, H0 = 900, HOR = 494;
  // ground plane: gx in pixels at the front edge, d = distance (1 = bottom of the picture)
  const P = (gx, d) => [600 + gx / d, HOR + (H0 - HOR) / d];
  const rgba = (r, g, b, a) => `rgba(${r},${g},${b},${a})`;
  const RIM = "rgba(214,232,255,";
  let CULL = [-1e9, 1e9]; // the part of the world on screen; trees outside it are skipped
  const GOLD = "#F2D99B";

  function layer(w, h) { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function glow(ctx, color, blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
  function noGlow(ctx) { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; }
  function blob(ctx, x, y, rx, ry, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, color.replace("A", a)); g.addColorStop(1, color.replace("A", 0));
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / Math.max(rx, ry)); ctx.translate(-x, -y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, Math.max(rx, ry), 0, TAU); ctx.fill(); ctx.restore();
  }

  // ------------------------------------------------------------------ sky
  function paintSky(ctx, r) {
    const g = ctx.createLinearGradient(0, 0, 0, H0);
    g.addColorStop(0, "#030914"); g.addColorStop(.32, "#071430"); g.addColorStop(.5, "#0E2449"); g.addColorStop(.55, "#1A3A6C"); g.addColorStop(.62, "#122B54"); g.addColorStop(1, "#081630");
    ctx.fillStyle = g; ctx.fillRect(-1200, -300, 3600, 1500);
    // the milky way: a faint diagonal river of light
    ctx.save(); ctx.translate(600, 160); ctx.rotate(-.32);
    for (let i = 0; i < 70; i++) blob(ctx, (r() - .5) * 2400, (r() - .5) * 90, 60 + r() * 160, 18 + r() * 40, "rgba(150,180,240,A)", .025 + r() * .03);
    for (let i = 0; i < 900; i++) { ctx.fillStyle = rgba(210, 225, 255, (.15 + r() * .45).toFixed(2)); const s = r() * .9 + .2; ctx.fillRect((r() - .5) * 2600, (r() - .5) * 120 * (r() + .2), s, s); }
    ctx.restore();
    // high thin clouds catching the light of the gate
    for (let i = 0; i < 26; i++) blob(ctx, -300 + r() * 1800, 230 + r() * 210, 120 + r() * 260, 10 + r() * 22, "rgba(120,160,230,A)", .035 + r() * .04);
    // stars
    for (let i = 0; i < 520; i++) {
      const x = -900 + r() * 3000, y = r() * 470 * Math.pow(r(), .35), s = .25 + Math.pow(r(), 3) * 1.4;
      ctx.fillStyle = rgba(220, 232, 255, (.25 + r() * .6).toFixed(2)); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    }
  }

  // ------------------------------------------------------------------ cathedral and palace
  function crockets(ctx, x1, y1, x2, y2, n, side, s) {
    for (let i = 1; i < n; i++) {
      const t = i / n, x = lerp(x1, x2, t), y = lerp(y1, y2, t);
      ctx.beginPath(); ctx.arc(x + side * s * .6, y, s * (1 - t * .4), 0, TAU); ctx.fill();
    }
  }
  function pinnacle(ctx, x, yBase, w, h, lit) {
    ctx.beginPath(); ctx.moveTo(x - w / 2, yBase); ctx.lineTo(x, yBase - h); ctx.lineTo(x + w / 2, yBase); ctx.closePath(); ctx.fill();
    crockets(ctx, x - w / 2, yBase, x, yBase - h, 4, -1, w * .18); crockets(ctx, x + w / 2, yBase, x, yBase - h, 4, 1, w * .18);
    if (lit) { ctx.save(); ctx.strokeStyle = RIM + ".5)"; ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(x - w / 2, yBase); ctx.lineTo(x, yBase - h); ctx.lineTo(x + w / 2, yBase); ctx.stroke(); ctx.restore(); }
  }
  function lancet(ctx, x, y, w, h) { // a pointed window, top at y
    ctx.beginPath(); ctx.moveTo(x - w / 2, y + h); ctx.lineTo(x - w / 2, y + w * .6);
    ctx.quadraticCurveTo(x - w / 2, y, x, y - w * .15); ctx.quadraticCurveTo(x + w / 2, y, x + w / 2, y + w * .6); ctx.lineTo(x + w / 2, y + h); ctx.closePath();
  }
  function paintCathedral(ctx, r, windows) {
    const stone = ctx.createLinearGradient(0, 330, 0, 505);
    stone.addColorStop(0, "#1B3766"); stone.addColorStop(.6, "#10264B"); stone.addColorStop(1, "#0B1B37");
    const win = (x, y, w, h, k) => { windows.push({ x, y: y + h * .5, w, h, k }); ctx.save(); glow(ctx, "rgba(242,217,155,.8)", 4); ctx.fillStyle = `rgba(242,${200 + (k * 30 | 0)},${130 + (k * 40 | 0)},${.55 + k * .4})`; lancet(ctx, x, y, w, h); ctx.fill(); ctx.restore();
      ctx.strokeStyle = "rgba(10,25,50,.85)"; ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(x, y + w * .2); ctx.lineTo(x, y + h); ctx.stroke(); };
    // the nave and the crossing tower behind the facade
    ctx.fillStyle = "#0E2246";
    ctx.beginPath(); ctx.moveTo(532, 500); ctx.lineTo(532, 452); ctx.lineTo(600, 430); ctx.lineTo(668, 452); ctx.lineTo(668, 500); ctx.fill();
    // flying buttresses, both sides
    ctx.strokeStyle = "#0E2246"; ctx.lineWidth = 2.2;
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const x0 = 600 + s * (64 + i * 9), x1 = 600 + s * (44 + i * 5);
      ctx.beginPath(); ctx.moveTo(x0, 500 - 22); ctx.quadraticCurveTo(lerp(x0, x1, .4), 456 - i * 2, x1, 452 - i); ctx.stroke();
      ctx.fillStyle = "#10264B"; ctx.fillRect(x0 - 2, 476, 4, 24); pinnacle(ctx, x0, 476, 4, 12, true);
    }
    // west facade: two towers with a gable between
    const towers = [574, 626];
    ctx.fillStyle = stone;
    towers.forEach(cx => {
      ctx.fillRect(cx - 15, 410, 30, 92);
      for (const s of [-1, 1]) { ctx.fillRect(cx + s * 15 - (s > 0 ? 3 : 0), 418, 3, 84); pinnacle(ctx, cx + s * 14, 418, 4, 14, true); }
      // octagon with tall openings
      ctx.fillRect(cx - 10, 378, 20, 34);
      for (const s of [-1, 1]) pinnacle(ctx, cx + s * 11, 386, 4, 18, true);
      // openwork spire
      ctx.beginPath(); ctx.moveTo(cx - 10, 380); ctx.lineTo(cx, 330); ctx.lineTo(cx + 10, 380); ctx.closePath(); ctx.fill();
      crockets(ctx, cx - 10, 380, cx, 332, 9, -1, 1.1); crockets(ctx, cx + 10, 380, cx, 332, 9, 1, 1.1);
      ctx.save(); ctx.strokeStyle = "rgba(160,195,250,.35)"; ctx.lineWidth = .35;
      for (let k = 1; k < 9; k++) { const y = 380 - k * 5.5, hw = 10 * (1 - k / 9.2); ctx.beginPath(); ctx.moveTo(cx - hw, y); ctx.lineTo(cx + hw, y); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx, 330); ctx.lineTo(cx, 380); ctx.stroke(); ctx.restore();
      // finial with a cross flower
      ctx.save(); glow(ctx, "rgba(242,217,155,.9)", 6); ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx, 328, 1.3, 0, TAU); ctx.fill(); ctx.fillRect(cx - .3, 322, .6, 6); ctx.fillRect(cx - 1.8, 324.4, 3.6, .6); ctx.restore();
      // windows: two storeys of tall lancets and the octagon lights
      for (const s of [-1, 1]) { win(cx + s * 6, 436, 5, 18, r()); win(cx + s * 6, 462, 5, 16, r() * .6); }
      for (const s of [-1, 1]) win(cx + s * 4.5, 384, 3.4, 18, .8 + r() * .2);
    });
    // central bay: portal, great window, gable
    ctx.fillStyle = stone; ctx.fillRect(589, 420, 22, 82);
    ctx.beginPath(); ctx.moveTo(588, 424); ctx.lineTo(600, 398); ctx.lineTo(612, 424); ctx.closePath(); ctx.fill();
    crockets(ctx, 588, 424, 600, 399, 5, -1, 1); crockets(ctx, 612, 424, 600, 399, 5, 1, 1);
    win(600, 428, 13, 34, 1);
    ctx.save(); ctx.strokeStyle = "rgba(10,25,50,.8)"; ctx.lineWidth = .45; ctx.beginPath(); ctx.arc(600, 436, 3.6, 0, TAU); ctx.moveTo(596.5, 444); ctx.lineTo(596.5, 462); ctx.moveTo(603.5, 444); ctx.lineTo(603.5, 462); ctx.stroke(); ctx.restore();
    ctx.save(); glow(ctx, "rgba(242,217,155,.7)", 8); ctx.fillStyle = "rgba(242,206,140,.55)"; lancet(ctx, 600, 478, 12, 24); ctx.fill(); ctx.restore();
    // backlit rims on the whole silhouette
    ctx.save(); ctx.strokeStyle = RIM + ".55)"; ctx.lineWidth = .5; glow(ctx, "rgba(160,200,255,.8)", 3);
    towers.forEach(cx => { ctx.beginPath(); ctx.moveTo(cx - 15, 500); ctx.lineTo(cx - 15, 410); ctx.lineTo(cx - 10, 410); ctx.lineTo(cx - 10, 380); ctx.lineTo(cx, 330); ctx.lineTo(cx + 10, 380); ctx.lineTo(cx + 10, 410); ctx.lineTo(cx + 15, 410); ctx.lineTo(cx + 15, 500); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(589, 420); ctx.lineTo(600, 398); ctx.lineTo(611, 420); ctx.stroke();
    ctx.restore();
  }
  function paintPalace(ctx, r, windows) {
    const wall = ctx.createLinearGradient(0, 470, 0, 506);
    wall.addColorStop(0, "#1C3A6A"); wall.addColorStop(1, "#0C1D3B");
    const roof = "#0B1A35";
    const block = (x0, x1, top, base) => {
      ctx.fillStyle = wall; ctx.fillRect(x0, top, x1 - x0, base - top);
      // mansard roof with dormers
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x0 - 1, top); ctx.lineTo(x0 + 3, top - 6); ctx.lineTo(x1 - 3, top - 6); ctx.lineTo(x1 + 1, top); ctx.fill();
      for (let x = x0 + 5; x < x1 - 3; x += 7) { ctx.fillStyle = "#132C56"; ctx.fillRect(x - 1, top - 5, 2, 3); }
      // balustrade with statues
      ctx.fillStyle = "#132C56"; ctx.fillRect(x0, top - .8, x1 - x0, .8);
      for (let x = x0 + 3; x < x1; x += 11) { ctx.fillRect(x - .4, top - 9.5, .8, 3.5); ctx.beginPath(); ctx.arc(x, top - 10.2, .6, 0, TAU); ctx.fill(); }
      // two storeys of windows
      for (let x = x0 + 3; x < x1 - 1; x += 4.4) for (const [y, h] of [[top + 3, 6], [top + 12, 7]]) {
        const lit = r(); const k = lit < .25 ? 0 : lit;
        windows.push({ x, y: y + h / 2, w: 1.6, h, k });
        if (k) { ctx.save(); glow(ctx, "rgba(242,217,155,.7)", 3); ctx.fillStyle = `rgba(242,${205 + (k * 25 | 0)},${140 + (k * 40 | 0)},${.35 + k * .55})`; ctx.fillRect(x - .8, y, 1.6, h); ctx.restore(); }
        else { ctx.fillStyle = "rgba(8,18,36,.9)"; ctx.fillRect(x - .8, y, 1.6, h); }
      }
      ctx.strokeStyle = RIM + ".35)"; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0, top); ctx.lineTo(x1, top); ctx.lineTo(x1, base); ctx.stroke();
    };
    for (const s of [-1, 1]) {
      const a = s < 0 ? [436, 532] : [668, 764];
      block(a[0], a[1], 480, 505);
      // corner pavilions with domes
      const px = s < 0 ? 440 : 760;
      block(px - 10, px + 10, 474, 505);
      ctx.fillStyle = "#132C56"; ctx.beginPath(); ctx.ellipse(px, 467, 7, 8, 0, Math.PI, 0); ctx.fill();
      ctx.save(); ctx.strokeStyle = "rgba(242,217,155,.5)"; ctx.lineWidth = .4; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(px, 467, Math.abs(k) * 2.6 + .1, 8, 0, Math.PI, 0); ctx.stroke(); } ctx.restore();
      ctx.fillStyle = GOLD; ctx.fillRect(px - .3, 455, .6, 4); ctx.beginPath(); ctx.arc(px, 455, .9, 0, TAU); ctx.fill();
    }
    // the cour d'honneur: low central range with an arcade and a gilded gate
    block(540, 660, 487, 506);
    ctx.save(); glow(ctx, "rgba(242,217,155,.9)", 6); ctx.fillStyle = "rgba(242,215,150,.75)";
    for (let x = 586; x <= 614; x += 7) { ctx.beginPath(); ctx.moveTo(x - 2, 506); ctx.lineTo(x - 2, 498); ctx.arc(x, 498, 2, Math.PI, 0); ctx.lineTo(x + 2, 506); ctx.fill(); }
    ctx.restore();
  }
  function paintCastle(ctx, x, y, s, r, windows) { // a small hilltop castle (far)
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = "#10264A";
    ctx.fillRect(-14, -14, 28, 14); ctx.fillRect(-8, -26, 9, 14); ctx.fillRect(4, -20, 6, 8);
    [[-11, -14, 3, 22], [-4, -26, 3, 30], [7, -20, 2.6, 24], [13, -14, 2.4, 20]].forEach(([tx, ty, w, h]) => { ctx.fillRect(tx - w / 2, ty - h * .35, w, h * .35); ctx.beginPath(); ctx.moveTo(tx - w / 2 - .6, ty - h * .35); ctx.lineTo(tx, ty - h * .8); ctx.lineTo(tx + w / 2 + .6, ty - h * .35); ctx.fill(); });
    ctx.restore();
    for (let i = 0; i < 6; i++) { const wx = x + (r() - .5) * 22 * s, wy = y - (4 + r() * 18) * s; windows.push({ x: wx, y: wy, w: .9 * s, h: 1.6 * s, k: .7 }); ctx.save(); glow(ctx, "rgba(242,217,155,.9)", 3); ctx.fillStyle = "rgba(242,215,150,.8)"; ctx.fillRect(wx - .45 * s, wy - .8 * s, .9 * s, 1.6 * s); ctx.restore(); }
  }

  // ------------------------------------------------------------------ the garden
  function tree(ctx, r, x, y, h, kind) { // foliage built from many lit tufts
    if (x + h < CULL[0] || x - h > CULL[1]) return;
    const w = kind === "cyp" ? h * .2 : kind === "cone" ? h * .42 : h * .62;
    if (kind === "cone") { // a clipped yew cone with tiers
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, "#0A1C3A"); g.addColorStop(.55, "#1A3A6E"); g.addColorStop(1, "#2C5596");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * .3, y - h * .55, x, y - h); ctx.quadraticCurveTo(x + w * .3, y - h * .55, x + w / 2, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(10,25,50,.5)"; ctx.lineWidth = Math.max(.3, h * .012);
      for (let k = 1; k < 4; k++) { const ty = y - h * k / 4, tw = w / 2 * (1 - k / 4.4); ctx.beginPath(); ctx.ellipse(x, ty, tw, tw * .18, 0, 0, Math.PI); ctx.stroke(); }
      ctx.strokeStyle = RIM + ".55)"; ctx.lineWidth = Math.max(.35, h * .01); ctx.beginPath(); ctx.moveTo(x, y - h); ctx.quadraticCurveTo(x + w * .3, y - h * .55, x + w / 2, y); ctx.stroke();
      return;
    }
    // trunk for broad trees
    if (kind === "round") { ctx.fillStyle = "#0A1A36"; ctx.fillRect(x - w * .04, y - h * .32, w * .08, h * .32); }
    const toward = Math.sign(600 - x) || 1;
    if (kind === "cyp") {
      const sp = new Path2D(`M${x - w * .5} ${y} C${x - w * .62} ${y - h * .45} ${x - w * .3} ${y - h * .85} ${x} ${y - h} C${x + w * .3} ${y - h * .85} ${x + w * .62} ${y - h * .45} ${x + w * .5} ${y} Z`);
      const g = ctx.createLinearGradient(x - w * toward, 0, x + w * toward, 0); g.addColorStop(0, "#081833"); g.addColorStop(.6, "#173868"); g.addColorStop(1, "#2B5594");
      ctx.fillStyle = g; ctx.fill(sp);
      ctx.save(); ctx.clip(sp);
      const n = clamp(Math.round(h * 1.4), 10, 160);
      for (let i = 0; i < n; i++) { const ty = y - r() * h, tx = x + (r() - .5) * w * 1.1, l = clamp(.3 + (tx - x) * toward / w * .8 + (r() - .5) * .3, 0, 1);
        ctx.fillStyle = `rgba(${10 + l * 50 | 0},${26 + l * 80 | 0},${56 + l * 130 | 0},.7)`; ctx.beginPath(); ctx.ellipse(tx, ty, w * .16, w * .07, (r() - .5) * .8, 0, TAU); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = RIM + ".3)"; ctx.lineWidth = Math.max(.3, h * .006); ctx.beginPath(); ctx.moveTo(x, y - h); ctx.bezierCurveTo(x + toward * w * .3, y - h * .85, x + toward * w * .62, y - h * .45, x + toward * w * .5, y); ctx.stroke();
      return;
    }
    const cy = y - h * .6, ry = h * .4, rx = w / 2;
    const nc = kind === "cyp" ? 7 : clamp(Math.round(h / 6), 5, 16), per = clamp(Math.round(h * .9), 6, 40);
    const leaf = Math.max(.35, (kind === "cyp" ? w * .09 : w * .055));
    const clumps = [];
    for (let i = 0; i < nc; i++) {
      const t = kind === "cyp" ? i / (nc - 1) : r();
      const a = r() * TAU, rr = kind === "cyp" ? .35 * r() : Math.sqrt(r()) * .78;
      clumps.push(kind === "cyp" ? [x + (r() - .5) * rx * .7, cy + ry * .85 - t * ry * 1.8, rx * (1 - t * .55) * .75] : [x + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr, Math.min(rx, ry) * (.35 + r() * .25)]);
    }
    clumps.sort((p, q) => (p[0] - x) * toward - (q[0] - x) * toward);
    clumps.forEach(([cx0, cy0, cr]) => {
      // each clump: shadowed underside, lit crown toward the light
      const L = clamp(.25 + ((cx0 - x) * toward) / (rx + 1) * .25 + (cy - cy0) / (ry + 1) * .2, 0, .8);
      for (let j = 0; j < per; j++) {
        const a = r() * TAU, rr = Math.sqrt(r()) * cr, tx = cx0 + Math.cos(a) * rr, ty = cy0 + Math.sin(a) * rr * .85;
        const l = clamp(L + ((tx - cx0) * toward + (cy0 - ty)) / (cr * 2 + 1) * .5, 0, 1);
        ctx.fillStyle = `rgb(${8 + l * 40 | 0},${22 + l * 72 | 0},${48 + l * 122 | 0})`;
        ctx.beginPath(); ctx.ellipse(tx, ty, leaf * (.8 + r() * .8), leaf * (.55 + r() * .5), r() * 3, 0, TAU); ctx.fill();
      }
    });
  }
  function statue(ctx, x, y, h) { // a classical figure on a plinth
    const s = h / 60;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = "#16315E"; ctx.fillRect(-7, -16, 14, 16); ctx.fillRect(-8.5, -18, 17, 2.4);
    ctx.fillStyle = "#1E4176";
    ctx.beginPath(); ctx.moveTo(-5, -18); ctx.bezierCurveTo(-6, -32, -4, -44, -3, -50); ctx.lineTo(3, -50); ctx.bezierCurveTo(4, -42, 6, -30, 5, -18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -54, 3.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(2, -48); ctx.quadraticCurveTo(9, -54, 10, -62); ctx.lineTo(11.4, -61.6); ctx.quadraticCurveTo(11, -52, 3.6, -45); ctx.fill();
    ctx.strokeStyle = RIM + ".55)"; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(5, -18); ctx.bezierCurveTo(6, -30, 4, -42, 3, -50); ctx.arc(0, -54, 3.4, .9, -1.4, true); ctx.stroke();
    ctx.restore();
  }
  function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
  function quad(gx0, gx1, d0, d1) { return [P(gx0, d0), P(gx1, d0), P(gx1, d1), P(gx0, d1)]; }
  function curveOnBed(ctx, bed, pts) { // pts in bed space u,v in [0,1]
    ctx.beginPath();
    pts.forEach((p, i) => { const gx = lerp(bed.gx0, bed.gx1, p[0]); const d = 1 / lerp(1 / bed.d0, 1 / bed.d1, p[1]); const q = P(gx, d); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    ctx.stroke();
  }
  function scroll(cx, cy, r0, turns, dir, steps) { const out = []; for (let i = 0; i <= steps; i++) { const t = i / steps, a = dir * t * turns * TAU, rr = r0 * (1 - t * .85); out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 1.6]); } return out; }

  function paintGarden(ctx, r, fx) {
    // ground with haze toward the horizon
    const g = ctx.createLinearGradient(0, HOR, 0, H0);
    g.addColorStop(0, "#21477F"); g.addColorStop(.06, "#173866"); g.addColorStop(.3, "#0F284D"); g.addColorStop(1, "#081831");
    ctx.fillStyle = g; ctx.fillRect(-1200, HOR, 3600, H0 - HOR + 10);
    // lawn: fine mowing texture and a sheen toward the light
    for (let i = 0; i < 2600; i++) { const d = 1 + Math.pow(r(), 1.5) * 40, gx = (r() - .5) * 5000, p = P(gx, d); ctx.fillStyle = `rgba(${r() < .5 ? "120,165,235" : "2,10,26"},${(.05 + r() * .05).toFixed(3)})`; ctx.fillRect(p[0], p[1], (6 + r() * 30) / d, Math.max(.4, 1.2 / d)); }
    const sheen = ctx.createRadialGradient(600, HOR + 30, 0, 600, HOR + 30, 700); sheen.addColorStop(0, "rgba(140,180,245,.22)"); sheen.addColorStop(1, "rgba(140,180,245,0)");
    ctx.fillStyle = sheen; ctx.fillRect(-1200, HOR, 3600, H0 - HOR + 10);
    // far hills, layered and hazed
    [[HOR - 26, "#1E3F72", .9, 40, 1], [HOR - 12, "#18355F", 1, 24, 2]].forEach(([y0, col, al, amp, sd]) => {
      ctx.fillStyle = col; ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(-1200, HOR + 10);
      for (let x = -1200; x <= 2400; x += 20) { const d = Math.abs(x - 600), lift = d < 230 ? (230 - d) / 230 * amp * .9 : 0; ctx.lineTo(x, y0 + lift + Math.sin(x * .004 * sd + sd) * amp * .35 + Math.sin(x * .011 + sd * 2) * amp * .15); }
      ctx.lineTo(2400, HOR + 10); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    });
    // far woods on the hills
    for (let i = 0; i < 900; i++) {
      const x = -1200 + r() * 3600; if (Math.abs(x - 600) < 200) continue;
      const h = 4 + r() * 10 + Math.min(14, Math.abs(x - 600) * .01);
      const l = .12 + r() * .22;
      ctx.fillStyle = `rgb(${12 + l * 30 | 0},${28 + l * 50 | 0},${58 + l * 80 | 0})`;
      ctx.beginPath(); ctx.ellipse(x, HOR + 6 - h * .5 - r() * 6, h * .5, h * .6, 0, 0, TAU); ctx.fill();
    }
    // haze where the land meets the sky
    const hz = ctx.createLinearGradient(0, HOR - 40, 0, HOR + 40); hz.addColorStop(0, "rgba(120,160,230,0)"); hz.addColorStop(.5, "rgba(120,160,230,.22)"); hz.addColorStop(1, "rgba(120,160,230,0)");
    ctx.fillStyle = hz; ctx.fillRect(-1200, HOR - 40, 3600, 80);
    // gravel walks
    ctx.fillStyle = "rgba(120,160,225,.16)"; poly(ctx, [P(-125, 1), P(125, 1), P(125, 60), P(-125, 60)]); ctx.fill();
    ctx.fillStyle = "rgba(120,160,225,.08)"; poly(ctx, [P(-760, 1), P(-720, 1), P(-720, 60), P(-760, 60)]); ctx.fill(); poly(ctx, [P(720, 1), P(760, 1), P(760, 60), P(720, 60)]); ctx.fill();
    // cross walks
    [[2.75, 2.95], [4.5, 4.85], [7.6, 8.1], [13, 14]].forEach(([a, b]) => { ctx.fillStyle = "rgba(120,160,225,.12)"; poly(ctx, quad(-900, 900, a, b)); ctx.fill(); });
    // parterres de broderie
    const beds = [];
    [[1.55, 2.75], [2.95, 4.5], [4.85, 7.6], [8.1, 13], [14, 26]].forEach(([d0, d1]) => { beds.push({ gx0: -700, gx1: -140, d0, d1 }, { gx0: 140, gx1: 700, d0, d1 }); });
    beds.forEach(b => {
      const lawn = ctx.createLinearGradient(0, P(0, b.d1)[1], 0, P(0, b.d0)[1]);
      lawn.addColorStop(0, "#163A6B"); lawn.addColorStop(1, "#0F2C55");
      ctx.fillStyle = lawn; poly(ctx, quad(b.gx0, b.gx1, b.d0, b.d1)); ctx.fill();
      ctx.lineCap = "round";
      const lw = 3.2 / ((b.d0 + b.d1) / 2);
      // box hedge border
      ctx.strokeStyle = "rgba(10,26,52,.9)"; ctx.lineWidth = lw * 2.2; poly(ctx, quad(b.gx0 + 6, b.gx1 - 6, b.d0 * 1.01, b.d1 * .99)); ctx.stroke();
      ctx.strokeStyle = "rgba(120,170,240,.35)"; ctx.lineWidth = lw * .9; poly(ctx, quad(b.gx0 + 6, b.gx1 - 6, b.d0 * 1.01, b.d1 * .99)); ctx.stroke();
      // embroidery: mirrored scrolls and a central palmette
      const draw = (pts, light) => { ctx.strokeStyle = "rgba(8,20,42,.85)"; ctx.lineWidth = lw * 1.8; curveOnBed(ctx, b, pts); ctx.strokeStyle = light; ctx.lineWidth = lw * .8; curveOnBed(ctx, b, pts); };
      const L = "rgba(150,195,255,.42)";
      for (const m of [0, 1]) {
        const f = p => [m ? 1 - p[0] : p[0], p[1]];
        draw(scroll(.27, .5, .16, 1.15, 1, 40).map(f), L);
        draw(scroll(.12, .22, .07, 1, -1, 24).map(f), L); draw(scroll(.12, .78, .07, 1, 1, 24).map(f), L);
        draw([[.05, .5], [.2, .2], [.42, .12], [.5, .3]].map(f), L);
        draw([[.05, .5], [.2, .8], [.42, .88], [.5, .7]].map(f), L);
      }
      draw([[.5, .12], [.44, .5], [.5, .88], [.56, .5], [.5, .12]], "rgba(242,217,155,.35)");
      // roses along the bed edge near the walk
      const near = b.gx0 > 0 ? b.gx0 + 12 : b.gx1 - 12;
      for (let k = 0; k < 26; k++) { const d = lerp(b.d0, b.d1, r()); const p = P(near + (r() - .5) * 18, d); const rr = (1.2 + r() * 2.2) / d; const c = r() < .45 ? "242,217,155" : r() < .75 ? "243,198,214" : "207,227,255"; ctx.fillStyle = `rgba(${c},${.6 + r() * .35})`; ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, TAU); ctx.fill(); }
    });
    // the canal: stone coping and water that mirrors the palace lights
    const c0 = P(-18, 1), c1 = P(18, 1), c2 = P(18, 60), c3 = P(-18, 60);
    ctx.fillStyle = "#1A3B6E"; poly(ctx, [P(-24, 1), P(24, 1), P(24, 60), P(-24, 60)]); ctx.fill();
    const wg = ctx.createLinearGradient(0, HOR, 0, H0);
    wg.addColorStop(0, "#C8DCFF"); wg.addColorStop(.12, "#6F9BE0"); wg.addColorStop(.5, "#2D5698"); wg.addColorStop(1, "#173A70");
    ctx.fillStyle = wg; poly(ctx, [c0, c1, c2, c3]); ctx.fill();
    ctx.save(); poly(ctx, [c0, c1, c2, c3]); ctx.clip();
    for (let i = 0; i < 120; i++) { const d = 1.1 + Math.pow(r(), 2) * 50, p = P((r() - .5) * 30, d); ctx.fillStyle = `rgba(242,217,155,${(.1 + r() * .35) / Math.sqrt(d)})`; ctx.fillRect(p[0] - 6 / d, p[1], 12 / d, Math.max(.4, 1.2 / d)); }
    ctx.restore();
    ctx.strokeStyle = RIM + ".55)"; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(...P(-18, 1)); ctx.lineTo(...P(-18, 60)); ctx.moveTo(...P(18, 1)); ctx.lineTo(...P(18, 60)); ctx.stroke();
    fx.canal = [c0, c1, c2, c3];
    // fountain basins on the canal
    fx.fountains = [];
    [3.6, 6.6, 12, 22].forEach(d => {
      const [x, y] = P(0, d), rx = 70 / d, ry = rx * (P(0, d * 1.06)[1] - y) / rx * 3.2;
      const ryy = Math.max(1.2, (P(0, d - 70 / d / 30)[1] - P(0, d + 70 / d / 30)[1]) * 6 || rx * .22);
      const rY = Math.max(1, rx * (408 / (d * d)) / (1 / d) * .012 + rx * .18);
      ctx.fillStyle = "#1A3B6E"; ctx.beginPath(); ctx.ellipse(x, y, rx * 1.12, rY * 1.12, 0, 0, TAU); ctx.fill();
      const bw = ctx.createRadialGradient(x, y, 0, x, y, rx); bw.addColorStop(0, "#BFD8FF"); bw.addColorStop(1, "#3D6AB0");
      ctx.fillStyle = bw; ctx.beginPath(); ctx.ellipse(x, y, rx, rY, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = RIM + ".7)"; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(x, y, rx * 1.12, rY * 1.12, 0, Math.PI, TAU); ctx.stroke();
      // a tazza in the middle
      const s = 30 / d;
      ctx.fillStyle = "#1E4176"; ctx.fillRect(x - s * .12, y - s * .9, s * .24, s * .9); ctx.beginPath(); ctx.ellipse(x, y - s * .9, s * .5, s * .12, 0, 0, Math.PI); ctx.fill();
      fx.fountains.push({ x, y: y - s * .95, s, rx, rY, by: y });
      void ry; void ryy;
    });
    // avenues: topiary cones and statues along the walks, tree walls beyond
    fx.lamps = [];
    const obj = [];
    [1.45, 1.9, 2.5, 3.3, 4.3, 5.6, 7.2, 9.4, 12.5, 16.5, 22, 30, 42].forEach((d, i) => {
      for (const s of [-1, 1]) {
        obj.push({ d, f: () => { const [x, y] = P(s * 132, d); if (i % 2) statue(ctx, x, y, 66 / d); else tree(ctx, r, x, y, 92 / d, "cone"); } });
        const [lx, ly] = P(s * 112, d * 1.08), lh = 70 / (d * 1.08);
        obj.push({ d: d * 1.08, f: () => { ctx.strokeStyle = "#16315E"; ctx.lineWidth = Math.max(.4, 3 / d); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly - lh); ctx.stroke(); } });
        fx.lamps.push({ x: lx, y: ly - lh, r: 5 / d, d });
        if (d > 2.9) obj.push({ d: d * 1.02, f: () => { const [x, y] = P(s * 760, d); tree(ctx, r, x, y, 300 / d, "round"); } });
        if (d > 2.9) obj.push({ d: d * 1.04, f: () => { const [x, y] = P(s * 860, d); tree(ctx, r, x, y, 380 / d, "cyp"); } });
      }
    });
    // tree walls (bosquets) beyond the parterres, and woods further out
    for (let d = 3.1; d < 46; d *= 1.07) for (const s of [-1, 1]) {
      const dd = d * (1 + (r() - .5) * .04);
      obj.push({ d: dd, f: () => { const [x, y] = P(s * (1000 + r() * 60), dd); tree(ctx, r, x, y, (330 + r() * 60) / dd, "round"); } });
    }
    for (let i = 0; i < 150; i++) { const s = r() < .5 ? -1 : 1, d = 2.4 + Math.pow(r(), 1.6) * 40, gx = s * (1150 + r() * 2600); obj.push({ d, f: () => { const [x, y] = P(gx, d); tree(ctx, r, x, y, (300 + r() * 260) / d, r() < .3 ? "cyp" : "round"); } }); }
    obj.sort((a, b) => b.d - a.d).forEach(o => o.f());
    // low mist over the garden
    for (let i = 0; i < 60; i++) { const d = 1.5 + r() * 30, p = P((r() - .5) * 3000, d); blob(ctx, p[0], p[1] - 4 / d, 260 / d + 30, 26 / d + 4, "rgba(170,200,255,A)", .05 + r() * .05); }
  }

  // ------------------------------------------------------------------ the terrace
  function paintTerrace(ctx, r) {
    const dB = 1.42, yB = P(0, dB)[1];
    // paving in perspective
    const pv = ctx.createLinearGradient(0, yB, 0, H0); pv.addColorStop(0, "#1A3766"); pv.addColorStop(1, "#0C1E3E");
    ctx.fillStyle = pv; ctx.fillRect(-1200, yB, 3600, H0 - yB + 10);
    ctx.strokeStyle = "rgba(4,12,30,.5)"; ctx.lineWidth = .8;
    for (let d = 1; d < dB; d += .07) { const y = P(0, d)[1]; ctx.beginPath(); ctx.moveTo(-1200, y); ctx.lineTo(2400, y); ctx.stroke(); }
    for (let gx = -3000; gx <= 3000; gx += 60) { ctx.beginPath(); ctx.moveTo(...P(gx, 1)); ctx.lineTo(...P(gx, dB)); ctx.stroke(); }
    for (let i = 0; i < 500; i++) { const d = 1 + r() * (dB - 1), p = P((r() - .5) * 4200, d); ctx.fillStyle = `rgba(${r() < .5 ? "140,180,240" : "0,8,24"},${(r() * .06).toFixed(3)})`; ctx.fillRect(p[0], p[1], 60 / d, 4 / d); }
    // moonlight pooling on the stones
    const sh = ctx.createRadialGradient(600, H0, 0, 600, H0, 700); sh.addColorStop(0, "rgba(150,190,250,.18)"); sh.addColorStop(1, "rgba(150,190,250,0)"); ctx.fillStyle = sh; ctx.fillRect(-1200, yB, 3600, H0 - yB);
    // the balustrade
    const hB = 50, top = yB - hB;
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -1200 : 760, x1 = s < 0 ? 440 : 2400;
      ctx.fillStyle = "#132C56"; ctx.fillRect(x0, yB - 9, x1 - x0, 9);            // plinth
      ctx.fillStyle = "#1A3A6C"; ctx.fillRect(x0, top, x1 - x0, 7);                // rail
      ctx.strokeStyle = RIM + ".55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, top + .5); ctx.lineTo(x1, top + .5); ctx.stroke();
      for (let x = x0 + 6; x < x1 - 4; x += 11) {                                   // vase-shaped balusters
        const g = ctx.createLinearGradient(x - 4, 0, x + 4, 0); g.addColorStop(0, "#0E2246"); g.addColorStop(s < 0 ? .7 : .3, "#2A4F8C"); g.addColorStop(1, "#0E2246");
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(x - 2.2, top + 7); ctx.lineTo(x + 2.2, top + 7); ctx.bezierCurveTo(x + 2, top + 14, x + 5, top + 22, x + 4.5, top + 30); ctx.bezierCurveTo(x + 4, top + 36, x + 2.4, top + 38, x + 3.2, yB - 9);
        ctx.lineTo(x - 3.2, yB - 9); ctx.bezierCurveTo(x - 2.4, top + 38, x - 4, top + 36, x - 4.5, top + 30); ctx.bezierCurveTo(x - 5, top + 22, x - 2, top + 14, x - 2.2, top + 7); ctx.fill();
      }
      // pedestals with urns of flowers
      for (let x = (s < 0 ? 430 : 770); s < 0 ? x > -1200 : x < 2400; x += s * 132) {
        ctx.fillStyle = "#17335F"; ctx.fillRect(x - 11, top - 4, 22, hB + 4); ctx.fillStyle = "#1E3F74"; ctx.fillRect(x - 13, top - 8, 26, 5);
        ctx.strokeStyle = RIM + ".5)"; ctx.lineWidth = .8; ctx.strokeRect(x - 13, top - 8, 26, 5);
        // urn
        const ug = ctx.createLinearGradient(x - 10, 0, x + 10, 0); ug.addColorStop(0, "#0E2246"); ug.addColorStop(.6, "#2C5596"); ug.addColorStop(1, "#102850");
        ctx.fillStyle = ug; ctx.beginPath(); ctx.moveTo(x - 4, top - 8); ctx.lineTo(x - 3, top - 12); ctx.bezierCurveTo(x - 12, top - 14, x - 12, top - 26, x - 9, top - 28); ctx.lineTo(x + 9, top - 28); ctx.bezierCurveTo(x + 12, top - 26, x + 12, top - 14, x + 3, top - 12); ctx.lineTo(x + 4, top - 8); ctx.fill();
        for (let k = 0; k < 26; k++) { const a = r() * Math.PI, rr = 6 + r() * 9; const c = r() < .45 ? "242,217,155" : r() < .75 ? "243,198,214" : "207,227,255";
          ctx.fillStyle = k < 12 ? `rgba(30,70,120,.95)` : `rgba(${c},${.7 + r() * .3})`; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr * 1.2, top - 30 - Math.sin(a) * rr * .8, k < 12 ? 3.2 : 1.4 + r() * 1.2, 0, TAU); ctx.fill(); }
      }
    }
    // planters of roses in the near corners
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x = 600 + s * (560 + i * 190), y = 892 - i * 6;
      for (let k = 0; k < 90; k++) { const a = r() * Math.PI, rr = r() * 46; const leafy = k < 55;
        const c = r() < .5 ? "243,198,214" : r() < .75 ? "242,217,155" : "207,227,255";
        ctx.fillStyle = leafy ? `rgb(${10 + r() * 22 | 0},${26 + r() * 44 | 0},${60 + r() * 70 | 0})` : `rgba(${c},${.45 + r() * .3})`;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr * 1.4, y - Math.sin(a) * rr * .8, leafy ? 4 + r() * 4 : 1.2 + r() * 1.1, 0, TAU); ctx.fill(); }
    }
  }

  // ------------------------------------------------------------------ the portal
  function archPath(ctx, xl, xr, ySpring, apexY, yBottom, noStart) { // a pointed arch drawn from two circles
    const cx = (xl + xr) / 2, a = (xr - xl) / 2, h = ySpring - apexY;
    const e = Math.max(0, (h * h - a * a) / (2 * a)), R = a + e;
    if (!noStart) ctx.moveTo(xl, yBottom);
    ctx.lineTo(xl, ySpring);
    ctx.arc(cx + e, ySpring, R, Math.PI, Math.atan2(-h, -e) + TAU);
    ctx.arc(cx - e, ySpring, R, Math.atan2(-h, e), 0);
    ctx.lineTo(xr, yBottom);
  }
  function paintPortal(ctx, r) {
    const stone = ctx.createLinearGradient(0, 180, 0, 900);
    stone.addColorStop(0, "#22427A"); stone.addColorStop(.35, "#163262"); stone.addColorStop(1, "#0B1C3A");
    // buttress towers with pinnacles
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? 372 : 806, x1 = x0 + 22;
      ctx.fillStyle = stone; ctx.fillRect(x0, 340, 22, 560);
      ctx.fillRect(x0 - 3, 600, 28, 300); ctx.fillRect(x0 - 6, 820, 34, 80);
      // niche with a small statue
      ctx.fillStyle = "#0B1C3A"; ctx.beginPath(); archPath(ctx, x0 + 4, x1 - 4, 452, 436, 500); ctx.fill();
      ctx.save(); ctx.translate(x0 + 11, 498); ctx.fillStyle = "#1E4176"; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.bezierCurveTo(-5, -18, -3, -28, -2, -36); ctx.lineTo(2, -36); ctx.bezierCurveTo(3, -28, 5, -18, 4, 0); ctx.fill(); ctx.beginPath(); ctx.arc(0, -39, 2.6, 0, TAU); ctx.fill(); ctx.restore();
      ctx.fillStyle = stone; pinnacle(ctx, x0 + 11, 342, 22, 96, false);
      ctx.save(); ctx.fillStyle = "#1C3B6E"; crockets(ctx, x0, 342, x0 + 11, 248, 8, -1, 2.2); crockets(ctx, x1, 342, x0 + 11, 248, 8, 1, 2.2); ctx.restore();
      ctx.save(); glow(ctx, "rgba(242,217,155,.9)", 8); ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x0 + 11, 244, 2.2, 0, TAU); ctx.fill(); ctx.restore();
      ctx.strokeStyle = RIM + ".6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s < 0 ? x1 : x0, 900); ctx.lineTo(s < 0 ? x1 : x0, 342); ctx.lineTo(x0 + 11, 246); ctx.stroke();
      // horizontal string courses
      ctx.fillStyle = "#1E3F74"; [600, 820, 452].forEach(y => ctx.fillRect(x0 - 4, y - 2, 30, 4));
    }
    // the gable (wimperg) above the arch
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1200, 900); archPath(ctx, 470, 730, 474, 322, 900); ctx.closePath(); ctx.clip("evenodd");
    ctx.fillStyle = stone; ctx.beginPath(); ctx.moveTo(412, 420); ctx.lineTo(600, 214); ctx.lineTo(788, 420); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#1C3B6E"; crockets(ctx, 412, 420, 600, 216, 14, -1, 3); crockets(ctx, 788, 420, 600, 216, 14, 1, 3);
    ctx.strokeStyle = RIM + ".55)"; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(412, 420); ctx.lineTo(600, 214); ctx.lineTo(788, 420); ctx.stroke();
    // rose of tracery in the gable
    ctx.save(); ctx.translate(600, 300);
    ctx.fillStyle = "#0B1C3A"; ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(226,201,142,.6)"; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.stroke();
    ctx.strokeStyle = "rgba(170,205,255,.5)"; ctx.lineWidth = .9;
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU - Math.PI / 2; ctx.beginPath(); ctx.arc(Math.cos(a) * 13, Math.sin(a) * 13, 9, 0, TAU); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.stroke();
    ctx.restore();
    // finial on the gable
    ctx.save(); glow(ctx, "rgba(242,217,155,.95)", 10); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(600, 214); ctx.lineTo(600, 192); ctx.moveTo(593, 200); ctx.lineTo(607, 200); ctx.stroke();
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(600, 188, 3.2, 0, TAU); ctx.fill(); ctx.restore();
    // the arch itself: stone between outer and inner, deep mouldings
    ctx.fillStyle = stone;
    // build the ring with evenodd: outer then inner reversed
    ctx.beginPath(); archPath(ctx, 398, 802, 470, 252, 900); ctx.closePath(); archPath(ctx, 470, 730, 474, 322, 900); ctx.closePath(); ctx.fill("evenodd");
    // ashlar and voussoir joints
    ctx.save(); ctx.beginPath(); archPath(ctx, 398, 802, 470, 252, 900); ctx.closePath(); archPath(ctx, 470, 730, 474, 322, 900); ctx.closePath(); ctx.clip("evenodd");
    for (let y = 486; y < 900; y += 17) for (let x = 396; x < 806; x += 22 + (y / 17 % 2) * 11) { ctx.fillStyle = `rgba(${r() < .5 ? "150,190,250" : "0,10,30"},${(r() * .06).toFixed(3)})`; ctx.fillRect(x, y, 22, 17); }
    ctx.strokeStyle = "rgba(4,12,28,.35)"; ctx.lineWidth = .7;
    for (let y = 486; y < 900; y += 17) { ctx.beginPath(); ctx.moveTo(390, y); ctx.lineTo(810, y); ctx.stroke(); }
    for (let k = 1; k < 24; k++) { const a = Math.PI + k / 24 * Math.PI; ctx.beginPath(); ctx.moveTo(600 + Math.cos(a) * 110, 472 + Math.sin(a) * 140); ctx.lineTo(600 + Math.cos(a) * 240, 472 + Math.sin(a) * 260); ctx.stroke(); }
    ctx.restore();
    // concentric archivolts: light rim on the inner edge of each, shadow on the outer
    const rings = [[470, 730, 474, 322], [482, 718, 474, 336], [496, 704, 472, 352], [510, 690, 470, 368]];
    [[412, 788, 470, 268], [428, 772, 470, 284], [446, 754, 470, 300]].concat([[470, 730, 474, 322]]).forEach(([a, b, s, t], i) => {
      ctx.strokeStyle = "rgba(4,12,28,.55)"; ctx.lineWidth = 2.4; ctx.beginPath(); archPath(ctx, a, b, s, t, 900); ctx.stroke();
      ctx.strokeStyle = i === 1 ? "rgba(226,201,142,.6)" : RIM + (.3 + i * .12) + ")"; ctx.lineWidth = i === 1 ? 1.2 : 1; ctx.beginPath(); archPath(ctx, a + 1.4, b - 1.4, s, t + 1.6, 900); ctx.stroke();
    });
    void rings;
    // jamb colonnettes with capitals and bases
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const x = s < 0 ? 412 + k * 19 : 788 - k * 19, w = 9;
      const cg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      cg.addColorStop(0, "#0C1E3E"); cg.addColorStop(s < 0 ? .7 : .3, "#2A4F8C"); cg.addColorStop(1, "#0E2246");
      ctx.fillStyle = cg; ctx.fillRect(x - w / 2, 486, w, 380);
      // capital: foliage
      ctx.fillStyle = "#1E3F74"; ctx.beginPath(); ctx.moveTo(x - w / 2 - 3, 486); ctx.lineTo(x + w / 2 + 3, 486); ctx.lineTo(x + w / 2, 500); ctx.lineTo(x - w / 2, 500); ctx.fill();
      for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.arc(x + j * 3.6, 489, 2.4, 0, TAU); ctx.fill(); }
      ctx.fillRect(x - w / 2 - 3, 860, w + 6, 6); ctx.fillRect(x - w / 2 - 2, 866, w + 4, 34);
      ctx.strokeStyle = RIM + ".45)"; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(s < 0 ? x + w / 2 : x - w / 2, 500); ctx.lineTo(s < 0 ? x + w / 2 : x - w / 2, 860); ctx.stroke();
    }
    // abacus band at the springing line and the plinth
    ctx.fillStyle = "#1E3F74"; ctx.fillRect(394, 466, 82, 9); ctx.fillRect(724, 466, 82, 9);
    ctx.strokeStyle = RIM + ".5)"; ctx.lineWidth = .8; ctx.strokeRect(394, 466, 82, 9); ctx.strokeRect(724, 466, 82, 9);
    // inner rim light: the opening is where the light comes from
    ctx.save(); glow(ctx, "rgba(170,210,255,.9)", 10); ctx.strokeStyle = "rgba(225,238,255,.85)"; ctx.lineWidth = 1.5; ctx.beginPath(); archPath(ctx, 470, 730, 474, 322, 900); ctx.stroke(); ctx.restore();
    // carved quatrefoils on the jamb faces
    [[437, 640], [763, 640], [437, 760], [763, 760]].forEach(([x, y]) => { ctx.strokeStyle = "rgba(226,201,142,.5)"; ctx.lineWidth = .9; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 4.5, y + Math.sin(a) * 4.5, 4.5, 0, TAU); ctx.stroke(); } });
  }

  // ------------------------------------------------------------------ the angels
  // Local frame: feet at (0,0), facing +x (toward the gate), up is -y, about 430 px tall.
  const deg = a => a * Math.PI / 180;
  function feather(ctx, bx, by, angDeg, len, wid, curl, tone, alpha) {
    const a = deg(angDeg), c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c;
    const tx = bx + c * len + nx * curl, ty = by + s * len + ny * curl;
    ctx.beginPath(); ctx.moveTo(bx + nx * wid * .25, by + ny * wid * .25);
    ctx.bezierCurveTo(bx + c * len * .35 + nx * wid, by + s * len * .35 + ny * wid, bx + c * len * .88 + nx * (wid * .75 + curl), by + s * len * .88 + ny * (wid * .75 + curl), tx, ty);
    ctx.bezierCurveTo(bx + c * len * .8 - nx * (wid * .55 - curl), by + s * len * .8 - ny * (wid * .55 - curl), bx + c * len * .3 - nx * wid * .6, by + s * len * .3 - ny * wid * .6, bx - nx * wid * .25, by - ny * wid * .25);
    ctx.closePath();
    const g = ctx.createLinearGradient(bx, by, tx, ty);
    g.addColorStop(0, `rgba(9,24,58,${alpha})`);
    g.addColorStop(.5, `rgba(${30 + tone * 40 | 0},${64 + tone * 60 | 0},${126 + tone * 70 | 0},${alpha})`);
    g.addColorStop(1, `rgba(${120 + tone * 90 | 0},${168 + tone * 62 | 0},${236 + tone * 19 | 0},${alpha * .95})`);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = `rgba(206,228,255,${(.16 + tone * .3).toFixed(3)})`; ctx.lineWidth = .6; ctx.stroke();
    // shaft and vane texture
    ctx.strokeStyle = `rgba(220,236,255,${(.1 + tone * .22).toFixed(3)})`; ctx.lineWidth = .55;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + c * len * .55 + nx * curl * .4, by + s * len * .55 + ny * curl * .4, tx - c * 3, ty - s * 3); ctx.stroke();
    ctx.strokeStyle = `rgba(190,215,250,${(.05 + tone * .07).toFixed(3)})`; ctx.lineWidth = .45;
    for (let k = 0; k < 7; k++) { const t = .22 + k * .1, px = bx + c * len * t, py = by + s * len * t, w = wid * (1 - t * .5); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nx * w * .9 + c * w * .6, py + ny * w * .9 + s * w * .6); ctx.stroke(); }
  }
  // points along a polyline of bones
  function along(pts, t) {
    const seg = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
    let d = t * tot;
    for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const u = seg[i] ? d / seg[i] : 0; return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]; } d -= seg[i]; }
    return pts[pts.length - 1];
  }
  function paintWing(ctx, r, far) {
    // bones from the shoulder: S (root) -> E (elbow) -> W (wrist) -> H (hand)
    const k = far ? .78 : 1;
    const S = [0, 0], E = [-40 * k, -46 * k], Wr = [-74 * k, -138 * k], H = [-66 * k, -184 * k];
    const tone = far ? .42 : 1, A = far ? .92 : .96;
    if (!far) {
      // tertials and secondaries: the broad back of the wing, falling behind the angel
      for (let i = 4; i >= 0; i--) { const p = along([S, E], .25 + i * .15); feather(ctx, p[0] + 2, p[1] + 6, 128 - i * 4, (78 + i * 6), 11, 3, .3 * tone, A); }
      for (let i = 15; i >= 0; i--) { const t = i / 15, p = along([E, Wr], 1 - t); feather(ctx, p[0], p[1], lerp(214, 160, t), lerp(132, 118, t) + r() * 6, 12.5, 4, (.35 + (1 - t) * .25) * tone, A); }
    }
    // primaries fanning up from the wrist and the hand
    for (let i = 0; i < 11; i++) { const t = i / 10, p = along([Wr, H], t); feather(ctx, p[0], p[1], lerp(226, 266, t), (far ? 128 : 140) + Math.sin(t * Math.PI * .8) * (far ? 32 : 44) + r() * 6, 10.5, -4, (.5 + t * .35) * tone, A); }
    if (far) for (let i = 10; i >= 0; i--) { const t = i / 10, p = along([E, Wr], 1 - t); feather(ctx, p[0], p[1], lerp(226, 200, t), 96 - t * 10, 10, 3, .4 * tone, A); }
    // greater and median coverts, overlapping the bases
    [[.52, 12, .62], [.3, 10, .72]].forEach(([f, w, tn]) => {
      for (let i = 0; i < 16; i++) { const t = i / 15, p = along([S, E, Wr, H], .08 + t * .9), ang = t < .62 ? lerp(150, 214, t / .62) : lerp(226, 262, (t - .62) / .38);
        const base = t < .62 ? lerp(124, 136, t) : lerp(140, 176, (t - .62) / .38);
        feather(ctx, p[0] + (f < .4 ? 4 : 1), p[1] + (f < .4 ? 3 : 1), ang, base * f, w, 2, tn * tone, A); }
    });
    // marginal coverts: small rounded feathers along the leading edge
    for (let i = 0; i < 34; i++) { const t = i / 33, p = along([S, E, Wr, H], .04 + t * .94), ang = t < .62 ? lerp(140, 205, t / .62) : lerp(215, 250, (t - .62) / .38); feather(ctx, p[0] + 3, p[1] + 2, ang, 22 - t * 6, 7, 1.5, .78 * tone, 1); }
    // depth: the wing darkens away from the light and toward its root
    ctx.save(); ctx.globalCompositeOperation = "source-atop";
    const sh = ctx.createLinearGradient(-200, 60, 40, -220); sh.addColorStop(0, "rgba(2,8,24,.55)"); sh.addColorStop(.5, "rgba(2,8,24,.12)"); sh.addColorStop(1, "rgba(2,8,24,0)");
    ctx.fillStyle = sh; ctx.fillRect(-430, -430, 860, 860); ctx.restore();
    // the leading edge catches the light
    ctx.save(); glow(ctx, "rgba(180,215,255,.8)", 7); ctx.strokeStyle = `rgba(236,244,255,${far ? .22 : .5})`; ctx.lineWidth = far ? .9 : 1.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(S[0] + 2, S[1] - 4); ctx.bezierCurveTo(E[0] + 6, E[1] - 14, Wr[0] + 2, Wr[1] + 24, Wr[0], Wr[1]); ctx.quadraticCurveTo(Wr[0] + 2, Wr[1] - 20, H[0], H[1]); ctx.stroke(); ctx.restore();
  }
  function paintAngelBody(ctx, r) {
    const base = "#0A1F4C";
    const lit = (path, top, bottom) => {
      ctx.fillStyle = base; ctx.fill(path);
      const g = ctx.createLinearGradient(0, top, 0, bottom);
      g.addColorStop(0, "rgba(196,220,255,.82)"); g.addColorStop(.35, "rgba(96,140,214,.72)"); g.addColorStop(.75, "rgba(34,70,138,.82)"); g.addColorStop(1, "rgba(18,42,96,.92)");
      ctx.fillStyle = g; ctx.fill(path);
      const side = ctx.createLinearGradient(-110, 0, 80, 0); side.addColorStop(0, "rgba(3,10,28,.55)"); side.addColorStop(.6, "rgba(3,10,28,0)"); side.addColorStop(1, "rgba(210,230,255,.22)");
      ctx.fillStyle = side; ctx.fill(path);
    };
    const rimStroke = (path, w) => { const g = ctx.createLinearGradient(-60, 0, 90, 0); g.addColorStop(0, "rgba(214,232,255,.1)"); g.addColorStop(.55, "rgba(214,232,255,.4)"); g.addColorStop(1, "rgba(236,244,255,.95)"); ctx.save(); glow(ctx, "rgba(170,210,255,.8)", 6); ctx.strokeStyle = g; ctx.lineWidth = w; ctx.stroke(path); ctx.restore(); };
    // hair falling down the back, behind the robe
    const hairBack = new Path2D("M-2 -426 C-22 -424 -30 -404 -30 -384 C-30 -364 -36 -346 -34 -322 C-33 -304 -26 -292 -20 -284 C-14 -300 -10 -320 -10 -340 C-10 -360 -6 -380 -2 -392 Z");
    ctx.fillStyle = "rgba(70,108,180,.9)"; ctx.fill(hairBack);
    // the robe: high waist, the near knee stepping forward, a train behind
    const robe = new Path2D("M12 -362 C24 -356 31 -342 31 -324 C31 -308 27 -298 24 -290 C30 -252 44 -178 50 -132 C53 -96 51 -46 60 -8 L76 0 C40 5 -40 6 -120 4 C-150 3 -168 2 -180 0 C-134 -10 -84 -40 -62 -92 C-46 -150 -36 -228 -31 -280 C-28 -312 -26 -340 -14 -360 C-6 -365 4 -366 12 -362 Z");
    lit(robe, -370, 0);
    // drapery
    ctx.save(); ctx.clip(robe); ctx.lineCap = "round";
    const fold = (d, w, light) => { const p = new Path2D(d);
      // a soft valley of shadow beside a lit ridge
      [[1, .14], [.6, .16], [.3, .2]].forEach(([k, a]) => { ctx.strokeStyle = `rgba(3,12,32,${a})`; ctx.lineWidth = w * k * 1.6; ctx.save(); ctx.translate(-w * .45, 0); ctx.stroke(p); ctx.restore(); });
      [[.7, light * .4], [.3, light]].forEach(([k, a]) => { ctx.strokeStyle = `rgba(214,232,255,${a})`; ctx.lineWidth = w * k; ctx.stroke(p); }); };
    fold("M18 -286 C26 -240 36 -190 46 -140 C52 -100 46 -60 54 -4", 9, .2);
    fold("M30 -150 C34 -110 30 -70 34 -4", 7, .14);
    fold("M4 -286 C0 -230 6 -170 -2 -110 C-8 -60 -4 -30 -10 -2", 10, .15);
    fold("M-12 -284 C-20 -220 -18 -160 -32 -100 C-40 -60 -50 -30 -70 -2", 10, .13);
    fold("M-26 -262 C-40 -190 -60 -120 -100 -60 C-120 -30 -140 -12 -165 -2", 11, .12);
    ctx.strokeStyle = "rgba(220,236,255,.38)"; ctx.lineWidth = 1.2; ctx.stroke(new Path2D("M-180 0 C-140 -8 -100 -2 -60 -6 C-20 -10 30 -2 76 0"));
    // the bodice and its folds
    fold("M2 -360 C10 -340 14 -318 14 -296", 4, .3);
    ctx.restore();
    rimStroke(robe, 1.4);
    // a gold cord tied high at the waist
    ctx.save(); glow(ctx, "rgba(242,217,155,.7)", 4); ctx.strokeStyle = "rgba(232,206,146,.85)"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-31, -290); ctx.quadraticCurveTo(-4, -282, 25, -292); ctx.stroke();
    ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(6, -286); ctx.bezierCurveTo(10, -262, 6, -242, 9, -214); ctx.moveTo(8, -286); ctx.bezierCurveTo(16, -264, 14, -246, 18, -222); ctx.stroke(); ctx.restore();
    // far arm, its hand at the heart
    const farArm = new Path2D("M-4 -352 C-14 -330 -14 -306 -2 -298 C8 -294 20 -304 27 -318 L22 -326 C14 -316 6 -312 3 -326 C2 -336 2 -346 -4 -352 Z");
    lit(farArm, -352, -296); rimStroke(farArm, .9);
    ctx.fillStyle = "rgba(200,222,252,.95)"; ctx.beginPath(); ctx.ellipse(26, -322, 5, 3.4, -.5, 0, TAU); ctx.fill();
    // near arm reaching toward the gate, a long sleeve hanging from the forearm
    const sleeve = new Path2D("M8 -358 C30 -366 60 -362 88 -369 C93 -361 91 -351 85 -341 C77 -321 66 -301 52 -293 C40 -288 30 -300 24 -314 C20 -326 16 -334 10 -338 Z");
    lit(sleeve, -368, -276);
    ctx.save(); ctx.clip(sleeve); ctx.lineCap = "round";
    [["M82 -362 C72 -334 62 -312 50 -296", 6, .3], ["M64 -360 C58 -338 48 -318 36 -304", 6, .22], ["M40 -360 C36 -344 30 -330 24 -318", 5, .18]].forEach(([d, w, a]) => { const pth = new Path2D(d); ctx.strokeStyle = "rgba(3,12,32,.38)"; ctx.lineWidth = w; ctx.stroke(pth); ctx.strokeStyle = `rgba(214,232,255,${a})`; ctx.lineWidth = w * .3; ctx.save(); ctx.translate(1.5, -1); ctx.stroke(pth); ctx.restore(); });
    ctx.restore();
    rimStroke(sleeve, 1.2);
    const hand = new Path2D("M86 -368 C94 -376 104 -381 112 -379 C115 -376 112 -371 106 -368 C102 -364 96 -361 90 -360 Z");
    ctx.fillStyle = "rgba(205,226,255,.96)"; ctx.fill(hand); rimStroke(hand, .8);
    // neck and head in profile
    const neck = new Path2D("M-4 -364 L-6 -380 C0 -384 8 -384 12 -380 L14 -362 Z");
    ctx.fillStyle = "rgba(150,186,240,.95)"; ctx.fill(neck);
    const head = new Path2D("M-12 -392 C-16 -414 -6 -432 10 -432 C24 -432 30 -421 31 -410 L32 -405 C33 -401 37 -396 38 -393 L34 -391 C35 -389 34 -387 33 -386 C34 -384 33 -382 31 -380 C29 -378 24 -377 20 -377 C15 -377 12 -380 10 -378 L-6 -376 C-10 -382 -11 -386 -12 -392 Z");
    const hg = ctx.createLinearGradient(-14, 0, 38, 0); hg.addColorStop(0, "rgba(54,92,166,.97)"); hg.addColorStop(.6, "rgba(170,202,248,.97)"); hg.addColorStop(1, "rgba(226,238,255,.98)");
    ctx.fillStyle = hg; ctx.fill(head); rimStroke(head, 1);
    // eye and brow, very soft
    ctx.strokeStyle = "rgba(20,44,96,.55)"; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(22, -404); ctx.quadraticCurveTo(25, -405.5, 28, -404); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(21, -410); ctx.quadraticCurveTo(25, -412.5, 30, -410.5); ctx.stroke();
    // hair over the crown, waves to the shoulder
    const hairTop = new Path2D("M-12 -392 C-18 -414 -8 -436 10 -436 C24 -436 30 -428 30 -418 C24 -424 16 -426 10 -424 C2 -420 -2 -410 -2 -398 C-4 -390 -8 -386 -12 -392 Z");
    ctx.fillStyle = "rgba(96,136,206,.95)"; ctx.fill(hairTop); rimStroke(hairTop, .8);
    ctx.lineCap = "round";
    for (let i = 0; i < 22; i++) { const t = i / 21; ctx.strokeStyle = `rgba(${170 + t * 60 | 0},${200 + t * 40 | 0},255,${(.18 + (1 - t) * .22).toFixed(2)})`; ctx.lineWidth = .8 + r() * 1.1;
      ctx.beginPath(); ctx.moveTo(lerp(-8, 24, t), -432 + Math.abs(t - .5) * 6); ctx.bezierCurveTo(-16 - r() * 8, -414 + r() * 6, -28 - r() * 6, -380 + r() * 10, -24 - r() * 10, -330 + r() * 30); ctx.stroke(); }
    // halo
    ctx.save(); glow(ctx, "rgba(242,217,155,.95)", 12); ctx.strokeStyle = "rgba(242,217,155,.8)"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(2, -444, 23, 6.5, -.14, 0, TAU); ctx.stroke(); ctx.restore();
    // light of the orb falling on the figure
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    [robe, sleeve, head, hand, farArm].forEach(p => { ctx.save(); ctx.clip(p); const lg = ctx.createRadialGradient(108, -378, 0, 108, -378, 190); lg.addColorStop(0, "rgba(242,217,155,.32)"); lg.addColorStop(.35, "rgba(242,217,155,.1)"); lg.addColorStop(1, "rgba(242,217,155,0)"); ctx.fillStyle = lg; ctx.fillRect(-200, -460, 340, 470); ctx.restore(); });
    ctx.restore();
    blob(ctx, -50, 0, 200, 16, "rgba(190,215,255,A)", .3);
  }

  // ------------------------------------------------------------------ light sprites
  function sprite(stops) { const c = layer(128, 128), g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c; }
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    SPR = {
      gold: sprite([[0, "rgba(255,246,220,1)"], [.25, "rgba(242,217,155,.6)"], [1, "rgba(242,217,155,0)"]]),
      blue: sprite([[0, "rgba(220,235,255,1)"], [.3, "rgba(180,208,255,.45)"], [1, "rgba(180,208,255,0)"]]),
      mist: sprite([[0, "rgba(180,208,255,1)"], [1, "rgba(180,208,255,0)"]]),
      halo: sprite([[0, "rgba(190,215,255,.55)"], [.18, "rgba(120,165,240,.3)"], [.5, "rgba(70,115,200,.12)"], [1, "rgba(40,80,160,0)"]]),
    };
    // god rays, drawn once and turned slowly
    const rc = layer(900, 900), rg = rc.getContext("2d"); rg.translate(450, 450);
    for (let i = 0; i < 18; i++) { rg.rotate(TAU / 18); const lg = rg.createLinearGradient(0, 0, 440, 0); lg.addColorStop(0, `rgba(190,215,255,${(.06 + (i % 3) * .015).toFixed(3)})`); lg.addColorStop(1, "rgba(190,215,255,0)"); rg.fillStyle = lg; rg.beginPath(); rg.moveTo(0, 0); rg.lineTo(440, -12); rg.lineTo(440, 12); rg.fill(); }
    SPR.rays = rc;
    return SPR;
  }
  function spr(ctx, img, x, y, rx, ry, a) { if (a <= 0) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(img, x - rx, y - ry, rx * 2, ry * 2); ctx.globalAlpha = 1; }

  // ------------------------------------------------------------------ the scene
  // Six stacked canvases: three painted once (sky, scene, front) and three that carry
  // the moving light (back, mid, top). Each frame only clears and redraws small things.
  function paintGateScene(host, opts) {
    const names = ["sky", "back", "scene", "mid", "front", "top"];
    const cv = {};
    names.forEach(n => { const c = document.createElement("canvas"); c.setAttribute("aria-hidden", "true"); c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none"; host.appendChild(c); cv[n] = c; });
    const st = { w: 0, h: 0, dpr: 1, narrow: !!opts.narrow, fx: null, raf: 0, run: true, t0: performance.now(), last: 0, ft: 0 };
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const view = () => {
      // world -> device pixels. Wide: 1200x900 fitted by height, bottom aligned. Narrow: 190..1010 x 168..900, width fitted, top aligned.
      if (st.narrow) { const s = st.w / 820; return { s, ox: -190 * s, oy: -168 * s }; }
      const s = Math.min(st.w / W0, st.h / H0); return { s, ox: (st.w - W0 * s) / 2, oy: st.h - H0 * s };
    };
    const angels = () => st.narrow ? [{ x: 338, s: .72, flip: false }, { x: 862, s: .72, flip: true }] : [{ x: 232, s: 1, flip: false }, { x: 968, s: 1, flip: true }];
    let V = null, wings = [];
    const ctxOf = n => { const g = cv[n].getContext("2d"); g.setTransform(V.s, 0, 0, V.s, V.ox, V.oy); return g; };

    function build() {
      V = view();
      CULL = [-V.ox / V.s - 20, (st.w - V.ox) / V.s + 20];
      names.forEach(n => { cv[n].width = st.w; cv[n].height = st.h; });
      const fx = { windows: [], stars: [] }, r = rng(2026);
      paintSky(ctxOf("sky"), r);
      for (let i = 0; i < 60; i++) fx.stars.push({ x: -400 + r() * 2000, y: 10 + r() * 380, s: .6 + r() * 1.3, f: .6 + r() * 1.6, p: r() * 10 });
      const sc = ctxOf("scene");
      paintCastle(sc, 352, 487, .9, r, fx.windows); paintCastle(sc, 848, 489, .8, r, fx.windows);
      paintCathedral(sc, r, fx.windows); paintPalace(sc, r, fx.windows);
      paintGarden(sc, r, fx);
      const fc = ctxOf("front");
      paintTerrace(fc, r); paintPortal(fc, r);
      wings = [];
      angels().forEach(a => {
        fc.save(); fc.translate(a.x, 900); fc.scale(a.flip ? -a.s : a.s, a.s); paintAngelBody(fc, r); fc.restore();
        ["far", "near"].forEach(kind => {
          const box = 430, px = box * V.s * a.s, c = layer(px * 2, px * 2), g = c.getContext("2d");
          g.setTransform(V.s * a.s, 0, 0, V.s * a.s, px, px);
          paintWing(g, r, kind === "far");
          wings.push({ c, kind, a, box, pivot: kind === "far" ? [8, -354] : [-14, -352] });
        });
      });
      const r2 = rng(77);
      for (let i = 0; i < 160; i++) { const side = i % 2 ? 1 : -1, x = 600 + side * (250 + r2() * 700), y = 880 + r2() * 30; fc.fillStyle = `rgba(${r2() < .5 ? "242,217,155" : r2() < .7 ? "243,198,214" : "207,227,255"},${(.35 + r2() * .35).toFixed(2)})`; fc.beginPath(); fc.arc(x, y, .8 + r2() * 1.8, 0, TAU); fc.fill(); }
      fx.flies = Array.from({ length: 40 }, () => ({ x: Math.random() * 1200, y: 520 + Math.random() * 380, a: Math.random() * TAU, v: .15 + Math.random() * .35, ph: Math.random() * 10, f: .5 + Math.random() * 1.1, r: .8 + Math.random() * 1.2 }));
      st.fx = fx;
    }

    function frame(now) {
      if (!V) return;
      const t = reduce ? 4 : (now - st.t0) / 1000, S = sprites(), fx = st.fx;
      // ---- back: stars, the breathing halo and slow rays behind the cathedral
      let g = cv.back.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, st.w, st.h); g.setTransform(V.s, 0, 0, V.s, V.ox, V.oy);
      g.fillStyle = "#EAF2FF";
      fx.stars.forEach(s => { g.globalAlpha = .2 + .8 * Math.pow(Math.max(0, Math.sin(t * s.f + s.p)), 3); g.beginPath(); g.arc(s.x, s.y, s.s, 0, TAU); g.fill(); if (s.s > 1.4) { g.fillRect(s.x - s.s * 3, s.y - .25, s.s * 6, .5); g.fillRect(s.x - .25, s.y - s.s * 3, .5, s.s * 6); } });
      g.globalAlpha = 1;
      const br = .84 + .16 * Math.sin(t * .9);
      spr(g, S.halo, 600, 452, 400 * br, 400 * br, 1);
      g.save(); g.translate(600, 455); g.rotate(t * .015); g.globalAlpha = .7 + .3 * Math.sin(t * .5); g.drawImage(S.rays, -450, -450); g.restore(); g.globalAlpha = 1;
      // ---- mid: windows, water, fountains, lanterns, mist and the wings
      g = cv.mid.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, st.w, st.h); g.setTransform(V.s, 0, 0, V.s, V.ox, V.oy);
      g.globalCompositeOperation = "lighter";
      fx.windows.forEach((w, i) => { if (!w.k) return; const a = .14 * w.k * (.5 + .5 * Math.sin(t * (.7 + (i % 7) * .13) + i)); g.fillStyle = `rgba(242,210,140,${a.toFixed(3)})`; g.fillRect(w.x - w.w * 1.5, w.y - w.h, w.w * 3, w.h * 2); });
      if (fx.canal) { g.save(); poly(g, fx.canal); g.clip(); for (let i = 0; i < 26; i++) { const d = 1.2 + ((i * 7.3 + t * .6) % 26), p = P(Math.sin(i * 3.1 + t * .8) * 10, d); g.fillStyle = `rgba(230,240,255,${(.25 / Math.sqrt(d)).toFixed(3)})`; g.fillRect(p[0] - 10 / d, p[1], 20 / d, Math.max(.5, 1.4 / d)); } g.restore(); }
      fx.fountains.forEach((f, k) => {
        const H = f.s * 2.4;
        g.strokeStyle = "rgba(220,235,255,.4)"; g.lineWidth = Math.max(.6, f.s * .07); g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x, f.y - H * (.92 + .08 * Math.sin(t * 6 + k))); g.stroke();
        g.fillStyle = "rgba(225,238,255,1)";
        for (let i = 0; i < 16; i++) { const ph = (t * .9 + i / 16 + k * .3) % 1, side = i % 2 ? 1 : -1, sp = (.35 + (i % 5) * .08) * f.s;
          const x = f.x + side * sp * ph * 1.6, y = f.y - H * .9 + (H * .9 + f.rY) * ph * ph - H * ph * (1 - ph);
          g.globalAlpha = .5 * (1 - ph); g.beginPath(); g.arc(x, y, Math.max(.35, f.s * .03), 0, TAU); g.fill(); }
        g.globalAlpha = 1;
        spr(g, S.mist, f.x, f.by, f.rx * 1.3, f.rY * 1.5, .14 + .05 * Math.sin(t * 2 + k));
      });
      fx.lamps.forEach((l, i) => { spr(g, S.gold, l.x, l.y, l.r * 6, l.r * 6, (.55 + .35 * Math.sin(t * (1.1 + (i % 5) * .2) + i)) * .6); });
      g.globalCompositeOperation = "source-over";
      for (let i = 0; i < 7; i++) { const d = 1.6 + i * 2.2, p = P(((t * 14 + i * 400) % 3000) - 1500, d); spr(g, S.mist, p[0], p[1], 520 / d + 60, 30 / d + 6, .07); }
      wings.forEach((w, i) => {
        const a = w.a, sway = (reduce ? 0 : 1) * (w.kind === "near" ? .028 : .02) * Math.sin(t * .55 + i * .7);
        g.save(); g.translate(a.x, 900); g.scale(a.flip ? -a.s : a.s, a.s); g.translate(w.pivot[0], w.pivot[1]); g.rotate(sway);
        g.drawImage(w.c, -w.box, -w.box, w.box * 2, w.box * 2); g.restore();
      });
      // ---- top: the angels' lights, the light through the gate, fireflies
      g = cv.top.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, st.w, st.h); g.setTransform(V.s, 0, 0, V.s, V.ox, V.oy);
      g.globalCompositeOperation = "lighter";
      angels().forEach((a, i) => { const x = a.x + (a.flip ? -1 : 1) * 106 * a.s, y = 900 - 380 * a.s, p = .8 + .2 * Math.sin(t * 1.4 + i * 1.7);
        spr(g, S.gold, x, y, 84 * a.s * p, 84 * a.s * p, .55); spr(g, S.gold, x, y, 24 * a.s, 24 * a.s, 1); });
      spr(g, S.mist, 600, 640, 270, 270, .16 + .04 * Math.sin(t * .8));
      fx.flies.forEach(p => {
        if (!reduce) { p.a += Math.sin(t * .7 + p.ph) * .04 + (Math.random() - .5) * .08; p.x += Math.cos(p.a) * p.v; p.y += Math.sin(p.a) * p.v * .7 - .02;
          if (p.x < -200) p.x = 1400; if (p.x > 1400) p.x = -200; if (p.y < 420) p.a = Math.PI / 2; if (p.y > 910) p.y = 560; }
        spr(g, S.gold, p.x, p.y, p.r * 4, p.r * 4, .06 + .6 * Math.pow(Math.max(0, Math.sin(t * p.f + p.ph)), 2.2));
      });
      g.globalCompositeOperation = "source-over";
    }

    function loop(now) {
      if (!st.run) return;
      if (now - st.last > 30) { st.last = now; const a = performance.now(); frame(now); st.ft = st.ft * .9 + (performance.now() - a) * .1; }
      st.raf = requestAnimationFrame(loop);
    }
    function resize() {
      const rect = host.getBoundingClientRect();
      const area = rect.width * rect.height;
      st.dpr = Math.min(area > 1.4e6 ? 1 : area > 7e5 ? 1.5 : 2, window.devicePixelRatio || 1);
      st.w = Math.max(1, Math.round(rect.width * st.dpr)); st.h = Math.max(1, Math.round(rect.height * st.dpr));
      st.narrow = !!opts.narrow;
      build(); frame(performance.now());
    }
    let rt = 0, lastW = 0, lastH = 0;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { const r = host.getBoundingClientRect(); if (Math.abs(r.width - lastW) > 2 || Math.abs(r.height - lastH) > 60) { lastW = r.width; lastH = r.height; resize(); } }, 150); };
    const onVis = () => { if (document.hidden) { st.run = false; cancelAnimationFrame(st.raf); } else if (!st.run && !reduce) { st.run = true; st.raf = requestAnimationFrame(loop); } };
    const r0 = host.getBoundingClientRect(); lastW = r0.width; lastH = r0.height;
    resize();
    if (!reduce) st.raf = requestAnimationFrame(loop);
    window.addEventListener("resize", onResize); document.addEventListener("visibilitychange", onVis);
    return {
      get frameMs() { return st.ft; },
      setNarrow(n) { if (opts.narrow !== n) { opts.narrow = n; resize(); } },
      destroy() { st.run = false; cancelAnimationFrame(st.raf); clearTimeout(rt); window.removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onVis); names.forEach(n => cv[n].remove()); },
    };
  }

  function GateScene({ narrow }) {
    const host = useRef(null), scene = useRef(null);
    useEffect(() => {
      // paint after the sign-in form is on screen, so typing never waits for the picture
      let on = true;
      const id = setTimeout(() => { if (on && host.current) scene.current = paintGateScene(host.current, { narrow }); }, 30);
      return () => { on = false; clearTimeout(id); if (scene.current) scene.current.destroy(); scene.current = null; };
    }, []);
    useEffect(() => { if (scene.current) scene.current.setNarrow(narrow); }, [narrow]);
    return <div ref={host} className={"fg-scene" + (narrow ? " narrow" : "")} aria-hidden="true" />;
  }

  // ---- The gate's sound: an original theme for the sign-in, composed and played live with
  // Web Audio (no audio files). Piano, strings, harp, celesta and a soft choir in a large hall,
  // over a quiet night garden. A great stone gate opens when the founder signs in.
  // Browsers only allow sound after a click or a key press, so it starts with the first one.
  const GateSound = (() => {
    let ac = null, master = null, hall = null, timers = [], running = false, sched = 0, nextBar = 0, bar = 0, music = null;
    const pref = () => { try { return localStorage.getItem("fg-sound") !== "off"; } catch (e) { return true; } };
    const setPref = on => { try { localStorage.setItem("fg-sound", on ? "on" : "off"); } catch (e) {} };
    const hz = n => 440 * Math.pow(2, (n - 69) / 12); // MIDI note -> Hz
    const noiseBuf = (sec, kind) => {
      const b = ac.createBuffer(2, Math.round(ac.sampleRate * sec), ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0, last = 0;
        for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1;
          if (kind === "pink") { b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .18; }
          else if (kind === "brown") { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } }
      return b;
    };
    const makeHall = () => { const len = Math.round(ac.sampleRate * 5.5), b = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) * (i < 400 ? i / 400 : 1); }
      const c = ac.createConvolver(); c.buffer = b; const g = ac.createGain(); g.gain.value = .42; c.connect(g); g.connect(master); return c; };
    const out = (bus, pan, dry, wet) => { const p = ac.createStereoPanner(); p.pan.value = pan || 0; const d = ac.createGain(); d.gain.value = dry; const w = ac.createGain(); w.gain.value = wet; p.connect(d); p.connect(w); d.connect(bus); w.connect(hall); return p; };

    // ---- instruments
    function piano(n, t, dur, vel, bus) {
      const f = hz(n), o = out(bus, (n - 64) / 48, .9, .35), lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200 + vel * 2200; lp.connect(o);
      [[1, 1], [2, .42], [3, .18], [4, .09], [5.02, .05]].forEach(([m, a], k) => { const os = ac.createOscillator(), g = ac.createGain(); os.type = k ? "sine" : "triangle"; os.frequency.value = f * m; os.detune.value = (Math.random() - .5) * 4;
        const decay = Math.max(.6, 3.2 - (n - 50) * .03) / (1 + k * .6);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * a * .18, t + .006); g.gain.exponentialRampToValueAtTime(vel * a * .05, t + .25); g.gain.exponentialRampToValueAtTime(.0001, t + Math.min(dur + .6, decay * 1.6));
        os.connect(g); g.connect(lp); os.start(t); os.stop(t + decay * 1.7); });
    }
    function celesta(n, t, vel, bus) { const f = hz(n), o = out(bus, (Math.random() - .5) * .8, .5, .7);
      [[1, 1], [4, .3], [7.2, .08]].forEach(([m, a]) => { const os = ac.createOscillator(), g = ac.createGain(); os.type = "sine"; os.frequency.value = f * m;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * a * .09, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + 2.2 / m); os.connect(g); g.connect(o); os.start(t); os.stop(t + 2.4); }); }
    function harp(n, t, vel, bus) { const f = hz(n), o = out(bus, (n - 66) / 40, .7, .6), lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200; lp.connect(o);
      [[1, 1], [2, .3], [3, .12]].forEach(([m, a]) => { const os = ac.createOscillator(), g = ac.createGain(); os.type = "triangle"; os.frequency.value = f * m;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * a * .11, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + 1.8); os.connect(g); g.connect(lp); os.start(t); os.stop(t + 1.9); }); }
    function strings(notes, t, dur, vel, bus) { // a bowed section: detuned saws, slow attack, vibrato
      const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500; lp.Q.value = .4; const o = out(bus, 0, .55, .6); lp.connect(o);
      const env = ac.createGain(); env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(vel * .05, t + Math.min(1.2, dur * .4)); env.gain.setValueAtTime(vel * .05, t + dur - .3); env.gain.linearRampToValueAtTime(0, t + dur + .9); env.connect(lp);
      const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.2; vg.gain.value = 6; vib.connect(vg); vib.start(t); vib.stop(t + dur + 1);
      notes.forEach(n => [-9, 0, 8].forEach(det => { const os = ac.createOscillator(); os.type = "sawtooth"; os.frequency.value = hz(n); os.detune.value = det; vg.connect(os.detune); const g = ac.createGain(); g.gain.value = .33; os.connect(g); g.connect(env); os.start(t); os.stop(t + dur + 1); }));
    }
    function choir(notes, t, dur, vel, bus) { // "aah": buzzy source through vowel formants
      const o = out(bus, 0, .35, .9), f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(); f1.type = f2.type = "bandpass"; f1.frequency.value = 780; f2.frequency.value = 1150; f1.Q.value = 5; f2.Q.value = 7;
      const env = ac.createGain(); env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(vel * .16, t + 1.6); env.gain.setValueAtTime(vel * .16, t + dur - .4); env.gain.linearRampToValueAtTime(0, t + dur + 1.4);
      env.connect(f1); env.connect(f2); f1.connect(o); f2.connect(o);
      notes.forEach(n => [-7, 7].forEach(det => { const os = ac.createOscillator(); os.type = "sawtooth"; os.frequency.value = hz(n); os.detune.value = det; const g = ac.createGain(); g.gain.value = .25; os.connect(g); g.connect(env); os.start(t); os.stop(t + dur + 1.6); }));
    }

    // ---- the theme: an original waltz in D major, 76 bpm, sixteen bars
    const BEAT = 60 / 76, BAR = BEAT * 3;
    // chord per bar: [bass, chord tones]
    const CH = [[38, [62, 66, 69]], [42, [62, 66, 69]], [43, [62, 67, 71]], [45, [61, 64, 69]], [47, [62, 66, 71]], [42, [61, 66, 69]], [43, [62, 67, 71]], [45, [61, 64, 69]],
                [38, [62, 66, 69]], [37, [61, 64, 69]], [47, [62, 66, 71]], [43, [62, 67, 71]], [40, [62, 64, 67]], [45, [61, 64, 67]], [38, [62, 66, 69]], [45, [61, 64, 69]]];
    // melody per bar: [note, beats]
    const MEL = [[[69, 1], [74, 1], [76, 1]], [[78, 2], [76, 1]], [[74, 1], [71, 1], [74, 1]], [[76, 3]], [[78, 1], [81, 1], [78, 1]], [[76, 2], [73, 1]], [[74, 1], [76, 1], [71, 1]], [[69, 3]],
                 [[69, 1], [74, 1], [78, 1]], [[81, 2], [79, 1]], [[78, 1], [74, 1], [71, 1]], [[74, 2], [76, 1]], [[79, 1], [78, 1], [76, 1]], [[73, 1], [76, 1], [81, 1]], [[78, 3]], [[76, 1.5], [73, 1.5]]];
    function playBar(i, t) {
      const [bass, tones] = CH[i % 16], cycle = Math.floor(i / 16);
      // left hand: a broken chord in eighths
      [bass, bass + 7, tones[1] - 12 + 12, bass + 12, tones[2], bass + 7].forEach((n, k) => piano(n, t + k * BEAT / 2, BEAT, k ? .32 : .48, music));
      // right hand melody, a little louder on the second time through
      let b = 0; MEL[i % 16].forEach(([n, len]) => { piano(n, t + b * BEAT, len * BEAT, cycle ? .6 : .5, music); b += len; });
      strings(tones.map(n => n - 12).concat([bass + 12]), t, BAR, cycle ? .9 : .6, music);
      if (i % 16 >= 8 || cycle) choir([tones[0], tones[2]], t, BAR, .6, music);
      if (i % 8 === 0) for (let k = 0; k < 12; k++) harp(tones[k % 3] - 12 + Math.floor(k / 3) * 12, t + k * .06, .55, music);
      if (i % 4 === 3) [tones[2] + 12, tones[0] + 24, tones[1] + 24].forEach((n, k) => celesta(n, t + BEAT * (1 + k * .5), .7, music));
    }
    function schedule() {
      if (!running) return;
      while (nextBar < ac.currentTime + 1.2) { playBar(bar, nextBar); nextBar += BAR; bar++; }
    }

    // ---- the night garden under the music
    function ambience() {
      const air = ac.createBufferSource(); air.buffer = noiseBuf(6, "pink"); air.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380; const g = ac.createGain(); g.gain.value = .1;
      air.connect(lp); lp.connect(g); g.connect(master); air.start();
      const cricket = pan => { const p = ac.createStereoPanner(); p.pan.value = pan; p.connect(master);
        const chirp = () => { if (!running) return; const t = ac.currentTime + .05, n = 3 + (Math.random() * 3 | 0);
          for (let i = 0; i < n; i++) { const o = ac.createOscillator(), e = ac.createGain(); o.frequency.value = 4300 + Math.random() * 300; const t0 = t + i * .045;
            e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(.004, t0 + .006); e.gain.linearRampToValueAtTime(0, t0 + .03); o.connect(e); e.connect(p); o.start(t0); o.stop(t0 + .04); }
          timers.push(setTimeout(chirp, 1100 + Math.random() * 3000)); };
        timers.push(setTimeout(chirp, 2000 + Math.random() * 3000)); };
      cricket(-.7); cricket(.65);
    }

    function start() {
      if (running || !pref()) return;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try { ac = ac || new AC(); } catch (e) { return; }
      if (ac.state === "suspended") ac.resume();
      running = true;
      // a gentle limiter keeps the loud moments (the gate) clean on phone speakers
      const lim = ac.createDynamicsCompressor(); lim.threshold.value = -10; lim.knee.value = 8; lim.ratio.value = 6; lim.attack.value = .004; lim.release.value = .25; lim.connect(ac.destination);
      master = ac.createGain(); master.gain.value = 0; master.connect(lim);
      master.gain.linearRampToValueAtTime(2.8, ac.currentTime + 3);
      hall = makeHall();
      music = ac.createGain(); music.gain.value = .9; music.connect(master);
      ambience();
      bar = 0; nextBar = ac.currentTime + .4; schedule(); sched = setInterval(schedule, 200);
      document.addEventListener("visibilitychange", onVis);
    }
    function onVis() { if (!ac) return; if (document.hidden) ac.suspend(); else if (running) ac.resume(); }
    function stop(fade) {
      if (!running || !ac) return; running = false;
      clearInterval(sched); timers.forEach(clearTimeout); timers = [];
      const m = master, c = ac, f = fade || .4; document.removeEventListener("visibilitychange", onVis);
      m.gain.cancelScheduledValues(c.currentTime); m.gain.setValueAtTime(m.gain.value, c.currentTime); m.gain.linearRampToValueAtTime(0, c.currentTime + f);
      setTimeout(() => { try { m.disconnect(); } catch (e) {} if (!running) { try { c.close(); } catch (e) {} if (ac === c) ac = null; } }, (f + .3) * 1000);
    }

    // ---- a great stone gate opening: a deep boom, grinding stone, a rush of air and a rising light
    function gate() {
      const t = ac.currentTime + .02;
      // the music steps back
      music.gain.cancelScheduledValues(t); music.gain.setValueAtTime(music.gain.value, t); music.gain.linearRampToValueAtTime(0, t + 1.2);
      clearInterval(sched);
      const fx = ac.createGain(); fx.gain.value = .5; fx.connect(master);
      // boom
      const boom = ac.createOscillator(), bg = ac.createGain(); boom.type = "sine"; boom.frequency.setValueAtTime(78, t); boom.frequency.exponentialRampToValueAtTime(34, t + 1.6);
      bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(.32, t + .03); bg.gain.exponentialRampToValueAtTime(.001, t + 2.2); boom.connect(bg); bg.connect(fx); bg.connect(hall); boom.start(t); boom.stop(t + 2.4);
      // rumble of the massive doors
      const rum = ac.createBufferSource(); rum.buffer = noiseBuf(4, "brown"); const rl = ac.createBiquadFilter(); rl.type = "lowpass"; rl.frequency.value = 140;
      const rg = ac.createGain(); rg.gain.setValueAtTime(0, t); rg.gain.linearRampToValueAtTime(.5, t + .9); rg.gain.linearRampToValueAtTime(.35, t + 2); rg.gain.linearRampToValueAtTime(0, t + 3.4);
      rum.connect(rl); rl.connect(rg); rg.connect(fx); rum.start(t); rum.stop(t + 3.6);
      // stone grinding on stone, fluttering
      const gr = ac.createBufferSource(); gr.buffer = noiseBuf(3, "white"); const gb = ac.createBiquadFilter(); gb.type = "bandpass"; gb.frequency.setValueAtTime(320, t + .2); gb.frequency.linearRampToValueAtTime(520, t + 2.4); gb.Q.value = 1.4;
      const gg = ac.createGain(); gg.gain.setValueAtTime(0, t + .2); gg.gain.linearRampToValueAtTime(.09, t + .6); gg.gain.linearRampToValueAtTime(.06, t + 2.1); gg.gain.linearRampToValueAtTime(0, t + 2.7);
      const fl = ac.createOscillator(), flg = ac.createGain(); fl.frequency.value = 11; flg.gain.value = .04; fl.connect(flg); flg.connect(gg.gain); fl.start(t); fl.stop(t + 3);
      gr.connect(gb); gb.connect(gg); gg.connect(fx); gg.connect(hall); gr.start(t + .2); gr.stop(t + 3);
      // the air rushing in as the gap widens
      const wh = ac.createBufferSource(); wh.buffer = noiseBuf(3, "pink"); const wf = ac.createBiquadFilter(); wf.type = "bandpass"; wf.Q.value = .8; wf.frequency.setValueAtTime(400, t + .6); wf.frequency.exponentialRampToValueAtTime(5200, t + 2.6);
      const wg = ac.createGain(); wg.gain.setValueAtTime(0, t + .6); wg.gain.linearRampToValueAtTime(.22, t + 1.9); wg.gain.linearRampToValueAtTime(0, t + 3.1);
      wh.connect(wf); wf.connect(wg); wg.connect(fx); wg.connect(hall); wh.start(t + .6); wh.stop(t + 3.3);
      // light pours through: a harp sweep, bells and a swelling chord
      for (let k = 0; k < 18; k++) harp([62, 66, 69, 71][k % 4] + Math.floor(k / 4) * 12 - 12, t + 1.1 + k * .045, .7, fx);
      [86, 90, 93, 98].forEach((n, k) => celesta(n, t + 1.9 + k * .16, 1, fx));
      strings([50, 57, 62, 66, 69], t + 1.3, 2.6, 1.4, fx);
      choir([62, 69, 74, 78], t + 1.4, 2.4, 1.1, fx);
      [50, 62, 69, 74, 78].forEach((n, k) => piano(n, t + 1.7 + k * .02, 3, .7, fx));
    }

    return {
      pref, start, get running() { return running; },
      toggle() { const on = !pref(); setPref(on); if (on) start(); else stop(.6); return on; },
      welcome() {
        if (!running) return;
        gate(); running = false; clearInterval(sched); timers.forEach(clearTimeout); timers = []; document.removeEventListener("visibilitychange", onVis);
        // let the gate finish, then fade everything out
        const c = ac, m = master, t = c.currentTime; m.gain.cancelScheduledValues(t); m.gain.setValueAtTime(m.gain.value, t); m.gain.setValueAtTime(m.gain.value, t + 3.6); m.gain.linearRampToValueAtTime(0, t + 6.2);
        setTimeout(() => { if (!running) { try { c.close(); } catch (e) {} if (ac === c) ac = null; } }, 6600);
      },
      wrong() { if (!running) return; piano(50, ac.currentTime, 1.2, .5, music); piano(49, ac.currentTime + .22, 1.2, .4, music); },
      stop,
    };
  })();
  const SoundIcon = ({ on }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />{on ? <><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" /></> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}</svg>;

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
    // step: "password" | "code" | "recovery"
    const [step, setStep] = useState("password");
    const [code, setCode] = useState("");
    useEffect(() => { let on = true; store.founderNeedsCode && store.founderNeedsCode().then(n => { if (on && n) setStep("code"); }); return () => { on = false; }; }, []);
    const opened = () => window.dispatchEvent(new CustomEvent("brial:change", { detail: { key: "founder-auth" } }));
    const submit = async e => {
      e && e.preventDefault();
      setError(null); setLoading(true);
      let res;
      try { res = await store.authFounder(email, password); } catch (err) { res = { error: "Could not reach the server. Check your connection and try again." }; }
      if (res && res.needsCode) { setStep("code"); setCode(""); setLoading(false); }
      else if (res && res.ok) { GateSound.welcome(); opened(); }
      else { GateSound.wrong(); setError((res && res.error) || "The email or password is not correct."); setLoading(false); }
    };
    const submitCode = async e => {
      e && e.preventDefault();
      setError(null); setLoading(true);
      const res = step === "recovery" ? await store.useFounderRecoveryCode(code) : await store.verifyFounderCode(code);
      if (res && res.ok) { if (res.recovered) { try { sessionStorage.setItem("fd-recovered", "1"); } catch (x) {} } GateSound.welcome(); opened(); }
      else { GateSound.wrong(); setError((res && res.error) || "That code is not right."); setLoading(false); }
    };
    // sound: starts with the first click or key press on the page (a browser rule), remembers the choice
    const [soundOn, setSoundOn] = useState(GateSound.pref);
    useEffect(() => {
      const go = () => GateSound.start();
      window.addEventListener("pointerdown", go, { once: true }); window.addEventListener("keydown", go, { once: true });
      return () => { window.removeEventListener("pointerdown", go); window.removeEventListener("keydown", go); GateSound.stop(2.5); };
    }, []);
    const otherAccount = () => { setError(null); setCode(""); setPassword(""); setStep("password"); store.clearFounderSession().then(() => {}, () => {}); };
    return (
      <div className="fg" style={narrow ? { "--fg-top": (window.innerWidth * 732 / 820 + 14) + "px" } : null}>
        <GateScene narrow={narrow} />
        <button className="fg-exit" onClick={onExit}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>Public site</button>
        <button className="fg-exit fg-snd" aria-pressed={soundOn} aria-label={soundOn ? "Sound on. Turn it off" : "Sound off. Turn it on"} onPointerDown={e => e.nativeEvent.stopPropagation()} onClick={e => { e.stopPropagation(); if (GateSound.pref() && !GateSound.running) { GateSound.start(); setSoundOn(true); } else setSoundOn(GateSound.toggle()); }}><SoundIcon on={soundOn} />{soundOn ? "Sound on" : "Sound off"}</button>
        <div className={narrow ? "fg-flow" : null}>
          <p className="fg-verse">“When a person dies, their deeds come to an end except for three: a charity that continues, knowledge that benefits, and a righteous child who prays for them.”<small>Sahih Muslim</small></p>
          {step !== "password" ? (
          <form className="fg-card" onSubmit={submitCode}>
            <div className="fg-mark"><svg width="26" height="26" viewBox="0 0 36 36" aria-hidden="true"><g fill="none" stroke="#E2C98E" strokeWidth="1.2"><path d="M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" /><circle cx="18" cy="18" r="4" fill="#E2C98E" stroke="none" /></g></svg></div>
            <p className="fg-k">Two-step verification</p>
            <h1 className="fg-h">{step === "recovery" ? "Use a recovery code." : "Enter your code."}</h1>
            <div className="fg-f">
              <label htmlFor="fg-code">{step === "recovery" ? "One of your ten recovery codes" : "The 6 digits in Google Authenticator"}</label>
              <div className="fg-in">{step === "recovery"
                ? <input id="fg-code" autoFocus value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0, 16))} autoComplete="off" spellCheck={false} placeholder="XXXXX-XXXXX" />
                : <input id="fg-code" autoFocus inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" style={{ letterSpacing: ".4em", fontSize: 20, textAlign: "center" }} />}
              </div>
            </div>
            {error && <div className="fg-err" role="alert">{error}</div>}
            <button className="fg-btn" type="submit" disabled={loading || (step === "recovery" ? code.replace(/[^A-Z0-9]/g, "").length < 10 : code.length !== 6)}>{loading ? "Checking…" : step === "recovery" ? "Use code and enter" : "Verify and enter"}</button>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 12, fontSize: 12.5 }}>
              <button type="button" onClick={() => { setError(null); setCode(""); setStep(step === "recovery" ? "code" : "recovery"); }} style={{ background: "none", border: 0, color: "#E2C98E", cursor: "pointer", padding: 0, font: "inherit" }}>{step === "recovery" ? "Use the app code instead" : "Lost your phone? Use a recovery code"}</button>
              <button type="button" onClick={otherAccount} style={{ background: "none", border: 0, color: "rgba(214,228,250,.65)", cursor: "pointer", padding: 0, font: "inherit" }}>Different account</button>
            </div>
          </form>
          ) : (
          <form className="fg-card" onSubmit={submit}>
            <div className="fg-mark"><svg width="26" height="26" viewBox="0 0 36 36" aria-hidden="true"><g fill="none" stroke="#E2C98E" strokeWidth="1.2"><path d="M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" /><circle cx="18" cy="18" r="4" fill="#E2C98E" stroke="none" /></g></svg></div>
            <p className="fg-k">Founder Portal</p>
            <h1 className="fg-h">Welcome back.</h1>
            <div className="fg-f"><label htmlFor="fg-email">Email</label><div className="fg-in"><input id="fg-email" type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" spellCheck={false} /></div></div>
            <div className="fg-f"><label htmlFor="fg-pw">Password</label><div className="fg-in"><input id="fg-pw" type={reveal ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /><button type="button" className="fg-eye" onClick={() => setReveal(r => !r)} aria-label={reveal ? "Hide password" : "Show password"}><EyeIcon off={reveal} /></button></div></div>
            {error && <div className="fg-err" role="alert">{error}</div>}
            <button className="fg-btn" type="submit" disabled={!email || !password || loading}>{loading ? "Signing in…" : "Sign in"}</button>
          </form>
          )}
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
        flash("Saved. The footer is updated.");
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
                <div><h2 className="fd-h2">Other links</h2><p className="fd-sub">Anything else: a Linktree, a donation page, a podcast.</p></div>
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
            <p className="fd-sub" style={{ marginTop: 4 }}>{shownCount ? `${shownCount} ${plural(shownCount, "item", "items")} visible to visitors.` : "Nothing is shown yet. The footer keeps its usual look."}</p>
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
    { title: "Applicants and scholars", sub: "From hello@brialendowment.org, replies come to you", items: [
      ["application_received", "Application received", "Confirms the application arrived and explains the next steps."],
      ["interview", "Interview invitation", "Date, time in WIB and Istanbul, and the meeting link."],
      ["accepted", "Scholarship approved", "Welcome, scholar ID, and the first step."],
      ["rejected", "Application declined", "A kind, respectful decision letter."],
      ["tuition_paid", "Tuition paid", "Confirms a semester's tuition has been paid, with the reference."],
      ["change_resolved", "Change request answered", "Tells the scholar whether you approved a change."],
      ["scholar_status", "Scholarship paused, resumed or ended", "Includes the note you wrote when you changed the status."],
      ["report_reply", "Help desk reply", "Your reply, with their original message."]] },
  ];
  // One sent email, opened from the activity list: the HTML as it went out, its plain-text
  // version, and any PDF attachment (rebuilt on request, PDFs are never stored).
  function MailRead({ item, store, onClose }) {
    const [m, setM] = useState(null);
    const [err, setErr] = useState("");
    const [view, setView] = useState("html");
    const [pdf, setPdf] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
      let live = true;
      store.mailView(item.id).then(r => { if (live) setM(r); }).catch(() => { if (live) setErr("Could not open this email. Check your connection and try again."); });
      return () => { live = false; };
    }, [item.id]);
    useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf.url); }, [pdf]);
    const openPdf = async i => {
      setBusy(true);
      try { const r = await store.mailPdf(item.id, i); setPdf(old => { if (old) URL.revokeObjectURL(old.url); return r; }); setView("pdf"); }
      catch (e) { setErr("Could not rebuild the PDF. The record it came from may have changed."); }
      setBusy(false);
    };
    const title = (m && m.subject) || item.subject || (item.kind === "message" ? MAIL_LABEL.message : MAIL_LABEL[item.kind] || item.kind);
    const files = (m && m.attachments) || [];
    return (
      <Modal wide title={title} sub={[MAIL_WORD[item.status] || item.status, fdatetime(item.sentAt || item.createdAt)].filter(Boolean).join(" · ")} onClose={onClose}>
        {err && <div className="fd-msg err" style={{ marginBottom: 12 }}>{err}</div>}
        {!m && !err && <p className="fd-sub">Opening…</p>}
        {m && m.skipped && (
          <p className="fd-sub" style={{ marginTop: 0 }}>This email was not sent, so there is nothing to read. Reason: {m.skipped}.</p>
        )}
        {m && !m.skipped && (
          <>
            <dl className="fd-mread-meta">
              <dt>From</dt><dd>{m.from || "Not recorded"}</dd>
              <dt>To</dt><dd>{m.to || item.to || "Not recorded"}</dd>
              {m.replyTo && <><dt>Replies go to</dt><dd>{m.replyTo}</dd></>}
              <dt>Subject</dt><dd>{m.subject}</dd>
              {files.length > 0 && <><dt>Attached</dt><dd>{files.join(", ")}</dd></>}
              {item.status === "failed" && item.error && <><dt>Error</dt><dd style={{ color: "var(--rose)" }}>{item.error}</dd></>}
            </dl>
            {m.rebuilt && <p className="fd-mread-note">Sent before 19 October 2026, when copies started being kept. This is the same template rebuilt from today's records, so the wording matches what went out, but details that changed since (a date, a status) show their current value.</p>}
            <div className="fd-actions" style={{ marginBottom: 12 }}>
              <button className={"fd-btn sm " + (view === "html" ? "primary" : "ghost")} onClick={() => setView("html")}>Email</button>
              <button className={"fd-btn sm " + (view === "text" ? "primary" : "ghost")} onClick={() => setView("text")}>Plain text</button>
              {files.map((f, i) => (
                <button key={f} className={"fd-btn sm " + (view === "pdf" && pdf && pdf.filename === f ? "primary" : "ghost")} disabled={busy} onClick={() => openPdf(i)}>{ICON.pdf}{busy ? "Preparing…" : files.length > 1 ? f : "PDF attachment"}</button>
              ))}
              {view === "pdf" && pdf && <><a className="fd-btn quiet sm" href={pdf.url} target="_blank" rel="noopener">Open in a new tab</a><a className="fd-btn quiet sm" href={pdf.url} download={pdf.filename}>Download</a></>}
            </div>
            {view === "html" && <iframe className="fd-mprev" title="Email as sent" sandbox="" srcDoc={m.html} />}
            {view === "text" && <pre className="fd-mread-text">{m.text || "No plain-text version."}</pre>}
            {view === "pdf" && pdf && <iframe className="fd-mread-pdf" title={pdf.filename} src={pdf.url} />}
          </>
        )}
      </Modal>
    );
  }

  const MAIL_LABEL = { test: "Test email" };
  MAIL_GROUPS.forEach(g => g.items.forEach(([k, l]) => { MAIL_LABEL[k] = l; }));
  const MAIL_TONE = { sent: "ok", pending: "warn", sending: "warn", skipped: "", failed: "bad" };
  const MAIL_WORD = { sent: "Sent", pending: "Waiting", sending: "Sending", skipped: "Not sent", failed: "Failed" };

  MAIL_LABEL.message = "Email you wrote";
  const REMINDER_KINDS = [
    ["interview_reminder", "Interview reminder", "To the applicant, about 24 hours before the interview."],
    ["bill_reminder", "Upload your tuition bill", "To scholars whose next semester has no bill yet, on the UKT dates below."],
    ["results_reminder", "Upload your semester results", "To scholars whose paid semester has no IP / KHS yet, on the results dates below."],
    ["bill_due", "Bill waiting / deadline near", "To you, when a bill's deadline is close or has passed, or a bill has waited too long."],
  ];
  REMINDER_KINDS.forEach(([k, l]) => { MAIL_LABEL[k] = l; });
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mdLabel = md => { const [m, d] = String(md).split("-").map(Number); return `${d} ${MONTHS[m - 1] || "?"}`; };
  const DEFAULT_REM = { billDates: ["01-10", "01-25", "07-25", "08-10"], resultDates: ["02-05", "02-20", "07-10", "07-25"], billGraceDays: 5 };
  function DateChips({ value, onChange }) {
    const [m, setM] = useState("1"); const [d, setD] = useState("");
    const add = () => { const dd = parseInt(d, 10); if (!(dd >= 1 && dd <= 31)) return; const md = String(m).padStart(2, "0") + "-" + String(dd).padStart(2, "0"); if (!value.includes(md)) onChange([...value, md].sort()); setD(""); };
    return (
      <div>
        <div className="fd-actions" style={{ gap: 6 }}>
          {value.length === 0 && <small className="fd-sub" style={{ margin: 0 }}>No dates: this reminder never goes out.</small>}
          {value.map(md => <span key={md} className="fd-tag gold">{mdLabel(md)}<button onClick={() => onChange(value.filter(x => x !== md))} aria-label={"Remove " + mdLabel(md)} style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", padding: "0 0 0 4px" }}>×</button></span>)}
        </div>
        <div className="fd-actions" style={{ marginTop: 8, gap: 6 }}>
          <input className="fd-input" style={{ width: 72 }} inputMode="numeric" placeholder="Day" value={d} onChange={e => setD(e.target.value.replace(/\D/g, "").slice(0, 2))} aria-label="Day" />
          <select className="fd-input" style={{ width: 92 }} value={m} onChange={e => setM(e.target.value)} aria-label="Month">{MONTHS.map((x, i) => <option key={x} value={i + 1}>{x}</option>)}</select>
          <button className="fd-btn ghost sm" onClick={add} disabled={!(parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31)}>Add date</button>
        </div>
      </div>
    );
  }
  const SENDERS = [
    ["brial", "Brial Asif Hayi Paka", "brial@brialendowment.org", "A personal letter from you"],
    ["hello", "The Brial Endowment", "hello@brialendowment.org", "The foundation's general address"],
    ["receipts", "The Brial Endowment", "receipts@brialendowment.org", "For anything about gifts and receipts"],
  ];
  const PROGRAMMES = ["The Brial Endowment · general endowment fund", "Scholarships", "Clean Water · wells and water systems", "Reforestation & Land · Trees for Life, olive trees in Palestine", "Food & Clothing · staple food and clothing for people in need", "Houses of Worship", "Hospitals", "Schools", "Livestock & Enterprise", "Sustainable Infrastructure", "Library"];
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
      catch (e) { const c = String(e && (e.message || e)); setErr(c.indexOf("rate_limited") >= 0 ? "That's a lot of email in one hour. Wait a little, then try again." : c.indexOf("invalid_email") >= 0 ? "One of the addresses doesn't look right." : "Could not send right now. Try again in a moment."); }
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
                  <Field label="Programme"><input className="fd-input" list="fd-programmes" value={ack.programme} onChange={e => setA("programme", e.target.value)} placeholder="Reforestation & Land · …" /><datalist id="fd-programmes">{PROGRAMMES.map(x => <option key={x} value={x} />)}</datalist></Field>
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
  const remKey = r => JSON.stringify([(r && r.billDates || []).slice().sort(), (r && r.resultDates || []).slice().sort(), Number(r && r.billGraceDays) || 5]);
  const mailDirty = (a, b) => !!(a && b) && (a.founderTo.trim() !== b.founderTo || offKinds(a.kinds) !== offKinds(b.kinds) || remKey(a.reminders) !== remKey(b.reminders));
  function EmailView({ store }) {
    const [s, setS] = useState(null);      // the form
    const [sv, setSv] = useState(null);    // what the server holds
    const svRef = useRef(null);
    const [log, setLog] = useState([]);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState("");
    const [prev, setPrev] = useState(null);
    const [compose, setCompose] = useState(false);
    const [reading, setReading] = useState(null);
    const [m, flash] = useFlash();
    const keep = st => { const norm = { founderTo: st.founderTo || "hello@brialendowment.org", paused: !!st.paused, kinds: st.kinds || {}, reminders: { ...DEFAULT_REM, ...(st.reminders || {}) } }; svRef.current = norm; setSv(norm); return norm; };
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
    const setRem = (k, v) => setS(p => ({ ...p, reminders: { ...p.reminders, [k]: v } }));
    const persist = async next => { const res = await store.saveMailSettings(next); return keep(res); };
    const save = async () => { setBusy("save"); try { const n = await persist({ founderTo: s.founderTo.trim(), kinds: s.kinds, reminders: s.reminders, paused: sv.paused }); setS(n); flash("Saved."); } catch (e) { flash("Could not save. Try again.", "err"); } setBusy(""); };
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
        <Head title="Email" lede="Receipts for donors, notices for applicants and scholars, and alerts for you, all sent from brialendowment.org." />
        <div className="fd-mail">
          <div>
            <div className="fd-card">
              <div className="fd-mstat">
                <div><h2 className="fd-h2" style={{ marginTop: 0 }}>Write an email</h2><p className="fd-sub" style={{ margin: 0 }}>A thank-you, an update or a reply, sent from brial@, hello@ or receipts@brialendowment.org.</p></div>
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
            <div className="fd-card">
              <div className="fd-card-head" style={{ marginBottom: 4 }}><div><h2 className="fd-h2">Reminders</h2><p className="fd-sub">Sent automatically, once each. Dates follow Jakarta time and go out from 09:00 WIB.</p></div></div>
              {REMINDER_KINDS.map(([k, label, desc]) => (
                <div className="fd-krow" key={k}><div><b>{label}</b><small>{desc}</small></div><Switch on={on(k)} onChange={v => setKind(k, v)}>{on(k) ? "On" : "Off"}</Switch></div>
              ))}
              <div className="fd-grid2" style={{ marginTop: 14 }}>
                <div><div className="fd-stage-k" style={{ marginBottom: 8 }}>UKT bill dates</div><DateChips value={s.reminders.billDates} onChange={v => setRem("billDates", v)} /></div>
                <div><div className="fd-stage-k" style={{ marginBottom: 8 }}>Results dates</div><DateChips value={s.reminders.resultDates} onChange={v => setRem("resultDates", v)} /></div>
              </div>
              <Field label="Warn me this many days before a bill's deadline" hint="Bills without a deadline: a weekly note once they have waited this long." style={{ marginTop: 14, maxWidth: 360 }}>
                <input className="fd-input" type="number" min={1} max={30} value={s.reminders.billGraceDays} onChange={e => setRem("billGraceDays", Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1)))} />
              </Field>
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
            <div className="fd-card-head" style={{ marginBottom: 6 }}><div><div className="fd-stage-k">Activity</div><p className="fd-sub" style={{ margin: "4px 0 0" }}>The latest emails, newest first. Click one to read it.</p></div><button className="fd-btn quiet sm" onClick={load}>Refresh</button></div>
            {log.length === 0 ? <p className="fd-sub">Nothing sent yet.</p> : (
              <div className="fd-mlog">{log.map(x => (
                <button type="button" className="fd-mlog-i" key={x.id} onClick={() => setReading(x)} title="Open this email">
                  <b>{x.kind === "message" ? (x.subject || MAIL_LABEL.message) : (MAIL_LABEL[x.kind] || x.kind)}</b><Tag tone={MAIL_TONE[x.status]}>{MAIL_WORD[x.status] || x.status}</Tag>
                  <small>{[x.to, fdatetime(x.sentAt || x.createdAt)].filter(Boolean).join(" · ")}{x.files > 0 ? " · PDF" : ""}</small><span />
                  {x.error && x.status !== "sent" && <small style={{ gridColumn: "1 / -1", color: x.status === "failed" ? "var(--rose)" : "var(--faint)" }}>{x.error}</small>}
                </button>
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
        {reading && <MailRead item={reading} store={store} onClose={() => setReading(null)} />}
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
    if (pillar === "impact") {
      const reps = store.getImpactReports ? store.getImpactReports() : [];
      nav = [{ id: "report", label: "Annual report", icon: ICON.report, count: reps.length }];
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active="report" onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout} noVisibility><ImpactView store={store} /></Shell>;
    }
    if (pillar === "site") {
      nav = [{ id: "contact", label: "Contact & social", icon: ICON.contact }];
      view = <ContactView store={store} />;
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active="contact" onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout} noVisibility>{view}</Shell>;
    }
    if (pillar === "security") {
      nav = [{ id: "security", label: "Security", icon: ICON.shield }];
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active="security" onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout} noVisibility><SecurityView store={store} /></Shell>;
    }
    if (pillar === "email") {
      nav = [{ id: "email", label: "Email", icon: ICON.send }];
      view = <EmailView store={store} />;
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active="email" onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout} noVisibility>{view}</Shell>;
    }
    if (pillar === "transport") {
      const cfg = PILLARS.transport;
      nav = [
        { id: "contrib", label: "Contributions", icon: ICON.inflow, count: store.listEnterpriseIncome ? store.listEnterpriseIncome("go2rent").length : 0 },
        { id: "story", label: "Programme page", icon: ICON.story },
        { id: "link", label: "Partner button", icon: ICON.link },
      ];
      const t = nav.some(n => n.id === tab) ? tab : "contrib";
      view = t === "contrib" ? <ContributionsView store={store} /> : t === "story" ? <ProgrammeView key={pillar} store={store} cfg={cfg} /> : <LinkView store={store} pillarKey={pillar} cfg={cfg} />;
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active={t} onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout}>{view}</Shell>;
    }
    if (pillar === "foodclothing") {
      const cfg = PILLARS.foodclothing;
      nav = [
        { id: "grants", label: "Distributions", icon: ICON.grant, count: store.getPillarGrants().filter(g => g.pillar === cfg.grantName && !g.archived).length },
        { id: "counts", label: "Rough totals", icon: ICON.overview },
        { id: "story", label: "Programme page", icon: ICON.story },
        { id: "link", label: "Partner button", icon: ICON.link },
      ];
      const t = nav.some(n => n.id === tab) ? tab : "grants";
      view = t === "counts" ? <CountsView store={store} /> : t === "grants" ? <DistributionsView store={store} cfg={cfg} /> : t === "story" ? <ProgrammeView key={pillar} store={store} cfg={cfg} /> : <LinkView store={store} pillarKey={pillar} cfg={cfg} />;
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active={t} onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout}>{view}</Shell>;
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
