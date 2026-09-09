import { ClassSubject, Student, Subject, SystemSettings } from '../types';

export function inTerm(
  student: Student,
  term: Pick<SystemSettings, 'semester' | 'tahunAjaran'>,
) {
  return (
    student.semester === term.semester &&
    student.tahunAjaran === term.tahunAjaran
  );
}
export function subjectsForClass(
  kelas: string,
  subjects: Subject[],
  mappings: ClassSubject[],
) {
  const ids = new Set(
    mappings.filter((m) => m.kelas === kelas).map((m) => m.subjectId),
  );
  return subjects.filter((s) => ids.has(s.id));
}
export function gradeSummary(student: Student, subjects: Subject[]) {
  const scores = subjects
    .map((s) => student.grades[s.id])
    .filter((s) => Number.isFinite(s) && s >= 0 && s <= 100);
  const total = scores.reduce((sum, score) => sum + score, 0);
  return {
    total,
    entered: scores.length,
    expected: subjects.length,
    average: subjects.length ? total / subjects.length : 0,
    complete: subjects.length > 0 && scores.length === subjects.length,
  };
}
export function enrollNextTerm(
  students: Student[],
  current: SystemSettings,
  next: SystemSettings,
): Student[] {
  const existing = new Set(
    students.filter((s) => inTerm(s, next)).map((s) => s.nis),
  );
  return students
    .filter((s) => inTerm(s, current))
    .flatMap((s) => {
      if (existing.has(s.nis)) return [];
      existing.add(s.nis);
      return [
        {
          ...s,
          id: crypto.randomUUID(),
          semester: next.semester,
          tahunAjaran: next.tahunAjaran,
          grades: {},
          sakit: 0,
          izin: 0,
          alpa: 0,
          catatan: '',
          akhlaq: '',
          kerajinan: '',
          kedisiplinan: '',
          kerapihan: '',
        },
      ];
    });
}
