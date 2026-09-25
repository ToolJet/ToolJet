import { tq, col } from "./_harness";

// Under heavy shared-environment load (many agents' tqrun.sh queued back to back),
// cy.wait('@getAppData') inside the shared openApp command can exceed the default
// 10s requestTimeout even though the request eventually fires. Bump it spec-locally
// (no shared file edited) rather than editing _harness.js.
before(() => {
  Cypress.config("requestTimeout", 45000);
  Cypress.config("responseTimeout", 45000);
});

// A5: Pagination matrix.
// Data (rows), rowsPerPage, enablePagination, serverSidePagination crossed with
// page-count / edge-button / footer-text / go-to-page assertions.

const genRows = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));

const PREV = '[data-cy="pagination-button-to-previous"]';
const NEXT = '[data-cy="pagination-button-to-next"]';
const TO_LAST = '[data-cy="pagination-button-to-last"]';
const RECORDS = '[data-cy="footer-number-of-records"]';

// Walk every page via the "next" button, collecting the `id` column values seen,
// asserting prev/next disabled states at the edges. Returns the set of ids seen
// (via the callback) so the caller can assert data integrity across pagination.
function walkAllPages({ maxPages = 40 } = {}) {
  const seen = [];
  cy.get(PREV).should("be.disabled"); // page 1: prev always disabled
  const step = (n) => {
    cy.get("tbody tr").then(($rows) => {
      $rows.each((_, tr) => {
        const idCell = tr.querySelector('td[data-cy$="-id-row-' + tr.getAttribute("data-index") + '"]');
        if (idCell) seen.push(idCell.textContent.trim());
      });
    });
    cy.get(NEXT).then(($btn) => {
      if ($btn.is(":disabled") || n >= maxPages) {
        return;
      }
      cy.wrap($btn).click({ force: true });
      cy.wait(250);
      step(n + 1);
    });
  };
  step(0);
  cy.get(NEXT).should("be.disabled"); // last page: next disabled
  return cy.wrap(seen);
}

describe("A5 pagination: rowsPerPage x row-count matrix", () => {
  afterEach(() => tq.cleanup());

  const cases = [
    { name: "rowsPerPage=1, 5 rows", rows: 5, rpp: 1, expectFirstPage: 1 },
    { name: "rowsPerPage=5, 5 rows (exact multiple, single page)", rows: 5, rpp: 5, expectFirstPage: 5 },
    { name: "rowsPerPage=5, 10 rows (exact multiple, 2 pages)", rows: 10, rpp: 5, expectFirstPage: 5 },
    { name: "rowsPerPage=5, 11 rows (+1, 3 pages)", rows: 11, rpp: 5, expectFirstPage: 5 },
    { name: "rowsPerPage=10, 1 row", rows: 1, rpp: 10, expectFirstPage: 1 },
    { name: "rowsPerPage=10, 0 rows (empty state)", rows: 0, rpp: 10, expectFirstPage: 0 },
    { name: "rowsPerPage=1000 (> rows), 10 rows", rows: 10, rpp: 1000, expectFirstPage: 10 },
  ];

  cases.forEach((c) => {
    it(`${c.name} -> first page shows ${c.expectFirstPage} row(s), footer shows "${c.rows} Records", all rows reachable`, () => {
      tq.app({
        data: genRows(c.rows),
        columns: [col("id", "number")],
        props: { rowsPerPage: c.rpp, enablePagination: true },
      });
      tq.rows().should("have.length", c.expectFirstPage);
      cy.get(RECORDS).should("contain.text", `${c.rows} Records`);
      if (c.rows === 0) return; // no pagination walk to do
      walkAllPages().then((seen) => {
        const uniq = new Set(seen);
        expect(uniq.size, "unique ids seen across all pages").to.eq(c.rows);
      });
    });
  });

  it("rowsPerPage=0 on 10 rows: table should not silently blank", () => {
    tq.app({
      data: genRows(10),
      columns: [col("id", "number")],
      props: { rowsPerPage: 0, enablePagination: true },
    });
    tq.rows().its("length").then((n) => {
      cy.log(`rows rendered with rowsPerPage=0: ${n}`);
      // Expectation: the user configured an invalid rows-per-page (0). A sane
      // fallback is to show at least something (e.g. treat as "all rows" or fall
      // back to the default 10) rather than an empty table with data present.
      expect(n, "row count with rowsPerPage=0 (data is non-empty)").to.be.greaterThan(0);
    });
  });

  it("rowsPerPage=-5 (negative) on 10 rows: table should not silently blank", () => {
    tq.app({
      data: genRows(10),
      columns: [col("id", "number")],
      props: { rowsPerPage: -5, enablePagination: true },
    });
    tq.rows().its("length").then((n) => {
      cy.log(`rows rendered with rowsPerPage=-5: ${n}`);
      expect(n, "row count with rowsPerPage=-5 (data is non-empty)").to.be.greaterThan(0);
    });
  });

  it('rowsPerPage="abc" (non-number) on 10 rows: table should not silently blank', () => {
    tq.app({
      data: genRows(10),
      columns: [col("id", "number")],
      props: { rowsPerPage: "{{'abc'}}", enablePagination: true },
    });
    tq.rows().its("length").then((n) => {
      cy.log(`rows rendered with rowsPerPage="abc": ${n}`);
      expect(n, 'row count with rowsPerPage="abc" (data is non-empty)').to.be.greaterThan(0);
    });
  });

  it("250 rows, rowsPerPage=10: 25 pages, last page has the remainder, jump-to-last works", () => {
    tq.app({
      data: genRows(250),
      columns: [col("id", "number")],
      props: { rowsPerPage: 10, enablePagination: true },
    });
    tq.rows().should("have.length", 10);
    cy.get(RECORDS).should("contain.text", "250 Records");
    cy.get(TO_LAST).click({ force: true });
    tq.rows().should("have.length", 10); // 250 / 10 exact multiple -> last page also full
    cy.get(NEXT).should("be.disabled");
  });

  it("251 rows, rowsPerPage=10: last page has exactly 1 (remainder) row", () => {
    tq.app({
      data: genRows(251),
      columns: [col("id", "number")],
      props: { rowsPerPage: 10, enablePagination: true },
    });
    cy.get(TO_LAST).click({ force: true });
    tq.rows().should("have.length", 1);
    cy.get(NEXT).should("be.disabled");
  });
});

describe("A5 pagination: enablePagination off", () => {
  afterEach(() => tq.cleanup());

  it("enablePagination=false: all rows render in one shot, no pagination section", () => {
    tq.app({
      data: genRows(15),
      columns: [col("id", "number")],
      props: { rowsPerPage: 5, enablePagination: false },
    });
    tq.rows().should("have.length", 15);
    cy.get('[data-cy="pagination-section"]').should("not.exist");
  });

  it("enablePagination=false: footer record count should still be shown to the user", () => {
    tq.app({
      data: genRows(15),
      columns: [col("id", "number")],
      props: { rowsPerPage: 5, enablePagination: false },
    });
    cy.get(RECORDS).should("be.visible").and("contain.text", "15");
  });
});

describe("A5 pagination: go-to-page via numbered buttons", () => {
  afterEach(() => tq.cleanup());

  it("clicking page number '3' of 3 navigates directly and marks it selected", () => {
    tq.app({
      data: genRows(11),
      columns: [col("id", "number")],
      props: { rowsPerPage: 5, enablePagination: true },
      probes: { pi: "{{components.table1.pageIndex}}" },
    });
    cy.get('[data-cy="pagination-section"]')
      .contains("button", "3")
      .click({ force: true });
    tq.probe("pi").should("contain.text", "3");
    tq.rows().should("have.length", 1); // 11 rows, page 3 has the remainder
  });
});

describe("A5 pagination: setPage CSA edge inputs (0, beyond last, non-numeric)", () => {
  afterEach(() => tq.cleanup());

  it("setPage(0): pageIndex should not be forced below 1", () => {
    tq.app({
      data: genRows(11),
      columns: [col("id", "number")],
      props: { rowsPerPage: 5, enablePagination: true },
      probes: { pi: "{{[components.table1.setPage(0), components.table1.pageIndex][1]}}" },
    });
    cy.wait(400);
    tq.probe("pi").then(($el) => {
      const val = $el.text().trim();
      cy.log(`pageIndex after setPage(0): "${val}"`);
      expect(Number(val), "pageIndex after setPage(0) should clamp to the first valid page (1)").to.eq(1);
    });
  });

  it("setPage(999) (beyond last page of 3): should clamp to the last real page, not go blank", () => {
    tq.app({
      data: genRows(11),
      columns: [col("id", "number")],
      props: { rowsPerPage: 5, enablePagination: true },
      probes: { pi: "{{[components.table1.setPage(999), components.table1.pageIndex][1]}}" },
    });
    cy.wait(400);
    tq.probe("pi").then(($el) => {
      const val = $el.text().trim();
      cy.log(`pageIndex after setPage(999) on a 3-page table: "${val}"`);
      expect(Number(val), "pageIndex after setPage(999) should clamp to the last real page (3)").to.eq(3);
    });
    tq.rows().its("length").then((n) => {
      expect(n, "rows rendered after setPage(999) (should show the last real page's rows, not blank)").to.be.greaterThan(0);
    });
  });

  it('setPage("abc") (non-numeric): should be a no-op, not corrupt pagination', () => {
    tq.app({
      data: genRows(11),
      columns: [col("id", "number")],
      props: { rowsPerPage: 5, enablePagination: true },
      probes: { pi: "{{[components.table1.setPage('abc'), components.table1.pageIndex][1]}}" },
    });
    cy.wait(400);
    tq.probe("pi").then(($el) => {
      const val = $el.text().trim();
      cy.log(`pageIndex after setPage("abc"): "${val}"`);
      expect(Number(val), 'pageIndex after setPage("abc") should stay a valid page number').to.be.within(1, 3);
    });
    tq.rows().its("length").then((n) => {
      expect(n, 'rows rendered after setPage("abc") (should not go blank)').to.be.greaterThan(0);
    });
  });
});

describe("A5 pagination: page reset when data changes (client-side search)", () => {
  afterEach(() => tq.cleanup());

  it("on page 3 of a 4-page table, searching down to 2 matches should reset to page 1", () => {
    // 20 rows, rowsPerPage 5 -> 4 pages. Only 2 rows have note:'findme'.
    const rows = genRows(20).map((r, i) => ({ ...r, note: i === 0 || i === 15 ? "findme" : "other" }));
    tq.app({
      data: rows,
      columns: [col("id", "number"), col("note")],
      props: { rowsPerPage: 5, enablePagination: true },
      probes: { pi: "{{components.table1.pageIndex}}" },
    });
    cy.get('[data-cy="pagination-section"]').contains("button", "3").click({ force: true });
    tq.probe("pi").should("contain.text", "3");
    cy.get('[data-cy="table1-search-input-field"]').type("findme");
    cy.wait(400);
    tq.probe("pi").then(($el) => {
      const val = $el.text().trim();
      cy.log(`pageIndex after search narrowed results while on page 3: "${val}"`);
      expect(Number(val), "pageIndex should reset to 1 once the filtered result no longer has a page 3").to.eq(1);
    });
  });
});

describe("A5 pagination: server-side pagination", () => {
  afterEach(() => tq.cleanup());

  it("totalRecords=37, serverSideRowsPerPage=10: page count derives to 4, jump-to-last lands on page 4", () => {
    tq.app({
      data: genRows(10), // server-side: the widget only receives "one page" of data at a time
      columns: [col("id", "number")],
      props: {
        enablePagination: true,
        serverSidePagination: true,
        totalRecords: 37,
        serverSideRowsPerPage: 10,
        enableNextButton: true,
        enablePrevButton: true,
      },
      probes: { pi: "{{components.table1.pageIndex}}" },
    });
    cy.get(TO_LAST).click({ force: true });
    tq.probe("pi").should("contain.text", "4");
  });

  it("enableNextButton=false disables next even though there would be more server-side pages", () => {
    tq.app({
      data: genRows(10),
      columns: [col("id", "number")],
      props: {
        enablePagination: true,
        serverSidePagination: true,
        totalRecords: 37,
        serverSideRowsPerPage: 10,
        enableNextButton: false,
        enablePrevButton: true,
      },
    });
    cy.get(NEXT).should("be.disabled");
  });

  it("enablePrevButton=false disables prev even after navigating past page 1", () => {
    tq.app({
      data: genRows(10),
      columns: [col("id", "number")],
      props: {
        enablePagination: true,
        serverSidePagination: true,
        totalRecords: 37,
        serverSideRowsPerPage: 10,
        enableNextButton: true,
        enablePrevButton: false,
      },
    });
    cy.get(NEXT).click({ force: true });
    cy.get(PREV).should("be.disabled");
  });

  it("enableNextButton/enablePrevButton as fx expressions respond to pageIndex", () => {
    tq.app({
      data: genRows(10),
      columns: [col("id", "number")],
      props: {
        enablePagination: true,
        serverSidePagination: true,
        totalRecords: 37,
        serverSideRowsPerPage: 10,
        enableNextButton: "{{true}}",
        enablePrevButton: "{{components.table1.pageIndex > 1}}",
      },
      probes: { pi: "{{components.table1.pageIndex}}" },
    });
    cy.get(PREV).should("be.disabled"); // pageIndex 1 -> fx evaluates false
    cy.get(NEXT).click({ force: true });
    tq.probe("pi").should("contain.text", "2");
    cy.get(PREV).should("not.be.disabled"); // pageIndex 2 -> fx evaluates true
  });

  it("server-side pagination without totalRecords/serverSideRowsPerPage: only current page shown, no first/last jump", () => {
    tq.app({
      data: genRows(10),
      columns: [col("id", "number")],
      props: {
        enablePagination: true,
        serverSidePagination: true,
        enableNextButton: true,
        enablePrevButton: true,
      },
    });
    cy.get(TO_LAST).should("not.exist");
    cy.get('[data-cy="pagination-button-go-to-page"]').should("have.length", 1);
  });
});
