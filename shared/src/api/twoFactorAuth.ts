import { z } from "zod";

// ================== Enable 2FA ===================
export const EnableTwoFactorAuthResponseSchema = z.object({
  message: z.string(),
  qrcodeImageUrl: z.string(),
  secret: z.string(),
});

export type EnableTwoFactorAuthResponse = z.infer<
  typeof EnableTwoFactorAuthResponseSchema
>;

// ================== Verify 2FA ===================
export const VerifyTwoFactorAuthSchema = z.object({
  code: z.string().min(1, "Code is required"),
  id: z.string().min(1, "ID is required"),
});

export type VerifyTwoFactorAuthRequest = z.infer<
  typeof VerifyTwoFactorAuthSchema
>;

export const VerifyTwoFactorAuthResponseSchema = z.object({
  message: z.string(),
  backupCodes: z.array(z.string()),
});

export type VerifyTwoFactorAuthResponse = z.infer<
  typeof VerifyTwoFactorAuthResponseSchema
>;

// ================== Validate 2FA ===================
export const TwoFactorAuthSchema = z.object({
  code: z.string().min(1, "Code is required"),
  type: z.string().min(1, "Type is required"),
});

export type TwoFactorAuthRequest = z.infer<typeof TwoFactorAuthSchema>;

export const ValidateBackupCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

export type ValidateBackupCodeRequest = z.infer<
  typeof ValidateBackupCodeSchema
>;

// ================== Disable 2FA ===================
export const DisableTwoFactorAuthSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type DisableTwoFactorAuthRequest = z.infer<
  typeof DisableTwoFactorAuthSchema
>;

export const DisableTwoFactorAuthOTPVerifySchema = z.object({
  code: z.string().min(1, "Code is required"),
});

export type DisableTwoFactorAuthOTPVerifyRequest = z.infer<
  typeof DisableTwoFactorAuthOTPVerifySchema
>;

// ================== Regenerate Backup Codes ===================
export const RegenerateBackupCodesEmailSchema = z.object({
  password: z.string().min(1, "Password is required"),
  totp: z.string().min(1, "TOTP is required"),
});

export type RegenerateBackupCodesEmailRequest = z.infer<
  typeof RegenerateBackupCodesEmailSchema
>;

export const RegenerateBackupCodesGoogleSchema = z.object({
  otp: z.string().min(1, "OTP is required"),
  totp: z.string().min(1, "TOTP is required"),
});

export type RegenerateBackupCodesGoogleRequest = z.infer<
  typeof RegenerateBackupCodesGoogleSchema
>;
