import { useMemo } from "react";
import type { ConfigProviderProps } from "antd";
import { buildLightThemeConfig, buildDarkThemeConfig } from "./tokenBuilders";
import { useSettingsStore } from "@/stores/settings";

export function useAppTheme(): ConfigProviderProps {
  const darkMode = useSettingsStore((s) => s.darkMode);

  return useMemo(() => (darkMode ? buildDarkThemeConfig() : buildLightThemeConfig()), [darkMode]);
}
