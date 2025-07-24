import { validateEnvironmentVariables } from './env-validation';

// Run validation on startup
export function runStartupValidation() {
  try {
    const isValid = validateEnvironmentVariables();
    if (isValid) {
      console.log('✅ Environment validation passed');
    } else {
      console.warn('⚠️ Environment validation failed - continuing with warnings');
    }
  } catch (error) {
    console.error('❌ Environment validation error:', error instanceof Error ? error.message : 'Unknown error');
    console.warn('⚠️ Continuing despite validation errors');
  }
}

// Run validation immediately when this module is imported
runStartupValidation(); 