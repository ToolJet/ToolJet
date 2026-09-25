// Inspector: which fields each column type shows (Properties/Styles, editable off/on), conflicting config warnings.
// Viewer: preview-mode behaviour for hidden table / hidden column / editing / events. Observe-only -> logs/v12b-results.json
import { tq, col, OPTS, PROBES, recorder, cellFacts, probe } from "./_obs";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";

const R = recorder("v12b-results.json");
const TYPES = ["string", "number", "text", "datepicker", "select", "newMultiSelect", "tagsV2", "boolean", "image", "link", "json", "markdown", "html", "rating", "button"];
const popText = (doc) => {
  const pop = doc.querySelector(".table-column-popover.popover-body");
  if (!pop) return null;
  return [...new Set(pop.innerText.split("\n").map((t) => t.trim()).filter((t) => t && t.length < 40))];
};

describe("V12 inspector fields and viewer mode", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  TYPES.forEach((type) =>
    it(`inspector fields: ${type}`, () => {
      tq.app({ data: [{ c: null }], columns: [col("c", type, { options: OPTS, buttons: [{ id: "b1", buttonLabel: "Go" }] })], props: { defaultSelectedRow: "{{undefined}}" } });
      openEditorSidebar("table1");
      cy.get('[data-cy="column-c"]', { timeout: 10000 }).first().click({ force: true });
      cy.wait(700);
      cy.document().then((doc) => R.push({ id: `inspector:${type}:properties(editable off)`, labels: popText(doc) }));
      // turn on Make editable if present
      cy.get("body").then(($b) => {
        const t = $b.find(".column-popover-card-ui").filter((i, e) => e.innerText.includes("Make editable")).find("input[type=checkbox]").first();
        if (t.length) cy.wrap(t).click({ force: true });
      });
      cy.wait(500);
      cy.document().then((doc) => R.push({ id: `inspector:${type}:properties(editable on)`, labels: popText(doc) }));
      cy.get("body").then(($b) => {
        const st = $b.find(".table-column-popover .popover-header *").filter((i, e) => e.children.length === 0 && e.innerText.trim() === "Styles").first();
        if (st.length) cy.wrap(st).click({ force: true });
      });
      cy.wait(500);
      cy.document().then((doc) => R.push({ id: `inspector:${type}:styles`, labels: popText(doc) }));
    })
  );

  it("conflicting config: min length > max length, min value > max value (inspector warning?)", () => {
    tq.app({ data: [{ s: "abc", n: 5 }], columns: [col("s", "string", { isEditable: true, minLength: 5, maxLength: 2 }), col("n", "number", { isEditable: true, minValue: 10, maxValue: 5 })], props: { defaultSelectedRow: "{{undefined}}" } });
    openEditorSidebar("table1");
    ["s", "n"].forEach((c) => {
      cy.get(`[data-cy="column-${c}"]`).first().click({ force: true });
      cy.wait(600);
      cy.document().then((doc) => {
        const pop = doc.querySelector(".table-column-popover.popover-body");
        R.push({ id: `conflict:${c}`, warnings: pop ? [...pop.querySelectorAll('[class*="error"], [class*="warning"], [class*="invalid"], .text-danger')].map((e) => e.innerText.trim()).filter(Boolean) : "no popover" });
      });
      cy.get("body").type("{esc}");
    });
  });
});
