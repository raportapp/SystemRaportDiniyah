import { useState, useCallback } from 'react';
import { SystemLog } from '../types';
import { dbService } from '../lib/db';

export function useLogs() {
  const [logs, setLogsRaw] = useState<SystemLog[]>([]);

  const setLogs = useCallback((val: SystemLog[] | ((prev: SystemLog[]) => SystemLog[])) => {
    setLogsRaw(prev => {
      const nextLogs = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        localStorage.setItem('raport_logs', JSON.stringify(nextLogs.slice(0, 150)));
      }
      return nextLogs;
    });
  }, []);

  const addLog = async (action: string, details: string, user: string) => {
    const newLog: SystemLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      details,
      user
    };

    setLogs(prev => [newLog, ...prev]);

    try {
      await dbService.saveLog(newLog);
    } catch (err) {
      console.error("Gagal menyimpan log:", err);
    }
  };

  const clearAllLogs = async () => {
    setLogs([]);
    try {
      await dbService.clearAllLogs();
    } catch (err) {
      console.error("Gagal menghapus log:", err);
    }
  };

  return {
    logs,
    setLogs,
    addLog,
    clearAllLogs
  };
}
