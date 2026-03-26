/**
 * Kitchen Ticket Template — 80mm thermal printer.
 *
 * Designed for maximum readability from across the kitchen:
 *   • LARGE table number (2x size, bold)
 *   • Timestamp and staff name
 *   • Items in large text with quantities prominent
 *   • Notes highlighted with "!!" prefix
 *   • Modifiers listed with "+" prefix
 */
import { formatTimeVN } from '@restopro/shared';
import { ESCPOSBuilder, LINE_WIDTH } from '../escpos';

// ─── Types ──────────────────────────────────────────────────────────

export interface KitchenTicketOrder {
  id: string;
  tableName: string;
  staffName: string;
  placedAt: string; // ISO date string — when order was sent to kitchen
  items: KitchenTicketItem[];
}

export interface KitchenTicketItem {
  name: string;
  quantity: number;
  note?: string;
  modifiers?: string[];
}

// ─── Builder ────────────────────────────────────────────────────────

/**
 * Build a kitchen ticket as an ESC/POS byte buffer.
 *
 * Kitchen tickets are optimized for visibility:
 *   - Table name is 2x size so it's readable from across the room
 *   - Each item quantity is shown prominently
 *   - Notes use "!!" prefix to draw attention
 *
 * @param order — order data with items and notes
 * @returns Buffer ready to send to the kitchen printer
 */
export function buildKitchenTicket(order: KitchenTicketOrder): Buffer {
  const p = new ESCPOSBuilder().init();

  // ── Header: BIG table number ───────────────────────────────────
  p.align('center');
  p.bold().size(2, 2);
  p.text(`BÀN ${order.tableName}`);
  p.size(1, 1);
  p.text(`${formatTimeVN(order.placedAt)} — ${order.staffName}`);
  p.bold(false);
  p.line('=');

  // ── Items — large text, quantities prominent ───────────────────
  for (const item of order.items) {
    p.align('left');
    p.size(1, 2).bold();
    p.text(`${item.quantity}x ${item.name}`);
    p.size(1, 1).bold(false);

    // Notes: highlighted with "!!" so kitchen doesn't miss special requests
    if (item.note) {
      p.text(`  !! ${item.note}`);
    }

    // Modifiers: listed with "+" prefix
    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        p.text(`  + ${mod}`);
      }
    }
  }

  // ── Footer ─────────────────────────────────────────────────────
  p.line('=');
  p.align('center');
  p.text(`Đơn #${order.id.slice(0, 6).toUpperCase()}`);
  p.newline(3);
  p.cut();

  return p.build();
}

/**
 * Convenience: build kitchen ticket and return as a number array for IPC.
 */
export function buildKitchenTicketArray(order: KitchenTicketOrder): number[] {
  return Array.from(buildKitchenTicket(order));
}

/**
 * Build a plain-text representation for on-screen preview.
 */
export function buildKitchenTicketPreviewText(order: KitchenTicketOrder): string {
  const lines: string[] = [];
  const center = (s: string) => {
    const pad = Math.max(0, Math.floor((LINE_WIDTH - s.length) / 2));
    return ' '.repeat(pad) + s;
  };

  lines.push(center(`BÀN ${order.tableName}`));
  lines.push(center(`${formatTimeVN(order.placedAt)} — ${order.staffName}`));
  lines.push('='.repeat(LINE_WIDTH));

  for (const item of order.items) {
    lines.push(`${item.quantity}x ${item.name}`);
    if (item.note) lines.push(`  !! ${item.note}`);
    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        lines.push(`  + ${mod}`);
      }
    }
  }

  lines.push('='.repeat(LINE_WIDTH));
  lines.push(center(`Đơn #${order.id.slice(0, 6).toUpperCase()}`));

  return lines.join('\n');
}
