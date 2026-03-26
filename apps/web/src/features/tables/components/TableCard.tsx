import { Table, TableStatus } from '@restopro/shared';
import { Users, Clock, Pencil } from 'lucide-react';
import TableStatusBadge from './TableStatusBadge';

interface TableCardProps {
  table: Table;
  onClick: (table: Table) => void;
  onEdit: (table: Table) => void;
}

/** Calculate elapsed minutes since a given ISO date string */
function elapsedMinutes(isoDate: string): number {
  const diff = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(diff / 60000));
}

/** Color mapping for table card border based on status */
const borderColors: Record<TableStatus, string> = {
  [TableStatus.AVAILABLE]: 'border-green-500/40 hover:border-green-500',
  [TableStatus.OCCUPIED]: 'border-red-500/40 hover:border-red-500',
  [TableStatus.RESERVED]: 'border-blue-500/40 hover:border-blue-500',
  [TableStatus.CLEANING]: 'border-yellow-500/40 hover:border-yellow-500',
  [TableStatus.NEEDS_ATTENTION]: 'border-orange-500/40 hover:border-orange-500',
};

export default function TableCard({ table, onClick, onEdit }: TableCardProps) {
  const isOccupied = table.status === TableStatus.OCCUPIED;
  const elapsed = table.seatedAt ? elapsedMinutes(table.seatedAt) : 0;

  return (
    <div
      onClick={() => onClick(table)}
      className={`
        relative bg-surface-base border-2 rounded-card p-4 cursor-pointer
        transition-all duration-200 group
        ${borderColors[table.status]}
      `}
    >
      {/* Edit button (top right) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(table);
        }}
        className="absolute top-2 right-2 p-1.5 rounded text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-gold hover:bg-gold/10 transition-all"
        title="Chỉnh sửa bàn"
      >
        <Pencil size={14} />
      </button>

      {/* Table name */}
      <h3 className="text-text-primary font-bold text-lg">{table.name}</h3>

      {/* Status badge */}
      <div className="mt-2">
        <TableStatusBadge status={table.status} />
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-1.5 mt-3 text-text-secondary text-xs">
        <Users size={12} />
        <span>
          {table.currentCovers !== undefined && isOccupied
            ? `${table.currentCovers}/${table.capacity}`
            : table.capacity}{' '}
          chỗ
        </span>
      </div>

      {/* Occupied details */}
      {isOccupied && table.seatedAt && (
        <div className="mt-2 pt-2 border-t border-surface-light">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <Clock size={12} />
            <span>{elapsed} phút</span>
          </div>
        </div>
      )}

      {/* Needs attention pulsing indicator */}
      {table.status === TableStatus.NEEDS_ATTENTION && (
        <div className="absolute top-2 left-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
          </span>
        </div>
      )}
    </div>
  );
}
