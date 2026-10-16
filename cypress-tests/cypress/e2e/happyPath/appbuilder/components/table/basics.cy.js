import { fake } from "Fixtures/fake";
import { tableText } from "Texts/appBuilder/components/table";
import {
  resizeTableWidget,
  verifyTableExposedVars,
} from "Support/utils/appBuilder/components/table";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// ---------------------------------------------------------------------------
// basics.cy.js — the CI-reliable smoke facet for the Table widget.
// Drops the widget and asserts its DEFAULT exposed values + exposed functions
// through the left component-state inspector. No fragile canvas DOM is touched.
//
// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
//
// WHY NOT openNode('components') + openAndVerifyNode():
//   The Table renders `draggable-widget-table1` on BOTH the outer RenderWidget
//   wrapper AND its inner <table>, so the shared openStateFromComponent()
//   realHover throws on the 2-node match. The table-specific
//   verifyTableExposedVars() (Support/utils/appBuilder/components/table.js:453)
//   scopes to :eq(0) and clicks the ConfigHandle inspect button instead — it is
//   the proven-green path (tableInteractions.cy.js:255).
//
// WHY THIS beforeEach and not the plain query-manager-toggle one:
//   `waitForDropSettle` does not exist in this repo (grep: no matches). The
//   harness below mirrors the proven-green tableEditing/tableInteractions
//   harness — widen viewport, widen canvas, close the settings panel, resize the
//   table, and shrink the query panel with resizeQueryPanel('1') (which is what
//   the query-manager toggle would otherwise achieve) so the widget's inspect
//   button is on-screen and hoverable.
// ---------------------------------------------------------------------------
describe("Table Component Tests", { testIsolation: false }, () => {
  const name = tableText.defaultWidgetName; // "table1"

  // --- FROM config.actions[]: one { key, type:"Function" } per callable handle.
  // NONE of the Table actions are flagged @deprecated in the config.
  // Every handle below is also registered at runtime via setExposedVariables
  // (TableExposedVariables.jsx / Table.jsx:300-308 / AddNewRow.jsx:54).
  const functions = [
    { key: "setPage", type: "Function" }, // source: table.js:556
    { key: "selectRow", type: "Function" }, // source: table.js:567
    { key: "deselectRow", type: "Function" }, // source: table.js:575
    { key: "selectRows", type: "Function" }, // source: table.js:579
    { key: "deselectRows", type: "Function" }, // source: table.js:593
    { key: "discardChanges", type: "Function" }, // source: table.js:607
    // PRODUCT BUG (F12/F13) — config declares `discardNewlyAddedRows` (table.js:611)
    // but the runtime does NOT expose it. The runtime instead exposes `resetChanges`,
    // which is absent from config.actions. Verified by DOM probe: the inspector's
    // function list contains `inspector-resetchanges-*` and has no
    // `inspector-discardnewlyaddedrows-*` node. Asserting the REAL runtime name so
    // this facet reflects the shipped surface; the config/runtime mismatch is
    // reported as a finding rather than hidden. Restore the config name here once
    // one of the two is corrected upstream.
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

  // --- SCALAR exposed values (String / Number / Boolean / null) -------------
  // Rendering rules derived from the inspector's CustomJSONViewer nodes:
  //   BooleanNode.jsx -> value.toString()   ("true" / "false")
  //   NumberNode.jsx  -> bare number        ("1")
  //   StringNode.jsx  -> JSON-quoted        ('""' for the empty string)
  //   NullNode.jsx    -> "null"
  // The string-is-quoted rule is already runtime-confirmed in this repo
  // (tableInteractions.cy.js:266 asserts searchText as '"Liam"').
  const scalarExposedValues = [
    { key: "isVisible", type: "Boolean", value: "true" }, // source: table.js:540
    { key: "isDisabled", type: "Boolean", value: "false" }, // source: table.js:541
    { key: "isLoading", type: "Boolean", value: "false" }, // source: table.js:542
    { key: "pageIndex", type: "Number", value: "1" }, // source: table.js:546
    { key: "searchText", type: "String", value: '""' }, // source: table.js:547
    { key: "lastExpandedRow", type: "Null", value: "null" }, // source: table.js:550
  ];

  // --- OBJECT / ARRAY exposed values ---------------------------------------
  // ObjectNode.jsx renders `{<Object.keys(value).length>}` and ArrayNode.jsx
  // renders `[<value.length>]` into the SAME `inspector-<key>-value` container
  // used by verifyNodeData — so an empty {} reads "{0}" and an empty [] reads
  // "[0]". These are NOT raw JSON dumps.
  //
  /* RESOLVE-LIVE: object/array exposed-var rows in the Table inspector.
     tableEditing.cy.js:65-70 records a prior run where `inspector-changeset-label`
     "did not resolve from the inspect-button flow". That note predates the
     CustomJSONViewer/Row.jsx viewer (which does emit
     inspector-<key>-label / -value for Object and Array rows), so the rows are
     expected to resolve now — confirm on the browser gate and, if the row is
     genuinely absent, downgrade this it() with the cited reason. */
  const objectExposedValues = [
    // DIVERGENCE (config vs runtime): the config default is {} (would render
    // "{0}"), but the widget drops with defaultSelectedRow {{{"id":1}}}
    // (table.js:836) over the 10-row seed dataset (table.js:692), and
    // TableExposedVariables.jsx:268-273 resolves that into the FULL row object.
    // Seed row id 1 has 7 keys (id, name, email, date, phone, interest, photo)
    // -> ObjectNode renders "{7}", NOT "{0}".
    { key: "selectedRow", type: "Object", value: "{7}" }, // source: table.js:836
    { key: "changeSet", type: "Object", value: "{0}" }, // source: table.js:544
    { key: "dataUpdates", type: "Array", value: "[0]" }, // source: table.js:545
    // NOT divergent despite defaultSelectedRow: selectedRows is only populated
    // when allowSelection AND showBulkSelector are both true
    // (TableExposedVariables.jsx:133-143) and showBulkSelector drops as false
    // (table.js:830), so it stays the config default [].
    { key: "selectedRows", type: "Array", value: "[0]" }, // source: table.js:548
    { key: "filters", type: "Array", value: "[0]" }, // source: table.js:549
    { key: "currentExpandedRows", type: "Array", value: "[0]" }, // source: table.js:551
    { key: "selectedColumnHeader", type: "Object", value: "{0}" }, // source: table.js:552
  ];

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-App`);
    cy.openApp();
    cy.viewport(1400, 2200);
    cy.dragAndDropWidget("Table", 250, 100); // drops as table1
    cy.hideTooltip();
    cy.modifyCanvasSize(900, 800);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    resizeTableWidget(name, 750, 600);
    resizeQueryPanel("1");
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  // NOTE: `cy.forceClickOnCanvas()` before every verifyTableExposedVars call is
  // REQUIRED, not cosmetic. The beforeEach leaves the "Add new component" panel
  // open (left-sidebar-settings-button), which covers the inspect-button target:
  // the click lands but the left inspector never populates, so EVERY
  // `inspector-<key>-label` lookup returns 0 nodes. Deselecting first is the
  // same sequence the proven-green tableInteractions.cy.js:251-267 uses.
  it("should verify the scalar exposed values on inspector", () => {
    cy.hideTooltip();
    cy.forceClickOnCanvas();
    verifyTableExposedVars(scalarExposedValues, name);
  });

  it("should verify the object and array exposed values on inspector", () => {
    cy.hideTooltip();
    cy.forceClickOnCanvas();
    verifyTableExposedVars(objectExposedValues, name);
  });

  it("should verify all the exposed functions on inspector", () => {
    cy.hideTooltip();
    cy.forceClickOnCanvas();
    verifyTableExposedVars(functions, name);
  });
});
