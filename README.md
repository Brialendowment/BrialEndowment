# The Brial Endowment — website (V3)

Situs statis brialendowment.org. Tidak ada build step: Cloudflare Pages langsung menerbitkan folder `site/`
setiap ada push ke `main` (header keamanan di `site/_headers`, redirect di `site/_redirects`).

## Isi
- `site/` — file website. Setiap halaman (`index.html`, `donate.html`, …) memuat file terpisah: script situs di `site/*.js`,
  pustaka pihak ketiga di `site/vendor/`, font di `site/fonts/`. Tidak ada lagi bundel, CDN, atau Google Fonts.
  Founder Portal (`admin.compiled.js`) baru diunduh saat dibuka.
- **Setelah mengedit file apa pun di `site/`, jalankan `python scripts/stamp-assets.py`.** Halaman memuat file dengan
  cap versi (`/store.js?v=1a2b3c4d`); tanpa langkah ini browser pengunjung bisa tetap memakai salinan lama.
  `python scripts/stamp-assets.py --check` hanya melaporkan. Pratinjau lokal: `python scripts/dev-server.py` (http://localhost:8788).
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
2. Deploy V3 (push ke `main` → Cloudflare Pages). **Jangan deploy V3 sebelum langkah 1** — V3 memanggil fungsi
   database yang dibuat di langkah 1.
3. Setelah V3 live dan dicek, jalankan `supabase/migrations/20261011_02_lockdown.sql`
   (menutup akses langsung anon ke tabel dan listing storage).

Backup data sebelum perubahan: skema privat `backup_20261011` di Supabase.

## Dashboard Supabase (manual)
- Authentication → matikan *Allow new users to sign up*.
- Authentication → Password security → nyalakan *Leaked password protection*.

## Private documents (11 Oct 2026, migration 03)
- Scholar documents live in the **private** bucket `brial-private` (paths `docs/…`, random 128-bit names).
  They have no public link. The founder console signs links with the founder's Supabase login;
  a scholar gets links for her own files only, through the edge function `be-files`
  (`supabase/functions/be-files`), which checks her session token on the server.
- Public pictures (showcase selfies, e-book covers, programme photos, og-cover) stay in `brial-files`.
  In code: `BrialFiles.put(file)` = private, `BrialFiles.put(file, { public: true })` = public.
- The 45 old files (16 used by scholar records + 29 unused uploads) were copied to the private bucket
  under new names, the records were re-pointed, and the old public copies were deleted.
  Bookkeeping: `be_private.file_moves`. Unused uploads are kept under `docs/orphans/` (founder-only).

## Impact Report on a schedule (18 Nov 2026, migration 20261118_01)
- **20 December 09:00 WIB**: the edge function `be-impact` (hourly via pg_cron `be-impact-tick`) prepares that
  year's report (status `review`), writes the first words from the numbers, and emails the founder.
- The founder reads it in Founder Console → Impact Report, edits anything, and presses **Approve**.
- **1 January 08:00 WIB**: an approved report is published with the final numbers to 31 December and the
  donor letter is queued (verified donors + donors added by hand, minus unsubscribes). Not approved yet:
  nothing is published, the founder gets a reminder every three days for a month.
- The numbers live in `src/impact-core.js`, shared by the portal and `be-impact` (the build script copies it),
  so the figures approved are the figures published. Edit that file, then run `scripts/build-founder-desk.py`.
- Every write to the reports goes through `be_impact_save` / `be_impact_server_put`, which refuse a write
  from an out-of-date copy, so the schedule and the founder's screen never overwrite each other.
- Emails use the existing outbox: founder notes as `message`, donor letters as `announcement` (sent by `be-mail`).
