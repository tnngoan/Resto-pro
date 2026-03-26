/**
 * useMenu86d.ts — Real-time 86'd item tracking for the customer QR menu.
 *
 * Connects to the Kitchen WebSocket namespace and listens for:
 *   - menu:item_86d       → mark item as unavailable
 *   - menu:item_available → mark item as available again
 *
 * Returns a Set of 86'd menuItemIds for O(1) lookups.
 */
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

interface UseMenu86dReturn {
  items86d: Set<string>;
  isConnected: boolean;
}

export function useMenu86d(restaurantId: string, tableId?: string): UseMenu86dReturn {
  const [items86d, setItems86d] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

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
      // Join customer room for this restaurant + table
      socket.emit('customer:join', {
        restaurantId,
        tableId: tableId || 'unknown',
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Item 86'd
    socket.on('menu:item_86d', (data: { menuItemId: string }) => {
      setItems86d((prev) => {
        const next = new Set(prev);
        next.add(data.menuItemId);
        return next;
      });
    });

    // Item available again
    socket.on('menu:item_available', (data: { menuItemId: string }) => {
      setItems86d((prev) => {
        const next = new Set(prev);
        next.delete(data.menuItemId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [restaurantId, tableId]);

  return { items86d, isConnected };
}
