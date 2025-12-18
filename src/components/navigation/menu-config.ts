import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
  TagIcon,
  FolderIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ShoppingCartIcon,
  ClipboardDocumentCheckIcon,
  ReceiptRefundIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  section?: string;
}

export interface MenuConfig {
  [key: string]: MenuItem[];
}

export const menuConfig: MenuConfig = {
  ADMIN: [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: HomeIcon,
      section: 'MAIN',
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: UsersIcon,
      section: 'USER MANAGEMENT',
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: CubeIcon,
      section: 'PRODUCT MANAGEMENT',
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: FolderIcon,
      section: 'PRODUCT MANAGEMENT',
    },
    {
      name: 'Tags',
      href: '/admin/tags',
      icon: TagIcon,
      section: 'PRODUCT MANAGEMENT',
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCartIcon,
      section: 'ORDER MANAGEMENT',
    },
    {
      name: 'Order Management',
      href: '/admin/orders/management',
      icon: ClipboardDocumentCheckIcon,
      section: 'ORDER MANAGEMENT',
    },
    {
      name: 'Payouts',
      href: '/admin/payouts',
      icon: BanknotesIcon,
      section: 'ORDER MANAGEMENT',
    },
    {
      name: 'Invoice Templates',
      href: '/admin/invoice-templates',
      icon: DocumentDuplicateIcon,
      section: 'SETTINGS',
    },
  ],

  SUPPLIER_USER: [
    {
      name: 'Dashboard',
      href: '/supplier',
      icon: HomeIcon,
      section: 'MAIN',
    },
    {
      name: 'Products',
      href: '/supplier/products',
      icon: CubeIcon,
      section: 'PRODUCTS',
    },
    {
      name: 'Orders',
      href: '/supplier/orders',
      icon: ShoppingCartIcon,
      section: 'ORDERS',
    },
    {
      name: 'Bank Details',
      href: '/supplier/bank-details',
      icon: CreditCardIcon,
      section: 'ACCOUNT',
    },
  ],

  VENDOR_USER: [
    {
      name: 'Dashboard',
      href: '/vendor',
      icon: HomeIcon,
      section: 'MAIN',
    },
    {
      name: 'Stores',
      href: '/vendor/stores',
      icon: BuildingStorefrontIcon,
      section: 'STORE MANAGEMENT',
    },
    {
      name: 'Available Products',
      href: '/vendor/products',
      icon: CubeIcon,
      section: 'STORE MANAGEMENT',
    },
    {
      name: 'Imported Products',
      href: '/vendor/imported-products',
      icon: ShoppingBagIcon,
      section: 'STORE MANAGEMENT',
    },
    {
      name: 'Orders',
      href: '/vendor/orders',
      icon: ShoppingCartIcon,
      section: 'ORDERS',
    },
    {
      name: 'Pending Approval',
      href: '/vendor/orders/pending-approval',
      icon: ClipboardDocumentCheckIcon,
      section: 'ORDERS',
    },
    {
      name: 'Invoices',
      href: '/vendor/invoices',
      icon: DocumentTextIcon,
      section: 'INVOICES',
    },
    {
      name: 'Invoice Templates',
      href: '/vendor/invoice-templates',
      icon: DocumentDuplicateIcon,
      section: 'INVOICES',
    },
    {
      name: 'Bank Details',
      href: '/vendor/bank-details',
      icon: CreditCardIcon,
      section: 'ACCOUNT',
    },
    {
      name: 'Settings',
      href: '/vendor/settings',
      icon: Cog6ToothIcon,
      section: 'ACCOUNT',
    },
  ],
};

export function getMenuItems(role: string): MenuItem[] {
  return menuConfig[role] || [];
}

export function getMenuSections(role: string): string[] {
  const items = getMenuItems(role);
  const sections = new Set<string>();
  items.forEach((item) => {
    if (item.section) {
      sections.add(item.section);
    }
  });
  return Array.from(sections);
}
