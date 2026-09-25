// A1 Data & column generation: manage-columns menu, footer record count accuracy,
// and currentData/filteredData exposed variables matching what's actually displayed.
import { tq, col } from "./_harness";

describe("A1 manage columns + footer + exposed data", () => {
  afterEach(() => tq.cleanup());

  it("Manage columns menu can hide a column client-side without changing the footer record count", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }, { id: 2, name: "Bob" }],
      columns: [col("id"), col("name")],
    });
    cy.get('[data-cy="footer-number-of-records"]').should("contain.text", "2 Records");
    cy.get('[data-cy="table1-manage-columns-button"]').click();
    cy.get('[data-cy="dropdown-hide-column"]').should("be.visible");
    cy.get('[data-cy="option-column-name"]').click();
    cy.get("body").click(0, 0); // close popover
    tq.table().find('[data-cy$="-name-column-header"]').should("not.exist");
    tq.table().find('[data-cy$="-name-row-0"]').should("not.exist");
    // hiding a COLUMN must not affect the ROW/record count
    cy.get('[data-cy="footer-number-of-records"]').should("contain.text", "2 Records");
    tq.rows().should("have.length", 2);
  });

  it("Manage columns 'Selects All' toggles every column back and forth", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }],
      columns: [col("id"), col("name")],
    });
    cy.get('[data-cy="table1-manage-columns-button"]').click();
    cy.get('[data-cy="option-select-all-column"]').click(); // all -> hidden
    cy.get("body").click(0, 0);
    tq.table().find('[data-cy$="-column-header"]').should("have.length", 0);

    cy.get('[data-cy="table1-manage-columns-button"]').click();
    cy.get('[data-cy="option-select-all-column"]').click(); // all -> visible again
    cy.get("body").click(0, 0);
    tq.table().find('[data-cy$="-column-header"]').should("have.length", 2);
  });

  it("Footer record count matches the SEARCH-filtered row count, not the full dataset", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }, { id: 2, name: "Bob" }, { id: 3, name: "Ann Marie" }],
      columns: [col("id"), col("name")],
      props: { displaySearchBox: "{{true}}" },
    });
    cy.get('[data-cy="footer-number-of-records"]').should("contain.text", "3 Records");
    cy.get('[data-cy="table1-search-input-field"]').type("Ann");
    cy.wait(600);
    cy.get('[data-cy="footer-number-of-records"]').should("contain.text", "2 Records");
    tq.rows().should("have.length", 2);
  });

  it("currentData exposed variable equals the full raw input data (not the filtered/paginated subset)", () => {
    const data = [{ id: 1, name: "Ann" }, { id: 2, name: "Bob" }, { id: 3, name: "Cid" }];
    tq.app({
      data,
      columns: [col("id"), col("name")],
      props: { displaySearchBox: "{{true}}" },
      probes: { cur: "{{JSON.stringify(components.table1.currentData)}}" },
    });
    cy.get('[data-cy="table1-search-input-field"]').type("Ann");
    cy.wait(600);
    // even though only 1 row is now displayed, currentData should still reflect all 3 rows.
    tq.probe("cur").invoke("text").then((txt) => {
      const parsed = JSON.parse(txt);
      expect(parsed, "currentData should be the full unfiltered dataset").to.have.length(3);
    });
  });

  it("filteredData exposed variable's length equals the footer record count after a search", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }, { id: 2, name: "Bob" }, { id: 3, name: "Ann Marie" }],
      columns: [col("id"), col("name")],
      props: { displaySearchBox: "{{true}}" },
      probes: { filt: "{{JSON.stringify(components.table1.filteredData)}}" },
    });
    cy.get('[data-cy="table1-search-input-field"]').type("Ann");
    cy.wait(600);
    cy.get('[data-cy="footer-number-of-records"]').should("contain.text", "2 Records");
    tq.probe("filt").invoke("text").then((txt) => {
      const parsed = JSON.parse(txt);
      expect(parsed, "filteredData length should match the footer count of 2").to.have.length(2);
      expect(parsed.map((r) => r.name).sort()).to.deep.equal(["Ann", "Ann Marie"]);
    });
  });
});
