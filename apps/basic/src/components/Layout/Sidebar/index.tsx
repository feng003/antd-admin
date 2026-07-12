import { Menu, Layout, theme, Flex, Grid, Drawer, Button } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Book,
  Briefcase,
  Camera,
  CircleDashed,
  ClipboardList,
  Folder,
  FolderKanban,
  FolderTree,
  Home,
  Image,
  LayoutDashboard,
  Lock,
  MessageSquare,
  PanelLeft,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Tags,
  Trophy,
  User,
  Users,
  Zap,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { APP_BRAND_NAME, APP_FAVICON_SRC, API_BASE_URL } from "@/utils/constants";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import type { MenuItem as MenuItemType } from "@/api/schemas";
import type { MenuProps } from "antd";
import { UserMenu } from "../UserMenu";
import { AUTH_ENDPOINTS } from "@/api/auth";
import "./index.css";

const { Sider } = Layout;

type AntMenuItem = Required<MenuProps>["items"][number];
type BuildMenuResult = {
  items: AntMenuItem[];
  keyToPath: Record<string, string>;
  pathToKeyChain: Record<string, string[]>;
};

/** 后端 icon 字段（Lucide 格式）→ 实际 Lucide 组件映射 */
const MENU_ICON_MAP: Record<string, LucideIcon> = {
  // 通用
  IconLucideLayoutDashboard: LayoutDashboard,
  IconLucideHome: Home,
  // 用户/账号
  IconLucideUser: User,
  IconLucideUsers: Users,
  IconLucideUserList: Users,
  IconLucideHistory: Users,
  // 商品/电商
  IconLucideShoppingBag: ShoppingBag,
  IconLucideShoppingCart: ShoppingCart,
  IconLucideClipboardList: ClipboardList,
  IconLucideBriefcase: Briefcase,
  // 品牌/图片
  IconLucideImage: Image,
  // 内容/文章
  IconLucideFileText: FileText,
  IconLucideBook: Book,
  IconLucideBookOpen: Book,
  // 系统管理
  IconLucideSettings: SlidersHorizontal,
  IconLucideSlidersHorizontal: SlidersHorizontal,
  IconLucideSettings2: Settings,
  IconLucideShield: Shield,
  IconLucideLock: Lock,
  // 分类/标签
  IconLucideFolderTree: FolderTree,
  IconLucideTags: Tags,
  // CMS
  IconLucideFolder: Folder,
  IconLucideFolderKanban: FolderKanban,
  // 赛事
  IconLucideTrophy: Trophy,
  IconLucideSparkles: Zap,
  IconLucideZap: Zap,
  // 动态
  IconLucideCamera: Camera,
  // 运动
  IconLucideActivity: Activity,
  IconLucideBarChart3: BarChart3,
  // 聊天
  IconLucideMessageSquare: MessageSquare,
  // 收藏
  IconLucideStar: Star,
};

function renderMenuIcon(icon: string | null, size = 16) {
  const Icon = (icon && MENU_ICON_MAP[icon]) || CircleDashed;
  return <Icon size={size} />;
}

function buildMenuItems(
  menus: MenuItemType[],
  token: ReturnType<typeof theme.useToken>["token"],
  collapsed = false,
  iconSize = 16,
  parentKeys: string[] = [],
): BuildMenuResult {
  const sorted = menus.filter((m) => !m.hidden).sort((a, b) => b.sort - a.sort);
  const keyToPath: Record<string, string> = {};
  const pathToKeyChain: Record<string, string[]> = {};
  const items: AntMenuItem[] = [];

  for (const menu of sorted) {
    const label = menu.name;
    const key = menu.id;

    if (menu.kind === "group") {
      // 将 group 渲染为可折叠的 SubMenu（inline 模式下点击展开/收起）
      // group key 加入 parentKeys，确保子菜单激活时父级自动展开
      const nextParents = [...parentKeys, key];
      const built = buildMenuItems(menu.children, token, collapsed, iconSize, nextParents);
      Object.assign(keyToPath, built.keyToPath);
      Object.assign(pathToKeyChain, built.pathToKeyChain);
      if (built.items.length > 0) {
        items.push({
          key,
          label,
          icon: renderMenuIcon(menu.icon, iconSize),
          children: built.items,
        });
      }
      continue;
    }

    const nextParents = [...parentKeys, key];
    keyToPath[key] = menu.path;
    const existing = pathToKeyChain[menu.path];
    if (!existing || nextParents.length > existing.length) {
      pathToKeyChain[menu.path] = nextParents;
    }

    let children: AntMenuItem[] | undefined;
    if (menu.children?.length) {
      const built = buildMenuItems(menu.children, token, collapsed, iconSize, nextParents);
      Object.assign(keyToPath, built.keyToPath);
      Object.assign(pathToKeyChain, built.pathToKeyChain);
      children = built.items.length ? built.items : undefined;
    }

    items.push({
      key,
      label,
      icon: renderMenuIcon(menu.icon, iconSize),
      children,
    });
  }

  return { items, keyToPath, pathToKeyChain };
}

export function Sidebar() {
  const menus = useAuthStore((s) => s.menus);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useSettingsStore((s) => s.setSidebarCollapsed);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const mobileOpen = collapsed;
  const builtMenu = useMemo(
    () => buildMenuItems(menus, token, !isMobile && collapsed, token.size),
    [menus, token, isMobile, collapsed, token.size],
  );
  const { selectedKey, routeOpenKeys } = useMemo(() => {
    const chain = builtMenu.pathToKeyChain[location.pathname] ?? [];
    return { selectedKey: chain.at(-1), routeOpenKeys: chain.slice(0, -1) };
  }, [builtMenu, location.pathname]);
  const routeOpenKeysSig = routeOpenKeys.join("\0");
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(false);
    }
  }, [isMobile, setSidebarCollapsed]);

  /** Merge open keys required by the route with any submenu the user already expanded. */
  useEffect(() => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      for (const k of routeOpenKeys) next.add(k);
      return [...next];
    });
  }, [location.pathname, routeOpenKeysSig]);

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      label: "Sign Out",
      onClick: () => {
        if (isMobile) {
          setSidebarCollapsed(false);
        }
        // 先清服务端 RT Cookie，再清本地 store
        // fire-and-forget：即使请求失败，本地 store 仍然清除（最坏情况 RT Cookie 自然过期）
        void fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.logout}`, {
          method: "POST",
          credentials: "include",
        }).finally(() => {
          logout();
          void navigate({ to: "/login" });
        });
      },
    },
  ];

  const sidebarContent = (isCollapsed: boolean, omitBrandToggle = false) => (
    <Flex
      vertical
      style={{
        height: "100%",
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <Flex
        vertical
        justify="center"
        align={isCollapsed ? "center" : "stretch"}
        style={{
          paddingBlock: token.paddingSM,
          /* Collapsed rail is 64px: keep horizontal padding minimal so 40px brand / icons are not clipped by Sider overflow. */
          paddingInline: isCollapsed ? token.paddingXXS : token.paddingSM,
          minHeight: 64,
          flexShrink: 0,
          width: "100%",
          minWidth: 0,
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <Flex
          align="center"
          gap={token.marginSM}
          style={{
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
            /* Collapsed: outer row already has paddingSM; extra inline padding would clip the 40px brand box. */
            paddingInline: isCollapsed ? 0 : token.paddingXS,
            minHeight: 40,
            justifyContent: isCollapsed ? "center" : "flex-start",
          }}
        >
          {isCollapsed ? (
            <div className="sidebar-collapsed-brand">
              <div className="sidebar-collapsed-brand__logoLayer">
                <img
                  src={APP_FAVICON_SRC}
                  alt="logo"
                  width={24}
                  height={24}
                  style={{
                    borderRadius: token.borderRadius,
                    display: "block",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div className="sidebar-collapsed-brand__toggleLayer">
                <Button
                  type="text"
                  size="small"
                  className="sidebar-collapsed-brand__toggle"
                  onClick={toggleSidebar}
                  icon={<PanelLeft size={token.size} />}
                  aria-label="Toggle sidebar"
                />
              </div>
            </div>
          ) : (
            <>
              <Flex
                align="center"
                gap={token.marginSM}
                style={{
                  minWidth: 0,
                  flex: 1,
                  overflow: "hidden",
                }}
              >
                <img
                  src={APP_FAVICON_SRC}
                  alt="logo"
                  width={24}
                  height={24}
                  style={{
                    borderRadius: token.borderRadius,
                    display: "block",
                    flexShrink: 0,
                    objectFit: "contain",
                  }}
                />
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                    fontSize: token.fontSizeLG,
                    textTransform: "uppercase",
                  }}
                >
                  {APP_BRAND_NAME}
                </div>
              </Flex>
              {!omitBrandToggle ? (
                <Button
                  type="text"
                  size="small"
                  onClick={toggleSidebar}
                  icon={<PanelLeft size={token.size} />}
                  aria-label="Toggle sidebar"
                  style={{ flexShrink: 0 }}
                />
              ) : null}
            </>
          )}
        </Flex>
      </Flex>
      <Menu
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : []}
        openKeys={openKeys}
        onOpenChange={(keys) => setOpenKeys(keys as string[])}
        items={builtMenu.items}
        getPopupContainer={() => document.body}
        onClick={({ key }) => {
          const path = builtMenu.keyToPath[String(key)];
          if (!path) return;
          if (isMobile) {
            setSidebarCollapsed(false);
          }
          void navigate({ to: path });
        }}
        style={{
          borderRight: "none",
          flex: 1,
          minWidth: 0,
          maxWidth: "100%",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
          overflowY: "auto",
          background: "transparent",
        }}
      />
      <UserMenu collapsed={isCollapsed} user={user} userMenuItems={userMenuItems} />
    </Flex>
  );

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        placement="left"
        onClose={() => setSidebarCollapsed(false)}
        size={320}
        styles={{
          body: {
            padding: 0,
            background: token.colorBgLayout,
            overflow: "hidden",
            maxWidth: "100%",
            boxSizing: "border-box",
          },
          header: { display: "none" },
          mask: { opacity: 0.5 },
        }}
      >
        {sidebarContent(false, true)}
      </Drawer>
    );
  }

  return (
    <Sider
      key={collapsed ? "collapsed" : "expanded"}
      theme="light"
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      collapsedWidth={64}
      breakpoint="lg"
      onBreakpoint={(broken) => {
        if (broken) {
          setSidebarCollapsed(false);
        }
      }}
      style={{
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgLayout,
        alignSelf: "stretch",
        minHeight: "100vh",
        overflow: "visible",
      }}
    >
      {sidebarContent(collapsed)}
    </Sider>
  );
}
