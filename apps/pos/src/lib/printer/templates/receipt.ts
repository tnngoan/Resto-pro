/**
 * Customer Receipt Template — 80mm thermal printer.
 *
 * Generates the ESC/POS byte array for a full customer receipt including:
 *   • Restaurant header (name, address, phone)
 *   • Order info (table, date, staff)
 *   • Itemized list with quantities and prices
 *   • Subtotal, VAT, total
 *   • Payment info and change
 *   • Thank-you footer
 */
import type { Order, PaymentMethod } from '@restopro/shared';
import { formatVND, formatDateVN, formatTimeVN } from '@restopro/shared';
import { ESCPOSBuilder, padColumns, rightAlign, LINE_WIDTH } from '../escpos';

// ─── Types ──────────────────────────────────────────────────────────

export interface RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  taxId?: string; // Mã số thuế — required on VAT invoices
}

export interface ReceiptOrder {
  id: string;
  tableName: string;
  staffName: string;
  createdAt: string; // ISO date string
  paidAt?: string; // ISO date string — when payment was recorded
  items: ReceiptOrderItem[];
  subtotal: number; // VND integer
  vatRate: number; // e.g. 8 for 8%
  vatAmount: number; // VND integer
  totalAmount: number; // VND integer
  paymentMethod: PaymentMethod;
  amountPaid?: number; // VND integer — what customer actually gave
  change?: number; // VND integer — tiền thừa
}

export interface ReceiptOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
}

// ─── Payment method labels (Vietnamese) ─────────────────────────────

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Tiền mặt',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
  CARD: 'Thẻ',
  BANK_TRANSFER: 'Chuyển khoản',
};

// ─── Column widths for item table ───────────────────────────────────
// Total = 48 chars: name(28) + qty(4) + price(16)
const COL_NAME = 28;
const COL_QTY = 4;
const COL_PRICE = 16;

// ─── Builder ────────────────────────────────────────────────────────

/**
 * Build a complete customer receipt as an ESC/POS byte buffer.
 *
 * @param order     — order data with items, totals, payment
 * @param restaurant — restaurant info for the header
 * @returns Buffer ready to send to the printer
 */
export function buildReceipt(order: ReceiptOrder, restaurant: RestaurantInfo): Buffer {
  const p = new ESCPOSBuilder().init();

  // ── Restaurant Header ───────────────────────────────────────────
  p.align('center');
  p.bold().size(2, 2).text(restaurant.name);
  p.size(1, 1).bold(false);
  p.text(restaurant.address);
  p.text(`ĐT: ${restaurant.phone}`);
  if (restaurant.taxId) {
    p.text(`MST: ${restaurant.taxId}`);
  }
  p.newline();

  // ── Order Info ──────────────────────────────────────────────────
  p.align('left');
  p.text(
    `Bàn: ${order.tableName}    Ngày: ${formatDateVN(order.createdAt)}`,
  );
  p.text(
    `NV: ${order.staffName}    Giờ: ${formatTimeVN(order.paidAt ?? order.createdAt)}`,
  );
  p.text(`Hoá đơn: #${order.id.slice(0, 8).toUpperCase()}`);
  p.line();

  // ── Item Table Header ──────────────────────────────────────────
  p.bold();
  p.text(padColumns('Tên món', 'SL', 'Thành tiền', COL_NAME, COL_QTY, COL_PRICE));
  p.bold(false);
  p.line();

  // ── Item Rows ──────────────────────────────────────────────────
  for (const item of order.items) {
    p.text(
      padColumns(
        item.name,
        `x${item.quantity}`,
        formatVND(item.totalPrice),
        COL_NAME,
        COL_QTY,
        COL_PRICE,
      ),
    );
    if (item.note) {
      p.text(`  → ${item.note}`);
    }
  }

  // ── Totals ─────────────────────────────────────────────────────
  p.line();
  p.text(rightAlign('Tạm tính:', formatVND(order.subtotal)));
  if (order.vatRate > 0) {
    p.text(rightAlign(`VAT (${order.vatRate}%):`, formatVND(order.vatAmount)));
  }
  p.bold().size(1, 2);
  p.text(rightAlign('TỔNG CỘNG:', formatVND(order.totalAmount)));
  p.size(1, 1).bold(false);

  // ── Payment ────────────────────────────────────────────────────
  p.line();
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;
  p.text(rightAlign(`Thanh toán (${paymentLabel}):`, formatVND(order.amountPaid ?? order.totalAmount)));
  if (order.change && order.change > 0) {
    p.text(rightAlign('Tiền thừa:', formatVND(order.change)));
  }

  // ── Footer ─────────────────────────────────────────────────────
  p.newline();
  p.align('center');
  p.text('Cảm ơn quý khách!');
  p.text('Hẹn gặp lại!');
  p.newline(3);
  p.cut();

  return p.build();
}

/**
 * Convenience: build receipt and return as a number array for IPC serialization.
 */
export function buildReceiptArray(order: ReceiptOrder, restaurant: RestaurantInfo): number[] {
  return Array.from(buildReceipt(order, restaurant));
}

/**
 * Build a plain-text representation of the receipt (for on-screen preview).
 * This does NOT include ESC/POS control codes — just formatted text.
 */
export function buildReceiptPreviewText(order: ReceiptOrder, restaurant: RestaurantInfo): string {
  const lines: string[] = [];
  const center = (s: string) => {
    const pad = Math.max(0, Math.floor((LINE_WIDTH - s.length) / 2));
    return ' '.repeat(pad) + s;
  };

  // Header
  lines.push(center(restaurant.name));
  lines.push(center(restaurant.address));
  lines.push(center(`ĐT: ${restaurant.phone}`));
  if (restaurant.taxId) lines.push(center(`MST: ${restaurant.taxId}`));
  lines.push('');

  // Order info
  lines.push(`Bàn: ${order.tableName}    Ngày: ${formatDateVN(order.createdAt)}`);
  lines.push(`NV: ${order.staffName}    Giờ: ${formatTimeVN(order.paidAt ?? order.createdAt)}`);
  lines.push(`Hoá đơn: #${order.id.slice(0, 8).toUpperCase()}`);
  lines.push('-'.repeat(LINE_WIDTH));

  // Table header
  lines.push(padColumns('Tên món', 'SL', 'Thành tiền', COL_NAME, COL_QTY, COL_PRICE));
  lines.push('-'.repeat(LINE_WIDTH));

  // Items
  for (const item of order.items) {
    lines.push(
      padColumns(item.name, `x${item.quantity}`, formatVND(item.totalPrice), COL_NAME, COL_QTY, COL_PRICE),
    );
    if (item.note) lines.push(`  → ${item.note}`);
  }

  // Totals
  lines.push('-'.repeat(LINE_WIDTH));
  lines.push(rightAlign('Tạm tính:', formatVND(order.subtotal)));
  if (order.vatRate > 0) {
    lines.push(rightAlign(`VAT (${order.vatRate}%):`, formatVND(order.vatAmount)));
  }
  lines.push(rightAlign('TỔNG CỘNG:', formatVND(order.totalAmount)));

  // Payment
  lines.push('-'.repeat(LINE_WIDTH));
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;
  lines.push(rightAlign(`Thanh toán (${paymentLabel}):`, formatVND(order.amountPaid ?? order.totalAmount)));
  if (order.change && order.change > 0) {
    lines.push(rightAlign('Tiền thừa:', formatVND(order.change)));
  }

  // Footer
  lines.push('');
  lines.push(center('Cảm ơn quý khách!'));
  lines.push(center('Hẹn gặp lại!'));

  return lines.join('\n');
}
