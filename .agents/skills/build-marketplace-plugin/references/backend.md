# Backend: lib/index.ts and lib/types.ts

Inputs: `plugin-spec.json`, the PRD, the API source, the plugin directory. Also read
`manifest-and-operations.md` so field keys match what the frontend job writes.

On a fix round, change only what the reported error names.

## Contract

```ts
import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

export default class Example implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    // return { status: 'ok', data }
  }
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    // return { status: 'ok' } or { status: 'failed', message }
  }
}
```

- Import only from `@tooljet-marketplace/common` (`marketplace/plugins/common/lib/index.ts` lists
  its exports: `QueryError`, `OAuthUnauthorizedClientError`, `getCurrentToken`,
  `validateUrlForSSRF`, …).
- `sourceOptions` keys are the manifest `properties` keys; `queryOptions` keys are the
  operations.json keys.
- Failures: `throw new QueryError(message, description, data)`. The description is what the user
  sees; include the provider's error body.
- `testConnection`: implement it when the manifest's `customTesting` is `false` (see
  `marketplace/AGENTS.md`). Make the cheapest authenticated call (current user, `limit=1`).
- Every `operation.list` value must appear as a string literal in `lib/*.ts`, typically as a
  `case` label. The validator checks.
- No `any`. Type responses you use; `unknown` plus a narrow cast where the shape is open.

## Dependencies

- Plain HTTP: `got`, as most HTTP plugins do. Pin the major an existing plugin uses, e.g.
  `npm i got@11 --workspace=@tooljet-marketplace/<id>` (see `marketplace/plugins/quickbooks/package.json`).
- A maintained vendor SDK is fine when it saves real work (auth signing, pagination); many
  plugins use one. Do not add axios or node-fetch next to `got`.
- If the user supplies the base URL, call `validateUrlForSSRF(url)` before requesting it (see
  `marketplace/plugins/servicenow/lib/index.ts`).

## Mode A: hand-written operations (no `operationsMode`)

One handler per spec operation, dispatched on `queryOptions.operation`:

```ts
switch (queryOptions.operation) {
  case 'list_customers':
    return { status: 'ok', data: await this.listCustomers(sourceOptions, queryOptions) };
  default:
    throw new QueryError('Query could not be completed', `Unknown operation ${queryOptions.operation}`, {});
}
```

Codehinter values arrive as strings; `JSON.parse` JSON bodies inside a `try` and raise a
`QueryError` that names the field on failure.

`types.ts`: `SourceOptions` from the manifest fields, `QueryOptions` as `operation` plus every
parameter key (optional where not required).

## Mode B: `operationsMode: "api-endpoint"`

The `react-component-api-endpoint` widget sends:

```ts
export type QueryOptions = {
  operation: string; // HTTP method, lowercase
  path: string; // e.g. "/v1/widgets/{id}"
  params: { path: Record<string, string>; query: Record<string, string>; request: Record<string, unknown> };
};
```

One generic handler, no switch:

1. Substitute every `{name}` in `path` with `encodeURIComponent(params.path[name])`. Values that
   come from the connection (account id, region) override `params.path`.
2. Add non-empty `params.query` entries as search params.
3. Send `params.request` as the JSON body unless the method is GET or DELETE.
4. Add auth headers from `sourceOptions`, then return `{ status: 'ok', data: body }`.

Reference: `run()` in `marketplace/plugins/quickbooks/lib/index.ts`.

## Auth

| `auth.type` | Request |
|---|---|
| `api_key` | Header or query param named in `auth.config` |
| `bearer` | `Authorization: Bearer <token>` |
| `basic` | `Authorization: Basic base64(user:pass)` |
| `oauth2` | Access token from `sourceOptions` (see below) |
| `connection_fields` | Driver client built from the connection fields; reuse via `cacheConnection` / `getCachedConnection` when the driver pools |
| `custom` | Whatever the source requires (headers from a `react-component-headers` field, request signing) |
| `none` | Nothing |

## OAuth2

Follow `marketplace/plugins/quickbooks/lib/index.ts`; it has all four pieces:

- `authUrl(sourceOptions)`: build the provider's authorize URL. The redirect URI is
  `${TOOLJET_HOST}${SUB_PATH || '/'}oauth2/authorize` (honour `tj_redirect_host`). Include
  `state` (`crypto.randomUUID()`); many providers reject requests without it.
- `accessDetailsFrom(authCode, sourceOptions, resetSecureData)`: exchange the code. Check the
  provider docs for where client credentials go: Basic header or form body. Return
  `[['access_token', …], ['refresh_token', …]]`; return empty values when `resetSecureData`.
- `refreshToken(sourceOptions, dataSourceId, userId, isAppPublic)`: keep the old refresh token if
  the provider does not issue a new one: `refresh_token: result.refresh_token || previous`.
- In `run`, read the token with `getCurrentToken` when `multiple_auth_enabled` is set, and throw
  `OAuthUnauthorizedClientError` on 401/403 so ToolJet refreshes the token and retries.
