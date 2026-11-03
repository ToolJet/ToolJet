# Intake: npm package, database driver, or API docs

For sources without an OpenAPI spec. Output: `plugin-spec.json` **without** `operationsMode`;
its absence tells the generators to build a `dropdown-component-flip` operations form.

## 1. Understand the source

- **npm package**: `npm view <pkg> --json`; read README and type definitions for the client
  constructor, auth options, and public methods.
- **Database driver**: connection parameters (host, port, database, user, password, SSL, or a
  connection URL and token) and what users run (a raw query, plus any structured operations).
- **API docs URL**: list endpoints, auth, request and response formats. App shell with no
  content → follow links to the real docs host. Provider publishes an OpenAPI spec → say so and
  ask whether to switch to `intake-openapi.md`.
- **Description only**: ask until operations and auth are concrete.

## 2. Auth type

| Source says                                     | `auth.type`         |
| ----------------------------------------------- | ------------------- |
| API key in a header or query string             | `api_key`           |
| Bearer token, personal access token, JWT        | `bearer`            |
| Username and password                           | `basic`             |
| OAuth 2.0 authorization-code flow               | `oauth2`            |
| Host/port/user/password or a connection string  | `connection_fields` |
| Signed requests, several headers, anything else | `custom`            |
| Public API                                      | `none`              |

## 3. Operations

- APIs and SDKs: one operation per endpoint or method the PRD needs. Use snake_case `name`s
  (`list_customers`), a `displayName`, and typed `parameters`.
- Databases: usually a single query operation (SQL or the native query language) plus a few
  structured ones only when the PRD asks.
- Interdependent parameters ("required when X is set"): have the backend fill a sensible
  default rather than fail.
- Several hosts: list the host per operation (wiring: `backend.md`, Dependencies).
- Parameter `widget`: `codehinter` by default (it accepts `{{ }}` expressions), `dropdown` for
  closed enums (with `options`), `toggle` for booleans.

## 4. Schema version

V1 unless the connection form needs V2-only widgets or conditional validation; see
`manifest-and-operations.md`. Most database drivers still fit V1.

Field shape: `intake-openapi.md` section 5. Then run the user gate (SKILL.md step 2).
