'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { CartProvider } from '@/components/cart/CartIcon';

export default function SessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider session={session}>
      <CartProvider>
        {children}
      </CartProvider>
    </NextAuthSessionProvider>
  );
}
