/**
 * SPEC — Table — events facet.
 * FOR AI: covers ALL 14 triggers of `config.events` in
 * frontend/src/AppBuilder/WidgetManager/widgets/table.js:357-372, ONE it() per event.
 * Each test wires exactly its own trigger to a Show Alert handler carrying a unique
 * punctuation-free message (tableText.toast*), performs the real user interaction that
 * the widget's fireEvent() call site depends on, and asserts the toast — a test that
 * does not prove the handler ran is a gate failure.
 *
 * `config.definition.events` is `[]` (table.js:850), so nothing is wired by default.
 *
 * EVENT WIRING: every addMultiEventsWithAlert call passes isWait=TRUE. With false,
 * selectEvent skips `cy.wait("@events")` after creating the handler, so addSupportCSAData
 * types the alert message before the handler's POST /events has resolved and the write is
 * silently dropped — the handler keeps its DEFAULT message and the toast reads
 * "Hello world!". Proven by probe in tableInteractions.cy.js / tableEditing.cy.js.
 *
 * TOAST TEXT: messages are typed through clearAndTypeOnCodeMirror, which silently drops
 * any character outside [a-zA-Z0-9._-]. tableText.toast* are punctuation-free for that
 * reason — never inline a literal here.
 *
 * MODE: every one of these 14 events fires in EDIT mode (they are widget-internal
 * fireEvent() calls, not runtime-gated CSAs), so no cy.openInCurrentTab() is needed.
 * Verified against the fire sites listed per test.
 *
 * Helpers: addMultiEventsWithAlert, openEditorSidebar, openAccordion, resizeTableWidget,
 * resizeQueryPanel, toggleTableProperty, setRowsPerPage, selectTableRow, sortByColumn,
 * searchOnTable, addFilter, makeAllColumnsEditable, editTableCell, addNewRow,
 * verifySingleValueOnTable, verifyTableElements.
 */
import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { tableText } from "Texts/appBuilder/components/table";
import { tableSelector } from "Selectors/appBuilder/components/table";
import {
  resizeTableWidget,
  toggleTableProperty,
  setRowsPerPage,
  selectTableRow,
  sortByColumn,
  searchOnTable,
  addFilter,
  verifyTableElements,
  verifySingleValueOnTable,
  makeAllColumnsEditable,
  editTableCell,
  addNewRow,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar, openAccordion } from "Support/utils/appBuilder/properties";
import { addMultiEventsWithAlert } from "Support/utils/appBuilder/events";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags throw
// "No dragIntercepted". Keeping the AUT stable across tests keeps the drag intercept
// valid. Each test still re-logs-in + creates its own app in beforeEach, so shared
// browser state is not relied upon.
describe("Table — events facet", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // runtimeCandidate: 'table1'

  // Wire one trigger -> Show Alert, then settle so the message is persisted before the
  // interaction fires the handler. Assumes the right inspector is already open on W.
  const wireEvent = (event, message) => {
    openEditorSidebar(W);
    openAccordion(commonWidgetText.accordionEvents);
    addMultiEventsWithAlert([{ event, message }], true);
    cy.waitForAutoSave();
    cy.forceClickOnCanvas();
  };

  // beforeEach mirrors the proven-green tableInteractions.cy.js / tableEditing.cy.js
  // harness: widen the viewport and canvas, close the left settings panel, grow the
  // table so the footer controls (pagination / download / refresh / change bar) are all
  // on screen, and collapse the query panel out of the way.
  // NOTE: there is no `waitForDropSettle` helper in this repo — `dragAndDropWidget`
  // already ends in `cy.waitForAutoSave()`, and the resize steps below are the settle.
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-table-events-App`);
    cy.openApp();
    cy.viewport(1400, 2200);
    cy.dragAndDropWidget("Table", 250, 100);
    cy.hideTooltip();
    cy.modifyCanvasSize(900, 800);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    resizeTableWidget(W, 750, 600);
    resizeQueryPanel("1");
    openEditorSidebar(W);
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  // ── 1. Row hovered ────────────────────────────────────────────────────────
  it("fires onRowHovered when a data row is hovered", () => {
    // source: table.js:358 — onRowHovered / "Row hovered".
    // TableRow.jsx:54-60 only attaches the onMouseEnter handler when `hasHoveredEvent`
    // is true, which initSlice.js:170-172 derives from an onRowHovered handler EXISTING
    // — so the handler must be wired before the hover, which it is.
    wireEvent(tableText.eventRowHovered, tableText.toastRowHovered);

    // Synthetic mouseover, NOT realHover: the row lives in a position:fixed container
    // and can be reported covered, so a real pointer move would silently do nothing.
    // React synthesises mouseenter from mouseover.
    cy.get(tableSelector.row(0, W)).scrollIntoView();
    cy.get(tableSelector.row(0, W)).trigger("mouseover", { force: true });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastRowHovered
    );
  });

  // ── 2. Row clicked ────────────────────────────────────────────────────────
  it("fires onRowClicked when a row cell is clicked", () => {
    // source: table.js:359 — onRowClicked / "Row clicked".
    // Fire site: TableData.jsx:139 (handleRowClick).
    // highlightSelectedRow defaults FALSE (table.js:831) and is what puts the
    // `.selected` class on the row (TableRow.jsx:46), so turn it on for a DOM signal.
    toggleTableProperty(tableText.toggleHighlightSelectedRow);
    wireEvent(tableText.eventRowClicked, tableText.toastRowClicked);

    // Row 1 (Liam Patel), not row 0 — defaultSelectedRow is `{{{"id":1}}}`
    // (table.js:836) so row 0 can already be selected on mount.
    selectTableRow(1, tableText.name, W);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastRowClicked
    );
    cy.get(tableSelector.row(1, W)).should("have.class", "selected");
  });

  // ── 3. Row expanded ───────────────────────────────────────────────────────
  it("fires onExpand when a row is expanded", () => {
    // source: table.js:360 — onExpand / "Row expanded".
    // PREREQUISITE: enableExpandableRows defaults to `{{false}}` (table.js:846,
    // property at table.js:330), and buildTableColumn.js:26 only builds the expansion
    // column when it is on. Turn it on INSIDE the test.
    toggleTableProperty(tableText.toggleEnableExpandableRows);
    wireEvent(tableText.eventRowExpanded, tableText.toastRowExpanded);

    // Fire site: Table.jsx:196-198 — onExpand fires only on a NEW expansion.
    cy.get(tableSelector.expansionCell(0, W)).scrollIntoView();
    cy.get(tableSelector.expandRowToggle(0, W)).click({ force: true });
    cy.get(tableSelector.expansionCell(0, W))
      .find("button.table-expansion-toggle")
      .should("have.attr", "aria-label", "Collapse row");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastRowExpanded
    );
  });

  // ── 4. Save changes ───────────────────────────────────────────────────────
  it("fires onBulkUpdate when pending edits are saved", () => {
    // source: table.js:361 — onBulkUpdate / "Save changes".
    // Fire site: Footer/_components/ChangeSetUI.jsx:31 (the Save changes button).
    // PREREQUISITE: an editable column plus a pending edit — the change bar only
    // replaces the row count when `editedRows.size > 0 && showBulkUpdateActions`
    // (Footer.jsx:100). showBulkUpdateActions defaults `{{true}}` (table.js:829).
    makeAllColumnsEditable();
    wireEvent(tableText.eventSaveChanges, tableText.toastSaveChanges);

    editTableCell(tableText.name, 0, "Bulk Edit", W);
    cy.get(tableSelector.saveChangesButton).click({ force: true });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastSaveChanges
    );
  });

  // ── 5. Page changed ───────────────────────────────────────────────────────
  it("fires onPageChanged when the next page is opened", () => {
    // source: table.js:362 — onPageChanged / "Page changed".
    // Fire site: TableExposedVariables.jsx:155.
    // rowsPerPage defaults to 10 (table.js:79) and the demo dataset is exactly 10 rows
    // -> one page, so next/prev are inert. Shrink the page size first.
    setRowsPerPage(4);
    wireEvent(tableText.eventPageChanged, tableText.toastPageChanged);

    verifyTableElements(tableText.defaultInput.slice(0, 4));
    cy.get(tableSelector.paginationButtonToNext).click({ force: true });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastPageChanged
    );
    verifyTableElements(tableText.defaultInput.slice(4, 8));
  });

  // ── 6. Search ─────────────────────────────────────────────────────────────
  it("fires onSearch when the global search box is used", () => {
    // source: table.js:363 — onSearch / "Search".
    // Fire site: TableExposedVariables.jsx:195 (debounced 500ms in SearchBar.jsx:15,
    // which searchOnTable already waits out).
    wireEvent(tableText.eventSearch, tableText.toastSearch);

    // Search for the first token of row 1's name ("Liam Patel") so exactly that row
    // survives — derived from the constant, never a bare literal.
    const searchTerm = tableText.defaultInput[1].name.split(" ")[0];
    searchOnTable(searchTerm, W);
    cy.verifyToastMessage(commonSelectors.toastMessage, tableText.toastSearch);
    verifyTableElements([tableText.defaultInput[1]]);
  });

  // ── 7. Cancel changes ─────────────────────────────────────────────────────
  it("fires onCancelChanges when pending edits are discarded", () => {
    // source: table.js:364 — onCancelChanges / "Cancel changes".
    // Fire site: TableContainer/TableContainer.jsx:169-172 (handleChangesDiscarded).
    makeAllColumnsEditable();
    wireEvent(tableText.eventCancelChanges, tableText.toastCancelChanges);

    editTableCell(tableText.name, 0, "Temp Edit", W);
    verifySingleValueOnTable(tableText.name, 0, "Temp Edit");
    cy.get(tableSelector.discardChangesButton).click({ force: true });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastCancelChanges
    );
    verifySingleValueOnTable(
      tableText.name,
      0,
      tableText.defaultInput[0][tableText.name]
    );
  });

  // ── 8. Sort applied ───────────────────────────────────────────────────────
  it("fires onSort when a column is sorted", () => {
    // source: table.js:365 — onSort / "Sort applied".
    // Fire site: TableExposedVariables.jsx:173 — fires whenever sorting.length > 0.
    // enabledSort defaults `{{true}}` (table.js:834), so a header click sorts.
    wireEvent(tableText.eventSortApplied, tableText.toastSortApplied);

    // Assert the SORT ITSELF first — the sort arrow only renders once the column IS
    // sorted (TableHeader.jsx:165-179), which keeps sort coverage independent of the
    // event assertion.
    // Ascending on `name` puts "Alexander Vela" (defaultInput[8]) first — computed from
    // the constant so the expectation tracks the dataset.
    const firstNameAsc = [...tableText.defaultInput]
      .map((row) => row.name)
      .sort((a, b) => a.localeCompare(b))[0];
    sortByColumn(tableText.name);
    cy.get(tableSelector.sortIconAscending(tableText.name)).should("exist");
    verifySingleValueOnTable(tableText.name, 0, firstNameAsc);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastSortApplied
    );
  });

  // ── 9. Cell value changed ─────────────────────────────────────────────────
  it("fires onCellValueChanged when an editable cell is edited", () => {
    // source: table.js:366 — onCellValueChanged / "Cell value changed".
    // Fire site: TableExposedVariables.jsx:98.
    makeAllColumnsEditable();
    wireEvent(tableText.eventCellValueChanged, tableText.toastCellValueChanged);

    // editTableCell clicks `.long-text-input` to flip the cell into contenteditable and
    // commits with {enter} (which blurs) — see typeIntoEditableCell.
    editTableCell(tableText.name, 0, "Zed", W);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastCellValueChanged
    );
    verifySingleValueOnTable(tableText.name, 0, "Zed");
  });

  // ── 10. Filter changed ────────────────────────────────────────────────────
  it("fires onFilterChanged when a filter is added", () => {
    // source: table.js:367 — onFilterChanged / "Filter changed".
    // Fire site: TableExposedVariables.jsx:202.
    wireEvent(tableText.eventFilterChanged, tableText.toastFilterChanged);

    // "Reyes" matches Sophia Reyes (id 3) and Michael Reyes (id 10).
    // freshFilter=true is REQUIRED: addFilter only clicks "+ add filter" (creating
    // filter row 0) on that path; without it `select-column-dropdown-0` never exists.
    const surname = tableText.defaultInput[2].name.split(" ")[1]; // "Reyes"
    addFilter(
      [{ column: tableText.name, operation: "contains", value: surname }],
      true,
      W
    );
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastFilterChanged
    );
    verifyTableElements([
      tableText.defaultInput[2],
      tableText.defaultInput[9],
    ]);
  });

  // ── 11. Add new rows ──────────────────────────────────────────────────────
  it("fires onNewRowsAdded when a new row is saved", () => {
    // source: table.js:368 — onNewRowsAdded / "Add new rows".
    // Fire site: Footer/_components/AddNewRow.jsx:271.
    // showAddNewRowButton defaults `{{true}}` (table.js:837), so the + button is there.
    wireEvent(tableText.eventAddNewRows, tableText.toastNewRowsAdded);

    // addNewRow opens the panel and fills id/name/email (5 / Nick / nick@example.com).
    addNewRow(W);
    cy.get(tableSelector.addNewRowSaveButton).click({ force: true });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastNewRowsAdded
    );
  });

  // ── 12. Download data ─────────────────────────────────────────────────────
  it("fires onTableDataDownload when the download button is used", () => {
    // source: table.js:369 — onTableDataDownload / "Download data".
    // PRODUCT GATE (not a spec workaround): ControlButtons.jsx:189-207 fires
    // `onTableDataDownload` ONLY on the `hasDownloadEvent && !clientSidePagination`
    // branch. On the default client-side path the button instead opens the CSV/Excel/PDF
    // popover, whose options call exportToCSV/Excel/PDF directly (ControlButtons.jsx:126,
    // 133, 140) and NEVER fire the event. So picking a format from the dropdown can never
    // satisfy this assertion — the event is reachable only with client-side pagination
    // OFF.
    //
    // `clientSidePagination` is derived in initSlice.js:82-90 as
    // `enablePagination && !serverSidePagination`; enablePagination defaults `{{true}}`
    // (table.js:706) and serverSidePagination `{{false}}` (table.js:702). Turning
    // "Enable pagination" OFF makes it false, which flips the download button to the
    // direct-fire branch. The footer still renders because showDownloadButton is
    // `{{true}}` (table.js:710) — getFooterVisibility (initSlice.js:231-238) ORs it in.
    toggleTableProperty(tableText.toggleEnablePagination);
    // hasDownloadEvent is derived from the handler EXISTING (initSlice.js:173-175), so
    // it must be wired before the click, which it is.
    wireEvent(tableText.eventDownloadData, tableText.toastDownloadData);

    cy.get(tableSelector.buttonDownloadDropdown(W)).scrollIntoView();
    cy.get(tableSelector.buttonDownloadDropdown(W)).click({ force: true });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastDownloadData
    );
  });

  // ── 13. Refresh ───────────────────────────────────────────────────────────
  it("fires onRefresh when the refresh button is clicked", () => {
    // source: table.js:370 — onRefresh / "Refresh".
    // PREREQUISITE: showRefreshButton defaults `{{false}}` (table.js:838, property at
    // table.js:284) and ControlButtons.jsx:230 only pushes the button when it is on.
    toggleTableProperty(tableText.toggleShowRefreshButton);
    wireEvent(tableText.eventRefresh, tableText.toastRefresh);

    // Fire site: _hooks/useTableRefresh.js:41 — with no query bound to the table's
    // `data` property, `queriesToRun` is empty and onRefresh fires synchronously.
    cy.get(tableSelector.refreshButton(W)).scrollIntoView();
    cy.get(tableSelector.refreshButton(W)).click({ force: true });
    cy.verifyToastMessage(commonSelectors.toastMessage, tableText.toastRefresh);
  });

  // ── 14. Header clicked ────────────────────────────────────────────────────
  it("fires onHeaderClick when a column header is clicked", () => {
    // source: table.js:371 — onHeaderClick / "Header clicked".
    // Fire site: TableData/_components/TableHeader.jsx:45-57 — handleHeaderClick fires
    // onHeaderClick FIRST and only THEN sorts, guarded by `enabledSort &&
    // header.column.getCanSort()`.
    //
    // ISOLATION: with the default `enabledSort: {{true}}` (table.js:834) ONE header click
    // fires BOTH onHeaderClick and onSort, so the toasts would race and neither
    // assertion would prove which handler ran. "Enable column sorting" is therefore
    // turned OFF here so the click can only produce onHeaderClick. Sorting itself is
    // covered by the onSort test above.
    toggleTableProperty(tableText.toggleEnableColumnSorting);
    wireEvent(tableText.eventHeaderClicked, tableText.toastHeaderClicked);

    cy.get(tableSelector.columnHeader(tableText.name)).scrollIntoView();
    cy.get(tableSelector.columnHeader(tableText.name)).click({ force: true });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastHeaderClicked
    );
    // Sorting is off, so the click must NOT have applied a sort — this is what proves
    // the toast came from onHeaderClick and not from onSort.
    cy.get(tableSelector.sortIconAscending(tableText.name)).should("not.exist");
  });
});
