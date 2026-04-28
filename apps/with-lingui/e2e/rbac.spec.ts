import { test, expect } from "@playwright/test";
import { loginAsGuest } from "./helpers";

test.describe("RBAC", () => {
  test("guest without user:view cannot open /users", async ({ page }) => {
    await loginAsGuest(page);
    await page.goto("/users");
    await expect(page).toHaveURL(/403/);
  });
});
