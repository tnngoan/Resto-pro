/**
 * TableSelect.tsx — Initial screen: pick a table before starting an order.
 *
 * If the table already has an open order (PLACED/CONFIRMED), loads it into
 * the store so staff can add items.
 */
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Table, Order } from '@restopro/shared';
import { usePOSStore } from '@/store/pos';
import { useTableSocket } from '@/hooks/useTableSocket';
import { TableGrid } from '@/components/tables/TableGrid';
import { api } from '@/lib/api';

export function TableSelect() {
  const navigate = useNavigate();
  const { tables } = useTableSocket();
  const { setTable, setExistingOrder, clearOrder } = usePOSStore();

  const handleSelectTable = useCallback(
    async (table: Table) => {
      clearOrder();
      setTable(table.id, table.name);

      // If table has an open order, load it
      if (table.currentOrderId) {
        try {
          const res = await api.get<Order>(`/orders/${table.currentOrderId}`);
          if (!('queued' in res)) {
            const order = res.data;
            if (['PLACED', 'CONFIRMED', 'PREPARING'].includes(order.status)) {
              setExistingOrder(order.id, order.items);
            }
          }
        } catch (err) {
          console.warn('[TableSelect] Could not load existing order:', err);
        }
      }

      navigate('/pos');
    },
    [navigate, setTable, setExistingOrder, clearOrder],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-4 shrink-0">
        <h1 className="text-2xl font-bold text-primary">Chọn bàn</h1>
        <p className="text-sm text-tertiary mt-1">
          Chọn bàn để bắt đầu gọi món • {tables.length} bàn
        </p>
      </div>

      {/* Table grid */}
      <div className="flex-1 overflow-hidden">
        <TableGrid tables={tables} onSelectTable={handleSelectTable} />
      </div>
    </div>
  );
}
