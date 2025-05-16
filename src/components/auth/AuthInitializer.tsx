"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function AuthInitializer() {
  const { initAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // Prevent re-initializing if already loading or initialized
    if (isLoading && !useAuthStore.getState().currentUser) {
        initAuth();
    }
  }, [initAuth, isLoading]);

  return null; // This component doesn't render anything
}
