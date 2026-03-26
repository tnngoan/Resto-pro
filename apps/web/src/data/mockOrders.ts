export type OrderStatus = 'DRAFT' | 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'COMPLETED' | 'CANCELLED';
export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
export type Station = 'grill' | 'drinks' | 'pastry' | 'kitchen' | 'salad';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO' | 'ZALOPAY';

export interface OrderItem {
  id: string;
  name: string;
  nameIt: string;
  quantity: number;
  unitPrice: number; // VND integer
  totalPrice: number; // VND integer
  status: OrderItemStatus;
  station: Station;
  modifications: string[];
}

export interface Order {
  id: string;
  orderNumber: number;
  tableId: string;
  tableName: string;
  status: OrderStatus;
  subtotal: number; // VND integer
  vatAmount: number; // VND integer
  total: number; // VND integer
  paymentMethod?: PaymentMethod;
  serverName: string;
  covers: number;
  isRush: boolean;
  isVip: boolean;
  createdAt: Date;
  notes: string;
  items: OrderItem[];
}

const menuItems = [
  { name: 'Pizza Margherita', nameIt: 'Pizza Margherita', price: 189000, station: 'kitchen' as Station },
  { name: 'Spaghetti Bolognese', nameIt: 'Spaghetti alla Bolognese', price: 165000, station: 'kitchen' as Station },
  { name: 'Caesar Salad', nameIt: 'Caesar Salad', price: 129000, station: 'salad' as Station },
  { name: 'Risotto ai Funghi', nameIt: 'Risotto ai Funghi', price: 195000, station: 'kitchen' as Station },
  { name: 'Tiramisu', nameIt: 'Tiramisu', price: 89000, station: 'pastry' as Station },
  { name: 'Espresso', nameIt: 'Espresso', price: 45000, station: 'drinks' as Station },
  { name: 'Caprese', nameIt: 'Insalata Caprese', price: 135000, station: 'salad' as Station },
  { name: 'Osso Buco', nameIt: 'Osso Buco alla Milanese', price: 285000, station: 'grill' as Station },
  { name: 'Panna Cotta', nameIt: 'Panna Cotta', price: 85000, station: 'pastry' as Station },
  { name: 'Burrata', nameIt: 'Burrata e Pomodori', price: 145000, station: 'salad' as Station },
  { name: 'Vang Đỏ Italy', nameIt: 'Chianti Classico', price: 280000, station: 'drinks' as Station },
  { name: 'Cơm Risotto', nameIt: 'Risotto Milanese', price: 175000, station: 'kitchen' as Station },
];

const modifications = [
  'Không hành',
  'Thêm phô mai',
  'Ít cay',
  'Không rau mùi',
  'Thêm thịt',
  'Không dầu',
  'Well done',
  'Rare',
];

const serverNames = ['Nguyễn Thị Mai', 'Trần Văn An', 'Lê Thị Hương', 'Phạm Minh Quân', 'Vũ Thị Linh'];
const tableNames = ['Bàn 1', 'Bàn 2', 'Bàn 3', 'Bàn 4', 'Bàn 5', 'Bàn 6', 'Bàn 7', 'Bàn 8'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], min: number = 1, max: number = 3): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(randomItem(arr));
  }
  return result;
}

function generateOrderItems(count: number = 3): OrderItem[] {
  const items: OrderItem[] = [];
  for (let i = 0; i < count; i++) {
    const menuItem = randomItem(menuItems);
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = menuItem.price;
    const mods = randomItems(modifications, 0, 2);

    items.push({
      id: `item-${i}`,
      name: menuItem.name,
      nameIt: menuItem.nameIt,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      status: Math.random() > 0.7 ? 'READY' : Math.random() > 0.5 ? 'PREPARING' : 'PENDING',
      station: menuItem.station,
      modifications: mods,
    });
  }
  return items;
}

function generateMockOrder(orderNumber: number, status?: OrderStatus): Order {
  const items = generateOrderItems(Math.floor(Math.random() * 3) + 2);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const vatAmount = Math.floor(subtotal * 0.08);
  const total = subtotal + vatAmount;

  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.floor(Math.random() * 180) * 60000); // Last 3 hours

  const statuses: OrderStatus[] = ['DRAFT', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'PAID', 'COMPLETED', 'CANCELLED'];
  const orderStatus = status || randomItem(statuses);

  return {
    id: `order-${orderNumber}`,
    orderNumber,
    tableId: `table-${Math.floor(Math.random() * 8) + 1}`,
    tableName: randomItem(tableNames),
    status: orderStatus,
    subtotal,
    vatAmount,
    total,
    paymentMethod: ['PAID', 'COMPLETED'].includes(orderStatus) ? randomItem(['CASH', 'VNPAY', 'MOMO', 'ZALOPAY'] as PaymentMethod[]) : undefined,
    serverName: randomItem(serverNames),
    covers: Math.floor(Math.random() * 6) + 1,
    isRush: Math.random() > 0.85,
    isVip: Math.random() > 0.9,
    createdAt,
    notes: Math.random() > 0.7 ? 'Khách yêu cầu không hành' : '',
    items,
  };
}

// Generate mock orders with distribution across statuses
export const mockOrders: Order[] = [
  // Draft (2)
  generateMockOrder(1, 'DRAFT'),
  generateMockOrder(2, 'DRAFT'),

  // Placed (3)
  generateMockOrder(3, 'PLACED'),
  generateMockOrder(4, 'PLACED'),
  generateMockOrder(5, 'PLACED'),

  // Confirmed (4)
  generateMockOrder(6, 'CONFIRMED'),
  generateMockOrder(7, 'CONFIRMED'),
  generateMockOrder(8, 'CONFIRMED'),
  generateMockOrder(9, 'CONFIRMED'),

  // Preparing (6)
  generateMockOrder(10, 'PREPARING'),
  generateMockOrder(11, 'PREPARING'),
  generateMockOrder(12, 'PREPARING'),
  generateMockOrder(13, 'PREPARING'),
  generateMockOrder(14, 'PREPARING'),
  generateMockOrder(15, 'PREPARING'),

  // Ready (5)
  generateMockOrder(16, 'READY'),
  generateMockOrder(17, 'READY'),
  generateMockOrder(18, 'READY'),
  generateMockOrder(19, 'READY'),
  generateMockOrder(20, 'READY'),

  // Served (4)
  generateMockOrder(21, 'SERVED'),
  generateMockOrder(22, 'SERVED'),
  generateMockOrder(23, 'SERVED'),
  generateMockOrder(24, 'SERVED'),

  // Paid (8)
  generateMockOrder(25, 'PAID'),
  generateMockOrder(26, 'PAID'),
  generateMockOrder(27, 'PAID'),
  generateMockOrder(28, 'PAID'),
  generateMockOrder(29, 'PAID'),
  generateMockOrder(30, 'PAID'),
  generateMockOrder(31, 'PAID'),
  generateMockOrder(32, 'PAID'),

  // Completed (4)
  generateMockOrder(33, 'COMPLETED'),
  generateMockOrder(34, 'COMPLETED'),
  generateMockOrder(35, 'COMPLETED'),
  generateMockOrder(36, 'COMPLETED'),

  // Cancelled (2)
  generateMockOrder(37, 'CANCELLED'),
  generateMockOrder(38, 'CANCELLED'),
];
