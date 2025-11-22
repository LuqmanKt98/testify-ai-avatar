'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/lobby');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-navy-700">
      <div className="text-center animate-fade-in">
        <div className="inline-block p-6 bg-white rounded-3xl mb-6 shadow-2xl">
          <Image
            src="/logo.png"
            alt="Testify Logo"
            width={120}
            height={120}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Testify</h1>
        <p className="text-gray-300 text-lg font-medium">Loading...</p>
        <div className="mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
