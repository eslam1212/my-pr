-- إصلاح سياسات RLS لجميع الجداول
-- قم بتنفيذ هذا الملف في محرر SQL في لوحة تحكم Supabase

-- التحقق من وجود الجداول وإنشاءها إذا لم تكن موجودة
DO $$
BEGIN
    -- التحقق من وجود جدول reports
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
        CREATE TABLE reports (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            report_data JSONB DEFAULT '{}'::jsonb,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- التحقق من وجود جدول products
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        CREATE TABLE products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            cost DECIMAL(10, 2),
            sku TEXT,
            barcode TEXT,
            quantity INTEGER DEFAULT 0,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- التحقق من وجود جدول user_settings
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_settings') THEN
        CREATE TABLE user_settings (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            settings JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
    END IF;
    
    -- التحقق من وجود جدول transactions
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        CREATE TABLE transactions (
            id SERIAL PRIMARY KEY,
            description TEXT,
            amount DECIMAL(10, 2) NOT NULL,
            date DATE NOT NULL,
            type_transaction TEXT NOT NULL,
            category_id INTEGER,
            account_id INTEGER,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- التحقق من وجود جدول categories
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
        CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            type_category TEXT NOT NULL,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- التحقق من وجود جدول budgets
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
        CREATE TABLE budgets (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            category_id INTEGER,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- التحقق من وجود جدول accounts
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accounts') THEN
        CREATE TABLE accounts (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            account_type TEXT NOT NULL,
            balance DECIMAL(10, 2) DEFAULT 0,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- التحقق من وجود جدول customers
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
        CREATE TABLE customers (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            tax_number TEXT,
            balance DECIMAL(10, 2) DEFAULT 0,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- التحقق من وجود جدول suppliers
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers') THEN
        CREATE TABLE suppliers (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            tax_number TEXT,
            balance DECIMAL(10, 2) DEFAULT 0,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- 1. تمكين RLS على جميع الجداول الرئيسية
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports ENABLE ROW LEVEL SECURITY;

-- 2. حذف السياسات القديمة التي قد تكون مسببة للمشكلة
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;

DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

DROP POLICY IF EXISTS "Users can view their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can insert their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON suppliers;

DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON reports;

-- 3. إنشاء سياسات جديدة تسمح للمستخدمين بالوصول إلى بياناتهم الخاصة

-- سياسات جدول transactions
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        CREATE POLICY "Users can view their own transactions"
        ON transactions FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own transactions"
        ON transactions FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own transactions"
        ON transactions FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own transactions"
        ON transactions FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- سياسات جدول categories
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
        CREATE POLICY "Users can view their own categories"
        ON categories FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own categories"
        ON categories FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own categories"
        ON categories FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own categories"
        ON categories FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- سياسات جدول budgets
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
        CREATE POLICY "Users can view their own budgets"
        ON budgets FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own budgets"
        ON budgets FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own budgets"
        ON budgets FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own budgets"
        ON budgets FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- سياسات جدول accounts
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accounts') THEN
        CREATE POLICY "Users can view their own accounts"
        ON accounts FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own accounts"
        ON accounts FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own accounts"
        ON accounts FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own accounts"
        ON accounts FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- سياسات جدول user_settings
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_settings') THEN
        CREATE POLICY "Users can view their own settings"
        ON user_settings FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own settings"
        ON user_settings FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own settings"
        ON user_settings FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own settings"
        ON user_settings FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- سياسات جدول products
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        CREATE POLICY "Users can view their own products"
        ON products FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own products"
        ON products FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own products"
        ON products FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own products"
        ON products FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- سياسات جدول customers
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
        CREATE POLICY "Users can view their own customers"
        ON customers FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own customers"
        ON customers FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own customers"
        ON customers FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own customers"
        ON customers FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- سياسات جدول suppliers
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers') THEN
        CREATE POLICY "Users can view their own suppliers"
        ON suppliers FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own suppliers"
        ON suppliers FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own suppliers"
        ON suppliers FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own suppliers"
        ON suppliers FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- سياسات جدول reports
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
        CREATE POLICY "Users can view their own reports"
        ON reports FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own reports"
        ON reports FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own reports"
        ON reports FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own reports"
        ON reports FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$; 