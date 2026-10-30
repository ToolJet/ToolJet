import * as http from 'http';
import { AddressInfo } from 'net';
import { createSign, generateKeyPairSync } from 'crypto';

export interface MockOidcClaims {
  sub: string;
  email: string;
  [claim: string]: unknown;
}

export interface MockOidcIdp {
  wellKnownUrl: string;
  clientId: string;
  /** Claims the next login returns from userinfo and the ID token. */
  setClaims(claims: MockOidcClaims): void;
  /** `undefined` publishes no scopes_supported, like an IdP that leaves it out. */
  setScopesSupported(scopes: string[] | undefined): void;
  close(): Promise<void>;
}

const base64url = (input: Buffer | string) => Buffer.from(input).toString('base64url');

/** Minimal OIDC IdP for driving the real discovery, token and userinfo calls of a login. */
export async function startMockOidcIdp(): Promise<MockOidcIdp> {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'mock-key', alg: 'RS256', use: 'sig' };
  const clientId = 'mock-client';
  let claims: MockOidcClaims = { sub: 'mock-sub', email: 'mock@example.com' };
  let scopesSupported: string[] | undefined = ['openid', 'email', 'profile', 'offline_access'];
  let issuer = '';

  const signIdToken = () => {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', kid: 'mock-key', typ: 'JWT' }));
    const payload = base64url(JSON.stringify({ ...claims, iss: issuer, aud: clientId, iat: now, exp: now + 3600 }));
    const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey).toString('base64url');
    return `${header}.${payload}.${signature}`;
  };

  const send = (res: http.ServerResponse, body: unknown) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(body));
  };

  const server = http.createServer((req, res) => {
    switch (req.url) {
      case '/.well-known/openid-configuration':
        return send(res, {
          issuer,
          authorization_endpoint: `${issuer}/authorize`,
          token_endpoint: `${issuer}/token`,
          userinfo_endpoint: `${issuer}/userinfo`,
          jwks_uri: `${issuer}/jwks`,
          ...(scopesSupported && { scopes_supported: scopesSupported }),
          response_types_supported: ['code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256'],
          token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
        });
      case '/jwks':
        return send(res, { keys: [jwk] });
      case '/token':
        return send(res, {
          access_token: 'mock-opaque-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          id_token: signIdToken(),
        });
      case '/userinfo':
        return send(res, claims);
      default:
        res.statusCode = 404;
        return res.end();
    }
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return {
    wellKnownUrl: `${issuer}/.well-known/openid-configuration`,
    clientId,
    setClaims: (next) => {
      claims = next;
    },
    setScopesSupported: (next) => {
      scopesSupported = next;
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
