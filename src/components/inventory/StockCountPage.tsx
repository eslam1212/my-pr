import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, StorageLocation, InventoryAdjustmentType, UserProfile } from '../../types';
import { productService } from '../../services/product.service';
import { storageLocationService } from '../../services/storageLocationService';
import { stockAdjustmentService } from '../../services/stockAdjustmentService';
import { authService } from '../../services/authService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/use-toast';
import { PageWrapper } from '../layout/PageWrapper';
import { PlusCircle, Trash2, PackageSearch, CheckSquare, Loader2, Info } from 'lucide-react';

const countItemSchema = z.object({
  product_id: z.string().min(1, "يجب اختيار المنتج"),
  product_name: z.string().optional(), // For display
  is_serial_tracked: z.boolean().optional(), // For context
  expected_quantity: z.number().optional(), // Fetched from backend
  counted_quantity: z.number().min(0, "الكمية المعدودة يجب أن تكون صفرًا أو أكثر"),
  adjustment_type: z.string().min(1, "يجب اختيار نوع التسوية"), // Using string for flexibility with enum-like type
  notes: z.string().optional(),
});

const stockCountFormSchema = z.object({
  location_id: z.string().min(1, "يجب اختيار موقع الجرد"),
  items: z.array(countItemSchema).min(1, "يجب إضافة منتج واحد على الأقل للجرد"),
});

type CountItemFormData = z.infer<typeof countItemSchema>;
type StockCountFormData = z.infer<typeof stockCountFormSchema>;

const adjustmentTypes: { value: InventoryAdjustmentType | string; label: string }[] = [
  { value: 'cycle_count', label: 'جرد دوري' },
  { value: 'physical_count', label: 'جرد فعلي شامل' },
  { value: 'initial_stock', label: 'رصيد افتتاحي' },
  { value: 'damage', label: 'تلف' },
  { value: 'theft', label: 'سرقة' },
  { value: 'correction_increase', label: 'تسوية زيادة' },
  { value: 'correction_decrease', label: 'تسوية نقص' },
  { value: 'other', label: 'أخرى' },
];

export const StockCountPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [currentUser, setCurrentUser] = useState<Pick<UserProfile, 'id'> | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For initial data load
  const [isSubmittingItem, setIsSubmittingItem] = useState<Record<number, boolean>>({}); // For individual item submission
  const [isFetchingExpected, setIsFetchingExpected] = useState<Record<number, boolean>>({});


  const { toast } = useToast();
  const { control, register, handleSubmit, formState: { errors }, reset, watch, setValue, getValues } =
    useForm<StockCountFormData>({
      resolver: zodResolver(stockCountFormSchema),
      defaultValues: { items: [] },
    });

  const { fields, append, remove, update } = useFieldArray({ control, name: "items" });
  const selectedLocationId = watch('location_id');

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [prods, locs, user] = await Promise.all([
          productService.getAll(),
          storageLocationService.getAll(),
          authService.getCurrentUser()
        ]);
        setProducts(prods);
        setLocations(locs);
        if (user) setCurrentUser({ id: user.id });

        const defaultLocation = locs.find(l => l.is_default);
        if (defaultLocation && !getValues('location_id')) {
          setValue('location_id', defaultLocation.id);
        }

        // Add one empty item by default if no items exist
        if (getValues('items').length === 0) {
            append({ product_id: '', counted_quantity: 0, adjustment_type: 'cycle_count', expected_quantity: 0 });
        }

      } catch (error) {
        toast({ title: "خطأ", description: "فشل تحميل البيانات الأولية.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [append, setValue, toast, getValues]);

  const fetchExpectedQuantity = useCallback(async (itemIndex: number, productId: string, locationId: string) => {
    if (!productId || !locationId) {
      setValue(`items.${itemIndex}.expected_quantity`, 0);
      return;
    }
    setIsFetchingExpected(prev => ({ ...prev, [itemIndex]: true }));
    try {
      const qty = await stockAdjustmentService.getExpectedStock(parseInt(productId), locationId);
      setValue(`items.${itemIndex}.expected_quantity`, qty);
    } catch (error: any) {
      toast({ title: "خطأ", description: `فشل جلب الكمية المتوقعة: ${error.message}`, variant: "destructive" });
      setValue(`items.${itemIndex}.expected_quantity`, 0); // Default on error
    } finally {
      setIsFetchingExpected(prev => ({ ...prev, [itemIndex]: false }));
    }
  }, [setValue, toast]);

  const handleProductChange = (itemIndex: number, productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      setValue(`items.${itemIndex}.product_name`, product.name);
      setValue(`items.${itemIndex}.is_serial_tracked`, product.is_serial_tracked ?? false);
      if (selectedLocationId) {
        fetchExpectedQuantity(itemIndex, productId, selectedLocationId);
      }
    }
  };

  useEffect(() => {
    // When location changes, re-fetch expected quantities for all items
    if (selectedLocationId) {
      fields.forEach((field, index) => {
        const currentItemProductId = getValues(`items.${index}.product_id`);
        if (currentItemProductId) {
          fetchExpectedQuantity(index, currentItemProductId, selectedLocationId);
        }
      });
    }
  }, [selectedLocationId, fields, fetchExpectedQuantity, getValues]);


  const handleRecordItem = async (itemIndex: number) => {
    const itemData = getValues(`items.${itemIndex}`);
    const locationId = getValues('location_id');

    if (!locationId) {
        toast({ title: "خطأ", description: "يرجى اختيار موقع الجرد أولاً.", variant: "destructive" });
        return;
    }
    if (!itemData.product_id) {
        toast({ title: "خطأ", description: `يرجى اختيار منتج للبند #${itemIndex + 1}.`, variant: "destructive" });
        return;
    }
     if (itemData.is_serial_tracked) {
        toast({ title: "تنبيه", description: `المنتج ${itemData.product_name} يتم تتبعه بالرقم التسلسلي. تسوية هذا المنتج تتطلب إجراءً خاصًا (غير مدعوم بالكامل حاليًا في هذا النموذج).`, variant: "warning" });
        // For now, we might allow recording it, but processing would be manual or a simplified log.
    }

    setIsSubmittingItem(prev => ({ ...prev, [itemIndex]: true }));
    try {
      const payload = {
        location_id: locationId,
        product_id: parseInt(itemData.product_id),
        counted_quantity: itemData.counted_quantity,
        expected_quantity: itemData.expected_quantity ?? 0, // Ensure it's a number
        adjustment_type: itemData.adjustment_type,
        notes: itemData.notes,
        counted_at: new Date().toISOString(),
        user_id: currentUser?.id || null,
      };
      await stockAdjustmentService.recordInventoryAdjustment(payload);
      toast({ title: "نجاح", description: `تم حفظ جرد البند: ${itemData.product_name}.` });
      // Optionally remove item from list or mark as saved
      // remove(itemIndex); // Or disable fields, show a success status for the row
    } catch (error: any) {
      toast({ title: "خطأ", description: `فشل حفظ جرد البند ${itemData.product_name}: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmittingItem(prev => ({ ...prev, [itemIndex]: false }));
    }
  };

  // Overall form submission (e.g. if we want to save all items at once - not current design)
  // const onOverallSubmit = async (data: StockCountFormData) => { ... }


  if (isLoading && products.length === 0 && locations.length === 0) {
    return <PageWrapper><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />جاري تحميل البيانات...</div></PageWrapper>;
  }

  return (
    <PageWrapper className="p-4 md:p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">إدخال جرد / تسوية مخزون</h1>
      </div>

      <form className="space-y-6"> {/* Removed main form submit for item-by-item saving */}
        <div className="p-4 bg-white shadow rounded-lg">
          <Label htmlFor="location_id_count" className="block text-lg font-medium text-gray-700 mb-2">موقع الجرد</Label>
          <Controller
            name="location_id"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedLocationId(value); // Trigger re-fetch of expected quantities
                }}
              >
                <SelectTrigger id="location_id_count" className="w-full md:w-1/2">
                  <SelectValue placeholder="اختر موقعًا..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          {errors.location_id && <p className="mt-1 text-sm text-red-500">{errors.location_id.message}</p>}
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="p-4 bg-white shadow rounded-lg space-y-3 border border-gray-200">
            <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold text-gray-700">البند #{index + 1}</h3>
                {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2 md:col-span-1">
                <Label htmlFor={`items.${index}.product_id`}>المنتج</Label>
                <Controller
                  name={`items.${index}.product_id`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <Select
                      value={controllerField.value}
                      onValueChange={(value) => {
                        controllerField.onChange(value);
                        handleProductChange(index, value);
                      }}
                    >
                      <SelectTrigger id={`items.${index}.product_id`} className="w-full mt-1">
                        <SelectValue placeholder="اختر منتجًا..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.sku})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.items?.[index]?.product_id && <p className="text-xs text-red-500 mt-1">{errors.items[index]?.product_id?.message}</p>}
              </div>
              <div>
                <Label htmlFor={`items.${index}.expected_quantity`}>الكمية المتوقعة</Label>
                <div className="relative">
                    <Input
                        id={`items.${index}.expected_quantity`}
                        type="number"
                        readOnly
                        value={watch(`items.${index}.expected_quantity`) ?? '...'}
                        className="w-full mt-1 bg-gray-100"
                    />
                    {isFetchingExpected[index] && <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                </div>
              </div>
              <div>
                <Label htmlFor={`items.${index}.counted_quantity`}>الكمية المعدودة</Label>
                <Input
                  id={`items.${index}.counted_quantity`}
                  type="number"
                  min="0"
                  {...register(`items.${index}.counted_quantity`, { valueAsNumber: true })}
                  className="w-full mt-1"
                />
                {errors.items?.[index]?.counted_quantity && <p className="text-xs text-red-500 mt-1">{errors.items[index]?.counted_quantity?.message}</p>}
              </div>
            </div>

            {watch(`items.${index}.is_serial_tracked`) && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
                    <Info className="inline h-4 w-4 mr-1" /> هذا المنتج يتم تتبعه بالرقم التسلسلي. تسوية هذا البند ستسجل الفرق الإجمالي. المعالجة الدقيقة للأرقام التسلسلية المحددة (المفقودة/الزائدة) تتم في خطوة لاحقة.
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                 <div>
                    <Label htmlFor={`items.${index}.adjustment_type`}>نوع التسوية</Label>
                    <Controller
                        name={`items.${index}.adjustment_type`}
                        control={control}
                        defaultValue="cycle_count"
                        render={({ field: controllerField }) => (
                            <Select value={controllerField.value} onValueChange={controllerField.onChange}>
                                <SelectTrigger id={`items.${index}.adjustment_type`} className="w-full mt-1">
                                    <SelectValue placeholder="اختر نوع التسوية..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {adjustmentTypes.map(adjType => <SelectItem key={adjType.value} value={adjType.value}>{adjType.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.items?.[index]?.adjustment_type && <p className="text-xs text-red-500 mt-1">{errors.items[index]?.adjustment_type?.message}</p>}
                </div>
                <div className="flex items-end h-full">
                    <Button
                        type="button"
                        onClick={() => handleRecordItem(index)}
                        disabled={isSubmittingItem[index] || !watch(`items.${index}.product_id`)}
                        className="w-full sm:w-auto flex items-center gap-2"
                    >
                        {isSubmittingItem[index] ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                        حفظ هذا البند
                    </Button>
                </div>
            </div>
            <div>
                <Label htmlFor={`items.${index}.notes`}>ملاحظات على البند (اختياري)</Label>
                <Textarea id={`items.${index}.notes`} {...register(`items.${index}.notes`)} className="w-full mt-1" rows={1} />
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={() => append({ product_id: '', counted_quantity: 0, adjustment_type: 'cycle_count', expected_quantity: 0 })} className="mt-4 flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> إضافة بند جرد جديد
        </Button>

        {/* Overall form submission button - currently not used as items are saved individually */}
        {/* <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={isLoading || Object.values(isSubmittingItem).some(s => s)} size="lg">
            {isLoading ? 'جاري الحفظ...' : 'حفظ كل التعديلات'}
          </Button>
        </div> */}
      </form>
    </PageWrapper>
  );
};

export default StockCountPage;
