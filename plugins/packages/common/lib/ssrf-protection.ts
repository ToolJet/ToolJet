import { URL } from 'url';
import { QueryError } from './query.error';
import * as dns from 'dns/promises';

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

// Dangerous schemes that could lead to SSRF vulnerabilities
const DANGEROUS_SCHEMES = [
  'file',
  'ftp',
  'dict',
  'gopher',
  'jar',
  'data',
  'javascript',
];

interface SSRFProtectionOptions {
  enabled?: boolean;
  dnsResolutionCheck?: boolean;
  blockedSchemes?: string[];
}

export function getSSRFConfig(): SSRFProtectionOptions {
  const enabled = process.env.SSRF_PROTECTION_ENABLED === 'true'; // Disabled by default (opt-in)
  const dnsResolutionCheck = process.env.SSRF_DNS_RESOLUTION_CHECK === 'true'; // Disabled by default

  // Parse blocked schemes from environment variable
  // If not set, allow all schemes by default (self-hosted flexibility)
  // If set, parse comma-separated list of schemes to block
  const blockedSchemesEnv = process.env.SSRF_BLOCKED_SCHEMES;
  const blockedSchemes = blockedSchemesEnv
    ? blockedSchemesEnv.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0)
    : [];

  return {
    enabled,
    dnsResolutionCheck,
    blockedSchemes,
  };
}

/**
 * Check if a URL scheme is blocked based on configuration
 * @param scheme - The URL scheme (protocol) to check
 * @param blockedSchemes - Array of blocked schemes from config
 * @returns true if the scheme is blocked
 */
export function isSchemeBlocked(scheme: string, blockedSchemes: string[]): boolean {
  if (!scheme || !blockedSchemes || blockedSchemes.length === 0) {
    return false;
  }

  // Remove trailing colon if present (e.g., 'http:' -> 'http')
  const normalizedScheme = scheme.replace(/:$/, '').toLowerCase();

  return blockedSchemes.includes(normalizedScheme);
}

export function isCloudMetadataEndpoint(ipOrHostname: string): boolean {
  if (!ipOrHostname) return false;

  // Normalize
  const normalized = ipOrHostname.toLowerCase().trim();

  return CLOUD_METADATA_ENDPOINTS.some(pattern => pattern.test(normalized));
}

export function isPrivateIP(ip: string): boolean {
  return isCloudMetadataEndpoint(ip);
}

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

export async function resolvesToPrivateIP(hostname: string): Promise<boolean> {
  return resolvesToCloudMetadata(hostname);
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
  const scheme = url.protocol;

  // 1. Check for blocked schemes
  // By default, all schemes are allowed for self-hosted flexibility
  // Users can configure blocked schemes via SSRF_BLOCKED_SCHEMES env variable
  if (config.blockedSchemes && config.blockedSchemes.length > 0) {
    if (isSchemeBlocked(scheme, config.blockedSchemes)) {
      throw new QueryError(
        'URL scheme blocked',
        `The URL scheme '${scheme}' is not allowed. Blocked schemes: ${config.blockedSchemes.join(', ')}`,
        { scheme, blockedSchemes: config.blockedSchemes }
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
  const scheme = url.protocol;

  // Check for blocked schemes
  if (config.blockedSchemes && config.blockedSchemes.length > 0) {
    if (isSchemeBlocked(scheme, config.blockedSchemes)) {
      throw new QueryError(
        'URL scheme blocked',
        `The URL scheme '${scheme}' is not allowed. Blocked schemes: ${config.blockedSchemes.join(', ')}`,
        { scheme, blockedSchemes: config.blockedSchemes }
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
