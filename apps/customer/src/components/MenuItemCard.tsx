import { motion } from 'framer-motion';
import PriceDisplay from './PriceDisplay';

interface MenuItemCardProps {
  id: string;
  name: string; // Italian name
  description: string;
  price: number; // VND
  spicy?: number;
  is86d?: boolean; // Out of stock
  onTap?: (id: string) => void;
  onAddToCart?: () => void;
}

export default function MenuItemCard({
  id,
  name,
  description,
  price,
  spicy,
  is86d = false,
  onTap,
  onAddToCart,
}: MenuItemCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        bg-surface-dark border border-surface-light rounded-card p-4
        transition-colors relative
        ${is86d
          ? 'opacity-50 cursor-default'
          : 'hover:border-gold cursor-pointer'
        }
      `}
      onClick={() => !is86d && onTap?.(id)}
    >
      {/* 86'd overlay badge */}
      {is86d && (
        <div className="absolute top-3 right-3 px-3 py-1 bg-red-600 rounded-full">
          <span className="text-xs font-bold text-white">Hết hàng</span>
        </div>
      )}

      {/* Item Header */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <h3 className={`text-base font-heading mb-1 ${is86d ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
            {name}
          </h3>
          <p className="text-xs text-text-secondary line-clamp-2">{description}</p>
        </div>
        {spicy && !is86d ? (
          <div className="flex gap-0.5">
            {[...Array(spicy)].map((_, i) => (
              <span key={i} className="text-lg">
                🌶️
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Price and Add Button */}
      <div className="flex justify-between items-center">
        <PriceDisplay priceVND={price} variant="short" />
        {is86d ? (
          <span className="text-xs text-red-400 font-medium">
            Tạm hết
          </span>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
            className="bg-gold text-surface-base px-4 py-2 rounded-button text-sm font-medium hover:bg-gold-light transition-colors"
          >
            Thêm
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
