'use client';

import { getMenuItems, getMenuSections } from './menu-config';
import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';
import Link from 'next/link';

interface SidebarProps {
  role: string;
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const menuItems = getMenuItems(role);
  const sections = getMenuSections(role);

  // Group items by section
  const itemsBySection = sections.reduce((acc, section) => {
    acc[section] = menuItems.filter((item) => item.section === section);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">FD</span>
          </div>
          <span className="text-xl font-bold text-gray-900">FastDrop</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section}>
            <SidebarSection title={section} />
            <div className="mt-2 space-y-1">
              {itemsBySection[section].map((item) => (
                <SidebarItem
                  key={item.href}
                  name={item.name}
                  href={item.href}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{role.replace('_USER', '')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
