"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/compras'); // Redirect to main app page if authenticated
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verificando sesión...</p>
      </div>
    );
  }

  // Only show children (login/register page) if not authenticated and not loading
  return !isAuthenticated ? (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      {children}
    </main>
  ) : null; // Or a loader while redirecting
}
