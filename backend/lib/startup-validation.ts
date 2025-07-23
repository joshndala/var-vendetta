import { validateEnvironmentVariables } from './env-validation';

// Run validation on startup
export function runStartupValidation() {
  try {
    validateEnvironmentVariables();
    console.log('✅ Environment validation passed');
  } catch (error) {
    console.error('❌ Environment validation failed:', error instanceof Error ? error.message : 'Unknown error');
    // In production, you might want to exit the process
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting due to environment validation failure');
      process.exit(1);
    }
  }
}

// Run validation immediately when this module is imported
runStartupValidation(); 