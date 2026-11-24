import {
  workflowSelector,
  humanSelector,
  approvalSelector,
  executionsSelector,
  executionsFilterSelector,
} from "Selectors/platform/workflows";
import { humanWorkflowDefinition } from "Support/utils/workflows/workFlows";
import { humanText } from "Texts/platform/workflows";
import { cleanEmailBody } from "Support/utils/whitelabel";

export const createHumanWorkflow = (workflowName, options = {}) => {
  cy.apiCreateWorkflowApp(workflowName);
  cy.apiFetchWorkflowContext();
  cy.apiSaveWorkflowDefinition(humanWorkflowDefinition(options));
};

export const runUntilWaiting = (params = {}) => {
  cy.apiRunWorkflow({ params }).its("status").should("equal", 201);
  return cy.apiWaitForApproval();
};

export const asUser = (email, password = "password") => {
  cy.apiLogout();
  cy.apiLogin(email, password);
};

export const visitApprovals = () => {
  cy.intercept("GET", "/api/workflow-approvals*").as("approvalsList");
  cy.visit(`/${Cypress.env("workspaceId")}/workflows/approvals`);
  cy.wait("@approvalsList", { timeout: 90000 });
  cy.get(approvalSelector.page, { timeout: 30000 }).should("be.visible");
};

export const visitExecutions = () => {
  cy.visit(`/${Cypress.env("workspaceId")}/workflows/executions`);
  cy.get(executionsSelector.page, { timeout: 30000 }).should("be.visible");
};

export const openApprovalRequest = (requestId) => {
  cy.get(approvalSelector.row(requestId), { timeout: 20000 })
    .should("be.visible")
    .click();
  cy.get(approvalSelector.detail).should("be.visible");
};

export const chooseOutcomeInDialog = (outcomeKey) => {
  cy.intercept("POST", "/api/workflow-approvals/by-id/*/resolve").as(
    "resolveApproval"
  );
  cy.get(approvalSelector.outcomeButton(outcomeKey)).click();
  return cy.wait("@resolveApproval");
};

export const resolveInApprovalsTab = (requestId, outcomeKey) => {
  openApprovalRequest(requestId);
  chooseOutcomeInDialog(outcomeKey).its("response.statusCode").should("equal", 201);
  cy.get(approvalSelector.detail).should("not.exist");
};

// A run started before the environment resolves posts an empty environmentId (400).
export const openWorkflowEditor = () => {
  cy.intercept("GET", "/api/app-environments/*/versions*").as("editorEnvironment");
  cy.openWorkflow();
  cy.wait("@editorEnvironment", { timeout: 30000 });
};

export const openNodesSidebar = () => {
  cy.get(humanSelector.nodesSidebarIcon).click();
  cy.get(humanSelector.sidebarHumanNode).should("be.visible");
};

export const openHumanSettings = (nodeName = "human1") => {
  cy.get(humanSelector.node(nodeName)).click({ force: true });
  cy.get(humanSelector.modal).should("be.visible");
};

export const assertOutcomeHandles = (nodeName, outcomeKeys) => {
  cy.get(`[data-cy^="${nodeName}-node-handle-right-"]`).should(
    "have.length",
    outcomeKeys.length
  );
  outcomeKeys.forEach((key) =>
    cy.get(humanSelector.outcomeHandle(nodeName, key)).should("exist")
  );
};

export const runFromEditorUntilWaiting = (humanName = "human1") => {
  cy.get(humanSelector.node(humanName), { timeout: 30000 }).should("be.visible");
  cy.intercept("POST", "/api/workflow_executions/*/trigger").as("editorRun");
  cy.get(workflowSelector.workflowRunButton).should("not.be.disabled").click();
  cy.wait("@editorRun", { responseTimeout: 60000 }).then(({ response }) => {
    expect(response.statusCode, JSON.stringify(response.body)).to.equal(201);
  });
  cy.get(humanSelector.logRunItem, { timeout: 30000 })
    .first()
    .should("contain.text", "Waiting for input");
  cy.get(humanSelector.nodeColumnItem(humanName)).click();
  cy.get(humanSelector.waitingBanner, { timeout: 30000 }).should("be.visible");
};

export const pickSelectOption = (controlSelector, optionText) => {
  cy.get(controlSelector).click();
  const escaped = optionText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  cy.contains(".react-select__option", new RegExp(`^${escaped}$`)).click();
};

// React ignores .invoke("val") on controlled inputs, so set the native value.
export const setNativeInputValue = (selector, value) => {
  cy.get(selector).then(($input) => {
    const input = $input[0];
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      "value"
    ).set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

export const dragSidebarNodeToCanvas = (sidebarSelector, x = 650, y = 420) => {
  const dataTransfer = new DataTransfer();
  cy.get(sidebarSelector).trigger("dragstart", { dataTransfer });
  cy.get(".react-flow")
    .trigger("dragover", { dataTransfer, clientX: x, clientY: y })
    .trigger("drop", { dataTransfer, clientX: x, clientY: y });
};

export const uniqueEmail = (label) =>
  `hitl-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

export const getUserIdByEmail = (email) =>
  cy
    .task("dbConnection", {
      dbconfig: Cypress.env("app_db"),
      sql: `SELECT id FROM users WHERE email = '${email}'`,
    })
    .then((result) => result.rows[0].id);

export const createApproverGroup = (groupName, userIds) =>
  cy.getAuthHeaders().then((headers) => {
    const base = `${Cypress.env("server_host")}/api/v2/group-permissions`;
    return cy
      .request({ method: "POST", url: base, headers, body: { name: groupName } })
      .then(({ body }) => {
        return cy
          .request({
            method: "POST",
            url: `${base}/${body.id}/users`,
            headers,
            body: { userIds, groupId: body.id },
          })
          .its("status")
          .should("be.within", 200, 201)
          .then(() => body.id);
      });
  });

export const deleteApproverGroup = (groupId) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "DELETE",
      url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}`,
      headers,
      failOnStatusCode: false,
    })
  );

const MAIL_POLL_ATTEMPTS = 20;
const MAIL_POLL_DELAY_MS = 1500;

const pause = (ms) =>
  cy.wrap(null, { log: false }).then(() => new Promise((resolve) => setTimeout(resolve, ms)));

const mailHogBase = () =>
  (Cypress.env("mailHogUrl") || "http://localhost:8025/").replace(/\/+$/, "");

// The shared MailHog holds megabytes of mail; /messages is too slow, the search endpoint is not.
export const approvalMailsFor = (email, workflowName) => {
  const auth = Cypress.env("mailHogAuth");
  const [user, pass] = auth ? String(auth).split(":") : [];
  return cy
    .request({
      method: "GET",
      url: `${mailHogBase()}/api/v2/search`,
      qs: { kind: "to", query: email, limit: 50 },
      ...(user ? { auth: { user, pass } } : {}),
      timeout: 60000,
      log: false,
    })
    .then(({ body }) =>
      (body.items || []).filter((mail) =>
        (mail.Content?.Headers?.Subject || [])
          .join(" ")
          .includes(humanText.approvalEmailSubject(workflowName))
      )
    );
};

export const waitForApprovalMails = (email, workflowName, attempt = 1) =>
  approvalMailsFor(email, workflowName).then((mails) => {
    if (mails.length) return mails;
    if (attempt >= MAIL_POLL_ATTEMPTS) {
      throw new Error(`No approval email for ${email} after ${attempt} attempts`);
    }
    return pause(MAIL_POLL_DELAY_MS).then(() =>
      waitForApprovalMails(email, workflowName, attempt + 1)
    );
  });

export const approvalMailBody = (mail) => {
  const headers = mail.Content?.Headers || {};
  const encoding = (headers["Content-Transfer-Encoding"] || []).join("").toLowerCase();
  const raw = mail.Content?.Body || "";
  const decoded = encoding === "base64" ? atob(raw.replace(/\s+/g, "")) : raw;
  return cleanEmailBody(decoded);
};

export const approvalMailLink = (cleanedBody) =>
  cleanedBody.match(/href=["']?(https?:\/\/[^"'\s>]*\/workflows\/approvals)/i)?.[1];

export const archiveApproverUser = (email) =>
  cy
    .task("dbConnection", {
      dbconfig: Cypress.env("app_db"),
      sql: `SELECT ou.id FROM organization_users ou JOIN users u ON u.id = ou.user_id WHERE u.email = '${email}'`,
    })
    .then((result) =>
      cy.getAuthHeaders().then((headers) =>
        cy
          .request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/organization-users/${result.rows[0].id}/archive`,
            headers,
            body: {},
          })
          .its("status")
          .should("be.within", 200, 201)
      )
    );

export const deleteApproverUsers = (emails) =>
  cy
    .task("dbConnection", {
      dbconfig: Cypress.env("app_db"),
      sql: "SELECT 1 FROM pg_proc WHERE proname = 'delete_users'",
    })
    .then((result) => {
      if (result.rows.length) {
        cy.runSqlQueryOnDB(
          `CALL delete_users(ARRAY['${emails.join("','")}']::text[]);`
        );
      }
    });

export const filterExecutionsByWorkflow = (workflowName) => {
  pickSelectOption(
    `${executionsFilterSelector.workflow} .react-select__control`,
    workflowName
  );
};

export const visitExecutionsOf = (workflowName) => {
  visitExecutions();
  filterExecutionsByWorkflow(workflowName);
  cy.get(executionsFilterSelector.anyRow, { timeout: 30000 }).should("exist");
};
