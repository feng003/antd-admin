import type { MenuItem } from "@/api/schemas";
import type { BackendMenuItem } from "@/api/schemas";

// ──────────────────────────────────────────────────────────────
// 后端菜单树 → 前端 MenuItem[] 转换
// ──────────────────────────────────────────────────────────────

/**
 * 将后端 profile.menus（BackendMenuItem[]）转换为前端 Sidebar 使用的 MenuItem[] 格式。
 *
 * 判断规则：
 * - path 为空（""）且有 children → 视为 "group"（分组节点）
 * - 其余情况 → 视为 "item"（可点击导航项）
 */
export function backendMenusToMenuItems(backendMenus: BackendMenuItem[]): MenuItem[] {
  return backendMenus.map((m) => {
    const children = m.children?.length ? backendMenusToMenuItems(m.children) : null;

    const isGroup = !m.path && children && children.length > 0;

    if (isGroup) {
      return {
        id: String(m.id),
        kind: "group" as const,
        name: m.name,
        path: null,
        icon: m.icon || null,
        permissions: null,
        sort: m.sort,
        hidden: false,
        children: children,
      };
    }

    return {
      id: String(m.id),
      kind: "item" as const,
      name: m.name,
      path: m.path || "/",
      icon: m.icon || null,
      permissions: null,
      sort: m.sort,
      hidden: false,
      children: children,
    };
  });
}

// ──────────────────────────────────────────────────────────────
// 路径工具（路由守卫使用）
// ──────────────────────────────────────────────────────────────

export function normalizeAppPath(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

/**
 * 判断当前路径是否可访问。
 *
 * 改造后：所有权限控制已由后端决定（profile 返回的 menus 已是过滤后的树）。
 * 前端路由守卫只需检查两种情况：
 * 1. 超级管理员（roles 含 super_admin）→ 直接放行
 * 2. 其他用户 → 检查当前路径是否在 menus 树中存在对应的 path
 *
 * 注意：menus 由 store 维护，这里接收展开的路径集合作为参数，
 * 由 _auth.tsx 在 beforeLoad 中提前提取。
 */
export function canAccessPath(
  pathname: string,
  _permissions: string[] | undefined,
  roles: string[] = [],
  allowedPaths?: Set<string>,
): boolean {
  if (roles.includes("super_admin")) return true;

  // 公共路径，无需权限
  const PUBLIC_PATHS = new Set(["/403", "/404", "/"]);
  const normalized = normalizeAppPath(pathname);
  if (PUBLIC_PATHS.has(normalized)) return true;

  // 如果没有传入 allowedPaths，fallback 为放行（降级策略：不阻断用户）
  if (!allowedPaths) return true;

  return allowedPaths.has(normalized);
}

/**
 * 从 MenuItem[] 树中提取所有可访问的前端路径集合（path 不为空的 item 节点）。
 * 在 _auth.tsx beforeLoad 中调用，结果传给 canAccessPath。
 */
export function extractAllowedPaths(menus: MenuItem[]): Set<string> {
  const paths = new Set<string>();

  function walk(nodes: MenuItem[]) {
    for (const node of nodes) {
      if (node.kind === "item" && node.path) {
        paths.add(normalizeAppPath(node.path));
      }
      if (node.children?.length) {
        walk(node.children);
      }
    }
  }

  walk(menus);
  return paths;
}
