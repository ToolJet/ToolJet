// Server-side pagination + sort + filter driven by a real query wired to the table events.
import { tq, col, recorder, probe } from "./_obs";
import { addFilter } from "Support/utils/appBuilder/components/table";

const R = recorder("v15-results.json");
const CODE = `
const size = 5;
const p = components.table1.pageIndex || 1;
let rows = Array.from({ length: 23 }, (_, i) => ({ id: i + 1, name: 'N' + String(i + 1).padStart(2, '0') }));
const s = (components.table1.sortApplied || [])[0];
if (s && s.column) rows = [...rows].sort((a, b) => (a[s.column] > b[s.column] ? 1 : -1) * (s.direction === 'desc' ? -1 : 1));
const f = (components.table1.filters || [])[0];
if (f && f.value) rows = rows.filter((r) => String(r[f.column]).includes(f.value));
return { rows: rows.slice((p - 1) * size, p * size), total: rows.length, page: p, sort: s || null, filter: f || null };`;
const snap = (id) => cy.wait(1200).then(() => cy.document().then((doc) => R.push({
  id,
  ids: [...doc.querySelectorAll('[data-cy^="table1-id-row-"]')].map((e) => e.innerText.trim()),
  footer: doc.querySelector('[data-cy="footer-number-of-records"]')?.innerText.trim(),
  pagination: doc.querySelector('[data-cy="pagination-section"]')?.innerText.replace(/\s+/g, " ").trim(),
  nextDisabled: doc.querySelector('[data-cy="pagination-button-to-next"]')?.disabled,
  prevDisabled: doc.querySelector('[data-cy="pagination-button-to-previous"]')?.disabled,
  q: probe(doc, "q"),
})));

describe("V15 server-side pagination / sort / filter", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("pages, sorts and filters through the query", () => {
    tq.app({
      queries: [{ name: "q1", runOnPageLoad: true, code: CODE }],
      data: "{{queries.q1.data?.rows ?? []}}",
      columns: [col("id", "number"), col("name")],
      probes: { q: "{{JSON.stringify({page: queries.q1.data?.page, total: queries.q1.data?.total, sort: queries.q1.data?.sort, filter: queries.q1.data?.filter})}}" },
      props: {
        defaultSelectedRow: "{{undefined}}", serverSidePagination: "{{true}}", totalRecords: "{{queries.q1.data?.total ?? 0}}",
        rowsPerPage: "{{5}}", serverSideSort: "{{true}}", serverSideFilter: "{{true}}", loadingState: "{{queries.q1.isLoading}}",
      },
      events: [{ eventId: "onPageChanged", runQuery: "q1" }, { eventId: "onSort", runQuery: "q1" }, { eventId: "onFilterChanged", runQuery: "q1" }],
    });
    snap("ss:initial page 1");
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    snap("ss:after next (page 2)");
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    snap("ss:page 5 (last, 21–23)");
    cy.get('[data-cy="name-column-header"]').click({ force: true });
    snap("ss:after sort name (1 click)");
    cy.get('[data-cy="name-column-header"]').click({ force: true });
    snap("ss:after sort name (2 clicks)");
    addFilter([{ column: "name", operation: "contains", value: "1" }], true);
    snap("ss:after filter name contains 1");
  });
});
