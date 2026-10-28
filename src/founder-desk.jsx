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
/* treasury assets */
.fd-alogo.cash{background:rgba(201,169,97,.12);border-color:rgba(201,169,97,.35)}
.fd-alogo.cash b{color:var(--gilt2);background:none}
.fd-hold.cash{background:rgba(239,233,220,.018)}
.fd-sug{border-color:rgba(201,169,97,.4);background:linear-gradient(180deg,rgba(201,169,97,.07),rgba(201,169,97,.02))}
.fd-sug .fd-krow{align-items:center}
.fd-ktotal{border-top:1px solid var(--line2)!important;margin-top:4px}
.fd-ktotal>b{font-size:17px}
.fd-recon{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(10,22,40,.45);border:1px solid var(--line);font-size:12.5px;color:var(--muted)}
.fd-recon b{color:var(--text)}
.fd-rec{cursor:pointer;border-radius:8px}
.fd-costs-tools{align-items:center}.fd-costs-tools .fd-search{width:240px;max-width:100%}
.fd-rec:hover{background:rgba(239,233,220,.03)}
.fd-mbars{display:grid;grid-template-columns:repeat(12,1fr);gap:6px;align-items:end;height:150px;margin-top:10px}
.fd-mbars>div{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;gap:6px}
.fd-mbars i{display:block;width:100%;max-width:26px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,var(--gilt2),var(--gilt))}
.fd-mbars span{font-size:10.5px;color:var(--faint)}
.fd-alogo{display:inline-flex;flex-shrink:0;align-items:center;justify-content:center;overflow:hidden;background:#fff;border:1px solid var(--line2)}
.fd-alogo img{width:100%;height:100%;object-fit:contain;padding:12%;box-sizing:border-box}
.fd-alogo b{display:flex;width:100%;height:100%;align-items:center;justify-content:center;color:var(--gilt2);font-family:'JetBrains Mono',monospace;font-weight:600;letter-spacing:.02em}
.fd-hold{cursor:pointer;transition:background .15s}
.fd-hold:hover,.fd-hold:focus-visible{background:rgba(239,233,220,.035);outline:none}
.fd-hold:focus-visible{box-shadow:inset 0 0 0 2px rgba(201,169,97,.5)}
.fd-hold-a{display:flex;align-items:center;gap:12px}
.fd-hold-a>span{min-width:0}
.fd-hold-a small .fd-tag{margin-right:4px;vertical-align:1px}
.fd-up{color:var(--sage)!important}.fd-down{color:var(--rose)!important}
.fd-alloc{margin-top:12px}
.fd-alloc-h{display:flex;justify-content:space-between;gap:10px;font-size:13.5px;margin-bottom:6px}
.fd-alloc-h span{display:flex;align-items:center;gap:8px;color:var(--muted)}
.fd-alloc-h i{width:9px;height:9px;border-radius:3px;display:inline-block}
.fd-alloc-h b{font-weight:600}.fd-alloc-h small{color:var(--faint);font-weight:400}
.fd-alloc-bar{position:relative;height:8px;border-radius:99px;background:rgba(239,233,220,.07)}
.fd-alloc-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:99px}
.fd-alloc-bar em{position:absolute;top:-4px;bottom:-4px;width:2px;margin-left:-1px;background:var(--text);border-radius:2px}
.fd-ahits{margin-top:10px;max-height:min(52vh,420px);overflow:auto;border:1px solid var(--line);border-radius:12px;min-height:56px}
.fd-ahits:empty{display:none}
.fd-ahit{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--line);color:var(--text);padding:10px 14px;cursor:pointer;font:inherit}
.fd-ahit:first-child{border-top:0}
.fd-ahit:hover,.fd-ahit:focus-visible{background:rgba(201,169,97,.08);outline:none}
.fd-ahit>span:nth-child(2){flex:1;min-width:0}
.fd-ahit b{display:block;font-weight:600}.fd-ahit small{display:block;font-size:12px;color:var(--faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fd-ahit-r{text-align:right;flex-shrink:0;max-width:40%}
.fd-adetail-h{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.fd-adetail-h>div>b{display:block;font-size:17px;font-weight:600}.fd-adetail-h>div>small{display:block;color:var(--faint);font-size:12.5px}
.fd-modal .fd-stat b{font-size:clamp(20px,2.4vw,26px);overflow-wrap:anywhere}
.fd-tgrid.fd-assets-grid{align-items:start}
.fd-adl{display:grid;grid-template-columns:1fr 1fr;gap:12px 18px;margin-top:16px;padding:14px 16px;border:1px solid var(--line);border-radius:12px}
.fd-adl span{display:block;font-size:11.5px;color:var(--faint)}.fd-adl b{display:block;font-weight:600;font-size:13.5px;overflow-wrap:anywhere}
.fd-txsum{display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:4px}
.fd-txsum span{font-size:12px;color:var(--faint)}.fd-txsum b{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:var(--gilt2);font-variant-numeric:lining-nums tabular-nums}.fd-txsum small{font-size:12px;color:var(--faint)}
.fd-linkbtn{background:none;border:0;padding:0;color:var(--gilt2);font:inherit;font-size:12px;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
@media (max-width:900px){.fd-hold-a{grid-column:1/-1}.fd-adl{grid-template-columns:1fr}.fd-ahit-r{max-width:34%}}
.fd-modal.xl{max-width:1080px}
.fd-aud{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:24px;align-items:start}
.fd-aud-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}
.fd-aud-h h4{margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--gilt2);font-weight:600}
.fd-aud-box{border:1px solid var(--line2);border-radius:12px;background:rgba(10,22,40,.35);overflow:hidden}
.fd-aud-all{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px;min-height:46px;border-bottom:1px solid var(--line);font-size:13px;color:var(--muted)}
.fd-aud-all label{display:flex;align-items:center;gap:10px;cursor:pointer}
.fd-aud-rows{max-height:min(46vh,380px);overflow:auto;overscroll-behavior:contain}
.fd-aud-row{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;border-top:1px solid var(--line)}
.fd-aud-row:first-child{border-top:0}
.fd-aud-row:hover{background:rgba(239,233,220,.025)}
.fd-aud-row label{display:flex;gap:12px;align-items:flex-start;flex:1;min-width:0;cursor:pointer}
.fd-aud input[type=checkbox]{width:18px;height:18px;margin:2px 0 0;accent-color:#C9A961;flex-shrink:0;cursor:pointer}
.fd-aud-main{display:flex;flex-direction:column;gap:1px;min-width:0}
.fd-aud-main b{font-size:14px;font-weight:600;color:var(--text);overflow-wrap:anywhere}
.fd-aud-main small{font-size:12.5px;color:var(--muted);overflow-wrap:anywhere}
.fd-aud-doubt{color:var(--amber)!important;font-size:12.5px}
.fd-aud-tags{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;align-items:center;flex-shrink:0;max-width:48%}
.fd-aud-row.off label{cursor:not-allowed}
.fd-aud-row.off .fd-aud-main{opacity:.55}
.fd-aud-add{padding:12px 14px;border-top:1px solid var(--line);background:rgba(10,22,40,.3)}
.fd-aud-addrow{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) auto;gap:8px;align-items:center}
.fd-aud-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}
.fd-aud-tiles{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.fd-aud-tile{display:flex;gap:14px;align-items:center;text-align:left;width:100%;padding:16px;border:1px solid var(--line2);border-radius:12px;background:rgba(10,22,40,.4);color:var(--text);cursor:pointer;font:inherit;transition:border-color .15s,background .15s}
.fd-aud-tile:hover:not(:disabled){border-color:rgba(201,169,97,.55);background:var(--giltsoft)}
.fd-aud-tile:focus-visible{outline:2px solid var(--gilt2);outline-offset:2px}
.fd-aud-tile:disabled{opacity:.55;cursor:not-allowed}
.fd-aud-tile b{display:block;font-size:15px;font-weight:600}
.fd-aud-tile small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.fd-aud-tile>span:nth-child(2){flex:1;min-width:0}
.fd-aud-ico{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;background:var(--giltsoft);color:var(--gilt2);flex-shrink:0}
.fd-aud-go{color:var(--gilt);font-size:18px}
@media (max-width:900px){.fd-aud{grid-template-columns:1fr}.fd-aud-rows{max-height:none}}
@media (max-width:640px){.fd-aud-tiles{grid-template-columns:1fr}.fd-aud-row{flex-wrap:wrap}.fd-aud-row label{flex:1 1 100%}.fd-aud-tags{max-width:none;justify-content:flex-start;padding-left:30px}.fd-aud-addrow{grid-template-columns:1fr}.fd-aud-foot .fd-actions{width:100%}.fd-aud-foot .fd-btn{flex:1}}
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
.fd-chan{cursor:grab;display:flex;flex-direction:column;transition:border-color .15s,opacity .15s,transform .15s}
.fd-chan.dragging{opacity:.45}
.fd-chan.over{border-color:var(--gold,#C9A961);transform:translateY(-2px)}
.fd-grip{color:var(--muted);font-size:16px;line-height:1;cursor:grab;user-select:none}
.fd-pos{flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1px solid rgba(201,169,97,.55);color:#E3C98A;font-size:11.5px;display:inline-flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
.fd-chan-move{display:flex;gap:8px;justify-content:space-between;margin-top:auto;padding-top:14px}
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
  ICON.assets = I(<><path d="M4 19V5M4 19h16" /><path d="M7.5 15l3.5-4 3 2.5L19 8" /><path d="M15.5 8H19v3.5" /></>);
  ICON.costs = I(<><path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" /><path d="M9 8.5h6M9 12h6M9 15.5h3" /></>);
  // Foundation office consoles reuse the matching section icon in their sidebar header.
  ICON.email = ICON.contact; ICON.security = ICON.shield; ICON.impact = ICON.report;

  // ---------------- small UI ----------------
  function Modal({ title, sub, onClose, wide, xl, children }) {
    useEffect(() => {
      const k = e => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", k);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
    }, []);
    return (
      <div className="fd-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={"fd-modal" + (xl ? " xl" : wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label={title}>
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
  const CURS = [["USD", "$"], ["IDR", "Rp"], ["TRY", "\u20BA"], ["EUR", "\u20AC"], ["SGD", "S$"], ["BTC", "\u20BF"]];
  const curSym = c => (CURS.find(x => x[0] === c) || ["", c + " "])[1];
  const fmtCur = (c, v) => c === "IDR" ? "Rp " + Math.round(Number(v) || 0).toLocaleString("id-ID") : curSym(c) + (Number(v) || 0).toLocaleString("en-US", { maximumFractionDigits: c === "BTC" ? 8 : 2 });
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
  const BTC_ADDR = /^(bc1[02-9ac-hj-np-z]{8,87}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/i;
  function ChannelsDialog({ store, onClose }) {
    const [cfg, setCfg] = useState(() => store.getPaymentConfig());
    const orig = useRef(store.getPaymentConfig());
    const set = (g, k, v) => setCfg(p => ({ ...p, [g]: { ...p[g], [k]: v } }));
    const on = g => cfg[g].enabled !== false;
    const head = (g, title) => <div className="fd-card-head" style={{ marginBottom: 10 }}><h3 className="fd-h2">{title}</h3><Switch on={on(g)} onChange={v => set(g, "enabled", v)}>{on(g) ? "Shown" : "Hidden"}</Switch></div>;
    const cardBad = cfg.card.link && !/^https?:\/\//i.test(cfg.card.link.trim());
    const qrisBad = cfg.qris && cfg.qris.payload && !store.parseQris(cfg.qris.payload).ok;
    const btcBad = cfg.btc && cfg.btc.enabled !== false && !BTC_ADDR.test(String(cfg.btc.address || "").trim()) ? "Enter a Bitcoin address (starts with bc1, 1 or 3)." : "";
    // A changed USDT address keeps the old one checkable for late reports (on its own network)
    const saveAll = () => {
      const next = { ...cfg, usdt: { ...cfg.usdt } };
      const was = orig.current.usdt || {};
      if (was.address && next.usdt.address && was.address.toLowerCase() !== next.usdt.address.trim().toLowerCase()) {
        const prev = (Array.isArray(was.previous) ? was.previous : []).filter(p => p && p.address && p.address.toLowerCase() !== next.usdt.address.trim().toLowerCase());
        next.usdt.previous = [{ address: was.address, network: was.network, until: new Date().toISOString().slice(0, 10) }, ...prev.filter(p => p.address.toLowerCase() !== was.address.toLowerCase())].slice(0, 3);
      }
      store.savePaymentConfig(next); onClose();
    };
    const wireBad = !cfg.wire || cfg.wire.enabled === false ? "" : !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cfg.wire.swift || "") ? "A SWIFT code has 8 or 11 letters and numbers, e.g. JAGBIDJA." : !Object.values(cfg.wire.pockets || {}).some(v => /^[0-9]{6,20}$/.test(v || "")) && !/^[0-9]{6,20}$/.test(cfg.wire.account || "") ? "Enter at least one pocket number, digits only." : !(cfg.wire.holder || "").trim() ? "Enter the beneficiary name." : "";
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
              <div className="fd-autov">
                <Switch on={!!cfg.usdt.anyEvm} onChange={v => set("usdt", "anyEvm", v)}>This is the endowment's own wallet</Switch>
                <small>{cfg.usdt.anyEvm
                  ? "A self-custody wallet (Trust Wallet) receives at the same address on BNB Chain, Ethereum, Polygon and Arbitrum, so a gift on any of them is verified. Keep a little BNB in the wallet to pay network fees when you move USDT out."
                  : "An exchange deposit address. Only gifts on the network above are verified on their own."}</small>
              </div>
              {Array.isArray(cfg.usdt.previous) && cfg.usdt.previous.length > 0 && <p className="fd-sub" style={{ margin: "10px 0 0" }}>Still checked for late reports: {cfg.usdt.previous.map(p => <span key={p.address} className="fd-mono" style={{ display: "block", overflowWrap: "anywhere" }}>{p.address} ({p.network || "?"})</span>)}</p>}
            </div>
            <QR value={cfg.usdt.address} />
          </div>
        </div>
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("btc", "Bitcoin (BTC)")}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div className="fd-form" style={{ flex: "1 1 300px" }}>
              <Field label="BTC address" hint="From your own wallet (Trust Wallet: Receive, Bitcoin). Never a seed phrase."><input className="fd-input fd-mono" value={(cfg.btc && cfg.btc.address) || ""} onChange={e => set("btc", "address", e.target.value.trim())} spellCheck={false} /></Field>
              <Field label="Confirmations" hint="Blocks to wait before a gift counts. 2 is about 20 minutes." style={{ maxWidth: 220 }}><input className="fd-input" type="number" min="1" value={(cfg.btc && cfg.btc.confirmations) || 2} onChange={e => set("btc", "confirmations", e.target.value)} /></Field>
              <div className="fd-autov">
                <Switch on={!cfg.btc || cfg.btc.autoVerify !== false} onChange={v => set("btc", "autoVerify", v)}>Verify BTC gifts automatically</Switch>
                <small>Each reported transaction ID is read from the Bitcoin network. When it paid this address with enough confirmations, the gift is verified at its dollar value on that day and the receipt is emailed.</small>
              </div>
              {btcBad && <div className="fd-msg err" style={{ marginTop: 8 }}>{btcBad}</div>}
            </div>
            {cfg.btc && cfg.btc.address ? <QR value={cfg.btc.address} /> : null}
          </div>
        </div>
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("bank", "Bank transfer")}
          <div className="fd-grid2"><Field label="Bank"><input className="fd-input" value={cfg.bank.bank} onChange={e => set("bank", "bank", e.target.value)} /></Field><Field label="Account number"><input className="fd-input" value={cfg.bank.account} onChange={e => set("bank", "account", e.target.value)} /></Field><Field label="Account holder"><input className="fd-input" value={cfg.bank.holder} onChange={e => set("bank", "holder", e.target.value)} /></Field><Field label="Currency label"><input className="fd-input" value={cfg.bank.currency} onChange={e => set("bank", "currency", e.target.value)} /></Field></div>
        </div>
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("wire", "International wire (USD, EUR, SGD)")}
          <p className="fd-sub" style={{ margin: "0 0 12px" }}>A SWIFT transfer from any bank abroad into your foreign currency pockets, one number per currency. Donors see the number for the currency they choose. Show only the regency or city as the beneficiary address, never the home address.</p>
          <div className="fd-grid2">
            <Field label="Beneficiary name" hint="Exactly as the bank has it."><input className="fd-input" value={cfg.wire.holder || ""} onChange={e => set("wire", "holder", e.target.value)} /></Field>
            <Field label="SWIFT / BIC"><input className="fd-input fd-mono" value={cfg.wire.swift || ""} onChange={e => set("wire", "swift", e.target.value.toUpperCase().replace(/\s/g, ""))} /></Field>
            <Field label="Bank"><input className="fd-input" value={cfg.wire.bank || ""} onChange={e => set("wire", "bank", e.target.value)} /></Field>
            <Field label="Bank address"><input className="fd-input" value={cfg.wire.bankAddress || ""} onChange={e => set("wire", "bankAddress", e.target.value)} /></Field>
            <Field label="Beneficiary address" hint="City and country only."><input className="fd-input" value={cfg.wire.city || ""} onChange={e => set("wire", "city", e.target.value)} /></Field>
          </div>
          <div className="fd-grid3" style={{ marginTop: 4 }}>
            {["USD", "EUR", "SGD"].map(c => <Field key={c} label={c + " pocket number"} hint={c === "USD" ? "Leave a currency empty to not offer it." : null}><input className="fd-input fd-mono" inputMode="numeric" value={(cfg.wire.pockets || {})[c] || (c === "USD" && !(cfg.wire.pockets || {}).USD && cfg.wire.account ? cfg.wire.account : "")} onChange={e => set("wire", "pockets", { ...(cfg.wire.pockets || {}), [c]: e.target.value.replace(/[^0-9]/g, "") })} /></Field>)}
          </div>
          {wireBad && <div className="fd-msg err" style={{ marginTop: 8 }}>{wireBad}</div>}
        </div>
        <div className="fd-card" style={{ background: "rgba(10,22,40,.4)" }}>
          {head("card", "Card (Mastercard / Visa)")}
          <Field label="Checkout page" hint="The card button on the donate page opens this address in a new tab."><input className="fd-input" value={cfg.card.link} onChange={e => set("card", "link", e.target.value)} placeholder="https://lynk.id/brial/s/…" /></Field>
          {cardBad && <div className="fd-msg err" style={{ marginTop: 8 }}>Use a full address that starts with https://</div>}
          <Field label="Lynk fee (%)" hint="What Lynk keeps from each card payment. Used when you verify a card gift; the receipt shows the full gift." style={{ maxWidth: 220, marginTop: 12 }}><input className="fd-input" inputMode="decimal" value={cfg.card.feePct ?? 5} onChange={e => set("card", "feePct", e.target.value.replace(",", "."))} /></Field>
        </div>
        <div className="fd-actions" style={{ marginTop: 18 }}><button className="fd-btn primary" disabled={cardBad || qrisBad || !!wireBad || !!btcBad} onClick={saveAll}>Save channels</button><button className="fd-btn ghost" onClick={onClose}>Cancel</button></div>
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
  function chainLine(c, cfg, btc) {
    if (cfg && (btc ? cfg.btc && cfg.btc.autoVerify === false : cfg.autoVerify === false)) return { text: "Automatic checks are off. Check the hash on the explorer, then verify.", tone: "", again: false };
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
      default: return { text: "Needs you: " + (c.reason || "the transfer did not match.") + (c.received && !/Received/.test(c.reason || "") ? ` Received ${c.token === "BTC" ? Number(c.received).toFixed(8) + " BTC" : Number(c.received).toFixed(2) + " USDT"}${on}.` : c.network ? ` (${c.network})` : ""), tone: "bad", again: true };
    }
  }

  // ---------------- gifts paid by bank or card: confirm what arrived ----------------
  const METHOD_LABEL = { qris: "QRIS", usdt: "USDT", btc: "Bitcoin", bank: "Bank transfer", wire: "Bank wire (SWIFT)", card: "Card via Lynk", cash: "Cash", other: "Other" };
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
    const setMethod = mth => setF(p => ({ ...p, method: mth, usdTouched: false, cur: mth === "usdt" ? "USDT" : mth === "btc" ? "BTC" : mth === "bank" || mth === "qris" ? "IDR" : mth === "wire" ? (p.cur === "EUR" ? "EUR" : "USD") : p.cur === "USDT" ? "USD" : p.cur }));
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
      const txHash = (f.method === "usdt" || f.method === "btc") && f.ref.trim() ? f.ref.trim() : [label, fmtCur(f.cur === "USDT" ? "USD" : f.cur, f.paid), f.ref.trim()].filter(Boolean).join(" · ");
      try {
        await store.recordGiftByFounder({ name: f.anonymous ? "" : f.name, anonymous: f.anonymous, email: f.email, country: f.country, amount, txHash, message: f.message, date: f.date ? f.date + "T12:00:00" : null, payment });
        onSaved(okEmail(f.email) ? `Recorded and verified. The receipt is on its way to ${f.email.trim()}.` : "Recorded and verified."); onClose();
      } catch (e) { setBusy(false); alert("Could not save: " + ((e && e.message) || e)); }
    };
    return (
      <Modal wide title="Record a gift" sub="For a gift that arrived without a form from the donor. It is verified straight away and the receipt is emailed if you add an email." onClose={onClose}>
        <div className="fd-form">
          <Field label="How it was given"><div className="fd-seg">{["qris", "bank", "wire", "card", "usdt", "btc", "cash", "other"].map(k => <button key={k} type="button" className="fd-chip" aria-pressed={f.method === k} onClick={() => setMethod(k)}>{METHOD_LABEL[k]}</button>)}</div></Field>
          <div className="fd-grid2">
            <Field label="Donor's name"><input className="fd-input" value={f.name} disabled={f.anonymous} onChange={e => set("name", e.target.value)} placeholder={f.anonymous ? "Anonymous" : "Name or organisation"} /></Field>
            <Field label="Email for the receipt (optional)"><input className="fd-input" type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder="donor@example.com" /></Field>
          </div>
          <label className="fd-check"><input type="checkbox" checked={f.anonymous} onChange={e => set("anonymous", e.target.checked)} /> Anonymous on the public ledger</label>
          <div className="fd-grid3">
            <Field label="Amount"><input className="fd-input" inputMode="decimal" value={f.paid} onChange={e => set("paid", e.target.value.replace(",", "."))} placeholder="0" /></Field>
            <Field label="Currency"><select className="fd-input" value={f.cur} onChange={e => setF(p => ({ ...p, cur: e.target.value, usdTouched: false }))}>{(f.method === "usdt" ? ["USDT"] : f.method === "btc" ? ["BTC"] : f.method === "wire" ? ["USD", "EUR", "SGD"] : ["IDR", "USD", "EUR", "TRY"]).map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="Value in US dollars" hint={rate && rate !== 1 ? `1 USD = ${fmtCur(f.cur, rate)}${fx && fx.source === "estimate" ? " (estimate, please check)" : " today"}` : null}><input className="fd-input" inputMode="decimal" value={f.usd} onChange={e => setF(p => ({ ...p, usd: e.target.value.replace(",", "."), usdTouched: true }))} /></Field>
          </div>
          {card && <div className="fd-grid2"><Field label="Lynk fee (%)"><input className="fd-input" inputMode="decimal" value={f.feePct} onChange={e => set("feePct", e.target.value.replace(",", "."))} /></Field><div className="fd-sum" style={{ alignSelf: "end" }}>Lynk keeps <b>{fmtCur(f.cur, fee)}</b>; the receipt shows the full gift.</div></div>}
          <div className="fd-grid3">
            <Field label="Date received"><input className="fd-input" type="date" value={f.date} onChange={e => set("date", e.target.value)} /></Field>
            <Field label={f.method === "usdt" ? "Transaction hash" : f.method === "btc" ? "Transaction ID" : "Reference (optional)"}><input className="fd-input fd-mono" value={f.ref} onChange={e => set("ref", e.target.value)} placeholder={f.method === "card" ? "Lynk order number" : f.method === "usdt" ? "0x…" : f.method === "wire" ? "SWIFT / bank reference" : "Bank reference"} spellCheck={false} /></Field>
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
            const isBtc = !!(d.payment && d.payment.method === "btc");
            const btcId = isBtc && /^(0x)?[0-9a-f]{64}$/i.test((d.txHash || "").trim()) ? (d.txHash || "").trim().replace(/^0x/i, "").toLowerCase() : "";
            const eth = /^0x[0-9a-f]{10,}$/i.test(d.txHash || "") || !!btcId;
            const onChain = /^0x[0-9a-f]{64}$/i.test((d.txHash || "").trim()) || !!btcId;
            const ch = chain.checks && chain.checks[d.id];
            const txUrl = (d.chain && d.chain.explorer) || (ch && ch.explorer) || (btcId ? `https://mempool.space/tx/${btcId}` : `https://etherscan.io/tx/${d.txHash}`);
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
                {d.verified && d.verifiedBy === "chain" && d.chain && <div className="fd-chain"><small className="fd-rc ok">Received {d.chain.token === "BTC" ? Number(d.chain.received).toFixed(8) + " BTC (" + money(d.chain.valueUsd || d.amount) + ")" : Number(d.chain.received || d.amount).toFixed(2) + " USDT"} on {d.chain.network}{Number(d.claimedAmount) && Math.abs(Number(d.claimedAmount) - Number(d.amount)) >= 0.01 ? ` (reported ${money(d.claimedAmount)})` : ""}</small></div>}
                {!d.verified && onChain && chain.loaded && (() => { const l = chainLine(ch, chain.config, isBtc); return (
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

  // ============================================================
  // ENDOWMENT FUND: ASSETS AND OPERATING COSTS (founder only; the public site never shows any of it)
  //
  // One set of books behind two pages, kept the way endowments report:
  //  - Permanent principal: every contribution at its value on the day it came in. That covers gifts in
  //    kind at the giver's cost, cash deposited, and outside money used to buy. It is never spent.
  //  - Returns: dividends, interest, staking and other rewards, gains realised on sales (against the
  //    average cost), unrealised gains (market value against cost), less fees and taxes, plus the
  //    currency effect of holding assets that are not in dollars.
  //  - Cash accounts: sale proceeds, dividends and interest land in them by themselves; purchases and
  //    operating costs can be paid from them. Their balances are worked out, never typed in.
  //  - Operating costs: paid either from the endowment's cash, within the operating budget (up to 10%
  //    of realised returns), or by the founder personally, which never touches the fund.
  //  Net asset value = principal + returns - operating costs paid by the endowment - payouts.
  // Nothing is ever deleted: holdings are archived, transactions and costs are voided.
  // ============================================================
  const ACLASS = {
    idx: { label: "Indonesian stock", short: "IDX", color: "#C9A961" },
    us: { label: "US stock", short: "US", color: "#8DB8E8" },
    intl: { label: "Other stock", short: "Intl", color: "#A99BE0" },
    etf: { label: "ETF or fund", short: "ETF", color: "#8FD4A8" },
    bond: { label: "Bond or sukuk", short: "Bond", color: "#7FC6C9" },
    crypto: { label: "Crypto", short: "Crypto", color: "#E7B76A" },
    cash: { label: "Cash or deposit", short: "Cash", color: "#C8CFDB" },
    other: { label: "Other", short: "Other", color: "#E58686" },
  };
  const ASSET_CURS = ["IDR", "USD", "EUR", "SGD", "GBP", "JPY", "HKD", "MYR", "TRY", "AUD", "CAD"];
  const TX = {
    gift: { label: "Gift in kind", tone: "gold", hint: "An asset given to the endowment. Enter what it cost the giver, as the broker shows it. It adds to the permanent principal." },
    buy: { label: "Purchase", tone: "sky", hint: "Bought by the endowment, with money from one of its cash accounts or with new money from outside." },
    sell: { label: "Sale", tone: "warn", hint: "Sold. The gain or loss against the average cost is worked out for you, and the money goes into a cash account." },
    dividend: { label: "Dividend", tone: "ok", hint: "Cash paid to shareholders. Enter the amount before tax and the tax taken; the rest goes into a cash account." },
    interest: { label: "Interest or coupon", tone: "ok", hint: "Interest from a bond, sukuk, deposit or savings product." },
    reward: { label: "Staking or reward", tone: "ok", hint: "Units received at no cost: staking rewards, airdrops, reinvested dividends or bonus units. Their value on the day counts as income." },
    fee: { label: "Fee or tax", tone: "bad", hint: "A charge from the broker, custodian, exchange or tax office." },
    split: { label: "Split", tone: "", hint: "Units multiplied, for example 2 for a 2-for-1 split. The cost stays the same." },
  };
  const CTX = {
    deposit: { label: "Deposit", tone: "gold", hint: "New money put into the endowment. It adds to the permanent principal." },
    interest: { label: "Interest", tone: "ok", hint: "Interest the bank paid on this balance, before tax." },
    transfer: { label: "Transfer or exchange", tone: "sky", hint: "Money moved to another cash account, including a currency exchange." },
    payout: { label: "Paid out to programmes", tone: "", hint: "Returns given to the endowment's charitable programmes." },
    fee: { label: "Bank fee", tone: "bad", hint: "A charge from the bank." },
  };
  const REWARD_KIND = [["staking", "Staking reward"], ["reinvested", "Reinvested dividend"], ["bonus", "Bonus units"], ["airdrop", "Airdrop"], ["other", "Other reward"]];
  const txDef = (h, type) => ((h && h.cls === "cash") ? CTX : TX)[type] || { label: type, tone: "" };
  const isLotted = h => h && h.cls === "idx";
  const LOT = 100;
  const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const assetLogo = (cls, symbol, priceSymbol) => cls === "crypto" || cls === "cash" || cls === "other" || cls === "bond" || !symbol ? "" : "https://financialmodelingprep.com/image-stock/" + encodeURIComponent(priceSymbol || symbol) + ".png";
  const nfmt = (v, d = 2) => (Number(v) || 0).toLocaleString("en-US", { maximumFractionDigits: d });
  const aCurSym = c => ({ USD: "$", IDR: "Rp ", EUR: "€", SGD: "S$", GBP: "£", JPY: "¥", HKD: "HK$", MYR: "RM ", TRY: "₺", AUD: "A$", CAD: "C$" })[c] || "";
  const fmtNative = (cur, v) => cur === "IDR" ? "Rp " + Math.round(Number(v) || 0).toLocaleString("id-ID") : (aCurSym(cur) || cur + " ") + (Number(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const priceFmt = (cur, v) => cur === "IDR" ? "Rp " + (Number(v) || 0).toLocaleString("id-ID", Math.abs(Math.round(v * 100) - Math.round(v) * 100) > 0 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }) : (aCurSym(cur) || cur + " ") + (Number(v) || 0).toLocaleString("en-US", v < 1 ? { maximumFractionDigits: 6 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const qfmt = (h, q) => h.cls === "cash" ? fmtNative(h.currency, q) : isLotted(h) ? `${nfmt(q / LOT, 2)} ${plural(q / LOT, "lot", "lots")} · ${nfmt(q, 0)} shares` : `${nfmt(q, h.cls === "crypto" ? 8 : 4)} ${h.cls === "crypto" ? h.symbol : "units"}`;
  const pct = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Number(v) || 0).toFixed(2) + "%";
  const sgn = (fmt, v) => (v > 0.004 ? "+" : v < -0.004 ? "−" : "") + fmt(Math.abs(v));
  const newId = p => p + "-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const usdOf = (cur, v, rate, fx) => { if (!cur || cur === "USD" || cur === "USDT") return v; const r = Number(rate) > 0 ? Number(rate) : Number(fx && fx[cur]); return r > 0 ? v / r : 0; };
  const Store_FX = store => { const f = store.FX_FALLBACK || {}, o = {}; ["IDR", "EUR", "SGD", "TRY"].forEach(k => { if (Number(f[k]) > 0) o[k] = Number(f[k]); }); return o; };
  const stripH = h => { const { id, updatedAt, ...rest } = h; return rest; };
  function downloadCsv(name, header, rows) {
    const esc = v => { let s = v == null ? "" : String(v); if (typeof v === "string" && /^[=+\-@]/.test(s) && isNaN(Number(s))) s = "'" + s; return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csv = "﻿" + [header].concat(rows).map(r => r.map(esc).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  // Operating cost categories, each with its function as nonprofits report it
  const EXP_CATS = [
    ["hosting", "Hosting, domain and infrastructure", "mg"],
    ["software", "Software and AI tools", "mg"],
    ["staff", "Salaries and management", "mg"],
    ["banking", "Banking and payment fees", "mg"],
    ["legal", "Legal, audit and compliance", "mg"],
    ["comms", "Communications and outreach", "fr"],
    ["programme", "Programme administration", "pr"],
    ["travel", "Travel", "mg"],
    ["office", "Office and supplies", "mg"],
    ["other", "Other", "mg"],
  ];
  const EXP_FN = { mg: "Management and general", fr: "Fundraising", pr: "Programme support" };
  const catLabel = k => (EXP_CATS.find(c => c[0] === k) || [k, k || "Other"])[1];
  const catFn = k => (EXP_CATS.find(c => c[0] === k) || [0, 0, "mg"])[2];
  const CAT_COLOR = { hosting: "#8DB8E8", software: "#A99BE0", staff: "#C9A961", banking: "#7FC6C9", legal: "#E58686", comms: "#E7B76A", programme: "#8FD4A8", travel: "#D9A3C7", office: "#C8CFDB", other: "#9AA4B5" };

  // ---------- reading the records ----------
  function parseRows(rows) {
    const holdings = [], expenses = [], templates = [];
    let policy = { opsShare: 10, targets: {} }, nav = { points: [], last: {}, fx: {} }, navRow = null;
    for (const r of rows || []) {
      const d = r.data || {};
      if (r.id.indexOf("A-") === 0) holdings.push({ ...d, txns: d.txns || [], id: r.id, name: d.name || r.name || r.id, updatedAt: r.updated_at });
      else if (r.id.indexOf("E-") === 0) expenses.push({ ...d, id: r.id, updatedAt: r.updated_at });
      else if (r.id.indexOf("R-") === 0) templates.push({ ...d, id: r.id });
      else if (r.id === "PORTFOLIO-POLICY") policy = { ...policy, ...d };
      else if (r.id === "PORTFOLIO-NAV") { nav = { ...nav, ...d }; navRow = r; }
    }
    return { holdings, expenses, templates, policy, nav, navRow };
  }
  // Live transactions in the order they happened (same day: the order they were recorded)
  const ordered = txns => (txns || []).map((t, i) => ({ t, i })).filter(o => !o.t.void)
    .sort((a, b) => String(a.t.date).localeCompare(String(b.t.date)) || a.i - b.i).map(o => o.t);

  // One investment's position from its history (average cost method). `before` limits it to
  // transactions dated before that day, for example the holding on a dividend's ex-date.
  function position(h, fx, before) {
    const p = { qty: 0, cost: 0, avg: 0, realized: 0, realizedUsd: 0, dividends: 0, interest: 0, rewards: 0, tax: 0, fees: 0,
      divUsd: 0, intUsd: 0, rewUsd: 0, taxUsd: 0, feesUsd: 0, given: 0, newMoney: 0, fromCash: 0, principalUsd: 0, flows: [] };
    for (const t of ordered(h.txns)) {
      if (before && !(String(t.date) < before)) continue;
      const q = +t.qty || 0, amt = +t.amount || 0, fee = +t.fee || 0, tax = +t.tax || 0;
      const U = v => usdOf(h.currency, v, t.fx, fx);
      const flow = v => p.flows.push({ acct: t.cash && t.cash !== "new" ? t.cash : null, v, t });
      if (t.type === "gift") { p.qty += q; p.cost += amt + fee; p.given += amt + fee; p.principalUsd += U(amt + fee); }
      else if (t.type === "buy") {
        p.qty += q; p.cost += amt + fee;
        if (t.cash && t.cash !== "new") { p.fromCash += amt + fee; flow(-(amt + fee)); } else { p.newMoney += amt + fee; p.principalUsd += U(amt + fee); }
      } else if (t.type === "sell") {
        if (p.qty <= 0) continue;
        const sq = Math.min(q, p.qty), out = p.cost / p.qty * sq, g = amt - fee - out;
        p.realized += g; p.realizedUsd += U(g); p.cost -= out; p.qty -= sq;
        if (p.qty < 1e-12) { p.qty = 0; p.cost = 0; }
        flow(amt - fee);
      } else if (t.type === "dividend" || t.type === "interest") {
        if (t.type === "dividend") { p.dividends += amt; p.divUsd += U(amt); } else { p.interest += amt; p.intUsd += U(amt); }
        p.tax += tax; p.taxUsd += U(tax); flow(amt - tax);
      } else if (t.type === "reward") { p.qty += q; p.cost += amt; p.rewards += amt; p.rewUsd += U(amt); }
      else if (t.type === "fee") { p.fees += amt; p.feesUsd += U(amt); if (t.cash && t.cash !== "new") flow(-amt); else p.principalUsd += U(amt); }
      else if (t.type === "split") { const r = +t.ratio || 1; if (r > 0) p.qty *= r; }
    }
    p.avg = p.qty > 0 ? p.cost / p.qty : 0;
    p.earned = p.realized + p.dividends + p.interest + p.rewards - p.tax - p.fees;
    return p;
  }

  // The whole fund: every holding valued, cash balances worked out, returns split by source.
  function book(S, prices, fx) {
    const U = (cur, v, rate) => usdOf(cur, v, rate, fx);
    const cash = {};
    const C = id => cash[id] || (cash[id] = { bal: 0, lines: [] });
    const T = { nav: 0, principal: 0, div: 0, int: 0, rew: 0, gains: 0, tax: 0, fees: 0, unreal: 0, opsEndow: 0, opsFounder: 0, payouts: 0, cashUsd: 0, list: [], missing: 0, first: null, given: 0, deposits: 0, newMoney: 0 };
    const seen = d => { if (d && (!T.first || d < T.first)) T.first = d; };
    for (const h of S.holdings.filter(x => x.cls !== "cash")) {
      const p = position(h, fx);
      T.principal += p.principalUsd; T.div += p.divUsd; T.int += p.intUsd; T.rew += p.rewUsd; T.gains += p.realizedUsd; T.tax += p.taxUsd; T.fees += p.feesUsd;
      ordered(h.txns).forEach(t => { seen(t.date); if (t.type === "gift") T.given += U(h.currency, (+t.amount || 0) + (+t.fee || 0), t.fx); if (t.type === "buy" && (!t.cash || t.cash === "new")) T.newMoney += U(h.currency, (+t.amount || 0) + (+t.fee || 0), t.fx); });
      p.flows.forEach(f => { const c = C(f.acct || "CASH?" + h.currency); c.cur = c.cur || h.currency; c.bal += f.v; c.lines.push({ date: f.t.date, v: f.v, label: txDef(h, f.t.type).label + " · " + (h.symbol || h.name), ref: h.id }); });
      const q = prices[h.id];
      const price = q && q.price ? q.price : (Number(h.manualPrice) > 0 ? Number(h.manualPrice) : null);
      const mvNative = price != null ? p.qty * price : p.cost;
      if (price == null && p.qty > 0) T.missing++;
      const x = { h, p, price, mvNative, unrealNative: price != null ? mvNative - p.cost : 0 };
      x.mvUsd = U(h.currency, mvNative); x.unrealUsd = U(h.currency, x.unrealNative);
      T.list.push(x); T.nav += x.mvUsd; T.unreal += x.unrealUsd;
    }
    const cashH = S.holdings.filter(x => x.cls === "cash");
    for (const h of cashH) {
      const c = C(h.id); c.cur = h.currency;
      for (const t of ordered(h.txns)) {
        const amt = +t.amount || 0, tax = +t.tax || 0, cur = h.currency;
        seen(t.date);
        const line = (v, label) => c.lines.push({ date: t.date, v, label, own: t.id });
        if (t.type === "deposit") { c.bal += amt; T.principal += U(cur, amt, t.fx); T.deposits += U(cur, amt, t.fx); line(amt, "Deposit" + (t.from ? " · " + t.from : "")); }
        else if (t.type === "interest") { c.bal += amt - tax; T.int += U(cur, amt, t.fx); T.tax += U(cur, tax, t.fx); line(amt - tax, "Interest" + (tax ? " after tax" : "")); }
        else if (t.type === "fee") { c.bal -= amt; T.fees += U(cur, amt, t.fx); line(-amt, "Bank fee"); }
        else if (t.type === "payout") { c.bal -= amt; T.payouts += U(cur, amt, t.fx); line(-amt, "Paid out" + (t.programme ? " · " + t.programme : "")); }
        else if (t.type === "transfer") {
          c.bal -= amt; const to = S.holdings.find(x => x.id === t.to);
          line(-amt, "Transfer to " + (to ? to.name : "another account"));
          const d = C(t.to); d.bal += +t.amountIn || 0; d.lines.push({ date: t.date, v: +t.amountIn || 0, label: "Transfer from " + h.name, ref: h.id });
        }
      }
    }
    for (const e of S.expenses) {
      if (e.void) continue;
      const amt = +e.amount || 0, usd = U(e.currency, amt, e.fx);
      if (e.paidFrom && e.paidFrom !== "founder") { T.opsEndow += usd; const c = C(e.paidFrom); c.bal -= amt; c.lines.push({ date: e.date, v: -amt, label: "Operating cost · " + (e.payee || catLabel(e.category)), exp: e.id }); }
      else T.opsFounder += usd;
    }
    const cashRows = cashH.map(h => ({ h, c: C(h.id) }));
    Object.keys(cash).filter(k => k.indexOf("CASH?") === 0).forEach(k => cashRows.push({ h: { id: k, cls: "cash", currency: k.slice(5), symbol: k.slice(5), name: "Cash, account not set", virtual: true, txns: [] }, c: cash[k] }));
    for (const { h, c } of cashRows) {
      c.lines.sort((a, b) => String(a.date).localeCompare(String(b.date)));
      const x = { h, p: { qty: c.bal, cost: c.bal, avg: 1, earned: 0 }, price: 1, mvNative: c.bal, unrealNative: 0, unrealUsd: 0, mvUsd: U(h.currency, c.bal), cash: c };
      T.list.push(x); T.nav += x.mvUsd; T.cashUsd += x.mvUsd;
    }
    T.realised = T.div + T.int + T.rew + T.gains - T.tax - T.fees;
    T.totalReturn = T.nav + T.opsEndow + T.payouts - T.principal;
    T.fxEffect = T.totalReturn - T.realised - T.unreal;
    if (Math.abs(T.fxEffect) < 0.005) T.fxEffect = 0;
    T.share = Math.min(10, Math.max(0, Number(S.policy.opsShare) || 0));
    T.allowance = Math.max(0, T.realised) * T.share / 100;
    T.available = T.allowance - T.opsEndow;
    T.gap = T.nav - T.principal;
    T.cashAccts = cashRows.filter(r => !r.h.virtual && !r.h.archived).map(r => ({ id: r.h.id, name: r.h.name, currency: r.h.currency, custodian: r.h.custodian || "", bal: r.c.bal }));
    return T;
  }

  // ---------- recurring costs: each payment is written on its date, once ----------
  function dueDates(tpl, until) {
    const out = [];
    const s = new Date(String(tpl.start) + "T00:00:00Z");
    if (isNaN(s)) return out;
    const day = s.getUTCDate();
    for (let i = 0; i < 400; i++) {
      const yearly = tpl.every === "year";
      const y = s.getUTCFullYear() + (yearly ? i : Math.floor((s.getUTCMonth() + i) / 12));
      const m = yearly ? s.getUTCMonth() : (s.getUTCMonth() + i) % 12;
      const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const d = new Date(Date.UTC(y, m, Math.min(day, last))).toISOString().slice(0, 10);
      if (d > until || (tpl.end && d > tpl.end)) break;
      out.push(d);
    }
    return out;
  }
  const nextDue = tpl => { const t = todayISO(), far = new Date(Date.now() + 400 * 864e5).toISOString().slice(0, 10); return dueDates(tpl, far).find(d => d > t) || null; };
  const recurId = (tpl, d) => "E-" + tpl.id.slice(2) + "-" + d.replace(/-/g, "");
  async function postRecurring(store, rows) {
    const S = parseRows(rows);
    const have = new Set(S.expenses.map(e => e.id));
    const day = todayISO(), todo = [];
    for (const t of S.templates) {
      if (t.paused) continue;
      for (const d of dueDates(t, day)) if (d >= (t.from || t.start) && !have.has(recurId(t, d))) todo.push({ t, d });
    }
    if (!todo.length) return 0;
    let rates = {};
    try { rates = (store.fxRates && await store.fxRates()) || {}; } catch (e) {}
    let n = 0;
    for (const { t, d } of todo.slice(0, 48)) {
      const data = { kind: "expense", date: d, payee: t.payee, category: t.category, fn: t.fn || catFn(t.category), programme: t.programme || "", desc: t.desc || "",
        amount: Number(t.amount) || 0, currency: t.currency, fx: t.currency === "USD" ? null : (Number(rates[t.currency]) || null), paidFrom: t.paidFrom || "founder", tpl: t.id, auto: true, createdAt: new Date().toISOString() };
      try { await store.saveAsset({ id: recurId(t, d), name: ((t.payee || "Cost") + " · " + d).slice(0, 160), data }); n++; } catch (e) { break; }
    }
    return n;
  }
  function usePortfolio(store) {
    const [rows, setRows] = useState(null);
    const [err, setErr] = useState("");
    const load = useCallback(async () => {
      try { const r = await store.listAssets(); setRows(r); setErr(""); return r; }
      catch (e) { setErr("Could not load the records. Check your connection and refresh."); setRows(x => x || []); return null; }
    }, [store]);
    useEffect(() => {
      let on = true;
      (async () => { const r = await load(); if (r && on) { const n = await postRecurring(store, r); if (n && on) load(); } })();
      return () => { on = false; };
    }, [load]);
    const S = useMemo(() => parseRows(rows || []), [rows]);
    return { rows, err, load, ...S };
  }

  function AssetLogo({ h, size = 38 }) {
    const [bad, setBad] = useState(false);
    const src = h.logo || assetLogo(h.cls, h.symbol, h.priceSymbol);
    useEffect(() => { setBad(false); }, [src]);
    if (h.cls === "cash") return <span className="fd-alogo cash" style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}><b style={{ fontSize: size * 0.3 }}>{aCurSym(h.currency).trim() || h.currency}</b></span>;
    const letters = String(h.symbol || h.name || "?").replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "?";
    let hue = 0; for (const c of letters) hue = (hue * 31 + c.charCodeAt(0)) % 360;
    return (
      <span className="fd-alogo" style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}>
        {src && !bad ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} />
          : <b style={{ background: `hsl(${hue} 32% 26%)`, fontSize: size * (letters.length > 3 ? 0.26 : 0.32) }}>{letters}</b>}
      </span>
    );
  }

  // ---------- one transaction ----------
  function TxForm({ h, held, heldAt, cashAccts, initial, types, onSubmit, onCancel, submitLabel = "Save" }) {
    const lotted = isLotted(h), isCash = h.cls === "cash";
    const DEF = isCash ? CTX : TX;
    const allowed = types || Object.keys(DEF);
    const same = (cashAccts || []).filter(a => a.currency === h.currency && a.id !== h.id);
    const others = (cashAccts || []).filter(a => a.id !== h.id);
    const [t, setT] = useState(() => ({ type: allowed[0], date: todayISO(), qtyIn: "", priceMode: "avg", priceIn: "", totalIn: "", fee: "", amount: "", amountTouched: false, tax: "", taxTouched: false, taxPct: "", perShare: "", ratio: "", note: "", cash: "", to: "", amountIn: "", from: "", programme: "", kind: "staking", ...(initial || {}) }));
    const set = (k, v) => setT(p => ({ ...p, [k]: v }));
    const D = DEF[t.type] || {};
    const num = s => { const v = parseFloat(String(s).replace(/,/g, "").replace(/\s/g, "")); return isFinite(v) ? v : NaN; };
    const unit = lotted ? "share" : h.cls === "crypto" ? "coin" : "unit";
    const hasQty = !isCash && ["gift", "buy", "sell", "reward"].includes(t.type);
    const shares = (num(t.qtyIn) || 0) * (lotted ? LOT : 1);
    const total = hasQty ? (t.priceMode === "avg" ? shares * (num(t.priceIn) || 0) : num(t.totalIn) || 0) : 0;
    const fee = num(t.fee) > 0 ? num(t.fee) : 0;
    const heldOn = heldAt && t.date ? heldAt(t.date) : held;
    const round = v => h.currency === "IDR" ? Math.round(v) : Math.round(v * 100) / 100;
    const grossAuto = t.type === "dividend" && num(t.perShare) > 0 ? round(num(t.perShare) * heldOn) : NaN;
    const amountShown = t.amountTouched || !(grossAuto > 0) ? t.amount : String(grossAuto);
    const amountVal = num(amountShown);
    const taxAuto = num(t.taxPct) > 0 && amountVal > 0 ? round(amountVal * num(t.taxPct) / 100) : NaN;
    const taxShown = t.taxTouched || !(taxAuto >= 0) ? t.tax : String(taxAuto);
    const taxVal = num(taxShown) > 0 ? num(taxShown) : 0;
    const target = others.find(a => a.id === t.to);
    const amountInShown = t.amountIn !== "" ? t.amountIn : target && target.currency === h.currency ? amountShown : "";
    const cashMode = { buy: "from", fee: "from", sell: "into", dividend: "into", interest: "into" }[t.type];
    const defaultCash = () => {
      if (cashMode === "from") { const need = t.type === "buy" ? total + fee : amountVal || 0; const a = same.find(x => x.bal >= need - 1e-9 && need > 0); return a ? a.id : "new"; }
      const m = same.find(a => a.custodian === (h.custodian || "")) || same[0];
      return m ? m.id : "auto";
    };
    const cashSel = isCash || !cashMode ? "" : (t.cash || defaultCash());
    const chosen = same.find(a => a.id === cashSel);
    const problems = [];
    if (!t.date) problems.push("Choose a date.");
    else if (t.date > todayISO()) problems.push("The date cannot be in the future.");
    if (hasQty && !(shares > 0)) problems.push(lotted ? "Enter the number of lots." : "Enter the quantity.");
    if (t.type === "sell" && shares > held + 1e-9) problems.push(`You hold ${qfmt(h, held)}. You cannot sell more than that.`);
    if (hasQty && t.type !== "reward" && !(total > 0)) problems.push(t.priceMode === "avg" ? "Enter the price." : "Enter the total.");
    if (t.type === "reward" && !(total >= 0)) problems.push("Enter the value on the day, or 0.");
    if (["dividend", "interest", "fee", "deposit", "payout", "transfer"].includes(t.type) && !(amountVal > 0)) problems.push("Enter the amount.");
    if ((t.type === "dividend" || t.type === "interest") && taxVal >= amountVal && amountVal > 0) problems.push("The tax must be less than the amount.");
    if (t.type === "split" && !(num(t.ratio) > 0)) problems.push("Enter the ratio, for example 2.");
    if (t.type === "transfer" && !t.to) problems.push("Choose the account that receives it.");
    if (t.type === "transfer" && t.to && !(num(amountInShown) > 0)) problems.push("Enter the amount that arrives.");
    if (isCash && ["fee", "payout", "transfer"].includes(t.type) && amountVal > held + 1e-9) problems.push(`The balance is ${fmtNative(h.currency, held)}.`);
    if (cashMode === "from" && chosen) { const need = t.type === "buy" ? total + fee : amountVal; if (need > chosen.bal + 1e-9) problems.push(`${chosen.name} holds ${fmtNative(h.currency, chosen.bal)}. Choose another way to pay.`); }
    const touched = t.qtyIn || t.priceIn || t.totalIn || t.amount || t.perShare || t.ratio;
    const submit = () => {
      if (problems.length) return;
      const out = { id: newId("T"), type: t.type, date: t.date };
      if (t.note.trim()) out.note = t.note.trim().slice(0, 300);
      if (hasQty) { out.qty = shares; out.amount = Math.round(total * 1e6) / 1e6; if (t.type !== "reward") out.fee = fee; }
      if (t.type === "reward") out.kind = t.kind;
      if (["dividend", "interest", "fee", "deposit", "payout", "transfer"].includes(t.type)) out.amount = amountVal;
      if (t.type === "dividend" || t.type === "interest") out.tax = taxVal;
      if (t.type === "dividend" && num(t.perShare) > 0) out.perShare = num(t.perShare);
      if (t.evKey) out.evKey = t.evKey;
      if (t.type === "split") out.ratio = num(t.ratio);
      if (t.type === "transfer") { out.to = t.to; out.amountIn = num(amountInShown); }
      if (t.type === "deposit" && t.from.trim()) out.from = t.from.trim().slice(0, 120);
      if (t.type === "payout" && t.programme.trim()) out.programme = t.programme.trim().slice(0, 120);
      if (cashSel) out.cash = cashSel;
      onSubmit(out);
    };
    const money = (label, key, ph, hint) => <Field label={label} hint={hint}><input className="fd-input" inputMode="decimal" value={key === "amount" ? amountShown : key === "tax" ? taxShown : t[key]} placeholder={ph || "0"}
      onChange={e => setT(p => ({ ...p, [key]: e.target.value, ...(key === "amount" ? { amountTouched: true } : key === "tax" ? { taxTouched: true } : {}) }))} /></Field>;
    return (
      <div className="fd-form">
        <div className="fd-grid2">
          <Field label="Type">{allowed.length > 1 ? <select className="fd-input" value={t.type} onChange={e => setT(p => ({ ...p, type: e.target.value, cash: "" }))}>{allowed.map(k => <option key={k} value={k}>{DEF[k].label}</option>)}</select> : <input className="fd-input" value={D.label} readOnly />}</Field>
          <Field label={t.type === "dividend" ? "Ex-date" : "Date"} hint={t.type === "dividend" && heldAt ? `Held before this date: ${qfmt(h, heldOn)}` : ""}><input className="fd-input" type="date" value={t.date} max={todayISO()} onChange={e => set("date", e.target.value)} /></Field>
        </div>
        <p className="fd-sub" style={{ margin: "-4px 0 4px" }}>{D.hint}</p>
        {hasQty && (
          <div className="fd-grid2">
            <Field label={lotted ? "Lots" : t.type === "reward" ? "Units received" : "Quantity"} hint={lotted ? `1 lot = ${LOT} shares${shares > 0 ? ` · ${nfmt(shares, 0)} shares` : ""}` : h.cls === "crypto" ? "Up to 8 decimals" : ""}>
              <input className="fd-input" inputMode="decimal" value={t.qtyIn} onChange={e => set("qtyIn", e.target.value)} placeholder={lotted ? "10" : "1"} />
            </Field>
            <Field label={(t.type === "reward" ? (t.priceMode === "avg" ? `Value per ${unit} on the day` : "Total value on the day") : t.priceMode === "avg" ? `Price per ${unit}` : t.type === "sell" ? "Total received" : "Total")+ ` (${h.currency})`}
              hint={<button type="button" className="fd-linkbtn" onClick={() => set("priceMode", t.priceMode === "avg" ? "total" : "avg")}>{t.priceMode === "avg" ? "Enter the total instead" : "Enter the price instead"}</button>}>
              {t.priceMode === "avg" ? <input className="fd-input" inputMode="decimal" value={t.priceIn} onChange={e => set("priceIn", e.target.value)} placeholder={lotted ? "3500" : "100"} />
                : <input className="fd-input" inputMode="decimal" value={t.totalIn} onChange={e => set("totalIn", e.target.value)} placeholder={lotted ? "3500000" : "1000"} />}
            </Field>
          </div>
        )}
        {t.type === "reward" && <Field label="Kind of reward"><select className="fd-input" value={t.kind} onChange={e => set("kind", e.target.value)}>{REWARD_KIND.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>}
        {hasQty && t.type !== "reward" && (
          <div className="fd-grid2">
            {money(`Fees (${h.currency}, optional)`, "fee")}
            <div className="fd-txsum">{total > 0 && shares > 0 ? <><span>{t.type === "sell" ? "You receive" : t.type === "gift" ? "Value added to the principal" : "Total cost"}</span><b>{fmtNative(h.currency, total + (t.type === "sell" ? -fee : fee))}</b><small>{priceFmt(h.currency, total / shares)} per {unit}</small></> : null}</div>
          </div>
        )}
        {t.type === "dividend" && <Field label={`Dividend per share (${h.currency}, optional)`} hint="Fills in the amount from what you held. Change the amount if your broker shows a different figure."><input className="fd-input" inputMode="decimal" value={t.perShare} onChange={e => set("perShare", e.target.value)} placeholder="0" /></Field>}
        {(t.type === "dividend" || t.type === "interest") && (
          <div className="fd-grid2">
            {money(`Amount before tax (${h.currency})`, "amount")}
            <Field label={`Tax taken (${h.currency})`} hint={<span>{[["0", "None"], ["10", "10%"], ["15", "15%"], ["20", "20%"]].map(([v, l]) => <button key={v} type="button" className="fd-linkbtn" style={{ marginRight: 10 }} onClick={() => setT(p => ({ ...p, taxPct: v, taxTouched: false, tax: "" }))}>{l}</button>)}</span>}>
              <input className="fd-input" inputMode="decimal" value={taxShown} placeholder="0" onChange={e => setT(p => ({ ...p, tax: e.target.value, taxTouched: true }))} />
            </Field>
          </div>
        )}
        {(t.type === "dividend" || t.type === "interest") && amountVal > 0 && <div className="fd-txsum" style={{ paddingBottom: 0 }}><span>Received after tax</span><b>{fmtNative(h.currency, amountVal - taxVal)}</b></div>}
        {["fee", "deposit", "payout", "transfer"].includes(t.type) && money(`${t.type === "transfer" ? "Amount sent" : "Amount"} (${h.currency})`, "amount")}
        {t.type === "deposit" && <Field label="From (optional)"><input className="fd-input" value={t.from} maxLength={120} onChange={e => set("from", e.target.value)} placeholder="Founder, a donor, verified donations of October…" /></Field>}
        {t.type === "payout" && <Field label="Programme"><input className="fd-input" value={t.programme} maxLength={120} onChange={e => set("programme", e.target.value)} placeholder="Scholarships, clean water…" /></Field>}
        {t.type === "transfer" && (
          <div className="fd-grid2">
            <Field label="To account">{others.length ? <select className="fd-input" value={t.to} onChange={e => set("to", e.target.value)}><option value="">Choose…</option>{others.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select> : <input className="fd-input" readOnly value="Add another cash account first" />}</Field>
            {target && <Field label={`Amount that arrives (${target.currency})`} hint={target.currency !== h.currency ? "After the exchange and any charge" : ""}><input className="fd-input" inputMode="decimal" value={amountInShown} onChange={e => set("amountIn", e.target.value)} /></Field>}
          </div>
        )}
        {t.type === "split" && <Field label="Ratio" hint="New units for each old one: 2 for a 2-for-1 split, 0.1 for a 1-for-10 reverse split."><input className="fd-input" inputMode="decimal" value={t.ratio} onChange={e => set("ratio", e.target.value)} placeholder="2" /></Field>}
        {cashMode && (
          <Field label={cashMode === "from" ? "Paid with" : "Money goes into"} hint={cashSel === "new" ? (t.type === "fee" ? "Paid from outside the fund, so it counts as a contribution." : "Money from outside the fund, so it adds to the permanent principal.") : cashSel === "auto" ? "A cash account is created for you." : ""}>
            <select className="fd-input" value={cashSel} onChange={e => set("cash", e.target.value)}>
              {same.map(a => <option key={a.id} value={a.id}>{a.name} · {fmtNative(a.currency, a.bal)}</option>)}
              {cashMode === "from" && <option value="new">{t.type === "fee" ? "Paid from outside the fund" : "New money from outside"}</option>}
              {cashMode === "into" && !same.some(a => a.custodian === (h.custodian || "")) && <option value="auto">New cash account{h.custodian ? " at " + h.custodian.replace(/\s*\(.*\)$/, "") : ""} ({h.currency})</option>}
            </select>
          </Field>
        )}
        <Field label="Note (optional)"><input className="fd-input" value={t.note} maxLength={300} onChange={e => set("note", e.target.value)} placeholder="Broker reference, reason or anything worth keeping" /></Field>
        {problems.length > 0 && touched && <small className="fd-bad">{problems[0]}</small>}
        <div className="fd-actions" style={{ marginTop: 6 }}>
          <button className="fd-btn primary" disabled={problems.length > 0} onClick={submit}>{submitLabel}</button>
          {onCancel && <button className="fd-btn ghost" onClick={onCancel}>Cancel</button>}
        </div>
      </div>
    );
  }

  // ---------- the Assets page ----------
  function AssetsView({ store, go }) {
    const P = usePortfolio(store);
    const { rows, err, load, holdings, policy, nav, navRow } = P;
    const [live, setLive] = useState(null);
    const [events, setEvents] = useState({});
    const [busy, setBusy] = useState("");
    const [view, setView] = useState("USD");
    const [adding, setAdding] = useState(false);
    const [openId, setOpenId] = useState(null);
    const [recording, setRecording] = useState(null);
    const [policyOpen, setPolicyOpen] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [m, flash] = useFlash();
    const Pref = useRef(P); Pref.current = P;

    const pricesOf = (navLast, lv) => { const o = { ...(navLast || {}) }; if (lv && lv.quotes) Object.entries(lv.quotes).forEach(([k, q]) => { if (q && q.price) o[k] = { price: q.price, prev: q.prevClose, at: q.at, source: q.source }; }); return o; };
    const lastPrices = pricesOf(nav.last, live);
    const fx = { USD: 1, USDT: 1, ...Store_FX(store), ...nav.fx, ...((live && live.fx) || {}) };
    const T = book(P, lastPrices, fx);

    const refresh = useCallback(async quiet => {
      const S = Pref.current;
      const list = S.holdings.filter(h => h.cls !== "cash" && !h.archived && h.source && h.priceSymbol);
      const curs = [...new Set(["IDR"].concat(S.holdings.map(h => h.currency), S.expenses.map(e => e.currency)).filter(Boolean))];
      setBusy("prices");
      try {
        const r = await store.assetQuotes(list.map(h => ({ key: h.id, source: h.source, symbol: h.priceSymbol })), curs);
        setLive(r);
        const lastAt = S.navRow && S.navRow.updated_at ? new Date(S.navRow.updated_at).getTime() : 0;
        if (Date.now() - lastAt > 6 * 3600e3 || !(S.nav.points || []).length) {
          const prices = pricesOf(S.nav.last, r), fx2 = { USD: 1, USDT: 1, ...Store_FX(store), ...S.nav.fx, ...(r.fx || {}) };
          const B = book(S, prices, fx2), day = todayISO();
          const points = (S.nav.points || []).filter(p => p.d !== day).concat([{ d: day, mv: Math.round(B.nav * 100) / 100, p: Math.round(B.principal * 100) / 100 }]).slice(-1500);
          await store.saveAsset({ id: "PORTFOLIO-NAV", name: "__nav__", data: { points, last: prices, fx: { ...S.nav.fx, ...(r.fx || {}) }, at: r.at } });
          load();
        }
        if (!quiet) flash("Prices updated.");
      } catch (e) { if (!quiet) flash("Could not reach the price services. Showing the last saved prices.", "err"); }
      setBusy("");
    }, [store]);
    const started = useRef(false);
    useEffect(() => {
      if (!rows || started.current) return;
      started.current = true;
      refresh(true);
      const items = holdings.filter(h => !h.archived && h.source === "yahoo" && ["idx", "us", "intl", "etf"].includes(h.cls) && ordered(h.txns).length)
        .map(h => ({ key: h.id, symbol: h.priceSymbol, since: ordered(h.txns)[0].date }));
      if (items.length && store.assetEvents) store.assetEvents(items).then(r => setEvents((r && r.events) || {})).catch(() => {});
    }, [rows]);

    const save = async (h, data) => { await store.saveAsset({ id: h.id, name: (data.symbol && data.cls !== "cash" ? data.symbol + " · " : "") + (data.name || h.name), data }); await load(); };
    const ensureCash = async (cur, custodian) => {
      const found = Pref.current.holdings.find(x => x.cls === "cash" && !x.archived && x.currency === cur && (x.custodian || "") === (custodian || ""));
      if (found) return found.id;
      const id = "A-CASH-" + cur + "-" + Date.now().toString(36).toUpperCase();
      const name = (custodian ? "Cash at " + custodian.replace(/\s*\(.*\)$/, "") : "Cash") + " (" + cur + ")";
      await store.saveAsset({ id, name, data: { kind: "holding", cls: "cash", symbol: cur, name, currency: cur, custodian: custodian || "", holder: "Founder, in trust for The Brial Endowment", txns: [], createdAt: new Date().toISOString() } });
      return id;
    };
    const stamp = (cur, tx) => ({ ...tx, fx: cur === "USD" || cur === "USDT" ? null : (Number(fx[cur]) || null), recordedAt: new Date().toISOString() });
    const commitTx = async (h, tx) => {
      let t = stamp(h.currency, tx);
      if (t.cash === "auto") t.cash = await ensureCash(h.currency, h.custodian);
      const fresh = Pref.current.holdings.find(x => x.id === h.id) || h;
      await save(fresh, { ...stripH(fresh), txns: [...(fresh.txns || []), t] });
    };
    const heldAtFn = h => d => position(h, fx, d).qty;

    // dividends and splits the market data shows, not yet recorded
    const sugg = [];
    for (const h of holdings) {
      const ev = events[h.id];
      if (!ev || ev.error || h.archived) continue;
      const first = (ordered(h.txns)[0] || {}).date;
      if (!first) continue;
      const done = new Set((h.txns || []).map(t => t.evKey).filter(Boolean).concat(h.dismissed || []));
      (ev.dividends || []).forEach(d => { const key = "div:" + d.date; if (d.date > first && d.date <= todayISO() && !done.has(key)) { const held = position(h, fx, d.date).qty; if (held > 0) sugg.push({ h, key, kind: "div", date: d.date, per: d.amount, held }); } });
      (ev.splits || []).forEach(d => { const key = "split:" + d.date; if (d.date > first && d.date <= todayISO() && !done.has(key)) sugg.push({ h, key, kind: "split", date: d.date, ratio: d.ratio, held: position(h, fx, d.date).qty }); });
    }
    sugg.sort((a, b) => b.date.localeCompare(a.date));
    const taxGuess = h => h.cls === "idx" ? "10" : h.currency === "USD" ? "15" : "";
    const dismiss = async s => { const fresh = Pref.current.holdings.find(x => x.id === s.h.id); await save(fresh, { ...stripH(fresh), dismissed: [...(fresh.dismissed || []), s.key] }); flash("Hidden. It will not be suggested again."); };

    const toView = usd => view === "IDR" ? usd * (fx.IDR || 0) : usd;
    const vf = usd => view === "IDR" ? "Rp " + Math.round(toView(usd)).toLocaleString("id-ID") : "$" + (Number(usd) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const priceAt = (live && live.at) || nav.at;
    const exportCsv = () => {
      const out = [];
      for (const h of holdings) for (const t of (h.txns || [])) {
        const usd = usdOf(h.currency, +t.amount || 0, t.fx, fx);
        const acct = t.cash === "new" ? "New money from outside" : (holdings.find(x => x.id === t.cash) || {}).name || "";
        out.push([t.date, h.symbol || "", h.name, (ACLASS[h.cls] || {}).label || h.cls, txDef(h, t.type).label, t.qty != null ? t.qty : "", t.amount != null ? t.amount : "", t.fee || "", t.tax || "", h.currency, t.fx || (h.currency === "USD" ? 1 : ""), Math.round(usd * 100) / 100, acct, t.note || "", t.void ? "Voided" : ""]);
      }
      out.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
      downloadCsv("brial-endowment-transactions-" + todayISO() + ".csv", ["Date", "Ticker", "Holding", "Class", "Type", "Quantity", "Amount", "Fee", "Tax", "Currency", "Units per USD", "USD", "Cash account", "Note", "Status"], out);
    };

    if (err && !rows) return <><Head title="Assets" /><div className="fd-msg err">{err}</div></>;
    if (!rows) return <><Head title="Assets" /><p className="fd-sub">Loading…</p></>;
    const shown = T.list.filter(x => !x.h.archived && !(x.h.cls === "cash" && x.h.virtual && Math.abs(x.mvNative) < 1e-9));
    const archived = holdings.filter(h => h.archived);
    const byClass = {}, byCur = {};
    shown.forEach(x => { byClass[x.h.cls] = (byClass[x.h.cls] || 0) + x.mvUsd; byCur[x.h.currency] = (byCur[x.h.currency] || 0) + x.mvUsd; });
    const classes = Object.keys(ACLASS).filter(k => byClass[k] > 0 || Number(policy.targets[k]) > 0);
    const G = "minmax(0,1.9fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,1fr) minmax(0,1.05fr) minmax(0,1fr) minmax(0,.55fr)";
    const open = holdings.find(h => h.id === openId) || (openId && T.list.find(x => x.h.id === openId) || {}).h;
    const openX = open && T.list.find(x => x.h.id === open.id);
    const invCount = shown.filter(x => x.h.cls !== "cash").length;
    const since = T.first ? fdate(T.first) : "";
    return (
      <>
        <Head title="Assets" lede="What the endowment owns and what it has earned. Only you can see this page; the public site never shows the holdings.">
          <Seg items={[["USD", "USD"], ["IDR", "IDR"]]} value={view} onChange={setView} />
          <button className="fd-btn ghost sm" disabled={!!busy || !holdings.length} onClick={() => refresh(false)}>{busy === "prices" ? "Updating…" : "Refresh prices"}</button>
          <button className="fd-btn ghost sm" disabled={!holdings.length} onClick={exportCsv}>Export CSV</button>
          <button className="fd-btn primary" onClick={() => setAdding(true)}>Add asset</button>
        </Head>
        {m && <div style={{ marginBottom: 12 }}><Flash m={m} /></div>}
        <Stats items={[
          { label: "Net asset value", value: vf(T.nav), sub: `${invCount} ${plural(invCount, "investment", "investments")} · cash ${vf(T.cashUsd)}${T.missing ? ` · ${T.missing} at cost` : ""}`, tone: "ok" },
          { label: "Permanent principal", value: vf(T.principal), sub: T.principal > 0 ? (T.gap >= 0 ? `Intact · value is ${vf(T.gap)} above it` : `Below the principal by ${vf(-T.gap)}`) : "Nothing contributed yet", tone: T.gap < 0 ? "bad" : "" },
          { label: "Total return", value: sgn(vf, T.totalReturn), sub: T.principal > 0 ? `${pct(T.totalReturn / T.principal * 100)} on the principal${since ? " since " + since : ""}` : "", tone: T.totalReturn >= 0 ? "ok" : "bad" },
          { label: "Operating budget", value: vf(Math.max(0, T.available)), sub: T.available < 0 ? `Over the budget by ${vf(-T.available)}` : `${T.share}% of realised returns, after costs`, tone: T.available < 0 ? "bad" : "" },
        ]} />
        <p className="fd-sub" style={{ margin: "8px 0 18px" }}>
          {priceAt ? `Prices from Yahoo Finance and CoinGecko, ${fdatetime(priceAt)}. Indonesian prices may be delayed up to 15 minutes.` : "No prices yet. Values show at cost until prices load."}
          {fx.IDR ? ` 1 USD = Rp ${Math.round(fx.IDR).toLocaleString("id-ID")}.` : ""}
        </p>

        {sugg.length > 0 && (
          <div className="fd-card fd-sug" style={{ marginBottom: 16 }}>
            <div className="fd-card-head" style={{ marginBottom: 6 }}><div><h2 className="fd-h2" style={{ marginTop: 0 }}>Found in the market data</h2><p className="fd-sub">Paid while the endowment held the shares. Check the amount against your broker, then record it.</p></div><Tag tone="gold">{sugg.length} to review</Tag></div>
            {sugg.slice(0, 8).map(s => (
              <div className="fd-krow" key={s.h.id + s.key}>
                <div className="fd-hold-a"><AssetLogo h={s.h} size={30} /><span><b>{s.kind === "div" ? `${s.h.symbol} dividend, ${priceFmt(s.h.currency, s.per)} per share` : `${s.h.symbol} split, ${nfmt(s.ratio, 4)} for 1`}</b>
                  <small>{s.kind === "div" ? `Ex-date ${fdate(s.date)} · held ${qfmt(s.h, s.held)} · about ${fmtNative(s.h.currency, s.held * s.per)} before tax` : `On ${fdate(s.date)} · held ${qfmt(s.h, s.held)}`}</small></span></div>
                <div className="fd-actions" style={{ flexWrap: "nowrap" }}>
                  <button className="fd-btn primary sm" onClick={() => setRecording({ h: s.h, initial: s.kind === "div" ? { type: "dividend", date: s.date, perShare: String(s.per), taxPct: taxGuess(s.h), evKey: s.key } : { type: "split", date: s.date, ratio: String(s.ratio), evKey: s.key }, types: [s.kind === "div" ? "dividend" : "split"] })}>Record</button>
                  <button className="fd-btn quiet sm" onClick={() => dismiss(s)}>{s.kind === "div" ? "Not received" : "Ignore"}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {shown.length === 0 ? (
          <Empty title="No assets recorded yet">Add the first holding: a stock, an ETF, a coin, a deposit or a cash account.</Empty>
        ) : (
          <div className="fd-table">
            <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Asset</div><div>Quantity</div><div>Average cost</div><div>Last price</div><div>Market value</div><div>Gain</div><div style={{ textAlign: "right" }}>Weight</div></div>
            {shown.slice().sort((a, b) => (a.h.cls === "cash") - (b.h.cls === "cash") || b.mvUsd - a.mvUsd).map(x => {
              const h = x.h, q = lastPrices[h.id], day = q && q.prev ? (q.price / q.prev - 1) * 100 : null, isC = h.cls === "cash";
              return (
                <div className={"fd-tr fd-hold" + (isC ? " cash" : "")} key={h.id} style={{ gridTemplateColumns: G }} role="button" tabIndex={0} onClick={() => setOpenId(h.id)} onKeyDown={e => { if (e.key === "Enter") setOpenId(h.id); }}>
                  <div className="fd-td full fd-hold-a"><AssetLogo h={h} /><span><b>{isC ? h.name : h.symbol || h.name}</b>{!isC && h.symbol && <small>{h.name}</small>}<small><Tag>{ACLASS[h.cls] ? ACLASS[h.cls].short : h.cls}</Tag> {h.currency}{isC && h.custodian ? " · " + h.custodian : ""}</small></span></div>
                  <div className="fd-td" data-l="Quantity">{isC ? <b>Balance</b> : isLotted(h) ? <><b>{nfmt(x.p.qty / LOT, 2)} {plural(x.p.qty / LOT, "lot", "lots")}</b><small>{nfmt(x.p.qty, 0)} shares</small></> : <b>{nfmt(x.p.qty, h.cls === "crypto" ? 8 : 4)}</b>}</div>
                  <div className="fd-td" data-l="Average cost">{isC ? <small>·</small> : <><b>{priceFmt(h.currency, x.p.avg)}</b><small>{fmtNative(h.currency, x.p.cost)}</small></>}</div>
                  <div className="fd-td" data-l="Last price">{isC ? <small>·</small> : x.price != null ? <><b>{priceFmt(h.currency, x.price)}</b>{day != null && <small className={day >= 0 ? "fd-up" : "fd-down"}>{pct(day)} today</small>}</> : <small>No price</small>}</div>
                  <div className="fd-td" data-l="Market value"><b className={isC && x.mvNative < -0.005 ? "fd-down" : ""}>{fmtNative(h.currency, x.mvNative)}</b>{h.currency !== view && <small>{vf(x.mvUsd)}</small>}</div>
                  <div className="fd-td" data-l="Gain">{isC ? <small>·</small> : x.price != null || x.p.earned ? <><b className={x.unrealNative >= 0 ? "fd-up" : "fd-down"}>{sgn(v => fmtNative(h.currency, v), x.unrealNative)}</b><small>{x.p.cost > 0 && x.price != null ? pct(x.unrealNative / x.p.cost * 100) + " unrealised" : ""}{x.p.earned ? ` · ${sgn(v => fmtNative(h.currency, v), x.p.earned)} earned` : ""}</small></> : <small>·</small>}</div>
                  <div className="fd-td fd-amt" data-l="Weight"><b>{T.nav > 0 ? (x.mvUsd / T.nav * 100).toFixed(1) + "%" : "·"}</b></div>
                </div>
              );
            })}
          </div>
        )}
        {archived.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button className="fd-btn quiet sm" onClick={() => setShowArchived(v => !v)}>{showArchived ? "Hide" : "Show"} {archived.length} archived {plural(archived.length, "holding", "holdings")}</button>
            {showArchived && <div className="fd-table" style={{ marginTop: 8 }}>{archived.map(h => (
              <div className="fd-tr fd-hold dim" key={h.id} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }} role="button" tabIndex={0} onClick={() => setOpenId(h.id)}>
                <div className="fd-td fd-hold-a"><AssetLogo h={h} size={30} /><span><b>{h.symbol || h.name}</b><small>{h.name} · archived {h.archivedAt ? fdate(h.archivedAt) : ""}</small></span></div>
                <div className="fd-td">{h.cls !== "cash" && <small>Earned {sgn(v => fmtNative(h.currency, v), position(h, fx).earned)}</small>}</div>
              </div>))}</div>}
          </div>
        )}

        {holdings.length > 0 && (
          <div className="fd-tgrid fd-assets-grid" style={{ marginTop: 18 }}>
            <div className="fd-card">
              <h2 className="fd-h2" style={{ marginTop: 0 }}>Where the return came from</h2>
              <p className="fd-sub">Since {since || "the first record"}, in {view}. Worked out from every transaction.</p>
              {[["Dividends", T.div], ["Interest and coupons", T.int], ["Staking and other rewards", T.rew], ["Gains realised on sales", T.gains], ["Unrealised gains", T.unreal, "Market value against cost, for what is still held"], ["Fees and taxes", -(T.fees + T.tax)], ["Currency effect", T.fxEffect, "Exchange-rate moves on assets not held in dollars"]]
                .filter(([, v], i) => Math.abs(v) > 0.004 || i === 0 || i === 3 || i === 4).map(([l, v, s]) => (
                  <div className="fd-krow" key={l}><div><b>{l}</b>{s && <small>{s}</small>}</div><b className={v > 0.004 ? "fd-up" : v < -0.004 ? "fd-down" : ""}>{sgn(vf, v)}</b></div>
                ))}
              <div className="fd-krow fd-ktotal"><div><b>Total return</b><small>{T.principal > 0 ? pct(T.totalReturn / T.principal * 100) + " on the principal" : ""}</small></div><b className={T.totalReturn >= 0 ? "fd-up" : "fd-down"}>{sgn(vf, T.totalReturn)}</b></div>
              <div className="fd-recon">
                <span>Principal {vf(T.principal)}</span><span>+ return {sgn(vf, T.totalReturn)}</span>{T.opsEndow > 0.004 && <span>− operating costs {vf(T.opsEndow)}</span>}{T.payouts > 0.004 && <span>− paid out {vf(T.payouts)}</span>}<span>= net asset value <b>{vf(T.nav)}</b></span>
              </div>
              <div className="fd-sub" style={{ marginTop: 16 }}>Principal: gifts in kind {vf(T.given)}{T.deposits > 0.004 ? ` · deposits ${vf(T.deposits)}` : ""}{T.newMoney > 0.004 ? ` · new money ${vf(T.newMoney)}` : ""}.</div>
            </div>
            <div className="fd-card">
              <div className="fd-card-head"><div><h2 className="fd-h2" style={{ marginTop: 0 }}>Spending policy</h2></div><button className="fd-btn quiet sm" onClick={() => setPolicyOpen(true)}>Policy and targets</button></div>
              <p className="fd-sub" style={{ lineHeight: 1.6, marginTop: -6 }}>Internal. The principal is never spent. Up to {T.share}% of realised returns (dividends, interest, rewards and realised gains, after fees and taxes) may pay for operations. Unrealised growth is never spent.</p>
              <div className="fd-krow" style={{ borderTop: 0 }}><div><b>Realised returns</b><small>Since {since || "the start"}</small></div><b>{sgn(vf, T.realised)}</b></div>
              <div className="fd-krow"><div><b>Operating budget earned</b><small>{T.share}% of positive realised returns</small></div><b>{vf(T.allowance)}</b></div>
              <div className="fd-krow"><div><b>Paid from the endowment</b><small>Operating costs paid from its cash</small></div><b>{vf(T.opsEndow)}</b></div>
              <div className="fd-krow"><div><b>Available now</b><small>{T.available < 0 ? "Over the budget: pay new costs personally until returns catch up" : "Can pay the next operating costs"}</small></div><b className={T.available < 0 ? "fd-down" : "fd-up"}>{sgn(vf, T.available)}</b></div>
              <div className="fd-krow"><div><b>Covered by you personally</b><small>Never taken from the fund or from donations</small></div><b>{vf(T.opsFounder)}</b></div>
              {go && <button className="fd-btn ghost sm" style={{ marginTop: 12 }} onClick={() => go("costs")}>Open operating costs</button>}
              <p className="fd-sub" style={{ marginTop: 12 }}>The public site says only that 100% of every donation goes to the endowment's charitable work and its permanent principal.</p>
            </div>
            <div className="fd-card">
              <h2 className="fd-h2" style={{ marginTop: 0 }}>Allocation</h2>
              <p className="fd-sub">By asset class{Object.keys(policy.targets || {}).some(k => Number(policy.targets[k]) > 0) ? ", against your targets" : ""}.</p>
              {classes.map(k => {
                const w = T.nav > 0 ? (byClass[k] || 0) / T.nav * 100 : 0, tg = Number(policy.targets[k]) || 0;
                return (
                  <div className="fd-alloc" key={k}>
                    <div className="fd-alloc-h"><span><i style={{ background: ACLASS[k].color }} />{ACLASS[k].label}</span><b>{w.toFixed(1)}%{tg > 0 && <small> · target {tg}%{Math.abs(w - tg) >= 5 ? (w > tg ? " · above" : " · below") : ""}</small>}</b></div>
                    <div className="fd-alloc-bar"><i style={{ width: Math.min(100, Math.max(0, w)) + "%", background: ACLASS[k].color }} />{tg > 0 && <em style={{ left: Math.min(100, tg) + "%" }} title={"Target " + tg + "%"} />}</div>
                  </div>
                );
              })}
              <div className="fd-sub" style={{ marginTop: 14 }}>By currency: {Object.entries(byCur).filter(([, v]) => Math.abs(v) > 0.004).sort((a, b) => b[1] - a[1]).map(([c, v]) => `${c} ${T.nav > 0 ? (v / T.nav * 100).toFixed(1) : 0}%`).join(" · ")}</div>
            </div>
            <div className="fd-card">
              <h2 className="fd-h2" style={{ marginTop: 0 }}>Value over time</h2>
              {(nav.points || []).length >= 2 ? <NavChart points={nav.points} fmt={vf} /> : <p className="fd-sub">A point is saved each day you open this page. The chart appears from the second day.</p>}
            </div>
          </div>
        )}

        {adding && <AddAssetDialog store={store} cashAccts={T.cashAccts} onClose={() => setAdding(false)} onSaved={async (id, name, data) => {
          if (data.txns && data.txns[0]) data.txns = [stamp(data.currency, data.txns[0])];
          await store.saveAsset({ id, name, data }); await load(); setAdding(false); flash(data.cls === "cash" ? "Cash account added." : "Asset added."); setTimeout(() => refresh(true), 200);
        }} />}
        {open && openX && <AssetDialog h={open} x={openX} price={lastPrices[open.id]} fx={fx} cashAccts={T.cashAccts} heldAt={heldAtFn(open)} holdings={holdings}
          onClose={() => setOpenId(null)} onTx={tx => commitTx(open, tx).then(() => flash("Saved."))}
          onSave={async data => { await save(open, data); flash("Saved."); }} />}
        {recording && (
          <Modal wide title={(recording.types[0] === "split" ? "Record split · " : "Record dividend · ") + (recording.h.symbol || recording.h.name)} sub={recording.h.name} onClose={() => setRecording(null)}>
            <TxForm h={recording.h} held={position(recording.h, fx).qty} heldAt={heldAtFn(recording.h)} cashAccts={T.cashAccts} initial={recording.initial} types={recording.types}
              submitLabel="Record" onCancel={() => setRecording(null)} onSubmit={async tx => { await commitTx(recording.h, tx); setRecording(null); flash("Recorded."); }} />
          </Modal>
        )}
        {policyOpen && <PolicyDialog policy={policy} onClose={() => setPolicyOpen(false)} onSave={async p => { await store.saveAsset({ id: "PORTFOLIO-POLICY", name: "__policy__", data: p }); await load(); setPolicyOpen(false); flash("Policy saved."); }} />}
      </>
    );
  }
  function NavChart({ points, fmt }) {
    const pts = points.slice(-365), W = 600, H = 130;
    const base = p => p.p != null ? p.p : p.cost;
    const vals = pts.map(p => p.mv).concat(pts.map(base).filter(v => v != null));
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const x = i => (pts.length < 2 ? 0 : i / (pts.length - 1) * W), y = v => H - 8 - (hi === lo ? 0.5 : (v - lo) / (hi - lo)) * (H - 16);
    const line = f => pts.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(f(p)).toFixed(1)).join(" ");
    return (
      <div>
        <div className="fd-sub" style={{ marginBottom: 6 }}><span style={{ color: "var(--sage)" }}>Net asset value</span> · <span style={{ color: "var(--faint)" }}>principal</span></div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Net asset value from ${fdate(pts[0].d)} to ${fdate(pts[pts.length - 1].d)}: ${fmt(pts[pts.length - 1].mv)}`} preserveAspectRatio="none">
          <path d={line(base)} fill="none" stroke="rgba(239,233,220,.3)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          <path d={line(p => p.mv)} fill="none" stroke="#8FD4A8" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="fd-sub" style={{ display: "flex", justifyContent: "space-between", margin: 0 }}><span>{fdate(pts[0].d)}</span><span>{fdate(pts[pts.length - 1].d)}</span></div>
      </div>
    );
  }

  function AddAssetDialog({ store, cashAccts, onClose, onSaved }) {
    const [step, setStep] = useState("find");
    const [q, setQ] = useState("");
    const [hits, setHits] = useState(null);
    const [searching, setSearching] = useState(false);
    const [h, setH] = useState({ cls: "idx", symbol: "", name: "", currency: "IDR", source: "", priceSymbol: "", logo: "", custodian: "", holder: "Founder, in trust for The Brial Endowment", note: "" });
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    useEffect(() => {
      const term = q.trim();
      if (term.length < 2) { setHits(null); return; }
      let on = true; setSearching(true);
      const t = setTimeout(async () => {
        try {
          const r = await store.assetSearch(term);
          const U = term.toUpperCase(), L = term.toLowerCase();
          const rank = x => (x.symbol === U ? 0 : String(x.name).toLowerCase() === L ? 1 : String(x.name).toLowerCase().indexOf(L) === 0 ? 2 : 3);
          if (on) setHits(r.map((x, i) => ({ x, i })).sort((a, b) => rank(a.x) - rank(b.x) || a.i - b.i).map(o => o.x));
        } catch (e) { if (on) setHits([]); }
        if (on) setSearching(false);
      }, 350);
      return () => { on = false; clearTimeout(t); };
    }, [q]);
    const pick = x => { setH(p => ({ ...p, cls: x.cls, symbol: x.symbol, name: x.name, currency: x.currency || (x.cls === "idx" ? "IDR" : "USD"), source: x.source, priceSymbol: x.priceSymbol, logo: x.logo || "", exchange: x.exchange || "" })); setStep("details"); };
    const manual = () => { setH(p => ({ ...p, cls: p.cls === "cash" ? "idx" : p.cls, symbol: q.trim().toUpperCase().slice(0, 12), name: "", source: "", priceSymbol: "" })); setStep("details"); };
    const cashAcct = () => { setH(p => ({ ...p, cls: "cash", symbol: "IDR", currency: "IDR", name: "", source: "", priceSymbol: "", logo: "" })); setStep("details"); };
    const set = (k, v) => setH(p => ({ ...p, [k]: v, ...(k === "currency" && p.cls === "cash" ? { symbol: v } : {}) }));
    const isC = h.cls === "cash";
    const autoName = isC ? (h.custodian.trim() ? "Cash at " + h.custodian.trim() : "Cash") + " (" + h.currency + ")" : "";
    const ready = (isC || h.name.trim()) && h.currency && h.cls;
    const finish = async tx => {
      setBusy(true); setErr("");
      const data = { kind: "holding", ...h, symbol: (isC ? h.currency : h.symbol.trim().toUpperCase()), name: (h.name.trim() || autoName), custodian: h.custodian.trim(), holder: h.holder.trim(), note: h.note.trim(), txns: tx ? [tx] : [], createdAt: new Date().toISOString() };
      if (data.cls === "idx" && data.symbol && !data.priceSymbol) { data.priceSymbol = data.symbol + ".JK"; data.source = "yahoo"; }
      if ((data.cls === "us" || data.cls === "etf") && data.symbol && !data.priceSymbol) { data.priceSymbol = data.symbol; data.source = "yahoo"; }
      try { await onSaved(newId(isC ? "A-CASH" : "A"), !isC && data.symbol ? `${data.symbol} · ${data.name}` : data.name, data); }
      catch (e) { setErr("Could not save. Check your connection and try again."); setBusy(false); }
    };
    return (
      <Modal wide title={isC && step !== "find" ? "Add a cash account" : "Add an asset"} sub={step === "find" ? "Search a stock, an ETF or a coin, or add anything else by hand." : step === "details" ? "Check the details." : isC ? "The opening balance, if there is one." : "How the endowment got it."} onClose={onClose}>
        {step === "find" && (
          <>
            <Search value={q} onChange={setQ} placeholder="Ticker or name: TLKM, Microsoft, VTI, Ethereum…" />
            <div className="fd-ahits" role="listbox" aria-label="Results">
              {searching && <p className="fd-sub" style={{ padding: 12 }}>Searching…</p>}
              {!searching && hits && hits.length === 0 && <p className="fd-sub" style={{ padding: 12 }}>Nothing found. Check the spelling, or add it by hand.</p>}
              {!searching && (hits || []).map(x => (
                <button key={x.source + x.priceSymbol} type="button" role="option" className="fd-ahit" onClick={() => pick(x)}>
                  <AssetLogo h={x} size={34} />
                  <span><b>{x.symbol}</b><small>{x.name}</small></span>
                  <span className="fd-ahit-r"><Tag>{ACLASS[x.cls] ? ACLASS[x.cls].short : x.cls}</Tag><small>{[x.exchange, x.currency].filter(Boolean).join(" · ")}</small></span>
                </button>
              ))}
            </div>
            <div className="fd-actions" style={{ marginTop: 14 }}>
              <button className="fd-btn ghost" onClick={manual}>Add by hand</button>
              <button className="fd-btn ghost" onClick={cashAcct}>Add a cash account</button>
            </div>
            <p className="fd-sub" style={{ margin: "8px 0 0" }}>By hand: a deposit product, a bond, gold or anything without a market price. Cash account: a bank or broker balance that holds the endowment's money.</p>
          </>
        )}
        {step === "details" && (
          <div className="fd-form">
            <div className="fd-adetail-h"><AssetLogo h={h} size={46} /><div><b>{isC ? (h.name || autoName) : h.symbol || "New asset"}</b><small>{isC ? "Cash account" : (h.name || "Name it below") + (h.exchange ? " · " + h.exchange : "")}</small></div></div>
            <div className="fd-grid2">
              {!isC && <Field label="Asset class"><select className="fd-input" value={h.cls} onChange={e => set("cls", e.target.value)}>{Object.entries(ACLASS).filter(([k]) => k !== "cash").map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>}
              <Field label="Currency" hint={isC ? "The currency of the balance" : "The currency it is priced and bought in"}><select className="fd-input" value={h.currency} onChange={e => set("currency", e.target.value)}>{ASSET_CURS.map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
              {!isC && <Field label="Ticker or code (optional)"><input className="fd-input" value={h.symbol} maxLength={16} onChange={e => set("symbol", e.target.value.toUpperCase())} placeholder="TLKM" /></Field>}
              <Field label={isC ? "Name (optional)" : "Name"}><input className="fd-input" value={h.name} maxLength={120} onChange={e => set("name", e.target.value)} placeholder={isC ? autoName : "PT Telkom Indonesia (Persero) Tbk"} /></Field>
              <Field label={isC ? "Bank or broker" : "Broker or custodian"} hint="Where it is held"><input className="fd-input" value={h.custodian} maxLength={120} onChange={e => set("custodian", e.target.value)} placeholder="Your broker or bank" /></Field>
              <Field label="Registered holder" hint="Whose name the account is in"><input className="fd-input" value={h.holder} maxLength={120} onChange={e => set("holder", e.target.value)} /></Field>
            </div>
            {!isC && <Field label="Logo address (optional)" hint="Filled in for you when found. Paste another image address to change it."><input className="fd-input" value={h.logo} onChange={e => set("logo", e.target.value.trim())} placeholder="https://…" spellCheck={false} /></Field>}
            {!isC && !h.source && <p className="fd-sub" style={{ margin: 0 }}>{h.cls === "idx" || h.cls === "us" || h.cls === "etf" ? "Prices load automatically from the ticker." : "No automatic price for this asset: it is valued at cost until you set a price in its record."}</p>}
            <div className="fd-actions" style={{ marginTop: 6 }}>
              <button className="fd-btn primary" disabled={!ready} onClick={() => setStep("tx")}>Next</button>
              <button className="fd-btn ghost" onClick={() => setStep("find")}>Back</button>
            </div>
          </div>
        )}
        {step === "tx" && (
          <>
            <div className="fd-adetail-h" style={{ marginBottom: 12 }}><AssetLogo h={h} size={38} /><div><b>{isC ? (h.name || autoName) : h.symbol || h.name}</b><small>{isC ? "Cash account" : h.name} · {h.currency}</small></div></div>
            {isC ? (
              <>
                <TxForm h={{ ...h, id: "new" }} held={0} cashAccts={[]} types={["deposit"]} submitLabel={busy ? "Saving…" : "Save with this deposit"} onSubmit={finish} onCancel={() => setStep("details")} />
                <button className="fd-btn quiet sm" style={{ marginTop: 10 }} disabled={busy} onClick={() => finish(null)}>Save with no balance yet</button>
              </>
            ) : <TxForm h={h} held={0} cashAccts={cashAccts} types={["gift", "buy"]} submitLabel={busy ? "Saving…" : "Save asset"} onSubmit={finish} onCancel={() => setStep("details")} />}
            {err && <div className="fd-msg err" style={{ marginTop: 10 }}>{err}</div>}
          </>
        )}
      </Modal>
    );
  }

  function AssetDialog({ h, x, price, fx, cashAccts, heldAt, holdings, onClose, onSave, onTx }) {
    const isC = h.cls === "cash";
    const p = isC ? null : position(h, fx);
    const [mode, setMode] = useState("view");
    const [d, setD] = useState({ name: h.name, custodian: h.custodian || "", holder: h.holder || "", logo: h.logo || "", note: h.note || "", manualPrice: h.manualPrice || "" });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const write = async data => { setBusy(true); setErr(""); try { await onSave(data); setMode("view"); } catch (e) { setErr("Could not save. Try again."); } setBusy(false); };
    const tx = async t => { setBusy(true); setErr(""); try { await onTx(t); setMode("view"); } catch (e) { setErr("Could not save. Try again."); } setBusy(false); };
    const base = stripH(h);
    const setVoid = (id, v) => write({ ...base, txns: (h.txns || []).map(t => t.id === id ? { ...t, void: v, voidAt: v ? new Date().toISOString() : null } : t) });
    const bal = x.mvNative;
    const txs = (h.txns || []).map((t, i) => ({ t, i })).sort((a, b) => String(b.t.date).localeCompare(String(a.t.date)) || b.i - a.i).map(o => o.t);
    const cashName = id => id === "new" ? (null) : ((holdings.find(y => y.id === id) || {}).name || "");
    const canArchive = Math.abs(isC ? bal : p.qty) < 1e-9;
    let running = 0;
    const statement = isC && x.cash ? x.cash.lines.map(l => ({ ...l, after: (running += l.v) })).reverse() : [];
    if (h.virtual) return (
      <Modal title={h.name} sub={h.currency} onClose={onClose}>
        <p className="fd-sub">Money from a sale or dividend recorded without a cash account. Open that transaction's holding and record it again with an account, or add a cash account and move it there.</p>
        <b>{fmtNative(h.currency, bal)}</b>
      </Modal>
    );
    return (
      <Modal wide title={isC ? h.name : h.symbol ? `${h.symbol} · ${h.name}` : h.name} sub={[ACLASS[h.cls] ? ACLASS[h.cls].label : h.cls, h.exchange, h.currency, h.archived ? "Archived" : ""].filter(Boolean).join(" · ")} onClose={onClose}>
        {mode === "view" && (
          <>
            <div className="fd-adetail-h"><AssetLogo h={h} size={52} /><div><b>{isC ? fmtNative(h.currency, bal) : h.archived ? "Archived holding" : qfmt(h, p.qty)}</b><small>{isC ? "Balance, worked out from every movement" : x.price != null ? `Last price ${priceFmt(h.currency, x.price)}${price && price.at ? " · " + fdatetime(price.at) : h.manualPrice ? " · set by hand" : ""}` : "No price yet: valued at cost"}</small></div></div>
            {!isC && <Stats items={[
              { label: "Market value", value: fmtNative(h.currency, x.mvNative), sub: h.currency !== "USD" ? fmtNative("USD", x.mvUsd) : "" },
              { label: "Cost", value: fmtNative(h.currency, p.cost), sub: p.qty > 0 ? "Average " + priceFmt(h.currency, p.avg) : "" },
              { label: "Unrealised gain", value: sgn(v => fmtNative(h.currency, v), x.unrealNative), sub: p.cost > 0 && x.price != null ? pct(x.unrealNative / p.cost * 100) : "", tone: x.unrealNative >= 0 ? "ok" : "bad" },
              { label: "Earned", value: sgn(v => fmtNative(h.currency, v), p.earned), sub: [p.dividends && "dividends " + fmtNative(h.currency, p.dividends), p.interest && "interest " + fmtNative(h.currency, p.interest), p.rewards && "rewards " + fmtNative(h.currency, p.rewards), p.realized && "sales " + sgn(v => fmtNative(h.currency, v), p.realized)].filter(Boolean).join(" · ") || "Nothing yet", tone: p.earned > 0 ? "ok" : "" },
            ]} />}
            <div className="fd-adl">
              <div><span>{isC ? "Bank or broker" : "Broker or custodian"}</span><b>{h.custodian || "Not set"}</b></div>
              <div><span>Registered holder</span><b>{h.holder || "Not set"}</b></div>
              {!isC && <div><span>Price source</span><b>{h.source === "coingecko" ? "CoinGecko · " + h.priceSymbol : h.source === "yahoo" ? "Yahoo Finance · " + h.priceSymbol : h.manualPrice ? "Set by hand" : "None, valued at cost"}</b></div>}
              {!isC && <div><span>Given · bought</span><b>{fmtNative(h.currency, p.given)} · {fmtNative(h.currency, p.newMoney + p.fromCash)}</b></div>}
              {h.note && <div style={{ gridColumn: "1 / -1" }}><span>Note</span><b style={{ fontWeight: 400 }}>{h.note}</b></div>}
            </div>
            <div className="fd-card-head" style={{ marginTop: 18 }}><h3 className="fd-h3" style={{ fontSize: 20 }}>{isC ? "Statement" : "Transactions"}</h3>{!h.archived && <button className="fd-btn primary sm" onClick={() => setMode("tx")}>{isC ? "Add a movement" : "Add transaction"}</button>}</div>
            {isC ? (
              statement.length === 0 ? <p className="fd-sub">No movements yet. Sales, dividends and interest paid into this account appear here by themselves.</p> : (
                <div className="fd-table">
                  {statement.map((l, i) => {
                    const own = l.own && (h.txns || []).find(t => t.id === l.own);
                    return (
                      <div className="fd-tr" key={i} style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr)" }}>
                        <div className="fd-td"><b style={{ fontWeight: 500 }}>{l.label}</b><small>{fdate(l.date)}{l.ref || l.exp ? " · recorded automatically" : ""}</small></div>
                        <div className="fd-td fd-amt" data-l="Amount"><b className={l.v >= 0 ? "fd-up" : ""}>{sgn(v => fmtNative(h.currency, v), l.v)}</b></div>
                        <div className="fd-td fd-amt" data-l="Balance"><small>{fmtNative(h.currency, l.after)}</small>{own && !h.archived && <Confirm className="fd-btn quiet sm" armedLabel="Click again to void" onConfirm={() => setVoid(own.id, true)}>Void</Confirm>}</div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="fd-table">
                {txs.map(t => (
                  <div className={"fd-tr" + (t.void ? " dim" : "")} key={t.id} style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr) minmax(0,1fr)" }}>
                    <div className="fd-td"><Tag tone={t.void ? "" : txDef(h, t.type).tone}>{txDef(h, t.type).label}</Tag><small>{fdate(t.date)}{t.void ? " · voided" : ""}</small></div>
                    <div className="fd-td" data-l="Detail">
                      {t.qty ? <b>{qfmt(h, t.qty)}</b> : t.type === "split" ? <b>× {t.ratio}</b> : null}
                      {t.qty && t.amount ? <small>at {priceFmt(h.currency, t.amount / t.qty)}{t.fee ? " · fees " + fmtNative(h.currency, t.fee) : ""}</small> : null}
                      {t.tax ? <small>Tax {fmtNative(h.currency, t.tax)} · received {fmtNative(h.currency, t.amount - t.tax)}</small> : null}
                      {t.type === "reward" && t.kind ? <small>{(REWARD_KIND.find(k => k[0] === t.kind) || [0, t.kind])[1]}</small> : null}
                      {t.cash ? <small>{t.cash === "new" ? "New money from outside" : (t.type === "buy" || t.type === "fee" ? "From " : "Into ") + cashName(t.cash)}</small> : null}
                      {t.note && <small>{t.note}</small>}
                    </div>
                    <div className="fd-td fd-amt" data-l="Amount">
                      {t.amount ? <b className={t.void ? "" : ["sell", "dividend", "interest", "reward"].includes(t.type) ? "fd-up" : t.type === "fee" ? "fd-down" : ""}>{fmtNative(h.currency, t.amount)}</b> : <small>·</small>}
                      {!h.archived && (t.void ? <button className="fd-btn quiet sm" onClick={() => setVoid(t.id, false)}>Restore</button> : <Confirm className="fd-btn quiet sm" armedLabel="Click again to void" onConfirm={() => setVoid(t.id, true)}>Void</Confirm>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="fd-actions" style={{ marginTop: 16 }}>
              <button className="fd-btn ghost sm" onClick={() => setMode("edit")}>Edit details</button>
              {!h.archived ? <Confirm className="fd-btn quiet sm" disabled={!canArchive} armedLabel="Click again to archive" onConfirm={() => write({ ...base, archived: true, archivedAt: new Date().toISOString() })}>Archive</Confirm>
                : <button className="fd-btn quiet sm" onClick={() => write({ ...base, archived: false, archivedAt: null })}>Restore</button>}
              <small className="fd-sub" style={{ margin: 0 }}>{!h.archived && !canArchive ? (isC ? "Move the balance out before archiving." : "Sell or move everything before archiving.") : "Voiding and archiving keep the full history. Nothing is deleted."}</small>
            </div>
          </>
        )}
        {mode === "tx" && <TxForm h={h} held={isC ? bal : p.qty} heldAt={isC ? null : heldAt} cashAccts={cashAccts} types={isC ? null : ["buy", "sell", "dividend", "interest", "reward", "fee", "split", "gift"]} submitLabel={busy ? "Saving…" : "Save"} onSubmit={tx} onCancel={() => setMode("view")} />}
        {mode === "edit" && (
          <div className="fd-form">
            <div className="fd-grid2">
              <Field label="Name"><input className="fd-input" value={d.name} maxLength={120} onChange={e => setD(y => ({ ...y, name: e.target.value }))} /></Field>
              <Field label={isC ? "Bank or broker" : "Broker or custodian"}><input className="fd-input" value={d.custodian} maxLength={120} onChange={e => setD(y => ({ ...y, custodian: e.target.value }))} /></Field>
              <Field label="Registered holder"><input className="fd-input" value={d.holder} maxLength={120} onChange={e => setD(y => ({ ...y, holder: e.target.value }))} /></Field>
              {!isC && <Field label={`Price by hand (${h.currency})`} hint={h.source ? "Used only when the live price is not available" : "This asset has no live price"}><input className="fd-input" inputMode="decimal" value={d.manualPrice} onChange={e => setD(y => ({ ...y, manualPrice: e.target.value }))} placeholder="Optional" /></Field>}
            </div>
            {!isC && <Field label="Logo address"><input className="fd-input" value={d.logo} onChange={e => setD(y => ({ ...y, logo: e.target.value.trim() }))} placeholder="Leave empty for the automatic logo" spellCheck={false} /></Field>}
            <Field label="Note"><textarea className="fd-input" value={d.note} maxLength={1000} onChange={e => setD(y => ({ ...y, note: e.target.value }))} /></Field>
            <div className="fd-actions">
              <button className="fd-btn primary" disabled={busy || !d.name.trim()} onClick={() => write({ ...base, name: d.name.trim(), custodian: d.custodian.trim(), holder: d.holder.trim(), logo: d.logo, note: d.note.trim(), manualPrice: parseFloat(d.manualPrice) > 0 ? parseFloat(d.manualPrice) : null })}>{busy ? "Saving…" : "Save"}</button>
              <button className="fd-btn ghost" onClick={() => setMode("view")}>Cancel</button>
            </div>
          </div>
        )}
        {err && <div className="fd-msg err" style={{ marginTop: 10 }}>{err}</div>}
      </Modal>
    );
  }

  function PolicyDialog({ policy, onClose, onSave }) {
    const [t, setT] = useState(() => { const o = {}; Object.keys(ACLASS).forEach(k => { o[k] = policy.targets && policy.targets[k] ? String(policy.targets[k]) : ""; }); return o; });
    const [ops, setOps] = useState(String(policy.opsShare ?? 10));
    const [busy, setBusy] = useState(false);
    const sum = Object.values(t).reduce((a, v) => a + (parseFloat(v) || 0), 0);
    const opsN = parseFloat(ops);
    const ok = (sum === 0 || Math.abs(sum - 100) < 0.01) && opsN >= 0 && opsN <= 10;
    return (
      <Modal title="Policy and targets" sub="Internal settings. They never appear on the public site." onClose={onClose}>
        <Field label="Share of realised returns for operations (%)" hint="At most 10%. Donations and the principal are never used for running costs.">
          <input className="fd-input" inputMode="decimal" value={ops} onChange={e => setOps(e.target.value)} />
        </Field>
        <h3 className="fd-h3" style={{ fontSize: 19, margin: "18px 0 4px" }}>Target allocation</h3>
        <p className="fd-sub" style={{ marginTop: 0 }}>Optional. Leave all empty for no targets, or make them add up to 100%.</p>
        <div className="fd-grid2">
          {Object.entries(ACLASS).map(([k, v]) => <Field key={k} label={v.label + " (%)"}><input className="fd-input" inputMode="decimal" value={t[k]} onChange={e => setT(p => ({ ...p, [k]: e.target.value }))} placeholder="0" /></Field>)}
        </div>
        <p className={sum && Math.abs(sum - 100) >= 0.01 ? "fd-bad" : "fd-sub"} style={{ marginTop: 8 }}>Total {nfmt(sum, 2)}%{sum && Math.abs(sum - 100) >= 0.01 ? ": it must be 100%." : ""}</p>
        {!(opsN >= 0 && opsN <= 10) && <p className="fd-bad">The operations share must be between 0 and 10%.</p>}
        <div className="fd-actions" style={{ marginTop: 10 }}>
          <button className="fd-btn primary" disabled={!ok || busy} onClick={async () => { setBusy(true); const targets = {}; Object.entries(t).forEach(([k, v]) => { if (parseFloat(v) > 0) targets[k] = parseFloat(v); }); try { await onSave({ opsShare: opsN, targets }); } catch (e) { setBusy(false); } }}>{busy ? "Saving…" : "Save"}</button>
          <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </Modal>
    );
  }

  // ---------- the Operating costs page ----------
  function OpsView({ store, go }) {
    const P = usePortfolio(store);
    const { rows, err, load, expenses, templates, nav, holdings } = P;
    const [view, setView] = useState("USD");
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState(null); // expense or {} for new
    const [tplEdit, setTplEdit] = useState(null);
    const [m, flash] = useFlash();
    const liveFx = useFx(store);
    const fx = { USD: 1, USDT: 1, ...Store_FX(store), ...(liveFx || {}), ...nav.fx };
    const T = book(P, nav.last || {}, fx);
    const U = e => usdOf(e.currency, +e.amount || 0, e.fx, fx);
    const vf = usd => view === "IDR" ? "Rp " + Math.round(usd * (fx.IDR || 0)).toLocaleString("id-ID") : "$" + (Number(usd) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (err && !rows) return <><Head title="Operating costs" /><div className="fd-msg err">{err}</div></>;
    if (!rows) return <><Head title="Operating costs" /><p className="fd-sub">Loading…</p></>;
    const live = expenses.filter(e => !e.void);
    const yNow = String(new Date().getFullYear());
    const years = [...new Set([yNow].concat(expenses.map(e => String(e.date || "").slice(0, 4)).filter(Boolean)))].sort().reverse();
    const ytd = live.filter(e => String(e.date).slice(0, 4) === yNow);
    const sumU = list => list.reduce((a, e) => a + U(e), 0);
    const monthly = templates.filter(t => !t.paused).reduce((a, t) => a + usdOf(t.currency, +t.amount || 0, null, fx) / (t.every === "year" ? 12 : 1), 0);
    const ytdFounder = sumU(ytd.filter(e => !e.paidFrom || e.paidFrom === "founder"));
    const inYear = expenses.filter(e => year === "all" || String(e.date).slice(0, 4) === year);
    const term = q.trim().toLowerCase();
    const listed = inYear.filter(e => !term || [e.payee, e.desc, e.programme, catLabel(e.category)].join(" ").toLowerCase().indexOf(term) >= 0)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
    const byCat = {};
    inYear.filter(e => !e.void).forEach(e => { byCat[e.category || "other"] = (byCat[e.category || "other"] || 0) + U(e); });
    const catTotal = Object.values(byCat).reduce((a, v) => a + v, 0);
    const byFn = {};
    inYear.filter(e => !e.void).forEach(e => { const f = e.fn || catFn(e.category); byFn[f] = (byFn[f] || 0) + U(e); });
    // last 12 months
    const months = [];
    for (let i = 11; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); const k = d.toISOString().slice(0, 7); months.push({ k, label: d.toLocaleDateString("en-GB", { month: "short" }), v: 0 }); }
    live.forEach(e => { const mo = months.find(x => x.k === String(e.date).slice(0, 7)); if (mo) mo.v += U(e); });
    const mMax = Math.max(1e-9, ...months.map(x => x.v));
    const last12 = months.reduce((a, x) => a + x.v, 0);
    const ratio = T.nav > 0 ? last12 / T.nav * 100 : null;
    const acctName = id => id === "founder" || !id ? "You personally" : ((holdings.find(h => h.id === id) || {}).name || "Cash account");
    const exportCsv = () => downloadCsv("brial-endowment-operating-costs-" + todayISO() + ".csv",
      ["Date", "Paid to", "Category", "Function", "Programme or project", "Description", "Amount", "Currency", "Units per USD", "USD", "Paid by", "Recurring", "Receipt", "Status"],
      expenses.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).map(e => [e.date, e.payee || "", catLabel(e.category), EXP_FN[e.fn || catFn(e.category)], e.programme || "", e.desc || "", e.amount, e.currency, e.fx || (e.currency === "USD" ? 1 : ""), Math.round(U(e) * 100) / 100, acctName(e.paidFrom), e.tpl ? "Yes" : "", e.receipt ? e.receipt.name : "", e.void ? "Voided" : ""]));
    const G = "minmax(0,2fr) minmax(0,1.3fr) minmax(0,1.1fr) minmax(0,1fr)";
    const saveExp = async (id, data) => { await store.saveAsset({ id, name: ((data.payee || "Cost") + " · " + data.date).slice(0, 160), data }); await load(); };
    return (
      <>
        <Head title="Operating costs" lede="What it takes to run the endowment: hosting, software, management and more. Internal; the public site never shows it.">
          <Seg items={[["USD", "USD"], ["IDR", "IDR"]]} value={view} onChange={setView} />
          <button className="fd-btn ghost sm" disabled={!expenses.length} onClick={exportCsv}>Export CSV</button>
          <button className="fd-btn ghost sm" onClick={() => setTplEdit({})}>Add recurring cost</button>
          <button className="fd-btn primary" onClick={() => setEditing({})}>Add cost</button>
        </Head>
        {m && <div style={{ marginBottom: 12 }}><Flash m={m} /></div>}
        <Stats items={[
          { label: "This year", value: vf(sumU(ytd)), sub: `${ytd.length} ${plural(ytd.length, "payment", "payments")} in ${yNow}` },
          { label: "Monthly running cost", value: vf(monthly), sub: templates.filter(t => !t.paused).length ? `${templates.filter(t => !t.paused).length} recurring ${plural(templates.filter(t => !t.paused).length, "cost", "costs")}` : "No recurring costs yet" },
          { label: "Operating budget available", value: vf(Math.max(0, T.available)), sub: T.available < 0 ? `Over the budget by ${vf(-T.available)}` : `${T.share}% of realised returns, after costs`, tone: T.available < 0 ? "bad" : "ok" },
          { label: "Covered by you this year", value: vf(ytdFounder), sub: "Paid personally, never from the fund" },
        ]} />

        <div className="fd-tgrid fd-assets-grid" style={{ marginTop: 18 }}>
          <div className="fd-card">
            <div className="fd-card-head"><div><h2 className="fd-h2" style={{ marginTop: 0 }}>Recurring costs</h2><p className="fd-sub">Subscriptions and salaries. Each payment is recorded by itself on its date.</p></div></div>
            {templates.length === 0 ? <p className="fd-sub">Add a subscription or a salary once, for example the domain every year or the manager every month. You never type it again.</p> : templates.slice().sort((a, b) => (a.paused ? 1 : 0) - (b.paused ? 1 : 0) || String(a.payee).localeCompare(String(b.payee))).map(t => {
              const nd = t.paused ? null : nextDue(t);
              return (
                <div className={"fd-krow fd-rec" + (t.paused ? " dim" : "")} key={t.id} role="button" tabIndex={0} onClick={() => setTplEdit(t)} onKeyDown={e => { if (e.key === "Enter") setTplEdit(t); }}>
                  <div><b>{t.payee}</b><small>{catLabel(t.category)} · {t.paused ? "Paused" : nd ? "Next " + fdate(nd) : "Ended"} · {acctName(t.paidFrom)}</small></div>
                  <b>{fmtNative(t.currency, t.amount)}<small style={{ display: "inline", marginLeft: 4 }}>/ {t.every === "year" ? "year" : "month"}</small></b>
                </div>
              );
            })}
          </div>
          <div className="fd-card">
            <h2 className="fd-h2" style={{ marginTop: 0 }}>How costs are funded</h2>
            <p className="fd-sub">Donations and the principal never pay running costs.</p>
            <div className="fd-krow" style={{ borderTop: 0 }}><div><b>Operating budget earned</b><small>{T.share}% of realised returns since the start</small></div><b>{vf(T.allowance)}</b></div>
            <div className="fd-krow"><div><b>Paid from the endowment</b><small>Costs paid from its cash accounts</small></div><b>{vf(T.opsEndow)}</b></div>
            <div className="fd-krow"><div><b>Available now</b><small>{T.available < 0 ? "Pay new costs personally until returns catch up" : "Can pay the next costs from the endowment"}</small></div><b className={T.available < 0 ? "fd-down" : "fd-up"}>{sgn(vf, T.available)}</b></div>
            <div className="fd-krow"><div><b>Covered by you personally</b><small>Since the start</small></div><b>{vf(T.opsFounder)}</b></div>
            {ratio != null && <div className="fd-krow"><div><b>Cost ratio</b><small>Last 12 months of costs against net asset value</small></div><b>{ratio.toFixed(2)}%</b></div>}
            {go && <button className="fd-btn ghost sm" style={{ marginTop: 12 }} onClick={() => go("assets")}>Open assets</button>}
          </div>
        </div>

        <div className="fd-tgrid fd-assets-grid" style={{ marginTop: 16 }}>
          <div className="fd-card">
            <h2 className="fd-h2" style={{ marginTop: 0 }}>By category{year !== "all" ? ", " + year : ""}</h2>
            {catTotal <= 0 ? <p className="fd-sub">Nothing recorded{year !== "all" ? " in " + year : ""}.</p> : Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div className="fd-alloc" key={k}>
                <div className="fd-alloc-h"><span><i style={{ background: CAT_COLOR[k] || "#9AA4B5" }} />{catLabel(k)}</span><b>{vf(v)}<small> · {(v / catTotal * 100).toFixed(0)}%</small></b></div>
                <div className="fd-alloc-bar"><i style={{ width: (v / catTotal * 100) + "%", background: CAT_COLOR[k] || "#9AA4B5" }} /></div>
              </div>
            ))}
            {catTotal > 0 && <p className="fd-sub" style={{ marginTop: 14 }}>By function: {Object.entries(byFn).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${EXP_FN[k] || k} ${(v / catTotal * 100).toFixed(0)}%`).join(" · ")}</p>}
          </div>
          <div className="fd-card">
            <h2 className="fd-h2" style={{ marginTop: 0 }}>Last 12 months</h2>
            <p className="fd-sub">{vf(last12)} in all.</p>
            <div className="fd-mbars" role="img" aria-label={"Operating costs by month, last 12 months: " + vf(last12)}>
              {months.map(x => <div key={x.k} title={x.label + ": " + vf(x.v)}><i style={{ height: Math.max(x.v > 0 ? 3 : 0, x.v / mMax * 100) + "%" }} /><span>{x.label.slice(0, 1)}</span></div>)}
            </div>
          </div>
        </div>

        <div className="fd-card-head" style={{ margin: "26px 0 12px" }}>
          <h2 className="fd-h2" style={{ margin: 0 }}>Costs</h2>
          <div className="fd-actions fd-costs-tools"><Seg items={years.map(y => [y, y]).concat([["all", "All"]])} value={year} onChange={setYear} /><Search value={q} onChange={setQ} placeholder="Search costs" /></div>
        </div>
        {listed.length === 0 ? <Empty title="No costs here">Add a cost by hand, or a recurring cost that records itself.</Empty> : (
          <div className="fd-table">
            <div className="fd-tr fd-th" style={{ gridTemplateColumns: G }}><div>Paid to</div><div>Category</div><div>Date and payer</div><div style={{ textAlign: "right" }}>Amount</div></div>
            {listed.map(e => (
              <div className={"fd-tr fd-hold fd-mv" + (e.void ? " dim" : "")} key={e.id} style={{ gridTemplateColumns: G }} role="button" tabIndex={0} onClick={() => setEditing(e)} onKeyDown={k => { if (k.key === "Enter") setEditing(e); }}>
                <div className="fd-td full"><b>{e.payee || catLabel(e.category)}</b><small>{[e.desc, e.programme].filter(Boolean).join(" · ") || EXP_FN[e.fn || catFn(e.category)]}{e.void ? " · voided" : ""}</small></div>
                <div className="fd-td" data-l="Category"><Tag>{catLabel(e.category)}</Tag>{e.tpl && <small>Recurring</small>}{e.receipt && <small>Receipt attached</small>}</div>
                <div className="fd-td" data-l="Date">{fdate(e.date)}<small>{acctName(e.paidFrom)}</small></div>
                <div className="fd-td fd-amt" data-l="Amount"><span className="num out">{fmtNative(e.currency, e.amount)}</span>{e.currency !== view && <small>{vf(U(e))}</small>}</div>
              </div>
            ))}
          </div>
        )}

        {editing && <ExpenseDialog e={editing} fx={fx} T={T} cashAccts={T.cashAccts} known={[...new Set(expenses.map(x => x.programme).filter(Boolean))]} payees={[...new Set(expenses.map(x => x.payee).filter(Boolean))]}
          onClose={() => setEditing(null)} onSave={async (id, data) => { await saveExp(id, data); setEditing(null); flash(data.void ? "Voided. It no longer counts." : "Saved."); }} />}
        {tplEdit && <RecurringDialog t={tplEdit} T={T} cashAccts={T.cashAccts} onClose={() => setTplEdit(null)}
          onSave={async (id, data) => {
            await store.saveAsset({ id, name: ("Recurring · " + data.payee).slice(0, 160), data });
            const r = await load(); setTplEdit(null);
            const n = r ? await postRecurring(store, r) : 0; if (n) await load();
            flash(n ? `Saved. ${n} ${plural(n, "payment", "payments")} recorded up to today.` : "Saved.");
          }} />}
      </>
    );
  }
  // Which account pays: the endowment's cash only when its operating budget covers it
  function PaidFrom({ value, onChange, currency, amountUsd, T, cashAccts }) {
    const accts = (cashAccts || []).filter(a => a.currency === currency);
    const over = amountUsd > Math.max(0, T.available) + 0.005;
    return (
      <Field label="Paid by" hint={value === "founder" ? "Recorded as your personal support. It never touches the fund." : over ? `Above the operating budget available (${"$" + Math.max(0, T.available).toFixed(2)}). The excess would come out of the principal.` : `From the operating budget, ${"$" + Math.max(0, T.available).toFixed(2)} available.`}>
        <select className="fd-input" value={value} onChange={e => onChange(e.target.value)}>
          <option value="founder">You personally</option>
          {accts.map(a => <option key={a.id} value={a.id}>{a.name} · {fmtNative(a.currency, a.bal)}</option>)}
        </select>
      </Field>
    );
  }
  function ExpenseDialog({ e, fx, T, cashAccts, known, payees, onClose, onSave }) {
    const isNew = !e.id;
    const [f, setF] = useState(() => ({ date: e.date || todayISO(), payee: e.payee || "", category: e.category || "hosting", fn: e.fn || catFn(e.category || "hosting"), fnTouched: !!e.fn, programme: e.programme || "", desc: e.desc || "", amount: e.amount != null ? String(e.amount) : "", currency: e.currency || "USD", paidFrom: e.paidFrom || "founder", receipt: e.receipt || null, note: e.note || "" }));
    const [busy, setBusy] = useState(false), [up, setUp] = useState(false), [err, setErr] = useState("");
    const set = (k, v) => setF(p => ({ ...p, [k]: v, ...(k === "category" && !p.fnTouched ? { fn: catFn(v) } : {}), ...(k === "fn" ? { fnTouched: true } : {}), ...(k === "currency" ? { paidFrom: "founder" } : {}) }));
    const amt = parseFloat(String(f.amount).replace(/,/g, ""));
    const rate = f.currency === "USD" ? 1 : (e.id && e.currency === f.currency && Number(e.fx) > 0 ? Number(e.fx) : Number(fx[f.currency]) || 0);
    const usd = rate > 0 && amt > 0 ? amt / rate : 0;
    const acct = (cashAccts || []).find(a => a.id === f.paidFrom);
    const problems = [];
    if (!f.date) problems.push("Choose a date."); else if (f.date > todayISO()) problems.push("Record a cost once it is paid.");
    if (!f.payee.trim()) problems.push("Say who was paid.");
    if (!(amt > 0)) problems.push("Enter the amount.");
    if (acct && !e.id && amt > acct.bal + 1e-9) problems.push(`${acct.name} holds ${fmtNative(acct.currency, acct.bal)}.`);
    const pick = async ev => {
      const file = ev.target.files && ev.target.files[0]; ev.target.value = "";
      if (!file) return;
      const v = window.BrialFiles.validate(file);
      if (!v.ok) { setErr(v.error); return; }
      setUp(true); setErr("");
      try { const meta = await window.BrialFiles.put(file); setF(p => ({ ...p, receipt: meta })); } catch (x) { setErr("Could not upload the receipt. Try again."); }
      setUp(false);
    };
    const submit = async extra => {
      setBusy(true); setErr("");
      const data = { ...(e.id ? e : {}), kind: "expense", date: f.date, payee: f.payee.trim().slice(0, 120), category: f.category, fn: f.fn, programme: f.programme.trim().slice(0, 120), desc: f.desc.trim().slice(0, 300), amount: amt, currency: f.currency,
        fx: f.currency === "USD" ? null : rate || null, paidFrom: f.paidFrom, receipt: f.receipt || null, note: f.note.trim().slice(0, 500), ...(extra || {}) };
      delete data.id; delete data.updatedAt;
      if (!e.id) data.createdAt = new Date().toISOString();
      try { await onSave(e.id || newId("E"), data); } catch (x) { setErr("Could not save. Check your connection and try again."); setBusy(false); }
    };
    return (
      <Modal wide title={isNew ? "Add an operating cost" : (e.payee || "Operating cost")} sub={isNew ? "A payment made to run the endowment." : e.tpl ? "Recorded automatically from a recurring cost. You can still correct it." : fdate(e.date)} onClose={onClose}>
        <div className="fd-form">
          <div className="fd-grid2">
            <Field label="Date paid"><input className="fd-input" type="date" value={f.date} max={todayISO()} onChange={x => set("date", x.target.value)} /></Field>
            <Field label="Paid to" hint="The company or person"><input className="fd-input" list="fd-payees" value={f.payee} maxLength={120} onChange={x => set("payee", x.target.value)} placeholder="Cloudflare, Anthropic, the manager…" /><datalist id="fd-payees">{payees.map(p => <option key={p} value={p} />)}</datalist></Field>
            <Field label="Amount"><input className="fd-input" inputMode="decimal" value={f.amount} onChange={x => set("amount", x.target.value)} placeholder="0" /></Field>
            <Field label="Currency" hint={f.currency !== "USD" && usd > 0 ? `About ${fmtNative("USD", usd)} at ${f.currency} ${nfmt(rate, 2)} per dollar` : ""}><select className="fd-input" value={f.currency} onChange={x => set("currency", x.target.value)}>{ASSET_CURS.map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="Category"><select className="fd-input" value={f.category} onChange={x => set("category", x.target.value)}>{EXP_CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field label="Function" hint="How nonprofits group costs in their reports"><select className="fd-input" value={f.fn} onChange={x => set("fn", x.target.value)}>{Object.entries(EXP_FN).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field label="Programme or project (optional)"><input className="fd-input" list="fd-progs" value={f.programme} maxLength={120} onChange={x => set("programme", x.target.value)} placeholder="Website, Scholar Portal, annual report…" /><datalist id="fd-progs">{known.map(p => <option key={p} value={p} />)}</datalist></Field>
            <PaidFrom value={f.paidFrom} onChange={v => set("paidFrom", v)} currency={f.currency} amountUsd={e.id && e.paidFrom === f.paidFrom && e.paidFrom !== "founder" ? 0 : usd} T={T} cashAccts={cashAccts} />
          </div>
          <Field label="What it was for (optional)"><input className="fd-input" value={f.desc} maxLength={300} onChange={x => set("desc", x.target.value)} placeholder="Workers paid plan, October" /></Field>
          <div className="fd-actions">
            <span className="fd-upload"><span className="fd-btn ghost sm">{ICON.up}{up ? "Uploading…" : f.receipt ? "Replace the receipt" : "Attach a receipt"}</span><input type="file" accept={window.BrialFiles ? window.BrialFiles.allowedAccept : "*"} onChange={pick} disabled={up} aria-label="Attach a receipt" /></span>
            {f.receipt && <><FileBtn file={f.receipt} label="Open receipt" /><small className="fd-sub" style={{ margin: 0 }}>{f.receipt.name} · private</small></>}
          </div>
          {problems.length > 0 && (f.payee || f.amount) && <small className="fd-bad">{problems[0]}</small>}
          {err && <div className="fd-msg err">{err}</div>}
          <div className="fd-actions" style={{ marginTop: 6 }}>
            <button className="fd-btn primary" disabled={busy || up || problems.length > 0} onClick={() => submit()}>{busy ? "Saving…" : "Save"}</button>
            <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
            {!isNew && (e.void ? <button className="fd-btn quiet sm" disabled={busy} onClick={() => submit({ void: false, voidAt: null })}>Restore</button>
              : <Confirm className="fd-btn quiet sm" armedLabel="Click again to void" onConfirm={() => submit({ void: true, voidAt: new Date().toISOString() })}>Void</Confirm>)}
          </div>
        </div>
      </Modal>
    );
  }
  function RecurringDialog({ t, T, cashAccts, onClose, onSave }) {
    const isNew = !t.id;
    const [f, setF] = useState(() => ({ payee: t.payee || "", category: t.category || "software", fn: t.fn || catFn(t.category || "software"), programme: t.programme || "", desc: t.desc || "", amount: t.amount != null ? String(t.amount) : "", currency: t.currency || "USD", every: t.every || "month", start: t.start || todayISO(), paidFrom: t.paidFrom || "founder", paused: !!t.paused }));
    const [busy, setBusy] = useState(false), [err, setErr] = useState("");
    const set = (k, v) => setF(p => ({ ...p, [k]: v, ...(k === "category" ? { fn: catFn(v) } : {}), ...(k === "currency" ? { paidFrom: "founder" } : {}) }));
    const amt = parseFloat(String(f.amount).replace(/,/g, ""));
    const ok = f.payee.trim() && amt > 0 && f.start;
    const backfill = isNew && f.start < todayISO() ? dueDates({ ...f, id: "R-x" }, todayISO()).length : 0;
    const submit = async () => {
      setBusy(true); setErr("");
      const resumed = t.paused && !f.paused;
      const data = { kind: "recurring", payee: f.payee.trim().slice(0, 120), category: f.category, fn: f.fn, programme: f.programme.trim().slice(0, 120), desc: f.desc.trim().slice(0, 300), amount: amt, currency: f.currency, every: f.every,
        start: isNew ? f.start : t.start, from: isNew ? f.start : resumed ? todayISO() : (t.from || t.start), paidFrom: f.paidFrom, paused: f.paused, createdAt: t.createdAt || new Date().toISOString() };
      try { await onSave(t.id || newId("R"), data); } catch (x) { setErr("Could not save. Try again."); setBusy(false); }
    };
    return (
      <Modal wide title={isNew ? "Add a recurring cost" : f.payee} sub="A subscription or salary. Each payment is recorded by itself on its date, at the amount set here." onClose={onClose}>
        <div className="fd-form">
          <div className="fd-grid2">
            <Field label="Paid to"><input className="fd-input" value={f.payee} maxLength={120} onChange={x => set("payee", x.target.value)} placeholder="Claude Pro, Cloudflare, the manager…" /></Field>
            <Field label="Category"><select className="fd-input" value={f.category} onChange={x => set("category", x.target.value)}>{EXP_CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field label="Amount each time"><input className="fd-input" inputMode="decimal" value={f.amount} onChange={x => set("amount", x.target.value)} placeholder="0" /></Field>
            <Field label="Currency"><select className="fd-input" value={f.currency} onChange={x => set("currency", x.target.value)}>{ASSET_CURS.map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="Every"><select className="fd-input" value={f.every} onChange={x => set("every", x.target.value)}><option value="month">Month</option><option value="year">Year</option></select></Field>
            <Field label={isNew ? "First payment" : "Started"} hint={isNew ? (backfill ? `${backfill} past ${plural(backfill, "payment", "payments")} will be recorded now` : "Later payments follow on the same day") : "Change the amount for future payments; past ones stay as they were"}>
              <input className="fd-input" type="date" value={f.start} disabled={!isNew} onChange={x => set("start", x.target.value)} />
            </Field>
            <Field label="Function"><select className="fd-input" value={f.fn} onChange={x => set("fn", x.target.value)}>{Object.entries(EXP_FN).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <PaidFrom value={f.paidFrom} onChange={v => set("paidFrom", v)} currency={f.currency} amountUsd={0} T={T} cashAccts={cashAccts} />
          </div>
          <div className="fd-grid2">
            <Field label="Programme or project (optional)"><input className="fd-input" value={f.programme} maxLength={120} onChange={x => set("programme", x.target.value)} placeholder="Website, Scholar Portal…" /></Field>
            <Field label="What it is for (optional)"><input className="fd-input" value={f.desc} maxLength={300} onChange={x => set("desc", x.target.value)} placeholder="Pro plan, used for maintenance" /></Field>
          </div>
          {!isNew && <Switch on={!f.paused} onChange={v => setF(p => ({ ...p, paused: !v }))}>{f.paused ? "Paused: no new payments are recorded" : "Active"}</Switch>}
          {err && <div className="fd-msg err">{err}</div>}
          <div className="fd-actions" style={{ marginTop: 6 }}>
            <button className="fd-btn primary" disabled={busy || !ok} onClick={submit}>{busy ? "Saving…" : "Save"}</button>
            <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </Modal>
    );
  }

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

  // The order of the cards is the order of the choices on the donate page (first = leftmost).
  // Rupiah transfers and international wires share one "Bank transfer" choice there, so they share a card here.
  // USDT and Bitcoin share one "Crypto" choice on the donate page, so they share a card here.
  const CHANNEL_KEYS = ["crypto", "qris", "bank", "card"];
  function ChannelsView({ store }) {
    const [open, setOpen] = useState(false);
    const [drag, setDrag] = useState(null);
    const [over, setOver] = useState(null);
    const [m, flash] = useFlash();
    const c = store.getPaymentConfig();
    const qi = c.qris && c.qris.payload ? store.parseQris(c.qris.payload) : null;
    const pockets = c.wire && c.wire.pockets ? Object.entries(c.wire.pockets).filter(([, v]) => v) : [];
    const wireLive = !!(c.wire && c.wire.enabled !== false && c.wire.swift && pockets.length);
    const idrLive = c.bank.enabled !== false && !!c.bank.account;
    const cards = {
      qris: { name: "QRIS (Indonesia)", on: !!(c.qris && c.qris.enabled !== false && qi && qi.ok), lines: [qi && qi.ok ? [qi.merchant, c.qris.provider].filter(Boolean).join(" · ") : "Not set"], mono: qi && qi.ok ? "NMID " + qi.nmid : "" },
      crypto: (() => {
        const usdtLive = c.usdt.enabled !== false && !!c.usdt.address;
        const btcLive = !!(c.btc && c.btc.enabled !== false && BTC_ADDR.test(String(c.btc.address || "")));
        return { name: "Crypto", on: usdtLive || btcLive,
          lines: [usdtLive ? "USDT · " + [c.usdt.network, c.usdt.anyEvm ? "own wallet, every EVM network" : ""].filter(Boolean).join(" · ") : "USDT · hidden",
            btcLive ? "Bitcoin · " + ((c.btc && c.btc.confirmations) || 2) + " confirmations" : "Bitcoin · hidden"],
          mono: [usdtLive && c.usdt.address, btcLive && c.btc.address].filter(Boolean).join("\n"),
          note: "Checked on chain automatically" + (c.usdt.autoVerify === false || (c.btc && c.btc.autoVerify === false) ? " where switched on in Edit channels." : "; Bitcoin is valued in dollars on the day it arrives.") };
      })(),
      bank: { name: "Bank transfer", on: idrLive || wireLive,
        lines: [idrLive ? "Rupiah · " + [c.bank.bank, c.bank.account].filter(Boolean).join(" ") : "Rupiah · hidden",
          wireLive ? pockets.map(([k]) => k).join(", ") + " · SWIFT " + c.wire.swift : "USD, EUR, SGD · hidden"],
        mono: [c.bank.holder, wireLive && c.wire.city].filter(Boolean).join(" · ") },
      card: { name: "Card (Mastercard / Visa)", on: c.card.enabled !== false && !!c.card.link, lines: ["Checkout page"], mono: c.card.link },
    };
    const saved = (Array.isArray(c.order) ? c.order : []).map(k => (k === "wire" ? "bank" : k === "usdt" || k === "btc" ? "crypto" : k)).filter(k => CHANNEL_KEYS.indexOf(k) >= 0);
    const order = [...new Set(saved.concat(CHANNEL_KEYS))];
    const move = (from, to) => {
      if (from == null || to == null || from === to || to < 0 || to >= order.length) return;
      const o = order.slice(); const [k] = o.splice(from, 1); o.splice(to, 0, k);
      store.savePaymentConfig({ ...store.getPaymentConfig(), order: o });
      const shown = o.filter(x => cards[x].on).map(x => cards[x].name.split(" (")[0]);
      flash("Order saved. The donate page now shows " + shown.join(", ") + ".");
    };
    return (
      <>
        <Head title="Payment channels" lede="How donors can give on the public donate page. Drag the cards to change the order: the first card is the first choice, on the left."><button className="fd-btn primary" onClick={() => setOpen(true)}>Edit channels</button></Head>
        <Flash m={m} />
        <div className="fd-chans" style={{ marginTop: m ? 12 : 0 }}>
          {order.map((k, i) => { const x = cards[k]; return (
            <div key={k} className={"fd-card fd-chan" + (drag === i ? " dragging" : "") + (over === i && drag !== null && drag !== i ? " over" : "")}
              draggable onDragStart={e => { setDrag(i); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", k); } catch (er) {} }}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (over !== i) setOver(i); }}
              onDragLeave={() => { if (over === i) setOver(null); }}
              onDrop={e => { e.preventDefault(); move(drag, i); setDrag(null); setOver(null); }}
              onDragEnd={() => { setDrag(null); setOver(null); }}>
              <div className="fd-card-head" style={{ marginBottom: 6, alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                  <span className="fd-grip" aria-hidden="true" title="Drag to reorder">⠿</span>
                  <span className="fd-pos" title="Position on the donate page">{i + 1}</span>
                  <h2 className="fd-h2" style={{ margin: 0 }}>{x.name}</h2>
                </div>
                <Tag tone={x.on ? "ok" : ""} dot>{x.on ? "Shown" : "Hidden"}</Tag>
              </div>
              {x.lines.map((l, n) => <p key={n} className="fd-sub" style={{ margin: n ? "4px 0 0" : 0 }}>{l}</p>)}
              <p className="fd-mono" style={{ margin: "10px 0 0", fontSize: 12.5, overflowWrap: "anywhere", color: "var(--muted)", whiteSpace: "pre-line" }}>{x.mono || "Not set"}</p>
              {x.note && <p className="fd-sub" style={{ margin: "10px 0 0" }}>{x.note}</p>}
              <div className="fd-chan-move">
                <button className="fd-btn quiet sm" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={"Move " + x.name + " earlier"}>← Earlier</button>
                <button className="fd-btn quiet sm" disabled={i === order.length - 1} onClick={() => move(i, i + 1)} aria-label={"Move " + x.name + " later"}>Later →</button>
              </div>
            </div>); })}
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
    const [askShare, setAskShare] = useState(false);
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
      let ok = false;
      try { await store.saveImpactReports([...list, rec]); setF(rec); setBase(JSON.stringify(rec)); flash(msg); ok = true; }
      catch (e) { flash("Could not save. Check your connection and try again.", "err"); }
      setBusy("");
      return ok;
    };
    const save = () => commit(f, published ? "Saved. The public report is updated." : "Draft saved.");
    const publish = () => {
      const s = computeImpact(store, f);
      const first = !f.publishedAt;
      commit({ ...f, status: "published", snapshot: s, publishedAt: f.publishedAt || new Date().toISOString() }, "Published. The report is live on the website.")
        .then(ok => { if (ok && (first || !f.emailedAt)) setAskShare(true); });
    };
    const unpublish = () => commit({ ...f, status: "draft", public: null, snapshot: null }, "Back to draft. The public page no longer shows this report.");
    const preview = print => {
      try { localStorage.setItem("brial-impact-preview", JSON.stringify(reportForPublic(f, snap))); } catch (e) {}
      window.open("/impact/" + f.year + "?preview=1" + (print ? "&print=1" : ""), "_blank", "noopener");
    };
    const P = snap.people, G = snap.gifts, M = snap.money;

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
                <button className="fd-btn primary sm" onClick={() => setMailOpen(true)}>Share with donors</button>
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
        {askShare && (
          <Modal title="Your report is live" sub={reportUrl(f.year)} onClose={() => setAskShare(false)}>
            <p className="fd-sub" style={{ fontSize: 14, lineHeight: 1.6 }}>Would you like to share it with your donors by email? You choose who receives it and see the email before anything is sent. Nothing goes out unless you confirm.</p>
            <div className="fd-actions" style={{ marginTop: 16 }}>
              <button className="fd-btn primary" onClick={() => { setAskShare(false); setMailOpen(true); }}>Choose donors and preview</button>
              <button className="fd-btn ghost" onClick={() => setAskShare(false)}>Not now</button>
            </div>
          </Modal>
        )}
        {mailOpen && <AnnounceDialog store={store} audience="donor" preset={{ ...impactTemplate(f), from: "hello", title: "Share the report with donors" }} onClose={() => setMailOpen(false)} onSent={n => commit({ ...f, emailedAt: new Date().toISOString(), emailedCount: (f.emailedCount || 0) + n }, `Sent to ${n} ${plural(n, "donor", "donors")}.`)} />}
      </>
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

  const MAIL_LABEL = { test: "Test email", message: "Email", announcement: "Announcement" };
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
              <select className="fd-input" value={f.from} onChange={e => set("from", e.target.value)}>{SENDERS.map(s => <option key={s[0]} value={s[0]}>{s[1]} · {s[2]}</option>)}</select>
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

  // ============================================================
  // ANNOUNCEMENTS: one message to many donors or awardees, each in their own email
  // ============================================================
  const TYPO_DOMAINS = { "gmial.com": "gmail.com", "gamil.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gnail.com": "gmail.com", "yahoo.con": "yahoo.com", "yaho.com": "yahoo.com", "hotmial.com": "hotmail.com", "hotmail.con": "hotmail.com", "outlok.com": "outlook.com" };
  // A warning, never a block: an address that is valid in form but very likely mistyped
  const emailDoubt = e => {
    const [user, host] = String(e || "").toLowerCase().split("@");
    if (!host) return "";
    if (TYPO_DOMAINS[host]) return "Did you mean @" + TYPO_DOMAINS[host] + "?";
    if ((host === "gmail.com" || host === "googlemail.com") && user.split("+")[0].replace(/\./g, "").length < 6) return "Gmail addresses have at least 6 characters before the @, so this one is probably mistyped.";
    return "";
  };
  // Keep a name as the person wrote it, unless it is all lower or all upper case
  const nameCase = s => { const t = String(s || "").trim(); return t && (t === t.toLowerCase() || t === t.toUpperCase()) ? titleCase(t) : t; };
  // The name used for {nama}: the first real word of the name ("M Iqramul Hakim" greets Iqramul)
  const greetName = s => { const w = nameCase(s).split(/\s+/).map(x => x.replace(/\./g, "")).filter(Boolean); const pick = w.find(x => x.length > 1) || w[0] || ""; return pick ? pick.charAt(0).toUpperCase() + pick.slice(1) : ""; };
  const AUD = {
    donor: { one: "donor", many: "donors", title: "Announcement to donors", sub: "Everyone who gave through the website, plus anyone you add. Each person gets their own email, with a link to unsubscribe." },
    awardee: { one: "awardee", many: "awardees", title: "Announcement to awardees", sub: "Your Brial Scholars, plus anyone you add, such as a guardian. Each person gets their own email." },
  };
  // Everyone the records know for an audience, merged with the addresses added by hand
  function audienceList(store, audience, extra) {
    const unsub = new Set((extra.unsubscribed || []).filter(x => x.audience === audience).map(x => String(x.email).toLowerCase()));
    const map = new Map();
    const row = email => { const k = String(email).trim().toLowerCase(); if (!map.has(k)) map.set(k, { key: k, email: String(email).trim(), name: "", manual: false, gifts: 0, verified: 0, lastAt: "" }); return map.get(k); };
    if (audience === "donor") {
      (store.listDonations() || []).forEach(d => {
        if ((store.isInternalDonation && store.isInternalDonation(d)) || isSaleD(d) || isEntD(d)) return;
        const e = String(d.email || "").trim(); if (!okEmail(e)) return;
        const r = row(e), at = String(d.submittedAt || d.created_at || "");
        r.gifts += 1; if (d.verified) r.verified += 1;
        if (at >= r.lastAt) { r.lastAt = at; if (!d.anonymous && d.name) r.name = nameCase(d.name); }
        else if (!r.name && !d.anonymous && d.name) r.name = nameCase(d.name);
      });
    } else {
      (store.listApplicants() || []).filter(a => a.status === "accepted" && okEmail(a.email)).forEach(a => {
        const r = row(a.email); r.name = nameCase(a.name || ""); r.scholarId = a.scholarId || ""; r.sch = a.scholarStatus || "active";
      });
    }
    (extra.contacts || []).filter(c => c.audience === audience && okEmail(c.email)).forEach(c => { const r = row(c.email); r.manual = true; if (!r.name && c.name) r.name = c.name; });
    return [...map.values()].map(r => ({ ...r, unsub: unsub.has(r.key), doubt: emailDoubt(r.email) }))
      .sort((a, b) => (a.unsub - b.unsub) || String(a.name || a.email).localeCompare(String(b.name || b.email)));
  }
  // Ticked to begin with: people you would normally write to, never a doubtful or unsubscribed address
  const defaultPick = (audience, r) => !r.unsub && !r.doubt && (audience === "donor" ? r.verified > 0 || r.manual : r.manual || r.sch === "active");
  const APP_BODY = {
    awardee: "Halo {nama},\n\nKabar baik: The Brial Endowment sekarang bisa dipasang sebagai aplikasi di HP, tablet, maupun laptop kamu. Dengan aplikasi ini, Scholar Portal, informasi semester, dan pengumuman dari kami bisa kamu buka dengan satu ketukan dari layar utama, tanpa perlu mengetik alamat situs setiap kali.\n\nKami sangat menyarankan kamu memasangnya. Caranya mudah dan tidak perlu lewat Play Store atau App Store:\n\nAndroid (Chrome): buka brialendowment.org, ketuk menu ⋮ di kanan atas, lalu pilih \"Install app\" atau \"Tambahkan ke layar utama\".\n\niPhone atau iPad (Safari): buka brialendowment.org, ketuk tombol Share, gulir ke bawah, lalu pilih \"Add to Home Screen\".\n\nLaptop (Chrome atau Edge): buka brialendowment.org, lalu klik ikon install di ujung kanan address bar.\n\nKamu juga bisa menggulir ke bagian paling bawah situs dan mengetuk \"Install the app\". Langkah-langkahnya akan ditunjukkan sesuai perangkat yang kamu pakai.\n\nSetelah terpasang, ikon bintang emas The Brial Endowment akan muncul di layar utamamu. Untuk masuk ke portal, buka aplikasinya, gulir ke bagian Scholar Portal, lalu masuk seperti biasa. Aplikasi ini memperbarui dirinya sendiri setiap kali ada perubahan, jadi kamu selalu melihat informasi terbaru, dan hampir tidak memakan ruang penyimpanan.\n\nKalau ada kendala saat memasangnya, cukup balas email ini.\n\nSalam hangat,",
    donor: "Dear {nama},\n\nThe Brial Endowment can now be installed as an app on your phone, tablet or computer. It keeps the open ledger, our programmes and every update one tap away, without typing the address each time.\n\nIt takes a few seconds and needs no app store:\n\nAndroid (Chrome): open brialendowment.org, tap the ⋮ menu, then choose \"Install app\" or \"Add to Home screen\".\n\niPhone or iPad (Safari): open brialendowment.org, tap Share, then choose \"Add to Home Screen\".\n\nComputer (Chrome or Edge): open brialendowment.org and click the install icon at the right end of the address bar.\n\nYou can also tap \"Install the app\" at the bottom of the website, and it shows the steps for your device.\n\nThank you for being part of something meant to outlast us all.\n\nWith gratitude,",
  };
  const impactTemplate = rep => ({ subject: `${rep.title}: what your gift became`, body: `Dear {nama},\n\nYour gift helped make this year possible, and we would like you to see what it became. Our ${rep.title} report is now published:\n\n${reportUrl(rep.year)}\n\nThank you for trusting us with something meant to outlast us all.\n\nWith gratitude,`, sign: true });
  const ICON_DONOR = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>;
  const ICON_AWARDEE = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c2.5 2 9.5 2 12 0v-5" /><path d="M22 9v6" /></svg>;

  function AnnounceDialog({ store, audience, preset, onClose, onSent }) {
    const A = AUD[audience];
    const [extra, setExtra] = useState(null);
    const [note, setNote] = useState("");
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    const [pick, setPick] = useState(null);
    const [f, setF] = useState(() => ({ from: (preset && preset.from) || "hello", subject: (preset && preset.subject) || "", body: (preset && preset.body) || "", sign: preset && typeof preset.sign === "boolean" ? preset.sign : true }));
    const [add, setAdd] = useState({ open: false, email: "", name: "", err: "", busy: false });
    const [prev, setPrev] = useState(null);
    const [busy, setBusy] = useState("");
    const [err, setErr] = useState("");
    const allRef = useRef(null);
    const load = useCallback(async () => {
      try { setExtra(await store.mailContacts()); setNote(""); }
      catch (e) { setExtra(x => x || { contacts: [], unsubscribed: [] }); setNote("The addresses you added by hand could not be loaded. Everyone in your records is still here."); }
    }, [store]);
    useEffect(() => { load(); }, [load]);
    const list = useMemo(() => (extra ? audienceList(store, audience, extra) : []), [extra, store, audience]);
    useEffect(() => { if (extra && pick === null) setPick(new Set(list.filter(r => defaultPick(audience, r)).map(r => r.key))); }, [extra, list]);
    const sel = pick || new Set();
    const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setPrev(null); };
    const count = fn => list.filter(fn).length;
    const FILTERS = audience === "donor"
      ? [["all", "All", list.length], ["verified", "Verified gifts", count(r => r.verified > 0)], ["waiting", "Awaiting verification", count(r => r.gifts > 0 && !r.verified)], ["manual", "Added by you", count(r => r.manual)], ["unsub", "Unsubscribed", count(r => r.unsub)]]
      : [["all", "All", list.length], ["active", "Active", count(r => r.sch === "active")], ["other", "Paused or graduated", count(r => r.sch && r.sch !== "active")], ["manual", "Added by you", count(r => r.manual)]];
    const passes = r => filter === "all" || (filter === "verified" && r.verified > 0) || (filter === "waiting" && r.gifts > 0 && !r.verified) || (filter === "manual" && r.manual) || (filter === "unsub" && r.unsub) || (filter === "active" && r.sch === "active") || (filter === "other" && r.sch && r.sch !== "active");
    const needle = q.trim().toLowerCase();
    const shown = list.filter(r => passes(r) && (!needle || (r.name + " " + r.email + " " + (r.scholarId || "")).toLowerCase().includes(needle)));
    const selectable = shown.filter(r => !r.unsub);
    const onCount = selectable.filter(r => sel.has(r.key)).length;
    const allOn = selectable.length > 0 && onCount === selectable.length;
    useEffect(() => { if (allRef.current) allRef.current.indeterminate = onCount > 0 && !allOn; }, [onCount, allOn]);
    const toggle = k => { setPick(p => { const n = new Set(p || []); n.has(k) ? n.delete(k) : n.add(k); return n; }); setPrev(null); };
    const toggleAll = () => { setPick(p => { const n = new Set(p || []); selectable.forEach(r => (allOn ? n.delete(r.key) : n.add(r.key))); return n; }); setPrev(null); };
    const chosen = list.filter(r => !r.unsub && sel.has(r.key));
    const doubtful = chosen.filter(r => r.doubt).length;
    const ready = chosen.length > 0 && f.subject.trim() && f.body.trim();
    const names = () => { const o = {}; chosen.forEach(r => { const g = greetName(r.name); if (g) o[r.key] = g; }); return o; };
    const msg = () => ({ audience, to: chosen.map(r => r.email), names: names(), from: f.from, subject: f.subject.trim(), body: f.body.trim(), sign: f.sign });

    const addContact = async () => {
      const e = add.email.trim();
      if (!okEmail(e)) { setAdd(a => ({ ...a, err: "This doesn't look like an email address." })); return; }
      const k = e.toLowerCase(), have = list.find(r => r.key === k);
      if (have && have.unsub) { setAdd(a => ({ ...a, err: "This person unsubscribed from these emails. Only they can subscribe again, from the link in any earlier email." })); return; }
      setAdd(a => ({ ...a, busy: true, err: "" }));
      try {
        await store.addMailContact(audience, e, add.name.trim());
        await load();
        if (!emailDoubt(e)) setPick(p => new Set([...(p || []), k]));
        setFilter("all"); setQ("");
        setAdd({ open: true, email: "", name: "", err: have ? "Already on the list, so it has been ticked." : "", busy: false });
      } catch (x) { setAdd(a => ({ ...a, busy: false, err: String(x && x.message).indexOf("invalid_email") >= 0 ? "This doesn't look like an email address." : "Could not add it. Try again in a moment." })); }
    };
    const removeContact = async r => {
      try { await store.removeMailContact(audience, r.email); await load(); setPick(p => { const n = new Set(p || []); n.delete(r.key); return n; }); }
      catch (x) { setErr("Could not remove it. Try again in a moment."); }
    };
    const sample = chosen.find(r => greetName(r.name)) || chosen[0];
    const preview = async () => { setBusy("prev"); setErr(""); try { setPrev(await store.previewAnnouncement({ ...msg(), previewName: sample ? greetName(sample.name) : "" })); } catch (e) { setErr("Could not load the preview."); } setBusy(""); };
    const usesName = /\{\s*(nama|name)\s*\}/i.test(f.subject + " " + f.body);
    const send = async () => {
      setBusy("send"); setErr("");
      try { const r = await store.sendAnnouncement(msg()); onSent(r && typeof r.queued === "number" ? r.queued : chosen.length, (r && r.skipped) || 0); onClose(); }
      catch (e) { const c = String(e && (e.message || e)); setErr(c.indexOf("rate_limited") >= 0 ? "That is more than 1,000 announcement emails in one day. Send the rest tomorrow." : c.indexOf("invalid_email") >= 0 ? "One of the addresses doesn't look right. Check the list and try again." : "Could not send right now. Try again in a moment."); }
      setBusy("");
    };
    const S = SENDERS.find(s => s[0] === f.from) || SENDERS[1];
    const meta = r => audience === "donor"
      ? (r.gifts ? `${r.gifts} ${plural(r.gifts, "gift", "gifts")}${r.verified < r.gifts ? ` · ${r.gifts - r.verified} awaiting verification` : ""} · last ${fdate(r.lastAt)}` : "No gift on record yet")
      : (r.scholarId ? r.scholarId : "Not a scholar record");
    const latest = (store.getImpactReports ? store.getImpactReports() : []).filter(r => r.status === "published").sort((a, b) => Number(b.year) - Number(a.year))[0];
    const templates = (ANN_TEMPLATES[audience] || []).concat(audience === "donor" && latest ? [["impact", "Impact Report " + latest.year, impactTemplate(latest)]] : []);
    const later = chosen.length > 90 ? chosen.length - 90 : 0;

    if (!extra || !pick) return <Modal xl title={A.title} sub={A.sub} onClose={onClose}><p className="fd-sub">Loading the list…</p></Modal>;
    return (
      <Modal xl title={preset && preset.title || A.title} sub={A.sub} onClose={onClose}>
        {prev ? (
          <>
            <div className="fd-sub" style={{ margin: "0 0 10px" }}><b style={{ color: "var(--text)" }}>From</b> {S[1]} &lt;{S[2]}&gt; · <b style={{ color: "var(--text)" }}>To</b> {chosen.length} {plural(chosen.length, A.one, A.many)}, each in their own email{usesName && sample ? ` · this preview is how ${sample.name || sample.email} will see it` : ""}{audience === "donor" ? " · with a link to stop these letters" : ""}</div>
            <iframe className="fd-mprev" title="Email preview" sandbox="" srcDoc={prev.html} />
            {later > 0 && <div className="fd-msg info" style={{ marginTop: 12 }}>The free plan sends up to 90 emails a day. The first 90 go out now and the other {later} follow automatically over the next day.</div>}
            {err && <div className="fd-msg err" style={{ marginTop: 12 }}>{err}</div>}
            <div className="fd-actions" style={{ marginTop: 14 }}>
              <Confirm className="fd-btn primary" armedLabel={`Confirm · send to ${chosen.length} ${plural(chosen.length, A.one, A.many)}`} disabled={!ready || !!busy} onConfirm={send}>{busy === "send" ? "Sending…" : "Send"}</Confirm>
              <button className="fd-btn ghost" onClick={() => setPrev(null)}>Back to editing</button>
            </div>
          </>
        ) : (
          <>
            {note && <div className="fd-msg info" style={{ marginBottom: 14 }}>{note}</div>}
            <div className="fd-aud">
              <section aria-label="Recipients">
                <div className="fd-aud-h"><h4>1 · Who receives it</h4><Tag tone={chosen.length ? "ok" : ""}>{chosen.length} of {list.filter(r => !r.unsub).length} selected</Tag></div>
                <Search value={q} onChange={setQ} placeholder={audience === "donor" ? "Search a name or email" : "Search a name, email or scholar ID"} />
                <div style={{ margin: "10px 0" }}><Seg items={FILTERS.filter(x => x[0] === "all" || x[2] > 0)} value={filter} onChange={setFilter} /></div>
                <div className="fd-aud-box">
                  <div className="fd-aud-all">
                    <label><input ref={allRef} type="checkbox" checked={allOn} disabled={!selectable.length} onChange={toggleAll} />{allOn ? "Untick all shown" : "Tick all shown"}{selectable.length !== list.length ? ` (${selectable.length})` : ""}</label>
                    {sel.size > 0 && <button className="fd-btn quiet sm" onClick={() => { setPick(new Set()); setPrev(null); }}>Clear</button>}
                  </div>
                  <div className="fd-aud-rows">
                    {shown.length === 0 ? <p className="fd-sub" style={{ padding: "14px" }}>{list.length ? "No one matches." : `No ${A.many} with an email yet. Add one below.`}</p> : shown.map(r => (
                      <div className={"fd-aud-row" + (r.unsub ? " off" : "")} key={r.key}>
                        <label>
                          <input type="checkbox" checked={!r.unsub && sel.has(r.key)} disabled={r.unsub} onChange={() => toggle(r.key)} aria-label={(r.name || r.email) + (r.unsub ? ", unsubscribed" : "")} />
                          <span className="fd-aud-main">
                            <b>{r.name || r.email}</b>
                            {r.name && <small>{r.email}</small>}
                            <small>{meta(r)}</small>
                            {r.doubt && <small className="fd-aud-doubt">{r.doubt}</small>}
                          </span>
                        </label>
                        <span className="fd-aud-tags">
                          {r.unsub && <Tag tone="bad">Unsubscribed</Tag>}
                          {r.doubt && !r.unsub && <Tag tone="warn">Check address</Tag>}
                          {audience === "awardee" && r.sch && SCH[r.sch] && <Tag tone={SCH[r.sch][0]}>{SCH[r.sch][1]}</Tag>}
                          {r.manual && <Tag>Added by you</Tag>}
                          {r.manual && <Confirm className="fd-btn quiet sm" armedLabel="Remove?" onConfirm={() => removeContact(r)}>Remove</Confirm>}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="fd-aud-add">
                    {!add.open ? <button className="fd-btn quiet sm" onClick={() => setAdd(a => ({ ...a, open: true }))}>+ Add an email</button> : (
                      <>
                        <div className="fd-aud-addrow">
                          <input className="fd-input" type="email" value={add.email} onChange={e => setAdd(a => ({ ...a, email: e.target.value, err: "" }))} onKeyDown={e => { if (e.key === "Enter") addContact(); }} placeholder="name@example.com" aria-label="Email to add" spellCheck={false} autoFocus />
                          <input className="fd-input" value={add.name} onChange={e => setAdd(a => ({ ...a, name: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") addContact(); }} placeholder="Name (optional)" aria-label="Name" />
                          <button className="fd-btn primary sm" disabled={add.busy || !add.email.trim()} onClick={addContact}>{add.busy ? "Adding…" : "Add"}</button>
                        </div>
                        {add.email && emailDoubt(add.email) && !add.err && <small className="fd-aud-doubt" style={{ display: "block", marginTop: 6 }}>{emailDoubt(add.email)}</small>}
                        {add.err && <small className={add.err.indexOf("Already") === 0 ? "fd-sub" : "fd-bad"} style={{ display: "block", marginTop: 6 }}>{add.err}</small>}
                        <small className="fd-sub" style={{ display: "block", marginTop: 6 }}>{audience === "donor" ? "For someone who gave outside the website. Saved for next time." : "For example a guardian. Saved for next time."}</small>
                      </>
                    )}
                  </div>
                </div>
              </section>
              <section aria-label="Message">
                <div className="fd-aud-h"><h4>2 · The message</h4></div>
                <Field label="From">
                  <select className="fd-input" value={f.from} onChange={e => set("from", e.target.value)}>{SENDERS.map(s => <option key={s[0]} value={s[0]}>{s[1]} · {s[2]}</option>)}</select>
                </Field>
                <Field label="Subject" style={{ marginTop: 12 }}><input className="fd-input" value={f.subject} maxLength={200} onChange={e => set("subject", e.target.value)} placeholder={audience === "donor" ? "News from The Brial Endowment" : "Kabar untuk Brial Scholars"} /></Field>
                {templates.length > 0 && (
                  <div className="fd-actions" style={{ margin: "12px 0 6px" }}>
                    <span className="fd-sub" style={{ margin: 0 }}>Start from</span>
                    {templates.map(([id, label, t]) => <button key={id} className="fd-btn quiet sm" onClick={() => { setF(p => ({ ...p, subject: t.subject, body: t.body, sign: !!t.sign })); setPrev(null); }}>{label}</button>)}
                    <button className="fd-btn quiet sm" onClick={() => { setF(p => ({ ...p, subject: "", body: "" })); setPrev(null); }}>Blank</button>
                  </div>
                )}
                <Field label="Message" hint="Write {nama} where the person's first name should go, for example Dear {nama}. Leave an empty line between paragraphs." style={{ marginTop: templates.length ? 0 : 12 }}>
                  <textarea className="fd-input" rows={12} maxLength={10000} value={f.body} onChange={e => set("body", e.target.value)} placeholder={audience === "donor" ? "Dear {nama}, …" : "Halo {nama}, …"} />
                </Field>
                <div className="fd-krow" style={{ borderTop: 0 }}><div><b>Sign with my name</b><small>Adds "Brial Asif Hayi Paka · Founder, The Brial Endowment" under the message.</small></div><Switch on={f.sign} onChange={v => set("sign", v)}>{f.sign ? "On" : "Off"}</Switch></div>
              </section>
            </div>
            {err && <div className="fd-msg err" style={{ marginTop: 12 }}>{err}</div>}
            <div className="fd-aud-foot">
              <small className="fd-sub" style={{ margin: 0, maxWidth: 520 }}>
                {chosen.length ? `${chosen.length} ${plural(chosen.length, A.one, A.many)} will each get their own email. No one sees the other addresses.` : `Tick at least one ${A.one}.`}
                {doubtful ? ` ${doubtful} ticked ${plural(doubtful, "address looks", "addresses look")} mistyped.` : ""}
                {later ? ` About ${later} will go out tomorrow because of the daily limit.` : ""}
              </small>
              <div className="fd-actions">
                <button className="fd-btn ghost" onClick={onClose}>Cancel</button>
                <button className="fd-btn primary" disabled={!ready || !!busy} onClick={preview}>{busy === "prev" ? "Preparing…" : "Preview"}</button>
              </div>
            </div>
          </>
        )}
      </Modal>
    );
  }
  const ANN_TEMPLATES = {
    awardee: [["app", "Install the app", { subject: "The Brial Endowment kini hadir sebagai aplikasi", body: APP_BODY.awardee, sign: true }]],
    donor: [["app", "Install the app", { subject: "The Brial Endowment is now an app", body: APP_BODY.donor, sign: true }]],
  };

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
    const [announce, setAnnounce] = useState(null); // "donor" | "awardee"
    const [aud, setAud] = useState(null);
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
    const loadAud = useCallback(() => { store.mailContacts().then(x => setAud(x)).catch(() => setAud({ contacts: [], unsubscribed: [] })); }, [store]);
    useEffect(() => { loadAud(); }, [loadAud]);
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
              <h2 className="fd-h2" style={{ marginTop: 0 }}>Announcements</h2>
              <p className="fd-sub" style={{ margin: 0 }}>News for many people at once. You choose exactly who receives it, and each person gets their own email.</p>
              <div className="fd-aud-tiles">
                {["donor", "awardee"].map(k => {
                  const L = aud ? audienceList(store, k, aud) : null;
                  const can = L ? L.filter(r => !r.unsub).length : null;
                  return (
                    <button key={k} type="button" className="fd-aud-tile" disabled={paused} title={paused ? "Resume sending first" : ""} onClick={() => setAnnounce(k)}>
                      <span className="fd-aud-ico">{k === "donor" ? ICON_DONOR : ICON_AWARDEE}</span>
                      <span><b>{k === "donor" ? "Donors" : "Awardees"}</b><small>{L === null ? "Loading…" : `${can} ${plural(can, AUD[k].one, AUD[k].many)}${L.length > can ? ` · ${L.length - can} unsubscribed` : ""}`}</small></span>
                      <span className="fd-aud-go" aria-hidden="true">→</span>
                    </button>
                  );
                })}
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
                  <b>{x.kind === "message" || x.kind === "announcement" ? (x.subject || MAIL_LABEL[x.kind]) : (MAIL_LABEL[x.kind] || x.kind)}</b><Tag tone={MAIL_TONE[x.status]}>{MAIL_WORD[x.status] || x.status}</Tag>
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
        {announce && <AnnounceDialog store={store} audience={announce} onClose={() => { setAnnounce(null); loadAud(); }} onSent={(n, skipped) => { flash(`${n} ${plural(n, "email is", "emails are")} on the way.${skipped ? ` ${skipped} unsubscribed ${plural(skipped, "person was", "people were")} left out.` : ""}`); setTimeout(load, 5000); setTimeout(load, 15000); }} />}
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
        { id: "assets", label: "Assets", icon: ICON.assets },
        { id: "costs", label: "Operating costs", icon: ICON.costs },
        { id: "channels", label: "Payment channels", icon: ICON.pay },
      ];
      const t = nav.some(n => n.id === tab) ? tab : "overview";
      view = t === "overview" ? <TreasuryOverview store={store} go={setTab} />
        : t === "in" ? <DonationsView store={store} donations={store.listDonations()} title="Money in" />
        : t === "out" ? <MoneyOutView store={store} />
        : t === "ledger" ? <LedgerView store={store} />
        : t === "assets" ? <AssetsView store={store} go={setTab} />
        : t === "costs" ? <OpsView store={store} go={setTab} />
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
