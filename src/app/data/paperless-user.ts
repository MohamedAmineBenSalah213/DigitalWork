import { ObjectWithId } from './object-with-id'

export interface PaperlessUser extends ObjectWithId {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  normalizedUserName?: string | null;
  passwordHash?: string | null;
  date_joined?: Date | null;
  is_staff?: boolean | null;
  is_active?: boolean | null;
  is_superuser?: boolean | null;
  groups?: string[] | null; // PaperlessGroup[]
  user_permissions?: string[] | null;
  inherited_permissions?: string[] | null;

  superuserStatus: boolean;
  active: boolean;
  firstName: string | null;
  lastName: string | null;

  permissions: string[];
  userName: string;

 
  normalizedEmail: string;
  emailConfirmed: boolean;
 
  securityStamp: string;
  concurrencyStamp: string;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd: Date | null;
  lockoutEnabled: boolean;
  accessFailedCount: number;
}
