import { tq, col } from "./_harness";
// No default preselected row (the drag-in default {"id":1} makes a first click deselect row 0).
const app = (o = {}) => tq.app({ ...o, props: { defaultSelectedRow: "{{undefined}}", ...(o.props || {}) } });

// A5 priority probe: the shared dev environment is currently only reliable for the
// FIRST app() in a spec run (subsequent cy.visit() calls intermittently redirect
// to /error/invalid-link with a "Cannot read properties of undefined (reading
// 'versionName')" crash — a pre-existing environment/app-load issue, not caused by
// this spec; confirmed identical on sibling agents' unrelated specs too). Ordered by
// priority so whichever ones get a real browser turn are the most valuable.
before(() => {
  Cypress.config("requestTimeout", 45000);
  Cypress.config("responseTimeout", 45000);
});

const genRows = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));

describe("A5 priority 1: rowsPerPage=0 must not silently blank a non-empty table", () => {
  afterEach(() => tq.cleanup());
  it("rowsPerPage=0 on 10 rows", () => {
    app({
      data: genRows(10),
      columns: [col("id", "number")],
      props: { rowsPerPage: 0, enablePagination: true },
    });
    tq.rows().its("length").then((n) => {
      cy.log(`rows rendered with rowsPerPage=0: ${n}`);
      expect(n, "row count with rowsPerPage=0 (data is non-empty)").to.be.greaterThan(0);
    });
  });
});

describe("A5 priority 2: selection persistence across sort (index-based row selection)", () => {
  afterEach(() => tq.cleanup());
  it("selecting Charlie (index 0), then sorting, should keep CHARLIE selected, not whichever record lands at index 0", () => {
    const people = [
      { id: 1, name: "Charlie" },
      { id: 2, name: "Alice" },
      { id: 3, name: "Bob" },
    ];
    app({
      data: people,
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: true, highlightSelectedRow: true },
      probes: { sr: "{{JSON.stringify(components.table1.selectedRow)}}" },
    });
    tq.cell(0, "name").click({ force: true });
    tq.probe("sr").should("contain.text", "Charlie");
    cy.get('[data-cy="name-column-header"]').click({ force: true });
    cy.wait(400);
    tq.probe("sr").then(($el) => {
      const txt = $el.text().trim();
      cy.log(`selectedRow after sorting (was Charlie @ index 0 before sort): ${txt}`);
      expect(txt, "selectedRow should still identify Charlie, not the row now sitting at index 0").to.contain(
        "Charlie"
      );
    });
  });
});

describe("A5 priority 3: allowSelection=false must not leave the row checkbox interactive", () => {
  afterEach(() => tq.cleanup());
  it("clicking the checkbox with allowSelection=false", () => {
    app({
      data: [{ id: 1, name: "Charlie" }],
      columns: [col("id", "number"), col("name")],
      props: { allowSelection: false },
    });
    cy.get('td[data-cy="table1-selection-row-0"] input[data-cy="checkbox-input"]').click({ force: true });
    cy.wait(200);
    cy.get('td[data-cy="table1-selection-row-0"] input[data-cy="checkbox-input"]').then(($cb) => {
      cy.log(`checkbox checked after click with allowSelection=false: ${$cb.is(":checked")}`);
      expect($cb.is(":checked"), "checkbox should stay unchecked when selection is disallowed").to.eq(false);
    });
  });
});

describe("A5 priority 4: enablePagination=false should still show a footer record count", () => {
  afterEach(() => tq.cleanup());
  it("footer with pagination off", () => {
    app({
      data: genRows(15),
      columns: [col("id", "number")],
      props: { rowsPerPage: 5, enablePagination: false },
    });
    cy.get('[data-cy="footer-number-of-records"]').should("be.visible").and("contain.text", "15");
  });
});

describe("A5 priority 5: setPage(0) via CSA should not push pageIndex below 1", () => {
  afterEach(() => tq.cleanup());
  it("setPage(0) on an 11-row, 3-page table", () => {
    app({
      data: genRows(11),
      columns: [col("id", "number")],
      props: { rowsPerPage: 5, enablePagination: true },
      probes: { pi: "{{[components.table1.setPage(0), components.table1.pageIndex][1]}}" },
    });
    cy.wait(400);
    tq.probe("pi").then(($el) => {
      const val = $el.text().trim();
      cy.log(`pageIndex after setPage(0): "${val}"`);
      expect(Number(val), "pageIndex after setPage(0) should clamp to the first valid page (1)").to.eq(1);
    });
  });
});
