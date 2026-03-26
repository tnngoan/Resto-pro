import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '@/store/cart';
import QuantitySelector from '@/components/QuantitySelector';
import PriceDisplay from '@/components/PriceDisplay';
import { formatPrice } from '@/lib/format';

export default function Cart() {
  const { tableSlug = 'table-1' } = useParams<{ tableSlug: string }>();
  const navigate = useNavigate();
  const cartStore = useCartStore();
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = cartStore.getSubtotal();
  const vat = cartStore.getVAT(subtotal);
  const total = cartStore.getTotal();

  if (cartStore.items.length === 0) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-2xl font-heading text-text-primary mb-2">Giỏ hàng trống</h2>
          <p className="text-text-secondary mb-6">Chọn các món để bắt đầu đặt hàng</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/menu/${tableSlug}`)}
            className="bg-gold text-surface-base px-8 py-3 rounded-button font-semibold hover:bg-gold-light transition-colors"
          >
            Quay lại thực đơn
          </motion.button>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    try {
      // TODO: Call API to place order
      // const response = await restoproAPI.placeOrder({
      //   tableSlug,
      //   items: cartStore.items.map(item => ({
      //     menuItemId: item.menuItemId,
      //     quantity: item.quantity,
      //     notes: item.notes,
      //   })),
      //   specialRequests,
      // });
      // For now, mock the order response
      const mockOrderId = `ORD-${Date.now()}`;
      cartStore.clearCart();
      navigate(`/menu/${tableSlug}/order/${mockOrderId}`);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Có lỗi khi gửi đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
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
        <h1 className="text-lg font-heading text-text-primary flex-1 text-center">Đơn hàng của bạn</h1>
        <div className="w-6" /> {/* Spacer for centering */}
      </div>

      {/* Cart Items */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-8">
        <div className="space-y-4 mb-8">
          {cartStore.items.map((item) => (
            <motion.div
              key={item.menuItemId}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-surface-dark border border-surface-light rounded-card p-4"
            >
              {/* Item Header */}
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-heading text-text-primary mb-1">{item.name}</h3>
                  <p className="text-xs text-text-secondary">
                    <PriceDisplay priceVND={item.price} variant="short" /> / cái
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => cartStore.removeItem(item.menuItemId)}
                  className="text-error hover:text-crimson-light transition-colors"
                  aria-label="Xóa"
                >
                  <Trash2 size={18} />
                </motion.button>
              </div>

              {/* Notes */}
              {item.notes && (
                <p className="text-xs text-text-secondary italic mb-3 px-3 py-2 bg-surface-light rounded-button">
                  "{item.notes}"
                </p>
              )}

              {/* Quantity and Price */}
              <div className="flex justify-between items-center">
                <QuantitySelector
                  quantity={item.quantity}
                  onQuantityChange={(qty) => cartStore.updateQuantity(item.menuItemId, qty)}
                  size="sm"
                />
                <div className="text-right">
                  <p className="text-xs text-text-secondary mb-1">Thành tiền</p>
                  <p className="text-lg font-heading text-gold">
                    <PriceDisplay priceVND={item.price * item.quantity} variant="short" />
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Special Requests */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-text-primary mb-3">
            Ghi chú cho nhà hàng (tùy chọn)
          </label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Ví dụ: không đá, ít cay, phục vụ riêng biệt, v.v..."
            className="w-full bg-surface-light border border-surface-light rounded-card px-4 py-3 text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            rows={3}
          />
        </div>

        {/* Price Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface-dark border border-surface-light rounded-card p-6 space-y-3 mb-8"
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Tạm tính</span>
            <span className="text-text-primary font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">VAT (8%)</span>
            <span className="text-text-primary font-medium">{formatPrice(vat)}</span>
          </div>
          <div className="border-t border-surface-light pt-3" />
          <div className="flex justify-between items-center">
            <span className="text-text-primary font-semibold">Tổng cộng</span>
            <span className="text-2xl font-heading text-gold">{formatPrice(total)}</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-surface-base border-t border-surface-light px-6 py-4 safe-pb-safe"
      >
        <div className="max-w-4xl mx-auto space-y-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handlePlaceOrder}
            disabled={isLoading}
            className="w-full bg-gold text-surface-base px-6 py-3 rounded-button font-semibold hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang gửi...' : 'Gửi đơn hàng'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/menu/${tableSlug}`)}
            className="w-full bg-surface-light text-text-primary px-6 py-3 rounded-button font-semibold hover:bg-surface-medium transition-colors"
          >
            Quay lại thực đơn
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
