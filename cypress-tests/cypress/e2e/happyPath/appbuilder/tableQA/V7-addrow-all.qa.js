// Add new row popup for every column type: inputs, newRows shape, defaults, validation, save/discard. Observe-only.
import { tq, col, OPTS, PROBES, recorder, cellFacts, probe } from "./_obs";

const R = recorder("v7-results.json");
const POP = ".table-add-new-row";
const pcell = (c, r = 0) => cy.get(`${POP} td[data-cy="${c}-column-${r}"]`);
const open = () => { cy.get('[data-cy="table1-add-new-row-button"]').click({ force: true }); cy.get(POP, { timeout: 8000 }); };
const snapNR = (id, extra = {}) => cy.document().then((doc) => R.push({ id, nr: probe(doc, "nr"), ...extra }));
const snapCell = (id, c, r = 0) => cy.document().then((doc) => R.push({ id, cell: cellFacts(doc, c, r, true), nr: probe(doc, "nr") }));
const build = (row, columns, props = {}) =>
  tq.app({ data: [row], columns, probes: PROBES, width: 32, props: { defaultSelectedRow: "{{undefined}}", showAddNewRowButton: "{{true}}", ...props } });

describe("V7 add new row, every column type", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("popup renders an input per type + initial newRows (defaults)", () => {
    const TYPES = [
      ["cstring", "string", {}], ["cnumber", "number", {}], ["ctext", "text", {}], ["cdate", "datepicker", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY" }],
      ["cselect", "select", { options: OPTS }], ["cmulti", "newMultiSelect", { options: OPTS }], ["ctags", "tagsV2", { options: OPTS }],
      ["cbool", "boolean", {}], ["cimage", "image", {}], ["clink", "link", {}], ["cjson", "json", {}], ["cmd", "markdown", {}],
      ["chtml", "html", {}], ["crating", "rating", { defaultRating: "{{4}}" }],
    ];
    const row = { id: 1 }; TYPES.forEach(([k]) => (row[k] = null));
    build(row, [col("id"), ...TYPES.map(([k, t, e]) => col(k, t, { isEditable: true, ...e }))]);
    open();
    cy.wait(600);
    cy.document().then((doc) => {
      TYPES.forEach(([k, t]) => R.push({ id: `popup:${t}`, cell: cellFacts(doc, k, 0, true) }));
      R.push({ id: "popup:initialNewRows", nr: probe(doc, "nr") });
      R.push({ id: "popup:buttons", buttons: [...doc.querySelectorAll(`${POP} button`)].map((b) => (b.getAttribute("data-cy") || "") + ":" + b.innerText.trim()) });
    });
  });

  it("typing per type lands in newRows with the right type", () => {
    build(
      { id: 1, s: "a", n: 1, t: "t", j: { a: 1 }, b: false, sel: "red", r: 1 },
      [col("id"), col("s", "string", { isEditable: true }), col("n", "number", { isEditable: true }), col("t", "text", { isEditable: true }),
        col("j", "json", { isEditable: true }), col("b", "boolean", { isEditable: true }), col("sel", "select", { isEditable: true, options: OPTS }),
        col("r", "rating", { isEditable: true })]
    );
    open();
    pcell("s").find('[contenteditable="true"], .long-text-input').first().click({ force: true }).type("Ada", { force: true });
    pcell("n").find("input").first().type("42", { force: true });
    pcell("t").find('[contenteditable="true"], .long-text-input, textarea').first().click({ force: true }).type("note", { force: true });
    pcell("j").find('[contenteditable="true"], .long-text-input').first().click({ force: true }).type('{"k":1}', { force: true, parseSpecialCharSequences: false });
    pcell("b").find("label.boolean-switch, input").first().click({ force: true });
    pcell("sel").find(".react-select__control").first().click({ force: true });
    cy.get("body").find('[class*="option"]').contains(/^Green$/).click({ force: true });
    pcell("r").find(".rating-icon-widget").eq(4).click({ force: true });
    cy.get(`${POP} [data-cy="add-new-rows-header"]`).click({ force: true });
    cy.wait(500);
    snapNR("typed:newRows");
    cy.get('[data-cy="save-button"]').click({ force: true });
    cy.wait(600);
    snapNR("typed:newRowsAfterSave");
    cy.document().then((doc) => R.push({ id: "typed:tableRowCountAfterSave", rows: doc.querySelectorAll('[data-cy^="table1-row-"]').length, popupOpen: !!doc.querySelector(POP) }));
  });

  it("read-only, hidden and fx-editable columns in the popup", () => {
    build(
      { id: 1, ro: "x", hid: "h", fx: "f" },
      [col("id"), col("ro", "string", { isEditable: false }), col("hid", "string", { isEditable: true, columnVisibility: "{{false}}" }),
        col("fx", "string", { isEditable: "{{rowData.id === 1}}" })]
    );
    open();
    cy.wait(500);
    cy.document().then((doc) => {
      R.push({ id: "ro:popupCell", cell: cellFacts(doc, "ro", 0, true) });
      R.push({ id: "hidden:popupCell", cell: cellFacts(doc, "hid", 0, true) });
      R.push({ id: "fxEditable:popupCell", cell: cellFacts(doc, "fx", 0, true) });
    });
  });

  it("validation inside the popup (string min length 5, number min 10)", () => {
    build({ id: 1, s: "abcdef", n: 20 }, [col("id"), col("s", "string", { isEditable: true, minLength: 5 }), col("n", "number", { isEditable: true, minValue: 10 })]);
    open();
    pcell("s").find('[contenteditable="true"], .long-text-input').first().click({ force: true }).type("ab", { force: true });
    pcell("n").find("input").first().type("3", { force: true });
    cy.get(`${POP} [data-cy="add-new-rows-header"]`).click({ force: true });
    cy.wait(400);
    snapCell("popupValidation:string", "s");
    snapCell("popupValidation:number", "n");
    cy.get('[data-cy="save-button"]').click({ force: true });
    cy.wait(500);
    cy.document().then((doc) => R.push({ id: "popupValidation:saveAllowed", popupOpen: !!doc.querySelector(POP), nr: probe(doc, "nr") }));
  });

  it("add another row, remove, discard", () => {
    build({ id: 1, s: "a" }, [col("id"), col("s", "string", { isEditable: true })]);
    open();
    pcell("s", 0).find('[contenteditable="true"], .long-text-input').first().click({ force: true }).type("r1", { force: true });
    cy.get('[data-cy="add-another-row-button"]').click({ force: true });
    cy.wait(300);
    pcell("s", 1).find('[contenteditable="true"], .long-text-input').first().click({ force: true }).type("r2", { force: true });
    cy.get(`${POP} [data-cy="add-new-rows-header"]`).click({ force: true });
    cy.wait(300);
    snapNR("multi:twoRows");
    cy.document().then((doc) => R.push({ id: "multi:deleteButtons", del: [...doc.querySelectorAll(`${POP} [data-cy*="delete"], ${POP} [class*="delete"]`)].length }));
    cy.get('[data-cy="discard-button"]').click({ force: true });
    cy.wait(400);
    cy.document().then((doc) => R.push({ id: "multi:afterDiscard", popupOpen: !!doc.querySelector(POP), nr: probe(doc, "nr") }));
    open();
    cy.wait(300);
    cy.document().then((doc) => R.push({ id: "multi:reopenAfterDiscard", rows: doc.querySelectorAll(`${POP} tbody tr`).length, cell: cellFacts(doc, "s", 0, true) }));
  });

  it("close (x) keeps or drops typed rows?", () => {
    build({ id: 1, s: "a" }, [col("id"), col("s", "string", { isEditable: true })]);
    open();
    pcell("s").find('[contenteditable="true"], .long-text-input').first().click({ force: true }).type("keepme", { force: true });
    cy.get('[data-cy="add-new-rows-close-button"]').click({ force: true });
    cy.wait(300);
    snapNR("close:afterX");
    open();
    cy.wait(300);
    cy.document().then((doc) => R.push({ id: "close:reopen", cell: cellFacts(doc, "s", 0, true) }));
  });
});
