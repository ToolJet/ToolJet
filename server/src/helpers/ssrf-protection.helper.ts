import { URL } from 'url';
import * as dns from 'dns/promises';
import * as net from 'net';
import { BadRequestException } from '@nestjs/common';
import { getTooljetEdition } from './utils.helper';

/**
 * Server-core SSRF guard for outbound requests built from user-supplied URLs
 * (e.g. OAuth access_token_url on a data source, or body-controlled options on
 * the test-connection endpoint).
 *
 * Mirrors the policy already enforced on the plugin side
 * (plugins/packages/common/lib/ssrf-protection.ts) so a request behaves the
 * same whether it's issued by a plugin or by server-core — including the
 * edition split: Cloud always enforces this; CE defaults on (opt out); EE follows
 * the admin-managed runtime config when published (on by default), else the env
 * var (opt in). Kept as a smaller, server-local
 * port rather than a cross-package import because server has no build-time
 * dependency on @tooljet-plugins/common.
 *
 * ponytail: DNS-rebinding-as-a-service hostnames (nip.io, sslip.io, ...) and
 * the got-level `lookup` TOCTOU guard from the plugin version are not ported
 * here — these call sites are single request-response exchanges, not a
 * general-purpose HTTP client with redirects. Add them if this helper grows
 * more callers.
 */

const CLOUD_METADATA_ENDPOINTS = [/^169\.254\.169\.25[34]$/, /^metadata\.google\.internal$/i, /^100\.100\.100\.200$/];

const ALLOWED_SCHEMES = ['http:', 'https:'];

// EE publishes its admin-managed SSRF settings on globalThis under this key (see the
// plugin-side copies, which read the same key). When absent (CE/Cloud) behaviour is unchanged.
export const SSRF_RUNTIME_CONFIG_KEY = '__TOOLJET_SSRF_RUNTIME_CONFIG__';

export type SSRFRuntimeConfig = {
  enabled: boolean;
  allowedHostnames: Set<string>;
  allowedRanges: net.BlockList;
};

function getRuntimeConfig(): SSRFRuntimeConfig | undefined {
  return (globalThis as any)[SSRF_RUNTIME_CONFIG_KEY];
}

/** True if the hostname or IP is on the admin allowlist (exact hostname, or an IP inside an allowed IP/CIDR). */
function isAllowlisted(hostOrIp: string, config: SSRFRuntimeConfig | undefined): boolean {
  if (!config || !hostOrIp) return false;
  const host = hostOrIp.toLowerCase().replace(/^\[|\]$/g, '');
  if (config.allowedHostnames?.has(host)) return true;
  const family = net.isIP(host);
  return family !== 0 && !!config.allowedRanges?.check(host, family === 6 ? 'ipv6' : 'ipv4');
}

// Self-hosted (EE/CE) only: hostnames that always mean "this box" and are safe to
// exempt outright, matching the plugin-side allowlist. Not extended to literal
// 127.0.0.1 — same gap the plugin side has, kept for parity rather than guessed at.
const LOOPBACK_HOSTNAME_ALLOWLIST = new Set(['localhost', 'ip6-localhost', 'ip6-loopback']);

function isSSRFProtectionEnabled(): boolean {
  const runtime = getRuntimeConfig();
  if (runtime) return runtime.enabled;
  const edition = getTooljetEdition();
  if (edition === 'cloud') return true; // multi-tenant — not configurable
  if (edition === 'ee') return process.env.SSRF_PROTECTION_ENABLED === 'true'; // off by default: on-prem/air-gapped
  return process.env.SSRF_PROTECTION_ENABLED !== 'false'; // ce: on by default
}

function isCloudMetadataEndpoint(hostname: string): boolean {
  return CLOUD_METADATA_ENDPOINTS.some((pattern) => pattern.test(hostname));
}

/**
 * Loopback, link-local/cloud metadata, CGNAT, unspecified, multicast, reserved.
 * RFC1918 and fc00::/7 too, only when the EE runtime config is present.
 */
function isDangerousPrivateIP(ip: string): boolean {
  if (isCloudMetadataEndpoint(ip)) return true;
  const blockRFC1918 = !!getRuntimeConfig();

  const match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (match) {
    const [a, b, c, d] = match.slice(1).map(Number);
    if ([a, b, c, d].some((o) => o < 0 || o > 255)) return false;
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 0) return true; // unspecified
    if (a === 255 && b === 255 && c === 255 && d === 255) return true; // broadcast
    if (a >= 224 && a <= 239) return true; // multicast
    if (a >= 240) return true; // reserved
    if (blockRFC1918) {
      if (a === 10) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
    }
    return false;
  }

  const normalized = ip.toLowerCase();
  if (normalized === '::1') return true; // loopback
  if (normalized.startsWith('fe80:')) return true; // link-local
  if (blockRFC1918 && /^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // unique local fc00::/7
  return false;
}

async function resolvesToPrivateIP(hostname: string): Promise<boolean> {
  if (net.isIP(hostname)) return false; // raw IPs are checked by the caller before DNS

  const addresses: string[] = [];
  await Promise.all([
    dns
      .resolve4(hostname)
      .then((a) => addresses.push(...a))
      .catch(() => undefined),
    dns
      .resolve6(hostname)
      .then((a) => addresses.push(...a))
      .catch(() => undefined),
  ]);

  // Fail closed: an unresolvable host can't be verified safe.
  if (addresses.length === 0) return true;

  const runtime = getRuntimeConfig();
  return addresses.some((addr) => isDangerousPrivateIP(addr) && !isAllowlisted(addr, runtime));
}

/**
 * Validates a user-supplied URL is safe to send a server-side request to.
 * Throws BadRequestException if the URL is malformed, uses a disallowed
 * scheme, or points at a loopback/link-local/cloud-metadata address.
 *
 * With the EE runtime config: its `enabled` flag and allowlist decide, and RFC1918 is blocked too.
 * Without it: on by default on CE (opt out via SSRF_PROTECTION_ENABLED=false), opt in on EE, always
 * on for Cloud; RFC1918 is not blocked.
 */
export async function validateUrlForSSRF(urlString: string): Promise<void> {
  if (!isSSRFProtectionEnabled()) return;

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new BadRequestException('Invalid URL');
  }

  if (!ALLOWED_SCHEMES.includes(url.protocol)) {
    throw new BadRequestException(`URL scheme '${url.protocol}' is not allowed`);
  }

  const hostname = url.hostname.toLowerCase();

  const runtime = getRuntimeConfig();

  // Allowlisted hostnames / IPs skip every check below
  if (isAllowlisted(hostname, runtime)) return;

  // With a runtime config there is no hardcoded localhost exemption — admins allowlist it explicitly.
  if (!runtime && getTooljetEdition() !== 'cloud' && LOOPBACK_HOSTNAME_ALLOWLIST.has(hostname)) return;

  const isRawIP = net.isIP(hostname) !== 0;

  if (isRawIP && isDangerousPrivateIP(hostname)) {
    throw new BadRequestException('URL points to a blocked private/internal address');
  }

  if (!isRawIP && (await resolvesToPrivateIP(hostname))) {
    throw new BadRequestException('URL resolves to a blocked private/internal address');
  }
}

/**
 * Same check as validateUrlForSSRF, but built from separate host/port/protocol
 * fields instead of a single URL string — the shape most data-source `options`
 * come in (host, port, protocol as three distinct config values). Throws the
 * same way; returns silently if any part is missing (the caller's own
 * required-field validation should catch that separately).
 */
export async function validateHostForSSRF(host: string, protocol?: string): Promise<void> {
  if (!host) return;
  const scheme = protocol ? `${protocol.replace(/:$/, '')}:` : 'https:';
  await validateUrlForSSRF(`${scheme}//${host}`);
}
