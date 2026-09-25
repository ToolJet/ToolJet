// Child widgets inside expanded rows: render, bind to rowData, keep per-row state.
import { tq, col, recorder } from "./_obs";

const R = recorder("v16-results.json");
const snap = (id) => cy.document().then((doc) => R.push({
  id,
  childTexts: [...doc.querySelectorAll('[data-cy^="draggable-widget-rowtext"]')].map((e) => e.innerText.trim()),
  inputs: [...doc.querySelectorAll('[data-cy^="draggable-widget-rowinput"] input')].map((e) => e.value),
  expandedContainers: doc.querySelectorAll(".table-expanded-row-container").length,
}));

describe("V16 expanded row content", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("children render, bind rowData, and keep state per row", () => {
    tq.app({
      data: [{ id: 1, name: "Ada" }, { id: 2, name: "Bob" }, { id: 3, name: "Cy" }],
      columns: [col("id", "number"), col("name")],
      props: { defaultSelectedRow: "{{undefined}}", enableExpandableRows: "{{true}}", expansionHeight: "{{140}}" },
      extra: {
        rowtext: { type: "Text", parent: "TABLE", properties: { text: { value: "{{'CHILD:' + rowData?.name}}" } }, layout: { top: 10, left: 1, width: 12, height: 40 } },
        rowinput: { type: "TextInput", parent: "TABLE", properties: {}, layout: { top: 60, left: 1, width: 12, height: 40 } },
      },
    });
    snap("collapsed");
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    cy.wait(600);
    snap("row1 expanded");
    cy.get('[data-cy^="draggable-widget-rowinput"] input').first().type("typed-in-row1", { force: true });
    cy.get("button.table-expansion-toggle").eq(1).click({ force: true });
    cy.wait(600);
    snap("row1 + row2 expanded, row1 input typed");
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    cy.wait(400);
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    cy.wait(600);
    snap("row1 collapsed and re-expanded");
    cy.get('[data-cy="name-column-header"]').click({ force: true });
    cy.wait(600);
    snap("after sorting by name while expanded");
  });
});
