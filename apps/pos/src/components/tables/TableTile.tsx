/**
 * TableTile.tsx — Single table tile with status colour coding.
 *
 * Colours:
 *   - AVAILABLE     → dark surface with green border
 *   - OCCUPIED      → crimson tint
 *   - RESERVED      → gold tint
 *   - NEEDS_ATTENTION → red pulse
 *   - CLEANING      → blue tint
 */
import React from 'react';
import { Users } from 'lucide-react';
import type { Table, TableStatus } from '@restopro/shared';

interface TableTileProps {
  table: Table;
  onSelect: (table: Table) => void;
}

const STATUS_STYLES: Record<TableStatus, string> = {
  AVAILABLE: 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20',
  OCCUPIED: 'border-crimson-500/50 bg-crimson-500/10 hover:bg-crimson-500/20',
  RESERVED: 'border-gold-500/50 bg-gold-500/10 hover:bg-gold-500/20',
  NEEDS_ATTENTION: 'border-red-500/50 bg-red-500/15 hover:bg-red-500/25 animate-pulse',
  CLEANING: 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20',
};

const STATUS_LABELS: Record<TableStatus, string> = {
  AVAILABLE: 'Trống',
  OCCUPIED: 'Đang dùng',
  RESERVED: 'Đã đặt',
  NEEDS_ATTENTION: 'Cần hỗ trợ',
  CLEANING: 'Đang dọn',
};

export function TableTile({ table, onSelect }: TableTileProps) {
  return (
    <button
      onClick={() => onSelect(table)}
      className={`
        flex flex-col items-center justify-center gap-2
        w-full aspect-square rounded-xl border-2
        transition-all duration-200 cursor-pointer
        touch-highlight-transparent min-h-[100px]
        ${STATUS_STYLES[table.status]}
      `}
    >
      {/* Table name */}
      <span className="text-xl font-bold text-primary">{table.name}</span>

      {/* Capacity */}
      <div className="flex items-center gap-1 text-secondary">
        <Users size={14} />
        <span className="text-xs">
          {table.currentCovers ?? 0}/{table.capacity}
        </span>
      </div>

      {/* Status label */}
      <span className="text-xs font-medium text-tertiary">{STATUS_LABELS[table.status]}</span>
    </button>
  );
}
