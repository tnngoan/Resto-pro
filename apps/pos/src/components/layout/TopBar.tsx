/**
 * TopBar.tsx — Top bar for POS showing:
 *   - Restaurant name / logo
 *   - Current staff name
 *   - Live clock (HH:mm)
 *   - Online/offline indicator with queue count
 */
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Clock, User, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePOSStore } from '@/store/pos';

interface TopBarProps {
  isOnline: boolean;
  isSyncing: boolean;
  queueLength: number;
  onSyncNow: () => void;
}

export function TopBar({ isOnline, isSyncing, queueLength, onSyncNow }: TopBarProps) {
  const [time, setTime] = useState(formatTime());
  const staff = usePOSStore((s) => s.staff);
  const navigate = useNavigate();
  const location = useLocation();

  const isOnTableSelect = location.pathname === '/' || location.pathname === '/tables';

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 1_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-surface-medium border-b border-surface-light shrink-0 select-none">
      {/* Left: back button + brand */}
      <div className="flex items-center gap-3">
        {!isOnTableSelect && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-surface-light transition-colors"
            title="Chọn bàn"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <span className="text-lg font-bold text-gold-500 tracking-tight">RestoPro POS</span>
      </div>

      {/* Centre: staff name */}
      <div className="flex items-center gap-2 text-secondary">
        <User size={16} />
        <span className="text-sm font-medium">{staff?.name || 'Chưa đăng nhập'}</span>
      </div>

      {/* Right: clock + sync indicator */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="flex items-center gap-1.5 text-secondary">
          <Clock size={16} />
          <span className="text-sm font-mono tabular-nums">{time}</span>
        </div>

        {/* Sync indicator */}
        <button
          onClick={onSyncNow}
          disabled={isSyncing || !isOnline}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-light transition-colors disabled:opacity-50"
          title={
            isOnline
              ? queueLength > 0
                ? `Đang chờ đồng bộ ${queueLength} đơn`
                : 'Đã đồng bộ'
              : 'Mất kết nối'
          }
        >
          {isSyncing ? (
            <RefreshCw size={16} className="text-blue-400 animate-spin" />
          ) : isOnline ? (
            <Wifi size={16} className="text-green-400" />
          ) : (
            <WifiOff size={16} className="text-red-400" />
          )}

          {isOnline ? (
            queueLength > 0 ? (
              <span className="text-xs text-gold-400 font-medium">
                Đang chờ ({queueLength})
              </span>
            ) : (
              <span className="text-xs text-green-400">Online</span>
            )
          ) : (
            <span className="text-xs text-red-400">
              Offline{queueLength > 0 ? ` (${queueLength})` : ''}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

function formatTime(): string {
  return new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}
