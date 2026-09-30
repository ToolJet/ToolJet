# Intake: OpenAPI spec

Output: `plugin-spec.json` with `operationsMode: "api-endpoint"` and `specUrl`, plus the spec
file(s) the plugin will ship in `openapi-specs/`.

## 1. Validate

```bash
npx @apidevtools/swagger-cli validate <spec-path>
```

Invalid spec: show the errors and stop. Swagger 2.0 input: convert to OpenAPI 3 first (for
example `npx swagger2openapi <in> -o <out>.yaml`) and validate the result.

## 2. Extract

- **Operations**: one per `paths[path][method]`: `operationId`, `summary`, method, path, and
  parameters. Record them in `operations[]` (`name` = `operationId` or `<method>_<path>` slug,
  `method`, `path`). They drive the user gate and the backend, not the query form.
- **Auth**: from `components.securitySchemes` and top-level `security`:

  | securityScheme | plugin-spec `auth.type` |
  |---|---|
  | `http` + `scheme: bearer` | `bearer` |
  | `http` + `scheme: basic` | `basic` |
  | `apiKey` | `api_key` (keep `in` and `name` in `auth.config`) |
  | `oauth2` (authorizationCode) | `oauth2` (keep `authorizationUrl`, `tokenUrl`, scopes in `auth.config`) |
  | none declared | `none`, but confirm with the user: many specs omit auth that the API requires |
  | anything else | `custom` |

- **Base URL**: `servers[0].url` into `metadata.baseUrl`. Note any server variables.

## 3. Split large specs

A spec with roughly 50+ operations across unrelated resources is easier to use split into
entity groups. Each group becomes one file, and `specUrl` becomes an object whose keys label the
Entity dropdown:

```json
"specUrl": { "Sales": "@spec/<id>/sales", "Reports": "@spec/<id>/reports" }
```

Keep one file (a string `specUrl`) otherwise.

## 4. Place the spec

After scaffolding, write each file to `marketplace/plugins/<id>/openapi-specs/<name>.yaml`
(`.yaml` preferred; `.json` works). Naming:

- The file name without extension is the `@spec/<id>/<name>` suffix, exactly.
- Name the API group (`accounting.yaml`), not the plugin (`<id>-accounting.yaml`).
- Strip servers, examples, or vendor extensions only if they break the widget; otherwise ship the
  spec as validated.

How `@spec/` is installed and served: `marketplace/AGENTS.md`, OpenAPI mode.

## 5. Generate plugin-spec.json

```json
{
  "metadata": { "name": "Example", "kind": "example", "description": "…", "type": "api", "baseUrl": "https://api.example.com" },
  "auth": { "type": "bearer" },
  "schemaVersion": "v1",
  "operationsMode": "api-endpoint",
  "specUrl": "@spec/example/core",
  "operations": [
    { "name": "listWidgets", "method": "get", "path": "/widgets", "description": "List widgets", "parameters": [] }
  ]
}
```

Validate it (SKILL.md step 2), then run the user gate.

Reference plugin: `marketplace/plugins/quickbooks/` (`react-component-api-endpoint`, `@spec/`,
OAuth2).
