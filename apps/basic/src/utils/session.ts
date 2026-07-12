import { httpClient } from "@/utils/http";
import { AUTH_ENDPOINTS } from "@/api/auth";
import { UserSchema } from "@/api/schemas";
import { backendMenusToMenuItems } from "@/utils/appMenu";
import { useAuthStore } from "@/stores/auth";

/**
 * 调用 /api/admin/profile，拿到 user + menus，
 * 并将后端返回的动态菜单树注入 store。
 *
 * 改造后（完全后端驱动）：
 * - profile 接口直接返回 menus 字段（type=1 的嵌套菜单树）
 * - 前端无需任何本地过滤逻辑，直接将后端 menus 转为 MenuItem[] 格式渲染
 * - 超级管理员由后端返回完整菜单树，前端无需特判
 */
export async function fetchSessionAndApplyToStore(): Promise<void> {
  // profile 接口同时返回 id/username/avatar/email/roles/permissions/menus
  const profileData = await httpClient.get(AUTH_ENDPOINTS.profile);

  const user = UserSchema.parse(profileData);

  // 直接将后端返回的菜单树转换为前端 MenuItem[] 格式
  const menus = backendMenusToMenuItems(user.menus ?? []);

  const { setUser, setMenus } = useAuthStore.getState();
  setUser(user);
  setMenus(menus);
}
