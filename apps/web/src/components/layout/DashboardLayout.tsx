import { Outlet } from 'react-router-dom';
import { User } from 'lucide-react';
import Sidebar from './Sidebar';
import AlertBell from '@/features/alerts/components/AlertBell';

// TODO: In production, get this from auth context / user session
const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || 'demo-restaurant';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-surface-dark">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-surface-base border-b border-surface-light px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading text-text-primary">The Red Chair</h2>
            <p className="text-xs text-text-secondary mt-1">Italian Cuisine — Ho Chi Minh City</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Notifications — real-time WebSocket alerts */}
            <AlertBell restaurantId={RESTAURANT_ID} />

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-surface-light">
              <div className="text-right">
                <p className="text-sm font-medium text-text-primary">Đặng Thị Liên</p>
                <p className="text-xs text-text-secondary">Chủ</p>
              </div>
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                <User size={18} className="text-surface-base" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
