import config from 'config';

/**
 * Get protocol-aware API URL
 *
 * Ensures API calls match the current page's protocol to avoid cross-protocol
 * cookie issues (HTTP page -> HTTPS API = cookies not sent).
 *
 * This is critical for SSL certificate acquisition, which must work when users
 * access the app via HTTP (before SSL is set up).
 *
 * @returns {string} API URL matching current page protocol
 */
export function getApiUrl() {
  const configUrl = config.apiUrl;

  // If config.apiUrl doesn't contain http:// or https://, it's already relative
  if (!configUrl.match(/^https?:\/\//)) {
    return configUrl;
  }

  // If current page is HTTP, force API calls to use HTTP too
  if (window.location.protocol === 'http:') {
    return configUrl.replace(/^https:/, 'http:');
  }

  // If current page is HTTPS, use HTTPS for API
  if (window.location.protocol === 'https:') {
    return configUrl.replace(/^http:/, 'https:');
  }

  // Fallback to original config
  return configUrl;
}
