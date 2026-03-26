/**
 * ESC/POS Command Builder for 80mm thermal printers (48 chars wide).
 *
 * Builds raw byte arrays that can be sent directly to a thermal printer
 * via USB or Bluetooth from the Electron main process.
 *
 * Encoding: CP1258 (Vietnamese code page) via iconv-lite.
 * Reference: ESC/POS Application Programming Guide (Epson)
 */
import * as iconv from 'iconv-lite';

// ─── ESC/POS Command Constants ──────────────────────────────────────
const ESC = 0x1b;
const GS = 0x1d;

/** Standard width for 80mm paper with default font */
export const LINE_WIDTH = 48;

// ─── Text alignment values ──────────────────────────────────────────
const ALIGN_MAP = { left: 0, center: 1, right: 2 } as const;
export type Alignment = keyof typeof ALIGN_MAP;

// ─── Character encoding ─────────────────────────────────────────────
const ENCODING = 'CP1258'; // Vietnamese code page
const FALLBACK_ENCODING = 'ascii';

/**
 * Check whether iconv-lite can encode to CP1258.
 * If not (e.g. codec not bundled), we fall back to ASCII transliteration.
 */
function canEncodeCP1258(): boolean {
  try {
    return iconv.encodingExists(ENCODING);
  } catch {
    return false;
  }
}

/**
 * Simple ASCII transliteration for Vietnamese characters.
 * Used as a fallback when the printer or runtime doesn't support CP1258.
 */
const VN_TRANSLITERATION: Record<string, string> = {
  // Lowercase vowels with diacritics
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
  â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  đ: 'd',
  // Uppercase equivalents
  À: 'A', Á: 'A', Ả: 'A', Ã: 'A', Ạ: 'A',
  Ă: 'A', Ằ: 'A', Ắ: 'A', Ẳ: 'A', Ẵ: 'A', Ặ: 'A',
  Â: 'A', Ầ: 'A', Ấ: 'A', Ẩ: 'A', Ẫ: 'A', Ậ: 'A',
  È: 'E', É: 'E', Ẻ: 'E', Ẽ: 'E', Ẹ: 'E',
  Ê: 'E', Ề: 'E', Ế: 'E', Ể: 'E', Ễ: 'E', Ệ: 'E',
  Ì: 'I', Í: 'I', Ỉ: 'I', Ĩ: 'I', Ị: 'I',
  Ò: 'O', Ó: 'O', Ỏ: 'O', Õ: 'O', Ọ: 'O',
  Ô: 'O', Ồ: 'O', Ố: 'O', Ổ: 'O', Ỗ: 'O', Ộ: 'O',
  Ơ: 'O', Ờ: 'O', Ớ: 'O', Ở: 'O', Ỡ: 'O', Ợ: 'O',
  Ù: 'U', Ú: 'U', Ủ: 'U', Ũ: 'U', Ụ: 'U',
  Ư: 'U', Ừ: 'U', Ứ: 'U', Ử: 'U', Ữ: 'U', Ự: 'U',
  Ỳ: 'Y', Ý: 'Y', Ỷ: 'Y', Ỹ: 'Y', Ỵ: 'Y',
  Đ: 'D',
};

function transliterateVietnamese(text: string): string {
  return text
    .split('')
    .map((ch) => VN_TRANSLITERATION[ch] ?? ch)
    .join('');
}

/**
 * Encode a string for the thermal printer.
 * Prefers CP1258 (native Vietnamese), falls back to ASCII transliteration.
 */
function encodeText(text: string): Buffer {
  if (canEncodeCP1258()) {
    return iconv.encode(text, ENCODING);
  }
  // Fallback: transliterate Vietnamese → ASCII
  return iconv.encode(transliterateVietnamese(text), FALLBACK_ENCODING);
}

// ─── Builder ────────────────────────────────────────────────────────

export class ESCPOSBuilder {
  private buffer: Buffer[] = [];

  // ── Initialization ──────────────────────────────────────────────

  /**
   * Send the ESC @ (initialize) command.
   * Must be called first to reset the printer to default state.
   */
  init(): this {
    this.buffer.push(Buffer.from([ESC, 0x40]));
    return this;
  }

  // ── Text Formatting ─────────────────────────────────────────────

  /**
   * Toggle bold (emphasized) mode.
   * ESC E n — n=1 on, n=0 off
   */
  bold(on = true): this {
    this.buffer.push(Buffer.from([ESC, 0x45, on ? 1 : 0]));
    return this;
  }

  /**
   * Toggle underline mode.
   * ESC - n — n=0 off, n=1 thin, n=2 thick
   */
  underline(mode: 0 | 1 | 2 = 1): this {
    this.buffer.push(Buffer.from([ESC, 0x2d, mode]));
    return this;
  }

  /**
   * Set text alignment.
   * ESC a n — 0=left, 1=center, 2=right
   */
  align(direction: Alignment): this {
    this.buffer.push(Buffer.from([ESC, 0x61, ALIGN_MAP[direction]]));
    return this;
  }

  /**
   * Set character size.
   * GS ! n — width multiplier (1–8) and height multiplier (1–8).
   * Only 1x and 2x are commonly used on cheap 80mm printers.
   */
  size(width: 1 | 2 | 3 | 4, height: 1 | 2 | 3 | 4): this {
    const n = ((width - 1) << 4) | (height - 1);
    this.buffer.push(Buffer.from([GS, 0x21, n]));
    return this;
  }

  /**
   * Select character code page.
   * ESC t n — useful if you need to switch encoding mid-receipt.
   * CP1258 (Vietnamese) is typically page 44 on Epson-compatible printers.
   */
  codePage(page: number): this {
    this.buffer.push(Buffer.from([ESC, 0x74, page]));
    return this;
  }

  // ── Content ─────────────────────────────────────────────────────

  /**
   * Print a line of text (auto-appends newline).
   */
  text(content: string): this {
    this.buffer.push(encodeText(content + '\n'));
    return this;
  }

  /**
   * Print text WITHOUT a trailing newline.
   * Useful when you need to append more content on the same line.
   */
  textInline(content: string): this {
    this.buffer.push(encodeText(content));
    return this;
  }

  /**
   * Print a full-width separator line.
   * @param char — the character to repeat (default: '-')
   */
  line(char = '-'): this {
    return this.text(char.repeat(LINE_WIDTH));
  }

  /**
   * Feed n blank lines.
   */
  newline(n = 1): this {
    this.buffer.push(Buffer.from('\n'.repeat(n)));
    return this;
  }

  /**
   * Append raw bytes to the buffer.
   * Escape hatch for commands not covered by the builder.
   */
  raw(bytes: number[]): this {
    this.buffer.push(Buffer.from(bytes));
    return this;
  }

  // ── Paper Control ───────────────────────────────────────────────

  /**
   * Partial cut with 3-line feed.
   * GS V 65 3 — mode 65 = partial cut, feed 3 lines first.
   */
  cut(): this {
    this.buffer.push(Buffer.from([GS, 0x56, 0x41, 0x03]));
    return this;
  }

  /**
   * Full cut (no feed).
   * GS V 0
   */
  fullCut(): this {
    this.buffer.push(Buffer.from([GS, 0x56, 0x00]));
    return this;
  }

  /**
   * Open the cash drawer (kick pulse).
   * ESC p 0 25 250 — pin 2, on-time 25×2ms, off-time 250×2ms
   */
  openCashDrawer(): this {
    this.buffer.push(Buffer.from([ESC, 0x70, 0x00, 0x19, 0xfa]));
    return this;
  }

  // ── Build ───────────────────────────────────────────────────────

  /**
   * Concatenate all buffered commands into a single Buffer
   * ready to be written to the printer device.
   */
  build(): Buffer {
    return Buffer.concat(this.buffer);
  }

  /**
   * Build and return as a plain number array.
   * Useful for serializing over IPC (Electron renderer → main).
   */
  buildArray(): number[] {
    return Array.from(this.build());
  }

  /**
   * Reset the internal buffer so the builder can be reused.
   */
  reset(): this {
    this.buffer = [];
    return this;
  }
}

// ─── Layout Helpers ─────────────────────────────────────────────────

/**
 * Format a three-column row (left / center / right) padded to fit the line.
 *
 * Example: padColumns('Phở bò', 'x2', '120.000₫', 28, 4, 16)
 *          → "Phở bò                      x2    120.000₫"
 */
export function padColumns(
  left: string,
  mid: string,
  right: string,
  leftW: number,
  midW: number,
  rightW: number,
): string {
  const l = left.length > leftW ? left.slice(0, leftW - 1) + '…' : left.padEnd(leftW);
  const m = mid.padStart(midW);
  const r = right.padStart(rightW);
  return l + m + r;
}

/**
 * Right-align a label + value pair across the full line width.
 *
 * Example: rightAlign('TỔNG CỘNG:', '350.000₫', 48)
 *          → "TỔNG CỘNG:                        350.000₫"
 */
export function rightAlign(label: string, value: string, width: number = LINE_WIDTH): string {
  const gap = width - label.length - value.length;
  if (gap <= 0) return label + ' ' + value;
  return label + ' '.repeat(gap) + value;
}
