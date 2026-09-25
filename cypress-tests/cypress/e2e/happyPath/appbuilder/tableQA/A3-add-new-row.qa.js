// A3: Add new row popup -- fields per type, read-only/hidden columns, nested keys,
// the `newRows` exposed variable, and discard/save of new rows (incl. multiple rows).
import { tq, col } from "./_harness";

const probes = {
  newRows: "{{JSON.stringify(components.table1.newRows)}}",
};

const popupCell = (columnHeader, rowIndex = 0) =>
  cy.get(`[data-cy="${String(columnHeader).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-column-${rowIndex}"]`);

const typeIntoPopupCell = (columnHeader, rowIndex, value) => {
  popupCell(columnHeader, rowIndex).find(".long-text-input").click({ force: true });
  popupCell(columnHeader, rowIndex)
    .find('[contenteditable="true"]')
    .type("{selectall}{backspace}", { force: true })
    .type(`${value}{enter}`, { force: true });
};

const openAddNewRow = () => {
  cy.get('[data-cy="table1-add-new-row-button"]').click({ force: true });
  cy.get(".table-add-new-row").should("exist");
};

describe("A3 add new row: popup fields, exposed newRows, read-only/hidden columns", () => {
  afterEach(() => tq.cleanup());

  it("typing into the popup's blank row updates the `newRows` exposed variable live", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id", "string", { isEditable: true }), col("name", "string", { isEditable: true })],
      props: { showAddNewRowButton: "{{true}}" },
      probes,
    });
    openAddNewRow();
    typeIntoPopupCell("id", 0, "9");
    typeIntoPopupCell("name", 0, "Nina");
    tq.probe("newRows").should("contain.text", '"id":"9"').and("contain.text", '"name":"Nina"');
  });

  it("BUG CHECK (docs say Save clears newRows, same as Discard): clicking Save does NOT clear the `newRows` exposed variable", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id", "string", { isEditable: true }), col("name", "string", { isEditable: true })],
      probes,
    });
    openAddNewRow();
    typeIntoPopupCell("name", 0, "Nina");
    tq.probe("newRows").should("contain.text", "Nina");
    cy.get('[data-cy="save-button"]').click({ force: true });
    // Docs (widgets/table/properties.md, csa-and-variables.md): "When the user clicks either
    // the Save or Discard button ... this data is cleared." Verify whether Save actually clears it.
    tq.probe("newRows").should("contain.text", "Nina");
  });

  it("Discard DOES clear the `newRows` exposed variable", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id", "string", { isEditable: true }), col("name", "string", { isEditable: true })],
      probes,
    });
    openAddNewRow();
    typeIntoPopupCell("name", 0, "Nina");
    tq.probe("newRows").should("contain.text", "Nina");
    cy.get('[data-cy="discard-button"]').click({ force: true });
    tq.probe("newRows").should("have.text", "[]");
  });

  it("'Add another row' (+) button adds a second blank row, and both rows are captured in newRows", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }],
      columns: [col("id", "string", { isEditable: true }), col("name", "string", { isEditable: true })],
      probes,
    });
    openAddNewRow();
    typeIntoPopupCell("name", 0, "Row0");
    cy.get('[data-cy="add-another-row-button"]').click({ force: true });
    cy.get('[data-cy="add-new-row-1"]').should("exist");
    typeIntoPopupCell("name", 1, "Row1");
    tq.probe("newRows").should("contain.text", "Row0").and("contain.text", "Row1");
  });

  it("a column that is NOT editable in the main table IS still editable inside the Add new row popup", () => {
    tq.app({
      data: [{ id: 1, locked: "cant-touch-this" }],
      columns: [col("id", "string", { isEditable: true }), col("locked", "string", { isEditable: false })],
      probes,
    });
    // Confirm read-only in the main table body first (no editable wrapper at all).
    tq.cell(0, "locked").find(".long-text-input").should("not.exist");
    openAddNewRow();
    typeIntoPopupCell("locked", 0, "editable-here");
    tq.probe("newRows").should("contain.text", "editable-here");
  });

  it("a hidden column (columnVisibility=false) is excluded from the Add new row popup", () => {
    tq.app({
      data: [{ id: 1, secret: "s3cr3t" }],
      columns: [
        col("id", "string", { isEditable: true }),
        col("secret", "string", { isEditable: true, columnVisibility: false }),
      ],
      probes,
    });
    openAddNewRow();
    popupCell("secret", 0).should("not.exist");
  });

  it("a nested-key column (user.name) renders and is editable in the Add new row popup", () => {
    tq.app({
      data: [{ id: 1, user: { name: "Tom" } }],
      columns: [col("id", "string", { isEditable: true }), col("user.name", "string", { isEditable: true })],
      probes,
    });
    openAddNewRow();
    popupCell("user.name", 0).should("exist");
    typeIntoPopupCell("user.name", 0, "Jerry");
    tq.probe("newRows").should("contain.text", "Jerry");
  });
});
