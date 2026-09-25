import { tq, col, OPTS, PROBES, recorder, cellFacts, probe } from "./_obs";
const R = recorder("v9b-results.json");
const toasts = (doc, p) => [...doc.querySelectorAll('[role="status"]')].map((e) => e.innerText.trim()).filter((t) => t.startsWith(p));
describe("V9b", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());
  it("button column click fires onClick with the clicked row", () => {
    tq.app({
      data: [{ id: 1, name: "A" }, { id: 2, name: "B" }],
      columns: [col("id", "number"), col("name"), col("act", "button", { buttons: [{ id: "go", buttonLabel: "Go" }] })],
      events: [{ eventId: "onClick", eventType: "table_column", ref: "act::go", message: "BTN:{{components.table1.selectedRow?.name}}" }],
      props: { defaultSelectedRow: "{{undefined}}" },
    });
    cy.get('td[data-cy="table1-act-row-1"] button').contains("Go").click({ force: true });
    cy.wait(900);
    cy.document().then((doc) => R.push({ id: "button:click row 2", toasts: toasts(doc, "BTN") }));
    cy.get('td[data-cy="table1-act-row-0"] button').contains("Go").click({ force: true });
    cy.wait(900);
    cy.document().then((doc) => R.push({ id: "button:then row 1", toasts: toasts(doc, "BTN") }));
  });
  it("default option on existing null value vs data", () => {
    tq.app({
      data: [{ id: 1, def: null }], probes: PROBES,
      columns: [col("id"), col("def", "select", { options: OPTS, defaultOptionsList: [OPTS[1]], isEditable: true })],
      props: { defaultSelectedRow: "{{undefined}}", showAddNewRowButton: "{{true}}" },
    });
    cy.document().then((doc) => R.push({ id: "default:existing null row", cell: cellFacts(doc, "def"), ud: probe(doc, "ud"), cs: probe(doc, "cs") }));
    cy.get('[data-cy="table1-add-new-row-button"]').click({ force: true });
    cy.wait(600);
    cy.document().then((doc) => R.push({ id: "default:new row", cell: cellFacts(doc, "def", 0, true), nr: probe(doc, "nr") }));
  });
});
