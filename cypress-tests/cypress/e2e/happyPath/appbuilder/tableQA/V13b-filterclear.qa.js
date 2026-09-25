import { tq, col, recorder, probe } from "./_obs";
import { addFilter } from "Support/utils/appBuilder/components/table";
const R = recorder("v13b-results.json");
const toasts = (doc, p) => [...doc.querySelectorAll('[role="status"]')].map((e) => e.innerText.trim()).filter((t) => t.startsWith(p));
describe("V13b", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());
  it("clear filters and remove single filter: rows, exposed filters, event", () => {
    const rows = Array.from({ length: 4 }, (_, i) => ({ id: i + 1, name: `N${i + 1}` }));
    tq.app({ data: rows, columns: [col("id", "number"), col("name")], props: { defaultSelectedRow: "{{undefined}}" },
      probes: { f: "{{JSON.stringify(components.table1.filters)}}" },
      events: [{ eventId: "onFilterChanged", message: "FILTER:{{components.table1.filters.length}}" }] });
    const snap = (id) => cy.wait(900).then(() => cy.document().then((doc) => R.push({ id, rows: doc.querySelectorAll('[data-cy^="table1-row-"]').length, filters: probe(doc, "f"), toasts: toasts(doc, "FILTER") })));
    addFilter([{ column: "name", operation: "contains", value: "N2" }], true);
    snap("after apply");
    cy.get('[data-cy="table1-filter-button"]').click({ force: true });
    cy.get('[data-cy="close-filter-button-0"]').click({ force: true });
    cy.get('[data-cy="close-filters-button"]').click({ force: true });
    snap("after removing the filter row (x)");
    addFilter([{ column: "name", operation: "contains", value: "N3" }], true);
    snap("after re-apply N3");
    cy.get('[data-cy="table1-filter-button"]').click({ force: true });
    cy.get('[data-cy="button-clear-filters"]').click({ force: true });
    cy.get('[data-cy="close-filters-button"]').click({ force: true });
    snap("after Clear filters");
  });
});
