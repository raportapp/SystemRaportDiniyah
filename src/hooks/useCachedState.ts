import { useCallback, useRef, useState, SetStateAction } from 'react';

// Keep side effects outside React state updaters, which StrictMode can replay.
export function useCachedState<T>(key: string, initial: T) {
  const [value, setValue] = useState(initial);
  const current = useRef(value);
  const update = useCallback(
    (action: SetStateAction<T>) => {
      const next =
        typeof action === 'function'
          ? (action as (previous: T) => T)(current.current)
          : action;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        window.dispatchEvent(
          new CustomEvent('raport-notice', {
            detail:
              'Cadangan perangkat tidak dapat disimpan. Ruang penyimpanan browser mungkin penuh.',
          }),
        );
        // In explicit local mode the cache is the primary storage; keep the form open.
        if (localStorage.getItem('raport_use_cloud_sync') === 'false')
          throw new Error('Penyimpanan perangkat penuh. Data belum disimpan.');
      }
      current.current = next;
      setValue(next);
    },
    [key],
  );
  return [value, update] as const;
}
