import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import {
  logout,
  navigateToAppEditor,
  verifyTooltip,
  releaseApp,
} from "Support/utils/common";
import { commonText } from "Texts/common";
import { userSignUp } from "Support/utils/onboarding";

describe(
  "App share functionality",
  {
    retries: {
      runMode: 2,
      openMode: 1,
    },
  },
  () => {
    const data = {};
    beforeEach(() => {
      cy.defaultWorkspaceLogin();
      cy.removeAssignedApps();
      cy.skipWalkthrough();
    });

    it("Verify private and public app share funtionality", () => {
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.dragAndDropWidget("Table", 250, 250);

      verifyTooltip(
        commonWidgetSelector.shareAppButton,
        "Share URL is unavailable until current version is released"
      );
      cy.get('[data-cy="share-button-link"]>span').should(
        "have.class",
        "share-disabled"
      );
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
      cy.get(commonWidgetSelector.copyAppLinkButton).should("be.visible");
      cy.get(commonWidgetSelector.makePublicAppToggle).should("be.visible");
      cy.get(commonWidgetSelector.appLink).should("be.visible");
      cy.get(commonWidgetSelector.appNameSlugInput).should("be.visible");
      // cy.get(commonWidgetSelector.iframeLink).should("be.visible");
      cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(4000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.forceClickOnCanvas();
      cy.backToApps();

      logout();
      cy.wait(4000);
      cy.get(commonSelectors.loginButton, { timeout: 20000 }).should(
        "be.visible"
      );
      cy.visitSlug({
        actualUrl: `http://localhost:8082/applications/${data.slug}`,
      });
      cy.wait(3000);

      cy.get(commonSelectors.loginButton, { timeout: 20000 }).should(
        "be.visible"
      );

      cy.clearAndType(commonSelectors.workEmailInputField, "dev@tooljet.io");
      cy.clearAndType(commonSelectors.passwordInputField, "password");
      cy.get(commonSelectors.loginButton).click();

      cy.wait(500);
      cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
      cy.get(commonSelectors.viewerPageLogo).click();

      cy.openApp(
        "my-workspace",
        Cypress.env("appId"),
        '[data-cy="draggable-widget-table1"]'
      );
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).check();
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      logout();
      cy.wait(4000);
      cy.get(commonSelectors.loginButton, { timeout: 20000 }).should(
        "be.visible"
      );
      cy.visitSlug({
        actualUrl: `http://localhost:8082/applications/${data.slug}`,
      });
      cy.wait(3000);
      cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
    });

    it("Verify app private and public app visibility for the same workspace user", () => {
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.dragAndDropWidget("Table", 250, 250);
      releaseApp();

      cy.wait(1000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).check();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(2000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });
      cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");

      cy.defaultWorkspaceLogin();
      cy.openApp(
        "my-workspace",
        Cypress.env("appId"),
        '[data-cy="draggable-widget-table1"]'
      );
      cy.wait(2000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).uncheck();
      cy.wait(500);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      logout();
      cy.wait(4000);
      cy.get(commonSelectors.loginButton, { timeout: 20000 }).should(
        "be.visible"
      );

      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });

      cy.login("test@tooljet.com", "password");
      cy.get(commonSelectors.allApplicationLink).verifyVisibleElement(
        "have.text",
        commonText.allApplicationLink
      );
    });

    it("Verify app private and public app visibility for the same instance user", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase();
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
      data.workspaceName = data.email;

      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.dragAndDropWidget("Table", 250, 250);
      releaseApp();

      cy.wait(1000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(2000);
      cy.get(commonWidgetSelector.modalCloseButton).click();

      cy.logoutApi();
      userSignUp(data.firstName, data.email, data.workspaceName);
      cy.wait(3000);

      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });
      cy.wait(1000);

      cy.clearAndType(commonSelectors.workEmailInputField, data.email);
      cy.clearAndType(commonSelectors.passwordInputField, "password");
      cy.get(commonSelectors.signInButton).click();
      cy.wait(1000);
      cy.get(`[data-cy="workspace-sign-in-sub-header"]`).verifyVisibleElement(
        "have.text",
        "Sign in to your workspace - My workspace"
      );

      cy.visit("/");
      cy.wait(2000);
      logout();
      cy.defaultWorkspaceLogin();
      navigateToAppEditor(data.appName);
      cy.wait(2000);
      // cy.skipEditorPopover();
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).check();
      cy.wait(2000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      logout();
      cy.wait(4000);
      cy.get(commonSelectors.loginButton, { timeout: 20000 }).should(
        "be.visible"
      );
      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });
      cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
      cy.get(commonSelectors.viewerPageLogo).click();
    });
  }
);
