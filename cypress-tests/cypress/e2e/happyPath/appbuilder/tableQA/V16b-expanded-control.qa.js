import { tq, col, recorder } from "./_obs";
const R = recorder("v16b-results.json");
describe("V16b expanded row child control", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());
  it("static vs rowData vs global binding in expanded row children", () => {
    tq.app({
      data: [{ id: 1, name: "Ada" }, { id: 2, name: "Bob" }],
      columns: [col("id", "number"), col("name")],
      props: { defaultSelectedRow: "{{undefined}}", enableExpandableRows: "{{true}}", expansionHeight: "{{200}}" },
      extra: {
        kstatic: { type: "Text", parent: "TABLE", properties: { text: { value: "STATIC-OK" } }, layout: { top: 5, left: 1, width: 10, height: 40 } },
        krow: { type: "Text", parent: "TABLE", properties: { text: { value: "{{rowData?.name ?? 'NO-ROWDATA'}}" } }, layout: { top: 50, left: 1, width: 10, height: 40 } },
        kglobal: { type: "Text", parent: "TABLE", properties: { text: { value: "{{'G:' + components.table1.lastExpandedRow}}" } }, layout: { top: 95, left: 1, width: 10, height: 40 } },
        outside: { type: "Text", properties: { text: { value: "{{'OUT:' + JSON.stringify(components.krow?.text ?? null)}}" } } },
      },
    });
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    cy.wait(1200);
    cy.get("button.table-expansion-toggle").eq(1).click({ force: true });
    cy.wait(1200);
    cy.document().then((doc) => {
      const t = (n) => [...doc.querySelectorAll(`[data-cy="draggable-widget-${n}"]`)].map((e) => e.innerText.trim());
      R.push({ id: "children", kstatic: t("kstatic"), krow: t("krow"), kglobal: t("kglobal"), outside: t("outside"), errors: [...doc.querySelectorAll('[role="status"]')].map((e) => e.innerText.trim()).slice(0, 3) });
    });
  });
});
