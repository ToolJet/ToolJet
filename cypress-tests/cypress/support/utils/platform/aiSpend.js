import { aiSpendSelectors } from "Selectors/platform/cloudAiSpend";
import { aiSpendText } from "Texts/platform/cloudAiSpend";
import { createFreshCloudWorkspace, loginToWorkspace } from "Support/utils/platform/ai";

export const GHOST_USER_ID = "11111111-2222-4333-8444-555555555555";

// A fresh Team workspace, so every builder fits and its plan is set before the server caches the licence.
export const createSpendWorkspace = (adminEmail, signupWorkspaceId) =>
  createFreshCloudWorkspace(adminEmail, signupWorkspaceId).then((workspaceId) => {
    cy.apiSetCloudPlan("team", { workspaceId });
    loginToWorkspace(adminEmail, workspaceId);
    return cy.wrap(workspaceId);
  });

// Onboards a workspace member and hands the session back to the admin.
export const addSpendUser = (adminEmail, workspaceId, role) => {
  const name = `${role === "builder" ? "Builder" : "Viewer"}${Cypress._.random(1e5, 9e5)}`;
  const email = `${name.toLowerCase()}-${Date.now()}@tooljet.test`;
  loginToWorkspace(adminEmail, workspaceId);
  cy.apiFullUserOnboarding(name, email, role);
  loginToWorkspace(adminEmail, workspaceId);
  return cy
    .runSqlQueryOnDB(`SELECT id FROM users WHERE email = '${email}';`)
    .then((result) => ({ name, email, userId: result.rows[0].id }));
};

export const spendRequest = (method, path, workspaceId, body) =>
  cy.request({
    method,
    url: `${Cypress.env("server_host")}/api/ai/${path}`,
    headers: { "Tj-Workspace-Id": workspaceId },
    body,
    failOnStatusCode: false,
  });

// Validation errors come back as a list of messages, other refusals as one string.
export const messageOf = (response) => [].concat(response.body.message).join(" ");

export const fixWithAi = (workspaceId) =>
  spendRequest("POST", "fix-with-ai", workspaceId, {
    componentId: crypto.randomUUID(),
    key: "text",
    message: "x is not defined",
  });

export const openAiCreditsUsage = (adminEmail, workspaceId) => {
  loginToWorkspace(adminEmail, workspaceId);
  cy.visit(`/${workspaceId}/settings/ai-credits-usage`);
  cy.get(aiSpendSelectors.limitSwitch, { timeout: 60000 }).should("be.visible");
  cy.contains("h1", aiSpendText.pageTitle).should("be.visible");
};

export const builderRow = (name) => cy.contains(aiSpendSelectors.tableRows, name);

export const dialog = () => cy.get(aiSpendSelectors.dialog);
