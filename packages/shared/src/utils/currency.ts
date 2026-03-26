export function formatVND(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new Error('Currency amounts must be integers (in smallest unit)');
  }

  const formatted = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${formatted}₫`;
}

export function parseVND(formatted: string): number {
  // Remove currency symbol, dots (thousands separator), and whitespace
  const cleaned = formatted.replace(/[₫\s.]/g, '').replace(/,/g, '');
  const parsed = parseInt(cleaned, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid VND format: ${formatted}`);
  }

  return parsed;
}

export function calculateVAT(
  subtotal: number,
  vatRate: number = 0.08
): { vatAmount: number; total: number } {
  if (!Number.isInteger(subtotal)) {
    throw new Error('Subtotal must be an integer (in smallest unit)');
  }

  // Calculate VAT and round to nearest integer
  const vatAmount = Math.round(subtotal * vatRate);
  const total = subtotal + vatAmount;

  return { vatAmount, total };
}

export function calculateSubtotal(
  total: number,
  vatRate: number = 0.08
): { subtotal: number; vatAmount: number } {
  if (!Number.isInteger(total)) {
    throw new Error('Total must be an integer (in smallest unit)');
  }

  // Work backwards from total: subtotal * (1 + vatRate) = total
  const subtotal = Math.round(total / (1 + vatRate));
  const vatAmount = total - subtotal;

  return { subtotal, vatAmount };
}
