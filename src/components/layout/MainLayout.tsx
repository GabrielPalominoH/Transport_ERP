"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Truck, Building, Settings, LogOut, UserCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  matchSubpaths?: boolean;
}

const navItems: NavItem[] = [
  { href: '/compras', label: 'Compras', icon: <ShoppingCart />, matchSubpaths: true },
  { href: '/transportistas', label: 'Transportistas', icon: <Truck />, matchSubpaths: true },
  { href: '/proveedores', label: 'Proveedores', icon: <Building />, matchSubpaths: true },
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, isLoading: authLoading } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const userInitials = currentUser?.nombre
    ? currentUser.nombre
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'JD';


  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary">
              <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
              <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
            </svg>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <h2 className="text-lg font-semibold">Transport ERP</h2>
              <p className="text-xs text-muted-foreground">Lite Version</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    asChild
                    isActive={item.matchSubpaths ? pathname.startsWith(item.href) : pathname === item.href}
                    tooltip={item.label}
                  >
                    <a>
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          {currentUser ? (
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-9 w-9">
                {/* Placeholder for potential user image logic */}
                {/* <AvatarImage src={currentUser.avatarUrl} alt="User Avatar" /> */}
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium truncate" title={currentUser.nombre}>{currentUser.nombre}</p>
                <p className="text-xs text-muted-foreground">{currentUser.dni}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              <UserCircle className="h-9 w-9 text-muted-foreground"/>
               <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium">Invitado</p>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-sm md:justify-end">
           <SidebarTrigger className="md:hidden" />
          {/* <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button> */}
          <Button variant="ghost" size="icon" onClick={handleLogout} disabled={authLoading} aria-label="Logout">
            {authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
            <span className="sr-only">Logout</span>
          </Button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
