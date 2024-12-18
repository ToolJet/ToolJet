import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import {
  logout,
  navigateToAppEditor,
  verifyTooltip,
  releaseApp,
  navigateToManageGroups,
  deleteAllGroupChips,
} from "Support/utils/common";
import { commonText } from "Texts/common";
import { userSignUp } from "Support/utils/onboarding";
import { setSignupStatus } from "Support/utils/manageSSO";
import { addAppToGroup } from "Support/utils/manageGroups";
import { ssoSelector } from "Selectors/manageSSO";
import {
  fetchAndVisitInviteLink,
  verifyConfirmEmailPage,
  visitWorkspaceInvitation,
} from "Support/utils/onboarding";

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
    let invitationLink = "";
    beforeEach(() => {
      cy.defaultWorkspaceLogin();
      cy.skipWalkthrough();
    });
    it("Verify private and public app share funtionality", () => {
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.addComponentToApp(data.appName, "text1");

      cy.get('[data-cy="share-button-link"]>span').should("be.visible").click();
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
      cy.get(commonWidgetSelector.copyAppLinkButton).should("be.visible");
      cy.get(commonWidgetSelector.makePublicAppToggle).should("be.visible");
      cy.get(commonWidgetSelector.appLink).should("be.visible");
      cy.get(commonWidgetSelector.appNameSlugInput).should("be.visible");
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
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
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
        Cypress.env("appId") ///

        // ".text-widget-section > div"
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
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
      });
      cy.wait(3000);
      cy.get(".text-widget-section > div").should("be.visible");
    });

    it("Verify app private and public app visibility for the same workspace user", () => {
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.addComponentToApp(data.appName, "text1");

      cy.get('[data-cy="share-button-link"]>span').should("be.visible").click();
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
      cy.get(commonWidgetSelector.copyAppLinkButton).should("be.visible");
      cy.get(commonWidgetSelector.makePublicAppToggle).should("be.visible");
      cy.get(commonWidgetSelector.appLink).should("be.visible");
      cy.get(commonWidgetSelector.appNameSlugInput).should("be.visible");
      cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(4000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.forceClickOnCanvas();
      cy.backToApps();
      cy.wait(4000);
      logout();
      cy.wait(5000);
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );
      cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
      });
      cy.wait(3000);

      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );

      cy.clearAndType(onboardingSelectors.loginEmailInput, "test@tooljet.com");
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(onboardingSelectors.signInButton).click();
      cy.wait(500);
      cy.get(".text-widget-section > div").should("be.visible");
      cy.get(commonSelectors.viewerPageLogo).click();

      cy.defaultWorkspaceLogin();
      cy.wait(8000);
      cy.openApp(data.appName);

      // ".text-widget-section > div"
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
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
      });
      cy.wait(3000);
      cy.get(".text-widget-section > div").should("be.visible");
    });

    it("Verify app private and public app visibility for the same instance user", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase();
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
      data.workspaceName = data.email;

      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.addComponentToApp(data.appName, "text1");

      releaseApp();

      cy.wait(1000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(2000);
      cy.get(commonWidgetSelector.modalCloseButton).click();

      cy.backToApps();
      cy.wait(1000);

      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });
      cy.get('[data-cy="viewer-page-logo"]').click();
      cy.logoutApi();
      cy.wait(2000);
      userSignUp(data.firstName, data.email, data.workspaceName);
      cy.wait(1000);
      cy.visit("/");
      cy.wait(2000);
      logout();
      cy.defaultWorkspaceLogin();
      navigateToAppEditor(data.appName);
      cy.wait(2000);
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

    it("Should redirect to the workspace login page, allow signup, proceed to accept invite page, and load the app", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase();
      data.password = fake.password.toLowerCase();
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
      data.workspaceName = data.email;
      let invitationToken = "";
      let organizationToken = "";
      let workspaceId = "";
      let userId = "";
      let url = "";

      setSignupStatus(true);
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.addComponentToApp(data.appName, "text1");

      releaseApp();

      cy.wait(1000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(2000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();
      cy.logoutApi();
      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });

      cy.get(commonSelectors.createAnAccountLink).click();
      cy.wait(4000);
      cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
      cy.clearAndType(commonSelectors.inputFieldEmailAddress, data.email);
      cy.clearAndType(onboardingSelectors.loginPasswordInput, data.password);
      cy.get(commonSelectors.signUpButton).click();
      verifyConfirmEmailPage(data.email);

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
              url = `http://localhost:8082/invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}&redirectTo=%2Fapplications%2F${data.slug}`;
              cy.logoutApi();
              cy.wait(1000);
              cy.visit(url);
            });
          });
        });
      });
    });

    it("Should verify restricted app access", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase();
      data.password = fake.password.toLowerCase();
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
      data.workspaceName = data.email;

      setSignupStatus(true);
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.addComponentToApp(data.appName, "text1");

      releaseApp();

      cy.wait(1000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(2000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();
      navigateToManageGroups();
      cy.get('[data-cy="builder-list-item"]').click();
      cy.get('[data-cy="granular-access-link"]').click();
      cy.reload();
      cy.get('[data-cy="builder-list-item"]').click();
      cy.get('[data-cy="granular-access-link"]').click();
      deleteAllGroupChips();
      cy.logoutApi();
     
      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });
      cy.wait(3000);
      cy.clearAndType(onboardingSelectors.loginEmailInput, "test@tooljet.com");
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(onboardingSelectors.signInButton).click();
      cy.wait(1000);
      cy.get('[data-cy="modal-header"]').should('have.text', 'Restricted access');
      cy.get('[data-cy="modal-description"]').should('have.text', "You don’t have access to this app. Kindly contact admin to know more.");

    });
    it.only("Should verify private app acees for existing workspace user", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase();
      data.password = fake.password.toLowerCase();
      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
      data.workspaceName = data.firstName;
      data.workspaceSlug = data.firstName.toLowerCase()
      .replaceAll("[^A-Za-z]", "");
      let invitationToken = "";
      let organizationToken = "";
      let workspaceId = "";
      let userId = "";
      let url = "";
      cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
      cy.visit(`${data.workspaceSlug}`);
      cy.wait(2000);
      
      setSignupStatus(true);
      cy.pause();
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.addComponentToApp(data.appName, "text1");

      releaseApp();

      cy.wait(1000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.wait(2000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();
      cy.pause();
      cy.logoutApi();
      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });
      cy.get(commonSelectors.createAnAccountLink).click();
      cy.wait(4000);
      cy.clearAndType(commonSelectors.inputFieldFullName, "test@tooljet.com");
      cy.clearAndType(commonSelectors.inputFieldEmailAddress, "test@tooljet.com");
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "test@tooljet.com");
      cy.get(commonSelectors.signUpButton).click();
      verifyConfirmEmailPage(data.email);

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
              url = `http://localhost:8082/invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}&redirectTo=%2Fapplications%2F${data.slug}`;
              cy.logoutApi();
              cy.wait(1000);
              cy.visit(url);
              cy.get(".text-widget-section > div").should("be.visible");
            });
          });
        });
      });
    });
    });

      
