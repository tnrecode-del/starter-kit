import { baseConfig } from "@core/config-eslint";

export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/interface-name-prefix": "off",
    },
  },
];
