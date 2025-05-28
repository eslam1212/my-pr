import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, StorageLocation, SerialNumber } from '../../types';
import { productService } from '../../services/product.service';
import { storageLocationService } from '../../services/storageLocationService';
import { inventoryService } from '../../services/inventory.service'; // Assuming this is the corrected/intended service
import { serialNumberService } from '../../services/serialNumberService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'; // Assuming shadcn Select
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../ui/use-toast';
import { PageWrapper } from '../layout/PageWrapper';
import { ArrowLeftRight, Package, MapPin, Hash, Loader2 } from 'lucide-react';

const stockTransferItemSchema = z.object({
  product_id: z.string().min(1, "يجب اختيار المنتج"),
  product_name: z.string().optional(),
  is_serial_tracked: z.boolean().optional().default(false),
  quantity: z.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
  serials_to_transfer: z.array(z.string()).optional(), // For selected serial numbers strings
});

const stockTransferSchema = z.object({
  from_location_id: z.string().min(1, "يجب اختيار الموقع المصدر"),
  to_location_id: z.string().min(1, "يجب اختيار الموقع الهدف"),
  notes: z.string().optional(),
  items: z.array(stockTransferItemSchema).min(1, "يجب إضافة منتج واحد على الأقل للتحويل"),
}).refine(data => data.from_location_id !== data.to_location_id, {
  message: "الموقع المصدر والهدف لا يمكن أن يكونا متماثلين.",
  path: ["to_location_id"], // Path to field to display error against
});

type StockTransferItemFormData = z.infer<typeof stockTransferItemSchema>;
type StockTransferFormData = z.infer<typeof stockTransferSchema>;

export const StockTransferPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [availableSerialsForSelection, setAvailableSerialsForSelection] = useState<SerialNumber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSerials, setIsLoadingSerials] = useState(false);
  const [selectedItemIndexForSerials, setSelectedItemIndexForSerials] = useState<number | null>(null);
  
  const { toast } = useToast();
  const { control, register, handleSubmit, formState: { errors }, reset, watch, setValue, getValues } = useForm<StockTransferFormData>({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: { items: [{ product_id: '', quantity: 1, is_serial_tracked: false, serials_to_transfer: [] }] },
  });

  const { fields, append, remove, update } = useFieldArray({ control, name: "items" });
  const watchedItems = watch('items');
  const fromLocationId = watch('from_location_id');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        setProducts(await productService.getAll());
        setStorageLocations(await storageLocationService.getAll());
      } catch (error) {
        toast({ title: "خطأ", description: "فشل في تحميل البيانات الأولية.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleProductChange = async (itemIndex: number, productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      setValue(`items.${itemIndex}.is_serial_tracked`, product.is_serial_tracked ?? false);
      setValue(`items.${itemIndex}.product_name`, product.name);
      setValue(`items.${itemIndex}.serials_to_transfer`, []); // Reset serials
      if (product.is_serial_tracked && fromLocationId) {
        await fetchSerialsForSelection(itemIndex, product.id, fromLocationId);
      } else {
        setAvailableSerialsForSelection([]); // Clear if not serial tracked or no source location
      }
    }
  };
  
  const fetchSerialsForSelection = async (itemIndex: number, productId: number, locationId: string) => {
    setSelectedItemIndexForSerials(itemIndex);
    setIsLoadingSerials(true);
    try {
      // Fetch 'in_stock' serials from the specific 'fromLocationId'
      const result = await inventoryService.getStockForProduct(productId, locationId);
      if (result.productDetails?.is_serial_tracked) {
        setAvailableSerialsForSelection(result.serials || []);
      } else {
         setAvailableSerialsForSelection([]);
      }
    } catch (error: any) {
      toast({ title: "خطأ", description: `فشل في تحميل الأرقام التسلسلية: ${error.message}`, variant: "destructive" });
      setAvailableSerialsForSelection([]);
    } finally {
      setIsLoadingSerials(false);
    }
  };
  
  const handleSourceLocationChange = async (locationId: string) => {
    setValue('from_location_id', locationId);
    // Re-fetch serials for all serial-tracked items if source location changes
    watchedItems.forEach(async (item, index) => {
      if (item.is_serial_tracked && item.product_id) {
        setValue(`items.${index}.serials_to_transfer`, []); // Reset selected serials
        await fetchSerialsForSelection(index, parseInt(item.product_id), locationId);
      }
    });
  };

  const handleSerialSelection = (itemIndex: number, serialValue: string) => {
    const currentSelected = getValues(`items.${itemIndex}.serials_to_transfer`) || [];
    const quantity = getValues(`items.${itemIndex}.quantity`);
    const newSelected = currentSelected.includes(serialValue)
      ? currentSelected.filter(s => s !== serialValue)
      : [...currentSelected, serialValue];

    if (newSelected.length > quantity) {
      toast({ title: "تنبيه", description: `لا يمكن اختيار أكثر من ${quantity} رقم تسلسلي.`, variant: "warning" });
      return; // Don't update
    }
    setValue(`items.${itemIndex}.serials_to_transfer`, newSelected);
  };

  const onSubmit = async (data: StockTransferFormData) => {
    setIsLoading(true);
    try {
      for (const item of data.items) {
        const product = products.find(p => p.id.toString() === item.product_id);
        if (product?.is_serial_tracked) {
          if (!item.serials_to_transfer || item.serials_to_transfer.length !== item.quantity) {
            toast({title: "خطأ", description: `المنتج ${product.name} يتطلب اختيار ${item.quantity} رقم تسلسلي للتحويل.`, variant: "destructive"});
            setIsLoading(false);
            return;
          }
        }
      }
      // Conceptual call to inventoryService.transferStock
      // This service method needs to be implemented based on the conceptual logic discussed earlier.
      // await inventoryService.transferStock(
      //   parseInt(item.product_id), 
      //   data.from_location_id, 
      //   data.to_location_id, 
      //   item.quantity, 
      //   item.serials_to_transfer
      // );
      // This would be a loop for multiple items if the service handles one product at a time.
      // For now, we simulate for the first item if multiple items are not supported by a single service call.
      
      // Simulate the transfer for each item
      for (const item of data.items) {
         console.log('Simulating transfer for item:', item.product_name, item.quantity, 'from', data.from_location_id, 'to', data.to_location_id, 'serials:', item.serials_to_transfer);
         // In a real scenario, call:
         // await inventoryService.transferStock(
         //   parseInt(item.product_id),
         //   data.from_location_id, // fromLocationId (can be null if coming from unlocated)
         //   data.to_location_id,   // toLocationId (must be a valid location ID)
         //   item.quantity,
         //   item.serials_to_transfer
         // );
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
      toast({ title: "نجاح", description: "تم تسجيل طلب تحويل المخزون (محاكاة)." });
      reset();
      setAvailableSerialsForSelection([]);
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في عملية تحويل المخزون.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper className="p-4 md:p-6" dir="rtl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        <ArrowLeftRight className="h-6 w-6 ml-2 text-indigo-600" /> تحويل مخزون
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 shadow rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="from_location_id">من موقع</Label>
            <Controller
              name="from_location_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(value) => handleSourceLocationChange(value)} defaultValue={field.value}>
                  <SelectTrigger id="from_location_id" className="w-full mt-1">
                    <SelectValue placeholder="اختر الموقع المصدر" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.from_location_id && <p className="mt-1 text-sm text-red-500">{errors.from_location_id.message}</p>}
          </div>
          <div>
            <Label htmlFor="to_location_id">إلى موقع</Label>
             <Controller
              name="to_location_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="to_location_id" className="w-full mt-1">
                    <SelectValue placeholder="اختر الموقع الهدف" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.to_location_id && <p className="mt-1 text-sm text-red-500">{errors.to_location_id.message}</p>}
          </div>
        </div>
        
        <div>
          <Label htmlFor="notes">ملاحظات (اختياري)</Label>
          <Textarea id="notes" {...register('notes')} className="w-full mt-1" rows={2} />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold text-gray-700">المنتجات المراد تحويلها</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-gray-50/70">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-medium text-gray-600">بند #{index + 1}</h4>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="sm:col-span-2">
                  <Label>المنتج</Label>
                  <Controller
                    name={`items.${index}.product_id`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Select 
                        onValueChange={(value) => {
                          controllerField.onChange(value);
                          handleProductChange(index, value);
                        }} 
                        defaultValue={controllerField.value}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="اختر منتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.sku})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.items?.[index]?.product_id && <p className="mt-1 text-xs text-red-500">{errors.items?.[index]?.product_id?.message}</p>}
                </div>
                <div>
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    min="1"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true, 
                        onChange: (e) => {
                            const newQuantity = parseInt(e.target.value) || 0;
                            setValue(`items.${index}.quantity`, newQuantity);
                            setValue(`items.${index}.serials_to_transfer`, []); // Reset serials if quantity changes
                            if (watchedItems[index]?.is_serial_tracked && watchedItems[index]?.product_id && fromLocationId) {
                               fetchSerialsForSelection(index, parseInt(watchedItems[index]!.product_id), fromLocationId);
                            }
                        }
                    })}
                    className="w-full mt-1"
                  />
                  {errors.items?.[index]?.quantity && <p className="mt-1 text-xs text-red-500">{errors.items?.[index]?.quantity?.message}</p>}
                </div>
              </div>

              {watchedItems[index]?.is_serial_tracked && fromLocationId && (
                <div className="mt-3">
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    اختر الأرقام التسلسلية للتحويل (مطلوب: {watchedItems[index]?.quantity || 0})
                  </Label>
                  {isLoadingSerials && selectedItemIndexForSerials === index && <div className="flex items-center"><Loader2 className="h-4 w-4 animate-spin mr-2" />جاري تحميل الأرقام...</div>}
                  {!isLoadingSerials && availableSerialsForSelection.length === 0 && selectedItemIndexForSerials === index && <p className="text-xs text-gray-500">لا توجد أرقام تسلسلية متاحة لهذا المنتج في الموقع المصدر المحدد.</p>}
                  {!isLoadingSerials && availableSerialsForSelection.length > 0 && selectedItemIndexForSerials === index && (
                    <ScrollArea className="h-32 border rounded-md p-2 mt-1">
                      {availableSerialsForSelection.map(serial => (
                        <div key={serial.id} className="flex items-center space-x-2 space-x-reverse p-1">
                          <Checkbox
                            id={`serial-${index}-${serial.id}`}
                            checked={(watchedItems[index]?.serials_to_transfer || []).includes(serial.serial_number)}
                            onCheckedChange={() => handleSerialSelection(index, serial.serial_number)}
                          />
                          <Label htmlFor={`serial-${index}-${serial.id}`} className="font-mono text-xs cursor-pointer">{serial.serial_number}</Label>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                  {(watchedItems[index]?.serials_to_transfer?.length || 0) !== watchedItems[index]?.quantity && watchedItems[index]?.quantity > 0 && (
                     <p className="mt-1 text-xs text-yellow-600">عدد الأرقام التسلسلية المختارة لا يطابق الكمية المطلوبة.</p>
                  )}
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ product_id: '', quantity: 1, is_serial_tracked: false, serials_to_transfer: [] })}
            className="mt-2 text-sm flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" /> إضافة بند تحويل آخر
          </Button>
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={isLoading} size="lg" className="flex items-center gap-2">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowLeftRight className="h-5 w-5" />}
            {isLoading ? 'جاري التحويل...' : 'تنفيذ التحويل'}
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
};

export default StockTransferPage;
