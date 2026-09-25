import { tq, col, recorder } from "./_obs";
const R = recorder("v23-results.json");
const Q = "return Array.from({length: 5000}, (_, i) => ({ id: i + 1, name: 'Name' + (i + 1), v: i % 97 }));";
const INLINE = "{{Array.from({length: 5000}, (_, i) => ({ id: i + 1, name: 'Name' + (i + 1), v: i % 97 }))}}";
const cases = [
  ["query, pagination OFF", { queries: [{ name: "q1", runOnPageLoad: true, code: Q }], data: "{{queries.q1.data ?? []}}", props: { enablePagination: "{{false}}" } }],
  ["inline expression, pagination ON", { data: INLINE, props: { rowsPerPage: "{{10}}" } }],
  ["inline expression, pagination OFF", { data: INLINE, props: { enablePagination: "{{false}}" } }],
];
describe("V23 isolate large-data failure + dark mode", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());
  cases.forEach(([label, o]) =>
    it(label, () => {
      cy.on("fail", (e) => { if (/draggable-widget-table1|table1-row-0/.test(e.message)) { R.push({ id: label, rendered: false, note: e.message.slice(0, 120) }); return false; } throw e; });
      const t0 = Date.now();
      tq.app({ ...o, columns: [col("id", "number"), col("name"), col("v", "number")], props: { defaultSelectedRow: "{{undefined}}", ...o.props } });
      cy.get('[data-cy="table1-row-0"]', { timeout: 90000 }).then(() => cy.document().then((doc) => R.push({ id: label, rendered: true, msFromStart: Date.now() - t0, trInDom: doc.querySelectorAll('[data-cy^="table1-row-"]').length })));
    })
  );
  it("dark mode via the Moon icon button", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }], columns: [col("id", "number"), col("name")], props: { defaultSelectedRow: "{{undefined}}" } });
    cy.document().then((doc) => {
      const btn = [...doc.querySelectorAll("button, [role=button]")].find((b) => /moon/i.test(b.innerHTML) || /dark/i.test(b.getAttribute("aria-label") || "") || /dark/i.test(b.getAttribute("data-cy") || ""));
      R.push({ id: "dark:toggle found", found: !!btn, cy: btn?.getAttribute("data-cy"), cls: btn?.className?.toString().slice(0, 60) });
      btn?.click();
    });
    cy.wait(1500);
    cy.document().then((doc) => {
      const c = (sel) => { const el = doc.querySelector(sel); return el ? { color: getComputedStyle(el).color } : null; };
      R.push({ id: "dark:after toggle", table: doc.querySelector(".jet-table")?.className, html: doc.documentElement.className + " | " + doc.body.className, cell: c('[data-cy="table1-name-row-0"]'), header: c('[data-cy="name-column-header"]'), footer: c('[data-cy="footer-number-of-records"]'),
        tableBg: getComputedStyle(doc.querySelector(".jet-table")).backgroundColor });
    });
  });
});
