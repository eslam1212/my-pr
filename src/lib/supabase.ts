import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// معلومات الاتصال بقاعدة البيانات
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a single instance of Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: localStorage,
    storageKey: 'supabase-auth-token',
    flowType: 'implicit'
  },
  global: {
    headers: {
      'X-Client-Info': 'accounting-system'
    }
  }
});

// Add debug logs for auth events
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event);
  console.log('Session exists:', !!session);
  if (session) {
    console.log('User ID:', session.user.id);
    localStorage.setItem('supabase_access_token', session.access_token);
  } else if (event === 'SIGNED_OUT') {
    localStorage.removeItem('supabase_access_token');
  }
});

// Check for existing session immediately
export const initializeAuth = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting auth session:', error);
      return false;
    }
    
    if (data?.session) {
      console.log('Existing session found');
      localStorage.setItem('supabase_access_token', data.session.access_token);
      return true;
    }
    
    console.warn('No active auth session');
    return false;
  } catch (err) {
    console.error('Auth initialization error:', err);
    return false;
  }
};

// Function to check database connection
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// إنشاء بيانات أولية (تصنيفات افتراضية)
async function createInitialData() {
  try {
    // First check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('User not authenticated. Cannot create initial data.');
      return false;
    }

    // إنشاء تصنيفات افتراضية للإيرادات
    const incomeCategories = [
      { name: 'رواتب', type: 'income', user_id: session.user.id },
      { name: 'مبيعات', type: 'income', user_id: session.user.id },
      { name: 'استثمارات', type: 'income', user_id: session.user.id },
      { name: 'أخرى', type: 'income', user_id: session.user.id }
    ];

    // إنشاء تصنيفات افتراضية للمصروفات
    const expenseCategories = [
      { name: 'مشتريات', type: 'expense', user_id: session.user.id },
      { name: 'رواتب موظفين', type: 'expense', user_id: session.user.id },
      { name: 'إيجار', type: 'expense', user_id: session.user.id },
      { name: 'مرافق', type: 'expense', user_id: session.user.id },
      { name: 'مصاريف تسويق', type: 'expense', user_id: session.user.id },
      { name: 'أخرى', type: 'expense', user_id: session.user.id }
    ];

    // إضافة التصنيفات
    for (const category of [...incomeCategories, ...expenseCategories]) {
      const { error } = await supabase
        .from('categories')
        .insert(category)
        .select();

      if (error && error.code !== '23505') { // تجاهل خطأ التكرار
        console.error(`Error adding category ${category.name}:`, error);
      }
    }

    console.log('Default categories created successfully');
    return true;
  } catch (error) {
    console.error('Error creating initial data:', error);
    return false;
  }
}

// إنشاء بيانات أولية
export async function initializeData() {
  try {
    // First ensure we have a valid session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      console.warn('No active session found. Please sign in to initialize data.');
      return false;
    }

    // Store the token to ensure it's available for subsequent requests
    localStorage.setItem('supabase_access_token', sessionData.session.access_token);

    // Force token refresh to ensure we have a fresh token
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('Token refresh failed:', refreshError);
      } else if (refreshData?.session) {
        localStorage.setItem('supabase_access_token', refreshData.session.access_token);
        localStorage.setItem('last_token_refresh_time', Date.now().toString());
        console.log('Token refreshed successfully before database initialization');
      }
    } catch (refreshError) {
      console.warn('Error during token refresh:', refreshError);
    }

    try {
      // التحقق من وجود الجداول وإنشائها إذا لم تكن موجودة
      const { data: rpcData, error: createTablesError } = await supabase.rpc('create_required_tables');

      if (createTablesError) {
        console.warn('Note: create_required_tables RPC function not found or failed:', createTablesError);
        console.log('You may need to run the create_required_tables.sql script in the Supabase SQL editor');
      } else {
        console.log('RPC create_required_tables result:', rpcData);
      }
    } catch (error) {
      console.warn('Error calling create_required_tables RPC:', error);
      // Continue execution rather than throwing
    }

    // Try to check for categories, but handle if table doesn't exist
    try {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('count');

      if (categoriesError) {
        if (categoriesError.code === '42P01') {
          console.warn('Categories table does not exist yet. Database setup may be needed.');
        } else if (categoriesError.code === '42501') {
          console.error('Permission denied for table categories. Check RLS policies.');
        } else {
          console.error('Error checking categories:', categoriesError);
        }
      } else if (!categories || categories.length === 0) {
        // إذا لم تكن هناك تصنيفات، قم بإنشاء بيانات أولية
        await createInitialData();
      }
    } catch (error) {
      console.warn('Error checking categories:', error);
    }

    return true;
  } catch (error) {
    console.error('Error initializing data:', error);
    return false;
  }
}

// التحقق من الاتصال عند بدء التطبيق
checkConnection().then(isConnected => {
  if (isConnected) {
    // محاولة إنشاء بيانات أولية
    initializeData();
  } else {
    console.error('Failed to connect to Supabase');
  }
});
