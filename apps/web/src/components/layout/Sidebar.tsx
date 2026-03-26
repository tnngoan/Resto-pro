import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  UtensilsCrossed,
  Table2,
  Package,
  DollarSign,
  Book,
  Users,
  Briefcase,
  BarChart3,
  Settings,
} from 'lucide-react';

type NavItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
  vietnamese?: string;
};

const navItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/', vietnamese: 'Tổng quan' },
  { icon: <ShoppingCart size={20} />, label: 'Orders', href: '/orders', vietnamese: 'Đơn hàng' },
  { icon: <ChefHat size={20} />, label: 'Kitchen', href: '/kitchen', vietnamese: 'Bếp' },
  { icon: <UtensilsCrossed size={20} />, label: 'Menu', href: '/menu', vietnamese: 'Thực đơn' },
  { icon: <Table2 size={20} />, label: 'Tables', href: '/tables', vietnamese: 'Bàn' },
  { icon: <Package size={20} />, label: 'Inventory', href: '/inventory', vietnamese: 'Kho' },
  { icon: <DollarSign size={20} />, label: 'Finance', href: '/finance', vietnamese: 'Tài chính' },
  { icon: <Book size={20} />, label: 'Accounting', href: '/accounting', vietnamese: 'Kế toán' },
  { icon: <Users size={20} />, label: 'Customers', href: '/customers', vietnamese: 'Khách hàng' },
  { icon: <Briefcase size={20} />, label: 'Staff', href: '/staff', vietnamese: 'Nhân viên' },
  { icon: <BarChart3 size={20} />, label: 'Reports', href: '/reports', vietnamese: 'Báo cáo' },
  { icon: <Settings size={20} />, label: 'Settings', href: '/settings', vietnamese: 'Cài đặt' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-surface-base border-r border-surface-light h-screen flex flex-col">
      {/* Logo/Branding */}
      <div className="p-6 border-b border-surface-light">
        <h1 className="text-2xl text-gold font-heading font-bold tracking-wider">
          RestoPro
        </h1>
        <p className="text-text-secondary text-sm mt-1">The Red Chair</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-button
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-surface-light text-gold border-l-4 border-gold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                  }
                `}
              >
                {item.icon}
                <span className="flex-1 text-sm font-medium">{item.vietnamese || item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-light p-4 text-xs text-text-tertiary">
        <p>© 2026 RestoPro</p>
        <p className="mt-1">v0.1.0</p>
      </div>
    </aside>
  );
}
