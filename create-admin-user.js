// هذا الملف لإنشاء مستخدم مسؤول في Supabase
// يمكنك تشغيله باستخدام Node.js: node create-admin-user.js

import { createClient } from '@supabase/supabase-js';

// معلومات الاتصال بقاعدة البيانات
const SUPABASE_URL = 'https://polfltbnbzdwdfznlxwp.supabase.co';
// للحصول على مفتاح الخدمة (service key):
// 1. قم بتسجيل الدخول إلى لوحة تحكم Supabase
// 2. اختر مشروعك
// 3. اذهب إلى Settings > API
// 4. انسخ "service_role key" وضعه هنا
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbGZsdGJuYnpkd2Rmem5seHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDU4ODksImV4cCI6MjA2MzEyMTg4OX0.KwJNDuDBMLDbBftujEtD_CGwEk6n6WuOBm09O5b1Lhw';
// ملاحظة: هذا هو مفتاح anon وليس مفتاح service_role
// لإنشاء مستخدم مسؤول تحتاج إلى مفتاح service_role من لوحة تحكم Supabase

// بيانات المستخدم المسؤول - يمكنك استخدام هذه البيانات للدخول
const ADMIN_EMAIL = 'eslam121212@gmail.com';
const ADMIN_PASSWORD = 'Admin123456';
const ADMIN_NAME = 'مدير النظام';

async function createAdminUser() {
  try {
    // إنشاء عميل Supabase باستخدام مفتاح الوصول العام
    // ملاحظة: هذا لن يسمح بإنشاء مستخدم مسؤول، تحتاج إلى مفتاح service_role
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // محاولة تسجيل مستخدم عادي
    const { data, error } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: {
          name: ADMIN_NAME,
          role: 'admin',
          permissions: [
            'users.manage',
            'customers.manage',
            'suppliers.manage',
            'products.manage',
            'invoices.manage',
            'reports.view',
            'settings.manage'
          ]
        }
      }
    });

    if (error) throw error;

    console.log('تم إنشاء المستخدم بنجاح! يرجى التحقق من البريد الإلكتروني لتأكيد الحساب.');
    console.log('\nيمكنك الآن تسجيل الدخول باستخدام:');
    console.log('البريد الإلكتروني:', ADMIN_EMAIL);
    console.log('كلمة المرور:', ADMIN_PASSWORD);

  } catch (error) {
    console.error('حدث خطأ أثناء إنشاء المستخدم:', error.message);
  }
}

createAdminUser(); 