# Verify

Run the checks in order from `marketplace/`. Report each as pass, fail, or skipped with the
reason. Plugin jest tests are not a gate: the scaffolded `__tests__/index.js` is an `it.todo`
stub and there is no jest setup for plugins (`marketplace/AGENTS.md`).

## 1. Build

```bash
cd marketplace
test -d plugins/common/dist || npm run build --workspace=@tooljet-marketplace/common
npm run build --workspace=@tooljet-marketplace/<id>
```

`ncc` compiles `lib/index.ts`, so this is also the type check. Exit code 0 is a pass; do not pipe the build through `tail`. A missing module means the
dependency was not added to the plugin's `package.json` (`npm i <pkg> --workspace=@tooljet-marketplace/<id>`).

## 2. Validator

```bash
npm run validate:plugin -- <id>
```

It checks the required files, both JSON files against `plugins/schemas/`, that the id appears
exactly once in `plugins.json`, that every `@spec/` reference has a file in `openapi-specs/`, and,
without `@spec/`, that every operation value is handled in `lib/*.ts`. Exit 0 is a pass; each
failure prints `FAIL <id>: <reason>`.

## 3. Lint

```bash
ESLINT_USE_FLAT_CONFIG=false npx eslint 'plugins/<id>/lib/**/*.ts'
```

The env var matches CI: without it, eslint 8 picks up the frontend's flat config and fails.

## 4. Spec and PRD coverage

The validator cannot see `plugin-spec.json` or the PRD. Check by reading:

- Every spec operation is in `operations.json` (or in the shipped OpenAPI spec for
  `api-endpoint`) and handled in `index.ts`.
- Every PRD requirement maps to an operation or field; list any that do not.
- `source.kind` equals the id; secrets are encrypted; `customTesting` matches whether
  `testConnection` exists.
- For `api-endpoint`, the shipped spec still passes `npx @apidevtools/swagger-cli validate`.

## 5. UI check (optional)

Needs a browser automation tool and a running ToolJet with `ENABLE_MARKETPLACE_FEATURE=true`
and `ENABLE_MARKETPLACE_DEV_MODE=true` (see
`docs/docs/contributing-guide/marketplace/marketplace-setup.md`). If either is missing, skip
and say which; do not block the run on it.

Use the frontend URL from `.env` (`TOOLJET_HOST`):

1. Install the plugin from `/integrations`; after later edits, use the reload button.
2. Data source form: fields, order, labels, widgets, and every `dropdown-component-flip` /
   `toggle-flip` branch. Compare with the design reference if one exists.
3. Query editor in an app: every operation lists and each shows its parameters. For
   `api-endpoint`, open a few operations with path params and bodies.
4. With test credentials from the user, run one read operation and the test-connection button
   (when shown).

Take a screenshot per step. Report structural differences (missing field, wrong order, wrong
widget, wrong label), not pixel differences.
