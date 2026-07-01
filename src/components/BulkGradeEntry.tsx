import React, { useState, useEffect, useRef } from 'react';
import { Save, HelpCircle, ArrowRight, Table, Copy, BookOpen } from 'lucide-react';
import { Student, Subject, ClassTeacher, ClassSubject, UserAccount } from '../types';

interface BulkGradeEntryProps {
  students: Student[];
  subjects: Subject[];
  classSubjects: ClassSubject[];
  teachers: ClassTeacher[];
  currentUser: UserAccount | null;
  userRole: string;
  activeSemester: 'Ganjil' | 'Genap';
  activeTahunAjaran: string;
  onBulkSaveStudents: (updatedStudents: Student[]) => void;
  onNavigate: (tab: string) => void;
}

export default function BulkGradeEntry({
  students,
  subjects,
  classSubjects,
  teachers,
  currentUser,
  userRole,
  activeSemester,
  activeTahunAjaran,
  onBulkSaveStudents,
  onNavigate
}: BulkGradeEntryProps) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [gradesState, setGradesState] = useState<Record<string, string>>({}); // studentId -> score string
  const [bulkVal, setBulkVal] = useState<string>('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // References for keyboard navigation
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Filter classes managed by the teacher or show all for admin
  const managedClasses = teachers
    .filter(t => userRole === 'admin' || t.waliKelas.toLowerCase() === currentUser?.fullname?.toLowerCase())
    .map(t => t.kelas);

  // Filter students in the active term and selected class
  const activeTermStudents = students.filter(st => 
    st.semester === activeSemester && 
    st.tahunAjaran === activeTahunAjaran &&
    (selectedClass ? st.kelas === selectedClass : true)
  );

  const availableClasses = userRole === 'admin' 
    ? Array.from(new Set(teachers.map(t => t.kelas))) 
    : managedClasses;

  // Filter subjects linked to the selected class
  const classSubIds = classSubjects
    .filter(cs => cs.kelas === selectedClass)
    .map(cs => cs.subjectId);
  const availableSubjects = subjects.filter(sub => classSubIds.includes(sub.id));

  // Load existing grades when class or subject changes
  useEffect(() => {
    if (selectedClass && selectedSubjectId !== '') {
      const initialGrades: Record<string, string> = {};
      activeTermStudents.forEach(st => {
        const score = st.grades[Number(selectedSubjectId)];
        initialGrades[st.id] = score !== undefined ? String(score) : '';
      });
      setGradesState(initialGrades);
    } else {
      setGradesState({});
    }
  }, [selectedClass, selectedSubjectId, students]);

  const handleGradeChange = (studentId: string, val: string) => {
    // Basic formatting constraint to only accept digits or empty
    if (val === '' || /^\d+$/.test(val)) {
      const num = Number(val);
      if (val === '' || (num >= 0 && num <= 100)) {
        setGradesState(prev => ({ ...prev, [studentId]: val }));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number, studentId: string) => {
    const studentIds = activeTermStudents.map(s => s.id);
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextId = studentIds[currentIndex + 1];
      if (nextId) {
        inputRefs.current[nextId]?.focus();
        inputRefs.current[nextId]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevId = studentIds[currentIndex - 1];
      if (prevId) {
        inputRefs.current[prevId]?.focus();
        inputRefs.current[prevId]?.select();
      }
    }
  };

  const handleBulkSet = () => {
    if (bulkVal === '' || isNaN(Number(bulkVal)) || Number(bulkVal) < 0 || Number(bulkVal) > 100) {
      alert("Harap masukkan nilai default antara 0 - 100!");
      return;
    }
    const updated: Record<string, string> = {};
    activeTermStudents.forEach(st => {
      updated[st.id] = bulkVal;
    });
    setGradesState(updated);
  };

  const handleSetKKM = () => {
    const activeSub = subjects.find(s => s.id === Number(selectedSubjectId));
    if (!activeSub) return;

    if (confirm(`Apakah Anda yakin ingin mengisi nilai KKM (${activeSub.kkm}) untuk seluruh santri yang nilainya masih kosong?`)) {
      const updated = { ...gradesState };
      activeTermStudents.forEach(st => {
        if (!updated[st.id] || updated[st.id].trim() === '') {
          updated[st.id] = String(activeSub.kkm);
        }
      });
      setGradesState(updated);
    }
  };

  const handleSaveAll = () => {
    if (!selectedClass || selectedSubjectId === '') {
      alert("Pilih Kelas dan Mata Pelajaran terlebih dahulu!");
      return;
    }

    const subjectIdNum = Number(selectedSubjectId);
    
    // Construct updated students array
    const updatedStudentsList = students.map(st => {
      if (st.semester === activeSemester && st.tahunAjaran === activeTahunAjaran && st.kelas === selectedClass) {
        const scoreStr = gradesState[st.id];
        const newGrades = { ...st.grades };
        if (scoreStr !== undefined && scoreStr.trim() !== '') {
          newGrades[subjectIdNum] = parseInt(scoreStr, 10);
        } else {
          delete newGrades[subjectIdNum];
        }
        return {
          ...st,
          grades: newGrades
        };
      }
      return st;
    });

    onBulkSaveStudents(updatedStudentsList);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const activeSubject = subjects.find(s => s.id === Number(selectedSubjectId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Table className="text-emerald-800" size={24} />
            <span>Input Nilai Kolektif / Massal</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Input spreadsheet-like interaktif untuk memasukkan nilai seluruh kelas dalam satu layar.
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-xl px-4 py-2 text-xs font-bold shrink-0 self-start md:self-auto">
          Periode Aktif: <span className="text-emerald-950 underline">{activeTahunAjaran} ({activeSemester})</span>
        </div>
      </div>

      {/* Selectors card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
        <div className="md:col-span-4 space-y-2">
          <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">1. Pilih Kelas</label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedSubjectId('');
            }}
            className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition"
          >
            <option value="">-- Pilih Kelas --</option>
            {availableClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4 space-y-2">
          <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">2. Pilih Mata Pelajaran</label>
          <select
            value={selectedSubjectId}
            disabled={!selectedClass}
            onChange={(e) => setSelectedSubjectId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition disabled:opacity-50"
          >
            <option value="">-- Pilih Mata Pelajaran --</option>
            {availableSubjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.nameId} ({sub.nameAr})</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4 flex items-center justify-end">
          <button
            onClick={() => onNavigate('students')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            Kembali ke Daftar Santri →
          </button>
        </div>
      </div>

      {selectedClass && selectedSubjectId !== '' ? (
        <div className="space-y-4">
          {/* Bulk set toolbar */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700">⚡ Alat Cepat:</span>
              <div className="flex items-center gap-1 bg-white border border-slate-250 rounded-lg p-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bulkVal}
                  onChange={(e) => setBulkVal(e.target.value)}
                  className="w-16 text-center outline-none text-xs font-black text-slate-800"
                  placeholder="Nilai"
                />
                <button
                  onClick={handleBulkSet}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] px-2.5 py-1.5 rounded transition cursor-pointer flex items-center gap-1"
                >
                  <Copy size={11} />
                  <span>Salin ke Semua</span>
                </button>
              </div>

              {activeSubject && (
                <button
                  onClick={handleSetKKM}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-[10px] px-3 py-2 rounded-lg border border-amber-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🎯 Isi Kosong dgn KKM ({activeSubject.kkm})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-100">
                <HelpCircle size={12} className="text-slate-400" />
                <span>Tekan <b>Enter</b> atau <b>↓/↑</b> untuk navigasi vertikal</span>
              </span>
            </div>
          </div>

          {/* Table Spreadsheet */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                <BookOpen size={16} className="text-slate-400" />
                <span>Lembar Input: {selectedClass} — {activeSubject?.nameId} (KKM: {activeSubject?.kkm})</span>
              </div>
              <span className="text-[10px] bg-slate-200 font-black text-slate-700 px-2.5 py-1 rounded-full">
                Total: {activeTermStudents.length} Santri
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
                    <th className="px-6 py-3 w-16 text-center">No</th>
                    <th className="px-6 py-3 w-32">NIS</th>
                    <th className="px-6 py-3">Nama Lengkap</th>
                    <th className="px-6 py-3 w-32 text-center">KKM</th>
                    <th className="px-6 py-3 w-48 text-center">Nilai Rapor</th>
                    <th className="px-6 py-3 w-36 text-center">Status Kelulusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {activeTermStudents.map((st, index) => {
                    const score = gradesState[st.id] || '';
                    const isPassed = score !== '' && activeSubject && Number(score) >= activeSubject.kkm;
                    const hasValue = score !== '';

                    return (
                      <tr key={st.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3 text-center text-slate-400 font-semibold">{index + 1}</td>
                        <td className="px-6 py-3 font-mono text-slate-600">{st.nis}</td>
                        <td className="px-6 py-3 font-black text-slate-900">{st.nama}</td>
                        <td className="px-6 py-3 text-center font-bold text-slate-500">{activeSubject?.kkm || '-'}</td>
                        <td className="px-6 py-2 text-center">
                          <input
                            ref={(el) => { inputRefs.current[st.id] = el; }}
                            type="text"
                            value={score}
                            onChange={(e) => handleGradeChange(st.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, st.id)}
                            placeholder="Belum diisi"
                            className={`w-28 text-center px-3 py-1.5 rounded-lg border font-black text-sm outline-none transition focus:ring-2 ${
                              !hasValue 
                                ? 'bg-slate-50 border-slate-250 text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-emerald-100'
                                : isPassed
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 focus:bg-white focus:border-emerald-600 focus:ring-emerald-100'
                                  : 'bg-rose-50 border-rose-300 text-rose-800 focus:bg-white focus:border-rose-600 focus:ring-rose-100'
                            }`}
                          />
                        </td>
                        <td className="px-6 py-3 text-center">
                          {!hasValue ? (
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2.5 py-1 rounded-full uppercase">
                              Kosong
                            </span>
                          ) : isPassed ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase">
                              Tuntas (Lulus)
                            </span>
                          ) : (
                            <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2.5 py-1 rounded-full uppercase">
                              Dibawah KKM
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 font-medium">
                * Pastikan untuk menekan tombol <b>Simpan Semua Nilai</b> di samping untuk menyimpan nilai ke database.
              </p>
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-emerald-800/20 transition active:scale-95 cursor-pointer"
              >
                <Save size={16} />
                <span>Simpan Semua Nilai Kelas ini</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3 shadow-sm">
          <div className="text-4xl">🗒️</div>
          <h3 className="text-sm font-black text-slate-800">Lembar Nilai Kosong</h3>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            Harap pilih <b>Kelas</b> dan <b>Mata Pelajaran</b> terlebih dahulu untuk membuka lembar spreadsheet nilai santri.
          </p>
        </div>
      )}

      {/* Floating Save success Toast / notification */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-3 animate-bounce">
          <span className="text-xl">🕌</span>
          <div>
            <p className="text-xs font-black">Alhamdulillah!</p>
            <p className="text-[10px] text-slate-400 font-medium">Nilai kelas berhasil disimpan ke lokal & database Cloud!</p>
          </div>
        </div>
      )}
    </div>
  );
}
