import { formatPrice, formatPriceShort } from '@/lib/format';

interface PriceDisplayProps {
  priceVND: number;
  variant?: 'full' | 'short';
  className?: string;
}

export default function PriceDisplay({
  priceVND,
  variant = 'short',
  className = '',
}: PriceDisplayProps) {
  const price = variant === 'short' ? formatPriceShort(priceVND) : formatPrice(priceVND);

  return <span className={`text-gold font-heading ${className}`}>{price}</span>;
}
