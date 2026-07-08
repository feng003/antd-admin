# XHS Admin — B 端管理后台

基于 **Antd Admin v6** 模板深度定制的 XHS 电商后台管理系统前端，采用 pnpm + Turborepo monorepo 架构。

## 技术栈

| 组件 | 技术 |
|------|------|
| 框架 | React 19 |
| UI 库 | Ant Design 6 |
| 路由 | TanStack Router（文件系统路由） |
| 数据请求 | TanStack Query |
| 状态管理 | Zustand（含 persist 持久化） |
| 数据校验 | Zod v4 |
| 构建工具 | Vite Plus（@voidzero-dev） |
| Mock | MSW（Mock Service Worker） |
| 测试 | Vitest（单元）+ Playwright（E2E） |
| 包管理 | pnpm 10 + Turborepo |
| 图表 | Recharts |
| 图标 | Lucide React |

## 项目结构

```
xhs-admin/                          ← Monorepo 根目录
├── pnpm-workspace.yaml             ← pnpm workspace 配置
├── turbo.json                      ← Turborepo 任务编排
├── package.json                    ← 根 package（monorepo 脚本）
├── pnpm-lock.yaml
│
├── apps/
│   ├── basic/                      ← **主应用**：B 端管理后台
│   │   ├── src/
│   │   │   ├── api/                # API 层（按模块拆分）
│   │   │   │   ├── schemas.ts      # Zod Schema + 类型定义
│   │   │   │   ├── auth.ts         # 认证端点 + 类型导出
│   │   │   │   ├── user.ts         # 用户管理 API
│   │   │   │   ├── product.ts      # 商品管理 API
│   │   │   │   ├── order.ts        # 订单管理 API
│   │   │   │   ├── brand.ts        # 品牌管理 API
│   │   │   │   ├── category.ts     # 分类管理 API
│   │   │   │   ├── tag.ts          # 标签管理 API
│   │   │   │   ├── permission.ts   # 权限管理 API
│   │   │   │   ├── cms.ts          # CMS 文章/媒体 API
│   │   │   │   ├── competition.ts  # 赛事管理 API
│   │   │   │   ├── moment.ts       # 动态管理 API
│   │   │   │   ├── activity.ts     # 运动数据 API
│   │   │   │   ├── chat.ts         # 客服聊天 API
│   │   │   │   ├── spec-template.ts # 规格库 API
│   │   │   │   └── audit-log.ts    # 审计日志 API
│   │   │   ├── components/         # 通用组件
│   │   │   │   ├── Layout/         # 布局组件
│   │   │   │   │   ├── MainLayout/ # 主布局（侧边栏 + 顶栏 + 内容区）
│   │   │   │   │   ├── Sidebar/    # 侧边栏导航（权限过滤）
│   │   │   │   │   ├── Header/     # 顶栏
│   │   │   │   │   ├── UserMenu/   # 用户菜单（头像/登出）
│   │   │   │   │   └── AppFooter/  # 页脚
│   │   │   │   ├── Auth/           # 认证相关组件
│   │   │   │   ├── DataTable/      # 通用数据表格
│   │   │   │   ├── FilterToolbar/  # 筛选工具栏
│   │   │   │   ├── FormModal/      # 表单弹窗
│   │   │   │   ├── Icon/           # 图标组件
│   │   │   │   ├── Aurora/         # Aurora 背景组件
│   │   │   │   ├── NotFound/       # 404 页面
│   │   │   │   └── RouteError.tsx  # 路由错误边界
│   │   │   ├── hooks/              # 自定义 Hooks
│   │   │   │   ├── useResourceCRUD.ts    # 通用 CRUD 操作
│   │   │   │   ├── useUrlSearchState.ts  # URL 同步搜索状态
│   │   │   │   ├── useTableFitHeight.ts  # 表格自适应高度
│   │   │   │   ├── useAppTheme.ts        # 主题切换
│   │   │   │   ├── useCrudToasts.ts      # CRUD 操作提示
│   │   │   │   ├── usePermission.ts      # 权限检查
│   │   │   │   └── tokenBuilders.ts      # TanStack Query Key 构建
│   │   │   ├── routes/             # 文件系统路由（TanStack Router）
│   │   │   │   ├── __root.tsx       # 根路由（QueryClient + 主题）
│   │   │   │   ├── _auth.tsx        # 认证布局路由（权限守卫）
│   │   │   │   ├── index.tsx        # 首页（重定向到 /dashboard）
│   │   │   │   ├── login/           # 登录页
│   │   │   │   ├── register/        # 注册页
│   │   │   │   ├── 404/             # 404 页面
│   │   │   │   └── _auth/           # 需认证的后台页面
│   │   │   │       ├── dashboard/       # 仪表盘
│   │   │   │       ├── products/        # 商品管理
│   │   │   │       ├── orders/          # 订单管理
│   │   │   │       ├── brands/          # 品牌管理
│   │   │   │       ├── spec-templates/  # 规格库管理
│   │   │   │       ├── categories/      # 分类管理
│   │   │   │       ├── tags/            # 标签列表
│   │   │   │       ├── sys-users/       # 管理员账号
│   │   │   │       ├── roles/           # 角色管理
│   │   │   │       ├── permissions/     # 权限管理
│   │   │   │       ├── cms/             # CMS 文章/媒体
│   │   │   │       ├── competitions/    # 赛事管理
│   │   │   │       ├── moments/         # 动态管理
│   │   │   │       ├── activities/      # 运动数据
│   │   │   │       ├── chat/            # 客服聊天
│   │   │   │       ├── audit-logs/      # 审计日志
│   │   │   │       ├── users/           # 用户管理
│   │   │   │       └── 403/             # 403 无权限页
│   │   │   ├── stores/             # Zustand 状态管理
│   │   │   │   ├── auth.ts         # 认证状态（Token/User/Menus）
│   │   │   │   ├── settings.ts     # 设置状态（暗色模式等）
│   │   │   │   └── createPersistentStore.ts  # 持久化 Store 工厂
│   │   │   ├── mocks/              # MSW Mock 数据
│   │   │   │   ├── browser.ts      # 浏览器 Worker 入口
│   │   │   │   ├── handlers/       # 请求处理器
│   │   │   │   ├── data.ts         # Mock 数据
│   │   │   │   └── utils.ts        # Mock 工具函数
│   │   │   └── utils/              # 工具函数
│   │   │       ├── http.ts         # HTTP 客户端（自动刷新 Token）
│   │   │       ├── session.ts      # 会话初始化（profile + 菜单构建）
│   │   │       ├── appMenu.ts      # 菜单树定义 + 权限过滤 + 路径守卫
│   │   │       └── constants.ts    # 常量（API 地址、品牌名等）
│   │   ├── e2e/                    # Playwright E2E 测试
│   │   │   ├── login.spec.ts       # 登录流程测试
│   │   │   ├── auth-refresh.spec.ts # Token 刷新测试
│   │   │   ├── rbac.spec.ts        # RBAC 权限测试
│   │   │   ├── users.spec.ts       # 用户管理测试
│   │   │   ├── url-state.spec.ts   # URL 状态同步测试
│   │   │   └── helpers.ts         # 测试辅助函数
│   │   ├── public/                 # 静态资源
│   │   ├── vite.config.ts          # Vite 配置（代理 /api → :8801）
│   │   ├── vitest.config.ts        # Vitest 配置
│   │   ├── playwright.config.ts    # Playwright 配置
│   │   └── package.json
│   │
│   ├── with-lingui/               # 多语言模板（en + zh，Lingui）
│   └── docs/                      # 文档站点（Next.js）
│
├── packages/
│   └── create/                     # init-antd-admin CLI 脚手架
│
└── docs/                           # 项目级文档
    ├── specs/                      # 功能规格说明
    └── superpowers/                # 高级特性文档
```

## 功能模块

### 已实现的后台管理模块

| 模块 | 路由 | 权限码 | 说明 |
|------|------|--------|------|
| 仪表盘 | `/dashboard` | — | 数据概览 |
| 商品管理 | `/products` | `product:list` | 商品 CRUD + 上下架 |
| 订单管理 | `/orders` | `order:list` | 订单列表/详情/退款 |
| 品牌管理 | `/brands` | `product:list` | 品牌 CRUD |
| 规格库管理 | `/spec-templates` | `product:list` | 规格模板管理 |
| 分类管理 | `/categories` | — | 多级分类管理 |
| 标签列表 | `/tags` | — | 标签管理 |
| 管理员账号 | `/sys-users` | `system:user` | 后台用户管理 |
| 角色管理 | `/roles` | `system:role` | 角色 CRUD + 权限分配 |
| 权限管理 | `/permissions` | `system:permission` | 权限树管理 |
| 文章管理 | `/cms/articles` | `cms:article` | CMS 文章 CRUD |
| 媒体库 | `/cms/media` | `cms:media` | 媒体资源管理 |
| 赛事管理 | `/competitions` | `competition:list` | 赛事 CRUD |
| 动态管理 | `/moments` | `moment:list` | 社交动态管理 |
| 运动数据 | `/activities` | — | 运动活动数据查看 |
| 客服聊天 | `/chat` | — | 客服会话管理 |
| 审计日志 | `/audit-logs` | — | 操作审计记录 |

## 核心设计

### 认证流程

```
登录 → POST /api/admin/auth/login
     → 返回 Access Token（内存 + localStorage 持久化）
     → Refresh Token 通过 HttpOnly Cookie 自动管理

请求 → 自动携带 Authorization: Bearer <AT>
     → 401 → 自动调用 /api/admin/auth/refresh（Cookie 携带 RT）
           → 成功 → 重试原请求
           → 失败 → 清除状态 → 跳转登录页
     → 403 → 跳转 /403 无权限页
```

### 权限控制（Casbin RBAC 集成）

```
后端返回 profile → { permissions: ["product:list", "order:list", ...], roles: ["admin"] }
                 → appMenu.ts 根据 permissions 过滤菜单树
                 → 侧边栏仅显示有权限的菜单项
                 → _auth.tsx 路由守卫检查路径权限
                 → super_admin 角色跳过所有权限检查
```

### 菜单树结构

菜单树定义在 `src/utils/appMenu.ts`，采用两级结构：

- **group**：菜单分组（平台/电商管理/系统管理/内容管理/赛事与动态/客服与聊天）
- **item**：具体页面入口，可配置 `permissions` 数组控制可见性

### HTTP 客户端

`src/utils/http.ts` 封装了完整的 HTTP 请求层：

- 自动注入 `Authorization` 头
- 统一解析 `{ code, data, message }` 响应格式
- 401 自动静默刷新 Token（防并发重复刷新）
- 403 自动跳转无权限页
- 支持 `credentials: 'include'`（HttpOnly Cookie）

### Mock 开发

通过 MSW 实现前端独立开发，无需后端：

```bash
# 启用 Mock（默认开发模式自动启用）
VITE_ENABLE_MOCK=true pnpm dev

# 禁用 Mock（连接真实后端）
VITE_ENABLE_MOCK=false pnpm dev
```

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 10+

### 安装与启动

```bash
# 进入 xhs-admin 目录
cd xhs-admin

# 安装依赖
pnpm install

# 启动开发服务器（Mock 模式，无需后端）
pnpm dev

# 启动开发服务器（连接后端，需先启动 app_build admin 服务）
# 后端代理地址在 vite.config.ts 中配置，默认 http://127.0.0.1:8801
```

### 构建

```bash
# 构建所有应用
pnpm build

# 仅构建 basic 应用
cd apps/basic && pnpm build
```

### 测试

```bash
# 单元测试
cd apps/basic && pnpm test:unit

# E2E 测试
cd apps/basic && pnpm test:e2e

# E2E 测试（UI 模式）
cd apps/basic && pnpm test:e2e:ui
```

### 代码质量

```bash
# 格式化
pnpm format

# Lint
pnpm lint

# 类型检查 + Lint
cd apps/basic && pnpm check
```

## 与后端对接

### 代理配置

开发环境下，Vite 将 `/api` 请求代理到后端：

```typescript
// vite.config.ts
server: {
  proxy: {
    "/api": {
      target: "http://127.0.0.1:8801",  // B 端 admin 服务
      changeOrigin: true,
    },
  },
}
```

### API 端点映射

前端 API 端点与后端 B 端路由一一对应：

| 前端 API 模块 | 后端路由前缀 | 说明 |
|--------------|-------------|------|
| `auth.ts` | `/api/admin/auth/*` | 登录/登出/刷新 Token |
| `auth.ts` | `/api/admin/profile` | 获取管理员信息 + 权限 |
| `user.ts` | `/api/admin/sys-users/*` | 管理员账号管理 |
| `product.ts` | `/api/admin/products/*` | 商品管理 |
| `order.ts` | `/api/admin/orders/*` | 订单管理 |
| `permission.ts` | `/api/admin/permissions/*` | 权限管理 |
| `cms.ts` | `/api/admin/cms/*` | CMS 管理 |
| `chat.ts` | `/api/admin/chat/*` | 客服聊天 |

### 响应格式

后端统一返回 `{ code: number, data: T, message: string }` 格式，前端 `http.ts` 自动解析：

- `code === 0` → 成功，返回 `data`
- `code !== 0` → 抛出 `ApiError`
- HTTP 状态码异常 → 抛出 `HttpError`

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | API 基础路径 | `""`（使用 Vite 代理） |
| `VITE_ENABLE_MOCK` | 启用 MSW Mock | 开发模式自动启用 |

## License

MIT
