# Query editors

Connector-specific editors map saved query options and data source configuration to Query Manager controls.

## OpenAPI

- `Openapi.jsx` reads the parsed spec from `selectedDataSource.options.spec.value`.
- Saved/imported data sources can contain an empty spec (`{}`), or no `paths`. Show the existing localized invalid-spec message before resolving hosts or operations; the editor must not crash while opening these queries.
- Keep valid operation selection and saved parameters intact when handling invalid specs.
- Regression coverage: `__tests__/Openapi.spec.jsx`.
