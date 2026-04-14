# Antd Admin 文档站（`antd-admin-docs`）

基于 [Next.js](https://nextjs.org) App Router、[Nextra 4](https://nextra.site) 与 `nextra-theme-docs` 的中文文档，与模板应用（Vite+、`apps/basic`、`apps/with-lingui`）同仓维护。

## 端口说明

| 项目 | 默认开发地址 |
| ---- | ------------ |
| 模板应用（`vp dev`） | [http://localhost:5173](http://localhost:5173) |
| 本文档站（`pnpm dev`） | [http://localhost:3000](http://localhost:3000) |

## 常用命令

在 **`apps/docs`** 目录下：

```bash
pnpm install   # 首次或依赖变更后
pnpm dev       # 本地开发（端口 3000）
pnpm run build # 生产构建
pnpm start     # 预览生产构建（端口 3000）
pnpm run lint  # ESLint（Next 推荐规则）
```

从仓库根目录也可：

```bash
cd apps/docs && pnpm install && pnpm dev
```

## 设计说明

实现与信息架构见：`docs/specs/2026-04-15-apps-docs-nextra-plan.md`（及同目录 design spec，若存在）。
