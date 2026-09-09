# Sistem Rapor Diniyah Al-Husna

Aplikasi React + TypeScript untuk data santri, kurikulum kelas, pengisian nilai, dan rapor Indonesia–Arab. Penyimpanan menggunakan Firebase Authentication, Firestore, dan Cloud Functions.

## Menjalankan aplikasi

Gunakan Node.js 22 atau 24 untuk pengembangan frontend.

```sh
npm ci
npm run dev
```

Di Windows PowerShell, gunakan `npm.cmd` apabila eksekusi skrip dibatasi. Konfigurasi publik Firebase berasal dari `firebase-applet-config.json`, dan dapat diganti lewat variabel `VITE_FIREBASE_*` dalam `.env.local`; contoh tersedia pada `.env.example`. Jangan menyimpan service-account key atau kredensial admin di frontend.

## Pemeriksaan

```sh
npm run lint
npm test
npm run build
```

`npm run lint` menjalankan TypeScript. Uji regresi mencakup penyimpanan gagal/berhasil, nilai kosong, periode akademik, impor batch, pemetaan kelas, dan format cadangan.

`npm run test:ui` membuka pratinjau lokal pada [localhost:3100](http://127.0.0.1:3100). Pratinjau memakai data sintetis, tanpa Firebase; tersedia sakelar simulasi gagal simpan. Konfigurasi terpisah di `tests/ui` tidak dimasukkan dalam build produksi. Login pratinjau bukan autentikasi aplikasi.

## Firebase dan akun

- Login memakai username pada domain `alhusna.app`, atau email lengkap yang digunakan saat akun dibuat.
- Hak administrator ditentukan oleh custom claim Firebase `admin: true`. Nama username atau role yang tersimpan di browser tidak memberikan hak administrator. Akun administrator awal harus disiapkan oleh pengelola Firebase.
- Frontend dan Cloud Functions harus menggunakan **database ID yang sama**. Parameter Functions `FIRESTORE_DATABASE_ID` menggunakan database bernama pada konfigurasi repo sebagai default. Jika frontend mengubah `VITE_FIREBASE_DATABASE_ID`, ubah parameter Functions juga.
- Cloud Functions perlu dibangun dan dideploy secara terpisah agar perbaikan pembuatan/penghapusan akun berlaku. Runtime Functions tetap mengikuti `functions/package.json` (Node.js 20).
- Sesi ini tidak mengubah aturan Firestore yang aktif dan tidak melakukan migrasi atau deployment database produksi.

```sh
cd functions
npm ci
npm run build
```

Gunakan konfigurasi proyek Firebase milik lembaga saat melakukan deployment Functions dan aturan Firestore. Fungsi blocking pendaftaran memerlukan konfigurasi Identity Platform yang sesuai.

## Perilaku data

- Koleksi cloud yang kosong ditampilkan sebagai kosong; data contoh tidak ditambahkan otomatis.
- Pesan berhasil muncul setelah penyimpanan selesai. Kegagalan cloud tidak dialihkan diam-diam menjadi keberhasilan lokal.
- Mode lokal menyimpan perubahan pada browser perangkat. Perubahan lokal **tidak otomatis diunggah** saat beralih ke cloud. Unduh cadangan sebelum beralih.
- Cadangan JSON menyimpan snapshot akademik serta profil pengguna/log. Pemulihan menggabungkan santri, pelajaran dan wali kelas berdasarkan ID, mengganti pemetaan kelas dan pengaturan. Pemulihan tidak membuat akun Firebase Auth atau memulihkan password; profil akun dan log lama tetap menjadi referensi dalam berkas.
- Pergantian semester dapat menyalin identitas santri, mengosongkan nilai/absensi, dan mempertahankan riwayat. Santri dengan NIS yang sudah ada di periode tujuan tidak disalin lagi.
- Operasi besar dipecah menjadi batch 400 dokumen. Jika jaringan putus di antara batch, sebagian batch mungkin sudah tersimpan; pemulihan bukan transaksi atomik seluruh database.

## Hasil verifikasi

Lihat [catatan verifikasi](docs/verification.md) untuk lingkup uji dan hal yang masih memerlukan pemeriksaan pada lingkungan Firebase lembaga.
