import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCachedState } from '../hooks/useCachedState';
import { useStudents } from '../hooks/useStudents';
import { useSubjects } from '../hooks/useSubjects';
import { useTeachers } from '../hooks/useTeachers';
import { useSettings } from '../hooks/useSettings';
import { useLogs } from '../hooks/useLogs';
import { UserAccount } from '../types';
import { dbService } from '../lib/db';
import { INITIAL_SETTINGS } from '../utils/initialData';

interface AppContextType {
  // Navigation / UI
  activeTab: string;
  setActiveTab: (tab: string) => void;
  editingStudentId: string | null;
  setEditingStudentId: (id: string | null) => void;
  printStudentIds: string[];
  setPrintStudentIds: (ids: string[]) => void;
  isLoading: boolean;
  loadError: string;
  reloadData: () => void;
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [printStudentIds, setPrintStudentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const migrationStatus = '';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [useCloudSync, setUseCloudSyncState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem('raport_use_cloud_sync');
    return val === null ? true : val === 'true';
  });

  const isQuotaExceeded = false;

  const [users, setUsers] = useCachedState<UserAccount[]>('raport_users', []);
  const { firebaseUser, isLoadingAuth } = useAuth();
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const reloadData = () => setReloadKey((key) => key + 1);

  // Domain Hooks
  const studentHook = useStudents();
  const subjectHook = useSubjects();
  const teacherHook = useTeachers();
  const settingsHook = useSettings();
  const logsHook = useLogs();

  const setUseCloudSync = (val: boolean) => {
    if (
      val &&
      !useCloudSync &&
      !confirm(
        'Beralih ke cloud akan memuat data dari server. Perubahan lokal tidak diunggah otomatis. Pastikan sudah mengunduh cadangan lokal sebelum melanjutkan.',
      )
    )
      return;
    localStorage.setItem('raport_use_cloud_sync', String(val));
    setUseCloudSyncState(val);
  };

  useEffect(() => {
    if (isLoadingAuth) return;
    let cancelled = false;
    setActiveTab('dashboard');
    setEditingStudentId(null);
    setPrintStudentIds([]);
    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        if (!firebaseUser) {
          // No user directory requests or writes before authentication.
          const publicSettings = await dbService.getSettings();
          if (!cancelled && publicSettings)
            settingsHook.setSettings(publicSettings);
          return;
        }
        const [students, subjects, mappings, teachers, settings, users, logs] =
          await Promise.all([
            dbService.getStudents(),
            dbService.getSubjects(),
            dbService.getClassSubjects(),
            dbService.getTeachers(),
            dbService.getSettings(),
            dbService.getUsers(),
            dbService.getLogs(),
          ]);
        if (cancelled) return;
        // Empty collections are valid. Never repopulate deleted data with demo records.
        studentHook.setStudents(students);
        subjectHook.setSubjects(subjects);
        subjectHook.setClassSubjects(mappings);
        teacherHook.setTeachers(teachers);
        settingsHook.setSettings(settings || INITIAL_SETTINGS);
        setUsers(users);
        logsHook.setLogs(logs);
      } catch (error) {
        if (!cancelled && firebaseUser)
          setLoadError(
            error instanceof Error ? error.message : 'Gagal memuat data.',
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid, isLoadingAuth, useCloudSync, reloadKey]);

  const saveUser = async (user: UserAccount) => {
    await dbService.saveUser(user);
    setUsers((previous) =>
      Array.from(new Map([...previous, user].map((u) => [u.id, u])).values()),
    );
  };
  const deleteUser = async (id: string) => {
    await dbService.deleteUser(id);
    setUsers((previous) => previous.filter((u) => u.id !== id));
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
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        editingStudentId,
        setEditingStudentId,
        printStudentIds,
        setPrintStudentIds,
        isLoading,
        loadError,
        reloadData,
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
        refreshUsersFromCloud,
      }}
    >
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
