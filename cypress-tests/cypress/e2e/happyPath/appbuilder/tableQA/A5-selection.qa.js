import { tq, col } from "./_harness";
// No default preselected row (the drag-in default {"id":1} makes a first click deselect row 0).
const app = (o = {}) => tq.app({ ...o, props: { defaultSelectedRow: "{{undefined}}", ...(o.props || {}) } });

// Under heavy shared-environment load, cy.wait('@getAppData') inside the shared
// openApp command can exceed the default 10s requestTimeout. Bump it spec-locally.
before(() => {
  Cypress.config("requestTimeout", 45000);
  Cypress.config("responseTimeout", 45000);
});

// A5: Selection matrix — allowSelection, showBulkSelector, highlightSelectedRow,
// defaultSelectedRow, disableRowDeselection, row click vs checkbox click, and
// selection persistence across sort/search/pagination.

const people = [
  { id: 1, name: "Charlie" },
  { id: 2, name: "Alice" },
  { id: 3, name: "Bob" },
  { id: 4, name: "Dave" },
  { id: 5, name: "Eve" },
];

const rowCheckbox = (rowIdx) =>
  cy.get(`td[data-cy="table1-selection-row-${rowIdx}"] input[data-cy="checkbox-input"]`);
const headerCheckbox = () => cy.get('thead input[data-cy="checkbox-input"]');

describe("A5 selection: allowSelection on/off", () => {
  afterEach(() => tq.cleanup());

  it("allowSelection=false: the row checkbox should not be an interactive selector", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: false },
    });
    rowCheckbox(0).click({ force: true });
    cy.wait(200);
    rowCheckbox(0).then(($cb) => {
      cy.log(`checkbox checked after click with allowSelection=false: ${$cb.is(":checked")}`);
      expect($cb.is(":checked"), "checkbox should stay unchecked when selection is disallowed").to.eq(false);
    });
  });

  it("allowSelection=true, showBulkSelector=false (default): row click selects, and is single-select", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, showBulkSelector: false },
      probes: {
        sr: "{{JSON.stringify(components.table1.selectedRow)}}",
      },
    });
    tq.cell(0, "name").click({ force: true });
    tq.probe("sr").should("contain.text", "Charlie");
    tq.cell(1, "name").click({ force: true });
    tq.probe("sr").should("contain.text", "Alice");
    tq.probe("sr").should("not.contain.text", "Charlie");
    // single-select: only row 1 should show selected checkbox now
    rowCheckbox(1).should("be.checked");
    rowCheckbox(0).should("not.be.checked");
  });
});

describe("A5 selection: showBulkSelector (multi-select + select-all scope)", () => {
  afterEach(() => tq.cleanup());

  it("showBulkSelector=true: clicking multiple rows keeps all of them selected", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, showBulkSelector: true },
    });
    tq.cell(0, "name").click({ force: true });
    tq.cell(2, "name").click({ force: true });
    rowCheckbox(0).should("be.checked");
    rowCheckbox(2).should("be.checked");
    rowCheckbox(1).should("not.be.checked");
  });

  it("header checkbox selects all rows on the CURRENT PAGE only (not all pages)", () => {
    app({
      data: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `n${i + 1}` })),
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, showBulkSelector: true, rowsPerPage: 5, enablePagination: true },
      probes: { sr: "{{components.table1.selectedRows.length}}" },
    });
    headerCheckbox().click({ force: true });
    tq.probe("sr").should("contain.text", "5");
  });

  it("selectAllRows CSA selects across ALL pages, not just the current page", () => {
    app({
      data: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `n${i + 1}` })),
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, showBulkSelector: true, rowsPerPage: 5, enablePagination: true },
      probes: { sr: "{{[components.table1.selectAllRows(), components.table1.selectedRows.length][1]}}" },
    });
    tq.probe("sr").should("contain.text", "10");
  });

  it("selectAllRows CSA with a search filter active should only select the FILTERED (visible) rows", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: i < 3 ? `match${i}` : `other${i}` }));
    app({
      data: rows,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, showBulkSelector: true },
      probes: {
        sr: "{{[components.table1.searchText, components.table1.selectAllRows(), components.table1.selectedRows.length][2]}}",
      },
    });
    cy.get('[data-cy="table1-search-input-field"]').type("match");
    cy.wait(400);
    tq.probe("sr").then(($el) => {
      const val = $el.text().trim();
      cy.log(`selectedRows.length after selectAllRows() with search filter "match" active: ${val}`);
      expect(Number(val), "select-all should respect the active search filter and only select the 3 matches").to.eq(3);
    });
  });
});

describe("A5 selection: highlightSelectedRow", () => {
  afterEach(() => tq.cleanup());

  it("highlightSelectedRow=true adds the 'selected' class to the clicked row", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, highlightSelectedRow: true },
    });
    tq.cell(0, "name").click({ force: true });
    cy.get('[data-cy="table1-row-0"]').should("have.class", "selected");
  });

  it("highlightSelectedRow=false: selecting a row must not add the 'selected' highlight class", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, highlightSelectedRow: false },
    });
    tq.cell(0, "name").click({ force: true });
    cy.get('[data-cy="table1-row-0"]').should("not.have.class", "selected");
  });
});

describe("A5 selection: defaultSelectedRow", () => {
  afterEach(() => tq.cleanup());

  it("defaultSelectedRow with a valid id pre-selects that row on load", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, defaultSelectedRow: "{{{id: 3}}}" },
      probes: { sr: "{{JSON.stringify(components.table1.selectedRow)}}" },
    });
    tq.probe("sr").should("contain.text", "Bob");
    rowCheckbox(2).should("be.checked");
  });

  it("defaultSelectedRow with a non-existent id selects nothing (selectedRow/{}, selectedRowId/null)", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, defaultSelectedRow: "{{{id: 999}}}" },
      probes: {
        sr: "{{JSON.stringify(components.table1.selectedRow)}}",
        srid: "{{String(components.table1.selectedRowId)}}",
      },
    });
    tq.probe("sr").should("have.text", "{}");
    tq.probe("srid").should("have.text", "null");
  });

  it("defaultSelectedRow with multiple keys only honours the FIRST key (rest ignored)", () => {
    // { id: 999, name: 'Alice' } — id doesn't match any row but name does. Per source
    // (TableExposedVariables.jsx: `Object.keys(defaultSelectedRow)[0]`), only the
    // first key is ever used, so this should behave like the "non-existent" case,
    // NOT match Alice via the second key.
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, defaultSelectedRow: "{{{id: 999, name: 'Alice'}}}" },
      probes: { sr: "{{JSON.stringify(components.table1.selectedRow)}}" },
    });
    cy.wait(400);
    tq.probe("sr").should("have.text", "{}");
  });
});

describe("A5 selection: disableRowDeselection", () => {
  afterEach(() => tq.cleanup());

  it("disableRowDeselection=true blocks deselection via ROW click", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, disableRowDeselection: true },
    });
    tq.cell(0, "name").click({ force: true });
    rowCheckbox(0).should("be.checked");
    tq.cell(0, "name").click({ force: true }); // second click on the same row
    rowCheckbox(0).should("be.checked"); // should STILL be selected
  });

  it("disableRowDeselection=false (default) allows a second row click to deselect", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, disableRowDeselection: false },
    });
    tq.cell(0, "name").click({ force: true });
    rowCheckbox(0).should("be.checked");
    tq.cell(0, "name").click({ force: true });
    rowCheckbox(0).should("not.be.checked");
  });

  it("disableRowDeselection=true: clicking the CHECKBOX directly should ALSO be blocked from deselecting, same as a row click", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, disableRowDeselection: true },
    });
    tq.cell(0, "name").click({ force: true });
    rowCheckbox(0).should("be.checked");
    rowCheckbox(0).click({ force: true });
    cy.wait(200);
    rowCheckbox(0).should(
      "be.checked",
      "disableRowDeselection should be honoured consistently regardless of whether the user clicks the row or its checkbox"
    );
  });
});

describe("A5 selection: row click vs checkbox click -> exposed variables", () => {
  afterEach(() => tq.cleanup());

  it("clicking the row body sets selectedRow/selectedRowId and fires onRowClicked", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true },
      probes: {
        sr: "{{JSON.stringify(components.table1.selectedRow)}}",
        srid: "{{String(components.table1.selectedRowId)}}",
      },
    });
    tq.cell(1, "name").click({ force: true });
    tq.probe("sr").should("contain.text", "Alice");
    tq.probe("srid").should("have.text", "1"); // documented as the row's array index
  });

  it("clicking the checkbox also sets selectedRow/selectedRowId consistently", () => {
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true },
      probes: {
        sr: "{{JSON.stringify(components.table1.selectedRow)}}",
      },
    });
    rowCheckbox(2).click({ force: true });
    cy.wait(200);
    tq.probe("sr").should("contain.text", "Bob");
  });
});

describe("A5 selection: persistence across sort/search (index-based selection state)", () => {
  afterEach(() => tq.cleanup());

  it("selecting a row, then sorting: does the SAME RECORD stay selected, or does selection stick to the row's old position?", () => {
    app({
      data: people, // Charlie, Alice, Bob, Dave, Eve (unsorted)
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, highlightSelectedRow: true },
      probes: { sr: "{{JSON.stringify(components.table1.selectedRow)}}" },
    });
    tq.cell(0, "name").click({ force: true }); // selects Charlie, at index 0
    tq.probe("sr").should("contain.text", "Charlie");
    cy.get('[data-cy="name-column-header"]').click({ force: true }); // sort ascending by name
    cy.wait(400);
    // After ascending sort, "Alice" is now at index 0 where "Charlie" used to be.
    tq.probe("sr").then(($el) => {
      const txt = $el.text().trim();
      cy.log(`selectedRow after sorting (was Charlie @ index 0 before sort): ${txt}`);
      expect(txt, "selectedRow should still identify Charlie, the record the user actually selected").to.contain(
        "Charlie"
      );
    });
  });
});
