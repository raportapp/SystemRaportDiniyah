import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, PlusCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Subject, ClassSubject, ClassTeacher, UserAccount } from '../types';

interface SubjectManagerProps {
  subjects: Subject[];
  classSubjects: ClassSubject[];
  allClasses: string[];
  userRole?: string;
  currentUser?: UserAccount | null;
  teachers?: ClassTeacher[];
  onAddGlobalSubject: (nameId: string, nameAr: string, kkm: number, category?: 'A' | 'B' | 'C') => void;
  onDeleteGlobalSubject: (id: number) => void;
  onAddSubjectToClass: (kelas: string, subjectId: number) => void;
  onRemoveSubjectFromClass: (kelas: string, subjectId: number) => void;
}

export default function SubjectManager({
  subjects,
  classSubjects,
  allClasses,
  userRole = 'teacher',
  currentUser = null,
  teachers = [],
  onAddGlobalSubject,
  onDeleteGlobalSubject,
  onAddSubjectToClass,
  onRemoveSubjectFromClass
}: SubjectManagerProps) {
  // Determine classes managed by this teacher
  const managedClasses = teachers
    .filter(t => t.waliKelas.toLowerCase() === currentUser?.fullname.toLowerCase())
    .map(t => t.kelas);

  const isAdmin = userRole === 'admin';
  const classOptions = isAdmin ? allClasses : managedClasses;

  // Global Subject states
  const [nameId, setNameId] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [kkm, setKkm] = useState(70);
  const [category, setCategory] = useState<'A' | 'B' | 'C'>('A');

  // Class Subject Mapping states
  const [selectedClass, setSelectedClass] = useState(classOptions[0] || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');

  // Update selected class when classOptions becomes available
  React.useEffect(() => {
    if (classOptions.length > 0 && !classOptions.includes(selectedClass)) {
      setSelectedClass(classOptions[0]);
    }
  }, [classOptions]);

  const handleAddGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameId || !nameAr) {
      alert("Lengkapi nama mata pelajaran dalam bahasa Indonesia dan Arab!");
      return;
    }
    onAddGlobalSubject(nameId, nameAr, kkm, category);
    setNameId('');
    setNameAr('');
    setKkm(70);
    setCategory('A');
  };

  const handleAddClassMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || selectedSubjectId === '') {
      alert("Harap pilih kelas dan mata pelajaran!");
      return;
    }
    onAddSubjectToClass(selectedClass, Number(selectedSubjectId));
    setSelectedSubjectId('');
  };

  // Group class subjects for clean viewing
  const groupedClassSubjects: Record<string, Subject[]> = {};
  allClasses.forEach(c => {
    groupedClassSubjects[c] = [];
  });

  classSubjects.forEach(cs => {
    const sub = subjects.find(s => s.id === cs.subjectId);
    if (sub && groupedClassSubjects[cs.kelas]) {
      groupedClassSubjects[cs.kelas].push(sub);
    }
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">📚</span>
          Pengaturan Kurikulum & KKM Mata Pelajaran
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Daftarkan mata pelajaran secara global, tentukan KKM-nya, lalu hubungkan ke masing-masing jenjang kelas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Add Forms */}
        <div className="space-y-6">
          {/* Form 1: Add Global Subject */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-emerald-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <PlusCircle size={16} />
              Tambah Mapel Baru (Global)
            </h3>
            
            <form onSubmit={handleAddGlobal} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Nama Mapel (Bahasa Indonesia)</label>
                <input
                  type="text"
                  required
                  value={nameId}
                  onChange={(e) => setNameId(e.target.value)}
                  placeholder="Contoh: Al-Qur'an, Fiqih, Aqidah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Nama Mapel (Bahasa Arab)</label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="القرآن الكريم"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-800 text-right outline-none focus:ring-2 focus:ring-emerald-500 font-serif font-bold"
                  dir="rtl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Batas KKM Default</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={kkm}
                  onChange={(e) => setKkm(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Kelompok Mata Pelajaran</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'A' | 'B' | 'C')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="A">A. Tertulis</option>
                  <option value="B">B. Hafalan / Membaca</option>
                  <option value="C">C. Menulis</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-sm transition"
              >
                Simpan Mapel Global
              </button>
            </form>
          </div>

          {/* Form 2: Link Mapel to Class */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-teal-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <PlusCircle size={16} />
              Hubungkan Mapel ke Kelas
            </h3>

            <form onSubmit={handleAddClassMapping} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Pilih Kelas</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={classOptions.length === 0}
                >
                  {classOptions.length > 0 ? (
                    classOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  ) : (
                    <option value="">-- Tidak ada kelas asuhan --</option>
                  )}
                </select>
                {!isAdmin && classOptions.length === 0 && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1">Nama profil Anda tidak terdaftar sebagai Wali Kelas di kelas manapun.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Pilih Mata Pelajaran</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value !== '' ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={classOptions.length === 0}
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.nameId} ({s.nameAr})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={classOptions.length === 0}
                className={`w-full font-bold py-2.5 rounded-lg shadow-sm transition ${
                  classOptions.length === 0 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-teal-700 hover:bg-teal-600 text-white'
                }`}
              >
                Hubungkan ke Kelas
              </button>
            </form>
          </div>
        </div>

        {/* Column 2 & 3: List view of Class subjects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Global Subject list */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <BookOpen size={16} />
              Daftar Semua Mapel Global ({subjects.length})
            </h3>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {subjects.map(sub => (
                <div key={sub.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded bg-emerald-50 text-emerald-800 font-extrabold flex items-center justify-center text-xs">
                      {sub.id}
                    </span>
                    <div>
                      <p className="font-bold text-gray-800">{sub.nameId}</p>
                      <p className="text-xs text-gray-400 font-semibold font-serif" dir="rtl">{sub.nameAr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold text-slate-600">
                      KKM: {sub.kkm}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-1 rounded-full font-bold uppercase">
                      Klp: {sub.category || 'A'}
                    </span>
                    {isAdmin ? (
                      <button
                        onClick={() => onDeleteGlobalSubject(sub.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                        title="Hapus global"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="text-slate-300 p-1" title="Hanya Admin yang dapat menghapus mapel global">
                        <Trash2 size={16} className="opacity-40 cursor-not-allowed" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Class-by-Class Mapel Display */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <CheckCircle size={16} />
              Pemetaan Mata Pelajaran per Jenjang Kelas
            </h3>

            <div className="space-y-6">
              {allClasses.map(kelasName => {
                const mapelList = groupedClassSubjects[kelasName] || [];

                return (
                  <div key={kelasName} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          {kelasName}
                        </span>
                        {managedClasses.includes(kelasName) && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full">
                            Kelas Asuhan Anda
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-400">
                        {mapelList.length} Mata Pelajaran
                      </span>
                    </div>

                    {mapelList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {mapelList.map(sub => (
                          <div key={sub.id} className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg flex items-center justify-between hover:bg-slate-50 transition">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-800">{sub.nameId}</p>
                                <span className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-bold uppercase font-mono">
                                  Klp {sub.category || 'A'}
                                </span>
                              </div>
                              <p className="text-[10px] text-emerald-800 font-serif font-bold" dir="rtl">{sub.nameAr}</p>
                              <span className="inline-block text-[9px] bg-slate-100 font-extrabold px-1.5 py-0.5 rounded text-slate-500 font-mono">
                                KKM: {sub.kkm}
                              </span>
                            </div>
                            {isAdmin || managedClasses.includes(kelasName) ? (
                              <button
                                onClick={() => onRemoveSubjectFromClass(kelasName, sub.id)}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition"
                                title="Hapus dari kelas"
                              >
                                <Trash2 size={13} />
                              </button>
                            ) : (
                              <span className="text-slate-300 p-1.5" title="Hanya Wali Kelas yang dapat menghapus">
                                <Trash2 size={13} className="opacity-40 cursor-not-allowed" />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Belum ada mata pelajaran dikaitkan. Santri di kelas ini akan default ke semua mata pelajaran global.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
