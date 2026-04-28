import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("URL search state", () => {
  test("persists keyword after reload", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/users");
    await expect(page.getByPlaceholder(/Search User|搜索用户/)).toBeVisible({ timeout: 15_000 });

    const searchInput = page.getByPlaceholder(/Search User|搜索用户/);
    await searchInput.fill("zhao.ming");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/keyword=zhao\.ming/);

    await page.reload();
    await expect(page).toHaveURL(/keyword=zhao\.ming/);
    await expect(page.getByText("zhao.ming", { exact: true })).toBeVisible();
  });
});
