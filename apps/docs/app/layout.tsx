import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Antd Admin 文档",
    template: "%s – Antd Admin 文档",
  },
  description: "antd-admin 模板使用说明：basic 与 with-lingui 选型、安装与配置。",
};

const navbar = (
  <Navbar
    logo={<b>Antd Admin 文档</b>}
    projectLink="https://github.com/zuiidea/antd-admin"
  />
);

const footer = (
  <Footer>
    MIT {new Date().getFullYear()} ©{" "}
    <a href="https://github.com/zuiidea/antd-admin" rel="noreferrer" target="_blank">
      antd-admin
    </a>
  </Footer>
);

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  const pageMap = await getPageMap();

  return (
    <html lang="zh-CN" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/zuiidea/antd-admin/tree/master"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
