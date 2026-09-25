// Every Table event: fires? how many times? exposed values at fire time? Observe-only -> logs/v10-results.json
import { tq, col, recorder } from "./_obs";

const R = recorder("v10-results.json");
const toasts = (doc, prefix) => [...doc.querySelectorAll('[role="status"]')].map((e) => e.innerText.trim()).filter((t) => t.startsWith(prefix));
const count = (id, prefix, extra = {}) => cy.wait(900).then(() => cy.document().then((doc) => R.push({ id, fired: toasts(doc, prefix).length, messages: toasts(doc, prefix).slice(0, 4), ...extra })));
const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `N${i + 1}` }));
const cols = (editable = false) => [col("id", "number"), col("name", "string", { isEditable: editable })];
const build = (events, props = {}, n = 3, editable = false) =>
  tq.app({ data: rows(n), columns: cols(editable), events, props: { defaultSelectedRow: "{{undefined}}", ...props } });

describe("V10 table events", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("onRowClicked (message reads selectedRow at fire time)", () => {
    build([{ eventId: "onRowClicked", message: "ROWCLICK:{{components.table1.selectedRow?.name}}" }]);
    tq.cell(1, "name").click({ force: true });
    count("onRowClicked: click row 2", "ROWCLICK");
  });

  it("onRowHovered", () => {
    build([{ eventId: "onRowHovered", message: "HOVER:{{components.table1.hoveredRow?.name}}" }]);
    tq.cell(0, "name").trigger("mouseover", { force: true });
    tq.cell(1, "name").trigger("mouseover", { force: true });
    count("onRowHovered: hover rows 1 then 2", "HOVER");
  });

  it("onCellValueChanged (message reads changeSet at fire time)", () => {
    build([{ eventId: "onCellValueChanged", message: "CELL:{{JSON.stringify(components.table1.changeSet)}}" }], {}, 3, true);
    tq.cell(0, "name").find(".long-text-input").click({ force: true });
    tq.cell(0, "name").find('[contenteditable="true"]').type("{selectall}{backspace}Zed", { force: true });
    tq.cell(0, "id").click({ force: true });
    count("onCellValueChanged: one edit", "CELL");
  });

  it("onPageChanged (message reads pageIndex)", () => {
    build([{ eventId: "onPageChanged", message: "PAGE:{{components.table1.pageIndex}}" }], { rowsPerPage: "{{2}}" }, 6);
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    count("onPageChanged: next once", "PAGE");
  });

  it("onSearch (message reads searchText)", () => {
    build([{ eventId: "onSearch", message: "SEARCH:{{components.table1.searchText}}" }]);
    cy.get('[data-cy="table1-search-input-field"]').type("N2", { force: true });
    count("onSearch: typed 'N2' (2 keystrokes)", "SEARCH");
  });

  it("onSort + onHeaderClick", () => {
    build([{ eventId: "onSort", message: "SORT:{{JSON.stringify(components.table1.sortApplied)}}" }, { eventId: "onHeaderClick", message: "HEADER:" }]);
    cy.get('[data-cy="name-column-header"]').click({ force: true });
    count("onSort: one header click", "SORT");
    count("onHeaderClick: one header click", "HEADER");
  });

  it("onFilterChanged", () => {
    build([{ eventId: "onFilterChanged", message: "FILTER:{{JSON.stringify(components.table1.filters)}}" }]);
    cy.get('[data-cy="table1-filter-button"]').click({ force: true });
    cy.wait(400);
    cy.get("body").then(($b) => {
      const add = $b.find('[data-cy*="add-filter"], button:contains("Add filter")').first();
      if (add.length) cy.wrap(add).click({ force: true });
    });
    cy.wait(400);
    count("onFilterChanged: open filter + add filter row", "FILTER");
  });

  it("onNewRowsAdded", () => {
    build([{ eventId: "onNewRowsAdded", message: "NEWROWS:{{JSON.stringify(components.table1.newRows)}}" }], { showAddNewRowButton: "{{true}}" }, 3, true);
    cy.get('[data-cy="table1-add-new-row-button"]').click({ force: true });
    cy.get('.table-add-new-row td[data-cy="name-column-0"]').find('[contenteditable="true"], .long-text-input').first().click({ force: true }).type("New", { force: true });
    cy.get('[data-cy="save-button"]').click({ force: true });
    count("onNewRowsAdded: save one new row", "NEWROWS");
  });

  it("onBulkUpdate + onCancelChanges", () => {
    build([{ eventId: "onBulkUpdate", message: "BULK:{{JSON.stringify(components.table1.changeSet)}}" }, { eventId: "onCancelChanges", message: "CANCEL:" }], {}, 3, true);
    const edit = (t) => {
      tq.cell(0, "name").find(".long-text-input").click({ force: true });
      tq.cell(0, "name").find('[contenteditable="true"]').type(`{selectall}{backspace}${t}`, { force: true });
      tq.cell(0, "id").click({ force: true });
    };
    edit("A1");
    cy.get('[data-cy="table-button-save-changes"]').click({ force: true });
    count("onBulkUpdate: Save changes", "BULK");
    edit("B2");
    cy.get('[data-cy="table-button-discard-changes"]').click({ force: true });
    count("onCancelChanges: Discard changes", "CANCEL");
  });

  it("onTableDataDownload", () => {
    build([{ eventId: "onTableDataDownload", message: "DOWNLOAD:" }]);
    cy.get('[data-cy="table1-file-download-button"]').click({ force: true });
    cy.wait(300);
    cy.get("body").then(($b) => { const o = $b.find('[data-cy*="download-as-csv"], :contains("Download as CSV")').filter("div,button,span").last(); if (o.length) cy.wrap(o).click({ force: true }); });
    count("onTableDataDownload: CSV", "DOWNLOAD");
  });

  it("onRefresh", () => {
    build([{ eventId: "onRefresh", message: "REFRESH:" }], { showRefreshButton: "{{true}}" });
    cy.get('[data-cy="table1-refresh-button"]').click({ force: true });
    count("onRefresh: refresh button", "REFRESH");
  });

  it("onExpand (message reads lastExpandedRow)", () => {
    build([{ eventId: "onExpand", message: "EXPAND:{{components.table1.lastExpandedRow?.name}}" }], { enableExpandableRows: "{{true}}" });
    cy.document().then((doc) => R.push({ id: "expand:toggles", toggles: [...doc.querySelectorAll('td[data-cy*="expand"], [data-cy*="expand"]')].map((e) => e.getAttribute("data-cy")).slice(0, 4) }));
    cy.get('[data-cy*="expand"]').first().click({ force: true });
    count("onExpand: expand row 1", "EXPAND");
  });

  it("no double-fire: row click fires only onRowClicked, not onCellValueChanged etc.", () => {
    build([{ eventId: "onRowClicked", message: "ROWCLICK:" }, { eventId: "onCellValueChanged", message: "CELL:" }, { eventId: "onSort", message: "SORT:" }], {}, 3, true);
    tq.cell(1, "id").click({ force: true });
    count("isolation: row click -> ROWCLICK", "ROWCLICK");
    count("isolation: row click -> CELL (expect 0)", "CELL");
    count("isolation: row click -> SORT (expect 0)", "SORT");
  });
});
