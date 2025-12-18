'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current?: boolean;
}

export default function SidebarItem({ name, href, icon: Icon, current }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = current || pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`
        group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150
        ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      <Icon
        className={`
          mr-3 h-5 w-5 flex-shrink-0
          ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}
        `}
        aria-hidden="true"
      />
      {name}
    </Link>
  );
}
