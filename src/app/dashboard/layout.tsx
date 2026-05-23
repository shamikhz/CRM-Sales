'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';
import { Loader2, Home, Users, ShoppingBag, CheckSquare, User, WifiOff, LogOut } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SE_NAV_ITEMS } from '@/lib/constants';
import { toast } from 'sonner';
import { signOut } from '@/firebase/auth';
import { auth } from '@/firebase/config';

// Icons mapping for the nav items
const NavIcons = {
  Home,
  Users,
  ShoppingBag,
  CheckSquare,
  User,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { isOnline, setOnline } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Online/Offline status listeners
    const handleOnline = () => {
      setOnline(true);
      toast.success('Back online');
    };
    const handleOffline = () => {
      setOnline(false);
      toast.warning('You are offline. Some features may be unavailable.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/');
    } else if (!isLoading && user && user.role !== 'sales-executive') {
      toast.error('Access Denied', {
        description: 'You must be a Sales Executive to access this app.'
      });
      signOut().then(() => router.push('/'));
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (!mounted || isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  // Determine active tab based on pathname
  const activeTab = SE_NAV_ITEMS.find(item => 
    item.href === pathname || 
    (item.href !== '/dashboard' && pathname.startsWith(item.href))
  )?.id || 'home';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0a0a0c] overflow-hidden">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium z-50">
          <WifiOff className="w-4 h-4" />
          You are currently offline
        </div>
      )}

      {/* Unified Main Content Area */}
      <main className="flex-1 md:pl-64 overflow-y-auto bg-slate-50 dark:bg-[#0a0a0c] pb-20 md:pb-0 h-screen">
        <div className="w-full min-h-full bg-background relative shadow-sm">
          {children}
        </div>
      </main>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 nav-blur z-50 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {SE_NAV_ITEMS.map((item) => {
            const Icon = NavIcons[item.icon as keyof typeof NavIcons];
            const isActive = activeTab === item.id;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
              >
                <div
                  className={cn(
                    "flex flex-col items-center justify-center transition-all duration-300",
                    isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-6 h-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={cn(
                    "text-[10px] font-medium mt-1 transition-all",
                    isActive ? "opacity-100" : "opacity-0 translate-y-1"
                  )}>
                    {item.label}
                  </span>
                </div>
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full animate-in fade-in zoom-in duration-300" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar (visible only on large screens) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/50 bg-background/50 backdrop-blur-xl fixed top-0 bottom-0 left-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl animated-gradient text-white flex items-center justify-center shadow-lg">
              <span className="font-bold text-lg">FF</span>
            </div>
            <div>
              <h1 className="font-bold tracking-tight">FieldForce SE</h1>
              <p className="text-xs text-muted-foreground">Sales Executive</p>
            </div>
          </div>

          <nav className="space-y-2">
            {SE_NAV_ITEMS.map((item) => {
              const Icon = NavIcons[item.icon as keyof typeof NavIcons];
              const isActive = activeTab === item.id;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "fill-primary/20")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-border/50">
          <button 
            onClick={() => {
              signOut().then(() => router.push('/'));
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </div>
  );
}
