import React, { useState, useEffect } from 'react';
import { invoiceService } from '../../services/invoice.service';
import { Customer, Supplier, Invoice, InvoiceItem, InvoiceStatus, Product, InvoiceType } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productService } from '../../services/product.service';
import { customerService } from '../../services/customer.service';
import { supplierService } from '../../services/supplier.service';
import { purchaseService } from '../../services/purchase.service';
import { formatCurrency } from '../../utils/format';

const invoiceSchema = z.object({
  contact_type: z.enum(['existing', 'new'] as const),
  customer_id: z.string().optional(),
  supplier_id: z.string().optional(),
  new_contact_name: z.string().optional(),
  type: z.enum(['sale', 'purchase'] as const),
  invoice_date: z.string().min(1, 'تاريخ الفاتورة مطلوب'),
  payment_method: z.enum(['cash', 'partial', 'due'] as const, {
    required_error: 'طريقة الدفع مطلوبة'
  }),
  paid_amount: z.number().optional(),
  currency: z.string().min(1, 'العملة مطلوبة'),
  items: z.array(
    z.object({
      product_id: z.string().min(1, 'المنتج مطلوب'),
      // product_name: z.string().optional(), // For display and if product is not found by id later
      // is_serial_tracked: z.boolean().optional().default(false), // To know if SN button is needed
      quantity: z.number().min(1, 'الكمية يجب أن تكون أكبر من صفر'),
      unit_price: z.number().min(0, 'سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر'), // Allow 0
      serial_numbers_provided: z.array(z.string()).optional(), // For selected serial numbers
    })
  ).min(1, 'يجب إضافة منتج واحد على الأقل.'), // Ensure at least one item
});

// We need to extend InvoiceItem type used by the form to include these client-side fields
export interface FormInvoiceItem extends InvoiceItem {
  product_name?: string;
  is_serial_tracked?: boolean;
  // serial_numbers_provided is already in InvoiceItem from previous step
}


type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  onSuccess: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      type: 'sale',
      invoice_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      contact_type: 'existing',
      currency: 'SAR',
      items: [],
    }
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const items = watch('items', []) as FormInvoiceItem[]; // Watch items with the extended type
  const paymentMethod = watch('payment_method');
  const paidAmount = watch('paid_amount') || 0;
  const invoiceType = watch('type');
  const contactType = watch('contact_type');
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [barcodeInputValue, setBarcodeInputValue] = useState(''); // For barcode input

  // State for Serial Number Modal
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [currentItemIndexForSerial, setCurrentItemIndexForSerial] = useState<number | null>(null);
  // currentProductForSerial is already available as `products.find(p => p.id.toString() === items[currentItemIndexForSerial!].product_id)`
  // Or we can pass the specific product object to the modal. Let's pass the product object.
  const [productForSerialModal, setProductForSerialModal] = useState<Product | null>(null);

  const { toast } = useToast();
  // Remove useFormContext if not using FormProvider wrapper for this specific form.
  // If InvoiceForm is not wrapped in <FormProvider {...methods}>, then control, getValues, setValue come directly from useForm.
  // const { control, getValues, setValue: setFormValue } = useFormContext<InvoiceFormData>();
  // These are already available from the main useForm hook:
  // const { register, handleSubmit, formState: { errors }, reset, watch, setValue, control } = useForm<InvoiceFormData>({...});


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAll();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
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
    fetchCustomers();
    fetchSuppliers();
  }, []);

  const calculateTotal = (items: any[]): number => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const totalAmount = calculateTotal(items);

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      // Validate serial numbers for all tracked items before submission
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const product = products.find(p => p.id.toString() === item.product_id);
        if (product?.is_serial_tracked) {
          if (!item.serial_numbers_provided || item.serial_numbers_provided.length !== item.quantity) {
            toast({
              title: "خطأ في التحقق",
              description: `المنتج "${product.name}" يتطلب ${item.quantity} رقم تسلسلي. تم اختيار ${item.serial_numbers_provided?.length || 0}.`,
              variant: "destructive",
            });
            return; // Stop submission
          }
        }
      }

      const invoiceItemsPayload = items.map(item => ({
        product_id: parseInt(item.product_id), // Ensure product_id is number
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: 0, // Assuming no discount/tax for now
        tax_amount: 0,
        total_amount: item.quantity * item.unit_price,
        serial_numbers_provided: item.serial_numbers_provided, // Pass selected serials
      }));

      const baseInvoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'> = {
        invoice_number: `INV-${Date.now()}`,
        type: data.type,
        date: data.invoice_date,
        subtotal: totalAmount,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: totalAmount,
        paid_amount: paymentMethod === 'cash' || paymentMethod === 'partial' ? paidAmount : 0,
        status: (paymentMethod === 'cash' ? 'paid' : 'pending') as InvoiceStatus,
        customer_id: null,
        supplier_id: null,
        notes: ''
      };
      
      if (data.contact_type === 'new') {
        if (data.type === 'sale') {
          const newCustomer = await customerService.create({ name: data.new_contact_name || '', email: '', phone: '', address: '', tax_number: '', balance: 0 });
          baseInvoiceData.customer_id = newCustomer.id;
        } else {
          const newSupplier = await supplierService.create({ name: data.new_contact_name || '', email: '', phone: '', address: '', tax_number: '', balance: 0 });
          baseInvoiceData.supplier_id = newSupplier.id;
        }
      } else {
        if (data.type === 'sale' && data.customer_id) {
          baseInvoiceData.customer_id = parseInt(data.customer_id);
        } else if (data.type === 'purchase' && data.supplier_id) {
          baseInvoiceData.supplier_id = parseInt(data.supplier_id);
        }
      }
      
      // Assuming invoiceService.create expects items with product_id as number
      const finalPayload = {
        ...baseInvoiceData,
        items: invoiceItemsPayload,
      };

      if (data.type === 'sale') {
        await invoiceService.create(finalPayload as any); // Cast if types are slightly off due to Omit
      } else {
        // Assuming purchaseService.create has a similar signature for items
        await purchaseService.create(finalPayload as any);
      }
      
      toast({ title: "نجاح", description: "تم إنشاء الفاتورة بنجاح." });
      onSuccess();
      reset(); // Reset form to default values
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الفاتورة.",
        variant: "destructive",
      });
    }
  };

  const addInvoiceItem = (product: Product, quantity: number = 1, serials?: string[]) => {
    const price = invoiceType === 'purchase' ? product.cost : product.price;
    const newItem: FormInvoiceItem = {
      product_id: product.id.toString(), // Keep as string for form compatibility initially
      product_name: product.name,
      is_serial_tracked: product.is_serial_tracked,
      quantity: quantity,
      unit_price: price,
      serial_numbers_provided: serials || [],
      // Fill other InvoiceItem fields with defaults if necessary
      id: 0, // Placeholder
      invoice_id: 0, // Placeholder
      discount_amount: 0,
      tax_amount: 0,
      total_amount: price * quantity,
      created_at: '',
      updated_at: '',
    };
    setValue('items', [...items, newItem]);
  };

  const handleBarcodeScanned = async () => {
    if (!barcodeInputValue.trim()) return;
    try {
      const product = await productService.findByBarcode(barcodeInputValue.trim());
      if (product) {
        const existingItemIndex = items.findIndex(item => item.product_id === product.id.toString());
        if (existingItemIndex !== -1 && !product.is_serial_tracked) {
          // Increment quantity for non-serial tracked items
          const currentItem = items[existingItemIndex];
          setValue(`items.${existingItemIndex}.quantity`, currentItem.quantity + 1);
        } else if (existingItemIndex !== -1 && product.is_serial_tracked) {
          // For serial tracked, add as new line or prompt user, for now add new line
          addInvoiceItem(product, 1);
           if (product.is_serial_tracked) {
            setCurrentProductForSerial(product);
            setCurrentItemIndexForSerial(items.length); // New item will be at the end
            setIsSerialModalOpen(true);
          }
        }
        else {
          addInvoiceItem(product, 1);
           if (product.is_serial_tracked) {
            setCurrentProductForSerial(product);
            setCurrentItemIndexForSerial(items.length); // New item will be at the end
            setIsSerialModalOpen(true);
          }
        }
        setBarcodeInputValue(''); // Clear input after adding
        toast({ title: "نجاح", description: `تمت إضافة المنتج: ${product.name}` });
      } else {
        toast({ title: "خطأ", description: "لم يتم العثور على منتج بهذا الباركود.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error finding product by barcode:", error);
      toast({ title: "خطأ", description: error.message || "فشل البحث بالباركود.", variant: "destructive" });
    }
  };

  const handleAddProductManually = () => {
    // Adds an empty row for manual product selection
    const newItem: FormInvoiceItem = {
      product_id: '',
      quantity: 1,
      unit_price: 0,
      serial_numbers_provided: [],
      id: 0, invoice_id: 0, discount_amount: 0, tax_amount: 0, total_amount: 0, created_at: '', updated_at: ''
    };
    setValue('items', [...items, newItem]);
  };

  const handleRemoveProduct = (index: number) => {
    setValue('items', items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id.toString() === productId);
    if (selectedProduct) {
      const price = invoiceType === 'purchase' ? selectedProduct.cost : selectedProduct.price;
      setValue(`items.${index}.unit_price`, price);
      setValue(`items.${index}.product_name`, selectedProduct.name);
      setValue(`items.${index}.is_serial_tracked`, selectedProduct.is_serial_tracked);
      setValue(`items.${index}.serial_numbers_provided`, []); // Reset serials when product changes

      if (selectedProduct.is_serial_tracked && items[index].quantity > 0) {
        setCurrentProductForSerial(selectedProduct);
        setCurrentItemIndexForSerial(index);
        // setIsSerialModalOpen(true); // Optionally auto-open modal, or let user click a button
      }
    }
  };

  const handleOpenSerialModal = (index: number) => {
    const item = items[index]; // Or getValues(`items.${index}`) if using FormProvider extensively
    const product = products.find(p => p.id.toString() === item.product_id);
    if (product && product.is_serial_tracked) {
      setProductForSerialModal(product); // Pass the whole product object
      setCurrentItemIndexForSerial(index);
      setIsSerialModalOpen(true);
    } else {
      toast({title: "معلومة", description: "هذا المنتج لا يتطلب تتبع الأرقام التسلسلية."});
    }
  };

  const handleSaveSerialsFromModal = (selectedSerials: string[]) => {
    if (currentItemIndexForSerial !== null) {
      setValue(`items.${currentItemIndexForSerial}.serial_numbers_provided`, selectedSerials);
    }
    setIsSerialModalOpen(false);
    setCurrentItemIndexForSerial(null);
    setProductForSerialModal(null);
  };

  const remainingAmount = totalAmount - paidAmount;

  const filteredContacts = (invoiceType === 'sale' ? customers : suppliers).filter((contact: Customer | Supplier) =>
    contact.name.toLowerCase().includes(contactSearchTerm.toLowerCase())
import { Button } from '../ui/button'; // Ensure Button is imported
import { useToast } from '../ui/use-toast'; // Ensure useToast is imported
import SerialSelectionModal from './SerialSelectionModal'; // Import the actual modal
// ... other imports from the original file (productService, customerService, etc.) should be preserved.
// The following is a focused diff on integrating the modal and fixing potential hook issues.

// Ensure all necessary react-hook-form methods are available directly from useForm
// const { register, handleSubmit, formState: { errors }, reset, watch, setValue, control } = useForm<InvoiceFormData>({...});
// For this diff, I will assume these are correctly destructured from useForm at the top of the component.

// ... (rest of the component code including useEffects, handlers, etc.)

  return (
    <>
    {productForSerialModal && currentItemIndexForSerial !== null && items[currentItemIndexForSerial] && (
      <SerialSelectionModal
        isOpen={isSerialModalOpen}
        onClose={() => {
          setIsSerialModalOpen(false);
          setCurrentItemIndexForSerial(null);
          setProductForSerialModal(null);
        }}
        onSaveSerials={handleSaveSerialsFromModal} // Renamed from onSaveSerials to handleSaveSerialsFromModal
        product={productForSerialModal}
        requiredQuantity={items[currentItemIndexForSerial].quantity}
        previouslySelectedSerials={items[currentItemIndexForSerial].serial_numbers_provided || []}
      />
    )}

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 bg-white shadow rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع الفاتورة</label>
          <select
            {...register('type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="sale">مبيعات</option>
            <option value="purchase">مشتريات</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">العميل/المورد</label>
          <select
            {...register('contact_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="existing">عميل/مورد حالي</option>
            <option value="new">عميل/مورد جديد</option>
          </select>
        </div>
      </div>

      {contactType === 'existing' && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {invoiceType === 'sale' ? 'اختر العميل' : 'اختر المورد'}
          </label>
          <input
            type="text"
            placeholder={`ابحث عن ${invoiceType === 'sale' ? 'عميل' : 'مورد'}...`}
            value={contactSearchTerm}
            onChange={(e) => setContactSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {contactSearchTerm && filteredContacts.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredContacts.map((contact: Customer | Supplier) => (
                <li
                  key={contact.id}
                  onClick={() => {
                    setValue(invoiceType === 'sale' ? 'customer_id' : 'supplier_id', contact.id.toString());
                    setContactSearchTerm(''); // Clear search after selection
                    // Optionally, display selected contact name if needed
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {contact.name}
                </li>
              ))}
            </ul>
          )}
          {/* Display selected contact if needed, or rely on form state */}
        </div>
      )}

      {contactType === 'new' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم {invoiceType === 'sale' ? 'العميل' : 'المورد'} الجديد</label>
          <input
            {...register('new_contact_name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={`أدخل اسم ${invoiceType === 'sale' ? 'العميل' : 'المورد'} الجديد`}
          />
           {errors.new_contact_name && <p className="mt-1 text-sm text-red-600">{errors.new_contact_name.message}</p>}
        </div>
      )}
      {/* Ensure `control` from useForm is used if Controller was intended for future use, otherwise it's not strictly needed for these fields yet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
          <select
            {...register('currency')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="SAR">ريال سعودي (SAR)</option>
            <option value="USD">دولار أمريكي (USD)</option>
            <option value="EGP">جنيه مصري (EGP)</option>
          </select>
          {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>}
        </div>
      </div>

      {/* Barcode Scanner Input */}
      <div className="pt-4">
        <label htmlFor="barcodeInput" className="block text-sm font-medium text-gray-700 mb-1">
          إدخال الباركود
        </label>
        <div className="flex">
          <input
            id="barcodeInput"
            type="text"
            value={barcodeInputValue}
            onChange={(e) => setBarcodeInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeScanned();}}}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="امسح أو أدخل الباركود واضغط Enter"
          />
          <button
            type="button"
            onClick={handleBarcodeScanned}
            className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            إضافة
          </button>
        </div>
      </div>

      {/* Invoice Items Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">بنود الفاتورة</h3>
        {items.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50/50">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium text-gray-700">
                {item.product_name || `المنتج #${index + 1}`}
              </h4>
              <button
                type="button"
                onClick={() => handleRemoveProduct(index)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                حذف
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">المنتج</label>
              <select
                {...register(`items.${index}.product_id`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onChange={(e) => handleProductChange(index, e.target.value)}
                defaultValue={item.product_id}
              >
                <option value="">اختر منتج</option>
                {products.map(product => (
                  <option key={product.id} value={product.id.toString()}>{product.name} ({product.sku})</option>
                ))}
              </select>
              {errors.items?.[index]?.product_id && (
                <p className="mt-1 text-xs text-red-500">{errors.items[index].product_id!.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">الكمية</label>
                <input
                  {...register(`items.${index}.quantity`, { valueAsNumber: true,
                    onChange: (e) => {
                      const product = products.find(p => p.id.toString() === items[index].product_id);
                      if (product?.is_serial_tracked) {
                        // Clear serials if quantity changes, prompt re-selection
                        setValue(`items.${index}.serial_numbers_provided`, []);
                      }
                    }
                  })}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errors.items?.[index]?.quantity && (
                  <p className="mt-1 text-xs text-red-500">{errors.items[index].quantity!.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">سعر الوحدة</label>
                <input
                  {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  readOnly={invoiceType !== 'purchase'} // Price comes from product for sales
                />
                {errors.items?.[index]?.unit_price && (
                  <p className="mt-1 text-xs text-red-500">{errors.items[index].unit_price!.message}</p>
                )}
              </div>
            </div>

            {item.is_serial_tracked && item.quantity > 0 && (
              <div className="mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => handleOpenSerialModal(index)}>
                  {item.serial_numbers_provided && item.serial_numbers_provided.length === item.quantity
                    ? `تم اختيار ${item.serial_numbers_provided.length} رقم تسلسلي`
                    : `اختيار الأرقام التسلسلية (${item.serial_numbers_provided?.length || 0}/${item.quantity})`}
                </Button>
                {item.serial_numbers_provided && item.serial_numbers_provided.length > 0 && item.serial_numbers_provided.length !== item.quantity && (
                   <p className="mt-1 text-xs text-yellow-600">عدد الأرقام التسلسلية المحددة لا يطابق الكمية.</p>
                )}
                 {errors.items?.[index]?.serial_numbers_provided && (
                  <p className="mt-1 text-xs text-red-500">{errors.items[index].serial_numbers_provided!.message}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddProductManually}
        className="mt-4 px-4 py-2 border border-dashed border-gray-300 text-indigo-600 hover:bg-indigo-50 rounded-md text-sm"
      >
        + إضافة منتج يدوياً
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
          <select
            {...register('payment_method')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="cash">نقدي (كامل المبلغ)</option>
            <option value="partial">دفع جزئي</option>
            <option value="due">دفع آجل</option>
          </select>
          {errors.payment_method && <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>}
        </div>

        {(paymentMethod === 'partial' || paymentMethod === 'cash') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
            <input
              {...register('paid_amount', { valueAsNumber: true,
                validate: value => paymentMethod === 'cash' ? value === totalAmount : (value !== undefined && value >= 0)
              })}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={paymentMethod === 'cash' ? formatCurrency(totalAmount) : "أدخل المبلغ المدفوع"}
              readOnly={paymentMethod === 'cash'}
            />
            {errors.paid_amount && <p className="mt-1 text-sm text-red-600">
              {paymentMethod === 'cash' ? `المبلغ المدفوع يجب أن يكون ${formatCurrency(totalAmount)}` : errors.paid_amount.message}
            </p>}
          </div>
        )}
      </div>


      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center text-lg font-semibold text-gray-900">
          <span>المبلغ الإجمالي:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
        {(paymentMethod === 'partial' && paidAmount > 0 && paidAmount < totalAmount) && (
          <div className="flex justify-between items-center text-md text-gray-700 mt-1">
            <span>المبلغ المتبقي:</span>
            <span>{formatCurrency(remainingAmount)}</span>
          </div>
        )}
        {paymentMethod === 'due' && (
          <p className="text-sm text-gray-700 text-right mt-1">
            كامل المبلغ آجل.
          </p>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          إنشاء الفاتورة
        </button>
      </div>
    </form>
    </>
  );
};
        <label className="block text-sm font-medium text-gray-700 mb-1">العميل/المورد</label>
        <select
          {...register('contact_type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="existing">عميل/مورد حالي</option>
          <option value="new">عميل/مورد جديد</option>
        </select>
      </div>

      {contactType === 'existing' && (
        <div>
          <input
            type="text"
            placeholder="ابحث عن عميل أو مورد..."
            value={contactSearchTerm}
            onChange={(e) => setContactSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <ul className="mt-2 max-h-40 overflow-y-auto border rounded-md bg-white">
            {filteredContacts.map((contact: any) => (
              <li
                key={contact.id}
                onClick={() => {
                  setValue(
                    watch('type') === 'sale' ? 'customer_id' : 'supplier_id',
                    contact.id
                  );
                  setContactSearchTerm('');
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {contact.name}
              </li>
            ))}
            {filteredContacts.length === 0 && contactSearchTerm && (
              <li className="px-4 py-2 text-gray-500">لا يوجد نتائج</li>
            )}
          </ul>
        </div>
      )}

      {contactType === 'new' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل/المورد الجديد</label>
          <input
            {...register('new_contact_name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="أدخل اسم العميل أو المورد الجديد"
          />
        </div>
      )}

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

      {items && items.map((item, index) => (
        <div key={index} className="border rounded-md p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">المنتج #{index + 1}</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المنتج</label>
            <select
              {...register(`items.${index}.product_id`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onChange={(e) => handleProductChange(index, e.target.value)}
            >
              <option value="">اختر منتج</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            {errors.items?.[index]?.product_id && (
              <p className="mt-1 text-sm text-red-600">{errors.items[index].product_id.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
              <input
                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.items?.[index]?.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.items[index].quantity.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر الوحدة</label>
              <input
                {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                readOnly={watch('type') !== 'purchase'}
              />
              {errors.items?.[index]?.unit_price && (
                <p className="mt-1 text-sm text-red-600">{errors.items[index].unit_price.message}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveProduct(index)}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            حذف المنتج
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddProduct}
        className="text-indigo-600 hover:text-indigo-700 text-sm"
      >
        إضافة منتج
      </button>

      <div className="mt-4">
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
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
        >
          إنشاء الفاتورة
        </button>
      </div>
    </form>
  );
};
