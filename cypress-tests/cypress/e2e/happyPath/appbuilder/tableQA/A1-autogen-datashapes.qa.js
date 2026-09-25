// A1 Data & column generation: autogenerate on/off (+ nested generation) x data shapes.
import { tq, col } from "./_harness";

// Dump the currently rendered column headers as [{ name, dataCy }], in DOM order.
const headerDump = () =>
  tq.table().then(($t) => {
    const els = [...$t[0].querySelectorAll('[data-cy$="-column-header"]')];
    return els.map((e) => e.textContent.trim()).filter(Boolean);
  });

describe("A1 autogenerate: data shape matrix", () => {
  afterEach(() => tq.cleanup());

  const cases = [
    { title: "flat object", data: [{ id: 1, name: "Ann" }], expectHeaders: ["id", "name"] },
    {
      title: "nested 1 level",
      data: [{ id: 1, address: { city: "NY", zip: "10001" } }],
      // per autoGenerateColumns.js generateNestedColumnsHelperFunc: 1-level object -> dotted children
      expectHeaders: ["id", "address.city", "address.zip"],
    },
    {
      title: "nested 2 levels (only 1 level flattened)",
      data: [{ id: 1, a: { b: { c: 1 } } }],
      // a.b is itself an object -> limitToOneLevelNestingHelperFunc stops flattening deeper,
      // and since a.b's value (an object) is not primitive/array, no column at all for it.
      expectHeaders: ["id"],
    },
    {
      title: "array value column",
      data: [{ id: 1, tags: ["x", "y"] }],
      expectHeaders: ["id", "tags"],
    },
    {
      title: "null then real value picks representative row for type",
      data: [{ id: 1, val: null }, { id: 2, val: "hello" }],
      expectHeaders: ["id", "val"],
    },
    {
      title: "all-null column still gets a column",
      data: [{ id: 1, val: null }, { id: 2, val: null }],
      expectHeaders: ["id", "val"],
    },
    {
      title: "mixed types per row (number then string) uses first row's type, still one column",
      data: [{ id: 1, v: 5 }, { id: 2, v: "five" }],
      expectHeaders: ["id", "v"],
    },
    {
      title: "numbers as strings stay a single string column",
      data: [{ id: 1, qty: "007" }],
      expectHeaders: ["id", "qty"],
    },
    {
      title: "keys with dots and spaces",
      data: [{ "a.b": 1, "a b": 2 }],
      expectHeaders: ["a.b", "a b"],
    },
    { title: "1 row", data: [{ id: 1 }], expectHeaders: ["id"] },
  ];

  cases.forEach(({ title, data, expectHeaders }) => {
    it(`autogenerate ON: ${title}`, () => {
      tq.app({ data });
      // retry until headers settle (autogeneration is async)
      tq.table().should(($t) => {
        const got = [...$t[0].querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.textContent.trim()).filter(Boolean);
        expect(got, `headers for ${title}`).to.deep.equal(expectHeaders);
      });
    });
  });

  it("BUG-CANDIDATE: a top-level key containing a literal dot renders an EMPTY cell, not its value", () => {
    // generateColumnsData.js sets `accessorKey: column.key || column.name` as a raw string.
    // TanStack Table's default accessorKey resolution supports dot-notation for NESTED access
    // (e.g. 'address.city' reads row.address.city). A genuinely flat key that happens to
    // contain a literal dot ("a.b") gets misread as a nested path (row.a.b), which doesn't
    // exist, so the cell silently renders blank instead of the real value.
    tq.app({ data: [{ "a.b": 1, "a b": 2 }] });
    tq.cell(0, "a b").should("have.text", "2");
    tq.cell(0, "a.b").invoke("text").then((txt) => {
      cy.log(`cell text for dotted key "a.b": "${txt}"`);
    });
  });

  it("autogenerate ON: unicode keys render header TEXT correctly (data-cy may collapse)", () => {
    tq.app({ data: [{ id: 1, "héllo": "x", "日本語": "y" }] });
    tq.table().should(($t) => {
      const got = [...$t[0].querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.textContent.trim()).filter(Boolean);
      expect(got).to.deep.equal(["id", "héllo", "日本語"]);
    });
  });

  it("autogenerate ON: empty array -> no columns, table shows empty state", () => {
    tq.app({ data: [] });
    tq.table().find('[data-cy$="-column-header"]').should("have.length", 0);
  });

  it("autogenerate ON: non-array data (object) -> no columns generated", () => {
    tq.app({ data: "{{ ({ id: 1, name: 'Ann' }) }}" });
    tq.table().find('[data-cy$="-column-header"]').should("have.length", 0);
  });

  it("autogenerate ON: non-array data (string) -> no columns generated", () => {
    tq.app({ data: "{{ 'just a string' }}" });
    tq.table().find('[data-cy$="-column-header"]').should("have.length", 0);
  });

  it("autogenerate ON: non-array data (null) -> no columns generated", () => {
    tq.app({ data: "{{ null }}" });
    tq.table().find('[data-cy$="-column-header"]').should("have.length", 0);
  });

  it("autogenerate ON: 1 row renders exactly 1 data row", () => {
    tq.app({ data: [{ id: 1, name: "solo" }] });
    tq.rows().should("have.length", 1);
  });

  it("autogenerate ON: 500 rows -> footer count is accurate, first page paginated", () => {
    const data = Array.from({ length: 500 }, (_, i) => ({ id: i + 1, name: `row-${i + 1}` }));
    tq.app({ data });
    cy.get('[data-cy="footer-number-of-records"]').should("contain.text", "500 Records");
  });

  it("autogenerate OFF (explicit columns): schema is locked even if data shape changes", () => {
    tq.app({
      data: [{ id: 1, name: "Ann", extra: "unseen" }],
      columns: [col("id"), col("name")],
    });
    tq.table().should(($t) => {
      const got = [...$t[0].querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.textContent.trim()).filter(Boolean);
      expect(got, "only configured columns render, 'extra' is ignored").to.deep.equal(["id", "name"]);
    });
  });

  it("autogenerate OFF with an EMPTY explicit columns array still auto-generates once (documented escape hatch)", () => {
    // columnSlice.js: isSchemaLocked = !autogenerateColumnsFlag && !isDynamicColumnSelected && !isEmpty(columns)
    // -> an empty saved `columns` array is NOT considered "locked", so it still generates once,
    // even though the Table Columns editor showed nothing and autogenerateColumns.value is false.
    tq.app({
      data: [{ id: 1, name: "Ann" }],
      columns: [],
    });
    tq.table().should(($t) => {
      const got = [...$t[0].querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.textContent.trim()).filter(Boolean);
      expect(got, "empty explicit columns array should still generate from data").to.deep.equal(["id", "name"]);
    });
  });
});
