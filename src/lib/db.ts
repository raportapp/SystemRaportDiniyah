import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { Student, Subject, ClassSubject, ClassTeacher, SystemSettings, SystemLog, UserAccount } from '../types';
import {
  validateStudent,
  validateSubject,
  validateClassSubject,
  validateClassTeacher,
  validateSystemSettings,
  validateSystemLog,
  validateUserAccount
} from '../utils/validators';

// Collection references
const STUDENTS_COLL = 'students';
const SUBJECTS_COLL = 'subjects';
const CLASSSUBJECTS_COLL = 'class_subjects';
const TEACHERS_COLL = 'teachers';
const SETTINGS_COLL = 'settings';
const LOGS_COLL = 'logs';
const USERS_COLL = 'users';

// Explicit sanitizer for Firestore (recursively removes undefined fields safely)
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned as T;
}

// Error handling definitions per firebase-integration skill instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    emailVerified: boolean | null;
    isAnonymous: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const isCloudSyncActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  const quotaExceeded = localStorage.getItem('raport_db_quota_exhausted') === 'true';
  if (quotaExceeded) return false;
  const val = localStorage.getItem('raport_use_cloud_sync');
  return val === null ? true : val === 'true';
};

const rawDbService = {
  // --- STUDENTS ---
  async getStudents(): Promise<Student[]> {
    try {
      const q = query(collection(db, STUDENTS_COLL), limit(300));
      const querySnapshot = await getDocs(q);
      const list: Student[] = [];
      querySnapshot.forEach((doc) => {
        try {
          list.push(validateStudent(doc.data()));
        } catch (valErr) {
          console.warn(`Corrupted student doc ${doc.id}:`, valErr);
        }
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, STUDENTS_COLL);
    }
  },

  async saveStudent(student: Student): Promise<void> {
    const docPath = `${STUDENTS_COLL}/${student.id}`;
    try {
      const docRef = doc(db, STUDENTS_COLL, student.id);
      await setDoc(docRef, sanitizeForFirestore(student));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async saveStudentsBatch(studentsList: Student[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const st of studentsList) {
        const docRef = doc(db, STUDENTS_COLL, st.id);
        batch.set(docRef, sanitizeForFirestore(st));
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, STUDENTS_COLL);
    }
  },

  async deleteStudent(id: string): Promise<void> {
    const docPath = `${STUDENTS_COLL}/${id}`;
    try {
      const docRef = doc(db, STUDENTS_COLL, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  async deleteStudentsBatch(ids: string[]): Promise<void> {
    try {
      const chunkSize = 400;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const id of chunk) {
          const docRef = doc(db, STUDENTS_COLL, id);
          batch.delete(docRef);
        }
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, STUDENTS_COLL);
    }
  },

  // --- SUBJECTS ---
  async getSubjects(): Promise<Subject[]> {
    try {
      const q = query(collection(db, SUBJECTS_COLL));
      const querySnapshot = await getDocs(q);
      const list: Subject[] = [];
      querySnapshot.forEach((doc) => {
        try {
          list.push(validateSubject(doc.data()));
        } catch (valErr) {
          console.warn(`Corrupted subject doc ${doc.id}:`, valErr);
        }
      });
      // Sort by ID ascending
      return list.sort((a, b) => a.id - b.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, SUBJECTS_COLL);
    }
  },

  async saveSubject(subject: Subject): Promise<void> {
    const docPath = `${SUBJECTS_COLL}/sub-${subject.id}`;
    try {
      const docRef = doc(db, SUBJECTS_COLL, `sub-${subject.id}`);
      await setDoc(docRef, sanitizeForFirestore(subject));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteSubject(id: number): Promise<void> {
    const docPath = `${SUBJECTS_COLL}/sub-${id}`;
    try {
      const docRef = doc(db, SUBJECTS_COLL, `sub-${id}`);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  // --- CLASS SUBJECTS MAPPINGS ---
  async getClassSubjects(): Promise<ClassSubject[]> {
    try {
      const q = query(collection(db, CLASSSUBJECTS_COLL));
      const querySnapshot = await getDocs(q);
      const list: ClassSubject[] = [];
      querySnapshot.forEach((doc) => {
        try {
          list.push(validateClassSubject(doc.data()));
        } catch (valErr) {
          console.warn(`Corrupted class_subject doc ${doc.id}:`, valErr);
        }
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, CLASSSUBJECTS_COLL);
    }
  },

  async saveClassSubjects(mappings: ClassSubject[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const m of mappings) {
        const docId = `${m.kelas.replace(/[^a-zA-Z0-9]/g, '_')}_${m.subjectId}`;
        const docRef = doc(db, CLASSSUBJECTS_COLL, docId);
        batch.set(docRef, sanitizeForFirestore(m));
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, CLASSSUBJECTS_COLL);
    }
  },

  async removeClassSubject(kelas: string, subjectId: number): Promise<void> {
    const docId = `${kelas.replace(/[^a-zA-Z0-9]/g, '_')}_${subjectId}`;
    const docPath = `${CLASSSUBJECTS_COLL}/${docId}`;
    try {
      const docRef = doc(db, CLASSSUBJECTS_COLL, docId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  async addClassSubject(kelas: string, subjectId: number): Promise<void> {
    const docId = `${kelas.replace(/[^a-zA-Z0-9]/g, '_')}_${subjectId}`;
    const docPath = `${CLASSSUBJECTS_COLL}/${docId}`;
    try {
      const docRef = doc(db, CLASSSUBJECTS_COLL, docId);
      await setDoc(docRef, sanitizeForFirestore({ kelas, subjectId }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // --- TEACHERS ---
  async getTeachers(): Promise<ClassTeacher[]> {
    try {
      const q = query(collection(db, TEACHERS_COLL));
      const querySnapshot = await getDocs(q);
      const list: ClassTeacher[] = [];
      querySnapshot.forEach((doc) => {
        try {
          list.push(validateClassTeacher(doc.data()));
        } catch (valErr) {
          console.warn(`Corrupted teacher doc ${doc.id}:`, valErr);
        }
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, TEACHERS_COLL);
    }
  },

  async saveTeacher(teacher: ClassTeacher): Promise<void> {
    const docId = teacher.kelas.replace(/[^a-zA-Z0-9]/g, '_');
    const docPath = `${TEACHERS_COLL}/${docId}`;
    try {
      const docRef = doc(db, TEACHERS_COLL, docId);
      await setDoc(docRef, sanitizeForFirestore(teacher));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteTeacher(kelas: string): Promise<void> {
    const docId = kelas.replace(/[^a-zA-Z0-9]/g, '_');
    const docPath = `${TEACHERS_COLL}/${docId}`;
    try {
      const docRef = doc(db, TEACHERS_COLL, docId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  // --- SETTINGS ---
  async getSettings(): Promise<SystemSettings | null> {
    try {
      const docRef = doc(db, SETTINGS_COLL, 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return validateSystemSettings(docSnap.data());
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLL}/global`);
    }
  },

  async saveSettings(settings: SystemSettings): Promise<void> {
    const docPath = `${SETTINGS_COLL}/global`;
    try {
      const { compressSettingsImages } = await import('../utils/imageCompressor');
      const compressed = await compressSettingsImages(settings);
      const docRef = doc(db, SETTINGS_COLL, 'global');
      await setDoc(docRef, sanitizeForFirestore(compressed));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // --- LOGS ---
  async getLogs(): Promise<SystemLog[]> {
    try {
      const q = query(collection(db, LOGS_COLL), orderBy('timestamp', 'desc'), limit(150));
      const querySnapshot = await getDocs(q);
      const list: SystemLog[] = [];
      querySnapshot.forEach((doc) => {
        try {
          list.push(validateSystemLog(doc.data()));
        } catch (valErr) {
          console.warn(`Corrupted log doc ${doc.id}:`, valErr);
        }
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, LOGS_COLL);
    }
  },

  async saveLog(log: SystemLog): Promise<void> {
    const docPath = `${LOGS_COLL}/${log.id}`;
    try {
      const docRef = doc(db, LOGS_COLL, log.id);
      await setDoc(docRef, sanitizeForFirestore(log));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async clearAllLogs(): Promise<void> {
    try {
      const q = query(collection(db, LOGS_COLL));
      const querySnapshot = await getDocs(q);
      const batchDeletePromises: Promise<any>[] = [];
      querySnapshot.forEach((doc) => {
        batchDeletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(batchDeletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, LOGS_COLL);
    }
  },

  // --- USERS ---
  async getUsers(): Promise<UserAccount[]> {
    try {
      const q = query(collection(db, USERS_COLL));
      const querySnapshot = await getDocs(q);
      const list: UserAccount[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const user = validateUserAccount(doc.data());
          // Ensure password field is never present in returned UserAccount objects
          delete user.password;
          list.push(user);
        } catch (valErr) {
          console.warn(`Corrupted user doc ${doc.id}:`, valErr);
        }
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, USERS_COLL);
    }
  },

  async saveUser(user: UserAccount): Promise<void> {
    const docPath = `${USERS_COLL}/${user.id}`;
    try {
      const userToSave = { ...user };
      delete userToSave.password; // Do not store passwords in Firestore document
      const docRef = doc(db, USERS_COLL, user.id);
      await setDoc(docRef, sanitizeForFirestore(userToSave));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteUser(id: string): Promise<void> {
    const docPath = `${USERS_COLL}/${id}`;
    try {
      const docRef = doc(db, USERS_COLL, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  // --- MASS SEEDING (FOR MIGRATION) ---
  async isDatabaseEmpty(): Promise<boolean> {
    try {
      const docRef = doc(db, SETTINGS_COLL, 'global');
      const docSnap = await getDoc(docRef);
      return !docSnap.exists();
    } catch (error) {
      try {
        const q = query(collection(db, STUDENTS_COLL), limit(1));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty;
      } catch (innerErr) {
        handleFirestoreError(error, OperationType.GET, SETTINGS_COLL);
      }
    }
  },

  async uploadAllData(data: {
    students: Student[];
    subjects: Subject[];
    classSubjects: ClassSubject[];
    teachers: ClassTeacher[];
    settings: SystemSettings;
    users: UserAccount[];
    logs: SystemLog[];
  }): Promise<void> {
    try {
      // 1. Save settings
      await this.saveSettings(data.settings);

      // 2. Save subjects
      for (const sub of data.subjects) {
        await this.saveSubject(sub);
      }

      // 3. Save class subjects
      await this.saveClassSubjects(data.classSubjects);

      // 4. Save teachers
      for (const t of data.teachers) {
        await this.saveTeacher(t);
      }

      // 5. Save students
      for (const st of data.students) {
        await this.saveStudent(st);
      }

      // 6. Save users
      for (const u of data.users) {
        await this.saveUser(u);
      }

      // 7. Save logs (only first 50 logs to be fast)
      const logsToSave = data.logs.slice(0, 50);
      for (const log of logsToSave) {
        await this.saveLog(log);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bulk-upload');
    }
  }
};

function getLocalFallback(methodName: string): any {
  if (typeof window === 'undefined') return [];
  try {
    if (methodName === 'getStudents') {
      const v = localStorage.getItem('raport_students');
      return v ? JSON.parse(v).map((x: any) => validateStudent(x)) : [];
    }
    if (methodName === 'getSubjects') {
      const v = localStorage.getItem('raport_subjects');
      return v ? JSON.parse(v).map((x: any) => validateSubject(x)) : [];
    }
    if (methodName === 'getClassSubjects') {
      const v = localStorage.getItem('raport_class_subjects');
      return v ? JSON.parse(v).map((x: any) => validateClassSubject(x)) : [];
    }
    if (methodName === 'getTeachers') {
      const v = localStorage.getItem('raport_teachers');
      return v ? JSON.parse(v).map((x: any) => validateClassTeacher(x)) : [];
    }
    if (methodName === 'getSettings') {
      const v = localStorage.getItem('raport_settings');
      return v ? validateSystemSettings(JSON.parse(v)) : null;
    }
    if (methodName === 'getLogs') {
      const v = localStorage.getItem('raport_logs');
      return v ? JSON.parse(v).map((x: any) => validateSystemLog(x)) : [];
    }
    if (methodName === 'getUsers') {
      const v = localStorage.getItem('raport_users');
      return v ? JSON.parse(v).map((x: any) => validateUserAccount(x)) : [];
    }
  } catch (err) {
    console.error("Gagal membaca data cadangan lokal:", err);
  }
  return methodName === 'getSettings' ? null : [];
}

export const dbService = new Proxy(rawDbService, {
  get(target, prop, receiver) {
    const originalMethod = Reflect.get(target, prop, receiver);
    if (typeof originalMethod === 'function') {
      return async function (...args: any[]) {
        const methodName = String(prop);
        const cloudActive = isCloudSyncActive();
        
        // If cloud sync is not active, run completely in offline/local mode
        if (!cloudActive) {
          if (methodName === 'isDatabaseEmpty') {
            const st = localStorage.getItem('raport_students');
            return !(st && JSON.parse(st).length > 0);
          }
          if (methodName.startsWith('get')) {
            return getLocalFallback(methodName);
          }
          return;
        }

        try {
          return await originalMethod.apply(target, args);
        } catch (error: any) {
          const errMsg = error?.message || String(error);
          const isQuota = errMsg.toLowerCase().includes('quota') || 
                          errMsg.toLowerCase().includes('exhausted') || 
                          errMsg.toLowerCase().includes('limit exceeded') ||
                          errMsg.toLowerCase().includes('resource-exhausted') ||
                          errMsg.toLowerCase().includes('backoff delay');
          
          if (isQuota) {
            console.warn("Firestore Quota Limit detected! Falling back to localStorage dynamically.");
            if (typeof window !== 'undefined') {
              localStorage.setItem('raport_db_quota_exhausted', 'true');
              localStorage.setItem('raport_db_quota_error_msg', errMsg);
            }
            
            if (methodName === 'isDatabaseEmpty') {
              const st = localStorage.getItem('raport_students');
              return !(st && JSON.parse(st).length > 0);
            }
            if (methodName.startsWith('get')) {
              return getLocalFallback(methodName);
            }
            return;
          }
          
          if (methodName.startsWith('get')) {
            console.warn("Firestore error during get, fallback to local:", errMsg);
            return getLocalFallback(methodName);
          }
          throw error;
        }
      };
    }
    return originalMethod;
  }
}) as typeof rawDbService;

