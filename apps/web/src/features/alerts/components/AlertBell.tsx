/**
 * AlertBell.tsx — Notification bell icon for the TopBar.
 *
 * Shows a badge with the unread alert count.
 * - Red badge for critical alerts (86'd items exist)
 * - Yellow badge for warnings only (low stock)
 * - No badge when all read
 *
 * Click opens the AlertPanel slide-out.
 */
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import AlertPanel from './AlertPanel';

interface AlertBellProps {
  restaurantId: string;
}

export default function AlertBell({ restaurantId }: AlertBellProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const {
    alerts,
    unreadCount,
    markAllRead,
    dismissAlert,
    clearAll,
    isConnected,
  } = useAlerts(restaurantId);

  // Determine badge color: red if any unread 86'd alerts, yellow otherwise
  const hasUnread86d = alerts.some((a) => a.type === 'ITEM_86D' && !a.read);
  const badgeColor = hasUnread86d ? 'bg-error' : 'bg-yellow-500';

  const handleBellClick = () => {
    setIsPanelOpen(true);
    // Mark as read after a short delay (so user sees the badge disappear)
    setTimeout(() => markAllRead(), 500);
  };

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="text-text-secondary hover:text-gold transition-colors relative"
        title={
          isConnected
            ? `${unreadCount} thông báo chưa đọc`
            : 'Mất kết nối WebSocket'
        }
      >
        <Bell size={20} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className={`
              absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
              ${badgeColor} rounded-full
              flex items-center justify-center
              text-[10px] font-bold text-white
              animate-pulse
            `}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection indicator dot */}
        {!isConnected && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-surface-base" />
        )}
      </button>

      {/* Alert Panel */}
      <AlertPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        alerts={alerts}
        onMarkAllRead={markAllRead}
        onDismiss={dismissAlert}
        onClearAll={clearAll}
      />
    </>
  );
}
