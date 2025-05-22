-- إنشاء وظيفة RPC التي تقوم بإنشاء الجداول المطلوبة (يتم استدعاؤها من التطبيق)
CREATE OR REPLACE FUNCTION create_required_tables()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- التحقق من وجود الجداول المطلوبة وإنشائها إذا كانت غير موجودة
  
  -- فحص جدول التصنيفات
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    CREATE TABLE categories (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type_category TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      user_id UUID REFERENCES auth.users(id)
    );
    
    -- تفعيل RLS وإضافة السياسات
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can read their own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (auth.uid() = user_id);
  END IF;
  
  -- فحص جدول الحسابات
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accounts') THEN
    CREATE TABLE accounts (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      balance DECIMAL(10,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'SAR',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      user_id UUID REFERENCES auth.users(id)
    );
    
    -- تفعيل RLS وإضافة السياسات
    ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can read their own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);
  END IF;
  
  -- فحص جدول المعاملات
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    CREATE TABLE transactions (
      id BIGSERIAL PRIMARY KEY,
      date DATE NOT NULL,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type_transaction TEXT NOT NULL,
      category TEXT NOT NULL,
      reference TEXT,
      status TEXT NOT NULL,
      payment_method TEXT,
      account_id BIGINT REFERENCES accounts(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      user_id UUID REFERENCES auth.users(id)
    );
    
    -- تفعيل RLS وإضافة السياسات
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can read their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);
  END IF;
  
  -- فحص جدول الميزانية
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
    CREATE TABLE budgets (
      id BIGSERIAL PRIMARY KEY,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      category TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      spent DECIMAL(10,2) DEFAULT 0,
      remaining DECIMAL(10,2) GENERATED ALWAYS AS (amount - spent) STORED,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      user_id UUID REFERENCES auth.users(id)
    );
    
    -- تفعيل RLS وإضافة السياسات
    ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can read their own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);
  END IF;
  
  -- فحص جدول إعدادات المستخدم
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_settings') THEN
    CREATE TABLE user_settings (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
    
    -- تفعيل RLS وإضافة السياسات
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can read their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);
  END IF;
  
  -- إضافة سياسات أمان اضافية (عامة) للجداول إذا كانت موجودة
  -- هذا للتأكد من أن الجداول الموجودة تحصل على السياسات المناسبة
  
  BEGIN
    -- فحص وإضافة سياسة القراءة لجدول التصنيفات
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'categories' 
      AND policyname = 'Users can read their own categories'
    ) THEN
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users can read their own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- تجاهل أي خطأ (مثل وجود السياسة بالفعل)
  END;
  
  BEGIN
    -- فحص وإضافة سياسة القراءة لجدول المعاملات
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'transactions' 
      AND policyname = 'Users can read their own transactions'
    ) THEN
      ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users can read their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- تجاهل أي خطأ
  END;
  
  BEGIN
    -- فحص وإضافة سياسة القراءة لجدول الميزانية
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'budgets' 
      AND policyname = 'Users can read their own budgets'
    ) THEN
      ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users can read their own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- تجاهل أي خطأ
  END;
  
  BEGIN
    -- فحص وإضافة سياسة القراءة لجدول الإعدادات
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'user_settings' 
      AND policyname = 'Users can read their own settings'
    ) THEN
      ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users can read their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- تجاهل أي خطأ
  END;
  
  -- إرجاع نتيجة نجاح
  result := json_build_object(
    'success', true,
    'message', 'Tables and policies created or verified successfully'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح حق الوصول لاستدعاء الوظيفة للجميع
GRANT EXECUTE ON FUNCTION create_required_tables() TO PUBLIC;

-- إصلاح مشكلة يتم الإبلاغ عنها حول مفقودة CREATEs من ملف سياسات RLS
-- نطبق السياسات الموجودة مرة أخرى على جميع الجداول
DO $$
BEGIN
  -- التحقق من وجود سياسات RLS على جدول التصنيفات
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    BEGIN
      -- تفعيل RLS
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      
      -- إزالة السياسات الموجودة إذا كانت موجودة (لتجنب الأخطاء)
      DROP POLICY IF EXISTS "Users can read their own categories" ON categories;
      DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
      DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
      DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
      
      -- إعادة إنشاء السياسات
      CREATE POLICY "Users can read their own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can create their own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION WHEN OTHERS THEN
      -- تجاهل الأخطاء
    END;
  END IF;
  
  -- التحقق من وجود سياسات RLS على جدول المعاملات
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    BEGIN
      -- تفعيل RLS
      ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
      
      -- إزالة السياسات الموجودة إذا كانت موجودة
      DROP POLICY IF EXISTS "Users can read their own transactions" ON transactions;
      DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;
      DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
      DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
      
      -- إعادة إنشاء السياسات
      CREATE POLICY "Users can read their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can create their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete their own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION WHEN OTHERS THEN
      -- تجاهل الأخطاء
    END;
  END IF;
  
  -- التحقق من وجود سياسات RLS على جدول الميزانية
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
    BEGIN
      -- تفعيل RLS
      ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
      
      -- إزالة السياسات الموجودة إذا كانت موجودة
      DROP POLICY IF EXISTS "Users can read their own budgets" ON budgets;
      DROP POLICY IF EXISTS "Users can create their own budgets" ON budgets;
      DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
      DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;
      
      -- إعادة إنشاء السياسات
      CREATE POLICY "Users can read their own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can create their own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete their own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION WHEN OTHERS THEN
      -- تجاهل الأخطاء
    END;
  END IF;
  
  -- التحقق من وجود سياسات RLS على جدول إعدادات المستخدم
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_settings') THEN
    BEGIN
      -- تفعيل RLS
      ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
      
      -- إزالة السياسات الموجودة إذا كانت موجودة
      DROP POLICY IF EXISTS "Users can read their own settings" ON user_settings;
      DROP POLICY IF EXISTS "Users can create their own settings" ON user_settings;
      DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
      DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;
      
      -- إعادة إنشاء السياسات
      CREATE POLICY "Users can read their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can create their own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete their own settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION WHEN OTHERS THEN
      -- تجاهل الأخطاء
    END;
  END IF;
  
  -- التحقق من وجود سياسات RLS على جدول الحسابات
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accounts') THEN
    BEGIN
      -- تفعيل RLS
      ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
      
      -- إزالة السياسات الموجودة إذا كانت موجودة
      DROP POLICY IF EXISTS "Users can read their own accounts" ON accounts;
      DROP POLICY IF EXISTS "Users can create their own accounts" ON accounts;
      DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
      DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;
      
      -- إعادة إنشاء السياسات
      CREATE POLICY "Users can read their own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can create their own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete their own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION WHEN OTHERS THEN
      -- تجاهل الأخطاء
    END;
  END IF;
END $$; 