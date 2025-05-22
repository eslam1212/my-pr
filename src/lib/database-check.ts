import { supabase } from './supabase';

export async function checkDatabaseConnection() {
  try {
    console.log('Checking database connection...');
    const { data, error } = await supabase.from('sales').select('count').single();
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// تحقق من وجود الجداول المطلوبة
export async function checkRequiredTables() {
  const requiredTables = [
    'sales',
    'sale_items',
    'products',
    'customers',
    'suppliers',
    'accounts',
    'transactions'
  ];

  console.log('Checking required tables...');
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table).select('count').single();
      
      if (error) {
        console.error(`Error checking table ${table}:`, error);
        return false;
      }
      
      console.log(`Table ${table} exists`);
    } catch (error) {
      console.error(`Error checking table ${table}:`, error);
      return false;
    }
  }
  
  console.log('All required tables exist');
  return true;
}
