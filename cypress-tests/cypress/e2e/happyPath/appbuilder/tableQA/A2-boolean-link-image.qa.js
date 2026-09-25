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

// A2 Column types (display): boolean, link, image
// Source refs:
//  - BooleanRenderer: frontend/src/AppBuilder/Shared/DataTypes/renderers/BooleanRenderer.jsx
//    read-only mode renders SolidIcon "tick" (truthy) or "remove" (falsy) based on !!value.
//  - LinkRenderer: frontend/src/AppBuilder/Shared/DataTypes/renderers/LinkRenderer.jsx
//  - ImageRenderer: frontend/src/AppBuilder/Shared/DataTypes/renderers/ImageRenderer.jsx
//    reads column.width / column.height, but neither is exposed in the Table column inspector UI
//    (grepped ColumnManager/*.jsx - only borderRadius + objectFit are exposed for image).

const boolCases = [
  { title: "true -> tick icon", value: true, tick: true },
  { title: "false -> remove icon", value: false, tick: false },
  { title: "null -> remove icon (falsy)", value: null, tick: false },
  { title: "undefined -> remove icon (falsy)", value: undefined, tick: false },
  { title: "0 -> remove icon (falsy)", value: 0, tick: false },
  { title: "1 -> tick icon (truthy)", value: 1, tick: true },
  { title: "non-empty string \"false\" -> tick icon (JS truthy coercion)", value: "false", tick: true },
  { title: "empty array -> tick icon (JS truthy coercion)", value: [], tick: true },
];

describe("A2 boolean column - display", () => {
  afterEach(() => tq.cleanup());
  boolCases.forEach(({ title, value, tick }) => {
    it(title, () => {
      tq.app({ data: [{ c: value }], columns: [col("c", "boolean")] });
      tq.cell(0, "c").find("svg").should("have.length", 1);
      tq.cell(0, "c")
        .find("path")
        .invoke("attr", "fill")
        .then((fill) => {
          // tick uses --grass9 (green), remove uses --tomato9 (red) per BooleanRenderer.jsx
          expect(fill).to.eq(tick ? "var(--grass9)" : "var(--tomato9)");
        });
    });
  });
});

describe("A2 link column - display", () => {
  afterEach(() => tq.cleanup());

  it("valid URL: href set, text = url, opens in new tab by default", () => {
    tq.app({ data: [{ c: "https://example.com/path" }], columns: [col("c", "link")] });
    tq.cell(0, "c").find("a").should("have.attr", "href", "https://example.com/path")
      .and("have.attr", "target", "_blank")
      .and("contain.text", "https://example.com/path");
  });

  it("displayText overrides the visible text but keeps href", () => {
    tq.app({
      data: [{ c: "https://example.com" }],
      columns: [col("c", "link", { displayText: "{{'Click here'}}" })],
    });
    tq.cell(0, "c").find("a").should("have.attr", "href", "https://example.com").and("contain.text", "Click here");
  });

  it("Open in new tab = false -> target=_self", () => {
    tq.app({
      data: [{ c: "https://example.com" }],
      columns: [col("c", "link", { linkTarget: "{{'_self'}}" })],
    });
    tq.cell(0, "c").find("a").should("have.attr", "target", "_self");
  });

  it("null value -> anchor renders with empty href (potential dead-link click target)", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "link")] });
    tq.cell(0, "c").find("a").should("have.attr", "href", "");
  });

  it("javascript: URL is passed straight through to href", () => {
    tq.app({ data: [{ c: "javascript:alert(1)" }], columns: [col("c", "link")] });
    tq.cell(0, "c").find("a").should("have.attr", "href", "javascript:alert(1)");
  });

  it("wrong type (number) is stringified for display text when no href given weirdness", () => {
    tq.app({ data: [{ c: 12345 }], columns: [col("c", "link")] });
    tq.cell(0, "c").find("a").should("have.attr", "href", "12345").and("contain.text", "12345");
  });
});

describe("A2 image column - display", () => {
  afterEach(() => tq.cleanup());

  it("valid URL renders an img with that src", () => {
    tq.app({ data: [{ c: "https://picsum.photos/40" }], columns: [col("c", "image")] });
    tq.cell(0, "c").find("img").should("have.attr", "src", "https://picsum.photos/40");
  });

  it("null/empty value renders no img (ImageRenderer returns null for falsy value)", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "image")] });
    tq.cell(0, "c").find("img").should("not.exist");
  });

  it("objectFit option is applied to the img style", () => {
    tq.app({
      data: [{ c: "https://picsum.photos/40" }],
      columns: [col("c", "image", { objectFit: "cover" })],
    });
    tq.cell(0, "c").find("img").should("have.css", "object-fit", "cover");
  });

  it("borderRadius option is applied to the img style", () => {
    tq.app({
      data: [{ c: "https://picsum.photos/40" }],
      columns: [col("c", "image", { borderRadius: "20" })],
    });
    tq.cell(0, "c").find("img").should("have.css", "border-radius", "20px");
  });

  it("broken image URL still sets src (browser shows broken-image icon, no crash)", () => {
    tq.app({ data: [{ c: "https://example.invalid/does-not-exist.png" }], columns: [col("c", "image")] });
    tq.cell(0, "c").find("img").should("have.attr", "src", "https://example.invalid/does-not-exist.png");
  });

  it("width/height column keys ARE honored by the renderer even though the inspector has no field for them", () => {
    // Renderer reads column.width / column.height (generateColumnsData.js "case 'image'") but
    // ColumnManager/PropertiesTabElements.jsx + StylesTabElements.jsx expose only objectFit/borderRadius for image.
    tq.app({
      data: [{ c: "https://picsum.photos/40" }],
      columns: [col("c", "image", { width: "60", height: "30" })],
    });
    tq.cell(0, "c").find("img").should("have.css", "width", "60px").and("have.css", "height", "30px");
  });
});
