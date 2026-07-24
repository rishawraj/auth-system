import { z } from "zod";

// =========================  Register ============================
export const RegisterRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const RegisterResponseSchema = z.object({
  user: z.object({
    pending_email: z.string(),
  }),
  qrcodeImageUrl: z.string(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
// =========================  Register ============================

// =========================  Login  ============================
export const LoginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email addres"),
  password: z
    .string()
    .min(1, "Password is required")
    .length(6, "Password must be atleast 6 characters long"),
});

export type LoginRequst = z.infer<typeof LoginRequestSchema>;

export const LoginReponseSchema = z.object({
  message: z.string(),
  accessToken: z.string(),
  type: z.string(),
  isTwoFactorEnabled: z.boolean(),
});

export type LoginResponse = z.infer<typeof LoginReponseSchema>;
// =========================  Login  ============================

// =========================  Verify  ============================
export const VerifyRequestSchema = z.object({
  pending_email: z.string().email("Invalid email address"),
  code: z.string().min(6, "invalid code"),
});

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;
// =========================  Verify  ============================
