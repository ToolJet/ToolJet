import { tq, col, recorder, probe } from "./_obs";
const R = recorder("v24-results.json");
describe("V24 search latency + pagination controls", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());
  [10, 5000].forEach((n) =>
    it(`search latency with ${n} rows`, () => {
      tq.app({ data: `{{Array.from({length: ${n}}, (_, i) => ({ id: i + 1, name: 'Name' + (i + 1) }))}}`, columns: [col("id", "number"), col("name")],
        probes: { st: "{{components.table1.searchText}}" }, props: { defaultSelectedRow: "{{undefined}}", rowsPerPage: "{{10}}" } });
      cy.get('[data-cy="table1-search-input-field"]').then(($i) => {
        const t0 = performance.now();
        cy.wrap($i).type("Name9", { force: true, delay: 0 });
        cy.get('[data-cy="draggable-widget-st"]', { timeout: 60000 }).should("have.text", "Name9").then(() => R.push({ id: `search:${n} rows: type 'Name9' → searchText updated (ms)`, ms: Math.round(performance.now() - t0) }));
        cy.get('[data-cy="table1-name-row-0"]', { timeout: 60000 }).should("contain.text", "Name9").then(() => R.push({ id: `search:${n} rows: → first matching row shown (ms)`, ms: Math.round(performance.now() - t0) }));
      });
      if (n === 5000) {
        cy.get('[data-cy="table1-search-clear-icon"]').click({ force: true });
        cy.wait(800);
        cy.document().then((doc) => {
          const sec = doc.querySelector('[data-cy="pagination-section"]');
          R.push({ id: "pagination:controls with 500 pages", text: sec?.innerText.replace(/\s+/g, " "), buttons: [...(sec?.querySelectorAll("button, input") || [])].map((b) => (b.getAttribute("data-cy") || b.tagName) + ":" + (b.innerText || b.value || "").trim()) });
        });
        cy.get('[data-cy="pagination-button-go-to-page"]').click({ force: true });
        cy.wait(500);
        cy.document().then((doc) => R.push({ id: "pagination:after go-to-page click", text: doc.querySelector('[data-cy="pagination-section"]')?.innerText.replace(/\s+/g, " "), inputs: [...doc.querySelectorAll("input")].filter((i) => i.offsetParent && /page/i.test(i.placeholder + i.className + (i.getAttribute("data-cy") || ""))).map((i) => i.getAttribute("data-cy") || i.placeholder) }));
      }
    })
  );
});
