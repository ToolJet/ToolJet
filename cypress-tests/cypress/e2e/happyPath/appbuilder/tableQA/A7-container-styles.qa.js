// A7 Styles & layout states: table-level style keys -> computed CSS.
// tableType, cellSize, headerCasing, contentWrap+maxRowHeight(+Value), columnHeaderWrap,
// textColor, columnTitleColor, columnBackgroundColor, selectedRowColor, containerBackgroundColor,
// borderColor, borderRadius, boxShadow, actionButtonRadius, padding, + dark theme.
// One tq.app() per it() (data-driven cases) to keep each test independent and easy to triage.
import { tq, col } from "./_harness";

const DATA = [{ id: 1, note: "hello" }];
const COLS = [col("id"), col("note", "string", { isEditable: true })];

// Resolve any CSS color string to its browser-normalized rgb() the same way the DOM would.
const rgb = (win, colorStr) => {
  const d = win.document.createElement("div");
  win.document.body.appendChild(d);
  d.style.color = colorStr;
  const out = win.getComputedStyle(d).color;
  d.remove();
  return out;
};

describe("A7 container-level styles", () => {
  afterEach(() => tq.cleanup());

  [
    { tableType: "table-classic", cls: "table-classic" },
    { tableType: "table-bordered", cls: "table-bordered" },
    { tableType: "table-striped", cls: "table-striped" },
  ].forEach(({ tableType, cls }) => {
    it(`tableType=${tableType} sets the row-style class on <table>`, () => {
      tq.app({ data: DATA, columns: COLS, styles: { tableType } });
      tq.table().find("table").should("have.class", cls);
    });
  });

  [
    { cellSize: "regular", minHeight: "45px" },
    { cellSize: "condensed", minHeight: "39px" },
    { cellSize: "bogus-value", minHeight: "45px" }, // invalid falls back to regular
  ].forEach(({ cellSize, minHeight }) => {
    it(`cellSize=${cellSize} sets row min-height to ${minHeight}`, () => {
      tq.app({ data: DATA, columns: COLS, styles: { cellSize } });
      tq.rows().first().should("have.css", "min-height", minHeight);
    });
  });

  [
    { headerCasing: "uppercase", transform: "uppercase" },
    { headerCasing: "none", transform: "none" },
    { headerCasing: "bogus", transform: "none" }, // invalid falls back to none
  ].forEach(({ headerCasing, transform }) => {
    it(`headerCasing=${headerCasing} sets header text-transform to ${transform}`, () => {
      tq.app({ data: DATA, columns: COLS, styles: { headerCasing } });
      tq.table().find('[data-cy="id-column-header"]').should("have.css", "text-transform", transform);
    });
  });

  it("columnHeaderWrap=fixed truncates the header (text-truncate, nowrap)", () => {
    tq.app({ data: DATA, columns: COLS, styles: { columnHeaderWrap: "fixed" } });
    tq.table()
      .find('[data-cy="id-column-header"]')
      .should("have.class", "text-truncate")
      .and("have.css", "white-space", "nowrap");
  });

  it("columnHeaderWrap=wrap wraps the header (wrap-wrapper, normal)", () => {
    tq.app({ data: DATA, columns: COLS, styles: { columnHeaderWrap: "wrap" } });
    tq.table()
      .find('[data-cy="id-column-header"]')
      .should("have.class", "wrap-wrapper")
      .and("have.css", "white-space", "normal");
  });

  it("contentWrap off: row max-height/height driven by cellSize only", () => {
    tq.app({ data: DATA, columns: COLS, styles: { contentWrap: "{{false}}", cellSize: "regular" } });
    tq.rows().first().should("have.css", "max-height", "45px").and("have.css", "height", "45px");
  });

  it("contentWrap on + maxRowHeight auto: row max-height is fit-content (not clipped)", () => {
    tq.app({ data: DATA, columns: COLS, styles: { contentWrap: "{{true}}", maxRowHeight: "auto" } });
    tq.rows()
      .first()
      .should(($row) => {
        expect($row.css("max-height")).to.not.eq("45px");
      });
  });

  it("contentWrap on + maxRowHeight custom + maxRowHeightValue: row max-height equals the custom value", () => {
    tq.app({
      data: DATA,
      columns: COLS,
      styles: { contentWrap: "{{true}}", maxRowHeight: "custom", maxRowHeightValue: "{{120}}" },
    });
    tq.rows().first().should("have.css", "max-height", "120px");
  });

  it("maxRowHeightValue: non-numeric value produces an invalid max-height (no clamp, no error)", () => {
    tq.app({
      data: DATA,
      columns: COLS,
      styles: { contentWrap: "{{true}}", maxRowHeight: "custom", maxRowHeightValue: "{{'abc'}}" },
    });
    // A user-entered non-numeric custom max row height silently produces an invalid CSS value
    // (browser ignores it) instead of being validated/clamped/erroring.
    tq.rows()
      .first()
      .then(($row) => cy.log("computed max-height for maxRowHeightValue='abc':", $row.css("max-height")));
  });

  it("columnTitleColor + columnBackgroundColor paint the header cell (th)", () => {
    tq.app({
      data: DATA,
      columns: COLS,
      styles: { columnTitleColor: "#ff0000", columnBackgroundColor: "#00ff00" },
    });
    cy.window().then((win) => {
      tq.table()
        .find('[data-cy="id-column-header"]')
        .parents("th")
        .first()
        .should("have.css", "color", rgb(win, "#ff0000"))
        .and("have.css", "background-color", rgb(win, "#00ff00"));
    });
  });

  it("textColor (table default) paints cell text when the column has no per-column color override", () => {
    tq.app({ data: DATA, columns: COLS, styles: { textColor: "#123456" } });
    cy.window().then((win) => {
      tq.cell(0, "note")
        .find(".text-container")
        .should("have.css", "color", rgb(win, "#123456"));
    });
  });

  it("containerBackgroundColor paints the table container background", () => {
    tq.app({ data: DATA, columns: COLS, styles: { containerBackgroundColor: "#0000ff" } });
    cy.window().then((win) => {
      tq.table().should("have.css", "background-color", rgb(win, "#0000ff"));
    });
  });

  it("borderColor paints the table container border", () => {
    tq.app({ data: DATA, columns: COLS, styles: { borderColor: "#ff00ff" } });
    cy.window().then((win) => {
      tq.table().should("have.css", "border-top-color", rgb(win, "#ff00ff"));
    });
  });

  it("borderRadius: valid numeric value applies px radius", () => {
    tq.app({ data: DATA, columns: COLS, styles: { borderRadius: "20" } });
    tq.table().should("have.css", "border-top-left-radius", "20px");
  });

  it("borderRadius: non-numeric value silently drops the radius instead of erroring", () => {
    tq.app({ data: DATA, columns: COLS, styles: { borderRadius: "not-a-number" } });
    tq.table().then(($t) => {
      const radius = $t.css("border-top-left-radius");
      cy.log("computed border-radius for borderRadius='not-a-number':", radius);
      expect(radius).to.eq("0px");
    });
  });

  it("boxShadow applies a custom shadow to the table container", () => {
    tq.app({ data: DATA, columns: COLS, styles: { boxShadow: "4px 4px 10px 0px #ff0000" } });
    tq.table().should(($t) => {
      expect($t.css("box-shadow")).to.contain("4px 4px 10px 0px");
    });
  });

  it("padding=default: record baseline cell spacing for comparison against padding=none", () => {
    tq.app({ data: DATA, columns: COLS, styles: { padding: "default" } });
    tq.cell(0, "note").then(($cell) => {
      const computed = { padding: $cell.css("padding"), height: $cell.css("height") };
      cy.log("padding=default computed:", JSON.stringify(computed));
      cy.writeFile("cypress/e2e/happyPath/appbuilder/tableQA/logs/.a7-padding-default.json", computed);
    });
  });

  it("padding=none has no observable effect on cell spacing vs default (dead control)", () => {
    tq.app({ data: DATA, columns: COLS, styles: { padding: "none" } });
    cy.readFile("cypress/e2e/happyPath/appbuilder/tableQA/logs/.a7-padding-default.json").then((withDefault) => {
      tq.cell(0, "note").then(($cell) => {
        const withNone = { padding: $cell.css("padding"), height: $cell.css("height") };
        cy.log("padding=default ->", JSON.stringify(withDefault), " padding=none ->", JSON.stringify(withNone));
        expect(withNone, "padding style (Default/None) should change computed cell padding but doesn't").to.deep.equal(
          withDefault
        );
      });
    });
  });

  it("actionButtonRadius controls row action-button border radius", () => {
    tq.app({
      data: DATA,
      columns: COLS,
      props: {
        actions: [
          { name: "a1", buttonText: "Go", backgroundColor: "#000000", textColor: "#ffffff", disableActionButton: false },
        ],
      },
      styles: { actionButtonRadius: "12" },
    });
    tq.rows().first().find(".action-button").should("have.css", "border-radius", "12px");
  });

  it("selectedRowColor paints a selected row when allowSelection + highlightSelectedRow are on", () => {
    tq.app({
      data: [{ id: 1, note: "a" }, { id: 2, note: "b" }],
      columns: COLS,
      props: { allowSelection: "{{true}}", highlightSelectedRow: "{{true}}" },
      styles: { selectedRowColor: "#abcdef" },
    });
    tq.rows().first().click();
    cy.window().then((win) => {
      tq.rows().first().should("have.class", "selected").and("have.css", "background-color", rgb(win, "#abcdef"));
    });
  });

  it("dark theme: table root switches from light-theme to dark-theme class", () => {
    tq.app({ data: DATA, columns: COLS });
    tq.table().should("have.class", "light-theme");
    cy.window().then((win) => win.localStorage.setItem("darkMode", "true"));
    cy.reload();
    tq.table().should("have.class", "dark-theme");
  });
});
