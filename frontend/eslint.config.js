import { defineConfig } from "eslint/config";
import globals from "globals";

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
        ...globals.browser,
        ...globals.node,
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
