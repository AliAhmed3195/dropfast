'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BankDetailsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Express onboarding
    router.replace('/supplier/onboarding');
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Stripe onboarding...</p>
      </div>
    </div>
  );
}