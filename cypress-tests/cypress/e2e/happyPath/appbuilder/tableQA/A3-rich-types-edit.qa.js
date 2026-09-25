// A3: inline editing for select / newMultiSelect / tagsV2 / tags(v1) / rating / json /
// datepicker -- value shown after edit AND the changeSet shape, watching in particular
// whether select/multiselect commit plain values or full {label,value} option objects,
// whether the legacy "tags" column type even works, and whether datepicker commits a
// display string.
import { tq, col } from "./_harness";

const probes = {
  cs: "{{JSON.stringify(components.table1.changeSet)}}",
};

describe("A3 rich column types: select / newMultiSelect", () => {
  afterEach(() => tq.cleanup());

  it("select column: choosing an option shows its label and commits to changeSet", () => {
    tq.app({
      data: [{ id: 1, status: "open" }],
      columns: [
        col("id"),
        col("status", "select", {
          isEditable: true,
          options: [
            { label: "Open", value: "open" },
            { label: "Closed", value: "closed" },
          ],
        }),
      ],
      probes,
    });
    tq.cell(0, "status").click({ force: true });
    cy.get(".react-select__option").contains("Closed").click({ force: true });
    tq.cell(0, "status").should("contain.text", "Closed");
    tq.probe("cs").then(($p) => {
      const cs = JSON.parse($p.text());
      // Expectation: a select column commits the plain option VALUE ("closed"), matching
      // the shape the `data` prop itself uses for this column ("open"/"closed" strings).
      expect(cs.status, `changeSet.status was ${JSON.stringify(cs.status)}`).to.eq("closed");
    });
  });

  it("newMultiSelect column: picking two options shows both labels and commits to changeSet as an array", () => {
    tq.app({
      data: [{ id: 1, interest: ["Reading"] }],
      columns: [
        col("id"),
        col("interest", "newMultiSelect", {
          isEditable: true,
          options: [
            { label: "Reading", value: "Reading" },
            { label: "Music", value: "Music" },
            { label: "Cooking", value: "Cooking" },
          ],
        }),
      ],
      probes,
    });
    tq.cell(0, "interest").click({ force: true });
    cy.get(".react-select__option").contains("Music").click({ force: true });
    tq.cell(0, "interest").should("contain.text", "Music");
    tq.probe("cs").then(($p) => {
      const cs = JSON.parse($p.text());
      const values = (cs.interest || []).map((v) => (typeof v === "object" && v !== null ? v.value : v));
      expect(values, `changeSet.interest was ${JSON.stringify(cs.interest)}`).to.include("Music");
      // BUG CHECK: multiselect should commit plain string values like the original data
      // (["Reading","Music"]), not {label,value} option objects.
      const allPlainStrings = (cs.interest || []).every((v) => typeof v === "string");
      expect(allPlainStrings, `expected plain strings, got ${JSON.stringify(cs.interest)}`).to.eq(true);
    });
  });
});

describe("A3 rich column types: legacy 'tags' column", () => {
  afterEach(() => tq.cleanup());

  it("BUG CHECK: a 'tags' column (legacy, distinct from tagsV2) never renders the row's actual tag data", () => {
    tq.app({
      data: [{ id: 1, tagsv1: ["alpha", "beta"] }],
      columns: [col("id"), col("tagsv1", "tags", { isEditable: true })],
    });
    // generateColumnsData passes prop `tags=` but TagsColumn destructures `value` --
    // a prop-name mismatch, so the component always falls back to an empty array.
    cy.get('td[data-cy^="table1-tagsv1-row-0"]').find(".tag").should("not.exist");
  });
});

describe("A3 rich column types: rating", () => {
  afterEach(() => tq.cleanup());

  it("clicking the 3rd star sets the rating to 3 in changeSet", () => {
    tq.app({
      data: [{ id: 1, rate: 1 }],
      columns: [col("id"), col("rate", "rating", { isEditable: true, maxRating: 5 })],
      probes,
    });
    cy.get('td[data-cy^="table1-rate-row-0"]').find('[role="radiogroup"] svg').eq(2).click({ force: true });
    tq.probe("cs").should("contain.text", '"rate":3');
  });
});

describe("A3 rich column types: json", () => {
  afterEach(() => tq.cleanup());

  it("editing a JSON cell commits a JSON STRING (not an object) to changeSet", () => {
    tq.app({
      data: [{ id: 1, js: { a: 1 } }],
      columns: [col("id"), col("js", "json", { isEditable: true })],
      probes: { ...probes, t: "{{typeof components.table1.changeSet[0]?.js}}" },
    });
    cy.get('td[data-cy^="table1-js-row-0"]')
      .find('[contenteditable="true"]')
      .type("{selectall}{backspace}", { force: true })
      .type('{"b":2}', { parseSpecialCharSequences: false, force: true })
      .type("{enter}", { force: true });
    tq.probe("t").should("have.text", "string");
    tq.probe("cs").should("contain.text", '"js":"{\\"b\\":2}"');
  });
});

describe("A3 nested-key columns (user.name)", () => {
  afterEach(() => tq.cleanup());

  it("BUG CHECK: editing a nested-key column (key='user.name') writes a literal flat 'user.name' key into changeSet/updatedData, leaving the real nested user.name untouched", () => {
    tq.app({
      data: [{ id: 1, user: { name: "Tom" } }],
      columns: [col("id"), col("user.name", "string", { isEditable: true, name: "user.name" })],
      probes: {
        cs: "{{JSON.stringify(components.table1.changeSet)}}",
        ud: "{{JSON.stringify(components.table1.updatedData)}}",
      },
    });
    cy.get('[data-cy="table1-user-name-row-0"]').find(".long-text-input").click({ force: true });
    cy.get('[data-cy="table1-user-name-row-0"]')
      .find('[contenteditable="true"]')
      .type("{selectall}{backspace}", { force: true })
      .type("Jerry{enter}", { force: true });
    // The cell itself should display the new value.
    cy.get('[data-cy="table1-user-name-row-0"]').should("have.text", "Jerry");
    tq.probe("cs").then(($p) => {
      const cs = JSON.parse($p.text());
      // Expected (if nested paths were handled correctly): cs.user = { name: 'Jerry' }.
      // Actual: a literal top-level key literally named "user.name" appears instead.
      expect(Object.prototype.hasOwnProperty.call(cs["0"] || {}, "user.name"), `changeSet was ${JSON.stringify(cs)}`).to.eq(
        true
      );
    });
    tq.probe("ud").then(($p) => {
      const ud = JSON.parse($p.text());
      const row = ud[0];
      // The real nested value is never updated -- it stays "Tom".
      expect(row.user && row.user.name, `updatedData[0] was ${JSON.stringify(row)}`).to.eq("Tom");
      expect(row["user.name"]).to.eq("Jerry");
    });
  });
});

describe("A3 rich column types: datepicker", () => {
  afterEach(() => tq.cleanup());

  it("picking a day in the calendar commits a formatted DISPLAY STRING (not an ISO date) to changeSet", () => {
    tq.app({
      data: [{ id: 1, dt: "15/05/2022" }],
      columns: [
        col("id"),
        col("dt", "datepicker", { isEditable: true, dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY" }),
      ],
      probes: { ...probes, t: "{{typeof components.table1.changeSet[0]?.dt}}" },
    });
    cy.get('td[data-cy^="table1-dt-row-0"]').find("input.table-column-datepicker-input").click({ force: true });
    cy.get(".react-datepicker__day--today").first().click({ force: true });
    tq.probe("t").should("have.text", "string");
  });
});
