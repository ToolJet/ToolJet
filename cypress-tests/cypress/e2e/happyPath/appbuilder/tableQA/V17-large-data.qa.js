// 5,000 rows: render time, virtualisation, scroll, edit far down, select all, search, pagination, export row count.
import { tq, col, recorder, probe } from "./_obs";

const R = recorder("v17-results.json");
const DATA = "{{Array.from({length: 5000}, (_, i) => ({ id: i + 1, name: 'Name' + (i + 1), v: i % 97 }))}}";

describe("V17 large data", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("5,000 rows, pagination off (virtualised)", () => {
    const t0 = Date.now();
    tq.app({
      data: DATA, height: 600, columns: [col("id", "number"), col("name", "string", { isEditable: true }), col("v", "number")],
      probes: { cs: "{{JSON.stringify(components.table1.changeSet)}}", n: "{{components.table1.selectedRows?.length}}", cd: "{{components.table1.currentData?.length}}" },
      props: { defaultSelectedRow: "{{undefined}}", enablePagination: "{{false}}", showBulkSelector: "{{true}}" },
    });
    cy.get('[data-cy="table1-row-0"]', { timeout: 30000 }).then(() => R.push({ id: "large:ms from start to first row (incl. app create)", ms: Date.now() - t0 }));
    cy.document().then((doc) => R.push({ id: "large:rendered tr in DOM", tr: doc.querySelectorAll('[data-cy^="table1-row-"]').length, footer: doc.querySelector('[data-cy="footer-number-of-records"]')?.innerText, cd: probe(doc, "cd") }));
    // scroll the table body to the bottom
    cy.document().then((doc) => {
      const sc = [...doc.querySelectorAll('[data-cy="draggable-widget-table1"] *')].find((e) => e.scrollHeight > e.clientHeight + 200 && getComputedStyle(e).overflowY !== "visible");
      if (sc) sc.scrollTop = sc.scrollHeight;
      R.push({ id: "large:scroll container", found: !!sc, scrollHeight: sc?.scrollHeight });
    });
    cy.wait(1000);
    cy.document().then((doc) => {
      const ids = [...doc.querySelectorAll('[data-cy^="table1-id-row-"]')].map((e) => e.innerText.trim());
      R.push({ id: "large:ids visible after scroll to bottom", first: ids[0], last: ids[ids.length - 1], count: ids.length });
    });
    cy.get('[data-cy="table1-name-row-4997"]', { timeout: 10000 }).find(".long-text-input").click({ force: true });
    cy.get('[data-cy="table1-name-row-4997"]').find('[contenteditable="true"]').type("{selectall}{backspace}FAR", { force: true });
    cy.get('[data-cy="table1-id-row-4997"]').click({ force: true });
    cy.wait(500);
    cy.document().then((doc) => R.push({ id: "large:edit row 4998", cs: probe(doc, "cs") }));
    // select all via header checkbox
    cy.document().then((doc) => {
      const hdr = doc.querySelector('thead input[type="checkbox"], [data-cy*="select-all"] input');
      if (hdr) hdr.click();
      R.push({ id: "large:header checkbox found", found: !!hdr });
    });
    cy.wait(800);
    cy.document().then((doc) => R.push({ id: "large:selectedRows after select all", n: probe(doc, "n") }));
    const t1 = Date.now();
    cy.get('[data-cy="table1-search-input-field"]').type("Name4999", { force: true, delay: 0 });
    cy.get('[data-cy="table1-name-row-0"]', { timeout: 15000 }).should("contain.text", "Name4999").then(() => R.push({ id: "large:search Name4999 ms", ms: Date.now() - t1 }));
    cy.document().then((doc) => R.push({ id: "large:rows after search", ids: [...doc.querySelectorAll('[data-cy^="table1-id-row-"]')].map((e) => e.innerText.trim()) }));
  });

  it("5,000 rows with pagination (10 per page)", () => {
    tq.app({ data: DATA, columns: [col("id", "number"), col("name")], props: { defaultSelectedRow: "{{undefined}}", rowsPerPage: "{{10}}" } });
    cy.document().then((doc) => R.push({ id: "largepg:footer+pagination", footer: doc.querySelector('[data-cy="footer-number-of-records"]')?.innerText, pag: doc.querySelector('[data-cy="pagination-section"]')?.innerText.replace(/\s+/g, " ") }));
    cy.get('[data-cy="pagination-section"] input').first().then(($i) => {
      if ($i.length) cy.wrap($i).clear({ force: true }).type("500{enter}", { force: true });
    });
    cy.wait(800);
    cy.document().then((doc) => R.push({ id: "largepg:go to page 500", ids: [...doc.querySelectorAll('[data-cy^="table1-id-row-"]')].map((e) => e.innerText.trim()), nextDisabled: doc.querySelector('[data-cy="pagination-button-to-next"]')?.disabled }));
  });
});
