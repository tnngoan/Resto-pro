type OrderStatus =
  | 'DRAFT'
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELLED';
type ItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';

type Status = OrderStatus | ItemStatus;

interface StatusBadgeProps {
  status: Status;
  variant?: 'order' | 'item';
  size?: 'sm' | 'md';
}

const statusConfig: Record<Status, { label: string; color: string; bgColor: string }> = {
  // Order statuses
  DRAFT: { label: 'Nháp', color: 'text-text-secondary', bgColor: 'bg-surface-light' },
  PLACED: { label: 'Đã gửi', color: 'text-warning', bgColor: 'bg-amber-900' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-blue-300', bgColor: 'bg-blue-900' },
  PREPARING: { label: 'Đang nấu', color: 'text-warning', bgColor: 'bg-amber-900' },
  READY: { label: 'Sẵn sàng', color: 'text-success', bgColor: 'bg-green-900' },
  SERVED: { label: 'Đã phục vụ', color: 'text-success', bgColor: 'bg-green-900' },
  PAID: { label: 'Đã thanh toán', color: 'text-success', bgColor: 'bg-green-900' },
  COMPLETED: { label: 'Hoàn tất', color: 'text-success', bgColor: 'bg-green-900' },
  CANCELLED: { label: 'Đã hủy', color: 'text-error', bgColor: 'bg-red-900' },
  // Item statuses
  PENDING: { label: 'Chờ xử lý', color: 'text-text-secondary', bgColor: 'bg-surface-light' },
};

export default function StatusBadge({
  status,
  variant = 'order',
  size = 'md',
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div className={`${config.bgColor} ${config.color} rounded-full ${sizeClasses} font-medium inline-block`}>
      {config.label}
    </div>
  );
}
