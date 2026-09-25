// Close-out: onFilterChanged / onTableDataDownload / onExpand, edit under search, Styles-tab fields per type,
// dynamic-options loading state. Observe-only -> logs/v13-results.json
import { tq, col, OPTS, PROBES, recorder, probe } from "./_obs";
import { addFilter } from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";

const R = recorder("v13-results.json");
const toasts = (doc, p) => [...doc.querySelectorAll('[role="status"]')].map((e) => e.innerText.trim()).filter((t) => t.startsWith(p));
const count = (id, p, extra = {}) => cy.wait(900).then(() => cy.document().then((doc) => R.push({ id, fired: toasts(doc, p).length, messages: toasts(doc, p).slice(0, 4), ...extra })));
const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `N${i + 1}`, note: `note${i + 1}` }));
const TYPES = ["string", "number", "text", "datepicker", "select", "newMultiSelect", "tagsV2", "boolean", "image", "link", "json", "markdown", "html", "rating", "button"];

describe("V13 close-out", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("onFilterChanged: apply a filter, then clear filters", () => {
    tq.app({ data: rows(4), columns: [col("id", "number"), col("name")], props: { defaultSelectedRow: "{{undefined}}" },
      events: [{ eventId: "onFilterChanged", message: "FILTER:{{JSON.stringify(components.table1.filters)}}" }] });
    addFilter([{ column: "name", operation: "contains", value: "N2" }], true);
    count("onFilterChanged: apply name contains N2", "FILTER", { rowsShown: null });
    cy.document().then((doc) => R.push({ id: "filter: rows shown", rows: doc.querySelectorAll('[data-cy^="table1-row-"]').length }));
    cy.get('[data-cy="table1-filter-button"]').click({ force: true });
    cy.get('[data-cy="button-clear-filters"]').click({ force: true });
    cy.get('[data-cy="close-filters-button"]').click({ force: true });
    count("onFilterChanged: after clear filters (cumulative)", "FILTER");
  });

  it("onTableDataDownload: CSV, Excel", () => {
    tq.app({ data: rows(3), columns: [col("id", "number"), col("name")], props: { defaultSelectedRow: "{{undefined}}" },
      events: [{ eventId: "onTableDataDownload", message: "DOWNLOAD:" }] });
    cy.get('[data-cy="table1-file-download-button"]').click({ force: true });
    cy.get('[data-cy="option-download-as-csv"]').click({ force: true });
    count("onTableDataDownload: CSV", "DOWNLOAD");
    cy.get('[data-cy="table1-file-download-button"]').click({ force: true });
    cy.get('[data-cy="option-download-as-excel"]').click({ force: true });
    count("onTableDataDownload: + Excel (cumulative)", "DOWNLOAD");
  });

  it("onExpand: expand row 1, collapse it, expand row 2", () => {
    tq.app({ data: rows(3), columns: [col("id", "number"), col("name")],
      props: { defaultSelectedRow: "{{undefined}}", enableExpandableRows: "{{true}}" },
      probes: { ex: "{{JSON.stringify({last: components.table1.lastExpandedRow, cur: components.table1.currentExpandedRows})}}" },
      events: [{ eventId: "onExpand", message: "EXPAND:{{components.table1.lastExpandedRow}}" }] });
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    count("onExpand: expand row 1", "EXPAND");
    cy.document().then((doc) => R.push({ id: "expand: exposed after row 1", ex: probe(doc, "ex") }));
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    count("onExpand: collapse row 1 (cumulative, expect unchanged)", "EXPAND");
    cy.document().then((doc) => R.push({ id: "expand: exposed after collapse", ex: probe(doc, "ex") }));
    cy.get("button.table-expansion-toggle").eq(1).click({ force: true });
    count("onExpand: expand row 2 (cumulative)", "EXPAND");
    cy.document().then((doc) => R.push({ id: "expand: exposed after row 2", ex: probe(doc, "ex") }));
  });

  it("edit while a search is active lands on the matching record", () => {
    tq.app({ data: rows(8), width: 40, probes: PROBES, columns: [col("id", "number"), col("name"), col("note", "string", { isEditable: true })], props: { defaultSelectedRow: "{{undefined}}" } });
    cy.get('[data-cy="table1-search-input-field"]').type("N7", { force: true });
    cy.wait(600);
    cy.document().then((doc) => R.push({ id: "search: visible rows", ids: [...doc.querySelectorAll('[data-cy^="table1-id-row-"]')].map((e) => e.getAttribute("data-cy") + "=" + e.innerText.trim()) }));
    cy.get('[data-cy^="table1-note-row-"]').first().find(".long-text-input").click({ force: true });
    cy.get('[data-cy^="table1-note-row-"]').first().find('[contenteditable="true"]').type("{selectall}{backspace}EDIT-SEARCH", { force: true });
    cy.get('[data-cy^="table1-name-row-"]').first().click({ force: true });
    cy.wait(500);
    cy.document().then((doc) => R.push({ id: "search: after edit", cs: probe(doc, "cs") }));
    cy.get('[data-cy="table1-search-clear-icon"]').click({ force: true });
    cy.wait(500);
    cy.document().then((doc) => R.push({ id: "search: row id7 note after clearing search", note7: doc.querySelector('[data-cy="table1-note-row-6"]')?.innerText.trim(), note1: doc.querySelector('[data-cy="table1-note-row-0"]')?.innerText.trim() }));
  });

  TYPES.forEach((type) =>
    it(`Styles tab fields: ${type}`, () => {
      tq.app({ data: [{ c: null }], columns: [col("c", type, { options: OPTS, buttons: [{ id: "b1", buttonLabel: "Go" }] })], props: { defaultSelectedRow: "{{undefined}}" } });
      openEditorSidebar("table1");
      cy.get('[data-cy="column-c"]', { timeout: 10000 }).first().click({ force: true });
      cy.wait(600);
      cy.get(".table-column-popover .popover-header").contains(/^Styles$/).click({ force: true });
      cy.wait(600);
      cy.document().then((doc) => {
        const body = doc.querySelector(".table-column-popover.popover-body");
        R.push({ id: `styles-tab:${type}`, labels: body ? [...new Set(body.innerText.split("\n").map((t) => t.trim()).filter((t) => t && t.length < 40))] : null });
      });
    })
  );

  it("dynamic options loading state: cell and open dropdown", () => {
    tq.app({
      data: [{ l: "d1" }], width: 30,
      columns: [col("l", "select", { useDynamicOptions: true, dynamicOptions: "{{[{label: 'Dyn One', value: 'd1'}]}}", optionsLoadingState: "{{true}}", isEditable: true })],
      props: { defaultSelectedRow: "{{undefined}}" },
    });
    cy.document().then((doc) => R.push({ id: "loading: cell", text: doc.querySelector('td[data-cy="table1-l-row-0"]')?.innerText.trim(), loaderEls: doc.querySelectorAll('td[data-cy="table1-l-row-0"] [class*="load"], td[data-cy="table1-l-row-0"] [class*="spin"]').length }));
    tq.cell(0, "l").find(".react-select__control").click({ force: true });
    cy.wait(500);
    cy.document().then((doc) => R.push({ id: "loading: open menu", menuText: [...doc.querySelectorAll('[class*="menu"]')].map((e) => e.innerText.trim()).filter(Boolean).slice(0, 3), loaderEls: doc.querySelectorAll('[class*="menu"] [class*="load"], [class*="menu"] [class*="spin"], [class*="loadingIndicator"], [class*="LoadingIndicator"]').length }));
  });
});
