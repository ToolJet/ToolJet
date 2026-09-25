// A6: Table events (frontend/src/AppBuilder/WidgetManager/widgets/table.js:356-370
// `events: {...}` registry). Wire every event to "Show Alert" with a distinct message,
// fire it via the real user interaction, and assert the toast appears EXACTLY ONCE
// with the right message. One shared app is built in `before()` (not per-`it`) because
// wiring 12 event handlers through the real Inspector UI is expensive; cleanup runs
// once in `after()` instead of `afterEach()` — this still leaves no app behind.
import { tq, col } from "./_harness";
import { tableSelector } from "Selectors/appBuilder/components/table";
import { commonSelectors } from "Selectors/common";
import { tableText } from "Texts/appBuilder/components/table";
import {
  addMultiEventsWithAlert,
  addEventWithAlert,
} from "Support/utils/appBuilder/events";
import { editTableCell, addNewRow, addFilter, sortByColumn } from "Support/utils/appBuilder/components/table";

const openEventsPanel = (name = "table1") => {
  cy.get(`[data-cy="draggable-widget-${name}"]`).eq(0).realHover();
  cy.get(`[data-cy="${name}-properties-styles-button"]`).click();
  cy.get("body").then(($body) => {
    if ($body.find('[data-cy="add-event-handler"]').length === 0) {
      cy.get('[data-cy="widget-accordion-events"]').click({ force: true });
    }
  });
};

// Count toasts whose text contains `message` — the assertion for "fires exactly once".
const assertToastFiresOnce = (message) => {
  cy.get(commonSelectors.toastMessage, { timeout: 15000 })
    .filter((_i, el) => el.innerText.includes(message))
    .should("have.length", 1);
};

const closeAllToasts = () => {
  cy.get("body").then(($body) => {
    const n = $body.find(commonSelectors.toastCloseButton).length;
    Cypress._.times(n, () => cy.closeToastMessage());
  });
  cy.wait(300);
};

describe("A6 events — fire exactly once with correct trigger", () => {
  const data = [
    { id: 1, name: "Sarah", email: "sarah@example.com", qty: 5 },
    { id: 2, name: "Lisa", email: "lisa@example.com", qty: 6 },
    { id: 3, name: "Sam", email: "sam@example.com", qty: 7 },
    { id: 4, name: "Jon", email: "jon@example.com", qty: 8 },
    { id: 5, name: "Amy", email: "amy@example.com", qty: 9 },
    { id: 6, name: "Max", email: "max@example.com", qty: 10 },
  ];
  const columns = [
    col("id"),
    col("name", "string", { isEditable: true }),
    col("email", "string", { isEditable: true }),
    col("qty", "number", { isEditable: true }),
  ];

  before(() => {
    tq.app({
      data,
      columns,
      props: {
        displaySearchBox: "{{true}}",
        showFilterButton: "{{true}}",
        enabledSort: "{{true}}",
        showBulkUpdateActions: "{{true}}",
        showAddNewRowButton: "{{true}}",
        showRefreshButton: "{{true}}",
        rowsPerPage: "{{3}}",
        enablePagination: "{{true}}",
      },
    });
    openEventsPanel();
    addMultiEventsWithAlert([
      { event: tableText.eventSearch, message: "search fired once" },
      { event: tableText.eventSortApplied, message: "sort fired once" },
      { event: "Header clicked", message: "header click fired once" },
      { event: tableText.eventRowClicked, message: "row clicked fired once" },
      { event: tableText.eventRowHovered, message: "row hovered fired once" },
      { event: tableText.eventCellValueChanged, message: "cell value changed once" },
      { event: tableText.eventSaveChanges, message: "bulk update fired once" },
      { event: tableText.eventCancelChanges, message: "cancel changes fired once" },
      { event: tableText.eventFilterChanged, message: "filter changed fired once" },
      { event: tableText.eventPageChanged, message: "page changed fired once" },
      { event: tableText.eventAddNewRows, message: "new rows added once" },
      { event: "Refresh", message: "refresh fired once" },
    ]);
    cy.get("body").type("{esc}");
    cy.forceClickOnCanvas();
  });

  after(() => tq.cleanup());

  it("onSearch fires exactly once per keystroke-settle", () => {
    cy.get(tableSelector.searchInputField()).type("Sarah");
    assertToastFiresOnce("search fired once");
    closeAllToasts();
    cy.get(tableSelector.searchClearIcon()).click({ force: true });
  });

  it("onSort AND onHeaderClick both fire exactly once from the same header click", () => {
    sortByColumn("qty");
    assertToastFiresOnce("sort fired once");
    assertToastFiresOnce("header click fired once");
    closeAllToasts();
  });

  it("onRowClicked fires exactly once per row click", () => {
    tq.cell(0, "name").click({ force: true });
    assertToastFiresOnce("row clicked fired once");
    closeAllToasts();
  });

  it("onRowHovered fires exactly once per hover", () => {
    cy.get(tableSelector.row(1)).trigger("mouseover", { force: true });
    assertToastFiresOnce("row hovered fired once");
    closeAllToasts();
  });

  it("onCellValueChanged fires exactly once when an editable cell is committed", () => {
    editTableCell("qty", 1, "999");
    assertToastFiresOnce("cell value changed once");
    closeAllToasts();
  });

  it("onBulkUpdate (Save changes) fires exactly once", () => {
    editTableCell("qty", 2, "111");
    cy.get(tableSelector.saveChangesButton).click({ force: true });
    assertToastFiresOnce("bulk update fired once");
    closeAllToasts();
  });

  it("onCancelChanges (Discard) fires exactly once", () => {
    editTableCell("qty", 0, "222");
    cy.get(tableSelector.discardChangesButton).click({ force: true });
    assertToastFiresOnce("cancel changes fired once");
    closeAllToasts();
  });

  it("onFilterChanged fires exactly once when a filter is applied", () => {
    addFilter([{ column: "name", operation: "contains", value: "Sarah" }], true);
    assertToastFiresOnce("filter changed fired once");
    closeAllToasts();
    // clean the filter state for subsequent tests (pagination assumes all 6 rows)
    cy.get(tableSelector.filterButton()).scrollIntoView().click({ force: true });
    cy.get(tableSelector.buttonClearFilter).click({ force: true });
    cy.get(tableSelector.buttonCloseFilters).click({ force: true });
    cy.wait(500);
  });

  it("onPageChanged fires exactly once per pagination click", () => {
    cy.get(tableSelector.paginationButtonToNext).click({ force: true });
    assertToastFiresOnce("page changed fired once");
    closeAllToasts();
  });

  it("onNewRowsAdded fires exactly once when a new row is saved", () => {
    addNewRow();
    cy.get(tableSelector.addNewRowSaveButton).click({ force: true });
    assertToastFiresOnce("new rows added once");
    closeAllToasts();
  });

  it("onRefresh fires exactly once", () => {
    cy.get(`[data-cy="table1-refresh-button"]`).click({ force: true });
    assertToastFiresOnce("refresh fired once");
    closeAllToasts();
  });
});

describe("A6 events — onTableDataDownload ('Download data')", () => {
  afterEach(() => tq.cleanup());

  it("BUG CHECK: wiring 'Download data' silently replaces the CSV/Excel/PDF popup — no file is produced", () => {
    // Source: ControlButtons.jsx renderDownloadButton() — when a handler is wired to
    // this event AND clientSidePagination resolves false (its default, since
    // properties.clientSidePagination/serverSidePagination are both unset), clicking
    // the download button calls fireEvent('onTableDataDownload') directly and RETURNS,
    // instead of opening the CSV/Excel/PDF popover. exportToCSV/Excel/PDF are only
    // ever invoked from inside that popover, so no automatic download happens once
    // this event is wired — even though "Download data" reads like an additional hook
    // alongside the normal button behaviour, not a replacement for it.
    tq.app({
      data: [{ id: 1, name: "Sarah" }],
      columns: [col("id"), col("name")],
      props: { showDownloadButton: "{{true}}" },
    });
    openEventsPanel();
    addEventWithAlert("Download data", "download event fired");
    cy.get("body").type("{esc}");
    cy.forceClickOnCanvas();

    cy.exec("rm -rf cypress/downloads && mkdir -p cypress/downloads", { failOnNonZeroExit: false });
    cy.get(tableSelector.buttonDownloadDropdown()).scrollIntoView().click({ force: true });
    assertToastFiresOnce("download event fired");
    cy.get('[data-cy="option-download-as-csv"]').should(
      "not.exist",
      "the format-choice popover should not appear once a 'Download data' handler is wired (documented as an EXTRA hook, not a replacement)"
    );
    cy.exec("ls cypress/downloads", { failOnNonZeroExit: false }).then((r) => {
      expect(r.stdout.trim(), "no file was downloaded because exportToCSV/Excel/PDF is never called on this path").to.eq("");
    });
  });
});
