import { User } from '@entities/user.entity';

/**
 * The identity fields safe to expose when listing who an access rule applies to.
 * Everything else on the User row -- password hash, reset/invitation tokens, MFA
 * state, eager organizationUsers -- must never leave the server (tj-ee#5575 AC2).
 */
export interface SafeAccessRuleUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function toSafeAccessRuleUser(user: User | null | undefined): SafeAccessRuleUser | null {
  if (!user) return null;
  const { id, firstName, lastName, email } = user;
  return { id, firstName, lastName, email };
}
