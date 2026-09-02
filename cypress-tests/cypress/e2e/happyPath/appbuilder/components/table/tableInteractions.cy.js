import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { tableText } from "Texts/appBuilder/components/table";
import { tableSelector } from "Selectors/appBuilder/components/table";
import {
  resizeTableWidget,
  toggleTableProperty,
  setRowsPerPage,
  selectTableRow,
  toggleRowCheckbox,
  verifySelectedRowCount,
  sortByColumn,
  searchOnTable,
  addFilter,
  verifyTableElements,
  verifySingleValueOnTable,
  verifyTableExposedVars,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";
import { addMultiEventsWithAlert } from "Support/utils/appBuilder/events";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// ---------------------------------------------------------------------------
// Chunk 3 — Table selection / pagination / sort / filter / search (NewTable).
// Priority-3 facet of the chunked Table suite. Covers the props allowSelection,
// showBulkSelector, enablePagination, enabledSort and the events onRowClicked,
// onPageChanged, onSort, onFilterChanged, onSearch.
//
// beforeEach mirrors the proven-green tableRegression.cy.js:37-58 harness
// (drag -> widen canvas -> close settings panel -> resize table -> open right
// inspector). Only ONE in-test drag (the Table itself), so this chunk is not
// exposed to the second-drag `cypress-real-dnd` flake.
//
// The Table renders `draggable-widget-<name>` on BOTH the outer RenderWidget
// wrapper (RenderWidget.jsx:308) AND its inner <table> (Table.jsx:340), so scope
// the outer box to :eq(0).
//
// Assertion strategy: exposed vars that are OBJECTS/ARRAYS (selectedRow,
// selectedRows, sortApplied, filters) render as JSON in the inspector's detail
// JSONViewer and do not resolve through `inspector-<key>-value` — the same
// limitation that deferred the changeSet assertion in tableEditing.cy.js. So the
// object-valued facets are asserted through the DOM (row `.selected` class,
// `:checked` checkboxes, `<col>-sort-icon-*`, filtered row contents) plus their
// event toast, and only the SCALAR exposed vars (searchText, pageIndex) are read
// EVENT WIRING: every addMultiEventsWithAlert call passes isWait=TRUE. With false,
// selectEvent skips `cy.wait("@events")` after creating the handler, so
// addSupportCSAData types the alert message before the handler's POST /events has
// resolved and the write is silently dropped — the handler keeps its DEFAULT message
// and the toast reads "Hello world!". Confirmed by probe: an onSort AND an
// onHeaderClick handler both toasted "Hello world!" instead of their configured text.
//
// back off the inspector — those DO resolve (verified: pageIndex reads back as `2`),
// with strings rendered JSON-quoted (`"Liam"`) and numbers bare.
// ---------------------------------------------------------------------------
const tableWidget = (name) =>
  `${commonWidgetSelector.draggableWidget(name)}:eq(0)`;

describe(
  "Table — selection, pagination, sort, filter & search",
  { testIsolation: false },
  () => {
    const name = tableText.defaultWidgetName;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-table-interactions-App`);
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

    // ---- selection ------------------------------------------------------

    it("selects a row on click and fires onRowClicked", () => {
      // allowSelection defaults to true (table.js:222-228); highlightSelectedRow
      // defaults to FALSE (table.js:238-245) and is what puts the `.selected`
      // class on the row (TableRow.jsx:46), so turn it on to get a DOM signal.
      toggleTableProperty(tableText.toggleHighlightSelectedRow);
      openEditorSidebar(name);
      openAccordion(commonWidgetText.accordionEvents);
      addMultiEventsWithAlert(
        [{ event: tableText.eventRowClicked, message: tableText.toastRowClicked }],
        true
      );
      cy.forceClickOnCanvas();
      // Row 1 (Liam Patel), not row 0 — defaultSelectedRow is `{id: 1}`
      // (table.js:256-265) so row 0 can already be selected on mount.
      selectTableRow(1);
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        tableText.toastRowClicked
      );
      cy.get(tableSelector.row(1)).should("have.class", "selected");
    });

    it("multi-selects individual rows while bulk selection is on", () => {
      // showBulkSelector defaults FALSE (table.js:230-237); turning it on renders
      // the per-row checkbox column AND the header select-all
      // (buildTableColumn.js:74-92), and keeps multi-row selection enabled.
      //
      // Selection is driven by clicking the ROW, not the checkbox: a checkbox click
      // fires both the input's own toggle handler and the row's handleRowClick, which
      // toggles a second time and cancels it out (see toggleRowCheckbox). The
      // checkboxes remain the ASSERTION surface — they reflect selection faithfully.
      toggleTableProperty(tableText.toggleBulkSelection);
      cy.forceClickOnCanvas();
      // Use rows 1 and 3, never row 0: defaultSelectedRow is `{id: 1}`
      // (initSlice.js:72) and selectRow('id', 1) runs on mount
      // (TableExposedVariables.jsx:268-273), so row 0 arrives ALREADY selected and a
      // click would toggle it off. Row 0's state is therefore left unasserted here.
      toggleRowCheckbox(1, name);
      toggleRowCheckbox(3, name);
      cy.get(tableSelector.rowCheckbox(1, name)).should("be.checked");
      cy.get(tableSelector.rowCheckbox(3, name)).should("be.checked");
      cy.get(tableSelector.rowCheckbox(2, name)).should("not.be.checked");
    });

    it("selects and clears every row from the header select-all checkbox", () => {
      toggleTableProperty(tableText.toggleBulkSelection);
      cy.forceClickOnCanvas();
      cy.get(tableSelector.selectAllRowsCheckbox)
        .should("exist")
        .click({ force: true });
      verifySelectedRowCount(tableText.defaultInput.length, name);
      cy.get(tableSelector.selectAllRowsCheckbox).click({ force: true });
      verifySelectedRowCount(0, name);
    });

    // ---- pagination -----------------------------------------------------

    it("pages forward and back and fires onPageChanged", () => {
      // rowsPerPage defaults to 10 and the demo dataset is exactly 10 rows
      // (table.js:65-73) -> one page, next/prev inert. Shrink it to 4 first.
      setRowsPerPage(4);
      openEditorSidebar(name);
      openAccordion(commonWidgetText.accordionEvents);
      addMultiEventsWithAlert(
        [
          {
            event: tableText.eventPageChanged,
            message: tableText.toastPageChanged,
          },
        ],
        true
      );
      cy.forceClickOnCanvas();
      verifyTableElements(tableText.defaultInput.slice(0, 4));
      cy.get(tableSelector.paginationButtonToNext).click({ force: true });
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        tableText.toastPageChanged
      );
      verifyTableElements(tableText.defaultInput.slice(4, 8));
      cy.get(tableSelector.paginationButtonToPrevious).click({ force: true });
      verifyTableElements(tableText.defaultInput.slice(0, 4));
    });

    // ---- sort -----------------------------------------------------------

    it("sorts a column ascending then descending and fires onSort", () => {
      // enabledSort defaults true (table.js:82-89). The sort arrow only renders
      // once the column IS sorted (TableHeader.jsx:165-179), so its presence is
      // the proof that the click applied a sort.
      openAccordion(commonWidgetText.accordionEvents);
      addMultiEventsWithAlert(
        [
          {
            event: tableText.eventSortApplied,
            message: tableText.toastSortApplied,
          },
        ],
        true
      );
      cy.forceClickOnCanvas();
      // Assert the SORT ITSELF first. A runtime probe confirmed a header click does
      // apply the sort (asc icon present, first row "Alexander Vela"), so ordering the
      // DOM assertions ahead of the toast keeps real sort coverage independent of the
      // event assertion.
      sortByColumn(tableText.name);
      cy.get(tableSelector.sortIconAscending(tableText.name)).should("exist");
      verifySingleValueOnTable(tableText.name, 0, "Alexander Vela");
      // onSort fires unconditionally whenever sorting.length > 0
      // (TableExposedVariables.jsx:164-174), so the sort above guarantees the event.
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        tableText.toastSortApplied
      );
      sortByColumn(tableText.name);
      cy.get(tableSelector.sortIconDescending(tableText.name)).should("exist");
      verifySingleValueOnTable(tableText.name, 0, "William Sanchez");
    });

    // ---- filter ---------------------------------------------------------

    it("filters rows and fires onFilterChanged", () => {
      openAccordion(commonWidgetText.accordionEvents);
      addMultiEventsWithAlert(
        [
          {
            event: tableText.eventFilterChanged,
            message: tableText.toastFilterChanged,
          },
        ],
        true
      );
      cy.forceClickOnCanvas();
      // "Reyes" matches Sophia Reyes (id 3) and Michael Reyes (id 10).
      // freshFilter=true is REQUIRED: addFilter only clicks "+ add filter" (creating
      // filter row 0) on that path. Without it `select-column-dropdown-0` never
      // exists. Matches the proven usage in tableRegression.cy.js:168-206.
      addFilter(
        [{ column: tableText.name, operation: "contains", value: "Reyes" }],
        true
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

    // ---- global search --------------------------------------------------

    it("filters via the global search box and fires onSearch", () => {
      openAccordion(commonWidgetText.accordionEvents);
      addMultiEventsWithAlert(
        [{ event: tableText.eventSearch, message: tableText.toastSearch }],
        true
      );
      cy.forceClickOnCanvas();
      searchOnTable("Liam", name);
      cy.verifyToastMessage(commonSelectors.toastMessage, tableText.toastSearch);
      verifyTableElements([tableText.defaultInput[1]]);
    });

    // ---- scalar exposed vars --------------------------------------------

    it("exposes searchText and pageIndex on the inspector", () => {
      setRowsPerPage(4);
      cy.forceClickOnCanvas();
      cy.get(tableSelector.paginationButtonToNext).click({ force: true });
      verifyTableExposedVars(
        [{ key: "pageIndex", type: "Number", value: "2" }],
        name
      );
      cy.forceClickOnCanvas();
      searchOnTable("Liam", name);
      // The inspector detail panel renders string values JSON-quoted (`"Liam"`),
      // while numbers render bare — confirmed by this run: the pageIndex assertion
      // above passed and only searchText mismatched ('"Liam"' vs 'Liam').
      verifyTableExposedVars(
        [{ key: "searchText", type: "String", value: '"Liam"' }],
        name
      );
    });
  }
);
