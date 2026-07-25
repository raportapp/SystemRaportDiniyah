import { useState, useCallback } from 'react';
import { Subject, ClassSubject } from '../types';
import { dbService } from '../lib/db';

export function useSubjects() {
  const [subjects, setSubjectsRaw] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjectsRaw] = useState<ClassSubject[]>([]);

  const setSubjects = useCallback((val: Subject[] | ((prev: Subject[]) => Subject[])) => {
    setSubjectsRaw(prev => {
      const newList = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        localStorage.setItem('raport_subjects', JSON.stringify(newList));
      }
      return newList;
    });
  }, []);

  const setClassSubjects = useCallback((val: ClassSubject[] | ((prev: ClassSubject[]) => ClassSubject[])) => {
    setClassSubjectsRaw(prev => {
      const newList = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        localStorage.setItem('raport_class_subjects', JSON.stringify(newList));
      }
      return newList;
    });
  }, []);

  const saveSubject = async (sub: Subject) => {
    setSubjects(prev => {
      const idx = prev.findIndex(s => s.id === sub.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = sub;
        return next;
      }
      return [...prev, sub];
    });
    try {
      await dbService.saveSubject(sub);
    } catch (err) {
      console.error("Gagal menyimpan mata pelajaran:", err);
    }
  };

  const deleteSubject = async (id: number) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setClassSubjects(prev => prev.filter(cs => cs.subjectId !== id));
    try {
      await dbService.deleteSubject(id);
    } catch (err) {
      console.error("Gagal menghapus mata pelajaran:", err);
    }
  };

  const saveClassSubjects = async (mappings: ClassSubject[]) => {
    setClassSubjects(mappings);
    try {
      await dbService.saveClassSubjects(mappings);
    } catch (err) {
      console.error("Gagal menyimpan pemetaan mapel kelas:", err);
    }
  };

  const addClassSubject = async (kelas: string, subjectId: number) => {
    setClassSubjects(prev => {
      if (prev.some(m => m.kelas === kelas && m.subjectId === subjectId)) return prev;
      return [...prev, { kelas, subjectId }];
    });
    try {
      await dbService.addClassSubject(kelas, subjectId);
    } catch (err) {
      console.error("Gagal menambah mapel kelas:", err);
    }
  };

  const removeClassSubject = async (kelas: string, subjectId: number) => {
    setClassSubjects(prev => prev.filter(m => !(m.kelas === kelas && m.subjectId === subjectId)));
    try {
      await dbService.removeClassSubject(kelas, subjectId);
    } catch (err) {
      console.error("Gagal menghapus mapel kelas:", err);
    }
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
    removeClassSubject
  };
}
