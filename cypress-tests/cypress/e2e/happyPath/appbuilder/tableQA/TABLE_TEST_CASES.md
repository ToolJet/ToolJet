# Table widget: manual/exploratory UI test cases

This folder is the exploratory UI test suite behind the three Table test reports. Each spec builds a Table through the component API with an exact configuration (data, columns, properties, styles, queries, events), opens it in the real editor (or preview / a released app) and drives it the way a user would, then **records what happened**. Confirmed defects were triaged by hand and logged with steps, expected and actual results.

| Report | Bugs | Link |
|---|---|---|
| Part 1: data, column types, editing, search/filter/sort, pagination, selection, download, styles, validation, add new row | 64 | https://claude.ai/artifact/DPMxcBvWNojjyb1sgYWF9z |
| Part 2: events, Excel/PDF, Button column, options, deprecated types, inspector, viewer, contextual edits | 10 | https://claude.ai/artifact/LkCcYqdaJR4bERUDwRzbBY |
| Part 3: query-fed data, server-side pagination, component actions, accessibility, transformations, containers, large data, editor ops, publish, collaboration | 13 | https://claude.ai/artifact/LJpmD56hMV9c2Qtz1iVPj3 |

> **Not a CI suite.** Specs use the `.qa.js` extension so the regular Cypress configs (`**/*.cy.js`) never pick them up. Most specs are observe-only (they write JSON to `logs/` rather than asserting), and several deliberately exercise known bugs. Turning a confirmed bug into a regression test means copying its case into a normal `.cy.js` spec with an assertion on the expected behaviour.

## How to run

Prerequisites: ToolJet running locally (frontend `http://localhost:8082`, backend `http://localhost:3000`), `cypress-tests/node_modules` installed (`npm ci`), and a `cypress.env.json` with `server_host`.

```bash
cd cypress-tests
# one spec (serialised by a lock; hang guard kills a run after TQ_MAX seconds, default 1200)
./tqrun.sh cypress/e2e/happyPath/appbuilder/tableQA/V6-edit-all.qa.js
# every A*/V* spec, one after another, one summary line per spec in tableQA/logs/summary.txt
./tqbatch.sh
# timezone runs: the browser inherits TZ
TZ=America/Los_Angeles CYPRESS_TQ_TZ=LA ./tqrun.sh cypress/e2e/happyPath/appbuilder/tableQA/V22b-recheck.qa.js
```

Never run two Cypress invocations at once; parallel runs corrupt `node_modules/.cache`. Raw observations land in `tableQA/logs/*.json`. `node v3diff.js` / `node v5diff.js` print expected-vs-observed for the validation matrices.

**Reports:** `findings*.jsonl` hold the logged bugs. `node render.js` builds `report-build.html` (Part 1). `source env2.sh && node render.js` builds Part 2, and `env3.sh` builds Part 3. `node log.js < finding.json` appends one finding and re-renders.

## Harness

`_harness.js` → `tq.app({...})` creates an app with `table1` in one API call, then opens the editor:

| Option | What it does |
|---|---|
| `data`, `columns` (`col(key, type, extra)`), `props`, `styles` | Exact table configuration. Passing `columns` turns auto-generation off. |
| `probes: { name: "{{expr}}" }` | Text widgets that expose `components.table1.*` for reading. |
| `queries: [{ name, code, runOnPageLoad }]` | RunJS queries. Don't name a RunJS variable `page`, because RunJS already defines it. |
| `events: [{ eventId, message }]` / `{ eventId, runQuery: "q1" }` | Event handlers (show-alert or run-query). Button columns need `eventType: "table_column"`, `eventId: "onClick"`, `ref: "<colKey>::<buttonId>"`. |
| `extra: { name: { type, parent, properties, layout } }` | Extra widgets. `parent: "TABLE"` targets the table's own sub-canvas. |
| `parent` | Put the table inside a Container or ListView. |

`_obs.js` has the observation helpers (`cellFacts`, `styleOf`, `probe`, `recorder`). `inventory.json` is the code-derived inventory of every property, style and validation field for all 15 column types; the edit, style, validation and add-row matrices were built from it.

**Pitfalls learned:**
- Table headers render a tick after the widget box, so DOM reads need a retry.
- Drag-in tables preselect row `{"id":1}`. Specs that test selection set `defaultSelectedRow` to `{{undefined}}`.
- `changeSet` is keyed by row index.
- Hidden widgets are still visible (faded) in the editor.
- The first header click sorts number/boolean columns descending.
- The table follows the **app** theme (`globalSettings.appMode`), not the editor's dark-mode toggle.
- Release needs save → promote to staging → promote to production → release.
- Row-context children (`rowData`/`listItem`) must be dropped through the UI (`cy.dragAndDropWidget(..., "#canvas-<tableId>")`).

## Coverage summary

| Area | Covered |
|---|---|
| Data & columns | Auto-generation on/off × data shapes (nested, arrays, nulls, dotted/unicode keys, empty, non-array, 500 rows), rename/reorder/visibility/fx, dynamic columns, transformations |
| Column types (15) | Display of every type × value variants; all type-specific options (decimals, formats, time, timezone, unix s/ms, options/labels/colours, link text/target, image fit/radius, rating icon/max/half, JSON indent, tags sort/multi) |
| Editing | Every editable type: shown value, `changeSet` / `dataUpdates` / `updatedData` shape and type, Escape, Enter, blur, per-row fx editability, discard, save, Date Picker pick/type/clear under every property combination |
| Validation | 47 cases: length/regex/value/custom rule/min-max date & time/disabled dates across String, Text, Number, Select, MultiSelect, Tags, Date Picker; read-only vs editable; empty/numeric data; conflicting config; message truncation; live vs blur feedback; `rowData` rules |
| Add new row | Popup per type, initial `newRows`, typed values per type, defaults, read-only/hidden/fx columns, validation + save, add another / discard / close |
| Search, filter, sort | Search per type and special characters, all 12 operators × types, multi-filter, remove/clear, sort per type, server-side flags, contextual edits under sort/page/search |
| Pagination & selection | Rows-per-page matrix, go-to-page, `setPage` edges, single/bulk selection, select-all scope, deselection, expandable rows and their children |
| Events & actions | All 15 table events plus the Button column click; every component action with good and bad arguments |
| Download | CSV/Excel/PDF content under search/filter/sort, nested/JSON/select/date columns, action columns, hidden columns |
| Styles | Common styles on 14 types, every type-specific style, container styles, pinning, column size, fx per-row colours, dark mode |
| Query-fed & server-side | Loading, refresh, data change vs edits/selection/page; server-side paging with search, sort and filter via a real query |
| Scale & layout | 5,000 rows (virtualisation, scroll, far edits, select all, search latency), containers, ListView, two tables, mobile preview, overflow |
| Editor & publish | Column drag-resize persistence, copy/paste, duplicate, undo/redo, export→import round trip, inspector fields per type, preview, promote/release, public app opened logged out, second-session edits |
| Accessibility | Roles, names on icon buttons, `aria-sort`, focus and keyboard editing |

**Inconclusive / not covered:**
- Pasting from the system clipboard into a cell: real Cmd+V did not land under automation.
- A separately invited viewer-role user: this needs an invite-token step that goes through the database. The public-app, logged-out path was used instead.

## Test cases by area

Titles are taken verbatim from the specs. `…` marks a value filled in by a data-driven loop. Tests titled `BUG CHECK` / `BUG-CANDIDATE` pass when the bug is present; they document current behaviour.

### A1 Data & column generation

**`A1-autogen-datashapes.qa.js`** — A1 Data & column generation: autogenerate on/off (+ nested generation) x data shapes.

- autogenerate ON: …
- BUG-CANDIDATE: a top-level key containing a literal dot renders an EMPTY cell, not its value
- autogenerate ON: unicode keys render header TEXT correctly (data-cy may collapse)
- autogenerate ON: empty array -> no columns, table shows empty state
- autogenerate ON: non-array data (object) -> no columns generated
- autogenerate ON: non-array data (string) -> no columns generated
- autogenerate ON: non-array data (null) -> no columns generated
- autogenerate ON: 1 row renders exactly 1 data row
- autogenerate ON: 500 rows -> footer count is accurate, first page paginated
- autogenerate OFF (explicit columns): schema is locked even if data shape changes
- autogenerate OFF with an EMPTY explicit columns array still auto-generates once (documented escape hatch)

**`A1-column-properties.qa.js`** — A1 Data & column generation: column properties (name vs key, rename, reorder, visibility+fx,

- Column name (label) differs from key (accessor): header shows name, cell keyed by name-normalized selector reading key's data
- Rename (change name, key unchanged): header updates, data still resolves via key
- Reorder: DOM header order follows the columns array order, not data key order
- Visibility off (columnVisibility=false): column fully absent from header + cells
- Visibility via fx (truthy expression): column renders
- Visibility via fx (falsy expression): column is hidden
- columnDeletionHistory: a key marked deleted is excluded from autogeneration even though present in data
- Transformation: simple uppercase transform is applied to the displayed cell
- Transformation returning '' (empty string): cell shows empty, not the original value
- Transformation returning null: silently falls back to the ORIGINAL value instead of blanking the cell
- Transformation returning an object: StringRenderer stringifies it (no crash) but shows unhelpful '[object Object]'

**`A1-dynamic-columns.qa.js`** — A1 Data & column generation: useDynamicColumn + columnData.

- renders exactly the columnData-defined columns, in order, keyed by their own key
- columnData key with no matching data field renders an empty cell (not an error)
- empty columnData array -> zero columns render (table is column-less, not an error state)
- BUG-CANDIDATE: if the FIRST columnData item lacks a `name`, ALL dynamic columns vanish, not just that one
- switching useDynamicColumn back off falls back to the static `columns` schema

**`A1-general-props.qa.js`** — A1 Data & column generation: title, visibility, disabledState, loadingState, collapseWhenHidden.

- loadingState=true: shows a loading spinner instead of rows, header still renders
- loadingState=false (default): rows render normally
- disabledState=true: table root carries data-disabled=true
- disabledState=false (default): table root carries data-disabled=false
- visibility=false: the Table widget is not rendered on canvas
- visibility=false + collapseWhenHidden=true: hidden widget collapses its layout space
- title: exposing a Title still allows normal rendering (no crash / no stray text in header row)

**`A1-manage-columns-footer.qa.js`** — A1 Data & column generation: manage-columns menu, footer record count accuracy,

- Manage columns menu can hide a column client-side without changing the footer record count
- Manage columns 'Selects All' toggles every column back and forth
- Footer record count matches the SEARCH-filtered row count, not the full dataset
- currentData exposed variable equals the full raw input data (not the filtered/paginated subset)
- filteredData exposed variable's length equals the footer record count after a search


### A2 Column types (display)

**`A2-boolean-link-image.qa.js`** — Test-infra workaround (not a product bug): _harness.js's tq.app() reads Cypress.env("appId")

- valid URL: href set, text = url, opens in new tab by default
- displayText overrides the visible text but keeps href
- Open in new tab = false -> target=_self
- null value -> anchor renders with empty href (potential dead-link click target)
- javascript: URL is passed straight through to href
- wrong type (number) is stringified for display text when no href given weirdness
- valid URL renders an img with that src
- null/empty value renders no img (ImageRenderer returns null for falsy value)
- objectFit option is applied to the img style
- borderRadius option is applied to the img style
- broken image URL still sets src (browser shows broken-image icon, no crash)
- width/height column keys ARE honored by the renderer even though the inspector has no field for them

**`A2-datepicker.qa.js`** — Test-infra workaround (not a product bug): _harness.js's tq.app() reads Cypress.env("appId")

- ISO date string parses via ISO fallback and displays per dateFormat (default DD/MM/YYYY)
- value matching parseDateFormat exactly is parsed strictly
- dateFormat=MM/DD/YYYY changes only the display, not the parse
- null value -> blank cell (not \
- undefined value -> blank cell
- empty string value -> blank cell
- wrong type: unparsable string shows literal \
- wrong type: object value shows literal \
- unix timestamp (seconds) is parsed and displayed
- unix timestamp (milliseconds) is parsed and displayed
- isTimeChecked appends time to the display using the 12hr format by default
- isTwentyFourHrFormatEnabled shows 24hr time instead of AM/PM
- isDateSelectionEnabled=false with isTimeChecked=true shows time only

**`A2-json-markdown-html.qa.js`** — Test-infra workaround (not a product bug): _harness.js's tq.app() reads Cypress.env("appId")

- valid object renders formatted key/values
- jsonIndentation=true pretty-prints with newlines
- null value renders blank
- invalid JSON string is shown as-is (no crash, no \
- HTML-special chars inside a JSON string value render as inert text, never as elements
- markdown syntax is rendered (bold)
- null value renders blank
- raw <script> is never rendered as a live script element
- raw HTML tags are not rendered as real elements by default (no rehype-raw)
- valid plain text renders as-is
- HTML tags are rendered as real elements
- null value renders blank
- script tags are sanitized out by DOMPurify
- dangerous event handler attributes are stripped by DOMPurify

**`A2-rating-button.qa.js`** — Test-infra workaround (not a product bug): _harness.js's tq.app() reads Cypress.env("appId")

- renders exactly maxRating icons regardless of value
- value N fills exactly N icons (default maxRating=5)
- null value with no defaultRating shows 0 filled icons
- null value falls back to defaultRating
- undefined value falls back to defaultRating
- value 0 shows 0 filled icons (not defaultRating)
- wrong type (non-numeric string) falls back to defaultRating, no crash
- value greater than maxRating fills all icons, no crash
- negative value shows 0 filled icons, no crash
- renders the configured label
- missing/empty label falls back to the literal \
- buttonVisibility=false hides the button
- buttonVisibility as a falsy-but-not-boolean value (0) still SHOWS the button 
- disableButton disables the button

**`A2-select-multiselect-tags.qa.js`** — Test-infra workaround (not a product bug): _harness.js's tq.app() reads Cypress.env("appId")

- valid value shows the matching label
- value not present in options renders blank (not the raw value)
- null value renders blank
- optionColor sets the chip background
- wrong type (array) for a single-select value renders blank, no crash
- valid array of values shows both labels
- a value not present in options is silently dropped from the chips (no error, no raw value shown)
- null value renders no chips
- empty array renders no chips
- wrong type (single string, not array) - still resolves matching option
- valid single value shows the matching label
- value not present in options is fabricated as an ad-hoc tag showing the raw value 
- multi-select tags: valid array shows all labels
- null value renders blank

**`A2-string-number-text.qa.js`** — Test-infra workaround (not a product bug): _harness.js's tq.app() reads Cypress.env("appId")

- decimalPlaces truncates (does not round) excess decimals
- decimalPlaces=0 shows integer part only
- decimalPlaces with a value that has no decimal part is unaffected


### A3 Editing, changeSet, add row, validation

**`A3-add-new-row.qa.js`** — A3: Add new row popup -- fields per type, read-only/hidden columns, nested keys,

- typing into the popup's blank row updates the `newRows` exposed variable live
- BUG CHECK (docs say Save clears newRows, same as Discard): clicking Save does NOT clear the `newRows` exposed variable
- Discard DOES clear the `newRows` exposed variable
- 'Add another row' (+) button adds a second blank row, and both rows are captured in newRows
- a column that is NOT editable in the main table IS still editable inside the Add new row popup
- a hidden column (columnVisibility=false) is excluded from the Add new row popup
- a nested-key column (user.name) renders and is editable in the Add new row popup

**`A3-changeset-actions.qa.js`** — A3: Save changes / Discard changes buttons (showBulkUpdateActions), discard

- Save/Discard buttons are absent with no pending edits, and appear once a cell is edited
- Discard changes restores the original displayed value and clears changeSet
- Save changes clears the changeSet and the Save/Discard buttons disappear
- showBulkUpdateActions=false: editing a cell tracks changeSet, but no Save/Discard buttons ever render
- default (selectRowOnCellEdit=false): clicking into an editable cell does NOT select the row
- selectRowOnCellEdit=true: clicking into an editable cell DOES select that row

**`A3-inline-edit.qa.js`** — A3: inline editing for string/text/number/boolean columns -- verifies the value

- string column: edited value shows in cell and in changeSet/dataUpdates/updatedData as a string
- text column: same edit contract as string
- string column: clicking into a cell and clicking away WITHOUT typing does not create a changeSet entry, and does not corrupt raw HTML-looking or entity-looking text
- number column: typed digit-string commits as a real number in changeSet (type coercion)
- number column: up/down stepper arrows produce a number in changeSet, not a string
- boolean column: toggling the checkbox flips the value and changeSet holds a boolean

**`A3-rich-types-edit.qa.js`** — A3: inline editing for select / newMultiSelect / tagsV2 / tags(v1) / rating / json /

- select column: choosing an option shows its label and commits to changeSet
- newMultiSelect column: picking two options shows both labels and commits to changeSet as an array
- BUG CHECK: a 'tags' column (legacy, distinct from tagsV2) never renders the row's actual tag data
- clicking the 3rd star sets the rating to 3 in changeSet
- editing a JSON cell commits a JSON STRING (not an object) to changeSet
- BUG CHECK: editing a nested-key column (key='user.name') writes a literal flat 'user.name' key into changeSet/updatedData, leaving the real nested user.name untouched
- picking a day in the calendar commits a formatted DISPLAY STRING (not an ISO date) to changeSet

**`A3-validation.qa.js`** — A3: per-column validation (regex, min/max length, min/max value, custom rule) --

- string column: value shorter than minLength is flagged invalid with the expected message
- string column: value longer than maxLength is flagged invalid
- string column: regex mismatch is flagged invalid ('The input should match pattern')
- BUG CHECK: a customRule written as a plain boolean expression (the inspector's own placeholder example) never marks the cell invalid, only a non-empty STRING result does
- customRule returning a non-empty string DOES mark the cell invalid, using that string as the message
- Save changes is still possible (not blocked) even while a cell shows the invalid state
- number column: value below minValue is flagged invalid
- number column: value above maxValue is flagged invalid
- BUG CHECK: a date exactly equal to minDate is incorrectly rejected as invalid (should be a valid boundary value)
- DOCS GAP CHECK: setting column.mandatory=true on a blank string cell does not mark it invalid (Table's per-column validation UI has no Mandatory field and adapters never forward it)


### A4 Search, filter, sort

**`A4-filter.qa.js`** — A4 Search, filter, sort — FILTER sub-area.

- contains / does not contain / matches / does not match / equals / does not equal
- is empty / is not empty on a string column (values: real text vs \
- number column: 0 is a real value, not \
- boolean column: false is a real value, not \
- number column: gt / lt / gte / lte
- STRING column holding numeric-looking text: gt/lt against a numeric-string filter value
- filter value input compares against the raw stored VALUE, not the displayed label
- null column values with contains / equals / is empty
- two filters combine with AND
- removing one filter (x) re-applies the remaining ones; clear all restores all rows
- `filters` exposed variable reflects applied filter values
- search and filter both apply (AND) to the visible rows

**`A4-search.qa.js`** — A4 Search, filter, sort — SEARCH sub-area.

- matches per column type: string, number, select(label!=value), boolean, json, nested key
- string column: highlight wraps the matched substring in <mark>
- number column: highlight wraps the matched substring in <mark>
- datepicker column: search against the DISPLAYED (formatted) date text
- regex special characters ( [ * ? + are treated as LITERAL substrings, not regex
- unicode characters are matched
- whitespace-only term and leading/trailing spaces
- clear icon empties the search box and restores all rows
- footer-number-of-records reflects the SEARCH-FILTERED row count, not the total
- searching while on page 2 (client-side, default) — does the current page reset to 1?

**`A4-sort.qa.js`** — A4 Search, filter, sort — SORT sub-area.

- string column: asc -> desc -> none, case-insensitive and unicode-aware ordering
- number column: numeric order (not lexicographic) and nulls placement
- number column: numeric strings as data sort numerically via the number sortingFn
- boolean column: false before true (or vice versa) and toggles on repeat click
- select column (label != value): sorts by the raw stored VALUE, not the displayed label
- datepicker column: chronological order despite a display-format string, regardless of raw storage order
- sorting re-sorts the FULL dataset, then paginates (page 1 shows the new extremes)
- sortApplied reflects column/direction while sorted, and clears on the third click
- serverSideSort=true: clicking a header does NOT reorder the rows client-side
- serverSideFilter=true: adding a filter does NOT remove rows client-side
- serverSidePagination=true: all rows render on one page regardless of rowsPerPage


### A5 Pagination, selection, expandable rows

**`A5-expandable.qa.js`** — Under heavy shared-environment load, cy.wait('@getAppData') inside the shared

- enableExpandableRows=false: no expansion toggle column is rendered
- enableExpandableRows=true: clicking the toggle expands the row, clicking again collapses it
- multiple rows can be expanded at the same time
- expansionHeight controls the expanded container's rendered height
- default expansionHeight (229) is applied when not overridden
- expanding a row, then changing page, auto-collapses all expanded rows (state is cleared, not just off-screen)
- expanding a row, then sorting, auto-collapses all expanded rows

**`A5-pagination.qa.js`** — Under heavy shared-environment load (many agents' tqrun.sh queued back to back),

- … -> first page shows … row(s), footer shows "… Records", all rows reachable
- rowsPerPage=0 on 10 rows: table should not silently blank
- rowsPerPage=-5 (negative) on 10 rows: table should not silently blank
- rowsPerPage="abc" (non-number) on 10 rows: table should not silently blank
- 250 rows, rowsPerPage=10: 25 pages, last page has the remainder, jump-to-last works
- 251 rows, rowsPerPage=10: last page has exactly 1 (remainder) row
- enablePagination=false: all rows render in one shot, no pagination section
- enablePagination=false: footer record count should still be shown to the user
- clicking page number '3' of 3 navigates directly and marks it selected
- setPage(0): pageIndex should not be forced below 1
- setPage(999) (beyond last page of 3): should clamp to the last real page, not go blank
- setPage("abc") (non-numeric): should be a no-op, not corrupt pagination
- on page 3 of a 4-page table, searching down to 2 matches should reset to page 1
- totalRecords=37, serverSideRowsPerPage=10: page count derives to 4, jump-to-last lands on page 4
- enableNextButton=false disables next even though there would be more server-side pages
- enablePrevButton=false disables prev even after navigating past page 1
- enableNextButton/enablePrevButton as fx expressions respond to pageIndex
- server-side pagination without totalRecords/serverSideRowsPerPage: only current page shown, no first/last jump

**`A5-priority.qa.js`** — No default preselected row (the drag-in default {"id":1} makes a first click deselect row 0).

- rowsPerPage=0 on 10 rows
- selecting Charlie (index 0), then sorting, should keep CHARLIE selected, not whichever record lands at index 0
- clicking the checkbox with allowSelection=false
- footer with pagination off
- setPage(0) on an 11-row, 3-page table

**`A5-selection.qa.js`** — No default preselected row (the drag-in default {"id":1} makes a first click deselect row 0).

- allowSelection=false: the row checkbox should not be an interactive selector
- allowSelection=true, showBulkSelector=false (default): row click selects, and is single-select
- showBulkSelector=true: clicking multiple rows keeps all of them selected
- header checkbox selects all rows on the CURRENT PAGE only (not all pages)
- selectAllRows CSA selects across ALL pages, not just the current page
- selectAllRows CSA with a search filter active should only select the FILTERED (visible) rows
- highlightSelectedRow=true adds the 'selected' class to the clicked row
- highlightSelectedRow=false: selecting a row must not add the 'selected' highlight class
- defaultSelectedRow with a valid id pre-selects that row on load
- defaultSelectedRow with a non-existent id selects nothing (selectedRow/{}, selectedRowId/null)
- defaultSelectedRow with multiple keys only honours the FIRST key (rest ignored)
- disableRowDeselection=true blocks deselection via ROW click
- disableRowDeselection=false (default) allows a second row click to deselect
- disableRowDeselection=true: clicking the CHECKBOX directly should ALSO be blocked from deselecting, same as a row click
- clicking the row body sets selectedRow/selectedRowId and fires onRowClicked
- clicking the checkbox also sets selectedRow/selectedRowId consistently
- selecting a row, then sorting: does the SAME RECORD stay selected, or does selection stick to the row's old position?


### A6 Download, action buttons, events, CSAs

**`A6-actionButtons.qa.js`** — A6: Action buttons (props.actions — position left/right, text, colors, disabled fx)

- renders left and right action columns per `position`, with the given button text/colors
- clicking an action button exposes selectedRow/selectedRowId for THAT row before firing
- disableActionButton fx disables the button per-row
- an empty `actions` array renders no action column (no leftover empty header)
- renders one button per configured entry and reflects buttonLabel/buttonType
- clicking a button-column button exposes selectedRow/selectedRowId for that row
- disableButton fx disables the button per-row via row context
- buttonVisibility fx hides individual buttons per row without removing the column

**`A6-csa.qa.js`** — A6: Table CSAs (frontend/src/AppBuilder/WidgetManager/widgets/table.js:554-676

- setPage moves to the given page
- selectRow selects the row matching key/value and exposes it
- BUG CHECK: deselectRow has no Key/Value params in the Inspector, so it always clears row 0
- selectRows selects every row whose key matches one of the given values
- deselectRows clears selection for every row whose key matches one of the given values
- selectAllRows selects every row
- deselectAllRows clears every row's selection
- setSort sorts by the given column and direction
- setFilters filters rows down to the given condition
- clearFilters restores the full row set after a filter was applied via the UI
- discardChanges reverts unsaved inline edits
- discardNewlyAddedRows clears the pending add-new-row buffer and closes the panel
- downloadTableData('…') downloads a file of the right type
- setDisable(true) disables the table
- setLoading(true) shows the loading state
- setVisibility(false) hides the table
- BUG CHECK: bad args — selectRow with a non-existent key/value clears selection instead of leaving it unchanged

**`A6-download.qa.js`** — A6: Download content correctness — showDownloadButton x CSV/Excel/PDF, crossed with

- downloads correct content as …
- BUG CHECK: nested column (dot-path key) exports blank instead of the resolved value
- BUG CHECK: JSON/object column serialises as [object Object] instead of the JSON text
- BUG CHECK: select column exports the stored value, not the displayed label
- BUG CHECK: datepicker column exports the raw stored value, not the display format
- hidden columns (toggled off via Manage columns) are still included in the download
- action-button column (props.actions) is not included as a junk column in the download
- search/filter/sort active: download still contains rows that don't match the current view

**`A6-events.qa.js`** — A6: Table events (frontend/src/AppBuilder/WidgetManager/widgets/table.js:356-370

- onSearch fires exactly once per keystroke-settle
- onSort AND onHeaderClick both fire exactly once from the same header click
- onRowClicked fires exactly once per row click
- onRowHovered fires exactly once per hover
- onCellValueChanged fires exactly once when an editable cell is committed
- onBulkUpdate (Save changes) fires exactly once
- onCancelChanges (Discard) fires exactly once
- onFilterChanged fires exactly once when a filter is applied
- onPageChanged fires exactly once per pagination click
- onNewRowsAdded fires exactly once when a new row is saved
- onRefresh fires exactly once
- BUG CHECK: wiring 'Download data' silently replaces the CSV/Excel/PDF popup — no file is produced


### A7 Styles & layout states

**`A7-column-styles.qa.js`** — A7 Styles & layout states: per-column style overrides (Inspector -> Columns -> <col> -> Styles tab)

- per-column textColor overrides the table default for a … column
- cellBackgroundColor paints the cell background regardless of column type
- horizontalAlignment=… sets cell justify-content + text-align
- horizontalAlignment on a boolean column aligns the checkbox without erroring
- columnSize sets the column (th + td) pixel width
- invalid horizontalAlignment value does not crash and leaves alignment unstyled
- fx-bound per-column textColor is resolved per row (getResolvedValue)
- Matrix cases (1): string (number)

**`A7-container-styles.qa.js`** — A7 Styles & layout states: table-level style keys -> computed CSS.

- tableType=… sets the row-style class on <table>
- cellSize=… sets row min-height to …
- headerCasing=… sets header text-transform to …
- columnHeaderWrap=fixed truncates the header (text-truncate, nowrap)
- columnHeaderWrap=wrap wraps the header (wrap-wrapper, normal)
- contentWrap off: row max-height/height driven by cellSize only
- contentWrap on + maxRowHeight auto: row max-height is fit-content (not clipped)
- contentWrap on + maxRowHeight custom + maxRowHeightValue: row max-height equals the custom value
- maxRowHeightValue: non-numeric value produces an invalid max-height (no clamp, no error)
- columnTitleColor + columnBackgroundColor paint the header cell (th)
- textColor (table default) paints cell text when the column has no per-column color override
- containerBackgroundColor paints the table container background
- borderColor paints the table container border
- borderRadius: valid numeric value applies px radius
- borderRadius: non-numeric value silently drops the radius instead of erroring
- boxShadow applies a custom shadow to the table container
- padding=default: record baseline cell spacing for comparison against padding=none
- padding=none has no observable effect on cell spacing vs default (dead control)
- actionButtonRadius controls row action-button border radius
- selectedRowColor paints a selected row when allowSelection + highlightSelectedRow are on
- dark theme: table root switches from light-theme to dark-theme class

**`A7-layout-states.qa.js`** — A7 Styles & layout states: dynamicHeight, visibility/collapseWhenHidden, disabledState, loadingState,

- visibility=false hides the table (display:none) in the editor
- disabledState blocks interaction: table becomes inert + data-disabled
- loadingState shows the loading spinner, hides rows, and collapses the header to a shimmer
- hideColumnSelectorButton hides only the manage-columns button
- header bar collapses when both search and filter are hidden
- header bar shows when only one of search/filter is enabled
- footer collapses when pagination, add-row, download, refresh are off and column selector is hidden
- footer stays visible when only showRefreshButton is on (others off)
- long text: contentWrap off truncates the cell (overflow-hidden class, nowrap)
- long text: contentWrap on wraps the cell (wrap-wrapper class, not overflow-hidden)
- dynamicHeight=true, few rows (view mode): measure height
- dynamicHeight=true, many rows (view mode): height is at least as tall as few rows
- dynamicHeight=false, few rows (view mode): measure height
- dynamicHeight=false, many rows (view mode): height stays fixed regardless of row count


### Verification

**`V1-verify.qa.js`** — Verification spec for ambiguous failures (orchestrator-owned).

- exposed isVisible/isDisabled/isLoading at mount
- filter 'is empty' on string column
- removing one of two filters re-applies the remaining one

**`V2-verify.qa.js`**

- literal dot key value renders
- nested 1 level headers


### Column-type validation

**`V3-validation.qa.js`** — Column-type validation matrix. Observes every case (no fail-fast) and writes logs/v3-results.json;

- group …: …
- edit flow: typing an invalid value shows the error, fixing it clears it (string minLength 5)
- Matrix cases (35): s-minlen-short (string), s-minlen-ok (string), s-minlen-empty (string), s-minlen-null (string), s-minlen-numeric-data (string), s-maxlen-long (string), s-maxlen-numeric-data (string), s-regex-fail (string), s-regex-ok (string), s-regex-broken (string), s-custom-msg (string), s-minlen-nonnumeric (string), s-min-gt-max (string), s-readonly-invalid (string), s-long-msg (string), t-regex-fail (text), t-minlen-short (text), n-min-fail (number), n-min-zero (number), n-max-zero (number), n-max-fail (number), n-min-null (number), n-regex-fail (number), n-min-string-data (number), n-min-gt-max (number), n-readonly-invalid (number), sel-custom (select), sel-readonly (select), msel-custom (newMultiSelect), tags-custom (tagsV2), d-min-fail (datepicker), d-max-fail (datepicker), d-disabled-date (datepicker), d-custom (datepicker), d-readonly-invalid (datepicker)

**`V5-validation-gaps.qa.js`** — Column-type validation matrix. Observes every case (no fail-fast) and writes logs/v5-results.json;

- group …: …
- row-scoped custom rule uses rowData
- Matrix cases (12): t-maxlen-long (text), t-custom (text), n-custom (number), n-min-decimal (number), n-max-string-data (number), n-minlen-fx (string), sel-custom-value-var (select), tags-custom-value-var (tagsV2), d-mintime (datepicker), d-maxtime (datepicker), d-timeformat-dead (datepicker), s-editable-fx-false (string)


### Date Picker editing

**`V4-datepicker-edit.qa.js`** — Editable Date Picker column: every inspector property x pick/type/clear. Observe-only; writes logs/v4-results.json.

- pick day 20: …
- time-only (Enable date selection off, Show time on)
- disabled dates in the column's own format (DD/MM) vs MM/DD
- minimum / maximum date in the calendar
- type into input: …


### Edit, every column type

**`V6-edit-all.qa.js`** — Edit every editable column type through the UI; record shown value, changeSet, updatedData. Observe-only.

- …: type new value, blur
- json: edit to valid JSON, then to invalid JSON
- string: Escape while editing
- number: type, stepper up/down, decimalPlaces
- …: open and pick …
- boolean: toggle
- rating: click 5th star, then half-star column
- link / image / button with Make editable on
- per-row editability via fx: {{rowData.id === 1}}
- Make all columns editable (table prop) with a column set not editable
- edit then Discard changes restores every edited type

**`V6b-edit-recheck.qa.js`** — Re-checks for V6 ambiguities. Probes escape '<' so the Text widget cannot render HTML.

- text: newline typed with shift+enter
- markdown: commit via blur to another cell, and via Enter
- html: saved value keeps tags?
- json: valid edit and invalid edit (typed without special-sequence parsing)
- tags with Allow multiple selection on: pick adds a tag
- per-row editability fx and Make all columns editable
- Make all columns editable overrides per-column false?
- string: Escape cancels edit?


### Add new row, every column type

**`V7-addrow-all.qa.js`** — Add new row popup for every column type: inputs, newRows shape, defaults, validation, save/discard. Observe-only.

- popup renders an input per type + initial newRows (defaults)
- typing per type lands in newRows with the right type
- read-only, hidden and fx-editable columns in the popup
- validation inside the popup (string min length 5, number min 10)
- add another row, remove, discard
- close (x) keeps or drops typed rows?
- Matrix cases (4): cstring (string), cselect (select), cbool (boolean), chtml (html)


### Styles, every column type

**`V8-styles-all.qa.js`** — Styles for every column type: common (textColor, cellBackgroundColor, horizontalAlignment, pin, size) + type-specific. Observe-only.

- common styles on every type (align …)
- type-specific: boolean toggle colours
- type-specific: link colour, underline colour, underline always, display text, target
- type-specific: rating icon, max, half star, colours
- type-specific: image radius + fit, number decimals, json indentation
- type-specific: tags sort a-z / z-a, single selection, auto colours; select auto colours
- pin left/right, column size, fx colours per row

**`V8b-styles-recheck.qa.js`** — Re-check V8 ambiguities by locating the deepest element that contains the value text.

- text colour on the element holding the value, editable and read-only
- boolean toggle colours (read-only and editable), image radius, tags sort with multi on, select auto colours


### Button column, options, deprecated types

**`V9-button-options-deprecated.qa.js`** — Button column, dynamic options, default option, deprecated types. Observe-only -> logs/v9-results.json

- button column: properties and styles per button
- button column: click fires its event with the clicked row
- dynamic options + loading state; default option
- deprecated column types still render existing data

**`V9b-button-default.qa.js`**

- button column click fires onClick with the clicked row
- default option on existing null value vs data


### Events

**`V10-events.qa.js`** — Every Table event: fires? how many times? exposed values at fire time? Observe-only -> logs/v10-results.json

- onRowClicked (message reads selectedRow at fire time)
- onRowHovered
- onCellValueChanged (message reads changeSet at fire time)
- onPageChanged (message reads pageIndex)
- onSearch (message reads searchText)
- onSort + onHeaderClick
- onFilterChanged
- onNewRowsAdded
- onBulkUpdate + onCancelChanges
- onTableDataDownload
- onRefresh
- onExpand (message reads lastExpandedRow)
- no double-fire: row click fires only onRowClicked, not onCellValueChanged etc.


### Downloads, container styles, contextual edits

**`V11-download-container-edits.qa.js`** — Excel/PDF download triggers (contents parsed offline), container styles on the right element,

- download … with search 'A' active
- container styles on the element that receives them
- edit while search / sort / pagination / pinning is active lands on the right record
- add-row popup validation for select / tags / datepicker custom rules and min date


### Inspector fields & viewer mode

**`V12-inspector-viewer.qa.js`** — Inspector: which fields each column type shows (Properties/Styles, editable off/on), conflicting config warnings.

- inspector fields: …
- conflicting config: min length > max length, min value > max value (inspector warning?)
- viewer: hidden table, hidden column, editing and events in preview
- viewer: table with Visibility off

**`V12b-inspector.qa.js`** — Inspector: which fields each column type shows (Properties/Styles, editable off/on), conflicting config warnings.

- inspector fields: …
- conflicting config: min length > max length, min value > max value (inspector warning?)


### Close-out (events, search edits, styles tab, loading)

**`V13-closeout.qa.js`** — Close-out: onFilterChanged / onTableDataDownload / onExpand, edit under search, Styles-tab fields per type,

- onFilterChanged: apply a filter, then clear filters
- onTableDataDownload: CSV, Excel
- onExpand: expand row 1, collapse it, expand row 2
- edit while a search is active lands on the matching record
- Styles tab fields: …
- dynamic options loading state: cell and open dropdown

**`V13b-filterclear.qa.js`**

- clear filters and remove single filter: rows, exposed filters, event


### Query-fed table

**`V14-query-fed.qa.js`** — Table fed by a real (RunJS) query: loading state, refresh, what happens to edits/selection/page on data change.

- loading state while the page-load query runs
- refresh re-runs the query; edits, selection and page on data change


### Server-side pagination / search / sort / filter

**`V15-server-side.qa.js`** — Server-side pagination + sort + filter driven by a real query wired to the table events.

- pages, sorts and filters through the query

**`V15b-server-side-search.qa.js`** — Server-side pagination + sort + filter driven by a real query wired to the table events.

- pages, sorts and filters through the query

**`V15c-readable.qa.js`** — Server-side pagination + search + sort + filter with the readable query in q1-readable.js.

- search / sort / filter on the last page


### Expanded row content

**`V16-expanded-content.qa.js`** — Child widgets inside expanded rows: render, bind to rowData, keep per-row state.

- children render, bind rowData, and keep state per row

**`V16b-expanded-control.qa.js`**

- static vs rowData vs global binding in expanded row children


### Large data

**`V17-large-data.qa.js`** — 5,000 rows: render time, virtualisation, scroll, edit far down, select all, search, pagination, export row count.

- 5,000 rows, pagination off (virtualised)
- 5,000 rows with pagination (10 per page)

**`V17b-size-ladder.qa.js`** — Size ladder: how long until the table shows its first row, for 500 / 1000 / 2000 / 5000 rows, data via a page-load query.

- … rows from a query, pagination on (10/page)


### Containers & multiple tables

**`V18-containers.qa.js`** — Table inside a Container and a ListView; two tables on one page (isolation of selectors and exposed values).

- table inside a Container
- table inside a ListView row (per-row data)
- two tables on one page


### Drag resize & component actions with arguments

**`V19-drag-csa-args.qa.js`** — Column resize by drag (+ persistence), header controls inventory, component actions with arguments via RunJS.

- resize a column by dragging, and after reload
- component actions with arguments (RunJS)


### Accessibility, dark mode, mobile, overflow

**`V20-a11y-theme-mobile-overflow.qa.js`** — Keyboard + accessibility basics, dark mode, mobile/preview layout, long-text overflow, dynamic height.

- accessibility basics: roles, names on icon buttons, keyboard focus and edit
- dark mode: text/background contrast of cells, header, toolbar, footer
- mobile viewport in preview + dynamic height with many rows + long-text overflow


### Editor ops, export/import, released app

**`V21-editor-ops-published.qa.js`** — Editor ops on a configured table: copy/paste + duplicate, undo/redo, export→import round trip; released app.

- copy/paste and duplicate the table widget
- export → import round trip keeps the table definition
- released app: table renders and works at the public slug


### Transformations, paste, timezone

**`V22-transform-paste-tz.qa.js`** — Transformation + editing, paste into cells (plain vs rich), browser timezone vs date columns.

- transformation + edit: which value is shown and saved
- paste plain text and rich HTML into an editable String cell
- dates under the browser timezone

**`V22b-recheck.qa.js`** — Re-checks: throwing transformation vs safe one; timezone display (read-only text); dark mode via the real toggle.

- transformation …
- transformation + edit: shown vs saved
- timezone display (read-only text)
- dark mode via the left-sidebar toggle


### Large-data isolation & dark mode

**`V23-isolate.qa.js`**

- dark mode via the Moon icon button


### Search latency & pagination controls

**`V24-search-speed.qa.js`**

- search latency with … rows


### Final gaps: expanded-row children, dark mode, undo/redo, publish, collaboration

**`V25-final-gaps.qa.js`** — Final gaps: row-context children via real drag, dark mode via app theme, real-key copy/paste + clipboard paste,

- row-context child dropped into an expanded row through the UI
- dark mode via the app theme (globalSettings.appMode = dark)
- real-key copy/paste of the table widget, and undo/redo
- clipboard paste (real Cmd+V) into an editable String cell
- released + public app opened logged out; second-session edit while the editor is open

**`V25b-final-gaps.qa.js`** — V25 follow-ups: bind rowData on a UI-dropped expanded-row child (via inspector), capture the real component-update

- rowData binding on a UI-dropped expanded-row child; capture update request; second-session edit
- undo / redo of a paste
- release error body, then public app opened logged out

**`V25c-final-gaps.qa.js`** — V25 round 3: rowData child via inspector (click child first), undo/redo via header buttons,

- rowData binding on a UI-dropped expanded-row child
- undo / redo via header buttons after a paste
- promote to production, release, open the public app logged out

**`V25d-final-gaps.qa.js`** — V25 round 3: rowData child via inspector (click child first), undo/redo via header buttons,

- rowData binding on a UI-dropped expanded-row child
- promote to production, release, open the public app logged out

**`V25e-final-gaps.qa.js`** — V25 round 3: rowData child via inspector (click child first), undo/redo via header buttons,

- rowData binding on a UI-dropped expanded-row child
- promote to production, release, open the public app logged out

**`V25f-publish.qa.js`** — V25 round 3: rowData child via inspector (click child first), undo/redo via header buttons,

- promote to production, release, open the public app logged out

**`V25g-collab.qa.js`** — Second session edits the table (with the exact request shape the inspector sends) while this editor stays open.

- capture a real update, replay it as another session, watch the open editor


## Bug index

IDs match the published reports. Severity: crit = crash, data loss or exploit; high = wrong value reaches data; med = functional or UX; docs = docs/labels.

#### Part 1 — 64 bugs ([report](https://claude.ai/artifact/DPMxcBvWNojjyb1sgYWF9z))

| ID | Severity | Area | Bug | Spec |
|---|---|---|---|---|
| TUI-01 | crit | Editing, changeSet, add row, validation | Clicking into an editable String cell, without typing, rewrites its value | A3-inline-edit.qa.js |
| TUI-02 | crit | Search, filter, sort | Typing ( in the search box makes the whole table disappear | A4-search.qa.js |
| TUI-03 | crit | Date Picker editing | Picking a date in a Unix-milliseconds column saves a 1970 timestamp | V4-datepicker-edit.qa.js |
| TUI-04 | high | Editing, changeSet, add row, validation | Saving the Add new row popup leaves the rows in `newRows` | A3-add-new-row.qa.js |
| TUI-05 | high | Editing, changeSet, add row, validation | The Add new row popup lets users type into read-only columns and omits hidden ones | A3-add-new-row.qa.js |
| TUI-06 | high | Editing, changeSet, add row, validation | Save changes works while a cell is flagged invalid | A3-validation.qa.js |
| TUI-07 | high | Pagination, selection, expandable rows | Select all selects rows hidden by the active search | A5-selection.qa.js |
| TUI-08 | high | Download, action buttons, events, CSAs | Download exports every row, ignoring the active search, filters and sort | A6-download.qa.js |
| TUI-09 | high | Editing, changeSet, add row, validation | Editing a nested column leaves the nested value unchanged and adds a flat "user.name" key | A3-rich-types-edit.qa.js |
| TUI-10 | high | Download, action buttons, events, CSAs | isVisible, isDisabled and isLoading read undefined, even after setVisibility, setDisable and setLoading | V1-verify.qa.js, A6-csa.qa.js |
| TUI-11 | high | Date Picker editing | Picking a date shows "Invalid date" when Date format and Parse format differ | V4-datepicker-edit.qa.js |
| TUI-12 | high | Date Picker editing | Typing a date saves the wrong year when Parse format differs from Date format | V4-datepicker-edit.qa.js |
| TUI-13 | high | Date Picker editing | With display and value timezones set, picking a day corrupts the year and time shown | V4-datepicker-edit.qa.js |
| TUI-14 | high | Date Picker editing | Invalid or cleared date input saves the text "Invalid date" | V4-datepicker-edit.qa.js |
| TUI-15 | high | Edit, every column type | Editing a MultiSelect cell saves option objects and changes the column's data shape | V6-edit-all.qa.js |
| TUI-16 | high | Edit, every column type | Markdown and JSON cell edits are lost when the user clicks away | V6b-edit-recheck.qa.js |
| TUI-17 | high | Edit, every column type | Line breaks typed in a Text cell are dropped on save | V6b-edit-recheck.qa.js |
| TUI-18 | high | Edit, every column type | Editing a Tags cell saves option objects instead of tag values | V6b-edit-recheck.qa.js |
| TUI-19 | high | Add new row, every column type | The Add new row popup saves rows that fail validation | V7-addrow-all.qa.js |
| TUI-20 | med | Data & column generation | Selection column header renders with data-cy="undefined-column-header" | _smoke.qa.js |
| TUI-21 | med | Column types (display) | Date Picker cells render MM/DD/YYYY while the inspector says the format is DD/MM/YYYY | A2-datepicker.qa.js |
| TUI-22 | med | Column types (display) | Read-only Select and MultiSelect cells show the "Select.." placeholder instead of the value | A2-select-multiselect-tags.qa.js |
| TUI-23 | med | Column types (display) | MultiSelect ignores a single string value that matches an option | A2-select-multiselect-tags.qa.js |
| TUI-24 | med | Editing, changeSet, add row, validation | Legacy Tags columns render no tags for the row data | A3-rich-types-edit.qa.js |
| TUI-25 | med | Editing, changeSet, add row, validation | A Custom rule that returns false never marks the cell invalid | A3-validation.qa.js |
| TUI-26 | med | Editing, changeSet, add row, validation | A Date Picker cell dated exactly on the Min date is flagged invalid | A3-validation.qa.js |
| TUI-27 | med | Search, filter, sort | "Greater than" filters compare as text, so 10 and 100 are not greater than 9 | A4-filter.qa.js |
| TUI-28 | med | Search, filter, sort | Filtering a Select column by the label users see finds nothing | A4-filter.qa.js |
| TUI-29 | med | Search, filter, sort | Search ignores what cells display: Select labels and formatted dates never match | A4-search.qa.js |
| TUI-30 | med | Search, filter, sort | First header click sorts Number and Boolean columns descending but text columns ascending | A4-sort.qa.js |
| TUI-31 | med | Search, filter, sort | Select columns sort by the hidden stored value, not the label shown | A4-sort.qa.js |
| TUI-32 | med | Pagination, selection, expandable rows | Rows per page of 0 or a non-number blanks the table | A5-pagination.qa.js |
| TUI-33 | med | Pagination, selection, expandable rows | The setPage action accepts 0, pages past the end, and text | A5-pagination.qa.js |
| TUI-34 | med | Pagination, selection, expandable rows | pageIndex stays on page 3 after a search leaves only one page | A5-pagination.qa.js |
| TUI-35 | med | Download, action buttons, events, CSAs | CSV export writes the wrong values for nested, JSON, Select and Date Picker columns | A6-download.qa.js |
| TUI-36 | med | Download, action buttons, events, CSAs | Exports include an empty ACTIONS column when the table has action buttons | A6-download.qa.js |
| TUI-37 | med | Download, action buttons, events, CSAs | Columns hidden through Manage columns are still exported | A6-download.qa.js |
| TUI-38 | med | Styles & layout states | The Padding style has no visible effect | A7-container-styles.qa.js |
| TUI-39 | med | Data & column generation | One dynamic column without a name makes every dynamic column disappear | A1-dynamic-columns.qa.js |
| TUI-40 | med | Pagination, selection, expandable rows | Disable row deselection can be bypassed by clicking the row's checkbox | A5-selection.qa.js |
| TUI-41 | med | Download, action buttons, events, CSAs | selectRow with a key/value that matches no row clears the current selection | A6-csa.qa.js |
| TUI-42 | med | Data & column generation | A key containing a dot ("a.b") renders an empty column, and its cells share a selector with "a b" | V2-verify.qa.js |
| TUI-43 | med | Column-type validation (UI/UX) | Custom rules on Select, MultiSelect and Tags columns never fire when written with cellValue | V3-validation.qa.js |
| TUI-44 | med | Column-type validation (UI/UX) | The Regex rule on Text columns does nothing | V3-validation.qa.js |
| TUI-45 | med | Column-type validation (UI/UX) | Min value 0 and Max value 0 are ignored | V3-validation.qa.js |
| TUI-46 | med | Column-type validation (UI/UX) | Min and Max length are never checked when a String cell holds a number | V3-validation.qa.js |
| TUI-47 | med | Column-type validation (UI/UX) | Empty Number cells are flagged as below the Min value | V3-validation.qa.js |
| TUI-48 | med | Column-type validation (UI/UX) | An invalid Regex shows "Invalid regex pattern" on every cell to end users | V3-validation.qa.js |
| TUI-49 | med | Column-type validation (UI/UX) | A Date Picker cell on a Disabled date is not flagged | V3-validation.qa.js |
| TUI-50 | med | Column-type validation (UI/UX) | Read-only Date Picker cells show an invalid border with no message | V3-validation.qa.js |
| TUI-51 | med | Column-type validation (UI/UX) | Validation messages are cut off with an ellipsis and cannot be read in full | V3-validation.qa.js |
| TUI-52 | med | Column-type validation (UI/UX) | Validation feedback appears only after the cell loses focus, not while typing | V3-validation.qa.js |
| TUI-53 | med | Date Picker editing | Disabled dates must be typed as MM/DD/YYYY, whatever the column's date format | V4-datepicker-edit.qa.js |
| TUI-54 | med | Date Picker editing | The calendar lets users pick dates outside Minimum and Maximum date, then flags them | V4-datepicker-edit.qa.js |
| TUI-55 | med | Edit, every column type | Typing letters into an editable Number cell silently saves null | V6-edit-all.qa.js |
| TUI-56 | med | Edit, every column type | Escape does not cancel a cell edit, and the text is saved on blur | V6b-edit-recheck.qa.js |
| TUI-57 | med | Column-type validation (UI/UX) | Custom rules cannot reference other fields of the row through rowData | V5-validation-gaps.qa.js |
| TUI-58 | med | Date Picker editing | The Date Picker Time format setting has no effect | V5-validation-gaps.qa.js |
| TUI-59 | med | Add new row, every column type | New rows start with "" in every field, ignoring type defaults and Default rating | V7-addrow-all.qa.js |
| TUI-60 | med | Add new row, every column type | JSON typed into the Add new row popup is not captured | V7-addrow-all.qa.js |
| TUI-61 | med | Add new row, every column type | The Add new row popup has no way to remove a single extra row | V7-addrow-all.qa.js |
| TUI-62 | med | Styles, every column type | Read-only Date Picker cells ignore Text colour | V8b-styles-recheck.qa.js |
| TUI-63 | med | Styles, every column type | Image column Border radius has no effect | V8b-styles-recheck.qa.js |
| TUI-64 | med | Styles, every column type | Tags Sort tags (A–Z / Z–A) does not reorder tags | V8b-styles-recheck.qa.js |

#### Part 2 — 10 bugs ([report](https://claude.ai/artifact/LkCcYqdaJR4bERUDwRzbBY))

| ID | Severity | Area | Bug | Spec |
|---|---|---|---|---|
| TU2-01 | high | Events | onCellValueChanged fires before changeSet is updated, so handlers read stale data | V10-events.qa.js |
| TU2-02 | high | Downloads (Excel, PDF) | Excel and PDF exports ignore the search and write blank, raw or [object Object] values | V11-download-container-edits.qa.js |
| TU2-03 | high | Button column and options | A Select default option is shown in cells and the new-row popup but never stored | V9b-button-default.qa.js |
| TU2-04 | high | Events | Clear filters and the filter-row x do not remove filters: the table stays filtered | V13b-filterclear.qa.js |
| TU2-05 | med | Add new row validation | The Add new row popup shows validation errors on a blank row before the user types anything | V11-download-container-edits.qa.js |
| TU2-06 | med | Inspector | No warning when Min length is larger than Max length | V12b-inspector.qa.js |
| TU2-07 | med | Inspector | Rating's Default rating field shows 3, but no default is applied | V12b-inspector.qa.js |
| TU2-08 | med | Events | On table data download never fires with client-side pagination | V13-closeout.qa.js |
| TU2-09 | med | Inspector | Link, Rating and Image columns have no Cell colour option | V13-closeout.qa.js |
| TU2-10 | docs | Inspector | The Number column's Regex example accepts letters and spaces | V12b-inspector.qa.js |

#### Part 3 — 13 bugs ([report](https://claude.ai/artifact/LJpmD56hMV9c2Qtz1iVPj3))

| ID | Severity | Area | Bug | Spec |
|---|---|---|---|---|
| TU3-01 | high | Query-fed table | Refresh silently discards unsaved edits, the selection and the current page | V14-query-fed.qa.js |
| TU3-02 | high | Server-side pagination | With server-side pagination, search, sort and filter keep the old page, so the table goes empty | V15c-readable.qa.js |
| TU3-03 | high | Transformations | Column transformations leak into updatedData and the editor, and a failing transformation writes an empty string | V22b-recheck.qa.js |
| TU3-04 | high | Expanded row content | Widgets inside an expanded row render empty when they use rowData | V25e-final-gaps.qa.js |
| TU3-05 | med | Query-fed table | One click on the refresh button runs the query twice | V14-query-fed.qa.js |
| TU3-06 | med | Server-side pagination | Next stays enabled on the last server-side page even though Total records is known | V15-server-side.qa.js |
| TU3-07 | med | Component actions with arguments | setFilters with an unknown column silently wipes the existing filters | V19-drag-csa-args.qa.js |
| TU3-08 | med | Accessibility | Toolbar and pagination icon buttons have no accessible name, and sortable headers expose no sort state | V20-a11y-theme-mobile-overflow.qa.js |
| TU3-09 | med | Containers and multiple tables | Two tables on one page share column-header selectors | V18-containers.qa.js |
| TU3-10 | med | Large data | With pagination off, the footer stops showing the record count | V17-large-data.qa.js |
| TU3-11 | med | Drag, editor ops, export/import | Pasting a widget cannot be undone with Cmd+Z | V25b-final-gaps.qa.js |
| TU3-12 | med | Publish, permissions, collaboration | Two builders editing the same app overwrite each other silently | V25g-collab.qa.js |
| TU3-13 | med | Publish, permissions, collaboration | Promoting a version that is already in production returns a raw 500 error | V25f-publish.qa.js |
