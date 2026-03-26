/**
 * EightySixSidebar.tsx — Sidebar showing currently 86'd items on the KDS.
 *
 * Displays a compact list of items that are out of stock today.
 * Kitchen staff can see at a glance what's unavailable.
 *
 * ┌── 86 Hôm nay ──────────┐
 * │ ❌ Carbonara (hết guanciale) │
 * │ ❌ Osso Buco              │
 * └──────────────────────────┘
 */
import React from 'react';
import type { Item86d } from '../hooks/use86dItems';

interface EightySixSidebarProps {
  items: Item86d[];
}

export default function EightySixSidebar({
  items,
}: EightySixSidebarProps): React.ReactElement | null {
  if (items.length === 0) return null;

  return (
    <div className="w-56 flex-shrink-0 bg-red-950 border-l-2 border-red-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-red-900 border-b border-red-700 flex-shrink-0">
        <h2 className="font-bold text-sm text-red-200 uppercase tracking-wider">
          86 Hôm nay
        </h2>
        <p className="text-xs text-red-400 mt-0.5">
          {items.length} món hết hàng
        </p>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.menuItemId}
            className="px-3 py-2 bg-red-900/50 rounded-lg border border-red-800"
          >
            <div className="flex items-start gap-2">
              <span className="text-red-400 flex-shrink-0 mt-0.5">❌</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-100 truncate">
                  {item.menuItemName}
                </p>
                {item.reason && (
                  <p className="text-xs text-red-400 truncate mt-0.5">
                    {item.reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
