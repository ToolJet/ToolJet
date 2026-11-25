/**
 * SPEC — Table — propertiesFx facet.
 *
 * FOR AI: covers the fx / dynamic-binding path of ALL 40 `config.properties` entries of
 * frontend/src/AppBuilder/WidgetManager/widgets/table.js. Every leg either
 *   (a) opens the field's fx editor, asserts the SHIPPED definition default renders in
 *       the CodeMirror line, types a REAL `{{expression}}` and asserts the RESOLVED
 *       effect on the rendered widget, or
 *   (b) asserts — for the fields the product gives NO fx affordance to — that the
 *       fx button is absent (each with the source line that proves why).
 *
 * ── WHICH FIELDS ACTUALLY GET AN FX BUTTON (SingleLineCodeEditor.jsx:698-701) ──
 *   renderFx() returns null when `paramType === 'query'` OR
 *   `!(paramLabel !== 'Type' && isFxNotRequired === undefined)`.
 * That single line decides the whole facet:
 *   • `autogenerateColumns` ships `isFxNotRequired: true` (table.js:59)  → NO fx button.
 *     This is the ONE fx-exempt property the plan calls out.
 *   • ALL FOUR `clientServerSwitch` fields are declared with displayName 'Type'
 *     (table.js:135/147/159/171) → renderFx() bails on the `paramLabel !== 'Type'`
 *     clause, so serverSidePagination / serverSideSearch / serverSideSort /
 *     serverSideFilter ALSO have no fx button. Reinforced by Code.jsx:8+72, which hard
 *     -codes `fxActive={false}` for three of them ("Client Server Toggle don't support
 *     Fx"). They are covered here as fx-ABSENT, not as positive fx legs.
 *   • `title`, `columns`, `actionButtonBackgroundColor` and `actionButtonTextColor` are
 *     never handed to renderElement at all (Inspector/Components/Table/Table.jsx:474-745
 *     enumerates every rendered property; `columns` is drawn as a DnD <List> at :516-604),
 *     so they have no control and therefore no fx button either — the DEAD KEYS proven
 *     by the sibling properties.cy.js.
 *   • The six `code` fields (data, columnData, rowsPerPage, totalRecords,
 *     serverSideRowsPerPage, defaultSelectedRow) are ALWAYS in code mode
 *     (SingleLineCodeEditor.jsx:662 `codeShow = paramType === 'code' || forceCodeBox`,
 *     and Code.jsx wraps the fx button in a `d-none` column for them). Their fx path is
 *     simply typing the binding — no fx click is possible or needed.
 *   • Everything else (23 toggles + `expansionHeight` number + `dataSourceSelector`
 *     dropdownMenu) gets a real, clickable fx button.
 *
 * ── DELIBERATE HELPER DEVIATION (verifyAndModifyToggleFx is NOT used) ──
 * The routed toggle helper `verifyAndModifyToggleFx` (appBuilder/properties.js) clicks
 * fx ON, asserts the default, then clicks fx OFF again and flips the plain toggle. It
 * therefore CANNOT leave the editor in fx mode, which is the entire point of this facet
 * (type a binding, assert the resolved effect). It also has no scrollIntoView, and the
 * Table inspector is far taller than one viewport. This spec composes the identical DOM
 * work locally from indexed selectors only (commonWidgetSelector.parameterFxButton /
 * tableSelector.propertyLabel / propertyInputField) via `openFxEditor` + `setFx`, and
 * still asserts the shipped fx default before typing — i.e. it is a superset of what the
 * helper does. No helper outside type-helper-index.md is imported.
 *
 * ── BINDING VOCABULARY ──
 * `clearAndTypeOnCodeMirror` tokenises with a regex that KEEPS ONLY matched substrings
 * (commands/appbuilder/codemirrorCommands.js:29) — `=`, `!` and `>` are silently dropped,
 * so `{{1 === 1}}` can never be typed through it. This spec instead uses the proven
 * `setTableData` technique (realClick → Meta+A → Backspace → native `.type()` with
 * parseSpecialCharSequences:false), which types ANY expression verbatim, and keeps the
 * boolean bindings free of dropped characters anyway:
 *     TRUE  → {{[1,2,3].includes(2)}}      FALSE → {{[1,2,3].includes(9)}}
 * Both are genuine computed expressions, not `{{true}}` / `{{false}}` literals.
 *
 * ── HARNESS ──
 * `waitForDropSettle` DOES NOT EXIST in this repo. The beforeEach is copied verbatim from
 * the runtime-green sibling properties.cy.js: viewport → drag → hideTooltip →
 * modifyCanvasSize → close settings panel → resizeTableWidget → resizeQueryPanel('1') →
 * openEditorSidebar. `draggable-widget-table1` matches TWO nodes (RenderWidget.jsx:308 and
 * Table.jsx:342), so widget-level lookups always disambiguate with :eq(0)/:eq(1).
 * openAccordion / closeAccordions are NOT used — every Table accordion ships expanded
 * (_ui/Accordion/AccordionItem.js:5) and the helpers are proven no-ops here.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, setTableData, setRowsPerPage,
 *     toggleTableProperty, verifyTableElements, searchOnTable, sortByColumn,
 *     selectTableRow, verifySelectedRowCount, makeColumnEditable, editTableCell
 *   appBuilder/properties.js — openEditorSidebar
 *   appBuilder/querymanager/queryPanel.js — resizeQueryPanel
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tableSelector } from "Selectors/appBuilder/components/table";
import { tableText } from "Texts/appBuilder/components/table";
import {
  resizeTableWidget,
  setTableData,
  setRowsPerPage,
  toggleTableProperty,
  verifyTableElements,
  sortByColumn,
  selectTableRow,
  verifySelectedRowCount,
  makeColumnEditable,
  editTableCell,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// RenderWidget.jsx:308 (outer wrapper) vs Table.jsx:342 (inner <table> root).
const tableWidgetInner = (name) =>
  `${commonWidgetSelector.draggableWidget(name)}:eq(1)`;

// Scope a lookup to one inspector accordion body (AccordionItem.js:34-38).
const accordionBody = (title) =>
  cy.get(commonWidgetSelector.accordion(title)).closest(".accordion-item");

// Computed boolean bindings — deliberately NOT `{{true}}` / `{{false}}` literals, so the
// leg proves the expression is EVALUATED and not just echoed back.
const FX_TRUE = "{{[1,2,3].includes(2)}}"; // dynamic: evaluates to true
const FX_FALSE = "{{[1,2,3].includes(9)}}"; // dynamic: evaluates to false

// Reveal + open a field's fx editor. FxButton.jsx renders `<cyLabel>-fx-button` and the
// container is only opacity-revealed on hover (SingleLineCodeEditor.jsx:703-706), hence
// the realHover on the label plus a forced click on the inner svg — exactly what
// appBuilder/properties.js:verifyAndModifyToggleFx does internally.
const openFxEditor = (displayName) => {
  cy.get(tableSelector.propertyLabel(displayName)).scrollIntoView().realHover();
  cy.get(commonWidgetSelector.parameterFxButton(displayName))
    .find("svg")
    .click({ force: true });
};

// Clear + native-type an expression into a CodeMirror field.
// The header comment here used to cite setTableData's realPress select-all +
// Backspace as the "proven" technique. That technique was NOT sound and has since
// been removed from setTableData (see components/table.js): `realPress` sends
// OS-LEVEL keys to whatever currently holds focus, and `realClick()` does not
// reliably focus a CodeMirror contenteditable. When focus was not in the editor,
// `Meta+A` + `Backspace` were handled by the EDITOR CANVAS — selecting every
// widget and DELETING it, which pops the "Are you sure you want to delete this
// component?" modal and leaves the app unsaved. That destroyed five variant specs
// outright before it was diagnosed from a failure screenshot.
// `cy.type()` focuses its SUBJECT and dispatches only to that element, so the
// keystrokes can never reach the canvas.
const typeFxExpression = (displayName, expression) => {
  const field = tableSelector.propertyInputField(displayName);
  cy.get(field).find(".cm-content").scrollIntoView();
  cy.get(field).find(".cm-content").click({ force: true });
  cy.get(field).find(".cm-content").type("{selectall}{backspace}", {
    force: true,
    delay: 0,
  });
  cy.get(field)
    .find(".cm-content")
    .type(expression, {
      parseSpecialCharSequences: false,
      force: true,
      delay: 0,
    });
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

// FX leg for a field that HAS an fx button (toggle / number / dropdownMenu):
// open fx → assert the shipped definition default renders → type the binding.
// Pass fxDefault = null to skip the default assertion (multi-line / non-deterministic).
const setFx = (displayName, fxDefault, expression) => {
  openFxEditor(displayName);
  if (fxDefault !== null) {
    cy.get(tableSelector.propertyInputField(displayName))
      .find(".cm-line")
      .should("have.text", fxDefault);
  }
  typeFxExpression(displayName, expression);
};

// FX leg for a `code` field — already in code mode, so no fx click.
const setCodeFx = (displayName, fxDefault, expression) => {
  cy.get(tableSelector.propertyInputField(displayName)).scrollIntoView();
  if (fxDefault !== null) {
    cy.get(tableSelector.propertyInputField(displayName))
      .find(".cm-line")
      .should("have.text", fxDefault);
  }
  typeFxExpression(displayName, expression);
};

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags throw
// "No dragIntercepted". Keeping the AUT stable across tests keeps the drag intercept
// valid. Each test still re-logs-in + creates its own app in beforeEach.
describe("Table — propertiesFx facet", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-PropertiesFx-App`); // dynamic: fake
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

  it("fx data — dataSourceSelector and data both resolve from a binding", () => {
    // ---- dataSourceSelector (dropdownMenu, table.js:14) ----
    // paramType 'dropdownMenu' + displayName 'Data source' + no isFxNotRequired, so
    // renderFx() mounts the button (SingleLineCodeEditor.jsx:698-701). The fx editor
    // opens on the raw definition string 'rawJson' (NOT braced — it is a plain value).
    setFx(
      tableText.paramDataSource,
      "rawJson", // source: table.js:691
      tableText.fxDataSourceRawJson
    ); // source: table.js:14

    // The binding must resolve back to 'rawJson', which is what keeps `data`'s
    // conditionallyRender gate (table.js:31-34) satisfied and the field mounted.
    openEditorSidebar(W);
    accordionBody(tableText.accordionData)
      .find(tableSelector.dataInputField)
      .should("have.length", 1); // source: table.js:21

    // ---- data (code, table.js:21) ----
    // Always a code editor, so the fx path IS the field. A computed .map() proves the
    // expression is evaluated rather than echoed.
    setTableData(tableText.fxDataExpression); // source: table.js:21
    verifyTableElements(tableText.fxDataRows); // source: table.js:692
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMNS  (columns · autogenerateColumns · useDynamicColumn · columnData)
  // ═══════════════════════════════════════════════════════════════════════════

  it("fx columns — autogenerateColumns and columns expose NO fx button; useDynamicColumn and columnData resolve bindings", () => {
    // ---- autogenerateColumns / "Lock column schema" — THE fx-exempt property ----
    // Declared `isFxNotRequired: true` (table.js:59), and renderFx() returns null for any
    // field whose isFxNotRequired is defined (SingleLineCodeEditor.jsx:699). The control
    // itself IS mounted (Inspector Table.jsx:613-636) — only the fx affordance is absent.
    cy.get(tableSelector.lockColumnSchemaToggle)
      .scrollIntoView()
      .should("have.length", 1); // source: table.js:56
    cy.get(
      commonWidgetSelector.parameterFxButton(tableText.toggleLockColumnSchema)
    ).should("have.length", 0); // source: table.js:59 (isFxNotRequired)

    // ---- columns (array, table.js:44) — DEAD FX ----
    // Never passed to renderElement: the Columns accordion draws the list through a
    // DragDropContext/List (Inspector Table.jsx:516-604), so no CodeHinter and no fx
    // button is ever created for displayName 'Table Columns'.
    cy.get(tableSelector.columnListItem("id")).should("have.length", 1); // source: table.js:714
    cy.get(
      commonWidgetSelector.parameterFxButton(tableText.paramTableColumns)
    ).should("have.length", 0); // source: table.js:44

    // ---- useDynamicColumn (toggle, table.js:48) ----
    setFx(
      tableText.toggleUseDynamicColumn,
      "{{false}}", // source: table.js:696
      FX_TRUE
    ); // source: table.js:48
    // Resolved true → the static list is replaced by the Column data field
    // (Inspector Table.jsx:511-513).
    openEditorSidebar(W);
    cy.get(tableSelector.propertyInputField(tableText.paramColumnData))
      .scrollIntoView()
      .should("have.length", 1); // source: table.js:65
    cy.get(tableSelector.columnListItem("id")).should("have.length", 0);

    // ---- columnData (code, table.js:65) ----
    // fxDefault is null on purpose: the shipped default is a long object-array literal
    // (table.js:697-700) whose CodeMirror whitespace is not statically assertable, and
    // 'Column data' is in HIDDEN_CODE_HINTER_LABELS (SingleLineCodeEditor.jsx:663) so the
    // label is not rendered either — the field is addressed by its input data-cy.
    setCodeFx(tableText.paramColumnData, null, tableText.fxColumnDataExpression); // source: table.js:65
    cy.get(tableSelector.columnHeader(tableText.email)).should(
      "have.text",
      tableText.email
    ); // source: table.js:65
    cy.get(tableSelector.columnHeader(tableText.name)).should(
      "have.text",
      tableText.name
    );
    cy.get(tableSelector.columnHeader(tableText.id)).should("have.length", 0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENT/SERVER SWITCHES — the four `Type` fields have no fx affordance
  // ═══════════════════════════════════════════════════════════════════════════

  it("fx switches — all four clientServerSwitch fields render but expose NO fx button", () => {
    // Every clientServerSwitch is declared with displayName 'Type', and renderFx() bails
    // on `paramLabel !== 'Type'` (SingleLineCodeEditor.jsx:699). Code.jsx:8 + :72 doubles
    // down for three of them with a literal comment: "Client Server Toggle don't support
    // Fx". All four therefore share ONE fx-absence fact, asserted here per accordion so
    // each field is individually accounted for.
    accordionBody(tableText.accordionPagination)
      .find(tableSelector.propertyLabel(tableText.paramSwitchType))
      .should("have.length", 1); // serverSidePagination — source: table.js:134
    accordionBody(tableText.accordionSearchSortFilter)
      .find(tableSelector.propertyLabel(tableText.paramSwitchType))
      .should("have.length", 3); // serverSideSearch :146 · serverSideSort :158 · serverSideFilter :170

    // Not one of the four gets an fx button.
    cy.get(
      commonWidgetSelector.parameterFxButton(tableText.paramSwitchType)
    ).should("have.length", 0); // source: table.js:135/147/159/171 (displayName 'Type')
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGINATION — client side  (rowsPerPage · enablePagination)
  // ═══════════════════════════════════════════════════════════════════════════

  it("fx pagination — rowsPerPage and enablePagination resolve from bindings", () => {
    // ---- rowsPerPage (code, table.js:74) ----
    cy.get(tableSelector.propertyInputField(tableText.paramRowsPerPage))
      .scrollIntoView()
      .find(".cm-line")
      .should("have.text", "{{10}}"); // source: table.js:701
    setRowsPerPage(tableText.fxRowsPerPageExpression); // source: table.js:74
    cy.get(tableSelector.columnCells(tableText.id, W)).should(
      "have.length",
      tableText.fxRowsPerPageResolved
    );

    // ---- enablePagination (toggle, table.js:126) ----
    // Ordered AFTER rowsPerPage: paginationOptions drops rowsPerPage from the accordion
    // once pagination is off (Inspector Table.jsx:449-457).
    openEditorSidebar(W);
    setFx(
      tableText.toggleEnablePagination,
      "{{true}}", // source: table.js:706
      FX_FALSE
    );
    cy.get(tableSelector.paginationSection).should("have.length", 0); // source: table.js:126
    // With the pager gone the page cap goes with it — the whole seed renders.
    cy.get(tableSelector.columnCells(tableText.id, W)).should(
      "have.length",
      tableText.defaultInput.length
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGINATION — server side
  // (serverSideRowsPerPage · totalRecords · enableNextButton · enablePrevButton)
  // ═══════════════════════════════════════════════════════════════════════════

  it("fx pagination — the server-side fields resolve from bindings", () => {
    // The four fields below only mount while pagination Type is Server side
    // (Inspector Table.jsx:452-455). The switch itself has no fx button (see the
    // switches test), so it is flipped through its ToggleGroup option.
    accordionBody(tableText.accordionPagination)
      .find(tableSelector.toggleGroupItem(tableText.switchOptionServerSide))
      .click({ force: true }); // source: table.js:143
    cy.waitForAutoSave();

    // ---- serverSideRowsPerPage (code, table.js:122) ----
    // fxDefault is null: this key has NO entry in definition.properties, so initSlice.js:56
    // falls back to '' and there is no shipped literal to assert.
    setRowsPerPage(tableText.fxServerSideRowsPerPageExpression); // source: table.js:122
    // ceil(totalRecords 10 / 5) = 2 knowable pages (Pagination.jsx:30-35).
    cy.get(tableSelector.paginationButtonGoToPage).should("have.length", 2);

    // ---- totalRecords (code, table.js:114) ----
    openEditorSidebar(W);
    setCodeFx(
      tableText.paramTotalRecords,
      "{{10}}", // source: table.js:705
      tableText.fxTotalRecordsExpression
    );
    cy.get(tableSelector.labelNumberOfRecords).should(
      "have.text",
      `${tableText.fxTotalRecordsResolved}${tableText.recordsSuffix}`
    ); // source: table.js:114

    // ---- enableNextButton (toggle, table.js:83) / enablePrevButton (toggle, table.js:107) ----
    // Both gate the arrows only in server-side mode (Pagination.jsx:37-38).
    cy.get(tableSelector.paginationButtonToNext).should("not.be.disabled"); // source: table.js:703
    cy.get(tableSelector.paginationButtonToPrevious).should("not.be.disabled"); // source: table.js:704

    openEditorSidebar(W);
    setFx(tableText.toggleEnableNextPageButton, "{{true}}", FX_FALSE); // source: table.js:83 / :703
    openEditorSidebar(W);
    setFx(tableText.toggleEnablePrevPageButton, "{{true}}", FX_FALSE); // source: table.js:107 / :704
    cy.get(tableSelector.paginationButtonToNext).should("be.disabled");
    cy.get(tableSelector.paginationButtonToPrevious).should("be.disabled");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH, SORT AND FILTER
  // (displaySearchBox · enabledSort · showFilterButton)
  // ═══════════════════════════════════════════════════════════════════════════

  it("fx search/sort/filter — displaySearchBox, enabledSort and showFilterButton resolve from bindings", () => {
    setFx(tableText.toggleShowSearch, "{{true}}", FX_FALSE); // source: table.js:199 / :709
    openEditorSidebar(W);
    setFx(tableText.toggleEnableColumnSorting, "{{true}}", FX_FALSE); // source: table.js:91 / :834
    openEditorSidebar(W);
    setFx(tableText.toggleEnableFiltering, "{{true}}", FX_FALSE); // source: table.js:215 / :711

    // displaySearchBox resolved false -> SearchBar.jsx:38 never mounts.
    cy.get(tableSelector.searchInputField(W)).should("have.length", 0); // source: table.js:709
    // showFilterButton resolved false -> the toolbar filter button is gone.
    cy.get(tableSelector.filterButton(W)).should("have.length", 0); // source: table.js:711
    // enabledSort resolved false -> a header click no longer paints a sort arrow
    // (TableHeader.jsx:165-179) and the row order is untouched.
    sortByColumn(tableText.name);
    cy.get(tableSelector.sortIconAscending(tableText.name)).should(
      "have.length",
      0
    ); // source: table.js:834
    cy.get(tableSelector.sortIconDescending(tableText.name)).should(
      "have.length",
      0
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOLBAR
  // (showDownloadButton · hideColumnSelectorButton · showAddNewRowButton ·
  //  showRefreshButton)
  // ═══════════════════════════════════════════════════════════════════════════

  it("fx toolbar — the four toolbar toggles resolve from bindings", () => {
    setFx(tableText.toggleShowDownloadButton, "{{true}}", FX_FALSE); // source: table.js:207 / :710
    openEditorSidebar(W);
    setFx(tableText.toggleHideColumnSelectorButton, "{{false}}", FX_TRUE); // source: table.js:99 / :835
    openEditorSidebar(W);
    setFx(tableText.toggleShowAddNewRowButton, "{{true}}", FX_FALSE); // source: table.js:274 / :837
    openEditorSidebar(W);
    setFx(tableText.toggleShowRefreshButton, "{{false}}", FX_TRUE); // source: table.js:282 / :838

    // ControlButtons.jsx:229-232 pushes each button behind its own resolved flag.
    cy.get(tableSelector.buttonDownloadDropdown(W)).should("have.length", 0);
    cy.get(tableSelector.manageColumnsButton(W)).should("have.length", 0);
    cy.get(tableSelector.addNewRowButton(W)).should("have.length", 0);
    cy.get(tableSelector.refreshButton(W)).should("have.length", 1);
  });

  it("fx toolbar — showBulkUpdateActions resolves from a binding", () => {
    setFx(tableText.toggleShowUpdateButtons, "{{true}}", FX_FALSE); // source: table.js:223 / :829

    // With the flag resolved false, a pending inline edit no longer swaps the record
    // count for the save/discard bar (Footer.jsx:102).
    openEditorSidebar(W);
    makeColumnEditable(tableText.name);
    editTableCell(tableText.name, 1, fake.firstName, W); // dynamic: fake
    cy.get(tableSelector.saveChangesButton).should("have.length", 0); // source: table.js:829
    cy.get(tableSelector.labelNumberOfRecords).should(
      "have.text",
      tableText.defaultNumberOfRecords
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROW SELECTION
  // (highlightSelectedRow · allowSelection · showBulkSelector ·
  //  disableRowDeselection · defaultSelectedRow · selectRowOnCellEdit)
  // ═══════════════════════════════════════════════════════════════════════════

  it("fx selection — highlightSelectedRow and allowSelection resolve from bindings", () => {
    // highlightSelectedRow is the DOM signal for selection (TableRow.jsx:46).
    setFx(tableText.toggleHighlightSelectedRow, "{{false}}", FX_TRUE); // source: table.js:247 / :831
    selectTableRow(1, tableText.name, W);
    cy.get(tableSelector.row(1, W)).should("have.class", "selected"); // source: table.js:831

    // allowSelection resolved false -> handleRowClick short-circuits before
    // toggleSelected (TableData.jsx:133-140).
    openEditorSidebar(W);
    setFx(tableText.toggleAllowSelection, "{{true}}", FX_FALSE); // source: table.js:231 / :839
    selectTableRow(2, tableText.name, W);
    cy.get(tableSelector.row(2, W)).should("not.have.class", "selected"); // source: table.js:839
  });

  it("fx selection — showBulkSelector resolves from a binding", () => {
    // buildTableColumn.js:74-83 only renders the header checkbox when the flag is on.
    cy.get(tableSelector.selectAllRowsCheckbox).should("have.length", 0); // source: table.js:830
    setFx(tableText.toggleBulkSelection, "{{false}}", FX_TRUE); // source: table.js:239 / :830
    cy.get(tableSelector.selectAllRowsCheckbox).should("have.length", 1);
    cy.get(tableSelector.selectAllRowsCheckbox).click({ force: true });
    verifySelectedRowCount(tableText.defaultInput.length, W);
  });

  it("fx selection — disableRowDeselection resolves from a binding", () => {
    toggleTableProperty(tableText.toggleHighlightSelectedRow); // source: table.js:831 (observation prerequisite)
    setFx(tableText.toggleDisableRowDeselection, "{{false}}", FX_TRUE); // source: table.js:255 / :848

    selectTableRow(2, tableText.name, W);
    cy.get(tableSelector.row(2, W)).should("have.class", "selected");
    // TableData.jsx:142-144 now returns before toggleSelected, so a re-click is inert.
    selectTableRow(2, tableText.name, W);
    cy.get(tableSelector.row(2, W)).should("have.class", "selected"); // source: table.js:848
  });

  it("fx selection — defaultSelectedRow resolves from a binding", () => {
    toggleTableProperty(tableText.toggleHighlightSelectedRow); // source: table.js:831 (observation prerequisite)

    // `code` field, always in code mode. The shipped default is the triple-braced object
    // literal at table.js:836; the binding below is an ARRAY INDEX expression, so it can
    // only match row id 3 if the expression is actually evaluated.
    setCodeFx(
      tableText.paramDefaultSelectedRow,
      '{{{"id":1}}}', // source: table.js:836
      tableText.fxDefaultSelectedRowExpression
    ); // source: table.js:263

    // TableExposedVariables.jsx:268-273 re-runs on every defaultSelectedRow change and
    // selects the row whose first key matches -> id 3 == row index 2.
    cy.get(tableSelector.row(2, W)).should("have.class", "selected"); // source: table.js:263
    cy.get(tableSelector.row(0, W)).should("not.have.class", "selected");
  });

  it("fx selection — selectRowOnCellEdit resolves from a binding", () => {
    setFx(tableText.toggleSelectRowOnCellEdit, "{{false}}", FX_TRUE); // source: table.js:290 / :845

    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleHighlightSelectedRow); // source: table.js:831 (observation prerequisite)
    makeColumnEditable(tableText.name);
    cy.forceClickOnCanvas();

    // Resolved true -> TableRow.jsx:159's guard fails, the click bubbles to the <tr> and
    // handleRowClick selects it.
    cy.get(tableSelector.cell(tableText.name, 2, W)).click({ force: true });
    cy.get(tableSelector.row(2, W)).should("have.class", "selected"); // source: table.js:845
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPANDABLE ROWS  (enableExpandableRows · expansionHeight)
  // ═══════════════════════════════════════════════════════════════════════════

  it("fx expansion — enableExpandableRows and expansionHeight resolve from bindings", () => {
    setFx(tableText.toggleEnableExpandableRows, "{{false}}", FX_TRUE); // source: table.js:328 / :846
    cy.get(tableSelector.expansionCell(0, W)).should("have.length", 1); // source: table.js:846

    // expansionHeight is a `number` field, so it renders a plain <input> until fx is
    // pressed; it is conditionallyRender-gated on enableExpandableRows (table.js:343-346),
    // which the binding above has just satisfied.
    openEditorSidebar(W);
    setFx(
      tableText.paramExpandedRowHeight,
      "{{229}}", // source: table.js:847
      tableText.fxExpansionHeightExpression
    ); // source: table.js:336

    // ExpandedRowContainer.jsx:38 writes `height: ${expansionHeight}px` inline.
    cy.get(tableSelector.expandRowToggle(0, W)).click({ force: true });
    cy.get(tableSelector.expandedRowContent).should(
      "have.css",
      "height",
      `${tableText.fxExpansionHeightResolved}px`
    ); // source: table.js:336
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL ACTIONS — STATE
  // (loadingState · disabledState · visibility · collapseWhenHidden · dynamicHeight)
  // ═══════════════════════════════════════════════════════════════════════════

  it("fx state — loadingState resolves from a binding", () => {
    setFx(tableText.toggleLoadingState, "{{false}}", FX_TRUE); // source: table.js:36 / :690
    // LoadingState.jsx:8 replaces the rows entirely.
    cy.get(tableSelector.loadingSpinner).should("have.length", 1); // source: table.js:690
    cy.get(tableSelector.columnCells(tableText.id, W)).should("have.length", 0);
  });

  it("fx state — disabledState resolves from a binding", () => {
    setFx(tableText.toggleDisable, "{{false}}", FX_TRUE); // source: table.js:312 / :843
    // Table.jsx:344 mirrors the resolved isDisabled onto the INNER root.
    cy.get(tableSelector.widgetDisabled(W)).should("have.length", 1); // source: table.js:843
  });

  it("fx state — visibility resolves from a binding", () => {
    setFx(tableText.toggleVisibility, "{{true}}", FX_FALSE); // source: table.js:298 / :840
    // Table.jsx:349 writes `display: none` on the inner root when isVisible resolves false.
    cy.get(tableWidgetInner(W)).should("have.css", "display", "none"); // source: table.js:840
  });

  it("fx state — collapseWhenHidden and dynamicHeight resolve from bindings in view mode", () => {
    // Both keys are view-mode-only: RenderWidget.jsx:282-283 returns early for
    // collapseWhenHidden outside view mode, and Table.jsx:97 gates dynamicHeight on
    // `currentMode === 'view'`. A Text widget dropped below the Table is the observer for
    // the collapse reflow (dynamicHeightReflow.js:33-35, 74-77).
    //
    // ORDERING (deliberate): both bindings are typed while the Table is still VISIBLE —
    // openEditorSidebar realHovers the widget to reveal its ConfigHandle, which is
    // unreliable once the widget root is display:none.
    cy.dragAndDropWidget("Text", 250, 700); // observer widget only
    cy.hideTooltip();

    openEditorSidebar(W);
    setFx(tableText.toggleCollapseWhenHidden, "{{false}}", FX_TRUE); // source: table.js:306 / :842
    openEditorSidebar(W);
    setFx(tableText.toggleDynamicHeight, "{{false}}", FX_TRUE); // source: table.js:319 / :844

    // Baseline preview: collapse resolved true but the Table is VISIBLE, so it still
    // occupies its row. The same visit proves the dynamicHeight binding: in view mode the
    // inner root switches to an explicit min-height floor (Table.jsx:347-348).
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(2500);
    cy.get(tableWidgetInner(W))
      .should("have.attr", "style")
      .and("include", "min-height"); // source: table.js:844
    cy.get(commonWidgetSelector.draggableWidget("text1"))
      .first()
      .then(($t) => {
        cy.wrap(Math.round($t[0].getBoundingClientRect().y)).as("beforeCollapse");
      });
    cy.go("back");
    cy.wait(2500);

    // Hiding the Table now takes it OUT of flow — only because collapseWhenHidden
    // resolved true. Visibility is a prerequisite here, driven as a plain toggle.
    openEditorSidebar(W);
    toggleTableProperty(tableText.toggleVisibility); // source: table.js:840 (prerequisite)
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
    }); // source: table.js:842
    cy.go("back");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DEAD KEYS — declared properties the Table inspector never renders, so there is
  // no control and no fx button to drive. Asserted negatively (the honest, runtime
  // -truthful assertion) and reported as product findings.
  // ═══════════════════════════════════════════════════════════════════════════

  it("fx config gaps — title and the two action-button colours expose NO fx button", () => {
    // ---- title (string, table.js:7 — definition 'Table' at :688) ----
    // The Table inspector never calls renderElement/renderCustomElement for 'title'
    // (Inspector Table.jsx:474-745 enumerates every rendered property) and no consumer
    // exists under AppBuilder/Widgets/NewTable, so neither the label nor the fx button
    // is ever created.
    cy.get(tableSelector.propertyLabel(tableText.paramTitle)).should(
      "have.length",
      0
    ); // source: table.js:7
    cy.get(
      commonWidgetSelector.parameterFxButton(tableText.paramTitle)
    ).should("have.length", 0); // source: table.js:7

    // ---- actionButtonBackgroundColor :183 / actionButtonTextColor :191 ----
    // Both are declared colorSwatches with a validation default but NO
    // definition.properties entry. The Action buttons accordion mounts PER-ACTION
    // swatches instead (cyLabel 'action-button-bg' / 'action-button-text', Inspector
    // Table.jsx:250-263) writing action.backgroundColor / action.textColor — the
    // component-level properties are never read, so they get no control and no fx button.
    cy.get(
      tableSelector.propertyLabel(tableText.paramActionButtonBackgroundColor)
    ).should("have.length", 0); // source: table.js:183
    cy.get(
      commonWidgetSelector.parameterFxButton(
        tableText.paramActionButtonBackgroundColor
      )
    ).should("have.length", 0); // source: table.js:183
    cy.get(
      tableSelector.propertyLabel(tableText.paramActionButtonTextColor)
    ).should("have.length", 0); // source: table.js:191
    cy.get(
      commonWidgetSelector.parameterFxButton(
        tableText.paramActionButtonTextColor
      )
    ).should("have.length", 0); // source: table.js:191
  });
});
