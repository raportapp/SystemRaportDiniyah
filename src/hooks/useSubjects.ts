import { Subject, ClassSubject } from '../types';
import { dbService } from '../lib/db';
import { useCachedState } from './useCachedState';

export function useSubjects() {
  const [subjects, setSubjects] = useCachedState<Subject[]>(
    'raport_subjects',
    [],
  );
  const [classSubjects, setClassSubjects] = useCachedState<ClassSubject[]>(
    'raport_class_subjects',
    [],
  );
  const saveSubject = async (subject: Subject) => {
    await dbService.saveSubject(subject);
    setSubjects((previous) =>
      Array.from(
        new Map([...previous, subject].map((s) => [s.id, s])).values(),
      ),
    );
  };
  const deleteSubject = async (id: number) => {
    await dbService.deleteSubject(id);
    setSubjects((previous) => previous.filter((s) => s.id !== id));
    setClassSubjects((previous) => previous.filter((s) => s.subjectId !== id));
  };
  const saveClassSubjects = async (mappings: ClassSubject[]) => {
    await dbService.saveClassSubjects(mappings);
    setClassSubjects(mappings);
  };
  const addClassSubject = async (kelas: string, subjectId: number) => {
    await dbService.addClassSubject(kelas, subjectId);
    setClassSubjects((previous) =>
      previous.some((m) => m.kelas === kelas && m.subjectId === subjectId)
        ? previous
        : [...previous, { kelas, subjectId }],
    );
  };
  const removeClassSubject = async (kelas: string, subjectId: number) => {
    await dbService.removeClassSubject(kelas, subjectId);
    setClassSubjects((previous) =>
      previous.filter((m) => !(m.kelas === kelas && m.subjectId === subjectId)),
    );
  };
  return {
    subjects,
    setSubjects,
    classSubjects,
    setClassSubjects,
    saveSubject,
    deleteSubject,
    saveClassSubjects,
    addClassSubject,
    removeClassSubject,
  };
}
