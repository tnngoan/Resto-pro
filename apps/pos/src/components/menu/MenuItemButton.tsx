/**
 * MenuItemButton.tsx — Large, touch-friendly button for a single menu item.
 *
 * Shows: name, price, 86'd badge if unavailable.
 * Min 48×48px for touch targets (we go bigger — full card).
 */
import React from 'react';
import type { MenuItem } from '@restopro/shared';
import { formatVND } from '@restopro/shared';

interface MenuItemButtonProps {
  item: MenuItem;
  onTap: (item: MenuItem) => void;
}

export function MenuItemButton({ item, onTap }: MenuItemButtonProps) {
  const isDisabled = !item.isAvailable || item.is86d;

  return (
    <button
      onClick={() => !isDisabled && onTap(item)}
      disabled={isDisabled}
      className={`
        relative flex flex-col items-center justify-center gap-1.5
        p-3 rounded-xl border transition-all duration-150
        min-h-[88px] min-w-[88px]
        touch-highlight-transparent
        ${
          isDisabled
            ? 'border-surface-light bg-surface-dark/50 opacity-50 cursor-not-allowed'
            : 'border-surface-light bg-surface-medium hover:bg-surface-light hover:border-gold-500/40 active:scale-95 cursor-pointer'
        }
      `}
    >
      {/* 86'd badge */}
      {item.is86d && (
        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
          86
        </div>
      )}

      {/* Item name */}
      <span className="text-sm font-semibold text-primary text-center leading-tight text-clamp-2">
        {item.name}
      </span>

      {/* Price */}
      <span className="text-xs font-medium text-gold-500">{formatVND(item.price)}</span>
    </button>
  );
}
