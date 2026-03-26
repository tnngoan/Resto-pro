import React, { useState } from 'react';
import { Order, OrderStatus, OrderItemStatus, KitchenStation } from '@restopro/shared';
import OrderTicket from './OrderTicket';
import { MOCK_ORDERS } from '../data/mockOrders';

interface KDSKanbanProps {
  selectedStation: KitchenStation | null;
}

/**
 * Kanban board component displaying orders in three columns:
 * 1. Mới (New) - CONFIRMED status orders waiting to be started
 * 2. Đang nấu (Cooking) - PREPARING/PLACED status orders actively being prepared
 * 3. Sẵn sàng (Ready) - READY status orders waiting to be served
 *
 * Layout: 3-column grid filling remaining screen space
 * Updates every second to keep elapsed times fresh
 */
export default function KDSKanban({
  selectedStation,
}: KDSKanbanProps): React.ReactElement {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});

  // Update elapsed times every second for smooth timer updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      const newTimes: Record<string, number> = {};
      orders.forEach((order) => {
        const createdAt = new Date(order.createdAt).getTime();
        newTimes[order.id] = Math.floor((Date.now() - createdAt) / 1000);
      });
      setElapsedTimes(newTimes);
    }, 1000);
    return () => clearInterval(interval);
  }, [orders]);

  const handleBump = (orderId: string): void => {
    // In production, this would call an API to transition the order status
    console.log(`Bumped order: ${orderId}`);
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          if (order.status === OrderStatus.CONFIRMED) {
            return { ...order, status: OrderStatus.PREPARING };
          }
          if (order.status === OrderStatus.PREPARING) {
            return { ...order, status: OrderStatus.READY };
          }
          if (order.status === OrderStatus.READY) {
            return { ...order, status: OrderStatus.SERVED };
          }
        }
        return order;
      })
    );
  };

  const handleItemStatusChange = (
    orderId: string,
    itemId: string,
    status: OrderItemStatus
  ): void => {
    // In production, this would call an API to update the item status
    console.log(`Updated order ${orderId} item ${itemId} to ${status}`);
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            items: order.items.map((item) =>
              item.id === itemId ? { ...item, status } : item
            ),
          };
        }
        return order;
      })
    );
  };

  // Filter orders by selected station (if applicable)
  // For now, we show all items. In production, filter by item.station
  const filteredOrders = selectedStation
    ? orders.filter((order) =>
        order.items.some((item) => {
          // In production, items would have a station property
          // For now, we assume all items are visible
          return true;
        })
      )
    : orders;

  // Group by status
  const newOrders = filteredOrders.filter((o) => o.status === OrderStatus.CONFIRMED);
  const cookingOrders = filteredOrders.filter(
    (o) => o.status === OrderStatus.PREPARING || o.status === OrderStatus.PLACED
  );
  const readyOrders = filteredOrders.filter((o) => o.status === OrderStatus.READY);

  return (
    <div className="flex-1 overflow-hidden bg-surface-dark p-6 gap-6 flex min-h-0">
      {/* Column 1: Mới (New Orders) */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-medium rounded-lg border border-surface-light overflow-hidden">
        {/* Column Header */}
        <div className="px-4 py-3 bg-surface-light border-b border-surface-light flex-shrink-0">
          <h2 className="font-bold text-lg text-gold-500">Mới</h2>
          <p className="text-sm text-secondary">{newOrders.length} đơn</p>
        </div>

        {/* Orders Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {newOrders.length > 0 ? (
            newOrders.map((order) => (
              <OrderTicket
                key={order.id}
                order={order}
                onBump={() => handleBump(order.id)}
                onItemStatusChange={(itemId, status) =>
                  handleItemStatusChange(order.id, itemId, status)
                }
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-secondary text-sm">
              Không có đơn hàng mới
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Đang nấu (Cooking) */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-medium rounded-lg border border-surface-light overflow-hidden">
        {/* Column Header */}
        <div className="px-4 py-3 bg-surface-light border-b border-surface-light flex-shrink-0">
          <h2 className="font-bold text-lg text-crimson-500">Đang nấu</h2>
          <p className="text-sm text-secondary">{cookingOrders.length} đơn</p>
        </div>

        {/* Orders Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {cookingOrders.length > 0 ? (
            cookingOrders.map((order) => (
              <OrderTicket
                key={order.id}
                order={order}
                onBump={() => handleBump(order.id)}
                onItemStatusChange={(itemId, status) =>
                  handleItemStatusChange(order.id, itemId, status)
                }
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-secondary text-sm">
              Không có đơn hàng
            </div>
          )}
        </div>
      </div>

      {/* Column 3: Sẵn sàng (Ready) */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-medium rounded-lg border-2 border-green-600 overflow-hidden">
        {/* Column Header - Green */}
        <div className="px-4 py-3 bg-green-900 border-b border-green-600 flex-shrink-0">
          <h2 className="font-bold text-lg text-green-300">Sẵn sàng</h2>
          <p className="text-sm text-green-400">{readyOrders.length} đơn</p>
        </div>

        {/* Orders Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {readyOrders.length > 0 ? (
            readyOrders.map((order) => (
              <OrderTicket
                key={order.id}
                order={order}
                onBump={() => handleBump(order.id)}
                onItemStatusChange={(itemId, status) =>
                  handleItemStatusChange(order.id, itemId, status)
                }
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-secondary text-sm">
              Không có đơn hàng
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
