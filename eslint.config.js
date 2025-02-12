// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"],
  },
  ...tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
      files: ["src/**/*.{js,ts}", "tests/**/*.{js,ts}", "bin/**/*.{js,ts}"],
      plugins: {
        import: importPlugin,
        "unused-imports": unusedImports,
      },
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        parser: tseslint.parser,
      },
      rules: {
        // Basic TypeScript rules
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            ignoreRestSiblings: true,
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
        "unused-imports/no-unused-imports": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-floating-promises": "off",

        // Basic code quality rules
        "no-console": "off",
        "prefer-const": "warn",
        "no-var": "warn",
        eqeqeq: ["warn", "always"],

        // Light complexity rules
        complexity: ["warn", { max: 20 }],
        "max-depth": ["warn", { max: 4 }],
        "max-lines-per-function": ["warn", { max: 150 }],

        // Error prevention
        "import/no-duplicates": "error",
        "no-template-curly-in-string": "warn",

        // Format and whitespace
        "max-len": [
          "warn",
          {
            code: 120,
            ignoreComments: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
          },
        ],

        // Import rules
        "import/extensions": ["off"],
        "import/no-unresolved": "off",

        // Disable specific TypeScript rules that require type information
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
      },
    }
  ),
];
