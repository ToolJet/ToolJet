/**
 * SPEC — Table — properties facet.
 *
 * FOR AI: covers ALL 40 `config.properties` entries of
 * frontend/src/AppBuilder/WidgetManager/widgets/table.js PLUS the 2 `config.others`
 * device toggles. The config carries almost no `section` key (only collapseWhenHidden
 * :310 and dynamicHeight :326 are `additionalActions`), so the it-blocks are grouped
 * FUNCTIONALLY, mirroring the accordions the Table inspector actually renders
 * (Inspector/Components/Table/Table.jsx:474-745):
 *   Data · Columns · Row Selection · Search, sort and filter · Pagination ·
 *   Additional actions · Devices.
 *
 * Every leg asserts a REAL rendered effect (a row count, a class, a css value, a
 * control appearing / disappearing) — never "the toggle flipped".
 *
 * ── HARNESS (deliberate deviation from the generic facet header contract) ──
 * `waitForDropSettle` DOES NOT EXIST in this repo (repo-wide grep: no definition), and
 * the plain `query-manager-toggle-button` beforeEach leaves the Table too short to
 * render its footer / pagination / full page of rows. This spec therefore reuses the
 * proven-green Table harness shared by basics.cy.js, inspector.cy.js, events.cy.js and
 * csa.cy.js: viewport → drag → hideTooltip → modifyCanvasSize → close the settings
 * panel → resizeTableWidget → resizeQueryPanel('1') → openEditorSidebar.
 * `resizeQueryPanel("1")` collapses the query manager (same intent as the toggle
 * button) without stealing the vertical space the table needs.
 *
 * ── TWO-NODE WIDGET ──
 * The Table renders `data-cy="draggable-widget-<name>"` on BOTH the outer RenderWidget
 * wrapper (RenderWidget.jsx:308) AND its inner <table> root (Table.jsx:342), so every
 * widget-level lookup MUST disambiguate with :eq(0) / :eq(1). For the same reason
 * openStateFromComponent / openNode / openAndVerifyNode are unusable here (their
 * internal realHover throws on the 2-node match) — inspector reads go through
 * verifyTableExposedVars, which is the inspector facet's job, not this one.
 *
 * ── ACCORDION SCOPING (load-bearing) ──
 * _ui/Accordion/AccordionItem.js:5 defaults `open = true` and the Table only passes
 * `isOpen` for Events + Devices, so EVERY accordion of the Table inspector is expanded
 * at the same time. Four `clientServerSwitch` fields share displayName 'Type'
 * (table.js:134/146/158/170) and all four emit the SAME option data-cy
 * (`togglr-button-clientSide` / `-serverSide`, ToggleGroupItem.jsx:33), so
 * `verifyAndModifySwitch` — which asserts `have.text` on a single parameter label —
 * cannot be used: it would match 4 labels and read "TypeTypeTypeType". Those switches
 * are driven through `accordionBody(<title>).find(...)` + an index instead.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, toggleTableProperty, setRowsPerPage,
 *     setTableData, searchOnTable, verifyTableElements, verifySingleValueOnTable,
 *     addFilter, sortByColumn, selectTableRow, verifySelectedRowCount,
 *     makeColumnEditable, editTableCell
 *   appBuilder/properties.js — openEditorSidebar, verifyAndModifyParameter
 *   appBuilder/layout.js — verifyLayout
 *   appBuilder/querymanager/queryPanel.js — resizeQueryPanel
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tableSelector } from "Selectors/appBuilder/components/table";
import { tableText } from "Texts/appBuilder/components/table";
import {
  resizeTableWidget,
  toggleTableProperty,
  setRowsPerPage,
  setTableData,
  searchOnTable,
  verifyTableElements,
  verifySingleValueOnTable,
  addFilter,
  sortByColumn,
  selectTableRow,
  verifySelectedRowCount,
  makeColumnEditable,
  editTableCell,
} from "Support/utils/appBuilder/components/table";
import {
  openEditorSidebar,
  verifyAndModifyParameter,
} from "Support/utils/appBuilder/properties";
import { verifyLayout } from "Support/utils/appBuilder/layout";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// RenderWidget.jsx:308 (outer wrapper) vs Table.jsx:342 (inner <table> root).
// The INNER node is the one that carries `data-disabled` and the visibility
// `display:none`; the OUTER one is the canvas box.
const tableWidgetOuter = (name) =>
  `${commonWidgetSelector.draggableWidget(name)}:eq(0)`;
const tableWidgetInner = (name) =>
  `${commonWidgetSelector.draggableWidget(name)}:eq(1)`;

// Scope a lookup to one inspector accordion body. The accordion <h2> carries the
// data-cy (AccordionItem.js:38); `.accordion-item` is its parent wrapper (:34).
const accordionBody = (title) =>
  cy.get(commonWidgetSelector.accordion(title)).closest(".accordion-item");

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags throw
// "No dragIntercepted". Keeping the AUT stable across tests keeps the drag intercept
// valid. Each test still re-logs-in + creates its own app in beforeEach, so shared
// browser state is not relied upon.
describe("Table — properties facet", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-Properties-App`); // dynamic: fake
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

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA  (dataSourceSelector · data)
  // ═══════════════════════════════════════════════════════════════════════════

  it("data — dataSourceSelector defaults to Raw JSON, which gates and feeds the data field", () => {
    // `dataSourceSelector` is a `dropdownMenu`; DropdownMenu.jsx renders NO data-cy on
    // the trigger, so the selected source is read from its label span (:186) whose text
    // is the option's `name` (:31).
    accordionBody(tableText.accordionData)
      .find(tableSelector.dataSourceTriggerLabel)
      .should("have.text", tableText.sourceRawJson); // source: table.js:691

    // `data` is conditionallyRender-gated on dataSourceSelector === 'rawJson'
    // (table.js:31-34). With the default satisfied its code field IS mounted; its
    // displayName is ' ' (table.js:23) so SingleLineCodeEditor emits `-input-field`.
    accordionBody(tableText.accordionData)
      .find(tableSelector.dataInputField)
      .should("have.length", 1); // source: table.js:21

    // Table.jsx:96 reads `data` ONLY while the source is rawJson, so the seed renders.
    cy.forceClickOnCanvas();
    verifyTableElements(tableText.defaultInput.slice(0, 3)); // source: table.js:692

    // Replacing `data` re-renders the body from the new array.
    openEditorSidebar(W);
    setTableData(JSON.stringify(tableText.customInput));
    verifyTableElements(tableText.customInput); // source: table.js:21
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMNS  (columns · autogenerateColumns · useDynamicColumn · columnData)
  // ═══════════════════════════════════════════════════════════════════════════

  it("columns — the definition column list drives the inspector list and the rendered headers", () => {
    // The 7 rendered columns are the definition's `columns` array (table.js:714-828)
    // reconciled against the seed's keys by autoGenerateColumns.js:88-104.
    const renderedColumns = ["id", "photo", "name", "email", "date", "interest"];
    renderedColumns.forEach((column) => {
      cy.get(tableSelector.columnListItem(column))
        .scrollIntoView()
        .should("have.length", 1); // source: table.js:714
    });

    // 🐞 CONFIG-vs-BEHAVIOUR: the definition ships a `mobile_number` column
    // (table.js:768) but the seed dataset (table.js:692) has a `phone` key instead.
    // autoGenerateColumns.js:88-90 keeps an autogenerated column only while its key is
    // still present in the data, so `mobile_number` is silently DROPPED and a fresh
    // `phone` column is generated in its place.
    cy.get(tableSelector.columnListItem("mobile_number")).should(
      "have.length",
      0
    ); // source: table.js:768
    cy.get(tableSelector.columnListItem("phone")).should("have.length", 1); // source: table.js:692

    cy.forceClickOnCanvas();
    [...renderedColumns, "phone"].forEach((column) => {
      cy.get(tableSelector.columnHeader(column)).should("have.text", column); // source: table.js:714
    });
  });

  it("columns — autogenerateColumns (Lock column schema) stops new keys from growing columns", () => {
    // autogenerateColumns drops as `true` (table.js:712) and the inspector inverts it —
    // `isColumnSchemaLocked = !autogenerateColumns` (Inspector Table.jsx:399) — so the
    // "Lock column schema" toggle starts OFF and a NEW data key DOES grow a column.
    // NOTE: this is the ONE property flagged `isFxNotRequired` (table.js:59), so it has
    // no fx button and is driven purely as a toggle.
    setTableData(tableText.schemaProbeData); // source: table.js:56
    cy.get(tableSelector.columnHeader(tableText.schemaProbeColumn)).should(
      "have.text",
      tableText.schemaProbeColumn
    );

    // Lock the schema, then introduce ANOTHER new key — no column may appear.
    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleLockColumnSchema); // source: table.js:58
    setTableData(tableText.schemaProbeDataExtended);
    cy.get(tableSelector.columnHeader(tableText.schemaProbeExtraColumn)).should(
      "have.length",
      0
    ); // source: table.js:712
    // the previously generated column survives the lock
    cy.get(tableSelector.columnHeader(tableText.schemaProbeColumn)).should(
      "have.text",
      tableText.schemaProbeColumn
    );
  });

  it("columns — useDynamicColumn swaps the column list for columnData, which drives the headers", () => {
    // useDynamicColumn {{false}} (table.js:696) -> the static column list renders and
    // the `Column data` field is NOT mounted (Inspector Table.jsx:511-513).
    cy.get(tableSelector.propertyLabel(tableText.paramColumnData)).should(
      "have.length",
      0
    ); // source: table.js:696
    cy.get(tableSelector.columnListItem("id")).should("have.length", 1);

    toggleTableProperty(tableText.toggleUseDynamicColumn); // source: table.js:50
    cy.get(tableSelector.propertyLabel(tableText.paramColumnData))
      .scrollIntoView()
      .should("have.text", tableText.paramColumnData); // source: table.js:65
    cy.get(tableSelector.columnListItem("id")).should("have.length", 0);

    // columnData's default (table.js:697-700) maps to exactly two columns.
    cy.forceClickOnCanvas();
    cy.get(
      tableSelector.columnHeader(tableText.dynamicColumnHeaderEmail)
    ).should("have.text", tableText.dynamicColumnHeaderEmail); // source: table.js:697
    cy.get(
      tableSelector.columnHeader(tableText.dynamicColumnHeaderFullName)
    ).should("have.text", tableText.dynamicColumnHeaderFullName); // source: table.js:697
    cy.get(tableSelector.columnHeader("id")).should("have.length", 0);

    // Retyping columnData regenerates the schema (autoGenerateColumns.js:12-27).
    openEditorSidebar(W);
    verifyAndModifyParameter(
      tableText.paramColumnData,
      tableText.dynamicColumnDataOverride
    ); // source: table.js:65
    cy.forceClickOnCanvas();
    cy.get(
      tableSelector.columnHeader(tableText.dynamicColumnOverrideHeader)
    ).should("have.text", tableText.dynamicColumnOverrideHeader);
    cy.get(
      tableSelector.columnHeader(tableText.dynamicColumnHeaderFullName)
    ).should("have.length", 0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGINATION  (enablePagination · rowsPerPage · serverSidePagination ·
  //              serverSideRowsPerPage · totalRecords · enableNext/PrevButton)
  // ═══════════════════════════════════════════════════════════════════════════

  it("pagination — enablePagination renders the pager and rowsPerPage sizes the page", () => {
    cy.forceClickOnCanvas();
    cy.get(tableSelector.paginationSection).should("have.length", 1); // source: table.js:706
    // rowsPerPage {{10}} over the 10-row seed -> the whole dataset is page 1.
    cy.get(tableSelector.columnCells("id", W)).should(
      "have.length",
      tableText.defaultInput.length
    ); // source: table.js:701

    openEditorSidebar(W);
    setRowsPerPage(tableText.rowsPerPageOverride); // source: table.js:74
    cy.get(tableSelector.columnCells("id", W)).should(
      "have.length",
      tableText.rowsPerPageOverride
    );

    // Turning pagination off removes the pager AND the page cap.
    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleEnablePagination); // source: table.js:706
    cy.forceClickOnCanvas();
    cy.get(tableSelector.paginationSection).should("have.length", 0);
    cy.get(tableSelector.columnCells("id", W)).should(
      "have.length",
      tableText.defaultInput.length
    );
  });

  it("pagination — serverSidePagination mounts the server-side fields and rewires the pager", () => {
    // Default clientSide (table.js:702): the server-side-only fields are NOT mounted
    // (Inspector Table.jsx:447-456).
    accordionBody(tableText.accordionPagination)
      .find(tableSelector.toggleGroupItem(tableText.switchOptionClientSide))
      .closest("button")
      .should("have.attr", "data-state", "on"); // source: table.js:702
    cy.get(tableSelector.propertyLabel(tableText.paramTotalRecords)).should(
      "have.length",
      0
    );

    // Flip the Pagination 'Type' switch to Server side.
    accordionBody(tableText.accordionPagination)
      .find(tableSelector.toggleGroupItem(tableText.switchOptionServerSide))
      .click({ force: true }); // source: table.js:143
    cy.waitForAutoSave();
    cy.get(tableSelector.propertyLabel(tableText.paramTotalRecords))
      .scrollIntoView()
      .should("have.text", tableText.paramTotalRecords); // source: table.js:114

    // serverSideRowsPerPage has NO definition default (table.js:122 is absent from
    // `definition.properties`), so initSlice.js:56 falls back to '' -> knowTotalPages is
    // false and Pagination.jsx:79 renders ONLY the current page button.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.paginationButtonGoToPage).should("have.length", 1); // source: table.js:122

    // Giving it a page size makes the total page count knowable:
    // ceil(totalRecords 10 / 5) = 2 (Pagination.jsx:30-35).
    openEditorSidebar(W);
    setRowsPerPage(tableText.serverSideRowsPerPageOverride); // source: table.js:122
    cy.forceClickOnCanvas();
    cy.get(tableSelector.paginationButtonGoToPage).should("have.length", 2);

    // totalRecords {{10}} drives the footer record count in server-side mode
    // (RowCount.jsx:14) — in CLIENT mode the same label shows `dataLength` instead.
    cy.get(tableSelector.labelNumberOfRecords).should(
      "have.text",
      tableText.defaultNumberOfRecords
    ); // source: table.js:705
    openEditorSidebar(W);
    verifyAndModifyParameter(
      tableText.paramTotalRecords,
      `{{${tableText.totalRecordsOverride}}}`
    ); // source: table.js:114
    cy.forceClickOnCanvas();
    cy.get(tableSelector.labelNumberOfRecords).should(
      "have.text",
      `${tableText.totalRecordsOverride}${tableText.recordsSuffix}`
    );

    // enableNextButton / enablePrevButton ONLY gate the arrows in server-side mode
    // (Pagination.jsx:37-38); both drop as {{true}}.
    cy.get(tableSelector.paginationButtonToNext).should("not.be.disabled"); // source: table.js:703
    cy.get(tableSelector.paginationButtonToPrevious).should("not.be.disabled"); // source: table.js:704
    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleEnableNextPageButton); // source: table.js:83
    toggleTableProperty(tableText.toggleEnablePrevPageButton); // source: table.js:107
    cy.forceClickOnCanvas();
    cy.get(tableSelector.paginationButtonToNext).should("be.disabled");
    cy.get(tableSelector.paginationButtonToPrevious).should("be.disabled");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH, SORT AND FILTER
  // (displaySearchBox · serverSideSearch · enabledSort · serverSideSort ·
  //  showFilterButton · serverSideFilter)
  // ═══════════════════════════════════════════════════════════════════════════

  it("search — displaySearchBox renders a working search box and hides it when off", () => {
    cy.forceClickOnCanvas();
    // Attribute read needs no visibility (SearchBar.jsx:38 sits in a position:fixed bar).
    cy.get(tableSelector.searchInputField(W))
      .scrollIntoView()
      .invoke("attr", "placeholder")
      .should("contain", tableText.placeHolderSearch); // source: table.js:709
    searchOnTable(tableText.defaultInput[1].name, W);
    verifyTableElements([tableText.defaultInput[1]]); // source: table.js:692
    searchOnTable("", W);

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleShowSearch); // source: table.js:709
    cy.forceClickOnCanvas();
    cy.get(tableSelector.searchInputField(W)).should("have.length", 0);
  });

  it("search — serverSideSearch switches to Server side (and does NOT stop client filtering)", () => {
    // serverSideSearch is the FIRST 'Type' switch of this accordion — the children are
    // rendered in the order displaySearchBox, serverSideSearch, enabledSort,
    // serverSideSort, showFilterButton, serverSideFilter (Inspector Table.jsx:435-444).
    accordionBody(tableText.accordionSearchSortFilter)
      .find(tableSelector.toggleGroupItem(tableText.switchOptionClientSide))
      .eq(0)
      .closest("button")
      .should("have.attr", "data-state", "on"); // source: table.js:146

    accordionBody(tableText.accordionSearchSortFilter)
      .find(tableSelector.toggleGroupItem(tableText.switchOptionServerSide))
      .eq(0)
      .click({ force: true }); // source: table.js:151
    cy.waitForAutoSave();
    accordionBody(tableText.accordionSearchSortFilter)
      .find(tableSelector.toggleGroupItem(tableText.switchOptionServerSide))
      .eq(0)
      .closest("button")
      .should("have.attr", "data-state", "on");

    // 🐞 CONFIG-vs-BEHAVIOUR: unlike its siblings, serverSideSearch is NEVER handed to
    // useReactTable as `manualGlobalFilter` (useTable.js:108-110 only sets
    // manualPagination / manualSorting / manualFiltering). Its ONLY runtime effect is
    // resetting the page index (TableContainer.jsx:147-151), so the global search still
    // filters CLIENT-side even in "Server side" mode. Asserted as the real behaviour.
    cy.forceClickOnCanvas();
    searchOnTable(tableText.defaultInput[1].name, W);
    verifyTableElements([tableText.defaultInput[1]]); // source: table.js:146
  });

  it("sort — enabledSort sorts the column on a header click", () => {
    cy.forceClickOnCanvas();
    sortByColumn(tableText.name);
    // The arrow only renders once the column IS sorted (TableHeader.jsx:165-179).
    cy.get(tableSelector.sortIconAscending(tableText.name)).should(
      "have.length",
      1
    ); // source: table.js:834
    // Ascending by name puts "Alexander Vela" (seed id 9) first.
    verifySingleValueOnTable(tableText.name, 0, tableText.defaultInput[8].name); // source: table.js:692
  });

  it("sort — enabledSort off makes header clicks inert", () => {
    toggleTableProperty(tableText.toggleEnableColumnSorting); // source: table.js:834
    cy.forceClickOnCanvas();
    sortByColumn(tableText.name);
    cy.get(tableSelector.sortIconAscending(tableText.name)).should(
      "have.length",
      0
    );
    cy.get(tableSelector.sortIconDescending(tableText.name)).should(
      "have.length",
      0
    );
    // row order untouched — the seed's first row is still first
    verifySingleValueOnTable(tableText.name, 0, tableText.defaultInput[0].name);
  });

  it("sort — serverSideSort keeps the sort state but stops the client-side reorder", () => {
    // Sort 'Type' is the SECOND 'Type' switch of this accordion.
    accordionBody(tableText.accordionSearchSortFilter)
      .find(tableSelector.toggleGroupItem(tableText.switchOptionServerSide))
      .eq(1)
      .click({ force: true }); // source: table.js:167
    cy.waitForAutoSave();
    cy.forceClickOnCanvas();

    sortByColumn(tableText.name);
    // sorting STATE still applies (the arrow renders) ...
    cy.get(tableSelector.sortIconAscending(tableText.name)).should(
      "have.length",
      1
    );
    // ... but useTable passes manualSorting (useTable.js:109), so the rows keep their
    // original order and the server is expected to do the sorting.
    verifySingleValueOnTable(tableText.name, 0, tableText.defaultInput[0].name); // source: table.js:707
  });

  it("filter — showFilterButton renders a working filter panel and hides it when off", () => {
    cy.forceClickOnCanvas();
    cy.get(tableSelector.filterButton(W)).should("have.length", 1); // source: table.js:711
    addFilter(
      [
        {
          column: tableText.name,
          operation: "contains",
          value: tableText.filterSharedSurname,
        },
      ],
      true,
      W
    );
    // "Reyes" matches seed rows 3 (index 2) and 10 (index 9).
    verifyTableElements([
      tableText.defaultInput[2],
      tableText.defaultInput[9],
    ]); // source: table.js:692

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleEnableFiltering); // source: table.js:711
    cy.forceClickOnCanvas();
    cy.get(tableSelector.filterButton(W)).should("have.length", 0);
  });

  it("filter — serverSideFilter registers the filter but stops the client-side reduction", () => {
    // Filter 'Type' is the THIRD 'Type' switch of this accordion.
    accordionBody(tableText.accordionSearchSortFilter)
      .find(tableSelector.toggleGroupItem(tableText.switchOptionServerSide))
      .eq(2)
      .click({ force: true }); // source: table.js:179
    cy.waitForAutoSave();
    cy.forceClickOnCanvas();

    addFilter(
      [
        {
          column: tableText.name,
          operation: "contains",
          value: tableText.filterSharedSurname,
        },
      ],
      true,
      W
    );
    // The filter DID register — Header.jsx:82 paints the applied-state badge ...
    cy.get(tableSelector.filterAppliedState(W)).should("have.length", 1);
    // ... but manualFiltering (useTable.js:110) leaves every row rendered.
    cy.get(tableSelector.columnCells("id", W)).should(
      "have.length",
      tableText.defaultInput.length
    ); // source: table.js:708

    // 🐞 NOTE: serverSideFilter also carries a stray TOP-LEVEL `defaultValue:'clientSide'`
    // (table.js:181) that no sibling clientServerSwitch has and that contradicts its own
    // `validation.defaultValue: false` (:175) and definition `{{false}}` (:708). It is
    // inert — the switch resolves from the definition — which is why the clientSide leg
    // above is asserted from the definition value, not from :181.
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOLBAR / ADDITIONAL ACTIONS
  // (showDownloadButton · hideColumnSelectorButton · showAddNewRowButton ·
  //  showRefreshButton · showBulkUpdateActions)
  // ═══════════════════════════════════════════════════════════════════════════

  it("toolbar — download / manage-columns / add-new-row / refresh buttons follow their toggles", () => {
    cy.forceClickOnCanvas();
    // Defaults: download ON, column selector NOT hidden, add-new-row ON, refresh OFF
    // (ControlButtons.jsx:229-232 pushes each button behind its own flag).
    cy.get(tableSelector.buttonDownloadDropdown(W)).should("have.length", 1); // source: table.js:710
    cy.get(tableSelector.manageColumnsButton(W)).should("have.length", 1); // source: table.js:835
    cy.get(tableSelector.addNewRowButton(W)).should("have.length", 1); // source: table.js:837
    cy.get(tableSelector.refreshButton(W)).should("have.length", 0); // source: table.js:838

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleShowDownloadButton); // source: table.js:207
    toggleTableProperty(tableText.toggleHideColumnSelectorButton); // source: table.js:99
    toggleTableProperty(tableText.toggleShowAddNewRowButton); // source: table.js:274
    toggleTableProperty(tableText.toggleShowRefreshButton); // source: table.js:282

    cy.forceClickOnCanvas();
    cy.get(tableSelector.buttonDownloadDropdown(W)).should("have.length", 0);
    cy.get(tableSelector.manageColumnsButton(W)).should("have.length", 0);
    cy.get(tableSelector.addNewRowButton(W)).should("have.length", 0);
    cy.get(tableSelector.refreshButton(W)).should("have.length", 1);
  });

  it("toolbar — showBulkUpdateActions swaps the record count for the save/discard bar", () => {
    makeColumnEditable(tableText.name);
    editTableCell(tableText.name, 1, fake.firstName, W); // dynamic: fake

    // showBulkUpdateActions {{true}} -> the change bar replaces the row count while
    // there are pending edits (Footer.jsx:102).
    cy.get(tableSelector.saveChangesButton).should("have.length", 1); // source: table.js:829
    cy.get(tableSelector.discardChangesButton).should("have.length", 1);

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleShowUpdateButtons); // source: table.js:223
    cy.forceClickOnCanvas();
    cy.get(tableSelector.saveChangesButton).should("have.length", 0);
    cy.get(tableSelector.labelNumberOfRecords).should(
      "have.text",
      tableText.defaultNumberOfRecords
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROW SELECTION
  // (allowSelection · highlightSelectedRow · showBulkSelector ·
  //  disableRowDeselection · defaultSelectedRow · selectRowOnCellEdit)
  // ═══════════════════════════════════════════════════════════════════════════

  it("selection — allowSelection gates row selection entirely", () => {
    // highlightSelectedRow is the DOM signal for selection (TableRow.jsx:46), so turn it
    // on first; it drops as {{false}}.
    toggleTableProperty(tableText.toggleHighlightSelectedRow); // source: table.js:831
    cy.forceClickOnCanvas();
    selectTableRow(1, tableText.name, W);
    cy.get(tableSelector.row(1, W)).should("have.class", "selected"); // source: table.js:839

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleAllowSelection); // source: table.js:839
    cy.forceClickOnCanvas();
    // handleRowClick short-circuits before toggleSelected (TableData.jsx:133-140).
    selectTableRow(2, tableText.name, W);
    cy.get(tableSelector.row(2, W)).should("not.have.class", "selected");
  });

  it("selection — highlightSelectedRow paints the selected row", () => {
    cy.forceClickOnCanvas();
    // Row 1 (not 0 — defaultSelectedRow already selects row 0 on mount).
    selectTableRow(1, tableText.name, W);
    // Selected but NOT painted while highlightSelectedRow is {{false}}.
    cy.get(tableSelector.row(1, W)).should("not.have.class", "selected"); // source: table.js:831

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleHighlightSelectedRow); // source: table.js:247
    cy.forceClickOnCanvas();
    // The row is still selected, so flipping the flag alone paints it.
    cy.get(tableSelector.row(1, W)).should("have.class", "selected");
  });

  it("selection — showBulkSelector adds the header select-all checkbox", () => {
    cy.forceClickOnCanvas();
    // buildTableColumn.js:74-83 renders the header checkbox only when the flag is on.
    cy.get(tableSelector.selectAllRowsCheckbox).should("have.length", 0); // source: table.js:830

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleBulkSelection); // source: table.js:239
    cy.forceClickOnCanvas();
    cy.get(tableSelector.selectAllRowsCheckbox).should("have.length", 1);
    cy.get(tableSelector.selectAllRowsCheckbox).click({ force: true });
    verifySelectedRowCount(tableText.defaultInput.length, W); // source: table.js:692
  });

  it("selection — defaultSelectedRow selects the matching row on mount", () => {
    toggleTableProperty(tableText.toggleHighlightSelectedRow); // source: table.js:831
    cy.forceClickOnCanvas();
    // defaultSelectedRow {{{"id":1}}} is resolved against the seed on mount
    // (TableExposedVariables.jsx:268-273) -> the row whose id is 1 == row index 0.
    cy.get(tableSelector.row(0, W)).should("have.class", "selected"); // source: table.js:836
    cy.get(tableSelector.row(1, W)).should("not.have.class", "selected");
    // NOTE: the modify leg is deliberately omitted. The value is a TRIPLE-brace object
    // literal (`{{{"id":1}}}`); clearAndTypeOnCodeMirror tokenises brace-by-brace and
    // compensates for CodeMirror's auto-close, which is not deterministic for a nested
    // object literal — the default-effect assertion above is the reliable signal.
  });

  it("selection — disableRowDeselection keeps a selected row selected on re-click", () => {
    toggleTableProperty(tableText.toggleHighlightSelectedRow); // source: table.js:831
    cy.forceClickOnCanvas();
    // Baseline: a second click deselects (TableData.jsx:145 row.toggleSelected()).
    selectTableRow(1, tableText.name, W);
    cy.get(tableSelector.row(1, W)).should("have.class", "selected");
    selectTableRow(1, tableText.name, W);
    cy.get(tableSelector.row(1, W)).should("not.have.class", "selected"); // source: table.js:848

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleDisableRowDeselection); // source: table.js:255
    cy.forceClickOnCanvas();
    selectTableRow(2, tableText.name, W);
    cy.get(tableSelector.row(2, W)).should("have.class", "selected");
    // TableData.jsx:142-144 now returns before toggleSelected.
    selectTableRow(2, tableText.name, W);
    cy.get(tableSelector.row(2, W)).should("have.class", "selected");
  });

  it("selection — selectRowOnCellEdit makes an editable-cell click select the row", () => {
    toggleTableProperty(tableText.toggleHighlightSelectedRow); // source: table.js:831
    makeColumnEditable(tableText.name);
    cy.forceClickOnCanvas();

    // Default {{false}}: TableRow.jsx:159 keeps the current selection and only fires
    // onRowClicked, stopping propagation — so an unselected row STAYS unselected.
    cy.get(tableSelector.cell(tableText.name, 1, W)).click({ force: true });
    cy.get(tableSelector.row(1, W)).should("not.have.class", "selected"); // source: table.js:845

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleSelectRowOnCellEdit); // source: table.js:290
    cy.forceClickOnCanvas();
    // With the flag ON and the row not yet selected the guard fails, the click bubbles
    // to the <tr> and handleRowClick selects it.
    cy.get(tableSelector.cell(tableText.name, 2, W)).click({ force: true });
    cy.get(tableSelector.row(2, W)).should("have.class", "selected");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPANDABLE ROWS  (enableExpandableRows · expansionHeight)
  // ═══════════════════════════════════════════════════════════════════════════

  it("expansion — enableExpandableRows adds the chevron column and unlocks expansionHeight", () => {
    // enableExpandableRows {{false}} -> no expansion column, and expansionHeight is
    // conditionallyRender-gated on it (table.js:343-346) so its input is NOT mounted.
    cy.get(tableSelector.expandedRowHeightInput).should("have.length", 0); // source: table.js:336
    cy.forceClickOnCanvas();
    cy.get(tableSelector.expansionCell(0, W)).should("have.length", 0); // source: table.js:846

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleEnableExpandableRows); // source: table.js:328
    // The gate is now satisfied; the number input mounts with the {{229}} default
    // (CodeBuilder/Elements/Number.jsx:22).
    cy.get(tableSelector.expandedRowHeightInput)
      .scrollIntoView()
      .should("have.value", "229"); // source: table.js:847

    cy.forceClickOnCanvas();
    cy.get(tableSelector.expansionCell(0, W)).should("have.length", 1);
    cy.get(tableSelector.expandRowToggle(0, W)).click({ force: true });
    // ExpandedRowContainer.jsx:38 writes `height: ${expansionHeight}px` inline.
    cy.get(tableSelector.expandedRowContent).should("have.css", "height", "229px"); // source: table.js:847

    // Changing expansionHeight resizes the expanded slot.
    openEditorSidebar(W);
    cy.get(tableSelector.expandedRowHeightInput)
      .scrollIntoView()
      .clear()
      .type(`${tableText.expansionHeightOverride}`);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.expandedRowContent).should(
      "have.css",
      "height",
      `${tableText.expansionHeightOverride}px`
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL ACTIONS — STATE
  // (loadingState · disabledState · visibility · collapseWhenHidden · dynamicHeight)
  // ═══════════════════════════════════════════════════════════════════════════

  it("state — loadingState replaces the table body with the spinner", () => {
    cy.forceClickOnCanvas();
    cy.get(tableSelector.loadingSpinner).should("have.length", 0); // source: table.js:690

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleLoadingState); // source: table.js:36
    cy.forceClickOnCanvas();
    // LoadingState.jsx:8 replaces the rows entirely.
    cy.get(tableSelector.loadingSpinner).should("have.length", 1);
    cy.get(tableSelector.columnCells("id", W)).should("have.length", 0);
  });

  it("state — disabledState stamps data-disabled on the table root", () => {
    cy.forceClickOnCanvas();
    // Table.jsx:344 mirrors the isDisabled exposed variable onto the INNER root.
    cy.get(tableSelector.widgetDisabled(W)).should("have.length", 0); // source: table.js:843

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleDisable); // source: table.js:312
    cy.forceClickOnCanvas();
    cy.get(tableSelector.widgetDisabled(W)).should("have.length", 1);
  });

  it("state — visibility hides the table root", () => {
    cy.forceClickOnCanvas();
    // The outer RenderWidget box always mounts; visibility is written on the INNER root.
    cy.get(tableWidgetOuter(W)).scrollIntoView().should("have.length", 1);
    // Table.jsx:349 writes `display: none` on the inner root when isVisible is false.
    cy.get(tableWidgetInner(W))
      .scrollIntoView()
      .should("not.have.css", "display", "none"); // source: table.js:840

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleVisibility); // source: table.js:298
    cy.forceClickOnCanvas();
    cy.get(tableWidgetInner(W)).should("have.css", "display", "none");
  });

  it("state — collapseWhenHidden lets the widgets below collapse into the hidden row", () => {
    // collapseWhenHidden ONLY reflows in VIEW mode (RenderWidget.jsx:282-283 returns
    // early otherwise), and its effect is on the widgets BELOW: a widget that is hidden
    // AND opted in stops contributing a height floor, so downstream widgets collapse up
    // into the freed row (dynamicHeightReflow.js:33-35, 74-77). A Text widget dropped
    // below the Table is the observer.
    //
    // ORDERING (deliberate): collapseWhenHidden is enabled FIRST, while the Table is
    // still VISIBLE, and only then is the Table hidden. Both inspector visits therefore
    // hover a visible widget — openEditorSidebar realHovers the widget to reveal its
    // ConfigHandle, which is unreliable once the widget root is display:none.
    // dragAndDropWidget already opens the components panel itself
    // (appbuilderCommands.js:23), so no extra sidebar click is needed.
    cy.dragAndDropWidget("Text", 250, 700); // source: text.js (observer widget only)
    cy.hideTooltip();

    // Opt in to collapsing while the Table still renders.
    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleCollapseWhenHidden); // source: table.js:842
    cy.forceClickOnCanvas();

    // Baseline: collapse is ON but the Table is VISIBLE, so it is still in flow and
    // text1 keeps its authored row.
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(2500);
    cy.get(commonWidgetSelector.draggableWidget("text1"))
      .first()
      .then(($t) => {
        cy.wrap(Math.round($t[0].getBoundingClientRect().y)).as("beforeCollapse");
      });
    cy.go("back");
    cy.wait(2500);

    // Hiding it now takes it OUT of flow (only because collapseWhenHidden is on).
    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleVisibility); // source: table.js:840
    cy.forceClickOnCanvas();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(2500);
    cy.get("@beforeCollapse").then((before) => {
      cy.get(commonWidgetSelector.draggableWidget("text1"))
        .first()
        .should(($t) => {
          const y = Math.round($t[0].getBoundingClientRect().y);
          expect(
            y,
            "text1 collapses upward into the hidden table row"
          ).to.be.lessThan(before - 2); // dynamic: 2px tolerance
        });
    });
    cy.go("back");
  });

  it("state — dynamicHeight makes the table auto-size in view mode", () => {
    // Table.jsx:97 gates it on `currentMode === 'view'`, so it is INERT in the editor:
    // the root keeps a fixed `height: ${height}px` and gets NO min-height (:347-348).
    cy.forceClickOnCanvas();
    cy.get(tableWidgetInner(W))
      .scrollIntoView()
      .should("have.attr", "style")
      .and("not.include", "min-height"); // source: table.js:844

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleDynamicHeight); // source: table.js:319
    cy.forceClickOnCanvas();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(2500);
    // In view mode the same root switches to height:100% + an explicit min-height floor.
    cy.get(tableWidgetInner(W))
      .should("have.attr", "style")
      .and("include", "min-height");
    cy.go("back");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DEVICES  (others.showOnDesktop · others.showOnMobile)
  // ═══════════════════════════════════════════════════════════════════════════

  it("layout — showOnDesktop and showOnMobile drive the device visibility", () => {
    // verifyLayout opens the accordion (commonWidgetText.accordionLayout === 'Devices',
    // which is exactly the Table's device accordion title, Inspector Table.jsx:719),
    // verifies each fx default and asserts the widget disappears from desktop and
    // appears on mobile.
    // source: table.js:350 (showOnDesktop, default table.js:684)
    // source: table.js:351 (showOnMobile,  default table.js:685)
    verifyLayout(W);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIG-vs-UI GAPS — declared properties with NO control and NO consumer.
  // These three are asserted NEGATIVELY (their controls must not exist) because
  // there is nothing else in the product to observe. Reported as product bugs.
  // ═══════════════════════════════════════════════════════════════════════════

  it("config gaps — title and the two action-button colours have no inspector control", () => {
    // ---- title (table.js:7, definition 'Table' at :688) ----
    // DEAD KEY: the Table inspector never calls renderElement/renderCustomElement for
    // 'title' (Inspector Table.jsx:474-745 enumerates every rendered property), and a
    // grep over AppBuilder/Widgets/NewTable finds no consumer either — the widget has no
    // title chrome at all. The only observable fact is the absent control.
    cy.get(tableSelector.propertyLabel("Title")).should("have.length", 0); // source: table.js:7

    // ---- actionButtonBackgroundColor / actionButtonTextColor (table.js:183 / :191) ----
    // Both are declared `colorSwatches` with a validation default ('#375FCF' :188 and
    // '#fff' :196) but NO `definition.properties` entry. The Action buttons accordion
    // renders per-ACTION swatches instead, mounted with cyLabel 'action-button-bg' /
    // 'action-button-text' (Inspector Table.jsx:250-263) and written to the action
    // object's own backgroundColor/textColor keys — the component-level properties are
    // never read by NewTable.
    cy.get(tableSelector.propertyLabel("Background color")).should(
      "have.length",
      0
    ); // source: table.js:183
    cy.get(tableSelector.propertyLabel("Text color")).should("have.length", 0); // source: table.js:191
  });
});
