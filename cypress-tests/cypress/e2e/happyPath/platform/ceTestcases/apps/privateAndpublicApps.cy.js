import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { logout, releaseApp } from "Support/utils/common";
import { inviteUserToWorkspace } from "Support/utils/manageUsers";
import { setSignupStatus } from "Support/utils/manageSSO";
import { onboardingSelectors } from "Selectors/onboarding";
import { commonText } from "Texts/common";
import {
  userSignUp,
  addNewUser,
} from "Support/utils/onboarding";
import {
  setUpSlug,
  setupAppWithSlug,
  verifyRestrictedAccess,
  onboardUserFromAppLink,
} from "Support/utils/apps";


describe("Private and Public apps", {
  retries: { runMode: 2 },
}, () => {
  let data;

  beforeEach(() => {
    data = {
      appName: `${fake.companyName} P P App`,
      slug: `${fake.companyName} P P App`.toLowerCase().replace(/\s+/g, "-"),
      firstName: fake.firstName,
      email: fake.email.toLowerCase(),
      workspaceName: fake.firstName,
      workspaceSlug: fake.firstName.toLowerCase().replace(/\s+/g, "-"),
    }

    cy.defaultWorkspaceLogin();
    cy.skipWalkthrough();
  });

  it("Verify private and public app share functionality", () => {
    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.apiAddComponentToApp(data.appName, "text1");

    // Check unreleased version state
    cy.get('[data-cy="share-button-link"]>span').should("be.visible").click();
    cy.contains("This version has not been released yet").should("be.visible");
    cy.get(commonWidgetSelector.modalCloseButton).click();

    // Release and verify share modal
    releaseApp();
    cy.get(commonWidgetSelector.shareAppButton).click();
    for (const elements in commonWidgetSelector.shareModalElements) {
      cy.get(commonWidgetSelector.shareModalElements[elements])
        .verifyVisibleElement("have.text", commonText.shareModalElements[elements]);
    }

    // Verify share modal elements
    const shareModalSelectors = [
      'copyAppLinkButton',
      'makePublicAppToggle',
      'appLink',
      'appNameSlugInput',
      'modalCloseButton'
    ];
    shareModalSelectors.forEach(selector => {
      cy.get(commonWidgetSelector[selector]).should("be.visible");
    });

    // Configure and verify slug
    cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
    cy.get('[data-cy="app-slug-accepted-label"]')
      .should("be.visible")
      .and("have.text", "Slug accepted!");

    cy.get(commonWidgetSelector.modalCloseButton).click();
    cy.forceClickOnCanvas();
    cy.backToApps();

    // Test private access
    logout();
    cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should("be.visible");

    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });
    cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should("be.visible");
    cy.wait(2000);
    cy.appUILogin();
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");


    // Test public access
    cy.get(commonSelectors.viewerPageLogo).click();
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
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");


  });

  it("Verify app private and public app visibility for the same workspace user", () => {
    setupAppWithSlug(data.appName, data.slug);

    inviteUserToWorkspace(data.firstName, data.email);
    logout();

    // Test private access
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });

    cy.wait(2000);
    cy.appUILogin(data.email, "password");

    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");

    // Test with private app valid session
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");


    cy.get(commonSelectors.viewerPageLogo).click();

    // Test public access
    cy.defaultWorkspaceLogin();
    cy.wait(1000);
    cy.apiMakeAppPublic();
    logout();

    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");



    // Test with public app with valid session
    cy.apiLogin(data.email, "password");
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");


  });

  it("Verify app private and public app visibility for the same instance user", () => {
    setupAppWithSlug(data.appName, data.slug);

    cy.apiLogout();
    userSignUp(data.firstName, data.email, data.workspaceName);
    cy.wait(1000);
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });

    cy.visit("/");
    logout();

    // Test public access
    cy.defaultWorkspaceLogin();
    cy.apiMakeAppPublic();
    logout();

    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");



    // Verify public app with valid session
    cy.apiLogin(data.email, "password");
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");


  });

  it("Should redirect to workspace login and handle signup flow of existing and non-existing user", () => {
    setSignupStatus(true);
    setupAppWithSlug(data.appName, data.slug);

    cy.apiLogout();
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });

    cy.get(commonSelectors.workspaceName).verifyVisibleElement(
      "have.text",
      "My workspace"
    );

    // Test signup flow
    cy.intercept("POST", "/api/onboarding/signup").as("signup");
    cy.get(commonSelectors.createAnAccountLink).click();
    cy.wait(3000);
    cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
    cy.clearAndType(commonSelectors.inputFieldEmailAddress, data.email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(commonSelectors.signUpButton).click();

    cy.wait('@signup').then((interception) => {
      expect(interception.response.statusCode).to.eq(201);
    });

    // Process invitation
    onboardUserFromAppLink(data.email, data.slug);

    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");


    cy.get('[data-cy="viewer-page-logo"]').click();
    logout();

    // Setup new workspace and app
    cy.defaultWorkspaceLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.apiLogout();
    cy.apiLogin();
    cy.visit(`${data.workspaceSlug}`);
    setSignupStatus(true, data.workspaceName);

    data.slug = fake.firstName.toLowerCase().replace(/\s+/g, "-");

    cy.createApp(data.appName);
    cy.dragAndDropWidget("Text", 500, 500);
    releaseApp();
    setUpSlug(data.slug);
    cy.forceClickOnCanvas();
    cy.backToApps();

    // Test signup flow in new workspace
    cy.apiLogout();
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });

    cy.get(commonSelectors.workspaceName).verifyVisibleElement(
      "have.text",
      data.workspaceName
    );

    cy.get(commonSelectors.createAnAccountLink).click();
    cy.wait(3000);
    cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
    cy.clearAndType(commonSelectors.inputFieldEmailAddress, data.email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(commonSelectors.signUpButton).click();
    cy.wait('@signup').then((interception) => {
      expect(interception.response.statusCode).to.eq(201);
    });

    onboardUserFromAppLink(data.email, data.slug, data.workspaceName, false);
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");


  });

  it("Should verify restricted app access", () => {
    data.workspaceName = fake.firstName;
    data.workspaceSlug = fake.firstName.toLowerCase().replace(/\s+/g, "-");

    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.apiLogout();
    cy.apiLogin();
    cy.visit(`${data.workspaceSlug}`);
    cy.apiDeleteGranularPermission("end-user");
    setSignupStatus(true, data.workspaceName);

    setupAppWithSlug(data.appName, data.slug);

    inviteUserToWorkspace(data.firstName, data.email);

    // Verify restricted access
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });
    verifyRestrictedAccess();
    cy.get('[data-cy="back-to-home-button"]').click();
    cy.get(commonSelectors.homePageLogo).should("be.visible");

    cy.apiLogout();
  });

  it.skip("Should verify private app access for different workspace users", () => {
    const firstName1 = fake.firstName;
    const email1 = fake.email.toLowerCase();
    const permissionName = fake.firstName.toLowerCase(); // Defined but not used in original
    const urls = {
      editor: `${Cypress.config("baseUrl")}/my-workspace/apps/${data.slug}/home`,
      preview: `${Cypress.config("baseUrl")}/applications/${data.slug}/home?version=v1`,
      released: `${Cypress.config("baseUrl")}/applications/${data.slug}`
    };

    // Setup workspace and app
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.apiLogout();
    cy.apiLogin();
    cy.visit(`${data.workspaceSlug}`);
    setupAppWithSlug(data.appName, data.slug);

    // Invite workspace user
    addNewUser(data.firstName, data.email);
    cy.wait(500);

    // Verify access restrictions
    cy.visitSlug({ actualUrl: urls.editor });
    verifyRestrictedAccess();
    cy.get('[data-cy="back-to-home-button"]').click();
    cy.get(commonSelectors.homePageLogo).should("be.visible");

    cy.visitSlug({ actualUrl: urls.preview });

    // Switch users and verify access
    cy.apiLogout();
    cy.apiLogin();
    cy.apiDeleteGranularPermission("end-user");

    cy.apiLogin(data.email, "password");
    cy.visitSlug({ actualUrl: urls.editor });
    verifyRestrictedAccess();
    cy.get('[data-cy="back-to-home-button"]').click();
    cy.get(commonSelectors.homePageLogo).should("be.visible");
    cy.visitSlug({ actualUrl: urls.preview });

    cy.apiLogout();

    // Test with new user
    userSignUp(firstName1, email1, data.workspaceName);
    cy.visitSlug({ actualUrl: urls.editor });
    cy.visitSlug({ actualUrl: urls.preview });
    cy.visitSlug({ actualUrl: urls.released });
  });
});