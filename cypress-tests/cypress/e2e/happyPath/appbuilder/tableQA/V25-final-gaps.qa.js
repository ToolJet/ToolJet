// Final gaps: row-context children via real drag, dark mode via app theme, real-key copy/paste + clipboard paste,
// undo/redo, released public app (logged out), second-session edit while editor open. Observe-only -> logs/v25-results.json
import { tq, col, OPTS, recorder, probe } from "./_obs";

const R = recorder("v25-results.json");
const H = () => cy.getCookie("tj_auth_token").then((c) => ({ "Tj-Workspace-Id": Cypress.env("workspaceId"), Cookie: `tj_auth_token=${c.value}` }));
const api = (method, path, body) => H().then((h) => cy.request({ method, url: `${Cypress.env("server_host")}/api${path}`, headers: h, body, failOnStatusCode: false }));
const appInfo = () => cy.apiGetAppData();
const comps = (app) => { const out = {}; (app.pages || []).forEach((pg) => Object.entries(pg.components || {}).forEach(([id, v]) => { const c = v.component || {}; out[c.name] = { id, ...c, layouts: v.layouts }; })); return out; };
const reopen = () => { cy.reload(); cy.get('[data-cy="draggable-widget-table1"]', { timeout: 30000 }); cy.wait(1500); };

describe("V25 final gaps", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("row-context child dropped into an expanded row through the UI", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }, { id: 2, name: "Bob" }], columns: [col("id", "number"), col("name")],
      props: { defaultSelectedRow: "{{undefined}}", enableExpandableRows: "{{true}}", expansionHeight: "{{160}}" } });
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    cy.wait(800);
    cy.document().then((doc) => R.push({ id: "drop:subcanvas", found: !!doc.querySelector(`#canvas-${Cypress.env("tqTableId")}`), ids: [...doc.querySelectorAll('[id^="canvas-"]')].map((e) => e.id).slice(0, 5) }));
    cy.dragAndDropWidget("Text", 30, 30, "Text", `#canvas-${Cypress.env("tqTableId")}`);
    cy.wait(2500);
    appInfo().then((app) => {
      const c = comps(app);
      const child = Object.values(c).find((x) => x.component === "Text");
      R.push({ id: "drop:created child", name: child?.name, parent: child?.parent, keys: child ? Object.keys(child) : null, tableId: Cypress.env("tqTableId"), compShape: child ? JSON.stringify(child).slice(0, 300) : null });
      if (!child) return;
      cy.getCookie("tj_auth_token").then((ck) => api("PUT", `/v2/apps/${app.id}/versions/${app.editing_version.id}/components`, {
        is_user_switched_version: false, pageId: app.pages[0].id,
        diff: { [child.id]: { properties: { text: { value: "{{'ROW:' + rowData?.name}}" } } } },
      }).then((r) => R.push({ id: "drop:update text status", status: r.status })));
    });
    reopen();
    cy.get("button.table-expansion-toggle").eq(0).click({ force: true });
    cy.wait(800);
    cy.get("button.table-expansion-toggle").eq(1).click({ force: true });
    cy.wait(1200);
    cy.document().then((doc) => R.push({ id: "drop:child texts per expanded row", texts: [...doc.querySelectorAll(".table-expanded-row-container [data-cy^='draggable-widget-']")].map((e) => `${e.getAttribute("data-cy")}=${e.innerText.trim()}`) }));
  });

  it("dark mode via the app theme (globalSettings.appMode = dark)", () => {
    tq.app({ data: [{ id: 1, name: "Ada", s: "red", ok: true }], columns: [col("id", "number"), col("name", "string", { isEditable: true }), col("s", "select", { options: OPTS }), col("ok", "boolean")],
      props: { defaultSelectedRow: "{{undefined}}", showAddNewRowButton: "{{true}}" } });
    appInfo().then((app) => api("PUT", `/v2/apps/${app.id}/versions/${app.editing_version.id}/global_settings`, { globalSettings: { appMode: "dark" } }).then((r) => R.push({ id: "dark:save status", status: r.status })));
    reopen();
    cy.document().then((doc) => {
      const lum = (rgb) => { const m = (rgb || "").match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map((v) => { v = +v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const bgOf = (el) => { while (el) { const b = getComputedStyle(el).backgroundColor; if (b && b !== "rgba(0, 0, 0, 0)") return b; el = el.parentElement; } return "rgb(255, 255, 255)"; };
      const pick = (sel) => { const el = doc.querySelector(sel); if (!el) return { missing: sel }; const c = getComputedStyle(el).color, b = bgOf(el); const la = lum(c), lb = lum(b); return { color: c, bg: b, contrast: la == null ? null : +(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)).toFixed(2)) }; };
      R.push({ id: "dark:table class", cls: doc.querySelector(".jet-table")?.className, tableBg: getComputedStyle(doc.querySelector(".jet-table")).backgroundColor });
      [["cell", '[data-cy="table1-name-row-0"] span, [data-cy="table1-name-row-0"] .long-text-input'], ["header", '[data-cy="name-column-header"]'], ["footer", '[data-cy="footer-number-of-records"]'],
        ["search", '[data-cy="table1-search-input-field"]'], ["select", '[data-cy="table1-s-row-0"] [class*="singleValue"], [data-cy="table1-s-row-0"] [class*="single-value"]'], ["pagination", '[data-cy="pagination-section"] button']]
        .forEach(([n, sel]) => R.push({ id: `dark:${n}`, ...pick(sel) }));
    });
    cy.get('[data-cy="table1-name-row-0"]').find(".long-text-input").click({ force: true });
    cy.wait(300);
    cy.document().then((doc) => { const el = doc.querySelector('[data-cy="table1-name-row-0"] [contenteditable="true"]'); R.push({ id: "dark:cell editor", color: el ? getComputedStyle(el).color : null, bg: el ? getComputedStyle(el).backgroundColor : null }); });
  });

  it("real-key copy/paste of the table widget, and undo/redo", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }], columns: [col("id", "number"), col("name", "string", { textColor: "#ff0000" })], props: { defaultSelectedRow: "{{undefined}}" } });
    const tables = (id) => cy.document().then((doc) => R.push({ id, tables: [...new Set([...doc.querySelectorAll('[data-cy^="draggable-widget-table"]')].map((e) => e.getAttribute("data-cy")))] }));
    cy.get('[data-cy="draggable-widget-table1"]').first().realClick({ position: "topRight" });
    cy.realPress(["Meta", "c"]);
    cy.get("#real-canvas").realClick({ position: "bottomRight" });
    cy.realPress(["Meta", "v"]);
    cy.wait(2000);
    tables("keys:after Cmd+C / Cmd+V");
    cy.document().then((doc) => { const t2 = doc.querySelector('td[data-cy^="table2-name-row-0"]'); R.push({ id: "keys:pasted copy keeps column style", text: t2?.innerText.trim(), color: t2 ? getComputedStyle(t2.querySelector("span, .long-text-input") || t2).color : null }); });
    cy.get('[data-cy="draggable-widget-table1"]').first().realClick({ position: "topRight" });
    cy.realPress("Backspace");
    cy.wait(800);
    cy.get("body").then(($b) => { const c = $b.find('[data-cy="component-inspector-delete-button"], button:contains("Delete")').filter(":visible").first(); if (c.length) cy.wrap(c).click({ force: true }); });
    cy.wait(1500);
    tables("undo:after deleting table1");
    cy.get("#real-canvas").realClick({ position: "bottomLeft" });
    cy.realPress(["Meta", "z"]);
    cy.wait(2000);
    tables("undo:after Cmd+Z");
    cy.document().then((doc) => { const c = doc.querySelector('td[data-cy="table1-name-row-0"]'); R.push({ id: "undo:restored table config", text: c?.innerText.trim(), color: c ? getComputedStyle(c.querySelector("span, .long-text-input") || c).color : null }); });
    cy.realPress(["Meta", "Shift", "z"]);
    cy.wait(2000);
    tables("redo:after Cmd+Shift+Z");
  });

  it("clipboard paste (real Cmd+V) into an editable String cell", () => {
    tq.app({ data: [{ id: 1, a: "x" }], columns: [col("id", "number"), col("a", "string", { isEditable: true })],
      probes: { cs: "{{JSON.stringify(components.table1.changeSet).replace(/</g, '[')}}" }, props: { defaultSelectedRow: "{{undefined}}" } });
    cy.get('[data-cy="table1-a-row-0"]').find(".long-text-input").realClick();
    cy.wrap(Cypress.automation("remote:debugger:protocol", { command: "Browser.grantPermissions", params: { permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] } }), { log: false }).then(() => null, () => null);
    cy.window().then((w) => { w.focus(); return w.navigator.clipboard.write([new w.ClipboardItem({ "text/plain": new w.Blob(["rich"], { type: "text/plain" }), "text/html": new w.Blob(['<b style="color:red">rich</b><img src=x onerror="window.__tqPwn=1">'], { type: "text/html" }) })])
      .then(() => R.push({ id: "clip:write", ok: true }), (e) => R.push({ id: "clip:write", ok: false, err: String(e).slice(0, 120) })); });
    cy.get('[data-cy="table1-a-row-0"]').find(".long-text-input").realClick();
    cy.realPress(["Meta", "a"]);
    cy.realPress(["Meta", "v"]);
    cy.wait(500);
    cy.get('[data-cy="table1-id-row-0"]').realClick();
    cy.wait(500);
    cy.window().then((w) => cy.document().then((doc) => R.push({ id: "clip:after paste", cellHtml: doc.querySelector('[data-cy="table1-a-row-0"] .long-text-input')?.innerHTML.slice(0, 200), img: !!doc.querySelector('[data-cy="table1-a-row-0"] img'), onerror: !!w.__tqPwn, cs: probe(doc, "cs") })));
  });

  it("released + public app opened logged out; second-session edit while the editor is open", () => {
    tq.app({ data: [{ id: 1, name: "Ada" }, { id: 2, name: "Bob" }], columns: [col("id", "number"), col("name", "string", { isEditable: true })],
      props: { defaultSelectedRow: "{{undefined}}" },
      events: [{ eventId: "onRowClicked", message: "PUBROW:{{components.table1.selectedRow?.name}}" }] });
    // second session: rename the column through the API while this editor is open
    appInfo().then((app) => {
      const t = comps(app).table1;
      const columns = (t?.definition?.properties?.columns?.value || []).map((c) => (c.key === "name" ? { ...c, name: "Renamed Elsewhere" } : c));
      api("PUT", `/v2/apps/${app.id}/versions/${app.editing_version.id}/components`, { is_user_switched_version: false, pageId: app.pages[0].id, diff: { [t.id]: { properties: { columns: { value: columns } } } } })
        .then((r) => R.push({ id: "collab:api update status", status: r.status, cols: columns.length }));
    });
    cy.wait(6000);
    cy.document().then((doc) => R.push({ id: "collab:editor headers 6s after remote change (no reload)", headers: [...doc.querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.innerText.trim()).filter(Boolean) }));
    reopen();
    cy.document().then((doc) => R.push({ id: "collab:editor headers after reload", headers: [...doc.querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.innerText.trim()).filter(Boolean) }));
    // release + public, then open logged out
    const slug = `tq-pub-${Date.now()}`;
    appInfo().then((app) => {
      api("PUT", `/apps/${app.id}`, { app: { slug } }).then((r) => R.push({ id: "pub:slug status", status: r.status }));
      api("PUT", `/apps/${app.id}/release`, { versionToBeReleased: app.editing_version.id }).then((r) => R.push({ id: "pub:release status", status: r.status }));
      api("PUT", `/apps/${app.id}`, { app: { is_public: true } }).then((r) => R.push({ id: "pub:public status", status: r.status }));
    });
    cy.then(() => {
      const appId = Cypress.env("appId");
      cy.clearCookies();
      cy.visit(`/applications/${slug}`, { failOnStatusCode: false });
      cy.get('[data-cy="draggable-widget-table1"]', { timeout: 30000 });
      cy.wait(2000);
      cy.document().then((doc) => R.push({ id: "pub:logged-out render", path: doc.location.pathname, headers: [...doc.querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.innerText.trim()).filter(Boolean), editorChrome: !!doc.querySelector('[data-cy="right-sidebar-components-button"]') }));
      cy.get('[data-cy="table1-id-row-1"]').click({ force: true });
      cy.wait(900);
      cy.document().then((doc) => R.push({ id: "pub:row click event", toasts: [...doc.querySelectorAll('[role="status"]')].map((e) => e.innerText.trim()).filter((t) => t.startsWith("PUBROW")) }));
      cy.get('[data-cy="table1-name-row-0"]').find(".long-text-input").click({ force: true });
      cy.document().then((doc) => R.push({ id: "pub:end user can edit", ce: !!doc.querySelector('[data-cy="table1-name-row-0"] [contenteditable="true"]') }));
      cy.get('[data-cy="table1-search-input-field"]').type("Bob", { force: true });
      cy.wait(600);
      cy.document().then((doc) => R.push({ id: "pub:search", rows: doc.querySelectorAll('[data-cy^="table1-row-"]').length }));
      // restore session for cleanup
      cy.apiLogin();
      cy.then(() => Cypress.env("appId", appId));
    });
  });
});
