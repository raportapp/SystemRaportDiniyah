import { Subject, ClassTeacher, Student, SystemSettings, SystemLog, UserAccount } from '../types';

export const INITIAL_SUBJECTS: Subject[] = [
  // A. Tertulis
  { id: 1, nameId: "Fiqih", nameAr: "المبدي الفقهية", kkm: 70, category: "A" },
  { id: 2, nameId: "Tauhid", nameAr: "عقيدة العوام", kkm: 70, category: "A" },
  { id: 3, nameId: "Nahwu", nameAr: "الجرومية / الشروى الشافعي", kkm: 70, category: "A" },
  { id: 4, nameId: "Tajwid (Tertulis)", nameAr: "هداية الصبيان", kkm: 70, category: "A" },
  { id: 5, nameId: "Akhlak", nameAr: "الالا", kkm: 70, category: "A" },
  { id: 6, nameId: "Tarikh", nameAr: "خلاصة نور اليقين", kkm: 70, category: "A" },
  
  // B. Hafalan / Membaca
  { id: 7, nameId: "Al-Quran Bil Ghoib", nameAr: "القرآن بالغيب", kkm: 70, category: "B" },
  { id: 8, nameId: "Al-Qur'an Binadzor", nameAr: "القرآن بالنظر", kkm: 70, category: "B" },
  { id: 9, nameId: "Tartilul Qur'an", nameAr: "ترتيل القرآن", kkm: 70, category: "B" },
  { id: 10, nameId: "Tajwid (Praktek)", nameAr: "تجويد", kkm: 70, category: "B" },
  
  // C. Menulis
  { id: 11, nameId: "Metode Imla'", nameAr: "الأملاء القرآن", kkm: 70, category: "C" }
];

export const INITIAL_CLASSES = [
  "Sughro Awal Putra",
  "Sughro Awal Putri",
  "Sughro Tsani Putra",
  "Sughro Tsani Putri",
  "Kubro Awal",
  "Kubro Tsani",
  "Ma'had Aly"
];

export const INITIAL_TEACHERS: ClassTeacher[] = [
  { kelas: "Sughro Awal Putra", waliKelas: "Ustadz M. Farhan, S.Pd." },
  { kelas: "Sughro Awal Putri", waliKelas: "Ustadzah Fatimah, S.Ag." },
  { kelas: "Sughro Tsani Putra", waliKelas: "Ustadz Ahmad Fauzi, S.Pd." },
  { kelas: "Sughro Tsani Putri", waliKelas: "Ustadzah Siti Aminah, S.Pd.I" },
  { kelas: "Kubro Awal", waliKelas: "Ustadz H. Abdul Halim, Lc." },
  { kelas: "Kubro Tsani", waliKelas: "Ustadz Dr. Rahmat Hidayat" },
  { kelas: "Ma'had Aly", waliKelas: "Achmad Husain" }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "stud-1",
    nis: "786190218",
    nama: "Zhafira Naufalyn Azalia",
    kelas: "Sughro Awal Putri",
    semester: "Ganjil",
    tahunAjaran: "2024/2025",
    sakit: 0,
    izin: 8,
    alpa: 0,
    catatan: "Kurangi waktu bermain,tingkatkan lagi waktu belajar nya",
    grades: { 1: 95, 2: 88, 3: 70, 4: 90, 5: 95, 6: 74, 7: 75, 8: 70, 9: 75, 10: 75, 11: 77 },
    akhlaq: 'C',
    kerajinan: 'B',
    kedisiplinan: 'B',
    kerapihan: 'B'
  },
  {
    id: "stud-2",
    nis: "122302",
    nama: "Muhammad Azka Al-Ghifari",
    kelas: "Sughro Awal Putra",
    semester: "Ganjil",
    tahunAjaran: "2025/2026",
    sakit: 1,
    izin: 2,
    alpa: 0,
    catatan: "Sangat baik dalam hafalan juz 30, pertahankan prestasimu dan tingkatkan kerapihan tulisan bahasa Arab.",
    grades: { 1: 85, 2: 78, 3: 82, 4: 90, 5: 80, 6: 75, 7: 84, 8: 88, 9: 80, 10: 85, 11: 80 },
    akhlaq: 'A',
    kerajinan: 'B',
    kedisiplinan: 'B',
    kerapihan: 'A'
  },
  {
    id: "stud-3",
    nis: "122303",
    nama: "Aisyah Azzahra Humaira",
    kelas: "Sughro Awal Putri",
    semester: "Ganjil",
    tahunAjaran: "2025/2026",
    sakit: 0,
    izin: 1,
    alpa: 0,
    catatan: "Akhlaq dan adab sangat mulia, rajin membantu guru dan teman. Hafalan Qur'an tajwidnya sangat fasih.",
    grades: { 1: 92, 2: 85, 3: 88, 4: 95, 5: 84, 6: 80, 7: 86, 8: 91, 9: 90, 10: 92, 11: 88 },
    akhlaq: 'A',
    kerajinan: 'A',
    kedisiplinan: 'A',
    kerapihan: 'A'
  },
  {
    id: "stud-4",
    nis: "122304",
    nama: "Farhan Maulana Yusuf",
    kelas: "Sughro Tsani Putra",
    semester: "Ganjil",
    tahunAjaran: "2025/2026",
    sakit: 2,
    izin: 0,
    alpa: 1,
    catatan: "Alhamdulillah nilai akademik cukup bagus, mohon dikurangi ketidakhadiran tanpa keterangan.",
    grades: { 1: 72, 2: 70, 3: 75, 4: 80, 5: 72, 6: 71, 7: 74, 8: 76, 9: 72, 10: 70, 11: 75 },
    akhlaq: 'B',
    kerajinan: 'C',
    kedisiplinan: 'C',
    kerapihan: 'B'
  },
  {
    id: "stud-5",
    nis: "122305",
    nama: "Zainal Abidin Syihab",
    kelas: "Kubro Awal",
    semester: "Ganjil",
    tahunAjaran: "2025/2026",
    sakit: 3,
    izin: 1,
    alpa: 0,
    catatan: "Kemampuan memimpin sangat bagus. Terus tingkatkan kefasihan membaca Kitab Kuning.",
    grades: { 1: 80, 2: 82, 3: 85, 4: 87, 5: 83, 6: 78, 7: 81, 8: 84 }
  },
  {
    id: "stud-6",
    nis: "122306",
    nama: "Naila Rizqi Safitri",
    kelas: "Kubro Tsani",
    semester: "Ganjil",
    tahunAjaran: "2025/2026",
    sakit: 0,
    izin: 2,
    alpa: 0,
    catatan: "Tekun belajar dan memiliki rasa ingin tahu yang tinggi. Prestasi yang luar biasa.",
    grades: { 1: 88, 2: 84, 3: 86, 4: 89, 5: 85, 6: 82, 7: 85, 8: 87 }
  },
  {
    id: "stud-7",
    nis: "122307",
    nama: "Imam Syafii",
    kelas: "Ma'had Aly",
    semester: "Ganjil",
    tahunAjaran: "2025/2026",
    sakit: 0,
    izin: 0,
    alpa: 0,
    catatan: "Pemahaman ushul fiqih luar biasa, pertahankan minat riset ilmiah keislaman.",
    grades: { 1: 96, 2: 94, 3: 95, 4: 98, 5: 96, 6: 92, 7: 95, 8: 97 }
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  namaPengasuh: "Achmad Husain",
  namaKepala: "Ustadz Achmad Husain",
  tempatRaport: "Pringsewu",
  tanggalRaport: "20 Juni 2026",
  tahunAjaran: "2025/2026",
  semester: "Ganjil",
  logoSekolah: "", // Will render a nice dynamic SVG/emblem if empty
  kopSurat: "",
  ttdPengasuh: "",
  ttdKepala: "",
  nilaiRaportSelesai: false
};

export const INITIAL_LOGS: SystemLog[] = [
  { id: "log-1", timestamp: "2026-06-25 08:00:00", action: "Inisialisasi Sistem", details: "Database sistem raport diniyah berhasil diinisialisasi.", user: "Sistem" },
  { id: "log-2", timestamp: "2026-06-25 09:15:00", action: "Tambah Akun", details: "Akun Guru Ustadz Farhan berhasil dibuat.", user: "Achmad Husain" },
  { id: "log-3", timestamp: "2026-06-25 10:30:00", action: "Seeding Data", details: "Data santri, mata pelajaran, dan wali kelas default berhasil disisipkan.", user: "Sistem" }
];

export const INITIAL_USERS: UserAccount[] = [
  { id: "user-1", username: "admin", fullname: "Achmad Husain", role: "admin", password: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" },
  { id: "user-2", username: "ustadz", fullname: "Ustadz M. Farhan, S.Pd.", role: "teacher", password: "9e38e6022e11e03c622434e38e68cfb617066928e404b0451fc7096d8591a27e" }
];
