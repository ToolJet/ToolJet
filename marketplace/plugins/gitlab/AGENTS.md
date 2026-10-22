# GitLab marketplace plugin

`lib/index.ts::Gitlab` implements the 13 required GitLab REST API operations, connection testing,
OAuth authorization-code exchange, and refresh. `lib/manifest.json` defines credentials;
`lib/operations.json` defines the query form. `lib/icon.svg` is the marketplace icon.

- Base URL is the instance root, including any self-managed installation subpath, without `/api/v4`.
  API and OAuth endpoints must use the same configured instance.
- Personal/project tokens use `PRIVATE-TOKEN`; OAuth uses `Authorization: Bearer`.
- `authUrl` and `accessDetailsFrom` accept form wrappers, parsed options, and option arrays.
- OAuth callbacks return token pairs; refresh returns an object. Secrets are encrypted in the manifest.
- OAuth 401s use `OAuthUnauthorizedClientError` so ToolJet refreshes and retries the query.
  Personal/project token errors remain `QueryError`.
- Project/file paths are encoded once; issue and merge request identifiers are project-local IIDs.
- List operations return a single page. Parameters and write bodies accept JSON objects.
- Changing a GitLab query operation clears operation inputs, including shared and hidden fields, while preserving query-level settings (`QueryManagerBody.optionchanged`).
- Query defaults use plain values because the query editor copies them directly. `run()` also accepts the legacy `{ value: operation }` wrapper so existing queries continue to work.
- Native OAuth registration lives in `data-sources/util.service.ts::authorizeOauth2`,
  `data-queries/util.service.ts::runQuery`, and the DataSourceManager OAuth footer list.
- No new runtime dependency: HTTP uses Node's fetch. Build with the repository's required Node version.

Run `nvm use`, then from `marketplace/`:
`npm test --workspace=@tooljet-marketplace/gitlab` (builds the production bundle and tests its contract).
Tests simulate GitLab responses; live OAuth and marketplace installation need an actual ToolJet instance.
