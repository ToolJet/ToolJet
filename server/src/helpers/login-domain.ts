// Shared email-domain rules for password and SSO login. Edition gates belong to callers.
export const isValidSSODomain = (
  email: string,
  orgDomain: string | null | undefined,
  instanceAllowedDomains: string | null | undefined
): boolean => {
  if (!email) {
    return false;
  }

  // Use organization domain if present (overrides instance), otherwise use instance setting
  const allowedDomains = orgDomain || instanceAllowedDomains;

  // If no domain restriction, allow all
  if (!allowedDomains || !allowedDomains.trim()) {
    return true;
  }

  const domain = email.substring(email.lastIndexOf('@') + 1);
  if (!domain) {
    return false;
  }

  // Check if domain is in allowed list
  const allowedDomainList = allowedDomains
    .split(',')
    .map((e) => e && e.trim())
    .filter((e) => !!e);

  return allowedDomainList.includes(domain);
};

/**
 * Validates email domain for password sign-in with organization/instance hierarchy.
 * Organization domain settings override instance settings.
 * Supports both allowed domains (whitelist) and restricted domains (blacklist).
 * This feature is only available in EE edition. For CE edition, always returns true.
 * @param email - User email address
 * @param orgAllowedDomains - Organization level password allowed domains
 * @param orgRestrictedDomains - Organization level password restricted domains
 * @param instanceAllowedDomains - Instance level password allowed domains
 * @param instanceRestrictedDomains - Instance level password restricted domains
 * @returns true if domain is valid, false otherwise
 */
export const isValidPasswordDomain = (
  email: string,
  orgAllowedDomains: string | null | undefined,
  orgRestrictedDomains: string | null | undefined,
  instanceAllowedDomains: string | null | undefined,
  instanceRestrictedDomains: string | null | undefined
): boolean => {
  if (!email) {
    return false;
  }

  const domain = email.substring(email.lastIndexOf('@') + 1);
  if (!domain) {
    return false;
  }

  // Use organization settings if present (overrides instance), otherwise use instance settings
  const allowedDomains = orgAllowedDomains || instanceAllowedDomains;

  // Check restricted domains from both org and instance (blacklist takes precedence)
  // If domain is restricted in either org or instance, deny access
  if (orgRestrictedDomains && orgRestrictedDomains.trim()) {
    const orgRestrictedDomainList = orgRestrictedDomains
      .split(',')
      .map((e) => e && e.trim())
      .filter((e) => !!e);

    if (orgRestrictedDomainList.includes(domain)) {
      return false;
    }
  }

  if (instanceRestrictedDomains && instanceRestrictedDomains.trim()) {
    const instanceRestrictedDomainList = instanceRestrictedDomains
      .split(',')
      .map((e) => e && e.trim())
      .filter((e) => !!e);

    if (instanceRestrictedDomainList.includes(domain)) {
      return false;
    }
  }

  // Check allowed domains (whitelist)
  if (allowedDomains && allowedDomains.trim()) {
    const allowedDomainList = allowedDomains
      .split(',')
      .map((e) => e && e.trim())
      .filter((e) => !!e);

    return allowedDomainList.includes(domain);
  }

  // If no restrictions configured, allow all
  return true;
};
