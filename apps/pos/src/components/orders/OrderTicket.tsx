/**
 * OrderTicket.tsx — Right-side panel showing the current order being built.
 *
 * Shows: table name, item list, subtotal, VAT, total, action buttons.
 * Actions: "Xóa đơn" (clear), "Gửi bếp" (send to kitchen).
 */
import React, { useState, useCallback } from 'react';
import { Send, Trash2, ShoppingBag } from 'lucide-react';
import { formatVND } from '@restopro/shared';
import { usePOSStore } from '@/store/pos';
import { api } from '@/lib/api';
import { OrderItemRow } from './OrderItemRow';
import { QuickNoteModal } from './QuickNoteModal';

interface OrderTicketProps {
  onOrderSent?: () => void;
}

export function OrderTicket({ onOrderSent }: OrderTicketProps) {
  const {
    selectedTableId,
    selectedTableName,
    currentOrderId,
    items,
    orderNote,
    subtotal,
    vatAmount,
    total,
    staff,
    addItem,
    removeItem,
    updateItemQty,
    setItemNote,
    setOrderNote,
    clearOrder,
  } = usePOSStore();

  const [noteModalItem, setNoteModalItem] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemForNote = items.find((i) => i.id === noteModalItem);

  // ── Send order to kitchen ──
  const sendToKitchen = useCallback(async () => {
    if (!selectedTableId || items.length === 0) return;
    setIsSending(true);
    setError(null);

    try {
      if (currentOrderId) {
        // ── Add items to existing order ──
        await api.post(
          `/orders/${currentOrderId}/items`,
          {
            items: items
              .filter((i) => i.status === 'PENDING')
              .map((i) => ({
                menuItemId: i.menuItemId,
                quantity: i.quantity,
                notes: i.notes || undefined,
                modifications: i.modifications.length > 0 ? i.modifications : undefined,
              })),
          },
          { offlineAction: 'ADD_ITEMS_TO_ORDER' },
        );
      } else {
        // ── Create new order ──
        await api.post(
          '/orders',
          {
            tableId: selectedTableId,
            items: items.map((i) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              notes: i.notes || undefined,
              modifications: i.modifications.length > 0 ? i.modifications : undefined,
            })),
            notes: orderNote || undefined,
            serverId: staff?.id,
          },
          { offlineAction: 'CREATE_ORDER' },
        );
      }

      clearOrder();
      onOrderSent?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gửi đơn hàng';
      setError(message);
      console.error('[OrderTicket] Failed to send order:', err);
    } finally {
      setIsSending(false);
    }
  }, [selectedTableId, currentOrderId, items, orderNote, staff, clearOrder, onOrderSent]);

  return (
    <div className="flex flex-col h-full bg-surface-medium border-l border-surface-light">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-light shrink-0">
        <div>
          <h2 className="text-base font-bold text-primary">
            {selectedTableName || 'Chọn bàn'}
          </h2>
          <p className="text-xs text-tertiary">
            {currentOrderId ? 'Thêm món' : 'Đơn hàng mới'}
            {items.length > 0 && ` — ${items.length} món`}
          </p>
        </div>
        <ShoppingBag size={20} className="text-gold-500" />
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2">
            <ShoppingBag size={32} className="opacity-30" />
            <p className="text-sm">Chọn món từ thực đơn</p>
          </div>
        ) : (
          items.map((item) => (
            <OrderItemRow
              key={item.id}
              item={item}
              onIncrement={() => updateItemQty(item.id, item.quantity + 1)}
              onDecrement={() => updateItemQty(item.id, item.quantity - 1)}
              onRemove={() => removeItem(item.id)}
              onEditNote={() => setNoteModalItem(item.id)}
            />
          ))
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-surface-light shrink-0 space-y-1">
          <div className="flex justify-between text-sm text-secondary">
            <span>Tạm tính</span>
            <span className="tabular-nums">{formatVND(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-secondary">
            <span>VAT (8%)</span>
            <span className="tabular-nums">{formatVND(vatAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-primary pt-1">
            <span>Tổng cộng</span>
            <span className="tabular-nums text-gold-500">{formatVND(total)}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 text-red-400 text-xs text-center shrink-0">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-surface-light shrink-0">
        <button
          onClick={clearOrder}
          disabled={items.length === 0}
          className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl bg-surface-light text-secondary font-medium text-sm hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-h-[48px]"
        >
          <Trash2 size={16} />
          Xóa đơn
        </button>
        <button
          onClick={sendToKitchen}
          disabled={items.length === 0 || !selectedTableId || isSending}
          className="flex items-center justify-center gap-2 flex-[2] py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-h-[48px]"
        >
          <Send size={16} />
          {isSending ? 'Đang gửi...' : 'Gửi bếp'}
        </button>
      </div>

      {/* Quick note modal */}
      {noteModalItem && itemForNote && (
        <QuickNoteModal
          itemName={itemForNote.name}
          currentNote={itemForNote.notes}
          onSave={(note) => {
            setItemNote(noteModalItem, note);
            setNoteModalItem(null);
          }}
          onClose={() => setNoteModalItem(null)}
        />
      )}
    </div>
  );
}
