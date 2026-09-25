// Table inside a Container and a ListView; two tables on one page (isolation of selectors and exposed values).
import { tq, col, recorder, probe } from "./_obs";
import def from "../../../../fixtures/tableQA/addComponentRequest.json";

const R = recorder("v18-results.json");
const base = Object.values(def.body.diff)[0];
const u = (n) => `00000000-0000-4000-a000-${String(n).padStart(12, "0")}`;

describe("V18 containers and multiple tables", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("table inside a Container", () => {
    tq.app({
      parent: u(1), top0: 10, width: 20, height: 300,
      data: [{ id: 1, name: "Ada" }], columns: [col("id", "number"), col("name", "string", { isEditable: true })],
      extra: { box: { type: "Container", id: u(1), properties: {}, layout: { top: 20, left: 1, width: 30, height: 420 } } },
      probes: { cs: "{{JSON.stringify(components.table1.changeSet)}}" },
      props: { defaultSelectedRow: "{{undefined}}" },
    });
    cy.document().then((doc) => R.push({ id: "container:table renders", rows: doc.querySelectorAll('[data-cy^="table1-row-"]').length, insideBox: !!doc.querySelector('[data-cy="draggable-widget-box"] [data-cy="draggable-widget-table1"]') }));
    cy.get('[data-cy="table1-name-row-0"]').find(".long-text-input").click({ force: true });
    cy.get('[data-cy="table1-name-row-0"]').find('[contenteditable="true"]').type("{selectall}{backspace}InBox", { force: true });
    cy.get('[data-cy="table1-id-row-0"]').click({ force: true });
    cy.wait(400);
    cy.document().then((doc) => R.push({ id: "container:edit", cs: probe(doc, "cs") }));
  });

  it("table inside a ListView row (per-row data)", () => {
    tq.app({
      parent: u(2), top0: 5, width: 20, height: 200,
      data: "{{listItem?.items ?? []}}", columns: [col("a", "number")],
      extra: { lv: { type: "Listview", id: u(2), properties: { data: { value: "{{[{items:[{a:1}]},{items:[{a:2},{a:3}]}]}}" }, rowHeight: { value: "{{220}}" } }, layout: { top: 20, left: 1, width: 30, height: 500 } } },
      props: { defaultSelectedRow: "{{undefined}}" },
    });
    cy.wait(1500);
    cy.document().then((doc) => {
      const tables = [...doc.querySelectorAll('[data-cy="draggable-widget-lv"] .jet-table, [data-cy="draggable-widget-lv"] [data-cy="draggable-widget-table1"]')];
      R.push({ id: "listview:tables", count: tables.length, rowsPerTable: tables.map((t) => t.querySelectorAll('[data-cy^="table1-row-"]').length), cellTexts: tables.map((t) => [...t.querySelectorAll('[data-cy^="table1-a-row-"]')].map((c) => c.innerText.trim())) });
    });
  });

  it("two tables on one page", () => {
    const t2 = Cypress._.cloneDeep(base);
    t2.properties.data = { value: "{{[{id: 10, name: 'T2a'}, {id: 20, name: 'T2b'}]}}" };
    t2.properties.columns = { value: [col("id", "number"), col("name")] };
    t2.properties.autogenerateColumns = { value: false, generateNestedColumns: false };
    t2.properties.defaultSelectedRow = { value: "{{undefined}}" };
    tq.app({
      data: [{ id: 1, name: "T1a" }, { id: 2, name: "T1b" }], columns: [col("id", "number"), col("name")], width: 18,
      extra: { table2: { type: "Table", properties: t2.properties, styles: t2.styles, layout: { top: 30, left: 20, width: 18, height: 400 } } },
      probes: { s1: "{{JSON.stringify(components.table1.selectedRow)}}", s2: "{{JSON.stringify(components.table2.selectedRow)}}", q2: "{{components.table2.searchText}}" },
      props: { defaultSelectedRow: "{{undefined}}" },
    });
    cy.wait(800);
    cy.document().then((doc) => R.push({ id: "two:selectors distinct", t1: doc.querySelectorAll('[data-cy^="table1-name-row-"]').length, t2: doc.querySelectorAll('[data-cy^="table2-name-row-"]').length, sharedHeaders: doc.querySelectorAll('[data-cy="name-column-header"]').length }));
    cy.get('[data-cy="table1-id-row-1"]').click({ force: true });
    cy.get('[data-cy="table1-search-input-field"]').type("T1a", { force: true });
    cy.wait(600);
    cy.document().then((doc) => R.push({ id: "two:after select+search in table1", s1: probe(doc, "s1"), s2: probe(doc, "s2"), q2: probe(doc, "q2"), t2rows: doc.querySelectorAll('[data-cy^="table2-name-row-"]').length }));
  });
});
