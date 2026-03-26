/**
 * offlineStore.ts — IndexedDB-backed offline queue using the `idb` library.
 *
 * Architecture:
 *   1. Every mutating API call (create order, update status, etc.) is first
 *      written to IndexedDB as a QueuedAction.
 *   2. When online, the sync engine drains the queue in FIFO order.
 *   3. On success → delete from queue.
 *   4. On failure → increment retryCount, keep in queue (max 10 retries).
 *   5. A separate "cache" object store holds reference data (tables, menu)
 *      so the POS can render even when fully offline.
 */
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuid } from 'uuid';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type QueueActionType =
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'ADD_ITEMS_TO_ORDER'
  | 'UPDATE_ORDER_ITEM'
  | 'CANCEL_ORDER';

export interface QueuedAction {
  id: string;
  action: QueueActionType;
  /** Full request payload (body, params, etc.) */
  payload: Record<string, unknown>;
  /** ISO date string */
  createdAt: string;
  /** Number of times we've tried to sync this action */
  retryCount: number;
  /** Last error message (for debugging) */
  lastError?: string;
}

export interface CachedData {
  key: string; // e.g. 'tables', 'menu_items', 'menu_categories'
  data: unknown;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// IndexedDB Schema
// ──────────────────────────────────────────────

interface POSDatabase extends DBSchema {
  offlineQueue: {
    key: string;
    value: QueuedAction;
    indexes: { 'by-createdAt': string };
  };
  cache: {
    key: string;
    value: CachedData;
  };
}

const DB_NAME = 'restopro-pos';
const DB_VERSION = 1;
const MAX_RETRIES = 10;

let dbInstance: IDBPDatabase<POSDatabase> | null = null;

// ──────────────────────────────────────────────
// Database initialisation
// ──────────────────────────────────────────────

async function getDB(): Promise<IDBPDatabase<POSDatabase>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<POSDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Offline queue store
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id' });
        queueStore.createIndex('by-createdAt', 'createdAt');
      }

      // Cache store (tables, menu, etc.)
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// ──────────────────────────────────────────────
// Queue operations
// ──────────────────────────────────────────────

/**
 * Add a new action to the offline queue.
 * Returns the generated queue entry ID.
 */
export async function enqueue(
  action: QueueActionType,
  payload: Record<string, unknown>,
): Promise<string> {
  const db = await getDB();
  const entry: QueuedAction = {
    id: uuid(),
    action,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  await db.put('offlineQueue', entry);
  return entry.id;
}

/**
 * Return all queued actions sorted oldest-first (FIFO).
 */
export async function getQueue(): Promise<QueuedAction[]> {
  const db = await getDB();
  return db.getAllFromIndex('offlineQueue', 'by-createdAt');
}

/**
 * Get number of pending items in the queue.
 */
export async function getQueueLength(): Promise<number> {
  const db = await getDB();
  return db.count('offlineQueue');
}

/**
 * Remove a successfully synced action.
 */
export async function dequeue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('offlineQueue', id);
}

/**
 * Mark an action as failed (increment retry, store error).
 * If retries exceed MAX_RETRIES, remove the action (dead letter).
 */
export async function markFailed(id: string, error: string): Promise<void> {
  const db = await getDB();
  const entry = await db.get('offlineQueue', id);
  if (!entry) return;

  entry.retryCount += 1;
  entry.lastError = error;

  if (entry.retryCount >= MAX_RETRIES) {
    // Dead letter — log and remove
    console.error(
      `[OfflineQueue] Action ${entry.action} (${id}) exceeded ${MAX_RETRIES} retries. Dropping.`,
      entry,
    );
    await db.delete('offlineQueue', id);
    return;
  }

  await db.put('offlineQueue', entry);
}

/**
 * Clear the entire queue (e.g. after logout).
 */
export async function clearQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('offlineQueue');
}

// ──────────────────────────────────────────────
// Cache operations (tables, menu items, etc.)
// ──────────────────────────────────────────────

/**
 * Store reference data so the app can render offline.
 */
export async function setCache(key: string, data: unknown): Promise<void> {
  const db = await getDB();
  await db.put('cache', {
    key,
    data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Retrieve cached reference data.
 */
export async function getCache<T = unknown>(key: string): Promise<T | null> {
  const db = await getDB();
  const entry = await db.get('cache', key);
  return entry ? (entry.data as T) : null;
}

/**
 * Clear all cached data.
 */
export async function clearCache(): Promise<void> {
  const db = await getDB();
  await db.clear('cache');
}
