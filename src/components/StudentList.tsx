import { useState, ChangeEvent } from 'react';
import { Search, Printer, Edit2, Trash2, FileText, Plus, UserCheck, ChevronDown, ChevronUp, Download, Upload, GraduationCap, History } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student, ClassTeacher, Subject, UserAccount, ClassSubject, SystemSettings } from '../types';
const defaultLogo = "/logo.svg";

interface StudentListProps {
  students: Student[];
  teachers: ClassTeacher[];
  subjects?: Subject[];
  classSubjects?: ClassSubject[];
  settings?: SystemSettings;
  userRole?: string;
  currentUser?: UserAccount | null;
  activeSemester?: 'Ganjil' | 'Genap';
  activeTahunAjaran?: string;
  onNavigate: (tab: string) => void;
  onEditStudent: (id: string) => void;
  onDeleteStudent: (id: string) => void;
  onViewRaport: (id: string) => void;
  onPrintClass: (kelas: string) => void;
  onBulkSaveStudents?: (updatedStudentsList: Student[]) => void;
  onPrintMultipleStudents?: (studentIds: string[]) => void;
  onDeleteClassStudents?: (kelas: string) => void;
}

export default function StudentList({
  students,
  teachers,
  subjects = [],
  classSubjects = [],
  settings,
  userRole = 'teacher',
  currentUser = null,
  activeSemester = 'Ganjil',
  activeTahunAjaran = '2026/2027',
  onNavigate,
  onEditStudent,
  onDeleteStudent,
  onViewRaport,
  onPrintClass,
  onBulkSaveStudents,
  onPrintMultipleStudents,
  onDeleteClassStudents
}: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'nama-asc' | 'nama-desc' | 'nis-asc' | 'nis-desc'>('nama-asc');
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    parsedCount: number;
    updatedCount: number;
    newCount: number;
    details: string[];
    studentsToSave?: Student[];
  } | null>(null);

  // Promotion Modal States
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoSourceClass, setPromoSourceClass] = useState('');
  const [promoDestClass, setPromoDestClass] = useState('');
  const [promoTargetYear, setPromoTargetYear] = useState(activeTahunAjaran);
  const [promoTargetSemester, setPromoTargetSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // History Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Print Leger & Biodata states
  const [printLegerClass, setPrintLegerClass] = useState<string | null>(null);
  const [printBiodataStudentId, setPrintBiodataStudentId] = useState<string | null>(null);
  const [printBiodataClass, setPrintBiodataClass] = useState<string | null>(null);

  // Customizable print location and date
  const [printLocation, setPrintLocation] = useState('Kabupaten Pringsewu');
  const [printDate, setPrintDate] = useState(() => {
    return new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
  });

  const managedClasses = teachers
    .filter(t => t.waliKelas.toLowerCase() === currentUser?.fullname?.toLowerCase())
    .map(t => t.kelas);

  const hasManagedClasses = userRole === 'admin' || managedClasses.length > 0;

  const canModifyStudent = (st: Student) => {
    if (settings?.nilaiRaportSelesai) {
      if (userRole === 'admin') return true;
      return false;
    }
    if (userRole === 'admin') return true;
    return managedClasses.includes(st.kelas);
  };

  const canModifyClass = (className: string) => {
    if (settings?.nilaiRaportSelesai) {
      if (userRole === 'admin') return true;
      return false;
    }
    if (userRole === 'admin') return true;
    return managedClasses.includes(className);
  };

  // Filter students based on active semester and year
  const activeTermStudents = students.filter(st => 
    st.semester === activeSemester && st.tahunAjaran === activeTahunAjaran
  );

  // Master List of Classes (including prospective split classes for the new term)
  const MASTER_CLASSES = [
    "Sughro Awal Putra",
    "Sughro Awal Putri",
    "Sughro Tsani Putra",
    "Sughro Tsani Putri",
    "Kubro Awal",
    "Kubro Awal Putra",
    "Kubro Awal Putri",
    "Kubro Tsani",
    "Kubro Tsani Putra",
    "Kubro Tsani Putri",
    "Ma'had Aly",
    "Ma'had Aly Putra",
    "Ma'had Aly Putri"
  ];

  // Helper to suggest the next class path officially mandated by the academy
  const getSuggestedPromoClass = (sourceClass: string): string => {
    switch (sourceClass) {
      case "Sughro Awal Putra":
        return "Sughro Tsani Putra";
      case "Sughro Awal Putri":
        return "Sughro Tsani Putri";
      case "Sughro Tsani Putra":
        return "Kubro Awal"; // Admin can override to Kubro Awal Putra if split
      case "Sughro Tsani Putri":
        return "Kubro Awal"; // Admin can override to Kubro Awal Putri if split
      case "Kubro Awal":
        return "Kubro Tsani";
      case "Kubro Awal Putra":
        return "Kubro Tsani Putra";
      case "Kubro Awal Putri":
        return "Kubro Tsani Putri";
      case "Kubro Tsani":
        return "Ma'had Aly";
      case "Kubro Tsani Putra":
        return "Ma'had Aly Putra";
      case "Kubro Tsani Putri":
        return "Ma'had Aly Putri";
      case "Ma'had Aly":
      case "Ma'had Aly Putra":
      case "Ma'had Aly Putri":
        return "LULUS / ALUMNI";
      default:
        return "";
    }
  };

  // Get list of unique classes present in students
  const studentClasses = Array.from(new Set(activeTermStudents.map(s => s.kelas)));
  const allClasses = Array.from(new Set([...studentClasses, ...MASTER_CLASSES]));

  // Filter students based on search and selected class filter
  const filteredStudents = activeTermStudents.filter(st => {
    const matchesSearch = st.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          st.nis.includes(searchTerm);
    const matchesClass = selectedClassFilter === 'ALL' || st.kelas === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  // Sort filtered students based on Name or NIS
  const sortedFilteredStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'nama-asc') {
      return a.nama.localeCompare(b.nama, 'id');
    }
    if (sortBy === 'nama-desc') {
      return b.nama.localeCompare(a.nama, 'id');
    }
    if (sortBy === 'nis-asc') {
      const nisA = parseInt(a.nis) || 0;
      const nisB = parseInt(b.nis) || 0;
      if (nisA !== nisB) return nisA - nisB;
      return a.nis.localeCompare(b.nis);
    }
    if (sortBy === 'nis-desc') {
      const nisA = parseInt(a.nis) || 0;
      const nisB = parseInt(b.nis) || 0;
      if (nisA !== nisB) return nisB - nisA;
      return b.nis.localeCompare(a.nis);
    }
    return 0;
  });

  // Export to CSV function
  const handleExportCSV = () => {
    // 1. Prepare base headers including Kepribadian (Akhlaq, Kerajinan, Kedisiplinan, Kerapihan)
    const baseHeaders = ['NIS', 'Nama Lengkap', 'Kelas', 'Semester', 'Tahun Ajaran', 'Sakit', 'Izin', 'Alpa', 'Catatan', 'Akhlaq', 'Kerajinan', 'Kedisiplinan', 'Kerapihan'];
    
    // Sort subjects by ID or name to keep order consistent, filtering out any invalid/undefined subjects
    const sortedSubjects = [...subjects]
      .filter(subj => subj && subj.nameId && subj.nameId.trim() !== '' && subj.nameId !== 'undefined')
      .sort((a, b) => a.id - b.id);
    const subjectHeaders = sortedSubjects.map(subj => `Nilai: ${subj.nameId}`);
    const headers = [...baseHeaders, ...subjectHeaders];

    // 2. Prepare rows
    const rows = sortedFilteredStudents.map(st => {
      const baseData = [
        st.nis,
        st.nama,
        st.kelas,
        st.semester,
        st.tahunAjaran,
        st.sakit,
        st.izin,
        st.alpa,
        st.catatan || '',
        st.akhlaq || '',
        st.kerajinan || '',
        st.kedisiplinan || '',
        st.kerapihan || ''
      ];
      
      const subjectData = sortedSubjects.map(subj => {
        const score = st.grades[subj.id];
        return score !== undefined ? score : '';
      });

      return [...baseData, ...subjectData];
    });

    // 3. Convert to CSV string, escape double quotes, wrap in quotes
    const escapeCSV = (val: string | number) => {
      const str = String(val === null || val === undefined ? '' : val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // 4. Trigger download with UTF-8 BOM so Excel opens it with correct encoding
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Backup_Santri_${selectedClassFilter !== 'ALL' ? selectedClassFilter.replace(/\s+/g, '_') : 'Semua_Kelas'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel function
  const handleExportExcel = () => {
    const sortedSubjects = [...subjects]
      .filter(subj => subj && typeof subj.nameId === 'string' && subj.nameId.trim() !== '' && subj.nameId !== 'undefined' && subj.nameId.toLowerCase() !== 'nan')
      .sort((a, b) => a.id - b.id);
    
    const rows = sortedFilteredStudents.map(st => {
      const rowObj: any = {
        'NIS': st.nis || '',
        'Nama Lengkap': st.nama || '',
        'Kelas': st.kelas || '',
        'Semester': st.semester || '',
        'Tahun Ajaran': st.tahunAjaran || '',
        'Sakit': typeof st.sakit === 'number' ? st.sakit : 0,
        'Izin': typeof st.izin === 'number' ? st.izin : 0,
        'Alpa': typeof st.alpa === 'number' ? st.alpa : 0,
        'Catatan': st.catatan || '',
        'Akhlaq': st.akhlaq || '',
        'Kerajinan': st.kerajinan || '',
        'Kedisiplinan': st.kedisiplinan || '',
        'Kerapihan': st.kerapihan || '',
      };
      
      sortedSubjects.forEach(subj => {
        rowObj[`Nilai: ${subj.nameId}`] = st.grades[subj.id] !== undefined ? st.grades[subj.id] : '';
      });
      
      return rowObj;
    });

    if (rows.length === 0) {
      const placeholderObj: any = {
        'NIS': '12345',
        'Nama Lengkap': 'Fulan bin Fulan',
        'Kelas': selectedClassFilter !== 'ALL' ? selectedClassFilter : 'Sughro Awal Putra',
        'Semester': 'Ganjil',
        'Tahun Ajaran': '2026/2027',
        'Sakit': 0,
        'Izin': 0,
        'Alpa': 0,
        'Catatan': 'Tingkatkan prestasimu',
        'Akhlaq': 'B',
        'Kerajinan': 'B',
        'Kedisiplinan': 'B',
        'Kerapihan': 'B',
      };
      
      sortedSubjects.forEach(subj => {
        placeholderObj[`Nilai: ${subj.nameId}`] = 80;
      });
      
      rows.push(placeholderObj);
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Format_Nilai_Santri");
    
    // Auto-fit column widths
    const max_width = rows.reduce((w, r) => Math.max(w, Object.keys(r).length), 10);
    worksheet['!cols'] = Array(max_width).fill({ wch: 15 });
    if (worksheet['!cols']) {
      worksheet['!cols'][0] = { wch: 12 }; // NIS
      worksheet['!cols'][1] = { wch: 25 }; // Nama
      worksheet['!cols'][2] = { wch: 20 }; // Kelas
      worksheet['!cols'][8] = { wch: 30 }; // Catatan
    }

    const fileName = `Format_Nilai_Santri_${selectedClassFilter !== 'ALL' ? selectedClassFilter.replace(/\s+/g, '_') : 'Semua_Kelas'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Download empty/blank Excel template with current subjects
  const handleDownloadTemplate = () => {
    const sortedSubjects = [...subjects]
      .filter(subj => subj && typeof subj.nameId === 'string' && subj.nameId.trim() !== '' && subj.nameId !== 'undefined' && subj.nameId.toLowerCase() !== 'nan')
      .sort((a, b) => a.id - b.id);
    
    // Create headers & dummy rows
    const rows = [
      {
        'NIS': '1001',
        'Nama Lengkap': 'Ahmad Fauzi',
        'Kelas': selectedClassFilter !== 'ALL' ? selectedClassFilter : 'Sughro Awal Putra',
        'Semester': 'Ganjil',
        'Tahun Ajaran': '2026/2027',
        'Sakit': 0,
        'Izin': 2,
        'Alpa': 0,
        'Catatan': 'Sangat aktif dalam kegiatan pengajian dan sopan.',
        'Akhlaq': 'A',
        'Kerajinan': 'B',
        'Kedisiplinan': 'A',
        'Kerapihan': 'B',
      },
      {
        'NIS': '1002',
        'Nama Lengkap': 'Zainab Al-Adawiyah',
        'Kelas': selectedClassFilter !== 'ALL' ? selectedClassFilter : 'Sughro Awal Putra',
        'Semester': 'Ganjil',
        'Tahun Ajaran': '2026/2027',
        'Sakit': 1,
        'Izin': 0,
        'Alpa': 0,
        'Catatan': 'Pertahankan prestasimu di bidang tajwid.',
        'Akhlaq': 'A',
        'Kerajinan': 'A',
        'Kedisiplinan': 'B',
        'Kerapihan': 'A',
      }
    ] as any[];

    // Add subject columns to the dummy rows
    rows.forEach(row => {
      sortedSubjects.forEach(subj => {
        row[`Nilai: ${subj.nameId}`] = 85; // Default dummy grade
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Impor_Rapor");

    // Auto-fit column widths
    const max_width = Object.keys(rows[0]).length;
    worksheet['!cols'] = Array(max_width).fill({ wch: 15 });
    if (worksheet['!cols']) {
      worksheet['!cols'][0] = { wch: 12 }; // NIS
      worksheet['!cols'][1] = { wch: 25 }; // Nama Lengkap
      worksheet['!cols'][2] = { wch: 20 }; // Kelas
      worksheet['!cols'][8] = { wch: 35 }; // Catatan
    }

    XLSX.writeFile(workbook, "Template_Impor_Nilai_Santri.xlsx");
  };

  // Import from Excel file function
  const handleImportExcel = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("Data file kosong.");
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);
        
        if (rawRows.length === 0) {
          setImportStatus({
            success: false,
            message: "File Excel kosong atau tidak memiliki data baris yang valid.",
            parsedCount: 0,
            updatedCount: 0,
            newCount: 0,
            details: []
          });
          return;
        }

        const updatedList = [...students];
        let updatedCount = 0;
        let newCount = 0;
        const details: string[] = [];

        // Helper to find column keys case insensitively
        const findValue = (row: any, keys: string[]) => {
          for (const k of Object.keys(row)) {
            if (keys.some(key => key.toLowerCase() === k.trim().toLowerCase())) {
              return row[k];
            }
          }
          return undefined;
        };

        rawRows.forEach((row, idx) => {
          const rawNis = findValue(row, ['NIS', 'nis', 'nomor induk', 'nomor induk santri']);
          const rawNama = findValue(row, ['Nama Lengkap', 'Nama', 'nama', 'nama lengkap', 'nama santri']);
          const rawKelas = findValue(row, ['Kelas', 'kelas']);
          const rawSemester = findValue(row, ['Semester', 'semester']);
          const rawTahunAjaran = findValue(row, ['Tahun Ajaran', 'tahun ajaran', 'tahunajaran', 'th ajaran']);
          const rawSakit = findValue(row, ['Sakit', 'sakit']);
          const rawIzin = findValue(row, ['Izin', 'izin', 'ijin']);
          const rawAlpa = findValue(row, ['Alpa', 'alpa', 'absen']);
          const rawCatatan = findValue(row, ['Catatan', 'catatan', 'Catatan Wali Kelas', 'catatan wali kelas']);
          const rawAkhlaq = findValue(row, ['Akhlaq', 'akhlaq', 'Akhlak', 'akhlak']);
          const rawKerajinan = findValue(row, ['Kerajinan', 'kerajinan']);
          const rawKedisiplinan = findValue(row, ['Kedisiplinan', 'kedisiplinan']);
          const rawKerapihan = findValue(row, ['Kerapihan', 'kerapihan', 'Kerapian', 'kerapian']);

          const nis = rawNis ? String(rawNis).trim() : '';
          const nama = rawNama ? String(rawNama).trim() : '';
          const kelas = rawKelas ? String(rawKelas).trim() : (selectedClassFilter !== 'ALL' ? selectedClassFilter : 'Sughro Awal Putra');
          const semester = (rawSemester && (String(rawSemester).trim() === 'Genap' || String(rawSemester).trim() === 'Ganjil')) 
            ? String(rawSemester).trim() as 'Ganjil' | 'Genap'
            : activeSemester;
          const tahunAjaran = rawTahunAjaran ? String(rawTahunAjaran).trim() : activeTahunAjaran;
          
          const sakit = isNaN(Number(rawSakit)) ? 0 : Number(rawSakit);
          const izin = isNaN(Number(rawIzin)) ? 0 : Number(rawIzin);
          const alpa = isNaN(Number(rawAlpa)) ? 0 : Number(rawAlpa);
          const catatan = rawCatatan ? String(rawCatatan).trim() : '';

          const parseKepribadian = (val: any): 'A' | 'B' | 'C' | 'D' | '' => {
            if (val === undefined || val === null || String(val).trim() === '') return '';
            const normalized = String(val).trim().toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(normalized)) {
              return normalized as 'A' | 'B' | 'C' | 'D';
            }
            return '';
          };

          const akhlaq = parseKepribadian(rawAkhlaq);
          const kerajinan = parseKepribadian(rawKerajinan);
          const kedisiplinan = parseKepribadian(rawKedisiplinan);
          const kerapihan = parseKepribadian(rawKerapihan);

          if (!nis || !nama) {
            details.push(`Baris ${idx + 2}: Dilewati (Nama atau NIS kosong)`);
            return;
          }

          if (userRole === 'teacher' && !managedClasses.includes(kelas)) {
            details.push(`Baris ${idx + 2}: Dilewati (Bukan kelas asuhan Anda: "${kelas}")`);
            return;
          }

          // Parse grades
          const grades: Record<number, number> = {};
          subjects.forEach(subj => {
            const rawScore = findValue(row, [`Nilai: ${subj.nameId}`, subj.nameId, `Nilai ${subj.nameId}`]);
            if (rawScore !== undefined && rawScore !== '') {
              const parsedScore = parseFloat(rawScore);
              if (!isNaN(parsedScore)) {
                grades[subj.id] = Math.min(100, Math.max(0, parsedScore));
              }
            }
          });

          const cleanString = (val: string) => val.trim().toLowerCase().replace(/\s+/g, ' ');
          const cleanNis = (val: string) => val.trim().replace(/^0+/, '');

          // Match student within the same semester and school year to prevent duplicates and overwriting other terms
          const existingIdx = updatedList.findIndex(s => {
            const sameSemesterAndYear = s.semester === semester && s.tahunAjaran === tahunAjaran;
            if (!sameSemesterAndYear) return false;

            const isSameNis = cleanNis(s.nis) === cleanNis(nis) && cleanNis(nis) !== '';
            const isSameNameAndClass = cleanString(s.nama) === cleanString(nama) && s.kelas === kelas;

            return isSameNis || isSameNameAndClass;
          });
          if (existingIdx !== -1) {
            const existingStudent = updatedList[existingIdx];
            const updatedStudent: Student = {
              ...existingStudent,
              nama,
              kelas,
              semester,
              tahunAjaran,
              sakit,
              izin,
              alpa,
              catatan,
              akhlaq: akhlaq || existingStudent.akhlaq || '',
              kerajinan: kerajinan || existingStudent.kerajinan || '',
              kedisiplinan: kedisiplinan || existingStudent.kedisiplinan || '',
              kerapihan: kerapihan || existingStudent.kerapihan || '',
              grades: {
                ...existingStudent.grades,
                ...grades
              }
            };
            updatedList[existingIdx] = updatedStudent;
            updatedCount++;
            details.push(`NIS ${nis} (${nama}): Berhasil diperbarui`);
          } else {
            const newStudent: Student = {
              id: `stud-imported-${Date.now()}-${idx}`,
              nis,
              nama,
              kelas,
              semester,
              tahunAjaran,
              sakit,
              izin,
              alpa,
              catatan,
              akhlaq,
              kerajinan,
              kedisiplinan,
              kerapihan,
              grades
            };
            updatedList.push(newStudent);
            newCount++;
            details.push(`NIS ${nis} (${nama}): Ditambahkan sebagai santri baru`);
          }
        });

        setImportStatus({
          success: true,
          message: "Berkas Excel berhasil diurai. Tinjau rangkuman perubahan di bawah ini sebelum menyimpan.",
          parsedCount: rawRows.length,
          updatedCount,
          newCount,
          details,
          studentsToSave: updatedList
        });

      } catch (error) {
        console.error(error);
        setImportStatus({
          success: false,
          message: `Gagal membaca file: ${error instanceof Error ? error.message : "Format tidak sesuai"}`,
          parsedCount: 0,
          updatedCount: 0,
          newCount: 0,
          details: []
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveImportedData = () => {
    if (importStatus?.studentsToSave && onBulkSaveStudents) {
      onBulkSaveStudents(importStatus.studentsToSave);
      setShowImportModal(false);
      setImportStatus(null);
      alert(`Berhasil mengimpor data! ${importStatus.newCount} santri baru ditambahkan, ${importStatus.updatedCount} santri diperbarui.`);
    }
  };

  const handleExecutePromotion = () => {
    if (!promoSourceClass || !promoDestClass || !promoTargetYear) {
      alert("Harap lengkapi seluruh formulir promosi kenaikan kelas!");
      return;
    }

    if (promoSourceClass === promoDestClass && promoTargetYear === activeTahunAjaran && promoTargetSemester === activeSemester) {
      alert("Kelas tujuan dan tahun ajaran/semester tidak boleh sama persis dengan asal!");
      return;
    }

    // 1. Get all students in source class for current active term
    const sourceStudents = activeTermStudents.filter(s => s.kelas === promoSourceClass);
    if (sourceStudents.length === 0) {
      alert(`Tidak ada santri yang terdaftar di kelas ${promoSourceClass} pada semester ${activeSemester} tahun ajaran ${activeTahunAjaran}!`);
      return;
    }

    // Check if students already exist in destination class for the target term
    const duplicateCheck = students.some(s => 
      s.kelas === promoDestClass && 
      s.tahunAjaran === promoTargetYear && 
      s.semester === promoTargetSemester &&
      sourceStudents.map(ss => ss.nis).includes(s.nis)
    );

    if (duplicateCheck) {
      if (!window.confirm("Beberapa santri dari kelas ini tampaknya sudah dipromosikan ke kelas tujuan untuk tahun ajaran/semester tersebut. Apakah Anda ingin melanjutkan dan menduplikasi data?")) {
        return;
      }
    }

    // 2. Map them to new promoted copies
    const promotedStudents: Student[] = sourceStudents.map(st => {
      return {
        ...st,
        id: `stud-${Date.now()}-${Math.floor(Math.random() * 1000)}-${st.nis}`,
        kelas: promoDestClass,
        tahunAjaran: promoTargetYear,
        semester: promoTargetSemester,
        // Reset dynamic values for new term
        sakit: 0,
        izin: 0,
        alpa: 0,
        catatan: "",
        grades: {}, // Blank grades
        // Reset personality
        akhlaq: "",
        kerajinan: "",
        kedisiplinan: "",
        kerapihan: "",
        // Keep personal details
        nama: st.nama,
        nis: st.nis,
        noHpOrangTua: st.noHpOrangTua || "",
        createdBy: currentUser?.username || 'system'
      };
    });

    // 3. Combine with ALL existing students
    const updatedAllStudents = [...students, ...promotedStudents];

    // 4. Save
    if (onBulkSaveStudents) {
      onBulkSaveStudents(updatedAllStudents);
      alert(`Promosi Berhasil!\n\n${promotedStudents.length} santri dari kelas "${promoSourceClass}" berhasil dipromosikan ke kelas "${promoDestClass}" untuk Tahun Ajaran ${promoTargetYear} (Semester ${promoTargetSemester}).\n\nCatatan: Silakan ubah Semester & Tahun Ajaran Aktif di menu Pengaturan Sistem jika ingin mulai mengelola data term baru.`);
      setShowPromoModal(false);
    } else {
      alert("Gagal melakukan promosi massal karena fungsi simpan tidak tersedia.");
    }
  };

  // Group students by class
  const groupedStudents: Record<string, Student[]> = {};
  sortedFilteredStudents.forEach(st => {
    if (!groupedStudents[st.kelas]) {
      groupedStudents[st.kelas] = [];
    }
    groupedStudents[st.kelas].push(st);
  });

  const toggleClassExpand = (className: string) => {
    setExpandedClasses(prev => ({
      ...prev,
      [className]: prev[className] === false ? true : false // default is expanded (true) if undefined
    }));
  };

  const getWaliKelas = (className: string) => {
    const teach = teachers.find(t => t.kelas === className);
    return teach ? teach.waliKelas : "Belum ditentukan";
  };

  const isAllClassSelected = (className: string) => {
    const classStudents = groupedStudents[className] || [];
    if (classStudents.length === 0) return false;
    return classStudents.every(st => selectedStudentIds[st.id]);
  };

  const toggleSelectAllClass = (className: string, classStudents: Student[]) => {
    const allSelected = isAllClassSelected(className);
    const newSelected = { ...selectedStudentIds };
    classStudents.forEach(st => {
      if (allSelected) {
        delete newSelected[st.id];
      } else {
        newSelected[st.id] = true;
      }
    });
    setSelectedStudentIds(newSelected);
  };

  const handleSelectStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const copy = { ...prev };
      if (copy[studentId]) {
        delete copy[studentId];
      } else {
        copy[studentId] = true;
      }
      return copy;
    });
  };

  const calculateRankings = (studentsList: Student[]) => {
    const studentTotals = studentsList.map(s => {
      const total = Object.values(s.grades).reduce((acc, val) => acc + (val || 0), 0);
      return { id: s.id, total };
    });
    studentTotals.sort((a, b) => b.total - a.total);
    const ranks: Record<string, number> = {};
    let currentRank = 1;
    for (let i = 0; i < studentTotals.length; i++) {
      if (i > 0 && studentTotals[i].total < studentTotals[i - 1].total) {
        currentRank = i + 1;
      }
      ranks[studentTotals[i].id] = currentRank;
    }
    return ranks;
  };

  // Render Leger Print View
  if (printLegerClass) {
    const studentsInClass = activeTermStudents.filter(s => s.kelas === printLegerClass);
    const ranks = calculateRankings(studentsInClass);
    const classSubIds = classSubjects.filter(cs => cs.kelas === printLegerClass).map(cs => cs.subjectId);
    const activeClassSubjects = subjects.filter(s => classSubIds.includes(s.id));
    const waliKelas = getWaliKelas(printLegerClass);

    return (
      <div className="bg-slate-100 min-h-screen pb-12 print:bg-white print:pb-0">
        {/* Top Control Bar - Hidden when printing */}
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrintLegerClass(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <span className="text-sm">←</span>
              <span>Kembali</span>
            </button>
            <div>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                Mode Cetak Leger Kelas
              </span>
              <h1 className="text-sm font-bold text-slate-800 mt-1">
                Leger Nilai Kelas {printLegerClass} - {activeSemester} {activeTahunAjaran}
              </h1>
            </div>
          </div>

          {/* Settings Group */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5">
              <span>📍 Tempat:</span>
              <input 
                type="text" 
                value={printLocation} 
                onChange={(e) => setPrintLocation(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-semibold outline-none focus:border-indigo-500 w-44" 
                placeholder="Tempat tanda tangan..."
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>📅 Tanggal:</span>
              <input 
                type="text" 
                value={printDate} 
                onChange={(e) => setPrintDate(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-semibold outline-none focus:border-indigo-500 w-48" 
                placeholder="Tanggal tanda tangan..."
              />
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow transition active:scale-95 cursor-pointer self-start md:self-auto"
          >
            <Printer size={14} />
            <span>Cetak Leger (PDF / Kertas)</span>
          </button>
        </div>

        {/* Print Content Sheet */}
        <div className="max-w-[1100px] mx-auto my-6 bg-white p-8 border border-slate-200 shadow-sm print:shadow-none print:border-none print:my-0 print:p-0">
          {/* Header (Sama dengan Kop Raport) */}
          <div className="text-center space-y-2 mb-6">
            {settings?.kopSurat ? (
              <div className="w-full mb-3">
                <img src={settings.kopSurat} alt="Kop Surat" className="w-full h-auto object-contain" />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-6 pb-2 text-center">
                <img src={settings?.logoSekolah || defaultLogo} alt="Logo" className="h-16 w-16 object-contain" />
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

          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-250 print:bg-transparent print:border-none print:p-0">
            <div>
              <p>Kelas: <span className="text-slate-950 font-black">{printLegerClass}</span></p>
              <p>Wali Kelas: <span className="text-emerald-900 font-black">{waliKelas}</span></p>
            </div>
            <div className="text-right">
              <p>Semester: <span className="text-slate-950 font-black">{activeSemester}</span></p>
              <p>Tahun Ajaran: <span className="text-slate-950 font-black">{activeTahunAjaran}</span></p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px] border border-slate-800">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-800">
                  <th className="p-1 border border-slate-800 text-center font-bold w-6">No</th>
                  <th className="p-1 border border-slate-800 font-bold w-16">NIS</th>
                  <th className="p-1 border border-slate-800 font-bold w-36">Nama Santri</th>
                  {activeClassSubjects.map(sub => (
                    <th key={sub.id} className="p-1 border border-slate-800 text-center font-bold w-12" title={sub.nameAr}>
                      <span className="block text-[8px] leading-tight text-slate-600 font-medium">{sub.nameAr}</span>
                      <span className="block truncate">{sub.nameId}</span>
                    </th>
                  ))}
                  <th className="p-1 border border-slate-800 text-center font-bold w-12">Total</th>
                  <th className="p-1 border border-slate-800 text-center font-bold w-12">Rata2</th>
                  <th className="p-1 border border-slate-800 text-center font-bold w-10">Rank</th>
                  <th className="p-1 border border-slate-800 text-center font-bold w-16">Absen (S/I/A)</th>
                </tr>
              </thead>
              <tbody>
                {studentsInClass.map((st, i) => {
                  const sTotals = Object.values(st.grades).reduce((acc, val) => acc + (val || 0), 0);
                  const sAverage = activeClassSubjects.length > 0 ? (sTotals / activeClassSubjects.length).toFixed(1) : '0';
                  const rank = ranks[st.id] || '-';
                  return (
                    <tr key={st.id} className="border-b border-slate-800 hover:bg-slate-50">
                      <td className="p-1 border border-slate-800 text-center">{i + 1}</td>
                      <td className="p-1 border border-slate-800 font-mono">{st.nis}</td>
                      <td className="p-1 border border-slate-800 font-bold">{st.nama}</td>
                      {activeClassSubjects.map(sub => (
                        <td key={sub.id} className="p-1 border border-slate-800 text-center font-mono font-semibold">
                          {st.grades[sub.id] !== undefined ? st.grades[sub.id] : '-'}
                        </td>
                      ))}
                      <td className="p-1 border border-slate-800 text-center font-bold font-mono text-indigo-900">{sTotals}</td>
                      <td className="p-1 border border-slate-800 text-center font-bold font-mono">{sAverage}</td>
                      <td className="p-1 border border-slate-800 text-center font-black text-rose-700">{rank}</td>
                      <td className="p-1 border border-slate-800 text-center font-semibold text-slate-600 font-mono">
                        {st.sakit}/{st.izin}/{st.alpa}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Signatures */}
          <div className="grid grid-cols-2 gap-12 mt-12 text-xs font-bold text-center">
            <div>
              <p className="mb-16">Mengetahui,<br />Kepala Madrasah Diniyah</p>
              <p className="underline uppercase">{settings?.namaKepala || "Ustadz H. Ahmad Hambali"}</p>
            </div>
            <div>
              <p className="mb-16">{printLocation}, {printDate}<br />Wali Kelas {printLegerClass}</p>
              <p className="underline uppercase">{waliKelas}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Biodata Students selection
  let biodataStudentsToPrint: Student[] = [];
  let printTitle = "";

  if (printBiodataStudentId) {
    const s = students.find(x => x.id === printBiodataStudentId);
    if (s) {
      biodataStudentsToPrint = [s];
      printTitle = `Biodata Santri - ${s.nama}`;
    }
  } else if (printBiodataClass) {
    biodataStudentsToPrint = activeTermStudents.filter(s => s.kelas === printBiodataClass);
    printTitle = `Biodata Kelas ${printBiodataClass}`;
  }

  // Render Biodata Print View
  if (biodataStudentsToPrint.length > 0) {
    return (
      <div className="bg-slate-100 min-h-screen pb-12 print:bg-white print:pb-0">
        {/* Top Control Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPrintBiodataStudentId(null);
                setPrintBiodataClass(null);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <span className="text-sm">←</span>
              <span>Kembali</span>
            </button>
            <div>
              <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                Buku Induk & Biodata Santri
              </span>
              <h1 className="text-sm font-bold text-slate-800 mt-1">
                {printTitle}
              </h1>
            </div>
          </div>

          {/* Settings Group */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5">
              <span>📍 Tempat:</span>
              <input 
                type="text" 
                value={printLocation} 
                onChange={(e) => setPrintLocation(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-semibold outline-none focus:border-indigo-500 w-44" 
                placeholder="Tempat tanda tangan..."
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>📅 Tanggal:</span>
              <input 
                type="text" 
                value={printDate} 
                onChange={(e) => setPrintDate(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-semibold outline-none focus:border-indigo-500 w-48" 
                placeholder="Tanggal tanda tangan..."
              />
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow transition active:scale-95 cursor-pointer self-start md:self-auto"
          >
            <Printer size={14} />
            <span>Cetak Biodata (PDF / Kertas)</span>
          </button>
        </div>

        {/* Print Pages */}
        <div className="space-y-8 print:space-y-0">
          {biodataStudentsToPrint.map((st) => {
            let isRed = false;
            if (st.tanggalLahir) {
              const year = parseInt(st.tanggalLahir.split('-')[0]);
              isRed = !isNaN(year) && year % 2 !== 0; // Odd year = Red, Even year = Blue
            }
            const bgHex = isRed ? '#d92626' : '#2652d9';
            const bgLabel = isRed ? 'Merah (Lahir Ganjil)' : 'Biru (Lahir Genap)';
            const formattedDob = st.tanggalLahir 
              ? new Date(st.tanggalLahir).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})
              : '-';
            const formattedEntry = st.tanggalMasuk
              ? new Date(st.tanggalMasuk).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})
              : '-';

            return (
              <div 
                key={st.id} 
                className="max-w-[800px] mx-auto my-6 bg-white p-12 border border-slate-200 shadow-sm print:shadow-none print:border-none print:my-0 print:p-0 print:break-after-page min-h-[1050px] flex flex-col justify-between"
              >
                <div>
                  {/* Document Title (No Kop Surat as requested) */}
                  <div className="text-center space-y-1 mb-10 mt-6">
                    <h1 className="text-lg font-black tracking-wider text-slate-900 uppercase">LEMBAR BIODATA SANTRI (BUKU INDUK)</h1>
                    <p className="text-[11px] font-bold text-slate-500 tracking-widest">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
                  </div>

                  {/* Biodata List */}
                  <div className="space-y-4 text-sm text-slate-800">
                    <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                      <span className="col-span-4 font-bold text-slate-500">Nomor Induk Santri (NIS)</span>
                      <span className="col-span-8 font-black text-slate-900 font-mono">{st.nis}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                      <span className="col-span-4 font-bold text-slate-500">Nama Lengkap (Latin)</span>
                      <span className="col-span-8 font-black text-slate-900 uppercase">{st.nama}</span>
                    </div>

                    {st.namaArab && (
                      <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                        <span className="col-span-4 font-bold text-slate-500">Nama Arab</span>
                        <span className="col-span-8 font-black text-emerald-950 font-serif text-lg text-right" dir="rtl">{st.namaArab}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                      <span className="col-span-4 font-bold text-slate-500">Jenis Kelamin</span>
                      <span className="col-span-8 font-extrabold text-slate-950">
                        {st.gender === 'L' ? 'Laki-laki (Ikhwan)' : st.gender === 'P' ? 'Perempuan (Akhwat)' : '-'}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                      <span className="col-span-4 font-bold text-slate-500">Tempat, Tanggal Lahir</span>
                      <span className="col-span-8 font-extrabold text-slate-950">
                        {st.tempatLahir ? `${st.tempatLahir}, ` : ''}{formattedDob}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                      <span className="col-span-4 font-bold text-slate-500">Nama Ayah Kandung</span>
                      <span className="col-span-8 font-extrabold text-slate-950">{st.namaAyah || '-'}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                      <span className="col-span-4 font-bold text-slate-500">Nama Ibu Kandung</span>
                      <span className="col-span-8 font-extrabold text-slate-950">{st.namaIbu || '-'}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                      <span className="col-span-4 font-bold text-slate-500">Alamat Tinggal</span>
                      <span className="col-span-8 font-semibold text-slate-800 leading-relaxed">{st.alamat || '-'}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                      <span className="col-span-4 font-bold text-slate-500">Tanggal Masuk Madrasah</span>
                      <span className="col-span-8 font-extrabold text-slate-950">{formattedEntry}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                      <span className="col-span-4 font-bold text-slate-500">Kelas Saat Ini</span>
                      <span className="col-span-8 font-extrabold text-slate-950">{st.kelas}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                      <span className="col-span-4 font-bold text-slate-500">Semester & Tahun Ajaran</span>
                      <span className="col-span-8 font-extrabold text-slate-950">{st.semester} - {st.tahunAjaran}</span>
                    </div>

                    {st.noHpOrangTua && (
                      <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-dashed border-slate-200">
                        <span className="col-span-4 font-bold text-slate-500">No. HP / WhatsApp Wali</span>
                        <span className="col-span-8 font-bold font-mono text-emerald-800 font-bold">+{st.noHpOrangTua}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Photo Box and Signatures */}
                <div className="grid grid-cols-12 gap-4 items-end mt-16 pt-8 border-t border-slate-200">
                  <div className="col-span-5 flex flex-col items-center">
                    <div 
                      className="relative w-[113px] h-[151px] rounded-lg shadow-md border-4 border-white flex items-center justify-center overflow-hidden transition duration-300"
                      style={{ backgroundColor: bgHex }}
                    >
                      {st.foto ? (
                        <img 
                          src={st.foto} 
                          alt="Pas Foto" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-white/80 text-center p-2 flex flex-col items-center">
                          <span className="text-xl mb-1">👤</span>
                          <span className="text-[8px] font-black uppercase tracking-wider">Pas Foto 3x4</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-extrabold mt-1 uppercase tracking-wide">
                      Background: {bgLabel}
                    </span>
                  </div>

                  <div className="col-span-7 grid grid-cols-2 gap-4 text-center text-xs font-bold text-slate-700">
                    <div className="flex flex-col justify-between h-36">
                      <p>Mengetahui,<br />Kepala Madrasah</p>
                      <div>
                        <p className="underline uppercase font-extrabold text-slate-950">{settings?.namaKepala || "Ustadz H. Ahmad Hambali"}</p>
                        <p className="text-[9px] text-slate-400 font-medium">NIP. MDT-2019-01</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between h-36">
                      <p>{printLocation}, {printDate}<br />Wali Kelas {st.kelas}</p>
                      <div>
                        <p className="underline uppercase font-extrabold text-slate-950">{getWaliKelas(st.kelas)}</p>
                        <p className="text-[9px] text-slate-400 font-medium">Ustadz / Ustadzah</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">📋</span>
            Data Santri & Pengisian Nilai
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Kelola data santri, input skor KKM mata pelajaran, dan cetak laporan hasil belajar (Raport) per kelas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {userRole === 'admin' && (
            <button
              onClick={() => {
                setPromoSourceClass(allClasses[0] || '');
                setPromoDestClass(allClasses[1] || allClasses[0] || '');
                setShowPromoModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold px-4 py-2.5 border border-indigo-250 shadow-sm transition-all active:scale-95 text-xs w-full sm:w-auto justify-center cursor-pointer"
            >
              <GraduationCap size={16} />
              <span>Naik Kelas Massal</span>
            </button>
          )}

          <button
            onClick={() => {
              if (settings?.nilaiRaportSelesai && userRole !== 'admin') {
                alert("Penginputan nilai semester ini telah ditutup/dikunci oleh Administrator!");
                return;
              }
              if (!hasManagedClasses) {
                alert("Anda tidak terdaftar sebagai Wali Kelas di kelas manapun. Harap hubungi Admin untuk mengatur Kelas Anda agar bisa mengimpor data santri!");
                return;
              }
              setShowImportModal(true);
            }}
            className={`flex items-center gap-2 rounded-xl font-bold px-4 py-2.5 border shadow-sm transition-all text-xs w-full sm:w-auto justify-center cursor-pointer ${
              hasManagedClasses
                ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200 active:scale-95'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
            title={hasManagedClasses ? "Impor nilai dari Excel" : "Anda tidak memiliki kelas asuhan"}
          >
            <Upload size={16} />
            <span>Impor Excel (.xlsx)</span>
          </button>
          
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 border border-slate-200 shadow-sm transition-all active:scale-95 text-xs w-full sm:w-auto justify-center cursor-pointer"
          >
            <Download size={16} />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
 
          <button
            onClick={() => {
              if (settings?.nilaiRaportSelesai && userRole !== 'admin') {
                alert("Penginputan nilai semester ini telah ditutup/dikunci oleh Administrator!");
                return;
              }
              if (!hasManagedClasses) {
                alert("Anda tidak terdaftar sebagai Wali Kelas di kelas manapun. Harap hubungi Admin untuk mengatur Kelas Anda agar bisa menambah data santri!");
                return;
              }
              onNavigate('add-student');
            }}
            className={`flex items-center gap-2 rounded-xl font-bold px-5 py-2.5 shadow-md transition-all text-xs w-full sm:w-auto justify-center cursor-pointer ${
              hasManagedClasses
                ? 'bg-emerald-700 hover:bg-emerald-600 text-white active:scale-95'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
            }`}
            title={hasManagedClasses ? "Tambahkan santri baru" : "Anda tidak memiliki kelas asuhan"}
          >
            <Plus size={16} />
            <span>Tambah Santri</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama santri atau NIS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 hidden sm:inline">Kelas:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Kelas</option>
              {allClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 hidden sm:inline">Urutan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="nama-asc">Nama (A - Z)</option>
              <option value="nama-desc">Nama (Z - A)</option>
              <option value="nis-asc">NIS (Terkecil - Terbesar)</option>
              <option value="nis-desc">NIS (Terbesar - Terkecil)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grouped Students Accordion */}
      <div className="space-y-6">
        {Object.keys(groupedStudents).length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200 shadow-sm text-slate-400 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">📭</span>
            <div className="space-y-1">
              <p className="font-bold text-slate-600 text-lg">Tidak ada data santri</p>
              <p className="text-sm">Silakan buat data santri baru dengan mengeklik tombol "Tambah Santri".</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedStudents).map(([className, list]) => {
            const isCollapsed = expandedClasses[className] === false;
            const waliKelas = getWaliKelas(className);
            const classRanks = calculateRankings(list);

            return (
              <div key={className} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Accordion Header */}
                <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
                  <button 
                    onClick={() => toggleClassExpand(className)}
                    className="flex items-center gap-3 text-left focus:outline-none"
                  >
                    {isCollapsed ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                    <div>
                      <span className="inline-block bg-emerald-800 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                        {className}
                      </span>
                      <span className="ml-2 text-xs font-medium text-slate-500">
                        ({list.length} Santri)
                      </span>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1 rounded-full font-bold shadow-sm flex items-center gap-1.5 mr-2">
                      <UserCheck size={12} />
                      Wali Kelas: {waliKelas}
                    </span>

                    <button
                      onClick={() => onPrintClass(className)}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-750 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 transition active:scale-95 cursor-pointer"
                      title="Cetak Rapor Massal untuk seluruh santri di kelas ini"
                    >
                      <Printer size={13} />
                      <span>Rapor Kelas</span>
                    </button>

                    <button
                      onClick={() => setPrintLegerClass(className)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-750 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition active:scale-95 cursor-pointer"
                      title="Cetak lembar rekapitulasi nilai Leger Kelas"
                    >
                      <span>📋</span>
                      <span>Leger Kelas</span>
                    </button>

                    <button
                      onClick={() => setPrintBiodataClass(className)}
                      className="flex items-center gap-1.5 text-xs font-bold text-teal-750 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg border border-teal-200 transition active:scale-95 cursor-pointer"
                      title="Cetak buku induk biodata seluruh santri di kelas ini"
                    >
                      <span>👤</span>
                      <span>Biodata Kelas</span>
                    </button>

                    {canModifyClass(className) && list.length > 0 && onDeleteClassStudents && (
                      <button
                        onClick={() => onDeleteClassStudents(className)}
                        className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 transition active:scale-95 cursor-pointer"
                        title="Hapus massal seluruh data santri di kelas ini"
                      >
                        <Trash2 size={13} />
                        <span>Hapus Massal Santri</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Table - Toggle Collapse */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-slate-50/30 border-b border-slate-100 text-slate-600">
                        <tr>
                          <th className="p-4 font-bold text-center w-12">
                            <input
                              type="checkbox"
                              checked={isAllClassSelected(className)}
                              onChange={() => toggleSelectAllClass(className, list)}
                              className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-500 h-4 w-4"
                            />
                          </th>
                          <th className="p-4 font-bold text-center w-12">No</th>
                          <th className="p-4 font-bold w-32">NIS</th>
                          <th className="p-4 font-bold">Nama Lengkap</th>
                          <th className="p-4 font-bold w-24 text-center">Semester</th>
                          <th className="p-4 font-bold text-center w-56">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {list.map((st, index) => (
                          <tr key={st.id} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={!!selectedStudentIds[st.id]}
                                onChange={() => handleSelectStudentToggle(st.id)}
                                className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-500 h-4 w-4"
                              />
                            </td>
                            <td className="p-4 text-center text-slate-500 font-medium">{index + 1}</td>
                            <td className="p-4 font-semibold text-slate-700">{st.nis}</td>
                            <td className="p-4 font-bold text-slate-900">
                              <div>{st.nama}</div>
                              {Object.keys(st.grades).length > 0 && (
                                <div className="text-[10px] text-emerald-800 font-extrabold flex items-center gap-1 mt-0.5">
                                  <span>🏆</span>
                                  <span>Peringkat {classRanks[st.id]} dari {list.length}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center text-slate-600">
                              <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-md font-bold">
                                {st.semester}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => onViewRaport(st.id)}
                                  className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-100 transition"
                                >
                                  <FileText size={13} />
                                  <span>Raport</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStudent(st);
                                    setShowHistoryModal(true);
                                  }}
                                  className="flex items-center gap-1 text-xs font-bold text-indigo-850 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition"
                                  title="Lihat riwayat nilai antar semester"
                                >
                                  <History size={13} />
                                  <span>Riwayat</span>
                                </button>
                                <button
                                  onClick={() => setPrintBiodataStudentId(st.id)}
                                  className="flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg border border-teal-100 transition cursor-pointer"
                                  title="Cetak lembar biodata / buku induk santri ini"
                                >
                                  <span>👤</span>
                                  <span>Biodata</span>
                                </button>
                                {canModifyStudent(st) ? (
                                  <>
                                    <button
                                      onClick={() => onEditStudent(st.id)}
                                      className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-100 transition animate-fade-in"
                                      title="Edit data dan nilai santri"
                                    >
                                      <Edit2 size={13} />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => onDeleteStudent(st.id)}
                                      className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-100 transition animate-fade-in"
                                      title="Hapus data santri"
                                    >
                                      <Trash2 size={13} />
                                      <span>Hapus</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      disabled
                                      className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 cursor-not-allowed opacity-60"
                                      title="Hanya admin atau guru yang menambahkan santri ini yang dapat mengubah"
                                    >
                                      <Edit2 size={13} />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      disabled
                                      className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 cursor-not-allowed opacity-60"
                                      title="Hanya admin atau guru yang menambahkan santri ini yang dapat menghapus"
                                    >
                                      <Trash2 size={13} />
                                      <span>Hapus</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {Object.values(selectedStudentIds).filter(Boolean).length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 px-6 py-4 flex items-center gap-6 animate-slide-up max-w-[95vw] sm:max-w-xl">
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black">
              {Object.values(selectedStudentIds).filter(Boolean).length}
            </span>
            <span className="text-xs font-bold text-slate-200">Santri Terpilih</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const selectedIds = Object.entries(selectedStudentIds)
                  .filter(([_, checked]) => checked)
                  .map(([id]) => id);
                if (onPrintMultipleStudents) {
                  onPrintMultipleStudents(selectedIds);
                } else {
                  alert("Fitur Cetak Massal tidak tersedia.");
                }
              }}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-xs font-black px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <Printer size={13} />
              <span>Cetak Rapor Massal</span>
            </button>

            <button
              onClick={() => {
                setSelectedStudentIds({});
              }}
              className="text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">📥</span>
                  Impor Nilai & Data Santri dari Excel
                </h3>
                <p className="text-xs text-slate-500 mt-1">Unggah file format .xlsx untuk mengimpor data dan nilai santri secara massal.</p>
              </div>
              <button 
                onClick={() => { setShowImportModal(false); setImportStatus(null); }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Template Download Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <p className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <span>📋</span> Unduh Template Excel Standar (.xlsx)
                  </p>
                  <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                    Dapatkan file template bersih berisi kolom-kolom standar dan pelajaran aktif saat ini (dilengkapi contoh data santri) agar format impor tidak rusak/gagal.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="shrink-0 flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm active:scale-95 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Download size={14} />
                  <span>Unduh Template</span>
                </button>
              </div>

              {/* Info alert */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed space-y-1">
                <p className="font-bold">⚠️ Panduan Agar Impor Excel Berjalan Lancar:</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Gunakan berkas hasil unduhan tombol <strong>"Unduh Template"</strong> di atas atau tombol <strong>"Ekspor Excel"</strong> di halaman sebelumnya agar format kolom dan judul pelajaran presisi.</li>
                  <li>Sistem mengidentifikasi santri secara unik berdasarkan kolom <strong>"NIS"</strong>.</li>
                  <li>Jika <strong>NIS sudah terdaftar</strong> di sistem: data diri, absensi, catatan, dan nilai-nilai baru akan diperbarui (ditimpa).</li>
                  <li>Jika <strong>NIS belum terdaftar</strong>: sistem akan mendaftarkan santri tersebut sebagai santri baru secara otomatis.</li>
                  <li>Jangan mengubah nama kolom utama (seperti <code>NIS</code>, <code>Nama Lengkap</code>, <code>Kelas</code>, dsb) atau nama mata pelajaran agar sistem tidak kebingungan membaca data.</li>
                </ul>
              </div>

              {/* Drag Drop or File Select */}
              <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center bg-emerald-50/10 hover:bg-emerald-50/20 transition flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">📊</span>
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-sm">Pilih berkas Excel (.xlsx) Anda</p>
                  <p className="text-xs text-slate-400">Pastikan format kolom sesuai dengan data sistem.</p>
                </div>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={handleImportExcel}
                  className="hidden" 
                  id="excel-file-input" 
                />
                <label 
                  htmlFor="excel-file-input"
                  className="cursor-pointer bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 inline-block"
                >
                  Pilih File Excel
                </label>
              </div>

              {/* Status / Preview */}
              {importStatus && (
                <div className={`p-5 rounded-2xl border ${importStatus.success ? 'bg-slate-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <p className={`font-bold text-sm flex items-center gap-2 ${importStatus.success ? 'text-emerald-950' : 'text-red-950'}`}>
                    <span>{importStatus.success ? '✓ Berhasil Mengurai Berkas' : '✕ Gagal Mengurai Berkas'}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {importStatus.message}
                  </p>

                  {importStatus.success && (
                    <div className="mt-4 space-y-3">
                      {/* Breakdown Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Baris</p>
                          <p className="text-lg font-extrabold text-slate-700 mt-0.5">{importStatus.parsedCount}</p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center shadow-sm">
                          <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Santri Baru</p>
                          <p className="text-lg font-extrabold text-emerald-800 mt-0.5">+{importStatus.newCount}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center shadow-sm">
                          <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Diperbarui</p>
                          <p className="text-lg font-extrabold text-blue-800 mt-0.5">{importStatus.updatedCount}</p>
                        </div>
                      </div>

                      {/* Log Details list */}
                      <p className="text-xs text-slate-500 font-bold">Rincian Perubahan:</p>
                      <div className="bg-white rounded-xl border border-slate-200 max-h-[150px] overflow-y-auto p-3 text-[11px] text-slate-600 font-mono space-y-1.5 divide-y divide-slate-100">
                        {importStatus.details.map((log, lidx) => (
                          <div key={lidx} className="pt-1.5 first:pt-0">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => { setShowImportModal(false); setImportStatus(null); }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                Batal
              </button>
              {importStatus?.success && (
                <button
                   onClick={handleSaveImportedData}
                   className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Naik Kelas Massal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-indigo-50 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-indigo-950 text-base flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-200 text-indigo-800 rounded-lg">🎓</span>
                  Kenaikan Kelas & Promosi Massal
                </h3>
                <p className="text-xs text-indigo-800/80 mt-1">Duplikasi semua santri dari satu kelas ke kelas baru untuk semester berikutnya.</p>
              </div>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-indigo-900 hover:bg-indigo-150 p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-indigo-950 uppercase block text-[10px]">💡 Aturan Promosi:</span>
                Sistem akan menyalin semua santri dari kelas asal ke kelas tujuan, mereset nilai dan absensi menjadi kosong, serta meregistrasikannya di semester & tahun ajaran baru secara otomatis.
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">1. Pilih Kelas Asal:</label>
                  <select
                    value={promoSourceClass}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPromoSourceClass(val);
                      const suggested = getSuggestedPromoClass(val);
                      if (suggested) {
                        setPromoDestClass(suggested);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Pilih Kelas Asal --</option>
                    {allClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">2. Pilih Kelas Tujuan (Baru):</label>
                  <select
                    value={promoDestClass}
                    onChange={(e) => setPromoDestClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Pilih Kelas Tujuan --</option>
                    {allClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="LULUS / ALUMNI">LULUS / ALUMNI</option>
                  </select>
                </div>

                {/* Visual Map Helper */}
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3 text-[10px] text-slate-600 space-y-2">
                  <div className="font-extrabold text-indigo-950 uppercase tracking-wide text-[9px] flex items-center gap-1">
                    <span>🗺️</span> Urutan Kenaikan Kelas Resmi:
                  </div>
                  <div className="grid grid-cols-1 gap-1 bg-white p-2.5 rounded-lg border border-indigo-50 font-semibold leading-relaxed">
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                      <span>1. Sughro Awal Putra</span>
                      <span className="text-indigo-600">➔ Sughro Tsani Putra</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                      <span>2. Sughro Awal Putri</span>
                      <span className="text-indigo-600">➔ Sughro Tsani Putri</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                      <span>3. Sughro Tsani Putra</span>
                      <span className="text-indigo-600">➔ Kubro Awal (atau splits)</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                      <span>4. Sughro Tsani Putri</span>
                      <span className="text-indigo-600">➔ Kubro Awal (atau splits)</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                      <span>5. Kubro Awal (P/L)</span>
                      <span className="text-indigo-600">➔ Kubro Tsani (P/L)</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                      <span>6. Kubro Tsani (P/L)</span>
                      <span className="text-indigo-600">➔ Ma'had Aly (P/L)</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>7. Ma'had Aly (P/L)</span>
                      <span className="text-emerald-600 font-bold">➔ LULUS / ALUMNI</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-indigo-900 leading-normal italic">
                    *Tersedia juga opsi pembagian kelas Putra/Putri untuk tingkat Kubro dan Ma'had Aly di tahun ajaran baru.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">3. Tahun Ajaran:</label>
                    <input
                      type="text"
                      placeholder="Contoh: 2026/2027"
                      value={promoTargetYear}
                      onChange={(e) => setPromoTargetYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 font-semibold text-slate-850 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">4. Semester:</label>
                    <select
                      value={promoTargetSemester}
                      onChange={(e) => setPromoTargetSemester(e.target.value as 'Ganjil' | 'Genap')}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowPromoModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecutePromotion}
                className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-650 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                Eksekusi Naik Kelas Massal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Riwayat Perkembangan Nilai Santri */}
      {showHistoryModal && selectedStudent && (() => {
        // Compute history entries
        const studentHistory = students
          .filter(s => s.nis === selectedStudent.nis)
          .sort((a, b) => {
            const yearDiff = a.tahunAjaran.localeCompare(b.tahunAjaran);
            if (yearDiff !== 0) return yearDiff;
            return a.semester === 'Ganjil' && b.semester === 'Genap' ? -1 : 1;
          });

        const historyChartData = studentHistory.map(termData => {
          const termLabel = `${termData.tahunAjaran}\n(${termData.semester === 'Ganjil' ? 'Ganjil' : 'Genap'})`;
          const termGrades: Record<string, any> = {
            term: termLabel,
            termData: termData
          };
          
          let totalScore = 0;
          let count = 0;
          
          subjects.forEach(sub => {
            const score = termData.grades[sub.id];
            if (score !== undefined) {
              termGrades[sub.nameId] = score;
              totalScore += score;
              count++;
            }
          });
          
          termGrades['Rata-rata'] = count > 0 ? parseFloat((totalScore / count).toFixed(1)) : 0;
          return termGrades;
        });

        const distinctSubjectNames = Array.from(new Set(
          studentHistory.flatMap(h => Object.keys(h.grades).map(idStr => {
            const sub = subjects.find(s => s.id === parseInt(idStr));
            return sub ? sub.nameId : '';
          }))
        )).filter(Boolean);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-250 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-emerald-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center text-xl shadow-md">
                    🕌
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Riwayat & Perkembangan Nilai: {selectedStudent.nama}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      NIS: <span className="font-bold">{selectedStudent.nis}</span> • No. HP Orang Tua: <span className="font-bold">{selectedStudent.noHpOrangTua || '-'}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowHistoryModal(false); setSelectedStudent(null); }}
                  className="text-slate-500 hover:bg-emerald-150/60 p-2 rounded-lg transition text-sm font-bold"
                >
                  ✕ Tutup
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                
                {/* 1. CHART VIEW */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      📈 Grafik Perkembangan Rapor Santri (Antar Semester)
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">Menampilkan tren Rata-rata & Nilai per Mapel</span>
                  </div>

                  {historyChartData.length <= 1 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium">
                      Belum ada histori semester lain yang tercatat untuk santri ini. Lakukan <strong className="font-bold">Promosi Kenaikan Kelas</strong> untuk meregistrasikan santri ke semester mendatang.
                    </div>
                  ) : (
                    <div className="h-[250px] w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyChartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="term" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <ChartTooltip />
                          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 500 }} />
                          
                          {/* Average line */}
                          <Line
                            type="monotone"
                            dataKey="Rata-rata"
                            stroke="#047857"
                            strokeWidth={4.5}
                            activeDot={{ r: 8 }}
                            name="Rata-rata Nilai"
                          />
                          
                          {/* Subject lines */}
                          {distinctSubjectNames.slice(0, 4).map((name, i) => {
                            const colors = ['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
                            return (
                              <Line
                                key={name}
                                type="monotone"
                                dataKey={name}
                                stroke={colors[i % colors.length]}
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                                name={name}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 2. COMPARISON TABLE */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      📊 Matriks Perbandingan Nilai & Absensi Antar Semester
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                          <th className="p-3">Mata Pelajaran</th>
                          {studentHistory.map(h => (
                            <th key={h.id} className="p-3 text-center border-l border-slate-200">
                              <div className="font-bold text-slate-800">{h.kelas}</div>
                              <div className="text-[10px] text-slate-500 font-medium">TA {h.tahunAjaran} ({h.semester})</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {subjects.map(sub => {
                          // Check if student ever took this subject in any term
                          const hasTaken = studentHistory.some(h => h.grades[sub.id] !== undefined);
                          if (!hasTaken) return null;

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50">
                              <td className="p-3 font-semibold text-slate-800">
                                {sub.nameId} <span className="text-[9px] text-slate-400 block font-normal">{sub.nameAr}</span>
                              </td>
                              {studentHistory.map(h => {
                                const val = h.grades[sub.id];
                                return (
                                  <td key={h.id} className="p-3 text-center border-l border-slate-150 font-bold">
                                    {val !== undefined ? (
                                      <span className={val >= sub.kkm ? "text-emerald-700" : "text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-black"}>
                                        {val}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}

                        {/* Row Rata-rata */}
                        <tr className="bg-emerald-50/20 font-bold border-t-2 border-slate-200">
                          <td className="p-3 text-emerald-900 font-black">RATA-RATA RAPOR</td>
                          {studentHistory.map(h => {
                            let total = 0;
                            let count = 0;
                            subjects.forEach(sub => {
                              if (h.grades[sub.id] !== undefined) {
                                total += h.grades[sub.id];
                                count++;
                              }
                            });
                            const avg = count > 0 ? (total / count).toFixed(1) : '-';
                            return (
                              <td key={h.id} className="p-3 text-center border-l border-emerald-100 text-emerald-800 font-black text-xs">
                                {avg}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row Absensi Sakit */}
                        <tr className="bg-slate-50/30 text-slate-500 text-[11px] border-t border-slate-100">
                          <td className="p-2.5 pl-3">Sakit (Hari)</td>
                          {studentHistory.map(h => (
                            <td key={h.id} className="p-2.5 text-center border-l border-slate-150">{h.sakit}</td>
                          ))}
                        </tr>

                        {/* Row Absensi Izin */}
                        <tr className="bg-slate-50/30 text-slate-500 text-[11px]">
                          <td className="p-2.5 pl-3">Izin (Hari)</td>
                          {studentHistory.map(h => (
                            <td key={h.id} className="p-2.5 text-center border-l border-slate-150">{h.izin}</td>
                          ))}
                        </tr>

                        {/* Row Absensi Alpa */}
                        <tr className="bg-slate-50/30 text-slate-500 text-[11px]">
                          <td className="p-2.5 pl-3">Alpa (Hari)</td>
                          {studentHistory.map(h => (
                            <td key={h.id} className="p-2.5 text-center border-l border-slate-150">
                              <span className={h.alpa > 0 ? "text-red-600 font-bold" : ""}>{h.alpa}</span>
                            </td>
                          ))}
                        </tr>

                        {/* Row Catatan Wali Kelas */}
                        <tr className="bg-slate-50/50 text-slate-600 text-[11px] border-t border-slate-150">
                          <td className="p-3 pl-3 font-semibold text-slate-700">Catatan Wali Kelas</td>
                          {studentHistory.map(h => (
                            <td key={h.id} className="p-3 border-l border-slate-150 leading-relaxed italic text-slate-500 max-w-xs">
                              {h.catatan ? `"${h.catatan}"` : <span className="text-slate-300">Tidak ada catatan</span>}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
