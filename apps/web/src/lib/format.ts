/**
 * Format a number as Vietnamese Dong currency
 * Example: 150000 -> "150.000₫"
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with Vietnamese thousands separator (period)
 * Example: 150000 -> "150.000"
 */
export function formatNumber(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

/**
 * Format date as Vietnamese format (DD/MM/YYYY)
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format relative time in Vietnamese
 * Examples: "5 phút trước", "1 giờ trước", "Hôm qua 18:30"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Vừa xong';
  }

  if (diffMins < 60) {
    return `${diffMins} phút trước`;
  }

  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  if (diffDays === 1) {
    return `Hôm qua ${formatTime(d)}`;
  }

  if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  }

  return formatDate(d);
}

/**
 * Format full datetime with date and time
 */
export function formatDateTime(date: string | Date): string {
  return `${formatTime(date)} · ${formatDate(date)}`;
}

/**
 * Format Vietnamese weekday name
 */
export function getWeekdayName(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return weekdays[d.getDay()];
}

/**
 * Format full date with weekday
 */
export function formatFullDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${getWeekdayName(d)}, ${formatDate(d)}`;
}
