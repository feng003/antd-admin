import { useEffect, useMemo, useRef } from "react";
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
import { RouteError } from "@/components/RouteError";
import type { Locale } from "@/stores/settings";
import "@/index.css";

const antdLocaleMap = { en: enUS, zh: zhCN } as const;

function AppQueryBridge({ children }: { children: React.ReactNode }) {
  const { message } = App.useApp();
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
          mutations: {
            onError: (err) => {
              message.error(err instanceof Error ? err.message : String(err));
            },
          },
        },
      }),
    [message],
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

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
      document.documentElement.dir = "ltr";
    })();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    const other: Locale = locale === "en" ? "zh" : "en";
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => {
        void loadLocaleCatalog(other);
      });
    } else {
      timeoutId = window.setTimeout(() => {
        void loadLocaleCatalog(other);
      }, 200);
    }
    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [locale]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <I18nProvider i18n={i18n}>
      <ConfigProvider {...configProviderProps} locale={antdLocaleMap[locale]}>
        <App>
          <AppQueryBridge>
            <Outlet />
          </AppQueryBridge>
        </App>
      </ConfigProvider>
    </I18nProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
});
