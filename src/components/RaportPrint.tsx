import { useState } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Student, Subject, SystemSettings, ClassTeacher, ClassSubject } from '../types';
import { terbilangArab, terbilangIndo } from '../utils/terbilang';
const defaultLogo = "/logo.svg";

const formatIndoDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10).toString();
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${day} ${months[monthIndex]} ${year}`;
  }
  return dateStr;
};

interface RaportPrintProps {
  studentIds: string[]; // Supports multiple student IDs for mass print
  students: Student[];
  subjects: Subject[];
  classSubjects: ClassSubject[];
  teachers: ClassTeacher[];
  settings: SystemSettings;
  onBack: () => void;
}

export default function RaportPrint({
  studentIds,
  students,
  subjects,
  classSubjects,
  teachers,
  settings,
  onBack
}: RaportPrintProps) {
  const [printMode, setPrintMode] = useState<'all' | 'cover' | 'biodata' | 'grades'>('all');
  const [showRanking, setShowRanking] = useState<boolean>(true);
  const [manualWriteRank, setManualWriteRank] = useState<boolean>(false);

  const toArabicDigits = (num: number | string): string => {
    const map: Record<string, string> = {
      '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
      '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
    };
    return String(num).split('').map(char => map[char] || char).join('');
  };

  const getPersonalityAr = (grade?: string) => {
    if (!grade) return '-';
    switch (grade.toUpperCase()) {
      case 'A': return 'ممتاز';
      case 'B': return 'جيد';
      case 'C': return 'كافي';
      case 'D': return 'ناقص';
      default: return '-';
    }
  };
  
  // Filter selected students
  const selectedStudents = students.filter(s => studentIds.includes(s.id));

  // Auto-trigger native print dialog
  const triggerNativePrint = () => {
    window.print();
  };

  const getWaliKelas = (className: string) => {
    const t = teachers.find(teach => teach.kelas === className);
    return t ? t.waliKelas : "Belum ditentukan";
  };

  return (
    <div className="bg-slate-100 min-h-screen pb-12 print:bg-white print:pb-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .page-break-cover {
            page-break-after: always;
            break-after: page;
            min-height: 275mm !important;
            height: 275mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .page-break-biodata {
            page-break-after: always;
            break-after: page;
            min-height: 275mm !important;
            height: 275mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .page-break-grade {
            page-break-after: always;
            break-after: page;
            min-height: auto !important;
            height: auto !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
        }
      `}} />
      
      {/* Top Floating Action Bar - Hidden during printing */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Panel</span>
          </button>
          <div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
              Mode Cetak Raport {selectedStudents.length > 1 ? 'Massal' : 'Tunggal'}
            </span>
            <h1 className="text-sm font-bold text-slate-800 mt-1">
              {selectedStudents.length > 1 
                ? `Mencetak ${selectedStudents.length} Raport Kelas ${selectedStudents[0]?.kelas}` 
                : `Laporan Hasil Belajar - ${selectedStudents[0]?.nama}`}
            </h1>
          </div>
        </div>

        {/* Print Option Selector */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setPrintMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              printMode === 'all'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lengkap (Sampul, Biodata, & Nilai)
          </button>
          <button
            onClick={() => setPrintMode('cover')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              printMode === 'cover'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hanya Sampul/Cover
          </button>
          <button
            onClick={() => setPrintMode('biodata')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              printMode === 'biodata'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hanya Biodata
          </button>
          <button
            onClick={() => setPrintMode('grades')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              printMode === 'grades'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hanya Nilai
          </button>
        </div>

        <button
          onClick={triggerNativePrint}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold px-6 py-2.5 rounded-lg shadow-md transition text-sm cursor-pointer"
        >
          <Printer size={16} />
          <span>Cetak Raport</span>
        </button>
      </div>

      {/* Options Sub-Bar - Hidden during printing */}
      <div className="bg-emerald-50/50 border-b border-emerald-100 px-6 py-3.5 flex flex-wrap items-center gap-6 print:hidden max-w-[800px] mx-auto rounded-xl shadow-sm mt-4">
        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
          <span>🏆</span> Opsi Cetak Peringkat:
        </span>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showRanking}
            onChange={(e) => setShowRanking(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span>Tampilkan Keterangan Peringkat di Rapor</span>
        </label>
        {showRanking && (
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={manualWriteRank}
              onChange={(e) => setManualWriteRank(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span>Input Manual Peringkat Setelah Di-print (Tulis Tangan Wali Kelas Menggunakan Pulpen)</span>
          </label>
        )}
      </div>

      {/* Main A4 Wrapper */}
      <div className="max-w-[800px] mx-auto space-y-12 py-8 px-4 sm:px-0 print:py-0 print:px-0 print:space-y-0">
        {selectedStudents.map((st, index) => {
          const waliKelas = getWaliKelas(st.kelas);

          // Build grade details
          const classSubjectIds = classSubjects
            .filter(cs => cs.kelas === st.kelas)
            .map(cs => cs.subjectId);
          const classActiveSubjects = classSubjectIds.length > 0
            ? subjects.filter(sub => classSubjectIds.includes(sub.id))
            : subjects;

          const subjectsCatA = classActiveSubjects.filter(sub => (sub.category || 'A') === 'A');
          const subjectsCatB = classActiveSubjects.filter(sub => sub.category === 'B');
          const subjectsCatC = classActiveSubjects.filter(sub => sub.category === 'C');

          let totalScore = 0;
          const buildGradeRow = (sub: Subject, indexInCategory: number) => {
            const score = st.grades[sub.id] !== undefined ? st.grades[sub.id] : 0;
            totalScore += score;
            return {
              no: indexInCategory + 1,
              nameId: sub.nameId,
              nameAr: sub.nameAr,
              kkm: sub.kkm,
              score,
              spelledId: terbilangIndo(score),
              spelledAr: terbilangArab(score)
            };
          };

          const gradesCatA = subjectsCatA.map((sub, i) => buildGradeRow(sub, i));
          const gradesCatB = subjectsCatB.map((sub, i) => buildGradeRow(sub, i));
          const gradesCatC = subjectsCatC.map((sub, i) => buildGradeRow(sub, i));

          const totalSubjectCount = classActiveSubjects.length;
          const averageScore = totalSubjectCount > 0 
            ? (totalScore / totalSubjectCount).toFixed(2) 
            : "0";

          const isCompact = totalSubjectCount > 7;
          const isUltraCompact = totalSubjectCount > 10;
          const cellCls = isUltraCompact 
            ? "p-1 print:py-[1px] print:px-0.5" 
            : isCompact 
              ? "p-1 print:py-0.5 print:px-1" 
              : "p-1 print:py-0.5 print:px-1";
          const footerCellCls = isUltraCompact 
            ? "p-1.5 print:py-[1px] print:px-0.5" 
            : isCompact 
              ? "p-1.5 print:py-0.5 print:px-1" 
              : "p-1.5 print:py-0.5 print:px-1";

          const sigHeightCls = isUltraCompact ? "h-32 print:h-32" : isCompact ? "h-36 print:h-36" : "h-44 print:h-44";
          const sigSpacerCls = isUltraCompact ? "h-16 print:h-16" : isCompact ? "h-20 print:h-20" : "h-28 print:h-28";
          const sigImgHeightCls = isUltraCompact ? "h-10 print:h-10" : isCompact ? "h-12 print:h-12" : "h-14 print:h-14";

          // Calculate class ranking for this student using the classActiveSubjects
          const classStudents = students.filter(s => s.kelas === st.kelas);
          const studentAvgs = classStudents.map(s => {
            const scores = classActiveSubjects.map(sub => s.grades[sub.id] !== undefined ? s.grades[sub.id] : 0);
            const total = scores.reduce((sum, score) => sum + score, 0);
            const avg = classActiveSubjects.length > 0 ? total / classActiveSubjects.length : 0;
            return {
              id: s.id,
              total,
              avg
            };
          });
          
          // Sort in descending order of average, then total score
          studentAvgs.sort((a, b) => b.avg - a.avg || b.total - a.total);
          const rankIndex = studentAvgs.findIndex(s => s.id === st.id);
          const rankInfo = {
            rank: rankIndex !== -1 ? rankIndex + 1 : 0,
            totalStudents: classStudents.length
          };

          return (
            <div key={st.id} className="space-y-12 print:space-y-0">
              
              {/* 1. COVER PAGE (SAMPUL) */}
              {(printMode === 'all' || printMode === 'cover') && (
                <div 
                  className="bg-white rounded-xl shadow-xl border border-slate-200 p-12 sm:p-16 font-sans text-black flex flex-col justify-between relative print:shadow-none print:border-none print:p-0 print:rounded-none page-break-cover"
                  style={{ minHeight: '297mm' }}
                >
                  <div className="flex flex-col items-center justify-between h-full py-6 text-center relative z-10">
                    
                    {/* Top Section: Header Title */}
                    <div className="text-center font-sans">
                      <p className="text-lg font-bold tracking-widest mb-1.5 text-slate-800">BUKU</p>
                      <p className="text-xl font-extrabold tracking-wide mb-1.5 text-slate-900 leading-snug">LAPORAN HASIL BELAJAR SANTRI</p>
                      <p className="text-xl font-extrabold tracking-wide text-slate-900">MADRASAH DINIYAH</p>
                    </div>

                    {/* Middle Section: Logo */}
                    <div className="my-6 flex justify-center">
                      <img src={settings.logoSekolah || defaultLogo} alt="Logo" className="h-44 w-44 object-contain" />
                    </div>

                    {/* Middle Section: Institution Info */}
                    <div className="text-center font-sans space-y-1.5 text-xs font-bold text-slate-900 leading-relaxed">
                      <p className="text-sm font-extrabold">PPTQ AL-HUSNA BUKIT RAJA WALI</p>
                      <p className="text-xs">MADRASAH DINIYAH</p>
                      <p className="text-xs">NSPP - 510018100040</p>
                      <p className="text-[11px] font-semibold text-slate-700 max-w-lg mx-auto leading-relaxed">
                        Jl. Lkr. Utara RT.05 RW.02, Podomoro, Pringsewu, Pringsewu, Lampung, 35373
                      </p>
                      <p className="text-[11px] font-semibold text-slate-700">
                        Telp. 081586873919, Alhusnabukitrajawali@gmail.com, pptqalhusna.sch.id
                      </p>
                    </div>

                    {/* Divider label */}
                    <div className="text-center font-sans mb-1 mt-6">
                      <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">NAMA SANTRI</p>
                    </div>

                    {/* Name Card Box */}
                    <div className="w-full max-w-md mx-auto border-[1.5px] border-slate-900 rounded-3xl py-3 px-6 flex flex-col items-center justify-center font-sans bg-white shadow-sm">
                      <div className="w-full border-t border-slate-300 my-1.5" />
                      <h4 className="text-xl font-black text-slate-900 tracking-wide py-1">{st.nama}</h4>
                      <div className="w-full border-t border-slate-300 my-1.5" />
                      <p className="text-xs font-bold text-slate-800 py-1 font-mono">Nomor Induk: {st.nis}</p>
                    </div>

                  </div>
                </div>
              )}

              {/* 1b. BIODATA PAGE */}
              {(printMode === 'all' || printMode === 'biodata') && (
                <div 
                  className="bg-white rounded-xl shadow-xl border border-slate-200 p-12 font-sans text-black flex flex-col justify-between relative print:shadow-none print:border-none print:p-0 print:rounded-none page-break-biodata"
                  style={{ minHeight: '297mm' }}
                >
                  <div className="flex flex-col justify-between h-full py-4 relative z-10">
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h2 className="text-lg font-extrabold tracking-wide uppercase text-slate-900">KETERANGAN TENTANG DIRI SANTRI</h2>
                    </div>

                    {/* Table of Biodata */}
                    <div className="w-full text-[13px] font-sans px-4 leading-relaxed flex-grow">
                      <table className="w-full border-collapse">
                        <tbody>
                          {/* 1 */}
                          <tr>
                            <td className="py-1.5 w-6 align-top font-semibold">1.</td>
                            <td className="py-1.5 w-56 align-top">Nama Santri (Lengkap)</td>
                            <td className="py-1.5 w-3 align-top">:</td>
                            <td className="py-1.5 align-top font-bold text-slate-900 uppercase">{st.nama}</td>
                          </tr>
                          {/* 2 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">2.</td>
                            <td className="py-1.5 align-top">Nomor Induk Santri</td>
                            <td className="py-1.5 align-top">:</td>
                            <td className="py-1.5 align-top font-semibold text-slate-800">{st.nis}</td>
                          </tr>
                          {/* 3 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">3.</td>
                            <td className="py-1.5 align-top">Jenis Kelamin</td>
                            <td className="py-1.5 align-top">:</td>
                            <td className="py-1.5 align-top text-slate-800">{st.gender === 'L' ? 'Laki-laki' : st.gender === 'P' ? 'Perempuan' : '-'}</td>
                          </tr>
                          {/* 4 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">4.</td>
                            <td className="py-1.5 align-top">Tempat & Tanggal Lahir</td>
                            <td className="py-1.5 align-top">:</td>
                            <td className="py-1.5 align-top text-slate-800">
                              {st.tempatLahir ? `${st.tempatLahir}, ` : ''}{formatIndoDate(st.tanggalLahir)}
                            </td>
                          </tr>
                          {/* 5 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">5.</td>
                            <td className="py-1.5 align-top">Agama</td>
                            <td className="py-1.5 align-top">:</td>
                            <td className="py-1.5 align-top text-slate-800">Islam</td>
                          </tr>
                          {/* 6 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">6.</td>
                            <td className="py-1.5 align-top">Status dalam Keluarga</td>
                            <td className="py-1.5 align-top">:</td>
                            <td className="py-1.5 align-top text-slate-800">Anak Kandung</td>
                          </tr>
                          {/* 7 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">7.</td>
                            <td className="py-1.5 align-top">Anak Ke-</td>
                            <td className="py-1.5 align-top">:</td>
                            <td className="py-1.5 align-top text-slate-800">-</td>
                          </tr>
                          {/* 8 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">8.</td>
                            <td className="py-1.5 align-top">Alamat Santri</td>
                            <td className="py-1.5 align-top">:</td>
                            <td className="py-1.5 align-top text-slate-800">{st.alamat || '-'}</td>
                          </tr>
                          
                          {/* 9 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">9.</td>
                            <td className="py-1.5 align-top" colSpan={3}>Diterima</td>
                          </tr>
                          <tr>
                            <td className="py-1 align-top"></td>
                            <td className="py-1 pl-6 align-top">a. Di Kelas</td>
                            <td className="py-1 align-top">:</td>
                            <td className="py-1 align-top text-slate-800">{st.kelas || '-'}</td>
                          </tr>
                          <tr>
                            <td className="py-1 align-top"></td>
                            <td className="py-1 pl-6 align-top">b. Pada Tanggal</td>
                            <td className="py-1 align-top">:</td>
                            <td className="py-1 align-top text-slate-800">{formatIndoDate(st.tanggalMasuk)}</td>
                          </tr>

                          {/* 10 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">10.</td>
                            <td className="py-1.5 align-top" colSpan={3}>Madrasah/Sekolah Asal</td>
                          </tr>
                          <tr>
                            <td className="py-1 align-top"></td>
                            <td className="py-1 pl-6 align-top">a. Nama Madrasah/Sekolah</td>
                            <td className="py-1 align-top">:</td>
                            <td className="py-1 align-top text-slate-800">-</td>
                          </tr>
                          <tr>
                            <td className="py-1 align-top"></td>
                            <td className="py-1 pl-6 align-top">b. Alamat</td>
                            <td className="py-1 align-top">:</td>
                            <td className="py-1 align-top text-slate-800">-</td>
                          </tr>

                          {/* 11 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">11.</td>
                            <td className="py-1.5 align-top" colSpan={3}>Nama Orang Tua</td>
                          </tr>
                          <tr>
                            <td className="py-1 align-top"></td>
                            <td className="py-1 pl-6 align-top">a. Ayah</td>
                            <td className="py-1 align-top">:</td>
                            <td className="py-1 align-top text-slate-800 font-semibold">{st.namaAyah || '-'}</td>
                          </tr>
                          <tr>
                            <td className="py-1 align-top"></td>
                            <td className="py-1 pl-6 align-top">b. Ibu</td>
                            <td className="py-1 align-top">:</td>
                            <td className="py-1 align-top text-slate-800 font-semibold">{st.namaIbu || '-'}</td>
                          </tr>

                          {/* Alamat Orang Tua */}
                          <tr>
                            <td className="py-1.5 align-top"></td>
                            <td className="py-1.5 pl-6 align-top">Alamat Orang Tua</td>
                            <td className="py-1.5 align-top">:</td>
                            <td className="py-1.5 align-top text-slate-800">{st.alamat || '-'}</td>
                          </tr>

                          {/* 12 */}
                          <tr>
                            <td className="py-1.5 align-top font-semibold">12.</td>
                            <td className="py-1.5 align-top" colSpan={3}>Pekerjaan Orang Tua</td>
                          </tr>
                          <tr>
                            <td className="py-1 align-top"></td>
                            <td className="py-1 pl-6 align-top">a. Ayah</td>
                            <td className="py-1 align-top">:</td>
                            <td className="py-1 align-top text-slate-800">-</td>
                          </tr>
                          <tr>
                            <td className="py-1 align-top"></td>
                            <td className="py-1 pl-6 align-top">b. Ibu</td>
                            <td className="py-1 align-top">:</td>
                            <td className="py-1 align-top text-slate-800">-</td>
                          </tr>

                          {/* No. Handphone */}
                          <tr>
                            <td className="py-1.5 align-top"></td>
                            <td className="py-1.5 pl-6 align-top">No. Handphone</td>
                            <td className="py-1.5 align-top">:</td>
                            <td className="py-1.5 align-top text-slate-800">{st.noHpOrangTua || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Area: Pas Foto and Signatures */}
                    <div className="flex justify-between items-end mt-10 px-4 print-avoid-break">
                      {/* Bottom Left: Pas Foto Box */}
                      <div className="w-24 h-32 border border-slate-400 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 relative">
                        {st.foto ? (
                          <img src={st.foto} alt="Foto Santri" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-center font-sans font-semibold">PAS FOTO<br />3 x 4</span>
                        )}
                      </div>

                      {/* Bottom Right: Signatures */}
                      <div className="flex gap-12 text-xs font-sans">
                        <div className="flex flex-col justify-between h-28 items-center text-center w-36">
                          <p className="font-semibold text-center">Kepala Madin</p>
                          <div className="h-12 flex items-center justify-center">
                            {settings.ttdKepala && (
                              <img src={settings.ttdKepala} alt="TTD Kepala" className="h-10 object-contain" />
                            )}
                          </div>
                          <p className="font-bold underline uppercase text-center">{settings.namaKepala}</p>
                        </div>
                        
                        <div className="flex flex-col justify-between h-28 items-center text-center w-36">
                          <p className="font-semibold text-center">Pengasuh PPTQ Al-Husna BR</p>
                          <div className="h-12 flex items-center justify-center">
                            {settings.ttdPengasuh && (
                              <img src={settings.ttdPengasuh} alt="TTD Pengasuh" className="h-10 object-contain" />
                            )}
                          </div>
                          <p className="font-bold underline uppercase text-center">{settings.namaPengasuh}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
              
              {/* 2. GRADE PAGE (NILAI) */}
              {(printMode === 'all' || printMode === 'grades') && (
                <div 
                  className="bg-white rounded-xl shadow-xl border border-slate-200 p-8 sm:p-12 font-serif text-black leading-normal print:shadow-none print:border-none print:p-0 print:rounded-none page-break-grade"
                  style={{ minHeight: '297mm' }} // Standard A4 height approximation
                >
                  
                  {/* KOP SURAT HEADER */}
                  <div className="text-center space-y-2">
                    {settings.kopSurat ? (
                      <div className={`w-full ${isUltraCompact ? 'mb-1 print:mb-0.5' : 'mb-3'}`}>
                        <img src={settings.kopSurat} alt="Kop Surat" className="w-full h-auto object-contain" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-6 pb-2">
                        <img src={settings.logoSekolah || defaultLogo} alt="Logo" className="h-16 w-16 object-contain" />
                        <div className="text-center">
                          <h2 className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Yayasan Pondok Pesantren Tahfidzul Qur'an</h2>
                          <h1 className="text-xl font-extrabold text-emerald-900 tracking-tight uppercase leading-tight">Madrasah Diniyah Al-Husna</h1>
                          <h3 className="text-xs font-bold tracking-widest text-amber-700 uppercase">PPTQ Al-Husna Bukit Raja Wali</h3>
                          <p className="text-[10px] text-gray-400 font-sans mt-0.5">Alamat: Komplek Pesantren Al-Husna, Bukit Raja Wali, Lampung, Indonesia</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Traditional Double Line Divider */}
                    <div className={`border-b-[3px] border-double border-black w-full ${isUltraCompact ? 'my-1 print:my-0.5' : 'my-2'}`} />
                  </div>

                  {/* RAPORT TITLE */}
                  <div className={`text-center ${isUltraCompact ? 'my-1 print:my-0' : 'my-2 print:my-0.5'}`}>
                    <h2 className="text-base font-bold underline decoration-double tracking-wide print:text-xs">
                      LAPORAN HASIL BELAJAR SANTRI / تقرير نتائج الدراسة
                    </h2>
                  </div>

                  {/* STUDENT BIODATA GRID */}
                  <div className={`grid grid-cols-2 gap-4 print:gap-2 ${isUltraCompact ? 'text-xs print:text-[8.5px] my-1 print:my-0.5' : isCompact ? 'text-xs print:text-[9px] my-2 print:my-1' : 'text-xs print:text-[10px] my-3 print:my-1'} font-sans border border-slate-100 p-3 print:p-0 rounded-lg bg-slate-50/50 print:bg-white print:border-none`}>
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-bold text-slate-500 w-28`}>Nama Santri</td>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-extrabold text-slate-950 uppercase`}>: {st.nama}</td>
                        </tr>
                        <tr>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-bold text-slate-500`}>NIS / رقم القid</td>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-semibold text-slate-800`}>: {st.nis}</td>
                        </tr>
                        <tr>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-bold text-slate-500`}>Tahun Ajaran</td>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-semibold text-slate-800`}>: {st.tahunAjaran}</td>
                        </tr>
                      </tbody>
                    </table>
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-bold text-slate-500 w-28`}>Jenjang Kelas</td>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-semibold text-slate-800`}>: {st.kelas}</td>
                        </tr>
                        <tr>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-bold text-slate-500`}>Semester</td>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-semibold text-slate-800`}>: {st.semester} / {st.semester === 'Ganjil' ? 'الفصل الأول' : 'الفصل الثاني'}</td>
                        </tr>
                        <tr>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-bold text-slate-500`}>Wali Kelas</td>
                          <td className={`py-1 ${isUltraCompact ? 'print:py-[1px]' : 'print:py-0.5'} font-semibold text-slate-800`}>: {waliKelas}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* GRADES TABLE */}
                  <div className={`overflow-x-auto ${isUltraCompact ? 'my-1.5 print:my-0.5' : isCompact ? 'my-2 print:my-1' : 'my-3 print:my-1'}`}>
                    <table className={`w-full text-[11px] ${isUltraCompact ? 'print:text-[8px]' : isCompact ? 'print:text-[9px]' : 'print:text-[9.5px]'} border border-black border-collapse text-center`}>
                      <thead>
                        <tr className="bg-slate-50 border border-black">
                          {/* LEFT HALF HEADER */}
                          <th className={`border-r border-black ${cellCls} w-6 font-bold`} colSpan={1} rowSpan={2}>No</th>
                          <th className={`border-r border-black ${cellCls} text-left w-48 font-bold`} rowSpan={2}>Mata Pelajaran</th>
                          <th className={`border-r border-black ${cellCls} font-bold w-48`} colSpan={2}>Hasil Tes / الدرجات العقلية</th>
                          
                          {/* RIGHT HALF HEADER */}
                          <th className={`border-r border-black ${cellCls} font-bold w-48`} colSpan={2}>الدرجات العقلية</th>
                          <th className={`border-r border-black ${cellCls} text-right w-48 font-serif font-bold`} rowSpan={2}>المواد الدراasiah</th>
                          <th className={`${cellCls} w-6 font-serif font-bold`} rowSpan={2}>رقم</th>
                        </tr>
                        <tr className="bg-slate-50 border border-black">
                          {/* Left subheaders */}
                          <th className={`border-r border-black ${cellCls} w-10 font-bold`}>Angka</th>
                          <th className={`border-r border-black ${cellCls} w-36 font-bold text-left`}>Huruf</th>
                          {/* Right subheaders */}
                          <th className={`border-r border-black ${cellCls} w-36 font-serif font-bold text-right`}>كتابة</th>
                          <th className={`border-r border-black ${cellCls} w-10 font-serif font-bold`}>رقما</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* CATEGORY A: TERTULIS */}
                        {gradesCatA.length > 0 && (
                          <>
                            <tr className="bg-slate-100/60 font-bold border-b border-black text-left">
                              <td className={`${cellCls} border-r border-black text-center font-extrabold text-slate-800`}>A</td>
                              <td className={`${cellCls} border-r border-black font-extrabold`} colSpan={3}>Tertulis</td>
                              <td className={`${cellCls} border-r border-black text-right font-serif font-extrabold`} colSpan={3}>التحريرية</td>
                              <td className={`${cellCls} text-center font-serif font-extrabold`}>أ</td>
                            </tr>
                            {gradesCatA.map(g => (
                              <tr key={`A-${g.no}`} className="border-b border-black hover:bg-slate-50/20">
                                <td className={`${cellCls} border-r border-black font-semibold text-slate-500 text-center`}>{g.no}</td>
                                <td className={`${cellCls} border-r border-black text-left font-bold text-slate-800`}>{g.nameId}</td>
                                <td className={`${cellCls} border-r border-black font-extrabold text-slate-900 text-center`}>{g.score}</td>
                                <td className={`${cellCls} border-r border-black text-left text-slate-500 font-medium italic`}>{g.spelledId}</td>
                                <td className={`${cellCls} border-r border-black text-right font-serif text-emerald-950 font-bold`} dir="rtl">{g.spelledAr}</td>
                                <td className={`${cellCls} border-r border-black font-serif text-emerald-950 font-bold text-center`}>{toArabicDigits(g.score)}</td>
                                <td className={`${cellCls} border-r border-black text-right font-serif font-bold text-emerald-950`} dir="rtl">{g.nameAr}</td>
                                <td className={`${cellCls} font-serif text-slate-500 font-bold text-center`}>{toArabicDigits(g.no)}</td>
                              </tr>
                            ))}
                          </>
                        )}

                        {/* CATEGORY B: HAFALAN / MEMBACA */}
                        {gradesCatB.length > 0 && (
                          <>
                            <tr className="bg-slate-100/60 font-bold border-b border-black text-left">
                              <td className={`${cellCls} border-r border-black text-center font-extrabold text-slate-800`}>B</td>
                              <td className={`${cellCls} border-r border-black font-extrabold`} colSpan={3}>Hafalan / Membaca</td>
                              <td className={`${cellCls} border-r border-black text-right font-serif font-extrabold`} colSpan={3}>الحفظ والقراءة</td>
                              <td className={`${cellCls} text-center font-serif font-extrabold`}>ب</td>
                            </tr>
                            {gradesCatB.map(g => (
                              <tr key={`B-${g.no}`} className="border-b border-black hover:bg-slate-50/20">
                                <td className={`${cellCls} border-r border-black font-semibold text-slate-500 text-center`}>{g.no}</td>
                                <td className={`${cellCls} border-r border-black text-left font-bold text-slate-800`}>{g.nameId}</td>
                                <td className={`${cellCls} border-r border-black font-extrabold text-slate-900 text-center`}>{g.score}</td>
                                <td className={`${cellCls} border-r border-black text-left text-slate-500 font-medium italic`}>{g.spelledId}</td>
                                <td className={`${cellCls} border-r border-black text-right font-serif text-emerald-950 font-bold`} dir="rtl">{g.spelledAr}</td>
                                <td className={`${cellCls} border-r border-black font-serif text-emerald-950 font-bold text-center`}>{toArabicDigits(g.score)}</td>
                                <td className={`${cellCls} border-r border-black text-right font-serif font-bold text-emerald-950`} dir="rtl">{g.nameAr}</td>
                                <td className={`${cellCls} font-serif text-slate-500 font-bold text-center`}>{toArabicDigits(g.no)}</td>
                              </tr>
                            ))}
                          </>
                        )}

                        {/* CATEGORY C: MENULIS */}
                        {gradesCatC.length > 0 && (
                          <>
                            <tr className="bg-slate-100/60 font-bold border-b border-black text-left">
                              <td className={`${cellCls} border-r border-black text-center font-extrabold text-slate-800`}>C</td>
                              <td className={`${cellCls} border-r border-black font-extrabold`} colSpan={3}>Menulis</td>
                              <td className={`${cellCls} border-r border-black text-right font-serif font-extrabold`} colSpan={3}>الكتابة</td>
                              <td className={`${cellCls} text-center font-serif font-extrabold`}>ج</td>
                            </tr>
                            {gradesCatC.map(g => (
                              <tr key={`C-${g.no}`} className="border-b border-black hover:bg-slate-50/20">
                                <td className={`${cellCls} border-r border-black font-semibold text-slate-500 text-center`}>{g.no}</td>
                                <td className={`${cellCls} border-r border-black text-left font-bold text-slate-800`}>{g.nameId}</td>
                                <td className={`${cellCls} border-r border-black font-extrabold text-slate-900 text-center`}>{g.score}</td>
                                <td className={`${cellCls} border-r border-black text-left text-slate-500 font-medium italic`}>{g.spelledId}</td>
                                <td className={`${cellCls} border-r border-black text-right font-serif text-emerald-950 font-bold`} dir="rtl">{g.spelledAr}</td>
                                <td className={`${cellCls} border-r border-black font-serif text-emerald-950 font-bold text-center`}>{toArabicDigits(g.score)}</td>
                                <td className={`${cellCls} border-r border-black text-right font-serif font-bold text-emerald-950`} dir="rtl">{g.nameAr}</td>
                                <td className={`${cellCls} font-serif text-slate-500 font-bold text-center`}>{toArabicDigits(g.no)}</td>
                              </tr>
                            ))}
                          </>
                        )}

                        {/* FOOTER ROW 1: JUMLAH */}
                        <tr className="border border-black font-bold bg-slate-50">
                          <td className={`${footerCellCls} border-r border-black text-center`}></td>
                          <td className={`${footerCellCls} border-r border-black text-left uppercase text-slate-900`}>Jumlah / الجملة</td>
                          <td className={`${footerCellCls} border-r border-black text-center font-extrabold text-slate-950 text-xs`}>{totalScore}</td>
                          <td className={`${footerCellCls} border-r border-black text-left text-[10px] font-normal italic text-slate-500`}>{terbilangIndo(totalScore)}</td>
                          <td className={`${footerCellCls} border-r border-black text-right font-serif text-[10px] font-bold text-emerald-950`} dir="rtl">{terbilangArab(totalScore)}</td>
                          <td className={`${footerCellCls} border-r border-black text-center font-serif font-bold text-emerald-950`}>{toArabicDigits(totalScore)}</td>
                          <td className={`${footerCellCls} border-r border-black text-right font-serif uppercase text-slate-900`}>الجملة</td>
                          <td className={`${footerCellCls} text-center font-serif`}></td>
                        </tr>

                        {/* FOOTER ROW 2: RATA-RATA */}
                        <tr className="border border-black font-bold bg-slate-50">
                          <td className={`${footerCellCls} border-r border-black text-center`}></td>
                          <td className={`${footerCellCls} border-r border-black text-left uppercase text-slate-900`}>Rata-rata / متوسط الدرجة</td>
                          <td className={`${footerCellCls} border-r border-black text-center font-extrabold text-slate-950 text-xs`}>{averageScore}</td>
                          <td className={`${footerCellCls} border-r border-black text-left text-[10px]`} colSpan={2}></td>
                          <td className={`${footerCellCls} border-r border-black text-center font-serif font-bold text-emerald-950`}>{toArabicDigits(Math.round(Number(averageScore)))}</td>
                          <td className={`${footerCellCls} border-r border-black text-right font-serif uppercase text-slate-900`}>متوسط الدرجة</td>
                          <td className={`${footerCellCls} text-center font-serif`}></td>
                        </tr>

                        {/* FOOTER ROW 3: PERINGKAT (DETERMINED BY USER TOGGLE) */}
                        {showRanking && (
                          <tr className="border border-black font-bold bg-slate-50">
                            <td className="p-1.5 border-r border-black text-center"></td>
                            <td className="p-1.5 border-r border-black text-left uppercase text-slate-900">Peringkat / الرتبة</td>
                            <td className="p-1.5 text-center font-sans font-bold text-[11px] py-2" colSpan={6}>
                              {manualWriteRank ? (
                                <span className="tracking-widest">
                                  Peringkat ke .................... dari .................... santri
                                </span>
                              ) : (
                                <span className="tracking-wide text-emerald-950">
                                  Peringkat ke {rankInfo.rank} dari {rankInfo.totalStudents} santri
                                </span>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ATTENDANCE & KEPRIBADIAN SIDE-BY-SIDE */}
                  <div className={`grid grid-cols-2 gap-4 print:gap-2 ${isUltraCompact ? 'my-1 print:my-0.5 text-[10px] print:text-[8px]' : isCompact ? 'my-2 print:my-1 text-[11px] print:text-[9px]' : 'my-3 print:my-1.5 text-[11px] print:text-[9.5px]'} font-sans print-avoid-break`}>
                    {/* 1. KEPRIBADIAN TABLE */}
                    <table className="w-full border border-black border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-black">
                          <th colSpan={3} className={`${cellCls} border-r border-black font-bold uppercase text-[9px] text-left`}>KEPRIBADIAN</th>
                          <th className={`${cellCls} font-serif font-bold uppercase text-[9px] text-right`}>احوال الطالب</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-black">
                          <td className={`${cellCls} border-r border-black font-semibold text-slate-800 text-left`}>1. Akhlaq</td>
                          <td className={`${cellCls} text-center font-extrabold text-slate-900`}>{st.akhlaq || 'B'}</td>
                          <td className={`${cellCls} border-r border-black font-serif text-emerald-950 text-right font-bold`} dir="rtl">{getPersonalityAr(st.akhlaq || 'B')}</td>
                          <td className={`${cellCls} font-serif font-semibold text-right text-emerald-950`} dir="rtl">اخلاق</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className={`${cellCls} border-r border-black font-semibold text-slate-800 text-left`}>2. Kerajinan</td>
                          <td className={`${cellCls} text-center font-extrabold text-slate-900`}>{st.kerajinan || 'B'}</td>
                          <td className={`${cellCls} border-r border-black font-serif text-emerald-950 text-right font-bold`} dir="rtl">{getPersonalityAr(st.kerajinan || 'B')}</td>
                          <td className={`${cellCls} font-serif font-semibold text-right text-emerald-950`} dir="rtl">مجتهد</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className={`${cellCls} border-r border-black font-semibold text-slate-800 text-left`}>3. Kedisiplinan</td>
                          <td className={`${cellCls} text-center font-extrabold text-slate-900`}>{st.kedisiplinan || 'B'}</td>
                          <td className={`${cellCls} border-r border-black font-serif text-emerald-950 text-right font-bold`} dir="rtl">{getPersonalityAr(st.kedisiplinan || 'B')}</td>
                          <td className={`${cellCls} font-serif font-semibold text-right text-emerald-950`} dir="rtl">تأديب</td>
                        </tr>
                        <tr>
                          <td className={`${cellCls} border-r border-black font-semibold text-slate-800 text-left`}>4. Kerapihan</td>
                          <td className={`${cellCls} text-center font-extrabold text-slate-900`}>{st.kerapihan || 'B'}</td>
                          <td className={`${cellCls} border-r border-black font-serif text-emerald-950 text-right font-bold`} dir="rtl">{getPersonalityAr(st.kerapihan || 'B')}</td>
                          <td className={`${cellCls} font-serif font-semibold text-right text-emerald-950`} dir="rtl">نظافة</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* 2. ABSENSI TABLE */}
                    <table className="w-full border border-black border-collapse text-center">
                      <thead>
                        <tr className="bg-slate-50 border-b border-black">
                          <th colSpan={3} className={`${cellCls} border-r border-black font-bold uppercase text-[9px] text-left`}>Absensi</th>
                          <th className={`${cellCls} font-serif font-bold uppercase text-[9px] text-right`}>كشف الغياب</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-black">
                          <td className={`${cellCls} border-r border-black font-semibold text-slate-800 text-left`}>Sakit</td>
                          <td className={`${cellCls} text-center font-extrabold text-slate-900`}>{st.sakit > 0 ? st.sakit : '-'}</td>
                          <td className={`${cellCls} text-center font-serif font-bold text-slate-700`}>{st.sakit > 0 ? toArabicDigits(st.sakit) : '-'}</td>
                          <td className={`${cellCls} font-serif font-semibold text-right text-emerald-950`} dir="rtl">بعذر</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className={`${cellCls} border-r border-black font-semibold text-slate-800 text-left`}>Izin</td>
                          <td className={`${cellCls} text-center font-extrabold text-slate-900`}>{st.izin > 0 ? st.izin : '-'}</td>
                          <td className={`${cellCls} text-center font-serif font-bold text-slate-700`}>{st.izin > 0 ? toArabicDigits(st.izin) : '-'}</td>
                          <td className={`${cellCls} font-serif font-semibold text-right text-emerald-950`} dir="rtl">بغير عذر</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className={`${cellCls} border-r border-black font-semibold text-slate-800 text-left`}>Alpa</td>
                          <td className={`${cellCls} text-center font-extrabold text-slate-900`}>{st.alpa > 0 ? st.alpa : '-'}</td>
                          <td className={`${cellCls} text-center font-serif font-bold text-slate-700`}>{st.alpa > 0 ? toArabicDigits(st.alpa) : '-'}</td>
                          <td className={`${cellCls} font-serif font-semibold text-right text-emerald-950`} dir="rtl">بغير بيان</td>
                        </tr>
                        <tr className="font-bold">
                          <td className={`${cellCls} border-r border-black text-slate-900 text-left uppercase`}>Jumlah</td>
                          <td className={`${cellCls} text-center font-extrabold text-slate-950`}>{(st.sakit + st.izin + st.alpa) > 0 ? (st.sakit + st.izin + st.alpa) : '-'}</td>
                          <td className={`${cellCls} text-center font-serif font-extrabold text-slate-950`}>{(st.sakit + st.izin + st.alpa) > 0 ? toArabicDigits(st.sakit + st.izin + st.alpa) : '-'}</td>
                          <td className={`${cellCls} font-serif font-bold text-right text-emerald-950`} dir="rtl">الجملة</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 3. CATATAN GURU */}
                  <div className={`border border-black p-2 print:p-1.5 ${isUltraCompact ? 'my-1 print:my-0.5 text-[10px] print:text-[8.5px]' : isCompact ? 'my-2 print:my-1 text-xs print:text-[9.5px]' : 'my-3 print:my-1.5 text-xs print:text-[10px]'} print-avoid-break`}>
                    <p className="font-extrabold text-slate-950 border-b border-black pb-1 print:pb-0.5 uppercase tracking-wider text-[10px] print:text-[9px] text-center">
                      CATATAN WALI KELAS
                    </p>
                    <p className={`text-center font-semibold italic ${isUltraCompact ? 'text-[10px] print:text-[8.5px] mt-0.5 print:mt-0' : isCompact ? 'text-xs print:text-[9px] mt-1 print:mt-0.5' : 'text-xs print:text-[10px] mt-1.5 print:mt-1'} min-h-[24px] print:min-h-0 text-slate-800 leading-relaxed`}>
                      "{st.catatan || 'Kurangi waktu bermain, tingkatkan lagi waktu belajarnya.'}"
                    </p>
                  </div>

                  {/* SIGNATURE GRID */}
                  <div className={`mt-6 ${isUltraCompact ? 'print:mt-8' : isCompact ? 'print:mt-12' : 'print:mt-16'} text-xs text-center font-sans print-avoid-break`}>
                    {/* TOP ROW: Orang Tua/Wali, Wali Kelas, Kepala Madin */}
                    <div className={`grid grid-cols-3 gap-4 ${isUltraCompact ? 'mb-4 print:mb-4' : isCompact ? 'mb-6 print:mb-6' : 'mb-8 print:mb-10'} items-start`}>
                      {/* Parent */}
                      <div className={`flex flex-col justify-between ${sigHeightCls} print-avoid-break`}>
                        <p className="font-semibold text-center">Orang Tua / Wali Santri</p>
                        <div className={`${sigSpacerCls} flex items-center justify-center`} />
                        <div className="border-b border-black w-32 mx-auto" />
                      </div>

                      {/* Wali Kelas */}
                      <div className={`flex flex-col justify-between ${sigHeightCls} print-avoid-break`}>
                        <p className="font-semibold text-center">Wali Kelas</p>
                        <div className={`${sigSpacerCls} flex items-center justify-center`} />
                        <p className="font-bold underline uppercase leading-tight text-center">{waliKelas}</p>
                      </div>

                      {/* Kepala Madin */}
                      <div className={`flex flex-col justify-between ${sigHeightCls} print-avoid-break`}>
                        <p className="font-semibold text-center">Kepala Madrasah Diniyah</p>
                        <div className={`${sigSpacerCls} flex items-center justify-center`}>
                          {settings.ttdKepala && (
                            <img src={settings.ttdKepala} alt="TTD Kepala" className={`${sigImgHeightCls} max-w-[100px] object-contain mx-auto`} />
                          )}
                        </div>
                        <p className="font-bold underline uppercase leading-tight text-center">{settings.namaKepala}</p>
                      </div>
                    </div>

                    {/* BOTTOM ROW: Pengasuh (Centered) */}
                    <div className={`flex flex-col items-center justify-between ${sigHeightCls} ${isUltraCompact ? 'mt-2 print:mt-8' : isCompact ? 'mt-3 print:mt-10' : 'mt-4 print:mt-12'} print-avoid-break`}>
                      <p className="font-semibold text-center">
                        Mengetahui,<br />
                        Pengasuh PPTQ Al-Husna BR
                      </p>
                      <div className={`${sigSpacerCls} flex items-center justify-center`}>
                        {settings.ttdPengasuh && (
                          <img src={settings.ttdPengasuh} alt="TTD Pengasuh" className={`${sigImgHeightCls} max-w-[100px] object-contain mx-auto`} />
                        )}
                      </div>
                      <p className="font-bold underline uppercase leading-tight text-center">{settings.namaPengasuh}</p>
                    </div>
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
