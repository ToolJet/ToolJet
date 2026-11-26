import { fake } from "Fixtures/fake";
import { cloudSubscriptionSelectors } from "Selectors/platform/cloudSubscription";
import { cloudSubscriptionText } from "Texts/platform/cloudSubscription";
import {
  openSubscriptionPage,
  stripePlanPrices,
  stubCurrentSubscription,
  stubPlanPrices,
  verifyPaidFooter,
  verifyPlanTag,
  verifyUpgradeFooter,
} from "Support/utils/platform/cloudSubscription";

describe("Cloud Subscription — Footer Actions", { retries: 0 }, () => {
  let workspaceId;

  beforeEach(() => {
    cy.apiCloudSignup({ email: `cloud-sub-ft-${Date.now()}@tooljet.test`, name: fake.firstName }).then(
      (signup) => {
        workspaceId = signup.workspaceId;
      }
    );
  });

  it("should offer Compare plans and Upgrade to a trial workspace", () => {
    stubCurrentSubscription();
    openSubscriptionPage(workspaceId);
    cy.window().then((win) => cy.stub(win, "open").as("windowOpen"));

    verifyUpgradeFooter();
    cy.get(cloudSubscriptionSelectors.comparePlansButton).click();
    cy.get("@windowOpen").should("have.been.calledWith", cloudSubscriptionText.pricingPageUrl);

    cy.get(cloudSubscriptionSelectors.upgradeButton).click();
    cy.get(cloudSubscriptionSelectors.pricingModal).should("be.visible");
    cloudSubscriptionText.pricingModalPlans.forEach((planKey) =>
      cy.get(cloudSubscriptionSelectors.pricingPlanColumn(planKey)).should("be.visible")
    );
  });

  it("should offer Compare plans and Upgrade to a Basic workspace", () => {
    cy.apiSetCloudPlan("basic", { workspaceId });
    stubCurrentSubscription();
    openSubscriptionPage(workspaceId);

    verifyUpgradeFooter();
    cy.get(cloudSubscriptionSelectors.upgradeButton).click();
    cy.get(cloudSubscriptionSelectors.pricingModal).should("be.visible");
  });

  it("should show the amount, View invoices and Manage subscription to a paid subscriber", () => {
    cy.apiSetCloudPlan("pro", { workspaceId });
    stubCurrentSubscription({ plan: "pro", quantity: 2, subscriptionType: "yearly" });
    stubPlanPrices();
    openSubscriptionPage(workspaceId);

    verifyPlanTag(cloudSubscriptionText.planTags.pro);
    verifyPaidFooter(`$${2 * stripePlanPrices.plans.pro.yearly.amount}/year`);

    cy.get(cloudSubscriptionSelectors.manageSubscriptionButton).click();
    cy.get(cloudSubscriptionSelectors.checkoutModalTitle).should(
      "contain.text",
      cloudSubscriptionText.manageSubscriptionModalTitle
    );
  });

  it("should keep the paid footer without a total when Stripe prices can't be loaded", () => {
    cy.apiSetCloudPlan("team", { workspaceId });
    stubCurrentSubscription({ plan: "team", quantity: 3, subscriptionType: "yearly" });
    openSubscriptionPage(workspaceId);

    verifyPaidFooter(cloudSubscriptionText.pricesUnavailableTotal);
  });

  it.skip("should show the subscription's next due date in the paid footer", () => {
    const periodEnd = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    cy.apiSetCloudPlan("pro", { workspaceId });
    stubCurrentSubscription({
      plan: "pro",
      quantity: 2,
      subscriptionType: "yearly",
      currentPeriodEnd: Math.floor(periodEnd.getTime() / 1000),
    });
    openSubscriptionPage(workspaceId);

    const expected = periodEnd
      .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      .replace(",", "");
    cy.get(cloudSubscriptionSelectors.footerDueDate).should("have.text", cloudSubscriptionText.nextDueOn(expected));
  });

  it("should drop an expired paid workspace back to the Free plan with upgrade actions", () => {
    cy.apiSetCloudPlan("pro", { workspaceId, expiryDays: -3, wait: false });
    cy.waitForCloudPlan("basic", workspaceId).then((access) => {
      expect(access.licenseStatus).to.include({ isExpired: true, licenseType: "basic" });
    });
    stubCurrentSubscription({ plan: "pro", quantity: 2, subscriptionType: "yearly" });
    openSubscriptionPage(workspaceId);

    verifyPlanTag(cloudSubscriptionText.planTags.basic);
    verifyUpgradeFooter();
  });
});
