-- تعطيل رسائل الأخطاء للعمليات التي لا تجد الكائنات المطلوبة
SET client_min_messages TO WARNING;

-- محاولة حذف جميع الجداول المحتملة - لاحظ أن عدم وجود الجداول لن يسبب أخطاء مرئية
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- لحذف جميع الجداول الموجودة في المخطط العام
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- لحذف جميع المؤشرات في المخطط العام (إذا كانت لا تُحذف مع الجداول)
    FOR r IN (SELECT indexname FROM pg_indexes WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname) || ' CASCADE';
    END LOOP;
    
    -- لحذف جميع الدوال في المخطط العام
    FOR r IN (SELECT proname FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '() CASCADE';
    END LOOP;
END $$;

-- إعادة تفعيل رسائل الأخطاء
RESET client_min_messages;

-- تأكيد للمستخدم
DO $$ 
BEGIN 
    RAISE NOTICE 'تم مسح قاعدة البيانات بنجاح. يمكنك الآن تشغيل ملف الإعداد الجديد.';
END $$; 