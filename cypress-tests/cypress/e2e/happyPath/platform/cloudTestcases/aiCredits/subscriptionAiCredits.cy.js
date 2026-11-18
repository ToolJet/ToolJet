import { fake } from "Fixtures/fake";
import { cloudAiSelectors } from "Selectors/platform/cloudAi";
import { cloudAiText } from "Texts/platform/cloudAi";
import { createFreshCloudWorkspace, loginToWorkspace } from "Support/utils/platform/ai";
import { stubCurrentSubscription, stubPlanPrices } from "Support/utils/platform/cloudSubscription";

const formatCredits = (value) => Number(value).toLocaleString("en-US");

const formatDate = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
};

const visitSubscription = (workspaceId, query = "") => {
  stubCurrentSubscription();
  stubPlanPrices();
  cy.visit(`/${workspaceId}/settings/subscription${query}`);
  cy.get('[data-cy="subscription-overview"]', { timeout: 60000 }).should("be.visible");
};

const getAiCreditsBalance = (workspaceId) =>
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/organization/payment/${workspaceId}/ai-credits-balance`,
        headers: { ...headers, "Tj-Workspace-Id": workspaceId },
      })
      .its("body")
  );

const walletOf = (wallets, type) => wallets.find((wallet) => wallet.walletType === type);

const verifyCreditsRow = (index, { label, subText, value }) => {
  cy.get(cloudAiSelectors.creditsRow, { timeout: 60000 })
    .eq(index)
    .within(() => {
      cy.contains(label).should("be.visible");
      if (subText) cy.contains(subText).should("be.visible");
      cy.get(cloudAiSelectors.creditsRowValue).should("have.value", value);
    });
};

const signupAdmin = (prefix) => {
  const admin = { email: `${prefix}-${Date.now()}@tooljet.test` };
  cy.apiCloudSignup({ email: admin.email, name: fake.firstName }).then((signup) => {
    admin.workspaceId = signup.workspaceId;
  });
  return admin;
};

describe("Cloud AI Credits — Subscription Page", { retries: 0 }, () => {
  let admin;
  let workspaceId;

  before(() => {
    admin = signupAdmin("cloud-ai-sub");
  });

  beforeEach(() => {
    createFreshCloudWorkspace(admin.email, admin.workspaceId).then((id) => {
      workspaceId = id;
    });
  });

  it("should show Monthly Recurring and Add on credits from the workspace wallets", () => {
    cy.apiSetCloudPlan("pro", { workspaceId });
    cy.apiSetAiCreditWallets({ workspaceId, recurring: 1500, topup: 2500, renewalDays: 20 });

    getAiCreditsBalance(workspaceId).then((wallets) => {
      const recurring = walletOf(wallets, "recurring");
      const topup = walletOf(wallets, "topup");
      visitSubscription(workspaceId);

      cy.get(cloudAiSelectors.creditsBlock, { timeout: 60000 }).should("be.visible");
      verifyCreditsRow(0, {
        label: cloudAiText.monthlyRecurring,
        subText: cloudAiText.renewsOn(formatDate(recurring.expiryDate)),
        value: `${formatCredits(1500)} / ${formatCredits(1500)}`,
      });
      verifyCreditsRow(1, {
        label: cloudAiText.addOnCredits,
        subText: `Valid till ${formatDate(topup.expiryDate)}`,
        value: `${formatCredits(2500)} / ${formatCredits(2500)}`,
      });
      cy.get(cloudAiSelectors.topUpButton).should("be.visible").and("contain.text", cloudAiText.getAiCredits);
    });
  });

  it("should mark Add on credits unavailable when the plan has expired", () => {
    cy.apiSetCloudPlan("pro", { workspaceId, expiryDays: -2, wait: false });
    cy.apiSetAiCreditWallets({ workspaceId, recurring: 500, topup: 0 });
    visitSubscription(workspaceId);

    cy.get(cloudAiSelectors.creditsBlock, { timeout: 60000 }).should("be.visible");
    verifyCreditsRow(1, {
      label: cloudAiText.addOnCredits,
      subText: cloudAiText.unavailableInPlan,
      value: "0 / 0",
    });
  });

  it("should hide the credits block when the workspace AI plan is byok with its own LLM key", () => {
    cy.apiSetCloudPlan("pro", { workspaceId, terms: { ai: { plan: "byok" } } });
    cy.apiUpdateLLMKey(`sk-ant-${Date.now()}`, "byok", false, { workspaceId, provider: "anthropic" });
    visitSubscription(workspaceId);

    cy.get('[data-cy="subscription-limits-label"]').should("be.visible");
    cy.get(cloudAiSelectors.creditsBlock).should("not.exist");
  });

  it("should open the Add AI credits modal from ?action=add-ai-credits", () => {
    cy.apiSetCloudPlan("pro", { workspaceId });
    cy.apiSetAiCreditWallets({ workspaceId, recurring: 1200, topup: 300 });
    visitSubscription(workspaceId, `?action=${cloudAiText.addAiCreditsAction}`);

    cy.get(cloudAiSelectors.addCreditsModal, { timeout: 60000 })
      .should("be.visible")
      .within(() => {
        cy.get(cloudAiSelectors.addCreditsModalTitle).should("contain.text", cloudAiText.addCreditsModalTitle);
        cloudAiText.addCreditsModalRows.forEach((label, index) => {
          cy.get(cloudAiSelectors.addCreditsModalRow).eq(index).should("contain.text", label);
        });
        cy.get(cloudAiSelectors.addCreditsModalRow)
          .eq(0)
          .find(cloudAiSelectors.addCreditsModalInput)
          .should("have.value", "1,200 / 1,200");
        cy.get(cloudAiSelectors.addCreditsModalRow)
          .eq(1)
          .find(cloudAiSelectors.addCreditsModalInput)
          .should("have.value", "300 / 300");
        cy.get(cloudAiSelectors.addCreditsModalRow)
          .eq(2)
          .find(cloudAiSelectors.addCreditsModalInput)
          .should("have.value", cloudAiText.defaultTopUpCredits);
        cy.get(cloudAiSelectors.addCreditsAmountDue).should("contain.text", cloudAiText.defaultAmountDue);
        cy.get(cloudAiSelectors.addCreditsCheckoutButton).should("be.enabled");

        cy.get(cloudAiSelectors.addCreditsModalRow)
          .eq(2)
          .find(cloudAiSelectors.addCreditsModalInput)
          .clear()
          .type("3500");
        cy.get(cloudAiSelectors.addCreditsAmountDue).should("contain.text", "Amount due: $35");
        cy.get(cloudAiSelectors.addCreditsCheckoutButton).should("be.enabled");
      });
    cy.location("search").should("not.contain", "action=");
  });
});

describe("Cloud AI Credits — Subscription Page across plans and workspaces", { retries: 0 }, () => {
  let admin;

  before(() => {
    admin = signupAdmin("cloud-ai-iso");
  });

  it("should show each workspace only its own AI credit balance", () => {
    let workspaceId;
    createFreshCloudWorkspace(admin.email, admin.workspaceId).then((id) => {
      workspaceId = id;
      cy.apiSetCloudPlan("pro", { workspaceId });
      cy.apiSetAiCreditWallets({ workspaceId, recurring: 1000, topup: 2000 });
    });

    createFreshCloudWorkspace(admin.email, admin.workspaceId).then((secondId) => {
      cy.apiSetCloudPlan("pro", { workspaceId: secondId });
      cy.apiSetAiCreditWallets({ workspaceId: secondId, recurring: 3000, topup: 4000 });

      loginToWorkspace(admin.email, workspaceId);
      getAiCreditsBalance(workspaceId).then((wallets) => {
        expect(walletOf(wallets, "recurring").balance).to.equal(1000);
        expect(walletOf(wallets, "topup").balance).to.equal(2000);
      });
      visitSubscription(workspaceId);
      verifyCreditsRow(0, { label: cloudAiText.monthlyRecurring, value: "1,000 / 1,000" });
      verifyCreditsRow(1, { label: cloudAiText.addOnCredits, value: "2,000 / 2,000" });

      loginToWorkspace(admin.email, secondId);
      getAiCreditsBalance(secondId).then((wallets) => {
        expect(walletOf(wallets, "recurring").balance).to.equal(3000);
        expect(walletOf(wallets, "topup").balance).to.equal(4000);
      });
      visitSubscription(secondId);
      verifyCreditsRow(0, { label: cloudAiText.monthlyRecurring, value: "3,000 / 3,000" });
      verifyCreditsRow(1, { label: cloudAiText.addOnCredits, value: "4,000 / 4,000" });
    });
  });

  it("should keep Get AI credits behind an upgrade on Trial and Basic", () => {
    const workspaceId = admin.workspaceId;
    cy.apiLogin(admin.email, "password", workspaceId);
    const verifyUpgradeGate = () => {
      visitSubscription(workspaceId);
      cy.get(cloudAiSelectors.topUpButton, { timeout: 60000 }).should("be.visible").parent().trigger("mouseover");
      cy.get(cloudAiSelectors.tooltip)
        .should("be.visible")
        .and("contain.text", cloudAiText.getAiCreditsUpgradeTooltip);
      cy.get(cloudAiSelectors.topUpButton).click();
      cy.get(cloudAiSelectors.upgradePlanModal).should("be.visible");
      cy.get(cloudAiSelectors.addCreditsModal).should("not.exist");
    };

    cy.waitForCloudPlan("trial", workspaceId);
    verifyUpgradeGate();

    cy.apiSetCloudPlan("basic", { workspaceId });
    verifyUpgradeGate();
  });
});
