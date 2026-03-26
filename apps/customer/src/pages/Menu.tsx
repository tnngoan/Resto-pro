import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useCartStore from '@/store/cart';
import CategoryTabs from '@/components/CategoryTabs';
import MenuItemCard from '@/components/MenuItemCard';
import CartBar from '@/components/CartBar';
import { formatPriceShort } from '@/lib/format';
import { useMenu86d } from '@/hooks/useMenu86d';

// TODO: In production, get restaurantId from URL or context
const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || 'demo-restaurant';

type Category = 'khai-vi' | 'pizza' | 'pasta' | 'thit-ca' | 'trang-mieng' | 'do-uong' | 'ruou-vang';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image?: string;
  spicy?: number;
}

const categories: { id: Category; vietnamese: string }[] = [
  { id: 'khai-vi', vietnamese: 'Khai vị' },
  { id: 'pizza', vietnamese: 'Pizza' },
  { id: 'pasta', vietnamese: 'Pasta' },
  { id: 'thit-ca', vietnamese: 'Thịt & Cá' },
  { id: 'trang-mieng', vietnamese: 'Tráng miệng' },
  { id: 'do-uong', vietnamese: 'Đồ uống' },
  { id: 'ruou-vang', vietnamese: 'Rượu vang' },
];

const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Bruschetta Al Pomodoro',
    description: 'Bánh nướng với cà chua, tỏi và húng quế tươi',
    price: 150000,
    category: 'khai-vi',
    spicy: 0,
  },
  {
    id: '2',
    name: 'Calamari Fritti',
    description: 'Mực tươi rán giòn với nước chanh',
    price: 180000,
    category: 'khai-vi',
    spicy: 1,
  },
  {
    id: '3',
    name: 'Margherita',
    description: 'Pizza cổ điển với mozzarella, cà chua và húng quế',
    price: 250000,
    category: 'pizza',
    spicy: 0,
  },
  {
    id: '4',
    name: 'Quattro Formaggi',
    description: 'Pizza bốn loại pho mát với sos trắng',
    price: 280000,
    category: 'pizza',
    spicy: 0,
  },
  {
    id: '5',
    name: 'Carbonara',
    description: 'Pasta La Mã cổ điển với guanciale và pecorino',
    price: 240000,
    category: 'pasta',
    spicy: 0,
  },
  {
    id: '6',
    name: 'Bolognese',
    description: 'Pasta với sos thịt bò truyền thống từ Bologna',
    price: 220000,
    category: 'pasta',
    spicy: 1,
  },
  {
    id: '7',
    name: 'Osso Buco',
    description: 'Cốt lơn nướng kho với risotto',
    price: 450000,
    category: 'thit-ca',
    spicy: 0,
  },
  {
    id: '8',
    name: 'Branzino Al Forno',
    description: 'Cá rô không quai nướng lò với chanh và dill',
    price: 390000,
    category: 'thit-ca',
    spicy: 0,
  },
  {
    id: '9',
    name: 'Panna Cotta',
    description: 'Kem kem Italia với sos quả mọng',
    price: 120000,
    category: 'trang-mieng',
    spicy: 0,
  },
  {
    id: '10',
    name: 'Tiramisu',
    description: 'Bánh tráng miệng cổ điển với cacao',
    price: 130000,
    category: 'trang-mieng',
    spicy: 0,
  },
  {
    id: '11',
    name: 'Espresso',
    description: 'Cà phê đặc Italia',
    price: 60000,
    category: 'do-uong',
    spicy: 0,
  },
  {
    id: '12',
    name: 'Cappuccino',
    description: 'Cà phê với sữa nóng và bọt',
    price: 75000,
    category: 'do-uong',
    spicy: 0,
  },
];

export default function Menu() {
  const { tableSlug = 'table-1' } = useParams<{ tableSlug: string }>();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>('pizza');

  // Real-time 86'd items via WebSocket
  const { items86d } = useMenu86d(RESTAURANT_ID, tableSlug);

  const cartStore = useCartStore();
  const cartTotal = cartStore.getSubtotal();
  const cartCount = cartStore.getItemCount();

  // Initialize table slug on mount
  if (cartStore.tableSlug !== tableSlug && tableSlug) {
    cartStore.setTableSlug(tableSlug);
  }

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  const handleAddToCart = (item: MenuItem) => {
    cartStore.addItem({
      menuItemId: item.id,
      name: item.name,
      nameIt: item.name,
      price: item.price,
      category: item.category,
    });
  };

  const handleItemTap = (itemId: string) => {
    navigate(`/menu/${tableSlug}/item/${itemId}`);
  };

  return (
    <div className="min-h-screen bg-surface-base pb-32">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-b from-crimson to-crimson-dark px-6 py-12 text-center"
      >
        <h1 className="text-5xl font-heading text-gold tracking-wider mb-2">the RED CHAIR</h1>
        <p className="text-gold text-lg font-light mb-4">Italian Cuisine</p>
        <p className="text-text-secondary text-sm">
          Bàn {tableSlug?.split('-').pop()} · Chào mừng quý khách
        </p>
      </motion.div>

      {/* Welcome Message */}
      <div className="px-6 py-6 bg-surface-dark border-b border-surface-light">
        <p className="text-text-secondary text-sm text-center">
          Chọn các món ưa thích của bạn và chúng tôi sẽ phục vụ ngay
        </p>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Menu Items Grid */}
      <div className="px-6 py-8">
        <motion.div layout className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => {
            const is86d = items86d.has(item.id);
            return (
              <MenuItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                description={item.description}
                price={item.price}
                spicy={item.spicy}
                is86d={is86d}
                onTap={is86d ? undefined : handleItemTap}
                onAddToCart={is86d ? undefined : () => handleAddToCart(item)}
              />
            );
          })}
        </motion.div>
      </div>

      {/* Cart Bar */}
      <CartBar itemCount={cartCount} totalPrice={cartTotal} tableSlug={tableSlug || 'table-1'} />
    </div>
  );
}
