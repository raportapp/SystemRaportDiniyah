import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/lib/db', () => ({
  dbService: {
    saveStudent: vi.fn(),
    saveStudentsBatch: vi.fn(),
    deleteStudent: vi.fn(),
    deleteStudentsBatch: vi.fn(),
    saveSettings: vi.fn(),
  },
}));
import { dbService } from '../src/lib/db';
import { useStudents } from '../src/hooks/useStudents';
import { student } from './fixtures';
beforeEach(() => vi.clearAllMocks());
describe('student persistence', () => {
  it('does not commit or change the cache when a cloud write fails', async () => {
    const { result } = renderHook(useStudents);
    act(() => result.current.setStudents([student]));
    vi.mocked(dbService.saveStudent).mockRejectedValueOnce(
      new Error('Akses ditolak'),
    );
    await act(async () => {
      await expect(
        result.current.saveStudent({ ...student, nama: 'Changed' }),
      ).rejects.toThrow('Akses ditolak');
    });
    expect(result.current.students[0].nama).toBe(student.nama);
    expect(JSON.parse(localStorage.getItem('raport_students')!)[0].nama).toBe(
      student.nama,
    );
  });
  it('does not hide a student when deleting fails', async () => {
    const { result } = renderHook(useStudents);
    act(() => result.current.setStudents([student]));
    vi.mocked(dbService.deleteStudent).mockRejectedValueOnce(
      new Error('Offline'),
    );
    await act(async () => {
      await expect(result.current.deleteStudent(student.id)).rejects.toThrow();
    });
    expect(result.current.students).toHaveLength(1);
  });
  it('updates in-memory data and cache after a successful save', async () => {
    const { result } = renderHook(useStudents);
    vi.mocked(dbService.saveStudent).mockResolvedValueOnce();
    await act(async () => {
      await result.current.saveStudent(student);
    });
    expect(result.current.students).toEqual([student]);
    expect(JSON.parse(localStorage.getItem('raport_students')!)).toEqual([
      student,
    ]);
  });
});
