// tableQA harness: build a Table app through the API in one shot, then open it in the editor.
// Usage in a spec:
//   import { tq, col } from "./_harness";
//   tq.app({ data: [{ id: 1, qty: "5" }], columns: [col("id"), col("qty", "number", { isEditable: true })],
//            props: { displaySearchBox: "{{true}}" }, styles: {}, probes: { cs: "{{JSON.stringify(components.table1.changeSet)}}" } });
//   tq.cell(0, "qty") / tq.probe("cs").should(...)
import def from "../../../../fixtures/tableQA/addComponentRequest.json";

const base = Object.values(def.body.diff)[0];
const uid = () => Cypress._.times(32, () => Cypress._.random(15).toString(16)).join("");
const wrap = (v) => (typeof v === "object" && v !== null && "value" in v ? v : { value: v });

export const col = (key, columnType = "string", extra = {}) => ({
  id: uid(),
  name: extra.name ?? key,
  key,
  columnType,
  fxActiveFields: [],
  ...extra,
});

const headers = () =>
  cy.getCookie("tj_auth_token").then((c) => ({
    "Tj-Workspace-Id": Cypress.env("workspaceId"),
    Cookie: `tj_auth_token=${c.value}`,
  }));

const postComponents = (diff) =>
  cy.apiGetAppData().then((app) =>
    headers().then((h) =>
      cy.request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/v2/apps/${app.id}/versions/${app.editing_version.id}/components`,
        headers: h,
        body: { is_user_switched_version: false, pageId: app.pages[0].id, diff },
      })
    )
  );

export const tq = {
  /** Create app + table (+ optional Text probes) and open the editor. */
  app({ data, columns, props = {}, styles = {}, probes = {}, events = [], extra = {}, queries = [], name = "table1", height = 460, width = 30, top0 = 30 } = {}) {
    cy.apiLogin();
    cy.apiCreateApp(`tq-${Date.now()}`);
    // queries: [{ name, code, runOnPageLoad }] -> RunJS queries; ids kept in Cypress.env("tqQueries")
    Cypress.env("tqQueries", {});
    queries.forEach((q) =>
      cy.apiAddQueryToApp({ queryName: q.name, options: { code: q.code, hasParamSupport: true, parameters: [], runOnPageLoad: !!q.runOnPageLoad }, dataSourceName: "runjsdefault", dsKind: "runjs" })
        .then(() => Cypress.env("tqQueries", { ...Cypress.env("tqQueries"), [q.name]: Cypress.env("query-id") }))
    );
    const t = Cypress._.cloneDeep(base);
    t.name = name;
    t.layouts = { desktop: { top: top0, left: 1, width, height }, mobile: { top: top0, left: 1, width, height } };
    if (data !== undefined) t.properties.data = { value: typeof data === "string" ? data : `{{${JSON.stringify(data)}}}` };
    if (columns) {
      t.properties.columns = { value: columns };
      t.properties.autogenerateColumns = { value: false, generateNestedColumns: false };
    }
    Object.entries(props).forEach(([k, v]) => (t.properties[k] = wrap(v)));
    Object.entries(styles).forEach(([k, v]) => (t.styles[k] = wrap(v)));
    const tableId = cryptoId();
    if (arguments[0] && arguments[0].parent) t.parent = arguments[0].parent;
    Cypress.env("tqTableId", tableId);
    const diff = { [tableId]: t };
    // extra: { name: {type, properties, layouts?} } for additional widgets (e.g. Buttons)
    let etop = 300;
    Object.entries(extra).forEach(([ename, w]) => {
      const wid = w.id || cryptoId();
      if (w.id) Cypress.env(`tqId_${ename}`, wid);
      const lay = w.layout || { top: etop, left: 32, width: 8, height: 40 };
      diff[wid] = { name: ename, type: w.type, parent: w.parent === "TABLE" ? tableId : w.parent || null, properties: w.properties || {}, styles: w.styles || {}, general: {}, generalStyles: {}, others: {},
        layouts: { desktop: lay, mobile: lay } };
      etop += 45;
    });
    let top = 30;
    Object.entries(probes).forEach(([pname, expr]) => {
      diff[cryptoId()] = {
        name: pname,
        type: "Text",
        parent: null,
        properties: { text: { value: expr } },
        styles: {},
        general: {},
        generalStyles: {},
        others: {},
        layouts: { desktop: { top, left: 32, width: 11, height: 40 }, mobile: { top, left: 32, width: 11, height: 40 } },
      };
      top += 45;
    });
    postComponents(diff);
    // events: [{ eventId: "onRowClicked", message: "ROW", actionId?: "show-alert", ...extraEventFields }]
    events.forEach((e, i) =>
      cy.apiGetAppData().then((app) =>
        headers().then((h) =>
          cy.request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/v2/apps/${app.id}/versions/${app.editing_version.id}/events`,
            headers: h,
            body: { event: { actionId: "show-alert", alertType: "info", message: e.message, ...e, ...(e.runQuery ? { actionId: "run-query", queryName: e.runQuery, queryId: Cypress.env("tqQueries")[e.runQuery] } : {}), component: "Table" }, eventType: e.eventType || "component", attachedTo: tableId, index: i, name: `Event #${i + 1}` },
          })
        )
      )
    );
    // Don't use cy.openApp: its `getAppData` wait never fires for the 2nd+ app in a spec.
    cy.window({ log: false }).then((w) => w.localStorage.setItem("walkthroughCompleted", "true"));
    cy.visit("about:blank");
    cy.then(() => cy.visit(`/${Cypress.env("workspaceId")}/apps/${Cypress.env("appId")}`));
    cy.get(`[data-cy="draggable-widget-${name}"]`, { timeout: 30000 }).should("be.visible");
    // Column headers/cells render a tick after the widget box; let the table settle so one-shot DOM reads are valid.
    // (no thead assertion: loading-state tables render none)
    cy.wait(1500);
    cy.viewport(1600, 1100);
  },
  table: (name = "table1") => cy.get(`[data-cy="draggable-widget-${name}"]`).first(),
  rows: (name = "table1") => tq.table(name).find("tbody tr"),
  /** cell by row index + column name, e.g. tq.cell(0, "qty") -> td[data-cy="table1-qty-row-0"] */
  cell: (row, colName, name = "table1") =>
    cy.get(`td[data-cy="${name}-${colName.toLowerCase().replace(/\s+/g, "-")}-row-${row}"]`),
  probe: (pname) => cy.get(`[data-cy="draggable-widget-${pname}"]`).first(),
  cleanup: () => cy.apiDeleteApp(),
};

function cryptoId() {
  const h = uid();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
