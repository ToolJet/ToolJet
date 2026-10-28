import { URL } from 'url';
import * as dns from 'dns/promises';
import { lookup as dnsLookup, LookupAddress, LookupAllOptions, LookupOneOptions } from 'dns';
import * as net from 'net';
import { BadRequestException } from '@nestjs/common';
import type { Options as GotOptions } from 'got';
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
 * createSSRFSafeLookup() is the connect-time half: pass it as got's `lookup` so
 * the address actually dialled is re-checked (closes the DNS-rebinding window
 * between validateUrlForSSRF's resolve and got's own resolve).
 *
 * ponytail: DNS-rebinding-as-a-service hostnames (nip.io, sslip.io, ...) from the
 * plugin version are not ported; the connect-time lookup covers what they resolve to.
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
 * Loopback, link-local/cloud metadata, CGNAT, unspecified, multicast, reserved.
 * RFC1918 and fc00::/7 too, only when the EE runtime config is present or on Cloud.
 */
function isDangerousPrivateIP(ip: string): boolean {
  if (isCloudMetadataEndpoint(ip)) return true;
  const blockRFC1918 = !!getRuntimeConfig() || getTooljetEdition() === 'cloud';

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
  if (isReservedIPv6(normalized)) return true; // unspecified, loopback, link-local, site-local, multicast
  if (blockRFC1918 && /^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // unique local fc00::/7
  // IPv4 carried inside the address (mapped, NAT64, 6to4, ...): same verdict as that IPv4
  const ipv4 = embeddedIPv4(normalized);
  return ipv4 !== null && isDangerousPrivateIP(ipv4);
}

// Shared host resolution and block messages (keep identical in all three SSRF copies).
/**
 * Every address a hostname resolves to. dns.resolve4/resolve6 query DNS servers only and never see /etc/hosts, so
 * under the EE runtime config, when they return nothing, dns.lookup (which reads the hosts file) is asked as well.
 * With no addresses, `failure` is the resolver's own error (e.g. "getaddrinfo ENOTFOUND host") for the block message.
 */
async function resolveHostAddresses(hostname: string): Promise<{ addresses: string[]; failure?: string }> {
  const addresses: string[] = [];
  let failure: string | undefined;
  const collect = (answer: Promise<string[]>) =>
    answer.then(
      (found) => {
        addresses.push(...found);
      },
      (error) => {
        failure = failure || (error as Error)?.message;
      }
    );
  await Promise.all([collect(dns.resolve4(hostname)), collect(dns.resolve6(hostname))]);
  const runtimeKey = '__TOOLJET_SSRF_RUNTIME_CONFIG__';
  if (addresses.length > 0 || !(globalThis as unknown as Record<string, unknown>)[runtimeKey]) {
    return { addresses, failure };
  }
  try {
    const answers = await dns.lookup(hostname, { all: true });
    return { addresses: answers.map((answer) => answer.address), failure };
  } catch (error) {
    return { addresses: [], failure: (error as Error)?.message || failure };
  }
}

/** The reason for a host that resolved to nothing, carrying the resolver's error when there is one. */
function unresolvedReason(failure?: string): string {
  return failure ? `could not be resolved (${failure})` : 'could not be resolved';
}

/**
 * The error text for a blocked request: the host, why (`reason` finishes "because it ..."), and, under the EE runtime
 * config, where a super admin can allow it. Cloud and CE have no settings page for it, so they get no hint.
 */
function privateNetworkBlockedMessage(host: string, reason: string): string {
  const runtimeKey = '__TOOLJET_SSRF_RUNTIME_CONFIG__';
  const hint = (globalThis as unknown as Record<string, unknown>)[runtimeKey]
    ? ' A super admin can allow it in Settings → Security → Outbound requests.'
    : '';
  return `Requests to ${host} are blocked because it ${reason}.${hint}`;
}
// End of the shared host resolution and block messages.

/** Why a hostname must be blocked (finishing "because it ..."), or null when every address it resolves to is safe. */
async function hostnameBlockReason(hostname: string): Promise<string | null> {
  if (net.isIP(hostname)) return null; // raw IPs are checked by the caller before DNS

  const { addresses, failure } = await resolveHostAddresses(hostname);

  // Fail closed: an unresolvable host can't be verified safe.
  if (addresses.length === 0) return unresolvedReason(failure);

  const runtime = getRuntimeConfig();
  const blocked = addresses.find((addr) => isDangerousPrivateIP(addr) && !isAllowlisted(addr, runtime));
  return blocked === undefined ? null : `resolves to a private network address (${blocked})`;
}

/**
 * Validates a user-supplied URL is safe to send a server-side request to.
 * Throws BadRequestException if the URL is malformed, uses a disallowed
 * scheme, or points at a loopback/link-local/cloud-metadata address.
 *
 * With the EE runtime config: its `enabled` flag and allowlist decide, and RFC1918 is blocked too.
 * Without it: on by default on CE (opt out via SSRF_PROTECTION_ENABLED=false), opt in on EE, always
 * on for Cloud; RFC1918 is blocked only on Cloud.
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

  // `new URL()` keeps the brackets on IPv6 literals ([::1]); the IP check needs the bare address.
  const address = hostname.replace(/^\[|\]$/g, '');
  const isRawIP = net.isIP(address) !== 0;

  if (isRawIP && isDangerousPrivateIP(address)) {
    throw new BadRequestException(privateNetworkBlockedMessage(address, 'is a private network address'));
  }

  // Under the runtime key and on Cloud an IP literal is decided by the check above. Elsewhere a bracketed
  // IPv6 literal still goes to the DNS step (which fails closed on it), as before.
  const literalDecided = isRawIP && (!!runtime || getTooljetEdition() === 'cloud');
  const reason = literalDecided ? null : await hostnameBlockReason(hostname);
  if (reason) throw new BadRequestException(privateNetworkBlockedMessage(hostname, reason));
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

type LookupCallback = (err: NodeJS.ErrnoException | null, address?: string | LookupAddress[], family?: number) => void;

/**
 * A `lookup` for got/http that re-validates every resolved address at connect time with the same
 * predicate, allowlist and edition policy as validateUrlForSSRF. Handles `options.all` (Node 22's
 * autoSelectFamily asks for an array). Undefined when protection is off, so got uses the default lookup.
 * Accepts every dns.lookup call shape; typed as got's `lookup` option (got 11's typing rejects dns.lookup itself).
 */
export function createSSRFSafeLookup(): GotOptions['lookup'] | undefined {
  if (!isSSRFProtectionEnabled()) return undefined;

  const safeLookup = (
    hostname: string,
    optionsOrCallback: number | LookupOneOptions | LookupAllOptions | LookupCallback,
    maybeCallback?: LookupCallback
  ) => {
    const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
    const options: LookupOneOptions | LookupAllOptions =
      typeof optionsOrCallback === 'number'
        ? { family: optionsOrCallback }
        : typeof optionsOrCallback === 'function'
          ? {}
          : optionsOrCallback || {};

    const runtime = getRuntimeConfig();
    const host = hostname.toLowerCase();
    // Same hostname-level exemptions as validateUrlForSSRF, so the two never disagree.
    const hostExempt =
      isAllowlisted(host, runtime) ||
      (!runtime && getTooljetEdition() !== 'cloud' && LOOPBACK_HOSTNAME_ALLOWLIST.has(host));

    dnsLookup(hostname, options as LookupAllOptions, (err, address: string | LookupAddress[], family?: number) => {
      if (err) return callback(err);

      const resolved = Array.isArray(address) ? address.map((a) => a.address) : [address];
      const blocked = hostExempt
        ? undefined
        : resolved.find((addr) => isDangerousPrivateIP(addr) && !isAllowlisted(addr, runtime));

      if (blocked !== undefined) {
        const error = new Error(
          privateNetworkBlockedMessage(hostname, `resolves to a private network address (${blocked})`)
        ) as NodeJS.ErrnoException & { address?: string; hostname?: string };
        error.code = 'SSRF_BLOCKED';
        error.hostname = hostname;
        error.address = blocked;
        return callback(error);
      }

      return Array.isArray(address) ? callback(null, address) : callback(null, address, family);
    });
  };
  return safeLookup as unknown as GotOptions['lookup'];
}
