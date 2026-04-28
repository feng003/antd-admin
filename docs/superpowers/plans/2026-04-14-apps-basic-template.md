# apps/basic 模板实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 monorepo 中新增 `apps/basic`，由 `apps/with-lingui` 拷贝并去除 Lingui 与语言切换，界面为英文硬编码，Ant Design 固定 `en_US`。

**Architecture:** 目录级「拷贝后减法」；不抽 shared package。`settings` 持久化使用独立 storage key；`package.json` 使用唯一 `name`（如 `antd-admin-basic`）。

**Tech Stack:** 与 `with-lingui` 相同（Vite+、React 19、TanStack Router/Query、Ant Design 6、Zustand、MSW、Playwright），不包含任何 `@lingui/*`。

---

## 文件映射（创建 / 修改 / 删除）

| 路径 | 操作 |
|------|------|
| `apps/basic/**` | 自 `apps/with-lingui` 拷贝生成（排除 `node_modules`、`dist`、`.turbo`、coverage 等产物） |
| `apps/basic/lingui.config.ts` | 删除 |
| `apps/basic/src/lingui.d.ts` | 删除 |
| `apps/basic/src/locales/**` | 删除整个目录 |
| `apps/basic/package.json` | 修改：`name`、依赖、脚本 |
| `apps/basic/vite.config.ts` | 修改：去掉 Lingui 插件 |
| `apps/basic/src/main.tsx` | 修改：去掉 i18n 启动 |
| `apps/basic/src/routes/__root.tsx` | 修改：固定 `enUS`，去掉 `I18nProvider` |
| `apps/basic/src/stores/settings.ts` | 修改：去掉 locale，改 persist `name` |
| `apps/basic/src/components/Layout/Sidebar/index.tsx` | 修改：`MENU_LABELS` 与 `buildMenuItems` 签名 |
| `apps/basic/src/components/Layout/Header/index.tsx` | 修改：去掉语言按钮与 Lingui |
| `apps/basic/src/routes/login/index.tsx` | 修改：去掉语言按钮与 Lingui |
| `apps/basic/src/components/Layout/AppFooter/index.tsx` 等 8+ 处路由/组件 | 修改：见各 Task |
| `pnpm-lock.yaml`（仓库根） | 修改：`pnpm install` 后更新 |
| `README.md`（仓库根） | 修改：Templates 说明 |
| `apps/basic/README.md` | 修改或新增：英文-only 说明 |

---

### Task 1: 拷贝应用骨架

**Files:**

- Create: `apps/basic/**`（整树，来自 with-lingui）

- [ ] **Step 1: 从 with-lingui 拷贝到 basic（排除产物）**

在仓库根目录执行：

```bash
cd /Users/zuiidea/web/antd-admin
rsync -a --delete \
  --exclude node_modules --exclude dist --exclude .turbo --exclude coverage \
  --exclude ".vite-hooks" \
  apps/with-lingui/ apps/basic/
```

若无 `rsync`，可用：

```bash
cp -R apps/with-lingui apps/basic
rm -rf apps/basic/node_modules apps/basic/dist apps/basic/.turbo
```

- [ ] **Step 2: 确认 `apps/basic` 存在且不含 `node_modules`**

```bash
test -f apps/basic/package.json && test ! -d apps/basic/node_modules && echo OK
```

Expected: 输出 `OK`

- [ ] **Step 3: Commit**

```bash
git add apps/basic
git commit -m "chore: scaffold apps/basic from with-lingui"
```

（若 pre-commit 失败且仅因 hook 配置，可按团队约定使用 `--no-verify`。）

---

### Task 2: package.json 与锁文件

**Files:**

- Modify: `apps/basic/package.json`
- Modify: `pnpm-lock.yaml`（根目录）

- [ ] **Step 1: 编辑 `apps/basic/package.json`**

将 `name` 改为 `"antd-admin-basic"`。

从 `scripts` 中**删除**这两行：

```json
    "i18n:extract": "vp exec lingui extract",
    "i18n:compile": "vp exec lingui compile"
```

从 `dependencies` 中**删除**：

```json
    "@lingui/core": "^5.9.3",
    "@lingui/react": "^5.9.3",
```

从 `devDependencies` 中**删除**：

```json
    "@lingui/cli": "^5.9.3",
    "@lingui/swc-plugin": "^5.11.0",
    "@lingui/vite-plugin": "^5.9.3",
```

其余字段保持与源应用一致。

- [ ] **Step 2: 安装依赖并更新 lockfile**

```bash
cd /Users/zuiidea/web/antd-admin
pnpm install
```

Expected: 退出码 0，`pnpm-lock.yaml` 出现与 `antd-admin-basic` 相关的解析记录。

- [ ] **Step 3: Commit**

```bash
git add apps/basic/package.json pnpm-lock.yaml
git commit -m "chore(basic): drop Lingui deps and rename package"
```

---

### Task 3: Vite 配置

**Files:**

- Modify: `apps/basic/vite.config.ts`

- [ ] **Step 1: 将 `apps/basic/vite.config.ts` 全文替换为以下内容**

```typescript
import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react-swc";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes("node_modules/antd")) {
            return "vendor-antd";
          }
          if (id.includes("@tanstack/react-router") || id.includes("@tanstack/react-query")) {
            return "vendor-tanstack";
          }
          if (id.includes("lucide-react")) {
            return "vendor-ui";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1024,
  },
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
});
```

- [ ] **Step 2: 在 `apps/basic` 下跑类型检查**

```bash
cd apps/basic && pnpm exec tsc --noEmit
```

Expected: 退出码 0（若此时仍因其它文件引用 Lingui 失败，完成 Task 4–8 后再重跑）。

- [ ] **Step 3: Commit**

```bash
git add apps/basic/vite.config.ts
git commit -m "chore(basic): remove Lingui vite and swc plugins"
```

---

### Task 4: 删除 Lingui 专属文件

**Files:**

- Delete: `apps/basic/lingui.config.ts`
- Delete: `apps/basic/src/lingui.d.ts`
- Delete: `apps/basic/src/locales/`（目录）

- [ ] **Step 1: 删除文件与目录**

```bash
rm -f apps/basic/lingui.config.ts apps/basic/src/lingui.d.ts
rm -rf apps/basic/src/locales
```

- [ ] **Step 2: Commit**

```bash
git add -A apps/basic
git commit -m "chore(basic): remove lingui config and locale catalogs"
```

---

### Task 5: 入口与根路由

**Files:**

- Modify: `apps/basic/src/main.tsx`
- Modify: `apps/basic/src/routes/__root.tsx`

- [ ] **Step 1: 将 `apps/basic/src/main.tsx` 全文替换为**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { useAuthStore } from "./stores/auth";
import { fetchSessionAndApplyToStore } from "./utils/session";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

async function enableMocking() {
  const enableMockInBuild = import.meta.env.VITE_ENABLE_MOCK === "true";
  if (!import.meta.env.DEV && !enableMockInBuild) return;
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking()
  .then(async () => {
    await useAuthStore.persist.rehydrate();
    const { isAuthenticated, tokens } = useAuthStore.getState();
    if (isAuthenticated && tokens) {
      try {
        await fetchSessionAndApplyToStore();
      } catch {
        useAuthStore.getState().logout();
      }
    }

    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>,
    );
  })
  .catch((err) => {
    console.error("Failed to initialize app:", err);
  });
```

- [ ] **Step 2: 将 `apps/basic/src/routes/__root.tsx` 全文替换为**

```typescript
import { useEffect, useLayoutEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ConfigProvider, App } from "antd";
import enUS from "antd/locale/en_US";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSettingsStore } from "@/stores/settings";
import { useAppTheme } from "@/hooks/useAppTheme";
import { NotFound } from "@/components/NotFound";
import "@/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function RootComponent() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const configProviderProps = useAppTheme();

  useLayoutEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider {...configProviderProps} locale={enUS}>
        <App>
          <Outlet />
        </App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
});
```

- [ ] **Step 3: 运行 TypeScript**

```bash
cd apps/basic && pnpm exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/basic/src/main.tsx apps/basic/src/routes/__root.tsx
git commit -m "feat(basic): remove Lingui bootstrap and fix Antd to en_US"
```

---

### Task 6: Settings store

**Files:**

- Modify: `apps/basic/src/stores/settings.ts`

- [ ] **Step 1: 将 `apps/basic/src/stores/settings.ts` 全文替换为**

```typescript
import { createPersistentStore } from "./createPersistentStore";

function getInitialDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

interface SettingsState {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useSettingsStore = createPersistentStore<SettingsState>(
  (set) => ({
    darkMode: getInitialDarkMode(),
    sidebarCollapsed: false,
    toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  }),
  {
    name: "settings-storage-basic",
    partialize: (state) => ({
      darkMode: state.darkMode,
      sidebarCollapsed: state.sidebarCollapsed,
    }),
  },
);
```

- [ ] **Step 2: Commit**

```bash
git add apps/basic/src/stores/settings.ts
git commit -m "feat(basic): drop locale from settings store"
```

---

### Task 7: 小型组件（完整替换）

**Files:**

- Modify: `apps/basic/src/components/DataTable/DataTableEmpty.tsx`
- Modify: `apps/basic/src/components/NotFound/index.tsx`
- Modify: `apps/basic/src/routes/_auth/403/index.tsx`
- Modify: `apps/basic/src/components/Layout/AppFooter/index.tsx`

- [ ] **Step 1: `DataTableEmpty.tsx` 全文替换**

```typescript
import { Flex, theme } from "antd";
import { BarChart3 } from "lucide-react";
import type { ReactElement } from "react";

/**
 * Table empty state: icon in soft tile + bold title + secondary description (dashboard-style).
 */
export function DataTableEmpty(): ReactElement {
  const { token } = theme.useToken();

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      gap={token.marginMD}
      className="data-table-empty"
      style={{
        paddingBlock: token.paddingXL,
        paddingInline: token.paddingLG,
        maxWidth: 360,
        marginInline: "auto",
      }}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          width: 44,
          height: 44,
          borderRadius: token.borderRadiusLG,
          background: token.colorFillTertiary,
          color: token.colorTextQuaternary,
        }}
      >
        <BarChart3 size={22} strokeWidth={1.75} aria-hidden />
      </Flex>
      <Flex vertical align="center" gap={token.marginXXS} style={{ textAlign: "center" }}>
        <span
          style={{
            fontSize: token.fontSizeLG,
            fontWeight: token.fontWeightStrong,
            color: token.colorText,
            lineHeight: token.lineHeightLG,
          }}
        >
          No data
        </span>
        <span
          style={{
            fontSize: token.fontSize,
            fontWeight: 400,
            color: token.colorTextSecondary,
            lineHeight: token.lineHeight,
          }}
        >
          Nothing to show in this list yet
        </span>
      </Flex>
    </Flex>
  );
}
```

- [ ] **Step 2: `NotFound/index.tsx` 全文替换**

```typescript
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import { Button, Flex, Result, Space, theme } from "antd";

/** Shared 404 UI for `/404` route and root `notFoundComponent`. */
export function NotFound() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const goDashboard = () => {
    void navigate({ to: "/dashboard" });
  };

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      goDashboard();
    }
  };

  return (
    <Flex
      vertical
      style={{
        /* Lock to viewport so tall Result + padding cannot grow past 100vh and scroll the page */
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
        boxSizing: "border-box",
        background: token.colorBgLayout,
        color: token.colorText,
      }}
    >
      <Flex
        flex={1}
        align="center"
        justify="center"
        style={{
          minHeight: 0,
          width: "100%",
          padding: token.paddingXL,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <Result
          // Avoid status="404"|"403"|"500": antd ignores `icon` and shows built-in art; keep Lucide as the main icon.
          icon={
            <SearchX size={64} strokeWidth={1.25} color={token.colorTextQuaternary} aria-hidden />
          }
          title="404"
          subTitle="Sorry, the page you visited does not exist."
          extra={
            <Space wrap size="middle">
              <Button type="primary" icon={<Home size={16} aria-hidden />} onClick={goDashboard}>
                Back to Home
              </Button>
              <Button icon={<ArrowLeft size={16} aria-hidden />} onClick={goBack}>
                Go back
              </Button>
            </Space>
          }
        />
      </Flex>
    </Flex>
  );
}
```

- [ ] **Step 3: `403/index.tsx` 全文替换**

```typescript
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Home, ShieldAlert } from "lucide-react";
import { Button, Flex, Result, theme } from "antd";

export const Route = createFileRoute("/_auth/403/")({
  component: ForbiddenPage,
});

function ForbiddenPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const goDashboard = () => {
    void navigate({ to: "/dashboard" });
  };

  return (
    <Flex
      flex={1}
      align="center"
      justify="center"
      style={{ minHeight: 0, width: "100%", padding: token.paddingXL }}
    >
      <Result
        // Avoid status="403": antd ignores `icon` for built-in illustrations; keep Lucide as the main icon.
        icon={
          <ShieldAlert size={64} strokeWidth={1.25} color={token.colorTextQuaternary} aria-hidden />
        }
        title="403"
        subTitle="Sorry, you don't have permission to access this page."
        extra={
          <Button type="primary" icon={<Home size={16} aria-hidden />} onClick={goDashboard}>
            Back to Home
          </Button>
        }
      />
    </Flex>
  );
}
```

- [ ] **Step 4: `AppFooter/index.tsx` 全文替换**

```typescript
import { Flex, Typography, theme } from "antd";
import { GitHub } from "@/components/Icon";

const ANTD_ADMIN_REPO = "https://github.com/zuiidea/antd-admin";

export function AppFooter() {
  const { token } = theme.useToken();
  const iconSize = Math.max(12, Math.round(Number(token.fontSizeSM)));

  return (
    <Flex
      align="center"
      justify="center"
      wrap
      gap={4}
      style={{
        lineHeight: token.lineHeight,
      }}
    >
      <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM, marginBottom: 0 }}>
        Powered by
      </Typography.Text>
      <a
        href={ANTD_ADMIN_REPO}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: token.colorLink,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <GitHub size={iconSize} />
        antd-admin
      </a>
    </Flex>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/basic/src/components/DataTable/DataTableEmpty.tsx \
  apps/basic/src/components/NotFound/index.tsx \
  apps/basic/src/routes/_auth/403/index.tsx \
  apps/basic/src/components/Layout/AppFooter/index.tsx
git commit -m "feat(basic): replace Lingui strings in small layout components"
```

---

### Task 8: Header 组件

**Files:**

- Modify: `apps/basic/src/components/Layout/Header/index.tsx`

- [ ] **Step 1: 将 `apps/basic/src/components/Layout/Header/index.tsx` 全文替换为**

```typescript
import { Layout, Button, Space, theme, Breadcrumb, Flex, Divider, Grid } from "antd";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import { useSettingsStore } from "@/stores/settings";
import { Link, useLocation, useMatches } from "@tanstack/react-router";
import { Home, PanelLeft, ShieldAlert, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Theme } from "@/components/Icon";

const { Header: AntHeader } = Layout;

const PATH_LABEL: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/403": "403",
};

function normalizePath(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

export type HeaderProps = {
  /**
   * When `false`, breadcrumb is hidden; left `Flex` still uses `flex={1}` so header actions stay right-aligned.
   * Routes may also set `staticData: { hideBreadcrumb: true }` (deepest matching route wins).
   */
  showBreadcrumb?: boolean;
};

export function Header({ showBreadcrumb: showBreadcrumbProp = true }: HeaderProps) {
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const toggleDarkMode = useSettingsStore((s) => s.toggleDarkMode);
  const location = useLocation();
  const matches = useMatches();
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;

  const iconSize = token.fontSize;

  const crumb = (Icon: LucideIcon, label: ReactNode, linkTo?: "/dashboard") => {
    const row = (
      <>
        <Icon size={iconSize} aria-hidden style={{ flexShrink: 0, opacity: 0.88 }} />
        <span>{label}</span>
      </>
    );
    const rowStyle = {
      display: "inline-flex" as const,
      alignItems: "center" as const,
      gap: token.marginXS,
      color: "inherit" as const,
    };
    if (linkTo) {
      return (
        <Link to={linkTo} style={rowStyle}>
          {row}
        </Link>
      );
    }
    return <span style={rowStyle}>{row}</span>;
  };

  const path = normalizePath(location.pathname);
  const segments = path.split("/").filter(Boolean);
  const firstSegmentPath = segments.length ? `/${segments[0]}` : "/dashboard";
  const leafLabelKey = PATH_LABEL[firstSegmentPath] ?? segments[0] ?? "Dashboard";

  const leafIcon: LucideIcon =
    firstSegmentPath === "/users" ? Users : firstSegmentPath === "/403" ? ShieldAlert : Home;

  const leafLabel = leafLabelKey;

  const breadcrumbItems: ItemType[] = [];

  const onDashboard = path === "/dashboard" || path === "/";

  if (onDashboard) {
    breadcrumbItems.push({
      title: crumb(Home, "Dashboard"),
    });
  } else {
    breadcrumbItems.push({
      title: crumb(Home, "Dashboard", "/dashboard"),
    });

    breadcrumbItems.push({
      title: crumb(leafIcon, leafLabel),
    });

    if (segments.length > 1) {
      const tail = segments.slice(1).join(" / ");
      if (tail) {
        breadcrumbItems.push({ title: tail });
      }
    }
  }

  const leafStatic = matches.at(-1)?.staticData as { hideBreadcrumb?: boolean } | undefined;
  const hideBreadcrumbFromRoute = leafStatic?.hideBreadcrumb === true;
  const showBreadcrumb =
    showBreadcrumbProp && !hideBreadcrumbFromRoute && breadcrumbItems.length > 0;

  return (
    <AntHeader
      style={{
        background: "transparent",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: `0 ${token.padding}px`,
        gap: token.sizeLG,
        display: "flex",
      }}
    >
      <Flex align="center" flex={1} style={{ minWidth: 0 }}>
        {isMobile ? (
          <Button
            type="text"
            size="small"
            onClick={toggleSidebar}
            icon={<PanelLeft size={token.size} />}
            aria-label="Toggle sidebar"
          />
        ) : null}
        {showBreadcrumb ? (
          <>
            {isMobile ? <Divider vertical /> : null}
            <Breadcrumb items={breadcrumbItems} />
          </>
        ) : null}
      </Flex>
      <Space>
        <Button
          type="text"
          onClick={toggleDarkMode}
          icon={<Theme size={token.size} />}
          aria-label="Toggle Theme"
        />
      </Space>
    </AntHeader>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/basic/src/components/Layout/Header/index.tsx
git commit -m "feat(basic): remove locale toggle from header"
```

---

### Task 9: Login 页

**Files:**

- Modify: `apps/basic/src/routes/login/index.tsx`

- [ ] **Step 1: 编辑该文件**

1. 删除 `import { useLingui } from "@lingui/react/macro";`
2. 删除 `import { Languages } from "lucide-react";`
3. 删除 `const { t } = useLingui();`
4. 删除 `const locale = useSettingsStore((s) => s.locale);`、`const setLocale = useSettingsStore((s) => s.setLocale);`
5. 删除整个 `toggleLocale` 函数。
6. 将所有 `` t`...` `` 替换为对应英文双引号字符串（与 `en` catalog 一致），例如：
   - `` t`Login successful` `` → `"Login successful"`
   - `` t`Login failed` `` → `"Login failed"`
   - `` t`Username` `` → `"Username"`
   - `` t`Please enter username` `` → `"Please enter username"`
   - `` t`Password` `` → `"Password"`
   - `` t`Please enter password` `` → `"Please enter password"`
   - `` t`Auto login` `` → `"Auto login"`
   - `` t`Forgot password?` `` → `"Forgot password?"`
   - `` t`Sign In` `` → `"Sign In"`
7. 在底部 `Space` 中**删除**语言切换 `Button`（`Languages` 图标、`toggleLocale`、`aria-label` 为 Switch language 的按钮），**保留**主题切换按钮与 `AppFooter`。
8. 确认文件顶部不再引用 `useSettingsStore` 的 locale（若仅用于语言切换，可移除对应 selector import 行）。

- [ ] **Step 2: Commit**

```bash
git add apps/basic/src/routes/login/index.tsx
git commit -m "feat(basic): English login copy and remove language toggle"
```

---

### Task 10: Sidebar 组件

**Files:**

- Modify: `apps/basic/src/components/Layout/Sidebar/index.tsx`

- [ ] **Step 1: 删除 Lingui import**

删除：

```typescript
import { useLingui } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
```

- [ ] **Step 2: 将 `MENU_LABELS` 改为英文字符串表**

```typescript
/** API menu `name` → English labels for known keys; unknown keys pass through as `menu.name`. */
const MENU_LABELS: Record<string, string> = {
  Platform: "Platform",
  Projects: "Projects",
  Dashboard: "Dashboard",
  Users: "Users",
  "Design Engineering": "Design Engineering",
  "Sales & Marketing": "Sales & Marketing",
};
```

- [ ] **Step 3: 修改 `buildMenuItems` 函数签名**

将：

```typescript
function buildMenuItems(
  menus: MenuItemType[],
  t: ReturnType<typeof useLingui>["t"],
  token: ReturnType<typeof theme.useToken>["token"],
```

改为：

```typescript
function buildMenuItems(
  menus: MenuItemType[],
  token: ReturnType<typeof theme.useToken>["token"],
```

- [ ] **Step 4: 将标签解析行**

从：

```typescript
    const label = MENU_LABELS[menu.name] ? t(MENU_LABELS[menu.name]) : menu.name;
```

改为：

```typescript
    const label = MENU_LABELS[menu.name] ?? menu.name;
```

- [ ] **Step 5: 更新所有 `buildMenuItems` 递归调用**

每一处 `buildMenuItems(menu.children, t, token, ...)` 改为 `buildMenuItems(menu.children, token, ...)`；第一处调用从 `buildMenuItems(menus, t, token, ...)` 改为 `buildMenuItems(menus, token, ...)`。

- [ ] **Step 6: 在 `Sidebar` 组件内**

删除 `const { t } = useLingui();`，将 `useMemo` 依赖数组中的 `t` 去掉，将 `` t`Sign Out` `` 改为 `"Sign Out"`，将所有 `` t`Toggle sidebar` `` 改为 `"Toggle sidebar"`。

- [ ] **Step 7: Commit**

```bash
git add apps/basic/src/components/Layout/Sidebar/index.tsx
git commit -m "feat(basic): English sidebar labels without Lingui"
```

---

### Task 11: Dashboard 与 Users 路由

**Files:**

- Modify: `apps/basic/src/routes/_auth/dashboard/index.tsx`
- Modify: `apps/basic/src/routes/_auth/users/index.tsx`
- Modify: `apps/basic/src/routes/_auth/users/-Toolbar.tsx`
- Modify: `apps/basic/src/routes/_auth/users/-FormModal.tsx`

- [ ] **Step 1: 在每个文件中删除 `useLingui` import 与 `const { t } = useLingui();`**

- [ ] **Step 2: 将每个 `` t`...` `` 与带插值的 `` t\`...\`` 替换为等价英文**

规则：打开 `apps/with-lingui/src/locales/en/messages.po`，按 `msgid` 文本替换；带 `{variable}` 的使用模板字符串，例如 `` t\`{total} rows\` `` → `` `${total} rows` ``（变量名以源码为准）。

- [ ] **Step 3: 运行 TypeScript**

```bash
cd apps/basic && pnpm exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/basic/src/routes/_auth/dashboard/index.tsx \
  apps/basic/src/routes/_auth/users/index.tsx \
  apps/basic/src/routes/_auth/users/-Toolbar.tsx \
  apps/basic/src/routes/_auth/users/-FormModal.tsx
git commit -m "feat(basic): English strings on dashboard and users routes"
```

---

### Task 12: 全库确认无 Lingui 残留

**Files:**

- （grep 修复任意遗漏文件）

- [ ] **Step 1: 搜索残留**

```bash
cd /Users/zuiidea/web/antd-admin
rg "@lingui|useLingui|I18nProvider|from \"@lingui" apps/basic --glob "*.{ts,tsx}"
```

Expected: 无匹配输出。

- [ ] **Step 2: 若有匹配，逐个文件按 Task 7–11 模式删除并提交**

---

### Task 13: 构建、Lint、E2E

**Files:**

- （无新文件，验证）

- [ ] **Step 1: Lint**

```bash
cd apps/basic && pnpm run lint
```

Expected: 退出码 0。

- [ ] **Step 2: 生产构建**

```bash
cd apps/basic && pnpm run build
```

Expected: 退出码 0，生成 `apps/basic/dist/`。

- [ ] **Step 3: Playwright**

```bash
cd apps/basic && pnpm run test:e2e:core
```

Expected: 全部通过。若选择器依赖中文，改为英文文案对应断言。

- [ ] **Step 4: Commit（若仅修复测试/配置）**

```bash
git add -A apps/basic
git commit -m "test(basic): align e2e with English UI" || true
```

---

### Task 14: 文档

**Files:**

- Modify: `README.md`
- Modify: `apps/basic/README.md`

- [ ] **Step 1: 编辑 `apps/basic/README.md`**

在标题下增加简短说明：

- 本模板为 **English-only**，不包含 Lingui。
- 需要中英文与 `.po` 工作流时使用 `apps/with-lingui`。

- [ ] **Step 2: 编辑根目录 `README.md`**

- 增加 **Templates**（或「项目结构」）小节：说明 `apps/with-lingui` 与 `apps/basic` 的差异。
- 给出从仓库根进入各应用运行的示例，例如：

```bash
cd apps/basic && vp dev
cd apps/with-lingui && vp dev
```

- 将技术栈表格中 **i18n** 一行改为注明「仅 `with-lingui`」或拆成两行，避免读者以为 `basic` 含 Lingui。

- [ ] **Step 3: Commit**

```bash
git add README.md apps/basic/README.md
git commit -m "docs: document with-lingui vs basic templates"
```

---

## 计划自检（对照 spec）

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 拷贝并减法得到 `apps/basic` | Task 1 |
| 去掉依赖、脚本、Vite 插件 | Task 2–3 |
| 删除 `lingui.config`、`lingui.d.ts`、`locales` | Task 4 |
| `main` / `__root` 固定英文与 enUS | Task 5 |
| settings 去 locale + 独立 persist name | Task 6 |
| 组件与路由去 `t`/`msg` | Task 7–11 |
| 无 Lingui 残留 | Task 12 |
| build / lint / e2e | Task 13 |
| 根 README + `apps/basic` README | Task 14 |

**占位符扫描：** 本计划不包含 TBD /「适当处理」类步骤。

**类型一致性：** `settings` 已移除 `Locale`；`Header` 不再 import `Locale`；`buildMenuItems` 全文件统一新签名。

---

## 执行方式（实现阶段）

**计划已保存到** `docs/superpowers/plans/2026-04-14-apps-basic-template.md`。

**可选执行方式：**

1. **Subagent-Driven（推荐）** — 每个 Task 派生子代理，任务间审查，迭代快。  
2. **Inline Execution** — 本会话内按 Task 顺序执行，配合 checkpoints 审查。

你更倾向哪一种？（若不需要代理编排，直接在实现时按本文 checkbox 顺序执行即可。）
