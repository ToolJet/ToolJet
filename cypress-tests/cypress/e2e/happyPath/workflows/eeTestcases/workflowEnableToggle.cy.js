import { fake } from "Fixtures/fake";
import { workflowSelector } from "Selectors/platform/workflows";
import { workflowsText } from "Texts/platform/workflows";
import {
  wfStartNode,
  wfQueryNode,
  wfResponseNode,
  wfEdge,
  workflowDefinition,
  createRunjsQueries,
  cleanupWorkflows,
} from "Support/utils/workflows/workFlows";

const data = {};

const draftQuery = () => ({
  version: Cypress.env("editingVersionName"),
  environment: "development",
});

// The header "Enable" toggle writes apps.is_maintenance_on.
describe("Workflows - enable toggle", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-toggle`;
    cy.apiCreateWorkflow(data.workflowName);
    cy.apiFetchWorkflowContext();
    cy.apiGetWorkflowToken().then((token) => (data.token = token));
    createRunjsQueries({ pong: "return 'pong'" }).then((ids) => {
      cy.apiSaveWorkflowDefinition(
        workflowDefinition({
          nodes: [
            wfStartNode(),
            wfQueryNode("pong-node", ids.pong),
            wfResponseNode("response", "return pong.data"),
          ],
          edges: [
            wfEdge("start", "pong-node"),
            wfEdge("pong-node", "response", "success"),
          ],
          queryIds: [ids.pong],
        })
      );
    });
    cy.apiSetWorkflowWebhookEnabled(true);
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("A disabled workflow refuses API runs and webhooks until it is re-enabled", () => {
    cy.apiSetWorkflowEnabled(false);

    cy.apiRunWorkflow().then((res) => {
      expect(res.status, "API run while disabled").to.equal(403);
      expect(res.body.message).to.equal(workflowsText.workflowDisabledError);
    });
    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({ token: data.token, qs: draftQuery() })
        .then((res) => {
          expect(res.status, "webhook while disabled").to.equal(403);
          expect(res.body.message).to.equal(
            workflowsText.workflowDisabledError
          );
        })
    );

    cy.apiSetWorkflowEnabled(true);

    cy.apiRunWorkflow().its("status").should("equal", 201);
    cy.apiGetWorkflowExecution().its("status").should("equal", "success");
    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({ token: data.token, qs: draftQuery() })
        .then((res) => {
          expect(res.status).to.be.oneOf([200, 201]);
          expect(res.body).to.equal("pong");
        })
    );
  });

  it("The editor toggle disables the Run button and persists across reloads", () => {
    cy.intercept("PUT", "/api/apps/*").as("setMaintenance");
    cy.openWorkflow();

    cy.get(workflowSelector.workflowEnableToggle).should("be.checked");
    cy.get(workflowSelector.workflowRunButton).should("not.be.disabled");

    cy.get(workflowSelector.workflowEnableToggle).click({ force: true });
    cy.wait("@setMaintenance");
    cy.get(workflowSelector.workflowRunButton).should("be.disabled");
    cy.apiRunWorkflow().its("status").should("equal", 403);

    cy.reload();
    cy.get(workflowSelector.workflowEnableToggle).should("not.be.checked");
    cy.get(workflowSelector.workflowRunButton).should("be.disabled");

    cy.get(workflowSelector.workflowEnableToggle).click({ force: true });
    cy.wait("@setMaintenance");
    cy.get(workflowSelector.workflowRunButton).should("not.be.disabled");
    cy.apiRunWorkflow().its("status").should("equal", 201);
  });
});
