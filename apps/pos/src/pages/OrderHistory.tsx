/**
 * OrderHistory.tsx — Today's orders list with status badges and totals.
 * Used for reviewing what's been ordered today and tracking payments.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import type { Order, OrderStatus } from '@restopro/shared';
import { formatVND } from '@restopro/shared';
import { api } from '@/lib/api';

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Nháp',
  PLACED: 'Đã đặt',
  CONFIRMED: 'Xác nhận',
  PREPARING: 'Đang nấu',
  READY: 'Sẵn sàng',
  SERVED: 'Đã phục vụ',
  PAID: 'Đã thanh toán',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: 'text-tertiary bg-surface-light',
  PLACED: 'text-blue-300 bg-blue-500/15',
  CONFIRMED: 'text-blue-300 bg-blue-500/15',
  PREPARING: 'text-gold-400 bg-gold-500/15',
  READY: 'text-green-300 bg-green-500/15',
  SERVED: 'text-green-400 bg-green-500/20',
  PAID: 'text-gold-300 bg-gold-500/20',
  COMPLETED: 'text-secondary bg-surface-light',
  CANCELLED: 'text-red-400 bg-red-500/15',
};

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ data: Order[] } | Order[]>('/orders', {
        params: { today: true, limit: 100 },
      });
      if (!('queued' in res)) {
        const data = Array.isArray(res.data) ? res.data : (res.data as { data: Order[] }).data;
        setOrders(data);
      }
    } catch (err) {
      console.error('[OrderHistory] Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter by search
  const filtered = orders.filter((order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.tableName?.toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q) ||
      order.serverName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-primary">Đơn hàng hôm nay</h1>
          <p className="text-sm text-tertiary mt-1">{orders.length} đơn hàng</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-medium text-secondary hover:bg-surface-light transition-colors min-h-[44px]"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Search */}
      <div className="px-6 pb-3 shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo bàn, mã đơn..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-medium border border-surface-light text-primary text-sm placeholder-tertiary focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-tertiary text-sm">
            Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-tertiary text-sm">
            Không có đơn hàng nào
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-medium border border-surface-light/50"
              >
                {/* Table + time */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{order.tableName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-tertiary mt-0.5">
                    {order.items.length} món •{' '}
                    {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {order.serverName && ` • ${order.serverName}`}
                  </p>
                </div>

                {/* Total */}
                <span className="text-sm font-bold text-gold-500 tabular-nums shrink-0">
                  {formatVND(order.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
