# Antd Admin

A practical admin monorepo with two production-style templates, mock-first development, and test coverage.

- **`apps/basic`**: English-only setup
- **`apps/with-lingui`**: Bilingual setup (`en` + `zh`) with Lingui
- **`apps/docs`**: Nextra documentation site
- **`packages/create`**: `init-antd-admin` scaffolding CLI

## Links

- [Ant Design](https://github.com/ant-design/ant-design)
- [React](https://react.dev)
- [Vite+](https://viteplus.dev)
- [TypeScript](https://www.typescriptlang.org/)
- [Issues](https://github.com/zuiidea/antd-admin/issues)
- [Stars](https://github.com/zuiidea/antd-admin/stargazers)
- [PRs Welcome](https://github.com/zuiidea/antd-admin/pulls)
- [License (MIT)](http://opensource.org/licenses/MIT)

## Tech Stack

| Category | Technology |
| --- | --- |
| Build tool | [Vite+](https://viteplus.dev) |
| UI | [Ant Design 6.x](https://ant.design) |
| Routing | [TanStack Router](https://tanstack.com/router) |
| Async state | [TanStack Query v5](https://tanstack.com/query) |
| Local state | [Zustand](https://zustand.docs.pmnd.rs) |
| Validation | [Zod v4](https://zod.dev) |
| i18n | [LinguiJS](https://lingui.dev) in `apps/with-lingui` |
| Mocking | [MSW 2.x](https://mswjs.io) |
| E2E tests | [Playwright](https://playwright.dev) |
| Language | TypeScript 5.9 (strict) |

## Highlights

- JWT login with access/refresh flow
- Backend-driven menu and permission guards
- URL-synced table state (pagination, sorting, search)
- Dark mode theme switching
- Mock-first local development (no backend required)
- Typed API boundaries and reusable CRUD patterns

## Templates

| Template | Use when |
| --- | --- |
| `with-lingui` | You need multilingual UI (`en` + `zh`) and Lingui workflow |
| `basic` | You need a simpler English-only setup |

## `init-antd-admin` Usage

Use the scaffolding CLI to create a standalone app from official templates.

### Interactive

```bash
npx init-antd-admin@latest
pnpm dlx init-antd-admin@latest
yarn dlx init-antd-admin@latest
bunx init-antd-admin@latest
```

### Non-interactive examples

```bash
pnpm dlx init-antd-admin@latest my-app --example basic -m pnpm
pnpm dlx init-antd-admin@latest my-app --example with-lingui --skip-install
```

### Common options

| Option | Description |
| --- | --- |
| `[project-directory]` | Target folder |
| `-e, --example <name|url>` | Template source |
| `--example-path <path>` | Subpath inside remote repository |
| `-m, --package-manager <pm>` | `npm` / `pnpm` / `yarn` / `bun` |
| `--skip-install` | Skip dependency install |
| `--skip-transforms` | Skip rewrite transforms |
| `--no-git` | Skip git initialization |

For package-specific details, see [`packages/create/README.md`](./packages/create/README.md).

Production docs: [https://antd-admin-doc.zuiidea.top](https://antd-admin-doc.zuiidea.top)

## License

MIT