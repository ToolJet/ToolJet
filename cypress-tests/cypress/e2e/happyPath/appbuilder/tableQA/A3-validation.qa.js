// A3: per-column validation (regex, min/max length, min/max value, custom rule) --
// verifies the invalid-cell visuals (is-invalid + .invalid-feedback text) and whether
// Save changes remains possible with an invalid value in the changeSet.
import { tq, col } from "./_harness";

const probes = {
  cs: "{{JSON.stringify(components.table1.changeSet)}}",
};

const editString = (cellGet, value) => {
  cellGet().find(".long-text-input").click({ force: true });
  cellGet()
    .find('[contenteditable="true"]')
    .type("{selectall}{backspace}", { force: true })
    .type(`${value}{enter}`, { force: true });
};

describe("A3 validation: string/text minLength/maxLength/regex/customRule", () => {
  afterEach(() => tq.cleanup());

  it("string column: value shorter than minLength is flagged invalid with the expected message", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id"), col("name", "string", { isEditable: true, minLength: 3 })],
      probes,
    });
    editString(() => tq.cell(0, "name"), "ab");
    tq.cell(0, "name").find(".long-text-input, [contenteditable]").should("have.class", "is-invalid");
    tq.cell(0, "name").find(".invalid-feedback").should("have.text", "Minimum 3 characters is needed");
  });

  it("string column: value longer than maxLength is flagged invalid", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id"), col("name", "string", { isEditable: true, maxLength: 4 })],
      probes,
    });
    editString(() => tq.cell(0, "name"), "abcdef");
    tq.cell(0, "name").find(".invalid-feedback").should("have.text", "Maximum 4 characters is allowed");
  });

  it("string column: regex mismatch is flagged invalid ('The input should match pattern')", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id"), col("name", "string", { isEditable: true, regex: "^[0-9]+$" })],
      probes,
    });
    editString(() => tq.cell(0, "name"), "abc");
    tq.cell(0, "name").find(".invalid-feedback").should("have.text", "The input should match pattern");
  });

  it("BUG CHECK: a customRule written as a plain boolean expression (the inspector's own placeholder example) never marks the cell invalid, only a non-empty STRING result does", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      // Placeholder in the inspector's Custom rule field is literally "eg. {{ 1 < 2 }}" -- a boolean.
      columns: [col("id"), col("name", "string", { isEditable: true, customRule: "{{false}}" })],
      probes,
    });
    editString(() => tq.cell(0, "name"), "anything");
    // If customRule boolean were honoured, `false` should mean invalid. Confirm actual behaviour:
    tq.cell(0, "name").find(".invalid-feedback").should("not.exist");
  });

  it("customRule returning a non-empty string DOES mark the cell invalid, using that string as the message", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id"), col("name", "string", { isEditable: true, customRule: "{{'always invalid'}}" })],
      probes,
    });
    editString(() => tq.cell(0, "name"), "anything");
    tq.cell(0, "name").find(".invalid-feedback").should("have.text", "always invalid");
  });

  it("Save changes is still possible (not blocked) even while a cell shows the invalid state", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id"), col("name", "string", { isEditable: true, minLength: 10 })],
      probes,
    });
    editString(() => tq.cell(0, "name"), "short");
    tq.cell(0, "name").find(".invalid-feedback").should("exist");
    cy.get('[data-cy="table-button-save-changes"]').should("exist").and("not.be.disabled").click({ force: true });
    tq.probe("cs").should("have.text", "{}");
  });
});

describe("A3 validation: number minValue/maxValue/regex", () => {
  afterEach(() => tq.cleanup());

  it("number column: value below minValue is flagged invalid", () => {
    tq.app({
      data: [{ id: 1, qty: 5 }],
      columns: [col("id"), col("qty", "number", { isEditable: true, minValue: 10 })],
      probes,
    });
    tq.cell(0, "qty").find("input").click({ force: true }).type("{selectall}{backspace}3{enter}");
    tq.cell(0, "qty").find("input").should("have.class", "is-invalid");
    tq.cell(0, "qty").find(".invalid-feedback").should("have.text", "Minimum value is 10");
  });

  it("number column: value above maxValue is flagged invalid", () => {
    tq.app({
      data: [{ id: 1, qty: 5 }],
      columns: [col("id"), col("qty", "number", { isEditable: true, maxValue: 10 })],
      probes,
    });
    tq.cell(0, "qty").find("input").click({ force: true }).type("{selectall}{backspace}99{enter}");
    tq.cell(0, "qty").find(".invalid-feedback").should("have.text", "Maximum value is 10");
  });
});

describe("A3 validation: datepicker minDate/maxDate boundary", () => {
  afterEach(() => tq.cleanup());

  it("BUG CHECK: a date exactly equal to minDate is incorrectly rejected as invalid (should be a valid boundary value)", () => {
    tq.app({
      data: [{ id: 1, dt: "10/01/2024" }],
      columns: [
        col("id"),
        col("dt", "datepicker", {
          isEditable: true,
          dateFormat: "MM/DD/YYYY",
          parseDateFormat: "MM/DD/YYYY",
          minDate: "10/01/2024",
        }),
      ],
      probes,
    });
    // No edit needed: the existing value already equals minDate exactly.
    tq.cell(0, "dt").find(".invalid-feedback, .is-invalid").should("exist");
  });
});

describe("A3 validation: Table columns have no Mandatory/required option", () => {
  afterEach(() => tq.cleanup());

  it("DOCS GAP CHECK: setting column.mandatory=true on a blank string cell does not mark it invalid (Table's per-column validation UI has no Mandatory field and adapters never forward it)", () => {
    tq.app({
      data: [{ id: 1, name: "" }],
      columns: [col("id"), col("name", "string", { isEditable: true, mandatory: true })],
      probes,
    });
    tq.cell(0, "name").find(".invalid-feedback").should("not.exist");
  });
});
