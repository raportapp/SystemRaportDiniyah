import { Student, Subject, ClassSubject, SystemSettings } from '../src/types';
export const settings: SystemSettings = {
  namaPengasuh: 'Pengasuh Contoh',
  namaKepala: 'Kepala Contoh',
  tempatRaport: 'Pringsewu',
  tanggalRaport: '2026-06-20',
  tahunAjaran: '2025/2026',
  semester: 'Genap',
  logoSekolah: '',
  kopSurat: '',
  ttdKepala: '',
  ttdPengasuh: '',
};
export const subjects: Subject[] = [
  { id: 1, nameId: 'Fiqih', nameAr: 'فقه', kkm: 70, category: 'A' },
  { id: 2, nameId: 'Akhlak', nameAr: 'أخلاق', kkm: 70, category: 'A' },
];
export const mappings: ClassSubject[] = [
  { kelas: 'Kubro Awal', subjectId: 1 },
  { kelas: 'Kubro Awal', subjectId: 2 },
];
export const student: Student = {
  id: 'sample-1',
  nis: '001',
  nama: 'Santri Contoh',
  kelas: 'Kubro Awal',
  semester: 'Genap',
  tahunAjaran: '2025/2026',
  sakit: 0,
  izin: 0,
  alpa: 0,
  catatan: '',
  grades: { 1: 80 },
};
