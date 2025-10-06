import { URL } from 'url';
import { QueryError } from './query.error';
import * as dns from 'dns/promises';

/**
 * SSRF Protection Configuration
 *
 * This module provides utilities to prevent Server-Side Request Forgery (SSRF) attacks
 * by validating URLs, hostnames, and IP addresses before making external HTTP requests.
 */

// Private IP ranges (RFC1918, RFC4193, RFC3927, etc.)
const PRIVATE_IP_RANGES = [
  // IPv4 private ranges
  /^127\./,                      // Loopback
  /^10\./,                       // Private Class A
  /^172\.(1[6-9]|2\d|3[0-1])\./,// Private Class B
  /^192\.168\./,                 // Private Class C
  /^169\.254\./,                 // Link-local
  /^0\./,                        // Current network

  // IPv6 private ranges
  /^::1$/,                       // Loopback
  /^fe80:/,                      // Link-local
  /^fc00:/,                      // Unique local address
  /^fd00:/,                      // Unique local address
  /^ff00:/,                      // Multicast
];

// Allowed URL schemes for HTTP requests
const ALLOWED_SCHEMES = ['http:', 'https:'];

// Dangerous URL schemes that should be blocked
const BLOCKED_SCHEMES = ['file:', 'ftp:', 'dict:', 'gopher:', 'jar:', 'data:', 'javascript:'];

interface SSRFProtectionOptions {
  enabled?: boolean;
  allowedHosts?: string[];
  allowedSchemes?: string[];
  blockPrivateIPs?: boolean;
  dnsResolutionCheck?: boolean;
}

/**
 * Get SSRF protection configuration from environment variables
 */
export function getSSRFConfig(): SSRFProtectionOptions {
  const enabled = process.env.SSRF_PROTECTION_ENABLED !== 'false'; // Enabled by default
  const allowedHosts = process.env.ALLOWED_HOSTS_WHITELIST
    ? process.env.ALLOWED_HOSTS_WHITELIST.split(',').map(h => h.trim()).filter(h => h.length > 0)
    : [];
  const allowedSchemes = process.env.ALLOWED_URL_SCHEMAS
    ? process.env.ALLOWED_URL_SCHEMAS.split(',').map(s => s.trim() + ':')
    : ALLOWED_SCHEMES;
  const blockPrivateIPs = process.env.BLOCK_PRIVATE_IPS !== 'false'; // Block by default
  const dnsResolutionCheck = process.env.SSRF_DNS_RESOLUTION_CHECK === 'true'; // Disabled by default for performance

  return {
    enabled,
    allowedHosts,
    allowedSchemes,
    blockPrivateIPs,
    dnsResolutionCheck,
  };
}

/**
 * Check if an IP address is private/internal
 */
export function isPrivateIP(ip: string): boolean {
  if (!ip) return false;

  // Normalize IPv6 addresses
  const normalizedIP = ip.toLowerCase().trim();

  return PRIVATE_IP_RANGES.some(range => range.test(normalizedIP));
}

/**
 * Check if a hostname resolves to a private IP address
 * This helps prevent DNS rebinding attacks
 */
export async function resolvesToPrivateIP(hostname: string): Promise<boolean> {
  try {
    const addresses = await dns.resolve(hostname);
    return addresses.some(addr => isPrivateIP(addr));
  } catch (error) {
    // If DNS resolution fails, we should block the request for safety
    console.warn(`DNS resolution failed for ${hostname}:`, error.message);
    return true; // Treat DNS errors as potentially dangerous
  }
}

/**
 * Validate URL scheme
 */
export function isValidScheme(url: URL, allowedSchemes: string[]): boolean {
  return allowedSchemes.includes(url.protocol);
}

/**
 * Validate hostname against whitelist (if provided)
 */
export function isHostnameAllowed(hostname: string, allowedHosts: string[]): boolean {
  if (allowedHosts.length === 0) {
    return true; // No whitelist configured, allow all
  }

  // Check exact match
  if (allowedHosts.includes(hostname)) {
    return true;
  }

  // Check wildcard patterns (e.g., *.example.com)
  return allowedHosts.some(allowedHost => {
    if (allowedHost.startsWith('*.')) {
      const domain = allowedHost.substring(2);
      return hostname.endsWith('.' + domain) || hostname === domain;
    }
    return false;
  });
}

/**
 * Main SSRF validation function
 * Validates a URL against SSRF protection rules
 *
 * @param urlString - The URL to validate
 * @param options - Optional SSRF protection configuration
 * @throws QueryError if URL fails validation
 */
export async function validateUrlForSSRF(
  urlString: string,
  options?: SSRFProtectionOptions
): Promise<void> {
  const config = options || getSSRFConfig();

  // If SSRF protection is disabled, skip validation
  if (!config.enabled) {
    return;
  }

  let url: URL;

  // Parse URL
  try {
    url = new URL(urlString);
  } catch (error) {
    throw new QueryError(
      'Invalid URL format',
      'The provided URL is malformed and cannot be processed',
      {}
    );
  }

  // 1. Validate URL scheme
  if (!isValidScheme(url, config.allowedSchemes)) {
    throw new QueryError(
      'Blocked URL scheme',
      `Only ${config.allowedSchemes.map(s => s.replace(':', '')).join(', ')} protocols are allowed`,
      { protocol: url.protocol }
    );
  }

  // 2. Check for blocked schemes
  if (BLOCKED_SCHEMES.some(scheme => url.protocol === scheme)) {
    throw new QueryError(
      'Dangerous URL scheme detected',
      `The ${url.protocol} protocol is not allowed for security reasons`,
      { protocol: url.protocol }
    );
  }

  const hostname = url.hostname.toLowerCase();

  // 3. Validate hostname against whitelist (if configured)
  if (config.allowedHosts && config.allowedHosts.length > 0) {
    if (!isHostnameAllowed(hostname, config.allowedHosts)) {
      throw new QueryError(
        'Hostname not allowed',
        'This hostname is not in the allowed hosts list',
        { hostname }
      );
    }
  }

  // 4. Check for private IP addresses in hostname
  if (config.blockPrivateIPs) {
    // Direct IP address check
    if (isPrivateIP(hostname)) {
      throw new QueryError(
        'Private IP address blocked',
        'Requests to private IP addresses are not allowed for security reasons',
        { hostname }
      );
    }

    // DNS resolution check (if enabled)
    if (config.dnsResolutionCheck) {
      const resolves = await resolvesToPrivateIP(hostname);
      if (resolves) {
        throw new QueryError(
          'Hostname resolves to private IP',
          'This hostname resolves to a private IP address and is blocked',
          { hostname }
        );
      }
    }
  }
}

/**
 * Synchronous version of URL validation (without DNS resolution)
 * Use this for basic validation when async is not available
 */
export function validateUrlForSSRFSync(urlString: string, options?: SSRFProtectionOptions): void {
  const config = options || getSSRFConfig();

  if (!config.enabled) {
    return;
  }

  let url: URL;

  try {
    url = new URL(urlString);
  } catch (error) {
    throw new QueryError(
      'Invalid URL format',
      'The provided URL is malformed and cannot be processed',
      {}
    );
  }

  // Validate scheme
  if (!isValidScheme(url, config.allowedSchemes)) {
    throw new QueryError(
      'Blocked URL scheme',
      `Only ${config.allowedSchemes.map(s => s.replace(':', '')).join(', ')} protocols are allowed`,
      { protocol: url.protocol }
    );
  }

  // Check for blocked schemes
  if (BLOCKED_SCHEMES.some(scheme => url.protocol === scheme)) {
    throw new QueryError(
      'Dangerous URL scheme detected',
      `The ${url.protocol} protocol is not allowed for security reasons`,
      { protocol: url.protocol }
    );
  }

  const hostname = url.hostname.toLowerCase();

  // Validate whitelist
  if (config.allowedHosts && config.allowedHosts.length > 0) {
    if (!isHostnameAllowed(hostname, config.allowedHosts)) {
      throw new QueryError(
        'Hostname not allowed',
        'This hostname is not in the allowed hosts list',
        { hostname }
      );
    }
  }

  // Check private IPs
  if (config.blockPrivateIPs && isPrivateIP(hostname)) {
    throw new QueryError(
      'Private IP address blocked',
      'Requests to private IP addresses are not allowed for security reasons',
      { hostname }
    );
  }
}
