/**
 * Helper functions for managing environment access based on user permissions
 */

/**
 * Environment names mapping
 */
export const ENVIRONMENT_NAMES = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  RELEASED: 'released',
};

/**
 * Environment priority order (from least to most restrictive)
 * We prioritize showing users the least restrictive environment they have access to
 */
const ENVIRONMENT_PRIORITY = [
  ENVIRONMENT_NAMES.DEVELOPMENT,
  ENVIRONMENT_NAMES.STAGING,
  ENVIRONMENT_NAMES.PRODUCTION,
  ENVIRONMENT_NAMES.RELEASED,
];

/**
 * Get the accessible environments for a user based on their permissions
 * @param {Object} environmentAccess - Object with environment access flags
 * @param {boolean} environmentAccess.development
 * @param {boolean} environmentAccess.staging
 * @param {boolean} environmentAccess.production
 * @param {boolean} environmentAccess.released
 * @returns {Array<string>} Array of accessible environment names
 */
export const getAccessibleEnvironments = (environmentAccess) => {
  if (!environmentAccess) return [];

  const accessible = [];
  if (environmentAccess.development) accessible.push(ENVIRONMENT_NAMES.DEVELOPMENT);
  if (environmentAccess.staging) accessible.push(ENVIRONMENT_NAMES.STAGING);
  if (environmentAccess.production) accessible.push(ENVIRONMENT_NAMES.PRODUCTION);
  if (environmentAccess.released) accessible.push(ENVIRONMENT_NAMES.RELEASED);

  return accessible;
};

/**
 * Get the default environment for a user (first accessible environment based on priority)
 * @param {Object} environmentAccess - Object with environment access flags
 * @returns {string} Default environment name or 'development' as fallback
 */
export const getDefaultEnvironment = (environmentAccess) => {
  if (!environmentAccess) return ENVIRONMENT_NAMES.DEVELOPMENT;

  const accessible = getAccessibleEnvironments(environmentAccess);
  if (accessible.length === 0) return ENVIRONMENT_NAMES.DEVELOPMENT;

  // Return first environment based on priority order that user has access to
  for (const env of ENVIRONMENT_PRIORITY) {
    if (accessible.includes(env)) {
      return env;
    }
  }

  return accessible[0]; // Fallback to first accessible
};

/**
 * Check if user has access to a specific environment
 * @param {Object} environmentAccess - Object with environment access flags
 * @param {string} environmentName - Name of environment to check
 * @returns {boolean} True if user has access to the environment
 */
export const hasEnvironmentAccess = (environmentAccess, environmentName) => {
  if (!environmentAccess || !environmentName) return false;

  const envLower = environmentName.toLowerCase();
  switch (envLower) {
    case ENVIRONMENT_NAMES.DEVELOPMENT:
      return environmentAccess.development === true;
    case ENVIRONMENT_NAMES.STAGING:
      return environmentAccess.staging === true;
    case ENVIRONMENT_NAMES.PRODUCTION:
      return environmentAccess.production === true;
    case ENVIRONMENT_NAMES.RELEASED:
      return environmentAccess.released === true;
    default:
      return false;
  }
};

/**
 * Get a safe environment for the user - if requested env is not accessible,
 * fall back to default accessible environment
 * @param {Object} environmentAccess - Object with environment access flags
 * @param {string} requestedEnv - Requested environment name
 * @returns {string} Safe environment name user has access to
 */
export const getSafeEnvironment = (environmentAccess, requestedEnv) => {
  if (!requestedEnv) {
    return getDefaultEnvironment(environmentAccess);
  }

  // If user has access to requested environment, use it
  if (hasEnvironmentAccess(environmentAccess, requestedEnv)) {
    return requestedEnv.toLowerCase();
  }

  // Otherwise, return default accessible environment
  return getDefaultEnvironment(environmentAccess);
};

/**
 * Get environment access from app group permissions
 *
 * Resolution logic (matches backend):
 * 1. If appId is provided and has specific override (from custom groups), use that
 * 2. Otherwise, use default permissions (from default groups)
 * 3. If neither exists, deny access
 *
 * @param {Object} appGroupPermissions - App group permissions object
 * @param {string} appId - Optional app ID to check specific app permissions
 * @returns {Object} Environment access object
 */
export const getEnvironmentAccessFromPermissions = (appGroupPermissions, appId = null) => {
  console.log('[getEnvironmentAccessFromPermissions] called with:', { appId, appGroupPermissions });

  if (!appGroupPermissions) {
    console.log('[getEnvironmentAccessFromPermissions] No appGroupPermissions, returning all false');
    return {
      development: false,
      staging: false,
      production: false,
      released: false,
    };
  }

  // If appId is provided, check for app-specific overrides first
  if (appId) {
    console.log('[getEnvironmentAccessFromPermissions] Checking app-specific overrides for appId:', appId);

    const appSpecificAccess =
      appGroupPermissions.app_specific_environment_access?.[appId] ||
      appGroupPermissions.appSpecificEnvironmentAccess?.[appId];

    console.log(
      '[getEnvironmentAccessFromPermissions] app_specific_environment_access:',
      appGroupPermissions.app_specific_environment_access
    );
    console.log('[getEnvironmentAccessFromPermissions] appSpecificAccess for this app:', appSpecificAccess);

    if (appSpecificAccess) {
      // App has specific override from custom groups - use it
      const result = {
        development: appSpecificAccess.development === true,
        staging: appSpecificAccess.staging === true,
        production: appSpecificAccess.production === true,
        released: appSpecificAccess.released === true,
      };
      console.log('[getEnvironmentAccessFromPermissions] Using app-specific override:', result);
      return result;
    } else {
      console.log('[getEnvironmentAccessFromPermissions] No app-specific override found, falling back to default');
    }
  }

  // Fall back to default permissions from default groups
  // Check for both snake_case and camelCase (backend sends snake_case)
  const defaultAccess = appGroupPermissions.environment_access || appGroupPermissions.environmentAccess;

  console.log('[getEnvironmentAccessFromPermissions] Using default access:', defaultAccess);

  return (
    defaultAccess || {
      development: false,
      staging: false,
      production: false,
      released: false,
    }
  );
};
