import { SystemSettings } from '../types';
import { dbService } from '../lib/db';
import { INITIAL_SETTINGS } from '../utils/initialData';
import { useCachedState } from './useCachedState';

export function useSettings() {
  const [settings, setSettings] = useCachedState<SystemSettings>(
    'raport_settings',
    INITIAL_SETTINGS,
  );
  const saveSettings = async (next: SystemSettings) => {
    const { compressSettingsImages } = await import('../utils/imageCompressor');
    const compressed = await compressSettingsImages(next);
    await dbService.saveSettings(compressed);
    setSettings(compressed);
  };
  return { settings, setSettings, saveSettings };
}
