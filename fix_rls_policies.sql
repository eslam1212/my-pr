-- تعطيل RLS مؤقتًا لإعادة تكوين السياسات
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings DISABLE ROW LEVEL SECURITY;

-- حذف جميع السياسات الموجودة باستخدام PL/pgSQL
DO $$
DECLARE
    _tbl text;
    _pol text;
BEGIN
    -- حذف جميع السياسات لكل الجداول
    FOR _tbl, _pol IN (
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', _pol, _tbl);
    END LOOP;
END $$;

-- إعادة تفعيل RLS
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات جديدة لجدول التصنيفات
CREATE POLICY "Enable read for authenticated users" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- إنشاء سياسات جديدة لجدول المعاملات
CREATE POLICY "Enable read for authenticated users" ON transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- إنشاء سياسات جديدة لجدول الميزانية
CREATE POLICY "Enable read for authenticated users" ON budgets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON budgets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- إنشاء سياسات جديدة لجدول إعدادات المستخدم
CREATE POLICY "Enable read for authenticated users" ON user_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON user_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- إضافة سياسات إضافية للسماح للمستخدمين بقراءة بياناتهم الخاصة فقط
CREATE POLICY "Enable read for users based on user_id" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable read for users based on user_id" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable read for users based on user_id" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable read for users based on user_id" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own products" ON products;
DROP POLICY IF EXISTS "Users can create their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

DROP POLICY IF EXISTS "Users can read their own customers" ON customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

DROP POLICY IF EXISTS "Users can read their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can create their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON suppliers;

DROP POLICY IF EXISTS "Users can read their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can create their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;

DROP POLICY IF EXISTS "Users can read invoice items of their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can create invoice items for their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can update invoice items for their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can delete invoice items for their invoices" ON invoice_items;

DROP POLICY IF EXISTS "Users can read their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can create their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

-- Create new policies
-- Products
CREATE POLICY "Users can read their own products" ON products
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- Customers
CREATE POLICY "Users can read their own customers" ON customers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON customers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers" ON customers
  FOR DELETE USING (auth.uid() = user_id);

-- Suppliers
CREATE POLICY "Users can read their own suppliers" ON suppliers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own suppliers" ON suppliers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own suppliers" ON suppliers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own suppliers" ON suppliers
  FOR DELETE USING (auth.uid() = user_id);

-- Invoices
CREATE POLICY "Users can read their own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON invoices
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON invoices
  FOR DELETE USING (auth.uid() = user_id);

-- Invoice Items
CREATE POLICY "Users can read invoice items of their invoices" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create invoice items for their invoices" ON invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update invoice items for their invoices" ON invoice_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete invoice items for their invoices" ON invoice_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- User Settings
CREATE POLICY "Users can read their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON suppliers TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON invoice_items TO authenticated;
GRANT ALL ON user_settings TO authenticated;
