# Table widget (NewTable)

Context for the Table's **Add new row** form. The rest of the widget has no notes here yet. Conventions: `frontend/AGENTS.md`.

## Domain terms

- **Add new row form** — what the "Show add new row button" toggle opens: one row at a time, as a form (label above field), in the table or in a dialog. Replaced the old spreadsheet-style popup.
- **Placement** — `addNewRowIn`: `table` (popover inside the table, 66.6% wide up to 500px, 80% high) or `dialog` (500px wide, up to `min(80vh, 720px)`). Anything else resolves to `table`. The `table` popover dims the table behind it with its own overlay; the dialog uses Rocket's.
- **Multiple rows** — `allowAddingMultipleRows`. A saved app without the key means **on** (it could add several rows before); a newly dropped Table gets **off**. The "missing means on" fallback lives in code (`initSlice.js`), the `false` only in the widget definition defaults. Do not move it.
- **Columns to include** — `addNewRowColumns`: list of column keys, or unset for every eligible column.

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
- **Nested columns** (`metadata.team` under a `metadata` column) are left out when the parent column exists; a table with only the nested columns keeps them.
- **Removing a row** goes through `removeAddNewRowDetail` (re-indexes in one update). Clearing and refilling would let the form see an empty draft and seed a blank row.
- **Dialog:** the builder lifts Rocket dialogs to z-index 1050 (`MobileAutoLayoutToolbar.scss`), so menus use `tw-z-[1060]`, and the date calendar renders inside the dialog (`portalId`), not in `component-portal`. Menus render in portals: pass `darkMode` to them. Backdrop click does not close the dialog; Escape acts like Cancel.
- **Fonts:** the table renders in IBM Plex Sans. Do not use the Inter-based `tw-font-title-*`/`tw-font-body-*` utilities in the form; native inputs need `[font-family:inherit]`, and shadcn `Input`/`Textarea` need `md:tw-text-lg`.
- **Hooks kept for Cypress:** `save-button`, `discard-button`, `add-new-row-<n>` (the selected row), `add-another-row-button`, `<column>-column-<n>`, `<column>-column-header`, `add-new-rows-header`. Dropped: `add-new-rows-close-button` (the header `x` is gone).
- **Owned by other PRs, do not add here:** `disableAddNewRowSave`, `getDefaultCellValue` draft seeding, `isValid`, the popup `minHeight` floor (ToolJet#17759, ee-frontend#698).

## Tests

`_components/Footer/_components/__tests__/` (form, multi-row), `_utils/__tests__/`, `_stores/__tests__/`, `__tests__/integration/` (cancel event, saving against the real Table). Scenario IDs (`Table-ADDROWFORM-NNN`) are in the test titles; they are provisional until the Table contract (ee-frontend#698) takes them in.
