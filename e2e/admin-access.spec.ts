import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/login";

test.describe("admin access gating", () => {
  test.describe.configure({ timeout: 60000 });

  test("admin lands on /dashboard/admin and cannot reach client pages", async ({ page }) => {
    await loginAs(page, "admin@glossdemo.com");
    await expect(page).toHaveURL(/\/dashboard\/admin$/);

    await page.goto("/dashboard/jobs");
    await expect(page).toHaveURL(/\/dashboard\/admin$/);

    await page.goto("/dashboard/profile");
    await expect(page).toHaveURL(/\/dashboard\/admin$/);
  });

  test("suspended user is signed out on next request", async ({ page }) => {
    await loginAs(page, "danielle@glossdemo.com");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("non-admin cannot reach the admin dashboard", async ({ page }) => {
    await loginAs(page, "ava@glossdemo.com");
    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
