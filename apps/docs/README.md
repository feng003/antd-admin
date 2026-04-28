# Antd Admin 文档站（`antd-admin-docs`）

基于 [Next.js](https://nextjs.org) App Router、[Nextra 4](https://nextra.site) 与 `nextra-theme-docs` 的中文文档，与模板应用（Vite+、`apps/basic`、`apps/with-lingui`）同仓维护。

## 内容目录（侧栏分组）

| 分组 | 路径（`content/` 下） |
|------|------------------------|
| 概述 | `index.mdx` |
| 欢迎 | `welcome/documentation-intro.mdx` |
| 入门 | `getting-started/`（快速开始、`folder-structure`、`available-scripts` …） |
| 模板 | `templates/`（模板列表、`basic`、`with-lingui`） |
| 开发 | `development/` |
| 样式与资源 | `styles-and-assets/` |
| 构建应用 | `building/` |
| 测试 | `testing/` |
| 后端对接 | `backend/` |
| 部署 | `deployment/` |

侧边栏顺序与标题由各目录旁 `_meta.js` 及根目录 `content/_meta.js` 配置。

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

初始实现见 `docs/specs/2026-04-15-apps-docs-nextra-plan.md`。
