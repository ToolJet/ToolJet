# Intake: OpenAPI spec

Output: `plugin-spec.json` with `operationsMode: "api-endpoint"` and `specUrl`, plus the spec
file(s) the plugin will ship in `openapi-specs/`.

## 1. Validate

Download a URL spec to a temp file outside the repo first, then validate that path.

```bash
npx @apidevtools/swagger-cli validate <spec-path>
```

Invalid spec: show the errors and stop. Swagger 2.0 input: convert to OpenAPI 3 first (for
example `npx swagger2openapi <in> -o <out>.yaml`) and validate the result.

OpenAPI 3.1 ships as-is (the query editor only resolves `$ref`s,
`frontend/src/_services/openapi.service.js`; `aftership`, `clickup`, `microsoft_graph` ship
3.1.0). swagger-cli rejects 3.1 patch versions above 3.1.1 ("Unsupported OpenAPI version");
validate a temp copy with the version set to `3.1.1`. The widget needs a single string `type` on
parameter schemas and top-level body properties (`frontend/src/_components/ApiEndpointInput.jsx`,
`paramType`): run every shipped file through `scripts/split-spec.mjs` (section 3), which
collapses `type: [X, "null"]` to `X`.

## 2. Extract

- **Operations**: one per `paths[path][method]`: `operationId`, `summary`, method, path, and
  parameters. Record in `operations[]` (`name` = `operationId`, or a `<method>_<path>` slug when
  absent; `method`, `path`, `parameters: []`). `{name, type}` parameter objects are only for
  hand-written mode; the api-endpoint widget reads them from the shipped spec. The list drives
  the user gate and the backend, not the query form.
- **Auth**: from `components.securitySchemes` and top-level `security`:

  | securityScheme               | plugin-spec `auth.type`                                                          |
  | ---------------------------- | -------------------------------------------------------------------------------- |
  | `http` + `scheme: bearer`    | `bearer`                                                                         |
  | `http` + `scheme: basic`     | `basic`                                                                          |
  | `apiKey`                     | `api_key`; `auth.config` = `{ "headerName": <name>, "in": "header" or "query" }` |
  | `oauth2` (authorizationCode) | `oauth2` (keep `authorizationUrl`, `tokenUrl`, scopes in `auth.config`)          |
  | none declared                | `none`, but confirm with the user: many specs omit auth that the API requires    |
  | anything else                | `custom`                                                                         |

  Several schemes: model the one the user picks (ask if unsure), name the dropped ones, warn
  that operations needing them will 401. Several OAuth2 flows: use `authorizationCode`, ignore
  `implicit`. Prefer the provider's OAuth docs token URL when it differs (Google:
  `https://oauth2.googleapis.com/token`, as `googlecalendar` uses). Optional credential:
  `manifest-and-operations.md`, Rules.

- **Base URL**: `servers[0].url` → `metadata.baseUrl`; note server variables. Relative
  (`/api/v3`) or absent → add a `base_url` manifest text field (default = full URL), read in
  `run()`.

## 3. Split large specs

Split when the operation dropdown would be long: more than about 50 operations, or several
unrelated resources; otherwise one file (string `specUrl`). Each group becomes a self-contained
file, and `specUrl` an object whose keys label the Entity dropdown (`hubspot`, `xero`):

```json
"specUrl": { "Emails": "@spec/<id>/emails", "Contacts": "@spec/<id>/contacts" }
```

Group by spec `tags`, merging small related ones; show the groups at the user gate. The
frontend job runs the split from `marketplace/` after scaffolding:

```bash
node ../.agents/skills/create-plugin/scripts/split-spec.mjs <spec> plugins/<id>/openapi-specs \
  "emails=Emails,Receiving Emails" "contacts=Contacts,Segments" "other=*"
```

Each `name=TagA,TagB` writes `<name>.yaml` (`.json` for JSON input) with those tags' operations
and only the components they reference. `*` takes every operation no named group lists (at most
one such group); untagged operations need it. Groups are always explicit. The script exits
non-zero, before writing anything, on a group without `=`, duplicate group names, an operation
in zero or two groups, a path item `$ref` (inline it first), or an unresolvable `$ref`. It prints
each file's operation count; the counts must add up to the total. For one file, pass a single
`"<name>=*"` group rather than copying the spec: the script also collapses type arrays (not
inside `example`, `default` or `enum`). A warning names a multi-type schema it cannot collapse;
pick one type by hand. Validate every output file (section 1).

## 4. Place the spec

After scaffolding, write each file to `marketplace/plugins/<id>/openapi-specs/<name>.yaml`
(`.json` also works). Naming:

- The file name without extension is the `@spec/<id>/<name>` suffix, exactly.
- Name the API group (`accounting.yaml`), not the plugin (`<id>-accounting.yaml`). A single-group
  API may use the plugin id (`petstore.json`, `@spec/petstore/petstore`).
- Strip servers, examples, or vendor extensions only if they break the widget; otherwise ship the
  spec as validated (after `split-spec.mjs`).

How `@spec/` is installed and served: `marketplace/AGENTS.md`, OpenAPI mode.

## 5. Generate plugin-spec.json

```json
{
  "metadata": {
    "name": "Example",
    "kind": "example",
    "description": "…",
    "type": "api",
    "baseUrl": "https://api.example.com"
  },
  "auth": { "type": "bearer" },
  "schemaVersion": "v1",
  "operationsMode": "api-endpoint",
  "specUrl": "@spec/example/core",
  "operations": [
    { "name": "listWidgets", "method": "get", "path": "/widgets", "description": "List widgets", "parameters": [] }
  ]
}
```

Fields: `auth.type` is one of `none|api_key|bearer|basic|oauth2|connection_fields|custom`;
`schemaVersion` is `v1|v2`; `metadata.type` is `api|database|cloud-storage`; `specUrl` is a string
or `{EntityLabel: "@spec/<id>/<name>"}`; each parameter has `name`, `type`
(`string|number|boolean|json|array`), optional `required`, `widget` (`codehinter|dropdown|toggle`),
`options`. Then run the user gate (SKILL.md step 2).

Reference plugin: `marketplace/plugins/quickbooks/` (`react-component-api-endpoint`, `@spec/`,
OAuth2).
