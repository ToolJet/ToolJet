import { fake } from "Fixtures/fake";
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
  verifyTableElements,
  verifySingleValueOnTable,
  verifyTableExposedVars,
  makeAllColumnsEditable,
  editTableCell,
  addFilter,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { deleteDownloadsFolder } from "Support/utils/common";

// ---------------------------------------------------------------------------
// Table — csa facet. All 16 component-specific actions declared in
// frontend/src/AppBuilder/WidgetManager/widgets/table.js:554-680, one it() each.
// No action in that block carries an @deprecated marker, so all 16 are pass-required.
//
// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags throw
// "No dragIntercepted". Keeping the AUT stable across tests keeps the drag intercept
// valid. Each test still re-logs-in + creates its own app in beforeEach, so shared
// browser state is not relied upon.
//
// DRIVING PATTERN — every CSA is wired onto the Table's OWN `Row hovered` event
// (wireTableCSA) and fired by hovering a data row (triggerTableCSA). Hover needs no
// second widget (hence no second drag, which is what makes button-driven CSA specs
// flaky here) and mutates no table state — unlike a row click, which changes selection
// and would corrupt every selection assertion. Each it() then asserts the REAL DOM
// effect, never just that the click landed.
//
// PARAM RULES (see setCSAParam, Support/utils/appBuilder/events.js:274):
//   - code params are evaluated as JS: strings MUST be quoted, `{{"id"}}` not `{{id}}`
//   - numbers/arrays need braces only: `{{3}}`, `{{[1,2]}}`
//   - toggle params take an explicit `value: true|false` (a click FLIPS, it does not set)
//   - select params are matched on the option NAME, not its stored value
//
// SEED STATE — the widget ships a 10-row demo dataset (table.js:692) AND
// `defaultSelectedRow: {{{"id":1}}}` (table.js:836), so row 0 arrives ALREADY selected
// and `selectedRow` is the full 7-key row object at rest, never `{}`. Deselect
// assertions below are written against that starting point.
//
// `draggable-widget-table1` matches TWO nodes (outer RenderWidget wrapper + the inner
// <table> root, Table.jsx:344) — every cy.get on it is disambiguated with
// .first()/.last(), and `openStateFromComponent` is unusable here, which is why
// exposed-var checks go through verifyTableExposedVars.
// ---------------------------------------------------------------------------

// Poll the downloads folder until every expected extension has a file whose name
// starts with the export prefix. cy.exec is not a query, so a bare `.should()` would
// never re-run it — hence the explicit recursion.
const waitForExports = (extensions, attempts = 12) => {
  cy.exec("ls -1 ./cypress/downloads/", { failOnNonZeroExit: false }).then(
    ({ stdout }) => {
      const files = stdout
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
      const missing = extensions.filter(
        (ext) =>
          !files.some(
            (f) => f.startsWith(tableText.exportFileNamePrefix) && f.endsWith(ext)
          )
      );
      if (missing.length && attempts > 0) {
        cy.wait(1000);
        waitForExports(extensions, attempts - 1);
        return;
      }
      expect(
        missing,
        `downloads folder contained: [${files.join(", ")}]`
      ).to.deep.equal([]);
    }
  );
};

describe("Table — component specific actions", { testIsolation: false }, () => {
  const name = tableText.defaultWidgetName;

  // Re-open the right sidebar on the Events accordion. triggerTableCSA (and
  // configureCSA) both end on forceClickOnCanvas, which closes the sidebar, so any
  // second wiring inside the same test has to come back through here.
  const openEvents = () => {
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
  };

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

  // ---- pagination ------------------------------------------------------

  it("setPage moves the table to the requested page", () => {
    setRowsPerPage(4);
    openEvents();
    wireTableCSA(
      tableText.csaSetPage, // source: table.js:557 — displayName "Set page"
      [
        {
          label: tableText.csaParamPage, // source: table.js:561 — param displayName "Page"
          // Declared defaultValue is `{{1}}` (source: table.js:562); page 2 proves the
          // action actually repaginates rather than re-rendering page 1.
          value: "{{2}}",
        },
      ],
      name
    );
    triggerTableCSA(0, name);
    // Rows 5-8 of the 10-row seed set are page 2 at 4 rows/page.
    verifyTableElements(tableText.defaultInput.slice(4, 8));
  });

  // ---- selection -------------------------------------------------------

  it("selectRow selects the row whose key matches the given value", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEvents();
    // Select the row whose `id` is 3 -> Sophia Reyes, row index 2.
    wireTableCSA(
      tableText.csaSelectRow, // source: table.js:568 — displayName "Select row"
      [
        { label: tableText.csaParamKey, value: '{{"id"}}' }, // source: table.js:570 — param "Key"
        { label: tableText.csaParamValue, value: "{{3}}" }, // source: table.js:571 — param "Value"
      ],
      name
    );
    triggerTableCSA(0, name);
    cy.get(tableSelector.rowCheckbox(2, name)).should("be.checked");
    // selectRow also republishes selectedRow/selectedRowId
    // (TableExposedVariables.jsx:300-311). selectedRowId is the row INDEX, so id 3 -> 2.
    // selectedRow itself is a 7-key object that the inspector renders collapsed, which
    // is why the scalar companion is what gets asserted here.
    verifyTableExposedVars([{ key: "selectedRowId", type: "number", value: "2" }], name);
  });

  it("deselectRow clears the current selection", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEvents();
    wireTableCSA(
      tableText.csaDeselectRow, // source: table.js:576 — displayName "Deselect row"
      [], // source: table.js:575-577 — declared with NO params
      name
    );
    cy.forceClickOnCanvas();
    // Row 0 arrives selected via defaultSelectedRow `{{{"id":1}}}` (source: table.js:836),
    // so `selectedRow` is NOT {} at rest.
    cy.get(tableSelector.rowCheckbox(0, name)).should("be.checked");
    triggerTableCSA(1, name);
    // CONFIG/IMPLEMENTATION MISMATCH: the action is declared param-less
    // (source: table.js:575-577) but implemented as deselectRow(key, value)
    // (TableExposedVariables.jsx:313-323). Called with no args its findIndex compares
    // `item[undefined] == undefined`, which matches index 0 — so it deterministically
    // clears row 0 and nothing else. Assert exactly that.
    cy.get(tableSelector.rowCheckbox(0, name)).should("not.be.checked");
  });

  it("selectRows selects every row matching the given values", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEvents();
    wireTableCSA(
      tableText.csaSelectRows, // source: table.js:580 — displayName "Select rows"
      [
        { label: tableText.csaParamKey, value: '{{"id"}}' }, // source: table.js:584 — param "Key"
        { label: tableText.csaParamValues, value: "{{[1,2]}}" }, // source: table.js:588 — param "Values"
      ],
      name
    );
    triggerTableCSA(0, name);
    // ids 1 and 2 -> row indices 0 and 1. Row 0 was already selected by
    // defaultSelectedRow, so the union is still exactly 2 rows.
    verifySelectedRowCount(2, name);
  });

  it("deselectRows clears every row matching the given values", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEvents();
    wireTableCSA(
      tableText.csaDeselectRows, // source: table.js:594 — displayName "Deselect rows"
      [
        { label: tableText.csaParamKey, value: '{{"id"}}' }, // source: table.js:598 — param "Key"
        { label: tableText.csaParamValues, value: "{{[1,2]}}" }, // source: table.js:602 — param "Values"
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
    openEvents();
    wireTableCSA(
      tableText.csaSelectAllRows, // source: table.js:633 — displayName "Select all rows"
      [], // source: table.js:632-634 — no params
      name
    );
    triggerTableCSA(0, name);
    verifySelectedRowCount(tableText.defaultInput.length, name);
  });

  it("deselectAllRows clears every row", () => {
    toggleTableProperty(tableText.toggleBulkSelection);
    openEvents();
    wireTableCSA(
      tableText.csaDeselectAllRows, // source: table.js:637 — displayName "Deselect all rows"
      [], // source: table.js:636-638 — no params
      name
    );
    cy.forceClickOnCanvas();
    cy.get(tableSelector.selectAllRowsCheckbox).click({ force: true });
    verifySelectedRowCount(tableText.defaultInput.length, name);
    triggerTableCSA(0, name);
    // Goes to 0 even though defaultSelectedRow pre-selected row 0 — resetRowSelection
    // clears the tanstack selection map outright (TableExposedVariables.jsx).
    verifySelectedRowCount(0, name);
  });

  // ---- sort ------------------------------------------------------------

  it("setSort sorts the given column in every declared direction", () => {
    openEvents();
    // Handlers stacked on the SAME `Row hovered` trigger fire in creation order, so the
    // LAST one wired is what the DOM shows after a hover. `Auto` is wired FIRST and
    // asserted while it is the only handler, because its result depends on the current
    // sort (TableExposedVariables.jsx: `desc = currentSort ? !currentSort.desc : false`)
    // and would be ambiguous if it ran after another setSort in the same tick.

    // 1/3 — Auto, on a table with no sort yet -> desc=false -> ascending.
    wireTableCSA(
      tableText.csaSetSort, // source: table.js:665 — displayName "Set sort"
      [
        { label: tableText.csaParamColumnKey, value: '{{"name"}}' }, // source: table.js:667 — param "Column key"
        {
          label: tableText.csaParamOrder, // source: table.js:669 — param "Order"
          type: "select", // source: table.js:674 — type "select"
          value: tableText.csaOrderAuto, // source: table.js:673 — option "Auto" -> 'auto'
        },
      ],
      name,
      0
    );
    triggerTableCSA(0, name);
    cy.get(tableSelector.sortIconAscending(tableText.name)).should("be.visible");
    verifySingleValueOnTable(tableText.name, 0, "Alexander Vela");

    // 2/3 — Descending wired after Auto, so it wins the hover.
    openEvents();
    wireTableCSA(
      tableText.csaSetSort, // source: table.js:665
      [
        { label: tableText.csaParamColumnKey, value: '{{"name"}}' }, // source: table.js:667
        {
          label: tableText.csaParamOrder, // source: table.js:669
          type: "select", // source: table.js:674
          value: tableText.csaOrderDescending, // source: table.js:672 — option "Descending" -> 'desc'
        },
      ],
      name,
      1
    );
    triggerTableCSA(0, name);
    cy.get(tableSelector.sortIconDescending(tableText.name)).should("be.visible");
    verifySingleValueOnTable(tableText.name, 0, "William Sanchez");

    // 3/3 — Ascending wired last, so it wins the hover.
    openEvents();
    wireTableCSA(
      tableText.csaSetSort, // source: table.js:665
      [
        { label: tableText.csaParamColumnKey, value: '{{"name"}}' }, // source: table.js:667
        {
          label: tableText.csaParamOrder, // source: table.js:669
          type: "select", // source: table.js:674
          value: tableText.csaOrderAscending, // source: table.js:671 — option "Ascending" -> 'asc'
        },
      ],
      name,
      2
    );
    triggerTableCSA(0, name);
    cy.get(tableSelector.sortIconAscending(tableText.name)).should("be.visible");
    verifySingleValueOnTable(tableText.name, 0, "Alexander Vela");
  });

  // ---- filters ---------------------------------------------------------

  it("setFilters applies the given filter", () => {
    openEvents();
    wireTableCSA(
      tableText.csaSetFilters, // source: table.js:641 — displayName "Set filters"
      [
        {
          label: tableText.csaParamParameters, // source: table.js:642 — param "Parameters"
          // Shape per TableExposedVariables.jsx:362-372 — setFilters destructures
          // { column, condition, value } and matches `column` against columnDef.header.
          // An { id, value: { operation } } shape is silently dropped because
          // `filterFunctions[condition]` is undefined.
          value: '{{[{column: "name", condition: "contains", value: "Reyes"}]}}',
        },
      ],
      name
    );
    triggerTableCSA(0, name);
    // Filtered down to Sophia Reyes + Michael Reyes.
    verifyTableElements([tableText.defaultInput[2], tableText.defaultInput[9]]);
  });

  it("clearFilters removes an applied filter", () => {
    openEvents();
    wireTableCSA(
      tableText.csaClearFilters, // source: table.js:646 — displayName "Clear filters"
      [], // source: table.js:645-647 — no params
      name
    );
    cy.forceClickOnCanvas();
    addFilter(
      [{ column: tableText.name, operation: "contains", value: "Reyes" }],
      true
    );
    verifyTableElements([tableText.defaultInput[2], tableText.defaultInput[9]]);
    triggerTableCSA(0, name);
    verifyTableElements(tableText.defaultInput.slice(0, 3));
  });

  // ---- edit lifecycle --------------------------------------------------

  it("discardChanges reverts a pending inline edit", () => {
    makeAllColumnsEditable();
    openEvents();
    wireTableCSA(
      tableText.csaDiscardChanges, // source: table.js:608 — displayName "Discard Changes"
      [], // source: table.js:607-609 — no params
      name
    );
    cy.forceClickOnCanvas();
    editTableCell(tableText.name, 0, "Temp Edit");
    verifySingleValueOnTable(tableText.name, 0, "Temp Edit");
    triggerTableCSA(1, name);
    verifySingleValueOnTable(tableText.name, 0, tableText.defaultInput[0].name);
  });

  it("discardNewlyAddedRows closes the add-new-row panel", () => {
    openEvents();
    wireTableCSA(
      tableText.csaDiscardNewlyAddedRows, // source: table.js:612 — displayName "Discard newly added rows"
      [], // source: table.js:611-613 — no params
      name
    );
    cy.forceClickOnCanvas();
    cy.get(tableSelector.addNewRowButton(name)).click({ force: true });
    cy.get(tableSelector.addNewRowPanel).should("be.visible");
    triggerTableCSA(0, name);
    cy.get(tableSelector.addNewRowPanel).should("not.exist");
  });

  // ---- export ----------------------------------------------------------

  it("downloadTableData exports the table in each declared type", () => {
    deleteDownloadsFolder();
    // One handler per `type` option, all on the same `Row hovered` trigger, so a single
    // hover emits all three files. Filenames are `table1_DD-MM-YYYY_HH-mm.<ext>`
    // (NewTable/_utils/exportData.js:99) — the timestamp is unknowable here, so the
    // assertion is prefix + extension.
    //
    // NOTE (config bug): the declared defaultValue is `{{Download as Excel}}`
    // (source: table.js:626), which evaluates `Download as Excel` as JS and is a syntax
    // error, so an untouched param resolves to undefined and downloadTableData's switch
    // matches nothing — no file at all. Every option below is therefore set explicitly.
    wireTableCSA(
      tableText.csaDownloadTableData, // source: table.js:617 — displayName "Download table data"
      [
        {
          label: tableText.csaParamType, // source: table.js:620 — param "Type"
          type: "select", // source: table.js:628 — type "select"
          value: tableText.csaOptionDownloadCsv, // source: table.js:623 — option "Download as CSV" -> 'csv'
        },
      ],
      name,
      0
    );
    openEvents();
    wireTableCSA(
      tableText.csaDownloadTableData, // source: table.js:617
      [
        {
          label: tableText.csaParamType, // source: table.js:620
          type: "select", // source: table.js:628
          value: tableText.csaOptionDownloadExcel, // source: table.js:622 — option "Download as Excel" -> 'xlsx'
        },
      ],
      name,
      1
    );
    openEvents();
    wireTableCSA(
      tableText.csaDownloadTableData, // source: table.js:617
      [
        {
          label: tableText.csaParamType, // source: table.js:620
          type: "select", // source: table.js:628
          value: tableText.csaOptionDownloadPdf, // source: table.js:624 — option "Download as PDF" -> 'pdf'
        },
      ],
      name,
      2
    );
    triggerTableCSA(0, name);

    waitForExports([
      tableText.exportExtensionCsv,
      tableText.exportExtensionExcel,
      tableText.exportExtensionPdf,
    ]);

    // Content check on the CSV (the only plain-text export). exportData.js:53 writes
    // every visible column, so the row-level assertion is that each seed row's
    // id / name / email all reached the file.
    cy.exec("ls -1 ./cypress/downloads/", { failOnNonZeroExit: false }).then(
      ({ stdout }) => {
        const csvFile = stdout
          .split("\n")
          .map((f) => f.trim())
          .find(
            (f) =>
              f.startsWith(tableText.exportFileNamePrefix) &&
              f.endsWith(tableText.exportExtensionCsv)
          );
        cy.readFile(`cypress/downloads/${csvFile}`, "utf-8").then((csv) => {
          tableText.defaultInput.forEach((row) => {
            expect(csv).to.contain(row.name);
            expect(csv).to.contain(row.email);
          });
        });
      }
    );
  });

  // ---- disable / loading / visibility ----------------------------------

  it("setDisable disables the table", () => {
    openEvents();
    wireTableCSA(
      tableText.csaSetDisable, // source: table.js:650 — displayName "Set disable"
      [
        {
          label: tableText.csaParamValue, // source: table.js:651 — param "Value"
          type: "toggle", // source: table.js:651 — type "toggle"
          // Declared default is `{{false}}` (source: table.js:651); true is the value
          // that produces an observable effect. setCSAParam SETS the toggle (a raw
          // click only flips), so this is deterministic.
          value: true,
        },
      ],
      name
    );
    triggerTableCSA(0, name);
    // Table.jsx:344 — the inner <table> root mirrors isDisabled onto data-disabled.
    cy.get(tableSelector.widgetDisabled(name)).should("have.length", 1);
  });

  it("setLoading puts the table into its loading state", () => {
    openEvents();
    wireTableCSA(
      tableText.csaSetLoading, // source: table.js:655 — displayName "Set loading"
      [
        {
          label: tableText.csaParamValue, // source: table.js:656 — param "Value"
          type: "toggle", // source: table.js:656 — type "toggle"
          value: true, // declared default `{{false}}` — source: table.js:656
        },
      ],
      name
    );
    triggerTableCSA(0, name);
    // loadingState swaps the body for <LoadingState/> (LoadingState.jsx:8).
    cy.get(tableSelector.loadingSpinner).should("be.visible");
  });

  it("setVisibility hides the table", () => {
    openEvents();
    wireTableCSA(
      tableText.csaSetVisibility, // source: table.js:660 — displayName "Set visibility"
      [
        {
          label: tableText.csaParamValue, // source: table.js:661 — param "Value"
          type: "toggle", // source: table.js:661 — type "toggle"
          // Explicit FALSE — setVisibility(false) is what hides the table, and it is
          // also the declared default (source: table.js:661).
          value: false,
        },
      ],
      name
    );
    triggerTableCSA(0, name);
    cy.get(tableSelector.widgetRoot(name)).first().should("not.be.visible");
  });
});
