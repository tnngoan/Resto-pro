import { useState } from 'react';
import { Table, TableStatus } from '@restopro/shared';
import TableCard from './TableCard';

interface FloorPlanProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
  onTableEdit: (table: Table) => void;
  onTableDrop?: (tableId: string, positionX: number, positionY: number) => void;
}

export default function FloorPlan({
  tables,
  onTableClick,
  onTableEdit,
  onTableDrop,
}: FloorPlanProps) {
  const [dragState, setDragState] = useState<{
    tableId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Group tables by zone
  const zones = Array.from(new Set(tables.map((t) => t.zone ?? 'Không xác định')));

  const tablesByZone = zones.reduce<Record<string, Table[]>>((acc, zone) => {
    acc[zone] = tables.filter((t) => (t.zone ?? 'Không xác định') === zone);
    return acc;
  }, {});

  // ─── Simple drag handlers (HTML5 drag) ─────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, table: Table) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragState({
      tableId: table.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', table.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    if (!dragState || !onTableDrop) return;

    const container = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.round(e.clientX - container.left - dragState.offsetX));
    const y = Math.max(0, Math.round(e.clientY - container.top - dragState.offsetY));

    onTableDrop(dragState.tableId, x, y);
    setDragState(null);
  };

  return (
    <div className="space-y-6">
      {zones.map((zone) => (
        <div key={zone}>
          {/* Zone header */}
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-text-primary font-semibold text-lg">{zone}</h3>
            <span className="text-text-tertiary text-sm">
              ({tablesByZone[zone].length} bàn)
            </span>
          </div>

          {/* Floor plan canvas */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, zone)}
            className="relative bg-surface-dark border border-surface-light rounded-card p-6 min-h-[200px]"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {tablesByZone[zone].map((table) => (
                <div
                  key={table.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, table)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <TableCard
                    table={table}
                    onClick={onTableClick}
                    onEdit={onTableEdit}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
