import { createClient } from '@supabase/supabase-js';
import './startup-validation';

// For local development, use the local Supabase instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database initialization function
async function initializeDatabase() {
  try {
    // Test the connection by running a simple query
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
    } else {
      console.log('Database connection successful');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on first import
if (process.env.NODE_ENV === 'development') {
  initializeDatabase().catch(error => {
    console.error('Failed to initialize database on startup:', error);
  });
}

export default supabase; 