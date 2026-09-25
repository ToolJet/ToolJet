// A7 Styles & layout states: dynamicHeight, visibility/collapseWhenHidden, disabledState, loadingState,
// hideColumnSelectorButton, toolbar button show/hide combos, long text overflow (contentWrap).
import { tq, col } from "./_harness";

const DATA = [{ id: 1, note: "hi" }];
const LONG_TEXT = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore";

describe("A7 layout & interaction states", () => {
  afterEach(() => tq.cleanup());

  it("visibility=false hides the table (display:none) in the editor", () => {
    tq.app({ data: DATA, columns: [col("id")], props: { visibility: "{{false}}" } });
    tq.table().should("have.css", "display", "none");
  });

  it("disabledState blocks interaction: table becomes inert + data-disabled", () => {
    tq.app({ data: DATA, columns: [col("id")], props: { disabledState: "{{true}}" } });
    tq.table().should("have.attr", "data-disabled", "true");
    tq.table().then(($t) => expect($t[0].inert).to.eq(true));
  });

  it("loadingState shows the loading spinner, hides rows, and collapses the header to a shimmer", () => {
    tq.app({
      data: DATA,
      columns: [col("id")],
      props: { loadingState: "{{true}}", displaySearchBox: "{{true}}" },
    });
    tq.table().find(".loading-spinner-table-component").should("be.visible");
    tq.table().find("tbody tr").should("not.exist");
    // header search input should not be interactive while loading (Loader shimmer instead)
    tq.table().find('[data-cy="table1-search-input-field"]').should("not.exist");
  });

  it("hideColumnSelectorButton hides only the manage-columns button", () => {
    tq.app({ data: DATA, columns: [col("id")], props: { hideColumnSelectorButton: "{{true}}", enablePagination: "{{true}}" } });
    tq.table().find('[data-cy="table1-manage-columns-button"]').should("not.exist");
    tq.table().find('[data-cy="pagination-section"]').should("exist");
  });

  it("header bar collapses when both search and filter are hidden", () => {
    tq.app({
      data: DATA,
      columns: [col("id")],
      props: { displaySearchBox: "{{false}}", showFilterButton: "{{false}}" },
    });
    tq.table().find('.table-card-header').should("not.exist");
  });

  it("header bar shows when only one of search/filter is enabled", () => {
    tq.app({
      data: DATA,
      columns: [col("id")],
      props: { displaySearchBox: "{{false}}", showFilterButton: "{{true}}" },
    });
    tq.table().find('.table-card-header').should("exist");
    tq.table().find('[data-cy="table1-filter-button"]').should("exist");
    tq.table().find('[data-cy="table1-search-input-field"]').should("not.exist");
  });

  it("footer collapses when pagination, add-row, download, refresh are off and column selector is hidden", () => {
    tq.app({
      data: DATA,
      columns: [col("id")],
      props: {
        enablePagination: "{{false}}",
        showAddNewRowButton: "{{false}}",
        showDownloadButton: "{{false}}",
        showRefreshButton: "{{false}}",
        hideColumnSelectorButton: "{{true}}",
      },
    });
    tq.table().find('[data-cy="pagination-section"]').should("not.exist");
    tq.table().find('[data-cy="table1-add-new-row-button"]').should("not.exist");
    tq.table().find('[data-cy="table1-file-download-button"]').should("not.exist");
    tq.table().find('[data-cy="table1-manage-columns-button"]').should("not.exist");
  });

  it("footer stays visible when only showRefreshButton is on (others off)", () => {
    tq.app({
      data: DATA,
      columns: [col("id")],
      props: {
        enablePagination: "{{false}}",
        showAddNewRowButton: "{{false}}",
        showDownloadButton: "{{false}}",
        showRefreshButton: "{{true}}",
        hideColumnSelectorButton: "{{true}}",
      },
    });
    tq.table().find('[data-cy="table1-refresh-button"]').should("exist");
  });

  it("long text: contentWrap off truncates the cell (overflow-hidden class, nowrap)", () => {
    tq.app({
      data: [{ id: 1, note: LONG_TEXT }],
      columns: [col("note", "string")],
      styles: { contentWrap: "{{false}}" },
    });
    tq.cell(0, "note").should("have.class", "overflow-hidden").and("have.css", "white-space", "nowrap");
  });

  it("long text: contentWrap on wraps the cell (wrap-wrapper class, not overflow-hidden)", () => {
    tq.app({
      data: [{ id: 1, note: LONG_TEXT }],
      columns: [col("note", "string")],
      styles: { contentWrap: "{{true}}" },
    });
    tq.cell(0, "note").should("have.class", "wrap-wrapper").and("not.have.class", "overflow-hidden");
  });

  // dynamicHeight only takes effect when currentMode === 'view' (frontend/src/AppBuilder/Widgets/NewTable/Table.jsx),
  // so we have to go through the live preview, not the editor canvas, to see any effect. Each case gets its own
  // app/it() and writes its measured height to a shared file so the next test can compare against it.
  const FEW = [{ id: 1, note: "a" }, { id: 2, note: "b" }];
  const MANY = Cypress._.times(60, (i) => ({ id: i, note: `row ${i}` }));
  const heightFile = (name) => `cypress/e2e/happyPath/appbuilder/tableQA/logs/.a7-${name}.json`;

  const measurePreviewHeight = (data, dynamicHeight, fileName) => {
    tq.app({ data, columns: [col("id"), col("note")], props: { dynamicHeight: `{{${dynamicHeight}}}` }, height: 200 });
    cy.get("body").then(($body) => {
      if ($body.find('[data-cy="editor-preview-button"]').length) {
        cy.openInCurrentTab('[data-cy="editor-preview-button"]');
      }
    });
    cy.get('[data-cy="draggable-widget-table1"]', { timeout: 20000 })
      .should("be.visible")
      .then(($t) => cy.writeFile(heightFile(fileName), { height: $t[0].getBoundingClientRect().height }));
  };

  it("dynamicHeight=true, few rows (view mode): measure height", () => {
    measurePreviewHeight(FEW, true, "dyn-on-few");
  });

  it("dynamicHeight=true, many rows (view mode): height is at least as tall as few rows", () => {
    measurePreviewHeight(MANY, true, "dyn-on-many");
    cy.readFile(heightFile("dyn-on-few")).then(({ height: fewHeight }) => {
      cy.readFile(heightFile("dyn-on-many")).then(({ height: manyHeight }) => {
        cy.log(`dynamicHeight=true heights -> few:${fewHeight} many:${manyHeight}`);
        expect(manyHeight, "many-row table should be at least as tall as the few-row table").to.be.gte(fewHeight);
      });
    });
  });

  it("dynamicHeight=false, few rows (view mode): measure height", () => {
    measurePreviewHeight(FEW, false, "dyn-off-few");
  });

  it("dynamicHeight=false, many rows (view mode): height stays fixed regardless of row count", () => {
    measurePreviewHeight(MANY, false, "dyn-off-many");
    cy.readFile(heightFile("dyn-off-few")).then(({ height: fewHeight }) => {
      cy.readFile(heightFile("dyn-off-many")).then(({ height: manyHeight }) => {
        cy.log(`dynamicHeight=false heights -> few:${fewHeight} many:${manyHeight}`);
        expect(Math.abs(manyHeight - fewHeight), "fixed height should not grow with row count").to.be.lte(2);
      });
    });
  });
});
