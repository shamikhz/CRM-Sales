'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store';
import { createDocument, subscribeToCollection } from '@/firebase/firestore';
import { COLLECTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Customer } from '@/types';

const orderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  products: z.array(
    z.object({
      name: z.string().min(1, 'Product name is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().min(0, 'Price must be valid'),
    })
  ).min(1, 'At least one product is required'),
  paymentStatus: z.enum(['paid', 'pending', 'partial', 'overdue']),
  deliveryStatus: z.enum(['pending', 'dispatched', 'delivered', 'cancelled']),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
  onSuccess: () => void;
}

export function OrderForm({ onSuccess }: OrderFormProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection(COLLECTIONS.CUSTOMERS, (data) => {
      const allCustomers = data as Customer[];
      setCustomers(allCustomers.filter(c => c.assignedExecutive === user.uid));
    });
    return () => unsub();
  }, [user]);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: '',
      products: [{ name: '', quantity: 1, unitPrice: 0 }],
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: 'products',
    control: form.control,
  });

  // Watch products to calculate total
  const watchedProducts = form.watch('products');
  const totalAmount = watchedProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.unitPrice || 0)), 0);

  const onSubmit = async (data: OrderFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const customer = customers.find(c => c.id === data.customerId);
      const orderId = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Calculate totals for each product
      const productsWithTotal = data.products.map(p => ({
        ...p,
        total: p.quantity * p.unitPrice
      }));

      await createDocument(COLLECTIONS.ORDERS, {
        orderId,
        customerId: data.customerId,
        customerName: customer?.shopName || 'Unknown',
        salesExecutiveId: user.uid,
        salesExecutiveName: user.name,
        products: productsWithTotal,
        totalAmount,
        paymentStatus: data.paymentStatus,
        deliveryStatus: data.deliveryStatus,
      });

      toast.success('Order created successfully');
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { formState: { errors } } = form;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
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
      
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <Label>Products</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => append({ name: '', quantity: 1, unitPrice: 0 })}
            className="h-8 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        
        {fields.map((field, index) => (
          <div key={field.id} className="p-3 bg-muted/30 rounded-xl space-y-3 relative">
            {index > 0 && (
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => remove(index)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            <div className="space-y-1">
              <Input 
                placeholder="Product Name" 
                {...form.register(`products.${index}.name`)} 
                className="h-9"
              />
              {errors.products?.[index]?.name && <p className="text-[10px] text-destructive">{errors.products[index]?.name?.message}</p>}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input 
                  type="number" 
                  placeholder="Qty" 
                  {...form.register(`products.${index}.quantity`, { valueAsNumber: true })} 
                  className="h-9"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="Price" 
                  {...form.register(`products.${index}.unitPrice`, { valueAsNumber: true })} 
                  className="h-9"
                />
              </div>
            </div>
          </div>
        ))}
        {errors.products && <p className="text-sm text-destructive">{errors.products.message}</p>}
      </div>

      <div className="flex justify-between items-center py-2 border-y border-border/50">
        <span className="font-medium">Total Amount:</span>
        <span className="text-xl font-bold text-primary">${totalAmount.toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Payment</Label>
          <Select 
            onValueChange={(val: any) => form.setValue('paymentStatus', val)}
            defaultValue={form.getValues('paymentStatus')}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Delivery</Label>
          <Select 
            onValueChange={(val: any) => form.setValue('deliveryStatus', val)}
            defaultValue={form.getValues('deliveryStatus')}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full rounded-xl h-12 animated-gradient text-white mt-4"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Create Order
      </Button>
    </form>
  );
}
