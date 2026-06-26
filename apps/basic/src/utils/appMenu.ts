import type { MenuItem } from "@/api/schemas";

/**
 * B 端完整静态菜单树。
 * permissions 字段用于控制可见性（null = 所有人可见）。
 * 对应后端权限 code 约定（sys_permissions.code 字段）。
 */
export const APP_MENU_TREE: MenuItem[] = [
  {
    id: "g-platform",
    kind: "group",
    name: "平台",
    path: null,
    icon: "IconLucideLayoutDashboard",
    permissions: null,
    sort: 0,
    hidden: false,
    children: [
      {
        id: "dashboard",
        kind: "item",
        name: "仪表盘",
        path: "/dashboard",
        icon: "IconLucideLayoutDashboard",
        children: null,
        permissions: null,
        sort: 0,
        hidden: false,
      },
    ],
  },
  {
    id: "g-ecom",
    kind: "group",
    name: "电商管理",
    path: null,
    icon: "IconLucideShoppingBag",
    permissions: null,
    sort: 1,
    hidden: false,
    children: [
      {
        id: "products",
        kind: "item",
        name: "商品管理",
        path: "/products",
        icon: "IconLucideShoppingBag",
        children: null,
        permissions: ["product:list"],
        sort: 0,
        hidden: false,
      },
      {
        id: "orders",
        kind: "item",
        name: "订单管理",
        path: "/orders",
        icon: "IconLucideClipboardList",
        children: null,
        permissions: ["order:list"],
        sort: 1,
        hidden: false,
      },
      {
        id: "brands",
        kind: "item",
        name: "品牌管理",
        path: "/brands",
        icon: "IconLucideImage",
        children: null,
        permissions: ["product:list"],
        sort: 2,
        hidden: false,
      },
      {
        id: "spec-templates",
        kind: "item",
        name: "规格库管理",
        path: "/spec-templates",
        icon: "IconLucideSettings",
        children: null,
        permissions: ["product:list"],
        sort: 3,
        hidden: false,
      },
    ],
  },
  {
    id: "g-system",
    kind: "group",
    name: "系统管理",
    path: null,
    icon: "IconLucideSettings",
    permissions: null,
    sort: 2,
    hidden: false,
    children: [
      {
        id: "sys-users",
        kind: "item",
        name: "管理员账号",
        path: "/sys-users",
        icon: "IconLucideUsers",
        children: null,
        permissions: ["system:user"],
        sort: 0,
        hidden: false,
      },
      {
        id: "roles",
        kind: "item",
        name: "角色管理",
        path: "/roles",
        icon: "IconLucideShield",
        children: null,
        permissions: ["system:role"],
        sort: 1,
        hidden: false,
      },
      {
        id: "permissions",
        kind: "item",
        name: "权限管理",
        path: "/permissions",
        icon: "IconLucideLock",
        children: null,
        permissions: ["system:permission"],
        sort: 2,
        hidden: false,
      },
      {
        id: "categories",
        kind: "item",
        name: "分类管理",
        path: "/categories",
        icon: "IconLucideFolderTree",
        children: null,
        permissions: null,
        sort: 3,
        hidden: false,
      },
      {
        id: "tags",
        kind: "item",
        name: "标签列表",
        path: "/tags",
        icon: "IconLucideTags",
        children: null,
        permissions: null,
        sort: 4,
        hidden: false,
      },
      {
        id: "audit-logs",
        kind: "item",
        name: "审计日志",
        path: "/audit-logs",
        icon: "IconLucideClipboardList",
        children: null,
        permissions: null,
        sort: 5,
        hidden: false,
      },
    ],
  },
  {
    id: "g-cms",
    kind: "group",
    name: "内容管理",
    path: null,
    icon: "IconLucideFileText",
    permissions: null,
    sort: 3,
    hidden: false,
    children: [
      {
        id: "cms-articles",
        kind: "item",
        name: "文章管理",
        path: "/cms/articles",
        icon: "IconLucideFileText",
        children: null,
        permissions: ["cms:article"],
        sort: 0,
        hidden: false,
      },
      {
        id: "cms-media",
        kind: "item",
        name: "媒体库",
        path: "/cms/media",
        icon: "IconLucideImage",
        children: null,
        permissions: ["cms:media"],
        sort: 1,
        hidden: false,
      },
    ],
  },
  {
    id: "g-competition",
    kind: "group",
    name: "赛事与动态",
    path: null,
    icon: "IconLucideZap",
    permissions: null,
    sort: 4,
    hidden: false,
    children: [
      {
        id: "competitions",
        kind: "item",
        name: "赛事管理",
        path: "/competitions",
        icon: "IconLucideSparkles",
        children: null,
        permissions: ["competition:list"],
        sort: 0,
        hidden: false,
      },
      {
        id: "moments",
        kind: "item",
        name: "动态管理",
        path: "/moments",
        icon: "IconLucideFolderKanban",
        children: null,
        permissions: ["moment:list"],
        sort: 1,
        hidden: false,
      },
      {
        id: "activities",
        kind: "item",
        name: "运动数据",
        path: "/activities",
        icon: "IconLucideActivity",
        children: null,
        permissions: null,
        sort: 2,
        hidden: false,
      },
    ],
  },
  {
    id: "g-chat",
    kind: "group",
    name: "客服与聊天",
    path: null,
    icon: "IconLucideMessageSquare",
    permissions: null,
    sort: 5,
    hidden: false,
    children: [
      {
        id: "chat",
        kind: "item",
        name: "Chat Records",
        path: "/chat",
        icon: "IconLucideMessageSquare",
        children: null,
        permissions: null,
        sort: 0,
        hidden: false,
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────
// 权限过滤
// ──────────────────────────────────────────────────────────────

function hasRequiredPermissions(
  required: string[] | null | undefined,
  granted: Set<string>,
): boolean {
  if (!required || required.length === 0) return true;
  return required.some((p) => granted.has(p));
}

export function filterMenuTreeByPermissions(
  nodes: MenuItem[],
  permissionList: string[],
  roles: string[] = [],
): MenuItem[] {
  if (roles.includes("super_admin")) return nodes;

  const granted = new Set(permissionList);

  const walk = (list: MenuItem[]): MenuItem[] =>
    list
      .map((node) => {
        if (!hasRequiredPermissions(node.permissions ?? null, granted)) return null;

        if (node.kind === "group") {
          const children = walk(node.children);
          if (children.length === 0) return null;
          return { ...node, children };
        }

        if (node.children?.length) {
          const children = walk(node.children);
          if (children.length === 0) return null;
          return { ...node, children };
        }

        return node;
      })
      .filter((n): n is MenuItem => n != null);

  return walk(nodes);
}

/**
 * 根据后端返回的 permissions code 列表，从完整菜单树中过滤出当前用户可见菜单。
 * 用于 session.ts 登录后初始化侧边栏。
 */
export function buildMenuTreeFromPermissions(
  permissions: string[],
  roles: string[] = [],
): MenuItem[] {
  return filterMenuTreeByPermissions(APP_MENU_TREE, permissions, roles);
}

// ──────────────────────────────────────────────────────────────
// 路径权限映射（用于路由守卫）
// ──────────────────────────────────────────────────────────────

export function normalizeAppPath(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

/** 路径 → 需要的最低权限 code（null 表示无需权限） */
const PATH_PERMISSION_MAP: Record<string, string | null> = {
  "/dashboard": null,
  "/products": "product:list",
  "/brands": "product:list",
  "/spec-templates": "product:list",
  "/orders": "order:list",
  "/sys-users": "system:user",
  "/roles": "system:role",
  "/permissions": "system:permission",
  "/cms/articles": "cms:article",
  "/cms/media": "cms:media",
  "/competitions": "competition:list",
  "/moments": "moment:list",
  "/activities": null,
  "/chat": null,
  "/403": null,
  "/users": null, // 保留旧路径（新框架示例页面）
};

export function requiredPermissionForPath(pathname: string): string | null {
  const p = normalizeAppPath(pathname);
  return PATH_PERMISSION_MAP[p] ?? null;
}

export function canAccessPath(
  pathname: string,
  permissions: string[] | undefined,
  roles: string[] = [],
): boolean {
  if (roles.includes("super_admin")) return true;
  const required = requiredPermissionForPath(pathname);
  if (required == null) return true;
  if (!permissions?.length) return false;
  return permissions.includes(required);
}
