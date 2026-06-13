import { httpClient } from "@/utils/http";
import { AUTH_ENDPOINTS } from "@/api/auth";
import { UserSchema } from "@/api/schemas";
import { buildMenuTreeFromPermissions } from "@/utils/appMenu";
import { useAuthStore } from "@/stores/auth";

/**
 * 调用 /api/admin/profile，拿到 user + permissions，
 * 并将权限列表转为侧边栏菜单树注入 store。
 *
 * B 端接口将用户信息和权限 codes 合并在一个接口返回，
 * 无需像 C 端那样分两次请求。
 */
export async function fetchSessionAndApplyToStore(): Promise<void> {
  // profile 接口同时返回 id/username/avatar/email/roles/permissions
  const profileData = await httpClient.get(AUTH_ENDPOINTS.profile);

  const user = UserSchema.parse(profileData);

  // 根据 permissions code 列表构建菜单树（替换静态硬编码菜单）
  const menus = buildMenuTreeFromPermissions(user.permissions, user.roles);

  const { setUser, setMenus } = useAuthStore.getState();
  setUser(user);
  setMenus(menus);
}
