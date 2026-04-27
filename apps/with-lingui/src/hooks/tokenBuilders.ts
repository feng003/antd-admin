import { theme } from "antd";
import type { ConfigProviderProps, ThemeConfig } from "antd";

export function readBrandPrimary(): string {
  const raw = import.meta.env.VITE_BRAND_PRIMARY as string | undefined;
  if (raw && /^#[0-9a-fA-F]{6}$/.test(raw.trim())) {
    return raw.trim();
  }
  return "#1677ff";
}

const BRAND_PRIMARY = readBrandPrimary();

export const SHARED_DESIGN_TOKENS = {
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",

  borderRadius: 8,
  borderRadiusSM: 6,
  borderRadiusLG: 12,
} as const;

export const CONTROL_COMPONENTS = {
  Button: {
    primaryShadow: "none",
    defaultShadow: "none",
    dangerShadow: "none",
  },
  Input: {
    activeShadow: "none",
  },
} as const;

export function buildTableTokens(cfg: ThemeConfig) {
  const rowSelectedBg = theme.getDesignToken(cfg).colorFillAlter;
  return {
    rowSelectedBg,
    rowSelectedHoverBg: rowSelectedBg,
  };
}

export const MENU_LIGHT = {
  itemSelectedBg: "rgba(0, 0, 0, 0.06)",
  itemSelectedColor: "rgba(0, 0, 0, 0.88)",
  subMenuItemSelectedColor: "rgba(0, 0, 0, 0.88)",
  itemHoverBg: "rgba(0, 0, 0, 0.04)",
  itemHoverColor: "rgba(0, 0, 0, 0.88)",
  itemActiveBg: "rgba(0, 0, 0, 0.08)",
  itemBorderRadius: SHARED_DESIGN_TOKENS.borderRadiusSM,
  itemMarginInline: 8,
  horizontalItemSelectedColor: "rgba(0, 0, 0, 0.88)",
  horizontalItemHoverColor: "rgba(0, 0, 0, 0.88)",
} as const;

export const MENU_DARK = {
  itemSelectedBg: "rgba(255, 255, 255, 0.08)",
  itemSelectedColor: "rgba(255, 255, 255, 0.85)",
  subMenuItemSelectedColor: "rgba(255, 255, 255, 0.85)",
  itemHoverBg: "rgba(255, 255, 255, 0.06)",
  itemHoverColor: "rgba(255, 255, 255, 0.85)",
  itemActiveBg: "rgba(255, 255, 255, 0.1)",
  itemBorderRadius: SHARED_DESIGN_TOKENS.borderRadiusSM,
  itemMarginInline: 8,
  horizontalItemSelectedColor: "rgba(255, 255, 255, 0.85)",
  horizontalItemHoverColor: "rgba(255, 255, 255, 0.85)",
} as const;

export function buildLightThemeConfig(): ConfigProviderProps {
  const lightSeed: ThemeConfig["token"] = {
    colorBgLayout: "#ffffff",
    colorPrimary: BRAND_PRIMARY,
    colorLink: BRAND_PRIMARY,
    colorInfo: BRAND_PRIMARY,
    ...SHARED_DESIGN_TOKENS,
  };

  return {
    theme: {
      algorithm: theme.defaultAlgorithm,
      token: lightSeed,
      components: {
        ...CONTROL_COMPONENTS,
        Table: buildTableTokens({
          algorithm: theme.defaultAlgorithm,
          token: lightSeed,
        }),
        Menu: MENU_LIGHT,
      },
    },
  };
}

export function buildDarkThemeConfig(): ConfigProviderProps {
  const darkSeed: ThemeConfig["token"] = {
    colorPrimary: BRAND_PRIMARY,
    colorLink: BRAND_PRIMARY,
    colorInfo: BRAND_PRIMARY,
    ...SHARED_DESIGN_TOKENS,
  };

  return {
    theme: {
      algorithm: theme.darkAlgorithm,
      token: darkSeed,
      components: {
        ...CONTROL_COMPONENTS,
        Table: buildTableTokens({
          algorithm: theme.darkAlgorithm,
          token: darkSeed,
        }),
        Menu: MENU_DARK,
      },
    },
  };
}
