'use client';
import { createContext, useContext, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';

const CART_KEY = 'cart';
const CartContext = createContext(null);

// Read/write cart directly from localStorage — no server fetch needed
function readCart() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
function writeCart(items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  mutate(CART_KEY, items, false); // update SWR cache without revalidating
}

export function CartProvider({ children }) {
  const { data: cart = [] } = useSWR(CART_KEY, readCart, {
    fallbackData: [],
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const addToCart = useCallback((item) => {
    const current = readCart();
    const idx = current.findIndex(
      (i) => i._id === item._id && i.variant === item.variant
    );
    if (idx > -1) {
      current[idx] = { ...current[idx], qty: Math.min(current[idx].qty + 1, item.stock) };
    } else {
      current.push({ ...item, qty: 1 });
    }
    writeCart(current);
  }, []);

  const removeFromCart = useCallback((id, variant) => {
    writeCart(readCart().filter((i) => !(i._id === id && i.variant === variant)));
  }, []);

  const updateQty = useCallback((id, variant, qty) => {
    const current = readCart();
    const idx = current.findIndex((i) => i._id === id && i.variant === variant);
    if (idx === -1) return;
    if (qty < 1) { writeCart(current.filter((_, i) => i !== idx)); return; }
    current[idx] = { ...current[idx], qty: Math.min(qty, current[idx].stock) };
    writeCart(current);
  }, []);

  const clearCart = useCallback(() => writeCart([]), []);

  const itemCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

// Navbar cart icon
export default function CartIcon() {
  const { itemCount } = useCart();
  return (
    <Link href="/cart" className="relative inline-flex p-1.5 text-gray-700 hover:text-gray-900 transition-colors">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
        <path strokeLinecap="round" d="M16 10a4 4 0 01-8 0"/>
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-gray-900 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
