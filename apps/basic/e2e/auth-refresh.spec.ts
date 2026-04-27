import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const expiredAuthStorage = () =>
  JSON.stringify({
    state: {
      tokens: {
        accessToken: "__EXPIRED_ACCESS__",
        refreshToken: "mock-refresh-token",
      },
      isAuthenticated: true,
    },
    version: 0,
  });

test.describe("Auth refresh", () => {
  test.describe.configure({ retries: 2 });

  test("401 on list triggers refresh then succeeds", async ({ page }) => {
    await loginAsAdmin(page);

    await page.evaluate((payload) => {
      localStorage.setItem("auth-storage", payload);
    }, expiredAuthStorage());

    await page.reload({ waitUntil: "load" });

    const usersListOk = page.waitForResponse(
      (res) => res.url().includes("/api/users") && res.request().method() === "GET" && res.ok(),
      { timeout: 60_000 },
    );
    await page.goto("/users", { waitUntil: "domcontentloaded" });
    await usersListOk;

    await expect(page).toHaveURL(/\/users(\/|\?|$)/);
    const thead = page.locator(".ant-table-thead");
    await expect(thead.getByText(/Username|用户名/)).toBeVisible({ timeout: 30_000 });
  });
});
