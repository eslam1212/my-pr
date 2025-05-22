import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { invoiceService } from '../../services/invoice.service';
import { productService } from '../../services/product.service';
import { customerService } from '../../services/customer.service';
import { Product, Customer, InvoiceStatus } from '../../types';
import { formatCurrency } from '../../utils/format';

const salesSchema = z.object({
  contact_type: z.enum(['existing', 'new'] as const),
  customer_id: z.string().optional(),
  new_contact_name: z.string().optional(),
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
      unit_price: z.number().min(0, 'سعر الوحدة يجب أن يكون أكبر من صفر'),
    })
  ).nonempty('يجب إضافة منتج واحد على الأقل'),
});

type SalesFormData = z.infer<typeof salesSchema>;

interface SalesFormProps {
  onSuccess: () => void;
}

export const SalesForm: React.FC<SalesFormProps> = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<SalesFormData>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      contact_type: 'existing',
      currency: 'SAR',
      items: [{
        product_id: '',
        quantity: 1,
        unit_price: 0
      }],
    }
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const items = watch('items') || [];
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

    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAll();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchProducts();
    fetchCustomers();
  }, []);

  const calculateTotal = (items: any[]): number => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const totalAmount = calculateTotal(items);

  const onSubmit = async (data: SalesFormData) => {
    try {
      const invoiceItems = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: item.quantity * item.unit_price
      }));

      const salesData = {
        invoice_number: `INV-${Date.now()}`,
        type: 'sale' as const,
        date: data.invoice_date,
        subtotal: totalAmount,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: totalAmount,
        paid_amount: paymentMethod === 'cash' || paymentMethod === 'partial' ? paidAmount : 0,
        status: (paymentMethod === 'cash' ? 'paid' : 'pending') as InvoiceStatus,
        customer_id: null,
        supplier_id: null,
        notes: '',
        items: invoiceItems
      };
      
      if (data.contact_type === 'new') {
        const newCustomer = await customerService.create({ 
          name: data.new_contact_name || '', 
          email: '', 
          phone: '', 
          address: '', 
          tax_number: '', 
          balance: 0 
        });
        salesData.customer_id = newCustomer.id;
      } else if (data.customer_id) {
        salesData.customer_id = data.customer_id;
      }
      
      await invoiceService.create(salesData);
      
      onSuccess();
      reset();
    } catch (error) {
      console.error('Error creating sales invoice:', error);
    }
  };

  const handleAddProduct = () => {
    const updatedItems = [...items, { product_id: '', quantity: 1, unit_price: 0 }];
    setValue('items', updatedItems);
  };

  const handleRemoveProduct = (index: number) => {
    if (items.length > 1) {
      setValue('items', items.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      // Use selling price for sales
      setValue(`items.${index}.unit_price`, selectedProduct.price);
    }
  };

  const remainingAmount = totalAmount - paidAmount;

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
        <select
          {...register('contact_type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="existing">عميل حالي</option>
          <option value="new">عميل جديد</option>
        </select>
      </div>

      {contactType === 'existing' && (
        <div>
          <input
            type="text"
            placeholder="ابحث عن عميل..."
            value={contactSearchTerm}
            onChange={(e) => setContactSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <ul className="mt-2 max-h-40 overflow-y-auto border rounded-md bg-white">
            {filteredCustomers.map((customer) => (
              <li
                key={customer.id}
                onClick={() => {
                  setValue('customer_id', customer.id);
                  setContactSearchTerm('');
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {customer.name}
              </li>
            ))}
            {filteredCustomers.length === 0 && contactSearchTerm && (
              <li className="px-4 py-2 text-gray-500">لا يوجد نتائج</li>
            )}
          </ul>
        </div>
      )}

      {contactType === 'new' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل الجديد</label>
          <input
            {...register('new_contact_name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="أدخل اسم العميل الجديد"
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

      <h3 className="text-lg font-medium text-gray-900 mt-6">المنتجات المباعة</h3>
      
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
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع</label>
              <input
                {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                readOnly
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
          إنشاء فاتورة المبيعات
        </button>
      </div>
    </form>
  );
}; 