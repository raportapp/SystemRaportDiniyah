import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StudentForm from '../src/components/StudentForm';
import BulkGradeEntry from '../src/components/BulkGradeEntry';
import SettingsManager from '../src/components/SettingsManager';
import { student, subjects, mappings, settings } from './fixtures';

describe('save feedback', () => {
  it('preserves a blank grade and keeps the student form open on rejected save', async () => {
    const save = vi.fn().mockRejectedValue(new Error('Cloud sedang offline'));
    const { container } = render(
      <StudentForm
        student={student}
        subjects={subjects}
        classSubjects={mappings}
        availableClasses={['Kubro Awal']}
        currentTahunAjaran={settings.tahunAjaran}
        currentSemester={settings.semester}
        onSave={save}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.submit(container.querySelector('form')!);
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Cloud sedang offline',
    );
    expect(save.mock.calls[0][0].grades).toEqual({ 1: 80 });
    expect(
      screen
        .getByRole('button', { name: 'Simpan Data Raport' })
        .hasAttribute('disabled'),
    ).toBe(false);
  });
  it('waits for a bulk save and submits only the selected class and period', async () => {
    let resolve!: () => void;
    const save = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    render(
      <BulkGradeEntry
        students={[
          student,
          { ...student, id: 'other-class', kelas: 'Kubro Tsani' },
          { ...student, id: 'old-term', semester: 'Ganjil' },
        ]}
        subjects={subjects}
        classSubjects={mappings}
        teachers={[]}
        currentUser={null}
        userRole="admin"
        activeSemester={settings.semester}
        activeTahunAjaran={settings.tahunAjaran}
        onBulkSaveStudents={save}
        onNavigate={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Pilih kelas'), {
      target: { value: student.kelas },
    });
    fireEvent.change(screen.getByLabelText('Pilih mata pelajaran'), {
      target: { value: '1' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Simpan Semua Nilai Kelas/ }),
    );
    expect(save.mock.calls[0][0]).toHaveLength(1);
    expect(save.mock.calls[0][0][0].id).toBe(student.id);
    expect(screen.queryByText(/berhasil disimpan/i)).toBeNull();
    await act(async () => resolve());
    expect(await screen.findByText(/berhasil disimpan/i)).toBeTruthy();
  });
  it('retains the report lock when saving other settings', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <SettingsManager
        settings={{ ...settings, nilaiRaportSelesai: true }}
        onSaveSettings={save}
        students={[]}
        subjects={[]}
        classSubjects={[]}
        teachers={[]}
        users={[]}
        logs={[]}
        onRestoreData={vi.fn()}
        onToggleLock={vi.fn()}
        onAdvanceSemester={vi.fn()}
        useCloudSync={true}
        onToggleCloudSync={vi.fn()}
      />,
    );
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0].nilaiRaportSelesai).toBe(true);
  });
});
