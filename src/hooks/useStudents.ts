import { useState, useCallback } from 'react';
import { Student } from '../types';
import { dbService } from '../lib/db';
import { INITIAL_STUDENTS } from '../utils/initialData';

export function useStudents() {
  const [studentsRaw, setStudentsRaw] = useState<Student[]>([]);

  const setStudents = useCallback((val: Student[] | ((prev: Student[]) => Student[])) => {
    setStudentsRaw(prev => {
      const newList = typeof val === 'function' ? val(prev) : val;
      const seen = new Set<string>();
      const deduplicated = newList.filter(item => {
        if (!item.id) return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('raport_students', JSON.stringify(deduplicated));
      }
      return deduplicated;
    });
  }, []);

  const saveStudent = async (student: Student) => {
    // Optimistic update
    setStudents(prev => {
      const idx = prev.findIndex(s => s.id === student.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = student;
        return next;
      }
      return [...prev, student];
    });

    // Firestore sync
    try {
      await dbService.saveStudent(student);
    } catch (err) {
      console.error("Gagal menyimpan santri ke Firestore:", err);
    }
  };

  const saveStudentsBatch = async (studentList: Student[]) => {
    setStudents(prev => {
      const map = new Map<string, Student>();
      prev.forEach(s => map.set(s.id, s));
      studentList.forEach(s => map.set(s.id, s));
      return Array.from(map.values());
    });

    try {
      await dbService.saveStudentsBatch(studentList);
    } catch (err) {
      console.error("Gagal menyimpan batch santri ke Firestore:", err);
    }
  };

  const deleteStudent = async (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    try {
      await dbService.deleteStudent(id);
    } catch (err) {
      console.error("Gagal menghapus santri dari Firestore:", err);
    }
  };

  const deleteStudentsBatch = async (ids: string[]) => {
    const idSet = new Set(ids);
    setStudents(prev => prev.filter(s => !idSet.has(s.id)));
    try {
      await dbService.deleteStudentsBatch(ids);
    } catch (err) {
      console.error("Gagal menghapus batch santri dari Firestore:", err);
    }
  };

  return {
    students: studentsRaw,
    setStudents,
    saveStudent,
    saveStudentsBatch,
    deleteStudent,
    deleteStudentsBatch
  };
}
