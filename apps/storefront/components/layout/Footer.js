import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white/60 mt-24 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-bold text-xl mb-3">ShopLux</h3>
            <p className="text-sm leading-relaxed">
              Curated products from makers who care about every detail.
            </p>
          </div>

          {[
            {
              title: 'Shop',
              links: [
                ['All Products', '/products'],
                ['Featured', '/products?featured=true'],
                ['New Arrivals', '/products?sort=newest'],
              ],
            },
            {
              title: 'Account',
              links: [
                ['My Orders', '/orders'],
                ['Sign In', '/auth/login'],
                ['Create Account', '/auth/register'],
              ],
            },
            {
              title: 'Contact',
              links: [],
              text: ['support@yourshop.com', '+880 1700-000000', 'Dhaka, Bangladesh'],
            },
          ].map(({ title, links, text }) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-xs uppercase tracking-widest mb-4">{title}</h4>
              <div className="space-y-2.5">
                {links.map(([label, href]) => (
                  <Link key={href} href={href} className="block text-sm text-white/50 hover:text-white transition-colors">
                    {label}
                  </Link>
                ))}
                {text?.map((line) => (
                  <p key={line} className="text-sm text-white/50">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-wrap justify-between items-center gap-4">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} ShopLux. All rights reserved.</p>
          <div className="flex gap-5">
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Refund Policy', '/refund']].map(([label, href]) => (
              <Link key={href} href={href} className="text-xs text-white/30 hover:text-white/60 transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
