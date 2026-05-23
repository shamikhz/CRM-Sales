'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { subscribeToCollection } from '@/firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Plus, Loader2, Calendar } from 'lucide-react';
import { COLLECTIONS } from '@/lib/constants';
import type { Visit } from '@/types';
import { format } from 'date-fns';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VisitForm } from '@/components/forms/VisitForm';

export default function VisitsPage() {
  const { user } = useAuthStore();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection(COLLECTIONS.VISITS, (data) => {
      const allVisits = data as unknown as Visit[];
      const myVisits = allVisits.filter(v => v.salesExecutiveId === user.uid);
      setVisits(myVisits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setIsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredVisits = visits.filter(v => 
    v.customerName?.toLowerCase().includes(search.toLowerCase()) || 
    v.visitPurpose?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 space-y-4 h-full flex flex-col">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Visits</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full animated-gradient shadow-lg text-white">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl w-[95%]">
            <DialogHeader>
              <DialogTitle>Log New Visit</DialogTitle>
            </DialogHeader>
            <VisitForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search visits..." 
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
        ) : filteredVisits.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>No visits logged yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVisits.map(visit => (
              <Card key={visit.id} className="glass-card border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-base leading-tight">{visit.customerName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{visit.visitPurpose}</p>
                    </div>
                    <Badge variant={visit.visitStatus === 'completed' ? 'default' : 'secondary'} className={visit.visitStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : ''}>
                      {visit.visitStatus}
                    </Badge>
                  </div>
                  
                  {visit.notes && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 italic bg-muted/50 p-2 rounded-md">
                      &quot;{visit.notes}&quot;
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {format(visit.createdAt, 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="flex items-center text-primary">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      View Location
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
