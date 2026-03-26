/**
 * useAlerts.ts — WebSocket-powered alert state management for the dashboard.
 *
 * Connects to the Kitchen WebSocket namespace and listens for:
 *   - inventory:low_stock  → ingredient running low
 *   - menu:item_86d        → menu item marked as 86'd (out of stock)
 *   - menu:item_available  → previously-86'd item restored
 *
 * Provides:
 *   - alerts[]       — sorted list (newest first), with type + read status
 *   - unreadCount    — badge count for AlertBell
 *   - markAllRead()  — clear unread badge
 *   - dismissAlert() — remove a single alert
 *   - clearAll()     — remove all alerts
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AlertType = 'LOW_STOCK' | 'ITEM_86D' | 'ITEM_AVAILABLE';

export interface Alert {
  id: string;
  type: AlertType;
  read: boolean;
  timestamp: string;

  // LOW_STOCK fields
  ingredientId?: string;
  ingredientName?: string;
  currentStock?: number;
  minStockLevel?: number;
  unit?: string;

  // ITEM_86D / ITEM_AVAILABLE fields
  menuItemId?: string;
  menuItemName?: string;
  reason?: string;
}

interface UseAlertsReturn {
  alerts: Alert[];
  unreadCount: number;
  markAllRead: () => void;
  dismissAlert: (alertId: string) => void;
  clearAll: () => void;
  isConnected: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
const MAX_ALERTS = 50; // Cap to prevent memory bloat during long sessions

/** Simple UUID v4 generator for alert IDs */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAlerts(restaurantId: string): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // ── Play alert sound (low priority — fails silently) ──
  const playAlertSound = useCallback(() => {
    try {
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = 'sine';
      osc.frequency.value = 800;
      gain.gain.value = 0.3;

      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);

      // Second beep
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.value = 600;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.15);
      }, 200);
    } catch {
      // AudioContext not available — fail silently
    }
  }, []);

  // ── Add alert to state ──
  const addAlert = useCallback(
    (type: AlertType, data: Record<string, any>) => {
      const newAlert: Alert = {
        id: uuid(),
        type,
        read: false,
        timestamp: data.timestamp || new Date().toISOString(),
        ...data,
      };

      setAlerts((prev) => [newAlert, ...prev].slice(0, MAX_ALERTS));
      setUnreadCount((n) => n + 1);

      // Sound for critical alerts only (86'd items)
      if (type === 'ITEM_86D' || type === 'LOW_STOCK') {
        playAlertSound();
      }
    },
    [playAlertSound],
  );

  // ── WebSocket connection ──
  useEffect(() => {
    if (!restaurantId) return;

    const socket = io(`${WS_URL}/kitchen`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join the restaurant room to receive alerts
      socket.emit('restaurant:join', { restaurantId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // ── Low stock alert ──
    socket.on('inventory:low_stock', (data) => {
      addAlert('LOW_STOCK', data);
    });

    // ── Item 86'd ──
    socket.on('menu:item_86d', (data) => {
      addAlert('ITEM_86D', data);
    });

    // ── Item available again ──
    socket.on('menu:item_available', (data) => {
      addAlert('ITEM_AVAILABLE', data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [restaurantId, addAlert]);

  // ── Actions ──
  const markAllRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => {
      const alert = prev.find((a) => a.id === alertId);
      const next = prev.filter((a) => a.id !== alertId);
      if (alert && !alert.read) {
        setUnreadCount((n) => Math.max(0, n - 1));
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
    setUnreadCount(0);
  }, []);

  return {
    alerts,
    unreadCount,
    markAllRead,
    dismissAlert,
    clearAll,
    isConnected,
  };
}
