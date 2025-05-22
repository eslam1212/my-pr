// تعريف واجهة Sale لتمثيل بيانات المبيعات
export interface Sale {
  id?: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  customer: string;
  sale_date?: string;
}

// تعريف واجهة Customer لتمثيل بيانات العملاء
export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
}

// تعريف واجهة Order لتمثيل بيانات الطلبات
export interface Order {
  id?: string;
  customer_id: string;
  total: number;
  order_date: string;
}

// تعريف واجهة Return لتمثيل بيانات المرتجعات
export interface Return {
  id?: string;
  order_id: string;
  reason: string;
  return_date: string;
}

// تعريف واجهة Invoice لتمثيل بيانات الفواتير
export interface Invoice {
  id?: string;
  customer_id: string;
  total: number;
  invoice_date: string;
}

// تعريف واجهة RecurringInvoice لتمثيل الفواتير المتكررة
export interface RecurringInvoice {
  id?: string;
  customer_id: string;
  amount: number;
  frequency: string; // يومي، أسبوعي، شهري
  start_date: string;
  end_date?: string;
}

// تعريف واجهة Supplier لتمثيل بيانات الموردين
export interface Supplier {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  products: string[];
  status: 'active' | 'inactive';
  created_at?: string;
  last_order_date?: string;
}
