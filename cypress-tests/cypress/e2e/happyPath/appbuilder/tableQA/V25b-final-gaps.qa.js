// V25 follow-ups: bind rowData on a UI-dropped expanded-row child (via inspector), capture the real component-update
// request and reuse it for a second-session edit, undo/redo of a paste, release error body, public app logged out.
import { tq, col, recorder } from "./_obs";

const R = recorder("v25b-results.json");
const H = () => cy.getCookie("tj_auth_token").then((c) => ({ "Tj-Workspace-Id": Cypress.env("workspaceId"), Cookie: `tj_auth_token=${c.value}` }));
const api = (method, path, body) => H().then((h) => cy.request({ method, url: `${Cypress.env("server_host")}/api${path}`, headers: h, body, failOnStatusCode: false }));
const tables = (id) => cy.document().then((doc) => R.push({ id, tables: [...new Set([...doc.querySelectorAll('[data-cy^="draggable-widget-table"]')].map((e) => e.getAttribute("data-cy")))] }));

describe("V25b final gaps follow-up", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("rowData binding on a UI-dropped expanded-row child; capture update request; second-session edit", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }, { id: 2, name: "Bob" }], columns: [col("id", "number"), col("name")],
      props: { defaultSelectedRow: "{{undefined}}", enableExpandableRows: "{{true}}", expansionHeight: "{{160}}" } });
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    cy.wait(800);
    cy.intercept("PUT", "**/components").as("upd");
    cy.dragAndDropWidget("Text", 30, 30, "Text", `#canvas-${Cypress.env("tqTableId")}`);
    cy.wait(2000);
    cy.get('[data-cy="textcomponenttextinput-input-field"]', { timeout: 10000 }).clearAndTypeOnCodeMirror("{{'ROW:' + rowData?.name}}");
    cy.forceClickOnCanvas();
    cy.wait("@upd", { timeout: 15000 }).then((i) => {
      Cypress.env("updShape", i.request.body);
      R.push({ id: "capture:component update body", body: JSON.stringify(i.request.body).slice(0, 400), status: i.response?.statusCode });
    });
    cy.wait(1500);
    cy.get("button.table-expansion-toggle").eq(1).click({ force: true });
    cy.wait(1200);
    cy.document().then((doc) => R.push({ id: "rowData child: texts in expanded rows (editor)", texts: [...doc.querySelectorAll(".table-expanded-row-container [data-cy^='draggable-widget-']")].map((e) => e.innerText.trim()) }));
    cy.reload();
    cy.get('[data-cy="draggable-widget-table1"]', { timeout: 30000 });
    cy.wait(1500);
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    cy.get("button.table-expansion-toggle").eq(1).click({ force: true });
    cy.wait(1200);
    cy.document().then((doc) => R.push({ id: "rowData child: after reload", texts: [...doc.querySelectorAll(".table-expanded-row-container [data-cy^='draggable-widget-']")].map((e) => e.innerText.trim()) }));
    // second session: same request shape, but rename the table's name column; editor stays open
    cy.apiGetAppData().then((app) => {
      const shape = Cypress.env("updShape") || {};
      const tEntry = Object.entries(app.pages[0].components).find(([, v]) => v.component?.name === "table1");
      const cols = (tEntry?.[1].component?.definition?.properties?.columns?.value || []).map((c) => (c.key === "name" ? { ...c, name: "Renamed Elsewhere" } : c));
      const firstKey = Object.keys(shape.diff || {})[0];
      const template = firstKey ? shape.diff[firstKey] : {};
      const diffEntry = JSON.parse(JSON.stringify(template));
      // put columns where the captured template put properties
      const target = diffEntry.component?.definition?.properties ? diffEntry.component.definition.properties : (diffEntry.properties || (diffEntry.properties = {}));
      Object.keys(target).forEach((k) => delete target[k]);
      target.columns = { value: cols };
      api("PUT", `/v2/apps/${app.id}/versions/${app.editing_version.id}/components`, { ...shape, diff: { [tEntry[0]]: diffEntry } })
        .then((r) => R.push({ id: "collab: remote update status", status: r.status, body: JSON.stringify(r.body).slice(0, 160) }));
    });
    cy.wait(6000);
    cy.document().then((doc) => R.push({ id: "collab: editor headers 6s later (no reload)", headers: [...doc.querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.innerText.trim()).filter(Boolean) }));
    cy.reload();
    cy.get('[data-cy="draggable-widget-table1"]', { timeout: 30000 });
    cy.wait(1500);
    cy.document().then((doc) => R.push({ id: "collab: editor headers after reload", headers: [...doc.querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.innerText.trim()).filter(Boolean) }));
  });

  it("undo / redo of a paste", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }], columns: [col("id", "number"), col("name", "string", { textColor: "#ff0000" })], props: { defaultSelectedRow: "{{undefined}}" } });
    cy.get('[data-cy="draggable-widget-table1"]').first().realClick({ position: "topRight" });
    cy.realPress(["Meta", "c"]);
    cy.get("#real-canvas").realClick({ position: "bottomRight" });
    cy.realPress(["Meta", "v"]);
    cy.wait(2000);
    tables("undo: after paste");
    cy.get("#real-canvas").realClick({ position: "bottomLeft" });
    cy.realPress(["Meta", "z"]);
    cy.wait(2000);
    tables("undo: after Cmd+Z (expect table2 gone)");
    cy.realPress(["Meta", "Shift", "z"]);
    cy.wait(2000);
    tables("redo: after Cmd+Shift+Z (expect table2 back)");
    cy.document().then((doc) => { const c = doc.querySelector('td[data-cy="table2-name-row-0"]'); R.push({ id: "redo: restored table2 config", text: c?.innerText.trim(), color: c ? getComputedStyle(c.querySelector("span, .long-text-input") || c).color : null }); });
    // delete via the widget's own delete control, then undo
    cy.get('[data-cy="draggable-widget-table2"]').first().realClick({ position: "topRight" });
    cy.realPress("Backspace");
    cy.wait(600);
    cy.document().then((doc) => R.push({ id: "delete: dialogs after Backspace", dialogs: [...doc.querySelectorAll('[role="dialog"], .modal.show')].map((e) => e.innerText.trim().slice(0, 80)) }));
    cy.get("body").then(($b) => { const b = $b.find(".modal.show button, [role=dialog] button").filter((i, e) => /yes|delete|confirm/i.test(e.innerText)).first(); if (b.length) cy.wrap(b).click({ force: true }); });
    cy.wait(1500);
    tables("delete: after Backspace (+confirm)");
    cy.get("#real-canvas").realClick({ position: "bottomLeft" });
    cy.realPress(["Meta", "z"]);
    cy.wait(2000);
    tables("delete: after Cmd+Z");
  });

  it("release error body, then public app opened logged out", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }, { id: 2, name: "Bob" }], columns: [col("id", "number"), col("name", "string", { isEditable: true })], props: { defaultSelectedRow: "{{undefined}}" },
      events: [{ eventId: "onRowClicked", message: "PUBROW:{{components.table1.selectedRow?.name}}" }] });
    const slug = `tq-pub-${Date.now()}`;
    cy.apiGetAppData().then((app) => {
      api("PUT", `/apps/${app.id}`, { app: { slug } }).then((r) => R.push({ id: "pub:slug", status: r.status }));
      api("PUT", `/apps/${app.id}/release`, { versionToBeReleased: app.editing_version.id }).then((r) => R.push({ id: "pub:release", status: r.status, body: JSON.stringify(r.body).slice(0, 300) }));
      api("PUT", `/apps/${app.id}`, { app: { is_public: true } }).then((r) => R.push({ id: "pub:public", status: r.status }));
    });
    cy.then(() => {
      const appId = Cypress.env("appId");
      cy.clearCookies();
      cy.visit(`/applications/${slug}`, { failOnStatusCode: false });
      cy.wait(5000);
      cy.document().then((doc) => R.push({ id: "pub:logged-out page", path: doc.location.pathname, table: !!doc.querySelector('[data-cy="draggable-widget-table1"]'), text: doc.body.innerText.slice(0, 160).replace(/\s+/g, " ") }));
      cy.apiLogin();
      cy.then(() => Cypress.env("appId", appId));
    });
  });
});
