// Editor ops on a configured table: copy/paste + duplicate, undo/redo, export→import round trip; released app.
import { tq, col, OPTS, recorder } from "./_obs";

const R = recorder("v21-results.json");
const COLS = [col("id", "number"), col("name", "string", { isEditable: true, minLength: 3, textColor: "#ff0000" }), col("s", "select", { options: OPTS }), col("d", "datepicker", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY" })];
const DATA = [{ id: 1, name: "Ada", s: "red", d: "15/05/2026" }];
const hdrs = (doc, t) => [...doc.querySelectorAll(`[data-cy="draggable-widget-${t}"] [data-cy$="-column-header"]`)].map((e) => e.innerText.trim()).filter(Boolean);
const tableComponents = (app) => {
  const out = [];
  const walk = (o) => { if (!o || typeof o !== "object") return; if (o.component === "Table" || o.type === "Table") out.push(o); Object.values(o).forEach(walk); };
  walk(app.pages || app.definition || app);
  return out;
};

describe("V21 editor operations and released app", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("copy/paste and duplicate the table widget", () => {
    tq.app({ data: DATA, columns: COLS, props: { defaultSelectedRow: "{{undefined}}" } });
    cy.get('[data-cy="draggable-widget-table1"]').first().click("topRight", { force: true });
    cy.get("body").type("{cmd}c", { force: true });
    cy.get('[data-cy="real-canvas"]').click("bottomRight", { force: true });
    cy.get("body").type("{cmd}v", { force: true });
    cy.wait(1500);
    cy.document().then((doc) => {
      const names = [...doc.querySelectorAll('[data-cy^="draggable-widget-table"]')].map((e) => e.getAttribute("data-cy")).filter((v, i, a) => a.indexOf(v) === i);
      R.push({ id: "paste:tables on canvas", names, headersEach: names.map((n) => hdrs(doc, n.replace("draggable-widget-", ""))) });
      const t2 = names.find((n) => n !== "draggable-widget-table1");
      if (t2) {
        const nm = t2.replace("draggable-widget-", "");
        const cell = doc.querySelector(`td[data-cy="${nm}-name-row-0"]`);
        R.push({ id: "paste:copy keeps column config", name: nm, cellText: cell?.innerText.trim(), textColor: cell ? getComputedStyle(cell.querySelector(".long-text-input, span") || cell).color : null, select: doc.querySelector(`td[data-cy="${nm}-s-row-0"]`)?.innerText.trim(), date: doc.querySelector(`td[data-cy="${nm}-d-row-0"] input`)?.value });
      }
    });
    cy.get('[data-cy="draggable-widget-table1"]').first().click("topRight", { force: true });
    cy.get("body").type("{cmd}d", { force: true });
    cy.wait(1500);
    cy.document().then((doc) => R.push({ id: "duplicate:cmd+d tables", names: [...new Set([...doc.querySelectorAll('[data-cy^="draggable-widget-table"]')].map((e) => e.getAttribute("data-cy")))] }));
  });

  it("export → import round trip keeps the table definition", () => {
    tq.app({ data: DATA, columns: COLS, props: { defaultSelectedRow: "{{undefined}}", rowsPerPage: "{{7}}" } });
    cy.getAuthHeaders().then((h) => {
      cy.apiGetAppData().then((app) => {
        const before = tableComponents(app);
        R.push({ id: "export:tables in source app", count: before.length });
        cy.request({ method: "POST", url: `${Cypress.env("server_host")}/api/v2/resources/export`, headers: h, failOnStatusCode: false,
          body: { app: [{ id: app.id, search_params: null }], organization_id: Cypress.env("workspaceId") } }).then((ex) => {
          R.push({ id: "export:status", status: ex.status, keys: Object.keys(ex.body || {}) });
          if (ex.status >= 300) return;
          cy.request({ method: "POST", url: `${Cypress.env("server_host")}/api/v2/resources/import`, headers: h, failOnStatusCode: false,
            body: { ...ex.body, organization_id: Cypress.env("workspaceId"), skip_permissions_group_check: true, app: [{ ...ex.body.app[0], appName: `tq-import-${Date.now()}` }] } }).then((im) => {
            R.push({ id: "import:status", status: im.status, body: JSON.stringify(im.body).slice(0, 200) });
            const newId = im.body?.imports?.app?.[0]?.id || im.body?.app?.[0]?.id;
            if (!newId) return;
            cy.apiGetAppData(newId).then((app2) => {
              const t = JSON.stringify(tableComponents(app2)).slice(0, 50000);
              R.push({ id: "import:definition checks", hasMinLength: t.includes('"minLength":3'), hasTextColor: t.includes("#ff0000"), hasDateFormat: t.includes("DD/MM/YYYY"), hasRowsPerPage: t.includes("{{7}}") });
              cy.visit(`/${Cypress.env("workspaceId")}/apps/${newId}`);
              cy.get('[data-cy="draggable-widget-table1"]', { timeout: 30000 });
              cy.wait(1500);
              cy.document().then((doc) => R.push({ id: "import:renders", headers: hdrs(doc, "table1"), name: doc.querySelector('td[data-cy="table1-name-row-0"]')?.innerText.trim(), date: doc.querySelector('td[data-cy="table1-d-row-0"] input')?.value }));
              cy.apiDeleteApp(newId);
            });
          });
        });
      });
    });
  });

  it("released app: table renders and works at the public slug", () => {
    tq.app({ data: DATA, columns: COLS, props: { defaultSelectedRow: "{{undefined}}" } });
    const slug = `tq-rel-${Date.now()}`;
    cy.apiGetAppData().then((app) => { cy.apiAddAppSlug(app.name, slug); cy.apiReleaseApp(app.name); });
    cy.wait(1000);
    cy.visit(`/applications/${slug}`, { failOnStatusCode: false });
    cy.wait(4000);
    cy.document().then((doc) => R.push({ id: "released:renders", url: doc.location.pathname, table: !!doc.querySelector('[data-cy="draggable-widget-table1"]'), headers: hdrs(doc, "table1"), name: doc.querySelector('td[data-cy="table1-name-row-0"]')?.innerText.trim() }));
  });
});
