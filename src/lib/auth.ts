import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER' | 'CUSTOMER';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  businessId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(email: string, password: string, name: string, role: 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER' | 'CUSTOMER', businessId?: string) {
  const hashedPassword = await hashPassword(password);
  
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      businessId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      businessId: true,
    },
  });
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  // Check if user is active
  if (user.status !== 'ACTIVE') {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    businessId: user.businessId,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      businessId: true,
    },
  });

  return user;
}
