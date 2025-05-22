import { supabase } from '../lib/supabase';

export async function ensureAuthenticated() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error('فشل في التحقق من الجلسة');
  }
  
  if (!session) {
    throw new Error('يجب تسجيل الدخول للمتابعة');
  }
  
  return session;
}
