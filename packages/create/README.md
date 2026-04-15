# create-antd-admin

Scaffold a **standalone** [Antd Admin](https://github.com/zuiidea/antd-admin) style app from official monorepo examples (`apps/basic`, `apps/with-lingui`, …). Templates are fetched from GitHub at install time (similar idea to [create-turbo](https://github.com/vercel/turborepo/tree/main/packages/create-turbo)).

**Requirements:** Node.js ≥ 20.

## Usage

```bash
pnpm dlx create-antd-admin@latest
```

Non-interactive example:

```bash
pnpm dlx create-antd-admin@latest my-app --example basic -m pnpm
```

Skip dependency install (faster smoke test):

```bash
pnpm dlx create-antd-admin@latest my-app --example basic --skip-install
```

### CLI options

| Option | Description |
|--------|-------------|
| `[project-directory]` | Target folder (relative path or `.`; empty dirs only) |
| `-e, --example <name\|url>` | Example id from the built-in list, or a template URL |
| `--example-path <path>` | Extra path inside the repo when using a URL |
| `-m, --package-manager` | `npm` \| `yarn` \| `pnpm` \| `bun` |
| `--skip-install` | Do not run install after scaffold |
| `--skip-transforms` | Skip rewrites (e.g. `package.json` name) |
| `--no-git` | Do not run `git init` |
| `-v, --version` | Print CLI version |
| `-h, --help` | Print help |

Run `create-antd-admin --help` for the full help text.

## Environment

| Variable | Purpose |
|----------|---------|
| `CREATE_ANTD_ADMIN_REPO` | Override `owner/name` (default: `zuiidea/antd-admin`) |
| `CREATE_ANTD_ADMIN_REF` | Override Git ref (branch, tag, or SHA). Default is `v<cliVersion>` from this package’s `package.json`; falls back to `main` if the version file cannot be read. |

## Built-in examples

At **publish** time, `apps/*` is scanned (excluding `apps/docs`) and written to `dist/examples.json`. Short names passed to `--example` must appear in that list.

## Develop in this monorepo

From repository root:

```bash
pnpm install
cd packages/create
pnpm run build
pnpm test
node dist/cli.js --help
```

Design and implementation notes live under `docs/specs/` in the monorepo (e.g. `2026-04-14-create-antd-admin-design.md`).

## License

MIT (same as the parent repository).
