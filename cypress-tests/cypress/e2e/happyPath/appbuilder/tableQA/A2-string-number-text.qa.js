import { tq, col } from "./_harness";

// Test-infra workaround (not a product bug): _harness.js's tq.app() reads Cypress.env("appId")
// synchronously as a cy.openApp() call argument, BEFORE this test's own apiCreateApp command has
// actually run. If that env var still holds a PREVIOUS test's (now cleaned-up) app id, cy.openApp()
// opens a dead app and lands on /error/invalid-link. Clearing it first forces cy.openApp()'s own
// `appId = Cypress.env("appId")` default-parameter fallback to kick in, which re-reads the env var
// at real invocation time (after this test's apiCreateApp has completed and set the fresh id).
beforeEach(() => {
  Cypress.env("appId", undefined);
});

// A2 Column types (display): string, number, text
// Source refs:
//  - StringRenderer/TextRenderer: frontend/src/AppBuilder/Shared/DataTypes/renderers/{String,Text}Renderer.jsx
//    Both use plain React text nodes (String(value)) -> no HTML interpretation, safe from injection.
//  - NumberRenderer: frontend/src/AppBuilder/Shared/DataTypes/renderers/NumberRenderer.jsx
//  - generateColumnsData.js: cellValue is coerced to '' when null/undefined BEFORE reaching any renderer.

const strCases = [
  { title: "valid string", value: "hello world", expect: "hello world" },
  { title: "null -> blank", value: null, expect: "" },
  { title: "undefined -> blank", value: undefined, expect: "" },
  { title: "empty string -> blank", value: "", expect: "" },
  { title: "number 0 (wrong type) -> \"0\"", value: 0, expect: "0" },
  { title: "boolean false (wrong type) -> \"false\"", value: false, expect: "false" },
  { title: "array (wrong type) -> joined", value: [1, 2, 3], expect: "1,2,3" },
  { title: "object (wrong type) -> [object Object]", value: { a: 1 }, expect: "[object Object]" },
  { title: "unicode/emoji", value: "héllo 😀 中文测试", expect: "héllo 😀 中文测试" },
  { title: "HTML-special chars are shown literally, not rendered", value: "<b>bold</b> & 'quote' \"dq\"", expect: "<b>bold</b> & 'quote' \"dq\"" },
  { title: "very long text renders in full (not truncated in DOM)", value: "x".repeat(500), expect: "x".repeat(500) },
];

describe("A2 string column - display", () => {
  afterEach(() => tq.cleanup());
  strCases.forEach(({ title, value, expect: expected }) => {
    it(title, () => {
      tq.app({ data: [{ c: value }], columns: [col("c", "string")] });
      tq.cell(0, "c").invoke("text").should("eq", expected);
      if (typeof value === "string" && value.includes("<b>")) {
        tq.cell(0, "c").find("b").should("not.exist");
      }
    });
  });
});

describe("A2 text column - display (multiline)", () => {
  afterEach(() => tq.cleanup());
  [
    { title: "valid multiline text", value: "line1\nline2", expect: "line1line2" }, // whitespace-pre-wrap collapses in .text() comparisons w/o \n normalization; check contains instead
    { title: "null -> blank", value: null, expect: "" },
    { title: "HTML-special chars literal", value: "<script>alert(1)</script>", expect: "<script>alert(1)</script>" },
  ].forEach(({ title, value, expect: expected }) => {
    it(title, () => {
      tq.app({ data: [{ c: value }], columns: [col("c", "text")] });
      if (title.includes("multiline")) {
        tq.cell(0, "c").invoke("text").should("contain", "line1").and("contain", "line2");
      } else {
        tq.cell(0, "c").invoke("text").should("eq", expected);
        tq.cell(0, "c").find("script").should("not.exist");
      }
    });
  });
});

const numCases = [
  { title: "valid number", value: 1234.5678, expect: "1234.5678" },
  { title: "null -> blank", value: null, expect: "" },
  { title: "undefined -> blank", value: undefined, expect: "" },
  { title: "empty string -> blank", value: "", expect: "" },
  { title: "0 -> \"0\"", value: 0, expect: "0" },
  { title: "numeric string (wrong type but coercible) shown as-is", value: "42", expect: "42" },
  { title: "non-numeric string (wrong type) shown as-is", value: "abc", expect: "abc" },
];

describe("A2 number column - display", () => {
  afterEach(() => tq.cleanup());
  numCases.forEach(({ title, value, expect: expected }) => {
    it(title, () => {
      tq.app({ data: [{ c: value }], columns: [col("c", "number")] });
      tq.cell(0, "c").invoke("text").should("eq", expected);
    });
  });

  it("decimalPlaces truncates (does not round) excess decimals", () => {
    // src: frontend/src/AppBuilder/Shared/DataTypes/renderers/NumberRenderer.jsx removingExcessDecimalPlaces()
    // slices the decimal string instead of rounding -> 3.99 with decimalPlaces=1 becomes 3.9, not 4.0
    tq.app({ data: [{ c: 3.99 }], columns: [col("c", "number", { decimalPlaces: "{{1}}" })] });
    tq.cell(0, "c").invoke("text").should("eq", "3.9");
  });

  it("decimalPlaces=0 shows integer part only", () => {
    tq.app({ data: [{ c: 3.7 }], columns: [col("c", "number", { decimalPlaces: "{{0}}" })] });
    tq.cell(0, "c").invoke("text").should("eq", "3");
  });

  it("decimalPlaces with a value that has no decimal part is unaffected", () => {
    tq.app({ data: [{ c: 42 }], columns: [col("c", "number", { decimalPlaces: "{{2}}" })] });
    tq.cell(0, "c").invoke("text").should("eq", "42");
  });
});
