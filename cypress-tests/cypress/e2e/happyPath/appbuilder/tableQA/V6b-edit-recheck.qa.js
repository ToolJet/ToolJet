// Re-checks for V6 ambiguities. Probes escape '<' so the Text widget cannot render HTML.
import { tq, col, OPTS, recorder, cellFacts, probe } from "./_obs";

const R = recorder("v6b-results.json");
const P = { cs: "{{JSON.stringify(components.table1.changeSet).replace(/</g, '[').replace(/\\n/g, '\\\\n')}}" };
const build = (rows, columns, props = {}) => tq.app({ data: rows, columns, probes: P, width: 32, props: { defaultSelectedRow: "{{undefined}}", ...props } });
const blurOther = () => tq.cell(0, "id").click({ force: true });
const ce = (c, r = 0) => tq.cell(r, c).find('[contenteditable="true"]').first();
const openCE = (c, r = 0) => tq.cell(r, c).find(".long-text-input").first().click({ force: true });
const snap = (id, c, r = 0) => cy.document().then((doc) => R.push({ id, cell: cellFacts(doc, c, r), cs: probe(doc, "cs") }));

describe("V6b edit re-checks", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("text: newline typed with shift+enter", () => {
    build([{ id: 1, c: "a" }], [col("id"), col("c", "text", { isEditable: true })]);
    openCE("c"); ce("c").type("{selectall}{backspace}line1{shift+enter}line2", { force: true });
    blurOther(); cy.wait(400);
    snap("text:newline", "c");
  });

  it("markdown: commit via blur to another cell, and via Enter", () => {
    build([{ id: 1, c: "**b**", d: "x" }], [col("id"), col("c", "markdown", { isEditable: true }), col("d", "markdown", { isEditable: true })]);
    openCE("c"); ce("c").type("{selectall}{backspace}*new*", { force: true });
    blurOther(); cy.wait(400);
    snap("markdown:blurOtherCell", "c");
    openCE("d"); ce("d").type("{selectall}{backspace}typed{enter}", { force: true });
    cy.wait(400);
    snap("markdown:enter", "d");
  });

  it("html: saved value keeps tags?", () => {
    build([{ id: 1, c: "<i>x</i>" }], [col("id"), col("c", "html", { isEditable: true })]);
    snap("html:initial", "c");
    openCE("c"); ce("c").type("{selectall}{backspace}<b>y</b>", { force: true });
    blurOther(); cy.wait(400);
    snap("html:afterTyping<b>y</b>", "c");
  });

  it("json: valid edit and invalid edit (typed without special-sequence parsing)", () => {
    build([{ id: 1, c: { a: 1 } }], [col("id"), col("c", "json", { isEditable: true })]);
    openCE("c"); ce("c").type("{selectall}{backspace}", { force: true }).type('{"a":2}', { force: true, parseSpecialCharSequences: false });
    blurOther(); cy.wait(400);
    snap("json:valid", "c");
    openCE("c"); ce("c").type("{selectall}{backspace}", { force: true }).type('{"a":', { force: true, parseSpecialCharSequences: false });
    blurOther(); cy.wait(400);
    snap("json:invalid", "c");
  });

  it("tags with Allow multiple selection on: pick adds a tag", () => {
    build([{ id: 1, c: ["red"] }], [col("id"), col("c", "tagsV2", { isEditable: true, options: OPTS, allowMultipleSelection: true, autoAssignColors: true, sortTags: "none" })]);
    tq.cell(0, "c").find(".react-select__control").first().click({ force: true });
    cy.wait(300);
    cy.get("body").find('[class*="option"]').contains(/^Green$/).first().click({ force: true });
    blurOther(); cy.wait(400);
    snap("tags(multi on):pickGreen", "c");
  });

  it("per-row editability fx and Make all columns editable", () => {
    build([{ id: 1, c: "a", x: "p" }, { id: 2, c: "b", x: "q" }], [col("id"), col("c", "string", { isEditable: "{{rowData.id === 1}}" }), col("x", "string", { isEditable: false })], { isAllColumnsEditable: "{{false}}" });
    cy.document().then((doc) => {
      const edit = (c, r) => !!doc.querySelector(`td[data-cy="table1-${c}-row-${r}"] .long-text-input`);
      R.push({ id: "rowfx", row1Editable: edit("c", 0), row2Editable: edit("c", 1) });
    });
  });

  it("Make all columns editable overrides per-column false?", () => {
    build([{ id: 1, a: "x", b: "y" }], [col("id"), col("a", "string", { isEditable: false }), col("b", "string")], { isAllColumnsEditable: "{{true}}" });
    cy.document().then((doc) => {
      const edit = (c) => !!doc.querySelector(`td[data-cy="table1-${c}-row-0"] .long-text-input`);
      R.push({ id: "allEditable", colA_false: edit("a"), colB_unset: edit("b"), colId: edit("id") });
    });
  });

  it("string: Escape cancels edit?", () => {
    build([{ id: 1, c: "keep" }], [col("id"), col("c", "string", { isEditable: true })]);
    openCE("c"); ce("c").type("{selectall}{backspace}changed", { force: true }).type("{esc}", { force: true });
    cy.wait(300);
    cy.document().then((doc) => R.push({ id: "esc:immediately", stillEditing: !!doc.activeElement?.closest('td[data-cy="table1-c-row-0"]'), cell: cellFacts(doc, "c"), cs: probe(doc, "cs") }));
    blurOther(); cy.wait(400);
    snap("esc:afterBlur", "c");
  });
});
