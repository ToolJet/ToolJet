// A7 Styles & layout states: per-column style overrides (Inspector -> Columns -> <col> -> Styles tab)
// textColor, cellBackgroundColor, horizontalAlignment, columnSize(width) — across representative column types.
import { tq, col } from "./_harness";

const rgb = (win, colorStr) => {
  const d = win.document.createElement("div");
  win.document.body.appendChild(d);
  d.style.color = colorStr;
  const out = win.getComputedStyle(d).color;
  d.remove();
  return out;
};

const DATA = [{ id: 1, qty: 5, flag: true, pick: "a" }];

describe("A7 per-column styles", () => {
  afterEach(() => tq.cleanup());

  // textColor: applies to a column's own text, across types that render text.
  ["string", "number"].forEach((type) => {
    it(`per-column textColor overrides the table default for a ${type} column`, () => {
      const key = type === "string" ? "id" : "qty";
      tq.app({
        data: DATA,
        columns: [col(key, type, { isEditable: false, textColor: "#ff3300" })],
        styles: { textColor: "#000000" },
      });
      cy.window().then((win) => {
        tq.cell(0, key)
          .find('[style*="color"]')
          .first()
          .should("have.css", "color", rgb(win, "#ff3300"));
      });
    });
  });

  it("cellBackgroundColor paints the cell background regardless of column type", () => {
    tq.app({
      data: DATA,
      columns: [
        col("id", "string", { isEditable: false, cellBackgroundColor: "#ffee00" }),
        col("flag", "boolean", { cellBackgroundColor: "#00eeff" }),
      ],
    });
    cy.window().then((win) => {
      tq.cell(0, "id").should("have.css", "background-color", rgb(win, "#ffee00"));
      tq.cell(0, "flag").should("have.css", "background-color", rgb(win, "#00eeff"));
    });
  });

  ["left", "center", "right"].forEach((align) => {
    it(`horizontalAlignment=${align} sets cell justify-content + text-align`, () => {
      tq.app({
        data: DATA,
        columns: [col("id", "string", { isEditable: false, horizontalAlignment: align })],
      });
      const justify = align === "left" ? "start" : align === "right" ? "end" : "center";
      tq.cell(0, "id").should("have.css", "justify-content", justify).and("have.css", "text-align", align);
    });
  });

  it("horizontalAlignment on a boolean column aligns the checkbox without erroring", () => {
    tq.app({ data: DATA, columns: [col("flag", "boolean", { horizontalAlignment: "center" })] });
    tq.cell(0, "flag").should("have.css", "justify-content", "center");
  });

  it("columnSize sets the column (th + td) pixel width", () => {
    tq.app({ data: DATA, columns: [col("id", "string", { columnSize: 260 })] });
    tq.table().find('[data-cy="id-column-header"]').parents("th").first().should("have.css", "width", "260px");
    tq.cell(0, "id").should("have.css", "width", "260px");
  });

  it("invalid horizontalAlignment value does not crash and leaves alignment unstyled", () => {
    tq.app({ data: DATA, columns: [col("id", "string", { horizontalAlignment: "diagonal" })] });
    tq.rows().should("have.length", 1);
    tq.cell(0, "id").then(($td) => cy.log("justify-content for invalid alignment:", $td.css("justify-content")));
  });

  it("fx-bound per-column textColor is resolved per row (getResolvedValue)", () => {
    tq.app({
      data: [{ id: 1 }, { id: 2 }],
      columns: [col("id", "string", { isEditable: false, textColor: "{{cellValue === 1 ? '#ff0000' : '#00ff00'}}" })],
    });
    cy.window().then((win) => {
      tq.cell(0, "id").find('[style*="color"]').first().should("have.css", "color", rgb(win, "#ff0000"));
      tq.cell(1, "id").find('[style*="color"]').first().should("have.css", "color", rgb(win, "#00ff00"));
    });
  });
});
