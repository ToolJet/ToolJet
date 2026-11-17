import { fake } from "Fixtures/fake";
import { licenseSelectors } from "Selectors/platform/license";
import { cloudLicenseSelectors } from "Selectors/platform/cloudLicense";
import { cloudLicenseText } from "Texts/platform/cloudLicense";
import {
  closeUpgradePlanModal,
  navBarLicenseButton,
  verifyUpgradePlanModal,
} from "Support/utils/license";

const DAY_MS = 24 * 60 * 60 * 1000;

// Fraction of a day that keeps the expiry later today (UTC), so the trial is not yet expired.
const daysUntilEndOfUtcDay = () => {
  const now = new Date();
  const endOfDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 55);
  return (endOfDay - now.getTime()) / DAY_MS;
};

const licenseRequest = (method, path, workspaceId, body) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${Cypress.env("server_host")}/api/license/organization/${workspaceId}/${path}`,
      headers: { ...headers, "Tj-Workspace-Id": workspaceId },
      body,
      failOnStatusCode: false,
      log: false,
    })
  );

const canStartTrial = (workspaceId) =>
  licenseRequest("GET", "can-start-trial", workspaceId).then((response) => {
    expect(response.status).to.equal(200);
    return response.body.canStartTrial;
  });

describe("Cloud Licensing — Trial Banners", { retries: 0 }, () => {
  let signup;
  let trialTerms;

  beforeEach(() => {
    const email = `cloud-trial-${Date.now()}@tooljet.test`;
    cy.apiCloudSignup({ email, name: fake.firstName }).then((result) => {
      signup = { ...result, email };
      cy.apiGetCloudLicenseRow(result.workspaceId).then((row) => {
        trialTerms = row.terms;
      });
    });
    cy.window({ log: false }).then((win) => win.localStorage.setItem("walkthroughCompleted", "true"));
  });

  // Workspace on the free plan whose owner has not used a trial yet.
  const resetToUnclaimedBasic = () => {
    cy.apiSetCloudPlan("basic", { workspaceId: signup.workspaceId });
    cy.runSqlQueryOnDB(`UPDATE users SET trial_claimed_at = NULL WHERE id = '${signup.userId}';`);
  };

  it("should show 14 days left for a new trial and open the pricing table with no current plan", () => {
    cy.waitForCloudPlan("trial", signup.workspaceId);
    cy.visit(`/${signup.workspaceSlug}`);

    navBarLicenseButton(cloudLicenseText.navBar.daysLeft(14)).should("be.visible").click();
    verifyUpgradePlanModal({ currentPlan: null });
    closeUpgradePlanModal();
  });

  it("should count the trial days down from the expiry date", () => {
    cy.apiSetCloudPlan("trial", { workspaceId: signup.workspaceId, terms: trialTerms, expiryDays: 5 });
    cy.visit(`/${signup.workspaceSlug}`);

    navBarLicenseButton(cloudLicenseText.navBar.daysLeft(5)).should("be.visible");
  });

  it("should show trial ends today on the last trial day", () => {
    cy.apiSetCloudPlan("trial", {
      workspaceId: signup.workspaceId,
      terms: trialTerms,
      expiryDays: daysUntilEndOfUtcDay(),
    });
    cy.visit(`/${signup.workspaceSlug}`);

    navBarLicenseButton(cloudLicenseText.navBar.trialEndsToday).should("be.visible");
  });

  it("should show Upgrade and mark Free as current once the trial has ended", () => {
    cy.apiSetCloudPlan("trial", {
      workspaceId: signup.workspaceId,
      terms: trialTerms,
      expiryDays: -2,
      wait: false,
    });
    cy.waitForCloudPlan("basic", signup.workspaceId).then((access) => {
      expect(access.licenseStatus).to.include({ isExpired: true, termsType: "trial" });
    });
    cy.visit(`/${signup.workspaceSlug}`);

    cy.get(cloudLicenseSelectors.navBarActions)
      .should("not.contain.text", "days left")
      .and("not.contain.text", cloudLicenseText.navBar.startTrial);
    navBarLicenseButton(cloudLicenseText.navBar.upgrade).should("be.visible").click();
    verifyUpgradePlanModal({ currentPlan: "free" });
    closeUpgradePlanModal();

    cy.visit(`/${signup.workspaceSlug}/workspace-settings/groups`);
    cy.get(licenseSelectors.limitHeading("custom-groups"))
      .should("be.visible")
      .and("have.text", cloudLicenseText.customGroupsBanner.heading);
  });

  it("should let a free-plan admin start a 14-day trial from the custom groups banner", () => {
    resetToUnclaimedBasic();
    canStartTrial(signup.workspaceId).should("equal", true);

    cy.intercept("POST", "/api/license/organization/*/trial", (req) => {
      req.on("response", (res) => res.setDelay(1500));
    }).as("startTrial");
    cy.visit(`/${signup.workspaceSlug}/workspace-settings/groups`);

    navBarLicenseButton(cloudLicenseText.navBar.startTrial).should("be.visible");
    navBarLicenseButton(cloudLicenseText.navBar.consultation).should("be.visible");
    cy.get(licenseSelectors.limitHeading("custom-groups")).should(
      "have.text",
      cloudLicenseText.customGroupsBanner.heading
    );
    cy.get(licenseSelectors.limitInfo("custom-groups")).should(
      "contain.text",
      cloudLicenseText.customGroupsBanner.adminInfo
    );
    cy.get(cloudLicenseSelectors.customGroupBannerButton)
      .should("contain.text", cloudLicenseText.customGroupsBanner.startFreeTrial)
      .click();

    cy.get(cloudLicenseSelectors.trialLoader).should("contain.text", cloudLicenseText.generatingTrial);
    cy.wait("@startTrial").its("response.statusCode").should("be.oneOf", [200, 201]);

    navBarLicenseButton(cloudLicenseText.navBar.daysLeft(14)).should("be.visible");
    cy.apiGetCloudLicenseRow(signup.workspaceId).then((row) => {
      expect(row.license_type).to.equal("trial");
    });
    canStartTrial(signup.workspaceId).should("equal", false);
  });

  it("should allow only one trial per account", () => {
    canStartTrial(signup.workspaceId).should("equal", false);

    cy.apiSetCloudPlan("basic", { workspaceId: signup.workspaceId });
    canStartTrial(signup.workspaceId).should("equal", false);
    cy.visit(`/${signup.workspaceSlug}`);
    navBarLicenseButton(cloudLicenseText.navBar.upgrade).should("be.visible");
    cy.get(cloudLicenseSelectors.navBarActions).should(
      "not.contain.text",
      cloudLicenseText.navBar.startTrial
    );

    cy.runSqlQueryOnDB(`UPDATE users SET trial_claimed_at = NULL WHERE id = '${signup.userId}';`);
    canStartTrial(signup.workspaceId).should("equal", true);

    const secondWorkspace = `cloud-trial-ws-${Date.now()}`;
    cy.apiCreateWorkspace(secondWorkspace, secondWorkspace).then(({ body }) => {
      const secondId = body.organization_id || body.id;
      canStartTrial(secondId).should("equal", false);
      licenseRequest("POST", "trial", secondId, {
        email: signup.email,
        customerId: signup.userId,
        organizationId: secondId,
      }).then((response) => {
        expect(response.status).to.equal(403);
        expect(response.body.message).to.equal(cloudLicenseText.trialLimitedError);
      });
    });
  });
});
