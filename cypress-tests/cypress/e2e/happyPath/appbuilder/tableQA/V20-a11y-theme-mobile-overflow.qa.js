// Keyboard + accessibility basics, dark mode, mobile/preview layout, long-text overflow, dynamic height.
import { tq, col, recorder, probe } from "./_obs";

const R = recorder("v20-results.json");
const lum = (rgb) => { const m = (rgb || "").match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map((v) => { v = +v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const la = lum(a), lb = lum(b); if (la == null || lb == null) return null; return +(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)).toFixed(2)); };
const bgOf = (el) => { while (el) { const b = getComputedStyle(el).backgroundColor; if (b && b !== "rgba(0, 0, 0, 0)" && b !== "transparent") return b; el = el.parentElement; } return "rgb(255, 255, 255)"; };

describe("V20 keyboard, a11y, dark mode, mobile, overflow", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("accessibility basics: roles, names on icon buttons, keyboard focus and edit", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }, { id: 2, name: "Bob" }], columns: [col("id", "number"), col("name", "string", { isEditable: true })],
      probes: { cs: "{{JSON.stringify(components.table1.changeSet)}}" },
      props: { defaultSelectedRow: "{{undefined}}", showAddNewRowButton: "{{true}}", showRefreshButton: "{{true}}" } });
    cy.document().then((doc) => {
      const t = doc.querySelector('[data-cy="draggable-widget-table1"]');
      const table = t.querySelector("table");
      const btns = [...t.querySelectorAll("button")];
      R.push({
        id: "a11y:structure", tableEl: !!table, roleTable: table?.getAttribute("role"), th: t.querySelectorAll("th").length, thScope: [...t.querySelectorAll("th")].filter((h) => h.getAttribute("scope")).length,
        ariaSort: [...t.querySelectorAll("th")].filter((h) => h.hasAttribute("aria-sort")).length,
        unnamedButtons: btns.filter((b) => !b.innerText.trim() && !b.getAttribute("aria-label") && !b.getAttribute("title")).map((b) => b.getAttribute("data-cy") || b.className.slice(0, 30)),
        searchLabel: t.querySelector('[data-cy="table1-search-input-field"]')?.getAttribute("aria-label") || t.querySelector('[data-cy="table1-search-input-field"]')?.getAttribute("placeholder"),
        checkboxLabels: [...t.querySelectorAll('input[type="checkbox"]')].filter((c) => !c.getAttribute("aria-label") && !c.labels?.length).length,
      });
    });
    // keyboard: focus search, Tab into table, Enter on an editable cell
    cy.get('[data-cy="table1-search-input-field"]').focus();
    cy.realPress ? null : null;
    cy.get('[data-cy="table1-search-input-field"]').trigger("keydown", { key: "Tab", keyCode: 9 });
    cy.document().then((doc) => R.push({ id: "kbd:focus after Tab from search (synthetic)", active: doc.activeElement?.getAttribute("data-cy") || doc.activeElement?.tagName }));
    cy.document().then((doc) => {
      const focusables = [...doc.querySelectorAll('[data-cy="draggable-widget-table1"] [tabindex], [data-cy="draggable-widget-table1"] button, [data-cy="draggable-widget-table1"] input')];
      const cellFocusable = [...doc.querySelectorAll('[data-cy^="table1-name-row-"] [tabindex], [data-cy^="table1-name-row-"][tabindex]')].length;
      R.push({ id: "kbd:focusable elements", total: focusables.length, editableCellsFocusable: cellFocusable });
    });
    cy.get('[data-cy="table1-name-row-0"]').find(".long-text-input").focus().trigger("keydown", { key: "Enter", keyCode: 13, force: true });
    cy.wait(300);
    cy.document().then((doc) => R.push({ id: "kbd:Enter on focused cell opens editor?", editing: !!doc.querySelector('[data-cy="table1-name-row-0"] [contenteditable="true"]:focus'), anyCE: !!doc.querySelector('[data-cy="table1-name-row-0"] [contenteditable="true"]') }));
  });

  it("dark mode: text/background contrast of cells, header, toolbar, footer", () => {
    cy.window().then((w) => w.localStorage.setItem("darkMode", "true"));
    tq.app({ data: [{ id: 1, name: "Ada", ok: true, s: "red" }], columns: [col("id", "number"), col("name"), col("ok", "boolean"), col("s", "select", { options: [{ label: "Red", value: "red" }] })],
      props: { defaultSelectedRow: "{{undefined}}", showAddNewRowButton: "{{true}}" } });
    cy.window().then((w) => w.localStorage.setItem("darkMode", "true"));
    cy.reload();
    cy.get('[data-cy="draggable-widget-table1"]', { timeout: 30000 });
    cy.wait(1500);
    cy.document().then((doc) => {
      const pick = (sel) => { const el = doc.querySelector(sel); if (!el) return { missing: sel }; const c = getComputedStyle(el).color, b = bgOf(el); return { color: c, bg: b, contrast: contrast(c, b) }; };
      R.push({ id: "dark:body class", dark: doc.body.className.includes("dark") || doc.documentElement.className.includes("dark"), tableTheme: doc.querySelector(".jet-table")?.className });
      R.push({ id: "dark:cell text", ...pick('[data-cy="table1-name-row-0"] .long-text-input, [data-cy="table1-name-row-0"] span') });
      R.push({ id: "dark:header", ...pick('[data-cy="name-column-header"]') });
      R.push({ id: "dark:footer count", ...pick('[data-cy="footer-number-of-records"]') });
      R.push({ id: "dark:search input", ...pick('[data-cy="table1-search-input-field"]') });
      R.push({ id: "dark:select value", ...pick('[data-cy="table1-s-row-0"] [class*="singleValue"], [data-cy="table1-s-row-0"] .react-select__single-value, [data-cy="table1-s-row-0"] div') });
    });
    cy.window().then((w) => w.localStorage.setItem("darkMode", "false"));
  });

  it("mobile viewport in preview + dynamic height with many rows + long-text overflow", () => {
    const long = "This is a very long piece of text that will certainly not fit inside a normal table cell width at all";
    tq.app({ data: Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: i === 0 ? long : `N${i + 1}` })), columns: [col("id", "number"), col("name")],
      props: { defaultSelectedRow: "{{undefined}}", dynamicHeight: "{{true}}", enablePagination: "{{false}}" } });
    cy.document().then((doc) => {
      const t = doc.querySelector('[data-cy="draggable-widget-table1"]');
      R.push({ id: "dynheight:30 rows, pagination off", widgetHeight: t.getBoundingClientRect().height, rowsInDom: doc.querySelectorAll('[data-cy^="table1-row-"]').length });
    });
    cy.get('[data-cy="table1-name-row-0"]').trigger("mouseover", { force: true }).trigger("mouseenter", { force: true });
    cy.wait(700);
    cy.document().then((doc) => {
      const cell = doc.querySelector('[data-cy="table1-name-row-0"]');
      const txt = cell.querySelector(".long-text-input, span, div");
      R.push({ id: "overflow:long text cell", truncated: txt ? txt.scrollWidth > txt.clientWidth + 1 : null, overlays: [...doc.querySelectorAll('[class*="overlay"], [role="tooltip"]')].map((e) => e.innerText.trim().slice(0, 60)).filter(Boolean).slice(0, 3) });
    });
    cy.viewport(390, 844);
    cy.openPreview();
    cy.wait(2500);
    cy.document().then((doc) => {
      const t = doc.querySelector('[data-cy="draggable-widget-table1"]');
      R.push({ id: "mobile:preview 390px", exists: !!t, width: t?.getBoundingClientRect().width, overflowX: t ? t.scrollWidth > t.clientWidth + 1 : null, pageScrollsX: doc.documentElement.scrollWidth > doc.documentElement.clientWidth + 1, toolbarVisible: !!doc.querySelector('[data-cy="table1-search-input-field"]')?.offsetParent });
    });
  });
});
