# antd-admin-cli（packages/create）设计规格

> 状态：已定稿待实现审阅  
> 日期：2026-04-14  
> 路径说明：本仓库 `.gitignore` 忽略 `docs/superpowers/`，规格放在 `docs/specs/` 与既有文档一致。

## 1. 背景与动机

在 monorepo 中新增 **`packages/create`**，以 npm 包 **`antd-admin-cli`** 发布，提供与 [create-turbo](https://github.com/vercel/turborepo/tree/main/packages/create-turbo) 相近体验的命令行工具：从 **GitHub 上的 `apps/<example>`** 拉取模板，在用户本机生成 **独立可运行** 的前端应用，并支持 **交互式选择模板**、**包管理器选择与安装**、**项目名称 transforms**。

## 2. 目标与非目标

### 2.1 目标（v1）

- 发布 **`antd-admin-cli`**，`pnpm dlx antd-admin-cli@latest` 可用；`bin` 指向构建产物 `dist/cli.js`；npm **`files`** 以 **`dist`**（及必要的内嵌清单）为主，对齐 create-turbo 的发布边界。
- **产物**：在当前工作区生成 **独立应用** 目录（或 `.`），不依赖用户已克隆本 monorepo。
- **示例来源**：**运行时**从 **GitHub** 拉取 archive/tarball，解压后取 **`apps/<example>`** 子树物化到目标目录（create-turbo 模式）。
- **示例清单**：**构建期**扫描本仓库 **`apps/*`**，生成 **`examples` 清单**写入 `dist`，**排除 `apps/docs`**；运行时短名示例必须落在该清单内。
- **CLI**：
  - 支持 `pnpm dlx antd-admin-cli@latest --example basic`（及清单中的其它示例名）。
  - **未传 `--example`** 时走 **交互**（选示例、目标目录、项目名称等）。
  - **`--example`** 支持 **短名** 或 **GitHub URL**；提供 **`--example-path`** 处理分支名含 `/` 等与 create-turbo 相同的边界。
- **包管理器**：支持 **npm / yarn / pnpm / bun**，探测本机可用性；默认执行 **install**；支持 **`--skip-install`**。
- **Transforms**：交互收集 **项目名称**；至少更新 **`package.json` 的 `name`**（含 npm name 规范化）；其它替换点 v1 最小化、结构预留扩展。
- **Git**：默认在流程末尾 **初始化 git 并做初始提交**；支持 **`--no-git`**，并移除模板可能携带的 `.git`。

### 2.2 非目标（v1 不做）

- 在 **本 monorepo 内** 自动新建 `apps/<name>` 并接入 workspace（早期讨论过，与当前 **dlx 独立应用** 主路径冲突；若需要另开议题与版本规划）。
- **Telemetry** 及 Turborepo 特有远程缓存能力。
- 以 **把完整模板打进 npm 包** 作为主要分发方式（与「对齐 create-turbo」不一致；v1 以 **远程拉取** 为主）。

## 3. 方案结论（架构选型）

| 方向 | 结论 |
|------|------|
| 下载实现 | 以 **GitHub tarball** 为主；优先使用成熟库（如 **giget**），不满足子路径/缓存需求时再薄封装自研。 |
| 示例列表 | **构建期**扫描 `apps/*`（排除 `docs`）生成清单，避免 npm 上列出的示例与仓库漂移。 |
| CLI 框架 | **`commander` + `@inquirer/prompts`**（与 create-turbo 技术栈同族）。 |
| 构建 | `packages/create` 使用 TypeScript；构建工具在实现阶段与仓库习惯对齐（`tsup` / `tsdown` / `unbuild` 择一）。 |

## 4. CLI 形态与交互流程

### 4.1 命名与入口

- 包名：**`antd-admin-cli`**。
- `bin`：**`antd-admin-cli`** → `dist/cli.js`。

### 4.2 参数（v1）

- **`[project-directory]`**：目标目录；可省略则交互询问。允许 `.` 时须 **强校验 + 二次确认**，避免误覆盖。
- **`-e, --example <name\|url>`**：短名（须在清单内）或 GitHub URL。
- **`--example-path <path>`**：与 create-turbo 语义一致，处理 URL 无法唯一解析子路径等情况。
- **`-m, --package-manager <npm\|yarn\|pnpm\|bun>`**：显式指定包管理器。
- **`--skip-install`**：跳过依赖安装。
- **`--skip-transforms`**：跳过 transforms；若与 `-m` 等组合产生无意义情况，**对齐 create-turbo：警告并忽略冲突项**。
- **`--no-git`**：不执行 git 初始化。
- **`-v, --version`、`-h, --help`**。

### 4.3 交互（无 `--example` 或缺少必填项时）

1. 选择示例（列表不含 `docs`）。
2. 选择目标目录（未提供 `[project-directory]` 时）；**目标非空则默认拒绝并退出**（v1 不提供 `--force`）。
3. 输入项目名称（用于 `package.json.name`，可默认由目录名推导）。
4. 选择包管理器（未传 `-m` 时）；不可用则提示安装或重选。

### 4.4 有 `--example` 时

- 仅补齐仍缺失的必填项；无法补齐则 **报错退出**。

## 5. 运行时主链路与模块边界

1. 解析 CLI（`commander`）。
2. 交互补齐（`prompts.ts`，`@inquirer/prompts`）。
3. 解析示例坐标（短名 → `owner/repo/ref` + `apps/<example>`；URL → 解析 + 可选 `--example-path`）。
4. **下载**（`download.ts`）：拉取 tarball 至临时或缓存目录。
5. **提取**（`extract.ts`）：从解压结果取 **`apps/<example>`** 拷贝至目标目录；跳过 `node_modules`；不拷贝模板内 `.git`（或后续由 `--no-git` 分支删除）。
6. **Transforms**（`transforms/*`，顺序执行）：v1 必改 **`package.json` 的 `name`**；可选改 `index.html` title、README 标题（仅当有稳定占位或低成本匹配时）。
7. **安装**：按选定包管理器非交互安装；`--skip-install` 跳过。
8. **Git**：默认 `git init` + 初始提交；`--no-git` 跳过。

**模块建议**：`cli.ts`、`commands/create.ts`、`prompts.ts`、`examples.ts`、`download.ts`、`extract.ts`、`transforms/*`。

## 6. 模板坐标与版本策略（须实现阶段写死）

- **默认 `owner/repo`**：**`zuiidea/antd-admin`**（与仓库 README 一致；若将来迁移仓库，以单一常量或包元数据为准并更新本文档）。
- **默认 ref 策略（推荐）**：短名示例从 **与 CLI 版本对应的 git tag** 拉取，保证 **CLI 版本与模板内容可复现一致**；**本地开发**允许通过 **环境变量** 覆盖 `owner/repo/ref`。
- **URL 模式**：用户传入 GitHub URL 时，按 create-turbo 同类规则解析 ref 与子路径。

## 7. 错误处理

- 未知示例名、非法目录、`.` 未确认、非空目标目录：**stderr + exit 1**。
- 下载/解压/子路径不存在：**DownloadError**，可操作提示，**exit 1**。
- Transforms 失败：打印 **transform 名 + 路径**，**exit 1**。
- 安装失败：打印执行的命令摘要，**exit 1**。
- 用户 Ctrl+C：优雅退出（具体 exit code 在实现计划统一）。

## 8. 测试策略（v1）

- **单元测试**：URL / `--example-path` 解析；`package.json` name 规范化；transforms fixture。
- **集成测试（推荐 mock 下载）**：fixture tarball 跑 pipeline 至 transforms 后、安装前。

## 9. 仓库集成与发布

- `packages/create` 纳入 **`pnpm-workspace.yaml` 的 `packages/*`**；提供 **`build` / `lint` / `test`**（若有），纳入 **`turbo run build`**。
- **清单生成**绑定在 **`build`** 流程内或紧前置，保证 `turbo run build` 后 dist 完整。
- 根 **README** 仅在合适小节增加一行 `pnpm dlx` 用法（实现阶段落地）。

## 10. 与会话决策的对照

| 话题 | 结论 |
|------|------|
| 包位置 | `packages/create`，发布名 `antd-admin-cli`。 |
| 示例列表 | 构建期扫描 `apps/*`，排除 `docs`（用户曾希望「扫描」；发布物上落实为构建期扫描，避免 dlx 用户机无 monorepo）。 |
| 产物位置 | 独立应用目录或 `.`（非向本仓库新增 `apps/<name>`）。 |
| 模板分发 | create-turbo 式 **GitHub 拉取**，非主打本地打包模板。 |
| 无 `--example` | 交互式。 |
| 包管理器 | 四选一 + 默认 install + `--skip-install`。 |
| 项目名 | 交互 + transforms 至少改 `package.json` name。 |

## 11. 待实现阶段决定（本规格不锁死细节）

- 构建工具具体选型、`giget` 是否完全满足子路径而无需自研补丁。
- 可选 transforms（`index.html` / README）是否在 v1 启用。
- 单元测试运行器与仓库其它包对齐方式。

---

**审阅说明**：请通读本规格；若无异议，回复批准后再进入 **writing-plans** 生成实现计划。
