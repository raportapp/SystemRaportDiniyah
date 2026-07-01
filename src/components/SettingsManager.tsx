import React, { useState, useRef } from 'react';
import { Settings, Image, Trash2, Check, AlertCircle, Download, Upload } from 'lucide-react';
import { SystemSettings, Student, Subject, ClassSubject, ClassTeacher, UserAccount, SystemLog } from '../types';
import { compressBase64Image } from '../utils/imageCompressor';
import defaultLogo from '../assets/images/regenerated_image_1782476438450.png';

interface SettingsManagerProps {
  settings: SystemSettings;
  onSaveSettings: (updatedSettings: SystemSettings) => void;
  students: Student[];
  subjects: Subject[];
  classSubjects: ClassSubject[];
  teachers: ClassTeacher[];
  users: UserAccount[];
  logs: SystemLog[];
  onRestoreData: (backupData: any) => Promise<void>;
  onToggleLock: () => Promise<void>;
  onAdvanceSemester: (nextSettings: SystemSettings, enrollStudents: boolean) => Promise<void>;
  useCloudSync: boolean;
  onToggleCloudSync: (enabled: boolean) => void;
}

export default function SettingsManager({
  settings,
  onSaveSettings,
  students,
  subjects,
  classSubjects,
  teachers,
  users,
  logs,
  onRestoreData,
  onToggleLock,
  onAdvanceSemester,
  useCloudSync,
  onToggleCloudSync
}: SettingsManagerProps) {
  const [namaPengasuh, setNamaPengasuh] = useState(settings.namaPengasuh);
  const [namaKepala, setNamaKepala] = useState(settings.namaKepala);
  const [tempatRaport, setTempatRaport] = useState(settings.tempatRaport);
  const [tanggalRaport, setTanggalRaport] = useState(settings.tanggalRaport);
  const [tahunAjaran, setTahunAjaran] = useState(settings.tahunAjaran);
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(settings.semester);

  // Base64 file holders
  const [logoSekolah, setLogoSekolah] = useState(settings.logoSekolah || '');
  const [kopSurat, setKopSurat] = useState(settings.kopSurat || '');
  const [ttdPengasuh, setTtdPengasuh] = useState(settings.ttdPengasuh || '');
  const [ttdKepala, setTtdKepala] = useState(settings.ttdKepala || '');

  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Handle file reading to base64 with immediate optional background removal and compression
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (base64: string) => void,
    removeBg = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Harap unggah berkas gambar yang valid (PNG, JPG, atau WEBP)!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result as string;
      if (removeBg) {
        try {
          const processed = await compressBase64Image(base64String, 800, 600, 0.7, true);
          setter(processed);
        } catch (err) {
          console.error("Failed to process background removal:", err);
          setter(base64String);
        }
      } else {
        setter(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSaveSettings({
      namaPengasuh,
      namaKepala,
      tempatRaport,
      tanggalRaport,
      tahunAjaran,
      semester,
      logoSekolah,
      kopSurat,
      ttdPengasuh,
      ttdKepala
    });

    setFeedbackMsg("Pengaturan berhasil disimpan ke dalam sistem!");
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">⚙️</span>
          Pengaturan Lembaga, Logo & Tanda Tangan
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Atur data tahun ajaran aktif, kepala madrasah, kiai pengasuh, tanda tangan digital (TTD), serta kop surat resmi.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 font-bold text-sm flex items-center gap-2 shadow-sm animate-pulse">
          <Check size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Column 1: Identitas & Pejabat */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-extrabold text-sm text-emerald-900 uppercase tracking-wider pb-3 border-b">
              1. Identitas & Pejabat Lembaga
            </h3>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap & Gelar Pengasuh</label>
                <input
                  type="text"
                  required
                  value={namaPengasuh}
                  onChange={(e) => setNamaPengasuh(e.target.value)}
                  placeholder="Achmad Husain"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap & Gelar Kepala Madrasah</label>
                <input
                  type="text"
                  required
                  value={namaKepala}
                  onChange={(e) => setNamaKepala(e.target.value)}
                  placeholder="Ustadz Achmad Husain"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Tempat Penerbitan Raport</label>
                  <input
                    type="text"
                    required
                    value={tempatRaport}
                    onChange={(e) => setTempatRaport(e.target.value)}
                    placeholder="Pringsewu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Tanggal Penerbitan Raport</label>
                  <input
                    type="text"
                    required
                    value={tanggalRaport}
                    onChange={(e) => setTanggalRaport(e.target.value)}
                    placeholder="20 Juni 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Tahun Ajaran Aktif</label>
                  <input
                    type="text"
                    required
                    value={tahunAjaran}
                    onChange={(e) => setTahunAjaran(e.target.value)}
                    placeholder="Contoh: 2025/2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Logo, TTD, Kop uploads */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-extrabold text-sm text-emerald-900 uppercase tracking-wider pb-3 border-b">
              2. Upload KOP, Logo & Tanda Tangan Digital
            </h3>

            <div className="space-y-5 text-sm">
              
              {/* Logo upload */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase block">Logo Madrasah (PNG/JPG)</label>
                  {logoSekolah && (
                    <button
                      type="button"
                      onClick={() => setLogoSekolah('')}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 size={12} /> Hapus Logo
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setLogoSekolah, true)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {!logoSekolah && (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-150 shadow-sm">
                    <div className="h-12 w-12 rounded border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 flex-shrink-0">
                      <img src={defaultLogo} className="h-full w-full object-contain" alt="Default Logo" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-extrabold block">Menggunakan Logo Default</span>
                      <span className="text-[9px] text-slate-500 block">Sangat bersih & transparan (PNG)</span>
                    </div>
                  </div>
                )}
                {logoSekolah && (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-150 shadow-sm">
                    <div 
                      className="h-12 w-12 rounded border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 shadow-inner flex-shrink-0"
                      style={{
                        backgroundImage: 'conic-gradient(#f8fafc 0.25turn, #cbd5e1 0.25turn 0.5turn, #f8fafc 0.5turn 0.75turn, #cbd5e1 0.75turn)',
                        backgroundSize: '12px 12px'
                      }}
                    >
                      <img src={logoSekolah} className="h-full w-full object-contain" alt="Logo preview" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-extrabold block">Logo Aktif (Transparan)</span>
                      <span className="text-[9px] text-slate-500 block">Latar belakang putih telah dihapus otomatis</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const cleaned = await compressBase64Image(logoSekolah, 400, 400, 0.75, true);
                          setLogoSekolah(cleaned);
                        }}
                        className="mt-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 text-[9px] font-bold rounded shadow-sm transition active:scale-95 block"
                      >
                        Hapus Sisa Hitam / Frame Luar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Kop Surat upload */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block">KOP Surat Resmi (Gambar Banner)</label>
                    <p className="text-[9px] text-slate-400 mt-0.5">*Jika diunggah, teks header raport diganti banner KOP ini.</p>
                  </div>
                  {kopSurat && (
                    <button
                      type="button"
                      onClick={() => setKopSurat('')}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 size={12} /> Hapus KOP
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setKopSurat, false)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {kopSurat && (
                  <div className="space-y-1 p-2 bg-white rounded border border-slate-100">
                    <img src={kopSurat} className="h-16 w-full object-contain" alt="Kop preview" />
                    <span className="text-[10px] text-emerald-700 font-bold block text-center">Banner KOP Aktif</span>
                  </div>
                )}
              </div>

              {/* TTD Pengasuh */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase block">Tanda Tangan Pengasuh</label>
                  {ttdPengasuh && (
                    <button
                      type="button"
                      onClick={() => setTtdPengasuh('')}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 size={12} /> Hapus TTD
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setTtdPengasuh, true)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {ttdPengasuh && (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-150 shadow-sm">
                    <div 
                      className="h-12 w-24 rounded border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 shadow-inner flex-shrink-0"
                      style={{
                        backgroundImage: 'conic-gradient(#f8fafc 0.25turn, #cbd5e1 0.25turn 0.5turn, #f8fafc 0.5turn 0.75turn, #cbd5e1 0.75turn)',
                        backgroundSize: '12px 12px'
                      }}
                    >
                      <img src={ttdPengasuh} className="h-full w-full object-contain" alt="TTD Pengasuh preview" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-extrabold block">TTD Pengasuh Aktif (Transparan)</span>
                      <span className="text-[9px] text-slate-500 block">Latar belakang putih telah dihapus otomatis</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const cleaned = await compressBase64Image(ttdPengasuh, 400, 300, 0.7, true);
                          setTtdPengasuh(cleaned);
                        }}
                        className="mt-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 text-[9px] font-bold rounded shadow-sm transition active:scale-95 block"
                      >
                        Hapus Sisa Hitam / Frame Luar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* TTD Kepala */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase block">Tanda Tangan Kepala Madrasah</label>
                  {ttdKepala && (
                    <button
                      type="button"
                      onClick={() => setTtdKepala('')}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 size={12} /> Hapus TTD
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setTtdKepala, true)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {ttdKepala && (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-150 shadow-sm">
                    <div 
                      className="h-12 w-24 rounded border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 shadow-inner flex-shrink-0"
                      style={{
                        backgroundImage: 'conic-gradient(#f8fafc 0.25turn, #cbd5e1 0.25turn 0.5turn, #f8fafc 0.5turn 0.75turn, #cbd5e1 0.75turn)',
                        backgroundSize: '12px 12px'
                      }}
                    >
                      <img src={ttdKepala} className="h-full w-full object-contain" alt="TTD Kepala preview" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-extrabold block">TTD Kepala Aktif (Transparan)</span>
                      <span className="text-[9px] text-slate-500 block">Latar belakang putih telah dihapus otomatis</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const cleaned = await compressBase64Image(ttdKepala, 400, 300, 0.7, true);
                          setTtdKepala(cleaned);
                        }}
                        className="mt-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 text-[9px] font-bold rounded shadow-sm transition active:scale-95 block"
                      >
                        Hapus Sisa Hitam / Frame Luar
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Submit button bar */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            className="px-10 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-lg transition active:scale-95 text-sm"
          >
            Simpan Semua Pengaturan & Berkas
          </button>
        </div>
      </form>

      {/* SECTION 2.5: Kontrol Fase Nilai & Semester */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h3 className="font-extrabold text-sm text-emerald-900 uppercase tracking-wider pb-3 border-b flex items-center gap-2">
          <span>🔒</span> 2.5. Kontrol Fase Nilai & Semester (Fitur Khusus Admin)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {/* Card 1: Lock / Unlock Input Nilai */}
          <div className="space-y-4 p-5 bg-amber-50/20 rounded-xl border border-amber-100 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm ${
                  settings.nilaiRaportSelesai 
                    ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse'
                }`}>
                  {settings.nilaiRaportSelesai ? '🔒 Terkunci / Selesai' : '🔓 Terbuka / Pengisian'}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                Konfirmasi Selesai Input Nilai Raport
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gunakan tombol ini untuk menandai pengisian nilai semester <strong>{settings.semester}</strong> Tahun Ajaran <strong>{settings.tahunAjaran}</strong> telah selesai. Jika terkunci, Wali Kelas/Guru tidak diperbolehkan mengedit nilai atau santri lagi untuk mencegah perubahan tidak disengaja.
              </p>
            </div>
            
            <button
              type="button"
              onClick={async () => {
                const actionText = settings.nilaiRaportSelesai ? 'membuka kembali kunci' : 'mengunci';
                const confirmed = window.confirm(
                  `Apakah Anda yakin ingin ${actionText} input nilai untuk Semester ${settings.semester} TA ${settings.tahunAjaran}?\n\n` +
                  (settings.nilaiRaportSelesai 
                    ? 'Guru/Wali kelas akan dapat mengedit nilai dan data santri kembali.' 
                    : 'Semua hak edit guru/wali kelas akan dibekukan sementara.')
                );
                if (confirmed) {
                  await onToggleLock();
                  alert(`Berhasil ${settings.nilaiRaportSelesai ? 'membuka kunci' : 'mengunci'} input nilai.`);
                }
              }}
              className={`flex items-center justify-center gap-2 w-full px-4 py-3 font-extrabold rounded-lg shadow-sm transition active:scale-95 text-xs cursor-pointer ${
                settings.nilaiRaportSelesai
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-rose-700 hover:bg-rose-600 text-white'
              }`}
            >
              <span>{settings.nilaiRaportSelesai ? '🔓 Buka Kembali Hak Akses Edit Guru' : '🔒 Konfirmasi Selesai Input Nilai Raport'}</span>
            </button>
          </div>

          {/* Card 2: Advance to Next Semester */}
          <div className="space-y-4 p-5 bg-indigo-50/20 rounded-xl border border-indigo-100 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 shadow-sm">
                  🚀 Transisi Periode
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                Lanjut ke Semester / Tahun Ajaran Berikutnya
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pindahkan sistem ke semester berikutnya secara otomatis.
                {settings.semester === 'Ganjil' ? (
                  <span> Mengubah semester aktif dari <strong>Ganjil</strong> ke <strong>Genap</strong> untuk tahun ajaran aktif.</span>
                ) : (
                  <span> Mengubah semester aktif dari <strong>Genap</strong> ke <strong>Ganjil</strong> dan menaikkan tahun ajaran menjadi <strong>{(() => {
                    const parts = settings.tahunAjaran.split('/');
                    if (parts.length === 2) {
                      const y1 = parseInt(parts[0]);
                      const y2 = parseInt(parts[1]);
                      if (!isNaN(y1) && !isNaN(y2)) return `${y1 + 1}/${y2 + 1}`;
                    }
                    return 'berikutnya';
                  })()}</strong>.</span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                const currentSem = settings.semester;
                const currentTA = settings.tahunAjaran;
                
                let nextSem: 'Ganjil' | 'Genap' = 'Ganjil';
                let nextTA = currentTA;
                
                if (currentSem === 'Ganjil') {
                  nextSem = 'Genap';
                } else {
                  nextSem = 'Ganjil';
                  const parts = currentTA.split('/');
                  if (parts.length === 2) {
                    const y1 = parseInt(parts[0]);
                    const y2 = parseInt(parts[1]);
                    if (!isNaN(y1) && !isNaN(y2)) {
                      nextTA = `${y1 + 1}/${y2 + 1}`;
                    }
                  } else {
                    const match = currentTA.match(/\d{4}/);
                    if (match) {
                      const year = parseInt(match[0]);
                      nextTA = currentTA.replace(/\d{4}/, String(year + 1));
                    }
                  }
                }

                const confirmAdvance = window.confirm(
                  `PERINGATAN: Anda akan memindahkan sistem dari:\n` +
                  `• Semester: ${currentSem} TA ${currentTA}\n` +
                  `➔ Menjadi: Semester ${nextSem} TA ${nextTA}\n\n` +
                  `Apakah Anda yakin ingin melanjutkan transisi semester ini?`
                );

                if (!confirmAdvance) return;

                // Secondary question: copy active students?
                const activeCount = students.filter(s => s.semester === currentSem && s.tahunAjaran === currentTA).length;
                let enrollStudents = false;
                if (activeCount > 0) {
                  enrollStudents = window.confirm(
                    `Ditemukan ${activeCount} santri aktif di semester saat ini (${currentSem} - ${currentTA}).\n\n` +
                    `Apakah Anda ingin secara otomatis menyalin (mendaftarkan ulang) ke-${activeCount} santri ini ke semester baru (${nextSem} - ${nextTA})?\n\n` +
                    `• Nilai, absensi, dan catatan santri di semester baru akan dikosongkan terlebih dahulu.\n` +
                    `• Memilih "Cancel" akan memindahkan semester dengan daftar santri baru yang kosong.`
                  );
                }

                const updatedSettings: SystemSettings = {
                  ...settings,
                  semester: nextSem,
                  tahunAjaran: nextTA,
                  nilaiRaportSelesai: false // Unlock for new semester automatically!
                };

                await onAdvanceSemester(updatedSettings, enrollStudents);
                alert(`Sistem berhasil dialihkan ke Semester ${nextSem} Tahun Ajaran ${nextTA}!`);
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-700 hover:bg-indigo-650 text-white font-extrabold rounded-lg shadow-sm transition active:scale-95 text-xs cursor-pointer"
            >
              <span>➡️ Lanjut Ke Semester Berikutnya</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Sync Settings / Firebase Cloud Sync toggle */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h3 className="font-extrabold text-sm text-emerald-900 uppercase tracking-wider pb-3 border-b flex items-center gap-2">
          <span>☁️</span> Sinkronisasi Database Cloud (Firebase)
        </h3>
        
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm bg-white border-slate-250 text-slate-700">
                🌐 Konektivitas Sistem
              </span>
              <h4 className="font-bold text-slate-800 text-sm mt-2">
                Status Koneksi: {useCloudSync ? (
                  <span className="text-emerald-700 font-extrabold">● Mode Online (Sinkronisasi Firebase Aktif)</span>
                ) : (
                  <span className="text-slate-500 font-bold">○ Mode Offline (Penyimpanan Lokal Aktif)</span>
                )}
              </h4>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                {useCloudSync ? (
                  "Semua data disimpan secara aman ke Cloud Firestore Firebase. Guru lain dapat masuk dan mengedit data secara bersama-sama dalam waktu nyata."
                ) : (
                  "Semua data hanya disimpan di dalam browser web komputer ini (Local Storage). Aplikasi berjalan tanpa internet, bebas hambatan, dan sangat cepat, namun guru lain tidak dapat mengakses data Anda secara otomatis."
                )}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => onToggleCloudSync(!useCloudSync)}
              className={`px-5 py-2.5 rounded-lg text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer flex-shrink-0 ${
                useCloudSync 
                  ? "bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300" 
                  : "bg-emerald-700 hover:bg-emerald-600 text-white"
              }`}
            >
              {useCloudSync ? "📴 Alihkan ke Mode Offline" : "📶 Aktifkan Sinkronisasi Cloud (Online)"}
            </button>
          </div>
          
          {!useCloudSync && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
              <span className="text-base shrink-0">💡</span>
              <p className="leading-relaxed">
                <strong>Saran:</strong> Gunakan <strong>Mode Offline</strong> jika Anda belum mengaktifkan fitur <em>Anonymous Authentication</em> di Firebase Console Anda, atau jika Anda ingin menggunakan sistem raport ini sebagai sarana pencatatan pribadi tanpa internet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Backup & Restore */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h3 className="font-extrabold text-sm text-emerald-900 uppercase tracking-wider pb-3 border-b flex items-center gap-2">
          <span>💾</span> 3. Cadangkan & Pemulihan Basis Data (Backup & Restore)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {/* Column A: Download Backup */}
          <div className="space-y-4 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Download size={15} className="text-emerald-800" />
              Ekspor Cadangan (.json)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unduh salinan lengkap seluruh basis data (Data Santri, Nilai, Mata Pelajaran, Akun Wali Kelas, Log, dan Pengaturan Lembaga) ke komputer Anda. Amankan file ini untuk pemulihan darurat.
            </p>
            <button
              type="button"
              onClick={() => {
                const backupObj = {
                  app: "PPTQ Al-Husna Bukit Raja Wali - Raport",
                  backupDate: new Date().toISOString(),
                  version: "1.0",
                  data: {
                    students,
                    subjects,
                    classSubjects,
                    teachers,
                    settings,
                    users,
                    logs
                  }
                };
                const jsonStr = JSON.stringify(backupObj, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Backup_Raport_Al_Husna_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-lg shadow-sm transition active:scale-95 text-xs cursor-pointer"
            >
              <Download size={14} />
              <span>Unduh Cadangan Basis Data (.json)</span>
            </button>
          </div>

          {/* Column B: Restore Data */}
          <div className="space-y-4 p-4 bg-amber-50/40 rounded-xl border border-amber-150">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Upload size={15} className="text-amber-800" />
              Impor & Pulihkan Cadangan
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unggah file cadangan <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">.json</code> untuk memulihkan seluruh data sistem. <strong className="text-red-700 font-bold">Peringatan:</strong> Proses ini akan menimpa seluruh data yang saat ini ada di sistem dan database cloud!
            </p>
            
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = async () => {
                    try {
                      const parsed = JSON.parse(reader.result as string);
                      if (parsed.app !== "PPTQ Al-Husna Bukit Raja Wali - Raport") {
                        alert("File cadangan tidak cocok! Harap unggah file cadangan asli sistem Raport Al-Husna.");
                        return;
                      }

                      const studentCount = parsed.data?.students?.length || 0;
                      const userCount = parsed.data?.users?.length || 0;
                      const subjectCount = parsed.data?.subjects?.length || 0;

                      const confirmed = window.confirm(
                        `Berkas cadangan valid terdeteksi!\n\n` +
                        `• Jumlah Santri: ${studentCount}\n` +
                        `• Jumlah Guru: ${userCount}\n` +
                        `• Jumlah Mapel: ${subjectCount}\n` +
                        `• Tanggal Cadangan: ${new Date(parsed.backupDate).toLocaleString()}\n\n` +
                        `Apakah Anda yakin ingin memulihkan data ini? Semua data saat ini di local & cloud akan ditimpa total!`
                      );

                      if (confirmed) {
                        await onRestoreData(parsed);
                      }
                    } catch (err) {
                      alert("Gagal membaca berkas cadangan. Pastikan format berkas .json valid.");
                    }
                  };
                  reader.readAsText(file);
                }}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-150 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
