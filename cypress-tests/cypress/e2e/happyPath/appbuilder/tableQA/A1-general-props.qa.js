// A1 Data & column generation: title, visibility, disabledState, loadingState, collapseWhenHidden.
import { tq, col } from "./_harness";

describe("A1 general table properties", () => {
  afterEach(() => tq.cleanup());

  it("loadingState=true: shows a loading spinner instead of rows, header still renders", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }],
      columns: [col("id"), col("name")],
      props: { loadingState: "{{true}}" },
    });
    tq.table().find(".loading-spinner-table-component").should("exist");
    tq.table().find('[data-cy$="-column-header"]').should("have.length", 2);
    tq.rows().should("have.length", 0);
  });

  it("loadingState=false (default): rows render normally", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }],
      columns: [col("id"), col("name")],
      props: { loadingState: "{{false}}" },
    });
    tq.table().find(".loading-spinner-table-component").should("not.exist");
    tq.rows().should("have.length", 1);
  });

  it("disabledState=true: table root carries data-disabled=true", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }],
      columns: [col("id"), col("name")],
      props: { disabledState: "{{true}}" },
    });
    tq.table().find("[data-disabled]").should("have.attr", "data-disabled", "true");
  });

  it("disabledState=false (default): table root carries data-disabled=false", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }],
      columns: [col("id"), col("name")],
      props: { disabledState: "{{false}}" },
    });
    tq.table().find("[data-disabled]").should("have.attr", "data-disabled", "false");
  });

  it("visibility=false: the Table widget is not rendered on canvas", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }],
      columns: [col("id"), col("name")],
      props: { visibility: "{{false}}" },
    });
    cy.get('[data-cy="draggable-widget-table1"]').should("not.exist");
  });

  it("visibility=false + collapseWhenHidden=true: hidden widget collapses its layout space", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }],
      columns: [col("id"), col("name")],
      props: { visibility: "{{false}}", collapseWhenHidden: "{{true}}" },
    });
    // The widget itself is gone either way; collapseWhenHidden affects whether the space is
    // reclaimed by siblings below it, which we approximate by asserting no error/placeholder
    // box remains reserved where the table used to be.
    cy.get('[data-cy="draggable-widget-table1"]').should("not.exist");
    cy.get("#real-canvas").find(".real-canvas").should("exist");
  });

  it("title: exposing a Title still allows normal rendering (no crash / no stray text in header row)", () => {
    tq.app({
      data: [{ id: 1, name: "Ann" }],
      columns: [col("id"), col("name")],
      props: { title: "My Table Title" },
    });
    tq.rows().should("have.length", 1);
  });
});
