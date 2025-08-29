import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Supplier } from '../../types'; // Using the updated Supplier type with UUID
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog';
import { useToast } from '../ui/use-toast';

// Schema for supplier form validation
const supplierSchema = z.object({
  name: z.string().min(2, 'اسم المورد يجب أن يكون حرفين على الأقل.'),
  contact_person: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صالح.').optional().or(z.literal('')), // Allow empty string or valid email
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierData: SupplierFormData, id?: string) => Promise<void>; // id is optional (for create vs update)
  supplier: Partial<Supplier> | null; // Using Partial for initialData flexibility
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ isOpen, onClose, onSave, supplier }) => {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        reset({
          name: supplier.name || '',
          contact_person: supplier.contact_person || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
        });
      } else {
        reset({ name: '', contact_person: '', email: '', phone: '', address: '' });
      }
    }
  }, [isOpen, supplier, reset]);

  const handleFormSubmit = async (data: SupplierFormData) => {
    try {
      await onSave(data, supplier?.id); // Pass id if editing
      // onClose will be called by parent on successful save
    } catch (error: any) {
      toast({
        title: 'خطأ في الحفظ',
        description: error.message || 'فشل حفظ بيانات المورد.',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{supplier?.id ? 'تعديل مورد' : 'إضافة مورد جديد'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">اسم المورد</Label>
            <Input id="name" {...register('name')} className="mt-1" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="contact_person">الشخص المسؤول (اختياري)</Label>
            <Input id="contact_person" {...register('contact_person')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
            <Input id="email" type="email" {...register('email')} className="mt-1" dir="ltr" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="phone">الهاتف (اختياري)</Label>
            <Input id="phone" type="tel" {...register('phone')} className="mt-1" dir="ltr" />
          </div>
          <div>
            <Label htmlFor="address">العنوان (اختياري)</Label>
            <Textarea id="address" {...register('address')} className="mt-1" rows={3} />
          </div>
          <DialogFooter className="gap-2 sm:justify-start pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
