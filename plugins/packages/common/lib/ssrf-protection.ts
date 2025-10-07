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

interface SSRFProtectionOptions {
  enabled?: boolean;
  dnsResolutionCheck?: boolean;
}

export function getSSRFConfig(): SSRFProtectionOptions {
  const enabled = process.env.SSRF_PROTECTION_ENABLED === 'true'; // Disabled by default (opt-in)
  const dnsResolutionCheck = process.env.SSRF_DNS_RESOLUTION_CHECK === 'true'; // Disabled by default

  return {
    enabled,
    dnsResolutionCheck,
  };
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

  // 1. Check for cloud metadata endpoints
  // When SSRF protection is enabled, block access to cloud metadata endpoints
  // Does NOT block private IPs or localhost (self-hosted users need these)
  if (isCloudMetadataEndpoint(hostname)) {
    throw new QueryError(
      'Cloud metadata endpoint blocked',
      'Access to cloud metadata endpoints is not allowed for security reasons',
      { hostname }
    );
  }

  // 2. DNS resolution check (if enabled)
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

  // Check cloud metadata endpoints
  if (isCloudMetadataEndpoint(hostname)) {
    throw new QueryError(
      'Cloud metadata endpoint blocked',
      'Access to cloud metadata endpoints is not allowed for security reasons',
      { hostname }
    );
  }
}
