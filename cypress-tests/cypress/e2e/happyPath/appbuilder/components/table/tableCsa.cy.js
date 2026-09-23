import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { tableText } from "Texts/appBuilder/components/table";
import { tableSelector } from "Selectors/appBuilder/components/table";
import {
  resizeTableWidget,
  toggleTableProperty,
  setRowsPerPage,
  wireTableCSA,
  triggerTableCSA,
  verifySelectedRowCount,
  selectTableRow,
  verifyTableElements,
  verifySingleValueOnTable,
  makeAllColumnsEditable,
  editTableCell,
  addFilter,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// ---------------------------------------------------------------------------
// Chunk 2 — Table component-specific actions (CSAs).
// All 16 CSAs from WidgetManager/widgets/table.js:545-660.
//
// Each test wires one CSA onto the Table's own `Row hovered` event (wireTableCSA),
// fires it by hovering a row (triggerTableCSA), and asserts through the DOM.
//
// RULES (see setCSAParam in Support/utils/events.js):
//   - string params MUST be quoted expressions: {{"id"}}, {{"name"}}
//   - numbers/arrays need braces only: {{3}}, {{[1,2]}}
//   - toggle params take an explicit `value: true|false` (a click flips, not sets)
//   - setSort needs an explicit Order — its {{asc}} default evaluates to undefined
//   - setFilters takes [{column, condition, value}] matched on columnDef.header
//
// Object/array exposed vars (selectedRow, sortApplied, filters) do not resolve through
// `inspector-<key>-value`, so assertions use observable DOM instead.
//
// NOTE on drags: a Button drag after the Table drag lands fine; what breaks is panel
// state — dragAndDropWidget clicks `right-sidebar-components-button`, so a preceding
// forceClickOnCanvas() (components panel already open) makes that click CLOSE it.
// ---------------------------------------------------------------------------
const tableWidget = (name) =>
  `${commonWidgetSelector.draggableWidget(name)}:eq(0)`;

describe("Table — component specific actions", { testIsolation: false }, () => {
  const name = tableText.defaultWidgetName;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-table-csa-App`);
    cy.openApp();
    cy.viewport(1400, 2200);
    cy.dragAndDropWidget("Table", 250, 100);
    cy.hideTooltip();
    cy.modifyCanvasSize(900, 800);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    resizeTableWidget(name, 750, 600);
    resizeQueryPanel("1");
    openEditorSidebar(name);
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  // ---- selection CSAs -------------------------------------------------

  it.only("selectRow selects the matching row", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    // Select the row whose `id` is 3 -> Sophia Reyes, row index 2.
    wireTableCSA(
      tableText.csaSelectRow,
      [
        { label: tableText.csaParamKey, value: '{{"id"}}' },
        { label: tableText.csaParamValue, value: "{{3}}" },
      ],
      name
    );
    triggerTableCSA(0, name);
    cy.get(tableSelector.rowCheckbox(2, name)).should("be.checked");
  });

  it("deselectRow clears the current selection", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(tableText.csaDeselectRow, [], name);
    cy.forceClickOnCanvas();
    // Row 0 arrives selected via defaultSelectedRow `{id: 1}` (initSlice.js:72).
    // deselectRow is declared with NO params (table.js:566-569) yet implemented as
    // deselectRow(key, value); called with no args its findIndex compares
    // `item[undefined] == undefined`, which matches index 0. So it deterministically
    // clears row 0 — assert exactly that.
    cy.get(tableSelector.rowCheckbox(0, name)).should("be.checked");
    triggerTableCSA(1, name);
    cy.get(tableSelector.rowCheckbox(0, name)).should("not.be.checked");
  });

  it("selectRows selects every matching row", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(
      tableText.csaSelectRows,
      [
        { label: tableText.csaParamKey, value: '{{"id"}}' },
        { label: tableText.csaParamValues, value: "{{[1,2]}}" },
      ],
      name
    );
    triggerTableCSA(0, name);
    verifySelectedRowCount(2, name);
  });

  it("deselectRows clears the matching rows", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(
      tableText.csaDeselectRows,
      [
        { label: tableText.csaParamKey, value: '{{"id"}}' },
        { label: tableText.csaParamValues, value: "{{[1,2]}}" },
      ],
      name
    );
    cy.forceClickOnCanvas();
    cy.get(tableSelector.selectAllRowsCheckbox).click({ force: true });
    verifySelectedRowCount(tableText.defaultInput.length, name);
    triggerTableCSA(4, name);
    verifySelectedRowCount(tableText.defaultInput.length - 2, name);
  });

  it("selectAllRows selects every row", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(tableText.csaSelectAllRows, [], name);
    triggerTableCSA(0, name);
    verifySelectedRowCount(tableText.defaultInput.length, name);
  });

  it("deselectAllRows clears every row", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(tableText.csaDeselectAllRows, [], name);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.selectAllRowsCheckbox).click({ force: true });
    verifySelectedRowCount(tableText.defaultInput.length, name);
    triggerTableCSA(0, name);
    verifySelectedRowCount(0, name);
  });

  // ---- pagination / sort / filter CSAs --------------------------------

  it("setPage moves to the requested page", () => {
    setRowsPerPage(4);
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(
      tableText.csaSetPage,
      [{ label: tableText.csaParamPage, value: "{{2}}" }],
      name
    );
    triggerTableCSA(0, name);
    verifyTableElements(tableText.defaultInput.slice(4, 8));
  });

  it("setSort sorts the given column", () => {
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(
      tableText.csaSetSort,
      [
        { label: tableText.csaParamColumnKey, value: '{{"name"}}' },
        { label: "Order", type: "select", value: "Ascending" }, // -> 'asc'
      ],
      name
    );
    triggerTableCSA(0, name);
    cy.get(
      `${tableSelector.sortIconAscending(tableText.name)}, ${tableSelector.sortIconDescending(
        tableText.name
      )}`
    ).should("exist");
  });

  it("clearFilters removes an applied filter", () => {
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(tableText.csaClearFilters, [], name);
    cy.forceClickOnCanvas();
    addFilter(
      [{ column: tableText.name, operation: "contains", value: "Reyes" }],
      true
    );
    // Filtered down to Sophia Reyes + Michael Reyes.
    verifyTableElements([
      tableText.defaultInput[2],
      tableText.defaultInput[9],
    ]);
    triggerTableCSA(0, name);
    verifyTableElements(tableText.defaultInput.slice(0, 3));
  });

  it("setFilters applies a filter", () => {
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    // setFilters takes an array of { id, value: { operation, value } }
    // (TableExposedVariables.jsx:362-372).
    wireTableCSA(
      tableText.csaSetFilters,
      [
        {
          label: tableText.csaParamParameters,
          // Shape per TableExposedVariables.jsx:362-372 — setFilters destructures
          // { column, condition, value } and matches column against
          // columnDef.header. An {id, value:{operation,...}} shape is silently
          // dropped because `filterFunctions[condition]` is undefined.
          value:
            '{{[{column: "name", condition: "contains", value: "Reyes"}]}}',
        },
      ],
      name
    );
    triggerTableCSA(0, name);
    verifyTableElements([
      tableText.defaultInput[2],
      tableText.defaultInput[9],
    ]);
  });

  // ---- edit lifecycle CSAs --------------------------------------------

  it("discardChanges reverts a pending inline edit", () => {
    makeAllColumnsEditable();
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(tableText.csaDiscardChanges, [], name);
    cy.forceClickOnCanvas();
    editTableCell("name", 0, "Temp Edit");
    verifySingleValueOnTable("name", 0, "Temp Edit");
    triggerTableCSA(1, name);
    verifySingleValueOnTable("name", 0, tableText.defaultInput[0].name);
  });

  it("discardNewlyAddedRows closes the add-new-row panel", () => {
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(tableText.csaDiscardNewlyAddedRows, [], name);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.addNewRowButton(name)).click({ force: true });
    cy.get(".table-add-new-row").should("exist");
    triggerTableCSA(0, name);
    cy.get(".table-add-new-row").should("not.exist");
  });

  // ---- misc CSAs -------------------------------------------------------

  it("setVisibility hides the table", () => {
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(
      tableText.csaSetVisibility,
      // Explicit FALSE — setVisibility(false) is what hides the table. Previously this
      // relied on a blind toggle click landing (or silently missing) on the declared
      // `{{false}}` default, which is why it flip-flopped between runs.
      [{ label: tableText.csaParamValue, type: "toggle", value: false }],
      name
    );
    triggerTableCSA(0, name);
    cy.get(tableWidget(name)).should("not.be.visible");
  });

  it("setLoading puts the table into its loading state", () => {
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(
      tableText.csaSetLoading,
      [{ label: tableText.csaParamValue, type: "toggle", value: true }],
      name
    );
    triggerTableCSA(0, name);
    // loadingState swaps the body for <LoadingState/>, whose spinner carries
    // `.loading-spinner-table-component` (TableData.jsx:162-168).
    cy.get(".loading-spinner-table-component").should("exist");
  });

  it("setDisable disables the table", () => {
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(
      tableText.csaSetDisable,
      [{ label: tableText.csaParamValue, type: "toggle", value: true }],
      name
    );
    triggerTableCSA(0, name);
    cy.get(tableWidget(name))
      .find('[class*="disabled"]')
      .should("exist");
  });

  // DEFERRED: downloadTableData's only param is `type`, a SELECT rendered with the
  // same data-cy as the action picker (`action-options-action-selection-field`,
  // EventManager.jsx:1044) so it needs the .eq(1) form in selectSupportCSAData rather
  // than the CodeHinter path wireTableCSA uses. Asserting it also needs a downloads
  // -folder read (deleteDownloadsFolder + dataCsvAssertionHelper), which belongs with
  // the Chunk 5 download-menu work.
  it.skip("downloadTableData downloads the table as CSV", () => {
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    wireTableCSA(tableText.csaDownloadTableData, [], name);
    triggerTableCSA(0, name);
  });
});
