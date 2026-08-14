import { test, expect } from "@playwright/test";
import { cleanDatabase, getUniqueEmail, createTestUser } from "./setup/testDb.js";

test.describe("E2E: Multi-Device Sessions & Remote Revocation", () => {
  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test("revokes remote mobile session from desktop dashboard", async ({
    browser,
  }) => {
    const user = await createTestUser({
      email: getUniqueEmail("e2e-session"),
      password: "Password123!",
    });

    // 1. Create Desktop Session
    const desktopContext = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto("/login");
    await desktopPage.fill('input[name="email"]', user.email);
    await desktopPage.fill('input[name="password"]', user.plainPassword);
    await desktopPage.click('button[type="submit"]');
    await expect(desktopPage).toHaveURL(/.*\/profile/);

    // 2. Create Mobile Session in separate browser context
    const mobileContext = await browser.newContext({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto("/login");
    await mobilePage.fill('input[name="email"]', user.email);
    await mobilePage.fill('input[name="password"]', user.plainPassword);
    await mobilePage.click('button[type="submit"]');
    await expect(mobilePage).toHaveURL(/.*\/profile/);

    // 3. Desktop page navigates to Devices & Sessions settings
    await desktopPage.goto("/profile/settings");
    await expect(desktopPage.locator("body")).toContainText(/devices & sessions/i);

    // 4. Desktop revokes remote mobile session
    const remoteRevokeBtn = desktopPage.locator('button:has-text("Revoke"):not(:has-text("Sign out"))').first();
    await expect(remoteRevokeBtn).toBeVisible({ timeout: 5000 });
    await remoteRevokeBtn.click();
    await expect(desktopPage.locator("body")).toContainText(/session revoked successfully|successfully/i);

    // Cleanup contexts
    await desktopContext.close();
    await mobileContext.close();
  });
});
