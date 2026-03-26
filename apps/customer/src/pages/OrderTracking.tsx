import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBadge from '@/components/StatusBadge';
import PriceDisplay from '@/components/PriceDisplay';
import { formatDateTime, formatPrice } from '@/lib/format';

type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED';
type ItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  status: ItemStatus;
}

interface Order {
  id: string;
  tableSlug: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  createdAt: string;
}

const statusSteps: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'];

const statusLabels: Record<OrderStatus, string> = {
  PLACED: 'Đã gửi',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang nấu',
  READY: 'Sẵn sàng',
  SERVED: 'Đã phục vụ',
};

export default function OrderTracking() {
  const { tableSlug = 'table-1', orderId = 'ORD-1' } = useParams<{
    tableSlug: string;
    orderId: string;
  }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock order data - TODO: Replace with real API call with WebSocket polling
  useEffect(() => {
    const mockOrder: Order = {
      id: orderId,
      tableSlug,
      orderNumber: `#${Date.now().toString().slice(-6)}`,
      status: 'PREPARING',
      items: [
        { menuItemId: '3', name: 'Margherita', quantity: 2, price: 250000, status: 'READY' },
        { menuItemId: '5', name: 'Carbonara', quantity: 1, price: 240000, status: 'PREPARING' },
        { menuItemId: '11', name: 'Espresso', quantity: 2, price: 60000, status: 'PENDING' },
      ],
      subtotal: 860000,
      vat: 68800,
      total: 928800,
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setOrder(mockOrder);
      setIsLoading(false);
    }, 500);

    // TODO: Set up WebSocket connection to listen for order updates
    // const unsubscribe = api.subscribeToOrder(orderId, (updatedOrder) => {
    //   setOrder(updatedOrder);
    // });
    // return unsubscribe;
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-surface-light border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Đang tải đơn hàng...</p>
        </motion.div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-2xl font-heading text-text-primary mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-text-secondary mb-6">Vui lòng kiểm tra mã đơn hàng của bạn</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/menu/${tableSlug}`)}
            className="bg-gold text-surface-base px-8 py-3 rounded-button font-semibold hover:bg-gold-light transition-colors"
          >
            Quay lại thực đơn
          </motion.button>
        </div>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-surface-base pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-dark border-b border-surface-light flex items-center justify-between px-6 py-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(`/menu/${tableSlug}`)}
          className="text-gold hover:text-gold-light transition-colors"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <h1 className="text-lg font-heading text-text-primary flex-1 text-center">Trạng thái đơn hàng</h1>
        <div className="w-6" /> {/* Spacer for centering */}
      </div>

      {/* Order Number and Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-8">
        <div className="bg-surface-dark border border-surface-light rounded-card p-6 mb-8 text-center">
          <p className="text-text-secondary text-sm mb-2">Mã đơn hàng</p>
          <h2 className="text-3xl font-heading text-gold mb-4">{order.orderNumber}</h2>
          <div className="flex justify-center">
            <StatusBadge status={order.status} variant="order" size="md" />
          </div>
          <p className="text-xs text-text-secondary mt-4">{formatDateTime(order.createdAt)}</p>
        </div>

        {/* Status Timeline */}
        <div className="bg-surface-dark border border-surface-light rounded-card p-6 mb-8">
          <p className="text-sm font-semibold text-text-primary mb-6">Tiến trình</p>
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isCompleted = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const isPending = index > currentStatusIndex;

              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div
                    className={`
                      flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold
                      transition-all duration-300
                      ${
                        isCompleted
                          ? 'bg-success text-white'
                          : isCurrent
                            ? 'bg-gold text-surface-base'
                            : 'bg-surface-light text-text-secondary'
                      }
                    `}
                  >
                    {isCompleted ? <Check size={20} /> : <span>{index + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`
                        font-medium
                        ${
                          isCompleted || isCurrent ? 'text-text-primary' : 'text-text-secondary'
                        }
                      `}
                    >
                      {statusLabels[step]}
                    </p>
                  </div>
                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-gold"
                    >
                      <Clock size={20} />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-text-primary mb-4">Chi tiết đơn hàng</p>
          <div className="space-y-3">
            {order.items.map((item) => (
              <motion.div
                key={item.menuItemId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-dark border border-surface-light rounded-card p-4 flex justify-between items-center"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-text-primary mb-1">{item.name}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary">x{item.quantity}</span>
                    <StatusBadge status={item.status} variant="item" size="sm" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-heading text-gold">
                    <PriceDisplay priceVND={item.price * item.quantity} variant="short" />
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Price Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface-dark border border-surface-light rounded-card p-6 space-y-3"
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Tạm tính</span>
            <span className="text-text-primary font-medium">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">VAT (8%)</span>
            <span className="text-text-primary font-medium">{formatPrice(order.vat)}</span>
          </div>
          <div className="border-t border-surface-light pt-3" />
          <div className="flex justify-between items-center">
            <span className="text-text-primary font-semibold">Tổng cộng</span>
            <span className="text-2xl font-heading text-gold">{formatPrice(order.total)}</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Helper Text */}
      {order.status !== 'SERVED' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 mt-8 p-4 bg-surface-dark border border-surface-light rounded-card text-center"
        >
          <p className="text-text-secondary text-sm">
            Chúng tôi sẽ thông báo khi các món ăn của bạn sẵn sàng.
            <br />
            Vui lòng chờ 5-10 phút.
          </p>
        </motion.div>
      )}

      {/* Action Button */}
      {order.status === 'SERVED' && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-surface-base border-t border-surface-light px-6 py-4 safe-pb-safe"
        >
          <div className="max-w-4xl mx-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/menu/${tableSlug}`)}
              className="w-full bg-gold text-surface-base px-6 py-3 rounded-button font-semibold hover:bg-gold-light transition-colors"
            >
              Đặt thêm
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
