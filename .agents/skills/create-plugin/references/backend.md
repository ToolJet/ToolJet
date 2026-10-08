# Backend: lib/index.ts and lib/types.ts

Inputs: `plugin-spec.json`, PRD, API source, plugin directory. Read `manifest-and-operations.md`
so field keys match the frontend job's. On a fix round, change only what the error names.

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
- Failures: `throw new QueryError(message, description, data)`. The user sees the description;
  include the provider's error. `data` is `Record<string, unknown>` (`common/lib/query.error.ts`),
  so wrap an `unknown` body (`body as object` fails with TS2345):

  ```ts
  throw new QueryError('Query could not be completed', `HTTP ${res.status}`, { status: res.status, body });
  ```

- `testConnection`: implement when `customTesting` is `false` (`marketplace/AGENTS.md`); make the
  cheapest authenticated call (current user, `limit=1`).
- Every `operation.list` value must appear as a string literal in `lib/*.ts`, typically a `case`
  label (validator checks).
- No `any`. Type responses you use; `unknown` plus a narrow cast where the shape is open.
  `QueryResult.data` is `object | object[]`, so cast a parsed `unknown` body (`data as object`);
  driver row types may need `rows as unknown as object[]`.

## Dependencies

- Plain HTTP: `got`, pinned to the major existing plugins use:
  `npm i got@11 --workspace=@tooljet-marketplace/<id>` (`marketplace/plugins/quickbooks/package.json`).
  Install what the code imports before verifying.
- A maintained vendor SDK is fine when it saves real work (auth signing, pagination). No axios or
  node-fetch next to `got`.
- If the user supplies the base URL, call `validateUrlForSSRF(url)` before requesting it (see
  `marketplace/plugins/servicenow/lib/index.ts`).
- API on several fixed hosts: constants in `index.ts`, picked per operation, no manifest field
  (`marketplace/plugins/hugging_face/lib/index.ts`). Add a manifest field only for a host the user
  chooses: region or sandbox vs production as a `dropdown` (`fedex` `base_url`), or a self-hosted
  URL. With no connection fields, drop the template's `base_url`; empty `options`, `properties`
  and `required` are valid.

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

Codehinter values arrive as strings: `JSON.parse` JSON bodies in a `try`; on failure raise a
`QueryError` naming the field.

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

Reference for behavior only (it uses `any`, which you must not): `run()` in
`marketplace/plugins/quickbooks/lib/index.ts`.

## Auth

| `auth.type`         | Request                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `api_key`           | Header or query param from `auth.config` (`headerName`, `in`), fixed in code: `headers['x-api-key'] = sourceOptions.api_key` |
| `bearer`            | `Authorization: Bearer <token>`                                                                                              |
| `basic`             | `Authorization: Basic base64(user:pass)`                                                                                     |
| `oauth2`            | Access token from `sourceOptions` (see below)                                                                                |
| `connection_fields` | Driver client built from the connection fields; reuse via `cacheConnection` / `getCachedConnection` when the driver pools    |
| `custom`            | Whatever the source requires (headers from a `react-component-headers` field, request signing)                               |
| `none`              | Nothing                                                                                                                      |

## OAuth2

Follow `marketplace/plugins/quickbooks/lib/index.ts` for behavior (all four pieces), not its
`any` types, logging, or `customTesting: false` without `testConnection`.

`sourceOptions` shape varies per entry point; read keys with a helper accepting all of them (like
`getValue` in `marketplace/plugins/googlecalendar/lib/index.ts`, minus its `any`):

| Method                | Shape                                                  |
| --------------------- | ------------------------------------------------------ |
| `authUrl`             | form values `{ key: { value } }`, or flat on reconnect |
| `accessDetailsFrom`   | array of `{ key, value }`, or a flat object            |
| `refreshToken`, `run` | flat `{ key: value }`                                  |

- `authUrl(sourceOptions): string`: build the provider's authorize URL. The redirect URI is
  `${TOOLJET_HOST}${SUB_PATH || '/'}oauth2/authorize` (honour `tj_redirect_host`). Include
  `state` (`crypto.randomUUID()`); many providers require it.
- `accessDetailsFrom(authCode, sourceOptions, resetSecureData)`: exchange the code; client
  credentials go in a Basic header or form body per provider docs. Return
  `[['access_token', …], ['refresh_token', …]]`; return empty values when `resetSecureData`.
- `refreshToken(sourceOptions, dataSourceId, userId, isAppPublic)`: keep the old refresh token if
  the provider does not issue a new one: `refresh_token: result.refresh_token || previous`.
- In `run`, read the token with `getCurrentToken` when `multiple_auth_enabled` is set, and throw
  `OAuthUnauthorizedClientError` on 401/403 so ToolJet refreshes the token and retries.
