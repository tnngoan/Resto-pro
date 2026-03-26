/**
 * Electron IPC Handler — Printer Access
 *
 * This runs in the Electron MAIN process and has direct access to
 * USB/serial devices. The renderer process communicates via IPC.
 *
 * Channels:
 *   'printer:print'  — send raw ESC/POS data to a printer
 *   'printer:list'   — enumerate available printers
 *   'printer:status'  — check if a specific printer is connected
 */
import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ─── Types ──────────────────────────────────────────────────────────

export interface PrintRequest {
  /** Raw ESC/POS data as a number array (serialized from Buffer) */
  data: number[];
  /** Which printer to use — 'USB', 'network', or a specific device name */
  printerType: 'USB' | 'network' | string;
  /** For network printers: IP address and port */
  networkAddress?: string;
  networkPort?: number;
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

export interface PrinterInfo {
  name: string;
  isDefault: boolean;
  status: string;
}

// ─── USB Printing ───────────────────────────────────────────────────

/**
 * Send raw data to a USB printer via the 'escpos' package.
 * The escpos package auto-detects the first available USB printer.
 */
async function printUSB(data: Buffer): Promise<PrintResult> {
  try {
    // Dynamic import — escpos + escpos-usb are optional native deps.
    // They won't be available during dev without libusb installed.
    const escpos = await import('escpos');
    const escposUSB = await import('escpos-usb');

    // Register USB adapter
    escpos.USB = escposUSB.default || escposUSB;

    return new Promise<PrintResult>((resolve) => {
      const device = new escpos.USB();

      device.open((err: Error | null) => {
        if (err) {
          resolve({ success: false, error: `USB open failed: ${err.message}` });
          return;
        }

        try {
          // Write raw ESC/POS bytes directly (bypass escpos's own builder)
          device.write(data, (writeErr: Error | null) => {
            device.close((closeErr: Error | null) => {
              if (writeErr) {
                resolve({ success: false, error: `USB write failed: ${writeErr.message}` });
              } else if (closeErr) {
                // Data was sent but close failed — still success
                console.warn('[Printer] USB close warning:', closeErr.message);
                resolve({ success: true });
              } else {
                resolve({ success: true });
              }
            });
          });
        } catch (writeErr: any) {
          resolve({ success: false, error: `USB write exception: ${writeErr.message}` });
        }
      });
    });
  } catch (importErr: any) {
    return {
      success: false,
      error: `USB printer driver not available: ${importErr.message}. Install escpos + escpos-usb and ensure libusb is present.`,
    };
  }
}

// ─── Network Printing ───────────────────────────────────────────────

/**
 * Send raw data to a network printer over TCP/IP.
 * Most thermal printers listen on port 9100 (RAW printing protocol).
 */
async function printNetwork(data: Buffer, address: string, port = 9100): Promise<PrintResult> {
  const net = await import('net');

  return new Promise<PrintResult>((resolve) => {
    const socket = new net.Socket();
    const timeout = 5000; // 5s connection timeout

    socket.setTimeout(timeout);

    socket.connect(port, address, () => {
      socket.write(data, () => {
        socket.end();
        resolve({ success: true });
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, error: `Network printer timeout: ${address}:${port}` });
    });

    socket.on('error', (err: Error) => {
      resolve({ success: false, error: `Network printer error: ${err.message}` });
    });
  });
}

// ─── Printer Listing ────────────────────────────────────────────────

/**
 * List available printers on the system.
 * Uses platform-specific commands.
 */
async function listPrinters(): Promise<PrinterInfo[]> {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      // Windows: use wmic
      const { stdout } = await execAsync(
        'wmic printer get Name,Default,Status /format:csv',
      );
      return parseWindowsPrinterList(stdout);
    } else if (platform === 'darwin' || platform === 'linux') {
      // macOS/Linux: use lpstat
      const { stdout } = await execAsync('lpstat -p -d 2>/dev/null || true');
      return parseUnixPrinterList(stdout);
    }
  } catch (err: any) {
    console.warn('[Printer] Failed to list printers:', err.message);
  }

  return [];
}

function parseWindowsPrinterList(output: string): PrinterInfo[] {
  const lines = output.trim().split('\n').filter((l) => l.trim());
  // Skip header line
  return lines.slice(1).map((line) => {
    const parts = line.split(',');
    // CSV format: Node, Default, Name, Status
    return {
      name: parts[2]?.trim() ?? 'Unknown',
      isDefault: parts[1]?.trim().toUpperCase() === 'TRUE',
      status: parts[3]?.trim() ?? 'Unknown',
    };
  }).filter((p) => p.name !== 'Unknown');
}

function parseUnixPrinterList(output: string): PrinterInfo[] {
  const printers: PrinterInfo[] = [];
  const defaultMatch = output.match(/system default destination: (.+)/);
  const defaultPrinter = defaultMatch?.[1]?.trim() ?? '';

  const printerRegex = /printer (\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = printerRegex.exec(output)) !== null) {
    const name = match[1];
    const isIdle = output.includes(`${name} is idle`);
    printers.push({
      name,
      isDefault: name === defaultPrinter,
      status: isIdle ? 'idle' : 'unknown',
    });
  }

  return printers;
}

// ─── IPC Registration ───────────────────────────────────────────────

/**
 * Register all printer-related IPC handlers.
 * Call this once from electron/main.ts during app initialization.
 */
export function registerPrinterIPC(): void {
  // ── Print raw data ──────────────────────────────────────────────
  ipcMain.handle('printer:print', async (_event, request: PrintRequest): Promise<PrintResult> => {
    try {
      const buffer = Buffer.from(request.data);

      if (request.printerType === 'USB') {
        return await printUSB(buffer);
      }

      if (request.printerType === 'network') {
        if (!request.networkAddress) {
          return { success: false, error: 'Network address is required for network printing' };
        }
        return await printNetwork(buffer, request.networkAddress, request.networkPort);
      }

      // Fallback: try USB
      return await printUSB(buffer);
    } catch (err: any) {
      console.error('[Printer] Print failed:', err);
      return { success: false, error: err.message };
    }
  });

  // ── List available printers ─────────────────────────────────────
  ipcMain.handle('printer:list', async (): Promise<PrinterInfo[]> => {
    return listPrinters();
  });

  // ── Check printer status ────────────────────────────────────────
  ipcMain.handle('printer:status', async (_event, printerType: string): Promise<{ connected: boolean; error?: string }> => {
    try {
      if (printerType === 'USB') {
        // Try to import escpos-usb and detect devices
        const escposUSB = await import('escpos-usb');
        const USB = escposUSB.default || escposUSB;
        const devices = USB.findPrinter?.() ?? [];
        return { connected: devices.length > 0 };
      }
      return { connected: false, error: 'Unknown printer type' };
    } catch {
      return { connected: false, error: 'USB printer driver not available' };
    }
  });

  console.log('[Printer] IPC handlers registered');
}
