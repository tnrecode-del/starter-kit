import { baseConfig } from "@core/config-eslint";

export default [
  ...baseConfig,
  {
    // Специфичные правила для NestJS (например, для декораторов)
    rules: {
      "@typescript-eslint/interface-name-prefix": "off",
    },
  },
];
