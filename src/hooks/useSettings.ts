import { useState, useCallback } from 'react';
import { SystemSettings } from '../types';
import { dbService } from '../lib/db';
import { INITIAL_SETTINGS } from '../utils/initialData';

export function useSettings() {
  const [settings, setSettingsRaw] = useState<SystemSettings>(INITIAL_SETTINGS);

  const setSettings = useCallback((val: SystemSettings | ((prev: SystemSettings) => SystemSettings)) => {
    setSettingsRaw(prev => {
      const nextSettings = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        localStorage.setItem('raport_settings', JSON.stringify(nextSettings));
      }
      return nextSettings;
    });
  }, []);

  const saveSettings = async (newSettings: SystemSettings) => {
    setSettings(newSettings);
    try {
      await dbService.saveSettings(newSettings);
    } catch (err) {
      console.error("Gagal menyimpan pengaturan sistem:", err);
    }
  };

  return {
    settings,
    setSettings,
    saveSettings
  };
}
