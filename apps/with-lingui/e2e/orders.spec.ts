import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Order list", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/orders");
    await expect(page.getByPlaceholder(/Search Order|搜索/)).toBeVisible({ timeout: 15_000 });
  });

  test("should display table", async ({ page }) => {
    await expect(page.locator(".ant-table-thead").getByText(/Title|标题/)).toBeVisible();
  });
});
