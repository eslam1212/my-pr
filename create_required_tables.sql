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
      CONSTRAINT categories_type_check CHECK (type_category IN ('income', 'expense')),
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
    
    -- إضافة سياسة للقراءة للمستخدمين المصادق عليهم
    CREATE POLICY "Authenticated users can read all categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  
  -- فحص جدول المعاملات
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    CREATE TABLE transactions (
      id BIGSERIAL PRIMARY KEY,
      date DATE NOT NULL,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type_transaction TEXT NOT NULL,
      CONSTRAINT transactions_type_check CHECK (type_transaction IN ('income', 'expense')),
      category TEXT NOT NULL,
      reference TEXT,
      status TEXT NOT NULL,
      CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'completed', 'cancelled')),
      payment_method TEXT,
      account_id BIGINT,
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
    
    -- إضافة سياسة للقراءة للمستخدمين المصادق عليهم
    CREATE POLICY "Authenticated users can read all transactions" ON transactions FOR SELECT USING (auth.role() = 'authenticated');
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
    
    -- إضافة سياسة للقراءة للمستخدمين المصادق عليهم
    CREATE POLICY "Authenticated users can read all budgets" ON budgets FOR SELECT USING (auth.role() = 'authenticated');
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
    
    -- إضافة سياسة للقراءة للمستخدمين المصادق عليهم
    CREATE POLICY "Authenticated users can read all settings" ON user_settings FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- Return success result
  result := json_build_object(
    'success', true,
    'message', 'Required tables created or already exist'
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error result
  result := json_build_object(
    'success', false,
    'message', SQLERRM,
    'error_code', SQLSTATE
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_required_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION create_required_tables() TO anon;
