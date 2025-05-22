// هذا الملف لتسجيل الدخول مباشرة إلى Supabase
// يمكنك تشغيله باستخدام Node.js: node login-direct.js

const { createClient } = require('@supabase/supabase-js');

// معلومات الاتصال بقاعدة البيانات
const SUPABASE_URL = 'https://polfltbnbzdwdfznlxwp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbGZsdGJuYnpkd2Rmem5seHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDU4ODksImV4cCI6MjA2MzEyMTg4OX0.KwJNDuDBMLDbBftujEtD_CGwEk6n6WuOBm09O5b1Lhw';

// بيانات المستخدم للتسجيل
const USER_EMAIL = 'admin@system.com';
const USER_PASSWORD = 'Admin123456';

async function loginUser() {
  try {
    // إنشاء عميل Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // محاولة تسجيل الدخول
    const { data, error } = await supabase.auth.signInWithPassword({
      email: USER_EMAIL,
      password: USER_PASSWORD
    });

    if (error) throw error;

    console.log('تم تسجيل الدخول بنجاح!');
    console.log('معلومات المستخدم:', data.user);
    console.log('رمز الجلسة:', data.session.access_token);
    
    // هذا الرمز مهم لإجراء العمليات التي تتطلب مصادقة
    console.log('\nيمكنك استخدام هذا الرمز في طلبات API:');
    console.log('Authorization: Bearer ' + data.session.access_token);

  } catch (error) {
    console.error('فشل تسجيل الدخول:', error.message);
  }
}

loginUser(); 