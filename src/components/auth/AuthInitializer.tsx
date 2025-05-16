
"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function AuthInitializer() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    // initAuth itself is now guarded against multiple listener attachments
    initAuth();
  }, [initAuth]); // Dependency array ensures it's called once on mount, initAuth is stable

  return null;
}

