# ToolJet Database page (frontend)

The workspace's built-in database UI at `/:workspaceId/database`: a tables panel on the left, a strip of open-table tabs on top, the grid for the active table below. Backend is `server/src/modules/tooljet-db/`.

## Domain terms

- **Open table** — `selectedTable` in context (`{}` when none). It is also the **active tab**.
- **Open tabs** — `openTabIds`, ordered table ids. Labels come from `tables`, never a copy of the name.
- **Environment** — `tjdbStore.selectedEnvironment`; the grid shows it while schema edits and Add data write to development.

## Key files

| File | Role |
|---|---|
| `index.jsx` | Owns page state (`tables`, `selectedTable`, columns, …) and the context value; calls `useOpenTabs` |
| `TablesPanel/TablesPanel.tsx`, `TableRow.tsx`, `useTables.ts` | Left panel; `useTables` loads the list and hands it to `applyTables` |
| `TablesPanel/openTabs.ts` | Pure tab rules (open, close, close others/all, reconcile, parse saved state) |
| `TablesPanel/useOpenTabs.ts` | Tab state, `localStorage` save/restore, `?table=` link |
| `TablesPanel/TableTabStrip.tsx`, `TabStripPopovers.tsx` | Strip, open-or-create picker, open-tabs menu |
| `TooljetDatabasePage/index.jsx` | Layout, "No table open" state; sets `--tjdb-above-table: 48px` for the grid height |
| `TableActions/TableSchemaScope.tsx` | Row actions load their own table's schema, independent of the open table |
| `_stores/tjdbStore.js` | zustand: environments, filters, sort, page |

Rocket pieces: `components/ui/Rocket/{SidePanel,SearchInput,ClosableTabs}`.

## Invariants & gotchas

- Open a table only through `openTable(table)` (context). Never call `setSelectedTable` to switch tables: the tab list would not follow.
- Tabs persist per browser and workspace in `localStorage` key `tjdb-open-tabs:<workspaceId>` as `{ids, activeId}`. Saved state is untrusted: `parseStoredTabs` falls back to "nothing open", `reconcileTabs` drops ids of deleted tables.
- Restore order on first load: saved tabs, then `?table=<id>` (opened on top), then the App Builder handoff (`localStorage.tableDetails`). Nothing is written (storage or URL) before that first restore.
- No table is opened by default. First visit, or "Close all tabs", shows the empty state.
- The environment is not in the URL yet; switching tabs still resets filter/sort/page (effect on `[selectedTable]` in `Table/index.jsx`). Per-tab memory of those is not built.
- `ClosableTabs` fills the room its parent gives; keep sibling strip items `shrink-0` or it will not scroll.
- Preflight is off: a solid border style alone gives the other sides 3px. Use `tw-border-0` plus the one side.
- The tables quota (`tablesLimitReached`) is read once in `index.jsx` and shared through context; never call `useTablesLimit` from a component. It refetches on a change of table *count* only (a new `tables` array is made on every tab switch).
- Specs that build the context by hand must use `useOpenTabs` (the context defaults are no-ops). Specs that import the real store go in `__tests__/integration/`.
- Cypress `data-cy`: `table-tab-strip`, `<table>-tab` (+ `-close`), `open-or-create-table-button`, `open-tabs-menu-button`, `no-table-open`, `expand-tables-panel`.

## Related modules

- `AppBuilder/QueryManager/QueryEditors/TooljetDatabase/` — writes `localStorage.tableDetails` to open this page on a table.
- `server/src/modules/tooljet-db/` — schema, migrations, PostgREST proxy.
