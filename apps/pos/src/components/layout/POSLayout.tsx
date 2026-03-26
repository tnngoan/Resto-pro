/**
 * POSLayout.tsx — Full-screen layout with no scrollbars.
 *
 * Structure:
 *   ┌──────────────── TopBar ────────────────┐
 *   │                                         │
 *   │              Main Content               │
 *   │          (fills remaining space)        │
 *   │                                         │
 *   └─────────────────────────────────────────┘
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { usePOSSync } from '@/hooks/usePOSSync';

export function POSLayout() {
  const { processQueue, queueLength } = useOfflineQueue();
  const { isOnline, isSyncing, syncNow } = usePOSSync({ processQueue });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-dark select-none">
      <TopBar
        isOnline={isOnline}
        isSyncing={isSyncing}
        queueLength={queueLength}
        onSyncNow={syncNow}
      />

      {/* Sync notification banner */}
      {!isOnline && queueLength > 0 && (
        <div className="flex items-center justify-center gap-2 h-8 bg-crimson-500/20 text-crimson-300 text-xs font-medium shrink-0">
          <span>Mất kết nối — {queueLength} đơn hàng đang chờ đồng bộ</span>
        </div>
      )}

      {isSyncing && queueLength > 0 && (
        <div className="flex items-center justify-center gap-2 h-8 bg-blue-500/20 text-blue-300 text-xs font-medium shrink-0">
          <span>Đang đồng bộ... ({queueLength} đơn hàng)</span>
        </div>
      )}

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
