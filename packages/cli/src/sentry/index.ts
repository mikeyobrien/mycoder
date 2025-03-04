import { createRequire } from 'module';

import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry for error tracking
 * @param dsn Optional custom DSN to use instead of the default
 */
export function initSentry(dsn?: string) {
  // Get package version using createRequire for ES modules
  let packageVersion = 'unknown';
  try {
    const require = createRequire(import.meta.url);
    packageVersion =
      process.env.npm_package_version || require('../../package.json').version;
  } catch (error) {
    console.warn('Could not determine package version for Sentry:', error);
  }

  // Initialize Sentry
  Sentry.init({
    // Default DSN from Sentry.io integration instructions
    dsn:
      dsn ||
      'https://2873d2518b60f645918b6a08ae5e69ae@o4508898407481344.ingest.us.sentry.io/4508898476687360',

    // No profiling integration as requested

    // Capture 100% of the transactions
    tracesSampleRate: 1.0,

    // Set environment based on NODE_ENV
    environment: process.env.NODE_ENV || 'development',

    // Add release version from package.json
    release: `mycoder@${packageVersion}`,

    // Don't capture errors in development mode unless explicitly enabled
    enabled:
      process.env.NODE_ENV !== 'development' ||
      process.env.ENABLE_SENTRY === 'true',
  });
}

/**
 * Capture an exception with Sentry
 * @param error Error to capture
 */
export function captureException(error: Error | unknown) {
  Sentry.captureException(error);
}

/**
 * Capture a message with Sentry
 * @param message Message to capture
 * @param level Optional severity level
 */
export function captureMessage(message: string, level?: Sentry.SeverityLevel) {
  Sentry.captureMessage(message, level);
}

/**
 * Test Sentry error reporting by throwing a test error
 */
export function testSentryErrorReporting() {
  try {
    // Get package version for the error message
    let packageVersion = 'unknown';
    try {
      const require = createRequire(import.meta.url);
      packageVersion =
        process.env.npm_package_version ||
        require('../../package.json').version;
    } catch (error) {
      console.warn(
        'Could not determine package version for test error:',
        error,
      );
    }

    // Throw a test error with version information
    throw new Error(
      `Test error for Sentry.io integration from mycoder@${packageVersion}`,
    );
  } catch (error) {
    // Capture the error with Sentry
    Sentry.captureException(error);

    // Log a message about the test
    console.log('Test error sent to Sentry.io');

    // Return the error for inspection
    return error;
  }
}
