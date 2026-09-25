// A1 Data & column generation: column properties (name vs key, rename, reorder, visibility+fx,
// deletion-history persistence, transformation incl. null/''/object returns).
import { tq, col } from "./_harness";

const headerTexts = () =>
  tq.table().then(($t) => [...$t[0].querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.textContent.trim()).filter(Boolean));

describe("A1 column properties", () => {
  afterEach(() => tq.cleanup());

  it("Column name (label) differs from key (accessor): header shows name, cell keyed by name-normalized selector reading key's data", () => {
    tq.app({
      data: [{ full_name: "Ada Lovelace" }],
      columns: [col("full_name", "string", { name: "Full Name" })],
    });
    headerTexts().then((got) => expect(got).to.deep.equal(["Full Name"]));
    tq.cell(0, "Full Name").should("have.text", "Ada Lovelace");
  });

  it("Rename (change name, key unchanged): header updates, data still resolves via key", () => {
    tq.app({
      data: [{ id: 1, note: "hi" }],
      columns: [col("id"), col("note", "string", { name: "Renamed Note" })],
    });
    headerTexts().then((got) => expect(got).to.deep.equal(["id", "Renamed Note"]));
    tq.cell(0, "Renamed Note").should("have.text", "hi");
  });

  it("Reorder: DOM header order follows the columns array order, not data key order", () => {
    tq.app({
      data: [{ id: 1, name: "Ann", email: "ann@x.com" }],
      columns: [col("email"), col("id"), col("name")],
    });
    headerTexts().then((got) => expect(got).to.deep.equal(["email", "id", "name"]));
  });

  it("Visibility off (columnVisibility=false): column fully absent from header + cells", () => {
    tq.app({
      data: [{ id: 1, secret: "shh" }],
      columns: [col("id"), col("secret", "string", { columnVisibility: "{{false}}" })],
    });
    headerTexts().then((got) => expect(got).to.deep.equal(["id"]));
    tq.table().find('[data-cy$="-secret-row-0"]').should("not.exist");
  });

  it("Visibility via fx (truthy expression): column renders", () => {
    tq.app({
      data: [{ id: 1, shown: "yes" }],
      columns: [col("id"), col("shown", "string", { columnVisibility: "{{1 === 1}}" })],
    });
    headerTexts().then((got) => expect(got).to.deep.equal(["id", "shown"]));
  });

  it("Visibility via fx (falsy expression): column is hidden", () => {
    tq.app({
      data: [{ id: 1, hidden: "no" }],
      columns: [col("id"), col("hidden", "string", { columnVisibility: "{{1 === 2}}" })],
    });
    headerTexts().then((got) => expect(got).to.deep.equal(["id"]));
  });

  it("columnDeletionHistory: a key marked deleted is excluded from autogeneration even though present in data", () => {
    tq.app({
      data: [{ id: 1, name: "Ann", extra: "should stay hidden" }],
      // no `columns` -> autogenerate stays ON; simulate having previously deleted the "extra" column.
      props: { columnDeletionHistory: ["extra"] },
    });
    headerTexts().then((got) => expect(got).to.deep.equal(["id", "name"]));
  });

  it("Transformation: simple uppercase transform is applied to the displayed cell", () => {
    tq.app({
      data: [{ id: 1, name: "ann" }],
      columns: [col("id"), col("name", "string", { transformation: "{{cellValue.toUpperCase()}}" })],
    });
    tq.cell(0, "name").should("have.text", "ANN");
  });

  it("Transformation returning '' (empty string): cell shows empty, not the original value", () => {
    tq.app({
      data: [{ id: 1, name: "ann" }],
      columns: [col("id"), col("name", "string", { transformation: "{{''}}" })],
    });
    tq.cell(0, "name").should("have.text", "");
  });

  it("Transformation returning null: silently falls back to the ORIGINAL value instead of blanking the cell", () => {
    // transformTableData.js: `getResolvedValue(transformation, {...}) ?? row[key]` — `??` only
    // short-circuits on null/undefined, so a transformation that deliberately returns null is
    // discarded and the untransformed value is shown instead, unlike '' which IS applied (see
    // previous case). A transformation meant to null out a cell can't actually do so.
    tq.app({
      data: [{ id: 1, name: "ann" }],
      columns: [col("id"), col("name", "string", { transformation: "{{null}}" })],
    });
    tq.cell(0, "name").should("have.text", "ann");
  });

  it("Transformation returning an object: StringRenderer stringifies it (no crash) but shows unhelpful '[object Object]'", () => {
    // StringRenderer.jsx renderText(): `String(text)` — safe, but not useful for column authors.
    tq.app({
      data: [{ id: 1, name: "ann" }],
      columns: [col("id"), col("name", "string", { transformation: "{{ ({a:1}) }}" })],
    });
    tq.cell(0, "name").should("have.text", "[object Object]");
  });
});
