# apps/docs（Nextra 4 文档站）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `apps/docs` 新增基于 **Next.js App Router + Nextra 4 + nextra-theme-docs** 的中文使用文档站，服务模板选型开发者（design spec：`docs/specs/2026-04-15-apps-docs-nextra-design.md`）。

**Architecture:** `content/` 目录存放 MDX；`app/[[...mdxPath]]/page.tsx` 作为 Nextra 文档网关；`app/layout.tsx` 装配 Docs Theme；**首期不配置 `basePath`**（根路径部署）；与 `apps/basic`、`apps/with-lingui`（Vite+）并存。

**Tech Stack:** Next.js 15+（App Router）、React 19、Nextra 4、`nextra-theme-docs`、TypeScript、pnpm workspace。

---

## 文件映射（新建为主）

| 路径 | 职责 |
|------|------|
| `apps/docs/package.json` | 包名 `antd-admin-docs`，scripts：`dev`/`build`/`start`/`lint` |
| `apps/docs/next.config.mjs` | `nextra()` 包装 Next 配置 |
| `apps/docs/tsconfig.json` | TS 严格模式 + `paths`：`@/*` → `./*` |
| `apps/docs/next-env.d.ts` | Next 类型三斜线引用 |
| `apps/docs/mdx-components.tsx` | 必填：`useMDXComponents` 合并主题默认组件 |
| `apps/docs/app/layout.tsx` | 根布局：`Layout`/`Navbar`/`Footer`/`Head`，`lang="zh-CN"`，`getPageMap()` |
| `apps/docs/app/[[...mdxPath]]/page.tsx` | 动态 MDX 页：`importPage`、`generateStaticParamsFor` |
| `apps/docs/content/index.mdx` | 首页文档 |
| `apps/docs/content/quick-start.mdx` | 快速开始 |
| `apps/docs/content/templates.mdx` | 模板对比（可含表格） |
| `apps/docs/content/features.mdx` | 功能与约定（占位 + 链到各 app README） |
| `apps/docs/content/configuration.mdx` | 配置参考（简短） |
| `apps/docs/README.md` | 本地开发与端口说明 |
| `turbo.json`（仓库根） | `build` 的 `outputs` 增加 `.next/**`（并可排除 cache，见 Task 7） |
| `README.md`（仓库根） | Templates 小节增加文档站入口与端口 |
| `pnpm-lock.yaml`（根） | `pnpm install` 后更新 |

---

### Task 1: 初始化 `apps/docs` 包与依赖

**Files:**

- Create: `apps/docs/package.json`
- Modify: `pnpm-lock.yaml`（根目录，安装后）

- [ ] **Step 1: 创建 `apps/docs/package.json`**

内容示例（版本号在安装步骤用 CLI 解析为精确版本并写回 lockfile；此处用 `latest` 或 caret 作为起点）：

```json
{
  "name": "antd-admin-docs",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "nextra": "^4.0.0",
    "nextra-theme-docs": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "~5.9.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.1.0"
  }
}
```

- [ ] **Step 2: 在仓库根安装**

```bash
cd /Users/zuiidea/web/antd-admin
pnpm install
```

Expected: 退出码 0，`pnpm-lock.yaml` 更新。

- [ ] **Step 3: Commit**

```bash
git add apps/docs/package.json pnpm-lock.yaml
git commit -m "chore(docs): scaffold antd-admin-docs package with Nextra deps"
```

---

### Task 2: Next / TS 基础配置

**Files:**

- Create: `apps/docs/next.config.mjs`
- Create: `apps/docs/tsconfig.json`
- Create: `apps/docs/next-env.d.ts`

- [ ] **Step 1: 写入 `apps/docs/next.config.mjs`**

```javascript
import nextra from "nextra";

const withNextra = nextra({
  defaultShowCopyCode: true,
});

export default withNextra({
  reactStrictMode: true,
});
```

（若启用 `next dev --turbopack` 且出现 `next-mdx-import-source-file` 解析错误，按 [Nextra mdx-components 文档](https://nextra.site/docs/file-conventions/mdx-components-file) 增加 `turbopack.resolveAlias`；**首期可不启用 turbopack** 以降低摩擦。）

- [ ] **Step 2: 写入 `apps/docs/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 写入 `apps/docs/next-env.d.ts`**

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 4: 验证**

```bash
cd apps/docs && pnpm exec tsc --noEmit
```

Expected: 在补齐源码文件前可能失败；完成 Task 3–5 后再跑至通过。

- [ ] **Step 5: Commit**

```bash
git add apps/docs/next.config.mjs apps/docs/tsconfig.json apps/docs/next-env.d.ts
git commit -m "chore(docs): add Next and TypeScript config for Nextra"
```

---

### Task 3: MDX 组件入口

**Files:**

- Create: `apps/docs/mdx-components.tsx`

- [ ] **Step 1: 写入完整文件**

```tsx
import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import type { MDXComponents } from "mdx/types";

const themeComponents = getThemeComponents();

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...themeComponents,
    ...components,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/docs/mdx-components.tsx
git commit -m "feat(docs): add mdx-components for Nextra theme"
```

---

### Task 4: 根布局（Docs Theme + 中文元数据）

**Files:**

- Create: `apps/docs/app/layout.tsx`

- [ ] **Step 1: 写入完整文件**（按需替换 `docsRepositoryBase` 分支名）

```tsx
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
```

说明：未加官方示例里的 `Banner`，避免与正式文档抢视觉；若需要公告可后续再加。

- [ ] **Step 2: Commit**

```bash
git add apps/docs/app/layout.tsx
git commit -m "feat(docs): Nextra docs theme root layout (zh-CN)"
```

---

### Task 5: 动态 MDX 路由网关

**Files:**

- Create: `apps/docs/app/[[...mdxPath]]/page.tsx`

- [ ] **Step 1: 写入完整文件**（`mdx-components` 相对路径：从 `app/[[...mdxPath]]/` 到项目根为 `../../`）

```tsx
import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "../../mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

type PageProps = { params: Promise<{ mdxPath?: string[] }> };

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  return metadata;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode,
  } = await importPage(params.mdxPath);

  const Wrapper = getMDXComponents().wrapper;

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/docs/app/[[...mdxPath]]/page.tsx"
git commit -m "feat(docs): add Nextra catch-all MDX page"
```

---

### Task 6: 中文内容骨架（≥ 3 个侧边栏条目）

**Files:**

- Create: `apps/docs/content/index.mdx`
- Create: `apps/docs/content/quick-start.mdx`
- Create: `apps/docs/content/templates.mdx`
- Create: `apps/docs/content/features.mdx`
- Create: `apps/docs/content/configuration.mdx`

- [ ] **Step 1: 为每个文件添加 frontmatter 与标题**（示例：`index.mdx`）

```mdx
---
title: 概述
description: antd-admin monorepo 与模板说明
---

# 概述

本仓库提供两个可运行模板：**`apps/basic`**（英文-only）与 **`apps/with-lingui`**（Lingui 中英文）。详细对比见「模板对比」。
```

- [ ] **Step 2:** `quick-start.mdx` 写清 Node ≥ 20、`vp`、分别 `cd apps/basic` / `cd apps/with-lingui` 安装与 `vp dev`，默认账号 `admin` / `admin`，并注明 **文档站** 使用 `cd apps/docs && pnpm dev`（端口 **3000**），与模板 **5173** 区分。

- [ ] **Step 3:** `templates.mdx` 用 Markdown 表格对比：`package.json` 的 `name`、Lingui、Ant Design locale、Zustand persist key（`basic` 为 `settings-storage-basic` 等，以源码为准）。

- [ ] **Step 4:** `features.mdx` / `configuration.mdx` 以短章节 + 指向各 app 内 README 或源码路径的链接为主，避免长篇双维护。

- [ ] **Step 5: Commit**

```bash
git add apps/docs/content
git commit -m "docs(docs): add Chinese content skeleton for Nextra"
```

---

### Task 7: Turbo 与根 README

**Files:**

- Modify: `turbo.json`（根）
- Modify: `README.md`（根）
- Create: `apps/docs/README.md`

- [ ] **Step 1: 更新根 `turbo.json` 的 `build.outputs`**

将：

```json
"outputs": [
    "dist/**"
]
```

改为（与 Next 产物兼容；`!.next/cache/**` 可按需加入以减少缓存体积）：

```json
"outputs": [
    "dist/**",
    ".next/**"
]
```

若团队希望排除 `.next/cache`，可使用：

```json
"outputs": ["dist/**", ".next/**", "!.next/cache/**"]
```

（以当前 Turbo 版本支持的语法为准。）

- [ ] **Step 2: 根 `README.md`** 在 [Templates](#templates) 表格下增加一行或一小节，例如：

- **文档站**：`apps/docs`（Nextra），本地：`cd apps/docs && pnpm install && pnpm dev` → `http://localhost:3000`；模板应用仍为 `http://localhost:5173`。

- [ ] **Step 3: `apps/docs/README.md`** 重复 dev/build 命令与端口、与 design spec 的链接。

- [ ] **Step 4: Commit**

```bash
git add turbo.json README.md apps/docs/README.md
git commit -m "chore: wire docs app into turbo and root README"
```

---

### Task 8: ESLint（Next 默认）与构建验收

**Files:**

- Create: `apps/docs/eslint.config.mjs`（若 `next lint` 需要；可用 `pnpm exec create-next-app` 生成物参考，或 `eslint.config.mjs` 来自 Next 15 模板）
- 可选: `apps/docs/.eslintrc.json` — 以 `next lint` 实际生成的为准

- [ ] **Step 1:** 在 `apps/docs` 下运行 `pnpm exec next lint --dir .` 或 `pnpm run lint`，按 CLI 提示补齐缺失配置文件，直到 **0 errors**。

- [ ] **Step 2: 生产构建**

```bash
cd /Users/zuiidea/web/antd-admin/apps/docs
pnpm run build
```

Expected: `next build` 成功退出码 0。

- [ ] **Step 3: 可选搜索** — 按 [Nextra Search 指南](https://nextra.site/docs/guide/search#setup) 配置 Pagefind 或内置搜索；**spec 首期非必须**，可作为 follow-up。

- [ ] **Step 4: Commit**

```bash
git add apps/docs
git commit -m "chore(docs): eslint config and verify next build" 
```

---

## 计划自检（对照 design spec）

| Spec 章节 | 本计划 Task |
|-----------|-------------|
| Summary / B 类读者 / 中文 | Task 6 文案与 Task 4 `lang` |
| Nextra 4 + Docs theme + App Router | Task 2–5 |
| `apps/docs` workspace | Task 1 |
| Turbo + README 端口 | Task 7 |
| `next build` 必须通过 | Task 8 |
| 首期无 basePath | Task 2 未设置 `basePath`；后续单开任务 |
| 搜索 / E2E | 未列入（符合 non-goals） |

**占位符：** 无未决 TBD；版本号以 `pnpm install` 后 lockfile 为准在实现时收紧。

---

## 执行方式

**计划路径：** `docs/specs/2026-04-15-apps-docs-nextra-plan.md`

**1. Subagent-Driven（推荐）** — 每 Task 独立子代理 + 任务间 spec/质量审查。  
**2. Inline Execution** — 本会话按 Task 顺序执行并在 Task 7/8 做检查点。

需要我按其中一种直接开始改仓库时，回复 **1** 或 **2** 即可。
