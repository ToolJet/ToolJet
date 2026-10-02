/**
 * SPEC — Table — contexts facet.
 *
 * The Table across device + data-binding contexts (checklist Layer B).
 * Modelled on components/checkbox/contexts.cy.js.
 *
 * ── TABLE-SPECIFIC DEVIATIONS FROM THE REFERENCE ─────────────────────────────
 * 1. The reference uses `openNode('components')` + `openAndVerifyNode(...)`.
 *    That path CANNOT work for a component: a DOM probe of the running app
 *    showed there is no `inspector-<component>-expand-button` — `-expand-button`
 *    exists only for the six level-1 groups (components / queries / globals /
 *    variables / page / constants). Individual components are
 *    `inspector-<name>-subnode-label`, which is what `openSubNode` clicks.
 *    `verifyTableExposedVars` wraps the whole verified sequence, so this spec
 *    uses it. (openStateFromComponent additionally throws on Table, because
 *    `draggable-widget-table1` matches two nodes and its realHover is unscoped.)
 * 2. `waitForDropSettle` does not exist in this repo; this uses the Table
 *    harness proven green by basics.cy.js / inspector.cy.js.
 */
import { fake } from "Fixtures/fake";
import { tableText } from "Texts/appBuilder/components/table";
import { verifyLayout } from "Support/utils/appBuilder/layout";
import {
  resizeTableWidget,
  verifyTableExposedVars,
  searchOnTable,
} from "Support/utils/appBuilder/components/table";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

describe("Table — contexts facet", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-Contexts`);
    cy.openApp();
    cy.viewport(1400, 2200);
    cy.dragAndDropWidget("Table", 250, 100);
    cy.hideTooltip();
    cy.modifyCanvasSize(900, 800);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    resizeTableWidget(W, 750, 600);
    resizeQueryPanel("1");
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  // Device-visibility context matrix: showOnDesktop {{true}} (source: table.js:684)
  // / showOnMobile {{false}} (source: table.js:685).
  it("device context — show on desktop / mobile toggles visibility", () => {
    verifyLayout(W);
  });

  // Exposed-value context at rest: the Table's state is observable in the app's
  // component tree without any interaction.
  it("exposed-value context — defaults observable in the inspector tree", () => {
    cy.forceClickOnCanvas();
    verifyTableExposedVars(
      [
        { key: "isVisible", type: "Boolean", value: "true" }, // source: table.js:540
        { key: "pageIndex", type: "Number", value: "1" }, // source: table.js:546
        { key: "searchText", type: "String", value: '""' }, // source: table.js:547
      ],
      W
    );
  });

  // Exposed-value context AFTER interaction: proves the tree tracks live state,
  // not just the mount-time snapshot. Strings render JSON-quoted in the detail
  // panel (StringNode.jsx:18), hence '"Olivia Nguyen"'.
  it("exposed-value context — searchText tracks a live interaction", () => {
    cy.forceClickOnCanvas();
    searchOnTable(tableText.defaultInput[0].name, W);
    cy.forceClickOnCanvas();
    verifyTableExposedVars(
      [
        {
          key: "searchText",
          type: "String",
          value: `"${tableText.defaultInput[0].name}"`, // source: table.js:547
        },
      ],
      W
    );
  });
});
