import React, { forwardRef } from 'react';
import { Badge } from './Badge';
import { OrderStatus, OrderItemStatus } from '@restopro/shared';
import { TableStatus } from '@restopro/shared';

type StatusValue = OrderStatus | OrderItemStatus | TableStatus | string;

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusValue;
  type?: 'order' | 'item' | 'table';
}

const orderStatusMap: Record<OrderStatus, { label: string; variant: string }> = {
  [OrderStatus.DRAFT]: { label: 'Nháp', variant: 'muted' },
  [OrderStatus.PLACED]: { label: 'Đặt hàng', variant: 'blue' },
  [OrderStatus.CONFIRMED]: { label: 'Đã xác nhận', variant: 'blue' },
  [OrderStatus.PREPARING]: { label: 'Đang chuẩn bị', variant: 'gold' },
  [OrderStatus.READY]: { label: 'Sẵn sàng', variant: 'crimson' },
  [OrderStatus.SERVED]: { label: 'Đã phục vụ', variant: 'green' },
  [OrderStatus.PAID]: { label: 'Đã thanh toán', variant: 'green' },
  [OrderStatus.COMPLETED]: { label: 'Hoàn thành', variant: 'green' },
  [OrderStatus.CANCELLED]: { label: 'Hủy bỏ', variant: 'muted' },
};

const itemStatusMap: Record<OrderItemStatus, { label: string; variant: string }> = {
  [OrderItemStatus.PENDING]: { label: 'Chờ xử lý', variant: 'muted' },
  [OrderItemStatus.PREPARING]: { label: 'Đang chuẩn bị', variant: 'gold' },
  [OrderItemStatus.READY]: { label: 'Sẵn sàng', variant: 'crimson' },
  [OrderItemStatus.SERVED]: { label: 'Đã phục vụ', variant: 'green' },
  [OrderItemStatus.CANCELLED]: { label: 'Hủy bỏ', variant: 'muted' },
};

const tableStatusMap: Record<TableStatus, { label: string; variant: string }> = {
  [TableStatus.AVAILABLE]: { label: 'Trống', variant: 'green' },
  [TableStatus.OCCUPIED]: { label: 'Có khách', variant: 'crimson' },
  [TableStatus.RESERVED]: { label: 'Đặt trước', variant: 'gold' },
  [TableStatus.NEEDS_ATTENTION]: { label: 'Cần chú ý', variant: 'red' },
  [TableStatus.CLEANING]: { label: 'Đang dọn', variant: 'muted' },
};

export const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, type = 'order', className = '', ...props }, ref) => {
    let statusData: { label: string; variant: string };

    if (type === 'order' && status in orderStatusMap) {
      statusData = orderStatusMap[status as OrderStatus];
    } else if (type === 'item' && status in itemStatusMap) {
      statusData = itemStatusMap[status as OrderItemStatus];
    } else if (type === 'table' && status in tableStatusMap) {
      statusData = tableStatusMap[status as TableStatus];
    } else {
      statusData = { label: status as string, variant: 'muted' };
    }

    return (
      <div ref={ref} className={className} {...props}>
        <Badge variant={statusData.variant as any}>
          {statusData.label}
        </Badge>
      </div>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
