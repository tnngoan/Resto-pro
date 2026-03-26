import { Routes, Route } from 'react-router-dom';
import Menu from './pages/Menu';
import ItemDetail from './pages/ItemDetail';
import Cart from './pages/Cart';
import OrderTracking from './pages/OrderTracking';

export default function App() {
  return (
    <Routes>
      <Route path="/menu/:tableSlug" element={<Menu />} />
      <Route path="/menu/:tableSlug/item/:itemId" element={<ItemDetail />} />
      <Route path="/menu/:tableSlug/cart" element={<Cart />} />
      <Route path="/menu/:tableSlug/order/:orderId" element={<OrderTracking />} />
      {/* Default redirect */}
      <Route path="/" element={<Menu />} />
    </Routes>
  );
}
