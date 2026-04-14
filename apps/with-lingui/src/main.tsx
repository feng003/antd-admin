import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { i18n } from "@lingui/core";
import { messages as enMessages } from "./locales/en/messages.po";
import { messages as zhMessages } from "./locales/zh/messages.po";
import { useSettingsStore } from "./stores/settings";
import { useAuthStore } from "./stores/auth";
import { fetchSessionAndApplyToStore } from "./utils/session";

i18n.load("en", enMessages);
i18n.load("zh", zhMessages);
i18n.activate(useSettingsStore.getState().locale);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

async function enableMocking() {
  const enableMockInBuild = import.meta.env.VITE_ENABLE_MOCK === "true";
  if (!import.meta.env.DEV && !enableMockInBuild) return;
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking()
  .then(async () => {
    await useAuthStore.persist.rehydrate();
    const { isAuthenticated, tokens } = useAuthStore.getState();
    if (isAuthenticated && tokens) {
      try {
        await fetchSessionAndApplyToStore();
      } catch {
        useAuthStore.getState().logout();
      }
    }

    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>,
    );
  })
  .catch((err) => {
    console.error("Failed to initialize app:", err);
  });
