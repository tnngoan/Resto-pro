/**
 * pos.ts — Zustand store for POS state.
 *
 * Manages:
 *   - Selected table
 *   - Current order being built (items, notes)
 *   - Logged-in staff member
 *   - VAT calculation
 */
import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { MenuItem, OrderItem, OrderItemStatus } from '@restopro/shared';
import { VAT_RATE } from '@restopro/shared';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface OrderItemDraft {
  /** Local unique ID for this line item */
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderItemStatus;
  modifications: string[];
  notes: string;
}

export interface StaffInfo {
  id: string;
  name: string;
}

interface POSState {
  // ── Table ──
  selectedTableId: string | null;
  selectedTableName: string | null;

  // ── Order being built ──
  currentOrderId: string | null; // null = new order, string = adding to existing
  items: OrderItemDraft[];
  orderNote: string;

  // ── Staff ──
  staff: StaffInfo | null;

  // ── Computed (kept in sync by actions) ──
  subtotal: number;
  vatAmount: number;
  total: number;
}

interface POSActions {
  setTable: (tableId: string, tableName: string) => void;
  clearTable: () => void;
  setExistingOrder: (orderId: string, items: OrderItem[]) => void;

  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateItemQty: (itemId: string, qty: number) => void;
  setItemNote: (itemId: string, note: string) => void;
  setOrderNote: (note: string) => void;
  clearOrder: () => void;

  setStaff: (staff: StaffInfo) => void;
  clearStaff: () => void;
}

export type POSStore = POSState & POSActions;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function recalcTotals(items: OrderItemDraft[]) {
  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const vatAmount = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const usePOSStore = create<POSStore>((set, get) => ({
  // ── Initial state ──
  selectedTableId: null,
  selectedTableName: null,
  currentOrderId: null,
  items: [],
  orderNote: '',
  staff: null,
  subtotal: 0,
  vatAmount: 0,
  total: 0,

  // ── Table ──
  setTable: (tableId, tableName) =>
    set({ selectedTableId: tableId, selectedTableName: tableName }),

  clearTable: () =>
    set({
      selectedTableId: null,
      selectedTableName: null,
      currentOrderId: null,
      items: [],
      orderNote: '',
      subtotal: 0,
      vatAmount: 0,
      total: 0,
    }),

  // ── Load existing order into the editor ──
  setExistingOrder: (orderId, serverItems) => {
    const items: OrderItemDraft[] = serverItems.map((si) => ({
      id: si.id,
      menuItemId: si.menuItemId,
      name: si.name,
      quantity: si.quantity,
      unitPrice: si.unitPrice,
      totalPrice: si.totalPrice,
      status: si.status,
      modifications: si.modifications || [],
      notes: si.notes || '',
    }));
    const totals = recalcTotals(items);
    set({ currentOrderId: orderId, items, ...totals });
  },

  // ── Items ──
  addItem: (menuItem) => {
    const { items } = get();
    const existing = items.find((i) => i.menuItemId === menuItem.id && !i.notes);

    let updatedItems: OrderItemDraft[];
    if (existing) {
      // Increment quantity
      updatedItems = items.map((i) =>
        i.id === existing.id
          ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
          : i,
      );
    } else {
      // New line
      const draft: OrderItemDraft = {
        id: uuid(),
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        unitPrice: menuItem.price,
        totalPrice: menuItem.price,
        status: 'PENDING' as OrderItemStatus,
        modifications: [],
        notes: '',
      };
      updatedItems = [...items, draft];
    }

    const totals = recalcTotals(updatedItems);
    set({ items: updatedItems, ...totals });
  },

  removeItem: (itemId) => {
    const updatedItems = get().items.filter((i) => i.id !== itemId);
    const totals = recalcTotals(updatedItems);
    set({ items: updatedItems, ...totals });
  },

  updateItemQty: (itemId, qty) => {
    if (qty <= 0) {
      get().removeItem(itemId);
      return;
    }
    const updatedItems = get().items.map((i) =>
      i.id === itemId ? { ...i, quantity: qty, totalPrice: qty * i.unitPrice } : i,
    );
    const totals = recalcTotals(updatedItems);
    set({ items: updatedItems, ...totals });
  },

  setItemNote: (itemId, note) => {
    const updatedItems = get().items.map((i) => (i.id === itemId ? { ...i, notes: note } : i));
    set({ items: updatedItems });
  },

  setOrderNote: (note) => set({ orderNote: note }),

  clearOrder: () =>
    set({
      currentOrderId: null,
      items: [],
      orderNote: '',
      subtotal: 0,
      vatAmount: 0,
      total: 0,
    }),

  // ── Staff ──
  setStaff: (staff) => set({ staff }),
  clearStaff: () => set({ staff: null }),
}));
