# Table widget (NewTable)

Context for the Table's **Add new row** form. The rest of the widget has no notes here yet. Conventions: `frontend/AGENTS.md`.

## Domain terms

- **Add new row form** — what the "Show add new row button" toggle opens: one row at a time, as a form (label above field), in the table or in a dialog. Replaced the old spreadsheet-style popup.
- **Placement** — `addNewRowIn`: `table` (popover inside the table, 66.6% wide up to 500px, 80% high) or `dialog` (500px wide, up to `min(80vh, 720px)`). Anything else resolves to `table`. The `table` popover dims the table behind it with its own overlay; the dialog uses Rocket's.
- **Multiple rows** — `allowAddingMultipleRows`. On by default, both for a saved app without the key (it could add several rows before) and for a newly dropped Table (`{{true}}` in the widget definition defaults); the "missing means on" fallback lives in code (`initSlice.js`). Do not default it to off: an app that relied on several rows would change behaviour.
- **Columns to include** — `addNewRowColumns`: list of column keys, or unset for every eligible column. It is never empty: the cog refuses to untick the last column ("Select at least one column."), and a saved list that matches no column counts as every column. The cog lists the table's live columns (store `columnProperties`, so dynamic columns too), not the saved `columns` property.

## Key files

| File | Role |
|---|---|
| `_components/Footer/_components/AddNewRow.jsx` | State, validation across rows, add/remove/select row, Cancel/save lifecycle; picks the placement |
| `.../AddNewRowForm.jsx` | Form shell (header, row picker slot, scrolling body, fixed footer) for both placements |
| `.../AddNewRowFields.jsx` | One control per column kind (`getFieldKind`); select/multiselect reuse the table's own menu classes |
| `.../AddNewRowPicker.jsx` | Row chips, `+`, "Row x of N", Remove row, overflow "…" menu |
| `_utils/addNewRowConfig.js` | Eligible columns, `hasColumnValidation` (drives the red `*` **and** what is validated), select options, date placeholder |
| `_utils/addNewRowChips.js` | Overflow rule for the chips (all up to 11 rows; else 1-9, "…", last) |
| `_utils/validateNewRowField.js` | The table cell's own validation, run on a draft value |
| `_stores/slices/initSlice.js` | Property allowlist (`setTableProperties`), `removeAddNewRowDetail` |
| `RightSideBar/Inspector/Components/Table/AddNewRowConfig/` | The cog popover that writes the three properties |

Events: `onNewRowsAdded` (payload `newRows`, every row in order), `onAddNewRowCancelled`. Exposed action: `discardNewlyAddedRows`.

## Invariants & gotchas

- **Never hand TanStack a fresh `data` array or `getCoreRowModel()` per render** in `AddNewRow.jsx`: it resets the page index, re-renders, and loops forever (the page froze when a select opened). `data` is memoised, the row model is module-level, `autoResetAll: false`. Test: ADDROWFORM-021.
- **`onNewRowsAdded` is awaited.** The store's `fireEvent` returns the runner's promise, and `RenderWidget` hands the real promise to the widget only for `AWAITED_EVENTS`; every other event still resolves at once. The form closes after success **and** failure; what to do on failure is the app's job.
- **All rows are sent together, all or none.** Add validates every row first. Only fields with a `*` are validated (`hasColumnValidation` is the single source for both).
- **`newRows` keeps the popup's shape.** Every row has a key for every table column (the selection and expansion columns and nested columns under an existing parent column aside), `''` until filled, **whether or not the form shows it** (`getNewRowPayloadColumns`). Select-like fields store what the table's own cells did: multiselect = array of option objects, tags = `{ label, value }` (an array when several are allowed), single select = the bare value (`toNewRowSelectValue`). A JSON field stores the parsed object or array; text that does not parse stays as typed and blocks Add row ("Invalid JSON…").
- **Nested columns' values live at their path** (`metadata.team` → `row.metadata.team`). Read with `lodash.get`, write with `lodash.set` on a copy; `utilityForNestedNewRow` never overwrites a filled leaf, so writing a flat dotted key sticks only the first character.
- **Errors are per row.** A row's errors show only after Add row was clicked while that row existed; a row added afterwards starts clean.
- **Inside a Form widget** the Rocket `Button` (no default `type`) is a submit button and Enter in an input would click it. Every button here is `type="button"` and Enter in an input is swallowed by the form's `onKeyDown`.
- **Nested columns** (`metadata.team` under a `metadata` column) are left out when the parent column exists; a table with only the nested columns keeps them.
- **Removing a row** goes through `removeAddNewRowDetail` (re-indexes in one update). Clearing and refilling would let the form see an empty draft and seed a blank row.
- **Dialog:** the builder lifts Rocket dialogs to z-index 1050 (`MobileAutoLayoutToolbar.scss`), so menus use `tw-z-[1060]`, and the date calendar renders inside the dialog (`portalId`), not in `component-portal`. Menus render in portals: pass `darkMode` to them. Backdrop click does not close the dialog; Escape acts like Cancel.
- **Fonts:** the table renders in IBM Plex Sans. Do not use the Inter-based `tw-font-title-*`/`tw-font-body-*` utilities in the form; native inputs need `[font-family:inherit]`, and shadcn `Input`/`Textarea` need `md:tw-text-lg`.
- **Hooks kept for Cypress:** `save-button`, `discard-button`, `add-new-row-<n>` (the selected row), `add-another-row-button`, `<column>-column-<n>`, `<column>-column-header`, `add-new-rows-header`. Dropped: `add-new-rows-close-button` (the header `x` is gone).
- **Owned by other PRs, do not add here:** `disableAddNewRowSave`, `getDefaultCellValue` draft seeding, `isValid`, the popup `minHeight` floor (ToolJet#17759, ee-frontend#698).

## Tests

`_components/Footer/_components/__tests__/` (form, multi-row), `_utils/__tests__/`, `_stores/__tests__/`, `__tests__/integration/` (cancel event, saving against the real Table). Scenario IDs (`Table-ADDROWFORM-NNN`) are in the test titles; they are provisional until the Table contract (ee-frontend#698) takes them in.
