import { fake } from "Fixtures/fake";
import { cloudAiSelectors } from "Selectors/platform/cloudAi";
import { cloudAiText } from "Texts/platform/cloudAi";
import { createFreshCloudWorkspace } from "Support/utils/platform/ai";
import { stubCurrentSubscription, stubPlanPrices } from "Support/utils/platform/cloudSubscription";

const fixWithAi = (workspaceId) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/ai/fix-with-ai`,
      headers: { ...headers, "Tj-Workspace-Id": workspaceId },
      body: { componentId: crypto.randomUUID(), key: "text", message: "x is not defined" },
      failOnStatusCode: false,
    })
  );

const visitHome = (workspaceId) => {
  cy.visit(`/${workspaceId}/home`);
  cy.contains("button", cloudAiText.getMoreCredits, { timeout: 60000 }).should("be.visible");
};

describe("Cloud AI Credits — Credit Enforcement", { retries: 0 }, () => {
  const adminEmail = `cloud-ai-enf-${Date.now()}@tooljet.test`;
  let signupWorkspaceId;
  let workspaceId;

  before(() => {
    cy.apiCloudSignup({ email: adminEmail, name: fake.firstName }).then((signup) => {
      signupWorkspaceId = signup.workspaceId;
    });
  });

  beforeEach(() => {
    createFreshCloudWorkspace(adminEmail, signupWorkspaceId).then((id) => {
      workspaceId = id;
    });
  });

  it("should reject Fix with AI with 402 when the gateway balance is too low", () => {
    cy.apiSetCloudPlan("pro", { workspaceId });
    cy.task("aiGatewayStub").its("id").should("be.a", "string");

    cy.setAiGatewayBalance(0, workspaceId);
    fixWithAi(workspaceId).then((response) => {
      expect(response.status).to.equal(402);
      expect(response.body.message).to.equal(cloudAiText.noCreditsLeft);
    });

    cy.setAiGatewayBalance(2, workspaceId);
    fixWithAi(workspaceId).then((response) => {
      expect(response.status).to.equal(402);
      expect(response.body.message).to.equal(cloudAiText.insufficientCredits);
    });

    // Both answers must have come from this run's stub, not another process on the port.
    cy.task("aiGatewayStub").its(`hits.${workspaceId}`).should("be.gte", 2);
  });

  it("should send an admin from Get more credits to the Add AI credits modal", () => {
    cy.apiSetCloudPlan("pro", { workspaceId });
    cy.setAiGatewayBalance(0, workspaceId);
    stubCurrentSubscription();
    stubPlanPrices();
    visitHome(workspaceId);

    cy.contains("button", cloudAiText.getMoreCredits).click();
    cy.location("pathname").should("eq", `/${workspaceId}/settings/subscription`);
    cy.get(cloudAiSelectors.addCreditsModal, { timeout: 60000 })
      .should("be.visible")
      .find(cloudAiSelectors.addCreditsModalTitle)
      .should("contain.text", cloudAiText.addCreditsModalTitle);
  });

  it("should ask a builder to contact the admin for more credits", () => {
    const builderEmail = `cloud-ai-builder-${Date.now()}@tooljet.test`;
    cy.apiSetCloudPlan("pro", { workspaceId });
    cy.setAiGatewayBalance(0, workspaceId);
    cy.apiFullUserOnboarding(fake.firstName, builderEmail, "builder");
    cy.apiLogout();
    cy.apiLogin(builderEmail, "password", workspaceId);
    visitHome(workspaceId);

    cy.contains("button", cloudAiText.getMoreCredits).click();
    cy.get('[data-cy="modal-title"]').should("contain.text", cloudAiText.contactAdminTitle);
    cy.get('[data-cy="modal-body"]').should("contain.text", cloudAiText.contactAdminBody);
    cy.location("pathname").should("eq", `/${workspaceId}/home`);
  });
});
