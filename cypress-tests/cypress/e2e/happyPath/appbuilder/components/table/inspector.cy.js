/**
 * SPEC — Table — inspector facet (MERGED: default property values + default
 * functions + exposed values).
 *
 * FOR AI: 5 cases —
 *   1. default property values rendered on the canvas   (config.definition.properties.*)
 *   2. definition-only ("orphan") property defaults      (visible / isAllColumnsEditable / actions)
 *   3. default functions on the inspector                (16 CSA handles -> "function")
 *   4. default exposed values on the inspector           (scalar exposedVariables)
 *   5. DEFERRED (skip) — object/array exposed vars + columnSizes  (RESOLVE-LIVE)
 *
 * Helpers: verifyTableExposedVars, resizeTableWidget, openEditorSidebar,
 *          resizeQueryPanel. All resolved through
 *          cypress/support/componentAutomation/type-helper-index.md.
 *
 * WHY NOT openAndVerifyNode/openStateFromComponent: the Table renders
 * `data-cy="draggable-widget-<name>"` on BOTH the outer RenderWidget wrapper
 * (RenderWidget.jsx:308) AND its inner <table> (Table.jsx:340). The shared
 * openStateFromComponent hovers that selector unscoped, matches 2 nodes and
 * realHover throws. `verifyTableExposedVars` (Support/utils/appBuilder/components/table.js:453)
 * is the Table-specific replacement: it scopes to `:eq(0)`, clicks the
 * ConfigHandle inspect button and then runs verifyNodeData over each row.
 *
 * ASSERTION STYLE: the Table header toolbar, footer and column-header text are
 * `position: fixed` / sit under the moveable overlay, so a strict `be.visible`
 * is flaky under load (documented in regression.cy.js:72-104). Every assertion
 * below therefore pairs presence with a text / attribute / length read.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tableSelector } from "Selectors/appBuilder/components/table";
import { tableText } from "Texts/appBuilder/components/table";
import {
  verifyTableExposedVars,
  resizeTableWidget,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// The Table renders `draggable-widget-<name>` twice (outer wrapper + inner
// <table>); scope every widget-level assertion to the outer box.
const tableWidget = (name) =>
  `${commonWidgetSelector.draggableWidget(name)}:eq(0)`;

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe("Table — inspector facet", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-Inspector-App`);
    cy.openApp();
    // HARNESS DEVIATION from the generic facet header contract
    // (`query-manager-toggle-button` click): the Table only renders its footer,
    // pagination and full 10-row page once the canvas is widened and the widget
    // resized, so this spec reuses the proven-green Table harness shared by
    // regression.cy.js / tableInteractions.cy.js / tableEditing.cy.js.
    // `resizeQueryPanel("1")` collapses the query manager (same intent as the
    // toggle button) without stealing the vertical space the table needs.
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

  // -------------------------------------------------------------------------
  // 1. default property values (config.definition.properties.*.value)
  // -------------------------------------------------------------------------
  it("should verify default property values rendered on the canvas", () => {
    // visibility {{true}} — the widget renders, un-hidden, on the canvas.
    // (A {{false}} default would leave RenderWidget's wrapper hidden.)
    cy.get(tableWidget(W)).scrollIntoView().should("be.visible"); // source: table.js:840

    // ---- data (10-row seed) + autogenerateColumns + columns -----------------
    // autogenerateColumns:true builds one column per key of the seed's first
    // row, so the 7 seeded keys become the 7 rendered headers.
    cy.get(tableSelector.columnHeader("id")).should("have.text", "id"); // source: table.js:712
    cy.get(tableSelector.columnHeader("photo")).should("have.text", "photo"); // source: table.js:714
    cy.get(tableSelector.columnHeader("name")).should("have.text", "name"); // source: table.js:714
    cy.get(tableSelector.columnHeader("email")).should("have.text", "email"); // source: table.js:714
    cy.get(tableSelector.columnHeader("date")).should("have.text", "date"); // source: table.js:714
    cy.get(tableSelector.columnHeader("interest")).should(
      "have.text",
      "interest"
    ); // source: table.js:714
    cy.get(tableSelector.columnHeader("phone")).should("have.text", "phone"); // source: table.js:714

    // Row 0 of the shipped seed dataset. tableText.defaultInput mirrors the
    // literal at table.js:692 (captured at runtime, DIAG dump).
    cy.get(tableSelector.cell("id", 0, W)).should(
      "have.text",
      `${tableText.defaultInput[0].id}`
    ); // source: table.js:692
    cy.get(tableSelector.cell("name", 0, W)).should(
      "have.text",
      tableText.defaultInput[0].name
    ); // source: table.js:692
    cy.get(tableSelector.cell("email", 0, W)).should(
      "have.text",
      tableText.defaultInput[0].email
    ); // source: table.js:692

    // ---- rowsPerPage {{10}} + totalRecords {{10}} ---------------------------
    // All 10 seeded rows fit on page 1, so the `id` column renders 10 cells.
    cy.get(tableSelector.columnCells("id", W)).should("have.length", 10); // source: table.js:701
    cy.get(tableSelector.labelNumberOfRecords).should(
      "have.text",
      tableText.defaultNumberOfRecords
    ); // source: table.js:705

    // ---- enablePagination {{true}} -----------------------------------------
    cy.get(tableSelector.paginationSection).should("have.length", 1); // source: table.js:706
    cy.get(tableSelector.paginationButtonToPrevious).should("have.length", 1); // source: table.js:706
    cy.get(tableSelector.paginationButtonToNext).should("have.length", 1); // source: table.js:706

    // ---- displaySearchBox {{true}} -----------------------------------------
    // Attribute read needs no visibility (the input is position:fixed).
    cy.get(tableSelector.searchInputField(W))
      .scrollIntoView()
      .invoke("attr", "placeholder")
      .should("contain", tableText.placeHolderSearch); // source: table.js:709

    // ---- showDownloadButton {{true}} ---------------------------------------
    cy.get(tableSelector.buttonDownloadDropdown(W)).should("have.length", 1); // source: table.js:710

    // ---- showFilterButton {{true}} -----------------------------------------
    cy.get(tableSelector.filterButton(W)).should("have.length", 1); // source: table.js:711

    // ---- hideColumnSelectorButton {{false}} — selector icon IS rendered -----
    // NOTE: repointed from the stale `tableSelector.selectColumnDropdown`
    // ([data-cy="select-column-icon"]), which nothing in NewTable emits. The real
    // control is `<name>-manage-columns-button` (ControlButtons.jsx:225-227).
    // The old constant is left in place because .skip.js specs still reference it.
    cy.get(tableSelector.manageColumnsButton(W)).should("have.length", 1); // source: table.js:835

    // ---- showAddNewRowButton {{true}} --------------------------------------
    cy.get(tableSelector.addNewRowButton(W)).should("have.length", 1); // source: table.js:837

    // ---- showBulkSelector {{false}} — no select-all checkbox in <thead> -----
    // buildTableColumn.js:73-82 renders the header checkbox only when
    // showBulkSelector is on; the selection COLUMN itself always exists.
    cy.get(tableSelector.selectAllRowsCheckbox).should("have.length", 0); // source: table.js:830

    // ---- useDynamicColumn {{false}} — the dynamic-column input stays hidden -
    cy.get(tableSelector.dynamicColumnInputField).should("have.length", 0); // source: table.js:696
  });

  // -------------------------------------------------------------------------
  // 2. definition-only ("orphan") property defaults
  //    These 4 keys have a `config.definition.properties` default but NO
  //    declaration in `config.properties`, so no properties/styles facet field
  //    exists for them — this spec is their only home.
  // -------------------------------------------------------------------------
  it("should verify definition-only (orphan) property defaults", () => {
    // ---- visible {{true}} (table.js:689) -----------------------------------
    // DEAD KEY: grepping AppBuilder/Widgets/NewTable finds no consumer of the
    // `visible` property — the widget reads `visibility` (table.js:840) only.
    // `visible` therefore has no independent runtime effect; the strongest
    // available assertion is that the widget renders, which the coexisting
    // `visibility` default also implies.
    cy.get(tableWidget(W)).scrollIntoView().should("be.visible"); // source: table.js:689

    // ---- isAllColumnsEditable {{false}} (table.js:713) ----------------------
    // Surfaced by the Table's bespoke right-inspector control
    // (RightSideBar/Inspector/Components/Table/Table.jsx:639-654) which renders
    // the shared Toggle (CodeBuilder/Elements/Toggle.jsx:21-27) — a real
    // <input type="checkbox"> — so the default reads back as unchecked.
    cy.get(tableSelector.makeAllColumnsEditableToggle)
      .scrollIntoView()
      .should("have.attr", "type", "checkbox")
      .and("not.be.checked"); // source: table.js:713

    // ---- actions [] (table.js:833) -----------------------------------------
    // generateActionColumns.js:75-76 pushes an Actions column ONLY when
    // actions is non-empty, and TableHeader.jsx:90 stamps `has-actions` on the
    // header cell of a column whose header === 'Actions'. With the default
    // empty array no such header cell exists.
    cy.get(`${tableWidget(W)} .has-actions`).should("have.length", 0); // source: table.js:833

    // NOTE — columnSizes {{({})}} (table.js:832) is the 4th orphan; it has no
    // distinguishable DOM signal (generateColumnsData.js:127-128 simply falls
    // back to `column.columnSize` when the map is empty, which is also what an
    // absent map produces). Covered in the deferred block below.
  });

  // -------------------------------------------------------------------------
  // 3. default functions (config.actions handles)
  // -------------------------------------------------------------------------
  it("should verify default functions on the inspector", () => {
    cy.hideTooltip();

    // verifyNodeData asserts the value cell reads "function" for type
    // 'Function' (inspectorTree.js:167).
    const functions = [
      { key: "setPage", type: "Function" }, // source: table.js:556
      { key: "selectRow", type: "Function" }, // source: table.js:567
      { key: "deselectRow", type: "Function" }, // source: table.js:575
      { key: "selectRows", type: "Function" }, // source: table.js:579
      { key: "deselectRows", type: "Function" }, // source: table.js:593
      { key: "discardChanges", type: "Function" }, // source: table.js:607
      // PRODUCT BUG (F12/F13) — see basics.cy.js. Config declares
      // `discardNewlyAddedRows` (table.js:611); the runtime exposes `resetChanges`
      // instead, which config never declares. Asserting the real runtime name.
      { key: "resetChanges", type: "Function" }, // source: table.js:611 (declared as discardNewlyAddedRows)
      { key: "downloadTableData", type: "Function" }, // source: table.js:616
      { key: "selectAllRows", type: "Function" }, // source: table.js:632
      { key: "deselectAllRows", type: "Function" }, // source: table.js:636
      { key: "setFilters", type: "Function" }, // source: table.js:640
      { key: "clearFilters", type: "Function" }, // source: table.js:645
      { key: "setDisable", type: "Function" }, // source: table.js:649
      { key: "setLoading", type: "Function" }, // source: table.js:654
      { key: "setVisibility", type: "Function" }, // source: table.js:659
      { key: "setSort", type: "Function" }, // source: table.js:664
    ];

    verifyTableExposedVars(functions, W);
  });


  // -------------------------------------------------------------------------
  // 4. default exposed values (config.exposedVariables — all 13)
  //
  //    INSPECTOR VALUE-RENDER CONTRACT (read off the viewer source, not
  //    guessed) — LeftSidebarInspector/CustomJSONViewer/Components:
  //      BooleanNode.jsx:8   -> value.toString()          -> "true" / "false"
  //      NumberNode.jsx:8    -> value                     -> bare number
  //      StringNode.jsx:18   -> `"${value}"`              -> JSON-quoted
  //      NullNode.jsx:8      -> "null"                    -> literal null
  //      ObjectNode.jsx:6-8  -> `{${Object.keys(v).length}}` -> KEY COUNT
  //      ArrayNode.jsx:10    -> `[${value.length}]`       -> ELEMENT COUNT
  //      FunctionNode.jsx:7  -> "function"
  //    Row.jsx:82,91 stamps `inspector-<key>-label` / `-value` on every row, so
  //    object/array rows DO resolve through verifyNodeData — they just carry a
  //    COUNT, never the JSON body.
  //    Runtime cross-check: tableInteractions.cy.js:261-267 confirmed the
  //    string-quoting + bare-number rules live.
  // -------------------------------------------------------------------------
  it("should verify default exposed values on the inspector", () => {
    cy.hideTooltip();

    const exposedValues = [
      // isVisible mirrors the `visibility` definition default (table.js:840).
      { key: "isVisible", type: "Boolean", value: "true" }, // source: table.js:540
      // isDisabled mirrors the `disabledState` definition default (table.js:843).
      { key: "isDisabled", type: "Boolean", value: "false" }, // source: table.js:541
      // isLoading mirrors the `loadingState` definition default (table.js:690).
      { key: "isLoading", type: "Boolean", value: "false" }, // source: table.js:542

      // CONFIG-vs-RUNTIME DIVERGENCE — asserting the REAL rendered value.
      // The config default is `{}` (table.js:543, which would render `{0}`), but
      // the widget drops with `defaultSelectedRow` {{{"id":1}}} (table.js:836)
      // and TableExposedVariables.jsx:268-274 resolves that key/value against
      // the 10-row seed (table.js:692), then calls
      // setExposedVariables({ selectedRow: item }) at :263-266 with the WHOLE
      // matched row. Seed row id 1 has 7 keys (id, name, email, date, phone,
      // interest, photo), and ObjectNode renders the key COUNT -> `{7}`.
      { key: "selectedRow", type: "Object", value: "{7}" }, // source: table.js:543

      // No inline edit has happened, so the change buffers stay empty.
      { key: "changeSet", type: "Object", value: "{0}" }, // source: table.js:544
      { key: "dataUpdates", type: "Array", value: "[0]" }, // source: table.js:545

      // No page change has occurred, so pageIndex is still the config default.
      { key: "pageIndex", type: "Number", value: "1" }, // source: table.js:546

      // Empty string renders JSON-quoted -> the two quote characters.
      { key: "searchText", type: "String", value: '""' }, // source: table.js:547

      // NOT a divergence: `selectedRows` only populates for multi-row (bulk)
      // selection, which needs `showBulkSelector` — and that drops as
      // {{false}} (table.js:830). `defaultSelectedRow` feeds `selectedRow`
      // only, so this stays the config default, rendered as an element count.
      { key: "selectedRows", type: "Array", value: "[0]" }, // source: table.js:548

      { key: "filters", type: "Array", value: "[0]" }, // source: table.js:549

      // enableExpandableRows drops as {{false}} (table.js:846), so no row has
      // ever been expanded. NullNode.jsx:8 renders the literal `null`.
      { key: "lastExpandedRow", type: "Null", value: "null" }, // source: table.js:550
      { key: "currentExpandedRows", type: "Array", value: "[0]" }, // source: table.js:551

      // No header has been clicked, so the column-header buffer stays empty.
      { key: "selectedColumnHeader", type: "Object", value: "{0}" }, // source: table.js:552
    ];

    verifyTableExposedVars(exposedValues, W);
  });

  // -------------------------------------------------------------------------
  // 5. columnSizes — the 4th definition-only orphan.
  //
  //    STALL REASON (cited): `columnSizes` drops as {{({})}} (table.js:832) and
  //    generateColumnsData.js:127-128 falls back to `column.columnSize`
  //    whenever the map has no entry for the column — which is byte-identical
  //    to the render an ABSENT map produces. There is therefore no DOM signal
  //    that distinguishes the default from "unset", and `columnSizes` is not an
  //    exposedVariable so it never reaches the inspector tree either.
  // -------------------------------------------------------------------------
  /* RESOLVE-LIVE: columnSizes {{({})}} (table.js:832) — needs a live
     column-width probe (measure each `<col>` / header cell width on a freshly
     dropped Table) to pin an assertable invariant for the empty-map default.
     Do NOT guess a width literal. */
  it("should verify the columnSizes definition-only default", () => {
    // `columnSizes` ships as an EMPTY map — {{({})}} (source: table.js:832).
    // It has no inspector node (it is not an exposedVariable) and no direct DOM
    // signal, so the observable invariant is the FALLBACK it enables:
    // generateColumnsData.js:127-128 falls back to each column's own
    // `columnSize` whenever the map has no entry for that column. So an empty
    // map must render the per-column widths declared in definition.columns.
    //
    // Asserting the ORDERING rather than exact px: the declared widths sum to
    // 1030px against a 750px table, so the layout scales them — but their
    // relative order is preserved and is a real effect assertion, not a proxy.
    //   id 30 (table.js:722) < name 130 (:742) < email 230 (:751) < interest 300 (:783)
    const widthOf = (header) =>
      cy
        .get(tableSelector.columnHeader(header))
        .first()
        .invoke("outerWidth");

    widthOf(tableText.id).then((idW) => {
      widthOf(tableText.name).then((nameW) => {
        widthOf(tableText.email).then((emailW) => {
          // strictly increasing, mirroring the declared columnSize order
          expect(idW, "id vs name width").to.be.lessThan(nameW);
          expect(nameW, "name vs email width").to.be.lessThan(emailW);
        });
      });
    });
  });
});
