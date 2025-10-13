import { URL } from 'url';
import { QueryError } from './query.error';
import * as dns from 'dns/promises';
import * as net from 'net';

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

/**
 * Check if an IP address is in a private/internal range
 * Covers RFC1918, link-local, loopback, and cloud metadata endpoints
 */
export function isPrivateIP(ip: string): boolean {
  if (!ip) return false;

  // First check cloud metadata endpoints
  if (isCloudMetadataEndpoint(ip)) {
    return true;
  }

  // Parse IPv4 address
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);

  if (!match) {
    // Check for IPv6 addresses
    if (ip.includes(':')) {
      return isPrivateIPv6(ip);
    }
    return false;
  }

  const octets = match.slice(1, 5).map(Number);

  // Validate octets are in valid range
  if (octets.some(octet => octet < 0 || octet > 255)) {
    return false;
  }

  const [a, b, c, d] = octets;

  // Loopback: 127.0.0.0/8
  if (a === 127) {
    return true;
  }

  // RFC1918 Private networks:
  // 10.0.0.0/8
  if (a === 10) {
    return true;
  }

  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }

  // 192.168.0.0/16
  if (a === 192 && b === 168) {
    return true;
  }

  // Link-local: 169.254.0.0/16 (includes cloud metadata endpoints)
  if (a === 169 && b === 254) {
    return true;
  }

  // Carrier-grade NAT: 100.64.0.0/10
  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }

  // Broadcast: 255.255.255.255
  if (a === 255 && b === 255 && c === 255 && d === 255) {
    return true;
  }

  // 0.0.0.0/8 - Current network
  if (a === 0) {
    return true;
  }

  return false;
}

/**
 * Check if an IPv6 address is private/internal
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // Loopback: ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return true;
  }

  // Link-local: fe80::/10
  if (normalized.startsWith('fe80:')) {
    return true;
  }

  // Unique local addresses: fc00::/7 (fd00::/8 and fc00::/8)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  // IPv4-mapped IPv6: ::ffff:0:0/96
  if (normalized.includes('::ffff:')) {
    // Extract the IPv4 part and check it
    const ipv4Part = normalized.split('::ffff:')[1];
    if (ipv4Part) {
      // Handle both ::ffff:192.168.1.1 and ::ffff:c0a8:101 formats
      if (ipv4Part.includes('.')) {
        return isPrivateIP(ipv4Part);
      }
    }
  }

  return false;
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

/**
 * Check if a hostname resolves to any private IP address
 * This includes all RFC1918, link-local, loopback, and cloud metadata ranges
 */
export async function resolvesToPrivateIP(hostname: string): Promise<boolean> {
  try {
    // Try to resolve as both IPv4 and IPv6
    const addresses: string[] = [];

    try {
      const ipv4Addresses = await dns.resolve4(hostname);
      addresses.push(...ipv4Addresses);
    } catch (error) {
      // IPv4 resolution failed, continue
    }

    try {
      const ipv6Addresses = await dns.resolve6(hostname);
      addresses.push(...ipv6Addresses);
    } catch (error) {
      // IPv6 resolution failed, continue
    }

    // If no addresses resolved, fail open for self-hosted compatibility
    if (addresses.length === 0) {
      console.warn(`DNS resolution failed for ${hostname}`);
      return false;
    }

    // Check if any resolved address is a private IP
    return addresses.some(addr => isPrivateIP(addr));
  } catch (error) {
    console.warn(`DNS resolution error for ${hostname}:`, error.message);
    return false;
  }
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

  // 2. Check if hostname is a private IP address
  // When SSRF protection is enabled, block direct access to private IPs
  if (isPrivateIP(hostname)) {
    throw new QueryError(
      'Private IP address blocked',
      'Direct access to private IP addresses is not allowed for security reasons',
      { hostname }
    );
  }

  // 3. DNS resolution check (if enabled)
  // This protects against DNS rebinding attacks like 169.254.169.254.nip.io
  if (config.dnsResolutionCheck) {
    const resolves = await resolvesToPrivateIP(hostname);
    if (resolves) {
      throw new QueryError(
        'Hostname resolves to private IP',
        'This hostname resolves to a private IP address and is blocked for security reasons',
        { hostname }
      );
    }
  }
}

/**
 * Creates a custom DNS lookup function that validates resolved IPs
 * This is the most effective way to prevent SSRF via DNS rebinding
 *
 * @param options - SSRF protection configuration
 * @returns Custom lookup function for got/http options
 */
export function createSSRFSafeLookup(options?: SSRFProtectionOptions) {
  const config = options || getSSRFConfig();

  // If SSRF protection is disabled, return undefined (use default lookup)
  if (!config.enabled) {
    return undefined;
  }

  // Return custom lookup function
  return (hostname: string, options: any, callback: Function) => {
    // Use Node's default dns.lookup
    dns.lookup(hostname, options, (err, address, family) => {
      if (err) {
        return callback(err);
      }

      // Validate the resolved IP address
      if (isPrivateIP(address)) {
        const error: any = new Error(
          `Hostname "${hostname}" resolves to private IP address "${address}" which is blocked for security reasons`
        );
        error.code = 'SSRF_BLOCKED';
        error.hostname = hostname;
        error.address = address;
        return callback(error);
      }

      // IP is safe, proceed with connection
      callback(null, address, family);
    });
  };
}

/**
 * Gets got request options with SSRF protection enabled
 * This includes custom DNS lookup and redirect handling
 *
 * @param options - SSRF protection configuration
 * @returns Partial got options object with SSRF protection
 */
export function getSSRFProtectionOptions(options?: SSRFProtectionOptions): any {
  const config = options || getSSRFConfig();

  // If SSRF protection is disabled, return empty options
  if (!config.enabled) {
    return {};
  }

  const ssrfOptions: any = {
    // Custom DNS lookup function to validate resolved IPs
    dnsLookup: createSSRFSafeLookup(config),

    // Hooks to validate before redirects
    hooks: {
      beforeRedirect: [
        async (options: any, response: any) => {
          // Validate redirect URL
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            try {
              // Validate the redirect URL
              await validateUrlForSSRF(redirectUrl, config);
            } catch (error) {
              throw new QueryError(
                'Redirect blocked by SSRF protection',
                `Redirect to "${redirectUrl}" was blocked: ${error.message}`,
                { redirectUrl, originalError: error }
              );
            }
          }
        }
      ]
    }
  };

  return ssrfOptions;
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

  // Check if hostname is a private IP
  if (isPrivateIP(hostname)) {
    throw new QueryError(
      'Private IP address blocked',
      'Direct access to private IP addresses is not allowed for security reasons',
      { hostname }
    );
  }
}
