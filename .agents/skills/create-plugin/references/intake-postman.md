# Intake: Postman collection

Convert the collection to an OpenAPI 3.0 YAML spec, audit it, then continue with
`intake-openapi.md`. Missing an endpoint, parameter, or auth setting is a failure.

## 1. Ingest

- **Local file** (preferred): read all of it, paging through large files.
- **URL**: fetch once, following redirects. Not collection JSON (HTML, login wall, error) → stop
  and ask the user to export it (collection menu, Export, Collection v2.1). Don't retry with
  other fetchers or fall back to docs intake.
- `info.schema` v2.0 and v2.1 both work.

## 2. Convert

Run in a temp directory outside the repo. The package's binary is `p2o` (hence `-p`).
`replaceVars` fills `{{baseUrl}}`-style variables from `variable[]`; `operationId: auto` derives
ids from request names.

```bash
echo '{"replaceVars":true,"operationId":"auto"}' > p2o-options.json
npx -y -p postman-to-openapi@3.0.1 p2o <collection>.postman_collection.json -f <name>-openapi.yaml -o p2o-options.json > /dev/null
```

Fix its known defects:

| Defect                                         | Fix                                                                                                                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OAuth2 written as `type: http, scheme: oauth2` | `type: oauth2` with `flows.authorizationCode` (`authorizationUrl`, `tokenUrl`, `scopes`). Postman often keeps these in environment variables; look them up in the provider's docs |
| `securitySchemes` missing                      | Add from collection-level `auth`                                                                                                                                                  |
| Disabled query params dropped                  | Leave them out, list them as "not converted"                                                                                                                                      |
| Non-standard MIME types (`application/text`)   | Standard types (`text/plain`)                                                                                                                                                     |
| Duplicate `operationId`s                       | Add a numeric suffix                                                                                                                                                              |
| Raw JSON body as `'*/*'` with a string schema  | `application/json` with an object schema built from the example (happens when the body has no `options.raw.language`)                                                             |
| `Content-Type` or `Accept` header parameters   | Remove them                                                                                                                                                                       |
| `servers` still holds `{{var}}`                | The variable has no value in the collection; ask the user for the base URL                                                                                                        |

If the converter fails, write the spec by hand with the same rules: `info` (collection name,
`version: "1.0.0"`), `servers`, one path entry per normalized path + method with `operationId`,
`summary`, `tags`, `parameters`, `requestBody` for POST/PUT/PATCH, and at least a `200`
response.

## 3. Extraction rules

Walk the whole `item` tree, recursing through nested folders.

- Folder name becomes the tag (outermost folder for nested ones).
- `{{baseurl}}`, `{{host}}`, `{{server}}` go to `servers[].url`, not parameters.
- `{{var}}` or `:var` in a path segment becomes path parameter `{var}`; the request's
  `url.variable[]` values become its `example`.
- Hard-coded IDs (`/invoice/147`, UUIDs) become `{id}`, or `{userId}`-style names when a path has
  several. Rename repeated names (`/company/{id}/item/{id}`).
- `url.query[]` entries become query params; `request.header[]` becomes header params, skipping
  standard headers (Accept, Content-Type, User-Agent).
- Requests with the same method and normalized path collapse into one operation: combined
  `summary`, each variant in `description`, union of body examples. Keep a count of Postman
  requests versus OpenAPI operations and explain every difference.
- `operationId`: tag + request name in camelCase (`Account` + `Account-Create` = `accountCreate`),
  unique across the spec.

## 4. Auth

Check collection-level `auth` and per-request overrides. Uniform auth goes in top-level
`security`; overrides go on the operation.

| Postman  | OpenAPI `securitySchemes` entry                                             |
| -------- | --------------------------------------------------------------------------- |
| `bearer` | `type: http`, `scheme: bearer`                                              |
| `basic`  | `type: http`, `scheme: basic`                                               |
| `apikey` | `type: apiKey`, `in: header\|query\|cookie`, `name: <key>`                  |
| `oauth2` | `type: oauth2` with `flows` (see above)                                     |
| `oauth1` | `type: http`, `scheme: OAuth`, plus a `description` of the signature method |
| `noauth` | no `security` on those operations                                           |

OAuth 2.0 always uses `type: oauth2`, never `type: http`.

## 5. Audit

Check and fix:

- Every Postman request (method + normalized path) has an operation.
- Every enabled query param appears.
- Every POST/PUT/PATCH with a body has a `requestBody`.
- Every `{param}` in a path has an `in: path` parameter, and no name repeats within a path.
- `operationId`s are unique.
- Flag collection bugs in the report: GET with a body, hard-coded credentials, tokens,
  timestamps or nonces, a hard-coded host where others use `{{baseurl}}`, unnamed requests,
  variables with no value.

Then `npx @apidevtools/swagger-cli validate <name>-openapi.yaml` until it passes.

## 6. Report, then continue

Tell the user: request and operation counts (with the reason for any gap), tags, auth mapping,
collection bugs, disabled params not converted, and the swagger-cli result. Then run
`intake-openapi.md` on the YAML.
