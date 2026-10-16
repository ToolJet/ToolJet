import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { workflowSelector } from "Selectors/platform/workflows";
import {
  wfStartNode,
  wfQueryNode,
  wfEdge,
  workflowDefinition,
  createRunjsQueries,
  cleanupWorkflows,
} from "Support/utils/workflows/workFlows";

const data = {};

const asCurrentUser = (method, path, body) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${Cypress.env("server_host")}${path}`,
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "tj-workspace-id": Cypress.env("workspaceId"),
      },
      body,
      failOnStatusCode: false,
    })
  );

// Default role groups: admin and builder create/edit workflows; an end user
// can only run them (granular "Workflows: view" on all workflows).
describe("Workflows - role permissions", () => {
  beforeEach(() => {
    data.workflowName = `${fake.lastName.toLowerCase()}-perm`;
    data.builderWorkflow = `${data.workflowName}-by-builder`;
    data.email = fake.email.toLowerCase();

    cy.apiLogin();
    cy.visit("/");
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    createRunjsQueries({ pong: "return 'pong'" }).then((ids) => {
      data.definition = workflowDefinition({
        nodes: [wfStartNode(), wfQueryNode("pong-node", ids.pong)],
        edges: [wfEdge("start", "pong-node")],
        queryIds: [ids.pong],
      });
      cy.apiSaveWorkflowDefinition(data.definition);
    });
    cy.apiFullUserOnboarding(fake.firstName, data.email, "end-user");
    cy.apiLogout();
  });

  afterEach(() => {
    cy.apiLogout();
    cy.apiLogin();
    cy.visit("/");
    cleanupWorkflows([data.workflowName, data.builderWorkflow]);
  });

  it("An end user can run workflows but cannot create, edit or inspect them", () => {
    cy.apiLogin(data.email);
    cy.visit("/");

    cy.then(() => {
      const workflowId = Cypress.env("workflowId");
      const versionId = Cypress.env("editingVersionId");

      asCurrentUser("POST", "/api/workflows", {
        icon: "menuhome",
        name: data.builderWorkflow,
        type: "workflow",
      }).then((res) => {
        expect(res.status, "end user create").to.equal(403);
      });

      asCurrentUser("PUT", `/api/v2/apps/${workflowId}/versions/${versionId}`, {
        is_user_switched_version: false,
        definition: data.definition,
      }).then((res) => {
        expect(res.status, `end user edit: ${JSON.stringify(res.body)}`).to.equal(403);
      });

      cy.apiRunWorkflow().then((res) => {
        expect(res.status, "end user run").to.equal(201);
        // Run details (node inputs/outputs) need edit permission.
        asCurrentUser(
          "GET",
          `/api/workflow_executions/${res.body.workflowExecution.id}`
        )
          .its("status")
          .should("equal", 403);
      });
    });

    // The dashboard lists the workflow for the end user, without a Create button.
    cy.then(() => cy.visit(`/${Cypress.env("workspaceId")}/workflows`));
    cy.get(commonSelectors.appCard(data.workflowName)).should("be.visible");
    cy.get(workflowSelector.workflowsCreateButton).should("not.exist");
  });

  it("A builder can create a workflow and edit it", () => {
    cy.apiLogin();
    cy.apiUpdateUserRole(data.email, "builder");
    cy.apiLogout();

    cy.apiLogin(data.email);
    cy.visit("/");
    asCurrentUser("POST", "/api/workflows", {
      icon: "menuhome",
      name: data.builderWorkflow,
      type: "workflow",
    }).then((res) => {
      expect(res.status, "builder create").to.equal(201);
      Cypress.env("workflowId", res.body.id);
    });
    cy.apiFetchWorkflowContext();
    cy.then(() => cy.apiSaveWorkflowDefinition(data.definition));
    cy.apiRunWorkflow().its("status").should("equal", 201);
  });
});
