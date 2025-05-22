-- حذف المحفزات (triggers) أولاً لتجنب أخطاء التبعية
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;

-- حذف السياسات (policies)
DROP POLICY IF EXISTS "Users can read their own categories" ON categories;
DROP POLICY IF EXISTS "Users can read their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can read their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can read their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can read their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can read their own products" ON products;
DROP POLICY IF EXISTS "Users can read their own customers" ON customers;
DROP POLICY IF EXISTS "Users can read their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can read their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can read invoice items of their invoices" ON invoice_items;

DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can create their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can create their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can create their own products" ON products;
DROP POLICY IF EXISTS "Users can create their own customers" ON customers;
DROP POLICY IF EXISTS "Users can create their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can create their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can create invoice items for their invoices" ON invoice_items;

DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoice items of their invoices" ON invoice_items;

DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoice items of their invoices" ON invoice_items;

-- حذف المؤشرات (indexes)
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_type;
DROP INDEX IF EXISTS idx_transactions_category;
DROP INDEX IF EXISTS idx_categories_type;
DROP INDEX IF EXISTS idx_accounts_type;
DROP INDEX IF EXISTS idx_products_name;
DROP INDEX IF EXISTS idx_products_sku;
DROP INDEX IF EXISTS idx_customers_name;
DROP INDEX IF EXISTS idx_suppliers_name;
DROP INDEX IF EXISTS idx_invoices_number;
DROP INDEX IF EXISTS idx_invoices_type;

-- حذف الدوال (functions)
DROP FUNCTION IF EXISTS create_required_tables();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- حذف الجداول في ترتيب صحيح (حسب التبعيات)
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_settings;

-- إعادة تهيئة المتسلسلات (sequences) إذا لزم الأمر
-- ALTER SEQUENCE IF EXISTS categories_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS transactions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS budgets_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS accounts_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS user_settings_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS suppliers_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS invoices_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS invoice_items_id_seq RESTART WITH 1; 