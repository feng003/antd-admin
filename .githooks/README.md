# Git hooks（仓库根）

本目录为 **monorepo 根级** Git 钩子。提交时根据暂存文件路径，在对应子项目目录执行检查（例如 `apps/with-lingui` 下执行 `vp staged`，以便正确读取该目录的 `vite.config.ts`）。

模板应用目录内的 `.vite-hooks/`（如 `apps/with-lingui/.vite-hooks/`）留给 **模板单独拷贝出去使用**；在本仓库开发时请使用根级钩子，避免在仓库根执行 `vp staged` 找不到 `vite.config.ts`。

## 启用方式（一次性）

在仓库根目录执行：

```bash
git config core.hooksPath .githooks
```

或使用：

```bash
pnpm run setup:git-hooks
```

验证：

```bash
git config core.hooksPath
# 应输出：.githooks
```
