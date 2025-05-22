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
            RAISE NOTICE 'Dropped policy % on table %', _pol, _tbl;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error dropping policy % on table %: %', _pol, _tbl, SQLERRM;
        END;
    END LOOP;
END $$;

-- إضافة سياسة تسمح بالوصول الكامل للمسؤول
DO $$ 
DECLARE
    _tbl text;
BEGIN
    FOR _tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', _tbl);
            RAISE NOTICE 'Forced RLS for table %', _tbl;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error forcing RLS for table %: %', _tbl, SQLERRM;
        END;
    END LOOP;
END $$;

-- التحقق من حالة RLS لكل جدول
SELECT 
    n.nspname AS schema,
    c.relname AS table,
    CASE WHEN c.relrowsecurity THEN 'RLS enabled' ELSE 'RLS disabled' END AS rls_status,
    CASE WHEN c.relforcerowsecurity THEN 'RLS forced' ELSE 'RLS not forced' END AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'r'
ORDER BY c.relname;
