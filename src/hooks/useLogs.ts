import { SystemLog } from '../types';
import { dbService } from '../lib/db';
import { useCachedState } from './useCachedState';

export function useLogs() {
  const [logs, setLogs] = useCachedState<SystemLog[]>('raport_logs', []);
  const addLog = async (action: string, details: string, user: string) => {
    const log = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      details,
      user,
    };
    try {
      await dbService.saveLog(log);
      setLogs((previous) => [log, ...previous].slice(0, 150));
    } catch {
      // A failed audit write must not make a completed academic write look unsuccessful.
      window.dispatchEvent(
        new CustomEvent('raport-notice', {
          detail:
            'Data tersimpan, tetapi aktivitas belum tercatat. Periksa koneksi Anda.',
        }),
      );
    }
  };
  const clearAllLogs = async () => {
    await dbService.clearAllLogs();
    setLogs([]);
  };
  return { logs, setLogs, addLog, clearAllLogs };
}
