import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
    globals: true,
    // Default timeout for all tests
    testTimeout: 10000,
    // Timeout for hook operations
    hookTimeout: 10000,
    // Specific environment configurations
    environmentOptions: {
      // Browser-specific timeouts when running browser tests
      browser: {
        testTimeout: 30000,
        hookTimeout: 30000,
      },
    },
    // Browser tests configuration
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
    },
  },
});
