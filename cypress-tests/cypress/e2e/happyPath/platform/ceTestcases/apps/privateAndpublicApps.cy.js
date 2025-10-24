import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { logout, releaseApp } from "Support/utils/common";
import { inviteUserToWorkspace } from "Support/utils/manageUsers";
import { setSignupStatus } from "Support/utils/manageSSO";
import { onboardingSelectors } from "Selectors/onboarding";
import { commonText } from "Texts/common";
import { userSignUp } from "Support/utils/onboarding";
import {
  setUpSlug,
  setupAppWithSlug,
  verifyRestrictedAccess,
  onboardUserFromAppLink,
} from "Support/utils/apps";
import { appPromote } from "Support/utils/platform/multiEnv";
import { InstanceSSO } from "Support/utils/platform/eeCommon";

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
    });

    const verifyWidget = (widgetName) => {
      cy.get(commonWidgetSelector.draggableWidget(widgetName)).should("be.visible");
    };

    const getAppUrl = (slug) => `${Cypress.config("baseUrl")}/applications/${slug}`;

    let data;

    beforeEach(() => {
      data = generateTestData();
      cy.defaultWorkspaceLogin();
      cy.skipWalkthrough();
    });

    it("should verify private and public app share functionality", () => {
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.dragAndDropWidget("text", 500, 500);

      cy.get(commonWidgetSelector.shareAppButton).should("be.visible").click();
      cy.contains("This version has not been released yet").should("be.visible");
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

      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should("be.visible");
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
      logout();
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should("be.visible");

      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      cy.wait(2000);
      cy.appUILogin(data.email, "password");
      verifyWidget("text1");

      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("text1");

      cy.defaultWorkspaceLogin();
      cy.apiMakeAppPublic();
      logout();
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should("be.visible");

      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("text1");

      cy.apiLogin(data.email, "password");
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("text1");
    });

    it("should verify app private and public app visibility for the same instance user", () => {
      setupAppWithSlug(data.appName, data.slug);

      cy.apiLogout();
      cy.ifEnv("Enterprise", () => {
        InstanceSSO(true, true, true);
      });
      userSignUp(data.firstName, data.email, data.workspaceName);
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });

      cy.visit("/");
      logout();

      cy.defaultWorkspaceLogin();
      cy.apiMakeAppPublic();
      logout();

      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should("be.visible");

      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("text1");

      cy.apiLogin(data.email, "password");
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("text1");
    });

    it.skip("should redirect to workspace login and handle signup flow of existing and non-existing user", () => {
      setSignupStatus(true);
      setupAppWithSlug(data.appName, data.slug);


      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      verifyWidget("text1");

      // cy.get(commonSelectors.workspaceName).verifyVisibleElement(
      //   "have.text",
      //   "My workspace"
      // );
      cy.apiLogout();
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      cy.intercept("POST", "/api/onboarding/signup").as("signup");
      cy.get(commonSelectors.createAnAccountLink).click();
      cy.wait(2000);
      cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
      cy.clearAndType('[data-cy="email-input"]', data.email);
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(commonSelectors.signUpButton).click();

      cy.wait("@signup").then((interception) => {
        expect(interception.response.statusCode).to.eq(201);
      });

      onboardUserFromAppLink(data.email, data.slug);
      verifyWidget("text1");
      cy.visit("/");
      logout();
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should("be.visible");

      cy.defaultWorkspaceLogin();
      cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
      cy.apiLogout();
      cy.apiLogin();
      cy.visit(`${data.workspaceSlug}`);
      setSignupStatus(true, data.workspaceName);

      data.slug = fake.firstName.toLowerCase().replace(/\s+/g, "-");
      cy.reload()
      cy.createApp(data.appName);

      cy.dragAndDropWidget("Text", 500, 500);
      releaseApp();
      setUpSlug(data.slug);
      cy.forceClickOnCanvas();
      cy.backToApps();

      cy.apiLogout();
      cy.visitSlug({ actualUrl: getAppUrl(data.slug) });
      cy.log("Visiting app URL: ", getAppUrl(data.slug));

      cy.get(commonSelectors.workspaceName).verifyVisibleElement(
        "have.text",
        data.workspaceName
      );

      cy.get(commonSelectors.createAnAccountLink).click();
      cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
      cy.clearAndType('[data-cy="email-input"]', data.email);
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(commonSelectors.signUpButton).click();
      cy.wait("@signup").then((interception) => {
        expect(interception.response.statusCode).to.eq(201);
      });

      onboardUserFromAppLink(data.email, data.slug, data.workspaceName, false);
      verifyWidget("text1");
    });

    it.only("should verify restricted app access", () => {
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
