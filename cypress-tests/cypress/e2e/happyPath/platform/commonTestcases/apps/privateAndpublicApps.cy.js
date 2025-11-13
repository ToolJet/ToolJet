import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { logout, releaseApp } from "Support/utils/common";
import {
  inviteUserToWorkspace,
  fetchAndVisitInviteLinkViaMH,
} from "Support/utils/manageUsers";
import { setSignupStatus } from "Support/utils/manageSSO";
import { onboardingSelectors } from "Selectors/onboarding";
import { commonText } from "Texts/common";
import { userSignUp } from "Support/utils/onboarding";
import {
  setupAppWithSlug,
  verifyRestrictedAccess,
} from "Support/utils/apps";
import { InstanceSSO } from "Support/utils/platform/eeCommon";
import { smtpConfig } from "Constants/constants/whitelabel";


describe(
  "Private and Public apps",
  {
    retries: { runMode: 2 },
  },
  () => {
    const generateTestData = () => ({
      appName: `${fake.companyName} P P App`,
      slug: `${fake.companyName} P P App`.toLowerCase().replace(/\s+/g, "-"),
      firstName: fake.firstName,
      email: fake.email.toLowerCase(),
      workspaceName: fake.firstName,
      workspaceSlug: fake.firstName.toLowerCase().replace(/\s+/g, "-"),
      appPublicSlug: `${fake.companyName} Public App`
        .toLowerCase()
        .replace(/\s+/g, "-"),
      appPublicName: `${fake.companyName} Public App`,
      appPrivateSlug: `${fake.companyName} Private App`
        .toLowerCase()
        .replace(/\s+/g, "-"),
      appPrivateName: `${fake.companyName} Private App`,
    });

    const verifyWidget = (widgetName) => {
      cy.get(commonWidgetSelector.draggableWidget(widgetName), { timeout: 20000 }).should(
        "be.visible"
      );
    };

    const getAppUrl = (slug) =>
      `${Cypress.config("baseUrl")}/applications/${slug}`;

    let data;

    beforeEach(() => {
      data = generateTestData();
      cy.defaultWorkspaceLogin();
      cy.apiDeleteAllApps();
      cy.skipWalkthrough();
      cy.apiConfigureSmtp(smtpConfig)
    });

    it("should verify private and public app share functionality", () => {
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.dragAndDropWidget("text", 450, 300);

      cy.get(commonWidgetSelector.shareAppButton).should("be.visible").click();
      cy.contains("This version has not been released yet").should(
        "be.visible"
      );
      cy.get(commonWidgetSelector.modalCloseButton).click();

      releaseApp();
      cy.get(commonWidgetSelector.shareAppButton).click();
      for (const elements in commonWidgetSelector.shareModalElements) {
        cy.get(
          commonWidgetSelector.shareModalElements[elements]
        ).verifyVisibleElement(
          "have.text",
          commonText.shareModalElements[elements]
        );
      }

      const shareModalSelectors = [
        "copyAppLinkButton",
        "makePublicAppToggle",
        "appLink",
        "appNameSlugInput",
        "modalCloseButton",
      ];
      shareModalSelectors.forEach((selector) => {
        cy.get(commonWidgetSelector[selector]).should("be.visible");
      });

      cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
      cy.get(commonSelectors.appSlugAccept)
        .should("be.visible")
        .and("have.text", "Slug accepted!");

      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.forceClickOnCanvas();
      cy.backToApps();

      logout();

      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });

      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );
      cy.appUILogin();
      verifyWidget("text1");

      cy.openApp(
        "appSlug",
        Cypress.env("workspaceId"),
        Cypress.env("appId"),
        commonWidgetSelector.draggableWidget("text1")
      );
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).check();
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      logout();
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("text1");
    });

    it("should verify app private and public app visibility for the same workspace user", () => {
      setupAppWithSlug(data.appName, data.slug);

      inviteUserToWorkspace(data.firstName, data.email);
      cy.apiLogout();

      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      cy.wait(2000);
      cy.appUILogin(data.email, "password");
      verifyWidget("private");

      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("private");

      cy.defaultWorkspaceLogin();
      cy.apiMakeAppPublic();
      cy.apiLogout();

      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("private");

      cy.apiLogin(data.email, "password");
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("private");
    });

    it("should verify app private and public app visibility for the same instance user", () => {
      setupAppWithSlug(data.appName, data.slug);

      cy.apiLogout();
      cy.ifEnv("Enterprise", () => {
        InstanceSSO(true, true, true);
      });
      userSignUp(data.firstName, data.email, data.workspaceName);
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });

      cy.apiLogout()

      cy.defaultWorkspaceLogin();
      cy.apiMakeAppPublic();
      cy.apiLogout();


      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("private");

      cy.apiLogin(data.email, "password");
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("private");
    });

    it("should redirect to workspace login and handle signup flow of existing and non-existing user", () => {
      cy.intercept("POST", "/api/onboarding/signup").as("signup");
      cy.intercept("GET", "**/api/white-labelling").as("whiteLabelling");

      cy.apiUserInvite(`${data.firstName}_invited`, `invited_${data.email}`);

      setSignupStatus(true);
      setupAppWithSlug(data.appPublicName, data.appPublicSlug, "public");
      const publicAppId = Cypress.env("appId");
      cy.apiMakeAppPublic(publicAppId);
      setupAppWithSlug(data.appPrivateName, data.appPrivateSlug);
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });

      cy.visitSlug({ actualUrl: getAppUrl(data.appPublicSlug) });
      verifyWidget("public");

      cy.visitSlug({ actualUrl: getAppUrl(data.appPrivateSlug) });
      verifyWidget("private");

      cy.apiLogout();

      cy.visitSlug({ actualUrl: getAppUrl(data.appPublicSlug) });
      verifyWidget("public");

      cy.visitSlug({ actualUrl: getAppUrl(data.appPrivateSlug) });
      cy.wait("@whiteLabelling");

      cy.get(commonSelectors.createAnAccountLink, { timeout: 20000 }).click();

      cy.get(onboardingSelectors.loginPasswordInput)
        .should("be.visible")
        .click({ force: true });
      cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
      cy.clearAndType('[data-cy="email-input"]', data.email);
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(commonSelectors.signUpButton).click();
      cy.wait("@signup");
      cy.get(`[data-cy="resend-verification-email-button"]`).should(
        "be.visible"
      );
      cy.wait(15000); // Waiting for mailhog to receive the email
      fetchAndVisitInviteLinkViaMH(data.email);
      verifyWidget("private");

      // cy.apiLogout();

      // cy.visitSlug({ actualUrl: getAppUrl(data.appPrivateSlug) })
      // cy.get(onboardingSelectors.loginPasswordInput).should("be.visible").click({ force: true });
      // cy.clearAndType('[data-cy="email-input"]', `invited_${data.email}`);
      // cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    });

    it("should verify restricted app access", () => {
      data.workspaceName = fake.firstName;
      data.workspaceSlug = fake.firstName.toLowerCase().replace(/\s+/g, "-");

      cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
      cy.apiLogout();
      cy.apiLogin();
      cy.visit(`${data.workspaceSlug}`);

      cy.apiDeleteGranularPermission("end-user", ["app", "workflow"]);

      setSignupStatus(true, data.workspaceName);

      setupAppWithSlug(data.appName, data.slug);

      inviteUserToWorkspace(data.firstName, data.email);
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyRestrictedAccess();
      cy.get(commonSelectors.backToHomeButton).click();
      cy.get(commonSelectors.homePageLogo).should("be.visible");

      cy.apiLogout();
    });
  }
);
