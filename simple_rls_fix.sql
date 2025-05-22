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

-- إنشاء سياسة واحدة بسيطة لكل جدول تسمح للمستخدمين المصادق عليهم بالوصول الكامل
CREATE POLICY "Allow all for authenticated users" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON transactions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON budgets
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON user_settings
  FOR ALL USING (auth.role() = 'authenticated');
