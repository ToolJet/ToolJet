import { fake } from "Fixtures/fake";
import {
  wfStartNode,
  wfQueryNode,
  wfEdge,
  workflowDefinition,
  createRunjsQueries,
  findExecutionNode,
  cleanupWorkflows,
} from "Support/utils/workflows/workFlows";

const data = {};

// Creates a constant (type "Global") or secret (type "Secret") with one value
// in every environment and resolves with its id.
const createConstant = (name, value, type) =>
  cy.apiGetEnvironments().then((environments) =>
    cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organization-constants`,
          headers,
          body: {
            constant_name: name,
            value,
            type,
            environments: environments.map((env) => env.id),
          },
        })
        .then((res) => {
          expect(res.status).to.equal(201);
          return res.body.constant.id;
        })
    )
  );

const deleteConstant = (id) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "DELETE",
      url: `${Cypress.env("server_host")}/api/organization-constants/${id}`,
      headers,
      failOnStatusCode: false,
    })
  );

// Runs in the given environment and resolves with the `read` node's data.
const runAndReadValues = (environmentId) => {
  cy.apiRunWorkflow({ environmentId }).its("status").should("equal", 201);
  cy.apiGetWorkflowExecution().its("status").should("equal", "success");
  return cy
    .apiGetWorkflowExecutionNodes()
    .then((nodes) => findExecutionNode(nodes, "read").result.data);
};

describe("Workflows - workspace constants and secrets", () => {
  beforeEach(() => {
    const suffix = fake.lastName.toLowerCase().replace(/[^a-z]/g, "");
    data.constantName = `wf_const_${suffix}`;
    data.secretName = `wf_secret_${suffix}`;
    data.workflowName = `${suffix}-consts`;

    cy.apiLogin();
    cy.visit("/");
    createConstant(data.constantName, "dev-constant", "Global").then(
      (id) => (data.constantId = id)
    );
    createConstant(data.secretName, "dev-secret", "Secret").then(
      (id) => (data.secretId = id)
    );
    cy.then(() => {
      cy.apiUpdateWsConstant(data.constantId, "prod-constant", "production");
      cy.apiUpdateWsConstant(data.secretId, "prod-secret", "production");
    });

    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    createRunjsQueries({
      // RunJS sees secrets only as a mask; their values are meant for data
      // source configuration, so nothing derived from them is readable here.
      read: `return { constant: constants.${data.constantName}, secret: secrets.${data.secretName}, secretPart: secrets.${data.secretName}.split("-")[0] }`,
    }).then((ids) => {
      cy.apiSaveWorkflowDefinition(
        workflowDefinition({
          nodes: [wfStartNode(), wfQueryNode("read-node", ids.read)],
          edges: [wfEdge("start", "read-node")],
          queryIds: [ids.read],
        })
      );
    });
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
    cy.then(() => {
      deleteConstant(data.constantId);
      deleteConstant(data.secretId);
    });
  });

  it("A node reads the constant value of the environment it runs in and never sees a secret in clear text", () => {
    runAndReadValues(Cypress.env("environmentId")).then((values) => {
      expect(values).to.deep.equal({
        constant: "dev-constant",
        secret: "********",
        secretPart: "********",
      });
    });

    // Promote the version to production and run it there.
    cy.then(() => {
      const workflowId = Cypress.env("workflowId");
      cy.apiPublishDraftVersion("v1", "", workflowId);
      cy.apiPromoteAppVersion(Cypress.env("environmentId"), workflowId).then(
        () => cy.apiPromoteAppVersion(Cypress.env("stagingEnvId"), workflowId)
      );
    });
    cy.then(() =>
      runAndReadValues(Cypress.env("productionEnvId")).then((values) => {
        expect(values).to.deep.equal({
          constant: "prod-constant",
          secret: "********",
          secretPart: "********",
        });
      })
    );
  });
});
