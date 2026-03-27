import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'AME ONE',
    template: '%s • AME ONE',
  },
  description: 'Aircraft Maintenance Engineer Study Platform',
  icons: {
    icon: '/home/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#f8fafc] text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
