'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { subscribeToCollection } from '@/firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Phone, Plus, Loader2 } from 'lucide-react';
import { COLLECTIONS } from '@/lib/constants';
import type { Customer } from '@/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CustomerForm } from '@/components/forms/CustomerForm';

export default function CustomersPage() {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection(COLLECTIONS.CUSTOMERS, (data) => {
      const allCustomers = data as unknown as Customer[];
      // Filter customers assigned to this sales executive
      const myCustomers = allCustomers.filter(c => c.assignedExecutive === user.uid);
      setCustomers(myCustomers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setIsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredCustomers = customers.filter(c => 
    c.shopName?.toLowerCase().includes(search.toLowerCase()) || 
    c.ownerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 space-y-4 h-full flex flex-col">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full animated-gradient shadow-lg text-white">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl w-[95%]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search customers..." 
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
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>No customers found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map(customer => (
              <Card key={customer.id} className="glass-card border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{customer.shopName}</h3>
                      <p className="text-sm text-muted-foreground">{customer.ownerName}</p>
                    </div>
                    <Badge variant={customer.status === 'active' ? 'default' : 'secondary'} className={customer.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : ''}>
                      {customer.status || 'Active'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1.5 mt-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 mr-2" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  </div>

                  {customer.outstandingAmount > 0 && (
                    <div className="mt-4 p-2.5 bg-red-500/10 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-medium text-red-500">Outstanding</span>
                      <span className="font-bold text-red-500">${customer.outstandingAmount.toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
