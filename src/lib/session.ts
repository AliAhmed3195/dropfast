import { cookies } from 'next/headers';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPPLIER' | 'VENDOR';
  isActive: boolean;
}

export async function createSession(user: User) {
  const sessionData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
  };

  // In a real app, you'd use a proper session store or JWT
  // For now, we'll use a simple cookie-based approach
  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return null;
    }

    const sessionData = JSON.parse(sessionCookie.value);
    return sessionData;
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
