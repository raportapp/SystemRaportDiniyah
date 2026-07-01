import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, BookOpen, Clock, FileEdit, HelpCircle } from 'lucide-react';
import { Student, Subject, ClassSubject } from '../types';

interface StudentFormProps {
  student?: Student; // undefined for Add, defined for Edit
  subjects: Subject[];
  classSubjects: ClassSubject[];
  availableClasses: string[];
  currentTahunAjaran: string;
  currentSemester: 'Ganjil' | 'Genap';
  onSave: (studentData: Omit<Student, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}

export default function StudentForm({
  student,
  subjects,
  classSubjects,
  availableClasses,
  currentTahunAjaran,
  currentSemester,
  onSave,
  onCancel
}: StudentFormProps) {
  // 1. Student Identity States
  const [nama, setNama] = useState(student?.nama || '');
  const [nis, setNis] = useState(student?.nis || '');
  const [kelas, setKelas] = useState(student?.kelas || availableClasses[0] || '');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(student?.semester || currentSemester);
  const [tahunAjaran, setTahunAjaran] = useState(student?.tahunAjaran || currentTahunAjaran);
  const [noHpOrangTua, setNoHpOrangTua] = useState(student?.noHpOrangTua || '');

  // Biodata States
  const [namaArab, setNamaArab] = useState(student?.namaArab || '');
  const [tempatLahir, setTempatLahir] = useState(student?.tempatLahir || '');
  const [tanggalLahir, setTanggalLahir] = useState(student?.tanggalLahir || '');
  const [gender, setGender] = useState<'L' | 'P' | ''>(student?.gender || '');
  const [alamat, setAlamat] = useState(student?.alamat || '');
  const [namaAyah, setNamaAyah] = useState(student?.namaAyah || '');
  const [namaIbu, setNamaIbu] = useState(student?.namaIbu || '');
  const [tanggalMasuk, setTanggalMasuk] = useState(student?.tanggalMasuk || '');
  const [foto, setFoto] = useState<string>(student?.foto || '');
  const [manualBgOverride, setManualBgOverride] = useState<'auto' | 'red' | 'blue'>('auto');

  // 2. Attendance States
  const [sakit, setSakit] = useState(student?.sakit !== undefined ? student.sakit : 0);
  const [izin, setIzin] = useState(student?.izin !== undefined ? student.izin : 0);
  const [alpa, setAlpa] = useState(student?.alpa !== undefined ? student.alpa : 0);
  const [catatan, setCatatan] = useState(student?.catatan || '');

  // 2.5. Kepribadian States
  const [akhlaq, setAkhlaq] = useState<'A' | 'B' | 'C' | 'D' | ''>(student?.akhlaq || 'B');
  const [kerajinan, setKerajinan] = useState<'A' | 'B' | 'C' | 'D' | ''>(student?.kerajinan || 'B');
  const [kedisiplinan, setKedisiplinan] = useState<'A' | 'B' | 'C' | 'D' | ''>(student?.kedisiplinan || 'B');
  const [kerapihan, setKerapihan] = useState<'A' | 'B' | 'C' | 'D' | ''>(student?.kerapihan || 'B');

  // 3. Dynamic Subject Grades state
  const [grades, setGrades] = useState<Record<number, number>>({});

  // Filter subjects assigned to the selected class
  const classSubjectIds = classSubjects
    .filter(cs => cs.kelas === kelas)
    .map(cs => cs.subjectId);

  // If there are no class subject mappings, use all subjects as fallback
  const activeSubjects = classSubjectIds.length > 0 
    ? subjects.filter(sub => classSubjectIds.includes(sub.id))
    : subjects;

  // Initialize grades from student if they match the active subjects
  useEffect(() => {
    const initialGrades: Record<number, number> = {};
    activeSubjects.forEach(sub => {
      // populate with student score or default to 0
      initialGrades[sub.id] = student?.grades?.[sub.id] !== undefined ? student.grades[sub.id] : 0;
    });
    setGrades(initialGrades);
  }, [kelas, student, subjects, classSubjects]);

  const handleGradeChange = (subjectId: number, value: number) => {
    // clamp between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));
    setGrades(prev => ({
      ...prev,
      [subjectId]: clampedValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !nis || !kelas) {
      alert("Harap lengkapi semua data identitas santri!");
      return;
    }

    onSave({
      id: student?.id, // keep id for edits
      nama,
      nis,
      kelas,
      semester,
      tahunAjaran,
      sakit: Number(sakit) || 0,
      izin: Number(izin) || 0,
      alpa: Number(alpa) || 0,
      catatan,
      grades,
      akhlaq,
      kerajinan,
      kedisiplinan,
      kerapihan,
      createdBy: student?.createdBy,
      noHpOrangTua,
      tempatLahir,
      tanggalLahir,
      gender,
      alamat,
      namaAyah,
      namaIbu,
      tanggalMasuk,
      foto,
      namaArab
    });
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">
            {student ? "Edit Data & Nilai Santri" : "Tambah Data & Nilai Santri Baru"}
          </h2>
          <p className="text-xs text-gray-500">
            {student ? `Mengubah rapor untuk ${student.nama}` : "Tambahkan santri baru ke kelas dan isi skor nilai per pelajaran."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Identity */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-gray-800 text-sm">
            <User size={16} className="text-emerald-700" />
            <h3>1. Identitas Santri</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap Santri</label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap santri..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Nomor Induk Santri (NIS)</label>
              <input
                type="text"
                required
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                placeholder="Contoh: 122301"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Pilih Kelas</label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {availableClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">No. WhatsApp Orang Tua (Untuk Notifikasi)</label>
              <input
                type="text"
                value={noHpOrangTua}
                onChange={(e) => setNoHpOrangTua(e.target.value.replace(/[^0-9+]/g, ''))}
                placeholder="Contoh: 628123456789 (Gunakan kode negara, tanpa spasi)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Tahun Ajaran</label>
                <input
                  type="text"
                  required
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  placeholder="Contoh: 2025/2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1.2: Biodata Tambahan & Pas Foto */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-gray-800 text-sm">
            <span className="text-emerald-700">📋</span>
            <h3>1.2. Biodata Tambahan & Pas Foto Santri (untuk Leger & Buku Induk)</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Column: Form Inputs */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase block">Nama Lengkap (Ditulis Arab)</label>
                <input
                  type="text"
                  value={namaArab}
                  onChange={(e) => setNamaArab(e.target.value)}
                  placeholder="Contoh: أحمد فوزي"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-base text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 text-right font-serif"
                  dir="rtl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase block">Jenis Kelamin</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'L' | 'P' | '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="">-- Pilih Jenis Kelamin --</option>
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase block">Tempat Lahir</label>
                <input
                  type="text"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  placeholder="Contoh: Surabaya"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase block">Tanggal Lahir</label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase block">Nama Ayah Kandung</label>
                <input
                  type="text"
                  value={namaAyah}
                  onChange={(e) => setNamaAyah(e.target.value)}
                  placeholder="Nama lengkap ayah..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase block">Nama Ibu Kandung</label>
                <input
                  type="text"
                  value={namaIbu}
                  onChange={(e) => setNamaIbu(e.target.value)}
                  placeholder="Nama lengkap ibu..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase block">Alamat Tinggal Lengkap</label>
                <textarea
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Nama jalan, RT/RW, Dusun, Desa, Kecamatan, Kabupaten/Kota..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase block">Tanggal Masuk Madrasah</label>
                <input
                  type="date"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Right Column: Photo Upload and Automatic Color Detection preview */}
            <div className="flex flex-col items-center bg-slate-50 p-6 rounded-xl border border-slate-200/80 space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pas Foto 3x4 Santri</span>
              
              {/* Photo Frame with calculated Background Color */}
              {(() => {
                let isRed = false;
                if (manualBgOverride === 'auto') {
                  if (tanggalLahir) {
                    const year = parseInt(tanggalLahir.split('-')[0]);
                    isRed = !isNaN(year) && year % 2 !== 0; // Odd year = Red, Even year = Blue
                  }
                } else {
                  isRed = manualBgOverride === 'red';
                }
                const bgStyle = isRed ? { backgroundColor: '#d92626' } : { backgroundColor: '#2652d9' };
                const bgName = isRed ? 'Merah (Tahun Ganjil)' : 'Biru (Tahun Genap)';

                return (
                  <div className="flex flex-col items-center space-y-4 w-full">
                    <div 
                      className="relative w-32 h-40 rounded-lg shadow-lg overflow-hidden border-4 border-white flex items-center justify-center transition-colors duration-300"
                      style={bgStyle}
                    >
                      {foto ? (
                        <img 
                          src={foto} 
                          alt="Pas Foto" 
                          className="w-full h-full object-cover relative z-10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-white/75 text-center p-3 z-0">
                          <span className="text-2xl mb-1">📷</span>
                          <span className="text-[10px] font-bold uppercase leading-tight">Belum Ada Foto</span>
                        </div>
                      )}
                      
                      {/* Grid overlay lines (typical in school photo editors) */}
                      <div className="absolute inset-0 border border-white/10 pointer-events-none z-20"></div>
                    </div>

                    <div className="text-center space-y-1">
                      <span className="text-[10px] bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-extrabold block">
                        Latar: {bgName}
                      </span>
                      {tanggalLahir && manualBgOverride === 'auto' && (
                        <span className="text-[9px] text-slate-500 block italic leading-none mt-1">
                          *Ditentukan otomatis dari tahun lahir: {tanggalLahir.split('-')[0]}
                        </span>
                      )}
                    </div>

                    {/* File Input */}
                    <div className="w-full">
                      <input 
                        type="file"
                        accept="image/*"
                        id="student-photo-file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFoto(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="student-photo-file"
                        className="w-full py-2 px-3 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-center cursor-pointer transition block shadow-sm"
                      >
                        {foto ? "Ganti Foto" : "Unggah Pas Foto"}
                      </label>
                      {foto && (
                        <button
                          type="button"
                          onClick={() => setFoto('')}
                          className="w-full mt-1.5 py-1 text-[10px] text-rose-600 hover:text-rose-700 font-bold text-center block transition"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    {/* Background Color Mode Override */}
                    <div className="w-full pt-3 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Opsi Warna Latar:</span>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => setManualBgOverride('auto')}
                          className={`py-1 text-[10px] font-bold rounded transition ${
                            manualBgOverride === 'auto' 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Auto
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualBgOverride('red')}
                          className={`py-1 text-[10px] font-bold rounded transition ${
                            manualBgOverride === 'red' 
                              ? 'bg-rose-600 text-white shadow-sm' 
                              : 'bg-white border border-slate-200 text-rose-600 hover:bg-slate-50'
                          }`}
                        >
                          Merah
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualBgOverride('blue')}
                          className={`py-1 text-[10px] font-bold rounded transition ${
                            manualBgOverride === 'blue' 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-white border border-slate-200 text-blue-600 hover:bg-slate-50'
                          }`}
                        >
                          Biru
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* SECTION 2: Grades */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
              <BookOpen size={16} className="text-emerald-700" />
              <h3>2. Nilai Mata Pelajaran ({kelas})</h3>
            </div>
            <span className="text-[10px] bg-slate-100 font-bold px-2.5 py-1 rounded text-slate-500 uppercase">
              {activeSubjects.length} Mata Pelajaran Aktif
            </span>
          </div>

          {activeSubjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {activeSubjects.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm">{sub.nameId}</p>
                    <p className="text-xs text-emerald-800 font-serif font-semibold" dir="rtl">{sub.nameAr}</p>
                    <span className="inline-block text-[10px] font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      KKM: {sub.kkm}
                    </span>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={grades[sub.id] !== undefined ? grades[sub.id] : 0}
                      onChange={(e) => handleGradeChange(sub.id, parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 text-center text-base font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-slate-400 italic">
              Belum ada mata pelajaran yang dikaitkan dengan kelas ini. Silakan atur di tab Mata Pelajaran.
            </div>
          )}
        </div>

        {/* SECTION 2.5: Kepribadian Santri */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-gray-800 text-sm">
            <span className="text-emerald-700">⭐</span>
            <h3>3. Perkembangan Kepribadian Santri (احوال الطالب)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase block">1. Akhlaq (اخلاق)</label>
              <select
                value={akhlaq}
                onChange={(e) => setAkhlaq(e.target.value as 'A' | 'B' | 'C' | 'D' | '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="">-</option>
                <option value="A">A - ممتاز (Sangat Baik)</option>
                <option value="B">B - جيد (Baik)</option>
                <option value="C">C - كافي (Cukup)</option>
                <option value="D">D - ناقص (Kurang)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase block">2. Kerajinan (مجتهد)</label>
              <select
                value={kerajinan}
                onChange={(e) => setKerajinan(e.target.value as 'A' | 'B' | 'C' | 'D' | '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="">-</option>
                <option value="A">A - ممتاز (Sangat Baik)</option>
                <option value="B">B - جيد (Baik)</option>
                <option value="C">C - كافي (Cukup)</option>
                <option value="D">D - ناقص (Kurang)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase block">3. Kedisiplinan (تأديب)</label>
              <select
                value={kedisiplinan}
                onChange={(e) => setKedisiplinan(e.target.value as 'A' | 'B' | 'C' | 'D' | '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="">-</option>
                <option value="A">A - ممتاز (Sangat Baik)</option>
                <option value="B">B - جيد (Baik)</option>
                <option value="C">C - كافي (Cukup)</option>
                <option value="D">D - ناقص (Kurang)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase block">4. Kerapihan (نظافة)</label>
              <select
                value={kerapihan}
                onChange={(e) => setKerapihan(e.target.value as 'A' | 'B' | 'C' | 'D' | '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="">-</option>
                <option value="A">A - ممتاز (Sangat Baik)</option>
                <option value="B">B - جيد (Baik)</option>
                <option value="C">C - كافي (Cukup)</option>
                <option value="D">D - ناقص (Kurang)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: Attendance & Catatan */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-gray-800 text-sm">
            <Clock size={16} className="text-emerald-700" />
            <h3>4. Kehadiran & Catatan Wali Kelas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase block">Sakit (Hari)</label>
              <input
                type="number"
                min="0"
                value={sakit}
                onChange={(e) => setSakit(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-center text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase block">Izin (Hari)</label>
              <input
                type="number"
                min="0"
                value={izin}
                onChange={(e) => setIzin(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-center text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase block">Alpa / Tanpa Keterangan (Hari)</label>
              <input
                type="number"
                min="0"
                value={alpa}
                onChange={(e) => setAlpa(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-center text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Catatan Wali Kelas</label>
              <HelpCircle size={12} className="text-slate-400" title="Komentar atau nasihat akademik santri" />
            </div>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Masukkan pesan, nasihat belajar, atau komentar khusus untuk santri ini..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm bg-white hover:bg-slate-50 transition active:scale-95"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition active:scale-95"
          >
            Simpan Data Raport
          </button>
        </div>
      </form>
    </div>
  );
}
