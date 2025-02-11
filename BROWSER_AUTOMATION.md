# Browser Automation

## Overview

This document describes the browser automation capabilities implemented in the project, combining both the original planning and the current implementation status.

## Key Features

- Browser session management
- Page control and interaction
- Screenshot capture
- Resource cleanup and management
- Error handling
- Type-safe API

## Architecture

The browser automation system is implemented as a modular system with the following core components:

### BrowserManager
Handles browser session lifecycle, including:
- Session creation and cleanup
- Context management
- Resource optimization

### PageController
Manages page interactions:
- Navigation
- Element selection and interaction
- State management
- Event handling

### ScreenshotManager
Provides screenshot capabilities:
- Full page captures
- Element-specific captures
- Screenshot storage and management

## Installation & Setup

```bash
npm install @mycoder/browser-automation
```

### Configuration

Basic configuration example:
```typescript
import { BrowserAutomation } from '@mycoder/browser-automation';

const browser = new BrowserAutomation({
  headless: true,
  defaultViewport: { width: 1920, height: 1080 }
});
```

## Usage Examples

### Basic Navigation
```typescript
const page = await browser.newPage();
await page.navigate('https://example.com');
await page.waitForSelector('.main-content');
```

### Interacting with Elements
```typescript
await page.click('#submit-button');
await page.type('#search-input', 'search term');
```

### Taking Screenshots
```typescript
await page.screenshot({
  path: './screenshot.png',
  fullPage: true
});
```

## Error Handling

The system implements comprehensive error handling:

- Browser-specific errors are wrapped in custom error types
- Automatic retry mechanisms for flaky operations
- Resource cleanup on failure
- Detailed error messages and stack traces

## Resource Management

Resources are managed automatically:

- Browser sessions are cleaned up when no longer needed
- Memory usage is optimized
- Concurrent sessions are managed efficiently
- Automatic page context cleanup

## Testing & Debugging

### Running Tests
```bash
npm test
```

### Debugging

Debug logs can be enabled via environment variables:
```bash
DEBUG=browser-automation:* npm test
```

## API Reference

### BrowserAutomation
Main class providing browser automation capabilities.

#### Methods
- `newPage()`: Creates a new page session
- `close()`: Closes all browser sessions
- `screenshot()`: Captures screenshots
- `evaluate()`: Evaluates JavaScript in the page context

### PageController
Handles page-specific operations.

#### Methods
- `navigate(url: string)`: Navigates to URL
- `click(selector: string)`: Clicks element
- `type(selector: string, text: string)`: Types text
- `waitForSelector(selector: string)`: Waits for element

### ScreenshotManager
Manages screenshot operations.

#### Methods
- `capture(options: ScreenshotOptions)`: Takes screenshot
- `saveToFile(path: string)`: Saves screenshot to file

## Future Enhancements

The following features are planned for future releases:

- Network monitoring capabilities
- Video recording support
- Trace viewer integration
- Extended cross-browser support
- Enhanced selector handling module

## Migration Guide

When upgrading from previous versions:

1. Update import paths to use new structure
2. Replace deprecated methods with new alternatives
3. Update configuration objects to match new schema
4. Test thoroughly after migration

## Best Practices

1. Always clean up resources:
```typescript
try {
  const browser = new BrowserAutomation();
  // ... operations
} finally {
  await browser.close();
}
```

2. Use typed selectors:
```typescript
const selector: SelectorOptions = {
  type: 'css',
  value: '.main-content'
};
```

3. Implement proper error handling:
```typescript
try {
  await page.click('#button');
} catch (error) {
  if (error instanceof ElementNotFoundError) {
    // Handle missing element
  }
  throw error;
}
```

## Contributing

Please see CONTRIBUTING.md for guidelines on contributing to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.