/**
 * PrintPreview — On-screen preview of a receipt or kitchen ticket
 * before sending to the thermal printer.
 *
 * Shows a fixed-width Courier New preview that closely matches
 * the 80mm thermal printer output. Provides "In ngay" (Print)
 * and "Bỏ qua" (Skip) buttons.
 *
 * Usage:
 *   <PrintPreview
 *     type="receipt"
 *     previewText={receiptText}
 *     onPrint={() => printReceipt(order, restaurant)}
 *     onSkip={() => setShowPreview(false)}
 *     isPrinting={isPrinting}
 *   />
 */
import { useState } from 'react';
import { Printer, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ─── Props ──────────────────────────────────────────────────────────

interface PrintPreviewProps {
  /** Type of document being previewed */
  type: 'receipt' | 'kitchen-ticket';
  /** Pre-formatted plain text to display (from buildReceiptPreviewText / buildKitchenTicketPreviewText) */
  previewText: string;
  /** Called when user clicks "In ngay" (Print Now) */
  onPrint: () => Promise<{ success: boolean; error?: string }>;
  /** Called when user clicks "Bỏ qua" (Skip) or closes the dialog */
  onSkip: () => void;
  /** External printing state (from usePrint hook) */
  isPrinting?: boolean;
  /** Whether to show as a modal overlay (default: true) */
  modal?: boolean;
}

// ─── Title labels ───────────────────────────────────────────────────

const TYPE_LABELS = {
  receipt: 'Hoá đơn khách hàng',
  'kitchen-ticket': 'Phiếu bếp',
} as const;

// ─── Component ──────────────────────────────────────────────────────

export function PrintPreview({
  type,
  previewText,
  onPrint,
  onSkip,
  isPrinting = false,
  modal = true,
}: PrintPreviewProps) {
  const [printState, setPrintState] = useState<'idle' | 'printing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isWorking = isPrinting || printState === 'printing';

  const handlePrint = async () => {
    setPrintState('printing');
    setErrorMsg(null);

    try {
      const result = await onPrint();

      if (result.success) {
        setPrintState('success');
        // Auto-close after 1.5s on success
        setTimeout(() => {
          onSkip();
        }, 1500);
      } else {
        setPrintState('error');
        setErrorMsg(result.error ?? 'Lỗi in không xác định');
      }
    } catch (err: any) {
      setPrintState('error');
      setErrorMsg(err.message);
    }
  };

  const content = (
    <div className="flex flex-col max-h-[90vh] w-full max-w-md">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 rounded-t-xl border-b border-neutral-700">
        <div className="flex items-center gap-2">
          <Printer size={18} className="text-neutral-400" />
          <h3 className="text-sm font-semibold text-white">
            {TYPE_LABELS[type]}
          </h3>
        </div>
        <button
          onClick={onSkip}
          disabled={isWorking}
          className="p-1 rounded hover:bg-neutral-700 transition-colors disabled:opacity-50"
          aria-label="Đóng"
        >
          <X size={18} className="text-neutral-400" />
        </button>
      </div>

      {/* ── Receipt Preview ────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-white p-4">
        <pre
          className="font-mono text-xs leading-relaxed text-neutral-900 whitespace-pre-wrap"
          style={{
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '11px',
            lineHeight: '1.5',
            // Simulate 80mm thermal paper width
            maxWidth: '384px', // 48 chars × 8px per char
            margin: '0 auto',
          }}
        >
          {previewText}
        </pre>
      </div>

      {/* ── Status Message ─────────────────────────────── */}
      {printState === 'success' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-900/50 text-green-300 text-sm">
          <CheckCircle size={16} />
          <span>In thành công!</span>
        </div>
      )}

      {printState === 'error' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-900/50 text-red-300 text-sm">
          <AlertCircle size={16} />
          <span>{errorMsg ?? 'Lỗi in'}</span>
        </div>
      )}

      {/* ── Action Buttons ─────────────────────────────── */}
      <div className="flex gap-3 px-4 py-3 bg-neutral-800 rounded-b-xl border-t border-neutral-700">
        <button
          onClick={onSkip}
          disabled={isWorking}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-300 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50"
        >
          Bỏ qua
        </button>
        <button
          onClick={handlePrint}
          disabled={isWorking || printState === 'success'}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {isWorking ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang in...
            </>
          ) : printState === 'success' ? (
            <>
              <CheckCircle size={16} />
              Đã in
            </>
          ) : printState === 'error' ? (
            <>
              <Printer size={16} />
              Thử lại
            </>
          ) : (
            <>
              <Printer size={16} />
              In ngay
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ── Modal wrapper ─────────────────────────────────────────────

  if (modal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={isWorking ? undefined : onSkip}
        />
        {/* Dialog */}
        <div className="relative z-10 rounded-xl shadow-2xl border border-neutral-700 overflow-hidden">
          {content}
        </div>
      </div>
    );
  }

  // ── Inline (non-modal) ────────────────────────────────────────
  return (
    <div className="rounded-xl shadow-lg border border-neutral-700 overflow-hidden">
      {content}
    </div>
  );
}

export default PrintPreview;
