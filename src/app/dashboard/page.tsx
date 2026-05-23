'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { subscribeToCollection, where } from '@/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingBag, CheckSquare, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { COLLECTIONS } from '@/lib/constants';
import type { Customer, Order, Task, Visit } from '@/types';
import Link from 'next/link';

export default function DashboardHome() {
  const { user } = useAuthStore();
  
  const [stats, setStats] = useState({
    customers: 0,
    orders: 0,
    tasks: 0,
    visits: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let customersCount = 0;
    let ordersCount = 0;
    let tasksCount = 0;
    let visitsCount = 0;
    let loadedCount = 0;

    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 4) setIsLoading(false);
    };

    const unsubCustomers = subscribeToCollection(
      COLLECTIONS.CUSTOMERS,
      (data) => {
        const customers = data as Customer[];
        const myCustomers = customers.filter(c => c.assignedExecutive === user.uid);
        customersCount = myCustomers.length;
        setStats(s => ({ ...s, customers: customersCount }));
        checkLoaded();
      }
    );

    const unsubOrders = subscribeToCollection(
      COLLECTIONS.ORDERS,
      (data) => {
        const orders = data as Order[];
        const myOrders = orders.filter(o => o.salesExecutiveId === user.uid);
        ordersCount = myOrders.length;
        setStats(s => ({ ...s, orders: ordersCount }));
        checkLoaded();
      }
    );

    const unsubTasks = subscribeToCollection(
      COLLECTIONS.TASKS,
      (data) => {
        const tasks = data as Task[];
        const myPendingTasks = tasks.filter(t => t.assignedTo === user.uid && t.status !== 'completed');
        tasksCount = myPendingTasks.length;
        setStats(s => ({ ...s, tasks: tasksCount }));
        checkLoaded();
      }
    );

    const unsubVisits = subscribeToCollection(
      COLLECTIONS.VISITS,
      (data) => {
        const visits = data as Visit[];
        const myVisits = visits.filter(v => v.salesExecutiveId === user.uid);
        visitsCount = myVisits.length;
        setStats(s => ({ ...s, visits: visitsCount }));
        checkLoaded();
      }
    );

    return () => {
      unsubCustomers();
      unsubOrders();
      unsubTasks();
      unsubVisits();
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <header className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="w-12 h-12 rounded-full animated-gradient flex items-center justify-center shadow-lg">
          <span className="text-white font-semibold text-lg">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/customers">
          <Card className="glass-card border-none shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{stats.customers}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/orders">
          <Card className="glass-card border-none shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{stats.orders}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/tasks">
          <Card className="glass-card border-none shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <CheckSquare className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{stats.tasks}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/visits">
          <Card className="glass-card border-none shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Visits</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MapPin className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{stats.visits}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions Placeholder */}
      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3">
          <Link href="/dashboard/attendance">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 text-primary active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-full shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="font-medium">Mark Attendance</span>
              </div>
              <ArrowRight className="w-5 h-5 opacity-50" />
            </div>
          </Link>
          <Link href="/dashboard/visits">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary text-secondary-foreground active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-full shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="font-medium">Log New Visit</span>
              </div>
              <ArrowRight className="w-5 h-5 opacity-50" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
