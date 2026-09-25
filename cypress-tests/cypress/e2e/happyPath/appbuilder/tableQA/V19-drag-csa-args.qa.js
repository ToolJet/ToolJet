// Column resize by drag (+ persistence), header controls inventory, component actions with arguments via RunJS.
import { tq, col, recorder, probe } from "./_obs";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const R = recorder("v19-results.json");
const rows = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `N${i + 1}` }));
const runQ = (name) => {
  cy.get(`[data-cy="list-query-${name}"]`).click({ force: true });
  cy.get('[data-cy="query-run-button"]').click({ force: true });
  cy.wait(1200);
};
const state = (id) => cy.document().then((doc) => R.push({
  id,
  ids: [...doc.querySelectorAll('[data-cy^="table1-id-row-"]')].map((e) => e.innerText.trim()),
  sel: probe(doc, "sel"), f: probe(doc, "f"), sort: probe(doc, "sort"),
  err: [...doc.querySelectorAll('[role="status"]')].map((e) => e.innerText.trim()).filter(Boolean).slice(0, 2),
}));

describe("V19 drag and component actions with arguments", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("resize a column by dragging, and after reload", () => {
    tq.app({ data: rows, columns: [col("id", "number"), col("name"), col("x")], props: { defaultSelectedRow: "{{undefined}}" } });
    const w = (id) => cy.document().then((doc) => R.push({ id, width: getComputedStyle(doc.querySelector('[data-cy="name-column-header"]').closest("th") || doc.querySelector('[data-cy="name-column-header"]')).width }));
    w("resize:before");
    cy.get('[data-cy="name-column-resizer"]').then(($r) => {
      const r = $r[0].getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      cy.wrap($r).trigger("mousedown", { clientX: x, clientY: y, button: 0, force: true })
        .trigger("mousemove", { clientX: x + 60, clientY: y, force: true })
        .trigger("mousemove", { clientX: x + 150, clientY: y, force: true });
      cy.document().trigger("mousemove", { clientX: x + 150, clientY: y }).trigger("mouseup", { clientX: x + 150, clientY: y, force: true });
    });
    cy.wait(800);
    w("resize:after drag +150px");
    cy.wait(2500);
    cy.reload();
    cy.get('[data-cy="draggable-widget-table1"]', { timeout: 30000 });
    cy.wait(1500);
    w("resize:after reload");
    cy.document().then((doc) => {
      const th = doc.querySelector('[data-cy="name-column-header"]');
      R.push({ id: "header:controls", html: th ? th.closest("th")?.innerHTML.replace(/<path[^>]*>|<\/?svg[^>]*>/g, "").slice(0, 300) : null, draggableHeaders: doc.querySelectorAll('th[draggable="true"]').length });
    });
  });

  it("component actions with arguments (RunJS)", () => {
    tq.app({
      data: rows, columns: [col("id", "number"), col("name")],
      queries: [
        { name: "qf", code: "await components.table1.setFilters([{ column: 'name', condition: 'contains', value: 'N2' }]); return 1;" },
        { name: "qfbad", code: "await components.table1.setFilters([{ column: 'nope', condition: 'contains', value: 'x' }]); return 1;" },
        { name: "qclr", code: "await components.table1.clearFilters(); return 1;" },
        { name: "qsel", code: "await components.table1.selectRow('id', 3); return 1;" },
        { name: "qselname", code: "await components.table1.selectRow('name', 'N5'); return 1;" },
        { name: "qrows", code: "await components.table1.selectRows('id', [1, 4]); return 1;" },
        { name: "qsort", code: "await components.table1.setSort('name', 'desc'); return 1;" },
        { name: "qsortbad", code: "await components.table1.setSort('nope', 'sideways'); return 1;" },
        { name: "qcsv", code: "await components.table1.downloadTableData('csv'); return 1;" },
        { name: "qxls", code: "await components.table1.downloadTableData('xlsx'); return 1;" },
      ],
      probes: { sel: "{{JSON.stringify({one: components.table1.selectedRow?.id, many: components.table1.selectedRows?.map(r => r.id)})}}", f: "{{JSON.stringify(components.table1.filters)}}", sort: "{{JSON.stringify(components.table1.sortApplied)}}" },
      props: { defaultSelectedRow: "{{undefined}}", showBulkSelector: "{{true}}" },
    });
    resizeQueryPanel("40");
    ["qf", "qfbad", "qclr", "qsel", "qselname", "qrows", "qsort", "qsortbad"].forEach((q) => { runQ(q); state(`csa:${q}`); });
    cy.exec("rm -rf cypress/downloads/*", { failOnNonZeroExit: false });
    runQ("qcsv"); runQ("qxls");
    cy.wait(2000);
    cy.exec("ls -1 cypress/downloads || true").then((r) => R.push({ id: "csa:downloadTableData files", files: r.stdout.split("\n").filter(Boolean) }));
  });
});
