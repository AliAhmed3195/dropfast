export type DashboardProps = {
  userId: string;
  role: 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER' | 'CUSTOMER';
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER' | 'CUSTOMER';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  businessId?: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  isActive: boolean;
  markup: number;
  hostedLink?: string;
  createdAt: string;
  supplier?: {
    name: string;
  };
  store?: {
    name: string;
    slug: string;
  };
};

export type Store = {
  id: string;
  name: string;
  slug: string;
  description: string;
  template: string;
  isActive: boolean;
  createdAt: string;
  owner?: {
    name: string;
  };
};

export type Order = {
  id: string;
  productId: string;
  storeId: string;
  customerId: string;
  quantity: number;
  productPrice: number;
  markupAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
};