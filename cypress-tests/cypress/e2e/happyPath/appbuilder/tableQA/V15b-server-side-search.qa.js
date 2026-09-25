// Server-side pagination + sort + filter driven by a real query wired to the table events.
import { tq, col, recorder, probe } from "./_obs";
import { addFilter } from "Support/utils/appBuilder/components/table";

const R = recorder("v15b-results.json");
const CODE = `
const size = 5;
const p = components.table1.pageIndex || 1;
let rows = Array.from({ length: 23 }, (_, i) => ({ id: i + 1, name: 'N' + String(i + 1).padStart(2, '0') }));
const s = (components.table1.sortApplied || [])[0];
if (s && s.column) rows = [...rows].sort((a, b) => (a[s.column] > b[s.column] ? 1 : -1) * (s.direction === 'desc' ? -1 : 1));
const q = (components.table1.searchText || '').trim().toLowerCase();
if (q) rows = rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
const f = (components.table1.filters || [])[0];
if (f && f.value) rows = rows.filter((r) => String(r[f.column]).includes(f.value));
return { rows: rows.slice((p - 1) * size, p * size), total: rows.length, page: p, search: q || null, sort: s || null, filter: f || null };`;
const snap = (id) => cy.wait(1200).then(() => cy.document().then((doc) => R.push({
  id,
  ids: [...doc.querySelectorAll('[data-cy^="table1-id-row-"]')].map((e) => e.innerText.trim()),
  footer: doc.querySelector('[data-cy="footer-number-of-records"]')?.innerText.trim(),
  pagination: doc.querySelector('[data-cy="pagination-section"]')?.innerText.replace(/\s+/g, " ").trim(),
  nextDisabled: doc.querySelector('[data-cy="pagination-button-to-next"]')?.disabled,
  prevDisabled: doc.querySelector('[data-cy="pagination-button-to-previous"]')?.disabled,
  q: probe(doc, "q"),
})));

describe("V15b server-side with search", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("pages, sorts and filters through the query", () => {
    tq.app({
      queries: [{ name: "q1", runOnPageLoad: true, code: CODE }],
      data: "{{queries.q1.data?.rows ?? []}}",
      columns: [col("id", "number"), col("name")],
      probes: { q: "{{JSON.stringify({page: queries.q1.data?.page, total: queries.q1.data?.total, search: queries.q1.data?.search, sort: queries.q1.data?.sort, filter: queries.q1.data?.filter, pageIndex: components.table1.pageIndex, searchText: components.table1.searchText})}}" },
      props: {
        defaultSelectedRow: "{{undefined}}", serverSidePagination: "{{true}}", totalRecords: "{{queries.q1.data?.total ?? 0}}",
        rowsPerPage: "{{5}}", serverSideSort: "{{true}}", serverSideFilter: "{{true}}", loadingState: "{{queries.q1.isLoading}}",
      },
      events: [{ eventId: "onPageChanged", runQuery: "q1" }, { eventId: "onSort", runQuery: "q1" }, { eventId: "onFilterChanged", runQuery: "q1" }, { eventId: "onSearch", runQuery: "q1" }],
    });
    snap("s1: initial page 1");
    cy.get('[data-cy="table1-search-input-field"]').type("2", { force: true });
    snap("s2: search '2' from page 1");
    cy.get('[data-cy="table1-search-clear-icon"]').click({ force: true });
    snap("s3: clear search");
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    snap("s4: page 5");
    cy.get('[data-cy="table1-search-input-field"]').type("1", { force: true });
    snap("s5: search '1' while on page 5");
    cy.get('[data-cy="table1-search-input-field"]').type("5", { force: true });
    snap("s6: search '15' while on page 5");
    cy.get('[data-cy="table1-search-clear-icon"]').click({ force: true });
    snap("s7: clear search (still page 5?)");
    cy.get('[data-cy="name-column-header"]').click({ force: true });
    cy.get('[data-cy="name-column-header"]').click({ force: true });
    snap("s8: sort name desc on page 5");
    addFilter([{ column: "name", operation: "contains", value: "1" }], true);
    snap("s9: filter name contains 1");
    cy.get('[data-cy="table1-search-input-field"]').type("N1", { force: true });
    snap("s10: + search 'N1' with filter and sort");
  });
});
