import { fake } from "Fixtures/fake";
import { cloudSubscriptionSelectors } from "Selectors/platform/cloudSubscription";
import { cloudSubscriptionText } from "Texts/platform/cloudSubscription";
import {
  openSubscriptionPage,
  stubCurrentSubscription,
  verifyFeatureAccess,
  verifyPlanTag,
} from "Support/utils/platform/cloudSubscription";

describe("Cloud Subscription — Overview and Feature Access", { retries: 0 }, () => {
  let workspaceId;

  beforeEach(() => {
    cy.apiCloudSignup({ email: `cloud-sub-ov-${Date.now()}@tooljet.test`, name: fake.firstName }).then(
      (signup) => {
        workspaceId = signup.workspaceId;
      }
    );
  });

  it("should show the overview with the Trial plan tag and trial feature access", () => {
    stubCurrentSubscription();
    openSubscriptionPage(workspaceId);
    verifyPlanTag(cloudSubscriptionText.planTags.trial);
    cy.get(cloudSubscriptionSelectors.planTag).should("have.class", "valid-status");
    cy.get(cloudSubscriptionSelectors.subscriptionLimitsLabel).should("have.text", cloudSubscriptionText.subscriptionLimits);
    cy.apiGetLicenseAccess(workspaceId).then((access) => {
      expect(access.auditLogs).to.equal(true);
      verifyFeatureAccess(access);
    });
  });

  it("should show the Free plan tag and Basic feature access for a workspace without a licence", () => {
    cy.apiSetCloudPlan("basic", { workspaceId }).then((access) => {
      stubCurrentSubscription();
      openSubscriptionPage(workspaceId);
      verifyPlanTag(cloudSubscriptionText.planTags.basic);
      cy.get(cloudSubscriptionSelectors.planTag).should("have.class", "basic-status");
      expect(access.auditLogs).to.equal(false);
      verifyFeatureAccess(access);
    });
  });

  it("should show the Pro plan tag and Pro feature access for a Pro subscriber", () => {
    cy.apiSetCloudPlan("pro", { workspaceId }).then((access) => {
      stubCurrentSubscription({ plan: "pro", quantity: 2, subscriptionType: "yearly" });
      openSubscriptionPage(workspaceId);
      verifyPlanTag(cloudSubscriptionText.planTags.pro);
      expect(access.customStyling).to.equal(true);
      expect(access.gitSync).to.equal(false);
      verifyFeatureAccess(access);
    });
  });

  it("should show the Team plan tag and Team feature access for a Team subscriber", () => {
    cy.apiSetCloudPlan("team", { workspaceId }).then((access) => {
      stubCurrentSubscription({ plan: "team", quantity: 3, subscriptionType: "monthly" });
      openSubscriptionPage(workspaceId);
      verifyPlanTag(cloudSubscriptionText.planTags.team);
      expect(access.gitSync).to.equal(true);
      verifyFeatureAccess(access);
    });
  });

  it("should fall back to the Business plan tag when the Stripe subscription can't be read", () => {
    cy.apiSetCloudPlan("pro", { workspaceId });
    openSubscriptionPage(workspaceId);
    verifyPlanTag(cloudSubscriptionText.planTags.business);
  });
});
