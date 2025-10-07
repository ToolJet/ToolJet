import { URL } from 'url';
import { QueryError } from './query.error';
import * as dns from 'dns/promises';

/**
 * SSRF Protection Configuration
 *
 * This module provides utilities to prevent Server-Side Request Forgery (SSRF) attacks
 * by validating URLs, hostnames, and IP addresses before making external HTTP requests.
 */

/**
 * Cloud Metadata Endpoints
 *
 * These are the primary SSRF targets in cloud environments.
 * Block access to cloud metadata services that expose sensitive information.
 *
 * For self-hosted deployments, we only block these specific endpoints by default,
 * not all private IPs, since users may legitimately need to access internal services.
 */
const CLOUD_METADATA_ENDPOINTS = [
  // AWS EC2 metadata endpoint (most common SSRF target)
  /^169\.254\.169\.254$/,
  /^169\.254\.169\.253$/,        // Alternate AWS endpoint

  // Google Cloud metadata
  /^metadata\.google\.internal$/i,
  /^169\.254\.169\.254$/,        // GCP also uses this IP

  // Azure metadata (uses specific headers, but block the endpoint too)
  /^169\.254\.169\.254$/,

  // DigitalOcean metadata
  /^169\.254\.169\.254$/,

  // Oracle Cloud metadata
  /^169\.254\.169\.254$/,

  // Alibaba Cloud metadata
  /^100\.100\.100\.200$/,

  // Kubernetes metadata
  /^169\.254\.169\.254$/,
];

interface SSRFProtectionOptions {
  enabled?: boolean;
  allowedHosts?: string[];
  dnsResolutionCheck?: boolean;
}

/**
 * Get SSRF protection configuration from environment variables
 *
 * For self-hosted deployments:
 * - SSRF protection is DISABLED by default (opt-in)
 * - When enabled, blocks cloud metadata endpoints (169.254.169.254, etc.)
 * - Does NOT block private IPs or localhost (self-hosted users need access to internal services)
 * - URL schemes are NOT restricted to allow maximum flexibility
 */
export function getSSRFConfig(): SSRFProtectionOptions {
  const enabled = process.env.SSRF_PROTECTION_ENABLED === 'true'; // Disabled by default (opt-in)
  const allowedHosts = process.env.ALLOWED_HOSTS_WHITELIST
    ? process.env.ALLOWED_HOSTS_WHITELIST.split(',').map(h => h.trim()).filter(h => h.length > 0)
    : [];
  const dnsResolutionCheck = process.env.SSRF_DNS_RESOLUTION_CHECK === 'true'; // Disabled by default

  return {
    enabled,
    allowedHosts,
    dnsResolutionCheck,
  };
}

/**
 * Check if an IP address or hostname is a cloud metadata endpoint
 *
 * Only blocks cloud metadata endpoints, not all private IPs.
 * This allows self-hosted users to access internal services while
 * protecting against the most critical SSRF vector.
 */
export function isCloudMetadataEndpoint(ipOrHostname: string): boolean {
  if (!ipOrHostname) return false;

  // Normalize
  const normalized = ipOrHostname.toLowerCase().trim();

  return CLOUD_METADATA_ENDPOINTS.some(pattern => pattern.test(normalized));
}

/**
 * Legacy function name for backward compatibility
 * Now only checks for cloud metadata endpoints, not all private IPs
 */
export function isPrivateIP(ip: string): boolean {
  return isCloudMetadataEndpoint(ip);
}

/**
 * Check if a hostname resolves to a cloud metadata endpoint
 * This helps prevent DNS rebinding attacks targeting cloud metadata
 */
export async function resolvesToCloudMetadata(hostname: string): Promise<boolean> {
  try {
    const addresses = await dns.resolve(hostname);
    return addresses.some(addr => isCloudMetadataEndpoint(addr));
  } catch (error) {
    // If DNS resolution fails, allow the request (fail open for self-hosted)
    // Users can enable stricter checking if needed
    console.warn(`DNS resolution failed for ${hostname}:`, error.message);
    return false;
  }
}

/**
 * Legacy function name for backward compatibility
 */
export async function resolvesToPrivateIP(hostname: string): Promise<boolean> {
  return resolvesToCloudMetadata(hostname);
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

  const hostname = url.hostname.toLowerCase();

  // 1. Validate hostname against whitelist (if configured)
  if (config.allowedHosts && config.allowedHosts.length > 0) {
    if (!isHostnameAllowed(hostname, config.allowedHosts)) {
      throw new QueryError(
        'Hostname not allowed',
        'This hostname is not in the allowed hosts list',
        { hostname }
      );
    }
  }

  // 2. Check for cloud metadata endpoints
  // When SSRF protection is enabled, block access to cloud metadata endpoints
  // Does NOT block private IPs or localhost (self-hosted users need these)
  if (isCloudMetadataEndpoint(hostname)) {
    throw new QueryError(
      'Cloud metadata endpoint blocked',
      'Access to cloud metadata endpoints is not allowed for security reasons',
      { hostname }
    );
  }

  // 3. DNS resolution check (if enabled)
  if (config.dnsResolutionCheck) {
    const resolves = await resolvesToCloudMetadata(hostname);
    if (resolves) {
      throw new QueryError(
        'Hostname resolves to cloud metadata endpoint',
        'This hostname resolves to a cloud metadata endpoint and is blocked',
        { hostname }
      );
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

  // Check cloud metadata endpoints
  if (isCloudMetadataEndpoint(hostname)) {
    throw new QueryError(
      'Cloud metadata endpoint blocked',
      'Access to cloud metadata endpoints is not allowed for security reasons',
      { hostname }
    );
  }
}
