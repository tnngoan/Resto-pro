/**
 * TableGrid.tsx — Visual grid of table tiles.
 * Displays all tables with zone filtering.
 */
import React, { useMemo, useState } from 'react';
import type { Table } from '@restopro/shared';
import { TableTile } from './TableTile';

interface TableGridProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
}

export function TableGrid({ tables, onSelectTable }: TableGridProps) {
  const [activeZone, setActiveZone] = useState<string | null>(null);

  // Extract unique zones
  const zones = useMemo(() => {
    const zoneSet = new Set(tables.map((t) => t.zone).filter(Boolean) as string[]);
    return Array.from(zoneSet).sort();
  }, [tables]);

  // Filter tables by zone
  const filteredTables = useMemo(() => {
    if (!activeZone) return tables;
    return tables.filter((t) => t.zone === activeZone);
  }, [tables, activeZone]);

  return (
    <div className="flex flex-col h-full">
      {/* Zone filter tabs */}
      {zones.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveZone(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] ${
              activeZone === null
                ? 'bg-gold-500 text-surface-dark'
                : 'bg-surface-medium text-secondary hover:bg-surface-light'
            }`}
          >
            Tất cả ({tables.length})
          </button>
          {zones.map((zone) => {
            const count = tables.filter((t) => t.zone === zone).length;
            return (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] ${
                  activeZone === zone
                    ? 'bg-gold-500 text-surface-dark'
                    : 'bg-surface-medium text-secondary hover:bg-surface-light'
                }`}
              >
                {zone} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Table grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filteredTables.map((table) => (
            <TableTile key={table.id} table={table} onSelect={onSelectTable} />
          ))}
        </div>

        {filteredTables.length === 0 && (
          <div className="flex items-center justify-center h-48 text-tertiary text-sm">
            Không có bàn nào
          </div>
        )}
      </div>
    </div>
  );
}
