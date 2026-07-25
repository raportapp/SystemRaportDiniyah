import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useStudents } from '../hooks/useStudents';
import { useSubjects } from '../hooks/useSubjects';
import { useTeachers } from '../hooks/useTeachers';
import { useSettings } from '../hooks/useSettings';
import { useLogs } from '../hooks/useLogs';
import { UserAccount } from '../types';
import { dbService } from '../lib/db';
import { INITIAL_STUDENTS, INITIAL_SUBJECTS, INITIAL_TEACHERS, INITIAL_SETTINGS, INITIAL_LOGS, INITIAL_USERS, INITIAL_CLASSES } from '../utils/initialData';

interface AppContextType {
  // Navigation / UI
  activeTab: string;
  setActiveTab: (tab: string) => void;
  editingStudentId: string | null;
  setEditingStudentId: (id: string | null) => void;
  printStudentIds: string[];
  setPrintStudentIds: (ids: string[]) => void;
  isLoading: boolean;
  migrationStatus: string;
  useCloudSync: boolean;
  setUseCloudSync: (val: boolean) => void;
  isQuotaExceeded: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;

  // Domain state & actions
  students: ReturnType<typeof useStudents>['students'];
  setStudents: ReturnType<typeof useStudents>['setStudents'];
  saveStudent: ReturnType<typeof useStudents>['saveStudent'];
  saveStudentsBatch: ReturnType<typeof useStudents>['saveStudentsBatch'];
  deleteStudent: ReturnType<typeof useStudents>['deleteStudent'];
  deleteStudentsBatch: ReturnType<typeof useStudents>['deleteStudentsBatch'];

  subjects: ReturnType<typeof useSubjects>['subjects'];
  setSubjects: ReturnType<typeof useSubjects>['setSubjects'];
  classSubjects: ReturnType<typeof useSubjects>['classSubjects'];
  setClassSubjects: ReturnType<typeof useSubjects>['setClassSubjects'];
  saveSubject: ReturnType<typeof useSubjects>['saveSubject'];
  deleteSubject: ReturnType<typeof useSubjects>['deleteSubject'];
  saveClassSubjects: ReturnType<typeof useSubjects>['saveClassSubjects'];
  addClassSubject: ReturnType<typeof useSubjects>['addClassSubject'];
  removeClassSubject: ReturnType<typeof useSubjects>['removeClassSubject'];

  teachers: ReturnType<typeof useTeachers>['teachers'];
  setTeachers: ReturnType<typeof useTeachers>['setTeachers'];
  saveTeacher: ReturnType<typeof useTeachers>['saveTeacher'];
  deleteTeacher: ReturnType<typeof useTeachers>['deleteTeacher'];

  settings: ReturnType<typeof useSettings>['settings'];
  setSettings: ReturnType<typeof useSettings>['setSettings'];
  saveSettings: ReturnType<typeof useSettings>['saveSettings'];

  logs: ReturnType<typeof useLogs>['logs'];
  setLogs: ReturnType<typeof useLogs>['setLogs'];
  addLog: ReturnType<typeof useLogs>['addLog'];
  clearAllLogs: ReturnType<typeof useLogs>['clearAllLogs'];

  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  saveUser: (user: UserAccount) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refreshUsersFromCloud: () => Promise<UserAccount[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [printStudentIds, setPrintStudentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [migrationStatus, setMigrationStatus] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [useCloudSync, setUseCloudSyncState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem('raport_use_cloud_sync');
    return val === null ? true : val === 'true';
  });

  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('raport_db_quota_exhausted') === 'true';
  });

  const [users, setUsers] = useState<UserAccount[]>([]);

  // Domain Hooks
  const studentHook = useStudents();
  const subjectHook = useSubjects();
  const teacherHook = useTeachers();
  const settingsHook = useSettings();
  const logsHook = useLogs();

  const setUseCloudSync = (val: boolean) => {
    setUseCloudSyncState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('raport_use_cloud_sync', String(val));
    }
  };

  // Initial Data Fetching and Seeding
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setIsLoading(true);

        const storedSync = localStorage.getItem('raport_use_cloud_sync');
        const isCloudSyncEnabled = storedSync === null ? true : storedSync === 'true';

        if (!isCloudSyncEnabled || isQuotaExceeded) {
          // Offline / LocalStorage Mode
          const st = localStorage.getItem('raport_students');
          if (st) studentHook.setStudents(JSON.parse(st));
          else studentHook.setStudents(INITIAL_STUDENTS);

          const sub = localStorage.getItem('raport_subjects');
          if (sub) subjectHook.setSubjects(JSON.parse(sub));
          else subjectHook.setSubjects(INITIAL_SUBJECTS);

          const cs = localStorage.getItem('raport_class_subjects');
          if (cs) subjectHook.setClassSubjects(JSON.parse(cs));
          else {
            const defMappings = INITIAL_CLASSES.flatMap(kelas => 
              INITIAL_SUBJECTS.map(s => ({ kelas, subjectId: s.id }))
            );
            subjectHook.setClassSubjects(defMappings);
          }

          const tch = localStorage.getItem('raport_teachers');
          if (tch) teacherHook.setTeachers(JSON.parse(tch));
          else teacherHook.setTeachers(INITIAL_TEACHERS);

          const set = localStorage.getItem('raport_settings');
          if (set) settingsHook.setSettings(JSON.parse(set));
          else settingsHook.setSettings(INITIAL_SETTINGS);

          const lg = localStorage.getItem('raport_logs');
          if (lg) logsHook.setLogs(JSON.parse(lg));
          else logsHook.setLogs(INITIAL_LOGS);

          const usr = localStorage.getItem('raport_users');
          if (usr) setUsers(JSON.parse(usr));
          else setUsers(INITIAL_USERS);

          setIsLoading(false);
          return;
        }

        // --- Cloud Sync Mode ---
        if (!user) {
          // Unauthenticated: load public settings (school logo/name) and local user list
          try {
            const publicSettings = await dbService.getSettings();
            if (publicSettings) settingsHook.setSettings(publicSettings);
            else settingsHook.setSettings(INITIAL_SETTINGS);
          } catch (err) {
            console.warn("Public settings load warning:", err);
            settingsHook.setSettings(INITIAL_SETTINGS);
          }

          const usr = localStorage.getItem('raport_users');
          if (usr) setUsers(JSON.parse(usr));
          else setUsers(INITIAL_USERS);

          setIsLoading(false);
          return;
        }

        // Authenticated user: load full datasets from Firestore
        const empty = await dbService.isDatabaseEmpty();
        if (empty) {
          setMigrationStatus('Menginisialisasi data ke cloud database...');
          const defMappings = INITIAL_CLASSES.flatMap(kelas => 
            INITIAL_SUBJECTS.map(s => ({ kelas, subjectId: s.id }))
          );

          await dbService.uploadAllData({
            students: INITIAL_STUDENTS,
            subjects: INITIAL_SUBJECTS,
            classSubjects: defMappings,
            teachers: INITIAL_TEACHERS,
            settings: INITIAL_SETTINGS,
            users: INITIAL_USERS,
            logs: INITIAL_LOGS
          });

          studentHook.setStudents(INITIAL_STUDENTS);
          subjectHook.setSubjects(INITIAL_SUBJECTS);
          subjectHook.setClassSubjects(defMappings);
          teacherHook.setTeachers(INITIAL_TEACHERS);
          settingsHook.setSettings(INITIAL_SETTINGS);
          setUsers(INITIAL_USERS);
          logsHook.setLogs(INITIAL_LOGS);
        } else {
          setMigrationStatus('Memuat data dari database cloud...');
          const [fetchedStudents, fetchedSubjects, fetchedCS, fetchedTeachers, fetchedSettings, fetchedUsers, fetchedLogs] = await Promise.all([
            dbService.getStudents(),
            dbService.getSubjects(),
            dbService.getClassSubjects(),
            dbService.getTeachers(),
            dbService.getSettings(),
            dbService.getUsers(),
            dbService.getLogs()
          ]);

          if (fetchedStudents && fetchedStudents.length > 0) studentHook.setStudents(fetchedStudents);
          else studentHook.setStudents(INITIAL_STUDENTS);

          if (fetchedSubjects && fetchedSubjects.length > 0) subjectHook.setSubjects(fetchedSubjects);
          else subjectHook.setSubjects(INITIAL_SUBJECTS);

          if (fetchedCS && fetchedCS.length > 0) subjectHook.setClassSubjects(fetchedCS);

          if (fetchedTeachers && fetchedTeachers.length > 0) teacherHook.setTeachers(fetchedTeachers);
          else teacherHook.setTeachers(INITIAL_TEACHERS);

          if (fetchedSettings) settingsHook.setSettings(fetchedSettings);
          else settingsHook.setSettings(INITIAL_SETTINGS);

          if (fetchedUsers && fetchedUsers.length > 0) setUsers(fetchedUsers);
          else setUsers(INITIAL_USERS);

          if (fetchedLogs && fetchedLogs.length > 0) logsHook.setLogs(fetchedLogs);
          else logsHook.setLogs(INITIAL_LOGS);
        }
      } catch (err) {
        console.error("Gagal inisialisasi data:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isQuotaExceeded]);

  const saveUser = async (user: UserAccount) => {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = user;
        return next;
      }
      return [...prev, user];
    });
    try {
      await dbService.saveUser(user);
    } catch (err) {
      console.error("Gagal menyimpan pengguna:", err);
    }
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    try {
      await dbService.deleteUser(id);
    } catch (err) {
      console.error("Gagal menghapus pengguna:", err);
    }
  };

  const refreshUsersFromCloud = async (): Promise<UserAccount[]> => {
    const cloudUsers = await dbService.getUsers();
    if (cloudUsers && cloudUsers.length > 0) {
      setUsers(cloudUsers);
      return cloudUsers;
    }
    return users;
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      editingStudentId,
      setEditingStudentId,
      printStudentIds,
      setPrintStudentIds,
      isLoading,
      migrationStatus,
      useCloudSync,
      setUseCloudSync,
      isQuotaExceeded,
      isMobileMenuOpen,
      setIsMobileMenuOpen,

      ...studentHook,
      ...subjectHook,
      ...teacherHook,
      ...settingsHook,
      ...logsHook,

      users,
      setUsers,
      saveUser,
      deleteUser,
      refreshUsersFromCloud
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
