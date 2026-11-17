import { fake } from "Fixtures/fake";
import { whiteLabelSelectors } from "Selectors/common";
import { cloudSettingsSelectors } from "Selectors/platform/cloudSettings";
import { cloudSettingsText } from "Texts/platform/cloudSettings";
import { whitelabelTestData } from "Constants/constants/whitelabel";
import {
  openWhiteLabelingSettings,
  fillWhiteLabelingForm,
  saveWhiteLabelingChanges,
  verifyWhiteLabelInputs,
  verifyCustomLogo,
  verifyPageTitleAndFavicon,
} from "Support/utils/whitelabel";

describe("Cloud White Labelling — Workspace Settings", { retries: 0 }, () => {
  const pageTitle = `Cloud WL ${Date.now()}`;
  const loginBanner = whitelabelTestData.logo;
  const whiteLabelConfig = {
    white_label_logo: whitelabelTestData.logo,
    white_label_text: pageTitle,
    white_label_favicon: whitelabelTestData.favicon,
    white_label_banner: loginBanner,
  };

  let workspaceId;

  const signupWithPlan = (plan) => {
    const email = `cloud-wl-${Date.now()}@tooljet.test`;
    cy.apiCloudSignup({ email, name: fake.firstName }).then((signup) => {
      workspaceId = signup.workspaceId;
      if (plan !== "trial") cy.apiSetCloudPlan(plan, { workspaceId });
    });
  };

  // The server HTML-encodes "&" in stored URLs
  const decoded = (settings) =>
    Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [
        key,
        typeof value === "string" ? value.replace(/&amp;/g, "&") : value,
      ])
    );

  const getWhiteLabelling = (organizationId) =>
    cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/white-labelling/${organizationId}`,
      })
      .then(({ body }) => decoded(body));

  context("on the Team plan", () => {
    beforeEach(() => signupWithPlan("team"));

    it("should show only the cloud settings pages to a workspace admin", () => {
      cy.visit(`/${workspaceId}/settings`);

      cy.url().should("include", `/${workspaceId}/settings/white-labelling`);
      cy.get(cloudSettingsSelectors.settingsNavItems).should(
        "have.length",
        cloudSettingsText.adminNavItems.length
      );
      cloudSettingsText.adminNavItems.forEach((item) => {
        cy.get(cloudSettingsSelectors.settingsNavItem(item)).verifyVisibleElement(
          "contain.text",
          item
        );
      });
    });

    it("should save workspace white labelling from the settings page", () => {
      openWhiteLabelingSettings(workspaceId);
      cy.get(cloudSettingsSelectors.cardTitle).verifyVisibleElement(
        "have.text",
        cloudSettingsText.whiteLabellingTitle
      );
      cy.get(cloudSettingsSelectors.paidFeatureButton).should("not.exist");

      fillWhiteLabelingForm(
        whitelabelTestData.logo,
        pageTitle,
        whitelabelTestData.favicon,
        loginBanner
      );
      saveWhiteLabelingChanges();

      verifyWhiteLabelInputs(
        whitelabelTestData.logo,
        pageTitle,
        whitelabelTestData.favicon,
        loginBanner
      );
      getWhiteLabelling(workspaceId).should("deep.include", whiteLabelConfig);

      cy.reload();
      verifyWhiteLabelInputs(
        whitelabelTestData.logo,
        pageTitle,
        whitelabelTestData.favicon,
        loginBanner
      );
    });

    it("should apply workspace white labelling on its login page", () => {
      cy.apiUpdateWhiteLabeling(whiteLabelConfig, workspaceId);
      cy.apiLogout();

      cy.visit(`/login/${workspaceId}`);
      verifyCustomLogo(whiteLabelSelectors.tooljetHeaderImg);
      verifyPageTitleAndFavicon(pageTitle);
      cy.get(cloudSettingsSelectors.loginBannerImage)
        .should("be.visible")
        .and("have.attr", "src", loginBanner);
    });

    it("should keep white labelling separate for each workspace", () => {
      const otherWorkspace = `cloud-wl-b-${Date.now()}`;

      cy.apiCreateWorkspace(otherWorkspace, otherWorkspace).then(({ body }) => {
        const otherWorkspaceId = body.organization_id || body.id;
        cy.apiUpdateWhiteLabeling(whiteLabelConfig, workspaceId);

        getWhiteLabelling(workspaceId).should("deep.include", whiteLabelConfig);
        getWhiteLabelling(otherWorkspaceId).then((settings) => {
          expect(settings.white_label_text).to.not.equal(pageTitle);
          expect(String(settings.white_label_logo)).to.not.include(
            whitelabelTestData.logoIdentifier
          );
          expect(settings.white_label_banner || "").to.not.equal(loginBanner);
        });
      });
    });

    it("should block a builder from the white labelling page and API", () => {
      const builderEmail = `cloud-wl-builder-${Date.now()}@tooljet.test`;
      cy.apiFullUserOnboarding(fake.firstName, builderEmail, "builder");
      cy.apiLogin(builderEmail, "password", workspaceId);

      cy.visit(`/${workspaceId}/settings/white-labelling`);
      cy.url().should("not.include", "/settings");
      cy.get(whiteLabelSelectors.appLogoInput).should("not.exist");

      cy.getAuthHeaders().then((headers) => {
        cy.request({
          method: "PUT",
          url: `${Cypress.env("server_host")}/api/white-labelling/${workspaceId}`,
          headers,
          body: whiteLabelConfig,
          failOnStatusCode: false,
        })
          .its("status")
          .should("equal", 403);
      });
      getWhiteLabelling(workspaceId).then((settings) => {
        expect(settings.white_label_text).to.not.equal(pageTitle);
      });
    });
  });

  ["basic", "trial"].forEach((plan) => {
    context(`on the ${plan} plan`, () => {
      beforeEach(() => signupWithPlan(plan));

      it(`should show the paid feature pill and lock the form on ${plan}`, () => {
        openWhiteLabelingSettings(workspaceId);

        cy.get(cloudSettingsSelectors.paidFeatureButton).verifyVisibleElement(
          "have.text",
          cloudSettingsText.paidFeature
        );
        [
          whiteLabelSelectors.appLogoInput,
          whiteLabelSelectors.pageTitleInput,
          whiteLabelSelectors.favIconInput,
          whiteLabelSelectors.loginBannerInput,
        ].forEach((input) => cy.get(input).should("be.disabled"));
        cy.get(whiteLabelSelectors.saveButton).should("be.disabled");
      });
    });
  });
});
