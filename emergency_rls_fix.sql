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
DO $$ 
DECLARE
    _tbl text;
BEGIN
    FOR _tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        BEGIN
            EXECUTE format('CREATE POLICY "Allow all for authenticated users" ON %I FOR ALL USING (auth.role() = ''authenticated'')', _tbl);
        EXCEPTION WHEN OTHERS THEN
            -- تجاهل الأخطاء
        END;
    END LOOP;
END $$;
