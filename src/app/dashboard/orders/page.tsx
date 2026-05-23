'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { subscribeToCollection } from '@/firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2, Package, Calendar } from 'lucide-react';
import { COLLECTIONS, PAYMENT_STATUS_COLORS, DELIVERY_STATUS_COLORS } from '@/lib/constants';
import type { Order } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OrderForm } from '@/components/forms/OrderForm';

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection(COLLECTIONS.ORDERS, (data) => {
      const allOrders = data as unknown as Order[];
      const myOrders = allOrders.filter(o => o.salesExecutiveId === user.uid);
      setOrders(myOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setIsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredOrders = orders.filter(o => 
    o.orderId?.toLowerCase().includes(search.toLowerCase()) || 
    o.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 space-y-4 h-full flex flex-col">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full animated-gradient shadow-lg text-white">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl w-[95%]">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <OrderForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search order ID or customer..." 
          className="pl-9 rounded-xl bg-white/50 dark:bg-black/20 border-white/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>No orders found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const payColor = PAYMENT_STATUS_COLORS[order.paymentStatus] || PAYMENT_STATUS_COLORS.pending;
              const delColor = DELIVERY_STATUS_COLORS[order.deliveryStatus] || DELIVERY_STATUS_COLORS.pending;
              
              return (
                <Card key={order.id} className="glass-card border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs font-mono text-muted-foreground mb-1">{order.orderId}</div>
                        <h3 className="font-semibold text-base leading-tight">{order.customerName}</h3>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${order.totalAmount.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className={cn("text-xs font-medium border-none", payColor.bg, payColor.text)}>
                        {order.paymentStatus.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className={cn("text-xs font-medium border-none", delColor.bg, delColor.text)}>
                        {order.deliveryStatus.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                      <div className="flex items-center">
                        <Package className="w-3.5 h-3.5 mr-1" />
                        {order.products?.length || 0} items
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {format(order.createdAt, 'MMM d, yyyy')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
