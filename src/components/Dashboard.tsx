import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, School, BookOpen, Award, FileText, Settings, UserPlus, 
  ListTodo, Activity, Info, Smartphone, Laptop, Copy, Check, 
  Download, Bookmark, Sparkles, Plus, X 
} from 'lucide-react';
import { Student, Subject, SystemLog, SystemSettings } from '../types';

interface DashboardProps {
  students: Student[];
  subjects: Subject[];
  logs: SystemLog[];
  settings: SystemSettings;
  onNavigate: (tab: string) => void;
  onSelectStudent: (id: string) => void;
  userRole?: string;
}

export default function Dashboard({
  students,
  subjects,
  logs,
  settings,
  onNavigate,
  onSelectStudent,
  userRole = 'teacher'
}: DashboardProps) {
  // Shortcut & PWA States
  const [activePlatformTab, setActivePlatformTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showShortcutGuide, setShowShortcutGuide] = useState(() => {
    return localStorage.getItem('hide_shortcut_guide') !== 'true';
  });
  const [selectedRankClass, setSelectedRankClass] = useState<string>('all');

  // Detect platform and setup PWA install event
  useEffect(() => {
    // Platform detection
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActivePlatformTab('ios');
    } else if (/android/.test(ua)) {
      setActivePlatformTab('android');
    } else {
      setActivePlatformTab('desktop');
    }

    // PWA Install handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.origin;
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  const handleDismissGuide = () => {
    setShowShortcutGuide(false);
    localStorage.setItem('hide_shortcut_guide', 'true');
  };

  const handleShowGuide = () => {
    setShowShortcutGuide(true);
    localStorage.removeItem('hide_shortcut_guide');
  };

  // Calculations based only on active semester and year
  const activeStudents = students.filter(st => 
    st.semester === settings.semester && st.tahunAjaran === settings.tahunAjaran
  );

  const totalSantri = activeStudents.length;
  
  const uniqueClasses = Array.from(new Set(activeStudents.map(s => s.kelas)));
  const totalKelas = uniqueClasses.length || 7; // fallback to default classes if empty

  const totalMapel = subjects.length;

  // Calculate overall average score
  let totalScoresSum = 0;
  let gradesCount = 0;
  activeStudents.forEach(st => {
    Object.values(st.grades).forEach(score => {
      totalScoresSum += score;
      gradesCount++;
    });
  });
  const overallAverage = gradesCount > 0 ? (totalScoresSum / gradesCount).toFixed(2) : "0";

  // Calculate KKM Failure list (remedial required)
  const remedialList: { studentId: string; studentName: string; class: string; subjectName: string; score: number; kkm: number; parentPhone?: string }[] = [];
  activeStudents.forEach(st => {
    subjects.forEach(sub => {
      const score = st.grades[sub.id];
      if (score !== undefined && score < sub.kkm) {
        remedialList.push({
          studentId: st.id,
          studentName: st.nama,
          class: st.kelas,
          subjectName: sub.nameId,
          score: score,
          kkm: sub.kkm,
          parentPhone: st.noHpOrangTua
        });
      }
    });
  });

  // Chart Data: Average score per class
  const classAvgData = uniqueClasses.map(clsName => {
    const classStudents = activeStudents.filter(s => s.kelas === clsName);
    let classScoreSum = 0;
    let classGradesCount = 0;
    classStudents.forEach(st => {
      Object.values(st.grades).forEach(score => {
        classScoreSum += score;
        classGradesCount++;
      });
    });
    const avg = classGradesCount > 0 ? Math.round((classScoreSum / classGradesCount) * 10) / 10 : 0;
    return {
      name: clsName,
      "Rata-rata": avg
    };
  }).filter(d => d.name);

  // Calculate student averages and rankings
  const allStudentRankings = activeStudents.map(st => {
    const scores = Object.values(st.grades);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      id: st.id,
      nama: st.nama,
      kelas: st.kelas,
      average: avg
    };
  });

  // Calculate ranks within each class
  const studentsWithClassRank = allStudentRankings.map(s => {
    const classStudents = allStudentRankings.filter(cs => cs.kelas === s.kelas);
    classStudents.sort((a, b) => b.average - a.average);
    const rankIndex = classStudents.findIndex(cs => cs.id === s.id);
    return {
      ...s,
      classRank: rankIndex !== -1 ? rankIndex + 1 : 1,
      totalInClass: classStudents.length
    };
  });

  // Sort overall by average
  const sortedOverall = [...studentsWithClassRank].sort((a, b) => b.average - a.average);

  // Filter rankings to display
  const studentRankings = selectedRankClass === 'all'
    ? sortedOverall.slice(0, 5) // top 5 overall
    : sortedOverall.filter(s => s.kelas === selectedRankClass); // all in class

  return (
    <div className="space-y-8">
      {settings.nilaiRaportSelesai && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 text-rose-800 rounded-xl shrink-0">
              <span className="text-lg">🔒</span>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-rose-950">Fase Pengisian Nilai Selesai / Terkunci</h4>
              <p className="text-xs text-rose-800 leading-relaxed mt-0.5">
                Administrator telah menutup penginputan nilai untuk Semester <strong>{settings.semester}</strong> Tahun Ajaran <strong>{settings.tahunAjaran}</strong>. Penambahan data santri, pengeditan nilai, dan penghapusan data dikunci sementara.
              </p>
            </div>
          </div>
          {userRole === 'admin' && (
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap shrink-0"
            >
              Ubah Status Kunci
            </button>
          )}
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-300 uppercase">
              Portal Akademik & Raport
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
              Madrasah Diniyah PPTQ Al-Husna
            </h1>
            <p className="text-emerald-100/80 max-w-xl text-sm leading-relaxed">
              Sistem manajemen terpadu untuk penilaian hasil belajar, kehadiran, cetak raport dual-bahasa, dan pengawasan progres hafalan santri secara akurat.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('students')}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold px-6 py-3 shadow-lg transition-all active:scale-95"
            >
              <ListTodo size={18} />
              <span>Kelola Santri</span>
            </button>
            {userRole === 'admin' && (
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 border border-white/20 backdrop-blur-sm transition-all"
              >
                <Settings size={18} />
                <span>Pengaturan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PWA / Shortcut Installation Guide */}
      {showShortcutGuide ? (
        <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-md overflow-hidden relative">
          {/* Header decoration */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />
          
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Sparkles size={24} className="text-emerald-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-emerald-950 tracking-tight">
                    Pasang Pintasan & Aplikasi (Shortcut / PWA)
                  </h3>
                  <p className="text-xs font-semibold text-gray-500">
                    Akses aplikasi raport ini secara instan langsung dari layar utama HP atau desktop Anda!
                  </p>
                </div>
              </div>
              <button 
                onClick={handleDismissGuide}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                title="Sembunyikan panduan"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column - Dynamic PWA Install or Quick Share */}
              <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl p-5 border border-emerald-100/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded-md inline-block">
                    Rekomendasi Utama
                  </span>
                  <h4 className="font-extrabold text-gray-800 text-sm">
                    {isInstallable ? "Instalasi Sekali Klik Tersedia!" : "Akses Cepat Melalui Tautan"}
                  </h4>
                  <p className="text-xs text-gray-505 leading-relaxed">
                    {isInstallable 
                      ? "Browser Anda mendukung instalasi langsung. Aplikasi akan dipasang di HP/Komputer Anda dan dapat dibuka tanpa koneksi browser manual!"
                      : "Salin link resmi ini untuk disimpan atau dibagikan ke guru-guru lain agar mudah masuk kembali kapan saja."}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {isInstallable && (
                    <button
                      onClick={handleInstallClick}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 px-4 shadow-md transition-all active:scale-95"
                    >
                      <Download size={18} />
                      <span>Pasang Aplikasi Sekarang</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopyLink}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-bold border transition-all ${
                      isCopied 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : 'bg-white hover:bg-gray-50 text-slate-700 border-gray-200 shadow-sm active:scale-95'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check size={18} className="text-emerald-600" />
                        <span>Tautan Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={18} className="text-gray-400" />
                        <span>Salin Link Aplikasi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column - Step-by-step Manual Guide based on OS */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                {/* Tabs */}
                <div className="flex border border-gray-100 bg-gray-50/50 p-1 rounded-xl">
                  <button
                    onClick={() => setActivePlatformTab('android')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                      activePlatformTab === 'android'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>Android</span>
                  </button>
                  <button
                    onClick={() => setActivePlatformTab('ios')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                      activePlatformTab === 'ios'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>iPhone / iOS</span>
                  </button>
                  <button
                    onClick={() => setActivePlatformTab('desktop')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                      activePlatformTab === 'desktop'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Laptop size={14} />
                    <span>Laptop / PC</span>
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 bg-slate-50/40 rounded-xl p-4 border border-gray-100 flex flex-col justify-center">
                  {activePlatformTab === 'android' && (
                    <div className="space-y-3.5 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                        <p className="text-gray-600 leading-relaxed">
                          Buka browser <strong className="text-gray-800 font-semibold">Google Chrome</strong> di HP Android Anda.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                        <p className="text-gray-600 leading-relaxed">
                          Ketuk ikon <strong className="text-gray-800 font-semibold">titik tiga (⋮)</strong> di pojok kanan atas browser.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                        <p className="text-gray-600 leading-relaxed">
                          Pilih menu <strong className="text-emerald-800 font-bold">"Tambahkan ke Layar Utama"</strong> (atau <strong className="text-emerald-800 font-bold">"Instal Aplikasi"</strong>).
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                        <p className="text-gray-600 leading-relaxed">
                          Ketuk <strong className="text-gray-800 font-semibold">"Tambah"</strong>. Shortcut aplikasi akan muncul di beranda HP Anda!
                        </p>
                      </div>
                    </div>
                  )}

                  {activePlatformTab === 'ios' && (
                    <div className="space-y-3.5 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                        <p className="text-gray-600 leading-relaxed">
                          Buka browser <strong className="text-gray-800 font-semibold">Safari</strong> di iPhone/iPad Anda dan masuk ke sistem raport ini.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                        <p className="text-gray-600 leading-relaxed">
                          Ketuk tombol <strong className="text-gray-800 font-semibold">Bagikan (Share icon)</strong> berupa ikon kotak dengan panah ke atas di bawah layar.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                        <p className="text-gray-600 leading-relaxed">
                          Gulir ke bawah dan ketuk pilihan <strong className="text-teal-800 font-bold">"Tambahkan ke Layar Utama"</strong> (Add to Home Screen).
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                        <p className="text-gray-600 leading-relaxed">
                          Beri nama <strong className="text-gray-800 font-semibold">"Raport Al-Husna"</strong> lalu ketuk <strong className="text-gray-800 font-semibold">"Tambah"</strong> di kanan atas!
                        </p>
                      </div>
                    </div>
                  )}

                  {activePlatformTab === 'desktop' && (
                    <div className="space-y-3.5 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                        <p className="text-gray-600 leading-relaxed">
                          Di komputer Anda (Chrome/Edge), lihat ke ujung kanan kolom alamat <strong className="text-gray-800 font-semibold">(Address Bar)</strong>.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                        <p className="text-gray-600 leading-relaxed">
                          Klik tombol <strong className="text-gray-800 font-semibold">Instal</strong> (ikon komputer dengan tanda panah ke bawah).
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                        <p className="text-gray-600 leading-relaxed">
                          Atau klik menu <strong className="text-gray-800 font-semibold">titik tiga (⋮)</strong> -&gt; <strong className="text-gray-800 font-semibold">Simpan dan bagikan</strong> -&gt; <strong className="text-emerald-800 font-bold">Buat pintasan...</strong>
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                        <p className="text-gray-600 leading-relaxed">
                          Centang opsi <strong className="text-gray-800 font-semibold">"Buka sebagai jendela"</strong> untuk membuka aplikasi ini layaknya aplikasi desktop mandiri!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={handleShowGuide}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition shadow-sm border border-emerald-100/60"
          >
            <Sparkles size={13} className="animate-pulse" />
            <span>Tampilkan Panduan Pintasan (Shortcut)</span>
          </button>
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <Users size={28} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-emerald-950">{totalSantri}</p>
            <p className="text-xs font-semibold text-gray-500">Total Santri</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-lg">
            <School size={28} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-teal-950">{totalKelas}</p>
            <p className="text-xs font-semibold text-gray-500">Total Kelas</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
            <BookOpen size={28} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-amber-950">{totalMapel}</p>
            <p className="text-xs font-semibold text-gray-500">Total Mapel</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-lg">
            <Award size={28} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-rose-950">{overallAverage}</p>
            <p className="text-xs font-semibold text-gray-500">Rata-rata Nilai</p>
          </div>
        </div>
      </div>

      {/* Quick Action Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('add-student')}
          className={`flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-100 rounded-xl transition duration-200 shadow-sm group ${
            userRole !== 'admin' ? 'col-span-2 md:col-span-4 py-8' : ''
          }`}
        >
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-full mb-2 group-hover:scale-110 transition duration-200">
            <UserPlus size={20} />
          </div>
          <span className="text-sm font-bold">Tambah Santri</span>
        </button>

        {userRole === 'admin' && (
          <>
            <button
              onClick={() => onNavigate('subjects')}
              className="flex flex-col items-center justify-center p-4 bg-teal-50 hover:bg-teal-100/80 text-teal-900 border border-teal-100 rounded-xl transition duration-200 shadow-sm group"
            >
              <div className="p-2 bg-teal-100 text-teal-800 rounded-full mb-2 group-hover:scale-110 transition duration-200">
                <BookOpen size={20} />
              </div>
              <span className="text-sm font-bold">Atur Mapel</span>
            </button>

            <button
              onClick={() => onNavigate('teachers')}
              className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-100 rounded-xl transition duration-200 shadow-sm group"
            >
              <div className="p-2 bg-amber-100 text-amber-800 rounded-full mb-2 group-hover:scale-110 transition duration-200">
                <Users size={20} />
              </div>
              <span className="text-sm font-bold">Wali Kelas</span>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl transition duration-200 shadow-sm group"
            >
              <div className="p-2 bg-slate-200 text-slate-800 rounded-full mb-2 group-hover:scale-110 transition duration-200">
                <Settings size={20} />
              </div>
              <span className="text-sm font-bold">Pengaturan</span>
            </button>
          </>
        )}
      </div>

      {/* School Info Header Card */}
      <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-800 font-bold mb-4">
          <Info size={20} />
          <h3>Informasi Lembaga Aktif</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="space-y-1">
            <span className="text-gray-400 block font-medium">Tahun Ajaran</span>
            <span className="font-semibold text-gray-800 text-base">{settings.tahunAjaran}</span>
          </div>
          <div className="space-y-1">
            <span className="text-gray-400 block font-medium">Semester</span>
            <span className="font-semibold text-gray-800 text-base">{settings.semester}</span>
          </div>
          <div className="space-y-1">
            <span className="text-gray-400 block font-medium">Kepala Madrasah</span>
            <span className="font-semibold text-gray-800 text-base">{settings.namaKepala}</span>
          </div>
          <div className="space-y-1">
            <span className="text-gray-400 block font-medium">Pengasuh</span>
            <span className="font-semibold text-gray-800 text-base">{settings.namaPengasuh}</span>
          </div>
        </div>
      </div>

      {/* Chart & Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Grade Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-emerald-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-emerald-800 font-bold mb-6">
            <Activity size={20} />
            <h3>Rata-rata Nilai per Kelas</h3>
          </div>
          <div className="flex-1 min-h-[300px]">
            {classAvgData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classAvgData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="Rata-rata" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">
                Belum ada data nilai santri untuk divisualisasikan.
              </div>
            )}
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4 mb-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Award size={20} />
              <h3>Peringkat Hasil Belajar</h3>
            </div>
            
            <select
              value={selectedRankClass}
              onChange={(e) => setSelectedRankClass(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Kelas (Top 5)</option>
              {uniqueClasses.filter(Boolean).map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[350px] pr-1">
            {studentRankings.length > 0 ? (
              studentRankings.map((student, idx) => {
                const rankNum = selectedRankClass === 'all' ? idx + 1 : student.classRank;
                const rankStyles = [
                  "bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-extrabold shadow-sm",
                  "bg-gradient-to-r from-slate-400 to-slate-300 text-white font-extrabold shadow-sm",
                  "bg-gradient-to-r from-amber-700 to-amber-600 text-white font-extrabold shadow-sm",
                  "bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold",
                  "bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold"
                ];
                const defaultStyle = "bg-slate-100 text-slate-600 border border-slate-200 font-semibold";
                const appliedStyle = rankNum <= 5 ? rankStyles[rankNum - 1] : defaultStyle;

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-emerald-50/40 transition duration-150 cursor-pointer animate-fade-in"
                    onClick={() => onSelectStudent(student.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${appliedStyle}`}>
                        {rankNum}
                      </span>
                      <div>
                        <p className="font-bold text-gray-800 text-sm line-clamp-1">{student.nama}</p>
                        <p className="text-xs text-gray-400 font-medium">
                          {student.kelas} {selectedRankClass === 'all' && `• Peringkat ${student.classRank}`}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-700 text-sm bg-emerald-50 px-2 py-1 rounded-lg">
                      {student.average.toFixed(2)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 italic text-center py-8 text-sm">Belum ada data nilai.</p>
            )}
          </div>
        </div>
      </div>

      {/* Program Remedial & Ketuntasan KKM Widget */}
      <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between font-bold text-rose-950">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">📋</span>
            <h3>Program Remedial & Pengawasan KKM (Semester Aktif)</h3>
          </div>
          <span className="text-xs bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full font-extrabold">
            {remedialList.length} Nilai di Bawah KKM
          </span>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Berikut adalah daftar santri aktif yang memperoleh nilai di bawah Kriteria Ketuntasan Minimal (KKM). Guru/Wali Kelas dapat memantau santri bersangkutan untuk program remedial atau langsung menghubungi orang tua untuk kerja sama bimbingan belajar.
          </p>

          {remedialList.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-700 bg-emerald-50/40 border border-emerald-100 rounded-xl font-bold flex items-center justify-center gap-2">
              <span>🎉</span> Alhamdullilah! Semua nilai santri pada semester ini telah memenuhi atau melampaui KKM.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-150">
                    <th className="p-3">Nama Santri</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Mata Pelajaran</th>
                    <th className="p-3 text-center">Nilai Rapor</th>
                    <th className="p-3 text-center">Standar KKM</th>
                    <th className="p-3 text-center">Tindakan Wali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {remedialList.slice(0, 10).map((rem, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{rem.studentName}</td>
                      <td className="p-3 text-slate-650">{rem.class}</td>
                      <td className="p-3 font-semibold text-rose-950">{rem.subjectName}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 font-black rounded">
                          {rem.score}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-600">{rem.kkm}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (!rem.parentPhone) {
                              alert("Nomor HP Orang Tua belum dicatatkan untuk santri ini! Harap tambahkan di menu Data Santri.");
                              return;
                            }
                            const cleanPhone = rem.parentPhone.replace(/[^0-9]/g, '');
                            const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                            
                            const message = `Assalamualaikum Wr. Wb. Bapak/Ibu Wali dari Ananda *${rem.studentName}*, kami dari PPTQ Al-Husna Bukit Raja Wali menginfokan bahwa nilai rapor Ananda untuk mata pelajaran *${rem.subjectName}* adalah *${rem.score}* (KKM: ${rem.kkm}). Ananda memerlukan bimbingan tambahan (Remedial). Mohon dukungannya di rumah. Jazakumullahu khair.`;
                            
                            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-850 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition"
                          title="Kirim pemberitahuan remedial ke WhatsApp Orang Tua"
                        >
                          <span>💬</span> Hubungi Ortu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {remedialList.length > 10 && (
                <div className="p-2.5 text-center bg-slate-50 border-t border-slate-150 text-[10px] text-slate-500 font-semibold">
                  Menampilkan 10 dari {remedialList.length} santri butuh remedial. Buka halaman Data Santri untuk list lengkap.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Logs Activity */}
      <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-2 font-bold text-emerald-950">
          <Activity size={18} />
          <h3>Log Aktivitas Terbaru</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {logs.length > 0 ? (
            logs.slice(0, 5).map(log => (
              <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 transition">
                <span className="text-emerald-600 mt-0.5">⏱️</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-gray-800">{log.action}</p>
                  <p className="text-xs text-gray-500">
                    {log.details} — <span className="font-medium text-gray-600">oleh {log.user}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-400 font-mono font-medium">{log.timestamp}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic text-center py-6 text-sm">Belum ada log aktivitas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
