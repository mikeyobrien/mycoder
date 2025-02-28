# Sentry.io Integration

MyCoder CLI now includes integration with Sentry.io for error tracking and monitoring.

## How It Works

The Sentry.io integration is initialized at the start of the CLI application to capture any errors that occur during execution. This helps us identify and fix issues more quickly.

## Installation

The Sentry Node SDK is included as a dependency in the CLI package:

```bash
npm install @sentry/node --save
```

## Configuration

By default, Sentry is:
- Enabled in production environments
- Disabled in development environments (unless explicitly enabled)
- Configured to capture 100% of transactions

### Environment Variables

You can control Sentry behavior with the following environment variables:

- `NODE_ENV`: Set to "production" to enable Sentry (default behavior)
- `ENABLE_SENTRY`: Set to "true" to explicitly enable Sentry in any environment
- `SENTRY_DSN`: Override the default Sentry DSN (optional)

### Command Line Options

You can also configure Sentry through command-line options:

```bash
# Use a custom Sentry DSN
mycoder --sentryDsn="https://your-custom-dsn@sentry.io/project"
```

## Version Tracking

All errors reported to Sentry include the package version information in the format `mycoder@x.y.z`. This allows us to trace errors to specific releases and understand which versions of the software are affected by particular issues.

## Implementation Details

The Sentry SDK is initialized as early as possible in the application lifecycle:

```javascript
import * as Sentry from '@sentry/node';
import { createRequire } from 'module';

// Initialize Sentry with version information
Sentry.init({
  dsn: 'https://2873d2518b60f645918b6a08ae5e69ae@o4508898407481344.ingest.us.sentry.io/4508898476687360',
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
  release: `mycoder@${packageVersion}`,
  enabled: process.env.NODE_ENV !== 'development' || process.env.ENABLE_SENTRY === 'true',
});

// Capture errors
try {
  // Application code
} catch (error) {
  Sentry.captureException(error);
}
```

## Testing Sentry Integration

A hidden command is available to test the Sentry integration:

```bash
mycoder test-sentry
```

This command will:
1. Generate a test error that includes the package version
2. Report it to Sentry.io
3. Output the result to the console

Note: In development environments, you may need to set `ENABLE_SENTRY=true` for the test to actually send data to Sentry.

## Privacy

Error reports sent to Sentry include:
- Stack traces
- Error messages
- Environment information
- Release version

Personal or sensitive information is not intentionally collected. If you discover any privacy concerns with the Sentry integration, please report them to the project maintainers.
