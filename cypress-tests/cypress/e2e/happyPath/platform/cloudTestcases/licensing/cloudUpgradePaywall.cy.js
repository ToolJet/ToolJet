import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { licenseSelectors } from "Selectors/platform/license";
import { cloudLicenseSelectors } from "Selectors/platform/cloudLicense";
import { cloudLicenseText } from "Texts/platform/cloudLicense";
import {
  closeUpgradePlanModal,
  navBarLicenseButton,
  verifyLimitBanner,
  verifyUpgradePlanModal,
} from "Support/utils/license";

const serverRequest = (method, path, body) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${Cypress.env("server_host")}/api/${path}`,
      headers,
      body,
      failOnStatusCode: false,
      log: false,
    })
  );

const createApp = (name) =>
  serverRequest("POST", "apps", { type: "front-end", name, creation_mode: "DEFAULT" }).then(
    (response) => {
      expect(response.status).to.equal(201);
      return response.body;
    }
  );

const releaseApp = (appId) =>
  serverRequest("GET", `apps/${appId}`).then(({ body }) =>
    serverRequest("PUT", `apps/${appId}/release`, {
      versionToBeReleased: body.editing_version.id,
    }).its("status").should("equal", 200)
  );

const validatePublicAppLoggedOut = (slug) =>
  cy.request({
    url: `${Cypress.env("server_host")}/api/apps/validate-released-app-access/${slug}`,
    failOnStatusCode: false,
    log: false,
  });

describe("Cloud Licensing — Upgrade Paywall", { retries: 0 }, () => {
  const password = "password";
  let signup;
  let adminEmail;

  beforeEach(() => {
    adminEmail = `cloud-paywall-${Date.now()}@tooljet.test`;
    cy.apiCloudSignup({ email: adminEmail, password, name: fake.firstName }).then((result) => {
      signup = result;
    });
  });

  it("should send the admin to the subscription page from the Paid feature pill", () => {
    cy.apiSetCloudPlan("basic", { workspaceId: signup.workspaceId });
    cy.visit(`/${signup.workspaceSlug}/audit-logs`);

    cy.get(licenseSelectors.paidFeatureButton).first().should("be.visible").click();
    cy.location().should((location) => {
      expect(location.pathname).to.contain("/settings/subscription");
      expect(location.search).to.contain("currentTab=upgradePlan");
    });
  });

  it("should mark the current paid plan in the pricing table", () => {
    cy.apiSetCloudPlan("pro", { workspaceId: signup.workspaceId, expiryDays: 5 });
    cy.visit(`/${signup.workspaceSlug}`);

    navBarLicenseButton(cloudLicenseText.navBar.daysLeft(5)).should("be.visible").click();
    verifyUpgradePlanModal({ currentPlan: "pro" });
    cy.get(cloudLicenseSelectors.planActionButton("free")).should("not.exist");
    cy.get(cloudLicenseSelectors.planActionButton("basic")).should("not.exist");
    cy.get(cloudLicenseSelectors.planActionButton("team")).should(
      "have.text",
      cloudLicenseText.upgradeModal.upgrade
    );
    cy.get(cloudLicenseSelectors.planActionButton("enterprise")).should(
      "have.text",
      cloudLicenseText.upgradeModal.scheduleCall
    );
    closeUpgradePlanModal();
  });

  it("should show upgrade actions to the admin only and Contact admin wording to builders", () => {
    const builderEmail = `cloud-builder-${Date.now()}@tooljet.test`;
    const endUserEmail = `cloud-enduser-${Date.now()}@tooljet.test`;

    cy.waitForCloudPlan("trial", signup.workspaceId);
    serverRequest("GET", "license/apps/limits").then(({ body }) => {
      const { current, total } = body.appsCount;
      Cypress._.times(total - 1 - current, (index) => createApp(`cloud-role-app-${Date.now()}-${index}`));
    });

    cy.visit(`/${signup.workspaceSlug}`);
    verifyLimitBanner(cloudLicenseText.apps.nearing(9, 10), cloudLicenseText.apps.nearingInfoAdmin, "apps");
    cy.get(cloudLicenseSelectors.limitBanner("apps")).find(cloudLicenseSelectors.upgradeButton).should("be.visible");
    navBarLicenseButton(cloudLicenseText.navBar.daysLeft(14)).should("be.visible");

    cy.apiFullUserOnboarding(fake.firstName, builderEmail, "builder", password);
    cy.apiLogin(adminEmail, password, signup.workspaceId);
    cy.apiFullUserOnboarding(fake.firstName, endUserEmail, "end-user", password);

    cy.apiLogin(builderEmail, password, signup.workspaceId);
    cy.visit(`/${signup.workspaceSlug}`);
    verifyLimitBanner(cloudLicenseText.apps.nearing(9, 10), cloudLicenseText.apps.nearingInfoBuilder, "apps");
    cy.get(cloudLicenseSelectors.limitBanner("apps")).find(cloudLicenseSelectors.upgradeButton).should("not.exist");
    cy.get(cloudLicenseSelectors.navBarActions).should("not.contain.text", "days left");

    cy.apiLogin(endUserEmail, password, signup.workspaceId);
    cy.visit(`/${signup.workspaceSlug}`);
    cy.get(commonSelectors.pageSectionHeader).should("be.visible");
    cy.get(cloudLicenseSelectors.limitBanner("apps")).should("not.exist");
    cy.get(cloudLicenseSelectors.upgradeButton).should("not.exist");
    cy.get(cloudLicenseSelectors.navBarActions).should("not.contain.text", "days left");
  });

  it("should restrict a public app on a plan without public apps", () => {
    cy.waitForCloudPlan("trial", signup.workspaceId);
    createApp(`cloud-public-app-${Date.now()}`).then((app) => {
      releaseApp(app.id);
      cy.apiMakeAppPublic(app.id);
      serverRequest("GET", `apps/${app.id}`).its("body.slug").then((slug) => {
        cy.clearCookies();
        validatePublicAppLoggedOut(slug).then((response) => {
          expect(response.status).to.equal(403);
          expect(response.body.message).to.equal(cloudLicenseText.publicAppRestricted.code);
        });

        cy.visit(`/applications/${slug}`);
        cy.location("pathname").should("equal", `/error/${cloudLicenseText.publicAppRestricted.code}`);
        cy.get(commonSelectors.modalHeader).should("have.text", cloudLicenseText.publicAppRestricted.title);
        cy.get(commonSelectors.modalDescription).should(
          "have.text",
          cloudLicenseText.publicAppRestricted.message
        );

        cy.apiLogin(adminEmail, password, signup.workspaceId);
        cy.task("cloudPlanTerms", "team", { log: false }).then((teamTerms) => {
          cy.apiSetCloudPlan("team", {
            workspaceId: signup.workspaceId,
            terms: {
              app: { ...teamTerms.app, features: { ...teamTerms.app.features, publicApp: true } },
            },
          });
        });
        cy.clearCookies();
        validatePublicAppLoggedOut(slug).its("status").should("equal", 200);
      });
    });
  });
});
