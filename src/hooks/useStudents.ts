import { Student } from '../types';
import { dbService } from '../lib/db';
import { useCachedState } from './useCachedState';

export function useStudents() {
  const [students, setStudents] = useCachedState<Student[]>(
    'raport_students',
    [],
  );
  const saveStudentsBatch = async (list: Student[]) => {
    if (list.some((s) => !s.id))
      throw new Error('Identitas santri tidak valid.');
    await dbService.saveStudentsBatch(list);
    setStudents((previous) =>
      Array.from(
        new Map([...previous, ...list].map((s) => [s.id, s])).values(),
      ),
    );
  };
  const saveStudent = async (student: Student) => {
    if (!student.id) throw new Error('Identitas santri tidak valid.');
    await dbService.saveStudent(student);
    setStudents((previous) =>
      Array.from(
        new Map([...previous, student].map((s) => [s.id, s])).values(),
      ),
    );
  };
  const deleteStudent = async (id: string) => {
    await dbService.deleteStudent(id);
    setStudents((previous) => previous.filter((s) => s.id !== id));
  };
  const deleteStudentsBatch = async (ids: string[]) => {
    await dbService.deleteStudentsBatch(ids);
    const removed = new Set(ids);
    setStudents((previous) => previous.filter((s) => !removed.has(s.id)));
  };
  return {
    students,
    setStudents,
    saveStudent,
    saveStudentsBatch,
    deleteStudent,
    deleteStudentsBatch,
  };
}
