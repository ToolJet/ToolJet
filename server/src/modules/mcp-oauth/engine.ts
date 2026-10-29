import * as OAuth2Server from '@node-oauth/oauth2-server';
import { OAuthStore, OAuthArtifactKind } from './store';
import { ACCESS_SECONDS, CODE_SECONDS, REFRESH_SECONDS, OAuthFailure, secret, matchesRedirectUri } from './protocol';

/** A fresh model per transaction; no user, client or grant is held in singleton state. */
export function createOAuthEngine(
  store: OAuthStore,
  resource: string,
  tokenClient?: NonNullable<Awaited<ReturnType<OAuthStore['client']>>>
): OAuth2Server {
  const load = async (raw: string, kind: OAuthArtifactKind): Promise<any> => {
    const artifact = await store.artifact(raw, kind);
    if (!artifact || artifact.consumed_at || artifact.expires_at <= new Date()) return false;
    const grant = await store.activeGrant(artifact.grant_id);
    if (grant.resource !== resource)
      throw new OAuthFailure('invalid_target', 'Resource does not match this connection');
    return {
      ...artifact.payload,
      artifactId: artifact.id,
      client: { id: grant.client_id },
      user: { id: grant.user_id, grantId: grant.id },
      ...(kind === 'code'
        ? { authorizationCode: raw, expiresAt: artifact.expires_at }
        : { refreshToken: raw, refreshTokenExpiresAt: artifact.expires_at }),
    };
  };
  return new OAuth2Server({
    accessTokenLifetime: ACCESS_SECONDS,
    refreshTokenLifetime: REFRESH_SECONDS,
    authorizationCodeLifetime: CODE_SECONDS,
    requireClientAuthentication: { authorization_code: false, refresh_token: false },
    // The wrapper also requires an S256 challenge. Older library versions must not weaken it.
    model: {
      // Access validation is performed by the resource-bound exchange, never by engine.authenticate().
      getAccessToken: async () => false,
      // Browser authorization has no client secret. Token calls supply the client already
      // authenticated by the boundary, before any replay or credential-consumption effects.
      getClient: async (id, clientSecret) =>
        tokenClient ? (id === tokenClient.id ? tokenClient : false) : clientSecret ? false : store.client(id),
      validateRedirectUri: async (redirectUri, client) =>
        Array.isArray(client.redirectUris) &&
        client.redirectUris.some((registered) => matchesRedirectUri(redirectUri, registered)),
      generateAccessToken: async () => secret('tj_oauth_at_'),
      generateRefreshToken: async () => secret('tj_oauth_rt_'),
      generateAuthorizationCode: async () => secret('tj_oauth_code_'),
      validateScope: async (user, client, scopes) => {
        const grant = await store.activeGrant(user.grantId);
        return client.id === grant.client_id && scopes?.every((scope) => grant.scopes.includes(scope)) ? scopes : false;
      },
      saveAuthorizationCode: async (code, client, user) => {
        await store.put(
          code.authorizationCode,
          'code',
          client.id,
          user.grantId,
          {
            redirectUri: code.redirectUri,
            scope: code.scope,
            codeChallenge: code.codeChallenge,
            codeChallengeMethod: code.codeChallengeMethod,
          },
          code.expiresAt
        );
        return { ...code, client, user };
      },
      getAuthorizationCode: (raw) => load(raw, 'code'),
      revokeAuthorizationCode: (code) => store.consume(code.artifactId),
      getRefreshToken: (raw) => load(raw, 'refresh'),
      revokeToken: (token) => store.consume(token.artifactId),
      saveToken: async (token, client, user) => {
        const grant = await store.activeGrant(user.grantId);
        const accessExpiry = new Date(Math.min(token.accessTokenExpiresAt.getTime(), grant.expires_at.getTime()));
        const refreshExpiry = new Date(Math.min(token.refreshTokenExpiresAt.getTime(), grant.expires_at.getTime()));
        const payload = { scope: token.scope };
        await store.put(token.accessToken, 'access', client.id, grant.id, payload, accessExpiry);
        await store.put(token.refreshToken, 'refresh', client.id, grant.id, payload, refreshExpiry);
        return {
          ...token,
          accessTokenExpiresAt: accessExpiry,
          refreshTokenExpiresAt: refreshExpiry,
          client,
          user,
        };
      },
    },
  });
}
