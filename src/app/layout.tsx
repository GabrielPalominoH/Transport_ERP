import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Using Inter as a clean sans-serif font
import './globals.css';
import { cn } from '@/lib/utils';
import MainLayout from '@/components/layout/MainLayout';
import { Toaster } from "@/components/ui/toaster";


const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Transport ERP Lite',
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
        <MainLayout>{children}</MainLayout>
        <Toaster />
      </body>
    </html>
  );
}
