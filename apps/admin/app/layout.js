import { DM_Sans, DM_Mono } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import AdminSessionProvider from '@/components/AdminSessionProvider';
import Sidebar from '@/components/layout/Sidebar';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: { default: 'Admin', template: '%s | ShopLux Admin' },
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="antialiased bg-gray-50 text-gray-900">
        <AdminSessionProvider session={session}>
          {session ? (
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </div>
          ) : (
            children
          )}
        </AdminSessionProvider>
      </body>
    </html>
  );
}
