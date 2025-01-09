import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { logout, releaseApp } from "Support/utils/common";

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
    cy.apiLogin("dev@tooljet.io", "password").then(() => {
      const workspaceId = Cypress.env("workspaceId");
      const appId = Cypress.env("appId");
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
      cy.wait(500);
      cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
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
      cy.url().should(
        "eq",
        `${Cypress.config("baseUrl")}/applications/${data.slug}/home?version=v1`
      );

      cy.visit("/my-workspace");

      cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
      });

      cy.url().should(
        "eq",
        `${Cypress.config("baseUrl")}/applications/${data.slug}`
      );

      cy.visit("/my-workspace");

      cy.apiCreateApp(data.slug);
      cy.openApp("my-workspace");

      cy.get(commonSelectors.leftSideBarSettingsButton).click();
      cy.get(commonWidgetSelector.appSlugInput).clear();

      cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
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

      cy.get(500);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.url().should(
        "eq",
        `${Cypress.config("baseUrl")}/${workspaceId}/apps/${data.slug}/home`
      );

      cy.openInCurrentTab(commonWidgetSelector.previewButton);
      cy.wait(500);

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

  it("Create app from template Apps", () => {
    data.slug = `${fake.companyName.toLowerCase()}-app`;
    data.appName = `${fake.companyName} App`;

    cy.apiLogin("dev@tooljet.io", "password").then(() => {
      const workspaceId = Cypress.env("workspaceId");

      cy.createAppFromTemplate("advanced-data-visualization");
      cy.get('[data-cy="app-name-input"]').clear().type(data.appName);
      cy.wait(500);

      cy.get('[data-cy="+-create-app"]').click();
      cy.wait(2000);
      cy.skipWalkthrough();
      cy.wait(500);
      cy.contains("Advanced data visualization");
    });
  });

});
