
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
`https://api.atlassian.com/ex/confluence/{cloudId}`, so a cloud id is always needed.

The site is a **connection** setting, not a query one: `site_url` on the data source, entered as the
address the user already knows (`https://example.atlassian.net`). A cloud id is never asked for —
Atlassian does not surface it in any UI — so `baseUrl()` translates the hostname to its cloud id by
matching `/oauth/token/accessible-resources`, cached per hostname for the life of the process (the
mapping is fixed; renaming a site changes the hostname and therefore the key). One data source means
one site — connect a second data source to reach a second site.

`testConnection()` checks the configured site is one the authorized account can actually reach,
since a grant covers whichever sites that account consented to. This matters most with per-user
tokens, where each user's grant differs; Atlassian answers an unreachable cloud id with a bare 404.

Atlassian's authorize endpoint needs `audience` and `state`, and only returns a refresh token when
`offline_access` is in scope, so `authUrl()` is built in `lib/index.ts` rather than by the shared
`getAuthUrl()` helper. Refresh tokens rotate on every use, so `refreshToken()` returns the new one
for persistence.
