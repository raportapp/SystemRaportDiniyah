# Verifikasi perbaikan

Tanggal: 9 September 2026.

## Perbaikan yang dicakup

- Login dua kolom, sidebar responsif, dashboard progres nilai, daftar kelas, pencarian, dan status kosong.
- Navigasi daftar kelas/profil/input nilai berfungsi; kembali menambah santri menghapus pilihan edit sebelumnya.
- ID santri baru dibuat sebelum disimpan; duplikasi NIS pada periode sama ditolak.
- Simpan dan hapus tidak mengubah state terlebih dahulu jika cloud menolak operasi.
- Input kolektif hanya menulis santri di kelas dan semester terpilih; status berhasil menunggu penyimpanan.
- Nilai belum diisi tidak otomatis menjadi nol. Nilai numerik dari database dinormalisasi.
- Cetak kelas dan hapus kelas memakai periode aktif; peringkat rapor membandingkan periode santri tersebut.
- Batas pembacaan 300 santri dihapus, penulisan besar dipecah menjadi batch, pemetaan kelas yang dihapus ikut dihapus di server.
- Pergantian semester menghormati tahun ajaran tujuan dan pilihan daftar ulang; pengaturan lain tidak menghapus status kunci nilai.
- Ubah password dari profil memanggil Firebase Auth dengan reautentikasi.
- Hak admin memakai custom claim, tidak ditebak dari username.
- Functions akun memakai database ID yang konsisten dengan frontend.
- Worker menggunakan aset produksi dan tidak menyimpan permintaan Firebase.
- Halaman Excel/grafik/cetak dimuat terpisah dari bundle awal.

## Bukti otomatis

- TypeScript frontend: lulus.
- Uji Vitest: 15 kasus, termasuk regresi format unduh/pulihkan cadangan.
- Build frontend: lulus. Bundle awal turun dari sekitar 2,082 kB menjadi 1,068 kB (sebelum gzip); Firebase dan Excel/grafik masih menghasilkan peringatan ukuran chunk.
- TypeScript Cloud Functions: lulus dengan Node lokal 24; runtime deployment yang dideklarasikan tetap Node 20.

## Bukti browser

- Halaman login aplikasi utama termuat, tanpa error konsol pada pemeriksaan.
- Dashboard data contoh termuat tanpa error.
- Pencarian kelas dan tombol rapor kelas menampilkan kelas yang dipilih.
- Simulasi kegagalan simpan mempertahankan formulir dan menampilkan error.
- Pada viewport 390 × 844, dashboard tidak meluber horizontal; drawer navigasi membuka/menutup dan berpindah halaman.
- Pratinjau rapor menampilkan sampul, biodata, dan nilai dari data contoh.

## Batas verifikasi

Belum dilakukan login menggunakan akun lembaga, penyimpanan/penghapusan pada Firebase produksi, pemanggilan Functions produksi, pengujian emulator aturan Firestore, atau cetak ke printer fisik. Tidak ada deployment atau migrasi produksi dalam perubahan ini. Pengelola perlu memeriksa alur akun admin/guru dan perubahan data pada staging sebelum menggabungkan serta mengaktifkan deployment.

Aturan Firestore yang ada masih memberi pengguna terautentikasi akses tulis santri secara luas. Batas wali kelas dan kunci nilai di antarmuka bukan pengganti pembatasan server; penguatan otorisasi per kelas memerlukan pemetaan guru berdasarkan UID dan migrasi data terencana.
