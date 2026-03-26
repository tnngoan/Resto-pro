import React, { useState } from 'react';
import { Order, OrderItem, OrderItemStatus, OrderStatus } from '@restopro/shared';
import { formatTimeVN } from '@restopro/shared';
import { useElapsedTime } from '../hooks/useElapsedTime';

interface OrderTicketProps {
  order: Order;
  onBump: () => void;
  onItemStatusChange?: (itemId: string, status: OrderItemStatus) => void;
}

/**
 * Order ticket card component for the Kitchen Display System.
 * Displays order details, items, elapsed time with urgency indicators,
 * and action buttons.
 *
 * Visual hierarchy:
 * - Large table number (28px bold)
 * - Elapsed time with color coding (gold < 10min, crimson 10-20min, red >20min)
 * - Order items with quantity and modifications
 * - Status indicator for each item
 * - Bump button (context-specific)
 */
export default function OrderTicket({
  order,
  onBump,
  onItemStatusChange,
}: OrderTicketProps): React.ReactElement {
  const [completedItems, setCompletedItems] = useState<Set<string>>(
    new Set(
      order.items
        .filter((item) => item.status === OrderItemStatus.READY)
        .map((item) => item.id)
    )
  );

  const elapsed = useElapsedTime(order.createdAt);

  // Check if all items are ready
  const allReady = order.items.every((item) => item.status === OrderItemStatus.READY);

  // Toggle item completion
  const handleToggleItem = (itemId: string): void => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);

    if (onItemStatusChange) {
      const newStatus = newCompleted.has(itemId)
        ? OrderItemStatus.READY
        : OrderItemStatus.PREPARING;
      onItemStatusChange(itemId, newStatus);
    }
  };

  // Determine button text based on order status
  let buttonText = 'Bắt đầu nấu';
  let buttonColor = 'bg-gold-500 hover:bg-gold-600';
  let buttonDisabled = false;

  if (order.status === OrderStatus.PREPARING) {
    buttonText = allReady ? 'Sẵn sàng phục vụ' : 'Nhắc nhở';
    buttonColor = allReady
      ? 'bg-green-600 hover:bg-green-700'
      : 'bg-crimson-600 hover:bg-crimson-700';
  } else if (order.status === OrderStatus.READY) {
    buttonText = 'Đã giao';
    buttonColor = 'bg-secondary text-tertiary cursor-not-allowed';
    buttonDisabled = true;
  }

  // Determine timer color based on urgency
  const timerColor = {
    normal: 'text-gold-500', // < 10 min
    warning: 'text-crimson-500', // 10-20 min
    critical: 'text-red-500 animate-pulse', // > 20 min
  }[elapsed.urgencyLevel];

  // VIP indicator
  const isVip = order.items.some((item) => item.notes?.includes('VIP'));

  return (
    <div
      className={`
        bg-surface-medium border-2 border-surface-light rounded-lg
        flex flex-col h-full overflow-hidden transition-all
        ${isVip ? 'border-l-4 border-l-gold-500 bg-opacity-95' : ''}
        ${allReady ? 'ring-2 ring-green-500' : ''}
        ${elapsed.urgencyLevel === 'critical' ? 'animate-pulse' : ''}
      `}
    >
      {/* Header Section */}
      <div
        className={`
          px-4 py-3 border-b border-surface-light
          ${isVip ? 'bg-surface-light' : ''}
        `}
      >
        {/* Table number and order time */}
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <p className="text-3xl font-bold text-primary leading-none">
            Bàn {order.tableName}
          </p>
          <span className="text-xs text-secondary font-medium">
            {formatTimeVN(order.createdAt)}
          </span>
        </div>

        {/* Elapsed time and VIP badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${timerColor}`}>
              {elapsed.formattedTime}
            </span>
            {elapsed.urgencyLevel === 'critical' && (
              <span className="text-xs px-2 py-1 bg-red-600 text-white rounded-full font-bold animate-pulse">
                QUÁ HẠN
              </span>
            )}
          </div>
          {isVip && (
            <span className="text-xs px-2 py-1 bg-gold-500 text-surface-dark rounded-full font-bold">
              VIP
            </span>
          )}
        </div>
      </div>

      {/* Items Section - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {order.items.map((item: OrderItem, idx: number) => {
          // Check if this menu item is 86'd (out of stock)
          const isItem86d = (item as any).is86d === true;

          return (
            <div
              key={item.id}
              className={`border-b border-surface-light last:border-0 pb-2 last:pb-0 ${
                completedItems.has(item.id) ? 'opacity-60' : ''
              } ${isItem86d ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                {/* Item details */}
                <div className="flex-1 min-w-0">
                  {/* Quantity + Name */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-full ${isItem86d ? 'bg-red-600' : 'bg-gold-500'} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-bold text-surface-dark">
                        {isItem86d ? '✕' : item.quantity}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-semibold text-primary truncate ${
                        completedItems.has(item.id) || isItem86d ? 'line-through' : ''
                      }`}
                    >
                      {item.name}
                    </p>
                    {/* 86'd badge */}
                    {isItem86d && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-600 text-white rounded-full font-bold flex-shrink-0">
                        HẾT
                      </span>
                    )}
                  </div>

                  {/* English name if available */}
                  {item.nameIt && (
                    <p className={`text-xs text-gold-500 italic text-truncate ml-10 mb-1 ${isItem86d ? 'line-through' : ''}`}>
                      {item.nameIt}
                    </p>
                  )}

                  {/* Modifications */}
                  {item.modifications && item.modifications.length > 0 && (
                    <div className="ml-10 space-y-0.5">
                      {item.modifications.map((mod, modIdx) => (
                        <p key={modIdx} className="text-xs text-secondary italic">
                          • {mod}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-xs text-tertiary italic ml-10 mt-1">
                      Ghi chú: {item.notes}
                    </p>
                  )}
                </div>

                {/* Checkbox/Status indicator */}
                <button
                  onClick={() => handleToggleItem(item.id)}
                  disabled={isItem86d}
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                    font-bold text-xs transition-all
                    ${isItem86d
                      ? 'bg-red-800 text-red-300 cursor-not-allowed'
                      : completedItems.has(item.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-surface-light text-secondary hover:bg-surface-light'
                    }
                  `}
                  title={
                    isItem86d
                      ? 'Món đã hết hàng'
                      : completedItems.has(item.id)
                        ? 'Bỏ đánh dấu'
                        : 'Đánh dấu là xong'
                  }
                >
                  {isItem86d ? '✕' : completedItems.has(item.id) ? '✓' : '○'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer - Bump Button */}
      <div className="px-4 py-3 border-t border-surface-light bg-surface-light flex-shrink-0">
        <button
          onClick={onBump}
          disabled={buttonDisabled}
          className={`
            w-full py-3 px-4 rounded-lg font-bold text-base text-white
            transition-all active:scale-95 touch-highlight-transparent
            ${buttonColor}
            ${buttonDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
