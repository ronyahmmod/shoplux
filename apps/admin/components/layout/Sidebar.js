'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/products', label: 'Products', icon: '⊞' },
  { href: '/orders', label: 'Orders', icon: '📋' },
  { href: '/customers', label: 'Customers', icon: '👥' },
  { href: '/coupons', label: 'Coupons', icon: '🏷' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-gray-900 flex flex-col overflow-y-auto border-r border-white/5 min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <p className="text-white font-bold text-lg tracking-tight">ShopLux</p>
        <p className="text-white/30 text-[11px] mt-0.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/5 space-y-0.5">
        <a
          href={process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000'}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span className="w-5 text-center">↗</span>
          <span>View Store</span>
        </a>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <span className="w-5 text-center">⏻</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
