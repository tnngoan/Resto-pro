import { TableStatus } from '@restopro/shared';

interface TableStatusBadgeProps {
  status: TableStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  TableStatus,
  { label: string; dotColor: string; textColor: string; bgColor: string }
> = {
  [TableStatus.AVAILABLE]: {
    label: 'Trống',
    dotColor: 'bg-green-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  [TableStatus.OCCUPIED]: {
    label: 'Có khách',
    dotColor: 'bg-red-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  [TableStatus.RESERVED]: {
    label: 'Đặt trước',
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  [TableStatus.CLEANING]: {
    label: 'Đang dọn',
    dotColor: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  [TableStatus.NEEDS_ATTENTION]: {
    label: 'Cần chú ý',
    dotColor: 'bg-orange-500',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
};

export default function TableStatusBadge({
  status,
  size = 'sm',
}: TableStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${config.textColor} ${config.bgColor}
        ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
      `}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
