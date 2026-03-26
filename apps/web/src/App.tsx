import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import MenuManagement from './pages/MenuManagement';
import TableManagement from './pages/TableManagement';

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/tables" element={<TableManagement />} />
      </Route>
    </Routes>
  );
}
