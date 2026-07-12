import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth";
import { MainLayout } from "@/components/Layout/MainLayout";
import { canAccessPath, normalizeAppPath, extractAllowedPaths } from "@/utils/appMenu";
import { fetchSessionAndApplyToStore } from "@/utils/session";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ location }) => {
    const { isAuthenticated, user, tokens } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }

    if (tokens && !user) {
      try {
        await fetchSessionAndApplyToStore();
      } catch {
        useAuthStore.getState().logout();
        throw redirect({ to: "/login" });
      }
    }

    const { user: nextUser, menus } = useAuthStore.getState();
    const path = normalizeAppPath(location.pathname);
    if (path === "/403") return;

    // 从动态菜单树中提取所有允许访问的路径集合
    const allowedPaths = extractAllowedPaths(menus);

    if (!canAccessPath(path, nextUser?.permissions, nextUser?.roles, allowedPaths)) {
      throw redirect({ to: "/403" });
    }
  },
  component: MainLayout,
});
