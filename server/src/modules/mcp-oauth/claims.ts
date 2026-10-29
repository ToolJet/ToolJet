import { DELEGATION_AUDIENCE, VIEWER_AUDIENCE } from './protocol';

/** Shared by the signer and validator; these credentials never carry a browser session. */
export interface DelegationIdentity {
  sub: string;
  oauthGrantId: string;
  oauthTokenId: string;
}
export interface ViewerIdentity extends DelegationIdentity {
  oauthAppId: string;
}
interface CredentialClaims extends DelegationIdentity {
  iss: string;
  aud: string;
  exp: number;
}
export interface DelegationClaims extends CredentialClaims {
  aud: typeof DELEGATION_AUDIENCE;
}
export interface ViewerClaims extends CredentialClaims, ViewerIdentity {
  aud: typeof VIEWER_AUDIENCE;
}

function hasCredentialClaims(value: unknown): value is CredentialClaims {
  if (!value || typeof value !== 'object') return false;
  const claims = value as Record<string, unknown>;
  return ['iss', 'aud', 'sub', 'oauthGrantId', 'oauthTokenId'].every(
    (key) => typeof claims[key] === 'string' && claims[key].length > 0,
  ) && typeof claims.exp === 'number' && Number.isInteger(claims.exp);
}
export function isDelegationClaims(value: unknown): value is DelegationClaims {
  return hasCredentialClaims(value) && value.aud === DELEGATION_AUDIENCE;
}
export function isViewerClaims(value: unknown): value is ViewerClaims {
  return hasCredentialClaims(value) && value.aud === VIEWER_AUDIENCE &&
    'oauthAppId' in value && typeof value.oauthAppId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.oauthAppId);
}
