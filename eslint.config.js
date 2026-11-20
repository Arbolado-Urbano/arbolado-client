import js from "@eslint/js"
import tsParser from "@typescript-eslint/parser"
import globals from "globals"

export default [
  {
    ...js.configs.recommended,
    files: ["src/**/*.ts"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-undef": "off", // TypeScript handles this better
      "no-unused-vars": "off", // TypeScript handles this better
      "no-control-regex": "off",
    },
  },
]
