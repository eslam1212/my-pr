-- التحقق من وجود الجداول
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

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
    pol.polname AS policy_name,
    CASE pol.polpermissive WHEN 't' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS permissive,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, pol.polname;
