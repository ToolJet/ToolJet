// Server-side pagination + search + sort + filter with the readable query in q1-readable.js.
import { tq, col, recorder, probe } from "./_obs";
import { addFilter } from "Support/utils/appBuilder/components/table";
const R = recorder("v15c-results.json");
let CODE;
const snap = (id) => cy.wait(1200).then(() => cy.document().then((doc) => R.push({
  id,
  names: [...doc.querySelectorAll('[data-cy^="table1-name-row-"]')].map((e) => e.innerText.trim()),
  footer: doc.querySelector('[data-cy="footer-number-of-records"]')?.innerText.trim(),
  nextDisabled: doc.querySelector('[data-cy="pagination-button-to-next"]')?.disabled,
  state: probe(doc, "dbg"),
})));
describe("V15c server-side with readable query", () => {
  before(() => cy.readFile("cypress/e2e/happyPath/appbuilder/tableQA/q1-readable.js").then((c) => (CODE = c)));
  afterEach(() => tq.cleanup());
  after(() => R.flush());
  it("search / sort / filter on the last page", () => {
    tq.app({
      queries: [{ name: "q1", runOnPageLoad: true, code: CODE }],
      data: "{{queries.q1.data?.rows ?? []}}",
      columns: [col("id", "number"), col("name")],
      probes: { dbg: "{{JSON.stringify({ pageIndex: components.table1.pageIndex, searchText: components.table1.searchText, sort: components.table1.sortApplied, filters: components.table1.filters, total: queries.q1.data?.total })}}" },
      props: { defaultSelectedRow: "{{undefined}}", serverSidePagination: "{{true}}", totalRecords: "{{queries.q1.data?.total ?? 0}}", rowsPerPage: "{{5}}",
        serverSideSort: "{{true}}", serverSideFilter: "{{true}}", loadingState: "{{queries.q1.isLoading}}" },
      events: [{ eventId: "onPageChanged", runQuery: "q1" }, { eventId: "onSearch", runQuery: "q1" }, { eventId: "onSort", runQuery: "q1" }, { eventId: "onFilterChanged", runQuery: "q1" }],
    });
    snap("1 load (page 1)");
    cy.get('[data-cy="table1-search-input-field"]').type("a", { force: true });
    snap("2 search 'a' from page 1");
    cy.get('[data-cy="table1-search-clear-icon"]').click({ force: true });
    snap("3 clear search");
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    snap("4 go to page 3 (last)");
    cy.get('[data-cy="table1-search-input-field"]').type("a", { force: true });
    snap("5 search 'a' while on page 3");
    cy.get('[data-cy="table1-search-clear-icon"]').click({ force: true });
    snap("6 clear search");
    cy.get('[data-cy="name-column-header"]').click({ force: true });
    snap("7 sort name (1 click)");
    cy.get('[data-cy="name-column-header"]').click({ force: true });
    snap("8 sort name (2 clicks)");
    addFilter([{ column: "name", operation: "contains", value: "e" }], true);
    snap("9 filter name contains 'e'");
    cy.get('[data-cy="table1-search-input-field"]').type("a", { force: true });
    snap("10 + search 'a' (filter + sort active)");
  });
});
