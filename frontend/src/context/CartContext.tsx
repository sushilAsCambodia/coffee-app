import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@cafe_cart';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SelectedVariant {
  variant_id: number;
  variant_name: string;
  option_id: number;
  option_name: string;
}

export interface SelectedAddon {
  id: number;
  name: string;
  price: number;
}

export interface CartItem {
  cart_id: string;
  menu_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image: string;
  category?: string;
  description?: string;
  sku?: string;
  type?: string;
  variants: SelectedVariant[];
  addons: SelectedAddon[];
  special_instructions?: string;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  count: number;
  addItem: (item: Omit<CartItem, 'cart_id' | 'total_price'>) => void;
  updateQuantity: (cart_id: string, quantity: number) => void;
  removeItem: (cart_id: string) => void;
  clearCart: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then(raw => {
      if (raw) {
        try { setItems(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  function persist(newItems: CartItem[]) {
    setItems(newItems);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(newItems));
  }

  function addItem(item: Omit<CartItem, 'cart_id' | 'total_price'>) {
    const cart_id = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const total_price = parseFloat((item.unit_price * item.quantity).toFixed(2));
    persist([...items, { ...item, cart_id, total_price }]);
  }

  function updateQuantity(cart_id: string, quantity: number) {
    if (quantity < 1) {
      persist(items.filter(i => i.cart_id !== cart_id));
      return;
    }
    persist(
      items.map(i =>
        i.cart_id === cart_id
          ? { ...i, quantity, total_price: parseFloat((i.unit_price * quantity).toFixed(2)) }
          : i,
      ),
    );
  }

  function removeItem(cart_id: string) {
    persist(items.filter(i => i.cart_id !== cart_id));
  }

  function clearCart() {
    persist([]);
  }

  const total = parseFloat(items.reduce((s, i) => s + i.total_price, 0).toFixed(2));
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, total, count, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
