/**
 * Format VND price with thousand separator and ₫ symbol
 * Example: formatPrice(189000) => "189.000₫"
 */
export function formatPrice(priceVND: number): string {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(priceVND).replace('₫', '₫').trim();
}

/**
 * Format price in thousands shorthand
 * Example: formatPriceShort(189000) => "189k₫"
 */
export function formatPriceShort(priceVND: number): string {
  const thousands = Math.round(priceVND / 1000);
  return `${thousands.toLocaleString('vi-VN')}k₫`;
}

/**
 * Convert date to Vietnamese locale string
 * Example: formatDate(new Date()) => "25/03/2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return formatter.format(d);
}

/**
 * Convert time to Vietnamese locale string
 * Example: formatTime(new Date()) => "14:30"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(d);
}

/**
 * Convert datetime to Vietnamese locale string
 * Example: formatDateTime(new Date()) => "25/03/2026 14:30"
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}
