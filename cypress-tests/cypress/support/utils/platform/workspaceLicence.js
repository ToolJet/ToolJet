import { createFreshCloudWorkspace, loginToWorkspace } from "Support/utils/platform/ai";

export const wsRequest = (workspaceId, method, path, { body, qs } = {}) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${Cypress.env("server_host")}/api${path}`,
      headers: { ...headers, "Tj-Workspace-Id": workspaceId },
      body,
      qs,
      failOnStatusCode: false,
      log: false,
    })
  );

const describeBody = (res) => JSON.stringify(res.body).slice(0, 300);

export const expectStatus = (res, label, allowed = [200, 201]) => {
  expect(res.status, `${label}: ${describeBody(res)}`).to.be.oneOf(allowed);
  return res;
};

// Cloud caps workspaces per account, so each case signs up its own admin and sets the plan on that signup workspace.
export const signUpOnPlan = (plan, prefix = "cloud-wsl") => {
  const email = `${prefix}-${Date.now()}-${Cypress._.random(1000, 9999)}@tooljet.test`;
  return cy.apiCloudSignup({ email, name: "Cloud Admin" }).then(({ workspaceId }) => {
    cy.apiSetCloudPlan(plan, { workspaceId });
    loginToWorkspace(email, workspaceId);
    return cy.wrap({ email, workspaceId });
  });
};

export const addWorkspaceOnPlan = (email, loginWorkspaceId, plan) =>
  createFreshCloudWorkspace(email, loginWorkspaceId).then((workspaceId) => {
    cy.apiSetCloudPlan(plan, { workspaceId });
    loginToWorkspace(email, workspaceId);
    return cy.wrap(workspaceId);
  });

export const createSeedApp = (workspaceId, name) =>
  wsRequest(workspaceId, "POST", "/apps", {
    body: { type: "front-end", name, is_maintenance_on: false, workflow_enabled: false, creation_mode: "DEFAULT" },
  }).then((res) => expectStatus(res, `create app ${name}`, [201]).body);

export const exportApp = (workspaceId, appId) =>
  wsRequest(workspaceId, "POST", "/v2/resources/export", {
    body: { app: [{ id: appId }], tooljet_database: [], organization_id: workspaceId },
  });

export const cloneApp = (workspaceId, appId, name) =>
  wsRequest(workspaceId, "POST", "/v2/resources/clone", {
    body: { app: [{ id: appId, name }], tooljet_database: [], organization_id: workspaceId },
  });

export const importApp = (workspaceId, exported, appName) =>
  wsRequest(workspaceId, "POST", "/v2/resources/import", {
    body: {
      ...exported,
      organization_id: workspaceId,
      app: (exported.app || []).map((app) => ({ ...app, appName })),
    },
  });

export const listApps = (workspaceId) =>
  wsRequest(workspaceId, "GET", "/apps", { qs: { page: 1, type: "front-end", searchKey: "" } }).then(
    (res) => expectStatus(res, "list apps", [200]).body
  );

export const appNamesOf = (listBody) => (listBody.apps || []).map((app) => app.name);
