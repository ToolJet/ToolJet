/*
 * Express `trust proxy` from the TRUST_PROXY env var, so `req.ip` is the real client behind load
 * balancers (rate limits key on it). Unset keeps Express's default (trust nothing): trusting
 * proxies that aren't there lets any client choose its own IP via X-Forwarded-For.
 *
 *   TRUST_PROXY=1                      trust one hop (a single LB / ingress)
 *   TRUST_PROXY=10.0.0.0/8,loopback    trust these addresses (Express `proxy-addr` syntax)
 *   TRUST_PROXY=true                   trust every hop (only if the edge strips client X-Forwarded-For)
 */
export type TrustProxySetting = boolean | number | string;

export function parseTrustProxy(raw: string | undefined): TrustProxySetting | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const hops = Number(value);
    if (!Number.isInteger(hops) || hops < 0) {
      throw new Error(`TRUST_PROXY must be a whole number of hops, true/false, or addresses; got "${value}"`);
    }
    return hops;
  }
  return value;
}
