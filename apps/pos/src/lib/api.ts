/**
 * api.ts — Axios instance with offline detection.
 *
 * Strategy:
 *   - GET requests: try network first, fall back to IndexedDB cache.
 *   - Mutating requests (POST/PUT/PATCH/DELETE):
 *       • If online → send immediately.
 *       • If offline → enqueue in IndexedDB, return a { queued: true } marker.
 *   - Automatically caches GET responses for tables, menu_items, menu_categories.
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { enqueue, setCache, getCache, QueueActionType } from './offlineStore';

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ──────────────────────────────────────────────
// Auth token injection
// ──────────────────────────────────────────────

export function setAuthToken(token: string): void {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearAuthToken(): void {
  delete axiosInstance.defaults.headers.common['Authorization'];
}

// ──────────────────────────────────────────────
// Online detection
// ──────────────────────────────────────────────

export function isOnline(): boolean {
  return navigator.onLine;
}

// ──────────────────────────────────────────────
// Cacheable endpoints
// ──────────────────────────────────────────────

/** Endpoints whose GET responses are cached for offline use. */
const CACHEABLE_ENDPOINTS: Record<string, string> = {
  '/tables': 'tables',
  '/menu-items': 'menu_items',
  '/menu-categories': 'menu_categories',
};

function getCacheKey(url: string): string | null {
  for (const [endpoint, key] of Object.entries(CACHEABLE_ENDPOINTS)) {
    if (url.startsWith(endpoint)) return key;
  }
  return null;
}

// ──────────────────────────────────────────────
// Core request wrapper
// ──────────────────────────────────────────────

export interface QueuedResponse {
  queued: true;
  queueId: string;
}

/**
 * Smart API request that handles offline scenarios.
 */
export async function apiRequest<T = unknown>(
  config: AxiosRequestConfig & { offlineAction?: QueueActionType },
): Promise<AxiosResponse<T> | QueuedResponse> {
  const method = (config.method || 'GET').toUpperCase();
  const url = config.url || '';

  // ── GET requests: network-first, cache-fallback ──
  if (method === 'GET') {
    if (isOnline()) {
      try {
        const response = await axiosInstance.request<T>(config);
        // Cache the response for offline use
        const cacheKey = getCacheKey(url);
        if (cacheKey) {
          await setCache(cacheKey, response.data);
        }
        return response;
      } catch (error) {
        // Network error — try cache
        const cacheKey = getCacheKey(url);
        if (cacheKey) {
          const cached = await getCache<T>(cacheKey);
          if (cached !== null) {
            return { data: cached, status: 200, statusText: 'OK (cached)' } as AxiosResponse<T>;
          }
        }
        throw error;
      }
    }

    // Offline — return from cache
    const cacheKey = getCacheKey(url);
    if (cacheKey) {
      const cached = await getCache<T>(cacheKey);
      if (cached !== null) {
        return { data: cached, status: 200, statusText: 'OK (cached)' } as AxiosResponse<T>;
      }
    }
    throw new Error('Offline and no cached data available');
  }

  // ── Mutating requests ──
  if (isOnline()) {
    return axiosInstance.request<T>(config);
  }

  // Offline → queue
  if (config.offlineAction) {
    const queueId = await enqueue(config.offlineAction, {
      method,
      url,
      data: config.data,
      params: config.params,
    });
    return { queued: true, queueId };
  }

  throw new Error('Offline — action cannot be queued (no offlineAction specified)');
}

// ──────────────────────────────────────────────
// Convenience methods
// ──────────────────────────────────────────────

export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'GET', url }),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    options?: { offlineAction?: QueueActionType } & AxiosRequestConfig,
  ) =>
    apiRequest<T>({ ...options, method: 'POST', url, data, offlineAction: options?.offlineAction }),

  put: <T = unknown>(
    url: string,
    data?: unknown,
    options?: { offlineAction?: QueueActionType } & AxiosRequestConfig,
  ) =>
    apiRequest<T>({ ...options, method: 'PUT', url, data, offlineAction: options?.offlineAction }),

  patch: <T = unknown>(
    url: string,
    data?: unknown,
    options?: { offlineAction?: QueueActionType } & AxiosRequestConfig,
  ) =>
    apiRequest<T>({
      ...options,
      method: 'PATCH',
      url,
      data,
      offlineAction: options?.offlineAction,
    }),

  delete: <T = unknown>(
    url: string,
    options?: { offlineAction?: QueueActionType } & AxiosRequestConfig,
  ) =>
    apiRequest<T>({ ...options, method: 'DELETE', url, offlineAction: options?.offlineAction }),
};

export { axiosInstance };
