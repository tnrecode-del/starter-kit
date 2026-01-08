import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export const baseConfig = tseslint.config(
  // 1. Сначала игнорируемые файлы (должно быть первым объектом)
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/build/**",
      "**/generated/**",
    ],
  },

  // 2. Базовые конфиги
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Твои правила
  {
    languageOptions: {
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },

  // 4. Отключение конфликтующих правил (Prettier)
  prettier
);

export default baseConfig;
