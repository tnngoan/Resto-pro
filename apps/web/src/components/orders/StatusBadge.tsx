import { OrderStatus, OrderItemStatus } from '../../data/mockOrders';
import { CheckCircle2, Clock, Flame, AlertCircle, Utensils } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus | OrderItemStatus;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'pill';
  showIcon?: boolean;
}

const statusConfig: Record<OrderStatus | OrderItemStatus, { label: string; bgColor: string; textColor: string; borderColor: string; icon: React.ReactNode }> = {
  DRAFT: {
    label: 'Nháp',
    bgColor: 'bg-surface-dark',
    textColor: 'text-text-secondary',
    borderColor: 'border-surface-light',
    icon: <Clock size={14} />,
  },
  PLACED: {
    label: 'Chờ xác nhận',
    bgColor: 'bg-gold/10',
    textColor: 'text-gold',
    borderColor: 'border-gold/30',
    icon: <AlertCircle size={14} />,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    bgColor: 'bg-gold/10',
    textColor: 'text-gold',
    borderColor: 'border-gold/30',
    icon: <CheckCircle2 size={14} />,
  },
  PENDING: {
    label: 'Chờ xử lý',
    bgColor: 'bg-surface-dark',
    textColor: 'text-text-secondary',
    borderColor: 'border-surface-light',
    icon: <Clock size={14} />,
  },
  PREPARING: {
    label: 'Đang nấu',
    bgColor: 'bg-crimson/10',
    textColor: 'text-crimson',
    borderColor: 'border-crimson/30',
    icon: <Flame size={14} />,
  },
  READY: {
    label: 'Sẵn sàng',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
    borderColor: 'border-success/30',
    icon: <CheckCircle2 size={14} />,
  },
  SERVED: {
    label: 'Đã phục vụ',
    bgColor: 'bg-surface-light/40',
    textColor: 'text-text-secondary',
    borderColor: 'border-surface-light/60',
    icon: <Utensils size={14} />,
  },
  PAID: {
    label: 'Đã thanh toán',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
    borderColor: 'border-success/30',
    icon: <CheckCircle2 size={14} />,
  },
  COMPLETED: {
    label: 'Hoàn tất',
    bgColor: 'bg-surface-light/30',
    textColor: 'text-text-tertiary',
    borderColor: 'border-surface-light/50',
    icon: <CheckCircle2 size={14} />,
  },
  CANCELLED: {
    label: 'Đã hủy',
    bgColor: 'bg-error/10',
    textColor: 'text-error',
    borderColor: 'border-error/30',
    icon: <AlertCircle size={14} />,
  },
};

export default function StatusBadge({ status, size = 'md', variant = 'badge', showIcon = false }: StatusBadgeProps) {
  const config = statusConfig[status];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const baseClasses = variant === 'badge'
    ? `${config.bgColor} ${config.textColor} border ${config.borderColor} rounded-button font-medium flex items-center gap-2 inline-flex whitespace-nowrap`
    : `${config.textColor} font-medium inline-flex items-center gap-2 whitespace-nowrap`;

  return (
    <span className={`${baseClasses} ${sizeClasses[size]}`}>
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}
