/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface PrintRequest {
  data: number[];
  printerType: string;
  networkAddress?: string;
  networkPort?: number;
}

interface PrintResult {
  success: boolean;
  error?: string;
}

interface PrinterInfo {
  name: string;
  isDefault: boolean;
  status: string;
}

interface ElectronAPI {
  toggleFullscreen: () => Promise<boolean>;
  getAppVersion: () => Promise<string>;

  // Printer APIs
  print: (request: PrintRequest) => Promise<PrintResult>;
  listPrinters: () => Promise<PrinterInfo[]>;
  printerStatus: (printerType: string) => Promise<{ connected: boolean; error?: string }>;

  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
