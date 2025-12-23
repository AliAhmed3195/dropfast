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
  // Normalize email to lowercase before storing
  const normalizedEmail = email.toLowerCase().trim();
  
  return prisma.user.create({
    data: {
      email: normalizedEmail,
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
  // Convert email to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase().trim();
  
  // Try exact match first (normalized email)
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // If not found, try case-insensitive search for existing data compatibility
  // This handles cases where email might be stored with different casing (e.g., Vendor@fastdrop.com)
  if (!user) {
    // Use raw query for case-insensitive email lookup
    const users = await prisma.$queryRaw<Array<{
      id: string;
      email: string;
      password: string;
      name: string;
      role: string;
      status: string;
      businessId: string | null;
    }>>`
      SELECT id, email, password, name, role, status, "businessId"
      FROM "User"
      WHERE LOWER(email) = LOWER(${normalizedEmail})
      LIMIT 1
    `;
    if (users.length > 0) {
      user = users[0] as any;
    }
  }

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
    role: user.role === 'SUPPLIER' ? 'SUPPLIER_USER' : user.role === 'VENDOR' ? 'VENDOR_USER' : user.role as 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER' | 'CUSTOMER',
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

  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === 'SUPPLIER' ? 'SUPPLIER_USER' : user.role === 'VENDOR' ? 'VENDOR_USER' : user.role as 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER' | 'CUSTOMER',
    status: user.status,
    businessId: user.businessId,
  };
}
