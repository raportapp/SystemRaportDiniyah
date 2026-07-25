import { useState, useCallback } from 'react';
import { ClassTeacher } from '../types';
import { dbService } from '../lib/db';

export function useTeachers() {
  const [teachers, setTeachersRaw] = useState<ClassTeacher[]>([]);

  const setTeachers = useCallback((val: ClassTeacher[] | ((prev: ClassTeacher[]) => ClassTeacher[])) => {
    setTeachersRaw(prev => {
      const newList = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        localStorage.setItem('raport_teachers', JSON.stringify(newList));
      }
      return newList;
    });
  }, []);

  const saveTeacher = async (teacher: ClassTeacher) => {
    setTeachers(prev => {
      const idx = prev.findIndex(t => t.kelas === teacher.kelas);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = teacher;
        return next;
      }
      return [...prev, teacher];
    });
    try {
      await dbService.saveTeacher(teacher);
    } catch (err) {
      console.error("Gagal menyimpan wali kelas:", err);
    }
  };

  const deleteTeacher = async (kelas: string) => {
    setTeachers(prev => prev.filter(t => t.kelas !== kelas));
    try {
      await dbService.deleteTeacher(kelas);
    } catch (err) {
      console.error("Gagal menghapus wali kelas:", err);
    }
  };

  return {
    teachers,
    setTeachers,
    saveTeacher,
    deleteTeacher
  };
}
