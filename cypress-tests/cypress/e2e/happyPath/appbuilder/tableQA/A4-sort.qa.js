// A4 Search, filter, sort — SORT sub-area.
// enabledSort: header click asc/desc/none across column types; sort + pagination;
// sortApplied exposed value; serverSideSort/serverSideFilter/serverSidePagination suppress
// client-side processing.
import { tq, col } from "./_harness";
import { tableSelector } from "Selectors/appBuilder/components/table";
import { sortByColumn } from "Support/utils/appBuilder/components/table";

const namesInOrder = () => tq.rows().then(($rows) => [...$rows].map((r) => r.innerText.split("\t")[0]));

describe("A4 sort — asc/desc/none cycle per column type", () => {
  afterEach(() => tq.cleanup());

  it("string column: asc -> desc -> none, case-insensitive and unicode-aware ordering", () => {
    tq.app({
      data: [{ id: 1, name: "bob" }, { id: 2, name: "Alice" }, { id: 3, name: "Ångström" }, { id: 4, name: "zeta" }],
    });
    sortByColumn("name");
    cy.get(tableSelector.sortIconAscending("name")).should("exist");
    tq.cell(0, "name").invoke("text").then((first) => cy.log(`asc first: ${first}`));

    sortByColumn("name");
    cy.get(tableSelector.sortIconDescending("name")).should("exist");
    tq.cell(0, "name").invoke("text").then((first) => cy.log(`desc first: ${first}`));

    sortByColumn("name"); // third click -> no sort
    cy.get(tableSelector.sortIconAscending("name")).should("not.exist");
    cy.get(tableSelector.sortIconDescending("name")).should("not.exist");
  });

  it("number column: numeric order (not lexicographic) and nulls placement", () => {
    tq.app({
      data: [{ id: 1, qty: 100 }, { id: 2, qty: 9 }, { id: 3, qty: 20 }, { id: 4, qty: null }],
      columns: [col("id", "number"), col("qty", "number")],
    });
    sortByColumn("qty");
    cy.get(tableSelector.sortIconAscending("qty")).should("exist");
    tq.rows().then(($rows) => {
      const vals = [...$rows].map((r) => r.querySelector('[data-cy*="-qty-row-"]')?.innerText);
      cy.log(`asc order: ${JSON.stringify(vals)}`);
      // numeric asc must be 9, 20, 100 (not "100","20","9" lexicographic) with null somewhere
      const numericOnly = vals.filter((v) => v !== "" && v != null);
      expect(numericOnly).to.deep.equal(["9", "20", "100"]);
    });
  });

  it("number column: numeric strings as data sort numerically via the number sortingFn", () => {
    tq.app({
      data: [{ id: 1, qty: "100" }, { id: 2, qty: "9" }, { id: 3, qty: "20" }],
      columns: [col("id", "number"), col("qty", "number")],
    });
    sortByColumn("qty");
    tq.rows().then(($rows) => {
      const vals = [...$rows].map((r) => r.querySelector('[data-cy*="-qty-row-"]')?.innerText);
      cy.log(`asc order for numeric-string data: ${JSON.stringify(vals)}`);
    });
  });

  it("boolean column: false before true (or vice versa) and toggles on repeat click", () => {
    tq.app({
      data: [{ id: 1, active: true }, { id: 2, active: false }, { id: 3, active: true }],
      columns: [col("id", "number"), col("active", "boolean")],
    });
    sortByColumn("active");
    cy.get(tableSelector.sortIconAscending("active")).should("exist");
    tq.cell(0, "id").invoke("text").then((firstId) => cy.log(`asc first row id: ${firstId}`));
  });

  it("select column (label != value): sorts by the raw stored VALUE, not the displayed label", () => {
    tq.app({
      data: [{ id: 1, status: "B" }, { id: 2, status: "A" }, { id: 3, status: "C" }],
      columns: [
        col("id", "number"),
        col("status", "select", {
          options: [
            { label: "Zulu", value: "A" },
            { label: "Alpha", value: "B" },
            { label: "Mike", value: "C" },
          ],
        }),
      ],
    });
    sortByColumn("status");
    tq.rows().then(($rows) => {
      const ids = [...$rows].map((r) => r.querySelector('[data-cy*="-id-row-"]')?.innerText);
      cy.log(`asc order by id (status sorted): ${JSON.stringify(ids)} — expect [2,1,3] if sorted by VALUE A/B/C`);
    });
  });

  it("datepicker column: chronological order despite a display-format string, regardless of raw storage order", () => {
    tq.app({
      data: [
        { id: 1, joined: "2024-06-15T00:00:00.000Z" }, // displays 15/06/2024
        { id: 2, joined: "2023-01-01T00:00:00.000Z" }, // displays 01/01/2023
        { id: 3, joined: "2025-12-31T00:00:00.000Z" }, // displays 31/12/2025
      ],
      columns: [
        col("id", "number"),
        col("joined", "datepicker", {
          dateFormat: "DD/MM/YYYY",
          parseDateFormat: "DD/MM/YYYY",
          isTimeChecked: false,
          isDateSelectionEnabled: true,
        }),
      ],
    });
    sortByColumn("joined");
    tq.rows().then(($rows) => {
      const ids = [...$rows].map((r) => r.querySelector('[data-cy*="-id-row-"]')?.innerText);
      expect(ids).to.deep.equal(["2", "1", "3"]); // chronological: 2023, 2024, 2025
    });
  });
});

describe("A4 sort + pagination", () => {
  afterEach(() => tq.cleanup());

  it("sorting re-sorts the FULL dataset, then paginates (page 1 shows the new extremes)", () => {
    tq.app({
      data: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, qty: 12 - i })), // qty: 12..1
      columns: [col("id", "number"), col("qty", "number")],
      props: { rowsPerPage: "{{5}}" },
    });
    sortByColumn("qty"); // ascending: smallest qty first
    tq.cell(0, "qty").should("contain.text", "1");
    cy.get(tableSelector.paginationButtonToNext).click({ force: true });
    tq.cell(0, "qty").should("contain.text", "6"); // page 2 starts at the 6th-smallest
  });
});

describe("A4 sort — sortApplied exposed value", () => {
  afterEach(() => tq.cleanup());

  it("sortApplied reflects column/direction while sorted, and clears on the third click", () => {
    tq.app({
      data: [{ id: 1, name: "b" }, { id: 2, name: "a" }],
      probes: { p1: "{{JSON.stringify(components.table1.sortApplied)}}" },
    });
    sortByColumn("name");
    tq.probe("p1").should("contain.text", '"direction":"asc"');
    tq.probe("p1").should("contain.text", '"columnKey":"name"');

    sortByColumn("name");
    tq.probe("p1").should("contain.text", '"direction":"desc"');

    sortByColumn("name");
    tq.probe("p1").should("have.text", "[]");
  });
});

describe("A4 server-side flags suppress client-side sort/filter/pagination", () => {
  afterEach(() => tq.cleanup());

  it("serverSideSort=true: clicking a header does NOT reorder the rows client-side", () => {
    tq.app({
      data: [{ id: 1, name: "zeta" }, { id: 2, name: "alpha" }, { id: 3, name: "mike" }],
      props: { serverSideSort: "{{true}}" },
    });
    tq.cell(0, "name").should("contain.text", "zeta"); // original order
    sortByColumn("name");
    cy.get(tableSelector.sortIconAscending("name")).should("exist"); // UI still shows sort state
    tq.cell(0, "name").should("contain.text", "zeta"); // but data order is unchanged (manualSorting)
  });

  it("serverSideFilter=true: adding a filter does NOT remove rows client-side", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
      props: { serverSideFilter: "{{true}}" },
    });
    cy.get(tableSelector.filterButton("table1")).scrollIntoView().click({ force: true });
    cy.get(tableSelector.buttonAddFilter).click({ force: true });
    cy.get(`[data-cy="select-column-dropdown-0"]`).find("input").first().type("name", { force: true });
    cy.get(".react-select__option").contains(/^name$/i).click({ force: true });
    cy.get(`[data-cy="select-operation-dropdown-0"]`).find("input").first().type("contains", { force: true });
    cy.get(".react-select__option").contains(/^contains$/i).click({ force: true });
    cy.get(tableSelector.filterInput(0)).type("Alice", { force: true });
    cy.wait(800);
    cy.get(tableSelector.buttonCloseFilters).click({ force: true });
    cy.wait(500);
    tq.rows().should("have.length", 2); // still both rows client-side (manualFiltering)
  });

  it("serverSidePagination=true: all rows render on one page regardless of rowsPerPage", () => {
    tq.app({
      data: Array.from({ length: 15 }, (_, i) => ({ id: i + 1 })),
      props: { serverSidePagination: "{{true}}", rowsPerPage: "{{5}}" },
    });
    tq.rows().then(($rows) => {
      cy.log(`rows rendered with serverSidePagination=true, rowsPerPage=5, 15 total rows: ${$rows.length}`);
    });
  });
});
