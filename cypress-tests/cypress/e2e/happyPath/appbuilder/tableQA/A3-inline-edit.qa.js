// A3: inline editing for string/text/number/boolean columns -- verifies the value
// shown in the cell after an edit AND the shape of changeSet/dataUpdates/updatedData,
// including number type coercion and "click-without-typing" (no phantom edit).
import { tq, col } from "./_harness";

const probes = {
  cs: "{{JSON.stringify(components.table1.changeSet)}}",
  du: "{{JSON.stringify(components.table1.dataUpdates)}}",
  ud: "{{JSON.stringify(components.table1.updatedData)}}",
};

const typeIntoLongText = (cellGet, value) => {
  cellGet().find(".long-text-input").click({ force: true });
  cellGet()
    .find('[contenteditable="true"]')
    .type("{selectall}{backspace}", { force: true })
    .type(`${value}{enter}`, { force: true });
};

describe("A3 inline editing: string/text/number/boolean", () => {
  afterEach(() => tq.cleanup());

  it("string column: edited value shows in cell and in changeSet/dataUpdates/updatedData as a string", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id"), col("name", "string", { isEditable: true })],
      probes,
    });
    typeIntoLongText(() => tq.cell(0, "name"), "Bob");
    tq.cell(0, "name").should("have.text", "Bob");
    tq.probe("cs").should("contain.text", '"name":"Bob"');
    tq.probe("du").should("contain.text", '"name":"Bob"');
    tq.probe("ud").should("contain.text", '"name":"Bob"');
  });

  it("text column: same edit contract as string", () => {
    tq.app({
      data: [{ id: 1, bio: "old bio" }],
      columns: [col("id"), col("bio", "text", { isEditable: true })],
      probes,
    });
    typeIntoLongText(() => tq.cell(0, "bio"), "new bio");
    tq.cell(0, "bio").should("have.text", "new bio");
    tq.probe("cs").should("contain.text", '"bio":"new bio"');
  });

  it("string column: clicking into a cell and clicking away WITHOUT typing does not create a changeSet entry, and does not corrupt raw HTML-looking or entity-looking text", () => {
    tq.app({
      data: [{ id: 1, a: "<b>x</b>", b: "Tom &amp; Jerry" }],
      columns: [col("id"), col("a", "string", { isEditable: true }), col("b", "string", { isEditable: true })],
      probes,
    });
    tq.cell(0, "a").should("have.text", "<b>x</b>");
    tq.cell(0, "b").should("have.text", "Tom &amp; Jerry");
    // Click into "a" to flip it into edit mode, then click elsewhere without typing.
    tq.cell(0, "a").find(".long-text-input").click({ force: true });
    tq.cell(0, "a").find('[contenteditable="true"]').should("exist").blur();
    cy.forceClickOnCanvas();
    tq.cell(0, "a").should("have.text", "<b>x</b>");
    tq.probe("cs").should("have.text", "{}");
  });

  it("number column: typed digit-string commits as a real number in changeSet (type coercion)", () => {
    tq.app({
      data: [{ id: 1, qty: "5" }],
      columns: [col("id"), col("qty", "number", { isEditable: true })],
      probes: { ...probes, t: "{{typeof components.table1.changeSet[0]?.qty}}" },
    });
    tq.cell(0, "qty").find("input").click({ force: true }).type("{selectall}{backspace}42{enter}");
    tq.cell(0, "qty").find("input").should("have.value", "42");
    tq.probe("cs").should("contain.text", '"qty":42');
    tq.probe("t").should("have.text", "number");
  });

  it("number column: up/down stepper arrows produce a number in changeSet, not a string", () => {
    tq.app({
      data: [{ id: 1, qty: 5 }],
      columns: [col("id"), col("qty", "number", { isEditable: true })],
      probes: { ...probes, t: "{{typeof components.table1.changeSet[0]?.qty}}" },
    });
    tq.cell(0, "qty").find(".numberinput-up-arrow-table").click({ force: true });
    tq.cell(0, "qty").find("input").should("have.value", "6");
    tq.probe("cs").should("contain.text", '"qty":6');
    tq.probe("t").should("have.text", "number");
  });

  it("boolean column: toggling the checkbox flips the value and changeSet holds a boolean", () => {
    tq.app({
      data: [{ id: 1, active: false }],
      columns: [col("id"), col("active", "boolean", { isEditable: true })],
      probes,
    });
    tq.cell(0, "active").find('input[type="checkbox"]').should("not.be.checked").click({ force: true });
    tq.cell(0, "active").find('input[type="checkbox"]').should("be.checked");
    tq.probe("cs").should("contain.text", '"active":true');
  });
});
