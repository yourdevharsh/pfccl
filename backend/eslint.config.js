import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,jsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },

      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },

    rules: {
      "no-undef": "error",
      // "no-unused-vars": [
      //   "error",
      //   {
      //     args: "none",
      //     caughtErrors: "none",
      //   },
      // ],
      "no-unreachable": "error",
    },
  },
]);
