import { licenseSelectors } from "Selectors/platform/license";
import { cloudSubscriptionSelectors } from "Selectors/platform/cloudSubscription";
import { cloudSubscriptionText } from "Texts/platform/cloudSubscription";

const DAY_SECONDS = 24 * 60 * 60;

export const stripePlanPrices = {
  yearlyDiscountPercent: 20,
  plans: {
    basicplus: { monthly: { amount: 30, perMonth: 30 }, yearly: { amount: 288, perMonth: 24 } },
    pro: { monthly: { amount: 50, perMonth: 50 }, yearly: { amount: 480, perMonth: 40 } },
    team: { monthly: { amount: 80, perMonth: 80 }, yearly: { amount: 768, perMonth: 64 } },
  },
};

// These endpoints call Stripe, which local and CI deployments don't have.
export const stubCurrentSubscription = (subscription = null) => {
  const body = subscription
    ? {
        subscriptionId: `sub_cypress_${Date.now()}`,
        customerId: "cus_cypress",
        noOfEditors: subscription.quantity,
        noOfReaders: 50,
        status: "active",
        mode: "subscription",
        invoice: null,
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 20 * DAY_SECONDS,
        ...subscription,
      }
    : "";
  return cy.intercept("GET", "**/api/organization/payment/*/plan", { statusCode: 200, body }).as("currentPlan");
};

export const stubPlanPrices = (prices = stripePlanPrices) =>
  cy.intercept("GET", "**/api/organization/payment/plan-prices", { statusCode: 200, body: prices }).as("planPrices");

export const openSubscriptionPage = (workspaceId = Cypress.env("workspaceId")) => {
  cy.visit(cloudSubscriptionText.subscriptionPath(workspaceId));
  cy.get(cloudSubscriptionSelectors.subscriptionOverview, { timeout: 60000 }).should(
    "have.text",
    cloudSubscriptionText.subscriptionOverview
  );
};

export const verifyPlanTag = (tagText) => {
  cy.get(cloudSubscriptionSelectors.planTag, { timeout: 30000 }).should("have.text", tagText);
};

export const verifyLimit = (label, value) => {
  cy.get(licenseSelectors.numberOfTextLabel(label)).should("have.text", label);
  cy.get(licenseSelectors.inputField(label)).should("have.value", value);
};

export const verifyFeatureAccess = (access) => {
  const expected = Object.entries(cloudSubscriptionText.featureLabels).map(([key, label]) => [
    label,
    !!access[key],
  ]);
  expected.push([
    cloudSubscriptionText.dynamicAccessRules,
    ["appPermissionComponent", "appPermissionQuery", "appPermissionPages"].some((key) => access[key]),
  ]);
  expected.push([cloudSubscriptionText.devLifecyclePermissions, !!(access.promote || access.release)]);

  cy.get(cloudSubscriptionSelectors.featureAccessLabel).should("have.text", cloudSubscriptionText.featureAccess);
  expected.forEach(([label, enabled]) => {
    cy.get(cloudSubscriptionSelectors.accessContent)
      .find(licenseSelectors.label(label))
      .should("have.text", label)
      .prev(enabled ? licenseSelectors.circularToggleEnabledIcon : licenseSelectors.circularToggleDisabledIcon)
      .should("exist");
  });
};

export const verifyUpgradeFooter = () => {
  cy.get(cloudSubscriptionSelectors.comparePlansButton).scrollIntoView().should("be.visible").and("contain.text", cloudSubscriptionText.comparePlans);
  cy.get(cloudSubscriptionSelectors.upgradeButton).scrollIntoView().should("be.visible").and("contain.text", cloudSubscriptionText.upgrade);
  cy.get(cloudSubscriptionSelectors.manageSubscriptionButton).should("not.exist");
  cy.get(cloudSubscriptionSelectors.viewInvoicesButton).should("not.exist");
};

export const verifyPaidFooter = (totalText) => {
  cy.get(cloudSubscriptionSelectors.footerTotalAmount).scrollIntoView().should("have.text", totalText);
  cy.get(cloudSubscriptionSelectors.viewInvoicesButton).scrollIntoView().should("be.visible").and("contain.text", cloudSubscriptionText.viewInvoices);
  cy.get(cloudSubscriptionSelectors.manageSubscriptionButton)
    .scrollIntoView()
    .should("be.visible")
    .and("be.enabled")
    .and("contain.text", cloudSubscriptionText.manageSubscription);
  cy.get(cloudSubscriptionSelectors.upgradeButton).should("not.exist");
};
