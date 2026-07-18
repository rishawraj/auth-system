// shared/src/models/user.ts

import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),

  name: z.string().max(100),

  email: z.string().email().max(150).nullable(),

  password: z.string().nullable(),

  is_active: z.boolean().default(false),

  verification_code: z.string().max(100).nullable(),
  verification_code_expiry_time: z.date().nullable(),

  registration_date: z.date(),

  last_login: z.date().nullable(),

  is_super_user: z.boolean().default(false),

  oauth_provider: z.string().max(50).nullable(),
  oauth_id: z.string().max(255).nullable(),
  oauth_access_token: z.string().nullable(),
  oauth_refresh_token: z.string().nullable(),
  oauth_token_expires_at: z.date().nullable(),

  reset_password_token: z.string().max(255).nullable(),
  reset_password_token_expiry_time: z.date().nullable(),

  profile_pic: z.string().nullable(),

  last_login_method: z.string().max(20).nullable(),

  is_two_factor_enabled: z.boolean().default(false),
  two_factor_secret: z.string().max(255).nullable(),

  is_deleted: z.boolean().default(false),

  last_ip: z.string().max(45).nullable(),
  last_browser: z.string().nullable(),
  last_os: z.string().nullable(),
  last_device: z.string().nullable(),
  last_location: z.string().nullable(),
  last_country: z.string().nullable(),
  last_city: z.string().nullable(),

  tmp_two_factor_secret: z.string().nullable(),

  disable_2fa_otp: z.string().length(6).nullable(),
  disable_2fa_otp_expiry_time: z.date().nullable(),

  regenerate_2fa_otp: z.string().length(6).nullable(),
  regenerate_2fa_otp_expiry: z.date().nullable(),

  pending_email: z.string().email().max(150).nullable(),

  last_code_sent_at: z.date().nullable(),
});

type User = z.infer<typeof UserSchema>;

export const PublicUserSchema = UserSchema.omit({
  password: true,
  two_factor_secret: true,
  tmp_two_factor_secret: true,
  oauth_refresh_token: true,
  oauth_access_token: true,
  verification_code: true,
  reset_password_token: true,
});

export type PublicUser = z.infer<typeof PublicUserSchema>;
