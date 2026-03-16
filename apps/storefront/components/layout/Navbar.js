"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import CartIcon from "@/components/cart/CartIcon";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-8">
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-xl tracking-tight text-gray-900 shrink-0"
        >
          Rehan's Collection
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex gap-6 flex-1">
          {[
            ["Shop", "/products"],
            ["Featured", "/products?featured=true"],
            ["About", "/about"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">
          <CartIcon />

          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 hover:border-gray-500 transition-colors"
              >
                {session.user.name?.split(" ")[0]} ▾
              </button>
              {menuOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  {[
                    { label: "My Orders", href: "/orders" },
                    { label: "Account", href: "/account" },
                  ].map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                  {session.user.role === "admin" && (
                    <a
                      href={
                        process.env.NEXT_PUBLIC_ADMIN_URL ||
                        "http://localhost:3001"
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Admin Panel ↗
                    </a>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
