import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { cloudSubscriptionSelectors } from "Selectors/platform/cloudSubscription";
import { cloudSubscriptionText } from "Texts/platform/cloudSubscription";
import { stubCurrentSubscription, stubPlanPrices } from "Support/utils/platform/cloudSubscription";

describe("Cloud Subscription — Payment Redirects and Deep Links", { retries: 0 }, () => {
  let workspaceId;

  const visitWithQuery = (query) => {
    cy.visit(`${cloudSubscriptionText.subscriptionPath(workspaceId)}?${query}`);
    cy.get(cloudSubscriptionSelectors.subscriptionOverview, { timeout: 60000 }).should("be.visible");
  };

  beforeEach(() => {
    cy.apiCloudSignup({ email: `cloud-sub-qp-${Date.now()}@tooljet.test`, name: fake.firstName }).then(
      (signup) => {
        workspaceId = signup.workspaceId;
      }
    );
    stubCurrentSubscription();
  });

  it("should show the success toast after a successful checkout redirect", () => {
    visitWithQuery("payment=success");
    cy.verifyToastMessage(commonSelectors.toastMessage, cloudSubscriptionText.paymentSuccessToast, false);
    cy.location("search").should("not.contain", "payment=");
  });

  it("should show the failure toast after a cancelled checkout redirect", () => {
    visitWithQuery("payment=failure");
    cy.verifyToastMessage(commonSelectors.toastMessage, cloudSubscriptionText.paymentFailureToast, false);
    cy.location("search").should("not.contain", "payment=");
  });

  it("should open checkout with the plan and billing period from the link", () => {
    stubPlanPrices();
    visitWithQuery("plan=pro&billing=monthly");

    cy.get(cloudSubscriptionSelectors.checkoutModalTitle).should("contain.text", cloudSubscriptionText.upgradePlanModalTitle);
    cy.get(cloudSubscriptionSelectors.checkoutPlanTypeValue).should("contain.text", cloudSubscriptionText.planTags.pro);
    cy.get(cloudSubscriptionSelectors.checkoutBillingToggle).should("not.be.checked");
    cy.get(cloudSubscriptionSelectors.checkoutBillingToggleLabel).should("contain.text", cloudSubscriptionText.payMonthly);
    cy.location("search").should("not.contain", "plan=").and("not.contain", "billing=");
  });

  it("should open checkout on yearly billing for a Team link", () => {
    stubPlanPrices();
    visitWithQuery("plan=team&billing=yearly");

    cy.get(cloudSubscriptionSelectors.checkoutPlanTypeValue).should("contain.text", cloudSubscriptionText.planTags.team);
    cy.get(cloudSubscriptionSelectors.checkoutBillingToggle).should("be.checked");
    cy.get(cloudSubscriptionSelectors.checkoutBillingToggleLabel).should("contain.text", cloudSubscriptionText.payYearly);
  });

  it("should consume currentTab=upgradePlan and stay on the subscription overview", () => {
    visitWithQuery("currentTab=upgradePlan");

    cy.location("search").should("not.contain", "currentTab=");
    cy.get(cloudSubscriptionSelectors.upgradeButton).scrollIntoView().should("be.visible");
    cy.get(cloudSubscriptionSelectors.checkoutModalTitle).should("not.exist");
  });
});
