import { fake } from "Fixtures/fake";
import { workflowSelector } from "Selectors/platform/workflows";
import { workflowsText } from "Texts/platform/workflows";
import {
  wfStartNode,
  wfQueryNode,
  wfEdge,
  workflowDefinition,
  createRunjsQueries,
  cleanupWorkflows,
} from "Support/utils/workflows/workFlows";

const data = {};

const pongDefinition = (ids) =>
  workflowDefinition({
    nodes: [wfStartNode(), wfQueryNode("pong-node", ids.pong)],
    edges: [wfEdge("start", "pong-node")],
    queryIds: [ids.pong],
  });

const requestRelease = (workflowId, versionId) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "PUT",
      url: `${Cypress.env("server_host")}/api/apps/${workflowId}/release`,
      headers,
      body: { versionToBeReleased: versionId },
      failOnStatusCode: false,
    })
  );

const requestDefinitionSave = (workflowId, versionId, definition) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "PUT",
      url: `${Cypress.env("server_host")}/api/v2/apps/${workflowId}/versions/${versionId}`,
      headers: { ...headers, "Content-Type": "application/json" },
      body: { is_user_switched_version: false, definition },
      failOnStatusCode: false,
    })
  );

describe("Workflows - versions, promotion and release", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-ver`;
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    createRunjsQueries({ pong: "return 'pong'" }).then((ids) => {
      data.ids = ids;
      cy.apiSaveWorkflowDefinition(pongDefinition(ids));
    });
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("Release is refused before production, and a promoted version can no longer be edited", () => {
    cy.then(() => {
      const workflowId = Cypress.env("workflowId");
      const versionId = Cypress.env("editingVersionId");

      cy.apiPublishDraftVersion("v1", "", workflowId);
      requestRelease(workflowId, versionId).then((res) => {
        expect(res.status, "release from development").to.equal(400);
        expect(res.body.message).to.equal(
          workflowsText.releaseNeedsProductionError
        );
      });

      cy.apiPromoteAppVersion(Cypress.env("environmentId"), workflowId);
      requestDefinitionSave(
        workflowId,
        versionId,
        pongDefinition(data.ids)
      ).then((res) => {
        expect(res.status, "edit after promotion").to.equal(400);
      });

      cy.then(() =>
        cy.apiPromoteAppVersion(Cypress.env("stagingEnvId"), workflowId)
      );
      requestRelease(workflowId, versionId)
        .its("status")
        .should("equal", 200);

      cy.getAuthHeaders().then((headers) =>
        cy
          .request({
            url: `${Cypress.env("server_host")}/api/apps/${workflowId}`,
            headers,
          })
          .its("body.current_version_id")
          .should("equal", versionId)
      );
    });
  });

  it("A published version opens locked and creating a draft unlocks it", () => {
    cy.then(() =>
      cy.apiPublishDraftVersion("v1", "", Cypress.env("workflowId"))
    );
    cy.openWorkflow();

    cy.get(workflowSelector.versionLockBanner).should("be.visible");
    cy.get(workflowSelector.versionLockInfoText).should(
      "contain.text",
      workflowsText.versionLockedText
    );

    cy.get(workflowSelector.createDraftLink).click();
    cy.get(workflowSelector.confirmYesButton).click();
    cy.get(workflowSelector.versionLockBanner).should("not.exist");
  });
});
