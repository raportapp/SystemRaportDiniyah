import { createContext, useContext, useState } from 'react';
import { settings, subjects, student } from '../fixtures';
const Context = createContext<any>(null);
const classes = [
  'Sughro Awal Putra',
  'Sughro Awal Putri',
  'Sughro Tsani Putra',
  'Sughro Tsani Putri',
  'Kubro Awal',
  'Kubro Tsani',
  "Ma'had Aly",
];
export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [students, setStudents] = useState(
    Array.from({ length: 28 }, (_, i) => ({
      ...student,
      id: 'example-' + i,
      nis: String(i + 1).padStart(3, '0'),
      nama: 'Santri Contoh ' + String(i + 1).padStart(2, '0'),
      kelas: classes[i % 7],
      grades: i % 3 === 0 ? { 1: 84, 2: 90 } : { 1: 65 + (i % 30) },
    })),
  );
  const value = {
    activeTab,
    setActiveTab,
    setEditingStudentId: () => {},
    settings,
    subjects,
    students,
    setStudents,
    classSubjects: classes.flatMap((kelas) =>
      subjects.map((s) => ({ kelas, subjectId: s.id })),
    ),
    teachers: classes.map((kelas) => ({ kelas, waliKelas: 'Guru Contoh' })),
    logs: [
      {
        id: 'log1',
        timestamp: '2026-09-09T04:00:00Z',
        action: 'SIMPAN_SANTRI',
        details: 'Memperbarui data Santri Contoh 01',
        user: 'Guru Contoh',
      },
      {
        id: 'log2',
        timestamp: '2026-09-09T03:00:00Z',
        action: 'INPUT_NILAI',
        details: 'Mengisi nilai Fiqih kelas Kubro Awal',
        user: 'Guru Contoh',
      },
    ],
    useCloudSync: false,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    addLog: async () => {},
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() {
  return useContext(Context);
}
export function useAuth() {
  return {
    currentUser: {
      id: 'preview',
      username: 'preview',
      fullname: 'Guru Contoh',
      role: 'admin',
    },
    logout: async () => {},
    updateUserPassword: async () => {},
    login: async () => {
      throw new Error(
        'Ini pratinjau lokal. Login asli tersedia di aplikasi utama.',
      );
    },
  };
}
