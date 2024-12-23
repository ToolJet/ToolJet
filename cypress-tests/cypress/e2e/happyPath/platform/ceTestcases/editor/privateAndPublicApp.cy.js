import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import {
  logout,
  navigateToAppEditor,
  verifyTooltip,
  releaseApp,
  navigateToManageGroups,
} from "Support/utils/common";
import { commonText } from "Texts/common";
import { userSignUp } from "Support/utils/onboarding";
import { setSignupStatus } from "Support/utils/manageSSO";
import { addAppToGroup } from "Support/utils/manageGroups";
import { ssoSelector } from "Selectors/manageSSO";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { onboardingSelectors } from "Selectors/onboarding";

describe(
  "App share functionality",
  {
    retries: {
      runMode: 2,
    },
  },
  () => {
    const data = {};
    beforeEach(() => {
      cy.defaultWorkspaceLogin();
      cy.skipWalkthrough();
    });

    it("Verify private and public app share funtionality", () => {
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.apiAddComponentToApp(data.appName, "text1");

      //Need to automate with the new flow

      // verifyTooltip(
      //   commonWidgetSelector.shareAppButton,
      //   "Share URL is unavailable until current version is released"
      // );

      // cy.get('[data-cy="share-button-link"]>span').should(
      //   "have.class",
      //   "share-disabled"
      // );
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
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );
      cy.visitSlug({
        actualUrl: `${Cypress.config('baseUrl')}/applications/${data.slug}`,
      });
      cy.wait(3000);

      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );

      cy.clearAndType(onboardingSelectors.loginEmailInput, "dev@tooljet.io");
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(onboardingSelectors.signInButton).click();

      cy.wait(500);
      cy.get(".text-widget-section > div").should("be.visible");
      cy.get(commonSelectors.viewerPageLogo).click();

      cy.openApp(
        "my-workspace",
        Cypress.env("appId"),
        ".text-widget-section > div"
      );
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).check();
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      logout();
      cy.wait(4000);
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );
      cy.visitSlug({
        actualUrl: `${Cypress.config('baseUrl')}/applications/${data.slug}`,
      });
      cy.wait(3000);
      cy.get(".text-widget-section > div").should("be.visible");
    });

    it("Verify app private and public app visibility for the same workspace user", () => {
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.apiAddComponentToApp(data.appName, "text1");
      releaseApp();

      cy.wait(1000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).check();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(2000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });
      cy.get(".text-widget-section > div").should("be.visible");

      cy.defaultWorkspaceLogin();
      cy.openApp(
        "my-workspace",
        Cypress.env("appId"),
        ".text-widget-section > div"
      );
      cy.wait(2000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).uncheck();
      cy.wait(500);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      logout();
      cy.wait(4000);
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );

      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });

      cy.appUILogin("test@tooljet.com", "password");
      cy.get(commonSelectors.allApplicationLink).verifyVisibleElement(
        "have.text",
        commonText.allApplicationLink
      );
    });

    //Fix the case after bug fix
    it.skip("Verify app private and public app visibility for the same instance user", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase();
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
      data.workspaceName = data.email;

      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.apiAddComponentToApp(data.appName, "text1");

      releaseApp();

      cy.wait(1000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(2000);
      cy.get(commonWidgetSelector.modalCloseButton).click();

      cy.logoutApi();
      userSignUp(data.firstName, data.email, data.workspaceName);
      cy.wait(3000);
      cy.backToApps();
      cy.wait(1000);

      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });
      cy.wait(1000);
      cy.pause();

      // logout();

      cy.clearAndType(onboardingSelectors.loginEmailInput, data.email);
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(onboardingSelectors.signInButton).click();
      cy.pause();
      cy.wait(1000);
      cy.get(ssoSelector.workspaceSubHeader).verifyVisibleElement(
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
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );
      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });
      cy.get(".text-widget-section > div").should("be.visible");
      cy.get(commonSelectors.viewerPageLogo).click();
    });

    //Need to update with the new permission flow
    it.skip("hould redirect to the workspace login page, allow signup, proceed to accept invite page, and load the app", () => {
      let invitationToken,
        organizationToken,
        workspaceId,
        userId,
        url = "";

      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase();
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
      data.workspaceName = data.email;

      setSignupStatus(true);
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.apiAddComponentToApp(data.appName, "text1");

      releaseApp();

      cy.wait(1000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(2000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();
      navigateToManageGroups();
      addAppToGroup(data.appName);

      cy.logoutApi();
      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });

      cy.get(ssoSelector.workspaceSubHeader).verifyVisibleElement(
        "have.text",
        "Sign in to your workspace - My workspace"
      );

      cy.get(commonSelectors.createAnAccountLink).click();

      cy.clearAndType(commonSelectors.nameInputField, data.firstName);
      cy.clearAndType(onboardingSelectors.loginEmailInput, data.email);
      cy.clearAndType(onboardingSelectors.loginPasswordInput, commonText.password);
      cy.get(commonSelectors.signUpButton).click();

      cy.apiLogin();
      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select invitation_token from users where email='${data.email}';`,
      }).then((resp) => {
        invitationToken = resp.rows[0].invitation_token;

        cy.task("updateId", {
          dbconfig: Cypress.env("app_db"),
          sql: "select id from organizations where name='My workspace';",
        }).then((resp) => {
          workspaceId = resp.rows[0].id;

          cy.task("updateId", {
            dbconfig: Cypress.env("app_db"),
            sql: `select id from users where email='${data.email}';`,
          }).then((resp) => {
            userId = resp.rows[0].id;

            cy.task("updateId", {
              dbconfig: Cypress.env("app_db"),
              sql: `select invitation_token from organization_users where user_id='${userId}';`,
            }).then((resp) => {
              organizationToken = resp.rows[1].invitation_token;

              url = `/invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}&redirectTo=%2Fapplications%2F${data.slug}`;
              cy.logoutApi();
              cy.wait(1000);
              cy.visit(url);
            });
          });
        });
      });

      cy.get(".text-widget-section > div").should("be.visible");
    });
  }
);
