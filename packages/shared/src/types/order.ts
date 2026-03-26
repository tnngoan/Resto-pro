export enum OrderStatus {
  DRAFT = 'DRAFT',
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  nameIt?: string;
  quantity: number;
  unitPrice: number; // VND integer
  totalPrice: number; // VND integer
  status: OrderItemStatus;
  modifications?: string[];
  notes?: string;
}

export interface Order {
  id: string;
  tableId: string;
  tableName: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number; // VND integer
  vatAmount: number; // VND integer
  total: number; // VND integer
  paymentMethod?: PaymentMethod;
  notes?: string;
  serverId?: string;
  serverName?: string;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentMethod {
  CASH = 'CASH',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}
