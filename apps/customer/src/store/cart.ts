import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  nameIt: string;
  price: number; // in VND
  quantity: number;
  modifications?: string;
  notes?: string;
  category: string;
}

interface CartStore {
  tableSlug: string;
  items: CartItem[];
  setTableSlug: (tableSlug: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getSubtotal: () => number;
  getVAT: (subtotal: number) => number;
}

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      tableSlug: '',
      items: [],

      setTableSlug: (tableSlug) => set({ tableSlug }),

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex((i) => i.menuItemId === item.menuItemId);

        if (existingIndex >= 0) {
          // Update quantity if item already exists
          const updated = [...items];
          updated[existingIndex].quantity = item.quantity || updated[existingIndex].quantity + 1;
          set({ items: updated });
        } else {
          // Add new item
          set({
            items: [
              ...items,
              {
                ...item,
                quantity: item.quantity || 1,
              },
            ],
          });
        }
      },

      removeItem: (menuItemId) => {
        set({
          items: get().items.filter((i) => i.menuItemId !== menuItemId),
        });
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }

        set({
          items: get().items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, quantity } : i,
          ),
        });
      },

      updateNotes: (menuItemId, notes) => {
        set({
          items: get().items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, notes } : i,
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const vat = get().getVAT(subtotal);
        return Math.round(subtotal + vat);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return Math.round(
          get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        );
      },

      getVAT: (subtotal: number) => {
        return Math.round(subtotal * 0.08); // 8% VAT
      },
    }),
    {
      name: 'restopro-cart-store',
      version: 1,
    },
  ),
);

export default useCartStore;
