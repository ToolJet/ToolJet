// Edit every editable column type through the UI; record shown value, changeSet, updatedData. Observe-only.
import { tq, col, OPTS, PROBES, recorder, cellFacts, probe } from "./_obs";

const R = recorder("v6-results.json");
const snap = (id, c, extra = {}) =>
  cy.document().then((doc) =>
    R.push({ id, cell: cellFacts(doc, c), cs: probe(doc, "cs"), ud: probe(doc, "ud"), ...extra })
  );
const build = (rows, columns, props = {}) =>
  tq.app({ data: rows, columns, probes: PROBES, width: 32, props: { defaultSelectedRow: "{{undefined}}", ...props } });
const td = (c, r = 0) => tq.cell(r, c);
const blur = () => tq.probe("cs").click({ force: true });
const typeCE = (c, text) => {
  td(c).find(".long-text-input").first().click({ force: true });
  td(c).find('[contenteditable="true"]').first().type(`{selectall}{backspace}${text}`, { force: true, parseSpecialCharSequences: text.startsWith("{") ? false : true });
};
const menuPick = (label) => cy.get("body").find('[class*="option"]').contains(new RegExp(`^${label}$`)).click({ force: true });

describe("V6 edit every column type", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  // ---------- contenteditable text-like types ----------
  [
    ["string", "hello", "world"],
    ["text", "long text", "multi\nline"],
    ["markdown", "**b**", "*new*"],
    ["html", "<i>x</i>", "<b>y</b>"],
  ].forEach(([type, start, next]) =>
    it(`${type}: type new value, blur`, () => {
      build([{ id: 1, c: start }], [col("id"), col("c", type, { isEditable: true })]);
      snap(`${type}:initial`, "c");
      typeCE("c", next.replace("\n", "{shift+enter}"));
      blur();
      cy.wait(400);
      snap(`${type}:afterEdit`, "c", { typed: next });
    })
  );

  it("json: edit to valid JSON, then to invalid JSON", () => {
    build([{ id: 1, c: { a: 1 } }], [col("id"), col("c", "json", { isEditable: true })]);
    snap("json:initial", "c");
    td("c").find(".long-text-input").first().click({ force: true });
    td("c").find('[contenteditable="true"]').first().type('{selectall}{backspace}{"a":2}', { force: true, parseSpecialCharSequences: false });
    blur(); cy.wait(400);
    snap("json:afterValid", "c", { typed: '{"a":2}' });
    td("c").find(".long-text-input").first().click({ force: true });
    td("c").find('[contenteditable="true"]').first().type('{selectall}{backspace}{"a":', { force: true, parseSpecialCharSequences: false });
    blur(); cy.wait(400);
    snap("json:afterInvalid", "c", { typed: '{"a":' });
  });

  it("string: Escape while editing", () => {
    build([{ id: 1, c: "keep" }], [col("id"), col("c", "string", { isEditable: true })]);
    typeCE("c", "changed{esc}");
    cy.wait(400);
    snap("string:afterEsc", "c", { typed: "changed + Esc" });
  });

  // ---------- number ----------
  it("number: type, stepper up/down, decimalPlaces", () => {
    build(
      [{ id: 1, n: 5, d: 1.5 }],
      [col("id"), col("n", "number", { isEditable: true }), col("d", "number", { isEditable: true, decimalPlaces: "{{2}}" })]
    );
    td("n").find("input").first().type("{selectall}{backspace}42{enter}", { force: true });
    blur(); cy.wait(300);
    snap("number:typed42", "n");
    td("n").find('[class*="up-arrow"], .arror-container > div > div').first().click({ force: true });
    cy.wait(300);
    snap("number:stepUp", "n");
    td("d").find("input").first().type("{selectall}{backspace}3.14159{enter}", { force: true });
    blur(); cy.wait(300);
    snap("number:decimals2typed3.14159", "d");
    td("n").find("input").first().type("{selectall}{backspace}abc{enter}", { force: true });
    blur(); cy.wait(300);
    snap("number:typedLetters", "n");
    td("n").find("input").first().type("{selectall}{backspace}{enter}", { force: true });
    blur(); cy.wait(300);
    snap("number:cleared", "n");
  });

  // ---------- select family ----------
  [
    ["select", "red", "Green"],
    ["newMultiSelect", ["red"], "Green"],
    ["tagsV2", ["red"], "Green"],
  ].forEach(([type, start, pickLabel]) =>
    it(`${type}: open and pick ${pickLabel}`, () => {
      build([{ id: 1, c: start }], [col("id"), col("c", type, { isEditable: true, options: OPTS })]);
      snap(`${type}:initial`, "c");
      td("c").find(".react-select__control").first().click({ force: true });
      cy.wait(400);
      cy.document().then((doc) =>
        R.push({ id: `${type}:menu`, optionEls: [...doc.querySelectorAll('[class*="option"]')].map((e) => e.className.split(" ")[0] + ":" + e.innerText.trim()).slice(0, 8) })
      );
      menuPick(pickLabel);
      cy.wait(300);
      blur(); cy.wait(300);
      snap(`${type}:afterPick`, "c");
    })
  );

  // ---------- boolean / rating ----------
  it("boolean: toggle", () => {
    build([{ id: 1, c: true }], [col("id"), col("c", "boolean", { isEditable: true })]);
    snap("boolean:initial", "c");
    td("c").find("label.boolean-switch").click({ force: true });
    cy.wait(300);
    snap("boolean:afterToggle", "c");
  });

  it("rating: click 5th star, then half-star column", () => {
    build(
      [{ id: 1, c: 3, h: 2 }],
      [col("id"), col("c", "rating", { isEditable: true }), col("h", "rating", { isEditable: true, allowHalfStar: "{{true}}" })]
    );
    td("c").find(".rating-icon-widget").eq(4).click({ force: true });
    cy.wait(300);
    snap("rating:click5th", "c");
    td("h").find(".rating-icon-widget").eq(3).click("left", { force: true });
    cy.wait(300);
    snap("rating:halfStarLeftOf4th", "h");
  });

  // ---------- forced non-editable types ----------
  it("link / image / button with Make editable on", () => {
    build(
      [{ id: 1, l: "https://tooljet.com", i: "https://reqres.in/img/faces/7-image.jpg" }],
      [col("id"), col("l", "link", { isEditable: true }), col("i", "image", { isEditable: true })]
    );
    cy.document().then((doc) => R.push({ id: "link:editableEl", cell: cellFacts(doc, "l") }));
    cy.document().then((doc) => R.push({ id: "image:editableEl", cell: cellFacts(doc, "i") }));
  });

  // ---------- editability controls ----------
  it("per-row editability via fx: {{rowData.id === 1}}", () => {
    build([{ id: 1, c: "a" }, { id: 2, c: "b" }], [col("id"), col("c", "string", { isEditable: "{{rowData.id === 1}}" })]);
    td("c", 1).find(".long-text-input").first().click({ force: true });
    cy.wait(300);
    cy.document().then((doc) => {
      R.push({ id: "rowfx:row1(id=1)", cell: cellFacts(doc, "c", 0) });
      R.push({ id: "rowfx:row2(id=2) after click", cell: cellFacts(doc, "c", 1), ce: !!doc.querySelector('td[data-cy="table1-c-row-1"] [contenteditable="true"]') });
    });
  });

  it("Make all columns editable (table prop) with a column set not editable", () => {
    build([{ id: 1, a: "x", b: "y" }], [col("id"), col("a", "string", { isEditable: false }), col("b", "string")], { isAllColumnsEditable: "{{true}}" });
    td("a").find(".long-text-input").first().click({ force: true });
    cy.wait(300);
    cy.document().then((doc) => {
      R.push({ id: "allEditable:colA(isEditable false)", ce: !!doc.querySelector('td[data-cy="table1-a-row-0"] [contenteditable="true"]') });
      R.push({ id: "allEditable:colB(unset)", cell: cellFacts(doc, "b") });
    });
  });

  it("edit then Discard changes restores every edited type", () => {
    build([{ id: 1, s: "one", n: 1, b: true }], [col("id"), col("s", "string", { isEditable: true }), col("n", "number", { isEditable: true }), col("b", "boolean", { isEditable: true })]);
    typeCE("s", "two");
    blur();
    td("n").find("input").first().type("{selectall}{backspace}9{enter}", { force: true });
    blur();
    td("b").find("label.boolean-switch").click({ force: true });
    cy.wait(300);
    snap("discard:beforeDiscard", "s");
    cy.get('[data-cy="table-button-discard-changes"]').click({ force: true });
    cy.wait(400);
    cy.document().then((doc) => R.push({ id: "discard:after", s: cellFacts(doc, "s"), n: cellFacts(doc, "n"), b: cellFacts(doc, "b"), cs: probe(doc, "cs") }));
  });
});
