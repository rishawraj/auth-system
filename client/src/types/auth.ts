export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  verification_code?: string | null;
  verification_code_expiry_time?: string | null;
  registration_date: string;
  last_login: string | null;
  is_super_user: boolean;
  oauth_provider?: string | null;
  oauth_id?: string | null;
  profile_pic?: string | null;
}
