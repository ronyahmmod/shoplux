import { Playfair_Display, DM_Sans } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import SessionProvider from '@/components/SessionProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: { default: 'ShopLux — Premium Products', template: '%s | ShopLux' },
  description: 'Discover curated premium products delivered to your door.',
  openGraph: { type: 'website', siteName: 'ShopLux', locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-white text-gray-900 antialiased" style={{ fontFamily: 'var(--font-body, DM Sans, system-ui, sans-serif)' }}>
        <SessionProvider session={session}>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
