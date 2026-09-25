// Size ladder: how long until the table shows its first row, for 500 / 1000 / 2000 / 5000 rows, data via a page-load query.
import { tq, col, recorder } from "./_obs";

const R = recorder("v17b-results.json");
[500, 1000, 2000, 5000].forEach((n) =>
  describe(`V17b ${n} rows`, () => {
    afterEach(() => tq.cleanup());
    after(() => R.flush());
    it(`${n} rows from a query, pagination on (10/page)`, () => {
      tq.app({
        queries: [{ name: "q1", runOnPageLoad: true, code: `return Array.from({length: ${n}}, (_, i) => ({ id: i + 1, name: 'Name' + (i + 1), v: i % 97 }));` }],
        data: "{{queries.q1.data ?? []}}", columns: [col("id", "number"), col("name"), col("v", "number")],
        props: { defaultSelectedRow: "{{undefined}}", rowsPerPage: "{{10}}" },
      });
      const t0 = Date.now();
      cy.get('[data-cy="table1-row-0"]', { timeout: 120000 }).then(() => R.push({ id: `ladder:${n} rows → first row after table visible (ms)`, ms: Date.now() - t0 }));
      cy.document().then((doc) => R.push({ id: `ladder:${n} footer`, footer: doc.querySelector('[data-cy="footer-number-of-records"]')?.innerText }));
      const t1 = Date.now();
      cy.get('[data-cy="table1-search-input-field"]').type("Name7", { force: true, delay: 0 });
      cy.get('[data-cy="table1-name-row-0"]', { timeout: 60000 }).should("contain.text", "Name7").then(() => R.push({ id: `ladder:${n} search ms`, ms: Date.now() - t1 }));
    });
  })
);
