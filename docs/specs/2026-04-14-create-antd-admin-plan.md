# create-antdadmin（packages/create）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add workspace package `packages/create`, publishable as npm `create-antdadmin`, which downloads `apps/<example>` from `zuiidea/antd-admin` on GitHub (tag aligned to CLI version), runs interactive or flag-driven prompts, applies `package.json` name transforms, installs with the user’s package manager, and initializes git by default.

**Architecture:** A small Node ESM CLI built with `tsup` into `dist/`; `commander` parses flags; `@inquirer/prompts` fills gaps; `giget` downloads `github:zuiidea/antd-admin/apps/<example>#<ref>` where `<ref>` defaults to `v<cliVersion>` with env overrides; a post-build script writes `dist/examples.json` by scanning `../../apps/*` and excluding `docs`; transforms are plain filesystem + JSON rewrites; install uses `child_process.spawn` with stdio inherited.

**Tech Stack:** TypeScript 5.9, `tsup`, `commander`, `@inquirer/prompts`, `giget`, `picocolors`, `vitest` (package-local only).

**Design spec:** `docs/specs/2026-04-14-create-antd-admin-design.md`

---

## File map (create or modify)

| Path | Responsibility |
|------|----------------|
| `packages/create/package.json` | Package metadata, `bin`, scripts, dependencies |
| `packages/create/tsconfig.json` | ESM + Node types, `rootDir`/`outDir` for src |
| `packages/create/tsup.config.ts` | Bundle entry `src/cli.ts` → `dist/cli.js`, platform `node`, format `esm` |
| `packages/create/scripts/write-examples-json.mjs` | Post-build: scan monorepo `apps/*`, exclude `docs`, write `dist/examples.json` |
| `packages/create/src/cli.ts` | Shebang entry, `commander` program, delegates to `runCreate` |
| `packages/create/src/commands/create.ts` | Orchestrates resolve → prompts → download → copy/transform → install → git |
| `packages/create/src/types.ts` | Shared types for CLI options and resolved context |
| `packages/create/src/constants.ts` | `DEFAULT_GITHUB_REPO`, env var names, exit codes |
| `packages/create/src/examples.ts` | Load and validate example short names from `dist/examples.json` |
| `packages/create/src/resolve-ref.ts` | Resolve Git ref from `CREATE_ANTD_ADMIN_REF`, `package.json` version, or `main` fallback |
| `packages/create/src/resolve-example-source.ts` | Map short name or URL + `--example-path` to giget source string |
| `packages/create/src/paths.ts` | Resolve absolute target dir, guard `.` confirmation, reject non-empty targets |
| `packages/create/src/prompts.ts` | All `@inquirer/prompts` flows |
| `packages/create/src/download.ts` | `giget.downloadTemplate` into a temp directory under `os.tmpdir()` |
| `packages/create/src/transforms/package-json-name.ts` | Read/write `package.json` `name` field |
| `packages/create/src/transforms/run-transforms.ts` | Ordered transform runner, `skipTransforms` no-op |
| `packages/create/src/package-manager.ts` | Detect available managers (`which`-style using `spawnSync`), pick install argv |
| `packages/create/src/install.ts` | Run non-interactive install in project root |
| `packages/create/src/git.ts` | Optional `git init` + initial commit, or strip `.git` when `--no-git` |
| `packages/create/src/errors.ts` | `CliError` class with `code` and `exitCode` |
| `packages/create/vitest.config.ts` | Vitest for `src/**/*.test.ts` |
| `packages/create/src/utils/normalize-package-name.test.ts` | Tests for name normalization |
| `packages/create/src/resolve-example-source.test.ts` | Tests for URL / path resolution |
| `packages/create/src/integration/create-pipeline.test.ts` | Mocked download fixture → transforms (no network) |
| `turbo.json` | Add `packages/create` to implicit discovery via workspace (no change if tasks already glob); ensure `build` `outputs` include `dist/**` for the new package (root `turbo.json` already has `dist/**`) |
| `README.md` | One subsection line under Templates: `pnpm dlx create-antdadmin@latest` |

---

### Task 1: Scaffold `packages/create` package metadata

**Files:**
- Create: `packages/create/package.json`
- Create: `packages/create/tsconfig.json`

- [ ] **Step 1: Add `packages/create/package.json`**

```json
{
  "name": "create-antdadmin",
  "version": "6.0.0",
  "description": "Create an Antd Admin app from official examples",
  "license": "MIT",
  "type": "module",
  "bin": {
    "create-antdadmin": "./dist/cli.js"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup && node ./scripts/write-examples-json.mjs",
    "dev": "tsup --watch",
    "check-types": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "@inquirer/prompts": "^7.10.1",
    "commander": "^14.0.0",
    "giget": "^3.2.0",
    "picocolors": "^1.0.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "tsup": "^8.3.5",
    "typescript": "~5.9.3",
    "vitest": "^3.0.5"
  }
}
```

- [ ] **Step 2: Add `packages/create/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"],
    "resolveJsonModule": true,
    "rootDir": ".",
    "verbatimModuleSyntax": true
  },
  "include": ["src/**/*.ts", "tsup.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 3: Install from monorepo root**

Run:

```bash
cd /Users/zuiidea/web/antd-admin && pnpm install
```

Expected: lockfile updates; workspace links `packages/create`.

- [ ] **Step 4: Commit**

```bash
git add packages/create/package.json packages/create/tsconfig.json pnpm-lock.yaml
git commit -m "chore(create): scaffold create-antdadmin package"
```

---

### Task 2: Build pipeline (`tsup` + examples JSON)

**Files:**
- Create: `packages/create/tsup.config.ts`
- Create: `packages/create/scripts/write-examples-json.mjs`
- Create: `packages/create/src/cli.ts` (minimal stub so `tsup` succeeds)

- [ ] **Step 1: Add `packages/create/tsup.config.ts`**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  outDir: "dist",
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  shims: false,
});
```

- [ ] **Step 2: Add stub `packages/create/src/cli.ts`**

```typescript
#!/usr/bin/env node
console.log("create-antdadmin stub");
```

- [ ] **Step 3: Add `packages/create/scripts/write-examples-json.mjs`**

```javascript
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** From `packages/create/scripts/`, three levels up = monorepo root. */
const repoRoot = path.resolve(__dirname, "../../..");
const appsDir = path.join(repoRoot, "apps");
const outFile = path.resolve(__dirname, "../dist/examples.json");

const exclude = new Set(["docs"]);
const names = fs
  .readdirSync(appsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => !exclude.has(name))
  .sort();

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ examples: names }, null, 2));
console.log(`write-examples-json: wrote ${outFile}`, names);
```

- [ ] **Step 4: Run build**

Run:

```bash
cd /Users/zuiidea/web/antd-admin/packages/create && pnpm run build
```

Expected: `dist/cli.js` exists with shebang; `dist/examples.json` lists `basic` and `with-lingui` (and any future apps except `docs`).

- [ ] **Step 5: Commit**

```bash
git add packages/create/tsup.config.ts packages/create/scripts/write-examples-json.mjs packages/create/src/cli.ts packages/create/dist
```

Note: if `dist/` is gitignored in this repo, **do not** commit `dist/`; adjust `.gitignore` only if product policy requires shipping built artifacts in-repo (default: **gitignore `packages/create/dist`**, npm publish runs `pnpm build` in `prepublishOnly`). If `dist/` is ignored, add to `packages/create/package.json`:

```json
"scripts": {
  "prepublishOnly": "pnpm run build"
}
```

and remove `git add packages/create/dist` from the commit step; verify root `.gitignore` for `dist`.

- [ ] **Step 5b (conditional): If dist is gitignored, amend commit without dist**

```bash
git add packages/create/tsup.config.ts packages/create/scripts/write-examples-json.mjs packages/create/src/cli.ts packages/create/package.json
git commit -m "build(create): tsup bundle and postbuild examples manifest"
```

---

### Task 3: Constants, errors, ref resolution

**Files:**
- Create: `packages/create/src/constants.ts`
- Create: `packages/create/src/errors.ts`
- Create: `packages/create/src/resolve-ref.ts`

- [ ] **Step 1: Add `packages/create/src/constants.ts`**

```typescript
export const DEFAULT_GITHUB_REPO = "zuiidea/antd-admin";

/** Override full repo slug `owner/name` */
export const ENV_REPO = "CREATE_ANTD_ADMIN_REPO";

/** Override ref: branch name, tag, or commit sha */
export const ENV_REF = "CREATE_ANTD_ADMIN_REF";

export const EXIT_SUCCESS = 0;
export const EXIT_ERROR = 1;
export const EXIT_SIGINT = 130;
```

- [ ] **Step 2: Add `packages/create/src/errors.ts`**

```typescript
export class CliError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_INPUT"
      | "DOWNLOAD_FAILED"
      | "TRANSFORM_FAILED"
      | "INSTALL_FAILED",
    public readonly exitCode = 1
  ) {
    super(message);
    this.name = "CliError";
  }
}
```

- [ ] **Step 3: Add `packages/create/src/resolve-ref.ts`**

```typescript
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENV_REF } from "./constants.js";

/**
 * Priority: CREATE_ANTD_ADMIN_REF env → read sibling package.json version as `v${version}` → `main` on failure.
 * When bundled to dist/cli.js, ../package.json is packages/create/package.json.
 */
export function resolveGitRef(): string {
  const env = process.env[ENV_REF]?.trim();
  if (env) return env;

  try {
    const pkgPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "package.json"
    );
    const raw = fs.readFileSync(pkgPath, "utf8");
    const { version } = JSON.parse(raw) as { version: string };
    return `v${version}`;
  } catch {
    return "main";
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/create/src/constants.ts packages/create/src/errors.ts packages/create/src/resolve-ref.ts
git commit -m "feat(create): add constants, CliError, and git ref resolver"
```

---

### Task 4: Examples manifest loader

**Files:**
- Create: `packages/create/src/examples.ts`

- [ ] **Step 1: Implement `packages/create/src/examples.ts`**

```typescript
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CliError } from "./errors.js";

export type ExamplesManifest = { examples: string[] };

export function loadExamplesManifest(): string[] {
  const manifestPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "examples.json"
  );
  if (!fs.existsSync(manifestPath)) {
    throw new CliError(
      `Missing ${manifestPath}. Run pnpm run build in packages/create.`,
      "INVALID_INPUT"
    );
  }
  const data = JSON.parse(
    fs.readFileSync(manifestPath, "utf8")
  ) as ExamplesManifest;
  if (!Array.isArray(data.examples) || data.examples.length === 0) {
    throw new CliError("Invalid examples.json", "INVALID_INPUT");
  }
  return data.examples;
}

export function assertValidExample(name: string, list: string[]): void {
  if (!list.includes(name)) {
    throw new CliError(
      `Unknown example "${name}". Valid: ${list.join(", ")}`,
      "INVALID_INPUT"
    );
  }
}
```

- [ ] **Step 2: Run tests (none yet) + typecheck**

Run:

```bash
cd /Users/zuiidea/web/antd-admin/packages/create && pnpm run check-types
```

Expected: PASS (after other files exist, or stub imports).

- [ ] **Step 3: Commit**

```bash
git add packages/create/src/examples.ts
git commit -m "feat(create): load examples manifest from dist/examples.json"
```

---

### Task 5: Normalize npm package name (+ tests)

**Files:**
- Create: `packages/create/src/utils/normalize-package-name.ts`
- Create: `packages/create/src/utils/normalize-package-name.test.ts`
- Create: `packages/create/vitest.config.ts`

- [ ] **Step 1: Add `packages/create/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Add `packages/create/src/utils/normalize-package-name.ts`**

```typescript
import { CliError } from "../errors.js";

/**
 * npm package name rules (simplified): lowercase, URL-safe, no leading dot, segments 1-214.
 */
export function normalizePackageName(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    throw new CliError("Project name cannot be empty", "INVALID_INPUT");
  }
  if (trimmed.startsWith(".") || trimmed.startsWith("_")) {
    throw new CliError(
      "Project name cannot start with . or _",
      "INVALID_INPUT"
    );
  }
  const safe = trimmed
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-._~]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!safe || safe.length > 214) {
    throw new CliError("Project name is invalid or too long", "INVALID_INPUT");
  }
  return safe;
}
```

- [ ] **Step 3: Add `packages/create/src/utils/normalize-package-name.test.ts`**

```typescript
import { describe, expect, it } from "vitest";
import { normalizePackageName } from "./normalize-package-name.js";

describe("normalizePackageName", () => {
  it("lowercases and replaces spaces", () => {
    expect(normalizePackageName("My App")).toBe("my-app");
  });

  it("rejects leading dot", () => {
    expect(() => normalizePackageName(".bad")).toThrow(/cannot start/);
  });
});
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd /Users/zuiidea/web/antd-admin/packages/create && pnpm exec vitest run src/utils/normalize-package-name.test.ts
```

Expected: tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/create/vitest.config.ts packages/create/src/utils/normalize-package-name.ts packages/create/src/utils/normalize-package-name.test.ts
git commit -m "test(create): vitest and package name normalization"
```

---

### Task 6: Resolve giget source from `--example` URL or short name (+ tests)

**Files:**
- Create: `packages/create/src/resolve-example-source.ts`
- Create: `packages/create/src/resolve-example-source.test.ts`

- [ ] **Step 1: Add `packages/create/src/resolve-example-source.ts`** (three branches; `CliError` for missing `example`)

```typescript
import { DEFAULT_GITHUB_REPO, ENV_REPO } from "./constants.js";
import { CliError } from "./errors.js";
import { resolveGitRef } from "./resolve-ref.js";

export type ResolvedExampleSource = { gigetSource: string; displayName: string };

function defaultRepo(): string {
  return process.env[ENV_REPO]?.trim() || DEFAULT_GITHUB_REPO;
}

export function resolveExampleSource(input: {
  example?: string;
  examplePath?: string;
}): ResolvedExampleSource {
  const example = input.example?.trim();
  if (!example) {
    throw new CliError("example is required", "INVALID_INPUT");
  }
  const { examplePath } = input;
  const ref = resolveGitRef();

  if (/^https?:\/\//i.test(example)) {
    return { gigetSource: example, displayName: example };
  }

  const repo = defaultRepo();

  if (!example.includes("/")) {
    const sub = examplePath
      ? `apps/${example}/${examplePath}`.replace(/\/+/g, "/")
      : `apps/${example}`;
    const gigetSource = `github:${repo}/${sub}#${ref}`;
    return { gigetSource, displayName: example };
  }

  const pathPart = examplePath ? `${example}/${examplePath}` : example;
  const gigetSource = `github:${pathPart}#${ref}`;
  return { gigetSource, displayName: pathPart };
}
```

**`--example-path` 与短名组合：** 上式将 `examplePath` 追加在 `apps/<example>/` 之后，用于少数子路径场景；若与 create-turbo 的语义需完全对齐，在实现时以本文件单测为准调整拼接规则。

- [ ] **Step 2: Add `packages/create/src/resolve-example-source.test.ts`**

```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolveExampleSource } from "./resolve-example-source.js";

describe("resolveExampleSource", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves short example with default repo and env ref", () => {
    vi.stubEnv("CREATE_ANTD_ADMIN_REF", "main");
    const r = resolveExampleSource({ example: "basic" });
    expect(r.gigetSource).toBe("github:zuiidea/antd-admin/apps/basic#main");
  });

  it("passes through https URL", () => {
    const url = "https://api.github.com/repos/zuiidea/antd-admin/tarball/main";
    const r = resolveExampleSource({ example: url });
    expect(r.gigetSource).toBe(url);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/zuiidea/web/antd-admin/packages/create && pnpm exec vitest run src/resolve-example-source.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add packages/create/src/resolve-example-source.ts packages/create/src/resolve-example-source.test.ts
git commit -m "feat(create): resolve giget source for examples and URLs"
```

---

### Task 7: Target path validation (`paths.ts`)

**Files:**
- Create: `packages/create/src/paths.ts`

- [ ] **Step 1: Add `packages/create/src/paths.ts`**

```typescript
import fs from "node:fs";
import path from "node:path";
import { CliError } from "./errors.js";

export function resolveTargetRoot(cwd: string, dir: string): string {
  const abs = path.resolve(cwd, dir);
  if (fs.existsSync(abs)) {
    const entries = fs.readdirSync(abs);
    if (entries.length > 0) {
      throw new CliError(
        `Target directory is not empty: ${abs}`,
        "INVALID_INPUT"
      );
    }
  }
  return abs;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/create/src/paths.ts
git commit -m "feat(create): reject non-empty target directories"
```

---

### Task 8: Download template with giget

**Files:**
- Create: `packages/create/src/download.ts`

- [ ] **Step 1: Add `packages/create/src/download.ts`**

```typescript
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { downloadTemplate } from "giget";
import { CliError } from "./errors.js";

export async function downloadExampleToTemp(
  gigetSource: string
): Promise<string> {
  const dir = path.join(os.tmpdir(), `create-antdadmin-${randomUUID()}`);
  try {
    const { dir: outDir } = await downloadTemplate(gigetSource, {
      dir,
      forceClean: true,
    });
    return outDir;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new CliError(
      `Failed to download template.\nSource: ${gigetSource}\n${msg}`,
      "DOWNLOAD_FAILED"
    );
  }
}
```

- [ ] **Step 2: Manual smoke (network)**

Run (requires network and valid ref `main` or tag on GitHub):

```bash
cd /Users/zuiidea/web/antd-admin/packages/create && CREATE_ANTD_ADMIN_REF=main node -e "import { downloadExampleToTemp } from './dist/download.js';"
```

Implementor: add a tiny `scripts/smoke-download.mjs` if needed; or run integration test in Task 11 with mock.

- [ ] **Step 3: Commit**

```bash
git add packages/create/src/download.ts
git commit -m "feat(create): download templates with giget"
```

---

### Task 9: Transforms — `package.json` name

**Files:**
- Create: `packages/create/src/transforms/run-transforms.ts`
- Create: `packages/create/src/transforms/package-json-name.ts`

- [ ] **Step 1: Add `packages/create/src/transforms/package-json-name.ts`**

```typescript
import fs from "node:fs";
import path from "node:path";
import { CliError } from "../errors.js";

export function transformPackageJsonName(
  projectRoot: string,
  name: string
): void {
  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new CliError(`No package.json at ${pkgPath}`, "TRANSFORM_FAILED");
  }
  const raw = fs.readFileSync(pkgPath, "utf8");
  const json = JSON.parse(raw) as { name?: string };
  json.name = name;
  fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2) + "\n");
}
```

- [ ] **Step 2: Add `packages/create/src/transforms/run-transforms.ts`**

```typescript
import { transformPackageJsonName } from "./package-json-name.js";

export async function runTransforms(opts: {
  projectRoot: string;
  packageName: string;
  skip: boolean;
}): Promise<void> {
  if (opts.skip) return;
  transformPackageJsonName(opts.projectRoot, opts.packageName);
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/create/src/transforms/package-json-name.ts packages/create/src/transforms/run-transforms.ts
git commit -m "feat(create): transform package.json name"
```

---

### Task 10: Package manager detection + install

**Files:**
- Create: `packages/create/src/package-manager.ts`
- Create: `packages/create/src/install.ts`

- [ ] **Step 1: Add `packages/create/src/package-manager.ts`**

```typescript
import { spawnSync } from "node:child_process";

export type PackageManagerName = "npm" | "pnpm" | "yarn" | "bun";

const ORDER: PackageManagerName[] = ["pnpm", "npm", "yarn", "bun"];

export function isManagerAvailable(name: PackageManagerName): boolean {
  const result = spawnSync(name, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

export function detectAvailableManagers(): PackageManagerName[] {
  return ORDER.filter(isManagerAvailable);
}

/** Install argv; cwd is applied by install.ts via spawnSync `cwd` option. */
export function spawnInstall(name: PackageManagerName): {
  cmd: string;
  args: string[];
} {
  switch (name) {
    case "pnpm":
      return { cmd: "pnpm", args: ["install"] };
    case "npm":
      return { cmd: "npm", args: ["install"] };
    case "yarn":
      return { cmd: "yarn", args: ["install"] };
    case "bun":
      return { cmd: "bun", args: ["install"] };
    default: {
      const _: never = name;
      throw new Error(`unsupported manager ${_}`);
    }
  }
}
```

- [ ] **Step 2: Add `packages/create/src/install.ts`**

```typescript
import { spawnSync } from "node:child_process";
import type { PackageManagerName } from "./package-manager.js";
import { spawnInstall } from "./package-manager.js";
import { CliError } from "./errors.js";

export function installDependencies(
  cwd: string,
  manager: PackageManagerName
): void {
  const { cmd, args } = spawnInstall(manager);
  const res = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, CI: "1" },
  });
  if (res.error || res.status !== 0) {
    throw new CliError(
      `${cmd} ${args.join(" ")} failed in ${cwd}`,
      "INSTALL_FAILED"
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/create/src/package-manager.ts packages/create/src/install.ts
git commit -m "feat(create): detect package managers and run install"
```

---

### Task 11: Git init

**Files:**
- Create: `packages/create/src/git.ts`

- [ ] **Step 1: Add `packages/create/src/git.ts`**

```typescript
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function tryGitInit(root: string, enabled: boolean): boolean {
  if (!enabled) {
    const gitDir = path.join(root, ".git");
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }
    return false;
  }
  const init = spawnSync("git", ["init"], { cwd: root, stdio: "ignore" });
  if (init.status !== 0) return false;
  spawnSync("git", ["add", "-A"], { cwd: root, stdio: "ignore" });
  spawnSync(
    "git",
    ["commit", "-m", "chore: initial commit from create-antdadmin"],
    { cwd: root, stdio: "ignore" }
  );
  return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/create/src/git.ts
git commit -m "feat(create): optional git init and initial commit"
```

---

### Task 12: Prompts (`prompts.ts`)

**Files:**
- Create: `packages/create/src/prompts.ts`
- Create: `packages/create/src/types.ts`

- [ ] **Step 1: Add `packages/create/src/types.ts`**

```typescript
import type { PackageManagerName } from "./package-manager.js";

export type CreateCliOptions = {
  packageManager?: PackageManagerName;
  skipInstall: boolean;
  skipTransforms: boolean;
  example?: string;
  examplePath?: string;
  git: boolean;
};

export type CreateContext = {
  example: string;
  targetDir: string;
  packageName: string;
  packageManager: PackageManagerName;
};
```

- [ ] **Step 2: Add `packages/create/src/prompts.ts`**

```typescript
import { confirm, input, select } from "@inquirer/prompts";
import type { PackageManagerName } from "./package-manager.js";
import { CliError } from "./errors.js";
import { normalizePackageName } from "./utils/normalize-package-name.js";

export async function promptExample(examples: string[]): Promise<string> {
  return select({
    message: "Which example do you want?",
    choices: examples.map((value) => ({ name: value, value })),
  });
}

export async function promptTargetDir(): Promise<string> {
  const raw = await input({
    message:
      "Project directory (relative path, or '.' for current directory)?",
    default: "my-antd-admin",
  });
  const dir = (raw.trim() || "my-antd-admin").replace(/\\/g, "/");
  if (dir === ".") {
    const ok = await confirm({
      message: "Scaffold into the current directory?",
      default: false,
    });
    if (!ok) {
      throw new CliError("Aborted.", "INVALID_INPUT");
    }
  }
  return dir;
}

export async function promptPackageName(defaultName: string): Promise<string> {
  const raw = await input({
    message: "npm package name for package.json?",
    default: defaultName,
    validate: (value) => {
      try {
        normalizePackageName(value);
        return true;
      } catch (e) {
        return e instanceof Error ? e.message : String(e);
      }
    },
  });
  return normalizePackageName(raw);
}

export async function promptPackageManager(
  available: PackageManagerName[]
): Promise<PackageManagerName> {
  if (available.length === 0) {
    throw new CliError(
      "No supported package manager found in PATH (pnpm, npm, yarn, bun).",
      "INVALID_INPUT"
    );
  }
  return select({
    message: "Which package manager do you want to use?",
    choices: available.map((value) => ({ name: value, value })),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/create/src/prompts.ts packages/create/src/types.ts
git commit -m "feat(create): interactive prompts for example, dir, name, pm"
```

---

### Task 13: Wire `cli.ts` + `commands/create.ts` orchestration

**Files:**
- Modify: `packages/create/src/cli.ts` (replace stub)
- Create: `packages/create/src/commands/create.ts`

- [ ] **Step 1: Replace `packages/create/src/cli.ts`**

```typescript
#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { runCreate } from "./commands/create.js";
import { EXIT_ERROR, EXIT_SIGINT } from "./constants.js";
import { CliError } from "./errors.js";

const program = new Command();

program
  .name("create-antdadmin")
  .description("Create an Antd Admin app from official examples")
  .argument("[project-directory]", "Directory for the new project")
  .option(
    "-e, --example <name|url>",
    "Example name (see dist/examples.json) or a template URL"
  )
  .option(
    "--example-path <path>",
    "Path inside repo when URL parsing is ambiguous"
  )
  .option(
    "-m, --package-manager <npm|yarn|pnpm|bun>",
    "Package manager to use"
  )
  .option("--skip-install", "Skip installing dependencies", false)
  .option("--skip-transforms", "Skip code transforms", false)
  .option("--no-git", "Skip git repository initialization")
  .action(async (projectDirectory: string | undefined, opts) => {
    try {
      await runCreate({
        projectDirectory,
        ...opts,
        git: opts.git !== false,
      });
    } catch (e) {
      if (e instanceof CliError) {
        console.error(pc.red(e.message));
        process.exit(e.exitCode);
      }
      console.error(e);
      process.exit(EXIT_ERROR);
    }
  });

process.on("SIGINT", () => {
  process.exit(EXIT_SIGINT);
});

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exit(EXIT_ERROR);
});
```

- [ ] **Step 2: Implement `packages/create/src/commands/create.ts`** sequence:

  1. Load manifest via `loadExamplesManifest()`.
  2. Resolve `example` from flag or `promptExample`.
  3. Resolve `projectDirectory` from arg or prompt; then `resolveTargetRoot(cwd, dir)`; handle `.` confirm in `paths.ts` or prompts.
  4. `resolveExampleSource({ example, examplePath })`.
  5. `downloadExampleToTemp` → giget output dir is **already** extracted template root (apps/basic contents) — verify giget behavior: for `github:org/repo/apps/basic#ref`, `dir` contains files of `apps/basic` at top level. If giget nests, add a copy step in `create.ts`.
  6. Copy from temp to target using `fs.cpSync(temp, target, { recursive: true })` if giget did not write directly to target.
  7. `normalizePackageName` on chosen name.
  8. `runTransforms`.
  9. If `--skip-transforms` and `-m` passed, `console.warn` per spec.
  10. `installDependencies` unless `skipInstall`.
  11. `tryGitInit`.

- [ ] **Step 3: Run end-to-end locally (network)**

```bash
cd /tmp && rm -rf cad-test && mkdir cad-test && cd cad-test && CREATE_ANTD_ADMIN_REF=main node /Users/zuiidea/web/antd-admin/packages/create/dist/cli.js my-app --example basic --skip-install
```

Expected: `my-app/package.json` exists; if download fails, fix ref or use tag that exists on GitHub.

- [ ] **Step 4: Commit**

```bash
git add packages/create/src/cli.ts packages/create/src/commands/create.ts
git commit -m "feat(create): wire CLI entry and create command pipeline"
```

---

### Task 14: Integration test with fixture (no network)

**Files:**
- Create: `packages/create/src/integration/create-pipeline.test.ts`
- Create: `packages/create/fixtures/minimal-app/package.json`

- [ ] **Step 1: Add fixture `packages/create/fixtures/minimal-app/package.json`**

```json
{
  "name": "template-placeholder",
  "version": "0.0.0",
  "private": true
}
```

- [ ] **Step 2: Add test that copies fixture to temp dir, runs `runTransforms` + asserts name**

```typescript
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runTransforms } from "../transforms/run-transforms.js";
import { fileURLToPath } from "node:url";

describe("create pipeline transforms", () => {
  it("renames package.json", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cad-"));
    const fixture = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../fixtures/minimal-app"
    );
    fs.cpSync(fixture, tmp, { recursive: true });
    await runTransforms({
      projectRoot: tmp,
      packageName: "my-fine-app",
      skip: false,
    });
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmp, "package.json"), "utf8")
    );
    expect(pkg.name).toBe("my-fine-app");
  });
});
```

- [ ] **Step 3: Run**

```bash
cd /Users/zuiidea/web/antd-admin/packages/create && pnpm exec vitest run
```

- [ ] **Step 4: Commit**

```bash
git add packages/create/src/integration/create-pipeline.test.ts packages/create/fixtures/minimal-app/package.json
git commit -m "test(create): integration test for transforms without network"
```

---

### Task 15: Monorepo integration + README

**Files:**
- Modify: `README.md`
- Modify: `packages/create/package.json` (add `prepublishOnly`, eslint if repo shares config)

- [ ] **Step 1: Ensure turbo picks up package**

Run:

```bash
cd /Users/zuiidea/web/antd-admin && pnpm turbo run build --filter=create-antdadmin
```

Expected: SUCCESS.

- [ ] **Step 2: Add README snippet** (exact text implementor inserts under `## Templates` or equivalent heading in `README.md`):

```markdown
**CLI:** Scaffold a standalone app from an official example:

`pnpm dlx create-antdadmin@latest`
```

- [ ] **Step 3: Add `prepublishOnly` to `packages/create/package.json`**

```json
"prepublishOnly": "pnpm run build"
```

- [ ] **Step 4: Commit**

```bash
git add README.md packages/create/package.json
git commit -m "docs: document create-antdadmin dlx usage; prepublish build"
```

---

## Release checklist (manual, not a code task)

- Publish `create-antdadmin@6.0.0` to npm after ensuring GitHub tag **`v6.0.0`** exists on `zuiidea/antd-admin` pointing to a commit that contains the referenced `apps/basic` and `apps/with-lingui` trees (or temporarily document use of `CREATE_ANTD_ADMIN_REF=main` until tags are automated).

---

## Plan self-review (spec coverage)

| Spec section | Tasks |
|--------------|-------|
| dlx + bin + dist-only publish | Task 1, 2, 15 |
| GitHub download create-turbo style | Task 6, 8, 13 |
| examples manifest exclude docs | Task 2, 4 |
| Interactive without `--example` | Task 12, 13 |
| Flags including skip-install/transforms, no-git | Task 1, 13 |
| Transforms package.json name | Task 9, 14 |
| Package managers + install | Task 10, 13 |
| Git init default | Task 11, 13 |
| Error codes / messages | Tasks 3–11, 13 |
| Tests | Tasks 5, 6, 14 |
| README | Task 15 |

**Placeholder scan:** 无 TBD；Task 10 以最终 `spawnInstall` + `installDependencies` 代码块为准。

---

## Execution handoff

Plan complete and saved to `docs/specs/2026-04-14-create-antd-admin-plan.md`.

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task above, review between tasks.

**2. Inline Execution** — run tasks in this session with checkpoints after Task 2, 8, and 13.

Which approach do you want for implementation?
