// Table fed by a real (RunJS) query: loading state, refresh, what happens to edits/selection/page on data change.
import { tq, col, recorder, cellFacts, probe } from "./_obs";

const R = recorder("v14-results.json");
const P = {
  cs: "{{JSON.stringify(components.table1.changeSet)}}",
  sr: "{{JSON.stringify(components.table1.selectedRow)}}",
  pi: "{{components.table1.pageIndex}}",
  ql: "{{String(queries.q1.isLoading)}}",
};
const snap = (id) => cy.document().then((doc) => R.push({
  id,
  rows: [...doc.querySelectorAll('[data-cy^="table1-name-row-"]')].map((e) => e.innerText.trim()).slice(0, 6),
  skeleton: doc.querySelectorAll('[class*="skeleton"], [class*="loader"], [class*="loading"]').length,
  cs: probe(doc, "cs"), sr: probe(doc, "sr"), pi: probe(doc, "pi"), ql: probe(doc, "ql"),
}));

describe("V14 table fed by a query", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("loading state while the page-load query runs", () => {
    tq.app({
      queries: [{ name: "q1", runOnPageLoad: true, code: "await new Promise(r => setTimeout(r, 4000)); return [{id:1,name:'A'},{id:2,name:'B'}];" }],
      data: "{{queries.q1.data ?? []}}", columns: [col("id", "number"), col("name")], probes: P,
      props: { defaultSelectedRow: "{{undefined}}", loadingState: "{{queries.q1.isLoading}}" },
    });
    snap("load:t≈0 (query running)");
    cy.wait(5000);
    snap("load:after query");
  });

  it("refresh re-runs the query; edits, selection and page on data change", () => {
    tq.app({
      queries: [{ name: "q1", runOnPageLoad: true, code: "window.__tqRun = (window.__tqRun || 0) + 1; await new Promise(r => setTimeout(r, 800)); return Array.from({length: 12}, (_, i) => ({ id: i + 1, name: 'R' + window.__tqRun + '-' + (i + 1) }));" }],
      data: "{{queries.q1.data ?? []}}", columns: [col("id", "number"), col("name", "string", { isEditable: true })], probes: P,
      props: { defaultSelectedRow: "{{undefined}}", loadingState: "{{queries.q1.isLoading}}", showRefreshButton: "{{true}}", rowsPerPage: "{{5}}" },
      events: [{ eventId: "onRefresh", runQuery: "q1" }],
    });
    cy.wait(2500);
    snap("refresh:initial");
    // select row 2, go to page 2, edit first row there
    cy.get('[data-cy="table1-id-row-1"]').click({ force: true });
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    cy.wait(300);
    cy.get('[data-cy^="table1-name-row-"]').first().find(".long-text-input").click({ force: true });
    cy.get('[data-cy^="table1-name-row-"]').first().find('[contenteditable="true"]').type("{selectall}{backspace}EDITED", { force: true });
    cy.get('[data-cy^="table1-id-row-"]').first().click({ force: true });
    cy.wait(400);
    snap("refresh:before refresh (edited, selected, page 2)");
    cy.get('[data-cy="table1-refresh-button"]').click({ force: true });
    cy.wait(300);
    snap("refresh:during refresh");
    cy.wait(2000);
    snap("refresh:after refresh (new data R2-*)");
  });
});
