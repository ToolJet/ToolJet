// A3: Save changes / Discard changes buttons (showBulkUpdateActions), discard
// restoring the original value, changeSet cleared after save, and selectRowOnCellEdit.
import { tq, col } from "./_harness";

const probes = {
  cs: "{{JSON.stringify(components.table1.changeSet)}}",
  selRow: "{{JSON.stringify(components.table1.selectedRow)}}",
};

const editString = (cellGet, value) => {
  cellGet().find(".long-text-input").click({ force: true });
  cellGet()
    .find('[contenteditable="true"]')
    .type("{selectall}{backspace}", { force: true })
    .type(`${value}{enter}`, { force: true });
};

describe("A3 changeSet actions: Save / Discard buttons", () => {
  afterEach(() => tq.cleanup());

  it("Save/Discard buttons are absent with no pending edits, and appear once a cell is edited", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id"), col("name", "string", { isEditable: true })],
    });
    cy.get('[data-cy="table-button-save-changes"]').should("not.exist");
    cy.get('[data-cy="table-button-discard-changes"]').should("not.exist");
    editString(() => tq.cell(0, "name"), "Bob");
    cy.get('[data-cy="table-button-save-changes"]').should("exist");
    cy.get('[data-cy="table-button-discard-changes"]').should("exist");
  });

  it("Discard changes restores the original displayed value and clears changeSet", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id"), col("name", "string", { isEditable: true })],
      probes,
    });
    editString(() => tq.cell(0, "name"), "Bob");
    tq.cell(0, "name").should("have.text", "Bob");
    tq.probe("cs").should("contain.text", "Bob");
    cy.get('[data-cy="table-button-discard-changes"]').click({ force: true });
    tq.cell(0, "name").should("have.text", "Alice");
    tq.probe("cs").should("have.text", "{}");
    cy.get('[data-cy="table-button-save-changes"]').should("not.exist");
  });

  it("Save changes clears the changeSet and the Save/Discard buttons disappear", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id"), col("name", "string", { isEditable: true })],
      probes,
    });
    editString(() => tq.cell(0, "name"), "Bob");
    cy.get('[data-cy="table-button-save-changes"]').click({ force: true });
    tq.probe("cs").should("have.text", "{}");
    cy.get('[data-cy="table-button-save-changes"]').should("not.exist");
    cy.get('[data-cy="table-button-discard-changes"]').should("not.exist");
    // The edited value remains shown (Save does not re-fetch data on its own).
    tq.cell(0, "name").should("have.text", "Bob");
  });

  it("showBulkUpdateActions=false: editing a cell tracks changeSet, but no Save/Discard buttons ever render", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id"), col("name", "string", { isEditable: true })],
      props: { showBulkUpdateActions: "{{false}}" },
      probes,
    });
    editString(() => tq.cell(0, "name"), "Bob");
    tq.probe("cs").should("contain.text", "Bob");
    cy.get('[data-cy="table-button-save-changes"]').should("not.exist");
    cy.get('[data-cy="table-button-discard-changes"]').should("not.exist");
  });
});

describe("A3 selectRowOnCellEdit", () => {
  afterEach(() => tq.cleanup());

  it("default (selectRowOnCellEdit=false): clicking into an editable cell does NOT select the row", () => {
    tq.app({
      data: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
      columns: [col("id"), col("name", "string", { isEditable: true })],
      props: { defaultSelectedRow: "{{null}}" },
      probes,
    });
    tq.probe("selRow").should("have.text", "{}");
    tq.cell(0, "name").find(".long-text-input").click({ force: true });
    tq.probe("selRow").should("have.text", "{}");
  });

  it("selectRowOnCellEdit=true: clicking into an editable cell DOES select that row", () => {
    tq.app({
      data: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
      columns: [col("id"), col("name", "string", { isEditable: true })],
      props: { selectRowOnCellEdit: "{{true}}", defaultSelectedRow: "{{null}}" },
      probes,
    });
    tq.probe("selRow").should("have.text", "{}");
    tq.cell(0, "name").find(".long-text-input").click({ force: true });
    tq.probe("selRow").should("contain.text", '"name":"Alice"');
  });
});
