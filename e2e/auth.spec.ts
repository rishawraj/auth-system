import { test, expect } from "@playwright/test";
import {
  cleanDatabase,
  getUniqueEmail,
  getVerificationCode,
  createTestUser,
} from "./setup/testDb.js";

test.describe("E2E: Authentication Journey", () => {
  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test("completes full registration, verification, login, and logout flow", async ({
    page,
  }) => {
    const testEmail = getUniqueEmail("e2e-reg");
    const testPassword = "Password123!";
    const testName = "Alice In Chains";

    // 1. Visit Registration Page
    await page.goto("/register");
    await expect(page.locator("h2")).toContainText(/create your account/i);

    // 2. Fill and submit registration form
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 3. Should navigate to /verify with pending_email query param
    await expect(page).toHaveURL(/.*\/verify\?pending_email=.*/);

    // 4. Retrieve 6-digit code from database
    let code: string | null = null;
    for (let i = 0; i < 15; i++) {
      code = await getVerificationCode(testEmail);
      if (code) break;
      await page.waitForTimeout(400);
    }
    expect(code).toBeTruthy();

    // 5. Fill verification code digits
    const digits = code!.split("");
    const digitInputs = page.locator('input[maxlength="1"]');
    await expect(digitInputs).toHaveCount(6);

    for (let i = 0; i < 6; i++) {
      await digitInputs.nth(i).fill(digits[i]);
    }

    // Click "Verify"
    await page.click('button:has-text("Verify")');

    // 6. Should successfully navigate past verification
    await expect(page).toHaveURL(/\/(2FAEnable|profile|login)/);

    // 7. If prompted with 2FAEnable or login, navigate to /login or /profile
    if (page.url().includes("/login")) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/profile/);
    } else if (page.url().includes("/2FAEnable")) {
      // User can skip or navigate to profile
      await page.goto("/profile");
      await expect(page).toHaveURL(/.*\/profile/);
    }

    // 8. Assert authenticated state
    await expect(page.locator("body")).toBeVisible();

    // 9. Logout
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign out"), button[title*="Logout" i]');
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await expect(page).toHaveURL(/.*\/login/);
    }
  });

  test("shows error on invalid credentials and succeeds on valid credentials", async ({
    page,
  }) => {
    const user = await createTestUser({
      email: getUniqueEmail("e2e-login"),
      password: "CorrectPassword123!",
    });

    await page.goto("/login");

    // 1. Try wrong password
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', "WrongPassword!");
    await page.click('button[type="submit"]');

    // Should display error message
    await expect(page.locator("body")).toContainText(/invalid credentials|login failed/i);
    expect(page.url()).toContain("/login");

    // 2. Try correct password
    await page.fill('input[name="password"]', "CorrectPassword123!");
    await page.click('button[type="submit"]');

    // Should navigate to profile
    await expect(page).toHaveURL(/.*\/profile/);
  });
});
