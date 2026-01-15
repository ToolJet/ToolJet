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
 * @param {boolean} isBuilder - Whether the user is a builder (has edit capabilities)
 * @param {boolean} forceFirstAvailable - If true, return first available env instead of forcing development for builders
 * @returns {string} Default environment name or 'development' as fallback
 */
export const getDefaultEnvironment = (environmentAccess, isBuilder = false, forceFirstAvailable = false) => {
  if (!environmentAccess) {
    return ENVIRONMENT_NAMES.DEVELOPMENT;
  }

  const accessible = getAccessibleEnvironments(environmentAccess);

  if (accessible.length === 0) {
    return ENVIRONMENT_NAMES.DEVELOPMENT;
  }

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
 * @param {boolean} isBuilder - Whether the user is a builder (has edit capabilities)
 * @returns {string} Safe environment name user has access to
 */
export const getSafeEnvironment = (environmentAccess, requestedEnv, isBuilder = false) => {
  if (!requestedEnv) {
    return getDefaultEnvironment(environmentAccess, isBuilder);
  }

  // If user has access to requested environment, use it
  if (hasEnvironmentAccess(environmentAccess, requestedEnv)) {
    return requestedEnv.toLowerCase();
  }

  // Otherwise, return default accessible environment
  return getDefaultEnvironment(environmentAccess, isBuilder);
};

/**
 * Get environment access from app group permissions
 *
 * Resolution logic (matches backend):
 * 1. If appId is provided and has specific permissions, merge with default permissions
 * 2. User gets union of both default and app-specific permissions
 * 3. If neither exists, deny access
 * 4. Builders always get development access as it's the entry point for new apps
 *
 * @param {Object} appGroupPermissions - App group permissions object
 * @param {string} appId - Optional app ID to check specific app permissions
 * @returns {Object} Environment access object
 */
export const getEnvironmentAccessFromPermissions = (appGroupPermissions, appId = null) => {
  if (!appGroupPermissions) {
    return {
      development: false,
      staging: false,
      production: false,
      released: false,
    };
  }

  // Check if user is a builder (has any editable apps or is all editable)
  const isBuilder =
    appGroupPermissions.is_all_editable ||
    appGroupPermissions.isAllEditable ||
    (appGroupPermissions.editable_apps_id && appGroupPermissions.editable_apps_id.length > 0) ||
    (appGroupPermissions.editableAppsId && appGroupPermissions.editableAppsId.length > 0);

  // Get default permissions from default groups
  const defaultAccess = appGroupPermissions.environment_access || appGroupPermissions.environmentAccess || {};

  // If appId is provided, check for app-specific permissions and merge with default
  if (appId) {
    const appSpecificAccess =
      appGroupPermissions.app_specific_environment_access?.[appId] ||
      appGroupPermissions.appSpecificEnvironmentAccess?.[appId];

    if (appSpecificAccess) {
      // Merge app-specific and default permissions - user gets union of both
      let result = {
        development: appSpecificAccess.development === true || defaultAccess.development === true,
        staging: appSpecificAccess.staging === true || defaultAccess.staging === true,
        production: appSpecificAccess.production === true || defaultAccess.production === true,
        released: appSpecificAccess.released === true || defaultAccess.released === true,
      };

      // If user has no access to any environment, grant development as fallback
      if (!result.development && !result.staging && !result.production && !result.released) {
        result.development = true;
      }

      return result;
    }
  }

  // Return default permissions
  let result = {
    development: defaultAccess.development === true,
    staging: defaultAccess.staging === true,
    production: defaultAccess.production === true,
    released: defaultAccess.released === true,
  };

  // If user has no access to any environment, grant development as fallback
  if (!result.development && !result.staging && !result.production && !result.released) {
    result.development = true;
  }

  return result;
};
