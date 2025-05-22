import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTransaction, updateTransaction } from '@/lib/api';
import { Transaction, Category } from '@/types/database.types';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const transactionSchema = z.object({
  date: z.string().min(1, { message: 'التاريخ مطلوب' }),
  description: z.string().min(1, { message: 'الوصف مطلوب' }),
  amount: z.string().min(1, { message: 'المبلغ مطلوب' })
    .refine(val => !isNaN(Number(val)), { message: 'يجب أن يكون المبلغ رقمًا' })
    .refine(val => Number(val) > 0, { message: 'يجب أن يكون المبلغ أكبر من صفر' }),
  type: z.enum(['income', 'expense'], { required_error: 'النوع مطلوب' }),
  category: z.string().min(1, { message: 'التصنيف مطلوب' }),
  status: z.enum(['pending', 'completed', 'cancelled'], { required_error: 'الحالة مطلوبة' }),
  payment_method: z.string().optional(),
  reference: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction;
  categories: Category[];
}

export function TransactionForm({ isOpen, onClose, onSuccess, transaction, categories }: TransactionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const defaultValues: TransactionFormValues = {
    date: transaction?.date || new Date().toISOString().split('T')[0],
    description: transaction?.description || '',
    amount: transaction?.amount ? Math.abs(transaction.amount).toString() : '',
    type: transaction?.type || 'income',
    category: transaction?.category || '',
    status: transaction?.status || 'completed',
    payment_method: transaction?.payment_method || '',
    reference: transaction?.reference || '',
  };

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      setIsSubmitting(true);
      
      // تحويل المبلغ إلى رقم
      const amount = Number(data.amount) * (data.type === 'expense' ? -1 : 1);
      
      const transactionData = {
        ...data,
        amount,
        user_id: transaction?.user_id || 'system'
      };
      
      if (transaction?.id) {
        // تحديث معاملة موجودة
        await updateTransaction(transaction.id, transactionData);
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث المعاملة بنجاح',
        });
      } else {
        // إنشاء معاملة جديدة
        await createTransaction(transactionData);
        toast({
          title: 'تمت الإضافة',
          description: 'تم إضافة المعاملة بنجاح',
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ المعاملة',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const currentType = form.watch('type');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{transaction ? 'تعديل معاملة' : 'إضافة معاملة جديدة'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">التاريخ</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="bg-white border border-gray-300" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">النوع</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white border border-gray-300">
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">دخل</SelectItem>
                        <SelectItem value="expense">مصروف</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">الوصف</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white border border-gray-300" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">المبلغ</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} className="bg-white border border-gray-300" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">التصنيف</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white border border-gray-300">
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {currentType === 'income' ? (
                          incomeCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          expenseCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">الحالة</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white border border-gray-300">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="pending">معلق</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">طريقة الدفع</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white border border-gray-300" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">المرجع</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white border border-gray-300" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  className="w-full sm:w-auto border-gray-300 hover:bg-gray-50"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 h-auto"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </div>
                  ) : (
                    <span>{transaction ? 'تحديث المعاملة' : 'إضافة المعاملة'}</span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 