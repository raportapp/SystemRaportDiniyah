import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ batches: [] as any[] }));
vi.mock('../src/lib/firebase', () => ({ db: {}, auth: { currentUser: null } }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_, name) => ({ collection: name })),
  doc: vi.fn((_, collection, id) => ({ collection, id })),
  query: vi.fn((...parts) => parts),
  where: vi.fn((...parts) => parts),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(() => {
    const batch = {
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    state.batches.push(batch);
    return batch;
  }),
}));
import { getDocs, setDoc } from 'firebase/firestore';
import { dbService } from '../src/lib/db';
import { student } from './fixtures';
beforeEach(() => {
  vi.clearAllMocks();
  state.batches.length = 0;
  localStorage.clear();
});
describe('cloud database regressions', () => {
  it('loads more than 300 santri and restores IDs from document paths', async () => {
    const docs = Array.from({ length: 350 }, (_, i) => ({
      id: 'id-' + i,
      data: () => ({ ...student, id: undefined }),
    }));
    vi.mocked(getDocs).mockResolvedValueOnce({
      forEach: (fn: any) => docs.forEach(fn),
    } as any);
    const loaded = await dbService.getStudents();
    expect(loaded).toHaveLength(350);
    expect(loaded[349].id).toBe('id-349');
  });
  it('splits large imports into safe Firestore batches', async () => {
    await dbService.saveStudentsBatch(
      Array.from({ length: 801 }, (_, i) => ({ ...student, id: 'id-' + i })),
    );
    expect(state.batches).toHaveLength(3);
    expect(
      state.batches.reduce(
        (sum, batch) => sum + batch.set.mock.calls.length,
        0,
      ),
    ).toBe(801);
    expect(
      state.batches.every(
        (batch) =>
          batch.set.mock.calls.length <= 500 &&
          batch.commit.mock.calls.length === 1,
      ),
    ).toBe(true);
  });
  it('removes deleted class mappings on the server instead of resurrecting them on reload', async () => {
    const stale = { id: 'Kubro_Awal_1', ref: { id: 'Kubro_Awal_1' } };
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [stale] } as any);
    await dbService.saveClassSubjects([]);
    expect(state.batches[0].delete).toHaveBeenCalledWith(stale.ref);
    expect(state.batches[0].commit).toHaveBeenCalled();
  });
  it('rejects quota failures instead of silently reporting a successful local fallback', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(setDoc).mockRejectedValueOnce({ code: 'resource-exhausted' });
    await expect(dbService.saveStudent(student)).rejects.toThrow(
      'Kuota database habis',
    );
    expect(localStorage.getItem('raport_db_quota_exhausted')).toBeNull();
  });
});
