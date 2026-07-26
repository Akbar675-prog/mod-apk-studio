## Ringkasan perubahan

### 1. Sembunyikan link download dari source code
- Ubah tombol Download di `apps.$id.tsx` dari `<a href>` jadi `<button>` yang trigger fetch → blob → `URL.createObjectURL` → download programatik. Endpoint `/apps/gyps/$b64` dipanggil hanya saat klik, jadi URL tidak muncul di HTML.
- Untuk exclusive: URL dari `verifyExclusiveFn` juga di-fetch sebagai blob lalu di-download, tanpa `window.location.href`.

### 2. Percepat download APK
- Di `apps.gyps.$b64.ts`: ganti pola "download semua ke memory lalu return" jadi **redirect ke Supabase signed URL** (createSignedUrl dengan `download: filename`). Browser lompat langsung ke storage CDN Supabase → mulai unduh instan, tanpa nunggu Worker load 100+ MB.
- Karena redirect, header Content-Disposition dikontrol via param `download` di signed URL.
- URL tetap tersembunyi karena poin 1 (fetch-then-blob).

### 3. Percepat load gambar (CDN caching)
- Route `apps.icon.FGJ01.$id.ts` & `apps.preview.$id.ts`: tambah `Cache-Control: public, max-age=31536000, immutable` + ETag, dan `CDN-Cache-Control` untuk Cloudflare edge. Icon sudah ada cache, preview juga.
- Lebih baik: untuk preview & icon, redirect ke Supabase signed URL panjang (1 tahun) → dilayani langsung dari Supabase CDN, bukan lewat Worker.
- Tambah `loading="lazy"` + `decoding="async"` + `fetchpriority` di list gambar.

### 4. SEO improvements
- `__root.tsx`: tambah default OG image, twitter card, JSON-LD Organization.
- Tiap route (`index`, `about`, `leaderboard`, `request`, `apps.$id`) dapat `head()` unik: title, description, og:title, og:description, canonical relative, og:url.
- Route `apps.$id`: JSON-LD `SoftwareApplication` dari data app + og:image dari icon URL.
- `robots.txt`: pastikan allow `/`, disallow `/addapps`, `/status/set`, `/request/data`.
- `sitemap.xml` dinamis: buat `src/routes/sitemap[.]xml.ts` yang list semua app dari DB.

### 5. Video preview support
- Extend metadata: `PreviewMeta` sudah punya contentType — deteksi `video/*` untuk render `<video>` bukan `<img>`.
- `addapps.tsx`: accept `.mp4,.webm,image/*` di preview upload, kirim ke storage biasa (`app-icons/PREVIEWS/`).
- Naikkan limit preview jadi 50MB (biar cukup video pendek).
- `apps.$id.tsx`: render `<video controls>` untuk item dengan contentType `video/*`, gambar tetap `<img>`. Lightbox juga support video.

### 6. Leaderboard animations
- `leaderboard.tsx`: tambah stagger fade-in + slide, animasi counter (angka naik dari 0), medal shine untuk top 3, hover lift, entrance animation per item pakai `animation-delay`.

### 7. /about update
- Tambah section "Semua aplikasi gratis" + info exclusive butuh password.

### 8. APK upload limit 500MB
- `addapps.tsx`: ganti `200 * 1024 * 1024` → `500 * 1024 * 1024` (2 tempat: validasi client + label helper text).
- Cek server function `createUploadUrlFn` di `apps.functions.ts` — jika hardcode limit, naikkan juga.

### 9. Halaman /status
- Route baru `src/routes/status.tsx`: tampilkan status berbagai service (Web, Download APIs, Password APIs, DDoS, Overall).
- Data status disimpan di storage bucket `app-metadata` sebagai `status.json` (pattern sama seperti requests).
- Status entries: `{ id, service, level: "operational"|"degraded"|"down"|"lag", message, created_at }`.
- Kalau tidak ada entry aktif untuk service → tampil "Operational" hijau.
- Footer: "Powered by [FlashDuty logo]" pakai URL logo dari flashduty.

### 10. Halaman /status/set (admin)
- Route baru `src/routes/status_.set.tsx` (underscore = non-nested biar tidak konflik layout).
- Form: pilih service, level, message, submit. List status aktif dengan tombol "Resolve" (hapus).
- Simpan via server functions baru di `src/lib/status.functions.ts`.

### 11. Fix Broadcast notifications
- Check `NotificationBridge.tsx` dan `broadcasts.functions.ts`.
- Kemungkinan bug: Chrome butuh **Service Worker** untuk notifikasi background. Ganti pola `new Notification()` langsung → register SW + `registration.showNotification()`.
- Bikin `public/sw.js` service worker minimal, register di `NotificationBridge`.
- Polling atau realtime channel dari Supabase untuk trigger notif baru.

### 12. Menu hamburger tambah Status
- `AppHeader.tsx`: tambah `DrawerLink to="/status"` dengan icon `Activity`.

---

## Catatan teknis

- **Progressive**: implementasi urut prioritas kritis (1, 2, 3, 8, 11) dulu, lalu tambahan (5, 6, 9, 10), lalu polish (4, 7, 12).
- **Supabase createSignedUrl** untuk APK: `supabaseAdmin.storage.from("app-files").createSignedUrl(path, 3600, { download: filename })` → redirect 302.
- **Video preview**: file di-serve via route yang sama (`apps.preview.$id.ts`), Content-Type ikut yang disimpan di index.
- **FlashDuty logo**: pakai URL langsung `https://docs.flashduty.com/logo/saas-logo.svg` di `<img>`.
- **Video byte-range**: kalau `apps.preview.$id.ts` masih download-full lalu return, video streaming butuh range headers. Solusinya: redirect preview juga ke Supabase signed URL (sekaligus solve poin 3 untuk gambar). Jadi satu perbaikan yang sama.

Setuju aku jalankan semua? Atau ada yang mau di-drop / diprioritaskan berbeda?