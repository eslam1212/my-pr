import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, Supplier, StorageLocation, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '../../types';
import { productService } from '../../services/product.service';
import { supplierService } from '../../services/supplier.service';
import { storageLocationService } from '../../services/storageLocationService';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/use-toast';
import { PageWrapper } from '../layout/PageWrapper';
import { PlusCircle, Trash2, ShoppingBag, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';

const poItemSchema = z.object({
  product_id: z.string().min(1, "يجب اختيار المنتج"),
  product_name: z.string().optional(), // For display
  is_serial_tracked: z.boolean().optional().default(false),
  quantity: z.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
  unit_price: z.number().min(0, "سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر"),
  // serial_numbers_to_receive: z.array(z.string()).optional(), // Not needed at PO creation, but at receipt
});

const purchaseOrderFormSchema = z.object({
  supplier_id: z.string().min(1, "يجب اختيار المورد"), // Made mandatory for simplicity, can add "new supplier" flow later
  order_date: z.string().min(1, "تاريخ الطلب مطلوب"),
  expected_delivery_date: z.string().optional().nullable(),
  location_id: z.string().min(1, "موقع الاستلام مطلوب"), // Destination for goods
  shipping_address: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(poItemSchema).min(1, "يجب إضافة منتج واحد على الأقل"),
});

type POItemFormData = z.infer<typeof poItemSchema>;
type PurchaseOrderFormData = z.infer<typeof purchaseOrderFormSchema>;

export const PurchaseOrderForm: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For data loading and submission

  const { toast } = useToast();
  const navigate = useNavigate();
  const { control, register, handleSubmit, formState: { errors }, reset, watch, setValue, getValues } =
    useForm<PurchaseOrderFormData>({
      resolver: zodResolver(purchaseOrderFormSchema),
      defaultValues: {
        order_date: new Date().toISOString().split('T')[0],
        items: [{ product_id: '', quantity: 1, unit_price: 0, is_serial_tracked: false }]
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch('items');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prods, sups, locs] = await Promise.all([
          productService.getAll(),
          supplierService.getAll(),
          storageLocationService.getAll(),
        ]);
        setProducts(prods);
        setSuppliers(sups);
        setStorageLocations(locs);
        const defaultLocation = locs.find(l => l.is_default);
        if (defaultLocation && !getValues('location_id')) {
          setValue('location_id', defaultLocation.id);
        }
      } catch (error) {
        toast({ title: "خطأ", description: "فشل في تحميل البيانات الأولية للنموذج.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast, setValue, getValues]);

  const handleProductChange = (itemIndex: number, productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      setValue(`items.${itemIndex}.unit_price`, product.cost ?? 0); // Default to product cost
      setValue(`items.${itemIndex}.is_serial_tracked`, product.is_serial_tracked ?? false);
      setValue(`items.${itemIndex}.product_name`, product.name);
    }
  };

  const calculateTotalAmount = useCallback(() => {
    let total = 0;
    watchedItems?.forEach(item => {
      total += (item.quantity || 0) * (item.unit_price || 0);
    });
    return total;
  }, [watchedItems]);


  const onSubmit = async (data: PurchaseOrderFormData) => {
    setIsLoading(true);
    try {
      const poInputData = {
        supplier_id: data.supplier_id,
        order_date: data.order_date,
        expected_delivery_date: data.expected_delivery_date || null,
        // location_id: data.location_id, // This is for the goods receipt, not PO header directly
        shipping_address: data.shipping_address || null,
        notes: data.notes || null,
        items: data.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: item.quantity,
          unit_price: item.unit_price,
          description: item.product_name, // Using product_name as description
          // received_quantity is handled by backend or receipt process
        })),
      };

      // console.log("Submitting PO Data:", poInputData);
      const newPO = await purchaseOrderService.createPurchaseOrder(poInputData as any); // Cast if types slightly mismatch
      toast({ title: "نجاح", description: `تم إنشاء أمر الشراء رقم ${newPO.po_number} بنجاح.` });
      navigate('/purchases'); // Navigate to PO list page
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في إنشاء أمر الشراء.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper className="p-4 md:p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <ShoppingBag className="h-7 w-7 ml-2 text-indigo-600" /> إنشاء أمر شراء جديد
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 shadow rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="supplier_id">المورد</Label>
            <Controller
              name="supplier_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="supplier_id" className="w-full mt-1">
                    <SelectValue placeholder="اختر المورد..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.supplier_id && <p className="text-xs text-red-500 mt-1">{errors.supplier_id.message}</p>}
          </div>
          <div>
            <Label htmlFor="location_id">موقع الاستلام (الوجهة)</Label>
            <Controller
              name="location_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="location_id" className="w-full mt-1">
                    <SelectValue placeholder="اختر موقع الاستلام..." />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.location_id && <p className="text-xs text-red-500 mt-1">{errors.location_id.message}</p>}
          </div>
          <div>
            <Label htmlFor="order_date">تاريخ الطلب</Label>
            <Input id="order_date" type="date" {...register('order_date')} className="w-full mt-1" />
            {errors.order_date && <p className="text-xs text-red-500 mt-1">{errors.order_date.message}</p>}
          </div>
          <div>
            <Label htmlFor="expected_delivery_date">تاريخ التسليم المتوقع (اختياري)</Label>
            <Input id="expected_delivery_date" type="date" {...register('expected_delivery_date')} className="w-full mt-1" />
          </div>
        </div>

        <div>
          <Label htmlFor="shipping_address">عنوان الشحن (اختياري)</Label>
          <Textarea id="shipping_address" {...register('shipping_address')} className="w-full mt-1" rows={2} />
        </div>
        <div>
          <Label htmlFor="notes">ملاحظات (اختياري)</Label>
          <Textarea id="notes" {...register('notes')} className="w-full mt-1" rows={2} />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold text-gray-700">بنود أمر الشراء</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-gray-50/70 relative">
              <div className="flex justify-between items-start">
                <h4 className="text-md font-medium text-gray-600 pt-1">بند #{index + 1}</h4>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 absolute top-2 left-2">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-2">
                  <Label>المنتج</Label>
                  <Controller
                    name={`items.${index}.product_id`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Select onValueChange={(value) => { controllerField.onChange(value); handleProductChange(index, value); }} defaultValue={controllerField.value}>
                        <SelectTrigger className="w-full mt-1"><SelectValue placeholder="اختر منتج..." /></SelectTrigger>
                        <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                  {errors.items?.[index]?.product_id && <p className="text-xs text-red-500 mt-1">{errors.items?.[index]?.product_id?.message}</p>}
                </div>
                <div>
                  <Label>الكمية</Label>
                  <Input type="number" min="1" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-full mt-1" />
                  {errors.items?.[index]?.quantity && <p className="text-xs text-red-500 mt-1">{errors.items?.[index]?.quantity?.message}</p>}
                </div>
                <div>
                  <Label>سعر التكلفة للوحدة</Label>
                  <Input type="number" step="0.01" min="0" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} className="w-full mt-1" />
                  {errors.items?.[index]?.unit_price && <p className="text-xs text-red-500 mt-1">{errors.items?.[index]?.unit_price?.message}</p>}
                </div>
              </div>
              {/* Placeholder for serial number input during receipt, not PO creation */}
              {/* {watchedItems[index]?.is_serial_tracked && <p className="text-xs text-blue-500 mt-1">هذا المنتج يتطلب إدخال أرقام تسلسلية عند الاستلام.</p>} */}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => append({ product_id: '', quantity: 1, unit_price: 0, is_serial_tracked: false })} className="mt-2 text-sm flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> إضافة بند جديد
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t">
            <div className="flex justify-end items-center text-xl font-semibold text-gray-900">
                <span>الإجمالي :</span>
                <span className="mr-2">{formatCurrency(calculateTotalAmount())}</span>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={isLoading} size="lg" className="flex items-center gap-2">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {isLoading ? 'جاري الحفظ...' : 'حفظ أمر الشراء'}
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
};

export default PurchaseOrderForm;
