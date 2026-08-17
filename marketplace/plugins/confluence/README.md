
# Confluence

Documentation on: https://docs.tooljet.com/docs/marketplace/plugins/marketplace-plugin-confluence

## OpenAPI spec

Endpoints are driven by one vendored Atlassian spec, `openapi-specs/confluence_v2.json` — the
[Confluence Cloud REST API v2](https://dac-static.atlassian.com/cloud/confluence/openapi-v2.v3.json).
Its paths are relative to the v2 API root, so `lib/index.ts` prefixes every request with
`/wiki/api/v2`.

The file is vendored verbatim; only `servers` goes unused, since the base URL is computed at
runtime from the auth type. To refresh it:

```bash
curl -sS -o openapi-specs/confluence_v2.json https://dac-static.atlassian.com/cloud/confluence/openapi-v2.v3.json
```

Last fetched: 2026-08-14.

The older v1 API (`swagger.v3.json`) is deliberately not exposed. It holds endpoints v2 has no
equivalent for — CQL search, user lookup, attachment upload and content restrictions — so those
operations are out of scope for this plugin.

## Authentication

OAuth 2.0 (3LO) only — client id/secret from an Atlassian developer app. Tokens are issued to an
Atlassian account rather than to a site and are only valid against
`https://api.atlassian.com/ex/confluence/{cloudId}`, so every query needs a **Site** selected in
the query editor; *Get sites* lists the cloud ids the authorization covers via
`/oauth/token/accessible-resources`.

Atlassian's authorize endpoint needs `audience` and `state`, and only returns a refresh token when
`offline_access` is in scope, so `authUrl()` is built in `lib/index.ts` rather than by the shared
`getAuthUrl()` helper. Refresh tokens rotate on every use, so `refreshToken()` returns the new one
for persistence.
