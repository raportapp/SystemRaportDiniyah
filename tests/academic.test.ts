import { describe, expect, it } from 'vitest';
import {
  enrollNextTerm,
  gradeSummary,
  inTerm,
  subjectsForClass,
} from '../src/utils/academic';
import { settings, student, subjects, mappings } from './fixtures';
describe('academic periods', () => {
  it('excludes past semesters and years', () => {
    expect(inTerm(student, settings)).toBe(true);
    expect(inTerm({ ...student, semester: 'Ganjil' }, settings)).toBe(false);
    expect(inTerm({ ...student, tahunAjaran: '2024/2025' }, settings)).toBe(
      false,
    );
  });
  it('keeps zero scores distinct from missing grades and ignores removed subjects', () => {
    expect(
      gradeSummary({ ...student, grades: { 1: 0 } }, subjects),
    ).toMatchObject({ entered: 1, complete: false, average: 0 });
    expect(
      gradeSummary({ ...student, grades: { 1: 80, 2: 90, 99: 100 } }, subjects),
    ).toMatchObject({ entered: 2, complete: true, average: 85 });
    expect(subjectsForClass('Unknown', subjects, mappings)).toEqual([]);
  });
  it('copies identities into a new term without overwriting history or duplicate NIS', () => {
    const next = {
      ...settings,
      tahunAjaran: '2026/2027',
      semester: 'Ganjil' as const,
    };
    const enrolled = enrollNextTerm([student], settings, next);
    expect(enrolled[0]).toMatchObject({
      nis: student.nis,
      grades: {},
      semester: 'Ganjil',
      sakit: 0,
    });
    expect(enrolled[0].id).not.toBe(student.id);
    expect(student.grades).toEqual({ 1: 80 });
    expect(enrollNextTerm([student, ...enrolled], settings, next)).toEqual([]);
    expect(
      enrollNextTerm(
        [student, { ...student, id: 'duplicate' }],
        settings,
        next,
      ),
    ).toHaveLength(1);
  });
});
