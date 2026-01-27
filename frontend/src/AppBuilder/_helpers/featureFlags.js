/**
 * Feature Flags
 *
 * Configuration for feature flags used in the AppBuilder.
 * These flags allow gradual rollout of new features and easy toggling
 * during development.
 */

/**
 * Feature flag definitions
 */
export const FeatureFlags = {
  /**
   * Enable the new worker-based architecture for off-main-thread computation.
   * When enabled, expression resolution, dependency tracking, and event processing
   * will run in a Web Worker using Comlink RPC.
   *
   * Default: false (disabled)
   */
  USE_WORKER_ARCHITECTURE: 'useWorkerArchitecture',

  /**
   * Enable lazy resolution for ListView and other virtualized containers.
   * Only resolves components that are visible in the viewport.
   *
   * Default: false (disabled)
   */
  USE_LAZY_RESOLUTION: 'useLazyResolution',

  /**
   * Enable debug mode for worker communication.
   * Logs all RPC calls and operations to the console.
   *
   * Default: false (disabled in production)
   */
  WORKER_DEBUG: 'workerDebug',
};

/**
 * Feature flag values - can be set at runtime
 * @type {Map<string, boolean>}
 */
const flagValues = new Map([
  [FeatureFlags.USE_WORKER_ARCHITECTURE, true],
  [FeatureFlags.USE_LAZY_RESOLUTION, false],
  [FeatureFlags.WORKER_DEBUG, false],
]);

/**
 * Initialize feature flags from config
 * Called during app startup
 * @param {object} config - Configuration object (e.g., from window.__TOOLJET_CONFIG__)
 */
export function initializeFeatureFlags(config = {}) {
  if (config.useWorkerArchitecture !== undefined) {
    flagValues.set(FeatureFlags.USE_WORKER_ARCHITECTURE, Boolean(config.useWorkerArchitecture));
  }

  if (config.useLazyResolution !== undefined) {
    flagValues.set(FeatureFlags.USE_LAZY_RESOLUTION, Boolean(config.useLazyResolution));
  }

  if (config.workerDebug !== undefined) {
    flagValues.set(FeatureFlags.WORKER_DEBUG, Boolean(config.workerDebug));
  }

  // In development, enable debug by default
  if (process.env.NODE_ENV === 'development' && config.workerDebug === undefined) {
    flagValues.set(FeatureFlags.WORKER_DEBUG, true);
  }
}

/**
 * Get a feature flag value
 * @param {string} flag - Flag name from FeatureFlags
 * @returns {boolean} Flag value
 */
export function getFeatureFlag(flag) {
  return flagValues.get(flag) ?? false;
}

/**
 * Set a feature flag value at runtime
 * @param {string} flag - Flag name
 * @param {boolean} value - Flag value
 */
export function setFeatureFlag(flag, value) {
  flagValues.set(flag, Boolean(value));
}

/**
 * Check if worker architecture is enabled
 * @returns {boolean}
 */
export function isWorkerArchitectureEnabled() {
  return getFeatureFlag(FeatureFlags.USE_WORKER_ARCHITECTURE);
}

/**
 * Check if lazy resolution is enabled
 * @returns {boolean}
 */
export function isLazyResolutionEnabled() {
  return getFeatureFlag(FeatureFlags.USE_LAZY_RESOLUTION);
}

/**
 * Check if worker debug mode is enabled
 * @returns {boolean}
 */
export function isWorkerDebugEnabled() {
  return getFeatureFlag(FeatureFlags.WORKER_DEBUG);
}

/**
 * Get all feature flags and their values
 * @returns {object} Map of flag names to values
 */
export function getAllFeatureFlags() {
  return {
    [FeatureFlags.USE_WORKER_ARCHITECTURE]: getFeatureFlag(FeatureFlags.USE_WORKER_ARCHITECTURE),
    [FeatureFlags.USE_LAZY_RESOLUTION]: getFeatureFlag(FeatureFlags.USE_LAZY_RESOLUTION),
    [FeatureFlags.WORKER_DEBUG]: getFeatureFlag(FeatureFlags.WORKER_DEBUG),
  };
}

export default FeatureFlags;
