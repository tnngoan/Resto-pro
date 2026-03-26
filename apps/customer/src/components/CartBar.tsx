import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PriceDisplay from './PriceDisplay';

interface CartBarProps {
  itemCount: number;
  totalPrice: number;
  tableSlug: string;
}

export default function CartBar({ itemCount, totalPrice, tableSlug }: CartBarProps) {
  const navigate = useNavigate();

  if (itemCount === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-surface-base border-t border-surface-light px-6 py-4 text-center text-text-secondary text-sm safe-pb-safe">
        Chọn các món để bắt đầu
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-surface-base border-t-2 border-gold px-6 py-4 safe-pb-safe"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-text-secondary mb-1">Tạm tính</p>
          <p className="text-2xl font-heading text-gold">
            <PriceDisplay priceVND={totalPrice} variant="short" />
          </p>
          <p className="text-xs text-text-secondary mt-1">{itemCount} món</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/menu/${tableSlug}/cart`)}
          className="bg-gold text-surface-base px-8 py-3 rounded-button font-semibold hover:bg-gold-light transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <ShoppingCart size={20} />
          <span>Xem đơn hàng</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
