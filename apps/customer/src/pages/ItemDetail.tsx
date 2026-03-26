import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '@/store/cart';
import QuantitySelector from '@/components/QuantitySelector';
import PriceDisplay from '@/components/PriceDisplay';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  spicy?: number;
  allergens?: string[];
}

// Mock data - TODO: Replace with real API call
const menuItems: Record<string, MenuItem> = {
  '1': {
    id: '1',
    name: 'Bruschetta Al Pomodoro',
    description: 'Bánh nướng với cà chua tươi, tỏi và húng quế tươi. Dầu olive ngon lành.',
    price: 150000,
    category: 'khai-vi',
    spicy: 0,
    allergens: ['Gluten', 'Tối'],
  },
  '2': {
    id: '2',
    name: 'Calamari Fritti',
    description: 'Mực tươi rán giòn với nước chanh tươi. Phục vụ kèm sos marinara nóng.',
    price: 180000,
    category: 'khai-vi',
    spicy: 1,
    allergens: ['Hải sản', 'Gluten'],
  },
  '3': {
    id: '3',
    name: 'Margherita',
    description: 'Pizza cổ điển Italia với mozzarella tươi, cà chua san marzano và húng quế. Nướng lò đốt gỗ.',
    price: 250000,
    category: 'pizza',
    spicy: 0,
    allergens: ['Gluten', 'Sữa'],
  },
  '4': {
    id: '4',
    name: 'Quattro Formaggi',
    description: 'Pizza bốn loại pho mát: gorgonzola, pecorino, mozzarella, và fontina. Sos trắng thơm béo.',
    price: 280000,
    category: 'pizza',
    spicy: 0,
    allergens: ['Gluten', 'Sữa'],
  },
  '5': {
    id: '5',
    name: 'Carbonara',
    description: 'Pasta La Mã cổ điển với guanciale, trứng, pecorino romano. Không có kem, chỉ trứng và phô mai.',
    price: 240000,
    category: 'pasta',
    spicy: 0,
    allergens: ['Gluten', 'Sữa', 'Trứng'],
  },
};

export default function ItemDetail() {
  const { tableSlug = 'table-1', itemId = '1' } = useParams<{
    tableSlug: string;
    itemId: string;
  }>();
  const navigate = useNavigate();
  const cartStore = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const item = menuItems[itemId];

  if (!item) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Không tìm thấy món ăn</p>
          <button
            onClick={() => navigate(`/menu/${tableSlug}`)}
            className="text-gold font-medium hover:text-gold-light transition-colors"
          >
            Quay lại thực đơn
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = item.price * quantity;

  const handleAddToCart = () => {
    cartStore.addItem({
      menuItemId: item.id,
      name: item.name,
      nameIt: item.name,
      price: item.price,
      category: item.category,
      quantity,
      notes: notes || undefined,
    });
    navigate(`/menu/${tableSlug}`);
  };

  return (
    <div className="min-h-screen bg-surface-base pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-dark border-b border-surface-light flex items-center justify-between px-6 py-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(`/menu/${tableSlug}`)}
          className="text-gold hover:text-gold-light transition-colors"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <h1 className="text-lg font-heading text-text-primary flex-1 text-center">Chi tiết món ăn</h1>
        <div className="w-6" /> {/* Spacer for centering */}
      </div>

      {/* Image Placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-64 bg-gradient-to-br from-crimson to-crimson-dark flex items-center justify-center overflow-hidden relative"
      >
        {/* Gradient placeholder with initial letter */}
        <div className="absolute inset-0 bg-gradient-to-br from-crimson to-burgundy flex items-center justify-center">
          <span className="text-8xl font-heading text-gold opacity-20">
            {item.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-8">
        {/* Name and Price */}
        <div className="mb-6">
          <h2 className="text-3xl font-heading text-text-primary mb-2">{item.name}</h2>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-heading text-gold">
              <PriceDisplay priceVND={item.price} variant="full" />
            </span>
            {item.spicy ? (
              <div className="flex gap-0.5">
                {[...Array(item.spicy)].map((_, i) => (
                  <span key={i} className="text-xl">
                    🌶️
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p className="text-text-secondary leading-relaxed">{item.description}</p>
        </div>

        {/* Allergens */}
        {item.allergens && item.allergens.length > 0 && (
          <div className="mb-8 p-4 bg-surface-dark rounded-card border border-surface-light">
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Các chất gây dị ứng</p>
            <div className="flex flex-wrap gap-2">
              {item.allergens.map((allergen) => (
                <span key={allergen} className="text-xs bg-surface-light px-2 py-1 rounded-full text-text-primary">
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Special Notes */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-text-primary mb-3">
            Ghi chú đặc biệt (tùy chọn)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: không cay, không hành, v.v..."
            className="w-full bg-surface-dark border border-surface-light rounded-card px-4 py-3 text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            rows={3}
          />
        </div>

        {/* Quantity */}
        <div className="mb-8">
          <p className="text-sm font-medium text-text-primary mb-3">Số lượng</p>
          <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} size="lg" />
        </div>
      </motion.div>

      {/* Fixed Bottom Action */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-surface-base border-t border-surface-light px-6 py-4 safe-pb-safe"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-text-secondary mb-1">Tổng cộng</p>
            <p className="text-2xl font-heading text-gold">
              <PriceDisplay priceVND={totalPrice} variant="full" />
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className="bg-gold text-surface-base px-8 py-3 rounded-button font-semibold hover:bg-gold-light transition-colors flex-1 max-w-xs"
          >
            Thêm vào đơn
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
