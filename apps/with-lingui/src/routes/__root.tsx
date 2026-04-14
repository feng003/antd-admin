import { useEffect, useRef } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ConfigProvider, App } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { loadLocaleCatalog } from "@/locales/loadLocaleCatalog";
import { useSettingsStore } from "@/stores/settings";
import { useAppTheme } from "@/hooks/useAppTheme";
import { NotFound } from "@/components/NotFound";
import "@/index.css";

const antdLocaleMap = { en: enUS, zh: zhCN } as const;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function RootComponent() {
  const locale = useSettingsStore((s) => s.locale);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const configProviderProps = useAppTheme();
  const localeEffectRunRef = useRef(0);

  useEffect(() => {
    localeEffectRunRef.current += 1;
    const runId = localeEffectRunRef.current;
    let cancelled = false;

    void (async () => {
      const messages = await loadLocaleCatalog(locale);
      if (cancelled || runId !== localeEffectRunRef.current) {
        return;
      }
      i18n.load(locale, messages);
      i18n.activate(locale);
      document.documentElement.lang = locale === "zh" ? "zh" : "en";
    })();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider i18n={i18n}>
        <ConfigProvider {...configProviderProps} locale={antdLocaleMap[locale]}>
          <App>
            <Outlet />
          </App>
        </ConfigProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
});
