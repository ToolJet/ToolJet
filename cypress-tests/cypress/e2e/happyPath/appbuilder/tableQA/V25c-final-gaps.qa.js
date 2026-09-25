// V25 round 3: rowData child via inspector (click child first), undo/redo via header buttons,
// promote → release → public app logged out.
import { tq, col, recorder } from "./_obs";

const R = recorder("v25c-results.json");
const H = () => cy.getCookie("tj_auth_token").then((c) => ({ "Tj-Workspace-Id": Cypress.env("workspaceId"), Cookie: `tj_auth_token=${c.value}` }));
const api = (method, path, body) => H().then((h) => cy.request({ method, url: `${Cypress.env("server_host")}/api${path}`, headers: h, body, failOnStatusCode: false }));
const tables = (id) => cy.document().then((doc) => R.push({ id, tables: [...new Set([...doc.querySelectorAll('[data-cy^="draggable-widget-table"]')].map((e) => e.getAttribute("data-cy")))], undoEnabled: !doc.querySelector('[data-tooltip-id="tooltip-for-undo"]')?.disabled, redoEnabled: !doc.querySelector('[data-tooltip-id="tooltip-for-redo"]')?.disabled }));

describe("V25c final gaps round 3", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("rowData binding on a UI-dropped expanded-row child", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }, { id: 2, name: "Bob" }], columns: [col("id", "number"), col("name")],
      props: { defaultSelectedRow: "{{undefined}}", enableExpandableRows: "{{true}}", expansionHeight: "{{160}}" } });
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    cy.wait(800);
    cy.dragAndDropWidget("Text", 30, 30, "Text", `#canvas-${Cypress.env("tqTableId")}`);
    cy.wait(2000);
    cy.get('[data-cy="draggable-widget-text1"]').first().realClick();
    cy.wait(800);
    cy.document().then((doc) => R.push({ id: "inspector fields visible", fields: [...doc.querySelectorAll('[data-cy$="-input-field"]')].map((e) => e.getAttribute("data-cy")).slice(0, 6) }));
    cy.get('[data-cy="textcomponenttextinput-input-field"]', { timeout: 10000 }).clearAndTypeOnCodeMirror("{{'ROW:' + rowData?.name}}");
    cy.forceClickOnCanvas();
    cy.wait(2000);
    cy.get("button.table-expansion-toggle").eq(1).click({ force: true });
    cy.wait(1200);
    cy.document().then((doc) => R.push({ id: "rowData child texts (editor)", texts: [...doc.querySelectorAll(".table-expanded-row-container [data-cy^='draggable-widget-']")].map((e) => e.innerText.trim()) }));
    cy.reload();
    cy.get('[data-cy="draggable-widget-table1"]', { timeout: 30000 });
    cy.wait(1500);
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    cy.get("button.table-expansion-toggle").eq(1).click({ force: true });
    cy.wait(1200);
    cy.document().then((doc) => R.push({ id: "rowData child texts (after reload)", texts: [...doc.querySelectorAll(".table-expanded-row-container [data-cy^='draggable-widget-']")].map((e) => e.innerText.trim()) }));
  });

  it("undo / redo via header buttons after a paste", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }], columns: [col("id", "number"), col("name", "string", { textColor: "#ff0000" })], props: { defaultSelectedRow: "{{undefined}}" } });
    tables("undo: initial");
    cy.get('[data-cy="draggable-widget-table1"]').first().realClick({ position: "topRight" });
    cy.realPress(["Meta", "c"]);
    cy.get("#real-canvas").realClick({ position: "bottomRight" });
    cy.realPress(["Meta", "v"]);
    cy.wait(2000);
    tables("undo: after paste");
    cy.get('[data-tooltip-id="tooltip-for-undo"]').first().click({ force: true });
    cy.wait(2000);
    tables("undo: after Undo button");
    cy.get('[data-tooltip-id="tooltip-for-redo"]').first().click({ force: true });
    cy.wait(2000);
    tables("redo: after Redo button");
    cy.document().then((doc) => { const c = doc.querySelector('td[data-cy="table2-name-row-0"]'); R.push({ id: "redo: table2 config", text: c?.innerText.trim(), color: c ? getComputedStyle(c.querySelector("span, .long-text-input") || c).color : null }); });
  });

  it("promote to production, release, open the public app logged out", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }, { id: 2, name: "Bob" }], columns: [col("id", "number"), col("name", "string", { isEditable: true })], props: { defaultSelectedRow: "{{undefined}}" },
      events: [{ eventId: "onRowClicked", message: "PUBROW:{{components.table1.selectedRow?.name}}" }] });
    const slug = `tq-pub-${Date.now()}`;
    const promote = (n) => cy.apiGetAppData().then((app) => {
      if (n <= 0) return;
      api("PUT", `/v2/apps/${app.id}/versions/${app.editing_version.id}/promote`, { currentEnvironmentId: app.editorEnvironment?.id || app.editing_version.current_environment_id })
        .then((r) => { R.push({ id: `pub:promote ${4 - n}`, status: r.status, body: JSON.stringify(r.body).slice(0, 120) }); if (r.status < 300) promote(n - 1); });
    });
    promote(3);
    cy.apiGetAppData().then((app) => {
      api("PUT", `/apps/${app.id}`, { app: { slug } }).then((r) => R.push({ id: "pub:slug", status: r.status }));
      api("PUT", `/apps/${app.id}/release`, { versionToBeReleased: app.editing_version.id }).then((r) => R.push({ id: "pub:release", status: r.status, body: JSON.stringify(r.body).slice(0, 200) }));
      api("PUT", `/apps/${app.id}`, { app: { is_public: true } }).then((r) => R.push({ id: "pub:public", status: r.status }));
    });
    cy.then(() => {
      const appId = Cypress.env("appId");
      cy.clearCookies();
      cy.visit(`/applications/${slug}`, { failOnStatusCode: false });
      cy.wait(6000);
      cy.document().then((doc) => R.push({ id: "pub:logged-out page", path: doc.location.pathname, table: !!doc.querySelector('[data-cy="draggable-widget-table1"]'), headers: [...doc.querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.innerText.trim()).filter(Boolean), editorChrome: !!doc.querySelector('[data-cy="right-sidebar-components-button"]') }));
      cy.get("body").then(($b) => {
        if (!$b.find('[data-cy="table1-id-row-1"]').length) return;
        cy.get('[data-cy="table1-id-row-1"]').click({ force: true });
        cy.wait(900);
        cy.document().then((doc) => R.push({ id: "pub:row click event", toasts: [...doc.querySelectorAll('[role="status"]')].map((e) => e.innerText.trim()).filter((t) => t.startsWith("PUBROW")) }));
        cy.get('[data-cy="table1-name-row-0"]').find(".long-text-input").click({ force: true });
        cy.document().then((doc) => R.push({ id: "pub:end user can edit", ce: !!doc.querySelector('[data-cy="table1-name-row-0"] [contenteditable="true"]') }));
        cy.get('[data-cy="table1-search-input-field"]').type("Bob", { force: true });
        cy.wait(600);
        cy.document().then((doc) => R.push({ id: "pub:search", rows: doc.querySelectorAll('[data-cy^="table1-row-"]').length }));
      });
      cy.apiLogin();
      cy.then(() => Cypress.env("appId", appId));
    });
  });
});
