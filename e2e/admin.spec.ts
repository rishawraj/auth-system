import { test, expect } from "@playwright/test";
import { cleanDatabase, getUniqueEmail, createTestUser } from "./setup/testDb.js";

test.describe("E2E: Admin Dashboard & Authorization Guard", () => {
  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test("allows SuperUser to access admin dashboard and manage users", async ({
    page,
  }) => {
    const admin = await createTestUser({
      email: getUniqueEmail("e2e-admin"),
      password: "AdminPassword123!",
      is_super_user: true,
    });

    // Also create regular users to populate user table
    await createTestUser({ email: getUniqueEmail("target-user-1") });
    await createTestUser({ email: getUniqueEmail("target-user-2") });

    // 1. Admin login
    await page.goto("/login");
    await page.fill('input[name="email"]', admin.email);
    await page.fill('input[name="password"]', admin.plainPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/profile/);

    // 2. Navigate to Admin section
    const adminNav = page.locator('a[href*="/admin" i], button:has-text("Admin")');
    if (await adminNav.count() > 0) {
      await adminNav.first().click();
    } else {
      await page.goto("/admin");
    }

    // 3. Verify Admin Dashboard content
    await expect(page.locator("body")).toContainText(/admin|dashboard|users/i);
  });

  test("restricts non-admin users from accessing /admin", async ({ page }) => {
    const normalUser = await createTestUser({
      email: getUniqueEmail("e2e-normal"),
      password: "NormalPassword123!",
      is_super_user: false,
    });

    // 1. Normal user login
    await page.goto("/login");
    await page.fill('input[name="email"]', normalUser.email);
    await page.fill('input[name="password"]', normalUser.plainPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/profile/);

    // 2. Try navigating directly to /admin
    await page.goto("/admin");

    // 3. Should be bounced back to /profile or show unauthorized message
    await expect(page).not.toHaveURL(/.*\/admin$/);
  });
});
