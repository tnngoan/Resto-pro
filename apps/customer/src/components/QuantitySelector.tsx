import { Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function QuantitySelector({
  quantity,
  onQuantityChange,
  size = 'md',
}: QuantitySelectorProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  return (
    <div className="flex items-center gap-2 bg-surface-dark rounded-button p-1">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
        className={`text-text-secondary hover:text-gold transition-colors ${sizeClasses[size]}`}
        aria-label="Giảm số lượng"
      >
        <Minus size={iconSize[size]} />
      </motion.button>

      <div className={`w-8 text-center font-semibold text-text-primary ${sizeClasses[size]}`}>
        {quantity}
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onQuantityChange(quantity + 1)}
        className={`text-text-secondary hover:text-gold transition-colors ${sizeClasses[size]}`}
        aria-label="Tăng số lượng"
      >
        <Plus size={iconSize[size]} />
      </motion.button>
    </div>
  );
}
