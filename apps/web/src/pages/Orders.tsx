import { useState, useMemo } from 'react';
import { Search, Plus, Eye, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { mockOrders, Order, OrderStatus } from '../data/mockOrders';
import StatusBadge from '../components/orders/StatusBadge';
import OrderDetailDrawer from '../components/orders/OrderDetailDrawer';
import { formatVND, formatRelativeTime, formatFullDate, getWeekdayName } from '../lib/format';

type FilterStatus = OrderStatus | 'ALL';

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 20;

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
      const matchesSearch =
        searchQuery === '' ||
        String(order.orderNumber).includes(searchQuery) ||
        order.tableName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // KPI Stats
  const stats = {
    pending: mockOrders.filter((o) => ['PLACED', 'CONFIRMED'].includes(o.status)).length,
    cooking: mockOrders.filter((o) => o.status === 'PREPARING').length,
    ready: mockOrders.filter((o) => o.status === 'READY').length,
    paid: mockOrders.filter((o) => o.status === 'PAID').length,
  };

  const statusFilters: { label: string; value: FilterStatus }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Chờ xác nhận', value: 'PLACED' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Đang nấu', value: 'PREPARING' },
    { label: 'Sẵn sàng', value: 'READY' },
    { label: 'Đã phục vụ', value: 'SERVED' },
    { label: 'Đã thanh toán', value: 'PAID' },
    { label: 'Hoàn tất', value: 'COMPLETED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
  ];

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  const handleOrderAction = (action: string) => {
    console.log(`Action: ${action} on order ${selectedOrder?.orderNumber}`);
    // Handle action based on string
  };

  const now = new Date();
  const dateDisplay = formatFullDate(now);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-heading text-text-primary mb-2">Đơn hàng</h1>
          <p className="text-text-secondary">
            {dateDisplay} · {mockOrders.length} đơn hàng
          </p>
        </div>
        <button className="bg-crimson hover:bg-crimson-light text-surface-base font-medium px-6 py-2.5 rounded-button transition-colors flex items-center gap-2">
          <Plus size={18} />
          Tạo đơn mới
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Pending */}
        <div className="bg-surface-dark border border-surface-light rounded-card p-4 hover:border-gold/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm font-medium">Chờ xác nhận</span>
            <span className="w-2 h-2 bg-gold rounded-full"></span>
          </div>
          <p className="text-3xl font-heading text-text-primary">{stats.pending}</p>
        </div>

        {/* Cooking */}
        <div className="bg-surface-dark border border-surface-light rounded-card p-4 hover:border-crimson/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm font-medium">Đang nấu</span>
            <span className="w-2 h-2 bg-crimson rounded-full"></span>
          </div>
          <p className="text-3xl font-heading text-text-primary">{stats.cooking}</p>
        </div>

        {/* Ready */}
        <div className="bg-surface-dark border border-surface-light rounded-card p-4 hover:border-success/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm font-medium">Sẵn sàng</span>
            <span className="w-2 h-2 bg-success rounded-full"></span>
          </div>
          <p className="text-3xl font-heading text-text-primary">{stats.ready}</p>
        </div>

        {/* Paid */}
        <div className="bg-surface-dark border border-surface-light rounded-card p-4 hover:border-success/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm font-medium">Đã thanh toán</span>
            <span className="w-2 h-2 bg-success rounded-full"></span>
          </div>
          <p className="text-3xl font-heading text-text-primary">{stats.paid}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Tìm kiếm mã đơn hoặc bàn..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-dark border border-surface-light rounded-button text-text-primary placeholder-text-tertiary focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <button
              key={status.value}
              onClick={() => {
                setFilterStatus(status.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-button text-sm font-medium transition-colors ${
                filterStatus === status.value
                  ? 'bg-gold text-surface-base'
                  : 'bg-surface-dark border border-surface-light text-text-secondary hover:border-gold hover:text-gold'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-dark border border-surface-light rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-surface-light bg-surface-medium">
                <th className="px-6 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider">Bàn</th>
                <th className="px-6 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider">Món</th>
                <th className="px-6 py-3 text-right text-xs font-heading text-text-secondary uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-3 text-center text-xs font-heading text-text-secondary uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedOrders.map((order, idx) => {
                const itemsSummary =
                  order.items.length > 2
                    ? `${order.items[0].name}, ${order.items[1].name} và ${order.items.length - 2} món khác`
                    : order.items.map((i) => i.name).join(', ');

                return (
                  <tr
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    className={`border-b border-surface-light transition-colors cursor-pointer ${
                      idx % 2 === 0 ? 'bg-surface-dark' : 'bg-surface-medium/50'
                    } hover:bg-surface-light/20 hover:border-l-4 hover:border-l-gold`}
                  >
                    {/* Order Number */}
                    <td className="px-6 py-4 text-sm font-mono text-gold">#{String(order.orderNumber).padStart(3, '0')}</td>

                    {/* Table */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-text-primary">{order.tableName}</p>
                        {order.isVip && (
                          <span className="text-xs font-medium text-gold bg-gold/10 px-2 py-1 rounded-button">
                            VIP
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">{itemsSummary}</td>

                    {/* Total Amount */}
                    <td className="px-6 py-4 text-sm text-right font-medium text-text-primary">{formatVND(order.total)}</td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>

                    {/* Time */}
                    <td className="px-6 py-4 text-sm text-text-secondary">{formatRelativeTime(order.createdAt)}</td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 hover:bg-surface-light rounded-button transition-colors text-text-secondary hover:text-gold"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        {['CONFIRMED', 'PREPARING'].includes(order.status) && (
                          <button
                            className="p-2 hover:bg-surface-light rounded-button transition-colors text-text-secondary hover:text-gold"
                            title="In cho bếp"
                          >
                            <Printer size={18} />
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button
                            className="p-2 hover:bg-surface-light rounded-button transition-colors text-success hover:bg-success/10"
                            title="Đánh dấu đã phục vụ"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-surface-light flex items-center justify-between bg-surface-medium/50">
          <p className="text-sm text-text-secondary">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredOrders.length)} / {filteredOrders.length} đơn hàng
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-surface-dark border border-surface-light rounded-button text-sm text-text-secondary hover:border-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <span className="text-sm text-text-secondary">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-surface-dark border border-surface-light rounded-button text-sm text-text-secondary hover:border-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onAction={handleOrderAction}
      />
    </div>
  );
}
