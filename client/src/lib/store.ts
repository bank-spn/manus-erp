import { create } from 'zustand';
import { CartItem, Product } from './types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: (product, qty = 1) => {
    set((state) => {
      const existingItem = state.items.find(item => item.product.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map(item =>
            item.product.id === product.id
              ? { ...item, qty: item.qty + qty }
              : item
          ),
        };
      }
      return { items: [...state.items, { product, qty }] };
    });
  },
  
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter(item => item.product.id !== productId),
    }));
  },
  
  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map(item =>
        item.product.id === productId ? { ...item, qty } : item
      ),
    }));
  },
  
  clearCart: () => set({ items: [] }),
  
  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },
  
  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  },
}));

interface AppStore {
  language: 'th' | 'en';
  setLanguage: (lang: 'th' | 'en') => void;
  selectedTable?: number;
  setSelectedTable: (tableId?: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  language: 'th',
  setLanguage: (lang) => set({ language: lang }),
  selectedTable: undefined,
  setSelectedTable: (tableId) => set({ selectedTable: tableId }),
}));

