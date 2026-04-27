import { formatter } from "@lingui/format-po";

const config = {
  locales: ["en", "zh"],
  sourceLocale: "en",
  catalogs: [
    {
      path: "src/locales/{locale}/messages",
      include: ["src"],
    },
  ],
  format: formatter({ lineNumbers: false }),
};

export default config;
