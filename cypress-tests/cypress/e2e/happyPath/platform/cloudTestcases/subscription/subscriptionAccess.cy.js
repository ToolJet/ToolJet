import { fake } from "Fixtures/fake";
import { cloudSubscriptionSelectors } from "Selectors/platform/cloudSubscription";
import { cloudSubscriptionText } from "Texts/platform/cloudSubscription";

describe("Cloud Subscription — Admin-only Access", { retries: 0 }, () => {
  let workspaceId;
  let adminEmail;

  const expectForbidden = (path) => {
    cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/organization/payment/${workspaceId}/${path}`,
          headers,
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status, path).to.equal(403);
          expect(response.body.message).to.equal(cloudSubscriptionText.forbiddenMessage);
        })
    );
  };

  beforeEach(() => {
    adminEmail = `cloud-sub-acc-${Date.now()}@tooljet.test`;
    cy.apiCloudSignup({ email: adminEmail, name: fake.firstName }).then((signup) => {
      workspaceId = signup.workspaceId;
    });
  });

  [
    ["builder", "builder"],
    ["end user", "end-user"],
  ].forEach(([roleName, role]) => {
    it(`should keep a ${roleName} out of the subscription page and its APIs`, () => {
      const memberEmail = `${role}-${adminEmail}`;
      cy.apiFullUserOnboarding(fake.firstName, memberEmail, role, "password");
      cy.clearCookies();
      cy.apiLogin(memberEmail, "password", workspaceId);

      expectForbidden("plan");
      expectForbidden("invoice");

      cy.visit(cloudSubscriptionText.subscriptionPath(workspaceId));
      cy.location("pathname", { timeout: 60000 }).should("not.contain", "/settings/subscription");
      cy.get(cloudSubscriptionSelectors.subscriptionOverview).should("not.exist");
    });
  });
});
