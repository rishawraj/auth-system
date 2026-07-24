import { z } from "zod";

// ================== Verify Two Factor Auth ===================
export const VerifyTwoFactorAuthSchema = z.object({
  code: z.string(),
  id: z.string(),
});
// ================== Verify Two Factor Auth ===================
