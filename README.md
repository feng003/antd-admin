# Antd Admin

Balanced admin monorepo: MSW mocks, minimal RBAC, full CRUD, and Playwright E2E — built with React 19, Ant Design 6, and Vite+. Ship either an **English-only** app (`apps/basic`) or a **Lingui i18n** variant (`apps/with-lingui`); see [Templates](#templates) below.

[antd](https://github.com/ant-design/ant-design)
[react](https://react.dev)
[vite](https://viteplus.dev)
[TypeScript](https://www.typescriptlang.org/)
[GitHub issues](https://github.com/zuiidea/antd-admin/issues)
[GitHub stars](https://github.com/zuiidea/antd-admin/stargazers)
[License](http://opensource.org/licenses/MIT)
[PRs Welcome](https://github.com/zuiidea/antd-admin/pulls)

## Tech Stack


| Category     | Technology                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Build Tool   | [Vite+](https://viteplus.dev) (VoidZero unified toolchain)                                              |
| UI Framework | [Ant Design 6.x](https://ant.design)                                                                    |
| Routing      | [TanStack Router](https://tanstack.com/router) (file-based, type-safe)                                  |
| Async State  | [TanStack Query v5](https://tanstack.com/query)                                                         |
| Local State  | [Zustand](https://zustand.docs.pmnd.rs) (persisted auth & settings)                                     |
| Validation   | [Zod v4](https://zod.dev) (schemas, API contracts, form validation)                                     |
| i18n         | [LinguiJS](https://lingui.dev) in `**apps/with-lingui` only** (`apps/basic` is English-only, no Lingui) |
| Icons        | [lucide-react](https://lucide.dev/guide/packages/lucide-react)                                          |
| API Mocking  | [MSW 2.x](https://mswjs.io) (Service Worker based)                                                      |
| E2E Testing  | [Playwright](https://playwright.dev)                                                                    |
| Language     | TypeScript 5.9 (strict mode)                                                                            |


## Features

- **JWT Authentication** — Login with access/refresh token flow, persisted via Zustand
- **Dynamic Menu & RBAC** — Backend-driven sidebar menu with permission guards and 403 page
- **URL-First State** — Table search params (page, pageSize, keyword, sort) synced to URL
- **i18n (with-lingui app)** — LinguiJS with English (`en`) and Chinese (`zh`); Ant Design locales follow the active locale in `apps/with-lingui`
- **Dark Mode** — One-click toggle with Ant Design theme algorithm
- **Full Type Safety** — Zod schemas validate API boundaries at runtime where used
- **Zero-Config Mocking** — MSW intercepts API calls in development, no backend needed

## Templates

`npx init-antd-admin@latest` · `pnpm dlx init-antd-admin@latest`


| Directory                                 | Use when                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `[apps/with-lingui](./apps/with-lingui/)` | You want **LinguiJS** (en + zh), `.po` extract/compile, and a language switcher — this is the fuller reference stack. |
| `[apps/basic](./apps/basic/)`             | You want the **same product surface** with **English-only** UI (no Lingui, fixed `en_US` for Ant Design).             |


Pick one app directory, install, and run Vite+ from there:

```bash
cd apps/basic && vp install && vp dev
# or
cd apps/with-lingui && vp install && vp dev
```

### 文档站（Nextra）

中文使用文档位于 `**apps/docs**`（Next.js + Nextra）。在仓库根或该目录安装依赖后：

```bash
cd apps/docs && pnpm install && pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。模板 Vite+ 应用仍为 [http://localhost:5173](http://localhost:5173)。开发与构建命令说明见 `[apps/docs/README.md](./apps/docs/README.md)`。

Core Playwright flows (from the app you are working in):

```bash
cd apps/basic && pnpm run test:e2e:core
```

### Git hooks

提交前检查由仓库根目录 **`.githooks/pre-commit`** 按暂存路径分发到各子项目（在对应目录执行 `vp staged`，避免在仓库根找不到 `vite.config.ts`）。一次性启用：

```bash
pnpm run setup:git-hooks
```

说明见 [.githooks/README.md](./.githooks/README.md)。模板目录内的 `.vite-hooks` 仍保留给模板单独拷贝使用；在本仓库开发请使用上述根级钩子。

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [Vite+](https://viteplus.dev/guide/) CLI (`vp`)

### Install & Run

From the repository root, choose an app under `apps/` (see [Templates](#templates)), then:

```bash
cd apps/with-lingui   # or: cd apps/basic
vp install
vp dev
```

Open [http://localhost:5173](http://localhost:5173) — you'll be redirected to the login page.

**Default credentials:** `admin` / `admin`

### Build

```bash
vp build
vp preview
```

### E2E Tests

Run from the app package (example: `apps/basic`):

```bash
cd apps/basic
pnpm run test:e2e
pnpm run test:e2e:core
pnpm run test:e2e:ui   # interactive UI mode
```

`test:e2e:core` runs the scaffold's highest-value flows only: login and users CRUD.

## Project Structure

```
src/
├── api/                  # Zod schemas, endpoint constants, type exports
│   ├── schemas.ts        # Domain models (User, AuthTokens, MenuItem, etc.)
│   ├── auth.ts           # Auth endpoint constants
│   └── user.ts           # User CRUD endpoint constants
├── components/
│   ├── Aurora/           # Login background effect
│   ├── Auth/             # Auth (permission gate): index.tsx
│   ├── DataTable/        # Shared table shell, skeleton, empty state
│   ├── FilterToolbar/    # Shared filter/action toolbar
│   ├── FormModal/        # Reusable modal + form shell
│   ├── Icon/             # Shared icons and theme toggle icon
│   └── Layout/           # Admin shell (sidebar, header, main)
│       ├── MainLayout/  # Main layout shell: index.tsx
│       ├── AppFooter/    # Login footer: Powered by + GitHub → zuiidea/antd-admin
│       ├── Sidebar/      # Dynamic menu sidebar: index.tsx
│       ├── UserMenu/     # User dropdown in sidebar: index.tsx + index.css
│       └── Header/       # Top bar: index.tsx
├── hooks/
│   ├── tokenBuilders.ts  # Shared Ant Design token/config builders
│   ├── useAppTheme.ts    # Theme selection hook (ConfigProvider)
│   ├── usePermission.ts  # Permission check hook
│   └── useResourceCRUD.ts # Shared CRUD query/mutation wiring
├── utils/
│   ├── constants.ts      # API base URL, static assets
│   └── http.ts           # HTTP client with JWT injection & error handling
├── locales/              # LinguiJS catalogs (.po + compiled .js)
│   ├── en/messages.po
│   └── zh/messages.po
├── mocks/
│   ├── browser.ts        # MSW worker setup
│   ├── createHandler.ts  # Shared MSW success/error/delay helpers
│   ├── data.ts           # Mock seed data (users, menus)
│   ├── utils.ts          # Mock-only helpers (filters, pagination, demo avatar URLs)
│   └── handlers/         # Request handlers (auth, user CRUD)
├── routes/               # TanStack Router file-based routes
│   ├── __root.tsx        # Root layout (QueryClient, ConfigProvider, I18n)
│   ├── _auth.tsx         # Auth guard layout (redirects to /login)
│   ├── _auth/dashboard/index.tsx
│   ├── _auth/users/index.tsx   # Full CRUD with URL-synced search params
│   ├── _auth/403/index.tsx
│   ├── login/index.tsx
│   ├── 404/index.tsx
│   └── index.tsx         # Redirects / → /login
├── stores/
│   ├── auth.ts           # Auth store (tokens, user, menus, permissions)
│   ├── createPersistentStore.ts # Shared persisted-store factory
│   └── settings.ts       # Settings store (darkMode, locale, sidebar)
└── main.tsx              # Entry point (MSW init → React render)

tests/
└── e2e/                  # Playwright E2E tests
    ├── helpers.ts
    ├── login.spec.ts
    └── users.spec.ts
```

## Internationalization (i18n)

The project uses [LinguiJS](https://lingui.dev) with compile-time macros. Locales: `**en**` (source) and `**zh**`.

### Workflow

```bash
vp run i18n:extract
vp run i18n:compile
```

Ant Design strings follow the active locale via `ConfigProvider` in `__root.tsx`.

## Extending the template

- **Real backend:** Point `VITE_API_BASE_URL` in env and disable or remove MSW in `main.tsx` when you no longer need mocks.
- **Drop i18n:** Remove Lingui packages, vite/swc plugins, and replace `t` macros with plain strings (larger refactor).

## Developer Notes

- Prefer Vite+ commands for installs, checks, and scripts. This repo is configured around `vp`.
- Run `vp check --no-fmt` for type/lint validation.
- Core regression coverage lives in the login and users E2E flows.

## Pages


| Route        | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| `/login`     | Login form with validation                                  |
| `/dashboard` | Statistics overview cards                                   |
| `/users`     | User CRUD table with search, pagination, create/edit/delete |
| `/403`       | Forbidden error page                                        |
| `/404`       | Not found error page                                        |


## License

MIT