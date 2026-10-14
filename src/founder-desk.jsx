// ============================================================
// FOUNDER DESK — pillar consoles of the Founder Portal (redesign, Oct 2026)
// Source for the block compiled into site/admin.compiled.js.
// Build: python3 scripts/build-desks.py <esbuild> [--bundle]
// The pillar chooser stays as it was; every pillar opens in this desk.
// ============================================================
const FD = (() => {
  const { useState, useEffect, useMemo, useRef } = React;

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
  function DonationsView({ store, donations }) {
    const [filter, setFilter] = useState("pending");
    const [q, setQ] = useState("");
    const [chan, setChan] = useState(false);
    const list = (donations || []).filter(d => !(store.isInternalDonation && store.isInternalDonation(d))).slice().sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    const isSale = d => !!(d.data && d.data.sale) || String(d.id || "").indexOf("SALE-") === 0;
    const verified = list.filter(d => d.verified), pending = list.filter(d => !d.verified);
    const sum = l => l.reduce((a, d) => a + (Number(d.amount) || 0), 0);
    const shown = list.filter(d => (filter === "pending" ? !d.verified : filter === "verified" ? d.verified : filter === "anonymous" ? d.anonymous : true))
      .filter(d => { const s = q.trim().toLowerCase(); return !s || [d.name, d.email, d.country, d.txHash, d.id].some(x => (x || "").toLowerCase().includes(s)); });
    const cfg = store.getPaymentConfig();
    const G = "minmax(0,1.8fr) minmax(0,.7fr) minmax(0,1.3fr) minmax(0,.8fr) auto";
    return (
      <>
        <Head title="Donations" lede="Gifts reported through the donate page. Check each one against your wallet or bank, then verify it — only verified gifts are final.">
          <button className="fd-btn ghost" onClick={() => setChan(true)}>Payment channels</button>
        </Head>
        <Stats items={[{ label: "Verified gifts", value: money(sum(verified)), sub: `${verified.length} ${plural(verified.length, "gift", "gifts")}`, tone: "ok" }, { label: "Waiting for verification", value: money(sum(pending)), sub: `${pending.length} reported`, tone: pending.length ? "warn" : "" }, { label: "Channels on the donate page", value: ["usdt", "bank", "card"].filter(g => cfg[g].enabled !== false).length, sub: [cfg.usdt.enabled !== false && "USDT", cfg.bank.enabled !== false && cfg.bank.bank, cfg.card.enabled !== false && "Card"].filter(Boolean).join(", ") }]} />
        <div className="fd-toolbar"><Seg value={filter} onChange={setFilter} items={[["pending", "To verify", pending.length], ["verified", "Verified", verified.length], ["anonymous", "Anonymous", list.filter(d => d.anonymous).length], ["all", "All", list.length]]} /></div>
        <div className="fd-toolbar"><Search value={q} onChange={setQ} placeholder="Search donor, email, country or reference" /></div>
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
                <div className="fd-td full"><div className="fd-actions" style={{ justifyContent: "flex-end" }}>{d.verified ? <Tag tone="ok" dot>Verified</Tag> : <button className="fd-btn ok sm" onClick={() => store.markDonationVerified(d.id)}>Verify</button>}<Confirm onConfirm={() => store.deleteDonation(d.id)}>Delete</Confirm></div></div>
              </div>
            );
          })}
        </div>
        <p className="fd-sub" style={{ marginTop: 12 }}>Grants to partners are listed under each pillar, not here.</p>
        {chan && <ChannelsDialog store={store} onClose={() => setChan(false)} />}
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
    if (pillar === "site") {
      nav = [{ id: "contact", label: "Contact & social", icon: ICON.contact }];
      view = <ContactView store={store} />;
      return <Shell store={store} pillarKey={pillar} meta={meta} nav={nav} active="contact" onNav={setTab} onBack={onBack} onExit={onExit} founderEmail={founderEmail} onLogout={onLogout} noVisibility>{view}</Shell>;
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
  return FounderDesk;
})();
