import js from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import tsParser from "@typescript-eslint/parser"
import globals from "globals"

export default [
  {
    ...js.configs.recommended,
    files: ["app/**/*.{ts,tsx}"],
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-undef": "off", // TypeScript handles this better
      "no-unused-vars": "off", // TypeScript handles this better
      "no-control-regex": "off",
    },
  },
]