# The Brial Endowment — website (V3)

Situs statis brialendowment.org. Tidak ada build step: Netlify langsung menerbitkan folder `site/`
(diatur di `netlify.toml`).

## Isi
- `site/` — file website. `index.html` adalah versi bundel (semua script + font tertanam);
  file `.js` / `.css` terpisah adalah sumbernya (`index-source.html` memuatnya satu per satu).
- `supabase/migrations/` — perubahan database keamanan, dijalankan **berurutan**.

## V3 vs V2 — perbaikan keamanan data
Hanya `site/store.js` (dan salinannya di dalam `site/index.html`) yang berubah. Semua file lain identik dengan V2.

- Pengunjung hanya menerima data publik (nama, kampus, negara, foto showcase, angka penyaluran)
  lewat RPC `be_public_snapshot` — tidak ada NIK, HP, alamat, tanggal lahir, dokumen, email donatur.
- Login penerima beasiswa diverifikasi di server (`be_applicant_login`), password disimpan sebagai hash bcrypt,
  sesi memakai token. Penerima hanya bisa membaca/menyimpan datanya sendiri (`be_applicant_save`);
  status, Scholar ID, dan pembayaran semester tetap dikendalikan founder.
- Founder (asifbrial@gmail.com) membaca/menulis tabel langsung lewat sesi Supabase Auth; RLS hanya
  mengizinkan akun yang ada di `be_private.founders`.
- Donasi publik lewat `be_submit_donation` (selalu unverified, tidak bisa menyentuh PAYMENT-CONFIG).
- Penyimpanan diantrikan agar versi lama tidak menimpa versi baru; kegagalan simpan ditampilkan.
- Cache lama berisi data pribadi di browser pengunjung dihapus otomatis.

## Urutan penerapan (WAJIB)
1. Jalankan `supabase/migrations/20261011_01_secure_rpcs_additive.sql` (aman; situs V2 tetap jalan).
2. Deploy V3 (push ke `main` → Netlify). **Jangan deploy V3 sebelum langkah 1** — V3 memanggil fungsi
   database yang dibuat di langkah 1.
3. Setelah V3 live dan dicek, jalankan `supabase/migrations/20261011_02_lockdown.sql`
   (menutup akses langsung anon ke tabel dan listing storage).

Backup data sebelum perubahan: skema privat `backup_20261011` di Supabase.

## Dashboard Supabase (manual)
- Authentication → matikan *Allow new users to sign up*.
- Authentication → Password security → nyalakan *Leaked password protection*.
