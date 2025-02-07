// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    ignores: ["dist/", "node_modules/"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // Basic TypeScript rules
      "@typescript-eslint/no-unused-vars": ["warn", { "ignoreRestSiblings": true }],
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-explicit-any": "off", // Allow any for initial flexibility
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-floating-promises": "warn",

      // Basic code quality rules
      "no-console": "off", // Allow console logs for development
      "prefer-const": "warn",
      "no-var": "warn",
      eqeqeq: ["warn", "always"],

      // Light complexity rules
      complexity: ["warn", { max: 20 }], // More permissive complexity
      "max-depth": ["warn", { max: 4 }],
      "max-lines-per-function": ["warn", { max: 100 }],

      // Error prevention
      "import/no-duplicates": "error", // Using import plugin's rule instead
      "no-template-curly-in-string": "warn",

      // Format and whitespace
      "max-len": [
        "warn",
        {
          code: 120, // More permissive line length
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],

      // Import rules
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          ts: "never",
          tsx: "never",
        },
      ],
    },
  }
);