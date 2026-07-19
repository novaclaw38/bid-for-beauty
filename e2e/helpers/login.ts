import type { Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password = "demo1234") {
  await page.goto("/auth/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 45000 });
}
