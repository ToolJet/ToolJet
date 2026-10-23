import * as net from 'net';
import type { SSRFRuntimeConfig } from './ssrf-protection.helper';

// Underscores are allowed inside a label (Docker Compose service names such as `my_service`), not at either end.
const HOSTNAME_LABEL = /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/;

function isValidHostname(host: string): boolean {
  if (host.length === 0 || host.length > 253) return false;
  return host.split('.').every((label) => label.length >= 1 && label.length <= 63 && HOSTNAME_LABEL.test(label));
}

/**
 * Returns the trimmed, lowercased entry if it is a valid IP, `ip/prefix` (1-32 v4, 1-128 v6; /0 rejected)
 * or hostname; otherwise null.
 */
export function normalizeSSRFAllowlistEntry(entry: string): string | null {
  if (typeof entry !== 'string') return null;
  const value = entry.trim().toLowerCase();
  if (!value) return null;

  if (net.isIP(value)) return value;

  if (value.includes('/')) {
    const [ip, prefix, ...rest] = value.split('/');
    const family = net.isIP(ip);
    if (rest.length || !family || !/^\d{1,3}$/.test(prefix)) return null;
    const bits = Number(prefix);
    return bits >= 1 && bits <= (family === 6 ? 128 : 32) ? value : null;
  }

  return isValidHostname(value) ? value : null;
}

/** Builds the runtime config published for the SSRF checks. Invalid entries are skipped. */
export function buildSSRFRuntimeConfig(enabled: boolean, entries: string[]): SSRFRuntimeConfig {
  const allowedHostnames = new Set<string>();
  const allowedRanges = new net.BlockList();

  for (const raw of entries) {
    const entry = normalizeSSRFAllowlistEntry(raw);
    if (!entry) continue;

    if (entry.includes('/')) {
      const [ip, prefix] = entry.split('/');
      allowedRanges.addSubnet(ip, Number(prefix), net.isIP(ip) === 6 ? 'ipv6' : 'ipv4');
    } else if (net.isIP(entry)) {
      allowedRanges.addAddress(entry, net.isIP(entry) === 6 ? 'ipv6' : 'ipv4');
    } else {
      allowedHostnames.add(entry);
    }
  }

  return { enabled, allowedHostnames, allowedRanges };
}
