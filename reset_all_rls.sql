-- تعطيل RLS تماماً لجميع الجداول
DO $$
DECLARE
    _tbl text;
BEGIN
    FOR _tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', _tbl);
            RAISE NOTICE 'Disabled RLS for table %', _tbl;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error disabling RLS for table %: %', _tbl, SQLERRM;
        END;
    END LOOP;
END $$;

-- حذف جميع السياسات الموجودة
DO $$
DECLARE
    _tbl text;
    _pol text;
BEGIN
    FOR _tbl, _pol IN (
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    )
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', _pol, _tbl);
        EXCEPTION WHEN OTHERS THEN
            -- تجاهل الأخطاء
        END;
    END LOOP;
END $$;

-- إعادة تفعيل RLS لجميع الجداول
DO $$
DECLARE
    _tbl text;
BEGIN
    FOR _tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', _tbl);
        EXCEPTION WHEN OTHERS THEN
            -- تجاهل الأخطاء
        END;
    END LOOP;
END $$;

-- إنشاء سياسة واحدة بسيطة لكل جدول تسمح بالوصول الكامل لجميع المستخدمين
DO $$
DECLARE
    _tbl text;
BEGIN
    FOR _tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        BEGIN
            EXECUTE format('CREATE POLICY "full_access_policy" ON %I FOR ALL TO authenticated USING (true)', _tbl);
        EXCEPTION WHEN OTHERS THEN
            -- تجاهل الأخطاء
        END;
    END LOOP;
END $$;

-- التحقق من حالة RLS لكل جدول
SELECT
    n.nspname AS schema,
    c.relname AS table,
    CASE WHEN c.relrowsecurity THEN 'RLS enabled' ELSE 'RLS disabled' END AS rls_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'r'
ORDER BY c.relname;

-- التحقق من سياسات RLS الموجودة
SELECT
    n.nspname AS schema,
    c.relname AS table,
    pol.polname AS policy_name
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, pol.polname;
