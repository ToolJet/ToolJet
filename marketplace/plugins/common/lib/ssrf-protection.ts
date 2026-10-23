import { URL } from 'url';
import { QueryError } from './query.error';
import * as dns from 'dns/promises';
import { lookup as dnsLookup } from 'dns';
import * as net from 'net';

const CLOUD_METADATA_ENDPOINTS = [
  // AWS EC2, IBM Cloud, and OpenStack metadata endpoint (most common SSRF target)
  /^169\.254\.169\.254$/,
  /^169\.254\.169\.253$/, // Alternate AWS endpoint

  // Google Cloud metadata
  /^metadata\.google\.internal$/i,
  /^169\.254\.169\.254$/, // GCP also uses this IP

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

const DEFAULT_BLOCKED_SCHEMES = ['file', 'gopher', 'dict', 'ftp', 'jar', 'data', 'javascript'];

// Well-known hostnames that always resolve to loopback/private addresses.
// Checked statically before DNS resolution as defense-in-depth.
const BLOCKED_HOSTNAMES = new Set(['ip6-localhost', 'ip6-loopback', '0.0.0.0']);

// DNS-rebinding-as-a-service domains — their sole purpose is embedding an IP
// in a hostname, so they have no legitimate use in outbound requests.
const BLOCKED_HOSTNAME_PATTERNS = [
  /\.nip\.io$/i,
  /\.xip\.io$/i,
  /\.sslip\.io$/i,
  /\.localtest\.me$/i,
  /\.traefik\.me$/i,
];

interface SSRFProtectionOptions {
  enabled?: boolean;
  dnsResolutionCheck?: boolean;
  blockedSchemes?: string[];
  allowedHostnames?: Set<string>;
  allowPrivateNetworks?: boolean;
  allowedRanges?: net.BlockList;
}

/**
 * True if the IP is inside an admin-allowed IP/CIDR range. Only ever true when the server
 * published a runtime config (allowedRanges is otherwise undefined).
 */
function isInAllowedRanges(ip: string, config: SSRFProtectionOptions): boolean {
  if (!ip || !config.allowedRanges) return false;
  const host = ip.toLowerCase().replace(/^\[|\]$/g, '');
  const family = net.isIP(host);
  return family !== 0 && config.allowedRanges.check(host, family === 6 ? 'ipv6' : 'ipv4');
}

/**
 * True if the hostname or IP is on the admin allowlist (exact hostname, or an IP inside an allowed IP/CIDR).
 */
export function isAllowlisted(hostOrIp: string, config: SSRFProtectionOptions): boolean {
  if (!hostOrIp) return false;
  if (config.allowedHostnames?.has(hostOrIp.toLowerCase())) return true;
  return isInAllowedRanges(hostOrIp, config);
}

export function getSSRFConfig(): SSRFProtectionOptions {
  // Written by the server on EE only. When present it is the source of truth: the env vars and
  // edition defaults (incl. the hardcoded localhost allowance) are not read.
  const runtime = (globalThis as any).__TOOLJET_SSRF_RUNTIME_CONFIG__;
  if (runtime) {
    return {
      enabled: runtime.enabled,
      dnsResolutionCheck: true,
      blockedSchemes: DEFAULT_BLOCKED_SCHEMES,
      allowPrivateNetworks: false,
      allowedHostnames: runtime.allowedHostnames,
      allowedRanges: runtime.allowedRanges,
    };
  }

  const edition = process.env.TOOLJET_EDITION?.toLowerCase();
  const isCloud = edition === 'cloud';
  const isEE = edition === 'ee';

  // Edition-aware enabled default:
  //   Cloud  — always ON; env var ignored (multi-tenant, cannot be disabled)
  //   EE     — OFF by default; opt-in via SSRF_PROTECTION_ENABLED=true
  //            (EE customers run in closed private networks and need full internal access)
  //   CE/unset — ON by default; opt-out via SSRF_PROTECTION_ENABLED=false
  let enabled: boolean;
  if (isCloud) {
    enabled = true;
  } else if (isEE) {
    enabled = process.env.SSRF_PROTECTION_ENABLED === 'true';
  } else {
    enabled = process.env.SSRF_PROTECTION_ENABLED !== 'false';
  }

  const dnsResolutionCheck = process.env.SSRF_DNS_RESOLUTION_CHECK !== 'false';

  const blockedSchemesEnv = process.env.SSRF_BLOCKED_SCHEMES;
  const blockedSchemes = blockedSchemesEnv
    ? blockedSchemesEnv
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0)
    : DEFAULT_BLOCKED_SCHEMES;

  // Cloud: block all private ranges — multi-tenant shared infra, full SSRF enforcement.
  // EE/CE: allow RFC1918 (10.x, 172.16.x, 192.168.x) — customers legitimately reach
  //        internal services on their own private networks. Cloud metadata endpoints
  //        (169.254.x.x) and loopback remain blocked even on self-hosted.
  const allowPrivateNetworks = !isCloud;

  // Self-hosted: localhost and loopback explicitly allowed.
  // Cloud: nothing bypasses SSRF checks.
  const allowedHostnames = isCloud ? new Set<string>() : new Set(['localhost', 'ip6-localhost', 'ip6-loopback', '::1']);

  return { enabled, dnsResolutionCheck, blockedSchemes, allowPrivateNetworks, allowedHostnames };
}

function hasRuntimeConfig(): boolean {
  return !!(globalThis as any).__TOOLJET_SSRF_RUNTIME_CONFIG__;
}

/**
 * `new URL()` keeps the brackets on IPv6 literals ([::1]). The IP checks always get the bare address.
 * Under the runtime key and on Cloud the allowlist and DNS step get it too, so an IP literal is decided by
 * the IP check alone (no DNS lookup of a literal). Elsewhere they keep the bracketed form as before.
 */
function urlHosts(url: URL): { hostname: string; address: string } {
  const bracketed = url.hostname.toLowerCase();
  const address = bracketed.replace(/^\[|\]$/g, '');
  const strict = hasRuntimeConfig() || process.env.TOOLJET_EDITION?.toLowerCase() === 'cloud';
  return { hostname: strict ? address : bracketed, address };
}

function throwIfSchemeBlocked(scheme: string, config: SSRFProtectionOptions): void {
  if (isSchemeBlocked(scheme, config.blockedSchemes)) {
    throw new QueryError(
      'URL scheme blocked',
      `The URL scheme '${scheme}' is not allowed. Blocked schemes: ${config.blockedSchemes.join(', ')}`,
      { scheme, blockedSchemes: config.blockedSchemes }
    );
  }
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

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().trim();
  if (BLOCKED_HOSTNAMES.has(normalized)) return true;
  return BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isCloudMetadataEndpoint(ipOrHostname: string): boolean {
  if (!ipOrHostname) return false;

  // Normalize
  const normalized = ipOrHostname.toLowerCase().trim();

  return CLOUD_METADATA_ENDPOINTS.some((pattern) => pattern.test(normalized));
}

/**
 * Normalize alternative IP formats to standard decimal notation
 * Handles: hex (0xA9FEA9FE), decimal (2852039166), octal (0251.0376.0251.0376)
 * Note: Mixed-base dotted formats (e.g., 127.0x0.0x0.1, 0177.0.0.1, 0x7f.0.0.1) can be
 * added in future iterations for more comprehensive normalization.
 */
function normalizeIPFormat(ip: string): string {
  if (!ip) return ip;

  // Trim whitespace from IP address
  ip = ip.trim();

  // Hex: 0xA9FEA9FE or 0xA9.0xFE.0xA9.0xFE
  if (ip.startsWith('0x') || ip.includes('.0x')) {
    try {
      // Handle single hex value (0xA9FEA9FE)
      if (!ip.includes('.')) {
        const num = parseInt(ip, 16);
        if (!isNaN(num) && num >= 0 && num <= 0xffffffff) {
          return [(num >>> 24) & 0xff, (num >>> 16) & 0xff, (num >>> 8) & 0xff, num & 0xff].join('.');
        }
      }
      // Handle dotted hex (0xA9.0xFE.0xA9.0xFE)
      const parts = ip.split('.').map((p) => parseInt(p, 16));
      if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
        return parts.join('.');
      }
    } catch (e) {
      // Fall through to original value
    }
  }

  // Decimal: 2852039166
  if (/^\d+$/.test(ip) && !ip.includes('.')) {
    const num = parseInt(ip, 10);
    if (!isNaN(num) && num >= 0 && num <= 0xffffffff) {
      return [(num >>> 24) & 0xff, (num >>> 16) & 0xff, (num >>> 8) & 0xff, num & 0xff].join('.');
    }
  }

  // Octal: 0251.0376.0251.0376
  if (ip.split('.').some((part) => part.startsWith('0') && part.length > 1 && /^[0-7]+$/.test(part))) {
    try {
      const parts = ip.split('.').map((p) => parseInt(p, 8));
      if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
        return parts.join('.');
      }
    } catch (e) {
      // Fall through to original value
    }
  }

  return ip;
}

/**
 * Check if an IP address is in a private/internal range
 * Covers RFC1918, link-local, loopback, and cloud metadata endpoints
 */
export function isPrivateIP(ip: string): boolean {
  if (!ip) return false;

  // Normalize alternative IP formats (hex, decimal, octal)
  const normalizedIP = normalizeIPFormat(ip);

  // First check cloud metadata endpoints
  if (isCloudMetadataEndpoint(normalizedIP)) {
    return true;
  }

  // Parse IPv4 address
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = normalizedIP.match(ipv4Regex);

  if (!match) {
    // Check for IPv6 addresses
    if (normalizedIP.includes(':')) {
      return isPrivateIPv6(normalizedIP);
    }
    return false;
  }

  const octets = match.slice(1, 5).map(Number);

  // Validate octets are in valid range
  if (octets.some((octet) => octet < 0 || octet > 255)) {
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

  // Multicast: 224.0.0.0/4
  if (a >= 224 && a <= 239) {
    return true;
  }

  // Reserved: 240.0.0.0/4
  if (a >= 240 && a <= 255) {
    return true;
  }

  return false;
}

// Same code in plugins/packages/common, marketplace/plugins/common and server/src/helpers ssrf-protection; keep them identical.
/** The 8 16-bit groups of an IPv6 address (any spelling, incl. `::` and a dotted-quad tail), or null if not IPv6. */
function ipv6Hextets(ip: string): number[] | null {
  if (!ip || !net.isIPv6(ip)) return null;
  let address = ip.toLowerCase().replace(/%.*$/, '');
  const dotted = address.match(/^(.*:)(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (dotted) {
    const [a, b, c, d] = dotted.slice(2).map(Number);
    address = `${dotted[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const groups = (part: string) => (part ? part.split(':').map((g) => parseInt(g, 16)) : []);
  const [head, tail] = address.split('::');
  if (tail === undefined) return groups(head);
  const left = groups(head);
  const right = groups(tail);
  return [...left, ...new Array(8 - left.length - right.length).fill(0), ...right];
}

/**
 * ::, ::1, link-local fe80::/10, site-local fec0::/10, multicast ff00::/8 and NAT64 local-use 64:ff9b:1::/48:
 * blocked by every policy. The local-use prefix can carry its IPv4 at any RFC 6052 offset, so it is not decoded.
 */
function isReservedIPv6(ip: string): boolean {
  const h = ipv6Hextets(ip);
  if (!h) return false;
  if (h.slice(0, 7).every((g) => g === 0) && h[7] <= 1) return true;
  if (h[0] === 0x64 && h[1] === 0xff9b && h[2] === 1) return true;
  return (h[0] & 0xffc0) === 0xfe80 || (h[0] & 0xffc0) === 0xfec0 || (h[0] & 0xff00) === 0xff00;
}

/**
 * The IPv4 address an IPv6 address carries, so it can be classified like that IPv4: IPv4-mapped ::ffff:0:0/96,
 * SIIT ::ffff:0:0:0/96, IPv4-compatible ::/96 (not :: or ::1), NAT64 64:ff9b::/96, 6to4 2002::/16,
 * Teredo 2001::/32 (client address, bit-inverted). Null when there is none.
 */
function embeddedIPv4(ip: string): string | null {
  const h = ipv6Hextets(ip);
  if (!h) return null;
  const dotted = (hi: number, lo: number) => `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;
  const zeroUpTo = (n: number) => h.slice(0, n).every((g) => g === 0);
  if (zeroUpTo(5) && h[5] === 0xffff) return dotted(h[6], h[7]);
  if (zeroUpTo(4) && h[4] === 0xffff && h[5] === 0) return dotted(h[6], h[7]);
  if (zeroUpTo(6) && (h[6] !== 0 || h[7] > 1)) return dotted(h[6], h[7]);
  if (h[0] === 0x64 && h[1] === 0xff9b && h.slice(2, 6).every((g) => g === 0)) return dotted(h[6], h[7]);
  if (h[0] === 0x2002) return dotted(h[1], h[2]);
  if (h[0] === 0x2001 && h[1] === 0) return dotted(h[6] ^ 0xffff, h[7] ^ 0xffff);
  return null;
}
// End of the shared IPv6 helpers.

/**
 * Check if an IPv6 address is private/internal
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // Unspecified, loopback, link-local, site-local, multicast
  if (isReservedIPv6(normalized)) {
    return true;
  }

  // Unique local addresses: fc00::/7 (fd00::/8 and fc00::/8)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  // IPv4 carried inside the address (mapped, NAT64, 6to4, ...): classify it as that IPv4
  const ipv4 = embeddedIPv4(normalized);
  return ipv4 !== null && isPrivateIP(ipv4);
}

/**
 * Checks if an IP is a dangerous private/reserved address that must always be blocked,
 * even on self-hosted deployments where allowPrivateNetworks=true.
 *
 * Unlike isPrivateIP(), this does NOT block RFC1918 ranges (10.x, 172.16.x, 192.168.x)
 * because self-hosted customers legitimately access internal services at those addresses.
 *
 * Always blocked: loopback, link-local/cloud metadata (169.254.x.x), CGNAT, unspecified,
 *                 multicast, reserved, broadcast.
 * NOT blocked:    10.x/8, 172.16.x/12, 192.168.x/16 (RFC1918 private networks).
 */
export function isDangerousPrivateIP(ip: string): boolean {
  if (!ip) return false;

  const normalizedIP = normalizeIPFormat(ip);

  if (isCloudMetadataEndpoint(normalizedIP)) return true;

  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = normalizedIP.match(ipv4Regex);

  if (!match) {
    if (normalizedIP.includes(':')) return isDangerousPrivateIPv6(normalizedIP);
    return false;
  }

  const octets = match.slice(1, 5).map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return false;

  const [a, b, c, d] = octets;

  if (a === 127) return true; // Loopback 127.0.0.0/8
  if (a === 169 && b === 254) return true; // Link-local / cloud metadata
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a === 0) return true; // Unspecified 0.0.0.0/8
  if (a === 255 && b === 255 && c === 255 && d === 255) return true; // Broadcast
  if (a >= 224 && a <= 239) return true; // Multicast 224.0.0.0/4
  if (a >= 240) return true; // Reserved 240.0.0.0/4

  // RFC1918 (10.x, 172.16.x, 192.168.x) intentionally NOT blocked here —
  // those are legitimate on self-hosted private networks.
  return false;
}

function isDangerousPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  if (isReservedIPv6(normalized)) return true; // Unspecified, loopback, link-local, site-local, multicast

  // fc/fd (ULA) ranges are NOT blocked — legitimate private IPv6 on self-hosted networks.

  // IPv4 carried inside the address: same verdict as that IPv4 (so ::ffff:10.0.0.1 is allowed like 10.0.0.1)
  const ipv4 = embeddedIPv4(normalized);
  return ipv4 !== null && isDangerousPrivateIP(ipv4);
}

/**
 * Check if a hostname resolves to any private IP address
 * This includes all RFC1918, link-local, loopback, and cloud metadata ranges
 */
export async function resolvesToPrivateIP(hostname: string, config?: SSRFProtectionOptions): Promise<boolean> {
  // Raw IPs don't need DNS resolution — isPrivateIP() already checked them in the caller.
  // dns.resolve4/resolve6 cannot handle raw IP addresses and would throw, causing
  // the fail-closed path to incorrectly block legitimate public IPs like 130.131.160.149.
  if (net.isIP(hostname)) {
    return false;
  }

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

    // Fail-closed: if DNS returns no addresses we cannot verify the destination
    // is safe, so block it rather than allowing the request through.
    if (addresses.length === 0) {
      console.warn(`DNS resolution returned no addresses for ${hostname}, blocking as precaution`);
      return true;
    }

    // Check if any resolved address is a private IP.
    // On self-hosted (allowPrivateNetworks=true) only block dangerous ranges
    // (metadata, loopback) — not RFC1918, which are legitimate internal services.
    const ipCheckFn = config?.allowPrivateNetworks ? isDangerousPrivateIP : isPrivateIP;
    return addresses.some((addr) => ipCheckFn(addr) && !(config && isInAllowedRanges(addr, config)));
  } catch (error) {
    // Fail-closed here too: a resolver error is exactly as unverifiable as an
    // empty answer above, and shouldn't be treated as "safe" (was previously
    // `return false`, the opposite of the empty-address case's intentional
    // fail-closed default — part of GHSA-9gjw-8vc2-fjcv).
    console.warn(`DNS resolution error for ${hostname}, blocking as precaution:`, error.message);
    return true;
  }
}

/**
 * Main SSRF validation function
 * Validates a URL against SSRF protection rules
 *
 * This function is called for:
 * - Initial request URLs (before making the request)
 * - Redirect URLs (via beforeRedirect hook in getSSRFProtectionOptions)
 *
 * Validation checks:
 * - URL scheme blocking (file://, ftp://, etc. if configured)
 * - Private IP address blocking (RFC1918, loopback, link-local, cloud metadata)
 * - URL credentials abuse prevention (e.g., http://169.254.169.254@example.com)
 * - DNS rebinding protection (disabled via SSRF_DNS_RESOLUTION_CHECK=false)
 *
 * @param urlString - The URL to validate
 * @param options - Optional SSRF protection configuration
 * @throws QueryError if URL fails validation
 */
export async function validateUrlForSSRF(urlString: string, options?: SSRFProtectionOptions): Promise<void> {
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
    throw new QueryError('Invalid URL format', 'The provided URL is malformed and cannot be processed', {});
  }

  const { hostname, address } = urlHosts(url);
  const scheme = url.protocol;

  // Under the EE runtime config an allowlist entry vouches for an address, never for a
  // dangerous scheme. Without it (CE/Cloud) the order below is unchanged.
  if (hasRuntimeConfig()) {
    throwIfSchemeBlocked(scheme, config);
  }

  // Allowlisted hostnames / IPs (the CE/EE default loopback names, or the EE runtime allowlist)
  // bypass all checks below.
  if ((config.allowedHostnames?.size > 0 && config.allowedHostnames.has(hostname)) || isInAllowedRanges(hostname, config)) {
    return;
  }

  // Check for @ symbol abuse (credentials in URL pointing to private IPs)
  // e.g., http://169.254.169.254@example.com - should parse as connecting to 169.254.169.254
  if (url.username || url.password) {
    // If URL contains credentials, check if they look like an IP
    const potentialIP = url.username || '';
    if (isPrivateIP(potentialIP)) {
      throw new QueryError(
        'Private IP in URL credentials blocked',
        'URL contains private IP address in credentials section which could be used for SSRF',
        { hostname, credentials: potentialIP }
      );
    }
  }

  // 1. Static hostname blocklist — defense-in-depth before any DNS resolution
  if (isBlockedHostname(hostname)) {
    throw new QueryError('Hostname blocked', 'This hostname is not allowed for security reasons', { hostname });
  }

  // 2. Check for blocked schemes
  if (config.blockedSchemes && config.blockedSchemes.length > 0) {
    if (isSchemeBlocked(scheme, config.blockedSchemes)) {
      throw new QueryError(
        'URL scheme blocked',
        `The URL scheme '${scheme}' is not allowed. Blocked schemes: ${config.blockedSchemes.join(', ')}`,
        { scheme, blockedSchemes: config.blockedSchemes }
      );
    }
  }

  // 3. Check if hostname is a private IP address.
  // On self-hosted (allowPrivateNetworks=true) only block dangerous ranges
  // (metadata endpoints, loopback) — RFC1918 is allowed for internal services.
  const ipCheckFn = config.allowPrivateNetworks ? isDangerousPrivateIP : isPrivateIP;
  if (ipCheckFn(address)) {
    throw new QueryError(
      'Private IP address blocked',
      'Direct access to private IP addresses is not allowed for security reasons',
      { hostname }
    );
  }

  // 4. DNS resolution check — catches rebinding services not caught by static list
  if (config.dnsResolutionCheck) {
    const resolves = await resolvesToPrivateIP(hostname, config);
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
 * This prevents SSRF via DNS rebinding by:
 * 1. Validating the resolved IP before connection
 * 2. Caching the resolution to prevent TOCTOU attacks
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

  // DNS resolution cache to prevent TOCTOU rebinding attacks
  // Key: hostname (prefixed by request shape), Value: { address, family, timestamp }
  // For options.all requests, address holds the validated array and family is undefined.
  const dnsCache = new Map<string, { address: any; family?: number; timestamp: number }>();
  const CACHE_TTL = 60000; // 60 seconds

  // Return custom lookup function
  return (
    hostname: string,
    options: any,
    callback: (err: NodeJS.ErrnoException | null, address?: any, family?: number) => void
  ) => {
    // Check cache first to prevent DNS rebinding between validation and connection
    // (separate keys so an all:true request never gets a single-address entry or vice versa)
    const cacheKey = `${options?.all ? 'all' : 'one'}:${hostname}`;
    const cached = dnsCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL) {
      // Use cached resolution to prevent TOCTOU
      return callback(null, cached.address, cached.family);
    }

    // Use Node's callback-based dns.lookup
    dnsLookup(hostname, options, (err, address: any, family) => {
      if (err) {
        return callback(err);
      }

      // With options.all (Node 22 autoSelectFamily) the result is an array of { address, family }
      const resolved: string[] = options?.all ? address.map((a: any) => a.address) : [address];

      // Respect the allowlist — if the hostname is explicitly allowed (e.g. localhost
      // on self-hosted), skip the private IP check so the connection proceeds.
      // On self-hosted (allowPrivateNetworks=true) only block dangerous ranges.
      const hostAllowed = config.allowedHostnames?.has(hostname.toLowerCase());
      const ipCheckFn = config.allowPrivateNetworks ? isDangerousPrivateIP : isPrivateIP;
      const blocked = hostAllowed
        ? undefined
        : resolved.find((addr) => !isInAllowedRanges(addr, config) && ipCheckFn(addr));
      if (blocked !== undefined) {
        const error: any = new Error(
          `Hostname "${hostname}" resolves to private IP address "${blocked}" which is blocked for security reasons`
        );
        error.code = 'SSRF_BLOCKED';
        error.hostname = hostname;
        error.address = blocked;
        return callback(error);
      }

      // Cache the validated resolution to prevent TOCTOU attacks
      dnsCache.set(cacheKey, { address, family, timestamp: now });

      // Clean up old cache entries to prevent memory leak
      if (dnsCache.size > 1000) {
        dnsCache.forEach((value, key) => {
          if (now - value.timestamp > CACHE_TTL) {
            dnsCache.delete(key);
          }
        });
      }

      // IP is safe, proceed with connection
      callback(null, address, family);
    });
  };
}

/**
 * Gets got request options with SSRF protection enabled
 *
 * This includes:
 * - Custom DNS lookup to validate resolved IPs before connection
 * - Redirect validation to prevent SSRF bypass via open redirects
 *
 * ## Redirect Protection
 *
 * The function implements a `beforeRedirect` hook that validates each redirect URL
 * before following it. This prevents attackers from bypassing SSRF filters using
 * open redirect vulnerabilities in allowed domains.
 *
 * **Attack scenario prevented:**
 * ```
 * // Attacker provides URL that passes initial validation:
 * http://allowed-domain.com/redirect?target=http://169.254.169.254
 *
 * // allowed-domain.com has open redirect vulnerability, responds with:
 * Location: http://169.254.169.254
 *
 * // beforeRedirect hook intercepts and validates redirect URL
 * // Validation fails (cloud metadata endpoint) and blocks the redirect
 * ```
 *
 * **Validation applied to redirects:**
 * - Private IP blocking (RFC1918, loopback, link-local)
 * - Cloud metadata endpoint blocking (AWS, GCP, Azure, etc.)
 * - Dangerous scheme blocking (if configured)
 * - DNS rebinding protection (if enabled)
 *
 * **Redirect behavior:**
 * - Allows redirects by default (got's default: maxRedirects = 10)
 * - Each redirect URL is validated before following
 * - Blocked redirects throw QueryError with details
 * - Merges with existing beforeRedirect hooks if present
 *
 * @param options - SSRF protection configuration (uses env vars if not provided)
 * @param existingOptions - Existing got options to merge with
 * @returns Got options object with SSRF protection configured
 */
export function getSSRFProtectionOptions(options?: SSRFProtectionOptions, existingOptions?: any): any {
  const config = options || getSSRFConfig();

  // If SSRF protection is disabled, return existing options unchanged
  if (!config.enabled) {
    return existingOptions || {};
  }

  const ssrfOptions: any = {
    ...existingOptions,
    // Custom DNS lookup function to validate resolved IPs.
    // got's option is `lookup` (see CacheableLookup['lookup'] in its types) — NOT
    // `dnsLookup`. That key doesn't exist on got's Options type, so got silently
    // ignored it and this resolver was never actually invoked (GHSA-9gjw-8vc2-fjcv).
    lookup: createSSRFSafeLookup(config),
  };

  // Redirect validation hook - prevents SSRF bypass via open redirects
  // This validates redirect URLs using the same SSRF rules as the initial request,
  // blocking attacks where an allowed domain redirects to a private IP/endpoint
  const beforeRedirectHook = async (options: any, response: any) => {
    // Validate the resolved target: got has already resolved a relative Location against the
    // request URL (options.url). The raw header may be "/next", which is not a parseable URL.
    let redirectUrl: string | undefined = options?.url?.toString();
    if (!redirectUrl && response?.headers?.location) {
      try {
        redirectUrl = new URL(response.headers.location, response.url).toString();
      } catch {
        redirectUrl = response.headers.location;
      }
    }
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
  };

  // Properly merge hooks
  if (existingOptions?.hooks) {
    ssrfOptions.hooks = {
      ...existingOptions.hooks,
      beforeRedirect: [...(existingOptions.hooks.beforeRedirect || []), beforeRedirectHook],
    };
  } else {
    ssrfOptions.hooks = {
      beforeRedirect: [beforeRedirectHook],
    };
  }

  return ssrfOptions;
}

/**
 * Example: SSRF protection with redirect validation
 *
 * Usage in plugin:
 * ```typescript
 * const finalOptions = getSSRFProtectionOptions(undefined, requestOptions);
 * const response = await got(url, finalOptions);
 * ```
 *
 * Behavior:
 * - If url redirects to private IP, beforeRedirect hook blocks it
 * - Example blocked redirect: http://allowed.com/redirect -> http://169.254.169.254
 * - Error thrown: "Redirect blocked by SSRF protection"
 */

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
    throw new QueryError('Invalid URL format', 'The provided URL is malformed and cannot be processed', {});
  }

  const { hostname, address } = urlHosts(url);
  const scheme = url.protocol;

  if (hasRuntimeConfig()) {
    throwIfSchemeBlocked(scheme, config);
  }

  if ((config.allowedHostnames?.size > 0 && config.allowedHostnames.has(hostname)) || isInAllowedRanges(hostname, config)) {
    return;
  }

  if (isBlockedHostname(hostname)) {
    throw new QueryError('Hostname blocked', 'This hostname is not allowed for security reasons', { hostname });
  }

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

  // Check if hostname is a private IP.
  // On self-hosted (allowPrivateNetworks=true) only block dangerous ranges.
  const ipCheckFnSync = config.allowPrivateNetworks ? isDangerousPrivateIP : isPrivateIP;
  if (ipCheckFnSync(address)) {
    throw new QueryError(
      'Private IP address blocked',
      'Direct access to private IP addresses is not allowed for security reasons',
      { hostname }
    );
  }
}
