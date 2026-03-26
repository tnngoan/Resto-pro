import { Order } from '../../data/mockOrders';
import { X, Printer, Trash2, CheckCircle2, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatVND, formatDateTime, formatFullDate } from '../../lib/format';

interface OrderDetailDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string) => void;
}

export default function OrderDetailDrawer({ order, isOpen, onClose, onAction }: OrderDetailDrawerProps) {
  if (!order) return null;

  const getActionButtons = () => {
    switch (order.status) {
      case 'DRAFT':
      case 'PLACED':
        return (
          <>
            <button
              onClick={() => onAction?.('confirm')}
              className="w-full bg-gold text-surface-base font-medium py-2.5 rounded-button hover:bg-gold-dark transition-colors"
            >
              Xác nhận
            </button>
            <button
              onClick={() => onAction?.('cancel')}
              className="w-full border border-error text-error font-medium py-2.5 rounded-button hover:bg-error/5 transition-colors"
            >
              Hủy đơn
            </button>
          </>
        );
      case 'CONFIRMED':
      case 'PREPARING':
        return (
          <button
            onClick={() => onAction?.('print-kitchen')}
            className="w-full bg-crimson text-surface-base font-medium py-2.5 rounded-button hover:bg-crimson-light transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            In bếp
          </button>
        );
      case 'READY':
        return (
          <button
            onClick={() => onAction?.('mark-served')}
            className="w-full bg-success text-surface-base font-medium py-2.5 rounded-button hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} />
            Đánh dấu đã phục vụ
          </button>
        );
      case 'SERVED':
        return (
          <button
            onClick={() => onAction?.('payment')}
            className="w-full bg-gold text-surface-base font-medium py-2.5 rounded-button hover:bg-gold-dark transition-colors"
          >
            Thanh toán
          </button>
        );
      case 'PAID':
        return (
          <button
            onClick={() => onAction?.('print-receipt')}
            className="w-full border border-gold text-gold font-medium py-2.5 rounded-button hover:bg-gold/5 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            In hóa đơn
          </button>
        );
      case 'COMPLETED':
        return (
          <button
            disabled
            className="w-full bg-surface-light text-text-tertiary font-medium py-2.5 rounded-button cursor-not-allowed"
          >
            Đã hoàn tất
          </button>
        );
      case 'CANCELLED':
        return (
          <button
            disabled
            className="w-full bg-surface-light text-text-tertiary font-medium py-2.5 rounded-button cursor-not-allowed"
          >
            Đã hủy
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-surface-base border-l border-surface-light shadow-2xl transform transition-transform duration-300 z-50 overflow-y-auto flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-base border-b border-surface-light px-6 py-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-heading text-text-primary">
                Đơn hàng #{String(order.orderNumber).padStart(3, '0')}
              </h2>
              {order.isVip && (
                <span className="text-xs font-medium text-gold bg-gold/10 px-2 py-1 rounded-button">
                  VIP
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary">{order.tableName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-4 space-y-4">
          {/* Status Badge */}
          <div>
            <StatusBadge status={order.status} size="lg" />
          </div>

          {/* Order Info */}
          <div className="space-y-3 bg-surface-dark rounded-card p-4 border border-surface-light">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wider">Nhân viên</p>
                <p className="text-sm text-text-primary font-medium">{order.serverName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-secondary uppercase tracking-wider">Khách</p>
                <p className="text-sm text-text-primary font-medium">{order.covers} khách</p>
              </div>
            </div>
            <div className="border-t border-surface-light pt-3">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Đặt lúc</p>
              <p className="text-sm text-text-primary font-medium">{formatDateTime(order.createdAt)}</p>
            </div>
            {order.notes && (
              <div className="border-t border-surface-light pt-3">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Ghi chú</p>
                <p className="text-sm text-text-primary italic">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-heading text-text-primary mb-3">Các món</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="border border-surface-light rounded-card p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 bg-gold/20 text-gold text-xs font-bold rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                        <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      </div>
                      <p className="text-xs text-text-secondary italic ml-8">{item.nameIt}</p>
                    </div>
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  {item.modifications.length > 0 && (
                    <div className="ml-8">
                      <p className="text-xs text-gold italic">
                        {item.modifications.join(', ')}
                      </p>
                    </div>
                  )}

                  <div className="text-right text-xs text-text-secondary mt-2">
                    {formatVND(item.unitPrice)} × {item.quantity} = <span className="text-text-primary font-medium">{formatVND(item.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-surface-dark rounded-card p-4 border border-surface-light space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Tạm tính</span>
              <span className="text-text-primary font-medium">{formatVND(order.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">VAT (8%)</span>
              <span className="text-text-primary font-medium">{formatVND(order.vatAmount)}</span>
            </div>
            <div className="border-t border-surface-light pt-2">
              <div className="flex justify-between items-center">
                <span className="text-text-primary font-heading">Tổng cộng</span>
                <span className="text-lg text-gold font-heading">{formatVND(order.total)}</span>
              </div>
            </div>
            {order.paymentMethod && (
              <div className="text-xs text-text-secondary pt-2 border-t border-surface-light">
                Thanh toán: <span className="text-text-primary">{order.paymentMethod}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-surface-base border-t border-surface-light px-6 py-4 space-y-2">
          {getActionButtons()}
        </div>
      </div>
    </>
  );
}
