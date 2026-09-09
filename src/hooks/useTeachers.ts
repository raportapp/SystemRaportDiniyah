import { ClassTeacher } from '../types';
import { dbService } from '../lib/db';
import { useCachedState } from './useCachedState';

export function useTeachers() {
  const [teachers, setTeachers] = useCachedState<ClassTeacher[]>(
    'raport_teachers',
    [],
  );
  const saveTeacher = async (teacher: ClassTeacher) => {
    await dbService.saveTeacher(teacher);
    setTeachers((previous) =>
      Array.from(
        new Map([...previous, teacher].map((t) => [t.kelas, t])).values(),
      ),
    );
  };
  const deleteTeacher = async (kelas: string) => {
    await dbService.deleteTeacher(kelas);
    setTeachers((previous) => previous.filter((t) => t.kelas !== kelas));
  };
  return { teachers, setTeachers, saveTeacher, deleteTeacher };
}
