import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { purchaseService } from '../../services/purchase.service';
import { productService } from '../../services/product.service';
import { supplierService } from '../../services/supplier.service';
import { storageLocationService } from '../../services/storageLocationService'; // Import location service
import { Product, Supplier, InvoiceStatus, StorageLocation } from '../../types'; // Added StorageLocation
import { formatCurrency } from '../../utils/format';
import { Button } from '../ui/button'; // Assuming Button is used for add/remove items
import { Input } from '../ui/input'; // Assuming Input is used
import { Textarea } from '../ui/textarea'; // Assuming Textarea is used
import { Label } from '../ui/label'; // Assuming Label is used
import { useToast } from '../ui/use-toast'; // Already used, good
import { PlusCircle, Trash2 } from 'lucide-react'; // For item buttons

const purchaseSchema = z.object({
  contact_type: z.enum(['existing', 'new'] as const),
  supplier_id: z.string().optional(),
  new_contact_name: z.string().optional(),
  location_id: z.string().min(1, "موقع الاستلام مطلوب"), // New field for location
  invoice_date: z.string().min(1, 'تاريخ الفاتورة مطلوب'),
  payment_method: z.enum(['cash', 'partial', 'due'] as const, {
    required_error: 'طريقة الدفع مطلوبة'
  }),
  paid_amount: z.number().optional(),
  currency: z.string().min(1, 'العملة مطلوبة'),
  items: z.array(
    z.object({
      product_id: z.string().min(1, 'المنتج مطلوب'),
      quantity: z.number().min(1, 'الكمية يجب أن تكون أكبر من صفر'),
      unit_price: z.number().min(0, 'سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر'), // Allow 0
      is_serial_tracked: z.boolean().optional().default(false), // New field
      serials_input: z.string().optional(), // For textarea
      serial_numbers_to_register: z.array(z.string()).optional(), // Parsed serials
    })
  ).nonempty('يجب إضافة منتج واحد على الأقل'),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;
// Define a type for the item within the form, including client-side state like product_name
export interface FormPurchaseItem extends z.infer<typeof purchaseSchema>['items'][number] {
    product_name?: string;
}

interface PurchaseFormProps {
  onSuccess: () => void;
}

export const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      contact_type: 'existing',
      currency: 'SAR',
      items: [{
        product_id: '',
        quantity: 1,
        unit_price: 0,
        is_serial_tracked: false,
        serials_input: '',
        serial_numbers_to_register: [],
      }],
    }
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]); // State for locations
  const items = watch('items') as FormPurchaseItem[]; // Use the extended type
  const paymentMethod = watch('payment_method');
  const paidAmount = watch('paid_amount') || 0;
  const contactType = watch('contact_type');
  const [contactSearchTerm, setContactSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    const fetchSuppliers = async () => {
      try {
        const data = await supplierService.getAll();
        setSuppliers(data);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };

    fetchProducts();
    fetchSuppliers();

    const fetchLocations = async () => {
      try {
        const locs = await storageLocationService.getAll();
        setStorageLocations(locs);
        const defaultLocation = locs.find(l => l.is_default);
        if (defaultLocation && !getValues('location_id')) { // Set default if no value yet
          setValue('location_id', defaultLocation.id);
        }
      } catch (error) {
        console.error('Error fetching storage locations:', error);
        toast({ title: "خطأ", description: "فشل في تحميل مواقع التخزين.", variant: "destructive" });
      }
    };
    fetchLocations();
  }, [toast, setValue, getValues]);

  const calculateTotal = (items: any[]): number => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const totalAmount = calculateTotal(items);

  const { toast } = useToast(); // Import and use toast

  const onSubmit = async (data: PurchaseFormData) => {
    // Final validation and preparation of serial numbers
    const processedItems = data.items.map((item, index) => {
      if (item.is_serial_tracked) {
        const serialsRaw = item.serials_input || '';
        const parsedSerials = serialsRaw.split(/[\n\s,]+/).map(s => s.trim()).filter(s => s);

        if (parsedSerials.length !== item.quantity) {
          toast({
            title: "خطأ في البيانات",
            description: `المنتج ${(item as any).product_name || `البند #${index + 1}`} يتطلب ${item.quantity} رقم تسلسلي. تم إدخال ${parsedSerials.length}.`,
            variant: "destructive"
          });
          throw new Error(`خطأ في الأرقام التسلسلية للبند #${index + 1}`);
        }
        // Check for duplicate serials within the same item input
        const uniqueSerials = new Set(parsedSerials);
        if (uniqueSerials.size !== parsedSerials.length) {
            toast({
                title: "خطأ في البيانات",
                description: `الأرقام التسلسلية للمنتج ${(item as any).product_name || `البند #${index + 1}`} يجب أن تكون فريدة.`,
                variant: "destructive"
            });
            throw new Error(`أرقام تسلسلية مكررة للبند #${index + 1}`);
        }
        return { ...item, serial_numbers_to_register: parsedSerials };
      }
      return { ...item, serial_numbers_to_register: [] };
    });

    const finalData = { ...data, items: processedItems };

    try {
      // This data structure needs to match what purchaseService.create expects.
      // Specifically, the items array.
      const purchasePayloadItems = finalData.items.map(item => ({
        product_id: parseInt(item.product_id), // Ensure product_id is number
        quantity: item.quantity,
        unit_price: item.unit_price, // This is cost for purchases
        discount_amount: 0,
        tax_amount: 0,
        total_amount: item.quantity * item.unit_price,
        // Pass serial numbers for backend processing
        serial_numbers_to_register: item.serial_numbers_to_register,
      }));

      const purchaseInputData = {
        invoice_number: `PUR-${Date.now()}`, // Consider a better way to generate this
        type: 'purchase' as const, // This might be part of a general Invoice type in backend
        date: finalData.invoice_date,
        subtotal: totalAmount,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: totalAmount,
        paid_amount: paymentMethod === 'cash' || paymentMethod === 'partial' ? (finalData.paid_amount || 0) : 0,
        status: (paymentMethod === 'cash' && (finalData.paid_amount || 0) >= totalAmount ? 'paid' : 'pending') as InvoiceStatus,
        supplier_id: null as number | string | null,
        notes: finalData.notes || '',
        items: purchasePayloadItems,
        // Add location_id to the main purchase data for the conceptual purchaseService
        location_id: finalData.location_id,
      };
      
      if (finalData.contact_type === 'new') {
        const newSupplier = await supplierService.create({ 
          name: data.new_contact_name || '', 
          email: '', 
          phone: '', 
          address: '', 
          tax_number: '', 
          balance: 0 
        });
        purchaseInputData.supplier_id = newSupplier.id;
      } else if (finalData.supplier_id) {
        purchaseInputData.supplier_id = parseInt(finalData.supplier_id);
      }
      
      // console.log("Submitting to purchaseService.create:", purchaseInputData);
      // await purchaseService.create(purchaseInputData as any); // Cast as any if type is complex

      // Mocking successful submission for now
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({title: "نجاح", description: "تم إنشاء أمر الشراء (محاكاة). الأرقام التسلسلية جاهزة للمعالجة."});
      
      onSuccess();
      reset();
    } catch (error: any) {
      console.error('Error creating purchase invoice:', error);
      // toast is already called if error is thrown from the map function.
      if (!error.message.includes("الأرقام التسلسلية")) { // Avoid double toast for serial errors
          toast({title: "خطأ", description: error.message || "فشل إنشاء أمر الشراء.", variant: "destructive"});
      }
    }
  };

  const handleAddProduct = () => {
    const newItem: FormPurchaseItem = {
        product_id: '',
        quantity: 1,
        unit_price: 0,
        is_serial_tracked: false,
        serials_input: '',
        serial_numbers_to_register: []
    };
    // Use useFieldArray's append method for react-hook-form v7+
    // For older versions or direct setValue:
    setValue('items', [...items, newItem]);
  };

  const handleRemoveProduct = (index: number) => {
    if (items.length > 1) { // Keep at least one item row
      setValue('items', items.filter((_, i) => i !== index));
    } else {
        toast({title: "تنبيه", description: "يجب أن تحتوي الفاتورة على بند واحد على الأقل.", variant: "warning"});
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id.toString() === productId);
    if (selectedProduct) {
      setValue(`items.${index}.unit_price`, selectedProduct.cost);
      setValue(`items.${index}.is_serial_tracked`, selectedProduct.is_serial_tracked ?? false);
      setValue(`items.${index}.product_name`, selectedProduct.name); // Store name for display
      setValue(`items.${index}.serials_input`, ''); // Clear serials input
      setValue(`items.${index}.serial_numbers_to_register`, []); // Clear parsed serials
    }
  };

  // Function to parse and validate serials for an item, can be called on blur or before submission
  const validateItemSerials = (index: number) => {
    const item = watch(`items.${index}`) as FormPurchaseItem; // Get current item data
    if (!item || !item.is_serial_tracked) {
      setValue(`items.${index}.serial_numbers_to_register`, []);
      return; // No action if not serial tracked
    }

    const serialsRaw = item.serials_input || '';
    const parsedSerials = serialsRaw.split(/[\n\s,]+/).map(s => s.trim()).filter(s => s);

    if (parsedSerials.length !== item.quantity) {
      toast({
        title: "خطأ في الإدخال",
        description: `المنتج ${item.product_name || ''} يتطلب ${item.quantity} رقم تسلسلي. تم إدخال ${parsedSerials.length}.`,
        variant: "warning"
      });
      setValue(`items.${index}.serial_numbers_to_register`, []); // Clear if invalid
    } else {
      // Check for duplicates within this item's serials
      const uniqueSerials = new Set(parsedSerials);
      if (uniqueSerials.size !== parsedSerials.length) {
        toast({
            title: "خطأ في الإدخال",
            description: `الأرقام التسلسلية للمنتج ${item.product_name || ''} يجب أن تكون فريدة.`,
            variant: "warning"
        });
        setValue(`items.${index}.serial_numbers_to_register`, []); // Clear if invalid
      } else {
        setValue(`items.${index}.serial_numbers_to_register`, parsedSerials); // Update form state
        toast({title: "تم التحقق", description: `تم التحقق من ${parsedSerials.length} رقم تسلسلي للمنتج ${item.product_name || ''}.`, variant: "success"});
      }
    }
  };


  const remainingAmount = totalAmount - paidAmount;

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6 bg-white shadow rounded-lg" dir="rtl">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">إنشاء أمر شراء جديد</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="contact_type_supplier">نوع المورد</Label>
          <select
            id="contact_type_supplier"
            {...register('contact_type')}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="existing">مورّد حالي</option>
            <option value="new">مورّد جديد</option>
          </select>
        </div>

        {contactType === 'existing' && (
          <div className="relative">
            <Label htmlFor="supplier_search">ابحث عن المورد</Label>
            <Input
              id="supplier_search"
              type="text"
              placeholder="ابحث عن مورّد..."
              value={contactSearchTerm}
              onChange={(e) => setContactSearchTerm(e.target.value)}
              className="w-full mt-1"
            />
            {contactSearchTerm && filteredSuppliers.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredSuppliers.map((supplier) => (
                  <li
                    key={supplier.id}
                    onClick={() => {
                      setValue('supplier_id', supplier.id.toString()); // Ensure ID is string for form
                      setContactSearchTerm('');
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {supplier.name}
                  </li>
                ))}
              </ul>
            )}
             {errors.supplier_id && !watch('supplier_id') && <p className="mt-1 text-sm text-red-500">يجب اختيار مورد حالي أو إنشاء جديد.</p>}
          </div>
        )}

        {contactType === 'new' && (
          <div>
            <Label htmlFor="new_contact_name">اسم المورّد الجديد</Label>
            <Input
              id="new_contact_name"
              {...register('new_contact_name')}
              type="text"
              className="w-full mt-1"
              placeholder="أدخل اسم المورّد الجديد"
            />
            {errors.new_contact_name && <p className="mt-1 text-sm text-red-500">{errors.new_contact_name.message}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="location_id">موقع الاستلام</Label>
          <select
            id="location_id"
            {...register('location_id')}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">اختر موقع الاستلام</option>
            {storageLocations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          {errors.location_id && <p className="mt-1 text-sm text-red-500">{errors.location_id.message}</p>}
        </div>
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الفاتورة</label>
        <input
          {...register('invoice_date')}
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.invoice_date && <p className="mt-1 text-sm text-red-600">{errors.invoice_date.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
        <select
          {...register('payment_method')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="cash">نقدي</option>
          <option value="partial">دفع جزئي</option>
          <option value="due">دفع آجل</option>
        </select>
        {errors.payment_method && <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>}
      </div>

      {(paymentMethod === 'partial' || paymentMethod === 'cash') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
          <input
            {...register('paid_amount', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="أدخل المبلغ المدفوع"
          />
          {errors.paid_amount && <p className="mt-1 text-sm text-red-600">{errors.paid_amount.message}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
        <select
          {...register('currency')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="SAR">ريال سعودي (SAR)</option>
          <option value="USD">دولار أمريكي (USD)</option>
          <option value="EUR">يورو (EUR)</option>
          <option value="GBP">جنيه إسترليني (GBP)</option>
          <option value="EGP">جنيه مصري (EGP)</option>
        </select>
        {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>}
      </div>

      <h3 className="text-lg font-medium text-gray-900 mt-6">المنتجات المشتراة</h3>
      
      {items && items.map((item, index) => (
        <div key={index} className="border rounded-md p-4 space-y-2 bg-gray-50">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">
              { (item as any).product_name || `المنتج #${index + 1}` }
            </h4>
            <button
              type="button"
              onClick={() => handleRemoveProduct(index)}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              حذف المنتج
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المنتج</label>
            <select
              {...register(`items.${index}.product_id`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onChange={(e) => handleProductChange(index, e.target.value)}
              defaultValue={item.product_id}
            >
              <option value="">اختر منتج</option>
              {products.map(product => (
                <option key={product.id} value={product.id.toString()}>{product.name} ({product.sku})</option>
              ))}
            </select>
            {errors.items?.[index]?.product_id && (
              <p className="mt-1 text-sm text-red-600">{errors.items[index]!.product_id!.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
              <input
                {...register(`items.${index}.quantity`, { valueAsNumber: true,
                  onChange: () => validateItemSerials(index) // Validate serials if quantity changes
                })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.items?.[index]?.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.items[index]!.quantity!.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر التكلفة</label>
              <input
                {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.items?.[index]?.unit_price && (
                <p className="mt-1 text-sm text-red-600">{errors.items[index]!.unit_price!.message}</p>
              )}
            </div>
          </div>

          {/* Conditional Serial Number Input */}
          {watch(`items.${index}.is_serial_tracked`) && (
            <div>
              <label htmlFor={`items.${index}.serials_input`} className="block text-sm font-medium text-gray-700 mb-1">
                الأرقام التسلسلية (كل رقم في سطر جديد أو مفصولة بفاصلة/مسافة)
              </label>
              <Textarea
                id={`items.${index}.serials_input`}
                {...register(`items.${index}.serials_input`)}
                onBlur={() => validateItemSerials(index)}
                className="w-full mt-1 font-mono text-sm"
                rows={Math.max(2, watch(`items.${index}.quantity`, 1) / 2)}
                placeholder={`أدخل ${watch(`items.${index}.quantity`, 0)} رقم تسلسلي...`}
              />
              {/* Display validation messages for serials_input or serial_numbers_to_register if needed */}
              {errors.items?.[index]?.serial_numbers_to_register ? (
                <p className="mt-1 text-sm text-red-600">{errors.items[index]!.serial_numbers_to_register!.message}</p>
              ) : (
                watch(`items.${index}.serial_numbers_to_register`) &&
                watch(`items.${index}.serial_numbers_to_register`)!.length !== watch(`items.${index}.quantity`) &&
                watch(`items.${index}.quantity`) > 0 && // Only show if quantity is set
                <p className="mt-1 text-sm text-yellow-600">
                  عدد الأرقام التسلسلية ({watch(`items.${index}.serial_numbers_to_register`)!.length}) لا يطابق الكمية ({watch(`items.${index}.quantity`)}).
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddProduct}
        className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center mt-2"
      >
        <PlusCircle className="h-4 w-4 ml-1" /> إضافة منتج
      </button>

      <div className="mt-6 pt-6 border-t">
        <p className="text-lg font-medium text-gray-900">
          المبلغ الإجمالي: {formatCurrency(totalAmount)}
        </p>
        {paymentMethod === 'partial' && (
          <p className="text-sm text-gray-700">
            المبلغ المتبقي: {formatCurrency(remainingAmount)}
          </p>
        )}
        {paymentMethod === 'due' && (
          <p className="text-sm text-gray-700">
            الدفع آجل
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? 'جاري الإنشاء...' : 'إنشاء أمر الشراء'}
        </button>
      </div>
    </form>
  );
}; 