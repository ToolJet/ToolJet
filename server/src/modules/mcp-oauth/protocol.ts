import { PAT_ALLOWED_BUNDLES } from '@modules/personal-access-tokens/constants/scopes';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import * as basicAuth from 'basic-auth';

export const OAUTH_SCOPES = [...PAT_ALLOWED_BUNDLES];
export const DEFAULT_SCOPES = [...PAT_ALLOWED_BUNDLES];
export const ACCESS_SECONDS = 600;
export const REFRESH_SECONDS = 7 * 24 * 60 * 60;
export const GRANT_SECONDS = 30 * 24 * 60 * 60;
export const CODE_SECONDS = 120;
export const INTERACTION_SECONDS = 600;
export const DELEGATION_AUDIENCE = 'tooljet:mcp:delegation';
export const VIEWER_AUDIENCE = 'tooljet:mcp:viewer';
export const VIEWER_SECONDS = 120;
export const CLIENT_AUTH_METHODS = ['none', 'client_secret_basic', 'client_secret_post'] as const;
export type ClientAuthMethod = (typeof CLIENT_AUTH_METHODS)[number];

export class OAuthFailure extends Error {
  constructor(
    public readonly error: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}
export class OAuthRedirectFailure extends OAuthFailure {
  constructor(
    error: OAuthFailure,
    readonly redirectUrl: string
  ) {
    super(error.error, error.message, error.status);
  }
}
/** Carries only a database grant ID so callers can persist revocation after a failed transaction. */
export class RejectedOAuthGrant extends OAuthFailure {
  constructor(
    readonly grantId: string,
    message: string
  ) {
    super('invalid_grant', message);
  }
}
export function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
export function secret(prefix = ''): string {
  return prefix + randomBytes(32).toString('base64url');
}
export function equalSecret(a: string, b: string): boolean {
  return typeof a === 'string' && typeof b === 'string' && timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
}
export function stringParam(value: unknown, name: string, optional = false): string | undefined {
  if (optional && value === undefined) return undefined;
  if (typeof value !== 'string' || !value.length || value.length > 4096) {
    throw new OAuthFailure('invalid_request', `Invalid ${name}`);
  }
  return value;
}
/** Keep authentication transport unambiguous; OAuth Basic fields are form-encoded before Base64. */
export function clientAuthentication(
  body: Record<string, unknown>,
  authorization?: string
): {
  method: ClientAuthMethod;
  clientId: string;
  clientSecret?: string;
} {
  if (authorization !== undefined) {
    if (body.client_id !== undefined || body.client_secret !== undefined)
      throw new OAuthFailure('invalid_request', 'Use one client authentication method');
    try {
      const parsed = basicAuth.parse(authorization);
      if (!parsed) throw new Error();
      const decode = (value: string) => decodeURIComponent(value.replace(/\+/g, ' '));
      return {
        method: 'client_secret_basic',
        clientId: stringParam(decode(parsed.name), 'client_id'),
        clientSecret: stringParam(decode(parsed.pass), 'client_secret'),
      };
    } catch {
      throw new OAuthFailure('invalid_client', 'Invalid client authentication', 401);
    }
  }
  return {
    method: body.client_secret === undefined ? 'none' : 'client_secret_post',
    clientId: stringParam(body.client_id, 'client_id'),
    clientSecret: stringParam(body.client_secret, 'client_secret', true),
  };
}
export function scopesParam(value?: unknown): string[] {
  const scopes = value === undefined ? DEFAULT_SCOPES : stringParam(value, 'scope').split(' ');
  if (!scopes.length || scopes.some((scope) => !OAUTH_SCOPES.includes(scope as any))) {
    throw new OAuthFailure('invalid_scope', 'Unsupported scope');
  }
  return [...new Set(scopes)];
}
/** HTTPS on real hosts; HTTP only on an explicit loopback address for local development. */
export function trustedUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new OAuthFailure('invalid_request', 'Invalid URL');
  }
  const loopback = ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.hash ||
    (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:'))
  ) {
    throw new OAuthFailure('invalid_request', 'HTTPS is required (HTTP is allowed only on loopback)');
  }
  return url;
}
/** Cursor's native callback is allowed only as this exact redirect, never as an issuer or resource. */
function validateRedirectUrl(value: string): void {
  if (value !== 'cursor://anysphere.cursor-mcp/oauth/callback') trustedUrl(value);
}
export function validateRedirects(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) {
    throw new OAuthFailure('invalid_client_metadata', 'Provide between 1 and 10 redirect URIs');
  }
  return [
    ...new Set(
      value.map((entry) => {
        const uri = stringParam(entry, 'redirect_uri');
        validateRedirectUrl(uri);
        if (uri.includes('*')) throw new OAuthFailure('invalid_client_metadata', 'Wildcard redirects are not allowed');
        return uri;
      })
    ),
  ];
}

/** Native HTTP loopback clients may choose a new port for each authorization.
 * Compare every other URI byte exactly; never apply this exception to remote hosts.
 * localhost is included for Claude Code compatibility alongside RFC 8252 IP literals.
 */
export function matchesRedirectUri(requested: string, registered: string): boolean {
  try {
    validateRedirectUrl(requested);
    validateRedirectUrl(registered);
  } catch {
    return false;
  }
  if (requested === registered) return true;
  const loopbackAuthority = /^(http:\/\/(?:127\.0\.0\.1|\[::1\]|localhost))(?::[0-9]+)?(?=[/?]|$)/;
  if (!loopbackAuthority.test(requested) || !loopbackAuthority.test(registered)) return false;
  return requested.replace(loopbackAuthority, '$1') === registered.replace(loopbackAuthority, '$1');
}

export function canonicalJson(value: any): string {
  const ordered = (item: any): any =>
    Array.isArray(item)
      ? item.map(ordered)
      : item && typeof item === 'object'
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, ordered(item[key])])
          )
        : item;
  return JSON.stringify(ordered(value));
}

/** Signed evidence of a completed ToolJet workspace login, never inferred from an old session. */
export interface WorkspaceAuthentication {
  organizationId: string;
  method: string;
  providerId: string | null;
  verifiedAt: number;
  policyFingerprint: string;
}
