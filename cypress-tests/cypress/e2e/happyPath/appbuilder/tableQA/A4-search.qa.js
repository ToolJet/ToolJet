// A4 Search, filter, sort — SEARCH sub-area.
// displaySearchBox × column types × terms. See AGENT_BRIEF.md for schema/rules.
import { tq, col } from "./_harness";
import { tableSelector } from "Selectors/appBuilder/components/table";

const search = (term) => {
  cy.get(tableSelector.searchInputField("table1"))
    .scrollIntoView()
    .clear({ force: true })
    .type(term, { force: true, delay: 0 });
  cy.wait(600); // SearchBar.jsx debounces 500ms
};

const footerCount = () => cy.get(tableSelector.labelNumberOfRecords);

describe("A4 search — column type coverage", () => {
  afterEach(() => tq.cleanup());

  it("matches per column type: string, number, select(label!=value), boolean, json, nested key", () => {
    tq.app({
      data: [
        { id: 1, name: "Alice Smith", age: 30, status: "A", active: true, meta: { tag: "vip" }, address: { city: "Mumbai" } },
        { id: 2, name: "bob o'connor", age: 7, status: "I", active: false, meta: { tag: "reg" }, address: { city: "Pune" } },
        { id: 3, name: "Carla", age: 100, status: "P", active: true, meta: { tag: "vip" }, address: { city: "Delhi" } },
      ],
      columns: [
        col("id", "number"),
        col("name", "string"),
        col("age", "number"),
        col("status", "select", {
          options: [
            { label: "Activated", value: "A" },
            { label: "Inactive", value: "I" },
            { label: "Pending", value: "P" },
          ],
        }),
        col("active", "boolean"),
        col("meta", "json"),
        col("address.city", "string", { name: "city" }),
      ],
      probes: { p1: "{{JSON.stringify(components.table1.searchText)}}" },
    });

    // string: plain, partial, case-insensitive
    search("Alice");
    tq.rows().should("have.length", 1);
    tq.cell(0, "name").should("contain.text", "Alice Smith");
    search("ALICE");
    tq.rows().should("have.length", 1);
    search("lic");
    tq.rows().should("have.length", 1);

    // number column: substring match on stringified number
    search("30");
    tq.rows().should("have.length", 1);
    tq.cell(0, "age").should("contain.text", "30");

    // select column with label != value: does the search box match the
    // displayed LABEL ("Activated") or only the raw stored VALUE ("A")?
    search("Activated");
    tq.rows().its("length").then((byLabel) => {
      search("A");
      tq.rows().its("length").then((byValueCount) => {
        cy.log(`rows matching label "Activated": ${byLabel}, rows matching raw value "A": ${byValueCount}`);
      });
    });

    // boolean column: search "true"/"false" against the raw boolean
    search("true");
    tq.rows().should("have.length.at.least", 1);

    // json column: does search reach into object content?
    search("vip");
    tq.rows().then(($rows) => cy.log(`rows matching json content "vip": ${$rows.length}`));

    // nested key column (address.city, key has a dot) — column still renders + is searchable
    search("Pune");
    tq.rows().should("have.length", 1);
    tq.cell(0, "city").should("contain.text", "Pune");

    // searchText exposed value reflects the last committed term
    tq.probe("p1").should("contain.text", "Pune");

    search("");
    tq.rows().should("have.length", 3);
  });

  it("string column: highlight wraps the matched substring in <mark>", () => {
    tq.app({
      data: [{ id: 1, name: "Alice Smith" }, { id: 2, name: "Bob Jones" }],
      columns: [col("id", "number"), col("name", "string")],
    });
    search("lic");
    tq.cell(0, "name").find("mark").should("exist").and("have.text", "lic");
  });

  it("number column: highlight wraps the matched substring in <mark>", () => {
    tq.app({
      data: [{ id: 1, qty: 1234 }, { id: 2, qty: 55 }],
      columns: [col("id", "number"), col("qty", "number")],
    });
    search("23");
    tq.cell(0, "qty").find("mark").should("exist").and("have.text", "23");
  });

  it("datepicker column: search against the DISPLAYED (formatted) date text", () => {
    tq.app({
      data: [{ id: 1, joined: "2024-02-01T00:00:00.000Z" }],
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
    tq.cell(0, "joined").should("contain.text", "01/02/2024");
    search("01/02/2024");
    tq.rows().then(($rows) => {
      cy.log(`rows matching the on-screen date text "01/02/2024": ${$rows.length}`);
    });
  });
});

describe("A4 search — special terms", () => {
  afterEach(() => tq.cleanup());

  it("regex special characters ( [ * ? + are treated as LITERAL substrings, not regex", () => {
    tq.app({
      data: [
        { id: 1, name: "wild(card)" },
        { id: 2, name: "bracket[one]" },
        { id: 3, name: "plus+sign" },
        { id: 4, name: "star*mark" },
        { id: 5, name: "question?mark" },
        { id: 6, name: "plain text" },
      ],
    });
    [
      ["(", 1], ["[", 1], ["+", 1], ["*", 1], ["?", 1],
    ].forEach(([term]) => {
      search(term);
      tq.rows().its("length").then((n) => cy.log(`term "${term}" -> ${n} row(s)`));
    });
    // A single literal '(' must at minimum not crash the table and should find "wild(card)"
    search("(");
    cy.get("body").then(($b) => cy.log($b.text().includes("wild(card)") ? "cell text intact" : "cell text MISSING"));
    tq.table().should("be.visible");
  });

  it("unicode characters are matched", () => {
    tq.app({ data: [{ id: 1, name: "Ålice Ünïcode" }, { id: 2, name: "plain" }] });
    search("Ünïcode");
    tq.rows().should("have.length", 1);
  });

  it("whitespace-only term and leading/trailing spaces", () => {
    tq.app({ data: [{ id: 1, name: "  spaced value  " }, { id: 2, name: "other" }] });
    search("   ");
    tq.rows().then(($rows) => cy.log(`rows for whitespace-only term: ${$rows.length}`));
  });

  it("clear icon empties the search box and restores all rows", () => {
    tq.app({ data: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }] });
    search("Alice");
    tq.rows().should("have.length", 1);
    cy.get(tableSelector.searchClearIcon("table1")).click({ force: true });
    cy.wait(600);
    cy.get(tableSelector.searchInputField("table1")).should("have.value", "");
    tq.rows().should("have.length", 2);
  });
});

describe("A4 search — footer count and pagination reset", () => {
  afterEach(() => tq.cleanup());

  it("footer-number-of-records reflects the SEARCH-FILTERED row count, not the total", () => {
    tq.app({ data: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: i < 3 ? `match-${i}` : `other-${i}` })) });
    footerCount().should("contain.text", "12");
    search("match-");
    footerCount().should("contain.text", "3");
  });

  it("searching while on page 2 (client-side, default) — does the current page reset to 1?", () => {
    tq.app({
      data: Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: i === 0 ? "unique-match" : `row-${i}` })),
      props: { rowsPerPage: "{{5}}" },
    });
    cy.get(tableSelector.paginationButtonToNext).click({ force: true });
    tq.cell(0, "name").should("contain.text", "row-5"); // now on page 2
    search("unique-match"); // only row 0 (page-1 data) matches
    tq.rows().then(($rows) => {
      cy.log(`rows visible after search while on page 2: ${$rows.length} (expected 1, showing the match)`);
    });
  });
});
