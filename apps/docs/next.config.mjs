import nextra from "nextra";

const withNextra = nextra({
  defaultShowCopyCode: true,
});

export default withNextra({
  reactStrictMode: true,
  i18n: {
    locales: ["zh", "en"],
    defaultLocale: "zh",
  },
});
