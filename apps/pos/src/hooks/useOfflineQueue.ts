/**
 * useOfflineQueue.ts — React hook wrapping the IndexedDB offline queue.
 *
 * Provides:
 *   - addToQueue()   — enqueue a new action
 *   - processQueue() — drain the queue (called by usePOSSync)
 *   - queueLength    — reactive count of pending actions
 *   - isProcessing   — true while the sync loop is running
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  enqueue,
  getQueue,
  getQueueLength,
  dequeue,
  markFailed,
  QueueActionType,
  QueuedAction,
} from '@/lib/offlineStore';
import { axiosInstance } from '@/lib/api';

interface UseOfflineQueueReturn {
  addToQueue: (action: QueueActionType, payload: Record<string, unknown>) => Promise<string>;
  processQueue: () => Promise<void>;
  queueLength: number;
  isProcessing: boolean;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queueLength, setQueueLength] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  // Refresh count
  const refreshCount = useCallback(async () => {
    const count = await getQueueLength();
    setQueueLength(count);
  }, []);

  // Refresh on mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // ── Enqueue ──
  const addToQueue = useCallback(
    async (action: QueueActionType, payload: Record<string, unknown>): Promise<string> => {
      const id = await enqueue(action, payload);
      await refreshCount();
      return id;
    },
    [refreshCount],
  );

  // ── Process (drain) ──
  const processQueue = useCallback(async () => {
    // Guard against concurrent processing
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const queue: QueuedAction[] = await getQueue();

      for (const entry of queue) {
        try {
          const { method, url, data, params } = entry.payload as {
            method: string;
            url: string;
            data?: unknown;
            params?: unknown;
          };

          await axiosInstance.request({
            method,
            url,
            data,
            params,
          });

          // Success → remove from queue
          await dequeue(entry.id);
          console.info(`[OfflineQueue] Synced: ${entry.action} (${entry.id})`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(
            `[OfflineQueue] Failed to sync ${entry.action} (${entry.id}): ${message}`,
          );
          await markFailed(entry.id, message);

          // If the server returns 4xx, the request is invalid — don't block the rest
          // If 5xx or network error, stop processing (server might be down)
          if (err && typeof err === 'object' && 'response' in err) {
            const status = (err as { response: { status: number } }).response?.status;
            if (status && status >= 500) {
              console.warn('[OfflineQueue] Server error — pausing queue processing.');
              break;
            }
            // 4xx → skip this entry, continue with next
          } else {
            // Network error → stop
            break;
          }
        }
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      await refreshCount();
    }
  }, [refreshCount]);

  return { addToQueue, processQueue, queueLength, isProcessing };
}
