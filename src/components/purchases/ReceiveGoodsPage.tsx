import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PurchaseOrder, PurchaseOrderItem, StorageLocation, Product } from '../../types';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { storageLocationService } from '../../services/storageLocationService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/use-toast';
import { PageWrapper } from '../layout/PageWrapper';
import { ArrowRight, CheckSquare, Truck, Package, MapPin, Loader2 } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/format';

const receivedItemSchema = z.object({
  po_item_id: z.string(), // UUID of PurchaseOrderItem
  product_id: z.number(), // BIGINT of Product
  product_name: z.string(),
  is_serial_tracked: z.boolean(),
  ordered_quantity: z.number(),
  already_received_quantity: z.number(),
  quantity_received_now: z.number().min(0, "الكمية المستلمة لا يمكن أن تكون سالبة").max(z.number(), "الكمية المستلمة تتجاوز المتبقي"), // Max validation will be dynamic
  serials_input: z.string().optional(), // For textarea input of serials
  serial_numbers_to_receive: z.array(z.string()).optional(),
});

const receiveGoodsFormSchema = z.object({
  purchase_order_id: z.string(),
  location_id: z.string().min(1, "يجب اختيار موقع الاستلام"),
  receipt_date: z.string().min(1, "تاريخ الاستلام مطلوب"), // Can default to today
  notes: z.string().optional(),
  items: z.array(receivedItemSchema),
});

type ReceivedItemFormData = z.infer<typeof receivedItemSchema>;
type ReceiveGoodsFormData = z.infer<typeof receiveGoodsFormSchema>;

export const ReceiveGoodsPage: React.FC = () => {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, register, handleSubmit, formState: { errors }, reset, watch, setValue, getValues } =
    useForm<ReceiveGoodsFormData>({
      resolver: zodResolver(receiveGoodsFormSchema),
      defaultValues: {
        purchase_order_id: purchaseOrderId,
        receipt_date: new Date().toISOString().split('T')[0],
        items: []
      },
    });

  const { fields, replace } = useFieldArray({ control, name: "items" });

  const loadPurchaseOrder = useCallback(async () => {
    if (!purchaseOrderId) {
      toast({ title: "خطأ", description: "معرف أمر الشراء غير متوفر.", variant: "destructive" });
      navigate("/purchases");
      return;
    }
    setIsLoading(true);
    try {
      const poData = await purchaseOrderService.getPurchaseOrderById(purchaseOrderId);
      setPurchaseOrder(poData);

      const itemsToReceive = poData.items
        ?.filter(item => (item.received_quantity || 0) < item.quantity) // Only items that need receiving
        .map(item => ({
          po_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product?.name || `منتج ID ${item.product_id}`,
          is_serial_tracked: item.product?.is_serial_tracked ?? false,
          ordered_quantity: item.quantity,
          already_received_quantity: item.received_quantity || 0,
          quantity_received_now: 0, // Default to 0
          serials_input: '',
          serial_numbers_to_receive: [],
        })) || [];

      replace(itemsToReceive); // Use replace to set the items array in react-hook-form

      const locs = await storageLocationService.getAll();
      setStorageLocations(locs);
      const defaultLocation = locs.find(l => l.is_default) || (locs.length > 0 ? locs[0] : null);
      if (defaultLocation) {
        setValue('location_id', defaultLocation.id);
      }
      setValue('purchase_order_id', purchaseOrderId);

    } catch (error: any) {
      toast({ title: "خطأ", description: `فشل في تحميل أمر الشراء: ${error.message}`, variant: "destructive" });
      navigate("/purchases");
    } finally {
      setIsLoading(false);
    }
  }, [purchaseOrderId, navigate, toast, replace, setValue]);

  useEffect(() => {
    loadPurchaseOrder();
  }, [loadPurchaseOrder]);

  const validateAndParseItemSerials = (itemIndex: number): boolean => {
    const item = getValues(`items.${itemIndex}`);
    if (!item.is_serial_tracked || item.quantity_received_now === 0) {
      setValue(`items.${itemIndex}.serial_numbers_to_receive`, []);
      return true;
    }
    const serialsRaw = item.serials_input || '';
    const parsedSerials = serialsRaw.split(/[\n\s,]+/).map(s => s.trim()).filter(s => s);

    if (parsedSerials.length !== item.quantity_received_now) {
      toast({
        title: "خطأ في الإدخال",
        description: `المنتج ${item.product_name} يتطلب ${item.quantity_received_now} رقم تسلسلي للكمية المستلمة. تم إدخال ${parsedSerials.length}.`,
        variant: "warning"
      });
      setValue(`items.${itemIndex}.serial_numbers_to_receive`, []);
      return false;
    }
    const uniqueSerials = new Set(parsedSerials);
    if (uniqueSerials.size !== parsedSerials.length) {
        toast({ title: "خطأ", description: `الأرقام التسلسلية للمنتج ${item.product_name} يجب أن تكون فريدة.`, variant: "destructive"});
        setValue(`items.${itemIndex}.serial_numbers_to_receive`, []);
        return false;
    }
    setValue(`items.${itemIndex}.serial_numbers_to_receive`, parsedSerials);
    return true;
  };

  const onSubmit = async (data: ReceiveGoodsFormData) => {
    setIsSubmitting(true);
    let allItemsValid = true;
    for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const maxReceivable = item.ordered_quantity - item.already_received_quantity;
        if (item.quantity_received_now > maxReceivable) {
            toast({ title: "خطأ", description: `لا يمكن استلام كمية أكبر من المتبقي للمنتج ${item.product_name}. المتبقي: ${maxReceivable}`, variant: "destructive"});
            allItemsValid = false;
            break;
        }
        if (item.is_serial_tracked && item.quantity_received_now > 0) {
            if (!validateAndParseItemSerials(i)) {
                allItemsValid = false;
                break;
            }
        }
    }
    if (!allItemsValid) {
        setIsSubmitting(false);
        return;
    }

    const receivedItemsPayload = data.items
      .filter(item => item.quantity_received_now > 0)
      .map(item => ({
        po_item_id: item.po_item_id,
        quantity_received: item.quantity_received_now,
        location_id: data.location_id, // Apply chosen location to all items in this receipt
        serial_numbers: item.is_serial_tracked ? item.serial_numbers_to_receive : undefined,
      }));

    if (receivedItemsPayload.length === 0) {
      toast({ title: "لا تغييرات", description: "لم يتم إدخال كميات مستلمة.", variant: "info" });
      setIsSubmitting(false);
      return;
    }

    try {
      await purchaseOrderService.receiveGoods(data.purchase_order_id, receivedItemsPayload);
      toast({ title: "نجاح", description: "تم تسجيل استلام البضائع بنجاح." });
      navigate(`/purchases/${data.purchase_order_id}`); // Navigate to PO details page
    } catch (error: any) {
      toast({ title: "خطأ", description: `فشل في تسجيل استلام البضائع: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedItems = watch('items'); // For dynamic rendering of serials input

  if (isLoading || !purchaseOrder) {
    return <PageWrapper><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />جاري تحميل بيانات أمر الشراء...</div></PageWrapper>;
  }
  if (fields.length === 0 && !isLoading) {
    return (
      <PageWrapper className="p-4 md:p-6" dir="rtl">
         <h1 className="text-xl font-semibold text-gray-800 mb-4">استلام بضائع لأمر الشراء: {purchaseOrder.po_number}</h1>
         <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
                <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                <p className="text-sm text-yellow-700">
                    جميع بنود أمر الشراء هذا قد تم استلامها بالكامل.
                </p>
                </div>
            </div>
        </div>
        <Button onClick={() => navigate(`/purchases/${purchaseOrderId}`)} variant="outline" className="mt-4">العودة لتفاصيل أمر الشراء</Button>
      </PageWrapper>
    );
  }


  return (
    <PageWrapper className="p-4 md:p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <Truck className="h-7 w-7 ml-2 text-indigo-600" /> استلام بضائع لأمر الشراء: {purchaseOrder.po_number}
        </h1>
        <Button onClick={() => loadPurchaseOrder()} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ml-1 ${isLoading ? 'animate-spin': ''}`} /> تحديث
        </Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 shadow rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="receipt_location_id">موقع الاستلام</Label>
            <Controller
              name="location_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="receipt_location_id" className="w-full mt-1">
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
            <Label htmlFor="receipt_date">تاريخ الاستلام</Label>
            <Input id="receipt_date" type="date" {...register('receipt_date')} className="w-full mt-1" />
            {errors.receipt_date && <p className="text-xs text-red-500 mt-1">{errors.receipt_date.message}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="receipt_notes">ملاحظات الاستلام (اختياري)</Label>
          <Textarea id="receipt_notes" {...register('notes')} className="w-full mt-1" rows={2} />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold text-gray-700">البنود المستلمة</h3>
          {fields.map((field, index) => {
            const item = watchedItems[index]; // Get current item from watched array for dynamic properties
            const remainingToReceive = item.ordered_quantity - item.already_received_quantity;
            return (
            <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-gray-50/70">
              <h4 className="text-md font-medium text-gray-800">{item.product_name}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-start">
                <div><Label className="text-xs text-gray-500">الكمية المطلوبة:</Label> <span className="font-medium">{item.ordered_quantity}</span></div>
                <div><Label className="text-xs text-gray-500">تم استلامه سابقًا:</Label> <span className="font-medium">{item.already_received_quantity}</span></div>
                <div><Label className="text-xs text-gray-500">المتبقي للاستلام:</Label> <span className="font-medium text-blue-600">{remainingToReceive}</span></div>
              </div>
              <div>
                <Label htmlFor={`items.${index}.quantity_received_now`}>الكمية المستلمة الآن</Label>
                <Controller
                    name={`items.${index}.quantity_received_now`}
                    control={control}
                    defaultValue={0}
                    render={({ field: controllerField }) => (
                        <Input
                        id={`items.${index}.quantity_received_now`}
                        type="number"
                        min="0"
                        max={remainingToReceive}
                        value={controllerField.value}
                        onChange={(e) => {
                            let val = parseInt(e.target.value);
                            if (isNaN(val)) val = 0;
                            if (val > remainingToReceive) val = remainingToReceive;
                            if (val < 0) val = 0;
                            controllerField.onChange(val);
                            // If serial tracked, clear serials if quantity changes
                            if (item.is_serial_tracked) {
                                setValue(`items.${index}.serials_input`, '');
                                setValue(`items.${index}.serial_numbers_to_receive`, []);
                            }
                        }}
                        className="w-full md:w-1/2 mt-1"
                        />
                    )}
                />
                {errors.items?.[index]?.quantity_received_now && <p className="text-xs text-red-500 mt-1">{errors.items[index]?.quantity_received_now?.message}</p>}
              </div>

              {item.is_serial_tracked && watch(`items.${index}.quantity_received_now`) > 0 && (
                <div className="mt-2">
                  <Label htmlFor={`items.${index}.serials_input`}>
                    الأرقام التسلسلية المستلمة (مطلوب: {watch(`items.${index}.quantity_received_now`)})
                  </Label>
                  <Textarea
                    id={`items.${index}.serials_input`}
                    {...register(`items.${index}.serials_input`)}
                    onBlur={() => validateAndParseItemSerials(index)}
                    className="w-full mt-1 font-mono text-sm"
                    rows={Math.max(2, watch(`items.${index}.quantity_received_now`, 0) / 2)}
                    placeholder={`أدخل ${watch(`items.${index}.quantity_received_now`, 0)} رقم تسلسلي...`}
                  />
                  {/* Optional: Display count of entered serials for immediate feedback */}
                </div>
              )}
            </div>
          )})}
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={isSubmitting || isLoading} size="lg" className="flex items-center gap-2">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckSquare className="h-5 w-5" />}
            {isSubmitting ? 'جاري الحفظ...' : 'تأكيد استلام البضائع'}
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
};

export default ReceiveGoodsPage;
