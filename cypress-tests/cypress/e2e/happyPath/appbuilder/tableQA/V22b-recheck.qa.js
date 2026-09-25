// Re-checks: throwing transformation vs safe one; timezone display (read-only text); dark mode via the real toggle.
import { tq, col, recorder, probe, cellFacts } from "./_obs";

const R = recorder(`v22b-results-${Cypress.env("TQ_TZ") || "local"}.json`);
const P = { cs: "{{JSON.stringify(components.table1.changeSet)}}", ud: "{{JSON.stringify(components.table1.updatedData)}}" };
const visible = (id) => cy.get("body").then(($b) => R.push({ id, tableRendered: $b.find('[data-cy="draggable-widget-table1"]').length > 0, rows: $b.find('[data-cy^="table1-row-"]').length }));

describe("V22b re-checks", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  [
    ["safe", "{{cellValue?.toUpperCase?.() ?? cellValue}}", [{ id: 1, name: "ada" }]],
    ["throws-on-null-row", "{{cellValue.toUpperCase()}}", [{ id: 1, name: "ada" }, { id: 2, name: null }]],
    ["throws-every-row", "{{cellValue.nope.deeper}}", [{ id: 1, name: "ada" }]],
    ["plain-no-null", "{{cellValue.toUpperCase()}}", [{ id: 1, name: "ada" }]],
  ].forEach(([label, tf, data]) =>
    it(`transformation ${label}`, () => {
      // don't use tq.app's visible-wait: build and observe whether the widget ever renders
      cy.on("fail", (e) => { if (/draggable-widget-table1/.test(e.message)) { R.push({ id: `transform:${label}`, tableRendered: false, note: "widget never rendered within 30s" }); return false; } throw e; });
      tq.app({ data, probes: P, props: { defaultSelectedRow: "{{undefined}}" }, columns: [col("id", "number"), col("name", "string", { isEditable: true, transformation: tf })] });
      cy.document().then((doc) => R.push({ id: `transform:${label}`, tableRendered: true, cells: [...doc.querySelectorAll('[data-cy^="table1-name-row-"]')].map((e) => e.innerText.trim()), ud: probe(doc, "ud") }));
    })
  );

  it("transformation + edit: shown vs saved", () => {
    tq.app({ data: [{ id: 1, name: "ada" }], probes: P, props: { defaultSelectedRow: "{{undefined}}" }, columns: [col("id", "number"), col("name", "string", { isEditable: true, transformation: "{{cellValue?.toUpperCase?.() ?? cellValue}}" })] });
    cy.get('[data-cy="table1-name-row-0"]').find(".long-text-input").click({ force: true });
    cy.document().then((doc) => R.push({ id: "transform-edit:editor opens with", text: doc.querySelector('[data-cy="table1-name-row-0"] [contenteditable="true"]')?.innerText }));
    cy.get('[data-cy="table1-name-row-0"]').find('[contenteditable="true"]').type("{selectall}{backspace}bob", { force: true });
    cy.get('[data-cy="table1-id-row-0"]').click({ force: true });
    cy.wait(400);
    cy.document().then((doc) => R.push({ id: "transform-edit:after typing bob", cell: cellFacts(doc, "name"), cs: probe(doc, "cs"), ud: probe(doc, "ud") }));
  });

  it("timezone display (read-only text)", () => {
    tq.app({ data: [{ id: 1, iso: "2024-03-15T23:30:00Z", plain: "2024-03-15", unix: 1710545400 }], props: { defaultSelectedRow: "{{undefined}}" },
      columns: [col("id", "number"),
        col("iso", "datepicker", { dateFormat: "DD/MM/YYYY", parseDateFormat: "YYYY-MM-DD", isTimeChecked: true, isTwentyFourHrFormatEnabled: true }),
        col("plain", "datepicker", { dateFormat: "DD/MM/YYYY", parseDateFormat: "YYYY-MM-DD" }),
        col("unix", "datepicker", { dateFormat: "DD/MM/YYYY", parseInUnixTimestamp: true, unixTimestamp: "seconds", isTimeChecked: true, isTwentyFourHrFormatEnabled: true })] });
    cy.window().then((w) => cy.document().then((doc) => R.push({ id: "tz:display", browserTz: w.Intl.DateTimeFormat().resolvedOptions().timeZone,
      iso: doc.querySelector('td[data-cy="table1-iso-row-0"]')?.innerText.trim(), plain: doc.querySelector('td[data-cy="table1-plain-row-0"]')?.innerText.trim(), unix: doc.querySelector('td[data-cy="table1-unix-row-0"]')?.innerText.trim() })));
  });

  it("dark mode via the left-sidebar toggle", () => {
    tq.app({ data: [{ id: 1, name: "Ada", s: "red" }], columns: [col("id", "number"), col("name"), col("s", "select", { options: [{ label: "Red", value: "red" }] })], props: { defaultSelectedRow: "{{undefined}}" } });
    cy.document().then((doc) => {
      const items = [...doc.querySelectorAll(".left-sidebar-item")];
      const moon = items.find((b) => /moon/i.test(b.innerHTML) || b.querySelector("svg") && items.indexOf(b) === items.length - 2);
      (moon || items[items.length - 2])?.click();
    });
    cy.wait(1500);
    cy.document().then((doc) => {
      const lum = (rgb) => { const m = (rgb || "").match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map((v) => { v = +v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const bgOf = (el) => { while (el) { const b = getComputedStyle(el).backgroundColor; if (b && b !== "rgba(0, 0, 0, 0)") return b; el = el.parentElement; } return "rgb(255, 255, 255)"; };
      const pick = (sel) => { const el = doc.querySelector(sel); if (!el) return { missing: sel }; const c = getComputedStyle(el).color, b = bgOf(el); const la = lum(c), lb = lum(b); return { color: c, bg: b, contrast: la == null ? null : +(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)).toFixed(2)) }; };
      R.push({ id: "dark:theme applied", tableClass: doc.querySelector(".jet-table")?.className, bodyDark: /dark/.test(doc.body.className + doc.documentElement.className + (doc.querySelector(".editor, #root")?.className || "")) });
      R.push({ id: "dark:cell", ...pick('[data-cy="table1-name-row-0"] span, [data-cy="table1-name-row-0"]') });
      R.push({ id: "dark:header", ...pick('[data-cy="name-column-header"]') });
      R.push({ id: "dark:footer", ...pick('[data-cy="footer-number-of-records"]') });
      R.push({ id: "dark:search", ...pick('[data-cy="table1-search-input-field"]') });
      R.push({ id: "dark:select", ...pick('[data-cy="table1-s-row-0"] [class*="singleValue"], [data-cy="table1-s-row-0"] [class*="single-value"]') });
    });
    cy.document().then((doc) => { const items = [...doc.querySelectorAll(".left-sidebar-item")]; items[items.length - 2]?.click(); });
  });
});
