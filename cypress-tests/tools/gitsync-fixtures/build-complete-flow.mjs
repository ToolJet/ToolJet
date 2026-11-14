// Rebuilds the complete-flow fixtures on a local EE instance: node tools/gitsync-fixtures/build-complete-flow.mjs <serverUrl>
import { randomUUID } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";

const SERVER = process.argv[2] || "http://localhost:3000";
const isLocal = ["localhost", "127.0.0.1"].includes(new URL(SERVER).hostname);
if (!isLocal && process.env.ALLOW_REMOTE_FIXTURE_BUILD !== "1") {
  throw new Error(`Refusing to build fixtures against ${SERVER}: set ALLOW_REMOTE_FIXTURE_BUILD=1 to allow.`);
}
const EMAIL = process.env.TJ_EMAIL || (isLocal ? "dev@tooljet.io" : undefined);
const PASSWORD = process.env.TJ_PASSWORD || (isLocal ? "password" : undefined);
if (!EMAIL || !PASSWORD) throw new Error("Set TJ_EMAIL and TJ_PASSWORD for a non-local server.");
const OUT = new URL("../../cypress/fixtures/gitSync/complete-flow", import.meta.url).pathname;
const API = `${SERVER}/api`;
let cookie = "";
let ws = "";

const req = async (method, path, body) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Cookie: cookie, "tj-workspace-id": ws },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 500)}`);
  return { json, res };
};

const login = async () => {
  const res = await fetch(`${API}/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login ${res.status}`);
  cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  ws = (await res.json()).current_organization_id;
};

const layout = (top, left = 2, width = 20, height = 40) => ({
  desktop: { top, left, width, height },
  mobile: { top, left, width, height },
});

const getApp = async (id) => (await req("GET", `/apps/${id}`)).json;
const versionDataSources = async (app) =>
  (await req("GET", `/data-sources/${ws}/environments/${app.editorEnvironment.id}/versions/${app.editing_version.id}`))
    .json.data_sources;

const addComponents = (appId, versionId, pageId, diff) =>
  req("POST", `/v2/apps/${appId}/versions/${versionId}/components`, { is_user_switched_version: false, pageId, diff });

const addQuery = (dataSourceId, versionId, appId, name, kind, options) =>
  req("POST", `/data-queries/data-sources/${dataSourceId}/versions/${versionId}`, {
    app_id: appId, app_version_id: versionId, name, kind, options, data_source_id: dataSourceId, plugin_id: null,
  }).then((r) => r.json);

const restOptions = (url) => ({
  method: "get", url, url_params: [], headers: [], cookies: [], body: [], json_body: null, body_toggle: false,
  retry_network_errors: null, runOnPageLoad: true,
});

// The export carries the workflow's API token; the fixture is public, so drop it.
const stripTokens = (exported) => {
  for (const a of exported.app || []) if (a.definition?.appV2) a.definition.appV2.workflowApiToken = null;
  return exported;
};

const exportResource = async (appId, versionId) =>
  stripTokens((await req("POST", "/v2/resources/export", {
    app: [{ id: appId, search_params: { version_id: versionId } }], tooljet_database: [], organization_id: ws,
  })).json);

await login();
// Remove resources left by an earlier build so names stay fixed. Exact names only, never test-run copies.
const listed = async (type) => (await req("GET", `/apps?page=1&type=${type}&searchKey=cf-`)).json.apps || [];
const builtNames = new Set(["cf-app", "cf-mod", "cf-wf"]);
for (const type of ["front-end", "module", "workflow"]) {
  for (const a of await listed(type)) if (builtNames.has(a.name)) await req("DELETE", `/apps/${a.id}`);
}
for (const f of (await req("GET", "/folder-apps?type=front-end")).json.folders || []) if (f.name === "cf-folder") await req("DELETE", `/folders/${f.id}`);
for (const d of (await req("GET", `/data-sources/${ws}`)).json.data_sources || []) if (d.name === "cf-rest") await req("DELETE", `/data-sources/${d.id}`);
const names = { ds: "cf-rest", wf: "cf-wf", mod: "cf-mod", app: "cf-app", folder: "cf-folder" };

// Data source (global)
const ds = (await req("POST", "/data-sources", {
  name: names.ds, kind: "restapi", scope: "global",
  options: [
    { key: "url", value: "https://jsonplaceholder.typicode.com" },
    { key: "auth_type", value: "none" },
    { key: "headers", value: [["", ""]] },
    { key: "url_parameters", value: [["", ""]] },
  ],
})).json;

// Workflow: Start -> REST GET /todos/2 -> Response
const wf = (await req("POST", "/apps", { name: names.wf, type: "workflow", icon: "sentfast" })).json;
const wfApp = await getApp(wf.id);
const wfVersion = wfApp.editing_version.id;
const wfNode = (await req("POST", "/data-queries/workflow-node", {
  app_id: wf.id, app_version_id: wfVersion, name: "getTodo2", kind: "restapi",
  options: restOptions("/todos/2"), data_source_id: ds.id, plugin_id: null,
})).json;
await req("PUT", `/v2/apps/${wf.id}/versions/${wfVersion}`, {
  is_user_switched_version: false,
  definition: {
    nodes: [
      { id: "start-node-1", data: { nodeType: "start", label: "Start trigger" }, position: { x: 100, y: 250 }, type: "input", sourcePosition: "right", deletable: false },
      { id: "restapi-node-1", type: "query", sourcePosition: "right", targetPosition: "left", draggable: true,
        data: { idOnDefinition: wfNode.id, kind: "restapi", options: restOptions("/todos/2") }, position: { x: 495, y: 146 }, deletable: false },
      { id: "response-node-1", type: "output", sourcePosition: "right", targetPosition: "left", deletable: false, position: { x: 800, y: 226 },
        data: { nodeType: "response", label: "Response", code: "return getTodo2.data", statusCode: { fxActive: false, value: "200" }, nodeName: "response1" } },
    ],
    edges: [
      { id: "edge-1", source: "start-node-1", target: "restapi-node-1", sourceHandle: null, type: "custom" },
      { id: "edge-2", source: "restapi-node-1", target: "response-node-1", sourceHandle: "success", type: "custom" },
    ],
    queries: [{ idOnDefinition: wfNode.id, id: wfNode.id }],
    webhookParams: [], defaultParams: "{}",
    dependencies: { javascript: { dependencies: {} } }, setupScript: { javascript: "" },
  },
});

// Module: RunJS getRows -> Text inside the module container
const mod = (await req("POST", "/modules", { name: names.mod, type: "module", icon: "floppydisk" })).json;
const modApp = await getApp(mod.id);
const modVersion = modApp.editing_version.id;
const modPage = modApp.editing_version.home_page_id;
const modComponents = Object.entries(modApp.pages.find((p) => p.id === modPage)?.components || {});
const container = modComponents.find(([, c]) => c.component?.component === "ModuleContainer");
if (!container) throw new Error("module container not found");
const runjsModule = (await versionDataSources(modApp)).find((d) => d.kind === "runjs");
await addQuery(runjsModule.id, modVersion, mod.id, "getRows", "runjs", {
  code: 'return [{ id: 1, name: "alpha" }];', parameters: [], runOnPageLoad: true,
});
await addComponents(mod.id, modVersion, modPage, {
  [randomUUID()]: {
    name: "moduleText", type: "Text", layouts: layout(20, 2, 20, 40), parent: container?.[0],
    properties: { text: { value: "{{queries.getRows.data[0].name}}" } },
  },
});

// App: 3 pages
const app = (await req("POST", "/apps", { name: names.app, type: "front-end", icon: "floppydisk" })).json;
let appData = await getApp(app.id);
const appVersion = appData.editing_version.id;
const homePage = appData.editing_version.home_page_id;
const modulePage = randomUUID();
const workflowPage = randomUUID();
await req("POST", `/v2/apps/${app.id}/versions/${appVersion}/pages`, { id: modulePage, name: "module", handle: "module", index: 1 });
await req("POST", `/v2/apps/${app.id}/versions/${appVersion}/pages`, { id: workflowPage, name: "workflow", handle: "workflow", index: 2 });

appData = await getApp(app.id);
const appSources = await versionDataSources(appData);
const restInApp = appSources.find((d) => d.id === ds.id) || ds;
const workflowsSource = appSources.find((d) => d.kind === "workflows");
await addQuery(restInApp.id, appVersion, app.id, "getTodo", "restapi", restOptions("/todos/1"));
await addQuery(workflowsSource.id, appVersion, app.id, "runWf", "workflows", {
  workflowId: wfApp.co_relation_id || wf.id, workflowVersionId: "__default_branch_draft__", params: [], runOnPageLoad: true,
});

await addComponents(app.id, appVersion, homePage, {
  [randomUUID()]: { name: "todoText", type: "Text", layouts: layout(20), properties: { text: { value: "{{queries.getTodo.data.title}}" } } },
});
await addComponents(app.id, appVersion, modulePage, {
  [randomUUID()]: {
    name: "moduleViewer1", type: "ModuleViewer", layouts: container?.[1]?.layouts || layout(20, 2, 30, 200),
    properties: {
      moduleAppId: { value: modApp.co_relation_id || mod.id },
      moduleVersionId: { value: "", versionName: "" },
      visibility: { value: true },
    },
  },
});
await addComponents(app.id, appVersion, workflowPage, {
  [randomUUID()]: { name: "workflowText", type: "Text", layouts: layout(20), properties: { text: { value: "{{queries.runWf.data.title}}" } } },
});

// Folder
const folder = (await req("POST", "/folders", { name: names.folder, type: "front-end" })).json;
await req("POST", "/folder-apps", { folder_id: folder.id, app_id: app.id });

mkdirSync(OUT, { recursive: true });
console.log(JSON.stringify({ ws, app: app.id, mod: mod.id, wf: wf.id, container: container?.[0] ?? null }));

// Export: the app carries its module; workflows are exported on their own.
writeFileSync(`${OUT}/app.json`, JSON.stringify(await exportResource(app.id, appVersion), null, 2) + "\n");
writeFileSync(`${OUT}/workflow.json`, JSON.stringify(await exportResource(wf.id, wfVersion), null, 2) + "\n");
console.log("exported");
