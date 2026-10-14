// ============================================================
// SCHOLAR HOME — portal for accepted awardees (redesign, Oct 2026)
// Source for the block compiled into site/student.compiled.js.
// Build: see scripts/build-scholar-home.sh
// ============================================================
const SH = (() => {
  const { useState, useEffect, useMemo, useRef } = React;

  // ---------------- language (EN / ID) ----------------
  const ID = {
    "Overview": "Ringkasan", "My profile": "Profil saya", "Account": "Akun", "Help": "Bantuan",
    "Sign out": "Keluar", "Scholar Portal": "Portal Penerima", "Back to website": "Kembali ke situs",
    "Active scholar": "Penerima aktif", "Scholarship paused": "Beasiswa ditangguhkan", "Scholarship ended": "Beasiswa dihentikan", "Brial alum": "Alumni Brial",
    "Scholar ID": "ID penerima", "Class": "Angkatan", "Programme": "Jenjang", "Funded semesters": "Semester didanai",
    "Next step": "Langkah berikutnya",
    "Upload bill": "Unggah tagihan", "Upload transcript": "Unggah transkrip", "Upload graduation documents": "Unggah dokumen kelulusan",
    "View bill": "Lihat tagihan", "View transcript": "Lihat transkrip", "View": "Lihat",
    "Total received": "Total diterima", "Semesters paid": "Semester dibayar", "Cumulative GPA": "IPK kumulatif", "Awaiting payment": "Menunggu pembayaran",
    "Appears after your first transcript": "Muncul setelah transkrip pertama", "Keep it at 2.75 or higher to continue the award": "Pertahankan minimal 2,75 agar beasiswa berlanjut",
    "Below the 2.75 minimum — talk to the foundation": "Di bawah batas 2,75 — hubungi yayasan",
    "Your semesters": "Semester Anda", "Semester": "Semester",
    "Tuition bill": "Tagihan UKT", "Transcript": "Transkrip nilai",
    "Not uploaded yet": "Belum diunggah", "Opens after tuition is paid": "Terbuka setelah UKT dibayar", "Opens when this semester starts": "Terbuka saat semester dimulai",
    "Paid": "Dibayar", "In review": "Sedang ditinjau", "Upcoming": "Akan datang", "Action needed": "Perlu tindakan", "Complete": "Selesai", "Results due": "Menunggu nilai",
    "How your scholarship works": "Cara beasiswa Anda berjalan",
    "At the start of each semester, upload the official tuition bill (UKT) from your university.": "Di awal setiap semester, unggah tagihan UKT resmi dari kampus Anda.",
    "The foundation reviews the bill and pays your tuition. You will see the payment here.": "Yayasan meninjau tagihan dan membayar UKT Anda. Pembayarannya akan tampil di sini.",
    "When grades are out, upload your transcript and semester GPA. Keep your cumulative GPA at 2.75 or higher.": "Setelah nilai keluar, unggah transkrip dan IP semester. Jaga IPK kumulatif minimal 2,75.",
    "Your public photo": "Foto publik Anda", "This photo appears on the Scholars page of brialendowment.org.": "Foto ini tampil di halaman Scholars di brialendowment.org.",
    "Change photo": "Ganti foto", "Upload photo": "Unggah foto", "Uploading…": "Mengunggah…",
    "JPG, PNG or WebP, up to 2 MB.": "JPG, PNG, atau WebP, maks. 2 MB.",
    "Personal details": "Data pribadi", "Education": "Pendidikan", "Documents": "Dokumen",
    "Full name": "Nama lengkap", "Date of birth": "Tanggal lahir", "Phone": "Telepon", "Country": "Negara", "Address": "Alamat", "National ID": "NIK / Paspor", "Email": "Email",
    "University": "Universitas", "Study programme": "Program studi", "Current semester": "Semester saat ini", "GPA at application": "IPK saat mendaftar", "Tuition per semester": "UKT per semester",
    "High school": "Sekolah menengah", "Graduation year": "Tahun lulus", "Final grade": "Nilai akhir",
    "Biometric photo": "Pas foto", "Report card": "Rapor", "Student card": "Kartu mahasiswa",
    "Not provided": "Tidak ada", "Spot a mistake? Request a correction from the Account tab.": "Ada yang salah? Ajukan koreksi dari tab Akun.",
    "Sign-in email": "Email masuk", "Change password": "Ganti password", "New password": "Password baru", "Confirm new password": "Ulangi password baru",
    "At least 8 characters.": "Minimal 8 karakter.", "Show passwords": "Tampilkan password", "Save new password": "Simpan password baru",
    "Password updated. Other devices have been signed out.": "Password diperbarui. Perangkat lain sudah dikeluarkan.",
    "Passwords do not match.": "Password tidak sama.", "Password must be at least 8 characters.": "Password minimal 8 karakter.",
    "Request a correction": "Ajukan koreksi data", "Changes to your details are checked by the foundation before they take effect.": "Perubahan data diperiksa yayasan sebelum berlaku.",
    "What needs correcting?": "Apa yang perlu dikoreksi?", "Correct value": "Data yang benar", "Send request": "Kirim permintaan",
    "Request sent. The foundation will review it.": "Permintaan terkirim. Yayasan akan meninjaunya.", "Please enter the correct value.": "Isi data yang benar.",
    "Your requests": "Permintaan Anda", "Pending": "Menunggu", "Approved": "Disetujui", "Declined": "Ditolak", "Reason:": "Alasan:",
    "Message the foundation": "Kirim pesan ke yayasan", "Questions about payments, documents or your account — we read every message.": "Pertanyaan soal pembayaran, dokumen, atau akun — setiap pesan kami baca.",
    "Topic": "Topik", "Subject": "Judul", "Message": "Pesan", "Send message": "Kirim pesan",
    "Payment": "Pembayaran", "My details": "Data saya", "Technical problem": "Masalah teknis", "Something else": "Lainnya",
    "Message sent. The reply will appear below.": "Pesan terkirim. Balasan akan muncul di bawah.",
    "Your messages": "Pesan Anda", "Reply from the foundation": "Balasan yayasan", "Open": "Terbuka", "Replied": "Dibalas", "Resolved": "Selesai",
    "No messages yet.": "Belum ada pesan.",
    "Close": "Tutup", "Cancel": "Batal", "Save": "Simpan", "Saved": "Tersimpan", "Try again": "Coba lagi",
    "Choose a file": "Pilih file", "PDF, JPG, PNG or WebP, up to 2 MB.": "PDF, JPG, PNG, atau WebP, maks. 2 MB.", "Replace file": "Ganti file",
    "Amount due (USD)": "Jumlah tagihan (USD)", "Semester GPA": "IP semester", "Enter a number between 0 and 4, for example 3.62.": "Isi angka 0–4, contoh 3.62.",
    "Enter the amount on the bill.": "Isi jumlah sesuai tagihan.",
    "Diploma (ijazah)": "Ijazah", "Final transcript": "Transkrip akhir",
    "Congratulations on completing your studies.": "Selamat atas kelulusan Anda.",
    "Your graduation record": "Catatan kelulusan Anda",
    "No semesters have been set up yet. The foundation will add them shortly.": "Semester belum disiapkan. Yayasan akan segera menambahkannya.",
    "You're all set": "Semua beres",
    "Nothing needs your attention right now. We'll show the next step here when it's time.": "Saat ini tidak ada yang perlu Anda lakukan. Langkah berikutnya akan muncul di sini pada waktunya.",
    "Message the foundation ": "Hubungi yayasan ",
    "Application essay": "Esai pendaftaran", "Subject grades": "Nilai mata pelajaran", "Scholarship history": "Riwayat beasiswa",
    "Active": "Aktif", "Paused": "Ditangguhkan", "Ended": "Dihentikan", "Graduated": "Lulus",
  };
  // English only — the EN/ID switch was retired (visitors use browser translation).
  const lang = "en";
  const t = s => (lang === "id" && ID[s]) || s;
  const L = (en, id) => (lang === "id" ? id : en);
  function useLang() { return lang; }

  // ---------------- helpers ----------------
  const money = n => "$" + (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const date = iso => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  };
  const fileUrl = f => {
    if (!f) return null;
    if (f.url) return f.url;
    const p = f.path || f.key;
    return p && window.brialSupabase ? window.brialSupabase.publicUrl(p) : null;
  };
  const isImage = f => !!f && (/^image\//i.test(f.type || "") || /\.(png|jpe?g|webp|gif)$/i.test(f.name || f.path || ""));
  const firstName = n => (n || "").trim().split(/\s+/)[0] || "";
  const titleCase = s => (s || "").toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  // institution names: keep short all-caps abbreviations (SMAN, UIN, MAN, D3)
  const instCase = s => (s || "").split(/(\s+)/).map(w => (/^[A-Z0-9]{1,4}$/.test(w) ? w : titleCase(w))).join("");

  // ---------------- styles (once) ----------------
  const CSS = `
.bsp{--bg:#0A1628;--surface:#0F1E36;--raised:#132746;--line:rgba(239,233,220,.10);--line2:rgba(239,233,220,.16);--gilt:#C9A961;--gilt2:#E2C98E;--giltsoft:rgba(201,169,97,.13);--text:#EFE9DC;--muted:rgba(239,233,220,.66);--faint:rgba(239,233,220,.44);--sage:#8FD4A8;--amber:#E7B76A;--rose:#E58686;
  min-height:100vh;background:var(--bg);color:var(--text);font-family:'Manrope',system-ui,sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.bsp *{box-sizing:border-box}
.bsp button{font-family:inherit}
.bsp :focus-visible{outline:2px solid var(--gilt);outline-offset:3px;border-radius:6px}
.bsp-top{position:sticky;top:0;z-index:40;background:rgba(10,22,40,.88);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);border-bottom:1px solid var(--line)}
.bsp-top-in{max-width:1120px;margin:0 auto;padding:0 24px;height:68px;display:flex;align-items:center;gap:28px}
.bsp-brand{display:flex;align-items:center;gap:12px;color:var(--text);text-decoration:none;flex-shrink:0}
.bsp-brand b{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:19px;letter-spacing:.01em;display:block;line-height:1.1}
.bsp-brand small{display:block;font-size:12px;color:var(--faint);line-height:1.2}
.bsp-tabs{display:flex;gap:4px;margin-left:auto;align-self:stretch}
.bsp-tab{position:relative;background:none;border:0;color:var(--muted);font-size:14px;font-weight:500;padding:0 14px;cursor:pointer;transition:color .2s}
.bsp-tab:hover{color:var(--text)}
.bsp-tab[aria-selected=true]{color:var(--text)}
.bsp-tab[aria-selected=true]::after{content:"";position:absolute;left:14px;right:14px;bottom:-1px;height:2px;background:var(--gilt);border-radius:2px}
.bsp-tab .bsp-badge{display:inline-block;min-width:18px;height:18px;padding:0 5px;margin-left:6px;border-radius:9px;background:var(--gilt);color:#0A1628;font-size:11px;font-weight:700;line-height:18px;text-align:center;vertical-align:1px}
.bsp-me{display:flex;align-items:center;gap:12px;flex-shrink:0}
.bsp-avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;object-position:50% 25%;border:1px solid rgba(201,169,97,.5);background:linear-gradient(135deg,#C9A961,#8B7A4A);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:17px;color:#0A1628}
.bsp-out{background:none;border:1px solid var(--line2);color:var(--muted);border-radius:10px;padding:8px 14px;font-size:13px;font-weight:500;cursor:pointer;transition:border-color .2s,color .2s}
.bsp-out:hover{border-color:rgba(201,169,97,.6);color:var(--text)}
.bsp-site{display:inline-flex;align-items:center;gap:7px;background:none;border:0;color:var(--muted);border-radius:10px;padding:8px 10px;font-size:13px;font-weight:500;cursor:pointer;transition:color .2s,background .2s}
.bsp-site:hover{color:var(--text);background:rgba(239,233,220,.05)}
.bsp-main{max-width:1120px;margin:0 auto;padding:36px 24px 120px}
.bsp-h2{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:30px;line-height:1.15;letter-spacing:-.005em;margin:0}
.bsp-h3{font-size:16px;font-weight:600;margin:0;color:var(--text)}
.bsp-sub{color:var(--muted);margin:6px 0 0;max-width:62ch}
.bsp-sec{margin-top:56px}
.bsp-sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap}

/* credential */
.bsp-cred{position:relative;overflow:hidden;border-radius:20px;padding:34px 36px;background:radial-gradient(120% 140% at 100% 0%,#1A3560 0%,#10223F 45%,#0C1A31 100%);border:1px solid rgba(201,169,97,.42);box-shadow:0 30px 80px -40px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.04);animation:bspRise .7s cubic-bezier(.22,1,.36,1) both}
.bsp-cred::after{content:"";position:absolute;inset:9px;border:1px solid rgba(201,169,97,.16);border-radius:13px;pointer-events:none}
.bsp-rosette{position:absolute;right:-90px;top:50%;width:420px;height:420px;transform:translateY(-50%);opacity:.22;pointer-events:none}
.bsp-cred-grid{position:relative;z-index:1;display:grid;grid-template-columns:auto 1fr auto;gap:30px;align-items:center}
.bsp-portrait{width:112px;height:140px;border-radius:12px;object-fit:cover;object-position:50% 25%;border:1px solid rgba(201,169,97,.5);box-shadow:0 18px 40px -20px rgba(0,0,0,.9);background:#0A1628;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:44px;color:var(--gilt)}
.bsp-name,.bsp-h2,.bsp-next h3,.bsp-step-head h4,.bsp-node,.bsp-fig b{font-variant-numeric:lining-nums proportional-nums}
.bsp-name{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(32px,4.4vw,46px);line-height:1.02;letter-spacing:-.01em;margin:0}
.bsp-prog{color:var(--muted);margin-top:8px;font-size:15px}
.bsp-facts{display:flex;flex-wrap:wrap;gap:10px 34px;margin-top:20px}
.bsp-fact span{display:block;font-size:12px;color:var(--faint)}
.bsp-fact b{display:block;font-weight:600;font-size:14px;color:var(--text);font-variant-numeric:tabular-nums;margin-top:2px}
.bsp-cred-status{align-self:start}
.bsp-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap;border:1px solid}
.bsp-chip i{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
.bsp-chip.ok{color:var(--sage);border-color:rgba(143,212,168,.4);background:rgba(143,212,168,.08)}
.bsp-chip.warn{color:var(--amber);border-color:rgba(231,183,106,.45);background:rgba(231,183,106,.08)}
.bsp-chip.bad{color:var(--rose);border-color:rgba(229,134,134,.45);background:rgba(229,134,134,.08)}
.bsp-chip.gold{color:var(--gilt2);border-color:rgba(201,169,97,.5);background:var(--giltsoft)}

/* next step + figures */
.bsp-row{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:20px;margin-top:20px}
.bsp-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:26px 28px}
.bsp-next{display:flex;flex-direction:column;justify-content:space-between;gap:22px;background:linear-gradient(160deg,#122646,#0F1E36 70%);border-color:rgba(201,169,97,.28)}
.bsp-next-k{font-size:13px;color:var(--gilt2);font-weight:600}
.bsp-next h3{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:28px;line-height:1.15;margin:8px 0 0}
.bsp-next p{color:var(--muted);margin:10px 0 0;max-width:52ch}
.bsp-actions{display:flex;gap:10px;flex-wrap:wrap}
.bsp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:background .2s,border-color .2s,color .2s,transform .15s;text-decoration:none;white-space:nowrap}
.bsp-btn:active{transform:translateY(1px)}
.bsp-btn.primary{background:var(--gilt);color:#0A1628}
.bsp-btn.primary:hover{background:var(--gilt2)}
.bsp-btn.ghost{background:transparent;color:var(--text);border-color:var(--line2)}
.bsp-btn.ghost:hover{border-color:rgba(201,169,97,.6)}
.bsp-btn.small{padding:8px 14px;font-size:13px;border-radius:9px}
.bsp-btn[disabled]{opacity:.45;cursor:not-allowed}
.bsp-link{background:none;border:0;padding:0;color:var(--gilt2);font-weight:600;font-size:14px;cursor:pointer;text-decoration:underline;text-decoration-color:rgba(201,169,97,.4);text-underline-offset:4px}
.bsp-link:hover{text-decoration-color:var(--gilt2)}
.bsp-row.solo{grid-template-columns:1fr}
.bsp-row.solo .bsp-figs{grid-template-columns:repeat(4,1fr)}
.bsp-row.solo .bsp-fig{border-bottom:0}
.bsp-row.solo .bsp-fig:nth-child(2n){border-right:1px solid var(--line)}
.bsp-row.solo .bsp-fig:last-child{border-right:0}
.bsp-figs{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:0;overflow:hidden}
.bsp-fig{padding:22px 24px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.bsp-fig:nth-child(2n){border-right:0}
.bsp-fig:nth-last-child(-n+2){border-bottom:0}
.bsp-fig span{display:block;font-size:13px;color:var(--muted)}
.bsp-fig b{display:block;font-family:'Cormorant Garamond',serif;font-weight:500;font-size:34px;line-height:1.1;margin-top:6px;font-variant-numeric:lining-nums tabular-nums}
.bsp-fig small{display:block;font-size:12px;color:var(--faint);margin-top:4px;line-height:1.4}
.bsp-bar{height:4px;border-radius:2px;background:rgba(239,233,220,.10);margin-top:10px;overflow:hidden}
.bsp-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--gilt),var(--gilt2));border-radius:2px}

/* journey */
.bsp-journey{list-style:none;margin:0;padding:0;position:relative}
.bsp-step{position:relative;display:grid;grid-template-columns:44px minmax(0,1fr);gap:20px;padding-bottom:18px}
.bsp-step::before{content:"";position:absolute;left:21px;top:44px;bottom:0;width:2px;background:var(--line)}
.bsp-step:last-child::before{display:none}
.bsp-step:last-child{padding-bottom:0}
.bsp-node{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:600;border:1px solid var(--line2);color:var(--muted);background:var(--bg);position:relative;z-index:1}
.bsp-node.now{border:2px solid var(--gilt);color:var(--gilt2);box-shadow:0 0 0 6px rgba(201,169,97,.12)}
.bsp-node.done{background:rgba(143,212,168,.12);border-color:rgba(143,212,168,.5);color:var(--sage)}
.bsp-step-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px 22px}
.bsp-step-card.now{border-color:rgba(201,169,97,.35);background:linear-gradient(160deg,#112443,#0F1E36 70%)}
.bsp-step-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.bsp-step-head h4{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;margin:0}
.bsp-docs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.bsp-doc{border:1px solid var(--line);border-radius:11px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:72px;background:rgba(10,22,40,.35)}
.bsp-doc-l{min-width:0}
.bsp-doc-l span{display:block;font-size:12px;color:var(--faint)}
.bsp-doc-l b{display:block;font-weight:600;font-size:14px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bsp-doc-l em{display:block;font-style:normal;font-size:13px;color:var(--muted);margin-top:1px}
.bsp-doc-l em.ok{color:var(--sage)}
.bsp-tag{font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;white-space:nowrap}
.bsp-tag.ok{color:var(--sage);background:rgba(143,212,168,.10)}
.bsp-tag.warn{color:var(--amber);background:rgba(231,183,106,.10)}
.bsp-tag.gold{color:var(--gilt2);background:var(--giltsoft)}
.bsp-tag.mute{color:var(--muted);background:rgba(239,233,220,.06)}
.bsp-how{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px;counter-reset:how}
.bsp-how li{list-style:none;padding:20px 22px;border:1px solid var(--line);border-radius:14px;color:var(--muted);font-size:14px;counter-increment:how}
.bsp-how li::before{content:counter(how);display:flex;width:30px;height:30px;border-radius:50%;align-items:center;justify-content:center;border:1px solid rgba(201,169,97,.5);color:var(--gilt2);font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;margin-bottom:12px;font-variant-numeric:lining-nums}
.bsp-notice{border-radius:14px;padding:18px 22px;margin-top:20px;border:1px solid}
.bsp-notice.warn{border-color:rgba(231,183,106,.4);background:rgba(231,183,106,.06)}
.bsp-notice.bad{border-color:rgba(229,134,134,.4);background:rgba(229,134,134,.06)}
.bsp-notice q{display:block;font-family:'Cormorant Garamond',serif;font-size:19px;margin-top:8px;color:var(--text)}

/* profile / forms */
.bsp-two{display:grid;grid-template-columns:320px minmax(0,1fr);gap:24px;align-items:start}
.bsp-dl{display:grid;grid-template-columns:1fr 1fr;gap:18px 28px;margin:18px 0 0}
.bsp-dl div{min-width:0}
.bsp-dl dt{font-size:12px;color:var(--faint)}
.bsp-dl dd{margin:3px 0 0;font-weight:500;overflow-wrap:anywhere}
.bsp-dl dd.none{color:var(--faint);font-weight:400}
.bsp-dl .wide{grid-column:1/-1}
.bsp-stack>*+*{margin-top:20px}
.bsp-field{display:block;margin-top:16px}
.bsp-field>span{display:block;font-size:13px;color:var(--muted);margin-bottom:7px;font-weight:500}
.bsp-input{width:100%;background:rgba(10,22,40,.6);border:1px solid var(--line2);border-radius:10px;color:var(--text);font:inherit;font-size:15px;padding:12px 14px;transition:border-color .2s}
.bsp-input:focus{outline:none;border-color:var(--gilt)}
textarea.bsp-input{min-height:140px;resize:vertical;line-height:1.55}
select.bsp-input{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--gilt) 50%),linear-gradient(135deg,var(--gilt) 50%,transparent 50%);background-position:calc(100% - 20px) 52%,calc(100% - 14px) 52%;background-size:6px 6px;background-repeat:no-repeat;padding-right:40px}
select.bsp-input option{background:#0A1628}
.bsp-hint{font-size:12px;color:var(--faint);margin-top:6px}
.bsp-msg{margin-top:14px;font-size:14px;padding:10px 14px;border-radius:10px}
.bsp-msg.err{color:#F2A7A7;background:rgba(229,134,134,.08);border:1px solid rgba(229,134,134,.3)}
.bsp-msg.ok{color:var(--sage);background:rgba(143,212,168,.08);border:1px solid rgba(143,212,168,.3)}
.bsp-check{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);margin-top:12px;cursor:pointer}
.bsp-check input{accent-color:var(--gilt)}
.bsp-chips{display:flex;flex-wrap:wrap;gap:8px}
.bsp-pill{background:transparent;border:1px solid var(--line2);color:var(--muted);border-radius:999px;padding:8px 14px;font-size:13px;font-weight:500;cursor:pointer}
.bsp-pill[aria-pressed=true]{background:var(--giltsoft);border-color:rgba(201,169,97,.6);color:var(--text)}
.bsp-list{list-style:none;margin:0;padding:0}
.bsp-list li{padding:16px 0;border-top:1px solid var(--line)}
.bsp-list li:first-child{border-top:0;padding-top:4px}
.bsp-li-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.bsp-li-head b{font-weight:600}
.bsp-li-meta{font-size:12px;color:var(--faint);margin-top:2px}
.bsp-reply{margin-top:12px;padding:12px 16px;border-left:2px solid var(--gilt);background:rgba(201,169,97,.06);border-radius:0 10px 10px 0}
.bsp-reply span{font-size:12px;color:var(--gilt2);font-weight:600}
.bsp-reply p{margin:4px 0 0}
.bsp-photo-big{width:100%;aspect-ratio:4/5;border-radius:14px;object-fit:cover;object-position:50% 25%;border:1px solid rgba(201,169,97,.4);background:linear-gradient(160deg,#132746,#0A1628);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:64px;color:var(--gilt)}
.bsp-docrow{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:13px 0;border-top:1px solid var(--line)}
.bsp-docrow:first-of-type{border-top:0}

/* modal */
.bsp-scrim{position:fixed;inset:0;z-index:200;background:rgba(5,11,22,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:bspFade .2s ease-out}
.bsp-modal{width:100%;max-width:520px;max-height:calc(100vh - 40px);overflow:auto;background:#10213D;border:1px solid rgba(201,169,97,.3);border-radius:18px;padding:30px 30px 26px;box-shadow:0 40px 100px -30px rgba(0,0,0,.9);animation:bspRise .3s cubic-bezier(.22,1,.36,1) both}
.bsp-modal-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.bsp-x{background:none;border:1px solid var(--line2);color:var(--muted);width:34px;height:34px;border-radius:9px;cursor:pointer;font-size:18px;line-height:1;flex-shrink:0}
.bsp-drop{display:flex;align-items:center;gap:14px;border:1px dashed rgba(201,169,97,.45);border-radius:12px;padding:16px 18px;cursor:pointer;background:rgba(201,169,97,.04);transition:border-color .2s,background .2s}
.bsp-drop:hover{border-color:var(--gilt);background:rgba(201,169,97,.08)}
.bsp-drop.has{border-style:solid;border-color:rgba(143,212,168,.45);background:rgba(143,212,168,.05)}
.bsp-drop.err{border-color:rgba(229,134,134,.5)}
.bsp-drop input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.bsp-drop-ic{width:40px;height:40px;border-radius:10px;border:1px solid rgba(201,169,97,.4);display:flex;align-items:center;justify-content:center;color:var(--gilt2);flex-shrink:0}
.bsp-drop b{display:block;font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bsp-drop small{display:block;font-size:12px;color:var(--faint)}
.bsp-money{position:relative}
.bsp-money .bsp-input{padding-left:30px}
.bsp-money::before{content:"$";position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--gilt2);font-weight:600}
.bsp-done{text-align:center;padding:24px 0 6px}
.bsp-done-ic{width:64px;height:64px;margin:0 auto;border-radius:50%;background:rgba(143,212,168,.12);border:1px solid rgba(143,212,168,.5);color:var(--sage);display:flex;align-items:center;justify-content:center}
.bsp-spin{width:22px;height:22px;border-radius:50%;border:2px solid rgba(10,22,40,.25);border-top-color:#0A1628;animation:bspSpin .8s linear infinite}
@keyframes bspRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes bspFade{from{opacity:0}to{opacity:1}}
@keyframes bspSpin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.bsp *{animation:none!important;transition:none!important}}

@media (max-width:900px){
  .bsp-row.solo .bsp-figs{grid-template-columns:1fr 1fr}
  .bsp-row.solo .bsp-fig:nth-child(2n){border-right:0}
  .bsp-row.solo .bsp-fig:nth-child(-n+2){border-bottom:1px solid var(--line)}
  .bsp-row{grid-template-columns:1fr}
  .bsp-two{grid-template-columns:1fr}
  .bsp-how{grid-template-columns:1fr}
  .bsp-cred-grid{grid-template-columns:auto 1fr}
  .bsp-cred-status{grid-column:1/-1;order:-1}
}
@media (max-width:720px){
  .bsp-top-in{height:auto;flex-wrap:wrap;padding:12px 16px 0;gap:10px 16px}
  .bsp-brand small{display:none}
  .bsp-me{margin-left:auto}
  .bsp-me .bsp-avatar{display:none}
  .bsp-site span{display:none}
  .bsp-tabs{order:3;width:100%;margin:0 -16px;padding:0 6px;overflow-x:auto;scrollbar-width:none;height:46px}
  .bsp-tabs::-webkit-scrollbar{display:none}
  .bsp-tab{padding:0 10px;flex-shrink:0;font-size:13.5px}
  .bsp-tab[aria-selected=true]::after{left:10px;right:10px}
  .bsp-main{padding:24px 16px 120px}
  .bsp-cred{padding:24px 22px;border-radius:18px}
  .bsp-cred-grid{grid-template-columns:1fr;gap:18px}
  .bsp-portrait{width:88px;height:110px;font-size:36px}
  .bsp-rosette{right:-170px;top:30%}
  .bsp-facts{gap:12px 22px}
  .bsp-card{padding:22px 20px}
  .bsp-next h3{font-size:25px}
  .bsp-actions .bsp-btn{flex:1 1 auto}
  .bsp-fig{padding:18px 18px}
  .bsp-fig b{font-size:29px}
  .bsp-docs{grid-template-columns:1fr}
  .bsp-step{grid-template-columns:34px minmax(0,1fr);gap:12px}
  .bsp-node{width:34px;height:34px;font-size:17px}
  .bsp-step::before{left:16px;top:34px}
  .bsp-step-card{padding:16px}
  .bsp-dl{grid-template-columns:1fr}
  .bsp-sec{margin-top:44px}
  .bsp-h2{font-size:26px}
  .bsp-modal{padding:24px 20px 20px;border-radius:16px}
}
`;
  function useStyles() {
    useEffect(() => {
      if (document.getElementById("bsp-css")) return;
      const s = document.createElement("style");
      s.id = "bsp-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }, []);
  }

  // ---------------- icons ----------------
  const Icon = {
    home: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 11L12 4l8.5 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></svg>,
    up: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>,
    check: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
    doc: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M6 2.5h8.5L19 7v14.5H6z" /><path d="M14 2.5V7h5" /></svg>,
    star: () => <svg width="30" height="30" viewBox="0 0 36 36" aria-hidden="true"><g fill="none" stroke="#C9A961" strokeWidth="1.2"><path d="M18 3 L23 11 L33 13 L26 21 L28 31 L18 26 L8 31 L10 21 L3 13 L13 11 Z" /><circle cx="18" cy="18" r="4" fill="#C9A961" stroke="none" /></g></svg>,
  };
  // engraved rosette — the one ornament, on the credential only
  const Rosette = () => {
    const rings = [];
    for (let i = 0; i < 36; i++) rings.push(<ellipse key={i} cx="200" cy="200" rx="190" ry="62" transform={`rotate(${i * 5} 200 200)`} />);
    const inner = [];
    for (let i = 0; i < 24; i++) inner.push(<ellipse key={"i" + i} cx="200" cy="200" rx="104" ry="34" transform={`rotate(${i * 7.5} 200 200)`} />);
    return (
      <svg className="bsp-rosette" viewBox="0 0 400 400" aria-hidden="true">
        <g fill="none" stroke="#C9A961" strokeWidth=".6">{rings}</g>
        <g fill="none" stroke="#E2C98E" strokeWidth=".5">{inner}</g>
        <circle cx="200" cy="200" r="196" fill="none" stroke="#C9A961" strokeWidth=".8" />
        <circle cx="200" cy="200" r="186" fill="none" stroke="#C9A961" strokeWidth=".4" />
      </svg>
    );
  };

  // ---------------- modal + file field ----------------
  function Modal({ title, sub, onClose, children }) {
    useEffect(() => {
      const k = e => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", k);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
    }, []);
    return (
      <div className="bsp-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bsp-modal" role="dialog" aria-modal="true" aria-label={title}>
          <div className="bsp-modal-head">
            <div>
              <h3 className="bsp-h2" style={{ fontSize: 28 }}>{title}</h3>
              {sub && <p className="bsp-sub">{sub}</p>}
            </div>
            <button className="bsp-x" onClick={onClose} aria-label={t("Close")}>×</button>
          </div>
          {children}
        </div>
      </div>
    );
  }

  function FilePick({ label, value, onChange, accept, imageOnly }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const pick = async e => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      setErr(null);
      const v = window.BrialFiles.validate(f);
      if (!v.ok) { setErr(v.error); return; }
      if (imageOnly && !/^image\/(jpeg|png|webp)$/i.test(f.type || "")) { setErr(L("Please choose a JPG, PNG or WebP photo.", "Pilih foto JPG, PNG, atau WebP.")); return; }
      setBusy(true);
      try { onChange(await window.BrialFiles.put(f)); }
      catch (x) { setErr(L("Upload failed. Check your connection and try again.", "Unggahan gagal. Periksa koneksi lalu coba lagi.")); }
      finally { setBusy(false); }
    };
    return (
      <label className="bsp-field">
        <span>{label}</span>
        <div className={"bsp-drop" + (value ? " has" : "") + (err ? " err" : "")} style={{ position: "relative" }}>
          <input type="file" accept={accept || window.BrialFiles.allowedAccept} onChange={pick} disabled={busy} />
          <div className="bsp-drop-ic">{value ? Icon.check() : Icon.up()}</div>
          <div style={{ minWidth: 0 }}>
            <b>{busy ? t("Uploading…") : value ? (value.name || value.filename) : t("Choose a file")}</b>
            <small>{value ? (value.size ? value.size + " MB · " : "") + t("Replace file") : t(imageOnly ? "JPG, PNG or WebP, up to 2 MB." : "PDF, JPG, PNG or WebP, up to 2 MB.")}</small>
          </div>
        </div>
        {err && <div className="bsp-msg err">{err}</div>}
      </label>
    );
  }

  // generic submit flow inside a modal
  function useSubmit(fn, onClose) {
    const [state, setState] = useState("form");
    const run = async () => {
      setState("busy");
      try { await fn(); setState("done"); setTimeout(onClose, 1500); }
      catch (e) { console.error(e); setState("form"); }
    };
    return [state, run];
  }
  const Done = ({ text }) => (
    <div className="bsp-done">
      <div className="bsp-done-ic">{Icon.check(28)}</div>
      <p style={{ marginTop: 14, fontWeight: 600 }}>{text}</p>
    </div>
  );

  function BillDialog({ applicant, store, sem, onClose }) {
    const [file, setFile] = useState(null);
    const [amount, setAmount] = useState(applicant.profile?.university?.uktPerSemester || "");
    const n = parseFloat(String(amount).replace(/,/g, ""));
    const ok = file && n > 0;
    const [state, run] = useSubmit(() => store.uploadBill(applicant.id, sem.id, { ...file, amount: n }), onClose);
    return (
      <Modal title={L(`${sem.label} tuition bill`, `Tagihan UKT ${sem.label}`)} sub={L("Upload the official bill from your university. The foundation reviews it and pays your tuition.", "Unggah tagihan resmi dari kampus. Yayasan meninjaunya lalu membayar UKT Anda.")} onClose={onClose}>
        {state === "done" ? <Done text={L("Bill sent for review.", "Tagihan terkirim untuk ditinjau.")} /> : (
          <>
            <FilePick label={t("Tuition bill")} value={file} onChange={setFile} />
            <label className="bsp-field">
              <span>{t("Amount due (USD)")}</span>
              <div className="bsp-money"><input className="bsp-input" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
              <div className="bsp-hint">{t("Enter the amount on the bill.")}</div>
            </label>
            <div className="bsp-actions" style={{ marginTop: 24 }}>
              <button className="bsp-btn primary" disabled={!ok || state === "busy"} onClick={run}>{state === "busy" ? <span className="bsp-spin" /> : L("Send bill", "Kirim tagihan")}</button>
              <button className="bsp-btn ghost" onClick={onClose}>{t("Cancel")}</button>
            </div>
          </>
        )}
      </Modal>
    );
  }

  function TranscriptDialog({ applicant, store, sem, onClose }) {
    const [file, setFile] = useState(null);
    const [gpa, setGpa] = useState("");
    const g = parseFloat(String(gpa).replace(",", "."));
    const gOk = !isNaN(g) && g >= 0 && g <= 4;
    const [state, run] = useSubmit(() => store.uploadIP(applicant.id, sem.id, { ...file, gpa: g.toFixed(2) }), onClose);
    return (
      <Modal title={L(`${sem.label} results`, `Hasil ${sem.label}`)} sub={L("Upload your transcript and the GPA for this semester.", "Unggah transkrip dan IP semester ini.")} onClose={onClose}>
        {state === "done" ? <Done text={L("Results saved. Thank you.", "Hasil tersimpan. Terima kasih.")} /> : (
          <>
            <FilePick label={t("Transcript")} value={file} onChange={setFile} />
            <label className="bsp-field">
              <span>{t("Semester GPA")}</span>
              <input className="bsp-input" inputMode="decimal" value={gpa} onChange={e => setGpa(e.target.value)} placeholder="3.62" style={{ maxWidth: 160 }} />
              <div className="bsp-hint">{t("Enter a number between 0 and 4, for example 3.62.")}</div>
            </label>
            <div className="bsp-actions" style={{ marginTop: 24 }}>
              <button className="bsp-btn primary" disabled={!file || !gOk || state === "busy"} onClick={run}>{state === "busy" ? <span className="bsp-spin" /> : L("Save results", "Simpan hasil")}</button>
              <button className="bsp-btn ghost" onClick={onClose}>{t("Cancel")}</button>
            </div>
          </>
        )}
      </Modal>
    );
  }

  function GraduationDialog({ applicant, store, onClose }) {
    const [ij, setIj] = useState(null);
    const [tr, setTr] = useState(null);
    const [state, run] = useSubmit(() => store.submitGraduation(applicant.id, { ijazahFile: ij, transkripFile: tr }), onClose);
    return (
      <Modal title={L("Graduation documents", "Dokumen kelulusan")} sub={L("Upload your diploma and final transcript to complete your record with the foundation.", "Unggah ijazah dan transkrip akhir untuk melengkapi catatan Anda di yayasan.")} onClose={onClose}>
        {state === "done" ? <Done text={L("Congratulations — your record is complete.", "Selamat — catatan Anda sudah lengkap.")} /> : (
          <>
            <FilePick label={t("Diploma (ijazah)")} value={ij} onChange={setIj} />
            <FilePick label={t("Final transcript")} value={tr} onChange={setTr} />
            <div className="bsp-actions" style={{ marginTop: 24 }}>
              <button className="bsp-btn primary" disabled={!ij || !tr || state === "busy"} onClick={run}>{state === "busy" ? <span className="bsp-spin" /> : L("Submit documents", "Kirim dokumen")}</button>
              <button className="bsp-btn ghost" onClick={onClose}>{t("Cancel")}</button>
            </div>
          </>
        )}
      </Modal>
    );
  }

  // ---------------- derived state ----------------
  function useScholar(applicant, store) {
    return useMemo(() => {
      const sems = applicant.semesters || [];
      const paid = sems.filter(s => s.paidAt);
      const received = paid.reduce((a, s) => a + (Number(s.bill?.amount) || 0), 0);
      const pending = sems.filter(s => s.status === "bill-uploaded").reduce((a, s) => a + (Number(s.bill?.amount) || 0), 0);
      const ipk = store.cumulativeIPK ? store.cumulativeIPK(applicant) : null;
      const status = applicant.scholarStatus || "active";
      const level = store.getDegreeLevel ? store.getDegreeLevel(applicant) : null;
      const total = level?.totalSemesters || 8;
      const allDone = sems.length > 0 && sems.every(s => s.status === "completed");
      const lastNum = sems.length ? sems[sems.length - 1].number : 0;
      const canGraduate = status === "active" && allDone && lastNum >= total;
      // the single next action
      let next = null;
      if (status === "active") {
        const cur = sems.find(s => s.status === "current");
        const review = sems.find(s => s.status === "bill-uploaded");
        const needIp = sems.find(s => s.status === "paid" && !s.ip);
        if (needIp) next = { kind: "ip", sem: needIp };
        else if (cur) next = { kind: "bill", sem: cur };
        else if (review) next = { kind: "review", sem: review };
        else if (canGraduate) next = { kind: "graduate" };
        else if (!sems.length) next = { kind: "empty" };
        else next = { kind: "clear" };
      }
      return { sems, paid, received, pending, ipk, status, level, canGraduate, next };
    }, [applicant, store]);
  }

  // ---------------- overview ----------------
  function Credential({ applicant, d }) {
    const p = applicant.profile || {};
    const u = p.university || {};
    const per = p.personal || {};
    const photo = per.showcasePhoto || (isImage(per.photoFile) ? per.photoFile : null);
    const url = fileUrl(photo);
    const chip = {
      active: ["ok", "Active scholar"], suspended: ["warn", "Scholarship paused"], revoked: ["bad", "Scholarship ended"], graduated: ["gold", "Brial alum"],
    }[d.status] || ["ok", "Active scholar"];
    const name = titleCase(per.fullName || applicant.name);
    return (
      <section className="bsp-cred" aria-label={L("Scholarship credential", "Kartu penerima beasiswa")}>
        <Rosette />
        <div className="bsp-cred-grid">
          {url ? <img className="bsp-portrait" src={url} alt="" /> : <div className="bsp-portrait">{name.charAt(0)}</div>}
          <div style={{ minWidth: 0 }}>
            <h1 className="bsp-name">{name}</h1>
            <div className="bsp-prog">{instCase(u.program)}{u.program && u.name ? ", " : ""}{instCase(u.name)}</div>
            <div className="bsp-facts">
              {applicant.scholarId && <div className="bsp-fact"><span>{t("Scholar ID")}</span><b>{applicant.scholarId}</b></div>}
              {applicant.cohort && <div className="bsp-fact"><span>{t("Class")}</span><b>{String(applicant.cohort).replace(/^Class of\s*/i, "")}</b></div>}
              {d.level && <div className="bsp-fact"><span>{t("Programme")}</span><b>{d.level.label}</b></div>}
              {d.sems.length > 0 && <div className="bsp-fact"><span>{t("Funded semesters")}</span><b>{d.sems[0].number}–{d.sems[d.sems.length - 1].number}</b></div>}
            </div>
          </div>
          <div className="bsp-cred-status"><span className={"bsp-chip " + chip[0]}><i />{t(chip[1])}</span></div>
        </div>
      </section>
    );
  }

  function NextStep({ d, onBill, onIp, onGrad, onHelp }) {
    const n = d.next;
    if (!n) return null;
    let k = t("Next step"), title, body, actions = null;
    if (n.kind === "bill") {
      title = L(`Upload your ${n.sem.label} tuition bill`, `Unggah tagihan UKT ${n.sem.label}`);
      body = L("Send the official bill (UKT) from your university. Once it is reviewed, the foundation pays your tuition.", "Kirim tagihan UKT resmi dari kampus. Setelah ditinjau, yayasan membayar UKT Anda.");
      actions = <button className="bsp-btn primary" onClick={() => onBill(n.sem)}>{Icon.up()}{t("Upload bill")}</button>;
    } else if (n.kind === "ip") {
      title = L(`${n.sem.label} is paid — add your results`, `${n.sem.label} sudah dibayar — tambahkan hasilnya`);
      body = L("When your grades are out, upload the transcript and your semester GPA.", "Setelah nilai keluar, unggah transkrip dan IP semester Anda.");
      actions = <button className="bsp-btn primary" onClick={() => onIp(n.sem)}>{Icon.up()}{t("Upload transcript")}</button>;
    } else if (n.kind === "review") {
      title = L(`We're reviewing your ${n.sem.label} bill`, `Tagihan ${n.sem.label} sedang ditinjau`);
      body = L(`Sent on ${date(n.sem.bill?.uploadedAt)}. You don't need to do anything right now — the payment will appear here.`, `Dikirim pada ${date(n.sem.bill?.uploadedAt)}. Saat ini Anda tidak perlu melakukan apa pun — pembayarannya akan tampil di sini.`);
      actions = n.sem.bill ? <button className="bsp-btn ghost" onClick={() => window.BrialFiles.open(n.sem.bill)}>{t("View bill")}</button> : null;
    } else if (n.kind === "graduate") {
      title = L("All semesters complete — time to graduate", "Semua semester selesai — saatnya lulus");
      body = L("Upload your diploma (ijazah) and final transcript to complete your record.", "Unggah ijazah dan transkrip akhir untuk melengkapi catatan Anda.");
      actions = <button className="bsp-btn primary" onClick={onGrad}>{Icon.up()}{t("Upload graduation documents")}</button>;
    } else if (n.kind === "empty") {
      title = t("You're all set");
      body = t("No semesters have been set up yet. The foundation will add them shortly.");
    } else {
      title = t("You're all set");
      body = t("Nothing needs your attention right now. We'll show the next step here when it's time.");
      actions = <button className="bsp-link" onClick={onHelp}>{t("Message the foundation")}</button>;
    }
    return (
      <div className="bsp-card bsp-next">
        <div>
          <div className="bsp-next-k">{k}</div>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
        {actions && <div className="bsp-actions">{actions}</div>}
      </div>
    );
  }

  function Figures({ d }) {
    const total = d.sems.length;
    const pct = total ? Math.round((d.paid.length / total) * 100) : 0;
    const low = d.ipk && d.ipk.value < 2.75;
    return (
      <div className="bsp-card bsp-figs">
        <div className="bsp-fig"><span>{t("Total received")}</span><b>{money(d.received)}</b></div>
        <div className="bsp-fig"><span>{t("Semesters paid")}</span><b>{d.paid.length}<span style={{ display: "inline", fontSize: 22, color: "var(--faint)" }}> / {total}</span></b><div className="bsp-bar" aria-hidden="true"><i style={{ width: pct + "%" }} /></div></div>
        <div className="bsp-fig"><span>{t("Cumulative GPA")}</span><b style={{ color: low ? "var(--rose)" : undefined }}>{d.ipk ? d.ipk.value.toFixed(2) : "—"}</b><small>{d.ipk ? t(low ? "Below the 2.75 minimum — talk to the foundation" : "Keep it at 2.75 or higher to continue the award") : t("Appears after your first transcript")}</small></div>
        <div className="bsp-fig"><span>{t("Awaiting payment")}</span><b style={{ color: d.pending ? "var(--amber)" : undefined }}>{money(d.pending)}</b></div>
      </div>
    );
  }

  function StatusNotice({ applicant, d }) {
    if (d.status !== "suspended" && d.status !== "revoked") return null;
    const last = (applicant.statusHistory || []).slice().reverse().find(e => e.status === d.status);
    return (
      <div className={"bsp-notice " + (d.status === "suspended" ? "warn" : "bad")}>
        <b>{d.status === "suspended" ? L("Your scholarship is paused", "Beasiswa Anda ditangguhkan") : L("Your scholarship has ended", "Beasiswa Anda telah dihentikan")}</b>
        <div style={{ color: "var(--muted)", marginTop: 4 }}>{d.status === "suspended"
          ? L("No payments are made while it is paused. Message the foundation to talk about reinstatement.", "Tidak ada pembayaran selama ditangguhkan. Kirim pesan ke yayasan untuk membicarakan pengaktifan kembali.")
          : L("Past payments stay on the public ledger as a record.", "Pembayaran sebelumnya tetap tercatat di buku besar publik.")}</div>
        {last && last.reason && <q>{last.reason}</q>}
      </div>
    );
  }

  const SEM_TAG = {
    upcoming: ["mute", "Upcoming"], current: ["gold", "Action needed"], "bill-uploaded": ["warn", "In review"], paid: ["gold", "Results due"], completed: ["ok", "Complete"],
  };
  function Journey({ d, locked, onBill, onIp }) {
    if (!d.sems.length) return null;
    return (
      <ol className="bsp-journey">
        {d.sems.map(s => {
          const tag = SEM_TAG[s.status] || SEM_TAG.upcoming;
          const now = !locked && (s.status === "current" || s.status === "paid" || s.status === "bill-uploaded");
          const done = s.status === "completed";
          const billDoc = s.bill ? (
            <>
              <div className="bsp-doc-l"><span>{t("Tuition bill")}</span><b>{money(s.bill.amount)}</b><em className={s.paidAt ? "ok" : ""}>{s.paidAt ? L(`Paid on ${date(s.paidAt)}`, `Dibayar ${date(s.paidAt)}`) : L(`Sent on ${date(s.bill.uploadedAt)}`, `Dikirim ${date(s.bill.uploadedAt)}`)}</em></div>
              <button className="bsp-btn ghost small" onClick={() => window.BrialFiles.open(s.bill)}>{t("View")}</button>
            </>
          ) : (
            <>
              <div className="bsp-doc-l"><span>{t("Tuition bill")}</span><em>{s.status === "current" ? t("Not uploaded yet") : t("Opens when this semester starts")}</em></div>
              {s.status === "current" && !locked && <button className="bsp-btn primary small" onClick={() => onBill(s)}>{t("Upload bill")}</button>}
            </>
          );
          const ipDoc = s.ip ? (
            <>
              <div className="bsp-doc-l"><span>{t("Transcript")}</span><b>{L("GPA", "IP")} {s.ip.gpa}</b><em>{L(`Added on ${date(s.ip.uploadedAt)}`, `Ditambahkan ${date(s.ip.uploadedAt)}`)}</em></div>
              <button className="bsp-btn ghost small" onClick={() => window.BrialFiles.open(s.ip)}>{t("View")}</button>
            </>
          ) : (
            <>
              <div className="bsp-doc-l"><span>{t("Transcript")}</span><em>{s.status === "paid" ? t("Not uploaded yet") : t("Opens after tuition is paid")}</em></div>
              {s.status === "paid" && !locked && <button className="bsp-btn primary small" onClick={() => onIp(s)}>{t("Upload transcript")}</button>}
            </>
          );
          return (
            <li key={s.id} className="bsp-step">
              <div className={"bsp-node" + (done ? " done" : now ? " now" : "")} aria-hidden="true">{done ? Icon.check(18) : s.number}</div>
              <div className={"bsp-step-card" + (now ? " now" : "")}>
                <div className="bsp-step-head">
                  <h4>{s.label}</h4>
                  <span className={"bsp-tag " + (s.status === "paid" ? "ok" : tag[0])}>{s.status === "paid" ? t("Paid") : t(tag[1])}</span>
                </div>
                <div className="bsp-docs">
                  <div className="bsp-doc">{billDoc}</div>
                  <div className="bsp-doc">{ipDoc}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  function GraduationRecord({ applicant }) {
    const g = applicant.graduation;
    if (applicant.scholarStatus !== "graduated" || !g) return null;
    return (
      <section className="bsp-sec">
        <div className="bsp-sec-head"><div><h2 className="bsp-h2">{t("Your graduation record")}</h2><p className="bsp-sub">{t("Congratulations on completing your studies.")} {date(g.graduatedAt)}</p></div></div>
        <div className="bsp-docs" style={{ marginTop: 0 }}>
          {[["Diploma (ijazah)", g.ijazahFile], ["Final transcript", g.transkripFile]].map(([l, f]) => (
            <div className="bsp-doc" key={l}><div className="bsp-doc-l"><span>{t(l)}</span><b>{f ? (f.name || f.filename) : t("Not provided")}</b></div>{f && <button className="bsp-btn ghost small" onClick={() => window.BrialFiles.open(f)}>{t("View")}</button>}</div>
          ))}
        </div>
      </section>
    );
  }

  const HIST = { active: ["ok", "Active"], suspended: ["warn", "Paused"], revoked: ["mute", "Ended"], graduated: ["gold", "Graduated"] };
  function History({ applicant }) {
    const h = (applicant.statusHistory || []).slice().reverse();
    if (!h.length) return null;
    return (
      <section className="bsp-sec">
        <div className="bsp-sec-head"><h2 className="bsp-h2">{t("Scholarship history")}</h2></div>
        <div className="bsp-card" style={{ paddingTop: 12, paddingBottom: 12 }}>
          <ul className="bsp-list">
            {h.map((e, i) => {
              const m = HIST[e.status] || ["mute", e.status];
              return (
                <li key={i}>
                  <div className="bsp-li-head">
                    <div style={{ minWidth: 0 }}><b>{date(e.at)}</b>{e.reason && <div className="bsp-li-meta" style={{ fontSize: 14, color: "var(--muted)" }}>{e.reason === "Initial acceptance" ? L("Scholarship awarded", "Beasiswa diberikan") : e.reason}</div>}</div>
                    <span className={"bsp-tag " + m[0]}>{t(m[1])}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }

  function Overview({ applicant, store, d, goHelp }) {
    const [bill, setBill] = useState(null);
    const [ip, setIp] = useState(null);
    const [grad, setGrad] = useState(false);
    const locked = d.status !== "active";
    return (
      <>
        <Credential applicant={applicant} d={d} />
        <StatusNotice applicant={applicant} d={d} />
        <div className={"bsp-row" + (d.next ? "" : " solo")}>
          {d.next && <NextStep d={d} onBill={setBill} onIp={setIp} onGrad={() => setGrad(true)} onHelp={goHelp} />}
          <Figures d={d} />
        </div>
        {d.sems.length > 0 && (
          <section className="bsp-sec">
            <div className="bsp-sec-head"><h2 className="bsp-h2">{t("Your semesters")}</h2></div>
            <Journey d={d} locked={locked} onBill={setBill} onIp={setIp} />
          </section>
        )}
        <GraduationRecord applicant={applicant} />
        <History applicant={applicant} />
        {d.status === "active" && (
          <section className="bsp-sec">
            <h2 className="bsp-h2">{t("How your scholarship works")}</h2>
            <ol className="bsp-how" style={{ padding: 0 }}>
              <li>{t("At the start of each semester, upload the official tuition bill (UKT) from your university.")}</li>
              <li>{t("The foundation reviews the bill and pays your tuition. You will see the payment here.")}</li>
              <li>{t("When grades are out, upload your transcript and semester GPA. Keep your cumulative GPA at 2.75 or higher.")}</li>
            </ol>
          </section>
        )}
        {bill && <BillDialog applicant={applicant} store={store} sem={bill} onClose={() => setBill(null)} />}
        {ip && <TranscriptDialog applicant={applicant} store={store} sem={ip} onClose={() => setIp(null)} />}
        {grad && <GraduationDialog applicant={applicant} store={store} onClose={() => setGrad(false)} />}
      </>
    );
  }

  // ---------------- profile ----------------
  function PublicPhoto({ applicant, store }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const photo = applicant.profile?.personal?.showcasePhoto || null;
    const url = fileUrl(photo);
    const pick = async e => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      setErr(null);
      const v = window.BrialFiles.validate(f);
      if (!v.ok) { setErr(v.error); return; }
      if (!/^image\/(jpeg|png|webp)$/i.test(f.type || "")) { setErr(L("Please choose a JPG, PNG or WebP photo.", "Pilih foto JPG, PNG, atau WebP.")); return; }
      setBusy(true);
      try { const meta = await window.BrialFiles.put(f, { public: true }); store.updateProfile(applicant.id, "personal", { showcasePhoto: meta }); }
      catch (x) { setErr(L("Upload failed. Check your connection and try again.", "Unggahan gagal. Periksa koneksi lalu coba lagi.")); }
      finally { setBusy(false); }
    };
    return (
      <div className="bsp-card">
        {url ? <img className="bsp-photo-big" src={url} alt="" /> : <div className="bsp-photo-big">{(applicant.name || "?").charAt(0)}</div>}
        <h3 className="bsp-h3" style={{ marginTop: 18 }}>{t("Your public photo")}</h3>
        <p className="bsp-sub" style={{ fontSize: 14 }}>{t("This photo appears on the Scholars page of brialendowment.org.")}</p>
        <label className="bsp-btn ghost" style={{ marginTop: 14, width: "100%", position: "relative" }}>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={busy} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
          {Icon.up()}{busy ? t("Uploading…") : photo ? t("Change photo") : t("Upload photo")}
        </label>
        <div className="bsp-hint" style={{ textAlign: "center" }}>{t("JPG, PNG or WebP, up to 2 MB.")}</div>
        {err && <div className="bsp-msg err">{err}</div>}
      </div>
    );
  }

  const Row = ({ label, value, wide }) => (
    <div className={wide ? "wide" : ""}><dt>{t(label)}</dt><dd className={value ? "" : "none"}>{value || t("Not provided")}</dd></div>
  );

  function Profile({ applicant, store }) {
    const p = applicant.profile || {};
    const per = p.personal || {}, hs = p.highSchool || {}, u = p.university || {};
    const lvl = window.BrialStore.DEGREE_LEVELS && window.BrialStore.DEGREE_LEVELS[u.degreeLevel];
    const docs = [["Biometric photo", per.photoFile], ["Report card", hs.raporFile], ["Student card", u.studentCardFile]];
    return (
      <div className="bsp-two">
        <PublicPhoto applicant={applicant} store={store} />
        <div className="bsp-stack">
          <div className="bsp-card">
            <h3 className="bsp-h3">{t("Personal details")}</h3>
            <dl className="bsp-dl">
              <Row label="Full name" value={titleCase(per.fullName || applicant.name)} />
              <Row label="Email" value={applicant.email} />
              <Row label="Date of birth" value={per.dateOfBirth ? date(per.dateOfBirth) : ""} />
              <Row label="Phone" value={per.phone} />
              <Row label="Country" value={titleCase(per.country)} />
              <Row label="National ID" value={per.nationalId} />
              <Row label="Address" value={per.address} wide />
            </dl>
          </div>
          <div className="bsp-card">
            <h3 className="bsp-h3">{t("Education")}</h3>
            <dl className="bsp-dl">
              <Row label="University" value={instCase(u.name)} />
              <Row label="Study programme" value={instCase(u.program)} />
              <Row label="Programme" value={lvl ? lvl.label : u.degreeLevel} />
              <Row label="Current semester" value={u.currentSemester} />
              <Row label="GPA at application" value={u.currentGPA} />
              <Row label="Tuition per semester" value={u.uktPerSemester ? money(u.uktPerSemester) : ""} />
              <Row label="High school" value={instCase(hs.schoolName)} />
              <Row label="Graduation year" value={hs.graduationYear} />
              <Row label="Final grade" value={hs.finalGPA} />
            </dl>
            {Array.isArray(hs.subjects) && hs.subjects.length > 0 && (
              <>
                <h3 className="bsp-h3" style={{ marginTop: 26, fontSize: 14 }}>{t("Subject grades")}</h3>
                <dl className="bsp-dl" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", marginTop: 12 }}>
                  {hs.subjects.map((sj, i) => <div key={i}><dt>{sj.name || "—"}</dt><dd>{sj.grade || "—"}</dd></div>)}
                </dl>
              </>
            )}
          </div>
          <div className="bsp-card">
            <h3 className="bsp-h3">{t("Documents")}</h3>
            <div style={{ marginTop: 10 }}>
              {docs.map(([l, f]) => (
                <div className="bsp-docrow" key={l}>
                  <div className="bsp-doc-l"><span>{t(l)}</span><b>{f ? (f.name || f.filename) : t("Not provided")}</b></div>
                  {f && <button className="bsp-btn ghost small" onClick={() => window.BrialFiles.open(f)}>{t("View")}</button>}
                </div>
              ))}
            </div>
          </div>
          {(p.essay || "").trim() && (
            <div className="bsp-card">
              <h3 className="bsp-h3">{t("Application essay")}</h3>
              <p style={{ margin: "14px 0 0", color: "var(--muted)", whiteSpace: "pre-wrap", fontFamily: "'Cormorant Garamond',serif", fontSize: 18, lineHeight: 1.6, maxWidth: "68ch" }}>{p.essay}</p>
            </div>
          )}
          <p className="bsp-hint" style={{ fontSize: 13 }}>{t("Spot a mistake? Request a correction from the Account tab.")}</p>
        </div>
      </div>
    );
  }

  // ---------------- account ----------------
  const FIELDS = [
    ["email", "Email address", "Alamat email"],
    ["profile.personal.fullName", "Full legal name", "Nama lengkap sesuai identitas"],
    ["profile.personal.phone", "Phone number", "Nomor telepon"],
    ["profile.personal.address", "Address", "Alamat"],
    ["profile.personal.nationalId", "National ID / passport", "NIK / paspor"],
    ["profile.personal.country", "Country", "Negara"],
    ["profile.university.name", "University", "Universitas"],
    ["profile.university.program", "Study programme", "Program studi"],
    ["profile.university.currentSemester", "Current semester", "Semester saat ini"],
    ["profile.university.currentGPA", "Current GPA", "IPK saat ini"],
    ["profile.university.uktPerSemester", "Tuition per semester (USD)", "UKT per semester (USD)"],
    ["profile.highSchool.schoolName", "High school", "Sekolah menengah"],
    ["profile.highSchool.finalGPA", "High school final grade", "Nilai akhir SMA"],
  ];
  function Account({ applicant, store }) {
    const [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [show, setShow] = useState(false), [pwMsg, setPwMsg] = useState(null), [pwBusy, setPwBusy] = useState(false);
    const [fk, setFk] = useState(FIELDS[0][0]), [val, setVal] = useState(""), [rMsg, setRMsg] = useState(null);
    const reqs = applicant.changeRequests || [];
    const savePw = async () => {
      setPwMsg(null);
      if (pw.length < 8) return setPwMsg({ err: t("Password must be at least 8 characters.") });
      if (pw !== pw2) return setPwMsg({ err: t("Passwords do not match.") });
      setPwBusy(true);
      const r = await store.updateAccount(applicant.id, { password: pw });
      setPwBusy(false);
      if (r && r.error) return setPwMsg({ err: r.error });
      setPw(""); setPw2("");
      setPwMsg({ ok: t("Password updated. Other devices have been signed out.") });
    };
    const sendReq = async () => {
      setRMsg(null);
      if (!val.trim()) return setRMsg({ err: t("Please enter the correct value.") });
      const f = FIELDS.find(x => x[0] === fk);
      const type = fk === "email" ? "email" : "field";
      const r = await store.requestChange(applicant.id, { type, value: val.trim(), label: f[1], note: type === "field" ? fk : "" });
      if (r && r.error) return setRMsg({ err: r.error });
      setVal("");
      setRMsg({ ok: t("Request sent. The foundation will review it.") });
    };
    const stat = { pending: ["warn", "Pending"], approved: ["ok", "Approved"], rejected: ["mute", "Declined"] };
    return (
      <div className="bsp-row" style={{ marginTop: 0, alignItems: "start" }}>
        <div className="bsp-card">
          <h3 className="bsp-h3">{t("Request a correction")}</h3>
          <p className="bsp-sub" style={{ fontSize: 14 }}>{t("Changes to your details are checked by the foundation before they take effect.")}</p>
          <label className="bsp-field"><span>{t("What needs correcting?")}</span>
            <select className="bsp-input" value={fk} onChange={e => { setFk(e.target.value); setVal(""); setRMsg(null); }}>
              {FIELDS.map(f => <option key={f[0]} value={f[0]}>{L(f[1], f[2])}</option>)}
            </select>
          </label>
          <label className="bsp-field"><span>{t("Correct value")}</span>
            <input className="bsp-input" type={fk === "email" ? "email" : "text"} value={val} onChange={e => setVal(e.target.value)} />
          </label>
          {rMsg && <div className={"bsp-msg " + (rMsg.err ? "err" : "ok")}>{rMsg.err || rMsg.ok}</div>}
          <div className="bsp-actions" style={{ marginTop: 18 }}><button className="bsp-btn primary" onClick={sendReq}>{t("Send request")}</button></div>
          {reqs.length > 0 && (
            <>
              <h3 className="bsp-h3" style={{ marginTop: 30, marginBottom: 6 }}>{t("Your requests")}</h3>
              <ul className="bsp-list">
                {reqs.slice(0, 8).map(r => {
                  const s = stat[r.status] || stat.pending;
                  return (
                    <li key={r.id}>
                      <div className="bsp-li-head">
                        <div style={{ minWidth: 0 }}><b>{r.label}</b><div className="bsp-li-meta">{r.type === "password" ? "••••••••" : r.value}</div></div>
                        <span className={"bsp-tag " + s[0]}>{t(s[1])}</span>
                      </div>
                      {r.status === "rejected" && r.reason && <div className="bsp-li-meta" style={{ marginTop: 6 }}>{t("Reason:")} {r.reason}</div>}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
        <div className="bsp-card">
          <h3 className="bsp-h3">{t("Change password")}</h3>
          <dl className="bsp-dl" style={{ gridTemplateColumns: "1fr", marginTop: 12 }}><Row label="Sign-in email" value={applicant.email} /></dl>
          <label className="bsp-field"><span>{t("New password")}</span><input className="bsp-input" type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} /><div className="bsp-hint">{t("At least 8 characters.")}</div></label>
          <label className="bsp-field"><span>{t("Confirm new password")}</span><input className="bsp-input" type={show ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} /></label>
          <label className="bsp-check"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} />{t("Show passwords")}</label>
          {pwMsg && <div className={"bsp-msg " + (pwMsg.err ? "err" : "ok")}>{pwMsg.err || pwMsg.ok}</div>}
          <div className="bsp-actions" style={{ marginTop: 18 }}><button className="bsp-btn primary" disabled={pwBusy} onClick={savePw}>{pwBusy ? <span className="bsp-spin" /> : t("Save new password")}</button></div>
        </div>
      </div>
    );
  }

  // ---------------- help ----------------
  const TOPICS = [["payment", "Payment"], ["data", "My details"], ["technical", "Technical problem"], ["other", "Something else"]];
  function Help({ applicant, store }) {
    const [topic, setTopic] = useState("payment"), [subject, setSubject] = useState(""), [message, setMessage] = useState(""), [sent, setSent] = useState(false);
    const mine = (store.listReports() || []).filter(r => r.applicantId === applicant.id);
    const send = () => {
      if (!subject.trim() || !message.trim()) return;
      store.submitReport({ applicantId: applicant.id, applicantName: applicant.name, applicantEmail: applicant.email, subject, message, category: topic });
      setSubject(""); setMessage(""); setSent(true);
      setTimeout(() => setSent(false), 5000);
    };
    const st = { open: ["warn", "Open"], replied: ["gold", "Replied"], resolved: ["ok", "Resolved"] };
    return (
      <div className="bsp-row" style={{ marginTop: 0, alignItems: "start" }}>
        <div className="bsp-card">
          <h3 className="bsp-h3">{t("Message the foundation")}</h3>
          <p className="bsp-sub" style={{ fontSize: 14 }}>{t("Questions about payments, documents or your account — we read every message.")}</p>
          <div className="bsp-field"><span>{t("Topic")}</span>
            <div className="bsp-chips" role="group">{TOPICS.map(([id, l]) => <button key={id} className="bsp-pill" aria-pressed={topic === id} onClick={() => setTopic(id)}>{t(l)}</button>)}</div>
          </div>
          <label className="bsp-field"><span>{t("Subject")}</span><input className="bsp-input" value={subject} onChange={e => setSubject(e.target.value)} maxLength={300} /></label>
          <label className="bsp-field"><span>{t("Message")}</span><textarea className="bsp-input" value={message} onChange={e => setMessage(e.target.value)} maxLength={5000} /></label>
          {sent && <div className="bsp-msg ok">{t("Message sent. The reply will appear below.")}</div>}
          <div className="bsp-actions" style={{ marginTop: 18 }}><button className="bsp-btn primary" disabled={!subject.trim() || !message.trim()} onClick={send}>{t("Send message")}</button></div>
        </div>
        <div className="bsp-card">
          <h3 className="bsp-h3" style={{ marginBottom: 10 }}>{t("Your messages")}</h3>
          {mine.length === 0 ? <p className="bsp-sub" style={{ fontSize: 14 }}>{t("No messages yet.")}</p> : (
            <ul className="bsp-list">
              {mine.map(r => {
                const s = st[r.status] || st.open;
                return (
                  <li key={r.id}>
                    <div className="bsp-li-head"><div style={{ minWidth: 0 }}><b>{r.subject}</b><div className="bsp-li-meta">{date(r.submittedAt)}</div></div><span className={"bsp-tag " + s[0]}>{t(s[1])}</span></div>
                    <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 14, whiteSpace: "pre-wrap" }}>{r.message}</p>
                    {r.reply && <div className="bsp-reply"><span>{t("Reply from the foundation")} · {date(r.reply.at)}</span><p>{r.reply.text}</p></div>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // ---------------- shell ----------------
  const TABS = [["overview", "Overview"], ["profile", "My profile"], ["account", "Account"], ["help", "Help"]];
  function ScholarHome({ applicant, store, onLogout, onExit }) {
    useStyles();
    useLang();
    const d = useScholar(applicant, store);
    // each tab is a history entry: the back swipe / Back button returns to the previous tab
    const initTab = () => { try { return sessionStorage.getItem("bsp-tab") || "overview"; } catch (e) { return "overview"; } };
    const [tab, setTabState] = window.useBrialNav ? window.useBrialNav("sh-tab", initTab) : useState(initTab);
    const setTab = k => { setTabState(k); try { sessionStorage.setItem("bsp-tab", k); } catch (e) {} window.scrollTo({ top: 0, behavior: "smooth" }); };
    const per = applicant.profile?.personal || {};
    const avatar = fileUrl(per.showcasePhoto || (isImage(per.photoFile) ? per.photoFile : null));
    const replies = (store.listReports() || []).filter(r => r.applicantId === applicant.id && r.status === "replied").length;
    const pendingReq = (applicant.changeRequests || []).filter(r => r.status === "pending").length;
    return (
      <div className="bsp">
        <header className="bsp-top">
          <div className="bsp-top-in">
            <a className="bsp-brand" href="#/" title={t("Back to website")} onClick={e => { if (onExit) { e.preventDefault(); onExit(); } }}>
              {Icon.star()}
              <span><b>The Brial Endowment</b><small>{t("Scholar Portal")}</small></span>
            </a>
            <nav className="bsp-tabs" role="tablist" aria-label={t("Scholar Portal")}>
              {TABS.map(([k, l]) => (
                <button key={k} role="tab" className="bsp-tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                  {t(l)}
                  {k === "help" && replies > 0 && <span className="bsp-badge">{replies}</span>}
                  {k === "account" && pendingReq > 0 && <span className="bsp-badge">{pendingReq}</span>}
                </button>
              ))}
            </nav>
            <div className="bsp-me">
              {avatar ? <img className="bsp-avatar" src={avatar} alt="" /> : <span className="bsp-avatar">{(applicant.name || "?").charAt(0)}</span>}
              {onExit && <button className="bsp-site" onClick={onExit} aria-label={t("Public site")} title={t("Back to the public website")}>{Icon.home ? Icon.home() : null}<span>{t("Public site")}</span></button>}
              <button className="bsp-out" onClick={onLogout}>{t("Sign out")}</button>
            </div>
          </div>
        </header>
        <main className="bsp-main">
          {tab === "overview" && <Overview applicant={applicant} store={store} d={d} goHelp={() => setTab("help")} />}
          {tab !== "overview" && (
            <div className="bsp-sec-head" style={{ marginBottom: 24 }}>
              <div>
                <h1 className="bsp-h2" style={{ fontSize: "clamp(30px,4vw,40px)" }}>{t(TABS.find(x => x[0] === tab)[1])}</h1>
                <p className="bsp-sub">{L(`Signed in as ${titleCase(per.fullName || applicant.name)}`, `Masuk sebagai ${titleCase(per.fullName || applicant.name)}`)}</p>
              </div>
            </div>
          )}
          {tab === "profile" && <Profile applicant={applicant} store={store} />}
          {tab === "account" && <Account applicant={applicant} store={store} />}
          {tab === "help" && <Help applicant={applicant} store={store} />}
        </main>
      </div>
    );
  }
  return ScholarHome;
})();
