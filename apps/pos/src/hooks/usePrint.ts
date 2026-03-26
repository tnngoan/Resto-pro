/**
 * usePrint — React hook for thermal receipt printing.
 *
 * Provides:
 *   - printReceipt()      → print customer receipt
 *   - printKitchenTicket() → print kitchen ticket
 *   - testPrint()          → test printer connection
 *   - openCashDrawer()     → kick cash drawer open
 *   - isPrinting           → loading state
 *   - lastError            → last error message (auto-clears after 5s)
 *   - printerConnected     → whether printer is detected
 *
 * Usage:
 *   const { printReceipt, isPrinting, lastError } = usePrint();
 *   await printReceipt(order, restaurant);
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  printer,
  type PrintResult,
  type PrinterConfig,
  type ReceiptOrder,
  type RestaurantInfo,
  type KitchenTicketOrder,
} from '../lib/printer/printer';

// ─── Hook Options ───────────────────────────────────────────────────

interface UsePrintOptions {
  /** Printer configuration (defaults to USB) */
  config?: PrinterConfig;
  /** Auto-clear error after N milliseconds (default: 5000, 0 = never) */
  errorTimeout?: number;
  /** Check printer status on mount (default: true) */
  checkOnMount?: boolean;
}

// ─── Hook Return ────────────────────────────────────────────────────

interface UsePrintReturn {
  /** Print a customer receipt */
  printReceipt: (order: ReceiptOrder, restaurant: RestaurantInfo) => Promise<PrintResult>;
  /** Print a kitchen ticket */
  printKitchenTicket: (order: KitchenTicketOrder) => Promise<PrintResult>;
  /** Run a test print */
  testPrint: () => Promise<PrintResult>;
  /** Open the cash drawer */
  openCashDrawer: () => Promise<PrintResult>;
  /** Whether a print job is in progress */
  isPrinting: boolean;
  /** Last error message (null if no error) */
  lastError: string | null;
  /** Clear the current error */
  clearError: () => void;
  /** Whether the printer is detected/connected */
  printerConnected: boolean | null;
  /** Re-check printer connection status */
  refreshPrinterStatus: () => Promise<void>;
}

// ─── Hook Implementation ────────────────────────────────────────────

export function usePrint(options: UsePrintOptions = {}): UsePrintReturn {
  const {
    config,
    errorTimeout = 5000,
    checkOnMount = true,
  } = options;

  const [isPrinting, setIsPrinting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [printerConnected, setPrinterConnected] = useState<boolean | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-clear error after timeout ────────────────────────────

  const setErrorWithTimeout = useCallback(
    (error: string | null) => {
      // Clear any existing timer
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }

      setLastError(error);

      if (error && errorTimeout > 0) {
        errorTimerRef.current = setTimeout(() => {
          setLastError(null);
          errorTimerRef.current = null;
        }, errorTimeout);
      }
    },
    [errorTimeout],
  );

  const clearError = useCallback(() => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setLastError(null);
  }, []);

  // ── Cleanup timer on unmount ──────────────────────────────────

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  // ── Check printer status on mount ─────────────────────────────

  const refreshPrinterStatus = useCallback(async () => {
    const result = await printer.checkStatus(config?.type);
    setPrinterConnected(result.connected);
  }, [config?.type]);

  useEffect(() => {
    if (checkOnMount) {
      refreshPrinterStatus();
    }
  }, [checkOnMount, refreshPrinterStatus]);

  // ── Generic print wrapper ─────────────────────────────────────

  const executePrint = useCallback(
    async (printFn: () => Promise<PrintResult>): Promise<PrintResult> => {
      if (isPrinting) {
        return { success: false, error: 'Đang in, vui lòng đợi...' };
      }

      setIsPrinting(true);
      clearError();

      try {
        const result = await printFn();

        if (!result.success) {
          setErrorWithTimeout(result.error ?? 'Lỗi in không xác định');
        }

        return result;
      } catch (err: any) {
        const errorMsg = `Lỗi in: ${err.message}`;
        setErrorWithTimeout(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsPrinting(false);
      }
    },
    [isPrinting, clearError, setErrorWithTimeout],
  );

  // ── Public API ────────────────────────────────────────────────

  const printReceipt = useCallback(
    (order: ReceiptOrder, restaurant: RestaurantInfo) =>
      executePrint(() => printer.printReceipt(order, restaurant, config)),
    [executePrint, config],
  );

  const printKitchenTicket = useCallback(
    (order: KitchenTicketOrder) =>
      executePrint(() => printer.printKitchenTicket(order, config)),
    [executePrint, config],
  );

  const testPrint = useCallback(
    () => executePrint(() => printer.testPrint(config)),
    [executePrint, config],
  );

  const openCashDrawer = useCallback(
    () => executePrint(() => printer.openCashDrawer(config)),
    [executePrint, config],
  );

  return {
    printReceipt,
    printKitchenTicket,
    testPrint,
    openCashDrawer,
    isPrinting,
    lastError,
    clearError,
    printerConnected,
    refreshPrinterStatus,
  };
}
