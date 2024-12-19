import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { logout, releaseApp,} from "Support/utils/common";
import { commonText } from "Texts/common";

///version
import { appVersionSelectors } from "Selectors/exportImport";
import { editVersionSelectors } from "Selectors/version";
import {
  editVersionText,
  releasedVersionText,
  deleteVersionText,
  onlydeleteVersionText,
} from "Texts/version";
import { createNewVersion } from "Support/utils/exportImport";
import {
  navigateToCreateNewVersionModal,
  verifyElementsOfCreateNewVersionModal,
  navigateToEditVersionModal,
  editVersionAndVerify,
  deleteVersionAndVerify,
  releasedVersionAndVerify,
  verifyDuplicateVersion,
  verifyVersionAfterPreview,
} from "Support/utils/version";
import {
  verifyModal,
  closeModal,
  navigateToAppEditor,
} from "Support/utils/common";
import {
  verifyComponent,
  deleteComponentAndVerify,
} from "Support/utils/basicComponents";

describe("App Editor", () => {
  const data = {};
  data.appName = `${fake.companyName} App`;
  data.slug = `${fake.companyName.toLowerCase()}-app`;
  const workspaceId = Cypress.env("workspaceId");
  let currentVersion = "";
  let newVersion = [];
  let versionFrom = "";
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
  });
  before(() => {
    cy.apiLogin();
    cy.apiCreateApp(data.appName);
    cy.wait(1000);
    cy.logoutApi();
  });

  it("Verify app slug cases in global settings", () => {
    cy.wait(2000);
    cy.apiLogin("dev@tooljet.io", "password").then(() => {
      const workspaceId = Cypress.env("workspaceId");
      cy.log(workspaceId);
      const appId = Cypress.env("appId");
      cy.log(appId);
      cy.openApp("my-workspace");

      cy.get(commonSelectors.leftSideBarSettingsButton).click();
      cy.get(commonWidgetSelector.appSlugLabel).verifyVisibleElement(
        "have.text",
        "Unique app slug"
      );
      cy.get(commonWidgetSelector.appSlugInput).verifyVisibleElement(
        "have.value",
        Cypress.env("appId")
      );
      cy.get(commonWidgetSelector.appSlugInfoLabel).verifyVisibleElement(
        "have.text",
        "URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens"
      );
      cy.get(commonWidgetSelector.appLinkLabel).verifyVisibleElement(
        "have.text",
        "App link"
      );
      cy.get(commonWidgetSelector.appLinkField).verifyVisibleElement(
        "have.text",
        `${Cypress.config("baseUrl")}/${workspaceId}/apps/${appId}`
      );
      cy.wait(500);
      cy.get(commonWidgetSelector.appSlugInput).clear();
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "App slug can't be empty"
      );
      cy.clearAndType(commonWidgetSelector.appSlugInput, "_2#");
      cy.wait(500);
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "Special characters are not accepted."
      );

      cy.clearAndType(commonWidgetSelector.appSlugInput, "t ");
      cy.wait(500);
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "Cannot contain spaces"
      );

      cy.clearAndType(commonWidgetSelector.appSlugInput, "T");
      cy.wait(500);
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "Only lowercase letters are accepted."
      );

      cy.get(commonWidgetSelector.appSlugInput).clear();
      cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
      cy.wait(500);
      cy.get('[data-cy="app-slug-accepted-label"]').verifyVisibleElement(
        "have.text",
        "Slug accepted!"
      );
   
      cy.get(commonWidgetSelector.appLinkSucessLabel).verifyVisibleElement(
        "have.text",
        "Link updated successfully!"
      );
      
      cy.get(commonWidgetSelector.appSlugInput).clear();
      cy.get('[data-cy="left-sidebar-debugger-button"]').click();
      cy.get(commonSelectors.leftSideBarSettingsButton).click();
      cy.get(commonWidgetSelector.appSlugInput).should("have.value", data.slug);

      cy.get(commonWidgetSelector.appLinkField).verifyVisibleElement(
        "have.text",
        `${Cypress.config("baseUrl")}/${workspaceId}/apps/${data.slug}`
      );
      cy.url().should(
        "eq",
        `${Cypress.config("baseUrl")}/${workspaceId}/apps/${data.slug}`
      );

      releaseApp();

      cy.openInCurrentTab(commonWidgetSelector.previewButton);
      cy.wait(2000);
      cy.url().should(
        "eq",
        `${Cypress.config("baseUrl")}/applications/${data.slug}/home?version=v1`
      );
      cy.visit("/my-workspace");
      cy.wait(500);

      cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
      });
      cy.url().should(
        "eq",
        `${Cypress.config("baseUrl")}/applications/${data.slug}`
      );
      cy.visit("/my-workspace");
      cy.wait(500);

      cy.apiCreateApp(data.slug);
      cy.openApp("my-workspace");

      cy.get(commonSelectors.leftSideBarSettingsButton).click();
      cy.get(commonWidgetSelector.appSlugInput).clear();
      cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
      cy.wait(500);
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "This app slug is already taken."
      );
    });
  });
  it("Verify app slug cases in share modal", () => {
    data.slug = `${fake.companyName.toLowerCase()}-app`;
    data.appName = `${fake.companyName} App`;
    cy.apiLogin("dev@tooljet.io", "password").then(() => {
      const workspaceId = Cypress.env("workspaceId");
      cy.apiCreateApp(data.appName);
      cy.openApp("my-workspace");

      cy.get(commonSelectors.leftSideBarSettingsButton).click();
      cy.get(commonWidgetSelector.appSlugInput).clear();
      cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);

      releaseApp();

      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.appNameSlugInput).should(
        "have.value",
        data.slug
      );

      cy.get(commonWidgetSelector.appNameSlugInput).clear();
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "App slug can't be empty"
      );

      cy.clearAndType(commonWidgetSelector.appNameSlugInput, "_2#");
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "Special characters are not accepted."
      );

      cy.clearAndType(commonWidgetSelector.appNameSlugInput, "t ");
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "Cannot contain spaces"
      );

      cy.clearAndType(commonWidgetSelector.appNameSlugInput, "T");
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "Only lowercase letters are accepted."
      );

      data.slug = `${fake.companyName.toLowerCase()}-app`;
      cy.get(commonWidgetSelector.appNameSlugInput).clear();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "Slug accepted!"
      );
      cy.get(1000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.url().should(
        "eq",
        `${Cypress.config("baseUrl")}/${workspaceId}/apps/${data.slug}/home`
      );
      cy.openInCurrentTab(commonWidgetSelector.previewButton);
      cy.wait(1000);
      cy.url().should(
        "eq",
        `${Cypress.config("baseUrl")}/applications/${data.slug}/home?version=v1`
      );
      cy.visit("/my-workspace");
      cy.wait(500);

      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });
      cy.url().should(
        "eq",
        `${Cypress.config("baseUrl")}/applications/${data.slug}`
      );
      cy.visit("/my-workspace");
      cy.wait(500);

      cy.apiCreateApp(data.slug);
      cy.openApp("my-workspace");
      releaseApp();
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "This app slug is already taken."
      );
    });
  });
  it("Verify all functionality for the app version", () => {
    data.appName = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName);
    cy.openApp();
    deleteVersionAndVerify(
      "v1", 
      onlydeleteVersionText.deleteToastMessage("v1")
    );
    cy.wait(5000);
    cy.get('[data-cy="widget-list-box-table"]').should("be.visible");
    navigateToCreateNewVersionModal((currentVersion = "v1"));
    cy.get('[data-cy="create-new-version-button"]').click();
    cy.get(commonSelectors.toastMessage).verifyVisibleElement(
      "have.text",
      "Version name should not be empty"
    );
    cy.get('[data-cy="modal-close-button"]').click();
    verifyComponent("text");
    navigateToCreateNewVersionModal((currentVersion = "v1"));
    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));
    verifyComponent("table");
    cy.dragAndDropWidget("table");
    cy.wait(2000);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });
    cy.wait(4000);
    deleteComponentAndVerify("table");
    cy.dragAndDropWidget("table");
    cy.wait(2000);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });
    cy.wait(4000);
    navigateToCreateNewVersionModal((currentVersion = "v2"));
    createNewVersion((newVersion = ["v3"]), (versionFrom = "v2"));
    verifyComponent("table");
    navigateToCreateNewVersionModal((currentVersion = "v3"));
    createNewVersion((newVersion = ["v4"]), (versionFrom = "v1"));
    verifyComponent("table");

    editVersionAndVerify(
      (currentVersion = "v4"),
      (newVersion = ["v5"]),
      editVersionText.VersionNameUpdatedToastMessage
    );
    navigateToCreateNewVersionModal((currentVersion = "v5"));
    verifyDuplicateVersion((newVersion = ["v5"]), (versionFrom = "v5"));
    closeModal(commonText.closeButton);
    deleteVersionAndVerify(
      (currentVersion = "v5"),
      deleteVersionText.deleteToastMessage((currentVersion = "v5"))
    );

    cy.reload();
    releasedVersionAndVerify((currentVersion = "v3"));
    navigateToCreateNewVersionModal((currentVersion = "v3"));
    createNewVersion((newVersion = ["v6"]), (versionFrom = "v3"));

    verifyVersionAfterPreview((currentVersion = "v6"));
  });
  it("Verify all functionality for the app release", () => {
    data.appName = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "have.value",
      data.appName
    );
    cy.waitForAutoSave();
    verifyComponent("table");
    cy.dragAndDropWidget("table");
    cy.wait(2000);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });
    cy.wait(4000);
    releaseApp();
    cy.get('[data-cy="delete-button"]').should("not.exist");
    cy.get('[data-cy="warning-text"]').should('contain', 'App cannot be edited after promotion. Please create a new version from Development to make any changes.');
    navigateToCreateNewVersionModal((currentVersion = "v1"));
    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"))
    verifyComponent("table");
    cy.dragAndDropWidget("table");
    cy.wait(2000);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });
    cy.wait(4000);
    cy.get('[data-cy="button-release"]').click();
    cy.get('[data-cy="yes-button"]').click();
    cy.get('[data-cy="warning-text"]').should('contain', 'App cannot be edited after promotion. Please create a new version from Development to make any changes.');

  });
  it("Create app from template Apps", () => {
    data.slug = `${fake.companyName.toLowerCase()}-app`;
    data.appName = `${fake.companyName} App`;
    cy.apiLogin("dev@tooljet.io", "password").then(() => {
      const workspaceId = Cypress.env("workspaceId");
      cy.get('[data-cy="import-dropdown-menu"]').click();
      cy.get('[data-cy="choose-from-template-button"]').click();
      cy.get('[data-cy="create-application-from-template-button"]').click();
      cy.get('[data-cy="app-name-label"]').should("have.text", "App Name");
      cy.get('[data-cy="app-name-input"]').clear().type(data.appName)
      cy.get('[data-cy="+-create-app"]').click();
      cy.wait(3000);
      cy.contains("ToolJet admin panel");
    });
  });
});
