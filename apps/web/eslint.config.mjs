import { baseConfig } from "@core/config-eslint";
// В будущем сюда можно будет добавить eslint-plugin-next

export default [
  ...baseConfig,
  {
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
];
