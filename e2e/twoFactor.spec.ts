import { test, expect } from "@playwright/test";
import {
  cleanDatabase,
  getUniqueEmail,
  createTestUser,
  generateTotp,
} from "./setup/testDb.js";
import { Secret } from "otpauth";

test.describe("E2E: Two-Factor Authentication Lifecycle", () => {
  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test("handles 2FA login challenge with valid TOTP code", async ({ page }) => {
    // 1. Create a user with 2FA already enabled in database
    const secret = new Secret().base32;
    const testEmail = getUniqueEmail("e2e-2fa-user");
    const testPassword = "Password123!";

    await createTestUser({
      email: testEmail,
      password: testPassword,
      is_two_factor_enabled: true,
      two_factor_secret: secret,
    });

    // 2. Go to /login and enter password
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 3. Should be redirected to /2FALogin challenge
    await expect(page).toHaveURL(/.*\/2FALogin\?token=.*/);

    // 4. Generate valid 6-digit TOTP code
    const totpCode = generateTotp(secret);

    // 5. Fill TOTP code
    const totpInputs = page.locator('input[type="text"], input[type="number"], input[inputmode="numeric"]');
    const count = await totpInputs.count();
    if (count >= 6) {
      for (let i = 0; i < 6; i++) {
        await totpInputs.nth(i).fill(totpCode[i]);
      }
    } else {
      await page.locator('input[name="code"], input[name="totp"], input[placeholder*="code" i]').fill(totpCode);
    }

    // Submit TOTP
    await page.click('button[type="submit"]');

    // 6. Should navigate to profile dashboard
    await expect(page).toHaveURL(/.*\/profile/);
  });
});
