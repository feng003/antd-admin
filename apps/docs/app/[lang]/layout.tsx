import { Footer, Layout, Navbar, NotFoundPage } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement, ReactNode } from "react";

const LOCALES = ["zh", "en"] as const;
type Locale = (typeof LOCALES)[number];

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

function copyFor(locale: Locale) {
  if (locale === "en") {
    return {
      htmlLang: "en",
      title: "Antd Admin Docs",
      description:
        "Antd Admin template guide: choose between basic and with-lingui, then configure and run.",
    };
  }

  return {
    htmlLang: "zh-CN",
    title: "Antd Admin 文档",
    description: "antd-admin 模板使用说明：basic 与 with-lingui 选型、安装与配置。",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const copy = copyFor(lang);

  return {
    title: {
      default: copy.title,
      template: `%s – ${copy.title}`,
    },
    description: copy.description,
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}): Promise<ReactElement> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const copy = copyFor(lang);
  const localizedPageMap = await getPageMap(`/${lang}`);
  const pageMap = (Array.isArray(localizedPageMap) ? localizedPageMap : []).filter(Boolean);

  return (
    <html lang={copy.htmlLang} dir="ltr" suppressHydrationWarning>
      <body>
        <Layout
          navbar={
            <Navbar
              logo={<b>{copy.title}</b>}
              projectLink="https://github.com/zuiidea/antd-admin"
            />
          }
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/zuiidea/antd-admin/tree/master"
          i18n={[
            { locale: "zh", name: "中文" },
            { locale: "en", name: "English" },
          ]}
          footer={
            <Footer>
              MIT {new Date().getFullYear()} ©{" "}
              <a href="https://github.com/zuiidea/antd-admin" rel="noreferrer" target="_blank">
                antd-admin
              </a>
            </Footer>
          }
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}

export function NotFound() {
  return <NotFoundPage />;
}
