import { useState, useMemo } from 'react';
import { Plus, Map, List, Users, Clock, X } from 'lucide-react';
import { Table, TableStatus } from '@restopro/shared';
import { Button } from '@restopro/ui';
import { useTables, useTableSocket } from '../features/tables/hooks/useTables';
import FloorPlan from '../features/tables/components/FloorPlan';
import TableCard from '../features/tables/components/TableCard';
import TableForm from '../features/tables/components/TableForm';
import TableStatusBadge from '../features/tables/components/TableStatusBadge';

// TODO: replace with real restaurant ID from auth context
const RESTAURANT_ID = 'rest-1';

type ViewMode = 'floor' | 'list';

export default function TableManagement() {
  // ─── State ───────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('floor');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // ─── Data ────────────────────────────────────────────────────────────────────
  const { data: tables = [], isLoading } = useTables(RESTAURANT_ID);
  useTableSocket(); // Subscribe to real-time updates

  // ─── Derived data ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter((t) => t.status === TableStatus.AVAILABLE).length;
    const occupied = tables.filter((t) => t.status === TableStatus.OCCUPIED).length;
    const reserved = tables.filter((t) => t.status === TableStatus.RESERVED).length;
    const cleaning = tables.filter((t) => t.status === TableStatus.CLEANING).length;
    const attention = tables.filter((t) => t.status === TableStatus.NEEDS_ATTENTION).length;
    return { total, available, occupied, reserved, cleaning, attention };
  }, [tables]);

  const existingZones = useMemo(() => {
    return Array.from(new Set(tables.map((t) => t.zone ?? 'Tầng 1')));
  }, [tables]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setEditingTable(null);
    setIsFormOpen(true);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setIsFormOpen(true);
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
  };

  const handleFormSubmit = (data: { name: string; capacity: number; zone: string }) => {
    // TODO: call create/update mutation when API is ready
    console.log('Table form submitted:', editingTable ? 'UPDATE' : 'CREATE', data);
    setIsFormOpen(false);
    setEditingTable(null);
  };

  const handleTableDrop = (tableId: string, positionX: number, positionY: number) => {
    // TODO: call update mutation for position
    console.log('Table dropped:', tableId, { positionX, positionY });
  };

  // ─── Elapsed time helper ─────────────────────────────────────────────────────
  const elapsedMinutes = (isoDate: string): number => {
    return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000));
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading text-text-primary mb-1">Quản lý bàn</h1>
          <p className="text-text-secondary text-sm">
            {stats.available}/{stats.total} bàn trống
            {stats.attention > 0 && (
              <span className="ml-2 text-orange-400">
                · {stats.attention} cần chú ý
              </span>
            )}
          </p>
        </div>
        <Button icon={<Plus size={18} />} onClick={handleAddNew}>
          Thêm bàn
        </Button>
      </div>

      {/* ── Status summary pills ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Trống', count: stats.available, color: 'bg-green-500' },
          { label: 'Có khách', count: stats.occupied, color: 'bg-red-500' },
          { label: 'Đặt trước', count: stats.reserved, color: 'bg-blue-500' },
          { label: 'Đang dọn', count: stats.cleaning, color: 'bg-yellow-500' },
          { label: 'Cần chú ý', count: stats.attention, color: 'bg-orange-500' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 bg-surface-base border border-surface-light rounded-lg px-4 py-2"
          >
            <span className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-text-secondary text-sm">{item.label}</span>
            <span className="text-text-primary font-bold">{item.count}</span>
          </div>
        ))}
      </div>

      {/* ── View toggle ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-surface-base border border-surface-light rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('floor')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
              viewMode === 'floor'
                ? 'bg-gold text-surface-base'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Map size={16} />
            Sơ đồ bàn
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
              viewMode === 'list'
                ? 'bg-gold text-surface-base'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <List size={16} />
            Danh sách
          </button>
        </div>
      </div>

      {/* ── Loading skeleton ────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-base border border-surface-light rounded-card p-4 animate-pulse"
            >
              <div className="h-5 bg-surface-light rounded w-2/3 mb-3" />
              <div className="h-4 bg-surface-light rounded w-1/2 mb-2" />
              <div className="h-3 bg-surface-light rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* ── Floor Plan View ─────────────────────────────────────────────────── */}
      {!isLoading && viewMode === 'floor' && (
        <FloorPlan
          tables={tables}
          onTableClick={handleTableClick}
          onTableEdit={handleEdit}
          onTableDrop={handleTableDrop}
        />
      )}

      {/* ── List View ───────────────────────────────────────────────────────── */}
      {!isLoading && viewMode === 'list' && (
        <div className="bg-surface-base border border-surface-light rounded-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-light border-b border-surface-light">
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Tên bàn</th>
                  <th className="text-center px-4 py-3 text-text-secondary font-medium">Khu vực</th>
                  <th className="text-center px-4 py-3 text-text-secondary font-medium">Số chỗ</th>
                  <th className="text-center px-4 py-3 text-text-secondary font-medium">Trạng thái</th>
                  <th className="text-center px-4 py-3 text-text-secondary font-medium">Thời gian</th>
                  <th className="text-center px-4 py-3 text-text-secondary font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-light">
                {tables.map((table) => (
                  <tr
                    key={table.id}
                    className="hover:bg-surface-light/50 transition-colors cursor-pointer"
                    onClick={() => handleTableClick(table)}
                  >
                    <td className="px-4 py-3 text-text-primary font-medium">{table.name}</td>
                    <td className="px-4 py-3 text-center text-text-secondary">{table.zone ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-text-secondary">
                        <Users size={14} />
                        <span>
                          {table.currentCovers !== undefined && table.status === TableStatus.OCCUPIED
                            ? `${table.currentCovers}/`
                            : ''}
                          {table.capacity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TableStatusBadge status={table.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-text-tertiary text-xs">
                      {table.seatedAt && table.status === TableStatus.OCCUPIED ? (
                        <span className="flex items-center justify-center gap-1">
                          <Clock size={12} />
                          {elapsedMinutes(table.seatedAt)} phút
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(table);
                        }}
                        className="text-text-tertiary hover:text-gold transition-colors text-xs underline"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Table Detail Drawer ─────────────────────────────────────────────── */}
      {selectedTable && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSelectedTable(null)}
          />
          {/* Drawer */}
          <div className="fixed right-0 top-0 bottom-0 z-50 w-96 bg-surface-base border-l border-surface-light shadow-2xl overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-heading text-text-primary">
                  {selectedTable.name}
                </h2>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
                  Trạng thái
                </p>
                <TableStatusBadge status={selectedTable.status} size="md" />
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Khu vực</span>
                  <span className="text-text-primary">{selectedTable.zone ?? '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Số chỗ</span>
                  <span className="text-text-primary">{selectedTable.capacity}</span>
                </div>
                {selectedTable.currentCovers !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Khách hiện tại</span>
                    <span className="text-text-primary">{selectedTable.currentCovers}</span>
                  </div>
                )}
                {selectedTable.seatedAt && selectedTable.status === TableStatus.OCCUPIED && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Thời gian ngồi</span>
                    <span className="text-text-primary">
                      {elapsedMinutes(selectedTable.seatedAt)} phút
                    </span>
                  </div>
                )}
              </div>

              {/* Order info placeholder */}
              {selectedTable.currentOrderId && (
                <div className="bg-surface-dark border border-surface-light rounded-lg p-4">
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
                    Đơn hàng hiện tại
                  </p>
                  <p className="text-text-secondary text-sm">
                    Mã đơn: <span className="text-gold font-mono">{selectedTable.currentOrderId}</span>
                  </p>
                  <p className="text-xs text-text-tertiary mt-2">
                    Chi tiết đơn hàng sẽ hiển thị khi kết nối API
                  </p>
                </div>
              )}

              {/* Quick actions */}
              <div className="space-y-2 pt-4 border-t border-surface-light">
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-3">
                  Thao tác nhanh
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    handleEdit(selectedTable);
                    setSelectedTable(null);
                  }}
                >
                  Chỉnh sửa bàn
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Form Modal ──────────────────────────────────────────────────────── */}
      <TableForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTable(null);
        }}
        onSubmit={handleFormSubmit}
        editingTable={editingTable}
        existingZones={existingZones}
      />
    </div>
  );
}
