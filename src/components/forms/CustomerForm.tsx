'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store';
import { createDocument, Timestamp } from '@/firebase/firestore';
import { COLLECTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const customerSchema = z.object({
  shopName: z.string().min(2, 'Shop name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(5, 'Address is required'),
  email: z.string().email().optional().or(z.literal('')),
  region: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  onSuccess: () => void;
}

export function CustomerForm({ onSuccess }: CustomerFormProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      shopName: '',
      ownerName: '',
      phone: '',
      address: '',
      email: '',
      region: user?.assignedRegion || '',
    },
  });

  const onSubmit = async (data: CustomerFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      await createDocument(COLLECTIONS.CUSTOMERS, {
        ...data,
        assignedExecutive: user.uid,
        outstandingAmount: 0,
        status: 'active',
        locationCoordinates: { latitude: 0, longitude: 0 }, // GPS can be added later
      });
      toast.success('Customer added successfully');
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { formState: { errors } } = form;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shopName">Shop Name</Label>
        <Input 
          id="shopName" 
          {...form.register('shopName')} 
          className="rounded-xl h-11"
        />
        {errors.shopName && <p className="text-sm text-destructive">{errors.shopName.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ownerName">Owner Name</Label>
        <Input 
          id="ownerName" 
          {...form.register('ownerName')} 
          className="rounded-xl h-11"
        />
        {errors.ownerName && <p className="text-sm text-destructive">{errors.ownerName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input 
          id="phone" 
          type="tel"
          {...form.register('phone')} 
          className="rounded-xl h-11"
        />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input 
          id="email" 
          type="email"
          {...form.register('email')} 
          className="rounded-xl h-11"
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea 
          id="address" 
          {...form.register('address')} 
          className="rounded-xl min-h-[80px]"
        />
        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
      </div>

      <Button 
        type="submit" 
        className="w-full rounded-xl h-11 animated-gradient text-white mt-2"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Add Customer
      </Button>
    </form>
  );
}
