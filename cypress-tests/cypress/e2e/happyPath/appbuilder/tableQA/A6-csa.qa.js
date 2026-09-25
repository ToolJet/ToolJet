// A6: Table CSAs (frontend/src/AppBuilder/WidgetManager/widgets/table.js:554-676
// `actions: [...]`). Each CSA is wired onto the Table's OWN "Row hovered" event via
// wireTableCSA (Support/utils/appBuilder/components/table.js) — a Control Component
// action targeting table1 itself — then fired with triggerTableCSA (a synthetic hover).
// ONE CSA per `it`, fresh app per `it`: wireTableCSA ADDS a brand-new "Row hovered"
// handler each call (it does not edit an existing one), so calling it twice in the
// same app would leave two live handlers and a single hover would fire both.
import { tq, col } from "./_harness";
// No default preselected row (the drag-in default {"id":1} makes a first click deselect row 0).
const app = (o = {}) => tq.app({ ...o, props: { defaultSelectedRow: "{{undefined}}", ...(o.props || {}) } });
import { tableSelector } from "Selectors/appBuilder/components/table";
import { tableText } from "Texts/appBuilder/components/table";
import {
  wireTableCSA,
  triggerTableCSA,
  toggleRowCheckbox,
  verifySelectedRowCount,
  editTableCell,
  addNewRow,
} from "Support/utils/appBuilder/components/table";

// wireTableCSA assumes the Inspector's Events accordion is already open on the
// canvas (selectEvent just clicks `add-event-handler`). app() only opens the
// editor; it does not select/open the widget's own config panel.
const openEventsPanel = (name = "table1") => {
  cy.get(`[data-cy="draggable-widget-${name}"]`).eq(0).realHover();
  cy.get(`[data-cy="${name}-properties-styles-button"]`).click();
  cy.get("body").then(($body) => {
    if ($body.find('[data-cy="add-event-handler"]').length === 0) {
      cy.get('[data-cy="widget-accordion-events"]').click({ force: true });
    }
  });
};

const wireCSA = (action, params = []) => {
  openEventsPanel();
  wireTableCSA(action, params);
  cy.get("body").type("{esc}");
  cy.forceClickOnCanvas();
};

const data = [
  { id: 1, name: "Sarah", qty: 5 },
  { id: 2, name: "Lisa", qty: 6 },
  { id: 3, name: "Sam", qty: 7 },
  { id: 4, name: "Jon", qty: 8 },
  { id: 5, name: "Amy", qty: 9 },
  { id: 6, name: "Max", qty: 10 },
];
const columns = [col("id"), col("name", "string", { isEditable: true }), col("qty", "number", { isEditable: true })];

describe("A6 CSAs — component-specific actions", () => {
  afterEach(() => tq.cleanup());

  it("setPage moves to the given page", () => {
    app({
      data,
      columns,
      props: { rowsPerPage: "{{2}}", enablePagination: "{{true}}" },
      probes: { p1: "{{components.table1.pageIndex}}" },
    });
    tq.probe("p1").should("have.text", "1");
    wireCSA(tableText.csaSetPage, [{ label: tableText.csaParamPage, value: "{{3}}" }]);
    triggerTableCSA();
    tq.probe("p1").should("have.text", "3");
    tq.cell(0, "id").should("contain.text", "5"); // page 3 of rowsPerPage=2 -> rows 5,6
  });

  it("selectRow selects the row matching key/value and exposes it", () => {
    app({ data, columns });
    wireCSA(tableText.csaSelectRow, [
      { label: tableText.csaParamKey, value: '{{"id"}}' },
      { label: tableText.csaParamValue, value: "{{4}}" },
    ]);
    triggerTableCSA();
    verifySelectedRowCount(1);
    cy.get(tableSelector.rowCheckbox(3)).should("be.checked"); // id:4 is row index 3
  });

  it("BUG CHECK: deselectRow has no Key/Value params in the Inspector, so it always clears row 0", () => {
    // table.js:576-578 declares { handle: 'deselectRow', displayName: 'Deselect row' }
    // with NO `params` array (unlike selectRow/selectRows/deselectRows, which all have
    // one) — yet the implementation (TableExposedVariables.jsx deselectRow(key,value))
    // does `data.findIndex(item => item[key] == value)`. Called with key=value=undefined
    // (the only way the no-params UI can call it), `item[undefined] == undefined` is
    // true for every row, so findIndex always returns 0: the CSA can only ever
    // deselect row 0, never the row a user actually wants.
    app({ data, columns, props: { showBulkSelector: "{{true}}" } });
    toggleRowCheckbox(0);
    toggleRowCheckbox(3);
    verifySelectedRowCount(2);
    wireCSA(tableText.csaDeselectRow, []);
    triggerTableCSA(2); // hover a third, unrelated row — onRowHovered is global, not per-row
    verifySelectedRowCount(1);
    cy.get(tableSelector.rowCheckbox(0)).should("not.be.checked");
    cy.get(tableSelector.rowCheckbox(3)).should("be.checked");
  });

  it("selectRows selects every row whose key matches one of the given values", () => {
    app({
      data,
      columns,
      props: { showBulkSelector: "{{true}}" },
      probes: { p1: "{{JSON.stringify(components.table1.selectedRows.map(r => r.id))}}" },
    });
    wireCSA(tableText.csaSelectRows, [
      { label: tableText.csaParamKey, value: '{{"id"}}' },
      { label: tableText.csaParamValues, value: "{{[2,4,6]}}" },
    ]);
    triggerTableCSA();
    verifySelectedRowCount(3);
    tq.probe("p1").should("contain.text", "2").and("contain.text", "4").and("contain.text", "6");
  });

  it("deselectRows clears selection for every row whose key matches one of the given values", () => {
    app({ data, columns, props: { showBulkSelector: "{{true}}" } });
    toggleRowCheckbox(1); // id:2
    toggleRowCheckbox(3); // id:4
    toggleRowCheckbox(5); // id:6
    verifySelectedRowCount(3);
    wireCSA(tableText.csaDeselectRows, [
      { label: tableText.csaParamKey, value: '{{"id"}}' },
      { label: tableText.csaParamValues, value: "{{[4]}}" },
    ]);
    triggerTableCSA();
    verifySelectedRowCount(2);
    cy.get(tableSelector.rowCheckbox(3)).should("not.be.checked");
  });

  it("selectAllRows selects every row", () => {
    app({ data, columns, props: { showBulkSelector: "{{true}}" } });
    wireCSA(tableText.csaSelectAllRows, []);
    triggerTableCSA();
    verifySelectedRowCount(data.length);
  });

  it("deselectAllRows clears every row's selection", () => {
    app({ data, columns, props: { showBulkSelector: "{{true}}" } });
    toggleRowCheckbox(0);
    toggleRowCheckbox(1);
    verifySelectedRowCount(2);
    wireCSA(tableText.csaDeselectAllRows, []);
    triggerTableCSA(2);
    verifySelectedRowCount(0);
  });

  it("setSort sorts by the given column and direction", () => {
    app({ data, columns, props: { enabledSort: "{{true}}" } });
    wireCSA(tableText.csaSetSort, [
      { label: tableText.csaParamColumnKey, value: '{{"qty"}}' },
      { label: "Order", type: "select", value: "Descending" },
    ]);
    triggerTableCSA();
    tq.cell(0, "id").should("contain.text", "6"); // qty:10 -> id 6 is the max, first when desc
  });

  it("setFilters filters rows down to the given condition", () => {
    app({ data, columns });
    wireCSA(tableText.csaSetFilters, [
      { label: tableText.csaParamParameters, value: "{{[{column:'name', condition:'contains', value:'Sam'}]}}" },
    ]);
    triggerTableCSA();
    tq.rows().should("have.length", 1);
    tq.cell(0, "name").should("contain.text", "Sam");
  });

  it("clearFilters restores the full row set after a filter was applied via the UI", () => {
    app({ data, columns, props: { showFilterButton: "{{true}}" } });
    // Apply a filter via the real filter panel first (not the CSA under test).
    cy.get(tableSelector.filterButton()).scrollIntoView().click({ force: true });
    cy.get(tableSelector.buttonAddFilter).click({ force: true });
    cy.get(tableSelector.filterInput(0)).type("Sam", { force: true });
    cy.wait(800);
    cy.get(tableSelector.buttonCloseFilters).click({ force: true });
    tq.rows().should("have.length.lessThan", data.length);

    wireCSA(tableText.csaClearFilters, []);
    triggerTableCSA();
    tq.rows().should("have.length", data.length);
  });

  it("discardChanges reverts unsaved inline edits", () => {
    app({ data, columns, probes: { cs: "{{JSON.stringify(components.table1.changeSet)}}" } });
    editTableCell("qty", 0, "999");
    tq.cell(0, "qty").should("contain.text", "999");
    tq.probe("cs").should("contain.text", "999");
    wireCSA(tableText.csaDiscardChanges, []);
    triggerTableCSA(1);
    tq.cell(0, "qty").should("contain.text", "5");
    tq.probe("cs").should("have.text", "{}");
  });

  it("discardNewlyAddedRows clears the pending add-new-row buffer and closes the panel", () => {
    // AddNewRow.jsx discardNewlyAddedRows() = clearAddNewRowDetails(id) + hideAddNewRowPopup() —
    // there's no dedicated exposed variable for the pending-new-row buffer, so the
    // observable effect is the "Add new rows" panel disappearing from the DOM.
    app({
      data,
      columns: [col("id"), col("name", "string", { isEditable: true }), col("email", "string", { isEditable: true })],
      props: { showAddNewRowButton: "{{true}}" },
    });
    addNewRow();
    cy.get(".table-add-new-row").should("exist");
    wireCSA(tableText.csaDiscardNewlyAddedRows, []);
    triggerTableCSA();
    cy.get(".table-add-new-row").should("not.exist");
  });

  ["csv", "xlsx", "pdf"].forEach((fmt) => {
    it(`downloadTableData('${fmt}') downloads a file of the right type`, () => {
      cy.exec("rm -rf cypress/downloads && mkdir -p cypress/downloads", { failOnNonZeroExit: false });
      app({ data, columns, props: { showDownloadButton: "{{true}}" } });
      wireCSA(tableText.csaDownloadTableData, [
        { label: "Type", type: "select", value: `Download as ${fmt === "xlsx" ? "Excel" : fmt.toUpperCase()}` },
      ]);
      triggerTableCSA();
      cy.exec(
        `bash -c 'for i in $(seq 1 20); do f=$(ls -t cypress/downloads 2>/dev/null | grep "\\.${fmt}$" | head -1); if [ -n "$f" ]; then echo "$f"; exit 0; fi; sleep 0.5; done; exit 1'`,
        { timeout: 15000 }
      )
        .its("stdout")
        .should("not.be.empty");
    });
  });

  it("setDisable(true) disables the table", () => {
    app({ data, columns, probes: { d: "{{components.table1.isDisabled}}" } });
    wireCSA(tableText.csaSetDisable, [{ label: tableText.csaParamValue, type: "toggle", value: true }]);
    triggerTableCSA();
    tq.probe("d").should("have.text", "true");
  });

  it("setLoading(true) shows the loading state", () => {
    app({ data, columns, probes: { l: "{{components.table1.isLoading}}" } });
    wireCSA(tableText.csaSetLoading, [{ label: tableText.csaParamValue, type: "toggle", value: true }]);
    triggerTableCSA();
    tq.probe("l").should("have.text", "true");
  });

  it("setVisibility(false) hides the table", () => {
    app({ data, columns, probes: { v: "{{components.table1.isVisible}}" } });
    wireCSA(tableText.csaSetVisibility, [{ label: tableText.csaParamValue, type: "toggle", value: false }]);
    triggerTableCSA();
    tq.probe("v").should("have.text", "false");
  });

  it("BUG CHECK: bad args — selectRow with a non-existent key/value clears selection instead of leaving it unchanged", () => {
    app({ data, columns });
    wireCSA(tableText.csaSelectRow, [
      { label: tableText.csaParamKey, value: '{{"id"}}' },
      { label: tableText.csaParamValue, value: "{{999}}" },
    ]);
    triggerTableCSA();
    verifySelectedRowCount(0);
  });
});
