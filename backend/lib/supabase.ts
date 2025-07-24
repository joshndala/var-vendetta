import { createClient } from '@supabase/supabase-js';
import { runStartupValidation } from './startup-validation';

// Run startup validation (now more lenient)
runStartupValidation();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client
export const supabase = (() => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Missing Supabase environment variables - some features may not work');
    // Create a dummy client to prevent crashes
    return createClient('https://dummy.supabase.co', 'dummy-key');
  } else {
    return createClient(supabaseUrl, supabaseKey);
  }
})();

// Database initialization function
export async function initializeDatabase() {
  try {
    // Test the connection
    const { data, error } = await supabase.from('sessions').select('count').limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Initialize database on first import
if (process.env.NODE_ENV === 'development') {
  initializeDatabase().catch(error => {
    console.error('Failed to initialize database on startup:', error);
  });
} 