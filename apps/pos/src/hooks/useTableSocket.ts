/**
 * useTableSocket.ts — Real-time table status via WebSocket (socket.io).
 *
 * Listens for:
 *   - table:updated  — a table's status changed (occupied, available, etc.)
 *   - order:placed   — new order placed on a table
 *   - order:paid     — order paid, table may become available
 *
 * Falls back gracefully when offline (just uses cached data).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Table } from '@restopro/shared';
import { api } from '@/lib/api';
import { setCache, getCache } from '@/lib/offlineStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

interface UseTableSocketReturn {
  tables: Table[];
  isConnected: boolean;
  refreshTables: () => Promise<void>;
}

export function useTableSocket(): UseTableSocketReturn {
  const [tables, setTables] = useState<Table[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // ── Fetch tables via REST (with offline cache fallback) ──
  const refreshTables = useCallback(async () => {
    try {
      const res = await api.get<{ data: Table[] } | Table[]>('/tables');
      if ('queued' in res) return; // offline, no cache
      const data = Array.isArray(res.data) ? res.data : (res.data as { data: Table[] }).data;
      setTables(data);
      await setCache('tables', data);
    } catch {
      // Try loading from cache
      const cached = await getCache<Table[]>('tables');
      if (cached) setTables(cached);
    }
  }, []);

  // ── WebSocket ──
  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.info('[TableSocket] Connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.warn('[TableSocket] Disconnected');
    });

    // Table status changed
    socket.on('table:updated', (updatedTable: Table) => {
      setTables((prev) => {
        const next = prev.map((t) => (t.id === updatedTable.id ? updatedTable : t));
        // Update cache
        setCache('tables', next);
        return next;
      });
    });

    // Order placed — table becomes occupied
    socket.on('order:placed', (data: { tableId: string; orderId: string }) => {
      setTables((prev) => {
        const next = prev.map((t) =>
          t.id === data.tableId
            ? { ...t, status: 'OCCUPIED' as Table['status'], currentOrderId: data.orderId }
            : t,
        );
        setCache('tables', next);
        return next;
      });
    });

    // Order paid — refresh tables (server decides new status)
    socket.on('order:paid', () => {
      refreshTables();
    });

    // Initial fetch
    refreshTables();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refreshTables]);

  return { tables, isConnected, refreshTables };
}
