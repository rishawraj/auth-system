// import eslint from "@eslint/js";
// import importPlugin from "eslint-plugin-import";
// import a11yPlugin from "eslint-plugin-jsx-a11y";
// import reactPlugin from "eslint-plugin-react";
// import reactHooksPlugin from "eslint-plugin-react-hooks";
// import reactRefreshPlugin from "eslint-plugin-react-refresh";
// import globals from "globals";
// import tseslint from "typescript-eslint";

// export default tseslint.config(
//   eslint.configs.recommended,
//   ...tseslint.configs.recommended,
//   {
//     languageOptions: {
//       ecmaVersion: 2022,
//       sourceType: "module",
//       globals: {
//         ...globals.browser,
//         ...globals.es2021,
//         ...globals.node,
//       },
//       parserOptions: {
//         ecmaFeatures: {
//           jsx: true,
//         },
//       },
//     },
//     plugins: {
//       react: reactPlugin,
//       "react-hooks": reactHooksPlugin,
//       "react-refresh": reactRefreshPlugin,
//       import: importPlugin,
//       "jsx-a11y": a11yPlugin,
//     },
//     settings: {
//       react: {
//         version: "detect",
//       },
//     },
//     rules: {
//       // React rules
//       "react/prop-types": "off", // TypeScript handles prop types
//       "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
//       "react-hooks/rules-of-hooks": "error",
//       "react-hooks/exhaustive-deps": "warn",
//       "react-refresh/only-export-components": [
//         "warn",
//         { allowConstantExport: true },
//       ],

//       // TypeScript specific rules
//       "@typescript-eslint/explicit-function-return-type": "off",
//       "@typescript-eslint/explicit-module-boundary-types": "off",
//       "@typescript-eslint/no-explicit-any": "warn",
//       "@typescript-eslint/no-unused-vars": [
//         "warn",
//         { argsIgnorePattern: "^_" },
//       ],

//       // Import rules
//       "import/order": [
//         "warn",
//         {
//           groups: [
//             "builtin",
//             "external",
//             "internal",
//             "parent",
//             "sibling",
//             "index",
//           ],
//           "newlines-between": "always",
//           alphabetize: { order: "asc", caseInsensitive: true },
//         },
//       ],
//       "import/no-duplicates": "error",

//       // Accessibility
//       "jsx-a11y/alt-text": "warn",
//       "jsx-a11y/anchor-has-content": "warn",
//       "jsx-a11y/anchor-is-valid": "warn",
//       "jsx-a11y/aria-props": "warn",
//       "jsx-a11y/aria-role": "warn",
//       "jsx-a11y/role-has-required-aria-props": "warn",
//     },
//   },
//   // For test files
//   {
//     files: [
//       "**/*.test.{ts,tsx}",
//       "**/*.spec.{ts,tsx}",
//       "**/test/**/*.{ts,tsx}",
//       "vitest.config.ts",
//     ],
//     rules: {
//       "@typescript-eslint/no-explicit-any": "off",
//       "@typescript-eslint/no-non-null-assertion": "off",
//     },
//   },
//   // For React components
//   {
//     files: ["**/*.tsx"],
//     rules: {
//       "react/display-name": "off",
//     },
//   },
//   // For configuration files
//   {
//     files: ["*.config.{js,ts}", "vite.config.ts"],
//     rules: {
//       "import/no-default-export": "off",
//     },
//   },
// );

import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import a11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Ignore patterns - exclude dist directory and other common build artifacts
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/build/**",
      ".git",
      "**/.vite/**",
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-refresh": reactRefreshPlugin,
      import: importPlugin,
      "jsx-a11y": a11yPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules
      "react/prop-types": "off", // TypeScript handles prop types
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // TypeScript specific rules
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],

      // Import rules
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",

      // Accessibility
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-role": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
    },
  },
  // For test files
  {
    files: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/test/**/*.{ts,tsx}",
      "vitest.config.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  // For React components
  {
    files: ["**/*.tsx"],
    rules: {
      "react/display-name": "off",
    },
  },
  // For configuration files
  {
    files: ["*.config.{js,ts}", "vite.config.ts"],
    rules: {
      "import/no-default-export": "off",
    },
  },
);
