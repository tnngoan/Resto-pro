/**
 * LowStockAlert.tsx — Individual alert card within the AlertPanel.
 *
 * Renders differently based on alert type:
 *   - LOW_STOCK:      Yellow warning — ingredient running low
 *   - ITEM_86D:       Red critical  — menu item marked unavailable
 *   - ITEM_AVAILABLE: Green success — item back in stock
 */
import { X, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import type { Alert } from '../hooks/useAlerts';

interface LowStockAlertProps {
  alert: Alert;
  onDismiss: (id: string) => void;
  onQuickRestock?: (ingredientId: string) => void;
  onUn86?: (menuItemId: string) => void;
}

export default function LowStockAlert({
  alert,
  onDismiss,
  onQuickRestock,
  onUn86,
}: LowStockAlertProps) {
  const timeAgo = getTimeAgo(alert.timestamp);

  if (alert.type === 'LOW_STOCK') {
    return (
      <div className={`p-4 rounded-lg border ${alert.read ? 'bg-surface-dark border-surface-light' : 'bg-yellow-950 border-yellow-700'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={16} className="text-yellow-100" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                {alert.ingredientName}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Còn{' '}
                <span className="font-bold text-yellow-400">
                  {alert.currentStock} {alert.unit}
                </span>{' '}
                / tối thiểu {alert.minStockLevel} {alert.unit}
              </p>
              <p className="text-xs text-text-secondary mt-1">{timeAgo}</p>
            </div>
          </div>
          <button
            onClick={() => onDismiss(alert.id)}
            className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Quick action */}
        {onQuickRestock && alert.ingredientId && (
          <button
            onClick={() => onQuickRestock(alert.ingredientId!)}
            className="mt-3 w-full py-2 px-3 text-xs font-medium bg-yellow-700 hover:bg-yellow-600 text-yellow-100 rounded-lg transition-colors"
          >
            Bổ sung kho
          </button>
        )}
      </div>
    );
  }

  if (alert.type === 'ITEM_86D') {
    return (
      <div className={`p-4 rounded-lg border ${alert.read ? 'bg-surface-dark border-surface-light' : 'bg-red-950 border-red-700'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <XCircle size={16} className="text-red-100" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                {alert.menuItemName}
              </p>
              <p className="text-xs text-red-400 mt-1">
                Hết hàng — {alert.reason}
              </p>
              <p className="text-xs text-text-secondary mt-1">{timeAgo}</p>
            </div>
          </div>
          <button
            onClick={() => onDismiss(alert.id)}
            className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Quick action */}
        {onUn86 && alert.menuItemId && (
          <button
            onClick={() => onUn86(alert.menuItemId!)}
            className="mt-3 w-full py-2 px-3 text-xs font-medium bg-red-700 hover:bg-red-600 text-red-100 rounded-lg transition-colors"
          >
            Bỏ 86 — Cho phép đặt lại
          </button>
        )}
      </div>
    );
  }

  // ITEM_AVAILABLE
  return (
    <div className={`p-4 rounded-lg border ${alert.read ? 'bg-surface-dark border-surface-light' : 'bg-green-950 border-green-700'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle2 size={16} className="text-green-100" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              {alert.menuItemName}
            </p>
            <p className="text-xs text-green-400 mt-1">
              Đã có hàng trở lại
            </p>
            <p className="text-xs text-text-secondary mt-1">{timeAgo}</p>
          </div>
        </div>
        <button
          onClick={() => onDismiss(alert.id)}
          className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  return `${Math.floor(diffSec / 86400)} ngày trước`;
}
