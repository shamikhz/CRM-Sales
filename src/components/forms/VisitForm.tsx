'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store';
import { createDocument, subscribeToCollection } from '@/firebase/firestore';
import { COLLECTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Customer } from '@/types';

const visitSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  visitPurpose: z.string().min(2, 'Visit purpose is required'),
  notes: z.string().optional(),
});

type VisitFormValues = z.infer<typeof visitSchema>;

interface VisitFormProps {
  onSuccess: () => void;
}

export function VisitForm({ onSuccess }: VisitFormProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection(COLLECTIONS.CUSTOMERS, (data) => {
      const allCustomers = data as unknown as Customer[];
      setCustomers(allCustomers.filter(c => c.assignedExecutive === user.uid));
    });
    return () => unsub();
  }, [user]);

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      customerId: '',
      visitPurpose: '',
      notes: '',
    },
  });

  const onSubmit = async (data: VisitFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const customer = customers.find(c => c.id === data.customerId);

      // Attempt to get GPS
      let gpsLocation = { latitude: 0, longitude: 0 };
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          gpsLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (e) {
          console.log('Could not get precise location for visit');
        }
      }

      await createDocument(COLLECTIONS.VISITS, {
        customerId: data.customerId,
        customerName: customer?.shopName || 'Unknown',
        salesExecutiveId: user.uid,
        salesExecutiveName: user.name,
        visitPurpose: data.visitPurpose,
        notes: data.notes || '',
        gpsLocation,
        images: [],
        visitStatus: 'completed',
      });

      toast.success('Visit logged successfully');
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to log visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { formState: { errors } } = form;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Customer</Label>
        <Select 
          onValueChange={(val) => form.setValue('customerId', val)}
          defaultValue={form.getValues('customerId')}
        >
          <SelectTrigger className="rounded-xl h-11">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.shopName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="visitPurpose">Purpose of Visit</Label>
        <Input 
          id="visitPurpose" 
          placeholder="e.g. Follow-up, Pitch new product, Payment collection"
          {...form.register('visitPurpose')} 
          className="rounded-xl h-11"
        />
        {errors.visitPurpose && <p className="text-sm text-destructive">{errors.visitPurpose.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes" 
          placeholder="Detailed notes about the meeting..."
          {...form.register('notes')} 
          className="rounded-xl min-h-[100px]"
        />
        {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
      </div>

      <Button 
        type="submit" 
        className="w-full rounded-xl h-11 animated-gradient text-white mt-2"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Log Visit
      </Button>
    </form>
  );
}
