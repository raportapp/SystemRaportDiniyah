import { db } from './firebase';
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

// Collection references
const STUDENTS_COLL = 'students';
const SUBJECTS_COLL = 'subjects';
const CLASSSUBJECTS_COLL = 'class_subjects';
const TEACHERS_COLL = 'teachers';
const SETTINGS_COLL = 'settings';
const LOGS_COLL = 'logs';
const USERS_COLL = 'users';

// Helper to sanitize undefined values for Firestore
function sanitizeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const isCloudSyncActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  const val = localStorage.getItem('raport_use_cloud_sync');
  return val === null ? true : val === 'true';
};

const rawDbService = {
  // --- STUDENTS ---
  async getStudents(): Promise<Student[]> {
    try {
      const q = query(collection(db, STUDENTS_COLL));
      const querySnapshot = await getDocs(q);
      const list: Student[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as Student);
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
      await setDoc(docRef, sanitizeData(student));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async saveStudentsBatch(studentsList: Student[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const st of studentsList) {
        const docRef = doc(db, STUDENTS_COLL, st.id);
        batch.set(docRef, sanitizeData(st));
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

  // --- SUBJECTS ---
  async getSubjects(): Promise<Subject[]> {
    try {
      const q = query(collection(db, SUBJECTS_COLL));
      const querySnapshot = await getDocs(q);
      const list: Subject[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as Subject);
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
      await setDoc(docRef, sanitizeData(subject));
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
        list.push(doc.data() as ClassSubject);
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
        batch.set(docRef, sanitizeData(m));
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
      await setDoc(docRef, sanitizeData({ kelas, subjectId }));
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
        list.push(doc.data() as ClassTeacher);
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
      await setDoc(docRef, sanitizeData(teacher));
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
        return docSnap.data() as SystemSettings;
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
      await setDoc(docRef, sanitizeData(compressed));
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
        list.push(doc.data() as SystemLog);
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
      await setDoc(docRef, sanitizeData(log));
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
        list.push(doc.data() as UserAccount);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, USERS_COLL);
    }
  },

  async saveUser(user: UserAccount): Promise<void> {
    const docPath = `${USERS_COLL}/${user.id}`;
    try {
      const docRef = doc(db, USERS_COLL, user.id);
      await setDoc(docRef, sanitizeData(user));
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
      const q = query(collection(db, STUDENTS_COLL), limit(1));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, STUDENTS_COLL);
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

export const dbService = new Proxy(rawDbService, {
  get(target, prop, receiver) {
    const originalMethod = Reflect.get(target, prop, receiver);
    if (typeof originalMethod === 'function') {
      return async function (...args: any[]) {
        if (!isCloudSyncActive()) {
          const methodName = String(prop);
          if (methodName === 'isDatabaseEmpty') {
            return true;
          }
          if (methodName.startsWith('get')) {
            if (methodName === 'getSettings') {
              return null;
            }
            return [];
          }
          return;
        }
        return originalMethod.apply(target, args);
      };
    }
    return originalMethod;
  }
}) as typeof rawDbService;
