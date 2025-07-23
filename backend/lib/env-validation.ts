// Environment variable validation to prevent sensitive data exposure

export function validateEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'COHERE_API_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate API key formats (basic checks)
  const cohereApiKey = process.env.COHERE_API_KEY;
  if (cohereApiKey && cohereApiKey.length < 10) {
    throw new Error('Invalid COHERE_API_KEY format');
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseKey && !supabaseKey.startsWith('eyJ')) {
    throw new Error('Invalid SUPABASE_SERVICE_ROLE_KEY format');
  }

  console.log('Environment variables validated successfully');
}

// Sanitize error messages to prevent sensitive data exposure
export function sanitizeError(error: any): string {
  if (typeof error === 'string') {
    // Remove any potential API keys or URLs from error messages
    return error
      .replace(/sk-[a-zA-Z0-9]{48}/g, '[API_KEY_HIDDEN]')
      .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[JWT_TOKEN_HIDDEN]')
      .replace(/https?:\/\/[^\s]+/g, '[URL_HIDDEN]')
      .replace(/postgresql:\/\/[^\s]+/g, '[DATABASE_URL_HIDDEN]');
  }
  
  if (error instanceof Error) {
    return sanitizeError(error.message);
  }
  
  return 'Unknown error occurred';
}

// Safe logging function that prevents sensitive data exposure
export function safeLog(message: string, data?: any) {
  if (data) {
    // Sanitize any data before logging
    const sanitizedData = JSON.stringify(data, (key, value) => {
      if (typeof value === 'string') {
        // Hide sensitive fields
        if (key.toLowerCase().includes('key') || 
            key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('url')) {
          return '[HIDDEN]';
        }
        // Hide long strings that might be API responses
        if (value.length > 200) {
          return `[TRUNCATED: ${value.length} chars]`;
        }
      }
      return value;
    });
    console.log(message, sanitizedData);
  } else {
    console.log(message);
  }
} 