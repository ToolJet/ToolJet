import { isMcpOAuthEnabled } from './http-security';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { trustedUrl, validateRedirects, stringParam, CLIENT_AUTH_METHODS, OAuthFailure } from './protocol';

export function parseOAuthSettings(config: ConfigService) {
  if (!isMcpOAuthEnabled(config.get('TOOLJET_EDITION'), config.get('MCP_OAUTH_ENABLED'))) throw new NotFoundException();
  const subpath = (config.get<string>('SUB_PATH') || '').replace(/^\/+|\/+$/g, '');
  const browser = trustedUrl(config.get<string>('TOOLJET_HOST')).origin + (subpath ? `/${subpath}` : '');
  const configuredIssuer = config.get<string>('MCP_OAUTH_ISSUER') || `${browser}/api/mcp-oauth`;
  const configuredResource = config.get<string>('MCP_OAUTH_RESOURCE_URL');
  const issuer = trustedUrl(configuredIssuer).href.replace(/\/$/, '');
  const resource = configuredResource && trustedUrl(configuredResource).href.replace(/\/$/, '');
  if (new URL(issuer).pathname !== `${subpath ? `/${subpath}` : ''}/api/mcp-oauth`)
    throw new Error('MCP_OAUTH_ISSUER must point to this installation’s /api/mcp-oauth endpoint');
  if (
    !resource ||
    !config.get<string>('MCP_OAUTH_EXCHANGE_SECRET') ||
    config.get<string>('MCP_OAUTH_EXCHANGE_SECRET').length < 32
  ) {
    throw new Error('MCP OAuth requires a resource URL and an exchange secret of at least 32 characters');
  }
  for (const value of [configuredIssuer, configuredResource]) {
    const url = trustedUrl(value);
    if (url.search || value.endsWith('/')) throw new Error('MCP OAuth URLs must have no query or trailing slash');
  }
  // Consent needs the host-only cookie issued by /authorize, including when SSO
  // returns from a custom domain. Split backends must proxy this public endpoint.
  const issuerUrl = new URL(issuer);
  const browserUrl = new URL(browser);
  if (issuerUrl.hostname !== browserUrl.hostname || issuerUrl.protocol !== browserUrl.protocol)
    throw new Error(
      'MCP OAuth issuer must use the TOOLJET_HOST hostname and scheme; proxy /api/mcp-oauth through the browser host'
    );
  return { browser, issuer, resource };
}

export function parseRegistration(body: Record<string, unknown>) {
  const redirects = validateRedirects(body.redirect_uris);
  const name = stringParam(body.client_name, 'client_name', true) || 'MCP client';
  if (
    name.length > 120 ||
    Array.from(name).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
  )
    throw new OAuthFailure('invalid_client_metadata', 'Invalid client name');
  // RFC 7591 defaults new registrations to Basic; existing rows and explicit public clients stay none.
  const authMethod =
    body.token_endpoint_auth_method === undefined ? 'client_secret_basic' : body.token_endpoint_auth_method;
  if (!CLIENT_AUTH_METHODS.includes(authMethod as any))
    throw new OAuthFailure('invalid_client_metadata', 'Unsupported client authentication method');
  if (
    body.grant_types !== undefined &&
    (!Array.isArray(body.grant_types) ||
      body.grant_types.some((g) => !['authorization_code', 'refresh_token'].includes(g)))
  ) {
    throw new OAuthFailure('invalid_client_metadata', 'Unsupported grant type');
  }
  if (
    body.response_types !== undefined &&
    (!Array.isArray(body.response_types) || body.response_types.some((g) => g !== 'code'))
  ) {
    throw new OAuthFailure('invalid_client_metadata', 'Only the code response type is supported');
  }
  return { redirects, name, authMethod };
}
