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
| `TablesPanel/TablePickerPopover.tsx` | Picker popover + create-table drawer around any trigger button: the strip's plus and the empty page's "Open a table" |
| `Table/DataToolbar.tsx` | Presentational 48px bar: table name, filter chips (first two, rest in "+N more"), Filter/Sort slots, history, Add data slot |
| `Table/dataToolbarFilters.ts` | Pure: `queryFilters` to chips (`toToolbarFilters`), visible/overflow split (`splitFilters`) |
| `Conditions/ConditionPopover.tsx`, `ConditionRow.tsx` | Shared shell (title, add action, rows, Clear all / Cancel / Apply footer) and segmented condition row for the Filter and Sort popovers |
| `Forms/FilterConditionRow.tsx`, `SortConditionRow.tsx` | One filter or sort condition; operations and value (or order) wait for a column |
| `Filter/index.jsx`, `Sort/index.jsx` | Trigger + Rocket Popover; edit a draft, Apply writes it to the store |
| `Table/AddDataMenu.tsx` | "Add data" button + Rocket menu (row, bulk upload, seed SQL) |
| `Table/Header.jsx` | Wires the toolbar to the store and context; still owns the create row/column, bulk upload and seed drawers |
| `Table/Grid/TableGrid.tsx` | The read-only grid: header, virtualised rows, add row footer, loading skeleton, refetch bar. Props only plus `sortFilters` from the store and `foreignKeys` from context |
| `Table/Grid/useTableGrid.ts` | Headless TanStack instance: column defs, sizing, pinning (checkbox, then the first primary key), `getRowId` from the primary key values |
| `Table/Grid/sortState.ts` | Pure: applied `sortFilters` to TanStack `SortingState` (`toSortingState`); the header sort indicator is display-only |
| `TooljetDatabasePage/index.jsx` | Layout, "No table open" state (Rocket `EmptyAndNoResultsState`, centred in the area under the strip); sets `--tjdb-above-table: 48px` for the grid height |
| `TableActions/TableSchemaScope.tsx` | Row actions load their own table's schema, independent of the open table |
| `_stores/tjdbStore.js` | zustand, client state only: environments, the view (filters, sort, page, page size) and `viewTableId`, the table it belongs to |
| `rows/rowsQuery.ts` | Pure: the view to a PostgREST query string (`buildRowsQuery`); skips incomplete and refused filters (`isQueryableFilter`) |
| `rows/useTableRows.ts` | react-query: the open page of rows + total, keyed `['tjdb','rows',envId,tableId,query]`; `useInvalidateTableRows`; `patchCachedRow` |

Rocket pieces: `components/ui/Rocket/{SidePanel,SearchInput,ClosableTabs,Tag,LinkButton}`.

## Invariants & gotchas

- Open a table only through `openTable(table)` (context). Never call `setSelectedTable` to switch tables: the tab list would not follow.
- Tabs persist per browser and workspace in `localStorage` key `tjdb-open-tabs:<workspaceId>` as `{ids, activeId}`. Saved state is untrusted: `parseStoredTabs` falls back to "nothing open", `reconcileTabs` drops ids of deleted tables.
- Restore order on first load: saved tabs, then `?table=<id>` (opened on top), then the App Builder handoff (`localStorage.tableDetails`). Nothing is written (storage or URL) before that first restore.
- No table is opened by default. First visit, or "Close all tabs", shows the empty state.
- Rows are server state in react-query, never component state. Nothing fetches rows by hand: change the view in the store and the query follows; after a write call `handleRefetchQuery()` (context; an invalidate, any arguments are ignored). A cell save writes the cache with `patchCachedRow`, scoped to one table in one environment (another table can share a primary key).
- `setQueryFilters`, `setSortFilters` and `setPageSize` return to page 1 in the store. Callers never reset the page themselves.
- Switching tabs resets the view in one write (`openTableView`, from the `[selectedTable]` effect in `Table/index.jsx`). Rows wait until `viewTableId` matches the open table, so a new table is never read with the previous table's filters. The environment is not in the URL yet; per-tab memory of the view is not built.
- `ClosableTabs` fills the room its parent gives; keep sibling strip items `shrink-0` or it will not scroll.
- Preflight is off: a solid border style alone gives the other sides 3px. Use `tw-border-0` plus the one side.
- The tables quota (`tablesLimitReached`) is read once in `index.jsx` and shared through context; never call `useTablesLimit` from a component. It refetches on a change of table *count* only (a new `tables` array is made on every tab switch).
- Specs that build the context by hand must use `useOpenTabs` (the context defaults are no-ops). Specs that import the real store go in `__tests__/integration/`.
- Cypress `data-cy`: `table-tab-strip`, `<table>-tab` (+ `-close`), `open-or-create-table-button`, `open-tabs-menu-button`, `no-table-open`, `expand-tables-panel`, `data-toolbar`, `data-toolbar-table-name`, `filter-chips`, `filter-chip-<key>`, `more-filters`, `clear-all-filters`, `migration-history-button`, `add-new-data-button`, `filter-button`, `sort-button`, `filter-section`, `filter-add-button`, `filter-clear-all-button`, `filter-cancel-button`, `filter-apply-button`, `filter-row-<key>` (same for `sort-`), `select-column-field`, `select-operation-field`, `select-order-field`, `value-input-field`, `delete-icon`.

- The toolbar has no record count, "n selected" text or Delete rows button (the design moves selection to a bulk action bar that is not built). The grid has no row selection, cell edit, row expand/edit drawer or column menu yet: `Table/Grid` is read-only and its checkbox cells are disabled placeholders. Edit row drawer, cell edit menu and the column edit/delete flow were removed with the react-table grid and come back with their slices.
- Grid facts: one scroll element (`role="grid"`) for both axes, header sticky, pinned cells use `position: sticky` with the offset from TanStack. Preflight is off, so cell borders are `tw-border-0` plus one side. The refetch bar and 60% dimming show while `rowsRefetching` (context: `isFetching && !isLoading`). The virtualizer lives in `TableGrid`, which owns the scroll ref: created in a child it would miss the element on mount. Under jsdom it mounts no rows unless element sizes are mocked (see `Grid/__tests__/TableGrid.spec.tsx`). Column widths are not persisted yet and are keyed by column name, so `Table/index.jsx` keys the grid by table id to reset them on a table switch.
- Filter chips come from `queryFilters`; removing one writes the store and the rows query follows. `Filter`'s effect only drops (with a toast) a NULL value used with a non-`is` operator; the query already skips it. The Filter and Sort triggers are Rocket icon buttons inside a tooltip `<span>`: `OverlayTrigger` must keep the button as its direct child to anchor its popover.
- Filter and Sort popovers edit a local draft; only Apply writes `queryFilters` / `sortFilters` (new objects: the store is frozen). A fresh row opens when nothing is applied; Apply ignores empty rows. Picking a sort column defaults the order to ascending. The operator list is still the raw PostgREST set from `_helpers/constants`.
- Preflight is off: `tw-divide-x` gives every cell a 3px top and bottom border. `ConditionRow` uses `[&>*+*]:tw-border-0 [&>*+*]:tw-border-l` instead.
- Rocket `PopoverTrigger` does not forward a ref, so a tooltip cannot wrap it directly: put the tooltip on a `<span>` around the trigger.
- The history button is the only caller of `openMigrationHistory`; the drawer itself is mounted by `HeaderEnvironment`.

## Related modules

- `AppBuilder/QueryManager/QueryEditors/TooljetDatabase/` — writes `localStorage.tableDetails` to open this page on a table.
- `server/src/modules/tooljet-db/` — schema, migrations, PostgREST proxy.
