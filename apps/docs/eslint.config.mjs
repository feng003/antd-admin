import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["mdx-components.tsx"],
    rules: {
      // Nextra 主题在模块顶层合并默认 MDX 组件；与 `use*` 命名冲突于 hooks 规则，见 https://nextra.site/docs/file-conventions/mdx-components-file
      "react-hooks/rules-of-hooks": "off",
    },
  },
];
