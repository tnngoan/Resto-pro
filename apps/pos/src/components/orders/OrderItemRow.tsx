/**
 * OrderItemRow.tsx — Single line item in the order ticket.
 * Shows: name, qty controls (-, qty, +), line total, note indicator.
 */
import React from 'react';
import { Minus, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { formatVND } from '@restopro/shared';
import type { OrderItemDraft } from '@/store/pos';

interface OrderItemRowProps {
  item: OrderItemDraft;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onEditNote: () => void;
}

export function OrderItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  onEditNote,
}: OrderItemRowProps) {
  return (
    <div className="flex items-center gap-2 py-2 px-2 border-b border-surface-light/50 last:border-b-0 group">
      {/* Item name + note */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary truncate">{item.name}</p>
        {item.notes && (
          <p className="text-xs text-gold-400 truncate mt-0.5">📝 {item.notes}</p>
        )}
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onDecrement}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-light hover:bg-red-500/20 transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
        <button
          onClick={onIncrement}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-light hover:bg-green-500/20 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Line total */}
      <span className="w-24 text-right text-sm font-medium text-primary tabular-nums shrink-0">
        {formatVND(item.totalPrice)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEditNote}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gold-500/20 transition-colors"
          title="Ghi chú"
        >
          <MessageSquare size={12} className="text-gold-400" />
        </button>
        <button
          onClick={onRemove}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-red-500/20 transition-colors"
          title="Xóa"
        >
          <Trash2 size={12} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}
