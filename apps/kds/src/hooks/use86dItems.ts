/**
 * use86dItems.ts — Track menu items that are currently 86'd (out of stock).
 *
 * Connects to the Kitchen WebSocket namespace and listens for:
 *   - menu:item_86d       → add item to 86'd list
 *   - menu:item_available → remove item from 86'd list
 *
 * Also fetches the initial list from the API on mount.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Item86d {
  menuItemId: string;
  menuItemName: string;
  reason: string;
  timestamp: string;
}

interface Use86dItemsReturn {
  items86d: Item86d[];
  isConnected: boolean;
  count: number;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export function use86dItems(restaurantId: string): Use86dItemsReturn {
  const [items86d, setItems86d] = useState<Item86d[]>([]);
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
      socket.emit('kitchen:join', { restaurantId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Item 86'd → add to list
    socket.on('menu:item_86d', (data: any) => {
      setItems86d((prev) => {
        // Avoid duplicates
        if (prev.some((item) => item.menuItemId === data.menuItemId)) return prev;
        return [
          ...prev,
          {
            menuItemId: data.menuItemId,
            menuItemName: data.menuItemName,
            reason: data.reason || 'Hết hàng',
            timestamp: data.timestamp || new Date().toISOString(),
          },
        ];
      });
    });

    // Item available again → remove from list
    socket.on('menu:item_available', (data: any) => {
      setItems86d((prev) =>
        prev.filter((item) => item.menuItemId !== data.menuItemId),
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [restaurantId]);

  return {
    items86d,
    isConnected,
    count: items86d.length,
  };
}
