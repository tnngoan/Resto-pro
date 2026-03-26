/**
 * usePOSSync.ts — Watches network status and triggers queue drain on reconnect.
 *
 * Features:
 *   - Listens to `online` / `offline` browser events
 *   - When going from offline → online, calls processQueue()
 *   - Periodic sync (every 30s while online) as a safety net
 *   - Exposes `isOnline` for the sync indicator in TopBar
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePOSSyncOptions {
  processQueue: () => Promise<void>;
  /** Interval in ms for periodic sync while online. Default: 30 000 */
  syncInterval?: number;
}

interface UsePOSSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncNow: () => Promise<void>;
}

export function usePOSSync({
  processQueue,
  syncInterval = 30_000,
}: UsePOSSyncOptions): UsePOSSyncReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const syncingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncNow = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      await processQueue();
      setLastSyncAt(new Date());
    } catch (err) {
      console.error('[POSSync] Sync failed:', err);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [processQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.info('[POSSync] Network restored — syncing queue...');
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.warn('[POSSync] Network lost — entering offline mode.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow]);

  // Periodic sync while online
  useEffect(() => {
    if (isOnline) {
      // Initial sync on mount
      syncNow();

      intervalRef.current = setInterval(() => {
        syncNow();
      }, syncInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnline, syncInterval, syncNow]);

  return { isOnline, isSyncing, lastSyncAt, syncNow };
}
