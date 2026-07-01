import { useState } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Student, Subject, SystemSettings, ClassTeacher, ClassSubject } from '../types';
import { terbilangArab, terbilangIndo } from '../utils/terbilang';
import defaultLogo from '../assets/images/regenerated_image_1782476438450.png';

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
  const [printMode, setPrintMode] = useState<'both' | 'cover' | 'grades'>('both');

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
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setPrintMode('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              printMode === 'both'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cover & Nilai
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
              {(printMode === 'both' || printMode === 'cover') && (
                <div 
                  className="bg-white rounded-xl shadow-xl border border-slate-200 p-12 sm:p-20 font-serif text-black flex flex-col justify-between relative print:shadow-none print:border-none print:p-0 print:rounded-none page-break"
                  style={{ minHeight: '297mm' }}
                >
                  {/* Decorative Frame */}
                  <div className="absolute inset-4 border-4 border-double border-emerald-900 pointer-events-none p-1">
                    <div className="border border-emerald-800 h-full w-full" />
                  </div>

                  <div className="flex flex-col items-center justify-between h-full py-8 text-center relative z-10">
                    {/* Top Section: Logo & Madrasah Name */}
                    <div className="space-y-4">
                      <div className="h-28 w-28 rounded-full bg-white flex items-center justify-center p-2 mx-auto shadow-md border border-slate-100">
                        <img src={settings.logoSekolah || defaultLogo} alt="Logo" className="h-full w-full object-contain" />
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase">LAPORAN HASIL BELAJAR</h2>
                        <h1 className="text-2xl font-black text-emerald-950 uppercase tracking-tight">MADRASAH DINIYAH AL-HUSNA</h1>
                        <p className="text-xs font-bold text-amber-700 tracking-wider uppercase">PPTQ AL-HUSNA BUKIT RAJA WALI</p>
                      </div>
                    </div>

                    {/* Middle Section: Cover Title */}
                    <div className="my-10 space-y-3">
                      <span className="text-amber-600 text-lg">❆ ❆ ❆</span>
                      <h3 className="text-3xl font-black tracking-widest text-emerald-900">R A P O R T</h3>
                      <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
                      <span className="text-amber-600 text-lg">❆ ❆ ❆</span>
                    </div>

                    {/* Middle Section: Student Information Box */}
                    <div className="w-full max-w-md border-2 border-emerald-900/60 rounded-2xl p-6 bg-emerald-50/10 space-y-4 text-left mx-auto">
                      <table className="w-full text-sm font-medium">
                        <tbody>
                          <tr className="border-b border-emerald-900/10">
                            <td className="py-2.5 text-slate-500 font-bold w-36 uppercase text-xs">NAMA SANTRI</td>
                            <td className="py-2.5 font-black text-emerald-950 uppercase">: {st.nama}</td>
                          </tr>
                          <tr className="border-b border-emerald-900/10">
                            <td className="py-2.5 text-slate-500 font-bold uppercase text-xs">NIS / NO. INDUK</td>
                            <td className="py-2.5 font-bold text-slate-800">: {st.nis}</td>
                          </tr>
                          <tr className="border-b border-emerald-900/10">
                            <td className="py-2.5 text-slate-500 font-bold uppercase text-xs">JENJANG KELAS</td>
                            <td className="py-2.5 font-bold text-slate-800">: {st.kelas}</td>
                          </tr>
                          <tr className="border-b border-emerald-900/10">
                            <td className="py-2.5 text-slate-500 font-bold uppercase text-xs">SEMESTER</td>
                            <td className="py-2.5 font-bold text-slate-800">: {st.semester}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 text-slate-500 font-bold uppercase text-xs">TAHUN PELAJARAN</td>
                            <td className="py-2.5 font-bold text-slate-800">: {st.tahunAjaran}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Section: Address Info */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 uppercase">YAYASAN PONDOK PESANTREN TAHFIDZUL QUR'AN AL-HUSNA</p>
                      <p className="text-[10px] text-slate-500 max-w-md mx-auto">
                        Komplek Pesantren Al-Husna, Bukit Raja Wali, Lampung, Indonesia
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 2. GRADE PAGE (NILAI) */}
              {(printMode === 'both' || printMode === 'grades') && (
                <div 
                  className="bg-white rounded-xl shadow-xl border border-slate-200 p-8 sm:p-12 font-serif text-black leading-normal print:shadow-none print:border-none print:p-0 print:rounded-none page-break"
                  style={{ minHeight: '297mm' }} // Standard A4 height approximation
                >
                  
                  {/* KOP SURAT HEADER */}
                  <div className="text-center space-y-2">
                    {settings.kopSurat ? (
                      <div className="w-full mb-3">
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
                    <div className="border-b-[3px] border-double border-black w-full my-2" />
                  </div>

                  {/* RAPORT TITLE */}
                  <div className="text-center my-4">
                    <span className="inline-block bg-emerald-700 text-white font-sans font-bold text-xs px-3.5 py-1 rounded-full mb-2 print:hidden">
                      ★ Peringkat ke-{rankInfo.rank} dari {rankInfo.totalStudents} Santri di Kelas
                    </span>
                    <h2 className="text-base font-bold underline decoration-double tracking-wide">
                      LAPORAN HASIL BELAJAR SANTRI / تقرير نتائج الدراسة
                    </h2>
                  </div>

                  {/* STUDENT BIODATA GRID */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-sans my-4 border border-slate-100 p-3 rounded-lg bg-slate-50/50 print:bg-white print:border-none print:p-0">
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="py-1 font-bold text-slate-500 w-28">Nama Santri</td>
                          <td className="py-1 font-extrabold text-slate-950 uppercase">: {st.nama}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold text-slate-500">NIS / رقم القid</td>
                          <td className="py-1 font-semibold text-slate-800">: {st.nis}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold text-slate-500">Tahun Ajaran</td>
                          <td className="py-1 font-semibold text-slate-800">: {st.tahunAjaran}</td>
                        </tr>
                      </tbody>
                    </table>
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="py-1 font-bold text-slate-500 w-28">Jenjang Kelas</td>
                          <td className="py-1 font-semibold text-slate-800">: {st.kelas}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold text-slate-500">Semester</td>
                          <td className="py-1 font-semibold text-slate-800">: {st.semester} / {st.semester === 'Ganjil' ? 'الفصل الأول' : 'الفصل الثاني'}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold text-slate-500">Wali Kelas</td>
                          <td className="py-1 font-semibold text-slate-800">: {waliKelas}</td>
                        </tr>
                        <tr className="border-t border-slate-200/60 font-bold text-emerald-900 bg-emerald-50/20 print:bg-transparent">
                          <td className="py-1 font-bold">Peringkat Kelas</td>
                          <td className="py-1 font-extrabold text-emerald-950">: Ke-{rankInfo.rank} dari {rankInfo.totalStudents} Santri</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* GRADES TABLE */}
                  <div className="overflow-x-auto my-4">
                    <table className="w-full text-[11px] border border-black border-collapse text-center">
                      <thead>
                        <tr className="bg-slate-50 border border-black">
                          {/* LEFT HALF HEADER */}
                          <th className="border-r border-black p-1 w-6 font-bold" colSpan={1} rowSpan={2}>No</th>
                          <th className="border-r border-black p-1 text-left w-48 font-bold" rowSpan={2}>Mata Pelajaran</th>
                          <th className="border-r border-black p-1 font-bold w-48" colSpan={2}>Hasil Tes / الدرجات العقلية</th>
                          
                          {/* RIGHT HALF HEADER */}
                          <th className="border-r border-black p-1 font-bold w-48" colSpan={2}>الدرجات العقلية</th>
                          <th className="border-r border-black p-1 text-right w-48 font-serif font-bold" rowSpan={2}>المواد الدراسية</th>
                          <th className="p-1 w-6 font-serif font-bold" rowSpan={2}>رقم</th>
                        </tr>
                        <tr className="bg-slate-50 border border-black">
                          {/* Left subheaders */}
                          <th className="border-r border-black p-0.5 w-10 font-bold">Angka</th>
                          <th className="border-r border-black p-0.5 w-36 font-bold text-left">Huruf</th>
                          {/* Right subheaders */}
                          <th className="border-r border-black p-0.5 w-36 font-serif font-bold text-right">كتابة</th>
                          <th className="border-r border-black p-0.5 w-10 font-serif font-bold">رقما</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* CATEGORY A: TERTULIS */}
                        {gradesCatA.length > 0 && (
                          <>
                            <tr className="bg-slate-100/60 font-bold border-b border-black text-left">
                              <td className="p-1 border-r border-black text-center font-extrabold text-slate-800">A</td>
                              <td className="p-1 border-r border-black font-extrabold" colSpan={3}>Tertulis</td>
                              <td className="p-1 border-r border-black text-right font-serif font-extrabold" colSpan={3}>التحريرية</td>
                              <td className="p-1 text-center font-serif font-extrabold">أ</td>
                            </tr>
                            {gradesCatA.map(g => (
                              <tr key={`A-${g.no}`} className="border-b border-black hover:bg-slate-50/20">
                                <td className="p-1 border-r border-black font-semibold text-slate-500 text-center">{g.no}</td>
                                <td className="p-1 border-r border-black text-left font-bold text-slate-800">{g.nameId}</td>
                                <td className="p-1 border-r border-black font-extrabold text-slate-900 text-center">{g.score}</td>
                                <td className="p-1 border-r border-black text-left text-slate-500 font-medium italic">{g.spelledId}</td>
                                <td className="p-1 border-r border-black text-right font-serif text-emerald-950 font-bold" dir="rtl">{g.spelledAr}</td>
                                <td className="p-1 border-r border-black font-serif text-emerald-950 font-bold text-center">{toArabicDigits(g.score)}</td>
                                <td className="p-1 border-r border-black text-right font-serif font-bold text-emerald-950" dir="rtl">{g.nameAr}</td>
                                <td className="p-1 font-serif text-slate-500 font-bold text-center">{toArabicDigits(g.no)}</td>
                              </tr>
                            ))}
                          </>
                        )}

                        {/* CATEGORY B: HAFALAN / MEMBACA */}
                        {gradesCatB.length > 0 && (
                          <>
                            <tr className="bg-slate-100/60 font-bold border-b border-black text-left">
                              <td className="p-1 border-r border-black text-center font-extrabold text-slate-800">B</td>
                              <td className="p-1 border-r border-black font-extrabold" colSpan={3}>Hafalan / Membaca</td>
                              <td className="p-1 border-r border-black text-right font-serif font-extrabold" colSpan={3}>الحفظ والقراءة</td>
                              <td className="p-1 text-center font-serif font-extrabold">ب</td>
                            </tr>
                            {gradesCatB.map(g => (
                              <tr key={`B-${g.no}`} className="border-b border-black hover:bg-slate-50/20">
                                <td className="p-1 border-r border-black font-semibold text-slate-500 text-center">{g.no}</td>
                                <td className="p-1 border-r border-black text-left font-bold text-slate-800">{g.nameId}</td>
                                <td className="p-1 border-r border-black font-extrabold text-slate-900 text-center">{g.score}</td>
                                <td className="p-1 border-r border-black text-left text-slate-500 font-medium italic">{g.spelledId}</td>
                                <td className="p-1 border-r border-black text-right font-serif text-emerald-950 font-bold" dir="rtl">{g.spelledAr}</td>
                                <td className="p-1 border-r border-black font-serif text-emerald-950 font-bold text-center">{toArabicDigits(g.score)}</td>
                                <td className="p-1 border-r border-black text-right font-serif font-bold text-emerald-950" dir="rtl">{g.nameAr}</td>
                                <td className="p-1 font-serif text-slate-500 font-bold text-center">{toArabicDigits(g.no)}</td>
                              </tr>
                            ))}
                          </>
                        )}

                        {/* CATEGORY C: MENULIS */}
                        {gradesCatC.length > 0 && (
                          <>
                            <tr className="bg-slate-100/60 font-bold border-b border-black text-left">
                              <td className="p-1 border-r border-black text-center font-extrabold text-slate-800">C</td>
                              <td className="p-1 border-r border-black font-extrabold" colSpan={3}>Menulis</td>
                              <td className="p-1 border-r border-black text-right font-serif font-extrabold" colSpan={3}>الكتابة</td>
                              <td className="p-1 text-center font-serif font-extrabold">ج</td>
                            </tr>
                            {gradesCatC.map(g => (
                              <tr key={`C-${g.no}`} className="border-b border-black hover:bg-slate-50/20">
                                <td className="p-1 border-r border-black font-semibold text-slate-500 text-center">{g.no}</td>
                                <td className="p-1 border-r border-black text-left font-bold text-slate-800">{g.nameId}</td>
                                <td className="p-1 border-r border-black font-extrabold text-slate-900 text-center">{g.score}</td>
                                <td className="p-1 border-r border-black text-left text-slate-500 font-medium italic">{g.spelledId}</td>
                                <td className="p-1 border-r border-black text-right font-serif text-emerald-950 font-bold" dir="rtl">{g.spelledAr}</td>
                                <td className="p-1 border-r border-black font-serif text-emerald-950 font-bold text-center">{toArabicDigits(g.score)}</td>
                                <td className="p-1 border-r border-black text-right font-serif font-bold text-emerald-950" dir="rtl">{g.nameAr}</td>
                                <td className="p-1 font-serif text-slate-500 font-bold text-center">{toArabicDigits(g.no)}</td>
                              </tr>
                            ))}
                          </>
                        )}

                        {/* FOOTER ROW 1: JUMLAH */}
                        <tr className="border border-black font-bold bg-slate-50">
                          <td className="p-1.5 border-r border-black text-center"></td>
                          <td className="p-1.5 border-r border-black text-left uppercase text-slate-900">Jumlah / الجملة</td>
                          <td className="p-1.5 border-r border-black text-center font-extrabold text-slate-950 text-xs">{totalScore}</td>
                          <td className="p-1.5 border-r border-black text-left text-[10px] font-normal italic text-slate-500">{terbilangIndo(totalScore)}</td>
                          <td className="p-1.5 border-r border-black text-right font-serif text-[10px] font-bold text-emerald-950" dir="rtl">{terbilangArab(totalScore)}</td>
                          <td className="p-1.5 border-r border-black text-center font-serif font-bold text-emerald-950">{toArabicDigits(totalScore)}</td>
                          <td className="p-1.5 border-r border-black text-right font-serif uppercase text-slate-900">الجملة</td>
                          <td className="p-1.5 text-center font-serif"></td>
                        </tr>

                        {/* FOOTER ROW 2: RATA-RATA */}
                        <tr className="border border-black font-bold bg-slate-50">
                          <td className="p-1.5 border-r border-black text-center"></td>
                          <td className="p-1.5 border-r border-black text-left uppercase text-slate-900">Rata-rata / متوسط الدرجة</td>
                          <td className="p-1.5 border-r border-black text-center font-extrabold text-slate-950 text-xs">{averageScore}</td>
                          <td className="p-1.5 border-r border-black text-left text-[10px]" colSpan={2}></td>
                          <td className="p-1.5 border-r border-black text-center font-serif font-bold text-emerald-950">{toArabicDigits(Math.round(Number(averageScore)))}</td>
                          <td className="p-1.5 border-r border-black text-right font-serif uppercase text-slate-900">متوسط الدرجة</td>
                          <td className="p-1.5 text-center font-serif"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* ATTENDANCE & KEPRIBADIAN SIDE-BY-SIDE */}
                  <div className="grid grid-cols-2 gap-4 my-4 text-[11px] font-sans">
                    {/* 1. KEPRIBADIAN TABLE */}
                    <table className="w-full border border-black border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-black">
                          <th colSpan={3} className="p-1 border-r border-black font-bold uppercase text-[9px] text-left">KEPRIBADIAN</th>
                          <th className="p-1 font-serif font-bold uppercase text-[9px] text-right">احوال الطالب</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-1 border-r border-black font-semibold text-slate-800 text-left">1. Akhlaq</td>
                          <td className="p-1 border-r border-black text-center font-extrabold text-slate-900">{st.akhlaq || 'B'}</td>
                          <td className="p-1 border-r border-black font-serif text-emerald-950 text-right font-bold" dir="rtl">{getPersonalityAr(st.akhlaq)}</td>
                          <td className="p-1 font-serif font-semibold text-right text-emerald-950" dir="rtl">اخلاق</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 border-r border-black font-semibold text-slate-800 text-left">2. Kerajinan</td>
                          <td className="p-1 border-r border-black text-center font-extrabold text-slate-900">{st.kerajinan || 'B'}</td>
                          <td className="p-1 border-r border-black font-serif text-emerald-950 text-right font-bold" dir="rtl">{getPersonalityAr(st.kerajinan)}</td>
                          <td className="p-1 font-serif font-semibold text-right text-emerald-950" dir="rtl">مجتهد</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 border-r border-black font-semibold text-slate-800 text-left">3. Kedisiplinan</td>
                          <td className="p-1 border-r border-black text-center font-extrabold text-slate-900">{st.kedisiplinan || 'B'}</td>
                          <td className="p-1 border-r border-black font-serif text-emerald-950 text-right font-bold" dir="rtl">{getPersonalityAr(st.kedisiplinan)}</td>
                          <td className="p-1 font-serif font-semibold text-right text-emerald-950" dir="rtl">تأديب</td>
                        </tr>
                        <tr>
                          <td className="p-1 border-r border-black font-semibold text-slate-800 text-left">4. Kerapihan</td>
                          <td className="p-1 border-r border-black text-center font-extrabold text-slate-900">{st.kerapihan || 'B'}</td>
                          <td className="p-1 border-r border-black font-serif text-emerald-950 text-right font-bold" dir="rtl">{getPersonalityAr(st.kerapihan)}</td>
                          <td className="p-1 font-serif font-semibold text-right text-emerald-950" dir="rtl">نظافة</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* 2. ABSENSI TABLE */}
                    <table className="w-full border border-black border-collapse text-center">
                      <thead>
                        <tr className="bg-slate-50 border-b border-black">
                          <th colSpan={3} className="p-1 border-r border-black font-bold uppercase text-[9px] text-left">Absensi</th>
                          <th className="p-1 font-serif font-bold uppercase text-[9px] text-right">كشف الغياب</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-1 border-r border-black font-semibold text-slate-800 text-left">Sakit</td>
                          <td className="p-1 border-r border-black text-center font-extrabold text-slate-900">{st.sakit > 0 ? st.sakit : '-'}</td>
                          <td className="p-1 border-r border-black text-center font-serif font-bold text-slate-700">{st.sakit > 0 ? toArabicDigits(st.sakit) : '-'}</td>
                          <td className="p-1 font-serif font-semibold text-right text-emerald-950" dir="rtl">بعذر</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 border-r border-black font-semibold text-slate-800 text-left">Izin</td>
                          <td className="p-1 border-r border-black text-center font-extrabold text-slate-900">{st.izin > 0 ? st.izin : '-'}</td>
                          <td className="p-1 border-r border-black text-center font-serif font-bold text-slate-700">{st.izin > 0 ? toArabicDigits(st.izin) : '-'}</td>
                          <td className="p-1 font-serif font-semibold text-right text-emerald-950" dir="rtl">بغير عذر</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 border-r border-black font-semibold text-slate-800 text-left">Alpa</td>
                          <td className="p-1 border-r border-black text-center font-extrabold text-slate-900">{st.alpa > 0 ? st.alpa : '-'}</td>
                          <td className="p-1 border-r border-black text-center font-serif font-bold text-slate-700">{st.alpa > 0 ? toArabicDigits(st.alpa) : '-'}</td>
                          <td className="p-1 font-serif font-semibold text-right text-emerald-950" dir="rtl">بغير بيان</td>
                        </tr>
                        <tr className="font-bold">
                          <td className="p-1 border-r border-black text-slate-900 text-left uppercase">Jumlah</td>
                          <td className="p-1 border-r border-black text-center font-extrabold text-slate-950">{(st.sakit + st.izin + st.alpa) > 0 ? (st.sakit + st.izin + st.alpa) : '-'}</td>
                          <td className="p-1 border-r border-black text-center font-serif font-extrabold text-slate-950">{(st.sakit + st.izin + st.alpa) > 0 ? toArabicDigits(st.sakit + st.izin + st.alpa) : '-'}</td>
                          <td className="p-1 font-serif font-bold text-right text-emerald-950" dir="rtl">الجملة</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 3. CATATAN GURU */}
                  <div className="border border-black p-2 my-4 text-xs">
                    <p className="font-extrabold text-slate-950 border-b border-black pb-1 uppercase tracking-wider text-[10px] text-center">
                      CATATAN WALI KELAS
                    </p>
                    <p className="text-center font-semibold italic text-xs mt-1.5 min-h-[24px] text-slate-800 leading-relaxed">
                      "{st.catatan || 'Kurangi waktu bermain, tingkatkan lagi waktu belajarnya.'}"
                    </p>
                  </div>

                  {/* SIGNATURE GRID */}
                  <div className="mt-8 text-xs text-center font-sans">
                    {/* TOP ROW: Orang Tua/Wali, Wali Kelas, Kepala Madin */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {/* Parent */}
                      <div className="flex flex-col justify-between h-24">
                        <p className="font-semibold">Orang Tua / Wali Santri</p>
                        <div className="space-y-1">
                          <div className="border-b border-black w-24 mx-auto" />
                        </div>
                      </div>

                      {/* Wali Kelas */}
                      <div className="flex flex-col justify-between h-24">
                        <p className="font-semibold">Wali Kelas</p>
                        <div className="space-y-1">
                          <p className="font-bold underline uppercase">{waliKelas}</p>
                        </div>
                      </div>

                      {/* Kepala Madin */}
                      <div className="flex flex-col justify-between h-24">
                        <p className="font-semibold">Kepala Madrasah Diniyah</p>
                        <div className="space-y-1">
                          {settings.ttdKepala ? (
                            <img src={settings.ttdKepala} alt="TTD Kepala" className="h-10 max-w-[120px] object-contain mx-auto -mb-1" />
                          ) : (
                            <div className="h-4" />
                          )}
                          <p className="font-bold underline uppercase">{settings.namaKepala}</p>
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM ROW: Pengasuh (Centered) */}
                    <div className="flex flex-col items-center justify-between h-24 mt-4">
                      <p className="font-semibold text-center">
                        Mengetahui,<br />
                        Pengasuh PPTQ Al-Husna BR
                      </p>
                      <div className="space-y-1 text-center">
                        {settings.ttdPengasuh ? (
                          <img src={settings.ttdPengasuh} alt="TTD Pengasuh" className="h-10 max-w-[120px] object-contain mx-auto -mb-1" />
                        ) : (
                          <div className="h-4" />
                        )}
                        <p className="font-bold underline uppercase">{settings.namaPengasuh}</p>
                      </div>
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
