import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/login";

test.describe("admin moderation actions", () => {
  test.describe.configure({ timeout: 60000 });

  test("suspend and reinstate a user", async ({ page }) => {
    await loginAs(page, "admin@glossdemo.com");
    await page.goto("/dashboard/admin/users");

    const row = page.locator("tr", { hasText: "Rachel Kim" });
    await row.getByRole("button", { name: "Suspend" }).click();
    await page.getByRole("button", { name: "Suspend", exact: true }).last().click();
    await expect(page.getByText("User suspended.")).toBeVisible({ timeout: 20000 });
    await expect(row.getByText("suspended")).toBeVisible();

    await row.getByRole("button", { name: "Reinstate" }).click();
    await page.getByRole("button", { name: "Reinstate", exact: true }).last().click();
    await expect(page.getByText("User reinstated.")).toBeVisible({ timeout: 20000 });
    await expect(row.getByText("active")).toBeVisible();
  });

  test("force-cancel an open job", async ({ page }) => {
    await loginAs(page, "admin@glossdemo.com");
    await page.goto("/dashboard/admin/jobs");

    const row = page.locator("tbody tr").first();
    const cancelButton = row.getByRole("button", { name: "Force-cancel" });
    if ((await cancelButton.count()) === 0) test.skip();

    await cancelButton.click();
    await page.getByPlaceholder("Why are you taking this action?").fill("Duplicate posting");
    await page.getByRole("button", { name: "Cancel job" }).click();
    await expect(page.getByText("Job force-cancelled.")).toBeVisible({ timeout: 20000 });
  });
});
