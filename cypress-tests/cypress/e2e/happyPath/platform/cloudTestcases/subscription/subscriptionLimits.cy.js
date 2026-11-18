import { fake } from "Fixtures/fake";
import { licenseSelectors } from "Selectors/platform/license";
import { cloudSubscriptionSelectors } from "Selectors/platform/cloudSubscription";
import { cloudSubscriptionText } from "Texts/platform/cloudSubscription";
import { openSubscriptionPage, stubCurrentSubscription, verifyLimit } from "Support/utils/platform/cloudSubscription";

describe("Cloud Subscription — Subscription Limits", { retries: 0 }, () => {
  const { limitLabels } = cloudSubscriptionText;
  let workspaceId;
  let email;

  beforeEach(() => {
    email = `cloud-sub-lim-${Date.now()}@tooljet.test`;
    cy.apiCloudSignup({ email, name: fake.firstName }).then((signup) => {
      workspaceId = signup.workspaceId;
    });
  });

  it("should show the trial limits with the workspace's current usage", () => {
    cy.apiCreateApp(`cloud-sub-app-${Date.now()}`);
    stubCurrentSubscription();
    openSubscriptionPage(workspaceId);

    cy.get(cloudSubscriptionSelectors.subscriptionLimitsLabel).should("have.text", cloudSubscriptionText.subscriptionLimits);
    verifyLimit(limitLabels.totalUsers, "1/52");
    verifyLimit(limitLabels.builders, "1/2");
    verifyLimit(limitLabels.endUsers, "0/50");
    verifyLimit(limitLabels.apps, "1/10");
    verifyLimit(limitLabels.tables, "0/10");
    verifyLimit(limitLabels.rows, "0/500");
    cy.get(cloudSubscriptionSelectors.exceedingLimitError).should("not.exist");
  });

  it("should flag a limit the workspace is already over with Exceeding Limit", () => {
    cy.apiFullUserOnboarding(fake.firstName, `builder-${email}`, "builder", "password");
    // Onboarding the invitee swaps the session cookie; log the admin back in.
    cy.apiLogin(email, "password", workspaceId);
    cy.apiSetCloudPlan("pro", {
      workspaceId,
      terms: { users: { total: 52, editor: 1, viewer: 50, superadmin: 1 } },
    });
    stubCurrentSubscription({ plan: "pro", quantity: 1, subscriptionType: "yearly" });
    openSubscriptionPage(workspaceId);

    verifyLimit(limitLabels.builders, "2/1");
    cy.get(licenseSelectors.inputField(limitLabels.builders))
      .should("have.class", cloudSubscriptionSelectors.limitErrorBorderClass)
      .next(cloudSubscriptionSelectors.exceedingLimitError)
      .should("have.text", cloudSubscriptionText.exceedingLimit);
    cy.get(cloudSubscriptionSelectors.exceedingLimitError).should("have.length", 1);
    verifyLimit(limitLabels.endUsers, "0/50");
  });

  it("should show Unlimited for the uncapped Team plan limits", () => {
    cy.apiSetCloudPlan("team", { workspaceId });
    stubCurrentSubscription({ plan: "team", quantity: 3, subscriptionType: "yearly" });
    openSubscriptionPage(workspaceId);

    [limitLabels.totalUsers, limitLabels.builders, limitLabels.endUsers, limitLabels.apps, limitLabels.tables].forEach(
      (label) => verifyLimit(label, cloudSubscriptionText.unlimited)
    );
  });
});
