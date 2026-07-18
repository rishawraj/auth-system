// shared/src/api/auth/register.ts

import { z } from "zod";

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
