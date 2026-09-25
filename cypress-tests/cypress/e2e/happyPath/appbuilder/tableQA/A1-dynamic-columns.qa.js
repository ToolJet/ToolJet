// A1 Data & column generation: useDynamicColumn + columnData.
import { tq, col } from "./_harness";

const headerTexts = () =>
  tq.table().then(($t) => [...$t[0].querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.textContent.trim()).filter(Boolean));

describe("A1 dynamic columns (useDynamicColumn + columnData)", () => {
  afterEach(() => tq.cleanup());

  it("renders exactly the columnData-defined columns, in order, keyed by their own key", () => {
    tq.app({
      data: [{ email: "a@x.com", name: "Ann", unused: "nope" }],
      columns: [col("email"), col("name"), col("unused")], // should be ignored: dynamic column owns the schema
      props: {
        useDynamicColumn: "{{true}}",
        columnData: [
          { name: "Email", key: "email", id: "1" },
          { name: "Full name", key: "name", id: "2" },
        ],
      },
    });
    headerTexts().then((got) => expect(got).to.deep.equal(["Email", "Full name"]));
    tq.cell(0, "Email").should("have.text", "a@x.com");
    tq.cell(0, "Full name").should("have.text", "Ann");
    tq.table().find('[data-cy$="-unused-row-0"]').should("not.exist");
  });

  it("columnData key with no matching data field renders an empty cell (not an error)", () => {
    tq.app({
      data: [{ email: "a@x.com" }],
      props: {
        useDynamicColumn: "{{true}}",
        columnData: [{ name: "Phone", key: "phone", id: "1" }],
      },
    });
    headerTexts().then((got) => expect(got).to.deep.equal(["Phone"]));
    tq.cell(0, "Phone").should("have.text", "");
  });

  it("empty columnData array -> zero columns render (table is column-less, not an error state)", () => {
    tq.app({
      data: [{ email: "a@x.com" }],
      props: { useDynamicColumn: "{{true}}", columnData: [] },
    });
    tq.table().find('[data-cy$="-column-header"]').should("have.length", 0);
  });

  it("BUG-CANDIDATE: if the FIRST columnData item lacks a `name`, ALL dynamic columns vanish, not just that one", () => {
    // autoGenerateColumns.js: `if (dynamicColumn.length > 0 && dynamicColumn[0].name) {...} return [];`
    // only inspects index 0 to decide whether the whole list is usable.
    tq.app({
      data: [{ email: "a@x.com", name: "Ann" }],
      props: {
        useDynamicColumn: "{{true}}",
        columnData: [
          { key: "email", id: "1" }, // no name on the first item
          { name: "Full name", key: "name", id: "2" },
        ],
      },
    });
    tq.table().find('[data-cy$="-column-header"]').should("have.length", 0);
  });

  it("switching useDynamicColumn back off falls back to the static `columns` schema", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }],
      columns: [col("id"), col("name")],
      props: { useDynamicColumn: "{{false}}", columnData: [{ name: "Email", key: "email", id: "1" }] },
    });
    headerTexts().then((got) => expect(got).to.deep.equal(["id", "name"]));
  });
});
