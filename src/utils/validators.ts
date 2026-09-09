import { Student, Subject, ClassSubject, ClassTeacher, SystemSettings, SystemLog, UserAccount } from '../types';

export function validateStudent(data: any): Student {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid Student document: not an object');
  }
  return {
    id: String(data.id || ''),
    nis: String(data.nis || ''),
    nama: String(data.nama || 'Tanpa Nama'),
    kelas: String(data.kelas || ''),
    semester: data.semester === 'Genap' ? 'Genap' : 'Ganjil',
    tahunAjaran: String(data.tahunAjaran || ''),
    sakit: typeof data.sakit === 'number' ? data.sakit : 0,
    izin: typeof data.izin === 'number' ? data.izin : 0,
    alpa: typeof data.alpa === 'number' ? data.alpa : 0,
    catatan: String(data.catatan || ''),
    grades: Object.fromEntries(Object.entries(data.grades && typeof data.grades === 'object' && !Array.isArray(data.grades) ? data.grades : {}).filter(([key, value]) => /^\d+$/.test(key) && value !== '' && value !== null && (typeof value === 'number' || typeof value === 'string') && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100).map(([key, value]) => [key, Number(value)])),
    akhlaq: data.akhlaq || '',
    kerajinan: data.kerajinan || '',
    kedisiplinan: data.kedisiplinan || '',
    kerapihan: data.kerapihan || '',
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
    noHpOrangTua: data.noHpOrangTua ? String(data.noHpOrangTua) : undefined,
    tempatLahir: data.tempatLahir ? String(data.tempatLahir) : undefined,
    tanggalLahir: data.tanggalLahir ? String(data.tanggalLahir) : undefined,
    gender: data.gender || '',
    alamat: data.alamat ? String(data.alamat) : undefined,
    namaAyah: data.namaAyah ? String(data.namaAyah) : undefined,
    namaIbu: data.namaIbu ? String(data.namaIbu) : undefined,
    tanggalMasuk: data.tanggalMasuk ? String(data.tanggalMasuk) : undefined,
    foto: data.foto ? String(data.foto) : undefined,
    namaArab: data.namaArab ? String(data.namaArab) : undefined,
  };
}

export function validateSubject(data: any): Subject {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid Subject document: not an object');
  }
  return {
    id: Number(data.id || 0),
    nameId: String(data.nameId || ''),
    nameAr: String(data.nameAr || ''),
    kkm: typeof data.kkm === 'number' ? data.kkm : 70,
    category: data.category || 'A',
  };
}

export function validateClassSubject(data: any): ClassSubject {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid ClassSubject document: not an object');
  }
  return {
    kelas: String(data.kelas || ''),
    subjectId: Number(data.subjectId || 0),
  };
}

export function validateClassTeacher(data: any): ClassTeacher {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid ClassTeacher document: not an object');
  }
  return {
    kelas: String(data.kelas || ''),
    waliKelas: String(data.waliKelas || ''),
  };
}

export function validateSystemSettings(data: any): SystemSettings {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid SystemSettings document: not an object');
  }
  return {
    namaPengasuh: String(data.namaPengasuh || ''),
    namaKepala: String(data.namaKepala || ''),
    tempatRaport: String(data.tempatRaport || 'Pringsewu'),
    tanggalRaport: String(data.tanggalRaport || ''),
    tahunAjaran: String(data.tahunAjaran || '2025/2026'),
    semester: data.semester === 'Genap' ? 'Genap' : 'Ganjil',
    logoSekolah: String(data.logoSekolah || ''),
    kopSurat: String(data.kopSurat || ''),
    ttdPengasuh: String(data.ttdPengasuh || ''),
    ttdKepala: String(data.ttdKepala || ''),
    nilaiRaportSelesai: Boolean(data.nilaiRaportSelesai),
  };
}

export function validateSystemLog(data: any): SystemLog {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid SystemLog document: not an object');
  }
  return {
    id: String(data.id || String(Date.now())),
    timestamp: String(data.timestamp || new Date().toISOString()),
    action: String(data.action || 'SISTEM'),
    details: String(data.details || ''),
    user: String(data.user || 'Sistem'),
  };
}

export function validateUserAccount(data: any): UserAccount {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid UserAccount document: not an object');
  }
  return {
    id: String(data.id || ''),
    username: String(data.username || ''),
    fullname: String(data.fullname || 'Pengguna'),
    role: data.role === 'admin' ? 'admin' : 'teacher',
    photo: data.photo ? String(data.photo) : undefined,
    phone: data.phone ? String(data.phone) : undefined,
    nip: data.nip ? String(data.nip) : undefined,
    address: data.address ? String(data.address) : undefined,
    bio: data.bio ? String(data.bio) : undefined,
    email: data.email ? String(data.email) : undefined,
    gender: data.gender || '',
  };
}
