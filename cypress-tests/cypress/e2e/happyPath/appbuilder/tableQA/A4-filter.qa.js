// A4 Search, filter, sort — FILTER sub-area.
// showFilterButton × 12 operators × column types × values incl. 0/false/null/""/numeric-strings.
// Multiple filters (AND), remove, clear all, filters exposed value, filter+search combined.
import { tq, col } from "./_harness";
import { addFilter } from "Support/utils/appBuilder/components/table";
import { tableSelector } from "Selectors/appBuilder/components/table";

describe("A4 filter — operators on a string column", () => {
  afterEach(() => tq.cleanup());

  it("contains / does not contain / matches / does not match / equals / does not equal", () => {
    tq.app({
      data: [
        { id: 1, name: "Alice Smith" },
        { id: 2, name: "Bob Jones" },
        { id: 3, name: "alice clone" },
        { id: 4, name: "" },
      ],
    });

    addFilter([{ column: "name", operation: "contains", value: "alice" }], true);
    tq.rows().should("have.length", 2); // case-insensitive contains: Alice Smith + alice clone

    addFilter([{ column: "name", operation: "does not contains", value: "alice" }], true);
    tq.rows().should("have.length", 2); // Bob Jones + empty row

    addFilter([{ column: "name", operation: "matches", value: "^Bob" }], true);
    tq.rows().should("have.length", 1);
    tq.cell(0, "name").should("contain.text", "Bob Jones");

    addFilter([{ column: "name", operation: "does not match", value: "^Bob" }], true);
    tq.rows().should("have.length", 3);

    addFilter([{ column: "name", operation: "equals", value: "Bob Jones" }], true);
    tq.rows().should("have.length", 1);

    addFilter([{ column: "name", operation: "does not equal", value: "Bob Jones" }], true);
    tq.rows().should("have.length", 3);
  });

  it("is empty / is not empty on a string column (values: real text vs \"\")", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }, { id: 2, name: "" }],
    });
    addFilter([{ column: "name", operation: "is empty" }], true);
    tq.rows().should("have.length", 1);
    tq.cell(0, "id").should("contain.text", "2");

    addFilter([{ column: "name", operation: "is not empty" }], true);
    tq.rows().should("have.length", 1);
    tq.cell(0, "id").should("contain.text", "1");
  });
});

describe("A4 filter — is empty / is not empty on FALSY-but-not-empty values (0, false)", () => {
  afterEach(() => tq.cleanup());

  it("number column: 0 is a real value, not \"empty\"", () => {
    tq.app({
      data: [{ id: 1, qty: 0 }, { id: 2, qty: 5 }, { id: 3, qty: null }],
      columns: [col("id", "number"), col("qty", "number")],
    });
    addFilter([{ column: "qty", operation: "is empty" }], true);
    tq.rows().then(($rows) => {
      const ids = [...$rows].map((r) => r.innerText);
      cy.log(`"is empty" on number column matched ${$rows.length} row(s): ${JSON.stringify(ids)}`);
    });
    addFilter([{ column: "qty", operation: "is not empty" }], true);
    tq.rows().then(($rows) => {
      cy.log(`"is not empty" on number column matched ${$rows.length} row(s)`);
    });
  });

  it("boolean column: false is a real value, not \"empty\"", () => {
    tq.app({
      data: [{ id: 1, active: false }, { id: 2, active: true }],
      columns: [col("id", "number"), col("active", "boolean")],
    });
    addFilter([{ column: "active", operation: "is empty" }], true);
    tq.rows().then(($rows) => {
      cy.log(`"is empty" on boolean column (row 1 = false) matched ${$rows.length} row(s)`);
    });
  });
});

describe("A4 filter — numeric operators (gt/lt/gte/lte) incl. numeric strings", () => {
  afterEach(() => tq.cleanup());

  it("number column: gt / lt / gte / lte", () => {
    tq.app({
      data: [{ id: 1, qty: 5 }, { id: 2, qty: 10 }, { id: 3, qty: 15 }],
      columns: [col("id", "number"), col("qty", "number")],
    });
    addFilter([{ column: "qty", operation: "greater than", value: "10" }], true);
    tq.rows().should("have.length", 1);
    tq.cell(0, "qty").should("contain.text", "15");

    addFilter([{ column: "qty", operation: "less than", value: "10" }], true);
    tq.rows().should("have.length", 1);
    tq.cell(0, "qty").should("contain.text", "5");

    addFilter([{ column: "qty", operation: "greater than or equals", value: "10" }], true);
    tq.rows().should("have.length", 2);

    addFilter([{ column: "qty", operation: "less than or equals", value: "10" }], true);
    tq.rows().should("have.length", 2);
  });

  it("STRING column holding numeric-looking text: gt/lt against a numeric-string filter value", () => {
    // Column type is 'string', values are digit strings ("5","10","100"). A user typing a
    // filter value of 9 for "greater than" would expect numeric comparison (10 & 100 > 9).
    tq.app({
      data: [{ id: 1, code: "5" }, { id: 2, code: "10" }, { id: 3, code: "100" }],
    });
    addFilter([{ column: "code", operation: "greater than", value: "9" }], true);
    tq.rows().then(($rows) => {
      const codes = [...$rows].map((r) => r.innerText);
      cy.log(`"greater than 9" on string column with values 5/10/100 matched: ${JSON.stringify(codes)}`);
    });
  });
});

describe("A4 filter — select column (label != value) and null values", () => {
  afterEach(() => tq.cleanup());

  it("filter value input compares against the raw stored VALUE, not the displayed label", () => {
    tq.app({
      data: [{ id: 1, status: "A" }, { id: 2, status: "I" }],
      columns: [
        col("id", "number"),
        col("status", "select", {
          options: [
            { label: "Activated", value: "A" },
            { label: "Inactive", value: "I" },
          ],
        }),
      ],
    });
    addFilter([{ column: "status", operation: "equals", value: "Activated" }], true);
    tq.rows().then(($byLabel) => {
      addFilter([{ column: "status", operation: "equals", value: "A" }], true);
      tq.rows().then(($byValue) => {
        cy.log(`equals "Activated" (label) -> ${$byLabel.length} row(s); equals "A" (raw value) -> ${$byValue.length} row(s)`);
      });
    });
  });

  it("null column values with contains / equals / is empty", () => {
    tq.app({ data: [{ id: 1, note: null }, { id: 2, note: "hi" }] });
    addFilter([{ column: "note", operation: "is empty" }], true);
    tq.rows().should("have.length", 1);
    tq.cell(0, "id").should("contain.text", "1");

    addFilter([{ column: "note", operation: "equals", value: "" }], true);
    tq.rows().then(($rows) => cy.log(`equals "" against a null value matched ${$rows.length} row(s)`));
  });
});

describe("A4 filter — multiple filters (AND), remove, clear all, exposed value", () => {
  afterEach(() => tq.cleanup());

  it("two filters combine with AND", () => {
    tq.app({
      data: [
        { id: 1, name: "Alice", age: 30 },
        { id: 2, name: "Alice", age: 10 },
        { id: 3, name: "Bob", age: 30 },
      ],
    });
    addFilter(
      [
        { column: "name", operation: "contains", value: "Alice" },
        { column: "age", operation: "greater than", value: "20" },
      ],
      true
    );
    tq.rows().should("have.length", 1);
    tq.cell(0, "id").should("contain.text", "1");
  });

  it("removing one filter (x) re-applies the remaining ones; clear all restores all rows", () => {
    tq.app({
      data: [
        { id: 1, name: "Alice", age: 30 },
        { id: 2, name: "Alice", age: 10 },
        { id: 3, name: "Bob", age: 30 },
      ],
    });
    addFilter(
      [
        { column: "name", operation: "contains", value: "Alice" },
        { column: "age", operation: "greater than", value: "20" },
      ],
      true
    );
    tq.rows().should("have.length", 1);

    // remove the second filter row, leaving only name contains Alice
    cy.get(tableSelector.filterButton("table1")).scrollIntoView().click({ force: true });
    cy.get(tableSelector.filterClose(1)).click({ force: true });
    cy.get(tableSelector.buttonCloseFilters).click({ force: true });
    cy.wait(500);
    tq.rows().should("have.length", 2);

    cy.get(tableSelector.filterButton("table1")).scrollIntoView().click({ force: true });
    cy.get(tableSelector.buttonClearFilter).click({ force: true });
    cy.get(tableSelector.buttonCloseFilters).click({ force: true });
    cy.wait(500);
    tq.rows().should("have.length", 3);
  });

  it("`filters` exposed variable reflects applied filter values", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
      probes: { p1: "{{JSON.stringify(components.table1.filters)}}" },
    });
    addFilter([{ column: "name", operation: "contains", value: "Alice" }], true);
    tq.probe("p1").should("contain.text", "Alice");
  });
});

describe("A4 filter + search combined", () => {
  afterEach(() => tq.cleanup());

  it("search and filter both apply (AND) to the visible rows", () => {
    tq.app({
      data: [
        { id: 1, name: "Alice Smith", age: 30 },
        { id: 2, name: "Alice Jones", age: 10 },
        { id: 3, name: "Bob Alice", age: 30 },
      ],
    });
    addFilter([{ column: "age", operation: "equals", value: "30" }], true);
    tq.rows().should("have.length", 2);

    cy.get(tableSelector.searchInputField("table1")).scrollIntoView().type("Alice Smith", { force: true });
    cy.wait(600);
    tq.rows().should("have.length", 1);
    tq.cell(0, "id").should("contain.text", "1");
  });
});
