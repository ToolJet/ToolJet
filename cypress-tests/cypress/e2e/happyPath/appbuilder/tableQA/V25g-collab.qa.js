// Second session edits the table (with the exact request shape the inspector sends) while this editor stays open.
import { tq, col, recorder } from "./_obs";

const R = recorder("v25g-results.json");
const H = () => cy.getCookie("tj_auth_token").then((c) => ({ "Tj-Workspace-Id": Cypress.env("workspaceId"), Cookie: `tj_auth_token=${c.value}` }));
const headers = (doc) => [...doc.querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.innerText.trim()).filter(Boolean);

describe("V25g second-session edit", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());
  it("capture a real update, replay it as another session, watch the open editor", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }], columns: [col("id", "number"), col("name")], props: { defaultSelectedRow: "{{undefined}}" },
      extra: { note: { type: "Text", properties: { text: { value: "orig" } } } } });
    cy.intercept("PUT", "**/components").as("upd");
    cy.get('[data-cy="draggable-widget-note"]').first().realClick();
    cy.get('[data-cy="text-input-field"]', { timeout: 10000 }).clearAndTypeOnCodeMirror("from inspector");
    cy.get("#real-canvas").realClick({ position: "bottomLeft" });
    cy.wait("@upd", { timeout: 15000 }).then((i) => {
      Cypress.env("shape", i.request.body);
      R.push({ id: "capture", status: i.response?.statusCode, body: JSON.stringify(i.request.body).slice(0, 500) });
    });
    cy.wait(1000);
    // replay the same shape for the Text widget from "another session"
    cy.then(() => {
      const shape = JSON.parse(JSON.stringify(Cypress.env("shape")));
      const k = Object.keys(shape.diff)[0];
      const s = JSON.stringify(shape.diff[k]).replace(/from inspector/g, "from other session");
      shape.diff[k] = JSON.parse(s);
      cy.apiGetAppData().then((app) => H().then((h) => cy.request({ method: "PUT", url: `${Cypress.env("server_host")}/api/v2/apps/${app.id}/versions/${app.editing_version.id}/components`, headers: h, body: shape, failOnStatusCode: false })
        .then((r) => R.push({ id: "remote update", status: r.status }))));
    });
    cy.wait(6000);
    cy.document().then((doc) => R.push({ id: "editor after 6s (no reload)", note: doc.querySelector('[data-cy="draggable-widget-note"]')?.innerText.trim(), headers: headers(doc) }));
    // local user edits again, then reload: whose change wins?
    cy.get('[data-cy="draggable-widget-note"]').first().realClick();
    cy.get('[data-cy="text-input-field"]', { timeout: 10000 }).clearAndTypeOnCodeMirror("local after remote");
    cy.get("#real-canvas").realClick({ position: "bottomLeft" });
    cy.wait(2500);
    cy.reload();
    cy.get('[data-cy="draggable-widget-note"]', { timeout: 30000 });
    cy.wait(1500);
    cy.document().then((doc) => R.push({ id: "after reload", note: doc.querySelector('[data-cy="draggable-widget-note"]')?.innerText.trim() }));
  });
});
