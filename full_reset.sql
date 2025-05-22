-- حذف جميع الجداول والوظائف والمحفزات
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- إعادة منح الأذونات الافتراضية
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- إنشاء جدول التصنيفات
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

-- إنشاء جدول المعاملات
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

-- إنشاء جدول الميزانية
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

-- إنشاء جدول إعدادات المستخدم
CREATE TABLE user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إنشاء وظيفة لتحديث حقل updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفزات لتحديث حقل updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- إنشاء وظيفة RPC لإنشاء الجداول المطلوبة
CREATE OR REPLACE FUNCTION create_required_tables()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  result := json_build_object(
    'success', true,
    'message', 'Required tables created or already exist'
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'message', SQLERRM,
    'error_code', SQLSTATE
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح صلاحيات التنفيذ للمستخدمين المصادق عليهم
GRANT EXECUTE ON FUNCTION create_required_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION create_required_tables() TO anon;

-- منح صلاحيات الوصول للجداول
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
