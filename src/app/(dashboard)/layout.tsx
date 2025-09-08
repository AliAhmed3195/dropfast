'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession } from '@/lib/session';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Redirect based on role and current path
        const role = data.user.role;
        if (pathname === '/admin' && role !== 'ADMIN') {
          router.push(`/${role.toLowerCase()}`);
        } else if (pathname === '/supplier' && role !== 'SUPPLIER') {
          router.push(`/${role.toLowerCase()}`);
        } else if (pathname === '/vendor' && role !== 'VENDOR') {
          router.push(`/${role.toLowerCase()}`);
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: `/${user.role.toLowerCase()}`, current: pathname === `/${user.role.toLowerCase()}` },
  ];

  if (user.role === 'SUPPLIER') {
    navigation.push(
      { name: 'Products', href: '/supplier/products', current: pathname === '/supplier/products' },
      { name: 'Orders', href: '/supplier/orders', current: pathname === '/supplier/orders' }
    );
  }

  if (user.role === 'VENDOR') {
    navigation.push(
      { name: 'Create Store', href: '/vendor/create-store', current: pathname === '/vendor/create-store' },
      { name: 'Create Hosted Link', href: '/vendor/create-hosted-link', current: pathname === '/vendor/create-hosted-link' },
      { name: 'Stores', href: '/vendor/stores', current: pathname === '/vendor/stores' },
      { name: 'Import Products', href: '/vendor/import', current: pathname === '/vendor/import' },
      { name: 'Orders', href: '/vendor/orders', current: pathname === '/vendor/orders' },
      { name: 'Invoices', href: '/vendor/invoices', current: pathname === '/vendor/invoices' },
      { name: 'Invoice Templates', href: '/vendor/invoice-templates', current: pathname === '/vendor/invoice-templates' },
      { name: 'Logo Upload', href: '/vendor/logo-upload', current: pathname === '/vendor/logo-upload' },
      { name: 'Settings', href: '/vendor/settings', current: pathname === '/vendor/settings' }
    );
  }

  if (user.role === 'ADMIN') {
    navigation.push(
      { name: 'Users', href: '/admin/users', current: pathname === '/admin/users' },
      { name: 'Products', href: '/admin/products', current: pathname === '/admin/products' },
      { name: 'Orders', href: '/admin/orders', current: pathname === '/admin/orders' },
      { name: 'Invoice Templates', href: '/admin/invoice-templates', current: pathname === '/admin/invoice-templates' }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">Fastdrop</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user.name}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {user.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
