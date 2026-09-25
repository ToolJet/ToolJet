import { tq, col } from "./_harness";

// Under heavy shared-environment load, cy.wait('@getAppData') inside the shared
// openApp command can exceed the default 10s requestTimeout. Bump it spec-locally.
before(() => {
  Cypress.config("requestTimeout", 45000);
  Cypress.config("responseTimeout", 45000);
});

// A5: enableExpandableRows + expansionHeight.

const rows = [
  { id: 1, name: "Charlie" },
  { id: 2, name: "Alice" },
  { id: 3, name: "Bob" },
];

const expandBtn = (rowIdx) => cy.get(`td[data-cy="table1-expansion-row-${rowIdx}"] button`);
const expandedContent = () => cy.get(".table-expanded-row-content");

describe("A5 expandable rows: enableExpandableRows toggle", () => {
  afterEach(() => tq.cleanup());

  it("enableExpandableRows=false: no expansion toggle column is rendered", () => {
    tq.app({
      data: rows,
      columns: [col("id", "number"), col("name")],
      props: { enableExpandableRows: false },
    });
    cy.get('td[data-cy="table1-expansion-row-0"]').should("not.exist");
  });

  it("enableExpandableRows=true: clicking the toggle expands the row, clicking again collapses it", () => {
    tq.app({
      data: rows,
      columns: [col("id", "number"), col("name")],
      props: { enableExpandableRows: true },
    });
    expandedContent().should("not.exist");
    expandBtn(0).click({ force: true });
    expandedContent().should("have.length", 1);
    expandBtn(0).click({ force: true });
    expandedContent().should("not.exist");
  });

  it("multiple rows can be expanded at the same time", () => {
    tq.app({
      data: rows,
      columns: [col("id", "number"), col("name")],
      props: { enableExpandableRows: true },
    });
    expandBtn(0).click({ force: true });
    expandBtn(2).click({ force: true });
    expandedContent().should("have.length", 2);
  });
});

describe("A5 expandable rows: expansionHeight", () => {
  afterEach(() => tq.cleanup());

  it("expansionHeight controls the expanded container's rendered height", () => {
    tq.app({
      data: rows,
      columns: [col("id", "number"), col("name")],
      props: { enableExpandableRows: true, expansionHeight: 350 },
    });
    expandBtn(0).click({ force: true });
    expandedContent().should(($el) => {
      expect($el.css("height")).to.eq("350px");
    });
  });

  it("default expansionHeight (229) is applied when not overridden", () => {
    tq.app({
      data: rows,
      columns: [col("id", "number"), col("name")],
      props: { enableExpandableRows: true },
    });
    expandBtn(0).click({ force: true });
    expandedContent().should(($el) => {
      expect($el.css("height")).to.eq("229px");
    });
  });
});

describe("A5 expandable rows: interaction with pagination/sort/search", () => {
  afterEach(() => tq.cleanup());

  it("expanding a row, then changing page, auto-collapses all expanded rows (state is cleared, not just off-screen)", () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ id: i + 1, name: `n${i + 1}` }));
    tq.app({
      data: many,
      columns: [col("id", "number"), col("name")],
      props: { enableExpandableRows: true, rowsPerPage: 5, enablePagination: true },
    });
    expandBtn(0).click({ force: true });
    expandedContent().should("have.length", 1);
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    cy.wait(300);
    expandedContent().should("not.exist");
    cy.get('[data-cy="pagination-button-to-previous"]').click({ force: true });
    cy.wait(300);
    // Back on page 1 where row 0 was expanded — if the expansion STATE was really
    // cleared (not just off-screen while on page 2), it should stay collapsed here.
    expandedContent().should("not.exist");
  });

  it("expanding a row, then sorting, auto-collapses all expanded rows", () => {
    tq.app({
      data: rows,
      columns: [col("id", "number"), col("name")],
      props: { enableExpandableRows: true },
    });
    expandBtn(0).click({ force: true });
    expandedContent().should("have.length", 1);
    cy.get('[data-cy="name-column-header"]').click({ force: true });
    cy.wait(300);
    expandedContent().should("not.exist");
  });
});
