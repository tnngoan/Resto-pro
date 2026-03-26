/**
 * Printer Module — Barrel Export
 *
 * Usage from components:
 *   import { printer, usePrint } from '@/lib/printer';
 *   import { buildReceiptPreviewText } from '@/lib/printer';
 */

// Main printer interface
export { printer } from './printer';
export type {
  PrintResult,
  PrinterInfo,
  PrinterType,
  PrinterConfig,
  ReceiptOrder,
  RestaurantInfo,
  KitchenTicketOrder,
  KitchenTicketItem,
} from './printer';

// ESC/POS builder (for advanced usage / test prints)
export { ESCPOSBuilder, padColumns, rightAlign, LINE_WIDTH } from './escpos';

// Templates — preview text builders (for PrintPreview component)
export { buildReceipt, buildReceiptArray, buildReceiptPreviewText } from './templates/receipt';
export type { ReceiptOrderItem } from './templates/receipt';
export { buildKitchenTicket, buildKitchenTicketArray, buildKitchenTicketPreviewText } from './templates/kitchen-ticket';
export type { KitchenTicketItem as KitchenTicketItemType } from './templates/kitchen-ticket';
