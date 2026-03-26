/**
 * Printer Interface — Main API for printing from the renderer process.
 *
 * Provides a unified interface that:
 *   1. Builds ESC/POS data using the template functions
 *   2. Sends data to the Electron main process via IPC
 *   3. Falls back gracefully when not running in Electron
 *
 * Usage:
 *   import { printer } from '@/lib/printer/printer';
 *   await printer.printReceipt(order, restaurant);
 *   await printer.printKitchenTicket(order);
 */
import type { PaymentMethod } from '@restopro/shared';
import { buildReceiptArray, type ReceiptOrder, type RestaurantInfo } from './templates/receipt';
import { buildKitchenTicketArray, type KitchenTicketOrder } from './templates/kitchen-ticket';

// ─── Types ──────────────────────────────────────────────────────────

export interface PrintResult {
  success: boolean;
  error?: string;
}

export interface PrinterInfo {
  name: string;
  isDefault: boolean;
  status: string;
}

export type PrinterType = 'USB' | 'network';

export interface PrinterConfig {
  type: PrinterType;
  /** For network printers only */
  networkAddress?: string;
  networkPort?: number;
}

// ─── Default printer config ─────────────────────────────────────────

const DEFAULT_CONFIG: PrinterConfig = {
  type: 'USB',
};

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Check if running inside Electron (window.electronAPI is available).
 */
function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

/**
 * Send raw ESC/POS data to the printer via Electron IPC.
 */
async function sendToPrinter(data: number[], config: PrinterConfig = DEFAULT_CONFIG): Promise<PrintResult> {
  if (!isElectron()) {
    return {
      success: false,
      error: 'Printing requires the Electron desktop app. Cannot print from browser.',
    };
  }

  try {
    const result = await window.electronAPI!.print({
      data,
      printerType: config.type,
      networkAddress: config.networkAddress,
      networkPort: config.networkPort,
    });
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: `IPC communication failed: ${err.message}`,
    };
  }
}

// ─── Public API ─────────────────────────────────────────────────────

export const printer = {
  /**
   * Print a customer receipt.
   *
   * @param order      — order data formatted for receipt
   * @param restaurant — restaurant info for the header
   * @param config     — optional printer config (defaults to USB)
   */
  async printReceipt(
    order: ReceiptOrder,
    restaurant: RestaurantInfo,
    config?: PrinterConfig,
  ): Promise<PrintResult> {
    try {
      const data = buildReceiptArray(order, restaurant);
      return await sendToPrinter(data, config);
    } catch (err: any) {
      return { success: false, error: `Failed to build receipt: ${err.message}` };
    }
  },

  /**
   * Print a kitchen ticket.
   *
   * @param order  — order data formatted for kitchen ticket
   * @param config — optional printer config (defaults to USB)
   */
  async printKitchenTicket(
    order: KitchenTicketOrder,
    config?: PrinterConfig,
  ): Promise<PrintResult> {
    try {
      const data = buildKitchenTicketArray(order);
      return await sendToPrinter(data, config);
    } catch (err: any) {
      return { success: false, error: `Failed to build kitchen ticket: ${err.message}` };
    }
  },

  /**
   * List available printers.
   */
  async listPrinters(): Promise<PrinterInfo[]> {
    if (!isElectron()) return [];
    try {
      return await window.electronAPI!.listPrinters();
    } catch {
      return [];
    }
  },

  /**
   * Check if a printer is connected.
   */
  async checkStatus(printerType: PrinterType = 'USB'): Promise<{ connected: boolean; error?: string }> {
    if (!isElectron()) {
      return { connected: false, error: 'Not running in Electron' };
    }
    try {
      return await window.electronAPI!.printerStatus(printerType);
    } catch {
      return { connected: false, error: 'Failed to check printer status' };
    }
  },

  /**
   * Open the cash drawer (connected via printer's kick connector).
   */
  async openCashDrawer(config?: PrinterConfig): Promise<PrintResult> {
    // Build a minimal ESC/POS command that just opens the drawer
    const { ESCPOSBuilder } = await import('./escpos');
    const data = new ESCPOSBuilder().init().openCashDrawer().buildArray();
    return sendToPrinter(data, config);
  },

  /**
   * Test the printer connection by printing a small test receipt.
   */
  async testPrint(config?: PrinterConfig): Promise<PrintResult> {
    const { ESCPOSBuilder } = await import('./escpos');
    const p = new ESCPOSBuilder().init();
    p.align('center');
    p.bold().size(2, 2).text('RestoPro POS');
    p.size(1, 1).bold(false);
    p.newline();
    p.text('--- TEST PRINT ---');
    p.text('Máy in hoạt động bình thường');
    p.text('Printer is working correctly');
    p.newline();
    p.text(`Thời gian: ${new Date().toLocaleString('vi-VN')}`);
    p.newline(3);
    p.cut();

    return sendToPrinter(p.buildArray(), config);
  },
};

// Re-export types for convenience
export type { ReceiptOrder, RestaurantInfo } from './templates/receipt';
export type { KitchenTicketOrder, KitchenTicketItem } from './templates/kitchen-ticket';
