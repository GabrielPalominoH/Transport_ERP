import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
// Removed MainLayout from here, it will be in (app)/layout.tsx
import { Toaster } from "@/components/ui/toaster";
import AuthInitializer from '@/components/auth/AuthInitializer';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Transport Medanos', // Updated title
  description: 'Lite ERP for transport management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <AuthInitializer />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
