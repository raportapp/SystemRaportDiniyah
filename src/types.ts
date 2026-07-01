export interface Subject {
  id: number;
  nameId: string;
  nameAr: string;
  kkm: number;
  category?: 'A' | 'B' | 'C'; // 'A' for Tertulis, 'B' for Hafalan / Membaca, 'C' for Menulis
}

export interface ClassSubject {
  kelas: string;
  subjectId: number;
}

export interface ClassTeacher {
  kelas: string;
  waliKelas: string;
}

export interface Student {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  semester: 'Ganjil' | 'Genap';
  tahunAjaran: string;
  sakit: number;
  izin: number;
  alpa: number;
  catatan: string;
  grades: Record<number, number>; // subjectId -> score
  akhlaq?: 'A' | 'B' | 'C' | 'D' | '';
  kerajinan?: 'A' | 'B' | 'C' | 'D' | '';
  kedisiplinan?: 'A' | 'B' | 'C' | 'D' | '';
  kerapihan?: 'A' | 'B' | 'C' | 'D' | '';
  createdBy?: string;
  noHpOrangTua?: string; // WhatsApp number for parent notification
  tempatLahir?: string;
  tanggalLahir?: string;
  gender?: 'L' | 'P' | '';
  alamat?: string;
  namaAyah?: string;
  namaIbu?: string;
  tanggalMasuk?: string;
  foto?: string; // Base64 student photo string
  namaArab?: string;
}

export interface SystemSettings {
  namaPengasuh: string;
  namaKepala: string;
  tempatRaport: string;
  tanggalRaport: string;
  tahunAjaran: string;
  semester: 'Ganjil' | 'Genap';
  logoSekolah: string; // Base64
  kopSurat: string; // Base64
  ttdPengasuh: string; // Base64
  ttdKepala: string; // Base64
  nilaiRaportSelesai?: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  fullname: string;
  role: 'admin' | 'teacher';
  photo?: string; // Base64
  phone?: string;
  nip?: string; // Nomor Induk Pegawai / Guru
  address?: string;
  bio?: string;
  email?: string;
  gender?: 'L' | 'P' | '';
}
