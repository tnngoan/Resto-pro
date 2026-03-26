import { OrderStatus, OrderItemStatus } from '../types/order';
import { KitchenStation } from '../types/menu';

export const VAT_RATE = 0.08; // 8%
export const CURRENCY = 'VND';
export const TIMEZONE = 'Asia/Ho_Chi_Minh';
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

// Valid order status transitions
export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.PLACED, OrderStatus.CANCELLED],
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.SERVED],
  [OrderStatus.SERVED]: [OrderStatus.PAID],
  [OrderStatus.PAID]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

// Valid order item status transitions
export const ORDER_ITEM_STATUS_FLOW: Record<OrderItemStatus, OrderItemStatus[]> = {
  [OrderItemStatus.PENDING]: [OrderItemStatus.PREPARING, OrderItemStatus.CANCELLED],
  [OrderItemStatus.PREPARING]: [OrderItemStatus.READY, OrderItemStatus.CANCELLED],
  [OrderItemStatus.READY]: [OrderItemStatus.SERVED],
  [OrderItemStatus.SERVED]: [],
  [OrderItemStatus.CANCELLED]: [],
};

// Kitchen stations in order
export const KITCHEN_STATIONS: KitchenStation[] = [
  KitchenStation.HOT_KITCHEN,
  KitchenStation.COLD_KITCHEN,
  KitchenStation.BAR,
  KitchenStation.DESSERT,
  KitchenStation.GRILL,
];

// Kitchen station display names (Vietnamese)
export const KITCHEN_STATION_LABELS: Record<KitchenStation, string> = {
  [KitchenStation.HOT_KITCHEN]: 'Bếp nóng',
  [KitchenStation.COLD_KITCHEN]: 'Bếp lạnh',
  [KitchenStation.BAR]: 'Bar',
  [KitchenStation.DESSERT]: 'Món tráng miệng',
  [KitchenStation.GRILL]: 'Nướng',
};
