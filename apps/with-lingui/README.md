<p align="center">
  <a href="http://github.com/zuiidea/antd-admin" target="_blank">
    <img alt="antd-admin-logo" height="80" src="./public/favicon.svg">
  </a>
</p>

<h1 align="center">Antd Admin</h1>

<div align="center">

Balanced admin scaffold: i18n (Lingui), MSW mocks, minimal RBAC, full CRUD, and Playwright E2E — built with React 19, Ant Design 6, and Vite+. AI-friendly with clear patterns, shared abstractions, scoped AI instructions, and type-safe contracts at every boundary.

**AI rules (Cursor):** `.cursor/rules/with-lingui-*.mdc` at the repo root mirrors `apps/with-lingui/.github/instructions/*.instructions.md` (same intent; `globs` align with each file’s `applyTo`). Prefer updating **both** when you change guidance.

[![antd](https://img.shields.io/badge/AntD-^6.0.0-1890ff?style=flat-square&logo=ant-design)](https://github.com/ant-design/ant-design)
[![react](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react)](https://react.dev)
[![vite](https://img.shields.io/badge/Vite+-Latest-646cff?style=flat-square&logo=vite)](https://viteplus.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![GitHub issues](https://img.shields.io/github/issues/zuiidea/antd-admin?style=flat-square)](https://github.com/zuiidea/antd-admin/issues)
[![GitHub stars](https://img.shields.io/github/stars/zuiidea/antd-admin?style=flat-square)](https://github.com/zuiidea/antd-admin/stargazers)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](http://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](https://github.com/zuiidea/antd-admin/pulls)

</div>

## Tech Stack

| Category     | Technology                                                             |
| ------------ | ---------------------------------------------------------------------- |
| Build Tool   | [Vite+](https://viteplus.dev) (VoidZero unified toolchain)             |
| UI Framework | [Ant Design 6.x](https://ant.design)                                   |
| Routing      | [TanStack Router](https://tanstack.com/router) (file-based, type-safe) |
| Async State  | [TanStack Query v5](https://tanstack.com/query)                        |
| Local State  | [Zustand](https://zustand.docs.pmnd.rs) (persisted auth & settings)    |
| Validation   | [Zod v4](https://zod.dev) (schemas, API contracts, form validation)    |
| i18n         | [LinguiJS](https://lingui.dev) (en + zh catalogs)                      |
| Icons        | [lucide-react](https://lucide.dev/guide/packages/lucide-react)         |
| API Mocking  | [MSW 2.x](https://mswjs.io) (Service Worker based)                     |
| E2E Testing  | [Playwright](https://playwright.dev)                                   |
| Language     | TypeScript 5.9 (strict mode)                                           |

## Features

- **JWT Authentication** — Login with access/refresh token flow, persisted via Zustand
- **Dynamic Menu & RBAC** — Backend-driven sidebar menu with permission guards and 403 page
- **URL-First State** — Table search params (page, pageSize, keyword, sort) synced to URL
- **i18n** — LinguiJS with English (`en`) and Chinese (`zh`); Ant Design locales wired in root
- **Dark Mode** — One-click toggle with Ant Design theme algorithm
- **Full Type Safety** — Zod schemas validate API boundaries at runtime where used
- **Zero-Config Mocking** — MSW intercepts API calls in development, no backend needed

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [Vite+](https://viteplus.dev/guide/) CLI (`vp`)

### Install & Run

```bash
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

```bash
vp run test:e2e
vp run test:e2e:core
vp run test:e2e:ui   # interactive UI mode
```

`test:e2e:core` runs the scaffold's highest-value flows: login, users CRUD, auth refresh, RBAC, URL state (see `package.json` script list).

## Project Structure

```
.github/instructions/   # Scoped AI recipes (mirrored in ../../.cursor/rules/with-lingui-*.mdc)
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
│   └── handlers/         # Request handlers (auth, users, …)
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

e2e/                      # Playwright E2E tests
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

- **New CRUD resource:** See `.github/instructions/add-resource.instructions.md` (checklist; copy from `users`), then `pnpm run i18n:extract && pnpm run i18n:compile`, wire Sidebar labels/icons if needed (§6b in that doc), and `pnpm exec vp check --no-fmt`.
- **Real backend:** Point `VITE_API_BASE_URL` in env and disable or remove MSW in `main.tsx` when you no longer need mocks.
- **Drop i18n:** Remove Lingui packages, vite/swc plugins, and replace `t` macros with plain strings (larger refactor).

### AI instruction files

**细则单源**：`apps/with-lingui/.github/instructions/`（`*.instructions.md`），人类与 Agent 以该目录为准维护、评审。

**Cursor**：仓库根 `.cursor/rules/with-lingui-*.mdc` 为**薄规则**（方案 A）：只写范围与指向路径，`globs` 与上述文件的 `applyTo` 对齐；全文请在对话中 `@` 对应 `.instructions.md` 或自行打开该文件。

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
