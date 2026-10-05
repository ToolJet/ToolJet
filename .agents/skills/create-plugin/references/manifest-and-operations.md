# manifest.json and operations.json

`manifest.json` defines the connection form, `operations.json` the query form. Both are
validated against `plugins/schemas/manifest.schema.json` and `operations.schema.json`; the V1 widget
`type` enums there are the complete list of accepted names (V2 `tj:ui:properties.*.widget` is not
schema-checked). Templates live in
`../assets/templates/`; replace every `{{PLACEHOLDER}}` with real values: `PLUGIN_TITLE` and
`PLUGIN_NAME` are the display name, `PLUGIN_KIND` the id, `SPEC_NAME` the `@spec/` file name,
`DEFAULT_BASE_URL` the API base URL, the OAuth ones come from the provider's docs, and
`OPERATION_1_*` / `PARAM_1_*` are copied once per operation and parameter.

## V1 or V2 manifest

|                      | V1 (default)                                                       | V2                                                         |
| -------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| Identity             | `source: { name, kind, options, exposedVariables, customTesting }` | `tj:source: { name, kind, type }`, `tj:version`            |
| Fields               | `properties.<key>.type` (widget)                                   | JSON Schema `properties` + `tj:ui:properties.<key>.widget` |
| Encryption           | `source.options.<key>.encrypted: true`                             | `tj:encrypted: [keys]`                                     |
| Initial values       | `defaults.<key>.value`                                             | JSON Schema `default`                                      |
| Conditional required | —                                                                  | `allOf` with `if`/`then`                                   |
| Marketplace users    | almost all plugins                                                 | `anthropic`, `gemini`, `openai`                            |

Use V2 only when the form needs `toggle-flip`, the `*-v3` inputs, or `allOf` validation.
The frontend treats any manifest with `tj:version` as V2.

## Widgets

manifest.json (V1 `type`):

| Widget                    | Use                                                         |
| ------------------------- | ----------------------------------------------------------- |
| `text`                    | URLs, usernames, ids                                        |
| `password`                | Secrets; also mark the option `encrypted`                   |
| `textarea`                | Certificates, long text                                     |
| `dropdown`                | Fixed choices (`list: [{ name, value }]`)                   |
| `dropdown-component-flip` | Choice that swaps child field groups (auth method)          |
| `toggle`                  | Boolean                                                     |
| `react-component-headers` | Key/value pairs, e.g. custom headers (default `[["", ""]]`) |
| `react-component-oauth`   | OAuth 2.0 connect flow; see `oauth-manifest.json`           |

V2 `widget` names: `text-v3`, `password-v3`, `password-v3-textarea`, `toggle-v2`, `toggle-flip`,
`dropdown`, `dropdown-component-flip`, `react-component-headers`, `react-component-oauth`.

operations.json (`type`):

| Widget                         | Use                                                 |
| ------------------------------ | --------------------------------------------------- |
| `dropdown-component-flip`      | The operation picker for hand-written operations    |
| `react-component-api-endpoint` | The operation picker for OpenAPI specs (`spec_url`) |
| `codehinter`                   | Nearly every parameter; accepts `{{ }}` expressions |
| `dropdown`                     | Closed enum parameter                               |
| `toggle`                       | Boolean parameter                                   |

## Auth patterns (V1 templates)

| `auth.type`         | Template                                       | Shape                                                                                         |
| ------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `api_key`           | `v1/api-key-manifest.json`                     | Flat `api_key` password field                                                                 |
| `bearer`            | `v1/bearer-manifest.json`                      | Auth picker with a token group; for a single method, a flat `bearer_token` field is fine      |
| `basic`             | `v1/basic-manifest.json`                       | Flat URL, username, password                                                                  |
| `oauth2`            | `v1/oauth-manifest.json`                       | One `react-component-oauth` property with `oauth_configs`; OAuth URLs and grant in `defaults` |
| `none`              | `v1/none-manifest.json`                        | No credentials; optional base URL                                                             |
| `custom`            | `v1/custom-manifest.json`                      | Base URL + custom headers; add fields as needed                                               |
| `connection_fields` | `v1/database-manifest.json`                    | Connection URL + optional encrypted auth token; `type: database`                              |
| `connection_fields` | `v2/database-manifest.json`, or V1 flat fields | Host, port, database, username, password, SSL                                                 |

Several methods at once: V1 uses a `dropdown-component-flip` whose `list` values name sibling
groups (see `bearer-manifest.json`, add more entries and groups); V2 uses
`v2/multi-auth-manifest.json`. `commonFields` on the picker renders fields shown for every
choice.

Rules:

- Every secret is encrypted: V1 `source.options.<key>.encrypted: true`, V2 `tj:encrypted`.
- `customTesting`: semantics in `marketplace/AGENTS.md`. The non-OAuth templates set `false` (the
  test-connection button shows, so implement `testConnection`). `oauth-manifest.json` sets `true`
  (no button; connecting validates), as most OAuth plugins do. Change either deliberately.
- Keep `exposedVariables` as in the templates.
- `required` lists keys that must be filled before saving. Optional credential: empty `required`
  and have the backend skip the auth header when the value is undefined.
- OAuth: copy `oauth_configs` from the template; edit `auth_url`, `access_token_url`, `scopes`,
  and `allowed_field_groups`. Leave `redirect_url` empty. Working references:
  `marketplace/plugins/hubspot/lib/manifest.json`, `quickbooks`, `xero`.

## operations.json, hand-written (`dropdown-component-flip`)

`properties.operation` is the picker; every `list[].value` has a sibling group of that name
holding its parameters. Only the selected group renders. Template: `v1/api-operations.json`
(APIs), `v1/database-operations.json` (a query box).

- `operation.key` stays `"operation"`; each `value` must appear as a string literal in
  `lib/index.ts` (the validator checks).
- Codehinter parameter:

  ```json
  "customer_id": {
    "label": "Customer ID", "key": "customer_id", "type": "codehinter",
    "className": "codehinter-plugins", "lineNumbers": false,
    "placeholder": "cus_123", "height": "36px", "width": "320px",
    "editorType": "extendedSingleLine"
  }
  ```

  Single-line values: `height: "36px"`. JSON bodies: `"150px"`. SQL: `"250px"`.

- Pagination: `page` and `page_size` codehinters with the default in the `placeholder`.

## operations.json, OpenAPI (`react-component-api-endpoint`)

Template: `v1/api-endpoint-operations.json`.

```json
"operation": {
  "label": "", "key": "<id>_operation",
  "type": "react-component-api-endpoint",
  "description": "Single select dropdown for operation",
  "spec_url": "@spec/<id>/<name>"
}
```

- `spec_url` is a string for one spec, or an object `{ "Label": "@spec/<id>/<name>" }` for an
  Entity dropdown over several.
- Spelling: `spec_url` is the key the frontend form reads. Existing plugins also use `specUrl`,
  which reaches the form as `spec_url` because the data-sources API decamelizes keys. New
  plugins use `spec_url`; `plugin-spec.json` uses `specUrl`.
- Prefer `@spec/` over external URLs: no runtime dependency on a third-party host or CSP.
- The widget reads path-level and operation-level parameters, renders path, query and body
  inputs, and sends `{ operation, path, params: { path, query, request } }` to `run()`.
- Put per-request values (ids, filters, bodies) in the spec. Only connection-wide values
  (credentials, account or company id, region) go in the manifest; the backend then overrides
  the matching path param (as `quickbooks` does with `companyid`).
