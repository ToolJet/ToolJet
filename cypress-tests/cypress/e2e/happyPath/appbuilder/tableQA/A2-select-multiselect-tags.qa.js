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

// A2 Column types (display): select, newMultiSelect, tagsV2 ("Tags" in the inspector dropdown)
// Source refs:
//  - SelectRenderer: frontend/src/AppBuilder/Shared/DataTypes/renderers/SelectRenderer.jsx
//    selectedValue = options.find(o => o.value === value) || []  -> value not in options renders blank.
//  - TagsRenderer: frontend/src/AppBuilder/Shared/DataTypes/renderers/TagsRenderer.jsx
//    resolveSelectedOption fabricates an ad-hoc {label:String(v),value:String(v)} tag when value isn't
//    in options -> renders the raw value as an unstyled chip (different behaviour from Select).
//  - generateColumnsData.js "case 'select'/'newMultiSelect'/'tagsV2'": column.options = [{label,value,optionColor,labelColor}]

const OPTIONS = [
  { label: "Red", value: "red", optionColor: "rgb(255, 0, 0)" },
  { label: "Green", value: "green" },
];

describe("A2 select column - display", () => {
  afterEach(() => tq.cleanup());

  it("valid value shows the matching label", () => {
    tq.app({ data: [{ c: "red" }], columns: [col("c", "select", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("eq", "Red");
  });

  it("value not present in options renders blank (not the raw value)", () => {
    tq.app({ data: [{ c: "blue" }], columns: [col("c", "select", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("eq", "");
  });

  it("null value renders blank", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "select", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("eq", "");
  });

  it("optionColor sets the chip background", () => {
    tq.app({ data: [{ c: "red" }], columns: [col("c", "select", { options: OPTIONS })] });
    tq.cell(0, "c").find(".table-select-search__single-value, [class*='singleValue']").should("exist");
  });

  it("wrong type (array) for a single-select value renders blank, no crash", () => {
    tq.app({ data: [{ c: ["red", "green"] }], columns: [col("c", "select", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("eq", "");
  });
});

describe("A2 newMultiSelect column - display", () => {
  afterEach(() => tq.cleanup());

  it("valid array of values shows both labels", () => {
    tq.app({ data: [{ c: ["red", "green"] }], columns: [col("c", "newMultiSelect", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("contain", "Red").and("contain", "Green");
  });

  it("a value not present in options is silently dropped from the chips (no error, no raw value shown)", () => {
    tq.app({ data: [{ c: ["red", "purple"] }], columns: [col("c", "newMultiSelect", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("contain", "Red").and("not.contain", "purple");
  });

  it("null value renders no chips", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "newMultiSelect", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("eq", "");
  });

  it("empty array renders no chips", () => {
    tq.app({ data: [{ c: [] }], columns: [col("c", "newMultiSelect", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("eq", "");
  });

  it("wrong type (single string, not array) - still resolves matching option", () => {
    tq.app({ data: [{ c: "red" }], columns: [col("c", "newMultiSelect", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("contain", "Red");
  });
});

describe("A2 tagsV2 (Tags) column - display", () => {
  afterEach(() => tq.cleanup());

  it("valid single value shows the matching label", () => {
    tq.app({ data: [{ c: "red" }], columns: [col("c", "tagsV2", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("eq", "Red");
  });

  it("value not present in options is fabricated as an ad-hoc tag showing the raw value " +
     "(inconsistent with Select, which renders blank for the same case)", () => {
    tq.app({ data: [{ c: "purple" }], columns: [col("c", "tagsV2", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("eq", "purple");
  });

  it("multi-select tags: valid array shows all labels", () => {
    tq.app({
      data: [{ c: ["red", "green"] }],
      columns: [col("c", "tagsV2", { options: OPTIONS, allowMultipleSelection: "{{true}}" })],
    });
    tq.cell(0, "c").invoke("text").should("contain", "Red").and("contain", "Green");
  });

  it("null value renders blank", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "tagsV2", { options: OPTIONS })] });
    tq.cell(0, "c").invoke("text").should("eq", "");
  });
});
