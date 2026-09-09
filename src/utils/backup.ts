import { validateStudent, validateSubject, validateClassSubject, validateClassTeacher, validateSystemSettings } from './validators';
export function parseAcademicBackup(backup: any) {
  const data = backup?.data || backup;
  if (!data || !Array.isArray(data.students) || !data.settings || !Array.isArray(data.subjects) || !Array.isArray(data.classSubjects) || !Array.isArray(data.teachers)) {
    throw new Error('Berkas cadangan tidak lengkap.');
  }
  const students = data.students.map(validateStudent);
  if (students.some(student => !student.id || !student.nis || !student.kelas)) throw new Error('Cadangan berisi identitas santri yang tidak valid.');
  return { students, subjects: data.subjects.map(validateSubject), classSubjects: data.classSubjects.map(validateClassSubject),
    teachers: data.teachers.map(validateClassTeacher), settings: validateSystemSettings(data.settings) };
}
