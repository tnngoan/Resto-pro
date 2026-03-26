import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';

interface KPICard {
  title: string;
  vietnamese: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

const kpis: KPICard[] = [
  {
    title: 'Today Revenue',
    vietnamese: 'Doanh thu hôm nay',
    value: '12.500.000₫',
    change: '+8% so với hôm qua',
    icon: <DollarSign size={24} />,
    trend: 'up',
  },
  {
    title: 'Covers',
    vietnamese: 'Số bàn phục vụ',
    value: '48',
    change: '+12% so với hôm qua',
    icon: <Users size={24} />,
    trend: 'up',
  },
  {
    title: 'Total Orders',
    vietnamese: 'Tổng đơn hàng',
    value: '52',
    change: '+5% so với hôm qua',
    icon: <ShoppingCart size={24} />,
    trend: 'up',
  },
  {
    title: 'Avg. Order Value',
    vietnamese: 'Giá trị đơn bình quân',
    value: '240.000₫',
    change: '+3% so với hôm qua',
    icon: <TrendingUp size={24} />,
    trend: 'up',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-heading text-text-primary mb-2">Tổng quan</h1>
        <p className="text-text-secondary">Chào mừng quay lại, Liên. Đây là toàn cảnh kinh doanh của bạn hôm nay.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.vietnamese}
            className="bg-surface-base border border-surface-light rounded-card p-6 hover:border-gold transition-colors duration-200"
          >
            {/* Icon */}
            <div className="w-12 h-12 bg-surface-light rounded-card flex items-center justify-center text-gold mb-4">
              {kpi.icon}
            </div>

            {/* Content */}
            <h3 className="text-sm font-medium text-text-secondary mb-1">{kpi.vietnamese}</h3>
            <p className="text-2xl font-heading text-text-primary mb-3">{kpi.value}</p>

            {/* Change Badge */}
            <div
              className={`text-xs font-medium flex items-center gap-1 ${
                kpi.trend === 'up' ? 'text-success' : 'text-error'
              }`}
            >
              <span>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for charts and tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-surface-base border border-surface-light rounded-card p-6">
          <h2 className="text-lg font-heading text-text-primary mb-4">Doanh thu 7 ngày gần đây</h2>
          <div className="h-64 flex items-center justify-center text-text-tertiary border-t border-surface-light pt-4">
            <p>Biểu đồ doanh thu sẽ hiển thị ở đây</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-surface-base border border-surface-light rounded-card p-6">
          <h2 className="text-lg font-heading text-text-primary mb-4">Đơn hàng gần đây</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 bg-surface-dark rounded-button border border-surface-light hover:border-gold transition-colors"
              >
                <p className="text-sm font-medium text-text-primary">Bàn {i}</p>
                <p className="text-xs text-text-secondary mt-1">750.000₫</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
