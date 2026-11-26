# dataSources module (frontend)

The global Data sources page: the list of data sources, the per-Environment configuration form, and Marketplace plugin forms. Backend counterpart: `server/src/modules/data-sources/AGENTS.md`.

## Key files

| File                                                 | Role                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pages/GlobalDataSourcesPage/index.jsx`              | Context provider: selected data source, current Environment, per-Environment fetch (`fetchDataSourceByEnvironment`) |
| `components/GlobalDataSources/index.jsx`             | Page layout; `environmentChanged` = set tab + fetch that Environment's options                                      |
| `components/DataSourceManager/DataSourceManager.jsx` | The configuration form (class component); holds the editable copy of options in `state.options`                     |
| `components/List`, `components/LIstItem`             | Sidebar list; selecting a source opens the first Environment with list data (Development)                           |

Plugin forms render inside `DataSourceManager`: `_components/DynamicForm.jsx` (V1 manifests), `_components/DynamicFormV2.jsx` (`tj:version` manifests), and the shared OAuth form (`_components/OAuthWrapper.jsx` → `_ui/OAuth/`).

## Invariants & gotchas

- **The form shows only the open Environment's options.** A tab switch shows a loader, so the form unmounts and mounts again.
  - `DataSourceManager` copies `props.selectedDataSource` into state in `getDerivedStateFromProps`, before render. Moving it back to `componentDidUpdate` makes the first render use the previous Environment's options.
  - The OAuth text inputs pass raw values (`options?.client_id?.value`). An input that first gets a value and then `undefined` keeps the old text.
- **Only the latest Environment request may fill the form.** `fetchDataSourceByEnvironment` ignores older responses and responses for a data source that is no longer selected. Answers can arrive out of click order.
- **A failed Environment request** shows an error, removes the loader, and moves the tab back to the Environment the form still shows (`shownEnvironmentRef`).
- **Defaults fill on every mount.** `DynamicForm` fills missing manifest defaults when it mounts (only missing keys; user values stay). This now runs for each Environment you open.

## Tests

- `components/DataSourceManager/__tests__/environmentSwitch.spec.jsx` — form shows the open Environment's values after a switch.
- `pages/GlobalDataSourcesPage/__tests__/environmentFetch.spec.jsx` — late, out-of-order and failed Environment requests.
