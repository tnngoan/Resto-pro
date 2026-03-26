/**
 * AlertPanel.tsx — Slide-out panel listing active alerts.
 *
 * Two sections:
 *   - Red:    Hết hàng (86'd items)
 *   - Yellow: Sắp hết hàng (low stock warnings)
 *
 * Also shows green "available again" notices.
 */
import { X, Trash2, CheckCheck } from 'lucide-react';
import type { Alert } from '../hooks/useAlerts';
import LowStockAlert from './LowStockAlert';
import { apiClient } from '@/lib/api';

interface AlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export default function AlertPanel({
  isOpen,
  onClose,
  alerts,
  onMarkAllRead,
  onDismiss,
  onClearAll,
}: AlertPanelProps) {
  // Separate alerts by type
  const criticalAlerts = alerts.filter((a) => a.type === 'ITEM_86D');
  const warningAlerts = alerts.filter((a) => a.type === 'LOW_STOCK');
  const infoAlerts = alerts.filter((a) => a.type === 'ITEM_AVAILABLE');

  // Quick restock handler — navigates to inventory (placeholder)
  const handleQuickRestock = (ingredientId: string) => {
    // In production, open a modal or navigate to inventory page
    window.location.href = `/inventory?highlight=${ingredientId}`;
  };

  // Un-86 handler — calls API and lets WebSocket update state
  const handleUn86 = async (menuItemId: string) => {
    try {
      await apiClient.patch(`/menu/items/${menuItemId}/86d`, { is86d: false });
      // WebSocket will broadcast menu:item_available → useAlerts will add a green alert
    } catch (err) {
      console.error('Failed to un-86 item:', err);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-96 max-w-full bg-surface-base border-l border-surface-light
          z-50 flex flex-col transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-light flex-shrink-0">
          <h2 className="text-lg font-heading text-text-primary">
            Thông báo kho
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onMarkAllRead}
              title="Đánh dấu tất cả đã đọc"
              className="text-text-secondary hover:text-gold transition-colors"
            >
              <CheckCheck size={18} />
            </button>
            <button
              onClick={onClearAll}
              title="Xóa tất cả"
              className="text-text-secondary hover:text-error transition-colors"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-text-secondary text-sm">
              Không có thông báo
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Critical: 86'd items */}
              {criticalAlerts.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Hết hàng ({criticalAlerts.length})
                  </h3>
                  <div className="space-y-3">
                    {criticalAlerts.map((alert) => (
                      <LowStockAlert
                        key={alert.id}
                        alert={alert}
                        onDismiss={onDismiss}
                        onUn86={handleUn86}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Warning: Low stock */}
              {warningAlerts.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Sắp hết hàng ({warningAlerts.length})
                  </h3>
                  <div className="space-y-3">
                    {warningAlerts.map((alert) => (
                      <LowStockAlert
                        key={alert.id}
                        alert={alert}
                        onDismiss={onDismiss}
                        onQuickRestock={handleQuickRestock}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Info: Items back in stock */}
              {infoAlerts.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Đã có hàng trở lại ({infoAlerts.length})
                  </h3>
                  <div className="space-y-3">
                    {infoAlerts.map((alert) => (
                      <LowStockAlert
                        key={alert.id}
                        alert={alert}
                        onDismiss={onDismiss}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
