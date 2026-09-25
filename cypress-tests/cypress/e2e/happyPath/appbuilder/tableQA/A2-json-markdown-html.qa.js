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

// A2 Column types (display): json, markdown, html
// Source refs:
//  - JSONRenderer: frontend/src/AppBuilder/Shared/DataTypes/renderers/JSONRenderer.jsx
//    Renders via {String(formatCellValue(value))} as a plain text node - never dangerouslySetInnerHTML
//    for the main cell content, so JSON values containing HTML/script text are always inert.
//  - MarkdownRenderer: .../MarkdownRenderer.jsx - DOMPurify.sanitize() then <ReactMarkdown>, which does
//    NOT render raw HTML by default (no rehype-raw plugin wired in) - only markdown syntax is rendered.
//  - HTMLRenderer: .../HTMLRenderer.jsx - DOMPurify.sanitize() then dangerouslySetInnerHTML - real HTML
//    elements are rendered, but dangerous tags/attrs (script, onerror, ...) are stripped by DOMPurify.

describe("A2 json column - display", () => {
  afterEach(() => tq.cleanup());

  it("valid object renders formatted key/values", () => {
    tq.app({ data: [{ c: { a: 1, b: "x" } }], columns: [col("c", "json")] });
    tq.cell(0, "c").invoke("text").should("contain", '"a"').and("contain", "1").and("contain", '"b"').and("contain", '"x"');
  });

  it("jsonIndentation=true pretty-prints with newlines", () => {
    tq.app({ data: [{ c: { a: 1 } }], columns: [col("c", "json", { jsonIndentation: "{{true}}" })] });
    tq.cell(0, "c").invoke("html").should("match", /\n/);
  });

  it("null value renders blank", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "json")] });
    tq.cell(0, "c").invoke("text").should("eq", "");
  });

  it("invalid JSON string is shown as-is (no crash, no \"undefined\")", () => {
    tq.app({ data: [{ c: "not json" }], columns: [col("c", "json")] });
    tq.cell(0, "c").invoke("text").should("eq", "not json");
  });

  it("HTML-special chars inside a JSON string value render as inert text, never as elements", () => {
    tq.app({ data: [{ c: { html: "<script>alert(1)</script>" } }], columns: [col("c", "json")] });
    tq.cell(0, "c").find("script").should("not.exist");
    tq.cell(0, "c").invoke("text").should("contain", "<script>alert(1)</script>");
  });
});

describe("A2 markdown column - display", () => {
  afterEach(() => tq.cleanup());

  it("markdown syntax is rendered (bold)", () => {
    tq.app({ data: [{ c: "**bold text**" }], columns: [col("c", "markdown")] });
    tq.cell(0, "c").find("strong").should("contain.text", "bold text");
  });

  it("null value renders blank", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "markdown")] });
    tq.cell(0, "c").invoke("text").should("eq", "");
  });

  it("raw <script> is never rendered as a live script element", () => {
    tq.app({ data: [{ c: "<script>alert(1)</script>" }], columns: [col("c", "markdown")] });
    tq.cell(0, "c").find("script").should("not.exist");
  });

  it("raw HTML tags are not rendered as real elements by default (no rehype-raw)", () => {
    tq.app({ data: [{ c: "<b>raw html bold</b>" }], columns: [col("c", "markdown")] });
    tq.cell(0, "c").find("b").should("not.exist");
  });
});

describe("A2 html column - display", () => {
  afterEach(() => tq.cleanup());

  it("valid plain text renders as-is", () => {
    tq.app({ data: [{ c: "Hello World" }], columns: [col("c", "html")] });
    tq.cell(0, "c").invoke("text").should("eq", "Hello World");
  });

  it("HTML tags are rendered as real elements", () => {
    tq.app({ data: [{ c: "<b>Bold</b>" }], columns: [col("c", "html")] });
    tq.cell(0, "c").find("b").should("contain.text", "Bold");
  });

  it("null value renders blank", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "html")] });
    tq.cell(0, "c").invoke("text").should("eq", "");
  });

  it("script tags are sanitized out by DOMPurify", () => {
    tq.app({ data: [{ c: "before<script>alert(1)</script>after" }], columns: [col("c", "html")] });
    tq.cell(0, "c").find("script").should("not.exist");
    tq.cell(0, "c").invoke("text").should("eq", "beforeafter");
  });

  it("dangerous event handler attributes are stripped by DOMPurify", () => {
    tq.app({ data: [{ c: '<img src="x" onerror="alert(1)">' }], columns: [col("c", "html")] });
    tq.cell(0, "c").find("img").should("not.have.attr", "onerror");
  });
});
