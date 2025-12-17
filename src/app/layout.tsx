import type { Metadata } from 'next';
import '../styles/globals.css';
import '../styles/store-templates.css';
import { CartProvider } from '@/contexts/CartContext';

export const metadata: Metadata = {
  title: 'FastDrop - E-commerce Platform',
  description: 'A comprehensive e-commerce platform with role-based management for admin, suppliers, and vendors.',
  keywords: ['ecommerce', 'platform', 'admin', 'supplier', 'vendor', 'dropshipping'],
  authors: [{ name: 'FastDrop Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <CartProvider>
          <div id="root">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
