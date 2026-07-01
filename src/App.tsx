import { useState, useEffect } from 'react';
import { 
  Home, Users, BookOpen, Settings, UsersRound, ShieldAlert,
  UserCheck, FileText, ChevronRight, Menu, X, Landmark, GraduationCap,
  User, ScrollText, Table
} from 'lucide-react';
import { 
  Student, Subject, ClassSubject, ClassTeacher, 
  SystemSettings, SystemLog, UserAccount 
} from './types';
import { 
  INITIAL_STUDENTS, INITIAL_SUBJECTS, INITIAL_TEACHERS, 
  INITIAL_SETTINGS, INITIAL_LOGS, INITIAL_USERS, INITIAL_CLASSES 
} from './utils/initialData';
import { dbService } from './lib/db';
import defaultLogo from './assets/images/regenerated_image_1782476438450.png';
import { auth } from './lib/firebase';
import { signInAnonymously } from 'firebase/auth';

// Component Imports
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import SubjectManager from './components/SubjectManager';
import TeacherManager from './components/TeacherManager';
import SettingsManager from './components/SettingsManager';
import UserManager from './components/UserManager';
import RaportPrint from './components/RaportPrint';
import MyProfile from './components/MyProfile';
import LogoUploadModal from './components/LogoUploadModal';
import LogViewer from './components/LogViewer';
import BulkGradeEntry from './components/BulkGradeEntry';

export default function App() {
  // 1. Core States (loaded from LocalStorage or seeded with initialData)
  const [studentsRaw, setStudentsRaw] = useState<Student[]>([]);

  // Safely wrap state setter to ensure we never have duplicate student IDs in memory
  const setStudents = (val: Student[] | ((prev: Student[]) => Student[])) => {
    setStudentsRaw(prev => {
      const newList = typeof val === 'function' ? val(prev) : val;
      const seen = new Set<string>();
      return newList.filter(item => {
        if (!item.id) return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    });
  };

  const students = studentsRaw;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [teachers, setTeachers] = useState<ClassTeacher[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  
  // 2. Navigation / App State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [migrationStatus, setMigrationStatus] = useState<string>('');
  
  // Printing states
  const [printStudentIds, setPrintStudentIds] = useState<string[]>([]);
  
  // Simulation: Active User Profile (Admin vs Teacher Role Switching)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // Sidebar state for mobile layout
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDashboardLogoModal, setShowDashboardLogoModal] = useState(false);
  const [firebaseAuthError, setFirebaseAuthError] = useState<string | null>(null);
  const [useCloudSync, setUseCloudSync] = useState<boolean>(() => {
    const val = localStorage.getItem('raport_use_cloud_sync');
    if (val === null) {
      // Default to true for new devices so they automatically connect to Cloud database
      return true;
    }
    return val === 'true';
  });

  // Initialize and Seed Storage on Mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initFirebaseData = async () => {
      try {
        setIsLoading(true);
        setFirebaseAuthError(null);
        
        const storedSync = localStorage.getItem('raport_use_cloud_sync');
        const isCloudSyncEnabled = storedSync === null ? true : (storedSync === 'true');
        if (storedSync === null) {
          localStorage.setItem('raport_use_cloud_sync', 'true');
        }
        setUseCloudSync(isCloudSyncEnabled);

        if (!isCloudSyncEnabled) {
          // Bypassing Firebase! Load completely from Local Storage
          const storedStudents = localStorage.getItem('raport_students');
          if (storedStudents) setStudents(JSON.parse(storedStudents));
          else setStudents(INITIAL_STUDENTS);

          const storedSubjects = localStorage.getItem('raport_subjects');
          if (storedSubjects) setSubjects(JSON.parse(storedSubjects));
          else setSubjects(INITIAL_SUBJECTS);

          const storedClassSubjects = localStorage.getItem('raport_class_subjects');
          if (storedClassSubjects) setClassSubjects(JSON.parse(storedClassSubjects));
          else {
            const defaultClassSubjects: ClassSubject[] = [];
            INITIAL_CLASSES.forEach(kelas => {
              INITIAL_SUBJECTS.forEach(sub => {
                defaultClassSubjects.push({ kelas, subjectId: sub.id });
              });
            });
            setClassSubjects(defaultClassSubjects);
          }
          
          const storedTeachers = localStorage.getItem('raport_teachers');
          if (storedTeachers) setTeachers(JSON.parse(storedTeachers));
          else setTeachers(INITIAL_TEACHERS);

          const storedSettings = localStorage.getItem('raport_settings');
          if (storedSettings) setSettings(JSON.parse(storedSettings));
          else setSettings(INITIAL_SETTINGS);

          const storedLogs = localStorage.getItem('raport_logs');
          if (storedLogs) setLogs(JSON.parse(storedLogs));
          else setLogs(INITIAL_LOGS);

          const storedUsers = localStorage.getItem('raport_users');
          if (storedUsers) setUsers(JSON.parse(storedUsers));
          else setUsers(INITIAL_USERS);

          // Session check
          const savedSession = localStorage.getItem('raport_logged_in_user');
          if (savedSession) {
            try {
              const u = JSON.parse(savedSession) as UserAccount;
              const freshUsers = storedUsers ? (JSON.parse(storedUsers) as UserAccount[]) : INITIAL_USERS;
              const found = freshUsers.find(x => x.username.toLowerCase() === u.username.toLowerCase());
              if (found) {
                setCurrentUser(found);
                setIsLoggedIn(true);
              }
            } catch (err) {
              console.error("Error reading saved session:", err);
            }
          }
          setIsLoading(false);
          return;
        }

        // --- Cloud Sync Mode ---
        try {
          setIsLoading(true);
          try {
            await signInAnonymously(auth);
          } catch (authErr: any) {
            console.warn("Firebase Anonymous Auth failed, continuing as unauthenticated:", authErr);
          }
          const empty = await dbService.isDatabaseEmpty();
          
          if (empty) {
            // Check if there is data in local storage to upload (migrate)
            const storedStudents = localStorage.getItem('raport_students');
            if (storedStudents && JSON.parse(storedStudents).length > 0) {
              setMigrationStatus('Mengunggah data lokal Anda ke server cloud agar aman dan bisa diakses bersama...');
              
              const localStudents = JSON.parse(storedStudents) as Student[];
              const storedSubjects = localStorage.getItem('raport_subjects');
              const localSubjects = storedSubjects ? JSON.parse(storedSubjects) as Subject[] : INITIAL_SUBJECTS;
              
              const storedClassSubjects = localStorage.getItem('raport_class_subjects');
              const localClassSubjects = storedClassSubjects ? JSON.parse(storedClassSubjects) as ClassSubject[] : (() => {
                const defaultMappings: ClassSubject[] = [];
                INITIAL_CLASSES.forEach(kelas => {
                  INITIAL_SUBJECTS.forEach(sub => {
                    defaultMappings.push({ kelas, subjectId: sub.id });
                  });
                });
                return defaultMappings;
              })();
              
              const storedTeachers = localStorage.getItem('raport_teachers');
              const localTeachers = storedTeachers ? JSON.parse(storedTeachers) as ClassTeacher[] : INITIAL_TEACHERS;
              
              const storedSettings = localStorage.getItem('raport_settings');
              const localSettings = storedSettings ? JSON.parse(storedSettings) as SystemSettings : INITIAL_SETTINGS;
              
              const storedUsers = localStorage.getItem('raport_users');
              const localUsers = storedUsers ? JSON.parse(storedUsers) as UserAccount[] : INITIAL_USERS;
              
              const storedLogs = localStorage.getItem('raport_logs');
              const localLogs = storedLogs ? JSON.parse(storedLogs) as SystemLog[] : INITIAL_LOGS;

              const { compressSettingsImages } = await import('./utils/imageCompressor');
              const compressedSettings = await compressSettingsImages(localSettings);

              const allData = {
                students: localStudents,
                subjects: localSubjects,
                classSubjects: localClassSubjects,
                teachers: localTeachers,
                settings: compressedSettings,
                users: localUsers,
                logs: localLogs
              };

              await dbService.uploadAllData(allData);
              
              localStorage.setItem('raport_students', JSON.stringify(allData.students));
              localStorage.setItem('raport_subjects', JSON.stringify(allData.subjects));
              localStorage.setItem('raport_class_subjects', JSON.stringify(allData.classSubjects));
              localStorage.setItem('raport_teachers', JSON.stringify(allData.teachers));
              localStorage.setItem('raport_settings', JSON.stringify(allData.settings));
              localStorage.setItem('raport_users', JSON.stringify(allData.users));
              localStorage.setItem('raport_logs', JSON.stringify(allData.logs));

              setStudents(allData.students);
              setSubjects(allData.subjects);
              setClassSubjects(allData.classSubjects);
              setTeachers(allData.teachers);
              setSettings(allData.settings);
              setUsers(allData.users);
              setLogs(allData.logs);
            } else {
              setMigrationStatus('Menginisialisasi data awal ke database cloud...');
              const defaultClassSubjects: ClassSubject[] = [];
              INITIAL_CLASSES.forEach(kelas => {
                INITIAL_SUBJECTS.forEach(sub => {
                  defaultClassSubjects.push({ kelas, subjectId: sub.id });
                });
              });

              const allData = {
                students: INITIAL_STUDENTS,
                subjects: INITIAL_SUBJECTS,
                classSubjects: defaultClassSubjects,
                teachers: INITIAL_TEACHERS,
                settings: INITIAL_SETTINGS,
                users: INITIAL_USERS,
                logs: INITIAL_LOGS
              };

              await dbService.uploadAllData(allData);

              localStorage.setItem('raport_students', JSON.stringify(allData.students));
              localStorage.setItem('raport_subjects', JSON.stringify(allData.subjects));
              localStorage.setItem('raport_class_subjects', JSON.stringify(allData.classSubjects));
              localStorage.setItem('raport_teachers', JSON.stringify(allData.teachers));
              localStorage.setItem('raport_settings', JSON.stringify(allData.settings));
              localStorage.setItem('raport_users', JSON.stringify(allData.users));
              localStorage.setItem('raport_logs', JSON.stringify(allData.logs));

              setStudents(allData.students);
              setSubjects(allData.subjects);
              setClassSubjects(allData.classSubjects);
              setTeachers(allData.teachers);
              setSettings(allData.settings);
              setUsers(allData.users);
              setLogs(allData.logs);
            }
          } else {
            // Database is not empty, pull all from cloud
            setMigrationStatus('Mengunduh data dengan database cloud...');
            const [loadedStudents, loadedSubjects, loadedClassSubjects, loadedTeachers, loadedSettings, loadedUsers, loadedLogs] = await Promise.all([
              dbService.getStudents(),
              dbService.getSubjects(),
              dbService.getClassSubjects(),
              dbService.getTeachers(),
              dbService.getSettings(),
              dbService.getUsers(),
              dbService.getLogs()
            ]);

            const initialSettings = loadedSettings || INITIAL_SETTINGS;
            const { compressSettingsImages } = await import('./utils/imageCompressor');
            const finalSettings = await compressSettingsImages(initialSettings);

            if (JSON.stringify(finalSettings) !== JSON.stringify(initialSettings)) {
              await dbService.saveSettings(finalSettings);
            }

            // --- Merging Offline/Local Data to Cloud ---
            let finalUsers = [...loadedUsers];
            try {
              const storedLocalUsers = localStorage.getItem('raport_users');
              if (storedLocalUsers) {
                const localUsersList = JSON.parse(storedLocalUsers) as UserAccount[];
                for (const lu of localUsersList) {
                  const alreadyInCloud = loadedUsers.some(cu => cu.id === lu.id || cu.username.toLowerCase() === lu.username.toLowerCase());
                  if (!alreadyInCloud) {
                    finalUsers.push(lu);
                    dbService.saveUser(lu).catch(e => console.error("Error background syncing user:", e));
                  }
                }
              }
            } catch (mergeErr) {
              console.error("Error merging offline local users:", mergeErr);
            }

            // Ensure we have at least the default INITIAL_USERS if cloud database and local are both empty of users
            if (finalUsers.length === 0) {
              finalUsers = [...INITIAL_USERS];
              for (const iu of INITIAL_USERS) {
                dbService.saveUser(iu).catch(e => console.error("Error background seeding user:", e));
              }
            }

            let finalStudents = [...loadedStudents];
            try {
              const storedLocalStudents = localStorage.getItem('raport_students');
              if (storedLocalStudents) {
                const localStudentsList = JSON.parse(storedLocalStudents) as Student[];
                for (const ls of localStudentsList) {
                  const alreadyInCloud = loadedStudents.some(cs => cs.id === ls.id);
                  if (!alreadyInCloud) {
                    finalStudents.push(ls);
                    dbService.saveStudent(ls).catch(e => console.error("Error background syncing student:", e));
                  }
                }
              }
            } catch (mergeErr) {
              console.error("Error merging offline local students:", mergeErr);
            }

            let finalSubjects = [...loadedSubjects];
            try {
              const storedLocalSubjects = localStorage.getItem('raport_subjects');
              if (storedLocalSubjects) {
                const localSubjectsList = JSON.parse(storedLocalSubjects) as Subject[];
                for (const ls of localSubjectsList) {
                  const alreadyInCloud = loadedSubjects.some(cs => cs.id === ls.id);
                  if (!alreadyInCloud) {
                    finalSubjects.push(ls);
                    dbService.saveSubject(ls).catch(e => console.error("Error background syncing subject:", e));
                  }
                }
              }
            } catch (mergeErr) {
              console.error("Error merging offline local subjects:", mergeErr);
            }

            let finalClassSubjects = [...loadedClassSubjects];
            try {
              const storedLocalClassSubjects = localStorage.getItem('raport_class_subjects');
              if (storedLocalClassSubjects) {
                const localClassSubjectsList = JSON.parse(storedLocalClassSubjects) as ClassSubject[];
                for (const lcs of localClassSubjectsList) {
                  const alreadyInCloud = loadedClassSubjects.some(ccs => ccs.kelas === lcs.kelas && ccs.subjectId === lcs.subjectId);
                  if (!alreadyInCloud) {
                    finalClassSubjects.push(lcs);
                    dbService.addClassSubject(lcs.kelas, lcs.subjectId).catch(e => console.error("Error background syncing class subject:", e));
                  }
                }
              }
            } catch (mergeErr) {
              console.error("Error merging offline local class subjects:", mergeErr);
            }

            let finalTeachers = [...loadedTeachers];
            try {
              const storedLocalTeachers = localStorage.getItem('raport_teachers');
              if (storedLocalTeachers) {
                const localTeachersList = JSON.parse(storedLocalTeachers) as ClassTeacher[];
                for (const lt of localTeachersList) {
                  const alreadyInCloud = loadedTeachers.some(ct => ct.kelas === lt.kelas);
                  if (!alreadyInCloud) {
                    finalTeachers.push(lt);
                    dbService.saveTeacher(lt).catch(e => console.error("Error background syncing teacher:", e));
                  }
                }
              }
            } catch (mergeErr) {
              console.error("Error merging offline local teachers:", mergeErr);
            }

            localStorage.setItem('raport_students', JSON.stringify(finalStudents));
            localStorage.setItem('raport_subjects', JSON.stringify(finalSubjects));
            localStorage.setItem('raport_class_subjects', JSON.stringify(finalClassSubjects));
            localStorage.setItem('raport_teachers', JSON.stringify(finalTeachers));
            localStorage.setItem('raport_settings', JSON.stringify(finalSettings));
            localStorage.setItem('raport_users', JSON.stringify(finalUsers));
            localStorage.setItem('raport_logs', JSON.stringify(loadedLogs));

            setStudents(finalStudents);
            setSubjects(finalSubjects);
            setClassSubjects(finalClassSubjects);
            setTeachers(finalTeachers);
            setSettings(finalSettings);
            setUsers(finalUsers);
            setLogs(loadedLogs);

            // Now resolve logged in user session
            const savedSession = localStorage.getItem('raport_logged_in_user');
            if (savedSession) {
              try {
                const u = JSON.parse(savedSession) as UserAccount;
                const found = finalUsers.find(x => x.username.toLowerCase() === u.username.toLowerCase());
                if (found) {
                  setCurrentUser(found);
                  setIsLoggedIn(true);
                }
              } catch (err) {
                console.error("Error reading saved session:", err);
              }
            }
          }
        } catch (err: any) {
          console.error("Error loading cloud data:", err);
          setFirebaseAuthError('Gagal mengambil data dari database cloud. Silakan coba muat ulang halaman.');
        } finally {
          setIsLoading(false);
          setMigrationStatus('');
        }
      } catch (error: any) {
        console.error("Error connecting to Firebase:", error);
        
        // Automatically disable cloud sync to run smoothly in offline mode
        localStorage.setItem('raport_use_cloud_sync', 'false');
        setUseCloudSync(false);
        
        // Fallback to local storage
        const storedStudents = localStorage.getItem('raport_students');
        if (storedStudents) setStudents(JSON.parse(storedStudents));
        else setStudents(INITIAL_STUDENTS);

        const storedSubjects = localStorage.getItem('raport_subjects');
        if (storedSubjects) setSubjects(JSON.parse(storedSubjects));
        else setSubjects(INITIAL_SUBJECTS);

        const storedClassSubjects = localStorage.getItem('raport_class_subjects');
        if (storedClassSubjects) setClassSubjects(JSON.parse(storedClassSubjects));
        
        const storedTeachers = localStorage.getItem('raport_teachers');
        if (storedTeachers) setTeachers(JSON.parse(storedTeachers));
        else setTeachers(INITIAL_TEACHERS);

        const storedSettings = localStorage.getItem('raport_settings');
        if (storedSettings) setSettings(JSON.parse(storedSettings));
        else setSettings(INITIAL_SETTINGS);

        const storedLogs = localStorage.getItem('raport_logs');
        if (storedLogs) setLogs(JSON.parse(storedLogs));
        else setLogs(INITIAL_LOGS);

        const storedUsers = localStorage.getItem('raport_users');
        if (storedUsers) setUsers(JSON.parse(storedUsers));
        else setUsers(INITIAL_USERS);
        
        setIsLoading(false);
      }
    };

    initFirebaseData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Helper: append a log item
  const addSystemLog = (action: string, details: string) => {
    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      details,
      user: currentUser ? currentUser.fullname : "Sistem"
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem('raport_logs', JSON.stringify(updated));
    dbService.saveLog(newLog).catch(err => console.error("Error saving log to cloud:", err));
  };


  // 3. CRUD actions to bind to localStorage & Cloud Database

  // Students: Add or Update
  const handleSaveStudent = (studentData: Omit<Student, 'id'> & { id?: string }) => {
    if (settings.nilaiRaportSelesai && currentUser?.role !== 'admin') {
      alert("Penginputan nilai semester ini telah ditutup/dikunci oleh Administrator!");
      return;
    }

    // 1. Validate required fields
    if (!studentData.nama || !studentData.nama.trim()) {
      alert("Nama santri tidak boleh kosong!");
      return;
    }
    if (!studentData.kelas || !studentData.kelas.trim()) {
      alert("Kelas santri tidak boleh kosong!");
      return;
    }
    if (!studentData.nis || !studentData.nis.trim()) {
      alert("NIS santri tidak boleh kosong!");
      return;
    }

    // 2. Validate NIS uniqueness per school year (tahunAjaran)
    const normalizedNis = studentData.nis.trim().toLowerCase();
    const duplicateNisStudent = students.find(s => 
      s.id !== studentData.id &&
      s.nis.trim().toLowerCase() === normalizedNis &&
      s.tahunAjaran === studentData.tahunAjaran
    );
    if (duplicateNisStudent) {
      alert(`Gagal menyimpan: NIS "${studentData.nis}" sudah terdaftar untuk santri lain (${duplicateNisStudent.nama}) pada Tahun Ajaran ${studentData.tahunAjaran}!`);
      return;
    }

    // 3. Validate grades (must be integer between 0 and 100)
    if (studentData.grades) {
      for (const [subId, score] of Object.entries(studentData.grades)) {
        const numScore = Number(score);
        if (isNaN(numScore) || !Number.isInteger(numScore) || numScore < 0 || numScore > 100) {
          alert(`Gagal menyimpan: Nilai mata pelajaran harus berupa bilangan bulat antara 0 - 100!`);
          return;
        }
      }
    }

    let updatedList: Student[] = [];
    let updatedStudent: Student;

    if (studentData.id) {
      // Edit mode
      const existing = students.find(s => s.id === studentData.id);
      if (currentUser?.role === 'teacher' && existing?.createdBy && existing.createdBy !== currentUser.username) {
        alert("Anda tidak memiliki hak untuk mengedit santri ini karena santri ini ditambahkan oleh guru lain!");
        return;
      }
      updatedStudent = { ...studentData } as Student;
      updatedList = students.map(s => s.id === studentData.id ? updatedStudent : s);
      addSystemLog("Ubah Santri", `Memperbarui data dan nilai santri: ${studentData.nama} (NIS: ${studentData.nis})`);
    } else {
      // Add mode
      const newId = `stud-${Date.now()}`;
      updatedStudent = {
        ...studentData,
        id: newId,
        createdBy: currentUser?.username || 'system'
      } as Student;
      updatedList = [updatedStudent, ...students];
      addSystemLog("Tambah Santri", `Menambahkan santri baru: ${studentData.nama} (NIS: ${studentData.nis})`);
    }

    setStudents(updatedList);
    localStorage.setItem('raport_students', JSON.stringify(updatedList));
    dbService.saveStudent(updatedStudent).catch(err => console.error("Error saving student to cloud:", err));
    setEditingStudentId(null);
    setActiveTab('students');
  };

  const handleBulkSaveStudents = async (updatedStudentsList: Student[]) => {
    if (settings.nilaiRaportSelesai && currentUser?.role !== 'admin') {
      alert("Penginputan nilai semester ini telah ditutup/dikunci oleh Administrator!");
      return;
    }

    // Validate all records first before saving
    for (const st of updatedStudentsList) {
      if (!st.nama || !st.nama.trim()) {
        alert("Gagal Impor: Ditemukan data santri dengan Nama kosong!");
        return;
      }
      if (!st.kelas || !st.kelas.trim()) {
        alert(`Gagal Impor: Santri bernama "${st.nama}" memiliki data Kelas yang kosong!`);
        return;
      }
      if (!st.nis || !st.nis.trim()) {
        alert(`Gagal Impor: Santri bernama "${st.nama}" memiliki data NIS yang kosong!`);
        return;
      }

      // NIS Uniqueness per school year (tahunAjaran) check in the list
      const duplicateInList = updatedStudentsList.some(other => 
        other.id !== st.id && 
        other.nis.trim().toLowerCase() === st.nis.trim().toLowerCase() && 
        other.tahunAjaran === st.tahunAjaran
      );
      if (duplicateInList) {
        alert(`Gagal Impor: Ditemukan NIS ganda "${st.nis}" pada Tahun Ajaran ${st.tahunAjaran} di dalam file impor Anda!`);
        return;
      }

      // Check grades validation
      if (st.grades) {
        for (const [subId, score] of Object.entries(st.grades)) {
          const numScore = Number(score);
          if (isNaN(numScore) || !Number.isInteger(numScore) || numScore < 0 || numScore > 100) {
            alert(`Gagal Impor: Nilai mata pelajaran santri "${st.nama}" harus berupa angka bulat 0 - 100!`);
            return;
          }
        }
      }
    }

    // For bulk import, set createdBy for newly added students if they don't have it
    const processedList = updatedStudentsList.map(st => {
      if (!st.createdBy) {
        return { ...st, createdBy: currentUser?.username || 'system' };
      }
      return st;
    });

    setStudents(processedList);
    localStorage.setItem('raport_students', JSON.stringify(processedList));
    
    addSystemLog("Impor Masal Excel", `Melakukan impor data masal untuk ${processedList.length} santri`);
    
    try {
      await dbService.saveStudentsBatch(processedList);
    } catch (err) {
      console.error("Error bulk saving students to cloud:", err);
      alert("Gagal menyimpan beberapa data ke database cloud, tetapi data lokal berhasil diperbarui.");
    }
  };

  // Student Delete
  const handleDeleteStudent = (id: string) => {
    if (settings.nilaiRaportSelesai && currentUser?.role !== 'admin') {
      alert("Penginputan nilai semester ini telah ditutup/dikunci oleh Administrator!");
      return;
    }

    const student = students.find(s => s.id === id);
    if (!student) return;

    if (currentUser?.role === 'teacher' && student.createdBy && student.createdBy !== currentUser.username) {
      alert("Anda tidak memiliki hak untuk menghapus santri ini karena santri ini ditambahkan oleh guru lain!");
      return;
    }

    if (confirm(`Yakin ingin menghapus seluruh data raport milik ${student.nama}?`)) {
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      localStorage.setItem('raport_students', JSON.stringify(updated));
      dbService.deleteStudent(id).catch(err => console.error("Error deleting student from cloud:", err));
      addSystemLog("Hapus Santri", `Menghapus santri: ${student.nama} (NIS: ${student.nis})`);
    }
  };

  // Subject Add Global
  const handleAddGlobalSubject = (nameId: string, nameAr: string, kkm: number, category?: 'A' | 'B' | 'C') => {
    const nextId = subjects.length > 0 ? Math.max(...subjects.map(s => s.id)) + 1 : 1;
    const newSub: Subject = { id: nextId, nameId, nameAr, kkm, category: category || 'A' };
    const updated = [...subjects, newSub];
    
    setSubjects(updated);
    localStorage.setItem('raport_subjects', JSON.stringify(updated));
    dbService.saveSubject(newSub).catch(err => console.error("Error saving subject to cloud:", err));

    // Automatically link this new subject to all registered classes
    const uniqueClasses = Array.from(new Set(teachers.map(t => t.kelas)));
    const newMappings = [...classSubjects];
    uniqueClasses.forEach(kelas => {
      newMappings.push({ kelas, subjectId: nextId });
    });
    setClassSubjects(newMappings);
    localStorage.setItem('raport_class_subjects', JSON.stringify(newMappings));
    dbService.saveClassSubjects(newMappings).catch(err => console.error("Error saving class subjects to cloud:", err));

    addSystemLog("Tambah Mapel Global", `Mata pelajaran baru ditambahkan: ${nameId} (${nameAr})`);
  };

  // Subject Delete Global
  const handleDeleteGlobalSubject = (id: number) => {
    if (currentUser?.role !== 'admin') {
      alert("Hanya Administrator yang diperbolehkan menghapus mata pelajaran secara global!");
      return;
    }

    const sub = subjects.find(s => s.id === id);
    if (!sub) return;

    if (confirm(`Menghapus mapel "${sub.nameId}" secara global juga akan menghapus hubungannya di semua jenjang kelas dan nilai rapor siswa. Lanjutkan?`)) {
      const updatedSubs = subjects.filter(s => s.id !== id);
      setSubjects(updatedSubs);
      localStorage.setItem('raport_subjects', JSON.stringify(updatedSubs));
      dbService.deleteSubject(id).catch(err => console.error("Error deleting subject from cloud:", err));

      // Remove mappings
      const updatedMappings = classSubjects.filter(cs => cs.subjectId !== id);
      setClassSubjects(updatedMappings);
      localStorage.setItem('raport_class_subjects', JSON.stringify(updatedMappings));
      for (const cs of classSubjects) {
        if (cs.subjectId === id) {
          dbService.removeClassSubject(cs.kelas, cs.subjectId).catch(err => console.error("Error removing class subject from cloud:", err));
        }
      }

      addSystemLog("Hapus Mapel Global", `Menghapus mata pelajaran global ID: ${id}`);
    }
  };

  // Subject link to class
  const handleAddSubjectToClass = (kelas: string, subjectId: number) => {
    if (currentUser?.role === 'teacher') {
      const managedClasses = teachers
        .filter(t => t.waliKelas.toLowerCase() === currentUser.fullname.toLowerCase())
        .map(t => t.kelas);
      if (!managedClasses.includes(kelas)) {
        alert("Anda tidak memiliki hak untuk menghubungkan mata pelajaran ke kelas ini!");
        return;
      }
    }

    // Check if mapping already exists
    const exists = classSubjects.some(cs => cs.kelas === kelas && cs.subjectId === subjectId);
    if (exists) {
      alert("Mata pelajaran sudah terhubung ke kelas tersebut!");
      return;
    }

    const updated = [...classSubjects, { kelas, subjectId }];
    setClassSubjects(updated);
    localStorage.setItem('raport_class_subjects', JSON.stringify(updated));
    dbService.addClassSubject(kelas, subjectId).catch(err => console.error("Error adding class subject to cloud:", err));
    addSystemLog("Hubung Mapel", `Menghubungkan mapel ke kelas ${kelas}`);
  };

  // Subject remove from class
  const handleRemoveSubjectFromClass = (kelas: string, subjectId: number) => {
    if (currentUser?.role === 'teacher') {
      const managedClasses = teachers
        .filter(t => t.waliKelas.toLowerCase() === currentUser.fullname.toLowerCase())
        .map(t => t.kelas);
      if (!managedClasses.includes(kelas)) {
        alert("Anda tidak memiliki hak untuk menghapus mata pelajaran dari kelas ini!");
        return;
      }
    }

    const updated = classSubjects.filter(cs => !(cs.kelas === kelas && cs.subjectId === subjectId));
    setClassSubjects(updated);
    localStorage.setItem('raport_class_subjects', JSON.stringify(updated));
    dbService.removeClassSubject(kelas, subjectId).catch(err => console.error("Error removing class subject from cloud:", err));
    addSystemLog("Hapus Hubungan Mapel", `Memutus mapel dari kelas ${kelas}`);
  };

  // Wali Kelas Add
  const handleAddTeacher = (kelas: string, waliKelas: string) => {
    const exists = teachers.some(t => t.kelas.toLowerCase() === kelas.toLowerCase());
    if (exists) {
      alert("Kelas sudah terdaftar!");
      return;
    }

    const newTeacher = { kelas, waliKelas };
    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    localStorage.setItem('raport_teachers', JSON.stringify(updated));
    dbService.saveTeacher(newTeacher).catch(err => console.error("Error saving teacher to cloud:", err));
    addSystemLog("Tambah Wali Kelas", `Menambahkan wali kelas untuk ${kelas}: ${waliKelas}`);
  };

  // Wali Kelas Update
  const handleUpdateTeacher = (kelas: string, waliKelas: string) => {
    const updatedTeacher = { kelas, waliKelas };
    const updated = teachers.map(t => t.kelas === kelas ? updatedTeacher : t);
    setTeachers(updated);
    localStorage.setItem('raport_teachers', JSON.stringify(updated));
    dbService.saveTeacher(updatedTeacher).catch(err => console.error("Error updating teacher to cloud:", err));
    addSystemLog("Update Wali Kelas", `Mengubah wali kelas ${kelas} menjadi ${waliKelas}`);
  };

  // Wali Kelas Delete
  const handleDeleteTeacher = (kelas: string) => {
    if (confirm(`Hapus data tanggung jawab wali kelas untuk ${kelas}?`)) {
      const updated = teachers.filter(t => t.kelas !== kelas);
      setTeachers(updated);
      localStorage.setItem('raport_teachers', JSON.stringify(updated));
      dbService.deleteTeacher(kelas).catch(err => console.error("Error deleting teacher from cloud:", err));
      addSystemLog("Hapus Wali Kelas", `Menghapus wali kelas untuk ${kelas}`);
    }
  };

  // Settings Save
  const handleSaveSettings = async (updatedSettings: SystemSettings) => {
    try {
      const { compressSettingsImages } = await import('./utils/imageCompressor');
      const compressed = await compressSettingsImages(updatedSettings);
      setSettings(compressed);
      localStorage.setItem('raport_settings', JSON.stringify(compressed));
      dbService.saveSettings(compressed).catch(err => console.error("Error saving settings to cloud:", err));
      addSystemLog("Update Pengaturan", "Memperbarui identitas dan pejabat tanda tangan sekolah.");
    } catch (e) {
      console.error("Error compressing settings images:", e);
      setSettings(updatedSettings);
      localStorage.setItem('raport_settings', JSON.stringify(updatedSettings));
      dbService.saveSettings(updatedSettings).catch(err => console.error("Error saving settings to cloud:", err));
      addSystemLog("Update Pengaturan", "Memperbarui identitas dan pejabat tanda tangan sekolah (tanpa kompresi).");
    }
  };

  const handleSaveLogo = async (newLogoBase64: string) => {
    const updatedSettings = { ...settings, logoSekolah: newLogoBase64 };
    setSettings(updatedSettings);
    localStorage.setItem('raport_settings', JSON.stringify(updatedSettings));
    dbService.saveSettings(updatedSettings).catch(err => console.error("Error saving updated logo settings to cloud:", err));
    addSystemLog("Update Logo", "Memperbarui logo utama madrasah.");
  };

  const handleToggleCloudSync = (enabled: boolean) => {
    localStorage.setItem('raport_use_cloud_sync', enabled ? 'true' : 'false');
    setUseCloudSync(enabled);
    if (enabled) {
      alert("Fitur Sinkronisasi Cloud diaktifkan! Aplikasi akan mencoba menghubungkan ke database cloud Firebase Anda saat menyegarkan halaman.");
    } else {
      alert("Mode Offline (Penyimpanan Lokal) diaktifkan! Semua data hanya disimpan di browser komputer ini tanpa koneksi ke Firebase.");
    }
    window.location.reload();
  };

  const handleClearLogs = async () => {
    setLogs([]);
    localStorage.setItem('raport_logs', JSON.stringify([]));
    dbService.clearAllLogs().catch(err => console.error("Error clearing logs on cloud:", err));
    addSystemLog("Kosongkan Log", "Mengosongkan seluruh riwayat log aktivitas.");
  };

  const handleRestoreData = async (backupData: any) => {
    try {
      const data = backupData.data;
      if (!data) throw new Error("Format data cadangan tidak dikenali.");

      if (data.students) {
        setStudents(data.students);
        localStorage.setItem('raport_students', JSON.stringify(data.students));
      }
      if (data.subjects) {
        setSubjects(data.subjects);
        localStorage.setItem('raport_subjects', JSON.stringify(data.subjects));
      }
      if (data.classSubjects) {
        setClassSubjects(data.classSubjects);
        localStorage.setItem('raport_class_subjects', JSON.stringify(data.classSubjects));
      }
      if (data.teachers) {
        setTeachers(data.teachers);
        localStorage.setItem('raport_teachers', JSON.stringify(data.teachers));
      }
      if (data.settings) {
        setSettings(data.settings);
        localStorage.setItem('raport_settings', JSON.stringify(data.settings));
      }
      if (data.users) {
        setUsers(data.users);
        localStorage.setItem('raport_users', JSON.stringify(data.users));
      }
      if (data.logs) {
        setLogs(data.logs);
        localStorage.setItem('raport_logs', JSON.stringify(data.logs));
      }

      await dbService.uploadAllData({
        students: data.students || [],
        subjects: data.subjects || [],
        classSubjects: data.classSubjects || [],
        teachers: data.teachers || [],
        settings: data.settings || settings,
        users: data.users || [],
        logs: data.logs || []
      });

      addSystemLog("Pulihkan Data", `Memulihkan basis data penuh dari cadangan tertanggal ${new Date(backupData.backupDate).toLocaleString()}`);
      alert("Pemulihan basis data berhasil! Seluruh data disinkronkan ke cloud.");
    } catch (err: any) {
      console.error(err);
      alert(`Gagal memulihkan data: ${err.message || 'Format tidak valid'}`);
    }
  };

  const handleToggleLock = async () => {
    try {
      const updatedSettings = { ...settings, nilaiRaportSelesai: !settings.nilaiRaportSelesai };
      setSettings(updatedSettings);
      localStorage.setItem('raport_settings', JSON.stringify(updatedSettings));
      await dbService.saveSettings(updatedSettings);
      
      const statusStr = updatedSettings.nilaiRaportSelesai ? "TERKUNCI / SELESAI INPUT" : "DIBUKA UNTUK EDIT";
      addSystemLog("Kunci Semester", `Mengubah status input nilai menjadi: ${statusStr}`);
    } catch (err) {
      console.error("Error toggling lock:", err);
      alert("Gagal menyimpan status kunci semester ke database cloud.");
    }
  };

  const handleAdvanceSemester = async (nextSettings: SystemSettings, enrollStudents: boolean) => {
    try {
      setSettings(nextSettings);
      localStorage.setItem('raport_settings', JSON.stringify(nextSettings));
      await dbService.saveSettings(nextSettings);

      let logDetails = `Mengubah periode aktif menjadi Semester ${nextSettings.semester} TA ${nextSettings.tahunAjaran}.`;

      if (enrollStudents) {
        // Clone active students of previous semester/year to the new semester/year
        const activeStudents = students.filter(s => s.semester === settings.semester && s.tahunAjaran === settings.tahunAjaran);
        
        const newSemesterStudents: Student[] = activeStudents.map((s, index) => ({
          ...s,
          id: `stud-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`, // ensure unique IDs
          semester: nextSettings.semester,
          tahunAjaran: nextSettings.tahunAjaran,
          sakit: 0,
          izin: 0,
          alpa: 0,
          catatan: '',
          grades: {},
          akhlaq: '',
          kerajinan: '',
          kedisiplinan: '',
          kerapihan: '',
          createdBy: currentUser?.username || 'system'
        }));

        if (newSemesterStudents.length > 0) {
          const mergedStudents = [...newSemesterStudents, ...students];
          setStudents(mergedStudents);
          localStorage.setItem('raport_students', JSON.stringify(mergedStudents));
          await dbService.saveStudentsBatch(newSemesterStudents);
          logDetails += ` Berhasil menyalin ulang ${newSemesterStudents.length} santri aktif ke semester baru dengan nilai dikosongkan.`;
        }
      }

      addSystemLog("Lanjut Semester Baru", logDetails);
    } catch (err) {
      console.error("Error advancing semester:", err);
      alert("Terjadi kesalahan saat memproses kenaikan semester ke database cloud.");
    }
  };

  // User Accounts Add
  const handleAddUser = async (fullname: string, username: string, role: 'admin' | 'teacher', password?: string, email?: string) => {
    const exists = users.some(u => u.username === username);
    if (exists) {
      alert("Username sudah digunakan oleh guru lain!");
      return;
    }

    let hashedPassword = password;
    if (password) {
      const { hashPassword } = await import('./utils/hash');
      hashedPassword = await hashPassword(password);
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      username,
      fullname,
      role,
      password: hashedPassword,
      email: email || undefined
    };

    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('raport_users', JSON.stringify(updated));

    if (useCloudSync) {
      try {
        await dbService.saveUser(newUser);
        addSystemLog("Tambah Pengguna", `Membuat akun guru baru: ${fullname} (${username}) (Sinkron ke Cloud)`);
        alert(`Akun untuk ${fullname} berhasil disimpan dan disinkronkan ke Cloud!`);
      } catch (err) {
        console.error("Error saving user to cloud:", err);
        alert("Peringatan: Akun berhasil disimpan di perangkat ini, namun GAGAL disinkronkan ke Cloud. Silakan periksa koneksi internet atau lakukan 'Sinkronkan Semua Akun ke Cloud' nanti.");
        addSystemLog("Tambah Pengguna", `Membuat akun guru baru: ${fullname} (${username}) (Gagal Sinkron Cloud)`);
      }
    } else {
      addSystemLog("Tambah Pengguna", `Membuat akun guru baru: ${fullname} (${username}) (Lokal saja)`);
      alert(`Akun untuk ${fullname} berhasil disimpan di perangkat ini!`);
    }
  };

  // User Accounts Update Password
  const handleUpdatePassword = async (id: string, newPassword: string) => {
    const u = users.find(account => account.id === id);
    if (!u) return;
    
    const { hashPassword } = await import('./utils/hash');
    const hashedPassword = await hashPassword(newPassword);

    const updatedUser = { ...u, password: hashedPassword };
    const updated = users.map(account => account.id === id ? updatedUser : account);
    setUsers(updated);
    localStorage.setItem('raport_users', JSON.stringify(updated));

    if (useCloudSync) {
      try {
        await dbService.saveUser(updatedUser);
        alert(`Password untuk ${u.fullname} berhasil diubah di lokal & disinkronkan ke Cloud!`);
      } catch (err) {
        console.error("Error updating password on cloud:", err);
        alert("Peringatan: Password berhasil diubah di perangkat ini, namun GAGAL disinkronkan ke Cloud.");
      }
    } else {
      alert(`Password untuk ${u.fullname} berhasil diubah!`);
    }
    addSystemLog("Ubah Password", `Mengubah password untuk akun guru: ${u.fullname}`);
  };

  // User Accounts Update Google Email
  const handleUpdateEmail = async (id: string, newEmail: string) => {
    const u = users.find(account => account.id === id);
    if (!u) return;

    const updatedUser = { ...u, email: newEmail.trim() || undefined };
    const updated = users.map(account => account.id === id ? updatedUser : account);
    setUsers(updated);
    localStorage.setItem('raport_users', JSON.stringify(updated));

    if (useCloudSync) {
      try {
        await dbService.saveUser(updatedUser);
        alert(`Email Google untuk ${u.fullname} berhasil diupdate di lokal & disinkronkan ke Cloud!`);
      } catch (err) {
        console.error("Error updating email on cloud:", err);
        alert("Peringatan: Email Google berhasil diupdate di perangkat ini, namun GAGAL disinkronkan ke Cloud.");
      }
    } else {
      alert(`Email Google untuk ${u.fullname} berhasil diupdate!`);
    }
    addSystemLog("Ubah Email Google", `Mengubah email Google untuk akun guru: ${u.fullname} menjadi ${newEmail}`);
  };

  // User Accounts Delete
  const handleDeleteUser = async (id: string) => {
    const u = users.find(account => account.id === id);
    if (!u) return;

    if (confirm(`Hapus hak akses login untuk guru ${u.fullname}?`)) {
      const updated = users.filter(account => account.id !== id);
      setUsers(updated);
      localStorage.setItem('raport_users', JSON.stringify(updated));

      if (useCloudSync) {
        try {
          await dbService.deleteUser(id);
          alert(`Akun ${u.fullname} berhasil dihapus dari lokal & Cloud!`);
        } catch (err) {
          console.error("Error deleting user from cloud:", err);
          alert("Peringatan: Akun berhasil dihapus dari perangkat ini, namun gagal dihapus dari Cloud.");
        }
      } else {
        alert(`Akun ${u.fullname} berhasil dihapus!`);
      }
      addSystemLog("Hapus Pengguna", `Menghapus akun guru: ${u.fullname}`);
    }
  };

  // Sync All Users manually
  const handleSyncAllUsersToCloud = async () => {
    if (!useCloudSync) {
      alert("Fitur Sinkronisasi Cloud belum diaktifkan. Silakan aktifkan Sinkronisasi Cloud terlebih dahulu di tab Pengaturan Lembaga.");
      return;
    }
    try {
      setIsLoading(true);
      for (const u of users) {
        await dbService.saveUser(u);
      }
      alert("Alhamdulillah! Berhasil menyinkronkan seluruh daftar akun guru ke database Cloud Firestore Firebase.");
    } catch (err: any) {
      console.error("Gagal sinkron akun:", err);
      alert(`Gagal menyinkronkan akun guru ke Cloud: ${err.message || "Error tidak diketahui"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedUser: UserAccount) => {
    // Sync fullname changes with Wali Kelas list
    const oldFullname = currentUser?.fullname;
    if (currentUser?.role === 'teacher' && oldFullname && oldFullname !== updatedUser.fullname) {
      const updatedTeachers = teachers.map(t => {
        if (t.waliKelas.toLowerCase() === oldFullname.toLowerCase()) {
          return { ...t, waliKelas: updatedUser.fullname };
        }
        return t;
      });
      setTeachers(updatedTeachers);
      localStorage.setItem('raport_teachers', JSON.stringify(updatedTeachers));
      
      // Persist changes to Firebase
      for (const t of updatedTeachers) {
        if (t.waliKelas === updatedUser.fullname) {
          dbService.saveTeacher(t).catch(err => console.error("Error saving updated teacher to cloud on name change:", err));
        }
      }
    }

    // 1. Update users array
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem('raport_users', JSON.stringify(updatedUsers));

    // 2. Update current logged-in user
    setCurrentUser(updatedUser);
    localStorage.setItem('raport_logged_in_user', JSON.stringify(updatedUser));

    // 3. Save to database cloud
    await dbService.saveUser(updatedUser);

    // 4. Log
    addSystemLog("Update Profil", `Mengubah rincian profil pribadi: ${updatedUser.fullname}`);
  };

  // Quick triggers from list
  const handleEditStudentClick = (id: string) => {
    setEditingStudentId(id);
    setActiveTab('add-student');
  };

  const handleViewRaportClick = (id: string) => {
    setPrintStudentIds([id]);
    setActiveTab('raport-print');
  };

  const handlePrintClassClick = (kelasName: string) => {
    const classStudentIds = students
      .filter(s => s.kelas === kelasName)
      .map(s => s.id);
    
    if (classStudentIds.length === 0) {
      alert(`Belum ada santri terdaftar di kelas ${kelasName}!`);
      return;
    }

    setPrintStudentIds(classStudentIds);
    setActiveTab('raport-print');
  };

  const handlePrintMultipleStudents = (studentIds: string[]) => {
    if (studentIds.length === 0) {
      alert("Pilih santri terlebih dahulu!");
      return;
    }
    setPrintStudentIds(studentIds);
    setActiveTab('raport-print');
  };

  const selectedStudentToEdit = students.find(s => s.id === editingStudentId);

  // Get list of all available classes
  const allClasses = Array.from(new Set(teachers.map(t => t.kelas))) as string[];

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'students', label: 'Data Santri', icon: Users },
    { id: 'bulk-grades', label: 'Input Nilai Massal', icon: Table },
    { id: 'profile', label: 'Profil Saya', icon: User },
  ];

  // 4. Return loading state if initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Traditional Islamic Arch Background Effect */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
          <div className="w-[800px] h-[800px] rounded-full border-[32px] border-emerald-900" />
          <div className="absolute w-[600px] h-[600px] rounded-full border-[16px] border-emerald-800 rotate-45" />
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 text-center space-y-6 relative z-10">
          <div className="mx-auto h-20 w-20 rounded-full border-4 border-emerald-800/10 border-t-emerald-800 animate-spin flex items-center justify-center mb-2">
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-800 font-bold text-lg animate-pulse">
              🕌
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">PPTQ AL-HUSNA BUKIT RAJA WALI</h2>
            <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Menghubungkan ke Database Cloud...</p>
            {migrationStatus && (
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed mt-2 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 animate-pulse">
                🔄 {migrationStatus}
              </p>
            )}
          </div>
          
          <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
            Sistem Laporan Hasil Belajar Madrasah Diniyah &copy; 2026
          </div>
        </div>
      </div>
    );
  }

  // 5. Return Login component if not authenticated
  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        {firebaseAuthError && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-800 text-xs shadow-sm z-50">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-sm shrink-0">⚠️</span>
                <span>{firebaseAuthError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFirebaseAuthError(null)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] transition shadow active:scale-95 cursor-pointer shrink-0"
              >
                ✕ Mengerti & Tutup
              </button>
            </div>
          </div>
        )}
        <Login
          users={users}
          settings={settings}
          useCloudSync={useCloudSync}
          onSaveLogo={handleSaveLogo}
          onRefreshUsers={async () => {
            const freshUsers = await dbService.getUsers();
            setUsers(freshUsers);
            localStorage.setItem('raport_users', JSON.stringify(freshUsers));
            return freshUsers;
          }}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
            localStorage.setItem('raport_logged_in_user', JSON.stringify(user));
            
            // Automatically save upgraded password hash to users collection if it changed
            const userInList = users.find(u => u.id === user.id);
            if (userInList && userInList.password !== user.password) {
              const updatedUsers = users.map(u => u.id === user.id ? { ...u, password: user.password } : u);
              setUsers(updatedUsers);
              localStorage.setItem('raport_users', JSON.stringify(updatedUsers));
              dbService.saveUser({ ...userInList, password: user.password }).catch(err => {
                console.error("Failed to persist upgraded hashed password to firestore:", err);
              });
            }

            // Log success
            const newLog: SystemLog = {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              action: "Login Pengguna",
              details: `Guru ${user.fullname} berhasil masuk ke sistem.`,
              user: user.fullname
            };
            setLogs(prev => {
              const updated = [newLog, ...prev];
              localStorage.setItem('raport_logs', JSON.stringify(updated));
              return updated;
            });
          }}
        />
      </div>
    );
  }

  if (currentUser.role === 'admin') {
    navItems.push(
      { id: 'subjects', label: 'Kurikulum & KKM', icon: BookOpen },
      { id: 'teachers', label: 'Wali Kelas', icon: UserCheck },
      { id: 'settings', label: 'Sistem & Gambar', icon: Settings },
      { id: 'users', label: 'Hak Akses Guru', icon: UsersRound },
      { id: 'logs', label: 'Log Aktivitas', icon: ScrollText }
    );
  } else if (currentUser.role === 'teacher') {
    navItems.push(
      { id: 'subjects', label: 'Kurikulum & KKM', icon: BookOpen }
    );
  }

  // Fallback to dashboard if a restricted user tries to access an administrative tab
  const isTabAllowed = navItems.some(item => item.id === activeTab || (activeTab === 'add-student' && item.id === 'students') || activeTab === 'raport-print');
  const currentActiveTab = isTabAllowed ? activeTab : 'dashboard';

  // Active Print Tab Overrides Layout
  if (activeTab === 'raport-print') {
    return (
      <RaportPrint
        studentIds={printStudentIds}
        students={students}
        subjects={subjects}
        classSubjects={classSubjects}
        teachers={teachers}
        settings={settings}
        onBack={() => {
          setActiveTab('students');
          setPrintStudentIds([]);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* 1. TOP HEADER BRAND BAR */}
      <header className="gradient-header bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white shadow-md z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <div 
              onClick={() => currentUser?.role === 'admin' && setShowDashboardLogoModal(true)}
              className={`h-10 w-10 rounded-full bg-white flex items-center justify-center p-1.5 shadow-md relative group ${
                currentUser?.role === 'admin' ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400 transition' : ''
              }`}
              title={currentUser?.role === 'admin' ? 'Ubah Logo Utama (Hapus Latar Belakang)' : undefined}
            >
              <img src={settings.logoSekolah || defaultLogo} alt="Logo" className="h-full w-full object-contain group-hover:scale-90 transition duration-200" />
              {currentUser?.role === 'admin' && (
                <div className="absolute inset-0 bg-emerald-950/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150">
                  <span className="text-[7px] text-white font-extrabold uppercase text-center leading-tight">Ubah</span>
                </div>
              )}
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block">PPTQ AL-HUSNA BUKIT RAJA WALI</span>
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Aplikasi Raport Madrasah Diniyah</span>
            </div>
          </div>

          <div className="flex items-center gap-4">

            {/* Current user badge */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setActiveTab('profile');
                  setEditingStudentId(null);
                }}
                className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/15 text-white hover:bg-white/25 transition cursor-pointer"
              >
                {currentUser?.photo ? (
                  <img src={currentUser.photo} alt="Foto Profil" className="h-5 w-5 rounded-full object-cover border border-white/20" />
                ) : (
                  <span>👤</span>
                )}
                <span>{currentUser?.fullname}</span>
              </button>
              
              <button
                onClick={() => {
                  if (confirm("Apakah Anda yakin ingin keluar?")) {
                    localStorage.removeItem('raport_logged_in_user');
                    setCurrentUser(null);
                    setIsLoggedIn(false);
                  }
                }}
                className="hidden md:inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-600/95 hover:bg-rose-500 text-white cursor-pointer transition shadow-sm"
              >
                <span>Keluar</span>
                <span>🚪</span>
              </button>
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-white/10 text-white sm:hidden transition"
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {firebaseAuthError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-800 text-xs shadow-sm z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-semibold">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-base">⚠️</span>
              <span>{firebaseAuthError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFirebaseAuthError(null)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] transition shadow active:scale-95 cursor-pointer shrink-0"
            >
              ✕ Mengerti & Tutup
            </button>
          </div>
        </div>
      )}



      <div className="max-w-7xl w-full mx-auto flex flex-1 flex-col sm:flex-row px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* 2. SIDEBAR NAVIGATION */}
        <aside className="sm:w-64 flex flex-col shrink-0">
          
          {/* Desktop Nav Card */}
          <div className="hidden sm:flex flex-col bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 space-y-1 sticky top-24">
            <div className="p-3 mb-2 bg-emerald-50 rounded-xl flex items-center gap-2">
              <GraduationCap size={22} className="text-emerald-800" />
              <div>
                <p className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">Tahun Ajaran</p>
                <p className="text-xs font-bold text-emerald-800">{settings.tahunAjaran} ({settings.semester})</p>
              </div>
            </div>

            {navItems.map(item => {
              const IconComp = item.icon;
              const isActive = currentActiveTab === item.id || (item.id === 'students' && currentActiveTab === 'add-student');

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setEditingStudentId(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold tracking-tight transition duration-150 ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/10'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={14} className={isActive ? 'text-white/70' : 'text-slate-300'} />
                </button>
              );
            })}
          </div>

          {/* Mobile Navigation Drawer Overlay */}
          {isMobileMenuOpen && (
            <div className="sm:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-6 shadow-2xl flex flex-col space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="font-black text-emerald-950 text-sm">Menu Raport</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded hover:bg-slate-100">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-1.5 flex-1">
                  {navItems.map(item => {
                    const IconComp = item.icon;
                    const isActive = currentActiveTab === item.id || (item.id === 'students' && currentActiveTab === 'add-student');

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setEditingStudentId(null);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                          isActive
                            ? 'bg-emerald-800 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <IconComp size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                  
                  {/* Mobile Logout Button */}
                  <button
                    onClick={() => {
                      if (confirm("Apakah Anda yakin ingin keluar?")) {
                        localStorage.removeItem('raport_logged_in_user');
                        setCurrentUser(null);
                        setIsLoggedIn(false);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <span>🚪</span>
                    <span>Keluar dari Sistem</span>
                  </button>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl text-center text-xs text-emerald-800 font-bold">
                  {settings.tahunAjaran} • Semester {settings.semester}
                </div>
              </div>
            </div>
          )}

        </aside>

        {/* 3. MAIN WORKSPACE */}
        <main className="flex-1 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 sm:p-8 relative min-h-[500px]">
          
          {currentActiveTab === 'dashboard' && (
            <Dashboard
              students={students}
              subjects={subjects}
              logs={logs}
              settings={settings}
              userRole={currentUser.role}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setEditingStudentId(null);
              }}
              onSelectStudent={(id) => handleViewRaportClick(id)}
            />
          )}

          {currentActiveTab === 'students' && (
            <StudentList
              students={students}
              teachers={teachers}
              subjects={subjects}
              classSubjects={classSubjects}
              settings={settings}
              userRole={currentUser.role}
              currentUser={currentUser}
              activeSemester={settings.semester}
              activeTahunAjaran={settings.tahunAjaran}
              onNavigate={(tab) => setActiveTab(tab)}
              onEditStudent={handleEditStudentClick}
              onDeleteStudent={handleDeleteStudent}
              onViewRaport={handleViewRaportClick}
              onPrintClass={handlePrintClassClick}
              onBulkSaveStudents={handleBulkSaveStudents}
              onPrintMultipleStudents={handlePrintMultipleStudents}
            />
          )}

          {currentActiveTab === 'bulk-grades' && (
            <BulkGradeEntry
              students={students}
              subjects={subjects}
              classSubjects={classSubjects}
              teachers={teachers}
              currentUser={currentUser}
              userRole={currentUser.role}
              activeSemester={settings.semester}
              activeTahunAjaran={settings.tahunAjaran}
              onBulkSaveStudents={handleBulkSaveStudents}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {currentActiveTab === 'add-student' && (
            <StudentForm
              student={selectedStudentToEdit}
              subjects={subjects}
              classSubjects={classSubjects}
              availableClasses={currentUser?.role === 'admin' ? allClasses : teachers.filter(t => t.waliKelas.toLowerCase() === currentUser?.fullname.toLowerCase()).map(t => t.kelas)}
              currentTahunAjaran={settings.tahunAjaran}
              currentSemester={settings.semester}
              onSave={handleSaveStudent}
              onCancel={() => {
                setActiveTab('students');
                setEditingStudentId(null);
              }}
            />
          )}

          {currentActiveTab === 'subjects' && (currentUser.role === 'admin' || currentUser.role === 'teacher') && (
            <SubjectManager
              subjects={subjects}
              classSubjects={classSubjects}
              allClasses={allClasses}
              userRole={currentUser.role}
              currentUser={currentUser}
              teachers={teachers}
              onAddGlobalSubject={handleAddGlobalSubject}
              onDeleteGlobalSubject={handleDeleteGlobalSubject}
              onAddSubjectToClass={handleAddSubjectToClass}
              onRemoveSubjectFromClass={handleRemoveSubjectFromClass}
            />
          )}

          {currentActiveTab === 'teachers' && currentUser.role === 'admin' && (
            <TeacherManager
              teachers={teachers}
              allClasses={allClasses}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
            />
          )}

          {currentActiveTab === 'settings' && currentUser.role === 'admin' && (
            <SettingsManager
              settings={settings}
              onSaveSettings={handleSaveSettings}
              students={students}
              subjects={subjects}
              classSubjects={classSubjects}
              teachers={teachers}
              users={users}
              logs={logs}
              onRestoreData={handleRestoreData}
              onToggleLock={handleToggleLock}
              onAdvanceSemester={handleAdvanceSemester}
              useCloudSync={useCloudSync}
              onToggleCloudSync={handleToggleCloudSync}
            />
          )}

          {currentActiveTab === 'logs' && currentUser.role === 'admin' && (
            <LogViewer
              logs={logs}
              onClearLogs={handleClearLogs}
            />
          )}

          {currentActiveTab === 'users' && currentUser.role === 'admin' && (
            <UserManager
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onUpdatePassword={handleUpdatePassword}
              onUpdateEmail={handleUpdateEmail}
              useCloudSync={useCloudSync}
              onSyncAllUsersToCloud={handleSyncAllUsersToCloud}
            />
          )}

          {currentActiveTab === 'profile' && (
            <MyProfile
              currentUser={currentUser}
              teachers={teachers}
              students={students}
              onUpdateProfile={handleUpdateProfile}
              onUpdatePassword={handleUpdatePassword}
            />
          )}

        </main>

      </div>

      {/* 4. FOOTER */}
      <footer className="mt-auto py-5 bg-slate-900 text-white/50 text-center text-xs border-t border-slate-800">
        <p>&copy; 2026 PPTQ Al-Husna Bukit Raja Wali. Aplikasi Raport Madrasah Diniyah dirancang oleh Achmad Husain.</p>
      </footer>

      <LogoUploadModal
        isOpen={showDashboardLogoModal}
        onClose={() => setShowDashboardLogoModal(false)}
        settings={settings}
        users={users}
        isAdminLoggedIn={currentUser?.role === 'admin'}
        onSaveLogo={handleSaveLogo}
      />

    </div>
  );
}
