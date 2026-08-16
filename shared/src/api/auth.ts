import { z } from "zod";
import { PublicUserSchema, SessionSchema } from "../models/user.js";

// ========================= Register ============================
export const RegisterRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const RegisterResponseSchema = z.object({
  message: z.string(),
  pending_email: z.string(),
  qrcodeImageUrl: z.string(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// ========================= Login ============================
export const LoginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginRequst = LoginRequest; // Backward compatibility for typo

export const LoginResponseSchema = z.object({
  message: z.string(),
  accessToken: z.string(),
  type: z.string(),
  isTwoFactorEnabled: z.boolean(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export const LoginReponseSchema = LoginResponseSchema; // Backward compatibility for typo

// ========================= Verify ============================
export const VerifyRequestSchema = z.object({
  pending_email: z.string().email("Invalid email address"),
  code: z.string().min(6, "Invalid code"),
});

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

export const VerifyEmailRequestSchema = z.object({
  code: z.string().min(6, "Invalid code"),
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

// ========================= Resend Code ============================
export const ResendCodeRequestSchema = z.object({
  pending_email: z.string().email("Invalid email address"),
});

export type ResendCodeRequest = z.infer<typeof ResendCodeRequestSchema>;

export const ResendCodeResponseSchema = z.object({
  message: z.string(),
});

export type ResendCodeResponse = z.infer<typeof ResendCodeResponseSchema>;

// ========================= Forgot Password ============================
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ForgotPasswordResponseSchema = z.object({
  message: z.string(),
});

export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;

// ========================= Reset Password ============================
export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const ResetPasswordResponseSchema = z.object({
  message: z.string(),
});

export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

// ========================= General Responses ============================
export const LogoutResponseSchema = z.object({
  message: z.string(),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

export const RefreshTokenResponseSchema = z.object({
  message: z.string(),
  accessToken: z.string(),
});

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

export const MeResponseSchema = z.object({
  user: PublicUserSchema,
});

export type MeResponse = z.infer<typeof MeResponseSchema>;

// ========================= Session Management ============================
export const GetSessionsResponseSchema = z.object({
  sessions: z.array(SessionSchema),
});

export type GetSessionsResponse = z.infer<typeof GetSessionsResponseSchema>;

export const RevokeSessionRequestSchema = z.object({
  jti: z.string().min(1, "JTI is required"),
});

export type RevokeSessionRequest = z.infer<typeof RevokeSessionRequestSchema>;

export const RevokeSessionResponseSchema = z.object({
  message: z.string(),
  revokedCurrent: z.boolean().optional(),
});

export type RevokeSessionResponse = z.infer<typeof RevokeSessionResponseSchema>;

// ========================= Magic Link ============================
export const SendMagicLinkRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export type SendMagicLinkRequest = z.infer<typeof SendMagicLinkRequestSchema>;

export const SendMagicLinkResponseSchema = z.object({
  message: z.string(),
});

export type SendMagicLinkResponse = z.infer<typeof SendMagicLinkResponseSchema>;

export const VerifyMagicLinkRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export type VerifyMagicLinkRequest = z.infer<typeof VerifyMagicLinkRequestSchema>;

export const VerifyMagicLinkResponseSchema = z.object({
  message: z.string(),
  accessToken: z.string(),
  type: z.string(),
  isTwoFactorEnabled: z.boolean(),
});

export type VerifyMagicLinkResponse = z.infer<typeof VerifyMagicLinkResponseSchema>;
